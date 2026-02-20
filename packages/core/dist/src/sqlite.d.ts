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
import type { Statement, Transaction } from 'better-sqlite3';
import type { EntityCategory, EntityWithAliases, EntityIndex } from './types.js';
/** Search result from FTS5 entity search */
export interface EntitySearchResult {
    id: number;
    name: string;
    nameLower: string;
    path: string;
    category: EntityCategory;
    aliases: string[];
    hubScore: number;
    rank: number;
}
/** Recency tracking for entities */
export interface RecencyRow {
    entityNameLower: string;
    lastMentionedAt: number;
    mentionCount: number;
}
/** Database state metadata */
export interface StateDbMetadata {
    schemaVersion: number;
    entitiesBuiltAt: string | null;
    entityCount: number;
    notesBuiltAt: string | null;
    noteCount: number;
}
/** State database instance with prepared statements */
export interface StateDb {
    db: Database.Database;
    vaultPath: string;
    dbPath: string;
    insertEntity: Statement;
    updateEntity: Statement;
    deleteEntity: Statement;
    getEntityByName: Statement;
    getEntityById: Statement;
    getAllEntities: Statement;
    getEntitiesByCategory: Statement;
    searchEntitiesFts: Statement;
    clearEntities: Statement;
    getEntitiesByAlias: Statement;
    upsertRecency: Statement;
    getRecency: Statement;
    getAllRecency: Statement;
    clearRecency: Statement;
    setWriteState: Statement;
    getWriteState: Statement;
    deleteWriteState: Statement;
    setFlywheelConfigStmt: Statement;
    getFlywheelConfigStmt: Statement;
    getAllFlywheelConfigStmt: Statement;
    deleteFlywheelConfigStmt: Statement;
    insertTask: Statement;
    deleteTasksForPath: Statement;
    clearAllTasks: Statement;
    countTasksByStatus: Statement;
    getMetadataValue: Statement;
    setMetadataValue: Statement;
    bulkInsertEntities: Transaction<(entities: EntityWithAliases[], category: EntityCategory) => number>;
    replaceAllEntities: Transaction<(index: EntityIndex) => number>;
    close: () => void;
}
/** Current schema version - bump when schema changes */
export declare const SCHEMA_VERSION = 14;
/** State database filename */
export declare const STATE_DB_FILENAME = "state.db";
/** Directory for flywheel state */
export declare const FLYWHEEL_DIR = ".flywheel";
/**
 * Get the database path for a vault
 */
export declare function getStateDbPath(vaultPath: string): string;
/**
 * Open or create the state database for a vault
 *
 * @param vaultPath - Absolute path to the vault root
 * @returns StateDb instance with prepared statements
 */
export declare function openStateDb(vaultPath: string): StateDb;
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
 * Escape special FTS5 characters in a query
 */
export declare function escapeFts5Query(query: string): string;
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
//# sourceMappingURL=sqlite.d.ts.map