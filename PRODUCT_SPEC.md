# PRODUCT SPEC — PADELITO MVP

## Nombre

**Padelito**

## Tipo de producto

PWA mobile-first para comunidad local de pádel.

No es app nativa inicial. No se publica inicialmente en App Store ni Google Play.

## Objetivo

Centralizar oportunidades de pádel que hoy están dispersas en WhatsApp, Instagram y Facebook.

Padelito no reemplaza WhatsApp. La app ayuda a descubrir, filtrar, solicitar, invitar y organizar; la coordinación final puede ir a WhatsApp.

## Canales de entrada

- Instagram.
- WhatsApp.
- QR en clubes.
- Link directo.
- Dominio propio.
- Acceso rápido en pantalla principal.

## MVP: incluido

### Perfiles

#### Jugador

Campos:
- nombre
- foto opcional
- categoría: Principiante, 7ma, 6ta, 5ta, 4ta, 3ra, 2da, 1ra
- posición preferida: Drive, Revés, Ambos, Indiferente
- tipo de juego: Recreativo, Competitivo, Ambos
- WhatsApp opcional
- club/zona habitual opcional
- bio corta opcional

#### Organización

Representa:
- club
- torneo
- grupo de personas asociadas

Campos:
- nombre
- logo opcional
- descripción
- WhatsApp/link opcional

### Sistema social

- Seguir usuarios.
- Seguir organizaciones.
- Ver seguidores y seguidos en perfil.
- No implementar amistad mutua.
- No implementar solicitudes de amistad.

### Feeds

#### Comunidad

Feed general público.

Muestra publicaciones públicas:
- Busco jugador.
- Busco partido / Estoy disponible.
- Evento / torneo / juntada.
- Grupo social si se modela como publicación.

#### Siguiendo

Muestra publicaciones de:
- jugadores seguidos
- clubes seguidos
- organizaciones seguidas

### Navegación

Mobile-first estilo TikTok:
- dos tabs flotantes superiores centradas: `Comunidad | Siguiendo`
- siempre visibles durante scroll
- botón flotante inferior derecho para crear/publicar
- evitar barras pesadas
- minimizar ocupación vertical
- lectura y navegación deben tener máximo espacio

### Tipos de publicación

La creación debe empezar seleccionando tipo.

#### 1. Busco jugador

Para partido incompleto.

Debe ser una card estructurada, visual, filtrable, sin imagen y sin descripción larga.

Campos:
- fecha
- hora
- lugar/cancha/club escrito
- categoría buscada
- tipo de juego: recreativo/competitivo
- cantidad de jugadores faltantes
- posición buscada: drive/revés/indiferente
- jugadores confirmados opcional
- nota corta opcional

Acciones:
- Solicitar unirme.
- Creador acepta o rechaza.
- Al aceptar, habilitar contacto por WhatsApp si está disponible.

#### 2. Busco partido / Estoy disponible

Jugador publica disponibilidad.

Card estructurada, visual, filtrable, sin imagen y sin descripción larga.

Campos:
- fecha
- rango horario
- categoría propia
- posición preferida
- tipo de juego
- zona/lugar preferido
- nota corta opcional

Acción:
- Invitar a jugar.

#### 3. Evento / torneo / juntada

Único tipo con más libertad.

Puede representar:
- evento recreativo
- juntada social
- tercer tiempo
- torneo anunciado
- americano
- evento de club
- grupo social con link

MVP no gestiona torneos internamente. Solo publica anuncios útiles.

Campos:
- título
- descripción
- imagen opcional
- fecha/hora
- lugar/club escrito
- link WhatsApp opcional
- link inscripción externo opcional
- link Google Maps opcional

Acciones:
- Me interesa.
- Asistiré.
- Abrir WhatsApp.
- Abrir inscripción.
- Abrir mapa.

Contadores:
- interesados
- asistentes

### Visibilidad de publicaciones

Al crear:
- Pública.
- Solo seguidores/amigos/conocidos.

Pública:
- aparece en Comunidad
- aparece en filtros

Solo seguidores:
- no aparece en Comunidad pública
- aparece a seguidores permitidos

Opción futura:
- Solo por enlace

### Solicitudes

En publicaciones Busco jugador:
- los jugadores se postulan
- el creador ve postulantes
- acepta/rechaza
- se generan notificaciones internas

### Invitaciones directas

Desde el perfil de un jugador:
- botón “Invitar a partido”
- formulario con fecha, hora, lugar/cancha/club, tipo de juego y nota corta
- destinatario puede aceptar o rechazar
- se genera notificación

### Perfil como centro de actividad

El perfil no debe ser solo datos del usuario.

Debe mostrar cards separadas para:
- publicaciones propias
- partidos creados
- solicitudes enviadas
- solicitudes recibidas
- invitaciones enviadas
- invitaciones recibidas
- aceptadas/rechazadas
- eventos marcados como interesantes/asistiré

### Notificaciones

Importantes para MVP.

