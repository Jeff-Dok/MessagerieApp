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
  isSocketConnected: false,
  e2eEnabled: false,
  recipientPublicKey: null
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

      // Initialiser le chiffrement E2E
      await this.initE2E();

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
  // CHIFFREMENT E2E
  // ==========================================

  /**
   * Initialise le chiffrement E2E
   * Génère une paire de clés si nécessaire
   */
  async initE2E() {
    try {
      // Vérifier si Web Crypto API est disponible
      if (typeof CryptoUtils === 'undefined' || !CryptoUtils.isSupported()) {
        console.log('[App] E2E non disponible (Web Crypto API non supportée)');
        return;
      }

      const { currentUser } = this.state;

      // Debug: Afficher l'état des clés
      const storageKey = `messagerie_e2e_private_${currentUser.id}`;
      const existingKey = localStorage.getItem(storageKey);
      console.log('[App] E2E Debug - userId:', currentUser.id);
      console.log('[App] E2E Debug - storageKey:', storageKey);
      console.log('[App] E2E Debug - clé existe:', !!existingKey);

      // Vérifier si l'utilisateur a déjà une clé privée locale VALIDE
      if (CryptoUtils.hasKeyPair(currentUser.id)) {
        console.log('[App] ✅ Clés E2E existantes et valides trouvées');
        this.state.e2eEnabled = true;
        return;
      }

      // Pas de clé privée locale valide - il faut (re)générer les clés
      // Même si l'utilisateur a une clé publique sur le serveur, on doit la remplacer
      console.warn('[App] ⚠️ Génération de NOUVELLES clés E2E (les anciens messages ne pourront plus être déchiffrés)');
      const keyPair = await CryptoUtils.generateKeyPair();

      // Sauvegarder la clé privée localement
      CryptoUtils.savePrivateKey(currentUser.id, keyPair.privateKey);

      // Envoyer la clé publique au serveur (écrase l'ancienne si existante)
      await API.savePublicKey(keyPair.publicKey);

      console.log('[App] Clés E2E générées et sauvegardées');

      this.state.e2eEnabled = true;
      console.log('[App] Chiffrement E2E activé');
    } catch (error) {
      console.error('[App] Erreur initialisation E2E:', error);
      // Ne pas bloquer l'application si E2E échoue
      this.state.e2eEnabled = false;
    }
  }

  /**
   * Charge la clé publique du destinataire pour le chiffrement E2E
   * @param {number} userId - ID du destinataire
   */
  async loadRecipientPublicKey(userId) {
    try {
      const response = await API.getPublicKey(userId);

      if (response.hasE2EKey && response.publicKey) {
        this.state.recipientPublicKey = response.publicKey;
        console.log('[App] Clé publique du destinataire chargée');
        return true;
      }

      this.state.recipientPublicKey = null;
      return false;
    } catch (error) {
      console.error('[App] Erreur chargement clé publique:', error);
      this.state.recipientPublicKey = null;
      return false;
    }
  }

  /**
   * Vérifie si le chiffrement E2E est disponible pour la conversation actuelle
   * @returns {boolean}
   */
  canUseE2E() {
    return this.state.e2eEnabled &&
           this.state.recipientPublicKey !== null &&
           typeof CryptoUtils !== 'undefined';
  }

  /**
   * Déchiffre un message E2E
   * @param {Object} message - Message chiffré
   * @returns {Promise<string|null>} Contenu déchiffré ou null
   */
  async decryptE2EMessage(message) {
    try {
      if (!message.isE2EEncrypted || !this.state.e2eEnabled) {
        return null;
      }

      const { currentUser } = this.state;

      // Récupérer la clé privée locale
      const privateKey = CryptoUtils.getPrivateKey(currentUser.id);
      if (!privateKey) {
        console.warn('[App] Clé privée non trouvée pour déchiffrement');
        return null;
      }

      // Récupérer la clé publique de l'expéditeur
      let senderPublicKey = message.sender?.publicKey;
      if (!senderPublicKey) {
        // Charger depuis le serveur si pas incluse
        const response = await API.getPublicKey(message.senderId);
        if (!response.publicKey) {
          console.warn('[App] Clé publique de l\'expéditeur non trouvée');
          return null;
        }
        senderPublicKey = response.publicKey;
      }

      // Déchiffrer le message
      const decrypted = await CryptoUtils.decryptFromSender(
        message.encryptedContent,
        message.encryptedKey, // IV stocké dans encryptedKey
        senderPublicKey,
        privateKey
      );

      return decrypted;
    } catch (error) {
      console.error('[App] Erreur déchiffrement E2E:', error);
      return null;
    }
  }

  /**
   * Déchiffre un tableau de messages E2E
   * @param {Array} messages - Messages à déchiffrer
   * @returns {Promise<Array>} Messages déchiffrés
   */
  async decryptMessages(messages) {
    const decrypted = [];

    for (const message of messages) {
      if (message.isE2EEncrypted) {
        const content = await this.decryptE2EMessage(message);
        if (content) {
          message.content = content;
          message.decrypted = true;
        } else {
          message.content = '[Message chiffré - Impossible de déchiffrer]';
          message.decryptionFailed = true;
        }
      }
      decrypted.push(message);
    }

    return decrypted;
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

    // Image vue - notifier le sender que son image a été vue
    socketManager.on('imageViewed', (data) => {
      console.log('[App] Image vue:', data);
      const { messageId, expiresAt } = data;
      // Mettre à jour le badge du timer sur l'image dans la conversation
      if (messageId && expiresAt) {
        MessageRenderer.updateImageViewedStatus(messageId, expiresAt);
      }
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

      // Récupérer les compteurs de messages non lus par conversation
      await this.loadUnreadCounts();

      console.log('[App] Conversations chargées:', users.length);
    } catch (error) {
      console.error('[App] Erreur loadConversations:', error);
      Notifications.error('Erreur lors du chargement des conversations');
    }
  }

  /**
   * Charge et affiche les compteurs de messages non lus par conversation
   */
  async loadUnreadCounts() {
    try {
      const response = await API.getUnreadCounts();

      if (response.success && response.unreadCounts) {
        let totalUnread = 0;

        // Ajouter un badge pour chaque conversation avec des messages non lus
        for (const [senderId, count] of Object.entries(response.unreadCounts)) {
          ConversationList.addUnreadBadge(parseInt(senderId), count);
          totalUnread += count;
        }

        // Mettre à jour le compteur global
        ConversationList.updateUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('[App] Erreur loadUnreadCounts:', error);
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
      window.currentSelectedUser = user; // Pour ConversationList

      // Mettre à jour l'état actif dans la liste des conversations
      ConversationList.updateActiveState(user.id);

      // Charger la clé publique du destinataire pour E2E
      if (this.state.e2eEnabled) {
        const hasKey = await this.loadRecipientPublicKey(user.id);
        console.log('[App] Clé publique destinataire:', hasKey ? 'chargée' : 'non disponible');
      }

      // Rejoindre la room Socket.io
      if (this.state.isSocketConnected) {
        socketManager.joinConversation(this.state.currentUser.id, user.id);
      }

      // Afficher le container de chat
      this.showChatContainer(user);

      // Charger les messages
      let messages = await MessageManager.getConversationMessages(
        this.state.currentUser.id,
        user.id
      );

      // Déchiffrer les messages E2E
      messages = await this.decryptMessages(messages);

      // Afficher les messages
      MessageRenderer.displayMessages(messages, this.state.currentUser.id);

      // Marquer les messages de cette conversation comme lus
      await API.markConversationAsRead(user.id);

      // Retirer le badge de cette conversation
      ConversationList.removeUnreadBadge(user.id);

      // Mettre à jour les compteurs de messages non lus
      await this.loadUnreadCounts();

      console.log('[App] Conversation sélectionnée:', user.nom, '| E2E disponible:', this.canUseE2E());
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

      let message;

      // Vérifier si on peut utiliser le chiffrement E2E
      if (this.canUseE2E()) {
        console.log('[App] Envoi avec chiffrement E2E');

        // Récupérer la clé privée locale
        const privateKey = CryptoUtils.getPrivateKey(currentUser.id);

        // Vérifier que la clé privée est valide
        if (!privateKey || !CryptoUtils.hasKeyPair(currentUser.id)) {
          console.warn('[App] Clé privée invalide, envoi sans chiffrement');
          this.state.e2eEnabled = false;
          const message = await MessageManager.sendMessage(selectedUser.id, content);
          MessageRenderer.addMessage(message, currentUser.id);
          input.value = '';
          return;
        }

        // Chiffrer le message
        const encrypted = await CryptoUtils.encryptForRecipient(
          content,
          this.state.recipientPublicKey,
          privateKey
        );

        // Envoyer via API E2E
        const response = await API.sendE2EMessage(
          selectedUser.id,
          encrypted.encryptedContent,
          encrypted.iv
        );

        message = response.data;

        // Remplacer le contenu chiffré par le contenu original pour l'affichage
        message.content = content;
        message.decrypted = true;
      } else {
        // Envoi classique sans chiffrement
        message = await MessageManager.sendMessage(selectedUser.id, content);
      }

      // Afficher immédiatement
      MessageRenderer.addMessage(message, currentUser.id);

      // Vider l'input
      input.value = '';

      // Arrêter l'indicateur de saisie
      if (this.state.isSocketConnected) {
        socketManager.stopTyping(currentUser.id, selectedUser.id);
      }

      console.log('[App] Message envoyé', this.canUseE2E() ? '(E2E)' : '(non chiffré)');
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
  async handleNewMessage(message) {
    const { currentUser } = this.state;
    const selectedUser = this.state.selectedUser || window.selectedUser;

    // Ignorer si c'est notre propre message (déjà ajouté via handleSendMessage)
    if (Number(message.senderId) === Number(currentUser.id)) {
      console.log('[App] Message propre ignoré (déjà affiché)');
      return;
    }

    // Déchiffrer le message E2E si nécessaire
    if (message.isE2EEncrypted && this.state.e2eEnabled) {
      const decryptedContent = await this.decryptE2EMessage(message);
      if (decryptedContent) {
        message.content = decryptedContent;
        message.decrypted = true;
      } else {
        message.content = '[Message chiffré - Impossible de déchiffrer]';
        message.decryptionFailed = true;
      }
    }

    // Si c'est dans la conversation actuelle, afficher immédiatement et marquer comme lu
    if (selectedUser && Number(message.senderId) === Number(selectedUser.id)) {
      console.log('[App] Ajout du message à la conversation');

      // Marquer le message comme lu car on est déjà dans la conversation
      message.read = true;
      MessageRenderer.addMessage(message, currentUser.id);

      // Notifier le serveur que le message est lu
      try {
        await API.markAsRead(message.id);
        console.log('[App] Message marqué comme lu:', message.id);
      } catch (error) {
        console.error('[App] Erreur lors du marquage comme lu:', error);
      }
    } else {
      console.log('[App] Message reçu mais pas dans la conversation actuelle', {
        senderId: message.senderId,
        selectedUserId: selectedUser?.id
      });

      // Vérifier si l'expéditeur est dans la liste des conversations
      const existingConversation = document.querySelector(
        `.conversation-item[data-user-id="${message.senderId}"]`
      );

      // Si la conversation n'existe pas (supprimée puis restaurée), l'ajouter
      if (!existingConversation && message.sender) {
        console.log('[App] Conversation restaurée, ajout à la liste:', message.sender.nom);
        const container = document.getElementById('conversationsList');
        if (container) {
          const item = ConversationList.createConversationItem(message.sender, null);
          container.insertBefore(item, container.firstChild);

          // Masquer l'état vide si nécessaire
          const emptyState = document.getElementById('conversationsEmpty');
          if (emptyState) {
            emptyState.classList.add('hidden');
          }
        }
      }

      // Mettre à jour le compteur de messages non lus
      this.updateUnreadCount();
    }

    console.log('[App] Nouveau message reçu de', message.senderId);
  }

  /**
   * Gère l'expiration d'une image
   * @param {Object} data - Données d'expiration
   */
  handleImageExpired(data) {
    const { messageId, deleted } = data;

    // Fermer le modal si cette image est ouverte
    const modal = document.getElementById('imageModal');
    if (modal && modal.dataset.messageId == messageId) {
      const closeBtn = modal.querySelector('.image-modal-close');
      if (closeBtn) closeBtn.click();
    }

    // Si supprimé de la DB, retirer du DOM
    if (deleted) {
      MessageRenderer.removeMessageById(messageId);
      console.log('[App] Message image supprimé du DOM (cleanup DB):', messageId);
      return;
    }

    // Sinon, afficher comme expirée (utilise expireImageById qui évite les doublons)
    MessageRenderer.expireImageById(messageId);
    console.log('[App] Image expirée:', messageId);
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Met à jour les compteurs de messages non lus
   */
  async updateUnreadCount() {
    try {
      await this.loadUnreadCounts();
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

    // Réinitialiser l'état E2E (les clés sont gardées en localStorage pour relire les anciens messages)
    this.state.e2eEnabled = false;
    this.state.recipientPublicKey = null;

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