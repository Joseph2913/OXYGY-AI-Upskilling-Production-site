# PRD 05 — My Toolkit Page
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing), PRD 02 (Dashboard — `src/data/toolkitData.ts`), PRD 03 (My Journey — `LEVEL_META`), PRD 04 (Current Level — level completion logic)  
**This is the final PRD in the learning platform series.**

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRDs 01–04 are complete and passing all acceptance criteria
2. Read `src/data/toolkitData.ts` in full — this file is the single source of truth for all tool definitions. You will extend it in this PRD. Do not duplicate or redefine tool data anywhere.
3. Read `src/data/levelTopics.ts` — specifically `LEVEL_META`, used for level labels and accent colours throughout this page
4. Read `src/context/AppContext.tsx` — `currentLevel` determines which tools are unlocked
5. Read the existing `src/pages/app/AppToolkit.tsx` placeholder — you are replacing its contents entirely
6. Read `src/pages/app/AppCurrentLevel.tsx` from PRD 04 — specifically the level completion screen (Section 12), which links to this page and triggers an unlock animation on arrival

This is the most design-intentional page in the application. Read the full PRD before writing any code. The unlock state system and the tool detail panel (Section 7) are the two most complex pieces — understand both before starting.

---

## 1. Overview

### Purpose
My Toolkit is the learner's **growing arsenal of AI capabilities** — a visual record of every tool they have earned access to through their progression, and a motivating preview of everything still to come. It is simultaneously a functional launcher (clicking an unlocked tool opens it) and a gamified progression map (locked tools sell the aspiration of higher levels).

This page answers: *"What can I do right now, and what will I be able to do when I get further?"*

### Where it sits
Route: `/app/toolkit`  
Sub-routes: `/app/toolkit/{toolId}` — tool detail panel (see Section 7)  
Rendered inside: `AppLayout` (sidebar + top bar from PRD 01)  
"My Toolkit" nav item in the sidebar is active on all `/app/toolkit/*` routes.

### Design philosophy
Tools are rewards. This page should feel like opening a well-designed equipment screen in a game — every unlocked tool has weight and presence, every locked tool creates genuine aspiration. The visual language escalates as you scroll down through levels: Level 1 tools feel approachable and foundational; Level 5 tools feel sophisticated and powerful. The colour-coded level groupings reinforce the progressive complexity of the overall programme.

This is also a **functional page** — unlocked tools must be immediately launchable from here with one click. The page is not a menu; it is a dashboard of capabilities.

---

## 2. Page Layout

### Outer wrapper
```
background: #F7FAFC
padding: 28px 36px
max-width: 1060px
```

### Structure (top to bottom)

```
<PageHeader />              ← Title + progress summary + filter bar
<UnlockBanner />            ← Conditional — shown only on fresh unlock arrival
<LevelGroup level={1} />    ← All Level 1 tools
<LevelGroup level={2} />    ← All Level 2 tools
<LevelGroup level={3} />    ← All Level 3 tools
<LevelGroup level={4} />    ← All Level 4 tools
<LevelGroup level={5} />    ← All Level 5 tools
<ToolDetailPanel />         ← Slide-in panel — shown when a tool is selected
```

Level groups are stacked vertically, gap: 28px between groups.

---

## 3. Page Header

**Container:**
```
margin-bottom: 24px
```

**Title row (flex, space-between, align-items: flex-start):**

Left side:
- Title: "My Toolkit" — font-size: 28px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.4px, margin-bottom: 5px
- Subtitle: "Your growing arsenal of AI capabilities. Tools unlock as you progress through each level." — font-size: 14px, color: `#718096`, line-height: 1.6

Right side — summary pill cluster (flex row, gap: 8px, align-items: center):

Three stat pills:
```
padding: 6px 14px
border-radius: 20px
font-size: 12px
font-weight: 600
border: 1px solid #E2E8F0
background: #FFFFFF
color: #4A5568
```

Pill 1: `"⚡ {unlockedCount} Unlocked"`  
Pill 2: `"🔒 {lockedCount} Locked"`  
Pill 3: `"📦 {totalCount} Total"`

Unlocked pill gets a teal tint when count > 0: `background: #E6FFFA`, `border-color: #38B2AC`, `color: #1A7A76`

**Filter bar (margin-top: 16px):**

```
display: flex
align-items: center
gap: 8px
flex-wrap: wrap
```

Filter buttons — one for "All" and one per level:

Each filter button:
```
padding: 6px 16px
border-radius: 20px
font-size: 12px
font-weight: 600
cursor: pointer
transition: background 0.15s, color 0.15s, border-color 0.15s
```

