-- ============================================================
-- 012_project_members.sql
-- Per-project access control for member/viewer roles.
-- admin/owner/superadmin → automatic access to ALL projects.
-- member/viewer → only projects with entry in project_members.
-- ============================================================

-- 1. Table
CREATE TABLE project_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  granted_by   uuid REFERENCES auth.users,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_workspace ON project_members(workspace_id);

-- RLS for project_members table itself
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_select" ON project_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "pm_insert" ON project_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
  );

CREATE POLICY "pm_delete" ON project_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
  );

-- 2. Helper function: can user access a project?
--    Returns true if:
--    a) user has admin/owner/superadmin role in the project's workspace, OR
--    b) user has an entry in project_members for that project
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

-- 3. Update RLS policies to use project-level access
-- ============================================================
-- PROJECTS: replace SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "projects_workspace_isolation" ON projects;

CREATE POLICY "projects_workspace_isolation" ON projects
  FOR SELECT USING (
    -- admin+ in workspace → see all projects
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
    OR
    -- member/viewer → only if in project_members
    id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- KANBAN_COLUMNS: replace SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "kanban_columns_select" ON kanban_columns;

CREATE POLICY "kanban_columns_select" ON kanban_columns
  FOR SELECT USING (
    user_can_access_project(project_id, auth.uid())
  );

-- ============================================================
-- TASKS: replace ALL policy
-- ============================================================
DROP POLICY IF EXISTS "tasks_workspace_isolation" ON tasks;

CREATE POLICY "tasks_workspace_isolation" ON tasks
  FOR ALL USING (
    user_can_access_project(project_id, auth.uid())
  );

-- ============================================================
-- TASK_CHECKLIST: replace ALL policy
-- ============================================================
DROP POLICY IF EXISTS "task_checklist_access" ON task_checklist;

CREATE POLICY "task_checklist_access" ON task_checklist
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      WHERE user_can_access_project(t.project_id, auth.uid())
    )
  );

-- ============================================================
-- TASK_COMMENTS: replace ALL policy
-- ============================================================
DROP POLICY IF EXISTS "task_comments_access" ON task_comments;

CREATE POLICY "task_comments_access" ON task_comments
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      WHERE user_can_access_project(t.project_id, auth.uid())
    )
  );

-- ============================================================
-- TASK_LABELS: replace ALL policy
-- ============================================================
DROP POLICY IF EXISTS "task_labels_access" ON task_labels;

CREATE POLICY "task_labels_access" ON task_labels
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      WHERE user_can_access_project(t.project_id, auth.uid())
    )
  );

-- 4. Backfill: insert project_members for all existing member/viewer users
--    so nobody loses access after this migration
INSERT INTO project_members (project_id, user_id, workspace_id)
SELECT p.id, wm.user_id, p.workspace_id
FROM projects p
JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
WHERE wm.role IN ('member', 'viewer')
ON CONFLICT (project_id, user_id) DO NOTHING;
