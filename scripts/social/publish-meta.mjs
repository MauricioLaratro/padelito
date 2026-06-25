import { readFile } from "node:fs/promises";
import path from "node:path";

const graphVersion = process.env.META_GRAPH_VERSION || "v25.0";
const graphBaseUrl = `https://graph.facebook.com/${graphVersion}`;

/**
 * Lee la pieza generada para publicar.
 * La usa el publicador para desacoplar generacion de distribucion.
 */
async function readLatestManifest() {
  const manifestPath = process.env.SOCIAL_MANIFEST_PATH || path.resolve("public", "social", "latest.json");
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

/**
 * Valida variables de entorno criticas.
 * Existe para fallar temprano cuando faltan secretos.
 */
function requireEnvironmentValue(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar ${name}.`);
  }

  return value;
}

/**
 * Ejecuta una llamada POST contra Graph API.
 * Centraliza errores para que los logs diarios sean accionables.
 */
async function postGraph(pathname, body) {
  const response = await fetch(`${graphBaseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Meta Graph API fallo en ${pathname}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

/**
 * Publica una imagen en Instagram mediante contenedor y publish.
 * La usa la automatizacion diaria cuando existen permisos oficiales.
 */
async function publishInstagramImage({ accessToken, instagramUserId, imageUrl, caption }) {
  const container = await postGraph(`/${instagramUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  const publication = await postGraph(`/${instagramUserId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  return {
    containerId: container.id,
    mediaId: publication.id,
  };
}

/**
 * Publica la misma pieza en una pagina de Facebook.
 * Existe para reutilizar el contenido sin trabajo manual adicional.
 */
async function publishFacebookPagePhoto({ accessToken, pageId, imageUrl, caption }) {
  if (!pageId) {
    return null;
  }

  return postGraph(`/${pageId}/photos`, {
    url: imageUrl,
    caption,
    published: "true",
    access_token: accessToken,
  });
}

/**
 * Orquesta la publicacion diaria en Meta.
 * La usa GitHub Actions o ejecuciones locales controladas.
 */
async function main() {
  const manifest = await readLatestManifest();
  const accessToken = requireEnvironmentValue("META_ACCESS_TOKEN");
  const instagramUserId = requireEnvironmentValue("META_IG_USER_ID");
  const pageId = process.env.META_PAGE_ID;

  const instagram = await publishInstagramImage({
    accessToken,
    instagramUserId,
    imageUrl: manifest.imageUrl,
    caption: manifest.caption,
  });

  const facebook = process.env.META_PUBLISH_FACEBOOK === "true"
    ? await publishFacebookPagePhoto({
        accessToken,
        pageId,
        imageUrl: manifest.imageUrl,
        caption: manifest.caption,
      })
    : null;

  console.log(JSON.stringify({ instagram, facebook, manifest }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
