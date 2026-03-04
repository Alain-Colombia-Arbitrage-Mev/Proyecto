-- Migration 021: Nested subtasks support
-- Adds depth tracking and ancestry path for hierarchical subtasks (max 3 levels)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depth integer NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ancestry text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_depth ON tasks(depth) WHERE depth > 0;

ALTER TABLE tasks ADD CONSTRAINT chk_task_depth CHECK (depth <= 3);
