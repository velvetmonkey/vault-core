/**
 * Markdown AST parser for protected zone detection
 *
 * Uses mdast (fromMarkdown) with GFM, frontmatter, and math extensions.
 * Returns null on parse error to trigger regex fallback.
 */
import type { Root } from 'mdast';
export interface ParseMarkdownOptions {
    /** Skip AST parsing entirely, return null */
    forceRegex?: boolean;
}
/**
 * Parse markdown content into an AST tree.
 * Returns null on parse error (triggers regex fallback).
 */
export declare function parseMarkdown(content: string, options?: ParseMarkdownOptions): Root | null;
//# sourceMappingURL=parseMarkdown.d.ts.map