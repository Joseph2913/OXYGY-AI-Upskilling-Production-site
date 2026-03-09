# PRD 06 — My Artefacts Page
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing), PRD 02 (data files), PRD 05 (toolkitData.ts — tool routes used for "launch in tool" action)  
**Standalone:** This PRD does not depend on PRDs 03 or 04 being complete.

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRD 01 is complete — `AppLayout`, `AppSidebar`, `AppTopBar` all exist and working
2. Read `src/data/toolkitData.ts` — the `route` field on each tool is used by the "Launch in Tool" action in the quick-use panel
3. Read `src/data/levelTopics.ts` — `LEVEL_META` provides level names and accent colours
4. Read `src/context/AppContext.tsx` — `currentLevel` determines which level filters are available
5. Read the existing `src/pages/app/AppArtefacts.tsx` placeholder — replace its contents entirely
6. Check whether a `supabase_types.ts` or equivalent type file exists — use existing Supabase types if present rather than redefining them

This page is primarily a data retrieval and display problem. Read the full PRD before writing any code. The search + filter system (Section 4) and the quick-use panel (Section 8) are the two most complex pieces — understand both before starting.

---

## 1. Overview

### Purpose
My Artefacts is the learner's **working library** — a searchable, filterable collection of every tangible output they have created through the programme. It is not a portfolio or showcase; it is a functional retrieval system. The primary use case is: *"I built something useful last week — let me find it and use it again right now."*

### Design philosophy
**Search-first, friction-free retrieval.** The search bar is the hero element. Cards communicate at a glance. Actions are one click away. The quick-use panel means you never have to navigate away to retrieve what you need. Speed and clarity over visual drama.

### Where it sits
Route: `/app/artefacts`  
Sub-routes: `/app/artefacts/{artefactId}` — opens the quick-use panel for that artefact  
Rendered inside: `AppLayout`  
"My Artefacts" nav item is active on all `/app/artefacts/*` routes.

---

## 2. What Is an Artefact?

An artefact is any tangible output saved by the learner during the programme. There are five artefact types, one per level:

| Type | Created in | Level | Description |
|---|---|---|---|
| `prompt` | Prompt Playground / Prompt Library | 1 | A saved, named prompt — includes the full prompt text |
| `agent` | Agent Builder | 2 | A custom agent configuration — includes system prompt, persona, constraints |
| `workflow` | Workflow Canvas | 3 | A workflow diagram — stored as a JSON node/edge structure with a human-readable summary |
| `dashboard` | Dashboard Designer | 4 | A dashboard prototype spec — stored as a JSON layout description |
| `app_spec` | App Builder | 5 | A full application specification — stored as a structured JSON document |

Each artefact has:
- A **name** — user-editable, defaults to auto-generated (e.g. "Prompt · 14 Mar 2026")
- A **type** — one of the five above
- A **level** — integer 1–5 (determines colour coding)
- **Content** — the actual artefact payload (stored as JSONB in Supabase)
- **Created at** and **last opened at** timestamps
- A **preview** — a short text string extracted from content for display on the card

### Artefact content structure (per type)

```typescript
// Prompt
{ promptText: string; }

// Agent
{ persona: string; systemPrompt: string; constraints: string[]; }

// Workflow
{ summary: string; nodeCount: number; agentCount: number; nodes: object[]; }

// Dashboard
{ title: string; description: string; componentCount: number; layout: object; }

// App spec
{ title: string; description: string; userTypes: string[]; spec: object; }
```

---

## 3. Page Layout

### Outer wrapper
```
background: #F7FAFC
padding: 28px 36px
max-width: 1060px
```

### Structure (top to bottom)

```
<PageHeader />           ← Title + stats strip
<SearchFilterBar />      ← Search input + type filters + level filters + sort
<ArtefactGrid />         ← 3-column card grid (or empty state)
<QuickUsePanel />        ← Slide-in panel, right-anchored (always rendered, hidden by default)
```

---

## 4. Page Header

**Container:** `margin-bottom: 20px`

**Top row (flex, space-between, align-items: flex-start):**

