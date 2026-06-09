import {
  CalendarDays,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import type { EventPost, PostInteraction } from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import { formatScheduledDateTime } from "../../utils/dateFormatters";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";
import { PostAuthorRow } from "./PostAuthorRow";

interface EventPostCardProps {
  authorProfile: Profile;
  currentProfileId: string;
  followRelations: FollowRelation[];
  interactions: PostInteraction[];
  onEventInteractionToggle: (
    postId: string,
    interactionType: "interested" | "attending",
  ) => void;
  onFollowToggle: (profileId: string) => void;
  post: EventPost;
}

/**
 * Card de evento.
 * Se construye para anuncios mas expresivos con imagen y links externos.
 * La usa PostCard dentro de los feeds.
 * Sirve para marcar interes, asistencia y derivar a WhatsApp o inscripcion.
 */
export function EventPostCard({
  authorProfile,
  currentProfileId,
  followRelations,
  interactions,
  onEventInteractionToggle,
  onFollowToggle,
  post,
}: EventPostCardProps) {
  const isOwnPost = post.authorProfileId === currentProfileId;
  const isFollowed = followRelations.some(
    (followRelation) =>
      followRelation.followerProfileId === currentProfileId &&
      followRelation.followedProfileId === authorProfile.profileId,
  );
  const interestedCount = interactions.filter(
    (interaction) =>
      interaction.postId === post.postId &&
      interaction.interactionType === "interested",
  ).length;
  const attendingCount = interactions.filter(
    (interaction) =>
      interaction.postId === post.postId &&
      interaction.interactionType === "attending",
  ).length;
  const isInterested = interactions.some(
    (interaction) =>
      interaction.postId === post.postId &&
      interaction.profileId === currentProfileId &&
      interaction.interactionType === "interested",
  );
  const isAttending = interactions.some(
    (interaction) =>
      interaction.postId === post.postId &&
      interaction.profileId === currentProfileId &&
      interaction.interactionType === "attending",
  );

  return (
    <article className="overflow-hidden rounded-lg border border-border-subtle bg-surface-primary shadow-floating">
      {post.imageUrl ? (
        <img
          alt={post.title}
          className="aspect-video w-full object-cover"
          src={post.imageUrl}
        />
      ) : (
        <div className="aspect-video bg-[radial-gradient(circle_at_70%_25%,rgba(215,242,26,0.28),transparent_24%),linear-gradient(135deg,#20242B,#0F1115)]" />
      )}

      <div className="p-4">
        <PostAuthorRow
          authorProfile={authorProfile}
          isFollowed={isFollowed}
          isOwnAuthor={isOwnPost}
          onFollowToggle={onFollowToggle}
        />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Evento
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight">
              {post.title}
            </h2>
          </div>
          <Chip icon={CalendarDays} tone="lime">
            {formatScheduledDateTime(post.scheduledDate, post.scheduledStartTime)}
          </Chip>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon={MapPin}>{post.placeText}</Chip>
          <Chip icon={Heart}>{interestedCount} interesados</Chip>
          <Chip icon={UsersRound}>{attendingCount} asistentes</Chip>
        </div>

        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {post.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            icon={Heart}
            onClick={() =>
              onEventInteractionToggle(post.postId, "interested")
            }
            variant={isInterested ? "secondary" : "primary"}
          >
            Me interesa
          </Button>
          <Button
            onClick={() => onEventInteractionToggle(post.postId, "attending")}
            variant={isAttending ? "secondary" : "primary"}
          >
            Asistire
          </Button>
          {post.whatsappUrl ? (
            <Button
              icon={MessageCircle}
              onClick={() => window.open(post.whatsappUrl, "_blank", "noopener")}
              variant="secondary"
            >
              WhatsApp
            </Button>
          ) : null}
          {post.registrationUrl ? (
            <Button
              icon={ExternalLink}
              onClick={() =>
                window.open(post.registrationUrl, "_blank", "noopener")
              }
              variant="secondary"
            >
              Inscripcion
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
