import type { EventInteractionType } from "../../domain/enums/postEnums";
import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  DirectMatchInvitation,
  LookingForPlayerPost,
  MatchJoinRequest,
  Post,
} from "../../domain/models/postModels";
import type { Profile } from "../../domain/models/profileModels";
import { createCurrentIsoDate } from "../../utils/dateFormatters";
import { createEntityIdentifier } from "../../utils/identifierGenerator";
import type { PadelitoLocalDatabase } from "./localPadelitoDatabase";
import type { CreateInvitationInput } from "./padelitoRepository";

export type { CreateInvitationInput } from "./padelitoRepository";

const CONFIRMED_PLAYERS_TEXT_LIMIT = 180;

/**
 * Obtiene el perfil de sesion actual.
 * Se construye para aislar lectura de sesion local.
 * Lo usan pantallas y hooks de aplicacion.
 * Sirve para decidir si mostrar auth, onboarding o MVP principal.
 */
export function getSessionProfile(database: PadelitoLocalDatabase) {
  return (
    database.profiles.find(
      (profile) => profile.profileId === database.sessionProfileId,
    ) ?? null
  );
}

/**
 * Inicia sesion local con un perfil demo.
 * Se construye para validar auth simple sin pedir credenciales.
 * Lo usa AuthScreen desde el hook principal.
 * Sirve para desbloquear onboarding y flujos del MVP.
 */
export function signInWithDemoProfile(database: PadelitoLocalDatabase) {
  return {
    ...database,
    sessionProfileId: "profile_current_player",
  };
}

/**
 * Actualiza el perfil propio.
 * Se construye para reutilizar guardado entre onboarding y perfil.
 * Lo usan formularios de perfil.
 * Sirve para completar datos del jugador u organizacion.
 */
export function updateOwnProfile(
  database: PadelitoLocalDatabase,
  updatedProfile: Profile,
) {
  const updatedTimestamp = createCurrentIsoDate();

  return {
    ...database,
    profiles: database.profiles.map((profile) =>
      profile.profileId === updatedProfile.profileId
        ? {
            ...updatedProfile,
            updatedAt: updatedTimestamp,
            isOnboardingComplete: true,
          }
        : profile,
    ),
  };
}

/**
 * Alterna seguimiento entre dos perfiles.
 * Se construye para cubrir el sistema social sin amistad mutua.
 * Lo usan cards de autor y pantalla de perfil.
 * Sirve para alimentar el feed Siguiendo y notificar nuevos seguidores.
 */
export function toggleFollowProfile(
  database: PadelitoLocalDatabase,
  followerProfileId: string,
  followedProfileId: string,
) {
  const existingFollow = database.follows.find(
    (followRelation) =>
      followRelation.followerProfileId === followerProfileId &&
      followRelation.followedProfileId === followedProfileId,
  );

  if (existingFollow) {
    return {
      ...database,
      follows: database.follows.filter(
        (followRelation) => followRelation !== existingFollow,
      ),
    };
  }

  const createdAt = createCurrentIsoDate();
  const notification = createNotification({
    recipientProfileId: followedProfileId,
    actorProfileId: followerProfileId,
    notificationType: "new_follower",
    title: "Nuevo seguidor",
    body: "Alguien empezo a seguir tu actividad.",
  });

  return {
    ...database,
    follows: [
      ...database.follows,
      {
        followerProfileId,
        followedProfileId,
        createdAt,
      },
    ],
    notifications: [...database.notifications, notification],
  };
}

/**
 * Devuelve publicaciones visibles por tab.
 * Se construye para centralizar reglas de Comunidad y Siguiendo.
 * Lo usan pantallas de feed.
 * Sirve para respetar visibilidad publica y followers_only.
 */
