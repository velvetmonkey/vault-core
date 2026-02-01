/**
 * Regression detection - compare results against baseline
 */
import * as fs from 'node:fs/promises';
/**
 * Default regression thresholds (percentage change that triggers regression)
 */
export const DEFAULT_THRESHOLDS = {
    mean_ms: 20, // 20% slower mean
    p95_ms: 25, // 25% slower P95
    memory_mb: 50 // 50% more memory
};
/**
 * Detect regressions by comparing against a baseline file
 */
export async function detectRegressions(current, baselinePath, options = {}) {
    let baseline;
    try {
        const content = await fs.readFile(baselinePath, 'utf-8');
        baseline = JSON.parse(content);
    }
    catch (error) {
        console.warn(`Could not load baseline from ${baselinePath}: ${error}`);
        return [];
    }
    return compareResults(current, baseline, options);
}
/**
 * Compare two benchmark results and find regressions
 */
export function compareResults(current, baseline, options = {}) {
    const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
    const metrics = options.metrics || ['mean_ms', 'p95_ms'];
    const regressions = [];
    for (const [scale, currentScale] of Object.entries(current.scales)) {
        const baselineScale = baseline.scales[scale];
        if (!baselineScale)
            continue;
        for (const [benchmarkName, currentMetrics] of Object.entries(currentScale)) {
            const baselineMetrics = baselineScale[benchmarkName];
            if (!baselineMetrics)
                continue;
            for (const metric of metrics) {
                const baselineValue = baselineMetrics[metric];
                const currentValue = currentMetrics[metric];
                if (typeof baselineValue !== 'number' || typeof currentValue !== 'number') {
                    continue;
                }
                const changePercent = ((currentValue - baselineValue) / baselineValue) * 100;
                const threshold = thresholds[metric] || 20;
                // Only flag if regression (positive change = slower/more)
                if (changePercent > threshold) {
                    regressions.push({
                        benchmark: benchmarkName,
                        scale: Number(scale),
                        metric,
                        baseline: baselineValue,
                        current: currentValue,
                        change_percent: changePercent,
                        threshold_percent: threshold
                    });
                }
            }
        }
    }
    return regressions;
}
/**
 * Check if any regressions exceed critical thresholds
 */
export function hasCriticalRegressions(regressions, criticalThreshold = 50) {
    return regressions.some(r => r.change_percent > criticalThreshold);
}
/**
 * Save current results as new baseline
 */
export async function saveBaseline(result, baselinePath) {
    await fs.writeFile(baselinePath, JSON.stringify(result, null, 2), 'utf-8');
}
/**
 * Load baseline from file
 */
export async function loadBaseline(baselinePath) {
    try {
        const content = await fs.readFile(baselinePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Format regressions as CI-friendly output
 */
export function formatRegressionsForCI(regressions) {
    if (regressions.length === 0) {
        return '✅ No regressions detected';
    }
    const lines = [
        '❌ Performance regressions detected:',
        ''
    ];
    for (const r of regressions) {
        lines.push(`  - ${r.benchmark} @ ${r.scale.toLocaleString()} notes: ${r.metric} +${r.change_percent.toFixed(1)}% (threshold: ${r.threshold_percent}%)`);
        lines.push(`    Baseline: ${r.baseline.toFixed(2)}ms → Current: ${r.current.toFixed(2)}ms`);
    }
    return lines.join('\n');
}
/**
 * Exit with error if regressions found (for CI)
 */
export function exitIfRegressions(regressions, exitCode = 1) {
    if (regressions.length > 0) {
        console.error(formatRegressionsForCI(regressions));
        process.exit(exitCode);
    }
}
//# sourceMappingURL=regression.js.map