import { serverSupabaseServiceRole } from '#supabase/server'
import { authenticateApiToken } from '~~/server/utils/apiTokens'

/**
 * FocusFlow MCP Server — JSON-RPC 2.0 over HTTP
 *
 * Connect from Cursor/Claude using:
 *   URL: https://your-domain.com/api/mcp
 *   Header: Authorization: Bearer ff_<token>
 *
 * Exposed tools:
 *   - list_workspaces
 *   - list_projects
 *   - list_columns
 *   - list_tasks
 *   - get_task
 *   - create_task
 *   - update_task
 *   - move_task
 */

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, any>
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: any
  error?: { code: number; message: string; data?: any }
}

function rpcResult(id: string | number | null, result: any): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id: string | number | null, code: number, message: string, data?: any): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } }
}

const SERVER_INFO = {
  name: 'focusflow-mcp',
  version: '1.0.0',
}

const TOOLS = [
  {
    name: 'list_workspaces',
    description: 'List all workspaces accessible with this token',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_projects',
    description: 'List all projects in the workspace',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: active, archived. Default: active' },
      },
      required: [],
    },
  },
  {
    name: 'list_columns',
    description: 'List kanban columns for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks in a project, optionally filtered by column',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        column_id: { type: 'string', description: 'Optional: filter by column UUID' },
        limit: { type: 'number', description: 'Max results (default 50)' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_task',
    description: 'Get full details of a specific task including checklist and comments',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a project column',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        column_id: { type: 'string', description: 'Column UUID' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description (optional)' },
        priority: { type: 'string', description: 'low, medium, high, urgent. Default: medium' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'Array of user UUIDs' },
        due_date: { type: 'string', description: 'ISO date string (optional)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag strings' },
      },
      required: ['project_id', 'column_id', 'title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string' },
        assignees: { type: 'array', items: { type: 'string' } },
        due_date: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'move_task',
    description: 'Move a task to a different column',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        column_id: { type: 'string', description: 'Target column UUID' },
        position: { type: 'number', description: 'Position in column (optional, default 0)' },
      },
      required: ['task_id', 'column_id'],
    },
  },
]

export default defineEventHandler(async (event) => {
  // Authenticate via API token
  const auth = await authenticateApiToken(event)
  if (!auth) {
    setResponseStatus(event, 401)
    return rpcError(null, -32000, 'Unauthorized: invalid or missing API token')
  }

  const body = await readBody<JsonRpcRequest>(event)

  if (!body?.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
    return rpcError(body?.id ?? null, -32600, 'Invalid JSON-RPC request')
  }

  const { id, method, params } = body
  const supabase = serverSupabaseServiceRole(event)
  const workspaceId = auth.workspaceId
  const scopes = auth.scopes

  try {
    // ── MCP Protocol methods ──
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      })
    }

    if (method === 'notifications/initialized') {
      return rpcResult(id, {})
    }

    if (method === 'tools/list') {
      return rpcResult(id, { tools: TOOLS })
    }

    if (method === 'tools/call') {
      const toolName = params?.name
      const args = params?.arguments || {}

      const toolResult = await handleTool(toolName, args, { supabase, workspaceId, scopes, userId: auth.userId })
      return rpcResult(id, toolResult)
    }

    // ── Direct tool calls (convenience — call tool name as method) ──
    if (TOOLS.some(t => t.name === method)) {
      const toolResult = await handleTool(method, params || {}, { supabase, workspaceId, scopes, userId: auth.userId })
      return rpcResult(id, toolResult)
    }

    return rpcError(id, -32601, `Method not found: ${method}`)
  } catch (err: any) {
    console.error('[mcp] Error:', err.message)
    return rpcError(id, -32603, err.message || 'Internal error')
  }
})

