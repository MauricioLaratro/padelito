import {
  CalendarDays,
  MapPin,
  Plus,
  RotateCcw,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { IncrementalLoadMarker } from "../../components/common/IncrementalLoadMarker";
import {
  matchParticipantSideLabels,
  matchStatusLabels,
  matchWinnerSideLabels,
} from "../../constants/matchOptions";
import { playStyleLabels } from "../../constants/profileOptions";
import type { MatchRecord, MatchResult } from "../../domain/models/matchModels";
import type { Profile } from "../../domain/models/profileModels";
import type { CreateMatchInput } from "../../services/repositories/padelitoRepository";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import { useIncrementalItems } from "../../hooks/useIncrementalItems";
import { formatScheduledDateTime } from "../../utils/dateFormatters";
import { CreateMatchModal } from "./CreateMatchModal";
import { MatchResultModal } from "./MatchResultModal";

interface MatchHistorySectionProps {
  currentProfile: Profile;
  database: PadelitoLocalDatabase;
  onMatchCancel: (matchId: string) => void;
  onMatchCreate: (matchInput: CreateMatchInput) => void;
  onMatchResultRecord: (matchResult: MatchResult) => void;
  onOwnMatchStatsReset: () => void;
}

/**
 * Seccion de partidos, historial y estadisticas.
 * Se construye para completar el flujo post-partido del MVP.
 * La usa ProfileScreen.
 * Sirve para crear partidos, registrar resultados y ver rendimiento.
 */
export function MatchHistorySection({
  currentProfile,
  database,
  onMatchCancel,
  onMatchCreate,
  onMatchResultRecord,
  onOwnMatchStatsReset,
}: MatchHistorySectionProps) {
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [resultMatchId, setResultMatchId] = useState<string | null>(null);
  const profileMatchIds = useMemo(
    () =>
      new Set(
        database.matchParticipants
          .filter(
            (matchParticipant) =>
              matchParticipant.profileId === currentProfile.profileId,
          )
          .map((matchParticipant) => matchParticipant.matchId),
      ),
    [currentProfile.profileId, database.matchParticipants],
  );
  const visibleMatches = useMemo(
    () =>
      database.matchRecords
        .filter(
          (matchRecord) =>
            matchRecord.ownerProfileId === currentProfile.profileId ||
            profileMatchIds.has(matchRecord.matchId),
        )
        .sort((firstMatch, secondMatch) =>
          `${secondMatch.scheduledDate}${secondMatch.scheduledStartTime}`.localeCompare(
            `${firstMatch.scheduledDate}${firstMatch.scheduledStartTime}`,
          ),
        ),
    [currentProfile.profileId, database.matchRecords, profileMatchIds],
  );
  const matchIncrementalItems = useIncrementalItems({
    batchSize: 5,
    initialVisibleCount: 5,
    items: visibleMatches,
  });
  const selectedResultMatch = resultMatchId
    ? visibleMatches.find((matchRecord) => matchRecord.matchId === resultMatchId)
    : null;
  const selectedResult = selectedResultMatch
    ? database.matchResults.find(
        (matchResult) => matchResult.matchId === selectedResultMatch.matchId,
      )
    : undefined;
  const matchStats = calculateProfileMatchStats(
    currentProfile.profileId,
    database,
    visibleMatches,
    currentProfile.matchStatsResetAt,
  );

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Partidos
          </p>
          <h2 className="text-xl font-black">Historial</h2>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            className="min-h-9 px-3"
            icon={RotateCcw}
            onClick={onOwnMatchStatsReset}
            variant="secondary"
          >
            Resetear score
          </Button>
          <Button
            className="min-h-9 px-3"
            icon={Plus}
            onClick={() => setIsCreateMatchOpen(true)}
            variant="primary"
          >
            Crear
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <StatTile label="Jugados" value={matchStats.playedMatches} />
        <StatTile label="Ganados" value={matchStats.wonMatches} />
        <StatTile label="Perdidos" value={matchStats.lostMatches} />
        <StatTile label="Efectividad" value={`${matchStats.winRate}%`} />
      </div>

      {currentProfile.matchStatsResetAt ? (
        <p className="mt-2 text-xs text-text-secondary">
          Score calculado desde el último reset.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {visibleMatches.length > 0 ? (
          <>
            {matchIncrementalItems.visibleItems.map((matchRecord) => (
              <MatchHistoryCard
                currentProfileId={currentProfile.profileId}
                database={database}
                key={matchRecord.matchId}
                matchRecord={matchRecord}
                onMatchCancel={onMatchCancel}
                onResultOpen={setResultMatchId}
              />
            ))}
            <IncrementalLoadMarker
              hasMoreItems={matchIncrementalItems.hasMoreItems}
              loadMoreMarkerRef={matchIncrementalItems.loadMoreMarkerRef}
              onLoadMore={matchIncrementalItems.loadMoreItems}
              totalItemCount={matchIncrementalItems.totalItemCount}
              visibleItemCount={matchIncrementalItems.visibleItemCount}
            />
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            Todavía no hay partidos registrados.
          </p>
        )}
      </div>

      {isCreateMatchOpen ? (
        <CreateMatchModal
          currentProfile={currentProfile}
          database={database}
          onClose={() => setIsCreateMatchOpen(false)}
          onMatchCreate={onMatchCreate}
        />
      ) : null}

      {selectedResultMatch ? (
        <MatchResultModal
          currentResult={selectedResult}
          matchRecord={selectedResultMatch}
          onClose={() => setResultMatchId(null)}
          onMatchResultRecord={onMatchResultRecord}
        />
      ) : null}
    </section>
  );
}

interface MatchHistoryCardProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  matchRecord: MatchRecord;
  onMatchCancel: (matchId: string) => void;
  onResultOpen: (matchId: string) => void;
}

/**
 * Card compacta de partido.
 * Se construye para listar programados y finalizados juntos.
 * La usa MatchHistorySection.
 * Sirve para cancelar o registrar resultados desde el perfil.
 */
function MatchHistoryCard({
  currentProfileId,
  database,
  matchRecord,
  onMatchCancel,
  onResultOpen,
}: MatchHistoryCardProps) {
  const participants = database.matchParticipants.filter(
    (matchParticipant) => matchParticipant.matchId === matchRecord.matchId,
  );
  const result = database.matchResults.find(
    (matchResult) => matchResult.matchId === matchRecord.matchId,
  );
  const isOwner = matchRecord.ownerProfileId === currentProfileId;
  const statusTone =
    matchRecord.status === "completed"
      ? "success"
      : matchRecord.status === "cancelled"
        ? "danger"
        : "lime";

  return (
    <article className="grid gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black">{matchRecord.placeText}</h3>
          <p className="mt-1 text-xs text-text-secondary">
            {formatScheduledDateTime(
              matchRecord.scheduledDate,
              matchRecord.scheduledStartTime,
            )}
          </p>
        </div>
        <Chip tone={statusTone}>{matchStatusLabels[matchRecord.status]}</Chip>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip icon={CalendarDays}>
          {formatScheduledDateTime(
            matchRecord.scheduledDate,
            matchRecord.scheduledStartTime,
          )}
        </Chip>
        <Chip icon={MapPin}>{matchRecord.placeText}</Chip>
        <Chip icon={Trophy}>{playStyleLabels[matchRecord.playStyle]}</Chip>
        <Chip icon={UsersRound}>{participants.length} jugadores</Chip>
      </div>

      <div className="grid gap-1 text-xs text-text-secondary">
        {(["team_a", "team_b", "rotating"] as const).map((side) => {
          const sideParticipants = participants.filter(
            (matchParticipant) => matchParticipant.side === side,
          );

          if (sideParticipants.length === 0) {
            return null;
          }

          return (
            <p key={side}>
              <span className="font-black text-text-primary">
                {matchParticipantSideLabels[side]}:
              </span>{" "}
              {sideParticipants
                .map((matchParticipant) =>
                  getProfileDisplayName(database, matchParticipant.profileId),
                )
                .join(", ")}
            </p>
          );
        })}
      </div>

      {result ? (
        <div className="rounded-lg bg-surface-primary p-3 text-sm">
          <p className="font-black">
            {result.teamAScore} - {result.teamBScore}
          </p>
          <p className="text-xs text-text-secondary">
            {matchWinnerSideLabels[result.winnerSide]}
          </p>
          {result.summary ? (
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              {result.summary}
            </p>
          ) : null}
        </div>
      ) : null}

      {isOwner && matchRecord.status !== "cancelled" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            icon={Trophy}
            onClick={() => onResultOpen(matchRecord.matchId)}
            variant="secondary"
          >
            {result ? "Editar resultado" : "Resultado"}
          </Button>
          {matchRecord.status === "scheduled" ? (
            <Button
              icon={X}
              onClick={() => onMatchCancel(matchRecord.matchId)}
              variant="danger"
            >
              Cancelar
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

interface StatTileProps {
  label: string;
  value: number | string;
}

/**
 * Metrica compacta de perfil.
 * Se construye para mostrar estadisticas sin dashboard separado.
 * La usa MatchHistorySection.
 * Sirve para lectura rapida mobile-first.
 */
function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg bg-surface-secondary p-2 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase text-text-secondary">
        {label}
      </p>
    </div>
  );
}

/**
 * Calcula estadisticas del perfil.
 * Se construye desde resultados para evitar tablas agregadas tempranas.
 * Lo usa MatchHistorySection.
 * Sirve para mostrar jugados, victorias, derrotas y efectividad.
 */
function calculateProfileMatchStats(
  profileId: string,
  database: PadelitoLocalDatabase,
  visibleMatches: MatchRecord[],
  matchStatsResetAt?: string,
) {
  const completedMatches = visibleMatches.filter((matchRecord) => {
    const result = database.matchResults.find(
      (matchResult) => matchResult.matchId === matchRecord.matchId,
    );

    if (!result) {
      return false;
    }

    return !matchStatsResetAt || result.recordedAt >= matchStatsResetAt;
  });
  const decisiveMatches = completedMatches
    .map((matchRecord) => {
      const participant = database.matchParticipants.find(
        (matchParticipant) =>
          matchParticipant.matchId === matchRecord.matchId &&
          matchParticipant.profileId === profileId,
      );
      const result = database.matchResults.find(
        (matchResult) => matchResult.matchId === matchRecord.matchId,
      );

      return { participant, result };
    })
    .filter(
      ({ participant, result }) =>
        participant &&
        result &&
        participant.side !== "rotating" &&
        result.winnerSide !== "draw",
    );
  const wonMatches = decisiveMatches.filter(
    ({ participant, result }) => participant?.side === result?.winnerSide,
  ).length;
  const lostMatches = decisiveMatches.length - wonMatches;
  const winRate =
    decisiveMatches.length > 0
      ? Math.round((wonMatches / decisiveMatches.length) * 100)
      : 0;

  return {
    lostMatches,
    playedMatches: completedMatches.length,
    winRate,
    wonMatches,
  };
}

/**
 * Busca nombre visible de perfil.
 * Se construye para mantener cards legibles aunque falte snapshot de perfil.
 * Lo usa MatchHistoryCard.
 * Sirve para listar participantes.
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
