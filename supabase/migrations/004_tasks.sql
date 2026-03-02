CREATE TABLE tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects ON DELETE CASCADE,
  column_id       uuid REFERENCES kanban_columns ON DELETE SET NULL,
  parent_task_id  uuid REFERENCES tasks,
  title           text NOT NULL,
  description     text,
  priority        text DEFAULT 'medium',
  assignees       uuid[] DEFAULT '{}',
  reporter_id     uuid REFERENCES auth.users,
  due_date        timestamptz,
  estimated_hours numeric(5,2),
  tracked_hours   numeric(5,2) DEFAULT 0,
  position        integer NOT NULL DEFAULT 0,
  tags            text[] DEFAULT '{}',
  column_entered_at      timestamptz DEFAULT now(),
  ai_suggested_priority  text,
  ai_decomposed          boolean DEFAULT false,
  ai_quick_task          boolean DEFAULT false,
  last_activity_at       timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE task_checklist (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id   uuid REFERENCES tasks ON DELETE CASCADE,
  text      text NOT NULL,
  completed boolean DEFAULT false,
  position  integer NOT NULL DEFAULT 0
);

CREATE TABLE task_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid REFERENCES tasks ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users,
  content    text NOT NULL,
  edited_at  timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE labels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  name         text NOT NULL,
  color        text NOT NULL
);

CREATE TABLE task_labels (
  task_id  uuid REFERENCES tasks ON DELETE CASCADE,
  label_id uuid REFERENCES labels ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Indices
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_tasks_assignees ON tasks USING gin(assignees);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_last_activity ON tasks(last_activity_at);
CREATE INDEX idx_tasks_column_entered ON tasks(column_entered_at);
CREATE INDEX idx_tasks_quick ON tasks(ai_quick_task) WHERE ai_quick_task = true;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_workspace_isolation" ON tasks
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "task_checklist_access" ON task_checklist
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "task_comments_access" ON task_comments
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "labels_workspace_isolation" ON labels
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "task_labels_access" ON task_labels
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );
