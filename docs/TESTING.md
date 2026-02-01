# Testing Documentation

This document describes the testing infrastructure for the vault-core monorepo.

## Test Suites

### Core Package (`@velvetmonkey/vault-core`)

The core package contains shared utilities for the Flywheel ecosystem.

| Suite | Description | Test Count |
|-------|-------------|------------|
| Entity Scanning | Vault scanning, categorization, caching | ~15 |
| Protected Zones | Code block, frontmatter, wikilink protection | ~20 |
| Wikilinks | Link application, alias support, suggestions | ~30 |
| Implicit Entities | Pattern-based entity detection | ~20 |
| Operation Logging | Unified logging, session management | ~15 |

### Bench Package (`@velvetmonkey/flywheel-bench`)

The bench package provides testing infrastructure for the entire ecosystem.

| Suite | Description | Test Count |
|-------|-------------|------------|
| Vault Generator | Seeded vault generation, configs | ~15 |
| Benchmark Harness | Timing, metrics, regression detection | ~10 |
| Iteration Stress | 10k+ mutation stability | ~10 |
| Reliability | Rollback, lock contention, idempotency | ~30 |

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests for a specific package
cd packages/core && npm test
cd packages/bench && npm test

# Run tests in watch mode
cd packages/core && npm run test:watch
```

### Reliability Tests

```bash
# Run the full reliability suite
cd packages/bench && npm run test:reliability

# Run with custom parameters
cd packages/bench && npm run test:reliability -- --iterations=500 --timeout=60000
```

### Benchmark Tests

```bash
# Generate a test vault
cd packages/bench && npm run generate -- --size 1000 --output /tmp/vault --seed 12345

# Run benchmarks
cd packages/bench && npm run bench -- --vault /tmp/vault --output results.json

# Check for regressions
cd packages/bench && npm run check-regression -- results.json
```

### Iteration Stress Tests

```bash
# Run 10k mutation stress test
cd packages/bench && npm run iteration-stress -- --vault /tmp/vault --iterations 10000
```

## Test Categories

### Unit Tests

Standard unit tests that verify individual functions work correctly in isolation.

### Integration Tests

Tests that verify multiple components work together correctly.

### Reliability Tests

Stress tests that verify the system handles failure scenarios correctly:

- **Rollback Tests**: Verify vault returns to clean state after failures
- **Lock Contention Tests**: Verify proper handling of git lock conflicts
- **Idempotency Tests**: Verify retry operations don't cause duplicates
- **Integrity Tests**: Verify vault structure remains valid after many operations

### Performance Tests

Benchmarks that measure operation timing and memory usage at various scales:

- Index build time
- Mutation latency (P50, P95, P99)
- Memory consumption
- Git repository growth

## CI Integration

### On Every Push

- Build verification (TypeScript compilation)
- Unit tests (all packages)
- 1k and 10k scale benchmarks
- Reliability tests

### Nightly / Release

- Full benchmark suite (1k, 10k, 50k, 100k)
- 10k iteration stress test
- Performance regression detection

## Test Fixtures

Test fixtures are located in each package's `test/` directory:

```
packages/
  core/
    test/
      fixtures/
        sample-vault/      # Sample vault for testing
        malformed-notes/   # Edge cases for parsing
  bench/
    test/
      fixtures/
        configs/           # Preset vault configurations
```

## Writing Tests

### Test Style Guide

1. Use descriptive test names that explain the scenario
2. Follow the Arrange-Act-Assert pattern
3. Use `describe` blocks to group related tests
4. Include edge cases and error scenarios

```typescript
describe('applyWikilinks', () => {
  it('should link first occurrence only by default', () => {
    // Arrange
    const content = 'React is great. I love React.';
    const entities = ['React'];

    // Act
    const result = applyWikilinks(content, entities);

    // Assert
    expect(result.content).toBe('[[React]] is great. I love React.');
    expect(result.linksAdded).toBe(1);
  });
});
```

### Test Configuration

Tests use Vitest with the following configuration:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```
