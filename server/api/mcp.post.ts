import { serverSupabaseServiceRole } from '#supabase/server'
import { authenticateApiToken } from '~~/server/utils/apiTokens'

/**
 * FocusFlow MCP Server — JSON-RPC 2.0 over HTTP
 *
 * Connect from Cursor/Claude using:
 *   URL: https://your-domain.com/api/mcp
 *   Header: Authorization: Bearer ff_<token>
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

function textContent(data: any) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

/** Sanitize string inputs — max length */
function sanitize(val: string | undefined, maxLen: number): string | null {
  if (!val) return null
  return String(val).slice(0, maxLen)
}

const SERVER_INFO = { name: 'focusflow-mcp', version: '2.0.0' }

// ── Rate limiting (in-memory, per token) ──
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 120 // requests per minute
const RATE_WINDOW = 60_000

function checkRateLimit(tokenId: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(tokenId)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(tokenId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

const TOOLS = [
  // ── Read tools ──
  {
    name: 'list_workspaces',
    description: 'List all workspaces accessible with this API token. Returns workspace id, name, slug.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_projects',
    description: 'List all active projects in the workspace. Use status="archived" to see archived projects.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: "active" (default) or "archived"' },
      },
      required: [],
    },
  },
  {
    name: 'list_columns',
    description: 'List kanban columns for a project, ordered by position. Returns id, title, color, wip_limit.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID (get from list_projects)' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks in a project. Filter by column_id, priority, assignee, or search text. Supports pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        column_id: { type: 'string', description: 'Filter by column UUID' },
        priority: { type: 'string', description: 'Filter: low, medium, high, urgent' },
        assignee: { type: 'string', description: 'Filter by assignee user UUID' },
        ai_agent: { type: 'string', description: 'Filter by AI agent type (e.g. "backend", "frontend")' },
        search: { type: 'string', description: 'Search in task titles (case-insensitive)' },
        limit: { type: 'number', description: 'Max results (default 50, max 100)' },
        offset: { type: 'number', description: 'Skip N results for pagination (default 0)' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_task',
    description: 'Get full details of a task including checklist items, comments, subtasks, and ai_agent assignment.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'search_tasks',
    description: 'Search tasks across ALL projects in the workspace. Useful for finding tasks by text, priority, agent, or tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text in title/description (case-insensitive)' },
        priority: { type: 'string', description: 'Filter: low, medium, high, urgent' },
        ai_agent: { type: 'string', description: 'Filter by AI agent type' },
        tag: { type: 'string', description: 'Filter by tag name' },
        limit: { type: 'number', description: 'Max results (default 20, max 50)' },
      },
      required: [],
    },
  },
  {
    name: 'list_members',
    description: 'List workspace members with their user id, email, name, and role. Use this to find user UUIDs for task assignment.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_board',
    description: 'Get a complete project board: project info + columns + tasks organized by column. Single call replaces list_columns + list_tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
      },
      required: ['project_id'],
    },
  },
  // ── Write tools ──
  {
    name: 'create_task',
    description: 'Create a new task in a project column. Returns the created task with its UUID.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        column_id: { type: 'string', description: 'Column UUID (get from list_columns)' },
        title: { type: 'string', description: 'Task title (max 500 chars)' },
        description: { type: 'string', description: 'Task description in markdown (max 10000 chars)' },
        priority: { type: 'string', description: 'low, medium, high, urgent. Default: medium' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'User UUIDs (get from list_members)' },
        due_date: { type: 'string', description: 'ISO date: 2025-12-31' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag strings' },
        ai_agent: { type: 'string', description: 'Delegate to AI agent: backend, frontend, qa, devops, designer, copywriter, data, security' },
        parent_task_id: { type: 'string', description: 'Parent task UUID to create as subtask' },
      },
      required: ['project_id', 'column_id', 'title'],
    },
  },
  {
    name: 'create_tasks',
    description: 'Batch create multiple tasks in one call. Max 20 tasks per call.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        column_id: { type: 'string', description: 'Default column UUID for all tasks' },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              ai_agent: { type: 'string' },
              column_id: { type: 'string', description: 'Override default column for this task' },
            },
            required: ['title'],
          },
          description: 'Array of tasks to create (max 20)',
        },
      },
      required: ['project_id', 'column_id', 'tasks'],
    },
  },
  {
    name: 'update_task',
    description: 'Update task fields. Only provided fields are changed.',
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
        ai_agent: { type: 'string', description: 'Assign to AI agent or null to clear' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task and all its subtasks, checklist items, and comments.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID to delete' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'move_task',
    description: 'Move a task to a different column in the same project. Updates column history for analytics.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        column_id: { type: 'string', description: 'Target column UUID (must be in same project)' },
        position: { type: 'number', description: 'Position in column (default: append to end)' },
      },
      required: ['task_id', 'column_id'],
    },
  },
  {
    name: 'add_comment',
    description: 'Add a comment to a task. Useful for AI agents to leave analysis notes or status updates.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        content: { type: 'string', description: 'Comment text in markdown (max 5000 chars)' },
      },
      required: ['task_id', 'content'],
    },
  },
  {
    name: 'manage_checklist',
    description: 'Add, toggle, or remove checklist items on a task.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        action: { type: 'string', description: '"add", "toggle", or "remove"' },
        text: { type: 'string', description: 'Checklist item text (required for "add")' },
        item_id: { type: 'string', description: 'Checklist item UUID (required for "toggle" and "remove")' },
      },
      required: ['task_id', 'action'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project with kanban columns from a template.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name (max 200 chars)' },
        description: { type: 'string', description: 'Project description' },
        template: { type: 'string', description: 'Kanban template: simple, kanban, dev, devops, scrum, scrumban, marketing, ai_agents, support, backend_senior_dev, frontend_design, frontend_dev, backend_dev, app_development. Default: simple' },
        priority: { type: 'string', description: 'low, medium, high. Default: medium' },
        color: { type: 'string', description: 'Hex color (e.g. #0ea5e9). Default: #0ea5e9' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delegate_to_agent',
    description: 'Delegate a task to a specialized AI agent. Sets the ai_agent field and optionally decomposes the task into subtasks.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID to delegate' },
        agent_type: { type: 'string', description: 'Agent: backend, frontend, qa, devops, designer, copywriter, data, security, orchestrator' },
        decompose: { type: 'boolean', description: 'If true, create subtasks for the agent to work on (default false)' },
        subtasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
            },
            required: ['title'],
          },
          description: 'Predefined subtasks to create under this task',
        },
      },
      required: ['task_id', 'agent_type'],
    },
  },
]

