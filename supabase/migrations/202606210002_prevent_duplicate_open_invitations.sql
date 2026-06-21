-- Evita multiples invitaciones abiertas para el mismo jugador y el mismo partido/publicacion.
-- Existe para proteger el flujo ante doble toque, recargas o dos sesiones del mismo usuario.

with ranked_open_invitations as (
  select
    direct_match_invitations.id,
    row_number() over (
      partition by
        direct_match_invitations.inviter_profile_id,
        direct_match_invitations.invited_profile_id,
        coalesce(
          direct_match_invitations.related_match_id,
          '00000000-0000-0000-0000-000000000000'::uuid
        ),
        coalesce(
          direct_match_invitations.related_post_id,
          '00000000-0000-0000-0000-000000000000'::uuid
        )
      order by
        case direct_match_invitations.status
          when 'accepted' then 0
          else 1
        end,
        direct_match_invitations.created_at desc
    ) as duplicate_rank
  from public.direct_match_invitations
  where direct_match_invitations.status in ('pending', 'accepted')
)
update public.direct_match_invitations
set
  status = 'cancelled',
  updated_at = now()
where direct_match_invitations.id in (
  select ranked_open_invitations.id
  from ranked_open_invitations
  where ranked_open_invitations.duplicate_rank > 1
);

create unique index if not exists direct_match_invitations_open_target_unique_idx
on public.direct_match_invitations (
  inviter_profile_id,
  invited_profile_id,
  coalesce(related_match_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(related_post_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
where status in ('pending', 'accepted');
