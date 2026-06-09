import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedTabIdentifier } from "../domain/enums/postEnums";
import type { Post } from "../domain/models/postModels";
import type { Profile } from "../domain/models/profileModels";
import { createCurrentIsoDate } from "../utils/dateFormatters";
import { useLocalStorageState } from "./useLocalStorageState";
import {
  cancelMatchJoinRequest,
  type CreateInvitationInput,
  createDirectMatchInvitation,
  createMatchJoinRequest,
  createPost,
  dismissQuickAccessPrompt,
  getSessionProfile,
  getVisiblePostsForFeed,
  markNotificationsAsRead,
  signInWithDemoProfile,
  toggleEventInteraction,
  toggleFollowProfile,
  updateDirectMatchInvitationStatus,
  updateMatchJoinRequestStatus,
  updateOwnProfile,
} from "../services/repositories/localPadelitoRepository";
import {
  createInitialLocalDatabase,
  type PadelitoLocalDatabase,
} from "../services/repositories/localPadelitoDatabase";
import { createEmptyRepositorySnapshot } from "../services/repositories/padelitoRepository";
import { createSupabasePadelitoRepository } from "../services/repositories/supabasePadelitoRepository";
import { supabaseBrowserClient } from "../services/supabase/supabaseClient";

export type MainViewIdentifier = "feed" | "profile" | "notifications";
export type BackendModeIdentifier = "local" | "supabase";
export type AuthLoadingActionIdentifier =
  | "magicLink"
  | "passwordSignIn"
  | "passwordSignUp";

const MAGIC_LINK_COOLDOWN_MILLISECONDS = 60_000;

/**
 * Orquesta el estado funcional del MVP local.
 * Se construye para separar UI de persistencia y reglas de negocio.
 * Lo usa App como fachada de aplicacion.
 * Sirve para validar flujos antes de conectar repositorios Supabase.
 */
