/**
 * ============================================
 * ERROR HANDLER - Gestionnaire d'erreurs global
 * ============================================
 *
 * Middleware pour gérer toutes les erreurs de l'application
 *
 * @module middleware/errorHandler
 */

const { HTTP_STATUS } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Gestionnaire d'erreurs global
 * Doit être le dernier middleware de l'application
 */
const errorHandler = (err, req, res, next) => {
  // Logger l'erreur complète en développement
  if (process.env.NODE_ENV === "development") {
    logger.error("Erreur complète:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    logger.error("Erreur:", err.message);
  }

  // Erreurs Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Erreur de validation",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
        type: e.type,
      })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: "Cette valeur existe déjà",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === "SequelizeDatabaseError") {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Erreur de base de données",
      ...(process.env.NODE_ENV === "development" && { detail: err.message }),
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Référence invalide",
      detail: "L'entité référencée n'existe pas",
    });
  }

  // Erreurs JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide",
      code: "TOKEN_INVALID",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token expiré",
      code: "TOKEN_EXPIRED",
    });
  }

  // Erreurs Multer (upload)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Fichier trop volumineux",
        maxSize: "5MB",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Champ de fichier inattendu",
        expectedField: "image",
      });
    }

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Erreur lors de l'upload",
      detail: err.message,
    });
  }

  // Erreur de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "JSON invalide dans la requête",
    });
  }

  // Erreur de casting (ID invalide, etc.)
  if (err.name === "CastError") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Format de données invalide",
      field: err.path,
    });
  }

  // Erreurs personnalisées avec statusCode
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || "Erreur serveur interne";

  // Réponse par défaut
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

/**
 * Wrapper pour les fonctions async
 * Capture automatiquement les erreurs et les passe au gestionnaire
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Créer une erreur personnalisée avec statusCode
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.AppError = AppError;
