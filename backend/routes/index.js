/**
 * ============================================
 * ROUTES INDEX - Export centralisé des routes
 * ============================================
 *
 * Centralise toutes les routes de l'API incluant les routes admin
 *
 * @module routes
 * @version 3.0.0
 */

const express = require("express");
const router = express.Router();

// Import des routes
const authRoutes = require("./auth");
const userRoutes = require("./users");
const messageRoutes = require("./messages");
const adminRoutes = require("./admin");

/**
 * Routes d'authentification
 * @prefix /api/auth
 */
router.use("/auth", authRoutes);

/**
 * Routes utilisateurs
 * @prefix /api/users
 */
router.use("/users", userRoutes);

/**
 * Routes messages
 * @prefix /api/messages
 */
router.use("/messages", messageRoutes);

/**
 * Routes administration
 * @prefix /api/admin
 */
router.use("/admin", adminRoutes);

module.exports = router;
