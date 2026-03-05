-- Fix: workspace_members.user_id and workspace_id should NOT be nullable
-- This caused ghost members with null user_id to be inserted

-- First ensure no null values remain
DELETE FROM workspace_members WHERE user_id IS NULL;
DELETE FROM workspace_members WHERE workspace_id IS NULL;

-- Add NOT NULL constraints
ALTER TABLE workspace_members ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workspace_members ALTER COLUMN workspace_id SET NOT NULL;

-- Also fix workspaces.owner_id to be NOT NULL
-- First ensure no null values remain
UPDATE workspaces SET owner_id = (
  SELECT user_id FROM workspace_members
  WHERE workspace_members.workspace_id = workspaces.id AND role = 'owner'
  LIMIT 1
) WHERE owner_id IS NULL;

ALTER TABLE workspaces ALTER COLUMN owner_id SET NOT NULL;
