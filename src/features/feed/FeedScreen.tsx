import { Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PostCard } from "../../components/cards/PostCard";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { EmptyState } from "../../components/common/EmptyState";
import { PullToRefresh } from "../../components/common/PullToRefresh";
import { FormField } from "../../components/forms/FormField";
import { postTypeOptions } from "../../constants/postOptions";
import {
  playerLevelOptions,
  playerPositionOptions,
  playStyleOptions,
} from "../../constants/profileOptions";
import type { PostType } from "../../domain/enums/postEnums";
import type {
  PlayerLevel,
  PlayerPosition,
  PlayStyle,
} from "../../domain/enums/profileEnums";
import type { Post } from "../../domain/models/postModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";

type FeedDateFilterIdentifier = "all" | "today" | "week";

interface FeedScreenProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onEventInteractionToggle: (
    postId: string,
    interactionType: "interested" | "attending",
  ) => void;
  onFollowToggle: (profileId: string) => void;
  onInvitationStart: (profileId: string) => void;
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestCreate: (postId: string) => void;
  onFeedRefresh: () => void;
  onPostCancel: (postId: string) => void;
  onPostCreateStart: () => void;
  onProfileOpen: (profileId: string) => void;
  visiblePosts: Post[];
}

/**
 * Pantalla de feed.
 * Se construye para mostrar Comunidad y Siguiendo con filtros MVP.
 * La usa App dentro del shell principal.
 * Sirve para descubrir jugadores, partidos y eventos.
 */
