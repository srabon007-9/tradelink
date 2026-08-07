/**
 * utils/logger.js — Application Logger
 *
 * Thin wrapper around console for now.
 * Swap the implementation for winston or pino without changing call sites.
 *
 * Log levels: info, warn, error, debug
 */

'use strict';

const isDev = process.env.NODE_ENV !== 'production';

const timestamp = () => new Date().toISOString();

const logger = {
  /**
   * @param {string} message
   * @param {...any} args
   */
  info: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.log(`[${timestamp()}] INFO: ${message}`, ...args);
  },

  warn: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.warn(`[${timestamp()}] WARN: ${message}`, ...args);
  },

  error: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.error(`[${timestamp()}] ERROR: ${message}`, ...args);
  },

  debug: (message, ...args) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(`[${timestamp()}] DEBUG: ${message}`, ...args);
    }
  },
};

module.exports = logger;
