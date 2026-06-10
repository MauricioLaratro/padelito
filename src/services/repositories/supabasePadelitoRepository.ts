import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventInteractionType } from "../../domain/enums/postEnums";
import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  DirectMatchInvitation,
  MatchJoinRequest,
} from "../../domain/models/postModels";
import type { Profile } from "../../domain/models/profileModels";
import { createCurrentIsoDate } from "../../utils/dateFormatters";
import {
  mapDirectMatchInvitationToSupabaseInsert,
  mapFollowToSupabaseInsert,
  mapMatchJoinRequestToSupabaseInsert,
  mapNotificationToSupabaseInsert,
  mapPostInteractionToSupabaseInsert,
  mapPostToSupabaseInsert,
  mapProfileToSupabaseUpsert,
  mapSupabaseDirectMatchInvitationRow,
  mapSupabaseFollowRow,
  mapSupabaseMatchJoinRequestRow,
  mapSupabaseNotificationRow,
  mapSupabasePostInteractionRow,
  mapSupabasePostRow,
  mapSupabaseProfileRow,
} from "./supabasePadelitoMappers";
import type {
  CreateInvitationInput,
  PadelitoRepository,
  PadelitoRepositorySnapshot,
} from "./padelitoRepository";
import { createEmptyRepositorySnapshot } from "./padelitoRepository";
import type {
  SupabaseDirectMatchInvitationInsert,
  SupabaseDirectMatchInvitationRow,
  SupabaseFollowRow,
  SupabaseMatchJoinRequestInsert,
  SupabaseMatchJoinRequestRow,
  SupabaseNotificationRow,
  SupabasePostInteractionRow,
  SupabasePostRow,
  SupabaseProfileRow,
} from "./supabasePadelitoTypes";

type SupabaseListQuery<RowType> = PromiseLike<{
  data: RowType[] | null;
  error: SupabaseRepositoryError | null;
}>;

type SupabaseSingleQuery<RowType> = PromiseLike<{
  data: RowType | null;
  error: SupabaseRepositoryError | null;
}>;

interface SupabaseRepositoryError {
  message: string;
}

/**
 * Crea un repositorio conectado a Supabase.
 * Se construye para reemplazar el repositorio local sin cambiar componentes.
 * Lo usara el hook principal cuando existan auth y variables de entorno.
 * Sirve para centralizar lectura, escritura y notificaciones remotas.
 */
