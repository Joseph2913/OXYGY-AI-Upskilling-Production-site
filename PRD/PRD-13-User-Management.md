# PRD-13: User Management

> **Status:** Draft
> **Author:** Oxygy Design Agent
> **Date:** 16 March 2026
> **Depends on:** PRD-10 (Auth & Schema), PRD-11 (Admin Shell & Org CRUD), PRD-12 (Enrollment Channels)
> **Blocks:** PRD-14 (Analytics), PRD-16 (Client Admin Dashboard)

---

## 1. Overview

### 1.1 Purpose

This PRD builds the user management layer of the Oxygy Platform Admin — the ability to see every enrolled user across all organisations, drill into individual profiles, manage memberships, and perform bulk operations. After this PRD is implemented, an Oxygy admin can answer any question about any user on the platform without touching the Supabase dashboard.

### 1.2 What It Delivers

1. **Global Users page** (`/admin/users`) — a searchable, filterable, paginated table of every user across all orgs
2. **Users tab on org detail page** — the same table pre-filtered to one organisation
3. **User detail drawer** — a slide-in panel showing a user's full profile, org membership, level progress, tool usage, and saved artefact counts
4. **Manual user invite** — add a user by email and assign them to an org + cohort
5. **Bulk CSV export** — download the current filtered user list as a `.csv` file
6. **User deactivation** — soft-disable a user's org membership

### 1.3 Non-Goals

- Editing a user's profile fields (the learner owns their profile — admins can view but not modify)
- Resetting a user's progress or deleting their data
- Bulk CSV import of users (future enhancement)
- Client admin access to user data (PRD-16)
- Detailed usage analytics per user (PRD-14 covers aggregate analytics)

---

## 2. Global Users Page

**File:** `pages/admin/AdminUsers.tsx`
**Route:** `/admin/users`

### 2.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  h1: "Users"                      [+ Invite User]   │
│                                                     │
│  Search bar    Org ▾    Level ▾    Status ▾  [CSV]  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Name │ Email │ Org │ Cohort │ Level │ Last │ ... │
│  ├──────┼───────┼─────┼────────┼───────┼──────┼─────│
│  │ Jane │ j@... │ Acme│ Q1     │  L2   │ 2h   │  →  │
│  │ Bob  │ b@... │ Acme│ —      │  L1   │ 5d   │  →  │
│  │ Sara │ s@... │ Cont│ Wave 1 │  L1   │ 14d  │  →  │
│  └──────┴───────┴─────┴────────┴───────┴──────┴─────┘
│                                                     │
│  ← Previous  Page 1 of 5  Next →                    │
│  Showing 1–20 of 93 users                           │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 1200px`

### 2.2 Page Header

**Left:** `h1` — same style as PRD-11 (`fontSize: 24`, `fontWeight: 800`, `color: #1A202C`)

**Right:** "Invite User" button — primary teal, `Plus` icon. Opens the invite user modal (§5).

### 2.3 Search & Filter Bar

**Layout:** `display: flex`, `alignItems: center`, `gap: 10`, `marginBottom: 16`, `flexWrap: wrap`

**Search input:**
- Same spec as PRD-11 org list search: `flex: 1`, `minWidth: 200px`, `maxWidth: 320px`, search icon, debounced 300ms
- Searches across `full_name` and `email` (passed as query params to Supabase using `or` filter with `ilike`)
- Placeholder: "Search by name or email..."

**Organisation filter:**
- `<select>` dropdown, same pill style as PRD-11 tier filter
- Options: "All Organisations" + one option per org (fetched on mount)
- Pre-selected if arriving from an org detail page Users tab (via URL param `?org=:id`)

**Level filter:**
- `<select>` dropdown
- Options: "All Levels", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5"
- Filters on `current_level` in the user's profile

**Status filter:**
- `<select>` dropdown
- Options: "All", "Active (30d)", "Stalled (30d+)", "Never Active"
- "Active (30d)": user has `updated_at` on any `level_progress` or `saved_prompts` row within 30 days
- "Stalled (30d+)": user has activity but nothing in the last 30 days
- "Never Active": user has no `level_progress` rows and no `saved_prompts` rows

**CSV Export button:**
- Icon-only button: `Download` icon, `32px` square, `border: 1px solid #E2E8F0`, `borderRadius: 8`, `background: #FFFFFF`
- Hover: `background: #F7FAFC`
- Tooltip on hover: "Export filtered users as CSV"
- On click: triggers CSV download (§6)

### 2.4 Users Table

**Container:** AdminCard with `padding: 0`, `overflow: hidden`

**Columns:**

