/**
 * Note content generation with realistic text patterns
 */
import type { GeneratedEntity } from '../types.js';
/**
 * Seeded random number generator for reproducibility
 */
export declare class SeededRandom {
    private seed;
    constructor(seed: number);
    /** Returns a number between 0 and 1 */
    next(): number;
    /** Returns an integer between min and max (inclusive) */
    nextInt(min: number, max: number): number;
    /** Pick a random element from an array */
    pick<T>(arr: readonly T[]): T;
    /** Pick multiple unique elements from an array */
    pickN<T>(arr: readonly T[], n: number): T[];
    /** Returns true with given probability (0-1) */
    chance(probability: number): boolean;
}
/**
 * Generate a realistic note title
 */
export declare function generateNoteTitle(rng: SeededRandom, entities: GeneratedEntity[], index: number): string;
/**
 * Generate realistic note content with embedded wikilinks
 */
export declare function generateNoteContent(rng: SeededRandom, title: string, entities: GeneratedEntity[], targetLinks: number, avgLength: number): {
    content: string;
    wikilinks: string[];
};
/**
 * Generate file-safe note filename from title
 */
export declare function titleToFilename(title: string): string;
//# sourceMappingURL=notes.d.ts.map