export function FeedScreen({
  currentProfileId,
  database,
  onEventInteractionToggle,
  onFollowToggle,
  onInvitationStart,
  onJoinRequestCancel,
  onJoinRequestCreate,
  onFeedRefresh,
  onPostCancel,
  onPostCreateStart,
  onProfileOpen,
  visiblePosts,
}: FeedScreenProps) {
  const [selectedPostType, setSelectedPostType] = useState<PostType | "all">(
    "all",
  );
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<FeedDateFilterIdentifier>("all");
  const [selectedPlayerLevel, setSelectedPlayerLevel] = useState<
    PlayerLevel | "all"
  >("all");
  const [selectedPlayerPosition, setSelectedPlayerPosition] = useState<
    PlayerPosition | "all"
  >("all");
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<PlayStyle | "all">(
    "all",
  );
  const [placeQuery, setPlaceQuery] = useState("");
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const hasActiveFilters =
    selectedPostType !== "all" ||
    selectedDateFilter !== "all" ||
    selectedPlayerLevel !== "all" ||
    selectedPlayerPosition !== "all" ||
    selectedPlayStyle !== "all" ||
    Boolean(placeQuery.trim());

  const filteredPosts = useMemo(() => {
    return visiblePosts.filter((post) => {
      const matchesPostType =
        selectedPostType === "all" || post.postType === selectedPostType;
      const matchesDate = doesPostMatchDateFilter(
        post.scheduledDate,
        selectedDateFilter,
      );
      const matchesPlace =
        !placeQuery ||
        post.placeText.toLowerCase().includes(placeQuery.toLowerCase());
      const matchesPlayerLevel =
        selectedPlayerLevel === "all" ||
        getPostPlayerLevel(post) === selectedPlayerLevel;
      const matchesPlayerPosition =
        selectedPlayerPosition === "all" ||
        getPostPlayerPosition(post) === selectedPlayerPosition;
      const matchesPlayStyle =
        selectedPlayStyle === "all" ||
        getPostPlayStyle(post) === selectedPlayStyle;

      return (
        matchesPostType &&
        matchesDate &&
        matchesPlace &&
        matchesPlayerLevel &&
        matchesPlayerPosition &&
        matchesPlayStyle
      );
    });
  }, [
    placeQuery,
    selectedDateFilter,
    selectedPlayerLevel,
    selectedPlayerPosition,
    selectedPlayStyle,
    selectedPostType,
    visiblePosts,
  ]);

  /**
   * Limpia filtros del feed.
   * Se construye para que el usuario pueda volver rapido al feed completo.
   * Lo usa el boton de filtros.
   * Sirve para evitar estados vacios confusos.
   */
  function handleFiltersReset() {
    setSelectedPostType("all");
    setSelectedDateFilter("all");
    setSelectedPlayerLevel("all");
    setSelectedPlayerPosition("all");
    setSelectedPlayStyle("all");
    setPlaceQuery("");
  }

  return (
    <PullToRefresh
      className="grid min-w-0 gap-3 px-4 pb-28 pt-4"
      onRefresh={onFeedRefresh}
    >
      <div className="min-w-0 rounded-lg border border-border-subtle bg-surface-primary p-3">
        <div className="flex items-center gap-2">
          <Button
            className="min-h-8 px-3 text-xs"
            icon={Filter}
            onClick={() =>
              setAreFiltersOpen((currentAreFiltersOpen) => !currentAreFiltersOpen)
            }
            variant={hasActiveFilters ? "primary" : "secondary"}
          >
            Filtros
          </Button>
          <Chip>{filteredPosts.length} publicaciones</Chip>
          {hasActiveFilters ? (
            <Button
              className="ml-auto min-h-8 px-3 text-xs"
              icon={X}
              onClick={handleFiltersReset}
              variant="ghost"
            >
              Limpiar
            </Button>
          ) : null}
        </div>

        {areFiltersOpen ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <FormField
              fieldType="select"
              label="Tipo"
              onChange={(changeEvent) =>
                setSelectedPostType(changeEvent.target.value as PostType | "all")
              }
              value={selectedPostType}
            >
              <option value="all">Todos</option>
              {postTypeOptions.map((postTypeOption) => (
                <option key={postTypeOption.value} value={postTypeOption.value}>
                  {postTypeOption.label}
                </option>
              ))}
            </FormField>
            <FormField
              fieldType="select"
              label="Fecha"
              onChange={(changeEvent) =>
                setSelectedDateFilter(
                  changeEvent.target.value as FeedDateFilterIdentifier,
                )
              }
              value={selectedDateFilter}
            >
              <option value="all">Todas</option>
              <option value="today">Hoy</option>
              <option value="week">7 dias</option>
            </FormField>
            <FormField
              label="Lugar"
              onChange={(changeEvent) => setPlaceQuery(changeEvent.target.value)}
              placeholder="Club / zona"
              value={placeQuery}
            />
            <FormField
              fieldType="select"
              label="Categoria"
              onChange={(changeEvent) =>
                setSelectedPlayerLevel(
                  changeEvent.target.value as PlayerLevel | "all",
                )
              }
              value={selectedPlayerLevel}
            >
              <option value="all">Todas</option>
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
                setSelectedPlayerPosition(
                  changeEvent.target.value as PlayerPosition | "all",
                )
              }
              value={selectedPlayerPosition}
            >
              <option value="all">Todas</option>
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
                setSelectedPlayStyle(changeEvent.target.value as PlayStyle | "all")
              }
              value={selectedPlayStyle}
            >
              <option value="all">Todos</option>
              {playStyleOptions.map((playStyleOption) => (
                <option key={playStyleOption.value} value={playStyleOption.value}>
                  {playStyleOption.label}
                </option>
              ))}
            </FormField>
          </div>
        ) : null}
      </div>

      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <PostCard
            currentProfileId={currentProfileId}
            followRelations={database.follows}
            joinRequests={database.matchJoinRequests}
            key={post.postId}
            onEventInteractionToggle={onEventInteractionToggle}
            onFollowToggle={onFollowToggle}
            onInvitationStart={onInvitationStart}
            onJoinRequestCancel={onJoinRequestCancel}
            onJoinRequestCreate={onJoinRequestCreate}
            onPostCancel={onPostCancel}
            post={post}
            postInteractions={database.postInteractions}
            onProfileOpen={onProfileOpen}
            profiles={database.profiles}
          />
        ))
      ) : (
        <EmptyState
          actionLabel="Crear publicacion"
          description="No hay resultados para estos filtros. Publica una oportunidad para mover la comunidad."
          icon={Search}
          onAction={onPostCreateStart}
          title="Sin publicaciones"
        />
      )}
    </PullToRefresh>
  );
}

