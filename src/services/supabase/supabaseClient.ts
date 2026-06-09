import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/**
 * Indica si existen credenciales publicas de Supabase.
 * Se construye para elegir backend real sin romper el modo demo local.
 * Lo usaran hooks y pantallas de autenticacion.
 * Sirve para activar integracion remota solo cuando el entorno esta listo.
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Expone el cliente Supabase cuando existen variables de entorno.
 * Se construye para no pedir credenciales antes de necesitarlas.
 * Lo usaran repositorios remotos de auth, perfiles, posts y notificaciones.
 * Sirve como punto unico de acceso a Supabase.
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(supabaseUrl as string, supabaseAnonKey as string);
}

export const supabaseBrowserClient = createSupabaseBrowserClient();
