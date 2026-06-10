import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  MapPin,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import { EmptyState } from "../../components/common/EmptyState";
import {
  invitationStatusLabels,
  requestStatusLabels,
} from "../../constants/postOptions";
import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  DirectMatchInvitation,
  MatchJoinRequest,
} from "../../domain/models/postModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import { formatScheduledDateTime } from "../../utils/dateFormatters";

interface NotificationsScreenProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  notifications: InternalNotification[];
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
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
  database,
  notifications,
  onDirectInvitationStatusChange,
  onJoinRequestCancel,
  onJoinRequestStatusChange,
  onNotificationsRead,
}: NotificationsScreenProps) {
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);
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
            <button
              className="flex w-full items-start gap-3 text-left"
              onClick={() =>
                setSelectedNotificationId((currentNotificationId) =>
                  currentNotificationId === notification.notificationId
                    ? null
                    : notification.notificationId,
                )
              }
              type="button"
            >
              <span
                className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full ${
                  notification.readAt
                    ? "bg-surface-secondary text-text-secondary"
                    : "bg-accent-lime text-background-primary"
                }`}
              >
                <Bell aria-hidden="true" size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black">{notification.title}</h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {notification.body}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className={`mt-2 shrink-0 text-text-secondary transition ${
                  selectedNotificationId === notification.notificationId
                    ? "rotate-90"
                    : ""
                }`}
                size={18}
              />
            </button>

            {selectedNotificationId === notification.notificationId ? (
              <NotificationDetail
                currentProfileId={currentProfileId}
                database={database}
                notification={notification}
                onDirectInvitationStatusChange={
                  onDirectInvitationStatusChange
                }
                onJoinRequestCancel={onJoinRequestCancel}
                onJoinRequestStatusChange={onJoinRequestStatusChange}
              />
            ) : null}
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

interface NotificationDetailProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  notification: InternalNotification;
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
}

/**
 * Detalle contextual de una notificacion.
 * Se construye para convertir avisos en acciones directas.
 * Lo usa NotificationsScreen al expandir una card.
 * Sirve para aceptar, rechazar o cancelar solicitudes e invitaciones.
 */
function NotificationDetail({
  currentProfileId,
  database,
  notification,
  onDirectInvitationStatusChange,
  onJoinRequestCancel,
  onJoinRequestStatusChange,
}: NotificationDetailProps) {
  if (notification.relatedRequestId) {
    const request = database.matchJoinRequests.find(
      (matchJoinRequest) =>
        matchJoinRequest.requestId === notification.relatedRequestId,
    );

    if (request) {
      return (
        <JoinRequestNotificationDetail
          currentProfileId={currentProfileId}
          database={database}
          onJoinRequestCancel={onJoinRequestCancel}
          onJoinRequestStatusChange={onJoinRequestStatusChange}
          request={request}
        />
      );
    }
  }

  if (notification.relatedInvitationId) {
    const invitation = database.directMatchInvitations.find(
      (directMatchInvitation) =>
        directMatchInvitation.invitationId === notification.relatedInvitationId,
    );

    if (invitation) {
      return (
        <InvitationNotificationDetail
          currentProfileId={currentProfileId}
          database={database}
          invitation={invitation}
          onDirectInvitationStatusChange={onDirectInvitationStatusChange}
        />
      );
    }
  }

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <p className="text-sm leading-6 text-text-secondary">
        No hay acciones pendientes para este aviso.
      </p>
    </div>
  );
}

interface JoinRequestNotificationDetailProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
  request: MatchJoinRequest;
}

/**
 * Detalle accionable de solicitud de partido.
 * Se construye para que creador y postulante actuen desde notificaciones.
 * Lo usa NotificationDetail.
 * Sirve para responder o cancelar postulaciones sin ir al perfil.
 */
function JoinRequestNotificationDetail({
  currentProfileId,
  database,
  onJoinRequestCancel,
  onJoinRequestStatusChange,
  request,
}: JoinRequestNotificationDetailProps) {
  const requestedPost = database.posts.find(
    (post) => post.postId === request.postId,
  );
  const requesterProfile = database.profiles.find(
    (profile) => profile.profileId === request.requesterProfileId,
  );
  const ownerProfile = database.profiles.find(
    (profile) => profile.profileId === request.ownerProfileId,
  );
  const isOwnerView = request.ownerProfileId === currentProfileId;
  const relatedProfile = isOwnerView ? requesterProfile : ownerProfile;

  return (
    <div className="mt-3 grid gap-3 border-t border-border-subtle pt-3">
      <div className="flex flex-wrap gap-2">
        <Chip tone={getRequestStatusTone(request.status)}>
          {requestStatusLabels[request.status]}
        </Chip>
        {requestedPost ? (
          <>
            <Chip icon={CalendarDays}>
              {formatScheduledDateTime(
                requestedPost.scheduledDate,
                requestedPost.scheduledStartTime,
                requestedPost.scheduledEndTime,
              )}
            </Chip>
            <Chip icon={MapPin}>{requestedPost.placeText}</Chip>
          </>
        ) : null}
        {relatedProfile ? (
          <Chip icon={UserRound}>
            {isOwnerView ? "Jugador" : "Creador"}:{" "}
            {relatedProfile.displayName}
          </Chip>
        ) : null}
      </div>

      {request.status === "pending" ? (
        <div className="flex flex-wrap gap-2">
          {isOwnerView ? (
            <>
              <Button
                icon={Check}
                onClick={() =>
                  onJoinRequestStatusChange(request.requestId, "accepted")
                }
                variant="primary"
              >
                Aceptar
              </Button>
              <Button
                icon={X}
                onClick={() =>
                  onJoinRequestStatusChange(request.requestId, "rejected")
                }
                variant="danger"
              >
                Rechazar
              </Button>
            </>
          ) : (
            <Button
              icon={X}
              onClick={() => onJoinRequestCancel(request.requestId)}
              variant="danger"
            >
              Cancelar solicitud
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface InvitationNotificationDetailProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  invitation: DirectMatchInvitation;
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
}

/**
 * Detalle accionable de invitacion directa.
 * Se construye para que el jugador invitado responda desde el aviso.
 * Lo usa NotificationDetail.
 * Sirve para aceptar o rechazar invitaciones vinculadas a un partido.
 */
function InvitationNotificationDetail({
  currentProfileId,
  database,
  invitation,
  onDirectInvitationStatusChange,
}: InvitationNotificationDetailProps) {
  const relatedPost = invitation.relatedPostId
    ? database.posts.find((post) => post.postId === invitation.relatedPostId)
    : null;
  const inviterProfile = database.profiles.find(
    (profile) => profile.profileId === invitation.inviterProfileId,
  );
  const invitedProfile = database.profiles.find(
    (profile) => profile.profileId === invitation.invitedProfileId,
  );
  const isInvitedView = invitation.invitedProfileId === currentProfileId;
  const relatedProfile = isInvitedView ? inviterProfile : invitedProfile;

  return (
    <div className="mt-3 grid gap-3 border-t border-border-subtle pt-3">
      <div className="flex flex-wrap gap-2">
        <Chip tone={getInvitationStatusTone(invitation.status)}>
          {invitationStatusLabels[invitation.status]}
        </Chip>
        <Chip icon={CalendarDays}>
          {formatScheduledDateTime(
            invitation.scheduledDate,
            invitation.scheduledStartTime,
          )}
        </Chip>
        <Chip icon={MapPin}>{invitation.placeText}</Chip>
        {relatedPost?.postType === "looking_for_player" ? (
          <Chip icon={UsersRound}>Faltan {relatedPost.missingPlayersCount}</Chip>
        ) : null}
        {relatedProfile ? (
          <Chip icon={UserRound}>
            {isInvitedView ? "Invita" : "Invitado"}:{" "}
            {relatedProfile.displayName}
          </Chip>
        ) : null}
      </div>

      {invitation.status === "pending" && isInvitedView ? (
        <div className="flex flex-wrap gap-2">
          <Button
            icon={Check}
            onClick={() =>
              onDirectInvitationStatusChange(
                invitation.invitationId,
                "accepted",
              )
            }
            variant="primary"
          >
            Aceptar
          </Button>
          <Button
            icon={X}
            onClick={() =>
              onDirectInvitationStatusChange(
                invitation.invitationId,
                "rejected",
              )
            }
            variant="danger"
          >
            Rechazar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Devuelve tono visual de solicitud.
 * Se construye para mantener chips consistentes entre estados.
 * Lo usan detalles de notificacion.
 * Sirve para leer rapidamente pendiente, aceptada o rechazada.
 */
function getRequestStatusTone(status: MatchJoinRequest["status"]) {
  if (status === "accepted") {
    return "success";
  }

  if (status === "rejected" || status === "cancelled") {
    return "danger";
  }

  return "lime";
}

/**
 * Devuelve tono visual de invitacion.
 * Se construye para reutilizar criterios de estado.
 * Lo usan detalles de notificacion.
 * Sirve para diferenciar acciones pendientes de respuestas finales.
 */
function getInvitationStatusTone(status: DirectMatchInvitation["status"]) {
  if (status === "accepted") {
    return "success";
  }

  if (status === "rejected" || status === "cancelled") {
    return "danger";
  }

  return "lime";
}
