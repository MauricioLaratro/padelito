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
- Git no esta disponible en PATH, por lo que no se pudo crear commit de etapa.

## Verificacion realizada

- Node.js LTS + npm instalados a nivel de usuario.
- `git` no disponible en PATH.
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

## Pendientes inmediatos

- Crear repositorios Supabase reales cuando existan credenciales.
- Probar migracion SQL en un proyecto Supabase.
- Pulir UX con screenshots mobile.
- Crear commits por etapa cuando `git` este disponible.
