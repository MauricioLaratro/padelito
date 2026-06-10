/**
 * Crea una URL de WhatsApp desde un telefono cargado por el usuario.
 * Se construye para centralizar la normalizacion antes de abrir enlaces externos.
 * Lo usan acciones privadas de contacto.
 * Sirve para evitar duplicar limpieza de simbolos en componentes.
 */
export function createWhatsappContactUrl(whatsappPhone: string) {
  const normalizedWhatsappPhone = whatsappPhone.replace(/\D/g, "");

  if (!normalizedWhatsappPhone) {
    return null;
  }

  return `https://wa.me/${normalizedWhatsappPhone}`;
}
