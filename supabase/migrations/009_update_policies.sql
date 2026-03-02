-- Migration 009: Add UPDATE policies for workspace_files, documents, and storage.objects
-- Fixes: file deletion bug caused by missing UPDATE RLS policies

-- UPDATE policy for workspace_files
CREATE POLICY "workspace_files_update" ON workspace_files
  FOR UPDATE USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

-- UPDATE policy for documents
CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

-- UPDATE policy for workspace-files storage bucket
CREATE POLICY "workspace_files_storage_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] IN (
      SELECT wm.workspace_id::text FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );
