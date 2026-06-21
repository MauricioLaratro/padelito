import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Swords,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";
import { invitationStatusLabels } from "../../constants/postOptions";
import {
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type {
  AvailableToPlayPost,
  DirectMatchInvitation,
} from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import { formatScheduledDateTime } from "../../utils/dateFormatters";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";
import { PostAuthorRow } from "./PostAuthorRow";

interface AvailableToPlayCardProps {
  authorProfile: Profile;
  currentProfileId: string;
  directMatchInvitations: DirectMatchInvitation[];
  followRelations: FollowRelation[];
  onFollowToggle: (profileId: string) => void;
  onInvitationCancel: (invitationId: string) => void;
  onInvitationStart: (profileId: string) => void;
  onPostCancel: (postId: string) => void;
  onProfileOpen: (profileId: string) => void;
  post: AvailableToPlayPost;
}

/**
 * Card de Estoy disponible.
 * Se construye para conectar disponibilidad con invitaciones directas.
 * La usa PostCard dentro de los feeds.
 * Sirve para invitar a jugar a un perfil disponible.
 */
export function AvailableToPlayCard({
  authorProfile,
  currentProfileId,
  directMatchInvitations,
  followRelations,
  onFollowToggle,
  onInvitationCancel,
  onInvitationStart,
  onPostCancel,
  onProfileOpen,
  post,
}: AvailableToPlayCardProps) {
  const isOwnPost = post.authorProfileId === currentProfileId;
  const existingInvitation = directMatchInvitations.find(
    (directMatchInvitation) =>
      directMatchInvitation.inviterProfileId === currentProfileId &&
      directMatchInvitation.invitedProfileId === authorProfile.profileId &&
      (directMatchInvitation.status === "pending" ||
        directMatchInvitation.status === "accepted"),
  );
  const isPendingInvitation = existingInvitation?.status === "pending";
  const isAcceptedInvitation = existingInvitation?.status === "accepted";
  const isVisibleInvitationState = Boolean(existingInvitation) && !isOwnPost;
  const articleStateClassName = isPendingInvitation
    ? "border-accent-lime/70 bg-[linear-gradient(180deg,rgba(215,242,26,0.08),rgba(21,24,29,1)_32%)]"
    : isAcceptedInvitation
      ? "border-feedback-success/60 bg-[linear-gradient(180deg,rgba(142,234,122,0.08),rgba(21,24,29,1)_32%)]"
      : "border-border-subtle";
  const isFollowed = followRelations.some(
    (followRelation) =>
      followRelation.followerProfileId === currentProfileId &&
      followRelation.followedProfileId === authorProfile.profileId,
  );

  return (
    <article
      className={`rounded-lg border bg-surface-primary p-4 shadow-floating ${articleStateClassName}`}
    >
      <PostAuthorRow
        authorProfile={authorProfile}
        isFollowed={isFollowed}
        isOwnAuthor={isOwnPost}
        onFollowToggle={onFollowToggle}
        onProfileOpen={onProfileOpen}
      />

      <div className="mt-4 grid gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Estoy disponible
            </p>
            {isVisibleInvitationState && existingInvitation ? (
              <Chip
                icon={isAcceptedInvitation ? CheckCircle2 : UserPlus}
                tone={isAcceptedInvitation ? "success" : "lime"}
              >
                Invitación {invitationStatusLabels[existingInvitation.status]}
              </Chip>
            ) : null}
          </div>
          <h2 className="mt-1 text-2xl font-black leading-tight">
            Busca partido
          </h2>
        </div>
        <div className="flex max-w-full">
          <Chip icon={CalendarDays} tone="lime">
            {formatScheduledDateTime(
              post.scheduledDate,
              post.scheduledStartTime,
              post.scheduledEndTime,
            )}
          </Chip>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip icon={MapPin}>{post.preferredPlaceText ?? post.placeText}</Chip>
        <Chip icon={Trophy}>{playerLevelLabels[post.availableLevel]}</Chip>
        <Chip>{playerPositionLabels[post.availablePosition]}</Chip>
        <Chip icon={Swords}>{playStyleLabels[post.availablePlayStyle]}</Chip>
      </div>

      {post.shortNote ? (
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {post.shortNote}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={!isOwnPost && isAcceptedInvitation}
          icon={
            isOwnPost || isPendingInvitation
              ? XCircle
              : isAcceptedInvitation
                ? CheckCircle2
                : UserPlus
          }
          onClick={() => {
            if (isOwnPost) {
              onPostCancel(post.postId);
              return;
            }

            if (isPendingInvitation && existingInvitation) {
              onInvitationCancel(existingInvitation.invitationId);
              return;
            }

            onInvitationStart(authorProfile.profileId);
          }}
          variant={isOwnPost || isPendingInvitation ? "danger" : "primary"}
        >
          {isOwnPost
            ? "Cancelar publicación"
            : isPendingInvitation
              ? "Cancelar invitación"
              : isAcceptedInvitation
                ? "Invitación aceptada"
                : "Invitar a jugar"}
        </Button>
      </div>
    </article>
  );
}
