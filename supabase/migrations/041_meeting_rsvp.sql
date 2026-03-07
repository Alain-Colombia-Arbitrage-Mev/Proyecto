-- Meeting RSVP: track accept/decline responses from attendees
CREATE TABLE meeting_rsvp (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id   uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  responded_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_rsvp_meeting ON meeting_rsvp(meeting_id);
CREATE INDEX idx_meeting_rsvp_user ON meeting_rsvp(user_id, status);

ALTER TABLE meeting_rsvp ENABLE ROW LEVEL SECURITY;

-- RLS: workspace members can read RSVP for meetings in their workspace
CREATE POLICY "members_read_rsvp"
  ON meeting_rsvp FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE m.id = meeting_rsvp.meeting_id
        AND wm.user_id = auth.uid()
    )
  );

-- RLS: users can insert/update their own RSVP
CREATE POLICY "users_manage_own_rsvp"
  ON meeting_rsvp FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
