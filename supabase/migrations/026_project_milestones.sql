-- Migration 026: Project milestones

CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  title text NOT NULL,
  title_en text,
  target_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_workspace ON project_milestones(workspace_id);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones in their workspace" ON project_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = project_milestones.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
