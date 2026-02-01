/**
 * Idempotency tests
 *
 * Tests that retry operations don't create duplicate content.
 * Verifies that same operation applied multiple times produces same result.
 */
import type { ReliabilityTestResult, ReliabilityTestConfig } from './types.js';
/**
 * Simulate append-to-section operation
 */
export declare function appendToSection(vaultPath: string, notePath: string, section: string, content: string): Promise<boolean>;
/**
 * Check if content already exists in section (for idempotency)
 */
export declare function contentExistsInSection(vaultPath: string, notePath: string, section: string, content: string): Promise<boolean>;
/**
 * Idempotent append - only adds if content doesn't exist
 */
export declare function idempotentAppendToSection(vaultPath: string, notePath: string, section: string, content: string): Promise<{
    added: boolean;
    alreadyExists: boolean;
}>;
/**
 * Test: Retrying non-idempotent append creates duplicates
 */
export declare function testNonIdempotentAppend(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Idempotent append prevents duplicates
 */
export declare function testIdempotentAppend(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Test: Timestamp-based content is inherently non-idempotent
 */
export declare function testTimestampIdempotency(config: ReliabilityTestConfig): Promise<ReliabilityTestResult>;
/**
 * Run all idempotency tests
 */
export declare function runIdempotencyTests(config: ReliabilityTestConfig): Promise<ReliabilityTestResult[]>;
//# sourceMappingURL=idempotencyTest.d.ts.map