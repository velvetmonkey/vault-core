/**
 * Shared logging types for Flywheel ecosystem
 *
 * Used by both Flywheel (read) and Flywheel Memory (write) for
 * unified operation logging and metrics.
 */
/**
 * Default logging configuration (disabled by default)
 */
export const DEFAULT_LOGGING_CONFIG = {
    enabled: false,
    logPath: '.flywheel/operation-log.jsonl',
    includeToolNames: true,
    includeDurations: true,
    includeSessionIds: true,
    includeResults: false,
    rotation: {
        maxSize: '10MB',
        maxFiles: 5,
    },
    retentionDays: 30,
};
//# sourceMappingURL=types.js.map