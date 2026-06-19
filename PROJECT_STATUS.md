# PROJECT STATUS - PADELITO

Este archivo debe ser actualizado durante el desarrollo.

## Estado actual

MVP local testeable disponible, publicado en GitHub y con Supabase conectado localmente. Auth real ahora soporta login cotidiano con email/contraseña, registro con nombre de usuario y doble contraseña, recuperación de contraseña por email y sesión persistente. El módulo de partidos ya cubre historial, resultados, estadísticas, búsqueda de jugadores y desafíos recurrentes.

- App React/Vite levantada en `http://localhost:5173` durante esta sesion.
- Preview estatico de respaldo disponible en `http://localhost:4173`.
- Dependencias instaladas con `npm install`.
- Build productivo verificado con `npm run build`.
- Lint verificado con `npm run lint`.
- Dominio, repositorio local, repositorio Supabase, remoto GitHub, pantallas MVP y migracion Supabase inicial creados.
- Proyecto Supabase conectado: `zrddjpvtkqebvmazauhu`.
- `.env.local` creado localmente con URL y publishable key de Supabase. No se versiona.
- Migraciones incrementales aplicadas en Supabase Cloud para invitaciones vinculadas, cupos `0-24`, RPC de respuestas, contacto privado post-aceptacion, historial estructurado de partidos, enlace entre feed social y partidos, y desafios recurrentes.
- Migracion de reset de score aplicada en Supabase Cloud con RPC controlado y bloqueo de edicion directa por REST.
- Migracion de actividad operativa aplicada en Supabase Cloud: refresco dinamico, borrado de avisos, cancelacion de participaciones aceptadas y recordatorios de resultado.
- Cloudflare Pages creado en plan gratuito con proyecto `padelito` y dominio `https://padelito-29z.pages.dev`, pendiente de primer deploy.

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
- Auth real usa email/contraseña para el acceso diario y mantiene modo demo local cuando Supabase no está configurado.
- Supabase mantiene sesion persistente en el navegador con refresh automatico de token.
- Magic link fue retirado de la UI para que el email quede reservado a recuperación de contraseña.
- Registro pide email, nombre de usuario, contraseña y repetición de contraseña; el nombre queda guardado en metadata de Auth para prellenar onboarding.
- Recuperación de contraseña usa `resetPasswordForEmail` y completa el cambio con `updateUser` cuando vuelve el enlace.
- Para preview cerrado sin costo se recomienda desactivar `Confirm email` en Supabase Auth > Providers > Email; antes de un lanzamiento público abierto debe revaluarse junto con SMTP propio.
- Para que recuperacion de contrasena funcione en Pages, Supabase Auth debe permitir `https://padelito-29z.pages.dev` en URL Configuration.
- La app usa un contrato de repositorio compartido para alternar modo local y modo Supabase sin cambiar componentes.
- No se crean `.gitkeep` vacios; las carpetas se crean cuando tienen archivos reales.
- Partidos completos, participantes variables, resultados y estadisticas simples ya viven como modulo separado del feed.
- Los resultados de partidos solo pueden registrarse o editarse por el creador del partido.
- El score visible del perfil puede resetearse desde una accion propia, sin editar resultados historicos ni permitir fecha arbitraria desde el cliente.
- Un partido estructurado puede publicarse como `Busco jugador` y conservar enlace `source_post_id`.
- Invitaciones directas pueden vincularse a `related_match_id`; al aceptarse agregan participante al partido.
- Desafios recurrentes se modelan como entidad propia y los marcadores se calculan desde partidos/resultados vinculados, sin agregados materializados.
- Invitaciones directas pueden vincularse a un partido propio abierto; si se aceptan, descuentan cupo y el partido queda completo cuando faltantes llega a `0`.
- Las aceptaciones remotas de solicitudes e invitaciones deben pasar por funciones SQL `answer_match_join_request` y `answer_direct_match_invitation`, evitando updates directos que no descuenten cupo.
- Los perfiles publicos se leen sin `whatsapp_phone`; el contacto privado queda fuera del snapshot general.
- El contacto privado se consulta por RPC solo para el propio usuario o perfiles vinculados por solicitud/invitacion aceptada.
- El formulario de perfil se reutiliza entre onboarding y edicion para evitar duplicar reglas.
- El avatar de perfil se maneja con componente reutilizable, recorte cuadrado client-side y persistencia en el bucket `avatars`.
- El WhatsApp del perfil usa prefijo argentino fijo `+549` y guarda el numero normalizado sin duplicar prefijos.
- Feed, jugadores, notificaciones y perfil comparten un componente reutilizable de pull-to-refresh que recarga el snapshot remoto.
- La bandeja de notificaciones es operativa: se puede marcar todo como leido o eliminar avisos propios con gesto hacia la derecha.
- Solicitudes e invitaciones aceptadas pueden cancelarse desde ambos lados del vinculo y liberan cupo/participante cuando corresponde.
- Los recordatorios de resultado se materializan al refrescar/abrir la app cuando un partido propio programado ya termino.
- Cuando el creador registra resultado, los participantes reciben una notificacion informativa.

