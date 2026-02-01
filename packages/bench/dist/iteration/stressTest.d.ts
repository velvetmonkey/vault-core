/**
 * Stress testing - 10k+ mutation stability validation
 */
import type { StressTestConfig, StressTestResult } from '../types.js';
import { SeededRandom } from '../generator/notes.js';
/**
 * Default stress test configuration
 */
export declare const DEFAULT_STRESS_CONFIG: Omit<StressTestConfig, 'vaultPath'>;
/**
 * Run a stress test on a vault
 */
export declare function runStressTest(config: StressTestConfig, mutationFunctions: MutationFunctions): Promise<StressTestResult>;
/**
 * Interface for mutation functions
 */
export interface MutationFunctions {
    addToSection: (vaultPath: string, rng: SeededRandom) => Promise<void>;
    toggleTask: (vaultPath: string, rng: SeededRandom) => Promise<void>;
    updateFrontmatter: (vaultPath: string, rng: SeededRandom) => Promise<void>;
    createNote: (vaultPath: string, rng: SeededRandom) => Promise<void>;
    deleteNote: (vaultPath: string, rng: SeededRandom) => Promise<void>;
}
/**
 * Default mutation implementations for standalone testing
 */
export declare function createDefaultMutationFunctions(): MutationFunctions;
/**
 * Validate stress test results
 */
export declare function validateStressTestResults(result: StressTestResult): {
    passed: boolean;
    issues: string[];
};
//# sourceMappingURL=stressTest.d.ts.map