/**
 * SQLite Schema Migrations
 *
 * Database path resolution, schema initialization, migration logic,
 * database file management, backup rotation, integrity checks, and
 * feedback salvage utilities.
 */
import Database from 'better-sqlite3';
export declare const BACKUP_ROTATION_COUNT = 3;
/** High-value tables whose data should survive a corruption recovery. */
export declare const SALVAGE_TABLES: readonly ["wikilink_feedback", "wikilink_applications", "suggestion_events", "wikilink_suppressions", "note_links", "note_link_history", "memories", "session_summaries", "corrections", "tool_selection_feedback"];
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
/**
 * Rotate existing backup files: .backup → .backup.1 → .backup.2 → .backup.3
 * Drops the oldest if rotation count exceeded. Does NOT create a new backup.
 */
export declare function rotateBackupFiles(dbPath: string): void;
/**
 * Create a WAL-safe backup using SQLite's backup API.
 * Rotates existing backups first, then writes a new .backup file.
 */
export declare function safeBackupAsync(db: Database.Database, dbPath: string): Promise<boolean>;
/**
 * Run PRAGMA quick_check on the database.
 * Returns { ok: true } or { ok: false, detail: string }.
 */
export declare function checkDbIntegrity(db: Database.Database): {
    ok: boolean;
    detail?: string;
};
/**
 * Attempt to copy high-value feedback tables from a source DB into the target.
 * Opens source read-only; copies rows with INSERT OR IGNORE.
 * Handles missing tables and column mismatches gracefully.
 */
export declare function salvageFeedbackTables(targetDb: Database.Database, sourceDbPath: string): Record<string, number>;
/**
 * After corruption forces a fresh DB, attempt to recover feedback data
 * from all available backup files (newest first) and the corrupt file.
 * Merges across all sources — INSERT OR IGNORE deduplicates, so each
 * successive source only adds rows the previous ones didn't cover.
 */
export declare function attemptSalvage(targetDb: Database.Database, dbPath: string): void;
//# sourceMappingURL=migrations.d.ts.map