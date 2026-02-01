/**
 * Benchmark runner - executes benchmarks and collects metrics
 */
import type { BenchmarkConfig, BenchmarkSuite, BenchmarkResult } from '../types.js';
/**
 * Default benchmark configuration
 */
export declare const DEFAULT_CONFIG: BenchmarkConfig;
/**
 * Main benchmark runner
 */
export declare class BenchmarkRunner {
    private config;
    private suites;
    constructor(config?: Partial<BenchmarkConfig>);
    /**
     * Register a benchmark suite
     */
    register(suite: BenchmarkSuite): this;
    /**
     * Register multiple benchmark suites
     */
    registerAll(suites: BenchmarkSuite[]): this;
    /**
     * Run all registered benchmarks
     */
    run(vaultPaths: Map<number, string>): Promise<BenchmarkResult>;
    /**
     * Run benchmarks for a single scale
     */
    private runScale;
    /**
     * Run a single benchmark suite
     */
    private runSuite;
}
/**
 * Create a simple benchmark suite from a function
 */
export declare function benchmark(name: string, fn: (vaultPath: string, size: number) => Promise<void>): BenchmarkSuite;
/**
 * Run benchmarks with a simpler API
 */
export declare function runBenchmarks(suites: BenchmarkSuite[], vaultPaths: Map<number, string>, config?: Partial<BenchmarkConfig>): Promise<BenchmarkResult>;
//# sourceMappingURL=runner.d.ts.map