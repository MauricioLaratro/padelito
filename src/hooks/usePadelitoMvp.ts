import { useMemo, useState } from "react";
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

export type MainViewIdentifier = "feed" | "profile" | "notifications";

/**
 * Orquesta el estado funcional del MVP local.
 * Se construye para separar UI de persistencia y reglas de negocio.
 * Lo usa App como fachada de aplicacion.
 * Sirve para validar flujos antes de conectar repositorios Supabase.
 */
export function usePadelitoMvp() {
  const [database, setDatabase] = useLocalStorageState<PadelitoLocalDatabase>(
    "padelito-local-database-v1",
    createInitialLocalDatabase,
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
   * Inicia sesion demo.
   * Se construye para validar auth simple sin credenciales externas.
   * Lo usa AuthScreen.
   * Sirve para entrar al flujo de onboarding.
   */
  function handleDemoSignIn() {
    setDatabase((currentDatabase) => signInWithDemoProfile(currentDatabase));
  }

  /**
   * Guarda perfil propio.
   * Se construye para cerrar onboarding y edicion de perfil.
   * Lo usan pantallas de perfil.
   * Sirve para persistir identidad local.
   */
  function handleProfileSave(updatedProfile: Profile) {
    setDatabase((currentDatabase) =>
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
    setDatabase((currentDatabase) => createPost(currentDatabase, post));
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

    setDatabase((currentDatabase) =>
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

    setDatabase((currentDatabase) =>
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

    setDatabase((currentDatabase) =>
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
    setDatabase((currentDatabase) =>
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

    setDatabase((currentDatabase) =>
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
    setDatabase((currentDatabase) =>
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

    setDatabase((currentDatabase) =>
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
    setDatabase((currentDatabase) => ({ ...currentDatabase }));
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

    setDatabase((currentDatabase) =>
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
    setDatabase((currentDatabase) => dismissQuickAccessPrompt(currentDatabase));
  }

  /**
   * Vuelve a mostrar el paso de acceso rapido.
   * Se construye para que Configuracion/Perfil pueda recuperar el CTA.
   * Lo usa ProfileScreen.
   * Sirve para que el usuario active el acceso rapido despues del onboarding.
   */
  function handleQuickAccessShow() {
    setDatabase((currentDatabase) => ({
      ...currentDatabase,
      quickAccessPromptDismissed: false,
    }));
    setActiveMainView("feed");
  }

  return {
    activeFeedTab,
    activeMainView,
    database,
    invitedProfileId,
    isCreatePostOpen,
    lastFeedRefreshAt,
    sessionProfile,
    unreadNotificationsCount,
    visiblePosts,
    setActiveFeedTab,
    setActiveMainView,
    setInvitedProfileId,
    setIsCreatePostOpen,
    handleDemoSignIn,
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
