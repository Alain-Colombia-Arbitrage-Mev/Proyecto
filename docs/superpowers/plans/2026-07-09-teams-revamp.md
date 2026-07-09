# Teams Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todo usuario nuevo entra a un workspace auto-creado; 5 plantillas por tipo de equipo; UI enfocada (sidebar agrupado, Mi Día, Modo Enfoque, dashboard limpio); Asesor AI global con `deepseek/deepseek-v4-pro`.

**Architecture:** Nuxt 3 fullstack. Lógica de plantillas extraída a `server/utils/kanbanTemplates.ts` (compartida entre creación de proyectos y ensure-workspace). Endpoint idempotente `POST /api/user/ensure-workspace` invocado desde `app/pages/index.vue` y onboarding. Asesor AI = nueva acción `advisor` en `assist.post.ts` + slide-over global en el layout.

**Tech Stack:** Nuxt 3.16, Vue 3, @nuxt/ui 3, Supabase (service role en server), OpenRouter.

## Global Constraints

- Modelo AI principal: `deepseek/deepseek-v4-pro`; fallback: `google/gemini-2.0-flash-001` (copiar exacto).
- Plantillas UI: exactamente 5 — `kanban`, `scrum`, `dev`, `audio`, `creative`. Claves antiguas se conservan server-side (retrocompatibilidad).
- Bilingüe ES/EN vía `useLanguage()`; español por defecto.
- No hay test runner configurado — verificación = `npm run build` (usar `rtk`) + revisión manual.
- Commits frecuentes con mensajes semánticos; push al final (el usuario pidió publicar).

---

### Task 1: Extraer plantillas a util compartido + nuevas plantillas audio/creative

**Files:**
- Create: `server/utils/kanbanTemplates.ts`
- Modify: `server/api/workspaces/[workspaceId]/projects.post.ts` (borrar TEMPLATES local, importar del util)

**Interfaces:**
- Produces: `KANBAN_TEMPLATES: Record<string, TemplateColumn[]>` con TODAS las claves existentes + `audio` + `creative`; tipo `TemplateColumn = { title: string; color: string; wip_limit?: number }`. Auto-importado por Nitro (server/utils).

- [ ] Crear `server/utils/kanbanTemplates.ts` moviendo el objeto `TEMPLATES` completo de `projects.post.ts` y agregando:

```ts
  audio: [
    { title: 'Idea', color: '#EC4899' },
    { title: 'Grabación', color: '#8B5CF6', wip_limit: 3 },
    { title: 'Edición', color: '#3B82F6', wip_limit: 3 },
    { title: 'Mezcla', color: '#F59E0B', wip_limit: 2 },
    { title: 'Master', color: '#F97316', wip_limit: 2 },
    { title: 'Publicado', color: '#10B981' },
  ],
  creative: [
    { title: 'Brief', color: '#6B7280' },
    { title: 'Concepto', color: '#EC4899' },
    { title: 'Diseño', color: '#3B82F6', wip_limit: 4 },
    { title: 'Revisión', color: '#F59E0B', wip_limit: 3 },
    { title: 'Aprobado', color: '#8B5CF6' },
    { title: 'Entregado', color: '#10B981' },
  ],
```

- [ ] En `projects.post.ts` reemplazar `TEMPLATES[template]` por `KANBAN_TEMPLATES[template] || KANBAN_TEMPLATES.kanban!` (fallback pasa de `simple` a `kanban`).
- [ ] `rtk npm run build` → sin errores. Commit `refactor(server): extract kanban templates to shared util, add audio/creative`.

### Task 2: Migración team_type + tipo Workspace

**Files:**
- Create: `supabase/migrations/045_workspace_team_type.sql`
- Modify: `app/types/index.ts` (interfaz Workspace), `server/api/workspaces/[workspaceId].patch.ts` (aceptar team_type)

```sql
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS team_type text NOT NULL DEFAULT 'kanban'
  CHECK (team_type IN ('kanban', 'scrum', 'dev', 'audio', 'creative'));
```

- [ ] Agregar `team_type?: 'kanban' | 'scrum' | 'dev' | 'audio' | 'creative'` a la interfaz `Workspace` en `app/types/index.ts`.
- [ ] En `[workspaceId].patch.ts` permitir actualizar `team_type` (validar contra la lista de 5 valores).
- [ ] Commit `feat(db): add workspaces.team_type`.

### Task 3: Endpoint ensure-workspace + redirecciones (elimina onboarding de 3 pasos)

**Files:**
- Create: `server/api/user/ensure-workspace.post.ts`
- Modify: `app/pages/index.vue` (0 workspaces → ensure-workspace → dashboard), `app/pages/onboarding.vue` (solo invitaciones; auto-crea y redirige)

**Interfaces:**
- Produces: `POST /api/user/ensure-workspace` → `{ id, slug, created: boolean }`.

