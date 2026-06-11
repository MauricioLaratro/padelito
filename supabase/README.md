# Supabase - Padelito

## Migraciones

Ejecutar `supabase/migrations/202606090001_initial_schema.sql` en el SQL editor de Supabase cuando llegue la etapa de backend real.

## Buckets

La migracion crea:

- `avatars`
- `event-images`

Las rutas de objetos deben comenzar con el `auth.uid()` del usuario:

```txt
<auth.uid()>/archivo.webp
```

## Seguridad

La migracion activa RLS en todas las tablas del MVP.

Reglas principales:

- perfiles legibles publicamente;
- cada usuario edita solo su perfil;
- publicaciones `public` visibles para todos;
- publicaciones `followers_only` visibles para autor y seguidores;
- solicitudes visibles para requester y owner;
- invitaciones visibles para inviter e invited;
- notificaciones visibles solo para recipient.

## QA automatizado

Ejecutar desde la raiz:

```bash
npm run qa:supabase
```

Requiere variables locales de usuario de prueba:

```txt
PADELITO_QA_EMAIL
PADELITO_QA_PASSWORD
```

Opcionalmente se puede sumar una segunda cuenta:

```txt
PADELITO_QA_SECOND_EMAIL
PADELITO_QA_SECOND_PASSWORD
```

El script no muta datos. Verifica login, bloqueo de `whatsapp_phone`, lecturas RLS de tablas sensibles y RPC de contacto privado.

## Email Auth

No usar SMTP default de Supabase para produccion. Antes de lanzar publicamente, configurar Custom SMTP y rate limits desde Supabase Auth.
