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
    postOptions.ts
    profileOptions.ts
  domain/
    enums/
      notificationEnums.ts
      postEnums.ts
      profileEnums.ts
    models/
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
    notifications/
      NotificationsScreen.tsx
    onboarding/
      OnboardingProfileScreen.tsx
      QuickAccessOnboardingStep.tsx
    posts/
      CreatePostModal.tsx
      DirectInvitationModal.tsx
    profiles/
      ProfileScreen.tsx
  services/
    repositories/
      localPadelitoDatabase.ts
      localPadelitoRepository.ts
    supabase/
      supabaseClient.ts
  styles/
    global.css
  utils/
    dateFormatters.ts
    identifierGenerator.ts
```

## Backend contract implementado

```txt
supabase/
  README.md
  migrations/
    202606090001_initial_schema.sql
```

## Decision reversible actual

Mientras no existan credenciales Supabase, el MVP usa un repositorio local para probar flujos en navegador. La UI consume hook/repositorio, no Supabase directo, por lo que el reemplazo por repositorios remotos es controlado.

## Migrabilidad futura

El backend Supabase debe poder ser consumido luego por Flutter. Por eso:

- reglas de negocio claras;
- modelos explicitos;
- SQL y RLS documentados;
- sin hacks especificos de UI para permisos o visibilidad.
