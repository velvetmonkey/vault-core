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
export { SCHEMA_VERSION, STATE_DB_FILENAME, FLYWHEEL_DIR, SCHEMA_SQL } from './schema.js';
export { getStateDbPath, initSchema, deleteStateDbFiles, backupStateDb, preserveCorruptedDb } from './migrations.js';
export { searchEntities, searchEntitiesPrefix, getEntityByName, getAllEntitiesFromDb, getEntityIndexFromDb, getEntitiesByAlias, recordEntityMention, getEntityRecency, getAllRecency, setWriteState, getWriteState, deleteWriteState, setFlywheelConfig, getFlywheelConfig, getAllFlywheelConfig, deleteFlywheelConfig, saveFlywheelConfigToDb, loadFlywheelConfigFromDb, recordMergeDismissal, getDismissedMergePairs, getStateDbMetadata, isEntityDataStale, escapeFts5Query, rebuildEntitiesFts, stateDbExists, deleteStateDb, saveVaultIndexCache, loadVaultIndexCache, getVaultIndexCacheInfo, clearVaultIndexCache, isVaultIndexCacheValid, loadContentHashes, saveContentHashBatch, renameContentHash, } from './queries.js';
export type { FlywheelConfigRow, VaultIndexCacheData, VaultIndexCacheInfo } from './queries.js';
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
    description?: string;
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
/**
 * Open or create the state database for a vault
 *
 * @param vaultPath - Absolute path to the vault root
 * @returns StateDb instance with prepared statements
 */
export declare function openStateDb(vaultPath: string): StateDb;
//# sourceMappingURL=sqlite.d.ts.map