# SETUP - PADELITO

## Herramientas locales necesarias

- Node.js LTS.
- npm.
- Git.
- Cuenta Supabase, solo cuando se conecte backend real.
- Cuenta Cloudflare, solo para deploy.

## Preview local sin dependencias

Se dejo un preview local testeable con Node puro como respaldo.

```bash
node scripts/serve-preview.mjs
```

URL:

```txt
http://localhost:4173
```

Tambien puede abrirse directamente:

```txt
preview/index.html
```

## Desarrollo React

```bash
npm install
npm run dev
```

En esta maquina tambien existe un script que fija el PATH del Node instalado por usuario:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-vite-dev.ps1
```

URL:

```txt
http://localhost:5173
```

Si el navegador conserva cache vieja de service worker en `5173`, usar un puerto fresco durante desarrollo:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

## Verificacion

```bash
npm run build
npm run lint
```

Smoke test Supabase local:

```powershell
$env:PADELITO_QA_EMAIL="usuario-test"
$env:PADELITO_QA_PASSWORD="password-test"
npm run qa:supabase
```

Opcional para validar dos sesiones sin crear usuarios nuevos:

```powershell
$env:PADELITO_QA_SECOND_EMAIL="otro-usuario-test"
$env:PADELITO_QA_SECOND_PASSWORD="otro-password-test"
npm run qa:supabase
```

## Variables esperadas

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No commitear `.env` ni `.env.local`.

En esta maquina, `.env.local` ya esta configurado para el proyecto Supabase:

```txt
zrddjpvtkqebvmazauhu
```

## Supabase

Pasos para un entorno nuevo:

1. Crear proyecto en Supabase Cloud.
2. Ejecutar las migraciones de `supabase/migrations/` en orden cronologico.
3. Copiar URL y publishable/anon key al `.env.local`.

La migracion ya crea tablas, enums, politicas RLS y buckets.

Estado de esta instancia:

- Proyecto Supabase: `zrddjpvtkqebvmazauhu`.
- Migraciones ejecutadas desde SQL Editor.
- Verificacion SQL: `schema_ok`.
- Buckets creados por migracion: `avatars` y `event-images`.
- Fotos de perfil: la app procesa el avatar en cliente y lo sube al bucket publico `avatars`.
- Contacto privado: `get_profile_private_contact(uuid)` instalado y ejecutable por usuarios autenticados.
- Historial de partidos: `match_records`, `match_participants`, `match_results` y `can_read_match(uuid, uuid)` instalados.
- Enlace social-partidos: `source_post_id`, `related_match_id`, `register_accepted_player_on_match` y `register_accepted_player_on_linked_match` instalados.
- Desafios recurrentes: `recurring_challenges`, `recurring_challenge_participants`, `match_records.recurring_challenge_id` y `can_read_recurring_challenge(uuid, uuid)` instalados.
- Reset de score propio: `profiles.match_stats_reset_at`, `reset_own_match_stats()` y trigger anti-edicion directa instalados.
- Actividad operativa: `notifications.related_match_id`, `cancel_match_join_request(uuid)`, `cancel_direct_match_invitation(uuid)` y actualizacion de `answer_direct_match_invitation` instalados.
- Invitaciones directas: `supabase/migrations/202606210002_prevent_duplicate_open_invitations.sql` aplicado; bloquea duplicados abiertos sobre el mismo destino.
- Push remoto: `supabase/migrations/202606200001_push_subscriptions.sql` aplicado en Supabase Cloud; `push_subscriptions` y `get_push_delivery_payload(uuid)` verificados por REST.
- Notificaciones push: `supabase/migrations/202606210001_allow_actor_notification_reads.sql` aplicado para que el emisor pueda recuperar el `id` de notificaciones que genero.

## Push remoto

La app ya tiene cliente Web Push, service worker y Worker gratuito de Cloudflare.

Cloudflare Worker:

```txt
https://padelito-push.mauriciolaratro.workers.dev
```

Variables requeridas en Cloudflare Pages:

```env
VITE_PUSH_WORKER_URL=
VITE_PUSH_PUBLIC_KEY=
```

Variables/bindings del Worker:

```txt
ALLOWED_ORIGINS
SUPABASE_ANON_KEY
SUPABASE_URL
VAPID_PUBLIC_KEY
VAPID_SUBJECT
VAPID_PRIVATE_KEY
```

`VAPID_PRIVATE_KEY` debe existir solo como secret de Cloudflare Worker. No versionarla.

Estado de esta instancia:

- Worker `padelito-push` creado.
- Subdominio `workers.dev` habilitado.
- Secret `VAPID_PRIVATE_KEY` cargada en Cloudflare.
- Pages tiene `VITE_PUSH_WORKER_URL` y `VITE_PUSH_PUBLIC_KEY`.
- Supabase ya recibio la migracion `202606200001_push_subscriptions.sql`.
- Supabase ya recibio la migracion `202606210001_allow_actor_notification_reads.sql`.
- Se verifico por REST que una notificacion creada por un emisor autenticado puede devolver `id` y luego borrarse desde el receptor.

Para que funcione con la app cerrada:

1. Aplicar la migracion de push en Supabase.
2. Publicar el build de Pages con las variables de push.
3. Abrir la PWA instalada, entrar a Notificaciones y tocar `Activar`.
4. En iPhone, instalar desde Safari o navegador predeterminado del iPhone; no desde Chrome.
5. Probar una invitacion entre dos usuarios y cerrar la app del destinatario.

## Emails de Auth para produccion

La documentacion oficial de Supabase indica que el SMTP default es solo para exploracion/demos, con restricciones fuertes y sin garantia de entrega. Para produccion hay que configurar SMTP propio desde Supabase Auth.

Para el preview gratuito y cerrado del MVP se evita que el registro dependa de email:

- La app registra con email, nombre de usuario, contraseña y repetición de contraseña.
- La app ya no muestra magic link como acceso cotidiano.
- El envío de email queda reservado para recuperación de contraseña.
- En Supabase Dashboard hay que entrar a Authentication > Providers > Email y desactivar `Confirm email`.
- Con `Confirm email` desactivado, Supabase confirma implícitamente el email y el registro devuelve sesión inmediata.
- Antes de un lanzamiento público abierto conviene revaluar esta decisión y activar SMTP propio si se vuelve a exigir confirmación.

Checklist antes del lanzamiento publico:

- Elegir proveedor SMTP: Resend, AWS SES, Postmark, SendGrid, Brevo u otro compatible.
- Definir remitente de Auth, idealmente `no-reply@auth.tudominio.com`.
- Configurar SPF, DKIM y DMARC del dominio de envio.
- Configurar Custom SMTP en Supabase Dashboard > Authentication.
- Revisar Authentication > Rate Limits despues de activar SMTP propio.
- Mantener login por email/contraseña como flujo principal para reducir envíos.

Referencias:

- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/rate-limits

## Sesion de usuario

- Acceso real recomendado: email y contraseña.
- Registro real: crear cuenta con email, nombre de usuario, contraseña y repetición de contraseña desde la pantalla inicial.
- Recuperación: usar `Olvidé mi contraseña`, abrir el enlace recibido y guardar una nueva contraseña en la app.
- Persistencia: Supabase mantiene el perfil en `public.profiles` vinculado a `auth.users.id`.
- Persistencia de sesión: el cliente Supabase conserva la sesión del navegador, refresca token y la app intenta recuperarla antes de mostrar el formulario de acceso.
- Rate limit de email: solo debería afectar recuperación de contraseña mientras se use SMTP default.
- Cierre de sesión: desde Perfil, `Cerrar sesión` elimina la sesión local del navegador pero no borra datos.
- Reingreso: usando el mismo email/contraseña, Supabase recupera el mismo usuario y la app vuelve a cargar su perfil y actividad.

## Datos de prueba

- Los usuarios de prueba se gestionan exclusivamente desde Supabase Auth y la base de datos.
- No versionar emails, contrasenas ni credenciales de cuentas de prueba.
- Para validar solicitudes, invitaciones y perfiles cruzados, crear usuarios temporales desde el dashboard de Supabase o desde el flujo real de registro.
- En esta sesion se validaron desde la app real: crear partido, agregar participante seguido, registrar resultado, editar resultado, cancelar partido programado, publicar partido incompleto, invitar a un jugador a un partido estructurado, crear desafio recurrente, registrar partido con marcador acumulado dentro del desafio, archivar desafio, reactivar desafio y abrir confirmacion de reset de score sin mutar datos.
- Tambien se valido por smoke test remoto que las RPC de cancelacion existen y que `notifications.related_match_id` es legible bajo RLS.
- Inicio oculta automaticamente publicaciones vencidas segun fecha/hora local.
- Feed, notificaciones, actividad de perfil, historial y desafios cargan cards en tandas bajo demanda; esto reduce listas largas renderizadas de golpe sin borrar datos historicos.

## Marca y cache PWA

- Los SVG fuente viven en `assets/`.
- La app carga SVG desde `public/`.
- Si cambia `assets/logo-padelito.svg` o `assets/app-icon.svg`, sincronizar tambien `public/logo-padelito.svg` y `public/app-icon.svg`.
- Si hay una PWA instalada o service worker activo, incrementar `staticCacheName` en `public/service-worker.js` para evitar recursos viejos.

## Git local

Git fue instalado a nivel de usuario. En esta sesion puede usarse por ruta explicita:

```txt
C:\Users\Mauricio\AppData\Local\Programs\Git\cmd\git.exe
```

Rama actual:

```txt
codex/base-mvp-local
```

Remoto GitHub:

```txt
https://github.com/MauricioLaratro/padelito.git
```

Rama publicada:

```txt
origin/codex/base-mvp-local
```

## Deploy

Cloudflare Pages:

- project name beta: `padelito-posadas`
- URL publica gratuita: `https://padelito-posadas.pages.dev`
- project name de respaldo temporal: `padelito-respaldo`
- URL de respaldo temporal: `https://padelito-29z.pages.dev`
- deploys automaticos del respaldo: desactivados
- build command: `npm run build`
- output directory: `dist`
- production branch: `codex/base-mvp-local`
- fuente GitHub: `MauricioLaratro/padelito`
- variables configuradas en Cloudflare Pages:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_PUSH_WORKER_URL`
  - `VITE_PUSH_PUBLIC_KEY`

Deploy directo alternativo desde esta maquina:

```powershell
$env:CLOUDFLARE_API_TOKEN="token-con-permiso-pages"
npx wrangler pages deploy dist --project-name=padelito --branch=codex/base-mvp-local --commit-dirty=true
```

Estado:

- Proyecto Pages creado por API.
- Variables publicas de Supabase configuradas para preview y produccion.
- Conexion GitHub reconectada desde Cloudflare Pages.
- Primer deploy productivo creado por API.
- Deployment verificado: `68c0a851-dd11-4aa0-b6ed-8a08db1cadc1`.
- `https://padelito-posadas.pages.dev` responde `200`.
- Assets productivos JS/CSS responden `200`.
- Se elimino `wrangler.jsonc` porque Cloudflare Pages lo tomaba como fuente de configuracion del build y no inyectaba las variables `VITE_SUPABASE_*` configuradas en el dashboard.
- El service worker usa cache `padelito-static-v3` y no cachea `/` ni `index.html` como cache-first para evitar pantallas viejas despues de un deploy.
- El JS productivo fue verificado con URL y publishable key de Supabase embebidas por Vite.

