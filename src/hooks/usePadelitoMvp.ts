import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedTabIdentifier } from "../domain/enums/postEnums";
import type { RecurringChallengeStatus } from "../domain/enums/recurringChallengeEnums";
import type { MatchResult } from "../domain/models/matchModels";
import type { Post } from "../domain/models/postModels";
import type { Profile } from "../domain/models/profileModels";
import { createCurrentIsoDate } from "../utils/dateFormatters";
import { useLocalStorageState } from "./useLocalStorageState";
import {
  cancelMatchJoinRequest,
  cancelDirectMatchInvitation,
  cancelMatch,
  cancelPost,
  type CreateInvitationInput,
  createDirectMatchInvitation,
  createMatch,
  createMatchJoinRequest,
  createPost,
  createRecurringChallenge,
  dismissQuickAccessPrompt,
  getPrivateProfileContact as getLocalPrivateProfileContact,
  getSessionProfile,
  getVisiblePostsForFeed,
  markNotificationsAsRead,
  recordMatchResult,
  resetOwnMatchStats,
  signInWithDemoProfile,
  toggleEventInteraction,
  toggleFollowProfile,
  updateDirectMatchInvitationStatus,
  updateMatchJoinRequestStatus,
  updateOwnProfile,
  updateRecurringChallengeStatus,
} from "../services/repositories/localPadelitoRepository";
import {
  createInitialLocalDatabase,
  type PadelitoLocalDatabase,
} from "../services/repositories/localPadelitoDatabase";
import {
  createEmptyRepositorySnapshot,
  type CreateMatchInput,
  type CreateRecurringChallengeInput,
} from "../services/repositories/padelitoRepository";
import { createSupabasePadelitoRepository } from "../services/repositories/supabasePadelitoRepository";
import { supabaseBrowserClient } from "../services/supabase/supabaseClient";
import { createWhatsappContactUrl } from "../utils/contactFormatters";

export type MainViewIdentifier =
  | "feed"
  | "players"
  | "profile"
  | "notifications";
export type BackendModeIdentifier = "local" | "supabase";
export type AuthLoadingActionIdentifier =
  | "magicLink"
  | "passwordReset"
  | "passwordSignIn"
  | "passwordSignUp"
  | "passwordUpdate";

