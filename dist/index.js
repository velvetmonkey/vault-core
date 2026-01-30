/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel-Crank (write).
 */
// Entity scanning
export { scanVaultEntities, getAllEntities, getEntityName, getEntityAliases, filterPeriodicNotes, loadEntityCache, saveEntityCache, ENTITY_CACHE_VERSION, } from './entities.js';
// Protected zones
export { getProtectedZones, isInProtectedZone, rangeOverlapsProtectedZone, findFrontmatterEnd, } from './protectedZones.js';
// Wikilinks
export { applyWikilinks, suggestWikilinks, } from './wikilinks.js';
//# sourceMappingURL=index.js.map