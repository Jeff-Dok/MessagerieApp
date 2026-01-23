/**
 * ============================================
 * DATABASE CONFIG - Configuration PostgreSQL
 * ============================================
 *
 * Configuration de la connexion à la base de données
 * avec Sequelize ORM
 *
 * @module config/database
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();
const logger = require("../utils/logger");

/**
 * Configuration de la connexion Sequelize
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || "messagerie_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: "postgres",

    // Logging
    logging:
      process.env.NODE_ENV === "development"
        ? (msg) => logger.debug(msg)
        : false,

    // Pool de connexions
    pool: {
      max: 5, // Maximum de connexions
      min: 0, // Minimum de connexions
      acquire: 30000, // Timeout pour acquérir une connexion
      idle: 10000, // Temps avant qu'une connexion inactive soit fermée
    },

    // Dialecte PostgreSQL
    dialectOptions: {
      // SSL en production (configurable via DB_SSL)
      ...(process.env.DB_SSL === "true" && {
        ssl: {
          require: true,
          // SÉCURITÉ: rejectUnauthorized devrait être true en production
          // Mettre DB_SSL_REJECT_UNAUTHORIZED=false uniquement pour les certificats auto-signés
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      }),

      // Timezone - Utiliser le timezone local de l'OS
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },

    // Forcer le timezone local globalement
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Options de requête par défaut
    define: {
      // Utiliser camelCase pour les noms de colonnes
      underscored: false,

      // Ajouter automatiquement createdAt et updatedAt
      timestamps: true,

      // Ne pas supprimer physiquement (soft delete)
      paranoid: false,

      // Éviter le pluriel automatique des noms de tables
      freezeTableName: true,
    },

    // Benchmark des requêtes en développement
    benchmark: process.env.NODE_ENV === "development",

    // Retry automatique en cas d'erreur
    retry: {
      max: 3,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
      ]
    }
  },
);

/**
 * Test de la connexion à la base de données
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.success("✅ Connexion à PostgreSQL établie avec succès");

    // Afficher les détails de la connexion en développement
    if (process.env.NODE_ENV === "development") {
      const dbConfig = sequelize.config;
      logger.info(`📊 Base de données: ${dbConfig.database}`);
      logger.info(`🖥️  Hôte: ${dbConfig.host}:${dbConfig.port}`);
      logger.info(`👤 Utilisateur: ${dbConfig.username}`);
    }

    return true;
  } catch (error) {
    logger.error("❌ Impossible de se connecter à PostgreSQL:", error.message);

    // Afficher des conseils de débogage
    logger.warn("Vérifiez:");
    logger.warn("  1. PostgreSQL est démarré");
    logger.warn("  2. Les variables d'environnement (.env)");
    logger.warn("  3. L'utilisateur et le mot de passe");
    logger.warn("  4. Le nom de la base de données existe");

    return false;
  }
}

/**
 * Synchronise les modèles avec la base de données
 */
async function syncDatabase(options = {}) {
  try {
    const syncOptions = {
      // En développement: altère les tables existantes
      alter: process.env.NODE_ENV === "development",

      // En production: ne force jamais (ne supprime pas les données)
      force: false,

      ...options,
    };

    await sequelize.sync(syncOptions);

    if (syncOptions.alter) {
      logger.success("✅ Modèles synchronisés (ALTER)");
    } else {
      logger.success("✅ Modèles synchronisés");
    }

    return true;
  } catch (error) {
    logger.error("❌ Erreur lors de la synchronisation:", error.message);
    return false;
  }
}

/**
 * Ferme proprement la connexion
 */
async function closeConnection() {
  try {
    await sequelize.close();
    logger.info("Connexion à PostgreSQL fermée");
    return true;
  } catch (error) {
    logger.error("Erreur lors de la fermeture de la connexion:", error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};
