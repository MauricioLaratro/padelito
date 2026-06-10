-- Expone contacto privado solo al propio usuario o a jugadores con vinculo aceptado.
-- Mantiene whatsapp_phone fuera del snapshot publico y evita filtrar datos sensibles.

create or replace function public.get_profile_private_contact(
  target_profile_id_input uuid
)
returns table (
  profile_id uuid,
  whatsapp_phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id as profile_id,
    profiles.whatsapp_phone
  from public.profiles
  where profiles.id = target_profile_id_input
    and auth.uid() is not null
    and (
      profiles.id = auth.uid()
      or exists (
        select 1
        from public.match_join_requests
        where match_join_requests.status = 'accepted'
          and (
            (
              match_join_requests.requester_profile_id = auth.uid()
              and match_join_requests.owner_profile_id = target_profile_id_input
            )
            or (
              match_join_requests.owner_profile_id = auth.uid()
              and match_join_requests.requester_profile_id = target_profile_id_input
            )
          )
      )
      or exists (
        select 1
        from public.direct_match_invitations
        where direct_match_invitations.status = 'accepted'
          and (
            (
              direct_match_invitations.inviter_profile_id = auth.uid()
              and direct_match_invitations.invited_profile_id = target_profile_id_input
            )
            or (
              direct_match_invitations.invited_profile_id = auth.uid()
              and direct_match_invitations.inviter_profile_id = target_profile_id_input
            )
          )
      )
    );
$$;

revoke all on function public.get_profile_private_contact(uuid) from public;
grant execute on function public.get_profile_private_contact(uuid) to authenticated;
