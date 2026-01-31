/**
 * Wikilink application logic
 *
 * Applies [[wikilinks]] to known entities in content while
 * respecting protected zones (code, frontmatter, existing links, etc.)
 */
import { getProtectedZones, rangeOverlapsProtectedZone } from './protectedZones.js';
/**
 * Get entity name from Entity (handles both string and object formats)
 */
function extractEntityName(entity) {
    return typeof entity === 'string' ? entity : entity.name;
}
/**
 * Get all search terms for an entity (name + aliases)
 * Returns tuples of [searchTerm, entityName] for proper linking
 */
function getSearchTerms(entity) {
    if (typeof entity === 'string') {
        return [{ term: entity, entityName: entity }];
    }
    // Include the entity name and all aliases
    const terms = [
        { term: entity.name, entityName: entity.name }
    ];
    for (const alias of entity.aliases) {
        terms.push({ term: alias, entityName: entity.name });
    }
    return terms;
}
/**
 * Common words to exclude from wikilink suggestions
 */
const EXCLUDE_WORDS = new Set([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december',
    'today', 'tomorrow', 'yesterday', 'week', 'month', 'year',
    'the', 'and', 'for', 'with', 'from', 'this', 'that',
    'christmas', 'holiday', 'break',
]);
/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Check if an entity should be excluded from wikilikning
 */
function shouldExcludeEntity(entity) {
    return EXCLUDE_WORDS.has(entity.toLowerCase());
}
/**
 * Find all matches of an entity in content with word boundaries
 */
function findEntityMatches(content, entity, caseInsensitive) {
    const pattern = `\\b${escapeRegex(entity)}\\b`;
    const flags = caseInsensitive ? 'gi' : 'g';
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            matched: match[0],
        });
    }
    return matches;
}
/**
 * Apply wikilinks to entities in content
 *
 * @param content - The markdown content to process
 * @param entities - List of entity names or Entity objects to look for
 * @param options - Wikilink options
 * @returns Result with updated content and statistics
 */
