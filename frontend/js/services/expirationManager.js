/**
 * ============================================
 * EXPIRATION MANAGER - Gestionnaire d'expiration
 * ============================================
 * 
 * Gère l'expiration automatique des images après visualisation
 * 
 * Fonctionnalités:
 * - Compte à rebours visuel
 * - Expiration automatique après 5 minutes
 * - Synchronisation avec le backend
 * - Notifications d'expiration
 * - Gestion de plusieurs timers simultanés
 * 
 * @module services/expirationManager
 * @author MessagerieApp
 * @version 2.0.0
 */

/**
 * Configuration de l'expiration
 */
const EXPIRATION_CONFIG = {
  EXPIRATION_TIME: 5 * 60 * 1000, // 5 minutes en millisecondes
  UPDATE_INTERVAL: 1000, // Mise à jour toutes les secondes
  WARNING_THRESHOLD: 60 * 1000, // Avertissement à 1 minute
  CRITICAL_THRESHOLD: 30 * 1000 // Critique à 30 secondes
};

/**
 * Gestionnaire d'expiration des images
 */
class ExpirationManager {
  /**
   * Constructeur
   */
  constructor() {
    this.timers = new Map(); // Map<messageId, timerData>
    this.updateInterval = null;
  }

  // ==========================================
  // GESTION DES TIMERS
  // ==========================================

  /**
   * Démarre un timer d'expiration pour une image
   * @param {number} messageId - ID du message
   * @param {string} expiresAt - Date d'expiration ISO
   * @param {HTMLElement} container - Container de l'image
   * @param {Function} onExpired - Callback appelé à l'expiration
   */
  startTimer(messageId, expiresAt, container, onExpired = null) {
    // Arrêter le timer existant s'il y en a un
    this.stopTimer(messageId);

    const expirationDate = new Date(expiresAt);
    const now = new Date();

    // Vérifier si déjà expiré
    if (expirationDate <= now) {
      this._handleExpiration(messageId, container, onExpired);
      return;
    }

    // Créer l'élément timer s'il n'existe pas
    let timerElement = container.querySelector('.expiration-timer');
    if (!timerElement) {
      timerElement = this._createTimerElement();
      container.appendChild(timerElement);
    }

    // Enregistrer le timer
    const timerData = {
      messageId,
      expiresAt: expirationDate,
      container,
      timerElement,
      onExpired,
      intervalId: null
    };

    this.timers.set(messageId, timerData);

    // Démarrer la mise à jour
    this._updateTimer(messageId);
    
    // Planifier les mises à jour régulières
    timerData.intervalId = setInterval(() => {
      this._updateTimer(messageId);
    }, EXPIRATION_CONFIG.UPDATE_INTERVAL);

    console.log(`[ExpirationManager] Timer démarré pour message ${messageId}`);
  }

  /**
   * Arrête un timer d'expiration
   * @param {number} messageId - ID du message
   */
  stopTimer(messageId) {
    const timerData = this.timers.get(messageId);
    if (!timerData) return;

    // Arrêter l'interval
    if (timerData.intervalId) {
      clearInterval(timerData.intervalId);
    }

    // Retirer du Map
    this.timers.delete(messageId);

    console.log(`[ExpirationManager] Timer arrêté pour message ${messageId}`);
  }

  /**
   * Arrête tous les timers
   */
  stopAllTimers() {
    this.timers.forEach((timerData, messageId) => {
      if (timerData.intervalId) {
        clearInterval(timerData.intervalId);
      }
    });

    this.timers.clear();
    console.log('[ExpirationManager] Tous les timers arrêtés');
  }

  /**
   * Obtient le temps restant pour un message
   * @param {number} messageId - ID du message
   * @returns {Object|null} Temps restant {minutes, seconds, total}
   */
  getTimeRemaining(messageId) {
    const timerData = this.timers.get(messageId);
    if (!timerData) return null;

    return this._calculateTimeRemaining(timerData.expiresAt);
  }

