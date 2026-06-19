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

- project name: `padelito`
- URL publica gratuita: `https://padelito-29z.pages.dev`
- build command: `npm run build`
- output directory: `dist`
- production branch: `codex/base-mvp-local`
- fuente GitHub: `MauricioLaratro/padelito`
- variables configuradas en Cloudflare Pages:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Archivo local de configuracion:

```txt
wrangler.jsonc
```

Deploy directo desde esta maquina:

```powershell
$env:CLOUDFLARE_API_TOKEN="token-con-permiso-pages"
npx wrangler pages deploy dist --project-name=padelito --branch=codex/base-mvp-local --commit-dirty=true
```

Estado:

- Proyecto Pages creado por API.
- Variables publicas de Supabase configuradas para preview y produccion.
- Conexion GitHub reconectada desde Cloudflare Pages.
- Primer deploy productivo creado por API.
- Deployment verificado: `ec22e408-caad-4e9d-bf39-a4a52a502f96`.
- `https://padelito-29z.pages.dev` responde `200`.
- Assets productivos JS/CSS responden `200`.

Deploy manual alternativo desde esta maquina:

1. Crear un API Token de Cloudflare con permisos de Pages.
2. Definir `CLOUDFLARE_API_TOKEN` en la terminal local.
3. Ejecutar el comando de deploy directo anterior.

Auth en el dominio Pages:

1. Supabase Dashboard > Authentication > Providers > Email: `Confirm email` desactivado para preview cerrado.
2. Supabase Dashboard > Authentication > URL Configuration: `https://padelito-29z.pages.dev` agregado como URL permitida.
