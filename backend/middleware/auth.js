/**
 * ============================================
 * AUTH MIDDLEWARE - Middleware d'authentification
 * ============================================
 * 
 * Vérifie les tokens JWT et les permissions
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { HTTP_STATUS, SERVER_MESSAGES, USER_ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 * Vérifie et décode le token JWT
 */
const authenticate = (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: SERVER_MESSAGES.AUTH.TOKEN_MISSING
      });
    }

    // Extraire le token
    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Ajouter les infos utilisateur à la requête
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();

  } catch (error) {
    // Gestion des erreurs de token
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: SERVER_MESSAGES.AUTH.TOKEN_INVALID,
        code: 'TOKEN_INVALID'
      });
    }

    logger.error('Erreur d\'authentification:', error);
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: SERVER_MESSAGES.AUTH.UNAUTHORIZED
    });
  }
};

/**
 * Middleware de vérification du rôle admin
 * À utiliser après authenticate
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: SERVER_MESSAGES.AUTH.UNAUTHORIZED
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    logger.warn(`Accès admin refusé pour utilisateur ${req.user.userId}`);
    
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Accès refusé - Droits administrateur requis'
    });
  }

  next();
};

/**
 * Middleware optionnel d'authentification
 * Continue même si pas de token (req.user sera undefined)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticate,
  isAdmin,
  optionalAuth
};