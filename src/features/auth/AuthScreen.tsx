import { KeyRound, LogIn, UserPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import { ScreenShell } from "../../components/layout/ScreenShell";

type AuthModeIdentifier = "signIn" | "signUp";
type AuthLoadingActionIdentifier =
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
  onPasswordResetRequest: (email: string) => Promise<void>;
  onPasswordSignInRequest: (email: string, password: string) => Promise<void>;
  onPasswordSignUpRequest: (
    email: string,
    displayName: string,
    password: string,
  ) => Promise<void>;
  onPasswordUpdateRequest: (password: string) => Promise<void>;
}

const usernameMinLength = 3;
const usernameMaxLength = 24;
const passwordMinLength = 8;
const passwordMaxLength = 64;

/**
 * Pantalla de acceso inicial.
 * Se construye para resolver entrada, registro y recuperacion sin ruido visual.
 * La usa App cuando no hay perfil de sesión o hay recuperación de contraseña.
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
  onPasswordResetRequest,
  onPasswordSignInRequest,
  onPasswordSignUpRequest,
  onPasswordUpdateRequest,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthModeIdentifier>("signIn");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const isPasswordSignInLoading = authLoadingAction === "passwordSignIn";
  const isPasswordSignUpLoading = authLoadingAction === "passwordSignUp";
  const isPasswordResetLoading = authLoadingAction === "passwordReset";
  const isPasswordUpdateLoading = authLoadingAction === "passwordUpdate";
  const isAnyAuthLoading = Boolean(authLoadingAction) || isAuthSessionChecking;

  /**
   * Ejecuta login o registro con contraseña.
   * Se construye para que el formulario principal sea el acceso diario.
   * Lo usa el formulario de acceso.
   * Sirve para crear o recuperar una sesion persistente.
   */
  async function handlePasswordSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setFormErrorMessage(null);

    if (!password) {
      return;
    }

    if (isPasswordRecoveryMode) {
      const passwordValidationMessage = validatePassword(password);

      if (passwordValidationMessage) {
        setFormErrorMessage(passwordValidationMessage);
        return;
      }

      if (password !== repeatedPassword) {
        setFormErrorMessage("Las contraseñas no coinciden.");
        return;
      }

      await onPasswordUpdateRequest(password);
      return;
    }

    if (!email.trim()) {
      return;
    }

    if (authMode === "signUp") {
      const normalizedDisplayName = displayName.trim();
      const signUpValidationMessage = validateSignUpForm({
        displayName: normalizedDisplayName,
        password,
        repeatedPassword,
      });

      if (signUpValidationMessage) {
        setFormErrorMessage(signUpValidationMessage);
        return;
      }

      await onPasswordSignUpRequest(email.trim(), normalizedDisplayName, password);
      return;
    }

    await onPasswordSignInRequest(email.trim(), password);
  }

  /**
   * Solicita email para crear o recuperar contraseña.
   * Se construye para cuentas existentes que olvidaron su contraseña.
   * Lo usa el boton secundario del formulario.
   * Sirve para iniciar el flujo correcto de cambio de contraseña.
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
          {isPasswordRecoveryMode ? "Nueva contraseña" : "Entrar a Padelito"}
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
                  onClick={() => {
                    setAuthMode("signIn");
                    setFormErrorMessage(null);
                    setRepeatedPassword("");
                  }}
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
                  onClick={() => {
                    setAuthMode("signUp");
                    setFormErrorMessage(null);
                  }}
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

            {!isPasswordRecoveryMode && authMode === "signUp" ? (
              <FormField
                autoComplete="username"
                label="Nombre de usuario"
                maxLength={usernameMaxLength}
                minLength={usernameMinLength}
                onChange={(changeEvent) =>
                  setDisplayName(changeEvent.target.value)
                }
                placeholder={`${usernameMinLength} a ${usernameMaxLength} caracteres`}
                required
                type="text"
                value={displayName}
              />
            ) : null}

            <FormField
              autoComplete={
                isPasswordRecoveryMode || authMode === "signUp"
                  ? "new-password"
                  : "current-password"
              }
              label="Contraseña"
              maxLength={passwordMaxLength}
              minLength={passwordMinLength}
              onChange={(changeEvent) => setPassword(changeEvent.target.value)}
              placeholder={`${passwordMinLength} a ${passwordMaxLength} caracteres`}
              required
              type="password"
              value={password}
            />

            {isPasswordRecoveryMode || authMode === "signUp" ? (
              <FormField
                autoComplete="new-password"
                label="Repetir contraseña"
                maxLength={passwordMaxLength}
                minLength={passwordMinLength}
                onChange={(changeEvent) =>
                  setRepeatedPassword(changeEvent.target.value)
                }
                placeholder="Repetí la contraseña"
                required
                type="password"
                value={repeatedPassword}
              />
            ) : null}

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
              <Button
                disabled={isAnyAuthLoading || !email.trim()}
                icon={KeyRound}
                onClick={handlePasswordResetRequest}
                variant="ghost"
              >
                {isPasswordResetLoading ? "Enviando" : "Olvidé mi contraseña"}
              </Button>
            ) : null}
          </form>
        ) : (
          <p className="mt-5 rounded-lg border border-feedback-danger/40 bg-feedback-danger/10 p-3 text-sm leading-6 text-feedback-danger">
            El acceso real no está disponible en este entorno.
          </p>
        )}

        {formErrorMessage ? (
          <p className="mt-3 rounded-lg border border-feedback-danger/40 bg-feedback-danger/10 p-3 text-sm leading-6 text-feedback-danger">
            {formErrorMessage}
          </p>
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

interface SignUpFormValidationInput {
  displayName: string;
  password: string;
  repeatedPassword: string;
}

/**
 * Valida el formulario de registro antes de llamar a Supabase.
 * Se construye para evitar envíos innecesarios y explicar errores en español.
 * Lo usa AuthScreen.
 * Sirve para que el alta directa sea clara en mobile.
 */
function validateSignUpForm({
  displayName,
  password,
  repeatedPassword,
}: SignUpFormValidationInput) {
  if (
    displayName.length < usernameMinLength ||
    displayName.length > usernameMaxLength
  ) {
    return `El nombre de usuario debe tener entre ${usernameMinLength} y ${usernameMaxLength} caracteres.`;
  }

  const passwordValidationMessage = validatePassword(password);

  if (passwordValidationMessage) {
    return passwordValidationMessage;
  }

  if (password !== repeatedPassword) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}

/**
 * Valida límites de contraseña compartidos por registro y recuperación.
 * Se construye para mantener una regla única de seguridad básica.
 * Lo usa AuthScreen.
 * Sirve para evitar formularios aceptados que Supabase luego rechace.
 */
function validatePassword(password: string) {
  if (
    password.length < passwordMinLength ||
    password.length > passwordMaxLength
  ) {
    return `La contraseña debe tener entre ${passwordMinLength} y ${passwordMaxLength} caracteres.`;
  }

  return null;
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
    return "Recuperando sesión";
  }

  if (isPasswordRecoveryMode) {
    return isPasswordUpdateLoading ? "Guardando" : "Guardar contraseña";
  }

  if (authMode === "signUp") {
    return isPasswordSignUpLoading ? "Creando" : "Crear cuenta";
  }

  return isPasswordSignInLoading ? "Entrando" : "Entrar";
}
