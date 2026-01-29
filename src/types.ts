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
  | 'other';

/**
 * Entity index structure matching wikilink-cache.py output
 */
export interface EntityIndex {
  technologies: string[];
  acronyms: string[];
  people: string[];
  projects: string[];
  other: string[];
  _metadata: {
    total_entities: number;
    generated_at: string;
    vault_path: string;
    source: string;
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
