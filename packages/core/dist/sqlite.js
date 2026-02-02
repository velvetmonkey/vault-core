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
 * Get default legacy file paths for a vault
 */
export function getLegacyPaths(vaultPath) {
    const claudeDir = path.join(vaultPath, '.claude');
    return {
        entities: path.join(claudeDir, 'wikilink-entities.json'),
        recency: path.join(claudeDir, 'entity-recency.json'),
        lastCommit: path.join(claudeDir, 'last-crank-commit.json'),
        hints: path.join(claudeDir, 'crank-mutation-hints.json'),
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
 * @param stateDb - Open state database
 * @param legacyPaths - Paths to legacy JSON files
 * @returns Migration result with counts and any errors
 */
export async function migrateFromJsonToSqlite(stateDb, legacyPaths) {
    const result = {
        success: true,
        entitiesMigrated: 0,
        recencyMigrated: 0,
        crankStateMigrated: 0,
        errors: [],
    };
    // Migrate entities
    if (legacyPaths.entities && fs.existsSync(legacyPaths.entities)) {
        try {
            const content = fs.readFileSync(legacyPaths.entities, 'utf-8');
            const index = JSON.parse(content);
            result.entitiesMigrated = stateDb.replaceAllEntities(index);
        }
        catch (error) {
            result.errors.push(`Failed to migrate entities: ${error}`);
            result.success = false;
        }
    }
    // Migrate recency data
    if (legacyPaths.recency && fs.existsSync(legacyPaths.recency)) {
        try {
            const content = fs.readFileSync(legacyPaths.recency, 'utf-8');
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
    if (legacyPaths.lastCommit && fs.existsSync(legacyPaths.lastCommit)) {
        try {
            const content = fs.readFileSync(legacyPaths.lastCommit, 'utf-8');
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
    if (legacyPaths.hints && fs.existsSync(legacyPaths.hints)) {
        try {
            const content = fs.readFileSync(legacyPaths.hints, 'utf-8');
            const data = JSON.parse(content);
            setCrankState(stateDb, 'mutation_hints', data);
            result.crankStateMigrated++;
        }
        catch (error) {
            result.errors.push(`Failed to migrate hints: ${error}`);
            result.success = false;
        }
    }
    return result;
}
/**
 * Backup legacy JSON files before migration
 *
 * Creates .bak files alongside the originals
 */
export function backupLegacyFiles(legacyPaths) {
    const backedUp = [];
    for (const [, filePath] of Object.entries(legacyPaths)) {
        if (filePath && fs.existsSync(filePath)) {
            const backupPath = filePath + '.bak';
            fs.copyFileSync(filePath, backupPath);
            backedUp.push(filePath);
        }
    }
    return backedUp;
}
/**
 * Delete legacy JSON files after successful migration
 *
 * Only deletes files that have corresponding .bak backups
 */
export function deleteLegacyFiles(legacyPaths) {
    const deleted = [];
    for (const [, filePath] of Object.entries(legacyPaths)) {
        if (filePath && fs.existsSync(filePath)) {
            const backupPath = filePath + '.bak';
            // Only delete if backup exists (safety check)
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(filePath);
                deleted.push(filePath);
            }
        }
    }
    return deleted;
}
//# sourceMappingURL=sqlite.js.map