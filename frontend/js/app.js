/**
 * ============================================
 * APP.JS - Point d'entrée principal
 * ============================================
 * 
 * Initialise et gère l'application frontend
 * 
 * Fonctionnalités:
 * - Initialisation de l'application
 * - Gestion de l'authentification
 * - Configuration Socket.io
 * - Gestion des événements UI
 * - Gestion des conversations
 * - Envoi de messages et images
 * 
 * @module app
 * @requires API, socketManager, MessageRenderer, ConversationList
 * @author MessagerieApp
 * @version 2.0.0
 */

/**
 * État global de l'application
 */
const AppState = {
  currentUser: null,
  selectedUser: null,
  isInitialized: false,
  isSocketConnected: false
};

/**
 * Classe principale de l'application
 */
class App {
  /**
   * Constructeur
   */
  constructor() {
    this.state = AppState;
    this.typingTimeout = null;
  }

  // ==========================================
  // INITIALISATION
  // ==========================================

  /**
   * Initialise l'application
   */
  async init() {
    try {
      console.log('[App] 🚀 Initialisation de l\'application...');

      // Vérifier l'authentification
      if (!this.checkAuth()) {
        window.location.href = 'login.html';
        return;
      }

      // Récupérer l'utilisateur actuel
      await this.loadCurrentUser();

      // Initialiser l'interface
      this.initUI();

      // Connecter Socket.io
      await this.connectSocket();

      // Charger les conversations
      await this.loadConversations();

      // Configurer les événements
      this.setupEventListeners();

      // Marquer comme initialisé
      this.state.isInitialized = true;

      console.log('[App] ✅ Application initialisée avec succès');
    } catch (error) {
      console.error('[App] ❌ Erreur d\'initialisation:', error);
      Notifications.error('Erreur lors du chargement de l\'application');
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean}
   */
  checkAuth() {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  /**
   * Charge les informations de l'utilisateur actuel
   */
  async loadCurrentUser() {
    try {
      // Essayer de récupérer depuis le local storage
      let user = UserManager.getCurrentUser();

      // Si pas en local, vérifier le token
      if (!user) {
        const response = await API.verifyToken();
        user = response.user;
        UserManager.saveCurrentUser(user);
      }

      this.state.currentUser = user;
      window.currentUser = user; // Exposer globalement pour les autres modules
      console.log('[App] Utilisateur chargé:', user.nom);
    } catch (error) {
      console.error('[App] Erreur loadCurrentUser:', error);
      // Token invalide, rediriger vers login
      localStorage.removeItem('authToken');
      window.location.href = 'login.html';
    }
  }

  // ==========================================
  // INTERFACE UTILISATEUR
  // ==========================================

  /**
   * Initialise l'interface utilisateur
   */
  initUI() {
    const { currentUser } = this.state;

    // Afficher le nom de l'utilisateur
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = currentUser.nom;
    }

    // Afficher le badge admin si applicable
    if (currentUser.role === 'admin') {
      const roleElement = document.getElementById('userRole');
      if (roleElement) {
        roleElement.classList.remove('hidden');
      }
      // Afficher le bouton administration
      const adminButton = document.getElementById('adminButton');
      if (adminButton) {
        adminButton.classList.remove('hidden');
      }
    }

    // Masquer l'état vide initial
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }

    console.log('[App] Interface initialisée');
  }

