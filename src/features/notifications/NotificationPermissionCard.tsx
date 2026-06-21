import { BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/common/Button";
import { synchronizeRemotePushSubscription } from "../../services/push/pushNotificationClient";

const notificationPermissionDismissedKey =
  "padelito-notification-permission-dismissed-v1";

/**
 * Card de permisos de notificacion.
 * Se construye para pedir permisos solo desde un contexto esperable.
 * Lo usa NotificationsScreen.
 * Sirve para preparar avisos del dispositivo sin interrumpir el feed.
 */
export function NotificationPermissionCard() {
  const [permissionState, setPermissionState] =
    useState<NotificationPermission>(() =>
      "Notification" in window ? Notification.permission : "denied",
    );
  const [isDismissed, setIsDismissed] = useState(() =>
    window.localStorage.getItem(notificationPermissionDismissedKey) === "true",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (permissionState === "granted") {
      window.localStorage.setItem(notificationPermissionDismissedKey, "true");
    }
  }, [permissionState]);

  if (
    isDismissed ||
    permissionState === "granted" ||
    permissionState === "denied" ||
    !("Notification" in window)
  ) {
    return null;
  }

  /**
   * Solicita permiso del navegador.
   * Se construye para activarse solo con accion explicita del usuario.
   * Lo usa el CTA de esta card.
   * Sirve para habilitar avisos locales cuando llegan nuevas notificaciones.
   */
  async function handlePermissionRequest() {
    const nextPermissionState = await Notification.requestPermission();
    setPermissionState(nextPermissionState);

    if (nextPermissionState !== "granted") {
      setStatusMessage("Podés activarlas después desde este panel.");
      return;
    }

    await synchronizeRemotePushSubscription().catch(() => {
      setStatusMessage("No se pudo activar push remoto en este dispositivo.");
    });

    const serviceWorkerRegistration =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.ready.catch(() => null)
        : null;

    if (serviceWorkerRegistration) {
      await serviceWorkerRegistration.showNotification("Padelito", {
        body: "Avisos activados en este dispositivo.",
        icon: "/app-icon.svg",
        tag: "padelito-notifications-enabled",
      });
    }
  }

  return (
    <section className="rounded-lg border border-accent-lime/20 bg-surface-primary p-3 shadow-floating">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-lime text-background-primary">
          <BellRing aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Avisos
          </p>
          <h2 className="truncate text-sm font-black">Activar notificaciones</h2>
        </div>
        <button
          aria-label="Ocultar solicitud de notificaciones"
          className="grid size-9 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
          onClick={() => {
            window.localStorage.setItem(notificationPermissionDismissedKey, "true");
            setIsDismissed(true);
          }}
          type="button"
        >
          <X aria-hidden="true" size={17} />
        </button>
      </div>
      <Button
        className="mt-3 min-h-9 w-full text-xs"
        icon={BellRing}
        onClick={handlePermissionRequest}
        variant="primary"
      >
        Activar
      </Button>
      {statusMessage ? (
        <p className="mt-2 text-xs font-bold text-text-secondary">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
