/**
 * Entity scanning and discovery for vault wikilinks
 *
 * Scans vault for .md files and extracts valid entities (file stems)
 * that can be wikilinked. Filters out periodic notes and categorizes
 * entities by type.
 */
import type { EntityIndex, ScanOptions, Entity } from './types.js';
/**
 * Current cache version - bump when schema changes
 */
export declare const ENTITY_CACHE_VERSION = 2;
/**
 * Scan vault for entities (markdown file stems) that can be wikilinked
 */
export declare function scanVaultEntities(vaultPath: string, options?: ScanOptions): Promise<EntityIndex>;
/**
 * Get all entities as a flat array (for wikilink matching)
 * Handles both legacy string format and new EntityWithAliases format
 */
export declare function getAllEntities(index: EntityIndex): Entity[];
/**
 * Get entity name from an Entity (handles both string and object formats)
 */
export declare function getEntityName(entity: Entity): string;
/**
 * Get entity aliases from an Entity (returns empty array for strings)
 */
export declare function getEntityAliases(entity: Entity): string[];
/**
 * Filter periodic notes from a list of entities
 * Useful when loading from external sources
 */
export declare function filterPeriodicNotes(entities: string[]): string[];
/**
 * Load entity index from a cache file (JSON format)
 */
export declare function loadEntityCache(cachePath: string): Promise<EntityIndex | null>;
/**
 * Save entity index to a cache file
 */
export declare function saveEntityCache(cachePath: string, index: EntityIndex): Promise<void>;
//# sourceMappingURL=entities.d.ts.map