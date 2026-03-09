# PRD 02 — Dashboard Page
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing) — must be complete and passing all acceptance criteria before starting this PRD  
**Followed by:** PRD 03 — My Journey Page

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRD 01 is complete — `AppLayout`, `AppSidebar`, `AppTopBar`, and `AppAuthGuard` all exist and are working
2. Read `src/context/AppContext.tsx` to understand what user data is already available (fullName, currentLevel, streakDays)
3. Read the existing Supabase schema — specifically the `progress`, `learning_plans`, and `profiles` tables — so you know what columns exist before writing queries
4. Read the existing `src/pages/app/AppDashboard.tsx` placeholder — you are replacing its contents entirely, not creating a new file

This PRD replaces the placeholder `AppDashboard.tsx` with the full dashboard implementation. Do not create a new file — edit the existing one.

---

## 1. Overview

### Purpose
The Dashboard is the first screen a user sees after logging in. Its single job is to eliminate decision fatigue — the user should know exactly where they are, what to do next, and feel motivated by their progress, without navigating anywhere else.

### Where it sits
Route: `/app/dashboard`  
Rendered inside: `AppLayout` (sidebar + top bar from PRD 01)  
The `AppDashboard` component renders only the page content area — it does not re-render the shell.

### Target audience
All authenticated learners, at any level (1–5). The page is fully data-driven — every element adapts to the user's current level and progress state.

### Key design principle
**No decoration for its own sake.** Every element on this page must answer one of three questions: Where am I? What do I do next? How am I doing? If a component can't answer one of these, it doesn't belong here.

---

## 2. Page Layout

The content area (inside AppLayout, right of the sidebar) has a sticky top bar (54px, from PRD 01). Below that, the dashboard content renders in a scrollable column.

### Outer wrapper
```
background: #F7FAFC
padding: 28px 36px
max-width: 1060px  ← content does not stretch beyond this
```

The page is divided into three horizontal bands, stacked vertically with 18px gap between each:

| Band | Name | Purpose |
|---|---|---|
| Band 1 | Hero Strip | Identity, greeting, level status, progress ring |
| Band 2 | Action Row | Resume card + Streak + Cohort Pulse |
| Band 3 | Working Row | Level Topics + My Toolkit preview |

---

## 3. Band 1 — Hero Strip

### Container
```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 26px 30px
display: flex
align-items: center
justify-content: space-between
position: relative
overflow: hidden
```

### Background decoration (purely cosmetic, pointer-events: none)
Two soft radial blobs — do not use images or SVGs, use `position: absolute` divs:
- Blob 1: `right: 180px, top: -50px`, `width: 220px, height: 220px`, `border-radius: 50%`, `background: rgba(247, 232, 164, 0.14)` (yellow, very faint)
- Blob 2: `right: 60px, bottom: -60px`, `width: 160px, height: 160px`, `border-radius: 50%`, `background: rgba(56, 178, 172, 0.07)` (teal, very faint)

These must sit behind all text content (`z-index: 0` on blobs, `position: relative, z-index: 1` on content).

### Left side — Greeting & status

**Greeting line:**
- Text: `"Good morning"` / `"Good afternoon"` / `"Good evening"` — determined by browser local time (before 12:00 = morning, 12:00–17:00 = afternoon, 17:00+ = evening)
- Font-size: 13px, color: `#718096`, font-weight: 500, margin-bottom: 3px

**Name line:**
- Text: user's first name + a period — e.g. `"Joseph."`
- Pull first name from `AppContext` (`fullName.split(' ')[0]`)
- Font-size: 30px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.5px, line-height: 1.1, margin-bottom: 10px

**Status line:**
- Line 1: `"You're on Level {n} · {LevelFullName}."` — bold navy for the level string, regular gray for surrounding text
- Line 2: `"{x} topics completed — {y} remaining before Level {n+1} unlocks."`
- If user is on Level 5 (final level): Line 2 = `"{x} topics completed — {y} remaining to complete the programme."`
- Font-size: 14px, color: `#4A5568`, line-height: 1.7
- Level name bold span: font-weight: 700, color: `#1A202C`

