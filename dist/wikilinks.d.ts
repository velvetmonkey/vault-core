/**
 * Wikilink application logic
 *
 * Applies [[wikilinks]] to known entities in content while
 * respecting protected zones (code, frontmatter, existing links, etc.)
 */
import type { WikilinkOptions, WikilinkResult } from './types.js';
/**
 * Apply wikilinks to entities in content
 *
 * @param content - The markdown content to process
 * @param entities - List of entity names to look for
 * @param options - Wikilink options
 * @returns Result with updated content and statistics
 */
export declare function applyWikilinks(content: string, entities: string[], options?: WikilinkOptions): WikilinkResult;
/**
 * Suggest wikilinks without applying them
 * Returns a list of potential links with their positions
 */
export declare function suggestWikilinks(content: string, entities: string[], options?: WikilinkOptions): Array<{
    entity: string;
    start: number;
    end: number;
    context: string;
}>;
//# sourceMappingURL=wikilinks.d.ts.map