## Riesgos tecnicos

- RLS de Supabase requiere mucho cuidado por publicaciones `public` y `followers_only`.
- La lectura de perfiles debe mantener columnas explicitas para no reexponer contacto privado.
- La RPC de contacto privado debe mantenerse como unico camino para leer `whatsapp_phone` desde cliente.
- Los partidos estructurados usan ids UUID puros porque `match_records`, `match_participants` y `match_results` enlazan columnas `uuid`.
- La RLS de partidos requiere evitar recursividad entre `match_records` y `match_participants`; se centraliza lectura en `can_read_match(uuid, uuid)`.
- El reset de estadisticas debe mantenerse como accion controlada por RPC; no debe exponerse como update directo de `profiles.match_stats_reset_at`.
- Las fotos de perfil subidas a Storage pueden dejar archivos anteriores sin limpiar; para MVP se acepta y queda como optimizacion futura si el volumen crece.
- La RLS de desafios recurrentes tambien evita recursion directa; se centraliza lectura en `can_read_recurring_challenge(uuid, uuid)`.
- Las aceptaciones sociales ahora modifican cupos y participantes desde RPC security definer para evitar writes directos inseguros desde cliente.
- Las cancelaciones de participaciones aceptadas dependen de RPC security definer para mantener consistencia entre `posts`, `match_records` y `match_participants`.
- Los recordatorios de resultado no usan scheduler externo en el MVP; se crean al cargar/refrescar snapshot, por lo que no existen hasta que el creador vuelve a abrir o refrescar la app.
- Notificaciones web tienen restricciones diferentes entre iPhone y Android.
- Desactivar `Confirm email` reduce fricción y evita rate limit en registro, pero implica aceptar cuentas sin verificación de correo durante el preview cerrado.
- El deploy directo de Pages desde esta maquina requiere `CLOUDFLARE_API_TOKEN`; la API MCP pudo crear/configurar el proyecto, pero no subir archivos locales sin ese token.
- La conexion Pages GitHub devolvio error interno de instalacion Git de Cloudflare, por lo que requiere reconexion manual de la app GitHub de Pages o token local para deploy directo.
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
- Desafios recurrentes:
  - migracion `202606110002_recurring_challenges.sql` aplicada en Supabase Cloud;
  - tablas `recurring_challenges` y `recurring_challenge_participants` creadas con RLS;
  - `match_records.recurring_challenge_id` instalado para asociar partidos al desafio;
  - perfil muestra seccion `Desafios / Recurrentes`;
  - creacion de desafio con participante seguido validada en navegador integrado contra Supabase;
  - creacion de partido vinculado a desafio validada contra Supabase;
  - marcador acumulado 1-0 calculado desde resultado vinculado validado en perfil;
  - archivar y reactivar desafio propio validado contra Supabase;
  - `npm run build` pasa;
  - `npm run lint` pasa.
