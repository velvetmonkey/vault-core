#!/usr/bin/env tsx
/**
 * CLI for aggregating benchmark results from multiple files
 *
 * Usage:
 *   npm run aggregate-results -- /path/to/*.json --output report.json
 */
import fs from 'fs/promises';
async function main() {
    const args = process.argv.slice(2);
    const outputIdx = args.indexOf('--output');
    const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : null;
    const files = args.filter((a, i) => !a.startsWith('--') && i !== outputIdx + 1);
    if (files.length === 0) {
        console.error('Usage: aggregate-results <result1.json> [result2.json ...] --output report.json');
        process.exit(1);
    }
    console.log(`Aggregating ${files.length} benchmark result files...\n`);
    const report = {
        generatedAt: new Date().toISOString(),
        scales: {},
        summary: {
            totalScales: 0,
            maxScale: 0,
            allPassed: true,
        },
    };
    for (const file of files) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            const result = JSON.parse(content);
            report.scales[String(result.scale)] = result;
            report.summary.totalScales++;
            if (result.scale > report.summary.maxScale) {
                report.summary.maxScale = result.scale;
            }
            if (!report.commit && result.commit) {
                report.commit = result.commit;
            }
            console.log(`  Loaded: ${file} (${result.scale} notes)`);
        }
        catch (error) {
            console.error(`  Error loading ${file}:`, error);
        }
    }
    console.log(`\nTotal scales aggregated: ${report.summary.totalScales}`);
    console.log(`Max scale: ${report.summary.maxScale}`);
    // Output report
    const output = JSON.stringify(report, null, 2);
    if (outputPath) {
        await fs.writeFile(outputPath, output);
        console.log(`\nReport written to: ${outputPath}`);
    }
    else {
        console.log('\n=== Aggregated Report ===');
        console.log(output);
    }
    process.exit(0);
}
main();
//# sourceMappingURL=aggregate-results.js.map