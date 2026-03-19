# PRD: My Cohort — Dashboard Redesign

> **Status:** Ready for implementation
> **Author:** Oxygy Design Agent
> **Date:** 2026-03-16
> **Depends on:** Phase 4 (Org Scoping, Cohort, Leaderboard & Streaks)
> **Codebase ref:** `https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site.git`
> **File to replace:** `pages/app/AppCohort.tsx`

---

## 1. Overview

### Purpose

The My Cohort page is the team-facing dashboard within the Oxygy AI Upskilling platform. It gives facilitators and learners a single view of their organisation's upskilling progress — who's active, who's ahead, where the cohort stands collectively, and detailed per-member breakdowns on demand.

### What this redesign changes

The current implementation renders members as a responsive card grid with aggregate stats (Level Distribution, Weekly Activity) pushed below the fold. This redesign replaces that with a **two-panel dashboard layout**:

- **Left panel (~60%):** A sortable, filterable data table showing all members with inline progress bars, rank badges, and clickable rows
- **Right panel (~40%, 340px fixed):** A sticky analytics sidebar with five stacked insight cards — Cohort Snapshot, Engagement Health, Level Distribution (interactive), Weekly Activity, and Top Performers

Clicking any member row opens a **right-edge detail drawer** (420px) showing full profile metadata: score breakdown, phase completion map, recent activity feed, and artefact list.

### What this redesign does NOT change

- The no-org join flow (invite code entry screen) — this remains as-is
- The data layer — no new Supabase tables or functions are required for the core redesign
- The routing — the page stays at `/app/cohort`, lazy-loaded via `React.lazy()` in `App.tsx`
- The `OrgContext` or `ScoredMember` interfaces — the redesign consumes the same data

### New database functions required

Two new functions are needed in `lib/database.ts` for the detail drawer:

1. `getMemberActivityLog(userId: string, limit?: number)` — fetches the most recent N activity log entries for a specific user
2. `getMemberArtefacts(userId: string)` — fetches artefacts for a specific user (non-archived)
3. `getMemberTopicProgress(userId: string)` — fetches all `topic_progress` rows for a specific user (wrapper around existing `getAllTopicProgress`)

These are detailed in §10.

---

## 2. Page Structure

### 2.1 Full Page Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Page Header                                                             │
│  h1: "My Cohort" + subtitle                                             │
├──────────────────────────────────────────────────────────────────────────┤
│  Org Info Bar (full width)                                               │
│  [Org name] [TIER badge]  ·  N members  ·  Avg Level X.X  ·  N active   │
├──────────────────────────────────────────────────────────────────────────┤
│  Filter Bar (full width)                                                 │
│  [All] [L1] [L2] [L3] [L4] [L5]     [Sort: ▾]  [🔍 Search]            │
├────────────────────────────────────────┬─────────────────────────────────┤
│                                        │                                 │
│  Member Table (flex: 1)                │  Analytics Sidebar (340px)      │
│                                        │  position: sticky, top: 20px    │
│  ┌────────────────────────────────┐    │                                 │
│  │ # │ Member │ Lvl │ Score │ ... │    │  ┌─────────────────────────┐    │
│  ├────────────────────────────────┤    │  │  Cohort Snapshot (2×2)  │    │
│  │ 1 │ Joseph │ L1  │  132  │ ... │    │  └─────────────────────────┘    │
│  │ 2 │ Marisha│ L1  │    0  │ ... │    │  ┌─────────────────────────┐    │
│  │ 3 │ Elena  │ L1  │    0  │ ... │    │  │  Engagement Health      │    │
│  │ ...                            │    │  └─────────────────────────┘    │
│  └────────────────────────────────┘    │  ┌─────────────────────────┐    │
│                                        │  │  Level Distribution     │    │
│                                        │  └─────────────────────────┘    │
│                                        │  ┌─────────────────────────┐    │
│                                        │  │  Weekly Activity        │    │
│                                        │  └─────────────────────────┘    │
│                                        │  ┌─────────────────────────┐    │
│                                        │  │  Top Performers         │    │
│                                        │  └─────────────────────────┘    │
│                                        │                                 │
├────────────────────────────────────────┴─────────────────────────────────┤
│                                                                          │
│  Detail Drawer (420px, slides in from right edge when row clicked)       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Container Styling

```
Page wrapper:
  padding: 28px 36px
  minHeight: 100%
  fontFamily: 'DM Sans', sans-serif

Two-panel container:
  display: flex
  gap: 24
  alignItems: flex-start
```

### 2.3 Responsive Breakpoints

| Breakpoint | Behaviour |
|---|---|
| ≥ 1100px | Two-panel layout. Table left, sidebar right (340px fixed). Detail drawer slides in as 420px overlay from right. |
| 768–1099px | Single column. Table full width. Analytics sidebar moves below the table, cards in a 2-column grid. Detail drawer becomes a full-width overlay sliding up from bottom. |
| < 768px | Single column. Table collapses to a compact card list (one per member, stacked). Analytics stack full width. Detail drawer is full-screen overlay. |

---

## 3. Page Header

### 3.1 Title

```jsx
<h1 style={{
  fontSize: 28,
  fontWeight: 800,
  color: '#1A202C',
  margin: '0 0 6px',
  fontFamily: "'DM Sans', sans-serif",
  letterSpacing: '-0.4px',
}}>
  My Cohort
</h1>
```

### 3.2 Subtitle

```jsx
<p style={{
  fontSize: 14,
  color: '#718096',
  margin: '0 0 20px',
  fontFamily: "'DM Sans', sans-serif",
}}>
  Your team's AI upskilling progress at a glance
</p>
```

No changes from the current implementation — these match the established app page title pattern.

---

## 4. Org Info Bar

A compact single-row card showing organisation identity and headline stats. Unchanged from the current implementation except for tighter vertical spacing.

### Container

```
background: #FFFFFF
border: 1px solid #E2E8F0
borderRadius: 14
padding: 16px 24px
marginBottom: 18
```

### Content

- **Org name:** `fontSize: 18`, `fontWeight: 700`, `color: #1A202C`
- **Tier badge:** pill, `background: #E6FFFA`, `color: #38B2AC`, `fontSize: 11`, `fontWeight: 700`, `padding: 2px 10px`, `borderRadius: 20`, `textTransform: uppercase`
- **Inline stats:** `{N} members · Avg Level {X.X} · {N} active this week` — `fontSize: 13`, `color: #718096`

### Layout

Single row: `display: flex`, `alignItems: center`, `gap: 10`, `marginBottom: 8` for the name + badge row. Stats text directly below.

---

## 5. Filter Bar

Sits between the Org Info Bar and the two-panel layout. Retains the existing level filter pills and search input, with one addition: a **Sort dropdown**.

### 5.1 Level Filter Pills

