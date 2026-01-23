/**
 * ============================================
 * SOCKET CLIENT - Client Socket.io
 * ============================================
 * 
 * Gère la communication temps réel via WebSocket
 * 
 * Fonctionnalités:
 * - Connexion/déconnexion automatique
 * - Gestion des rooms de conversation
 * - Réception de messages en temps réel
 * - Indicateurs "en train d'écrire"
 * - Notifications d'expiration d'images
 * - Reconnexion automatique
 * 
 * @module socket
 * @requires socket.io-client
 * @author MessagerieApp
 * @version 3.1.0
 */

/**
 * Configuration Socket.io
 * Utilise CONFIG global si disponible, sinon valeurs par défaut
 */
const SOCKET_CONFIG = {
  get URL() {
    return (typeof CONFIG !== 'undefined' && CONFIG.SOCKET_URL)
      ? CONFIG.SOCKET_URL
      : 'http://localhost:5000';
  },
  OPTIONS: {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    get timeout() {
      return (typeof CONFIG !== 'undefined' && CONFIG.TIMEOUT?.SOCKET)
        ? CONFIG.TIMEOUT.SOCKET
        : 20000;
    }
  }
};

/**
 * Événements Socket.io (doit correspondre au backend)
 */
const SOCKET_EVENTS = {
  // Connexion
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // Utilisateurs
  USER_CONNECT: 'user:connect',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  
  // Conversations
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  
  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELETE: 'message:delete',
  
  // Images
  IMAGE_VIEWED: 'image:viewed',
  IMAGE_EXPIRED: 'image:expired',
  
  // Indicateurs
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  
  // Notifications
  NOTIFICATION: 'notification:new_message'
};

/**
 * Gestionnaire Socket.io
 */
