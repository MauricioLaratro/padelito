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
 * Asegura que exista video real antes de publicar en Meta.
 * Existe para evitar volver a subir imagen estatica como Reel.
 */
function requireManifestVideo(manifest) {
  if (!manifest.videoUrl) {
    throw new Error("No se genero video MP4; se cancela la publicacion para evitar un Reel estatico.");
  }

  return manifest.videoUrl;
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
 * Ejecuta una llamada GET contra Graph API.
 * La usa el publicador para esperar el procesamiento de Reels.
 */
async function getGraph(pathname, params) {
  const url = new URL(`${graphBaseUrl}${pathname}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Meta Graph API fallo en ${pathname}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

/**
 * Pausa corta entre consultas de estado.
 * Existe para no publicar un Reel antes de que Meta termine de procesarlo.
 */
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Espera a que un contenedor de Reel quede listo.
 * La API procesa videos de forma asincronica antes de permitir publicarlos.
 */
async function waitForMediaContainer({ accessToken, containerId }) {
  const maxAttempts = Number(process.env.META_REEL_STATUS_ATTEMPTS || 20);
  const delayMilliseconds = Number(process.env.META_REEL_STATUS_DELAY_MS || 15_000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const status = await getGraph(`/${containerId}`, {
      fields: "status_code",
      access_token: accessToken,
    });

    if (status.status_code === "FINISHED") {
      return status;
    }

    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Meta no pudo procesar el contenedor ${containerId}: ${JSON.stringify(status)}`);
    }

    await delay(delayMilliseconds);
  }

  throw new Error(`Meta no termino de procesar el contenedor ${containerId}.`);
}

/**
 * Publica un Reel en Instagram.
 * Es el formato prioritario para ganar alcance y registros.
 */
async function publishInstagramReel({ accessToken, instagramUserId, videoUrl, coverUrl, caption }) {
  const container = await postGraph(`/${instagramUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    cover_url: coverUrl,
    caption,
    share_to_feed: "true",
    access_token: accessToken,
  });

  await waitForMediaContainer({ accessToken, containerId: container.id });

  const publication = await postGraph(`/${instagramUserId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  return {
    containerId: container.id,
    mediaId: publication.id,
    mediaType: "REELS",
  };
}

/**
 * Publica una historia con la misma pieza adaptada a 9:16.
 * La API no replica el boton nativo de compartir Reel, por eso crea una Story derivada.
 */
async function publishInstagramStory({ accessToken, instagramUserId, imageUrl }) {
  const container = await postGraph(`/${instagramUserId}/media`, {
    media_type: "STORIES",
    image_url: imageUrl,
    access_token: accessToken,
  });

  await waitForMediaContainer({ accessToken, containerId: container.id });

  const publication = await postGraph(`/${instagramUserId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });

  return {
    containerId: container.id,
    mediaId: publication.id,
    mediaType: "STORIES",
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
  const videoUrl = requireManifestVideo(manifest);

  const instagram = await publishInstagramReel({
    accessToken,
    instagramUserId,
    videoUrl,
    coverUrl: manifest.storyImageUrl || manifest.imageUrl,
    caption: manifest.caption,
  });

  const story = process.env.META_PUBLISH_STORY === "false"
    ? null
    : await publishInstagramStory({
        accessToken,
        instagramUserId,
        imageUrl: manifest.storyImageUrl || manifest.imageUrl,
      });

  const facebook = process.env.META_PUBLISH_FACEBOOK === "true"
    ? await publishFacebookPagePhoto({
        accessToken,
        pageId,
        imageUrl: manifest.imageUrl,
        caption: manifest.caption,
      })
    : null;

  console.log(JSON.stringify({ instagram, story, facebook, manifest }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
