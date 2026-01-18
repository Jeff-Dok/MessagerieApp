/**
 * ============================================
 * ROUTES INDEX - Export centralisé des routes
 * ============================================
 * 
 * Centralise toutes les routes de l'API
 * 
 * @module routes
 */

const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const messageRoutes = require('./messages');

/**
 * Routes d'authentification
 */
router.use('/auth', authRoutes);

/**
 * Routes utilisateurs
 */
router.use('/users', userRoutes);

/**
 * Routes messages
 */
router.use('/messages', messageRoutes);

module.exports = router;