/**
 * Indica si una publicacion cae dentro del filtro temporal.
 * Se construye para centralizar comparaciones de fecha local.
 * Lo usa FeedScreen al filtrar resultados.
 * Sirve para encontrar oportunidades inmediatas sin backend adicional.
 */
function doesPostMatchDateFilter(
  scheduledDate: string,
  dateFilter: FeedDateFilterIdentifier,
) {
  if (dateFilter === "all") {
    return true;
  }

  const todayDateKey = createLocalDateKey(new Date());

  if (dateFilter === "today") {
    return scheduledDate === todayDateKey;
  }

  const daysUntilPost = getDaysBetweenDateKeys(todayDateKey, scheduledDate);

  return daysUntilPost >= 0 && daysUntilPost <= 7;
}

/**
 * Obtiene la categoria asociada a una publicacion de jugador.
 * Se construye para que el feed pueda filtrar partidos y disponibilidades juntos.
 * Lo usa FeedScreen.
 * Sirve para ignorar eventos cuando se filtra por categoria.
 */
function getPostPlayerLevel(post: Post): PlayerLevel | null {
  if (post.postType === "looking_for_player") {
    return post.desiredLevel;
  }

  if (post.postType === "available_to_play") {
    return post.availableLevel;
  }

  return null;
}

/**
 * Obtiene la posicion asociada a una publicacion de jugador.
 * Se construye para compartir filtro entre Busco jugador y Estoy disponible.
 * Lo usa FeedScreen.
 * Sirve para encontrar perfiles compatibles con el partido.
 */
function getPostPlayerPosition(post: Post): PlayerPosition | null {
  if (post.postType === "looking_for_player") {
    return post.desiredPosition;
  }

  if (post.postType === "available_to_play") {
    return post.availablePosition;
  }

  return null;
}

/**
 * Obtiene el estilo de juego de una publicacion de jugador.
 * Se construye para aplicar un filtro unico sobre dos tipos de post.
 * Lo usa FeedScreen.
 * Sirve para separar partidos competitivos y recreativos.
 */
function getPostPlayStyle(post: Post): PlayStyle | null {
  if (post.postType === "looking_for_player") {
    return post.desiredPlayStyle;
  }

  if (post.postType === "available_to_play") {
    return post.availablePlayStyle;
  }

  return null;
}

/**
 * Crea una clave YYYY-MM-DD con calendario local.
 * Se construye para evitar corrimientos UTC al comparar filtros de hoy.
 * Lo usa doesPostMatchDateFilter.
 * Sirve para que el feed respete el dia del usuario.
 */
function createLocalDateKey(dateValue: Date) {
  const year = dateValue.getFullYear();
  const month = `${dateValue.getMonth() + 1}`.padStart(2, "0");
  const day = `${dateValue.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Calcula dias entre dos claves YYYY-MM-DD.
 * Se construye para resolver el filtro de proximos 7 dias sin librerias.
 * Lo usa doesPostMatchDateFilter.
 * Sirve para mantener el cliente liviano.
 */
function getDaysBetweenDateKeys(startDateKey: string, endDateKey: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const startDate = createDateFromDateKey(startDateKey);
  const endDate = createDateFromDateKey(endDateKey);

  return Math.floor(
    (endDate.getTime() - startDate.getTime()) / millisecondsPerDay,
  );
}

/**
 * Convierte YYYY-MM-DD a Date local.
 * Se construye para no depender del parseo UTC de Date.
 * Lo usa getDaysBetweenDateKeys.
 * Sirve para comparar fechas del formulario con calendario local.
 */
function createDateFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}
