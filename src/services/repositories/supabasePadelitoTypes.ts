import type { NotificationType } from "../../domain/enums/notificationEnums";
import type {
  MatchParticipantSide,
  MatchStatus,
  MatchWinnerSide,
} from "../../domain/enums/matchEnums";
import type {
  EventInteractionType,
  InvitationStatus,
  PostType,
  PostVisibility,
  RequestStatus,
} from "../../domain/enums/postEnums";
import type {
  OrganizationKind,
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
  ProfileType,
} from "../../domain/enums/profileEnums";

export interface SupabaseProfileRow {
  id: string;
  profile_type: ProfileType;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  whatsapp_phone: string | null;
  usual_place: string | null;
  player_level: PlayerLevel | null;
  preferred_position: PlayerPosition | null;
  preferred_play_style: PlayStyle | null;
  organization_kind: OrganizationKind | null;
  organization_link: string | null;
  created_at: string;
  updated_at: string;
}

export type SupabaseProfileUpsert = Omit<
  SupabaseProfileRow,
  "created_at" | "updated_at"
>;

export interface SupabasePrivateProfileContactRow {
  profile_id: string;
  whatsapp_phone: string | null;
}

export interface SupabaseFollowRow {
  follower_profile_id: string;
  followed_profile_id: string;
  created_at: string;
}

export type SupabaseFollowInsert = Omit<SupabaseFollowRow, "created_at">;

export interface SupabasePostRow {
  id: string;
  author_profile_id: string;
  post_type: PostType;
  visibility: PostVisibility;
  created_at: string;
  updated_at: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  place_text: string;
  short_note: string | null;
  is_active: boolean;
  desired_level: PlayerLevel | null;
  desired_position: PlayerPosition | null;
  desired_play_style: PlayStyle | null;
  missing_players_count: number | null;
  confirmed_players_text: string | null;
  available_level: PlayerLevel | null;
  available_position: PlayerPosition | null;
  available_play_style: PlayStyle | null;
  preferred_place_text: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  whatsapp_url: string | null;
  registration_url: string | null;
  google_maps_url: string | null;
}

export type SupabasePostInsert = Omit<
  SupabasePostRow,
  "id" | "created_at" | "updated_at"
>;

export interface SupabasePostInteractionRow {
  id: string;
  post_id: string;
  profile_id: string;
  interaction_type: EventInteractionType;
  created_at: string;
}

export type SupabasePostInteractionInsert = Omit<
  SupabasePostInteractionRow,
  "id" | "created_at"
>;

export interface SupabaseMatchJoinRequestRow {
  id: string;
  post_id: string;
  requester_profile_id: string;
  owner_profile_id: string;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export type SupabaseMatchJoinRequestInsert = Omit<
  SupabaseMatchJoinRequestRow,
  "id" | "created_at" | "updated_at"
>;

export interface SupabaseDirectMatchInvitationRow {
  id: string;
  inviter_profile_id: string;
  invited_profile_id: string;
  related_post_id: string | null;
  related_match_id: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  place_text: string;
  desired_play_style: PlayStyle;
  note: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
}

export type SupabaseDirectMatchInvitationInsert = Omit<
  SupabaseDirectMatchInvitationRow,
  "id" | "created_at" | "updated_at"
>;

export interface SupabaseMatchRecordRow {
  id: string;
  owner_profile_id: string;
  source_post_id: string | null;
  recurring_challenge_id: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  place_text: string;
  play_style: PlayStyle;
  status: MatchStatus;
  short_note: string | null;
  created_at: string;
  updated_at: string;
}

export type SupabaseMatchRecordInsert = Omit<
  SupabaseMatchRecordRow,
  "created_at" | "updated_at"
>;

export interface SupabaseMatchParticipantRow {
  match_id: string;
  profile_id: string;
  side: MatchParticipantSide;
  created_at: string;
}

export type SupabaseMatchParticipantInsert = Omit<
  SupabaseMatchParticipantRow,
  "created_at"
>;

export interface SupabaseMatchResultRow {
  match_id: string;
  team_a_score: number;
  team_b_score: number;
  winner_side: MatchWinnerSide;
  summary: string | null;
  recorded_at: string;
}

export type SupabaseMatchResultInsert = SupabaseMatchResultRow;

export interface SupabaseNotificationRow {
  id: string;
  recipient_profile_id: string;
  actor_profile_id: string | null;
  notification_type: NotificationType;
  related_post_id: string | null;
  related_request_id: string | null;
  related_invitation_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type SupabaseNotificationInsert = Omit<
  SupabaseNotificationRow,
  "id" | "created_at" | "read_at"
> & {
  read_at?: string | null;
};
