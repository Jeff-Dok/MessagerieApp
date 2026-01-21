/**
 * ============================================
 * SERVICE WORKER REGISTRATION
 * ============================================
 * 
 * Enregistre le Service Worker et gère les mises à jour
 * À inclure dans toutes les pages HTML
 * 
 * @version 1.0.0
 */

const SW = {
  registration: null,
  isSupported: 'serviceWorker' in navigator,
  
  /**
   * Initialise et enregistre le Service Worker
   */
  async init() {
    if (!this.isSupported) {
      console.warn('[SW] Service Workers non supportés dans ce navigateur');
      return false;
    }
    
    try {
      // Enregistrer le Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[SW] Enregistrement réussi, scope:', this.registration.scope);
      
      // Vérifier les mises à jour
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate();
      });
      
      // Écouter les changements de statut
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      
      // Demander la permission pour les notifications
      await this.requestNotificationPermission();
      
      return true;
    } catch (error) {
      console.error('[SW] Erreur enregistrement:', error);
      return false;
    }
  },
  
  /**
   * Gère les mises à jour du Service Worker
   */
  handleUpdate() {
    const newWorker = this.registration.installing;
    
    console.log('[SW] Nouvelle version disponible');
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Nouvelle version installée et prête
        this.showUpdateNotification();
      }
    });
  },
  
  /**
   * Affiche une notification de mise à jour
   */
  showUpdateNotification() {
    // Créer un toast de notification
    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4F46E5;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        animation: slideInUp 0.3s ease-out;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">
          ✨ Mise à jour disponible
        </div>
        <div style="font-size: 14px; margin-bottom: 12px; opacity: 0.9;">
          Une nouvelle version de l'application est disponible.
        </div>
        <button onclick="SW.update()" style="
          background: white;
          color: #4F46E5;
          border: none;
          padding: 8px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 8px;
        ">
          Mettre à jour
        </button>
        <button onclick="SW.dismissUpdate()" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
        ">
          Plus tard
        </button>
      </div>
    `;
    
    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
  },
  
  /**
   * Active la mise à jour
   */
  update() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  },
  
  /**
   * Ferme la notification de mise à jour
   */
  dismissUpdate() {
    const toast = document.getElementById('sw-update-toast');
    if (toast) {
      toast.remove();
    }
  },
  
  /**
   * Demande la permission pour les notifications
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('[SW] Notifications non supportées');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      console.log('[SW] Permission notifications déjà accordée');
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.warn('[SW] Permission notifications refusée');
      return false;
    }
    
    // Demander la permission
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('[SW] Permission notifications accordée');
        return true;
      } else {
        console.warn('[SW] Permission notifications refusée par l\'utilisateur');
        return false;
      }
    } catch (error) {
      console.error('[SW] Erreur demande permission:', error);
      return false;
    }
  },
  
  /**
   * Envoie une notification
   */
  async sendNotification(title, options = {}) {
    if (!this.registration) {
      console.warn('[SW] Service Worker non enregistré');
      return false;
    }
    
    if (Notification.permission !== 'granted') {
      console.warn('[SW] Permission notifications non accordée');
      return false;
    }
    
    try {
      await this.registration.showNotification(title, {
        icon: '/images/logo.svg',
        badge: '/images/badge.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
      });
      
      return true;
    } catch (error) {
      console.error('[SW] Erreur envoi notification:', error);
      return false;
    }
  },
  
  /**
   * Vérifie le statut de la connexion
   */
  checkOnlineStatus() {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      console.warn('[SW] Application hors ligne');
      this.showOfflineIndicator();
    } else {
      console.log('[SW] Application en ligne');
      this.hideOfflineIndicator();
    }
    
    return isOnline;
  },
  
  /**
   * Affiche l'indicateur hors ligne
   */
  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #EF4444;
          color: white;
          text-align: center;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ">
          <svg style="width: 16px; height: 16px; display: inline-block; margin-right: 8px; vertical-align: middle;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
          </svg>
          Mode hors ligne - Certaines fonctionnalités peuvent être limitées
        </div>
      `;
      document.body.insertBefore(indicator, document.body.firstChild);
    }
  },
  
  /**
   * Masque l'indicateur hors ligne
   */
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  },
  
  /**
   * Met en cache des URLs supplémentaires
   */
  async cacheUrls(urls) {
    if (!this.registration || !this.registration.active) {
      console.warn('[SW] Service Worker non actif');
      return false;
    }
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SUCCESS') {
          console.log('[SW] URLs mises en cache:', event.data.payload);
          resolve(true);
        } else {
          console.error('[SW] Erreur mise en cache:', event.data.payload);
          reject(new Error(event.data.payload));
        }
      };
      
      this.registration.active.postMessage({
        type: 'CACHE_URLS',
        payload: urls
      }, [messageChannel.port2]);
    });
  }
};

// Initialiser au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SW.init());
} else {
  SW.init();
}

// Écouter les changements de statut réseau
window.addEventListener('online', () => {
  console.log('[SW] Connexion rétablie');
  SW.hideOfflineIndicator();
});

window.addEventListener('offline', () => {
  console.log('[SW] Connexion perdue');
  SW.showOfflineIndicator();
});

// Vérifier le statut initial
SW.checkOnlineStatus();

// Export global
if (typeof window !== 'undefined') {
  window.SW = SW;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SW;
}