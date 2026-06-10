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
- [ ] Aplicar `supabase/migrations/202606100001_link_invitations_to_posts_and_slots.sql` en Supabase Cloud.

## Etapa 4 - Auth y perfiles
- [x] Auth simple con Supabase por magic link.
- [x] Auth con email y contrasena para login cotidiano.
- [x] Registro con email y contrasena.
- [x] Sesion persistente al reabrir la app.
- [x] Mensajes humanos ante rate limit de emails.
- [x] Recuperacion y creacion de contrasena para cuentas existentes.
- [x] Auth demo local.
- [x] Onboarding local de perfil jugador.
- [x] Onboarding local de perfil organizacion.
- [x] Validar login magic link con email real.
- [x] Validar creacion de perfil real en Supabase.
- [x] Cerrar sesion desde perfil sin borrar datos persistidos.
- [ ] Edicion de perfil.

## Etapa 5 - Feeds
- [x] Feed Comunidad local.
- [x] Feed Siguiendo local.
- [x] Filtros MVP locales.
- [x] Pull-to-refresh mobile preparado para refetch futuro.
- [x] Pull-to-refresh conectado a snapshot Supabase en modo remoto.

## Etapa 6 - Publicaciones
- [x] Crear Busco jugador local.
- [x] Crear Estoy disponible local.
- [x] Crear Evento local.
- [x] Cards React por tipo.

## Etapa 7 - Coordinacion social
- [x] Solicitudes para unirse locales.
- [x] Cancelacion de solicitudes pendientes.
- [x] Estado visual de solicitud enviada en cards.
- [x] Cards de solicitudes enviadas y recibidas en perfil.
- [x] Invitaciones directas locales.
- [x] Vincular invitaciones directas a un partido propio abierto cuando exista.
- [x] Descontar cupo y marcar partido completo al aceptar solicitudes o invitaciones.
- [x] Notificaciones internas locales.
- [x] Notificaciones accionables para abrir solicitudes e invitaciones.
- [x] Actividad en perfil local.
- [x] Cards contextuales de invitaciones enviadas y recibidas en perfil.
- [ ] Buscar jugadores por nombre.
- [ ] Ver perfil publico de otro jugador.
- [ ] Seguir/dejar de seguir desde perfil publico o resultado de busqueda.
- [ ] Crear invitacion privada desde perfil de jugador sin publicarla en el feed.

## Etapa 8 - PWA, QA y deploy
- [x] Onboarding de acceso rapido local.
- [x] Preparar arquitectura para notificaciones push.
- [x] Corregir overflow horizontal mobile.
- [x] Evitar service worker en desarrollo para no romper HMR.
- [x] Reiniciar scroll al cambiar vistas para evitar contenido tapado por tabs.
- [x] Invalidar cache PWA para refrescar SVG de marca.
- [ ] Pulir UX.
- [ ] Deploy Cloudflare Pages.

## Etapa 9 - MVP+ Partidos e historial
- [ ] Crear modelo de partido completo con participantes sin limite fijo.
- [ ] Permitir crear partido completo seleccionando usuarios seguidos.
- [ ] Permitir marcar partido como incompleto para buscar jugadores.
- [ ] Convertir postulantes aceptados en participantes del partido.
- [ ] Registrar resultado al finalizar partido.
- [ ] Mostrar historial de partidos en perfil de cada participante.
- [ ] Crear dashboard simple de estadisticas: jugados, victorias, derrotas y porcentaje.
- [ ] Crear desafios recurrentes entre parejas o grupos.
- [ ] Registrar partidos dentro de un desafio recurrente.
- [ ] Mostrar marcador acumulado del desafio recurrente.
