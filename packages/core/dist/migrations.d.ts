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
export declare const SALVAGE_TABLES: readonly ["wikilink_feedback", "wikilink_applications", "suggestion_events", "wikilink_suppressions", "note_links", "note_link_history", "memories", "session_summaries", "corrections", "tool_selection_feedback", "prospect_ledger", "prospect_summary", "prospect_feedback"];
/**
 * Get the database path for a vault
 */
export declare function getStateDbPath(vaultPath: string): string;
/**
 * Initialize schema and run migrations
 */
export declare function initSchema(db: Database.Database): void;
/**
 * Run the v40 migration: add COLLATE NOCASE to path columns across 14 tables,
 * collapsing mixed-case duplicates with table-specific conflict resolution.
 *
 * Safety:
 * - Wrapped in a single db.transaction(). better-sqlite3 supports transactional
 *   DDL (CREATE/DROP/ALTER RENAME participate in transactions), so any rebuild
 *   failure rolls back the whole batch. Partial-upgrade state is impossible.
 * - Caller (openStateDb) runs a synchronous VACUUM INTO backup before calling
 *   initSchema when upgrading from < v40.
 * - No VACUUM or PRAGMA statements inside the transaction (they auto-commit).
 * - Foreign keys disabled for the duration to permit DROP TABLE on referenced
 *   tables. Re-enabled at the end.
 *
 * Conflict resolution per table (see p42 v40 plan S3 for full rationale):
 *
 * | Table                  | Rule                                               |
 * |------------------------|----------------------------------------------------|
 * | entities               | column alter (via rebuild) — no rows to merge      |
 * | note_embeddings        | MAX(updated_at)                                    |
 * | content_hashes         | MAX(updated_at)                                    |
 * | tasks                  | best-effort MAX(id); file scan reconciles          |
 * | note_links             | MAX(weight_updated_at), keep matching weight       |
 * | note_tags              | INSERT OR IGNORE — pure dedup, no values to merge  |
 * | note_link_history      | MIN(first_seen_at), MAX(edits_survived/last_pos)   |
 * | note_moves             | column alter — preserve all rows                   |
 * | suggestion_events      | MAX(total_score) per (timestamp, note, entity)     |
 * | corrections            | column alter — preserve all rows                   |
 * | prospect_ledger        | MIN first_seen, MAX last_seen, SUM sightings       |
 * | proactive_queue        | MAX(score), prefer 'pending' status                |
 * | retrieval_cooccurrence | SUM(weight), MIN(timestamp)                        |
 * | wikilink_feedback      | column alter — preserve all rows                   |
 */
export declare function migrateV40(db: Database.Database): boolean;
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