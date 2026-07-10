import { serverSupabaseServiceRole } from '#supabase/server'
import { authenticateApiToken } from '~~/server/utils/apiTokens'
import { KANBAN_TEMPLATES } from '~~/server/utils/kanbanTemplates'
import { AGENT_REGISTRY, VALID_AGENT_TYPES, agentRegistryPrompt, callAgentAI, extractAgentJSON } from '~~/server/utils/agentAI'
import { recordTokenUsage, isTokenLimitExceeded } from '~~/server/utils/tokens'
import { storeMemory } from '~~/server/utils/embeddings'

/**
 * FocusFlow MCP Server — JSON-RPC 2.0 over HTTP
 *
 * Connect from Cursor/Claude using:
 *   URL: https://your-domain.com/api/mcp
 *   Header: Authorization: Bearer ff_<token>
 *
 * v3: agent orchestration suite — auto_plan, auto_orchestrate, improve_task,
 * generate_test_plan, qa_review, launch_audit (security/seo/quality),
 * agent_message (A2A), record_decision, project lifecycle management,
 * and member/agent specialty profiles.
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

const SERVER_INFO = { name: 'FocusFlow by Fidubit', version: '3.0.0' }

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
        ai_agent: { type: 'string', description: 'Delegate to AI agent: backend, frontend, qa, devops, designer, copywriter, content_creator, data, security, seo, planner, reviewer, orchestrator (see list_agents)' },
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
        template: { type: 'string', description: 'Kanban template: deep_work, simple, kanban, dev, devops, scrum, scrumban, marketing, ai_agents, support, audio, creative, backend_senior_dev, frontend_design, frontend_dev, backend_dev, app_development. Default: simple' },
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
        agent_type: { type: 'string', description: 'Agent: backend, frontend, qa, devops, designer, copywriter, content_creator, data, security, seo, planner, reviewer, orchestrator (see list_agents for specialties)' },
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
  // ── Agent & member profiles ──
  {
    name: 'list_agents',
    description: 'List all available AI agents with their role and specialty, plus workspace members with their configured specialty profiles. Use this to decide who should get each task.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'set_member_profile',
    description: 'Set the role title, specialty and skills of a workspace member. Profiles are used by auto_plan and auto_orchestrate to assign tasks to the right person.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'Member user UUID (get from list_members)' },
        role_title: { type: 'string', description: 'e.g. "Senior Backend Dev", "Diseñadora UX"' },
        specialty: { type: 'string', description: 'Main specialty description (max 300 chars)' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Skill tags, e.g. ["vue", "supabase", "figma"]' },
      },
      required: ['user_id', 'specialty'],
    },
  },
  // ── Project lifecycle ──
  {
    name: 'update_project',
    description: 'Update project fields: name, description, status (planning|active|review|completed|paused), priority, color, archived. Only provided fields change.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', description: 'planning, active, review, completed, paused' },
        priority: { type: 'string', description: 'low, medium, high' },
        color: { type: 'string', description: 'Hex color' },
        archived: { type: 'boolean', description: 'Archive (true) or restore (false) the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'complete_project',
    description: 'Mark a project as completed. Optionally archive it. Returns a completion summary with task stats.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        archive: { type: 'boolean', description: 'Also archive the project (default false)' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'assign_project',
    description: 'Assign a project to a workspace member as owner/responsible.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        owner_id: { type: 'string', description: 'User UUID of the new owner (get from list_members)' },
      },
      required: ['project_id', 'owner_id'],
    },
  },
  // ── AI agent tools ──
  {
    name: 'auto_plan',
    description: 'AUTOPLAN: the planner agent decomposes a goal into concrete tasks and creates them on the board, auto-assigning each one to the best AI agent and/or human member based on specialties. Returns created tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        goal: { type: 'string', description: 'The objective to plan, e.g. "Launch landing page with waitlist"' },
        column_id: { type: 'string', description: 'Column for new tasks (default: first column)' },
        max_tasks: { type: 'number', description: 'Max tasks to create (default 8, max 15)' },
        assign: { type: 'boolean', description: 'Auto-assign agents/members by specialty (default true)' },
      },
      required: ['project_id', 'goal'],
    },
  },
  {
    name: 'auto_orchestrate',
    description: 'AUTO ORCHESTRATION: the orchestrator agent reviews unassigned tasks in a project and assigns each one to the best AI agent and/or member based on specialties. Optionally rebalances columns. Returns the assignment report.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        max_tasks: { type: 'number', description: 'Max tasks to process (default 20, max 30)' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'improve_task',
    description: 'IMPROVEMENT: the reviewer agent rewrites a task with a clearer title, structured description and acceptance criteria (added as checklist items). Updates the task in place.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        instructions: { type: 'string', description: 'Optional focus, e.g. "make it technical" or "add edge cases"' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'generate_test_plan',
    description: 'TESTING: the QA agent generates a test plan for a task and adds the test cases as checklist items (prefixed 🧪). Returns the test plan.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        max_cases: { type: 'number', description: 'Max test cases (default 8, max 15)' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'qa_review',
    description: 'QA REVIEW: the QA agent reviews a task (description, checklist progress, comments) and posts a verdict comment: approved or needs_work with issues found. Optionally moves the task to a column when approved.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        criteria: { type: 'string', description: 'Optional extra acceptance criteria to check against' },
        move_on_pass: { type: 'string', description: 'Column UUID to move the task to if approved' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'launch_audit',
    description: 'SPECIALIST AUDIT: launch a security, SEO or quality audit. The specialist agent (security/seo/qa) generates a full audit checklist for the target and creates an audit task with all checks ready to execute.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID where the audit task is created' },
        audit_type: { type: 'string', description: '"security", "seo", or "quality"' },
        target: { type: 'string', description: 'What to audit: URL, feature, repo area, or description of scope' },
        column_id: { type: 'string', description: 'Column for the audit task (default: first column)' },
      },
      required: ['project_id', 'audit_type', 'target'],
    },
  },
  // ── Agent communication & decisions ──
  {
    name: 'agent_message',
    description: 'AGENT-TO-AGENT COMMUNICATION: post a message from one agent to another on a task thread. Messages are stored as [A2A] comments so any agent can read them with list_agent_messages.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID (the conversation thread)' },
        from_agent: { type: 'string', description: 'Sender agent type, e.g. "backend"' },
        to_agent: { type: 'string', description: 'Recipient agent type, e.g. "qa"' },
        message: { type: 'string', description: 'Message content (max 4000 chars)' },
      },
      required: ['task_id', 'from_agent', 'to_agent', 'message'],
    },
  },
  {
    name: 'list_agent_messages',
    description: 'Read agent-to-agent [A2A] messages. Filter by task or by recipient agent to build an agent inbox.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Filter by task UUID' },
        agent: { type: 'string', description: 'Filter messages addressed TO this agent type' },
        limit: { type: 'number', description: 'Max messages (default 30, max 100)' },
      },
      required: [],
    },
  },
  {
    name: 'record_decision',
    description: 'DECISIONS: record a decision with its rationale. Stored in workspace memory (searchable) and optionally posted as a [Decisión] comment on a task.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short decision title' },
        decision: { type: 'string', description: 'What was decided' },
        rationale: { type: 'string', description: 'Why it was decided' },
        project_id: { type: 'string', description: 'Related project UUID' },
        task_id: { type: 'string', description: 'If provided, also posts a comment on this task' },
        decided_by: { type: 'string', description: 'Agent type or member name who decided' },
      },
      required: ['title', 'decision'],
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

  const VALID_AGENTS = VALID_AGENT_TYPES

  /** Check workspace token budget, run the AI call, record usage. */
  async function runAgentAI(action: string, system: string, user: string, maxTokens = 4096) {
    const overLimit = await isTokenLimitExceeded({ supabase, workspaceId })
    if (overLimit) throw new Error('Token limit exceeded for this workspace')
    const res = await callAgentAI({ system, user, maxTokens })
    if (res.usage) {
      recordTokenUsage({ supabase, userId: ctx.userId, workspaceId, action, model: res.model, usage: res.usage }).catch(() => {})
    }
    return res
  }

  /** Load member specialty profiles from workspace.ai_config.member_profiles */
  async function getMemberProfiles(): Promise<Record<string, any>> {
    const { data: ws } = await supabase.from('workspaces').select('ai_config').eq('id', workspaceId).maybeSingle()
    return ((ws?.ai_config as any)?.member_profiles) || {}
  }

  /** Compact roster of members + profiles for AI prompts */
  async function getMemberRoster(): Promise<Array<{ id: string; name: string; role: string; specialty?: string; skills?: string[] }>> {
    const [{ data: members }, profiles] = await Promise.all([
      supabase.from('workspace_members').select('user_id, role').eq('workspace_id', workspaceId),
      getMemberProfiles(),
    ])
    const roster = []
    for (const m of (members || [])) {
      let name = ''
      try {
        const { data: profile } = await supabase.auth.admin.getUserById(m.user_id)
        name = profile?.user?.user_metadata?.full_name || profile?.user?.email || ''
      } catch {}
      const p = profiles[m.user_id] || {}
      roster.push({ id: m.user_id, name, role: p.role_title || m.role, specialty: p.specialty, skills: p.skills })
    }
    return roster
  }

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
      if (args.search) {
        const safeSearch = String(args.search).replace(/[%_]/g, '').slice(0, 200)
        query = query.ilike('title', `%${safeSearch}%`)
      }

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

      if (args.query) {
        // Sanitize query to prevent filter injection
        const safeQuery = String(args.query).replace(/[%,()]/g, '').slice(0, 200)
        query = query.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
      }
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

      // Create kanban columns from the shared template registry
      const cols = (KANBAN_TEMPLATES[args.template || 'simple'] || KANBAN_TEMPLATES.simple!).map((col, i) => ({
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

    // ── list_agents ──
    case 'list_agents': {
      requireScope('read')
      const roster = await getMemberRoster()
      return textContent({
        ai_agents: AGENT_REGISTRY.filter(a => a.type !== 'custom'),
        members: roster,
        hint: 'Use ai_agent for AI delegation and assignees[] for human members. auto_plan / auto_orchestrate use these specialties automatically.',
      })
    }

    // ── set_member_profile ──
    case 'set_member_profile': {
      requireScope('write')
      if (!args.user_id || !args.specialty) throw new Error('user_id and specialty are required')

      const { data: member } = await supabase
        .from('workspace_members').select('user_id').eq('workspace_id', workspaceId).eq('user_id', args.user_id).maybeSingle()
      if (!member) throw new Error('User is not a member of this workspace')

      const { data: ws } = await supabase.from('workspaces').select('ai_config').eq('id', workspaceId).maybeSingle()
      const config = (ws?.ai_config as any) || {}
      const profiles = config.member_profiles || {}
      profiles[args.user_id] = {
        role_title: sanitize(args.role_title, 100) || profiles[args.user_id]?.role_title || null,
        specialty: sanitize(args.specialty, 300),
        skills: Array.isArray(args.skills) ? args.skills.slice(0, 20).map((s: any) => String(s).slice(0, 40)) : (profiles[args.user_id]?.skills || []),
      }

      const { error } = await supabase
        .from('workspaces')
        .update({ ai_config: { ...config, member_profiles: profiles }, updated_at: new Date().toISOString() })
        .eq('id', workspaceId)
      if (error) throw new Error(`Failed to save profile: ${error.message}`)

      return textContent({ user_id: args.user_id, profile: profiles[args.user_id] })
    }

    // ── update_project ──
    case 'update_project': {
      requireScope('write')
      if (!args.project_id) throw new Error('project_id is required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const VALID_STATUS = ['planning', 'active', 'review', 'completed', 'paused']
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (args.name !== undefined) updates.name = sanitize(args.name, 200)
      if (args.description !== undefined) updates.description = sanitize(args.description, 5000)
      if (args.status !== undefined) {
        if (!VALID_STATUS.includes(args.status)) throw new Error(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`)
        updates.status = args.status
      }
      if (args.priority !== undefined) updates.priority = args.priority
      if (args.color !== undefined) updates.color = sanitize(args.color, 20)
      if (args.archived !== undefined) updates.archived = !!args.archived

      const { data: project, error } = await supabase
        .from('projects').update(updates).eq('id', args.project_id).select().single()
      if (error) throw new Error(`Failed to update project: ${error.message}`)
      return textContent(project)
    }

    // ── complete_project ──
    case 'complete_project': {
      requireScope('write')
      if (!args.project_id) throw new Error('project_id is required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const updates: Record<string, any> = { status: 'completed', updated_at: new Date().toISOString() }
      if (args.archive) updates.archived = true

      const { data: project, error } = await supabase
        .from('projects').update(updates).eq('id', args.project_id).select().single()
      if (error) throw new Error(`Failed to complete project: ${error.message}`)

      // Completion stats
      const { data: tasks } = await supabase
        .from('tasks').select('id, column_id').eq('project_id', args.project_id)
      const { data: columns } = await supabase
        .from('kanban_columns').select('id, title').eq('project_id', args.project_id).order('position')
      const lastColumn = columns?.[columns.length - 1]
      const doneCount = lastColumn ? (tasks || []).filter((t: any) => t.column_id === lastColumn.id).length : 0

      return textContent({
        project,
        summary: {
          total_tasks: (tasks || []).length,
          in_final_column: doneCount,
          archived: !!args.archive,
        },
      })
    }

    // ── assign_project ──
    case 'assign_project': {
      requireScope('write')
      if (!args.project_id || !args.owner_id) throw new Error('project_id and owner_id are required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const { data: member } = await supabase
        .from('workspace_members').select('user_id').eq('workspace_id', workspaceId).eq('user_id', args.owner_id).maybeSingle()
      if (!member) throw new Error('owner_id is not a member of this workspace')

      const { data: project, error } = await supabase
        .from('projects')
        .update({ owner_id: args.owner_id, updated_at: new Date().toISOString() })
        .eq('id', args.project_id)
        .select()
        .single()
      if (error) throw new Error(`Failed to assign project: ${error.message}`)
      return textContent(project)
    }

    // ── auto_plan ──
    case 'auto_plan': {
      requireScope('write')
      if (!args.project_id || !args.goal) throw new Error('project_id and goal are required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const maxTasks = Math.min(args.max_tasks || 8, 15)
      const assign = args.assign !== false

      const { data: columns } = await supabase
        .from('kanban_columns').select('id, title, position').eq('project_id', args.project_id).order('position')
      if (!columns?.length) throw new Error('Project has no columns')
      const targetColumn = args.column_id
        ? columns.find((c: any) => c.id === args.column_id)
        : columns[0]
      if (!targetColumn) throw new Error('Column not found in this project')

      const roster = assign ? await getMemberRoster() : []
      const rosterText = roster
        .map(m => `- id:${m.id} | ${m.name || 'sin nombre'} | rol: ${m.role}${m.specialty ? ` | especialidad: ${m.specialty}` : ''}${m.skills?.length ? ` | skills: ${m.skills.join(', ')}` : ''}`)
        .join('\n') || '(sin miembros con perfil)'

      const system = `Eres el agente PLANNER de FocusFlow. Descompones objetivos en tareas concretas y accionables.
Agentes AI disponibles (campo ai_agent):
${agentRegistryPrompt()}
Miembros humanos (campo assignee_id, usa el id exacto):
${rosterText}
Responde SOLO JSON: {"tasks":[{"title":"...","description":"...","priority":"low|medium|high|critical","ai_agent":"tipo o null","assignee_id":"uuid o null","tags":["..."]}]}
Máximo ${maxTasks} tareas. Asigna ai_agent y/o assignee_id según la especialidad más adecuada${assign ? '' : ' (deja ambos en null)'}. Títulos en el idioma del objetivo.`

      const ai = await runAgentAI('mcp_auto_plan', system, `Objetivo: ${sanitize(args.goal, 2000)}`, 8192)
      const parsed = extractAgentJSON(ai.content)
      if (!parsed?.tasks?.length) throw new Error('Planner returned no tasks — try a more specific goal')

      const validAssignees = new Set(roster.map(m => m.id))
      let position = await getAppendPosition(supabase, targetColumn.id)
      const inserts = parsed.tasks.slice(0, maxTasks).map((t: any) => ({
        project_id: args.project_id,
        column_id: targetColumn.id,
        title: sanitize(t.title, 500),
        description: sanitize(t.description, 10000),
        priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium',
        assignees: assign && t.assignee_id && validAssignees.has(t.assignee_id) ? [t.assignee_id] : [],
        tags: Array.isArray(t.tags) ? t.tags.slice(0, 8) : [],
        ai_agent: assign && t.ai_agent && VALID_AGENTS.includes(t.ai_agent) ? t.ai_agent : null,
        reporter_id: ctx.userId,
        position: position++,
      }))

      const { data: created, error } = await supabase.from('tasks').insert(inserts).select()
      if (error) throw new Error(`Failed to create planned tasks: ${error.message}`)

      supabase.from('ai_orchestrator_runs').insert({
        workspace_id: workspaceId,
        project_id: args.project_id,
        triggered_by: ctx.userId,
        prompt: `auto_plan: ${args.goal}`,
        agent_type: 'planner',
        status: 'completed',
        result: { tasks_created: (created || []).length, model: ai.model },
        tasks_created: (created || []).map((t: any) => t.id),
        completed_at: new Date().toISOString(),
      }).then(() => {}, () => {})

      return textContent({
        goal: args.goal,
        column: targetColumn.title,
        tasks_created: (created || []).length,
        tasks: created,
      })
    }

    // ── auto_orchestrate ──
    case 'auto_orchestrate': {
      requireScope('write')
      if (!args.project_id) throw new Error('project_id is required')
      await verifyProject(supabase, args.project_id, workspaceId)

      const maxTasks = Math.min(args.max_tasks || 20, 30)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, priority, tags, ai_agent, assignees, column_id')
        .eq('project_id', args.project_id)
        .is('parent_task_id', null)
        .is('ai_agent', null)
        .order('position')
        .limit(maxTasks * 2)

      const unassigned = (tasks || []).filter((t: any) => !t.assignees?.length).slice(0, maxTasks)
      if (!unassigned.length) return textContent({ message: 'No unassigned tasks found', assigned: 0 })

      const roster = await getMemberRoster()
      const rosterText = roster
        .map(m => `- id:${m.id} | ${m.name || 'sin nombre'} | rol: ${m.role}${m.specialty ? ` | especialidad: ${m.specialty}` : ''}`)
        .join('\n') || '(sin miembros)'
      const tasksText = unassigned
        .map((t: any) => `- id:${t.id} | ${t.title} | prioridad:${t.priority}${t.tags?.length ? ` | tags:${t.tags.join(',')}` : ''}${t.description ? ` | ${String(t.description).slice(0, 150)}` : ''}`)
        .join('\n')

      const system = `Eres el agente ORCHESTRATOR de FocusFlow. Asignas cada tarea al agente AI y/o miembro humano más adecuado según especialidades.
Agentes AI (ai_agent):
${agentRegistryPrompt()}
Miembros (assignee_id, id exacto):
${rosterText}
Responde SOLO JSON: {"assignments":[{"task_id":"uuid","ai_agent":"tipo o null","assignee_id":"uuid o null","reason":"breve"}]}`

      const ai = await runAgentAI('mcp_auto_orchestrate', system, `Tareas sin asignar:\n${tasksText}`, 6144)
      const parsed = extractAgentJSON(ai.content)
      if (!parsed?.assignments?.length) throw new Error('Orchestrator returned no assignments')

      const validAssignees = new Set(roster.map(m => m.id))
      const taskIds = new Set(unassigned.map((t: any) => t.id))
      const report: any[] = []

      for (const a of parsed.assignments) {
        if (!taskIds.has(a.task_id)) continue
        const updates: Record<string, any> = { updated_at: new Date().toISOString() }
        if (a.ai_agent && VALID_AGENTS.includes(a.ai_agent)) updates.ai_agent = a.ai_agent
        if (a.assignee_id && validAssignees.has(a.assignee_id)) updates.assignees = [a.assignee_id]
        if (!updates.ai_agent && !updates.assignees) continue
        const { error } = await supabase.from('tasks').update(updates).eq('id', a.task_id)
        if (!error) report.push({ task_id: a.task_id, ai_agent: updates.ai_agent || null, assignee_id: a.assignee_id || null, reason: String(a.reason || '').slice(0, 200) })
      }

      supabase.from('ai_orchestrator_runs').insert({
        workspace_id: workspaceId,
        project_id: args.project_id,
        triggered_by: ctx.userId,
        prompt: `auto_orchestrate: ${unassigned.length} tasks`,
        agent_type: 'orchestrator',
        status: 'completed',
        result: { assigned: report.length, model: ai.model },
        completed_at: new Date().toISOString(),
      }).then(() => {}, () => {})

      return textContent({ analyzed: unassigned.length, assigned: report.length, assignments: report })
    }

    // ── improve_task ──
    case 'improve_task': {
      requireScope('write')
      if (!args.task_id) throw new Error('task_id is required')
      const existing = await verifyTask(supabase, args.task_id, workspaceId, ', title, description, priority')

      const system = `Eres el agente REVIEWER de FocusFlow. Mejoras tareas para que sean claras, accionables y verificables.
Responde SOLO JSON: {"title":"título mejorado","description":"descripción markdown estructurada (contexto, alcance, notas técnicas)","acceptance_criteria":["criterio verificable", "..."]}
Máximo 6 criterios. Mantén el idioma original de la tarea.`
      const user = `Tarea actual:\nTítulo: ${existing.title}\nDescripción: ${existing.description || '(vacía)'}${args.instructions ? `\nInstrucciones extra: ${sanitize(args.instructions, 500)}` : ''}`

      const ai = await runAgentAI('mcp_improve_task', system, user, 4096)
      const parsed = extractAgentJSON(ai.content)
      if (!parsed?.title) throw new Error('Reviewer returned invalid result')

      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          title: sanitize(parsed.title, 500),
          description: sanitize(parsed.description, 10000),
          updated_at: new Date().toISOString(),
        })
        .eq('id', args.task_id)
        .select()
        .single()
      if (error) throw new Error(`Failed to update task: ${error.message}`)

      // Acceptance criteria → checklist
      const criteria = Array.isArray(parsed.acceptance_criteria) ? parsed.acceptance_criteria.slice(0, 6) : []
      if (criteria.length) {
        const { data: maxPos } = await supabase
          .from('task_checklist').select('position').eq('task_id', args.task_id).order('position', { ascending: false }).limit(1)
        let pos = maxPos?.[0]?.position != null ? maxPos[0].position + 1 : 0
        await supabase.from('task_checklist').insert(
          criteria.map((c: any) => ({ task_id: args.task_id, text: sanitize(`✅ ${c}`, 500), position: pos++ }))
        )
      }

      return textContent({ task, acceptance_criteria_added: criteria.length, improved_by: 'reviewer', model: ai.model })
    }

    // ── generate_test_plan ──
    case 'generate_test_plan': {
      requireScope('write')
      if (!args.task_id) throw new Error('task_id is required')
      const existing = await verifyTask(supabase, args.task_id, workspaceId, ', title, description')

      const maxCases = Math.min(args.max_cases || 8, 15)
      const system = `Eres el agente QA de FocusFlow. Generas planes de prueba concretos y ejecutables.
Responde SOLO JSON: {"summary":"resumen del plan","test_cases":[{"text":"caso de prueba con pasos y resultado esperado"}]}
Máximo ${maxCases} casos. Incluye happy path, edge cases y errores. Idioma de la tarea.`
      const user = `Tarea a probar:\nTítulo: ${existing.title}\nDescripción: ${existing.description || '(vacía)'}`

      const ai = await runAgentAI('mcp_generate_test_plan', system, user, 4096)
      const parsed = extractAgentJSON(ai.content)
      if (!parsed?.test_cases?.length) throw new Error('QA agent returned no test cases')

      const { data: maxPos } = await supabase
        .from('task_checklist').select('position').eq('task_id', args.task_id).order('position', { ascending: false }).limit(1)
      let pos = maxPos?.[0]?.position != null ? maxPos[0].position + 1 : 0
      const cases = parsed.test_cases.slice(0, maxCases)
      await supabase.from('task_checklist').insert(
        cases.map((c: any) => ({ task_id: args.task_id, text: sanitize(`🧪 ${c.text || c}`, 500), position: pos++ }))
      )

      await supabase.from('task_comments').insert({
        task_id: args.task_id,
        user_id: ctx.userId,
        content: sanitize(`🧪 **Plan de pruebas generado por el agente QA**\n\n${parsed.summary || ''}\n\n${cases.length} casos añadidos al checklist.`, 5000),
      })

      return textContent({ summary: parsed.summary, test_cases_added: cases.length, test_cases: cases, model: ai.model })
    }

    // ── qa_review ──
    case 'qa_review': {
      requireScope('write')
      if (!args.task_id) throw new Error('task_id is required')
      const existing = await verifyTask(supabase, args.task_id, workspaceId, ', title, description, priority')

      const [{ data: checklist }, { data: comments }] = await Promise.all([
        supabase.from('task_checklist').select('text, completed').eq('task_id', args.task_id).order('position'),
        supabase.from('task_comments').select('content, created_at').eq('task_id', args.task_id).order('created_at', { ascending: false }).limit(10),
      ])

      const checklistText = (checklist || []).map((c: any) => `[${c.completed ? 'x' : ' '}] ${c.text}`).join('\n') || '(sin checklist)'
      const commentsText = (comments || []).map((c: any) => `- ${String(c.content).slice(0, 200)}`).join('\n') || '(sin comentarios)'

      const system = `Eres el agente QA REVIEWER de FocusFlow. Revisas si una tarea está lista para aprobarse.
Responde SOLO JSON: {"verdict":"approved|needs_work","score":0-100,"issues":["problema encontrado"],"summary":"veredicto en 2-3 frases"}
Sé estricto: si hay checklist incompleto o criterios sin verificar, es needs_work.`
      const user = `Tarea: ${existing.title}\nDescripción: ${existing.description || '(vacía)'}\n\nChecklist:\n${checklistText}\n\nÚltimos comentarios:\n${commentsText}${args.criteria ? `\n\nCriterios extra a verificar: ${sanitize(args.criteria, 1000)}` : ''}`

      const ai = await runAgentAI('mcp_qa_review', system, user, 3072)
      const parsed = extractAgentJSON(ai.content)
      if (!parsed?.verdict) throw new Error('QA reviewer returned invalid result')

      const approved = parsed.verdict === 'approved'
      const issuesList = Array.isArray(parsed.issues) ? parsed.issues.slice(0, 10) : []
      const commentBody = [
        `${approved ? '✅' : '⚠️'} **QA Review — ${approved ? 'APROBADA' : 'NECESITA TRABAJO'}** (score: ${parsed.score ?? '—'}/100)`,
        '',
        parsed.summary || '',
        issuesList.length ? `\n**Problemas:**\n${issuesList.map((i: any) => `- ${i}`).join('\n')}` : '',
      ].join('\n')

      await supabase.from('task_comments').insert({
        task_id: args.task_id,
        user_id: ctx.userId,
        content: sanitize(commentBody, 5000),
      })

      // Move on pass
      let moved = false
      if (approved && args.move_on_pass) {
        try {
          await verifyColumn(supabase, args.move_on_pass, existing.project_id)
          const now = new Date().toISOString()
          const position = await getAppendPosition(supabase, args.move_on_pass)
          await supabase.from('tasks').update({ column_id: args.move_on_pass, position, column_entered_at: now, updated_at: now }).eq('id', args.task_id)
          moved = true
        } catch { /* column invalid — skip move */ }
      }

      return textContent({ verdict: parsed.verdict, score: parsed.score, issues: issuesList, summary: parsed.summary, moved, model: ai.model })
    }

    // ── launch_audit ──
    case 'launch_audit': {
      requireScope('write')
      if (!args.project_id || !args.audit_type || !args.target) {
        throw new Error('project_id, audit_type, and target are required')
      }
      const AUDIT_AGENTS: Record<string, { agent: string; emoji: string; label: string; focus: string }> = {
        security: { agent: 'security', emoji: '🔐', label: 'Auditoría de Seguridad', focus: 'OWASP Top 10, auth, RLS/permisos, secretos expuestos, inyección, CORS, rate limiting, datos sensibles' },
        seo: { agent: 'seo', emoji: '🔎', label: 'Auditoría SEO', focus: 'meta tags, estructura de headings, Core Web Vitals, sitemap/robots, contenido, schema markup, enlaces internos, mobile' },
        quality: { agent: 'qa', emoji: '⭐', label: 'Revisión de Calidad', focus: 'funcionalidad, UX, accesibilidad, rendimiento, manejo de errores, consistencia visual, i18n, responsive' },
      }
      const auditConfig = AUDIT_AGENTS[args.audit_type]
      if (!auditConfig) throw new Error('audit_type must be "security", "seo", or "quality"')

      await verifyProject(supabase, args.project_id, workspaceId)
      const { data: columns } = await supabase
        .from('kanban_columns').select('id, title, position').eq('project_id', args.project_id).order('position')
      if (!columns?.length) throw new Error('Project has no columns')
      const targetColumn = args.column_id ? columns.find((c: any) => c.id === args.column_id) : columns[0]
      if (!targetColumn) throw new Error('Column not found in this project')

      const system = `Eres el agente especialista ${auditConfig.agent.toUpperCase()} de FocusFlow. Diseñas auditorías ejecutables.
Áreas a cubrir: ${auditConfig.focus}.
Responde SOLO JSON: {"title":"título de la auditoría","description":"alcance y metodología en markdown","checks":[{"text":"verificación concreta y accionable"}]}
Entre 8 y 15 checks, ordenados por criticidad. Idioma del target.`

      const ai = await runAgentAI(`mcp_audit_${args.audit_type}`, system, `Target a auditar: ${sanitize(args.target, 2000)}`, 6144)
      const parsed = extractAgentJSON(ai.content)
      if (!parsed?.checks?.length) throw new Error('Audit agent returned no checks')

      const position = await getAppendPosition(supabase, targetColumn.id)
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          project_id: args.project_id,
          column_id: targetColumn.id,
          title: sanitize(`${auditConfig.emoji} ${parsed.title || `${auditConfig.label}: ${args.target}`}`, 500),
          description: sanitize(parsed.description, 10000),
          priority: args.audit_type === 'security' ? 'critical' : 'high',
          assignees: [],
          tags: ['audit', args.audit_type],
          ai_agent: auditConfig.agent,
          reporter_id: ctx.userId,
          position,
        })
        .select()
        .single()
      if (error) throw new Error(`Failed to create audit task: ${error.message}`)

      const checks = parsed.checks.slice(0, 15)
      await supabase.from('task_checklist').insert(
        checks.map((c: any, i: number) => ({ task_id: task.id, text: sanitize(String(c.text || c), 500), position: i }))
      )

      return textContent({
        audit_type: args.audit_type,
        agent: auditConfig.agent,
        task,
        checks_created: checks.length,
        checks: checks.map((c: any) => c.text || c),
        model: ai.model,
      })
    }

    // ── agent_message ──
    case 'agent_message': {
      requireScope('write')
      if (!args.task_id || !args.from_agent || !args.to_agent || !args.message) {
        throw new Error('task_id, from_agent, to_agent, and message are required')
      }
      await verifyTask(supabase, args.task_id, workspaceId)

      const from = sanitize(args.from_agent, 40)
      const to = sanitize(args.to_agent, 40)
      const { data: comment, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: args.task_id,
          user_id: ctx.userId,
          content: sanitize(`[A2A] ${from} → ${to}: ${args.message}`, 5000),
        })
        .select()
        .single()
      if (error) throw new Error(`Failed to send message: ${error.message}`)
      return textContent({ sent: true, from, to, comment })
    }

    // ── list_agent_messages ──
    case 'list_agent_messages': {
      requireScope('read')
      const limit = Math.min(args.limit || 30, 100)

      let comments: any[] = []
      if (args.task_id) {
        await verifyTask(supabase, args.task_id, workspaceId)
        const { data } = await supabase
          .from('task_comments')
          .select('id, task_id, content, created_at')
          .eq('task_id', args.task_id)
          .ilike('content', '[A2A]%')
          .order('created_at', { ascending: false })
          .limit(limit)
        comments = data || []
      } else {
        // Workspace-wide agent inbox
        const { data: projects } = await supabase
          .from('projects').select('id').eq('workspace_id', workspaceId).eq('archived', false)
        const pIds = (projects || []).map((p: any) => p.id)
        if (!pIds.length) return textContent([])
        const { data: tasks } = await supabase
          .from('tasks').select('id').in('project_id', pIds).limit(500)
        const tIds = (tasks || []).map((t: any) => t.id)
        if (!tIds.length) return textContent([])
        const { data } = await supabase
          .from('task_comments')
          .select('id, task_id, content, created_at')
          .in('task_id', tIds)
          .ilike('content', '[A2A]%')
          .order('created_at', { ascending: false })
          .limit(limit)
        comments = data || []
      }

      // Parse into structured messages, optionally filter by recipient
      const messages = comments
        .map((c: any) => {
          const match = String(c.content).match(/^\[A2A\]\s*([\w-]+)\s*→\s*([\w-]+):\s*([\s\S]*)$/)
          return match
            ? { id: c.id, task_id: c.task_id, from: match[1], to: match[2], message: match[3], created_at: c.created_at }
            : null
        })
        .filter(Boolean)
        .filter((m: any) => !args.agent || m.to === args.agent)

      return textContent(messages)
    }

    // ── record_decision ──
    case 'record_decision': {
      requireScope('write')
      if (!args.title || !args.decision) throw new Error('title and decision are required')

      const decidedBy = sanitize(args.decided_by, 60) || 'orchestrator'
      const body = [
        `📌 **Decisión: ${sanitize(args.title, 200)}**`,
        '',
        sanitize(args.decision, 3000),
        args.rationale ? `\n**Razón:** ${sanitize(args.rationale, 2000)}` : '',
        `\n_Decidido por: ${decidedBy}_`,
      ].join('\n')

      // Optional task comment
      let commentId: string | null = null
      if (args.task_id) {
        await verifyTask(supabase, args.task_id, workspaceId)
        const { data: comment } = await supabase
          .from('task_comments')
          .insert({ task_id: args.task_id, user_id: ctx.userId, content: sanitize(body, 5000) })
          .select('id')
          .single()
        commentId = comment?.id || null
      }

      // Validate project if provided
      if (args.project_id) await verifyProject(supabase, args.project_id, workspaceId)

      // Searchable workspace memory (fire-and-forget)
      storeMemory({
        supabase,
        workspaceId,
        contentText: `Decisión: ${args.title}. ${args.decision}${args.rationale ? ` Razón: ${args.rationale}` : ''}`,
        agentType: 'orchestrator',
        contentType: 'decision',
        projectId: args.project_id || null,
        metadata: { decided_by: decidedBy, task_id: args.task_id || null },
        createdBy: ctx.userId,
      }).catch(() => {})

      return textContent({ recorded: true, title: args.title, decided_by: decidedBy, comment_id: commentId })
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
