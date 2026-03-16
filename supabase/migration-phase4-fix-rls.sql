-- ============================================================
-- Phase 4 RLS Fix — Run this in Supabase SQL Editor
-- Uses a SECURITY DEFINER function to avoid infinite recursion
-- in policies that need to look up the current user's org_id
-- ============================================================

-- ── 1. Helper function — bypasses RLS to get current user's org_id ──
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

-- ── 2. Drop all problematic policies ──

DROP POLICY IF EXISTS "Org members can read org profiles" ON profiles;
DROP POLICY IF EXISTS "Org members can read org activity" ON activity_log;
DROP POLICY IF EXISTS "Org members can read org topic progress" ON topic_progress;

DROP POLICY IF EXISTS "Org admins can manage memberships" ON user_org_memberships;
DROP POLICY IF EXISTS "Org admins can select memberships" ON user_org_memberships;
DROP POLICY IF EXISTS "Org admins can read memberships" ON user_org_memberships;
DROP POLICY IF EXISTS "Org admins can update memberships" ON user_org_memberships;
DROP POLICY IF EXISTS "Org admins can delete memberships" ON user_org_memberships;

DROP POLICY IF EXISTS "Org admins can manage invites" ON org_invites;
DROP POLICY IF EXISTS "Org admins can manage sessions" ON workshop_sessions;

-- ── 3. Recreate org-scoped READ policies using get_my_org_id() ──

CREATE POLICY "Org members can read org profiles" ON profiles
  FOR SELECT USING (
    org_id IS NOT NULL AND org_id = get_my_org_id()
  );

CREATE POLICY "Org members can read org activity" ON activity_log
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE org_id IS NOT NULL AND org_id = get_my_org_id()
    )
  );

CREATE POLICY "Org members can read org topic progress" ON topic_progress
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE org_id IS NOT NULL AND org_id = get_my_org_id()
    )
  );

-- ── 4. Admin management policies ──

CREATE POLICY "Org admins can read memberships" ON user_org_memberships
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM user_org_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'admin' AND om.active = true
    )
  );

CREATE POLICY "Org admins can update memberships" ON user_org_memberships
  FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM user_org_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'admin' AND om.active = true
    )
  );

CREATE POLICY "Org admins can delete memberships" ON user_org_memberships
  FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM user_org_memberships om
      WHERE om.user_id = auth.uid() AND om.role = 'admin' AND om.active = true
    )
  );

CREATE POLICY "Org admins can manage invites" ON org_invites
  FOR ALL USING (
    org_id = get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM user_org_memberships om
      WHERE om.user_id = auth.uid() AND om.org_id = get_my_org_id() AND om.role = 'admin' AND om.active = true
    )
  );

CREATE POLICY "Org admins can manage sessions" ON workshop_sessions
  FOR ALL USING (
    org_id = get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM user_org_memberships om
      WHERE om.user_id = auth.uid() AND om.org_id = get_my_org_id() AND om.role = 'admin' AND om.active = true
    )
  );

-- ── 5. Ensure organisations table has RLS + read policy ──
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organisations' AND policyname='Authenticated users can read orgs') THEN
    CREATE POLICY "Authenticated users can read orgs" ON organisations
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
