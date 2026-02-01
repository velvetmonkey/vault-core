/**
 * Rollback verification tests
 *
 * Tests that policy rollback works correctly when git operations fail.
 * Ensures vault state is restored to pre-execution state on failure.
 */
import type { ReliabilityTestResult, ReliabilityTestConfig, StagedFileInfo } from './types.js';
/**
 * Create a test vault with sample files
 */
export declare function createTestVault(config: ReliabilityTestConfig): Promise<string[]>;
/**
 * Read all files in vault for comparison
 */
export declare function readVaultState(vaultPath: string, files: string[]): Promise<Map<string, string>>;
/**
 * Compare two vault states
 */
export declare function compareVaultStates(before: Map<string, string>, after: Map<string, string>): {
    changed: string[];
    unchanged: string[];
};
/**
 * Simulate a multi-file mutation that should be rolled back
 */
export declare function simulateMultiFileMutation(vaultPath: string, files: string[], newContents: Map<string, string>): Promise<StagedFileInfo[]>;
/**
 * Rollback staged files to their original state
 */
export declare function rollbackStagedFiles(vaultPath: string, staged: StagedFileInfo[]): Promise<void>;
/**
 * Test: Verify rollback restores all files after simulated git failure
 */
export declare function testRollbackOnGitFailure(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Verify rollback handles new file creation correctly
 */
export declare function testRollbackNewFiles(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Verify partial rollback (some files succeed, some fail)
 */
export declare function testPartialRollback(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Run all rollback tests
 */
export declare function runRollbackTests(config: ReliabilityTestConfig): Promise<ReliabilityTestResult[]>;
//# sourceMappingURL=rollbackTest.d.ts.map