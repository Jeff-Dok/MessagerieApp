/**
 * ============================================
 * VALIDATION - Validation côté client
 * ============================================
 * 
 * Fonctions de validation pour formulaires frontend
 * 
 * Fonctionnalités:
 * - Validation de champs de formulaire
 * - Messages d'erreur personnalisés
 * - Validation en temps réel
 * - Règles de validation configurables
 * 
 * @module utils/validation
 * @author MessagerieApp
 * @version 2.0.0
 */

/**
 * Configuration de validation
 */
const VALIDATION_CONFIG = {
  // Email
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Mot de passe
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 255,
  
  // Pseudo
  PSEUDO_MIN_LENGTH: 3,
  PSEUDO_MAX_LENGTH: 50,
  PSEUDO_REGEX: /^[a-zA-Z0-9_-]+$/,
  PSEUDO_RESERVED: ['admin', 'root', 'moderator', 'system', 'support'],
  
  // Nom
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  NAME_REGEX: /^[a-zA-ZÀ-ÿ\s'-]+$/,
  
  // Bio
  BIO_MAX_LENGTH: 500,
  
  // Ville
  CITY_MIN_LENGTH: 2,
  CITY_MAX_LENGTH: 100,
  
  // Âge
  AGE_MINIMUM: 13,
  
  // Message
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 5000
};

/**
 * Messages d'erreur par défaut
 */
const ERROR_MESSAGES = {
  required: 'Ce champ est requis',
  email: 'Format d\'email invalide',
  passwordMinLength: `Le mot de passe doit contenir au moins ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} caractères`,
  passwordMaxLength: `Le mot de passe ne peut pas dépasser ${VALIDATION_CONFIG.PASSWORD_MAX_LENGTH} caractères`,
  pseudoMinLength: `Le pseudo doit contenir au moins ${VALIDATION_CONFIG.PSEUDO_MIN_LENGTH} caractères`,
  pseudoMaxLength: `Le pseudo ne peut pas dépasser ${VALIDATION_CONFIG.PSEUDO_MAX_LENGTH} caractères`,
  pseudoFormat: 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -',
  pseudoReserved: 'Ce pseudo est réservé',
  nameMinLength: `Le nom doit contenir au moins ${VALIDATION_CONFIG.NAME_MIN_LENGTH} caractères`,
  nameMaxLength: `Le nom ne peut pas dépasser ${VALIDATION_CONFIG.NAME_MAX_LENGTH} caractères`,
  nameFormat: 'Le nom contient des caractères invalides',
  bioMaxLength: `La bio ne peut pas dépasser ${VALIDATION_CONFIG.BIO_MAX_LENGTH} caractères`,
  cityMinLength: `La ville doit contenir au moins ${VALIDATION_CONFIG.CITY_MIN_LENGTH} caractères`,
  cityMaxLength: `La ville ne peut pas dépasser ${VALIDATION_CONFIG.CITY_MAX_LENGTH} caractères`,
  ageMinimum: `Vous devez avoir au moins ${VALIDATION_CONFIG.AGE_MINIMUM} ans`,
  dateFuture: 'La date doit être dans le passé',
  messageMinLength: 'Le message ne peut pas être vide',
  messageMaxLength: `Le message ne peut pas dépasser ${VALIDATION_CONFIG.MESSAGE_MAX_LENGTH} caractères`,
  passwordMatch: 'Les mots de passe ne correspondent pas',
  fileType: 'Type de fichier invalide',
  fileSize: 'Fichier trop volumineux',
  url: 'URL invalide',
  number: 'Doit être un nombre',
  min: 'Valeur trop petite',
  max: 'Valeur trop grande'
};

/**
 * Classe de validation de formulaires
 */
class FormValidator {
  /**
   * Constructeur
   * @param {HTMLFormElement} form - Formulaire à valider
   * @param {Object} rules - Règles de validation
   * @param {Object} messages - Messages personnalisés
   */
  constructor(form, rules = {}, messages = {}) {
    this.form = form;
    this.rules = rules;
    this.messages = { ...ERROR_MESSAGES, ...messages };
    this.errors = {};
    
    this._setupValidation();
  }

  /**
   * Configure la validation en temps réel
   * @private
   */
  _setupValidation() {
    // Valider au blur
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => {
        this._validateField(field);
      });
      
      // Retirer l'erreur au focus
      field.addEventListener('focus', () => {
        this._clearFieldError(field);
      });
    });

    // Valider à la soumission
    this.form.addEventListener('submit', (e) => {
      if (!this.validate()) {
        e.preventDefault();
        this._focusFirstError();
      }
    });
  }

  /**
   * Valide un champ
   * @param {HTMLInputElement} field - Champ à valider
   * @returns {boolean} True si valide
   * @private
   */
  _validateField(field) {
    const name = field.name;
    const value = field.value;
    const fieldRules = this.rules[name];

    if (!fieldRules) return true;

    // Réinitialiser les erreurs
    delete this.errors[name];

    // Appliquer les règles
    for (const [rule, param] of Object.entries(fieldRules)) {
      const validator = this._getValidator(rule);
      
      if (validator && !validator(value, param, field)) {
        this.errors[name] = this._getMessage(rule, param);
        this._showFieldError(field, this.errors[name]);
        return false;
      }
    }

    this._clearFieldError(field);
    return true;
  }

  /**
   * Retourne un validateur
   * @param {string} rule - Nom de la règle
   * @returns {Function} Fonction de validation
   * @private
   */
  _getValidator(rule) {
    const validators = {
      required: (value) => value.trim().length > 0,
      email: (value) => !value || VALIDATION_CONFIG.EMAIL_REGEX.test(value),
      minLength: (value, min) => !value || value.length >= min,
      maxLength: (value, max) => !value || value.length <= max,
      pattern: (value, regex) => !value || new RegExp(regex).test(value),
      min: (value, min) => !value || Number(value) >= min,
      max: (value, max) => !value || Number(value) <= max,
      match: (value, fieldName) => {
        const otherField = this.form.elements[fieldName];
        return !value || value === otherField.value;
      },
      custom: (value, fn) => fn(value)
    };

    return validators[rule];
  }

  /**
   * Retourne un message d'erreur
   * @param {string} rule - Règle
   * @param {*} param - Paramètre
   * @returns {string} Message
   * @private
   */
  _getMessage(rule, param) {
    if (this.messages[rule]) {
      return typeof this.messages[rule] === 'function' 
        ? this.messages[rule](param)
        : this.messages[rule];
    }
    return ERROR_MESSAGES[rule] || 'Erreur de validation';
  }

  /**
   * Affiche l'erreur d'un champ
   * @param {HTMLInputElement} field - Champ
   * @param {string} message - Message d'erreur
   * @private
   */
  _showFieldError(field, message) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');

    // Retirer l'ancien message
    this._clearFieldError(field);

    // Créer le nouveau message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');

    field.parentNode.appendChild(errorDiv);
  }

  /**
   * Retire l'erreur d'un champ
   * @param {HTMLInputElement} field - Champ
   * @private
   */
  _clearFieldError(field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');

    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  /**
   * Focus le premier champ en erreur
   * @private
   */
  _focusFirstError() {
    const firstError = this.form.querySelector('.error');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Valide tout le formulaire
   * @returns {boolean} True si valide
   */
  validate() {
    this.errors = {};
    let isValid = true;

    Object.keys(this.rules).forEach(fieldName => {
      const field = this.form.elements[fieldName];
      if (field && !this._validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Retourne les erreurs
   * @returns {Object} Erreurs
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Réinitialise la validation
   */
  reset() {
    this.errors = {};
    this.form.querySelectorAll('.error').forEach(field => {
      this._clearFieldError(field);
    });
  }
}

/**
 * Fonctions de validation individuelles
 */
const Validators = {
  /**
   * Valide un email
   * @param {string} email - Email
   * @returns {Object} Résultat
   */
  validateEmail(email) {
    if (!email || email.trim().length === 0) {
      return { valid: false, error: ERROR_MESSAGES.required };
    }

    if (!VALIDATION_CONFIG.EMAIL_REGEX.test(email)) {
      return { valid: false, error: ERROR_MESSAGES.email };
    }

    return { valid: true };
  },

  /**
   * Valide un mot de passe
   * @param {string} password - Mot de passe
   * @returns {Object} Résultat
   */
  validatePassword(password) {
    if (!password || password.length === 0) {
      return { valid: false, error: ERROR_MESSAGES.required };
    }

    if (password.length < VALIDATION_CONFIG.PASSWORD_MIN_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.passwordMinLength };
    }

    if (password.length > VALIDATION_CONFIG.PASSWORD_MAX_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.passwordMaxLength };
    }

    return { valid: true };
  },

  /**
   * Valide un pseudo
   * @param {string} pseudo - Pseudo
   * @returns {Object} Résultat
   */
  validatePseudo(pseudo) {
    if (!pseudo || pseudo.trim().length === 0) {
      return { valid: false, error: ERROR_MESSAGES.required };
    }

    if (pseudo.length < VALIDATION_CONFIG.PSEUDO_MIN_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.pseudoMinLength };
    }

    if (pseudo.length > VALIDATION_CONFIG.PSEUDO_MAX_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.pseudoMaxLength };
    }

    if (!VALIDATION_CONFIG.PSEUDO_REGEX.test(pseudo)) {
      return { valid: false, error: ERROR_MESSAGES.pseudoFormat };
    }

    if (VALIDATION_CONFIG.PSEUDO_RESERVED.includes(pseudo.toLowerCase())) {
      return { valid: false, error: ERROR_MESSAGES.pseudoReserved };
    }

    return { valid: true };
  },

  /**
   * Valide un nom
   * @param {string} name - Nom
   * @returns {Object} Résultat
   */
  validateName(name) {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: ERROR_MESSAGES.required };
    }

    if (name.length < VALIDATION_CONFIG.NAME_MIN_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.nameMinLength };
    }

    if (name.length > VALIDATION_CONFIG.NAME_MAX_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.nameMaxLength };
    }

    if (!VALIDATION_CONFIG.NAME_REGEX.test(name)) {
      return { valid: false, error: ERROR_MESSAGES.nameFormat };
    }

    return { valid: true };
  },

  /**
   * Valide une date de naissance
   * @param {string} dateStr - Date ISO
   * @returns {Object} Résultat
   */
  validateBirthdate(dateStr) {
    if (!dateStr) {
      return { valid: false, error: ERROR_MESSAGES.required };
    }

    const birthDate = new Date(dateStr);
    const today = new Date();

    if (birthDate >= today) {
      return { valid: false, error: ERROR_MESSAGES.dateFuture };
    }

    // Calculer l'âge
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < VALIDATION_CONFIG.AGE_MINIMUM) {
      return { valid: false, error: ERROR_MESSAGES.ageMinimum };
    }

    return { valid: true };
  },

  /**
   * Valide une bio
   * @param {string} bio - Bio
   * @returns {Object} Résultat
   */
  validateBio(bio) {
    if (!bio) return { valid: true }; // Optionnel

    if (bio.length > VALIDATION_CONFIG.BIO_MAX_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.bioMaxLength };
    }

    return { valid: true };
  },

  /**
   * Valide une ville
   * @param {string} city - Ville
   * @returns {Object} Résultat
   */
  validateCity(city) {
    if (!city || city.trim().length === 0) {
      return { valid: false, error: ERROR_MESSAGES.required };
    }

    if (city.length < VALIDATION_CONFIG.CITY_MIN_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.cityMinLength };
    }

    if (city.length > VALIDATION_CONFIG.CITY_MAX_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.cityMaxLength };
    }

    return { valid: true };
  },

  /**
   * Valide un message
   * @param {string} message - Message
   * @returns {Object} Résultat
   */
  validateMessage(message) {
    if (!message || message.trim().length === 0) {
      return { valid: false, error: ERROR_MESSAGES.messageMinLength };
    }

    if (message.length > VALIDATION_CONFIG.MESSAGE_MAX_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.messageMaxLength };
    }

    return { valid: true };
  },

  /**
   * Valide que deux champs correspondent
   * @param {string} value1 - Première valeur
   * @param {string} value2 - Deuxième valeur
   * @returns {Object} Résultat
   */
  validateMatch(value1, value2) {
    if (value1 !== value2) {
      return { valid: false, error: ERROR_MESSAGES.passwordMatch };
    }

    return { valid: true };
  }
};

