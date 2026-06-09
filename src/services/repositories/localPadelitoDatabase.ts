import { createCurrentIsoDate } from "../../utils/dateFormatters";
import type { PadelitoRepositorySnapshot } from "./padelitoRepository";

export type PadelitoLocalDatabase = PadelitoRepositorySnapshot;

const currentTimestamp = createCurrentIsoDate();

/**
 * Crea la base local inicial del MVP.
 * Se construye para probar flujos sin depender todavia de credenciales Supabase.
 * La usa usePadelitoMvp como estado inicial.
 * Sirve para tener comunidad, seguidores, publicaciones y actividad de ejemplo.
 */
export function createInitialLocalDatabase(): PadelitoLocalDatabase {
  return {
    profiles: [
      {
        profileId: "profile_current_player",
        profileType: "player",
        displayName: "Mauricio Demo",
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
      },
      {
        profileId: "profile_sofia_rivera",
        profileType: "player",
        displayName: "Sofia Rivera",
        avatarUrl: "",
        bio: "Drive, partidos competitivos y tercer tiempo.",
        whatsappPhone: "5491100000001",
        usualPlace: "Club Norte",
        playerLevel: "fifth",
        preferredPosition: "drive",
        preferredPlayStyle: "competitive",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        isOnboardingComplete: true,
      },
      {
        profileId: "profile_club_norte",
        profileType: "organization",
        displayName: "Club Norte",
        avatarUrl: "",
        bio: "Turnos, americanos y eventos sociales de padel.",
        whatsappPhone: "5491100000002",
        usualPlace: "Nuñez",
        organizationKind: "club",
        organizationLink: "https://wa.me/5491100000002",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        isOnboardingComplete: true,
      },
    ],
    follows: [
      {
        followerProfileId: "profile_current_player",
        followedProfileId: "profile_sofia_rivera",
        createdAt: currentTimestamp,
      },
      {
        followerProfileId: "profile_current_player",
        followedProfileId: "profile_club_norte",
        createdAt: currentTimestamp,
      },
    ],
    posts: [
      {
        postId: "post_match_club_norte",
        authorProfileId: "profile_sofia_rivera",
        postType: "looking_for_player",
        visibility: "public",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        scheduledDate: "2026-06-10",
        scheduledStartTime: "20:00",
        placeText: "Club Norte",
        shortNote: "Partido armado, buscamos alguien puntual.",
        isActive: true,
        desiredLevel: "fifth",
        desiredPosition: "backhand",
        desiredPlayStyle: "competitive",
        missingPlayersCount: 1,
        confirmedPlayersText: "Sofia, Agus y Martin",
      },
      {
        postId: "post_available_palermo",
        authorProfileId: "profile_current_player",
        postType: "available_to_play",
        visibility: "public",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        scheduledDate: "2026-06-12",
        scheduledStartTime: "18:00",
        scheduledEndTime: "22:00",
        placeText: "Palermo / Club Norte",
        shortNote: "Puedo sumarme a partido ya armado.",
        isActive: true,
        availableLevel: "sixth",
        availablePosition: "drive",
        availablePlayStyle: "both",
        preferredPlaceText: "Palermo / Belgrano",
      },
      {
        postId: "post_event_americano",
        authorProfileId: "profile_club_norte",
        postType: "event",
        visibility: "public",
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        scheduledDate: "2026-06-15",
        scheduledStartTime: "19:30",
        placeText: "Club Norte",
        shortNote: "Cupos limitados",
        isActive: true,
        title: "Americano nocturno",
        description:
          "Formato social por categoria, musica y tercer tiempo al finalizar.",
        imageUrl: "",
        whatsappUrl: "https://wa.me/5491100000002",
        registrationUrl: "https://example.com/americano",
        googleMapsUrl: "https://maps.google.com",
      },
    ],
    postInteractions: [
      {
        interactionId: "interaction_current_interested",
        postId: "post_event_americano",
        profileId: "profile_current_player",
        interactionType: "interested",
        createdAt: currentTimestamp,
      },
    ],
    matchJoinRequests: [],
    directMatchInvitations: [],
    notifications: [
      {
        notificationId: "notification_welcome",
        recipientProfileId: "profile_current_player",
        actorProfileId: "profile_club_norte",
        notificationType: "event_reminder",
        relatedPostId: "post_event_americano",
        title: "Evento recomendado",
        body: "Club Norte publico un americano compatible con tu perfil.",
        createdAt: currentTimestamp,
      },
    ],
    sessionProfileId: undefined,
    quickAccessPromptDismissed: false,
  };
}