// ── Tool handler ──
async function handleTool(
  name: string,
  args: Record<string, any>,
  ctx: { supabase: any; workspaceId: string; scopes: string[]; userId: string },
) {
  const { supabase, workspaceId, scopes } = ctx

  function requireScope(scope: string) {
    if (!scopes.includes(scope) && !scopes.includes('admin')) {
      throw new Error(`Insufficient scope: requires '${scope}'`)
    }
  }

  switch (name) {
    // ── list_workspaces ──
    case 'list_workspaces': {
      requireScope('read')
      const { data } = await supabase
        .from('workspaces')
        .select('id, name, slug, created_at')
        .eq('id', workspaceId)

      return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] }
    }

    // ── list_projects ──
    case 'list_projects': {
      requireScope('read')
      let query = supabase
        .from('projects')
        .select('id, name, description, status, priority, category, color, kanban_template, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (args.status) {
        if (args.status === 'archived') {
          query = query.eq('archived', true)
        } else {
          query = query.eq('archived', false).eq('status', args.status)
        }
      } else {
        query = query.eq('archived', false)
      }

      const { data } = await query
      return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] }
    }

    // ── list_columns ──
    case 'list_columns': {
      requireScope('read')
      if (!args.project_id) throw new Error('project_id is required')

      // Verify project belongs to workspace
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('id', args.project_id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      if (!proj) throw new Error('Project not found in this workspace')

      const { data } = await supabase
        .from('kanban_columns')
        .select('id, title, color, icon, position, wip_limit')
        .eq('project_id', args.project_id)
        .order('position')

      return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] }
    }

    // ── list_tasks ──
    case 'list_tasks': {
      requireScope('read')
      if (!args.project_id) throw new Error('project_id is required')

      // Verify project
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('id', args.project_id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      if (!proj) throw new Error('Project not found in this workspace')

      let query = supabase
        .from('tasks')
        .select('id, title, description, priority, assignees, due_date, tags, column_id, position, created_at, updated_at')
        .eq('project_id', args.project_id)
        .order('position')
        .limit(args.limit || 50)

      if (args.column_id) {
        query = query.eq('column_id', args.column_id)
      }

      const { data } = await query
      return { content: [{ type: 'text', text: JSON.stringify(data || [], null, 2) }] }
    }

    // ── get_task ──
    case 'get_task': {
      requireScope('read')
      if (!args.task_id) throw new Error('task_id is required')

      const { data: task } = await supabase
        .from('tasks')
        .select('*, project:projects!inner(id, workspace_id)')
        .eq('id', args.task_id)
        .maybeSingle()

      if (!task || task.project?.workspace_id !== workspaceId) {
        throw new Error('Task not found in this workspace')
      }

      // Fetch checklist and comments
      const [{ data: checklist }, { data: comments }] = await Promise.all([
        supabase.from('task_checklist').select('id, text, completed, position').eq('task_id', args.task_id).order('position'),
        supabase.from('task_comments').select('id, user_id, content, created_at').eq('task_id', args.task_id).order('created_at'),
      ])

      const result = { ...task, project: undefined, checklist: checklist || [], comments: comments || [] }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }

    // ── create_task ──
    case 'create_task': {
      requireScope('write')
      if (!args.project_id || !args.column_id || !args.title) {
        throw new Error('project_id, column_id, and title are required')
      }

      // Verify project belongs to workspace
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('id', args.project_id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      if (!proj) throw new Error('Project not found in this workspace')

      // Verify column belongs to this project
      const { data: col } = await supabase
        .from('kanban_columns')
        .select('id')
        .eq('id', args.column_id)
        .eq('project_id', args.project_id)
        .maybeSingle()

      if (!col) throw new Error('Column not found in this project')

      // Calculate append position (last in column)
      const { data: maxPos } = await supabase
        .from('tasks')
        .select('position')
        .eq('column_id', args.column_id)
        .order('position', { ascending: false })
        .limit(1)

      const position = maxPos && maxPos.length > 0 ? maxPos[0].position + 1 : 0

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          project_id: args.project_id,
          column_id: args.column_id,
          title: args.title,
          description: args.description || null,
          priority: args.priority || 'medium',
          assignees: args.assignees || [],
          due_date: args.due_date || null,
          tags: args.tags || [],
          reporter_id: ctx.userId,
          position,
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to create task: ${error.message}`)
      return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] }
    }

    // ── update_task ──
    case 'update_task': {
      requireScope('write')
      if (!args.task_id) throw new Error('task_id is required')

      // Verify ownership
      const { data: existing } = await supabase
        .from('tasks')
        .select('id, project:projects!inner(workspace_id)')
        .eq('id', args.task_id)
        .maybeSingle()

      if (!existing || existing.project?.workspace_id !== workspaceId) {
        throw new Error('Task not found in this workspace')
      }

      const updates: Record<string, any> = {}
      if (args.title !== undefined) updates.title = args.title
      if (args.description !== undefined) updates.description = args.description
      if (args.priority !== undefined) updates.priority = args.priority
      if (args.assignees !== undefined) updates.assignees = args.assignees
      if (args.due_date !== undefined) updates.due_date = args.due_date
      if (args.tags !== undefined) updates.tags = args.tags
      updates.updated_at = new Date().toISOString()

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', args.task_id)
        .select()
        .single()

      if (error) throw new Error(`Failed to update task: ${error.message}`)
      return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] }
    }

    // ── move_task ──
    case 'move_task': {
      requireScope('write')
      if (!args.task_id || !args.column_id) throw new Error('task_id and column_id are required')

      const { data: existing } = await supabase
        .from('tasks')
        .select('id, column_id, project_id, project:projects!inner(workspace_id)')
        .eq('id', args.task_id)
        .maybeSingle()

      if (!existing || existing.project?.workspace_id !== workspaceId) {
        throw new Error('Task not found in this workspace')
      }

      // Verify target column belongs to the same project
      const { data: targetCol } = await supabase
        .from('kanban_columns')
        .select('id')
        .eq('id', args.column_id)
        .eq('project_id', existing.project_id)
        .maybeSingle()

      if (!targetCol) throw new Error('Target column not found in this project')

      const now = new Date().toISOString()

      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          column_id: args.column_id,
          position: args.position ?? 0,
          column_entered_at: now,
          updated_at: now,
        })
        .eq('id', args.task_id)
        .select()
        .single()

      if (error) throw new Error(`Failed to move task: ${error.message}`)

      // Record column history (fire-and-forget)
      if (existing.column_id && existing.column_id !== args.column_id) {
        supabase
          .from('task_column_history')
          .update({ exited_at: now })
          .eq('task_id', args.task_id)
          .eq('column_id', existing.column_id)
          .is('exited_at', null)
          .then(() => {}, () => {})

        supabase
          .from('task_column_history')
          .insert({ task_id: args.task_id, column_id: args.column_id, entered_at: now })
          .then(() => {}, () => {})
      }

      return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
