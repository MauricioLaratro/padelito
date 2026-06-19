import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import {
  recurringChallengeDayOptions,
  recurringChallengeFrequencyOptions,
  recurringChallengeSideLabels,
} from "../../constants/recurringChallengeOptions";
import type {
  RecurringChallengeFrequency,
  RecurringChallengeSide,
} from "../../domain/enums/recurringChallengeEnums";
import type { Profile } from "../../domain/models/profileModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import type { CreateRecurringChallengeInput } from "../../services/repositories/padelitoRepository";
import { createCurrentIsoDate } from "../../utils/dateFormatters";
import { createUuidIdentifier } from "../../utils/identifierGenerator";

interface CreateRecurringChallengeModalProps {
  currentProfile: Profile;
  database: PadelitoLocalDatabase;
  onChallengeCreate: (challengeInput: CreateRecurringChallengeInput) => void;
  onClose: () => void;
}

/**
 * Modal de creacion de desafio recurrente.
 * Se construye para registrar partidos habituales entre equipos.
 * Lo usa RecurringChallengesSection.
 * Sirve para armar equipos base y calcular marcador acumulado.
 */
export function CreateRecurringChallengeModal({
  currentProfile,
  database,
  onChallengeCreate,
  onClose,
}: CreateRecurringChallengeModalProps) {
  const [title, setTitle] = useState("Desafío semanal");
  const [frequency, setFrequency] =
    useState<RecurringChallengeFrequency>("weekly");
  const [usualDayOfWeek, setUsualDayOfWeek] = useState(4);
  const [usualTime, setUsualTime] = useState("20:00");
  const [usualPlaceText, setUsualPlaceText] = useState(
    currentProfile.usualPlace ?? "",
  );
  const [currentPlayerSide, setCurrentPlayerSide] =
    useState<RecurringChallengeSide>("team_a");
  const [selectedParticipantSides, setSelectedParticipantSides] = useState<
    Record<string, RecurringChallengeSide>
  >({});
  const followedPlayerProfiles = database.follows
    .filter(
      (followRelation) =>
        followRelation.followerProfileId === currentProfile.profileId,
    )
    .map((followRelation) =>
      database.profiles.find(
        (profile) =>
          profile.profileId === followRelation.followedProfileId &&
          profile.profileType === "player",
      ),
    )
    .filter((profile): profile is Profile => Boolean(profile));

  /**
   * Alterna jugador del desafio.
   * Se construye para armar equipos sin duplicar controles.
   * Lo usa cada checkbox de participante.
   * Sirve para registrar parejas o grupos fijos.
   */
  function handleParticipantToggle(profileId: string) {
    setSelectedParticipantSides((currentSelection) => {
      if (currentSelection[profileId]) {
        const { [profileId]: ignoredProfile, ...nextSelection } =
          currentSelection;
        void ignoredProfile;

        return nextSelection;
      }

      return {
        ...currentSelection,
        [profileId]: "team_b",
      };
    });
  }

  /**
   * Crea desafio con participantes base.
   * Se construye para producir entidades normalizadas.
   * Lo usa el submit del modal.
   * Sirve para asociar partidos futuros al desafio.
   */
  function handleChallengeSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const currentTimestamp = createCurrentIsoDate();
    const challengeId = createUuidIdentifier();

    onChallengeCreate({
      challenge: {
        challengeId,
        ownerProfileId: currentProfile.profileId,
        title,
        frequency,
        usualDayOfWeek,
        usualTime,
        usualPlaceText,
        status: "active",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      },
      participants: [
        {
          challengeId,
          profileId: currentProfile.profileId,
          side: currentPlayerSide,
          createdAt: currentTimestamp,
        },
        ...Object.entries(selectedParticipantSides).map(
          ([profileId, participantSide]) => ({
            challengeId,
            profileId,
            side: participantSide,
            createdAt: currentTimestamp,
          }),
        ),
      ],
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70">
      <form
        className="max-h-[90vh] w-full max-w-mobile overflow-auto rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating"
        onSubmit={handleChallengeSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Desafío
            </p>
            <h2 className="mt-1 text-2xl font-black">Nuevo desafío</h2>
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
            label="Nombre"
            onChange={(changeEvent) => setTitle(changeEvent.target.value)}
            required
            value={title}
          />
          <FormField
            fieldType="select"
            label="Frecuencia"
            onChange={(changeEvent) =>
              setFrequency(
                changeEvent.target.value as RecurringChallengeFrequency,
              )
            }
            value={frequency}
          >
            {recurringChallengeFrequencyOptions.map((frequencyOption) => (
              <option key={frequencyOption.value} value={frequencyOption.value}>
                {frequencyOption.label}
              </option>
            ))}
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              fieldType="select"
              label="Día"
              onChange={(changeEvent) =>
                setUsualDayOfWeek(Number.parseInt(changeEvent.target.value, 10))
              }
              value={usualDayOfWeek}
            >
              {recurringChallengeDayOptions.map((dayOption) => (
                <option key={dayOption.value} value={dayOption.value}>
                  {dayOption.label}
                </option>
              ))}
            </FormField>
            <FormField
              label="Hora"
              onChange={(changeEvent) => setUsualTime(changeEvent.target.value)}
              type="time"
              value={usualTime}
            />
          </div>
          <FormField
            label="Lugar"
            onChange={(changeEvent) => setUsualPlaceText(changeEvent.target.value)}
            value={usualPlaceText}
          />
          <FormField
            fieldType="select"
            label="Mi equipo"
            onChange={(changeEvent) =>
              setCurrentPlayerSide(
                changeEvent.target.value as RecurringChallengeSide,
              )
            }
            value={currentPlayerSide}
          >
            {(["team_a", "team_b"] as const).map((side) => (
              <option key={side} value={side}>
                {recurringChallengeSideLabels[side]}
              </option>
            ))}
          </FormField>

          <section className="grid gap-2 rounded-lg border border-border-subtle bg-surface-primary p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-accent-lime">
              Participantes
            </p>
            {followedPlayerProfiles.length > 0 ? (
              followedPlayerProfiles.map((profile) => (
                <div
                  className="grid gap-2 rounded-lg bg-surface-secondary p-3"
                  key={profile.profileId}
                >
                  <label className="flex items-center gap-3 text-sm font-black">
                    <input
                      checked={Boolean(
                        selectedParticipantSides[profile.profileId],
                      )}
                      onChange={() => handleParticipantToggle(profile.profileId)}
                      type="checkbox"
                    />
                    <span>{profile.displayName}</span>
                  </label>
                  {selectedParticipantSides[profile.profileId] ? (
                    <select
                      className="min-h-10 rounded-lg border border-border-subtle bg-surface-primary px-3 text-sm text-text-primary outline-none focus:border-accent-lime"
                      onChange={(changeEvent) =>
                        setSelectedParticipantSides((currentSelection) => ({
                          ...currentSelection,
                          [profile.profileId]: changeEvent.target
                            .value as RecurringChallengeSide,
                        }))
                      }
                      value={selectedParticipantSides[profile.profileId]}
                    >
                      {(["team_a", "team_b"] as const).map((side) => (
                        <option key={side} value={side}>
                          {recurringChallengeSideLabels[side]}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">
                Seguí jugadores para agregarlos al desafío.
              </p>
            )}
          </section>
        </div>

        <Button className="mt-5 w-full" type="submit" variant="primary">
          Guardar desafío
        </Button>
      </form>
    </div>
  );
}
