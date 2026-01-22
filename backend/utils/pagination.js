/**
 * ============================================
 * PAGINATION HELPER - Utilitaires de pagination
 * ============================================
 *
 * Fonctions helpers pour la pagination des requêtes
 *
 * @module utils/pagination
 */

/**
 * Configuration par défaut de la pagination
 */
const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

/**
 * Parse et valide les paramètres de pagination depuis la requête
 * @param {Object} query - Objet req.query
 * @param {Object} options - Options de configuration
 * @param {number} [options.defaultLimit=50] - Limite par défaut
 * @param {number} [options.maxLimit=100] - Limite maximale
 * @returns {Object} Paramètres de pagination validés
 */
function parsePaginationParams(query, options = {}) {
  const {
    defaultLimit = PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    maxLimit = PAGINATION_DEFAULTS.MAX_LIMIT,
  } = options;

  const page = Math.max(
    PAGINATION_DEFAULTS.DEFAULT_PAGE,
    parseInt(query.page) || PAGINATION_DEFAULTS.DEFAULT_PAGE
  );

  const limit = Math.min(
    maxLimit,
    Math.max(PAGINATION_DEFAULTS.MIN_LIMIT, parseInt(query.limit) || defaultLimit)
  );

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Construit l'objet de réponse paginée
 * @param {Object} params - Paramètres
 * @param {Array} params.data - Données de la page
 * @param {number} params.total - Nombre total d'éléments
 * @param {number} params.page - Page actuelle
 * @param {number} params.limit - Limite par page
 * @returns {Object} Objet de réponse avec métadonnées de pagination
 */
function buildPaginatedResponse({ data, total, page, limit }) {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Middleware Express pour parser la pagination
 * Ajoute req.pagination avec { page, limit, offset }
 * @param {Object} options - Options de configuration
 * @returns {Function} Middleware Express
 */
function paginationMiddleware(options = {}) {
  return (req, res, next) => {
    req.pagination = parsePaginationParams(req.query, options);
    next();
  };
}

/**
 * Génère les options Sequelize pour la pagination
 * @param {Object} pagination - Objet pagination { limit, offset }
 * @returns {Object} Options Sequelize { limit, offset }
 */
function getSequelizePaginationOptions(pagination) {
  return {
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

module.exports = {
  PAGINATION_DEFAULTS,
  parsePaginationParams,
  buildPaginatedResponse,
  paginationMiddleware,
  getSequelizePaginationOptions,
};
