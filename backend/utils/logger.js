/**
 * Logger Utility
 * Nusantara Commodity Exchange (NCE)
 *
 * Simple logger with levels: debug, info, warn, error.
 * Format: [TIMESTAMP] [LEVEL] message
 * Uses console methods with consistent formatting.
 *
 * @module utils/logger
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLOR_CODES = {
  debug: '\x1b[36m',  // cyan
  info: '\x1b[32m',   // green
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  reset: '\x1b[0m',
};

/**
 * Resolve the minimum log level from the environment.
 * Defaults to 'info' if not set or invalid.
 *
 * @returns {number} Numeric log level threshold
 */
function getMinLevel() {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.info;
}

/**
 * Format a timestamp in ISO 8601 local-friendly format.
 *
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Build the formatted log prefix string.
 *
 * @param {string} level - Log level label
 * @returns {string} Formatted prefix like "[2024-01-01T00:00:00.000Z] [INFO]"
 */
function formatPrefix(level) {
  const upper = level.toUpperCase().padEnd(5);
  return `[${getTimestamp()}] [${upper}]`;
}

/**
 * Core log function. Only outputs if the message level meets the threshold.
 *
 * @param {string} level   - Log level
 * @param {Array<*>} args  - Arguments to log
 */
function log(level, ...args) {
  if (LOG_LEVELS[level] < getMinLevel()) {
    return;
  }

  const prefix = formatPrefix(level);
  const color = COLOR_CODES[level] || '';
  const reset = COLOR_CODES.reset;

  switch (level) {
    case 'debug':
      console.debug(`${color}${prefix}${reset}`, ...args);
      break;
    case 'info':
      console.info(`${color}${prefix}${reset}`, ...args);
      break;
    case 'warn':
      console.warn(`${color}${prefix}${reset}`, ...args);
      break;
    case 'error':
      console.error(`${color}${prefix}${reset}`, ...args);
      break;
    default:
      console.log(`${prefix}`, ...args);
  }
}

// ---------------------------------------------------------------------------
// Logger Object
// ---------------------------------------------------------------------------

const logger = {
  /**
   * Log at DEBUG level. Typically used for detailed diagnostic information.
   *
   * @param {...*} args - Messages or objects to log
   */
  debug(...args) {
    log('debug', ...args);
  },

  /**
   * Log at INFO level. General operational messages.
   *
   * @param {...*} args - Messages or objects to log
   */
  info(...args) {
    log('info', ...args);
  },

  /**
   * Log at WARN level. Potentially harmful situations that are not errors.
   *
   * @param {...*} args - Messages or objects to log
   */
  warn(...args) {
    log('warn', ...args);
  },

  /**
   * Log at ERROR level. Error events that might still allow the app to continue.
   *
   * @param {...*} args - Messages or objects to log
   */
  error(...args) {
    log('error', ...args);
  },
};

export default logger;
