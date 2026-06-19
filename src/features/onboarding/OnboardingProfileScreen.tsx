import { ScreenShell } from "../../components/layout/ScreenShell";
import type { Profile } from "../../domain/models/profileModels";
import { ProfileForm } from "../profiles/ProfileForm";

interface OnboardingProfileScreenProps {
  currentProfile: Profile;
  onProfileSave: (profile: Profile, avatarFile?: File) => void;
}

/**
 * Onboarding de perfil.
 * Se construye para capturar datos minimos antes de usar el feed completo.
 * La usa App despues del acceso demo o real.
 * Sirve para configurar jugador u organizacion segun el MVP.
 */
export function OnboardingProfileScreen({
  currentProfile,
  onProfileSave,
}: OnboardingProfileScreenProps) {
  return (
    <ScreenShell className="px-4 py-8">
      <section className="rounded-lg border border-border-subtle bg-surface-primary p-4 shadow-floating">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-lime">
          Perfil
        </p>
        <h1 className="mt-2 text-2xl font-black">Completa tu base</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Datos mínimos para que otros jugadores entiendan categoría, zona y
          disponibilidad.
        </p>

        <div className="mt-5">
          <ProfileForm
            currentProfile={currentProfile}
            onProfileSave={onProfileSave}
            submitLabel="Guardar perfil"
          />
        </div>
      </section>
    </ScreenShell>
  );
}
