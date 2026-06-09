import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const workspaceRoot = normalize(join(import.meta.dirname, ".."));

const contentTypesByExtension = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

/**
 * Resuelve rutas locales del preview.
 * Se construye para servir archivos sin dependencias externas.
 * Lo usa el servidor HTTP de Node.
 * Sirve para probar Padelito aunque npm no este disponible.
 */
function resolveRequestPath(requestUrl) {
  const requestedPath = requestUrl === "/" ? "/preview/index.html" : requestUrl;
  const decodedPath = decodeURIComponent(requestedPath.split("?")[0]);
  return normalize(join(workspaceRoot, decodedPath));
}

/**
 * Sirve el preview local.
 * Se construye para tener un resultado minimo testeable.
 * Lo ejecuta Node desde scripts/serve-preview.mjs.
 * Sirve para abrir la experiencia inicial en localhost.
 */
function handleRequest(request, response) {
  const filePath = resolveRequestPath(request.url ?? "/");

  if (!filePath.startsWith(workspaceRoot) || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("No encontrado");
    return;
  }

  const contentType =
    contentTypesByExtension[extname(filePath)] ??
    "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
}

createServer(handleRequest).listen(port, () => {
  console.log(`Padelito preview listo en http://localhost:${port}`);
});