**Default (inactive) state:**
```
background: #FFFFFF
border: 1px solid #E2E8F0
color: #718096
```

**Active state:**
- "All" button active: `background: #1A202C`, `color: #FFFFFF`, `border-color: #1A202C`
- Level button active: `background: {levelAccentColor}`, `color: {levelAccentDark}`, `border-color: {levelAccentColor}`

Filter button labels:
- "All Tools"
- "Level 1 · Fundamentals"
- "Level 2 · Applied"
- "Level 3 · Systemic"
- "Level 4 · Dashboards"
- "Level 5 · Applications"

**Filter behaviour:**
- Default: "All Tools" active, all level groups visible
- Clicking a level filter: hide all other level groups, show only the selected one
- Clicking the active filter again: deactivates it, returns to "All Tools" view
- Filter state is component state only (not URL param)
- Level groups filter with a subtle fade: `opacity: 0 → 1`, 150ms, on show; `display: none` on hide (no animation on hide, to avoid layout shift)

---

## 4. Unlock Banner

**Shown only when:** the user arrives at this page immediately after completing a level (i.e. navigated here from the level completion screen in PRD 04). Detect this via a URL query param: `/app/toolkit?unlocked={levelNumber}`.

**If `?unlocked={n}` param is present:**
1. Show the banner
2. Remove the query param from the URL immediately (use `history.replaceState` or React Router's `replace`) so a refresh doesn't re-show the banner
3. Auto-dismiss the banner after 6 seconds, or on user click of the dismiss button

**Banner container:**
```
background: linear-gradient(135deg, {levelAccentColor} 0%, {levelAccentColorDarker} 100%)
border-radius: 16px
padding: 24px 28px
margin-bottom: 24px
display: flex
align-items: center
justify-content: space-between
position: relative
overflow: hidden
animation: fadeSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
```

`{levelAccentColorDarker}` — slightly darkened version of the level accent, used as gradient end:
- Level 1 mint: `#7FE0CC`
- Level 2 yellow: `#EDD882`
- Level 3 teal: `#2D9E99`
- Level 4 peach: `#E8956A`
- Level 5 lavender: `#A3B4F0`

**Background decoration (pointer-events: none):**
Two overlapping circles, `position: absolute`, `opacity: 0.2`, `border-radius: 50%`, filled with white:
- Circle 1: `width: 200px, height: 200px, right: -40px, top: -60px`
- Circle 2: `width: 140px, height: 140px, right: 80px, bottom: -70px`

**Left side content:**
- Label: "🔓 New Tools Unlocked" — font-size: 11px, font-weight: 700, color: `{levelAccentDark}`, background: `rgba(255,255,255,0.35)`, padding: 3px 10px, border-radius: 20px, display: inline-block, margin-bottom: 8px
- Heading: `"You've completed Level {n} — here's what you've unlocked"` — font-size: 18px, font-weight: 800, color: `{levelAccentDark}`, letter-spacing: -0.3px, margin-bottom: 4px
- Tool list inline: `"{toolEmoji} {toolName}"` for each newly unlocked tool, separated by `" · "` — font-size: 13px, color: `{levelAccentDark}`, font-weight: 500

**Right side:**
- Dismiss button: Lucide `X` icon (size 18, color `{levelAccentDark}`), `opacity: 0.6`, hover `opacity: 1`, cursor pointer, background none, border none

**Animation:**
```css
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 5. Level Group Component

Each level is rendered as a `LevelGroup` — a labelled section containing all tools for that level.

**File:** `src/components/app/toolkit/LevelGroup.tsx`

### Level group container
```
display: flex
flex-direction: column
gap: 12px
```

### Level group header (flex row, align-items: center, gap: 12px, margin-bottom: 4px)

**Level badge:**
```
width: 32px
height: 32px
border-radius: 8px
background: {levelAccentColor}55
border: 1px solid {levelAccentColor}88
display: flex
align-items: center
justify-content: center
font-size: 13px
font-weight: 800
color: {levelAccentDark}
flex-shrink: 0
```
Content: level number — e.g. "1", "2", etc.

**Level label:**
- Line 1: `"Level {n} · {LevelShortName}"` — font-size: 14px, font-weight: 700, color: `#1A202C`
- Line 2 (if level is locked): `"Complete Level {n-1} to unlock"` — font-size: 12px, color: `#A0AEC0`
- Line 2 (if level is active/unlocked): `"{toolCount} tools"` — font-size: 12px, color: `#718096`

**Lock state badge (right side, if entire level is locked):**
```
margin-left: auto
padding: 3px 12px
border-radius: 20px
background: #F7FAFC
border: 1px solid #E2E8F0
font-size: 11px
font-weight: 600
color: #A0AEC0
```
Text: "🔒 Locked"

**Unlocked badge (right side, if level is complete or active):**
Same pill shape but: `background: {levelAccentColor}22`, `border-color: {levelAccentColor}88`, `color: {levelAccentDark}`, text: "✓ Unlocked" or "● Active" (active = current level)

### Tool grid

Tools within each level group are displayed in a **2-column grid**:
```
display: grid
grid-template-columns: 1fr 1fr
gap: 12px
```

Each tool is rendered as a `ToolCard` component (Section 6).

---

## 6. Tool Card Component

**File:** `src/components/app/toolkit/ToolCard.tsx`

This is the primary interactive element of the page. Every tool across all five levels is a `ToolCard`. The card has three visual states: **unlocked**, **in-progress** (current level, not yet fully accessible — completes when user finishes the level), and **locked**.

### Card container
```
border-radius: 14px
border: 1px solid {cardBorder}
border-left: 4px solid {cardLeftBorder}
background: {cardBg}
padding: 20px 22px
cursor: {cardCursor}
transition: border-color 0.15s, transform 0.15s
display: flex
flex-direction: column
gap: 14px
position: relative
overflow: hidden
```

**State: unlocked**
```
cardBorder: {levelAccentColor}88
cardLeftBorder: {levelAccentColor}
cardBg: {levelAccentColor}10
cardCursor: pointer
```
Hover: `border-color: {levelAccentColor}`, `transform: translateY(-1px)`

**State: in-progress**
```
cardBorder: #E2E8F0
cardLeftBorder: {levelAccentColor}66
cardBg: #FFFFFF
cardCursor: pointer   ← still clickable — shows detail panel with "coming soon" state
```
Hover: `border-color: #CBD5E0`, `transform: translateY(-1px)`

**State: locked**
```
cardBorder: #E2E8F0
cardLeftBorder: #E2E8F0
cardBg: #FFFFFF
cardCursor: pointer   ← still clickable — shows detail panel with full aspirational content
opacity: 0.65
```
Hover: `opacity: 0.85` (no transform — muted hover)

### Card interior — Row 1: Tool header (flex row, space-between, align-items: flex-start)

**Left: Icon + name block (flex row, gap: 12px, align-items: center):**

Icon container:
```
width: 44px
height: 44px
border-radius: 11px
flex-shrink: 0
display: flex
align-items: center
justify-content: center
```
- Unlocked/in-progress: `background: {levelAccentColor}55`, emoji font-size: 22px
- Locked: `background: #F0F0F0`, Lucide `Lock` icon (size 18, color `#CBD5E0`)

Name block:
- Tool name: font-size: 15px, font-weight: 700, color: `#1A202C` (unlocked/in-progress) or `#A0AEC0` (locked), letter-spacing: -0.2px
- Level label below: `"Level {n} · {LevelShortName}"` — font-size: 11px, color: `{levelAccentDark}` (unlocked) or `#A0AEC0` (locked), font-weight: 500

**Right: Status badge:**

Unlocked:
```
background: {levelAccentColor}44
color: {levelAccentDark}
border: 1px solid {levelAccentColor}88
border-radius: 20px
padding: 3px 10px
font-size: 10px
font-weight: 700
letter-spacing: 0.04em
text-transform: uppercase
```
Text: "Unlocked"

In-progress:
```
background: transparent
color: {levelAccentDark}
border: 1px solid {levelAccentColor}66
```
Text: "In Progress"

Locked:
```
background: #F7FAFC
color: #A0AEC0
border: 1px solid #E2E8F0
```
Text: `"Level {n}"`

### Card interior — Row 2: Description

- Font-size: 13px, color: `#718096` (unlocked/in-progress) or `#A0AEC0` (locked)
- Line-height: 1.6
- Display full description from `toolkitData.ts` (not truncated — full description, as per the "full description" decision)

### Card interior — Row 3: Footer (flex row, space-between, align-items: center)

**Left: Action link or unlock condition:**

Unlocked:
- "Open tool →" — font-size: 12px, font-weight: 700, color: `{levelAccentDark}`, flex row with Lucide `ArrowRight` (size 12)
- This is a visual affordance only — the entire card is clickable

In-progress:
- `"Unlocks when you complete Level {n}"` — font-size: 12px, color: `{levelAccentDark}`, font-weight: 500

Locked:
- `"Requires Level {n}"` — font-size: 12px, color: `#A0AEC0`

**Right: Tool type chip:**
```
background: #F7FAFC
border: 1px solid #E2E8F0
border-radius: 6px
padding: 2px 8px
font-size: 10px
font-weight: 600
color: #718096
text-transform: uppercase
letter-spacing: 0.05em
```
Tool type label (defined in data — see Section 10): "Sandbox" / "Library" / "Builder" / "Canvas" / "Designer" / "Engine"

### On click (all states)
- Clicking any card opens the `<ToolDetailPanel />` (Section 7) for that tool
- Update URL to `/app/toolkit/{toolId}` using React Router (no full page reload)
- The card gets a subtle active ring: `box-shadow: 0 0 0 2px {levelAccentColor}`

---

## 7. Tool Detail Panel

When a tool card is clicked, a **slide-in panel** appears from the right edge of the page. This is not a modal — it overlays the right portion of the page without a backdrop, keeping the tool grid partially visible.

**Panel container:**
```
position: fixed
top: 54px              ← below the app top bar
right: 0
bottom: 0
width: 420px
background: #FFFFFF
border-left: 1px solid #E2E8F0
z-index: 20
overflow-y: auto
transform: translateX(100%)   ← closed state
transform: translateX(0)      ← open state
transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)
```

The panel slides in from the right. The page content behind it does not move or dim — the panel sits on top. On desktop (>1060px wide) this works cleanly; on narrower screens the panel covers more of the grid, which is acceptable for now.

**Close behaviour:**
- Clicking the × button in the panel header
- Pressing Escape key
- On close: `transform: translateX(100%)`, then after 250ms, reset URL to `/app/toolkit` and clear selected tool state

### Panel — Header (sticky at top of panel)

```
position: sticky
top: 0
background: #FFFFFF
z-index: 2
padding: 20px 24px 16px
border-bottom: 1px solid #E2E8F0
display: flex
align-items: flex-start
justify-content: space-between
```

**Left: Tool identity block:**
- Icon (same as card icon, but larger): 48×48px, border-radius: 12px, background `{levelAccentColor}55`, emoji font-size: 24px (or padlock for locked)
- Tool name: font-size: 18px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.3px, margin-top: 10px
- Level + type: `"Level {n} · {LevelShortName} · {ToolType}"` — font-size: 12px, color: `#718096`, margin-top: 3px

**Right: Close button:**
- Lucide `X` icon (size 18, color `#718096`)
- Background: none, border: none, cursor: pointer, padding: 4px
- Hover: color `#1A202C`

### Panel — Status section (below header, not sticky)

**Unlocked state:**
```
background: {levelAccentColor}12
border-bottom: 1px solid {levelAccentColor}33
padding: 16px 24px
display: flex
align-items: center
justify-content: space-between
```
- Left: Status pill — same "Unlocked" pill style as card
- Right: **"Open Tool →"** button — background `#38B2AC`, color white, border-radius 24px, padding 10px 20px, font-size 13px, font-weight 700, on click: navigate to tool route (e.g. `/app/toolkit/prompt-playground`)

**In-progress state:**
```
background: {levelAccentColor}08
border-bottom: 1px solid #E2E8F0
padding: 16px 24px
```
- Status pill: "In Progress" style
- Progress description: `"Complete Level {n} to unlock this tool. You're currently on Level {currentLevel}."` — font-size 13px, color `#4A5568`, margin-top 8px
- Mini level progress bar (same style as left panel in PRD 04) showing current progress through the level

**Locked state:**
```
background: #F7FAFC
border-bottom: 1px solid #E2E8F0
padding: 16px 24px
```
- Status pill: "Locked" style
- Lock description: `"This tool unlocks when you complete Level {n-1}. Keep progressing to earn access."` — font-size 13px, color `#A0AEC0`, margin-top 8px

### Panel — Body content (padding: 24px)

**Section: About this tool**
- Section label: "About" — font-size: 11px, font-weight: 700, color: `#718096`, text-transform: uppercase, letter-spacing: 0.08em, margin-bottom: 8px
- Full description: font-size: 14px, color: `#4A5568`, line-height: 1.7, margin-bottom: 20px

**Section: What you can do with it**
- Section label: "What You Can Do"
- A bulleted list of 3–4 capabilities (see Section 10 — Content Data)
- Each bullet: Lucide `Check` icon (size 13, color `{levelAccentDark}`) + text, font-size: 13px, color: `#4A5568`, line-height: 1.6
- Gap between bullets: 8px
- Margin-bottom: 20px

**Section: Unlocked at (visual level marker)**

```
background: {levelAccentColor}10
border-radius: 10px
padding: 14px 16px
margin-bottom: 20px
display: flex
align-items: center
gap: 12px
```

- Level badge circle: 32×32px, background `{levelAccentColor}55`, level number centered (font-size 13px, font-weight 800, color `{levelAccentDark}`)
- Text block:
  - Line 1: `"Unlocked at Level {n}"` — font-size 13px, font-weight 700, color `#1A202C`
  - Line 2: `"{LevelName}"` — font-size 12px, color `#718096`

**Section: Related tools (only shown for unlocked tools)**

```
border-top: 1px solid #E2E8F0
padding-top: 16px
margin-top: 4px
```

- Section label: "Related Tools"
- Show 2 other tools from the same level (not the current tool), as compact horizontal chips:
  ```
  display: inline-flex
  align-items: center
  gap: 6px
  padding: 6px 12px
  border-radius: 20px
  border: 1px solid #E2E8F0
  background: #F7FAFC
  cursor: pointer
  font-size: 12px
  font-weight: 500
  color: #4A5568
  margin-right: 8px
  ```
  Clicking a related tool chip switches the panel to that tool's detail (no close/reopen — just swap content).

---

## 8. Extended Tool Data

The `src/data/toolkitData.ts` file from PRD 02 must be extended. Add the following fields to the `Tool` interface and populate them for all tools:

```typescript
// Extended Tool interface — add to existing interface in toolkitData.ts

export interface Tool {
  id: string;
  name: string;
  icon: string;
  levelRequired: number;
  levelName: string;
  description: string;        // already exists
  route: string;
  accentColor: string;
  accentDark: string;
  toolType: string;           // NEW — "Sandbox" | "Library" | "Builder" | "Canvas" | "Designer" | "Engine"
  capabilities: string[];     // NEW — 3–4 bullet points for the detail panel
}
```

### Complete tool data (all 12 tools across 5 levels)

Replace the existing `ALL_TOOLS` array in `toolkitData.ts` with this complete definition:

```typescript
export const ALL_TOOLS: Tool[] = [
  // ── LEVEL 1 ──────────────────────────────────────────────────────
  {
    id: "prompt-playground",
    name: "Prompt Playground",
    icon: "⚡",
    levelRequired: 1,
    levelName: "Fundamentals",
    toolType: "Sandbox",
    description: "A live sandbox to write, test, and refine prompts. Experiment with different structures, tones, and constraints — and see real AI responses instantly.",
    capabilities: [
      "Write and test prompts with immediate AI feedback",
      "Compare different prompt structures side by side",
      "Save your best prompts directly to your Prompt Library",
      "Experiment with system prompts and user messages",
    ],
    route: "/app/toolkit/prompt-playground",
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
  },
  {
    id: "prompt-library",
    name: "Prompt Library",
    icon: "📚",
    levelRequired: 1,
    levelName: "Fundamentals",
    toolType: "Library",
    description: "Your personal collection of saved, tagged, and organised prompts. Build a reusable bank of your best work — organised by use case, function, and topic — that grows with your career.",
    capabilities: [
      "Save prompts from the Playground with one click",
      "Tag and categorise prompts by use case or workflow",
      "Search and retrieve prompts instantly by keyword",
      "Share prompts with your team's shared library",
    ],
    route: "/app/toolkit/prompt-library",
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
  },

  // ── LEVEL 2 ──────────────────────────────────────────────────────
  {
    id: "agent-builder",
    name: "Agent Builder",
    icon: "🤖",
    levelRequired: 2,
    levelName: "Applied Capability",
    toolType: "Builder",
    description: "Design and configure custom AI agents with system prompts, personas, instructions, and role definitions. Build intelligent assistants tailored to your specific workflows — then share them across your team.",
    capabilities: [
      "Configure system prompts and agent personas",
      "Set constraints, tone, and response formats",
      "Test your agent in a live conversation interface",
      "Export agent configurations as reusable templates",
    ],
    route: "/app/toolkit/agent-builder",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },
  {
    id: "template-library",
    name: "Template Library",
    icon: "🗂️",
    levelRequired: 2,
    levelName: "Applied Capability",
    toolType: "Library",
    description: "A shared library of agent templates and prompt blueprints built by you and your team. Start from a proven foundation rather than from scratch — and contribute your own templates for others to build on.",
    capabilities: [
      "Browse and fork templates created by your cohort",
      "Publish your own agent configurations as templates",
      "Filter templates by role, use case, or level",
      "Version and update templates as your approach evolves",
    ],
    route: "/app/toolkit/template-library",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },

  // ── LEVEL 3 ──────────────────────────────────────────────────────
  {
    id: "workflow-canvas",
    name: "Workflow Canvas",
    icon: "🔗",
    levelRequired: 3,
    levelName: "Systemic Integration",
    toolType: "Canvas",
    description: "Map end-to-end automated AI pipelines visually. Chain agents, define data inputs and outputs, and design human-in-the-loop checkpoints — before you build anything in Make, Zapier, or n8n.",
    capabilities: [
      "Drag-and-drop workflow mapping with AI agent nodes",
      "Define triggers, conditions, and branching logic",
      "Mark human review checkpoints with rationale trails",
      "Export workflow diagrams as documentation",
    ],
    route: "/app/toolkit/workflow-canvas",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },
  {
    id: "integration-sandbox",
    name: "Integration Sandbox",
    icon: "🧪",
    levelRequired: 3,
    levelName: "Systemic Integration",
    toolType: "Sandbox",
    description: "Connect AI to real data sources and test automated pipelines in a safe, sandboxed environment. Validate your Workflow Canvas designs before deploying them to production tools.",
    capabilities: [
      "Test API connections to Make, Zapier, and n8n",
      "Run end-to-end workflow simulations with sample data",
      "Inspect AI agent inputs and outputs at each step",
      "Debug and iterate on automation logic safely",
    ],
    route: "/app/toolkit/integration-sandbox",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },

  // ── LEVEL 4 ──────────────────────────────────────────────────────
  {
    id: "dashboard-designer",
    name: "Dashboard Designer",
    icon: "📊",
    levelRequired: 4,
    levelName: "Interactive Dashboards",
    toolType: "Designer",
    description: "Prototype interactive dashboards that surface AI-processed outputs in designed, user-specific interfaces. Work backwards from your end user — define what they need to see, then build the experience around that.",
    capabilities: [
      "Drag-and-drop dashboard component builder",
      "Connect dashboard panels directly to AI workflow outputs",
      "Configure role-based views for different user types",
      "Export prototypes as specs for development handoff",
    ],
    route: "/app/toolkit/dashboard-designer",
    accentColor: "#F5B8A0",
    accentDark: "#8C3A1A",
  },
  {
    id: "journey-mapper",
    name: "User Journey Mapper",
    icon: "🗺️",
    levelRequired: 4,
    levelName: "Interactive Dashboards",
    toolType: "Designer",
    description: "Map the complete experience of your dashboard's end users — from the moment they open the interface to the decisions they make with the data they see. Design with empathy before you build.",
    capabilities: [
      "Map multi-step user journeys with decision points",
      "Define user goals, pain points, and success states",
      "Annotate touchpoints with AI-powered moments",
      "Link journey maps directly to dashboard component specs",
    ],
    route: "/app/toolkit/journey-mapper",
    accentColor: "#F5B8A0",
    accentDark: "#8C3A1A",
  },

  // ── LEVEL 5 ──────────────────────────────────────────────────────
  {
    id: "app-builder",
    name: "App Builder",
    icon: "🚀",
    levelRequired: 5,
    levelName: "AI-Powered Applications",
    toolType: "Builder",
    description: "Scope, design, and prototype complete AI-powered applications with individual user accounts, role-based journeys, and personalised experiences. The full stack — from architecture to user interface — in one environment.",
    capabilities: [
      "Define application architecture with AI-aware components",
      "Configure user account structures and role hierarchies",
      "Design personalised journeys for different user types",
      "Generate a full product spec ready for development",
    ],
    route: "/app/toolkit/app-builder",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
  {
    id: "personalisation-engine",
    name: "Personalisation Engine",
    icon: "🎯",
    levelRequired: 5,
    levelName: "AI-Powered Applications",
    toolType: "Engine",
    description: "Configure AI systems that adapt their outputs to individual users — based on their role, history, preferences, and behaviour. Build applications where every user gets exactly what they need, automatically.",
    capabilities: [
      "Define personalisation rules based on user attributes",
      "Configure AI outputs that adapt per-user context",
      "Test personalisation logic across different user profiles",
      "Monitor and audit personalisation decisions for fairness",
    ],
    route: "/app/toolkit/personalisation-engine",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
  {
    id: "second-brain",
    name: "Second Brain",
    icon: "🧠",
    levelRequired: 5,
    levelName: "AI-Powered Applications",
    toolType: "Engine",
    description: "An AI-powered personal knowledge base that processes your notes, documents, videos, and transcripts into a structured, searchable, and connectable intelligence layer. Your thinking, organised and amplified.",
    capabilities: [
      "Ingest notes, PDFs, videos, and meeting transcripts",
      "AI extracts entities, themes, and connections automatically",
      "Search your knowledge base with natural language queries",
      "Surface relevant context as you work on new tasks",
    ],
    route: "/app/toolkit/second-brain",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
  {
    id: "impact-tracker",
    name: "Impact Tracker",
    icon: "📈",
    levelRequired: 5,
    levelName: "AI-Powered Applications",
    toolType: "Engine",
    description: "Measure the real-world impact of AI adoption across your team and organisation. Track time saved, quality improvements, innovation pipeline metrics, and capability gains — with AI-powered analysis of the data.",
    capabilities: [
      "Define and track AI adoption metrics across your team",
      "Capture time-saved and quality improvement data points",
      "Generate AI-powered impact reports for leadership",
      "Benchmark your team's progress against programme targets",
    ],
    route: "/app/toolkit/impact-tracker",
    accentColor: "#C3D0F5",
    accentDark: "#2E3F8F",
  },
];

// Dashboard preview — first 5 tools (unchanged from PRD 02)
export const DASHBOARD_TOOLS = ALL_TOOLS.slice(0, 5);
```

---

## 9. Unlock State Logic

Tool unlock state is derived entirely client-side from `AppContext.currentLevel`. No separate Supabase query needed.

```typescript
function getToolState(tool: Tool, currentLevel: number): 'unlocked' | 'in-progress' | 'locked' {
  if (tool.levelRequired < currentLevel) return 'unlocked';
  if (tool.levelRequired === currentLevel) return 'in-progress';
  return 'locked';
}
```

**Important clarification from PRD 02:** Level 1 tools are always `'unlocked'` for users on Level 1 (not `'in-progress'`). The `in-progress` state applies only to the current level when `levelRequired === currentLevel` AND `currentLevel > 1`. Revise the logic:

```typescript
function getToolState(tool: Tool, currentLevel: number): 'unlocked' | 'in-progress' | 'locked' {
  if (tool.levelRequired < currentLevel) return 'unlocked';
  if (tool.levelRequired === currentLevel && currentLevel === 1) return 'unlocked'; // L1 starts unlocked
  if (tool.levelRequired === currentLevel) return 'in-progress';
  return 'locked';
}
```

**Unlock counts for header pills:**
```typescript
const unlockedCount = ALL_TOOLS.filter(t => getToolState(t, currentLevel) === 'unlocked').length;
const inProgressCount = ALL_TOOLS.filter(t => getToolState(t, currentLevel) === 'in-progress').length;
const lockedCount = ALL_TOOLS.filter(t => getToolState(t, currentLevel) === 'locked').length;
const totalCount = ALL_TOOLS.length; // 12
```

Header shows `unlockedCount + inProgressCount` combined as "Unlocked" (in-progress tools are treated as accessible for display purposes in the summary).

---

## 10. Interactions & Animations

### Page load
Stagger level groups into view on mount:
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
- Page header: delay 0ms
- Level Group 1: delay 60ms
- Level Group 2: delay 120ms
- Level Group 3: delay 180ms
- Level Group 4: delay 240ms
- Level Group 5: delay 300ms

All: duration 0.3s, ease, `animation-fill-mode: both`

### Tool card hover
- Unlocked/in-progress: `transform: translateY(-1px)` + `border-color` transition — 150ms
- Locked: opacity lift only (no transform)

### Tool card click
- Instant active ring: `box-shadow: 0 0 0 2px {levelAccentColor}`
- Detail panel slides in from right: 250ms cubic-bezier

### Detail panel close
- Panel slides out: `transform: translateX(100%)`, 250ms
- Active ring on card clears after 250ms

### Filter bar
- Level group show: `opacity: 0 → 1`, 150ms ease, `display: none → block` (set display before starting opacity)
- Level group hide: instant `display: none` (no animation — prevents layout shift)

### Unlock banner
- Enter: `fadeSlideDown` 0.4s spring
- Auto-dismiss after 6 seconds: fade out `opacity: 1 → 0`, 300ms
- Manual dismiss (× click): same fade out

### Escape key
- If detail panel is open: close panel (same as × button)
- If detail panel is closed: do nothing

---

## 11. Responsive Behaviour

Desktop (1200px+): 2-column tool grid, 420px detail panel.

Below 1024px:
- Tool grid collapses to 1-column
- Detail panel width increases to 360px (still right-anchored)

Below 768px (tablet/mobile — basic support only):
- Detail panel goes full-width (100vw), slides up from bottom instead of from right:
  ```
  bottom: 0
  left: 0
  right: 0
  width: 100%
  height: 75vh
  transform: translateY(100%)   ← closed
  transform: translateY(0)      ← open
  border-radius: 16px 16px 0 0
  border-top: 1px solid #E2E8F0
  border-left: none
  ```

---

## 12. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       └── toolkit/
│           ├── LevelGroup.tsx          ← level section with header + tool grid
│           ├── ToolCard.tsx            ← individual tool card (all 3 states)
│           └── ToolDetailPanel.tsx     ← slide-in detail panel
```

Existing files to modify:
- `src/data/toolkitData.ts` — extend `Tool` interface, replace `ALL_TOOLS` with complete 12-tool definition
- `src/pages/app/AppToolkit.tsx` — replace placeholder with full implementation

---

## 13. Developer Notes

- **`toolkitData.ts` is modified, not replaced.** The `DASHBOARD_TOOLS` export must remain as `ALL_TOOLS.slice(0, 5)` — the Dashboard in PRD 02 imports this. Confirm the Dashboard still renders correctly after extending the tool definitions.

- **The detail panel is `position: fixed`**, not `position: absolute`. It anchors to the viewport, not the page content. This means it stays in place when the page scrolls — intentional.

- **URL management for the detail panel:** On panel open, push `/app/toolkit/{toolId}` to the browser history. On panel close, replace with `/app/toolkit`. This allows back-button to close the panel (if the user pressed back, navigate to `/app/toolkit` and close the panel). Use React Router's `useNavigate` with `replace: true` on close to avoid polluting history.

- **The unlock banner's `?unlocked={n}` param** must be removed from the URL immediately after reading it (use `replace` in React Router — do not push a new history entry). A hard refresh after visiting from the level completion screen should not re-show the banner.

- **The newly unlocked tools shown in the unlock banner** are derived from `ALL_TOOLS.filter(t => t.levelRequired === unlockedLevel)` — the tools for the level just completed.

- **Related tools in the detail panel** — find 2 tools where `tool.levelRequired === selectedTool.levelRequired && tool.id !== selectedTool.id`. If only 1 other tool exists at that level, show 1. If none (impossible given current data), hide the section.

- **Escape key listener** — add and remove with `useEffect` cleanup. Do not leave a global event listener attached after unmount.

- **No Supabase queries on this page.** Everything is derived from `AppContext.currentLevel` and the static `toolkitData.ts`. The page load is instantaneous with no loading state needed.

- **Tool routes for currently unbuilt tools** (Integration Sandbox, Dashboard Designer, Journey Mapper, App Builder, Personalisation Engine, Second Brain, Impact Tracker) — these tools do not have real pages yet. When "Open Tool →" is clicked for these, show a toast notification: `"{toolName} is coming soon. You'll be the first to know when it launches."` — do not navigate anywhere. Only Prompt Playground, Prompt Library, Agent Builder (if built), and Workflow Canvas (if built as the existing Workflow Designer) navigate to real pages.

- **The tool type chips** ("Sandbox", "Library", "Builder", etc.) are purely decorative labels — they add visual variety and help learners understand the nature of each tool without requiring explanation.

- **No `console.log` statements** in final output.

---

## 14. Acceptance Criteria

Before marking this PRD complete, verify:

- [ ] Page renders correctly inside AppLayout, "My Toolkit" sidebar item is active
- [ ] All 12 tools render across 5 level groups in a 2-column grid
- [ ] Header summary pills show correct unlocked / locked / total counts
- [ ] Filter bar correctly shows/hides level groups when filter buttons are clicked
- [ ] Active filter button has correct visual state (navy for "All", level accent for specific levels)
- [ ] Clicking a filter again deactivates it and returns to "All Tools" view
- [ ] Tool card states (unlocked / in-progress / locked) are correctly derived from `currentLevel`
- [ ] Unlocked cards have correct accent-tinted background and left border
- [ ] Locked cards have reduced opacity (0.65) and padlock icon in place of emoji
- [ ] Hovering unlocked cards lifts them with `translateY(-1px)`
- [ ] Clicking any tool card opens the detail panel and updates URL to `/app/toolkit/{toolId}`
- [ ] Detail panel slides in from right with 250ms cubic-bezier transition
- [ ] Detail panel shows correct content for unlocked, in-progress, and locked states
- [ ] "Open Tool →" button in detail panel navigates to the tool's route (or shows toast for unbuilt tools)
- [ ] Related tools chips in detail panel switch panel content without closing/reopening
- [ ] Pressing Escape closes the detail panel
- [ ] Back button closes the detail panel (URL returns to `/app/toolkit`)
- [ ] Unlock banner appears when `?unlocked={n}` query param is present
- [ ] Unlock banner shows correct level name and newly unlocked tool names
- [ ] Unlock banner removes query param from URL immediately (no re-show on refresh)
- [ ] Unlock banner auto-dismisses after 6 seconds
- [ ] × button manually dismisses the banner
- [ ] Page load stagger animation plays correctly (6 elements, 60ms apart)
- [ ] On mobile (<768px), detail panel slides up from bottom as a sheet
- [ ] `DASHBOARD_TOOLS` export still works correctly in Dashboard (no regression)
- [ ] No Supabase queries fired on this page (check Network tab)
- [ ] No TypeScript errors on build
- [ ] No console errors in browser
