/**
 * ============================================
 * RATE LIMITER - Limitation de requêtes
 * ============================================
 * 
 * Middleware pour limiter le nombre de requêtes par IP
 * Protection contre les abus et attaques DDoS
 * 
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Configuration du rate limiter global
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max 100 requêtes
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  
  // Handler personnalisé
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour IP: ${req.ip}`);
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer dans quelques minutes'
    });
  },

  // Ne pas compter les requêtes réussies
  skipSuccessfulRequests: false,
  
  // Ne pas compter les requêtes échouées
  skipFailedRequests: false
});

/**
 * Rate limiter strict pour l'authentification
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 tentatives
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true // Ne compte que les échecs
});

/**
 * Rate limiter pour l'upload d'images
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 images par minute
  message: {
    success: false,
    message: 'Trop d\'images envoyées, veuillez ralentir'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});

module.exports = {
  limiter,
  authLimiter,
  uploadLimiter
};