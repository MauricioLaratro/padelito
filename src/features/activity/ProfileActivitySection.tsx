import { Check, Clock, Send, X } from "lucide-react";
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
            <ActivityRow
              key={matchJoinRequest.requestId}
              meta={requestStatusLabels[matchJoinRequest.status]}
              title="Solicitud para unirme"
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin solicitudes enviadas.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Solicitudes recibidas">
        {receivedRequests.length > 0 ? (
          receivedRequests.map((matchJoinRequest) => (
            <div className="grid gap-2" key={matchJoinRequest.requestId}>
              <ActivityRow
                meta={requestStatusLabels[matchJoinRequest.status]}
                title="Postulante a partido"
              />
              {matchJoinRequest.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    icon={Check}
                    onClick={() =>
                      onJoinRequestStatusChange(
                        matchJoinRequest.requestId,
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
                      onJoinRequestStatusChange(
                        matchJoinRequest.requestId,
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
