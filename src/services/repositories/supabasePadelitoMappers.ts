import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  DirectMatchInvitation,
  MatchJoinRequest,
  Post,
  PostInteraction,
} from "../../domain/models/postModels";
import type { FollowRelation, Profile } from "../../domain/models/profileModels";
import type {
  SupabaseDirectMatchInvitationInsert,
  SupabaseDirectMatchInvitationRow,
  SupabaseFollowInsert,
  SupabaseFollowRow,
  SupabaseMatchJoinRequestInsert,
  SupabaseMatchJoinRequestRow,
  SupabaseNotificationInsert,
  SupabaseNotificationRow,
  SupabasePostInsert,
  SupabasePostInteractionInsert,
  SupabasePostInteractionRow,
  SupabasePostRow,
  SupabaseProfileRow,
  SupabaseProfileUpsert,
} from "./supabasePadelitoTypes";

/**
 * Convierte null de base de datos en undefined de dominio.
 * Se construye para mantener modelos de UI limpios.
 * Lo usan todos los mappers Supabase.
 * Sirve para evitar condicionales repetidos en componentes.
 */
function nullToUndefined<ValueType>(value: ValueType | null): ValueType | undefined {
  return value ?? undefined;
}

/**
 * Convierte strings opcionales a null para Supabase.
 * Se construye para persistir campos vacios de forma consistente.
 * Lo usan mappers de escritura.
 * Sirve para respetar constraints SQL con campos opcionales.
 */