| Column | Width | Content | Sortable |
|---|---|---|---|
| Name | 18% | Full name + avatar initial circle | Yes |
| Email | 20% | Email address | Yes |
| Organisation | 14% | Org name | Yes |
| Cohort | 10% | Cohort name or "—" | No |
| Level | 8% | Level pill badge | Yes |
| Tool Usage | 10% | "N/5" tools used | Yes |
| Last Active | 10% | Relative time ("2h ago", "5d ago") | Yes |
| Status | 10% | Status badge | No |

**Header row:** Same spec as PRD-11 org table (`background: #F7FAFC`, `borderBottom: 1px solid #E2E8F0`, uppercase labels).

**Data rows:** Same spec as PRD-11 (`padding: 14px 16px`, `fontSize: 13`, `borderBottom: 1px solid #F7FAFC`, hover: `background: #FAFAFA`, `cursor: pointer`).

#### Column-Specific Rendering

**Name column:**
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <div style={{
    width: 28, height: 28, borderRadius: '50%',
    background: '#E2E8F0', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#4A5568', flexShrink: 0,
  }}>
    {initial}
  </div>
  <span style={{ fontWeight: 600, color: '#1A202C' }}>{fullName || 'Unnamed'}</span>
</div>
```

**Email column:** `fontSize: 13`, `color: #718096`. Truncate with ellipsis if longer than column width.

**Organisation column:** Org name in plain text. If user has no org membership: "—" in muted text.

**Level column — level pill badge:**
Reuse the `LEVEL_PILL_STYLES` from `data/dashboard-content.ts`:
```tsx
<span style={{
  display: 'inline-block', padding: '2px 10px', borderRadius: 12,
  fontSize: 11, fontWeight: 700,
  background: LEVEL_PILL_STYLES[level].bg,
  color: LEVEL_PILL_STYLES[level].text,
}}>
  L{level}
</span>
```

**Tool Usage column:**
- Count of distinct levels where `tool_used = true` in `level_progress`
- Display: "N/5" with a micro progress bar below:
  ```tsx
  <div>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>{count}/5</span>
    <div style={{
      width: 48, height: 3, borderRadius: 2, background: '#EDF2F7', marginTop: 3,
    }}>
      <div style={{
        width: `${(count / 5) * 100}%`, height: '100%', borderRadius: 2,
        background: '#38B2AC',
      }} />
    </div>
  </div>
  ```

**Last Active column:**
- Derived from the most recent timestamp across: `level_progress.updated_at`, `saved_prompts.saved_at`, `application_insights.created_at`
- Displayed as relative time: "Just now", "2h ago", "3d ago", "2w ago", "1mo ago"
- Uses the existing `utils/timeAgo.ts` utility
- If no activity: "Never" in muted text

**Status column:**
```typescript
function getUserStatus(lastActive: Date | null): { label: string; color: string; bg: string } {
  if (!lastActive) return { label: 'Never Active', color: '#A0AEC0', bg: '#EDF2F7' };
  const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 30) return { label: 'Active', color: '#22543D', bg: '#C6F6D5' };
  return { label: 'Stalled', color: '#975A16', bg: '#FEFCBF' };
}
```
Rendered as a pill badge: `fontSize: 11`, `fontWeight: 600`, `padding: 3px 10px`, `borderRadius: 20`.

**Row click:** Opens the User Detail Drawer (§3) for the clicked user.

### 2.5 Pagination

**Server-side pagination using Supabase `.range()`.**

**State:**
```typescript
const [page, setPage] = useState(1);
const PAGE_SIZE = 20;
const [totalCount, setTotalCount] = useState(0);
```

**Query pattern:**
```typescript
let query = supabase
  .from('user_org_memberships')
  .select(`
    user_id,
    org_id,
    role,
    cohort_id,
    enrolled_at,
    active,
    organisations(name),
    cohorts(name),
    profiles!inner(
      full_name, role, function, seniority,
      ai_experience, current_level, platform_role
    )
  `, { count: 'exact' })
  .eq('active', true);

// Apply filters
if (orgFilter) query = query.eq('org_id', orgFilter);
if (searchTerm) {
  query = query.or(
    `profiles.full_name.ilike.%${searchTerm}%`,
    { foreignTable: 'profiles' }
  );
}

// Pagination
const from = (page - 1) * PAGE_SIZE;
query = query.range(from, from + PAGE_SIZE - 1);

// Sort
query = query.order(sortColumn, { ascending: sortAsc });
```

**Note on email search:** The `profiles` table doesn't store email — that's in `auth.users`, which can't be queried directly from the client. For V1, search is limited to `full_name`. To enable email search, add a denormalised `email` column to `profiles` that's populated on sign-in (or use a Supabase Edge Function that queries `auth.users` with the service role key). Document this as a V1 limitation.