  // ==========================================
  // MISE À JOUR DES TIMERS
  // ==========================================

  /**
   * Met à jour l'affichage d'un timer
   * @param {number} messageId - ID du message
   * @private
   */
  _updateTimer(messageId) {
    const timerData = this.timers.get(messageId);
    if (!timerData) return;

    const timeRemaining = this._calculateTimeRemaining(timerData.expiresAt);

    // Vérifier si expiré
    if (timeRemaining.total <= 0) {
      this._handleExpiration(messageId, timerData.container, timerData.onExpired);
      return;
    }

    // Mettre à jour l'affichage
    this._updateTimerDisplay(timerData.timerElement, timeRemaining);
  }

  /**
   * Calcule le temps restant jusqu'à expiration
   * @param {Date} expiresAt - Date d'expiration
   * @returns {Object} Temps restant
   * @private
   */
  _calculateTimeRemaining(expiresAt) {
    const now = new Date();
    const total = expiresAt - now;

    if (total <= 0) {
      return { minutes: 0, seconds: 0, total: 0 };
    }

    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);

    return { minutes, seconds, total };
  }

  /**
   * Met à jour l'affichage du timer
   * @param {HTMLElement} timerElement - Élément timer
   * @param {Object} timeRemaining - Temps restant
   * @private
   */
  _updateTimerDisplay(timerElement, timeRemaining) {
    const { minutes, seconds, total } = timeRemaining;

    // Formater l'affichage
    const formatted = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerElement.textContent = formatted;

    // Changer la couleur selon le temps restant
    if (total <= EXPIRATION_CONFIG.CRITICAL_THRESHOLD) {
      timerElement.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'; // Rouge
      timerElement.classList.add('critical');
    } else if (total <= EXPIRATION_CONFIG.WARNING_THRESHOLD) {
      timerElement.style.backgroundColor = 'rgba(245, 158, 11, 0.9)'; // Orange
      timerElement.classList.add('warning');
    } else {
      timerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Noir
      timerElement.classList.remove('warning', 'critical');
    }

    // Animation de pulsation si critique
    if (total <= EXPIRATION_CONFIG.CRITICAL_THRESHOLD) {
      timerElement.style.animation = 'pulse 1s infinite';
    } else {
      timerElement.style.animation = 'none';
    }
  }

  // ==========================================
  // GESTION DE L'EXPIRATION
  // ==========================================

  /**
   * Gère l'expiration d'une image
   * @param {number} messageId - ID du message
   * @param {HTMLElement} container - Container de l'image
   * @param {Function} onExpired - Callback d'expiration
   * @private
   */
  async _handleExpiration(messageId, container, onExpired) {
    console.log(`[ExpirationManager] Image ${messageId} expirée`);

    // Arrêter le timer
    this.stopTimer(messageId);

    // Afficher l'image expirée
    this._displayExpiredImage(container);

    // Notifier le backend
    try {
      if (typeof API !== 'undefined') {
        await API.expireImage(messageId);
      }
    } catch (error) {
      console.error('Erreur lors de la notification d\'expiration:', error);
    }

    // Callback personnalisé
    if (onExpired && typeof onExpired === 'function') {
      try {
        onExpired(messageId);
      } catch (error) {
        console.error('Erreur dans le callback onExpired:', error);
      }
    }

    // Notification utilisateur
    if (typeof Notifications !== 'undefined') {
      Notifications.warning('Une image a expiré', {
        duration: 3000
      });
    }
  }

  /**
   * Affiche le placeholder d'image expirée
   * @param {HTMLElement} container - Container de l'image
   * @private
   */
  _displayExpiredImage(container) {
    container.innerHTML = `
      <div class="message-expired" role="status" aria-live="polite">
        <div class="expired-icon">🔒</div>
        <div class="expired-text">Image expirée</div>
        <div class="expired-subtitle">Cette image n'est plus disponible</div>
      </div>
    `;

    // Ajouter l'animation d'entrée
    const expiredDiv = container.querySelector('.message-expired');
    if (expiredDiv) {
      expiredDiv.style.animation = 'fadeIn 0.3s ease-out';
    }
  }

  // ==========================================
  // CRÉATION D'ÉLÉMENTS
  // ==========================================

  /**
   * Crée un élément timer
   * @returns {HTMLElement} Élément timer
   * @private
   */
  _createTimerElement() {
    const timer = document.createElement('div');
    timer.className = 'expiration-timer';
    timer.setAttribute('role', 'timer');
    timer.setAttribute('aria-live', 'polite');
    
    // Styles inline
    timer.style.position = 'absolute';
    timer.style.top = '8px';
    timer.style.right = '8px';
    timer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timer.style.color = 'white';
    timer.style.padding = '4px 12px';
    timer.style.borderRadius = '16px';
    timer.style.fontSize = '12px';
    timer.style.fontWeight = '600';
    timer.style.fontFamily = 'monospace';
    timer.style.zIndex = '10';
    timer.style.transition = 'background-color 0.3s ease';
    
    return timer;
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Obtient le nombre de timers actifs
   * @returns {number} Nombre de timers
   */
  getActiveTimersCount() {
    return this.timers.size;
  }

  /**
   * Obtient tous les timers actifs
   * @returns {Array} Liste des timers
   */
  getActiveTimers() {
    return Array.from(this.timers.entries()).map(([messageId, data]) => ({
      messageId,
      expiresAt: data.expiresAt,
      timeRemaining: this._calculateTimeRemaining(data.expiresAt)
    }));
  }

  /**
   * Formate une durée en texte lisible
   * @param {number} milliseconds - Durée en millisecondes
   * @returns {string} Durée formatée
   */
  formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes} min ${seconds} sec`;
    } else {
      return `${seconds} sec`;
    }
  }

  /**
   * Vérifie si une image est expirée
   * @param {string} expiresAt - Date d'expiration ISO
   * @returns {boolean} True si expirée
   */
  isExpired(expiresAt) {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    return expirationDate <= now;
  }

  /**
   * Affiche les informations de debug
   */
  debug() {
    console.log('[ExpirationManager] Debug Info:', {
      activeTimers: this.getActiveTimersCount(),
      timers: this.getActiveTimers()
    });
  }

  /**
   * Nettoie et réinitialise le gestionnaire
   */
  cleanup() {
    this.stopAllTimers();
    console.log('[ExpirationManager] Nettoyé');
  }
}

// ==========================================
// STYLES CSS
// ==========================================

/**
 * Injecte les styles CSS nécessaires
 */
function injectExpirationStyles() {
  if (document.getElementById('expirationStyles')) return;

  const style = document.createElement('style');
  style.id = 'expirationStyles';
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.05);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .expiration-timer.warning {
      animation: pulse 2s infinite;
    }

    .expiration-timer.critical {
      animation: pulse 1s infinite;
    }

    .message-expired {
      padding: 48px 24px;
      text-align: center;
      background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
      border-radius: 12px;
      min-width: 200px;
    }

    .expired-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .expired-text {
      font-size: 1rem;
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 8px;
    }

    .expired-subtitle {
      font-size: 0.875rem;
      color: #6B7280;
    }
  `;
  document.head.appendChild(style);
}

// Injecter les styles au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectExpirationStyles);
} else {
  injectExpirationStyles();
}

// ==========================================
// INSTANCE GLOBALE
// ==========================================

// Créer une instance globale
const expirationManager = new ExpirationManager();

// Nettoyer à la fermeture de la page
window.addEventListener('beforeunload', () => {
  expirationManager.cleanup();
});

// Export global
if (typeof window !== 'undefined') {
  window.expirationManager = expirationManager;
  window.ExpirationManager = ExpirationManager;
  window.EXPIRATION_CONFIG = EXPIRATION_CONFIG;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ExpirationManager, 
    expirationManager, 
    EXPIRATION_CONFIG 
  };
}