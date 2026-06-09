import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  actionLabel?: string;
  description: string;
  icon: LucideIcon;
  onAction?: () => void;
  title: string;
}

/**
 * Estado vacio reutilizable.
 * Se construye para que pantallas sin datos no queden mudas.
 * Lo usan feed, perfil y notificaciones.
 * Sirve para guiar una siguiente accion sin texto excesivo.
 */
export function EmptyState({
  actionLabel,
  description,
  icon: EmptyStateIcon,
  onAction,
  title,
}: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-surface-primary p-5 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-secondary text-accent-lime">
        <EmptyStateIcon aria-hidden="true" size={22} />
      </div>
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          className="mt-4 rounded-full bg-accent-lime px-4 py-2 text-sm font-black text-background-primary"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