Left:
- Title: "My Artefacts" — font-size: 28px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.4px
- Subtitle: "Everything you've built. Find it, reuse it, improve it." — font-size: 14px, color: `#718096`, margin-top: 5px

Right — stats strip (flex row, gap: 16px, align-items: center, margin-top: 6px):

Each stat (flex column, text-align: right):
- Value: font-size: 20px, font-weight: 800, color: `#1A202C`
- Label: font-size: 11px, color: `#718096`, font-weight: 500

Stats to show:
1. Total artefact count — label: "artefacts"
2. Levels represented — label: "levels" (e.g. if user has artefacts from L1 and L2, show "2")
3. Last created — label: "last created" — value: relative time (e.g. "2d ago")

Thin `1px solid #E2E8F0` divider between stats. Hide any stat where the value would be 0 or meaningless.

---

## 5. Search & Filter Bar

This is the most important structural element on the page. It must be **sticky** — it stays at the top of the content area as the user scrolls through their artefacts.

```
position: sticky
top: 0
background: #F7FAFC
padding: 0 0 16px 0
z-index: 5
```

### Search input

```
width: 100%
background: #FFFFFF
border: 1.5px solid #E2E8F0
border-radius: 12px
padding: 12px 16px 12px 44px   ← left padding for icon
font-size: 14px
color: #1A202C
font-family: 'DM Sans', sans-serif
transition: border-color 0.15s
margin-bottom: 12px
```

- Placeholder: "Search artefacts by name or content…"
- Placeholder color: `#A0AEC0`
- Focus state: `border-color: #38B2AC`, `outline: none`
- Lucide `Search` icon (size 16, color `#A0AEC0`) positioned absolutely inside the input, left: 14px, vertically centred
- Clear button (Lucide `X`, size 14, color `#A0AEC0`): appears on the right when input has value, on click clears input and resets results
- Search is **live** — filter results update on every keystroke with no submit button. Debounce by 150ms.
- Search matches against: artefact name (primary), preview text (secondary)
- Search is client-side — filter the already-loaded artefacts array, do not re-query Supabase on each keystroke

### Filter row (flex, gap: 8px, flex-wrap: wrap, align-items: center)

**Type filters** (left group):
One chip per artefact type. Label format: icon + type name.

Type icons (use these specific Lucide icons):
- Prompt: `Zap`
- Agent: `Bot`
- Workflow: `GitBranch`
- Dashboard: `LayoutDashboard`
- App Spec: `Layers`

Each chip:
```
display: flex
align-items: center
gap: 5px
padding: 6px 14px
border-radius: 20px
font-size: 12px
font-weight: 600
cursor: pointer
transition: all 0.15s
border: 1px solid #E2E8F0
background: #FFFFFF
color: #718096
```

Active type chip: `background: #1A202C`, `color: #FFFFFF`, `border-color: #1A202C`

**Divider** between type and level filters: `1px solid #E2E8F0`, height 20px, flex-shrink 0

**Level filters** (right group):
One chip per level, colour-coded. Only show levels where the user actually has artefacts — don't show Level 3 chip if they have no Level 3 artefacts.

Level chip styling (inactive):
```
background: {levelAccent}22
border: 1px solid {levelAccent}66
color: {levelAccentDark}
```

Level chip styling (active):
```
background: {levelAccent}
border: 1px solid {levelAccentDark}
color: {levelAccentDark}
```

Label: "L{n} · {LevelShortName}" — e.g. "L1 · Fundamentals"

**Sort control** (pushed to right with `margin-left: auto`):

A minimal select-style control (not a native `<select>` — a custom styled button that cycles through options):
- "Recent" → "Oldest" → "A–Z"
- Font-size: 12px, color: `#718096`, font-weight: 600
- Lucide `ArrowUpDown` icon (size 12) before label
- No border — just text. Hover: color `#1A202C`
- On click: cycles to next sort option, re-sorts artefact grid

