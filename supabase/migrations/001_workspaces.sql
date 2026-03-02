-- Workspaces (cada proyecto independiente = 1 workspace)
CREATE TABLE workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  custom_domain text,
  plan        text DEFAULT 'free',
  owner_id    uuid REFERENCES auth.users,
  logo_url    text,
  color       text DEFAULT '#6366F1',
  ai_enabled  boolean DEFAULT true,
  ai_config   jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Miembros por workspace
CREATE TABLE workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE,
  role         text DEFAULT 'member',
  joined_at    timestamptz DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace members can see their workspaces
CREATE POLICY "workspace_member_select" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Owners can update their workspaces
CREATE POLICY "workspace_owner_update" ON workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner')
    )
  );

-- Authenticated users can create workspaces
CREATE POLICY "workspace_insert" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Members can see other members of their workspace
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Owners/admins can manage members
CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('superadmin', 'owner', 'admin')
    )
    OR NOT EXISTS (
      SELECT 1 FROM workspace_members WHERE workspace_id = workspace_members.workspace_id
    )
  );

-- Superadmin full access
CREATE POLICY "superadmin_workspaces" ON workspaces
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM workspace_members WHERE role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_workspace_members" ON workspace_members
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM workspace_members WHERE role = 'superadmin'
    )
  );
