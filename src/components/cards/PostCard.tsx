import type {
  DirectMatchInvitation,
  MatchJoinRequest,
  Post,
  PostInteraction,
} from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import { AvailableToPlayCard } from "./AvailableToPlayCard";
import { EventPostCard } from "./EventPostCard";
import { LookingForPlayerCard } from "./LookingForPlayerCard";

interface PostCardProps {
  currentProfileId: string;
  directMatchInvitations: DirectMatchInvitation[];
  followRelations: FollowRelation[];
  joinRequests: MatchJoinRequest[];
  onEventInteractionToggle: (
    postId: string,
    interactionType: "interested" | "attending",
  ) => void;
  onFollowToggle: (profileId: string) => void;
  onInvitationCancel: (invitationId: string) => void;
  onInvitationStart: (profileId: string) => void;
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestCreate: (postId: string) => void;
  onPostCancel: (postId: string) => void;
  onProfileOpen: (profileId: string) => void;
  post: Post;
  postInteractions: PostInteraction[];
  profiles: Profile[];
}

/**
 * Selector de card por tipo de publicacion.
 * Se construye para que el feed no conozca detalles de cada formato.
 * Lo usa FeedScreen.
 * Sirve para mantener separadas las variantes Busco jugador, Disponible y Evento.
 */
export function PostCard({
  currentProfileId,
  directMatchInvitations,
  followRelations,
  joinRequests,
  onEventInteractionToggle,
  onFollowToggle,
  onInvitationCancel,
  onInvitationStart,
  onJoinRequestCancel,
  onJoinRequestCreate,
  onPostCancel,
  onProfileOpen,
  post,
  postInteractions,
  profiles,
}: PostCardProps) {
  const authorProfile = profiles.find(
    (profile) => profile.profileId === post.authorProfileId,
  );

  if (!authorProfile) {
    return null;
  }

  if (post.postType === "looking_for_player") {
    return (
      <LookingForPlayerCard
        authorProfile={authorProfile}
        currentProfileId={currentProfileId}
        followRelations={followRelations}
        joinRequests={joinRequests}
        onFollowToggle={onFollowToggle}
        onJoinRequestCancel={onJoinRequestCancel}
        onJoinRequestCreate={onJoinRequestCreate}
        onPostCancel={onPostCancel}
        onProfileOpen={onProfileOpen}
        post={post}
      />
    );
  }

  if (post.postType === "available_to_play") {
    return (
      <AvailableToPlayCard
        authorProfile={authorProfile}
        currentProfileId={currentProfileId}
        directMatchInvitations={directMatchInvitations}
        followRelations={followRelations}
        onInvitationCancel={onInvitationCancel}
        onFollowToggle={onFollowToggle}
        onInvitationStart={onInvitationStart}
        onPostCancel={onPostCancel}
        onProfileOpen={onProfileOpen}
        post={post}
      />
    );
  }

  return (
    <EventPostCard
      authorProfile={authorProfile}
      currentProfileId={currentProfileId}
      followRelations={followRelations}
      interactions={postInteractions}
      onEventInteractionToggle={onEventInteractionToggle}
      onFollowToggle={onFollowToggle}
      onPostCancel={onPostCancel}
      onProfileOpen={onProfileOpen}
      post={post}
    />
  );
}
