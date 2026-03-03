-- Meetings table for scheduling team calls
CREATE TABLE meetings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid REFERENCES workspaces ON DELETE CASCADE NOT NULL,
  project_id      uuid REFERENCES projects ON DELETE SET NULL,
  created_by      uuid REFERENCES auth.users NOT NULL,
  title           text NOT NULL,
  description     text,
  meeting_url     text NOT NULL,
  platform        text NOT NULL DEFAULT 'google_meet',
  scheduled_at    timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  attendees       uuid[] DEFAULT '{}',
  status          text NOT NULL DEFAULT 'scheduled',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_meetings_workspace ON meetings(workspace_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status) WHERE status = 'scheduled';

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_workspace_isolation" ON meetings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
