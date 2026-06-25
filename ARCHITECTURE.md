# ARCHITECTURE - PADELITO

## Objetivo arquitectonico

Crear una PWA simple, barata y rapida, con arquitectura limpia y migrable a Flutter en el futuro.

## Stack

- Vite.
- React.
- TypeScript.
- Tailwind CSS.
- Supabase.
- Cloudflare Pages.
- PWA manifest + service worker.

## Principios

- UI no habla directo con Supabase.
- Repositorios o servicios concentran acceso a datos.
- Hooks concentran estado y casos de uso de pantalla.
- Modelos TypeScript explicitos.
- Componentes reutilizables.
- No duplicar cards, formularios, chips, botones ni estados vacios.
- Separar UI, estado, acceso a datos, logica de negocio, tipos y utilidades.

## Organizacion objetivo

```txt
src/
  app/
  components/
    common/
    layout/
    cards/
    forms/
    navigation/
  features/
    auth/
    profiles/
    feed/
    posts/
    follows/
    notifications/
    activity/
    onboarding/
  hooks/
  services/
    supabase/
    repositories/
  domain/
    models/
    enums/
    useCases/
  utils/
  constants/
  styles/
```

## Estado implementado

```txt
src/
  app/
    App.tsx
    registerPwaServiceWorker.ts
  components/
    cards/
      AvailableToPlayCard.tsx
      EventPostCard.tsx
      LookingForPlayerCard.tsx
      PostAuthorRow.tsx
      PostCard.tsx
    common/
      Button.tsx
      Chip.tsx
      EmptyState.tsx
      IconButton.tsx
      IncrementalLoadMarker.tsx
      ProfileAvatar.tsx
    forms/
      FormField.tsx
    layout/
      ScreenShell.tsx
      ShellHeader.tsx
    navigation/
      FloatingCreatePostButton.tsx
      FloatingFeedTabs.tsx
  constants/
    matchOptions.ts
    postOptions.ts
    profileOptions.ts
    recurringChallengeOptions.ts
  domain/
    enums/
      matchEnums.ts
      notificationEnums.ts
      postEnums.ts
      profileEnums.ts
      recurringChallengeEnums.ts
    models/
      matchModels.ts
      notificationModels.ts
      postModels.ts
      profileModels.ts
      recurringChallengeModels.ts
  hooks/
    useIncrementalItems.ts
    useLocalStorageState.ts
    usePadelitoMvp.ts
  features/
    activity/
      ProfileActivitySection.tsx
    auth/
      AuthScreen.tsx
    feed/
      FeedScreen.tsx
    matches/
      CreateMatchModal.tsx
      CreateRecurringChallengeModal.tsx
      MatchHistorySection.tsx
      MatchResultModal.tsx
      RecurringChallengesSection.tsx
    notifications/
      NotificationsScreen.tsx
    onboarding/
      OnboardingProfileScreen.tsx
      QuickAccessOnboardingStep.tsx
    players/
      PlayerSearchScreen.tsx
      PublicPlayerProfileScreen.tsx
    posts/
      CreatePostModal.tsx
      DirectInvitationModal.tsx
    profiles/
      ProfileEditModal.tsx
      ProfileForm.tsx
      ProfileScreen.tsx
  services/
    push/
      pushNotificationClient.ts
    repositories/
      localPadelitoDatabase.ts
      localPadelitoRepository.ts
      padelitoRepository.ts
      supabasePadelitoMappers.ts
      supabasePadelitoRepository.ts
      supabasePadelitoTypes.ts
    supabase/
      supabaseClient.ts
  styles/
    global.css
  utils/
    avatarImageProcessing.ts
    contactFormatters.ts
    dateFormatters.ts
    identifierGenerator.ts
    scheduleVisibility.ts
```

## Backend contract implementado

```txt
supabase/
  README.md
  migrations/
    202606090001_initial_schema.sql
    202606090002_harden_social_update_policies.sql
    202606100001_link_invitations_to_posts_and_slots.sql
    202606100002_restrict_profile_contact_visibility.sql
    202606100003_private_profile_contact_rpc.sql
    202606100004_match_history.sql
    202606100005_fix_match_history_rls.sql
    202606110001_link_matches_to_social_flows.sql
    202606110002_recurring_challenges.sql
    202606180001_profile_match_stats_reset.sql
    202606180002_activity_refresh_and_cancellations.sql
    202606200001_push_subscriptions.sql
workers/
  push-notifications/
    worker.mjs
    wrangler.jsonc
```

## Modulo Partidos e Historial implementado

Este modulo se implemento separado de publicaciones.

Separacion actual:

```txt
src/
  features/
    matches/
  domain/
    models/
      matchModels.ts
```

Principios:

- `posts` sigue resolviendo descubrimiento y feed.
- `matches` representa partidos concretos, completos o incompletos.
- `match_records.sourcePostId` vincula historial con publicaciones `Busco jugador`.
- `directMatchInvitations.relatedMatchId` vincula invitaciones con partidos estructurados.
- participantes manuales viven en `match_participants`;
- participantes aceptados por solicitud o invitacion vinculada tambien entran en `match_participants`;
- resultados viven en `match_results`;
- resultados solo pueden registrarse o editarse desde el creador del partido;
- al registrar resultado se notifican los participantes no organizadores;
- estadisticas deben calcularse desde resultados antes de crear tablas agregadas;
- `profiles.matchStatsResetAt` permite resetear score visible sin borrar ni editar resultados historicos;
- desafios recurrentes viven como entidad propia;
- `match_records.recurringChallengeId` vincula partidos con desafios;
- marcador acumulado de desafios se calcula desde `match_results` vinculados.

