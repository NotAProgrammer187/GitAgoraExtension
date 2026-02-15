/** Interval between live presence pings (ms) */
export const PULSE_INTERVAL_MS = 30_000;

/** Interval between idle-detection checks (ms) */
export const IDLE_CHECK_INTERVAL_MS = 30_000;

/** Interval between heartbeat flush attempts (ms) */
export const FLUSH_INTERVAL_MS = 2 * 60 * 1000;

/** Minimum session duration to be recorded (seconds) */
export const MIN_SESSION_DURATION_SECS = 30;

/** Interval between status bar UI updates (ms) */
export const STATUS_BAR_UPDATE_INTERVAL_MS = 60_000;

/** Timeout for standard API requests (ms) */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Timeout for pulse API requests (ms) */
export const PULSE_TIMEOUT_MS = 5_000;
