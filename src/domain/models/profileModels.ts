import type {
  OrganizationKind,
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
  ProfileType,
} from "../enums/profileEnums";

export interface BaseProfile {
  profileId: string;
  profileType: ProfileType;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  whatsappPhone?: string;
  usualPlace?: string;
  createdAt: string;
  updatedAt: string;
  isOnboardingComplete: boolean;
}

export interface PlayerProfile extends BaseProfile {
  profileType: "player";
  playerLevel: PlayerLevel;
  preferredPosition: PlayerPosition;
  preferredPlayStyle: PlayStyle;
}

export interface OrganizationProfile extends BaseProfile {
  profileType: "organization";
  organizationKind: OrganizationKind;
  organizationLink?: string;
}

export type Profile = PlayerProfile | OrganizationProfile;

export interface FollowRelation {
  followerProfileId: string;
  followedProfileId: string;
  createdAt: string;
}

export interface PrivateProfileContact {
  profileId: string;
  whatsappPhone?: string;
}
