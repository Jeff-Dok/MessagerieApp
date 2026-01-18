/**
 * ============================================
 * LOGGER - Système de journalisation
 * ============================================
 * 
 * Utilitaire pour logger les messages avec différents niveaux
 * 
 * @module utils/logger
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Formate un message avec timestamp
 * @param {string} level - Niveau de log
 * @param {string} message - Message à logger
 * @returns {string} Message formaté
 */
function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Logger principal
 */
const logger = {
  /**
   * Log d'information
   */
  info: (message, ...args) => {
    console.log(
      `${colors.blue}ℹ ${formatMessage('INFO', message)}${colors.reset}`,
      ...args
    );
  },

  /**
   * Log de succès
   */
  success: (message, ...args) => {
    console.log(
      `${colors.green}✓ ${formatMessage('SUCCESS', message)}${colors.reset}`,
      ...args
    );
  },

  /**
   * Log d'avertissement
   */
  warn: (message, ...args) => {
    console.warn(
      `${colors.yellow}⚠ ${formatMessage('WARN', message)}${colors.reset}`,
      ...args
    );
  },

  /**
   * Log d'erreur
   */
  error: (message, ...args) => {
    console.error(
      `${colors.red}✖ ${formatMessage('ERROR', message)}${colors.reset}`,
      ...args
    );
  },

  /**
   * Log de débogage
   */
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.magenta}⚙ ${formatMessage('DEBUG', message)}${colors.reset}`,
        ...args
      );
    }
  }
};

module.exports = logger;