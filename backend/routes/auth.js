/**
 * ============================================
 * AUTH ROUTES - Routes d'authentification
 * ============================================
 * 
 * Routes pour inscription avec photo et vérification statut
 * 
 * @module routes/auth
 * @version 3.0.0
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { 
  validateRegistration, 
  validateLogin, 
  validateCheckStatus 
} = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../config/multer');
const ProfilePhotoService = require('../services/profilePhotoService');

/**
 * Middleware pour valider la photo de profil avant upload
 */
const validateProfilePhoto = (req, res, next) => {
  if (!req.file) {
    // Photo optionnelle, continuer sans photo
    return next();
  }

  const validation = ProfilePhotoService.validateProfilePhoto(req.file);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error
    });
  }

  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur avec profil complet
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  upload.single('photoProfil'),
  validateProfilePhoto,
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

/**
 * @route   POST /api/auth/check-status
 * @desc    Vérification du statut d'un profil
 * @access  Public
 */
router.post(
  '/check-status',
  authLimiter,
  validateCheckStatus,
  AuthController.checkStatus
);

module.exports = router;