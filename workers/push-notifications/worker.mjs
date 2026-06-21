const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

export default {
  /**
   * Atiende endpoints de push remoto.
   * Se construye para separar envio Web Push del cliente PWA.
   * Lo usa Cloudflare Workers.
   * Sirve para guardar suscripciones y disparar avisos firmados con VAPID.
   */
  async fetch(request, env) {
    const corsHeaders = createCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
        status: 204,
      });
    }

    try {
      const requestUrl = new URL(request.url);

      if (
        requestUrl.pathname === "/subscriptions" &&
        request.method === "POST"
      ) {
        return await handleSubscriptionCreate(request, env, corsHeaders);
      }

      if (
        requestUrl.pathname === "/subscriptions" &&
        request.method === "DELETE"
      ) {
        return await handleSubscriptionDelete(request, env, corsHeaders);
      }

      if (
        requestUrl.pathname === "/notifications/send" &&
        request.method === "POST"
      ) {
        return await handleNotificationSend(request, env, corsHeaders);
      }

      return createJsonResponse({ error: "Ruta no encontrada." }, 404, corsHeaders);
    } catch (error) {
      return createJsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "No se pudo procesar la solicitud.",
        },
        500,
        corsHeaders,
      );
    }
  },
};

/**
 * Registra una suscripcion del navegador.
 * Se construye para guardar endpoints bajo RLS del usuario autenticado.
 * Lo usa el endpoint POST /subscriptions.
 * Sirve para que luego el Worker pueda enviar Web Push.
 */
async function handleSubscriptionCreate(request, env, corsHeaders) {
  const { accessToken, userId } = await getAuthenticatedUser(request, env);
  const pushSubscription = await request.json();
  const endpoint = getRequiredText(pushSubscription.endpoint, "endpoint");
  const p256dhKey = getRequiredText(pushSubscription.keys?.p256dh, "p256dh");
  const authKey = getRequiredText(pushSubscription.keys?.auth, "auth");
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`,
    {
      body: JSON.stringify({
        auth_key: authKey,
        endpoint,
        p256dh_key: p256dhKey,
        profile_id: userId,
        user_agent: request.headers.get("User-Agent")?.slice(0, 240) ?? null,
      }),
      headers: createSupabaseHeaders(env, accessToken, {
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo guardar la suscripcion push.");
  }

  return createJsonResponse({ ok: true }, 200, corsHeaders);
}

/**
 * Elimina una suscripcion del navegador.
 * Se construye para limpiar endpoints cuando el usuario revoca permisos.
 * Lo usa el endpoint DELETE /subscriptions.
 * Sirve para evitar envios a dispositivos retirados.
 */
async function handleSubscriptionDelete(request, env, corsHeaders) {
  const { accessToken, userId } = await getAuthenticatedUser(request, env);
  const requestBody = await request.json();
  const endpoint = getRequiredText(requestBody.endpoint, "endpoint");
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&profile_id=eq.${userId}`,
    {
      headers: createSupabaseHeaders(env, accessToken),
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo eliminar la suscripcion push.");
  }

  return createJsonResponse({ ok: true }, 200, corsHeaders);
}

/**
 * Envia push remoto para una notificacion interna.
 * Se construye para validar permiso mediante RPC antes de tocar suscripciones.
 * Lo usa el endpoint POST /notifications/send.
 * Sirve para avisar al destinatario con app cerrada.
 */
