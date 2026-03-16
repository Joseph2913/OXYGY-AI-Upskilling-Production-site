# PRD-10: Auth & Multi-Tenancy Foundation

> **Status:** Draft
> **Author:** Oxygy Design Agent
> **Date:** 16 March 2026
> **Depends on:** Nothing — this is the foundation PRD
> **Blocks:** PRD-11 (Admin Shell), PRD-12 (Enrollment), PRD-13 (User Mgmt), PRD-14 (Analytics), PRD-15 (Settings), PRD-16 (Client Admin)

---

## 1. Overview

### 1.1 Purpose

This PRD restores real Supabase authentication to the Oxygy AI Upskilling platform, introduces the multi-tenant data model (organisations, cohorts, enrollment channels, audit logging), and adds platform-role-based access control. It is the infrastructure layer that every subsequent admin and multi-tenant PRD depends on.

### 1.2 Background

Authentication was fully implemented and then intentionally stripped out in commit `acf4b68` ("Remove all login/auth functionality — mock user everywhere") to simplify development. The current codebase returns a hardcoded mock user (`mock-user-001`) from `AuthContext.tsx`, bypasses all route guards, and uses no-op stubs for sign-in/sign-out functions.

The existing Supabase schema already contains `organisations`, `user_org_memberships`, and `workshop_sessions` tables — but no frontend code reads or writes to them, and no RLS policies exist for cross-user or cross-org data access.

This PRD restores the original auth flow, extends the schema for multi-tenancy, and wires up role-aware data access — without changing anything the learner sees or does.

### 1.3 Success Criteria

After this PRD is implemented:

1. Users must authenticate (Microsoft SSO, Google SSO, or magic link) to access `/app/*` routes
2. Unauthenticated users hitting `/app/*` are redirected to a login page
3. The marketing site (`/`, all hash routes) remains fully public — no auth required
4. Every authenticated user has a `platform_role` (`learner`, `client_admin`, `oxygy_admin`, or `super_admin`)
5. The new schema tables (`cohorts`, `enrollment_channels`, `audit_log`) exist with correct RLS policies
6. The existing learner experience is functionally identical — same pages, same interactions, same data — the only difference is that the user had to log in first
7. A user with `platform_role = 'oxygy_admin'` can access `/admin/*` routes (placeholder pages for now — PRD-11 builds the actual UI)
8. A user with `platform_role = 'learner'` who navigates to `/admin/*` is redirected to `/app/dashboard`

### 1.4 Non-Goals

This PRD does NOT build:
- The admin interface (PRD-11)
- Enrollment flows or join pages (PRD-12)
- User management UI (PRD-13)
- Analytics dashboards (PRD-14)
- Any new learner-facing features

It strictly provides the auth, schema, and access-control foundation.

---

## 2. Schema Changes

### 2.1 Modified Tables

#### 2.1.1 `profiles` — Add platform role and org-awareness fields

```sql
-- Platform role: determines which route tree the user can access
alter table profiles
  add column if not exists platform_role text default 'learner'
    check (platform_role in ('learner', 'client_admin', 'oxygy_admin', 'super_admin'));

-- Current level and streak (referenced in AppContext but missing from schema)
alter table profiles
  add column if not exists current_level integer default 1
    check (current_level >= 1 and current_level <= 5);
alter table profiles
  add column if not exists streak_days integer default 0;
```

**Notes:**
- `platform_role` is a platform-wide role, independent of org membership. A user can be `oxygy_admin` at the platform level and simultaneously have `role: 'learner'` in a specific org's `user_org_memberships` record.
- `current_level` and `streak_days` already appear in `AppContext.tsx` as mock values. Adding them to the schema allows them to be persisted.

#### 2.1.2 `user_org_memberships` — Add cohort and enrollment tracking

```sql
alter table user_org_memberships
  add column if not exists cohort_id uuid references cohorts(id),
  add column if not exists enrolled_via uuid references enrollment_channels(id);
```

**Notes:**
- `cohort_id` is nullable — not all users belong to a cohort.
- `enrolled_via` tracks which enrollment channel brought the user in (for analytics). Nullable for manually-added users.

#### 2.1.3 `organisations` — Add programme configuration

```sql
alter table organisations
  add column if not exists level_access jsonb default '[1, 2, 3, 4, 5]'::jsonb,
  add column if not exists branding jsonb default '{}'::jsonb,
  add column if not exists max_users integer,
  add column if not exists contact_email text,
  add column if not exists contact_name text;
```

