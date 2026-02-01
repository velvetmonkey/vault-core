/**
 * Protected zones detection for wikilink application
 *
 * These are areas in markdown content where wikilinks should NOT be applied:
 * - YAML frontmatter
 * - Code blocks (``` ... ```)
 * - Inline code (` ... `)
 * - Existing wikilinks ([[...]])
 * - Markdown links ([text](url))
 * - URLs (http:// or https://)
 * - Hashtags (#tag)
 * - HTML/XML tags (<tag>)
 * - Obsidian comments (%% ... %%)
 * - Math expressions ($ ... $ and $$ ... $$)
 * - Markdown headers (# to ###### at line start)
 * - Obsidian callouts (> [!type] syntax)
 */
import type { ProtectedZone } from './types.js';
/**
 * Find where YAML frontmatter ends
 * @returns Character index after closing ---, or 0 if no frontmatter
 */
export declare function findFrontmatterEnd(content: string): number;
/**
 * Get all protected zones in content where wikilinks should not be applied
 */
export declare function getProtectedZones(content: string): ProtectedZone[];
/**
 * Check if a position is within any protected zone
 */
export declare function isInProtectedZone(position: number, zones: ProtectedZone[]): boolean;
/**
 * Check if a range overlaps with any protected zone
 */
export declare function rangeOverlapsProtectedZone(start: number, end: number, zones: ProtectedZone[]): boolean;
//# sourceMappingURL=protectedZones.d.ts.map