**Level full names:**
- 1 → "AI Fundamentals & Awareness"
- 2 → "Applied Capability"
- 3 → "Systemic Integration"
- 4 → "Interactive Dashboards"
- 5 → "AI-Powered Applications"

### Right side — Progress ring

**Container:** flex row, align-items: center, gap: 18px

**Label block (text-align: right):**
- Line 1: "Level Progress" — font-size: 10px, font-weight: 600, color: `#718096`, text-transform: uppercase, letter-spacing: 0.08em, margin-bottom: 3px
- Line 2: `{LevelShortName}` — font-size: 13px, font-weight: 700, color: `#1A202C`

**Progress ring (SVG):**
- Outer size: 96×96px
- Stroke width: 8px
- Radius: `(96 - 8*2) / 2 = 40`
- Track circle: `stroke: {levelAccentColor}44` (level accent at 27% opacity)
- Progress arc: `stroke: #1A202C` (dark navy)
- Start position: rotate SVG -90deg so arc starts at top
- `stroke-dasharray`: `(completedTopics / totalTopics * 2π * 40)` px filled, remainder empty
- `stroke-linecap: round`
- Center label (absolute positioned over SVG):
  - Line 1: percentage — `Math.round(completedTopics / totalTopics * 100) + "%"` — font-size: 20px, font-weight: 800, color: `#1A202C`
  - Line 2: `"{completed} / {total}"` — font-size: 11px, color: `#718096`, margin-top: 2px

**Level accent colours (for ring track):**
- Level 1: `#A8F0E0` (mint)
- Level 2: `#F7E8A4` (yellow)
- Level 3: `#38B2AC` (teal)
- Level 4: `#F5B8A0` (peach)
- Level 5: `#C3D0F5` (lavender)

---

## 4. Band 2 — Action Row

### Grid
```
display: grid
grid-template-columns: 1fr 1fr 1fr
gap: 16px
```

The "Continue Learning" card spans columns 1–2. The right column contains two stacked cards.

---

### Card 2a — Continue Learning (spans 2 columns)

**Container:**
```
grid-column: 1 / 3
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
border-left: 4px solid {levelAccentColor}
padding: 22px 26px
display: flex
flex-direction: column
gap: 14px
```

Level accent colour for the left border uses the same colour map as the progress ring above.

**Sub-section A — Header:**

Level badge pill:
- Background: `{levelAccentColor}55` (33% opacity)
- Color: `{levelAccentDarkColor}` (see dark colour map below)
- Text: `"LEVEL {n}"` — font-size: 11px, font-weight: 700, letter-spacing: 0.04em, padding: 3px 10px, border-radius: 20px

Topic counter (next to badge):
- Text: `"Topic {activeTopic} of {totalTopics}"` — font-size: 12px, color: `#718096`

Topic title:
- Text: current active topic name (pull from data — see Section 9)
- Font-size: 18px, font-weight: 700, color: `#1A202C`, letter-spacing: -0.3px, margin-bottom: 4px

Topic description:
- One-line description of the active topic (pull from data)
- Font-size: 13px, color: `#718096`

**Sub-section B — Slide progress:**

Label row (flex, space-between):
- Left: `"Slide {currentSlide} of {totalSlides}"` — font-size: 12px, color: `#718096`, font-weight: 500
- Right: `"Phase {n} · {PhaseName}"` — font-size: 12px, color: `#718096`
- Phase names: 1 = E-Learning, 2 = Read, 3 = Watch

Progress bar:
- Height: 4px, background: `#E2E8F0`, border-radius: 4px, overflow: hidden
- Inner fill: `width: {currentSlide/totalSlides * 100}%`, background: `#1A202C`, border-radius: 4px

**Sub-section C — CTA row (flex, space-between, align-items: center):**

