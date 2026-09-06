const CACHE_NAME = 'tb-khizanat-v1';
const URLs_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLs_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(cacheNames.filter(name => name !== CACHE_NAME)
        .map(name => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for data
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Strategy untuk halaman statis
  if (url.pathname === '/' || url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.png') || url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  } else {
    // Network first, fallback ke cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
