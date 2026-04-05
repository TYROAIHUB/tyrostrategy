// TYRO Strategy — minimal service worker for PWA install prompt
const CACHE_NAME = "tyro-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Network-first strategy — always try network, fall back to cache
self.addEventListener("fetch", (e) => {
  // Only cache same-origin GET requests
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful responses
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
