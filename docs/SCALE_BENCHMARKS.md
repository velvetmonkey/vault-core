# Scale Benchmarks

This document describes the scale testing methodology and results for the Flywheel ecosystem.

## Target Performance

| Vault Size | Index Build | Mutation P95 | Memory |
|------------|-------------|--------------|--------|
| 1k notes | <1s | <50ms | <100MB |
| 10k notes | <5s | <100ms | <300MB |
| 50k notes | <15s | <100ms | <800MB |
| 100k notes | <30s | <150ms | <1.5GB |

## Methodology

### Vault Generation

Test vaults are generated using seeded random generation for reproducibility:

```bash
npm run generate -- --size 10000 --output /tmp/vault --seed 12345
```

Generated vaults include:
- Realistic markdown content
- Configurable link density (avg 3.5 links per note)
- Entity distribution (people, projects, topics)
- Folder hierarchy (up to 4 levels)
- Frontmatter variety (70% of notes)

### Benchmark Execution

Benchmarks measure:

1. **Index Build Time**: Time to scan vault and build entity index
2. **Mutation Latency**: Time to execute a single mutation operation
   - P50, P95, P99 percentiles
3. **Memory Usage**: Peak heap usage during operations
4. **Git Performance**: Time for git add/commit operations

### Regression Detection

Each benchmark run is compared against baseline thresholds. Regressions are flagged when:

- Index build exceeds threshold by >20%
- P95 mutation latency exceeds threshold
- Memory usage exceeds threshold by >50%

## Running Benchmarks

### Quick Benchmarks (CI)

Run on every push:

```bash
# 1k vault
npm run generate -- --size 1000 --output /tmp/vault-1k --seed 12345
npm run bench -- --vault /tmp/vault-1k --output results-1k.json

# 10k vault
npm run generate -- --size 10000 --output /tmp/vault-10k --seed 12345
npm run bench -- --vault /tmp/vault-10k --output results-10k.json

# Check regressions
npm run check-regression -- results-1k.json results-10k.json
```

### Full Benchmarks (Nightly)

Run nightly or on release:

```bash
npm run bench:all
```

This runs all scales (1k, 10k, 50k, 100k) and generates a comprehensive report.

## Iteration Stability

Beyond raw performance, we validate long-term stability:

| Metric | Target |
|--------|--------|
| 10k mutations without corruption | Required |
| Performance degradation | <2x over time |
| Git repo size growth | Linear |
| Memory leaks | None |

### Iteration Stress Test

```bash
npm run iteration-stress -- --vault /tmp/vault --iterations 10000
```

Validates:
- Vault integrity after 10k operations
- Git repository health
- Memory stability (no leaks)
- Consistent performance over time

## CI Integration

### GitHub Actions Workflows

**ci.yml** (every push):
- Build and unit tests
- 1k and 10k benchmarks
- Reliability tests

**benchmark-full.yml** (nightly):
- All scale benchmarks (1k, 10k, 50k, 100k)
- 10k iteration stress test
- Performance regression detection
- Artifact upload for analysis

## Results Archive

Benchmark results are archived as GitHub Actions artifacts with 90-day retention.

Format:
```json
{
  "timestamp": "2026-02-01T19:30:00Z",
  "commit": "abc1234",
  "scale": 10000,
  "metrics": {
    "indexBuild_ms": 1234,
    "mutation_p95_ms": 45,
    "mutation_mean_ms": 28,
    "memory_mb": 245
  }
}
```

## Reproduction

To reproduce benchmark results:

1. Use the same seed for vault generation
2. Run on similar hardware (GitHub Actions ubuntu-latest)
3. Ensure clean environment (no background processes)

```bash
# Exact reproduction
npm run generate -- --size 10000 --output /tmp/vault --seed 12345
npm run bench -- --vault /tmp/vault --output results.json
```
