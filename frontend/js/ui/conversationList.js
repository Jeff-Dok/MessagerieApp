/**
 * ============================================
 * CONVERSATION LIST - Liste des conversations
 * ============================================
 * 
 * Gère l'affichage et la sélection des conversations
 * 
 * @module ui/conversationList
 * @author MessagerieApp
 * @version 2.0.0
 */

const ConversationList = {
  /**
   * Affiche la liste des conversations
   * @param {Array} users - Liste des utilisateurs
   * @param {number} currentUserId - ID de l'utilisateur actuel
   * @param {number|null} selectedUserId - ID de l'utilisateur sélectionné
   */
  display(users, currentUserId, selectedUserId = null) {
    const container = document.getElementById('conversationsList');
    const emptyState = document.getElementById('conversationsEmpty');
    
    if (!container) return;

    // Vider le container
    container.innerHTML = '';

    // Afficher état vide si pas d'utilisateurs
    if (!users || users.length === 0) {
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
      return;
    }

    // Masquer l'état vide
    if (emptyState) {
      emptyState.classList.add('hidden');
    }

    // Créer les items de conversation
    users.forEach(user => {
      const item = this.createConversationItem(user, selectedUserId);
      container.appendChild(item);
    });
  },

  /**
   * Crée un élément de conversation
   * @param {Object} user - Données de l'utilisateur
   * @param {number|null} selectedUserId - ID de l'utilisateur sélectionné
   * @returns {HTMLElement} Élément de conversation
   */
  createConversationItem(user, selectedUserId) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.dataset.userId = user.id;

    // Marquer comme actif si sélectionné
    if (selectedUserId === user.id) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'true');
    }

    // Nom de l'utilisateur
    const nameDiv = document.createElement('div');
    nameDiv.className = 'conversation-name';
    nameDiv.textContent = user.nom;
    item.appendChild(nameDiv);

    // Email de l'utilisateur
    const emailDiv = document.createElement('div');
    emailDiv.className = 'conversation-email';
    emailDiv.textContent = user.email;
    item.appendChild(emailDiv);

    // Badge admin si applicable
    if (user.role === 'admin') {
      const badge = document.createElement('span');
      badge.className = 'badge badge-warning';
      badge.textContent = 'Admin';
      badge.style.marginTop = 'var(--spacing-2)';
      item.appendChild(badge);
    }

    // Gestionnaire de clic
    item.addEventListener('click', () => {
      this.selectConversation(user);
    });

    // Accessibilité : touche Entrée
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.selectConversation(user);
      }
    });

    return item;
  },

  /**
   * Sélectionne une conversation
   * @param {Object} user - Utilisateur sélectionné
   */
  async selectConversation(user) {
    // Sauvegarder l'utilisateur sélectionné globalement
    window.currentSelectedUser = user;

    // Mettre à jour l'UI
    this.updateActiveState(user.id);

    // Afficher le chat container
    this.showChatContainer(user);

    // Charger les messages
    await this.loadMessages(user.id);

    // Rejoindre la room Socket.io
    if (window.socketManager) {
      socketManager.joinConversation(window.currentUser.id, user.id);
    }
  },

  /**
   * Met à jour l'état actif des conversations
   * @param {number} userId - ID de l'utilisateur à marquer comme actif
   */
  updateActiveState(userId) {
    const items = document.querySelectorAll('.conversation-item');
    items.forEach(item => {
      if (parseInt(item.dataset.userId) === userId) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'true');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });
  },

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
  },

  /**
   * Charge les messages d'une conversation
   * @param {number} userId - ID de l'utilisateur
   */
  async loadMessages(userId) {
    try {
      const response = await API.getConversation(userId);
      
      if (response.success) {
        MessageRenderer.displayMessages(response.messages, window.currentUser.id);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Notifications.error('Erreur lors du chargement des messages');
    }
  },

  /**
   * Ajoute un badge de notification non lue à une conversation
   * @param {number} userId - ID de l'utilisateur
   * @param {number} count - Nombre de messages non lus
   */
  addUnreadBadge(userId, count) {
    const item = document.querySelector(`.conversation-item[data-user-id="${userId}"]`);
    if (!item || count === 0) return;

    // Retirer badge existant
    const existingBadge = item.querySelector('.unread-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Créer nouveau badge
    const badge = document.createElement('span');
    badge.className = 'badge badge-error unread-badge';
    badge.textContent = count;
    badge.style.position = 'absolute';
    badge.style.top = 'var(--spacing-2)';
    badge.style.right = 'var(--spacing-2)';
    item.style.position = 'relative';
    item.appendChild(badge);
  },

  /**
   * Retire le badge de notification d'une conversation
   * @param {number} userId - ID de l'utilisateur
   */
  removeUnreadBadge(userId) {
    const item = document.querySelector(`.conversation-item[data-user-id="${userId}"]`);
    if (!item) return;

    const badge = item.querySelector('.unread-badge');
    if (badge) {
      badge.remove();
    }
  },

  /**
   * Met à jour le compteur global de messages non lus
   * @param {number} count - Nombre total de messages non lus
   */
  updateUnreadCount(count) {
    const badge = document.getElementById('unreadCount');
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConversationList;
}