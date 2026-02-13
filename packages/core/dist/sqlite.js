/**
 * Shared SQLite State Management
 *
 * Consolidates scattered JSON files and in-memory state into a single
 * SQLite database with FTS5 for entity search.
 *
 * Target performance:
 * - Startup <100ms for 10k note vault
 * - Entity search <10ms
 * - Single .flywheel/state.db for backup
 */
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
// =============================================================================
// Constants
// =============================================================================
/** Current schema version - bump when schema changes */
export const SCHEMA_VERSION = 1;
/** State database filename */
export const STATE_DB_FILENAME = 'state.db';
/** Directory for flywheel state */
export const FLYWHEEL_DIR = '.flywheel';
// =============================================================================
// Schema
// =============================================================================
const SCHEMA_SQL = `
-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);

-- Metadata key-value store
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Notes metadata
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_hash TEXT,
  modified_at INTEGER NOT NULL,
  aliases_json TEXT,
  tags_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_notes_path ON notes(path);

-- Entity index (replaces wikilink-entities.json)
CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL,
  path TEXT NOT NULL,
  category TEXT NOT NULL,
  aliases_json TEXT,
  hub_score INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_entities_name_lower ON entities(name_lower);
CREATE INDEX IF NOT EXISTS idx_entities_category ON entities(category);

-- FTS5 for entity search with porter stemmer
CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
  name, aliases, category,
  content='entities', content_rowid='id',
  tokenize='porter unicode61'
);

-- Auto-sync triggers for entities_fts
CREATE TRIGGER IF NOT EXISTS entities_ai AFTER INSERT ON entities BEGIN
  INSERT INTO entities_fts(rowid, name, aliases, category)
  VALUES (
    new.id,
    new.name,
    COALESCE((SELECT group_concat(value, ' ') FROM json_each(new.aliases_json)), ''),
    new.category
  );
END;

CREATE TRIGGER IF NOT EXISTS entities_ad AFTER DELETE ON entities BEGIN
  INSERT INTO entities_fts(entities_fts, rowid, name, aliases, category)
  VALUES (
    'delete',
    old.id,
    old.name,
    COALESCE((SELECT group_concat(value, ' ') FROM json_each(old.aliases_json)), ''),
    old.category
  );
END;

CREATE TRIGGER IF NOT EXISTS entities_au AFTER UPDATE ON entities BEGIN
  INSERT INTO entities_fts(entities_fts, rowid, name, aliases, category)
  VALUES (
    'delete',
    old.id,
    old.name,
    COALESCE((SELECT group_concat(value, ' ') FROM json_each(old.aliases_json)), ''),
    old.category
  );
  INSERT INTO entities_fts(rowid, name, aliases, category)
  VALUES (
    new.id,
    new.name,
    COALESCE((SELECT group_concat(value, ' ') FROM json_each(new.aliases_json)), ''),
    new.category
  );
END;

-- Links table (replaces in-memory backlinks)
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  source_path TEXT NOT NULL,
  target TEXT NOT NULL,
  target_path TEXT,
  line_number INTEGER
);
CREATE INDEX IF NOT EXISTS idx_links_source_path ON links(source_path);
CREATE INDEX IF NOT EXISTS idx_links_target_path ON links(target_path);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target);

-- Recency tracking (replaces entity-recency.json)
CREATE TABLE IF NOT EXISTS recency (
  entity_name_lower TEXT PRIMARY KEY,
  last_mentioned_at INTEGER NOT NULL,
  mention_count INTEGER DEFAULT 1
);

-- Crank state (replaces last-crank-commit.json and other crank state)
CREATE TABLE IF NOT EXISTS crank_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Content search FTS5 (migrated from vault-search.db)
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  path, title, content,
  tokenize='porter'
);

-- Vault index cache (for fast startup)
-- Stores serialized VaultIndex to avoid full rebuild on startup
CREATE TABLE IF NOT EXISTS vault_index_cache (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data BLOB NOT NULL,
  built_at INTEGER NOT NULL,
  note_count INTEGER NOT NULL,
  version INTEGER DEFAULT 1
);

-- Flywheel configuration (replaces .flywheel.json)
CREATE TABLE IF NOT EXISTS flywheel_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
`;
// =============================================================================
// Database Initialization
// =============================================================================
/**
 * Get the database path for a vault
 */
