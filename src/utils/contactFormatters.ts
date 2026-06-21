/**
 * Crea una URL de WhatsApp desde un telefono cargado por el usuario.
 * Se construye para centralizar la normalizacion antes de abrir enlaces externos.
 * Lo usan acciones privadas de contacto.
 * Sirve para evitar duplicar limpieza de simbolos en componentes.
 */
const argentinaWhatsappPrefix = "549";

export function createWhatsappContactUrl(whatsappPhone: string) {
  const normalizedWhatsappPhone = whatsappPhone.replace(/\D/g, "");

  if (!normalizedWhatsappPhone) {
    return null;
  }

  return `https://wa.me/${normalizedWhatsappPhone}`;
}

/**
 * Formatea telefono de WhatsApp para lectura.
 * Se construye para mostrar contacto sin romper el formato guardado para wa.me.
 * Lo usan perfiles publicos cuando el telefono ya esta disponible.
 * Sirve para que el numero sea reconocible para usuarios argentinos.
 */
export function formatWhatsappDisplayPhone(whatsappPhone: string) {
  const normalizedWhatsappPhone = whatsappPhone.replace(/\D/g, "");

  if (!normalizedWhatsappPhone) {
    return "";
  }

  return `+${normalizedWhatsappPhone}`;
}

/**
 * Obtiene la parte local del WhatsApp argentino.
 * Se construye para mostrar `+549` fijo sin duplicarlo.
 * Lo usa ProfileForm.
 * Sirve para que el usuario cargue solo area y numero.
 */
export function getArgentinianWhatsappLocalPhone(whatsappPhone?: string) {
  const normalizedWhatsappPhone = (whatsappPhone ?? "").replace(/\D/g, "");

  if (normalizedWhatsappPhone.startsWith(argentinaWhatsappPrefix)) {
    return normalizedWhatsappPhone.slice(argentinaWhatsappPrefix.length);
  }

  if (normalizedWhatsappPhone.startsWith("54")) {
    return normalizedWhatsappPhone.slice(2).replace(/^9/, "");
  }

  return normalizedWhatsappPhone.replace(/^0+/, "");
}

/**
 * Normaliza WhatsApp argentino para persistirlo.
 * Se construye para guardar siempre el formato usado por `wa.me`.
 * Lo usa ProfileForm antes de guardar.
 * Sirve para evitar numeros como `549549...`.
 */
export function createArgentinianWhatsappPhone(localOrFullPhone: string) {
  const localWhatsappPhone =
    getArgentinianWhatsappLocalPhone(localOrFullPhone);

  if (!localWhatsappPhone) {
    return "";
  }

  return `${argentinaWhatsappPrefix}${localWhatsappPhone}`;
}
