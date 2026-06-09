import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: ButtonVariant;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-lime text-background-primary hover:brightness-110 focus:ring-accent-lime",
  secondary:
    "border border-border-subtle bg-surface-secondary text-text-primary hover:border-accent-lime/40 focus:ring-accent-lime",
  danger:
    "bg-feedback-danger/15 text-feedback-danger hover:bg-feedback-danger/20 focus:ring-feedback-danger",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary focus:ring-accent-lime",
};

/**
 * Boton reutilizable de la aplicacion.
 * Se construye para unificar acciones, iconos y estados de foco.
 * Lo usan pantallas, cards y formularios.
 * Sirve para mantener una UI consistente y mobile-first.
 */
export function Button({
  children,
  className = "",
  icon: ButtonIcon,
  type = "button",
  variant = "secondary",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary disabled:cursor-not-allowed disabled:opacity-50 ${variantClassNames[variant]} ${className}`}
      type={type}
      {...buttonProps}
    >
      {ButtonIcon ? <ButtonIcon aria-hidden="true" size={17} /> : null}
      <span>{children}</span>
    </button>
  );
}