/**
 * Utilitaires de validation
 */
const ValidationUtils = {
  /**
   * Vérifie si une valeur est vide
   * @param {*} value - Valeur
   * @returns {boolean} True si vide
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  /**
   * Nettoie une chaîne
   * @param {string} str - Chaîne
   * @returns {string} Chaîne nettoyée
   */
  sanitize(str) {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ');
  },

  /**
   * Affiche une erreur de formulaire
   * @param {string} message - Message
   * @param {string} containerId - ID du container
   */
  showFormError(message, containerId = 'messageZone') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const errorDiv = document.getElementById('errorMessage') || 
                     container.querySelector('.alert-error');
    
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
      container.classList.remove('hidden');

      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }
  },

  /**
   * Retire les erreurs de formulaire
   * @param {string} containerId - ID du container
   */
  clearFormErrors(containerId = 'messageZone') {
    const container = document.getElementById(containerId);
    if (container) {
      container.classList.add('hidden');
      container.querySelectorAll('.alert').forEach(alert => {
        alert.classList.add('hidden');
      });
    }
  }
};

// Export global
if (typeof window !== 'undefined') {
  window.FormValidator = FormValidator;
  window.Validators = Validators;
  window.ValidationUtils = ValidationUtils;
  window.VALIDATION_CONFIG = VALIDATION_CONFIG;
  
  // Compatibilité avec ancien code
  window.isValidEmail = (email) => Validators.validateEmail(email).valid;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormValidator,
    Validators,
    ValidationUtils,
    VALIDATION_CONFIG,
    ERROR_MESSAGES
  };
}