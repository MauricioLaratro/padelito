import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  MessageCircle,
  Send,
  Swords,
  Trophy,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { AvatarPreviewOverlay } from "../../components/common/AvatarPreviewOverlay";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { ProfileAvatar } from "../../components/common/ProfileAvatar";
import { matchStatusLabels, matchWinnerSideLabels } from "../../constants/matchOptions";
import {
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type { MatchRecord } from "../../domain/models/matchModels";
import type { PlayerProfile } from "../../domain/models/profileModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import {
  createWhatsappContactUrl,
  formatWhatsappDisplayPhone,
} from "../../utils/contactFormatters";
import { formatScheduledDateTime } from "../../utils/dateFormatters";

interface PublicPlayerProfileScreenProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onBack: () => void;
  onFollowToggle: (profileId: string) => void;
  onInvitationStart: (profileId: string) => void;
  onPrivateContactOpen: (profileId: string) => void;
  profile: PlayerProfile;
}

/**
 * Vista publica de perfil de jugador.
 * Se construye como pantalla completa para evitar cards incrustadas en busqueda.
 * La usa PlayerSearchScreen cuando hay un perfil seleccionado.
 * Sirve para ver datos publicos, score visible y acciones sociales del jugador.
 */
export function PublicPlayerProfileScreen({
  currentProfileId,
  database,
  onBack,
  onFollowToggle,
  onInvitationStart,
  onPrivateContactOpen,
  profile,
}: PublicPlayerProfileScreenProps) {
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const isFollowed = isProfileFollowed(
    database,
    currentProfileId,
    profile.profileId,
  );
  const followersCount = database.follows.filter(
    (followRelation) => followRelation.followedProfileId === profile.profileId,
  ).length;
  const followingCount = database.follows.filter(
    (followRelation) => followRelation.followerProfileId === profile.profileId,
  ).length;
  const visibleMatches = getVisibleProfileMatches(profile.profileId, database);
  const matchStats = calculateProfileMatchStats(
    profile.profileId,
    database,
    visibleMatches,
    profile.matchStatsResetAt,
  );
  const whatsappContactUrl = profile.whatsappPhone
    ? createWhatsappContactUrl(profile.whatsappPhone)
    : null;

  return (
    <section className="grid gap-3 px-4 pb-28 pt-4">
      <button
        className="inline-flex min-h-10 items-center gap-2 justify-self-start rounded-full border border-border-subtle bg-surface-primary px-4 text-sm font-black text-text-primary"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Jugadores
      </button>

      <article className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
        <div className="flex items-start gap-3">
          {profile.avatarUrl ? (
            <button
              aria-label="Ver foto de perfil"
              className="rounded-full"
              onClick={() => setIsAvatarPreviewOpen(true)}
              type="button"
            >
              <ProfileAvatar
                avatarUrl={profile.avatarUrl}
                className="bg-accent-lime text-background-primary"
                displayName={profile.displayName}
                profileType={profile.profileType}
                size="lg"
              />
            </button>
          ) : (
            <ProfileAvatar
              avatarUrl={profile.avatarUrl}
              className="bg-accent-lime text-background-primary"
              displayName={profile.displayName}
              profileType={profile.profileType}
              size="lg"
            />
          )}
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Jugador
            </p>
            <h1 className="truncate text-2xl font-black">
              {profile.displayName}
            </h1>
            {profile.bio ? (
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon={Trophy}>{playerLevelLabels[profile.playerLevel]}</Chip>
          <Chip>{playerPositionLabels[profile.preferredPosition]}</Chip>
          <Chip icon={Swords}>
            {playStyleLabels[profile.preferredPlayStyle]}
          </Chip>
          {profile.usualPlace ? <Chip icon={MapPin}>{profile.usualPlace}</Chip> : null}
          <Chip icon={UsersRound}>{followersCount} seguidores</Chip>
          <Chip icon={UserPlus}>{followingCount} siguiendo</Chip>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            icon={UserPlus}
            onClick={() => onFollowToggle(profile.profileId)}
            variant={isFollowed ? "secondary" : "primary"}
          >
            {isFollowed ? "Siguiendo" : "Seguir"}
          </Button>
          <Button
            icon={Send}
            onClick={() => onInvitationStart(profile.profileId)}
            variant="secondary"
          >
            Invitar
          </Button>
        </div>
      </article>

      <section className="rounded-lg border border-border-subtle bg-surface-primary p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
          Score
        </p>
        <h2 className="text-xl font-black">Rendimiento visible</h2>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatTile label="Jugados" value={matchStats.playedMatches} />
          <StatTile label="Ganados" value={matchStats.wonMatches} />
          <StatTile label="Perdidos" value={matchStats.lostMatches} />
          <StatTile label="Efectividad" value={`${matchStats.winRate}%`} />
        </div>
        {profile.matchStatsResetAt ? (
          <p className="mt-2 text-xs text-text-secondary">
            Score calculado desde el ultimo reset del jugador.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface-primary p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
          Contacto
        </p>
        <h2 className="text-xl font-black">WhatsApp</h2>
        {whatsappContactUrl && profile.whatsappPhone ? (
          <a
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-accent-lime px-4 text-sm font-black text-background-primary"
            href={whatsappContactUrl}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden="true" size={17} />
            {formatWhatsappDisplayPhone(profile.whatsappPhone)}
          </a>
        ) : (
          <div className="mt-3 grid gap-2">
            <Button
              icon={MessageCircle}
              onClick={() => onPrivateContactOpen(profile.profileId)}
              variant="secondary"
            >
              WhatsApp
            </Button>
            <p className="text-xs leading-5 text-text-secondary">
              Se habilita cuando hay una invitacion o solicitud aceptada.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface-primary p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
          Partidos
        </p>
        <h2 className="text-xl font-black">Historial visible</h2>
        <div className="mt-4 grid gap-3">
          {visibleMatches.length > 0 ? (
            visibleMatches.slice(0, 5).map((matchRecord) => (
              <PublicMatchCard
                database={database}
                key={matchRecord.matchId}
                matchRecord={matchRecord}
              />
            ))
          ) : (
            <p className="text-sm text-text-secondary">
              Todavia no hay partidos visibles para este jugador.
            </p>
          )}
        </div>
      </section>

      {isAvatarPreviewOpen && profile.avatarUrl ? (
        <AvatarPreviewOverlay
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          onClose={() => setIsAvatarPreviewOpen(false)}
        />
      ) : null}
    </section>
  );
}

interface PublicMatchCardProps {
  database: PadelitoLocalDatabase;
  matchRecord: MatchRecord;
}

/**
 * Card publica de partido.
 * Se construye para mostrar historial sin acciones de edicion.
 * La usa PublicPlayerProfileScreen.
 * Sirve para dar contexto de actividad y resultados visibles.
 */
function PublicMatchCard({ database, matchRecord }: PublicMatchCardProps) {
  const result = database.matchResults.find(
    (matchResult) => matchResult.matchId === matchRecord.matchId,
  );

  return (
    <article className="grid gap-2 rounded-lg border border-border-subtle bg-surface-secondary p-3">
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
        <Chip>{matchStatusLabels[matchRecord.status]}</Chip>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip icon={CalendarDays}>
          {formatScheduledDateTime(
            matchRecord.scheduledDate,
            matchRecord.scheduledStartTime,
          )}
        </Chip>
        <Chip icon={MapPin}>{matchRecord.placeText}</Chip>
      </div>
      {result ? (
        <div className="rounded-lg bg-surface-primary p-3 text-sm">
          <p className="font-black">
            {result.teamAScore} - {result.teamBScore}
          </p>
          <p className="text-xs text-text-secondary">
            {matchWinnerSideLabels[result.winnerSide]}
          </p>
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
 * Metrica compacta de perfil publico.
 * Se construye para reutilizar el lenguaje visual del perfil propio.
 * La usa PublicPlayerProfileScreen.
 * Sirve para mostrar score sin dashboard pesado.
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
 * Obtiene partidos visibles para un perfil.
 * Se construye desde el snapshot actual para respetar RLS y privacidad.
 * Lo usa PublicPlayerProfileScreen.
 * Sirve para calcular score sin pedir datos extra.
 */
function getVisibleProfileMatches(
  profileId: string,
  database: PadelitoLocalDatabase,
) {
  const profileMatchIds = new Set(
    database.matchParticipants
      .filter((matchParticipant) => matchParticipant.profileId === profileId)
      .map((matchParticipant) => matchParticipant.matchId),
  );

  return database.matchRecords
    .filter(
      (matchRecord) =>
        matchRecord.ownerProfileId === profileId ||
        profileMatchIds.has(matchRecord.matchId),
    )
    .sort((firstMatch, secondMatch) =>
      `${secondMatch.scheduledDate}${secondMatch.scheduledStartTime}`.localeCompare(
        `${firstMatch.scheduledDate}${firstMatch.scheduledStartTime}`,
      ),
    );
}

/**
 * Calcula estadisticas visibles del jugador.
 * Se construye igual que el perfil propio pero limitado al snapshot publico.
 * Lo usa PublicPlayerProfileScreen.
 * Sirve para mostrar jugados, ganados, perdidos y efectividad.
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
 * Indica si un perfil ya es seguido.
 * Se construye para definir el CTA principal del perfil publico.
 * Lo usa PublicPlayerProfileScreen.
 * Sirve para mantener estado visual de follow consistente.
 */
function isProfileFollowed(
  database: PadelitoLocalDatabase,
  followerProfileId: string,
  followedProfileId: string,
) {
  return database.follows.some(
    (followRelation) =>
      followRelation.followerProfileId === followerProfileId &&
      followRelation.followedProfileId === followedProfileId,
  );
}
