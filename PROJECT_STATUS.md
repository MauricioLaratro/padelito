# PROJECT STATUS - PADELITO

Este archivo debe ser actualizado durante el desarrollo.

## Estado actual

MVP local testeable disponible y publicado en GitHub.

- App React/Vite levantada en `http://localhost:5174` durante esta sesion.
- Preview estatico de respaldo disponible en `http://localhost:4173`.
- Dependencias instaladas con `npm install`.
- Build productivo verificado con `npm run build`.
- Lint verificado con `npm run lint`.
- Dominio, repositorio local, remoto GitHub, pantallas MVP y migracion Supabase inicial creados.

## Comprension del producto

Padelito es una PWA mobile-first para comunidad local de padel. El MVP centraliza oportunidades que hoy viven en WhatsApp, Instagram y Facebook: encontrar jugadores, encontrar partidos, descubrir eventos y conectar perfiles. No reemplaza WhatsApp; deriva a WhatsApp cuando la coordinacion final lo requiere.

## Decisiones tomadas

- Producto: PWA mobile-first.
- Nombre: Padelito.
- Stack: Vite + React + TypeScript + Tailwind + Supabase + Cloudflare Pages.
- Navegacion principal: tabs flotantes Comunidad / Siguiendo.
- Creacion: boton flotante inferior derecho.
- MVP sin app nativa, rankings, marketplace, chat, geolocalizacion ni torneos internos.
- Repositorio local temporal para probar flujos sin pedir credenciales.
- Supabase queda preparado como cliente y contrato backend, pero sin exigir URL ni anon key todavia.
- No se crean `.gitkeep` vacios; las carpetas se crean cuando tienen archivos reales.
- Partidos completos, resultados, estadisticas y desafios recurrentes quedan refinados como MVP+ para no desplazar el nucleo actual.

## Riesgos tecnicos

- RLS de Supabase requiere mucho cuidado por publicaciones `public` y `followers_only`.
- Notificaciones web tienen restricciones diferentes entre iPhone y Android.
- El perfil como centro de actividad puede generar consultas complejas si no se separan repositorios y casos de uso.
- Git fue instalado a nivel de usuario y se creo el commit inicial local.
- El remoto GitHub ya esta configurado y la rama base del MVP fue publicada.

## Verificacion realizada

- Node.js LTS + npm instalados a nivel de usuario.
- Git disponible por ruta explicita: `C:\Users\Mauricio\AppData\Local\Programs\Git\cmd\git.exe`.
- `http://localhost:4173` responde `200`.
- `http://localhost:5173` respondio `200` en validaciones previas.
- `http://localhost:5174` usado como puerto de desarrollo fresco para evitar cache vieja del service worker.
- `npm run build` pasa.
- `npm run lint` pasa.
- Browser integrado confirmo:
  - titulo `Padelito Preview`;
  - cards `Busco jugador`, `Estoy disponible`, `Americano nocturno`;
  - tab `Siguiendo` filtra contenido;
  - modal `Nueva publicacion` abre correctamente.
- Browser integrado confirmo en React:
  - feed con cards por tipo;
  - modal de publicacion `Nueva publicacion`;
  - filtros de feed;
  - navegacion a perfil y notificaciones disponible.
- Revision mobile 390px:
  - overflow horizontal corregido;
  - estados internos traducidos;
  - service worker deshabilitado en desarrollo para evitar pantalla blanca por cache;
  - scroll inicial corregido al cambiar de vista/onboarding.
- Solicitudes:
  - enviar solicitud cambia el CTA a `Cancelar solicitud`;
  - card de partido se resalta con estado `Solicitud Pendiente`;
  - perfil del solicitante muestra card contextual en `Solicitudes enviadas`;
  - cancelar desde perfil revierte el feed a `Solicitar unirme`;
  - build y lint siguen correctos.
- Feed:
  - pull-to-refresh mobile preparado en el tope del feed;
  - hoy refresca estado local y queda listo para refetch Supabase.
- GitHub:
  - remoto `origin` configurado;
  - rama `codex/base-mvp-local` publicada en `origin/codex/base-mvp-local`.

## Git

- Rama local: `codex/base-mvp-local`.
- Remoto: `origin` -> `https://github.com/MauricioLaratro/padelito.git`.
- Rama remota publicada: `origin/codex/base-mvp-local`.
- Commit inicial: `f5751ac Construir base local del MVP`.
- Commit UX: `5244e9d Corregir bloqueos UX mobile del MVP`.
- Commit solicitudes: `402da64 Mejorar flujo de solicitudes de partido`.
- Commit partidos e historial: `0dc3cb7 Refinar modulo de partidos e historial`.

## Regla de idioma

- Codigo: nombres internos en ingles.
- Documentacion, versionamiento y comunicacion con el usuario: siempre en espanol.

## Pendientes inmediatos

- Crear repositorios Supabase reales cuando existan credenciales.
- Conectar pull-to-refresh al refetch real de publicaciones Supabase.
- Probar migracion SQL en un proyecto Supabase.
- Pulir UX con screenshots mobile.
- Mantener Partidos e Historial como Etapa 9, despues de consolidar backend y auth real.
