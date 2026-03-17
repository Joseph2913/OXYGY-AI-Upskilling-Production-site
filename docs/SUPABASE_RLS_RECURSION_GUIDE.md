# Supabase RLS Infinite Recursion — Diagnosis & Prevention Guide

**Date resolved:** 2026-03-16
**Tables affected:** `profiles`, `user_org_memberships`
**Impact:** All client-side queries to profiles and user_org_memberships returned error 42P17 "infinite recursion detected in policy for relation", causing the app to default every user to `platformRole: 'learner'` and blocking admin access.

---

## What Happened

### The Symptom
Navigating to `/admin` always showed the user as "learner" even though their `profiles` row had `platform_role = 'super_admin'` (confirmed via direct SQL in Supabase SQL Editor). The Supabase PostgREST API returned:

```
{"code":"42P17","message":"infinite recursion detected in policy for relation \"profiles\""}
```

### Root Cause: Cross-Table RLS Policy Recursion

PostgreSQL evaluates **ALL** select policies on a table (OR'd together) for every query. If any single policy is recursive, it poisons every query — even if simpler policies like `auth.uid() = id` would have been sufficient.

The recursion chain was:

```
Query profiles
  → Policy "Client admins can read org profiles" queries user_org_memberships
  → Policy "Org members can read org profiles" queries user_org_memberships
    → user_org_memberships evaluates ALL its select policies
    → Policy "Oxygy admins can manage memberships" queries profiles (WHERE platform_role IN (...))
    → Policy "Oxygy admins can read all memberships" queries profiles (WHERE platform_role IN (...))
      → Back to profiles → INFINITE RECURSION
```

### Why It Was Hard to Find

1. **The recursion was cross-table**, not a simple self-reference. `profiles` policies referenced `user_org_memberships`, and `user_org_memberships` policies referenced `profiles`.
2. **Individual policies looked correct** — each one was reasonable in isolation. The recursion only emerged when PostgreSQL evaluated all policies together.
3. **SECURITY DEFINER functions can be silently inlined** — our first fix used a `LANGUAGE sql` SECURITY DEFINER function, which PostgreSQL inlined (pasting the function body into the query plan), losing the SECURITY DEFINER context entirely.

---

## The Fix

### Step 1: Create SECURITY DEFINER Helper Functions (plpgsql, NOT sql)

```sql
-- Check if current user is an Oxygy admin (bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION is_oxygy_admin()
RETURNS boolean
LANGUAGE plpgsql          -- MUST be plpgsql, NOT sql (sql functions get inlined)
SECURITY DEFINER          -- Runs as function owner (postgres), bypassing RLS
SET search_path = public  -- Security best practice
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND platform_role IN ('oxygy_admin', 'super_admin')
  );
END;
$$;

-- Get org IDs where current user is an admin (bypasses RLS on user_org_memberships)
CREATE OR REPLACE FUNCTION get_admin_org_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT org_id FROM user_org_memberships
    WHERE user_id = auth.uid()
      AND role = 'admin'::text
      AND active = true;
END;
$$;
```

### Step 2: Update Policies to Use Helper Functions

**On `profiles` table** — any policy that referenced `user_org_memberships` admin checks is fine as long as `user_org_memberships` policies don't reference `profiles` back. The "Oxygy admins can read all profiles" policy was changed to:

```sql
CREATE POLICY "Oxygy admins can read all profiles" ON profiles
  FOR SELECT USING (is_oxygy_admin());
```

**On `user_org_memberships` table** — policies that referenced `profiles` were changed to use `is_oxygy_admin()`, and policies that self-referenced were changed to use `get_admin_org_ids()`:

```sql
-- These referenced profiles → use is_oxygy_admin()
CREATE POLICY "Oxygy admins can manage memberships" ON user_org_memberships
  FOR ALL USING (is_oxygy_admin()) WITH CHECK (is_oxygy_admin());

CREATE POLICY "Oxygy admins can read all memberships" ON user_org_memberships
  FOR SELECT USING (is_oxygy_admin());

-- These self-referenced user_org_memberships → use get_admin_org_ids()
CREATE POLICY "Org admins can read memberships" ON user_org_memberships
  FOR SELECT USING (org_id IN (SELECT get_admin_org_ids()));

CREATE POLICY "Org admins can delete memberships" ON user_org_memberships
  FOR DELETE USING (org_id IN (SELECT get_admin_org_ids()));

CREATE POLICY "Org admins can update memberships" ON user_org_memberships
  FOR UPDATE
  USING (org_id IN (SELECT get_admin_org_ids()))
  WITH CHECK (org_id IN (SELECT get_admin_org_ids()));
```

---

## Rules for Writing RLS Policies Going Forward

### Rule 1: Never Query Table X From a Policy on Table X
A policy on `profiles` must NEVER contain `SELECT ... FROM profiles`. This is direct self-recursion.

### Rule 2: Never Create Cross-Table Circular References
If `profiles` policies query `user_org_memberships`, then `user_org_memberships` policies must NEVER query `profiles`. Map out the dependency graph before writing policies.

### Rule 3: Use plpgsql SECURITY DEFINER Functions to Break Cycles
When a policy needs to check data from another table that could create a cycle, wrap it in a `LANGUAGE plpgsql SECURITY DEFINER` function. This bypasses RLS on the inner query.

**CRITICAL: Always use `LANGUAGE plpgsql`, never `LANGUAGE sql`.** PostgreSQL can inline `sql` functions, which strips the SECURITY DEFINER context and causes the exact same recursion you were trying to avoid.

### Rule 4: Always Set search_path on SECURITY DEFINER Functions
```sql
SET search_path = public
```
This prevents search_path injection attacks — a Supabase security best practice.

### Rule 5: Audit All Policies When Adding a New One
Before adding a policy, query the existing ones:
```sql
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'your_table' AND schemaname = 'public';
```
Check if the new policy creates a cycle with any existing policy on any table.

### Rule 6: Simple Policies Are Safe
These patterns are always safe and will never cause recursion:
- `auth.uid() = id` (own row)
- `auth.uid() = user_id` (own membership)
- Calling a `plpgsql SECURITY DEFINER` function

---

## Diagnostic Approach (What Worked)

When RLS recursion is suspected, build a **layered diagnostic panel** that tests each component independently:

1. **Auth layer** — `getSession()`, `getUser()`, JWT payload decode
2. **Direct table queries** — test the failing table with minimal selects
3. **RPC function calls** — call SECURITY DEFINER helpers directly to verify they work
4. **Cross-table queries** — test other tables to see if recursion has spread
5. **Raw PostgREST fetch** — bypass supabase-js to confirm it's a server-side issue
6. **Policy introspection** — use a `debug_rls_policies()` function to dump actual policy SQL

The key diagnostic insight: if `RPC is_oxygy_admin()` returns `true` but `SELECT profiles` still fails, there's a **different** recursive policy besides the one you fixed. Iterate until all tables resolve.

---

## Current SECURITY DEFINER Functions in Production

| Function | Purpose | Used By |
|----------|---------|---------|
| `is_oxygy_admin()` | Check if current user has oxygy_admin or super_admin role | Policies on profiles, user_org_memberships |
| `get_admin_org_ids()` | Get org_ids where current user is org admin | Policies on user_org_memberships |
| `get_user_org_ids()` | Get org_ids where current user is any active member | Policies on user_org_memberships (SELECT, INSERT, UPDATE, DELETE) |
| `get_org_colleague_ids()` | Get all user_ids in same org(s) as current user | Policies on profiles, topic_progress, activity_log, artefacts, application_insights |
| `debug_rls_policies()` | Dump all RLS policies for debugging (can be dropped in production) | Admin diagnostics only |

---

## Current RLS Policy Dependency Graph (Safe)

```
profiles policies:
  ├── "Users can read own profile"        → auth.uid() = id (safe)
  ├── "Oxygy admins can read all"         → is_oxygy_admin() (safe, SECURITY DEFINER)
  ├── "Org members can read org profiles" → get_org_colleague_ids() (safe, SECURITY DEFINER)
  └── "Client admins can read org"        → queries user_org_memberships (safe, no cycle back)

user_org_memberships policies:
  ├── "Users can read/view own"           → auth.uid() = user_id (safe)
  ├── "Oxygy admins can manage/read all"  → is_oxygy_admin() (safe, SECURITY DEFINER)
  ├── "Org members can read org"          → get_user_org_ids() (safe, SECURITY DEFINER)
  ├── "Admins can insert"                 → is_oxygy_admin() OR get_user_org_ids() (safe)
  ├── "Org admins can update"             → is_oxygy_admin() OR get_user_org_ids() (safe)
  └── "Org admins can delete"             → is_oxygy_admin() OR get_user_org_ids() (safe)

topic_progress policies:
  ├── "Users can read own"                → auth.uid() = user_id (safe)
  └── "Org members can read org"          → get_org_colleague_ids() (safe, SECURITY DEFINER)

activity_log policies:
  ├── "Users can read own"                → auth.uid() = user_id (safe)
  └── "Org members can read org"          → get_org_colleague_ids() (safe, SECURITY DEFINER)

artefacts policies:
  ├── "Users can read own"                → auth.uid() = user_id (safe)
  └── "Org members can read org"          → get_org_colleague_ids() (safe, SECURITY DEFINER)

application_insights policies:
  ├── "Users can read own"                → auth.uid() = user_id (safe)
  └── "Org members can read org"          → get_org_colleague_ids() (safe, SECURITY DEFINER)
```

No table's policies query another table whose policies query back. All cross-table lookups
use SECURITY DEFINER functions (plpgsql) that bypass RLS on the inner query.
