import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventInteractionType } from "../../domain/enums/postEnums";
import type { RecurringChallengeStatus } from "../../domain/enums/recurringChallengeEnums";
import type { InternalNotification } from "../../domain/models/notificationModels";
import type {
  DirectMatchInvitation,
  MatchJoinRequest,
} from "../../domain/models/postModels";
import type {
  PrivateProfileContact,
  Profile,
} from "../../domain/models/profileModels";
import { createCurrentIsoDate } from "../../utils/dateFormatters";
import {
  mapDirectMatchInvitationToSupabaseInsert,
  mapFollowToSupabaseInsert,
  mapMatchParticipantToSupabaseInsert,
  mapMatchRecordToSupabaseInsert,
  mapMatchResultToSupabaseInsert,
  mapMatchJoinRequestToSupabaseInsert,
  mapNotificationToSupabaseInsert,
  mapPostInteractionToSupabaseInsert,
  mapPostToSupabaseInsert,
  mapRecurringChallengeParticipantToSupabaseInsert,
  mapRecurringChallengeToSupabaseInsert,
  mapProfileToSupabaseUpsert,
  mapSupabaseDirectMatchInvitationRow,
  mapSupabaseFollowRow,
  mapSupabaseMatchJoinRequestRow,
  mapSupabaseMatchParticipantRow,
  mapSupabaseMatchRecordRow,
  mapSupabaseMatchResultRow,
  mapSupabaseNotificationRow,
  mapSupabasePostInteractionRow,
  mapSupabasePostRow,
  mapSupabaseProfileRow,
  mapSupabaseRecurringChallengeParticipantRow,
  mapSupabaseRecurringChallengeRow,
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
  SupabaseMatchParticipantRow,
  SupabaseMatchRecordRow,
  SupabaseMatchResultRow,
  SupabaseNotificationRow,
  SupabasePostInteractionRow,
  SupabasePostRow,
  SupabasePrivateProfileContactRow,
  SupabaseProfileRow,
  SupabaseRecurringChallengeParticipantRow,
  SupabaseRecurringChallengeRow,
} from "./supabasePadelitoTypes";
import { requestRemotePushDelivery } from "../push/pushNotificationClient";

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

