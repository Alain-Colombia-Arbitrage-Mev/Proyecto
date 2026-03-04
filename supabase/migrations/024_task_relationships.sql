-- Migration 024: Task relationships (blocks, relates_to, duplicates)

CREATE TABLE IF NOT EXISTS task_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  source_task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  target_task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('blocks','relates_to','duplicates')),
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  UNIQUE (source_task_id, target_task_id, relationship_type),
  CHECK (source_task_id != target_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_rel_source ON task_relationships(source_task_id);
CREATE INDEX IF NOT EXISTS idx_task_rel_target ON task_relationships(target_task_id);
CREATE INDEX IF NOT EXISTS idx_task_rel_workspace ON task_relationships(workspace_id);

ALTER TABLE task_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships in their workspace" ON task_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = task_relationships.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );
