-- Refina actividad operativa, notificaciones y cancelaciones aceptadas.
-- Mantiene consistencia entre posts, partidos estructurados y bandeja de avisos.

alter type public.notification_type
add value if not exists 'match_result_reminder';

alter type public.notification_type
add value if not exists 'match_result_recorded';

alter table public.notifications
add column if not exists related_match_id uuid references public.match_records(id) on delete cascade;

create index if not exists notifications_related_match_idx
on public.notifications(related_match_id);

grant delete on public.notifications to authenticated;
grant delete on public.match_join_requests to authenticated;
grant delete on public.direct_match_invitations to authenticated;

drop policy if exists "recipients delete their notifications"
on public.notifications;

create policy "recipients delete their notifications"
on public.notifications for delete
using (recipient_profile_id = auth.uid());

drop policy if exists "participants delete closed join requests"
on public.match_join_requests;

create policy "participants delete closed join requests"
on public.match_join_requests for delete
using (
  status in ('cancelled'::public.request_status, 'rejected'::public.request_status)
  and (
    requester_profile_id = auth.uid()
    or owner_profile_id = auth.uid()
  )
);

drop policy if exists "participants delete closed invitations"
on public.direct_match_invitations;

create policy "participants delete closed invitations"
on public.direct_match_invitations for delete
using (
  status in ('cancelled'::public.invitation_status, 'rejected'::public.invitation_status)
  and (
    inviter_profile_id = auth.uid()
    or invited_profile_id = auth.uid()
  )
);

-- Quita un jugador del texto compacto de confirmados.
-- Existe mientras el MVP mantiene confirmados visibles como texto.
create or replace function public.remove_confirmed_player_name(
  current_confirmed_text text,
  released_player_name text
)
returns text
language plpgsql
immutable
as $$
declare
  normalized_player_name text;
  remaining_names text[];
  candidate_name text;
begin
  normalized_player_name := lower(btrim(coalesce(released_player_name, '')));

  if current_confirmed_text is null or btrim(current_confirmed_text) = '' then
    return current_confirmed_text;
  end if;

  if normalized_player_name = '' then
    return current_confirmed_text;
  end if;

  remaining_names := array[]::text[];

  foreach candidate_name in array string_to_array(current_confirmed_text, ',')
  loop
    if lower(btrim(candidate_name)) <> normalized_player_name then
      remaining_names := array_append(remaining_names, btrim(candidate_name));
    end if;
  end loop;

  if array_length(remaining_names, 1) is null then
    return null;
  end if;

  return left(array_to_string(remaining_names, ', '), 180);
end;
$$;

