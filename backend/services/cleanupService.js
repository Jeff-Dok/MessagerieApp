/**
 * ============================================
 * CLEANUP SERVICE - Nettoyage automatique
 * ============================================
 *
 * Service pour nettoyer automatiquement les images expirées
 *
 * Fonctionnalités:
 * - Détection des images expirées
 * - Suppression des données d'image
 * - Notification Socket.io
 * - Exécution planifiée
 *
 * @module services/cleanupService
 */

const { Message } = require("../models");
const { CLEANUP_CONFIG, SOCKET_EVENTS } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Service de nettoyage automatique
 */
class CleanupService {
  /**
   * Nettoie les images expirées (suppression complète)
   * @returns {Promise<number>} Nombre d'images supprimées
   */
  static async cleanupExpiredImages() {
    try {
      // Trouver toutes les images expirées
      const expiredMessages = await Message.findExpiredImages();

      if (expiredMessages.length === 0) {
        logger.debug("Aucune image à nettoyer");
        return 0;
      }

      // Supprimer chaque image expirée
      let deletedCount = 0;
      for (const message of expiredMessages) {
        const messageId = message.id;
        const senderId = message.senderId;
        const receiverId = message.receiverId;

        // Supprimer complètement le message de la base de données
        await message.destroy();
        deletedCount++;

        // Notifier via Socket.io si disponible
        if (global.io) {
          const { SocketService } = require("./socketService");
          SocketService.emitToRoom(
            senderId,
            receiverId,
            SOCKET_EVENTS.IMAGE_EXPIRED,
            { messageId, deleted: true },
          );
        }
      }

      logger.success(`🗑️  ${deletedCount} image(s) expirée(s) supprimée(s)`);
      return deletedCount;
    } catch (error) {
      logger.error("Erreur lors du nettoyage des images:", error);
      return 0;
    }
  }

  /**
   * Démarre le service de nettoyage automatique
   */
  static start() {
    logger.info("🕐 Démarrage du service de nettoyage automatique");

    // Exécuter immédiatement
    this.cleanupExpiredImages();

    // Puis exécuter à intervalle régulier
    const intervalMs = CLEANUP_CONFIG.INTERVAL * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.cleanupExpiredImages();
    }, intervalMs);

    logger.success(
      `✅ Service de nettoyage démarré (intervalle: ${CLEANUP_CONFIG.INTERVAL} min)`,
    );
  }

  /**
   * Arrête le service de nettoyage
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("Service de nettoyage arrêté");
    }
  }

  /**
   * Nettoie manuellement une image spécifique
   * @param {number} messageId - ID du message
   * @returns {Promise<boolean>} Succès du nettoyage
   */
  static async cleanupImage(messageId) {
    try {
      const message = await Message.findByPk(messageId);

      if (!message || message.messageType !== "image") {
        return false;
      }

      await message.expireImage();
      logger.info(`Image ${messageId} nettoyée manuellement`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors du nettoyage de l'image ${messageId}:`, error);
      return false;
    }
  }
}

/**
 * Fonction d'export pour démarrer le service
 */
function startCleanupService() {
  CleanupService.start();
}

module.exports = {
  CleanupService,
  startCleanupService,
};