**Field definitions:**
- `level_access`: JSON array of level numbers the org has access to. Default: all five levels. Used by the learner app to filter which levels appear in My Journey.
- `branding`: JSON object for per-org visual overrides. Schema: `{ logo_url?: string, programme_name?: string, welcome_message?: string, primary_color?: string }`. Not used in V1 — included now so the column exists when PRD-16 needs it.
- `max_users`: Optional cap on enrolled users. Null = unlimited.
- `contact_email` / `contact_name`: Primary contact at the client organisation. Used in admin views.

### 2.2 New Tables

#### 2.2.1 `cohorts`

Groups of users within an organisation, typically sharing a start date or workshop schedule.

```sql
create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_cohorts_org_id on cohorts(org_id);
```

#### 2.2.2 `enrollment_channels`

Mechanisms through which users join an organisation — invite links, access codes, or domain-based auto-assignment.

```sql
create table if not exists enrollment_channels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete set null,
  type text not null check (type in ('link', 'code', 'domain')),
  value text not null,
  label text,
  max_uses integer,
  uses_count integer default 0,
  expires_at timestamptz,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Unique constraint: no two active channels can share the same value
  constraint uq_enrollment_channel_value unique (value)
);

-- Indexes
create index if not exists idx_enrollment_channels_org_id on enrollment_channels(org_id);
create index if not exists idx_enrollment_channels_value on enrollment_channels(value);
create index if not exists idx_enrollment_channels_type on enrollment_channels(type);
```

**Field definitions:**
- `type`: `'link'` = URL slug (e.g., `acme-q1-2026`), `'code'` = alphanumeric access code (e.g., `ACME-L1`), `'domain'` = email domain (e.g., `acme.com`)
- `value`: The slug, code, or domain string. Must be globally unique across all channels.
- `label`: Human-readable name for admin UI (e.g., "Q1 2026 London Workshop Link")
- `max_uses`: Null = unlimited. When `uses_count >= max_uses`, the channel is effectively exhausted (treated as inactive).
- `expires_at`: Null = never expires. After this timestamp, the channel is treated as inactive.

#### 2.2.3 `audit_log`

Chronological record of all administrative actions for compliance and debugging.

```sql
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null,
  target_type text,
  target_id uuid,
  org_id uuid references organisations(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists idx_audit_log_actor on audit_log(actor_id);
create index if not exists idx_audit_log_action on audit_log(action);
create index if not exists idx_audit_log_org on audit_log(org_id);
create index if not exists idx_audit_log_created on audit_log(created_at desc);
```

**Action naming convention:** `{entity}.{verb}` — e.g., `org.create`, `org.update`, `org.deactivate`, `user.enroll`, `user.deactivate`, `channel.create`, `channel.deactivate`, `workshop.create`, `workshop.update`.

**Metadata examples:**
```json
// org.create
{ "org_name": "Acme Corp", "tier": "accelerator" }

// user.enroll
{ "user_email": "jane@acme.com", "org_name": "Acme Corp", "channel_type": "link", "channel_label": "Q1 Workshop" }

// channel.create
{ "channel_type": "code", "channel_value": "ACME-L1", "org_name": "Acme Corp" }
```

### 2.3 RLS Policies

#### 2.3.1 Existing tables — updated policies

**`profiles`:**
```sql
-- Learners read/write own profile (existing — no change)
-- Already exists: "Users can read own profile", "Users can upsert own profile", "Users can update own profile"

-- Client admins can read profiles of users in their org
create policy "Client admins can read org profiles"
  on profiles for select
  using (
    exists (
      select 1 from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = profiles.id
    )
  );

-- Oxygy admins can read all profiles
create policy "Oxygy admins can read all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );
```

**`level_progress`:**
```sql
-- Existing learner policies remain unchanged

-- Client admins can read progress for users in their org
create policy "Client admins can read org progress"
  on level_progress for select
  using (
    exists (
      select 1 from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = level_progress.user_id
    )
  );

-- Oxygy admins can read all progress
create policy "Oxygy admins can read all progress"
  on level_progress for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );
```

**`saved_prompts`:**
```sql
-- Existing learner policies remain unchanged

-- Client admins: read-only access to saved prompts in their org (for analytics, not content inspection)
create policy "Client admins can count org prompts"
  on saved_prompts for select
  using (
    exists (
      select 1 from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = saved_prompts.user_id
    )
  );

-- Oxygy admins can read all saved prompts
create policy "Oxygy admins can read all prompts"
  on saved_prompts for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );
```

