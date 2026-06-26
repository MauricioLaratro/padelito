# Automatizacion social de Padelito

Este modulo genera una pieza diaria con estetica Padelito y la publica por la API oficial de Meta cuando existen los secretos necesarios.

## Que hace

- Genera una imagen vertical `1080x1350`.
- Genera copy con lenguaje argentino cercano.
- Evita usar `bio` y `americano`.
- Usa CTA hacia `padelito-posadas.pages.dev`.
- Publica en Instagram mediante Instagram Content Publishing API.
- Opcionalmente publica la misma pieza en una pagina de Facebook.
- Publica en TikTok mediante Content Posting API cuando la app esta aprobada y `@padelito4` autorizo la app.

## Secretos requeridos

Configurar en GitHub Actions o Cloudflare:

- `META_ACCESS_TOKEN`
- `META_IG_USER_ID`
- `META_PAGE_ID`

Opcionales:

- `META_GRAPH_VERSION`
- `META_PUBLISH_FACEBOOK`
- `PUBLIC_MEDIA_BASE_URL`

TikTok:

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REFRESH_TOKEN`

Opcionales:

- `TIKTOK_REDIRECT_URI`
- `TIKTOK_PRIVACY_LEVEL`

## Comandos

```bash
npm run social:generate
npm run social:publish:meta
npm run social:tiktok:auth-url
npm run social:tiktok:exchange-token
npm run social:publish:tiktok
```

## Estado Meta

La publicacion en Instagram quedo validada con la cuenta `padelito.arg`.

IDs actuales:

- `META_IG_USER_ID`: `17841422176858876`
- `META_PAGE_ID`: `1224153714107928`

El token y los IDs se cargan como secretos, no se guardan en el repositorio. Si el token sale desde Graph API Explorer puede ser temporal; para la automatizacion diaria conviene reemplazarlo por un token de larga duracion o renovarlo antes de que expire.

## Decision actual

La primera version automatiza imagen/feed diario en Instagram y post de foto en TikTok. Reels/video queda como extension porque requiere generar MP4 validos y pasar el flujo completo de Direct Post. El objetivo inmediato es conseguir registros, por eso se prioriza consistencia diaria, CTA claro y medicion.

## Flujo TikTok

TikTok exige Login Kit para que la cuenta `@padelito4` autorice la app antes de publicar.

1. Esperar aprobacion de `video.publish` en TikTok Developers.
2. Configurar `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` y `TIKTOK_REDIRECT_URI`.
3. Ejecutar `npm run social:tiktok:auth-url`.
4. Abrir la URL generada e iniciar sesion con `@padelito4`.
5. Copiar el parametro `code` de la URL de retorno.
6. Ejecutar `npm run social:tiktok:exchange-token` con `TIKTOK_AUTH_CODE`.
7. Guardar `refresh_token` como secreto `TIKTOK_REFRESH_TOKEN`.

El `client_secret` y el `refresh_token` no deben guardarse en el repositorio.
