-- Permite que quien genera una notificacion pueda recuperar la fila creada.
-- Existe porque el cliente necesita el id devuelto por Supabase para disparar el push remoto.

drop policy if exists "actors read notifications they created"
on public.notifications;

create policy "actors read notifications they created"
on public.notifications for select
using (actor_profile_id = auth.uid());
