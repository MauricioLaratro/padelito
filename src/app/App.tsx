import { Bell, Home, Plus, Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
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
import { usePadelitoMvp } from "../hooks/usePadelitoMvp";
import type { LookingForPlayerPost } from "../domain/models/postModels";
import type { RecurringChallengeStatus } from "../domain/enums/recurringChallengeEnums";

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
  const [confirmationRequest, setConfirmationRequest] =
    useState<ConfirmationRequest | null>(null);

  useEffect(() => {
    // Reinicia posicion visual al cambiar pantallas para que tabs flotantes no tapen el primer contenido.
    window.scrollTo(0, 0);
  }, [
    padelitoMvp.activeFeedTab,
    padelitoMvp.activeMainView,
    padelitoMvp.isPasswordRecoveryMode,
    padelitoMvp.sessionProfile?.isOnboardingComplete,
  ]);

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
        onEmailSignInRequest={padelitoMvp.handleEmailSignInRequest}
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
    (matchRecord) =>
      matchRecord.ownerProfileId === currentSessionProfile.profileId &&
      matchRecord.status === "scheduled",
  );

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
      body: "La publicacion deja de aparecer en el feed, pero queda en tu actividad.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handlePostCancel(postId),
      title: "Cancelar publicacion",
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
      body: "Vas a retirar tu solicitud pendiente para este partido.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handleJoinRequestCancel(requestId),
      title: "Cancelar solicitud",
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
      body: "La invitacion pendiente se retira y el jugador ya no podra aceptarla.",
      confirmLabel: "Cancelar",
      onConfirm: () => padelitoMvp.handleDirectInvitationCancel(invitationId),
      title: "Cancelar invitacion",
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
      body: "Tus partidos siguen en el historial, pero tus estadisticas vuelven a cero desde ahora.",
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
      body: "El jugador vera que su solicitud fue rechazada.",
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
      body: "La invitacion quedara rechazada para el jugador que la envio.",
      confirmLabel: "Rechazar",
      onConfirm: () =>
        padelitoMvp.handleDirectInvitationStatusChange(invitationId, status),
      title: "Rechazar invitacion",
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
      body: "El desafio deja de estar disponible para nuevos partidos, sin borrar su historial.",
      confirmLabel: "Archivar",
      onConfirm: () =>
        padelitoMvp.handleRecurringChallengeStatusUpdate(challengeId, status),
      title: "Archivar desafio",
    });
  }

  return (
    <ScreenShell>
      {padelitoMvp.activeMainView === "feed" ? (
        <FloatingFeedTabs
          activeTab={padelitoMvp.activeFeedTab}
          onTabChange={padelitoMvp.setActiveFeedTab}
        />
      ) : null}

      <header className="flex items-center justify-between gap-3 px-4 pt-20">
        <img
          alt="Padelito"
          className="h-auto w-40"
          src="/logo-padelito.svg"
        />
        <nav aria-label="Navegacion principal" className="flex gap-2">
          <IconButton
            icon={Home}
            isActive={padelitoMvp.activeMainView === "feed"}
            label="Feed"
            onClick={() => padelitoMvp.setActiveMainView("feed")}
          />
          <IconButton
            icon={Search}
            isActive={padelitoMvp.activeMainView === "players"}
            label="Jugadores"
            onClick={() => {
              padelitoMvp.setSelectedPublicProfileId(null);
              padelitoMvp.setActiveMainView("players");
            }}
          />
          <div className="relative">
            <IconButton
              icon={Bell}
              isActive={padelitoMvp.activeMainView === "notifications"}
              label="Notificaciones"
              onClick={() => padelitoMvp.setActiveMainView("notifications")}
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
            onClick={() => padelitoMvp.setActiveMainView("profile")}
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
            onEventInteractionToggle={
              padelitoMvp.handleEventInteractionToggle
            }
            onFollowToggle={padelitoMvp.handleFollowToggle}
            onInvitationStart={padelitoMvp.setInvitedProfileId}
            onJoinRequestCancel={confirmJoinRequestCancel}
            onJoinRequestCreate={padelitoMvp.handleJoinRequestCreate}
            onFeedRefresh={padelitoMvp.handleFeedRefresh}
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
          onProfileSelect={padelitoMvp.setSelectedPublicProfileId}
          selectedProfileId={padelitoMvp.selectedPublicProfileId}
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
          onJoinRequestCancel={confirmJoinRequestCancel}
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
          onProfileSave={padelitoMvp.handleProfileSave}
          onQuickAccessReset={padelitoMvp.handleQuickAccessShow}
          onSignOut={padelitoMvp.handleSignOut}
        />
      ) : null}

      {padelitoMvp.activeMainView === "feed" ? (
        <FloatingCreatePostButton
          icon={Plus}
          label="Crear publicacion"
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