**Filter interaction rules:**
- Multiple type filters can be active simultaneously (OR logic — show prompts AND agents)
- Multiple level filters can be active simultaneously (OR logic)
- Type and level filters combine with AND logic (show Level 2 Agents)
- Clicking an active filter deactivates it
- A "Clear filters" text link appears (font-size: 12px, color: `#38B2AC`) when any filter is active — resets all filters and search
- Filter state is component state only (not URL params, except for the artefact ID in the panel)

---

## 6. Artefact Card Grid

### Grid container
```
display: grid
grid-template-columns: repeat(3, 1fr)
gap: 14px
```

Cards are uniform height — do not use masonry. Consistent grid.

### Artefact Card Component

**File:** `src/components/app/artefacts/ArtefactCard.tsx`

**Container:**
```
border-radius: 14px
border: 1px solid #E2E8F0
border-left: 4px solid {levelAccentColor}
background: #FFFFFF
padding: 18px 20px
cursor: pointer
transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s
position: relative
display: flex
flex-direction: column
gap: 10px
```

**Hover state:**
```
border-color: {levelAccentColor}
transform: translateY(-2px)
box-shadow: 0 4px 16px {levelAccentColor}28
```

**Selected state** (when quick-use panel is open for this card):
```
border-color: {levelAccentColor}
border-left-width: 4px
box-shadow: 0 0 0 2px {levelAccentColor}66
```

---

#### Card — Row 1: Header (flex, space-between, align-items: flex-start)

**Left: Type icon block (flex, gap: 8px, align-items: center)**

Type icon container:
```
width: 32px
height: 32px
border-radius: 8px
background: {levelAccentColor}33
display: flex
align-items: center
justify-content: center
flex-shrink: 0
```
Icon: Lucide icon for type (see filter row above), size 15, color: `{levelAccentDark}`

Level badge pill (next to icon):
```
background: {levelAccentColor}33
border: 1px solid {levelAccentColor}66
border-radius: 20px
padding: 2px 8px
font-size: 10px
font-weight: 700
color: {levelAccentDark}
text-transform: uppercase
letter-spacing: 0.04em
```
Text: "Level {n}"

**Right: Timestamp**
- "2d ago", "Just now", "Yesterday" etc. — font-size: 11px, color: `#A0AEC0`
- Uses `lastOpenedAt` if available, else `createdAt`

---

#### Card — Row 2: Name (inline editable)

The artefact name is displayed as text but is **inline editable on double-click** (not single click — avoids accidental edits when clicking to open the panel).

**Display state:**
- Font-size: 14px, font-weight: 700, color: `#1A202C`
- Max 2 lines, `overflow: hidden`, `text-overflow: ellipsis`, `display: -webkit-box`, `-webkit-line-clamp: 2`

**Edit state (on double-click):**
- The text becomes an `<input>` or `<textarea>` in place
- Same font-size, font-weight, color as display state
- `background: {levelAccentColor}10`, `border: 1px solid {levelAccentColor}`, `border-radius: 6px`, `padding: 2px 6px`
- On blur or Enter: save the new name (write to Supabase), return to display state
- On Escape: discard changes, return to display state
- On blur with empty value: restore the previous name (do not save empty)
- Show a small tooltip on hover of the name: "Double-click to rename" — font-size: 11px, background: `#1A202C`, color: white, padding: 4px 8px, border-radius: 6px, appears after 600ms hover delay

**Rename write to Supabase:**
```sql
update artefacts
set name = {newName}, updated_at = now()
where id = {artefactId} and user_id = {userId}
```

---

#### Card — Row 3: Preview snippet

A short text preview extracted from the artefact content — the "smell" of the artefact:

- **Prompt:** First 120 characters of `promptText`, truncated with "…"
- **Agent:** `"{persona} — {systemPrompt first 80 chars}…"`
- **Workflow:** `"{nodeCount} nodes · {agentCount} agents — {summary}"`
- **Dashboard:** `"{componentCount} components — {description first 80 chars}…"`
- **App Spec:** `"{userTypes.join(', ')} — {description first 80 chars}…"`

Font-size: 12px, color: `#718096`, line-height: 1.5, max 3 lines (`-webkit-line-clamp: 3`)

