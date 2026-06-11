import { Send, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import { playStyleOptions } from "../../constants/profileOptions";
import type { PlayStyle } from "../../domain/enums/profileEnums";
import type { MatchRecord } from "../../domain/models/matchModels";
import type { LookingForPlayerPost } from "../../domain/models/postModels";
import type { Profile } from "../../domain/models/profileModels";
import type { CreateInvitationInput } from "../../services/repositories/localPadelitoRepository";
import { formatScheduledDateTime } from "../../utils/dateFormatters";

interface DirectInvitationModalProps {
  availableInvitationMatches: MatchRecord[];
  availableInvitationPosts: LookingForPlayerPost[];
  invitedProfile: Profile;
  onClose: () => void;
  onInvitationCreate: (invitationInput: CreateInvitationInput) => void;
}

/**
 * Modal de invitacion directa.
 * Se construye para invitar a un jugador desde perfil o disponibilidad.
 * Lo usa App cuando se selecciona un perfil destinatario.
 * Sirve para crear invitaciones internas con estado pendiente.
 */
export function DirectInvitationModal({
  availableInvitationMatches,
  availableInvitationPosts,
  invitedProfile,
  onClose,
  onInvitationCreate,
}: DirectInvitationModalProps) {
  const linkedMatchPostIds = new Set(
    availableInvitationMatches
      .map((availableInvitationMatch) => availableInvitationMatch.sourcePostId)
      .filter((sourcePostId): sourcePostId is string => Boolean(sourcePostId)),
  );
  const standaloneInvitationPosts = availableInvitationPosts.filter(
    (availableInvitationPost) =>
      !linkedMatchPostIds.has(availableInvitationPost.postId),
  );
  const defaultInvitationMatch = availableInvitationMatches[0];
  const defaultInvitationPost = standaloneInvitationPosts[0];
  const [selectedInvitationTargetId, setSelectedInvitationTargetId] = useState(
    defaultInvitationMatch
      ? createMatchTargetId(defaultInvitationMatch.matchId)
      : defaultInvitationPost
        ? createPostTargetId(defaultInvitationPost.postId)
        : "manual",
  );
  const [scheduledDate, setScheduledDate] = useState(
    defaultInvitationMatch?.scheduledDate ??
      defaultInvitationPost?.scheduledDate ??
      createDateInputValue(1),
  );
  const [scheduledStartTime, setScheduledStartTime] = useState(
    defaultInvitationMatch?.scheduledStartTime ??
      defaultInvitationPost?.scheduledStartTime ??
      "",
  );
  const [placeText, setPlaceText] = useState(
    defaultInvitationMatch?.placeText ?? defaultInvitationPost?.placeText ?? "",
  );
  const [desiredPlayStyle, setDesiredPlayStyle] =
    useState<PlayStyle>(
      defaultInvitationMatch?.playStyle ??
        defaultInvitationPost?.desiredPlayStyle ??
        "competitive",
    );
  const [note, setNote] = useState("");
  const selectedInvitationMatch = availableInvitationMatches.find(
    (availableInvitationMatch) =>
      createMatchTargetId(availableInvitationMatch.matchId) ===
      selectedInvitationTargetId,
  );
  const selectedInvitationPost = standaloneInvitationPosts.find(
    (availableInvitationPost) =>
      createPostTargetId(availableInvitationPost.postId) ===
      selectedInvitationTargetId,
  );
  const isLinkedToExistingTarget = Boolean(
    selectedInvitationMatch || selectedInvitationPost,
  );
  const hasInvitationTargets =
    availableInvitationMatches.length > 0 || standaloneInvitationPosts.length > 0;

  /**
   * Cambia el partido asociado a la invitacion.
   * Se construye para sincronizar fecha, hora, lugar y estilo con el cupo real.
   * Lo usa el selector de partido del modal.
   * Sirve para evitar invitaciones ambiguas cuando hay varios partidos abiertos.
   */
  function handleInvitationTargetChange(nextInvitationTargetId: string) {
    setSelectedInvitationTargetId(nextInvitationTargetId);

    const nextInvitationMatch = availableInvitationMatches.find(
      (availableInvitationMatch) =>
        createMatchTargetId(availableInvitationMatch.matchId) ===
        nextInvitationTargetId,
    );

    if (nextInvitationMatch) {
      setScheduledDate(nextInvitationMatch.scheduledDate);
      setScheduledStartTime(nextInvitationMatch.scheduledStartTime);
      setPlaceText(nextInvitationMatch.placeText);
      setDesiredPlayStyle(nextInvitationMatch.playStyle);
      return;
    }

    const nextInvitationPost = standaloneInvitationPosts.find(
      (availableInvitationPost) =>
        createPostTargetId(availableInvitationPost.postId) ===
        nextInvitationTargetId,
    );

    if (!nextInvitationPost) {
      return;
    }

    setScheduledDate(nextInvitationPost.scheduledDate);
    setScheduledStartTime(nextInvitationPost.scheduledStartTime);
    setPlaceText(nextInvitationPost.placeText);
    setDesiredPlayStyle(nextInvitationPost.desiredPlayStyle);
  }

  /**
   * Envia invitacion directa.
   * Se construye para transformar controles en input de caso de uso.
   * Lo usa el submit del formulario.
   * Sirve para notificar al perfil invitado.
   */
  function handleInvitationSubmit(
    submitEvent: FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();

    onInvitationCreate({
      invitedProfileId: invitedProfile.profileId,
      relatedPostId:
        selectedInvitationPost?.postId ?? selectedInvitationMatch?.sourcePostId,
      relatedMatchId: selectedInvitationMatch?.matchId,
      scheduledDate,
      scheduledStartTime,
      placeText,
      desiredPlayStyle,
      note,
    });
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70">
      <form
        className="w-full max-w-mobile rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating"
        onSubmit={handleInvitationSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Invitar
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {invitedProfile.displayName}
            </h2>
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
          {hasInvitationTargets ? (
            <FormField
              fieldType="select"
              label="Partido"
              onChange={(changeEvent) =>
                handleInvitationTargetChange(changeEvent.target.value)
              }
              value={selectedInvitationTargetId}
            >
              {availableInvitationMatches.map((availableInvitationMatch) => (
                <option
                  key={availableInvitationMatch.matchId}
                  value={createMatchTargetId(availableInvitationMatch.matchId)}
                >
                  {formatScheduledDateTime(
                    availableInvitationMatch.scheduledDate,
                    availableInvitationMatch.scheduledStartTime,
                  )}{" "}
                  - {availableInvitationMatch.placeText}
                </option>
              ))}
              {standaloneInvitationPosts.map((availableInvitationPost) => (
                <option
                  key={availableInvitationPost.postId}
                  value={createPostTargetId(availableInvitationPost.postId)}
                >
                  {formatScheduledDateTime(
                    availableInvitationPost.scheduledDate,
                    availableInvitationPost.scheduledStartTime,
                    availableInvitationPost.scheduledEndTime,
                  )}{" "}
                  - {availableInvitationPost.placeText} - faltan{" "}
                  {availableInvitationPost.missingPlayersCount}
                </option>
              ))}
              <option value="manual">Otro partido</option>
            </FormField>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              disabled={isLinkedToExistingTarget}
              label="Fecha"
              onChange={(changeEvent) => setScheduledDate(changeEvent.target.value)}
              required
              type="date"
              value={scheduledDate}
            />
            <FormField
              disabled={isLinkedToExistingTarget}
              label="Hora"
              onChange={(changeEvent) =>
                setScheduledStartTime(changeEvent.target.value)
              }
              required
              type="time"
              value={scheduledStartTime}
            />
          </div>
          <FormField
            disabled={isLinkedToExistingTarget}
            label="Lugar"
            onChange={(changeEvent) => setPlaceText(changeEvent.target.value)}
            required
            value={placeText}
          />
          <FormField
            disabled={isLinkedToExistingTarget}
            fieldType="select"
            label="Tipo de juego"
            onChange={(changeEvent) =>
              setDesiredPlayStyle(changeEvent.target.value as PlayStyle)
            }
            value={desiredPlayStyle}
          >
            {playStyleOptions.map((playStyleOption) => (
              <option key={playStyleOption.value} value={playStyleOption.value}>
                {playStyleOption.label}
              </option>
            ))}
          </FormField>
          <FormField
            fieldType="textarea"
            label="Nota corta"
            onChange={(changeEvent) => setNote(changeEvent.target.value)}
            value={note}
          />
        </div>

        <Button className="mt-5 w-full" icon={Send} type="submit" variant="primary">
          Enviar invitacion
        </Button>
      </form>
    </div>
  );
}

/**
 * Crea fecha por defecto para invitaciones manuales.
 * Se construye para evitar valores demo en produccion.
 * Lo usa DirectInvitationModal cuando no hay partido vinculado.
 * Sirve para mantener el formulario usable sin inventar lugar u hora.
 */
function createDateInputValue(daysAhead: number) {
  const dateInputValue = new Date();
  dateInputValue.setDate(dateInputValue.getDate() + daysAhead);

  return dateInputValue.toISOString().slice(0, 10);
}

/**
 * Crea value estable para opciones de partido estructurado.
 * Se construye para distinguir matches y publicaciones en un mismo select.
 * Lo usa DirectInvitationModal.
 * Sirve para no depender de ids con formatos diferentes.
 */
function createMatchTargetId(matchId: string) {
  return `match:${matchId}`;
}

/**
 * Crea value estable para opciones de publicacion.
 * Se construye para conservar compatibilidad con invitaciones antiguas.
 * Lo usa DirectInvitationModal.
 * Sirve para distinguir publicaciones dentro del selector de partido.
 */
function createPostTargetId(postId: string) {
  return `post:${postId}`;
}
