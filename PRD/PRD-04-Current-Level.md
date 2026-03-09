# PRD 04 — Current Level Page
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing), PRD 02 (Dashboard — data files), PRD 03 (My Journey — `LEVEL_META`)  
**Followed by:** PRD 05 — My Toolkit Page

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRDs 01, 02, and 03 are complete and passing all acceptance criteria
2. Read `src/data/levelTopics.ts` in full — specifically `LEVEL_TOPICS` and the `LEVEL_META` array added in PRD 03. Both are used heavily on this page.
3. Read `src/data/toolkitData.ts` — tools unlocked at each level are surfaced on this page
4. Read `src/context/AppContext.tsx` — user profile data (currentLevel, fullName) comes from here
5. Read `src/hooks/useJourneyData.ts` from PRD 03 — some of its derived data can be reused here. Do not duplicate Supabase queries if the hook already provides what's needed.
6. Read the existing `src/pages/app/AppCurrentLevel.tsx` placeholder — you are replacing its contents entirely

This page has the most complex layout in the application. Read the full PRD before writing any code. The two-panel structure (Section 3) is foundational — get that right before building any sub-components.

---

## 1. Overview

### Purpose
The Current Level page is the learner's primary working environment. This is where learning actually happens. Where the Dashboard is a cockpit and My Journey is a map, Current Level is the territory itself — the page you spend the most time on.

It has two jobs:
1. **Navigation** — show all topics in the current level and let the learner move between them
2. **Content delivery** — display the active learning content for the selected topic (slides, reading, video, exercises)

### Where it sits
Route: `/app/level`  
Optional query param: `/app/level?topic={topicId}` — allows direct linking to a specific topic (used by the Resume button on Dashboard and the Continue CTA on My Journey)  
Rendered inside: `AppLayout` (sidebar + top bar from PRD 01)  
"Current Level" nav item in the sidebar is active on this route.

### Design philosophy
This page uses a **two-panel layout** — a fixed left panel for navigation and a scrollable right panel for content. This is the DataCamp/Codecademy pattern. The left panel gives the learner a permanent spatial map ("I am at topic 4, there are 6 total"); the right panel is where they do the work. The learner should never feel lost or unsure what to do next.

The learning experience within each topic follows the **three-phase progression** defined in the e-learning skill: Phase 1 (E-Learning slides), Phase 2 (Read), Phase 3 (Watch). Phases within a topic unlock sequentially — complete Phase 1 to access Phase 2, complete Phase 2 to access Phase 3.

---

## 2. URL and State Logic

