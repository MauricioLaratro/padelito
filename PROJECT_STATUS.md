# PROJECT STATUS - PADELITO

Este archivo debe ser actualizado durante el desarrollo.

## Estado actual

MVP local testeable disponible, publicado en GitHub y con Supabase conectado localmente. Auth real ahora soporta login cotidiano con email/contrasena, registro, recuperacion de contrasena, sesion persistente y magic link como alternativa.

- App React/Vite levantada en `http://localhost:5173` durante esta sesion.
- Preview estatico de respaldo disponible en `http://localhost:4173`.
- Dependencias instaladas con `npm install`.
- Build productivo verificado con `npm run build`.
- Lint verificado con `npm run lint`.
- Dominio, repositorio local, repositorio Supabase, remoto GitHub, pantallas MVP y migracion Supabase inicial creados.
- Proyecto Supabase conectado: `zrddjpvtkqebvmazauhu`.
- `.env.local` creado localmente con URL y publishable key de Supabase. No se versiona.
- Migraciones incrementales aplicadas en Supabase Cloud para invitaciones vinculadas, cupos `0-24`, RPC de respuestas, contacto privado post-aceptacion, historial estructurado de partidos y enlace entre feed social y partidos.

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
- Supabase queda conectado por cliente browser con fallback demo local.
- Auth real usa email/contrasena para el acceso diario, magic link como alternativa y mantiene modo demo local.
- Supabase mantiene sesion persistente en el navegador con refresh automatico de token.
- Magic link queda como alternativa secundaria; Supabase controla su rate limit y la app muestra mensajes humanos.
- Recuperacion de contrasena usa `resetPasswordForEmail` y completa el cambio con `updateUser` cuando vuelve el enlace.
- La app usa un contrato de repositorio compartido para alternar modo local y modo Supabase sin cambiar componentes.
- No se crean `.gitkeep` vacios; las carpetas se crean cuando tienen archivos reales.
- Partidos completos, participantes variables, resultados y estadisticas simples ya viven como modulo separado del feed.
- Un partido estructurado puede publicarse como `Busco jugador` y conservar enlace `source_post_id`.
- Invitaciones directas pueden vincularse a `related_match_id`; al aceptarse agregan participante al partido.
- Desafios recurrentes quedan como pendiente MVP+ posterior, sin bloquear el MVP testeable.
- Invitaciones directas pueden vincularse a un partido propio abierto; si se aceptan, descuentan cupo y el partido queda completo cuando faltantes llega a `0`.
- Las aceptaciones remotas de solicitudes e invitaciones deben pasar por funciones SQL `answer_match_join_request` y `answer_direct_match_invitation`, evitando updates directos que no descuenten cupo.
- Los perfiles publicos se leen sin `whatsapp_phone`; el contacto privado queda fuera del snapshot general.
- El contacto privado se consulta por RPC solo para el propio usuario o perfiles vinculados por solicitud/invitacion aceptada.
- El formulario de perfil se reutiliza entre onboarding y edicion para evitar duplicar reglas.

## Riesgos tecnicos

- RLS de Supabase requiere mucho cuidado por publicaciones `public` y `followers_only`.
- La lectura de perfiles debe mantener columnas explicitas para no reexponer contacto privado.
- La RPC de contacto privado debe mantenerse como unico camino para leer `whatsapp_phone` desde cliente.
- Los partidos estructurados usan ids UUID puros porque `match_records`, `match_participants` y `match_results` enlazan columnas `uuid`.
- La RLS de partidos requiere evitar recursividad entre `match_records` y `match_participants`; se centraliza lectura en `can_read_match(uuid, uuid)`.
- Las aceptaciones sociales ahora modifican cupos y participantes desde RPC security definer para evitar writes directos inseguros desde cliente.
- Notificaciones web tienen restricciones diferentes entre iPhone y Android.
- El perfil como centro de actividad puede generar consultas complejas si no se separan repositorios y casos de uso.
- Git fue instalado a nivel de usuario y se creo el commit inicial local.
- El remoto GitHub ya esta configurado y la rama base del MVP fue publicada.
- La migracion inicial tenia una funcion SQL creada antes de sus tablas dependientes; se corrigio moviendo `can_read_post` despues de `posts` y `follows`.

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
- Marca:
  - `public/logo-padelito.svg` sincronizado con `assets/logo-padelito.svg`;
  - `public/app-icon.svg` sincronizado con `assets/app-icon.svg`;
  - cache PWA actualizado a `padelito-static-v2` para limpiar SVG obsoletos.
- Solicitudes:
  - enviar solicitud cambia el CTA a `Cancelar solicitud`;
  - card de partido se resalta con estado `Solicitud Pendiente`;
  - perfil del solicitante muestra card contextual en `Solicitudes enviadas`;
  - cancelar desde perfil revierte el feed a `Solicitar unirme`;
  - build y lint siguen correctos.
- Feed:
  - pull-to-refresh mobile preparado en el tope del feed;
  - refresca estado local en modo demo;
  - recarga snapshot remoto en modo Supabase.
