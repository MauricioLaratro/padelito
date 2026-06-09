import type {
  OrganizationKind,
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
} from "../domain/enums/profileEnums";

export const playerLevelLabels: Record<PlayerLevel, string> = {
  beginner: "Principiante",
  seventh: "7ma",
  sixth: "6ta",
  fifth: "5ta",
  fourth: "4ta",
  third: "3ra",
  second: "2da",
  first: "1ra",
};

export const playerPositionLabels: Record<PlayerPosition, string> = {
  drive: "Drive",
  backhand: "Reves",
  both: "Ambos",
  any: "Indiferente",
};

export const playStyleLabels: Record<PlayStyle, string> = {
  recreational: "Recreativo",
  competitive: "Competitivo",
  both: "Ambos",
};

export const organizationKindLabels: Record<OrganizationKind, string> = {
  club: "Club",
  tournament: "Torneo",
  group: "Grupo",
};

export const playerLevelOptions = Object.entries(playerLevelLabels).map(
  ([optionValue, optionLabel]) => ({
    value: optionValue as PlayerLevel,
    label: optionLabel,
  }),
);

export const playerPositionOptions = Object.entries(playerPositionLabels).map(
  ([optionValue, optionLabel]) => ({
    value: optionValue as PlayerPosition,
    label: optionLabel,
  }),
);

export const playStyleOptions = Object.entries(playStyleLabels).map(
  ([optionValue, optionLabel]) => ({
    value: optionValue as PlayStyle,
    label: optionLabel,
  }),
);

export const organizationKindOptions = Object.entries(organizationKindLabels).map(
  ([optionValue, optionLabel]) => ({
    value: optionValue as OrganizationKind,
    label: optionLabel,
  }),
);