  /**
   * Configure tous les événements de l'interface
   */
  setupEventListeners() {
    // Bouton de déconnexion
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Bouton administration
    const adminBtn = document.getElementById('adminButton');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => this.handleAdminAccess());
    }

    // Envoi de message texte
    const sendBtn = document.getElementById('sendButton');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    // Input message - Entrée pour envoyer
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      // Indicateur "en train d'écrire"
      messageInput.addEventListener('input', () => {
        this.handleTyping();
      });
    }

    // Bouton d'envoi d'image
    const imageBtn = document.getElementById('imageButton');
    if (imageBtn) {
      imageBtn.addEventListener('click', () => this.handleImageButtonClick());
    }

    // Input d'image (caché)
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
    }

    console.log('[App] Événements configurés');
  }

  // ==========================================
  // SOCKET.IO
  // ==========================================

  /**
   * Connecte Socket.io
   */
  async connectSocket() {
    try {
      const { currentUser } = this.state;

      await socketManager.connect(currentUser.id);
      this.state.isSocketConnected = true;

      // Configurer les handlers Socket.io
      this.setupSocketHandlers();

      console.log('[App] ✅ Socket.io connecté');
    } catch (error) {
      console.error('[App] Erreur connexion Socket.io:', error);
      Notifications.warning('Connexion temps réel non disponible');
    }
  }

  /**
   * Configure les handlers Socket.io
   */
  setupSocketHandlers() {
    // Nouveau message reçu
    socketManager.on('newMessage', (message) => {
      this.handleNewMessage(message);
    });

    // Image vue
    socketManager.on('imageViewed', (data) => {
      console.log('[App] Image vue:', data);
    });

    // Image expirée
    socketManager.on('imageExpired', (data) => {
      this.handleImageExpired(data);
    });

    // Indicateur de saisie
    socketManager.on('typingStart', (data) => {
      this.handleTypingStart(data);
    });

    socketManager.on('typingStop', (data) => {
      this.handleTypingStop(data);
    });

    // Notification
    socketManager.on('notification', (data) => {
      Notifications.newMessage(data.senderName, data.preview);
    });

    // Statut utilisateur
    socketManager.on('userOnline', (data) => {
      console.log('[App] Statut utilisateur:', data);
    });

    console.log('[App] Handlers Socket.io configurés');
  }

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /**
   * Charge la liste des conversations
   */
  async loadConversations() {
    try {
      const { currentUser } = this.state;
      const users = await UserManager.getConversationUsers(currentUser.id);

      ConversationList.display(users, currentUser.id, null);

      // Mettre à jour le compteur de messages non lus
      const unreadCount = await MessageManager.getUnreadCount(currentUser.id);
      ConversationList.updateUnreadCount(unreadCount);

      console.log('[App] Conversations chargées:', users.length);
    } catch (error) {
      console.error('[App] Erreur loadConversations:', error);
      Notifications.error('Erreur lors du chargement des conversations');
    }
  }

  /**
   * Sélectionne une conversation
   * @param {Object} user - Utilisateur sélectionné
   */
  async selectConversation(user) {
    try {
      this.state.selectedUser = user;
      window.selectedUser = user; // Exposer globalement pour les autres modules

      // Rejoindre la room Socket.io
      if (this.state.isSocketConnected) {
        socketManager.joinConversation(this.state.currentUser.id, user.id);
      }

      // Charger les messages
      const messages = await MessageManager.getConversationMessages(
        this.state.currentUser.id,
        user.id
      );

      // Afficher les messages
      MessageRenderer.displayMessages(messages, this.state.currentUser.id);

      // Afficher le container de chat
      this.showChatContainer(user);

      console.log('[App] Conversation sélectionnée:', user.nom);
    } catch (error) {
      console.error('[App] Erreur selectConversation:', error);
      Notifications.error('Erreur lors de l\'ouverture de la conversation');
    }
  }

  /**
   * Affiche le container de chat
   * @param {Object} user - Utilisateur sélectionné
   */
  showChatContainer(user) {
    const emptyState = document.getElementById('emptyState');
    const chatContainer = document.getElementById('chatContainer');
    const chatUserName = document.getElementById('chatUserName');
    const chatUserEmail = document.getElementById('chatUserEmail');

    if (emptyState) emptyState.classList.add('hidden');
    if (chatContainer) chatContainer.classList.remove('hidden');
    if (chatUserName) chatUserName.textContent = user.nom;
    if (chatUserEmail) chatUserEmail.textContent = user.email;
  }

  // ==========================================
  // ENVOI DE MESSAGES
  // ==========================================

  /**
   * Gère l'envoi d'un message texte
   */
  async handleSendMessage() {
    const { currentUser } = this.state;
    const selectedUser = this.state.selectedUser || window.selectedUser; // Fallback sur window.selectedUser

    if (!selectedUser) {
      Notifications.warning('Sélectionnez une conversation');
      return;
    }

    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content) {
      return;
    }

    try {
      // Désactiver l'input pendant l'envoi
      input.disabled = true;

      // Envoyer via API
      const message = await MessageManager.sendMessage(selectedUser.id, content);

      // Afficher immédiatement
      MessageRenderer.addMessage(message, currentUser.id);

      // Vider l'input
      input.value = '';

      // Arrêter l'indicateur de saisie
      if (this.state.isSocketConnected) {
        socketManager.stopTyping(currentUser.id, selectedUser.id);
      }

      console.log('[App] Message envoyé');
    } catch (error) {
      console.error('[App] Erreur handleSendMessage:', error);
      Notifications.error('Erreur lors de l\'envoi du message');
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  /**
   * Gère le clic sur le bouton d'image
   */
  handleImageButtonClick() {
    const selectedUser = this.state.selectedUser || window.selectedUser; // Fallback sur window.selectedUser

    if (!selectedUser) {
      Notifications.warning('Sélectionnez une conversation');
      return;
    }

    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
      imageInput.click();
    }
  }

  /**
   * Gère la sélection d'une image
   * @param {Event} event - Événement de changement
   */
  async handleImageSelect(event) {
    const { currentUser } = this.state;
    const selectedUser = this.state.selectedUser || window.selectedUser; // Fallback sur window.selectedUser
    const file = event.target.files[0];

    if (!file) return;

    try {
      // Valider l'image
      const validation = ImageHandler.validateImage(file);
      if (!validation.valid) {
        Notifications.error(validation.error);
        return;
      }

      // Afficher une notification de chargement
      Notifications.info('Envoi de l\'image en cours...');

      // Compresser l'image
      const compressedBlob = await ImageHandler.compressImage(file);

      // Convertir en File
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg'
      });

      // Envoyer via API
      const message = await MessageManager.sendImage(selectedUser.id, compressedFile);

      // Afficher immédiatement
      MessageRenderer.addMessage(message, currentUser.id);

      Notifications.success('Image envoyée');

      console.log('[App] Image envoyée');
    } catch (error) {
      console.error('[App] Erreur handleImageSelect:', error);
      Notifications.error('Erreur lors de l\'envoi de l\'image');
    } finally {
      // Réinitialiser l'input
      event.target.value = '';
    }
  }

  // ==========================================
  // INDICATEUR DE SAISIE
  // ==========================================

  /**
   * Gère l'indicateur "en train d'écrire"
   */
  handleTyping() {
    const { currentUser, selectedUser, isSocketConnected } = this.state;

    if (!selectedUser || !isSocketConnected) return;

    // Émettre l'événement de début de saisie
    socketManager.startTyping(currentUser.id, selectedUser.id);

    // Réinitialiser le timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Auto-stop après 3 secondes
    this.typingTimeout = setTimeout(() => {
      socketManager.stopTyping(currentUser.id, selectedUser.id);
    }, 3000);
  }

  /**
   * Affiche l'indicateur "en train d'écrire"
   * @param {Object} data - Données de l'événement
   */
  handleTypingStart(data) {
    const { selectedUser } = this.state;
    
    // Vérifier que c'est dans la conversation actuelle
    if (selectedUser && data.userId1 === selectedUser.id) {
      const indicator = document.getElementById('typingIndicator');
      if (indicator) {
        indicator.classList.remove('hidden');
      }
    }
  }

  /**
   * Masque l'indicateur "en train d'écrire"
   * @param {Object} data - Données de l'événement
   */
  handleTypingStop(data) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.classList.add('hidden');
    }
  }

  // ==========================================
  // RÉCEPTION DE MESSAGES
  // ==========================================

  /**
   * Gère la réception d'un nouveau message
   * @param {Object} message - Nouveau message
   */
  handleNewMessage(message) {
    const { currentUser, selectedUser } = this.state;

    // Si c'est dans la conversation actuelle, afficher immédiatement
    if (selectedUser && 
        (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
      MessageRenderer.addMessage(message, currentUser.id);
    }

    // Mettre à jour le compteur de messages non lus
    this.updateUnreadCount();

    console.log('[App] Nouveau message reçu');
  }

  /**
   * Gère l'expiration d'une image
   * @param {Object} data - Données d'expiration
   */
  handleImageExpired(data) {
    const { messageId } = data;

    // Trouver le message dans le DOM
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      const container = messageElement.querySelector('.message-image-container');
      if (container) {
        ImageHandler.displayExpiredImage(container);
      }
    }

    console.log('[App] Image expirée:', messageId);
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Met à jour le compteur de messages non lus
   */
  async updateUnreadCount() {
    try {
      const { currentUser } = this.state;
      const count = await MessageManager.getUnreadCount(currentUser.id);
      ConversationList.updateUnreadCount(count);
    } catch (error) {
      console.error('[App] Erreur updateUnreadCount:', error);
    }
  }

  /**
   * Gère la déconnexion
   */
  handleLogout() {
    // Déconnecter Socket.io
    if (this.state.isSocketConnected) {
      socketManager.disconnect();
    }

    // Nettoyer les timers d'expiration
    if (typeof expirationManager !== 'undefined') {
      expirationManager.cleanup();
    }

    // Déconnexion API
    API.logout();
  }

  /**
   * Redirige vers la page d'administration
   */
  handleAdminAccess() {
    // Obtenir le répertoire de la page actuelle et rediriger vers admin.html
    const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    window.location.href = currentDir + 'admin.html';
  }

  /**
   * Affiche les informations de debug
   */
  debug() {
    console.log('[App] Debug Info:', {
      state: this.state,
      socket: socketManager.getConnectionStatus(),
      timers: expirationManager ? expirationManager.getActiveTimersCount() : 0
    });
  }
}

// ==========================================
// INITIALISATION GLOBALE
// ==========================================

// Créer l'instance globale
const app = new App();

// Initialiser au chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}

// Export global
if (typeof window !== 'undefined') {
  window.app = app;
  window.AppState = AppState;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, AppState };
}