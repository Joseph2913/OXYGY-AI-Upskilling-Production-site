# PRD: Phase 4 — Org Scoping, Cohort, Leaderboard & Streaks

> **Status:** Ready for implementation
> **Author:** Oxygy Design Agent
> **Date:** 2026-03-16
> **Depends on:** Phase 1 (Auth, Orgs schema), Phase 2 (Progress tracking, Activity log), Phase 3 (Artefacts)
> **Codebase ref:** `https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site.git`

---

## 1. Overview

### Purpose

Add the multi-tenant organisation layer. Users belong to organisations. Progress, leaderboards, and cohort views are scoped to the user's org. Admins can manage their org, invite users, create workshop sessions, and view aggregate analytics. Streak tracking becomes real, derived from the `activity_log` table built in Phase 2.

### What this phase delivers

1. **Org context** — authenticated users are associated with an organisation via `user_org_memberships`; org context propagates through the app
2. **Org join flow** — new users can join an org via invite link or org code during onboarding
3. **Real leaderboard** — dashboard leaderboard shows org colleagues ranked by a transparent scoring algorithm
4. **My Cohort page** — full cohort view showing all org members, their levels, progress, and activity
5. **Real streak tracking** — streaks calculated from `activity_log` (table created in Phase 2)
6. **Org-scoped workshop codes** — workshop code validation checks against the user's org
7. **Admin panel** — org admins can invite users, manage members, create workshop sessions, and view aggregate progress
8. **Active days tracking** — the `activeDaysThisWeek` array on the dashboard is derived from real activity data

### What this phase does NOT include

- Multi-org membership (a user belongs to one org at a time)
- Org-level billing or subscription management
- Cross-org analytics or Oxygy-wide admin dashboard
- SSO/SAML enforcement per org (uses the same Google/Microsoft OAuth from Phase 1)

---

## 2. Data Model

### 2.1 Existing Tables (no changes needed)

These tables were created in Phase 1 and are ready for use:

| Table | Purpose |
|-------|---------|
| `organisations` | Org identity: name, domain, tier, active flag |
| `user_org_memberships` | Links users to orgs with role (learner / facilitator / admin) |
| `workshop_sessions` | Org-scoped workshop session codes |

### 2.2 Schema Modifications

**Add `org_id` to `profiles` for fast lookups:**

```sql
alter table profiles add column if not exists org_id uuid references organisations(id);
```

This is denormalised from `user_org_memberships` for convenience — avoids a join on every profile fetch. Kept in sync when a membership is created or changed.

**Add invite tracking:**

```sql
-- 13. ORG INVITES
create table if not exists org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  email text,                                     -- null = open invite link
  invite_code text not null unique,               -- 8-char alphanumeric code
  role text not null default 'learner' check (role in ('learner', 'facilitator', 'admin')),
  created_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

alter table org_invites enable row level security;

-- Admins can manage invites for their org
create policy "Org admins can manage invites" on org_invites
  for all using (
    org_id in (
      select org_id from user_org_memberships
      where user_id = auth.uid() and role = 'admin' and active = true
    )
  );
-- Anyone can read an invite by code (for the join flow)
create policy "Anyone can read invite by code" on org_invites
  for select using (true);
```

**Expand `activity_log` RLS for org-scoped reads:**

```sql
-- Allow org members to read activity for colleagues in the same org
create policy "Org members can read org activity" on activity_log
  for select using (
    user_id in (
      select m2.user_id from user_org_memberships m1
      join user_org_memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m1.active = true and m2.active = true
    )
  );
```

**Expand `profiles` RLS for org-scoped reads:**

```sql
-- Allow org members to read profiles of colleagues
create policy "Org members can read org profiles" on profiles
  for select using (
    id in (
      select m2.user_id from user_org_memberships m1
      join user_org_memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m1.active = true and m2.active = true
    )
  );
```

**Expand `topic_progress` RLS for org-scoped reads:**

```sql
create policy "Org members can read org topic progress" on topic_progress
  for select using (
    user_id in (
      select m2.user_id from user_org_memberships m1
      join user_org_memberships m2 on m1.org_id = m2.org_id
      where m1.user_id = auth.uid() and m1.active = true and m2.active = true
    )
  );
```

### 2.3 Org Context Data Flow

```
User signs in
    │
    ▼
AuthContext (user.id)
    │
    ▼
AppContext fetches profile → profile.org_id
    │
    ▼
OrgContext (new) → fetches org details + user's role
    │
    ├──► Dashboard leaderboard (org-scoped)
    ├──► My Cohort page (org-scoped)
    ├──► Workshop code validation (org-scoped)
    └──► Admin panel (if role = admin)
```

