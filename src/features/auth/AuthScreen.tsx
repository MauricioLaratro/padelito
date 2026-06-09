import { LogIn, Smartphone } from "lucide-react";
import { Button } from "../../components/common/Button";
import { ScreenShell } from "../../components/layout/ScreenShell";

interface AuthScreenProps {
  onDemoSignIn: () => void;
}

/**
 * Pantalla de acceso inicial.
 * Se construye para validar auth simple sin credenciales externas.
 * La usa App cuando no hay perfil de sesion.
 * Sirve para entrar al MVP con un perfil local demo.
 */
export function AuthScreen({ onDemoSignIn }: AuthScreenProps) {
  return (
    <ScreenShell className="grid place-items-center px-5">
      <section className="w-full rounded-lg border border-border-subtle bg-surface-primary p-5 shadow-floating">
        <img
          alt="Padelito"
          className="mb-8 h-auto w-52"
          src="/logo-padelito.svg"
        />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-lime">
          MVP local
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight">
          Encontrar partido ya no depende de mil chats.
        </h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">
          Proba feeds, publicaciones, solicitudes, invitaciones y notificaciones
          con datos locales. Supabase queda preparado para la siguiente etapa.
        </p>
        <div className="mt-6 grid gap-3">
          <Button icon={LogIn} onClick={onDemoSignIn} variant="primary">
            Entrar con demo
          </Button>
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3 text-sm text-text-secondary">
            <Smartphone aria-hidden="true" className="text-accent-lime" size={18} />
            <span>PWA mobile-first lista para acceso rapido.</span>
          </div>
        </div>
      </section>
    </ScreenShell>
  );
}
