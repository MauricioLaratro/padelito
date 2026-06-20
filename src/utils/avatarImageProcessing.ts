interface ProcessedAvatarImage {
  file: File;
  previewUrl: string;
}

interface ProcessedEventImage {
  file: File;
  previewUrl: string;
}

const avatarOutputSize = 512;
const avatarOutputQuality = 0.86;
const eventImageMaximumWidth = 1280;
const eventImageOutputQuality = 0.84;

/**
 * Procesa una foto de perfil antes de guardarla.
 * Se construye para generar un cuadrado centrado apto para avatar circular.
 * Lo usa ProfileForm.
 * Sirve para evitar fotos pesadas o mal encuadradas en circulos pequenos.
 */
export async function createProcessedAvatarImage(
  sourceFile: File,
): Promise<ProcessedAvatarImage> {
  const imageBitmap = await createImageBitmap(sourceFile);
  const squareSourceSize = Math.min(imageBitmap.width, imageBitmap.height);
  const sourceX = Math.floor((imageBitmap.width - squareSourceSize) / 2);
  const sourceY = Math.floor((imageBitmap.height - squareSourceSize) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = avatarOutputSize;
  canvas.height = avatarOutputSize;

  const canvasContext = canvas.getContext("2d");

  if (!canvasContext) {
    throw new Error("No se pudo preparar la imagen de perfil.");
  }

  canvasContext.drawImage(
    imageBitmap,
    sourceX,
    sourceY,
    squareSourceSize,
    squareSourceSize,
    0,
    0,
    avatarOutputSize,
    avatarOutputSize,
  );

  const avatarBlob = await createCanvasBlob(canvas);
  const avatarFile = new File([avatarBlob], createAvatarFileName(sourceFile), {
    lastModified: Date.now(),
    type: avatarBlob.type,
  });

  imageBitmap.close();

  return {
    file: avatarFile,
    previewUrl: canvas.toDataURL("image/jpeg", avatarOutputQuality),
  };
}

/**
 * Lee un archivo como data URL.
 * Se construye para persistir avatar en modo local sin storage remoto.
 * Lo usa usePadelitoMvp.
 * Sirve para mantener paridad visual entre demo y Supabase.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      if (typeof fileReader.result === "string") {
        resolve(fileReader.result);
        return;
      }

      reject(new Error("No se pudo leer la imagen de perfil."));
    });
    fileReader.addEventListener("error", () => {
      reject(new Error("No se pudo leer la imagen de perfil."));
    });
    fileReader.readAsDataURL(file);
  });
}

/**
 * Procesa una imagen de evento antes de guardarla.
 * Se construye para subir archivos livianos sin deformar la foto.
 * Lo usa CreatePostModal.
 * Sirve para reemplazar URLs manuales por seleccion desde el carrete.
 */
export async function createProcessedEventImage(
  sourceFile: File,
): Promise<ProcessedEventImage> {
  const imageBitmap = await createImageBitmap(sourceFile);
  const outputScale = Math.min(1, eventImageMaximumWidth / imageBitmap.width);
  const outputWidth = Math.max(1, Math.round(imageBitmap.width * outputScale));
  const outputHeight = Math.max(1, Math.round(imageBitmap.height * outputScale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const canvasContext = canvas.getContext("2d");

  if (!canvasContext) {
    throw new Error("No se pudo preparar la imagen del evento.");
  }

  canvasContext.drawImage(
    imageBitmap,
    0,
    0,
    imageBitmap.width,
    imageBitmap.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const eventImageBlob = await createCanvasBlob(
    canvas,
    "image/jpeg",
    eventImageOutputQuality,
  );
  const eventImageFile = new File(
    [eventImageBlob],
    createSafeImageFileName(sourceFile, "evento"),
    {
      lastModified: Date.now(),
      type: eventImageBlob.type,
    },
  );

  imageBitmap.close();

  return {
    file: eventImageFile,
    previewUrl: canvas.toDataURL("image/jpeg", eventImageOutputQuality),
  };
}

/**
 * Convierte canvas a blob JPEG.
 * Se construye para normalizar formato antes de subir a storage.
 * Lo usa createProcessedAvatarImage.
 * Sirve para controlar peso y compatibilidad.
 */
function createCanvasBlob(
  canvas: HTMLCanvasElement,
  outputType = "image/jpeg",
  outputQuality = avatarOutputQuality,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (avatarBlob) => {
        if (avatarBlob) {
          resolve(avatarBlob);
          return;
        }

        reject(new Error("No se pudo generar la imagen de perfil."));
      },
      outputType,
      outputQuality,
    );
  });
}

/**
 * Crea nombre estable para el archivo procesado.
 * Se construye para no depender del nombre original del usuario.
 * Lo usa createProcessedAvatarImage.
 * Sirve para subir archivos seguros y consistentes.
 */
function createAvatarFileName(sourceFile: File) {
  return createSafeImageFileName(sourceFile, "avatar");
}

/**
 * Crea nombres seguros para imagenes procesadas.
 * Se construye para compartir limpieza entre avatar y eventos.
 * Lo usan los procesadores de imagen.
 * Sirve para evitar nombres originales problematicos en Storage.
 */
function createSafeImageFileName(sourceFile: File, fallbackName: string) {
  const safeBaseName =
    sourceFile.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || fallbackName;

  return `${safeBaseName}.jpg`;
}
