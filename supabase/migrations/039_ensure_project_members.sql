-- Ensure project_members table exists (012 may have been registered but not executed)
CREATE TABLE IF NOT EXISTS project_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  granted_by   uuid REFERENCES auth.users,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_workspace ON project_members(workspace_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Recreate policies (DROP IF EXISTS + CREATE)
DROP POLICY IF EXISTS "pm_select" ON project_members;
CREATE POLICY "pm_select" ON project_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pm_insert" ON project_members;
CREATE POLICY "pm_insert" ON project_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "pm_delete" ON project_members;
CREATE POLICY "pm_delete" ON project_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
  );

-- Recreate helper function
CREATE OR REPLACE FUNCTION user_can_access_project(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = _project_id
      AND wm.user_id = _user_id
      AND wm.role IN ('superadmin', 'owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = _project_id
      AND pm.user_id = _user_id
  );
$$;

-- Backfill: give existing member/viewer users access to all projects in their workspace
INSERT INTO project_members (project_id, user_id, workspace_id)
SELECT p.id, wm.user_id, p.workspace_id
FROM projects p
JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
WHERE wm.role IN ('member', 'viewer')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