export function getStateDbPath(vaultPath) {
    const flywheelDir = path.join(vaultPath, FLYWHEEL_DIR);
    if (!fs.existsSync(flywheelDir)) {
        fs.mkdirSync(flywheelDir, { recursive: true });
    }
    return path.join(flywheelDir, STATE_DB_FILENAME);
}
/**
 * Initialize schema and run migrations
 */
function initSchema(db) {
    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    // Run schema creation
    db.exec(SCHEMA_SQL);
    // Guard: Verify critical tables were created
    // This catches cases where schema execution silently failed (e.g., corrupted db)
    const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name IN ('entities', 'notes', 'schema_version', 'metadata')
  `).all();
    if (tables.length < 4) {
        const foundTables = tables.map(t => t.name).join(', ') || 'none';
        throw new Error(`[vault-core] Schema validation failed: expected 4 critical tables, found ${tables.length} (${foundTables}). ` +
            `Database may be corrupted. Delete ${db.name} and restart.`);
    }
    // Check and record schema version
    const versionRow = db.prepare('SELECT MAX(version) as version FROM schema_version').get();
    const currentVersion = versionRow?.version ?? 0;
    if (currentVersion < SCHEMA_VERSION) {
        // Run migrations here when we add new schema versions
        // For now, just record the current version
        db.prepare('INSERT OR IGNORE INTO schema_version (version) VALUES (?)').run(SCHEMA_VERSION);
    }
}
/**
 * Open or create the state database for a vault
 *
 * @param vaultPath - Absolute path to the vault root
 * @returns StateDb instance with prepared statements
 */
export function openStateDb(vaultPath) {
    const dbPath = getStateDbPath(vaultPath);
    // Guard: Delete corrupted 0-byte database files
    // This can happen when better-sqlite3 fails to compile (e.g., Node 24)
    // and creates an empty file instead of a valid SQLite database
    if (fs.existsSync(dbPath)) {
        const stat = fs.statSync(dbPath);
        if (stat.size === 0) {
            console.error(`[vault-core] Deleting corrupted 0-byte state.db at ${dbPath}`);
            fs.unlinkSync(dbPath);
            // Also remove WAL and SHM files if they exist
            const walPath = dbPath + '-wal';
            const shmPath = dbPath + '-shm';
            if (fs.existsSync(walPath))
                fs.unlinkSync(walPath);
            if (fs.existsSync(shmPath))
                fs.unlinkSync(shmPath);
        }
    }
    const db = new Database(dbPath);
    // Initialize schema
    initSchema(db);
    // Prepare all statements
    const stateDb = {
        db,
        vaultPath,
        dbPath,
        // Entity operations
        insertEntity: db.prepare(`
      INSERT INTO entities (name, name_lower, path, category, aliases_json, hub_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
        updateEntity: db.prepare(`
      UPDATE entities
      SET name = ?, name_lower = ?, path = ?, category = ?, aliases_json = ?, hub_score = ?
      WHERE id = ?
    `),
        deleteEntity: db.prepare('DELETE FROM entities WHERE id = ?'),
        getEntityByName: db.prepare(`
      SELECT id, name, name_lower, path, category, aliases_json, hub_score
      FROM entities WHERE name_lower = ?
    `),
        getEntityById: db.prepare(`
      SELECT id, name, name_lower, path, category, aliases_json, hub_score
      FROM entities WHERE id = ?
    `),
        getAllEntities: db.prepare(`
      SELECT id, name, name_lower, path, category, aliases_json, hub_score
      FROM entities ORDER BY name
    `),
        getEntitiesByCategory: db.prepare(`
      SELECT id, name, name_lower, path, category, aliases_json, hub_score
      FROM entities WHERE category = ? ORDER BY name
    `),
        searchEntitiesFts: db.prepare(`
      SELECT e.id, e.name, e.name_lower, e.path, e.category, e.aliases_json, e.hub_score,
             bm25(entities_fts) as rank
      FROM entities_fts
      JOIN entities e ON e.id = entities_fts.rowid
      WHERE entities_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `),
        clearEntities: db.prepare('DELETE FROM entities'),
        // Link operations
        insertLink: db.prepare(`
      INSERT INTO links (source_path, target, target_path, line_number)
      VALUES (?, ?, ?, ?)
    `),
        deleteLinksFromSource: db.prepare('DELETE FROM links WHERE source_path = ?'),
        getBacklinks: db.prepare(`
      SELECT id, source_path, target, target_path, line_number
      FROM links WHERE target_path = ?
    `),
        getOutlinks: db.prepare(`
      SELECT id, source_path, target, target_path, line_number
      FROM links WHERE source_path = ?
    `),
        clearLinks: db.prepare('DELETE FROM links'),
        // Recency operations
        upsertRecency: db.prepare(`
      INSERT INTO recency (entity_name_lower, last_mentioned_at, mention_count)
      VALUES (?, ?, 1)
      ON CONFLICT(entity_name_lower) DO UPDATE SET
        last_mentioned_at = excluded.last_mentioned_at,
        mention_count = mention_count + 1
    `),
        getRecency: db.prepare(`
      SELECT entity_name_lower, last_mentioned_at, mention_count
      FROM recency WHERE entity_name_lower = ?
    `),
        getAllRecency: db.prepare(`
      SELECT entity_name_lower, last_mentioned_at, mention_count
      FROM recency ORDER BY last_mentioned_at DESC
    `),
        clearRecency: db.prepare('DELETE FROM recency'),
        // Crank state operations
        setCrankState: db.prepare(`
      INSERT INTO crank_state (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `),
        getCrankState: db.prepare('SELECT value FROM crank_state WHERE key = ?'),
        deleteCrankState: db.prepare('DELETE FROM crank_state WHERE key = ?'),
        // Flywheel config operations
        setFlywheelConfigStmt: db.prepare(`
      INSERT INTO flywheel_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `),
        getFlywheelConfigStmt: db.prepare('SELECT value FROM flywheel_config WHERE key = ?'),
        getAllFlywheelConfigStmt: db.prepare('SELECT key, value FROM flywheel_config'),
        deleteFlywheelConfigStmt: db.prepare('DELETE FROM flywheel_config WHERE key = ?'),
        // Notes operations
        insertNote: db.prepare(`
      INSERT INTO notes (path, title, content_hash, modified_at, aliases_json, tags_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
        updateNote: db.prepare(`
      UPDATE notes
      SET title = ?, content_hash = ?, modified_at = ?, aliases_json = ?, tags_json = ?
      WHERE path = ?
    `),
        deleteNote: db.prepare('DELETE FROM notes WHERE path = ?'),
        getNoteByPath: db.prepare(`
      SELECT id, path, title, content_hash, modified_at, aliases_json, tags_json
      FROM notes WHERE path = ?
    `),
        getAllNotes: db.prepare(`
      SELECT id, path, title, content_hash, modified_at, aliases_json, tags_json
      FROM notes ORDER BY path
    `),
        clearNotes: db.prepare('DELETE FROM notes'),
        // Metadata operations
        getMetadataValue: db.prepare('SELECT value FROM metadata WHERE key = ?'),
        setMetadataValue: db.prepare(`
      INSERT INTO metadata (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `),
        // Transactions
        bulkInsertEntities: db.transaction((entities, category) => {
            let count = 0;
            for (const entity of entities) {
                stateDb.insertEntity.run(entity.name, entity.name.toLowerCase(), entity.path, category, JSON.stringify(entity.aliases), entity.hubScore ?? 0);
                count++;
            }
            return count;
        }),
        bulkInsertLinks: db.transaction((links) => {
            let count = 0;
            for (const link of links) {
                stateDb.insertLink.run(link.sourcePath, link.target, link.targetPath, link.lineNumber);
                count++;
            }
            return count;
        }),
        replaceAllEntities: db.transaction((index) => {
            // Clear existing entities
            stateDb.clearEntities.run();
            // Insert all entities by category
            const categories = [
                'technologies', 'acronyms', 'people', 'projects',
                'organizations', 'locations', 'concepts', 'other'
            ];
            let total = 0;
            for (const category of categories) {
                const entities = index[category];
                if (!entities?.length)
                    continue;
                for (const entity of entities) {
                    // Handle both string and EntityWithAliases formats
                    const entityObj = typeof entity === 'string'
                        ? { name: entity, path: '', aliases: [], hubScore: 0 }
                        : entity;
                    stateDb.insertEntity.run(entityObj.name, entityObj.name.toLowerCase(), entityObj.path, category, JSON.stringify(entityObj.aliases), entityObj.hubScore ?? 0);
                    total++;
                }
            }
            // Update metadata
            stateDb.setMetadataValue.run('entities_built_at', new Date().toISOString());
            stateDb.setMetadataValue.run('entity_count', String(total));
            return total;
        }),
        close: () => {
            db.close();
        },
    };
    return stateDb;
}
// =============================================================================
// Entity Operations
// =============================================================================
/**
 * Search entities using FTS5 with porter stemming
 *
 * @param stateDb - State database instance
 * @param query - Search query (supports FTS5 syntax)
 * @param limit - Maximum results to return
 * @returns Array of matching entities with relevance scores
 */
export function searchEntities(stateDb, query, limit = 20) {
    const escapedQuery = escapeFts5Query(query);
    // Handle empty query - return empty results
    if (!escapedQuery) {
        return [];
    }
    const rows = stateDb.searchEntitiesFts.all(escapedQuery, limit);
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        nameLower: row.name_lower,
        path: row.path,
        category: row.category,
        aliases: row.aliases_json ? JSON.parse(row.aliases_json) : [],
        hubScore: row.hub_score,
        rank: row.rank,
    }));
}
/**
 * Search entities by prefix for autocomplete
 *
 * @param stateDb - State database instance
 * @param prefix - Prefix to search for
 * @param limit - Maximum results to return
 */
export function searchEntitiesPrefix(stateDb, prefix, limit = 20) {
    return searchEntities(stateDb, `${escapeFts5Query(prefix)}*`, limit);
}
/**
 * Get entity by exact name (case-insensitive)
 */
export function getEntityByName(stateDb, name) {
    const row = stateDb.getEntityByName.get(name.toLowerCase());
    if (!row)
        return null;
    return {
        id: row.id,
        name: row.name,
        nameLower: row.name_lower,
        path: row.path,
        category: row.category,
        aliases: row.aliases_json ? JSON.parse(row.aliases_json) : [],
        hubScore: row.hub_score,
        rank: 0,
    };
}
/**
 * Get all entities from the database
 */
export function getAllEntitiesFromDb(stateDb) {
    const rows = stateDb.getAllEntities.all();
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        nameLower: row.name_lower,
        path: row.path,
        category: row.category,
        aliases: row.aliases_json ? JSON.parse(row.aliases_json) : [],
        hubScore: row.hub_score,
        rank: 0,
    }));
}
/**
 * Convert database entities back to EntityIndex format
 */
export function getEntityIndexFromDb(stateDb) {
    const entities = getAllEntitiesFromDb(stateDb);
    const index = {
        technologies: [],
        acronyms: [],
        people: [],
        projects: [],
        organizations: [],
        locations: [],
        concepts: [],
        other: [],
        _metadata: {
            total_entities: entities.length,
            generated_at: new Date().toISOString(),
            vault_path: stateDb.vaultPath,
            source: 'vault-core sqlite',
        },
    };
    for (const entity of entities) {
        const entityObj = {
            name: entity.name,
            path: entity.path,
            aliases: entity.aliases,
            hubScore: entity.hubScore,
        };
        index[entity.category].push(entityObj);
    }
    return index;
}
// =============================================================================
// Link Operations
// =============================================================================
/**
 * Get all notes that link to a given path (backlinks)
 */
export function getBacklinks(stateDb, targetPath) {
    const rows = stateDb.getBacklinks.all(targetPath);
    return rows.map(row => ({
        id: row.id,
        sourcePath: row.source_path,
        target: row.target,
        targetPath: row.target_path,
        lineNumber: row.line_number,
    }));
}
/**
 * Get all links from a given note (outlinks)
 */
export function getOutlinks(stateDb, sourcePath) {
    const rows = stateDb.getOutlinks.all(sourcePath);
    return rows.map(row => ({
        id: row.id,
        sourcePath: row.source_path,
        target: row.target,
        targetPath: row.target_path,
        lineNumber: row.line_number,
    }));
}
/**
 * Replace all links from a source note
 */
export function replaceLinksFromSource(stateDb, sourcePath, links) {
    const transaction = stateDb.db.transaction(() => {
        stateDb.deleteLinksFromSource.run(sourcePath);
        for (const link of links) {
            stateDb.insertLink.run(sourcePath, link.target, link.targetPath, link.lineNumber);
        }
    });
    transaction();
}
// =============================================================================
// Recency Operations
// =============================================================================
/**
 * Record a mention of an entity
 */
export function recordEntityMention(stateDb, entityName, mentionedAt = new Date()) {
    stateDb.upsertRecency.run(entityName.toLowerCase(), mentionedAt.getTime());
}
/**
 * Get recency info for an entity
 */
export function getEntityRecency(stateDb, entityName) {
    const row = stateDb.getRecency.get(entityName.toLowerCase());
    if (!row)
        return null;
    return {
        entityNameLower: row.entity_name_lower,
        lastMentionedAt: row.last_mentioned_at,
        mentionCount: row.mention_count,
    };
}
/**
 * Get all recency data ordered by most recent
 */
export function getAllRecency(stateDb) {
    const rows = stateDb.getAllRecency.all();
    return rows.map(row => ({
        entityNameLower: row.entity_name_lower,
        lastMentionedAt: row.last_mentioned_at,
        mentionCount: row.mention_count,
    }));
}
// =============================================================================
// Crank State Operations
// =============================================================================
/**
 * Set a crank state value
 */
export function setCrankState(stateDb, key, value) {
    stateDb.setCrankState.run(key, JSON.stringify(value));
}
/**
 * Get a crank state value
 */
export function getCrankState(stateDb, key) {
    const row = stateDb.getCrankState.get(key);
    if (!row)
        return null;
    return JSON.parse(row.value);
}
/**
 * Delete a crank state key
 */
export function deleteCrankState(stateDb, key) {
    stateDb.deleteCrankState.run(key);
}
/**
 * Set a flywheel config value
 */
export function setFlywheelConfig(stateDb, key, value) {
    stateDb.setFlywheelConfigStmt.run(key, JSON.stringify(value));
}
/**
 * Get a flywheel config value
 */
export function getFlywheelConfig(stateDb, key) {
    const row = stateDb.getFlywheelConfigStmt.get(key);
    if (!row)
        return null;
    return JSON.parse(row.value);
}
/**
 * Get all flywheel config values as an object
 */
export function getAllFlywheelConfig(stateDb) {
    const rows = stateDb.getAllFlywheelConfigStmt.all();
    const config = {};
    for (const row of rows) {
        try {
            config[row.key] = JSON.parse(row.value);
        }
        catch {
            config[row.key] = row.value;
        }
    }
    return config;
}
/**
 * Delete a flywheel config key
 */
export function deleteFlywheelConfig(stateDb, key) {
    stateDb.deleteFlywheelConfigStmt.run(key);
}
/**
 * Save entire Flywheel config object to database
 * Stores each top-level key as a separate row
 */
export function saveFlywheelConfigToDb(stateDb, config) {
    const transaction = stateDb.db.transaction(() => {
        for (const [key, value] of Object.entries(config)) {
            if (value !== undefined) {
                setFlywheelConfig(stateDb, key, value);
            }
        }
    });
    transaction();
}
/**
 * Load Flywheel config from database and reconstruct as typed object
 */
export function loadFlywheelConfigFromDb(stateDb) {
    const config = getAllFlywheelConfig(stateDb);
    if (Object.keys(config).length === 0) {
        return null;
    }
    return config;
}
// =============================================================================
// Metadata Operations
// =============================================================================
/**
 * Get database metadata
 */
export function getStateDbMetadata(stateDb) {
    const schemaRow = stateDb.db.prepare('SELECT MAX(version) as version FROM schema_version').get();
    const entitiesBuiltRow = stateDb.getMetadataValue.get('entities_built_at');
    const entityCountRow = stateDb.getMetadataValue.get('entity_count');
    const notesBuiltRow = stateDb.getMetadataValue.get('notes_built_at');
    const noteCountRow = stateDb.getMetadataValue.get('note_count');
    return {
        schemaVersion: schemaRow?.version ?? 0,
        entitiesBuiltAt: entitiesBuiltRow?.value ?? null,
        entityCount: entityCountRow ? parseInt(entityCountRow.value, 10) : 0,
        notesBuiltAt: notesBuiltRow?.value ?? null,
        noteCount: noteCountRow ? parseInt(noteCountRow.value, 10) : 0,
    };
}
/**
 * Check if entity data is stale (older than threshold)
 */
export function isEntityDataStale(stateDb, thresholdMs = 60 * 60 * 1000 // 1 hour default
) {
    const metadata = getStateDbMetadata(stateDb);
    if (!metadata.entitiesBuiltAt) {
        return true;
    }
    const builtAt = new Date(metadata.entitiesBuiltAt).getTime();
    const age = Date.now() - builtAt;
    return age > thresholdMs;
}
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * Escape special FTS5 characters in a query
 */
export function escapeFts5Query(query) {
    // Handle empty query
    if (!query || !query.trim()) {
        return '';
    }
    // Remove or escape FTS5 special characters
    // Keep * for prefix matching, escape others
    return query
        .replace(/"/g, '""') // Escape quotes
        .replace(/[(){}[\]^~:-]/g, ' ') // Remove special operators including hyphen
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}
/**
 * Check if the state database exists for a vault
 */
export function stateDbExists(vaultPath) {
    const dbPath = getStateDbPath(vaultPath);
    return fs.existsSync(dbPath);
}
/**
 * Delete the state database (for testing or reset)
 */
export function deleteStateDb(vaultPath) {
    const dbPath = getStateDbPath(vaultPath);
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
    // Also remove WAL and SHM files if they exist
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(walPath))
        fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath))
        fs.unlinkSync(shmPath);
}
/**
 * Save VaultIndex to cache
 *
 * @param stateDb - State database instance
 * @param indexData - Serialized VaultIndex data
 */
export function saveVaultIndexCache(stateDb, indexData) {
    const data = JSON.stringify(indexData);
    const stmt = stateDb.db.prepare(`
    INSERT OR REPLACE INTO vault_index_cache (id, data, built_at, note_count, version)
    VALUES (1, ?, ?, ?, 1)
  `);
    stmt.run(data, indexData.builtAt, indexData.notes.length);
}
/**
 * Load VaultIndex from cache
 *
 * @param stateDb - State database instance
 * @returns Cached VaultIndex data or null if not found
 */
export function loadVaultIndexCache(stateDb) {
    const stmt = stateDb.db.prepare(`
    SELECT data, built_at, note_count FROM vault_index_cache WHERE id = 1
  `);
    const row = stmt.get();
    if (!row)
        return null;
    try {
        return JSON.parse(row.data);
    }
    catch {
        return null;
    }
}
/**
 * Get cache metadata without loading full data
 */
export function getVaultIndexCacheInfo(stateDb) {
    const stmt = stateDb.db.prepare(`
    SELECT built_at, note_count, version FROM vault_index_cache WHERE id = 1
  `);
    const row = stmt.get();
    if (!row)
        return null;
    return {
        builtAt: new Date(row.built_at),
        noteCount: row.note_count,
        version: row.version,
    };
}
/**
 * Clear the vault index cache
 */
export function clearVaultIndexCache(stateDb) {
    stateDb.db.prepare('DELETE FROM vault_index_cache').run();
}
/**
 * Check if cache is valid (not too old and note count matches)
 *
 * @param stateDb - State database instance
 * @param actualNoteCount - Current number of notes in vault
 * @param maxAgeMs - Maximum cache age in milliseconds (default 24 hours)
 */
export function isVaultIndexCacheValid(stateDb, actualNoteCount, maxAgeMs = 24 * 60 * 60 * 1000) {
    const info = getVaultIndexCacheInfo(stateDb);
    if (!info)
        return false;
    // Check note count matches (quick validation)
    if (info.noteCount !== actualNoteCount)
        return false;
    // Check age
    const age = Date.now() - info.builtAt.getTime();
    if (age > maxAgeMs)
        return false;
    return true;
}
/**
 * Get default legacy file paths for a vault
 * Returns null for paths that don't exist (for easy checking)
 */
export function getLegacyPaths(vaultPath) {
    const claudeDir = path.join(vaultPath, '.claude');
    const checkPath = (filename) => {
        const filePath = path.join(claudeDir, filename);
        return fs.existsSync(filePath) ? filePath : null;
    };
    return {
        config: checkPath('.flywheel.json'),
        entityCache: checkPath('wikilink-entities.json'),
        recency: checkPath('entity-recency.json'),
        lastCommit: checkPath('last-crank-commit.json'),
        hints: checkPath('crank-mutation-hints.json'),
        backlinks: checkPath('backlinks.json'),
    };
}
/**
 * Migrate legacy JSON files to SQLite state database
 *
 * This function reads existing JSON state files and imports them
 * into the consolidated SQLite database. It does NOT delete the
 * original JSON files - that should be done manually after verifying
 * the migration was successful.
 *
 * Can be called with just a vault path (convenience) or with
 * an existing StateDb and legacy paths (for more control).
 *
 * @param stateDbOrVaultPath - Open state database OR vault path string
 * @param legacyPaths - Paths to legacy JSON files (optional if vault path provided)
 * @returns Migration result with counts and any errors
 */
export async function migrateFromJsonToSqlite(stateDbOrVaultPath, legacyPaths) {
    // Handle convenience signature: migrateFromJsonToSqlite(vaultPath)
    let stateDb;
    let paths;
    let shouldCloseDb = false;
    if (typeof stateDbOrVaultPath === 'string') {
        const vaultPath = stateDbOrVaultPath;
        stateDb = openStateDb(vaultPath);
        paths = getLegacyPaths(vaultPath);
        shouldCloseDb = true;
    }
    else {
        stateDb = stateDbOrVaultPath;
        paths = legacyPaths ?? {};
    }
    const result = {
        success: true,
        entitiesMigrated: 0,
        recencyMigrated: 0,
        crankStateMigrated: 0,
        linksMigrated: 0,
        configMigrated: false,
        skipped: false,
        errors: [],
    };
    try {
        // Migrate flywheel config
        if (paths.config && fs.existsSync(paths.config)) {
            try {
                const content = fs.readFileSync(paths.config, 'utf-8');
                const config = JSON.parse(content);
                saveFlywheelConfigToDb(stateDb, config);
                result.configMigrated = true;
            }
            catch (error) {
                result.errors.push(`Failed to migrate config: ${error}`);
                result.success = false;
            }
        }
        // Migrate entities
        if (paths.entityCache && fs.existsSync(paths.entityCache)) {
            try {
                const content = fs.readFileSync(paths.entityCache, 'utf-8');
                const index = JSON.parse(content);
                result.entitiesMigrated = stateDb.replaceAllEntities(index);
            }
            catch (error) {
                result.errors.push(`Failed to migrate entities: ${error}`);
                result.success = false;
            }
        }
        // Migrate recency data
        if (paths.recency && fs.existsSync(paths.recency)) {
            try {
                const content = fs.readFileSync(paths.recency, 'utf-8');
                const data = JSON.parse(content);
                for (const [entityName, timestamp] of Object.entries(data.lastMentioned)) {
                    recordEntityMention(stateDb, entityName, new Date(timestamp));
                    result.recencyMigrated++;
                }
            }
            catch (error) {
                result.errors.push(`Failed to migrate recency: ${error}`);
                result.success = false;
            }
        }
        // Migrate last commit tracking
        if (paths.lastCommit && fs.existsSync(paths.lastCommit)) {
            try {
                const content = fs.readFileSync(paths.lastCommit, 'utf-8');
                const data = JSON.parse(content);
                setCrankState(stateDb, 'last_commit', data);
                result.crankStateMigrated++;
            }
            catch (error) {
                result.errors.push(`Failed to migrate last commit: ${error}`);
                result.success = false;
            }
        }
        // Migrate mutation hints
        if (paths.hints && fs.existsSync(paths.hints)) {
            try {
                const content = fs.readFileSync(paths.hints, 'utf-8');
                const data = JSON.parse(content);
                setCrankState(stateDb, 'mutation_hints', data);
                result.crankStateMigrated++;
            }
            catch (error) {
                result.errors.push(`Failed to migrate hints: ${error}`);
                result.success = false;
            }
        }
        // Migrate backlinks
        if (paths.backlinks && fs.existsSync(paths.backlinks)) {
            try {
                const content = fs.readFileSync(paths.backlinks, 'utf-8');
                const backlinks = JSON.parse(content);
                // Convert backlinks to link records
                // backlinks format: { "target.md": ["source1.md", "source2.md"] }
                for (const [targetPath, sources] of Object.entries(backlinks)) {
                    for (const sourcePath of sources) {
                        stateDb.insertLink.run(sourcePath, targetPath, targetPath, null);
                        result.linksMigrated++;
                    }
                }
            }
            catch (error) {
                result.errors.push(`Failed to migrate backlinks: ${error}`);
                result.success = false;
            }
        }
        // Mark as skipped if nothing was migrated
        const totalMigrated = result.entitiesMigrated + result.recencyMigrated +
            result.crankStateMigrated + result.linksMigrated + (result.configMigrated ? 1 : 0);
        if (totalMigrated === 0 && result.errors.length === 0) {
            result.skipped = true;
        }
        return result;
    }
    finally {
        // Close db if we opened it
        if (shouldCloseDb) {
            stateDb.close();
        }
    }
}
/**
 * Backup legacy JSON files before migration
 *
 * Creates .bak files alongside the originals.
 * Can accept either a vault path (convenience) or LegacyPaths object.
 */
export async function backupLegacyFiles(vaultPathOrLegacyPaths) {
    const paths = typeof vaultPathOrLegacyPaths === 'string'
        ? getLegacyPaths(vaultPathOrLegacyPaths)
        : vaultPathOrLegacyPaths;
    const result = {
        success: true,
        backedUpFiles: [],
        errors: [],
    };
    const timestamp = Date.now();
    for (const [key, filePath] of Object.entries(paths)) {
        if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
            try {
                // Create backup with timestamp: file.json -> file.backup.1234567890.json
                const ext = path.extname(filePath);
                const base = filePath.slice(0, -ext.length);
                const backupPath = `${base}.backup.${timestamp}${ext}`;
                fs.copyFileSync(filePath, backupPath);
                result.backedUpFiles.push(filePath);
            }
            catch (error) {
                result.errors.push(`Failed to backup ${key}: ${error}`);
                result.success = false;
            }
        }
    }
    return result;
}
/**
 * Delete legacy JSON files after successful migration
 *
 * Can accept either a vault path (convenience) or LegacyPaths object.
 * Use options.requireStateDb to ensure StateDb exists before deleting.
 */
export async function deleteLegacyFiles(vaultPathOrLegacyPaths, options) {
    // Determine vault path for StateDb check
    let vaultPath;
    let paths;
    if (typeof vaultPathOrLegacyPaths === 'string') {
        vaultPath = vaultPathOrLegacyPaths;
        // For deletion, we need to get the full paths, not just existing ones
        const claudeDir = path.join(vaultPath, '.claude');
        paths = {
            config: path.join(claudeDir, '.flywheel.json'),
            entityCache: path.join(claudeDir, 'wikilink-entities.json'),
            recency: path.join(claudeDir, 'entity-recency.json'),
            lastCommit: path.join(claudeDir, 'last-crank-commit.json'),
            hints: path.join(claudeDir, 'crank-mutation-hints.json'),
            backlinks: path.join(claudeDir, 'backlinks.json'),
        };
    }
    else {
        paths = vaultPathOrLegacyPaths;
    }
    const result = {
        success: true,
        deletedFiles: [],
        errors: [],
    };
    // Check requireStateDb option
    if (options?.requireStateDb && vaultPath) {
        if (!stateDbExists(vaultPath)) {
            result.success = false;
            result.error = 'StateDb does not exist. Migrate before deleting legacy files.';
            return result;
        }
    }
    for (const [key, filePath] of Object.entries(paths)) {
        if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                result.deletedFiles.push(filePath);
            }
            catch (error) {
                result.errors.push(`Failed to delete ${key}: ${error}`);
                result.success = false;
            }
        }
    }
    return result;
}
//# sourceMappingURL=sqlite.js.map