/**
 * GET /api/mcp-config
 * Returns connection instructions and quick-install commands for MCP clients.
 */
export default defineEventHandler((event) => {
  const host = getRequestURL(event).origin

  return {
    server: {
      name: 'FocusFlow by Fidubit',
      version: '2.0.0',
      endpoint: `${host}/api/mcp`,
      discovery: `${host}/.well-known/mcp.json`,
    },
    quick_install: {
      claude_code: `claude mcp add focusflow --transport http ${host}/api/mcp --header "Authorization: Bearer ff_YOUR_TOKEN"`,
      claude_desktop: `npx -y @anthropic-ai/claude-code mcp add focusflow -- npx -y mcp-remote ${host}/api/mcp --header "Authorization:Bearer ff_YOUR_TOKEN"`,
    },
    manual_setup: {
      cursor: {
        description: 'Add to .cursor/mcp.json in your project root',
        config: {
          mcpServers: {
            focusflow: {
              url: `${host}/api/mcp`,
              headers: {
                Authorization: 'Bearer ff_YOUR_TOKEN',
              },
            },
          },
        },
      },
      claude_desktop: {
        description: 'Add to claude_desktop_config.json (requires Node.js)',
        config: {
          mcpServers: {
            focusflow: {
              command: 'npx',
              args: [
                '-y',
                'mcp-remote',
                `${host}/api/mcp`,
                '--header',
                'Authorization:\${AUTH_HEADER}',
              ],
              env: {
                AUTH_HEADER: 'Bearer ff_YOUR_TOKEN',
              },
            },
          },
        },
      },
      claude_code: {
        description: 'Add to .mcp.json in your project root',
        config: {
          mcpServers: {
            focusflow: {
              type: 'url',
              url: `${host}/api/mcp`,
              headers: {
                Authorization: 'Bearer ff_YOUR_TOKEN',
              },
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
