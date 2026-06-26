import crypto from "node:crypto";

const defaultRedirectUri = "https://padelito-posadas.pages.dev/tiktok-callback";

/**
 * Lee una variable obligatoria del entorno.
 * Existe para evitar iniciar flujos OAuth incompletos.
 */
function requireEnvironmentValue(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar ${name}.`);
  }

  return value;
}

/**
 * Construye la URL de autorizacion de TikTok.
 * La usa Mauricio una sola vez para permitir que Padelito publique en `@padelito4`.
 */
function buildTikTokAuthorizationUrl() {
  const clientKey = requireEnvironmentValue("TIKTOK_CLIENT_KEY");
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || defaultRedirectUri;
  const state = process.env.TIKTOK_OAUTH_STATE || crypto.randomBytes(18).toString("hex");
  const scopes = process.env.TIKTOK_SCOPES || "user.info.basic,video.publish";
  const searchParams = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return {
    state,
    redirectUri,
    authorizationUrl: `https://www.tiktok.com/v2/auth/authorize/?${searchParams.toString()}`,
  };
}

console.log(JSON.stringify(buildTikTokAuthorizationUrl(), null, 2));