export function getVisiblePostsForFeed(
  database: PadelitoLocalDatabase,
  viewerProfileId: string,
  feedTabIdentifier: "community" | "following",
) {
  const followedProfileIds = database.follows
    .filter(
      (followRelation) => followRelation.followerProfileId === viewerProfileId,
    )
    .map((followRelation) => followRelation.followedProfileId);

  return database.posts
    .filter((post) => post.isActive)
    .filter((post) => {
      if (feedTabIdentifier === "community") {
        return post.visibility === "public";
      }

      return (
        post.authorProfileId === viewerProfileId ||
        followedProfileIds.includes(post.authorProfileId)
      );
    })
    .filter((post) => {
      if (post.visibility === "public") {
        return true;
      }

      return (
        post.authorProfileId === viewerProfileId ||
        followedProfileIds.includes(post.authorProfileId)
      );
    })
    .sort((firstPost, secondPost) =>
      firstPost.scheduledDate.localeCompare(secondPost.scheduledDate),
    );
}

/**
 * Crea una publicacion local.
 * Se construye para validar formularios por tipo antes de persistir en Supabase.
 * Lo usan formularios de creacion.
 * Sirve para alimentar feeds y perfil con datos reales de usuario.
 */
export function createPost(database: PadelitoLocalDatabase, post: Post) {
  return {
    ...database,
    posts: [post, ...database.posts],
  };
}

/**
 * Crea solicitud para unirse a un partido.
 * Se construye para cubrir el flujo central de Busco jugador.
 * Lo usan cards looking_for_player.
 * Sirve para notificar al creador y registrar estado pendiente.
 */
export function createMatchJoinRequest(
  database: PadelitoLocalDatabase,
  postId: string,
  requesterProfileId: string,
  message?: string,
) {
  const requestedPost = database.posts.find((post) => post.postId === postId);

  if (!requestedPost || requestedPost.postType !== "looking_for_player") {
    return database;
  }

  const existingRequest = database.matchJoinRequests.find(
    (matchJoinRequest) =>
      matchJoinRequest.postId === postId &&
      matchJoinRequest.requesterProfileId === requesterProfileId,
  );

  if (existingRequest && existingRequest.status !== "cancelled") {
    return database;
  }

  const currentTimestamp = createCurrentIsoDate();
  const requestId =
    existingRequest?.requestId ?? createEntityIdentifier("request");
  const request: MatchJoinRequest = {
    requestId,
    postId,
    requesterProfileId,
    ownerProfileId: requestedPost.authorProfileId,
    status: "pending",
    message,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  };

  const notification = createNotification({
    recipientProfileId: requestedPost.authorProfileId,
    actorProfileId: requesterProfileId,
    notificationType: "match_join_request_received",
    relatedPostId: postId,
    relatedRequestId: request.requestId,
    title: "Nueva postulacion",
    body: "Un jugador quiere sumarse a tu partido.",
  });

  return {
    ...database,
    matchJoinRequests: existingRequest
      ? database.matchJoinRequests.map((matchJoinRequest) =>
          matchJoinRequest.requestId === existingRequest.requestId
            ? request
            : matchJoinRequest,
        )
      : [...database.matchJoinRequests, request],
    notifications: [...database.notifications, notification],
  };
}

/**
 * Cancela una solicitud pendiente propia.
 * Se construye para permitir arrepentimiento sin bloquear al jugador.
 * Lo usan cards y actividad de perfil.
 * Sirve para que el solicitante pueda retirar su postulacion antes de una respuesta.
 */
export function cancelMatchJoinRequest(
  database: PadelitoLocalDatabase,
  requestId: string,
  requesterProfileId: string,
) {
  return {
    ...database,
    matchJoinRequests: database.matchJoinRequests.map((matchJoinRequest) =>
      matchJoinRequest.requestId === requestId &&
      matchJoinRequest.requesterProfileId === requesterProfileId &&
      matchJoinRequest.status === "pending"
        ? {
            ...matchJoinRequest,
            status: "cancelled" as const,
            updatedAt: createCurrentIsoDate(),
          }
        : matchJoinRequest,
    ),
  };
}

/**
 * Actualiza estado de una solicitud.
 * Se construye para que el creador acepte o rechace postulantes.
 * Lo usan actividad de perfil y notificaciones.
 * Sirve para cerrar el ciclo de postulacion.
 */
