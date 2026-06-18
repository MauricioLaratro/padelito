import { BellRing, LogOut, Pencil, UserPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { ProfileAvatar } from "../../components/common/ProfileAvatar";
import { PullToRefresh } from "../../components/common/PullToRefresh";
import {
  organizationKindLabels,
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type { RecurringChallengeStatus } from "../../domain/enums/recurringChallengeEnums";
import type { Profile } from "../../domain/models/profileModels";
import type { MatchResult } from "../../domain/models/matchModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import type {
  CreateMatchInput,
  CreateRecurringChallengeInput,
} from "../../services/repositories/padelitoRepository";
import { ProfileActivitySection } from "../activity/ProfileActivitySection";
import { MatchHistorySection } from "../matches/MatchHistorySection";
import { RecurringChallengesSection } from "../matches/RecurringChallengesSection";
import { ProfileEditModal } from "./ProfileEditModal";

interface ProfileScreenProps {
  currentProfile: Profile;
  database: PadelitoLocalDatabase;
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onDirectInvitationCancel: (invitationId: string) => void;
  onDirectInvitationDelete: (invitationId: string) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestDelete: (requestId: string) => void;
  onDataRefresh: () => void;
  onMatchCancel: (matchId: string) => void;
  onMatchCreate: (matchInput: CreateMatchInput) => void;
  onMatchResultRecord: (matchResult: MatchResult) => void;
  onOwnMatchStatsReset: () => void;
  onRecurringChallengeCreate: (
    challengeInput: CreateRecurringChallengeInput,
  ) => void;
  onRecurringChallengeStatusUpdate: (
    challengeId: string,
    status: RecurringChallengeStatus,
  ) => void;
  onPrivateContactOpen: (profileId: string) => void;
  onPostCancel: (postId: string) => void;
  onPostDelete: (postId: string) => void;
  onProfileSave: (profile: Profile) => void;
  onQuickAccessReset: () => void;
  onSignOut: () => void;
}

/**
 * Pantalla de perfil.
 * Se construye como centro de actividad del usuario.
 * La usa App dentro de la navegacion principal.
 * Sirve para ver datos, relaciones, solicitudes, invitaciones y configuracion.
 */
export function ProfileScreen({
  currentProfile,
  database,
  onDirectInvitationStatusChange,
  onDirectInvitationCancel,
  onDirectInvitationDelete,
  onJoinRequestCancel,
  onJoinRequestDelete,
  onJoinRequestStatusChange,
  onDataRefresh,
  onMatchCancel,
  onMatchCreate,
  onMatchResultRecord,
  onOwnMatchStatsReset,
  onRecurringChallengeCreate,
  onRecurringChallengeStatusUpdate,
  onPrivateContactOpen,
  onPostCancel,
  onPostDelete,
  onProfileSave,
  onQuickAccessReset,
  onSignOut,
}: ProfileScreenProps) {
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const followersCount = database.follows.filter(
    (followRelation) =>
      followRelation.followedProfileId === currentProfile.profileId,
  ).length;
  const followingCount = database.follows.filter(
    (followRelation) =>
      followRelation.followerProfileId === currentProfile.profileId,
  ).length;

  return (
    <PullToRefresh
      className="grid gap-3 px-4 pb-28 pt-4"
      onRefresh={onDataRefresh}
    >
      <article className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
        <div className="flex items-start gap-3">
          <ProfileAvatar
            avatarUrl={currentProfile.avatarUrl}
            className="bg-accent-lime text-background-primary"
            displayName={currentProfile.displayName}
            profileType={currentProfile.profileType}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              {currentProfile.profileType === "player"
                ? "Jugador"
                : "Organizacion"}
            </p>
            <h1 className="truncate text-2xl font-black">
              {currentProfile.displayName}
            </h1>
            {currentProfile.bio ? (
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {currentProfile.bio}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {currentProfile.profileType === "player" ? (
            <>
              <Chip>{playerLevelLabels[currentProfile.playerLevel]}</Chip>
              <Chip>{playerPositionLabels[currentProfile.preferredPosition]}</Chip>
              <Chip>{playStyleLabels[currentProfile.preferredPlayStyle]}</Chip>
            </>
          ) : (
            <Chip>{organizationKindLabels[currentProfile.organizationKind]}</Chip>
          )}
          {currentProfile.usualPlace ? <Chip>{currentProfile.usualPlace}</Chip> : null}
          <Chip icon={UsersRound}>{followersCount} seguidores</Chip>
          <Chip icon={UserPlus}>{followingCount} siguiendo</Chip>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            icon={Pencil}
            onClick={() => setIsProfileEditOpen(true)}
            variant="secondary"
          >
            Editar perfil
          </Button>
          <Button icon={BellRing} onClick={onQuickAccessReset} variant="primary">
            Agregar acceso rapido
          </Button>
          <Button icon={LogOut} onClick={onSignOut} variant="secondary">
            Cerrar sesion
          </Button>
        </div>
      </article>

      <ProfileActivitySection
        currentProfileId={currentProfile.profileId}
        database={database}
        onDirectInvitationStatusChange={onDirectInvitationStatusChange}
        onDirectInvitationCancel={onDirectInvitationCancel}
        onDirectInvitationDelete={onDirectInvitationDelete}
        onJoinRequestCancel={onJoinRequestCancel}
        onJoinRequestDelete={onJoinRequestDelete}
        onJoinRequestStatusChange={onJoinRequestStatusChange}
        onPrivateContactOpen={onPrivateContactOpen}
        onPostCancel={onPostCancel}
        onPostDelete={onPostDelete}
      />

      <MatchHistorySection
        currentProfile={currentProfile}
        database={database}
        onMatchCancel={onMatchCancel}
        onMatchCreate={onMatchCreate}
        onMatchResultRecord={onMatchResultRecord}
        onOwnMatchStatsReset={onOwnMatchStatsReset}
      />

      <RecurringChallengesSection
        currentProfile={currentProfile}
        database={database}
        onRecurringChallengeCreate={onRecurringChallengeCreate}
        onRecurringChallengeStatusUpdate={onRecurringChallengeStatusUpdate}
      />

      {isProfileEditOpen ? (
        <ProfileEditModal
          currentProfile={currentProfile}
          onClose={() => setIsProfileEditOpen(false)}
          onProfileSave={onProfileSave}
        />
      ) : null}
    </PullToRefresh>
  );
}
