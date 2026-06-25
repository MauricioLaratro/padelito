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
- `PUBLIC_MEDIA_BASE_URL`

Opcionales:

- `META_GRAPH_VERSION`
- `META_PUBLISH_FACEBOOK`

## Comandos

```bash
npm run social:generate
npm run social:publish:meta
```

## Paso minimo pendiente en Meta

Para publicar de forma automatica falta obtener un token oficial con permiso de publicacion. No usar usuario y contrasena.

1. La cuenta `padelito.arg` debe ser profesional.
2. Debe existir una pagina de Facebook conectada, aunque sea minima: `Padelito Posadas`.
3. La app de Meta Developers debe estar asociada al negocio.
4. El token debe permitir publicar contenido en la cuenta de Instagram.
5. El token y los IDs se cargan como secretos, no se guardan en el repositorio.

## Decision actual

La primera version automatiza imagen/feed diario. Reels y TikTok quedan como extension porque requieren flujos de publicacion y permisos mas fragiles. El objetivo inmediato es conseguir registros, por eso se prioriza consistencia diaria, CTA claro y medicion.
