/**
 * ============================================
 * MESSAGE ROUTES - Routes messages
 * ============================================
 * 
 * @module routes/messages
 */

const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../config/multer');

/**
 * @route   POST /api/messages
 * @desc    Envoie un message texte
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validateMessage,
  MessageController.sendMessage
);

/**
 * @route   POST /api/messages/image
 * @desc    Envoie une image
 * @access  Private
 */
router.post(
  '/image',
  authenticate,
  uploadLimiter,
  upload.single('image'),
  MessageController.sendImage
);

/**
 * @route   GET /api/messages
 * @desc    Récupère tous les messages de l'utilisateur
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  MessageController.getAllMessages
);

/**
 * @route   GET /api/messages/conversation/:userId
 * @desc    Récupère une conversation spécifique
 * @access  Private
 */
router.get(
  '/conversation/:userId',
  authenticate,
  MessageController.getConversation
);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Marque un message comme lu
 * @access  Private
 */
router.put(
  '/:id/read',
  authenticate,
  MessageController.markAsRead
);

/**
 * @route   PUT /api/messages/:id/view
 * @desc    Marque une image comme vue (démarre l'expiration)
 * @access  Private
 */
router.put(
  '/:id/view',
  authenticate,
  MessageController.markImageAsViewed
);

/**
 * @route   POST /api/messages/:id/expire
 * @desc    Fait expirer une image manuellement
 * @access  Private
 */
router.post(
  '/:id/expire',
  authenticate,
  MessageController.expireImage
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Supprime un message
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  MessageController.deleteMessage
);

module.exports = router;