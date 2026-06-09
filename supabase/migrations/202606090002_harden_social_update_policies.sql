-- Endurece politicas de actualizacion social si la migracion inicial ya fue aplicada.
-- Mantiene la posibilidad de cancelar solicitudes/invitaciones sin permitir autoaceptaciones.

create or replace function public.prevent_match_join_request_core_update()
returns trigger
language plpgsql
as $$
begin
  if new.post_id is distinct from old.post_id
    or new.requester_profile_id is distinct from old.requester_profile_id
    or new.owner_profile_id is distinct from old.owner_profile_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at then
    raise exception 'Solo se permite actualizar el estado de la solicitud';
  end if;

  return new;
end;
$$;

drop trigger if exists match_join_requests_prevent_core_update on public.match_join_requests;

create trigger match_join_requests_prevent_core_update
before update on public.match_join_requests
for each row execute function public.prevent_match_join_request_core_update();

create or replace function public.prevent_direct_match_invitation_core_update()
returns trigger
language plpgsql
as $$
begin
  if new.inviter_profile_id is distinct from old.inviter_profile_id
    or new.invited_profile_id is distinct from old.invited_profile_id
    or new.scheduled_date is distinct from old.scheduled_date
    or new.scheduled_start_time is distinct from old.scheduled_start_time
    or new.place_text is distinct from old.place_text
    or new.desired_play_style is distinct from old.desired_play_style
    or new.note is distinct from old.note
    or new.created_at is distinct from old.created_at then
    raise exception 'Solo se permite actualizar el estado de la invitacion';
  end if;

  return new;
end;
$$;

drop trigger if exists direct_match_invitations_prevent_core_update on public.direct_match_invitations;

create trigger direct_match_invitations_prevent_core_update
before update on public.direct_match_invitations
for each row execute function public.prevent_direct_match_invitation_core_update();

drop policy if exists "requester or owner update join request"
on public.match_join_requests;

drop policy if exists "requesters cancel pending join requests"
on public.match_join_requests;

drop policy if exists "requesters reopen cancelled join requests"
on public.match_join_requests;

drop policy if exists "owners answer pending join requests"
on public.match_join_requests;

create policy "requesters cancel pending join requests"
on public.match_join_requests for update
using (requester_profile_id = auth.uid() and status = 'pending')
with check (requester_profile_id = auth.uid() and status = 'cancelled');

create policy "requesters reopen cancelled join requests"
on public.match_join_requests for update
using (requester_profile_id = auth.uid() and status = 'cancelled')
with check (requester_profile_id = auth.uid() and status = 'pending');

create policy "owners answer pending join requests"
on public.match_join_requests for update
using (owner_profile_id = auth.uid() and status = 'pending')
with check (owner_profile_id = auth.uid() and status in ('accepted', 'rejected'));

drop policy if exists "participants update direct invitations"
on public.direct_match_invitations;

drop policy if exists "invited users answer direct invitations"
on public.direct_match_invitations;

drop policy if exists "inviters cancel direct invitations"
on public.direct_match_invitations;

create policy "invited users answer direct invitations"
on public.direct_match_invitations for update
using (invited_profile_id = auth.uid() and status = 'pending')
with check (invited_profile_id = auth.uid() and status in ('accepted', 'rejected'));

create policy "inviters cancel direct invitations"
on public.direct_match_invitations for update
using (inviter_profile_id = auth.uid() and status = 'pending')
with check (inviter_profile_id = auth.uid() and status = 'cancelled');
