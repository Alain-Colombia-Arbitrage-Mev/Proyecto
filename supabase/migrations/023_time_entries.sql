-- Migration 023: Time tracking entries

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  task_id uuid REFERENCES tasks ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer,
  description text,
  billable boolean DEFAULT true,
  source text DEFAULT 'manual' CHECK (source IN ('manual','timer','pomodoro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_workspace ON time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id) WHERE project_id IS NOT NULL;

-- RLS policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time entries in their workspace" ON time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = time_entries.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own time entries" ON time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries" ON time_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries" ON time_entries
  FOR DELETE USING (user_id = auth.uid());
