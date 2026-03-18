/**
 * AST-based protected zone detection
 *
 * Uses mdast tree to compute ProtectedZone[] more accurately than regex,
 * especially for nested callouts, tables, and multi-line HTML comments.
 *
 * Supplemental regex handles Obsidian-specific syntax not in mdast:
 * [[wikilinks]], bare URLs, #hashtags, %%comments%%
 */
import type { Root } from 'mdast';
import type { ProtectedZone } from './types.js';
/**
 * Extract protected zones from an mdast tree.
 */
export declare function getProtectedZonesFromAst(tree: Root, content: string): ProtectedZone[];
//# sourceMappingURL=astProtectedZones.d.ts.map