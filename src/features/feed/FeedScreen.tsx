import { Filter, RefreshCw, Search } from "lucide-react";
import type { TouchEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { PostCard } from "../../components/cards/PostCard";
import { Chip } from "../../components/common/Chip";
import { EmptyState } from "../../components/common/EmptyState";
import { FormField } from "../../components/forms/FormField";
import { postTypeOptions } from "../../constants/postOptions";
import type { PostType } from "../../domain/enums/postEnums";
import type { Post } from "../../domain/models/postModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";

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
  onPostCreateStart: () => void;
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
  onPostCreateStart,
  visiblePosts,
}: FeedScreenProps) {
  const [selectedPostType, setSelectedPostType] = useState<PostType | "all">(
    "all",
  );
  const [placeQuery, setPlaceQuery] = useState("");
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  const filteredPosts = useMemo(() => {
    return visiblePosts.filter((post) => {
      const matchesPostType =
        selectedPostType === "all" || post.postType === selectedPostType;
      const matchesPlace =
        !placeQuery ||
        post.placeText.toLowerCase().includes(placeQuery.toLowerCase());

      return matchesPostType && matchesPlace;
    });
  }, [placeQuery, selectedPostType, visiblePosts]);

  /**
   * Inicia seguimiento del gesto de refresco.
   * Se construye para imitar el pull-to-refresh mobile de feeds sociales.
   * Lo usa el contenedor del feed.
   * Sirve para preparar refetch de publicaciones nuevas.
   */
  function handleFeedTouchStart(touchEvent: TouchEvent<HTMLElement>) {
    if (window.scrollY > 0 || isRefreshing) {
      pullStartY.current = null;
      return;
    }

    pullStartY.current = touchEvent.touches[0]?.clientY ?? null;
  }

  /**
   * Mide distancia del gesto de refresco.
   * Se construye para mostrar feedback solo cuando el usuario arrastra desde el tope.
   * Lo usa el contenedor del feed.
   * Sirve para evitar refrescos accidentales durante scroll normal.
   */
  function handleFeedTouchMove(touchEvent: TouchEvent<HTMLElement>) {
    if (pullStartY.current === null || window.scrollY > 0) {
      return;
    }

    const currentTouchY = touchEvent.touches[0]?.clientY ?? pullStartY.current;
    const nextPullDistance = Math.max(0, currentTouchY - pullStartY.current);
    setPullDistance(Math.min(nextPullDistance, 96));
  }

  /**
   * Ejecuta refresco si el gesto supera el umbral.
   * Se construye para centralizar la accion que luego usara Supabase.
   * Lo usa el contenedor del feed.
   * Sirve para actualizar publicaciones sin boton visible.
   */
  function handleFeedTouchEnd() {
    const shouldRefreshFeed = pullDistance >= 72;
    pullStartY.current = null;
    setPullDistance(0);

    if (!shouldRefreshFeed || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    onFeedRefresh();
    window.setTimeout(() => setIsRefreshing(false), 650);
  }

  return (
    <section
      className="grid gap-3 px-4 pb-28 pt-4"
      onTouchCancel={handleFeedTouchEnd}
      onTouchEnd={handleFeedTouchEnd}
      onTouchMove={handleFeedTouchMove}
      onTouchStart={handleFeedTouchStart}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          aria-live="polite"
          className="grid place-items-center overflow-hidden transition-[height]"
          style={{ height: isRefreshing ? 44 : Math.max(24, pullDistance / 1.7) }}
        >
          <span className="grid size-9 place-items-center rounded-full bg-surface-secondary text-accent-lime shadow-floating">
            <RefreshCw
              aria-hidden="true"
              className={isRefreshing ? "animate-spin" : ""}
              size={18}
              style={{
                transform: isRefreshing
                  ? undefined
                  : `rotate(${pullDistance * 2}deg)`,
              }}
            />
          </span>
        </div>
      )}

      <div className="rounded-lg border border-border-subtle bg-surface-primary p-3">
        <div className="mb-3 flex items-center gap-2">
          <Chip icon={Filter} tone="lime">
            Filtros
          </Chip>
          <Chip>{filteredPosts.length} publicaciones</Chip>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-[1fr_1.2fr]">
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
            label="Lugar"
            onChange={(changeEvent) => setPlaceQuery(changeEvent.target.value)}
            placeholder="Club / zona"
            value={placeQuery}
          />
        </div>
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
            post={post}
            postInteractions={database.postInteractions}
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
    </section>
  );
}
