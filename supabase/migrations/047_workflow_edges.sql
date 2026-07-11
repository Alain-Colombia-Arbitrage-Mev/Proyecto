-- 047: Node-graph workflows (ComfyUI-style canvas)
-- edges: [{ id, source, target }] connecting node ids. Empty = legacy
-- sequential execution by array order.
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS edges jsonb NOT NULL DEFAULT '[]'::jsonb;
