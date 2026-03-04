export type UserRole = 'superadmin' | 'owner' | 'admin' | 'member' | 'viewer'
export type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'paused'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type KanbanTemplate = 'simple' | 'kanban' | 'dev' | 'devops' | 'support' | 'scrum' | 'scrumban' | 'marketing' | 'ai_agents' | 'backend_senior_dev' | 'frontend_design' | 'custom'

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
  title_en?: string
  description?: string
  description_en?: string
  priority: Priority
  assignees: string[]
  reporter_id?: string
  due_date?: string
  estimated_hours?: number
  tracked_hours: number
  position: number
  tags: string[]
  figma_links?: FigmaLink[]
  labels?: Label[]
  column_entered_at: string
  ai_suggested_priority?: string
  ai_decomposed: boolean
  ai_quick_task: boolean
  last_activity_at: string
  created_at: string
  updated_at: string
  // Subtask fields
  depth?: number
  ancestry?: string[]
  subtask_count?: number
  completed_subtask_count?: number
  // Sprint field (Phase 3)
  sprint_id?: string
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
  assignee_id?: string
  mentions?: string[]
  is_action_item?: boolean
  resolved?: boolean
}

export interface Label {
  id: string
  workspace_id: string
  name: string
  color: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  workspace_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by?: string
  created_at: string
  url?: string // signed URL from API
}

export interface FigmaLink {
  url: string
  label?: string
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
  agent_type: 'memory' | 'architecture' | 'task' | 'backend_arch' | 'aws_expert' | 'frontend_design' | 'marketing' | 'ai_agents_doc'
  content_type: 'task' | 'document' | 'chat' | 'decision' | 'doc_session'
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

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  workspace_id: string
  granted_by?: string
  created_at: string
}

// Doc Agent types
export type DocAgentAction = 'doc_backend_architecture' | 'doc_aws_expert' | 'doc_frontend_design' | 'doc_marketing' | 'doc_ai_agents'

export interface DocAgentConfig {
  action: DocAgentAction
  name: string
  description: string
  icon: string
  color: string
  folder: string
  agentType: string
  docType: string
  maxTokens: number
  tags: string[]
}

export interface DocSession {
  sessionId: string
  action: DocAgentAction
  workspaceId: string
  projectId: string
  userId: string
  createdAt: string
}

export interface Meeting {
  id: string
  workspace_id: string
  project_id?: string
  created_by: string
  title: string
  description?: string
  meeting_url: string
  platform: string
  scheduled_at: string
  duration_minutes: number
  attendees: string[]
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
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

// ── Phase 1: Time Tracking ──

export type TimeEntrySource = 'manual' | 'timer' | 'pomodoro'

export interface TimeEntry {
  id: string
  workspace_id: string
  project_id?: string
  task_id?: string
  user_id: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  description?: string
  billable: boolean
  source: TimeEntrySource
  created_at: string
  updated_at: string
}

export interface TimesheetRow {
  date: string
  entries: TimeEntry[]
  total_minutes: number
}

// ── Phase 2: Relationships & Tracking ──

export type RelationshipType = 'blocks' | 'relates_to' | 'duplicates'

export interface TaskRelationship {
  id: string
  workspace_id: string
  source_task_id: string
  target_task_id: string
  relationship_type: RelationshipType
  created_by?: string
  created_at: string
}

export interface TaskReassignment {
  id: string
  workspace_id: string
  task_id: string
  from_user_id?: string
  to_user_id: string
  reassigned_by: string
  reason?: string
  created_at: string
}

export interface ProjectMilestone {
  id: string
  project_id: string
  workspace_id: string
  title: string
  title_en?: string
  target_date?: string
  completed: boolean
  completed_at?: string
  position: number
  created_at: string
}

// ── Phase 3: Agile & Goals ──

export type SprintStatus = 'planned' | 'active' | 'completed'
export type GoalType = 'goal' | 'objective' | 'key_result'
export type GoalStatus = 'active' | 'completed' | 'cancelled'

export interface Sprint {
  id: string
  workspace_id: string
  project_id: string
  name: string
  goal?: string
  start_date: string
  end_date: string
  status: SprintStatus
  created_at: string
}

export interface TaskColumnHistory {
  id: string
  task_id: string
  column_id?: string
  entered_at: string
  exited_at?: string
}

export interface BurndownPoint {
  date: string
  remaining: number
  ideal: number
}

export interface VelocityPoint {
  sprint: string
  points: number
}

export interface Goal {
  id: string
  workspace_id: string
  parent_goal_id?: string
  title: string
  title_en?: string
  description?: string
  description_en?: string
  goal_type: GoalType
  target_value?: number
  current_value: number
  unit: string
  period_start?: string
  period_end?: string
  status: GoalStatus
  owner_id?: string
  created_at: string
}

export interface GoalLink {
  id: string
  goal_id: string
  entity_type: 'project' | 'task'
  entity_id: string
  created_at: string
}

export interface ProjectDependency {
  id: string
  workspace_id: string
  source_project_id: string
  target_project_id: string
  dependency_type: string
  created_by?: string
  created_at: string
}
