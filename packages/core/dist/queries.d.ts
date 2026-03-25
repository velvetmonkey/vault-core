/**
 * SQLite Query Functions
 *
 * All database query operations: entity search, recency, write state,
 * flywheel config, merge dismissals, metadata, vault index cache,
 * and content hashes.
 */
import type { EntityIndex } from './types.js';
import type { StateDb, EntitySearchResult, RecencyRow, StateDbMetadata } from './sqlite.js';
/**
 * Search entities using FTS5 with porter stemming
 *
 * @param stateDb - State database instance
 * @param query - Search query (supports FTS5 syntax)
 * @param limit - Maximum results to return
 * @returns Array of matching entities with relevance scores
 */
export declare function searchEntities(stateDb: StateDb, query: string, limit?: number): EntitySearchResult[];
/**
 * Search entities by prefix for autocomplete
 *
 * @param stateDb - State database instance
 * @param prefix - Prefix to search for
 * @param limit - Maximum results to return
 */
export declare function searchEntitiesPrefix(stateDb: StateDb, prefix: string, limit?: number): EntitySearchResult[];
/**
 * Get entity by exact name (case-insensitive)
 */
export declare function getEntityByName(stateDb: StateDb, name: string): EntitySearchResult | null;
/**
 * Get all entities from the database
 */
export declare function getAllEntitiesFromDb(stateDb: StateDb): EntitySearchResult[];
/**
 * Convert database entities back to EntityIndex format
 */
export declare function getEntityIndexFromDb(stateDb: StateDb): EntityIndex;
/**
 * Get entities that have a given alias (case-insensitive)
 *
 * @param stateDb - State database instance
 * @param alias - Alias to search for (case-insensitive)
 * @returns Array of matching entities
 */
export declare function getEntitiesByAlias(stateDb: StateDb, alias: string): EntitySearchResult[];
/**
 * Record a mention of an entity
 */
export declare function recordEntityMention(stateDb: StateDb, entityName: string, mentionedAt?: Date): void;
/**
 * Get recency info for an entity
 */
export declare function getEntityRecency(stateDb: StateDb, entityName: string): RecencyRow | null;
/**
 * Get all recency data ordered by most recent
 */
export declare function getAllRecency(stateDb: StateDb): RecencyRow[];
/**
 * Set a write state value
 */
export declare function setWriteState(stateDb: StateDb, key: string, value: unknown): void;
/**
 * Get a write state value
 */
export declare function getWriteState<T>(stateDb: StateDb, key: string): T | null;
/**
 * Delete a write state key
 */
export declare function deleteWriteState(stateDb: StateDb, key: string): void;
/** Flywheel config row from database */
export interface FlywheelConfigRow {
    key: string;
    value: string;
}
/**
 * Set a flywheel config value
 */
export declare function setFlywheelConfig(stateDb: StateDb, key: string, value: unknown): void;
/**
 * Get a flywheel config value
 */
export declare function getFlywheelConfig<T>(stateDb: StateDb, key: string): T | null;
/**
 * Get all flywheel config values as an object
 */
export declare function getAllFlywheelConfig(stateDb: StateDb): Record<string, unknown>;
/**
 * Delete a flywheel config key
 */
export declare function deleteFlywheelConfig(stateDb: StateDb, key: string): void;
/**
 * Save entire Flywheel config object to database
 * Stores each top-level key as a separate row
 */
export declare function saveFlywheelConfigToDb(stateDb: StateDb, config: Record<string, unknown>): void;
/**
 * Load Flywheel config from database and reconstruct as typed object
 */
export declare function loadFlywheelConfigFromDb(stateDb: StateDb): Record<string, unknown> | null;
/**
 * Record a merge dismissal so the pair never reappears in suggestions.
 */
export declare function recordMergeDismissal(db: StateDb, sourcePath: string, targetPath: string, sourceName: string, targetName: string, reason: string): void;
/**
 * Get all dismissed merge pair keys for filtering.
 */
export declare function getDismissedMergePairs(db: StateDb): Set<string>;
/**
 * Get database metadata
 */
export declare function getStateDbMetadata(stateDb: StateDb): StateDbMetadata;
/**
 * Check if entity data is stale (older than threshold)
 */
export declare function isEntityDataStale(stateDb: StateDb, thresholdMs?: number): boolean;
/**
 * Escape special FTS5 characters and convert to OR-joined query.
 * BM25 ranking naturally scores documents with more matching terms higher,
 * so OR semantics gives AND-like results at the top while surfacing partial matches.
 * Preserves quoted phrases as exact matches and * for prefix matching.
 */
export declare function escapeFts5Query(query: string): string;
/**
 * Rebuild the entities_fts index from the entities table.
 * Contentless FTS5 tables don't support the 'rebuild' command,
 * so we manually delete all entries and re-insert from the entities table.
 */
export declare function rebuildEntitiesFts(stateDb: StateDb): void;
/**
 * Check if the state database exists for a vault
 */
export declare function stateDbExists(vaultPath: string): boolean;
/**
 * Delete the state database (for testing or reset)
 */
export declare function deleteStateDb(vaultPath: string): void;
/** Serializable VaultIndex for caching */
export interface VaultIndexCacheData {
    notes: Array<{
        path: string;
        title: string;
        aliases: string[];
        frontmatter: Record<string, unknown>;
        outlinks: Array<{
            target: string;
            alias?: string;
            line: number;
        }>;
        tags: string[];
        modified: number;
        created?: number;
    }>;
    backlinks: Array<[string, Array<{
        source: string;
        line: number;
        context?: string;
    }>]>;
    entities: Array<[string, string]>;
    prospects?: Array<[string, {
        displayName: string;
        backlinkCount: number;
    }]>;
    tags: Array<[string, string[]]>;
    builtAt: number;
}
/** Cache metadata */
export interface VaultIndexCacheInfo {
    builtAt: Date;
    noteCount: number;
    version: number;
}
/**
 * Save VaultIndex to cache
 *
 * @param stateDb - State database instance
 * @param indexData - Serialized VaultIndex data
 */
export declare function saveVaultIndexCache(stateDb: StateDb, indexData: VaultIndexCacheData): void;
/**
 * Load VaultIndex from cache
 *
 * @param stateDb - State database instance
 * @returns Cached VaultIndex data or null if not found
 */
export declare function loadVaultIndexCache(stateDb: StateDb): VaultIndexCacheData | null;
/**
 * Get cache metadata without loading full data
 */
export declare function getVaultIndexCacheInfo(stateDb: StateDb): VaultIndexCacheInfo | null;
/**
 * Clear the vault index cache
 */
export declare function clearVaultIndexCache(stateDb: StateDb): void;
/**
 * Check if cache is valid (not too old and note count matches)
 *
 * @param stateDb - State database instance
 * @param actualNoteCount - Current number of notes in vault
 * @param maxAgeMs - Maximum cache age in milliseconds (default 24 hours)
 */
export declare function isVaultIndexCacheValid(stateDb: StateDb, actualNoteCount: number, maxAgeMs?: number): boolean;
/** Load all persisted content hashes */
export declare function loadContentHashes(stateDb: StateDb): Map<string, string>;
/** Persist hash changes from a watcher batch (upserts + deletes in one transaction) */
export declare function saveContentHashBatch(stateDb: StateDb, upserts: Array<{
    path: string;
    hash: string;
}>, deletes: string[]): void;
/** Rename a hash entry (for file renames) */
export declare function renameContentHash(stateDb: StateDb, oldPath: string, newPath: string): void;
//# sourceMappingURL=queries.d.ts.map