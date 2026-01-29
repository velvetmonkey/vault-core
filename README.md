> **Part of the Flywheel Suite:** Shared foundation for vault operations. See [Flywheel](https://github.com/velvetmonkey/flywheel) for graph intelligence and [Flywheel-Crank](https://github.com/velvetmonkey/flywheel-crank) for safe mutations.

# @velvetmonkey/vault-core

Shared vault utilities for the Flywheel ecosystem.

[![npm version](https://img.shields.io/npm/v/@velvetmonkey/vault-core.svg)](https://www.npmjs.com/package/@velvetmonkey/vault-core)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## Why This Exists

Flywheel and Flywheel-Crank both need to:
- Scan vaults for entity names (people, projects, technologies)
- Detect protected zones (code blocks, frontmatter, existing links)
- Apply wikilinks safely without corrupting content

Rather than duplicate this logic, vault-core provides the shared foundation.

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
│  Wikilink application                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        Flywheel-Crank (write)           │
│        11 mutation tools                │
└─────────────────────────────────────────┘
```

---

## Installation

```bash
npm install @velvetmonkey/vault-core
```

---

## Modules

### Entity Scanning

Scan an Obsidian vault to build an index of entities (notes) organized by category.

```typescript
import { scanVaultEntities, getAllEntities, filterPeriodicNotes } from '@velvetmonkey/vault-core';

const index = await scanVaultEntities('/path/to/vault', options);
const entities = getAllEntities(index);
const nonPeriodic = filterPeriodicNotes(entities);
```

**Detected categories:** People (`team/`, `people/`), Projects (`projects/`, `systems/`), Decisions (`decisions/`, `adr/`), and more.

### Protected Zones

Detect regions in markdown that shouldn't be modified during wikilink insertion.

```typescript
import { getProtectedZones, isInProtectedZone } from '@velvetmonkey/vault-core';

const zones = getProtectedZones(markdownContent);
const safe = !isInProtectedZone(zones, cursorPosition);
```

**Protected zone types:**
- YAML frontmatter (`---` blocks)
- Code blocks (fenced and indented)
- Inline code (backticks)
- Existing wikilinks (`[[...]]`)
- URLs and markdown links

### Wikilinks

Apply or suggest wikilinks to entity names in markdown content.

```typescript
import { applyWikilinks, suggestWikilinks } from '@velvetmonkey/vault-core';

const suggestions = suggestWikilinks(content, entityIndex);
const linked = applyWikilinks(content, entityIndex, options);
```

Wikilinks are only applied in safe zones—never inside code, frontmatter, or existing links.

---

## API Reference

### Types

| Type | Description |
|------|-------------|
| `EntityIndex` | Map of category to entity names |
| `EntityCategory` | Entity category identifier |
| `ProtectedZone` | Region that shouldn't be modified |
| `ScanOptions` | Options for vault scanning |
| `WikilinkOptions` | Options for wikilink application |
| `WikilinkResult` | Result of wikilink suggestion |

### Functions

| Function | Description |
|----------|-------------|
| `scanVaultEntities(path, options)` | Scan vault for entities |
| `getAllEntities(index)` | Get flat list of all entities |
| `filterPeriodicNotes(entities)` | Remove daily/weekly/etc notes |
| `loadEntityCache(path)` / `saveEntityCache(path, index)` | Cache management |
| `getProtectedZones(content)` | Find protected regions |
| `isInProtectedZone(zones, position)` | Check if position is protected |
| `rangeOverlapsProtectedZone(zones, start, end)` | Check range overlap |
| `findFrontmatterEnd(content)` | Find end of YAML frontmatter |
| `applyWikilinks(content, index, options)` | Apply wikilinks to content |
| `suggestWikilinks(content, index)` | Get wikilink suggestions |

---

## Related Projects

- [Flywheel](https://github.com/velvetmonkey/flywheel) — Read-only graph intelligence MCP server
- [Flywheel-Crank](https://github.com/velvetmonkey/flywheel-crank) — Safe mutation MCP server

---

AGPL-3.0 License · [GitHub](https://github.com/velvetmonkey/vault-core) · [Issues](https://github.com/velvetmonkey/vault-core/issues)
