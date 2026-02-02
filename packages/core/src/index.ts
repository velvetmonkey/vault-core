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
  EntityWithAliases,
  Entity,
  EntityWithType,
  ProtectedZone,
  ProtectedZoneType,
  ScanOptions,
  WikilinkOptions,
  WikilinkResult,
  ImplicitEntityConfig,
  ExtendedWikilinkOptions,
  ImplicitEntityMatch,
} from './types.js';

// Entity scanning
export {
  scanVaultEntities,
  getAllEntities,
  getAllEntitiesWithTypes,
  getEntityName,
  getEntityAliases,
  filterPeriodicNotes,
  loadEntityCache,
  saveEntityCache,
  ENTITY_CACHE_VERSION,
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
  detectImplicitEntities,
  processWikilinks,
} from './wikilinks.js';

// Logging (unified cross-product logging)
export {
  OperationLogger,
  createLoggerFromConfig,
  generateSessionId,
  getSessionId,
  setSessionId,
  clearSession,
  createChildSession,
  getParentSession,
  isChildSession,
  DEFAULT_LOGGING_CONFIG,
} from './logging/index.js';

export type {
  OperationLogEntry,
  SessionMetrics,
  AggregatedMetrics,
  LoggingConfig,
  ProductId,
} from './logging/index.js';

// SQLite State Database
export {
  openStateDb,
  deleteStateDb,
  stateDbExists,
  getStateDbPath,
  searchEntities,
  searchEntitiesPrefix,
  getEntityByName,
  getAllEntitiesFromDb,
  getEntityIndexFromDb,
  getBacklinks,
  getOutlinks,
  replaceLinksFromSource,
  recordEntityMention,
  getEntityRecency,
  getAllRecency,
  setCrankState,
  getCrankState,
  deleteCrankState,
  getStateDbMetadata,
  isEntityDataStale,
  escapeFts5Query,
  migrateFromJsonToSqlite,
  getLegacyPaths,
  backupLegacyFiles,
  deleteLegacyFiles,
  SCHEMA_VERSION,
  STATE_DB_FILENAME,
  FLYWHEEL_DIR,
} from './sqlite.js';

export type {
  StateDb,
  EntitySearchResult,
  NoteRow,
  LinkRow,
  RecencyRow,
  StateDbMetadata,
  MigrationResult,
  LegacyPaths,
} from './sqlite.js';
