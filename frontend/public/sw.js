/* Alpha Coach — Service Worker Migration & Safe Bypass */
const CACHE_NAME = 'alpha-coach-v1.0.6-cleanup';

// Install: Skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: Delete all previous caches, unregister, and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.registration.unregister();
    })
  );
});

// Fetch: Strictly DO NOT intercept any fetch events (allows native browser network handling)
self.addEventListener('fetch', (event) => {
  // Pass-through without calling event.respondWith to guarantee zero network error interference
  return;
});
