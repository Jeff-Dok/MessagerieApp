/**
 * ============================================
 * NOTIFICATIONS - Système de notifications
 * ============================================
 * 
 * Gère l'affichage des notifications toast et navigateur
 * 
 * @module ui/notifications
 * @author MessagerieApp
 * @version 2.0.0
 */

const Notifications = {
  /**
   * Initialise le système de notifications
   */
  init() {
    // Demander la permission pour les notifications navigateur
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Créer le container de notifications si nécessaire
    this.ensureContainer();
  },

  /**
   * S'assure que le container de notifications existe
   */
  ensureContainer() {
    let container = document.getElementById('notificationsContainer');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationsContainer';
      container.className = 'notifications-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);

      // Ajouter les styles
      this.injectStyles();
    }
  },

  /**
   * Injecte les styles CSS pour les notifications
   */
  injectStyles() {
    if (document.getElementById('notificationStyles')) return;

    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
      .notifications-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .notification-toast {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid;
      }

      .notification-toast.success {
        border-left-color: #10B981;
      }

      .notification-toast.error {
        border-left-color: #EF4444;
      }

      .notification-toast.warning {
        border-left-color: #F59E0B;
      }

      .notification-toast.info {
        border-left-color: #3B82F6;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .notification-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
      }

      .notification-content {
        flex: 1;
      }

      .notification-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
        color: #1F2937;
      }

      .notification-message {
        font-size: 14px;
        color: #6B7280;
        line-height: 1.5;
      }

      .notification-close {
        flex-shrink: 0;
        cursor: pointer;
        color: #9CA3AF;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .notification-close:hover {
        background-color: #F3F4F6;
        color: #374151;
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Affiche une notification toast
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning, info)
   * @param {Object} options - Options additionnelles
   */
  show(message, type = 'info', options = {}) {
    const {
      title = '',
      duration = 5000,
      closable = true
    } = options;

    this.ensureContainer();

    const container = document.getElementById('notificationsContainer');
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.setAttribute('role', 'alert');

    // Icône
    const icon = this.getIcon(type);
    toast.appendChild(icon);

    // Contenu
    const content = document.createElement('div');
    content.className = 'notification-content';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'notification-title';
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'notification-message';
    messageEl.textContent = message;
    content.appendChild(messageEl);

    toast.appendChild(content);

    // Bouton de fermeture
    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'notification-close';
      closeBtn.innerHTML = '✕';
      closeBtn.setAttribute('aria-label', 'Fermer');
      closeBtn.addEventListener('click', () => this.remove(toast));
      toast.appendChild(closeBtn);
    }

    container.appendChild(toast);

    // Auto-suppression
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  },

  /**
   * Affiche une notification de succès
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  success(message, options = {}) {
    return this.show(message, 'success', { title: 'Succès', ...options });
  },

  /**
   * Affiche une notification d'erreur
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  error(message, options = {}) {
    return this.show(message, 'error', { title: 'Erreur', ...options });
  },

  /**
   * Affiche une notification d'avertissement
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', { title: 'Attention', ...options });
  },

  /**
   * Affiche une notification d'information
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  info(message, options = {}) {
    return this.show(message, 'info', { title: 'Information', ...options });
  },

  /**
   * Retire une notification du DOM
   * @param {HTMLElement} toast - Élément toast à retirer
   */
  remove(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  /**
   * Retourne l'icône appropriée pour le type
   * @param {string} type - Type de notification
   * @returns {HTMLElement} Élément icône
   */
  getIcon(type) {
    const icon = document.createElement('div');
    icon.className = 'notification-icon';

    const colors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6'
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    icon.style.color = colors[type];
    icon.style.fontSize = '20px';
    icon.style.fontWeight = 'bold';
    icon.textContent = icons[type];

    return icon;
  },

  /**
   * Affiche une notification navigateur
   * @param {string} title - Titre
   * @param {string} body - Corps du message
   * @param {Object} options - Options
   */
  browser(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/images/logo.svg',
        ...options
      });
    }
  },

  /**
   * Notification de nouveau message
   * @param {string} senderName - Nom de l'expéditeur
   * @param {string} preview - Aperçu du message
   */
  newMessage(senderName, preview) {
    this.info(`${senderName} : ${preview}`, {
      title: 'Nouveau message',
      duration: 4000
    });

    this.browser('Nouveau message', `${senderName} : ${preview}`);
  }
};

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Notifications.init());
} else {
  Notifications.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Notifications;
}