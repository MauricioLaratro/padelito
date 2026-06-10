import { Building2, UserRound } from "lucide-react";
import type { Profile } from "../../domain/models/profileModels";
import { Button } from "../common/Button";

interface PostAuthorRowProps {
  authorProfile: Profile;
  isFollowed: boolean;
  isOwnAuthor: boolean;
  onFollowToggle: (profileId: string) => void;
  onProfileOpen?: (profileId: string) => void;
}

/**
 * Fila compacta de autor.
 * Se construye para reutilizar identidad y seguimiento en todas las cards.
 * La usan las cards de publicaciones.
 * Sirve para conectar contenido con perfiles sin ocupar espacio vertical.
 */
export function PostAuthorRow({
  authorProfile,
  isFollowed,
  isOwnAuthor,
  onFollowToggle,
  onProfileOpen,
}: PostAuthorRowProps) {
  const AuthorIcon =
    authorProfile.profileType === "organization" ? Building2 : UserRound;

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        className="flex min-w-0 items-center gap-2 text-left"
        onClick={() => onProfileOpen?.(authorProfile.profileId)}
        type="button"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-accent-lime">
          <AuthorIcon aria-hidden="true" size={17} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black">
            {authorProfile.displayName}
          </p>
          <p className="text-xs font-semibold text-text-secondary">
            {authorProfile.profileType === "organization"
              ? "Organizacion"
              : "Jugador"}
          </p>
        </div>
      </button>

      {!isOwnAuthor ? (
        <Button
          className="min-h-8 px-3 text-xs"
          onClick={() => onFollowToggle(authorProfile.profileId)}
          variant={isFollowed ? "ghost" : "secondary"}
        >
          {isFollowed ? "Siguiendo" : "Seguir"}
        </Button>
      ) : null}
    </div>
  );
}
