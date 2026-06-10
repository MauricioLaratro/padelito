-- Corrige RLS de partidos para evitar recursion al leer participantes.
-- Centraliza la lectura de partido en una funcion security definer.

create or replace function public.can_read_match(
  target_match_id uuid,
  viewer_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.match_records visible_match
    where visible_match.id = target_match_id
      and (
        visible_match.owner_profile_id = viewer_profile_id
        or exists (
          select 1
          from public.match_participants visible_participant
          where visible_participant.match_id = visible_match.id
            and visible_participant.profile_id = viewer_profile_id
        )
      )
  );
$$;

revoke all on function public.can_read_match(uuid, uuid) from public;
grant execute on function public.can_read_match(uuid, uuid) to authenticated;

drop policy if exists "match records visible to owner and participants" on public.match_records;
create policy "match records visible to owner and participants"
on public.match_records for select
using (public.can_read_match(id, auth.uid()));

drop policy if exists "match participants visible by match access" on public.match_participants;
create policy "match participants visible by match access"
on public.match_participants for select
using (public.can_read_match(match_id, auth.uid()));

drop policy if exists "match results visible by match access" on public.match_results;
create policy "match results visible by match access"
on public.match_results for select
using (public.can_read_match(match_id, auth.uid()));
