import { LogIn, Mail, Smartphone } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import { ScreenShell } from "../../components/layout/ScreenShell";

interface AuthScreenProps {
  authErrorMessage?: string | null;
  authStatusMessage?: string | null;
  isEmailAuthEnabled: boolean;
  isEmailAuthLoading: boolean;
  onDemoSignIn: () => void;
  onEmailSignInRequest: (email: string) => Promise<void>;
}

/**
 * Pantalla de acceso inicial.
 * Se construye para ofrecer auth real con fallback demo local.
 * La usa App cuando no hay perfil de sesion.
 * Sirve para entrar al MVP con Supabase o con datos locales.
 */
export function AuthScreen({
  authErrorMessage,
  authStatusMessage,
  isEmailAuthEnabled,
  isEmailAuthLoading,
  onDemoSignIn,
  onEmailSignInRequest,
}: AuthScreenProps) {
  const [email, setEmail] = useState("");

  /**
   * Solicita enlace magico de Supabase.
   * Se construye para evitar passwords en el MVP.
   * Lo usa el formulario de acceso.
   * Sirve para iniciar sesion real con una clave publica de cliente.
   */
  async function handleEmailSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    if (!email.trim()) {
      return;
    }

    await onEmailSignInRequest(email.trim());
  }

  return (
    <ScreenShell className="grid place-items-center px-5">
      <section className="w-full rounded-lg border border-border-subtle bg-surface-primary p-5 shadow-floating">
        <img
          alt="Padelito"
          className="mb-8 h-auto w-52"
          src="/logo-padelito.svg"
        />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-lime">
          Padelito
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight">
          Encontrar partido ya no depende de mil chats.
        </h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">
          Entra con email para usar Supabase o usa el demo local para probar el
          MVP sin depender del backend.
        </p>

        {isEmailAuthEnabled ? (
          <form className="mt-6 grid gap-3" onSubmit={handleEmailSubmit}>
            <FormField
              label="Email"
              onChange={(changeEvent) => setEmail(changeEvent.target.value)}
              placeholder="tu@email.com"
              required
              type="email"
              value={email}
            />
            <Button
              disabled={isEmailAuthLoading}
              icon={Mail}
              type="submit"
              variant="primary"
            >
              {isEmailAuthLoading ? "Enviando" : "Enviar enlace"}
            </Button>
          </form>
        ) : null}

        {authStatusMessage ? (
          <p className="mt-3 rounded-lg border border-feedback-success/40 bg-feedback-success/10 p-3 text-sm leading-6 text-feedback-success">
            {authStatusMessage}
          </p>
        ) : null}

        {authErrorMessage ? (
          <p className="mt-3 rounded-lg border border-feedback-danger/40 bg-feedback-danger/10 p-3 text-sm leading-6 text-feedback-danger">
            {authErrorMessage}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3">
          <Button icon={LogIn} onClick={onDemoSignIn} variant="secondary">
            Entrar en modo demo
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
