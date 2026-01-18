/**
 * ============================================
 * MESSAGE CONTROLLER - Contrôleur messages
 * ============================================
 * 
 * Gère l'envoi, la réception et la gestion des messages
 * 
 * @module controllers/messageController
 */

const { Message, User } = require('../models');
const { HTTP_STATUS, SERVER_MESSAGES, SOCKET_EVENTS } = require('../utils/constants');
const ImageService = require('../services/imageService');
const { SocketService } = require('../services/socketService');
const logger = require('../utils/logger');

/**
 * Contrôleur messages
 */
class MessageController {
  /**
   * Envoie un message texte
   * @route POST /api/messages
   */
  static async sendMessage(req, res, next) {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user.userId;

      // Vérifier que le destinataire existe
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      // Créer le message
      const message = await Message.create({
        senderId,
        receiverId,
        content,
        messageType: 'text',
        read: false
      });

      // Récupérer avec les infos utilisateurs
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'nom', 'email'] },
          { model: User, as: 'receiver', attributes: ['id', 'nom', 'email'] }
        ]
      });

      // Émettre via Socket.io
      SocketService.emitToRoom(
        senderId,
        receiverId,
        SOCKET_EVENTS.MESSAGE_NEW,
        fullMessage
      );

      logger.info(`Message texte envoyé de ${senderId} à ${receiverId}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SERVER_MESSAGES.MESSAGE.SENT,
        data: fullMessage
      });

    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message:', error);
      next(error);
    }
  }

  /**
   * Envoie une image
   * @route POST /api/messages/image
   */
  static async sendImage(req, res, next) {
    try {
      const { receiverId } = req.body;
      const senderId = req.user.userId;

      // Vérifier qu'un fichier a été uploadé
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: SERVER_MESSAGES.IMAGE.NO_FILE
        });
      }

      // Valider l'image
      const validation = ImageService.validateImage(req.file);
      if (!validation.valid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: validation.error
        });
      }

      // Vérifier que le destinataire existe
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.USER.NOT_FOUND
        });
      }

      // Traiter et encoder l'image
      const imageDataUrl = await ImageService.processAndEncode(req.file.buffer, {
        addWatermark: true
      });

      // Créer le message
      const message = await Message.create({
        senderId,
        receiverId,
        content: '[Image]',
        messageType: 'image',
        imageData: imageDataUrl,
        imageMimeType: 'image/jpeg',
        imageFileName: req.file.originalname,
        read: false,
        imageExpired: false
      });

      // Récupérer avec les infos utilisateurs
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'nom', 'email'] },
          { model: User, as: 'receiver', attributes: ['id', 'nom', 'email'] }
        ]
      });

      // Émettre via Socket.io
      SocketService.emitToRoom(
        senderId,
        receiverId,
        SOCKET_EVENTS.MESSAGE_NEW,
        fullMessage
      );

      logger.success(`Image envoyée de ${senderId} à ${receiverId}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SERVER_MESSAGES.IMAGE.SENT,
        data: fullMessage
      });

    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'image:', error);
      next(error);
    }
  }

  /**
   * Marque une image comme vue (démarre l'expiration)
   * @route PUT /api/messages/:id/view
   */
  static async markImageAsViewed(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.MESSAGE.NOT_FOUND
        });
      }

      // Vérifier les permissions
      if (!message.canBeViewedBy(userId)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED
        });
      }

      // Vérifier que c'est une image
      if (message.messageType !== 'image') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: SERVER_MESSAGES.IMAGE.NOT_IMAGE
        });
      }

      // Marquer comme vue
      await message.markImageAsViewed();

      // Notifier via Socket.io
      SocketService.emitToRoom(
        message.senderId,
        message.receiverId,
        SOCKET_EVENTS.IMAGE_VIEWED,
        {
          messageId: message.id,
          viewedAt: message.imageViewedAt,
          expiresAt: message.imageExpiresAt
        }
      );

      logger.info(`Image ${id} vue par utilisateur ${userId}`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.IMAGE.VIEWED,
        viewedAt: message.imageViewedAt,
        expiresAt: message.imageExpiresAt
      });

    } catch (error) {
      logger.error('Erreur lors du marquage de l\'image comme vue:', error);
      next(error);
    }
  }

  /**
   * Fait expirer une image manuellement
   * @route POST /api/messages/:id/expire
   */
  static async expireImage(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.MESSAGE.NOT_FOUND
        });
      }

      // Vérifier les permissions
      if (!message.canBeViewedBy(userId)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED
        });
      }

      if (message.messageType !== 'image') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: SERVER_MESSAGES.IMAGE.NOT_IMAGE
        });
      }

      // Faire expirer
      await message.expireImage();

      // Notifier via Socket.io
      SocketService.emitToRoom(
        message.senderId,
        message.receiverId,
        SOCKET_EVENTS.IMAGE_EXPIRED,
        { messageId: message.id }
      );

      logger.info(`Image ${id} expirée manuellement par utilisateur ${userId}`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.IMAGE.EXPIRED
      });

    } catch (error) {
      logger.error('Erreur lors de l\'expiration de l\'image:', error);
      next(error);
    }
  }

  /**
   * Récupère une conversation
   * @route GET /api/messages/conversation/:userId
   */
  static async getConversation(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;

      const messages = await Message.findConversation(currentUserId, parseInt(userId));

      // Filtrer les images expirées
      const secureMessages = messages.map(msg => msg.toSecureJSON());

      res.json({
        success: true,
        count: secureMessages.length,
        messages: secureMessages
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération de la conversation:', error);
      next(error);
    }
  }

  /**
   * Récupère tous les messages de l'utilisateur
   * @route GET /api/messages
   */
  static async getAllMessages(req, res, next) {
    try {
      const userId = req.user.userId;
      const { Op } = require('sequelize');

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'nom', 'email'] },
          { model: User, as: 'receiver', attributes: ['id', 'nom', 'email'] }
        ],
        order: [['date', 'DESC']]
      });

      // Filtrer les images expirées
      const secureMessages = messages.map(msg => msg.toSecureJSON());

      res.json({
        success: true,
        count: secureMessages.length,
        messages: secureMessages
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération des messages:', error);
      next(error);
    }
  }

  /**
   * Marque un message comme lu
   * @route PUT /api/messages/:id/read
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.MESSAGE.NOT_FOUND
        });
      }

      // Vérifier que c'est le destinataire
      if (message.receiverId !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED
        });
      }

      await message.update({ read: true });

      res.json({
        success: true,
        message: SERVER_MESSAGES.MESSAGE.MARKED_READ
      });

    } catch (error) {
      logger.error('Erreur lors du marquage comme lu:', error);
      next(error);
    }
  }

  /**
   * Supprime un message
   * @route DELETE /api/messages/:id
   */
  static async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: SERVER_MESSAGES.MESSAGE.NOT_FOUND
        });
      }

      // Vérifier les permissions
      if (!message.canBeDeletedBy(userId, userRole)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: SERVER_MESSAGES.USER.ACCESS_DENIED
        });
      }

      await message.destroy();

      logger.info(`Message ${id} supprimé par utilisateur ${userId}`);

      res.json({
        success: true,
        message: SERVER_MESSAGES.MESSAGE.DELETED
      });

    } catch (error) {
      logger.error('Erreur lors de la suppression du message:', error);
      next(error);
    }
  }
}

module.exports = MessageController;