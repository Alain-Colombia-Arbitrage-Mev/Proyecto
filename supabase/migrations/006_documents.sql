-- Documents table for storing AI-generated architecture docs and future doc types
CREATE TABLE documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  project_id   uuid REFERENCES projects ON DELETE SET NULL,
  author_id    uuid REFERENCES auth.users,
  title        text NOT NULL,
  summary      text,
  content      jsonb NOT NULL DEFAULT '{}',
  doc_type     text DEFAULT 'architecture',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_project ON documents(project_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
