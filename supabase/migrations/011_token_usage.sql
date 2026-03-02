-- Token usage tracking for AI calls
CREATE TABLE ai_token_usage (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid REFERENCES workspaces ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action            text NOT NULL,
  model             text NOT NULL,
  prompt_tokens     integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens      integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_token_usage_ws_date ON ai_token_usage (workspace_id, created_at DESC);
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

-- Members can read their workspace's token usage
CREATE POLICY "token_usage_select" ON ai_token_usage FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Only service role can insert (no user-facing insert policy).
-- Service role bypasses RLS, so no INSERT policy is needed.
-- Explicitly deny user-level inserts by not having an INSERT policy.

-- Add token_limit to workspaces (default 50M tokens)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS token_limit bigint DEFAULT 50000000;