Resume button:
- Background: `#38B2AC`, color: `#FFFFFF`
- Border: none, border-radius: 24px
- Padding: 10px 22px
- Font-size: 14px, font-weight: 600, font-family: inherit
- Display: flex, align-items: center, gap: 7px
- Icon: right arrow (Lucide `ArrowRight`, size 14)
- Hover: background `#2D9E99`
- On click: navigate to `/app/level` (Current Level page — PRD 04)
- Transition: background 0.15s

Last activity line:
- Text: `"Last activity: {timeAgo}"` — e.g. "2 hours ago", "Yesterday", "3 days ago"
- Font-size: 12px, color: `#718096`
- Calculate from `sessions` table `created_at` of the most recent session for this user

**Level accent dark colours (for badge text):**
- Level 1: `#1A6B5F`
- Level 2: `#8A6A00`
- Level 3: `#1A7A76`
- Level 4: `#8C3A1A`
- Level 5: `#2E3F8F`

---

### Card 2b — Streak (right column, top)

**Container:**
```
flex: 1
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 18px 20px
```

**Section label:**
"THIS WEEK" — font-size: 10px, font-weight: 600, color: `#718096`, text-transform: uppercase, letter-spacing: 0.08em, margin-bottom: 8px

**Streak count:**
- Number: `streakDays` from AppContext — font-size: 34px, font-weight: 800, color: `#1A202C`, line-height: 1
- Label: "day streak" — font-size: 13px, color: `#718096`, margin-left: 4px, aligned to baseline
- Both on one line (flex row, align-items: baseline)
- Margin-bottom: 11px

**Day dots row:**
- 7 dots, one per day of the current week (Mon–Sun)
- Each dot: 20×20px circle, flex column (dot + label below)
- Gap between dots: 4px
- Dot states:
  - Past active day (streak): background `#1A202C`, white checkmark icon (Lucide `Check`, size 9) centered
  - Today (if active): background `#38B2AC`, white checkmark icon
  - Today (if not yet active): background `#E2E8F0`, no icon
  - Future day: background `#E2E8F0`, no icon
- Day label below each dot: 1-letter abbreviation (M T W T F S S), font-size: 9px, color: `#718096`
- Determine "today" from `new Date().getDay()` (0=Sun, adjust to Mon=0 for display)

**Motivational line:**
- Text: "Keep it consistent." — font-size: 12px, color: `#718096`, margin-top: 8px

**If streakDays is 0:**
- Hide streak count, show instead: "Start your streak today." — font-size: 13px, color: `#718096`

---

### Card 2c — Cohort Pulse (right column, bottom)

**Container:**
```
flex: 1
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 18px 20px
```

**Section label:**
"COHORT PULSE" — same style as Streak label above

**Avatar cluster:**
- Show up to 4 member avatars (overlapping circles)
- Each avatar: 26×26px circle, `border: 2px solid #FFFFFF`
- From index 1 onwards: `margin-left: -7px`
- Use `z-index: {4 - index}` so first avatar is on top
- Avatar background colour: cycle through `['#A8F0E0', '#C3D0F5', '#F5B8A0', '#F7E8A4']`
- Avatar content: 2-letter initials, font-size: 9px, font-weight: 700, color: `#1A202C`
- Margin-bottom: 8px

**Active count line:**
- Text: `"{activeCount} colleagues active"` — font-size: 13px, font-weight: 600, color: `#1A202C`, margin-bottom: 2px
- Text: `"{sameLevel} also on Level {currentLevel}"` — font-size: 12px, color: `#718096`, margin-bottom: 8px

**"View cohort" link:**
- Text: "View cohort" + right arrow icon (Lucide `ArrowRight`, size 11)
- Font-size: 12px, font-weight: 600, color: `#38B2AC`
- Background: none, border: none, cursor: pointer
- On click: navigate to `/app/cohort`
- Hover: opacity 0.65, transition 0.15s

