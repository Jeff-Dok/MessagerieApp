/**
 * ============================================
 * MESSAGE REACTIONS SERVICE
 * ============================================
 * 
 * Permet d'ajouter des réactions emoji aux messages
 * 
 * @module services/messageReactions
 * @version 1.0.0
 */

const MessageReactions = {
  // Emojis disponibles pour les réactions
  availableReactions: [
    { emoji: '👍', name: 'thumbs_up', label: 'J\'aime' },
    { emoji: '❤️', name: 'heart', label: 'Cœur' },
    { emoji: '😂', name: 'laugh', label: 'Rire' },
    { emoji: '😮', name: 'wow', label: 'Wow' },
    { emoji: '😢', name: 'sad', label: 'Triste' },
    { emoji: '😡', name: 'angry', label: 'En colère' },
    { emoji: '🎉', name: 'celebrate', label: 'Célébrer' },
    { emoji: '🔥', name: 'fire', label: 'Feu' }
  ],
  
  // Stockage des réactions (devrait être en BD en production)
  reactions: new Map(), // Map<messageId, Map<userId, reactionName>>
  
  /**
   * Ajoute une réaction à un message
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @param {string} reactionName - Nom de la réaction
   * @returns {boolean} Succès
   */
  addReaction(messageId, userId, reactionName) {
    if (!this._isValidReaction(reactionName)) {
      console.error('[Reactions] Réaction invalide:', reactionName);
      return false;
    }
    
    // Créer l'entrée pour ce message si elle n'existe pas
    if (!this.reactions.has(messageId)) {
      this.reactions.set(messageId, new Map());
    }
    
    const messageReactions = this.reactions.get(messageId);
    
    // Si l'utilisateur a déjà cette réaction, la retirer
    if (messageReactions.get(userId) === reactionName) {
      messageReactions.delete(userId);
      console.log('[Reactions] Réaction retirée:', { messageId, userId, reactionName });
    } else {
      // Sinon, ajouter/mettre à jour la réaction
      messageReactions.set(userId, reactionName);
      console.log('[Reactions] Réaction ajoutée:', { messageId, userId, reactionName });
    }
    
    // Émettre via Socket.io
    if (typeof socketManager !== 'undefined') {
      socketManager.socket.emit('reaction:update', {
        messageId,
        userId,
        reactionName,
        timestamp: Date.now()
      });
    }
    
    return true;
  },
  
  /**
   * Retire une réaction
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @returns {boolean} Succès
   */
  removeReaction(messageId, userId) {
    if (!this.reactions.has(messageId)) {
      return false;
    }
    
    const messageReactions = this.reactions.get(messageId);
    const removed = messageReactions.delete(userId);
    
    if (removed) {
      // Émettre via Socket.io
      if (typeof socketManager !== 'undefined') {
        socketManager.socket.emit('reaction:remove', {
          messageId,
          userId,
          timestamp: Date.now()
        });
      }
    }
    
    return removed;
  },
  
  /**
   * Récupère toutes les réactions d'un message
   * @param {number} messageId - ID du message
   * @returns {Object} Réactions groupées
   */
  getMessageReactions(messageId) {
    if (!this.reactions.has(messageId)) {
      return {};
    }
    
    const messageReactions = this.reactions.get(messageId);
    const grouped = {};
    
    // Grouper par type de réaction
    messageReactions.forEach((reactionName, userId) => {
      if (!grouped[reactionName]) {
        grouped[reactionName] = {
          count: 0,
          users: [],
          emoji: this._getReactionEmoji(reactionName)
        };
      }
      
      grouped[reactionName].count++;
      grouped[reactionName].users.push(userId);
    });
    
    return grouped;
  },
  
  /**
   * Récupère la réaction d'un utilisateur sur un message
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @returns {string|null} Nom de la réaction ou null
   */
  getUserReaction(messageId, userId) {
    if (!this.reactions.has(messageId)) {
      return null;
    }
    
    return this.reactions.get(messageId).get(userId) || null;
  },
  
  /**
   * Affiche le sélecteur de réactions sur un message
   * @param {HTMLElement} messageElement - Élément du message
   * @param {number} messageId - ID du message
   * @param {number} currentUserId - ID de l'utilisateur actuel
   */
  showReactionPicker(messageElement, messageId, currentUserId) {
    // Supprimer le picker existant s'il y en a un
    this.hideReactionPicker();
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.id = 'reactionPicker';
    
    // Créer les boutons de réaction
    const reactionsHTML = this.availableReactions.map(reaction => {
      const userReaction = this.getUserReaction(messageId, currentUserId);
      const isActive = userReaction === reaction.name;
      
      return `
        <button 
          class="reaction-btn ${isActive ? 'active' : ''}" 
          data-reaction="${reaction.name}"
          title="${reaction.label}"
          aria-label="${reaction.label}"
        >
          ${reaction.emoji}
        </button>
      `;
    }).join('');
    
    picker.innerHTML = reactionsHTML;
    
    // Positionner le picker
    const rect = messageElement.getBoundingClientRect();
    picker.style.position = 'fixed';
    picker.style.top = `${rect.top - 60}px`;
    picker.style.left = `${rect.left}px`;
    
    document.body.appendChild(picker);
    
    // Ajouter les event listeners
    picker.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const reactionName = e.currentTarget.dataset.reaction;
        this.addReaction(messageId, currentUserId, reactionName);
        this.updateReactionDisplay(messageElement, messageId, currentUserId);
        this.hideReactionPicker();
      });
    });
    
    // Fermer au clic en dehors
    setTimeout(() => {
      document.addEventListener('click', this._closePickerOnClickOutside, true);
    }, 100);
  },
  
  /**
   * Masque le sélecteur de réactions
   */
  hideReactionPicker() {
    const picker = document.getElementById('reactionPicker');
    if (picker) {
      picker.remove();
    }
    
    document.removeEventListener('click', this._closePickerOnClickOutside, true);
  },
  
  /**
   * Ferme le picker au clic en dehors
   */
  _closePickerOnClickOutside(e) {
    const picker = document.getElementById('reactionPicker');
    if (picker && !picker.contains(e.target)) {
      MessageReactions.hideReactionPicker();
    }
  },
  
  /**
   * Met à jour l'affichage des réactions sur un message
   * @param {HTMLElement} messageElement - Élément du message
   * @param {number} messageId - ID du message
   * @param {number} currentUserId - ID de l'utilisateur actuel
   */
  updateReactionDisplay(messageElement, messageId, currentUserId) {
    const reactions = this.getMessageReactions(messageId);
    
    // Supprimer le container existant
    let container = messageElement.querySelector('.message-reactions');
    if (container) {
      container.remove();
    }
    
    // Si pas de réactions, ne rien afficher
    if (Object.keys(reactions).length === 0) {
      return;
    }
    
    // Créer le nouveau container
    container = document.createElement('div');
    container.className = 'message-reactions';
    
    // Créer chaque badge de réaction
    Object.entries(reactions).forEach(([reactionName, data]) => {
      const badge = document.createElement('button');
      badge.className = 'reaction-badge';
      
      // Vérifier si l'utilisateur actuel a cette réaction
      const hasReacted = data.users.includes(currentUserId);
      if (hasReacted) {
        badge.classList.add('active');
      }
      
      badge.innerHTML = `
        <span class="reaction-emoji">${data.emoji}</span>
        <span class="reaction-count">${data.count}</span>
      `;
      
      // Afficher la liste des utilisateurs au survol
      const userNames = data.users.map(userId => 
        this._getUserName(userId)
      ).join(', ');
      
      badge.title = userNames;
      
      // Clic pour ajouter/retirer la réaction
      badge.addEventListener('click', () => {
        this.addReaction(messageId, currentUserId, reactionName);
        this.updateReactionDisplay(messageElement, messageId, currentUserId);
      });
      
      container.appendChild(badge);
    });
    
    // Ajouter le bouton "+"
    const addButton = document.createElement('button');
    addButton.className = 'reaction-add-btn';
    addButton.innerHTML = '+';
    addButton.title = 'Ajouter une réaction';
    addButton.addEventListener('click', () => {
      this.showReactionPicker(messageElement, messageId, currentUserId);
    });
    
    container.appendChild(addButton);
    
    // Ajouter à la bulle de message
    const bubble = messageElement.querySelector('.message-bubble');
    if (bubble) {
      bubble.appendChild(container);
    }
  },
  
  /**
   * Vérifie si une réaction est valide
   */
  _isValidReaction(reactionName) {
    return this.availableReactions.some(r => r.name === reactionName);
  },
  
  /**
   * Récupère l'emoji d'une réaction
   */
  _getReactionEmoji(reactionName) {
    const reaction = this.availableReactions.find(r => r.name === reactionName);
    return reaction ? reaction.emoji : '❓';
  },
  
  /**
   * Récupère le nom d'un utilisateur (à adapter selon votre app)
   */
  _getUserName(userId) {
    // TODO: Récupérer le vrai nom depuis votre système
    if (typeof window.currentUser !== 'undefined' && window.currentUser.id === userId) {
      return 'Vous';
    }
    return `Utilisateur ${userId}`;
  },
  
  /**
   * Injecte les styles CSS
   */
  injectStyles() {
    if (document.getElementById('reactionStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'reactionStyles';
    style.textContent = `
      .reaction-picker {
        background: white;
        border-radius: 24px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        gap: 4px;
        z-index: 1000;
        animation: scaleIn 0.15s ease-out;
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .reaction-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .reaction-btn:hover {
        background: #F3F4F6;
        transform: scale(1.2);
      }
      
      .reaction-btn.active {
        background: #EEF2FF;
        border: 2px solid #4F46E5;
      }
      
      .message-reactions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      
      .reaction-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: #F3F4F6;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .reaction-badge:hover {
        background: #E5E7EB;
        transform: scale(1.05);
      }
      
      .reaction-badge.active {
        background: #EEF2FF;
        border-color: #4F46E5;
        color: #4F46E5;
      }
      
      .reaction-emoji {
        font-size: 16px;
        line-height: 1;
      }
      
      .reaction-count {
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
      }
      
      .reaction-add-btn {
        width: 28px;
        height: 28px;
        border: 1px dashed #D1D5DB;
        background: transparent;
        border-radius: 50%;
        font-size: 18px;
        color: #9CA3AF;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .reaction-add-btn:hover {
        background: #F3F4F6;
        border-color: #9CA3AF;
        color: #6B7280;
        transform: scale(1.1);
      }
    `;
    
    document.head.appendChild(style);
  }
};

// Injecter les styles au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MessageReactions.injectStyles());
} else {
  MessageReactions.injectStyles();
}

// Export global
if (typeof window !== 'undefined') {
  window.MessageReactions = MessageReactions;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageReactions;
}