export function updateMatchJoinRequestStatus(
  database: PadelitoLocalDatabase,
  requestId: string,
  status: "accepted" | "rejected",
) {
  const request = database.matchJoinRequests.find(
    (matchJoinRequest) => matchJoinRequest.requestId === requestId,
  );

  if (!request) {
    return database;
  }

  if (request.status !== "pending") {
    return database;
  }

  if (status === "accepted" && !canAcceptPlayerOnPost(database.posts, request.postId)) {
    return database;
  }

  const currentTimestamp = createCurrentIsoDate();
  const requesterProfile = database.profiles.find(
    (profile) => profile.profileId === request.requesterProfileId,
  );
  const notification = createNotification({
    recipientProfileId: request.requesterProfileId,
    actorProfileId: request.ownerProfileId,
    notificationType:
      status === "accepted"
        ? "match_join_request_accepted"
        : "match_join_request_rejected",
    relatedPostId: request.postId,
    relatedRequestId: request.requestId,
    title: status === "accepted" ? "Solicitud aceptada" : "Solicitud rechazada",
    body:
      status === "accepted"
        ? "Aceptaron tu solicitud para sumarte al partido."
        : "Rechazaron tu solicitud para este partido.",
  });

  return {
    ...database,
    posts:
      status === "accepted"
        ? updateAcceptedPlayerOnPost(
            database.posts,
            request.postId,
            requesterProfile?.displayName,
            currentTimestamp,
          )
        : database.posts,
    matchJoinRequests: database.matchJoinRequests.map((matchJoinRequest) =>
      matchJoinRequest.requestId === requestId
        ? {
            ...matchJoinRequest,
            status,
            updatedAt: currentTimestamp,
          }
        : matchJoinRequest,
    ),
    notifications: [...database.notifications, notification],
  };
}

/**
 * Crea invitacion directa a partido.
 * Se construye para conectar perfiles con disponibilidad concreta.
 * Lo usan perfil y cards de Estoy disponible.
 * Sirve para notificar al destinatario y registrar respuesta pendiente.
 */
export function createDirectMatchInvitation(
  database: PadelitoLocalDatabase,
  inviterProfileId: string,
  invitationInput: CreateInvitationInput,
) {
  const relatedPost = invitationInput.relatedPostId
    ? database.posts.find(
        (post): post is LookingForPlayerPost =>
          post.postId === invitationInput.relatedPostId &&
          post.authorProfileId === inviterProfileId &&
          post.postType === "looking_for_player" &&
          post.isActive &&
          post.missingPlayersCount > 0,
      )
    : undefined;

  if (invitationInput.relatedPostId && !relatedPost) {
    return database;
  }

  const currentTimestamp = createCurrentIsoDate();
  const invitation: DirectMatchInvitation = {
    invitationId: createEntityIdentifier("invitation"),
    inviterProfileId,
    invitedProfileId: invitationInput.invitedProfileId,
    relatedPostId: relatedPost?.postId,
    scheduledDate: relatedPost?.scheduledDate ?? invitationInput.scheduledDate,
    scheduledStartTime:
      relatedPost?.scheduledStartTime ?? invitationInput.scheduledStartTime,
    placeText: relatedPost?.placeText ?? invitationInput.placeText,
    desiredPlayStyle:
      relatedPost?.desiredPlayStyle ?? invitationInput.desiredPlayStyle,
    note: invitationInput.note,
    status: "pending",
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  };

  const notification = createNotification({
    recipientProfileId: invitation.invitedProfileId,
    actorProfileId: inviterProfileId,
    notificationType: "direct_match_invitation_received",
    relatedPostId: invitation.relatedPostId,
    relatedInvitationId: invitation.invitationId,
    title: "Invitacion a partido",
    body: "Recibiste una invitacion directa para jugar.",
  });

  return {
    ...database,
    directMatchInvitations: [
      ...database.directMatchInvitations,
      invitation,
    ],
    notifications: [...database.notifications, notification],
  };
}

