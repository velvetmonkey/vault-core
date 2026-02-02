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
/** Note metadata stored in database */
export interface NoteRow {
    id: number;
    path: string;
    title: string;
    contentHash: string | null;
    modifiedAt: number;
    aliases: string[];
    tags: string[];
}
/** Link between notes */
export interface LinkRow {
    id: number;
    sourcePath: string;
    target: string;
    targetPath: string | null;
    lineNumber: number | null;
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
    insertLink: Statement;
    deleteLinksFromSource: Statement;
    getBacklinks: Statement;
    getOutlinks: Statement;
    clearLinks: Statement;
    upsertRecency: Statement;
    getRecency: Statement;
    getAllRecency: Statement;
    clearRecency: Statement;
    setCrankState: Statement;
    getCrankState: Statement;
    deleteCrankState: Statement;
    setFlywheelConfigStmt: Statement;
    getFlywheelConfigStmt: Statement;
    getAllFlywheelConfigStmt: Statement;
    deleteFlywheelConfigStmt: Statement;
    insertNote: Statement;
    updateNote: Statement;
    deleteNote: Statement;
    getNoteByPath: Statement;
    getAllNotes: Statement;
    clearNotes: Statement;
    getMetadataValue: Statement;
    setMetadataValue: Statement;
    bulkInsertEntities: Transaction<(entities: EntityWithAliases[], category: EntityCategory) => number>;
    bulkInsertLinks: Transaction<(links: Omit<LinkRow, 'id'>[]) => number>;
    replaceAllEntities: Transaction<(index: EntityIndex) => number>;
    close: () => void;
}
/** Current schema version - bump when schema changes */
export declare const SCHEMA_VERSION = 1;
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
 * Get all notes that link to a given path (backlinks)
 */
export declare function getBacklinks(stateDb: StateDb, targetPath: string): LinkRow[];
/**
 * Get all links from a given note (outlinks)
 */
export declare function getOutlinks(stateDb: StateDb, sourcePath: string): LinkRow[];
/**
 * Replace all links from a source note
 */
export declare function replaceLinksFromSource(stateDb: StateDb, sourcePath: string, links: Omit<LinkRow, 'id' | 'sourcePath'>[]): void;
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
 * Set a crank state value
 */
export declare function setCrankState(stateDb: StateDb, key: string, value: unknown): void;
/**
 * Get a crank state value
 */
export declare function getCrankState<T>(stateDb: StateDb, key: string): T | null;
/**
 * Delete a crank state key
 */
export declare function deleteCrankState(stateDb: StateDb, key: string): void;
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
/** Result of a migration operation */
export interface MigrationResult {
    success: boolean;
    entitiesMigrated: number;
    recencyMigrated: number;
    crankStateMigrated: number;
    linksMigrated: number;
    configMigrated: boolean;
    /** True if no legacy files were found to migrate */
    skipped: boolean;
    errors: string[];
}
/** Paths to legacy JSON files */
export interface LegacyPaths {
    config?: string | null;
    entityCache?: string | null;
    recency?: string | null;
    lastCommit?: string | null;
    hints?: string | null;
    backlinks?: string | null;
}
/**
 * Get default legacy file paths for a vault
 * Returns null for paths that don't exist (for easy checking)
 */
export declare function getLegacyPaths(vaultPath: string): LegacyPaths;
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
export declare function migrateFromJsonToSqlite(stateDbOrVaultPath: StateDb | string, legacyPaths?: LegacyPaths): Promise<MigrationResult>;
/** Result of backup operation */
export interface BackupResult {
    success: boolean;
    backedUpFiles: string[];
    errors: string[];
}
/** Result of delete operation */
export interface DeleteResult {
    success: boolean;
    deletedFiles: string[];
    errors: string[];
    error?: string;
}
/** Options for delete operation */
export interface DeleteOptions {
    /** If true, require StateDb to exist before deleting legacy files */
    requireStateDb?: boolean;
}
/**
 * Backup legacy JSON files before migration
 *
 * Creates .bak files alongside the originals.
 * Can accept either a vault path (convenience) or LegacyPaths object.
 */
export declare function backupLegacyFiles(vaultPathOrLegacyPaths: string | LegacyPaths): Promise<BackupResult>;
/**
 * Delete legacy JSON files after successful migration
 *
 * Can accept either a vault path (convenience) or LegacyPaths object.
 * Use options.requireStateDb to ensure StateDb exists before deleting.
 */
export declare function deleteLegacyFiles(vaultPathOrLegacyPaths: string | LegacyPaths, options?: DeleteOptions): Promise<DeleteResult>;
//# sourceMappingURL=sqlite.d.ts.map