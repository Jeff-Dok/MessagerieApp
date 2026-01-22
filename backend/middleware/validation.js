/**
 * ============================================
 * VALIDATION ÉTENDUE - Validation des profils
 * ============================================
 *
 * Valide les données des profils utilisateurs enrichis
 *
 * @module middleware/validation
 */

const { body, param, query, validationResult } = require("express-validator");
const {
  HTTP_STATUS,
  PSEUDO_CONFIG,
  BIO_CONFIG,
  AGE_CONFIG,
} = require("../utils/constants");

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Erreurs de validation",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

/**
 * Validation pour l'inscription avec profil complet
 */
const validateRegistration = [
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage("Le nom contient des caractères invalides"),

  body("pseudo")
    .trim()
    .notEmpty()
    .withMessage("Le pseudo est requis")
    .isLength({ min: PSEUDO_CONFIG.MIN_LENGTH, max: PSEUDO_CONFIG.MAX_LENGTH })
    .withMessage(
      `Le pseudo doit contenir entre ${PSEUDO_CONFIG.MIN_LENGTH} et ${PSEUDO_CONFIG.MAX_LENGTH} caractères`,
    )
    .matches(PSEUDO_CONFIG.PATTERN)
    .withMessage("Le pseudo ne peut contenir que des lettres, chiffres, _ et -")
    .custom((value) => {
      if (PSEUDO_CONFIG.RESERVED.includes(value.toLowerCase())) {
        throw new Error("Ce pseudo est réservé");
      }
      return true;
    }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Le mot de passe est requis")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),

  body("dateNaissance")
    .notEmpty()
    .withMessage("La date de naissance est requise")
    .isISO8601()
    .withMessage("Format de date invalide")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();

      // Vérifier que la date est dans le passé
      if (birthDate >= today) {
        throw new Error("La date de naissance doit être dans le passé");
      }

      // Calculer l'âge
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // Vérifier l'âge minimum
      if (age < AGE_CONFIG.MINIMUM) {
        throw new Error(
          `Vous devez avoir au moins ${AGE_CONFIG.MINIMUM} ans pour vous inscrire`,
        );
      }

      return true;
    }),

  body("ville")
    .trim()
    .notEmpty()
    .withMessage("La ville est requise")
    .isLength({ min: 2, max: 100 })
    .withMessage("La ville doit contenir entre 2 et 100 caractères"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: BIO_CONFIG.MAX_LENGTH })
    .withMessage(
      `La bio ne peut pas dépasser ${BIO_CONFIG.MAX_LENGTH} caractères`,
    ),

  handleValidationErrors,
];

/**
 * Validation pour la connexion
 */
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Le mot de passe est requis"),

  handleValidationErrors,
];

/**
 * Validation pour la vérification du statut
 */
const validateCheckStatus = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail(),

  handleValidationErrors,
];

/**
 * Validation pour le rejet de profil
 */
const validateRejectProfile = [
  param("id").isInt({ min: 1 }).withMessage("ID invalide").toInt(),

  body("raison")
    .trim()
    .notEmpty()
    .withMessage("Une raison est requise pour le rejet")
    .isLength({ min: 10, max: 500 })
    .withMessage("La raison doit contenir entre 10 et 500 caractères"),

  handleValidationErrors,
];

/**
 * Validation pour l'approbation en masse
 */
const validateApproveBulk = [
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("Liste d'IDs requise")
    .custom((value) => {
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Tous les IDs doivent être des entiers positifs");
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validation pour la mise à jour du profil
 */
const validateUserUpdate = [
  body("nom")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères"),

  body("ville")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("La ville doit contenir entre 2 et 100 caractères"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: BIO_CONFIG.MAX_LENGTH })
    .withMessage(
      `La bio ne peut pas dépasser ${BIO_CONFIG.MAX_LENGTH} caractères`,
    ),

  handleValidationErrors,
];

/**
 * Validation pour l'envoi de message
 */
const validateMessage = [
  body("receiverId")
    .notEmpty()
    .withMessage("Le destinataire est requis")
    .isInt({ min: 1 })
    .withMessage("ID de destinataire invalide")
    .toInt(),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Le contenu ne peut pas être vide")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Le message doit contenir entre 1 et 5000 caractères"),

  handleValidationErrors,
];

/**
 * Validation pour les paramètres d'ID
 */
const validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID invalide").toInt(),

  handleValidationErrors,
];

