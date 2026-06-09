import { CalendarDays, MapPin, Swords, Trophy, UserPlus } from "lucide-react";
import {
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type { AvailableToPlayPost } from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import { formatScheduledDateTime } from "../../utils/dateFormatters";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";
import { PostAuthorRow } from "./PostAuthorRow";

interface AvailableToPlayCardProps {
  authorProfile: Profile;
  currentProfileId: string;
  followRelations: FollowRelation[];
  onFollowToggle: (profileId: string) => void;
  onInvitationStart: (profileId: string) => void;
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
  followRelations,
  onFollowToggle,
  onInvitationStart,
  post,
}: AvailableToPlayCardProps) {
  const isOwnPost = post.authorProfileId === currentProfileId;
  const isFollowed = followRelations.some(
    (followRelation) =>
      followRelation.followerProfileId === currentProfileId &&
      followRelation.followedProfileId === authorProfile.profileId,
  );

  return (
    <article className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
      <PostAuthorRow
        authorProfile={authorProfile}
        isFollowed={isFollowed}
        isOwnAuthor={isOwnPost}
        onFollowToggle={onFollowToggle}
      />

      <div className="mt-4 grid gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Estoy disponible
          </p>
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
          disabled={isOwnPost}
          icon={UserPlus}
          onClick={() => onInvitationStart(authorProfile.profileId)}
          variant="primary"
        >
          {isOwnPost ? "Tu publicacion" : "Invitar a jugar"}
        </Button>
      </div>
    </article>
  );
}
