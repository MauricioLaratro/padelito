import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/**
 * Expone el cliente Supabase cuando existen variables de entorno.
 * Se construye para no pedir credenciales antes de necesitarlas.
 * Lo usaran repositorios remotos de auth, perfiles, posts y notificaciones.
 * Sirve como punto unico de acceso a Supabase.
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabaseBrowserClient = createSupabaseBrowserClient();