**Data source:** Pull from `memberships` table — find other users in the same organisation. `activeCount` = members with a session in the last 7 days. `sameLevel` = members whose `current_level` matches the current user's. Show real initials from `profiles.full_name`. If no cohort data exists, show: "Your cohort will appear here once colleagues join." — no avatar cluster.

---

## 5. Band 3 — Working Row

### Grid
```
display: grid
grid-template-columns: 1.15fr 1fr
gap: 16px
```

---

### Card 3a — Level Topics (left, wider column)

**Container:**
```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 22px 26px
```

**Header row (flex, space-between, align-items: flex-start, margin-bottom: 16px):**

Left side:
- Title: "Level {n} Topics" — font-size: 15px, font-weight: 700, color: `#1A202C`
- Subtitle: `"{LevelShortName} · {completed} of {total} complete"` — font-size: 12px, color: `#718096`, margin-top: 2px

Right side:
- "Full level →" link — font-size: 12px, font-weight: 600, color: `#38B2AC`
- On click: navigate to `/app/level`
- Hover: opacity 0.65

**Topic list:**
Display all topics for the current level as a vertical list, gap: 6px.

**Each topic row:**
```
display: flex
align-items: center
gap: 12px
padding: 10px 12px
border-radius: 10px
border: 1px solid {stateBorder}
background: {stateBg}
cursor: {stateCursor}
transition: background 0.12s
```

**State: completed**
- `stateBorder`: `#E2E8F0`
- `stateBg`: `#FFFFFF`
- `stateCursor`: pointer
- Hover background: `#F7FAFC`
- Opacity: 1
- Status circle: 26×26px, background `#1A202C`, white checkmark (Lucide `Check`, size 11)
- Topic title: font-size 13px, font-weight 500, color `#4A5568`
- Phase label: "Complete" — font-size 11px, color `#718096`

**State: active**
- `stateBorder`: `{levelAccentColor}99`
- `stateBg`: `{levelAccentColor}10`
- `stateCursor`: pointer
- Hover background: `{levelAccentColor}18`
- Opacity: 1
- Status circle: 26×26px, background `{levelAccentColor}`, topic number centered (font-size 10px, font-weight 800, color `{levelAccentDark}`)
- Topic title: font-size 13px, font-weight 700, color `#1A202C`
- Phase label: e.g. "Slide 7 / 13" or "Phase 2 · Read" — font-size 11px, font-weight 600, color `{levelAccentDark}`
- On click: navigate to `/app/level`

**State: upcoming (not yet unlocked)**
- `stateBorder`: `#E2E8F0`
- `stateBg`: `#FFFFFF`
- `stateCursor`: default (not clickable)
- Opacity: 0.55
- Status circle: 26×26px, background `#E2E8F0`, padlock icon (Lucide `Lock`, size 11, color `#718096`)
- Topic title: font-size 13px, font-weight 500, color `#1A202C`
- Phase label: "Locked" — font-size 11px, color `#718096`

**Right-side time estimate (all states):**
- Estimated duration — e.g. "25 min", "40 min"
- Font-size: 11px, color: `#718096`, flex-shrink: 0

**Topic data is hardcoded per level (see Section 8 — Content Data).** Progress state is pulled from Supabase `progress` table.

---

### Card 3b — My Toolkit (right column)

**Container:**
```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 22px 26px
```

**Header row (flex, space-between, align-items: flex-start, margin-bottom: 16px):**

Left side:
- Title: "My Toolkit" — font-size: 15px, font-weight: 700, color: `#1A202C`
- Subtitle: `"{unlockedCount} unlocked · {lockedCount} coming soon"` — font-size: 12px, color: `#718096`, margin-top: 2px

Right side:
- "Full toolkit →" link — same style as above, navigates to `/app/toolkit`

**Tool card list:**
Display 5 tool cards (2 from Level 1, 2 from Level 2, 1 from Level 3 as a teaser), gap: 10px.

Show only the 5 tools listed in Section 8. The "Full toolkit →" link goes to the complete toolkit page (PRD 05) where all tools across all levels are shown.

