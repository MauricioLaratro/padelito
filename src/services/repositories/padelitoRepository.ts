import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  MatchParticipant,
  MatchRecord,
  MatchResult,
} from "../../domain/models/matchModels";
import type {
  RecurringChallenge,
  RecurringChallengeParticipant,
} from "../../domain/models/recurringChallengeModels";
import type {
  DirectMatchInvitation,
  LookingForPlayerPost,
  MatchJoinRequest,
  Post,
  PostInteraction,
} from "../../domain/models/postModels";
import type {
  FollowRelation,
  PrivateProfileContact,
  Profile,
} from "../../domain/models/profileModels";
import type { EventInteractionType } from "../../domain/enums/postEnums";
import type { RecurringChallengeStatus } from "../../domain/enums/recurringChallengeEnums";
import type { PlayStyle } from "../../domain/enums/profileEnums";

export interface CreateInvitationInput {
  invitedProfileId: string;
  relatedPostId?: string;
  relatedMatchId?: string;
  scheduledDate: string;
  scheduledStartTime: string;
  placeText: string;
  desiredPlayStyle: PlayStyle;
  note?: string;
}

export interface CreateMatchInput {
  matchRecord: MatchRecord;
  participants: MatchParticipant[];
  sourcePost?: LookingForPlayerPost;
  result?: MatchResult;
}

export interface CreateRecurringChallengeInput {
  challenge: RecurringChallenge;
  participants: RecurringChallengeParticipant[];
}

export interface PadelitoRepositorySnapshot {
  profiles: Profile[];
  follows: FollowRelation[];
  posts: Post[];
  postInteractions: PostInteraction[];
  matchJoinRequests: MatchJoinRequest[];
  directMatchInvitations: DirectMatchInvitation[];
  matchRecords: MatchRecord[];
  matchParticipants: MatchParticipant[];
  matchResults: MatchResult[];
  recurringChallenges: RecurringChallenge[];
  recurringChallengeParticipants: RecurringChallengeParticipant[];
  notifications: InternalNotification[];
  sessionProfileId?: string;
  quickAccessPromptDismissed: boolean;
}

export interface PadelitoRepository {
  loadApplicationSnapshot: () => Promise<PadelitoRepositorySnapshot>;
  saveProfile: (updatedProfile: Profile) => Promise<void>;
  createPost: (post: Post) => Promise<void>;
  cancelPost: (postId: string, authorProfileId: string) => Promise<void>;
  createMatch: (matchInput: CreateMatchInput) => Promise<void>;
  cancelMatch: (matchId: string, ownerProfileId: string) => Promise<void>;
  recordMatchResult: (matchResult: MatchResult) => Promise<void>;
  createRecurringChallenge: (
    challengeInput: CreateRecurringChallengeInput,
  ) => Promise<void>;
  updateRecurringChallengeStatus: (
    challengeId: string,
    status: RecurringChallengeStatus,
    ownerProfileId: string,
  ) => Promise<void>;
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
  cancelDirectMatchInvitation: (
    invitationId: string,
    inviterProfileId: string,
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
  getPrivateProfileContact: (
    targetProfileId: string,
  ) => Promise<PrivateProfileContact | null>;
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
    matchParticipants: [],
    matchRecords: [],
    matchResults: [],
    recurringChallengeParticipants: [],
    recurringChallenges: [],
    matchJoinRequests: [],
    notifications: [],
    postInteractions: [],
    posts: [],
    profiles: [],
    quickAccessPromptDismissed: false,
    sessionProfileId: undefined,
  };
}
