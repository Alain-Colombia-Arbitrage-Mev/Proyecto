-- RPC function for superadmin panel: aggregate task counts per user
-- Uses unnest on assignees uuid[] array to count tasks per user
CREATE OR REPLACE FUNCTION admin_user_task_counts()
RETURNS TABLE(user_id uuid, total bigint, completed bigint, in_progress bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    u.uid AS user_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE lower(kc.title) ~ '(done|complet|termin)') AS completed,
    COUNT(*) FILTER (WHERE lower(kc.title) ~ '(progress|doing|curso)') AS in_progress
  FROM tasks t
  CROSS JOIN LATERAL unnest(t.assignees) AS u(uid)
  LEFT JOIN kanban_columns kc ON kc.id = t.column_id
  GROUP BY u.uid;
$$;
