# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusFlow is a bilingual (ES/EN) project management platform with AI-augmented workflows, built as a fullstack Nuxt 3 application. It features multi-workspace tenancy, Kanban boards, RBAC permissions, and integrations with OpenRouter AI, Google Meet, Firebase, and Amazon SES.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run generate   # Static site generation
npm run postinstall # nuxt prepare (auto-runs after npm install)
```

No test runner or linter is configured in package.json.

## Tech Stack

- **Frontend:** Nuxt 3.16, Vue 3, @nuxt/ui 3 (TailwindCSS v4), Pinia, TanStack Vue Query, TipTap editor, Zod
- **Backend:** Nitro server routes (H3), Supabase (PostgreSQL + Auth), OpenRouter AI
- **Services:** Firebase (push notifications), Amazon SES (email), Google Meet API, Context7 API (doc generation)
- **Language:** TypeScript 5.7

## Architecture

### Directory Structure

- `app/` — Frontend: pages, components, composables, stores, layouts, middleware, types
- `server/` — Backend: `api/` (74 REST endpoints), `utils/` (auth, permissions, AI, email, notifications)

### Routing & Multi-tenancy

File-based routing with dynamic `[workspace]` segment. All resources are scoped to `workspace_id`. Key routes:
- `pages/auth/` — Login, register, OAuth callback
- `pages/[workspace]/dashboard.vue` — Main dashboard
- `pages/[workspace]/projects/[id]/kanban.vue` — Kanban board (largest page, ~1730 lines)
- `pages/onboarding.vue` — New user onboarding

### State Management

- **Pinia stores:** `useAuthStore()` (user, role, workspace context), `useWorkspaceStore()` (projects, members)
- **Composables:** `useAuth()`, `useLanguage()`, `usePermissions()`, `usePushNotifications()`, `usePomodoro()`

### API Conventions

Server routes in `server/api/` use Nuxt's naming convention with HTTP method suffixes:
- `workspaces/[workspaceId]/tasks.get.ts` → GET handler
- `workspaces/[workspaceId]/tasks.post.ts` → POST handler

### Authentication & Authorization

- **Auth:** Supabase Auth (email/password + Google OAuth). Server extracts user via `serverSupabaseUser(event)`.
- **Middleware:** `app/middleware/auth.ts` guards protected routes.
- **RBAC:** Role hierarchy: `superadmin > owner > admin > member/marketing > viewer`. Centralized in `server/utils/permissions.ts` with workspace-level overrides via `ai_config` JSON. Platform admins (hardcoded email list in `server/utils/auth.ts`) bypass membership checks.

### Bilingual System

No i18n library — custom `useLanguage()` composable with 200+ translated labels stored in-memory. Database stores bilingual fields (`title`/`title_en`, `description`/`description_en`). Default language: Spanish. Preference persisted in localStorage (`focusflow_lang`).

### AI Integration

- **OpenRouter API** for chat assistance and task analysis (`server/api/ai/assist.post.ts`)
- **Doc agents** generate architecture docs via Context7 (`server/utils/docAgent.ts`)
- **Task features:** AI decomposition (`ai_quick_task`, `ai_decomposed` flags), auto-translate
- **Token tracking:** Per workspace/action/day in database
- **Memory/embeddings:** Semantic search for tasks and docs (`server/utils/embeddings.ts`)

### Styling

TailwindCSS v4 via @nuxt/ui. Custom theme color `focusflow` (teal palette) defined in `app/assets/css/main.css`. Dark mode supports system preference + manual toggle. Fonts: Inter, Space Grotesk, Plus Jakarta Sans, Space Mono.

## Key Files

| Purpose | Path |
|---------|------|
| All TypeScript interfaces | `app/types/index.ts` |
| RBAC permission logic | `server/utils/permissions.ts` |
| Server auth helpers | `server/utils/auth.ts` |
| Language/i18n labels | `app/composables/useLanguage.ts` |
| Theme & colors | `app/assets/css/main.css` |
| Nuxt configuration | `nuxt.config.ts` |
| Environment template | `.env.example` |

## Environment Variables

Required keys (see `.env.example`): Supabase URL/keys, OpenRouter API key, AWS SES credentials, Firebase config + VAPID key, cron secret, Context7 API key.
