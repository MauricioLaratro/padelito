import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  DirectMatchInvitation,
  MatchJoinRequest,
  Post,
  PostInteraction,
} from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import type { EventInteractionType } from "../../domain/enums/postEnums";
import type { PlayStyle } from "../../domain/enums/profileEnums";

export interface CreateInvitationInput {
  invitedProfileId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  placeText: string;
  desiredPlayStyle: PlayStyle;
  note?: string;
}

export interface PadelitoRepositorySnapshot {
  profiles: Profile[];
  follows: FollowRelation[];
  posts: Post[];
  postInteractions: PostInteraction[];
  matchJoinRequests: MatchJoinRequest[];
  directMatchInvitations: DirectMatchInvitation[];
  notifications: InternalNotification[];
  sessionProfileId?: string;
  quickAccessPromptDismissed: boolean;
}

export interface PadelitoRepository {
  loadApplicationSnapshot: () => Promise<PadelitoRepositorySnapshot>;
  saveProfile: (updatedProfile: Profile) => Promise<void>;
  createPost: (post: Post) => Promise<void>;
  toggleFollowProfile: (
    followerProfileId: string,
    followedProfileId: string,
  ) => Promise<void>;
  createMatchJoinRequest: (
    postId: string,
    requesterProfileId: string,
    message?: string,
  ) => Promise<void>;
  cancelMatchJoinRequest: (
    requestId: string,
    requesterProfileId: string,
  ) => Promise<void>;
  updateMatchJoinRequestStatus: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => Promise<void>;
  createDirectMatchInvitation: (
    inviterProfileId: string,
    invitationInput: CreateInvitationInput,
  ) => Promise<void>;
  updateDirectMatchInvitationStatus: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => Promise<void>;
  toggleEventInteraction: (
    postId: string,
    profileId: string,
    interactionType: EventInteractionType,
  ) => Promise<void>;
  markNotificationsAsRead: (recipientProfileId: string) => Promise<void>;
}

/**
 * Crea un snapshot vacio del repositorio.
 * Se construye para hidratar la app antes de tener sesion o datos remotos.
 * Lo usan hooks y repositorios.
 * Sirve para mantener contratos no nulos en la UI.
 */
export function createEmptyRepositorySnapshot(): PadelitoRepositorySnapshot {
  return {
    directMatchInvitations: [],
    follows: [],
    matchJoinRequests: [],
    notifications: [],
    postInteractions: [],
    posts: [],
    profiles: [],
    quickAccessPromptDismissed: false,
    sessionProfileId: undefined,
  };
}
