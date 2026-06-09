import { Send, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import { playStyleOptions } from "../../constants/profileOptions";
import type { PlayStyle } from "../../domain/enums/profileEnums";
import type { Profile } from "../../domain/models/profileModels";
import type { CreateInvitationInput } from "../../services/repositories/localPadelitoRepository";

interface DirectInvitationModalProps {
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
  invitedProfile,
  onClose,
  onInvitationCreate,
}: DirectInvitationModalProps) {
  const [scheduledDate, setScheduledDate] = useState("2026-06-20");
  const [scheduledStartTime, setScheduledStartTime] = useState("19:00");
  const [placeText, setPlaceText] = useState("Club Norte");
  const [desiredPlayStyle, setDesiredPlayStyle] =
    useState<PlayStyle>("competitive");
  const [note, setNote] = useState("");

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
          <FormField
            label="Lugar"
            onChange={(changeEvent) => setPlaceText(changeEvent.target.value)}
            required
            value={placeText}
          />
          <FormField
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
