import type { MatchRecord } from "../domain/models/matchModels";
import type { Post } from "../domain/models/postModels";

const defaultOpportunityDurationMinutes = 120;

interface ScheduledOpportunity {
  scheduledDate: string;
  scheduledEndTime?: string;
  scheduledStartTime: string;
}

/**
 * Indica si una publicacion todavia debe aparecer en el feed.
 * Se construye para retirar oportunidades vencidas sin borrar historial.
 * Lo usa getVisiblePostsForFeed.
 * Sirve para que Inicio solo muestre partidos, eventos y disponibilidades vigentes.
 */
export function isPostCurrentForFeed(
  post: Post,
  currentDate: Date = new Date(),
) {
  return isScheduledOpportunityCurrent(post, currentDate);
}

/**
 * Indica si un partido propio todavia puede recibir invitaciones.
 * Se construye para no ofrecer partidos vencidos en el modal de invitacion.
 * Lo usa App al preparar opciones del modal.
 * Sirve para evitar invitaciones a oportunidades antiguas.
 */
export function isMatchCurrentForInvitation(
  matchRecord: MatchRecord,
  currentDate: Date = new Date(),
) {
  return isScheduledOpportunityCurrent(matchRecord, currentDate);
}

/**
 * Evalua vigencia temporal de una oportunidad.
 * Se construye para compartir criterio entre publicaciones y partidos.
 * Lo usan helpers de feed e invitaciones.
 * Sirve para mantener una ventana razonable cuando no hay hora de fin cargada.
 */
function isScheduledOpportunityCurrent(
  scheduledOpportunity: ScheduledOpportunity,
  currentDate: Date,
) {
  return (
    createOpportunityEndDate(scheduledOpportunity).getTime() >
    currentDate.getTime()
  );
}

/**
 * Calcula el fin de una oportunidad con calendario local.
 * Se construye para evitar corrimientos UTC en fechas `YYYY-MM-DD`.
 * Lo usa isScheduledOpportunityCurrent.
 * Sirve para que una publicacion sin hora de fin dure una ventana operativa.
 */
function createOpportunityEndDate(
  scheduledOpportunity: ScheduledOpportunity,
) {
  const startDate = createLocalDateTime(
    scheduledOpportunity.scheduledDate,
    scheduledOpportunity.scheduledStartTime,
  );

  if (!scheduledOpportunity.scheduledEndTime) {
    const fallbackEndDate = new Date(startDate);
    fallbackEndDate.setMinutes(
      fallbackEndDate.getMinutes() + defaultOpportunityDurationMinutes,
    );

    return fallbackEndDate;
  }

  const explicitEndDate = createLocalDateTime(
    scheduledOpportunity.scheduledDate,
    scheduledOpportunity.scheduledEndTime,
  );

  if (explicitEndDate.getTime() <= startDate.getTime()) {
    explicitEndDate.setDate(explicitEndDate.getDate() + 1);
  }

  return explicitEndDate;
}

/**
 * Convierte fecha y hora SQL a Date local.
 * Se construye para no depender del parseo UTC del navegador.
 * Lo usa createOpportunityEndDate.
 * Sirve para comparar fechas de feed con el reloj del dispositivo.
 */
function createLocalDateTime(scheduledDate: string, scheduledTime: string) {
  const [year, month, day] = scheduledDate.split("-").map(Number);
  const [hours, minutes] = scheduledTime.slice(0, 5).split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}