export function createSupabasePadelitoRepository(
  supabaseClient: SupabaseClient,
): PadelitoRepository {
  /**
   * Carga el estado de aplicacion desde Supabase.
   * Se construye como snapshot para mantener simple la UI actual.
   * Lo usara usePadelitoMvp al activar backend real.
   * Sirve para hidratar feeds, perfil, solicitudes y notificaciones.
   */
  async function loadApplicationSnapshot(): Promise<PadelitoRepositorySnapshot> {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      throw createSupabaseError("obtener usuario autenticado", userError);
    }

    if (!user) {
      return createEmptySnapshot();
    }

    const [
      profileRows,
      followRows,
      postRows,
      postInteractionRows,
      matchJoinRequestRows,
      directMatchInvitationRows,
      notificationRows,
    ] = await Promise.all([
      readRows<SupabaseProfileRow>(
        supabaseClient
          .from("profiles")
          .select("*")
          .order("display_name")
          .returns<SupabaseProfileRow[]>(),
        "leer perfiles",
      ),
      readRows<SupabaseFollowRow>(
        supabaseClient
          .from("follows")
          .select("*")
          .returns<SupabaseFollowRow[]>(),
        "leer seguimientos",
      ),
      readRows<SupabasePostRow>(
        supabaseClient
          .from("posts")
          .select("*")
          .order("scheduled_date", { ascending: true })
          .order("scheduled_start_time", { ascending: true })
          .returns<SupabasePostRow[]>(),
        "leer publicaciones",
      ),
      readRows<SupabasePostInteractionRow>(
        supabaseClient
          .from("post_interactions")
          .select("*")
          .returns<SupabasePostInteractionRow[]>(),
        "leer interacciones",
      ),
      readRows<SupabaseMatchJoinRequestRow>(
        supabaseClient
          .from("match_join_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .returns<SupabaseMatchJoinRequestRow[]>(),
        "leer solicitudes",
      ),
      readRows<SupabaseDirectMatchInvitationRow>(
        supabaseClient
          .from("direct_match_invitations")
          .select("*")
          .order("created_at", { ascending: false })
          .returns<SupabaseDirectMatchInvitationRow[]>(),
        "leer invitaciones",
      ),
      readRows<SupabaseNotificationRow>(
        supabaseClient
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .returns<SupabaseNotificationRow[]>(),
        "leer notificaciones",
      ),
    ]);

    const profiles = profileRows.map(mapSupabaseProfileRow);
    const profilesWithSessionDraft = profiles.some(
      (profile) => profile.profileId === user.id,
    )
      ? profiles
      : [createDraftProfile(user.id, user.email), ...profiles];

    return {
      profiles: profilesWithSessionDraft,
      follows: followRows.map(mapSupabaseFollowRow),
      posts: postRows.map(mapSupabasePostRow),
      postInteractions: postInteractionRows.map(mapSupabasePostInteractionRow),
      matchJoinRequests: matchJoinRequestRows.map(
        mapSupabaseMatchJoinRequestRow,
      ),
      directMatchInvitations: directMatchInvitationRows.map(
        mapSupabaseDirectMatchInvitationRow,
      ),
      notifications: notificationRows.map(mapSupabaseNotificationRow),
      sessionProfileId: user.id,
      quickAccessPromptDismissed: false,
    };
  }

  /**
   * Guarda perfil propio en Supabase.
   * Se construye para persistir onboarding y edicion real.
   * Lo usara el formulario de perfil.
   * Sirve para crear o actualizar el registro vinculado a auth.users.
   */
  async function saveProfile(updatedProfile: Profile): Promise<void> {
    const { error } = await supabaseClient
      .from("profiles")
      .upsert(mapProfileToSupabaseUpsert(updatedProfile), { onConflict: "id" });

    if (error) {
      throw createSupabaseError("guardar perfil", error);
    }
  }

  /**
   * Crea una publicacion en Supabase.
   * Se construye para persistir el formulario de nueva publicacion.
   * Lo usara CreatePostModal.
   * Sirve para alimentar feeds reales despues de recargar snapshot.
   */
  async function createPost(post: Parameters<PadelitoRepository["createPost"]>[0]) {
    const { error } = await supabaseClient
      .from("posts")
      .insert(mapPostToSupabaseInsert(post));

    if (error) {
      throw createSupabaseError("crear publicacion", error);
    }
  }

  /**
   * Alterna seguimiento entre dos perfiles.
   * Se construye para mantener el feed Siguiendo con backend real.
   * Lo usan cards y perfiles.
   * Sirve para crear o borrar relacion social y notificar nuevos seguidores.
   */
  async function toggleFollowProfile(
    followerProfileId: string,
    followedProfileId: string,
  ): Promise<void> {
    if (followerProfileId === followedProfileId) {
      return;
    }

    const existingFollow = await readOptionalRow<SupabaseFollowRow>(
      supabaseClient
        .from("follows")
        .select("*")
        .eq("follower_profile_id", followerProfileId)
        .eq("followed_profile_id", followedProfileId)
        .returns<SupabaseFollowRow[]>()
        .maybeSingle(),
      "buscar seguimiento",
    );

    if (existingFollow) {
      const { error } = await supabaseClient
        .from("follows")
        .delete()
        .eq("follower_profile_id", followerProfileId)
        .eq("followed_profile_id", followedProfileId);

      if (error) {
        throw createSupabaseError("eliminar seguimiento", error);
      }

      return;
    }

    const { error } = await supabaseClient
      .from("follows")
      .insert(
        mapFollowToSupabaseInsert({
          followerProfileId,
          followedProfileId,
        }),
      );

    if (error) {
      throw createSupabaseError("crear seguimiento", error);
    }

    await createNotification({
      recipientProfileId: followedProfileId,
      actorProfileId: followerProfileId,
      notificationType: "new_follower",
      title: "Nuevo seguidor",
      body: "Alguien empezo a seguir tu actividad.",
    });
  }

  /**
   * Crea solicitud para unirse a partido.
   * Se construye para conectar postulantes con publicaciones Busco jugador.
   * Lo usan cards de partido.
   * Sirve para registrar estado pendiente y notificar al creador.
   */
  async function createMatchJoinRequest(
    postId: string,
    requesterProfileId: string,
    message?: string,
  ): Promise<void> {
    const requestedPost = await readOptionalRow<SupabasePostRow>(
      supabaseClient
        .from("posts")
        .select("*")
        .eq("id", postId)
        .returns<SupabasePostRow[]>()
        .maybeSingle(),
      "buscar publicacion para solicitud",
    );

    if (!requestedPost || requestedPost.post_type !== "looking_for_player") {
      return;
    }

    const existingRequest = await readOptionalRow<SupabaseMatchJoinRequestRow>(
      supabaseClient
        .from("match_join_requests")
        .select("*")
        .eq("post_id", postId)
        .eq("requester_profile_id", requesterProfileId)
        .returns<SupabaseMatchJoinRequestRow[]>()
        .maybeSingle(),
      "buscar solicitud existente",
    );

    if (existingRequest && existingRequest.status !== "cancelled") {
      return;
    }

    const requestInput: Omit<
      MatchJoinRequest,
      "requestId" | "createdAt" | "updatedAt"
    > = {
      postId,
      requesterProfileId,
      ownerProfileId: requestedPost.author_profile_id,
      status: "pending",
      message,
    };
    const savedRequest = existingRequest
      ? await updateExistingMatchJoinRequest(existingRequest.id, requestInput)
      : await insertMatchJoinRequest(requestInput);

    await createNotification({
      recipientProfileId: requestedPost.author_profile_id,
      actorProfileId: requesterProfileId,
      notificationType: "match_join_request_received",
      relatedPostId: postId,
      relatedRequestId: savedRequest.id,
      title: "Nueva postulacion",
      body: "Un jugador quiere sumarse a tu partido.",
    });
  }

  /**
   * Cancela una solicitud pendiente propia.
   * Se construye para permitir arrepentimiento con backend real.
   * Lo usan feed y perfil.
   * Sirve para retirar postulacion sin borrar historial.
   */
  async function cancelMatchJoinRequest(
    requestId: string,
    requesterProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("match_join_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("requester_profile_id", requesterProfileId)
      .eq("status", "pending");

    if (error) {
      throw createSupabaseError("cancelar solicitud", error);
    }
  }

  /**
   * Responde una solicitud recibida.
   * Se construye para que el creador del partido acepte o rechace.
   * Lo usa la actividad del perfil.
   * Sirve para notificar al postulante el resultado.
   */
  async function updateMatchJoinRequestStatus(
    requestId: string,
    status: "accepted" | "rejected",
  ): Promise<void> {
    const request = await readOptionalRow<SupabaseMatchJoinRequestRow>(
      supabaseClient
        .from("match_join_requests")
        .select("*")
        .eq("id", requestId)
        .returns<SupabaseMatchJoinRequestRow[]>()
        .maybeSingle(),
      "buscar solicitud para responder",
    );

    if (!request || request.status !== "pending") {
      return;
    }

    const { error: answerRequestError } = await supabaseClient.rpc(
      "answer_match_join_request",
      {
        request_id_input: requestId,
        status_input: status,
      },
    );

    if (answerRequestError) {
      throw createSupabaseError("responder solicitud", answerRequestError);
    }

    await createNotification({
      recipientProfileId: request.requester_profile_id,
      actorProfileId: request.owner_profile_id,
      notificationType:
        status === "accepted"
          ? "match_join_request_accepted"
          : "match_join_request_rejected",
      relatedPostId: request.post_id,
      relatedRequestId: request.id,
      title: status === "accepted" ? "Solicitud aceptada" : "Solicitud rechazada",
      body:
        status === "accepted"
          ? "Aceptaron tu solicitud para sumarte al partido."
          : "Rechazaron tu solicitud para este partido.",
    });
  }

  /**
   * Crea invitacion directa a partido.
   * Se construye para persistir propuestas entre perfiles.
   * Lo usa DirectInvitationModal.
   * Sirve para notificar al destinatario.
   */
  async function createDirectMatchInvitation(
    inviterProfileId: string,
    invitationInput: CreateInvitationInput,
  ): Promise<void> {
    const invitationToCreate: Omit<
      DirectMatchInvitation,
      "invitationId" | "createdAt" | "updatedAt"
    > = {
      inviterProfileId,
      invitedProfileId: invitationInput.invitedProfileId,
      relatedPostId: invitationInput.relatedPostId,
      scheduledDate: invitationInput.scheduledDate,
      scheduledStartTime: invitationInput.scheduledStartTime,
      placeText: invitationInput.placeText,
      desiredPlayStyle: invitationInput.desiredPlayStyle,
      note: invitationInput.note,
      status: "pending",
    };
    const savedInvitation = await insertDirectMatchInvitation(invitationToCreate);

    await createNotification({
      recipientProfileId: invitationInput.invitedProfileId,
      actorProfileId: inviterProfileId,
      notificationType: "direct_match_invitation_received",
      relatedPostId: invitationInput.relatedPostId,
      relatedInvitationId: savedInvitation.id,
      title: "Invitacion a partido",
      body: "Recibiste una invitacion directa para jugar.",
    });
  }

  /**
   * Responde una invitacion directa.
   * Se construye para cerrar el flujo remoto de invitaciones.
   * Lo usa la actividad del perfil.
   * Sirve para avisar al invitador.
   */
  async function updateDirectMatchInvitationStatus(
    invitationId: string,
    status: "accepted" | "rejected",
  ): Promise<void> {
    const invitation = await readOptionalRow<SupabaseDirectMatchInvitationRow>(
      supabaseClient
        .from("direct_match_invitations")
        .select("*")
        .eq("id", invitationId)
        .returns<SupabaseDirectMatchInvitationRow[]>()
        .maybeSingle(),
      "buscar invitacion",
    );

    if (!invitation || invitation.status !== "pending") {
      return;
    }

    const { error } = await supabaseClient.rpc(
      "answer_direct_match_invitation",
      {
        invitation_id_input: invitationId,
        status_input: status,
      },
    );

    if (error) {
      throw createSupabaseError("actualizar invitacion", error);
    }

    await createNotification({
      recipientProfileId: invitation.inviter_profile_id,
      actorProfileId: invitation.invited_profile_id,
      notificationType:
        status === "accepted"
          ? "direct_match_invitation_accepted"
          : "direct_match_invitation_rejected",
      relatedPostId: invitation.related_post_id ?? undefined,
      relatedInvitationId: invitation.id,
      title:
        status === "accepted" ? "Invitacion aceptada" : "Invitacion rechazada",
      body:
        status === "accepted"
          ? "Aceptaron tu invitacion para jugar."
          : "Rechazaron tu invitacion para este partido.",
    });
  }

  /**
   * Alterna interes o asistencia en evento.
   * Se construye para persistir actividad de eventos.
   * Lo usan cards de evento.
   * Sirve para guardar o retirar interacciones del usuario.
   */
  async function toggleEventInteraction(
    postId: string,
    profileId: string,
    interactionType: EventInteractionType,
  ): Promise<void> {
    const existingInteraction =
      await readOptionalRow<SupabasePostInteractionRow>(
        supabaseClient
          .from("post_interactions")
          .select("*")
          .eq("post_id", postId)
          .eq("profile_id", profileId)
          .eq("interaction_type", interactionType)
          .returns<SupabasePostInteractionRow[]>()
          .maybeSingle(),
        "buscar interaccion de evento",
      );

    if (existingInteraction) {
      const { error } = await supabaseClient
        .from("post_interactions")
        .delete()
        .eq("id", existingInteraction.id);

      if (error) {
        throw createSupabaseError("eliminar interaccion de evento", error);
      }

      return;
    }

    const { error } = await supabaseClient
      .from("post_interactions")
      .insert(
        mapPostInteractionToSupabaseInsert({
          postId,
          profileId,
          interactionType,
        }),
      );

    if (error) {
      throw createSupabaseError("crear interaccion de evento", error);
    }
  }

  /**
   * Marca notificaciones como leidas.
   * Se construye para limpiar el contador con backend real.
   * Lo usa NotificationsScreen.
   * Sirve para persistir lectura por destinatario.
   */
  async function markNotificationsAsRead(
    recipientProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("notifications")
      .update({ read_at: createCurrentIsoDate() })
      .eq("recipient_profile_id", recipientProfileId)
      .is("read_at", null);

    if (error) {
      throw createSupabaseError("marcar notificaciones como leidas", error);
    }
  }

  /**
   * Inserta solicitud de partido y devuelve la fila persistida.
   * Se construye para reutilizar notificacion con id real.
   * Lo usan acciones de solicitud.
   * Sirve para enlazar notificaciones con la solicitud creada.
   */
  async function insertMatchJoinRequest(
    matchJoinRequest: Omit<
      MatchJoinRequest,
      "requestId" | "createdAt" | "updatedAt"
    >,
  ): Promise<SupabaseMatchJoinRequestRow> {
    return writeSingleRow<SupabaseMatchJoinRequestRow>(
      supabaseClient
        .from("match_join_requests")
        .insert(mapMatchJoinRequestToSupabaseInsert(matchJoinRequest))
        .select("*")
        .returns<SupabaseMatchJoinRequestRow[]>()
        .single(),
      "insertar solicitud",
    );
  }

  /**
   * Actualiza solicitud existente y devuelve la fila persistida.
   * Se construye para reactivar solicitudes canceladas y responder pendientes.
   * Lo usan acciones de solicitud.
   * Sirve para no crear duplicados por el constraint unico.
   */
  async function updateExistingMatchJoinRequest(
    requestId: string,
    matchJoinRequest: Omit<
      MatchJoinRequest,
      "requestId" | "createdAt" | "updatedAt"
    >,
  ): Promise<SupabaseMatchJoinRequestRow> {
    const updateInput: SupabaseMatchJoinRequestInsert =
      mapMatchJoinRequestToSupabaseInsert(matchJoinRequest);

    return writeSingleRow<SupabaseMatchJoinRequestRow>(
      supabaseClient
        .from("match_join_requests")
        .update(updateInput)
        .eq("id", requestId)
        .select("*")
        .returns<SupabaseMatchJoinRequestRow[]>()
        .single(),
      "actualizar solicitud",
    );
  }

  /**
   * Inserta invitacion directa y devuelve la fila persistida.
   * Se construye para enlazar notificaciones con id real.
   * Lo usa createDirectMatchInvitation.
   * Sirve para mantener trazabilidad entre invitacion y aviso.
   */
  async function insertDirectMatchInvitation(
    directMatchInvitation: Omit<
      DirectMatchInvitation,
      "invitationId" | "createdAt" | "updatedAt"
    >,
  ): Promise<SupabaseDirectMatchInvitationRow> {
    const insertInput: SupabaseDirectMatchInvitationInsert =
      mapDirectMatchInvitationToSupabaseInsert(directMatchInvitation);

    return writeSingleRow<SupabaseDirectMatchInvitationRow>(
      supabaseClient
        .from("direct_match_invitations")
        .insert(insertInput)
        .select("*")
        .returns<SupabaseDirectMatchInvitationRow[]>()
        .single(),
      "insertar invitacion directa",
    );
  }

  /**
   * Crea una notificacion interna en Supabase.
   * Se construye para compartir formato entre acciones sociales.
   * Lo usan solicitudes, invitaciones y seguimientos.
   * Sirve para alimentar la bandeja de actividad.
   */
  async function createNotification(
    notification: Omit<InternalNotification, "notificationId" | "createdAt">,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("notifications")
      .insert(mapNotificationToSupabaseInsert(notification));

    if (error) {
      throw createSupabaseError("crear notificacion", error);
    }
  }

  return {
    cancelMatchJoinRequest,
    createDirectMatchInvitation,
    createMatchJoinRequest,
    createPost,
    loadApplicationSnapshot,
    markNotificationsAsRead,
    saveProfile,
    toggleEventInteraction,
    toggleFollowProfile,
    updateDirectMatchInvitationStatus,
    updateMatchJoinRequestStatus,
  };
}

/**
 * Crea un snapshot vacio cuando no hay sesion.
 * Se construye para que la UI pueda mostrar Auth sin nulls complejos.
 * Lo usa loadApplicationSnapshot.
 * Sirve como contrato estable entre repositorio y hook.
 */
function createEmptySnapshot(): PadelitoRepositorySnapshot {
  return createEmptyRepositorySnapshot();
}

/**
 * Crea perfil borrador para usuarios autenticados sin fila en profiles.
 * Se construye porque profiles.id depende de auth.users(id).
 * Lo usa loadApplicationSnapshot.
 * Sirve para que onboarding pueda guardar el perfil real con el id correcto.
 */
function createDraftProfile(profileId: string, email?: string): Profile {
  const currentTimestamp = createCurrentIsoDate();
  const fallbackDisplayName = email?.split("@")[0] || "Jugador Padelito";

  return {
    profileId,
    profileType: "player",
    displayName: fallbackDisplayName,
    avatarUrl: "",
    bio: "",
    whatsappPhone: "",
    usualPlace: "",
    playerLevel: "sixth",
    preferredPosition: "drive",
    preferredPlayStyle: "both",
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
    isOnboardingComplete: false,
  };
}

/**
 * Lee filas desde Supabase con manejo de error uniforme.
 * Se construye para evitar repetir chequeos en cada consulta.
 * Lo usa el repositorio Supabase.
 * Sirve para transformar errores remotos en mensajes de dominio.
 */
async function readRows<RowType>(
  query: SupabaseListQuery<RowType>,
  actionDescription: string,
): Promise<RowType[]> {
  const { data, error } = await query;

  if (error) {
    throw createSupabaseError(actionDescription, error);
  }

  return data ?? [];
}

/**
 * Lee una fila opcional desde Supabase.
 * Se construye para buscar relaciones o entidades que pueden no existir.
 * Lo usa el repositorio Supabase.
 * Sirve para alternar follow, solicitudes e interacciones sin excepciones falsas.
 */
async function readOptionalRow<RowType>(
  query: SupabaseSingleQuery<RowType>,
  actionDescription: string,
): Promise<RowType | null> {
  const { data, error } = await query;

  if (error) {
    throw createSupabaseError(actionDescription, error);
  }

  return data;
}

/**
 * Escribe una fila y exige respuesta de Supabase.
 * Se construye para acciones que necesitan ids reales generados por la base.
 * Lo usa el repositorio Supabase.
 * Sirve para enlazar notificaciones con solicitudes e invitaciones.
 */
async function writeSingleRow<RowType>(
  query: SupabaseSingleQuery<RowType>,
  actionDescription: string,
): Promise<RowType> {
  const { data, error } = await query;

  if (error) {
    throw createSupabaseError(actionDescription, error);
  }

  if (!data) {
    throw new Error(`Supabase no devolvio datos al ${actionDescription}.`);
  }

  return data;
}

/**
 * Normaliza errores de Supabase.
 * Se construye para que la capa superior no dependa de PostgREST.
 * Lo usan helpers de lectura y escritura.
 * Sirve para mostrar/loguear fallas con contexto humano.
 */
function createSupabaseError(
  actionDescription: string,
  error: SupabaseRepositoryError,
): Error {
  return new Error(`No se pudo ${actionDescription}: ${error.message}`);
}
