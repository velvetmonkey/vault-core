/**
 * Frontmatter generation for realistic notes
 */
import { SeededRandom } from './notes.js';
export interface FrontmatterOptions {
    probability: number;
    includeCreatedDate: boolean;
    includeModifiedDate: boolean;
    includeTags: boolean;
    includeStatus: boolean;
    includeCustomFields: boolean;
}
/**
 * Generate frontmatter for a note
 */
export declare function generateFrontmatter(rng: SeededRandom, title: string, options?: Partial<FrontmatterOptions>): Record<string, unknown> | undefined;
/**
 * Convert frontmatter object to YAML string
 */
export declare function frontmatterToYaml(frontmatter: Record<string, unknown>): string;
/**
 * Wrap content with frontmatter
 */
export declare function wrapWithFrontmatter(content: string, frontmatter: Record<string, unknown> | undefined): string;
//# sourceMappingURL=frontmatter.d.ts.map