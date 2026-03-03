-- Migration 016: Add missing indexes for query performance

-- task_comments are always queried by task_id
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments (task_id);

-- task_checklist items are always queried by task_id
CREATE INDEX IF NOT EXISTS idx_task_checklist_task_id ON task_checklist (task_id);

-- notifications: optimize duplicate detection in check-deadlines cron
CREATE INDEX IF NOT EXISTS idx_notifications_user_entity ON notifications (user_id, entity_id, type);

-- notifications: optimize polling query (user_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