Unchanged from current implementation. Array of `[null, 1, 2, 3, 4, 5]` mapped to pill buttons.

```
Active pill:
  background: #1A202C
  color: #FFFFFF
  border: none

Inactive pill:
  background: #F7FAFC
  color: #4A5568
  border: 1px solid #E2E8F0

All pills:
  borderRadius: 20
  padding: 5px 14px
  fontSize: 12
  fontWeight: 600
  cursor: pointer
  fontFamily: 'DM Sans', sans-serif
  transition: all 150ms ease
```

### 5.2 Sort Dropdown (NEW)

Positioned to the left of the search input, right-aligned in the filter bar.

**Trigger button:**

```
background: #F7FAFC
border: 1px solid #E2E8F0
borderRadius: 20
padding: 6px 14px
fontSize: 12
fontWeight: 600
color: #4A5568
cursor: pointer
fontFamily: 'DM Sans', sans-serif
display: inline-flex
alignItems: center
gap: 5
```

Label: `Sort: {activeSortLabel}` + ChevronDown icon (12px, `#A0AEC0`).

**Dropdown menu (on click):**

```
position: absolute
top: calc(100% + 4px)
right: 0
background: #FFFFFF
border: 1px solid #E2E8F0
borderRadius: 12
padding: 6px 0
boxShadow: 0 4px 16px rgba(0,0,0,0.08)
zIndex: 20
minWidth: 170
```

**Sort options:**

| Option | Label | Sort logic |
|---|---|---|
| `score` (default) | Score | `b.score - a.score` |
| `name` | Name A–Z | `a.fullName.localeCompare(b.fullName)` |
| `level` | Level | `b.level - a.level`, then `b.score - a.score` |
| `completion` | Completion % | `b.completionPct - a.completionPct` |
| `streak` | Streak | `b.streakDays - a.streakDays` |
| `active` | Active Days | `b.activeDays30 - a.activeDays30` |

Each option row:

```
padding: 8px 16px
fontSize: 13
fontWeight: 500
color: #2D3748
cursor: pointer
transition: background 100ms ease

Hover: background: #F7FAFC
Active sort: fontWeight: 700, color: #1A202C, with a teal dot (6px circle, #38B2AC) to the left
```

Close the dropdown on selection or outside click.

### 5.3 Search Input

Unchanged from current implementation: `Search` icon positioned absolutely left, text input with pill shape, 160px width.

### 5.4 Filter Bar Layout

```
display: flex
alignItems: center
gap: 8
flexWrap: wrap
marginBottom: 18
```

Level pills on the left. Sort dropdown + search input pushed right with `marginLeft: auto`, wrapped in a `display: flex, gap: 8` container.

---

## 6. Member Table (Left Panel)

### 6.1 Table Container

The table lives inside a white card that occupies the left side of the two-panel layout.

```
flex: 1
minWidth: 0
background: #FFFFFF
border: 1px solid #E2E8F0
borderRadius: 14
overflow: hidden
```

### 6.2 Table Header Row

```
background: #F7FAFC
borderBottom: 1px solid #E2E8F0
padding: 10px 20px
display: grid
gridTemplateColumns: 40px 1fr 56px 60px 110px 56px 68px 68px
alignItems: center
gap: 8
```

Column headers:

```
fontSize: 11
fontWeight: 700
color: #A0AEC0
textTransform: uppercase
letterSpacing: 0.04em
fontFamily: 'DM Sans', sans-serif
userSelect: none
cursor: pointer (for sortable columns)
display: flex
alignItems: center
gap: 3
```

Sortable columns show a chevron icon (10px):
- Inactive: `color: #CBD5E0`
- Active asc: `color: #1A202C`, ChevronUp
- Active desc: `color: #1A202C`, ChevronDown

Clicking a column header sets that column as the active sort. Clicking the same column again toggles direction. Clicking a third time resets to default sort (score desc).

### 6.3 Column Definitions

| Column | Header label | Grid width | Content spec |
|---|---|---|---|
| **Rank** | `#` | 40px | Rank number, derived from position in sorted array. Top 3 get medal badges (see §6.4). Others: `fontSize: 13`, `fontWeight: 600`, `color: #718096`, `textAlign: center`. |
| **Member** | `MEMBER` | `1fr` (min 160px) | Avatar circle (30px) + name + "(You)" tag. See §6.5. |
| **Level** | `LVL` | 56px | Level pill: `fontSize: 10`, `fontWeight: 700`, `padding: 2px 8px`, `borderRadius: 10`, `background: LEVEL_ACCENT_COLORS[level] + '55'`, `color: LEVEL_ACCENT_DARK_COLORS[level]`. Text: `L{level}`. |
| **Score** | `SCORE` | 60px | `fontSize: 14`, `fontWeight: 800`, `color: #1A202C`. Right-aligned. |
| **Progress** | `PROGRESS` | 110px | Inline progress bar (6px height) + percentage label. See §6.6. |
| **Streak** | `STREAK` | 56px | Flame icon (Lucide `Flame`, 12px, `#F6AD55`) + `{N}d`. If 0: `—` in `#CBD5E0`. `fontSize: 12`, `color: #718096`. |
| **Artefacts** | `SAVED` | 68px | FolderOpen icon (Lucide, 12px, `#A0AEC0`) + count. `fontSize: 12`, `color: #718096`. |
| **30d Active** | `ACTIVE` | 68px | Number of active days. Colour-coded: ≥15 → `#38A169`, 5–14 → `#718096`, <5 → `#E53E3E`. `fontSize: 12`, `fontWeight: 600`. |

### 6.4 Rank Badges (Top 3)

When sorted by Score (default), the top 3 rows receive medal badges instead of plain rank numbers.

```
Badge (all three):
  width: 24px
  height: 24px
  borderRadius: 50%
  display: flex
  alignItems: center
  justifyContent: center
  fontSize: 11
  fontWeight: 800
  color: #FFFFFF
  margin: 0 auto

Rank 1 (Gold):
  background: linear-gradient(135deg, #F6E05E, #D69E2E)
  boxShadow: 0 1px 4px rgba(214,158,46,0.3)

Rank 2 (Silver):
  background: linear-gradient(135deg, #CBD5E0, #A0AEC0)
  boxShadow: 0 1px 4px rgba(160,174,192,0.3)

Rank 3 (Bronze):
  background: linear-gradient(135deg, #EDCBAB, #C8875D)
  boxShadow: 0 1px 4px rgba(200,135,93,0.3)
```

Content: the number (`1`, `2`, `3`).

When sorted by any column other than Score, rank badges are hidden — all rows show plain rank numbers based on position in the active sort.

### 6.5 Member Cell

