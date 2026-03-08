-- AI Agent delegation field on tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_agent text;
-- Possible values: null (human), 'orchestrator', 'backend', 'frontend', 'qa', 'devops', 'designer', 'copywriter', 'data', 'security', 'custom'

-- Orchestrator runs — tracks AI decomposition & delegation sessions
CREATE TABLE IF NOT EXISTS ai_orchestrator_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  triggered_by  uuid NOT NULL,
  source_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  prompt        text NOT NULL,
  agent_type    text NOT NULL DEFAULT 'orchestrator',
  status        text NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
  result        jsonb DEFAULT '{}',
  tasks_created uuid[] DEFAULT '{}',
  error         text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_orchestrator_runs_workspace ON ai_orchestrator_runs(workspace_id);
CREATE INDEX idx_orchestrator_runs_status ON ai_orchestrator_runs(status);
CREATE INDEX idx_tasks_ai_agent ON tasks(ai_agent) WHERE ai_agent IS NOT NULL;

-- RLS
ALTER TABLE ai_orchestrator_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orchestrator_runs_workspace_isolation" ON ai_orchestrator_runs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
