/**
 * Vault integrity tests
 *
 * Tests that vault state remains consistent after various operations.
 * Verifies no corruption, orphaned files, or missing data.
 */
import type { ReliabilityTestResult, ReliabilityTestConfig, IntegrityCheckResult } from './types.js';
/**
 * Check vault integrity
 */
export declare function checkVaultIntegrity(vaultPath: string): Promise<IntegrityCheckResult>;
/**
 * Test: Basic integrity check on fresh vault
 */
export declare function testFreshVaultIntegrity(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Integrity after multiple mutations
 */
export declare function testIntegrityAfterMutations(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Detect corrupted file
 */
export declare function testCorruptionDetection(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Run all integrity tests
 */
export declare function runIntegrityTests(config: ReliabilityTestConfig): Promise<ReliabilityTestResult[]>;
//# sourceMappingURL=integrityTest.d.ts.map