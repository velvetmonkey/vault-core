/**
 * Session ID management for workflow correlation
 *
 * Allows tracking operations across a single agent workflow,
 * correlating reads (Flywheel) and writes (Flywheel Memory).
 */
/**
 * Generate a unique session ID
 */
export declare function generateSessionId(): string;
/**
 * Get session ID from environment or generate new one
 */
export declare function getSessionId(): string;
/**
 * Set the session ID explicitly (for agent orchestration)
 */
export declare function setSessionId(sessionId: string): void;
/**
 * Clear the session (start fresh)
 */
export declare function clearSession(): void;
/**
 * Create a child session for sub-workflows
 */
export declare function createChildSession(parentSession: string): string;
/**
 * Extract parent session from child session ID
 */
export declare function getParentSession(sessionId: string): string | null;
/**
 * Check if session ID is a child of another
 */
export declare function isChildSession(sessionId: string, parentId: string): boolean;
//# sourceMappingURL=sessionManager.d.ts.map