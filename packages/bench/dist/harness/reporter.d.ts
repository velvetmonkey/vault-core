/**
 * Benchmark result reporting - JSON and Markdown output
 */
import type { BenchmarkResult } from '../types.js';
/**
 * Write benchmark results to JSON file
 */
export declare function writeJsonReport(result: BenchmarkResult, outputDir: string): Promise<string>;
/**
 * Write benchmark results to Markdown file
 */
export declare function writeMarkdownReport(result: BenchmarkResult, outputDir: string): Promise<string>;
/**
 * Print results to console
 */
export declare function printResults(result: BenchmarkResult): void;
/**
 * Create a comparison report between two benchmark results
 */
export declare function createComparisonReport(baseline: BenchmarkResult, current: BenchmarkResult): string;
//# sourceMappingURL=reporter.d.ts.map