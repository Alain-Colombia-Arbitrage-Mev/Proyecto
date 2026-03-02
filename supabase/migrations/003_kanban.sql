CREATE TABLE kanban_columns (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects ON DELETE CASCADE,
  title        text NOT NULL,
  color        text DEFAULT '#6366F1',
  icon         text,
  position     integer NOT NULL,
  wip_limit    integer,
  automations  jsonb DEFAULT '[]',
  created_at   timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kanban_columns_select" ON kanban_columns
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "kanban_columns_insert" ON kanban_columns
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('superadmin', 'owner', 'admin')
    )
  );

CREATE POLICY "kanban_columns_update" ON kanban_columns
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('superadmin', 'owner', 'admin')
    )
  );

CREATE POLICY "kanban_columns_delete" ON kanban_columns
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('superadmin', 'owner')
    )
  );
