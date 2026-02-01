/**
 * Vault integrity checking - detect corruption after mutations
 */
import type { IntegrityCheckResult } from '../types.js';
/**
 * Check vault integrity
 */
export declare function checkIntegrity(vaultPath: string): Promise<Omit<IntegrityCheckResult, 'iteration'>>;
/**
 * Detailed integrity report
 */
export declare function generateIntegrityReport(vaultPath: string): Promise<string>;
//# sourceMappingURL=integrityChecker.d.ts.map