/**
 * Lock contention tests
 *
 * Tests that policies correctly detect and handle git lock contention.
 * Verifies fail-fast behavior when .git/index.lock exists.
 */
import { SimpleGit } from 'simple-git';
import type { ReliabilityTestResult, ReliabilityTestConfig } from './types.js';
/**
 * Check if git lock file exists
 */
export declare function checkLockExists(vaultPath: string): Promise<boolean>;
/**
 * Create a lock file to simulate git lock contention
 */
export declare function createLockFile(vaultPath: string): Promise<void>;
/**
 * Remove lock file
 */
export declare function removeLockFile(vaultPath: string): Promise<void>;
/**
 * Initialize git repo if not exists
 */
export declare function ensureGitRepo(vaultPath: string): Promise<SimpleGit>;
/**
 * Test: Detect lock file before mutation
 */
export declare function testLockDetection(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Fail fast when lock exists (no file mutation should occur)
 */
export declare function testFailFastOnLock(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Lock age detection (stale vs fresh)
 */
export declare function testLockAgeDetection(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Concurrent commit attempts should serialize
 */
export declare function testConcurrentCommits(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Run all lock contention tests
 */
export declare function runLockContentionTests(config: ReliabilityTestConfig): Promise<ReliabilityTestResult[]>;
//# sourceMappingURL=lockContentionTest.d.ts.map