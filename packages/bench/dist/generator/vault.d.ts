/**
 * Main vault generator - creates complete test vaults
 */
import type { VaultConfig, GeneratedVault } from '../types.js';
/**
 * Default vault configuration presets
 */
export declare const VAULT_PRESETS: Record<string, Omit<VaultConfig, 'outputDir' | 'seed'>>;
/**
 * Generate a complete test vault
 */
export declare function generateVault(config: VaultConfig): Promise<GeneratedVault>;
/**
 * Load a vault config from a preset or file
 */
export declare function loadVaultConfig(preset: string, outputDir: string, seed?: number): Promise<VaultConfig>;
/**
 * Quick vault generation for testing
 */
export declare function generateQuickVault(outputDir: string, noteCount: number, seed?: number): Promise<GeneratedVault>;
//# sourceMappingURL=vault.d.ts.map