Notificaciones internas obligatorias:
- alguien se postuló a tu partido
- aceptaron tu solicitud
- rechazaron tu solicitud
- recibiste invitación directa
- aceptaron/rechazaron tu invitación
- nuevo seguidor
- recordatorio interno básico de evento/partido si es simple

Push notifications web:
- preparar arquitectura
- implementar si no retrasa demasiado
- en iPhone requiere PWA agregada a pantalla principal
- en Android es más directo

### Onboarding PWA

Después de completar registro/perfil, mostrar paso final:

Título:
**No te pierdas ningún partido ni evento**

Texto:
Agregá Padelito a tu pantalla principal para entrar con un toque y recibir avisos importantes sobre solicitudes, invitaciones, recordatorios y partidos compatibles con tu categoría.

CTA principal:
**Agregar acceso rápido**

No usar “instalar” como CTA principal.

Android:
- intentar disparar prompt automático si navegador lo permite.

iPhone:
- mostrar guía:
  1. Tocá Compartir en Safari.
  2. Elegí “Agregar a pantalla de inicio”.
  3. Confirmá.

Debe existir después en Perfil/Configuración:
- Agregar acceso rápido
- Activar notificaciones

## MVP: excluido

No implementar:
- app nativa
- App Store / Google Play
- rankings
- armado interno de torneos
- reservas de cancha
- pagos
- marketplace
- compraventa
- profesores
- servicios
- publicidad
- chat propio
- geolocalización interna
- mapas integrados
- búsqueda por distancia
- ciudades/regiones complejas

## MVP+: Partidos, resultados y desafios recurrentes

Este modulo queda refinado como evolucion posterior al MVP base. No debe bloquear la validacion inicial de feeds, perfiles, solicitudes, invitaciones y notificaciones.

### Objetivo

Permitir que Padelito tambien registre partidos ya armados, participantes, resultados e historial entre jugadores o parejas frecuentes.

El valor principal es:
- recordar quienes jugaron;
- registrar resultado al finalizar;
- reflejar historial en perfiles;
- mostrar estadisticas simples;
- sostener desafios recurrentes entre parejas o grupos que juegan todas las semanas.

### Crear partido completo

El usuario creador debe poder crear un partido aunque no le falten jugadores.

Campos:
- fecha
- hora
- lugar/cancha/club escrito
- tipo de juego
- nota corta opcional
- participantes seleccionados dentro de usuarios que sigue o perfiles disponibles
- estado: programado, finalizado, cancelado

Participantes:
- sin limite fijo de jugadores;
- soporta partidos rotativos;
- soporta 3 o 4 parejas;
- cada participante debe referenciar un perfil existente cuando sea posible;
- debe permitir marcar pareja/equipo si aplica.

### Partido incompleto

El creador debe poder marcar que el partido busca jugadores.

Esto mantiene compatibilidad con `Busco jugador`:
- si faltan jugadores, aparece en feed como oportunidad;
- si esta completo, aparece como actividad propia o de seguidos segun visibilidad;
- los postulantes aceptados pasan a participantes.

### Resultado de partido

Al finalizar, el creador puede registrar resultado.

Campos sugeridos:
- ganador: jugador, pareja o equipo;
- marcador por sets o formato flexible;
- notas cortas opcionales;
- fecha de cierre;
- confirmacion opcional de participantes en version futura.

El resultado debe reflejarse en:
- perfil del creador;
- perfil de cada participante;
- historial del partido;
- estadisticas generales.

### Estadisticas de jugador

Dashboard simple en perfil:
- partidos jugados;
- victorias;
- derrotas;
- porcentaje de victoria;
- racha actual si es simple;
- ultimos resultados;
- resultados por pareja si existe suficiente informacion.

No convertirlo inicialmente en ranking publico global.

### Desafio recurrente

Apartado para parejas o grupos que juegan de forma fija.

Caso de uso:
- dos parejas juegan todos los martes;
- quieren llevar historial acumulado;
- cada encuentro semanal suma al historial del desafio.

Campos:
- nombre del desafio;
- participantes o parejas base;
- frecuencia: semanal, quincenal, mensual o manual;
- dia/hora habitual;
- lugar habitual;
- historial de partidos asociados;
- marcador acumulado por pareja/equipo.

Acciones:
- crear proximo partido del desafio;
- registrar resultado;
- ver historial;
- ver marcador acumulado;
- pausar o archivar desafio.

### UX esperada

- No saturar el feed principal con estadisticas.
- El resultado debe aparecer como card compacta en perfil.
- El desafio recurrente debe tener una pantalla propia o seccion clara dentro de perfil.
- Usar chips para estado, ganador, fecha y marcador.
- Evitar rankings globales en esta etapa para no cambiar el posicionamiento del MVP.

## Filtros MVP

Filtrar por:
- tipo de publicación
- fecha/hora
- categoría
- posición
- recreativo/competitivo
- lugar/club/zona escrito
- Comunidad/Siguiendo

## Priorización de valor

El núcleo de Padelito es:
- encontrar jugadores
- encontrar partidos
- mover eventos sociales/torneos
- conectar comunidad
- derivar a WhatsApp cuando corresponde
