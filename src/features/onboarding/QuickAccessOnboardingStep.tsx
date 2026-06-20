import {
  BellRing,
  Check,
  PlusSquare,
  Share,
  Smartphone,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/common/Button";

interface QuickAccessOnboardingStepProps {
  onDismiss: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Paso de acceso rapido PWA.
 * Se construye para ser discreto y accionable segun el navegador.
 * Lo usa la pantalla principal cuando el usuario aun no lo descarto.
 * Sirve para instalar la app o guiar el agregado manual en iPhone.
 */
export function QuickAccessOnboardingStep({
  onDismiss,
}: QuickAccessOnboardingStepProps) {
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isRunningAsInstalledApp);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isIosDevice = useMemo(isIosBrowser, []);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      onDismiss();
    }

    const displayModeMediaQuery = window.matchMedia("(display-mode: standalone)");
    function handleDisplayModeChange() {
      setIsInstalled(isRunningAsInstalledApp());
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeMediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeMediaQuery.removeEventListener(
        "change",
        handleDisplayModeChange,
      );
    };
  }, [onDismiss]);

  if (isInstalled) {
    return null;
  }

  /**
   * Ejecuta la accion principal de instalacion.
   * Se construye para usar prompt nativo cuando existe y guia manual en iOS.
   * La usa el CTA principal.
   * Sirve para que el boton no sea un gesto muerto.
   */
  async function handleQuickAccessClick() {
    if (isRunningAsInstalledApp()) {
      onDismiss();
      return;
    }

    if (installPromptEvent) {
      await installPromptEvent.prompt();
      const installChoice = await installPromptEvent.userChoice;
      setInstallPromptEvent(null);

      if (installChoice.outcome === "accepted") {
        onDismiss();
        return;
      }

      setStatusMessage("Podés agregarla más tarde desde Perfil.");
      return;
    }

    if (isIosDevice) {
      setIsGuideOpen(true);
      return;
    }

    setStatusMessage("Usá el menú del navegador y elegí instalar app.");
  }

  return (
    <>
      <section className="min-w-0 rounded-lg border border-accent-lime/20 bg-surface-primary p-3 shadow-floating">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-lime text-background-primary">
            <BellRing aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Acceso rápido
            </p>
            <h2 className="truncate text-sm font-black">Agregar a inicio</h2>
          </div>
          <button
            aria-label="Ocultar acceso rápido"
            className="grid size-9 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
            onClick={onDismiss}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
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
        {statusMessage ? (
          <p className="mt-2 text-xs font-bold text-text-secondary">
            {statusMessage}
          </p>
        ) : null}
      </section>

      {isGuideOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 px-4 pb-4">
          <section className="w-full max-w-mobile rounded-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
                  iPhone
                </p>
                <h2 className="mt-1 text-xl font-black">Agregar a inicio</h2>
              </div>
              <button
                aria-label="Cerrar guía"
                className="grid size-10 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
                onClick={() => setIsGuideOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <InstallGuideStep
                icon={Share}
                label="1"
                title="Tocá compartir"
              />
              <InstallGuideStep
                icon={PlusSquare}
                label="2"
                title="Elegí Agregar a inicio"
              />
              <InstallGuideStep
                icon={Smartphone}
                label="3"
                title="Confirmá Agregar"
              />
            </div>

            <Button
              className="mt-4 w-full"
              icon={Check}
              onClick={() => {
                setIsGuideOpen(false);
                onDismiss();
              }}
              variant="primary"
            >
              Listo
            </Button>
          </section>
        </div>
      ) : null}
    </>
  );
}

interface InstallGuideStepProps {
  icon: LucideIcon;
  label: string;
  title: string;
}

/**
 * Paso visual de instalacion.
 * Se construye para guiar iPhone sin textos largos.
 * Lo usa QuickAccessOnboardingStep.
 * Sirve para que el usuario entienda el gesto manual.
 */
function InstallGuideStep({ icon: StepIcon, label, title }: InstallGuideStepProps) {
  return (
    <article className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-primary p-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background-primary text-accent-lime">
        <StepIcon aria-hidden="true" size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
          Paso {label}
        </p>
        <h3 className="truncate text-sm font-black">{title}</h3>
      </div>
    </article>
  );
}

/**
 * Detecta navegacion iOS compatible con agregado manual.
 * Se construye para decidir entre prompt nativo y guia.
 * Lo usa QuickAccessOnboardingStep.
 * Sirve para evitar mostrar instrucciones equivocadas en Android/desktop.
 */
function isIosBrowser() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Detecta si la PWA ya se abrio instalada.
 * Se construye para ocultar el CTA cuando ya no aporta valor.
 * Lo usa QuickAccessOnboardingStep.
 * Sirve para evitar repetir la invitacion al inicio.
 */
function isRunningAsInstalledApp() {
  const standaloneNavigator = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(standaloneNavigator.standalone)
  );
}
