-- Add n8n workflow ID reference to workflows table
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS n8n_workflow_id text;
CREATE INDEX IF NOT EXISTS idx_workflows_n8n_id ON workflows(n8n_workflow_id) WHERE n8n_workflow_id IS NOT NULL;
