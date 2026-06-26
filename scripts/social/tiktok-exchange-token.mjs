const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
const defaultRedirectUri = "https://padelito-posadas.pages.dev/tiktok-callback";

/**
 * Lee una variable obligatoria del entorno.
 * Existe para fallar temprano si falta una credencial de TikTok.
 */
function requireEnvironmentValue(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar ${name}.`);
  }

  return value;
}

/**
 * Canjea un authorization code por tokens de usuario.
 * Lo usamos una vez despues de que `@padelito4` autoriza la app.
 */
async function exchangeAuthorizationCode() {
  const body = new URLSearchParams({
    client_key: requireEnvironmentValue("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnvironmentValue("TIKTOK_CLIENT_SECRET"),
    code: requireEnvironmentValue("TIKTOK_AUTH_CODE"),
    grant_type: "authorization_code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI || defaultRedirectUri,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`TikTok OAuth fallo: ${JSON.stringify(payload)}`);
  }

  console.log(JSON.stringify(payload, null, 2));
}

exchangeAuthorizationCode().catch((error) => {
  console.error(error);
  process.exit(1);
});
