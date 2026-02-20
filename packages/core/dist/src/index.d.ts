/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel Memory (write).
 */
export type { EntityIndex, EntityCategory, EntityWithAliases, Entity, EntityWithType, ScanOptions, WikilinkOptions, WikilinkResult, ImplicitEntityConfig, ExtendedWikilinkOptions, ImplicitEntityMatch, ResolveAliasOptions, ProtectedZone, ProtectedZoneType, } from './types.js';
export { scanVaultEntities, getAllEntities, getAllEntitiesWithTypes, getEntityName, getEntityAliases, loadEntityCache, saveEntityCache, ENTITY_CACHE_VERSION, } from './entities.js';
export { applyWikilinks, processWikilinks, resolveAliasWikilinks, suggestWikilinks, detectImplicitEntities, } from './wikilinks.js';
export { getProtectedZones, isInProtectedZone, rangeOverlapsProtectedZone, } from './protectedZones.js';
export { OperationLogger, createLoggerFromConfig, generateSessionId, getSessionId, setSessionId, } from './logging/index.js';
export type { OperationLogEntry, SessionMetrics, AggregatedMetrics, LoggingConfig, ProductId, } from './logging/index.js';
export { openStateDb, deleteStateDb, stateDbExists, searchEntities, searchEntitiesPrefix, getEntityByName, getEntitiesByAlias, getAllEntitiesFromDb, getEntityIndexFromDb, recordEntityMention, getEntityRecency, getAllRecency, setWriteState, getWriteState, deleteWriteState, setFlywheelConfig, getFlywheelConfig, getAllFlywheelConfig, saveFlywheelConfigToDb, loadFlywheelConfigFromDb, getStateDbMetadata, recordMergeDismissal, getDismissedMergePairs, saveVaultIndexCache, loadVaultIndexCache, getVaultIndexCacheInfo, SCHEMA_VERSION, STATE_DB_FILENAME, FLYWHEEL_DIR, } from './sqlite.js';
export type { StateDb, EntitySearchResult, RecencyRow, StateDbMetadata, VaultIndexCacheData, VaultIndexCacheInfo, FlywheelConfigRow, } from './sqlite.js';
//# sourceMappingURL=index.d.ts.map