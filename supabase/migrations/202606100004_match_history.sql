-- Agrega partidos estructurados, participantes variables y resultados.
-- Este modulo separa historial real de publicaciones del feed.

do $$
begin
  create type public.match_status as enum ('scheduled', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.match_participant_side as enum ('team_a', 'team_b', 'rotating');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.match_winner_side as enum ('team_a', 'team_b', 'draw');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.match_records (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  recurring_challenge_id uuid,
  scheduled_date date not null,
  scheduled_start_time time not null,
  place_text text not null check (char_length(place_text) between 2 and 140),
  play_style public.play_style not null default 'competitive',
  status public.match_status not null default 'scheduled',
  short_note text check (short_note is null or char_length(short_note) <= 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists match_records_owner_idx
on public.match_records(owner_profile_id, scheduled_date desc);

drop trigger if exists match_records_set_updated_at on public.match_records;
create trigger match_records_set_updated_at
before update on public.match_records
for each row execute function public.set_updated_at();

create table if not exists public.match_participants (
  match_id uuid not null references public.match_records(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  side public.match_participant_side not null default 'rotating',
  created_at timestamptz not null default now(),
  primary key (match_id, profile_id)
);

create index if not exists match_participants_profile_idx
on public.match_participants(profile_id);

create table if not exists public.match_results (
  match_id uuid primary key references public.match_records(id) on delete cascade,
  team_a_score integer not null check (team_a_score >= 0 and team_a_score <= 99),
  team_b_score integer not null check (team_b_score >= 0 and team_b_score <= 99),
  winner_side public.match_winner_side not null,
  summary text check (summary is null or char_length(summary) <= 240),
  recorded_at timestamptz not null default now()
);

alter table public.match_records enable row level security;
alter table public.match_participants enable row level security;
alter table public.match_results enable row level security;

drop policy if exists "match records visible to owner and participants" on public.match_records;
create policy "match records visible to owner and participants"
on public.match_records for select
using (
  owner_profile_id = auth.uid()
  or exists (
    select 1
    from public.match_participants visible_participant
    where visible_participant.match_id = match_records.id
      and visible_participant.profile_id = auth.uid()
  )
);

drop policy if exists "users create their match records" on public.match_records;
create policy "users create their match records"
on public.match_records for insert
with check (owner_profile_id = auth.uid());

drop policy if exists "owners update their match records" on public.match_records;
create policy "owners update their match records"
on public.match_records for update
using (owner_profile_id = auth.uid())
with check (owner_profile_id = auth.uid());

drop policy if exists "match participants visible by match access" on public.match_participants;
create policy "match participants visible by match access"
on public.match_participants for select
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.match_records visible_match
    where visible_match.id = match_participants.match_id
      and visible_match.owner_profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.match_participants own_participant
    where own_participant.match_id = match_participants.match_id
      and own_participant.profile_id = auth.uid()
  )
);

drop policy if exists "owners create match participants" on public.match_participants;
create policy "owners create match participants"
on public.match_participants for insert
with check (
  exists (
    select 1
    from public.match_records owned_match
    where owned_match.id = match_id
      and owned_match.owner_profile_id = auth.uid()
  )
);

drop policy if exists "match results visible by match access" on public.match_results;
create policy "match results visible by match access"
on public.match_results for select
using (
  exists (
    select 1
    from public.match_records visible_match
    where visible_match.id = match_results.match_id
      and (
        visible_match.owner_profile_id = auth.uid()
        or exists (
          select 1
          from public.match_participants visible_participant
          where visible_participant.match_id = match_results.match_id
            and visible_participant.profile_id = auth.uid()
        )
      )
  )
);

drop policy if exists "owners create match results" on public.match_results;
create policy "owners create match results"
on public.match_results for insert
with check (
  exists (
    select 1
    from public.match_records owned_match
    where owned_match.id = match_id
      and owned_match.owner_profile_id = auth.uid()
  )
);

drop policy if exists "owners update match results" on public.match_results;
create policy "owners update match results"
on public.match_results for update
using (
  exists (
    select 1
    from public.match_records owned_match
    where owned_match.id = match_id
      and owned_match.owner_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.match_records owned_match
    where owned_match.id = match_id
      and owned_match.owner_profile_id = auth.uid()
  )
);