---

## 3. File Changes — Complete List

| File | Action | Summary |
|------|--------|---------|
| `supabase/schema.sql` | **Modify** | Add `org_invites` table, `org_id` on profiles, expanded RLS policies |
| `context/OrgContext.tsx` | **New** | Org identity, role, and member list context |
| `context/AppContext.tsx` | **Modify** | Expose `orgId` from profile |
| `lib/database.ts` | **Modify** | Add org CRUD, invite functions, cohort queries, streak calculation |
| `hooks/useDashboardData.ts` | **Modify** | Real leaderboard from org-scoped queries; real streak and active days |
| `pages/app/AppCohort.tsx` | **Rewrite** | Full cohort page with member list, stats, and filters |
| `pages/app/AppOnboarding.tsx` | **Modify** | Add org join step (invite code or link) |
| `pages/app/AppDashboard.tsx` | **Modify** | Replace leaderboard placeholder with real component |
| `pages/app/AppAdmin.tsx` | **New** | Admin panel for org management |
| `components/app/AppSidebar.tsx` | **Modify** | Show admin nav item for admin users |
| `components/app/AppLayout.tsx` | **Modify** | Wrap with OrgProvider |
| `components/dashboard/sections/MyProgress.tsx` | **Modify** | Pass real org_id to workshop code validation |
| `App.tsx` | **Modify** | Add admin route |

---

## 4. OrgContext — New Context

### `context/OrgContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface OrgMember {
  userId: string;
  fullName: string;
  role: 'learner' | 'facilitator' | 'admin';
  currentLevel: number;
  enrolledAt: Date;
}

interface OrgContextValue {
  orgId: string | null;
  orgName: string | null;
  orgTier: string | null;
  userRole: 'learner' | 'facilitator' | 'admin' | null;
  members: OrgMember[];
  loading: boolean;
  isAdmin: boolean;
  isFacilitator: boolean;
  refreshOrg: () => void;
}

