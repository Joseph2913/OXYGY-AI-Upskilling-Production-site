# PRD-11: Admin Shell, Routing & Organisation CRUD

> **Status:** Draft
> **Author:** Oxygy Design Agent
> **Date:** 16 March 2026
> **Depends on:** PRD-10 (Auth & Multi-Tenancy Foundation)
> **Blocks:** PRD-12 (Enrollment), PRD-13 (User Mgmt), PRD-14 (Analytics), PRD-15 (Settings), PRD-16 (Client Admin)

---

## 1. Overview

### 1.1 Purpose

This PRD builds the Oxygy Platform Admin interface — the operational control panel used by the Oxygy team to manage client organisations, monitor the platform, and configure programmes. It replaces the placeholder admin components scaffolded in PRD-10 with a fully functional admin shell and organisation management workflow.

After this PRD is implemented, an Oxygy admin can:
1. Log in and access a dedicated admin interface at `/admin`
2. View a list of all client organisations with key metrics
3. Create a new organisation with name, tier, contact details, and level access configuration
4. View an organisation's detail page with a tabbed layout (Overview, Users, Enrollment, Workshops, Programme)
5. Edit an organisation's settings
6. Deactivate or reactivate an organisation
7. See a stub admin dashboard with placeholder metric cards (real data comes in PRD-14)

### 1.2 Design Philosophy

The admin interface is an **operational workspace**, not a showcase. It prioritises information density, fast navigation, and efficient data entry over visual flair. The design borrows structural patterns from the learner app (dark navy sidebar, DM Sans typography, Oxygy colour tokens) but uses a denser layout and a distinct accent colour to make it visually clear that the user is in admin mode.

**Admin accent colour:** `#E53E3E` (red-500) — used sparingly for the "ADMIN" badge and destructive actions. The primary interactive colour remains Oxygy teal (`#38B2AC`) for consistency with the rest of the platform.

### 1.3 Non-Goals

This PRD does NOT build:
- Enrollment channels or join flows (PRD-12)
- User management table or user detail views (PRD-13)
- Analytics dashboard with real data (PRD-14)
- Audit log viewer, feature flags, or system settings (PRD-15)
- Client admin dashboard (PRD-16)

The Users, Enrollment, Workshops, and Programme tabs on the org detail page are rendered as placeholder panels with "Coming in PRD-12/13" messaging. Only the Overview tab has real content.

---

## 2. Route Structure

All admin routes live under `/admin`. PRD-10 established the `AdminAuthGuard` that gates this entire tree — only users with `platform_role = 'oxygy_admin'` or `'super_admin'` can access it.

```
/admin                              → Admin Dashboard (overview with placeholder metrics)
/admin/organisations                → Organisation list (searchable table)
/admin/organisations/new            → Create organisation form
/admin/organisations/:id            → Organisation detail (tabbed view)
/admin/organisations/:id/edit       → Edit organisation form
/admin/users                        → Placeholder ("Coming in PRD-13")
/admin/content                      → Placeholder ("Coming in PRD-15")
/admin/settings                     → Placeholder ("Coming in PRD-15")
```

**Implementation in `App.tsx`:**

Replace the placeholder admin routes from PRD-10 with:

```tsx
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrgList = React.lazy(() => import('./pages/admin/AdminOrgList'));
const AdminOrgCreate = React.lazy(() => import('./pages/admin/AdminOrgCreate'));
const AdminOrgDetail = React.lazy(() => import('./pages/admin/AdminOrgDetail'));
const AdminOrgEdit = React.lazy(() => import('./pages/admin/AdminOrgEdit'));
const AdminPlaceholder = React.lazy(() => import('./pages/admin/AdminPlaceholder'));

<Route path="/admin" element={<AdminAuthGuard><AdminLayout /></AdminAuthGuard>}>
  <Route index element={<AppSuspense><AdminDashboard /></AppSuspense>} />
  <Route path="organisations" element={<AppSuspense><AdminOrgList /></AppSuspense>} />
  <Route path="organisations/new" element={<AppSuspense><AdminOrgCreate /></AppSuspense>} />
  <Route path="organisations/:id" element={<AppSuspense><AdminOrgDetail /></AppSuspense>} />
  <Route path="organisations/:id/edit" element={<AppSuspense><AdminOrgEdit /></AppSuspense>} />
  <Route path="users" element={<AppSuspense><AdminPlaceholder page="Users" comingIn="PRD-13" /></AppSuspense>} />
  <Route path="content" element={<AppSuspense><AdminPlaceholder page="Content" comingIn="PRD-15" /></AppSuspense>} />
  <Route path="settings" element={<AppSuspense><AdminPlaceholder page="Settings" comingIn="PRD-15" /></AppSuspense>} />
</Route>
```

---

## 3. Admin Shell

### 3.1 AdminLayout

**File:** `components/admin/AdminLayout.tsx`

Same structural pattern as the learner's `AppLayout.tsx` — sidebar, top bar, and `<Outlet />` content area. Wraps all `/admin/*` routes.

```
┌──────────┬─────────────────────────────────────────────┐
│          │ AdminTopBar (54px, sticky)                   │
│  Admin   ├─────────────────────────────────────────────┤
│  Sidebar │                                             │
│  (60px   │  <Outlet />                                 │
│  collapsed│  (page content, bg: #F7FAFC)               │
│  240px   │                                             │
│  expanded)│                                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

**Implementation:**
```tsx
export const AdminLayout: React.FC = () => {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AdminSidebar />
      <div style={{ marginLeft: SIDEBAR_COLLAPSED_WIDTH }}>
        <AdminTopBar />
        <div style={{ background: '#F7FAFC', minHeight: 'calc(100vh - 54px)' }}>
          <Outlet />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};