Comportamiento del endpoint (idempotente):
1. `requireUser(event)`; buscar memberships del usuario; si tiene ≥1 workspace → devolver el primero con `created: false`.
2. Si no: crear workspace `"Workspace de {nombre}"` (nombre desde `user_metadata.full_name` o email antes de `@`), slug único (misma lógica de `workspaces.post.ts`), membership con role **`owner`** (es su workspace personal), proyecto `"Mi Primer Proyecto"` con `kanban_template: 'kanban'` y columnas desde `KANBAN_TEMPLATES.kanban`.

- [ ] Crear endpoint reutilizando generación de slug y `KANBAN_TEMPLATES`.
- [ ] `app/pages/index.vue`: en `redirectToWorkspace()`, cuando `workspaces.length === 0` tras procesar invitaciones → `POST /api/user/ensure-workspace` y `router.push(\`/${res.slug}/dashboard\`)`. Eliminar rutas a `/onboarding`.
- [ ] `app/pages/onboarding.vue`: reescribir — si hay invitaciones pendientes, mostrarlas (UI existente) con botón "Ir a mi workspace"; si no, llamar ensure-workspace y redirigir a dashboard. Eliminar los 3 pasos y `templateOptions`.
- [ ] Verificar build. Commit `feat(auth): auto-create default workspace for new users`.

### Task 4: Reducir plantillas en UI a 5

**Files:**
- Modify: `app/pages/[workspace]/projects/index.vue` (reemplazar `templateConfigs` de 12+ por 5)

Las 5 entradas (labels bilingües vía computed con `lang`):

```
kanban   → Por hacer(#3B82F6) / En progreso(#F59E0B) / Revisión(#8B5CF6) / Hecho(#10B981)   [preview usa columnas reales del server: Backlog/To Do/En Progreso/Revisión/Hecho]
scrum    → Product Backlog / Sprint Backlog / En Progreso / En Review / QA / Done
dev      → Backlog / Análisis / Dev / Code Review / QA / Producción
audio    → Idea / Grabación / Edición / Mezcla / Master / Publicado
creative → Brief / Concepto / Diseño / Revisión / Aprobado / Entregado
```

Los previews de columnas deben coincidir EXACTAMENTE con `KANBAN_TEMPLATES` del server (Task 1).

- [ ] Reemplazar array, default del formulario `template: 'kanban'`.
- [ ] Commit `feat(projects): reduce templates to 5 team-oriented options`.

### Task 5: Modelo DeepSeek + acción advisor

**Files:**
- Modify: `server/api/ai/assist.post.ts`

- [ ] Línea ~488: `const primaryModel = 'deepseek/deepseek-v4-pro'`. Reemplazar también las 2 referencias `minimax/minimax-m2.5` de líneas ~634/660 por `deepseek/deepseek-v4-pro`.
- [ ] Nueva `case 'advisor'` (antes de `case 'chat'`): requiere `context.workspaceId`; `requirePermission(event, workspaceId, 'use_ai_basic')`; fetch en paralelo: workspace (name, team_type), proyectos activos (id,name,status,kanban_template, max 20), tareas (project_id, due_date, column_id, priority — para conteos atrasadas/próximas 7 días, max 500), sprint activo de `sprints` si team_type='scrum' (try/catch silencioso). System prompt (ES/EN según `context.lang`):

```
Eres el Asesor de FocusFlow para un equipo tipo "{team_type}".
Workspace: {name}. Proyectos: {resumen}. Tareas atrasadas: {n}. Próximas 7 días: {n}. {sprint info}
Da consejos accionables y breves según la metodología del equipo:
- scrum: salud del sprint, bloqueos, velocity
- kanban/dev: cuellos de botella, límites WIP
- audio: etapas de producción estancadas (grabación→master)
- creative: revisiones y aprobaciones pendientes
Responde en {ES|EN}, máx 8 líneas, texto plano, sin markdown pesado.
```

  Soporta `context.history` reutilizando el mecanismo `_chatHistory` existente.
- [ ] Commit `feat(ai): switch to deepseek-v4-pro and add advisor action`.

### Task 6: Panel Asesor AI global

**Files:**
- Create: `app/components/AiAdvisorPanel.vue`
- Modify: `app/layouts/default.vue` (botón flotante + montaje del panel), `app/composables/useLanguage.ts` (labels `aiAdvisor`, `advisorPlaceholder`, `advisorIntro`)

- [ ] `AiAdvisorPanel.vue`: USlideover con chat simple (historial en `ref`, input, loading). Envía `POST /api/ai/assist` con `{ action: 'advisor', context: { workspaceId, lang, message, history } }`. Mensaje de bienvenida localizado.
- [ ] Botón flotante (bottom-right, `i-heroicons-sparkles`) en layout default, visible solo dentro de un workspace y si `canUseAI`.
- [ ] Commit `feat(ai): global AI advisor panel`.