```
display: flex
alignItems: center
gap: 10
minWidth: 0
overflow: hidden

Avatar:
  width: 30px
  height: 30px
  borderRadius: 50%
  background: {m.avatarColor}
  display: flex
  alignItems: center
  justifyContent: center
  fontSize: 11
  fontWeight: 700
  color: #1A202C
  flexShrink: 0

Name:
  fontSize: 13
  fontWeight: 600
  color: #1A202C
  overflow: hidden
  textOverflow: ellipsis
  whiteSpace: nowrap

"(You)" tag (only for current user):
  fontSize: 9
  fontWeight: 600
  color: #38B2AC
  marginLeft: 4
```

### 6.6 Progress Cell

Contains an inline progress bar with a percentage label above it.

```
Container:
  display: flex
  flexDirection: column
  gap: 3
  width: 100%

Label row:
  display: flex
  justifyContent: space-between
  alignItems: center

Percentage:
  fontSize: 11
  fontWeight: 600
  color: #718096

Progress bar track:
  height: 6px
  background: #EDF2F7
  borderRadius: 3
  overflow: hidden
  width: 100%

Progress bar fill:
  height: 100%
  background: LEVEL_ACCENT_COLORS[m.level]
  borderRadius: 3
  transition: width 0.4s ease
  minWidth: m.completionPct > 0 ? 4px : 0
```

### 6.7 Table Row States

```
Default:
  background: #FFFFFF
  borderBottom: 1px solid #F1F5F9
  padding: 12px 20px
  display: grid
  gridTemplateColumns: 40px 1fr 56px 60px 110px 56px 68px 68px
  alignItems: center
  gap: 8
  cursor: pointer
  transition: background 150ms ease

Hover:
  background: #F7FAFC

Current user row:
  borderLeft: 3px solid #38B2AC
  background: rgba(56, 178, 172, 0.04)
  paddingLeft: 17px (compensate for border)

Selected (drawer open for this member):
  background: #EDF2F7
  borderLeft: 3px solid #1A202C
  paddingLeft: 17px

Row entrance animation (on mount):
  animation: cohortRowFadeIn 0.3s ease both
  animationDelay: {index * 40}ms (staggered, max 15 rows animated — rest are instant)
```

### 6.8 Empty State

When no members match the active filter + search query:

```
Container:
  textAlign: center
  padding: 48px 24px

Icon:
  Users (Lucide), 32px, color: #CBD5E0, marginBottom: 12

Primary text:
  fontSize: 15
  fontWeight: 600
  color: #4A5568
  marginBottom: 4
  "No members match your filters"

Secondary text:
  fontSize: 13
  color: #A0AEC0
  "Try adjusting your search or level filter"
```

---

## 7. Analytics Sidebar (Right Panel)

### 7.1 Sidebar Container

```
width: 340px
flexShrink: 0
position: sticky
top: 20px
maxHeight: calc(100vh - 40px)
overflowY: auto
display: flex
flexDirection: column
gap: 16

Scrollbar styling (webkit):
  scrollbar-width: thin
  scrollbar-color: #E2E8F0 transparent
```

### 7.2 Shared Card Style

All five sidebar cards use this base style:

```
background: #FFFFFF
border: 1px solid #E2E8F0
borderRadius: 14
padding: 18px 20px

Card title:
  fontSize: 13
  fontWeight: 700
  color: #1A202C
  marginBottom: 14
  fontFamily: 'DM Sans', sans-serif

Card entrance animation:
  animation: cohortCardFadeIn 0.4s ease both
  animationDelay: {cardIndex * 80}ms
```

### 7.3 Card 1: Cohort Snapshot

A 2×2 grid of mini stat cells providing the headline numbers for the cohort.

**Layout:**

```
display: grid
gridTemplateColumns: 1fr 1fr
gap: 10
```

**Each stat cell:**

```
background: #F7FAFC
borderRadius: 10
padding: 14px 12px
textAlign: center
transition: transform 150ms ease, box-shadow 150ms ease

Hover:
  transform: translateY(-1px)
  boxShadow: 0 2px 8px rgba(0,0,0,0.04)
```

**Value styling:**

```
fontSize: 24
fontWeight: 800
color: #1A202C
lineHeight: 1
marginBottom: 4
```

**Label styling:**

```
fontSize: 10
fontWeight: 700
color: #A0AEC0
textTransform: uppercase
letterSpacing: 0.04em
```

**Stats:**

| Position | Value computation | Label |
|---|---|---|
| Top-left | `members.length` | Members |
| Top-right | `Math.round(memberStats.reduce((a, m) => a + m.completionPct, 0) / memberStats.length)` + `%` suffix | Avg Progress |
| Bottom-left | `memberStats.reduce((a, m) => a + m.artefactCount, 0)` | Artefacts |
| Bottom-right | `Math.round(memberStats.reduce((a, m) => a + m.score, 0) / memberStats.length)` | Avg Score |

**Value animation on mount:** Each number animates from 0 to its target value over 600ms using an ease-out curve. Implement via a `useCountUp(target, duration)` hook that uses `requestAnimationFrame`. Numbers round to integers during animation.

### 7.4 Card 2: Engagement Health

A single-row progress indicator showing what percentage of the cohort was active this week.

**Computation:**

```typescript
const activeThisWeek = weeklyActivity.reduce((a, b) => a + b, 0);
// weeklyActivity counts distinct users per day — but a user active on Mon+Tue counts twice.
// For engagement %, we need distinct users active this week.
// Simplification: use the "active this week" count already computed for the org info bar.
const engagementPct = Math.round((activeThisWeek / members.length) * 100);

// Clamp to 100 since a user can be active multiple days
const clampedPct = Math.min(engagementPct, 100);
```

**Note for developer:** The current `getOrgWeeklyActivity` returns distinct users per day — the sum overstates unique active users if someone is active on multiple days. For the engagement health indicator, compute distinct active users this week server-side or approximate using `max(weeklyActivity)` as a lower bound. For v1, use the sum clamped to 100% with a note that this is sessions, not unique users. A follow-up can add a `getOrgDistinctActiveUsers(orgId, days)` function.

**Threshold colours:**

| Range | Colour | Label |
|---|---|---|
| ≥ 70% | `#48BB78` (green) | Healthy |
| 40–69% | `#ECC94B` (amber) | Moderate |
| < 40% | `#FC8181` (red) | Needs Attention |

**Layout:**

```
Progress bar track:
  height: 8px
  background: #EDF2F7
  borderRadius: 4
  overflow: hidden
  marginBottom: 10

Progress bar fill:
  height: 100%
  borderRadius: 4
  background: {thresholdColor}
  width: {clampedPct}%
  transition: width 0.6s ease

Label row (below bar):
  display: flex
  justifyContent: space-between
  alignItems: center

Left label:
  fontSize: 12
  fontWeight: 700
  color: {thresholdColor}
  "{clampedPct}% active this week"

Right label:
  fontSize: 11
  fontWeight: 600
  color: {thresholdColor}
  padding: 2px 8px
  background: {thresholdColor}15
  borderRadius: 10
  "{thresholdLabel}"
```