**Pagination controls:**
- `display: flex`, `justifyContent: space-between`, `alignItems: center`
- `padding: 12px 16px`, `borderTop: 1px solid #E2E8F0`
- Left: "Showing N–M of T users" (`fontSize: 12`, `color: #A0AEC0`)
- Right: "← Previous" and "Next →" buttons
  - `padding: 6px 14px`, `borderRadius: 8`, `border: 1px solid #E2E8F0`, `fontSize: 12`, `fontWeight: 600`
  - Disabled state: `opacity: 0.4`, `cursor: not-allowed`
  - Between them: "Page X of Y" (`fontSize: 12`, `color: #718096`)

### 2.6 Empty State

If no users match the current filters:
- AdminEmptyState component (from PRD-11)
- Icon: `Users`
- Title: "No users found"
- Description varies:
  - If search/filter active: "No users match your current filters. Try adjusting your search."
  - If no users at all: "No users have enrolled yet. Create an enrollment channel to get started."

### 2.7 Sorting

Default sort: `enrolled_at` descending (most recently enrolled first).

Clickable column headers toggle sort direction. Active sort column shows a chevron icon. Only one column sorts at a time.

**Sortable columns and their sort keys:**
| Column | Sort key |
|---|---|
| Name | `profiles.full_name` |
| Email | Not sortable (V1 — email not in profiles) |
| Organisation | `organisations.name` |
| Level | `profiles.current_level` |
| Tool Usage | Derived — sort client-side after fetch |
| Last Active | Derived — sort client-side after fetch |

For derived columns (Tool Usage, Last Active), sort client-side within the current page. This is acceptable for V1 with 20 rows per page.

---

## 3. User Detail Drawer

When the admin clicks a row in the users table, a **slide-in drawer** opens from the right side of the screen. This is a drawer, not a new page — the table remains visible (dimmed) behind it.

### 3.1 Drawer Container

```tsx
// Overlay
<div style={{
  position: 'fixed', inset: 0, background: 'rgba(26, 32, 44, 0.3)',
  zIndex: 40, transition: 'opacity 0.2s ease',
}} onClick={onClose} />

// Drawer panel
<div style={{
  position: 'fixed', top: 0, right: 0, bottom: 0,
  width: 520, maxWidth: '90vw',
  background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
  boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
  zIndex: 41, overflowY: 'auto',
  transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.25s ease',
}}>
```

### 3.2 Drawer Header

```
┌────────────────────────────────────────────┐
│  [×]                                       │
│                                            │
│  ( J )  Jane Smith                         │
│         j.smith@acme.com                   │
│         Acme Corp · Q1 2026 Cohort         │
│                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │ Level 2│ │ Active │ │Enrolled│         │
│  │        │ │        │ │12 Mar  │         │
│  └────────┘ └────────┘ └────────┘         │
└────────────────────────────────────────────┘
```

**Close button:** Top-right, `X` icon, `24px`, `color: #A0AEC0`, hover: `color: #718096`

**Avatar:** `width: 48`, `height: 48`, `borderRadius: '50%'`, `background: #E2E8F0`, initial letter (`fontSize: 18`, `fontWeight: 700`, `color: #4A5568`)

**Name:** `fontSize: 18`, `fontWeight: 800`, `color: #1A202C`

**Email:** `fontSize: 13`, `color: #718096`, `marginTop: 2`

**Org + Cohort line:** `fontSize: 13`, `color: #A0AEC0`, `marginTop: 2`. Format: "Org Name · Cohort Name" or just "Org Name" if no cohort.

**Three summary pills** — `display: flex`, `gap: 10`, `marginTop: 16`:

Each pill:
- `padding: 8px 14px`, `borderRadius: 10`, `background: #F7FAFC`, `border: 1px solid #E2E8F0`
- Label: `fontSize: 10`, `fontWeight: 700`, `color: #A0AEC0`, `textTransform: 'uppercase'`, `letterSpacing: '0.04em'`
- Value: `fontSize: 15`, `fontWeight: 700`, `color: #1A202C`, `marginTop: 2`

| Pill | Label | Value |
|---|---|---|
| Current Level | "LEVEL" | Level pill badge (e.g., "L2 — Applied") |
| Status | "STATUS" | "Active" (green) / "Stalled" (amber) / "Never Active" (grey) |
| Enrolled | "ENROLLED" | Formatted date |

**Header padding:** `padding: 24px 24px 20px`
**Header border:** `borderBottom: 1px solid #E2E8F0`

### 3.3 Drawer Body — Sections

Below the header, the drawer body (`padding: 0`) contains four collapsible sections stacked vertically. Each section has a header bar that toggles expansion.