```

### 3.2 AdminSidebar

**File:** `components/admin/AdminSidebar.tsx`

Mirrors the learner sidebar's expand-on-hover behaviour but with a distinct identity.

#### Section 1 — Logo Area (54px height, matches top bar)

- Same OXYGY logo block as the learner sidebar (teal square with "O", expands to show "OXYGY" text)
- Below "OXYGY" text: **"ADMIN"** badge instead of "AI Upskilling"
  - Badge style: `background: #E53E3E`, `color: #FFFFFF`, `fontSize: 9`, `fontWeight: 700`, `letterSpacing: '0.1em'`, `padding: '2px 6px'`, `borderRadius: 4`, `textTransform: 'uppercase'`
  - Only visible when sidebar is expanded

#### Section 2 — Admin User Identity

- Same layout as learner sidebar: avatar circle + name
- Below the name, show `platform_role` as a pill badge:
  - `super_admin`: `background: rgba(229, 62, 62, 0.13)`, `border: 1px solid rgba(229, 62, 62, 0.27)`, `color: #FC8181`
  - `oxygy_admin`: `background: rgba(56, 178, 172, 0.13)`, `border: 1px solid rgba(56, 178, 172, 0.27)`, `color: #4FD1C5`
- Avatar circle colour: `#E53E3E` (instead of learner's teal) — visual cue that this is the admin context

#### Section 3 — Navigation

Five nav items:

| Label | Icon (Lucide) | Path | Active match |
|---|---|---|---|
| Dashboard | `LayoutDashboard` | `/admin` | Exact match |
| Organisations | `Building2` | `/admin/organisations` | Starts with `/admin/organisations` |
| Users | `Users` | `/admin/users` | Starts with `/admin/users` |
| Content | `BookOpen` | `/admin/content` | Exact match |
| Settings | `Settings` | `/admin/settings` | Exact match |

**Active state:** Same as learner sidebar — 3px teal left border, `rgba(56, 178, 172, 0.10)` background, teal icon, white text.

**Hover state:** Same as learner sidebar — `rgba(255, 255, 255, 0.06)` background.

#### Section 4 — Bottom Utilities

- **"Switch to Learner View"** link: `ExternalLink` icon, navigates to `/app/dashboard` in the same tab
- **Sign Out** button: `LogOut` icon, calls `signOut()` from AuthContext

#### Specs

All dimensional specs match the learner sidebar exactly: `SIDEBAR_COLLAPSED_WIDTH = 60`, `SIDEBAR_EXPANDED_WIDTH = 240`, `transition: width 0.2s ease`, expand on `onMouseEnter`, collapse on `onMouseLeave`.

### 3.3 AdminTopBar

**File:** `components/admin/AdminTopBar.tsx`

Same structural pattern as the learner's `AppTopBar.tsx`: 54px height, sticky, white background, border-bottom.

**Left side — Breadcrumb:**
- Dynamic breadcrumb built from the current route
- Pattern: `Admin` → `Organisations` → `Acme Corp` (for org detail pages)
- Separator: `›` character, `color: #CBD5E0`, `padding: 0 8px`
- Each segment except the last is a clickable link (`color: #718096`, hover: `color: #38B2AC`)
- Last segment is plain text (`color: #1A202C`, `fontWeight: 600`)
- `fontSize: 13`, `fontFamily: 'DM Sans'`

**Breadcrumb route mapping:**
```typescript
const ROUTE_BREADCRUMBS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/organisations': 'Organisations',
  '/admin/organisations/new': 'New Organisation',
  '/admin/users': 'Users',
  '/admin/content': 'Content',
  '/admin/settings': 'Settings',
};
// For /admin/organisations/:id → fetch org name from context or URL state
// For /admin/organisations/:id/edit → append "Edit" to org name
```

**Right side — Admin user strip:**
- Admin's name (`fontSize: 13`, `color: #718096`)
- Avatar circle (same as sidebar — `background: #E53E3E`, white initial)

---

## 4. Admin Dashboard Page

**File:** `pages/admin/AdminDashboard.tsx`
**Route:** `/admin`

The landing page for the admin interface. In this PRD it shows placeholder metric cards and a link to the org list. Real data and charts are added in PRD-14.

### 4.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  h1: "Platform Overview"                            │
│  Description text                                   │
├──────┬──────┬──────┬──────┬──────┐                  │
│Card 1│Card 2│Card 3│Card 4│Card 5│  ← metric cards  │
└──────┴──────┴──────┴──────┴──────┘                  │
│                                                     │
│  [Organisation Health Table — placeholder]           │
│                                                     │
│  "View all organisations →" link                    │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 1200px`

### 4.2 Page Header

```tsx
<h1 style={{
  fontSize: 24, fontWeight: 800, color: '#1A202C',
  margin: 0, marginBottom: 4,
  fontFamily: "'DM Sans', sans-serif",
}}>
  Platform Overview
</h1>
<p style={{
  fontSize: 14, color: '#718096', margin: 0, marginBottom: 24,
  fontFamily: "'DM Sans', sans-serif",
}}>
  Cross-client metrics and programme health at a glance.
</p>
```

### 4.3 Metric Cards

Five cards in a single row using CSS Grid: `gridTemplateColumns: 'repeat(5, 1fr)'`, `gap: 16`.

Each card:
```
┌──────────────────────┐
│  LABEL (uppercase)   │
│  42                  │  ← large metric value
│  +3 this month       │  ← delta (optional)
└──────────────────────┘
```

**Card spec:**
- `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 20px`
- Label: `fontSize: 11`, `fontWeight: 700`, `color: #A0AEC0`, `textTransform: 'uppercase'`, `letterSpacing: '0.06em'`, `marginBottom: 8`
- Value: `fontSize: 28`, `fontWeight: 800`, `color: #1A202C`, `marginBottom: 4`
- Delta: `fontSize: 12`, `fontWeight: 500`, `color: #48BB78` (positive) or `#E53E3E` (negative)

**Placeholder values for this PRD:**

| Label | Value | Delta |
|---|---|---|
| Organisations | — | — |
| Total Users | — | — |
| Active (30d) | — | — |
| Avg Completion | — | — |
| Tool Usage | — | — |

All values show `—` (em dash) in a muted style (`color: #CBD5E0`) until PRD-14 wires up real data. The delta line shows "Data available in a future update" at `fontSize: 11`, `color: #CBD5E0`.

### 4.4 Organisation Health Table (Placeholder)

Below the metric cards, render a card with:
- Header: "Organisation Health" (`fontSize: 16`, `fontWeight: 700`)
- Body: "This table will show per-organisation health metrics once analytics data is available." (`fontSize: 13`, `color: #718096`, `padding: 24px`, centred)
- "View all organisations →" link at bottom-right: `fontSize: 13`, `fontWeight: 600`, `color: #38B2AC`, navigates to `/admin/organisations`

**Card spec:** `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 0`, `overflow: hidden`, `marginTop: 24`
- Header area: `padding: 16px 20px`, `borderBottom: 1px solid #E2E8F0`
- Body area: `padding: 32px 20px`, `textAlign: center`
- Footer area: `padding: 12px 20px`, `borderTop: 1px solid #E2E8F0`, `display: flex`, `justifyContent: flex-end`

---

## 5. Organisation List Page

**File:** `pages/admin/AdminOrgList.tsx`
**Route:** `/admin/organisations`

### 5.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  h1: "Organisations"   [+ New Organisation] button  │
│                                                     │
│  Search bar                    Filter: Tier ▾       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Name  │ Tier │ Users │ Active │ Created │ ⋯ │    │
│  ├───────┼──────┼───────┼────────┼─────────┼───│    │
│  │ Acme  │ Acc  │   47  │  Yes   │ 12 Mar  │ → │    │
│  │ Cont  │ Fdn  │  120  │  Yes   │  3 Feb  │ → │    │
│  │ Demo  │ Cat  │    5  │  No    │ 28 Jan  │ → │    │
│  └───────┴──────┴───────┴────────┴─────────┴───┘    │
│                                                     │
│  Showing 3 of 3 organisations                       │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 1200px`

### 5.2 Page Header

**Left:** Page title
```tsx
<h1 style={{
  fontSize: 24, fontWeight: 800, color: '#1A202C',
  margin: 0, fontFamily: "'DM Sans', sans-serif",
}}>
  Organisations
</h1>
```

**Right:** Create button
```tsx
// Primary action button — navigates to /admin/organisations/new
<button style={{
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 24, border: 'none',
  background: '#38B2AC', color: '#FFFFFF',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
}}>
  <Plus size={15} /> New Organisation
</button>
```

**Layout:** `display: flex`, `alignItems: center`, `justifyContent: space-between`, `marginBottom: 20`

### 5.3 Search & Filter Bar

**Layout:** `display: flex`, `alignItems: center`, `gap: 12`, `marginBottom: 16`

**Search input:**
- `flex: 1`, `maxWidth: 360px`
- `padding: 9px 14px 9px 36px` (left padding for search icon)
- `border: 1px solid #E2E8F0`, `borderRadius: 10`, `fontSize: 13`, `color: #2D3748`
- `background: #FFFFFF`
- Placeholder: "Search organisations..."
- Search icon (`Search` from Lucide, 15px, `color: #A0AEC0`) positioned absolutely inside the input
- Filters the table on `name` field, client-side (debounced 200ms)

**Tier filter:**
- `<select>` styled as a pill dropdown
- `padding: 9px 14px`, `border: 1px solid #E2E8F0`, `borderRadius: 10`, `fontSize: 13`, `background: #FFFFFF`, `color: #2D3748`
- Options: "All Tiers", "Foundation", "Accelerator", "Catalyst"
- Filters the table on `tier` field

### 5.4 Organisation Table

**Container card:** `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `overflow: hidden`

**Table spec:**
- `width: 100%`, `borderCollapse: collapse`
- Font: `fontFamily: "'DM Sans', sans-serif"`

**Header row:**
- `background: #F7FAFC`, `borderBottom: 1px solid #E2E8F0`
- Cell: `padding: 12px 16px`, `fontSize: 11`, `fontWeight: 700`, `color: #A0AEC0`, `textTransform: 'uppercase'`, `letterSpacing: '0.04em'`, `textAlign: left`

**Columns:**

| Column | Width | Content | Sortable |
|---|---|---|---|
| Name | 30% | Org name + domain (if set) | Yes (alphabetical) |
| Tier | 15% | Tier pill badge | Yes |
| Users | 12% | Enrolled user count | Yes (numeric) |
| Status | 12% | Active/Inactive badge | Yes |
| Created | 16% | Date in "12 Mar 2026" format | Yes (date) |
| Actions | 15% | "View →" link | No |

**Data rows:**
- `borderBottom: 1px solid #F7FAFC`
- Cell: `padding: 14px 16px`, `fontSize: 13`, `color: #2D3748`
- Hover: `background: #FAFAFA`
- Cursor: `pointer` (entire row is clickable, navigates to `/admin/organisations/:id`)

**Column-specific rendering:**

**Name column:**
```tsx
<div>
  <div style={{ fontWeight: 600, color: '#1A202C' }}>{org.name}</div>
  {org.domain && (
    <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>{org.domain}</div>
  )}
</div>
```

**Tier column — pill badge:**
```tsx
const TIER_STYLES = {
  foundation:  { bg: '#E6FFFA', text: '#1A6B5F', label: 'Foundation' },
  accelerator: { bg: '#EBF4FF', text: '#2B6CB0', label: 'Accelerator' },
  catalyst:    { bg: '#FAF5FF', text: '#6B46C1', label: 'Catalyst' },
};

<span style={{
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 600,
  background: TIER_STYLES[org.tier].bg,
  color: TIER_STYLES[org.tier].text,
}}>
  {TIER_STYLES[org.tier].label}
</span>
```

**Status column — active/inactive badge:**
```tsx
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 12, fontWeight: 500,
  color: org.active ? '#22543D' : '#9B2C2C',
}}>
  <span style={{
    width: 6, height: 6, borderRadius: '50%',
    background: org.active ? '#48BB78' : '#FC8181',
  }} />
  {org.active ? 'Active' : 'Inactive'}
</span>
```

**Actions column:**
```tsx
<span style={{ fontSize: 13, fontWeight: 600, color: '#38B2AC' }}>
  View →
</span>
```

**Sorting behaviour:**
- Clicking a column header toggles sort: ascending → descending → no sort
- Active sort column header shows a chevron icon (up or down)
- Default sort: name ascending

**Empty state (no organisations):**
- Replace the table body with a centred message: "No organisations yet. Create your first one to get started."
- Below: a teal "New Organisation" button (same as the header button)

**Footer:**
- `padding: 12px 16px`, `borderTop: 1px solid #E2E8F0`, `fontSize: 12`, `color: #A0AEC0`
- "Showing N of N organisations" (or filtered count if search/filter active)

### 5.5 Data Fetching

On mount, fetch all organisations:
```typescript
const { data, error } = await supabase
  .from('organisations')
  .select('*, user_org_memberships(count)')
  .order('name', { ascending: true });
```

The `user_org_memberships(count)` gives the enrolled user count per org without fetching all membership rows. Store in local state. No pagination needed for V1 (expected <50 orgs).

---

## 6. Create Organisation Page

**File:** `pages/admin/AdminOrgCreate.tsx`
**Route:** `/admin/organisations/new`

### 6.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Organisations                            │
│                                                     │
│  h1: "New Organisation"                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  ORGANISATION DETAILS                       │    │
│  │                                             │    │
│  │  Organisation Name *                        │    │
│  │  [ ___________________________________ ]    │    │
│  │                                             │    │
│  │  Email Domain                               │    │
│  │  [ ___________________________________ ]    │    │
│  │  (Optional — for domain-based auto-assign)  │    │
│  │                                             │    │
│  │  Programme Tier *                           │    │
│  │  ○ Foundation  ○ Accelerator  ○ Catalyst    │    │
│  │                                             │    │
│  │  Contact Name          Contact Email        │    │
│  │  [ ________________ ]  [ ________________ ] │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  LEVEL ACCESS                               │    │
│  │                                             │    │
│  │  ☑ Level 1: Fundamentals & Awareness        │    │
│  │  ☑ Level 2: Applied Capability              │    │
│  │  ☑ Level 3: Systemic Integration            │    │
│  │  ☐ Level 4: Interactive Dashboards          │    │
│  │  ☐ Level 5: Full AI Applications            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [ Cancel ]                [ Create Organisation ]  │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 720px`

### 6.2 Back Link

```tsx
<Link to="/admin/organisations" style={{
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, color: '#718096', textDecoration: 'none',
  marginBottom: 20, fontFamily: "'DM Sans', sans-serif",
}}>
  <ArrowLeft size={14} /> Back to Organisations
</Link>
```
Hover: `color: #38B2AC`

### 6.3 Form Sections

Each section is a white card: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 24px`, `marginBottom: 20`

**Section label (top of each card):**
```tsx
<div style={{
  fontSize: 11, fontWeight: 700, color: '#A0AEC0',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 20,
}}>
  {sectionTitle}
</div>
```

### 6.4 Form Fields

**Field label:**
```tsx
<label style={{
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#2D3748', marginBottom: 6,
  fontFamily: "'DM Sans', sans-serif",
}}>
  {label} {required && <span style={{ color: '#E53E3E' }}>*</span>}
</label>
```

**Text input:**
```tsx
<input style={{
  width: '100%', padding: '10px 14px',
  border: '1px solid #E2E8F0', borderRadius: 10,
  fontSize: 13, color: '#2D3748', background: '#FFFFFF',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}} />
```
Focus: `borderColor: '#38B2AC'`, `outline: none`, `boxShadow: '0 0 0 3px rgba(56, 178, 172, 0.1)'`

**Helper text (below input):**
- `fontSize: 11`, `color: '#A0AEC0'`, `marginTop: 4`

**Tier selector — radio button group:**

Three options displayed as selectable cards in a row: `display: flex`, `gap: 10`

Each option:
- `flex: 1`, `padding: 14px`, `borderRadius: 10`, `cursor: pointer`, `textAlign: center`
- Default: `border: 1px solid #E2E8F0`, `background: #FFFFFF`
- Selected: `border: 2px solid #38B2AC`, `background: #E6FFFA`
- Label: `fontSize: 13`, `fontWeight: 600`, `color: #2D3748` (default) / `#1A202C` (selected)
- Description below label: `fontSize: 11`, `color: #A0AEC0`, `marginTop: 4`

Tier descriptions:
- **Foundation:** "Core AI literacy — Levels 1-3"
- **Accelerator:** "Applied capability — Levels 1-4"
- **Catalyst:** "Full transformation — Levels 1-5"

Selecting a tier auto-updates the Level Access checkboxes to match the tier's default levels. The user can still manually override the checkboxes after selecting a tier.

**Contact fields — two columns:**
- `display: grid`, `gridTemplateColumns: '1fr 1fr'`, `gap: 16`

### 6.5 Level Access Section

Five checkboxes, each as a row:

```tsx
<label style={{
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 0', cursor: 'pointer',
  borderBottom: '1px solid #F7FAFC',
}}>
  <input type="checkbox" checked={levelAccess.includes(n)} onChange={...} />
  <span style={{ fontSize: 13, fontWeight: 500, color: '#2D3748' }}>
    Level {n}: {levelName}
  </span>
</label>
```

**Checkbox styling:** Custom checkbox using a 18px square with `border: 2px solid #E2E8F0`, `borderRadius: 4`. When checked: `background: #38B2AC`, `borderColor: #38B2AC`, white checkmark icon inside.

**Tier ↔ Level Access sync:**
- Selecting "Foundation" checks levels 1-3, unchecks 4-5
- Selecting "Accelerator" checks levels 1-4, unchecks 5
- Selecting "Catalyst" checks all five
- Manually changing a checkbox does NOT change the tier selection — the user can mix freely

### 6.6 Action Buttons

**Layout:** `display: flex`, `justifyContent: flex-end`, `gap: 12`, `marginTop: 8`

**Cancel button:**
```tsx
<button style={{
  padding: '10px 22px', borderRadius: 24,
  border: '1px solid #E2E8F0', background: '#FFFFFF',
  color: '#4A5568', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
}}>
  Cancel
</button>
```
On click: navigate back to `/admin/organisations`

**Create button:**
```tsx
<button style={{
  padding: '10px 22px', borderRadius: 24,
  border: 'none', background: '#38B2AC', color: '#FFFFFF',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  opacity: isSubmitting ? 0.6 : 1,
}}>
  {isSubmitting ? 'Creating…' : 'Create Organisation'}
</button>
```

### 6.7 Validation

- **Organisation Name:** Required. Min 2 characters. Show error message below field if empty on submit.
- **Tier:** Required. Show error message if none selected on submit.
- **Level Access:** At least one level must be checked. Show error message if all unchecked.
- **Domain:** Optional. If provided, validate it looks like a domain (contains a dot, no spaces). Show error if malformed.
- **Contact Email:** Optional. If provided, validate email format.

**Error message style:** `fontSize: 12`, `color: #E53E3E`, `marginTop: 4`

### 6.8 Submit Behaviour

1. Validate all fields
2. Set `isSubmitting = true`
3. Call `createOrganisation()` from `lib/database.ts`:
   ```typescript
   const { data, error } = await supabase
     .from('organisations')
     .insert({
       name: formData.name.trim(),
       domain: formData.domain.trim() || null,
       tier: formData.tier,
       level_access: JSON.stringify(formData.levelAccess),
       contact_name: formData.contactName.trim() || null,
       contact_email: formData.contactEmail.trim() || null,
       active: true,
     })
     .select()
     .single();
   ```
4. Write audit log entry:
   ```typescript
   await writeAuditLog({
     actorId: user.id,
     action: 'org.create',
     targetType: 'organisation',
     targetId: data.id,
     metadata: { org_name: data.name, tier: data.tier },
   });
   ```
5. Show success toast: "Organisation created"
6. Navigate to `/admin/organisations/:id` (the new org's detail page)

If error: show error toast, set `isSubmitting = false`, do not navigate.

---

## 7. Organisation Detail Page

**File:** `pages/admin/AdminOrgDetail.tsx`
**Route:** `/admin/organisations/:id`

### 7.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Organisations                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Acme Corp                    [Edit] [⋯]   │    │
│  │  accelerator · acme.com · 47 users          │    │
│  │  Created 12 Mar 2026                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [ Overview | Users | Enrollment | Workshops | Prog ]│
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Active tab content                         │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Page container:** `padding: 28px 36px`, `maxWidth: 1200px`

### 7.2 Org Header Card

**Container:** `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 24px`, `marginBottom: 0`

**Layout:** `display: flex`, `justifyContent: space-between`, `alignItems: flex-start`

**Left side:**
- Org name: `fontSize: 22`, `fontWeight: 800`, `color: #1A202C`, `marginBottom: 6`
- Meta row: tier badge (same pill style as list page) + domain text (`fontSize: 13`, `color: #718096`) + user count (`fontSize: 13`, `color: #718096`) — separated by `·` characters
- Created date: `fontSize: 12`, `color: #A0AEC0`, `marginTop: 6`

**Right side — action buttons:**
- **Edit button:** `padding: 8px 16px`, `borderRadius: 24`, `border: 1px solid #E2E8F0`, `background: #FFFFFF`, `color: #4A5568`, `fontSize: 12`, `fontWeight: 600`. Navigates to `/admin/organisations/:id/edit`
- **More menu (⋯):** `width: 32px`, `height: 32px`, `borderRadius: 8`, `border: 1px solid #E2E8F0`, `background: #FFFFFF`. Contains a dropdown with:
  - "Deactivate Organisation" (if currently active) — `color: #E53E3E`
  - "Reactivate Organisation" (if currently inactive) — `color: #48BB78`

**Deactivate/Reactivate flow:**
1. Clicking the menu option shows a confirmation dialog (inline, not a browser alert)
2. Confirm dialog: "Are you sure you want to deactivate Acme Corp? Users will not be able to log in."
3. On confirm: update `organisations.active` to `false`/`true`, write audit log, show toast, refresh page data

**Inactive state:** When the org is inactive, the header card gets a `borderLeft: 4px solid #E53E3E` and a small red "INACTIVE" badge next to the org name.

### 7.3 Tab Bar

Horizontal tab bar immediately below the header card (no gap — the tab bar's top border blends with the header card's bottom).

**Container:** `background: #FFFFFF`, `borderLeft: 1px solid #E2E8F0`, `borderRight: 1px solid #E2E8F0`, `borderBottom: 1px solid #E2E8F0`, `borderRadius: '0 0 12px 12px'`, `padding: 0 24px`, `marginBottom: 24`

**Tabs:**

| Tab | Label | Available in this PRD |
|---|---|---|
| overview | Overview | Yes — real content |
| users | Users | Placeholder |
| enrollment | Enrollment | Placeholder |
| workshops | Workshops | Placeholder |
| programme | Programme | Placeholder |

**Tab item:**
- `padding: 12px 16px`, `fontSize: 13`, `fontWeight: 500`, `color: #718096`, `cursor: pointer`, `borderBottom: 2px solid transparent`
- Active: `color: #1A202C`, `fontWeight: 600`, `borderBottom: 2px solid #38B2AC`
- Hover (inactive): `color: #4A5568`
- Layout: `display: flex`, `gap: 0` (tabs are flush, no gap between them)

**State management:** `const [activeTab, setActiveTab] = useState('overview')` — managed by URL search param `?tab=` so tabs are linkable. Default to `overview` if no param.

### 7.4 Overview Tab Content

The only tab with real content in this PRD. Shows a summary of the organisation and its configuration.

**Layout:** Two-column grid, `gridTemplateColumns: '1fr 1fr'`, `gap: 20`

#### Left Column: Organisation Details

Card: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 20px`

Section label: "ORGANISATION DETAILS" (same label style as create form)

Data rows — each row is a label-value pair:
```tsx
<div style={{
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  padding: '10px 0', borderBottom: '1px solid #F7FAFC',
}}>
  <span style={{ fontSize: 12, fontWeight: 600, color: '#A0AEC0' }}>{label}</span>
  <span style={{ fontSize: 13, color: '#2D3748', textAlign: 'right' }}>{value}</span>
</div>
```

| Label | Value |
|---|---|
| Name | org.name |
| Domain | org.domain or "—" |
| Tier | Tier pill badge |
| Status | Active/Inactive badge |
| Contact | org.contactName + org.contactEmail, or "—" |
| Created | Formatted date |
| Last Updated | Formatted date |

#### Right Column: Level Access

Card: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 20px`

Section label: "LEVEL ACCESS"

Five rows, one per level:
```tsx
<div style={{
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 0', borderBottom: '1px solid #F7FAFC',
}}>
  <div style={{
    width: 20, height: 20, borderRadius: 4,
    background: isEnabled ? '#C6F6D5' : '#FED7D7',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {isEnabled ? <Check size={12} color="#22543D" /> : <X size={12} color="#9B2C2C" />}
  </div>
  <span style={{
    fontSize: 13, color: isEnabled ? '#2D3748' : '#A0AEC0',
    fontWeight: isEnabled ? 500 : 400,
    textDecoration: isEnabled ? 'none' : 'line-through',
  }}>
    Level {n}: {levelName}
  </span>
</div>
```

Below the level list: "Edit level access →" link (`fontSize: 12`, `color: #38B2AC`), navigates to edit page.

#### Below the two columns: Quick Stats (placeholder)

Full-width card: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 20px`, `marginTop: 20`

Section label: "QUICK STATS"

Three stat items in a row (`display: flex`, `gap: 24`):
- Enrolled Users: count from `user_org_memberships`
- Active Cohorts: count from `cohorts` where `active = true`
- Workshop Sessions: count from `workshop_sessions`

Each stat:
```tsx
<div>
  <div style={{ fontSize: 24, fontWeight: 800, color: '#1A202C' }}>{value}</div>
  <div style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
</div>
```

### 7.5 Placeholder Tab Content

For Users, Enrollment, Workshops, and Programme tabs:

```tsx
<div style={{
  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
  padding: '48px 24px', textAlign: 'center',
}}>
  <div style={{
    width: 48, height: 48, borderRadius: '50%',
    background: '#F7FAFC', border: '1px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  }}>
    <Icon size={20} color="#A0AEC0" />
  </div>
  <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3748', marginBottom: 6 }}>
    {tabTitle}
  </div>
  <div style={{ fontSize: 13, color: '#A0AEC0', maxWidth: 400, margin: '0 auto' }}>
    {description}
  </div>
</div>
```

| Tab | Icon | Title | Description |
|---|---|---|---|
| Users | `Users` | "User Management" | "View and manage enrolled users for this organisation. Coming in a future update." |
| Enrollment | `Link` | "Enrollment Channels" | "Create invite links and access codes for enrolling users. Coming in a future update." |
| Workshops | `Calendar` | "Workshop Sessions" | "Create and manage workshop sessions with attendance codes. Coming in a future update." |
| Programme | `Sliders` | "Programme Configuration" | "Configure pacing, branding, and other programme settings. Coming in a future update." |

---

## 8. Edit Organisation Page

**File:** `pages/admin/AdminOrgEdit.tsx`
**Route:** `/admin/organisations/:id/edit`

### 8.1 Structure

Identical form layout to the Create page (§6) but pre-populated with existing org data.

**Differences from Create:**
- Page title: "Edit {orgName}" instead of "New Organisation"
- Back link: "← Back to {orgName}" — navigates to `/admin/organisations/:id`
- Submit button: "Save Changes" instead of "Create Organisation"
- Additional "Danger Zone" section at the bottom (see §8.2)

### 8.2 Danger Zone

A red-bordered card at the bottom of the form:

```tsx
<div style={{
  background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 12,
  padding: 24, marginTop: 20,
}}>
  <div style={{
    fontSize: 11, fontWeight: 700, color: '#E53E3E',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
  }}>
    Danger Zone
  </div>

  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>
        Deactivate this organisation
      </div>
      <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
        Users will not be able to log in. Data will be preserved.
      </div>
    </div>
    <button style={{
      padding: '8px 16px', borderRadius: 24,
      border: '1px solid #FEB2B2', background: '#FFFFFF',
      color: '#E53E3E', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    }}>
      Deactivate
    </button>
  </div>
</div>
```

If the org is already inactive, show "Reactivate this organisation" with a green-themed card instead (`background: #F0FFF4`, `border: 1px solid #9AE6B4`).

### 8.3 Submit Behaviour

1. Validate all fields (same rules as create)
2. Set `isSubmitting = true`
3. Call `updateOrganisation()`:
   ```typescript
   const { error } = await supabase
     .from('organisations')
     .update({
       name: formData.name.trim(),
       domain: formData.domain.trim() || null,
       tier: formData.tier,
       level_access: JSON.stringify(formData.levelAccess),
       contact_name: formData.contactName.trim() || null,
       contact_email: formData.contactEmail.trim() || null,
       updated_at: new Date().toISOString(),
     })
     .eq('id', orgId);
   ```
4. Write audit log: `action: 'org.update'`, metadata includes changed fields
5. Show success toast: "Organisation updated"
6. Navigate back to `/admin/organisations/:id`

---

## 9. Shared Admin Components

### 9.1 AdminCard

A reusable white card container used across all admin pages.

```tsx
interface AdminCardProps {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}

const AdminCard: React.FC<AdminCardProps> = ({ children, padding = '24px', style }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding,
    ...style,
  }}>
    {children}
  </div>
);
```

### 9.2 AdminSectionLabel

The uppercase section label used in cards and forms.

```tsx
const AdminSectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: '#A0AEC0',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
  }}>
    {text}
  </div>
);
```

### 9.3 AdminInput

Standardised text input field with label and optional helper/error text.

```tsx
interface AdminInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  type?: string;
}
```

### 9.4 AdminEmptyState

The centred empty state used in placeholder tabs and empty tables.

```tsx
interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

### 9.5 ConfirmDialog

An inline confirmation dialog for destructive actions (deactivate org, etc.).

```tsx
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Rendering:** An overlay card that appears below the trigger button (not a modal covering the page). White card with `boxShadow: '0 8px 32px rgba(0,0,0,0.12)'`, `borderRadius: 12`, `padding: 20px`, `maxWidth: 360px`.

**Confirm button:**
- Danger: `background: #E53E3E`, `color: #FFFFFF`
- Success: `background: #48BB78`, `color: #FFFFFF`

---

## 10. Data Fetching Patterns

### 10.1 Organisation List

```typescript
// AdminOrgList — fetch on mount
async function fetchOrganisations() {
  const { data, error } = await supabase
    .from('organisations')
    .select(`
      id, name, domain, tier, active, created_at, updated_at,
      user_org_memberships(count)
    `)
    .order('name');

  if (error) { setError(error.message); return; }
  setOrganisations(data.map(org => ({
    ...org,
    userCount: org.user_org_memberships?.[0]?.count ?? 0,
  })));
}
```

### 10.2 Organisation Detail

```typescript
// AdminOrgDetail — fetch on mount using :id param
async function fetchOrganisation(orgId: string) {
  // Org data
  const { data: org, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) { setError('Organisation not found'); return; }

  // Quick stats — parallel fetches
  const [memberships, cohorts, workshops] = await Promise.all([
    supabase.from('user_org_memberships').select('count').eq('org_id', orgId),
    supabase.from('cohorts').select('count').eq('org_id', orgId).eq('active', true),
    supabase.from('workshop_sessions').select('count').eq('org_id', orgId),
  ]);

  setOrg(org);
  setStats({
    userCount: memberships.data?.[0]?.count ?? 0,
    cohortCount: cohorts.data?.[0]?.count ?? 0,
    workshopCount: workshops.data?.[0]?.count ?? 0,
  });
}
```

### 10.3 Create / Update

All writes go through the helper functions in `lib/database.ts` (defined in PRD-10). Every write function:
1. Performs the Supabase operation
2. Writes an audit log entry
3. Returns `{ success: boolean, data?, error? }`

---

## 11. File Structure

### 11.1 New Files

```
pages/admin/
├── AdminDashboard.tsx           # Platform overview with placeholder metrics
├── AdminOrgList.tsx             # Searchable organisation table
├── AdminOrgCreate.tsx           # Create organisation form
├── AdminOrgDetail.tsx           # Org detail with tabbed layout
├── AdminOrgEdit.tsx             # Edit organisation form
└── AdminPlaceholder.tsx         # Generic placeholder for future pages

components/admin/
├── AdminLayout.tsx              # Shell: sidebar + top bar + Outlet
├── AdminSidebar.tsx             # Dark navy sidebar with admin nav
├── AdminTopBar.tsx              # Sticky top bar with breadcrumb
├── AdminAuthGuard.tsx           # Route guard (already scaffolded in PRD-10 — replace placeholder)
├── AdminCard.tsx                # Reusable white card
├── AdminSectionLabel.tsx        # Uppercase section label
├── AdminInput.tsx               # Form input with label/helper/error
├── AdminEmptyState.tsx          # Centred empty state
└── ConfirmDialog.tsx            # Inline confirmation for destructive actions
```

### 11.2 Modified Files

| File | Change |
|---|---|
| `App.tsx` | Replace PRD-10 placeholder admin routes with real page imports and routes |
| `lib/database.ts` | Implement the org CRUD and audit log functions declared in PRD-10 |
| `components/admin/AdminLayout.tsx` | Replace PRD-10 placeholder with real layout using AdminSidebar + AdminTopBar |
| `components/admin/AdminAuthGuard.tsx` | Already functional from PRD-10 — no changes needed |

### 11.3 Files NOT Changed

All learner-facing files are untouched. The marketing site is untouched. No schema changes — all schema work was done in PRD-10.

---

## 12. Edge Cases

### 12.1 Organisation with No Users

The detail page must handle `userCount = 0` gracefully. The Quick Stats section shows "0" with no error. The Users tab placeholder still renders normally.

### 12.2 Very Long Organisation Names

Names over ~40 characters should truncate with ellipsis in the list table but display in full on the detail page. Use `overflow: hidden`, `textOverflow: ellipsis`, `whiteSpace: nowrap` on the table cell, and `wordBreak: 'break-word'` on the detail page heading.

### 12.3 Concurrent Edits

If two admins edit the same org simultaneously, last-write-wins. No optimistic locking in V1. The audit log records both changes with timestamps, so any conflict can be traced.

### 12.4 Deactivated Organisations

Deactivated orgs still appear in the list (with "Inactive" badge) but are not included in dashboard metric calculations (PRD-14). They can be reactivated at any time. Deactivation does NOT delete data — it sets `active = false`.

### 12.5 Navigating to a Non-Existent Org ID

If the `:id` param doesn't match any org, show a full-page error state: "Organisation not found" with a "Back to Organisations" link. Do not crash or show a blank page.

---

## 13. Responsive Behaviour

The admin interface has a minimum supported width of **1024px**. Below that, a horizontal scroll is acceptable — the admin panel is a desktop tool, not a mobile experience.

- Metric cards: below 1100px, switch from 5 columns to a 3+2 wrap
- Org detail two-column grid: below 900px, stack to single column
- Table: horizontal scroll with `overflow-x: auto` on the table container
- Sidebar: always collapsed (60px) on smaller screens, expand on hover

---

## 14. Implementation Checklist

### Admin Shell
- [ ] `AdminLayout.tsx` with `AdminSidebar` + `AdminTopBar` + `<Outlet />`
- [ ] `AdminSidebar` with five nav items, admin badge, user identity, bottom utilities
- [ ] `AdminTopBar` with dynamic breadcrumb and admin user strip
- [ ] `ToastContainer` rendered inside `AdminLayout`
- [ ] `App.tsx` updated with real admin routes

### Organisation List
- [ ] `AdminOrgList.tsx` with searchable, sortable table
- [ ] Fetch organisations with user count on mount
- [ ] Search filters on name (debounced)
- [ ] Tier filter dropdown
- [ ] Column sorting (name, tier, users, status, created)
- [ ] Row click navigates to org detail
- [ ] "New Organisation" button navigates to create page
- [ ] Empty state when no orgs exist

### Create Organisation
- [ ] `AdminOrgCreate.tsx` with two-section form
- [ ] Tier selector as card-style radio group
- [ ] Tier ↔ Level Access auto-sync
- [ ] Form validation (name required, tier required, at least one level)
- [ ] Submit creates org + writes audit log + navigates to detail
- [ ] Cancel navigates back to list

### Organisation Detail
- [ ] `AdminOrgDetail.tsx` with header card + tab bar + tab content
- [ ] Fetch org data + quick stats on mount
- [ ] Overview tab: details card, level access card, quick stats
- [ ] Four placeholder tabs (Users, Enrollment, Workshops, Programme)
- [ ] Tab state synced with `?tab=` URL param
- [ ] Edit button navigates to edit page
- [ ] More menu with deactivate/reactivate option
- [ ] Deactivate uses ConfirmDialog, writes audit log, shows toast
- [ ] Inactive org shows red border and "INACTIVE" badge

### Edit Organisation
- [ ] `AdminOrgEdit.tsx` with same form as create, pre-populated
- [ ] Save writes update + audit log + navigates to detail
- [ ] Danger zone section for deactivate/reactivate

### Shared Components
- [ ] `AdminCard`, `AdminSectionLabel`, `AdminInput`, `AdminEmptyState`, `ConfirmDialog`

### Post-Implementation Verification
- [ ] Learner with `platform_role = 'learner'` cannot access any `/admin/*` route
- [ ] Admin can navigate full lifecycle: list → create → detail → edit → back to list
- [ ] Deactivate/reactivate works and shows correct state throughout
- [ ] Audit log entries are written for create, update, and deactivate actions (verify in Supabase table)
- [ ] Breadcrumbs are correct on every page
- [ ] "Switch to Learner View" link works from admin sidebar
- [ ] Admin sidebar active states highlight correctly for all routes

---

*End of PRD-11*