const OrgContext = createContext<OrgContextValue>({
  orgId: null, orgName: null, orgTier: null, userRole: null,
  members: [], loading: true, isAdmin: false, isFacilitator: false,
  refreshOrg: () => {},
});

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<OrgContextValue, 'refreshOrg'>>({
    orgId: null, orgName: null, orgTier: null, userRole: null,
    members: [], loading: true, isAdmin: false, isFacilitator: false,
  });

  const fetchOrg = async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // 1. Get user's org membership
    const { data: membership } = await supabase
      .from('user_org_memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // 2. Get org details
    const { data: org } = await supabase
      .from('organisations')
      .select('name, tier')
      .eq('id', membership.org_id)
      .single();

    // 3. Get all active members with their profiles
    const { data: members } = await supabase
      .from('user_org_memberships')
      .select(`
        user_id, role, enrolled_at,
        profiles!inner(full_name, current_level)
      `)
      .eq('org_id', membership.org_id)
      .eq('active', true);

    const memberList: OrgMember[] = (members || []).map((m: any) => ({
      userId: m.user_id,
      fullName: m.profiles?.full_name || 'Unknown',
      role: m.role,
      currentLevel: m.profiles?.current_level || 1,
      enrolledAt: new Date(m.enrolled_at),
    }));

    const userRole = membership.role as 'learner' | 'facilitator' | 'admin';

    setState({
      orgId: membership.org_id,
      orgName: org?.name || null,
      orgTier: org?.tier || null,
      userRole,
      members: memberList,
      loading: false,
      isAdmin: userRole === 'admin',
      isFacilitator: userRole === 'facilitator' || userRole === 'admin',
    });
  };

  useEffect(() => { fetchOrg(); }, [user]);

  return (
    <OrgContext.Provider value={{ ...state, refreshOrg: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
};

export function useOrg() {
  return useContext(OrgContext);
}
```

### Wrap in AppLayout

```typescript
// components/app/AppLayout.tsx
import { OrgProvider } from '../../context/OrgContext';

export const AppLayout: React.FC = () => (
  <AppProvider>
    <OrgProvider>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <AppSidebar />
        {/* ... rest unchanged ... */}
      </div>
    </OrgProvider>
  </AppProvider>
);
```

---

## 5. Org Join Flow — Onboarding Addition

### Add a step to the onboarding wizard (Phase 1, §11)

Insert as **Step 0** (before the current Step 1 "Who You Are"), or as the **final step** before generating the learning plan. The recommended position is **final step** — collect profile data first, then associate with an org.

### Step: "Join Your Organisation"

```
┌─────────────────────────────────────────────────────┐
│  Join Your Organisation                              │
│                                                      │
│  If your organisation has set up an Oxygy workspace, │
│  enter the invite code or link you received.         │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │  Invite code   [________]  [Join →]         │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
│  ✓  Joined: Oxygy Consulting (12 members)            │
│  ── or ──                                            │
│  ✗  Invalid code — check with your admin             │
│                                                      │
│  ─────────────────────────────────────────────       │
│  Don't have a code? [Skip — continue as individual]  │
└─────────────────────────────────────────────────────┘
```

### Behaviour

1. User enters an 8-character invite code
2. Frontend calls `validateAndAcceptInvite(userId, code)`
3. If valid: creates a `user_org_memberships` row, updates `profiles.org_id`, shows success with org name and member count
4. If invalid or expired: shows error message
5. "Skip" button proceeds without joining an org — the user operates as an individual (no cohort, no leaderboard)

### Database function

```typescript
export async function validateAndAcceptInvite(
  userId: string,
  code: string,
): Promise<{ success: boolean; orgName?: string; memberCount?: number; error?: string }> {
  // 1. Find the invite
  const { data: invite, error: findErr } = await supabase
    .from('org_invites')
    .select('id, org_id, role, email, accepted_by, expires_at')
    .eq('invite_code', code)
    .maybeSingle();

  if (findErr || !invite) return { success: false, error: 'Invalid invite code' };
  if (invite.accepted_by && invite.email) return { success: false, error: 'This invite has already been used' };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { success: false, error: 'This invite has expired' };

  // 2. Check user isn't already in an org
  const { data: existing } = await supabase
    .from('user_org_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (existing) return { success: false, error: 'You are already a member of an organisation' };

  // 3. Create membership
  const { error: memberErr } = await supabase
    .from('user_org_memberships')
    .insert({
      user_id: userId,
      org_id: invite.org_id,
      role: invite.role,
    });
  if (memberErr) return { success: false, error: 'Failed to join organisation' };

  // 4. Update profile with org_id
  await supabase
    .from('profiles')
    .update({ org_id: invite.org_id })
    .eq('id', userId);

  // 5. Mark invite as accepted (for email-specific invites)
  if (invite.email) {
    await supabase
      .from('org_invites')
      .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  // 6. Get org info for confirmation
  const { data: org } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', invite.org_id)
    .single();

  const { count } = await supabase
    .from('user_org_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', invite.org_id)
    .eq('active', true);

  return {
    success: true,
    orgName: org?.name || 'Your organisation',
    memberCount: count || 1,
  };
}
```

---

## 6. Scoring Algorithm

The leaderboard ranks users by a single aggregate score. The algorithm must be transparent — users can see how their score is calculated.

### Formula

```
Score = (Completion × 4) + (Artefacts × 25) + (Insights × 30) + (Streak × 5) + (Activity Bonus)
```

| Component | How Calculated | Max Contribution |
|-----------|---------------|-----------------|
| **Completion** | Number of phases completed across all levels (20 phases total = 5 levels × 4 phases). Each phase = 4 points. | 80 pts |
| **Artefacts** | Number of artefacts saved (non-archived). Each = 25 points, capped at 20. | 500 pts |
| **Insights** | Number of application insights submitted. Each = 30 points, capped at 10. | 300 pts |
| **Streak** | Current streak in days. Each day = 5 points, capped at 14 days. | 70 pts |
| **Activity Bonus** | Number of distinct days active in the past 30 days. Each day = 2 points. | 60 pts |

**Total possible:** ~1010 points

### Implementation

```typescript
export interface ScoredMember {
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  role: string;
  level: number;
  score: number;
  completionPct: number;
  streakDays: number;
  artefactCount: number;
  insightCount: number;
  activeDays30: number;
  isCurrentUser: boolean;
}

export async function getOrgLeaderboard(
  orgId: string,
  currentUserId: string,
): Promise<ScoredMember[]> {
  // 1. Get all active members
  const { data: members } = await supabase
    .from('user_org_memberships')
    .select('user_id, role')
    .eq('org_id', orgId)
    .eq('active', true);

  if (!members || members.length === 0) return [];

  const userIds = members.map(m => m.user_id);

  // 2. Batch fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, current_level, streak_days')
    .in('id', userIds);

  // 3. Batch fetch phase completions
  const { data: topicRows } = await supabase
    .from('topic_progress')
    .select('user_id, elearn_completed_at, read_completed_at, watch_completed_at, practise_completed_at')
    .in('user_id', userIds);

  // 4. Batch fetch artefact counts
  const { data: artefactRows } = await supabase
    .from('artefacts')
    .select('user_id')
    .in('user_id', userIds)
    .is('archived_at', null);

  // 5. Batch fetch insight counts
  const { data: insightRows } = await supabase
    .from('application_insights')
    .select('user_id')
    .in('user_id', userIds);

  // 6. Batch fetch activity counts (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: activityRows } = await supabase
    .from('activity_log')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .gte('created_at', thirtyDaysAgo);

  // 7. Compute scores
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const memberRoleMap = new Map(members.map(m => [m.user_id, m.role]));

  // Phase completions per user
  const phaseCountMap = new Map<string, number>();
  (topicRows || []).forEach(row => {
    const count = phaseCountMap.get(row.user_id) || 0;
    let phases = 0;
    if (row.elearn_completed_at) phases++;
    if (row.read_completed_at) phases++;
    if (row.watch_completed_at) phases++;
    if (row.practise_completed_at) phases++;
    phaseCountMap.set(row.user_id, count + phases);
  });

  // Artefact counts per user
  const artefactCountMap = new Map<string, number>();
  (artefactRows || []).forEach(row => {
    artefactCountMap.set(row.user_id, (artefactCountMap.get(row.user_id) || 0) + 1);
  });

  // Insight counts per user
  const insightCountMap = new Map<string, number>();
  (insightRows || []).forEach(row => {
    insightCountMap.set(row.user_id, (insightCountMap.get(row.user_id) || 0) + 1);
  });

  // Active days per user (distinct calendar days in last 30 days)
  const activeDaysMap = new Map<string, number>();
  const userDaySets = new Map<string, Set<string>>();
  (activityRows || []).forEach(row => {
    const day = row.created_at.split('T')[0];
    if (!userDaySets.has(row.user_id)) userDaySets.set(row.user_id, new Set());
    userDaySets.get(row.user_id)!.add(day);
  });
  userDaySets.forEach((days, userId) => activeDaysMap.set(userId, days.size));

  // AVATAR COLORS — rotate through a palette
  const PALETTE = ['#A8F0E0', '#C3D0F5', '#F5B8A0', '#F7E8A4', '#38B2AC', '#E9D5FF', '#FED7AA', '#FECACA', '#D1FAE5', '#E0E7FF'];

  const scored: ScoredMember[] = userIds.map((userId, idx) => {
    const profile = profileMap.get(userId);
    const phasesCompleted = phaseCountMap.get(userId) || 0;
    const artefactCount = Math.min(artefactCountMap.get(userId) || 0, 20);
    const insightCount = Math.min(insightCountMap.get(userId) || 0, 10);
    const streakDays = Math.min(profile?.streak_days || 0, 14);
    const activeDays30 = Math.min(activeDaysMap.get(userId) || 0, 30);

    const score =
      (phasesCompleted * 4) +
      (artefactCount * 25) +
      (insightCount * 30) +
      (streakDays * 5) +
      (activeDays30 * 2);

    const totalPhases = 20; // 5 levels × 4 phases
    const completionPct = Math.round((phasesCompleted / totalPhases) * 100);

    const fullName = profile?.full_name || 'Unknown';
    const initials = fullName.split(' ').map((n: string) => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U';

    return {
      userId,
      fullName,
      initials,
      avatarColor: PALETTE[idx % PALETTE.length],
      role: memberRoleMap.get(userId) || 'learner',
      level: profile?.current_level || 1,
      score,
      completionPct,
      streakDays: profile?.streak_days || 0,
      artefactCount: artefactCountMap.get(userId) || 0,
      insightCount: insightCountMap.get(userId) || 0,
      activeDays30: activeDaysMap.get(userId) || 0,
      isCurrentUser: userId === currentUserId,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
```

---

## 7. Streak Calculation

### Definition

A **streak day** is a calendar day (in the user's timezone, approximated as UTC) on which at least one `activity_log` entry exists.

A **streak** is the number of consecutive days ending with today (or yesterday, to allow for timezone tolerance) that have activity.

### Implementation

```typescript
export async function calculateStreak(userId: string): Promise<number> {
  // Fetch last 60 days of activity (enough for any reasonable streak)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', sixtyDaysAgo)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return 0;

  // Get unique days
  const days = new Set<string>();
  data.forEach(row => {
    days.add(row.created_at.split('T')[0]); // YYYY-MM-DD
  });

  const sortedDays = Array.from(days).sort().reverse(); // most recent first

  // Check if today or yesterday is present (grace period)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!days.has(today) && !days.has(yesterday)) return 0;

  // Count consecutive days backwards from the most recent active day
  let streak = 0;
  let checkDate = new Date(sortedDays[0]);

  for (const day of sortedDays) {
    const expected = checkDate.toISOString().split('T')[0];
    if (day === expected) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000); // previous day
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Update the user's streak_days in their profile.
 * Called when the dashboard loads or when activity is logged.
 */
export async function updateStreak(userId: string): Promise<number> {
  const streak = await calculateStreak(userId);
  await supabase
    .from('profiles')
    .update({ streak_days: streak, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return streak;
}
```

### Active Days This Week

```typescript
export async function getActiveDaysThisWeek(userId: string): Promise<boolean[]> {
  // Get Monday of the current week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', monday.toISOString());

  const activeDays = Array(7).fill(false);
  (data || []).forEach(row => {
    const d = new Date(row.created_at);
    const dow = d.getDay();
    const monBased = dow === 0 ? 6 : dow - 1;
    activeDays[monBased] = true;
  });

  return activeDays;
}
```

---

## 8. useDashboardData.ts — Final Updates

### Replace Phase 2 placeholders with real queries

The Phase 2 rewrite left three items as placeholders. Replace them now:

**1. Leaderboard — real org-scoped data:**

```typescript
// Replace the single-user placeholder with:
if (orgId) {
  leaderboard = await getOrgLeaderboard(orgId, user.id);
  activeColleaguesCount = leaderboard.length;
  sameLevelColleaguesCount = leaderboard.filter(m => m.level === currentLevel).length;
} else {
  // No org — show only the current user
  leaderboard = [{ /* single user entry from Phase 2 */ }];
  activeColleaguesCount = 0;
  sameLevelColleaguesCount = 0;
}
```

**2. Streak — real calculation:**

```typescript
const streak = await updateStreak(user.id);
// Use the returned streak instead of userProfile.streakDays
```

**3. Active days — real data:**

```typescript
const activeDaysThisWeek = await getActiveDaysThisWeek(user.id);
```

### Updated fetch flow

```typescript
const [topicProgressRows, artefactCounts, levelProgressRows, leaderboard, activeDaysThisWeek] =
  await Promise.all([
    getAllTopicProgress(user.id),
    getArtefactCountsByLevel(user.id),
    getLevelProgress(user.id),
    orgId ? getOrgLeaderboard(orgId, user.id) : Promise.resolve([]),
    getActiveDaysThisWeek(user.id),
  ]);

const streak = await updateStreak(user.id);
```

---

## 9. AppDashboard.tsx — Leaderboard Restoration

### Replace the "Coming Soon" placeholder (from Phase 2) with the real leaderboard component

The `LeaderboardRow` component already exists in `AppDashboard.tsx` (lines 120–210). It renders correctly with the `LeaderboardMember` interface. The only changes needed:

1. **Conditional rendering:** Show the leaderboard section only when `data.leaderboard.length > 1` (the user plus at least one colleague). Otherwise show the Phase 2 placeholder.
2. **Score tooltip:** Add a hover tooltip on the score showing the breakdown:
   ```
   Completion: 48 pts
   Artefacts:  125 pts
   Insights:   90 pts
   Streak:     35 pts
   Activity:   18 pts
   ```

### Existing `LeaderboardMember` interface update

Add `artefactCount`, `insightCount`, and `activeDays30` fields so the score explainer can show breakdowns. Map from `ScoredMember` to `LeaderboardMember`:

```typescript
// Map ScoredMember to existing LeaderboardMember interface
const mappedLeaderboard: LeaderboardMember[] = leaderboard.map(m => ({
  name: m.fullName,
  initials: m.initials,
  avatarColor: m.avatarColor,
  level: m.level,
  score: m.score,
  completionPct: m.completionPct,
  streakDays: m.streakDays,
  useCasesIdentified: m.insightCount,
  assessmentAvg: 0, // deprecated — remove from interface in future cleanup
  isCurrentUser: m.isCurrentUser,
}));
```

---

## 10. My Cohort Page — Full Rewrite

### `pages/app/AppCohort.tsx`

Replace the placeholder with a full cohort management page.

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│  My Cohort                                          │
│  "Your team's AI upskilling progress at a glance"   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌── Org Info Card ──────────────────────────────┐  │
│  │  Oxygy Consulting  ·  Catalyst tier           │  │
│  │  12 members  ·  Avg Level 3.2  ·  6 active    │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌── Filters ────────────────────────────────────┐  │
│  │  [All] [L1] [L2] [L3] [L4] [L5]   🔍 Search │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌── Member Cards (grid) ────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │ JT  L5      │  │ AK  L5      │            │  │
│  │  │ Joseph T.   │  │ Amira K.    │            │  │
│  │  │ ████░░ 82%  │  │ █████░ 88%  │            │  │
│  │  │ 🔥 5 days   │  │ 🔥 7 days   │            │  │
│  │  │ 6 artefacts │  │ 8 artefacts │            │  │
│  │  └─────────────┘  └─────────────┘            │  │
│  │  ...                                          │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌── Aggregate Stats ────────────────────────────┐  │
│  │  Level Distribution  │  Weekly Activity Chart  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### No-Org State

If the user has no `orgId`, show:

```
┌─────────────────────────────────────────────────────┐
│  My Cohort                                          │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  👥  No organisation linked                    │  │
│  │                                                │  │
│  │  Join an organisation to see your cohort's     │  │
│  │  progress and compare your journey with        │  │
│  │  colleagues.                                   │  │
│  │                                                │  │
│  │  [Enter invite code]                           │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Org Info Card

- `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 14`, `padding: 20px 24px`
- Org name: DM Sans, `fontSize: 18`, `fontWeight: 700`, `color: #1A202C`
- Tier badge: pill, `background: #E6FFFA`, `color: #38B2AC`, `fontSize: 11`, `fontWeight: 700`, uppercase
- Stats row: member count, average level, active members this week — `fontSize: 13`, `color: #718096`, separated by `·`

### Member Card

- `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 16px`
- 3-column grid on desktop, 2 on tablet, 1 on mobile
- Avatar circle: 36px, `background: avatarColor`, initials centred
- Name: `fontSize: 14`, `fontWeight: 700`, `color: #1A202C`
- Level badge: small pill, uses level accent colors
- Progress bar: `height: 4px`, `borderRadius: 2`, fill colour = level accent
- Completion percentage: `fontSize: 12`, `fontWeight: 700`, `color: #1A202C`
- Streak: `fontSize: 12`, `color: #718096`
- Artefact count: `fontSize: 12`, `color: #718096`
- Current user's card has a `borderLeft: 3px solid #38B2AC` accent

### Level Filter Pills

- Row of pills: "All", "L1", "L2", "L3", "L4", "L5"
- Active: `background: #1A202C`, `color: #FFFFFF`
- Inactive: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `color: #4A5568`
- `borderRadius: 20`, `padding: 5px 14px`, `fontSize: 12`, `fontWeight: 600`

### Aggregate Stats Section

**Level Distribution:**
- Horizontal bar chart showing how many members are at each level
- 5 bars, each labelled "L1" through "L5"
- Bar fill uses level accent colors
- Count label at end of each bar

**Weekly Activity:**
- Simple 7-column bar chart (Mon–Sun)
- Each bar height = number of org members active that day
- Uses `activity_log` aggregate query

### Data fetching

```typescript
import { useOrg } from '../../context/OrgContext';

// Inside the component:
const { orgId, orgName, orgTier, members, loading, isAdmin } = useOrg();
```

For the detailed stats (phase completions, artefact counts per member), fetch once on mount:

```typescript
const [memberStats, setMemberStats] = useState<ScoredMember[]>([]);

useEffect(() => {
  if (!orgId) return;
  getOrgLeaderboard(orgId, user.id).then(setMemberStats);
}, [orgId]);
```

---

## 11. Admin Panel — `pages/app/AppAdmin.tsx`

### Access control

Only visible to users with `role: 'admin'` in `user_org_memberships`.

### Sidebar item

Add conditionally to `AppSidebar.tsx`:

```typescript
import { useOrg } from '../../context/OrgContext';

// Inside the component:
const { isAdmin } = useOrg();

// In NAV_ITEMS rendering:
{isAdmin && (
  <NavItem label="Admin" icon={Settings} path="/app/admin" />
)}
```

### Route

Add to `App.tsx`:
```tsx
const AppAdmin = React.lazy(() => import('./pages/app/AppAdmin'));

// Inside /app route children:
<Route path="admin" element={<AppSuspense><AppAdmin /></AppSuspense>} />
```

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│  Organisation Admin                                  │
│  "Manage your organisation's AI upskilling cohort"   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌── Org Settings ───────────────────────────────┐  │
│  │  Name: [Oxygy Consulting    ]                 │  │
│  │  Tier: Catalyst  (read-only)                  │  │
│  │  [Save Changes]                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌── Invite Members ─────────────────────────────┐  │
│  │  Share this invite link:                      │  │
│  │  https://app.oxygy.ai/join/ABC12345  [Copy]   │  │
│  │                                               │  │
│  │  ── or invite by email ──                     │  │
│  │  [email@company.com]  Role: [Learner ▾]       │  │
│  │  [Send Invite →]                              │  │
│  │                                               │  │
│  │  Pending invites:                             │  │
│  │  • sarah@co.com — Learner — Sent 2d ago  [×]  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌── Members ────────────────────────────────────┐  │
│  │  Name        │ Role    │ Level │ Joined │ ⋮   │  │
│  │  Joseph T.   │ Admin   │ L5    │ Jan 14 │ ⋮   │  │
│  │  Amira K.    │ Learner │ L5    │ Jan 20 │ ⋮   │  │
│  │  Sam B.      │ Learner │ L4    │ Feb 01 │ ⋮   │  │
│  │  ...                                          │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌── Workshop Sessions ──────────────────────────┐  │
│  │  Active sessions:                             │  │
│  │  • L1 Workshop — Code: WK-L1-2026 — Mar 10   │  │
│  │  • L2 Workshop — Code: WK-L2-2026 — Mar 24   │  │
│  │                                               │  │
│  │  [Create New Session]                         │  │
│  │  Level: [1 ▾]  Name: [________]  [Create →]   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Admin capabilities

| Action | Implementation |
|--------|---------------|
| **Edit org name** | `supabase.from('organisations').update({ name }).eq('id', orgId)` |
| **Generate invite link** | Create `org_invites` row with random 8-char code, no email |
| **Send email invite** | Create `org_invites` row with email + code. Email sending is out of scope (show the code for manual sharing) |
| **Revoke invite** | Delete from `org_invites` |
| **Change member role** | Update `user_org_memberships.role` |
| **Remove member** | Set `user_org_memberships.active = false` |
| **Create workshop session** | Insert into `workshop_sessions` with org_id, level, code, name, date |
| **Deactivate workshop session** | Set `workshop_sessions.active = false` |

### Database functions

```typescript
export async function createInvite(
  orgId: string,
  createdBy: string,
  email?: string,
  role: string = 'learner',
): Promise<{ code: string } | null> {
  const code = generateInviteCode(); // 8-char alphanumeric
  const { error } = await supabase
    .from('org_invites')
    .insert({
      org_id: orgId,
      email: email || null,
      invite_code: code,
      role,
      created_by: createdBy,
    });
  if (error) return null;
  return { code };
}

export async function getOrgInvites(orgId: string): Promise<Array<{
  id: string; email: string | null; code: string; role: string;
  acceptedBy: string | null; createdAt: Date;
}>> {
  const { data } = await supabase
    .from('org_invites')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  return (data || []).map(row => ({
    id: row.id,
    email: row.email,
    code: row.invite_code,
    role: row.role,
    acceptedBy: row.accepted_by,
    createdAt: new Date(row.created_at),
  }));
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .update({ role: newRole })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  return !error;
}

export async function removeMember(
  orgId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_org_memberships')
    .update({ active: false })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (!error) {
    await supabase.from('profiles').update({ org_id: null }).eq('id', userId);
  }
  return !error;
}

export async function createWorkshopSession(
  orgId: string,
  createdBy: string,
  level: number,
  name: string,
  code: string,
  date?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('workshop_sessions')
    .insert({
      org_id: orgId,
      level,
      code,
      session_name: name,
      session_date: date || null,
      created_by: createdBy,
    });
  return !error;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

---

## 12. Workshop Code Validation — Org Scoping

### `components/dashboard/sections/MyProgress.tsx`

Currently calls `validateWorkshopCode(null, level, code)` with `null` for orgId. Update to pass the real org_id:

```typescript
import { useOrg } from '../../../context/OrgContext';

// Inside the component:
const { orgId } = useOrg();

// In WorkshopCodeCallout:
const isValid = await validateWorkshopCode(orgId || null, level, code.trim());
```

This scopes validation to the user's org. If they have no org, it validates against any active session (existing behaviour).

---

## 13. Join Route — `/join/:code`

### Purpose

Allow invite links to be shared as URLs. When a user visits `https://app.oxygy.ai/join/ABC12345`:

1. If signed in → attempt to accept the invite, then redirect to `/app/dashboard`
2. If not signed in → redirect to `/login?redirect=/join/ABC12345`, then after auth the join flow runs

### Route

Add to `App.tsx`:
```tsx
const JoinPage = React.lazy(() => import('./pages/app/JoinPage'));

<Route path="/join/:code" element={<AppSuspense><JoinPage /></AppSuspense>} />
```

### `pages/app/JoinPage.tsx`

```typescript
const JoinPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?redirect=/join/${code}`, { replace: true });
      return;
    }
    if (!code) {
      setStatus('error');
      setMessage('No invite code provided');
      return;
    }

    validateAndAcceptInvite(user.id, code).then(result => {
      if (result.success) {
        setStatus('success');
        setMessage(`Welcome to ${result.orgName}!`);
        setTimeout(() => navigate('/app/dashboard', { replace: true }), 2000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to join organisation');
      }
    });
  }, [user, authLoading, code]);

  // Render: loading spinner, success message, or error with link to dashboard
};
```

---

## 14. Visual Design Notes

### Cohort page — follows Toolkit Page Standard

- Page title: DM Sans, 28px, weight 800, `#1A202C`, no emoji
- Description: 14px, `#718096`, max 2 lines
- Cards: `border: 1px solid #E2E8F0`, `borderRadius: 12–14`, no shadows
- All accent colours from the level colour system (§1.5 of TOOLKIT-PAGE-STANDARD.md)
- Font throughout: DM Sans, inline styles

### Admin page — same standards

- Form inputs: `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: 10px 14px`, `fontSize: 14`
- Table: no borders between rows, `borderBottom: 1px solid #EDF2F7` between rows
- Destructive actions (remove member): `color: #E53E3E` on hover, confirmation dialog before executing

---

## 15. Testing Checklist

### Org Join Flow

- [ ] New user without an invite code completes onboarding without an org (individual mode)
- [ ] New user with a valid invite code joins the org during onboarding; org name and member count shown on success
- [ ] Expired invite code shows error
- [ ] Already-used single-email invite shows error
- [ ] Open invite link (no email) can be used by multiple users
- [ ] `/join/ABC12345` redirects unauthenticated users to login, then completes the join after auth
- [ ] Joining an org sets `profiles.org_id` and creates `user_org_memberships` row

### Leaderboard

- [ ] User with no org sees the "Coming Soon" placeholder (or single-user entry)
- [ ] User with an org sees all org members ranked by score
- [ ] Score formula produces expected values: completion phases × 4 + artefacts × 25 + insights × 30 + streak × 5 + activity × 2
- [ ] Current user is highlighted in the leaderboard
- [ ] Rank updates when a colleague completes a phase or saves an artefact

### My Cohort Page

- [ ] User with no org sees the "No organisation linked" empty state with invite code input
- [ ] User with an org sees the org info card with correct name, tier, member count, and average level
- [ ] Member cards show real data (level, completion %, streak, artefact count)
- [ ] Level filter pills filter the member list correctly
- [ ] Search by name works
- [ ] Level distribution chart shows correct bar heights
- [ ] Current user's card has a teal left border accent

### Streaks

- [ ] A user with activity today has a streak of at least 1
- [ ] A user with activity today and yesterday has a streak of at least 2
- [ ] A user with no activity today or yesterday has a streak of 0
- [ ] Streak is updated on dashboard load
- [ ] Active days this week shows correct dots for each day

### Admin Panel

- [ ] Only visible in sidebar for users with `role: 'admin'`
- [ ] Learners and facilitators do not see the admin nav item or have access to `/app/admin`
- [ ] Generating an invite link creates a valid invite code
- [ ] Copying the invite link works
- [ ] Creating a workshop session inserts into `workshop_sessions`
- [ ] Changing a member's role updates `user_org_memberships`
- [ ] Removing a member sets `active = false` and clears their `profiles.org_id`
- [ ] Removed member no longer appears in the cohort or leaderboard

### Workshop Codes

- [ ] Workshop code validation checks against the user's org
- [ ] A code from Org A is not valid for a user in Org B
- [ ] A user with no org can validate any active code (backward compatible)

---

## 16. Implementation Order

1. **Schema** — Run SQL for `org_invites` table, `profiles.org_id` column, expanded RLS policies
2. **Database functions** — Add all org CRUD, invite, leaderboard, streak, and active-days functions to `lib/database.ts`
3. **OrgContext** — Create `context/OrgContext.tsx`
4. **AppLayout** — Wrap with `OrgProvider`
5. **Onboarding update** — Add org join step to `AppOnboarding.tsx`
6. **Join route** — Create `/join/:code` route and `JoinPage.tsx`
7. **Streak calculation** — Implement `calculateStreak` and `updateStreak`
8. **useDashboardData** — Replace placeholders with real leaderboard, streak, and active days queries
9. **AppDashboard** — Restore real leaderboard component (conditionally rendered)
10. **My Cohort page** — Full rewrite of `AppCohort.tsx`
11. **Admin panel** — Create `AppAdmin.tsx` with invite, member, and workshop management
12. **Sidebar** — Add conditional admin nav item
13. **Workshop validation** — Pass real org_id in `MyProgress.tsx`
14. **Test end-to-end** against the checklist in §15
