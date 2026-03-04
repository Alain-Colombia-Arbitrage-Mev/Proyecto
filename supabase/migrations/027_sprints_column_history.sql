-- Migration 027: Sprints and task column history for agile reporting

CREATE TABLE IF NOT EXISTS sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'planned' CHECK (status IN ('planned','active','completed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_workspace ON sprints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id) WHERE sprint_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS task_column_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  column_id uuid REFERENCES kanban_columns ON DELETE SET NULL,
  entered_at timestamptz DEFAULT now(),
  exited_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_col_history_task ON task_column_history(task_id);
CREATE INDEX IF NOT EXISTS idx_col_history_column ON task_column_history(column_id);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_column_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sprints in their workspace" ON sprints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = sprints.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view column history for their workspace tasks" ON task_column_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_column_history.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );
