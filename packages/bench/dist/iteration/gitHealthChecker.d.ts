/**
 * Git health checking - validate .git directory health
 */
import type { GitHealthResult } from '../types.js';
/**
 * Check git repository health
 */
export declare function checkGitHealth(vaultPath: string): Promise<GitHealthResult>;
/**
 * Run git maintenance operations
 */
export declare function runGitMaintenance(vaultPath: string): Promise<void>;
/**
 * Get git repository statistics
 */
export declare function getGitStats(vaultPath: string): Promise<{
    commitCount: number;
    branchCount: number;
    firstCommit: string | null;
    lastCommit: string | null;
}>;
/**
 * Measure git operation performance
 */
export declare function measureGitPerformance(vaultPath: string): Promise<{
    status_ms: number;
    log_ms: number;
    diff_ms: number;
}>;
//# sourceMappingURL=gitHealthChecker.d.ts.map