-- Devuelve un cupo al post vinculado cuando se cancela una aceptacion.
-- Reactiva el post solo si habia quedado completo por cupo cero.
create or replace function public.release_accepted_player_on_post(
  target_post_id uuid,
  released_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  released_player_name text;
begin
  if target_post_id is null then
    return;
  end if;

  select released_profile.display_name
  into released_player_name
  from public.profiles released_profile
  where released_profile.id = released_profile_id;

  update public.posts
  set
    missing_players_count = least(coalesce(missing_players_count, 0) + 1, 24),
    confirmed_players_text = public.remove_confirmed_player_name(
      confirmed_players_text,
      released_player_name
    ),
    is_active = case
      when coalesce(missing_players_count, 0) = 0 then true
      else is_active
    end,
    updated_at = now()
  where id = target_post_id
    and post_type = 'looking_for_player';
end;
$$;

-- Responde una invitacion y sincroniza post aunque solo venga related_match_id.
create or replace function public.answer_direct_match_invitation(
  invitation_id_input uuid,
  status_input public.invitation_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record public.direct_match_invitations%rowtype;
  source_post_id_from_match uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para responder invitaciones';
  end if;

  if status_input not in ('accepted'::public.invitation_status, 'rejected'::public.invitation_status) then
    raise exception 'Estado de invitacion invalido';
  end if;

  select *
  into invitation_record
  from public.direct_match_invitations
  where id = invitation_id_input
  for update;

  if not found then
    raise exception 'Invitacion no encontrada';
  end if;

  if invitation_record.invited_profile_id <> auth.uid() then
    raise exception 'No podes responder esta invitacion';
  end if;

  if invitation_record.status <> 'pending' then
    return;
  end if;

  if status_input = 'accepted'::public.invitation_status then
    if invitation_record.related_post_id is not null then
      perform public.register_accepted_player_on_post(
        invitation_record.related_post_id,
        invitation_record.invited_profile_id
      );

      perform public.register_accepted_player_on_linked_match(
        invitation_record.related_post_id,
        invitation_record.invited_profile_id
      );
    end if;

    if invitation_record.related_match_id is not null then
      if invitation_record.related_post_id is null then
        select match_record.source_post_id
        into source_post_id_from_match
        from public.match_records match_record
        where match_record.id = invitation_record.related_match_id;

        if source_post_id_from_match is not null then
          perform public.register_accepted_player_on_post(
            source_post_id_from_match,
            invitation_record.invited_profile_id
          );
        end if;
      end if;

      perform public.register_accepted_player_on_match(
        invitation_record.related_match_id,
        invitation_record.invited_profile_id
      );
    end if;
  end if;

  update public.direct_match_invitations
  set
    status = status_input,
    updated_at = now()
  where id = invitation_id_input;
end;
$$;

-- Cancela una solicitud pendiente o una participacion ya aceptada.
-- Si estaba aceptada, libera post y participante estructurado.
create or replace function public.cancel_match_join_request(
  request_id_input uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.match_join_requests%rowtype;
  linked_match_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para cancelar solicitudes';
  end if;

  select *
  into request_record
  from public.match_join_requests
  where id = request_id_input
  for update;

  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  if request_record.status = 'pending'::public.request_status
    and request_record.requester_profile_id <> auth.uid() then
    raise exception 'No podes cancelar esta solicitud';
  end if;

  if request_record.status = 'accepted'::public.request_status
    and request_record.requester_profile_id <> auth.uid()
    and request_record.owner_profile_id <> auth.uid() then
    raise exception 'No podes cancelar esta participacion';
  end if;

  if request_record.status not in (
    'pending'::public.request_status,
    'accepted'::public.request_status
  ) then
    return;
  end if;

  if request_record.status = 'accepted'::public.request_status then
    perform public.release_accepted_player_on_post(
      request_record.post_id,
      request_record.requester_profile_id
    );

    select match_record.id
    into linked_match_id
    from public.match_records match_record
    where match_record.source_post_id = request_record.post_id
      and match_record.status = 'scheduled'
    order by match_record.created_at desc
    limit 1;

    if linked_match_id is not null then
      delete from public.match_participants
      where match_id = linked_match_id
        and profile_id = request_record.requester_profile_id;
    end if;
  end if;

  update public.match_join_requests
  set
    status = 'cancelled'::public.request_status,
    updated_at = now()
  where id = request_id_input;
end;
$$;

-- Cancela una invitacion pendiente o una participacion aceptada.
-- Si estaba aceptada, libera el cupo y remueve participante del partido.
create or replace function public.cancel_direct_match_invitation(
  invitation_id_input uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record public.direct_match_invitations%rowtype;
  linked_match_id uuid;
  linked_post_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para cancelar invitaciones';
  end if;

  select *
  into invitation_record
  from public.direct_match_invitations
  where id = invitation_id_input
  for update;

  if not found then
    raise exception 'Invitacion no encontrada';
  end if;

  if invitation_record.status = 'pending'::public.invitation_status
    and invitation_record.inviter_profile_id <> auth.uid() then
    raise exception 'No podes cancelar esta invitacion';
  end if;

  if invitation_record.status = 'accepted'::public.invitation_status
    and invitation_record.inviter_profile_id <> auth.uid()
    and invitation_record.invited_profile_id <> auth.uid() then
    raise exception 'No podes cancelar esta participacion';
  end if;

  if invitation_record.status not in (
    'pending'::public.invitation_status,
    'accepted'::public.invitation_status
  ) then
    return;
  end if;

  if invitation_record.status = 'accepted'::public.invitation_status then
    linked_match_id := invitation_record.related_match_id;
    linked_post_id := invitation_record.related_post_id;

    if linked_match_id is null and linked_post_id is not null then
      select match_record.id
      into linked_match_id
      from public.match_records match_record
      where match_record.source_post_id = linked_post_id
        and match_record.status = 'scheduled'
      order by match_record.created_at desc
      limit 1;
    end if;

    if linked_post_id is null and linked_match_id is not null then
      select match_record.source_post_id
      into linked_post_id
      from public.match_records match_record
      where match_record.id = linked_match_id;
    end if;

    perform public.release_accepted_player_on_post(
      linked_post_id,
      invitation_record.invited_profile_id
    );

    if linked_match_id is not null then
      delete from public.match_participants
      where match_id = linked_match_id
        and profile_id = invitation_record.invited_profile_id;
    end if;
  end if;

  update public.direct_match_invitations
  set
    status = 'cancelled'::public.invitation_status,
    updated_at = now()
  where id = invitation_id_input;
end;
$$;

revoke all on function public.remove_confirmed_player_name(text, text) from public;
revoke all on function public.release_accepted_player_on_post(uuid, uuid) from public;
revoke all on function public.cancel_match_join_request(uuid) from public;
revoke all on function public.cancel_direct_match_invitation(uuid) from public;

grant execute on function public.cancel_match_join_request(uuid) to authenticated;
grant execute on function public.cancel_direct_match_invitation(uuid) to authenticated;
grant execute on function public.answer_direct_match_invitation(uuid, public.invitation_status) to authenticated;
