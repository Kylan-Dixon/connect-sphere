// Choose a cache name
const CACHE_NAME = 'connectsphere-v1';
// List the files to precache
const PRECACHE_ASSETS = [
    '/',
    '/dashboard',
    '/offline.html'
];

// When the service worker is installed, open a new cache and add all of our assets to it
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// When there's a new service worker, activate it
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (CACHE_NAME !== cacheName) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


// When the browser requests a file, check if it's in the cache.
// If it is, serve the cached version. If not, fetch it from the network.
// If the network fetch fails (e.g., offline), show a fallback page.
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }

                    const networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    console.log('Fetch failed; returning offline page instead.', error);

                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match('/offline.html');
                    return cachedResponse;
                }
            })()
        );
    } else if (PRECACHE_ASSETS.includes(new URL(event.request.url).pathname)) {
         event.respondWith(
            caches.match(event.request)
        );
    }
});
