import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import {
  matchParticipantSideOptions,
} from "../../constants/matchOptions";
import { maximumMissingPlayersCount } from "../../constants/postOptions";
import {
  playerLevelOptions,
  playerPositionOptions,
  playStyleOptions,
} from "../../constants/profileOptions";
import type { MatchParticipantSide } from "../../domain/enums/matchEnums";
import type {
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
} from "../../domain/enums/profileEnums";
import type { Profile } from "../../domain/models/profileModels";
import type { CreateMatchInput } from "../../services/repositories/padelitoRepository";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import { createCurrentIsoDate } from "../../utils/dateFormatters";
import { createUuidIdentifier } from "../../utils/identifierGenerator";

interface CreateMatchModalProps {
  currentProfile: Profile;
  database: PadelitoLocalDatabase;
  onClose: () => void;
  onMatchCreate: (matchInput: CreateMatchInput) => void;
}

/**
 * Modal de creacion de partido estructurado.
 * Se construye para registrar partidos reales separados del feed.
 * Lo usa MatchHistorySection.
 * Sirve para agregar participantes seguidos y resultado opcional.
 */
export function CreateMatchModal({
  currentProfile,
  database,
  onClose,
  onMatchCreate,
}: CreateMatchModalProps) {
  const [scheduledDate, setScheduledDate] = useState(() =>
    createDateInputValue(1),
  );
  const [scheduledStartTime, setScheduledStartTime] = useState("20:00");
  const [placeText, setPlaceText] = useState(currentProfile.usualPlace ?? "");
  const [playStyle, setPlayStyle] = useState<PlayStyle>("competitive");
  const [shortNote, setShortNote] = useState("");
  const [currentPlayerSide, setCurrentPlayerSide] =
    useState<MatchParticipantSide>("team_a");
  const [selectedParticipantSides, setSelectedParticipantSides] = useState<
    Record<string, MatchParticipantSide>
  >({});
  const [shouldSearchPlayers, setShouldSearchPlayers] = useState(false);
  const [missingPlayersCount, setMissingPlayersCount] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<PlayerLevel>(
    currentProfile.profileType === "player"
      ? currentProfile.playerLevel
      : "sixth",
  );
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition>(
    currentProfile.profileType === "player"
      ? currentProfile.preferredPosition
      : "drive",
  );
  const [shouldRecordResult, setShouldRecordResult] = useState(false);
  const [teamAScore, setTeamAScore] = useState(6);
  const [teamBScore, setTeamBScore] = useState(4);

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
   * Alterna participante seguido.
   * Se construye para permitir partidos rotativos con N jugadores.
   * Lo usa cada checkbox de perfil.
   * Sirve para armar participantes sin limite fijo de parejas.
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
   * Crea el partido y resultado opcional.
   * Se construye para generar entidades normalizadas desde un formulario simple.
   * Lo usa el submit del modal.
   * Sirve para alimentar historial y estadisticas del perfil.
   */
  function handleMatchSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    const currentTimestamp = createCurrentIsoDate();
    const matchId = createUuidIdentifier();
    const sourcePostId = shouldSearchPlayers ? createUuidIdentifier() : undefined;
    const sourcePost = sourcePostId
      ? {
          postId: sourcePostId,
          authorProfileId: currentProfile.profileId,
          postType: "looking_for_player" as const,
          visibility: "public" as const,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
          scheduledDate,
          scheduledStartTime,
          placeText,
          shortNote,
          isActive: missingPlayersCount > 0,
          desiredLevel: selectedLevel,
          desiredPosition: selectedPosition,
          desiredPlayStyle: playStyle,
          missingPlayersCount,
          confirmedPlayersText: createConfirmedPlayersText(
            currentProfile,
            database,
            selectedParticipantSides,
          ),
        }
      : undefined;
    const matchInput: CreateMatchInput = {
      matchRecord: {
        matchId,
        ownerProfileId: currentProfile.profileId,
        sourcePostId,
        scheduledDate,
        scheduledStartTime,
        placeText,
        playStyle,
        status: shouldRecordResult ? "completed" : "scheduled",
        shortNote,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      },
      participants: [
        {
          matchId,
          profileId: currentProfile.profileId,
          side: currentPlayerSide,
          createdAt: currentTimestamp,
        },
        ...Object.entries(selectedParticipantSides).map(
          ([profileId, participantSide]) => ({
            matchId,
            profileId,
            side: participantSide,
            createdAt: currentTimestamp,
          }),
        ),
      ],
      sourcePost,
      result: shouldRecordResult
        ? {
            matchId,
            teamAScore,
            teamBScore,
            winnerSide: getWinnerSide(teamAScore, teamBScore),
            recordedAt: currentTimestamp,
          }
        : undefined,
    };

    onMatchCreate(matchInput);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70">
      <form
        className="max-h-[90vh] w-full max-w-mobile overflow-auto rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating"
        onSubmit={handleMatchSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Partido
            </p>
            <h2 className="mt-1 text-2xl font-black">Nuevo partido</h2>
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
            label="Juego"
            onChange={(changeEvent) =>
              setPlayStyle(changeEvent.target.value as PlayStyle)
            }
            value={playStyle}
          >
            {playStyleOptions.map((playStyleOption) => (
              <option key={playStyleOption.value} value={playStyleOption.value}>
                {playStyleOption.label}
              </option>
            ))}
          </FormField>
          <FormField
            fieldType="textarea"
            label="Nota"
            onChange={(changeEvent) => setShortNote(changeEvent.target.value)}
            value={shortNote}
          />

          <FormField
            fieldType="select"
            label="Mi lado"
            onChange={(changeEvent) =>
              setCurrentPlayerSide(
                changeEvent.target.value as MatchParticipantSide,
              )
            }
            value={currentPlayerSide}
          >
            {matchParticipantSideOptions.map((sideOption) => (
              <option key={sideOption.value} value={sideOption.value}>
                {sideOption.label}
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
                            .value as MatchParticipantSide,
                        }))
                      }
                      value={selectedParticipantSides[profile.profileId]}
                    >
                      {matchParticipantSideOptions.map((sideOption) => (
                        <option key={sideOption.value} value={sideOption.value}>
                          {sideOption.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">
                Segui jugadores para agregarlos rapido al partido.
              </p>
            )}
          </section>

          <label className="flex items-center gap-3 rounded-lg bg-surface-primary p-3 text-sm font-black">
            <input
              checked={shouldSearchPlayers}
              onChange={(changeEvent) =>
                setShouldSearchPlayers(changeEvent.target.checked)
              }
              type="checkbox"
            />
            <span>Buscar jugadores</span>
          </label>

          {shouldSearchPlayers ? (
            <div className="grid gap-3 rounded-lg border border-border-subtle bg-surface-primary p-3">
              <FormField
                label="Faltan"
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
                fieldType="select"
                label="Categoria"
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
                label="Posicion"
                onChange={(changeEvent) =>
                  setSelectedPosition(
                    changeEvent.target.value as PlayerPosition,
                  )
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
            </div>
          ) : null}

          <label className="flex items-center gap-3 rounded-lg bg-surface-primary p-3 text-sm font-black">
            <input
              checked={shouldRecordResult}
              onChange={(changeEvent) =>
                setShouldRecordResult(changeEvent.target.checked)
              }
              type="checkbox"
            />
            <span>Registrar resultado ahora</span>
          </label>

          {shouldRecordResult ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Equipo A"
                min={0}
                onChange={(changeEvent) =>
                  setTeamAScore(Number.parseInt(changeEvent.target.value, 10) || 0)
                }
                type="number"
                value={teamAScore}
              />
              <FormField
                label="Equipo B"
                min={0}
                onChange={(changeEvent) =>
                  setTeamBScore(Number.parseInt(changeEvent.target.value, 10) || 0)
                }
                type="number"
                value={teamBScore}
              />
            </div>
          ) : null}
        </div>

        <Button className="mt-5 w-full" type="submit" variant="primary">
          Guardar partido
        </Button>
      </form>
    </div>
  );
}

/**
 * Crea fecha por defecto para inputs date.
 * Se construye para evitar datos inventados fijos.
 * Lo usa CreateMatchModal.
 * Sirve para iniciar rapido un partido cercano.
 */
function createDateInputValue(daysAhead: number) {
  const dateInputValue = new Date();
  dateInputValue.setDate(dateInputValue.getDate() + daysAhead);

  return dateInputValue.toISOString().slice(0, 10);
}

/**
 * Calcula ganador desde marcador simple.
 * Se construye para no repetir logica de resultado.
 * Lo usa el modal de partido.
 * Sirve para alimentar estadisticas por equipo.
 */
function getWinnerSide(teamAScore: number, teamBScore: number) {
  if (teamAScore > teamBScore) {
    return "team_a";
  }

  if (teamBScore > teamAScore) {
    return "team_b";
  }

  return "draw";
}

/**
 * Genera texto compacto de confirmados para la publicacion vinculada.
 * Se construye para que el feed refleje quienes ya estan dentro del partido.
 * Lo usa CreateMatchModal al publicar un partido incompleto.
 * Sirve como puente hasta que el feed lea participantes estructurados.
 */
function createConfirmedPlayersText(
  currentProfile: Profile,
  database: PadelitoLocalDatabase,
  selectedParticipantSides: Record<string, MatchParticipantSide>,
) {
  const selectedProfiles = Object.keys(selectedParticipantSides)
    .map((profileId) =>
      database.profiles.find((profile) => profile.profileId === profileId),
    )
    .filter((profile): profile is Profile => Boolean(profile));
  const confirmedNames = [
    currentProfile.displayName,
    ...selectedProfiles.map((profile) => profile.displayName),
  ];

  return confirmedNames.join(", ").slice(0, 180);
}
