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
2. Ejecutar `supabase/migrations/202606090001_initial_schema.sql`.
3. Copiar URL y publishable/anon key al `.env.local`.

La migracion ya crea tablas, enums, politicas RLS y buckets.

Estado de esta instancia:

- Proyecto Supabase: `zrddjpvtkqebvmazauhu`.
- Migracion inicial ejecutada desde SQL Editor.
- Verificacion SQL: `schema_ok`.
- Buckets creados por migracion: `avatars` y `event-images`.

## Sesion de usuario

- Acceso real: el usuario ingresa con el mismo email y recibe magic link.
- Persistencia: Supabase mantiene el perfil en `public.profiles` vinculado a `auth.users.id`.
- Cierre de sesion: desde Perfil, `Cerrar sesion` elimina la sesion local del navegador pero no borra datos.
- Reingreso: usando el mismo email, Supabase recupera el mismo usuario y la app vuelve a cargar su perfil y actividad.

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

- build command: `npm run build`
- output directory: `dist`
