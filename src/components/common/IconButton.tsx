import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
}

/**
 * Boton circular de icono.
 * Se construye para minimizar texto visible en navegacion compacta.
 * Lo usan headers, tabs auxiliares y acciones rapidas.
 * Sirve para conservar espacio vertical en mobile.
 */
export function IconButton({
  className = "",
  icon: Icon,
  isActive = false,
  label,
  type = "button",
  ...buttonProps
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`grid size-11 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary transition hover:border-accent-lime/40 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-background-primary ${
        isActive ? "text-accent-lime" : ""
      } ${className}`}
      title={label}
      type={type}
      {...buttonProps}
    >
      <Icon aria-hidden="true" size={19} />
    </button>
  );
}
