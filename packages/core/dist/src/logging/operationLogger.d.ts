/**
 * Shared OperationLogger for Flywheel ecosystem
 *
 * Provides unified logging for both Flywheel (read) and Flywheel Memory (write)
 * with session correlation, metrics aggregation, and privacy controls.
 */
import type { OperationLogEntry, SessionMetrics, AggregatedMetrics, LoggingConfig, ProductId } from './types.js';
/**
 * Shared operation logger
 */
export declare class OperationLogger {
    private config;
    private vaultPath;
    private product;
    private writeQueue;
    private flushTimeout;
    constructor(vaultPath: string, product: ProductId, config?: Partial<LoggingConfig>);
    /**
     * Check if logging is enabled
     */
    get enabled(): boolean;
    /**
     * Log an operation
     */
    log(entry: Omit<OperationLogEntry, 'ts' | 'product' | 'session'>): Promise<void>;
    /**
     * Wrap an async operation with automatic logging
     */
    wrap<T>(tool: string, operation: () => Promise<T>, getDetails?: (result: T) => Partial<OperationLogEntry>): Promise<T>;
    /**
     * Get metrics for current session
     */
    getSessionMetrics(): Promise<SessionMetrics | null>;
    /**
     * Get aggregated metrics for time period
     */
    getMetrics(since?: Date, until?: Date): Promise<AggregatedMetrics>;
    /**
     * Flush write queue to disk
     */
    flush(): Promise<void>;
    /**
     * Read all log entries
     */
    private readEntries;
    /**
     * Anonymize vault path for privacy
     */
    private anonymizePath;
    /**
     * Schedule a flush with debounce
     */
    private scheduleFlush;
}
/**
 * Create logger from vault's .flywheel.json config
 */
export declare function createLoggerFromConfig(vaultPath: string, product: ProductId): Promise<OperationLogger>;
//# sourceMappingURL=operationLogger.d.ts.map