export default defineEventHandler(async (event) => {
  const auth = await authenticateApiToken(event)
  if (!auth) {
    setResponseStatus(event, 401)
    return rpcError(null, -32000, 'Unauthorized: invalid or missing API token')
  }

  // Rate limit
  if (!checkRateLimit(auth.tokenId)) {
    setResponseStatus(event, 429)
    return rpcError(null, -32000, 'Rate limit exceeded: max 120 requests/minute')
  }

  const body = await readBody<JsonRpcRequest>(event)

  if (!body?.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
    return rpcError(body?.id ?? null, -32600, 'Invalid JSON-RPC request')
  }

  const { id, method, params } = body
  const supabase = serverSupabaseServiceRole(event)
  const ctx = { supabase, workspaceId: auth.workspaceId, scopes: auth.scopes, userId: auth.userId }

  try {
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      })
    }

    if (method === 'notifications/initialized') return rpcResult(id, {})

    if (method === 'tools/list') return rpcResult(id, { tools: TOOLS })

    if (method === 'tools/call') {
      const toolResult = await handleTool(params?.name, params?.arguments || {}, ctx)
      return rpcResult(id, toolResult)
    }

    // Direct tool calls
    if (TOOLS.some(t => t.name === method)) {
      return rpcResult(id, await handleTool(method, params || {}, ctx))
    }

    return rpcError(id, -32601, `Method not found: ${method}`)
  } catch (err: any) {
    console.error('[mcp] Error:', err.message)
    return rpcError(id, -32603, err.message || 'Internal error')
  }
})

