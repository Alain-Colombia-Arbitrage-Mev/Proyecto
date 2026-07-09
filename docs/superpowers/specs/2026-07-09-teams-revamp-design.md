# FocusFlow para equipos: workspace por defecto, plantillas, diseño enfocado y Asesor AI

**Fecha:** 2026-07-09
**Estado:** Aprobado por el usuario

## Objetivo

Adaptar FocusFlow a equipos reales (scrum, kanban, desarrollo, audio y creativos) reduciendo fricción de entrada y ruido visual:

1. Todo usuario nuevo entra directo a un workspace creado por defecto (sin onboarding de 3 pasos).
2. Reducir las plantillas de proyecto de 8+ a 5, orientadas a tipo de equipo.
3. Mejorar el diseño para aumentar el enfoque (sidebar, Mi Día, Modo Enfoque, dashboard).
4. Cambiar el modelo AI principal a `deepseek/deepseek-v4-pro` y convertir el asistente en un Asesor AI global consciente del contexto del equipo.

## 1. Workspace por defecto

### Comportamiento

- Al iniciar sesión, si el usuario **no tiene workspaces**, el sistema crea automáticamente:
  - Workspace `"Workspace de {nombre}"` (nombre tomado de `user_metadata.full_name` o del email antes de `@`), con slug único y el usuario como `owner`.
  - Proyecto inicial `"Mi Primer Proyecto"` con plantilla `kanban`.
- El usuario aterriza directamente en `/{slug}/dashboard`.
- Si el usuario tiene **invitaciones pendientes**, se muestran (banner existente `InvitationBanner`) pero NO bloquean la creación del workspace por defecto: el usuario siempre tiene su workspace propio y puede además unirse a otros.

### Implementación

- Nuevo endpoint idempotente `POST /api/user/ensure-workspace`:
  - Si el usuario ya tiene ≥1 workspace, devuelve el primero (no crea nada).
  - Si no, crea workspace + membership `owner` + proyecto inicial con columnas kanban (reutilizando la lógica de `TEMPLATES` de `projects.post.ts`, extraída a `server/utils/` para compartirla).
- Se invoca desde:
  - `app/pages/auth/callback.vue` (OAuth) y el flujo post-login/registro por email.
  - `app/middleware/auth.ts` como red de seguridad: usuario autenticado sin workspace → llamar ensure-workspace → redirigir.
- `app/pages/onboarding.vue` queda reducido: si hay invitaciones pendientes las muestra con opción de aceptar/rechazar y un botón "Ir a mi workspace"; si no hay, redirige directo al dashboard. Se eliminan los pasos de nombre de workspace, nombre de proyecto y selección de plantilla.

### Descartado

- Trigger SQL sobre `auth.users`: duplicaría la lógica de plantillas en SQL y complica el mantenimiento.

## 2. Plantillas: de 8+ a 5

Fuente de verdad: `TEMPLATES` en `server/api/workspaces/[workspaceId]/projects.post.ts` (extraído a `server/utils/kanbanTemplates.ts`).

| Clave | Nombre | Columnas (ES) |
|---|---|---|
| `kanban` | Kanban | Por hacer → En progreso → Revisión → Hecho |
| `scrum` | Scrum | Backlog → Sprint → En progreso → Review → Done |
| `dev` | Desarrollo | Backlog → Dev → Code Review → QA → Producción (con WIP limits) |
| `audio` | Audio | Idea → Grabación → Edición → Mezcla → Master → Publicado |
| `creative` | Creativo | Brief → Concepto → Diseño → Revisión → Aprobado → Entregado |

- Cada plantilla mantiene colores por columna y nombres bilingües (ES por defecto, EN vía sistema existente).
- **Retrocompatibilidad:** las claves antiguas (`simple`, `devops`, `scrumban`, `support`, `app_development`, `frontend_dev`, `backend_dev`, etc.) permanecen en el servidor para que los proyectos existentes sigan funcionando, pero la UI solo ofrece las 5 nuevas.
- La UI de selección de plantilla vive únicamente en el modal de creación de proyecto (el onboarding ya no la usa).
- Nuevo campo `team_type` en `workspaces` (valores: `scrum | kanban | dev | audio | creative`, nullable, default `kanban`) — migración SQL nueva. Lo usa el Asesor AI para contextualizar consejos. Editable en Settings del workspace.