const LEGACY_MAGIC_LINK_COOLDOWN_STORAGE_KEY =
  "padelito-magic-link-cooldown-expires-at-v1";

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
  const [selectedPublicProfileId, setSelectedPublicProfileId] = useState<
    string | null
  >(null);
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
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(false);
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
  const database = normalizeDatabaseSnapshot(
    isSupabaseMode ? remoteDatabase : localDatabase,
  );

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
    window.localStorage.removeItem(LEGACY_MAGIC_LINK_COOLDOWN_STORAGE_KEY);
  }, []);

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
          if (authEvent === "PASSWORD_RECOVERY" && authSession) {
            setBackendMode("supabase");
            setAuthErrorMessage(null);
            setAuthStatusMessage(null);
            setIsPasswordRecoveryMode(true);
            return;
          }

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
            setIsPasswordRecoveryMode(false);
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
    setIsPasswordRecoveryMode(false);
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
    setIsPasswordRecoveryMode(false);

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
    setIsPasswordRecoveryMode(false);

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
        "Si el email es nuevo, te enviamos confirmacion. Si ya tenias cuenta, usa Crear o recuperar contrasena.",
      );
    }

    setAuthLoadingAction(null);
  }

  /**
   * Envia email para crear o recuperar contrasena.
   * Se construye para cuentas existentes nacidas por magic link.
   * Lo usa AuthScreen.
   * Sirve para iniciar el flujo correcto antes de llamar updateUser.
   */
  async function handlePasswordResetRequest(email: string) {
    if (!supabaseBrowserClient) {
      setAuthErrorMessage("El acceso real no esta disponible en este entorno.");
      return;
    }

    setAuthLoadingAction("passwordReset");
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    const { error } = await supabaseBrowserClient.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin,
      },
    );

    setAuthLoadingAction(null);

    if (error) {
      setAuthErrorMessage(getReadableAuthErrorMessage(error));
      return;
    }

    setAuthStatusMessage(
      "Te enviamos un enlace para crear o recuperar tu contrasena.",
    );
  }

  /**
   * Guarda una nueva contrasena despues del enlace de recuperacion.
   * Se construye para completar el flujo PASSWORD_RECOVERY de Supabase.
   * Lo usa AuthScreen cuando el usuario vuelve desde el email.
   * Sirve para que cuentas existentes puedan entrar luego con contrasena.
   */
  async function handlePasswordUpdateRequest(password: string) {
    if (!supabaseBrowserClient) {
      setAuthErrorMessage("El acceso real no esta disponible en este entorno.");
      return;
    }

    setAuthLoadingAction("passwordUpdate");
    setAuthErrorMessage(null);
    setAuthStatusMessage(null);

    const { error } = await supabaseBrowserClient.auth.updateUser({
      password,
    });

    if (error) {
      setAuthLoadingAction(null);
      setAuthErrorMessage(getReadableAuthErrorMessage(error));
      return;
    }

    setBackendMode("supabase");
    setIsPasswordRecoveryMode(false);
    setAuthLoadingAction(null);
    setAuthStatusMessage("Contrasena actualizada.");
    await loadRemoteSnapshot();
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
    setIsPasswordRecoveryMode(false);
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
      return;
    }

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
   * Cancela una publicacion propia.
   * Se construye para que el autor pueda retirar contenido activo del feed.
   * Lo usan cards de publicaciones propias.
   * Sirve para manejar partidos, disponibilidad o eventos que ya no siguen vigentes.
   */
  function handlePostCancel(postId: string) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.cancelPost(postId, sessionProfile.profileId),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      cancelPost(currentDatabase, postId, sessionProfile.profileId),
    );
  }

  /**
   * Crea un partido estructurado.
   * Se construye para separar historial real del feed de descubrimiento.
   * Lo usan modales de partido.
   * Sirve para registrar participantes variables y resultado opcional.
   */
  function handleMatchCreate(matchInput: CreateMatchInput) {
    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() => supabaseRepository.createMatch(matchInput));
      return;
    }

    setLocalDatabase((currentDatabase) =>
      createMatch(currentDatabase, matchInput),
    );
  }

  /**
   * Cancela un partido propio.
   * Se construye para mantener control del creador sin borrar historial.
   * Lo usa el historial de partidos.
   * Sirve para retirar partidos que ya no se jugaran.
   */
  function handleMatchCancel(matchId: string) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.cancelMatch(matchId, sessionProfile.profileId),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      cancelMatch(currentDatabase, matchId, sessionProfile.profileId),
    );
  }

  /**
   * Registra resultado de partido.
   * Se construye para alimentar historial y estadisticas.
   * Lo usa el modal de resultado.
   * Sirve para marcar partidos como finalizados.
   */
  function handleMatchResultRecord(matchResult: MatchResult) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.recordMatchResult(
          matchResult,
          sessionProfile.profileId,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      recordMatchResult(currentDatabase, matchResult, sessionProfile.profileId),
    );
  }

  /**
   * Reinicia estadisticas propias del perfil.
   * Se construye para no editar resultados historicos.
   * Lo usa MatchHistorySection.
   * Sirve para que cada jugador vuelva a empezar su score.
   */
  function handleOwnMatchStatsReset() {
    if (!sessionProfile) {
      return;
    }

    const resetAt = createCurrentIsoDate();

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() => supabaseRepository.resetOwnMatchStats());
      return;
    }

    setLocalDatabase((currentDatabase) =>
      resetOwnMatchStats(currentDatabase, sessionProfile.profileId, resetAt),
    );
  }

  /**
   * Crea un desafio recurrente.
   * Se construye para agrupar partidos habituales entre equipos.
   * Lo usa ProfileScreen.
   * Sirve para calcular marcador acumulado desde resultados.
   */
  function handleRecurringChallengeCreate(
    challengeInput: CreateRecurringChallengeInput,
  ) {
    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.createRecurringChallenge(challengeInput),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      createRecurringChallenge(currentDatabase, challengeInput),
    );
  }

  /**
   * Actualiza estado de desafio recurrente.
   * Se construye para archivar o reactivar series creadas.
   * Lo usa ProfileScreen.
   * Sirve para mantener control del creador sin borrar historial.
   */
  function handleRecurringChallengeStatusUpdate(
    challengeId: string,
    status: RecurringChallengeStatus,
  ) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.updateRecurringChallengeStatus(
          challengeId,
          status,
          sessionProfile.profileId,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      updateRecurringChallengeStatus(
        currentDatabase,
        challengeId,
        status,
        sessionProfile.profileId,
      ),
    );
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
   * Abre un perfil publico desde feed o busqueda.
   * Se construye para conectar publicaciones con relaciones sociales.
   * Lo usan cards de autor y busqueda de jugadores.
   * Sirve para revisar perfil, seguir e invitar sin depender solo del feed.
   */
  function handlePublicProfileOpen(profileId: string) {
    if (sessionProfile?.profileId === profileId) {
      setActiveMainView("profile");
      return;
    }

    setSelectedPublicProfileId(profileId);
    setActiveMainView("players");
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
   * Cancela una invitacion directa enviada.
   * Se construye para permitir arrepentimiento antes de una respuesta.
   * Lo usa ProfileActivitySection.
   * Sirve para retirar propuestas pendientes sin borrar historial.
   */
  function handleDirectInvitationCancel(invitationId: string) {
    if (!sessionProfile) {
      return;
    }

    if (isSupabaseMode && supabaseRepository) {
      void runRemoteAction(() =>
        supabaseRepository.cancelDirectMatchInvitation(
          invitationId,
          sessionProfile.profileId,
        ),
      );
      return;
    }

    setLocalDatabase((currentDatabase) =>
      cancelDirectMatchInvitation(
        currentDatabase,
        invitationId,
        sessionProfile.profileId,
      ),
    );
  }

  /**
   * Abre WhatsApp privado si la relacion ya fue aceptada.
   * Se construye para evitar exponer telefonos en perfiles publicos.
   * Lo usan cards aceptadas de actividad.
   * Sirve para pasar del acuerdo dentro de Padelito a la coordinacion final.
   */
  async function handlePrivateContactOpen(targetProfileId: string) {
    if (!sessionProfile) {
      return;
    }

    setRemoteErrorMessage(null);

    try {
      const privateContact =
        isSupabaseMode && supabaseRepository
          ? await supabaseRepository.getPrivateProfileContact(targetProfileId)
          : getLocalPrivateProfileContact(
              database,
              sessionProfile.profileId,
              targetProfileId,
            );

      if (!privateContact) {
        setRemoteErrorMessage(
          "El contacto privado queda disponible cuando hay una solicitud o invitacion aceptada.",
        );
        return;
      }

      if (!privateContact.whatsappPhone) {
        setRemoteErrorMessage("Ese perfil todavia no tiene WhatsApp cargado.");
        return;
      }

      const whatsappUrl = createWhatsappContactUrl(privateContact.whatsappPhone);

      if (!whatsappUrl) {
        setRemoteErrorMessage("Ese WhatsApp no parece tener un formato valido.");
        return;
      }

      window.open(whatsappUrl, "_blank", "noopener");
    } catch (error) {
      setRemoteErrorMessage(getReadableErrorMessage(error));
    }
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
    isPasswordRecoveryMode,
    isRemoteSnapshotLoading,
    lastFeedRefreshAt,
    remoteErrorMessage,
    selectedPublicProfileId,
    sessionProfile,
    unreadNotificationsCount,
    visiblePosts,
    setActiveFeedTab,
    setActiveMainView,
    setInvitedProfileId,
    setIsCreatePostOpen,
    setSelectedPublicProfileId,
    handleDemoSignIn,
    handleSignOut,
    handleEmailSignInRequest,
    handlePasswordResetRequest,
    handlePasswordSignInRequest,
    handlePasswordSignUpRequest,
    handlePasswordUpdateRequest,
    handleDirectInvitationCreate,
    handleDirectInvitationCancel,
    handleDirectInvitationStatusChange,
    handleEventInteractionToggle,
    handleFeedRefresh,
    handleFollowToggle,
    handlePublicProfileOpen,
    handleJoinRequestCreate,
    handleJoinRequestCancel,
    handleJoinRequestStatusChange,
    handleNotificationsRead,
    handlePostCreate,
    handlePostCancel,
    handleMatchCancel,
    handleMatchCreate,
    handleMatchResultRecord,
    handleOwnMatchStatsReset,
    handleRecurringChallengeCreate,
    handleRecurringChallengeStatusUpdate,
    handlePrivateContactOpen,
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
    return "El envio de emails esta limitado temporalmente. Proba con contrasena o intenta mas tarde.";
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
 * Completa campos nuevos en snapshots antiguos.
 * Se construye para que localStorage viejo no rompa al agregar modulos.
 * Lo usa usePadelitoMvp antes de entregar database a la UI.
 * Sirve para migraciones cliente simples y reversibles.
 */
function normalizeDatabaseSnapshot(database: PadelitoLocalDatabase) {
  const partialDatabase = database as Partial<PadelitoLocalDatabase>;

  return {
    ...database,
    directMatchInvitations: partialDatabase.directMatchInvitations ?? [],
    follows: partialDatabase.follows ?? [],
    matchJoinRequests: partialDatabase.matchJoinRequests ?? [],
    matchParticipants: partialDatabase.matchParticipants ?? [],
    matchRecords: partialDatabase.matchRecords ?? [],
    matchResults: partialDatabase.matchResults ?? [],
    notifications: partialDatabase.notifications ?? [],
    postInteractions: partialDatabase.postInteractions ?? [],
    posts: partialDatabase.posts ?? [],
    profiles: partialDatabase.profiles ?? [],
    recurringChallengeParticipants:
      partialDatabase.recurringChallengeParticipants ?? [],
    recurringChallenges: partialDatabase.recurringChallenges ?? [],
  };
}
