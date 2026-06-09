import { Save } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { FormField } from "../../components/forms/FormField";
import { ScreenShell } from "../../components/layout/ScreenShell";
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

interface OnboardingProfileScreenProps {
  currentProfile: Profile;
  onProfileSave: (profile: Profile) => void;
}

/**
 * Onboarding de perfil.
 * Se construye para capturar datos minimos antes de usar el feed completo.
 * La usa App despues del login demo.
 * Sirve para configurar jugador u organizacion segun el MVP.
 */
export function OnboardingProfileScreen({
  currentProfile,
  onProfileSave,
}: OnboardingProfileScreenProps) {
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
   * Sirve para completar onboarding local.
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
    <ScreenShell className="px-4 py-8">
      <form
        className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating"
        onSubmit={handleProfileSubmit}
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-lime">
          Perfil
        </p>
        <h1 className="mt-2 text-2xl font-black">Completa tu base</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Datos minimos para que otros jugadores entiendan categoria, zona y
          disponibilidad.
        </p>

        <div className="mt-5 flex gap-2">
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

        <div className="mt-5 grid gap-3">
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
            onChange={(changeEvent) =>
              setWhatsappPhone(changeEvent.target.value)
            }
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
                  setPreferredPosition(
                    changeEvent.target.value as PlayerPosition,
                  )
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

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip tone="lime">Mobile-first</Chip>
          <Chip>Sin chat propio</Chip>
          <Chip>Coordina por WhatsApp</Chip>
        </div>

        <Button className="mt-6 w-full" icon={Save} type="submit" variant="primary">
          Guardar perfil
        </Button>
      </form>
    </ScreenShell>
  );
}
