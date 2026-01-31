/**
 * Types for vault-core shared utilities
 */

/**
 * Categories for entity classification
 */
export type EntityCategory =
  | 'technologies'
  | 'acronyms'
  | 'people'
  | 'projects'
  | 'organizations'
  | 'locations'
  | 'concepts'
  | 'other';

/**
 * Entity with optional aliases from frontmatter
 */
export interface EntityWithAliases {
  /** Primary entity name (file stem) */
  name: string;
  /** Relative path to the file within vault */
  path: string;
  /** Aliases from frontmatter (filtered by length/word count) */
  aliases: string[];
  /** Hub score: backlink count for prioritization (set by Flywheel after graph build) */
  hubScore?: number;
}

/**
 * Entity can be either a simple string (legacy) or full object with aliases
 */
export type Entity = string | EntityWithAliases;

/**
 * Entity with its category type for scoring algorithms
 * Preserves type information that getAllEntities() loses by flattening
 */
export interface EntityWithType {
  entity: EntityWithAliases;
  category: EntityCategory;
}

/**
 * Entity index structure matching wikilink-cache.py output
 * Now supports both string[] (legacy) and EntityWithAliases[] (v2)
 */
export interface EntityIndex {
  technologies: Entity[];
  acronyms: Entity[];
  people: Entity[];
  projects: Entity[];
  organizations: Entity[];
  locations: Entity[];
  concepts: Entity[];
  other: Entity[];
  _metadata: {
    total_entities: number;
    generated_at: string;
    vault_path: string;
    source: string;
    /** Cache version for migration detection */
    version?: number;
  };
}

/**
 * A protected zone in content where wikilinks should not be applied
 */
export interface ProtectedZone {
  start: number;
  end: number;
  type: ProtectedZoneType;
}

/**
 * Types of protected zones
 */
export type ProtectedZoneType =
  | 'frontmatter'
  | 'code_block'
  | 'inline_code'
  | 'wikilink'
  | 'markdown_link'
  | 'url'
  | 'hashtag'
  | 'html_tag'
  | 'obsidian_comment'
  | 'math';

/**
 * Options for entity scanning
 */
export interface ScanOptions {
  /**
   * Folders to exclude from entity scanning (periodic notes, etc.)
   */
  excludeFolders?: string[];

  /**
   * Tech keywords for categorization
   */
  techKeywords?: string[];
}

/**
 * Options for wikilink application
 */
export interface WikilinkOptions {
  /**
   * Only link first occurrence of each entity
   * @default true
   */
  firstOccurrenceOnly?: boolean;

  /**
   * Case-insensitive matching
   * @default true
   */
  caseInsensitive?: boolean;
}

/**
 * Result of applying wikilinks
 */
export interface WikilinkResult {
  content: string;
  linksAdded: number;
  linkedEntities: string[];
}
