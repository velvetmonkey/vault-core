/**
 * Operation logger - main logging interface
 */
import type { OperationLogEntry, AggregatedMetrics, LoggingConfig, FlywheelConfig, ToolMetrics } from './types.js';
/**
 * Main operation logger
 */
export declare class OperationLogger {
    private writer;
    private config;
    constructor(config: LoggingConfig);
    /**
     * Check if logging is enabled
     */
    get enabled(): boolean;
    /**
     * Log an operation
     */
    logOperation(tool: string, vault: string, duration_ms: number, success: boolean, details?: Partial<Omit<OperationLogEntry, 'timestamp' | 'tool' | 'vault' | 'duration_ms' | 'success'>>): Promise<void>;
    /**
     * Wrap an async operation with logging
     */
    wrap<T>(tool: string, vault: string, operation: () => Promise<T>, getDetails?: (result: T) => Partial<OperationLogEntry>): Promise<T>;
    /**
     * Get metrics for a time period
     */
    getMetrics(since?: Date, until?: Date): Promise<AggregatedMetrics>;
    /**
     * Get metrics for a specific tool
     */
    getToolMetrics(tool: string, since?: Date): Promise<ToolMetrics | null>;
}
/**
 * Load flywheel config from vault
 */
export declare function loadFlywheelConfig(vaultPath: string): Promise<FlywheelConfig>;
/**
 * Create a logger from vault config
 */
export declare function createLoggerFromVault(vaultPath: string): Promise<OperationLogger>;
/**
 * Format metrics as a report
 */
export declare function formatMetricsReport(metrics: AggregatedMetrics): string;
//# sourceMappingURL=logger.d.ts.map