/**
 * SQLite Query Functions
 *
 * All database query operations: entity search, recency, write state,
 * flywheel config, merge dismissals, metadata, vault index cache,
 * and content hashes.
 */
import * as fs from 'fs';
import { getStateDbPath } from './migrations.js';
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
        description: row.description ?? undefined,
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
        description: row.description ?? undefined,
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
        description: row.description ?? undefined,
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
        animals: [],
        media: [],
        events: [],
        documents: [],
        vehicles: [],
        health: [],
        finance: [],
        food: [],
        hobbies: [],
        periodical: [],
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
            description: entity.description,
        };
        index[entity.category].push(entityObj);
    }
    return index;
}
/**
 * Get entities that have a given alias (case-insensitive)
 *
 * @param stateDb - State database instance
 * @param alias - Alias to search for (case-insensitive)
 * @returns Array of matching entities
 */
export function getEntitiesByAlias(stateDb, alias) {
    const rows = stateDb.getEntitiesByAlias.all(alias.toLowerCase());
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        nameLower: row.name_lower,
        path: row.path,
        category: row.category,
        aliases: row.aliases_json ? JSON.parse(row.aliases_json) : [],
        hubScore: row.hub_score,
        description: row.description ?? undefined,
        rank: 0,
    }));
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
// Write State Operations
// =============================================================================
/**
 * Set a write state value
 */
export function setWriteState(stateDb, key, value) {
    stateDb.setWriteState.run(key, JSON.stringify(value));
}
/**
 * Get a write state value
 */
export function getWriteState(stateDb, key) {
    const row = stateDb.getWriteState.get(key);
    if (!row)
        return null;
    return JSON.parse(row.value);
}
/**
 * Delete a write state key
 */
export function deleteWriteState(stateDb, key) {
    stateDb.deleteWriteState.run(key);
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
// Merge Dismissal Operations
// =============================================================================
/**
 * Record a merge dismissal so the pair never reappears in suggestions.
 */
export function recordMergeDismissal(db, sourcePath, targetPath, sourceName, targetName, reason) {
    const pairKey = [sourcePath, targetPath].sort().join('::');
    db.db.prepare(`INSERT OR IGNORE INTO merge_dismissals
    (pair_key, source_path, target_path, source_name, target_name, reason)
    VALUES (?, ?, ?, ?, ?, ?)`)
        .run(pairKey, sourcePath, targetPath, sourceName, targetName, reason);
}
/**
 * Get all dismissed merge pair keys for filtering.
 */
export function getDismissedMergePairs(db) {
    const rows = db.db.prepare('SELECT pair_key FROM merge_dismissals').all();
    return new Set(rows.map(r => r.pair_key));
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
 * Rebuild the entities_fts index from the entities table.
 * Uses FTS5's built-in 'rebuild' command to resynchronize.
 * Call this if the FTS index gets out of sync (e.g., T.aliases errors).
 */
export function rebuildEntitiesFts(stateDb) {
    stateDb.db.exec(`INSERT INTO entities_fts(entities_fts) VALUES('rebuild')`);
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
// =============================================================================
// Content Hash Operations
// =============================================================================
/** Load all persisted content hashes */
export function loadContentHashes(stateDb) {
    const rows = stateDb.db.prepare('SELECT path, hash FROM content_hashes').all();
    const map = new Map();
    for (const row of rows) {
        map.set(row.path, row.hash);
    }
    return map;
}
/** Persist hash changes from a watcher batch (upserts + deletes in one transaction) */
export function saveContentHashBatch(stateDb, upserts, deletes) {
    const upsertStmt = stateDb.db.prepare('INSERT OR REPLACE INTO content_hashes (path, hash, updated_at) VALUES (?, ?, ?)');
    const deleteStmt = stateDb.db.prepare('DELETE FROM content_hashes WHERE path = ?');
    const now = Date.now();
    const runBatch = stateDb.db.transaction(() => {
        for (const { path, hash } of upserts) {
            upsertStmt.run(path, hash, now);
        }
        for (const p of deletes) {
            deleteStmt.run(p);
        }
    });
    runBatch();
}
/** Rename a hash entry (for file renames) */
export function renameContentHash(stateDb, oldPath, newPath) {
    stateDb.db.prepare('UPDATE content_hashes SET path = ?, updated_at = ? WHERE path = ?').run(newPath, Date.now(), oldPath);
}
//# sourceMappingURL=queries.js.map