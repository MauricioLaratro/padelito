-- Restringe datos de contacto para que el perfil publico no exponga telefonos por REST.
-- El telefono queda guardable por el usuario, pero no se lee en snapshots publicos.

revoke select on public.profiles from anon, authenticated;

grant select (
  id,
  profile_type,
  display_name,
  avatar_url,
  bio,
  usual_place,
  player_level,
  preferred_position,
  preferred_play_style,
  organization_kind,
  organization_link,
  created_at,
  updated_at
) on public.profiles to anon, authenticated;