**Section header bar:**
```tsx
<button onClick={() => toggle(sectionId)} style={{
  width: '100%', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 24px', border: 'none', background: 'transparent',
  borderBottom: '1px solid #F7FAFC', cursor: 'pointer',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Icon size={15} color="#A0AEC0" />
    <span style={{ fontSize: 13, fontWeight: 700, color: '#2D3748' }}>{title}</span>
    {badge && <span style={{
      fontSize: 11, fontWeight: 600, padding: '1px 8px',
      borderRadius: 10, background: '#F7FAFC', color: '#718096',
    }}>{badge}</span>}
  </div>
  <ChevronDown size={14} color="#A0AEC0"
    style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
</button>
```

**Section content:** `padding: 0 24px 20px`, animated expand with `max-height` transition.

All four sections start **expanded** by default.

#### Section 1: Profile

**Icon:** `User` | **Title:** "Profile" | **Badge:** none

A compact key-value list of the user's profile fields:

| Label | Value | Source |
|---|---|---|
| Role | profiles.role | |
| Function | profiles.function (or functionOther) | |
| Seniority | profiles.seniority | |
| AI Experience | profiles.ai_experience — rendered as a human-readable label | |
| Ambition | profiles.ambition — rendered as a human-readable label | |
| Challenge | profiles.challenge | |

**AI Experience label mapping:**
```typescript
const AI_EXP_LABELS: Record<string, string> = {
  'beginner': 'Beginner',
  'comfortable-user': 'Comfortable User',
  'builder': 'Builder',
  'integrator': 'Integrator',
};
```

**Ambition label mapping:**
```typescript
const AMBITION_LABELS: Record<string, string> = {
  'confident-daily-use': 'Confident Daily Use',
  'build-reusable-tools': 'Build Reusable Tools',
  'own-ai-processes': 'Own AI Processes',
  'build-full-apps': 'Build Full Apps',
  'lead-ai-strategy': 'Lead AI Strategy',
};
```

Each row: `display: flex`, `justifyContent: space-between`, `padding: 8px 0`, `borderBottom: 1px solid #F7FAFC`.
Label: `fontSize: 12`, `fontWeight: 600`, `color: #A0AEC0`.
Value: `fontSize: 13`, `color: #2D3748`. If empty: "—" in `color: #CBD5E0`.

**Incomplete profile indicator:** If any of the key fields (role, function, seniority) are empty, show a small note below the list: "Profile incomplete — the user hasn't filled in all fields yet." (`fontSize: 11`, `color: #A0AEC0`, `fontStyle: italic`).

#### Section 2: Level Progress

**Icon:** `BookOpen` | **Title:** "Level Progress" | **Badge:** "N/5 tools used"

A five-row progress grid showing the user's status at each level:

```
┌───────────────────────────────────────────┐
│ L1 ████████████ ✓ Tool  ✓ Workshop       │
│ L2 ██████░░░░░░ ✓ Tool  — Workshop       │
│ L3 ░░░░░░░░░░░░ — Tool  — Workshop       │
│ L4 ░░░░░░░░░░░░ — Tool  — Workshop       │
│ L5 ░░░░░░░░░░░░ — Tool  — Workshop       │
└───────────────────────────────────────────┘
```

Each row:
- **Level pill** (reuse `LEVEL_PILL_STYLES`)
- **Level name** (`fontSize: 12`, `color: #2D3748`, `fontWeight: 500`)
- **Tool Used indicator:** checkmark (`color: #48BB78`) or dash (`color: #CBD5E0`)
- **Workshop Attended indicator:** checkmark or dash, same colours

Row layout: `display: grid`, `gridTemplateColumns: '36px 1fr 80px 80px'`, `gap: 8`, `alignItems: center`, `padding: 8px 0`, `borderBottom: 1px solid #F7FAFC`.

**Data source:** `level_progress` table rows for this user. Each row has `level`, `tool_used`, `workshop_attended`.

For levels with no `level_progress` row: show dashes for both indicators.

#### Section 3: Toolkit Activity

**Icon:** `Wrench` | **Title:** "Toolkit Activity" | **Badge:** "N artefacts saved"

Shows which tools the user has engaged with and how many artefacts they've saved per tool.

```
┌───────────────────────────────────────────┐
│ Prompt Playground      3 saved            │
│ Agent Builder          1 saved            │
│ Workflow Canvas        0 saved            │
│ App Designer           0 saved            │
│ App Evaluator          0 saved            │
└───────────────────────────────────────────┘
```

