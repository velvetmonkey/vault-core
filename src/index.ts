/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel-Crank (write).
 */

// Types
export type {
  EntityIndex,
  EntityCategory,
  ProtectedZone,
  ProtectedZoneType,
  ScanOptions,
  WikilinkOptions,
  WikilinkResult,
} from './types.js';

// Entity scanning
export {
  scanVaultEntities,
  getAllEntities,
  filterPeriodicNotes,
  loadEntityCache,
  saveEntityCache,
} from './entities.js';

// Protected zones
export {
  getProtectedZones,
  isInProtectedZone,
  rangeOverlapsProtectedZone,
  findFrontmatterEnd,
} from './protectedZones.js';

// Wikilinks
export {
  applyWikilinks,
  suggestWikilinks,
} from './wikilinks.js';
