# PRD-14: Analytics Dashboard (Cross-Client & Per-Org)

> **Status:** Draft
> **Author:** Oxygy Design Agent
> **Date:** 16 March 2026
> **Depends on:** PRD-10 (Auth & Schema), PRD-11 (Admin Shell & Org CRUD), PRD-12 (Enrollment), PRD-13 (User Management)
> **Blocks:** PRD-16 (Client Admin Dashboard — reuses analytics components)

---

## 1. Overview

### 1.1 Purpose

This PRD replaces the placeholder metric cards on the admin dashboard with real, live analytics and adds a full analytics tab to each organisation's detail page. After this PRD is implemented, the Oxygy team can answer "is the platform working?" at both the cross-client level and the per-org level using real data.

### 1.2 What It Delivers

1. **Admin Dashboard** (`/admin`) — five live metric cards, an organisation health table, and an engagement funnel chart
2. **Per-Org Analytics Tab** — level progression distribution, tool adoption breakdown, completion timeline, stalled user list, and cohort comparison
3. **Shared chart components** — reusable across admin dashboard, org analytics, and (in PRD-16) the client admin dashboard
4. **Date range filtering** — all analytics views support a configurable time window

### 1.3 Design Philosophy

Analytics pages are read-heavy and comparison-heavy. The design favours density over whitespace: compact metric cards, tight chart spacing, and no decorative elements. Every chart must have a clear "so what" — a one-sentence insight line that interprets the data for the viewer.

Charts use the Oxygy colour palette exclusively. The primary data colour is teal (`#38B2AC`). Level-specific breakdowns use the canonical level accent colours from `data/dashboard-content.ts`:

```typescript
const LEVEL_COLOURS: Record<number, string> = {
  1: '#A8F0E0',  // Mint
  2: '#C3D0F5',  // Lavender
  3: '#F7E8A4',  // Pale Yellow
  4: '#F5B8A0',  // Soft Peach
  5: '#38B2AC',  // Teal
};
```

### 1.4 Charting Approach

All charts are rendered as inline SVG — no charting library dependency. The data volumes are small enough (tens of orgs, hundreds of users) that SVG performance is a non-issue, and hand-rolled SVGs give full control over the Oxygy visual language.

If chart complexity exceeds what's reasonable in hand-rolled SVG (e.g., interactive tooltips on complex time series), fall back to a lightweight option available in the existing stack. The `recharts` library is available via the artifact system but is not in `package.json` — the developer should add it only if needed and keep usage minimal.

### 1.5 Non-Goals

- Real-time analytics or live-updating dashboards (all data is fetched on page load and refresh)
- Predictive analytics or AI-generated insights (future enhancement)
- Exporting charts as images or PDFs
- Client admin access to analytics (PRD-16 reuses these components with org-scoped data)

---

## 2. Metric Definitions

Every metric used in this PRD is defined here once and referenced by name in subsequent sections. Each definition specifies the exact SQL or Supabase query logic.

### 2.1 Organisation Metrics