function optionalTextToNull(value?: string): string | null {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

/**
 * Normaliza tiempos SQL a formato de formulario.
 * Se construye porque Postgres puede devolver `HH:MM:SS`.
 * Lo usan mappers de publicaciones e invitaciones.
 * Sirve para conservar compatibilidad con inputs `time`.
 */
function normalizeTimeValue(timeValue: string): string {
  return timeValue.slice(0, 5);
}

/**
 * Exige campos que el dominio necesita para cada variante.
 * Se construye para detectar temprano datos inconsistentes del backend.
 * Lo usan mappers de perfiles y publicaciones.
 * Sirve para fallar con mensaje claro en vez de renderizar datos incompletos.
 */
function requireDatabaseValue<ValueType>(
  value: ValueType | null,
  fieldName: string,
): ValueType {
  if (value === null) {
    throw new Error(`Falta el campo requerido de Supabase: ${fieldName}`);
  }

  return value;
}

/**
 * Convierte una fila Supabase de perfil a modelo de dominio.
 * Se construye para aislar snake_case y campos nulos.
 * Lo usa el repositorio Supabase.
 * Sirve para alimentar UI con modelos estables.
 */
export function mapSupabaseProfileRow(row: SupabaseProfileRow): Profile {
  const baseProfile = {
    profileId: row.id,
    profileType: row.profile_type,
    displayName: row.display_name,
    avatarUrl: nullToUndefined(row.avatar_url),
    bio: nullToUndefined(row.bio),
    whatsappPhone: nullToUndefined(row.whatsapp_phone),
    usualPlace: nullToUndefined(row.usual_place),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isOnboardingComplete: true,
  };

  if (row.profile_type === "player") {
    return {
      ...baseProfile,
      profileType: "player",
      playerLevel: requireDatabaseValue(row.player_level, "player_level"),
      preferredPosition: requireDatabaseValue(
        row.preferred_position,
        "preferred_position",
      ),
      preferredPlayStyle: requireDatabaseValue(
        row.preferred_play_style,
        "preferred_play_style",
      ),
    };
  }

  return {
    ...baseProfile,
    profileType: "organization",
    organizationKind: requireDatabaseValue(
      row.organization_kind,
      "organization_kind",
    ),
    organizationLink: nullToUndefined(row.organization_link),
  };
}

/**
 * Convierte un perfil de dominio a upsert Supabase.
 * Se construye para persistir onboarding y edicion de perfil.
 * Lo usa el repositorio Supabase.
 * Sirve para mantener validaciones por tipo de perfil.
 */
export function mapProfileToSupabaseUpsert(
  profile: Profile,
): SupabaseProfileUpsert {
  return {
    id: profile.profileId,
    profile_type: profile.profileType,
    display_name: profile.displayName,
    avatar_url: optionalTextToNull(profile.avatarUrl),
    bio: optionalTextToNull(profile.bio),
    whatsapp_phone: optionalTextToNull(profile.whatsappPhone),
    usual_place: optionalTextToNull(profile.usualPlace),
    player_level: profile.profileType === "player" ? profile.playerLevel : null,
    preferred_position:
      profile.profileType === "player" ? profile.preferredPosition : null,
    preferred_play_style:
      profile.profileType === "player" ? profile.preferredPlayStyle : null,
    organization_kind:
      profile.profileType === "organization" ? profile.organizationKind : null,
    organization_link:
      profile.profileType === "organization"
        ? optionalTextToNull(profile.organizationLink)
        : null,
  };
}

/**
 * Convierte una fila Supabase de seguimiento a dominio.
 * Se construye para separar relaciones sociales del cliente SQL.
 * Lo usa el repositorio Supabase.
 * Sirve para calcular seguidores y feed Siguiendo.
 */
export function mapSupabaseFollowRow(row: SupabaseFollowRow): FollowRelation {
  return {
    followerProfileId: row.follower_profile_id,
    followedProfileId: row.followed_profile_id,
    createdAt: row.created_at,
  };
}

/**
 * Convierte una relacion de seguimiento a insert Supabase.
 * Se construye para reutilizar escritura de follow.
 * Lo usa el repositorio Supabase.
 * Sirve para evitar repetir nombres de columnas.
 */
export function mapFollowToSupabaseInsert(
  followRelation: Omit<FollowRelation, "createdAt">,
): SupabaseFollowInsert {
  return {
    follower_profile_id: followRelation.followerProfileId,
    followed_profile_id: followRelation.followedProfileId,
  };
}

/**
 * Convierte una fila Supabase de publicacion a dominio.
 * Se construye para resolver la union discriminada por `post_type`.
 * Lo usa el repositorio Supabase.
 * Sirve para que las cards trabajen con tipos seguros.
 */
export function mapSupabasePostRow(row: SupabasePostRow): Post {
  const basePost = {
    postId: row.id,
    authorProfileId: row.author_profile_id,
    postType: row.post_type,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledDate: row.scheduled_date,
    scheduledStartTime: normalizeTimeValue(row.scheduled_start_time),
    scheduledEndTime: row.scheduled_end_time
      ? normalizeTimeValue(row.scheduled_end_time)
      : undefined,
    placeText: row.place_text,
    shortNote: nullToUndefined(row.short_note),
    isActive: row.is_active,
  };

  if (row.post_type === "looking_for_player") {
    return {
      ...basePost,
      postType: "looking_for_player",
      desiredLevel: requireDatabaseValue(row.desired_level, "desired_level"),
      desiredPosition: requireDatabaseValue(
        row.desired_position,
        "desired_position",
      ),
      desiredPlayStyle: requireDatabaseValue(
        row.desired_play_style,
        "desired_play_style",
      ),
      missingPlayersCount: requireDatabaseValue(
        row.missing_players_count,
        "missing_players_count",
      ),
      confirmedPlayersText: nullToUndefined(row.confirmed_players_text),
    };
  }

  if (row.post_type === "available_to_play") {
    return {
      ...basePost,
      postType: "available_to_play",
      availableLevel: requireDatabaseValue(
        row.available_level,
        "available_level",
      ),
      availablePosition: requireDatabaseValue(
        row.available_position,
        "available_position",
      ),
      availablePlayStyle: requireDatabaseValue(
        row.available_play_style,
        "available_play_style",
      ),
      preferredPlaceText: nullToUndefined(row.preferred_place_text),
    };
  }

  return {
    ...basePost,
    postType: "event",
    title: requireDatabaseValue(row.title, "title"),
    description: requireDatabaseValue(row.description, "description"),
    imageUrl: nullToUndefined(row.image_url),
    whatsappUrl: nullToUndefined(row.whatsapp_url),
    registrationUrl: nullToUndefined(row.registration_url),
    googleMapsUrl: nullToUndefined(row.google_maps_url),
  };
}

/**
 * Convierte una publicacion de dominio a insert Supabase.
 * Se construye para preparar la etapa de persistencia real.
 * Lo usa el repositorio Supabase.
 * Sirve para guardar cada variante con columnas especificas.
 */
export function mapPostToSupabaseInsert(post: Post): SupabasePostInsert {
  const baseInsert: SupabasePostInsert = {
    author_profile_id: post.authorProfileId,
    post_type: post.postType,
    visibility: post.visibility,
    scheduled_date: post.scheduledDate,
    scheduled_start_time: post.scheduledStartTime,
    scheduled_end_time: post.scheduledEndTime ?? null,
    place_text: post.placeText,
    short_note: optionalTextToNull(post.shortNote),
    is_active: post.isActive,
    desired_level: null,
    desired_position: null,
    desired_play_style: null,
    missing_players_count: null,
    confirmed_players_text: null,
    available_level: null,
    available_position: null,
    available_play_style: null,
    preferred_place_text: null,
    title: null,
    description: null,
    image_url: null,
    whatsapp_url: null,
    registration_url: null,
    google_maps_url: null,
  };

  if (post.postType === "looking_for_player") {
    return {
      ...baseInsert,
      desired_level: post.desiredLevel,
      desired_position: post.desiredPosition,
      desired_play_style: post.desiredPlayStyle,
      missing_players_count: post.missingPlayersCount,
      confirmed_players_text: optionalTextToNull(post.confirmedPlayersText),
    };
  }

  if (post.postType === "available_to_play") {
    return {
      ...baseInsert,
      available_level: post.availableLevel,
      available_position: post.availablePosition,
      available_play_style: post.availablePlayStyle,
      preferred_place_text: optionalTextToNull(post.preferredPlaceText),
    };
  }

  return {
    ...baseInsert,
    title: post.title,
    description: post.description,
    image_url: optionalTextToNull(post.imageUrl),
    whatsapp_url: optionalTextToNull(post.whatsappUrl),
    registration_url: optionalTextToNull(post.registrationUrl),
    google_maps_url: optionalTextToNull(post.googleMapsUrl),
  };
}

/**
 * Convierte una fila de interaccion a dominio.
 * Se construye para mantener eventos guardados desacoplados de Supabase.
 * Lo usa el repositorio Supabase.
 * Sirve para actividad de perfil y contadores de cards.
 */
export function mapSupabasePostInteractionRow(
  row: SupabasePostInteractionRow,
): PostInteraction {
  return {
    interactionId: row.id,
    postId: row.post_id,
    profileId: row.profile_id,
    interactionType: row.interaction_type,
    createdAt: row.created_at,
  };
}

/**
 * Convierte una interaccion a insert Supabase.
 * Se construye para reutilizar toggle de eventos.
 * Lo usa el repositorio Supabase.
 * Sirve para guardar interesados y asistentes.
 */
export function mapPostInteractionToSupabaseInsert(
  postInteraction: Omit<PostInteraction, "interactionId" | "createdAt">,
): SupabasePostInteractionInsert {
  return {
    post_id: postInteraction.postId,
    profile_id: postInteraction.profileId,
    interaction_type: postInteraction.interactionType,
  };
}

/**
 * Convierte una fila de solicitud a dominio.
 * Se construye para unificar solicitudes enviadas y recibidas.
 * Lo usa el repositorio Supabase.
 * Sirve para feed, perfil y notificaciones.
 */
export function mapSupabaseMatchJoinRequestRow(
  row: SupabaseMatchJoinRequestRow,
): MatchJoinRequest {
  return {
    requestId: row.id,
    postId: row.post_id,
    requesterProfileId: row.requester_profile_id,
    ownerProfileId: row.owner_profile_id,
    status: row.status,
    message: nullToUndefined(row.message),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convierte una solicitud a insert Supabase.
 * Se construye para registrar postulaciones reales.
 * Lo usa el repositorio Supabase.
 * Sirve para persistir solicitud y estado inicial.
 */
export function mapMatchJoinRequestToSupabaseInsert(
  matchJoinRequest: Omit<MatchJoinRequest, "requestId" | "createdAt" | "updatedAt">,
): SupabaseMatchJoinRequestInsert {
  return {
    post_id: matchJoinRequest.postId,
    requester_profile_id: matchJoinRequest.requesterProfileId,
    owner_profile_id: matchJoinRequest.ownerProfileId,
    status: matchJoinRequest.status,
    message: optionalTextToNull(matchJoinRequest.message),
  };
}

/**
 * Convierte una fila de invitacion directa a dominio.
 * Se construye para mostrar invitaciones desde ambos perfiles.
 * Lo usa el repositorio Supabase.
 * Sirve para mantener estado de invitacion consistente.
 */
export function mapSupabaseDirectMatchInvitationRow(
  row: SupabaseDirectMatchInvitationRow,
): DirectMatchInvitation {
  return {
    invitationId: row.id,
    inviterProfileId: row.inviter_profile_id,
    invitedProfileId: row.invited_profile_id,
    relatedPostId: nullToUndefined(row.related_post_id),
    scheduledDate: row.scheduled_date,
    scheduledStartTime: normalizeTimeValue(row.scheduled_start_time),
    placeText: row.place_text,
    desiredPlayStyle: row.desired_play_style,
    note: nullToUndefined(row.note),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convierte una invitacion a insert Supabase.
 * Se construye para persistir invitaciones directas.
 * Lo usa el repositorio Supabase.
 * Sirve para registrar destinatario, fecha y estilo.
 */
export function mapDirectMatchInvitationToSupabaseInsert(
  directMatchInvitation: Omit<
    DirectMatchInvitation,
    "invitationId" | "createdAt" | "updatedAt"
  >,
): SupabaseDirectMatchInvitationInsert {
  return {
    inviter_profile_id: directMatchInvitation.inviterProfileId,
    invited_profile_id: directMatchInvitation.invitedProfileId,
    related_post_id: directMatchInvitation.relatedPostId ?? null,
    scheduled_date: directMatchInvitation.scheduledDate,
    scheduled_start_time: directMatchInvitation.scheduledStartTime,
    place_text: directMatchInvitation.placeText,
    desired_play_style: directMatchInvitation.desiredPlayStyle,
    note: optionalTextToNull(directMatchInvitation.note),
    status: directMatchInvitation.status,
  };
}

/**
 * Convierte una fila de notificacion a dominio.
 * Se construye para aislar bandeja interna de la tabla SQL.
 * Lo usa el repositorio Supabase.
 * Sirve para renderizar avisos y contador pendiente.
 */
export function mapSupabaseNotificationRow(
  row: SupabaseNotificationRow,
): InternalNotification {
  return {
    notificationId: row.id,
    recipientProfileId: row.recipient_profile_id,
    actorProfileId: nullToUndefined(row.actor_profile_id),
    notificationType: row.notification_type,
    relatedPostId: nullToUndefined(row.related_post_id),
    relatedRequestId: nullToUndefined(row.related_request_id),
    relatedInvitationId: nullToUndefined(row.related_invitation_id),
    title: row.title,
    body: row.body,
    readAt: nullToUndefined(row.read_at),
    createdAt: row.created_at,
  };
}

/**
 * Convierte una notificacion a insert Supabase.
 * Se construye para centralizar mensajes internos generados por acciones.
 * Lo usa el repositorio Supabase.
 * Sirve para notificar solicitudes, respuestas e invitaciones.
 */
export function mapNotificationToSupabaseInsert(
  notification: Omit<InternalNotification, "notificationId" | "createdAt">,
): SupabaseNotificationInsert {
  return {
    recipient_profile_id: notification.recipientProfileId,
    actor_profile_id: notification.actorProfileId ?? null,
    notification_type: notification.notificationType,
    related_post_id: notification.relatedPostId ?? null,
    related_request_id: notification.relatedRequestId ?? null,
    related_invitation_id: notification.relatedInvitationId ?? null,
    title: notification.title,
    body: notification.body,
    read_at: notification.readAt ?? null,
  };
}
