# FocusFlow

**AI-powered project management platform built with Nuxt 3.**

FocusFlow is a fullstack, bilingual (ES/EN) project management platform with multi-workspace tenancy, Kanban boards, RBAC permissions, AI agent delegation, and an MCP server for connecting to Claude, Cursor, VS Code, and other AI tools.

**[Live App](https://focus.nexaru.net)** · **[MCP Server Docs](https://github.com/Alain-Colombia-Arbitrage-Mev/Proyecto/tree/mcp-marketplace)**

---

![Dashboard](screenshots/dashboard-light.png)

![Kanban Board](screenshots/kanban-light.png)

![Projects](screenshots/projects-light.png)

---

## Features

**Project Management**
- Multi-workspace tenancy with RBAC (superadmin / owner / admin / member / viewer)
- Kanban boards with 14 templates (Simple, Scrum, DevOps, Marketing, AI Agents, etc.)
- Drag-and-drop tasks with priority, assignees, checklists, comments, and file attachments
- CSV import from Trello, Asana, Jira, ClickUp, Monday, Notion, Linear
- Roadmap timeline and OKR goal tracking

**AI Integration**
- AI task decomposition and auto-translate (ES/EN/UR)
- AI agent delegation with orchestrator for multi-step workflows
- Semantic search via embeddings
- Token tracking per workspace/action/day
- MCP server (16 tools) for Claude, Cursor, VS Code, Windsurf, Cline, Gemini

**Collaboration**
- Team management with role-based access per workspace
- Google Meet integration for scheduling meetings
- Push notifications (Firebase) and email alerts (Amazon SES)
- Pomodoro timer and Lofi music player
- Timesheet with time tracking and reports

**Platform**
- Bilingual UI (Spanish/English) with 200+ translated labels
- Dark mode with system preference detection
- Module toggle system — enable/disable features per workspace
- Billing and plan management

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Nuxt 3.16, Vue 3, TypeScript 5.7, @nuxt/ui 3 (TailwindCSS v4), Pinia, TanStack Vue Query, TipTap editor |
| **Backend** | Nitro server (H3), 148 API endpoints, Supabase (PostgreSQL + Auth) |
| **AI** | OpenRouter API, Context7 API, semantic embeddings |
| **Services** | Firebase (push notifications), Amazon SES (email), Google Meet API |
| **MCP** | JSON-RPC 2.0 over HTTP, 16 tools, Bearer token auth |

## Architecture

```
app/                          # Frontend (Nuxt 3)
├── pages/                    # 25 pages (file-based routing)
│   ├── auth/                 # Login, register, OAuth callback
│   ├── [workspace]/          # Dynamic workspace routes
│   │   ├── dashboard.vue     # Main overview with stats
│   │   ├── projects/         # Project list + Kanban boards
│   │   ├── agents.vue        # AI agent delegation
│   │   ├── orchestrator.vue  # Multi-step AI workflows
│   │   ├── integrations.vue  # MCP/API token management
│   │   └── ...               # 15+ more workspace pages
│   └── onboarding.vue        # New user setup
├── components/               # 47 Vue components
├── composables/              # useAuth, useLanguage, useModules, etc.
├── stores/                   # Pinia (auth, workspace)
└── types/                    # TypeScript interfaces

server/                       # Backend (Nitro/H3)
├── api/                      # 148 REST endpoints
│   ├── mcp.post.ts           # MCP server (16 tools)
│   ├── ai/                   # AI assist, embeddings
│   └── workspaces/           # CRUD for all resources
├── routes/                   # Server routes (mcp-install, .well-known)
└── utils/                    # Auth, permissions, AI, email, notifications
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (PostgreSQL + Auth)
- OpenRouter API key (for AI features)

### Setup

```bash
git clone https://github.com/Alain-Colombia-Arbitrage-Mev/Proyecto.git
cd Proyecto
npm install
cp .env.example .env    # Fill in your keys
npm run dev             # http://localhost:3000
```

### Environment Variables

See `.env.example` for the full list. Required:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `AWS_SES_*` | Amazon SES credentials (email) |
| `FIREBASE_*` | Firebase config (push notifications) |

### Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run tests (vitest)
```

## MCP Server

FocusFlow includes a built-in MCP server with 16 tools for managing your workspace from AI assistants.

**[Full MCP documentation and one-click install links →](https://github.com/Alain-Colombia-Arbitrage-Mev/Proyecto/tree/mcp-marketplace)**

Quick install for Claude Code:

```bash
claude mcp add focusflow --transport http https://focus.nexaru.net/api/mcp --header "Authorization: Bearer ff_YOUR_TOKEN"
```

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Application code (frontend + backend + MCP server) |
| `mcp-marketplace` | MCP marketplace files (README with install badges, Smithery config, discovery endpoint) |

## License

MIT

---

Built by [Fidubit](https://focus.nexaru.net)