/**
 * Actualiza respuesta a invitacion directa.
 * Se construye para cerrar el flujo de invitaciones.
 * Lo usan perfil y notificaciones.
 * Sirve para avisar al invitador si aceptaron o rechazaron.
 */
export function updateDirectMatchInvitationStatus(
  database: PadelitoLocalDatabase,
  invitationId: string,
  status: "accepted" | "rejected",
) {
  const invitation = database.directMatchInvitations.find(
    (directMatchInvitation) =>
      directMatchInvitation.invitationId === invitationId,
  );

  if (!invitation) {
    return database;
  }

  if (invitation.status !== "pending") {
    return database;
  }

  if (
    status === "accepted" &&
    invitation.relatedPostId &&
    !canAcceptPlayerOnPost(database.posts, invitation.relatedPostId)
  ) {
    return database;
  }

  const currentTimestamp = createCurrentIsoDate();
  const invitedProfile = database.profiles.find(
    (profile) => profile.profileId === invitation.invitedProfileId,
  );
  const notification = createNotification({
    recipientProfileId: invitation.inviterProfileId,
    actorProfileId: invitation.invitedProfileId,
    notificationType:
      status === "accepted"
        ? "direct_match_invitation_accepted"
        : "direct_match_invitation_rejected",
    relatedPostId: invitation.relatedPostId,
    relatedInvitationId: invitation.invitationId,
    title:
      status === "accepted" ? "Invitacion aceptada" : "Invitacion rechazada",
    body:
      status === "accepted"
        ? "Aceptaron tu invitacion para jugar."
        : "Rechazaron tu invitacion para este partido.",
  });

  return {
    ...database,
    posts:
      status === "accepted" && invitation.relatedPostId
        ? updateAcceptedPlayerOnPost(
            database.posts,
            invitation.relatedPostId,
            invitedProfile?.displayName,
            currentTimestamp,
          )
        : database.posts,
    directMatchInvitations: database.directMatchInvitations.map(
      (directMatchInvitation) =>
        directMatchInvitation.invitationId === invitationId
          ? {
              ...directMatchInvitation,
              status,
              updatedAt: currentTimestamp,
            }
          : directMatchInvitation,
    ),
    notifications: [...database.notifications, notification],
  };
}

/**
 * Alterna interes o asistencia en eventos.
 * Se construye para cubrir contadores del MVP.
 * Lo usan cards de evento.
 * Sirve para alimentar actividad del perfil.
 */
export function toggleEventInteraction(
  database: PadelitoLocalDatabase,
  postId: string,
  profileId: string,
  interactionType: EventInteractionType,
) {
  const existingInteraction = database.postInteractions.find(
    (postInteraction) =>
      postInteraction.postId === postId &&
      postInteraction.profileId === profileId &&
      postInteraction.interactionType === interactionType,
  );

  if (existingInteraction) {
    return {
      ...database,
      postInteractions: database.postInteractions.filter(
        (postInteraction) => postInteraction !== existingInteraction,
      ),
    };
  }

  return {
    ...database,
    postInteractions: [
      ...database.postInteractions,
      {
        interactionId: createEntityIdentifier("interaction"),
        postId,
        profileId,
        interactionType,
        createdAt: createCurrentIsoDate(),
      },
    ],
  };
}

/**
 * Marca notificaciones como leidas.
 * Se construye para mantener bandeja interna simple.
 * Lo usa NotificationScreen.
 * Sirve para separar avisos pendientes de historicos.
 */
export function markNotificationsAsRead(
  database: PadelitoLocalDatabase,
  recipientProfileId: string,
) {
  const readAt = createCurrentIsoDate();

  return {
    ...database,
    notifications: database.notifications.map((notification) =>
      notification.recipientProfileId === recipientProfileId &&
      !notification.readAt
        ? {
            ...notification,
            readAt,
          }
        : notification,
    ),
  };
}

/**
 * Oculta el paso de acceso rapido.
 * Se construye para respetar el CTA post-onboarding sin bloquear el uso.
 * Lo usa QuickAccessOnboardingStep.
 * Sirve para recordar la decision local del usuario.
 */