## 3. Diseño enfocado

Cuatro mejoras, en orden:

### 3.1 Reducir ruido visual global (sidebar y navegación)

- Sidebar (`app/layouts/default.vue`) agrupado en dos niveles:
  - **Principal (siempre visible):** Dashboard, Mi Día, Proyectos, Agenda, Equipo.
  - **"Más" (colapsable):** Workflows, Orchestrator, Integraciones, Archivos, Metas, Roadmap, Timesheet, Billing, Roles, Módulos, Agentes, Settings.
- Jerarquía tipográfica más limpia; reducir badges y colores que compiten por atención.

### 3.2 Vista "Mi Día"

- Nueva página `/{workspace}/my-day`: tareas asignadas al usuario con vencimiento hoy o atrasadas, agrupadas por proyecto, de todos los proyectos del workspace.
- Integra el Pomodoro existente (`usePomodoro`) en la misma vista.
- Endpoint nuevo `GET /api/workspaces/[workspaceId]/my-day` (tareas del usuario filtradas por fecha).

### 3.3 Modo Enfoque en Kanban

- Toggle en `kanban.vue` que oculta sidebar y paneles laterales, dejando solo el tablero.
- Estado persistido en `localStorage` (`focusflow_focus_mode`).

### 3.4 Dashboard rediseñado

- 3-4 métricas esenciales arriba (tareas hoy, atrasadas, en progreso, próxima reunión).
- Widgets secundarios (rollups, gráficos) en secciones colapsables, colapsadas por defecto.

## 4. AI: modelo DeepSeek + Asesor global

### Cambio de modelo

- `server/api/ai/assist.post.ts`: `primaryModel = 'deepseek/deepseek-v4-pro'`; fallback se mantiene `google/gemini-2.0-flash-001`. Las otras referencias a `minimax/minimax-m2.5` en el mismo archivo también pasan a DeepSeek.
- El resto de endpoints AI (translate, workflows, n8n) no cambian en esta fase salvo indicación contraria.

### Asesor AI

- Botón flotante global en `app/layouts/default.vue` que abre un slide-over disponible en cualquier página del workspace.
- Reutiliza `POST /api/ai/assist` con una nueva acción `advisor`:
  - El system prompt incluye: `team_type` del workspace, proyectos activos con su estado, conteo de tareas atrasadas/próximas, sprint activo si aplica.
  - Consejos según metodología: scrum → salud del sprint y bloqueos; kanban/dev → cuellos de botella y WIP; audio → etapas de producción estancadas; creativo → revisiones/aprobaciones pendientes.
- Bilingüe ES/EN vía `useLanguage()`.
- El tracking de tokens por workspace/acción/día existente aplica a la acción `advisor`.

## Fases de implementación

1. **Fase 1:** Workspace por defecto + reducción de plantillas + migración `team_type`.
2. **Fase 2:** Modelo DeepSeek + Asesor AI.
3. **Fase 3:** Diseño enfocado (3.1 sidebar → 3.2 Mi Día → 3.3 Modo Enfoque → 3.4 dashboard).

Cada fase es entregable de forma independiente.

## Criterios de éxito

- Un usuario recién registrado (email u OAuth) llega al dashboard de su workspace propio sin pasar por formularios.
- El modal de crear proyecto muestra exactamente 5 plantillas; los proyectos antiguos no se rompen.
- El Asesor AI responde usando `deepseek/deepseek-v4-pro` (verificable en logs/tracking de tokens) con consejos coherentes al `team_type`.
- Sidebar muestra ≤6 ítems principales; Mi Día y Modo Enfoque funcionan y persisten sus preferencias.

## Fuera de alcance

- Migrar proyectos existentes a las nuevas plantillas.
- Cambios en RBAC/permisos.
- Nuevos módulos de audio (almacenamiento de archivos de audio, players, etc.) — solo la plantilla de flujo de trabajo.
