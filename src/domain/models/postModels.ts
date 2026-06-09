import type {
  EventInteractionType,
  InvitationStatus,
  PostType,
  PostVisibility,
  RequestStatus,
} from "../enums/postEnums";
import type {
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
} from "../enums/profileEnums";

export interface BasePost {
  postId: string;
  authorProfileId: string;
  postType: PostType;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  placeText: string;
  shortNote?: string;
  isActive: boolean;
}

export interface LookingForPlayerPost extends BasePost {
  postType: "looking_for_player";
  desiredLevel: PlayerLevel;
  desiredPosition: PlayerPosition;
  desiredPlayStyle: PlayStyle;
  missingPlayersCount: number;
  confirmedPlayersText?: string;
}

export interface AvailableToPlayPost extends BasePost {
  postType: "available_to_play";
  availableLevel: PlayerLevel;
  availablePosition: PlayerPosition;
  availablePlayStyle: PlayStyle;
  preferredPlaceText?: string;
}

export interface EventPost extends BasePost {
  postType: "event";
  title: string;
  description: string;
  imageUrl?: string;
  whatsappUrl?: string;
  registrationUrl?: string;
  googleMapsUrl?: string;
}

export type Post = LookingForPlayerPost | AvailableToPlayPost | EventPost;

export interface PostInteraction {
  interactionId: string;
  postId: string;
  profileId: string;
  interactionType: EventInteractionType;
  createdAt: string;
}

export interface MatchJoinRequest {
  requestId: string;
  postId: string;
  requesterProfileId: string;
  ownerProfileId: string;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMatchInvitation {
  invitationId: string;
  inviterProfileId: string;
  invitedProfileId: string;
  scheduledDate: string;
  scheduledStartTime: string;
  placeText: string;
  desiredPlayStyle: PlayStyle;
  note?: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
}
