export type FeedTabIdentifier = "community" | "following";

export type PostType =
  | "looking_for_player"
  | "available_to_play"
  | "event";

export type PostVisibility = "public" | "followers_only";

export type EventInteractionType = "interested" | "attending";

export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";
