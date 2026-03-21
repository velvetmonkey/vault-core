/**
 * Protected zones detection for wikilink application
 *
 * AST-first approach: uses mdast for accurate zone detection (nested callouts,
 * tables, multi-line HTML), with regex fallback on parse failure.
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
 * - Obsidian callouts (> [!type] syntax — entire block, including nested)
 * - Tables (GFM pipe tables)
 */
import type { ProtectedZone } from './types.js';
/**
 * Find where YAML frontmatter ends
 * @returns Character index after closing ---, or 0 if no frontmatter
 */
export declare function findFrontmatterEnd(content: string): number;
/**
 * Get all protected zones using regex-only detection (legacy/fallback).
 * Exported for testing and explicit fallback use.
 */
export declare function getProtectedZonesRegex(content: string): ProtectedZone[];
/**
 * Get all protected zones in content where wikilinks should not be applied.
 *
 * AST-first: parses markdown into AST for accurate detection of nested
 * callouts, tables, and HTML comments. Falls back to regex on parse failure.
 */
export declare function getProtectedZones(content: string): ProtectedZone[];
/**
 * Merge overlapping or adjacent protected zones into a single list.
 * Zones that touch (end === start) or overlap are collapsed.
 */
export declare function mergeOverlappingZones(zones: ProtectedZone[]): ProtectedZone[];
/**
 * Check if a position is within any protected zone
 */
export declare function isInProtectedZone(position: number, zones: ProtectedZone[]): boolean;
/**
 * Check if a range overlaps with any protected zone
 */
export declare function rangeOverlapsProtectedZone(start: number, end: number, zones: ProtectedZone[]): boolean;
//# sourceMappingURL=protectedZones.d.ts.map