-- Migration 025: Reassignment history tracking

CREATE TABLE IF NOT EXISTS task_reassignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  from_user_id uuid REFERENCES auth.users,
  to_user_id uuid NOT NULL REFERENCES auth.users,
  reassigned_by uuid NOT NULL REFERENCES auth.users,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reassign_task ON task_reassignments(task_id);
CREATE INDEX IF NOT EXISTS idx_reassign_workspace ON task_reassignments(workspace_id);

ALTER TABLE task_reassignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reassignments in their workspace" ON task_reassignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = task_reassignments.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