**Bar fill animation on mount:** Width animates from 0% to target over 800ms with ease-out, delayed 200ms after card enters viewport.

### 7.5 Card 3: Level Distribution

Interactive horizontal bar chart. Clicking a bar filters the member table to that level.

**Layout:** 5 rows (L1–L5), stacked vertically with `gap: 8`.

**Each row:**

```
display: flex
alignItems: center
gap: 10
cursor: pointer
padding: 4px 6px
borderRadius: 8
transition: background 150ms ease

Hover:
  background: #F7FAFC

Active filter (this level is currently filtered):
  background: #F7FAFC
```

**Level label:**

```
fontSize: 12
fontWeight: 600
color: #4A5568
width: 26px
flexShrink: 0

Active filter state:
  fontWeight: 800
  color: #1A202C
```

**Bar container:**

```
flex: 1
height: 20px
background: #F1F5F9
borderRadius: 5
overflow: hidden
position: relative
```

**Bar fill:**

```
height: 100%
background: LEVEL_ACCENT_COLORS[level]
borderRadius: 5
transition: width 0.5s ease
minWidth: count > 0 ? 8px : 0
```

Width: `(count / maxLevelCount) * 100%`. If `maxLevelCount` is 0, all bars are 0%.

**Count label:**

```
fontSize: 12
fontWeight: 700
color: #1A202C
width: 24px
textAlign: right
flexShrink: 0
```

**Interaction:**

- On click: if `levelFilter !== level`, set `levelFilter = level`. If `levelFilter === level`, set `levelFilter = null` (deselect).
- This syncs with the level filter pills in the filter bar — clicking a distribution bar updates the active pill and vice versa. Both read/write the same `levelFilter` state.
- On hover: bar fill gains a subtle brightness boost (`filter: brightness(1.05)`) and the count label bolds.

**Bar fill animation on mount:** Each bar animates its width from 0% to target over 500ms with ease-out, staggered by 60ms per row.

### 7.6 Card 4: Weekly Activity

Bar chart showing activity per day of the current week. Improved from the current implementation with better proportions and a "today" highlight.

**Layout:**

```
display: flex
alignItems: flex-end
gap: 6
height: 110px
padding: 8px 0
```

**Each day column:**

```
flex: 1
display: flex
flexDirection: column
alignItems: center
gap: 4
```

**Value label (above bar):**

```
fontSize: 10
fontWeight: 700
color: #1A202C
minHeight: 14px
```

**Bar:**

```
width: 100%
borderRadius: 4
transition: height 0.5s ease
background: isToday ? 'linear-gradient(to top, #2C9A94, #38B2AC)' : '#38B2AC'

If isToday:
  boxShadow: 0 0 8px rgba(56, 178, 172, 0.3)
  animation: cohortTodayPulse 2s ease-in-out infinite
```

Height: `Math.max((val / maxActivity) * 80, val > 0 ? 8 : 0)px`. If `maxActivity` is 0, all bars are 0.

**Day label (below bar):**

```
fontSize: 10
fontWeight: isToday ? 700 : 500
color: isToday ? '#1A202C' : '#718096'
```

**"Today" detection:** Compare day index to current day of week (Monday-based). `const today = new Date().getDay(); const todayIdx = today === 0 ? 6 : today - 1;`

**Today pulse animation:**

```css
@keyframes cohortTodayPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(56, 178, 172, 0.2); }
  50% { box-shadow: 0 0 14px rgba(56, 178, 172, 0.4); }
}
```

**Bar animation on mount:** Each bar animates height from 0 to target over 500ms with ease-out, staggered by 50ms per bar.

### 7.7 Card 5: Top Performers

A mini podium showing the top 3 members by score. Creates a visual focal point and motivational element.

**Layout:**

```
display: flex
alignItems: flex-end
justifyContent: center
gap: 12
padding: 12px 0 4px
```

The three positions are displayed in the order: 2nd (left), 1st (centre, tallest), 3rd (right).

**Each performer column:**

```
display: flex
flexDirection: column
alignItems: center
gap: 6
```

**Avatar circle:**

```
Position 1 (centre):
  width: 48px
  height: 48px
  fontSize: 16
  border: 3px solid #D69E2E
  boxShadow: 0 0 0 3px rgba(214, 158, 46, 0.2)

Position 2 (left):
  width: 40px
  height: 40px
  fontSize: 14
  border: 2px solid #A0AEC0

Position 3 (right):
  width: 40px
  height: 40px
  fontSize: 14
  border: 2px solid #C8875D

All avatars:
  borderRadius: 50%
  background: {m.avatarColor}
  display: flex
  alignItems: center
  justifyContent: center
  fontWeight: 700
  color: #1A202C
```

**Rank badge (overlaid on avatar, bottom-right):**

```
position: absolute
bottom: -2px
right: -2px
width: 18px
height: 18px
borderRadius: 50%
background: {medalGradient} (same as §6.4)
display: flex
alignItems: center
justifyContent: center
fontSize: 9
fontWeight: 800
color: #FFFFFF
border: 2px solid #FFFFFF
```

**Name label:**

```
fontSize: 11
fontWeight: 600
color: #1A202C
textAlign: center
maxWidth: 80px
overflow: hidden
textOverflow: ellipsis
whiteSpace: nowrap
```

**Score label:**

```
fontSize: 13
fontWeight: 800
color: #1A202C
```

**Points label:**

```
fontSize: 9
color: #A0AEC0
marginTop: -2px
```

**Podium bar (below score):**

```
width: 100%
borderRadius: 4px 4px 0 0

Position 1: height: 48px, background: linear-gradient(to top, #F6E05E33, #D69E2E22)
Position 2: height: 32px, background: linear-gradient(to top, #CBD5E033, #A0AEC022)
Position 3: height: 24px, background: linear-gradient(to top, #EDCBAB33, #C8875D22)
```

**Edge case:** If fewer than 3 members in the org, show only as many as exist. If 0 or 1 member, hide the Top Performers card entirely.

**Entrance animation:** Podium bars grow from 0 height to target over 500ms with a bounce ease (`cubic-bezier(0.34, 1.56, 0.64, 1)`), staggered: centre first (0ms), left (150ms), right (300ms).

---

## 8. Detail Drawer

### 8.1 Drawer Container

Slides in from the right edge of the viewport when a table row is clicked.

```
position: fixed
top: 0
right: 0
width: 420px
height: 100vh
background: #FFFFFF
borderLeft: 1px solid #E2E8F0
boxShadow: -8px 0 24px rgba(0, 0, 0, 0.06)
zIndex: 40
overflowY: auto
padding: 0
transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1)

Closed: transform: translateX(100%)
Open: transform: translateX(0)
```

