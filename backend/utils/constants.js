/**
 * ============================================
 * CONSTANTS ÉTENDUES - Constantes de l'application
 * ============================================
 * 
 * Centralisation de toutes les constantes incluant les nouveaux statuts
 * 
 * @module utils/constants
 * @version 3.0.0
 */

/**
 * Rôles utilisateurs
 */
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

/**
 * Statuts des profils utilisateurs
 */
const USER_STATUS = {
  PENDING: 'pending',     // En attente de validation
  APPROVED: 'approved',   // Approuvé par un admin
  REJECTED: 'rejected'    // Rejeté par un admin
};

/**
 * Types de messages
 */
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image'
};

/**
 * États des images
 */
const IMAGE_STATUS = {
  ACTIVE: 'active',
  VIEWED: 'viewed',
  EXPIRED: 'expired'
};

/**
 * Codes de statut HTTP
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Messages du serveur
 */
const SERVER_MESSAGES = {
  // Authentification
  AUTH: {
    LOGIN_SUCCESS: 'Connexion réussie',
    LOGIN_FAILED: 'Email ou mot de passe incorrect',
    REGISTER_SUCCESS: 'Inscription réussie, votre profil est en attente de validation',
    EMAIL_EXISTS: 'Cet email est déjà utilisé',
    PSEUDO_EXISTS: 'Ce pseudo est déjà utilisé',
    TOKEN_INVALID: 'Token invalide ou expiré',
    TOKEN_MISSING: 'Token d\'authentification manquant',
    UNAUTHORIZED: 'Non autorisé',
    ACCOUNT_PENDING: 'Votre compte est en attente de validation par un administrateur',
    ACCOUNT_REJECTED: 'Votre compte a été rejeté',
    PROFILE_NOT_APPROVED: 'Votre profil n\'a pas encore été approuvé'
  },
  
  // Utilisateurs
  USER: {
    NOT_FOUND: 'Utilisateur non trouvé',
    UPDATED: 'Profil mis à jour',
    DELETED: 'Utilisateur supprimé',
    ACCESS_DENIED: 'Accès refusé',
    PROFILE_APPROVED: 'Profil approuvé avec succès',
    PROFILE_REJECTED: 'Profil rejeté',
    AGE_RESTRICTION: 'Vous devez avoir au moins 13 ans pour vous inscrire',
    INVALID_PSEUDO: 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -'
  },
  
  // Messages
  MESSAGE: {
    SENT: 'Message envoyé',
    NOT_FOUND: 'Message non trouvé',
    DELETED: 'Message supprimé',
    MARKED_READ: 'Message marqué comme lu'
  },
  
  // Images
  IMAGE: {
    SENT: 'Image envoyée',
    NO_FILE: 'Aucune image fournie',
    INVALID_TYPE: 'Type de fichier invalide',
    TOO_LARGE: 'Fichier trop volumineux',
    VIEWED: 'Image marquée comme vue',
    EXPIRED: 'Image expirée',
    NOT_IMAGE: 'Ce message n\'est pas une image'
  },
  
  // Photos de profil
  PROFILE_PHOTO: {
    UPLOADED: 'Photo de profil téléchargée',
    REMOVED: 'Photo de profil supprimée',
    INVALID_TYPE: 'Type de fichier invalide pour la photo de profil',
    TOO_LARGE: 'Photo de profil trop volumineuse (max 5 MB)'
  },
  
  // Admin
  ADMIN: {
    PENDING_COUNT: 'profils en attente de validation',
    NO_PENDING: 'Aucun profil en attente',
    VALIDATION_REQUIRED: 'Une raison est requise pour le rejet'
  },
  
  // Erreurs générales
  ERROR: {
    SERVER: 'Erreur serveur',
    VALIDATION: 'Erreur de validation',
    NOT_FOUND: 'Ressource non trouvée',
    DATABASE: 'Erreur de base de données'
  }
};

/**
 * Configuration de pagination
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

/**
 * Configuration des images de messages
 */
const IMAGE_CONFIG = {
  MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,
  QUALITY: 80,
  EXPIRATION_TIME: parseInt(process.env.IMAGE_EXPIRATION_TIME) || 5 // minutes
};

/**
 * Configuration des photos de profil
 */
const PROFILE_PHOTO_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  MAX_WIDTH: 400,
  MAX_HEIGHT: 400,
  QUALITY: 85
};

/**
 * Configuration de la bio
 */
const BIO_CONFIG = {
  MIN_LENGTH: 0,
  MAX_LENGTH: 500
};

/**
 * Configuration du pseudo
 */
const PSEUDO_CONFIG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  PATTERN: /^[a-zA-Z0-9_-]+$/,
  RESERVED: ['admin', 'root', 'moderator', 'system', 'support']
};

/**
 * Âge minimum requis
 */
const AGE_CONFIG = {
  MINIMUM: 13 // COPPA compliance
};

/**
 * Configuration du nettoyage automatique
 */
const CLEANUP_CONFIG = {
  INTERVAL: parseInt(process.env.CLEANUP_INTERVAL) || 1 // minutes
};

/**
 * Événements Socket.io
 */
const SOCKET_EVENTS = {
  // Connexion
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Utilisateurs
  USER_CONNECT: 'user:connect',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  
  // Conversations
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  
  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELETE: 'message:delete',
  
  // Images
  IMAGE_VIEWED: 'image:viewed',
  IMAGE_EXPIRED: 'image:expired',
  
  // Indicateurs
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  
  // Notifications
  NOTIFICATION: 'notification:new_message',
  
  // Admin
  PROFILE_VALIDATED: 'profile:validated',
  PROFILE_REJECTED: 'profile:rejected'
};

/**
 * Raisons de rejet prédéfinies
 */
const REJECTION_REASONS = {
  INAPPROPRIATE_PHOTO: 'Photo de profil inappropriée',
  INAPPROPRIATE_BIO: 'Description inappropriée',
  FAKE_PROFILE: 'Profil suspect ou faux',
  UNDERAGE: 'Âge insuffisant',
  SPAM: 'Contenu spam ou publicitaire',
  DUPLICATE: 'Compte en double',
  OFFENSIVE_PSEUDO: 'Pseudo offensant ou inapproprié',
  OTHER: 'Autre raison (voir détails)'
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  MESSAGE_TYPES,
  IMAGE_STATUS,
  HTTP_STATUS,
  SERVER_MESSAGES,
  PAGINATION,
  IMAGE_CONFIG,
  PROFILE_PHOTO_CONFIG,
  BIO_CONFIG,
  PSEUDO_CONFIG,
  AGE_CONFIG,
  CLEANUP_CONFIG,
  SOCKET_EVENTS,
  REJECTION_REASONS
};