// ── Helpers ──
async function verifyProject(supabase: any, projectId: string, workspaceId: string) {
  const { data } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('workspace_id', workspaceId).maybeSingle()
  if (!data) throw new Error('Project not found in this workspace')
  return data
}

async function verifyColumn(supabase: any, columnId: string, projectId: string) {
  const { data } = await supabase
    .from('kanban_columns').select('id').eq('id', columnId).eq('project_id', projectId).maybeSingle()
  if (!data) throw new Error('Column not found in this project')
  return data
}

async function verifyTask(supabase: any, taskId: string, workspaceId: string, extraSelect = '') {
  const select = `id, column_id, project_id${extraSelect}, project:projects!inner(workspace_id)`
  const { data } = await supabase.from('tasks').select(select).eq('id', taskId).maybeSingle()
  if (!data || data.project?.workspace_id !== workspaceId) throw new Error('Task not found in this workspace')
  return data
}

async function getAppendPosition(supabase: any, columnId: string) {
  const { data } = await supabase
    .from('tasks').select('position').eq('column_id', columnId).order('position', { ascending: false }).limit(1)
  return data && data.length > 0 ? data[0].position + 1 : 0
}

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

  const VALID_AGENTS = ['backend', 'frontend', 'qa', 'devops', 'designer', 'copywriter', 'data', 'security', 'orchestrator', 'custom']

  switch (name) {
    // ── list_workspaces ──
    case 'list_workspaces': {
      requireScope('read')
      const { data } = await supabase
        .from('workspaces').select('id, name, slug, created_at').eq('id', workspaceId)
      return textContent(data || [])
    }

    // ── list_projects ──
    case 'list_projects': {
      requireScope('read')
      let query = supabase
        .from('projects')
        .select('id, name, description, status, priority, category, color, kanban_template, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (args.status === 'archived') query = query.eq('archived', true)
      else query = query.eq('archived', false)

      const { data } = await query
      return textContent(data || [])
    }

    // ── list_columns ──
    case 'list_columns': {
      requireScope('read')
      if (!args.project_id) throw new Error('project_id is required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const { data } = await supabase
        .from('kanban_columns')
        .select('id, title, color, icon, position, wip_limit')
        .eq('project_id', args.project_id)
        .order('position')

      return textContent(data || [])
    }

    // ── list_tasks ──
    case 'list_tasks': {
      requireScope('read')
      if (!args.project_id) throw new Error('project_id is required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const limit = Math.min(args.limit || 50, 100)
      const offset = args.offset || 0

      let query = supabase
        .from('tasks')
        .select('id, title, description, priority, assignees, due_date, tags, column_id, position, ai_agent, parent_task_id, created_at, updated_at')
        .eq('project_id', args.project_id)
        .order('position')
        .range(offset, offset + limit - 1)

      if (args.column_id) query = query.eq('column_id', args.column_id)
      if (args.priority) query = query.eq('priority', args.priority)
      if (args.assignee) query = query.contains('assignees', [args.assignee])
      if (args.ai_agent) query = query.eq('ai_agent', args.ai_agent)
      if (args.search) query = query.ilike('title', `%${args.search}%`)

      const { data } = await query
      return textContent(data || [])
    }

    // ── get_task ──
    case 'get_task': {
      requireScope('read')
      if (!args.task_id) throw new Error('task_id is required')

      const { data: task } = await supabase
        .from('tasks')
        .select('*, project:projects!inner(id, name, workspace_id)')
        .eq('id', args.task_id)
        .maybeSingle()

      if (!task || task.project?.workspace_id !== workspaceId) {
        throw new Error('Task not found in this workspace')
      }

      const [{ data: checklist }, { data: comments }, { data: subtasks }] = await Promise.all([
        supabase.from('task_checklist').select('id, text, completed, position').eq('task_id', args.task_id).order('position'),
        supabase.from('task_comments').select('id, user_id, content, created_at').eq('task_id', args.task_id).order('created_at'),
        supabase.from('tasks').select('id, title, priority, column_id, ai_agent, assignees').eq('parent_task_id', args.task_id).order('position'),
      ])

      const projectName = task.project?.name
      const result = { ...task, project: undefined, project_name: projectName, checklist: checklist || [], comments: comments || [], subtasks: subtasks || [] }
      return textContent(result)
    }

    // ── search_tasks ──
    case 'search_tasks': {
      requireScope('read')
      const limit = Math.min(args.limit || 20, 50)

      // Get all project ids in workspace
      const { data: projects } = await supabase
        .from('projects').select('id').eq('workspace_id', workspaceId).eq('archived', false)
      const pIds = (projects || []).map((p: any) => p.id)
      if (pIds.length === 0) return textContent([])

      let query = supabase
        .from('tasks')
        .select('id, title, description, priority, assignees, tags, column_id, project_id, ai_agent, due_date, created_at')
        .in('project_id', pIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (args.query) query = query.or(`title.ilike.%${args.query}%,description.ilike.%${args.query}%`)
      if (args.priority) query = query.eq('priority', args.priority)
      if (args.ai_agent) query = query.eq('ai_agent', args.ai_agent)
      if (args.tag) query = query.contains('tags', [args.tag])

      const { data } = await query
      return textContent(data || [])
    }

    // ── list_members ──
    case 'list_members': {
      requireScope('read')
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id, role')
        .eq('workspace_id', workspaceId)

      if (!members || members.length === 0) return textContent([])

      // Fetch user details
      const results = []
      for (const m of members) {
        try {
          const { data: profile } = await supabase.auth.admin.getUserById(m.user_id)
          results.push({
            id: m.user_id,
            email: profile?.user?.email || '',
            name: profile?.user?.user_metadata?.full_name || profile?.user?.email || '',
            role: m.role,
          })
        } catch {
          results.push({ id: m.user_id, email: '', name: '', role: m.role })
        }
      }

      return textContent(results)
    }

    // ── get_board ──
    case 'get_board': {
      requireScope('read')
      if (!args.project_id) throw new Error('project_id is required')

      const { data: proj } = await supabase
        .from('projects')
        .select('id, name, description, status, priority, kanban_template, color')
        .eq('id', args.project_id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      if (!proj) throw new Error('Project not found in this workspace')

      const [{ data: columns }, { data: tasks }] = await Promise.all([
        supabase.from('kanban_columns').select('id, title, color, position, wip_limit').eq('project_id', args.project_id).order('position'),
        supabase.from('tasks').select('id, title, priority, assignees, due_date, tags, column_id, position, ai_agent, parent_task_id').eq('project_id', args.project_id).is('parent_task_id', null).order('position'),
      ])

      // Organize tasks by column
      const tasksByColumn: Record<string, any[]> = {}
      for (const col of (columns || [])) tasksByColumn[col.id] = []
      for (const task of (tasks || [])) {
        if (tasksByColumn[task.column_id]) tasksByColumn[task.column_id].push(task)
      }

      const board = {
        project: proj,
        columns: (columns || []).map((col: any) => ({
          ...col,
          tasks: tasksByColumn[col.id] || [],
          task_count: (tasksByColumn[col.id] || []).length,
        })),
        total_tasks: (tasks || []).length,
      }

      return textContent(board)
    }

    // ── create_task ──
    case 'create_task': {
      requireScope('write')
      if (!args.project_id || !args.column_id || !args.title) {
        throw new Error('project_id, column_id, and title are required')
      }

      await verifyProject(supabase, args.project_id, workspaceId)
      await verifyColumn(supabase, args.column_id, args.project_id)

      // Validate parent task if subtask
      if (args.parent_task_id) {
        const parent = await verifyTask(supabase, args.parent_task_id, workspaceId)
        if (parent.project_id !== args.project_id) throw new Error('Parent task must be in the same project')
      }

      const position = await getAppendPosition(supabase, args.column_id)

      const insertPayload: Record<string, any> = {
        project_id: args.project_id,
        column_id: args.column_id,
        title: sanitize(args.title, 500),
        description: sanitize(args.description, 10000),
        priority: args.priority || 'medium',
        assignees: args.assignees || [],
        due_date: args.due_date || null,
        tags: args.tags || [],
        reporter_id: ctx.userId,
        position,
      }

      if (args.ai_agent && VALID_AGENTS.includes(args.ai_agent)) insertPayload.ai_agent = args.ai_agent
      if (args.parent_task_id) insertPayload.parent_task_id = args.parent_task_id

      const { data: task, error } = await supabase.from('tasks').insert(insertPayload).select().single()
      if (error) throw new Error(`Failed to create task: ${error.message}`)
      return textContent(task)
    }

    // ── create_tasks (batch) ──
    case 'create_tasks': {
      requireScope('write')
      if (!args.project_id || !args.column_id || !args.tasks?.length) {
        throw new Error('project_id, column_id, and tasks array are required')
      }
      if (args.tasks.length > 20) throw new Error('Max 20 tasks per batch')

      await verifyProject(supabase, args.project_id, workspaceId)

      // Validate all column_ids used
      const columnIds = new Set<string>([args.column_id])
      for (const t of args.tasks) { if (t.column_id) columnIds.add(t.column_id) }
      for (const colId of columnIds) {
        await verifyColumn(supabase, colId, args.project_id)
      }

      // Get max positions per column
      const positions: Record<string, number> = {}
      for (const colId of columnIds) {
        positions[colId] = await getAppendPosition(supabase, colId)
      }

      const inserts = args.tasks.map((t: any) => {
        const colId = t.column_id || args.column_id
        const pos = positions[colId]++
        return {
          project_id: args.project_id,
          column_id: colId,
          title: sanitize(t.title, 500),
          description: sanitize(t.description, 10000),
          priority: t.priority || 'medium',
          assignees: [],
          tags: t.tags || [],
          reporter_id: ctx.userId,
          position: pos,
          ai_agent: t.ai_agent && VALID_AGENTS.includes(t.ai_agent) ? t.ai_agent : null,
        }
      })

      const { data: tasks, error } = await supabase.from('tasks').insert(inserts).select()
      if (error) throw new Error(`Failed to create tasks: ${error.message}`)
      return textContent({ created: (tasks || []).length, tasks })
    }

    // ── update_task ──
    case 'update_task': {
      requireScope('write')
      if (!args.task_id) throw new Error('task_id is required')
      await verifyTask(supabase, args.task_id, workspaceId)

      const updates: Record<string, any> = {}
      if (args.title !== undefined) updates.title = sanitize(args.title, 500)
      if (args.description !== undefined) updates.description = sanitize(args.description, 10000)
      if (args.priority !== undefined) updates.priority = args.priority
      if (args.assignees !== undefined) updates.assignees = args.assignees
      if (args.due_date !== undefined) updates.due_date = args.due_date
      if (args.tags !== undefined) updates.tags = args.tags
      if (args.ai_agent !== undefined) updates.ai_agent = args.ai_agent === null ? null : (VALID_AGENTS.includes(args.ai_agent) ? args.ai_agent : null)
      updates.updated_at = new Date().toISOString()

      const { data: task, error } = await supabase.from('tasks').update(updates).eq('id', args.task_id).select().single()
      if (error) throw new Error(`Failed to update task: ${error.message}`)
      return textContent(task)
    }

    // ── delete_task ──
    case 'delete_task': {
      requireScope('write')
      if (!args.task_id) throw new Error('task_id is required')
      await verifyTask(supabase, args.task_id, workspaceId)

      const { error } = await supabase.from('tasks').delete().eq('id', args.task_id)
      if (error) throw new Error(`Failed to delete task: ${error.message}`)
      return textContent({ deleted: true, task_id: args.task_id })
    }

    // ── move_task ──
    case 'move_task': {
      requireScope('write')
      if (!args.task_id || !args.column_id) throw new Error('task_id and column_id are required')

      const existing = await verifyTask(supabase, args.task_id, workspaceId)
      await verifyColumn(supabase, args.column_id, existing.project_id)

      const now = new Date().toISOString()
      const position = args.position ?? await getAppendPosition(supabase, args.column_id)

      const { data: task, error } = await supabase
        .from('tasks')
        .update({ column_id: args.column_id, position, column_entered_at: now, updated_at: now })
        .eq('id', args.task_id)
        .select()
        .single()

      if (error) throw new Error(`Failed to move task: ${error.message}`)

      // Record column history
      if (existing.column_id && existing.column_id !== args.column_id) {
        supabase.from('task_column_history').update({ exited_at: now }).eq('task_id', args.task_id).eq('column_id', existing.column_id).is('exited_at', null).then(() => {}, () => {})
        supabase.from('task_column_history').insert({ task_id: args.task_id, column_id: args.column_id, entered_at: now }).then(() => {}, () => {})
      }

      return textContent(task)
    }

    // ── add_comment ──
    case 'add_comment': {
      requireScope('write')
      if (!args.task_id || !args.content) throw new Error('task_id and content are required')
      await verifyTask(supabase, args.task_id, workspaceId)

      const { data: comment, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: args.task_id,
          user_id: ctx.userId,
          content: sanitize(args.content, 5000),
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to add comment: ${error.message}`)
      return textContent(comment)
    }

    // ── manage_checklist ──
    case 'manage_checklist': {
      requireScope('write')
      if (!args.task_id || !args.action) throw new Error('task_id and action are required')
      await verifyTask(supabase, args.task_id, workspaceId)

      if (args.action === 'add') {
        if (!args.text) throw new Error('text is required for "add" action')
        const { data: maxPos } = await supabase
          .from('task_checklist').select('position').eq('task_id', args.task_id).order('position', { ascending: false }).limit(1)
        const pos = maxPos?.[0]?.position != null ? maxPos[0].position + 1 : 0

        const { data: item, error } = await supabase
          .from('task_checklist')
          .insert({ task_id: args.task_id, text: sanitize(args.text, 500), position: pos })
          .select()
          .single()

        if (error) throw new Error(`Failed to add checklist item: ${error.message}`)
        return textContent(item)
      }

      if (args.action === 'toggle') {
        if (!args.item_id) throw new Error('item_id is required for "toggle"')
        const { data: existing } = await supabase.from('task_checklist').select('completed').eq('id', args.item_id).eq('task_id', args.task_id).maybeSingle()
        if (!existing) throw new Error('Checklist item not found')

        const { data: item, error } = await supabase
          .from('task_checklist').update({ completed: !existing.completed }).eq('id', args.item_id).select().single()
        if (error) throw new Error(`Failed to toggle: ${error.message}`)
        return textContent(item)
      }

      if (args.action === 'remove') {
        if (!args.item_id) throw new Error('item_id is required for "remove"')
        const { error } = await supabase.from('task_checklist').delete().eq('id', args.item_id).eq('task_id', args.task_id)
        if (error) throw new Error(`Failed to remove: ${error.message}`)
        return textContent({ removed: true, item_id: args.item_id })
      }

      throw new Error('action must be "add", "toggle", or "remove"')
    }

    // ── create_project ──
    case 'create_project': {
      requireScope('write')
      if (!args.name) throw new Error('name is required')

      // Delegate to the existing workspaces endpoint logic
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          name: sanitize(args.name, 200),
          description: sanitize(args.description, 5000),
          status: 'active',
          priority: args.priority || 'medium',
          owner_id: ctx.userId,
          kanban_template: args.template || 'simple',
          color: args.color || '#0ea5e9',
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to create project: ${error.message}`)

      // Create kanban columns from template
      const TEMPLATES: Record<string, { title: string; color: string; wip_limit?: number }[]> = {
        simple: [
          { title: 'Pendiente', color: '#3B82F6' },
          { title: 'En Progreso', color: '#F59E0B', wip_limit: 5 },
          { title: 'Hecho', color: '#10B981' },
        ],
        kanban: [
          { title: 'Backlog', color: '#6B7280' },
          { title: 'To Do', color: '#3B82F6' },
          { title: 'En Progreso', color: '#F59E0B', wip_limit: 5 },
          { title: 'Revision', color: '#8B5CF6', wip_limit: 3 },
          { title: 'Hecho', color: '#10B981' },
        ],
        dev: [
          { title: 'Backlog', color: '#6B7280' },
          { title: 'Analisis', color: '#8B5CF6' },
          { title: 'Dev', color: '#3B82F6', wip_limit: 5 },
          { title: 'Code Review', color: '#F59E0B', wip_limit: 3 },
          { title: 'QA', color: '#F97316', wip_limit: 3 },
          { title: 'Produccion', color: '#10B981' },
        ],
      }

      const cols = (TEMPLATES[args.template || 'simple'] || TEMPLATES.simple!).map((col, i) => ({
        project_id: project.id,
        title: col.title,
        color: col.color,
        position: i,
        wip_limit: col.wip_limit || null,
      }))

      await supabase.from('kanban_columns').insert(cols)

      return textContent({ ...project, columns: cols.map(c => c.title) })
    }

    // ── delegate_to_agent ──
    case 'delegate_to_agent': {
      requireScope('write')
      if (!args.task_id || !args.agent_type) throw new Error('task_id and agent_type are required')
      if (!VALID_AGENTS.includes(args.agent_type)) throw new Error(`Invalid agent_type. Valid: ${VALID_AGENTS.join(', ')}`)

      const existing = await verifyTask(supabase, args.task_id, workspaceId)

      // Update task with agent assignment
      const { data: task, error } = await supabase
        .from('tasks')
        .update({ ai_agent: args.agent_type, updated_at: new Date().toISOString() })
        .eq('id', args.task_id)
        .select()
        .single()

      if (error) throw new Error(`Failed to delegate: ${error.message}`)

      // Create subtasks if provided
      const createdSubtasks: any[] = []
      if (args.subtasks?.length) {
        const maxSubtasks = Math.min(args.subtasks.length, 15)
        for (let i = 0; i < maxSubtasks; i++) {
          const st = args.subtasks[i]
          const { data: subtask } = await supabase
            .from('tasks')
            .insert({
              project_id: existing.project_id,
              column_id: existing.column_id,
              parent_task_id: args.task_id,
              title: sanitize(st.title, 500),
              description: sanitize(st.description, 10000),
              priority: st.priority || task.priority || 'medium',
              assignees: [],
              tags: [],
              reporter_id: ctx.userId,
              position: i,
              ai_agent: args.agent_type,
            })
            .select()
            .single()

          if (subtask) createdSubtasks.push(subtask)
        }
      }

      // Record orchestrator run
      await supabase.from('ai_orchestrator_runs').insert({
        workspace_id: workspaceId,
        project_id: existing.project_id,
        triggered_by: ctx.userId,
        source_task_id: args.task_id,
        prompt: `Delegate to ${args.agent_type}: ${task.title}`,
        agent_type: args.agent_type,
        status: 'completed',
        result: { task_id: task.id, subtasks_created: createdSubtasks.length },
        tasks_created: createdSubtasks.map((s: any) => s.id),
        completed_at: new Date().toISOString(),
      }).then(() => {}, () => {})

      return textContent({
        task,
        agent: args.agent_type,
        subtasks_created: createdSubtasks.length,
        subtasks: createdSubtasks,
      })
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
