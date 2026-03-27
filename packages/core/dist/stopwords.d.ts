/**
 * Canonical English stopwords for search tokenization
 *
 * Single source of truth — imported by flywheel-memory (stemmer, similarity,
 * wikilink suggestions). Union of all previously separate stopword sets.
 *
 * Categories:
 * - Function words (articles, pronouns, prepositions, conjunctions)
 * - Common verbs with inflections (go/went/gone, make/made/making)
 * - Time words (today, daily, week, month)
 * - Generic/filler words (thing, stuff, something)
 * - Domain-specific PKM terms (vault, wikilink, frontmatter)
 */
export declare const STOPWORDS_EN: Set<string>;
/**
 * Check if a word is a stopword
 */
export declare function isStopword(word: string): boolean;
//# sourceMappingURL=stopwords.d.ts.map