**`application_insights`:**
```sql
-- Same pattern as saved_prompts — client admin read for analytics, oxygy admin full read
create policy "Client admins can read org insights"
  on application_insights for select
  using (
    exists (
      select 1 from user_org_memberships admin_m
      join user_org_memberships user_m on user_m.org_id = admin_m.org_id
      where admin_m.user_id = auth.uid()
        and admin_m.role = 'admin'
        and user_m.user_id = application_insights.user_id
    )
  );

create policy "Oxygy admins can read all insights"
  on application_insights for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );
```

**`organisations`:**
```sql
alter table organisations enable row level security;

-- Client admins can read their own org
create policy "Client admins can read own org"
  on organisations for select
  using (
    exists (
      select 1 from user_org_memberships m
      where m.user_id = auth.uid()
        and m.org_id = organisations.id
        and m.role = 'admin'
    )
  );

-- Oxygy admins can read all orgs
create policy "Oxygy admins can read all orgs"
  on organisations for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- Oxygy admins can create/update/delete orgs
create policy "Oxygy admins can manage orgs"
  on organisations for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );
```

**`user_org_memberships`:**
```sql
-- Existing learner policy remains: "Users can read own memberships"

-- Client admins can read memberships in their org
create policy "Client admins can read org memberships"
  on user_org_memberships for select
  using (
    exists (
      select 1 from user_org_memberships admin_m
      where admin_m.user_id = auth.uid()
        and admin_m.org_id = user_org_memberships.org_id
        and admin_m.role = 'admin'
    )
  );

-- Oxygy admins can read all memberships
create policy "Oxygy admins can read all memberships"
  on user_org_memberships for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- Oxygy admins can manage memberships
create policy "Oxygy admins can manage memberships"
  on user_org_memberships for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );
```

**`workshop_sessions`:**
```sql
-- Existing policy: "Authenticated users can read sessions" — keep for learners validating codes

-- Oxygy admins can manage sessions
create policy "Oxygy admins can manage sessions"
  on workshop_sessions for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- Client admins can read sessions for their org
create policy "Client admins can read org sessions"
  on workshop_sessions for select
  using (
    exists (
      select 1 from user_org_memberships m
      where m.user_id = auth.uid()
        and m.org_id = workshop_sessions.org_id
        and m.role = 'admin'
    )
  );
```

#### 2.3.2 New tables — policies

**`cohorts`:**
```sql
alter table cohorts enable row level security;

create policy "Oxygy admins can manage cohorts"
  on cohorts for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

create policy "Client admins can read org cohorts"
  on cohorts for select
  using (
    exists (
      select 1 from user_org_memberships m
      where m.user_id = auth.uid()
        and m.org_id = cohorts.org_id
        and m.role = 'admin'
    )
  );

create policy "Learners can read own cohort"
  on cohorts for select
  using (
    exists (
      select 1 from user_org_memberships m
      where m.user_id = auth.uid()
        and m.cohort_id = cohorts.id
    )
  );
```

**`enrollment_channels`:**
```sql
alter table enrollment_channels enable row level security;

create policy "Oxygy admins can manage channels"
  on enrollment_channels for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

create policy "Client admins can read org channels"
  on enrollment_channels for select
  using (
    exists (
      select 1 from user_org_memberships m
      where m.user_id = auth.uid()
        and m.org_id = enrollment_channels.org_id
        and m.role = 'admin'
    )
  );

-- Public read for join flow: anyone can look up a channel by value to validate it
-- This is needed for the /join/:slug route before the user is authenticated
create policy "Public can read active channels by value"
  on enrollment_channels for select
  using (active = true);
```

**`audit_log`:**
```sql
alter table audit_log enable row level security;

-- Only Oxygy admins can read the audit log
create policy "Oxygy admins can read audit log"
  on audit_log for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- Oxygy admins can write to audit log
create policy "Oxygy admins can write audit log"
  on audit_log for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.platform_role in ('oxygy_admin', 'super_admin')
    )
  );

-- System-level writes (from Cloud Functions with service role key) bypass RLS
-- No separate policy needed — Cloud Functions use the service_role key which skips RLS
```

---

## 3. Auth Restoration

### 3.1 What Was Stripped

Commit `acf4b68` removed real auth from four files:

