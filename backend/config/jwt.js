/**
 * ============================================
 * JWT CONFIG - Configuration JSON Web Token
 * ============================================
 *
 * Configuration pour l'authentification JWT
 *
 * @module config/jwt
 * @version 3.0.0
 */

require("dotenv").config();

/**
 * Configuration JWT
 */
const jwtConfig = {
  /**
   * Clé secrète pour signer les tokens
   * IMPORTANT: Doit être changée en production et gardée secrète
   */
  secret:
    process.env.JWT_SECRET ||
    "dev-secret-key-CHANGE-ME-IN-PRODUCTION-1234567890",

  /**
   * Durée de validité du token principal
   * Format: '24h', '7d', '30m', etc.
   */
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",

  /**
   * Durée de validité du refresh token
   * Format: '7d', '30d', etc.
   */
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  /**
   * Algorithme de signature
   * Recommandé: HS256 (HMAC avec SHA-256)
   */
  algorithm: "HS256",

  /**
   * Issuer (émetteur) du token
   */
  issuer: process.env.JWT_ISSUER || "MessagerieApp",

  /**
   * Audience (destinataire) du token
   */
  audience: process.env.JWT_AUDIENCE || "MessagerieApp-Users",

  /**
   * Options de signature
   */
  signOptions: {
    algorithm: "HS256",
    issuer: process.env.JWT_ISSUER || "MessagerieApp",
    audience: process.env.JWT_AUDIENCE || "MessagerieApp-Users",
  },

  /**
   * Options de vérification
   */
  verifyOptions: {
    algorithms: ["HS256"],
    issuer: process.env.JWT_ISSUER || "MessagerieApp",
    audience: process.env.JWT_AUDIENCE || "MessagerieApp-Users",
  },
};

/**
 * Validation de la configuration
 */
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("CHANGE-ME")) {
    console.error(
      "⚠️  ERREUR CRITIQUE: JWT_SECRET non défini ou utilise la valeur par défaut!",
    );
    console.error(
      "   Définissez JWT_SECRET dans votre fichier .env pour la production",
    );
    process.exit(1);
  }

  if (jwtConfig.secret.length < 32) {
    console.warn(
      "⚠️  AVERTISSEMENT: JWT_SECRET devrait faire au moins 32 caractères",
    );
  }
}

/**
 * Génère une clé secrète sécurisée (pour aide)
 * Utiliser: node -e "console.log(require('./config/jwt').generateSecret())"
 */
jwtConfig.generateSecret = () => {
  const crypto = require("crypto");
  return crypto.randomBytes(64).toString("hex");
};

module.exports = jwtConfig;
