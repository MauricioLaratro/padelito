# TODO - PADELITO

## Etapa 1 - Base tecnica
- [x] Crear proyecto Vite + React + TypeScript.
- [x] Configurar Tailwind CSS con tokens de marca.
- [x] Exponer assets SVG desde `public`.
- [x] Configurar PWA manifest.
- [x] Crear service worker basico.
- [x] Crear preview local testeable sin dependencias.
- [x] Levantar preview en `http://localhost:4173`.
- [x] Instalar Node.js LTS + npm a nivel de usuario.
- [x] Instalar dependencias con `npm install`.
- [x] Verificar `npm run build`.
- [x] Verificar `npm run lint`.
- [x] Levantar app React en `http://localhost:5173`.
- [x] Crear commit inicial de etapa con Git.
- [x] Configurar remoto GitHub.
- [x] Publicar rama base del MVP en GitHub.

## Etapa 2 - Dominio y arquitectura interna
- [x] Crear modelos TypeScript de perfiles.
- [x] Crear modelos TypeScript de publicaciones.
- [x] Crear modelos TypeScript de solicitudes, invitaciones e interacciones.
- [x] Crear modelos TypeScript de notificaciones.
- [x] Crear enums y constantes reutilizables.
- [x] Crear repositorio local para validar flujos sin credenciales.
- [x] Completar componentes React de feed, perfil y notificaciones.
- [x] Conectar App React al hook `usePadelitoMvp`.

## Etapa 3 - Supabase
- [x] Preparar cliente Supabase sin exigir credenciales.
- [x] Crear migracion SQL inicial.
- [x] Crear politicas RLS.
- [x] Documentar buckets `avatars` y `event-images`.
- [x] Configurar `.env.local` con Supabase.
- [x] Ejecutar migracion inicial en Supabase Cloud.
- [x] Verificar esquema aplicado con `schema_ok`.
- [x] Crear repositorios Supabase para reemplazar repositorio local.
- [x] Crear migracion incremental para invitaciones vinculadas a partidos y cupos `0-24`.
- [x] Aplicar `supabase/migrations/202606100001_link_invitations_to_posts_and_slots.sql` en Supabase Cloud.
- [x] Restringir lectura publica de `whatsapp_phone` desde Supabase REST.

## Etapa 4 - Auth y perfiles
- [x] Auth simple con Supabase por magic link.
- [x] Auth con email y contrasena para login cotidiano.
- [x] Registro con email y contrasena.
- [x] Registro con nombre de usuario, contraseña y repetición de contraseña.
- [x] Retirar magic link de la UI para reservar emails a recuperación.
- [x] Sesion persistente al reabrir la app.
- [x] Mensajes humanos ante rate limit de emails.
- [x] Recuperacion y creacion de contrasena para cuentas existentes.
- [x] Auth demo local.
- [x] Onboarding local de perfil jugador.
- [x] Onboarding local de perfil organizacion.
- [x] Validar login magic link con email real.
- [x] Validar creacion de perfil real en Supabase.
- [x] Cerrar sesion desde perfil sin borrar datos persistidos.
- [x] Edicion de perfil.
- [x] Foto de perfil circular con carga/cambio desde edicion.
- [x] WhatsApp argentino con prefijo fijo `+549` y normalizacion de numeros pegados.
- [x] Contacto privado propio sin reexponer `whatsapp_phone` en perfiles publicos.

## Etapa 5 - Feeds
- [x] Feed Comunidad local.
- [x] Feed Siguiendo local.
- [x] Filtros MVP locales.
- [x] Filtros por fecha, categoria, posicion y estilo de juego.
- [x] Pull-to-refresh mobile preparado para refetch futuro.
- [x] Pull-to-refresh conectado a snapshot Supabase en modo remoto.
- [x] Pull-to-refresh compartido en inicio, jugadores, notificaciones y perfil.

## Etapa 6 - Publicaciones
- [x] Crear Busco jugador local.
- [x] Crear Estoy disponible local.
- [x] Crear Evento local.
- [x] Cards React por tipo.
- [x] Cancelar publicaciones propias activas para retirarlas del feed.