- Reset de score e historial:
  - migracion `202606180001_profile_match_stats_reset.sql` aplicada en Supabase Cloud;
  - columna `profiles.match_stats_reset_at` instalada;
  - RPC `reset_own_match_stats()` instalada y verificada;
  - trigger `profiles_prevent_match_stats_reset_direct_update` instalado y verificado;
  - repositorio Supabase usa RPC y no update directo para resetear score;
  - smoke test Supabase valida que `match_stats_reset_at` no pueda editarse directo por REST;
  - perfil muestra accion `Resetear score` con confirmacion y se cancelo sin mutar datos;
  - build y lint pasan.
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
- Cierre MVP automatizado:
  - confirmaciones UI agregadas para cancelar publicaciones, solicitudes, invitaciones, partidos, rechazos y archivo de desafios;
  - confirmacion visual validada en navegador integrado sin ejecutar la accion destructiva;
  - script `npm run qa:supabase` agregado para smoke test de Auth/RLS/privacidad sin mutar datos;
  - smoke test Supabase ejecutado con usuario de prueba: `status: ok`;
  - el smoke test valido bloqueo de `whatsapp_phone`, bloqueo de update directo de `match_stats_reset_at`, lectura publica de perfiles sin telefono, notificaciones propias, solicitudes/invitaciones relacionadas, partidos visibles, desafios visibles y RPC de contacto privado;
  - auditoria estatica no encontro `select("*")` en `src`/`scripts` ni lecturas directas de `whatsapp_phone` desde UI publica;
  - segunda sesion queda soportada por `PADELITO_QA_SECOND_EMAIL` y `PADELITO_QA_SECOND_PASSWORD`, pendiente de credencial real secundaria;
  - email Auth revisado contra documentacion oficial de Supabase: SMTP default no es produccion y requiere SMTP propio antes de lanzamiento publico.
- Refinamiento UX local:
  - feed mobile compactado con acceso rapido corto, filtros plegados y cards visibles en el primer viewport;
  - perfil prioriza actividad propia antes de historial/desafios;
  - avatar circular reutilizable agregado en perfil, feed y busqueda de jugadores;
  - formulario de perfil permite agregar/cambiar foto y prepara la imagen a 512x512 para buen encuadre circular;
  - WhatsApp en perfil muestra `+549` fijo y normaliza pegado de numeros completos como `+5493764...` a solo numero local;
  - verificacion mobile confirmo `scrollWidth` menor al viewport y normalizacion correcta del input;
  - `npm run qa:supabase` pasa con usuarios de prueba.
- Correccion de permisos de perfil:
  - se reemplazo `upsert` de perfiles por estrategia `update` propio e `insert` solo si no existe fila;
  - esto mantiene bloqueada la edicion directa de `match_stats_reset_at` sin pedir `UPDATE` total sobre `profiles`;
  - prueba directa contra Supabase confirmo update de WhatsApp sin error `42501`;
  - prueba directa contra Storage confirmo subida permitida al bucket `avatars`.
- Actividad operativa y refresco:
  - migracion `202606180002_activity_refresh_and_cancellations.sql` aplicada en Supabase Cloud;
  - `notifications.related_match_id` instalado para enlazar recordatorios y resultados con partidos;
  - RPCs `cancel_match_join_request(uuid)` y `cancel_direct_match_invitation(uuid)` instaladas y verificadas;
  - RPC `answer_direct_match_invitation` actualizada para descontar cupo aunque la invitacion venga vinculada por `related_match_id`;
  - feed, jugadores, notificaciones y perfil usan pull-to-refresh compartido;
  - notificaciones propias pueden eliminarse con swipe hacia la derecha o boton contextual;
  - perfil permite eliminar publicaciones canceladas, solicitudes cerradas e invitaciones cerradas;
  - perfil permite cancelar participaciones aceptadas desde organizador o jugador;
  - `npm run build` pasa;
  - `npm run lint` pasa;
  - `npm run qa:supabase` pasa con `test@padelito.test` y `test2@padelito.test`;
  - verificacion puntual confirma columna `notifications.related_match_id` y RPCs de cancelacion disponibles;
  - navegador integrado cargo `http://127.0.0.1:5173/` sin errores de consola.