/**
 * Validation pour la pagination
 */
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Le numéro de page doit être un entier positif")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("La limite doit être entre 1 et 100")
    .toInt(),

  handleValidationErrors,
];

/**
 * Validation pour la recherche admin
 */
const validateAdminSearch = [
  query("query")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("La requête doit contenir au moins 2 caractères"),

  query("statut")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Statut invalide"),

  query("ville").optional().trim(),

  ...validatePagination,
];

// ============================================
// UTILITAIRES DE VALIDATION GÉNÉRIQUES
// ============================================

/**
 * Crée une validation de champ texte avec options
 * @param {string} fieldName - Nom du champ
 * @param {Object} options - Options de validation
 * @returns {ValidationChain} Chaîne de validation
 */
const createTextFieldValidation = (fieldName, options = {}) => {
  const {
    required = true,
    minLength = 1,
    maxLength = 255,
    pattern = null,
    patternMessage = "Format invalide",
    customMessage = null,
  } = options;

  let validation = body(fieldName).trim();

  if (required) {
    validation = validation
      .notEmpty()
      .withMessage(customMessage || `${fieldName} est requis`);
  } else {
    validation = validation.optional();
  }

  validation = validation
    .isLength({ min: minLength, max: maxLength })
    .withMessage(
      `${fieldName} doit contenir entre ${minLength} et ${maxLength} caractères`
    );

  if (pattern) {
    validation = validation.matches(pattern).withMessage(patternMessage);
  }

  return validation;
};

/**
 * Crée une validation d'email
 * @param {string} fieldName - Nom du champ (défaut: "email")
 * @param {boolean} required - Si le champ est requis
 * @returns {ValidationChain} Chaîne de validation
 */
const createEmailValidation = (fieldName = "email", required = true) => {
  let validation = body(fieldName).trim();

  if (required) {
    validation = validation.notEmpty().withMessage("L'email est requis");
  } else {
    validation = validation.optional();
  }

  return validation
    .isEmail()
    .withMessage("Format d'email invalide")
    .normalizeEmail();
};

/**
 * Crée une validation d'ID (param ou body)
 * @param {string} fieldName - Nom du champ
 * @param {string} location - 'param' ou 'body'
 * @returns {ValidationChain} Chaîne de validation
 */
const createIdValidation = (fieldName = "id", location = "param") => {
  const validator = location === "param" ? param : body;
  return validator(fieldName)
    .isInt({ min: 1 })
    .withMessage(`${fieldName} doit être un entier positif`)
    .toInt();
};

/**
 * Crée une validation de tableau d'IDs
 * @param {string} fieldName - Nom du champ
 * @param {number} minItems - Nombre minimum d'éléments
 * @returns {ValidationChain} Chaîne de validation
 */
const createIdArrayValidation = (fieldName, minItems = 1) => {
  return body(fieldName)
    .isArray({ min: minItems })
    .withMessage(`${fieldName} doit être un tableau avec au moins ${minItems} élément(s)`)
    .custom((value) => {
      if (!value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error("Tous les IDs doivent être des entiers positifs");
      }
      return true;
    });
};

/**
 * Middleware de sanitisation générique
 * Nettoie les entrées utilisateur courantes
 */
const sanitizeInput = (req, res, next) => {
  // Sanitiser le body
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        // Supprimer les espaces en début/fin
        req.body[key] = req.body[key].trim();
        // Supprimer les caractères de contrôle (sauf newline pour les textareas)
        req.body[key] = req.body[key].replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
      }
    }
  }

  // Sanitiser les query params
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].trim();
      }
    }
  }

  next();
};

/**
 * Wrapper pour combiner plusieurs validations avec le handler d'erreurs
 * @param {...ValidationChain} validations - Chaînes de validation
 * @returns {Array} Tableau de middlewares
 */
const withValidation = (...validations) => {
  return [...validations, handleValidationErrors];
};

module.exports = {
  // Validations existantes
  validateRegistration,
  validateLogin,
  validateCheckStatus,
  validateRejectProfile,
  validateApproveBulk,
  validateUserUpdate,
  validateMessage,
  validateId,
  validatePagination,
  validateAdminSearch,
  handleValidationErrors,

  // Nouveaux utilitaires génériques
  createTextFieldValidation,
  createEmailValidation,
  createIdValidation,
  createIdArrayValidation,
  sanitizeInput,
  withValidation,
};