Deploy manual alternativo desde esta maquina:

1. Crear un API Token de Cloudflare con permisos de Pages.
2. Definir `CLOUDFLARE_API_TOKEN` en la terminal local.
3. Ejecutar el comando de deploy directo anterior.

Auth en el dominio Pages:

1. Supabase Dashboard > Authentication > Providers > Email: `Confirm email` desactivado para preview cerrado.
2. Supabase Dashboard > Authentication > URL Configuration: agregar `https://padelito-posadas.pages.dev` como URL permitida.

## Automatizacion de publicaciones

Comandos locales:

```powershell
npm run social:generate
npm run social:publish:meta
```

Variables para `.env.social.example` o secretos de GitHub:

```txt
META_GRAPH_VERSION=v25.0
META_ACCESS_TOKEN=
META_IG_USER_ID=
META_PAGE_ID=
META_PUBLISH_FACEBOOK=false
META_PUBLISH_STORY=true
PUBLIC_MEDIA_BASE_URL=
```

Workflow:

- archivo: `.github/workflows/social-daily.yml`;
- horario: todos los dias a las 23:30 UTC, equivalente a 20:30 de Argentina;
- genera una pieza diaria en `public/social/generated`;
- commitea la pieza para dejarla disponible como asset publico;
- usa GitHub raw como URL publica por defecto para que Meta pueda leer la imagen aunque Cloudflare tarde en desplegar;
- publica en Meta si los secretos estan configurados.
- publica Reel MP4 de 16 segundos con escenas y movimiento;
- publica Story derivada;
- si no se genera MP4, cancela la publicacion para evitar un Reel estatico.

