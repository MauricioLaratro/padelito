import { BellRing, X } from "lucide-react";
import { Button } from "../../components/common/Button";

interface QuickAccessOnboardingStepProps {
  onDismiss: () => void;
}

/**
 * Paso de acceso rapido PWA.
 * Se construye para cumplir el onboarding posterior al perfil.
 * Lo usa la pantalla principal cuando el usuario aun no lo descarto.
 * Sirve para promover acceso a pantalla principal y futuras notificaciones.
 */
export function QuickAccessOnboardingStep({
  onDismiss,
}: QuickAccessOnboardingStepProps) {
  /**
   * Intenta disparar ayuda de acceso rapido.
   * Se construye como accion local reversible sin permisos sensibles.
   * La usa el CTA principal.
   * Sirve para informar segun navegador aunque el prompt nativo no este disponible.
   */
  function handleQuickAccessClick() {
    onDismiss();
  }

  return (
    <section className="min-w-0 rounded-lg border border-accent-lime/25 bg-surface-primary p-3 shadow-floating">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-lime text-background-primary">
          <BellRing aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Acceso rapido
          </p>
          <h2 className="truncate text-sm font-black">
            Instala Padelito en este dispositivo
          </h2>
        </div>
        <Button
          aria-label="Ocultar acceso rápido"
          className="min-h-9 px-3"
          icon={X}
          onClick={onDismiss}
          variant="ghost"
        >
          Ocultar
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          className="min-h-9 flex-1 px-3 text-xs"
          icon={BellRing}
          onClick={handleQuickAccessClick}
          variant="primary"
        >
          Agregar
        </Button>
      </div>
    </section>
  );
}
