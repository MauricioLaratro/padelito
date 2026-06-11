import { Bell, Home, Plus, Search, UserRound } from "lucide-react";
import { useEffect } from "react";
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

/**
 * Componente raiz de Padelito.
 * Se construye para orquestar auth, onboarding, feeds, perfil y modales.
 * Lo usa React desde main.tsx.
 * Sirve como entrada funcional del MVP local y futura PWA Supabase.
 */
export function App() {
  const padelitoMvp = usePadelitoMvp();

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
        <div className="grid gap-3">
          {!padelitoMvp.database.quickAccessPromptDismissed ? (
            <div className="px-4 pt-4">
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
            onJoinRequestCancel={padelitoMvp.handleJoinRequestCancel}
            onJoinRequestCreate={padelitoMvp.handleJoinRequestCreate}
            onFeedRefresh={padelitoMvp.handleFeedRefresh}
            onPostCancel={padelitoMvp.handlePostCancel}
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
            padelitoMvp.handleDirectInvitationStatusChange
          }
          onJoinRequestCancel={padelitoMvp.handleJoinRequestCancel}
          onJoinRequestStatusChange={padelitoMvp.handleJoinRequestStatusChange}
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
            padelitoMvp.handleDirectInvitationStatusChange
          }
          onDirectInvitationCancel={padelitoMvp.handleDirectInvitationCancel}
          onJoinRequestCancel={padelitoMvp.handleJoinRequestCancel}
          onJoinRequestStatusChange={padelitoMvp.handleJoinRequestStatusChange}
          onMatchCancel={padelitoMvp.handleMatchCancel}
          onMatchCreate={padelitoMvp.handleMatchCreate}
          onMatchResultRecord={padelitoMvp.handleMatchResultRecord}
          onRecurringChallengeCreate={
            padelitoMvp.handleRecurringChallengeCreate
          }
          onPrivateContactOpen={padelitoMvp.handlePrivateContactOpen}
          onPostCancel={padelitoMvp.handlePostCancel}
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
    </ScreenShell>
  );
}