La Etapa 9 no debe introducir ranking global ni cambiar el posicionamiento social/local del MVP.

Pendiente arquitectonico:

- evaluar agregados/materialized views solo si el volumen futuro lo justifica.
- separar historial operativo antiguo de la actividad diaria si el perfil necesita mas densidad.

## Actividad, refresco y notificaciones

La app usa snapshot completo como contrato entre repositorios y UI. Para evitar estados viejos despues de acciones cruzadas:

- las escrituras remotas pasan por `runRemoteAction` y recargan snapshot al finalizar;
- feed, jugadores, notificaciones y perfil refrescan snapshot al cambiar de panel o tocar el panel activo;
- el foco del navegador y el cambio de vista recargan snapshot cuando hay sesion Supabase completa;
- Inicio filtra publicaciones vencidas con `scheduleVisibility` para no mostrar partidos, eventos o disponibilidades ya terminadas;
- `useIncrementalItems` y `IncrementalLoadMarker` cargan cards en tandas para feed, notificaciones, actividad de perfil, historial y desafios;
- la bandeja de notificaciones permite eliminar avisos propios sin borrar entidades historicas;
- solicitudes e invitaciones aceptadas se cancelan por RPC para liberar cupo y remover participante;
- los recordatorios de resultado se crean al cargar/refrescar snapshot cuando un partido propio ya termino y no tiene resultado.

Esta decision evita introducir realtime/scheduler antes de validar uso real. Si el MVP necesita actualizacion instantanea entre dispositivos, el siguiente paso natural es Supabase Realtime sobre posts, solicitudes, invitaciones y notificaciones.

Push remoto:

- el cliente registra suscripciones Web Push con `PushManager` solo cuando el usuario concedio permiso;
- `pushNotificationClient` sincroniza la suscripcion contra el Worker `padelito-push`;
- el Worker valida el JWT de Supabase antes de guardar suscripciones o disparar envios;
- la RPC `get_push_delivery_payload(uuid)` limita destinatarios a notificaciones donde el usuario autenticado es actor o destinatario;
- el push no envia payload sensible: despierta el service worker y muestra un aviso generico;
- la migracion `202606200001_push_subscriptions.sql` debe estar aplicada para que el circuito funcione en produccion.

## Perfiles publicos

Los perfiles de otros jugadores viven como una vista principal `publicProfile`, separada de la busqueda.

Esto evita que tocar un avatar o nombre inserte una card dentro del listado y produzca overflow. La busqueda solo lista jugadores; feed, notificaciones y busqueda abren la vista completa con datos publicos, score visible, follow, invitacion y contacto privado controlado por RPC.

## Decision reversible actual

El MVP mantiene dos modos detras del mismo contrato:

- `local`: usa `localStorage` y datos demo para validar UX sin backend.
- `supabase`: usa Auth con email/contrasena, recuperacion de contrasena por email, snapshot remoto y repositorio Supabase.

La UI consume `usePadelitoMvp` y modelos de dominio; no habla directo con Supabase. El hook concentra sesion, login, registro y recuperacion de contrasena. Los mappers convierten `snake_case` SQL a modelos TypeScript en ingles.

Esta decision permite probar localmente aunque Supabase Auth o RLS necesiten ajustes, sin romper el MVP demo.

## Privacidad de contacto

`whatsapp_phone` no forma parte de las lecturas publicas de `profiles`.

Regla actual:

- el snapshot general usa columnas publicas explicitas;
- el perfil propio hidrata su telefono con `get_profile_private_contact(uuid)`;
- el contacto de otro jugador solo se abre si existe una solicitud o invitacion aceptada entre ambos perfiles;
- el repositorio local replica la misma regla para mantener paridad de comportamiento.

Esto mantiene los perfiles publicos inspeccionables sin exponer datos privados.

## Perfil y avatar

La foto de perfil se mantiene como dato publico de baja sensibilidad y se guarda en el bucket `avatars`.

Separacion actual:

- `ProfileAvatar` renderiza el circulo reutilizable para perfil, feed y busqueda;
- `avatarImageProcessing` prepara la imagen en el cliente con recorte cuadrado y salida 512x512;
- `PadelitoRepository.uploadProfileAvatar` concentra la escritura a Storage;
- `ProfileForm` solo coordina preview, validacion visual y envio del archivo al caso de uso.

Esta estructura evita que los componentes de UI dependan directo de Supabase Storage y deja reemplazable el backend de archivos si se cambia la infraestructura.

## Migrabilidad futura

El backend Supabase debe poder ser consumido luego por Flutter. Por eso:

- reglas de negocio claras;
- modelos explicitos;
- SQL y RLS documentados;
- sin hacks especificos de UI para permisos o visibilidad.

## Automatizacion social

La automatizacion de contenido vive fuera de la UI principal para no mezclar marketing con logica del producto.

Separacion actual:

- `scripts/social/contentPlan.mjs` define pilares, textos y reglas editoriales;
- `scripts/social/generate-daily-content.mjs` genera imagen PNG, SVG y manifiesto diario;
- `scripts/social/publish-meta.mjs` publica por la API oficial de Meta cuando existen secretos;
- `.github/workflows/social-daily.yml` ejecuta el flujo diario, guarda la pieza publica y luego intenta publicar.

Decision:

- la primera version publica imagen/feed diario con CTA a registro;
- no depende de musica nativa de Instagram porque la API y permisos pueden cambiar;
- TikTok queda registrado como canal objetivo, pero no se automatiza hasta confirmar permisos oficiales de publicacion.

Esta arquitectura permite cambiar el publicador sin tocar la app, y permite medir si el mensaje convierte antes de invertir en Reels mas complejos.
