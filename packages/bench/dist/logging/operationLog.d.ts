/**
 * JSONL operation log writer
 */
import type { OperationLogEntry, LoggingConfig } from './types.js';
/**
 * JSONL log writer with rotation support
 */
export declare class OperationLogWriter {
    private config;
    private writeQueue;
    private isWriting;
    constructor(config: LoggingConfig);
    /**
     * Append a log entry
     */
    write(entry: OperationLogEntry): Promise<void>;
    /**
     * Flush queued entries to disk
     */
    private flush;
    /**
     * Check if log rotation is needed
     */
    private checkRotation;
    /**
     * Rotate log files
     */
    private rotate;
    /**
     * Apply privacy settings to entry
     */
    private sanitizeEntry;
    /**
     * Anonymize a path (keep structure, hash identifiers)
     */
    private anonymizePath;
    /**
     * Simple string hash for anonymization
     */
    private simpleHash;
}
/**
 * Read and parse a JSONL log file
 */
export declare function readOperationLog(logPath: string, options?: {
    since?: Date;
    until?: Date;
    tool?: string;
}): Promise<OperationLogEntry[]>;
/**
 * Get log file statistics
 */
export declare function getLogStats(logPath: string): Promise<{
    entries: number;
    size_mb: number;
    oldest?: string;
    newest?: string;
}>;
//# sourceMappingURL=operationLog.d.ts.map