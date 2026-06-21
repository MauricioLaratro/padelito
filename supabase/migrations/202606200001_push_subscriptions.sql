-- Agrega suscripciones Web Push para notificaciones remotas.
-- Mantiene las claves de dispositivo bajo RLS y expone una RPC acotada para el Worker.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  p256dh_key text not null check (char_length(p256dh_key) between 40 and 220),
  auth_key text not null check (char_length(auth_key) between 12 and 120),
  user_agent text check (user_agent is null or char_length(user_agent) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_profile_idx
on public.push_subscriptions(profile_id);

drop trigger if exists push_subscriptions_set_updated_at
on public.push_subscriptions;

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "owners read their push subscriptions"
on public.push_subscriptions;

create policy "owners read their push subscriptions"
on public.push_subscriptions for select
using (profile_id = auth.uid());

drop policy if exists "owners insert their push subscriptions"
on public.push_subscriptions;

create policy "owners insert their push subscriptions"
on public.push_subscriptions for insert
with check (profile_id = auth.uid());

drop policy if exists "owners update their push subscriptions"
on public.push_subscriptions;

create policy "owners update their push subscriptions"
on public.push_subscriptions for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "owners delete their push subscriptions"
on public.push_subscriptions;

create policy "owners delete their push subscriptions"
on public.push_subscriptions for delete
using (profile_id = auth.uid());

create or replace function public.get_push_delivery_payload(
  notification_id_input uuid
)
returns table (
  notification_id uuid,
  recipient_profile_id uuid,
  title text,
  body text,
  endpoint text,
  p256dh_key text,
  auth_key text
)
language sql
security definer
set search_path = public
as $$
  select
    notifications.id as notification_id,
    notifications.recipient_profile_id,
    notifications.title,
    notifications.body,
    push_subscriptions.endpoint,
    push_subscriptions.p256dh_key,
    push_subscriptions.auth_key
  from public.notifications
  inner join public.push_subscriptions
    on push_subscriptions.profile_id = notifications.recipient_profile_id
  where notifications.id = notification_id_input
    and (
      notifications.actor_profile_id = auth.uid()
      or notifications.recipient_profile_id = auth.uid()
    );
$$;

revoke all on function public.get_push_delivery_payload(uuid) from public;
grant execute on function public.get_push_delivery_payload(uuid) to authenticated;
