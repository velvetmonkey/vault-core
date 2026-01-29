/**
 * Entity scanning and discovery for vault wikilinks
 *
 * Scans vault for .md files and extracts valid entities (file stems)
 * that can be wikilinked. Filters out periodic notes and categorizes
 * entities by type.
 */
import fs from 'fs/promises';
import path from 'path';
/**
 * Default patterns for filtering out periodic notes and system files
 */
const DEFAULT_EXCLUDE_PATTERNS = [
    /^\d{4}-\d{2}-\d{2}$/, // ISO dates: 2025-01-01
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // UK dates: 1/10/2024
    /^\d{4}-W\d{2}$/, // Week dates: 2025-W17
    /^\d{4}-\d{2}$/, // Month format: 2025-01
    /^\d{4}-Q\d$/, // Quarter dates: 2025-Q4
    /^\d+$/, // Pure numbers
    /^@/, // Twitter handles
    /^</, // XML/HTML tags
    /^\{\{/, // Template placeholders
    /\\$/, // Paths ending in backslash
    /\.(?:md|js|py|json|jpg|png|pdf|csv)$/i, // File extensions
    /^[a-z0-9_-]+\.[a-z]+$/i, // File names with extensions
];
/**
 * Default tech keywords for categorization
 */
const DEFAULT_TECH_KEYWORDS = [
    'databricks', 'api', 'code', 'azure', 'sql', 'git',
    'node', 'react', 'powerbi', 'excel', 'copilot',
    'fabric', 'apim', 'endpoint', 'synology', 'tailscale',
    'obsidian', 'claude', 'powershell', 'mcp', 'typescript',
    'javascript', 'python', 'docker', 'kubernetes',
    'adf', 'adb', 'net', 'aws', 'gcp', 'terraform',
];
/**
 * Check if a file/folder name should be skipped (dot-prefixed)
 */
function isDotPath(pathStr) {
    return path.basename(pathStr).startsWith('.');
}
/**
 * Check if entity name matches any exclude pattern
 */
function matchesExcludePattern(name) {
    return DEFAULT_EXCLUDE_PATTERNS.some(pattern => pattern.test(name));
}
/**
 * Categorize an entity based on its name
 */
function categorizeEntity(name, techKeywords) {
    const nameLower = name.toLowerCase();
    // Technology check
    if (techKeywords.some(tech => nameLower.includes(tech))) {
        return 'technologies';
    }
    // Acronym check (2-6 uppercase letters)
    if (name === name.toUpperCase() && name.length >= 2 && name.length <= 6) {
        return 'acronyms';
    }
    // People check (two words, capitalized)
    if (name.includes(' ') && name.split(' ').length === 2) {
        return 'people';
    }
    // Projects check (multi-word)
    if (name.includes(' ')) {
        return 'projects';
    }
    return 'other';
}
/**
 * Recursively scan a directory for markdown files
 */
async function scanDirectory(dirPath, excludeFolders) {
    const entities = [];
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            // Skip dot directories
            if (entry.isDirectory() && isDotPath(entry.name)) {
                continue;
            }
            // Skip excluded folders
            if (entry.isDirectory() && excludeFolders.some(f => entry.name.toLowerCase() === f.toLowerCase())) {
                continue;
            }
            if (entry.isDirectory()) {
                // Recurse into subdirectory
                const subEntities = await scanDirectory(fullPath, excludeFolders);
                entities.push(...subEntities);
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                // Extract file stem (without .md extension)
                const stem = path.basename(entry.name, '.md');
                entities.push(stem);
            }
        }
    }
    catch (error) {
        // Skip directories we can't read
        console.error(`[vault-core] Error scanning ${dirPath}:`, error);
    }
    return entities;
}
/**
 * Scan vault for entities (markdown file stems) that can be wikilinked
 */
export async function scanVaultEntities(vaultPath, options = {}) {
    const excludeFolders = options.excludeFolders ?? [];
    const techKeywords = options.techKeywords ?? DEFAULT_TECH_KEYWORDS;
    // Scan vault for all markdown files
    const allEntities = await scanDirectory(vaultPath, excludeFolders);
    // Filter out periodic notes and invalid entries
    const validEntities = allEntities.filter(entity => entity.length >= 2 && !matchesExcludePattern(entity));
    // Remove duplicates
    const uniqueEntities = [...new Set(validEntities)];
    // Categorize entities
    const index = {
        technologies: [],
        acronyms: [],
        people: [],
        projects: [],
        other: [],
        _metadata: {
            total_entities: 0,
            generated_at: new Date().toISOString(),
            vault_path: vaultPath,
            source: 'vault-core scanVaultEntities',
        },
    };
    for (const entity of uniqueEntities) {
        const category = categorizeEntity(entity, techKeywords);
        index[category].push(entity);
    }
    // Sort each category
    index.technologies.sort();
    index.acronyms.sort();
    index.people.sort();
    index.projects.sort();
    index.other.sort();
    // Update metadata
    index._metadata.total_entities =
        index.technologies.length +
            index.acronyms.length +
            index.people.length +
            index.projects.length +
            index.other.length;
    return index;
}
/**
 * Get all entities as a flat array (for wikilink matching)
 */
export function getAllEntities(index) {
    return [
        ...index.technologies,
        ...index.acronyms,
        ...index.people,
        ...index.projects,
        ...index.other,
    ];
}
/**
 * Filter periodic notes from a list of entities
 * Useful when loading from external sources
 */
export function filterPeriodicNotes(entities) {
    return entities.filter(entity => !matchesExcludePattern(entity));
}
/**
 * Load entity index from a cache file (JSON format)
 */
export async function loadEntityCache(cachePath) {
    try {
        const content = await fs.readFile(cachePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Save entity index to a cache file
 */
export async function saveEntityCache(cachePath, index) {
    const dir = path.dirname(cachePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(index, null, 2), 'utf-8');
}
//# sourceMappingURL=entities.js.map