/**
 * GET /api/mcp-config
 * Returns connection instructions and quick-install commands for all MCP clients.
 */
export default defineEventHandler((event) => {
  const host = getRequestURL(event).origin
  const endpoint = `${host}/api/mcp`
  const token = 'ff_YOUR_TOKEN'

  const npxRemoteArgs = (t: string) => ['-y', 'mcp-remote', endpoint, '--header', `Authorization:Bearer ${t}`]

  return {
    server: {
      name: 'FocusFlow by Fidubit',
      version: '2.0.0',
      endpoint,
      discovery: `${host}/.well-known/mcp.json`,
      readme: `${host}/MCP_README.md`,
    },
    quick_install: {
      claude_code: `claude mcp add focusflow --transport http ${endpoint} --header "Authorization: Bearer ${token}"`,
      claude_desktop_npx: `npx -y @anthropic-ai/claude-code mcp add focusflow -- npx -y mcp-remote ${endpoint} --header "Authorization:Bearer ${token}"`,
    },
    clients: {
      claude_code: {
        name: 'Claude Code',
        description: 'Run in your terminal',
        command: `claude mcp add focusflow --transport http ${endpoint} --header "Authorization: Bearer ${token}"`,
      },
      claude_desktop: {
        name: 'Claude Desktop',
        description: 'Add to claude_desktop_config.json',
        config: {
          mcpServers: {
            focusflow: {
              command: 'npx',
              args: npxRemoteArgs(token),
            },
          },
        },
      },
      cursor: {
        name: 'Cursor',
        description: 'Add to .cursor/mcp.json in your project root',
        config: {
          mcpServers: {
            focusflow: {
              url: endpoint,
              headers: { Authorization: `Bearer ${token}` },
            },
          },
        },
      },
      windsurf: {
        name: 'Windsurf',
        description: 'Add to ~/.codeium/windsurf/mcp_config.json',
        config: {
          mcpServers: {
            focusflow: {
              command: 'npx',
              args: npxRemoteArgs(token),
            },
          },
        },
      },
      cline: {
        name: 'Cline',
        description: 'VS Code > Cline > MCP Servers',
        config: {
          mcpServers: {
            focusflow: {
              command: 'npx',
              args: npxRemoteArgs(token),
            },
          },
        },
      },
      gemini: {
        name: 'Gemini CLI',
        description: 'Add to ~/.gemini/settings.json',
        config: {
          mcpServers: {
            focusflow: {
              command: 'npx',
              args: npxRemoteArgs(token),
            },
          },
        },
      },
    },
    tools: [
      'list_workspaces', 'list_projects', 'list_columns', 'list_tasks',
      'get_task', 'search_tasks', 'list_members', 'get_board',
      'create_task', 'create_tasks', 'update_task', 'delete_task',
      'move_task', 'add_comment', 'manage_checklist', 'create_project',
      'delegate_to_agent',
    ],
  }
})
