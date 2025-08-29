const CACHE_NAME = 'crm-app-v1';
const STATIC_CACHE = 'crm-static-v1';
const DYNAMIC_CACHE = 'crm-dynamic-v1';

const urlsToCache = [
  '/',
  '/dashboard',
  '/contacts',
  '/activities',
  '/tags',
  '/profile',
  '/manifest.json',
  '/image.png'
];

const staticAssets = [
  '/',
  '/dashboard',
  '/contacts',
  '/activities',
  '/tags',
  '/profile'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened static cache');
        return cache.addAll(staticAssets);
      })
      .then(() => {
        console.log('Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            // Cache the fetched response for future offline use
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return fetchResponse;
          });
        })
        .catch(() => {
          // Return offline page if available
          return caches.match('/');
        })
    );
    return;
  }

  // Handle other requests (CSS, JS, images, etc.)
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((fetchResponse) => {
          // Cache successful responses
          if (fetchResponse && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from CRM',
    icon: '/image.png',
    badge: '/image.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/image.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/image.png'
      }
    ],
    requireInteraction: true,
    tag: 'crm-notification'
  };

  event.waitUntil(
    self.registration.showNotification('CRM Notification', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync logic here
      console.log('Background sync triggered')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
