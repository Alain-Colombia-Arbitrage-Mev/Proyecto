-- Migration 022: Enhanced comments with assignees, mentions, and action items

ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES auth.users;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS mentions uuid[] DEFAULT '{}';
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS is_action_item boolean DEFAULT false;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS resolved boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_comments_assignee ON task_comments(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_mentions ON task_comments USING gin(mentions);
CREATE INDEX IF NOT EXISTS idx_comments_action_items ON task_comments(is_action_item) WHERE is_action_item = true;