### Route: `/app/level`
On load, determine which topic to show:
1. If `?topic={id}` query param exists → show that topic (validate it's a real topic for the current level)
2. If no query param → show the **active topic** (first incomplete topic in the current level)
3. If all topics in the current level are complete → show the last topic (in review mode)

### Selected topic state
Store the currently selected topic in component state (not in the URL after initial load). Clicking a topic in the left panel updates state and scrolls the right panel to the top — no full page reload.

### Level shown
Always show the user's `currentLevel` from `AppContext`. This page does not support viewing other levels — for that, the user navigates to My Journey and clicks a completed level card (future PRD handles that case). For now, this page always shows `currentLevel`.

---

## 3. Page Structure — Two-Panel Layout

```
<div class="level-page">
  ├── <LeftPanel />      ← fixed, 300px wide, full height, independent scroll
  └── <RightPanel />     ← flex: 1, scrollable, content renders here
</div>
```

**Outer container:**
```
display: flex
height: calc(100vh - 54px)   ← full height minus top bar
overflow: hidden              ← panels handle their own scroll
background: #F7FAFC
```

No outer padding on the level-page container — the panels handle their own internal padding.

---

## 4. Left Panel — Topic Navigation

**Container:**
```
width: 300px
min-width: 300px
height: 100%
overflow-y: auto
background: #FFFFFF
border-right: 1px solid #E2E8F0
display: flex
flex-direction: column
```

### Left Panel — Header (sticky at top of left panel)

```
position: sticky
top: 0
background: #FFFFFF
z-index: 2
padding: 24px 20px 16px
border-bottom: 1px solid #E2E8F0
```

**Level badge row (flex, align-items: center, gap: 8px, margin-bottom: 8px):**
- Level pill: background `{levelAccentColor}44`, border `1px solid {levelAccentColor}88`, border-radius 20px, padding 3px 12px
  - Text: `"LEVEL {n}"` — font-size 10px, font-weight 700, color `{levelAccentDark}`, text-transform uppercase, letter-spacing 0.08em
- Level name: font-size 13px, font-weight 600, color `#1A202C`

**Level title:**
- Text: level name (e.g. "Applied Capability") — font-size 17px, font-weight 800, color `#1A202C`, letter-spacing -0.3px, margin-bottom 10px

**Mini progress bar:**
- Label: `"{completedTopics} of {totalTopics} topics complete"` — font-size 11px, color `#718096`, margin-bottom 5px
- Bar: height 4px, background `{levelAccentColor}33`, border-radius 4px
  - Fill: `{completedTopics/totalTopics * 100}%` width, background `{levelAccentColor}`, border-radius 4px

### Left Panel — Topic List

```
padding: 12px 12px
flex: 1
```

Each topic is a clickable row. Gap between rows: 4px.

**Topic row container:**
```
display: flex
align-items: flex-start
gap: 10px
padding: 10px 10px
border-radius: 10px
cursor: {cursor}
transition: background 0.12s
border: 1px solid transparent
```

**Topic row states:**

**Selected (currently viewing):**
```
background: {levelAccentColor}18
border-color: {levelAccentColor}66
cursor: default
```

**Completed (not selected):**
```
background: transparent
border-color: transparent
cursor: pointer
hover background: #F7FAFC
```

**Active/in-progress (not selected):**
```
background: transparent
border-color: transparent
cursor: pointer
hover background: #F7FAFC
```

**Upcoming/locked:**
```
background: transparent
border-color: transparent
cursor: default
opacity: 0.5
```

**Inside each topic row:**

Status circle (flex-shrink: 0, margin-top: 1px):
- Size: 24×24px, border-radius: 50%
- Completed: background `{levelAccentDark}`, white checkmark (Lucide `Check`, size 10)
- Active (in-progress, not selected): background `{levelAccentColor}`, topic number (font-size 10px, font-weight 800, color `{levelAccentDark}`)
- Selected active: same as active but slightly larger ring effect — `box-shadow: 0 0 0 3px {levelAccentColor}44`
- Upcoming: background `#E2E8F0`, topic number (font-size 10px, color `#A0AEC0`)

Content block (flex: 1, min-width: 0):
- Topic title: font-size 13px, font-weight: 600 (selected/active) or 400 (completed/upcoming), color: `#1A202C` (active/selected) or `#718096` (completed) or `#A0AEC0` (upcoming), line-height 1.3
- Phase indicator (below title, for active topic only): show current phase as 3 dots inline
  - Three dots, 6px diameter circles, gap 4px
  - Phase 1 active: dot 1 filled `{levelAccentDark}`, dots 2–3 empty `#E2E8F0`
  - Phase 2 active: dots 1–2 filled, dot 3 empty
  - Phase 3 active: all 3 filled
  - Labels below dots (tiny): "E-Learn" · "Read" · "Watch" — font-size 9px, color `#A0AEC0`
  - Margin-top: 5px

Time estimate (flex-shrink: 0):
- Font-size: 11px, color: `#A0AEC0`
- Only show for upcoming and active topics (hide for completed — they already know)

### Left Panel — Footer

```
padding: 12px 20px 20px
border-top: 1px solid #E2E8F0
```

**"Back to My Journey" link:**
- Lucide `ArrowLeft` icon (size 13) + "My Journey"
- Font-size: 12px, font-weight: 600, color: `#718096`
- On click: navigate to `/app/journey`
- Hover: color `#1A202C`
- Transition: color 0.15s

---

## 5. Right Panel — Content Area

**Container:**
```
flex: 1
height: 100%
overflow-y: auto
background: #F7FAFC
```

The right panel renders different sub-views depending on the topic's state and selected phase. There are four possible right panel states:

| State | When shown | Component |
|---|---|---|
| Active topic — Phase 1 | Topic in progress, Phase 1 active | `<ELearningView />` |
| Active topic — Phase 2 | Phase 1 complete, Phase 2 active | `<ReadView />` |
| Active topic — Phase 3 | Phase 2 complete, Phase 3 active | `<WatchView />` |
| Completed topic | All 3 phases done | `<CompletedTopicView />` |
| Locked topic | User hasn't reached this topic | `<LockedTopicView />` |

All five components render inside the right panel with the same outer padding:
```
padding: 32px 40px
max-width: 800px
```

---

## 6. Right Panel — Shared Topic Header

Every right panel state (except locked) begins with a shared topic header block. This sits above the phase-specific content.

```
margin-bottom: 24px
padding-bottom: 24px
border-bottom: 1px solid #E2E8F0
```

**Row 1 — Breadcrumb:**
- Text: `"Level {n} · Topic {topicId} of {total}"` — font-size 12px, color `#718096`
- Margin-bottom: 8px

**Row 2 — Topic title:**
- Font-size: 24px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.4px
- Margin-bottom: 6px

**Row 3 — Topic description:**
- Full description from `LEVEL_TOPICS` data
- Font-size: 14px, color: `#4A5568`, line-height: 1.7
- Margin-bottom: 14px

**Row 4 — Phase progress strip:**
Three phase pills in a flex row, gap: 8px:

Each pill:
```
display: flex
align-items: center
gap: 6px
padding: 6px 14px
border-radius: 20px
font-size: 12px
font-weight: 600
```

Phase states:
- **Complete:** background `{levelAccentColor}33`, color `{levelAccentDark}`, shows checkmark icon (Lucide `Check`, size 11) before label
- **Active:** background `{levelAccentColor}`, color `{levelAccentDark}`, shows filled circle before label — `●`
- **Locked:** background `#F7FAFC`, border `1px solid #E2E8F0`, color `#A0AEC0`, shows padlock icon (Lucide `Lock`, size 11) before label

Phase labels: "E-Learning" · "Read" · "Watch"

Clicking a completed phase pill switches to that phase view. Clicking active does nothing. Clicking locked does nothing.

---

## 7. Right Panel — Phase 1: E-Learning View (`<ELearningView />`)

This is the slide-based learning experience. It is the most complex component on the page.

### Slide viewer container

```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
overflow: hidden
margin-bottom: 20px
```

### Slide header bar

```
background: {levelAccentColor}18
border-bottom: 1px solid {levelAccentColor}33
padding: 12px 20px
display: flex
align-items: center
justify-content: space-between
```

Left: slide counter — `"Slide {current} of {total}"` — font-size 12px, font-weight 600, color `{levelAccentDark}`  
Right: phase label — "Phase 1 · E-Learning" — font-size 12px, color `{levelAccentDark}`

### Slide content area

```
padding: 40px 48px
min-height: 380px
display: flex
flex-direction: column
justify-content: center
```

**This is a placeholder implementation.** The actual slide content (the 13-slide interactive e-learning deck built in the e-learning skill) is a separate system. For this PRD, render a placeholder that demonstrates the shell without building the full slide engine.

**Placeholder slide content:**
```
background: #F7FAFC
border-radius: 12px
border: 2px dashed #E2E8F0
padding: 48px 40px
text-align: center
```
- Icon: Lucide `PlayCircle`, size 48, color `{levelAccentColor}`
- Heading: `"Slide {currentSlide}: {slidePlaceholderTitle}"` — font-size 18px, font-weight 700, color `#1A202C`, margin-top 12px
- Body: "Interactive slide content loads here. This is a placeholder for the e-learning slide engine." — font-size 14px, color `#718096`, margin-top 6px, line-height 1.6

**Slide placeholder titles** (one per slide, cycle through for demo — these are placeholders, not real slide names):
Define an array of 13 generic placeholders:
```typescript
const SLIDE_PLACEHOLDERS = [
  "Opening Scenario",
  "The Problem with Current Approaches",
  "Introducing the Core Concept",
  "How It Works — Part 1",
  "How It Works — Part 2",
  "Visual Model",
  "Applying It to Your Work",
  "Before and After",
  "Common Mistakes to Avoid",
  "Real-World Example",
  "Practice Exercise",
  "Key Takeaways",
  "What's Next",
];
```

### Slide navigation bar

```
padding: 16px 20px
border-top: 1px solid #E2E8F0
display: flex
align-items: center
justify-content: space-between
background: #FFFFFF
```

**Left: Previous button**
- Lucide `ChevronLeft` + "Previous"
- Disabled on slide 1: opacity 0.35, cursor: default
- Enabled: font-size 13px, font-weight 600, color `#4A5568`, cursor pointer
- Hover (enabled): color `#1A202C`
- Background: none, border: none

**Centre: Slide dot indicators**
- Show dots for all slides (max visible: 13)
- Each dot: 6px diameter circle
- Active dot: background `{levelAccentDark}`, width 18px (elongated pill shape), border-radius 3px
- Inactive visited dot: background `{levelAccentColor}88`
- Inactive unvisited dot: background `#E2E8F0`
- Gap: 4px between dots

**Right: Next / Complete Phase button**
- If not on last slide: "Next →" button — background `#1A202C`, color white, border-radius 20px, padding 8px 18px, font-size 13px, font-weight 600
  - Hover: background `#2D3748`
- If on last slide: "Complete E-Learning →" button — background `{levelAccentColor}`, color `{levelAccentDark}`, border-radius 20px, padding 8px 18px, font-size 13px, font-weight 700
  - Hover: background `{levelAccentDark}`, color white
  - On click: mark Phase 1 complete in Supabase, advance to Phase 2, scroll right panel to top

### Slide progress bar (below the entire slide viewer card, outside it)

```
height: 3px
background: #E2E8F0
border-radius: 3px
overflow: hidden
margin-bottom: 20px
```

Fill: `{currentSlide / totalSlides * 100}%` width, background `{levelAccentColor}`, transition width 0.3s ease.

---

## 8. Right Panel — Phase 2: Read View (`<ReadView />`)

### Container

```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 32px 36px
margin-bottom: 20px
```

### Header

- Phase label: "Phase 2 · Read" — font-size 11px, font-weight 700, color `{levelAccentDark}`, text-transform uppercase, letter-spacing 0.08em, margin-bottom 8px
- Section title: "Curated Reading" — font-size 20px, font-weight: 800, color `#1A202C`, margin-bottom 6px
- Subtitle: "Read these articles to deepen your understanding. Reflection prompts follow each one." — font-size 13px, color `#718096`, margin-bottom 24px

### Reading items

**This is a placeholder implementation** — real articles will be curated per topic in a future content pass. For now, show 2 placeholder reading cards per topic.

Each reading card:
```
border-radius: 12px
border: 1px solid #E2E8F0
padding: 20px 22px
margin-bottom: 12px
```

Card contents:
- Source tag: e.g. "Harvard Business Review" or "MIT Technology Review" — font-size 10px, font-weight 700, color `{levelAccentDark}`, background `{levelAccentColor}33`, padding 2px 8px, border-radius 20px, display inline-block, margin-bottom 8px
- Article title: font-size 15px, font-weight 700, color `#1A202C`, margin-bottom 4px
- Summary: 2-sentence description — font-size 13px, color `#718096`, line-height 1.6, margin-bottom 12px
- "Read article →" link: font-size 12px, font-weight 600, color `{levelAccentDark}` — for now links to `#` (placeholder)

**Placeholder reading card data** (same 2 cards shown for all topics in this PRD — content team will replace per-topic):
```typescript
const PLACEHOLDER_READINGS = [
  {
    source: "Harvard Business Review",
    title: "How AI Is Changing the Way Professionals Work",
    summary: "An accessible overview of the practical impact of large language models on knowledge work. Covers real examples from consulting, strategy, and operations teams.",
  },
  {
    source: "MIT Technology Review",
    title: "The Art of Prompting: What Makes an AI Assistant Actually Useful",
    summary: "A deep dive into the mechanics of effective AI interaction. Explains why specificity, context, and iteration matter more than people expect.",
  },
];
```

### Reflection prompt block

```
background: {levelAccentColor}12
border-radius: 12px
border-left: 4px solid {levelAccentColor}
padding: 20px 22px
margin-top: 20px
margin-bottom: 24px
```

- Label: "Reflection" — font-size 11px, font-weight 700, color `{levelAccentDark}`, text-transform uppercase, letter-spacing 0.08em, margin-bottom 8px
- Prompt text: "Consider how the concepts in these articles connect to your current role. What's one specific workflow where you could apply this thinking this week?" — font-size 14px, color `#4A5568`, line-height 1.7

(This is a generic placeholder prompt — real prompts will be topic-specific in a future content pass.)

### Complete Phase 2 button

```
display: flex
justify-content: flex-end
margin-top: 8px
```

Button: "Complete Reading →"
- Background: `{levelAccentColor}`, color: `{levelAccentDark}`, border: none, border-radius 24px, padding 10px 22px, font-size 14px, font-weight 700
- Hover: background `{levelAccentDark}`, color white
- On click: mark Phase 2 complete in Supabase, advance to Phase 3, scroll right panel to top

---

## 9. Right Panel — Phase 3: Watch View (`<WatchView />`)

### Container

Same outer container as ReadView.

### Header

- Phase label: "Phase 3 · Watch" — same style as ReadView header
- Section title: "Curated Videos" — same style
- Subtitle: "Watch these videos, then answer the knowledge check questions below." — font-size 13px, color `#718096`, margin-bottom 24px

### Video items

**Placeholder implementation** — 2 video cards per topic.

Each video card:
```
border-radius: 12px
border: 1px solid #E2E8F0
overflow: hidden
margin-bottom: 12px
```

**Video thumbnail placeholder:**
```
height: 180px
background: {levelAccentColor}22
display: flex
align-items: center
justify-content: center
position: relative
```
- Centered play button: 52×52px circle, background `rgba(0,0,0,0.3)`, Lucide `Play` icon (size 22, color white, fill white)
- Bottom-left: video duration badge — `"12:34"` — background `rgba(0,0,0,0.6)`, color white, font-size 11px, font-weight 600, padding 2px 6px, border-radius 4px, position absolute, bottom 10px, left 10px

**Video info (below thumbnail):**
```
padding: 14px 16px
```
- Source: e.g. "YouTube · Andrej Karpathy" — font-size 10px, font-weight 700, color `{levelAccentDark}`, background `{levelAccentColor}33`, padding 2px 8px, border-radius 20px, display inline-block, margin-bottom 6px
- Title: font-size 14px, font-weight 700, color `#1A202C`, margin-bottom 4px
- Description: font-size 12px, color `#718096`, line-height 1.5

**Placeholder video data:**
```typescript
const PLACEHOLDER_VIDEOS = [
  {
    source: "YouTube · Andrej Karpathy",
    title: "Intro to Large Language Models",
    description: "A clear, non-technical explanation of how LLMs work, what they're good at, and where they fall short. Essential viewing for anyone new to AI.",
    duration: "59:48",
  },
  {
    source: "YouTube · 3Blue1Brown",
    title: "But what is a GPT? Visual intro to transformers",
    description: "A visually rich walkthrough of the transformer architecture. Builds intuition without requiring a maths background.",
    duration: "27:14",
  },
];
```

### Knowledge check block

```
background: #F7FAFC
border-radius: 12px
border: 1px solid #E2E8F0
padding: 22px 24px
margin-top: 20px
margin-bottom: 24px
```

- Label: "Knowledge Check" — font-size 11px, font-weight 700, color `#718096`, text-transform uppercase, letter-spacing 0.08em, margin-bottom 12px
- Question: "Which of the following best describes the purpose of a system prompt in an LLM interaction?" — font-size 14px, font-weight 600, color `#1A202C`, margin-bottom 14px
- 4 answer options as radio-button-style cards:

Each answer option:
```
padding: 10px 14px
border-radius: 8px
border: 1px solid #E2E8F0
margin-bottom: 6px
cursor: pointer
display: flex
align-items: center
gap: 10px
transition: border-color 0.15s, background 0.15s
```

- Default: white background, gray border
- Hover: background `#F7FAFC`, border `#CBD5E0`
- Selected (unsubmitted): background `{levelAccentColor}18`, border `{levelAccentColor}`
- Correct (after submit): background `#C6F6D5`, border `#48BB78`, show Lucide `CheckCircle` (size 16, color `#48BB78`) on right
- Incorrect (after submit): background `#FED7D7`, border `#FC8181`, show Lucide `XCircle` (size 16, color `#FC8181`) on right

Radio circle (flex-shrink: 0): 16×16px, border-radius 50%, border `1.5px solid #CBD5E0` — filled `{levelAccentDark}` when selected

Option text: font-size 13px, color `#4A5568`

**Submit button (shows after user selects an answer):**
- "Check answer" — background `#1A202C`, color white, border-radius 20px, padding 8px 18px, font-size 13px, font-weight 600
- Hidden until an option is selected

**Result feedback (shows after submit):**
- Correct: "Correct! {brief explanation}" — color `#276749`, font-size 13px, margin-top 10px
- Incorrect: "Not quite. {brief explanation}" — color `#9B2C2C`, font-size 13px, margin-top 10px

(One static knowledge check question per topic is fine for now — content team will replace with topic-specific questions in a future pass.)

### Complete Topic button

- "Complete Topic →" — same style as Phase 2 complete button
- Only enabled after the knowledge check has been answered (regardless of correct/incorrect — completion is for attempting, not for getting it right)
- On click: mark Phase 3 complete in Supabase, mark topic as complete, then:
  - If more topics remain: show success state (see Section 11), then auto-select next topic after 1.5s
  - If this was the last topic: show level completion state (see Section 12)

---

## 10. Right Panel — Completed Topic View (`<CompletedTopicView />`)

Shown when a user clicks on a topic they have already fully completed.

```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
border-left: 4px solid {levelAccentColor}
padding: 32px 36px
text-align: center
```

Contents:
- Checkmark circle: 56×56px, background `{levelAccentColor}33`, border-radius 50%, centered Lucide `CheckCircle` (size 28, color `{levelAccentDark}`), margin: 0 auto 16px
- Heading: "Topic Complete" — font-size 20px, font-weight 800, color `#1A202C`, margin-bottom 6px
- Subtext: `"You completed "{topicTitle}" on {completedDate}."` — font-size 14px, color `#718096`, line-height 1.6, margin-bottom 24px

**Phase review strip (flex row, gap: 10px, justify-content: center, margin-bottom: 24px):**
Three phase pills showing all as complete (same completed phase pill style from Section 6 Row 4 — all with checkmarks and `{levelAccentColor}33` background).

**"Review this topic" button:**
- Text: "Review E-Learning →"
- Border: `1px solid #1A202C`, border-radius 24px, padding 10px 22px, font-size 14px, font-weight 600, color `#1A202C`, background transparent
- Hover: background `#1A202C`, color white
- On click: switch right panel to Phase 1 view in review mode (user can navigate slides but "Complete" button is replaced with "← Back to summary")

**"Next topic →" button (if a next topic exists):**
- Background `{levelAccentColor}`, color `{levelAccentDark}`, border-radius 24px, padding 10px 22px, font-size 14px, font-weight 700
- Hover: background `{levelAccentDark}`, color white
- On click: select next topic in left panel, switch right panel to that topic's active phase

---

## 11. Right Panel — Topic Completion Micro-Moment

When the user clicks "Complete Topic" at the end of Phase 3, before advancing to the next topic, show a brief celebratory moment overlaid on the right panel.

**Implementation:** a full-panel overlay (not a modal, not a toast — a gentle full-panel wash):

```
position: absolute
inset: 0
background: rgba(255, 255, 255, 0.96)
display: flex
flex-direction: column
align-items: center
justify-content: center
z-index: 10
animation: fadeIn 0.2s ease
```

Contents (centered, no card border — open space):
- Large emoji: level-specific celebration emoji
  - Level 1: "⚡", Level 2: "🤖", Level 3: "🔗", Level 4: "📊", Level 5: "🚀"
  - Font-size: 52px, margin-bottom 16px
  - `animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring bounce effect)
- Heading: "Topic Complete!" — font-size 24px, font-weight 800, color `#1A202C`, margin-bottom 6px
- Subtext: `"Moving to {nextTopicTitle}…"` — font-size 14px, color `#718096`
- Thin progress line at the bottom of the overlay: animated from 0 to 100% width in 1.5s, then overlay fades out and next topic loads

```css
@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
```

---

## 12. Right Panel — Level Completion State

When the user completes the last topic in the current level, instead of the topic completion micro-moment, show the level completion screen on the right panel (replaces all topic content).

```
padding: 48px 40px
text-align: center
max-width: 560px
margin: 0 auto
```

Contents:
- Large emoji: "🎉" — font-size 56px, margin-bottom 20px, `animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`
- Heading: `"Level {n} Complete!"` — font-size 28px, font-weight 800, color `#1A202C`, letter-spacing -0.5px, margin-bottom 8px
- Subtext: `"You've completed all {n} topics in {LevelName}. Level {n+1} is now unlocked."` — font-size 15px, color `#4A5568`, line-height 1.7, margin-bottom 28px
- If final level (Level 5): subtext: "You've completed the entire Oxygy AI Upskilling Programme. Exceptional work."

**Newly unlocked tools block** (only show if the completed level unlocks tools):

```
background: {levelAccentColor}12
border-radius: 14px
border: 1px solid {levelAccentColor}44
padding: 20px 24px
margin-bottom: 24px
text-align: left
```

- Label: "🔓 Newly Unlocked" — font-size 12px, font-weight 700, color `{levelAccentDark}`, margin-bottom 10px
- List of newly unlocked tools (flex column, gap: 8px):
  - Each: emoji icon + tool name + one-line description
  - Pull from `toolkitData.ts` where `levelRequired === completedLevel`

**CTA buttons (flex row, gap: 12px, justify-content: center):**

1. "Go to My Journey →" — background `{levelAccentColor}`, color `{levelAccentDark}`, border-radius 24px, padding 10px 22px, font-size 14px, font-weight 700, on click navigate to `/app/journey`
2. "Continue to Level {n+1}" — background `#1A202C`, color white, same sizing, on click: update `currentLevel` in Supabase profiles table, then navigate to `/app/level`

If Level 5 is complete, replace buttons with:
1. "Go to My Journey" — same style
2. "Explore My Toolkit" — navigates to `/app/toolkit`

---

## 13. Right Panel — Locked Topic View (`<LockedTopicView />`)

Shown when a user clicks on an upcoming/locked topic in the left panel.

```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 40px 36px
text-align: center
```

Contents:
- Padlock icon: Lucide `Lock`, size 40, color `#CBD5E0`, margin-bottom 14px
- Heading: "Complete the previous topic first" — font-size 18px, font-weight 700, color `#1A202C`, margin-bottom 6px
- Subtext: `"Finish "{previousTopicTitle}" to unlock this topic."` — font-size 14px, color `#718096`
- "Go to current topic →" button: same teal button style, on click: select the active topic in the left panel

---

## 14. Interactions & Animations

### Topic switching (left panel → right panel)
When clicking a topic in the left panel:
- Right panel fades out: `opacity: 1 → 0`, duration 100ms
- Content swaps
- Right panel fades in: `opacity: 0 → 1`, duration 150ms
- Right panel scrolls to top: `scrollTop = 0`

### Slide navigation
- Previous/Next: slide content transitions with a subtle horizontal slide:
  - Exiting slide: `transform: translateX(-10px)`, `opacity: 0`, 150ms
  - Entering slide: `transform: translateX(10px) → translateX(0)`, `opacity: 0 → 1`, 150ms
- Dot indicator updates immediately on slide change

### Phase advancement
When completing a phase and advancing to the next:
- Phase pills in topic header update immediately (checkmark appears on completed phase)
- Right panel content transitions with the same fade as topic switching

### Knowledge check
- Answer selection: instant visual state change (no animation)
- Submit → reveal: correct/incorrect state reveals with a subtle fade (150ms)

### Left panel active state
When topic switches, the left panel active indicator moves with a background transition (0.12s) — not an animated indicator, just a quick colour change.

---

## 15. Supabase Data Operations

### Reading progress (on page load)
```sql
select topic_id, phase, slide, completed_at
from progress
where user_id = {userId}
  and level = {currentLevel}
order by topic_id asc
```

Use this to determine:
- Which topics are complete
- Which topic is active
- Current phase and slide of the active topic

### Writing progress — slide advance
On every "Next slide" click:
```sql
update progress
set slide = {newSlide},
    updated_at = now()
where user_id = {userId}
  and level = {currentLevel}
  and topic_id = {topicId}
```

If no row exists yet (first time opening a topic):
```sql
insert into progress (user_id, level, topic_id, phase, slide)
values ({userId}, {currentLevel}, {topicId}, 1, 1)
on conflict (user_id, level, topic_id) do update
  set slide = 1, phase = 1
```

### Writing progress — phase completion
On "Complete Phase" click:
```sql
update progress
set phase = {nextPhase},
    slide = 1,
    updated_at = now()
where user_id = {userId}
  and level = {currentLevel}
  and topic_id = {topicId}
```

### Writing progress — topic completion
On "Complete Topic" click:
```sql
update progress
set completed_at = now(),
    updated_at = now()
where user_id = {userId}
  and level = {currentLevel}
  and topic_id = {topicId}
```

### Writing progress — level completion
When all topics in the current level are marked complete:
```sql
update profiles
set current_level = {currentLevel + 1},
    updated_at = now()
where id = {userId}
```

Then update `AppContext` so the sidebar badge and other components reflect the new level immediately (without a full page reload).

### Session recording
On every page load of `/app/level`, insert a session record:
```sql
insert into sessions (user_id, type, level, created_at)
values ({userId}, 'level_view', {currentLevel}, now())
```

This is what the Dashboard streak calculation uses. Do not skip this.

---

## 16. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       ├── level/
│       │   ├── LeftPanel.tsx              ← topic nav panel
│       │   ├── ELearningView.tsx          ← Phase 1 content
│       │   ├── ReadView.tsx               ← Phase 2 content
│       │   ├── WatchView.tsx              ← Phase 3 content
│       │   ├── CompletedTopicView.tsx     ← completed topic summary
│       │   ├── LockedTopicView.tsx        ← locked topic placeholder
│       │   ├── TopicHeader.tsx            ← shared header above all views
│       │   ├── TopicCompletionOverlay.tsx ← micro-moment overlay
│       │   └── LevelCompletionView.tsx    ← level complete screen
└── hooks/
    └── useLevelData.ts                    ← all Supabase queries for this page
```

Existing files to modify:
- `src/pages/app/AppCurrentLevel.tsx` — replace placeholder with full two-panel implementation

---

## 17. Developer Notes

- **Two-panel layout uses `height: calc(100vh - 54px)` and `overflow: hidden` on the outer container.** Each panel then has `overflow-y: auto` independently. This is critical — do not use `min-height` or let the outer container scroll. Both panels must scroll independently.

- **The left panel header is `position: sticky, top: 0`.** Test this carefully — sticky inside a flex container requires the panel itself to be `overflow-y: auto` with a defined height. If sticky doesn't work, the level name and progress bar will scroll away and the learner loses spatial orientation.

- **Progress writes are frequent** (every slide click). Debounce the Supabase write by 300ms to avoid hammering the database on fast clickers. The UI state updates immediately; the database write is debounced.

- **The `progress` table** — confirm it has a unique constraint on `(user_id, level, topic_id)` so the `on conflict` upsert works. If not, add it:
  ```sql
  alter table progress add constraint progress_unique 
    unique (user_id, level, topic_id);
  ```
  Include this as a comment with instructions to run in Supabase dashboard.

- **Level completion writes to `profiles.current_level`** — after this write, update the `AppContext` value immediately using the context's update function. The sidebar badge should change without a page reload.

- **The topic completion micro-moment overlay (Section 11)** uses `position: absolute` on the right panel. The right panel container must have `position: relative` for this to work.

- **Knowledge check state is local (component state only)** — do not persist quiz answers to Supabase. Only the phase completion is persisted. Refreshing the page resets the knowledge check to its unanswered state, which is correct.

- **`useLevelData` hook** should expose both read state and write functions:
  ```typescript
  const { levelData, advanceSlide, completePhase, completeTopic } = useLevelData();
  ```
  Write functions handle the Supabase calls and update local state optimistically.

- **Optimistic UI for slide advances** — update `currentSlide` in local state immediately on click, then write to Supabase in the background. Do not wait for the Supabase response before moving to the next slide.

- **No `console.log` statements** in final output.

- **Total slide count per topic** — hardcode as 13 for all topics in this PRD (the actual slide count will vary per topic in the real content system, but 13 is the target from the e-learning skill). This can be made dynamic later.

---

## 18. Acceptance Criteria

Before marking this PRD complete, verify:

- [ ] Page renders in correct two-panel layout — left 300px fixed, right flex: 1
- [ ] Both panels scroll independently (left panel topic list scrolls separately from right panel content)
- [ ] Left panel header (level name, progress bar) stays sticky when topic list scrolls
- [ ] Correct topic is selected on load based on URL param or active topic fallback
- [ ] Clicking a completed topic in left panel shows `<CompletedTopicView />`
- [ ] Clicking the active topic in left panel shows current phase content
- [ ] Clicking an upcoming/locked topic shows `<LockedTopicView />`
- [ ] "Go to current topic →" button in locked view selects the active topic
- [ ] Phase pills in topic header show correct state (complete / active / locked) for each phase
- [ ] Clicking a completed phase pill switches to that phase's content
- [ ] E-Learning view: previous/next slide navigation works, dots update correctly
- [ ] Previous button is disabled on slide 1
- [ ] "Complete E-Learning" button appears only on the last slide (slide 13)
- [ ] Clicking "Complete E-Learning" marks Phase 1 complete in Supabase and shows Phase 2
- [ ] "Complete Reading" marks Phase 2 complete, shows Phase 3
- [ ] Knowledge check: selecting an answer enables "Check answer" button
- [ ] Knowledge check: submit reveals correct/incorrect state
- [ ] "Complete Topic" is only enabled after knowledge check is attempted
- [ ] Topic completion overlay appears for 1.5s then auto-advances to next topic
- [ ] Level completion screen appears when final topic is completed
- [ ] Newly unlocked tools appear correctly on level completion screen
- [ ] "Continue to Level {n+1}" updates `profiles.current_level` in Supabase and updates AppContext
- [ ] Sidebar level badge updates immediately when level advances (no page reload needed)
- [ ] Session record inserted in `sessions` table on every page load
- [ ] Slide progress writes are debounced (check Network tab — no rapid-fire requests on fast clicking)
- [ ] Slide navigation transition (horizontal fade) plays correctly
- [ ] Slide progress bar (thin, below viewer) updates with each slide advance
- [ ] "Back to My Journey" link in left panel footer navigates to `/app/journey`
- [ ] No TypeScript errors on build
- [ ] No console errors in browser