export function applyWikilinks(content, entities, options = {}) {
    const { firstOccurrenceOnly = true, caseInsensitive = true, } = options;
    if (!entities.length) {
        return {
            content,
            linksAdded: 0,
            linkedEntities: [],
        };
    }
    // Build search terms from all entities (names + aliases)
    // Each term maps back to its canonical entity name
    const allSearchTerms = [];
    for (const entity of entities) {
        const terms = getSearchTerms(entity);
        for (const t of terms) {
            if (!shouldExcludeEntity(t.term)) {
                allSearchTerms.push(t);
            }
        }
    }
    // Sort by term length (longest first) to avoid partial matches
    allSearchTerms.sort((a, b) => b.term.length - a.term.length);
    // Get protected zones
    let zones = getProtectedZones(content);
    let result = content;
    let linksAdded = 0;
    const linkedEntities = [];
    if (firstOccurrenceOnly) {
        // For firstOccurrenceOnly mode, we need to find the earliest match across
        // all terms (name + aliases) for each entity, then link that one
        // Also need to handle overlapping matches between different entities
        // First, collect ALL valid matches for each entity (name + aliases combined)
        const entityAllMatches = new Map();
        for (const { term, entityName } of allSearchTerms) {
            const entityKey = entityName.toLowerCase();
            // Find all matches of the search term
            const matches = findEntityMatches(result, term, caseInsensitive);
            // Filter out matches in protected zones
            const validMatches = matches.filter(match => !rangeOverlapsProtectedZone(match.start, match.end, zones));
            if (validMatches.length === 0) {
                continue;
            }
            // Add to entity's matches
            const existingMatches = entityAllMatches.get(entityKey) || [];
            for (const match of validMatches) {
                existingMatches.push({ term, match });
            }
            entityAllMatches.set(entityKey, existingMatches);
        }
        // Sort each entity's matches by position
        for (const [_entityKey, matches] of entityAllMatches.entries()) {
            matches.sort((a, b) => a.match.start - b.match.start);
        }
        // Build final list: for each entity, pick the earliest non-overlapping match
        // Process entities in order of their earliest match length (longest first for same position)
        let allCandidates = [];
        for (const [entityKey, matches] of entityAllMatches.entries()) {
            // Find the original entityName (with correct casing)
            const entityName = allSearchTerms.find(t => t.entityName.toLowerCase() === entityKey)?.entityName || entityKey;
            for (const m of matches) {
                allCandidates.push({ entityName, ...m });
            }
        }
        // Sort by position, then by match length (descending)
        allCandidates.sort((a, b) => {
            if (a.match.start !== b.match.start)
                return a.match.start - b.match.start;
            return b.match.matched.length - a.match.matched.length;
        });
        // Select non-overlapping matches, preferring longer ones at same position
        // Each entity gets at most one match
        const selectedMatches = [];
        const selectedEntityNames = new Set();
        for (const candidate of allCandidates) {
            const entityKey = candidate.entityName.toLowerCase();
            // Skip if this entity already has a selected match
            if (selectedEntityNames.has(entityKey)) {
                continue;
            }
            // Check if this overlaps with any already selected match
            const overlaps = selectedMatches.some(existing => (candidate.match.start >= existing.match.start && candidate.match.start < existing.match.end) ||
                (candidate.match.end > existing.match.start && candidate.match.end <= existing.match.end) ||
                (candidate.match.start <= existing.match.start && candidate.match.end >= existing.match.end));
            if (!overlaps) {
                selectedMatches.push(candidate);
                selectedEntityNames.add(entityKey);
            }
        }
        // Sort by position from end to start to preserve offsets when inserting
        selectedMatches.sort((a, b) => b.match.start - a.match.start);
        for (const { entityName, term: _term, match } of selectedMatches) {
            // Use display text format when matched text differs from entity name
            const matchedTextLower = match.matched.toLowerCase();
            const entityNameLower = entityName.toLowerCase();
            const wikilink = matchedTextLower === entityNameLower
                ? `[[${entityName}]]`
                : `[[${entityName}|${match.matched}]]`;
            result = result.slice(0, match.start) + wikilink + result.slice(match.end);
            // Update protected zones (shift positions after insertion)
            const shift = wikilink.length - match.matched.length;
            zones = zones.map(zone => ({
                ...zone,
                start: zone.start <= match.start ? zone.start : zone.start + shift,
                end: zone.end <= match.start ? zone.end : zone.end + shift,
            }));
            // Add new wikilink as protected zone
            zones.push({
                start: match.start,
                end: match.start + wikilink.length,
                type: 'wikilink',
            });
            zones.sort((a, b) => a.start - b.start);
            linksAdded++;
            if (!linkedEntities.includes(entityName)) {
                linkedEntities.push(entityName);
            }
        }
    }
    else {
        // For all occurrences mode, process each term
        for (const { term, entityName } of allSearchTerms) {
            // Find all matches of the search term
            const matches = findEntityMatches(result, term, caseInsensitive);
            // Filter out matches in protected zones
            const validMatches = matches.filter(match => !rangeOverlapsProtectedZone(match.start, match.end, zones));
            if (validMatches.length === 0) {
                continue;
            }
            // Process from end to start to preserve positions
            const matchesToProcess = [...validMatches].reverse();
            for (const match of matchesToProcess) {
                // Use display text format when matched text differs from entity name
                const matchedTextLower = match.matched.toLowerCase();
                const entityNameLower = entityName.toLowerCase();
                const wikilink = matchedTextLower === entityNameLower
                    ? `[[${entityName}]]`
                    : `[[${entityName}|${match.matched}]]`;
                result = result.slice(0, match.start) + wikilink + result.slice(match.end);
                // Update protected zones (shift positions after insertion)
                const shift = wikilink.length - match.matched.length;
                zones = zones.map(zone => ({
                    ...zone,
                    start: zone.start <= match.start ? zone.start : zone.start + shift,
                    end: zone.end <= match.start ? zone.end : zone.end + shift,
                }));
                // Add new wikilink as protected zone
                zones.push({
                    start: match.start,
                    end: match.start + wikilink.length,
                    type: 'wikilink',
                });
                zones.sort((a, b) => a.start - b.start);
                linksAdded++;
                if (!linkedEntities.includes(entityName)) {
                    linkedEntities.push(entityName);
                }
            }
        }
    }
    return {
        content: result,
        linksAdded,
        linkedEntities,
    };
}
/**
 * Suggest wikilinks without applying them
 * Returns a list of potential links with their positions
 */
export function suggestWikilinks(content, entities, options = {}) {
    const { firstOccurrenceOnly = true, caseInsensitive = true, } = options;
    const suggestions = [];
    if (!entities.length) {
        return suggestions;
    }
    // Extract entity names, filter and sort
    const sortedEntities = entities
        .map(e => extractEntityName(e))
        .filter(e => !shouldExcludeEntity(e))
        .sort((a, b) => b.length - a.length);
    // Get protected zones
    const zones = getProtectedZones(content);
    const alreadySuggested = new Set();
    for (const entity of sortedEntities) {
        if (firstOccurrenceOnly && alreadySuggested.has(entity.toLowerCase())) {
            continue;
        }
        const matches = findEntityMatches(content, entity, caseInsensitive);
        for (const match of matches) {
            // Skip if in protected zone
            if (rangeOverlapsProtectedZone(match.start, match.end, zones)) {
                continue;
            }
            // Extract context (surrounding text)
            const contextStart = Math.max(0, match.start - 20);
            const contextEnd = Math.min(content.length, match.end + 20);
            const context = content.slice(contextStart, contextEnd);
            suggestions.push({
                entity,
                start: match.start,
                end: match.end,
                context: contextStart > 0 ? '...' + context : context,
            });
            if (firstOccurrenceOnly) {
                alreadySuggested.add(entity.toLowerCase());
                break;
            }
        }
    }
    return suggestions;
}
//# sourceMappingURL=wikilinks.js.map