| Metric | Definition | Query Logic |
|---|---|---|
| **Total Organisations** | Count of orgs where `active = true` | `select count from organisations where active = true` |
| **Total Enrolled Users** | Count of active memberships across all orgs | `select count from user_org_memberships where active = true` |
| **Active Users (30d)** | Users with any activity in the last 30 days | Count of distinct `user_id` where any of: `level_progress.updated_at > now()-30d`, `saved_prompts.saved_at > now()-30d`, `application_insights.created_at > now()-30d` |
| **Avg Completion Rate** | Average percentage of available levels where `tool_used = true`, per user, across all orgs | For each user: (count of levels with tool_used=true) / (count of levels in their org's level_access). Average across all users. |
| **Tool Usage Rate** | Percentage of enrolled users who have used at least one toolkit tool | (Users with ≥1 `tool_used=true` in level_progress) / (Total enrolled users) × 100 |

### 2.2 Per-Org Metrics

| Metric | Definition |
|---|---|
| **Enrolled** | Count of active memberships for this org |
| **Active (30d)** | Users in this org with activity in last 30 days (same activity definition as above) |
| **Active Rate** | Active (30d) / Enrolled × 100 |
| **Completion Rate** | Average (levels with tool_used=true / org's level_access count) per user in this org |
| **Tool Usage Rate** | (Users in org with ≥1 tool_used) / Enrolled × 100 |
| **Last Activity** | Most recent timestamp across all users in this org |

### 2.3 Health Score

A composite indicator for each organisation, displayed as a coloured dot in the health table.

**Calculation:**
```typescript
function calculateHealth(org: OrgAnalytics): 'green' | 'amber' | 'red' {
  const { activeRate, completionRate, enrolledCount } = org;

  // Not enough data to assess
  if (enrolledCount < 3) return 'amber';

  // Green: strong engagement
  if (activeRate >= 50 && completionRate >= 30) return 'green';

  // Red: critical disengagement
  if (activeRate < 25 || (enrolledCount >= 10 && completionRate < 10)) return 'red';

  // Everything else
  return 'amber';
}
```

**Display:**
- Green (`#48BB78`): "Healthy"
- Amber (`#ECC94B`): "Needs Attention"
- Red (`#E53E3E`): "At Risk"

---

## 3. Admin Dashboard — Live Analytics

**File:** `pages/admin/AdminDashboard.tsx` (replaces the placeholder from PRD-11)
**Route:** `/admin`

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────┐
│  h1: "Platform Overview"       [Date Range: 30d ▾]  │
│  "Cross-client metrics and programme health."       │
│                                                     │
│  ┌──────┬──────┬──────┬──────┬──────┐               │
│  │Orgs  │Users │Active│Compl │Tools │  ← metric row │
│  │  8   │ 247  │ 156  │ 34%  │ 62%  │               │
│  └──────┴──────┴──────┴──────┴──────┘               │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Organisation Health                        │    │
│  │  ┌───┬───────┬──────┬──────┬──────┬──────┐  │    │
│  │  │ ● │ Name  │Users │Active│Compl │Health│  │    │
│  │  ├───┼───────┼──────┼──────┼──────┼──────┤  │    │
│  │  │ 🟢│ Acme  │  47  │ 68%  │ 42%  │Green │  │    │
│  │  │ 🔴│ Cont  │ 120  │ 23%  │ 15%  │ Red  │  │    │
│  │  └───┴───────┴──────┴──────┴──────┴──────┘  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌────────────────────┐ ┌──────────────────────┐    │
│  │ Engagement Funnel  │ │ Feature Adoption     │    │
│  │                    │ │                      │    │
│  │ Enrolled    ███ 247│ │ Prompt PG   ███ 78% │    │
│  │ Started L1  ██  195│ │ Agent Bldr  ██  51% │    │
│  │ Compl L1    █   108│ │ Workflow    █   28% │    │
│  │ Started L2  ░    72│ │ App Design  ░   15% │    │
│  │ Compl L2    ░    41│ │ App Eval    ░    8% │    │
│  └────────────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Date Range Selector

**Position:** Top-right, aligned with the page title

**Dropdown:** `<select>` styled as a pill
- `padding: 8px 14px`, `borderRadius: 24`, `border: 1px solid #E2E8F0`, `fontSize: 12`, `fontWeight: 600`
- Options: "Last 7 days", "Last 30 days" (default), "Last 90 days", "All Time"
- Changing the selection re-fetches all analytics data with the new time window
- The date range affects: Active Users calculation, Engagement Funnel start point, and Completion Timeline charts

### 3.3 Metric Cards (Live)

Replace the PRD-11 placeholder cards with live data. Same card spec as PRD-11 §4.3, now populated with real values.

Each card also gets a **trend indicator** — a small arrow showing whether the metric improved or declined compared to the previous period (if range is 30d, compare to the 30d before that):

```tsx
{trend !== 0 && (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 12, fontWeight: 600,
    color: trend > 0 ? '#48BB78' : '#E53E3E',
    marginLeft: 8,
  }}>
    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}{isPercentage ? 'pp' : ''}
  </span>
)}
```

**Card definitions:**

| Card | Value | Format | Trend Compare |
|---|---|---|---|
| Organisations | Total active orgs | Integer | vs. previous period |
| Total Users | Total enrolled | Integer | vs. previous period |
| Active (30d) | Active users + "({rate}%)" | Integer + percentage | vs. previous period |
| Avg Completion | Avg completion rate | Percentage | vs. previous period (percentage points) |
| Tool Usage | Tool usage rate | Percentage | vs. previous period (percentage points) |

### 3.4 Organisation Health Table

Replaces the PRD-11 placeholder. This is the operational heart of the dashboard.

**Container:** AdminCard with `padding: 0`, `overflow: hidden`

**Header:** "Organisation Health" (`fontSize: 16`, `fontWeight: 700`, `color: #1A202C`) + "View all →" link to `/admin/organisations`

**Columns:**

| Column | Width | Content |
|---|---|---|
| Health | 5% | Coloured dot (green/amber/red) |
| Organisation | 22% | Org name + tier badge |
| Enrolled | 10% | User count |
| Active Rate | 13% | Percentage + micro bar |
| Completion | 13% | Percentage + micro bar |
| Tool Usage | 13% | Percentage + micro bar |
| Last Activity | 12% | Relative time |
| | 12% | "View →" link |

**Micro bar** — a tiny inline progress bar next to the percentage:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', minWidth: 36 }}>
    {rate}%
  </span>
  <div style={{ width: 48, height: 4, borderRadius: 2, background: '#EDF2F7' }}>
    <div style={{
      width: `${rate}%`, height: '100%', borderRadius: 2,
      background: rate >= 50 ? '#48BB78' : rate >= 25 ? '#ECC94B' : '#FC8181',
    }} />
  </div>
</div>
```

**Sort:** Default by health score (red first — these need attention). Clickable headers for all numeric columns.

**Row click:** Navigates to `/admin/organisations/:id?tab=analytics`

### 3.5 Engagement Funnel

A horizontal bar chart showing the dropoff across the learning journey, aggregated across all orgs.

**Funnel stages:**

| Stage | Definition |
|---|---|
| Enrolled | Total active memberships |
| Completed Onboarding | Users with a non-empty profile (role, function, and seniority all set) |
| Started Level 1 | Users with any `level_progress` row for level 1 |
| Completed Level 1 | Users with `tool_used = true` AND `workshop_attended = true` for level 1 |
| Started Level 2 | Users with any `level_progress` row for level 2 |
| Completed Level 2 | Same pattern as L1 |
| Started Level 3+ | Users with any `level_progress` row for level ≥ 3 |

**Note on "Completed":** For V1, completion means `tool_used = true` for a level. Workshop attendance is tracked but not required for level completion in the funnel. Adjust this definition based on programme design.

**Chart spec:**
- Container: AdminCard, `padding: 20px`
- Title: "Engagement Funnel" (`fontSize: 15`, `fontWeight: 700`)
- Subtitle: "User progression across the learning journey" (`fontSize: 12`, `color: #A0AEC0`)
- Chart area: full width, one horizontal bar per stage
- Bar: `height: 28px`, `borderRadius: 6`, `background: #38B2AC`, opacity decreasing by stage (1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2)
- Bar width: proportional to count (first stage = 100% width)
- Label left of bar: stage name (`fontSize: 12`, `color: #4A5568`)
- Label right of bar: count + percentage of total (`fontSize: 12`, `fontWeight: 600`)
- Vertical spacing between bars: `gap: 6`

**Insight line** below the chart:
- Auto-generated: "Biggest drop-off: {stage_with_largest_delta} ({percentage_drop}% of users don't progress past this point)"
- `fontSize: 12`, `color: #718096`, `fontStyle: italic`, `marginTop: 12`

### 3.6 Feature Adoption Chart

A horizontal bar chart showing toolkit usage across the platform.

**Tools:**

| Tool | Source Key | Level |
|---|---|---|
| Prompt Playground | `prompt-playground` | 1 |
| Agent Builder | `agent-builder` | 2 |
| Workflow Canvas | `workflow-designer` | 3 |
| App Designer | `dashboard-designer` | 4 |
| App Evaluator | `product-architecture` | 5 |

**Metric per tool:** Percentage of enrolled users who have saved at least one artefact from this tool (using `saved_prompts.source_tool`).

**Chart spec:**
- Container: AdminCard, `padding: 20px`
- Title: "Feature Adoption" (`fontSize: 15`, `fontWeight: 700`)
- Five horizontal bars, each coloured with the corresponding level colour
- Bar label: tool name + level indicator (e.g., "Prompt Playground (L1)")
- Bar value: percentage + raw count
- Bars sorted by usage (highest first)

**Layout:** The engagement funnel and feature adoption charts sit side by side: `display: grid`, `gridTemplateColumns: '1fr 1fr'`, `gap: 20`, `marginTop: 24`

---

## 4. Per-Org Analytics Tab

**Location:** Organisation detail page (`/admin/organisations/:id`), new "Analytics" tab added to the tab bar.

**Tab bar update:** Insert "Analytics" between "Overview" and "Users" in the existing tab order:

| Tab | Position |
|---|---|
| Overview | 1 |
| **Analytics** | **2 (new)** |
| Users | 3 |
| Enrollment | 4 |
| Workshops | 5 |
| Programme | 6 |

### 4.1 Tab Layout

```
┌─────────────────────────────────────────────────────┐
│  [Date Range: 30d ▾]                                │
│                                                     │
│  ┌──────┬──────┬──────┬──────┐                      │
│  │Enroll│Active│Compl │Tools │   ← 4 metric cards   │
│  │  47  │ 68%  │ 42%  │ 56%  │                      │
│  └──────┴──────┴──────┴──────┘                      │
│                                                     │
│  ┌──────────────────────┐ ┌────────────────────┐    │
│  │ Level Distribution   │ │ Tool Adoption      │    │
│  │ ████ L1: 18         │ │ Prompt PG  ██ 92% │    │
│  │ ███  L2: 14         │ │ Agent Bldr █  67% │    │
│  │ ██   L3:  8         │ │ Workflow   ░  34% │    │
│  │ █    L4:  4         │ │ App Design ░  12% │    │
│  │ ░    L5:  3         │ │ App Eval   ░   5% │    │
│  └──────────────────────┘ └────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Completion Timeline                         │    │
│  │            ╱‾‾‾‾‾‾╲                         │    │
│  │      ╱‾‾‾‾         ‾‾‾‾‾                    │    │
│  │ ╱‾‾‾‾                                       │    │
│  │ Jan    Feb    Mar    Apr                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌──────────────────────┐ ┌────────────────────┐    │
│  │ Stalled Users        │ │ Cohort Comparison  │    │
│  │                      │ │                    │    │
│  └──────────────────────┘ └────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 4.2 Org Metric Cards

Four cards in a row: `gridTemplateColumns: 'repeat(4, 1fr)'`, `gap: 16`

Same card spec as the admin dashboard metrics but with org-scoped data:

| Card | Value | Format |
|---|---|---|
| Enrolled | Membership count | Integer |
| Active Rate | Active (30d) / Enrolled × 100 | Percentage |
| Completion Rate | Avg levels completed / levels available | Percentage |
| Tool Usage | Users with ≥1 tool / Enrolled × 100 | Percentage |

Each card includes a trend indicator comparing to the previous period.

### 4.3 Level Distribution Chart

A horizontal bar chart showing how many users are currently at each level.

**Definition:** "Current level" per user is `profiles.current_level`. Count users per level, filtered to this org via `user_org_memberships`.

**Chart spec:**
- Container: AdminCard, `padding: 20px`
- Title: "Level Distribution" (`fontSize: 15`, `fontWeight: 700`)
- Subtitle: "Where your users are in the learning journey" (`fontSize: 12`, `color: #A0AEC0`)
- Five horizontal bars, each using the level's accent colour
- Bar label: "Level N: {name}" (`fontSize: 12`)
- Bar value: count + percentage of org total
- Bars ordered L1 to L5 (top to bottom)

**Insight line:** "Most users are at Level {N} — {percentage}% of the cohort."

### 4.4 Tool Adoption Chart

Same chart type as the cross-client Feature Adoption (§3.6) but scoped to this org. Shows the percentage of this org's users who have used each tool.

### 4.5 Completion Timeline

A line chart showing cumulative level completions over time.

**Data:** For each day in the selected date range, count the total number of `level_progress` rows where `tool_used_at <= that_day` for users in this org. Plot one line per level.

**Chart spec:**
- Container: AdminCard, full width, `padding: 20px`
- Title: "Completion Timeline" (`fontSize: 15`, `fontWeight: 700`)
- Subtitle: "Cumulative tool completions over time" (`fontSize: 12`, `color: #A0AEC0`)
- X-axis: dates, labeled at regular intervals (weekly for 30d, monthly for 90d)
- Y-axis: cumulative count
- Five lines (one per level), each using the level's accent colour
- Line: `strokeWidth: 2`, slight curve (`cubic bezier`)
- Data points: small circles (`r: 3`) on hover
- Legend below chart: colour swatches + level names

**SVG or library:** This chart has enough complexity (multiple lines, axis labels, hover interactions) that using `recharts` is justified if hand-rolled SVG becomes unwieldy. The developer should assess and choose — either approach is acceptable as long as the visual matches the spec.

**Insight line:** "Level 1 completions are growing {rate} per week on average."

### 4.6 Stalled Users List

A compact table showing users who haven't been active in 14+ days, sorted by last activity (longest gap first). Limited to the 10 most stalled users.

**Container:** AdminCard, `padding: 20px`

**Header:** "Stalled Users" + count badge ("8 users inactive 14+ days")

**Columns:**

| Column | Content |
|---|---|
| Name | Full name + avatar initial |
| Current Level | Level pill |
| Last Active | Relative time (e.g., "23 days ago") |
| Days Inactive | Integer, coloured: amber (14-30d), red (30d+) |

**Row styling:** Compact — `padding: 10px 0`, `borderBottom: 1px solid #F7FAFC`, `fontSize: 12`.

**Empty state:** "No stalled users — everyone has been active in the last 14 days." (with a green checkmark icon)

**Footer:** If more than 10 stalled users: "View all stalled users →" link — navigates to `/admin/organisations/:id?tab=users` with status filter set to "Stalled".

### 4.7 Cohort Comparison

A side-by-side comparison of cohorts within this org. Only shown if the org has 2+ cohorts.

**Container:** AdminCard, `padding: 20px`

**Header:** "Cohort Comparison" (`fontSize: 15`, `fontWeight: 700`)

**If 0-1 cohorts:** Show "Cohort comparison requires at least two cohorts. Create cohorts in the Enrollment tab to enable this view." (AdminEmptyState with `Users` icon)

**If 2+ cohorts:**

A compact comparison table:

| Column | Content |
|---|---|
| Cohort | Cohort name + date range |
| Members | Count |
| Active Rate | Percentage + micro bar |
| Avg Level | Average current_level (e.g., "2.3") |
| Tool Usage | Percentage + micro bar |

**Sorted by:** Active Rate descending (best-performing cohort first).

**Insight line:** "Your {best_cohort} cohort is outperforming {worst_cohort} by {delta} percentage points on active rate."

---

## 5. Data Fetching Architecture

### 5.1 Strategy

All analytics data is fetched on page load via multiple parallel Supabase queries. No pre-computed materialised views or background jobs in V1. The expected data volumes (tens of orgs, hundreds of users, thousands of level_progress/saved_prompts rows) are well within the range where real-time queries perform acceptably (<500ms total).

### 5.2 Cross-Client Dashboard Queries

Executed on mount of `AdminDashboard.tsx`:

```typescript
async function fetchDashboardAnalytics(dateRange: DateRange) {
  const since = dateRange.start.toISOString();

  const [
    orgCount,
    totalUsers,
    activeUsers,
    levelProgress,
    savedPrompts,
    orgDetails,
  ] = await Promise.all([
    // 1. Active org count
    supabase.from('organisations').select('id', { count: 'exact', head: true }).eq('active', true),

    // 2. Total enrolled users
    supabase.from('user_org_memberships').select('id', { count: 'exact', head: true }).eq('active', true),

    // 3. Active users (distinct user_ids with recent activity)
    supabase.rpc('count_active_users', { since_date: since }),

    // 4. All level progress rows (for completion + funnel calculations)
    supabase.from('level_progress').select('user_id, level, tool_used, tool_used_at, workshop_attended'),

    // 5. All saved prompts (for feature adoption)
    supabase.from('saved_prompts').select('user_id, source_tool, saved_at'),

    // 6. Org details with membership counts (for health table)
    supabase.from('organisations').select(`
      id, name, tier, active, level_access,
      user_org_memberships(user_id, active)
    `).eq('active', true).order('name'),
  ]);

  return computeDashboardMetrics({
    orgCount: orgCount.count || 0,
    totalUsers: totalUsers.count || 0,
    activeUsers, levelProgress, savedPrompts, orgDetails,
    dateRange,
  });
}
```

### 5.3 Supabase RPC Function: Active User Count

The "active users" metric requires checking multiple tables for recent timestamps. This is most efficient as a database function:

```sql
create or replace function count_active_users(since_date timestamptz)
returns integer as $$
  select count(distinct user_id)::integer
  from (
    select user_id from level_progress where updated_at >= since_date
    union
    select user_id from saved_prompts where saved_at >= since_date
    union
    select user_id from application_insights where created_at >= since_date
  ) active_users;
$$ language sql stable;
```

For per-org active users, add an org-scoped variant:

```sql
create or replace function count_active_users_for_org(
  target_org_id uuid,
  since_date timestamptz
) returns integer as $$
  select count(distinct au.user_id)::integer
  from (
    select user_id from level_progress where updated_at >= since_date
    union
    select user_id from saved_prompts where saved_at >= since_date
    union
    select user_id from application_insights where created_at >= since_date
  ) au
  join user_org_memberships m on m.user_id = au.user_id
  where m.org_id = target_org_id and m.active = true;
$$ language sql stable;
```

### 5.4 Per-Org Analytics Queries

Executed on mount of the Analytics tab:

```typescript
async function fetchOrgAnalytics(orgId: string, dateRange: DateRange) {
  const since = dateRange.start.toISOString();

  // Get user IDs in this org
  const { data: members } = await supabase
    .from('user_org_memberships')
    .select('user_id')
    .eq('org_id', orgId)
    .eq('active', true);
  const userIds = (members || []).map(m => m.user_id);

  if (userIds.length === 0) return emptyOrgAnalytics();

  const [
    activeCount,
    levelProgress,
    savedPrompts,
    profiles,
    cohorts,
    cohortMembers,
  ] = await Promise.all([
    supabase.rpc('count_active_users_for_org', { target_org_id: orgId, since_date: since }),

    supabase.from('level_progress')
      .select('user_id, level, tool_used, tool_used_at, workshop_attended')
      .in('user_id', userIds),

    supabase.from('saved_prompts')
      .select('user_id, source_tool, saved_at')
      .in('user_id', userIds),

    supabase.from('profiles')
      .select('id, current_level, full_name, updated_at')
      .in('id', userIds),

    supabase.from('cohorts')
      .select('id, name, start_date, end_date')
      .eq('org_id', orgId)
      .eq('active', true),

    supabase.from('user_org_memberships')
      .select('user_id, cohort_id')
      .eq('org_id', orgId)
      .eq('active', true)
      .not('cohort_id', 'is', null),
  ]);

  return computeOrgMetrics({
    orgId, userIds, activeCount, levelProgress, savedPrompts,
    profiles, cohorts, cohortMembers, dateRange,
  });
}
```

### 5.5 Metric Computation

All metric computation is done client-side in pure TypeScript functions. This keeps the logic testable and avoids complex SQL. The raw data fetched from Supabase is transformed into chart-ready data structures.

**File:** `lib/analytics.ts`

```typescript
interface DashboardMetrics {
  totalOrgs: number;
  totalUsers: number;
  activeUsers: number;
  activeRate: number;
  avgCompletionRate: number;
  toolUsageRate: number;
  orgHealthRows: OrgHealthRow[];
  funnelStages: FunnelStage[];
  featureAdoption: FeatureAdoptionRow[];
  trends: Record<string, number>;
}

interface OrgHealthRow {
  id: string;
  name: string;
  tier: string;
  enrolled: number;
  activeRate: number;
  completionRate: number;
  toolUsageRate: number;
  lastActivity: string | null;
  health: 'green' | 'amber' | 'red';
}

interface FunnelStage {
  label: string;
  count: number;
  percentage: number;
}

interface FeatureAdoptionRow {
  tool: string;
  label: string;
  level: number;
  colour: string;
  userCount: number;
  percentage: number;
}

interface OrgAnalytics {
  enrolled: number;
  activeRate: number;
  completionRate: number;
  toolUsageRate: number;
  levelDistribution: { level: number; count: number; percentage: number }[];
  toolAdoption: FeatureAdoptionRow[];
  completionTimeline: { date: string; levels: Record<number, number> }[];
  stalledUsers: StalledUser[];
  cohortComparison: CohortRow[];
}
```

---

## 6. Shared Chart Components

These components are built to be reusable across the admin dashboard, org analytics, and the future client admin dashboard (PRD-16).

### 6.1 HorizontalBarChart

Renders a list of labelled horizontal bars with optional value labels.

```typescript
interface HorizontalBarChartProps {
  title: string;
  subtitle?: string;
  bars: {
    label: string;
    value: number;
    maxValue: number;
    colour: string;
    displayValue: string;   // "78%" or "247"
  }[];
  insightLine?: string;
}
```

**Rendering:** Each bar is a `<div>` with the label on the left (`width: 160px`, `fontSize: 12`, `color: #4A5568`), the bar in the middle (`flex: 1`, `height: 28px`, `borderRadius: 6`, background is the bar colour), and the value on the right (`width: 80px`, `fontSize: 12`, `fontWeight: 600`, `textAlign: right`).

### 6.2 MetricCard

The five-card metric row component.

```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  format?: 'integer' | 'percentage';
  trend?: number;           // positive = improved, negative = declined
  trendLabel?: string;      // e.g., "vs last 30d"
}
```

### 6.3 HealthTable

The organisation health comparison table.

```typescript
interface HealthTableProps {
  rows: OrgHealthRow[];
  onRowClick: (orgId: string) => void;
}
```

### 6.4 MicroBar

The inline tiny progress bar used in tables.

```typescript
interface MicroBarProps {
  value: number;     // 0–100
  width?: number;    // default 48
  height?: number;   // default 4
}
```

### 6.5 InsightLine

The auto-generated one-sentence insight below charts.

```typescript
interface InsightLineProps {
  text: string;
}

const InsightLine: React.FC<InsightLineProps> = ({ text }) => (
  <p style={{
    fontSize: 12, color: '#718096', fontStyle: 'italic',
    marginTop: 12, paddingTop: 12,
    borderTop: '1px solid #F7FAFC',
  }}>
    💡 {text}
  </p>
);
```

---

## 7. Schema Additions

### 7.1 RPC Functions

Add to the migration script:

```sql
-- Active user count (cross-client)
create or replace function count_active_users(since_date timestamptz)
returns integer as $$
  select count(distinct user_id)::integer
  from (
    select user_id from level_progress where updated_at >= since_date
    union
    select user_id from saved_prompts where saved_at >= since_date
    union
    select user_id from application_insights where created_at >= since_date
  ) active_users;
$$ language sql stable;

-- Active user count (per-org)
create or replace function count_active_users_for_org(
  target_org_id uuid, since_date timestamptz
) returns integer as $$
  select count(distinct au.user_id)::integer
  from (
    select user_id from level_progress where updated_at >= since_date
    union
    select user_id from saved_prompts where saved_at >= since_date
    union
    select user_id from application_insights where created_at >= since_date
  ) au
  join user_org_memberships m on m.user_id = au.user_id
  where m.org_id = target_org_id and m.active = true;
$$ language sql stable;
```

### 7.2 Indexes for Analytics Performance

```sql
-- Speed up activity lookups by date
create index if not exists idx_level_progress_updated on level_progress(updated_at desc);
create index if not exists idx_saved_prompts_saved_at on saved_prompts(saved_at desc);
create index if not exists idx_insights_created on application_insights(created_at desc);

-- Speed up per-user lookups
create index if not exists idx_level_progress_user on level_progress(user_id);
create index if not exists idx_saved_prompts_user on saved_prompts(user_id);
create index if not exists idx_insights_user on application_insights(user_id);
```

---

## 8. File Structure

### 8.1 New Files

```
pages/admin/
└── AdminDashboard.tsx              # Rewritten with live analytics (replaces PRD-11 placeholder)

components/admin/analytics/
├── MetricCard.tsx                  # Single metric card with trend
├── MetricCardRow.tsx               # Row of metric cards
├── HealthTable.tsx                 # Org health comparison table
├── HorizontalBarChart.tsx          # Reusable bar chart
├── CompletionTimeline.tsx          # Line chart (SVG or recharts)
├── StalledUsersList.tsx            # Compact stalled users table
├── CohortComparison.tsx            # Cohort side-by-side comparison
├── InsightLine.tsx                 # Auto-generated insight text
├── MicroBar.tsx                    # Tiny inline progress bar
├── DateRangeSelector.tsx           # Pill-style date range dropdown
└── OrgAnalyticsTab.tsx             # Complete analytics tab for org detail

lib/
└── analytics.ts                    # All metric computation functions + types
```

### 8.2 Modified Files

| File | Change |
|---|---|
| `pages/admin/AdminDashboard.tsx` | Complete rewrite — replace placeholder with live analytics |
| `pages/admin/AdminOrgDetail.tsx` | Add "Analytics" tab to tab bar, render `OrgAnalyticsTab` component |
| `supabase/schema.sql` | Add RPC functions and performance indexes |

### 8.3 Migration Script

**File:** `supabase/migration-014-analytics-functions.sql`

Contains the two RPC functions and the performance indexes. Idempotent (uses `create or replace` and `if not exists`).

---

## 9. Edge Cases

### 9.1 Organisation with Zero Users

All metrics show 0 or "—". Charts show empty states: "No data yet — users will appear here once they start engaging with the platform." No errors, no broken layouts.

### 9.2 Organisation with One User

Metrics calculate normally. "Avg Completion Rate" is just that user's rate. Cohort comparison is hidden (requires 2+ cohorts). The insight lines avoid comparative language ("most users") when there's only one user.

### 9.3 New Organisation with No Activity Data

The date range filter shows "No data available for this period." The completion timeline shows a flat line at zero. Stalled users list is empty (users haven't been active long enough to be "stalled").

### 9.4 Very Long Date Ranges

"All Time" could span months of data. The completion timeline chart should aggregate by week (for <6 months) or month (for 6+ months) to keep the chart readable. The funnel and adoption charts are cumulative and work fine at any range.

### 9.5 Trend Calculation When Previous Period Has No Data

If the comparison period has no data (e.g., first 30 days of the platform), don't show a trend arrow. Set `trend = null` and the MetricCard renders without the arrow.

### 9.6 Level Access Varies by Org

When calculating completion rates, divide by the org's `level_access` count, not a fixed 5. An org with access to levels 1-3 has a max of 3 levels, so a user who completed L1 and L2 is at 67%, not 40%.

---

## 10. Performance Considerations

### 10.1 Query Volume

The admin dashboard fires ~6 parallel queries on mount. Each is lightweight (counts, small row sets). Expected total load time: <800ms on a good connection.

The per-org analytics tab fires ~6 parallel queries scoped to one org's user IDs. For an org with 100 users, the `in('user_id', userIds)` filter keeps result sets small.

### 10.2 When to Introduce Pre-Computation

If any of these thresholds are crossed, introduce a nightly `org_analytics_snapshots` materialised table:
- Total platform users exceeds 2,000
- Any single org exceeds 500 users
- Dashboard load time exceeds 3 seconds

The snapshot table would store pre-computed daily metrics per org. The dashboard would read from snapshots instead of running live queries. This is not needed for V1.

### 10.3 Caching

No client-side caching in V1. Every page load fetches fresh data. If the admin wants to compare metrics, they open two browser tabs. For V2, consider a 5-minute stale-while-revalidate cache on the analytics fetch functions.

---

## 11. Responsive Behaviour

Same rules as previous admin PRDs: minimum 1024px, horizontal scroll below that.

- Metric cards: 5 columns on dashboard, 4 columns on org analytics. Below 1000px, wrap to 3+2 or 2+2.
- Two-column chart grids: below 900px, stack to single column.
- Health table: horizontal scroll with `overflow-x: auto`.
- Completion timeline: scales down proportionally with container width (SVG viewBox handles this).

---

## 12. Implementation Checklist

### Schema & Backend
- [ ] Add `count_active_users` RPC function to Supabase
- [ ] Add `count_active_users_for_org` RPC function to Supabase
- [ ] Add performance indexes on `level_progress`, `saved_prompts`, `application_insights`
- [ ] Run migration script `migration-014-analytics-functions.sql`

### lib/analytics.ts
- [ ] `computeDashboardMetrics()` function
- [ ] `computeOrgMetrics()` function
- [ ] `calculateHealth()` function
- [ ] Engagement funnel stage computation
- [ ] Feature adoption computation
- [ ] Completion timeline data assembly
- [ ] Stalled user identification
- [ ] Cohort comparison metrics
- [ ] Trend calculation (current vs. previous period)

### Admin Dashboard
- [ ] Live metric cards with real data and trend indicators
- [ ] Date range selector (7d, 30d, 90d, All Time)
- [ ] Organisation health table with all columns + health dots
- [ ] Health table sorting (default: health, red first)
- [ ] Engagement funnel chart with auto-generated insight
- [ ] Feature adoption chart with level colours
- [ ] Row click navigates to org detail analytics tab

### Per-Org Analytics Tab
- [ ] Tab added to org detail page tab bar
- [ ] Four org-scoped metric cards
- [ ] Level distribution chart
- [ ] Tool adoption chart
- [ ] Completion timeline (line chart)
- [ ] Stalled users list (top 10, link to full list)
- [ ] Cohort comparison table (if 2+ cohorts)
- [ ] Empty states for all charts when no data
- [ ] Insight lines below each chart

### Shared Components
- [ ] `MetricCard` and `MetricCardRow`
- [ ] `HorizontalBarChart`
- [ ] `HealthTable` with `MicroBar` inline bars
- [ ] `CompletionTimeline` (SVG or recharts)
- [ ] `StalledUsersList`
- [ ] `CohortComparison`
- [ ] `InsightLine`
- [ ] `DateRangeSelector`

### Post-Implementation Verification
- [ ] Dashboard loads with real metric values (not placeholders)
- [ ] Changing date range updates all metrics and charts
- [ ] Health table shows correct colour coding for each org
- [ ] Engagement funnel stages decrease monotonically (no stage is higher than the one above)
- [ ] Feature adoption percentages are correct against manual spot-check
- [ ] Org analytics tab loads for an org with real data
- [ ] Org analytics tab handles an org with zero users gracefully
- [ ] Completion timeline shows correct cumulative values
- [ ] Stalled users list shows only users inactive 14+ days
- [ ] Cohort comparison is hidden for orgs with <2 cohorts
- [ ] Trend arrows point in the correct direction
- [ ] All insight lines generate readable, accurate text

---

*End of PRD-14*
