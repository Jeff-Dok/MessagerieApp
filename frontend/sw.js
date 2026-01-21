/**
 * ============================================
 * SERVICE WORKER - Support mode hors ligne
 * ============================================
 * 
 * Permet à l'application de fonctionner hors ligne
 * et améliore les performances avec la mise en cache
 * 
 * @version 1.0.0
 */

const CACHE_NAME = 'messagerie-app-v1';
const RUNTIME_CACHE = 'messagerie-runtime-v1';

// Fichiers à mettre en cache lors de l'installation
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/dashboard.html',
  '/admin.html',
  '/pending.html',
  '/css/reset.css',
  '/css/variables.css',
  '/css/global.css',
  '/css/components.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/js/config.js',
  '/js/api.js',
  '/js/socket.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/storage.js',
  '/js/services/imageHandler.js',
  '/js/services/expirationManager.js',
  '/js/ui/messageRenderer.js',
  '/js/ui/conversationList.js',
  '/js/ui/notifications.js',
  '/images/logo.svg'
];

/**
 * Installation du Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers statiques');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation réussie');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur installation:', error);
      })
  );
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation réussie');
        return self.clients.claim();
      })
  );
});

/**
 * Interception des requêtes - Stratégie Cache First pour les statiques
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes API et Socket.io
  if (url.pathname.startsWith('/api/') || url.pathname.includes('socket.io')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Réponse depuis le cache:', url.pathname);
          return cachedResponse;
        }
        
        // Sinon, faire la requête réseau
        return fetch(request)
          .then((response) => {
            // Ne pas mettre en cache les erreurs
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Cloner la réponse
            const responseToCache = response.clone();
            
            // Mettre en cache pour la prochaine fois
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Erreur fetch:', error);
            
            // Si hors ligne, retourner une page d'erreur personnalisée
            return caches.match('/offline.html')
              .then((offlinePage) => {
                return offlinePage || new Response('Hors ligne', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'text/html'
                  })
                });
              });
          });
      })
  );
});

/**
 * Gestion des messages du client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload;
    
    caches.open(RUNTIME_CACHE)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_SUCCESS',
          payload: urlsToCache
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur mise en cache:', error);
        event.ports[0].postMessage({
          type: 'CACHE_ERROR',
          payload: error.message
        });
      });
  }
});

/**
 * Synchronisation en arrière-plan (Background Sync)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

/**
 * Synchronise les messages en attente
 */
async function syncMessages() {
  try {
    // Récupérer les messages en attente depuis IndexedDB
    const pendingMessages = await getPendingMessages();
    
    if (pendingMessages.length === 0) {
      return;
    }
    
    // Envoyer chaque message
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Supprimer le message de la file d'attente
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error('[Service Worker] Erreur envoi message:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Erreur sync messages:', error);
  }
}

/**
 * Récupère les messages en attente (placeholder)
 */
async function getPendingMessages() {
  // TODO: Implémenter avec IndexedDB
  return [];
}

/**
 * Supprime un message en attente (placeholder)
 */
async function removePendingMessage(messageId) {
  // TODO: Implémenter avec IndexedDB
  console.log('[Service Worker] Message supprimé de la queue:', messageId);
}

/**
 * Notifications push
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push reçu');
  
  const options = {
    body: event.data ? event.data.text() : 'Nouveau message',
    icon: '/images/logo.svg',
    badge: '/images/badge.png',
    vibrate: [200, 100, 200],
    tag: 'message-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/images/icons/message.svg'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/images/icons/close.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MessagerieApp', options)
  );
});

/**
 * Clic sur notification
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.openWindow('/dashboard.html')
    );
  }
});