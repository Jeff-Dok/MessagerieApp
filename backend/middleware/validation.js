/**
 * ============================================
 * VALIDATION MIDDLEWARE - Validation des données
 * ============================================
 * 
 * Valide les données des requêtes avec express-validator
 * 
 * @module middleware/validation
 */

const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Validation pour l'inscription
 */
const validateRegistration = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom contient des caractères invalides'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  handleValidationErrors
];

/**
 * Validation pour la connexion
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

/**
 * Validation pour la mise à jour d'utilisateur
 */
const validateUserUpdate = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Format d\'email invalide')
    .normalizeEmail(),
  
  handleValidationErrors
];

/**
 * Validation pour l'envoi de message
 */
const validateMessage = [
  body('receiverId')
    .notEmpty().withMessage('Le destinataire est requis')
    .isInt({ min: 1 }).withMessage('ID de destinataire invalide')
    .toInt(),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Le contenu ne peut pas être vide')
    .isLength({ min: 1, max: 5000 }).withMessage('Le message doit contenir entre 1 et 5000 caractères'),
  
  handleValidationErrors
];

/**
 * Validation pour les paramètres d'ID
 */
const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID invalide')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validation pour la pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100')
    .toInt(),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateUserUpdate,
  validateMessage,
  validateId,
  validatePagination,
  handleValidationErrors
};