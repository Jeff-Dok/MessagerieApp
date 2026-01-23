/**
 * ============================================
 * CONFIG - Configuration de l'application
 * ============================================
 *
 * Configuration centralisée pour le frontend
 *
 * @module config
 * @version 3.1.0
 */

// Détection de l'environnement
const ENV = {
  isDevelopment:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1",
  isProduction: window.location.protocol === "https:",
};

// Configuration de l'application
const CONFIG = {
  APP_NAME: "MessagerieApp",
  VERSION: "3.1.0",

  // URLs dynamiques basées sur l'environnement
  API_BASE_URL: ENV.isDevelopment
    ? "http://localhost:5000/api"
    : `${window.location.origin}/api`,

  SOCKET_URL: ENV.isDevelopment
    ? "http://localhost:5000"
    : window.location.origin,

  // Clés de stockage local
  STORAGE_KEYS: {
    USERS: "messagerie_users",
    MESSAGES: "messagerie_messages",
    CURRENT_USER: "messagerie_current_user",
    AUTH_TOKEN: "authToken",
  },

  // Rôles utilisateurs
  USER_ROLES: {
    ADMIN: "admin",
    USER: "user",
  },

  // Configuration des images
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_WIDTH: 800,
    MAX_HEIGHT: 800,
    QUALITY: 0.8,
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    EXPIRATION_TIME: 5 * 60 * 1000, // 5 minutes en ms
  },

  // Configuration des timeouts
  TIMEOUT: {
    API: 30000, // 30 secondes
    SOCKET: 20000, // 20 secondes
  },
};

// Export global
if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
  window.ENV = ENV;
}

// Export pour modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, ENV };
}
