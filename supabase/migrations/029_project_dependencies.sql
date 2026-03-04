-- Migration 029: Project dependencies for roadmap

CREATE TABLE IF NOT EXISTS project_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  source_project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  target_project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  dependency_type text DEFAULT 'depends_on',
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  UNIQUE (source_project_id, target_project_id),
  CHECK (source_project_id != target_project_id)
);

CREATE INDEX IF NOT EXISTS idx_proj_dep_source ON project_dependencies(source_project_id);
CREATE INDEX IF NOT EXISTS idx_proj_dep_target ON project_dependencies(target_project_id);
CREATE INDEX IF NOT EXISTS idx_proj_dep_workspace ON project_dependencies(workspace_id);

ALTER TABLE project_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project dependencies in their workspace" ON project_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = project_dependencies.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