---

#### Card — Row 4: Action strip (visible on hover only)

```
display: flex
align-items: center
gap: 6px
opacity: 0
transition: opacity 0.15s
```

On card hover: `opacity: 1`

Four action buttons:

**Open** (primary):
```
background: {levelAccentColor}
color: {levelAccentDark}
border: none
border-radius: 20px
padding: 5px 12px
font-size: 11px
font-weight: 700
cursor: pointer
font-family: inherit
```
On click: open quick-use panel for this artefact (navigate to `/app/artefacts/{id}`)

**Duplicate:**
```
background: #F7FAFC
border: 1px solid #E2E8F0
border-radius: 20px
padding: 5px 12px
font-size: 11px
font-weight: 600
color: #718096
cursor: pointer
font-family: inherit
```
On click: create a duplicate artefact (same content, name = `"{name} (copy)"`), insert into Supabase, refresh grid. Show a brief toast: "Artefact duplicated."

**Archive:**
Same style as Duplicate.
On click: show a small inline confirmation on the card — "Archive this? [Yes] [Cancel]" replacing the action strip momentarily. On confirm: set `archived_at = now()` in Supabase, remove from grid with a fade-out animation (150ms). Archived artefacts are not shown in the main grid. No separate archive view in this PRD.

**Rename shortcut:**
A text button: "Rename" — same style as archive.
On click: programmatically trigger the inline rename edit state (same as double-clicking the name).

---

## 7. Empty States

### A — Zero artefacts (brand new user)

Show the grid replaced with a structured empty state:

```
padding: 40px 0
display: grid
grid-template-columns: repeat(3, 1fr)
gap: 14px
```

Show 5 ghost cards — one per artefact type — in locked/greyed appearance:

Each ghost card:
```
border-radius: 14px
border: 1px dashed #E2E8F0
background: #FAFAFA
padding: 18px 20px
opacity: 0.7
```

Inside each ghost card:
- Type icon container (greyed — background `#F0F0F0`, icon color `#CBD5E0`)
- Name placeholder: a `#E2E8F0` rounded bar, height 14px, width 60%
- Preview placeholder: two `#F0F0F0` bars, height 10px, widths 90% and 70%
- Bottom label: "Complete {levelName} topics to create your first {typeName}" — font-size: 11px, color: `#A0AEC0`, text-align: center, margin-top: 10px

Below the ghost cards, a centred CTA:
- Text: "Your artefacts appear here as you complete learning activities."
- Font-size: 13px, color: `#718096`, margin-bottom: 12px
- Button: "Go to Current Level →" — teal pill button, navigates to `/app/level`

### B — Filters active, no results

Replace grid with a centred message (no ghost cards):
```
padding: 60px 0
text-align: center
```
- Lucide `SearchX` icon, size 36, color `#CBD5E0`, margin-bottom: 12px
- Heading: "No artefacts match your filters" — font-size: 16px, font-weight: 700, color: `#1A202C`
- Subtext: "Try adjusting your search or removing a filter." — font-size: 13px, color: `#718096`
- "Clear filters" button — teal pill, resets all filters

### C — Search has no results

Same layout as B but:
- Heading: `"No results for "{searchQuery}""`
- Subtext: "Check the spelling, or try searching for the artefact type instead."

---

## 8. Quick-Use Panel

When a user clicks "Open" on a card (or navigates directly to `/app/artefacts/{id}`), a slide-in panel appears from the right. This is the richest interaction on the page — full preview, copy, and launch in the relevant tool.

### Panel container
```
position: fixed
top: 54px              ← below app top bar
right: 0
bottom: 0
width: 440px
background: #FFFFFF
border-left: 1px solid #E2E8F0
z-index: 20
overflow-y: auto
transform: translateX(100%)    ← closed
transform: translateX(0)       ← open
transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)
display: flex
flex-direction: column
```

Close behaviour: × button, Escape key, or clicking outside the panel (clicking on the grid while panel is open). On close: `transform: translateX(100%)`, then after 250ms reset URL to `/app/artefacts`.

