import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import { ScreenShell } from "../../components/layout/ScreenShell";

type AuthModeIdentifier = "signIn" | "signUp";
type AuthLoadingActionIdentifier =
  | "magicLink"
  | "passwordReset"
  | "passwordSignIn"
  | "passwordSignUp"
  | "passwordUpdate";

interface AuthScreenProps {
  authErrorMessage?: string | null;
  authLoadingAction?: AuthLoadingActionIdentifier | null;
  authStatusMessage?: string | null;
  isAuthSessionChecking: boolean;
  isEmailAuthEnabled: boolean;
  isPasswordRecoveryMode: boolean;
  onDemoSignIn: () => void;
  onEmailSignInRequest: (email: string) => Promise<void>;
  onPasswordResetRequest: (email: string) => Promise<void>;
  onPasswordSignInRequest: (email: string, password: string) => Promise<void>;
  onPasswordSignUpRequest: (email: string, password: string) => Promise<void>;
  onPasswordUpdateRequest: (password: string) => Promise<void>;
}

/**
 * Pantalla de acceso inicial.
 * Se construye para resolver entrada, registro y recuperacion sin ruido visual.
 * La usa App cuando no hay perfil de sesion o hay recuperacion de contrasena.
 * Sirve para autenticar usuarios reales y mantener modo demo disponible.
 */
export function AuthScreen({
  authErrorMessage,
  authLoadingAction,
  authStatusMessage,
  isAuthSessionChecking,
  isEmailAuthEnabled,
  isPasswordRecoveryMode,
  onDemoSignIn,
  onEmailSignInRequest,
  onPasswordResetRequest,
  onPasswordSignInRequest,
  onPasswordSignUpRequest,
  onPasswordUpdateRequest,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthModeIdentifier>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isPasswordSignInLoading = authLoadingAction === "passwordSignIn";
  const isPasswordSignUpLoading = authLoadingAction === "passwordSignUp";
  const isPasswordResetLoading = authLoadingAction === "passwordReset";
  const isPasswordUpdateLoading = authLoadingAction === "passwordUpdate";
  const isMagicLinkLoading = authLoadingAction === "magicLink";
  const isAnyAuthLoading = Boolean(authLoadingAction) || isAuthSessionChecking;

  /**
   * Ejecuta login o registro con contrasena.
   * Se construye para que el formulario principal sea el acceso diario.
   * Lo usa el formulario de acceso.
   * Sirve para crear o recuperar una sesion persistente.
   */
  async function handlePasswordSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    if (!password) {
      return;
    }

    if (isPasswordRecoveryMode) {
      await onPasswordUpdateRequest(password);
      return;
    }

    if (!email.trim()) {
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
   * Se construye como alternativa secundaria de acceso.
   * Lo usa el boton de ayuda del formulario.
   * Sirve para entrar sin contrasena cuando Supabase permite enviar emails.
   */
  async function handleMagicLinkRequest() {
    if (!email.trim()) {
      return;
    }

    await onEmailSignInRequest(email.trim());
  }

  /**
   * Solicita email para crear o recuperar contrasena.
   * Se construye para cuentas existentes creadas con magic link.
   * Lo usa el boton secundario del formulario.
   * Sirve para iniciar el flujo correcto de cambio de contrasena.
   */
  async function handlePasswordResetRequest() {
    if (!email.trim()) {
      return;
    }

    await onPasswordResetRequest(email.trim());
  }

  const passwordSubmitText = getPasswordSubmitText({
    authMode,
    isAuthSessionChecking,
    isPasswordRecoveryMode,
    isPasswordSignInLoading,
    isPasswordSignUpLoading,
    isPasswordUpdateLoading,
  });

  return (
    <ScreenShell className="grid place-items-center px-5">
      <section className="w-full rounded-lg border border-border-subtle bg-surface-primary p-5 shadow-floating">
        <img
          alt="Padelito"
          className="mb-7 h-auto w-56"
          src="/logo-padelito.svg"
        />

        <h1 className="text-2xl font-black leading-tight">
          {isPasswordRecoveryMode ? "Nueva contrasena" : "Entrar a Padelito"}
        </h1>

        {isEmailAuthEnabled ? (
          <form className="mt-5 grid gap-3" onSubmit={handlePasswordSubmit}>
            {!isPasswordRecoveryMode ? (
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
            ) : null}

            {!isPasswordRecoveryMode ? (
              <FormField
                autoComplete="email"
                label="Email"
                onChange={(changeEvent) => setEmail(changeEvent.target.value)}
                placeholder="tu@email.com"
                required
                type="email"
                value={email}
              />
            ) : null}

            <FormField
              autoComplete={
                isPasswordRecoveryMode || authMode === "signUp"
                  ? "new-password"
                  : "current-password"
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
              icon={
                isPasswordRecoveryMode
                  ? KeyRound
                  : authMode === "signIn"
                    ? LogIn
                    : UserPlus
              }
              type="submit"
              variant="primary"
            >
              {passwordSubmitText}
            </Button>

            {!isPasswordRecoveryMode && authMode === "signIn" ? (
              <div className="grid gap-2">
                <Button
                  disabled={isAnyAuthLoading || !email.trim()}
                  icon={KeyRound}
                  onClick={handlePasswordResetRequest}
                  variant="ghost"
                >
                  {isPasswordResetLoading
                    ? "Enviando"
                    : "Crear o recuperar contrasena"}
                </Button>
                <Button
                  disabled={isAnyAuthLoading || !email.trim()}
                  icon={Mail}
                  onClick={handleMagicLinkRequest}
                  variant="ghost"
                >
                  {isMagicLinkLoading ? "Enviando" : "Enviar enlace por email"}
                </Button>
              </div>
            ) : null}
          </form>
        ) : (
          <p className="mt-5 rounded-lg border border-feedback-danger/40 bg-feedback-danger/10 p-3 text-sm leading-6 text-feedback-danger">
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

        {!isEmailAuthEnabled ? (
          <div className="mt-5 grid gap-3">
            <Button icon={LogIn} onClick={onDemoSignIn} variant="secondary">
              Modo demo
            </Button>
          </div>
        ) : null}
      </section>
    </ScreenShell>
  );
}

interface PasswordSubmitTextInput {
  authMode: AuthModeIdentifier;
  isAuthSessionChecking: boolean;
  isPasswordRecoveryMode: boolean;
  isPasswordSignInLoading: boolean;
  isPasswordSignUpLoading: boolean;
  isPasswordUpdateLoading: boolean;
}

/**
 * Devuelve el texto principal del formulario de acceso.
 * Se construye para mantener la UI compacta sin duplicar ternarios.
 * Lo usa AuthScreen.
 * Sirve para mostrar estados de carga claros.
 */
function getPasswordSubmitText({
  authMode,
  isAuthSessionChecking,
  isPasswordRecoveryMode,
  isPasswordSignInLoading,
  isPasswordSignUpLoading,
  isPasswordUpdateLoading,
}: PasswordSubmitTextInput) {
  if (isAuthSessionChecking) {
    return "Recuperando sesion";
  }

  if (isPasswordRecoveryMode) {
    return isPasswordUpdateLoading ? "Guardando" : "Guardar contrasena";
  }

  if (authMode === "signUp") {
    return isPasswordSignUpLoading ? "Creando" : "Crear cuenta";
  }

  return isPasswordSignInLoading ? "Entrando" : "Entrar";
}
