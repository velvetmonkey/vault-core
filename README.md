<div align="center">
  <img src="flywheel.png" alt="Flywheel" width="256"/>
  <h1>vault-core</h1>
  <p><strong>Shared infrastructure for the Flywheel ecosystem.</strong><br/>Entity scanning, wikilink application, protected zones, and benchmark tooling.</p>
</div>

[![CI](https://github.com/velvetmonkey/vault-core/actions/workflows/ci.yml/badge.svg)](https://github.com/velvetmonkey/vault-core/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@velvetmonkey/vault-core.svg)](https://www.npmjs.com/package/@velvetmonkey/vault-core)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Scale](https://img.shields.io/badge/scale-100k%20notes-brightgreen.svg)](./packages/bench/README.md)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue.svg)](https://github.com/velvetmonkey/vault-core)

## Verified Capabilities

- **100k Note Scale** -- Vault generation and benchmarking tested at 100,000 notes
- **Iteration Stress** -- 10,000+ sequential operations without corruption
- **Cross-Platform** -- Tested on Ubuntu, Windows, macOS (Intel + ARM)
- **Entity Detection** -- Porter stemmer + Adamic-Adar scoring for wikilink inference
- **Protected Zones** -- Code blocks, frontmatter, existing links preserved

---

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| **[@velvetmonkey/vault-core](./packages/core)** | Shared vault utilities (entity scanning, protected zones, wikilinks) | [![npm](https://img.shields.io/npm/v/@velvetmonkey/vault-core.svg)](https://www.npmjs.com/package/@velvetmonkey/vault-core) |
| **[@velvetmonkey/flywheel-bench](./packages/bench)** | Benchmark infrastructure (vault generation, performance testing, reliability) | [![npm](https://img.shields.io/npm/v/@velvetmonkey/flywheel-bench.svg)](https://www.npmjs.com/package/@velvetmonkey/flywheel-bench) |

---

## Quick Start

### Install vault-core

```bash
npm install @velvetmonkey/vault-core
```

```typescript
import { scanVaultEntities, applyWikilinks, getProtectedZones } from '@velvetmonkey/vault-core';

// Scan vault for entities
const index = await scanVaultEntities('/path/to/vault');

// Apply wikilinks safely
const result = applyWikilinks(content, entities);
```

### Install flywheel-bench (for testing)

```bash
npm install --save-dev @velvetmonkey/flywheel-bench
```

```typescript
import { generateVault, BenchmarkRunner } from '@velvetmonkey/flywheel-bench';

// Generate a test vault
await generateVault({
  outputDir: '/tmp/test-vault',
  noteCount: 10000,
  seed: 12345,
});

// Run benchmarks
const runner = new BenchmarkRunner({ vaultPath: '/tmp/test-vault' });
const results = await runner.run();
```

---

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/velvetmonkey/vault-core.git
cd vault-core
npm install
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run specific package tests
cd packages/core && npm test
cd packages/bench && npm test

# Run reliability tests
cd packages/bench && npm run test:reliability
```

### Test Suites

| Script | Package | Purpose |
|--------|---------|---------|
| `npm test` | All | Run all unit tests |
| `npm run test:e2e` | core | Cross-product integration tests |
| `npm run test:perf` | bench | Performance baseline benchmarks |
| `npm run test:memory` | bench | Memory scaling and leak detection |
| `npm run test:reliability` | bench | Rollback, lock contention, idempotency |

### Benchmarks

```bash
cd packages/bench

# Generate test vault
npm run generate -- --size 10000 --output /tmp/vault --seed 12345

# Run benchmarks
npm run bench -- --vault /tmp/vault

# Check for regressions
npm run check-regression -- results.json
```

---

## Documentation

- [Testing Guide](./docs/TESTING.md) -- Test infrastructure and methodology
- [Scale Benchmarks](./docs/SCALE_BENCHMARKS.md) -- Performance targets and results

---

## vault-core Package

Shared utilities for entity scanning, wikilink application, and vault operations.

### Entity Scanning

```typescript
import { scanVaultEntities, getAllEntities } from '@velvetmonkey/vault-core';

const index = await scanVaultEntities('/path/to/vault');
const entities = getAllEntities(index);
```

### Protected Zones

Detect regions that shouldn't be modified:

```typescript
import { getProtectedZones, isInProtectedZone } from '@velvetmonkey/vault-core';

const zones = getProtectedZones(content);
const safe = !isInProtectedZone(zones, position);
```

### Wikilinks

Apply or suggest wikilinks safely:

```typescript
import { applyWikilinks, processWikilinks, detectImplicitEntities } from '@velvetmonkey/vault-core';

// Link to known entities
const result = applyWikilinks(content, entities);

// Also detect and link implicit entities (proper nouns, etc.)
const extended = processWikilinks(content, entities, { detectImplicit: true });
```

### Operation Logging

Unified logging for cross-product metrics:

```typescript
import { OperationLogger, getSessionId } from '@velvetmonkey/vault-core';

const logger = new OperationLogger(vaultPath, 'flywheel');
await logger.wrap('search_notes', async () => {
  // operation code
});
```

---

## flywheel-bench Package

Testing infrastructure for the Flywheel ecosystem.

### Vault Generation

```typescript
import { generateVault, VAULT_PRESETS } from '@velvetmonkey/flywheel-bench';

await generateVault({
  ...VAULT_PRESETS['10k'],
  outputDir: '/tmp/vault',
  seed: 12345,
});
```

### Benchmark Harness

```typescript
import { BenchmarkRunner, detectRegressions } from '@velvetmonkey/flywheel-bench';

const runner = new BenchmarkRunner(config);
const results = await runner.run(suites);
const regressions = detectRegressions(results, baseline);
```

### Reliability Testing

```typescript
import { runAllReliabilityTests } from '@velvetmonkey/flywheel-bench';

const summary = await runAllReliabilityTests('/tmp/test-dir');
console.log(`Passed: ${summary.passed}/${summary.total}`);
```

---

Part of the [Flywheel](https://github.com/velvetmonkey/flywheel) ecosystem. Primary consumer: [Flywheel Memory](https://github.com/velvetmonkey/flywheel-memory).

Apache 2.0 — see [LICENSE](./LICENSE) for details.
