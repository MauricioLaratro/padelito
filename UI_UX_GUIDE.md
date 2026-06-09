# UI / UX GUIDE — PADELITO

## Personalidad visual

Padelito debe sentirse:
- sobrio
- deportivo
- moderno
- premium
- social
- local
- rápido

Referencia estética:
- fondo oscuro carbón
- logotipo metálico/plata
- acento verde pelota de pádel
- cards oscuras con bordes sutiles
- iconografía clara
- textos mínimos

## Paleta

```css
--color-background-primary: #0F1115;
--color-background-secondary: #1A1D22;
--color-surface-primary: #15181D;
--color-surface-secondary: #20242B;
--color-text-primary: #D9D9D9;
--color-text-secondary: #A6A6A6;
--color-accent-lime: #D7F21A;
--color-border-subtle: rgba(217, 217, 217, 0.12);
--color-danger: #FF5A5F;
--color-success: #8EEA7A;
```

## Tipografía

Usar:
- Inter
- Manrope
- Sora

Priorizar legibilidad.

## Layout

Mobile-first.

En desktop:
- centrar app en columna de ancho máximo móvil
- no crear layout complejo de escritorio

Ancho sugerido:
- `max-width: 480px`

## Navegación principal

Pantalla principal con:

- tabs flotantes superiores centradas:
  - Comunidad
  - Siguiendo

- botón flotante inferior derecho:
  - icono `+`
  - acción: publicar/crear

Evitar header alto. Evitar barras que consuman espacio vertical.

## Cards

Las cards de partido deben sentirse como salas de juego online.

### Card Busco jugador

Debe leerse en menos de 2 segundos.

Elementos visuales:
- fecha/hora
- lugar
- categoría
- competitivo/recreativo
- faltan X jugadores
- posición buscada
- jugadores confirmados
- botón solicitar

Usar chips e iconos.

Ejemplo:

- 🕒 Hoy 20:00
- 📍 Club Norte
- 🏆 5ta
- 🎯 Competitivo
- 👥 Falta 1
- ↔️ Busca revés

### Card Estoy disponible

- 🕒 Viernes 18:00–22:00
- 🏆 6ta
- ↔️ Drive
- 🎯 Recreativo
- 📍 Centro / Club Norte

Acción:
- Invitar a jugar

### Card Evento

Puede ser más expresiva:
- imagen
- título
- descripción
- lugar
- fecha
- interesados/asistentes
- links externos

## Iconografía

Usar iconos para:
- calendario
- reloj
- ubicación
- jugadores
- categoría
- posición
- competitivo
- recreativo
- WhatsApp/link externo
- notificaciones
- seguidores

## Textos

Reducir texto en cards estructuradas.

No usar párrafos salvo en eventos.

## Branding

Usar:
- `assets/logo-padelito.svg`
- `assets/app-icon.svg`

El isotipo definitivo representa:
- P abstracta de Padelito
- trayectoria
- pelota verde
- comunidad de jugadores
- conexión social/competitiva

## Onboarding acceso rápido

Después del registro:

Título:
**No te pierdas ningún partido ni evento**

Texto:
Agregá Padelito a tu pantalla principal para entrar con un toque y recibir avisos importantes sobre solicitudes, invitaciones, recordatorios y partidos compatibles con tu categoría.

CTA:
**Agregar acceso rápido**

Secundario:
**Ahora no**

En configuración:
- Agregar acceso rápido
- Activar notificaciones
