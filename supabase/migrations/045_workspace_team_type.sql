-- Team type per workspace: drives template suggestions and AI advisor context
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS team_type text NOT NULL DEFAULT 'kanban'
  CHECK (team_type IN ('kanban', 'scrum', 'dev', 'audio', 'creative'));

COMMENT ON COLUMN workspaces.team_type IS 'Methodology/team profile: kanban | scrum | dev | audio | creative';
