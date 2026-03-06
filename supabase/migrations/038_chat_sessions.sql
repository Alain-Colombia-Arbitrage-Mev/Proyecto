-- Migration 038: Chat sessions with vector memory for workflow assistant

-- Chat sessions table
CREATE TABLE chat_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  workflow_id   uuid REFERENCES workflows ON DELETE SET NULL,
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title         text NOT NULL DEFAULT 'Nueva conversacion',
  messages      jsonb NOT NULL DEFAULT '[]',
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_sessions_workspace ON chat_sessions (workspace_id, user_id);
CREATE INDEX idx_chat_sessions_workflow ON chat_sessions (workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX idx_chat_sessions_updated ON chat_sessions (updated_at DESC);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_select" ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "chat_sessions_insert" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_sessions_update" ON chat_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "chat_sessions_delete" ON chat_sessions
  FOR DELETE USING (user_id = auth.uid());