**Each tool card:**
```
border-radius: 12px
border: 1px solid {toolBorder}
border-left: 4px solid {toolLeftBorder}
padding: 14px 16px
background: {toolBg}
opacity: {toolOpacity}
```

**Tool state: unlocked**
- `toolBorder`: `{toolAccentColor}88`
- `toolLeftBorder`: `{toolAccentColor}`
- `toolBg`: `{toolAccentColor}12`
- `toolOpacity`: 1

**Tool state: in-progress (current level, not yet fully unlocked)**
- `toolBorder`: `#E2E8F0`
- `toolLeftBorder`: `{toolAccentColor}88`
- `toolBg`: `#FFFFFF`
- `toolOpacity`: 1

**Tool state: locked**
- `toolBorder`: `#E2E8F0`
- `toolLeftBorder`: `#E2E8F0`
- `toolBg`: `#FFFFFF`
- `toolOpacity`: 0.6

**Inside each tool card — flex row, gap 12px:**

Icon block (flex-shrink: 0):
- Size: 36×36px, border-radius: 9px
- Unlocked/in-progress: background `{toolAccentColor}55`, emoji icon centered, font-size 17px
- Locked: background `#E2E8F0`, padlock icon (Lucide `Lock`, size 14, color `#718096`), no emoji

Content block (flex: 1, min-width: 0):

Header row (flex, space-between, align-items: center, margin-bottom: 4px):
- Tool name: font-size 13px, font-weight 700, color: `#1A202C` (unlocked/in-progress) or `#718096` (locked)
- Status badge:
  - Unlocked: text "UNLOCKED", background `{toolAccentColor}55`, color `{toolAccentDark}`, font-size 10px, font-weight 700, padding 2px 8px, border-radius 20px
  - In-progress: text "LVL {n}", same style but `{toolAccentColor}33`
  - Locked: text "Level {n}", border `1px solid #E2E8F0`, color `#718096`, font-size 10px, font-weight 600, no background fill

Description:
- Full description text (see Section 8)
- Font-size: 12px, color: `#718096`, line-height: 1.5

Action (unlocked only):
- "Open →" text button, font-size 12px, font-weight 600, color `{toolAccentDark}`
- On click: navigate to the tool's route (see Section 8)
- Margin-top: 8px

Unlock note (in-progress only):
- `"Complete {LevelName} to unlock"` — font-size 11px, color `{toolAccentDark}`, font-weight 500
- Margin-top: 6px

---

## 6. Interactions & Animations

### Page load
Stagger the three bands into view on mount using CSS animation:
- Band 1: `animation: fadeSlideUp 0.3s ease both`
- Band 2: `animation: fadeSlideUp 0.3s ease 0.08s both`
- Band 3: `animation: fadeSlideUp 0.3s ease 0.16s both`

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Resume button
- Hover: background transitions from `#38B2AC` to `#2D9E99` (150ms)

### Topic rows (clickable states)
- Hover on completed/active rows: background tint shift (150ms)
- No hover effect on upcoming/locked rows

### "View cohort", "Full level", "Full toolkit" links
- Hover: opacity 0.65 (150ms)

### No other animations. No scroll-triggered effects. No floating elements.

---

## 7. Responsive Behaviour

This PRD focuses on desktop (1200px+). Tablet and mobile behaviour is deferred to a later PRD. For now:

- Below 900px: all multi-column grids collapse to single column (`grid-template-columns: 1fr`)
- Text and padding scale down slightly (reduce page padding from 28px 36px to 16px 20px)
- Sidebar behaviour on small screens is handled by PRD 01

---

## 8. Content Data

### Level topic data (hardcoded — all five levels)

This data is static. Topic titles, descriptions, and times do not come from Supabase — they are defined in a local constant file: `src/data/levelTopics.ts`

