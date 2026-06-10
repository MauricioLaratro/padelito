import { X } from "lucide-react";
import type { Profile } from "../../domain/models/profileModels";
import { ProfileForm } from "./ProfileForm";

interface ProfileEditModalProps {
  currentProfile: Profile;
  onClose: () => void;
  onProfileSave: (profile: Profile) => void;
}

/**
 * Modal de edicion de perfil propio.
 * Se construye para actualizar datos sin sacar al usuario del perfil.
 * Lo usa ProfileScreen.
 * Sirve para mantener identidad, zona y contacto privado actualizados.
 */
export function ProfileEditModal({
  currentProfile,
  onClose,
  onProfileSave,
}: ProfileEditModalProps) {
  /**
   * Guarda el perfil y cierra el modal.
   * Se construye para dejar el flujo de edicion compacto.
   * Lo usa ProfileForm.
   * Sirve para volver a la actividad del perfil despues de editar.
   */
  function handleProfileSave(updatedProfile: Profile) {
    onProfileSave(updatedProfile);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70">
      <section className="max-h-[90vh] w-full max-w-mobile overflow-auto rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Perfil
            </p>
            <h2 className="mt-1 text-2xl font-black">Editar datos</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="grid size-10 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <ProfileForm
          currentProfile={currentProfile}
          onCancel={onClose}
          onProfileSave={handleProfileSave}
          submitLabel="Guardar cambios"
        />
      </section>
    </div>
  );
}
