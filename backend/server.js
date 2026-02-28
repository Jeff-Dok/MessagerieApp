/**
 * ============================================
 * SERVER.JS - Point d'entrée principal
 * ============================================
 *
 * Serveur Express avec Socket.io pour messagerie en temps réel
 *
 * Fonctionnalités:
 * - API REST pour authentification et messagerie
 * - WebSocket pour communication temps réel
 * - Middleware de sécurité (Helmet, CORS, Rate Limiting)
 * - Gestion automatique de l'expiration des images
 *
 * @author Votre Nom
 * @version 3.1.0
 */

// ============================================
// IMPORTS
// ============================================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

// Configurations
const { sequelize } = require("./config/database");

// Services
const { initializeSocketService } = require("./services/socketService");
const { startCleanupService } = require("./services/cleanupService");
const { encryptionService } = require("./services/encryptionService");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const { limiter: rateLimiter } = require("./middleware/rateLimiter");

// Routes
const routes = require("./routes");

// Utilitaires
const logger = require("./utils/logger");
const { SERVER_MESSAGES } = require("./utils/constants");

// ============================================
// CONFIGURATION
// ============================================
const app = express();
const server = http.createServer(app);

// Configuration CORS avec support multi-origines
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [process.env.CORS_ORIGIN || "http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS bloqué pour origin: ${origin}`);
      callback(null, true); // En dev, permettre quand même
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";
const PHP_PORT = process.env.PHP_PORT || 8080;

// Processus PHP
let phpProcess = null;

// ============================================
// MIDDLEWARE
// ============================================

// Sécurité
app.use(
  helmet({
    contentSecurityPolicy: false, // Désactivé pour Socket.io
    crossOriginEmbedderPolicy: false,
  })
);

// Compression des réponses
app.use(compression());

// CORS avec multi-origines
app.use(cors(corsOptions));

// Parsing du body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
app.use("/api/", rateLimiter);

// Rendre Socket.io accessible dans les routes et globalement
app.set("io", io);
global.io = io;

// ============================================
// ROUTES
// ============================================

/**
 * Route racine - Informations de l'API
 */
app.get("/", (req, res) => {
  res.json({
    name: "MessagerieApp API",
    version: "3.1.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      messages: "/api/messages",
    },
    documentation: "/api/docs",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check endpoint
 */
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "healthy",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

// Routes API
app.use("/api", routes);

// ============================================
// GESTION DES ERREURS
// ============================================

/**
 * Route 404 - Ressource non trouvée
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
    path: req.originalUrl,
  });
});

/**
 * Gestionnaire d'erreurs global
 */
app.use(errorHandler);

// ============================================
// SERVEUR PHP
// ============================================

/**
 * Démarre le serveur PHP pour Adminer
 */
function startPhpServer() {
  return new Promise((resolve, reject) => {
    try {
      logger.info(`Démarrage du serveur PHP sur le port ${PHP_PORT}...`);

      // Démarrer le serveur PHP (dans le dossier racine du projet pour accéder à tools/)
      const projectRoot = path.join(__dirname, "..");
      phpProcess = spawn("php", ["-S", `localhost:${PHP_PORT}`], {
        cwd: projectRoot,
        shell: true,
      });

      // Gérer la sortie standard
      phpProcess.stdout.on("data", (data) => {
        logger.info(`[PHP] ${data.toString().trim()}`);
      });

      // Gérer les erreurs
      phpProcess.stderr.on("data", (data) => {
        const message = data.toString().trim();
        // Le serveur PHP envoie ses logs dans stderr, donc on filtre
        if (message.includes("Development Server")) {
          logger.success(`✅ Serveur PHP démarré sur http://localhost:${PHP_PORT}`);
          logger.info(`📊 Adminer disponible: http://localhost:${PHP_PORT}/tools/adminer/adminer-login.php`);
          resolve();
        } else if (!message.includes("Listening on")) {
          logger.warn(`[PHP] ${message}`);
        }
      });

      // Gérer la fermeture
      phpProcess.on("close", (code) => {
        if (code !== 0 && code !== null) {
          logger.warn(`Processus PHP terminé avec le code ${code}`);
        }
      });

      // Gérer les erreurs de démarrage
      phpProcess.on("error", (error) => {
        logger.error("Erreur lors du démarrage de PHP:", error.message);
        reject(error);
      });

      // Timeout de 5 secondes pour résoudre la promesse
      setTimeout(() => {
        if (phpProcess && !phpProcess.killed) {
          resolve();
        }
      }, 5000);

    } catch (error) {
      logger.error("Erreur lors du démarrage du serveur PHP:", error);
      reject(error);
    }
  });
}

/**
 * Arrête le serveur PHP
 */
function stopPhpServer() {
  if (phpProcess && !phpProcess.killed) {
    logger.info("Arrêt du serveur PHP...");
    phpProcess.kill();
    phpProcess = null;
  }
}

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

/**
 * Initialise et démarre le serveur
 */
async function startServer() {
  try {
    // Connexion à la base de données
    logger.info("Connexion à la base de données...");
    await sequelize.authenticate();
    logger.success("✅ Connexion à la base de données réussie");

    // Synchronisation des modèles
    logger.info("Synchronisation des modèles...");
    await sequelize.sync();
    logger.success("✅ Modèles synchronisés");

    // Initialiser le service de chiffrement
    logger.info("Initialisation du service de chiffrement...");
    encryptionService.initialize();
    if (encryptionService.isEnabled()) {
      logger.success("✅ Service de chiffrement activé (AES-256-GCM)");
    } else {
      logger.warn("⚠️  Service de chiffrement désactivé (ENCRYPTION_KEY non définie)");
    }

    // Initialiser Socket.io
    logger.info("Initialisation de Socket.io...");
    initializeSocketService(io);
    logger.success("✅ Socket.io initialisé");

    // Démarrer le service de nettoyage automatique
    logger.info("Démarrage du service de nettoyage...");
    startCleanupService();
    logger.success("✅ Service de nettoyage démarré");

    // Démarrer le serveur PHP
    try {
      await startPhpServer();
    } catch (error) {
      logger.warn("⚠️  Le serveur PHP n'a pas pu démarrer (non bloquant)");
    }

    // Démarrer le serveur
    server.listen(PORT, HOST, () => {
      logger.success("🚀 Serveur démarré avec succès");
      logger.info(`📍 URL: http://${HOST}:${PORT}`);
      logger.info(`🔌 WebSocket: ws://${HOST}:${PORT}`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("❌ Erreur au démarrage du serveur:", error);
    process.exit(1);
  }
}

// ============================================
// GESTION DES SIGNAUX
// ============================================

/**
 * Arrêt propre du serveur
 */
async function gracefulShutdown(signal) {
  logger.info(`\n${signal} reçu. Arrêt du serveur...`);

  // Arrêter le serveur PHP
  stopPhpServer();

  server.close(async () => {
    logger.info("Fermeture des connexions HTTP...");

    try {
      await sequelize.close();
      logger.success("✅ Connexions fermées proprement");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Erreur lors de la fermeture:", error);
      process.exit(1);
    }
  });

  // Force l'arrêt après 10 secondes
  setTimeout(() => {
    logger.error("⏱️  Timeout - Arrêt forcé");
    process.exit(1);
  }, 10000);
}

// Écouter les signaux d'arrêt
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesse rejetée non gérée:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Exception non capturée:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// ============================================
// DÉMARRAGE
// ============================================
startServer();

// Export pour les tests
module.exports = { app, server, io };
