import { X } from "lucide-react";

interface AvatarPreviewOverlayProps {
  avatarUrl: string;
  displayName: string;
  onClose: () => void;
}

/**
 * Overlay de foto de perfil ampliada.
 * Se construye para ver avatares en grande sin salir de la pantalla actual.
 * Lo usan perfiles propios y publicos.
 * Sirve para mantener el gesto de avatar consistente en toda la app.
 */
export function AvatarPreviewOverlay({
  avatarUrl,
  displayName,
  onClose,
}: AvatarPreviewOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-6">
      <button
        aria-label="Cerrar foto"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" size={18} />
      </button>
      <img
        alt={displayName}
        className="aspect-square w-full max-w-[320px] rounded-full object-cover shadow-floating"
        src={avatarUrl}
      />
    </div>
  );
}
