/**
 * ============================================
 * AUTH CONTROLLER ÉTENDU - Authentification avec profils
 * ============================================
 *
 * Gère l'inscription avec profil complet et validation
 *
 * @module controllers/authController
 * @version 3.0.0
 */

const jwt = require("jsonwebtoken");
const { User } = require("../models");
const jwtConfig = require("../config/jwt");
const {
  HTTP_STATUS,
  SERVER_MESSAGES,
  USER_STATUS,
} = require("../utils/constants");
const logger = require("../utils/logger");
const ProfilePhotoService = require("../services/profilePhotoService");

/**
 * Contrôleur d'authentification étendu
 */
class AuthController {
  /**
   * Inscription d'un nouveau utilisateur avec profil complet
   * @route POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { nom, pseudo, email, password, dateNaissance, ville, bio } =
        req.body;

      // Vérifier si l'email existe déjà
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.EMAIL_EXISTS,
        });
      }

      // Vérifier si le pseudo existe déjà
      const existingPseudo = await User.findByPseudo(pseudo);
      if (existingPseudo) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.PSEUDO_EXISTS,
        });
      }

      // Traiter la photo de profil si présente
      let photoProfil = null;
      let photoMimeType = null;

      if (req.file) {
        const photoResult = await ProfilePhotoService.processProfilePhoto(
          req.file.buffer,
        );
        photoProfil = photoResult.dataUrl;
        photoMimeType = "image/jpeg";
      }

      // Créer l'utilisateur avec statut "pending"
      const user = await User.create({
        nom,
        pseudo,
        email,
        password,
        dateNaissance,
        ville,
        bio: bio || "",
        photoProfil,
        photoMimeType,
        role: "user",
        statut: USER_STATUS.PENDING,
      });

      logger.success(`Nouvel utilisateur inscrit (en attente): ${email}`);

      // Ne pas générer de token car le profil doit être validé
      // L'utilisateur recevra un message l'informant de l'attente

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SERVER_MESSAGES.AUTH.REGISTER_SUCCESS,
        user: {
          id: user.id,
          pseudo: user.pseudo,
          email: user.email,
          statut: user.statut,
        },
        needsApproval: true,
      });
    } catch (error) {
      logger.error("Erreur lors de l'inscription:", error);
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
          message: SERVER_MESSAGES.AUTH.LOGIN_FAILED,
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.LOGIN_FAILED,
        });
      }

      // Vérifier le statut du profil
      if (user.statut === USER_STATUS.PENDING) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.ACCOUNT_PENDING,
          statut: USER_STATUS.PENDING,
        });
      }

      if (user.statut === USER_STATUS.REJECTED) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.ACCOUNT_REJECTED,
          statut: USER_STATUS.REJECTED,
          raison: user.raisonRejet,
        });
      }

      // Générer le token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          statut: user.statut,
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn },
      );

      logger.info(`Utilisateur connecté: ${email}`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.AUTH.LOGIN_SUCCESS,
        token,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      logger.error("Erreur lors de la connexion:", error);
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
          message: SERVER_MESSAGES.USER.NOT_FOUND,
        });
      }

      // Vérifier que le profil est toujours approuvé
      if (!user.isApproved()) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.PROFILE_NOT_APPROVED,
          statut: user.statut,
        });
      }

      res.json({
        success: true,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      logger.error("Erreur lors de la vérification du token:", error);
      next(error);
    }
  }

  /**
   * Rafraîchissement du token JWT
   * @route POST /api/auth/refresh
   */
  static async refreshToken(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId);

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND,
        });
      }

      // Vérifier que le profil est approuvé
      if (!user.isApproved()) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.AUTH.PROFILE_NOT_APPROVED,
        });
      }

      // Générer un nouveau token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          statut: user.statut,
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn },
      );

      res.json({
        success: true,
        token,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      logger.error("Erreur lors du rafraîchissement du token:", error);
      next(error);
    }
  }

  /**
   * Vérification du statut d'un profil
   * @route POST /api/auth/check-status
   */
  static async checkStatus(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND,
        });
      }

      res.json({
        success: true,
        statut: user.statut,
        pseudo: user.pseudo,
        email: user.email,
        dateValidation: user.dateValidation,
        raisonRejet:
          user.statut === USER_STATUS.REJECTED ? user.raisonRejet : null,
      });
    } catch (error) {
      logger.error("Erreur lors de la vérification du statut:", error);
      next(error);
    }
  }
}

module.exports = AuthController;
