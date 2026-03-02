-- Migration 010: Vector memory for AI agents (pgvector)

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory embeddings table
CREATE TABLE memory_embeddings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  project_id    uuid REFERENCES projects ON DELETE SET NULL,
  agent_type    text NOT NULL DEFAULT 'memory',   -- memory | architecture | task
  content_type  text NOT NULL DEFAULT 'chat',      -- task | document | chat | decision
  content_text  text NOT NULL,
  embedding     vector(1536),
  metadata      jsonb DEFAULT '{}',
  created_by    uuid REFERENCES auth.users,
  created_at    timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX idx_memory_workspace ON memory_embeddings (workspace_id);
CREATE INDEX idx_memory_agent_type ON memory_embeddings (workspace_id, agent_type);
CREATE INDEX idx_memory_created_at ON memory_embeddings (created_at DESC);

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_memory_embedding ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Match memories function for RAG search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  p_workspace_id uuid,
  p_agent_type text DEFAULT NULL,
  p_limit int DEFAULT 5,
  p_threshold float DEFAULT 0.65
)
RETURNS TABLE (
  id uuid,
  content_text text,
  content_type text,
  agent_type text,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id,
    me.content_text,
    me.content_type,
    me.agent_type,
    me.metadata,
    1 - (me.embedding <=> query_embedding) AS similarity,
    me.created_at
  FROM memory_embeddings me
  WHERE me.workspace_id = p_workspace_id
    AND me.embedding IS NOT NULL
    AND (p_agent_type IS NULL OR me.agent_type = p_agent_type)
    AND 1 - (me.embedding <=> query_embedding) > p_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT p_limit;
END;
$$;

-- RLS policies
ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_select" ON memory_embeddings
  FOR SELECT USING (
    workspace_id IN (SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
  );

CREATE POLICY "memory_insert" ON memory_embeddings
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
  );

CREATE POLICY "memory_update" ON memory_embeddings
  FOR UPDATE USING (
    workspace_id IN (SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
  );

CREATE POLICY "memory_delete" ON memory_embeddings
  FOR DELETE USING (
    workspace_id IN (SELECT wm.workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
  );
