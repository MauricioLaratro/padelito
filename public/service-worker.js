const staticCacheName = "padelito-static-v5";
const staticAssetUrls = ["/manifest.webmanifest", "/app-icon.svg", "/logo-padelito.svg"];

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

  if (fetchEvent.request.mode === "navigate") {
    // Prioriza red para evitar que el inicio quede congelado con builds viejos.
    fetchEvent.respondWith(
      fetch(fetchEvent.request).catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Mantiene cache-first solo para assets estables, no para la app shell.
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cachedResponse) => cachedResponse ?? fetch(fetchEvent.request)),
  );
});

self.addEventListener("notificationclick", (notificationEvent) => {
  notificationEvent.notification.close();

  notificationEvent.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clientList) => {
        const existingClient = clientList.find((client) =>
          client.url.startsWith(self.location.origin),
        );

        if (existingClient) {
          return existingClient.focus();
        }

        return self.clients.openWindow("/");
      }),
  );
});