async function handleNotificationSend(request, env, corsHeaders) {
  const { accessToken } = await getAuthenticatedUser(request, env);
  const requestBody = await request.json();
  const notificationId = getRequiredText(
    requestBody.notificationId,
    "notificationId",
  );
  const payloadResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/rpc/get_push_delivery_payload`,
    {
      body: JSON.stringify({ notification_id_input: notificationId }),
      headers: createSupabaseHeaders(env, accessToken),
      method: "POST",
    },
  );

  if (!payloadResponse.ok) {
    throw new Error("No se pudo obtener destinatarios push.");
  }

  const deliveryRows = await payloadResponse.json();
  const uniqueEndpoints = [
    ...new Set(deliveryRows.map((deliveryRow) => deliveryRow.endpoint)),
  ];
  const deliveryResults = await Promise.allSettled(
    uniqueEndpoints.map((endpoint) => sendWebPush(endpoint, env)),
  );
  const sentCount = deliveryResults.filter(
    (deliveryResult) => deliveryResult.status === "fulfilled",
  ).length;

  return createJsonResponse(
    { ok: true, sent: sentCount, total: uniqueEndpoints.length },
    200,
    corsHeaders,
  );
}

/**
 * Envia un Web Push sin payload sensible.
 * Se construye para despertar el service worker sin cifrar datos privados.
 * Lo usa handleNotificationSend.
 * Sirve para que la PWA muestre aviso y cargue detalle desde Supabase al abrir.
 */
async function sendWebPush(endpoint, env) {
  const audience = new URL(endpoint).origin;
  const vapidToken = await createVapidToken(audience, env);
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `vapid t=${vapidToken}, k=${env.VAPID_PUBLIC_KEY}`,
      TTL: "2419200",
      Urgency: "normal",
    },
    method: "POST",
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error("El proveedor push rechazo el envio.");
  }
}

/**
 * Crea token VAPID firmado con ES256.
 * Se construye con Web Crypto para no depender de librerias Node.
 * Lo usa sendWebPush.
 * Sirve para autenticar Padelito ante proveedores Web Push.
 */
async function createVapidToken(audience, env) {
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const header = base64UrlEncodeJson({ alg: "ES256", typ: "JWT" });
  const claims = base64UrlEncodeJson({
    aud: audience,
    exp: expiration,
    sub: env.VAPID_SUBJECT,
  });
  const signingInput = `${header}.${claims}`;
  const publicKeyBytes = base64UrlDecode(env.VAPID_PUBLIC_KEY);
  const signingKey = await crypto.subtle.importKey(
    "jwk",
    {
      crv: "P-256",
      d: env.VAPID_PRIVATE_KEY,
      ext: false,
      key_ops: ["sign"],
      kty: "EC",
      x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
      y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { hash: "SHA-256", name: "ECDSA" },
    signingKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Valida el JWT contra Supabase Auth.
 * Se construye para no confiar en profileId enviado por el cliente.
 * Lo usan endpoints autenticados.
 * Sirve para que RLS y RPC operen con identidad real.
 */
async function getAuthenticatedUser(request, env) {
  const authorizationHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authorizationHeader.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    throw new Error("Falta sesion autenticada.");
  }

  const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Sesion invalida.");
  }

  const user = await userResponse.json();

  return { accessToken, userId: user.id };
}

/**
 * Crea headers REST de Supabase.
 * Se construye para centralizar apikey, bearer y preferencias.
 * Lo usan llamadas REST/RPC del Worker.
 * Sirve para mantener requests consistentes.
 */
function createSupabaseHeaders(env, accessToken, extraHeaders = {}) {
  return {
    ...jsonHeaders,
    ...extraHeaders,
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Crea respuesta JSON con CORS.
 * Se construye para mantener endpoints predecibles.
 * Lo usan todos los handlers.
 * Sirve para consumo simple desde la PWA.
 */
function createJsonResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...jsonHeaders,
      ...corsHeaders,
    },
    status,
  });
}

/**
 * Crea headers CORS acotados.
 * Se construye para aceptar solo origenes configurados.
 * Lo usa cada request del Worker.
 * Sirve para exponer API al frontend beta sin abrirla a cualquier sitio.
 */
function createCorsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin") ?? "";
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0] ?? "";

  return {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  };
}

/**
 * Exige strings de entrada.
 * Se construye para rechazar payloads incompletos temprano.
 * Lo usan handlers HTTP.
 * Sirve para evitar datos corruptos en suscripciones.
 */
function getRequiredText(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Falta ${fieldName}.`);
  }

  return value.trim();
}

/**
 * Codifica JSON a base64url.
 * Se construye para armar JWT VAPID.
 * Lo usa createVapidToken.
 * Sirve para cumplir el formato Web Push.
 */
function base64UrlEncodeJson(value) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

/**
 * Codifica bytes a base64url.
 * Se construye para Worker sin Buffer.
 * Lo usan utilidades VAPID.
 * Sirve para JWT y JWK.
 */
function base64UrlEncode(bytes) {
  let binaryValue = "";

  bytes.forEach((byteValue) => {
    binaryValue += String.fromCharCode(byteValue);
  });

  return btoa(binaryValue)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Decodifica base64url a bytes.
 * Se construye para leer la clave publica VAPID.
 * Lo usa createVapidToken.
 * Sirve para generar JWK compatible con Web Crypto.
 */
function base64UrlDecode(value) {
  const paddedValue = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const binaryValue = atob(paddedValue.replace(/-/g, "+").replace(/_/g, "/"));
  const outputBytes = new Uint8Array(binaryValue.length);

  for (let index = 0; index < binaryValue.length; index += 1) {
    outputBytes[index] = binaryValue.charCodeAt(index);
  }

  return outputBytes;
}
