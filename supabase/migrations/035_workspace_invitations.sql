-- Pending workspace invitations for non-registered users
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  project_ids UUID[] DEFAULT '{}',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON workspace_invitations(workspace_id, status);

-- Unique constraint: one pending invitation per email per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_invitations_unique_pending
  ON workspace_invitations(workspace_id, email)
  WHERE status = 'pending';

-- RLS: service role only (server-side)
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
