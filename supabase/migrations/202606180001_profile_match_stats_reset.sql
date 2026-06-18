-- Agrega reset de estadisticas por perfil.
-- No modifica resultados historicos; solo permite recalcular el score desde una fecha controlada por backend.

alter table public.profiles
add column if not exists match_stats_reset_at timestamptz;

grant select (
  id,
  profile_type,
  display_name,
  avatar_url,
  bio,
  usual_place,
  match_stats_reset_at,
  player_level,
  preferred_position,
  preferred_play_style,
  organization_kind,
  organization_link,
  created_at,
  updated_at
) on public.profiles to anon, authenticated;

revoke update on public.profiles from anon, authenticated;

grant update (
  id,
  profile_type,
  display_name,
  avatar_url,
  bio,
  whatsapp_phone,
  usual_place,
  player_level,
  preferred_position,
  preferred_play_style,
  organization_kind,
  organization_link
) on public.profiles to authenticated;

-- Bloquea updates directos de la fecha de reset para que no sea editable a mano.
create or replace function public.prevent_profile_match_stats_reset_direct_update()
returns trigger
language plpgsql
as $$
begin
  if new.match_stats_reset_at is distinct from old.match_stats_reset_at
    and coalesce(current_setting('app.allow_match_stats_reset', true), '') <> 'on' then
    raise exception 'Solo se permite resetear estadisticas desde la accion de perfil';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_match_stats_reset_direct_update
on public.profiles;

create trigger profiles_prevent_match_stats_reset_direct_update
before update of match_stats_reset_at on public.profiles
for each row execute function public.prevent_profile_match_stats_reset_direct_update();

-- Resetea el score del perfil autenticado usando la hora del servidor.
create or replace function public.reset_own_match_stats()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  reset_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para resetear estadisticas';
  end if;

  reset_at := now();

  perform set_config('app.allow_match_stats_reset', 'on', true);

  update public.profiles
  set match_stats_reset_at = reset_at
  where id = auth.uid();

  if not found then
    raise exception 'Perfil no encontrado';
  end if;

  return reset_at;
end;
$$;

revoke all on function public.prevent_profile_match_stats_reset_direct_update()
from public;
revoke all on function public.reset_own_match_stats() from public;
grant execute on function public.reset_own_match_stats() to authenticated;
