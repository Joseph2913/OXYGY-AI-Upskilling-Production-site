# PRD 03 — My Journey Page
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing), PRD 02 (Dashboard — specifically `src/data/levelTopics.ts` and `src/data/toolkitData.ts`)  
**Followed by:** PRD 04 — Current Level Page

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRD 01 and PRD 02 are complete and passing all acceptance criteria
2. Read `src/data/levelTopics.ts` — this file already exists from PRD 02 and is the source of truth for all topic content on this page. Do not redefine or duplicate it.
3. Read `src/data/toolkitData.ts` — same. The tools unlocked at each level come from this file.
4. Read `src/context/AppContext.tsx` to confirm what user data is already available
5. Read the existing `src/pages/app/AppJourney.tsx` placeholder — you are replacing its contents, not creating a new file
6. Read `src/hooks/useDashboardData.ts` from PRD 02 — you may be able to reuse parts of its Supabase queries rather than duplicating them

---

## 1. Overview

### Purpose
My Journey is the macro view — the full mountain. Where the Dashboard answers "what do I do today?", My Journey answers "where am I in the overall programme, and what lies ahead?" It is a motivational and orientating page, not a working page. Users visit it when they want to see the full picture, celebrate progress, and feel the pull of what's coming.

### Where it sits
Route: `/app/journey`  
Rendered inside: `AppLayout` (sidebar + top bar from PRD 01)  
"My Journey" nav item in the sidebar is active on this route.

### Design philosophy
The five levels are presented as a **vertical journey** — a trail map, read top to bottom, past at the top and future at the bottom. Each level is a distinct card. The visual weight, colour, and interactivity of each card communicates its state immediately: completed levels feel settled and accomplished; the active level is alive and prominent; locked levels are visible but muted, with enough detail to create aspiration.

This page must feel like **progress made visible**. A user who has completed Level 1 and is halfway through Level 2 should feel genuinely proud when they open this page — not just see a checklist.

---

## 2. Page Layout

### Outer wrapper
```
background: #F7FAFC
padding: 28px 36px
max-width: 900px   ← narrower than dashboard; this is a single-column journey
```

Note: 900px max-width (not 1060px like the dashboard). The journey is a focused, vertical reading experience — not a dashboard grid. Centering within the content area is correct.

### Structure (top to bottom)

```
<PageHeader />              ← Title + subtitle + overall progress summary
<LevelConnector />          ← Thin vertical line connecting level cards (decorative)
<LevelCard level={1} />     ← Completed
<LevelCard level={2} />     ← Active
<LevelCard level={3} />     ← Locked
<LevelCard level={4} />     ← Locked
<LevelCard level={5} />     ← Locked
<CompletionBanner />        ← Only shown when all levels complete
```

Level cards are stacked vertically, gap: 12px. The vertical connector line sits behind the cards and is purely decorative (see Section 4).

---

## 3. Page Header

**Container:**
```
margin-bottom: 32px
```

**Title:**
- Text: "My Journey"
- Font-size: 28px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.4px
- Margin-bottom: 6px

**Subtitle:**
- Text: "Your path through the five levels of AI capability."
- Font-size: 14px, color: `#718096`, line-height: 1.6
- Margin-bottom: 20px

**Overall progress bar block:**

```
background: #FFFFFF
border-radius: 12px
border: 1px solid #E2E8F0
padding: 16px 20px
display: flex
align-items: center
gap: 20px
```

Contents (left to right):

1. **Label column:**
   - Line 1: "Overall Progress" — font-size: 12px, font-weight: 600, color: `#718096`, text-transform: uppercase, letter-spacing: 0.07em
   - Line 2: `"{completedLevels} of 5 levels complete"` — font-size: 14px, font-weight: 700, color: `#1A202C`, margin-top: 3px

2. **Progress bar (flex: 1):**
   - Height: 6px, background: `#E2E8F0`, border-radius: 6px, overflow: hidden
   - Inner fill: width = `{completedLevels / 5 * 100}%`, background: `#38B2AC` (teal), border-radius: 6px
   - Transition: width 0.6s ease

3. **Percentage label:**
   - Text: `"{Math.round(completedLevels / 5 * 100)}%"` 
   - Font-size: 14px, font-weight: 700, color: `#1A202C`
   - Min-width: 36px, text-align: right