**Backdrop (behind drawer):**

```
position: fixed
inset: 0
background: rgba(0, 0, 0, 0.15)
zIndex: 39
opacity: 0 → 1 over 200ms
cursor: pointer (click to close)
```

### 8.2 Drawer Header

```
padding: 24px 24px 0
position: sticky
top: 0
background: #FFFFFF
zIndex: 1
borderBottom: 1px solid #E2E8F0
paddingBottom: 20px
```

**Close button (top-right):**

```
position: absolute
top: 16px
right: 16px
width: 32px
height: 32px
borderRadius: 8px
background: #F7FAFC
border: 1px solid #E2E8F0
display: flex
alignItems: center
justifyContent: center
cursor: pointer
transition: background 150ms ease

Hover: background: #EDF2F7

Icon: X (Lucide), 16px, color: #718096
```

**Member identity row:**

```
display: flex
alignItems: center
gap: 14
marginBottom: 16
```

Avatar circle (48px, same style as table but larger). Name + level badge + role label stacked vertically.

```
Name: fontSize: 18, fontWeight: 700, color: #1A202C
Level pill: same style as table
Role label: fontSize: 11, fontWeight: 600, color: #A0AEC0, textTransform: uppercase, letterSpacing: 0.04em
```

**Score highlight card:**

```
background: #F7FAFC
borderRadius: 12
padding: 16px
display: flex
alignItems: center
justifyContent: space-between

Left:
  "Total Score" label: fontSize: 11, fontWeight: 700, color: #A0AEC0, textTransform: uppercase
  Score value: fontSize: 32, fontWeight: 800, color: #1A202C

Right:
  Rank badge (same medal style if top 3, else plain #N in a grey circle)
  "Rank #{N}" label: fontSize: 11, color: #A0AEC0
```

### 8.3 Score Breakdown Section

Shows how the member's total score is composed. Placed directly below the header inside the scrollable drawer body.

**Section label:**

```
fontSize: 12
fontWeight: 700
color: #A0AEC0
textTransform: uppercase
letterSpacing: 0.04em
padding: 20px 24px 8px
```

Text: "SCORE BREAKDOWN"

**Breakdown rows:** Each scoring component displayed as a horizontal bar showing its contribution.

```
Container: padding: 0 24px 20px, display: flex, flexDirection: column, gap: 8
```

**Components:**

| Component | Formula | Label | Colour |
|---|---|---|---|
| Phase completions | `phasesCompleted × 4` | Phases completed | `#38B2AC` |
| Artefacts | `artefactCount × 25` (capped at 20) | Artefacts saved | `#667EEA` |
| Insights | `insightCount × 30` (capped at 10) | Insights logged | `#ED8936` |
| Streak | `streakDays × 5` (capped at 14) | Day streak | `#F6AD55` |
| Active days | `activeDays30 × 2` (capped at 30) | Active days (30d) | `#48BB78` |

**Each row:**

```
display: flex
alignItems: center
gap: 10

Colour dot: width: 8px, height: 8px, borderRadius: 50%, background: {componentColor}, flexShrink: 0

Label: fontSize: 12, fontWeight: 500, color: #4A5568, flex: 1

Bar container:
  width: 80px
  height: 6px
  background: #EDF2F7
  borderRadius: 3
  overflow: hidden
  flexShrink: 0

Bar fill:
  height: 100%
  background: {componentColor}
  borderRadius: 3
  width: {(componentScore / totalScore) * 100}%
  transition: width 0.4s ease

Score value: fontSize: 12, fontWeight: 700, color: #1A202C, width: 36px, textAlign: right
```

### 8.4 Phase Completion Map Section

A visual grid showing which phases across which levels/topics the member has completed.

**Section label:** "COMPLETION MAP" — same style as §8.3.

**Layout:** One row per level that has at least one topic. Within each level row, show topics. Within each topic, show 4 phase dots (E-Learn, Read, Watch, Practice).

```
Container: padding: 0 24px 20px
```

**Level group:**

```
marginBottom: 14

Level label:
  fontSize: 11
  fontWeight: 700
  color: LEVEL_ACCENT_DARK_COLORS[level]
  background: LEVEL_ACCENT_COLORS[level] + '33'
  padding: 2px 10px
  borderRadius: 8
  display: inline-block
  marginBottom: 8
  "Level {N}"
```

**Topic row:**

```
display: flex
alignItems: center
gap: 8
marginBottom: 6
padding: 6px 10px
background: #F7FAFC
borderRadius: 8
```

**Topic name:** `fontSize: 12`, `fontWeight: 500`, `color: #4A5568`, `flex: 1`, truncated with ellipsis.

**Phase dots (4 per topic):**

```
display: flex
gap: 4

Each dot:
  width: 16px
  height: 16px
  borderRadius: 4px
  display: flex
  alignItems: center
  justifyContent: center

Completed:
  background: LEVEL_ACCENT_COLORS[level]
  Small check icon (8px) in LEVEL_ACCENT_DARK_COLORS[level]

Not completed:
  background: #EDF2F7
  border: 1px solid #E2E8F0
```

**Phase dot tooltip (on hover):** Shows `{phaseName}: {completed ? 'Completed' : 'Not started'}`. Use `title` attribute for simplicity.

**Data source:** Requires `getMemberTopicProgress(userId)` — fetches all `topic_progress` rows for this user. Cross-reference with `LEVEL_TOPICS` from `data/levelTopics.ts` to get topic names. Map `elearn_completed_at`, `read_completed_at`, `watch_completed_at`, `practise_completed_at` to the 4 phase dots.

### 8.5 Recent Activity Section

A feed of the member's recent activity log entries.

**Section label:** "RECENT ACTIVITY" — same style as §8.3.

**Layout:**

```
Container: padding: 0 24px 20px
```

**Each activity item:**

```
display: flex
gap: 10
padding: 10px 0
borderBottom: 1px solid #F1F5F9 (except last item)
```

**Timeline dot:**

```
width: 8px
height: 8px
borderRadius: 50%
background: #38B2AC
marginTop: 5px
flexShrink: 0
```

**Content:**

```
Action text:
  fontSize: 13
  fontWeight: 500
  color: #2D3748
  lineHeight: 1.5

Timestamp:
  fontSize: 11
  color: #A0AEC0
  marginTop: 2
  Format: relative time ("2h ago", "Yesterday", "3 days ago")
```

**Action text formatting:** The raw `action` field from `activity_log` is a string like `"completed_phase"`, `"saved_artefact"`, `"opened_tool"`. Map these to human-readable labels:

