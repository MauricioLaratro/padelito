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
  domain/
    enums/
      matchEnums.ts
      notificationEnums.ts
      postEnums.ts
      profileEnums.ts
    models/
      matchModels.ts
      notificationModels.ts
      postModels.ts
      profileModels.ts
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
      MatchHistorySection.tsx
      MatchResultModal.tsx
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
- estadisticas deben calcularse desde resultados antes de crear tablas agregadas;
- desafios recurrentes deben tener entidad propia y asociar multiples partidos en una etapa posterior.

La Etapa 9 no debe introducir ranking global ni cambiar el posicionamiento social/local del MVP.

Pendiente arquitectonico:

- crear `recurring_challenges` y relaciones con partidos sin contaminar el feed.

## Decision reversible actual

El MVP mantiene dos modos detras del mismo contrato:

- `local`: usa `localStorage` y datos demo para validar UX sin backend.
- `supabase`: usa Auth con email/contrasena, magic link alternativo, snapshot remoto y repositorio Supabase.

La UI consume `usePadelitoMvp` y modelos de dominio; no habla directo con Supabase. El hook concentra sesion, login, registro, recuperacion de contrasena y magic link alternativo. Los mappers convierten `snake_case` SQL a modelos TypeScript en ingles.

Esta decision permite probar localmente aunque Supabase Auth o RLS necesiten ajustes, sin romper el MVP demo.

## Privacidad de contacto

`whatsapp_phone` no forma parte de las lecturas publicas de `profiles`.

Regla actual:

- el snapshot general usa columnas publicas explicitas;
- el perfil propio hidrata su telefono con `get_profile_private_contact(uuid)`;
- el contacto de otro jugador solo se abre si existe una solicitud o invitacion aceptada entre ambos perfiles;
- el repositorio local replica la misma regla para mantener paridad de comportamiento.

Esto mantiene los perfiles publicos inspeccionables sin exponer datos privados.

## Migrabilidad futura

El backend Supabase debe poder ser consumido luego por Flutter. Por eso:

- reglas de negocio claras;
- modelos explicitos;
- SQL y RLS documentados;
- sin hacks especificos de UI para permisos o visibilidad.
