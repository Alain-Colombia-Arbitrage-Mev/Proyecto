CREATE TABLE projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  status       text DEFAULT 'active',
  priority     text DEFAULT 'medium',
  category     text,
  owner_id     uuid REFERENCES auth.users,
  start_date   date,
  end_date     date,
  budget       numeric(12,2),
  currency     text DEFAULT 'USD',
  color        text DEFAULT '#6366F1',
  archived     boolean DEFAULT false,
  kanban_template text DEFAULT 'simple',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_workspace_isolation" ON projects
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
  );

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner')
    )
  );
