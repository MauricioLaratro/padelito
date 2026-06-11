-- Vincula partidos estructurados con publicaciones, solicitudes e invitaciones.
-- Permite que aceptaciones sociales alimenten `match_participants`.

alter table public.match_records
add column if not exists source_post_id uuid references public.posts(id) on delete set null;

create index if not exists match_records_source_post_idx
on public.match_records(source_post_id);

alter table public.direct_match_invitations
add column if not exists related_match_id uuid references public.match_records(id) on delete set null;

create index if not exists direct_match_invitations_related_match_idx
on public.direct_match_invitations(related_match_id);

-- Mantiene inmutable el partido asociado a una invitacion ya creada.
create or replace function public.prevent_direct_match_invitation_core_update()
returns trigger
language plpgsql
as $$
begin
  if new.inviter_profile_id is distinct from old.inviter_profile_id
    or new.invited_profile_id is distinct from old.invited_profile_id
    or new.related_post_id is distinct from old.related_post_id
    or new.related_match_id is distinct from old.related_match_id
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

-- Agrega un jugador aceptado a un partido estructurado sin duplicarlo.
create or replace function public.register_accepted_player_on_match(
  target_match_id uuid,
  accepted_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  match_record public.match_records%rowtype;
begin
  select *
  into match_record
  from public.match_records
  where id = target_match_id
  for update;

  if not found then
    raise exception 'Partido no encontrado';
  end if;

  if match_record.status <> 'scheduled' then
    raise exception 'El partido ya no esta programado';
  end if;

  insert into public.match_participants (
    match_id,
    profile_id,
    side
  )
  values (
    target_match_id,
    accepted_profile_id,
    'rotating'
  )
  on conflict (match_id, profile_id) do nothing;
end;
$$;

-- Conecta una publicacion Busco jugador con su partido estructurado si existe.
create or replace function public.register_accepted_player_on_linked_match(
  target_post_id uuid,
  accepted_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_match_id uuid;
begin
  select linked_match.id
  into linked_match_id
  from public.match_records linked_match
  where linked_match.source_post_id = target_post_id
    and linked_match.status = 'scheduled'
  order by linked_match.created_at desc
  limit 1;

  if linked_match_id is null then
    return;
  end if;

  perform public.register_accepted_player_on_match(
    linked_match_id,
    accepted_profile_id
  );
end;
$$;

-- Responde una solicitud de union y agrega participante estructurado si hay match vinculado.
create or replace function public.answer_match_join_request(
  request_id_input uuid,
  status_input public.request_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.match_join_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para responder solicitudes';
  end if;

  if status_input not in ('accepted'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Estado de solicitud invalido';
  end if;

  select *
  into request_record
  from public.match_join_requests
  where id = request_id_input
  for update;

  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  if request_record.owner_profile_id <> auth.uid() then
    raise exception 'No podes responder esta solicitud';
  end if;

  if request_record.status <> 'pending' then
    return;
  end if;

  if status_input = 'accepted'::public.request_status then
    perform public.register_accepted_player_on_post(
      request_record.post_id,
      request_record.requester_profile_id
    );

    perform public.register_accepted_player_on_linked_match(
      request_record.post_id,
      request_record.requester_profile_id
    );
  end if;

  update public.match_join_requests
  set status = status_input
  where id = request_id_input;
end;
$$;

-- Responde una invitacion y agrega participante estructurado si hay match vinculado.
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
      perform public.register_accepted_player_on_match(
        invitation_record.related_match_id,
        invitation_record.invited_profile_id
      );
    end if;
  end if;

  update public.direct_match_invitations
  set status = status_input
  where id = invitation_id_input;
end;
$$;

drop policy if exists "users create direct invitations"
on public.direct_match_invitations;

create policy "users create direct invitations"
on public.direct_match_invitations for insert
with check (
  inviter_profile_id = auth.uid()
  and (
    related_post_id is null
    or exists (
      select 1
      from public.posts invitation_post
      where invitation_post.id = related_post_id
        and invitation_post.author_profile_id = auth.uid()
        and invitation_post.post_type = 'looking_for_player'
        and invitation_post.is_active = true
        and coalesce(invitation_post.missing_players_count, 0) > 0
        and invitation_post.scheduled_date = scheduled_date
        and invitation_post.scheduled_start_time = scheduled_start_time
        and invitation_post.place_text = place_text
        and invitation_post.desired_play_style = desired_play_style
    )
  )
  and (
    related_match_id is null
    or exists (
      select 1
      from public.match_records invitation_match
      where invitation_match.id = related_match_id
        and invitation_match.owner_profile_id = auth.uid()
        and invitation_match.status = 'scheduled'
        and invitation_match.scheduled_date = scheduled_date
        and invitation_match.scheduled_start_time = scheduled_start_time
        and invitation_match.place_text = place_text
        and invitation_match.play_style = desired_play_style
        and (
          related_post_id is null
          or invitation_match.source_post_id = related_post_id
        )
    )
  )
);

revoke all on function public.register_accepted_player_on_match(uuid, uuid) from public;
revoke all on function public.register_accepted_player_on_linked_match(uuid, uuid) from public;
grant execute on function public.answer_match_join_request(uuid, public.request_status) to authenticated;
grant execute on function public.answer_direct_match_invitation(uuid, public.invitation_status) to authenticated;
