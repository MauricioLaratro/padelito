import {
  CalendarDays,
  MapPin,
  Swords,
  Trophy,
  UsersRound,
} from "lucide-react";
import { playerLevelLabels, playerPositionLabels, playStyleLabels } from "../../constants/profileOptions";
import type { MatchJoinRequest, LookingForPlayerPost } from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import { formatScheduledDateTime } from "../../utils/dateFormatters";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";
import { PostAuthorRow } from "./PostAuthorRow";

interface LookingForPlayerCardProps {
  authorProfile: Profile;
  currentProfileId: string;
  followRelations: FollowRelation[];
  joinRequests: MatchJoinRequest[];
  onFollowToggle: (profileId: string) => void;
  onJoinRequestCreate: (postId: string) => void;
  post: LookingForPlayerPost;
}

/**
 * Card de Busco jugador.
 * Se construye para mostrar partidos incompletos en lectura rapida.
 * La usa PostCard dentro de los feeds.
 * Sirve para que jugadores se postulen a un partido.
 */
export function LookingForPlayerCard({
  authorProfile,
  currentProfileId,
  followRelations,
  joinRequests,
  onFollowToggle,
  onJoinRequestCreate,
  post,
}: LookingForPlayerCardProps) {
  const isOwnPost = post.authorProfileId === currentProfileId;
  const isFollowed = followRelations.some(
    (followRelation) =>
      followRelation.followerProfileId === currentProfileId &&
      followRelation.followedProfileId === authorProfile.profileId,
  );
  const existingRequest = joinRequests.find(
    (joinRequest) =>
      joinRequest.postId === post.postId &&
      joinRequest.requesterProfileId === currentProfileId,
  );

  return (
    <article className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
      <PostAuthorRow
        authorProfile={authorProfile}
        isFollowed={isFollowed}
        isOwnAuthor={isOwnPost}
        onFollowToggle={onFollowToggle}
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Busco jugador
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight">
            Partido incompleto
          </h2>
        </div>
        <Chip icon={CalendarDays} tone="lime">
          {formatScheduledDateTime(
            post.scheduledDate,
            post.scheduledStartTime,
            post.scheduledEndTime,
          )}
        </Chip>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip icon={MapPin}>{post.placeText}</Chip>
        <Chip icon={Trophy}>{playerLevelLabels[post.desiredLevel]}</Chip>
        <Chip icon={Swords}>{playStyleLabels[post.desiredPlayStyle]}</Chip>
        <Chip icon={UsersRound}>Falta {post.missingPlayersCount}</Chip>
        <Chip>{playerPositionLabels[post.desiredPosition]}</Chip>
      </div>

      {post.confirmedPlayersText ? (
        <p className="mt-3 text-sm text-text-secondary">
          Confirmados: {post.confirmedPlayersText}
        </p>
      ) : null}

      {post.shortNote ? (
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {post.shortNote}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={isOwnPost || Boolean(existingRequest)}
          onClick={() => onJoinRequestCreate(post.postId)}
          variant="primary"
        >
          {isOwnPost
            ? "Tu partido"
            : existingRequest
              ? `Solicitud ${existingRequest.status}`
              : "Solicitar unirme"}
        </Button>
      </div>
    </article>
  );
}
