import { Bell, CheckCheck } from "lucide-react";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import type { InternalNotification } from "../../domain/models/notificationModels";

interface NotificationsScreenProps {
  currentProfileId: string;
  notifications: InternalNotification[];
  onNotificationsRead: () => void;
}

/**
 * Pantalla de notificaciones internas.
 * Se construye para cubrir avisos obligatorios del MVP.
 * La usa App dentro de la navegacion principal.
 * Sirve para revisar solicitudes, invitaciones, seguidores y recordatorios.
 */
export function NotificationsScreen({
  currentProfileId,
  notifications,
  onNotificationsRead,
}: NotificationsScreenProps) {
  const visibleNotifications = notifications
    .filter(
      (notification) => notification.recipientProfileId === currentProfileId,
    )
    .sort((firstNotification, secondNotification) =>
      secondNotification.createdAt.localeCompare(firstNotification.createdAt),
    );

  return (
    <section className="grid gap-3 px-4 pb-28 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
            Avisos
          </p>
          <h1 className="text-2xl font-black">Notificaciones</h1>
        </div>
        <Button icon={CheckCheck} onClick={onNotificationsRead} variant="secondary">
          Marcar leidas
        </Button>
      </div>

      {visibleNotifications.length > 0 ? (
        visibleNotifications.map((notification) => (
          <article
            className="rounded-lg border border-border-subtle bg-surface-primary p-4"
            key={notification.notificationId}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full ${
                  notification.readAt
                    ? "bg-surface-secondary text-text-secondary"
                    : "bg-accent-lime text-background-primary"
                }`}
              >
                <Bell aria-hidden="true" size={17} />
              </span>
              <div>
                <h2 className="text-base font-black">{notification.title}</h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {notification.body}
                </p>
              </div>
            </div>
          </article>
        ))
      ) : (
        <EmptyState
          description="Cuando alguien te siga, se postule o responda una invitacion, aparece aca."
          icon={Bell}
          title="Sin notificaciones"
        />
      )}
    </section>
  );
}
