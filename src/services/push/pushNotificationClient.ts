import { supabaseBrowserClient } from "../supabase/supabaseClient";

const pushWorkerUrl = import.meta.env.VITE_PUSH_WORKER_URL as
  | string
  | undefined;
const pushPublicKey = import.meta.env.VITE_PUSH_PUBLIC_KEY as
  | string
  | undefined;

export type PushSubscriptionSyncStatus =
  | "configured"
  | "disabled"
  | "permission-missing"
  | "unsupported";

/**
 * Indica si el entorno tiene push remoto configurado.
 * Se construye para degradar a notificaciones locales cuando falta Worker o VAPID.
 * Lo usan App y NotificationPermissionCard.
 * Sirve para evitar errores en desarrollo y previews sin configuracion.
 */
export function isRemotePushConfigured() {
  return Boolean(pushWorkerUrl && pushPublicKey && supabaseBrowserClient);
}

/**
 * Sincroniza la suscripcion push del dispositivo.
 * Se construye para registrar el endpoint del navegador en Supabase via Worker.
 * Lo usan App y NotificationPermissionCard.
 * Sirve para recibir avisos aunque la app este cerrada.
 */
export async function synchronizeRemotePushSubscription(): Promise<PushSubscriptionSyncStatus> {
  if (!isRemotePushConfigured()) {
    return "disabled";
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }

  if (Notification.permission !== "granted") {
    return "permission-missing";
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  const existingSubscription =
    await serviceWorkerRegistration.pushManager.getSubscription();
  const pushSubscription =
    existingSubscription ??
    (await serviceWorkerRegistration.pushManager.subscribe({
      applicationServerKey: createPushApplicationServerKey(
        pushPublicKey as string,
      ),
      userVisibleOnly: true,
    }));
  const accessToken = await getSupabaseAccessToken();

  if (!accessToken) {
    return "disabled";
  }

  const response = await fetch(`${pushWorkerUrl}/subscriptions`, {
    body: JSON.stringify(pushSubscription.toJSON()),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("No se pudo activar push remoto.");
  }

  return "configured";
}

/**
 * Solicita al Worker enviar una notificacion push ya persistida.
 * Se construye para no exponer suscripciones ni claves privadas al cliente.
 * Lo usa el repositorio Supabase luego de crear notificaciones internas.
 * Sirve para avisar a dispositivos cerrados o en segundo plano.
 */
export async function requestRemotePushDelivery(notificationId: string) {
  if (!isRemotePushConfigured()) {
    return;
  }

  const accessToken = await getSupabaseAccessToken();

  if (!accessToken) {
    return;
  }

  await fetch(`${pushWorkerUrl}/notifications/send`, {
    body: JSON.stringify({ notificationId }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

/**
 * Obtiene token activo de Supabase.
 * Se construye para autenticar llamadas al Worker con el usuario real.
 * Lo usan los helpers de push remoto.
 * Sirve para que RLS y RPC validen actor/destinatario.
 */
async function getSupabaseAccessToken() {
  const sessionResult = await supabaseBrowserClient?.auth.getSession();

  return sessionResult?.data.session?.access_token;
}

/**
 * Convierte VAPID base64url a Uint8Array.
 * Se construye porque PushManager requiere clave binaria.
 * Lo usa synchronizeRemotePushSubscription.
 * Sirve para registrar suscripciones compatibles con Web Push.
 */
function createPushApplicationServerKey(publicKey: string) {
  const paddedPublicKey = `${publicKey}${"=".repeat((4 - (publicKey.length % 4)) % 4)}`;
  const base64PublicKey = paddedPublicKey.replace(/-/g, "+").replace(/_/g, "/");
  const rawPublicKey = window.atob(base64PublicKey);
  const outputArray = new Uint8Array(rawPublicKey.length);

  for (let index = 0; index < rawPublicKey.length; index += 1) {
    outputArray[index] = rawPublicKey.charCodeAt(index);
  }

  return outputArray;
}
