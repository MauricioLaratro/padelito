import type { PostType, PostVisibility } from "../domain/enums/postEnums";

export const postTypeLabels: Record<PostType, string> = {
  looking_for_player: "Busco jugador",
  available_to_play: "Estoy disponible",
  event: "Evento",
};

export const postVisibilityLabels: Record<PostVisibility, string> = {
  public: "Publica",
  followers_only: "Solo seguidores",
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