**Data source:** Count `saved_prompts` grouped by `source_tool` for this user:
```typescript
const { data } = await supabase
  .from('saved_prompts')
  .select('source_tool')
  .eq('user_id', userId);

const toolCounts = (data || []).reduce((acc, row) => {
  const tool = row.source_tool || 'unknown';
  acc[tool] = (acc[tool] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

**Tool display mapping:**
```typescript
const TOOL_DISPLAY: Record<string, { label: string; icon: string }> = {
  'prompt-playground':     { label: 'Prompt Playground', icon: 'MessageSquare' },
  'agent-builder':         { label: 'Agent Builder', icon: 'Bot' },
  'workflow-designer':     { label: 'Workflow Canvas', icon: 'GitBranch' },
  'dashboard-designer':    { label: 'App Designer', icon: 'Layout' },
  'product-architecture':  { label: 'App Evaluator', icon: 'Cpu' },
};
```

Each row: tool icon (16px, `color: #A0AEC0`) + tool name (`fontSize: 13`, `color: #2D3748`) + count on the right (`fontSize: 13`, `fontWeight: 600`, `color: count > 0 ? '#1A202C' : '#CBD5E0'`).

#### Section 4: Membership & Admin

**Icon:** `Shield` | **Title:** "Membership" | **Badge:** none

Shows the user's org membership details and provides admin actions.

**Membership details** (key-value list, same pattern as Profile section):

| Label | Value |
|---|---|
| Organisation | org name |
| Org Role | membership.role — pill badge (learner/facilitator/admin) |
| Cohort | cohort name or "—" |
| Enrolled Via | channel label + channel type badge, or "Manual" |
| Enrolled At | formatted date |
| Platform Role | platform_role pill badge |

**Org Role pill styles:**
```typescript
const ORG_ROLE_STYLES = {
  learner:     { bg: '#EDF2F7', text: '#4A5568' },
  facilitator: { bg: '#EBF4FF', text: '#2B6CB0' },
  admin:       { bg: '#FAF5FF', text: '#6B46C1' },
};
```

**Platform Role pill styles:**
```typescript
const PLATFORM_ROLE_STYLES = {
  learner:      { bg: '#EDF2F7', text: '#4A5568' },
  client_admin: { bg: '#FAF5FF', text: '#6B46C1' },
  oxygy_admin:  { bg: '#E6FFFA', text: '#1A6B5F' },
  super_admin:  { bg: '#FED7D7', text: '#9B2C2C' },
};
```

**Admin actions** — below the membership details, separated by `borderTop: 1px solid #EDF2F7`, `paddingTop: 16px`, `marginTop: 16px`:

**Change Org Role:**
- Dropdown to change the user's `role` in `user_org_memberships`
- Options: "Learner", "Facilitator", "Admin"
- On change: update the membership, write audit log, show toast
- Label: "Change organisation role" (`fontSize: 12`, `fontWeight: 600`, `color: #4A5568`)

**Deactivate User:**
- Red text link: "Deactivate this user's membership" (`fontSize: 12`, `color: #E53E3E`, `cursor: pointer`)
- On click: ConfirmDialog — "This will prevent {name} from accessing the platform under {org}. Their data will be preserved."
- On confirm: set `user_org_memberships.active = false`, write audit log, show toast, close drawer

---

## 4. Users Tab on Org Detail Page

**Location:** Organisation detail page (`/admin/organisations/:id`), "Users" tab (replaces placeholder from PRD-11)

### 4.1 Behaviour

This tab renders the **same `UsersTable` component** as the global Users page, but with the organisation filter pre-set and hidden (since the user is already scoped to this org).

