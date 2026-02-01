/**
 * Folder structure generation for realistic vault layouts
 */
import { SeededRandom } from './notes.js';
export interface FolderStructure {
    path: string;
    depth: number;
    noteCapacity: number;
}
/**
 * Generate folder structure for a vault
 */
export declare function generateFolderStructure(rng: SeededRandom, maxDepth: number, noteCount: number): FolderStructure[];
/**
 * Get a random folder for placing a note
 */
export declare function pickFolderForNote(rng: SeededRandom, folders: FolderStructure[]): string;
//# sourceMappingURL=structure.d.ts.map