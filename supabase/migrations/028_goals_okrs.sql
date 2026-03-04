-- Migration 028: Goals & OKRs

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  parent_goal_id uuid REFERENCES goals ON DELETE CASCADE,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  goal_type text NOT NULL CHECK (goal_type IN ('goal','objective','key_result')),
  target_value numeric(10,2),
  current_value numeric(10,2) DEFAULT 0,
  unit text DEFAULT '%',
  period_start date,
  period_end date,
  status text DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  owner_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('project','task')),
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_workspace ON goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_goal_id) WHERE parent_goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_owner ON goals(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_links_goal ON goal_links(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_links_entity ON goal_links(entity_type, entity_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals in their workspace" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = goals.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view goal links" ON goal_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals
      JOIN workspace_members ON workspace_members.workspace_id = goals.workspace_id
      WHERE goals.id = goal_links.goal_id
      AND workspace_members.user_id = auth.uid()
    )
  );
