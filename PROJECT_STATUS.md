# PROJECT STATUS - PADELITO

Este archivo debe ser actualizado durante el desarrollo.

## Estado actual

MVP local testeable disponible.

- App React/Vite levantada en `http://localhost:5173`.
- Preview estatico de respaldo disponible en `http://localhost:4173`.
- Dependencias instaladas con `npm install`.
- Build productivo verificado con `npm run build`.
- Lint verificado con `npm run lint`.
- Dominio, repositorio local, pantallas MVP y migracion Supabase inicial creados.

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

## Riesgos tecnicos

- RLS de Supabase requiere mucho cuidado por publicaciones `public` y `followers_only`.
- Notificaciones web tienen restricciones diferentes entre iPhone y Android.
- El perfil como centro de actividad puede generar consultas complejas si no se separan repositorios y casos de uso.
- Git fue instalado a nivel de usuario y se creo el commit inicial local.
- No hay remoto GitHub configurado en este repo local.

## Verificacion realizada

- Node.js LTS + npm instalados a nivel de usuario.
- Git disponible por ruta explicita: `C:\Users\Mauricio\AppData\Local\Programs\Git\cmd\git.exe`.
- `http://localhost:4173` responde `200`.
- `http://localhost:5173` responde `200`.
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

## Git

- Rama local: `codex/base-mvp-local`.
- Commit inicial: `f5751ac Construir base local del MVP`.
- Commit UX: `5244e9d Corregir bloqueos UX mobile del MVP`.
- Remotos configurados: ninguno.

## Regla de idioma

- Código: nombres internos en inglés.
- Documentación, versionamiento y comunicación con el usuario: siempre en español.

## Pendientes inmediatos

- Crear repositorios Supabase reales cuando existan credenciales.
- Conectar pull-to-refresh al refetch real de publicaciones Supabase.
- Probar migracion SQL en un proyecto Supabase.
- Pulir UX con screenshots mobile.
- Configurar remoto GitHub cuando exista URL local o `gh` CLI.
