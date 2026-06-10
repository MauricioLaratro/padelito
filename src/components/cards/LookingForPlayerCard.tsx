import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Swords,
  Trophy,
  UsersRound,
  XCircle,
} from "lucide-react";
import { requestStatusLabels } from "../../constants/postOptions";
import {
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type {
  LookingForPlayerPost,
  MatchJoinRequest,
} from "../../domain/models/postModels";
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
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestCreate: (postId: string) => void;
  onPostCancel: (postId: string) => void;
  onProfileOpen: (profileId: string) => void;
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
  onJoinRequestCancel,
  onJoinRequestCreate,
  onPostCancel,
  onProfileOpen,
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
  const isPendingRequest = existingRequest?.status === "pending";
  const isAcceptedRequest = existingRequest?.status === "accepted";
  const isRejectedRequest = existingRequest?.status === "rejected";
  const isVisibleRequestState =
    isPendingRequest || isAcceptedRequest || isRejectedRequest;
  const articleStateClassName = isPendingRequest
    ? "border-accent-lime/70 bg-[linear-gradient(180deg,rgba(215,242,26,0.08),rgba(21,24,29,1)_32%)]"
    : isAcceptedRequest
      ? "border-feedback-success/60 bg-[linear-gradient(180deg,rgba(142,234,122,0.08),rgba(21,24,29,1)_32%)]"
      : isRejectedRequest
        ? "border-feedback-danger/55"
        : "border-border-subtle";

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
              Busco jugador
            </p>
            {isVisibleRequestState && existingRequest ? (
              <Chip
                icon={isAcceptedRequest ? CheckCircle2 : XCircle}
                tone={
                  isPendingRequest
                    ? "lime"
                    : isAcceptedRequest
                      ? "success"
                      : "danger"
                }
              >
                Solicitud {requestStatusLabels[existingRequest.status]}
              </Chip>
            ) : null}
          </div>
          <h2 className="mt-1 text-2xl font-black leading-tight">
            Partido incompleto
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
          disabled={!isOwnPost && (isAcceptedRequest || isRejectedRequest)}
          icon={isOwnPost ? XCircle : undefined}
          onClick={() => {
            if (isOwnPost) {
              onPostCancel(post.postId);
              return;
            }

            if (isPendingRequest && existingRequest) {
              onJoinRequestCancel(existingRequest.requestId);
              return;
            }

            onJoinRequestCreate(post.postId);
          }}
          variant={isOwnPost || isPendingRequest ? "danger" : "primary"}
        >
          {isOwnPost
            ? "Cancelar publicacion"
            : isPendingRequest
              ? "Cancelar solicitud"
              : existingRequest && existingRequest.status !== "cancelled"
              ? `Solicitud ${requestStatusLabels[existingRequest.status]}`
              : "Solicitar unirme"}
        </Button>
      </div>
    </article>
  );
}