### Task 7: Sidebar agrupado (Principal + "Más")

**Files:**
- Modify: `app/layouts/default.vue` (navItems ~línea 443-474), `app/composables/useLanguage.ts` (label `more`)

- [ ] Reestructurar: principal = Dashboard, Mi Día (`/my-day`, icon `i-heroicons-sun`), Proyectos, Agenda, Equipo. Grupo colapsable "Más" (estado en `localStorage` `focusflow_nav_more`) = Agentes AI, Workflows, Orquestador, Metas, Roadmap, Timesheet, Archivos, Billing, Admin, Settings (con sus hijos actuales). Conservar todas las condiciones `show` existentes.
- [ ] Commit `feat(ui): group sidebar into primary + collapsible More section`.

### Task 8: Vista Mi Día

**Files:**
- Create: `server/api/workspaces/[workspaceId]/my-day.get.ts`, `app/pages/[workspace]/my-day.vue`
- Modify: `app/composables/useLanguage.ts` (labels `myDay`, `overdue`, `dueToday`, `noTasksToday`)

**Interfaces:**
- Produces: `GET /api/workspaces/:id/my-day` → `{ overdue: Task[], today: Task[], upcoming: Task[] }` (tareas donde `assignees` contiene al user, no completadas, con join a proyecto para nombre/color/slug de columnas).

- [ ] Endpoint: `requireWorkspaceMember`; query tasks con `assignees @> [user.id]` (o `.contains('assignees', [user.id])`), `due_date` clasificada: atrasadas (< hoy), hoy, próximas 7 días. Excluir tareas en columnas "done" (heurística: título de columna en ['Hecho','Done','Publicado','Entregado','Cerrado','Producción'] NO aplica — usar posición de columna final no fiable; simplemente devolver todo y marcar; decisión: excluir tareas cuya columna sea la última del proyecto).
- [ ] Página: tres secciones (Atrasadas/Hoy/Próximas) agrupadas por proyecto, con Pomodoro (`usePomodoro`) en tarjeta lateral. Click en tarea → navega al kanban del proyecto.
- [ ] Commit `feat(ui): My Day personal focus view`.

### Task 9: Modo Enfoque en Kanban

**Files:**
- Modify: `app/pages/[workspace]/projects/[id]/kanban.vue`, `app/layouts/default.vue` (ocultar sidebar cuando esté activo), `app/composables/useLanguage.ts` (label `focusMode`)

- [ ] Composable ligero inline o `useState('focusMode')` compartido layout↔página; toggle en la toolbar del kanban (icon `i-heroicons-viewfinder-circle`); al activarse el layout oculta sidebar/header secundarios. Persistir en `localStorage` `focusflow_focus_mode`, restaurar al montar y desactivar al salir de la página kanban.
- [ ] Commit `feat(kanban): focus mode toggle`.

### Task 10: Dashboard enfocado

**Files:**
- Modify: `app/pages/[workspace]/dashboard.vue`

- [ ] Hero de métricas: 4 esenciales (tareas hoy, atrasadas, en progreso, próxima reunión). Widgets secundarios (rollups, gráficos, listas largas) dentro de secciones colapsables (`<details>`-style o toggle propio), colapsadas por defecto, estado en `localStorage` `focusflow_dash_sections`.
- [ ] Commit `feat(dashboard): essential metrics first, secondary widgets collapsible`.

### Task 11: team_type en Settings

**Files:**
- Modify: `app/pages/[workspace]/settings.vue`, `app/composables/useLanguage.ts` (labels `teamType` + nombres de los 5 tipos)

- [ ] USelect con los 5 tipos, guardado vía PATCH existente (~línea 387). Refrescar store del workspace tras guardar.
- [ ] Commit `feat(settings): editable workspace team type`.

### Task 12: Verificación final + publicar

- [ ] `rtk npm run build` limpio.
- [ ] Revisión rápida: grep de `minimax/minimax-m2.5` en `assist.post.ts` = 0 resultados; `templateConfigs` tiene 5 entradas; `/onboarding` ya no ofrece plantillas.
- [ ] `rtk git push` a `main`.
- [ ] Recordar al usuario aplicar la migración `045_workspace_team_type.sql` en Supabase.

## Self-Review

- Cobertura del spec: §1→Task 3; §2→Tasks 1,2,4,11; §3.1→Task 7; §3.2→Task 8; §3.3→Task 9; §3.4→Task 10; §4→Tasks 5,6. ✔
- Tipos consistentes: `KANBAN_TEMPLATES`, `team_type`, acción `advisor` usados con los mismos nombres en todas las tareas. ✔
- Sin placeholders TBD. ✔
