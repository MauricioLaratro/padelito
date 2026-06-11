-- Agrega desafios recurrentes entre equipos y los vincula con partidos.
-- El marcador se calcula desde `match_results`; no se materializan agregados.

do $$
begin
  create type public.recurring_challenge_frequency as enum (
    'weekly',
    'biweekly',
    'monthly',
    'manual'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.recurring_challenge_status as enum (
    'active',
    'paused',
    'archived'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.recurring_challenge_side as enum ('team_a', 'team_b');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.recurring_challenges (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  frequency public.recurring_challenge_frequency not null default 'weekly',
  usual_day_of_week integer check (usual_day_of_week between 0 and 6),
  usual_time time,
  usual_place_text text check (
    usual_place_text is null or char_length(usual_place_text) <= 140
  ),
  status public.recurring_challenge_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_challenges_owner_idx
on public.recurring_challenges(owner_profile_id, created_at desc);

drop trigger if exists recurring_challenges_set_updated_at
on public.recurring_challenges;

create trigger recurring_challenges_set_updated_at
before update on public.recurring_challenges
for each row execute function public.set_updated_at();

create table if not exists public.recurring_challenge_participants (
  challenge_id uuid not null references public.recurring_challenges(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  side public.recurring_challenge_side not null,
  created_at timestamptz not null default now(),
  primary key (challenge_id, profile_id)
);

create index if not exists recurring_challenge_participants_profile_idx
on public.recurring_challenge_participants(profile_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'match_records_recurring_challenge_id_fkey'
  ) then
    alter table public.match_records
    add constraint match_records_recurring_challenge_id_fkey
    foreign key (recurring_challenge_id)
    references public.recurring_challenges(id)
    on delete set null;
  end if;
end;
$$;

alter table public.recurring_challenges enable row level security;
alter table public.recurring_challenge_participants enable row level security;

create or replace function public.can_read_recurring_challenge(
  target_challenge_id uuid,
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
    from public.recurring_challenges visible_challenge
    where visible_challenge.id = target_challenge_id
      and (
        visible_challenge.owner_profile_id = viewer_profile_id
        or exists (
          select 1
          from public.recurring_challenge_participants visible_participant
          where visible_participant.challenge_id = visible_challenge.id
            and visible_participant.profile_id = viewer_profile_id
        )
      )
  );
$$;

drop policy if exists "recurring challenges visible to members"
on public.recurring_challenges;

create policy "recurring challenges visible to members"
on public.recurring_challenges for select
using (public.can_read_recurring_challenge(id, auth.uid()));

drop policy if exists "owners create recurring challenges"
on public.recurring_challenges;

create policy "owners create recurring challenges"
on public.recurring_challenges for insert
with check (owner_profile_id = auth.uid());

drop policy if exists "owners update recurring challenges"
on public.recurring_challenges;

create policy "owners update recurring challenges"
on public.recurring_challenges for update
using (owner_profile_id = auth.uid())
with check (owner_profile_id = auth.uid());

drop policy if exists "recurring challenge participants visible to members"
on public.recurring_challenge_participants;

create policy "recurring challenge participants visible to members"
on public.recurring_challenge_participants for select
using (public.can_read_recurring_challenge(challenge_id, auth.uid()));

drop policy if exists "owners create recurring challenge participants"
on public.recurring_challenge_participants;

create policy "owners create recurring challenge participants"
on public.recurring_challenge_participants for insert
with check (
  exists (
    select 1
    from public.recurring_challenges owned_challenge
    where owned_challenge.id = challenge_id
      and owned_challenge.owner_profile_id = auth.uid()
  )
);

revoke all on function public.can_read_recurring_challenge(uuid, uuid) from public;
grant execute on function public.can_read_recurring_challenge(uuid, uuid) to authenticated;
