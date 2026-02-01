/**
 * Performance tracking over time - detect degradation
 */
import type { PerformanceSnapshot } from '../types.js';
/**
 * Performance tracker for monitoring degradation over iterations
 */
export declare class PerformanceTracker {
    private snapshots;
    private windowSize;
    constructor(windowSize?: number);
    /**
     * Record a performance snapshot
     */
    record(iteration: number, latency_ms: number): void;
    /**
     * Get all snapshots
     */
    getSnapshots(): PerformanceSnapshot[];
    /**
     * Calculate moving average of latency
     */
    getMovingAverage(windowSize?: number): number[];
    /**
     * Detect performance degradation
     * Returns degradation factor (1.0 = no change, 2.0 = 2x slower)
     */
    getDegradationFactor(): number;
    /**
     * Get memory growth statistics
     */
    getMemoryGrowth(): {
        initial_mb: number;
        final_mb: number;
        peak_mb: number;
        growth_percent: number;
    };
    /**
     * Get latency statistics
     */
    getLatencyStats(): {
        mean_ms: number;
        min_ms: number;
        max_ms: number;
        p50_ms: number;
        p95_ms: number;
        p99_ms: number;
    };
    /**
     * Check if performance is within acceptable bounds
     */
    isHealthy(maxDegradation?: number, maxMemoryGrowth?: number): boolean;
    /**
     * Generate performance report
     */
    generateReport(): string;
    /**
     * Save snapshots to file
     */
    saveToFile(filepath: string): Promise<void>;
    /**
     * Load snapshots from file
     */
    loadFromFile(filepath: string): Promise<void>;
    /**
     * Clear all snapshots
     */
    clear(): void;
}
/**
 * Simple timing helper
 */
export declare function timeOperation<T>(fn: () => T): {
    result: T;
    duration_ms: number;
};
/**
 * Async timing helper
 */
export declare function timeAsyncOperation<T>(fn: () => Promise<T>): Promise<{
    result: T;
    duration_ms: number;
}>;
//# sourceMappingURL=performanceTracker.d.ts.map