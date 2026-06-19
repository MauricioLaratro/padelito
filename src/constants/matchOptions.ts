import type {
  MatchParticipantSide,
  MatchStatus,
  MatchWinnerSide,
} from "../domain/enums/matchEnums";

export const matchStatusLabels: Record<MatchStatus, string> = {
  scheduled: "Programado",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export const matchParticipantSideLabels: Record<MatchParticipantSide, string> = {
  team_a: "Equipo A",
  team_b: "Equipo B",
  rotating: "Rotativo",
};

export const matchWinnerSideLabels: Record<MatchWinnerSide, string> = {
  team_a: "Ganó Equipo A",
  team_b: "Ganó Equipo B",
  draw: "Empate",
};

export const matchParticipantSideOptions = Object.entries(
  matchParticipantSideLabels,
).map(([optionValue, optionLabel]) => ({
  value: optionValue as MatchParticipantSide,
  label: optionLabel,
}));
