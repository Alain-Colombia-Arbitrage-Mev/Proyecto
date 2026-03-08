/**
 * MCP Discovery endpoint
 * GET /.well-known/mcp.json
 *
 * Allows MCP clients (Cursor, Claude, etc.) to auto-discover
 * this server's capabilities.
 */
export default defineEventHandler(() => {
  return {
    name: 'FocusFlow by Fidubit',
    version: '2.0.0',
    description: 'FocusFlow by Fidubit — manage workspaces, projects, kanban boards, tasks, AI agents, and orchestration.',
    protocol: 'json-rpc-2.0',
    transport: 'http',
    endpoint: '/api/mcp',
    authentication: {
      type: 'bearer',
      description: 'Use an API token starting with ff_. Generate one in Settings > API Tokens.',
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    tools_count: 16,
    categories: [
      'project-management',
      'kanban',
      'task-management',
      'ai-agents',
    ],
  }
})
