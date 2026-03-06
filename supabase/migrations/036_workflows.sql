-- Workflow Builder tables

CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Workflow',
  description text,
  type text NOT NULL DEFAULT 'ai_agent' CHECK (type IN ('ai_agent', 'social_media', 'video_creation')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflows_workspace ON workflows(workspace_id);
CREATE INDEX idx_workflows_type ON workflows(workspace_id, type);
CREATE INDEX idx_workflows_status ON workflows(workspace_id, status);

-- Workflow execution history
CREATE TABLE IF NOT EXISTS workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  output jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);

-- RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_workspace_access" ON workflows
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workflow_runs_access" ON workflow_runs
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );
