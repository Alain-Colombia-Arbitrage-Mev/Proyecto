-- 046: Fix RLS security on workspaces / workspace_members
--
-- Problems fixed:
-- 1. Infinite recursion: policies on workspace_members queried workspace_members
--    itself ("infinite recursion detected in policy" — broke every anon/authed query).
-- 2. Privilege escalation: the "superadmin_*" policies granted FULL access to ALL
--    workspaces to any user holding role='superadmin' in ANY workspace, and the
--    insert policy let owners/admins insert rows with ANY role (including
--    'superadmin'), so a workspace owner could self-escalate to global access.
-- 3. Broken bootstrap clause: NOT EXISTS compared workspace_members.workspace_id
--    with itself (always true), making the insert policy effectively permissive.
--
-- Fix: SECURITY DEFINER helper functions (bypass RLS, no recursion) + strict
-- per-workspace policies. Platform superadmin access stays server-side via the
-- service role key, which bypasses RLS by design.

-- ── Helper functions (SECURITY DEFINER = evaluated without RLS) ──

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role = ANY (allowed_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_has_members(ws_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = ws_id);
$$;

CREATE OR REPLACE FUNCTION public.owns_workspace(ws_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM workspaces WHERE id = ws_id AND owner_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM public;
REVOKE ALL ON FUNCTION public.has_workspace_role(uuid, text[]) FROM public;
REVOKE ALL ON FUNCTION public.workspace_has_members(uuid) FROM public;
REVOKE ALL ON FUNCTION public.owns_workspace(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, text[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.workspace_has_members(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.owns_workspace(uuid) TO authenticated, anon;

-- ── Drop ALL existing policies on both tables (names drifted between
--    migrations and production; prod had a wm_insert that let any user
--    self-join any workspace) ──

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('workspaces', 'workspace_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ── workspaces ──

CREATE POLICY "ws_select" ON workspaces
  FOR SELECT USING (public.is_workspace_member(id) OR owner_id = auth.uid());

CREATE POLICY "ws_insert" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "ws_update" ON workspaces
  FOR UPDATE USING (public.has_workspace_role(id, ARRAY['owner', 'superadmin']))
  WITH CHECK (public.has_workspace_role(id, ARRAY['owner', 'superadmin']));

CREATE POLICY "ws_delete" ON workspaces
  FOR DELETE USING (
    owner_id = auth.uid() AND public.has_workspace_role(id, ARRAY['owner', 'superadmin'])
  );

-- ── workspace_members (no self-referencing subqueries → no recursion) ──

-- Members see the roster of their own workspaces; users always see their own rows
CREATE POLICY "wm_select" ON workspace_members
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_workspace_member(workspace_id)
  );

-- INSERT:
--  a) Bootstrap: the workspace owner adds THEMSELF as first member (role owner).
--  b) Owners/admins add members, but only with non-privileged roles —
--     'superadmin' can never be granted through the API.
CREATE POLICY "wm_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    (
      user_id = auth.uid()
      AND role = 'owner'
      AND public.owns_workspace(workspace_id)
      AND NOT public.workspace_has_members(workspace_id)
    )
    OR (
      public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'superadmin'])
      AND role IN ('admin', 'member', 'marketing', 'viewer')
    )
  );

-- UPDATE (role changes): owners only, and never to 'superadmin'
CREATE POLICY "wm_update" ON workspace_members
  FOR UPDATE USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'superadmin']))
  WITH CHECK (
    public.has_workspace_role(workspace_id, ARRAY['owner', 'superadmin'])
    AND role IN ('owner', 'admin', 'member', 'marketing', 'viewer')
  );

-- DELETE: owners/admins remove members; anyone can leave a workspace
CREATE POLICY "wm_delete" ON workspace_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'superadmin'])
  );