| File | What was removed | What replaced it |
|---|---|---|
| `context/AuthContext.tsx` | Supabase session listener, `getSession()` on mount, real `signIn*` / `signOut` functions, return-route handling | Hardcoded mock user, no-op stubs |
| `components/AuthModal.tsx` | Full modal with Microsoft SSO, Google SSO, magic link email flow (3 views: providers, email input, email sent) | Empty component returning `null` |
| `App.tsx` | `AuthProvider` wrapper around route tree, `AppAuthGuard` on `/app` route | Comments and direct rendering |
| `components/app/AppAuthGuard.tsx` | Was already a no-op bypass even before the commit | Same no-op |

### 3.2 Restoration Plan

#### 3.2.1 `context/AuthContext.tsx`

**Restore to the pre-removal version** (commit `acf4b68^`) with these additions:

1. After `onAuthStateChange` fires `SIGNED_IN`, also fetch the user's profile (including `platform_role`) and org memberships. Store these in context alongside `user` and `session`.
2. Add an `OrgMembership` type and expose it from context:
   ```typescript
   interface OrgMembership {
     orgId: string;
     orgName: string;
     role: 'learner' | 'facilitator' | 'admin';
     cohortId: string | null;
   }
   ```
3. Add `platformRole` to the context value so route guards can check it without a separate DB query.
4. Add `isOxygyAdmin` and `isClientAdmin` computed booleans for convenience.

**Updated context interface:**
```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  platformRole: 'learner' | 'client_admin' | 'oxygy_admin' | 'super_admin' | null;
  orgMemberships: OrgMembership[];
  primaryOrg: OrgMembership | null;  // First active membership — convenience accessor
  isOxygyAdmin: boolean;
  isClientAdmin: boolean;
}
```

**Profile + membership fetch logic** (runs after `SIGNED_IN`):
```typescript
async function loadUserContext(userId: string) {
  // 1. Fetch profile (includes platform_role)
  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role, current_level, streak_days, full_name')
    .eq('id', userId)
    .single();

  // 2. Fetch org memberships with org name
  const { data: memberships } = await supabase
    .from('user_org_memberships')
    .select('org_id, role, cohort_id, organisations(name)')
    .eq('user_id', userId)
    .eq('active', true);

  return { profile, memberships };
}
```

**Auto-create profile on first sign-in:**

When a user signs in for the first time (no profile row exists), create one with defaults:
```typescript
// Inside onAuthStateChange SIGNED_IN handler
const { data: existing } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', user.id)
  .maybeSingle();

if (!existing) {
  await supabase.from('profiles').insert({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    platform_role: 'learner',
    current_level: 1,
    streak_days: 0,
  });
}
```

#### 3.2.2 `components/AuthModal.tsx`

**Restore to the pre-removal version** (commit `acf4b68^`) with these modifications:

1. **Add the `/app/` path-based return route handling** — when the modal is used as a gate for `/app/*` routes, save the intended path and redirect back after sign-in.
2. **Update the description copy** — replace any outdated copy with the current programme framing.
3. **No visual changes to the modal itself** — it was a polished, branded component and should be restored as-is.

#### 3.2.3 `App.tsx`

**Changes:**

1. **Uncomment** the `AuthProvider` import and wrap the entire `<Routes>` tree in `<AuthProvider>`.
2. **Uncomment** the `AppAuthGuard` import.
3. **Wrap the `/app` route** in `<AppAuthGuard>` so all `/app/*` routes require authentication.
4. **Add the `/admin` route tree** with an `<AdminAuthGuard>` (see §3.3).
5. **Add the `/join/:slug` route** as a public route (see §3.4).
6. **Remove the `LoginRedirect` component** — replace with a proper login page that renders `<AuthModal />`.

**Updated route structure:**
```tsx
<AuthProvider>
  <Routes>
    {/* Admin shell — requires oxygy_admin or super_admin */}
    <Route path="/admin" element={<AdminAuthGuard><AdminLayout /></AdminAuthGuard>}>
      <Route index element={<AdminPlaceholder page="Dashboard" />} />
      <Route path="organisations" element={<AdminPlaceholder page="Organisations" />} />
      <Route path="users" element={<AdminPlaceholder page="Users" />} />
      <Route path="content" element={<AdminPlaceholder page="Content" />} />
      <Route path="settings" element={<AdminPlaceholder page="Settings" />} />
    </Route>

    {/* Learner app — requires any authenticated user */}
    <Route path="/app" element={<AppAuthGuard><AppLayout /></AppAuthGuard>}>
      {/* All existing /app/* routes — unchanged */}
    </Route>

    {/* Public join route — enrollment flow */}
    <Route path="/join/:slug" element={<JoinPlaceholder />} />

    {/* Login page */}
    <Route path="/login" element={<LoginPage />} />

    {/* Marketing site — public, no auth */}
    <Route path="*" element={<><HashRedirector /><MarketingSite /></>} />
  </Routes>
</AuthProvider>
```

