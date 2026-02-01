> **Part of the Flywheel Suite:** Shared foundation for vault operations. See [Flywheel](https://github.com/velvetmonkey/flywheel) for graph intelligence and [Flywheel-Crank](https://github.com/velvetmonkey/flywheel-crank) for safe mutations.

# vault-core Monorepo

Shared infrastructure for the Flywheel ecosystem.

[![CI](https://github.com/velvetmonkey/vault-core/actions/workflows/ci.yml/badge.svg)](https://github.com/velvetmonkey/vault-core/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@velvetmonkey/vault-core.svg)](https://www.npmjs.com/package/@velvetmonkey/vault-core)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

---

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| **[@velvetmonkey/vault-core](./packages/core)** | Shared vault utilities (entity scanning, protected zones, wikilinks) | [![npm](https://img.shields.io/npm/v/@velvetmonkey/vault-core.svg)](https://www.npmjs.com/package/@velvetmonkey/vault-core) |
| **[@velvetmonkey/flywheel-bench](./packages/bench)** | Benchmark infrastructure (vault generation, performance testing, reliability) | [![npm](https://img.shields.io/npm/v/@velvetmonkey/flywheel-bench.svg)](https://www.npmjs.com/package/@velvetmonkey/flywheel-bench) |

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Flywheel (read)               │
│      44 graph intelligence tools        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           vault-core                    │
│  Entity scanning · Protected zones ·    │
│  Wikilink application · Logging         │
├─────────────────────────────────────────┤
│           flywheel-bench                │
│  Vault generation · Benchmarks ·        │
│  Reliability testing                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        Flywheel-Crank (write)           │
│        11 mutation tools                │
└─────────────────────────────────────────┘
```

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

- [Testing Guide](./docs/TESTING.md) - Test infrastructure and methodology
- [Scale Benchmarks](./docs/SCALE_BENCHMARKS.md) - Performance targets and results

---

## vault-core Package

Shared utilities used by both Flywheel and Flywheel-Crank:

### Entity Scanning

Scan Obsidian vaults to build entity indexes:

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

Testing infrastructure for the Flywheel ecosystem:

### Vault Generation

Generate reproducible test vaults:

```typescript
import { generateVault, VAULT_PRESETS } from '@velvetmonkey/flywheel-bench';

await generateVault({
  ...VAULT_PRESETS['10k'],
  outputDir: '/tmp/vault',
  seed: 12345,
});
```

### Benchmark Harness

Run and compare benchmarks:

```typescript
import { BenchmarkRunner, detectRegressions } from '@velvetmonkey/flywheel-bench';

const runner = new BenchmarkRunner(config);
const results = await runner.run(suites);
const regressions = detectRegressions(results, baseline);
```

### Reliability Testing

Validate mutation reliability:

```typescript
import { runAllReliabilityTests } from '@velvetmonkey/flywheel-bench';

const summary = await runAllReliabilityTests('/tmp/test-dir');
console.log(`Passed: ${summary.passed}/${summary.total}`);
```

---

## Related Projects

- [Flywheel](https://github.com/velvetmonkey/flywheel) — Read-only graph intelligence MCP server
- [Flywheel-Crank](https://github.com/velvetmonkey/flywheel-crank) — Safe mutation MCP server

---

Apache-2.0 License · [GitHub](https://github.com/velvetmonkey/vault-core) · [Issues](https://github.com/velvetmonkey/vault-core/issues)
