/* ============================================================
   AURA FITNESS – Service Worker (sw.js)
   PWA Offline-First | Network-then-Cache strategy
   ============================================================ */

const CACHE_NAME = "aura-fitness-v1.0.0";
const OFFLINE_URL = "./index.html";

// Assets to pre-cache on install
const STATIC_ASSETS = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./api-mock.json",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&display=swap",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://unpkg.com/lucide@latest"
];

/* ---- INSTALL ---- */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Aura Fitness v1.0.0");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache local assets reliably; external CDNs may fail – wrap in try/catch
      return cache.addAll(["./index.html", "./style.css", "./script.js", "./api-mock.json", "./manifest.json"])
        .then(() => {
          // Try to cache CDN assets individually (non-breaking)
          const cdnAssets = [
            "https://cdn.jsdelivr.net/npm/chart.js",
            "https://unpkg.com/lucide@latest"
          ];
          return Promise.allSettled(cdnAssets.map(url => cache.add(url)));
        });
    }).then(() => self.skipWaiting())
  );
});

/* ---- ACTIVATE ---- */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating – clearing old caches");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/* ---- FETCH ---- */
self.addEventListener("fetch", (event) => {
  // Skip non-GET and cross-origin non-CDN requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // API mock – serve from cache
  if (url.pathname.endsWith("api-mock.json")) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // Network-first for HTML pages
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

/* ---- BACKGROUND SYNC (simulated) ---- */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-workout-data") {
    console.log("[SW] Background sync: workout data");
    // In production: POST to real API
  }
});

/* ---- PUSH NOTIFICATIONS (simulated) ---- */
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Aura Fitness";
  const options = {
    body: data.body || "Hai un allenamento programmato oggi! 💪",
    icon: "./icons/icon-192.png",
    badge: "./icons/badge-72.png",
    vibrate: [200, 100, 200],
    data: { url: "./" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "./"));
});
