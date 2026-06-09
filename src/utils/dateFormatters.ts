/**
 * Formatea fecha y hora compactas para cards.
 * Se construye para evitar duplicar texto temporal en UI.
 * Lo usan cards, actividad y notificaciones.
 * Sirve para mantener lectura rapida mobile-first.
 */
export function formatScheduledDateTime(
  scheduledDate: string,
  scheduledStartTime: string,
  scheduledEndTime?: string,
) {
  const formattedDate = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${scheduledDate}T12:00:00`));

  if (!scheduledEndTime) {
    return `${formattedDate} ${scheduledStartTime}`;
  }

  return `${formattedDate} ${scheduledStartTime}-${scheduledEndTime}`;
}

/**
 * Devuelve una marca ISO actual.
 * Se construye para centralizar fechas creadas por acciones locales.
 * Lo usan repositorios y casos de uso.
 * Sirve para que las entidades tengan timestamps consistentes.
 */
export function createCurrentIsoDate() {
  return new Date().toISOString();
}
