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
    posts/
      CreatePostModal.tsx
      DirectInvitationModal.tsx
    profiles/
      ProfileEditModal.tsx
      ProfileForm.tsx
      ProfileScreen.tsx
  services/
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
- la bandeja de notificaciones permite eliminar avisos propios sin borrar entidades historicas;
- solicitudes e invitaciones aceptadas se cancelan por RPC para liberar cupo y remover participante;
- los recordatorios de resultado se crean al cargar/refrescar snapshot cuando un partido propio ya termino y no tiene resultado.

Esta decision evita introducir realtime/scheduler antes de validar uso real. Si el MVP necesita actualizacion instantanea entre dispositivos, el siguiente paso natural es Supabase Realtime sobre posts, solicitudes, invitaciones y notificaciones.

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
