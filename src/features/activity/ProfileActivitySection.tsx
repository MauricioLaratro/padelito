import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Send,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
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
import type {
  DirectMatchInvitation,
  MatchJoinRequest,
} from "../../domain/models/postModels";
import type { PadelitoLocalDatabase } from "../../services/repositories/localPadelitoDatabase";
import { formatScheduledDateTime } from "../../utils/dateFormatters";

interface ProfileActivitySectionProps {
  currentProfileId: string;
  database: PadelitoLocalDatabase;
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onDirectInvitationCancel: (invitationId: string) => void;
  onJoinRequestStatusChange: (
    requestId: string,
    status: "accepted" | "rejected",
  ) => void;
  onJoinRequestCancel: (requestId: string) => void;
  onPrivateContactOpen: (profileId: string) => void;
  onPostCancel: (postId: string) => void;
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
  onDirectInvitationCancel,
  onJoinRequestCancel,
  onJoinRequestStatusChange,
  onPrivateContactOpen,
  onPostCancel,
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
            <OwnPostActivityCard
              key={post.postId}
              onPostCancel={onPostCancel}
              post={post}
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
              onPrivateContactOpen={onPrivateContactOpen}
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
              onPrivateContactOpen={onPrivateContactOpen}
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
            <InvitationActivityCard
              database={database}
              key={directMatchInvitation.invitationId}
              invitation={directMatchInvitation}
              mode="sent"
              onDirectInvitationCancel={onDirectInvitationCancel}
              onDirectInvitationStatusChange={onDirectInvitationStatusChange}
              onPrivateContactOpen={onPrivateContactOpen}
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">Sin invitaciones enviadas.</p>
        )}
      </ActivityCard>

      <ActivityCard title="Invitaciones recibidas">
        {receivedInvitations.length > 0 ? (
          receivedInvitations.map((directMatchInvitation) => (
            <InvitationActivityCard
              database={database}
              key={directMatchInvitation.invitationId}
              invitation={directMatchInvitation}
              mode="received"
              onDirectInvitationCancel={onDirectInvitationCancel}
              onDirectInvitationStatusChange={onDirectInvitationStatusChange}
              onPrivateContactOpen={onPrivateContactOpen}
            />
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

interface OwnPostActivityCardProps {
  onPostCancel: (postId: string) => void;
  post: PadelitoLocalDatabase["posts"][number];
}

/**
 * Card compacta de publicacion propia.
 * Se construye para que el autor administre contenido desde su perfil.
 * La usa ProfileActivitySection.
 * Sirve para cancelar publicaciones activas y conservar historial visual.
 */
function OwnPostActivityCard({ onPostCancel, post }: OwnPostActivityCardProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black">{postTypeLabels[post.postType]}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatScheduledDateTime(
              post.scheduledDate,
              post.scheduledStartTime,
              post.scheduledEndTime,
            )}
          </p>
        </div>
        <Chip tone={post.isActive ? "lime" : "danger"}>
          {post.isActive ? "Activa" : "Cancelada"}
        </Chip>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip icon={MapPin}>{post.placeText}</Chip>
        {post.postType === "looking_for_player" ? (
          <Chip icon={UsersRound}>Faltan {post.missingPlayersCount}</Chip>
        ) : null}
      </div>

      {post.isActive ? (
        <Button
          icon={X}
          onClick={() => onPostCancel(post.postId)}
          variant="danger"
        >
          Cancelar publicacion
        </Button>
      ) : null}
    </div>
  );
}

interface InvitationActivityCardProps {
  database: PadelitoLocalDatabase;
  invitation: DirectMatchInvitation;
  mode: "sent" | "received";
  onDirectInvitationStatusChange: (
    invitationId: string,
    status: "accepted" | "rejected",
  ) => void;
  onDirectInvitationCancel: (invitationId: string) => void;
  onPrivateContactOpen: (profileId: string) => void;
}

/**
 * Card contextual de invitacion directa.
 * Se construye para mostrar partido, jugador y estado en perfil.
 * La usa ProfileActivitySection en invitaciones enviadas y recibidas.
 * Sirve para responder invitaciones y entender si ya impactaron en un cupo.
 */
function InvitationActivityCard({
  database,
  invitation,
  mode,
  onDirectInvitationCancel,
  onDirectInvitationStatusChange,
  onPrivateContactOpen,
}: InvitationActivityCardProps) {
  const relatedPost = invitation.relatedPostId
    ? database.posts.find((post) => post.postId === invitation.relatedPostId)
    : null;
  const inviterProfile = database.profiles.find(
    (profile) => profile.profileId === invitation.inviterProfileId,
  );
  const invitedProfile = database.profiles.find(
    (profile) => profile.profileId === invitation.invitedProfileId,
  );
  const relatedProfile = mode === "sent" ? invitedProfile : inviterProfile;
  const statusLabel = invitationStatusLabels[invitation.status];
  const statusTone =
    invitation.status === "accepted"
      ? "success"
      : invitation.status === "rejected" || invitation.status === "cancelled"
        ? "danger"
        : "lime";

  return (
    <div className="grid gap-3 rounded-lg border border-border-subtle bg-surface-secondary p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-accent-lime">
            {mode === "sent" ? "Invitacion enviada" : "Invitacion recibida"}
          </p>
          <h4 className="mt-1 text-sm font-black">
            Partido {playStyleLabels[invitation.desiredPlayStyle]}
          </h4>
        </div>
        <Chip tone={statusTone}>{statusLabel}</Chip>
      </div>

      <div className="flex flex-wrap gap-2">
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
            {mode === "sent" ? "Invitado" : "Invita"}:{" "}
            {relatedProfile.displayName}
          </Chip>
        ) : null}
      </div>

      {invitation.status === "accepted" && relatedProfile ? (
        <div className="grid gap-2">
          {mode === "sent" ? (
            <p className="text-sm leading-6 text-feedback-success">
              Aceptaron tu invitacion para este partido.
            </p>
          ) : null}
          <Button
            icon={MessageCircle}
            onClick={() => onPrivateContactOpen(relatedProfile.profileId)}
            variant="secondary"
          >
            WhatsApp
          </Button>
        </div>
      ) : null}

      {invitation.status === "pending" ? (
        <div className="flex flex-wrap gap-2">
          {mode === "received" ? (
            <>
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
            </>
          ) : (
            <Button
              icon={X}
              onClick={() => onDirectInvitationCancel(invitation.invitationId)}
              variant="danger"
            >
              Cancelar invitacion
            </Button>
          )}
        </div>
      ) : null}
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
  onPrivateContactOpen: (profileId: string) => void;
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
  onPrivateContactOpen,
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

      {request.status === "accepted" && relatedProfile ? (
        <div className="grid gap-2">
          {mode === "sent" ? (
            <p className="text-sm leading-6 text-feedback-success">
              Te aceptaron para este partido.
            </p>
          ) : null}
          <Button
            icon={MessageCircle}
            onClick={() => onPrivateContactOpen(relatedProfile.profileId)}
            variant="secondary"
          >
            WhatsApp
          </Button>
        </div>
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