class SocketManager {
  /**
   * Constructeur
   */
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.currentRoom = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.typingTimeout = null;
    this.eventHandlers = new Map();
  }

  // ==========================================
  // CONNEXION ET DÉCONNEXION
  // ==========================================

  /**
   * Initialise et connecte le socket
   * @param {number} userId - ID de l'utilisateur actuel
   * @returns {Promise<void>}
   */
  async connect(userId) {
    if (this.socket && this.isConnected) {
      console.log('[Socket] Déjà connecté');
      return;
    }

    this.currentUserId = userId;

    try {
      // Créer l'instance Socket.io
      this.socket = io(SOCKET_CONFIG.URL, SOCKET_CONFIG.OPTIONS);

      // Configurer les gestionnaires d'événements
      this._setupEventHandlers();

      // Attendre la connexion
      await this._waitForConnection();

      // Enregistrer l'utilisateur
      this.socket.emit(SOCKET_EVENTS.USER_CONNECT, userId);

      console.log('[Socket] ✅ Connecté avec succès (User ID:', userId, ')');
    } catch (error) {
      console.error('[Socket] ❌ Erreur de connexion:', error);
      throw error;
    }
  }

  /**
   * Attend que la connexion soit établie
   * @returns {Promise<void>}
   * @private
   */
  _waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de connexion'));
      }, SOCKET_CONFIG.OPTIONS.timeout);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Déconnecte le socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
      console.log('[Socket] Déconnecté');
    }
  }

  /**
   * Vérifie si le socket est connecté
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  // ==========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ==========================================

  /**
   * Configure tous les gestionnaires d'événements
   * @private
   */
  _setupEventHandlers() {
    // Connexion
    this.socket.on('connect', () => {
      console.log('[Socket] ✅ Connexion établie');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Réenregistrer l'utilisateur si nécessaire
      if (this.currentUserId) {
        this.socket.emit(SOCKET_EVENTS.USER_CONNECT, this.currentUserId);
      }
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] ⚠️ Déconnexion:', reason);
      this.isConnected = false;

      if (reason === 'io server disconnect') {
        // Le serveur a forcé la déconnexion, reconnecter manuellement
        this.socket.connect();
      }
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] ❌ Erreur de connexion:', error.message);
    });

    // Tentative de reconnexion
    this.socket.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
      console.log(`[Socket] 🔄 Tentative de reconnexion ${attempt}...`);
    });

    // Reconnexion réussie
    this.socket.on('reconnect', (attempt) => {
      console.log(`[Socket] ✅ Reconnecté après ${attempt} tentatives`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Échec de reconnexion
    this.socket.on('reconnect_failed', () => {
      console.error('[Socket] ❌ Échec de reconnexion après plusieurs tentatives');
    });

    // Utilisateur en ligne/hors ligne
    this.socket.on(SOCKET_EVENTS.USER_ONLINE, (data) => {
      console.log('[Socket] Statut utilisateur:', data);
      this._triggerHandler('userOnline', data);
    });

    // Nouveau message
    this.socket.on(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
      console.log('[Socket] 📨 Nouveau message reçu:', message);
      this._triggerHandler('newMessage', message);
    });

    // Image vue
    this.socket.on(SOCKET_EVENTS.IMAGE_VIEWED, (data) => {
      console.log('[Socket] 👁️ Image vue:', data);
      this._triggerHandler('imageViewed', data);
    });

    // Image expirée
    this.socket.on(SOCKET_EVENTS.IMAGE_EXPIRED, (data) => {
      console.log('[Socket] 🔒 Image expirée:', data);
      this._triggerHandler('imageExpired', data);
    });

    // Indicateur de saisie (début)
    this.socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
      console.log('[Socket] ⌨️ Utilisateur en train d\'écrire:', data);
      this._triggerHandler('typingStart', data);
    });

    // Indicateur de saisie (fin)
    this.socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
      console.log('[Socket] 🛑 Fin de saisie:', data);
      this._triggerHandler('typingStop', data);
    });

    // Notification
    this.socket.on(SOCKET_EVENTS.NOTIFICATION, (data) => {
      console.log('[Socket] 🔔 Notification:', data);
      this._triggerHandler('notification', data);
    });
  }

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /**
   * Rejoint une room de conversation
   * @param {number} userId1 - ID du premier utilisateur
   * @param {number} userId2 - ID du deuxième utilisateur
   */
  joinConversation(userId1, userId2) {
    if (!this.isSocketConnected()) {
      console.warn('[Socket] Non connecté, impossible de rejoindre la conversation');
      return;
    }

    const room = this._generateRoomId(userId1, userId2);
    
    // Quitter l'ancienne room si différente
    if (this.currentRoom && this.currentRoom !== room) {
      this.leaveConversation();
    }

    this.currentRoom = room;
    this.socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { userId1, userId2 });
    
    console.log(`[Socket] 💬 Room rejointe: ${room}`);
  }

  /**
   * Quitte la room de conversation actuelle
   */
  leaveConversation() {
    if (!this.isSocketConnected() || !this.currentRoom) {
      return;
    }

    this.socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { room: this.currentRoom });
    console.log(`[Socket] 👋 Room quittée: ${this.currentRoom}`);
    this.currentRoom = null;
  }

  /**
   * Génère un ID de room unique pour une conversation
   * @param {number} userId1 - ID du premier utilisateur
   * @param {number} userId2 - ID du deuxième utilisateur
   * @returns {string} ID de la room
   * @private
   */
  _generateRoomId(userId1, userId2) {
    const minId = Math.min(userId1, userId2);
    const maxId = Math.max(userId1, userId2);
    return `conversation_${minId}_${maxId}`;
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Envoie un message via Socket.io
   * @param {Object} message - Données du message
   */
  sendMessage(message) {
    if (!this.isSocketConnected()) {
      console.warn('[Socket] Non connecté, impossible d\'envoyer le message');
      return;
    }

    this.socket.emit(SOCKET_EVENTS.MESSAGE_SEND, message);
    console.log('[Socket] ✉️ Message envoyé via Socket.io');
  }

  // ==========================================
  // INDICATEURS DE SAISIE
  // ==========================================

  /**
   * Indique que l'utilisateur commence à écrire
   * @param {number} userId - ID de l'utilisateur
   * @param {number} receiverId - ID du destinataire
   */
  startTyping(userId, receiverId) {
    if (!this.isSocketConnected()) return;

    // Annuler le timeout précédent
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Émettre l'événement
    this.socket.emit(SOCKET_EVENTS.TYPING_START, {
      userId1: userId,
      userId2: receiverId
    });

    // Auto-stop après 3 secondes d'inactivité
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(userId, receiverId);
    }, 3000);
  }

  /**
   * Indique que l'utilisateur a arrêté d'écrire
   * @param {number} userId - ID de l'utilisateur
   * @param {number} receiverId - ID du destinataire
   */
  stopTyping(userId, receiverId) {
    if (!this.isSocketConnected()) return;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.socket.emit(SOCKET_EVENTS.TYPING_STOP, {
      userId1: userId,
      userId2: receiverId
    });
  }

  // ==========================================
  // GESTION DES HANDLERS PERSONNALISÉS
  // ==========================================

  /**
   * Enregistre un handler pour un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction callback
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  /**
   * Retire un handler
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction callback
   */
  off(event, callback) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(callback);
    
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Déclenche les handlers pour un événement
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données de l'événement
   * @private
   */
  _triggerHandler(event, data) {
    if (!this.eventHandlers.has(event)) return;

    const handlers = this.eventHandlers.get(event);
    handlers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Socket] Erreur dans le handler ${event}:`, error);
      }
    });
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Obtient l'état de la connexion
   * @returns {Object} État de la connexion
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      currentUserId: this.currentUserId,
      currentRoom: this.currentRoom,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Affiche les informations de debug
   */
  debug() {
    console.log('[Socket] Debug Info:', {
      connected: this.isConnected,
      socketId: this.socket?.id,
      currentUserId: this.currentUserId,
      currentRoom: this.currentRoom,
      reconnectAttempts: this.reconnectAttempts,
      handlers: Array.from(this.eventHandlers.keys())
    });
  }
}

// ==========================================
// INSTANCE GLOBALE
// ==========================================

// Créer une instance globale
const socketManager = new SocketManager();

// Export global
if (typeof window !== 'undefined') {
  window.socketManager = socketManager;
  window.SocketManager = SocketManager;
  window.SOCKET_EVENTS = SOCKET_EVENTS;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SocketManager, socketManager, SOCKET_EVENTS };
}