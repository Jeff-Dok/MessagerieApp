/**
 * ============================================
 * USER CONTROLLER - Contrôleur utilisateurs
 * ============================================
 *
 * Gère les opérations CRUD sur les utilisateurs
 *
 * @module controllers/userController
 */

const { User } = require("../models");
const { HTTP_STATUS, SERVER_MESSAGES } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Contrôleur utilisateurs
 */
class UserController {
  /**
   * Récupère tous les utilisateurs
   * @route GET /api/users
   */
  static async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;

      // Construction de la requête
      const options = {
        attributes: { exclude: ["password"] },
        order: [["dateCreation", "DESC"]],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      };

      // Filtre de recherche optionnel
      if (search) {
        const { Op } = require("sequelize");
        options.where = {
          [Op.or]: [
            { nom: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: users } = await User.findAndCountAll(options);

      res.json({
        success: true,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        users,
      });
    } catch (error) {
      logger.error("Erreur lors de la récupération des utilisateurs:", error);
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par ID
   * @route GET /api/users/:id
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND,
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      logger.error("Erreur lors de la récupération de l'utilisateur:", error);
      next(error);
    }
  }

  /**
   * Met à jour un utilisateur
   * @route PUT /api/users/:id
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { nom, email } = req.body;

      // Vérifier les permissions
      if (req.user.userId !== parseInt(id) && req.user.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED,
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND,
        });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: SERVER_MESSAGES.AUTH.EMAIL_EXISTS,
          });
        }
      }

      // Mettre à jour
      await user.update({ nom, email });

      logger.info(`Utilisateur ${id} mis à jour`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.USER.UPDATED,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      logger.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      next(error);
    }
  }

  /**
   * Supprime un utilisateur (admin uniquement)
   * @route DELETE /api/users/:id
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier les permissions admin
      if (req.user.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED,
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND,
        });
      }

      // Empêcher la suppression de son propre compte
      if (user.id === req.user.userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Vous ne pouvez pas supprimer votre propre compte",
        });
      }

      await user.destroy();

      logger.warn(`Utilisateur ${id} supprimé par admin ${req.user.userId}`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.USER.DELETED,
      });
    } catch (error) {
      logger.error("Erreur lors de la suppression de l'utilisateur:", error);
      next(error);
    }
  }

  /**
   * Récupère les statistiques d'un utilisateur
   * @route GET /api/users/:id/stats
   */
  static async getUserStats(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier les permissions
      if (req.user.userId !== parseInt(id) && req.user.role !== "admin") {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED,
        });
      }

      const { Message } = require("../models");

      const [messagesSent, messagesReceived, unreadCount] = await Promise.all([
        Message.count({ where: { senderId: id } }),
        Message.count({ where: { receiverId: id } }),
        Message.countUnreadForUser(id),
      ]);

      res.json({
        success: true,
        stats: {
          messagesSent,
          messagesReceived,
          unreadCount,
          totalMessages: messagesSent + messagesReceived,
        },
      });
    } catch (error) {
      logger.error("Erreur lors de la récupération des statistiques:", error);
      next(error);
    }
  }
}

module.exports = UserController;
