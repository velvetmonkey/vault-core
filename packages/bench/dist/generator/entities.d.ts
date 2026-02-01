/**
 * Entity generation for realistic vault content
 */
import type { GeneratedEntity, EntityType } from '../types.js';
import { SeededRandom } from './notes.js';
/**
 * Generate a set of entities for a vault
 */
export declare function generateEntities(rng: SeededRandom, entityTypes: EntityType[], entityCount: Record<EntityType, number>): GeneratedEntity[];
/**
 * Create note files for entities that don't have dedicated notes
 */
export declare function generateEntityNotes(rng: SeededRandom, entities: GeneratedEntity[]): Map<string, string>;
//# sourceMappingURL=entities.d.ts.map