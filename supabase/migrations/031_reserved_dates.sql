-- Reserved dates for team agenda (vacations, personal blocks, busy time)
CREATE TABLE reserved_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  type text NOT NULL DEFAULT 'busy' CHECK (type IN ('vacation','personal','busy')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reserved_dates_ws_range ON reserved_dates(workspace_id, start_at, end_at);
CREATE INDEX idx_reserved_dates_user ON reserved_dates(workspace_id, user_id);

ALTER TABLE reserved_dates ENABLE ROW LEVEL SECURITY;

-- RLS: workspace members can read all reserved dates in their workspace
CREATE POLICY "workspace_members_read_reserved_dates"
  ON reserved_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = reserved_dates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- RLS: users can insert their own reserved dates
CREATE POLICY "users_insert_own_reserved_dates"
  ON reserved_dates FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = reserved_dates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- RLS: users can delete their own reserved dates
CREATE POLICY "users_delete_own_reserved_dates"
  ON reserved_dates FOR DELETE
  USING (user_id = auth.uid());