```typescript
// src/data/levelTopics.ts

export interface Topic {
  id: number;
  title: string;
  description: string;
  estimatedMinutes: number;
}

export const LEVEL_TOPICS: Record<number, Topic[]> = {
  1: [
    { id: 1, title: "What is an LLM?", description: "Understand how large language models work, their limits, and safe usage", estimatedMinutes: 25 },
    { id: 2, title: "Prompting Basics", description: "Learn the structure of a good prompt and how to improve outputs", estimatedMinutes: 30 },
    { id: 3, title: "Everyday Use Cases", description: "Apply AI to emails, notes, brainstorming, research, and planning", estimatedMinutes: 35 },
    { id: 4, title: "Intro to Creative AI", description: "Experiment with image, video, and podcast AI tools for storytelling", estimatedMinutes: 35 },
    { id: 5, title: "Responsible Use", description: "Recognise risks, avoid overreliance, and protect confidentiality", estimatedMinutes: 30 },
    { id: 6, title: "Prompt Library Creation", description: "Build a reusable library of prompts relevant to your role", estimatedMinutes: 40 },
  ],
  2: [
    { id: 1, title: "What are AI Agents?", description: "Understand the difference between a prompt and a configured AI agent", estimatedMinutes: 25 },
    { id: 2, title: "Prompting Basics", description: "Revisit prompt structure with a focus on agent instruction design", estimatedMinutes: 30 },
    { id: 3, title: "Everyday Use Cases", description: "Identify role-specific workflows where a custom agent adds value", estimatedMinutes: 35 },
    { id: 4, title: "Context Engineering", description: "Prompts, Documents & Projects — the three-layer model", estimatedMinutes: 40 },
    { id: 5, title: "Agent Design Principles", description: "System prompt design, human-in-the-loop integration, and ethical framing", estimatedMinutes: 45 },
    { id: 6, title: "Building Your First Agent", description: "Configure and test a custom GPT or Claude agent for your specific role", estimatedMinutes: 50 },
  ],
  3: [
    { id: 1, title: "AI Workflow Mapping", description: "Map your existing workflows and identify AI integration points", estimatedMinutes: 30 },
    { id: 2, title: "Agent Chaining", description: "Connect multiple agents in sequence to handle complex tasks", estimatedMinutes: 40 },
    { id: 3, title: "Input Logic & Role Mapping", description: "Define who triggers what, and how data flows through the pipeline", estimatedMinutes: 35 },
    { id: 4, title: "Automated Output Generation", description: "Configure agents to write, format, and deliver outputs automatically", estimatedMinutes: 45 },
    { id: 5, title: "Human-in-the-Loop Design", description: "Build rationale trails and approval checkpoints into every AI decision", estimatedMinutes: 40 },
    { id: 6, title: "Performance & Feedback Loops", description: "Measure workflow effectiveness and build in continuous improvement", estimatedMinutes: 50 },
  ],
  4: [
    { id: 1, title: "Dashboard Design Thinking", description: "Work backwards from the end user — what insights, what layout, what inputs", estimatedMinutes: 35 },
    { id: 2, title: "Connecting AI Outputs to UI", description: "Pipe automated AI outputs directly into interactive dashboard components", estimatedMinutes: 45 },
    { id: 3, title: "User Journey Mapping", description: "Design the experience for different dashboard viewers and use cases", estimatedMinutes: 35 },
    { id: 4, title: "Prototyping Your Dashboard", description: "Build and iterate a working dashboard prototype for a real use case", estimatedMinutes: 60 },
    { id: 5, title: "Presenting Intelligence", description: "Design for clarity — how to surface the right insight to the right person", estimatedMinutes: 40 },
  ],
  5: [
    { id: 1, title: "Full-Stack AI Architecture", description: "Understand how workflows, front-ends, and user accounts connect end-to-end", estimatedMinutes: 40 },
    { id: 2, title: "User Account Design", description: "Design individualised experiences — role-based journeys, per-account tracking", estimatedMinutes: 45 },
    { id: 3, title: "Personalisation Engines", description: "Configure AI to adapt outputs based on individual user data and behaviour", estimatedMinutes: 50 },
    { id: 4, title: "Building a Full Application", description: "Product design sprint — scope, build, and test a complete AI-powered app", estimatedMinutes: 90 },
    { id: 5, title: "User Testing & Iteration", description: "Run structured user testing sessions and refine based on real feedback", estimatedMinutes: 60 },
  ],
};
```

