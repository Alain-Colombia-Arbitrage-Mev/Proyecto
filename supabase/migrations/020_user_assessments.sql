-- User assessments (procrastination quiz, etc.)
CREATE TABLE IF NOT EXISTS user_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  assessment_type text NOT NULL DEFAULT 'procrastination',
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  answers jsonb DEFAULT '[]',
  ai_analysis text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, workspace_id, assessment_type)
);

ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_assessments" ON user_assessments
  FOR ALL USING (user_id = auth.uid());
