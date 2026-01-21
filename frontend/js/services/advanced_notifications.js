/**
 * ============================================
 * ADVANCED NOTIFICATIONS SYSTEM
 * ============================================
 * 
 * Système de notifications avancé avec support navigateur,
 * sons, vibrations et persistance
 * 
 * @module services/advancedNotifications
 * @version 1.0.0
 */

const AdvancedNotifications = {
  // Configuration
  config: {
    maxNotifications: 5,
    autoCloseDelay: 5000,
    soundEnabled: true,
    vibrationEnabled: true,
    browserNotificationsEnabled: true,
    persistNotifications: true
  },
  
  // Sons de notification
  sounds: {
    message: '/sounds/message.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3'
  },
  
  // Patterns de vibration
  vibrationPatterns: {
    message: [200, 100, 200],
    success: [100],
    error: [200, 100, 200, 100, 200],
    warning: [100, 50, 100]
  },
  
  // Historique des notifications
  history: [],
  maxHistory: 50,
  
  // Préférences utilisateur (stockées en localStorage)
  userPreferences: null,
  
  /**
   * Initialise le système de notifications
   */
  async init() {
    console.log('[Notifications] Initialisation...');
    
    // Charger les préférences utilisateur
    this.loadPreferences();
    
    // Demander la permission pour les notifications navigateur
    if (this.config.browserNotificationsEnabled) {
      await this.requestBrowserPermission();
    }
    
    // Charger l'historique
    this.loadHistory();
    
    // Créer le container de notifications
    this.createNotificationContainer();
    
    // Injecter les styles
    this.injectStyles();
    
    console.log('[Notifications] Initialisé avec succès');
  },
  
  /**
   * Affiche une notification
   * @param {string} message - Message
   * @param {string} type - Type (success, error, warning, info, message)
   * @param {Object} options - Options
   */
  show(message, type = 'info', options = {}) {
    const notification = {
      id: this._generateId(),
      message,
      type,
      timestamp: Date.now(),
      read: false,
      ...options
    };
    
    // Ajouter à l'historique
    this._addToHistory(notification);
    
    // Afficher la notification toast
    if (!options.silent) {
      this._showToast(notification);
    }
    
    // Notification navigateur
    if (this.config.browserNotificationsEnabled && !document.hasFocus()) {
      this._showBrowserNotification(notification);
    }
    
    // Son
    if (this.config.soundEnabled && !options.silent) {
      this._playSound(type);
    }
    
    // Vibration
    if (this.config.vibrationEnabled && !options.silent) {
      this._vibrate(type);
    }
    
    return notification;
  },
  
  /**
   * Affiche une notification de message
   */
  message(senderName, preview, options = {}) {
    return this.show(`${senderName}: ${preview}`, 'message', {
      title: 'Nouveau message',
      icon: options.avatar || '/images/icons/message.svg',
      action: () => {
        if (options.onClic) options.onClick();
      },
      ...options
    });
  },
  
  /**
   * Affiche une notification de succès
   */
  success(message, options = {}) {
    return this.show(message, 'success', {
      title: 'Succès',
      icon: '/images/icons/check.svg',
      ...options
    });
  },
  
  /**
   * Affiche une notification d'erreur
   */
  error(message, options = {}) {
    return this.show(message, 'error', {
      title: 'Erreur',
      icon: '/images/icons/error.svg',
      autoClose: false,
      ...options
    });
  },
  
  /**
   * Affiche une notification d'avertissement
   */
  warning(message, options = {}) {
    return this.show(message, 'warning', {
      title: 'Attention',
      icon: '/images/icons/warning.svg',
      ...options
    });
  },
  
  /**
   * Affiche une notification d'information
   */
  info(message, options = {}) {
    return this.show(message, 'info', {
      title: 'Information',
      icon: '/images/icons/info.svg',
      ...options
    });
  },
  
  /**
   * Affiche un toast de notification
   */
  _showToast(notification) {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    
    // Limiter le nombre de notifications affichées
    const existingToasts = container.querySelectorAll('.notification-toast');
    if (existingToasts.length >= this.config.maxNotifications) {
      existingToasts[0].remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${notification.type}`;
    toast.id = `notification-${notification.id}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    const icon = this._getNotificationIcon(notification.type);
    
    toast.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
        <div class="notification-message">${this._escapeHtml(notification.message)}</div>
        ${notification.timestamp ? `<div class="notification-time">${this._formatTime(notification.timestamp)}</div>` : ''}
      </div>
      <button class="notification-close" onclick="AdvancedNotifications.closeToast('${notification.id}')" aria-label="Fermer">
        ✕
      </button>
    `;
    
    // Action au clic
    if (notification.action) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', (e) => {
        if (!e.target.classList.contains('notification-close')) {
          notification.action();
          this.closeToast(notification.id);
        }
      });
    }
    
    container.appendChild(toast);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out';
    });
    
    // Auto-fermeture
    if (notification.autoClose !== false) {
      const delay = notification.duration || this.config.autoCloseDelay;
      setTimeout(() => {
        this.closeToast(notification.id);
      }, delay);
    }
  },
  
  /**
   * Ferme un toast
   */
  closeToast(notificationId) {
    const toast = document.getElementById(`notification-${notificationId}`);
    if (!toast) return;
    
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  },
  
  /**
   * Affiche une notification navigateur
   */
  async _showBrowserNotification(notification) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    try {
      const browserNotification = new Notification(notification.title || 'MessagerieApp', {
        body: notification.message,
        icon: notification.icon || '/images/logo.svg',
        badge: '/images/badge.png',
        tag: notification.id,
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false,
        vibrate: this.config.vibrationEnabled ? this.vibrationPatterns[notification.type] : undefined
      });
      
      browserNotification.onclick = () => {
        window.focus();
        if (notification.action) {
          notification.action();
        }
        browserNotification.close();
      };
      
      // Auto-fermeture
      if (notification.autoClose !== false) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.duration || this.config.autoCloseDelay);
      }
    } catch (error) {
      console.error('[Notifications] Erreur notification navigateur:', error);
    }
  },
  
  /**
   * Demande la permission pour les notifications navigateur
   */
  async requestBrowserPermission() {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Notifications navigateur non supportées');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[Notifications] Erreur demande permission:', error);
      return false;
    }
  },
  
  /**
   * Joue un son
   */
  _playSound(type) {
    const soundUrl = this.sounds[type] || this.sounds.message;
    
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.warn('[Notifications] Impossible de jouer le son:', error);
      });
    } catch (error) {
      console.warn('[Notifications] Erreur lecture son:', error);
    }
  },
  
  /**
   * Déclenche une vibration
   */
  _vibrate(type) {
    if (!('vibrate' in navigator)) return;
    
    const pattern = this.vibrationPatterns[type] || this.vibrationPatterns.message;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('[Notifications] Erreur vibration:', error);
    }
  },
  
  /**
   * Ajoute à l'historique
   */
  _addToHistory(notification) {
    this.history.unshift(notification);
    
    // Limiter la taille de l'historique
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
    
    // Persister si activé
    if (this.config.persistNotifications) {
      this.saveHistory();
    }
  },
  
  /**
   * Récupère l'historique des notifications
   */
  getHistory(filter = {}) {
    let filtered = [...this.history];
    
    if (filter.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }
    
    if (filter.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }
    
    return filtered;
  },
  
  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId) {
    const notification = this.history.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveHistory();
    }
  },
  
  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead() {
    this.history.forEach(n => n.read = true);
    this.saveHistory();
  },
  
  /**
   * Compte les notifications non lues
   */
  getUnreadCount() {
    return this.history.filter(n => !n.read).length;
  },
  
  /**
   * Sauvegarde l'historique
   */
  saveHistory() {
    try {
      localStorage.setItem('notificationHistory', JSON.stringify(this.history));
    } catch (error) {
      console.error('[Notifications] Erreur sauvegarde historique:', error);
    }
  },
  
  /**
   * Charge l'historique
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem('notificationHistory');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (error) {
      console.error('[Notifications] Erreur chargement historique:', error);
    }
  },
  
  /**
   * Vide l'historique
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
  },
  
  /**
   * Charge les préférences utilisateur
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        this.userPreferences = JSON.parse(saved);
        Object.assign(this.config, this.userPreferences);
      }
    } catch (error) {
      console.error('[Notifications] Erreur chargement préférences:', error);
    }
  },
  
  /**
   * Sauvegarde les préférences
   */
  savePreferences(preferences) {
    try {
      Object.assign(this.config, preferences);
      localStorage.setItem('notificationPreferences', JSON.stringify(this.config));
    } catch (error) {
      console.error('[Notifications] Erreur sauvegarde préférences:', error);
    }
  },
  
  /**
   * Crée le container de notifications
   */
  createNotificationContainer() {
    let container = document.getElementById('notificationsContainer');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationsContainer';
      container.className = 'notifications-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }
  },
  
  /**
   * Récupère l'icône pour un type de notification
   */
  _getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      message: '💬'
    };
    
    return icons[type] || icons.info;
  },
  
  /**
   * Génère un ID unique
   */
  _generateId() {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Échappe le HTML
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  /**
   * Formate un timestamp
   */
  _formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return 'À l\'instant';
    } else if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `Il y a ${mins} min`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Il y a ${hours}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  },
  
  /**
   * Injecte les styles CSS
   */
  injectStyles() {
    if (document.getElementById('advancedNotificationStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'advancedNotificationStyles';
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
        pointer-events: none;
      }
      
      .notification-toast {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-left: 4px solid;
        pointer-events: auto;
      }
      
      .notification-success { border-left-color: #10B981; }
      .notification-error { border-left-color: #EF4444; }
      .notification-warning { border-left-color: #F59E0B; }
      .notification-info { border-left-color: #3B82F6; }
      .notification-message { border-left-color: #8B5CF6; }
      
      .notification-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
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
      
      .notification-time {
        font-size: 12px;
        color: #9CA3AF;
        margin-top: 4px;
      }
      
      .notification-close {
        flex-shrink: 0;
        cursor: pointer;
        color: #9CA3AF;
        background: none;
        border: none;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        font-size: 16px;
        line-height: 1;
      }
      
      .notification-close:hover {
        background-color: #F3F4F6;
        color: #374151;
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
      
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
};

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdvancedNotifications.init());
} else {
  AdvancedNotifications.init();
}

// Export global
if (typeof window !== 'undefined') {
  window.AdvancedNotifications = AdvancedNotifications;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedNotifications;
}