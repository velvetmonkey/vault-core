/**
 * Wikilink application logic
 *
 * Applies [[wikilinks]] to known entities in content while
 * respecting protected zones (code, frontmatter, existing links, etc.)
 *
 * Also supports:
 * - Pattern-based detection for implicit entities (proper nouns, quoted terms)
 * - Alias resolution for existing wikilinks (resolves [[alias]] to [[Entity|alias]])
 */
import type { WikilinkOptions, WikilinkResult, Entity, ExtendedWikilinkOptions, ImplicitEntityMatch, ImplicitEntityConfig, ResolveAliasOptions } from './types.js';
/**
 * Apply wikilinks to entities in content
 *
 * @param content - The markdown content to process
 * @param entities - List of entity names or Entity objects to look for
 * @param options - Wikilink options
 * @returns Result with updated content and statistics
 */
export declare function applyWikilinks(content: string, entities: Entity[], options?: WikilinkOptions): WikilinkResult;
/**
 * Suggest wikilinks without applying them
 * Returns a list of potential links with their positions
 *
 * Supports both entity names and aliases - if content matches an alias,
 * the suggestion will contain the canonical entity name.
 */
export declare function suggestWikilinks(content: string, entities: Entity[], options?: WikilinkOptions): Array<{
    entity: string;
    start: number;
    end: number;
    context: string;
}>;
/**
 * Resolve wikilinks that target aliases to their canonical entity names
 *
 * When a user types [[model context protocol]], and "Model Context Protocol"
 * is an alias for entity "MCP", this function transforms it to:
 * [[MCP|model context protocol]]
 *
 * This preserves the user's original text as display text while resolving
 * to the canonical entity target.
 *
 * @param content - The markdown content to process
 * @param entities - List of entity names or Entity objects to look for
 * @param options - Resolution options
 * @returns Result with updated content and statistics
 */
export declare function resolveAliasWikilinks(content: string, entities: Entity[], options?: ResolveAliasOptions): WikilinkResult;
/**
 * Detect implicit entities in content using pattern matching
 *
 * This finds potential entities that don't have existing files:
 * - Multi-word proper nouns (e.g., "Marcus Johnson", "Project Alpha")
 * - Single capitalized words after lowercase (e.g., "discussed with Marcus")
 * - Quoted terms (e.g., "Turbopump" becomes [[Turbopump]])
 *
 * @param content - The markdown content to analyze
 * @param config - Configuration for detection patterns
 * @returns Array of detected implicit entity matches
 */
export declare function detectImplicitEntities(content: string, config?: ImplicitEntityConfig): ImplicitEntityMatch[];
/**
 * Process wikilinks with support for both existing entities and implicit detection
 *
 * This is the main entry point that combines:
 * 1. applyWikilinks() for known entities from the vault index
 * 2. detectImplicitEntities() for pattern-based detection
 *
 * @param content - The markdown content to process
 * @param entities - List of known entity names or Entity objects
 * @param options - Extended options including implicit entity config
 * @returns Result with updated content and statistics
 */
export declare function processWikilinks(content: string, entities: Entity[], options?: ExtendedWikilinkOptions): WikilinkResult;
//# sourceMappingURL=wikilinks.d.ts.map