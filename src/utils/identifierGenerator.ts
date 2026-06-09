/**
 * Genera identificadores estables para entidades del MVP.
 * Se construye para funcionar en navegador aunque crypto.randomUUID no exista.
 * Lo usan repositorios locales y formularios.
 * Sirve para preparar datos con el mismo estilo conceptual que UUIDs de Supabase.
 */
export function createEntityIdentifier(prefix: string) {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
