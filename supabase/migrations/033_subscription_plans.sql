-- ══════════════════════════════════════════════
-- 033: SaaS Subscription Plans
-- ══════════════════════════════════════════════

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  name_en     text NOT NULL,
  price_per_member numeric(10,2) NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'USD',
  max_workspaces   integer NOT NULL DEFAULT 1,
  max_projects     integer NOT NULL DEFAULT 3,
  max_members      integer NOT NULL DEFAULT 5,
  token_limit      bigint NOT NULL DEFAULT 500000,
  features    jsonb NOT NULL DEFAULT '{}',
  is_active   boolean DEFAULT true,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, name_en, price_per_member, max_workspaces, max_projects, max_members, token_limit, features, sort_order)
VALUES
  ('starter', 'Starter', 'Starter', 2.00, 1, 5, 10, 5000000, '{
    "ai_basic": true,
    "ai_doc_agents": false,
    "meetings": true,
    "goals": false,
    "roadmap": false,
    "timesheet": true,
    "files_storage_mb": 500,
    "custom_domain": false
  }', 1),
  ('pro', 'Pro', 'Pro', 8.00, 5, 50, 100, 50000000, '{
    "ai_basic": true,
    "ai_doc_agents": true,
    "meetings": true,
    "goals": true,
    "roadmap": true,
    "timesheet": true,
    "files_storage_mb": 10000,
    "custom_domain": true
  }', 2)
ON CONFLICT (id) DO NOTHING;

-- Workspace subscription tracking
CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  plan_id         text NOT NULL REFERENCES subscription_plans(id),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  member_count    integer NOT NULL DEFAULT 1,
  amount          numeric(10,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  billing_cycle   text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  trial_end       timestamptz,
  payment_provider text,
  payment_id      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(workspace_id)
);

-- Update workspace plan field + add subscription_id reference
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES workspace_subscriptions(id);

-- Set token_limit based on plan for existing workspaces
-- (already have token_limit column from migration 011)

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_ws_subscriptions_workspace ON workspace_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_subscriptions_status ON workspace_subscriptions(status);
