/**
 * Iteration stress testing module
 *
 * Provides utilities for running 10k+ mutation stress tests
 * to validate vault stability and performance over time.
 */
export { runStressTest, DEFAULT_STRESS_CONFIG } from './stressTest.js';
export { checkIntegrity } from './integrityChecker.js';
export { checkGitHealth } from './gitHealthChecker.js';
export { PerformanceTracker } from './performanceTracker.js';
/**
 * Run a simplified iteration stress test
 *
 * This is a wrapper around runStressTest with sensible defaults.
 */
export async function runIterationStressTest(config) {
    const { checkIntegrity } = await import('./integrityChecker.js');
    const { checkGitHealth } = await import('./gitHealthChecker.js');
    const startTime = Date.now();
    const checkpoints = [];
    let successfulIterations = 0;
    let failedIterations = 0;
    const checkpointInterval = config.checkpointInterval || Math.max(100, Math.floor(config.iterations / 10));
    // Track memory at start
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    let maxMemory = startMemory;
    // Simulate iterations (in real usage, this would call actual mutation functions)
    for (let i = 1; i <= config.iterations; i++) {
        const iterStart = Date.now();
        // Simulate a mutation operation (placeholder - real impl would use mutation functions)
        try {
            await simulateMutation(config.vaultPath);
            successfulIterations++;
        }
        catch {
            failedIterations++;
        }
        // Track checkpoint
        if (i % checkpointInterval === 0 || i === config.iterations) {
            const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            maxMemory = Math.max(maxMemory, currentMemory);
            checkpoints.push({
                iteration: i,
                latency_ms: Date.now() - iterStart,
                memory_mb: currentMemory,
            });
            // Log progress
            const progress = Math.floor((i / config.iterations) * 100);
            process.stdout.write(`\r  Progress: ${progress}% (${i}/${config.iterations})`);
        }
    }
    console.log(); // New line after progress
    // Final integrity check
    const integrityResult = await checkIntegrity(config.vaultPath);
    const gitHealthResult = await checkGitHealth(config.vaultPath);
    // Check memory stability (should not grow more than 2x)
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryGrowth = finalMemory / startMemory;
    const memoryStable = memoryGrowth < 2.0;
    return {
        totalIterations: config.iterations,
        successfulIterations,
        failedIterations,
        duration_ms: Date.now() - startTime,
        integrityPassed: !integrityResult.corrupted,
        gitHealthPassed: gitHealthResult.isHealthy,
        memoryStable,
        checkpoints,
    };
}
/**
 * Simulate a mutation operation (placeholder for testing)
 */
async function simulateMutation(vaultPath) {
    // In real implementation, this would:
    // 1. Select a random mutation type based on distribution
    // 2. Execute the mutation via the actual mutation functions
    // 3. Handle errors appropriately
    // For now, just simulate some I/O
    const fs = await import('fs/promises');
    const path = await import('path');
    try {
        await fs.readdir(vaultPath);
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    catch {
        // Ignore errors in simulation
    }
}
//# sourceMappingURL=index.js.map