/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel-Crank (write).
 */
// Entity scanning
export { scanVaultEntities, getAllEntities, getAllEntitiesWithTypes, getEntityName, getEntityAliases, ENTITY_CACHE_VERSION, } from './entities.js';
// Wikilinks
export { applyWikilinks, processWikilinks, resolveAliasWikilinks, } from './wikilinks.js';
// Logging (unified cross-product logging)
export { OperationLogger, createLoggerFromConfig, generateSessionId, getSessionId, setSessionId, } from './logging/index.js';
// SQLite State Database
export { openStateDb, deleteStateDb, searchEntities, searchEntitiesPrefix, getEntityByName, getEntitiesByAlias, getAllEntitiesFromDb, getEntityIndexFromDb, recordEntityMention, getAllRecency, setCrankState, getCrankState, deleteCrankState, 
// Flywheel Config
setFlywheelConfig, getFlywheelConfig, getAllFlywheelConfig, saveFlywheelConfigToDb, loadFlywheelConfigFromDb, getStateDbMetadata, 
// Vault Index Cache
saveVaultIndexCache, loadVaultIndexCache, getVaultIndexCacheInfo, SCHEMA_VERSION, STATE_DB_FILENAME, FLYWHEEL_DIR, } from './sqlite.js';
//# sourceMappingURL=index.js.map