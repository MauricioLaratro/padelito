import type {
  EventInteractionType,
  InvitationStatus,
  PostType,
  PostVisibility,
  RequestStatus,
} from "../domain/enums/postEnums";

export const maximumMissingPlayersCount = 24;

export const postTypeLabels: Record<PostType, string> = {
  looking_for_player: "Busco jugador",
  available_to_play: "Estoy disponible",
  event: "Evento",
};

export const postVisibilityLabels: Record<PostVisibility, string> = {
  public: "Pública",
  followers_only: "Solo seguidores",
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export const invitationStatusLabels: Record<InvitationStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export const eventInteractionLabels: Record<EventInteractionType, string> = {
  interested: "Me interesa",
  attending: "Asistiré",
};

export const postTypeOptions = Object.entries(postTypeLabels).map(
  ([optionValue, optionLabel]) => ({
    value: optionValue as PostType,
    label: optionLabel,
  }),
);

export const postVisibilityOptions = Object.entries(postVisibilityLabels).map(
  ([optionValue, optionLabel]) => ({
    value: optionValue as PostVisibility,
    label: optionLabel,
  }),
);
