import type {
  RecurringChallengeFrequency,
  RecurringChallengeSide,
  RecurringChallengeStatus,
} from "../domain/enums/recurringChallengeEnums";

export const recurringChallengeFrequencyLabels: Record<
  RecurringChallengeFrequency,
  string
> = {
  biweekly: "Cada 2 semanas",
  manual: "Manual",
  monthly: "Mensual",
  weekly: "Semanal",
};

export const recurringChallengeStatusLabels: Record<
  RecurringChallengeStatus,
  string
> = {
  active: "Activo",
  archived: "Archivado",
  paused: "Pausado",
};

export const recurringChallengeSideLabels: Record<
  RecurringChallengeSide,
  string
> = {
  team_a: "Equipo A",
  team_b: "Equipo B",
};

export const recurringChallengeFrequencyOptions = [
  { label: recurringChallengeFrequencyLabels.weekly, value: "weekly" },
  { label: recurringChallengeFrequencyLabels.biweekly, value: "biweekly" },
  { label: recurringChallengeFrequencyLabels.monthly, value: "monthly" },
  { label: recurringChallengeFrequencyLabels.manual, value: "manual" },
] as const;

export const recurringChallengeDayOptions = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miercoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sabado", value: 6 },
  { label: "Domingo", value: 0 },
] as const;
