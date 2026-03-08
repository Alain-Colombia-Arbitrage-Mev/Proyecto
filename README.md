# FocusFlow by Fidubit — MCP Server

Model Context Protocol (MCP) server for **FocusFlow**, the bilingual project management platform with AI-augmented workflows.

Connect your AI assistant to FocusFlow and manage workspaces, projects, Kanban boards, tasks, AI agents, and orchestration — all through natural language.

---

## One-Click Install

> **Before installing:** generate your API token at [focus.nexaru.net](https://focus.nexaru.net) in **Settings > MCP/API**, then replace `ff_YOUR_TOKEN` in the config with your actual token.

<table>
<tr>
<td>

<a href="https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22focusflow%22%2C%22config%22%3A%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ffocus.nexaru.net%2Fapi%2Fmcp%22%2C%22headers%22%3A%7B%22Authorization%22%3A%22Bearer%20ff_YOUR_TOKEN%22%7D%7D%7D">
  <img src="https://img.shields.io/badge/VS_Code-Install_FocusFlow_MCP-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Install in VS Code" />
</a>

</td>
<td>

<a href="cursor://anysphere.cursor-deeplink/mcp/install?name=focusflow&config=eyJ1cmwiOiJodHRwczovL2ZvY3VzLm5leGFydS5uZXQvYXBpL21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBmZl9ZT1VSX1RPS0VOIn19">
  <img src="https://img.shields.io/badge/Cursor-Install_FocusFlow_MCP-000000?style=for-the-badge&logo=cursor&logoColor=white" alt="Install in Cursor" />
</a>

</td>
</tr>
<tr>
<td>

<a href="#windsurf">
  <img src="https://img.shields.io/badge/Windsurf-Setup_Guide-06B6D4?style=for-the-badge&logo=codeium&logoColor=white" alt="Windsurf Setup" />
</a>

</td>
<td>

<a href="#cline-vs-code">
  <img src="https://img.shields.io/badge/Cline-Setup_Guide-22C55E?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Cline Setup" />
</a>

</td>
</tr>
<tr>
<td>

<a href="#claude-code">
  <img src="https://img.shields.io/badge/Claude_Code-Copy_Command-F97316?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude Code" />
</a>

</td>
<td>

<a href="#gemini-cli">
  <img src="https://img.shields.io/badge/Gemini_CLI-Setup_Guide-F59E0B?style=for-the-badge&logo=google&logoColor=white" alt="Gemini CLI Setup" />
</a>

</td>
</tr>
</table>

---

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

## Install Guide

### 1. Get your API token

Go to **Settings > MCP/API** in your [FocusFlow workspace](https://focus.nexaru.net), or visit the `/integrations` page to create a token.

### 2. Connect your client

---

### Claude Code

Run in your terminal:

```bash
claude mcp add focusflow --transport http https://focus.nexaru.net/api/mcp --header "Authorization: Bearer ff_YOUR_TOKEN"
```

---

### Claude Desktop

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

---

### Cursor

> **One-click:** Click the badge above, or use the deep link:
> `cursor://anysphere.cursor-deeplink/mcp/install?name=focusflow&config=eyJ1cmwiOiJodHRwczovL2ZvY3VzLm5leGFydS5uZXQvYXBpL21jcCIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBmZl9ZT1VSX1RPS0VOIn19`

Or add manually to `.cursor/mcp.json`:

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

---

### VS Code (Copilot)

> **One-click:** Click the **VS Code** badge above to install directly.

Or add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "focusflow": {
      "type": "http",
      "url": "https://focus.nexaru.net/api/mcp",
      "headers": {
        "Authorization": "Bearer ff_YOUR_TOKEN"
      }
    }
  }
}
```

---

### Windsurf

Open **Windsurf Settings > Cascade > MCP Servers**, click "Add custom server", or edit `~/.codeium/windsurf/mcp_config.json`:

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

---

### Cline (VS Code)

Open **VS Code > Cline > MCP Servers**, add:

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

---

### Gemini CLI

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

---

## Self-hosted

If you run your own FocusFlow instance, replace `https://focus.nexaru.net` with your domain in all configs above.

## Discovery

MCP clients can auto-discover this server at:

```
GET https://focus.nexaru.net/.well-known/mcp.json
```

Connection instructions API:

```
GET https://focus.nexaru.net/api/mcp-config
```

## Authentication

All requests require a Bearer token in the `Authorization` header. Tokens are workspace-scoped with configurable permissions:

| Scope | Access |
|-------|--------|
| **read** | List and search operations |
| **write** | Create, update, delete operations |
| **admin** | Workspace management |

Generate tokens in your workspace at **Settings > MCP/API**.

## Protocol

| Property | Value |
|----------|-------|
| Transport | HTTP POST |
| Protocol | JSON-RPC 2.0 |
| Endpoint | `/api/mcp` |
| Content-Type | `application/json` |

## Rate Limits

- 60 requests per minute per token
- Token usage tracked per workspace/action/day

## Links

- **App:** [focus.nexaru.net](https://focus.nexaru.net)
- **Smithery:** Published on [smithery.ai](https://smithery.ai)
- **Repository:** [github.com/Alain-Colombia-Arbitrage-Mev/Proyecto](https://github.com/Alain-Colombia-Arbitrage-Mev/Proyecto)

## License

MIT
