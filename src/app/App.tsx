import { Bell, Home, Plus, Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { IconButton } from "../components/common/IconButton";
import { ScreenShell } from "../components/layout/ScreenShell";
import { FloatingCreatePostButton } from "../components/navigation/FloatingCreatePostButton";
import { FloatingFeedTabs } from "../components/navigation/FloatingFeedTabs";
import { AuthScreen } from "../features/auth/AuthScreen";
import { FeedScreen } from "../features/feed/FeedScreen";
import { NotificationsScreen } from "../features/notifications/NotificationsScreen";
import { OnboardingProfileScreen } from "../features/onboarding/OnboardingProfileScreen";
import { QuickAccessOnboardingStep } from "../features/onboarding/QuickAccessOnboardingStep";
import { CreatePostModal } from "../features/posts/CreatePostModal";
import { DirectInvitationModal } from "../features/posts/DirectInvitationModal";
import { ProfileScreen } from "../features/profiles/ProfileScreen";
import { PlayerSearchScreen } from "../features/players/PlayerSearchScreen";
import { PublicPlayerProfileScreen } from "../features/players/PublicPlayerProfileScreen";
import { usePadelitoMvp } from "../hooks/usePadelitoMvp";
import type { LookingForPlayerPost } from "../domain/models/postModels";
import type { PlayerProfile } from "../domain/models/profileModels";
import type { RecurringChallengeStatus } from "../domain/enums/recurringChallengeEnums";
import { synchronizeRemotePushSubscription } from "../services/push/pushNotificationClient";

interface ConfirmationRequest {
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "primary";
}

/**
 * Componente raiz de Padelito.
 * Se construye para orquestar auth, onboarding, feeds, perfil y modales.
 * Lo usa React desde main.tsx.
 * Sirve como entrada funcional del MVP local y futura PWA Supabase.
 */
export function App() {
  const padelitoMvp = usePadelitoMvp();
  const {
    activeFeedTab,
    activeMainView,
    handleDataRefresh,
    isPasswordRecoveryMode,
    sessionProfile,
  } = padelitoMvp;
  const [confirmationRequest, setConfirmationRequest] =
    useState<ConfirmationRequest | null>(null);
  const navigationRefreshKeyRef = useRef(`${activeMainView}:${activeFeedTab}`);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedNotificationIdsRef = useRef(false);

  useEffect(() => {
    // Reinicia posicion visual al cambiar pantallas para que tabs flotantes no tapen el primer contenido.
    window.scrollTo(0, 0);
  }, [
    activeFeedTab,
    activeMainView,
    isPasswordRecoveryMode,
    sessionProfile?.isOnboardingComplete,
  ]);

  useEffect(() => {
    const nextNavigationRefreshKey = `${activeMainView}:${activeFeedTab}`;

    if (navigationRefreshKeyRef.current === nextNavigationRefreshKey) {
      return;
    }

    navigationRefreshKeyRef.current = nextNavigationRefreshKey;
    handleDataRefresh();
  }, [activeFeedTab, activeMainView, handleDataRefresh]);

  useEffect(() => {
    if (!sessionProfile || !("Notification" in window)) {
      return;
    }

    const ownNotifications = padelitoMvp.database.notifications.filter(
      (notification) =>
        notification.recipientProfileId === sessionProfile.profileId,
    );

    if (!hasInitializedNotificationIdsRef.current) {
      knownNotificationIdsRef.current = new Set(
        ownNotifications.map((notification) => notification.notificationId),
      );
      hasInitializedNotificationIdsRef.current = true;
      return;
    }

    if (Notification.permission !== "granted") {
      ownNotifications.forEach((notification) =>
        knownNotificationIdsRef.current.add(notification.notificationId),
      );
      return;
    }

    const newUnreadNotifications = ownNotifications.filter(
      (notification) =>
        !notification.readAt &&
        !knownNotificationIdsRef.current.has(notification.notificationId),
    );

    ownNotifications.forEach((notification) =>
      knownNotificationIdsRef.current.add(notification.notificationId),
    );

    if (newUnreadNotifications.length === 0) {
      return;
    }

    void showLocalNotification(
      newUnreadNotifications[0].title,
      newUnreadNotifications[0].body,
    );
  }, [padelitoMvp.database.notifications, sessionProfile]);

  useEffect(() => {
    if (
      !sessionProfile ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    void synchronizeRemotePushSubscription();
  }, [sessionProfile]);

  if (!padelitoMvp.sessionProfile || padelitoMvp.isPasswordRecoveryMode) {
    return (
      <AuthScreen
        authErrorMessage={padelitoMvp.authErrorMessage}
        authLoadingAction={padelitoMvp.authLoadingAction}
        authStatusMessage={padelitoMvp.authStatusMessage}
        isAuthSessionChecking={padelitoMvp.isAuthSessionChecking}
        isEmailAuthEnabled={padelitoMvp.isEmailAuthEnabled}
        isPasswordRecoveryMode={padelitoMvp.isPasswordRecoveryMode}
        onDemoSignIn={padelitoMvp.handleDemoSignIn}
        onPasswordResetRequest={padelitoMvp.handlePasswordResetRequest}
        onPasswordSignInRequest={padelitoMvp.handlePasswordSignInRequest}
        onPasswordSignUpRequest={padelitoMvp.handlePasswordSignUpRequest}
        onPasswordUpdateRequest={padelitoMvp.handlePasswordUpdateRequest}
      />
    );
  }

  const currentSessionProfile = padelitoMvp.sessionProfile;

  if (!currentSessionProfile.isOnboardingComplete) {
    return (
      <OnboardingProfileScreen
        currentProfile={currentSessionProfile}
        onProfileSave={padelitoMvp.handleProfileSave}
      />
    );
  }

  const invitedProfile = padelitoMvp.invitedProfileId
    ? padelitoMvp.database.profiles.find(
        (profile) => profile.profileId === padelitoMvp.invitedProfileId,
      )
    : null;
  const availableInvitationPosts = padelitoMvp.database.posts.filter(
    (post): post is LookingForPlayerPost =>
      post.authorProfileId === currentSessionProfile.profileId &&
      post.postType === "looking_for_player" &&
      post.isActive &&
      post.missingPlayersCount > 0,
  );
  const availableInvitationMatches = padelitoMvp.database.matchRecords.filter(
    (matchRecord) => {
      if (
        matchRecord.ownerProfileId !== currentSessionProfile.profileId ||
        matchRecord.status !== "scheduled"
      ) {
        return false;
      }

      const sourcePost = matchRecord.sourcePostId
        ? padelitoMvp.database.posts.find(
            (post) => post.postId === matchRecord.sourcePostId,
          )
        : null;

      return (
        !sourcePost ||
        (sourcePost.postType === "looking_for_player" &&
          sourcePost.isActive &&
          sourcePost.missingPlayersCount > 0)
      );
    },
  );
  const selectedPublicPlayerProfile = padelitoMvp.selectedPublicProfileId
    ? padelitoMvp.database.profiles.find(
        (profile): profile is PlayerProfile =>
          profile.profileType === "player" &&
          profile.profileId === padelitoMvp.selectedPublicProfileId,
      )
    : null;

  /**
   * Abre confirmacion para una accion sensible.
   * Se construye para que las pantallas no dupliquen UX destructiva.
   * Lo usan wrappers de handlers principales.
   * Sirve para evitar toques accidentales antes de modificar datos.
   */
  function requestConfirmation(nextConfirmation: ConfirmationRequest) {
    setConfirmationRequest(nextConfirmation);
  }

  /**
   * Ejecuta la accion confirmada y cierra el dialogo.
   * Se construye para mantener la UI en un unico flujo.
   * Lo usa ConfirmationDialog.
   * Sirve para no dejar modales colgados despues de confirmar.
   */
  function handleConfirmationAccept() {
    const currentConfirmation = confirmationRequest;

    if (!currentConfirmation) {
      return;
    }

    setConfirmationRequest(null);
    currentConfirmation.onConfirm();
  }

  /**
   * Solicita confirmacion para cancelar publicacion.
   * Se construye para proteger contenido visible del feed.
   * Lo usan FeedScreen y ProfileScreen.
   * Sirve para retirar publicaciones sin borrar actividad.
   */
  function confirmPostCancel(postId: string) {
    requestConfirmation({
      body: "La publicación deja de aparecer en el feed, pero queda en tu actividad.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handlePostCancel(postId),
      title: "Cancelar publicación",
    });
  }

  /**
   * Solicita confirmacion para eliminar publicacion cerrada.
   * Se construye para limpiar perfil sin borrar partidos estructurados.
   * Lo usa ProfileScreen.
   * Sirve para retirar actividad operativa antigua.
   */
  function confirmPostDelete(postId: string) {
    requestConfirmation({
      body: "La publicación se elimina de tu actividad. El partido estructurado, si existe, queda en historial.",
      confirmLabel: "Eliminar",
      onConfirm: () => padelitoMvp.handlePostDelete(postId),
      title: "Eliminar publicación",
      tone: "danger",
    });
  }

  /**
   * Solicita confirmacion para cancelar solicitud.
   * Se construye para evitar retirar postulaciones por accidente.
   * Lo usan feed, notificaciones y perfil.
   * Sirve para mantener claro el arrepentimiento del jugador.
   */
  function confirmJoinRequestCancel(requestId: string) {
    requestConfirmation({
      body: "Vas a retirar esta solicitud o participación. Si ya estaba aceptada, se libera el cupo.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handleJoinRequestCancel(requestId),
      title: "Cancelar solicitud",
    });
  }

  /**
   * Solicita confirmacion para eliminar solicitud cerrada.
   * Se construye para limpiar actividad sin tocar partidos activos.
   * Lo usa ProfileScreen.
   * Sirve para quitar cards canceladas o rechazadas.
   */
  function confirmJoinRequestDelete(requestId: string) {
    requestConfirmation({
      body: "La solicitud se elimina de tu actividad.",
      confirmLabel: "Eliminar",
      onConfirm: () => padelitoMvp.handleJoinRequestDelete(requestId),
      title: "Eliminar solicitud",
      tone: "danger",
    });
  }

  /**
   * Solicita confirmacion para cancelar invitacion.
   * Se construye para proteger invitaciones pendientes.
   * Lo usa ProfileScreen.
   * Sirve para retirar invitaciones sin efectos colaterales ocultos.
   */
  function confirmDirectInvitationCancel(invitationId: string) {
    requestConfirmation({
      body: "La invitación se cancela. Si ya estaba aceptada, se libera el cupo y se retira al jugador.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handleDirectInvitationCancel(invitationId),
      title: "Cancelar invitación",
    });
  }

  /**
   * Solicita confirmacion para eliminar invitacion cerrada.
   * Se construye para limpiar actividad antigua.
   * Lo usa ProfileScreen.
   * Sirve para evitar scroll acumulado en el perfil.
   */
  function confirmDirectInvitationDelete(invitationId: string) {
    requestConfirmation({
      body: "La invitación se elimina de tu actividad.",
      confirmLabel: "Eliminar",
      onConfirm: () => padelitoMvp.handleDirectInvitationDelete(invitationId),
      title: "Eliminar invitación",
      tone: "danger",
    });
  }

  /**
   * Solicita confirmacion para cancelar partido.
   * Se construye para evitar cancelar coordinaciones activas por error.
   * Lo usa MatchHistorySection mediante ProfileScreen.
   * Sirve para conservar el partido como cancelado en historial.
   */
  function confirmMatchCancel(matchId: string) {
    requestConfirmation({
      body: "El partido queda como cancelado y se conserva en el historial.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handleMatchCancel(matchId),
      title: "Cancelar partido",
    });
  }

  /**
   * Solicita confirmacion para resetear score propio.
   * Se construye para no editar resultados ni historial.
   * Lo usa MatchHistorySection mediante ProfileScreen.
   * Sirve para volver a empezar las estadisticas del perfil.
   */
  function confirmOwnMatchStatsReset() {
    requestConfirmation({
      body: "Tus partidos siguen en el historial, pero tus estadísticas vuelven a cero desde ahora.",
      confirmLabel: "Resetear",
      onConfirm: padelitoMvp.handleOwnMatchStatsReset,
      title: "Resetear score",
    });
  }

  /**
   * Responde solicitudes con confirmacion al rechazar.
   * Se construye para que aceptar siga rapido y rechazar sea consciente.
   * Lo usan notificaciones y actividad de perfil.
   * Sirve para evitar rechazos accidentales.
   */
  function handleJoinRequestStatusChange(
    requestId: string,
    status: "accepted" | "rejected",
  ) {
    if (status === "accepted") {
      padelitoMvp.handleJoinRequestStatusChange(requestId, status);
      return;
    }

    requestConfirmation({
      body: "El jugador verá que su solicitud fue rechazada.",
      confirmLabel: "Rechazar",
      onConfirm: () => padelitoMvp.handleJoinRequestStatusChange(requestId, status),
      title: "Rechazar solicitud",
    });
  }

  /**
   * Responde invitaciones con confirmacion al rechazar.
   * Se construye para que aceptar siga rapido y rechazar sea consciente.
   * Lo usan notificaciones y actividad de perfil.
   * Sirve para evitar rechazos accidentales.
   */
  function handleDirectInvitationStatusChange(
    invitationId: string,
    status: "accepted" | "rejected",
  ) {
    if (status === "accepted") {
      padelitoMvp.handleDirectInvitationStatusChange(invitationId, status);
      return;
    }

    requestConfirmation({
      body: "La invitación quedará rechazada para el jugador que la envió.",
      confirmLabel: "Rechazar",
      onConfirm: () =>
        padelitoMvp.handleDirectInvitationStatusChange(invitationId, status),
      title: "Rechazar invitación",
    });
  }

  /**
   * Actualiza desafios con confirmacion al archivar.
   * Se construye para reactivar rapido y archivar con cuidado.
   * Lo usa RecurringChallengesSection mediante ProfileScreen.
   * Sirve para proteger series recurrentes con historial.
   */
  function handleRecurringChallengeStatusUpdate(
    challengeId: string,
    status: RecurringChallengeStatus,
  ) {
    if (status !== "archived") {
      padelitoMvp.handleRecurringChallengeStatusUpdate(challengeId, status);
      return;
    }

    requestConfirmation({
      body: "El desafío deja de estar disponible para nuevos partidos, sin borrar su historial.",
      confirmLabel: "Archivar",
      onConfirm: () =>
        padelitoMvp.handleRecurringChallengeStatusUpdate(challengeId, status),
      title: "Archivar desafío",
    });
  }

  /**
   * Navega entre paneles y refresca si el usuario toca el panel activo.
   * Se construye para reemplazar el pull-to-refresh que compite con el navegador.
   * Lo usa la navegacion principal.
   * Sirve para actualizar al entrar a un panel o tocar el panel activo.
   */
  function handleMainViewSelect(nextMainView: typeof padelitoMvp.activeMainView) {
    const isCurrentMainView = padelitoMvp.activeMainView === nextMainView;

    if (nextMainView !== "publicProfile") {
      padelitoMvp.setSelectedPublicProfileId(null);
    }

    if (!isCurrentMainView) {
      padelitoMvp.setActiveMainView(nextMainView);
      return;
    }

    window.scrollTo({ behavior: "smooth", top: 0 });
    padelitoMvp.handleDataRefresh();
  }

  /**
   * Cambia el feed visible y refresca si el usuario toca el tab activo.
   * Se construye para que tocar Comunidad/Siguiendo tambien refresque si ya esta activo.
   * Lo usa la navegacion flotante del feed.
   * Sirve para mantener datos frescos sin gesto de arrastre.
   */
  function handleFeedTabSelect(nextFeedTab: typeof padelitoMvp.activeFeedTab) {
    const isCurrentFeedTab = padelitoMvp.activeFeedTab === nextFeedTab;

    if (!isCurrentFeedTab) {
      padelitoMvp.setActiveFeedTab(nextFeedTab);
      return;
    }

    window.scrollTo({ behavior: "smooth", top: 0 });
    padelitoMvp.handleDataRefresh();
  }

  return (
    <ScreenShell>
      {padelitoMvp.activeMainView === "feed" ? (
        <FloatingFeedTabs
          activeTab={padelitoMvp.activeFeedTab}
          onTabChange={handleFeedTabSelect}
        />
      ) : null}

      <header className="flex items-center justify-between gap-3 px-4 pt-20">
        <img
          alt="Padelito"
          className="h-auto w-40"
          src="/logo-padelito.svg"
        />
        <nav aria-label="Navegación principal" className="flex gap-2">
          <IconButton
            icon={Home}
            isActive={padelitoMvp.activeMainView === "feed"}
            label="Feed"
            onClick={() => handleMainViewSelect("feed")}
          />
          <IconButton
            icon={Search}
            isActive={padelitoMvp.activeMainView === "players"}
            label="Jugadores"
            onClick={() => handleMainViewSelect("players")}
          />
          <div className="relative">
            <IconButton
              icon={Bell}
              isActive={padelitoMvp.activeMainView === "notifications"}
              label="Notificaciones"
              onClick={() => handleMainViewSelect("notifications")}
            />
            {padelitoMvp.unreadNotificationsCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-accent-lime text-[10px] font-black text-background-primary">
                {padelitoMvp.unreadNotificationsCount}
              </span>
            ) : null}
          </div>
          <IconButton
            icon={UserRound}
            isActive={padelitoMvp.activeMainView === "profile"}
            label="Perfil"
            onClick={() => handleMainViewSelect("profile")}
          />
        </nav>
      </header>

      {padelitoMvp.remoteErrorMessage ? (
        <div className="px-4 pt-3">
          <p className="mt-2 rounded-lg border border-feedback-danger/40 bg-feedback-danger/10 p-3 text-sm leading-6 text-feedback-danger">
            {padelitoMvp.remoteErrorMessage}
          </p>
        </div>
      ) : null}
      {padelitoMvp.remoteStatusMessage ? (
        <div className="px-4 pt-3">
          <p className="mt-2 rounded-lg border border-feedback-success/40 bg-feedback-success/10 p-3 text-sm leading-6 text-feedback-success">
            {padelitoMvp.remoteStatusMessage}
          </p>
        </div>
      ) : null}

      {padelitoMvp.activeMainView === "feed" ? (
        <div className="grid min-w-0 gap-3">
          {!padelitoMvp.database.quickAccessPromptDismissed ? (
            <div className="min-w-0 px-4 pt-4">
              <QuickAccessOnboardingStep
                onDismiss={padelitoMvp.handleQuickAccessDismiss}
              />
            </div>
          ) : null}
          <FeedScreen
            currentProfileId={currentSessionProfile.profileId}
            database={padelitoMvp.database}
            directMatchInvitations={padelitoMvp.database.directMatchInvitations}
            onEventInteractionToggle={
              padelitoMvp.handleEventInteractionToggle
            }
            onFollowToggle={padelitoMvp.handleFollowToggle}
            onInvitationCancel={confirmDirectInvitationCancel}
            onInvitationStart={padelitoMvp.setInvitedProfileId}
            onJoinRequestCancel={confirmJoinRequestCancel}
            onJoinRequestCreate={padelitoMvp.handleJoinRequestCreate}
            onPostCancel={confirmPostCancel}
            onPostCreateStart={() => padelitoMvp.setIsCreatePostOpen(true)}
            onProfileOpen={padelitoMvp.handlePublicProfileOpen}
            visiblePosts={padelitoMvp.visiblePosts}
          />
        </div>
      ) : null}

      {padelitoMvp.activeMainView === "players" ? (
        <PlayerSearchScreen
          currentProfileId={currentSessionProfile.profileId}
          database={padelitoMvp.database}
          onFollowToggle={padelitoMvp.handleFollowToggle}
          onInvitationStart={padelitoMvp.setInvitedProfileId}
          onProfileOpen={padelitoMvp.handlePublicProfileOpen}
        />
      ) : null}

      {padelitoMvp.activeMainView === "publicProfile" &&
      selectedPublicPlayerProfile ? (
        <PublicPlayerProfileScreen
          currentProfileId={currentSessionProfile.profileId}
          database={padelitoMvp.database}
          onBack={() => {
            padelitoMvp.setSelectedPublicProfileId(null);
            padelitoMvp.setActiveMainView("players");
          }}
          onFollowToggle={padelitoMvp.handleFollowToggle}
          onInvitationStart={padelitoMvp.setInvitedProfileId}
          onPrivateContactOpen={padelitoMvp.handlePrivateContactOpen}
          profile={selectedPublicPlayerProfile}
        />
      ) : null}

      {padelitoMvp.activeMainView === "notifications" ? (
        <NotificationsScreen
          currentProfileId={currentSessionProfile.profileId}
          database={padelitoMvp.database}
          notifications={padelitoMvp.database.notifications}
          onDirectInvitationStatusChange={
            handleDirectInvitationStatusChange
          }
          onJoinRequestCancel={confirmJoinRequestCancel}
          onJoinRequestStatusChange={handleJoinRequestStatusChange}
          onNotificationDelete={padelitoMvp.handleNotificationDelete}
          onNotificationsRead={padelitoMvp.handleNotificationsRead}
          onPrivateContactOpen={padelitoMvp.handlePrivateContactOpen}
          onProfileOpen={padelitoMvp.handlePublicProfileOpen}
        />
      ) : null}

      {padelitoMvp.activeMainView === "profile" ? (
        <ProfileScreen
          currentProfile={currentSessionProfile}
          database={padelitoMvp.database}
          onDirectInvitationStatusChange={
            handleDirectInvitationStatusChange
          }
          onDirectInvitationCancel={confirmDirectInvitationCancel}
          onDirectInvitationDelete={confirmDirectInvitationDelete}
          onJoinRequestCancel={confirmJoinRequestCancel}
          onJoinRequestDelete={confirmJoinRequestDelete}
          onJoinRequestStatusChange={handleJoinRequestStatusChange}
          onMatchCancel={confirmMatchCancel}
          onMatchCreate={padelitoMvp.handleMatchCreate}
          onMatchResultRecord={padelitoMvp.handleMatchResultRecord}
          onOwnMatchStatsReset={confirmOwnMatchStatsReset}
          onRecurringChallengeCreate={
            padelitoMvp.handleRecurringChallengeCreate
          }
          onRecurringChallengeStatusUpdate={
            handleRecurringChallengeStatusUpdate
          }
          onPrivateContactOpen={padelitoMvp.handlePrivateContactOpen}
          onPostCancel={confirmPostCancel}
          onPostDelete={confirmPostDelete}
          onProfileSave={padelitoMvp.handleProfileSave}
          onQuickAccessReset={padelitoMvp.handleQuickAccessShow}
          onSignOut={padelitoMvp.handleSignOut}
        />
      ) : null}

      {padelitoMvp.activeMainView === "feed" ? (
        <FloatingCreatePostButton
          icon={Plus}
          label="Crear publicación"
          onClick={() => padelitoMvp.setIsCreatePostOpen(true)}
        />
      ) : null}

      {padelitoMvp.isCreatePostOpen ? (
        <CreatePostModal
          authorProfile={currentSessionProfile}
          onClose={() => padelitoMvp.setIsCreatePostOpen(false)}
          onPostCreate={padelitoMvp.handlePostCreate}
        />
      ) : null}

      {invitedProfile ? (
        <DirectInvitationModal
          availableInvitationMatches={availableInvitationMatches}
          availableInvitationPosts={availableInvitationPosts}
          invitedProfile={invitedProfile}
          onClose={() => padelitoMvp.setInvitedProfileId(null)}
          onInvitationCreate={padelitoMvp.handleDirectInvitationCreate}
        />
      ) : null}

      <ConfirmationDialog
        body={confirmationRequest?.body ?? ""}
        confirmLabel={confirmationRequest?.confirmLabel ?? "Confirmar"}
        isOpen={Boolean(confirmationRequest)}
        onCancel={() => setConfirmationRequest(null)}
        onConfirm={handleConfirmationAccept}
        title={confirmationRequest?.title ?? ""}
        tone={confirmationRequest?.tone}
      />
    </ScreenShell>
  );
}

/**
 * Muestra un aviso local usando el service worker disponible.
 * Se construye para aprovechar permisos del navegador sin backend push todavia.
 * Lo usa App cuando detecta notificaciones internas nuevas.
 * Sirve para avisar mientras la app esta abierta o se refresca.
 */
async function showLocalNotification(title: string, body: string) {
  if (!("serviceWorker" in navigator)) {
    new Notification(title, {
      body,
      icon: "/app-icon.svg",
      tag: "padelito-internal-notification",
    });
    return;
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready.catch(
    () => null,
  );

  if (!serviceWorkerRegistration) {
    return;
  }

  await serviceWorkerRegistration.showNotification(title, {
    body,
    icon: "/app-icon.svg",
    tag: "padelito-internal-notification",
  });
}
