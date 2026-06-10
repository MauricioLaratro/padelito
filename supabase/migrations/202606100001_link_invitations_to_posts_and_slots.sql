-- Vincula invitaciones directas con partidos abiertos y normaliza cupos rotativos.
-- Permite cupos faltantes de 0 a 24 para cubrir partidos completos y rotativos largos.

alter table public.posts
drop constraint if exists posts_missing_players_count_check;

alter table public.posts
add constraint posts_missing_players_count_check
check (missing_players_count is null or missing_players_count between 0 and 24);

alter table public.direct_match_invitations
add column if not exists related_post_id uuid references public.posts(id) on delete set null;

create index if not exists direct_match_invitations_related_post_idx
on public.direct_match_invitations(related_post_id);

-- Mantiene inmutable el partido asociado a una invitacion ya creada.
create or replace function public.prevent_direct_match_invitation_core_update()
returns trigger
language plpgsql
as $$
begin
  if new.inviter_profile_id is distinct from old.inviter_profile_id
    or new.invited_profile_id is distinct from old.invited_profile_id
    or new.related_post_id is distinct from old.related_post_id
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

-- Permite leer partidos completos a autores y participantes relacionados.
create or replace function public.can_read_post(target_post_id uuid, viewer_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts visible_post
    where visible_post.id = target_post_id
      and (
        (
          visible_post.is_active = true
          and (
            visible_post.visibility = 'public'
            or visible_post.author_profile_id = viewer_profile_id
            or exists (
              select 1
              from public.follows visible_follow
              where visible_follow.follower_profile_id = viewer_profile_id
                and visible_follow.followed_profile_id = visible_post.author_profile_id
            )
          )
        )
        or visible_post.author_profile_id = viewer_profile_id
        or exists (
          select 1
          from public.match_join_requests visible_request
          where visible_request.post_id = visible_post.id
            and visible_request.requester_profile_id = viewer_profile_id
        )
        or exists (
          select 1
          from public.direct_match_invitations visible_invitation
          where visible_invitation.related_post_id = visible_post.id
            and visible_invitation.invited_profile_id = viewer_profile_id
        )
      )
  );
$$;

-- Agrega el jugador aceptado al texto de confirmados sin duplicados simples.
create or replace function public.append_confirmed_player_name(
  current_confirmed_text text,
  accepted_player_name text
)
returns text
language plpgsql
immutable
as $$
declare
  normalized_player_name text;
  next_confirmed_text text;
begin
  normalized_player_name := btrim(coalesce(accepted_player_name, ''));

  if normalized_player_name = '' then
    return current_confirmed_text;
  end if;

  if current_confirmed_text is not null
    and strpos(lower(current_confirmed_text), lower(normalized_player_name)) > 0 then
    return current_confirmed_text;
  end if;

  if current_confirmed_text is null or btrim(current_confirmed_text) = '' then
    next_confirmed_text := normalized_player_name;
  else
    next_confirmed_text := current_confirmed_text || ', ' || normalized_player_name;
  end if;

  return left(next_confirmed_text, 180);
end;
$$;

-- Descuenta un cupo real del partido y registra al jugador confirmado.
create or replace function public.register_accepted_player_on_post(
  target_post_id uuid,
  accepted_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_player_name text;
begin
  select accepted_profile.display_name
  into accepted_player_name
  from public.profiles accepted_profile
  where accepted_profile.id = accepted_profile_id;

  update public.posts
  set
    missing_players_count = greatest(coalesce(missing_players_count, 0) - 1, 0),
    confirmed_players_text = public.append_confirmed_player_name(
      confirmed_players_text,
      accepted_player_name
    ),
    is_active = greatest(coalesce(missing_players_count, 0) - 1, 0) > 0,
    updated_at = now()
  where id = target_post_id
    and post_type = 'looking_for_player'
    and is_active = true
    and coalesce(missing_players_count, 0) > 0;

  if not found then
    raise exception 'El partido ya no tiene cupos disponibles';
  end if;
end;
$$;

-- Responde una solicitud de union y actualiza cupos si fue aceptada.
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
  end if;

  update public.match_join_requests
  set status = status_input
  where id = request_id_input;
end;
$$;

-- Responde una invitacion y descuenta cupo del partido asociado si existe.
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

  if status_input = 'accepted'::public.invitation_status
    and invitation_record.related_post_id is not null then
    perform public.register_accepted_player_on_post(
      invitation_record.related_post_id,
      invitation_record.invited_profile_id
    );
  end if;

  update public.direct_match_invitations
  set status = status_input
  where id = invitation_id_input;
end;
$$;

revoke all on function public.append_confirmed_player_name(text, text) from public;
revoke all on function public.register_accepted_player_on_post(uuid, uuid) from public;
grant execute on function public.answer_match_join_request(uuid, public.request_status) to authenticated;
grant execute on function public.answer_direct_match_invitation(uuid, public.invitation_status) to authenticated;

drop policy if exists "owners answer pending join requests"
on public.match_join_requests;

drop policy if exists "invited users answer direct invitations"
on public.direct_match_invitations;

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
);
