import { Camera, Save, X } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { ProfileAvatar } from "../../components/common/ProfileAvatar";
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
import {
  createArgentinianWhatsappPhone,
  getArgentinianWhatsappLocalPhone,
} from "../../utils/contactFormatters";
import { createProcessedAvatarImage } from "../../utils/avatarImageProcessing";

interface ProfileFormProps {
  currentProfile: Profile;
  onCancel?: () => void;
  onProfileSave: (profile: Profile, avatarFile?: File) => void;
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
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [avatarError, setAvatarError] = useState("");
  const [isAvatarProcessing, setIsAvatarProcessing] = useState(false);
  const [bio, setBio] = useState(currentProfile.bio ?? "");
  const [usualPlace, setUsualPlace] = useState(currentProfile.usualPlace ?? "");
  const [whatsappLocalPhone, setWhatsappLocalPhone] = useState(
    getArgentinianWhatsappLocalPhone(currentProfile.whatsappPhone),
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
   * Procesa foto elegida para avatar.
   * Se construye para mostrar preview inmediato y guardar un archivo optimizado.
   * Lo usa el input de archivo.
   * Sirve para mantener el recorte circular consistente.
   */
  async function handleAvatarChange(changeEvent: ChangeEvent<HTMLInputElement>) {
    const selectedFile = changeEvent.target.files?.[0];
    changeEvent.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setAvatarError("Selecciona una imagen valida.");
      return;
    }

    try {
      setAvatarError("");
      setIsAvatarProcessing(true);
      const processedAvatar = await createProcessedAvatarImage(selectedFile);
      setAvatarUrl(processedAvatar.previewUrl);
      setAvatarFile(processedAvatar.file);
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la imagen de perfil.",
      );
    } finally {
      setIsAvatarProcessing(false);
    }
  }

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
      avatarUrl,
      displayName,
      bio,
      whatsappPhone: createArgentinianWhatsappPhone(whatsappLocalPhone),
      usualPlace,
      createdAt: currentProfile.createdAt,
      updatedAt: currentProfile.updatedAt,
      isOnboardingComplete: true,
    };

    if (profileType === "organization") {
      onProfileSave(
        {
          ...sharedProfileFields,
          profileType: "organization",
          organizationKind,
          organizationLink,
        },
        avatarFile,
      );
      return;
    }

    onProfileSave(
      {
        ...sharedProfileFields,
        profileType: "player",
        playerLevel,
        preferredPosition,
        preferredPlayStyle,
      },
      avatarFile,
    );
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
        <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              profileType={profileType}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Foto de perfil</p>
              <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-primary px-4 text-sm font-black text-text-primary transition hover:border-accent-lime/40">
                <Camera aria-hidden="true" size={17} />
                {avatarUrl ? "Cambiar foto" : "Agregar foto"}
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={isAvatarProcessing}
                  onChange={handleAvatarChange}
                  type="file"
                />
              </label>
              {avatarError ? (
                <p className="mt-2 text-xs font-bold text-feedback-danger">
                  {avatarError}
                </p>
              ) : null}
            </div>
          </div>
        </div>

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
        <label className="grid gap-1.5 text-xs font-bold text-text-secondary">
          WhatsApp opcional
          <div className="flex overflow-hidden rounded-lg border border-border-subtle bg-surface-primary focus-within:border-accent-lime">
            <span className="grid min-h-11 place-items-center border-r border-border-subtle px-3 text-sm font-black text-accent-lime">
              +549
            </span>
            <input
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/70"
              inputMode="numeric"
              onChange={(changeEvent) =>
                setWhatsappLocalPhone(
                  getArgentinianWhatsappLocalPhone(changeEvent.target.value),
                )
              }
              placeholder="3764..."
              value={whatsappLocalPhone}
            />
          </div>
        </label>
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
        <Button
          className="flex-1"
          disabled={isAvatarProcessing}
          icon={Save}
          type="submit"
          variant="primary"
        >
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
