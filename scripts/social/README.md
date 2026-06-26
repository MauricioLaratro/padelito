# Automatizacion social de Padelito

Este modulo genera una pieza diaria con estetica Padelito y la publica por la API oficial de Meta cuando existen los secretos necesarios.

## Que hace

- Genera una imagen vertical `1080x1350`.
- Genera copy con lenguaje argentino cercano.
- Evita usar `bio` y `americano`.
- Usa CTA hacia `padelito-posadas.pages.dev`.
- Publica en Instagram mediante Instagram Content Publishing API.
- Opcionalmente publica la misma pieza en una pagina de Facebook.

## Secretos requeridos

Configurar en GitHub Actions o Cloudflare:

- `META_ACCESS_TOKEN`
- `META_IG_USER_ID`
- `META_PAGE_ID`

Opcionales:

- `META_GRAPH_VERSION`
- `META_PUBLISH_FACEBOOK`
- `PUBLIC_MEDIA_BASE_URL`

## Comandos

```bash
npm run social:generate
npm run social:publish:meta
```

## Estado Meta

La publicacion en Instagram quedo validada con la cuenta `padelito.arg`.

IDs actuales:

- `META_IG_USER_ID`: `17841422176858876`
- `META_PAGE_ID`: `1224153714107928`

El token y los IDs se cargan como secretos, no se guardan en el repositorio. Si el token sale desde Graph API Explorer puede ser temporal; para la automatizacion diaria conviene reemplazarlo por un token de larga duracion o renovarlo antes de que expire.

## Decision actual

La primera version automatiza imagen/feed diario. Reels y TikTok quedan como extension porque requieren flujos de publicacion y permisos mas fragiles. El objetivo inmediato es conseguir registros, por eso se prioriza consistencia diaria, CTA claro y medicion.
