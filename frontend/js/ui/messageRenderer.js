/**
 * ============================================
 * MESSAGE RENDERER - Rendu des messages
 * ============================================
 * 
 * Gère l'affichage et le rendu des messages dans l'interface
 * 
 * @module ui/messageRenderer
 * @author MessagerieApp
 * @version 2.0.0
 */

// Set pour tracker les images déjà notifiées comme expirées (évite les appels multiples)
const notifiedExpiredImages = new Set();

// Map pour stocker les intervalles de timer actifs (permet de les annuler lors du changement de conversation)
const activeTimers = new Map();

const MessageRenderer = {
  /**
   * Affiche une liste de messages dans le DOM
   * @param {Array} messages - Liste des messages à afficher
   * @param {number} currentUserId - ID de l'utilisateur actuel
   */
  displayMessages(messages, currentUserId) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    // Nettoyer les timers actifs avant de réafficher les messages
    this.clearAllTimers();

    messagesList.innerHTML = '';

    // Inverser l'ordre pour afficher du plus ancien au plus récent
    const sortedMessages = [...messages].reverse();

    // Compter les messages non lus (messages reçus par currentUserId qui ne sont pas lus)
    const unreadMessages = sortedMessages.filter(msg =>
      msg.receiverId === currentUserId && !msg.read
    );
    const unreadCount = unreadMessages.length;

    // Trouver l'index du premier message non lu
    let firstUnreadIndex = -1;
    if (unreadCount > 0) {
      firstUnreadIndex = sortedMessages.findIndex(msg =>
        msg.receiverId === currentUserId && !msg.read
      );
    }

    sortedMessages.forEach((message, index) => {
      // Ajouter le séparateur avant le premier message non lu
      if (index === firstUnreadIndex) {
        this.addUnreadSeparator(messagesList, unreadCount);
      }
      this.addMessageToList(message, currentUserId, messagesList);
    });

    // Scroll automatique vers le bas
    this.scrollToBottom();
  },

  /**
   * Ajoute un séparateur "Nouveaux Messages" dans la liste
   * @param {HTMLElement} container - Container où ajouter le séparateur
   * @param {number} count - Nombre de messages non lus
   */
  addUnreadSeparator(container, count) {
    const separator = document.createElement('div');
    separator.className = 'unread-separator';
    separator.innerHTML = `
      <div class="unread-separator-line"></div>
      <span class="unread-separator-text">${count > 1 ? `${count} Nouveaux Messages` : 'Nouveau Message'}</span>
      <div class="unread-separator-line"></div>
    `;
    container.appendChild(separator);
  },

  /**
   * Nettoie tous les timers actifs
   */
  clearAllTimers() {
    activeTimers.forEach((intervalId, messageId) => {
      clearInterval(intervalId);
    });
    activeTimers.clear();
    console.log('[MessageRenderer] Tous les timers ont été nettoyés');
  },

  /**
   * Ajoute un message au DOM
   * @param {Object} message - Message à ajouter
   * @param {number} currentUserId - ID de l'utilisateur actuel
   */
  addMessage(message, currentUserId) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    this.addMessageToList(message, currentUserId, messagesList);

    // Scroll vers le bas après ajout
    this.scrollToBottom();
  },

  /**
   * Ajoute un message à une liste spécifique
   * @param {Object} message - Message à ajouter
   * @param {number} currentUserId - ID de l'utilisateur actuel
   * @param {HTMLElement} container - Container où ajouter le message
   */
  addMessageToList(message, currentUserId, container) {
    const messageElement = this.createMessageElement(message, currentUserId);
    container.appendChild(messageElement);
  },

  /**
   * Crée l'élément DOM d'un message
   * @param {Object} message - Données du message
   * @param {number} currentUserId - ID de l'utilisateur actuel
   * @returns {HTMLElement} Élément DOM du message
   */
  createMessageElement(message, currentUserId) {
    const isOwn = message.senderId === currentUserId;
    const sender = message.sender || { nom: 'Utilisateur' };

    // Container principal du message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    messageDiv.dataset.messageId = message.id;

    // Bulle de message
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // Nom de l'expéditeur
    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = sender.nom;
    bubbleDiv.appendChild(senderDiv);

    // Contenu du message
    if (message.messageType === 'image') {
      const imageContent = this.createImageContent(message, currentUserId);
      bubbleDiv.appendChild(imageContent);
    } else if (message.decryptionFailed) {
      // Message E2E non déchiffrable (clés perdues/changées)
      const encryptedDiv = document.createElement('div');
      encryptedDiv.className = 'message-encrypted-failed';
      encryptedDiv.innerHTML = `
        <div class="encrypted-icon">🔐</div>
        <div class="encrypted-text">Message chiffré</div>
        <div class="encrypted-subtitle">Impossible de déchiffrer (clés non disponibles)</div>
      `;
      bubbleDiv.appendChild(encryptedDiv);
    } else {
      const textDiv = document.createElement('div');
      textDiv.className = 'message-text';
      textDiv.textContent = message.content;
      bubbleDiv.appendChild(textDiv);
    }

    // Heure du message
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = this.formatTime(message.date);
    bubbleDiv.appendChild(timeDiv);

    messageDiv.appendChild(bubbleDiv);
    return messageDiv;
  },

  /**
   * Crée le contenu d'une image dans un message
   * @param {Object} message - Message contenant l'image
   * @param {number} currentUserId - ID de l'utilisateur actuel
   * @returns {HTMLElement} Container de l'image
   */
  createImageContent(message, currentUserId) {
    const container = document.createElement('div');

    // Vérifier si l'image est expirée
    if (message.imageExpired || !message.imageData) {
      container.className = 'message-expired';
      container.innerHTML = `
        <div class="expired-icon">🔒</div>
        <div class="expired-text">Image expirée</div>
        <div class="expired-subtitle">Cette image n'est plus disponible</div>
      `;
      return container;
    }

    // Image active
    container.className = 'message-image-container';
    container.dataset.messageId = message.id;
    container.setAttribute('oncontextmenu', 'return false');

    // Canvas pour afficher l'image de manière sécurisée
    const canvas = document.createElement('canvas');
    canvas.className = 'message-image-canvas';
    canvas.dataset.image = message.imageData;
    container.appendChild(canvas);

    // Overlay avec informations
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    const filename = document.createElement('span');
    filename.className = 'image-filename';
    filename.textContent = message.imageFileName || 'Image';
    overlay.appendChild(filename);

    // Timer d'expiration sur l'image (visible pour sender et receiver)
    const timer = document.createElement('div');
    timer.className = 'image-timer-badge';
    timer.id = `timer-${message.id}`;
    container.appendChild(timer);

    // Si l'image a été vue, afficher le timer
    if (message.imageViewedAt && message.imageExpiresAt) {
      // Utiliser setTimeout pour s'assurer que l'élément est dans le DOM avant de démarrer le timer
      const messageId = message.id;
      const expiresAt = message.imageExpiresAt;
      setTimeout(() => {
        this.startImageTimer(messageId, expiresAt);
      }, 0);
    } else if (message.receiverId === currentUserId) {
      // Badge "Nouvelle" seulement si pas encore vue ET c'est le receiver
      timer.textContent = '🆕 Nouvelle';
      timer.style.background = 'linear-gradient(135deg, #8B5CF6, #6366F1)';
    } else {
      // Sender: image pas encore vue
      timer.textContent = '👁️ Non vue';
      timer.style.background = 'linear-gradient(135deg, #6B7280, #4B5563)';
    }

    container.appendChild(overlay);

    // Rendre l'image sur le canvas
    this.renderSecureImage(canvas, message.imageData);

    // Ajouter le gestionnaire de clic sur le container pour afficher en grand
    container.style.cursor = 'pointer';
    container.addEventListener('click', () => {
      // Vérifier si l'image est expirée avant d'ouvrir le modal
      if (container.classList.contains('image-expired') || notifiedExpiredImages.has(String(message.id))) {
        console.log('[MessageRenderer] Image expirée, ouverture du modal bloquée');
        return;
      }
      // Ouvrir le modal avec l'image
      this.showImageModal(message, currentUserId);
    });

    return container;
  },

  /**
   * Rend une image de manière sécurisée sur un canvas
   * @param {HTMLCanvasElement} canvas - Canvas où rendre l'image
   * @param {string} imageDataUrl - Data URL de l'image
   */
  renderSecureImage(canvas, imageDataUrl) {
    const img = new Image();
    
    img.onload = function() {
      const ctx = canvas.getContext('2d');
      
      // Définir les dimensions
      const maxWidth = 300;
      const maxHeight = 300;
      let width = img.width;
      let height = img.height;
      
      // Redimensionner proportionnellement
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dessiner l'image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Ajouter un filigrane invisible
      ctx.globalAlpha = 0.05;
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('MessagerieApp - Protégé', width / 2, height / 2);
      ctx.globalAlpha = 1;
    };
    
    img.src = imageDataUrl;
  },

  /**
   * Marque une image comme vue et démarre le timer
   * @param {number} messageId - ID du message
   * @param {HTMLElement} container - Container de l'image
   */
  async markImageAsViewed(messageId, container) {
    try {
      const response = await API.markImageAsViewed(messageId);
      if (response.success) {
        console.log(`Image ${messageId} vue, expiration dans 5 minutes`);

        // Retirer le badge "Nouvelle" si container fourni
        if (container) {
          const badge = container.querySelector('.image-new-badge');
          if (badge) {
            badge.remove();
          }
        }

        return response; // Retourner la réponse avec expiresAt
      }
      return null;
    } catch (error) {
      console.error('Erreur markImageAsViewed:', error);
      return null;
    }
  },

  /**
   * Démarre le compte à rebours d'expiration d'une image
   * @param {number} messageId - ID du message
   * @param {string} expiresAt - Date d'expiration ISO
   * @param {HTMLElement} container - Container de l'image
   */
  startExpirationTimer(messageId, expiresAt, container) {
    const timerElement = container.querySelector('.expiration-timer');
    if (!timerElement) return;

    const expirationDate = new Date(expiresAt);
    
    const updateTimer = () => {
      const now = new Date();
      const timeLeft = expirationDate - now;
      
      if (timeLeft <= 0) {
        this.expireImageInUI(messageId, container);
        clearInterval(interval);
        return;
      }
      
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      
      timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      timerElement.style.color = timeLeft < 60000 ? '#EF4444' : '#F59E0B';
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
  },

  /**
   * Fait expirer une image dans l'interface
   * @param {number} messageId - ID du message
   * @param {HTMLElement} container - Container de l'image
   */
  expireImageInUI(messageId, container) {
    // Marquer le container comme expiré pour bloquer les clics
    container.classList.add('image-expired');
    container.style.cursor = 'default';

    container.innerHTML = `
      <div class="message-expired">
        <div class="expired-icon">🔒</div>
        <div class="expired-text">Image expirée</div>
        <div class="expired-subtitle">Cette image n'est plus disponible</div>
      </div>
    `;

    console.log(`Image ${messageId} expirée dans l'UI`);
  },

  /**
   * Formate une date en heure locale
   * @param {string|Date} date - Date à formater
   * @returns {string} Heure formatée
   */
  formatTime(date) {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Scroll automatique vers le bas de la liste de messages
   */
  scrollToBottom() {
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
      messagesList.scrollTop = messagesList.scrollHeight;
    }
  },

  /**
   * Efface tous les messages affichés
   */
  clearMessages() {
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
      messagesList.innerHTML = '';
    }
  },

  /**
   * Affiche une image en mode plein écran dans un modal
   * @param {Object} message - Message complet contenant l'image
   * @param {number} currentUserId - ID de l'utilisateur actuel
   */
  showImageModal(message, currentUserId) {
    // Vérifier si l'image est expirée
    if (message.imageExpired || notifiedExpiredImages.has(String(message.id))) {
      console.log('[MessageRenderer] Image expirée, modal non ouvert');
      return;
    }

    // Supprimer le modal existant s'il y en a un
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
      existingModal.remove();
    }

    const isReceiver = message.receiverId === currentUserId;

    // Créer le modal
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal';
    modal.dataset.messageId = message.id;
    // Désactiver le clic droit sur le modal
    modal.setAttribute('oncontextmenu', 'return false');
    modal.innerHTML = `
      <div class="image-modal-overlay"></div>
      <div class="image-modal-content">
        <button class="image-modal-close" aria-label="Fermer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="image-modal-header">
          <span class="image-modal-filename">${message.imageFileName || 'Image'}</span>
          <div class="image-modal-timer" id="modalTimer">⏱️ 5:00</div>
        </div>
        <div class="image-modal-body">
          <img src="${message.imageData}" alt="${message.imageFileName || 'Image'}" class="image-modal-img" oncontextmenu="return false">
        </div>
      </div>
    `;

    // Ajouter au document
    document.body.appendChild(modal);

    // Animation d'entrée
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);

    // Marquer comme vue si c'est le destinataire et pas encore vue
    if (isReceiver && !message.imageViewedAt) {
      this.markImageAsViewed(message.id, null).then((response) => {
        if (response && response.expiresAt) {
          // Mettre à jour l'objet message avec les nouvelles valeurs
          message.imageViewedAt = response.viewedAt || new Date().toISOString();
          message.imageExpiresAt = response.expiresAt;

          // Démarrer le compte à rebours avec la date d'expiration du serveur
          this.startModalTimer(response.expiresAt, modal);

          // Démarrer aussi le timer sur l'image dans la conversation
          this.startImageTimer(message.id, response.expiresAt);
        }
      });
    } else if (message.imageViewedAt) {
      // L'image a déjà été vue, calculer dynamiquement l'expiration
      // à partir de imageViewedAt + 5 minutes pour éviter les problèmes de timezone
      const viewedDate = new Date(message.imageViewedAt);
      const calculatedExpiration = new Date(viewedDate.getTime() + 5 * 60 * 1000);

      this.startModalTimer(calculatedExpiration.toISOString(), modal);
    }

    // Gestionnaires d'événements
    const closeBtn = modal.querySelector('.image-modal-close');
    const overlay = modal.querySelector('.image-modal-overlay');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Fermer avec la touche Échap
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  },

  /**
   * Démarre le compte à rebours dans le modal
   * @param {string} expiresAt - Date d'expiration ISO
   * @param {HTMLElement} modal - Modal contenant le timer
   */
  startModalTimer(expiresAt, modal) {
    const timerElement = modal.querySelector('#modalTimer');
    if (!timerElement) return;

    const expirationDate = new Date(expiresAt);
    const messageId = modal.dataset.messageId;
    let hasExpired = false;

    const updateTimer = () => {
      const now = new Date();
      const timeLeft = expirationDate - now;

      if (timeLeft <= 0) {
        timerElement.textContent = '⏱️ 0:00';
        timerElement.style.color = '#EF4444';

        // Éviter les appels multiples
        if (!hasExpired) {
          hasExpired = true;
          // Expirer l'image dans la liste des messages
          this.expireImageById(messageId);
          // Notifier le serveur et l'autre utilisateur
          this.notifyImageExpired(messageId);
        }

        // Fermer le modal
        const closeBtn = modal.querySelector('.image-modal-close');
        if (closeBtn) closeBtn.click();
        return;
      }

      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const formatted = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;

      timerElement.textContent = formatted;

      // Changer la couleur selon le temps restant
      if (timeLeft <= 30000) {
        timerElement.style.color = '#EF4444'; // Rouge
      } else if (timeLeft <= 60000) {
        timerElement.style.color = '#F59E0B'; // Orange
      } else {
        timerElement.style.color = 'white';
      }

      setTimeout(updateTimer, 1000);
    };

    updateTimer();
  },

  /**
   * Expire une image par son ID de message (affiche "Image expirée")
   * @param {number|string} messageId - ID du message
   */
  expireImageById(messageId) {
    // Marquer comme notifiée pour éviter les appels API en double
    notifiedExpiredImages.add(String(messageId));

    // Trouver le container de l'image et afficher "Image expirée"
    const container = document.querySelector(`.message-image-container[data-message-id="${messageId}"]`);
    if (container) {
      this.expireImageInUI(messageId, container);
      console.log(`[MessageRenderer] Image ${messageId} marquée comme expirée`);
    }
  },

  /**
   * Supprime un message du DOM par son ID
   * @param {number|string} messageId - ID du message
   */
  removeMessageById(messageId) {
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
      console.log(`[MessageRenderer] Message ${messageId} supprimé du DOM`);
    }
  },

  /**
   * Démarre le compte à rebours sur l'image dans la conversation
   * @param {number|string} messageId - ID du message
   * @param {string} expiresAt - Date d'expiration ISO
   */
  startImageTimer(messageId, expiresAt) {
    const msgId = String(messageId);

    // Si un timer existe déjà pour ce message, le nettoyer d'abord
    if (activeTimers.has(msgId)) {
      clearInterval(activeTimers.get(msgId));
      activeTimers.delete(msgId);
    }

    const timerElement = document.getElementById(`timer-${messageId}`);
    if (!timerElement) {
      console.warn(`[MessageRenderer] Timer element not found for message ${messageId}`);
      return;
    }

    const expirationDate = new Date(expiresAt);
    let hasExpired = false;

    const updateTimer = () => {
      // Vérifier si l'élément existe encore dans le DOM
      const currentElement = document.getElementById(`timer-${messageId}`);
      if (!currentElement) {
        // L'élément n'existe plus, arrêter le timer
        if (activeTimers.has(msgId)) {
          clearInterval(activeTimers.get(msgId));
          activeTimers.delete(msgId);
        }
        return;
      }

      const now = new Date();
      const timeLeft = expirationDate - now;

      if (timeLeft <= 0) {
        currentElement.textContent = '⏱️ 0:00';
        currentElement.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';

        // Arrêter l'intervalle
        if (activeTimers.has(msgId)) {
          clearInterval(activeTimers.get(msgId));
          activeTimers.delete(msgId);
        }

        // Éviter les appels multiples
        if (!hasExpired) {
          hasExpired = true;
          // Marquer l'image comme expirée localement
          this.expireImageById(messageId);
          // Appeler l'API pour notifier le serveur et l'autre utilisateur
          this.notifyImageExpired(messageId);
        }
        return;
      }

      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      currentElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Changer la couleur selon le temps restant
      if (timeLeft <= 30000) {
        currentElement.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)'; // Rouge
      } else if (timeLeft <= 60000) {
        currentElement.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)'; // Orange
      } else {
        currentElement.style.background = 'linear-gradient(135deg, #10B981, #059669)'; // Vert
      }
    };

    // Exécuter immédiatement, puis toutes les secondes
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    activeTimers.set(msgId, intervalId);

    console.log(`[MessageRenderer] Timer démarré pour image ${messageId}`);
  },

  /**
   * Notifie le serveur qu'une image a expiré (pour synchroniser les deux utilisateurs)
   * @param {number|string} messageId - ID du message
   */
  async notifyImageExpired(messageId) {
    // Éviter les appels multiples pour la même image
    const msgId = String(messageId);
    if (notifiedExpiredImages.has(msgId)) {
      console.log(`[MessageRenderer] Image ${messageId} déjà notifiée, ignoré`);
      return;
    }

    // Marquer comme notifiée immédiatement pour éviter les doublons
    notifiedExpiredImages.add(msgId);

    try {
      // Appeler l'API pour expirer l'image côté serveur
      // Cela enverra une notification socket à l'autre utilisateur
      if (typeof API !== 'undefined' && API.expireImage) {
        await API.expireImage(messageId);
        console.log(`[MessageRenderer] Notification d'expiration envoyée pour image ${messageId}`);
      }
    } catch (error) {
      // Ignorer les erreurs (l'image peut déjà être expirée)
      console.log(`[MessageRenderer] L'image ${messageId} était peut-être déjà expirée`);
    }
  },

  /**
   * Met à jour le badge d'une image quand elle est vue (pour le sender)
   * @param {number|string} messageId - ID du message
   * @param {string} expiresAt - Date d'expiration ISO
   */
  updateImageViewedStatus(messageId, expiresAt) {
    const timerElement = document.getElementById(`timer-${messageId}`);
    if (timerElement) {
      // Démarrer le timer
      this.startImageTimer(messageId, expiresAt);
    }
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageRenderer;
}