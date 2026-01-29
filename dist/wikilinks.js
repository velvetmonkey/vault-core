/**
 * Wikilink application logic
 *
 * Applies [[wikilinks]] to known entities in content while
 * respecting protected zones (code, frontmatter, existing links, etc.)
 */
import { getProtectedZones, rangeOverlapsProtectedZone } from './protectedZones.js';
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
 * @param entities - List of entity names to look for
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
    // Filter out excluded words and sort by length (longest first)
    // to avoid partial matches (e.g., "API Management" before "API")
    const sortedEntities = entities
        .filter(e => !shouldExcludeEntity(e))
        .sort((a, b) => b.length - a.length);
    // Get protected zones
    let zones = getProtectedZones(content);
    let result = content;
    let linksAdded = 0;
    const linkedEntities = [];
    for (const entity of sortedEntities) {
        // Find all matches
        const matches = findEntityMatches(result, entity, caseInsensitive);
        // Filter out matches in protected zones
        const validMatches = matches.filter(match => !rangeOverlapsProtectedZone(match.start, match.end, zones));
        if (validMatches.length === 0) {
            continue;
        }
        // Determine which matches to process
        const matchesToProcess = firstOccurrenceOnly
            ? [validMatches[0]]
            : [...validMatches].reverse(); // Process from end to start to preserve positions
        for (const match of matchesToProcess) {
            // Apply wikilink (use original entity name for consistency)
            const wikilink = `[[${entity}]]`;
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
            if (!linkedEntities.includes(entity)) {
                linkedEntities.push(entity);
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
    // Filter and sort entities
    const sortedEntities = entities
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