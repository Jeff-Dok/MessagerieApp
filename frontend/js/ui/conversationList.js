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

    // Container pour le contenu (nom, email)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'conversation-content';

    // Nom de l'utilisateur
    const nameDiv = document.createElement('div');
    nameDiv.className = 'conversation-name';
    nameDiv.textContent = user.nom;
    contentDiv.appendChild(nameDiv);

    // Email de l'utilisateur
    const emailDiv = document.createElement('div');
    emailDiv.className = 'conversation-email';
    emailDiv.textContent = user.email;
    contentDiv.appendChild(emailDiv);

    // Badge admin si applicable
    if (user.role === 'admin') {
      const badge = document.createElement('span');
      badge.className = 'badge badge-warning';
      badge.textContent = 'Admin';
      badge.style.marginTop = 'var(--spacing-2)';
      contentDiv.appendChild(badge);
    }

    item.appendChild(contentDiv);

    // Bouton supprimer
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'conversation-delete-btn';
    deleteBtn.setAttribute('aria-label', 'Supprimer la conversation');
    deleteBtn.setAttribute('title', 'Supprimer la conversation');
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirmDeleteConversation(user);
    });
    item.appendChild(deleteBtn);

    // Gestionnaire de clic sur le contenu
    contentDiv.addEventListener('click', () => {
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
   * Affiche une confirmation et supprime la conversation
   * @param {Object} user - Utilisateur de la conversation à supprimer
   */
  async confirmDeleteConversation(user) {
    const confirmed = confirm(
      `Voulez-vous vraiment supprimer la conversation avec ${user.nom} ?\n\nLa conversation sera supprimée de votre liste mais restera visible pour l'autre utilisateur jusqu'à ce qu'il la supprime aussi.`
    );

    if (!confirmed) return;

    try {
      const response = await API.deleteConversation(user.id);

      if (response.success) {
        // Supprimer l'élément du DOM
        const item = document.querySelector(
          `.conversation-item[data-user-id="${user.id}"]`
        );
        if (item) {
          item.remove();
        }

        // Si c'était la conversation active, masquer le chat
        if (window.selectedUser && window.selectedUser.id === user.id) {
          window.selectedUser = null;
          const chatContainer = document.getElementById('chatContainer');
          const emptyState = document.getElementById('emptyState');
          if (chatContainer) chatContainer.classList.add('hidden');
          if (emptyState) emptyState.classList.remove('hidden');
        }

        // Notification de succès
        if (typeof Notifications !== 'undefined') {
          Notifications.success(response.message || 'Conversation supprimée');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      if (typeof Notifications !== 'undefined') {
        Notifications.error('Erreur lors de la suppression');
      }
    }
  },

  /**
   * Sélectionne une conversation
   * @param {Object} user - Utilisateur sélectionné
   */
  async selectConversation(user) {
    // Si l'App est disponible, utiliser sa méthode pour gérer E2E
    if (window.app && typeof window.app.selectConversation === 'function') {
      await window.app.selectConversation(user);
      return;
    }

    // Fallback si App n'est pas disponible
    window.currentSelectedUser = user;
    window.selectedUser = user;

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

    // Marquer les messages de cette conversation comme lus
    try {
      await API.markConversationAsRead(user.id);
      // Retirer le badge de cette conversation
      this.removeUnreadBadge(user.id);
      // Mettre à jour les compteurs via l'app si disponible
      if (window.app && typeof window.app.loadUnreadCounts === 'function') {
        await window.app.loadUnreadCounts();
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
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
  },

  // ==========================================
  // MODAL NOUVELLE CONVERSATION
  // ==========================================

  /**
   * Initialise le modal de nouvelle conversation
   */
  initNewConversationModal() {
    const newBtn = document.getElementById('newConversationBtn');
    const modal = document.getElementById('newConversationModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const overlay = modal?.querySelector('.modal-overlay');
    const searchInput = document.getElementById('userSearchInput');

    if (!newBtn || !modal) return;

    // Ouvrir le modal
    newBtn.addEventListener('click', () => {
      this.openNewConversationModal();
    });

    // Fermer le modal
    closeBtn?.addEventListener('click', () => {
      this.closeNewConversationModal();
    });

    overlay?.addEventListener('click', () => {
      this.closeNewConversationModal();
    });

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        this.closeNewConversationModal();
      }
    });

    // Recherche avec debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      if (query.length < 2) {
        this.showSearchHint();
        return;
      }

      this.showSearchLoading();
      searchTimeout = setTimeout(() => {
        this.searchUsers(query);
      }, 300);
    });

    console.log('[ConversationList] Modal nouvelle conversation initialisé');
  },

  /**
   * Ouvre le modal de nouvelle conversation
   */
  openNewConversationModal() {
    const modal = document.getElementById('newConversationModal');
    const searchInput = document.getElementById('userSearchInput');

    if (modal) {
      modal.classList.remove('hidden');
      searchInput?.focus();
      this.showSearchHint();
    }
  },

  /**
   * Ferme le modal de nouvelle conversation
   */
  closeNewConversationModal() {
    const modal = document.getElementById('newConversationModal');
    const searchInput = document.getElementById('userSearchInput');

    if (modal) {
      modal.classList.add('hidden');
      if (searchInput) searchInput.value = '';
      this.showSearchHint();
    }
  },

  /**
   * Affiche le message d'aide pour la recherche
   */
  showSearchHint() {
    const results = document.getElementById('searchResults');
    if (results) {
      results.innerHTML = '<p class="search-hint">Tapez un nom pour rechercher des utilisateurs</p>';
    }
  },

  /**
   * Affiche le chargement de la recherche
   */
  showSearchLoading() {
    const results = document.getElementById('searchResults');
    if (results) {
      results.innerHTML = '<p class="search-loading">Recherche en cours...</p>';
    }
  },

  /**
   * Recherche des utilisateurs par nom
   * @param {string} query - Terme de recherche
   */
  async searchUsers(query) {
    const results = document.getElementById('searchResults');
    if (!results) return;

    try {
      const response = await API.getUsers({ search: query });
      const users = response.users || [];

      // Filtrer l'utilisateur actuel
      const currentUserId = window.currentUser?.id;
      const filteredUsers = users.filter(u => u.id !== currentUserId);

      if (filteredUsers.length === 0) {
        results.innerHTML = '<p class="search-no-results">Aucun utilisateur trouvé</p>';
        return;
      }

      // Afficher les résultats
      results.innerHTML = filteredUsers.map(user => this.createUserResultItem(user)).join('');

      // Ajouter les gestionnaires de clic
      results.querySelectorAll('.user-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const userId = parseInt(item.dataset.userId);
          const user = filteredUsers.find(u => u.id === userId);
          if (user) {
            this.startConversationWithUser(user);
          }
        });
      });
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error);
      results.innerHTML = '<p class="search-no-results">Erreur lors de la recherche</p>';
    }
  },

  /**
   * Crée le HTML d'un résultat de recherche
   * @param {Object} user - Utilisateur
   * @returns {string} HTML
   */
  createUserResultItem(user) {
    const initials = user.nom
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return `
      <div class="user-result-item" data-user-id="${user.id}">
        <div class="user-result-avatar">${initials}</div>
        <div class="user-result-info">
          <div class="user-result-name">${user.nom}</div>
          <div class="user-result-email">${user.email}</div>
        </div>
      </div>
    `;
  },

  /**
   * Démarre une conversation avec un utilisateur sélectionné
   * @param {Object} user - Utilisateur sélectionné
   */
  async startConversationWithUser(user) {
    // Fermer le modal
    this.closeNewConversationModal();

    // Vérifier si l'utilisateur est déjà dans la liste
    const existingItem = document.querySelector(`.conversation-item[data-user-id="${user.id}"]`);

    if (!existingItem) {
      // Ajouter l'utilisateur à la liste des conversations
      const container = document.getElementById('conversationsList');
      if (container) {
        const item = this.createConversationItem(user, null);
        container.insertBefore(item, container.firstChild);

        // Masquer l'état vide si nécessaire
        const emptyState = document.getElementById('conversationsEmpty');
        if (emptyState) {
          emptyState.classList.add('hidden');
        }
      }
    }

    // Sélectionner la conversation
    this.selectConversation(user);

    // Notification
    if (typeof Notifications !== 'undefined') {
      Notifications.success(`Conversation avec ${user.nom} ouverte`);
    }
  }
};

// Initialiser le modal au chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ConversationList.initNewConversationModal();
  });
} else {
  ConversationList.initNewConversationModal();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConversationList;
}