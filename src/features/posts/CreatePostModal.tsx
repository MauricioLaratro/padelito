import { ImagePlus, X } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import {
  maximumMissingPlayersCount,
  postVisibilityOptions,
  postTypeOptions,
} from "../../constants/postOptions";
import {
  playerLevelOptions,
  playerPositionOptions,
  playStyleOptions,
} from "../../constants/profileOptions";
import type { PostType, PostVisibility } from "../../domain/enums/postEnums";
import type {
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
} from "../../domain/enums/profileEnums";
import type { Post } from "../../domain/models/postModels";
import type { Profile } from "../../domain/models/profileModels";
import { createCurrentIsoDate } from "../../utils/dateFormatters";
import { createEntityIdentifier } from "../../utils/identifierGenerator";
import { createProcessedEventImage } from "../../utils/avatarImageProcessing";

interface CreatePostModalProps {
  authorProfile: Profile;
  onClose: () => void;
  onPostCreate: (post: Post, eventImageFile?: File) => void;
}

/**
 * Modal para crear publicaciones por tipo.
 * Se construye para que el flujo empiece eligiendo tipo de publicacion.
 * Lo usa App sobre el feed.
 * Sirve para crear Busco jugador, Estoy disponible y Evento.
 */
export function CreatePostModal({
  authorProfile,
  onClose,
  onPostCreate,
}: CreatePostModalProps) {
  const [postType, setPostType] = useState<PostType>("looking_for_player");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [scheduledDate, setScheduledDate] = useState(() =>
    createDateInputValue(1),
  );
  const [scheduledStartTime, setScheduledStartTime] = useState("20:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const [placeText, setPlaceText] = useState(authorProfile.usualPlace ?? "");
  const [shortNote, setShortNote] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<PlayerLevel>("sixth");
  const [selectedPosition, setSelectedPosition] =
    useState<PlayerPosition>("drive");
  const [selectedPlayStyle, setSelectedPlayStyle] =
    useState<PlayStyle>("competitive");
  const [missingPlayersCount, setMissingPlayersCount] = useState(1);
  const [confirmedPlayersText, setConfirmedPlayersText] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventImageFile, setEventImageFile] = useState<File | undefined>();
  const [eventImagePreviewUrl, setEventImagePreviewUrl] = useState("");
  const [eventImageError, setEventImageError] = useState<string | null>(null);
  const [isEventImageProcessing, setIsEventImageProcessing] = useState(false);
  const [eventWhatsappUrl, setEventWhatsappUrl] = useState("");
  const [eventRegistrationUrl, setEventRegistrationUrl] = useState("");
  const [eventGoogleMapsUrl, setEventGoogleMapsUrl] = useState("");

  /**
   * Crea el modelo correcto para el tipo elegido.
   * Se construye para mantener un solo submit y datos tipados.
   * Lo usa el formulario del modal.
   * Sirve para alimentar feeds y actividad local.
   */
  function handleCreatePostSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const currentTimestamp = createCurrentIsoDate();
    const basePost = {
      postId: createEntityIdentifier("post"),
      authorProfileId: authorProfile.profileId,
      visibility,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime: scheduledEndTime || undefined,
      placeText,
      shortNote,
      isActive: true,
    };

    if (postType === "available_to_play") {
      onPostCreate({
        ...basePost,
        postType,
        availableLevel: selectedLevel,
        availablePosition: selectedPosition,
        availablePlayStyle: selectedPlayStyle,
        preferredPlaceText: placeText,
      });
      return;
    }

    if (postType === "event") {
      onPostCreate({
        ...basePost,
        postType,
        title: eventTitle,
        description: eventDescription,
        imageUrl: eventImagePreviewUrl,
        whatsappUrl: eventWhatsappUrl,
        registrationUrl: eventRegistrationUrl,
        googleMapsUrl: eventGoogleMapsUrl,
      }, eventImageFile);
      return;
    }

    onPostCreate({
      ...basePost,
      postType,
      isActive: missingPlayersCount > 0,
      desiredLevel: selectedLevel,
      desiredPosition: selectedPosition,
      desiredPlayStyle: selectedPlayStyle,
      missingPlayersCount,
      confirmedPlayersText,
    });
  }

  /**
   * Procesa la imagen elegida para un evento.
   * Se construye para usar el carrete del usuario sin depender de URLs.
   * Lo usa el input de imagen del formulario.
   * Sirve para previsualizar y subir un archivo optimizado.
   */
  async function handleEventImageChange(
    changeEvent: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = changeEvent.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setIsEventImageProcessing(true);
    setEventImageError(null);

    try {
      const processedEventImage = await createProcessedEventImage(selectedFile);
      setEventImageFile(processedEventImage.file);
      setEventImagePreviewUrl(processedEventImage.previewUrl);
    } catch {
      setEventImageFile(undefined);
      setEventImagePreviewUrl("");
      setEventImageError("No se pudo preparar la imagen.");
    } finally {
      setIsEventImageProcessing(false);
      changeEvent.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70">
      <form
        className="max-h-[90vh] w-full max-w-mobile overflow-auto rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating"
        onSubmit={handleCreatePostSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Publicar
            </p>
            <h2 className="mt-1 text-2xl font-black">Nueva publicación</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="grid size-10 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <FormField
            fieldType="select"
            label="Tipo"
            onChange={(changeEvent) =>
              setPostType(changeEvent.target.value as PostType)
            }
            value={postType}
          >
            {postTypeOptions.map((postTypeOption) => (
              <option key={postTypeOption.value} value={postTypeOption.value}>
                {postTypeOption.label}
              </option>
            ))}
          </FormField>
          <FormField
            fieldType="select"
            label="Visibilidad"
            onChange={(changeEvent) =>
              setVisibility(changeEvent.target.value as PostVisibility)
            }
            value={visibility}
          >
            {postVisibilityOptions.map((postVisibilityOption) => (
              <option
                key={postVisibilityOption.value}
                value={postVisibilityOption.value}
              >
                {postVisibilityOption.label}
              </option>
            ))}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Fecha"
              onChange={(changeEvent) => setScheduledDate(changeEvent.target.value)}
              required
              type="date"
              value={scheduledDate}
            />
            <FormField
              label="Hora"
              onChange={(changeEvent) =>
                setScheduledStartTime(changeEvent.target.value)
              }
              required
              type="time"
              value={scheduledStartTime}
            />
          </div>
          {postType === "available_to_play" ? (
            <FormField
              label="Hasta"
              onChange={(changeEvent) =>
                setScheduledEndTime(changeEvent.target.value)
              }
              type="time"
              value={scheduledEndTime}
            />
          ) : null}
          <FormField
            label="Lugar"
            onChange={(changeEvent) => setPlaceText(changeEvent.target.value)}
            required
            value={placeText}
          />

          {postType === "event" ? (
            <>
              <FormField
                label="Título"
                onChange={(changeEvent) => setEventTitle(changeEvent.target.value)}
                required
                value={eventTitle}
              />
              <FormField
                fieldType="textarea"
                label="Descripción"
                onChange={(changeEvent) =>
                  setEventDescription(changeEvent.target.value)
                }
                required
                value={eventDescription}
              />
              <div className="rounded-lg border border-border-subtle bg-surface-secondary p-3">
                <p className="text-xs font-bold text-text-secondary">
                  Imagen opcional
                </p>
                {eventImagePreviewUrl ? (
                  <img
                    alt="Vista previa del evento"
                    className="mt-3 aspect-video w-full rounded-lg object-cover"
                    src={eventImagePreviewUrl}
                  />
                ) : null}
                <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-primary px-4 text-sm font-black text-text-primary transition hover:border-accent-lime/40">
                  <ImagePlus aria-hidden="true" size={17} />
                  {eventImagePreviewUrl ? "Cambiar imagen" : "Elegir imagen"}
                  <input
                    accept="image/*"
                    className="sr-only"
                    disabled={isEventImageProcessing}
                    onChange={handleEventImageChange}
                    type="file"
                  />
                </label>
                {eventImageError ? (
                  <p className="mt-2 text-xs font-bold text-feedback-danger">
                    {eventImageError}
                  </p>
                ) : null}
              </div>
              <FormField
                label="WhatsApp opcional"
                onChange={(changeEvent) =>
                  setEventWhatsappUrl(changeEvent.target.value)
                }
                placeholder="https://wa.me/..."
                value={eventWhatsappUrl}
              />
              <FormField
                label="Inscripción opcional"
                onChange={(changeEvent) =>
                  setEventRegistrationUrl(changeEvent.target.value)
                }
                placeholder="https://..."
                value={eventRegistrationUrl}
              />
              <FormField
                label="Mapa opcional"
                onChange={(changeEvent) =>
                  setEventGoogleMapsUrl(changeEvent.target.value)
                }
                placeholder="https://maps.google.com/..."
                value={eventGoogleMapsUrl}
              />
            </>
          ) : (
            <>
              <FormField
                fieldType="select"
                label="Categoría"
                onChange={(changeEvent) =>
                  setSelectedLevel(changeEvent.target.value as PlayerLevel)
                }
                value={selectedLevel}
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
                label="Posición"
                onChange={(changeEvent) =>
                  setSelectedPosition(changeEvent.target.value as PlayerPosition)
                }
                value={selectedPosition}
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
                label="Juego"
                onChange={(changeEvent) =>
                  setSelectedPlayStyle(changeEvent.target.value as PlayStyle)
                }
                value={selectedPlayStyle}
              >
                {playStyleOptions.map((playStyleOption) => (
                  <option key={playStyleOption.value} value={playStyleOption.value}>
                    {playStyleOption.label}
                  </option>
                ))}
              </FormField>
              {postType === "looking_for_player" ? (
                <>
                  <FormField
                    label="Jugadores faltantes"
                    max={maximumMissingPlayersCount}
                    min={0}
                    onChange={(changeEvent) =>
                      setMissingPlayersCount(
                        Math.min(
                          maximumMissingPlayersCount,
                          Math.max(
                            0,
                            Number.parseInt(changeEvent.target.value, 10) || 0,
                          ),
                        ),
                      )
                    }
                    type="number"
                    value={missingPlayersCount}
                  />
                  <FormField
                    label="Confirmados opcional"
                    onChange={(changeEvent) =>
                      setConfirmedPlayersText(changeEvent.target.value)
                    }
                    value={confirmedPlayersText}
                  />
                </>
              ) : null}
              <FormField
                fieldType="textarea"
                label="Nota corta"
                onChange={(changeEvent) => setShortNote(changeEvent.target.value)}
                value={shortNote}
              />
            </>
          )}
        </div>

        <Button className="mt-5 w-full" type="submit" variant="primary">
          Publicar
        </Button>
      </form>
    </div>
  );
}

/**
 * Crea fecha por defecto para inputs date.
 * Se construye para evitar datos demo hardcodeados en formularios reales.
 * Lo usa CreatePostModal al iniciar una publicacion.
 * Sirve para proponer una fecha cercana sin inventar contenido del usuario.
 */
function createDateInputValue(daysAhead: number) {
  const dateInputValue = new Date();
  dateInputValue.setDate(dateInputValue.getDate() + daysAhead);

  return dateInputValue.toISOString().slice(0, 10);
}