### Panel — Header (sticky)

```
position: sticky
top: 0
background: #FFFFFF
z-index: 2
padding: 20px 24px 16px
border-bottom: 1px solid #E2E8F0
```

**Top row (flex, space-between, align-items: flex-start):**

Left: Type + level identity block
- Type icon: 44×44px container, `background: {levelAccentColor}44`, border-radius 11px, Lucide type icon (size 20, color `{levelAccentDark}`)
- Below icon: type label — `"{TypeName}"` — font-size: 11px, font-weight: 700, color: `{levelAccentDark}`, text-transform uppercase, letter-spacing 0.07em

Right: Close button (Lucide `X`, size 18, color `#718096`, hover color `#1A202C`)

**Name row (margin-top: 12px):**
- Artefact name — same inline-editable behaviour as the card (double-click to rename)
- Font-size: 18px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.3px

**Meta row (flex, gap: 12px, margin-top: 6px):**
- Level pill: same style as card level badge
- Created date: "Created {date}" — font-size: 12px, color: `#718096`
- Last opened: "Last opened {timeAgo}" — font-size: 12px, color: `#718096`

### Panel — Action bar (below header, not sticky)

```
padding: 14px 24px
border-bottom: 1px solid #E2E8F0
display: flex
align-items: center
gap: 10px
background: {levelAccentColor}08
```

**Primary action — "Launch in {ToolName}":**
```
background: #38B2AC
color: #FFFFFF
border: none
border-radius: 24px
padding: 10px 20px
font-size: 13px
font-weight: 700
font-family: inherit
cursor: pointer
display: flex
align-items: center
gap: 6px
```
Lucide `ExternalLink` icon (size 13) after label text.
On click: navigate to the tool route from `toolkitData.ts` matching this artefact type:
- prompt → `/app/toolkit/prompt-playground`
- agent → `/app/toolkit/agent-builder`
- workflow → `/app/toolkit/workflow-canvas`
- dashboard → `/app/toolkit/dashboard-designer`
- app_spec → `/app/toolkit/app-builder`

**Secondary actions (flex row, gap: 8px, margin-left: auto):**

Copy button:
- Lucide `Copy` icon (size 14) + "Copy" label
- `background: #F7FAFC`, `border: 1px solid #E2E8F0`, border-radius 20px, padding 8px 14px, font-size 12px, font-weight 600, color `#4A5568`
- On click: copy the primary content to clipboard (promptText for prompts, systemPrompt for agents, summary for workflows, description for dashboards/apps)
- On success: button briefly shows "Copied ✓" (green checkmark) for 1.5s, then reverts

Duplicate button:
- Same style as copy button, label "Duplicate"
- Same behaviour as card duplicate action

### Panel — Content area (padding: 24px, flex: 1)

This section renders the actual artefact content. Each type gets a tailored content view.

---

#### Content view: Prompt

**Section: Prompt text**
- Label: "Prompt" — section label style (font-size 11px, font-weight 700, color `#718096`, text-transform uppercase, letter-spacing 0.08em, margin-bottom 8px)
- Content box:
  ```
  background: #F7FAFC
  border: 1px solid #E2E8F0
  border-radius: 10px
  padding: 16px
  font-size: 13px
  color: #1A202C
  line-height: 1.7
  font-family: 'DM Mono', 'Courier New', monospace
  white-space: pre-wrap
  ```
- Full prompt text, not truncated
- Scrollable if long (max-height: 320px, overflow-y: auto)

**Section: Quick edit toggle (below content box)**
- Text button: "Edit this prompt →" — font-size 12px, font-weight 600, color `#38B2AC`
- On click: content box becomes editable (`contenteditable` or a `<textarea>`)
- Shows "Save changes" and "Cancel" buttons when in edit mode
- On save: write updated `promptText` to Supabase `artefacts` table, exit edit mode

---

#### Content view: Agent

**Section: Persona**
- Label: "Persona"
- Content: plain text, same content box style

**Section: System Prompt**
- Label: "System Prompt"
- Content: monospace text box, scrollable