| Action | Display text |
|---|---|
| `completed_phase` | "Completed {phaseName} in {topicName}" |
| `saved_artefact` | "Saved an artefact" |
| `opened_tool` | "Used {toolName}" |
| `started_level` | "Started Level {N}" |
| `login` | "Logged in" |
| (default) | Capitalise and space the action string |

The `metadata` JSON field on the activity log row may contain additional context (e.g., `{ tool: "prompt-playground", level: 1 }`) — use this to enrich the display text.

**Limit:** Show the 8 most recent entries. If fewer than 8 exist, show all. If 0 exist, show an empty state: "No activity recorded yet" in `fontSize: 13, color: #A0AEC0, textAlign: center, padding: 24px 0`.

**Data source:** `getMemberActivityLog(userId, 8)` — new function (see §10).

### 8.6 Artefact List Section

A compact list of the member's saved artefacts.

**Section label:** "SAVED ARTEFACTS ({count})" — same style as §8.3.

**Layout:**

```
Container: padding: 0 24px 24px
```

**Each artefact row:**

```
display: flex
alignItems: center
gap: 10
padding: 8px 12px
background: #F7FAFC
borderRadius: 8
marginBottom: 6
border: 1px solid #F1F5F9
```

**Artefact icon:**

```
width: 28px
height: 28px
borderRadius: 6px
background: LEVEL_ACCENT_COLORS[artefact.level] + '33'
display: flex
alignItems: center
justifyContent: center
flexShrink: 0

Icon: FileText (Lucide), 14px, color: LEVEL_ACCENT_DARK_COLORS[artefact.level]
```

**Artefact details:**

```
Name:
  fontSize: 13
  fontWeight: 600
  color: #1A202C
  overflow: hidden
  textOverflow: ellipsis
  whiteSpace: nowrap

Source tool + date:
  fontSize: 11
  color: #A0AEC0
  "{sourceTool} · {formattedDate}"
```

**Level pill (right-aligned):**

Same level pill style as the table (§6.3 Level column), but at 9px fontSize.

**Empty state:** "No artefacts saved yet" — `fontSize: 13, color: #A0AEC0, textAlign: center, padding: 24px 0`.

**Data source:** `getMemberArtefacts(userId)` — new function (see §10).

### 8.7 Drawer Behaviour

- **Opening:** Clicking any table row opens the drawer for that member. If the drawer is already open for a different member, swap content with a brief fade (opacity 0 → 1, 150ms).
- **Closing:** Click the × button, click the backdrop, or press `Escape`.
- **Keyboard navigation:** `Escape` closes the drawer. Arrow Up/Down (when drawer is open) navigates to previous/next member in the current filtered + sorted list and swaps drawer content.
- **Loading state:** While `getMemberActivityLog` and `getMemberArtefacts` load, show shimmer placeholder blocks (3 rows, `height: 14px`, `background: #EDF2F7`, pulsing opacity 0.4 → 0.7 → 0.4).
- **State:** `selectedMemberId: string | null`. When non-null, drawer is open. Drawer content is derived from `memberStats.find(m => m.userId === selectedMemberId)` plus the async-loaded activity and artefact data.

---

## 9. CSS Animations

All animations are defined in a `<style>` tag at the top of the component, namespaced with `cohort-` to avoid collisions.

```css
@keyframes cohort-spin {
  to { transform: rotate(360deg); }
}

@keyframes cohortRowFadeIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes cohortCardFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cohortBarGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes cohortTodayPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(56, 178, 172, 0.2); }
  50% { box-shadow: 0 0 14px rgba(56, 178, 172, 0.4); }
}

@keyframes cohortPodiumGrow {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}

@keyframes cohortCountUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cohortShimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

@keyframes cohortDrawerSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

| Animation | Used by | Duration | Easing |
|---|---|---|---|
| `cohort-spin` | Loading spinner | 0.7s | linear, infinite |
| `cohortRowFadeIn` | Table row entrance | 0.3s | ease, staggered 40ms | 
| `cohortCardFadeIn` | Sidebar card entrance | 0.4s | ease, staggered 80ms |
| `cohortBarGrow` | Level distribution bar fills | 0.5s | ease-out, staggered 60ms |
| `cohortTodayPulse` | Today's activity bar | 2s | ease-in-out, infinite |
| `cohortPodiumGrow` | Top performers podium bars | 0.5s | cubic-bezier(0.34, 1.56, 0.64, 1), staggered |
| `cohortCountUp` | Snapshot stat values | 0.6s | ease-out |
| `cohortShimmer` | Drawer loading placeholders | 1.2s | ease-in-out, infinite |
| `cohortDrawerSlideIn` | Detail drawer entrance | 0.3s | cubic-bezier(0.16, 1, 0.3, 1) |

---

## 10. Data Layer — New Database Functions

These functions are added to `lib/database.ts`. They use the same Supabase client and follow the existing code conventions in the file.

### 10.1 getMemberActivityLog

```typescript
export async function getMemberActivityLog(
  userId: string,
  limit: number = 8,
): Promise<Array<{
  action: string;
  level: number | null;
  topicId: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}>> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('action, level, topic_id, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getMemberActivityLog error:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    action: row.action as string,
    level: row.level as number | null,
    topicId: row.topic_id as number | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  }));
}
```

### 10.2 getMemberArtefacts

```typescript
export async function getMemberArtefacts(
  userId: string,
): Promise<Array<{
  id: string;
  name: string;
  type: string;
  level: number;
  sourceTool: string | null;
  createdAt: string;
}>> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('id, name, type, level, source_tool, created_at')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('getMemberArtefacts error:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    level: row.level as number,
    sourceTool: row.source_tool as string | null,
    createdAt: row.created_at as string,
  }));
}
```

### 10.3 getMemberTopicProgress

Thin wrapper around the existing `getAllTopicProgress`:

```typescript
// Already exists — just call getAllTopicProgress(userId)
// No new function needed; import directly in AppCohort.tsx
```

### 10.4 RLS Considerations

Both `activity_log` and `artefacts` tables already have RLS policies. For the cohort detail drawer, the querying user must be in the same organisation as the target member. The existing `getOrgLeaderboard` already verifies org membership. The drawer should only be accessible for members returned by `getOrgLeaderboard` — enforce this in the frontend by checking `memberStats.find(m => m.userId === targetId)` before making the detail queries.

**If RLS blocks cross-user reads:** The developer may need to add RLS policies allowing `SELECT` on `activity_log` and `artefacts` for users who share an `org_id` via `user_org_memberships`. Check and add if not present:

```sql
-- Allow org members to read each other's activity
CREATE POLICY "Org members can read peer activity" ON activity_log
  FOR SELECT USING (
    user_id IN (
      SELECT uom2.user_id FROM user_org_memberships uom1
      JOIN user_org_memberships uom2 ON uom1.org_id = uom2.org_id
      WHERE uom1.user_id = auth.uid() AND uom1.active = true AND uom2.active = true
    )
  );

