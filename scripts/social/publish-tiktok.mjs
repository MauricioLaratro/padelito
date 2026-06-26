import { readFile } from "node:fs/promises";
import path from "node:path";

const tiktokApiBaseUrl = "https://open.tiktokapis.com";

/**
 * Lee la pieza generada para publicar.
 * La usa el publicador de TikTok para reutilizar el calendario diario.
 */
async function readLatestManifest() {
  const manifestPath = process.env.SOCIAL_MANIFEST_PATH || path.resolve("public", "social", "latest.json");
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

/**
 * Lee una variable obligatoria del entorno.
 * Existe para fallar temprano si faltan secretos de TikTok.
 */
function requireEnvironmentValue(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar ${name}.`);
  }

  return value;
}

/**
 * Limita textos al maximo que acepta TikTok para posts de fotos.
 * Existe para que un caption largo no rompa la publicacion diaria.
 */
function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength - 1).trimEnd();
}

/**
 * Renueva el access token con el refresh token guardado.
 * Lo usa GitHub Actions para no depender de tokens cortos manuales.
 */
async function refreshTikTokAccessToken() {
  const body = new URLSearchParams({
    client_key: requireEnvironmentValue("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnvironmentValue("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: requireEnvironmentValue("TIKTOK_REFRESH_TOKEN"),
  });

  const response = await fetch(`${tiktokApiBaseUrl}/v2/oauth/token/`, {
    method: "POST",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`TikTok token refresh fallo: ${JSON.stringify(payload)}`);
  }

  return payload.access_token;
}

/**
 * Ejecuta una llamada JSON contra TikTok.
 * Centraliza validacion de errores para logs accionables.
 */
async function postTikTokJson(pathname, accessToken, body = {}) {
  const response = await fetch(`${tiktokApiBaseUrl}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok || payload.error?.code !== "ok") {
    throw new Error(`TikTok API fallo en ${pathname}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

/**
 * Obtiene opciones de publicacion del creador.
 * TikTok exige usar una privacidad incluida en esta respuesta.
 */
async function queryCreatorInfo(accessToken) {
  return postTikTokJson("/v2/post/publish/creator_info/query/", accessToken);
}

/**
 * Elige privacidad publica cuando TikTok la permite.
 * Si no esta disponible, usa la primera opcion que devuelva la cuenta.
 */
function choosePrivacyLevel(creatorInfo) {
  const options = creatorInfo.data?.privacy_level_options || [];

  if (options.includes("PUBLIC_TO_EVERYONE")) {
    return "PUBLIC_TO_EVERYONE";
  }

  if (options.length > 0) {
    return options[0];
  }

  throw new Error("TikTok no devolvio opciones de privacidad para esta cuenta.");
}

/**
 * Publica la pieza diaria como post de foto en TikTok.
 * Existe como primer canal automatico estable mientras se agregan reels/video.
 */
async function publishTikTokPhoto({ accessToken, manifest, privacyLevel }) {
  const title = truncateText(manifest.title, 90);
  const description = truncateText(manifest.caption, 4000);

  return postTikTokJson("/v2/post/publish/content/init/", accessToken, {
    media_type: "PHOTO",
    post_mode: "DIRECT_POST",
    post_info: {
      title,
      description,
      privacy_level: privacyLevel,
      disable_comment: false,
      auto_add_music: true,
      brand_content_toggle: false,
      brand_organic_toggle: true,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_images: [manifest.imageUrl],
      photo_cover_index: 0,
    },
  });
}

/**
 * Orquesta la publicacion diaria en TikTok.
 * La usa GitHub Actions cuando la app ya esta aprobada y autorizada.
 */
async function main() {
  const manifest = await readLatestManifest();
  const accessToken = await refreshTikTokAccessToken();
  const creatorInfo = await queryCreatorInfo(accessToken);
  const privacyLevel = process.env.TIKTOK_PRIVACY_LEVEL || choosePrivacyLevel(creatorInfo);
  const publication = await publishTikTokPhoto({ accessToken, manifest, privacyLevel });

  console.log(JSON.stringify({ publication, privacyLevel, manifest }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
