-- API tokens for MCP/external integrations
CREATE TABLE api_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  name          text NOT NULL,
  token_hash    text NOT NULL,
  token_prefix  text NOT NULL,        -- first 8 chars for display (e.g. "ff_ab12...")
  scopes        text[] DEFAULT '{read}',  -- read, write, admin
  last_used_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_workspace ON api_tokens(workspace_id);
CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_tokens"
  ON api_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins_view_workspace_tokens"
  ON api_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = api_tokens.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner', 'superadmin')
    )
  );
