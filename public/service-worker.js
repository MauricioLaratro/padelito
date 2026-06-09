const staticCacheName = "padelito-static-v2";
const staticAssetUrls = ["/", "/index.html", "/manifest.webmanifest", "/app-icon.svg", "/logo-padelito.svg"];

self.addEventListener("install", (installEvent) => {
  // Guarda los recursos minimos para que la PWA pueda abrir rapido.
  installEvent.waitUntil(
    caches.open(staticCacheName).then((staticCache) => staticCache.addAll(staticAssetUrls)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (activateEvent) => {
  // Limpia caches antiguos para evitar servir versiones obsoletas.
  activateEvent.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== staticCacheName)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (fetchEvent) => {
  if (fetchEvent.request.method !== "GET") {
    return;
  }

  // Responde desde cache cuando existe y cae a red para contenido nuevo.
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cachedResponse) => {
      return cachedResponse ?? fetch(fetchEvent.request);
    }),
  );
});
