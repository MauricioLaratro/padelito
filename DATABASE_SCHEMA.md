# DATABASE SCHEMA - SUPABASE / POSTGRES

Este esquema es una base inicial. El agente puede ajustarlo con buen criterio, pero debe conservar los conceptos.

## Estado actual

- Migracion aplicada en Supabase Cloud para el proyecto `zrddjpvtkqebvmazauhu`.
- Verificacion SQL devolvio `schema_ok`.
- La funcion `can_read_post` se crea despues de `posts` y `follows` para evitar errores de referencia durante la migracion.
- Migracion incremental `202606100001_link_invitations_to_posts_and_slots.sql` creada y pendiente de aplicar en Supabase Cloud.
- `missing_players_count` admite `0-24`; `0` representa partido completo y se usa para retirar oportunidades del feed.
- Las respuestas aceptadas se centralizan en RPC para descontar cupos de forma consistente.

## Enums sugeridos

```sql
create type profile_type as enum ('player', 'organization');
create type player_level as enum ('beginner', 'seventh', 'sixth', 'fifth', 'fourth', 'third', 'second', 'first');
create type player_position as enum ('drive', 'backhand', 'both', 'any');
create type play_style as enum ('recreational', 'competitive', 'both');
create type post_type as enum ('looking_for_player', 'available_to_play', 'event');
create type post_visibility as enum ('public', 'followers_only');
create type request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type invitation_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type notification_type as enum (
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
```

## profiles

Perfil principal.

Campos:

- id uuid primary key references auth.users(id)
- profile_type
- display_name
- avatar_url
- bio
- whatsapp_phone
- usual_place
- player_level nullable
- preferred_position nullable
- preferred_play_style nullable
- organization_kind nullable
- organization_link nullable
- created_at
- updated_at

## follows

Relacion seguir/seguidores.

- follower_profile_id
- followed_profile_id
- created_at

Unique:

- follower_profile_id + followed_profile_id

## posts

Tabla principal de publicaciones.

Campos comunes:

- id uuid
- author_profile_id
- post_type
- visibility
- created_at
- updated_at
- scheduled_date
- scheduled_start_time
- scheduled_end_time nullable
- place_text
- short_note nullable
- is_active

Campos para `looking_for_player`:

- desired_level
- desired_position
- desired_play_style
- missing_players_count entre 0 y 24
- confirmed_players_text nullable

Campos para `available_to_play`:

- available_level
- available_position
- available_play_style
- preferred_place_text nullable

Campos para `event`:

- title
- description
- image_url
- whatsapp_url
- registration_url
- google_maps_url

## post_interactions

Para eventos:

- id
- post_id
- profile_id
- interaction_type: interested / attending
- created_at

Unique:

- post_id + profile_id + interaction_type

## match_join_requests

Solicitudes para unirse a publicacion tipo `looking_for_player`.

- id
- post_id
- requester_profile_id
- owner_profile_id
- status
- message nullable
- created_at
- updated_at

## direct_match_invitations

Invitacion directa desde perfil.

- id
- inviter_profile_id
- invited_profile_id
- related_post_id nullable
- scheduled_date
- scheduled_start_time
- place_text
- desired_play_style
- note nullable
- status
- created_at
- updated_at

## notifications

Notificaciones internas.

- id
- recipient_profile_id
- actor_profile_id nullable
- notification_type
- related_post_id nullable
- related_request_id nullable
- related_invitation_id nullable
- title
- body
- read_at nullable
- created_at

## storage

Buckets:

- avatars
- event-images

## MVP+ sugerido: matches

Partidos ya armados o derivados de publicaciones.

- id
- creator_profile_id
- source_post_id nullable
- visibility
- status: scheduled / completed / cancelled
- scheduled_date
- scheduled_start_time
- place_text
- play_style
- note nullable
- created_at
- updated_at

## MVP+ sugerido: match_participants

Participantes del partido.

- id
- match_id
- profile_id
- team_label nullable
- partner_group nullable
- participation_status: invited / confirmed / declined / removed
- created_at

Notas:

- no limitar cantidad de participantes;
- permitir rotativos y multiples parejas;
- usar `team_label` o `partner_group` para agrupar jugadores cuando haya parejas/equipos.

## MVP+ sugerido: match_results

Resultado final.

- id
- match_id
- reported_by_profile_id
- winner_team_label nullable
- score_text
- completed_at
- note nullable
- created_at
- updated_at

## MVP+ sugerido: recurring_challenges

Desafios recurrentes entre parejas o grupos.

- id
- creator_profile_id
- title
- frequency: weekly / biweekly / monthly / manual
- usual_day_of_week nullable
- usual_time nullable
- usual_place_text nullable
- status: active / paused / archived
- created_at
- updated_at

## MVP+ sugerido: recurring_challenge_participants

Participantes base del desafio.

- id
- challenge_id
- profile_id
- team_label nullable
- created_at

## MVP+ sugerido: recurring_challenge_matches

Relaciona partidos jugados con un desafio recurrente.

- challenge_id
- match_id
- created_at

Unique:

- challenge_id + match_id

## MVP+ sugerido: estadisticas

Las estadisticas pueden calcularse desde `matches`, `match_participants` y `match_results` al inicio.

Evitar materializar agregados hasta que exista volumen o performance lo justifique.

## RLS

Activar RLS en todas las tablas.

Reglas generales:

- perfiles publicos pueden leerse
- cada usuario edita solo su perfil
- publicaciones publicas pueden leerse
- publicaciones `followers_only` solo por autor o seguidores
- cada autor administra sus publicaciones
- solicitudes visibles para requester y owner
- requester solo puede cancelar o reabrir sus solicitudes
- owner responde solicitudes pendientes mediante `answer_match_join_request`
- invitaciones visibles para inviter e invited
- invited responde invitaciones pendientes mediante `answer_direct_match_invitation`
- inviter solo puede cancelar invitaciones pendientes
- notificaciones visibles solo por recipient
- partidos visibles segun visibilidad o participacion
- resultados visibles para participantes y perfiles autorizados por visibilidad
- desafios recurrentes visibles para participantes o segun visibilidad futura

El agente debe escribir migraciones SQL completas y seguras.

## Funciones operativas

- `can_read_post`: permite leer posts activos segun visibilidad y tambien posts completos si el usuario es autor, requester aceptado/relacionado o invitado relacionado.
- `answer_match_join_request`: valida owner, estado pendiente y descuenta cupo cuando acepta.
- `answer_direct_match_invitation`: valida invited, estado pendiente y descuenta cupo del `related_post_id` cuando acepta.
- `register_accepted_player_on_post`: reduce `missing_players_count`, agrega el nombre a `confirmed_players_text` y marca `is_active = false` si el cupo llega a `0`.
- `append_confirmed_player_name`: evita duplicados simples en el texto compacto de confirmados.
