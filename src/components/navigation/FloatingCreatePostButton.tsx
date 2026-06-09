import type { LucideIcon } from "lucide-react";

interface FloatingCreatePostButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

/**
 * Boton flotante para iniciar una publicacion.
 * Se construye para reservar el patron principal de creacion del MVP.
 * Lo usa App y luego lo usaran las pantallas de feed.
 * Sirve para abrir el selector de tipo de publicacion en etapas posteriores.
 */
export function FloatingCreatePostButton({
  icon: CreatePostIcon,
  label,
  onClick,
}: FloatingCreatePostButtonProps) {
  return (
    <button
      aria-label={label}
      className="fixed bottom-5 left-1/2 z-20 ml-40 flex size-14 -translate-x-full items-center justify-center rounded-full bg-accent-lime text-background-primary shadow-floating transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-background-primary"
      onClick={onClick}
      title={label}
      type="button"
    >
      <CreatePostIcon aria-hidden="true" size={28} strokeWidth={3} />
    </button>
  );
}
