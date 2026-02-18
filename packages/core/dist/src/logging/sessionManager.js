/**
 * Session ID management for workflow correlation
 *
 * Allows tracking operations across a single agent workflow,
 * correlating reads (Flywheel) and writes (Flywheel Memory).
 */
import { randomBytes } from 'crypto';
/**
 * Generate a unique session ID
 */
export function generateSessionId() {
    return randomBytes(8).toString('hex');
}
/**
 * Get session ID from environment or generate new one
 */
export function getSessionId() {
    // Check environment variable first (for agent-provided session)
    const envSession = process.env.FLYWHEEL_SESSION_ID;
    if (envSession) {
        return envSession;
    }
    // Check for cached session in process
    if (!globalSessionId) {
        globalSessionId = generateSessionId();
    }
    return globalSessionId;
}
// Module-level session cache
let globalSessionId = null;
/**
 * Set the session ID explicitly (for agent orchestration)
 */
export function setSessionId(sessionId) {
    globalSessionId = sessionId;
    process.env.FLYWHEEL_SESSION_ID = sessionId;
}
/**
 * Clear the session (start fresh)
 */
export function clearSession() {
    globalSessionId = null;
    delete process.env.FLYWHEEL_SESSION_ID;
}
/**
 * Create a child session for sub-workflows
 */
export function createChildSession(parentSession) {
    const childId = randomBytes(4).toString('hex');
    return `${parentSession}.${childId}`;
}
/**
 * Extract parent session from child session ID
 */
export function getParentSession(sessionId) {
    const parts = sessionId.split('.');
    if (parts.length < 2) {
        return null;
    }
    return parts.slice(0, -1).join('.');
}
/**
 * Check if session ID is a child of another
 */
export function isChildSession(sessionId, parentId) {
    return sessionId.startsWith(parentId + '.');
}
//# sourceMappingURL=sessionManager.js.map