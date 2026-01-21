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
 * @version 2.0.0
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
require("dotenv").config();

// Configurations
const { sequelize } = require("./config/database");

// Services
const { initializeSocketService } = require("./services/socketService");
const { startCleanupService } = require("./services/cleanupService");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

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
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";

// ============================================
// MIDDLEWARE
// ============================================

// Sécurité
app.use(
  helmet({
    contentSecurityPolicy: false, // Désactivé pour Socket.io
    crossOriginEmbedderPolicy: false,
  }),
);

// Compression des réponses
app.use(compression());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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

// Rendre Socket.io accessible dans les routes
app.set("io", io);

// ============================================
// ROUTES
// ============================================

/**
 * Route racine - Informations de l'API
 */
app.get("/", (req, res) => {
  res.json({
    name: "MessagerieApp API",
    version: "2.0.0",
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
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    logger.success("✅ Modèles synchronisés");

    // Initialiser Socket.io
    logger.info("Initialisation de Socket.io...");
    initializeSocketService(io);
    logger.success("✅ Socket.io initialisé");

    // Démarrer le service de nettoyage automatique
    logger.info("Démarrage du service de nettoyage...");
    startCleanupService();
    logger.success("✅ Service de nettoyage démarré");

    // Démarrer le serveur
    server.listen(PORT, HOST, () => {
      logger.success(`🚀 Serveur démarré avec succès`);
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
