/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel-Crank (write).
 */
// Entity scanning
export { scanVaultEntities, getAllEntities, getAllEntitiesWithTypes, getEntityName, getEntityAliases, filterPeriodicNotes, loadEntityCache, saveEntityCache, ENTITY_CACHE_VERSION, } from './entities.js';
// Protected zones
export { getProtectedZones, isInProtectedZone, rangeOverlapsProtectedZone, findFrontmatterEnd, } from './protectedZones.js';
// Wikilinks
export { applyWikilinks, suggestWikilinks, detectImplicitEntities, processWikilinks, } from './wikilinks.js';
// Logging (unified cross-product logging)
export { OperationLogger, createLoggerFromConfig, generateSessionId, getSessionId, setSessionId, clearSession, createChildSession, getParentSession, isChildSession, DEFAULT_LOGGING_CONFIG, } from './logging/index.js';
//# sourceMappingURL=index.js.map