**`completedLevels`**: integer count of levels where all topics are marked complete in the `progress` table. A level is complete only when every topic in it has a `completed_at` timestamp.

---

## 4. Vertical Connector Line (Decorative)

A thin vertical line that visually connects the level cards, creating the "trail" metaphor.

**Implementation:**
- Position the level cards container as `position: relative`
- The line is `position: absolute`, `left: 31px` (centred on the level number badge), `top: 48px`, `bottom: 48px`
- Width: 2px, background: `#E2E8F0`
- Z-index: 0 (behind all cards)
- The level cards themselves sit at `position: relative, z-index: 1`

This line should not extend above the first card or below the last card. Adjust `top` and `bottom` values to align correctly with the card number badges.

---

## 5. Level Card Component

Each of the five levels renders as a `LevelCard` component. The component has three distinct visual states: **completed**, **active**, and **locked**. The state determines everything — visual weight, colour, interactivity, and what's shown inside.

**File:** `src/components/app/LevelCard.tsx`

---

### 5a. Shared card structure (all states)

```
border-radius: 16px
border: 1px solid {cardBorder}
border-left: 4px solid {cardLeftBorder}
background: {cardBg}
padding: 24px 28px
cursor: {cardCursor}
transition: border-color 0.15s, box-shadow 0.15s
```

All states share the same outer dimensions and border-radius. What changes is colour, content density, and interactivity.

**Level accent colours:**
| Level | Accent | Accent Dark | Accent Text |
|---|---|---|---|
| 1 | `#A8F0E0` (mint) | `#1A6B5F` | `#1A6B5F` |
| 2 | `#F7E8A4` (yellow) | `#8A6A00` | `#8A6A00` |
| 3 | `#38B2AC` (teal) | `#1A7A76` | `#1A7A76` |
| 4 | `#F5B8A0` (peach) | `#8C3A1A` | `#8C3A1A` |
| 5 | `#C3D0F5` (lavender) | `#2E3F8F` | `#2E3F8F` |

---

### 5b. State: Completed

**Visual treatment:**
```
cardBorder: #E2E8F0
cardLeftBorder: {levelAccent}
cardBg: #FFFFFF
cardCursor: pointer
opacity: 1
```

Hover: `border-color: {levelAccent}` (full opacity, not just the left border)

**Card layout — flex column, gap: 0:**

**Row 1 — Card header (flex row, space-between, align-items: flex-start):**

Left side:
- Level badge: circular, 44×44px, background `{levelAccent}55`, border `1px solid {levelAccent}88`
  - Contains: level number — font-size: 16px, font-weight: 800, color: `{levelAccentDark}`
  - Float: left, margin-right: 14px (part of a flex row with the title block)
- Title block (flex column):
  - Line 1: Level label — `"LEVEL {n}"` — font-size: 10px, font-weight: 700, color: `{levelAccentDark}`, text-transform: uppercase, letter-spacing: 0.08em, margin-bottom: 3px
  - Line 2: Level name — e.g. "AI Fundamentals & Awareness" — font-size: 17px, font-weight: 700, color: `#1A202C`, letter-spacing: -0.2px

Right side:
- Completion badge: pill shape
  - Background: `{levelAccent}44`
  - Border: `1px solid {levelAccent}88`
  - Text: "✓ Complete" — font-size: 11px, font-weight: 700, color: `{levelAccentDark}`, padding: 4px 12px, border-radius: 20px
- Completion date below badge: `"Completed {date}"` — font-size: 11px, color: `#718096`, text-align: right, margin-top: 4px

