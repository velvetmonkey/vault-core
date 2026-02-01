/**
 * Iteration stress testing module
 *
 * Provides utilities for running 10k+ mutation stress tests
 * to validate vault stability and performance over time.
 */
export { runStressTest, DEFAULT_STRESS_CONFIG } from './stressTest.js';
export { checkIntegrity } from './integrityChecker.js';
export { checkGitHealth } from './gitHealthChecker.js';
export { PerformanceTracker } from './performanceTracker.js';
/**
 * Simplified config for iteration stress testing
 */
export interface IterationStressConfig {
    vaultPath: string;
    iterations: number;
    checkpointInterval?: number;
    operations?: {
        add_to_section?: number;
        toggle_task?: number;
        update_frontmatter?: number;
        create_note?: number;
        delete_note?: number;
    };
}
/**
 * Result from iteration stress test
 */
export interface IterationStressResult {
    totalIterations: number;
    successfulIterations: number;
    failedIterations: number;
    duration_ms: number;
    integrityPassed: boolean;
    gitHealthPassed: boolean;
    memoryStable: boolean;
    checkpoints?: Array<{
        iteration: number;
        latency_ms: number;
        memory_mb: number;
    }>;
}
/**
 * Run a simplified iteration stress test
 *
 * This is a wrapper around runStressTest with sensible defaults.
 */
export declare function runIterationStressTest(config: IterationStressConfig): Promise<IterationStressResult>;
//# sourceMappingURL=index.d.ts.map