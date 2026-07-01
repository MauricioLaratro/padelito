import { readFile } from "node:fs/promises";
import path from "node:path";

const graphVersion = process.env.META_GRAPH_VERSION || "v25.0";
const graphBaseUrl = `https://graph.facebook.com/${graphVersion}`;
const remoteAssetAttempts = Number(process.env.META_REMOTE_ASSET_ATTEMPTS || 8);
const remoteAssetDelayMilliseconds = Number(process.env.META_REMOTE_ASSET_DELAY_MS || 15_000);

class MetaGraphApiError extends Error {
  /**
   * Normaliza errores de Meta.
   * Lo usa el publicador para diferenciar bloqueos de permisos de problemas de media.
   */
  constructor({ pathname, payload }) {
    const message = payload?.error?.message || "Error desconocido de Meta Graph API.";

    super(`Meta Graph API fallo en ${pathname}: ${JSON.stringify(payload)}`);
    this.name = "MetaGraphApiError";
    this.pathname = pathname;
    this.payload = payload;
    this.metaMessage = message;
    this.metaCode = payload?.error?.code;
    this.metaSubcode = payload?.error?.error_subcode;
    this.metaType = payload?.error?.type;
  }
}

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

  if (!manifest.videoUrl.endsWith(".mp4")) {
    throw new Error(`El archivo generado no parece ser MP4: ${manifest.videoUrl}`);
  }

  return manifest.videoUrl;
}

/**
 * Detecta el bloqueo especifico de permisos de Meta.
 * Existe para convertir el error diario en una instruccion accionable.
 */
function isMetaAccessBlockedError(error) {
  return (
    error instanceof MetaGraphApiError &&
    error.metaCode === 200 &&
    typeof error.metaMessage === "string" &&
    error.metaMessage.toLowerCase().includes("api access blocked")
  );
}

/**
 * Valida que el archivo remoto este disponible antes de pedirle a Meta que lo descargue.
 * GitHub Pages y Raw pueden tardar unos segundos despues del push diario.
 */
async function waitForRemoteAsset(assetUrl) {
  let lastStatus = "sin respuesta";

  for (let attempt = 1; attempt <= remoteAssetAttempts; attempt += 1) {
    try {
      const response = await fetch(assetUrl, { method: "HEAD" });
      lastStatus = `${response.status} ${response.statusText}`;

      if (response.ok) {
        const contentLength = Number(response.headers.get("content-length") || 0);

        if (contentLength > 0 || !response.headers.has("content-length")) {
          return;
        }
      }
    } catch (error) {
      lastStatus = error.message;
    }

    await delay(remoteAssetDelayMilliseconds);
  }

  throw new Error(`El archivo remoto no esta disponible para Meta: ${assetUrl}. Ultimo estado: ${lastStatus}`);
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
    throw new MetaGraphApiError({ pathname, payload });
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
    throw new MetaGraphApiError({ pathname, payload });
  }

  return payload;
}

/**
 * Comprueba que el token pueda usar Content Publishing antes de crear contenedores.
 * Lo usa la accion diaria para fallar temprano cuando Meta bloqueo el acceso de la app/token.
 */
async function checkInstagramPublishingAccess({ accessToken, instagramUserId }) {
  try {
    return await getGraph(`/${instagramUserId}/content_publishing_limit`, {
      fields: "quota_usage",
      access_token: accessToken,
    });
  } catch (error) {
    if (isMetaAccessBlockedError(error)) {
      throw new Error(
        [
          "Meta bloqueo el acceso de publicacion antes de crear el Reel.",
          "Hay que regenerar o reautorizar META_ACCESS_TOKEN desde la app Meta correcta y confirmar que tenga acceso de publicacion para padelito.arg.",
          "Permisos esperados: instagram_basic o instagram_business_basic, instagram_content_publish o instagram_business_content_publish, pages_show_list y pages_read_engagement segun el producto Meta usado.",
          `Detalle Meta: ${error.metaMessage}`,
        ].join(" "),
      );
    }

    throw error;
  }
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
async function publishInstagramStory({ accessToken, instagramUserId, storyUrl, storyKind }) {
  const mediaField = storyKind === "video" ? "video_url" : "image_url";
  const container = await postGraph(`/${instagramUserId}/media`, {
    media_type: "STORIES",
    [mediaField]: storyUrl,
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
  const storyUrl = manifest.videoUrl || manifest.storyImageUrl || manifest.imageUrl;
  const storyKind = manifest.videoUrl ? "video" : "image";

  await waitForRemoteAsset(videoUrl);
  await waitForRemoteAsset(manifest.storyImageUrl || manifest.imageUrl);
  await checkInstagramPublishingAccess({ accessToken, instagramUserId });

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
        storyUrl,
        storyKind,
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
