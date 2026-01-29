# @velvetmonkey/vault-core

Shared vault utilities for the Flywheel ecosystem. Used by both [Flywheel](https://github.com/velvetmonkey/flywheel) (Obsidian plugin) and [Flywheel-Crank](https://github.com/velvetmonkey/flywheel-crank) (CLI).

## Installation

```bash
npm install @velvetmonkey/vault-core
```

## Features

### Entity Scanning
Scan an Obsidian vault to build an index of entities (notes) organized by category.

```typescript
import { scanVaultEntities, getAllEntities, filterPeriodicNotes } from '@velvetmonkey/vault-core';

const index = await scanVaultEntities('/path/to/vault', options);
const entities = getAllEntities(index);
const nonPeriodic = filterPeriodicNotes(entities);
```

### Protected Zones
Detect regions in markdown that shouldn't be modified (frontmatter, code blocks, etc.).

```typescript
import { getProtectedZones, isInProtectedZone } from '@velvetmonkey/vault-core';

const zones = getProtectedZones(markdownContent);
const safe = !isInProtectedZone(zones, cursorPosition);
```

### Wikilinks
Apply or suggest wikilinks to entity names in markdown content.

```typescript
import { applyWikilinks, suggestWikilinks } from '@velvetmonkey/vault-core';

const suggestions = suggestWikilinks(content, entityIndex);
const linked = applyWikilinks(content, entityIndex, options);
```

## API

### Types
- `EntityIndex` - Map of category to entity names
- `EntityCategory` - Entity category identifier
- `ProtectedZone` - Region that shouldn't be modified
- `ScanOptions` - Options for vault scanning
- `WikilinkOptions` - Options for wikilink application
- `WikilinkResult` - Result of wikilink suggestion

### Functions
- `scanVaultEntities(path, options)` - Scan vault for entities
- `getAllEntities(index)` - Get flat list of all entities
- `filterPeriodicNotes(entities)` - Remove daily/weekly/etc notes
- `loadEntityCache(path)` / `saveEntityCache(path, index)` - Cache management
- `getProtectedZones(content)` - Find protected regions
- `isInProtectedZone(zones, position)` - Check if position is protected
- `rangeOverlapsProtectedZone(zones, start, end)` - Check range overlap
- `findFrontmatterEnd(content)` - Find end of YAML frontmatter
- `applyWikilinks(content, index, options)` - Apply wikilinks to content
- `suggestWikilinks(content, index)` - Get wikilink suggestions

## License

AGPL-3.0 - See [LICENSE](LICENSE) for details.
