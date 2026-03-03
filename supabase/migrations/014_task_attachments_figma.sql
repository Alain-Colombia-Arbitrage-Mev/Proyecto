-- Task attachments table
CREATE TABLE task_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_path    text NOT NULL,
  file_size    bigint NOT NULL DEFAULT 0,
  mime_type    text NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by  uuid,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_workspace ON task_attachments(workspace_id);

-- Figma links column on tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS figma_links jsonb DEFAULT '[]';

-- RLS for task_attachments
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_attachments_workspace_access ON task_attachments
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