### Tool data (hardcoded — dashboard preview shows 5 tools)

Define in `src/data/toolkitData.ts`:

```typescript
// src/data/toolkitData.ts

export interface Tool {
  id: string;
  name: string;
  icon: string;           // emoji
  levelRequired: number;  // 1–5
  levelName: string;
  description: string;
  route: string;          // internal app route
  accentColor: string;
  accentDark: string;
}

export const ALL_TOOLS: Tool[] = [
  {
    id: "prompt-playground",
    name: "Prompt Playground",
    icon: "⚡",
    levelRequired: 1,
    levelName: "Fundamentals",
    description: "A live sandbox to write, test, and refine prompts. Experiment with different structures and see real AI responses instantly.",
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
    description: "Your personal collection of saved, tagged prompts. Build a reusable bank of your best work, organised by use case.",
    route: "/app/toolkit/prompt-library",
    accentColor: "#A8F0E0",
    accentDark: "#1A6B5F",
  },
  {
    id: "agent-builder",
    name: "Agent Builder",
    icon: "🤖",
    levelRequired: 2,
    levelName: "Applied Capability",
    description: "Design and configure custom AI agents with system prompts, instructions, and role definitions. Build tools your whole team can reuse.",
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
    description: "A shared library of agent templates and prompt blueprints. Complete Level 2 to publish your own and access your team's.",
    route: "/app/toolkit/template-library",
    accentColor: "#F7E8A4",
    accentDark: "#8A6A00",
  },
  {
    id: "workflow-canvas",
    name: "Workflow Canvas",
    icon: "🔗",
    levelRequired: 3,
    levelName: "Systemic Integration",
    description: "Map end-to-end automated pipelines visually. Chain agents, define inputs and outputs, and design human-in-the-loop checkpoints.",
    route: "/app/toolkit/workflow-designer",
    accentColor: "#38B2AC",
    accentDark: "#1A7A76",
  },
];

// Dashboard preview shows only the first 5 tools
export const DASHBOARD_TOOLS = ALL_TOOLS.slice(0, 5);
```

---

## 9. Supabase Data Queries

All queries should be written in a custom hook: `src/hooks/useDashboardData.ts`

This hook returns:
```typescript
interface DashboardData {
  // Current level progress
  currentLevel: number;
  completedTopics: number;
  totalTopics: number;
  activeTopicIndex: number;       // 0-based index into LEVEL_TOPICS[currentLevel]
  currentSlide: number;
  totalSlides: number;
  currentPhase: number;           // 1, 2, or 3

  // Streak
  streakDays: number;
  activeDaysThisWeek: boolean[];  // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]

  // Cohort
  cohortMembers: { initials: string; color: string }[];
  activeColleaguesCount: number;
  sameLeveColleaguesCount: number;

  // Last activity
  lastActivityAt: Date | null;

  // Toolkit unlock state
  unlockedToolIds: string[];      // ids of tools the user has access to
}
```

### Query 1 — User progress
```sql
select topic_id, phase, slide, completed_at
from progress
where user_id = {userId} and level = {currentLevel}
order by topic_id asc
```

- `completedTopics` = count of rows where `completed_at is not null`
- `activeTopicIndex` = first topic without `completed_at`
- `currentSlide`, `currentPhase` = from the active topic's row

### Query 2 — Sessions for streak
```sql
select date_trunc('day', created_at) as session_date
from sessions
where user_id = {userId}
  and created_at >= now() - interval '14 days'
group by session_date
order by session_date desc
```

- `streakDays` = consecutive days with sessions counting back from today
- `activeDaysThisWeek` = which days Mon–Sun had sessions this week

### Query 3 — Cohort
```sql
select p.full_name, p.current_level
from memberships m
join profiles p on p.id = m.user_id
where m.organisation_id = {userOrganisationId}
  and m.user_id != {userId}
```

Then filter for activity in last 7 days by cross-referencing `sessions` table.

### Fallback behaviour
If any query fails or returns no data, display graceful defaults:
- Progress: show 0 of {totalTopics} completed, active topic = first topic
- Streak: show 0 (hide streak count as per Card 2b spec)
- Cohort: show "Your cohort will appear here once colleagues join." message
- Last activity: show nothing (hide the line entirely)

Do not show error states or error messages to the user on the dashboard — fail silently with defaults.

---

## 10. Developer Notes

- **`src/data/levelTopics.ts` and `src/data/toolkitData.ts`** must be created as part of this PRD. They are shared data files that PRDs 03, 04, and 05 will also import. Do not inline this data in the component.

- **Tool unlock logic:** A tool is unlocked when `tool.levelRequired <= userProfile.currentLevel`. This is a simple comparison — no separate "unlocked tools" table is needed. If the user is on Level 2, all Level 1 and Level 2 tools are unlocked.

- **"In-progress" tool state:** Show Level `{currentLevel}` tools as "in-progress" (not fully unlocked, not locked). They become "unlocked" only when the user advances to `currentLevel + 1`. Exception: Level 1 tools are always "unlocked" from Level 1 onwards (no in-progress state for the starting level).

- **Time-ago formatting:** Write a small local utility `src/utils/timeAgo.ts` — do not install a library for this. Handle: "just now" (< 1 min), "X minutes ago", "X hours ago", "Yesterday", "X days ago".

- **The `useDashboardData` hook** should fetch all data in parallel using `Promise.all`, not sequentially. Dashboard load time matters.

- **Do not use `useEffect` + `useState` for each query separately.** Use a single `useDashboardData` hook that manages all dashboard state together.

- **Loading state:** While data is loading, show skeleton placeholders (not a spinner). Use `background: #E2E8F0` placeholder blocks at the correct sizes for each data element. Animate with a simple CSS pulse (`opacity: 0.6 → 1, 1s ease-in-out, infinite`). This is more polished than a spinner and prevents layout shift.

- **The progress ring** is an inline SVG — do not use a library for this. The calculation is simple and a library adds unnecessary bundle weight.

- **No `console.log` statements** in the final output.

---

## 11. Acceptance Criteria

Before marking this PRD complete, verify:

- [ ] Dashboard renders correctly inside the AppLayout shell from PRD 01
- [ ] Greeting changes based on time of day (morning / afternoon / evening)
- [ ] User's first name pulls from Supabase `profiles` table
- [ ] Progress ring reflects real completion data (not hardcoded)
- [ ] "Continue Learning" card shows the correct active topic title and description
- [ ] Slide progress bar reflects real current slide position
- [ ] "Resume →" button navigates to `/app/level`
- [ ] Streak dot row correctly marks past active days, today, and future days
- [ ] Streak count is hidden (not shown as "0 day streak") when streak is 0
- [ ] Cohort avatars pull real member initials from Supabase
- [ ] Cohort fallback message shows when no cohort members exist
- [ ] Level Topics card shows all topics for the current level with correct state (completed / active / upcoming)
- [ ] Upcoming topics are non-clickable (cursor: default, opacity 0.55)
- [ ] My Toolkit card shows correct unlock state for each tool based on current level
- [ ] "Open →" links on unlocked tools navigate to the correct `/app/toolkit/*` routes
- [ ] Page load stagger animation plays correctly (3 bands, 80ms delay each)
- [ ] Skeleton loading state shows while data fetches (no layout shift)
- [ ] All data fetches run in parallel (check Network tab — no waterfall)
- [ ] No TypeScript errors on build
- [ ] No console errors in browser