**Section: Constraints**
- Label: "Constraints"
- Content: bulleted list — each constraint as a row with Lucide `ChevronRight` (size 12) before it
- Font-size 13px, color `#4A5568`

---

#### Content view: Workflow

**Section: Summary**
- Label: "Summary"
- Plain text content box

**Section: Pipeline stats (flex row, gap: 12px)**
Three small stat chips:
```
background: #F7FAFC
border: 1px solid #E2E8F0
border-radius: 8px
padding: 8px 14px
text-align: center
```
- Chip 1: `{nodeCount}` / "Nodes"
- Chip 2: `{agentCount}` / "Agents"
- Chip 3: `{humanCheckpoints}` / "Human checks"

**Section: Node list**
- Label: "Pipeline Steps"
- A numbered list of node names (pulled from `nodes` array in content JSON)
- Each: step number + node name, font-size 13px, color `#4A5568`

---

#### Content view: Dashboard

**Section: Description**
- Label: "Description"
- Plain text content box

**Section: Layout summary**
- Label: "Components"
- `{componentCount} components in this dashboard`
- A simple list of component names if available in the layout JSON

---

#### Content view: App Spec

**Section: Description**
- Label: "Description"
- Plain text content box

**Section: User types**
- Label: "User Types"
- Each type as a pill badge: `background: {levelAccentColor}22`, `color: {levelAccentDark}`, border-radius 20px, padding 3px 10px, font-size 12px

**Section: Spec overview**
- Label: "Specification"
- If spec JSON has a `summary` key: display it as plain text
- Otherwise: show "Full spec available — launch in App Builder to view"

---

### Panel — Navigation footer (sticky at bottom of panel)

```
position: sticky
bottom: 0
background: #FFFFFF
border-top: 1px solid #E2E8F0
padding: 14px 24px
display: flex
align-items: center
justify-content: space-between
```

**Previous / Next artefact navigation:**
- Lucide `ChevronLeft` + "Previous" — font-size 12px, color `#718096`, font-weight 600
- "Next" + Lucide `ChevronRight` — same
- Navigate through the currently filtered/sorted artefact list without closing the panel
- Disabled state: `opacity: 0.35`, `cursor: default`
- Artefact position indicator: `"{currentIndex} of {totalInView}"` — font-size 12px, color `#A0AEC0`, centered

---

## 9. Inline Rename — Detailed Behaviour

The inline rename is used in both the card and the panel. Behaviour must be identical in both places.

**Trigger:** Double-click on the artefact name text

**Edit mode activation:**
1. Text element is replaced with an `<input type="text">` (single-line, same font styles)
2. Input is pre-filled with the current name
3. Input is auto-focused and all text is selected
4. A small label appears below the input: "Press Enter to save · Esc to cancel" — font-size: 11px, color: `#A0AEC0`

**Saving:**
- Enter key: save → call Supabase, update local state, exit edit mode
- Blur (clicking away): same as Enter — save and exit
- Empty value on save: restore previous name, do not write to Supabase

**Cancelling:**
- Escape key: restore previous name, exit edit mode without saving

**Optimistic update:**
Update the local display name immediately on save. The Supabase write happens in the background. If the write fails, revert the display name and show a toast: "Couldn't save name. Try again."

**Character limit:** 80 characters. Show character count `"{n}/80"` below the input when more than 60 characters are used.

---

## 10. Supabase Schema & Queries

### Table: `artefacts`

```sql
create table artefacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('prompt', 'agent', 'workflow', 'dashboard', 'app_spec')),
  level integer not null check (level between 1 and 5),
  content jsonb not null default '{}',
  preview text,                    -- pre-computed preview string for display
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_opened_at timestamptz,
  archived_at timestamptz          -- null = active, not null = archived
);

-- RLS: users can only read/write their own artefacts
alter table artefacts enable row level security;
create policy "Users own their artefacts" on artefacts
  for all using (auth.uid() = user_id);

-- Index for fast retrieval
create index artefacts_user_level on artefacts(user_id, level);
create index artefacts_user_type on artefacts(user_id, type);
```