export function dismissQuickAccessPrompt(database: PadelitoLocalDatabase) {
  return {
    ...database,
    quickAccessPromptDismissed: true,
  };
}

/**
 * Crea una notificacion interna.
 * Se construye para centralizar estructura repetida.
 * Lo usan operaciones sociales del repositorio local.
 * Sirve para mantener mensajes consistentes.
 */
function createNotification(
  notificationInput: Omit<InternalNotification, "notificationId" | "createdAt">,
): InternalNotification {
  return {
    ...notificationInput,
    notificationId: createEntityIdentifier("notification"),
    createdAt: createCurrentIsoDate(),
  };
}

/**
 * Verifica si un partido todavia tiene cupo para aceptar jugadores.
 * Se construye para evitar confirmaciones sobre publicaciones ya completas.
 * Lo usan respuestas locales de solicitudes e invitaciones.
 * Sirve para mantener cupos consistentes ante acciones repetidas.
 */
function canAcceptPlayerOnPost(posts: Post[], postId: string) {
  const post = posts.find((candidatePost) => candidatePost.postId === postId);

  return (
    Boolean(post) &&
    post?.postType === "looking_for_player" &&
    post.isActive &&
    post.missingPlayersCount > 0
  );
}

/**
 * Actualiza el cupo de un partido cuando se acepta un jugador.
 * Se construye para que solicitudes e invitaciones compartan la misma regla.
 * Lo usan las respuestas aceptadas del repositorio local.
 * Sirve para marcar completo el partido cuando ya no faltan jugadores.
 */
function updateAcceptedPlayerOnPost(
  posts: Post[],
  postId: string,
  acceptedPlayerName: string | undefined,
  updatedTimestamp: string,
) {
  return posts.map((post) => {
    if (post.postId !== postId || post.postType !== "looking_for_player") {
      return post;
    }

    return updateLookingForPlayerPostAfterAcceptance(
      post,
      acceptedPlayerName,
      updatedTimestamp,
    );
  });
}

/**
 * Reduce cupo y agrega al jugador confirmado.
 * Se construye para mantener consistente la card de Busco jugador.
 * Lo usa updateAcceptedPlayerOnPost.
 * Sirve para reflejar aceptaciones sin perder el historial visible.
 */
function updateLookingForPlayerPostAfterAcceptance(
  post: LookingForPlayerPost,
  acceptedPlayerName: string | undefined,
  updatedTimestamp: string,
): LookingForPlayerPost {
  const nextMissingPlayersCount = Math.max(post.missingPlayersCount - 1, 0);

  return {
    ...post,
    missingPlayersCount: nextMissingPlayersCount,
    confirmedPlayersText: appendConfirmedPlayerName(
      post.confirmedPlayersText,
      acceptedPlayerName,
    ),
    isActive: nextMissingPlayersCount > 0,
    updatedAt: updatedTimestamp,
  };
}

/**
 * Agrega un nombre al texto de confirmados evitando duplicados simples.
 * Se construye porque el MVP todavia guarda confirmados como texto compacto.
 * Lo usan actualizaciones locales de cupo.
 * Sirve para mostrar rapidamente quienes ya estan dentro del partido.
 */
function appendConfirmedPlayerName(
  confirmedPlayersText: string | undefined,
  acceptedPlayerName: string | undefined,
) {
  const normalizedPlayerName = acceptedPlayerName?.trim();

  if (!normalizedPlayerName) {
    return confirmedPlayersText;
  }

  if (
    confirmedPlayersText
      ?.toLowerCase()
      .includes(normalizedPlayerName.toLowerCase())
  ) {
    return confirmedPlayersText;
  }

  const nextConfirmedPlayersText = confirmedPlayersText?.trim()
    ? `${confirmedPlayersText}, ${normalizedPlayerName}`
    : normalizedPlayerName;

  return nextConfirmedPlayersText.slice(0, CONFIRMED_PLAYERS_TEXT_LIMIT);
}