**Differences from global view:**
- No "Organisation" column in the table (it's redundant)
- Organisation filter dropdown is hidden
- The "Invite User" button pre-selects this org in the invite modal
- Page title is the section label "USERS" instead of the page h1

### 4.2 Implementation

Extract the table, search/filter bar, and pagination into a shared `UsersTable` component:

```typescript
interface UsersTableProps {
  orgId?: string;       // If set, filter to this org and hide org column
  showOrgColumn?: boolean;
  onInvite?: () => void; // Callback for invite button — pre-populates org in modal
}
```

The global users page renders `<UsersTable />` with no props (all orgs, show org column).

The org detail users tab renders `<UsersTable orgId={orgId} showOrgColumn={false} />`.

---

## 5. Invite User Modal

Opened when the admin clicks "Invite User" from either the global Users page or the org detail Users tab.

### 5.1 Modal Layout

```
┌──────────────────────────────────────────┐
│  Invite User                      [×]    │
├──────────────────────────────────────────┤
│                                          │
│  Email Address *                         │
│  [ __________________________________ ]  │
│                                          │
│  Organisation *                          │
│  [ Select organisation ▾         ]       │
│                                          │
│  Cohort (optional)                       │
│  [ Select cohort ▾               ]       │
│                                          │
│  Organisation Role                       │
│  ○ Learner  ○ Facilitator  ○ Admin       │
│                                          │
├──────────────────────────────────────────┤
│                  [Cancel] [Send Invite]   │
└──────────────────────────────────────────┘
```

Same modal container spec as PRD-12 channel creation modal.

### 5.2 Fields

**Email Address:**
- Standard admin text input, `type: email`
- Required. Validated for email format.
- Placeholder: "user@company.com"

**Organisation:**
- `<select>` dropdown listing all active organisations
- Required.
- If opened from an org detail page: pre-selected and optionally locked (non-editable)

**Cohort:**
- `<select>` dropdown listing active cohorts for the selected org
- Optional. Shows "No cohort" as default.
- Updates when the organisation selection changes.
- If no cohorts exist for the selected org: shows "No cohorts available" (disabled)

**Organisation Role:**
- Radio buttons: Learner (default), Facilitator, Admin
- Same card-style radio pattern as PRD-11 tier selector, but simpler (just the label, no description)

### 5.3 Submit Behaviour

The invite flow differs from the enrollment channel flow because the admin is adding a specific user by email, not generating a link for self-service enrollment.

**Two scenarios:**

**Scenario A — User already has a Supabase auth account (email exists in `auth.users`):**
1. Look up the user by email using a Cloud Function endpoint (client can't query `auth.users` directly)
2. Create the `user_org_memberships` record with the specified org, cohort, and role
3. Write audit log: `action: 'user.invite'`, metadata includes email, org, role
4. Show success toast: "User enrolled"
5. Close modal, refresh table

**Scenario B — User doesn't have an account yet:**
1. The Cloud Function calls `supabase.auth.admin.inviteUserByEmail(email)` which sends a Supabase invite email
2. When the user accepts the invite and signs in, a profile is auto-created (PRD-10 §3.2.1)
3. A pending membership record is created: `user_org_memberships` with `active = true` but a `pending_email` flag (new nullable column — see §5.4)
4. When the user's profile is created on first sign-in, match by email and activate the membership
5. Write audit log
6. Show toast: "Invite sent to {email}"

### 5.4 Schema Addition for Pending Invites

Add a column to `user_org_memberships` to handle invited-but-not-yet-signed-up users:

```sql
alter table user_org_memberships
  add column if not exists pending_email text;
```

When an admin invites a user by email who doesn't have an account:
- `user_id` is set to a placeholder (the Supabase service role can pre-create the auth user via `admin.inviteUserByEmail`, which returns a user ID)
- `pending_email` stores the email for reference

In practice, `supabase.auth.admin.inviteUserByEmail()` creates the `auth.users` record immediately and returns the user ID, so `user_id` can always be set correctly. The `pending_email` field is informational — it lets the admin see which invites are pending in the users table.

### 5.5 Cloud Function: Invite User

**New endpoint:** `POST /api/admin/invite-user`

**File:** Added to `functions/src/index.ts`

**Request body:**
```typescript
{
  email: string;
  orgId: string;
  cohortId?: string;
  role: 'learner' | 'facilitator' | 'admin';
}
```

**Logic:**
1. Verify the caller is an Oxygy admin (check JWT claims or query `profiles.platform_role`)
2. Check if a user with this email already exists via `supabase.auth.admin.listUsers({ filter: email })`
3. If exists: create the membership directly with the existing user's ID
4. If not: call `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })` to send an invite, then create the membership with the returned user ID
5. Write audit log
6. Return success

**Firebase config:**
```json
{ "source": "/api/admin/invite-user", "function": { "functionId": "admininviteuser" } }
```

### 5.6 Validation

- Email: required, valid email format
- Organisation: required
- Duplicate check: if the user is already an active member of the selected org, show error: "This user is already enrolled in {org name}."

---

## 6. CSV Export

### 6.1 What Gets Exported

The current **filtered** user list — respecting search term, org filter, level filter, and status filter. All matching rows are exported, not just the current page.

### 6.2 Export Columns

| Column | Header in CSV |
|---|---|
| Full Name | `name` |
| Email | `email` |
| Organisation | `organisation` |
| Cohort | `cohort` |
| Current Level | `current_level` |
| Tools Used | `tools_used` |
| Last Active | `last_active` |
| Status | `status` |
| Enrolled Date | `enrolled_at` |
| Org Role | `org_role` |

### 6.3 Implementation

```typescript
function exportUsersCSV(users: UserRow[]) {
  const headers = ['name', 'email', 'organisation', 'cohort', 'current_level',
                    'tools_used', 'last_active', 'status', 'enrolled_at', 'org_role'];
  const rows = users.map(u => [
    u.fullName, u.email || '', u.orgName, u.cohortName || '',
    u.currentLevel, u.toolsUsed, u.lastActive || 'Never',
    u.status, u.enrolledAt, u.orgRole,
  ]);

  const csv = [headers.join(','), ...rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  )].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `oxygy-users-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Note on email in CSV:** Since email is not stored in `profiles` (V1 limitation noted in §2.5), the email column will be empty in the CSV unless the denormalised email column is added. For V1, the CSV omits the email column. When the email denormalisation is implemented, add it back.

**For full export (not just current page):** Fetch all matching rows in a single query without `.range()`. For user counts under 1000, this is fast enough. For larger datasets, implement streaming or chunked fetching.

---

## 7. Data Fetching

### 7.1 Users Table Query

The main query fetches user memberships with joined profile and org data:

```typescript
async function fetchUsers(params: {
  page: number;
  pageSize: number;
  orgId?: string;
  levelFilter?: number;
  searchTerm?: string;
  sortColumn?: string;
  sortAsc?: boolean;
}) {
  let query = supabase
    .from('user_org_memberships')
    .select(`
      id, user_id, org_id, role, cohort_id, enrolled_at, enrolled_via, active,
      organisations(name),
      cohorts(name),
      profiles!inner(
        full_name, role, function, seniority,
        ai_experience, ambition, current_level, streak_days, platform_role
      )
    `, { count: 'exact' })
    .eq('active', true);

  if (params.orgId) query = query.eq('org_id', params.orgId);
  if (params.levelFilter) {
    query = query.eq('profiles.current_level', params.levelFilter);
  }
  if (params.searchTerm) {
    query = query.ilike('profiles.full_name', `%${params.searchTerm}%`);
  }

  const from = (params.page - 1) * params.pageSize;
  query = query.range(from, from + params.pageSize - 1);

  if (params.sortColumn) {
    query = query.order(params.sortColumn, { ascending: params.sortAsc ?? true });
  } else {
    query = query.order('enrolled_at', { ascending: false });
  }

  const { data, error, count } = await query;
  return { users: data || [], total: count || 0, error };
}
```

### 7.2 User Detail Data

When the drawer opens, fetch additional data for the selected user:

```typescript
async function fetchUserDetail(userId: string) {
  const [progress, prompts, insights] = await Promise.all([
    supabase.from('level_progress').select('*').eq('user_id', userId),
    supabase.from('saved_prompts').select('source_tool').eq('user_id', userId),
    supabase.from('application_insights').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ]);

  return {
    levelProgress: progress.data || [],
    savedPrompts: prompts.data || [],
    lastActivity: insights.data?.[0]?.created_at || null,
  };
}
```

### 7.3 Denormalised Last Activity

Computing "last active" accurately requires checking multiple tables per user, which is expensive for the table view. Two approaches:

**V1 (acceptable for <500 users):** After fetching the users table, run a batch query for each user's last activity. This adds ~200ms of latency.

**V2 (recommended when scaling):** Add a `last_active_at` column to `profiles`, updated via Supabase triggers on `level_progress`, `saved_prompts`, and `application_insights` writes:
```sql
create or replace function update_last_active()
returns trigger as $$
begin
  update profiles set updated_at = now() where id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_level_progress_activity after insert or update on level_progress
  for each row execute function update_last_active();
-- Repeat for saved_prompts, application_insights
```

For this PRD, use the V1 approach. Document V2 as a future optimisation.

---

## 8. File Structure

### 8.1 New Files

```
pages/admin/
└── AdminUsers.tsx                    # Global users page

components/admin/users/
├── UsersTable.tsx                    # Shared table component (used by global page + org tab)
├── UserSearchBar.tsx                 # Search + filters bar
├── UserDetailDrawer.tsx              # Slide-in drawer with user detail sections
├── InviteUserModal.tsx               # Modal for inviting a user by email
├── UserProfileSection.tsx            # Drawer section: profile fields
├── UserProgressSection.tsx           # Drawer section: level progress grid
├── UserToolkitSection.tsx            # Drawer section: toolkit activity
└── UserMembershipSection.tsx         # Drawer section: membership + admin actions
```

### 8.2 Modified Files

| File | Change |
|---|---|
| `App.tsx` | Replace `/admin/users` placeholder route with real `AdminUsers` page import |
| `pages/admin/AdminOrgDetail.tsx` | Replace Users tab placeholder with `<UsersTable orgId={orgId} showOrgColumn={false} />` |
| `lib/database.ts` | Add `fetchUsers()`, `fetchUserDetail()`, `updateMembershipRole()`, `deactivateMembership()` functions |
| `functions/src/index.ts` | Add `admininviteuser` Cloud Function endpoint |
| `firebase.json` | Add rewrite for `/api/admin/invite-user` |
| `supabase/schema.sql` | Add `pending_email` column to `user_org_memberships` |

### 8.3 Files NOT Changed

All learner-facing files remain untouched. The admin shell, sidebar, top bar, and org CRUD pages (PRD-11) are not modified. The enrollment tab and workshops tab (PRD-12) are not modified.

---

## 9. Edge Cases

### 9.1 User Belongs to Multiple Organisations

The users table shows one row per membership, not one row per user. If a user belongs to two orgs, they appear twice in the global table. The org-filtered table shows them once. The drawer shows the membership context for whichever row was clicked.

### 9.2 User with No Profile

If a user was invited (auth record exists) but hasn't completed the onboarding profile, their profile fields will be empty. The drawer handles this gracefully — the Profile section shows "—" for empty fields and the incomplete profile indicator.

### 9.3 Deactivated User Membership

Deactivated memberships are hidden from the default table view (the query filters `active = true`). To see deactivated users, the admin would need to toggle the status filter to include inactive — this is a V2 enhancement. For V1, deactivated users disappear from the table.

### 9.4 Inviting a User Who Is Already Enrolled Elsewhere

If the admin invites `jane@acme.com` to Org B, and she's already in Org A, a second membership is created. This is by design — the data model supports multi-org membership. The user will have two rows in the global table.

### 9.5 Very Large User Counts

The server-side pagination (20 per page) keeps the initial load fast. The CSV export fetches all matching rows — for 1000+ users, this may take a few seconds. Add a loading state on the export button ("Exporting..." with spinner) while the full fetch runs.

### 9.6 Race Condition on Role Change

If two admins change the same user's role simultaneously, last-write-wins. The audit log records both changes. No optimistic locking in V1.

---

## 10. Responsive Behaviour

Same rules as PRD-11: minimum 1024px, horizontal scroll below that. The user detail drawer overlays the table at all widths. On narrow screens, the drawer takes the full viewport width (`maxWidth: 90vw` already handles this).

---

## 11. Implementation Checklist

### Global Users Page
- [ ] `AdminUsers.tsx` with page header and "Invite User" button
- [ ] `UserSearchBar` with search input, org filter, level filter, status filter, CSV export button
- [ ] `UsersTable` component with all eight columns
- [ ] Server-side pagination with Supabase `.range()`
- [ ] Column sorting (name, org, level, tool usage, last active)
- [ ] Empty states for no results and no users

### Users Tab on Org Detail
- [ ] Replace placeholder with `<UsersTable orgId={orgId} showOrgColumn={false} />`
- [ ] Org filter pre-set and hidden

### User Detail Drawer
- [ ] `UserDetailDrawer` with slide-in animation and overlay
- [ ] Drawer header: avatar, name, email, org/cohort, three summary pills
- [ ] Profile section: key-value list of profile fields
- [ ] Level Progress section: five-row grid with tool/workshop indicators
- [ ] Toolkit Activity section: per-tool saved counts
- [ ] Membership section: membership details + role change dropdown + deactivate action
- [ ] Close on overlay click and × button

### Invite User
- [ ] `InviteUserModal` with email, org, cohort, role fields
- [ ] Org pre-selection when opened from org detail page
- [ ] Cohort dropdown updates when org changes
- [ ] Duplicate membership check before submit
- [ ] `admininviteuser` Cloud Function: look up or invite user, create membership
- [ ] Firebase rewrite for `/api/admin/invite-user`
- [ ] Audit log entry on invite
- [ ] Toast: "User enrolled" or "Invite sent to {email}"

### CSV Export
- [ ] Fetch all filtered rows (not just current page)
- [ ] Generate CSV with proper escaping
- [ ] Download with date-stamped filename
- [ ] Loading state on export button during fetch

### Data & Backend
- [ ] `fetchUsers()` in `lib/database.ts` with pagination, filtering, sorting
- [ ] `fetchUserDetail()` for drawer data
- [ ] `updateMembershipRole()` + audit log
- [ ] `deactivateMembership()` + audit log
- [ ] `pending_email` column added to `user_org_memberships`

### Post-Implementation Verification
- [ ] Global users table shows users from all orgs with correct data
- [ ] Org detail users tab shows only users from that org
- [ ] Search filters by name across the table
- [ ] Org, level, and status filters work correctly and combine with each other
- [ ] Pagination controls advance through pages correctly
- [ ] Column sorting works for all sortable columns
- [ ] Clicking a row opens the drawer with correct user data
- [ ] All four drawer sections display data accurately
- [ ] Role change dropdown updates the membership and shows toast
- [ ] Deactivate removes the user from the table view
- [ ] Invite modal creates a membership for existing users
- [ ] Invite modal sends an invite email for new users
- [ ] CSV export downloads with correct filtered data
- [ ] Audit log entries written for invite, role change, and deactivation

---

*End of PRD-13*
