import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmationDialogProps {
  body: string;
  confirmLabel: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "primary";
}

/**
 * Dialogo reutilizable de confirmacion.
 * Se construye para proteger acciones sensibles en mobile.
 * Lo usa App como capa central antes de ejecutar handlers destructivos.
 * Sirve para evitar cancelaciones o archivos por toque accidental.
 */
export function ConfirmationDialog({
  body,
  confirmLabel,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = "danger",
}: ConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70">
      <section
        aria-modal="true"
        className="w-full max-w-mobile rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-feedback-danger/15 text-feedback-danger">
              <AlertTriangle aria-hidden="true" size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {body}
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button onClick={onCancel} variant="secondary">
            Volver
          </Button>
          <Button onClick={onConfirm} variant={tone}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
