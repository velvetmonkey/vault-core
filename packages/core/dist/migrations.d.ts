/**
 * SQLite Schema Migrations
 *
 * Database path resolution, schema initialization, migration logic,
 * and database file management utilities.
 */
import Database from 'better-sqlite3';
/**
 * Get the database path for a vault
 */
export declare function getStateDbPath(vaultPath: string): string;
/**
 * Initialize schema and run migrations
 */
export declare function initSchema(db: Database.Database): void;
export declare function deleteStateDbFiles(dbPath: string): void;
/** Back up state.db before opening (skip if missing or 0 bytes). */
export declare function backupStateDb(dbPath: string): void;
/** Preserve a corrupted database for inspection before deleting. */
export declare function preserveCorruptedDb(dbPath: string): void;
//# sourceMappingURL=migrations.d.ts.map