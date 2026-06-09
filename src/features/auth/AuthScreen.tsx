import { LogIn, Mail, UserPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import { ScreenShell } from "../../components/layout/ScreenShell";

type AuthModeIdentifier = "signIn" | "signUp";
type AuthLoadingActionIdentifier =
  | "magicLink"
  | "passwordSignIn"
  | "passwordSignUp";

interface AuthScreenProps {
  authErrorMessage?: string | null;
  authLoadingAction?: AuthLoadingActionIdentifier | null;
  authStatusMessage?: string | null;
  isAuthSessionChecking: boolean;
  isEmailAuthEnabled: boolean;
  magicLinkCooldownSeconds: number;
  onDemoSignIn: () => void;
  onEmailSignInRequest: (email: string) => Promise<void>;
  onPasswordSignInRequest: (email: string, password: string) => Promise<void>;
  onPasswordSignUpRequest: (email: string, password: string) => Promise<void>;
}

/**
 * Pantalla de acceso inicial.
 * Se construye para ofrecer auth real cotidiana con fallback demo local.
 * La usa App cuando no hay perfil de sesion.
 * Sirve para entrar con contrasena, pedir enlace de email o probar el MVP.
 */
export function AuthScreen({
  authErrorMessage,
  authLoadingAction,
  authStatusMessage,
  isAuthSessionChecking,
  isEmailAuthEnabled,
  magicLinkCooldownSeconds,
  onDemoSignIn,
  onEmailSignInRequest,
  onPasswordSignInRequest,
  onPasswordSignUpRequest,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthModeIdentifier>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isPasswordSignInLoading = authLoadingAction === "passwordSignIn";
  const isPasswordSignUpLoading = authLoadingAction === "passwordSignUp";
  const isMagicLinkLoading = authLoadingAction === "magicLink";
  const isAnyAuthLoading = Boolean(authLoadingAction) || isAuthSessionChecking;
  const isMagicLinkCoolingDown = magicLinkCooldownSeconds > 0;

  /**
   * Ejecuta login o registro con contrasena.
   * Se construye para que el formulario principal sea el acceso diario.
   * Lo usa el formulario de acceso.
   * Sirve para crear o recuperar una sesion persistente.
   */
  async function handlePasswordSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    if (!email.trim() || !password) {
      return;
    }

    if (authMode === "signUp") {
      await onPasswordSignUpRequest(email.trim(), password);
      return;
    }

    await onPasswordSignInRequest(email.trim(), password);
  }

  /**
   * Solicita enlace magico usando el email escrito.
   * Se construye como alternativa cuando el usuario no quiere password.
   * Lo usa el boton secundario del formulario.
   * Sirve para primer acceso o recuperacion sin saturar el envio de emails.
   */
  async function handleMagicLinkRequest() {
    if (!email.trim() || isMagicLinkCoolingDown) {
      return;
    }

    await onEmailSignInRequest(email.trim());
  }

  const passwordSubmitText =
    authMode === "signUp"
      ? isPasswordSignUpLoading
        ? "Creando"
        : "Crear cuenta"
      : isPasswordSignInLoading
        ? "Entrando"
        : "Entrar";
  const magicLinkButtonText = isMagicLinkCoolingDown
    ? `Reenviar en ${magicLinkCooldownSeconds}s`
    : isMagicLinkLoading
      ? "Enviando"
      : "Entrar sin contrasena";

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
          Entra con email y contrasena. Mantenemos tu sesion abierta en este
          dispositivo.
        </p>

        {isEmailAuthEnabled ? (
          <form className="mt-6 grid gap-3" onSubmit={handlePasswordSubmit}>
            <div className="grid grid-cols-2 rounded-full border border-border-subtle bg-surface-secondary p-1">
              <button
                className={`min-h-10 rounded-full text-sm font-black transition ${
                  authMode === "signIn"
                    ? "bg-accent-lime text-background-primary"
                    : "text-text-secondary"
                }`}
                disabled={isAnyAuthLoading}
                onClick={() => setAuthMode("signIn")}
                type="button"
              >
                Entrar
              </button>
              <button
                className={`min-h-10 rounded-full text-sm font-black transition ${
                  authMode === "signUp"
                    ? "bg-accent-lime text-background-primary"
                    : "text-text-secondary"
                }`}
                disabled={isAnyAuthLoading}
                onClick={() => setAuthMode("signUp")}
                type="button"
              >
                Crear
              </button>
            </div>
            <FormField
              autoComplete="email"
              label="Email"
              onChange={(changeEvent) => setEmail(changeEvent.target.value)}
              placeholder="tu@email.com"
              required
              type="email"
              value={email}
            />
            <FormField
              autoComplete={
                authMode === "signIn" ? "current-password" : "new-password"
              }
              label="Contrasena"
              minLength={6}
              onChange={(changeEvent) => setPassword(changeEvent.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              type="password"
              value={password}
            />
            <Button
              disabled={isAnyAuthLoading}
              icon={authMode === "signIn" ? LogIn : UserPlus}
              type="submit"
              variant="primary"
            >
              {isAuthSessionChecking ? "Recuperando sesion" : passwordSubmitText}
            </Button>
            <Button
              disabled={
                isAnyAuthLoading ||
                isMagicLinkCoolingDown ||
                !email.trim()
              }
              icon={Mail}
              onClick={handleMagicLinkRequest}
              variant="secondary"
            >
              {magicLinkButtonText}
            </Button>
          </form>
        ) : (
          <p className="mt-6 rounded-lg border border-feedback-danger/40 bg-feedback-danger/10 p-3 text-sm leading-6 text-feedback-danger">
            El acceso real no esta disponible en este entorno.
          </p>
        )}

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
        </div>
      </section>
    </ScreenShell>
  );
}
