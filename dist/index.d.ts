/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel-Crank (write).
 */
export type { EntityIndex, EntityCategory, EntityWithAliases, Entity, EntityWithType, ProtectedZone, ProtectedZoneType, ScanOptions, WikilinkOptions, WikilinkResult, } from './types.js';
export { scanVaultEntities, getAllEntities, getAllEntitiesWithTypes, getEntityName, getEntityAliases, filterPeriodicNotes, loadEntityCache, saveEntityCache, ENTITY_CACHE_VERSION, } from './entities.js';
export { getProtectedZones, isInProtectedZone, rangeOverlapsProtectedZone, findFrontmatterEnd, } from './protectedZones.js';
export { applyWikilinks, suggestWikilinks, } from './wikilinks.js';
//# sourceMappingURL=index.d.ts.map