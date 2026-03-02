-- RLS policies for documents table
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

-- RLS policies for workspace_files table
CREATE POLICY "workspace_files_select" ON workspace_files
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_files_insert" ON workspace_files
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_files_delete" ON workspace_files
  FOR DELETE USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );
