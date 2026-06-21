import {
  Archive,
  CalendarClock,
  Plus,
  RotateCcw,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { IncrementalLoadMarker } from "../../components/common/IncrementalLoadMarker";
import {
  recurringChallengeFrequencyLabels,
  recurringChallengeSideLabels,
  recurringChallengeStatusLabels,
} from "../../constants/recurringChallengeOptions";
import type { RecurringChallengeStatus } from "../../domain/enums/recurringChallengeEnums";
import type { RecurringChallenge } from "../../domain/models/recurringChallengeModels";
import type { Profile } from "../../domain/models/profileModels";
import { useIncrementalItems } from "../../hooks/useIncrementalItems";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import type { CreateRecurringChallengeInput } from "../../services/repositories/padelitoRepository";
import { CreateRecurringChallengeModal } from "./CreateRecurringChallengeModal";

interface RecurringChallengesSectionProps {
  currentProfile: Profile;
  database: PadelitoLocalDatabase;
  onRecurringChallengeCreate: (
    challengeInput: CreateRecurringChallengeInput,
  ) => void;
  onRecurringChallengeStatusUpdate: (
    challengeId: string,
    status: RecurringChallengeStatus,
  ) => void;
}

/**
 * Seccion de desafios recurrentes.
 * Se construye para llevar historial acumulado de partidos repetidos.
 * La usa ProfileScreen.
 * Sirve para crear desafios y ver marcador entre equipos.
 */
export function RecurringChallengesSection({
  currentProfile,
  database,
  onRecurringChallengeCreate,
  onRecurringChallengeStatusUpdate,
}: RecurringChallengesSectionProps) {
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const visibleChallenges = useMemo(
    () =>
      database.recurringChallenges
        .filter(
          (challenge) =>
            challenge.ownerProfileId === currentProfile.profileId ||
            database.recurringChallengeParticipants.some(
              (challengeParticipant) =>
                challengeParticipant.challengeId === challenge.challengeId &&
                challengeParticipant.profileId === currentProfile.profileId,
            ),
        )
        .sort((firstChallenge, secondChallenge) =>
          secondChallenge.updatedAt.localeCompare(firstChallenge.updatedAt),
        ),
    [
      currentProfile.profileId,
      database.recurringChallengeParticipants,
      database.recurringChallenges,
    ],
  );
  const challengeIncrementalItems = useIncrementalItems({
    batchSize: 4,
    initialVisibleCount: 3,
    items: visibleChallenges,
  });

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Desafíos
          </p>
          <h2 className="text-xl font-black">Recurrentes</h2>
        </div>
        <Button
          className="min-h-9 px-3"
          icon={Plus}
          onClick={() => setIsCreateChallengeOpen(true)}
          variant="primary"
        >
          Crear
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {visibleChallenges.length > 0 ? (
          <>
            {challengeIncrementalItems.visibleItems.map((challenge) => (
              <RecurringChallengeCard
                challenge={challenge}
                currentProfileId={currentProfile.profileId}
                database={database}
                key={challenge.challengeId}
                onStatusUpdate={onRecurringChallengeStatusUpdate}
              />
            ))}
            <IncrementalLoadMarker
              hasMoreItems={challengeIncrementalItems.hasMoreItems}
              loadMoreMarkerRef={challengeIncrementalItems.loadMoreMarkerRef}
              onLoadMore={challengeIncrementalItems.loadMoreItems}
              totalItemCount={challengeIncrementalItems.totalItemCount}
              visibleItemCount={challengeIncrementalItems.visibleItemCount}
            />
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            Todavía no hay desafíos recurrentes.
          </p>
        )}
      </div>

      {isCreateChallengeOpen ? (
        <CreateRecurringChallengeModal
          currentProfile={currentProfile}
          database={database}
          onChallengeCreate={onRecurringChallengeCreate}
          onClose={() => setIsCreateChallengeOpen(false)}
        />
      ) : null}
    </section>
  );
}

interface RecurringChallengeCardProps {
  challenge: RecurringChallenge;
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onStatusUpdate: (
    challengeId: string,
    status: RecurringChallengeStatus,
  ) => void;
}

/**
 * Card de desafio con marcador acumulado.
 * Se construye para leer resultados sin tabla agregada.
 * La usa RecurringChallengesSection.
 * Sirve para ver rapidamente quien domina la serie.
 */
function RecurringChallengeCard({
  challenge,
  currentProfileId,
  database,
  onStatusUpdate,
}: RecurringChallengeCardProps) {
  const challengeParticipants = database.recurringChallengeParticipants.filter(
    (challengeParticipant) =>
      challengeParticipant.challengeId === challenge.challengeId,
  );
  const challengeMatches = database.matchRecords.filter(
    (matchRecord) =>
      matchRecord.recurringChallengeId === challenge.challengeId &&
      matchRecord.status === "completed",
  );
  const challengeResults = challengeMatches
    .map((matchRecord) =>
      database.matchResults.find(
        (matchResult) => matchResult.matchId === matchRecord.matchId,
      ),
    )
    .filter((matchResult): matchResult is NonNullable<typeof matchResult> =>
      Boolean(matchResult),
    );
  const teamAWins = challengeResults.filter(
    (matchResult) => matchResult.winnerSide === "team_a",
  ).length;
  const teamBWins = challengeResults.filter(
    (matchResult) => matchResult.winnerSide === "team_b",
  ).length;
  const isOwner = challenge.ownerProfileId === currentProfileId;
  const nextStatus: RecurringChallengeStatus =
    challenge.status === "active" ? "archived" : "active";
  const statusButtonLabel =
    challenge.status === "active" ? "Archivar" : "Reactivar";
  const StatusButtonIcon =
    challenge.status === "active" ? Archive : RotateCcw;

  return (
    <article className="grid gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black">{challenge.title}</h3>
          <p className="mt-1 text-xs text-text-secondary">
            {recurringChallengeFrequencyLabels[challenge.frequency]}
          </p>
        </div>
        <Chip>{recurringChallengeStatusLabels[challenge.status]}</Chip>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <ScoreTile label="Equipo A" value={teamAWins} />
        <ScoreTile label="Partidos" value={challengeResults.length} />
        <ScoreTile label="Equipo B" value={teamBWins} />
      </div>

      <div className="flex flex-wrap gap-2">
        {challenge.usualPlaceText ? (
          <Chip icon={CalendarClock}>{challenge.usualPlaceText}</Chip>
        ) : null}
        <Chip icon={Trophy}>
          {teamAWins} - {teamBWins}
        </Chip>
        <Chip icon={UsersRound}>{challengeParticipants.length} jugadores</Chip>
      </div>

      <div className="grid gap-1 text-xs text-text-secondary">
        {(["team_a", "team_b"] as const).map((side) => {
          const sideParticipants = challengeParticipants.filter(
            (challengeParticipant) => challengeParticipant.side === side,
          );

          if (sideParticipants.length === 0) {
            return null;
          }

          return (
            <p key={side}>
              <span className="font-black text-text-primary">
                {recurringChallengeSideLabels[side]}:
              </span>{" "}
              {sideParticipants
                .map((challengeParticipant) =>
                  getProfileDisplayName(database, challengeParticipant.profileId),
                )
                .join(", ")}
            </p>
          );
        })}
      </div>

      {isOwner ? (
        <Button
          className="min-h-9 justify-self-start px-3"
          icon={StatusButtonIcon}
          onClick={() => onStatusUpdate(challenge.challengeId, nextStatus)}
          variant={challenge.status === "active" ? "secondary" : "primary"}
        >
          {statusButtonLabel}
        </Button>
      ) : null}
    </article>
  );
}

interface ScoreTileProps {
  label: string;
  value: number;
}

/**
 * Metrica compacta de marcador recurrente.
 * Se construye para mantener lectura mobile-first.
 * La usa RecurringChallengeCard.
 * Sirve para comparar equipos sin dashboard separado.
 */
function ScoreTile({ label, value }: ScoreTileProps) {
  return (
    <div className="rounded-lg bg-surface-primary p-2">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase text-text-secondary">
        {label}
      </p>
    </div>
  );
}

/**
 * Busca nombre visible de perfil.
 * Se construye para listar participantes aunque falte algun dato.
 * Lo usa RecurringChallengeCard.
 * Sirve para mantener tarjetas legibles.
 */
function getProfileDisplayName(
  database: PadelitoLocalDatabase,
  profileId: string,
) {
  return (
    database.profiles.find((profile) => profile.profileId === profileId)
      ?.displayName ?? "Jugador"
  );
}
