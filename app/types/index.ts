export type UserRole = 'superadmin' | 'owner' | 'admin' | 'member' | 'viewer'
export type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'paused'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type KanbanTemplate = 'simple' | 'kanban' | 'dev' | 'devops' | 'support' | 'scrum' | 'scrumban' | 'custom'

export interface Workspace {
  id: string
  name: string
  slug: string
  custom_domain?: string
  plan: string
  owner_id: string
  logo_url?: string
  color: string
  ai_enabled: boolean
  ai_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description?: string
  status: ProjectStatus
  priority: Priority
  category?: string
  owner_id?: string
  start_date?: string
  end_date?: string
  budget?: number
  currency: string
  color: string
  archived: boolean
  kanban_template: KanbanTemplate
  created_at: string
  updated_at: string
}

export interface KanbanColumn {
  id: string
  project_id: string
  title: string
  color: string
  icon?: string
  position: number
  wip_limit?: number
  automations: unknown[]
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  column_id?: string
  parent_task_id?: string
  title: string
  description?: string
  priority: Priority
  assignees: string[]
  reporter_id?: string
  due_date?: string
  estimated_hours?: number
  tracked_hours: number
  position: number
  tags: string[]
  column_entered_at: string
  ai_suggested_priority?: string
  ai_decomposed: boolean
  ai_quick_task: boolean
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface TaskChecklist {
  id: string
  task_id: string
  text: string
  completed: boolean
  position: number
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  edited_at?: string
  created_at: string
}

export interface Label {
  id: string
  workspace_id: string
  name: string
  color: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string
  entity_type?: string
  entity_id?: string
  read: boolean
  created_at: string
}

export interface WorkspaceFile {
  id: string
  workspace_id: string
  project_id?: string
  uploaded_by?: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  folder: string
  source: 'upload' | 'ai_generated' | 'export'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  workspace_id: string
  project_id?: string
  author_id?: string
  title: string
  summary?: string
  content: Record<string, unknown>
  doc_type: string
  created_at: string
  updated_at: string
}

export interface MemoryEmbedding {
  id: string
  workspace_id: string
  project_id?: string
  agent_type: 'memory' | 'architecture' | 'task'
  content_type: 'task' | 'document' | 'chat' | 'decision'
  content_text: string
  metadata: Record<string, unknown>
  created_by?: string
  created_at: string
}

export interface MemoryAgent {
  type: string
  name: string
  description: string
  icon: string
  color: string
  count: number
}

export interface MemorySearchResult {
  id: string
  content_text: string
  content_type: string
  agent_type: string
  metadata: Record<string, unknown>
  similarity: number
  created_at: string
}

export interface TokenUsageStats {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  limit: number
  percentUsed: number
  byAction: Record<string, number>
  byDay: { date: string; tokens: number }[]
}

export interface ActivityLog {
  id: string
  workspace_id: string
  user_id: string
  entity_type: string
  entity_id: string
  action: string
  metadata: Record<string, unknown>
  created_at: string
}
