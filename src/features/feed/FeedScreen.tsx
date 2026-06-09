import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
  onJoinRequestCreate: (postId: string) => void;
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
  onJoinRequestCreate,
  onPostCreateStart,
  visiblePosts,
}: FeedScreenProps) {
  const [selectedPostType, setSelectedPostType] = useState<PostType | "all">(
    "all",
  );
  const [placeQuery, setPlaceQuery] = useState("");

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

  return (
    <section className="grid gap-3 px-4 pb-28 pt-4">
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
