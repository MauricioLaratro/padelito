-- Migracion inicial de Padelito.
-- Crea el contrato backend del MVP con perfiles, publicaciones, relaciones sociales,
-- solicitudes, invitaciones, notificaciones, storage y politicas RLS.

create extension if not exists "pgcrypto";

create type public.profile_type as enum ('player', 'organization');
create type public.player_level as enum ('beginner', 'seventh', 'sixth', 'fifth', 'fourth', 'third', 'second', 'first');
create type public.player_position as enum ('drive', 'backhand', 'both', 'any');
create type public.play_style as enum ('recreational', 'competitive', 'both');
create type public.organization_kind as enum ('club', 'tournament', 'group');
create type public.post_type as enum ('looking_for_player', 'available_to_play', 'event');
create type public.post_visibility as enum ('public', 'followers_only');
create type public.event_interaction_type as enum ('interested', 'attending');
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.invitation_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.notification_type as enum (
  'new_follower',
  'match_join_request_received',
  'match_join_request_accepted',
  'match_join_request_rejected',
  'direct_match_invitation_received',
  'direct_match_invitation_accepted',
  'direct_match_invitation_rejected',
  'event_reminder',
  'match_reminder'
);

-- Actualiza updated_at automaticamente para evitar duplicar logica en clientes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Determina si una publicacion puede ser leida por el perfil actual.
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
      and visible_post.is_active = true
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
  );
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile_type public.profile_type not null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 240),
  whatsapp_phone text check (whatsapp_phone is null or char_length(whatsapp_phone) <= 32),
  usual_place text check (usual_place is null or char_length(usual_place) <= 120),
  player_level public.player_level,
  preferred_position public.player_position,
  preferred_play_style public.play_style,
  organization_kind public.organization_kind,
  organization_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_profile_requires_player_fields check (
    profile_type <> 'player'
    or (
      player_level is not null
      and preferred_position is not null
      and preferred_play_style is not null
    )
  ),
  constraint organization_profile_requires_organization_fields check (
    profile_type <> 'organization'
    or organization_kind is not null
  )
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.follows (
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  followed_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_profile_id, followed_profile_id),
  constraint follows_prevent_self_follow check (follower_profile_id <> followed_profile_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  post_type public.post_type not null,
  visibility public.post_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scheduled_date date not null,
  scheduled_start_time time not null,
  scheduled_end_time time,
  place_text text not null check (char_length(place_text) between 2 and 140),
  short_note text check (short_note is null or char_length(short_note) <= 180),
  is_active boolean not null default true,
  desired_level public.player_level,
  desired_position public.player_position,
  desired_play_style public.play_style,
  missing_players_count integer check (missing_players_count is null or missing_players_count between 1 and 3),
  confirmed_players_text text check (confirmed_players_text is null or char_length(confirmed_players_text) <= 180),
  available_level public.player_level,
  available_position public.player_position,
  available_play_style public.play_style,
  preferred_place_text text check (preferred_place_text is null or char_length(preferred_place_text) <= 140),
  title text check (title is null or char_length(title) between 2 and 120),
  description text check (description is null or char_length(description) <= 1200),
  image_url text,
  whatsapp_url text,
  registration_url text,
  google_maps_url text,
  constraint looking_for_player_requires_fields check (
    post_type <> 'looking_for_player'
    or (
      desired_level is not null
      and desired_position is not null
      and desired_play_style is not null
      and missing_players_count is not null
    )
  ),
  constraint available_to_play_requires_fields check (
    post_type <> 'available_to_play'
    or (
      available_level is not null
      and available_position is not null
      and available_play_style is not null
    )
  ),
  constraint event_requires_fields check (
    post_type <> 'event'
    or (
      title is not null
      and description is not null
    )
  )
);

create index posts_author_profile_id_idx on public.posts(author_profile_id);
create index posts_feed_idx on public.posts(post_type, visibility, scheduled_date, scheduled_start_time);

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create table public.post_interactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interaction_type public.event_interaction_type not null,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id, interaction_type)
);

create table public.match_join_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  status public.request_status not null default 'pending',
  message text check (message is null or char_length(message) <= 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, requester_profile_id),
  constraint match_join_requests_prevent_owner_request check (requester_profile_id <> owner_profile_id)
);

create index match_join_requests_owner_idx on public.match_join_requests(owner_profile_id);
create index match_join_requests_requester_idx on public.match_join_requests(requester_profile_id);

