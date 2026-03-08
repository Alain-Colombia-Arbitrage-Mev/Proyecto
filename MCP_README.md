# FocusFlow by Fidubit — MCP Server

Model Context Protocol (MCP) server for **FocusFlow**, the bilingual project management platform with AI-augmented workflows.

Connect your AI assistant to FocusFlow and manage workspaces, projects, Kanban boards, tasks, AI agents, and orchestration — all through natural language.

## Features

- **16 tools** via JSON-RPC 2.0 over HTTP
- Bearer token authentication (`ff_` prefixed tokens)
- Workspace-scoped operations with RBAC
- AI agent delegation and task orchestration
- Bilingual support (ES/EN)

## Available Tools

| Tool | Description |
|------|-------------|
| `list_workspaces` | List all workspaces you have access to |
| `list_projects` | List projects in a workspace |
| `list_columns` | List Kanban columns for a project |
| `list_tasks` | List tasks with filters (status, assignee, priority, search) |
| `get_task` | Get full task details including comments and checklist |
| `search_tasks` | Full-text search across tasks |
| `list_members` | List workspace members and roles |
| `get_board` | Get complete Kanban board (columns + tasks) |
| `create_task` | Create a new task |
| `create_tasks` | Bulk create multiple tasks |
| `update_task` | Update task fields (title, status, priority, assignee, etc.) |
| `delete_task` | Delete a task |
| `move_task` | Move task between columns or reorder |
| `add_comment` | Add a comment to a task |
| `manage_checklist` | Add, toggle, or remove checklist items |
| `create_project` | Create a new project with Kanban template |
| `delegate_to_agent` | Delegate a task to an AI agent |

## Quick Install

### 1. Get your API token

Go to **Settings > MCP/API** in your FocusFlow workspace, or visit `/integrations` to create a token.

### 2. Connect your client

#### Claude Code

```bash
claude mcp add focusflow --transport http https://focus.nexaru.net/api/mcp --header "Authorization: Bearer ff_YOUR_TOKEN"
```

#### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "focusflow": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://focus.nexaru.net/api/mcp",
        "--header", "Authorization:Bearer ff_YOUR_TOKEN"
      ]
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "focusflow": {
      "url": "https://focus.nexaru.net/api/mcp",
      "headers": {
        "Authorization": "Bearer ff_YOUR_TOKEN"
      }
    }
  }
}
```

#### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "focusflow": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://focus.nexaru.net/api/mcp",
        "--header", "Authorization:Bearer ff_YOUR_TOKEN"
      ]
    }
  }
}
```

#### Cline (VS Code)

Open VS Code > Cline > MCP Servers, add:

```json
{
  "mcpServers": {
    "focusflow": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://focus.nexaru.net/api/mcp",
        "--header", "Authorization:Bearer ff_YOUR_TOKEN"
      ]
    }
  }
}
```

#### Gemini CLI

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "focusflow": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://focus.nexaru.net/api/mcp",
        "--header", "Authorization:Bearer ff_YOUR_TOKEN"
      ]
    }
  }
}
```

## Self-hosted

If you run your own FocusFlow instance, replace `https://focus.nexaru.net` with your domain.

## Discovery

MCP clients can auto-discover this server at:

```
GET https://focus.nexaru.net/.well-known/mcp.json
```

Connection instructions endpoint:

```
GET https://focus.nexaru.net/api/mcp-config
```

## Authentication

All requests require a Bearer token in the `Authorization` header. Tokens are workspace-scoped with configurable permissions:

- **read** — list and search operations
- **write** — create, update, delete operations
- **admin** — workspace management

Generate tokens in your workspace at **Settings > MCP/API**.

## Protocol

- **Transport:** HTTP POST
- **Protocol:** JSON-RPC 2.0
- **Endpoint:** `/api/mcp`
- **Content-Type:** `application/json`

## Rate Limits

- 60 requests per minute per token
- Token usage tracked per workspace/action/day

## Links

- **App:** [focus.nexaru.net](https://focus.nexaru.net)
- **Smithery:** Published on [smithery.ai](https://smithery.ai)
- **Repository:** [github.com/Alain-Colombia-Arbitrage-Mev/Proyecto](https://github.com/Alain-Colombia-Arbitrage-Mev/Proyecto)

## License

MIT
