/**
 * ============================================
 * API CLIENT - Client HTTP pour l'API Backend
 * ============================================
 * 
 * Gère toutes les communications HTTP avec le serveur backend
 * 
 * Fonctionnalités:
 * - Authentification (login, register, verify)
 * - Gestion des utilisateurs
 * - Gestion des messages (texte et images)
 * - Gestion des erreurs centralisée
 * - Intercepteurs pour tokens JWT
 * 
 * @module api
 * @author MessagerieApp
 * @version 3.1.0
 */

/**
 * Configuration de l'API
 * Utilise CONFIG global si disponible, sinon valeurs par défaut
 */
const API_CONFIG = {
  get BASE_URL() {
    return (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL
      : 'http://localhost:5000/api';
  },
  get TIMEOUT() {
    return (typeof CONFIG !== 'undefined' && CONFIG.TIMEOUT?.API)
      ? CONFIG.TIMEOUT.API
      : 30000;
  },
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

/**
 * Client API principal
 */
const API = {
  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Récupère le token d'authentification
   * @returns {string|null} Token JWT
   * @private
   */
  _getToken() {
    return localStorage.getItem('authToken');
  },

  /**
   * Définit le token d'authentification
   * @param {string} token - Token JWT
   * @private
   */
  _setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },

  /**
   * Génère les headers de requête avec authentification
   * @param {Object} additionalHeaders - Headers supplémentaires
   * @returns {Object} Headers complets
   * @private
   */
  _getHeaders(additionalHeaders = {}) {
    const headers = { ...API_CONFIG.HEADERS, ...additionalHeaders };
    const token = this._getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  /**
   * Gère les erreurs de requête
   * @param {Error} error - Erreur capturée
   * @param {string} context - Contexte de l'erreur
   * @throws {Error} Erreur formatée
   * @private
   */
  _handleError(error, context = 'Requête API') {
    console.error(`[API Error - ${context}]:`, error);

    if (error.response) {
      // Erreur de réponse serveur (4xx, 5xx)
      const message = error.response.message || error.response.error || 'Erreur serveur';
      throw new Error(message);
    } else if (error.request) {
      // Pas de réponse du serveur
      throw new Error('Impossible de contacter le serveur');
    } else {
      // Erreur de configuration
      throw new Error(error.message || 'Erreur inconnue');
    }
  },

  /**
   * Effectue une requête HTTP
   * @param {string} endpoint - Point de terminaison de l'API
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} Réponse de l'API
   * @private
   */
  async _request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      isFormData = false
    } = options;

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const fetchOptions = {
      method,
      headers: isFormData ? this._getHeaders({}) : this._getHeaders(headers),
      credentials: 'include'
    };

    // Ne pas ajouter Content-Type pour FormData (le navigateur le fait automatiquement)
    if (isFormData && fetchOptions.headers['Content-Type']) {
      delete fetchOptions.headers['Content-Type'];
    }

    if (body) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      fetchOptions.signal = controller.signal;

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            message: errorData.message || `Erreur HTTP ${response.status}`,
            ...errorData
          }
        };
      }

      // Parser la réponse JSON
      const data = await response.json();
      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('La requête a expiré');
      }
      throw error;
    }
  },

  // ==========================================
  // AUTHENTIFICATION
  // ==========================================

  /**
   * Connecte un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Réponse contenant token et user
   * @example
   * const result = await API.login('user@example.com', 'password123');
   * if (result.success) {
   *   console.log('Token:', result.token);
   * }
   */
  async login(email, password) {
    try {
      const response = await this._request('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response.token) {
        this._setToken(response.token);
      }

      return response;
    } catch (error) {
      this._handleError(error, 'Login');
    }
  },

  /**
   * Inscrit un nouvel utilisateur
   * @param {string} nom - Nom complet
   * @param {string} email - Email
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Réponse contenant token et user
   */
  async register(nom, email, password) {
    try {
      const response = await this._request('/auth/register', {
        method: 'POST',
        body: { nom, email, password }
      });

      if (response.token) {
        this._setToken(response.token);
      }

      return response;
    } catch (error) {
      this._handleError(error, 'Register');
    }
  },

  /**
   * Vérifie le token JWT actuel
   * @returns {Promise<Object>} Informations de l'utilisateur
   */
  async verifyToken() {
    try {
      return await this._request('/auth/verify', {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Verify Token');
    }
  },

  /**
   * Rafraîchit le token JWT
   * @returns {Promise<Object>} Nouveau token
   */
  async refreshToken() {
    try {
      const response = await this._request('/auth/refresh', {
        method: 'POST'
      });

      if (response.token) {
        this._setToken(response.token);
      }

      return response;
    } catch (error) {
      this._handleError(error, 'Refresh Token');
    }
  },

  /**
   * Déconnecte l'utilisateur (côté client)
   */
  logout() {
    this._setToken(null);
    localStorage.removeItem('currentUser');
    // Obtenir le répertoire de la page actuelle et ajouter login.html
    const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    window.location.href = currentDir + 'login.html';
  },

  // ==========================================
  // CHIFFREMENT E2E
  // ==========================================

  /**
   * Sauvegarde la clé publique E2E de l'utilisateur
   * @param {string} publicKey - Clé publique en format JWK (JSON string)
   * @returns {Promise<Object>} Confirmation
   */
  async savePublicKey(publicKey) {
    try {
      return await this._request('/auth/public-key', {
        method: 'POST',
        body: { publicKey }
      });
    } catch (error) {
      this._handleError(error, 'Save Public Key');
    }
  },

  /**
   * Récupère la clé publique E2E d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Contient publicKey et hasE2EKey
   */
  async getPublicKey(userId) {
    try {
      return await this._request(`/auth/public-key/${userId}`, {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get Public Key');
    }
  },

  /**
   * Vérifie si l'utilisateur courant a une clé E2E configurée
   * @returns {Promise<Object>} Contient hasE2EKey
   */
  async hasE2EKey() {
    try {
      return await this._request('/auth/has-e2e-key', {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Has E2E Key');
    }
  },

  /**
   * Envoie un message texte chiffré E2E
   * @param {number} receiverId - ID du destinataire
   * @param {string} encryptedContent - Contenu chiffré (base64)
   * @param {string} iv - IV utilisé pour le chiffrement (base64)
   * @returns {Promise<Object>} Message créé
   */
  async sendE2EMessage(receiverId, encryptedContent, iv) {
    try {
      return await this._request('/messages/e2e', {
        method: 'POST',
        body: { receiverId, encryptedContent, iv }
      });
    } catch (error) {
      this._handleError(error, 'Send E2E Message');
    }
  },

  // ==========================================
  // UTILISATEURS
  // ==========================================

  /**
   * Récupère tous les utilisateurs
   * @param {Object} params - Paramètres de pagination et recherche
   * @returns {Promise<Object>} Liste des utilisateurs
   */
  async getUsers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
      
      return await this._request(endpoint, {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get Users');
    }
  },

  /**
   * Récupère un utilisateur par ID
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async getUser(userId) {
    try {
      return await this._request(`/users/${userId}`, {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get User');
    }
  },

  /**
   * Met à jour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Utilisateur mis à jour
   */
  async updateUser(userId, data) {
    try {
      return await this._request(`/users/${userId}`, {
        method: 'PUT',
        body: data
      });
    } catch (error) {
      this._handleError(error, 'Update User');
    }
  },

  /**
   * Supprime un utilisateur (admin uniquement)
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteUser(userId) {
    try {
      return await this._request(`/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      this._handleError(error, 'Delete User');
    }
  },

  /**
   * Récupère les statistiques d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  async getUserStats(userId) {
    try {
      return await this._request(`/users/${userId}/stats`, {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get User Stats');
    }
  },

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Envoie un message texte
   * @param {number} receiverId - ID du destinataire
   * @param {string} content - Contenu du message
   * @returns {Promise<Object>} Message créé
   */
  async sendMessage(receiverId, content) {
    try {
      return await this._request('/messages', {
        method: 'POST',
        body: { receiverId, content }
      });
    } catch (error) {
      this._handleError(error, 'Send Message');
    }
  },

  /**
   * Envoie une image
   * @param {number} receiverId - ID du destinataire
   * @param {File} imageFile - Fichier image
   * @returns {Promise<Object>} Message image créé
   */
  async sendImage(receiverId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('receiverId', receiverId);
      formData.append('image', imageFile);

      return await this._request('/messages/image', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
    } catch (error) {
      this._handleError(error, 'Send Image');
    }
  },

  /**
   * Récupère tous les messages de l'utilisateur
   * @returns {Promise<Object>} Liste des messages
   */
  async getAllMessages() {
    try {
      return await this._request('/messages', {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get All Messages');
    }
  },

  /**
   * Récupère les messages d'une conversation
   * @param {number} userId - ID de l'autre utilisateur
   * @returns {Promise<Object>} Messages de la conversation
   */
  async getConversation(userId) {
    try {
      return await this._request(`/messages/conversation/${userId}`, {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get Conversation');
    }
  },

  /**
   * Marque un message comme lu
   * @param {number} messageId - ID du message
   * @returns {Promise<Object>} Confirmation
   */
  async markAsRead(messageId) {
    try {
      return await this._request(`/messages/${messageId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      this._handleError(error, 'Mark As Read');
    }
  },

  /**
   * Marque tous les messages d'une conversation comme lus
   * @param {number} userId - ID de l'autre utilisateur dans la conversation
   * @returns {Promise<Object>} Confirmation avec nombre de messages mis à jour
   */
  async markConversationAsRead(userId) {
    try {
      return await this._request(`/messages/conversation/${userId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      this._handleError(error, 'Mark Conversation As Read');
    }
  },

  /**
   * Récupère le nombre de messages non lus par conversation
   * @returns {Promise<Object>} Objet avec les compteurs { senderId: count }
   */
  async getUnreadCounts() {
    try {
      return await this._request('/messages/unread/counts', {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get Unread Counts');
    }
  },

  /**
   * Marque une image comme vue (démarre l'expiration)
   * @param {number} messageId - ID du message image
   * @returns {Promise<Object>} Confirmation avec dates d'expiration
   */
  async markImageAsViewed(messageId) {
    try {
      return await this._request(`/messages/${messageId}/view`, {
        method: 'PUT'
      });
    } catch (error) {
      this._handleError(error, 'Mark Image As Viewed');
    }
  },

  /**
   * Fait expirer une image manuellement
   * @param {number} messageId - ID du message image
   * @returns {Promise<Object>} Confirmation
   */
  async expireImage(messageId) {
    try {
      return await this._request(`/messages/${messageId}/expire`, {
        method: 'POST'
      });
    } catch (error) {
      this._handleError(error, 'Expire Image');
    }
  },

  /**
   * Supprime un message
   * @param {number} messageId - ID du message
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteMessage(messageId) {
    try {
      return await this._request(`/messages/${messageId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      this._handleError(error, 'Delete Message');
    }
  },

  /**
   * Récupère les utilisateurs disponibles pour les conversations
   * (filtre automatiquement les conversations supprimées)
   * @returns {Promise<Object>} Liste des utilisateurs
   */
  async getConversationUsers() {
    try {
      return await this._request('/messages/conversation-users', {
        method: 'GET'
      });
    } catch (error) {
      this._handleError(error, 'Get Conversation Users');
    }
  },

  /**
   * Supprime une conversation
   * (soft delete jusqu'à ce que les deux utilisateurs suppriment)
   * @param {number} userId - ID de l'autre utilisateur de la conversation
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteConversation(userId) {
    try {
      return await this._request(`/messages/conversation/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      this._handleError(error, 'Delete Conversation');
    }
  },

  // ==========================================
  // SANTÉ DE L'API
  // ==========================================

  /**
   * Vérifie l'état de santé du serveur
   * @returns {Promise<Object>} État du serveur
   */
  async healthCheck() {
    try {
      return await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/health`)
        .then(res => res.json());
    } catch (error) {
      this._handleError(error, 'Health Check');
    }
  }
};

// ==========================================
// GESTIONNAIRE D'UTILISATEURS (Frontend)
// ==========================================

/**
 * Gestionnaire des utilisateurs côté frontend
 * Complète l'API avec des méthodes de gestion locale
 */
const UserManager = {
  /**
   * Récupère tous les utilisateurs depuis l'API
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async getAllUsers() {
    try {
      const response = await API.getUsers();
      return response.users || [];
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      return [];
    }
  },

  /**
   * Récupère un utilisateur par ID
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<Object|null>} Utilisateur ou null
   */
  async getUserById(id) {
    try {
      const response = await API.getUser(id);
      return response.user || null;
    } catch (error) {
      console.error('Erreur getUserById:', error);
      return null;
    }
  },

  /**
   * Récupère les utilisateurs pour les conversations
   * (filtre automatiquement les conversations supprimées côté serveur)
   * @param {number} currentUserId - ID de l'utilisateur actuel (non utilisé, filtré côté serveur)
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async getConversationUsers(currentUserId) {
    try {
      const response = await API.getConversationUsers();
      return response.users || [];
    } catch (error) {
      console.error('Erreur getConversationUsers:', error);
      return [];
    }
  },

  /**
   * Sauvegarde l'utilisateur actuel en local
   * @param {Object} user - Données de l'utilisateur
   */
  saveCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  /**
   * Récupère l'utilisateur actuel depuis le local
   * @returns {Object|null} Utilisateur actuel ou null
   */
  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Supprime l'utilisateur actuel du local
   */
  clearCurrentUser() {
    localStorage.removeItem('currentUser');
  }
};

// ==========================================
// GESTIONNAIRE DE MESSAGES (Frontend)
// ==========================================

/**
 * Gestionnaire des messages côté frontend
 */
const MessageManager = {
  /**
   * Récupère tous les messages
   * @returns {Promise<Array>} Liste des messages
   */
  async getAllMessages() {
    try {
      const response = await API.getAllMessages();
      return response.messages || [];
    } catch (error) {
      console.error('Erreur getAllMessages:', error);
      return [];
    }
  },

  /**
   * Récupère les messages d'une conversation
   * @param {number} userId1 - ID du premier utilisateur
   * @param {number} userId2 - ID du deuxième utilisateur
   * @returns {Promise<Array>} Messages de la conversation
   */
  async getConversationMessages(userId1, userId2) {
    try {
      const response = await API.getConversation(userId2);
      return response.messages || [];
    } catch (error) {
      console.error('Erreur getConversationMessages:', error);
      return [];
    }
  },

  /**
   * Envoie un message texte
   * @param {number} receiverId - ID du destinataire
   * @param {string} content - Contenu du message
   * @returns {Promise<Object|null>} Message créé ou null
   */
  async sendMessage(receiverId, content) {
    try {
      const response = await API.sendMessage(receiverId, content);
      return response.data || null;
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      throw error;
    }
  },

  /**
   * Envoie une image
   * @param {number} receiverId - ID du destinataire
   * @param {File} imageFile - Fichier image
   * @returns {Promise<Object|null>} Message image créé ou null
   */
  async sendImage(receiverId, imageFile) {
    try {
      const response = await API.sendImage(receiverId, imageFile);
      return response.data || null;
    } catch (error) {
      console.error('Erreur sendImage:', error);
      throw error;
    }
  },

  /**
   * Compte les messages non lus
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre de messages non lus
   */
  async getUnreadCount(userId) {
    try {
      const messages = await this.getAllMessages();
      return messages.filter(msg => 
        msg.receiverId === userId && !msg.read
      ).length;
    } catch (error) {
      console.error('Erreur getUnreadCount:', error);
      return 0;
    }
  }
};

// Export global
if (typeof window !== 'undefined') {
  window.API = API;
  window.UserManager = UserManager;
  window.MessageManager = MessageManager;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API, UserManager, MessageManager };
}