-- Allow org members to read each other's artefacts
CREATE POLICY "Org members can read peer artefacts" ON artefacts
  FOR SELECT USING (
    user_id IN (
      SELECT uom2.user_id FROM user_org_memberships uom1
      JOIN user_org_memberships uom2 ON uom1.org_id = uom2.org_id
      WHERE uom1.user_id = auth.uid() AND uom1.active = true AND uom2.active = true
    )
  );
```

---

## 11. State Architecture

```typescript
// Page-level state
const [memberStats, setMemberStats] = useState<ScoredMember[]>([]);
const [weeklyActivity, setWeeklyActivity] = useState<number[]>(Array(7).fill(0));
const [levelFilter, setLevelFilter] = useState<number | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'score' | 'name' | 'level' | 'completion' | 'streak' | 'active'>('score');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
const [statsLoading, setStatsLoading] = useState(true);

// Detail drawer state
const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
const [drawerData, setDrawerData] = useState<{
  activity: Awaited<ReturnType<typeof getMemberActivityLog>>;
  artefacts: Awaited<ReturnType<typeof getMemberArtefacts>>;
  topicProgress: TopicProgressRow[];
} | null>(null);
const [drawerLoading, setDrawerLoading] = useState(false);

// Derived values (not state — computed on render)
const filteredMembers = useMemo(() => {
  let list = [...memberStats];

  // Level filter
  if (levelFilter !== null) {
    list = list.filter(m => m.level === levelFilter);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(m => m.fullName.toLowerCase().includes(q));
  }

  // Sort
  list.sort((a, b) => {
    const dir = sortDirection === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'score': return (a.score - b.score) * dir;
      case 'name': return a.fullName.localeCompare(b.fullName) * dir;
      case 'level': return (a.level - b.level) * dir || (b.score - a.score);
      case 'completion': return (a.completionPct - b.completionPct) * dir;
      case 'streak': return (a.streakDays - b.streakDays) * dir;
      case 'active': return (a.activeDays30 - b.activeDays30) * dir;
      default: return b.score - a.score;
    }
  });

  return list;
}, [memberStats, levelFilter, searchQuery, sortBy, sortDirection]);

const selectedMember = selectedMemberId
  ? memberStats.find(m => m.userId === selectedMemberId) ?? null
  : null;

const levelDist: Record<number, number> = {};
memberStats.forEach(m => { levelDist[m.level] = (levelDist[m.level] || 0) + 1; });
const maxLevelCount = Math.max(...Object.values(levelDist), 1);

const avgCompletion = memberStats.length > 0
  ? Math.round(memberStats.reduce((a, m) => a + m.completionPct, 0) / memberStats.length)
  : 0;

const avgScore = memberStats.length > 0
  ? Math.round(memberStats.reduce((a, m) => a + m.score, 0) / memberStats.length)
  : 0;

const totalArtefacts = memberStats.reduce((a, m) => a + m.artefactCount, 0);

const activeThisWeek = weeklyActivity.reduce((a, b) => a + b, 0);
const engagementPct = Math.min(
  Math.round((activeThisWeek / Math.max(memberStats.length, 1)) * 100),
  100
);

const maxActivity = Math.max(...weeklyActivity, 1);

// Invite code state (no-org flow — unchanged)
const [inviteCode, setInviteCode] = useState('');
const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const [joinError, setJoinError] = useState('');
```

### Drawer data loading

```typescript
useEffect(() => {
  if (!selectedMemberId) {
    setDrawerData(null);
    return;
  }
  setDrawerLoading(true);
  Promise.all([
    getMemberActivityLog(selectedMemberId, 8),
    getMemberArtefacts(selectedMemberId),
    getAllTopicProgress(selectedMemberId),
  ]).then(([activity, artefacts, topicProgress]) => {
    setDrawerData({ activity, artefacts, topicProgress });
    setDrawerLoading(false);
  });
}, [selectedMemberId]);
```

### Keyboard handler

```typescript
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && selectedMemberId) {
      setSelectedMemberId(null);
    }
    if (selectedMemberId && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const idx = filteredMembers.findIndex(m => m.userId === selectedMemberId);
      if (idx === -1) return;
      const nextIdx = e.key === 'ArrowDown'
        ? Math.min(idx + 1, filteredMembers.length - 1)
        : Math.max(idx - 1, 0);
      setSelectedMemberId(filteredMembers[nextIdx].userId);
    }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [selectedMemberId, filteredMembers]);
```

---

## 12. Imports

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Flame, FolderOpen, Mail, KeyRound,
  ChevronDown, ChevronUp, X, FileText, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  getOrgLeaderboard,
  getOrgWeeklyActivity,
  getMemberActivityLog,    // NEW
  getMemberArtefacts,       // NEW
  getAllTopicProgress,
  validateAndAcceptInvite,
  ScoredMember,
  TopicProgressRow,
} from '../../lib/database';
import {
  LEVEL_ACCENT_COLORS,
  LEVEL_ACCENT_DARK_COLORS,
  LEVEL_TOPICS,
} from '../../data/levelTopics';
```

---

## 13. Utility Functions

### 13.1 Relative Time Formatter

```typescript
function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
```

### 13.2 Activity Label Formatter

