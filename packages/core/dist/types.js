/**
 * Types for vault-core shared utilities
 */
/** Built-in category keys (excludes _metadata) */
export const DEFAULT_ENTITY_CATEGORIES = [
    'technologies', 'acronyms', 'people', 'projects', 'organizations',
    'locations', 'concepts', 'animals', 'media', 'events', 'documents',
    'vehicles', 'health', 'finance', 'food', 'hobbies', 'periodical', 'other',
];
/** Get entities for a category (handles both built-in and custom) */
export function getIndexCategory(index, category) {
    if (category === '_metadata')
        return [];
    return index[category] ?? [];
}
/** Ensure a category array exists on the index */
export function ensureIndexCategory(index, category) {
    if (category !== '_metadata' && !index[category]) {
        index[category] = [];
    }
}
//# sourceMappingURL=types.js.map