Include these SQL statements as a comment block at the top of `src/hooks/useArtefactsData.ts` with a note: "Run this migration in the Supabase dashboard before deploying this page."

### Query: Load all artefacts

```sql
select id, name, type, level, preview, created_at, updated_at, last_opened_at
from artefacts
where user_id = {userId}
  and archived_at is null
order by created_at desc
```

**Load strategy:** Load all artefacts in a single query on page mount. Store in local state. All filtering, searching, and sorting is done client-side on this array. Do not re-query on every filter change.

**Do not load the `content` JSONB field in the list query** — it can be large. Only load content when a specific artefact is opened in the quick-use panel.

### Query: Load single artefact content (on panel open)

```sql
select id, name, type, level, content, created_at, updated_at, last_opened_at
from artefacts
where id = {artefactId} and user_id = {userId}
```

Also update `last_opened_at` when a panel opens:
```sql
update artefacts set last_opened_at = now() where id = {artefactId}
```

### Query: Rename artefact

```sql
update artefacts
set name = {newName}, updated_at = now()
where id = {artefactId} and user_id = {userId}
```

### Query: Duplicate artefact

```sql
insert into artefacts (user_id, name, type, level, content, preview)
select user_id, {newName}, type, level, content, preview
from artefacts
where id = {sourceId} and user_id = {userId}
returning id
```

### Query: Archive artefact

```sql
update artefacts
set archived_at = now(), updated_at = now()
where id = {artefactId} and user_id = {userId}
```

---

## 11. Animations

### Page load
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
- Page header: delay 0ms, duration 0.3s
- Search bar: delay 60ms
- Cards stagger: each card gets `animation-delay: {index * 40}ms`, max 12 cards staggered (beyond 12, all use the same delay as card 12 — avoid long stagger chains)

### Card hover
- `transform: translateY(-2px)` + `box-shadow` + `border-color` — all 150ms

### Action strip reveal
- `opacity: 0 → 1` on parent hover, 150ms

### Panel slide-in
- `transform: translateX(100%) → translateX(0)`, 250ms cubic-bezier(0.4, 0, 0.2, 1)

### Archive removal
- Artefact card: `opacity: 1 → 0`, `transform: scale(0.95)`, 150ms, then remove from DOM

### Toast notifications
- Slide in from bottom-right: `transform: translateY(20px) → translateY(0)`, `opacity: 0 → 1`, 200ms
- Auto-dismiss after 2.5 seconds with fade out
- Stack if multiple toasts fire simultaneously (gap: 8px)

---

## 12. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       └── artefacts/
│           ├── ArtefactCard.tsx          ← individual card component
│           ├── ArtefactGrid.tsx          ← grid wrapper + empty states
│           ├── QuickUsePanel.tsx         ← slide-in detail panel
│           ├── SearchFilterBar.tsx       ← search + filters + sort
│           └── content/
│               ├── PromptContent.tsx     ← panel content for prompts
│               ├── AgentContent.tsx      ← panel content for agents
│               ├── WorkflowContent.tsx   ← panel content for workflows
│               ├── DashboardContent.tsx  ← panel content for dashboards
│               └── AppSpecContent.tsx   ← panel content for app specs
└── hooks/
    └── useArtefactsData.ts              ← all Supabase queries + local state
