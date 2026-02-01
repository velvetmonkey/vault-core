/**
 * Regression detection - compare results against baseline
 */
import type { BenchmarkResult, Regression } from '../types.js';
/**
 * Default regression thresholds (percentage change that triggers regression)
 */
export declare const DEFAULT_THRESHOLDS: {
    mean_ms: number;
    p95_ms: number;
    memory_mb: number;
};
export interface RegressionOptions {
    /** Threshold percentages per metric */
    thresholds?: Partial<typeof DEFAULT_THRESHOLDS>;
    /** Metrics to check */
    metrics?: Array<keyof typeof DEFAULT_THRESHOLDS>;
}
/**
 * Detect regressions by comparing against a baseline file
 */
export declare function detectRegressions(current: BenchmarkResult, baselinePath: string, options?: RegressionOptions): Promise<Regression[]>;
/**
 * Compare two benchmark results and find regressions
 */
export declare function compareResults(current: BenchmarkResult, baseline: BenchmarkResult, options?: RegressionOptions): Regression[];
/**
 * Check if any regressions exceed critical thresholds
 */
export declare function hasCriticalRegressions(regressions: Regression[], criticalThreshold?: number): boolean;
/**
 * Save current results as new baseline
 */
export declare function saveBaseline(result: BenchmarkResult, baselinePath: string): Promise<void>;
/**
 * Load baseline from file
 */
export declare function loadBaseline(baselinePath: string): Promise<BenchmarkResult | null>;
/**
 * Format regressions as CI-friendly output
 */
export declare function formatRegressionsForCI(regressions: Regression[]): string;
/**
 * Exit with error if regressions found (for CI)
 */
export declare function exitIfRegressions(regressions: Regression[], exitCode?: number): void;
//# sourceMappingURL=regression.d.ts.map