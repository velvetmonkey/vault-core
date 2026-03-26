/**
 * @velvetmonkey/vault-core
 *
 * Shared vault utilities for the Flywheel ecosystem.
 * Used by both Flywheel (read) and Flywheel Memory (write).
 */
export type { EntityIndex, EntityCategory, DefaultEntityCategory, EntityWithAliases, Entity, EntityWithType, ScanOptions, WikilinkOptions, WikilinkResult, ImplicitEntityConfig, ExtendedWikilinkOptions, ImplicitEntityMatch, ResolveAliasOptions, ProtectedZone, ProtectedZoneType, } from './types.js';
export { DEFAULT_ENTITY_CATEGORIES, getIndexCategory, ensureIndexCategory, } from './types.js';
export { COMMON_ENGLISH_WORDS } from './common-words.js';
export { stem } from './stemmer.js';
export { scanVaultEntities, getAllEntities, getAllEntitiesWithTypes, getEntityName, getEntityAliases, loadEntityCache, saveEntityCache, ENTITY_CACHE_VERSION, } from './entities.js';
export { applyWikilinks, processWikilinks, resolveAliasWikilinks, suggestWikilinks, detectImplicitEntities, findEntityMatches, IMPLICIT_EXCLUDE_WORDS, } from './wikilinks.js';
export { getProtectedZones, getProtectedZonesRegex, isInProtectedZone, mergeOverlappingZones, rangeOverlapsProtectedZone, } from './protectedZones.js';
export { parseMarkdown } from './parseMarkdown.js';
export { getProtectedZonesFromAst } from './astProtectedZones.js';
export { OperationLogger, createLoggerFromConfig, generateSessionId, getSessionId, setSessionId, } from './logging/index.js';
export type { OperationLogEntry, SessionMetrics, AggregatedMetrics, LoggingConfig, ProductId, } from './logging/index.js';
export { openStateDb, deleteStateDb, stateDbExists, searchEntities, searchEntitiesPrefix, getEntityByName, getEntitiesByAlias, getAllEntitiesFromDb, getEntityIndexFromDb, recordEntityMention, getEntityRecency, getAllRecency, setWriteState, getWriteState, deleteWriteState, setFlywheelConfig, getFlywheelConfig, getAllFlywheelConfig, saveFlywheelConfigToDb, loadFlywheelConfigFromDb, getStateDbMetadata, recordMergeDismissal, getDismissedMergePairs, saveVaultIndexCache, loadVaultIndexCache, getVaultIndexCacheInfo, rebuildEntitiesFts, loadContentHashes, saveContentHashBatch, renameContentHash, deleteStateDbFiles, backupStateDb, preserveCorruptedDb, BACKUP_ROTATION_COUNT, SALVAGE_TABLES, rotateBackupFiles, safeBackupAsync, checkDbIntegrity, salvageFeedbackTables, attemptSalvage, SCHEMA_VERSION, STATE_DB_FILENAME, FLYWHEEL_DIR, } from './sqlite.js';
export type { StateDb, EntitySearchResult, RecencyRow, StateDbMetadata, VaultIndexCacheData, VaultIndexCacheInfo, FlywheelConfigRow, } from './sqlite.js';
//# sourceMappingURL=index.d.ts.map