import { BellRing, Smartphone } from "lucide-react";
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
    <section className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-lime text-background-primary">
          <Smartphone aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Acceso rapido
          </p>
          <h2 className="mt-1 text-xl font-black">
            No te pierdas ningun partido ni evento
          </h2>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        Agrega Padelito a tu pantalla principal para entrar con un toque y
        recibir avisos importantes sobre solicitudes, invitaciones, recordatorios
        y partidos compatibles con tu categoria.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button icon={BellRing} onClick={handleQuickAccessClick} variant="primary">
          Agregar acceso rapido
        </Button>
        <Button onClick={onDismiss} variant="ghost">
          Ahora no
        </Button>
      </div>
    </section>
  );
}