```typescript
function formatActivity(
  action: string,
  level: number | null,
  topicId: number | null,
  metadata: Record<string, unknown>,
): string {
  const topicName = level && topicId
    ? LEVEL_TOPICS[level]?.find(t => t.id === topicId)?.title ?? `Topic ${topicId}`
    : null;

  switch (action) {
    case 'completed_phase': {
      const phase = (metadata.phase as string) || 'a phase';
      return topicName ? `Completed ${phase} in ${topicName}` : `Completed ${phase}`;
    }
    case 'saved_artefact':
      return 'Saved an artefact';
    case 'opened_tool': {
      const tool = (metadata.tool as string) || 'a tool';
      return `Used ${tool.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    }
    case 'started_level':
      return level ? `Started Level ${level}` : 'Started a new level';
    case 'login':
      return 'Logged in';
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
```

### 13.3 useCountUp Hook

Drives the animated number count-up in the Cohort Snapshot card.

```typescript
function useCountUp(target: number, duration: number = 600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
```

---

## 14. No-Org State

The invite code entry screen shown when `!orgId` is **unchanged** from the current implementation (lines 68–213 of the existing `AppCohort.tsx`). Carry it over as-is. No visual changes needed — it's a self-contained flow that only shows when the user hasn't joined an org.

---

## 15. Loading State

When `orgLoading || statsLoading` is true, show a centred spinner:

```
Container: padding: 28px 36px, fontFamily: 'DM Sans', sans-serif
Spinner: 24px × 24px circle, border: 3px solid #E2E8F0, borderTopColor: #38B2AC, animation: cohort-spin 0.7s linear infinite
```

Unchanged from the current implementation.

---

## 16. Quality Checklist

### Layout & Structure
- [ ] Page padding matches app shell standard: `28px 36px`
- [ ] Two-panel layout: table left (flex: 1), sidebar right (340px fixed)
- [ ] Sidebar is `position: sticky, top: 20px` so it stays visible during table scroll
- [ ] Table container has `borderRadius: 14` and `overflow: hidden`
- [ ] All cards use `border: 1px solid #E2E8F0`, `borderRadius: 14`, no box-shadow
- [ ] Filter bar syncs level filter between pills and distribution chart clicks

### Typography
- [ ] `fontFamily: 'DM Sans', sans-serif` on page wrapper — no fallback to Inter/Roboto/Arial
- [ ] Page title: `28px`, weight `800`, colour `#1A202C`
- [ ] Table headers: `11px`, weight `700`, colour `#A0AEC0`, uppercase
- [ ] Body text: `12–13px`, weight `400–600`, colour `#4A5568` or `#718096`
- [ ] No coloured heading text — navy only, accent via underline if needed

### Colours
- [ ] Level accent colours sourced from `LEVEL_ACCENT_COLORS` and `LEVEL_ACCENT_DARK_COLORS` (imported from `data/levelTopics.ts`) — no hardcoded hex for level-specific elements
- [ ] Top 3 medal colours: gold `#D69E2E`, silver `#A0AEC0`, bronze `#C8875D`
- [ ] Engagement health thresholds: green `#48BB78`, amber `#ECC94B`, red `#FC8181`
- [ ] Teal `#38B2AC` used only for: current user row border, primary CTA, weekly activity bars, tier badge accent
- [ ] All borders `#E2E8F0`, all backgrounds white `#FFFFFF` or `#F7FAFC`

### Animations
- [ ] Table rows: staggered `cohortRowFadeIn` (40ms per row, max 15 animated)
- [ ] Sidebar cards: staggered `cohortCardFadeIn` (80ms per card)
- [ ] Snapshot numbers: `useCountUp` hook animates from 0 to target over 600ms
- [ ] Engagement bar: width animates from 0% over 800ms, delayed 200ms
- [ ] Level distribution bars: staggered width animation (60ms per row)
- [ ] Weekly activity bars: staggered height animation (50ms per bar)
- [ ] Today's bar: infinite `cohortTodayPulse` glow
- [ ] Podium bars: staggered bounce animation (centre first)
- [ ] Drawer: `translateX(100%) → translateX(0)` over 300ms with spring easing
- [ ] Drawer content swap: 150ms opacity fade when switching between members

### Interactions
- [ ] Table rows: hover `#F7FAFC`, click opens detail drawer
- [ ] Current user row: teal left border, subtle teal tint background
- [ ] Selected row (drawer open): `#EDF2F7` background, navy left border
- [ ] Sort dropdown: opens on click, closes on selection or outside click
- [ ] Level distribution bars: click filters table (syncs with filter pills)
- [ ] Keyboard: `Escape` closes drawer, `ArrowUp/Down` navigates members in drawer
- [ ] Drawer backdrop: click to close
- [ ] Snapshot stat cells: `translateY(-1px)` on hover

### Detail Drawer
- [ ] Fixed right, 420px wide, `zIndex: 40`, full viewport height
- [ ] Backdrop: `rgba(0,0,0,0.15)`, `zIndex: 39`
- [ ] Sections: Score Breakdown → Completion Map → Recent Activity → Saved Artefacts
- [ ] Loading state: shimmer placeholders in activity + artefacts sections
- [ ] Empty states for 0 activity and 0 artefacts
- [ ] Close button: top-right, `32px × 32px`, X icon

### Data Layer
- [ ] `getMemberActivityLog` and `getMemberArtefacts` added to `lib/database.ts`
- [ ] RLS policies allow org members to read peer activity and artefacts
- [ ] Detail drawer queries only fire for members returned by `getOrgLeaderboard` (same-org check)
- [ ] No new Supabase tables required

### Responsive
- [ ] ≥ 1100px: two-panel layout
- [ ] 768–1099px: single column, sidebar below table as 2-col grid, drawer as overlay
- [ ] < 768px: compact card list, sidebar stacked, drawer full-screen

---

## 17. Developer Notes

### 17.1 File Structure

This is a single-file component: `pages/app/AppCohort.tsx`. All sub-components (MemberTable, AnalyticsSidebar, DetailDrawer, SnapshotCard, etc.) are defined locally within the file. No separate CSS files — all styles are inline, following the established pattern in `AppPromptPlayground.tsx` and other toolkit pages.

### 17.2 Performance Considerations

- **Table virtualisation:** Not needed for cohorts under ~50 members. If org sizes grow beyond 50, consider `react-window` for the table body.
- **Drawer data caching:** Cache `drawerData` by userId in a `useRef<Map>` so reopening a recently viewed member doesn't re-fetch. Invalidate the cache when the page-level `memberStats` refreshes.
- **Animation guards:** Only animate rows/cards on initial mount or when filter changes — not on every re-render. Use a `hasAnimated` ref.

### 17.3 Sort + Filter Interaction

- When the user clicks a level distribution bar, it sets `levelFilter` to that level. This filters the table AND updates the active filter pill. Clicking the same bar again deselects (sets `levelFilter = null`).
- When a level filter is active, the table rank numbers reflect position within the filtered set (not the global leaderboard).
- Medal badges for top 3 only appear when sorted by Score (default sort). For any other sort, all rows show plain rank numbers.
- Sorting and filtering are independent — a user can filter to L2 members and sort by streak.

### 17.4 Edge Cases

- **Single member org:** Table shows one row. Top Performers card shows just that member (no podium layout — single centred avatar). Engagement health is either 0% or 100%.
- **All members at 0 score:** All rows show rank `#1` (tied). No medal badges. Snapshot avg score shows `0`.
- **Drawer for current user:** Works identically to any other member. The "(You)" tag appears in the drawer header name.
- **Long org names:** Truncate with ellipsis at 300px in the org info bar.
- **Long member names:** Truncate with ellipsis in both the table (flex: 1 column handles this) and the drawer (maxWidth on name).
- **No weekly activity data:** All activity bars at 0 height, no "today" pulse. Engagement health shows 0%.

### 17.5 Dependencies

No new npm packages required. All Lucide icons used are already imported in the current implementation. The `LEVEL_TOPICS`, `LEVEL_ACCENT_COLORS`, and `LEVEL_ACCENT_DARK_COLORS` imports are already used elsewhere in the codebase.

---

*End of PRD.*