## Etapa 7 - Coordinacion social
- [x] Solicitudes para unirse locales.
- [x] Cancelacion de solicitudes pendientes.
- [x] Estado visual de solicitud enviada en cards.
- [x] Cards de solicitudes enviadas y recibidas en perfil.
- [x] Invitaciones directas locales.
- [x] Vincular invitaciones directas a un partido propio abierto cuando exista.
- [x] Descontar cupo y marcar partido completo al aceptar solicitudes o invitaciones.
- [x] Corregir invitaciones vinculadas a partido para descontar cupo aunque usen `related_match_id`.
- [x] Cancelar participaciones aceptadas desde organizador o jugador.
- [x] Notificaciones internas locales.
- [x] Notificaciones accionables para abrir solicitudes e invitaciones.
- [x] Eliminar notificaciones propias con swipe hacia la derecha.
- [x] Actividad en perfil local.
- [x] Eliminar publicaciones canceladas, solicitudes cerradas e invitaciones cerradas desde perfil.
- [x] Cards contextuales de invitaciones enviadas y recibidas en perfil.
- [x] Cancelar invitaciones enviadas pendientes.
- [x] Buscar jugadores por nombre.
- [x] Ver perfil publico de otro jugador.
- [x] Seguir/dejar de seguir desde perfil publico o resultado de busqueda.
- [x] Crear invitacion privada desde perfil de jugador sin publicarla en el feed.
- [x] Abrir perfil desde notificaciones contextuales.
- [x] Mostrar contacto WhatsApp solo en solicitudes o invitaciones aceptadas.

## Etapa 8 - PWA, QA y deploy
- [x] Onboarding de acceso rapido local.
- [x] Preparar arquitectura para notificaciones push.
- [x] Corregir overflow horizontal mobile.
- [x] Evitar service worker en desarrollo para no romper HMR.
- [x] Reiniciar scroll al cambiar vistas para evitar contenido tapado por tabs.
- [x] Invalidar cache PWA para refrescar SVG de marca.
- [x] Ocultar modo demo cuando Supabase esta configurado.
- [x] Compactar acceso rapido y filtros para mostrar contenido real antes en mobile.
- [x] Usar avatar reutilizable en perfil, feed y busqueda de jugadores.
- [ ] Pulir UX.
- [ ] Probar visualmente pantallas privadas con dos sesiones reales.
- [x] Crear proyecto Cloudflare Pages `padelito`.
- [x] Configurar variables publicas de Supabase en Cloudflare Pages.
- [x] Retirar `wrangler.jsonc` para que Pages use las variables configuradas en el dashboard.
- [x] Deploy Cloudflare Pages.

## Etapa 9 - MVP+ Partidos e historial
- [x] Crear modelo de partido completo con participantes sin limite fijo.
- [x] Permitir crear partido completo seleccionando usuarios seguidos.
- [x] Permitir marcar partido como incompleto para buscar jugadores.
- [x] Convertir postulantes aceptados en participantes del partido.
- [x] Registrar resultado al finalizar partido.
- [x] Restringir registro/edicion de resultado al creador del partido.
- [x] Mostrar historial de partidos en perfil de cada participante.
- [x] Crear dashboard simple de estadisticas: jugados, victorias, derrotas y porcentaje.
- [x] Permitir resetear score propio sin editar resultados historicos.
- [x] Crear desafios recurrentes entre parejas o grupos.
- [x] Registrar partidos dentro de un desafio recurrente.
- [x] Mostrar marcador acumulado del desafio recurrente.
- [x] Notificar al creador cuando un partido programado ya termino y falta cargar resultado.
- [x] Notificar a participantes cuando el creador confirma resultado.

## Etapa 10 - Cierre MVP y salida local
- [ ] Probar manualmente aceptacion de solicitud/invitacion vinculada con dos sesiones reales.
- [ ] Probar manualmente cancelacion de participacion aceptada desde organizador y jugador.
- [ ] Probar manualmente swipe-to-delete de notificaciones en celular.
- [ ] Probar carga/cambio de foto de perfil con imagen real en Supabase Storage.
- [ ] Pulir UX mobile de feed, perfil y notificaciones con pruebas manuales completas.
- [x] Permitir archivar/reactivar desafios recurrentes propios.
- [x] Agregar confirmaciones UI para acciones sensibles.
- [x] Agregar smoke test Supabase para auth, RLS y privacidad.
- [x] Validar que el reset de score no pueda editarse directo por REST.
- [x] Revisar limites de email de Supabase y documentar SMTP de produccion.
- [x] Auditar textos visibles y alerts para evitar inglés y errores sin acentos.
- [x] Desactivar `Confirm email` en Supabase Auth > Providers > Email para registro directo sin correo.
- [x] Agregar `https://padelito-29z.pages.dev` en Supabase Auth > URL Configuration.
- [x] Reconectar Pages Git en Cloudflare o definir `CLOUDFLARE_API_TOKEN` local para subir `dist`.
- [ ] Configurar SMTP propio en Supabase cuando exista proveedor/dominio.
- [ ] Separar historial operativo antiguo en menu secundario si el perfil queda demasiado largo.
- [ ] Revisar estados vacios, errores y acciones destructivas restantes del flujo completo.
- [x] Preparar deploy Cloudflare Pages.
- [ ] Probar manualmente registro, login, logout y recuperacion desde `https://padelito-29z.pages.dev`.
