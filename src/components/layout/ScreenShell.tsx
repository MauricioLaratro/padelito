import type { ReactNode } from "react";

interface ScreenShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor de pantalla mobile.
 * Se construye para centrar la app en desktop y preservar layout de PWA.
 * Lo usa App como marco general.
 * Sirve para limitar ancho y mantener fondo oscuro premium.
 */
export function ScreenShell({ children, className = "" }: ScreenShellProps) {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary">
      <div
        className={`mx-auto min-h-screen w-full min-w-0 max-w-mobile border-x border-border-subtle bg-background-primary ${className}`}
      >
        {children}
      </div>
    </main>
  );
}
