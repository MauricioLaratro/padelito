import type {
  RecurringChallengeFrequency,
  RecurringChallengeSide,
  RecurringChallengeStatus,
} from "../enums/recurringChallengeEnums";

export interface RecurringChallenge {
  challengeId: string;
  ownerProfileId: string;
  title: string;
  frequency: RecurringChallengeFrequency;
  usualDayOfWeek?: number;
  usualTime?: string;
  usualPlaceText?: string;
  status: RecurringChallengeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringChallengeParticipant {
  challengeId: string;
  profileId: string;
  side: RecurringChallengeSide;
  createdAt: string;
}
