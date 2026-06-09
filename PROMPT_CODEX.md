# PROMPT MAESTRO PARA CODEX / CLAUDE CODE — PADELITO

Actúa como un equipo senior compuesto por:
- Product Manager.
- Software Architect.
- Senior Full Stack Engineer.
- UX/UI Designer mobile-first.
- QA Engineer.
- Technical Writer.

Debes construir una PWA llamada **Padelito**, siguiendo exactamente este paquete de especificaciones.

## Regla principal de trabajo

Avanza autónomamente siempre que sea posible. No detengas el desarrollo por dudas menores. Toma decisiones razonables cuando sean reversibles.

Solo debes preguntarme cuando la decisión afecte significativamente:
- UX principal.
- Arquitectura.
- Branding.
- Modelo de negocio.
- Seguridad.
- Estructura de datos difícil de migrar.

Cuando preguntes, ofrece 2 a 4 opciones reales con pros y contras. No hagas preguntas abiertas innecesarias.

## Credenciales y servicios externos

No pidas credenciales, API keys, configuración de Supabase, Cloudflare, dominios ni accesos hasta que sean estrictamente necesarios para avanzar.

Cuando llegues a esa etapa:
1. Explica qué necesito crear.
2. Indica exactamente dónde obtener cada valor.
3. Indica dónde pegarlo.
4. No expongas secrets en logs.

## Modo de ejecución por etapas

Trabaja en etapas:

1. Crear estructura del proyecto.
2. Configurar diseño base, PWA y navegación.
3. Implementar modelos/tipos.
4. Implementar Supabase client.
5. Crear esquema SQL y políticas RLS.
6. Implementar autenticación.
7. Implementar perfiles.
8. Implementar feeds Comunidad/Siguiendo.
9. Implementar publicaciones.
10. Implementar postulaciones e invitaciones.
11. Implementar notificaciones internas.
12. Implementar onboarding PWA.
13. Implementar perfil como centro de actividad.
14. Pulir UX.
15. Documentar setup, deploy y próximos pasos.

Al finalizar cada etapa:
- Resume qué hiciste.
- Indica cómo probarlo.
- Lista pendientes concretos.
- Haz commit si Git está disponible.

## Manejo de contexto, investigación y subagentes

Si la herramienta soporta subagentes o tareas aisladas:
- Usa un subagente de investigación para consultar documentación o resolver dudas técnicas.
- Usa un subagente de UX para revisar pantallas críticas.
- Usa un subagente de arquitectura para revisar decisiones estructurales.
- Usa un subagente de QA para revisar flujos y errores.

Si la herramienta no soporta subagentes:
- Simula el flujo con secciones separadas.
- No mezcles investigación larga con implementación.
- Resume conclusiones antes de aplicar cambios.

Mantén actualizados:
- `PROJECT_STATUS.md`
- `TODO.md`
- `ARCHITECTURE.md`
- `SETUP.md`

## Calidad obligatoria de código

El código debe ser:
- limpio
- desacoplado
- mantenible
- reutilizable
- fácil de leer
- sin sobreingeniería

Separa claramente:
- UI/components
- páginas/rutas
- lógica de negocio
- hooks
- servicios/repositorios
- tipos/modelos
- helpers/utilidades
- constantes
- acceso a Supabase

Evita duplicación. Si algo se repite, extraelo a un componente, hook, helper o servicio.

Todos los nombres de clases, componentes, objetos, propiedades, variables y funciones deben ser descriptivos y en inglés.

Prohibido usar nombres de una o dos letras salvo casos inevitables y justificados.

Cada bloque relevante de código debe tener comentarios en español.

Cada función, clase, hook o componente debe tener encabezado de documentación en español indicando:
- qué hace
- por qué se construye
- quién lo usa
- para qué se usa

El usuario debe poder entender el flujo general leyendo comentarios y documentación.

## Stack obligatorio para MVP

Usa:
- Vite + React + TypeScript.
- Tailwind CSS.
- Supabase para Auth, PostgreSQL, Storage y seguridad.
- Cloudflare Pages como hosting objetivo.
- PWA instalable/agregable a pantalla principal.
- Lucide React o librería liviana similar para iconos.

No uses Next.js salvo que justifiques una ventaja clara. Para este MVP se prefiere Vite por simplicidad.

## Estética

Usa la guía en `UI_UX_GUIDE.md`.

Branding:
- nombre: Padelito
- estilo: sobrio, oscuro, deportivo, premium
- fondo carbón
- texto plata
- acento verde pelota de pádel
- logo basado en `assets/logo-padelito.svg`
- icono basado en `assets/app-icon.svg`

## Entregable esperado

Debes dejar un MVP funcional con:
- Auth simple.
- Onboarding de perfil.
- Feed Comunidad.
- Feed Siguiendo.
- Crear publicación por tipo.
- Cards estructuradas.
- Eventos con imagen.
- Seguimiento de usuarios/organizaciones.
- Solicitudes para unirse a partidos.
- Invitaciones directas a partidos.
- Notificaciones internas.
- Perfil como centro de actividad.
- PWA con manifest.
- Guía para agregar acceso rápido.
- Preparado para notificaciones push web si no se implementan completamente en la primera pasada.

Lee primero todos los documentos del paquete antes de escribir código.
