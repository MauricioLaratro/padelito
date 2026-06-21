import { MapPin, Search, Send, Swords, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { EmptyState } from "../../components/common/EmptyState";
import { ProfileAvatar } from "../../components/common/ProfileAvatar";
import { FormField } from "../../components/forms/FormField";
import {
  playerLevelLabels,
  playerPositionLabels,
  playStyleLabels,
} from "../../constants/profileOptions";
import type { PlayerProfile } from "../../domain/models/profileModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";

interface PlayerSearchScreenProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onFollowToggle: (profileId: string) => void;
  onInvitationStart: (profileId: string) => void;
  onProfileOpen: (profileId: string) => void;
}

/**
 * Pantalla de busqueda y perfil publico de jugadores.
 * Se construye para descubrir perfiles fuera del feed.
 * La usa App dentro de la navegacion principal.
 * Sirve para abrir perfiles completos, seguir e invitar a un jugador.
 */
export function PlayerSearchScreen({
  currentProfileId,
  database,
  onFollowToggle,
  onInvitationStart,
  onProfileOpen,
}: PlayerSearchScreenProps) {
  const [playerQuery, setPlayerQuery] = useState("");
  const playerProfiles = useMemo(
    () =>
      database.profiles.filter(
        (profile): profile is PlayerProfile =>
          profile.profileType === "player" &&
          profile.profileId !== currentProfileId,
    ),
    [currentProfileId, database.profiles],
  );
  const filteredProfiles = playerProfiles.filter((profile) => {
    const normalizedQuery = playerQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return [
      profile.displayName,
      profile.bio,
      profile.usualPlace,
      playerLevelLabels[profile.playerLevel],
      playerPositionLabels[profile.preferredPosition],
      playStyleLabels[profile.preferredPlayStyle],
    ]
      .filter(Boolean)
      .some((searchableText) =>
        searchableText?.toLowerCase().includes(normalizedQuery),
      );
  });

  return (
    <section className="grid gap-3 px-4 pb-28 pt-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
          Jugadores
        </p>
        <h1 className="text-2xl font-black">Buscar jugador</h1>
      </div>

      <FormField
        label="Buscar"
        onChange={(changeEvent) => setPlayerQuery(changeEvent.target.value)}
        placeholder="Nombre, zona, categoría"
        value={playerQuery}
      />

      <div className="grid gap-3">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <PlayerResultCard
              currentProfileId={currentProfileId}
              database={database}
              key={profile.profileId}
              onFollowToggle={onFollowToggle}
              onInvitationStart={onInvitationStart}
              onProfileOpen={onProfileOpen}
              profile={profile}
            />
          ))
        ) : (
          <EmptyState
            description="No encontramos jugadores con esos filtros."
            icon={Search}
            title="Sin resultados"
          />
        )}
      </div>
    </section>
  );
}

interface PlayerResultCardProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onFollowToggle: (profileId: string) => void;
  onInvitationStart: (profileId: string) => void;
  onProfileOpen: (profileId: string) => void;
  profile: PlayerProfile;
}

/**
 * Resultado compacto de busqueda de jugador.
 * Se construye para revisar varios perfiles rapidamente.
 * La usa PlayerSearchScreen.
 * Sirve para abrir perfil, seguir o invitar sin salir de la lista.
 */
function PlayerResultCard({
  currentProfileId,
  database,
  onFollowToggle,
  onInvitationStart,
  onProfileOpen,
  profile,
}: PlayerResultCardProps) {
  const isFollowed = isProfileFollowed(
    database,
    currentProfileId,
    profile.profileId,
  );

  return (
    <article className="rounded-lg border border-border-subtle bg-surface-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => onProfileOpen(profile.profileId)}
          type="button"
        >
          <ProfileAvatar
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            profileType={profile.profileType}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-black">{profile.displayName}</p>
            <p className="text-xs font-semibold text-text-secondary">Jugador</p>
          </div>
        </button>
        <Button
          className="min-h-8 px-3 text-xs"
          onClick={() => onFollowToggle(profile.profileId)}
          variant={isFollowed ? "ghost" : "secondary"}
        >
          {isFollowed ? "Siguiendo" : "Seguir"}
        </Button>
      </div>

      <PlayerProfileBody profile={profile} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          icon={Search}
          onClick={() => onProfileOpen(profile.profileId)}
          variant="secondary"
        >
          Ver perfil
        </Button>
        <Button
          icon={Send}
          onClick={() => onInvitationStart(profile.profileId)}
          variant="primary"
        >
          Invitar
        </Button>
      </div>
    </article>
  );
}

interface PlayerProfileBodyProps {
  profile: PlayerProfile;
}

/**
 * Datos publicos de jugador.
 * Se construye para reutilizar chips sin mostrar contacto privado.
 * Lo usan resultado y perfil publico.
 * Sirve para comparar categoria, posicion, estilo y zona.
 */
function PlayerProfileBody({ profile }: PlayerProfileBodyProps) {
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip icon={Trophy}>{playerLevelLabels[profile.playerLevel]}</Chip>
        <Chip>{playerPositionLabels[profile.preferredPosition]}</Chip>
        <Chip icon={Swords}>{playStyleLabels[profile.preferredPlayStyle]}</Chip>
        {profile.usualPlace ? (
          <Chip icon={MapPin}>{profile.usualPlace}</Chip>
        ) : null}
      </div>

      {profile.bio ? (
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {profile.bio}
        </p>
      ) : null}
    </>
  );
}

/**
 * Indica si un perfil ya es seguido.
 * Se construye para compartir logica entre resultado y perfil publico.
 * Lo usa PlayerSearchScreen.
 * Sirve para mantener botones de follow consistentes.
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