**Row 2 — Completion summary (margin-top: 16px, padding-top: 16px, border-top: 1px solid #E2E8F0):**

Three stat chips in a flex row, gap: 12px:

Each chip:
```
background: #F7FAFC
border: 1px solid #E2E8F0
border-radius: 8px
padding: 8px 14px
text-align: center
```
- Line 1: value — font-size: 18px, font-weight: 800, color: `#1A202C`
- Line 2: label — font-size: 11px, color: `#718096`, margin-top: 2px

Chip values:
- Chip 1: `"{totalTopics}"` / "Topics completed"
- Chip 2: `"{artefactsCreated}"` / "Artefacts created"  
- Chip 3: `"{toolsUnlocked}"` / "Tools unlocked"

`artefactsCreated` and `toolsUnlocked` — query from Supabase `insights` table and `toolkitData` respectively (see Section 9).

**Row 3 — Collapsed topic list toggle (margin-top: 12px):**

A text button: "Show topics ↓" / "Hide topics ↑" — toggling visibility of the topic list below.
- Font-size: 12px, font-weight: 600, color: `#718096`
- Default state: collapsed (topics hidden)
- On click: expand to show the topic list (animated — max-height transition, 200ms ease)
- No border, no background, cursor: pointer

**Expanded topic list (when toggled open):**
A compact list of all topics for this level, shown as simple rows:
- Each row: checkmark icon + topic title + time
- Checkmark: Lucide `Check`, size 12, color `{levelAccentDark}`
- Topic title: font-size: 13px, color: `#4A5568`
- Time: font-size: 11px, color: `#718096`, margin-left: auto
- Row padding: 6px 0, border-bottom: `1px solid #F7FAFC` (very subtle)
- Margin-top: 10px

**On card click** (anywhere except the toggle button): navigate to `/app/level?level={n}` — this will show the completed level's content in the Current Level page (PRD 04 handles this).

---

### 5c. State: Active

The active card is the most visually prominent element on the page. It should feel alive.

**Visual treatment:**
```
cardBorder: {levelAccent}
cardLeftBorder: {levelAccent}
cardBg: {levelAccent}0D   ← very faint accent tint (5% opacity)
cardCursor: pointer
```

No hover border change — it's already at full accent colour. Hover: very subtle background darkening (`{levelAccent}18`).

**Card layout — flex column:**

**Row 1 — Card header (same flex structure as completed, but richer):**

Left side:
- Level badge: same circular badge but with `background: {levelAccent}`, `border: none`
  - Level number: color: `{levelAccentDark}` if light accent, `#FFFFFF` if dark accent
  - Actually for all levels: color `{levelAccentDark}`
- Title block: same as completed

Right side:
- "In Progress" pill badge:
  - Background: `{levelAccent}`
  - Border: none
  - Text: "● In Progress" — font-size: 11px, font-weight: 700, color: `{levelAccentDark}`, padding: 4px 12px, border-radius: 20px
  - The `●` is a bullet character, giving a subtle "live" indicator feel

**Row 2 — Level description (margin-top: 12px):**
- Text: one-sentence description of this level's focus (see Section 8 — Content Data)
- Font-size: 14px, color: `#4A5568`, line-height: 1.6

**Row 3 — Progress bar (margin-top: 16px):**

Label row (flex, space-between, margin-bottom: 6px):
- Left: `"{completedTopics} of {totalTopics} topics complete"` — font-size: 12px, color: `#718096`, font-weight: 500
- Right: `"{Math.round(completedTopics/totalTopics*100)}%"` — font-size: 12px, font-weight: 700, color: `#1A202C`

Progress bar:
- Height: 6px, background: `{levelAccent}44`, border-radius: 6px, overflow: hidden
- Fill: width `{pct}%`, background: `{levelAccent}` (full accent, not dark), border-radius: 6px

**Row 4 — Topic list (always expanded for active level — no toggle):**

Shown by default, cannot be collapsed. Margin-top: 16px, padding-top: 16px, border-top: `1px solid {levelAccent}44`.

Each topic as a row, gap: 8px:

```
display: flex
align-items: center
gap: 12px
padding: 8px 0
border-bottom: 1px solid {levelAccent}22
```

Status dot (flex-shrink: 0):
- Completed: 22×22px circle, background `{levelAccentDark}`, white checkmark (Lucide `Check`, size 10)
- Active: 22×22px circle, background `{levelAccent}`, topic number (font-size 10px, font-weight 800, color `{levelAccentDark}`)
- Upcoming: 22×22px circle, background `{levelAccent}22`, border `1px solid {levelAccent}66`, no icon

Topic title:
- Completed: font-size 13px, font-weight 500, color `#718096`
- Active: font-size 13px, font-weight 700, color `#1A202C`
- Upcoming: font-size 13px, font-weight 400, color `#A0AEC0`

Active topic phase (active state only):
- Inline text after title: `"· Slide {n} of {m}"` or `"· Phase 2 · Read"` — font-size 12px, color `{levelAccentDark}`, font-weight 500

Time estimate (margin-left: auto, flex-shrink: 0):
- Completed: font-size 11px, color `#A0AEC0` (lighter, de-emphasised)
- Active + upcoming: font-size 11px, color `#718096`

**Row 5 — CTA row (margin-top: 16px):**

```
display: flex
align-items: center
justify-content: space-between
```

Left: Resume button:
- Same style as Dashboard resume button
- Text: "Continue Level {n} →"
- Background: `#38B2AC`, color: white, border-radius: 24px, padding: 10px 22px, font-size 14px, font-weight 600
- Hover: `#2D9E99`
- On click: navigate to `/app/level`

Right: tools teaser — show which tools this level unlocks:
- Text: "Unlocks: " followed by tool emoji icons inline
- Font-size: 12px, color: `#718096`
- Tool emojis: pull from `toolkitData.ts` where `levelRequired === currentLevel`
- E.g. "Unlocks: ⚡ 📚" for Level 1

---

### 5d. State: Locked

Locked levels are visible but deliberately restrained. The goal is aspiration, not frustration — the user should feel motivated to get here, not blocked by a wall.

**Visual treatment:**
```
cardBorder: #E2E8F0
cardLeftBorder: #E2E8F0
cardBg: #FFFFFF
cardCursor: default
opacity: 1   ← NOT faded out entirely — full opacity, just muted content
```

No hover effect.

**Card layout — flex column:**

**Row 1 — Card header:**

Left side:
- Level badge: 44×44px circle, background `#F7FAFC`, border `1px solid #E2E8F0`
  - Padlock icon (Lucide `Lock`, size 16, color `#A0AEC0`) — not the level number
- Title block:
  - Level label: `"LEVEL {n}"` — font-size 10px, font-weight 700, color `#A0AEC0`, text-transform uppercase, letter-spacing 0.08em
  - Level name: font-size 17px, font-weight 700, color `#A0AEC0` — muted, not navy

Right side:
- "Locked" pill:
  - Background: `#F7FAFC`
  - Border: `1px solid #E2E8F0`
  - Text: "🔒 Locked" — font-size 11px, font-weight 600, color `#A0AEC0`, padding 4px 12px, border-radius 20px

**Row 2 — Unlock condition (margin-top: 12px):**
- Text: `"Complete Level {n-1} to unlock"` — font-size 13px, color `#A0AEC0`, font-style: italic

**Row 3 — Aspirational preview (margin-top: 14px, padding-top: 14px, border-top: 1px solid #F7FAFC):**

This is the "see through the glass" section. Show what's inside, just slightly obscured.

Level description:
- Font-size: 13px, color: `#A0AEC0`, line-height: 1.6

Tools teaser:
- Text: "Unlocks: " + tool name strings (not emojis — text only for locked)
- Font-size: 12px, color: `#A0AEC0`
- E.g. "Unlocks: Workflow Canvas, Integration Sandbox"

First topic preview (just the first topic name, no more):
- Text: `"First topic: {firstTopicTitle}"` — font-size 12px, color `#A0AEC0`, margin-top: 6px

**Do NOT show:**
- Topic list (no list for locked levels — too much detail; just the first topic name as a teaser)
- Progress bars
- CTAs or buttons of any kind

---

## 6. Completion Banner

Only shown when all 5 levels are complete (`completedLevels === 5`). Renders below the last level card.

```
background: linear-gradient(135deg, #38B2AC 0%, #2D9E99 100%)
border-radius: 16px
padding: 32px 36px
text-align: center
margin-top: 12px
```

Contents:
- Large emoji: "🎓" — font-size 40px, margin-bottom: 12px
- Heading: "Programme Complete" — font-size 22px, font-weight: 800, color: `#FFFFFF`
- Subtitle: "You've completed all five levels of the Oxygy AI Upskilling Programme." — font-size: 14px, color: `rgba(255,255,255,0.85)`, margin-top: 6px, margin-bottom: 20px
- CTA button: "Download Certificate →" — white background, `#38B2AC` text, border-radius: 24px, padding: 10px 24px, font-size: 14px, font-weight: 700 — non-functional for now (no certificate feature yet), show a toast on click: "Certificate feature coming soon."

**This banner does not render at all if completedLevels < 5.** No partially-complete states.

---

## 7. Interactions & Animations

### Page load
Same stagger as Dashboard, applied to the header + each level card:
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
- Page header: delay 0ms
- Level card 1: delay 60ms
- Level card 2: delay 120ms
- Level card 3: delay 180ms
- Level card 4: delay 240ms
- Level card 5: delay 300ms

All animations: duration 0.3s, ease, `animation-fill-mode: both`

### Topic list expand/collapse (completed cards)
- `max-height: 0` → `max-height: 400px` on expand
- `overflow: hidden`
- `transition: max-height 0.2s ease`
- Toggle arrow rotates: `transform: rotate(0deg)` → `transform: rotate(180deg)` on expand (0.2s)

### Progress bar fill (active card)
On mount, the progress bar animates from 0 to its actual width:
- `transition: width 0.7s ease 0.3s` (delayed by 0.3s to let the card animate in first)

### Hover (completed cards only)
- `border-color` transitions to `{levelAccent}` (full opacity) — 0.15s

### No hover effects on locked cards. No hover effects that obscure content.

---

## 8. Content Data

All level descriptions are static and defined in a new export in `src/data/levelTopics.ts`. Add the following to the existing file (do not create a new file):

```typescript
// Add to src/data/levelTopics.ts

export interface LevelMeta {
  number: number;
  name: string;
  shortName: string;
  tagline: string;        // Used on My Journey cards as the level description
  accentColor: string;
  accentDark: string;
}

export const LEVEL_META: LevelMeta[] = [
  {
    number: 1,
    name: "AI Fundamentals & Awareness",
    shortName: "Fundamentals",
    tagline: "Build comfort and curiosity with AI. Learn how large language models work, how to prompt them well, and how to apply them to everyday work — responsibly.",
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
  },
  {
    number: 2,
    name: "Applied Capability",
    shortName: "Applied",
    tagline: "Move from AI user to AI builder. Design and deploy custom GPTs and agents tailored to your role, creating tools that your whole team can reuse.",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },
  {
    number: 3,
    name: "Systemic Integration",
    shortName: "Systemic",
    tagline: "Connect AI into end-to-end automated workflows. Scale individual capability into organisational impact through integrated, accountable pipelines.",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },
  {
    number: 4,
    name: "Interactive Dashboards",
    shortName: "Dashboards",
    tagline: "Shift from data-in-a-spreadsheet to designed intelligence. Build interactive dashboards that surface the right insight to the right person at the right time.",
    accentColor: "#F5B8A0",
    accentDark: "#8C3A1A",
  },
  {
    number: 5,
    name: "AI-Powered Applications",
    shortName: "Applications",
    tagline: "Build complete AI applications with individual user accounts, personalised experiences, and role-based journeys. The full stack, end to end.",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
];
```

---

## 9. Supabase Data Queries

Create a custom hook: `src/hooks/useJourneyData.ts`

This hook returns:
```typescript
interface JourneyData {
  levels: LevelProgress[];
  completedLevelsCount: number;
}

interface LevelProgress {
  levelNumber: number;          // 1–5
  status: 'completed' | 'active' | 'locked';
  completedTopics: number;
  totalTopics: number;
  completedAt: Date | null;     // date level was completed (all topics done)
  artefactsCreated: number;     // count from insights table
  toolsUnlocked: number;        // derived from toolkitData — count where levelRequired <= levelNumber
  activeTopicIndex: number;     // 0-based, only relevant for active level
  currentSlide: number;         // only relevant for active level
  currentPhase: number;         // only relevant for active level
  activeDaysThisWeek: boolean[];
}
```

### Query 1 — All progress for this user
```sql
select level, topic_id, phase, slide, completed_at
from progress
where user_id = {userId}
order by level asc, topic_id asc
```

Use this single query to derive:
- Which levels are completed (all topics have `completed_at`)
- Which level is active (the first level with at least one incomplete topic)
- Which levels are locked (come after the active level)
- `completedTopics` per level
- `activeTopicIndex`, `currentSlide`, `currentPhase` for the active level

**Level status logic:**
```
for each level 1–5:
  if all topics have completed_at → 'completed'
  else if this is the lowest-numbered level with incomplete topics → 'active'
  else → 'locked'
```

Only one level can be 'active' at a time. If all levels are complete, there is no active level — show all as 'completed'.

### Query 2 — Artefacts per level
```sql
select level, count(*) as artefact_count
from insights
where user_id = {userId}
group by level
```

Map results to `artefactsCreated` per level. If no row for a level, artefactsCreated = 0.

### Query 3 — Completion dates
From Query 1, for each completed level, find the `MAX(completed_at)` across all topics in that level. This is the "level completion date" shown on completed cards.

Format as: `"Jan 14, 2026"` using `new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)`.

### Tools unlocked per level
This is derived client-side from `toolkitData.ts` — no Supabase query needed:
```typescript
const toolsUnlocked = ALL_TOOLS.filter(t => t.levelRequired === levelNumber).length;
```

### Parallel fetching
Run Query 1 and Query 2 in parallel with `Promise.all`. Do not waterfall.

### Fallback / loading
- Loading state: show skeleton cards for all 5 levels (grey placeholder blocks matching approximate card height)
- If query fails: show "Unable to load journey data." with a retry button. This is the one page where an error state IS appropriate (unlike Dashboard which fails silently) — the journey data IS the page.

---

## 10. Developer Notes

- **`LEVEL_META` is added to the existing `src/data/levelTopics.ts`** — not a new file. Confirm the existing file is imported correctly in the component.

- **The vertical connector line** behind the cards requires the card stack to have `position: relative`. The line div must be `position: absolute`. Test that it aligns correctly with the level badge circles at different viewport heights.

- **Topic list expand/collapse** on completed cards uses `max-height` animation, not `display: none` toggle. `display: none` breaks transitions.

- **Level status is derived from a single query** — do not make separate queries per level. One query, client-side derivation. This is important for performance.

- **The active level card is always fully expanded** (topic list visible, no toggle). Only completed level cards have the collapse toggle. Locked level cards never show the full topic list.

- **Completed level cards default to collapsed.** Only the topic toggle button opens them. Do not auto-expand any completed card on page load.

- **The `completedAt` date for a completed level** is the maximum `completed_at` across all of that level's topics — i.e. when the last topic was finished. Not a separate "level completion" record.

- **Locked levels show `opacity: 1`** (not faded). The muting is achieved through colour alone (grey text, grey accents). Full opacity makes the aspirational content readable. A global `opacity: 0.5` on locked cards was considered and rejected — it makes the preview unreadable.

- **No `console.log` statements** in final output.

- **`toolsUnlocked` stat on completed cards** — even if a user is on Level 2 and looking at their completed Level 1 card, show `toolsUnlocked` as the number of tools that level unlocks (not the user's current total). It's a per-level stat, not cumulative.

---

## 11. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       └── LevelCard.tsx           ← reusable level card (all 3 states)
└── hooks/
    └── useJourneyData.ts           ← all Supabase queries for this page
```

Existing files to modify:
- `src/data/levelTopics.ts` — add `LevelMeta` interface and `LEVEL_META` array
- `src/pages/app/AppJourney.tsx` — replace placeholder with full implementation

---

## 12. Acceptance Criteria

Before marking this PRD complete, verify:

- [ ] Page renders correctly inside AppLayout, "My Journey" sidebar item is active
- [ ] Page header shows correct overall progress bar and `{n} of 5 levels complete`
- [ ] Completed level cards show: level name, ✓ Complete badge, completion date, three stat chips (topics, artefacts, tools), collapsed topic toggle
- [ ] Topic list expands and collapses smoothly on toggle (max-height animation, arrow rotates)
- [ ] Active level card is visually prominent, shows full expanded topic list, progress bar, and Resume CTA
- [ ] Active level's topic list shows correct states (completed / active / upcoming) per topic
- [ ] Active topic shows current phase/slide inline
- [ ] Resume button navigates to `/app/level`
- [ ] Locked level cards show padlock badge, unlock condition text, level description, and tools teaser
- [ ] Locked cards have no hover effect and no CTA
- [ ] All five level accent colours render correctly (mint, yellow, teal, peach, lavender)
- [ ] Vertical connector line sits behind cards and aligns with level badge circles
- [ ] Page load stagger animation plays correctly (header first, then each card 60ms apart)
- [ ] Progress bar on active card animates from 0 to actual value on mount (with 0.3s delay)
- [ ] Completion banner renders only when all 5 levels are complete
- [ ] All data from a single Supabase query (check Network tab — one query, not five)
- [ ] Loading skeleton shows while data fetches
- [ ] Error state shows with retry button if query fails
- [ ] `LEVEL_META` has been added to `src/data/levelTopics.ts` (not a new file)
- [ ] No TypeScript errors on build
- [ ] No console errors in browser
