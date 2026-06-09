import { CalendarDays, Check, Clock, MapPin, Send, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../../components/common/Button";
import { Chip } from "../../components/common/Chip";
import {
  eventInteractionLabels,
  invitationStatusLabels,
  postTypeLabels,
  requestStatusLabels,
} from "../../constants/postOptions";
import { playStyleLabels } from "../../constants/profileOptions";
import type { MatchJoinRequest } from "../../domain/models/postModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import { formatScheduledDateTime } from "../../utils/dateFormatters";

interface ProfileActivitySectionProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestCancel: (requestId: string) => void;
}

/**
 * Seccion de actividad del perfil.
 * Se construye para que el perfil no sea solo datos estaticos.
 * La usa ProfileScreen.
 * Sirve para revisar publicaciones, solicitudes, invitaciones y eventos.
 */
export function ProfileActivitySection({
  currentProfileId,
  database,
  onDirectInvitationStatusChange,
  onJoinRequestCancel,
  onJoinRequestStatusChange,
}: ProfileActivitySectionProps) {
  const ownPosts = database.posts.filter(
    (post) => post.authorProfileId === currentProfileId,
  );
  const sentRequests = database.matchJoinRequests.filter(
    (matchJoinRequest) =>
      matchJoinRequest.requesterProfileId === currentProfileId,
  );
  const receivedRequests = database.matchJoinRequests.filter(
    (matchJoinRequest) => matchJoinRequest.ownerProfileId === currentProfileId,
  );
  const sentInvitations = database.directMatchInvitations.filter(
    (directMatchInvitation) =>
      directMatchInvitation.inviterProfileId === currentProfileId,
  );
  const receivedInvitations = database.directMatchInvitations.filter(
    (directMatchInvitation) =>
      directMatchInvitation.invitedProfileId === currentProfileId,
  );
  const eventInteractions = database.postInteractions.filter(
    (postInteraction) => postInteraction.profileId === currentProfileId,
  );

  return (
    <div className="grid gap-3">
      <ActivityCard title="Publicaciones propias">
        {ownPosts.length > 0 ? (
          ownPosts.map((post) => (
            <ActivityRow
              key={post.postId}
              meta={formatScheduledDateTime(
                post.scheduledDate,
                post.scheduledStartTime,
                post.scheduledEndTime,
              )}
              title={postTypeLabels[post.postType]}
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin publicaciones.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Solicitudes enviadas">
        {sentRequests.length > 0 ? (
          sentRequests.map((matchJoinRequest) => (
            <RequestActivityCard
              database={database}
              key={matchJoinRequest.requestId}
              mode="sent"
              onJoinRequestCancel={onJoinRequestCancel}
              onJoinRequestStatusChange={onJoinRequestStatusChange}
              request={matchJoinRequest}
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin solicitudes enviadas.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Solicitudes recibidas">
        {receivedRequests.length > 0 ? (
          receivedRequests.map((matchJoinRequest) => (
            <RequestActivityCard
              database={database}
              key={matchJoinRequest.requestId}
              mode="received"
              onJoinRequestCancel={onJoinRequestCancel}
              onJoinRequestStatusChange={onJoinRequestStatusChange}
              request={matchJoinRequest}
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin solicitudes recibidas.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Invitaciones enviadas">
        {sentInvitations.length > 0 ? (
          sentInvitations.map((directMatchInvitation) => (
            <ActivityRow
              key={directMatchInvitation.invitationId}
              meta={invitationStatusLabels[directMatchInvitation.status]}
              title={`Partido ${playStyleLabels[directMatchInvitation.desiredPlayStyle]}`}
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin invitaciones enviadas.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Invitaciones recibidas">
        {receivedInvitations.length > 0 ? (
          receivedInvitations.map((directMatchInvitation) => (
            <div className="grid gap-2" key={directMatchInvitation.invitationId}>
              <ActivityRow
                meta={invitationStatusLabels[directMatchInvitation.status]}
                title={formatScheduledDateTime(
                  directMatchInvitation.scheduledDate,
                  directMatchInvitation.scheduledStartTime,
                )}
              />
              {directMatchInvitation.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    icon={Check}
                    onClick={() =>
                      onDirectInvitationStatusChange(
                        directMatchInvitation.invitationId,
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
                        directMatchInvitation.invitationId,
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
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin invitaciones recibidas.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Eventos guardados">
        {eventInteractions.length > 0 ? (
          eventInteractions.map((postInteraction) => (
            <ActivityRow
              key={postInteraction.interactionId}
              meta={eventInteractionLabels[postInteraction.interactionType]}
              title="Evento marcado"
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin eventos marcados.</p>
        )}
      </ActivityCard>
    </div>
  );
}

interface RequestActivityCardProps {
  database: PadelitoLocalDatabase;
  mode: "sent" | "received";
  onJoinRequestCancel: (requestId: string) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
  request: MatchJoinRequest;
}

/**
 * Card contextual de solicitud de partido.
 * Se construye para que emisor y receptor vean el mismo estado con contexto suficiente.
 * La usa ProfileActivitySection en solicitudes enviadas y recibidas.
 * Sirve para cancelar, aceptar, rechazar y entender a que partido pertenece la solicitud.
 */
function RequestActivityCard({
  database,
  mode,
  onJoinRequestCancel,
  onJoinRequestStatusChange,
  request,
}: RequestActivityCardProps) {
  const requestedPost = database.posts.find(
    (post) => post.postId === request.postId,
  );
  const requesterProfile = database.profiles.find(
    (profile) => profile.profileId === request.requesterProfileId,
  );
  const ownerProfile = database.profiles.find(
    (profile) => profile.profileId === request.ownerProfileId,
  );
  const relatedProfile = mode === "sent" ? ownerProfile : requesterProfile;
  const statusLabel = requestStatusLabels[request.status];
  const statusTone =
    request.status === "accepted"
      ? "success"
      : request.status === "rejected" || request.status === "cancelled"
        ? "danger"
        : "lime";

  return (
    <div className="grid gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-accent-lime">
            {mode === "sent" ? "Solicitud enviada" : "Solicitud recibida"}
          </p>
          <h4 className="mt-1 text-sm font-black">
            {requestedPost?.postType === "looking_for_player"
              ? "Partido incompleto"
              : "Partido"}
          </h4>
        </div>
        <Chip tone={statusTone}>{statusLabel}</Chip>
      </div>

      <div className="flex flex-wrap gap-2">
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
            {mode === "sent" ? "Creador" : "Jugador"}:{" "}
            {relatedProfile.displayName}
          </Chip>
        ) : null}
      </div>

      {request.status === "accepted" && mode === "sent" ? (
        <p className="text-sm leading-6 text-feedback-success">
          Te aceptaron para este partido.
        </p>
      ) : null}

      {request.status === "pending" ? (
        <div className="flex flex-wrap gap-2">
          {mode === "sent" ? (
            <Button
              icon={X}
              onClick={() => onJoinRequestCancel(request.requestId)}
              variant="danger"
            >
              Cancelar solicitud
            </Button>
          ) : (
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
          )}
        </div>
      ) : null}
    </div>
  );
}

interface ActivityCardProps {
  children: ReactNode;
  title: string;
}

/**
 * Card de grupo de actividad.
 * Se construye para reutilizar estructura del perfil.
 * La usa ProfileActivitySection.
 * Sirve para separar cada tipo de actividad sin anidar cards complejas.
 */
function ActivityCard({ children, title }: ActivityCardProps) {
  return (
    <section className="rounded-lg border border-border-subtle bg-surface-primary p-4">
      <h3 className="mb-3 text-base font-black">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

interface ActivityRowProps {
  meta: string;
  title: string;
}

/**
 * Fila compacta de actividad.
 * Se construye para listar eventos del perfil sin ocupar demasiado espacio.
 * La usa ProfileActivitySection.
 * Sirve para mostrar estado y contexto rapidamente.
 */
function ActivityRow({ meta, title }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary p-3">
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs text-text-secondary">{meta}</p>
      </div>
      <Chip icon={meta === "Pendiente" ? Clock : Send}>{meta}</Chip>
    </div>
  );
}
