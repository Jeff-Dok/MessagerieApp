/**
 * ============================================
 * AUTH ROUTES - Routes d'authentification
 * ============================================
 * 
 * @module routes/auth
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validateRegistration,
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateLogin,
  AuthController.login
);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérification du token JWT
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  AuthController.verifyToken
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchissement du token JWT
 * @access  Private
 */
router.post(
  '/refresh',
  authenticate,
  AuthController.refreshToken
);

module.exports = router;