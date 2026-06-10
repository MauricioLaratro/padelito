import type {
  MatchParticipantSide,
  MatchStatus,
  MatchWinnerSide,
} from "../enums/matchEnums";
import type { PlayStyle } from "../enums/profileEnums";

export interface MatchRecord {
  matchId: string;
  ownerProfileId: string;
  recurringChallengeId?: string;
  scheduledDate: string;
  scheduledStartTime: string;
  placeText: string;
  playStyle: PlayStyle;
  status: MatchStatus;
  shortNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchParticipant {
  matchId: string;
  profileId: string;
  side: MatchParticipantSide;
  createdAt: string;
}

export interface MatchResult {
  matchId: string;
  teamAScore: number;
  teamBScore: number;
  winnerSide: MatchWinnerSide;
  summary?: string;
  recordedAt: string;
}
