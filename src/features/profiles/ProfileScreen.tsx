import { BellRing, Settings, UserPlus, UsersRound } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import {
  organizationKindLabels,
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type { Profile } from "../../domain/models/profileModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import { ProfileActivitySection } from "../activity/ProfileActivitySection";

interface ProfileScreenProps {
  currentProfile: Profile;
  database: PadelitoLocalDatabase;
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
  onQuickAccessReset: () => void;
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
  onJoinRequestStatusChange,
  onQuickAccessReset,
}: ProfileScreenProps) {
  const followersCount = database.follows.filter(
    (followRelation) =>
      followRelation.followedProfileId === currentProfile.profileId,
  ).length;
  const followingCount = database.follows.filter(
    (followRelation) =>
      followRelation.followerProfileId === currentProfile.profileId,
  ).length;

  return (
    <section className="grid gap-3 px-4 pb-28 pt-4">
      <article className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
        <div className="flex items-start gap-3">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-lime text-xl font-black text-background-primary">
            {currentProfile.displayName.slice(0, 1).toUpperCase()}
          </div>
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
          <Button icon={Settings} variant="secondary">
            Configuracion
          </Button>
          <Button icon={BellRing} onClick={onQuickAccessReset} variant="primary">
            Agregar acceso rapido
          </Button>
        </div>
      </article>

      <ProfileActivitySection
        currentProfileId={currentProfile.profileId}
        database={database}
        onDirectInvitationStatusChange={onDirectInvitationStatusChange}
        onJoinRequestStatusChange={onJoinRequestStatusChange}
      />
    </section>
  );
}
