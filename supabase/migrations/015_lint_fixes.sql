-- Migration 015: Fix Supabase lint warnings
-- 1) Fix mutable search_path on match_memories function
-- 2) Move vector extension from public to extensions schema
-- 3) Leaked password protection → must enable via Dashboard (see note below)

-- ═══════ 1. Create extensions schema ═══════
CREATE SCHEMA IF NOT EXISTS extensions;

-- ═══════ 2. Move vector extension to extensions schema ═══════
-- Drop dependent function first (will be recreated below)
DROP FUNCTION IF EXISTS public.match_memories(vector(1536), uuid, text, int, float);

-- Drop HNSW index that uses vector operator class
DROP INDEX IF EXISTS idx_memory_embedding;

-- Move the extension
ALTER EXTENSION vector SET SCHEMA extensions;

-- Make vector types available without schema prefix
-- (so existing 'embedding vector(1536)' columns keep working)
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Recreate HNSW index with the new schema-qualified operator class
CREATE INDEX idx_memory_embedding ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ═══════ 3. Recreate match_memories with SET search_path (fixes lint) ═══════
CREATE OR REPLACE FUNCTION public.match_memories(
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
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id,
    me.content_text,
    me.content_type,
    me.agent_type,
    me.metadata,
    (1 - (me.embedding <=> query_embedding))::float AS similarity,
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

-- ═══════ 4. Leaked Password Protection ═══════
-- Cannot be set via SQL migration. Enable manually:
--   Supabase Dashboard → Authentication → Settings → Security
--   Toggle ON: "Leaked Password Protection (HaveIBeenPwned)"
