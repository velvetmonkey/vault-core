/**
 * Reliability stress test suite
 *
 * Comprehensive tests for vault mutation reliability:
 * - Rollback verification
 * - Lock contention handling
 * - Idempotency checks
 * - Integrity verification
 */
import type { ReliabilityTestResult } from './types.js';
export * from './types.js';
export { runRollbackTests } from './rollbackTest.js';
export { runLockContentionTests } from './lockContentionTest.js';
export { runIdempotencyTests } from './idempotencyTest.js';
export { runIntegrityTests } from './integrityTest.js';
/**
 * Summary of reliability test results
 */
export interface ReliabilitySummary {
    /** Total tests run */
    total: number;
    /** Tests passed */
    passed: number;
    /** Tests failed */
    failed: number;
    /** Pass rate as percentage */
    passRate: number;
    /** Total duration in ms */
    duration_ms: number;
    /** Results by category */
    categories: {
        rollback: {
            passed: number;
            failed: number;
        };
        lockContention: {
            passed: number;
            failed: number;
        };
        idempotency: {
            passed: number;
            failed: number;
        };
        integrity: {
            passed: number;
            failed: number;
        };
    };
    /** All individual results */
    results: ReliabilityTestResult[];
}
/**
 * Create a temporary test directory
 */
export declare function createTestDir(basePath: string, name: string): Promise<string>;
/**
 * Clean up test directory
 */
export declare function cleanupTestDir(testDir: string): Promise<void>;
/**
 * Run all reliability tests
 */
export declare function runAllReliabilityTests(basePath: string, options?: {
    iterations?: number;
    timeout?: number;
}): Promise<ReliabilitySummary>;
/**
 * Print test summary to console
 */
export declare function printReliabilitySummary(summary: ReliabilitySummary): void;
//# sourceMappingURL=index.d.ts.map