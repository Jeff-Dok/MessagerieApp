/**
 * ============================================
 * AUTH CONTROLLER - Contrôleur d'authentification
 * ============================================
 * 
 * Gère l'inscription, la connexion et la vérification des tokens
 * 
 * @module controllers/authController
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');
const { HTTP_STATUS, SERVER_MESSAGES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Contrôleur d'authentification
 */
class AuthController {
  /**
   * Inscription d'un nouveau utilisateur
   * @route POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { nom, email, password } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.EMAIL_EXISTS
        });
      }

      // Créer l'utilisateur
      const user = await User.create({
        nom,
        email,
        password,
        role: 'user'
      });

      // Générer le token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      logger.success(`Nouvel utilisateur enregistré: ${email}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SERVER_MESSAGES.AUTH.REGISTER_SUCCESS,
        token,
        user: user.toPublicJSON()
      });

    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error);
      next(error);
    }
  }

  /**
   * Connexion d'un utilisateur
   * @route POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Trouver l'utilisateur par email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.LOGIN_FAILED
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.LOGIN_FAILED
        });
      }

      // Générer le token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      logger.info(`Utilisateur connecté: ${email}`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.AUTH.LOGIN_SUCCESS,
        token,
        user: user.toPublicJSON()
      });

    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      next(error);
    }
  }

  /**
   * Vérification du token JWT
   * @route GET /api/auth/verify
   */
  static async verifyToken(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      res.json({
        success: true,
        user: user.toPublicJSON()
      });

    } catch (error) {
      logger.error('Erreur lors de la vérification du token:', error);
      next(error);
    }
  }

  /**
   * Rafraîchissement du token JWT (optionnel)
   * @route POST /api/auth/refresh
   */
  static async refreshToken(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      // Générer un nouveau token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      res.json({
        success: true,
        token,
        user: user.toPublicJSON()
      });

    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token:', error);
      next(error);
    }
  }
}

module.exports = AuthController;