Cloudflare Pages tiene un deploy hook configurado para forzar builds de `codex/base-mvp-local` cuando el despliegue automatico no se dispare desde GitHub.

Pendiente externo:

- cargar `META_ACCESS_TOKEN`, `META_IG_USER_ID` y `META_PAGE_ID` como secretos del repositorio;
- reemplazar el token temporal por uno de larga duracion o renovarlo antes de que expire.
- cuando TikTok apruebe `video.publish`, cargar `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` y `TIKTOK_REFRESH_TOKEN` como secretos del repositorio.

URLs usadas por Meta Developers:

- Politica de privacidad: `https://padelito-posadas.pages.dev/privacy.html`
- Terminos: `https://padelito-posadas.pages.dev/terms.html`
- Eliminacion de datos: `https://padelito-posadas.pages.dev/data-deletion.html`

URL verificada por TikTok Developers:

- Archivo de verificacion: `https://padelito-posadas.pages.dev/tiktokIQVmKsgSVd58I3YRk4JsQIkleWtZGTuw.txt`

Requisitos visibles para TikTok Developers:

- Website URL: `https://padelito-posadas.pages.dev/`
- Privacy Policy: `https://padelito-posadas.pages.dev/privacy.html`
- Terms of Service: `https://padelito-posadas.pages.dev/terms.html`
- La homepage debe mostrar links activos a Privacy Policy y Terms of Service sin login.
- Privacy y Terms deben mostrar favicon, icono de Padelito y titulo con el nombre de la app.

Autorizacion TikTok:

```powershell
npm run social:tiktok:auth-url
$env:TIKTOK_AUTH_CODE="codigo_devuelto_por_tiktok"
npm run social:tiktok:exchange-token
```

El `refresh_token` resultante debe guardarse como secreto `TIKTOK_REFRESH_TOKEN`.
