-- Workspace files: tracks files uploaded per workspace with strict isolation
CREATE TABLE workspace_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  project_id    uuid REFERENCES projects ON DELETE SET NULL,
  uploaded_by   uuid REFERENCES auth.users,
  file_name     text NOT NULL,
  file_path     text NOT NULL,          -- storage path: {workspace_id}/{folder}/{filename}
  file_size     bigint DEFAULT 0,
  mime_type     text DEFAULT 'application/octet-stream',
  folder        text DEFAULT '/',       -- virtual folder for navigation
  source        text DEFAULT 'upload',  -- 'upload' | 'ai_generated' | 'export'
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_workspace_files_workspace ON workspace_files(workspace_id);
CREATE INDEX idx_workspace_files_project ON workspace_files(project_id);
CREATE INDEX idx_workspace_files_folder ON workspace_files(workspace_id, folder);

ALTER TABLE workspace_files ENABLE ROW LEVEL SECURITY;

-- Supabase storage bucket for workspace files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-files',
  'workspace-files',
  false,
  52428800,  -- 50MB limit
  ARRAY['text/plain', 'text/markdown', 'text/csv', 'application/json',
        'application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'application/zip', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only workspace members can access their workspace's files
CREATE POLICY "workspace_files_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] IN (
      SELECT wm.workspace_id::text
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] IN (
      SELECT wm.workspace_id::text
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_files_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] IN (
      SELECT wm.workspace_id::text
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );
