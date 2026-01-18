/**
 * ============================================
 * SOCKET SERVICE - Gestion de Socket.io
 * ============================================
 * 
 * Service centralisé pour gérer les connexions WebSocket
 * 
 * Fonctionnalités:
 * - Gestion des connexions/déconnexions
 * - Émission d'événements
 * - Gestion des rooms de conversation
 * - Suivi des utilisateurs en ligne
 * 
 * @module services/socketService
 */

const { SOCKET_EVENTS } = require('../utils/constants');
const { generateRoomId } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Map des utilisateurs connectés: userId -> socketId
 */
const connectedUsers = new Map();

/**
 * Service de gestion Socket.io
 */
class SocketService {
  /**
   * Initialise Socket.io avec tous les gestionnaires d'événements
   * @param {Object} io - Instance Socket.io
   */
  static initialize(io) {
    this.io = io;

    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
      logger.info(`Nouvelle connexion Socket.io: ${socket.id}`);

      // Gestionnaire: Connexion utilisateur
      socket.on(SOCKET_EVENTS.USER_CONNECT, (userId) => {
        this.handleUserConnect(socket, userId);
      });

      // Gestionnaire: Rejoindre une conversation
      socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, (data) => {
        this.handleConversationJoin(socket, data);
      });

      // Gestionnaire: Envoyer un message
      socket.on(SOCKET_EVENTS.MESSAGE_SEND, (message) => {
        this.handleMessageSend(socket, message);
      });

      // Gestionnaire: Indicateur de saisie (début)
      socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
        this.handleTypingStart(socket, data);
      });

      // Gestionnaire: Indicateur de saisie (fin)
      socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
        this.handleTypingStop(socket, data);
      });

      // Gestionnaire: Déconnexion
      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        this.handleDisconnect(socket);
      });
    });

    logger.success('✅ Socket.io initialisé avec succès');
  }

  /**
   * Gère la connexion d'un utilisateur
   */
  static handleUserConnect(socket, userId) {
    connectedUsers.set(userId.toString(), socket.id);
    logger.info(`👤 Utilisateur ${userId} connecté (socket: ${socket.id})`);

    // Notifier tous les utilisateurs
    this.io.emit(SOCKET_EVENTS.USER_ONLINE, {
      userId,
      online: true
    });
  }

  /**
   * Gère l'entrée dans une conversation
   */
  static handleConversationJoin(socket, data) {
    const { userId1, userId2 } = data;
    const room = generateRoomId(userId1, userId2);
    
    socket.join(room);
    logger.info(`💬 Socket ${socket.id} a rejoint la room ${room}`);
  }

  /**
   * Gère l'envoi d'un message
   */
  static handleMessageSend(socket, message) {
    logger.debug('📨 Message reçu via Socket.io:', message);

    const room = generateRoomId(message.senderId, message.receiverId);
    
    // Envoyer le message à tous dans la room
    this.io.to(room).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

    // Notifier le destinataire s'il est en ligne
    const receiverSocketId = connectedUsers.get(message.receiverId.toString());
    if (receiverSocketId) {
      this.io.to(receiverSocketId).emit(SOCKET_EVENTS.NOTIFICATION, {
        senderId: message.senderId,
        senderName: message.senderName,
        preview: message.content ? message.content.substring(0, 50) : '[Image]'
      });
    }
  }

  /**
   * Gère le début de la saisie
   */
  static handleTypingStart(socket, data) {
    const { userId1, userId2 } = data;
    const room = generateRoomId(userId1, userId2);
    socket.to(room).emit(SOCKET_EVENTS.TYPING_START, data);
  }

  /**
   * Gère la fin de la saisie
   */
  static handleTypingStop(socket, data) {
    const { userId1, userId2 } = data;
    const room = generateRoomId(userId1, userId2);
    socket.to(room).emit(SOCKET_EVENTS.TYPING_STOP, data);
  }

  /**
   * Gère la déconnexion d'un socket
   */
  static handleDisconnect(socket) {
    logger.info(`❌ Déconnexion Socket.io: ${socket.id}`);

    // Trouver et retirer l'utilisateur
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        
        // Notifier que l'utilisateur est hors ligne
        this.io.emit(SOCKET_EVENTS.USER_ONLINE, {
          userId: parseInt(userId),
          online: false
        });
        break;
      }
    }
  }

  /**
   * Émet un événement à une room spécifique
   */
  static emitToRoom(userId1, userId2, event, data) {
    if (!this.io) {
      logger.warn('Socket.io non initialisé');
      return;
    }

    const room = generateRoomId(userId1, userId2);
    this.io.to(room).emit(event, data);
  }

  /**
   * Émet un événement à un utilisateur spécifique
   */
  static emitToUser(userId, event, data) {
    if (!this.io) {
      logger.warn('Socket.io non initialisé');
      return;
    }

    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Émet un événement à tous les utilisateurs
   */
  static emitToAll(event, data) {
    if (!this.io) {
      logger.warn('Socket.io non initialisé');
      return;
    }

    this.io.emit(event, data);
  }

  /**
   * Obtient la liste des utilisateurs connectés
   */
  static getConnectedUsers() {
    return Array.from(connectedUsers.keys()).map(id => parseInt(id));
  }

  /**
   * Vérifie si un utilisateur est en ligne
   */
  static isUserOnline(userId) {
    return connectedUsers.has(userId.toString());
  }
}

/**
 * Fonction d'initialisation exportée
 */
function initializeSocketService(io) {
  SocketService.initialize(io);
}

module.exports = {
  SocketService,
  initializeSocketService
};