/**
 * Porter Stemmer — extracted to vault-core for use in entity matching.
 *
 * Reduces words to their root forms for morphological matching:
 * - "pipelines" → "pipelin" (matches "pipeline")
 * - "sprinting" → "sprint"  (matches "sprint")
 * - "databases" → "databas" (matches "database")
 *
 * Based on the Porter Stemming Algorithm (1980)
 * https://tartarus.org/martin/PorterStemmer/
 */
/**
 * Apply Porter Stemming algorithm to reduce a word to its root form.
 *
 * @example
 * stem('pipelines')  // 'pipelin'
 * stem('sprinting')  // 'sprint'
 * stem('databases')  // 'databas'
 */
export declare function stem(word: string): string;
//# sourceMappingURL=stemmer.d.ts.map