create trigger match_join_requests_set_updated_at
before update on public.match_join_requests
for each row execute function public.set_updated_at();

create table public.direct_match_invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_profile_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_date date not null,
  scheduled_start_time time not null,
  place_text text not null check (char_length(place_text) between 2 and 140),
  desired_play_style public.play_style not null,
  note text check (note is null or char_length(note) <= 180),
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_match_invitations_prevent_self_invite check (inviter_profile_id <> invited_profile_id)
);

create index direct_match_invitations_inviter_idx on public.direct_match_invitations(inviter_profile_id);
create index direct_match_invitations_invited_idx on public.direct_match_invitations(invited_profile_id);

create trigger direct_match_invitations_set_updated_at
before update on public.direct_match_invitations
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  notification_type public.notification_type not null,
  related_post_id uuid references public.posts(id) on delete cascade,
  related_request_id uuid references public.match_join_requests(id) on delete cascade,
  related_invitation_id uuid references public.direct_match_invitations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  body text not null check (char_length(body) between 2 and 280),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications(recipient_profile_id, read_at, created_at desc);

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_interactions enable row level security;
alter table public.match_join_requests enable row level security;
alter table public.direct_match_invitations enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are publicly readable"
on public.profiles for select
using (true);

create policy "users insert their own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "users update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "follows are publicly readable"
on public.follows for select
using (true);

create policy "users follow as themselves"
on public.follows for insert
with check (follower_profile_id = auth.uid());

create policy "users remove their own follows"
on public.follows for delete
using (follower_profile_id = auth.uid());

create policy "visible posts are readable"
on public.posts for select
using (public.can_read_post(id, auth.uid()));

create policy "authors insert posts"
on public.posts for insert
with check (author_profile_id = auth.uid());

create policy "authors update posts"
on public.posts for update
using (author_profile_id = auth.uid())
with check (author_profile_id = auth.uid());

create policy "authors delete posts"
on public.posts for delete
using (author_profile_id = auth.uid());

create policy "event interactions are readable with visible posts"
on public.post_interactions for select
using (public.can_read_post(post_id, auth.uid()));

create policy "users create their event interactions"
on public.post_interactions for insert
with check (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.posts event_post
    where event_post.id = post_id
      and event_post.post_type = 'event'
      and public.can_read_post(event_post.id, auth.uid())
  )
);

create policy "users remove their event interactions"
on public.post_interactions for delete
using (profile_id = auth.uid());

create policy "join requests visible to requester and owner"
on public.match_join_requests for select
using (requester_profile_id = auth.uid() or owner_profile_id = auth.uid());

create policy "players request visible looking_for_player posts"
on public.match_join_requests for insert
with check (
  requester_profile_id = auth.uid()
  and exists (
    select 1
    from public.posts requested_post
    where requested_post.id = post_id
      and requested_post.author_profile_id = owner_profile_id
      and requested_post.post_type = 'looking_for_player'
      and public.can_read_post(requested_post.id, auth.uid())
  )
);

create policy "requester or owner update join request"
on public.match_join_requests for update
using (requester_profile_id = auth.uid() or owner_profile_id = auth.uid())
with check (requester_profile_id = auth.uid() or owner_profile_id = auth.uid());

create policy "invitations visible to participants"
on public.direct_match_invitations for select
using (inviter_profile_id = auth.uid() or invited_profile_id = auth.uid());

create policy "users create direct invitations"
on public.direct_match_invitations for insert
with check (inviter_profile_id = auth.uid());

create policy "participants update direct invitations"
on public.direct_match_invitations for update
using (inviter_profile_id = auth.uid() or invited_profile_id = auth.uid())
with check (inviter_profile_id = auth.uid() or invited_profile_id = auth.uid());

create policy "recipients read their notifications"
on public.notifications for select
using (recipient_profile_id = auth.uid());

create policy "actors create notifications"
on public.notifications for insert
with check (actor_profile_id = auth.uid());

create policy "recipients update their notifications"
on public.notifications for update
using (recipient_profile_id = auth.uid())
with check (recipient_profile_id = auth.uid());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "avatars are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "event images are publicly readable"
on storage.objects for select
using (bucket_id = 'event-images');

create policy "users upload their avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users manage their avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users upload event images"
on storage.objects for insert
with check (
  bucket_id = 'event-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users manage event images"
on storage.objects for update
using (
  bucket_id = 'event-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'event-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
