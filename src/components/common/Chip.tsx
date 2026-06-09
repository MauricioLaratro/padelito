import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ChipProps {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "lime" | "success" | "danger";
}

const toneClassNames: Record<NonNullable<ChipProps["tone"]>, string> = {
  default: "bg-surface-secondary text-text-primary",
  lime: "bg-accent-lime/10 text-accent-lime",
  success: "bg-feedback-success/12 text-feedback-success",
  danger: "bg-feedback-danger/12 text-feedback-danger",
};

/**
 * Chip compacto para datos estructurados.
 * Se construye para que las cards se lean rapido con poco texto.
 * Lo usan cards, perfil, filtros y actividad.
 * Sirve para representar categoria, lugar, posicion y estado.
 */
export function Chip({ children, icon: ChipIcon, tone = "default" }: ChipProps) {
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${toneClassNames[tone]}`}
    >
      {ChipIcon ? <ChipIcon aria-hidden="true" size={14} /> : null}
      {children}
    </span>
  );
}