#### 3.2.4 `components/app/AppAuthGuard.tsx`

**Replace the no-op with a real guard:**

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AppAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a minimal loading spinner — same pattern as AppSuspense
    return (
      <div style={{ padding: 36, background: '#F7FAFC', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 24, height: 24,
          border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%', animation: 'app-spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    // Save the intended destination so we can redirect back after login
    sessionStorage.setItem('oxygy_auth_return_path', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 3.3 New Component: `AdminAuthGuard`

**File:** `components/admin/AdminAuthGuard.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isOxygyAdmin } = useAuth();

  if (loading) {
    // Same loading spinner as AppAuthGuard
    return /* ... */;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isOxygyAdmin) {
    // Authenticated but not an admin — redirect to learner dashboard
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};
```

**`isOxygyAdmin`** is true when `platformRole` is `'oxygy_admin'` or `'super_admin'`.

### 3.4 New Component: `LoginPage`

**File:** `pages/LoginPage.tsx`

A full-page login screen that renders the restored `AuthModal` as the sole content — not as a modal overlay. Styled to match the Oxygy brand.

**Layout:**
- Full viewport, white background
- Centred card (max-width 440px) containing the AuthModal content
- OXYGY logo above the card
- "Back to homepage" link below the card

This replaces the old `LoginRedirect` component which simply forwarded to `/app/dashboard`.

### 3.5 New Placeholder Components

These exist only so the route tree is complete. PRD-11 replaces them with real UI.

**`components/admin/AdminLayout.tsx`:**
- Same structural pattern as `AppLayout.tsx` — sidebar + top bar + `<Outlet />`
- Sidebar with "ADMIN" badge and nav items (Dashboard, Organisations, Users, Content, Settings)
- All nav items link to placeholder pages
- "Switch to Learner View" link in the top bar

**`components/admin/AdminPlaceholder.tsx`:**
- Simple page with the section name as an h1 and "This page will be built in PRD-11" text
- Exists so the route tree doesn't 404

**`pages/JoinPlaceholder.tsx`:**
- Shows "Enrollment flow coming soon" message
- Reads the `:slug` param and displays it
- Exists so the route tree handles `/join/*` URLs

---

## 4. AppContext Updates

### 4.1 Current State

`AppContext.tsx` provides a mock `UserProfile` with hardcoded values:
```typescript
const INITIAL_PROFILE: UserProfile = {
  fullName: 'Joseph Thomas',
  currentLevel: 1,
  streakDays: 5,
};
```

### 4.2 Required Changes

**Replace the mock profile with a real Supabase fetch.**

When `AppProvider` mounts, it should:
1. Get the authenticated user ID from `useAuth()`
2. Fetch the profile from Supabase (`profiles` table)
3. Fetch the user's org membership (if any) to determine org-scoped settings like `level_access`
4. Populate the profile state with real data
5. Provide a `setCurrentLevel` function that writes back to Supabase

**Extended context interface:**
```typescript
interface AppContextValue {
  userProfile: UserProfile | null;
  loading: boolean;
  setCurrentLevel: (level: number) => void;
  orgContext: {
    orgId: string | null;
    orgName: string | null;
    levelAccess: number[];   // which levels this user's org can access
    cohortId: string | null;
    cohortName: string | null;
  } | null;
}
```

**`levelAccess` usage:** My Journey and other pages should filter displayed levels based on `orgContext.levelAccess`. If the user has no org membership, default to all five levels (for development/demo purposes).

### 4.3 Fallback Behaviour

If the profile fetch fails or the user has no profile record yet (first sign-in), use sensible defaults:
```typescript
const DEFAULT_PROFILE: UserProfile = {
  fullName: '',  // populated from auth user_metadata
  currentLevel: 1,
  streakDays: 0,
};
```

---

## 5. Database Helper Updates

### 5.1 `lib/database.ts` — New Functions

Add the following functions to the existing database helper file:

```typescript
// ─── ORGANISATION QUERIES ───

export async function getOrganisation(orgId: string) { /* ... */ }
export async function listOrganisations() { /* ... */ }
export async function createOrganisation(data: CreateOrgInput) { /* ... */ }
export async function updateOrganisation(orgId: string, data: UpdateOrgInput) { /* ... */ }

// ─── MEMBERSHIP QUERIES ───

export async function getUserMemberships(userId: string): Promise<OrgMembership[]> { /* ... */ }
export async function createMembership(data: CreateMembershipInput) { /* ... */ }
export async function deactivateMembership(membershipId: string) { /* ... */ }

// ─── COHORT QUERIES ───

export async function listCohorts(orgId: string) { /* ... */ }
export async function createCohort(data: CreateCohortInput) { /* ... */ }
export async function updateCohort(cohortId: string, data: UpdateCohortInput) { /* ... */ }

// ─── ENROLLMENT CHANNEL QUERIES ───

export async function listChannels(orgId: string) { /* ... */ }
export async function createChannel(data: CreateChannelInput) { /* ... */ }
export async function lookupChannel(value: string) { /* ... */ }
export async function incrementChannelUses(channelId: string) { /* ... */ }
export async function deactivateChannel(channelId: string) { /* ... */ }

// ─── AUDIT LOG ───

export async function writeAuditLog(entry: AuditLogEntry) { /* ... */ }
export async function queryAuditLog(filters: AuditLogFilters) { /* ... */ }
```

**Implementation detail:** All write functions for admin operations should call `writeAuditLog()` internally. For example, `createOrganisation()` should write an audit log entry before returning.

### 5.2 Type Definitions

Add to `types.ts`:

```typescript
// ─── Multi-tenancy types ───

export type PlatformRole = 'learner' | 'client_admin' | 'oxygy_admin' | 'super_admin';
export type OrgTier = 'foundation' | 'accelerator' | 'catalyst';
export type OrgMemberRole = 'learner' | 'facilitator' | 'admin';
export type ChannelType = 'link' | 'code' | 'domain';

export interface Organisation {
  id: string;
  name: string;
  domain: string | null;
  tier: OrgTier | null;
  active: boolean;
  levelAccess: number[];
  branding: OrgBranding;
  maxUsers: number | null;
  contactEmail: string | null;
  contactName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgBranding {
  logoUrl?: string;
  programmeName?: string;
  welcomeMessage?: string;
  primaryColor?: string;
}

export interface OrgMembership {
  id: string;
  userId: string;
  orgId: string;
  orgName: string;
  role: OrgMemberRole;
  cohortId: string | null;
  enrolledVia: string | null;
  enrolledAt: string;
  active: boolean;
}

export interface Cohort {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface EnrollmentChannel {
  id: string;
  orgId: string;
  cohortId: string | null;
  type: ChannelType;
  value: string;
  label: string | null;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  orgId?: string;
  metadata?: Record<string, unknown>;
}
```

---

## 6. Migration Strategy

### 6.1 SQL Migration Script

All schema changes should be consolidated into a single migration script that can be run in Supabase SQL Editor. The script must be idempotent (`if not exists` / `if not exists` on all operations).

**Order of operations:**
1. Alter `profiles` (add columns)
2. Alter `organisations` (add columns)
3. Create `cohorts` table
4. Create `enrollment_channels` table
5. Alter `user_org_memberships` (add columns — depends on `cohorts` and `enrollment_channels`)
6. Create `audit_log` table
7. Create indexes
8. Enable RLS on new tables
9. Create all new RLS policies
10. Seed the initial Oxygy admin user

### 6.2 Seed Data

After running the migration, insert the initial Oxygy organisation and admin user:

```sql
-- 1. Create the Oxygy internal org
insert into organisations (name, domain, tier, active, level_access)
values ('OXYGY (Internal)', 'oxygy.ai', 'catalyst', true, '[1,2,3,4,5]'::jsonb)
on conflict do nothing;

-- 2. After Joseph signs in for the first time, run this to set his platform role:
-- (Replace the UUID with his actual auth.users.id after first sign-in)
-- update profiles set platform_role = 'super_admin' where id = '<joseph-user-id>';
```

**Note:** The admin role assignment is a manual step after first sign-in. There is no self-service way to become an admin — this is intentional. In production, a super_admin runs the SQL to promote other users.

---

## 7. File Changes Summary

### 7.1 Modified Files

| File | Change |
|---|---|
| `context/AuthContext.tsx` | Restore real auth from commit `acf4b68^`, add `platformRole`, `orgMemberships`, `isOxygyAdmin`, `isClientAdmin` to context |
| `context/AppContext.tsx` | Replace mock profile with real Supabase fetch, add `orgContext` with `levelAccess` |
| `components/AuthModal.tsx` | Restore full modal from commit `acf4b68^`, update copy |
| `components/app/AppAuthGuard.tsx` | Replace no-op with real auth check + redirect to `/login` |
| `App.tsx` | Wrap in `AuthProvider`, gate `/app` with `AppAuthGuard`, add `/admin` route tree with `AdminAuthGuard`, add `/join/:slug` and `/login` routes, remove `LoginRedirect` |
| `lib/database.ts` | Add org, membership, cohort, channel, audit log query functions |
| `types.ts` | Add multi-tenancy types (`Organisation`, `OrgMembership`, `Cohort`, `EnrollmentChannel`, `AuditLogEntry`, role types) |
| `supabase/schema.sql` | Update to reflect all new tables, columns, indexes, and RLS policies |

### 7.2 New Files

| File | Purpose |
|---|---|
| `components/admin/AdminAuthGuard.tsx` | Route guard: redirects non-admins to `/app/dashboard` |
| `components/admin/AdminLayout.tsx` | Placeholder admin shell (sidebar + top bar + Outlet) — replaced in PRD-11 |
| `components/admin/AdminPlaceholder.tsx` | Generic placeholder page for admin routes |
| `pages/LoginPage.tsx` | Full-page login screen with AuthModal |
| `pages/JoinPlaceholder.tsx` | Placeholder for `/join/:slug` enrollment route |
| `supabase/migration-010-auth-multitenancy.sql` | Consolidated, idempotent migration script |

### 7.3 Files NOT Changed

Every file in `components/app/toolkit/`, `components/app/level/`, `pages/app/`, `components/dashboard/`, and all data files remain untouched. These files already import `useAuth()` and use `user.id` — they will continue to work because the restored `useAuth()` returns a real Supabase `User` object with the same `.id` property structure as the mock.

---

## 8. Edge Cases & Risk Mitigation

### 8.1 Existing data tied to `mock-user-001`

The mock user ID `mock-user-001` may have been used to write test data to Supabase (profiles, saved_prompts, level_progress, etc.). After auth restoration, this data will be orphaned because no real Supabase auth user has that ID.

**Mitigation:** Document this as a known issue. In development, the test data can be deleted or reassigned. In production, no real user data exists under the mock ID.

### 8.2 Supabase auth providers not configured

The original code supports Microsoft (Azure) SSO, Google SSO, and magic link. These require configuration in Supabase Dashboard → Authentication → Providers.

**Mitigation:** The PRD should include a setup checklist (§9) that the developer follows to enable each provider. The `AuthModal` should gracefully handle cases where a provider is not yet configured — show the button but handle the error with a user-friendly message rather than crashing.

### 8.3 Users without org memberships

After auth is restored, authenticated users may have no org membership (e.g., Oxygy team members, demo accounts). The learner app must handle this gracefully.

**Mitigation:** If `orgMemberships` is empty, the learner app should:
- Show all five levels in My Journey (no `levelAccess` filtering)
- Not show the "My Cohort" nav item (or show it with a "Not enrolled in a cohort" message)
- Otherwise function normally

### 8.4 RLS policy performance

The admin RLS policies involve joins across `user_org_memberships` and `profiles`. At scale, these could slow down queries.

**Mitigation:** The indexes defined in §2.2 cover the primary join columns. For V1 with expected user counts under 1000, this is not a concern. If performance degrades, consider adding a `is_admin` boolean column on `profiles` as a denormalized fast-check, updated by a trigger.

### 8.5 Session expiry and token refresh

Supabase auth tokens expire after 1 hour by default. The existing `supabase.ts` config has `autoRefreshToken: true`, which should handle this transparently.

**Mitigation:** Test that long-running sessions (user leaves tab open for hours) don't break. The `onAuthStateChange` listener should pick up the `TOKEN_REFRESHED` event and update the session in context.

---

## 9. Implementation Checklist

### Pre-implementation setup

- [ ] Enable Google auth provider in Supabase Dashboard → Authentication → Providers
- [ ] Enable Azure (Microsoft) auth provider in Supabase Dashboard → Authentication → Providers
- [ ] Verify magic link email templates are configured in Supabase Dashboard → Authentication → Email Templates
- [ ] Set the Site URL in Supabase Dashboard → Authentication → URL Configuration to the production domain
- [ ] Add `localhost:5173` (Vite dev) and the production domain to Redirect URLs in Supabase
- [ ] Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`

### Schema migration

- [ ] Run `supabase/migration-010-auth-multitenancy.sql` in Supabase SQL Editor
- [ ] Verify all new tables exist: `cohorts`, `enrollment_channels`, `audit_log`
- [ ] Verify all new columns exist on `profiles`, `organisations`, `user_org_memberships`
- [ ] Verify RLS is enabled on all new tables
- [ ] Verify all new policies are active (check Supabase Dashboard → Database → Policies)

### Code changes

- [ ] Restore `context/AuthContext.tsx` with extended context values
- [ ] Restore `components/AuthModal.tsx`
- [ ] Implement real `AppAuthGuard` with redirect to `/login`
- [ ] Create `AdminAuthGuard` with platform role check
- [ ] Create `LoginPage` with full-page AuthModal
- [ ] Create admin placeholder components (`AdminLayout`, `AdminPlaceholder`)
- [ ] Create `JoinPlaceholder` for `/join/:slug`
- [ ] Update `App.tsx` route tree with auth wrappers and new routes
- [ ] Update `context/AppContext.tsx` to fetch real profile and org context
- [ ] Add multi-tenancy types to `types.ts`
- [ ] Add database helper functions to `lib/database.ts`
- [ ] Update `supabase/schema.sql` to reflect complete current schema

### Post-implementation verification

- [ ] **Marketing site is fully public** — all hash routes accessible without login
- [ ] **`/app/dashboard` redirects to `/login` when not authenticated**
- [ ] **After sign-in, user lands on `/app/dashboard`** (or their intended return path)
- [ ] **Profile is created automatically on first sign-in** with `platform_role = 'learner'`
- [ ] **All existing learner pages work identically** — Dashboard, Journey, Level, Toolkit (all 5 tools), Artefacts
- [ ] **`useAuth()` returns a real Supabase user** with `.id`, `.email`, `.user_metadata`
- [ ] **Toolkit tools can save to database** — test Prompt Playground save, Agent Builder save, etc.
- [ ] **Workshop code validation still works** — test entering a code in Level Progress
- [ ] **`/admin` redirects to `/app/dashboard`** for a learner-role user
- [ ] **`/admin` shows placeholder pages** for a user with `platform_role = 'oxygy_admin'`
- [ ] **Sign out returns to marketing site** and clears the session
- [ ] **Session persists across page refreshes** — user doesn't need to log in again
- [ ] **`/join/test-slug` shows the join placeholder** — accessible without auth

---

## 10. Developer Notes

### 10.1 Supabase Auth User vs. Profile

There are two "user" records:
- `auth.users` — managed by Supabase Auth, contains email, password hash, OAuth tokens. Accessed via `supabase.auth.getUser()`.
- `profiles` — our custom table, keyed by `auth.users.id`. Contains app-specific data (name, role, level, etc.). Accessed via `supabase.from('profiles').select(...)`.

Every `profiles.id` is a foreign key to `auth.users.id`. The profile is created by our code on first sign-in, not by Supabase Auth.

### 10.2 Hosting Considerations

No Firebase hosting or Cloud Function changes are required for this PRD. The new routes (`/admin/*`, `/join/*`, `/login`) are all handled by the SPA's client-side router — the catch-all rewrite in `firebase.json` (`"source": "**", "destination": "/index.html"`) already covers them.

### 10.3 Testing Without Real SSO

During development, if Microsoft/Google SSO is not yet configured in Supabase, use the magic link flow exclusively. The AuthModal should show all three options but handle provider errors gracefully.

Alternatively, use Supabase's Dashboard → Authentication → Users → "Create User" to manually create test accounts with email/password auth.

### 10.4 Promoting a User to Admin

After sign-in, run this SQL to promote a user:
```sql
update profiles
set platform_role = 'oxygy_admin'
where id = (
  select id from auth.users where email = 'joseph@oxygy.ai'
);
```

There is no self-service admin promotion. This is intentional — admin access is granted by someone with direct database access.

---

*End of PRD-10*