- Auditoría Auth/textos:
  - formulario de registro actualizado a email, nombre de usuario, contraseña y repetición de contraseña;
  - magic link retirado de la UI y del contrato expuesto por el hook principal;
  - recuperación de contraseña queda como único flujo visible que envía email;
  - traductor de errores Auth/Supabase ampliado para evitar alerts crudos en inglés;
  - textos visibles y `aria-label` revisados para corregir errores de acentos obvios;
  - `npm run build` pasa;
  - `npm run lint` pasa;
  - `npm run qa:supabase` pasa con usuarios de prueba;
  - navegador integrado no pudo mostrar el dashboard de Supabase Auth porque la página quedó sin DOM visible; queda pendiente desactivar `Confirm email` desde Authentication > Providers > Email.
- Cloudflare Pages:
  - proyecto Pages `padelito` creado por API en la cuenta Cloudflare;
  - dominio gratuito asignado: `https://padelito-29z.pages.dev`;
  - rama de produccion configurada: `codex/base-mvp-local`;
  - variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas en preview y produccion;
  - `wrangler.jsonc` agregado para deploy directo desde `dist`;
  - `npm run build` y `npm run lint` pasan antes del intento de deploy;
  - deploy directo con `wrangler pages deploy` quedo bloqueado por falta de `CLOUDFLARE_API_TOKEN`;
  - intento de conectar GitHub por API fallo con error interno de la instalacion Cloudflare Pages Git.

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
- Commit login diario: `eae4a22 Agregar login con contrasena y sesion persistente`.
- Commit acceso/marca: `c800185 Corregir acceso y actualizar marca`.
- Commit test/busqueda: `e73ae49 Documentar usuario de prueba y busqueda de jugadores`.
- Commit invitaciones/cupos: `dc4d4b0 Vincular invitaciones a partidos y cupos`.
- Commit gestion social: `edc76d3 Completar gestion social y privacidad`.
- Commit perfil/contacto: `3c0cefe Completar perfil y contacto privado`.
- Commit historial: `d24f0ed Agregar historial de partidos y estadisticas`.
- Commit enlace partidos/social: `194ee3e Vincular partidos con solicitudes e invitaciones`.
- Commit desafios: `1fb0348 Agregar desafios recurrentes`.
- Commit archivar desafios: `5debea7 Permitir archivar desafios recurrentes`.
- Commit QA/privacidad: `852947b Cerrar QA y privacidad del MVP`.
- Commit reset score: `62812ee Ajustar historial y reset de score`.
- Commit UX perfil: `0c07089 Refinar perfil y experiencia mobile`.
- Commit permisos perfil: `61f614b Corregir permisos al guardar perfil`.
- Commit auth/textos: `Ajustar registro y textos de auth`.
- Commit deploy Cloudflare: `Preparar despliegue gratuito en Cloudflare`.

## Regla de idioma

- Codigo: nombres internos en ingles.
- Documentacion, versionamiento y comunicacion con el usuario: siempre en espanol.

## Pendientes inmediatos

- Probar aceptacion de solicitud/invitacion vinculada con dos sesiones reales y verificar participante agregado en ambos perfiles.
- Probar manualmente cancelacion de jugador aceptado desde organizador y desde jugador.
- Probar manualmente swipe-to-delete de notificaciones en celular.
- Probar manualmente carga/cambio de foto de perfil con imagen real desde el navegador.
- Pulir UX con screenshots mobile despues de cerrar flujos principales.
- Desactivar `Confirm email` en Supabase Auth > Providers > Email para probar registro directo sin correo.
- Agregar `https://padelito-29z.pages.dev` como URL permitida en Supabase Auth.
- Definir `CLOUDFLARE_API_TOKEN` local o reconectar GitHub en Cloudflare Pages para ejecutar el primer deploy.
- Separar historial operativo antiguo en un menu secundario si el perfil vuelve a crecer demasiado.
- Configurar SMTP propio en Supabase Auth cuando haya proveedor y credenciales.
- Preparar deploy Cloudflare Pages.