```

Existing files to modify:
- `src/pages/app/AppArtefacts.tsx` — replace placeholder with full implementation

---

## 13. Developer Notes

- **Load list without content field.** The `content` JSONB can be large. The list query selects only metadata + `preview`. Only fetch `content` when the panel opens for a specific artefact. This keeps page load fast.

- **All filtering is client-side.** One query loads all artefacts. Search, type filters, level filters, and sort all operate on the in-memory array. Do not re-query Supabase on filter changes.

- **The `preview` field** is pre-computed and stored — it is not generated on the fly from `content` on the client. When an artefact is created (in the respective tool), the creating tool is responsible for computing and saving the preview string. For this PRD, if `preview` is null, fall back to the type name: "Prompt artefact".

- **Inline rename in both card and panel** — implement the rename logic once in a shared hook or component and use it in both places. Do not duplicate the logic.

- **Quick-use panel navigation (Previous/Next)** operates on the currently filtered/sorted array — not all artefacts. If filters are active, Previous/Next navigates within the filtered subset.

- **URL for panel:** On panel open, push `/app/artefacts/{id}`. On panel close, replace URL with `/app/artefacts`. Direct navigation to `/app/artefacts/{id}` (e.g. via back button) should load the page and immediately open the panel for that artefact — handle this in the component's `useEffect` by checking for an `id` param on mount.

- **Escape key:** Add and remove event listener in `useEffect` cleanup. If panel is open, Escape closes panel. If rename edit mode is active, Escape cancels rename (and does NOT also close the panel).

- **The archive confirmation** replaces the action strip momentarily — do not use a modal or toast for this. It should feel lightweight and inline.

- **Toast system:** Create a simple `src/components/app/Toast.tsx` component if one doesn't already exist. It should support: message text, optional type (success/error), auto-dismiss. Position: fixed, bottom-right, z-index 50.

- **No `console.log` statements** in final output.

---

## 14. Acceptance Criteria

Before marking this PRD complete, verify:

- [ ] Page renders inside AppLayout, "My Artefacts" sidebar item is active
- [ ] Page header shows correct artefact count, level count, and last-created time
- [ ] Search bar is sticky — stays visible when scrolling through a long artefacts list
- [ ] Search filters artefacts live (150ms debounce) by name and preview text
- [ ] Clear (×) button appears in search when text is present and clears on click
- [ ] Type filter chips correctly filter the grid (OR logic between selected types)
- [ ] Level filter chips are colour-coded and only appear for levels with artefacts
- [ ] Level filters correctly filter the grid (OR logic between selected levels)
- [ ] Type + level filters combine (AND logic between the two dimensions)
- [ ] "Clear filters" link appears when any filter is active and resets everything
- [ ] Sort cycles correctly through Recent → Oldest → A–Z
- [ ] Artefact cards show: level-coloured left border, type icon, level badge, name, preview, timestamp
- [ ] Card hover: lifts with translateY(-2px) and reveals action strip
- [ ] Action strip: Open, Duplicate, Rename, Archive buttons all work
- [ ] Double-clicking artefact name enters inline edit mode on both card and panel
- [ ] Rename saves on Enter/blur, cancels on Escape, rejects empty values
- [ ] Rename character limit enforced at 80 chars with counter shown above 60
- [ ] Duplicate creates a new artefact with "(copy)" suffix and it appears in the grid
- [ ] Archive shows inline confirmation, then removes card with fade animation
- [ ] Quick-use panel slides in from right (250ms) when "Open" is clicked
- [ ] Panel URL updates to `/app/artefacts/{id}` on open, reverts to `/app/artefacts` on close
- [ ] Direct navigation to `/app/artefacts/{id}` opens the panel for that artefact
- [ ] Panel shows correct content view for each artefact type
- [ ] Prompt content shows full text in monospace, scrollable
- [ ] "Launch in {ToolName}" button navigates to the correct tool route
- [ ] Copy button copies primary content to clipboard and shows "Copied ✓" briefly
- [ ] Previous/Next navigation in panel footer works within filtered subset
- [ ] Position indicator "{n} of {total}" is correct
- [ ] Escape closes panel (but not if rename edit is active — only cancels rename)
- [ ] Empty state (zero artefacts): shows 5 ghost cards and CTA to current level
- [ ] Empty state (filters, no results): shows SearchX icon with clear filters button
- [ ] `content` field is NOT loaded in the list query (verify in Network tab)
- [ ] `content` IS loaded when panel opens (verify in Network tab)
- [ ] `last_opened_at` is updated when panel opens
- [ ] All Supabase queries use RLS (verify other users' artefacts are not accessible)
- [ ] Toast appears for: duplicate success, archive, rename failure
- [ ] Page load stagger animation plays on cards
- [ ] No TypeScript errors on build
- [ ] No console errors in browser
