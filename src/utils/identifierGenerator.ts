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

/**
 * Genera un UUID compatible con columnas uuid de Supabase.
 * Se construye para entidades normalizadas que enlazan tablas remotas.
 * Lo usan formularios que necesitan conocer el id antes de insertar hijos.
 * Sirve para evitar ids con prefijo en relaciones SQL.
 */
export function createUuidIdentifier() {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (digit) =>
    (
      Number(digit) ^
      (Math.random() * 16) >>
        (Number(digit) / 4)
    ).toString(16),
  );
}