const publicProfileSelectColumns = `
  id,
  profile_type,
  display_name,
  avatar_url,
  bio,
  usual_place,
  match_stats_reset_at,
  player_level,
  preferred_position,
  preferred_play_style,
  organization_kind,
  organization_link,
  created_at,
  updated_at
`;

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
      matchRecordRows,
      matchParticipantRows,
      matchResultRows,
      recurringChallengeRows,
      recurringChallengeParticipantRows,
      notificationRows,
    ] = await Promise.all([
      readRows<SupabaseProfileRow>(
        supabaseClient
          .from("profiles")
          .select(publicProfileSelectColumns)
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
      readRows<SupabaseMatchRecordRow>(
        supabaseClient
          .from("match_records")
          .select("*")
          .order("scheduled_date", { ascending: false })
          .order("scheduled_start_time", { ascending: false })
          .returns<SupabaseMatchRecordRow[]>(),
        "leer partidos",
      ),
      readRows<SupabaseMatchParticipantRow>(
        supabaseClient
          .from("match_participants")
          .select("*")
          .returns<SupabaseMatchParticipantRow[]>(),
        "leer participantes de partidos",
      ),
      readRows<SupabaseMatchResultRow>(
        supabaseClient
          .from("match_results")
          .select("*")
          .returns<SupabaseMatchResultRow[]>(),
        "leer resultados",
      ),
      readRows<SupabaseRecurringChallengeRow>(
        supabaseClient
          .from("recurring_challenges")
          .select("*")
          .order("created_at", { ascending: false })
          .returns<SupabaseRecurringChallengeRow[]>(),
        "leer desafíos recurrentes",
      ),
      readRows<SupabaseRecurringChallengeParticipantRow>(
        supabaseClient
          .from("recurring_challenge_participants")
          .select("*")
          .returns<SupabaseRecurringChallengeParticipantRow[]>(),
        "leer participantes de desafíos",
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
    const metadataDisplayName =
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : undefined;
    const profilesWithSessionDraft = profiles.some(
      (profile) => profile.profileId === user.id,
    )
      ? profiles
      : [
          createDraftProfile(user.id, user.email, metadataDisplayName),
          ...profiles,
        ];
    const sessionPrivateContact = await getPrivateProfileContact(user.id);
    const profilesWithSessionPrivateContact = profilesWithSessionDraft.map(
      (profile) =>
        profile.profileId === user.id
          ? {
              ...profile,
              whatsappPhone:
                sessionPrivateContact?.whatsappPhone ?? profile.whatsappPhone,
            }
          : profile,
    );
    const synchronizedNotificationRows =
      await ensureMatchResultReminderNotifications(
        user.id,
        matchRecordRows,
        matchResultRows,
        postRows,
        notificationRows,
      );

    return {
      profiles: profilesWithSessionPrivateContact,
      follows: followRows.map(mapSupabaseFollowRow),
      posts: postRows.map(mapSupabasePostRow),
      postInteractions: postInteractionRows.map(mapSupabasePostInteractionRow),
      matchJoinRequests: matchJoinRequestRows.map(
        mapSupabaseMatchJoinRequestRow,
      ),
      directMatchInvitations: directMatchInvitationRows.map(
        mapSupabaseDirectMatchInvitationRow,
      ),
      matchRecords: matchRecordRows.map(mapSupabaseMatchRecordRow),
      matchParticipants: matchParticipantRows.map(
        mapSupabaseMatchParticipantRow,
      ),
      matchResults: matchResultRows.map(mapSupabaseMatchResultRow),
      recurringChallenges: recurringChallengeRows.map(
        mapSupabaseRecurringChallengeRow,
      ),
      recurringChallengeParticipants: recurringChallengeParticipantRows.map(
        mapSupabaseRecurringChallengeParticipantRow,
      ),
      notifications: synchronizedNotificationRows.map(mapSupabaseNotificationRow),
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
    const profileInput = mapProfileToSupabaseUpsert(updatedProfile);
    const { id: profileId, ...profileUpdateInput } = profileInput;
    const { data: updatedProfileRow, error: updateError } = await supabaseClient
      .from("profiles")
      .update(profileUpdateInput)
      .eq("id", profileId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw createSupabaseError("guardar perfil", updateError);
    }

    if (updatedProfileRow) {
      return;
    }

    const { error } = await supabaseClient.from("profiles").insert(profileInput);

    if (error) {
      throw createSupabaseError("guardar perfil", error);
    }
  }

  /**
   * Sube avatar propio a Supabase Storage.
   * Se construye para separar archivos de datos de perfil.
   * Lo usa el guardado de perfil.
   * Sirve para persistir fotos publicas de avatar.
   */
  async function uploadProfileAvatar(
    profileId: string,
    avatarFile: File,
  ): Promise<string> {
    const avatarPath = `${profileId}/avatar-${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(avatarPath, avatarFile, {
        cacheControl: "3600",
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      throw createSupabaseError("subir foto de perfil", uploadError);
    }

    const { data } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(avatarPath);

    return data.publicUrl;
  }

  /**
   * Sube imagen de evento a Supabase Storage.
   * Se construye para evitar pedir URLs manuales al publicar eventos.
   * Lo usa el flujo de creacion de publicaciones.
   * Sirve para persistir imagenes visibles en cards de evento.
   */
  async function uploadEventImage(
    postId: string,
    eventImageFile: File,
  ): Promise<string> {
    const eventImagePath = `${postId}/event-${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseClient.storage
      .from("event-images")
      .upload(eventImagePath, eventImageFile, {
        cacheControl: "3600",
        contentType: eventImageFile.type,
        upsert: true,
      });

    if (uploadError) {
      throw createSupabaseError("subir imagen de evento", uploadError);
    }

    const { data } = supabaseClient.storage
      .from("event-images")
      .getPublicUrl(eventImagePath);

    return data.publicUrl;
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
      throw createSupabaseError("crear publicación", error);
    }
  }

  /**
   * Cancela una publicacion propia en Supabase.
   * Se construye para retirar contenido del feed sin borrar relaciones historicas.
   * Lo usan cards propias y actividad del perfil.
   * Sirve para manejar partidos, disponibilidades y eventos que dejaron de estar vigentes.
   */
  async function cancelPost(
    postId: string,
    authorProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("posts")
      .update({ is_active: false })
      .eq("id", postId)
      .eq("author_profile_id", authorProfileId);

    if (error) {
      throw createSupabaseError("cancelar publicación", error);
    }
  }

  /**
   * Elimina una publicacion propia de Supabase.
   * Se construye para limpiar actividad cancelada del perfil.
   * Lo usa ProfileActivitySection.
   * Sirve para separar historial de partidos del feed operativo.
   */
  async function deletePost(
    postId: string,
    authorProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author_profile_id", authorProfileId);

    if (error) {
      throw createSupabaseError("eliminar publicación", error);
    }
  }

  /**
   * Crea un partido con participantes y resultado opcional en Supabase.
   * Se construye para persistir historial real separado del feed.
   * Lo usa el modulo de partidos.
   * Sirve para soportar partidos con cantidad variable de jugadores.
   */
  async function createMatch(
    matchInput: Parameters<PadelitoRepository["createMatch"]>[0],
  ): Promise<void> {
    if (matchInput.sourcePost) {
      const { error: sourcePostError } = await supabaseClient
        .from("posts")
        .insert({
          id: matchInput.sourcePost.postId,
          ...mapPostToSupabaseInsert(matchInput.sourcePost),
        });

      if (sourcePostError) {
        throw createSupabaseError(
          "crear publicación vinculada al partido",
          sourcePostError,
        );
      }
    }

    const { error: matchError } = await supabaseClient
      .from("match_records")
      .insert(
        mapMatchRecordToSupabaseInsert({
          ...matchInput.matchRecord,
          sourcePostId:
            matchInput.sourcePost?.postId ?? matchInput.matchRecord.sourcePostId,
          status: matchInput.result ? "completed" : matchInput.matchRecord.status,
        }),
      );

    if (matchError) {
      throw createSupabaseError("crear partido", matchError);
    }

    const { error: participantsError } = await supabaseClient
      .from("match_participants")
      .insert(matchInput.participants.map(mapMatchParticipantToSupabaseInsert));

    if (participantsError) {
      throw createSupabaseError("agregar participantes", participantsError);
    }

    if (!matchInput.result) {
      return;
    }

    const { error: resultError } = await supabaseClient
      .from("match_results")
      .insert(mapMatchResultToSupabaseInsert(matchInput.result));

    if (resultError) {
      throw createSupabaseError("registrar resultado", resultError);
    }
  }

  /**
   * Cancela un partido propio en Supabase.
   * Se construye para retirar partidos programados sin borrar historial.
   * Lo usa el perfil del creador.
   * Sirve para mantener consistencia con publicaciones cancelables.
   */
  async function cancelMatch(
    matchId: string,
    ownerProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("match_records")
      .update({ status: "cancelled" })
      .eq("id", matchId)
      .eq("owner_profile_id", ownerProfileId)
      .eq("status", "scheduled");

    if (error) {
      throw createSupabaseError("cancelar partido", error);
    }
  }

  /**
   * Guarda resultado de un partido en Supabase.
   * Se construye como upsert para permitir correcciones del marcador.
   * Lo usa el historial de partidos.
   * Sirve para alimentar estadisticas del perfil.
   */
  async function recordMatchResult(
    matchResult: Parameters<PadelitoRepository["recordMatchResult"]>[0],
    ownerProfileId: Parameters<PadelitoRepository["recordMatchResult"]>[1],
  ): Promise<void> {
    const { error: resultError } = await supabaseClient
      .from("match_results")
      .upsert(mapMatchResultToSupabaseInsert(matchResult), {
        onConflict: "match_id",
      });

    if (resultError) {
      throw createSupabaseError("registrar resultado", resultError);
    }

    const { error: matchError } = await supabaseClient
      .from("match_records")
      .update({ status: "completed" })
      .eq("id", matchResult.matchId)
      .eq("owner_profile_id", ownerProfileId);

    if (matchError) {
      throw createSupabaseError("finalizar partido", matchError);
    }

    const matchParticipants = await readRows<SupabaseMatchParticipantRow>(
      supabaseClient
        .from("match_participants")
        .select("*")
        .eq("match_id", matchResult.matchId)
        .returns<SupabaseMatchParticipantRow[]>(),
      "leer participantes para notificar resultado",
    );

    await Promise.all(
      matchParticipants
        .filter(
          (matchParticipant) =>
            matchParticipant.profile_id !== ownerProfileId,
        )
        .map((matchParticipant) =>
          createNotification({
            recipientProfileId: matchParticipant.profile_id,
            actorProfileId: ownerProfileId,
            notificationType: "match_result_recorded",
            relatedMatchId: matchResult.matchId,
            title: "Resultado confirmado",
            body: "El organizador cargo el resultado del partido.",
          }),
        ),
    );
  }

  /**
   * Reinicia estadisticas visibles del perfil propio en Supabase.
   * Se construye para no editar resultados historicos.
   * Lo usa la seccion de historial del perfil.
   * Sirve para contar rendimiento desde un nuevo punto.
   */
  async function resetOwnMatchStats(): Promise<void> {
    const { error } = await supabaseClient.rpc("reset_own_match_stats");

    if (error) {
      throw createSupabaseError("resetear estadísticas", error);
    }
  }

  /**
   * Crea un desafio recurrente en Supabase.
   * Se construye para agrupar partidos repetidos entre equipos.
   * Lo usa la seccion de desafios del perfil.
   * Sirve para persistir marcador acumulado calculable desde resultados.
   */
  async function createRecurringChallenge(
    challengeInput: Parameters<
      PadelitoRepository["createRecurringChallenge"]
    >[0],
  ): Promise<void> {
    const { error: challengeError } = await supabaseClient
      .from("recurring_challenges")
      .insert(mapRecurringChallengeToSupabaseInsert(challengeInput.challenge));

    if (challengeError) {
      throw createSupabaseError("crear desafío recurrente", challengeError);
    }

    const { error: participantsError } = await supabaseClient
      .from("recurring_challenge_participants")
      .insert(
        challengeInput.participants.map(
          mapRecurringChallengeParticipantToSupabaseInsert,
        ),
      );

    if (participantsError) {
      throw createSupabaseError(
        "agregar participantes del desafío",
        participantsError,
      );
    }
  }

  /**
   * Actualiza estado de desafio recurrente en Supabase.
   * Se construye para archivar o reactivar sin borrar historial.
   * Lo usa la seccion de desafios del perfil.
   * Sirve para retirar desafios de seleccion futura o reactivarlos.
   */
  async function updateRecurringChallengeStatus(
    challengeId: string,
    status: RecurringChallengeStatus,
    ownerProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("recurring_challenges")
      .update({
        status,
        updated_at: createCurrentIsoDate(),
      })
      .eq("id", challengeId)
      .eq("owner_profile_id", ownerProfileId);

    if (error) {
      throw createSupabaseError("actualizar desafío recurrente", error);
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
      "buscar publicación para solicitud",
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
   * Cancela una solicitud o participacion aceptada.
   * Se construye para liberar cupos desde base de datos.
   * Lo usan feed y perfil.
   * Sirve para retirar postulaciones o jugadores confirmados.
   */
  async function cancelMatchJoinRequest(
    requestId: string,
    actorProfileId: string,
  ): Promise<void> {
    const { error: cancelRequestError } = await supabaseClient.rpc(
      "cancel_match_join_request",
      {
        request_id_input: requestId,
      },
    );

    if (!cancelRequestError) {
      return;
    }

    if (!isMissingSchemaFeatureError(cancelRequestError)) {
      throw createSupabaseError("cancelar solicitud", cancelRequestError);
    }

    const { error } = await supabaseClient
      .from("match_join_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("requester_profile_id", actorProfileId)
      .eq("status", "pending");

    if (error) {
      throw createSupabaseError("cancelar solicitud", error);
    }
  }

  /**
   * Elimina una solicitud cerrada.
   * Se construye para limpiar actividad del perfil.
   * Lo usa ProfileActivitySection.
   * Sirve para evitar que canceladas y rechazadas acumulen scroll.
   */
  async function deleteMatchJoinRequest(
    requestId: string,
    actorProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("match_join_requests")
      .delete()
      .eq("id", requestId)
      .or(
        `requester_profile_id.eq.${actorProfileId},owner_profile_id.eq.${actorProfileId}`,
      );

    if (error) {
      throw createSupabaseError("eliminar solicitud", error);
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

    if (answerRequestError && isMissingSchemaFeatureError(answerRequestError)) {
      await updateExistingMatchJoinRequest(requestId, {
        postId: request.post_id,
        requesterProfileId: request.requester_profile_id,
        ownerProfileId: request.owner_profile_id,
        status,
        message: request.message ?? undefined,
      });

      if (status === "accepted") {
        await registerAcceptedPlayerOnPostFromClient(
          supabaseClient,
          request.post_id,
          request.requester_profile_id,
        );
      }
    } else if (answerRequestError) {
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
      relatedMatchId: invitationInput.relatedMatchId,
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
      title: "Invitación a partido",
      body: "Recibiste una invitación directa para jugar.",
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
      "buscar invitación",
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

    if (error && isMissingSchemaFeatureError(error)) {
      const { error: legacyUpdateError } = await supabaseClient
        .from("direct_match_invitations")
        .update({ status })
        .eq("id", invitationId);

      if (legacyUpdateError) {
        throw createSupabaseError("actualizar invitación", legacyUpdateError);
      }
    } else if (error) {
      throw createSupabaseError("actualizar invitación", error);
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
        status === "accepted" ? "Invitación aceptada" : "Invitación rechazada",
      body:
        status === "accepted"
          ? "Aceptaron tu invitación para jugar."
          : "Rechazaron tu invitación para este partido.",
    });
  }

  /**
   * Cancela una invitacion directa o participacion aceptada.
   * Se construye para liberar cupos y participantes desde base.
   * Lo usa la actividad del perfil.
   * Sirve para retirar propuestas o jugadores confirmados.
   */
  async function cancelDirectMatchInvitation(
    invitationId: string,
    actorProfileId: string,
  ): Promise<void> {
    const { error: cancelInvitationError } = await supabaseClient.rpc(
      "cancel_direct_match_invitation",
      {
        invitation_id_input: invitationId,
      },
    );

    if (!cancelInvitationError) {
      return;
    }

    if (!isMissingSchemaFeatureError(cancelInvitationError)) {
      throw createSupabaseError("cancelar invitación", cancelInvitationError);
    }

    const { error } = await supabaseClient
      .from("direct_match_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .eq("inviter_profile_id", actorProfileId)
      .eq("status", "pending");

    if (error) {
      throw createSupabaseError("cancelar invitación", error);
    }
  }

  /**
   * Elimina una invitacion cerrada.
   * Se construye para limpiar actividad del perfil.
   * Lo usa ProfileActivitySection.
   * Sirve para evitar acumulacion de cards antiguas.
   */
  async function deleteDirectMatchInvitation(
    invitationId: string,
    actorProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("direct_match_invitations")
      .delete()
      .eq("id", invitationId)
      .or(
        `inviter_profile_id.eq.${actorProfileId},invited_profile_id.eq.${actorProfileId}`,
      );

    if (error) {
      throw createSupabaseError("eliminar invitación", error);
    }
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
        "buscar interacción de evento",
      );

    if (existingInteraction) {
      const { error } = await supabaseClient
        .from("post_interactions")
        .delete()
        .eq("id", existingInteraction.id);

      if (error) {
        throw createSupabaseError("eliminar interacción de evento", error);
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
      throw createSupabaseError("crear interacción de evento", error);
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
      throw createSupabaseError("marcar notificaciones como leídas", error);
    }
  }

  /**
   * Elimina una notificacion propia en Supabase.
   * Se construye para respaldar el gesto swipe-to-delete.
   * Lo usa NotificationsScreen.
   * Sirve para mantener la bandeja limpia y persistente.
   */
  async function deleteNotification(
    notificationId: string,
    recipientProfileId: string,
  ): Promise<void> {
    const { error } = await supabaseClient
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_profile_id", recipientProfileId);

    if (error) {
      throw createSupabaseError("eliminar notificación", error);
    }
  }

  /**
   * Lee contacto privado validado por Supabase.
   * Se construye para no incluir telefonos en el snapshot publico.
   * Lo usan el perfil propio y el contacto post-aceptacion.
   * Sirve para abrir WhatsApp solo cuando hay permiso real.
   */
  async function getPrivateProfileContact(
    targetProfileId: string,
  ): Promise<PrivateProfileContact | null> {
    const { data, error } = await supabaseClient.rpc(
      "get_profile_private_contact",
      {
        target_profile_id_input: targetProfileId,
      },
    );

    if (error) {
      if (isMissingSchemaFeatureError(error)) {
        return null;
      }

      throw createSupabaseError("leer contacto privado", error);
    }

    const contactRows = data as SupabasePrivateProfileContactRow[] | null;
    const contactRow = contactRows?.[0];

    if (!contactRow) {
      return null;
    }

    return {
      profileId: contactRow.profile_id,
      whatsappPhone: contactRow.whatsapp_phone ?? undefined,
    };
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

    const { data, error } = await supabaseClient
      .from("direct_match_invitations")
      .insert(insertInput)
      .select("*")
      .returns<SupabaseDirectMatchInvitationRow[]>()
      .single();

    if (!error && data) {
      return data;
    }

    if (!error) {
      throw new Error("Supabase no devolvió datos al insertar la invitación directa.");
    }

    if (!isMissingSchemaFeatureError(error)) {
      throw createSupabaseError("insertar invitación directa", error);
    }

    const {
      related_match_id: ignoredRelatedMatchId,
      related_post_id: ignoredRelatedPostId,
      ...legacyInsertInput
    } = insertInput;
    void ignoredRelatedMatchId;
    void ignoredRelatedPostId;

    return writeSingleRow<SupabaseDirectMatchInvitationRow>(
      supabaseClient
        .from("direct_match_invitations")
        .insert(legacyInsertInput)
        .select("*")
        .returns<SupabaseDirectMatchInvitationRow[]>()
        .single(),
      "insertar invitación directa sin partido vinculado",
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
    const { data, error } = await supabaseClient
      .from("notifications")
      .insert(mapNotificationToSupabaseInsert(notification))
      .select("id")
      .maybeSingle();

    if (error) {
      throw createSupabaseError("crear notificación", error);
    }

    if (data?.id) {
      void requestRemotePushDelivery(data.id).catch(() => undefined);
    }
  }

  /**
   * Asegura recordatorios de resultado pendientes.
   * Se construye para materializar avisos durante cada snapshot remoto.
   * Lo usa loadApplicationSnapshot.
   * Sirve para pedir resultado cuando un partido propio ya termino.
   */
  async function ensureMatchResultReminderNotifications(
    ownerProfileId: string,
    matchRows: SupabaseMatchRecordRow[],
    resultRows: SupabaseMatchResultRow[],
    postRows: SupabasePostRow[],
    notificationRows: SupabaseNotificationRow[],
  ): Promise<SupabaseNotificationRow[]> {
    const dueMatchRows = matchRows.filter(
      (matchRow) =>
        matchRow.owner_profile_id === ownerProfileId &&
        matchRow.status === "scheduled" &&
        isMatchPastResultReminderTime(matchRow, postRows) &&
        !resultRows.some((resultRow) => resultRow.match_id === matchRow.id) &&
        !notificationRows.some(
          (notificationRow) =>
            notificationRow.recipient_profile_id === ownerProfileId &&
            notificationRow.related_match_id === matchRow.id &&
            notificationRow.notification_type === "match_result_reminder",
        ),
    );

    if (dueMatchRows.length === 0) {
      return notificationRows;
    }

    const { error } = await supabaseClient.from("notifications").insert(
      dueMatchRows.map((matchRow) =>
        mapNotificationToSupabaseInsert({
          recipientProfileId: ownerProfileId,
          actorProfileId: ownerProfileId,
          notificationType: "match_result_reminder",
          relatedMatchId: matchRow.id,
          title: "¿Cómo terminó el partido?",
          body: "El partido ya debería haber terminado. Cargá el resultado cuando puedas.",
        }),
      ),
    );

    if (error) {
      if (isMissingSchemaFeatureError(error)) {
        return notificationRows;
      }

      throw createSupabaseError("crear recordatorio de resultado", error);
    }

    return readRows<SupabaseNotificationRow>(
      supabaseClient
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<SupabaseNotificationRow[]>(),
      "leer notificaciones actualizadas",
    );
  }

  return {
    cancelMatch,
    cancelMatchJoinRequest,
    cancelDirectMatchInvitation,
    cancelPost,
    deletePost,
    createDirectMatchInvitation,
    createMatch,
    createMatchJoinRequest,
    createPost,
    uploadEventImage,
    createRecurringChallenge,
    deleteDirectMatchInvitation,
    deleteMatchJoinRequest,
    deleteNotification,
    updateRecurringChallengeStatus,
    loadApplicationSnapshot,
    getPrivateProfileContact,
    markNotificationsAsRead,
    recordMatchResult,
    resetOwnMatchStats,
    saveProfile,
    toggleEventInteraction,
    toggleFollowProfile,
    uploadProfileAvatar,
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
function createDraftProfile(
  profileId: string,
  email?: string,
  displayName?: string,
): Profile {
  const currentTimestamp = createCurrentIsoDate();
  const fallbackDisplayName =
    displayName?.trim() || email?.split("@")[0] || "Jugador Padelito";

  return {
    profileId,
    profileType: "player",
    displayName: fallbackDisplayName,
    avatarUrl: "",
    bio: "",
    whatsappPhone: "",
    usualPlace: "",
    matchStatsResetAt: undefined,
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
    throw new Error(`Supabase no devolvió datos al ${actionDescription}.`);
  }

  return data;
}

/**
 * Actualiza cupo desde cliente cuando la RPC nueva aun no existe.
 * Se construye como compatibilidad temporal con Supabase sin migracion incremental.
 * Lo usa updateMatchJoinRequestStatus ante errores de schema cache.
 * Sirve para evitar que aceptar solicitudes quede bloqueado antes de aplicar SQL.
 */
async function registerAcceptedPlayerOnPostFromClient(
  supabaseClient: SupabaseClient,
  postId: string,
  acceptedProfileId: string,
): Promise<void> {
  const [postRow, acceptedProfileRow] = await Promise.all([
    readOptionalRow<SupabasePostRow>(
      supabaseClient
        .from("posts")
        .select("*")
        .eq("id", postId)
        .returns<SupabasePostRow[]>()
        .maybeSingle(),
      "buscar publicación para descontar cupo",
    ),
    readOptionalRow<SupabaseProfileRow>(
      supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", acceptedProfileId)
        .returns<SupabaseProfileRow[]>()
        .maybeSingle(),
      "buscar perfil aceptado",
    ),
  ]);

  if (!postRow || postRow.post_type !== "looking_for_player") {
    return;
  }

  const nextMissingPlayersCount = Math.max(
    (postRow.missing_players_count ?? 0) - 1,
    0,
  );
  const updateInput = {
    confirmed_players_text: appendConfirmedPlayerName(
      postRow.confirmed_players_text,
      acceptedProfileRow?.display_name,
    ),
    is_active: nextMissingPlayersCount > 0,
    missing_players_count: nextMissingPlayersCount,
  };
  const { error } = await supabaseClient
    .from("posts")
    .update(updateInput)
    .eq("id", postId);

  if (!error) {
    return;
  }

  if (nextMissingPlayersCount === 0) {
    const { error: legacyCompletionError } = await supabaseClient
      .from("posts")
      .update({
        confirmed_players_text: updateInput.confirmed_players_text,
        is_active: false,
      })
      .eq("id", postId);

    if (!legacyCompletionError) {
      return;
    }
  }

  throw createSupabaseError("actualizar cupo del partido", error);
}

/**
 * Agrega un nombre al texto compacto de confirmados.
 * Se construye para compartir la compatibilidad temporal con la regla SQL.
 * Lo usa registerAcceptedPlayerOnPostFromClient.
 * Sirve para reflejar visualmente el jugador aceptado.
 */
function appendConfirmedPlayerName(
  confirmedPlayersText: string | null,
  acceptedPlayerName: string | null | undefined,
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

  return nextConfirmedPlayersText.slice(0, 180);
}

/**
 * Verifica si un partido ya deberia pedir resultado.
 * Se construye para crear recordatorios sin scheduler externo.
 * Lo usa ensureMatchResultReminderNotifications.
 * Sirve para refrescar avisos al abrir la app.
 */
function isMatchPastResultReminderTime(
  matchRow: SupabaseMatchRecordRow,
  postRows: SupabasePostRow[],
) {
  const sourcePost = matchRow.source_post_id
    ? postRows.find((postRow) => postRow.id === matchRow.source_post_id)
    : null;
  const reminderTime =
    sourcePost?.scheduled_end_time?.slice(0, 5) ??
    addMinutesToTimeValue(matchRow.scheduled_start_time, 90);
  const reminderDateTime = new Date(
    `${matchRow.scheduled_date}T${reminderTime}:00`,
  );

  return reminderDateTime.getTime() <= Date.now();
}

/**
 * Suma minutos a un valor de hora SQL.
 * Se construye como fallback cuando no hay hora de fin.
 * Lo usa isMatchPastResultReminderTime.
 * Sirve para evitar cambiar el modelo de partido en esta iteracion.
 */
function addMinutesToTimeValue(timeValue: string, minutesToAdd: number) {
  const [hours, minutes] = timeValue.slice(0, 5).split(":").map(Number);
  const dateValue = new Date(2000, 0, 1, hours, minutes + minutesToAdd);
  const nextHours = `${dateValue.getHours()}`.padStart(2, "0");
  const nextMinutes = `${dateValue.getMinutes()}`.padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}

/**
 * Detecta errores provocados por una base todavia sin la ultima migracion.
 * Se construye para degradar flujos nuevos en vez de mostrar errores tecnicos.
 * Lo usa el repositorio Supabase en RPC e inserts nuevos.
 * Sirve como puente hasta aplicar la migracion incremental.
 */
function isMissingSchemaFeatureError(error: SupabaseRepositoryError) {
  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedMessage.includes("schema cache") ||
    normalizedMessage.includes("could not find the function") ||
    normalizedMessage.includes("related_post_id") ||
    normalizedMessage.includes("related_match_id") ||
    normalizedMessage.includes("source_post_id") ||
    normalizedMessage.includes("answer_match_join_request") ||
    normalizedMessage.includes("answer_direct_match_invitation") ||
    normalizedMessage.includes("cancel_match_join_request") ||
    normalizedMessage.includes("cancel_direct_match_invitation")
  );
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
  return new Error(
    `No se pudo ${actionDescription}: ${getReadableSupabaseErrorMessage(error)}`,
  );
}

/**
 * Traduce errores tecnicos de Supabase a mensajes de producto.
 * Se construye para que la UI no muestre ingles ni detalles internos.
 * Lo usa createSupabaseError.
 * Sirve para orientar al usuario sin exponer SQL, RLS o schema cache.
 */
function getReadableSupabaseErrorMessage(error: SupabaseRepositoryError) {
  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("schema cache") ||
    normalizedMessage.includes("could not find the function") ||
    normalizedMessage.includes("could not find") ||
    normalizedMessage.includes("column")
  ) {
    return "la base de datos todavía no tiene la última actualización aplicada.";
  }

  if (
    normalizedMessage.includes("duplicate key") ||
    normalizedMessage.includes("already exists")
  ) {
    return "ese registro ya existe.";
  }

  if (
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("permission denied") ||
    normalizedMessage.includes("not authorized") ||
    normalizedMessage.includes("not allowed") ||
    normalizedMessage.includes("violates")
  ) {
    return "no tenés permisos para realizar esta acción.";
  }

  if (
    normalizedMessage.includes("jwt") ||
    normalizedMessage.includes("token") ||
    normalizedMessage.includes("session")
  ) {
    return "tu sesión venció. Cerrá sesión e ingresá nuevamente.";
  }

  if (normalizedMessage.includes("network")) {
    return "no pudimos conectar con el servidor. Revisá tu conexión.";
  }

  return "ocurrió un problema al guardar los cambios.";
}