export function usePadelitoMvp() {
  const [backendMode, setBackendMode] =
    useLocalStorageState<BackendModeIdentifier>(
      "padelito-backend-mode-v1",
      () => (supabaseBrowserClient ? "supabase" : "local"),
    );
  const [localDatabase, setLocalDatabase] =
    useLocalStorageState<PadelitoLocalDatabase>(
      "padelito-local-database-v1",
      createInitialLocalDatabase,
    );
  const [remoteDatabase, setRemoteDatabase] = useState<PadelitoLocalDatabase>(
    createEmptyRepositorySnapshot,
  );
  const [activeFeedTab, setActiveFeedTab] =
    useState<FeedTabIdentifier>("community");
  const [activeMainView, setActiveMainView] =
    useState<MainViewIdentifier>("feed");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [invitedProfileId, setInvitedProfileId] = useState<string | null>(null);
  const [lastFeedRefreshAt, setLastFeedRefreshAt] = useState(
    createCurrentIsoDate(),
  );
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(
    null,
  );
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [authLoadingAction, setAuthLoadingAction] =
    useState<AuthLoadingActionIdentifier | null>(null);
  const [isAuthSessionChecking, setIsAuthSessionChecking] = useState(
    Boolean(supabaseBrowserClient),
  );
  const [magicLinkCooldownExpiresAt, setMagicLinkCooldownExpiresAt] =
    useLocalStorageState<number | null>(
      "padelito-magic-link-cooldown-expires-at-v1",
      () => null,
    );
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(
    null,
  );
  const [isRemoteSnapshotLoading, setIsRemoteSnapshotLoading] = useState(false);

  const supabaseRepository = useMemo(() => {
    if (!supabaseBrowserClient) {
      return null;
    }

    return createSupabasePadelitoRepository(supabaseBrowserClient);
  }, []);

  const isSupabaseMode =
    backendMode === "supabase" && Boolean(supabaseRepository);
  const database = isSupabaseMode ? remoteDatabase : localDatabase;
  const magicLinkCooldownSeconds = useMemo(() => {
    if (!magicLinkCooldownExpiresAt) {
      return 0;
    }

    return Math.max(
      0,
      Math.ceil((magicLinkCooldownExpiresAt - currentTimestamp) / 1000),
    );
  }, [currentTimestamp, magicLinkCooldownExpiresAt]);

  const sessionProfile = getSessionProfile(database);

  const visiblePosts = useMemo(() => {
    if (!sessionProfile) {
      return [];
    }

    return getVisiblePostsForFeed(
      database,
      sessionProfile.profileId,
      activeFeedTab,
    );
  }, [activeFeedTab, database, sessionProfile]);

  const unreadNotificationsCount = useMemo(() => {
    if (!sessionProfile) {
      return 0;
    }

    return database.notifications.filter(
      (notification) =>
        notification.recipientProfileId === sessionProfile.profileId &&
        !notification.readAt,
    ).length;
  }, [database.notifications, sessionProfile]);

  /**
   * Carga snapshot remoto de Supabase.
   * Se construye para mantener la UI actual basada en estado completo.
   * Lo usan auth, pull-to-refresh y acciones remotas.
   * Sirve para sincronizar feeds, perfil y actividad despues de cada cambio.
   */
  const loadRemoteSnapshot = useCallback(async () => {
    if (!supabaseRepository) {
      return;
    }

    setIsRemoteSnapshotLoading(true);

    try {
      const snapshot = await supabaseRepository.loadApplicationSnapshot();
      setRemoteDatabase(snapshot);
      setRemoteErrorMessage(null);
    } catch (error) {
      setRemoteErrorMessage(getReadableErrorMessage(error));
    } finally {
      setIsRemoteSnapshotLoading(false);
    }
  }, [supabaseRepository]);

  useEffect(() => {
    if (!magicLinkCooldownExpiresAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [magicLinkCooldownExpiresAt]);

  useEffect(() => {
    if (!magicLinkCooldownExpiresAt) {
      return;
    }

    if (magicLinkCooldownExpiresAt <= currentTimestamp) {
      setMagicLinkCooldownExpiresAt(null);
    }
  }, [
    currentTimestamp,
    magicLinkCooldownExpiresAt,
    setMagicLinkCooldownExpiresAt,
  ]);

  useEffect(() => {
    if (!supabaseBrowserClient || !supabaseRepository) {
      setIsAuthSessionChecking(false);
      return;
    }

    let isEffectActive = true;
    const configuredSupabaseClient = supabaseBrowserClient;

    /**
     * Recupera la sesion guardada antes de mostrar el formulario.
     * Se construye para evitar pedir login si Supabase ya mantiene sesion.
     * Lo usa el efecto inicial de auth.
     * Sirve para reabrir la app y volver al perfil persistido.
     */
    async function initializeStoredSession() {
      try {
        const { data, error } = await configuredSupabaseClient.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isEffectActive) {
          return;
        }

        if (data.session) {
          setBackendMode("supabase");
          await loadRemoteSnapshot();
          return;
        }

        setRemoteDatabase(createEmptyRepositorySnapshot());
      } catch (error) {
        if (isEffectActive) {
          setAuthErrorMessage(getReadableAuthErrorMessage(error));
        }
      } finally {
        if (isEffectActive) {
          setIsAuthSessionChecking(false);
        }
      }
    }

    void initializeStoredSession();

    const { data: authListener } =
      configuredSupabaseClient.auth.onAuthStateChange(
        (authEvent, authSession) => {
          if (
            (authEvent === "INITIAL_SESSION" ||
              authEvent === "SIGNED_IN" ||
              authEvent === "TOKEN_REFRESHED") &&
            authSession
          ) {
            setBackendMode("supabase");
            void loadRemoteSnapshot();
          }

          if (authEvent === "SIGNED_OUT") {
            setRemoteDatabase(createEmptyRepositorySnapshot());
          }
        },
      );

    return () => {
      isEffectActive = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadRemoteSnapshot, setBackendMode, supabaseRepository]);

  /**
   * Ejecuta una accion remota y refresca snapshot.
   * Se construye para no duplicar manejo de errores Supabase.
   * Lo usan handlers principales.
   * Sirve para mantener consistencia despues de escrituras remotas.
   */
  async function runRemoteAction(action: () => Promise<void>) {
    if (!supabaseRepository) {
      setRemoteErrorMessage("El acceso real no esta disponible en este entorno.");
      return false;
    }

    try {
      setRemoteErrorMessage(null);
      await action();
      await loadRemoteSnapshot();
      return true;
    } catch (error) {
      setRemoteErrorMessage(getReadableErrorMessage(error));
      return false;
    }
  }

  /**
   * Inicia sesion demo.
   * Se construye para validar auth simple sin credenciales externas.
   * Lo usa AuthScreen.
   * Sirve para entrar al flujo de onboarding.
   */
  function handleDemoSignIn() {
    setBackendMode("local");
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);
    setRemoteErrorMessage(null);
    setLocalDatabase((currentDatabase) => signInWithDemoProfile(currentDatabase));
  }

  /**
   * Inicia sesion con email y contrasena.
   * Se construye para que el acceso diario no dependa del email.
   * Lo usa AuthScreen.
   * Sirve para recuperar el perfil persistido con una accion directa.
   */
  async function handlePasswordSignInRequest(email: string, password: string) {
    if (!supabaseBrowserClient) {
      setAuthErrorMessage("El acceso real no esta disponible en este entorno.");
      return;
    }

    setAuthLoadingAction("passwordSignIn");
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    const { error } = await supabaseBrowserClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthLoadingAction(null);
      setAuthErrorMessage(getReadableAuthErrorMessage(error));
      return;
    }

    setBackendMode("supabase");
    await loadRemoteSnapshot();
    setAuthLoadingAction(null);
  }

  /**
   * Crea cuenta con email y contrasena.
   * Se construye para evitar depender de magic link en cada ingreso.
   * Lo usa AuthScreen.
   * Sirve para registrar usuarios reales y mantener el perfil por auth.users.id.
   */
  async function handlePasswordSignUpRequest(email: string, password: string) {
    if (!supabaseBrowserClient) {
      setAuthErrorMessage("El acceso real no esta disponible en este entorno.");
      return;
    }

    setAuthLoadingAction("passwordSignUp");
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    const { data, error } = await supabaseBrowserClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthLoadingAction(null);
      setAuthErrorMessage(getReadableAuthErrorMessage(error));
      return;
    }

    if (data.session) {
      setBackendMode("supabase");
      await loadRemoteSnapshot();
      setAuthStatusMessage("Cuenta creada. Ya podes completar tu perfil.");
    } else {
      setAuthStatusMessage(
        "Te enviamos un email para confirmar la cuenta. Despues entra con tu contrasena.",
      );
    }

    setAuthLoadingAction(null);
  }

  /**
   * Cierra la sesion actual.
   * Se construye para separar salida local y salida Supabase.
   * Lo usa ProfileScreen.
   * Sirve para volver a AuthScreen sin borrar perfil ni actividad persistida.
   */
  async function handleSignOut() {
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);
    setRemoteErrorMessage(null);
    setActiveMainView("feed");
    setIsCreatePostOpen(false);
    setInvitedProfileId(null);

    if (isSupabaseMode && supabaseBrowserClient) {
      const { error } = await supabaseBrowserClient.auth.signOut();

      if (error) {
        setRemoteErrorMessage(getReadableErrorMessage(error));
        return;
      }

      setRemoteDatabase(createEmptyRepositorySnapshot());
      return;
    }

    setLocalDatabase((currentDatabase) => ({
      ...currentDatabase,
      sessionProfileId: undefined,
    }));
  }

  /**
   * Solicita enlace magico de Supabase.
   * Se construye para iniciar auth real sin password.
   * Lo usa AuthScreen.
   * Sirve para activar backend real cuando Supabase esta configurado.
   */
  async function handleEmailSignInRequest(email: string) {
    if (!supabaseBrowserClient) {
      setAuthErrorMessage("El acceso real no esta disponible en este entorno.");
      return;
    }

    if (magicLinkCooldownSeconds > 0) {
      setAuthErrorMessage(
        `Espera ${magicLinkCooldownSeconds} s antes de pedir otro enlace.`,
      );
      return;
    }

    setAuthLoadingAction("magicLink");
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    const { error } = await supabaseBrowserClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthLoadingAction(null);
      setAuthErrorMessage(getReadableAuthErrorMessage(error));

      if (isRateLimitError(error)) {
        setMagicLinkCooldownExpiresAt(
          Date.now() + MAGIC_LINK_COOLDOWN_MILLISECONDS,
        );
      }

      return;
    }

    setMagicLinkCooldownExpiresAt(
      Date.now() + MAGIC_LINK_COOLDOWN_MILLISECONDS,
    );
    setAuthLoadingAction(null);
    setAuthStatusMessage("Te enviamos un enlace de acceso al email.");
  }

  /**
   * Guarda perfil propio.
   * Se construye para cerrar onboarding y edicion de perfil.
   * Lo usan pantallas de perfil.
   * Sirve para persistir identidad local.
   */
  function handleProfileSave(updatedProfile: Profile) {
    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() => supabaseRepository.saveProfile(updatedProfile));
      return;
    }

    setLocalDatabase((currentDatabase) =>
      updateOwnProfile(currentDatabase, updatedProfile),
    );
  }

  /**
   * Crea publicacion desde formulario.
   * Se construye para desacoplar formularios del repositorio.
   * Lo usa CreatePostModal.
   * Sirve para agregar posts a feeds y actividad.
   */
  function handlePostCreate(post: Post) {
    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() => supabaseRepository.createPost(post)).then(
        (wasSaved) => {
          if (!wasSaved) {
            return;
          }

          setIsCreatePostOpen(false);
          setActiveMainView("feed");
        },
      );
      return;
    }

    setLocalDatabase((currentDatabase) => createPost(currentDatabase, post));
    setIsCreatePostOpen(false);
    setActiveMainView("feed");
  }

  /**
   * Alterna seguimiento.
   * Se construye para alimentar feed Siguiendo.
   * Lo usan cards y perfil.
   * Sirve para crear o remover relaciones sociales.
   */
  function handleFollowToggle(followedProfileId: string) {
    if (!sessionProfile || followedProfileId === sessionProfile.profileId) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.toggleFollowProfile(
          sessionProfile.profileId,
          followedProfileId,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      toggleFollowProfile(
        currentDatabase,
        sessionProfile.profileId,
        followedProfileId,
      ),
    );
  }

  /**
   * Crea postulacion para Busco jugador.
   * Se construye para cubrir accion principal de partido incompleto.
   * Lo usan cards de partido.
   * Sirve para generar solicitud y notificacion.
   */
  function handleJoinRequestCreate(postId: string) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.createMatchJoinRequest(
          postId,
          sessionProfile.profileId,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      createMatchJoinRequest(currentDatabase, postId, sessionProfile.profileId),
    );
  }

  /**
   * Cancela postulacion pendiente propia.
   * Se construye para que el usuario pueda arrepentirse antes de respuesta.
   * Lo usan cards y actividad de perfil.
   * Sirve para retirar una solicitud sin borrar historial.
   */
  function handleJoinRequestCancel(requestId: string) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.cancelMatchJoinRequest(
          requestId,
          sessionProfile.profileId,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      cancelMatchJoinRequest(
        currentDatabase,
        requestId,
        sessionProfile.profileId,
      ),
    );
  }

  /**
   * Responde solicitud de partido.
   * Se construye para cerrar decisiones del creador.
   * Lo usa ProfileActivitySection.
   * Sirve para aceptar o rechazar postulantes.
   */
  function handleJoinRequestStatusChange(
    requestId: string,
    status: "accepted" | "rejected",
  ) {
    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.updateMatchJoinRequestStatus(requestId, status),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      updateMatchJoinRequestStatus(currentDatabase, requestId, status),
    );
  }

  /**
   * Crea invitacion directa.
   * Se construye para conectar jugadores desde perfil o disponibilidad.
   * Lo usa DirectInvitationModal.
   * Sirve para registrar invitacion y notificar al destinatario.
   */
  function handleDirectInvitationCreate(
    invitationInput: CreateInvitationInput,
  ) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.createDirectMatchInvitation(
          sessionProfile.profileId,
          invitationInput,
        ),
      ).then((wasSaved) => {
        if (wasSaved) {
          setInvitedProfileId(null);
        }
      });
      return;
    }

    setLocalDatabase((currentDatabase) =>
      createDirectMatchInvitation(
        currentDatabase,
        sessionProfile.profileId,
        invitationInput,
      ),
    );
    setInvitedProfileId(null);
  }

  /**
   * Responde invitacion directa.
   * Se construye para que el destinatario acepte o rechace.
   * Lo usa ProfileActivitySection.
   * Sirve para notificar al invitador.
   */
  function handleDirectInvitationStatusChange(
    invitationId: string,
    status: "accepted" | "rejected",
  ) {
    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.updateDirectMatchInvitationStatus(
          invitationId,
          status,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      updateDirectMatchInvitationStatus(currentDatabase, invitationId, status),
    );
  }

  /**
   * Alterna interaccion de evento.
   * Se construye para manejar interesados y asistentes.
   * Lo usan EventPostCard.
   * Sirve para alimentar contadores y actividad de perfil.
   */
  function handleEventInteractionToggle(
    postId: string,
    interactionType: "interested" | "attending",
  ) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.toggleEventInteraction(
          postId,
          sessionProfile.profileId,
          interactionType,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      toggleEventInteraction(
        currentDatabase,
        postId,
        sessionProfile.profileId,
        interactionType,
      ),
    );
  }

  /**
   * Refresca el feed local.
   * Se construye para soportar el gesto pull-to-refresh desde el MVP.
   * Lo usa FeedScreen.
   * Sirve como punto de reemplazo para refetch Supabase en la siguiente etapa.
   */
  function handleFeedRefresh() {
    setLastFeedRefreshAt(createCurrentIsoDate());

    if (isSupabaseMode) {
      void loadRemoteSnapshot();
      return;
    }

    setLocalDatabase((currentDatabase) => ({ ...currentDatabase }));
  }

  /**
   * Marca notificaciones como leidas.
   * Se construye para mantener bandeja simple.
   * Lo usa NotificationsScreen.
   * Sirve para limpiar contador pendiente.
   */
  function handleNotificationsRead() {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.markNotificationsAsRead(sessionProfile.profileId),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      markNotificationsAsRead(currentDatabase, sessionProfile.profileId),
    );
  }

  /**
   * Cierra onboarding de acceso rapido.
   * Se construye para no bloquear la app si el usuario posterga la accion.
   * Lo usa QuickAccessOnboardingStep.
   * Sirve para guardar la decision local.
   */
  function handleQuickAccessDismiss() {
    if (isSupabaseMode) {
      setRemoteDatabase((currentDatabase) =>
        dismissQuickAccessPrompt(currentDatabase),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      dismissQuickAccessPrompt(currentDatabase),
    );
  }

  /**
   * Vuelve a mostrar el paso de acceso rapido.
   * Se construye para que Configuracion/Perfil pueda recuperar el CTA.
   * Lo usa ProfileScreen.
   * Sirve para que el usuario active el acceso rapido despues del onboarding.
   */
  function handleQuickAccessShow() {
    if (isSupabaseMode) {
      setRemoteDatabase((currentDatabase) => ({
        ...currentDatabase,
        quickAccessPromptDismissed: false,
      }));
      setActiveMainView("feed");
      return;
    }

    setLocalDatabase((currentDatabase) => ({
      ...currentDatabase,
      quickAccessPromptDismissed: false,
    }));
    setActiveMainView("feed");
  }

  return {
    activeFeedTab,
    activeMainView,
    authErrorMessage,
    authLoadingAction,
    authStatusMessage,
    backendMode,
    database,
    invitedProfileId,
    isEmailAuthEnabled: Boolean(supabaseBrowserClient),
    isAuthSessionChecking,
    isCreatePostOpen,
    isRemoteSnapshotLoading,
    magicLinkCooldownSeconds,
    lastFeedRefreshAt,
    remoteErrorMessage,
    sessionProfile,
    unreadNotificationsCount,
    visiblePosts,
    setActiveFeedTab,
    setActiveMainView,
    setInvitedProfileId,
    setIsCreatePostOpen,
    handleDemoSignIn,
    handleSignOut,
    handleEmailSignInRequest,
    handlePasswordSignInRequest,
    handlePasswordSignUpRequest,
    handleDirectInvitationCreate,
    handleDirectInvitationStatusChange,
    handleEventInteractionToggle,
    handleFeedRefresh,
    handleFollowToggle,
    handleJoinRequestCreate,
    handleJoinRequestCancel,
    handleJoinRequestStatusChange,
    handleNotificationsRead,
    handlePostCreate,
    handleProfileSave,
    handleQuickAccessDismiss,
    handleQuickAccessShow,
    createCurrentIsoDate,
  };
}

