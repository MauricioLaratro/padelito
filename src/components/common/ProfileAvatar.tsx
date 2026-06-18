import { Building2, UserRound } from "lucide-react";
import type { ProfileType } from "../../domain/enums/profileEnums";

type ProfileAvatarSize = "sm" | "md" | "lg" | "xl";

interface ProfileAvatarProps {
  avatarUrl?: string;
  className?: string;
  displayName: string;
  profileType?: ProfileType;
  size?: ProfileAvatarSize;
}

const sizeClassNames: Record<ProfileAvatarSize, string> = {
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-14 text-xl",
  xl: "size-24 text-3xl",
};

const iconSizeByAvatarSize: Record<ProfileAvatarSize, number> = {
  sm: 17,
  md: 19,
  lg: 22,
  xl: 34,
};

/**
 * Avatar circular reutilizable.
 * Se construye para que foto real e inicial compartan formato.
 * Lo usan perfil, feed, busqueda y formularios.
 * Sirve para mantener encuadre consistente en circulos pequenos.
 */
export function ProfileAvatar({
  avatarUrl,
  className = "",
  displayName,
  profileType = "player",
  size = "md",
}: ProfileAvatarProps) {
  const FallbackIcon = profileType === "organization" ? Building2 : UserRound;
  const fallbackInitial = displayName.trim().slice(0, 1).toUpperCase();

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-border-subtle bg-surface-secondary font-black text-accent-lime ${sizeClassNames[size]} ${className}`}
    >
      {avatarUrl ? (
        <img
          alt={displayName}
          className="h-full w-full object-cover"
          draggable={false}
          src={avatarUrl}
        />
      ) : fallbackInitial ? (
        fallbackInitial
      ) : (
        <FallbackIcon aria-hidden="true" size={iconSizeByAvatarSize[size]} />
      )}
    </span>
  );
}
