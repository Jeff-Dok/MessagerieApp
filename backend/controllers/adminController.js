/**
 * ============================================
 * ADMIN CONTROLLER - Gestion administrative
 * ============================================
 * 
 * Contrôleur pour la validation des profils et gestion admin
 * 
 * @module controllers/adminController
 */

const { User } = require('../models');
const { HTTP_STATUS, SERVER_MESSAGES, USER_STATUS } = require('../utils/constants');
const { SocketService } = require('../services/socketService');
const logger = require('../utils/logger');

/**
 * Contrôleur administrateur
 */
class AdminController {
  /**
   * Récupère tous les profils en attente de validation
   * @route GET /api/admin/pending-profiles
   */
  static async getPendingProfiles(req, res, next) {
    try {
      const profiles = await User.findPendingProfiles();

      res.json({
        success: true,
        count: profiles.length,
        profiles: profiles.map(p => p.toAdminJSON())
      });

    } catch (error) {
      logger.error('Erreur récupération profils en attente:', error);
      next(error);
    }
  }

  /**
   * Récupère le nombre de profils en attente
   * @route GET /api/admin/pending-count
   */
  static async getPendingCount(req, res, next) {
    try {
      const count = await User.countPending();

      res.json({
        success: true,
        count
      });

    } catch (error) {
      logger.error('Erreur comptage profils en attente:', error);
      next(error);
    }
  }

  /**
   * Récupère les détails d'un profil en attente
   * @route GET /api/admin/profile/:id
   */
  static async getProfileDetails(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      res.json({
        success: true,
        profile: user.toAdminJSON()
      });

    } catch (error) {
      logger.error('Erreur récupération détails profil:', error);
      next(error);
    }
  }

  /**
   * Approuve un profil utilisateur
   * @route POST /api/admin/approve/:id
   */
  static async approveProfile(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.userId;

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      // Vérifier que le profil est en attente
      if (user.statut !== USER_STATUS.PENDING) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Ce profil n\'est pas en attente de validation'
        });
      }

      // Approuver le profil
      await user.approve(adminId);

      logger.success(`Profil approuvé: ${user.pseudo} (ID: ${user.id}) par admin ${adminId}`);

      // Notifier via Socket.io si l'utilisateur est connecté
      if (global.io) {
        SocketService.emitToUser(user.id, 'profile:validated', {
          userId: user.id,
          statut: USER_STATUS.APPROVED,
          message: 'Votre profil a été approuvé !'
        });
      }

      res.json({
        success: true,
        message: SERVER_MESSAGES.USER.PROFILE_APPROVED,
        profile: user.toAdminJSON()
      });

    } catch (error) {
      logger.error('Erreur approbation profil:', error);
      next(error);
    }
  }

  /**
   * Rejette un profil utilisateur
   * @route POST /api/admin/reject/:id
   */
  static async rejectProfile(req, res, next) {
    try {
      const { id } = req.params;
      const { raison } = req.body;
      const adminId = req.user.userId;

      // Vérifier qu'une raison est fournie
      if (!raison || raison.trim().length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: SERVER_MESSAGES.ADMIN.VALIDATION_REQUIRED
        });
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      // Vérifier que le profil est en attente
      if (user.statut !== USER_STATUS.PENDING) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Ce profil n\'est pas en attente de validation'
        });
      }

      // Rejeter le profil
      await user.reject(adminId, raison);

      logger.warn(`Profil rejeté: ${user.pseudo} (ID: ${user.id}) par admin ${adminId}. Raison: ${raison}`);

      // Notifier via Socket.io si l'utilisateur est connecté
      if (global.io) {
        SocketService.emitToUser(user.id, 'profile:rejected', {
          userId: user.id,
          statut: USER_STATUS.REJECTED,
          raison: raison,
          message: 'Votre profil a été rejeté'
        });
      }

      res.json({
        success: true,
        message: SERVER_MESSAGES.USER.PROFILE_REJECTED,
        profile: user.toAdminJSON()
      });

    } catch (error) {
      logger.error('Erreur rejet profil:', error);
      next(error);
    }
  }

  /**
   * Approuve plusieurs profils en masse
   * @route POST /api/admin/approve-bulk
   */
  static async approveBulk(req, res, next) {
    try {
      const { userIds } = req.body;
      const adminId = req.user.userId;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Liste d\'IDs invalide'
        });
      }

      const results = {
        approved: [],
        failed: []
      };

      for (const userId of userIds) {
        try {
          const user = await User.findByPk(userId);
          
          if (user && user.statut === USER_STATUS.PENDING) {
            await user.approve(adminId);
            results.approved.push(userId);

            // Notifier
            if (global.io) {
              SocketService.emitToUser(user.id, 'profile:validated', {
                userId: user.id,
                statut: USER_STATUS.APPROVED
              });
            }
          } else {
            results.failed.push(userId);
          }
        } catch (error) {
          logger.error(`Erreur approbation profil ${userId}:`, error);
          results.failed.push(userId);
        }
      }

      logger.success(`Approbation en masse: ${results.approved.length} profils approuvés par admin ${adminId}`);

      res.json({
        success: true,
        approved: results.approved.length,
        failed: results.failed.length,
        results
      });

    } catch (error) {
      logger.error('Erreur approbation en masse:', error);
      next(error);
    }
  }

  /**
   * Récupère les statistiques administrateur
   * @route GET /api/admin/stats
   */
  static async getAdminStats(req, res, next) {
    try {
      const { Op } = require('sequelize');

      const [
        totalUsers,
        pendingCount,
        approvedCount,
        rejectedCount,
        recentApprovals
      ] = await Promise.all([
        User.count(),
        User.count({ where: { statut: USER_STATUS.PENDING } }),
        User.count({ where: { statut: USER_STATUS.APPROVED } }),
        User.count({ where: { statut: USER_STATUS.REJECTED } }),
        User.count({
          where: {
            statut: USER_STATUS.APPROVED,
            dateValidation: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
            }
          }
        })
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          recentApprovals
        }
      });

    } catch (error) {
      logger.error('Erreur récupération stats admin:', error);
      next(error);
    }
  }

  /**
   * Recherche des utilisateurs par critères
   * @route GET /api/admin/search
   */
  static async searchUsers(req, res, next) {
    try {
      const { query, statut, ville, page = 1, limit = 20 } = req.query;
      const { Op } = require('sequelize');

      const where = {};

      // Filtre par statut
      if (statut) {
        where.statut = statut;
      }

      // Filtre par ville
      if (ville) {
        where.ville = { [Op.iLike]: `%${ville}%` };
      }

      // Recherche textuelle
      if (query) {
        where[Op.or] = [
          { pseudo: { [Op.iLike]: `%${query}%` } },
          { nom: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['dateCreation', 'DESC']]
      });

      res.json({
        success: true,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        users: users.map(u => u.toAdminJSON())
      });

    } catch (error) {
      logger.error('Erreur recherche utilisateurs:', error);
      next(error);
    }
  }
}

module.exports = AdminController;