/**
 * Convierte errores desconocidos en texto legible.
 * Se construye para no filtrar objetos tecnicos a la UI.
 * Lo usa usePadelitoMvp.
 * Sirve para mostrar fallas de Supabase y auth con contexto minimo.
 */
function getReadableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado.";
}

/**
 * Convierte errores de auth en mensajes aptos para jugadores.
 * Se construye para esconder textos tecnicos del proveedor.
 * Lo usan acciones de acceso por contrasena y magic link.
 * Sirve para que la pantalla de entrada explique el siguiente paso.
 */
function getReadableAuthErrorMessage(error: unknown) {
  const readableMessage = getReadableErrorMessage(error);
  const normalizedMessage = readableMessage.toLowerCase();

  if (normalizedMessage.includes("rate limit")) {
    return "Pedimos un email hace muy poco. Espera un minuto y vuelve a intentar.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "El email o la contrasena no coinciden.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Todavia falta confirmar el email desde el enlace que te enviamos.";
  }

  if (normalizedMessage.includes("password")) {
    return "Revisa la contrasena. Debe tener al menos 6 caracteres.";
  }

  return readableMessage;
}

/**
 * Detecta errores de limite de envio de emails.
 * Se construye para activar cooldown aunque Supabase rechace la solicitud.
 * Lo usa el flujo de magic link.
 * Sirve para evitar reintentos que empeoren el bloqueo temporal.
 */
function isRateLimitError(error: unknown) {
  return getReadableErrorMessage(error).toLowerCase().includes("rate limit");
}
