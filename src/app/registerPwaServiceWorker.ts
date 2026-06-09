/**
 * Registra el service worker de la PWA cuando el navegador lo soporta.
 * Se construye para validar instalabilidad desde la primera etapa tecnica.
 * Lo usa main.tsx durante el arranque de React.
 * Sirve para preparar cache basico y futuras notificaciones web.
 */
export function registerPwaServiceWorker() {
  if (import.meta.env.DEV) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Evita romper la app si el navegador bloquea el registro durante desarrollo local.
    });
  });
}
