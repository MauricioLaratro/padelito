import { Save, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import {
  organizationKindOptions,
  playerLevelOptions,
  playerPositionOptions,
  playStyleOptions,
} from "../../constants/profileOptions";
import type {
  OrganizationKind,
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
  ProfileType,
} from "../../domain/enums/profileEnums";
import type { Profile } from "../../domain/models/profileModels";

interface ProfileFormProps {
  currentProfile: Profile;
  onCancel?: () => void;
  onProfileSave: (profile: Profile) => void;
  submitLabel: string;
}

/**
 * Formulario reutilizable de perfil.
 * Se construye para compartir onboarding y edicion sin duplicar reglas.
 * Lo usan OnboardingProfileScreen y ProfileEditModal.
 * Sirve para persistir datos publicos y contacto privado del jugador.
 */
export function ProfileForm({
  currentProfile,
  onCancel,
  onProfileSave,
  submitLabel,
}: ProfileFormProps) {
  const [profileType, setProfileType] = useState<ProfileType>(
    currentProfile.profileType,
  );
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [bio, setBio] = useState(currentProfile.bio ?? "");
  const [usualPlace, setUsualPlace] = useState(currentProfile.usualPlace ?? "");
  const [whatsappPhone, setWhatsappPhone] = useState(
    currentProfile.whatsappPhone ?? "",
  );
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel>(
    currentProfile.profileType === "player"
      ? currentProfile.playerLevel
      : "sixth",
  );
  const [preferredPosition, setPreferredPosition] =
    useState<PlayerPosition>(
      currentProfile.profileType === "player"
        ? currentProfile.preferredPosition
        : "drive",
    );
  const [preferredPlayStyle, setPreferredPlayStyle] = useState<PlayStyle>(
    currentProfile.profileType === "player"
      ? currentProfile.preferredPlayStyle
      : "both",
  );
  const [organizationKind, setOrganizationKind] = useState<OrganizationKind>(
    currentProfile.profileType === "organization"
      ? currentProfile.organizationKind
      : "club",
  );
  const [organizationLink, setOrganizationLink] = useState(
    currentProfile.profileType === "organization"
      ? currentProfile.organizationLink ?? ""
      : "",
  );

  /**
   * Guarda perfil segun tipo seleccionado.
   * Se construye para producir un modelo de dominio completo.
   * Lo usa el submit del formulario.
   * Sirve para onboarding y edicion desde perfil.
   */
  function handleProfileSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const sharedProfileFields = {
      profileId: currentProfile.profileId,
      avatarUrl: currentProfile.avatarUrl,
      displayName,
      bio,
      whatsappPhone,
      usualPlace,
      createdAt: currentProfile.createdAt,
      updatedAt: currentProfile.updatedAt,
      isOnboardingComplete: true,
    };

    if (profileType === "organization") {
      onProfileSave({
        ...sharedProfileFields,
        profileType: "organization",
        organizationKind,
        organizationLink,
      });
      return;
    }

    onProfileSave({
      ...sharedProfileFields,
      profileType: "player",
      playerLevel,
      preferredPosition,
      preferredPlayStyle,
    });
  }

  return (
    <form className="grid gap-5" onSubmit={handleProfileSubmit}>
      <div className="flex gap-2">
        <button
          className={`rounded-full px-4 py-2 text-sm font-black ${
            profileType === "player"
              ? "bg-accent-lime text-background-primary"
              : "bg-surface-secondary text-text-secondary"
          }`}
          onClick={() => setProfileType("player")}
          type="button"
        >
          Jugador
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-black ${
            profileType === "organization"
              ? "bg-accent-lime text-background-primary"
              : "bg-surface-secondary text-text-secondary"
          }`}
          onClick={() => setProfileType("organization")}
          type="button"
        >
          Organizacion
        </button>
      </div>

      <div className="grid gap-3">
        <FormField
          label="Nombre"
          onChange={(changeEvent) => setDisplayName(changeEvent.target.value)}
          required
          value={displayName}
        />
        <FormField
          label="Zona o club habitual"
          onChange={(changeEvent) => setUsualPlace(changeEvent.target.value)}
          placeholder="Club Norte / Palermo"
          value={usualPlace}
        />
        <FormField
          label="WhatsApp opcional"
          onChange={(changeEvent) => setWhatsappPhone(changeEvent.target.value)}
          placeholder="54911..."
          value={whatsappPhone}
        />
        <FormField
          fieldType="textarea"
          label="Bio corta"
          onChange={(changeEvent) => setBio(changeEvent.target.value)}
          value={bio}
        />

        {profileType === "player" ? (
          <>
            <FormField
              fieldType="select"
              label="Categoria"
              onChange={(changeEvent) =>
                setPlayerLevel(changeEvent.target.value as PlayerLevel)
              }
              value={playerLevel}
            >
              {playerLevelOptions.map((playerLevelOption) => (
                <option
                  key={playerLevelOption.value}
                  value={playerLevelOption.value}
                >
                  {playerLevelOption.label}
                </option>
              ))}
            </FormField>
            <FormField
              fieldType="select"
              label="Posicion"
              onChange={(changeEvent) =>
                setPreferredPosition(changeEvent.target.value as PlayerPosition)
              }
              value={preferredPosition}
            >
              {playerPositionOptions.map((playerPositionOption) => (
                <option
                  key={playerPositionOption.value}
                  value={playerPositionOption.value}
                >
                  {playerPositionOption.label}
                </option>
              ))}
            </FormField>
            <FormField
              fieldType="select"
              label="Tipo de juego"
              onChange={(changeEvent) =>
                setPreferredPlayStyle(changeEvent.target.value as PlayStyle)
              }
              value={preferredPlayStyle}
            >
              {playStyleOptions.map((playStyleOption) => (
                <option key={playStyleOption.value} value={playStyleOption.value}>
                  {playStyleOption.label}
                </option>
              ))}
            </FormField>
          </>
        ) : (
          <>
            <FormField
              fieldType="select"
              label="Tipo de organizacion"
              onChange={(changeEvent) =>
                setOrganizationKind(changeEvent.target.value as OrganizationKind)
              }
              value={organizationKind}
            >
              {organizationKindOptions.map((organizationKindOption) => (
                <option
                  key={organizationKindOption.value}
                  value={organizationKindOption.value}
                >
                  {organizationKindOption.label}
                </option>
              ))}
            </FormField>
            <FormField
              label="Link opcional"
              onChange={(changeEvent) =>
                setOrganizationLink(changeEvent.target.value)
              }
              placeholder="WhatsApp, Instagram o sitio"
              value={organizationLink}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="flex-1" icon={Save} type="submit" variant="primary">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button icon={X} onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