- GitHub:
  - remoto `origin` configurado;
  - rama `codex/base-mvp-local` publicada en `origin/codex/base-mvp-local`.
- Supabase:
  - SQL Editor ejecuto `supabase/migrations/202606090001_initial_schema.sql` corregida;
  - verificacion compacta devolvio `schema_ok`;
  - tablas, funcion `can_read_post` y buckets `avatars` / `event-images` quedaron creados;
  - usuarios de prueba gestionados desde Supabase Auth y base de datos, sin credenciales versionadas;
  - migracion `202606100001_link_invitations_to_posts_and_slots.sql` aplicada y verificada con `true` en columna, RPCs y constraint;
  - migracion `202606100002_restrict_profile_contact_visibility.sql` aplicada y verificada: `whatsapp_phone` no es legible por `anon` ni `authenticated`;
  - migracion `202606100003_private_profile_contact_rpc.sql` aplicada y verificada: `get_profile_private_contact(uuid)` existe y `authenticated` puede ejecutarla;
  - login por magic link y perfil real validados por el usuario;
  - cerrar sesion vuelve a AuthScreen sin borrar perfil ni actividad persistida;
  - login/registro por email y contrasena implementados en la app;
  - recuperacion y creacion de contrasena para cuentas existentes implementada;
  - sesion persistente se recupera al cargar la app antes de mostrar el formulario;
  - magic link queda como alternativa sin cooldown local persistido;
  - `npm run build` pasa con repositorio Supabase y Auth real;
  - `npm run lint` pasa.
- Partidos e historial:
  - migracion `202606100004_match_history.sql` aplicada en Supabase Cloud;
  - migracion `202606100005_fix_match_history_rls.sql` aplicada en Supabase Cloud;
  - tablas `match_records`, `match_participants` y `match_results` creadas con RLS;
  - perfil muestra historial, jugados, ganados, perdidos y efectividad;
  - creacion de partido con participante seguido validada en navegador integrado;
  - registro de resultado al crear partido validado contra Supabase;
  - edicion de resultado validada contra Supabase;
  - cancelacion de partido programado validada contra Supabase;
  - migracion `202606110001_link_matches_to_social_flows.sql` aplicada en Supabase Cloud;
  - creacion de partido incompleto desde historial validada contra Supabase;
  - publicacion `Busco jugador` vinculada a `match_records.source_post_id` validada en feed y perfil;
  - invitacion directa vinculada a `direct_match_invitations.related_match_id` validada contra Supabase;
  - `npm run build` pasa;
  - `npm run lint` pasa.
- Bloque invitaciones/notificaciones:
  - selector de partido agregado al modal de invitacion cuando el usuario tiene partidos propios abiertos;
  - notificaciones de solicitudes e invitaciones ahora se expanden y muestran acciones contextuales;
  - perfil muestra invitaciones enviadas y recibidas como cards con contexto;
  - cupos faltantes permiten `0-24` en UI, dominio y migracion;
  - publicaciones propias activas pueden cancelarse desde feed y perfil;
  - invitaciones enviadas pendientes pueden cancelarse desde perfil;
  - busqueda de jugadores y perfil publico implementados con follow e invitacion;
  - modo demo queda oculto cuando Supabase esta configurado;
  - edicion de perfil implementada desde Perfil con formulario reutilizable;
  - contacto WhatsApp aparece solo en solicitudes o invitaciones aceptadas;
  - notificaciones contextuales permiten abrir perfil y contacto aceptado;
  - feed suma filtros por fecha, categoria, posicion y estilo de juego;
  - `npm run build` pasa;
  - `npm run lint` pasa.

## Git

- Rama local: `codex/base-mvp-local`.
- Remoto: `origin` -> `https://github.com/MauricioLaratro/padelito.git`.
- Rama remota publicada: `origin/codex/base-mvp-local`.
- Commit inicial: `f5751ac Construir base local del MVP`.
- Commit UX: `5244e9d Corregir bloqueos UX mobile del MVP`.
- Commit solicitudes: `402da64 Mejorar flujo de solicitudes de partido`.
- Commit partidos e historial: `0dc3cb7 Refinar modulo de partidos e historial`.
- Commit GitHub: `2b7b811 Documentar publicacion en GitHub`.
- Commit Supabase/Auth: `acf5a94 Conectar Supabase y auth real`.
- Commit logout/UI: `72fc11a Agregar cierre de sesion y limpiar UI`.
- Commit perfil/contacto: `3c0cefe Completar perfil y contacto privado`.

## Regla de idioma

- Codigo: nombres internos en ingles.
- Documentacion, versionamiento y comunicacion con el usuario: siempre en espanol.

## Pendientes inmediatos

- Probar aceptacion de solicitud/invitacion vinculada con dos sesiones reales y verificar participante agregado en ambos perfiles.
- Disenar e implementar desafios recurrentes entre parejas o grupos.
- Pulir UX con screenshots mobile despues de cerrar flujos principales.
- Preparar deploy Cloudflare Pages.
