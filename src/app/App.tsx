import { Bell, Home, Plus, UserRound } from "lucide-react";
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
import { usePadelitoMvp } from "../hooks/usePadelitoMvp";

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

  if (!padelitoMvp.sessionProfile.isOnboardingComplete) {
    return (
      <OnboardingProfileScreen
        currentProfile={padelitoMvp.sessionProfile}
        onProfileSave={padelitoMvp.handleProfileSave}
      />
    );
  }

  const invitedProfile = padelitoMvp.invitedProfileId
    ? padelitoMvp.database.profiles.find(
        (profile) => profile.profileId === padelitoMvp.invitedProfileId,
      )
    : null;

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
            currentProfileId={padelitoMvp.sessionProfile.profileId}
            database={padelitoMvp.database}
            onEventInteractionToggle={
              padelitoMvp.handleEventInteractionToggle
            }
            onFollowToggle={padelitoMvp.handleFollowToggle}
            onInvitationStart={padelitoMvp.setInvitedProfileId}
            onJoinRequestCancel={padelitoMvp.handleJoinRequestCancel}
            onJoinRequestCreate={padelitoMvp.handleJoinRequestCreate}
            onFeedRefresh={padelitoMvp.handleFeedRefresh}
            onPostCreateStart={() => padelitoMvp.setIsCreatePostOpen(true)}
            visiblePosts={padelitoMvp.visiblePosts}
          />
        </div>
      ) : null}

      {padelitoMvp.activeMainView === "notifications" ? (
        <NotificationsScreen
          currentProfileId={padelitoMvp.sessionProfile.profileId}
          notifications={padelitoMvp.database.notifications}
          onNotificationsRead={padelitoMvp.handleNotificationsRead}
        />
      ) : null}

      {padelitoMvp.activeMainView === "profile" ? (
        <ProfileScreen
          currentProfile={padelitoMvp.sessionProfile}
          database={padelitoMvp.database}
          onDirectInvitationStatusChange={
            padelitoMvp.handleDirectInvitationStatusChange
          }
          onJoinRequestCancel={padelitoMvp.handleJoinRequestCancel}
          onJoinRequestStatusChange={padelitoMvp.handleJoinRequestStatusChange}
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
          authorProfile={padelitoMvp.sessionProfile}
          onClose={() => padelitoMvp.setIsCreatePostOpen(false)}
          onPostCreate={padelitoMvp.handlePostCreate}
        />
      ) : null}

      {invitedProfile ? (
        <DirectInvitationModal
          invitedProfile={invitedProfile}
          onClose={() => padelitoMvp.setInvitedProfileId(null)}
          onInvitationCreate={padelitoMvp.handleDirectInvitationCreate}
        />
      ) : null}
    </ScreenShell>
  );
}
