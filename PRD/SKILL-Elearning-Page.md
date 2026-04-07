# SKILL: E-Learning Module — Oxygy AI Upskilling Site

## When to apply this skill

Apply this skill in full whenever the user asks you to:
- Create a new e-learning module for any level and topic of the Oxygy AI Upskilling Framework
- Add a new topic, slide deck, or learning journey to the app
- Update or extend an existing e-learning module
- Build any slide-based learning content on this project

**Before writing any code, read this skill in full.** Every e-learning module on this site must follow this exact template. Brand consistency and structural consistency across all levels is a non-negotiable project requirement.

A **Topic Outline** document must be provided alongside this skill before authoring begins. The Topic Outline defines the topic title, learning objectives, slide-by-slide content plan, article URLs, and video URLs for the specific module being built. This skill defines *how* to build — the Topic Outline defines *what* to build.

---

## ⚠️ CRITICAL: Production Architecture

**All course content MUST be built inside the app dashboard, NOT on the marketing site.**

### Where content lives

| Path | Purpose |
|------|---------|
| `/app/level?level=N` | URL for any level's content. Always include `?level=N` |
| `pages/app/AppCurrentLevel.tsx` | Orchestrator — reads `?level=` param, loads topic content, passes to phase views |
| `components/app/level/ELearningView.tsx` | The e-learning player — renders all slides |
| `data/topicContent.ts` | All slide data, stored under key `"L-T"` (e.g. `"2-3"` = Level 2, Topic 3) |
| `data/levelTopics.ts` | Topic metadata: level number, name, tagline, accent colors, topics array |

### Adding a new topic — exact steps

1. Add slide data to `data/topicContent.ts` under a new `"L-T"` key
2. Add topic metadata to `data/levelTopics.ts`
3. **No new pages or routes needed** — the existing pipeline handles rendering automatically
4. Test at `/app/level?level=N`

### Navigation rules

- Every component that links to the level page **must** include `?level=N`
- Never navigate to bare `/app/level` without the level param — this shows the user's current active level, not the intended one
- Breadcrumb: `← Back to My Journey` — links to `/app/journey`
- The Journey Strip is always visible below content, showing all phases with completion state

### Level metadata structure (`levelTopics.ts`)

```typescript
{
  level: number,             // 1–5
  name: string,              // e.g. "Prompt Engineering"
  tagline: string,           // short descriptor shown on level card
  accentColor: string,       // e.g. "#B2D8F7"
  accentDark: string,        // e.g. "#2B6CB0" — for text on accent bg
  topics: [
    {
      id: string,            // e.g. "2-3" (level-topic)
      title: string,
      phases: 2,             // always 2: E-Learn + Practise
    }
  ]
}
```

### Do NOT

- Create standalone marketing-site pages (e.g. `pages/learn/level-*`) for course content
- Build on the marketing site (`MarketingSite.tsx`) — that is for promotional/landing pages only
- Hardcode level-specific routes — derive the practice tool URL from `courseIntro.levelNumber` in slide data

### Level accent color rule (CRITICAL)

**Every e-learning module MUST use its level's accent color — never hardcode teal (`#38B2AC`) or any other fixed color.**

The accent colors are defined in `data/levelTopics.ts`:

| Level | Light (`accentColor`) | Dark (`accentDark`) | Use for |
|-------|----------------------|--------------------|----|
| L1 | `#B2D8F7` (Sky Blue) | `#2B6CB0` | Underlines, pull-quote borders, stat highlights |
| L2 | `#F7E8A4` (Pale Yellow) | `#8A6A00` | Same — yellow theme, NOT teal |
| L3 | `#38B2AC` (Teal) | `#1A7A76` | Same — teal is only correct for L3 |
| L4 | `#F5B8A0` (Soft Peach) | `#8C3A1A` | Same — peach/terracotta theme |
| L5 | `#C3D0F5` (Lavender) | `#2E3F8F` | Same — lavender/indigo theme |

These colors MUST be used for:
- **Stat `valueColour`** in data — set to the level's `accentDark` (e.g. `#C4A934` for L2, `#38B2AC` for L3)
- **Visual fills** in `evidenceHero` charts (calendar cells, dot grid dots, bar fills, card borders)
- **Pull-quote bar** border-left and highlighted stat numbers
- **`TealPhrase`** highlighted words in `tensionStatement` slides
- **Heading underlines** via `renderTealHeading`
- **Default large number card** border and gradient tint

The `ELearningView` component receives `accentColor` and `accentDark` as props. All visual renderers derive `statColor` from `stat.valueColour || accentDark`. New slide types MUST follow the same pattern — never introduce a hardcoded color.

---

## 1. Page Structure

Each e-learning page has three zones stacked vertically:

1. **Page Hero** — level identity, title, description, metadata, progress summary
2. **Active Phase Content** — the currently active learning activity (full width)
3. **Journey Strip** — horizontal progress tracker showing all phases

The page hosts sequential learning phases:
- **Phase 1: E-Learning** — interactive slide deck (always first)
- **Phase 2: Read** — curated articles with reflection prompts
- **Phase 3: Watch** — curated videos with knowledge check quizzes
- **Handoff CTA** — redirects to the level's practice tool

Phases unlock sequentially. The Journey Strip is always visible.

---

## 2. Content Design Philosophy

### 2.1 Core Principles

**Principle 1: Relevance Is Earned Through Evidence, Not Assumed Through Scenario.**
The opening of every module must establish *why this topic matters* using objective, verifiable evidence — not by assuming the learner has had a negative experience. A compelling statistic is as engaging as a personal scenario, and more defensible because data is non-judgmental.

**Principle 2: Gaps Are Opportunities, Not Failures.**
Frame knowledge gaps as something most people haven't been shown yet — not something they've been getting wrong. The learner chose to take this module. Respect that.

**Principle 3: Every Slide Earns Its Place.**
No filler slides. Every slide must teach, test, or transition. If a slide doesn't change what the learner knows, believes, or can do — it doesn't belong.

**Principle 4: Show, Don't Lecture.**
Wherever possible, demonstrate the concept through interactive elements, side-by-side comparisons, or worked examples. The learner should *see* the difference a technique makes, not just read about it.

**Principle 5: Frameworks Are Tools, Not Rules.**
When teaching a framework, present it as one effective tool in a broader toolkit. Before/after comparisons must show genuine attempts on both sides — the difference is in technique, not effort. Prefer *"effective technique"* or *"recommended approach for [specific situation]"* over *"best practice."*

---

### 2.2 Five-Beat Narrative Arc

Every module follows this mandatory story structure. The beats create narrative momentum — the learner is pulled forward, not lectured at.

**Beat 1 — SITUATION (Evidence-Led Opening)**
Establish why this topic matters using real data, industry research, or verifiable metrics. Tone: opportunity and insight, not failure and frustration. The learner should feel *"I didn't know that — tell me more,"* not *"I've been doing this wrong."*

Acceptable openings:
- Industry statistics revealing a gap between adoption and skill
- Research findings quantifying the impact of the skill being taught
- Observable demonstrations showing two approaches with visibly different results — framed as curiosity, not judgment

Unacceptable openings:
- Any framing that assumes the learner has had a negative experience
- Dramatic frustration scenarios
- Language implying the learner has been doing something wrong
- Vague opener: *"AI is changing everything"*

Slide types: `evidenceHero`, `chart`, `pyramid`, `tensionStatement`

**Beat 2 — TENSION (The Knowledge Gap)**
Name what's missing — not what's broken. Frame the gap as something most people haven't been shown.

Language to use: *"Here's what most people haven't been shown…"*
Language to avoid: *"Here's what's broken"*, *"Here's what you've been doing wrong"*

Slide types: `tensionStatement`, `gapDiagram`, `concept`

**Beat 3 — CONCEPT (The Framework)**
Introduce the core framework or technique. The same beat must also introduce alternative approaches and the situational judgment for when to use each. The learner should understand *when* to use this technique, not just *how*.

Never imply the framework being taught is the only valid approach.

Slide types: `contextBar`, `rctf`, `toolkitOverview`, `approachIntro`, `concept`

**Beat 4 — CONTRAST (Technique in Action)**
Show the technique applied versus not applied.

Critical rules:
- Frame the "before" state as *"without this technique"* — never *"the wrong way"*
- Both before and after states must represent genuine attempts — the difference is technique, not effort
- Never strawman the before state with a deliberately weak example

Slide types: `scenarioComparison`, `flipcard`, `parallelDemo`, `gapDiagram`

**Beat 5 — BRIDGE (From Theory to Practice)**
Connect the module's concepts to the learner's real work. Provide templates, decision aids, or exercises. This beat transitions into the Read and Watch phases.

Slide types: `situationalJudgment`, `situationMatrix`, `templates`, `branching`, `spectrum`, `bridge`, `moduleSummary`

---

### 2.3 Tool-Agnostic Framing

All e-learning content must be tool-agnostic. Never reference specific AI tools (ChatGPT, Claude, Copilot, Gemini) in scenario setups, prompt demonstrations, or teaching content.

Use instead: *"your AI tool"*, *"the AI"*, *"any large language model"*

Exceptions:
- Tool-specific features can be referenced in Beat 5 (Bridge) when pointing to specific practice activities
- Tool-specific capabilities can be referenced in Levels 2+ where the learning objective is specifically about that tool's feature set
- Internal Oxygy platform tools (Prompt Playground, etc.) are not subject to this rule

---

### 2.4 Audience Universality Rule

Every scenario, example, prompt demonstration, and exercise must resonate across roles, functions, seniority levels, and organisational contexts. This is mandatory, not aspirational.

Scenarios must describe tasks that every knowledge worker performs:
- Preparing for a meeting
- Summarising information
- Drafting a communication
- Structuring a recommendation
- Creating a first draft of a document
- Reviewing and improving existing content
- Synthesising inputs from multiple sources

**Never:** anchor a scenario to a specific function, name specific job titles in scenario setups, or use tasks only one department would recognise.

**Test before finalising:** *"Could this task be faced by at least 3 completely different job functions?"* If not, rewrite it.

---

### 2.5 Slide Presentation Rules

**Rule 1: Every course starts with a `courseIntro` slide (always slide 0).**
Shows topic title, level badge, estimated time, brief description, and "What You'll Learn" objectives list. Dark navy gradient background.

**Rule 2: Evidence slides must fill the vertical space.**
Stats use large attention-grabbing values (42px+ font). Include source badges. Add a bottom insight bar.

**Rule 3: Fullscreen mode must be actively encouraged.**
The fullscreen button must be visually prominent (glowing animation) with a tooltip on first load: *"View in full screen — Click here for the best learning experience."* Auto-dismisses after 8 seconds or on fullscreen entry.

**Rule 4: Examples should be shown by default, not hidden.**
Show example text inline by default. Only use expand/collapse for supplementary context.

**Rule 5: Framework components must explain WHY, not just WHAT.**
Each framework element must include: definition + example + "Without this → [specific consequence]" impact statement.

**Rule 6: Gap/contrast diagrams must include real example prompts.**
Show actual prompt text on both sides — not abstract labels.

**Rule 7: Modifier techniques must explain the reasoning benefit.**
For each modifier: definition + why it matters + detailed realistic example.

---

## 3. Brand & Visual Tokens

These are the only values to use. Never introduce new colours, fonts, or spacing values.

### Colours
```js
const C = {
  navy:          "#1A202C",
  navyMid:       "#2D3748",
  teal:          "#38B2AC",
  tealDark:      "#2C9A94",
  tealLight:     "#E6FFFA",
  mint:          "#B2D8F7",
  border:        "#E2E8F0",
  bg:            "#F7FAFC",
  body:          "#4A5568",
  light:         "#718096",
  muted:         "#A0AEC0",
  success:       "#48BB78",
  successLight:  "#F0FFF4",
  successBorder: "#9AE6B4",
  error:         "#FC8181",
  errorLight:    "#FFF5F5",
  errorBorder:   "#FEB2B2",
  // RCTF element colours
  role:          "#667EEA",  roleLight:    "#EBF4FF",
  context:       "#38B2AC",  contextLight: "#E6FFFA",
  task:          "#ED8936",  taskLight:    "#FFFBEB",
  format:        "#48BB78",  formatLight:  "#F0FFF4",
};
```

### Level Accent Colors

| Level | accentColor | accentDark |
|-------|-------------|------------|
| L1 | `#38B2AC` (Teal) | `#2C9A94` |
| L2 | `#C3D0F5` (Lavender) | `#5B6DC2` |
| L3 | `#FBE8A6` (Pale Yellow) | `#C4A934` |
| L4 | `#FBCEB1` (Soft Peach) | `#D97B4A` |
| L5 | `#38B2AC` (Teal) | `#2C9A94` |

### Typography
```js
const F = {
  h: "'DM Sans', system-ui, sans-serif",
  b: "'Plus Jakarta Sans', system-ui, sans-serif",
};
```

Always load both from Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

### Typography Scale
| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Page h1 | DM Sans | 28px | 800 | navy |
| Section h2 | DM Sans | 22px | 700 | navy |
| Slide h2 | DM Sans | 22px | 700 | navy |
| Card title | DM Sans | 15px | 700 | navy |
| Eyebrow | Plus Jakarta Sans | 10–11px | 700 | teal |
| Body paragraph | Plus Jakarta Sans | 14–15px | 400 | body (#4A5568) |
| Card body | Plus Jakarta Sans | 13px | 400 | body |
| Caption / label | Plus Jakarta Sans | 11–12px | 600 | muted |
| Button | Plus Jakarta Sans | 13px | 600 | — |
| Prompt example | Plus Jakarta Sans | 13px | 400 italic | navyMid |
| Tag / pill | Plus Jakarta Sans | 10–12px | 700 | — |

### Teal Heading Accent
Key words in headings get a teal underline. Never colour the text:
```jsx
<span style={{
  textDecoration: "underline",
  textDecorationColor: "#38B2AC",
  textDecorationThickness: 3,
  textUnderlineOffset: 5,
}}>word</span>
```

Underline the concept word — not the verb, not a filler word.

### Spacing
Use multiples of 4px: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48.

---

## 4. Page Layout

### Shell Structure
```
┌─────────────────────────────────────────────────────────┐
│ Site Nav (52px, navy bg)                                │
├─────────────────────────────────────────────────────────┤
│ Page Hero (white bg, border-bottom)                     │
│  - Breadcrumb                                           │
│  - Level badge + title + description + meta tags        │
│  - Progress summary (right-aligned)                     │
├─────────────────────────────────────────────────────────┤
│ Main Content (max-width 1100px, padding 0 40px)         │
│  PhaseLabel                                             │
│  Active Phase Content (full width)                      │
│  Journey Strip (full width, always visible)             │
└─────────────────────────────────────────────────────────┘
```

### Page Hero Spec
```
// Breadcrumb: Learning › Level N › [Topic Name]
// Left column (flex: 1, minWidth 320):
//   - Level badge: mint bg (#B2D8F7), teal text, pill, UPPERCASE
//   - Eyebrow descriptor
//   - h1 with teal accent underline on key word
//   - Description paragraph (14px, body colour, max 600px)
//   - Meta tag row: duration, activity count, difficulty
//
// Right column (minWidth 200, fixed):
//   - "Journey Progress" label
//   - Large number: X / [total phases]
//   - "phases completed" label
//   - Teal progress bar
```

---

## 5. The E-Learning Player

### Critical Constraint: Fixed Height
The player content area **must always be exactly 460px tall** with `overflowY: "auto"`. This never changes regardless of slide content length. The outer player card never resizes. Non-negotiable.

### Player Structure
```
┌─────────────────────────────────────────────────────────┐
│ Top bar (navy, 44px)                                    │
│  Left: SECTION NAME (uppercase, muted)                  │
│  Centre: Slide progress dots                            │
│  Right: "X / Y" count                                  │
├─────────────────────────────────────────────────────────┤
│ Progress bar (3px, teal fill, E2E8F0 track)             │
├─────────────────────────────────────────────────────────┤
│ CONTENT AREA — fixed 460px height, overflowY: auto      │
│ padding: 36px 48px                                      │
├─────────────────────────────────────────────────────────┤
│ Nav bar (white, border-top, padding 14px 28px)          │
│  Left: ← Previous  Centre: SECTION NAME  Right: Next → │
└─────────────────────────────────────────────────────────┘
```

Nav bar inline: `[← Previous]` — `[dots · counter]` — `[⛶ fullscreen] [Next →]`
Nav bar fullscreen: `[← Previous]` — `[dots · counter (centred)]` — `[Next →]`

**Slide 1 (courseIntro) exception:** On the first slide, the "← Previous" button is hidden (no previous slide exists) and the primary action button ("Start →") is placed on the **left** side of the nav bar. The centre controls remain centred, and the right side is an empty spacer. This puts the primary action where the eye naturally goes first. On slide 2+, the layout reverts to the standard Previous/Controls/Next arrangement. The "Start →" button in the courseIntro slide content is removed to avoid duplication.

### Fullscreen vs Inline Differences
| Element | Inline | Fullscreen |
|---------|--------|-----------|
| Slide padding | `14–18px` | `24–32px` |
| Progress bar height | 2px | 3px |
| Base font sizes | base | base + 2–4px |

---

## 6. Takeaway Header

**Mandatory on every slide except `courseIntro` and `bridge`.**

```
SECTION NAME   10px, bold, uppercase, #2B4C7E, tracking 0.12em
Takeaway text  18px (22px full), fontWeight 800, #1A202C, lineHeight 1.25

padding: 10px 20px 8px (inline) / 16px 44px 12px (fullscreen)
border-bottom: 1px solid #E2E8F0
background: #FFFFFF
```

**Takeaway text** is a single declarative statement — what the learner carries forward. Not a question, not a heading. A statement.

**Standard section names** (always uppercase, 2–4 words, describe the narrative phase not the slide content):

| Name | Used for |
|------|---------|
| `"THE REALITY"` | Opening evidence beats |
| `"THE GAP"` | Tension beats |
| `"WHAT IS [X]"` | Definition slides |
| `"THE TECHNIQUE"` | Concept introduction |
| `"THE ANATOMY"` | Structural breakdown |
| `"IN PRACTICE"` | Judgment and application |
| `"SEE THE DIFFERENCE"` | Contrast beats |
| `"THE TOOLKIT"` | Framework overview |
| `"WRAP UP"` | Summary |

---

## 7. Next Button — Intercept System

The Next button is a multi-stage content reveal controller before it becomes a slide navigator. It never simply navigates until all in-slide steps are complete.

**The Next button label is always "Next →" regardless of what it will reveal.**

### Intercept Rules (evaluated in priority order)

| Slide Type | Next Behavior |
|-----------|--------------|
| `dragSort` | **Blocks** if any item in wrong zone — shows ✓/✗ feedback, items stay in place for user to fix |
| `buildAPrompt` | **Blocks** if no chips placed |
| `spotTheFlaw` | **Blocks** if nothing selected |
| `quiz` | **Blocks** if nothing selected |
| `sjExercise` | **Blocks** if no answer |
| `persona` (predictFirst) | **Blocks** if no option selected |
| `situationalJudgment` | **Cycles** through scenarios (0 → N−1) before advancing |
| `scenarioComparison` | First Next → second tab; second Next → advances |
| `contextBar` | Each press reveals one card (step 0→6); at 6 → advances |
| `comparison` | Steps through all tabs before advancing |
| `flipcard` | Flips next unflipped card; all flipped → advances |
| `approachIntro` | Flips next unflipped card; all flipped → advances |
| `branching` | Expands next option in order; all expanded → advances |
| `spectrum` | Steps through positions 0→1→2 before advancing |
| Last slide | Shows Reflection screen instead of advancing |
| All others | Advances immediately |

### Next Button Spec
```
padding: 8px 20px  border-radius: 24px (pill)  minHeight: 40px
font-size: 13px  font-weight: 600
Normal: background #38B2AC, color #FFFFFF
Last slide: background accentColor, color accentDark
```

Label: always `"Next →"` except last slide which reads `"Finish E-Learning →"`.

### Activity Warning
Shown above the Next button when blocked. Define `activityWarningMsg` once — never duplicate:
```
Background: #1A202C  Color: #FFFFFF  Font: 13px fontWeight 700
Padding: 8px 16px  Border-radius: 10px
Animation: warningPop 2.5s ease forwards (auto-dismisses)
```

Messages:
- `situationalJudgment` or `persona` → `"👆 Select an option before continuing"`
- `dragSort` (not all placed) → `"👆 Place all items before continuing"`
- `dragSort` (all placed, some wrong) → `"↩ Some items landed in the wrong bucket — try again"`
- All other blocked types → `"👆 Try the activity before continuing"`

---

## 8. No-Scroll Enforcement

**Zero scroll inside any slide.** No `overflowY` on any element within the content area.

Content not yet revealed must be in the DOM at full rendered size, hidden via `opacity: 0` — never `display: none` or conditional rendering. This locks card heights.

```jsx
// Correct
<div style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.3s ease' }}>
  {detailContent}
</div>

// Wrong — causes layout shift
{revealed && <div>{detailContent}</div>}
```

Layout rules to prevent overflow:
- `flex: 1` on expanding regions
- `flexShrink: 0` on fixed-height elements
- `minHeight: 0` on flex children that need to shrink
- Root slide div: `height: '100%', display: 'flex', flexDirection: 'column'`

**Scroll exceptions (only two):** `situationMatrix` and `sjExercise` — these intentionally use `overflowY: auto` due to structural complexity.

---

## 9. State Reset on Slide Change

All interactive state resets when `currentSlide` changes. Exception: `sjAnswers` persists so returning to a completed scenario shows the previous answer.

```typescript
// Reset on every slide change:
sjScenarioIdx = 0
quizSelected = null, quizAnswered = false
spectrumPos = 0
flippedCards = {}
branchingSelected = null, branchingStep = 0
copiedId = null
activeCompTab = 0
expandedSections = {}
contextStep = 0
scenarioTab = 'rushed'
expandedMatrixRow = null
placedComponents = {}
draggedChip = null
buildComplete = false, buildChecked = false
predictSelected = null, predictRevealed = false, predictChecked = false
flawSelected = null
```

---

## 10. Reflection Screen

Appears when Next is clicked on the last slide. Replaces the slide — does not navigate away.

```
Outer card: border 1.5px solid #CBD5E0, borderRadius 16
Accent line (top): 3px solid accentColor
"REFLECT" badge: #E6FFFA bg, #2B6CB0 text, uppercase, 10px
Heading: "Before you move on" — 20px fontWeight 800
Subtext: "Take 60 seconds. Two questions — no right answers." — 13px #718096

Textarea: rows 3, resize: none
border: 1.5px solid #E2E8F0, borderRadius 10
Focus: border-color turns #38B2AC
```

Navigation:
- `← Back to slides` — left, plain text, `#A0AEC0`
- `Continue to Practice →` — right, navy bg, white text, pill. Fires `onCompletePhase()`.

**Practice tool routing by level** (derive from `courseIntro.levelNumber` — never hardcode):

| Level | Route |
|-------|-------|
| L1 | `/app/toolkit/prompt-playground` |
| L2 | `/app/toolkit` |
| L3 | `/app/level-3/workflow-canvas` |
| L4 | `/app/level-4/app-designer` |
| L5 | `/app/level-5/app-evaluator` |

---

## 11. Source Citation Bar

For any slide with external data, a citation strip renders at the very bottom of the slide area.

```
padding: 4px 20px (inline) / 4px 32px (fullscreen)
border-top: 1px solid #EDF2F7  background: #FAFBFC
"Source" label: 9px bold uppercase #A0AEC0
Link: 9px #A0AEC0, underlined
```

Only renders when the slide data includes a `sourceLink` field.

---

## 12. All Slide Type Layouts

Every slide must declare a `type` field. Use only these types — do not invent new ones without extending this skill document.

---

### `courseIntro`
**isStretchType. No takeaway header.**

Two-column layout (58% left / 42% right). Every level's `courseIntro` MUST follow this pattern for visual consistency.

**Left column** (gradient background, `borderRight: 1px solid #E2E8F0`):
- Level badge: `background: accentLight, color: accentDark`, pill, 10px bold uppercase. Text: `"LEVEL N · E-LEARNING"`
- Hook headline: `fontSize: 24px` (full) / `20px` (inline), `fontWeight: 800`, `#1A202C`
- Subheading: `fontSize: 13px/12px`, `fontWeight: 600`, level accent dark color, `maxWidth: 380`
- Objectives list: eyebrow `"YOU'LL WALK AWAY WITH"` (9px uppercase `#A0AEC0`). Each item: emoji icon + text (12px, `#2D3748`, `lineHeight: 1.55`, `fontWeight: 500`). 3–4 items starting with action verbs.
- Start button: level accent dark color background, white text, `borderRadius: 24`

**Right column** (`background: #FAFBFC`, vertically centered):
- Eyebrow label: 9px uppercase `#A0AEC0` naming the level's core framework (e.g. "THE PROMPT BLUEPRINT", "THE THREE-LAYER AGENT MODEL", "WORKFLOW NODE TYPES", "THE BRIEF FRAMEWORK")
- Description: 11px `#718096` — one sentence explaining the framework
- Visual preview: 2×2 or stacked cards showing framework components. Each card: light bg + accent border, icon + label. Use the level's accent palette.
- Footer: 10px italic `#A0AEC0` — estimated time + a sentence about what the learner will build

Background gradients by level (left column only):
- L1: `linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)`
- L2: `linear-gradient(160deg, #FEFCE8 0%, #FEF9C3 50%, #F7FAFC 100%)`
- L3: `linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)`
- L4: `linear-gradient(160deg, #FFF7F4 0%, #FDEAE0 60%, #F7FAFC 100%)`
- L5: `linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)`

---

### `evidenceHero`
**Slide 2 in every module. Section label MUST be `"THE REALITY"`.** This is the first data slide the learner sees — it anchors the entire module's "why" with verifiable evidence.

Two columns (48% text / 52% visual).

**Left:** Body text — 15px, `#4A5568`, `lineHeight: 1.75`. Sets the context for the stat. Should read naturally without the visual — the visual reinforces, not replaces.

**Right:** Stat visual. Choose the visual that makes the number *feel* true:

| `visualType` | When to use | Description |
|---|---|---|
| *(default — large number card)* | Generic percentages with no relational meaning | Large number in a bordered card with accent gradient bg, ↑ arrow, source badge |
| `dotGrid` | Percentages out of 100 — visceral human scale | 10×10 grid of circles, N filled in accent color |
| `barComparison` | Multipliers or ratios comparing two groups | Two vertical bars with gap bracket showing the multiplier |
| `adoptionGap` | Two stats showing a funnel drop | Two stacked cards connected by a "but only" divider |
| `weekBlocks` | Time lost / time allocation stats | Monthly calendar grid (Mon–Fri × 4 weeks = 20 working days). N days highlighted. Includes large stat value, day numbers in cells, "REWORK" label on highlighted days, legend |

Set on the stat object: `stats: [{ value: "24%", label: "...", source: "McKinsey", visualType: "dotGrid", valueColour: "#C4A934" }]`

**`valueColour` MUST match the level's accent dark color** (from `LEVEL_ACCENT_DARK_COLORS`). This color is used for the stat number, highlighted calendar cells, bar fills, dot fills, pull-quote border, and stat highlights. Never hardcode teal — the visual must reflect the level's identity.

**Bottom (full width):** Pull-quote bar — `borderLeft: 4px solid [statColor]`, background `#F7FAFC`. Stat numbers within the quote are rendered in the stat's accent color with `fontWeight: 800`. For `weekBlocks` or similar visuals where the stat text is complex, the pull-quote should contain the full stat sentence with the source citation (e.g. "19% of the average knowledge worker's week is spent recreating information... — McKinsey Global Institute, The Social Economy").

Every evidence slide must include a graphic — text-only layout is not acceptable.

**Calendar visual design rules (`weekBlocks`):**
- Grid: 5 columns (Mon–Fri) × 4 rows (weeks) = 20 working days in a month
- Cell size: 52px fullscreen / 42px inline, borderRadius 10/8
- Lost days: `Math.round(20 × percentage / 100)` — highlighted in `statColor` (solid fill, not gradient)
- Each cell shows its day number (1–20) and lost cells show a small "REWORK" label
- Below the grid: large stat value + legend (filled square = Lost to rework, empty = Productive work)
- The visual must be immediately recognisable as a calendar — this familiarity is what makes the data stick

---

### `chart`
Two columns (1fr 1fr). Left: body text 16px. Right: eyebrow + 2–3 bar items (label + sublabel + percentage + bar, `height: 32px, borderRadius: 6`). Bottom: pull-quote bar.

---

### `pyramid`
Two columns (1fr 1fr). Left: body text. Right: 4–6 stacked pyramid layers at increasing widths (38%→100%). Bottom/active layer uses `accentColor` with `"▸ You are here"`. Bottom: pull-quote bar.

---

### `tensionStatement`
**isStretchType. Vertically and horizontally centered.**

```
padding: 32px 48px
Heading: 30px (40px full), fontWeight 800, #1A202C, whiteSpace: nowrap
Subheading: 20px (24px full), fontWeight 600, #1A202C
Footnote: 13px #718096, maxWidth 520, centered
```

Headings must each fit on **one line**. Use `whiteSpace: "nowrap"`. If text is too long, shorten it — never allow wrapping.

---

### `concept`
**With `visualId`:** Left 55% body text + pull-quote / Right 43% concept diagram panel (`background: #F7FAFC, border: 1px solid #E2E8F0, borderRadius: 12`).

**Plain (no `visualId`):** Single column, wide padding. Body text 18–22px, `lineHeight: 1.75`, pull-quote below.

Optional `eyebrow` field renders above the takeaway heading (e.g. `"WHEN TO USE ONE"`, `"THE LAYERS"`).

Pull-quote style: `borderLeft: 4px solid #38B2AC, background: #E6FFFA`, 15px italic bold.

---

### `contextBar`
3×2 grid, Next-button-reveal per card. **All 6 cards render at identical fixed height from the start.** Opacity controls visibility — never conditional rendering.

**Unrevealed card:** `border: 2px solid #E2E8F0, background: #F7FAFC`, muted text, detail + impact badge `opacity: 0`, ▸ hint visible.

**Revealed card:** colored border, `background: componentLight`, full color, detail + impact badge `opacity: 1, transition: opacity 0.3s ease`.

**Impact badge** (always in DOM): `"Without this → [specific observable consequence]"` — must describe a real consequence, never *"the output quality drops."*

Next behavior: each press reveals one card (contextStep 0→6). At 6 → advances.

---

### `rctf`
Three modes:

**Mode 1 — Static 3×2 grid:** All cards visible immediately. Grid fills available height (`flex: 1, minHeight: 0`). Each cell: KEY label + description + example + `whyItMatters` tag.

**Mode 2 — Sequential reveal (`revealOnNext: true`):** Same grid, cards reveal one-by-one. Unrevealed `opacity: 0`, revealed `opacity: 1, transition: opacity 0.35s ease`.

**Mode 3 — Two-column anatomy reveal (`revealOnNext: true` + `visualId`):** Left column shows concept diagram; right column reveals detail cards one-by-one. Diagram highlights the currently active element.

Always use canonical RCTF colours: Role `#667EEA`, Context `#38B2AC`, Task `#ED8936`, Format `#48BB78`.

---

### `scenarioComparison`
Toggle between two approaches to the same task.

**Toggle:** Two-button pill switcher, `background: #EDF2F7`. Active tab colored (red-tinted or green-tinted). `"Toggle to compare ⇄"` label above.

**Score pill (top-right):** `"X/N context elements"` — red bg for low, green for high.

**Chat bubbles:** "You say" (right-aligned, dark bg, italic) / "They deliver" (left-aligned, white bg, colored border).

Next behavior: First Next → second tab. Second Next → advances.

---

### `gapDiagram`
Two-column before/after.

**Left (red):** `background: #FFF5F5, border: 1px solid #FC818133`. Eyebrow `"LIMITED CONTEXT"`. White prompt box. Bullet list of what's missing.

**Right (teal):** `background: #E6FFFA, border: 1px solid #38B2AC33`. Eyebrow `"RICH CONTEXT"`. Prompt uses RCTF color underlines on relevant phrases. Annotation legend (9px colored pills).

**Bottom:** Insight bar (`#EBF8FF` bg, `#38B2AC33` border, 💡).

---

### `flipcard`
Two side-by-side CSS 3D flip cards. Front = "without" state, Back = "with" state.

**Front:** `background: #FFF5F5`, red badge + prompt box (red left border). `"Click to flip ↺"` hint (11px, muted).

**Back:** `background: #F0FFF4`, green badge + prompt box (green left border) + response in `#E6FFFA` box.

```css
perspective: 1000px;
transform-style: preserve-3d;
transition: transform 0.5s ease;
backface-visibility: hidden;
```

Next behavior: flips next unflipped card before advancing.

---

### `approachIntro`
Three flip cards side by side.

**Unflipped:** Large centered icon (56px), name (22px bold), tagline (15px), `"tap to explore ▸"`, `border: 2px solid #E2E8F0`.

**Flipped:** Icon + name top-left, `"WHEN TO USE"` section, `"HOW IT WORKS"` section, connection card. Colored border + top stripe.

Next behavior: flips next unflipped card before advancing.

---

### `parallelDemo`
Two-column static comparison. No interaction.

**Left:** `#FFF5F5` — `"APPROACH 1 — UNSTRUCTURED"` eyebrow (red uppercase)
**Right:** `#E6FFFA` — `"APPROACH 2 — STRUCTURED"` eyebrow (teal uppercase)

Both: inner white prompt box + output text. Optional centered italic footnote (12px).

---

### `persona` (predictFirst mechanic)
Optional — use when the goal is to show how a real person applies the framework. `situationalJudgment` is preferred for judgment-building without persona scaffolding.

Three stages on a single slide:

**Stage 1 — Predict:** Persona hero card (80px avatar, name, role) + scenario + `"Which approach fits [name]'s situation?"` + option buttons.

**Stage 2 — Selected:** Colored border on selected option. Feedback card appears. Wrong = red `"Not quite — here's why"`. Learner can re-select until correct.

**Stage 3 — Revealed (correct):** Green `"That's the best fit!"` + approach detail card showing actual prompt (italic, truncated 180 chars) + `"Why:"` explanation.

Activity gate: Blocked until an option is selected.

---

### `situationalJudgment`
**The primary mechanism for judgment-building.** Every module should include at least one.

**Persona tabs (top):** Active = navy bg white text. Inactive = `#F7FAFC` gray text.

**Scenario card:** White, `borderRadius: 10`, `slideInRight 0.3s ease`. Font `18px` (full) / `16px` (inline), `fontWeight: 700`. **Must always be visually larger than option buttons.**

**Three option buttons:** Side-by-side, equal width, **fixed height** (`90px` full / `75px` inline). Never grow when feedback reveals.

Option label rule: For a simple binary decision, use **"Yes"** and **"No"** only — never add "Maybe" or "It depends."

Option styling:
- All unselected: colored background at low opacity (`{color}08`), matching border (`{color}33`) — never plain white
- Strongest: `#F0FFF4` fill, `#68D391` border, `#276749` text
- Selected-but-not-strongest: `#FFFBEB` fill, `#F6AD55` border, `#C05621` text

**Feedback card:** Quality-coded bg. Eyebrow: `"STRONGEST CHOICE"` / `"COULD WORK"` / `"NOT THE BEST FIT"`. Uses `maxHeight` transition — must never push or resize option cards.

Next behavior: cycles through all scenarios before advancing.

---

### `situationMatrix` *(Intentional scroll)*
Three-column approach matrix.

**Column headers:** Large icon, approach name (colored), tagline (`#718096`). `border: 2px solid {color}`, gradient bg.

**"★ Best when" rows:** Colored cards (`background: ap.light`). Label + italic example.

**"◐ Also works" rows:** Neutral gray cards (`background: #F7FAFC`). Label only.

---

### `moduleSummary` — "What You've Learned" (5-Card Takeaway Slide)

**Always the final slide of every e-learning module.** This is the single most important visual the learner takes away. It must be clear, scannable, and reinforce the entire module in five cards.

---

#### Step 1: Identify the high-priority takeaways

Before designing the slide, list **all** topics covered in the module (aim for ~10 items). Then curate down to **exactly 5** using this filter:

1. **The Problem** — Why does this topic matter? What happens without it? (Ties to the `evidenceHero` reality slide)
2. **When to Act** — What are the decision criteria? When should the learner apply this? (Ties to decision/judgment slides)
3. **The Framework** — What is the core model or mental model taught? (The central concept of the module)
4. **The Quality Bar** — What makes the output trustworthy or professional? (Accountability, checks, standards)
5. **Where to Build / Next Step** — Where does the learner go to apply this? (Platforms, tools, or the toolkit)

These five categories form a narrative arc: **problem → decision → design → quality → action**. Not every module will map perfectly to all five — adapt the labels, but always keep exactly 5 cards and always follow the arc from "why" to "how" to "where".

**Rules for curating:**
- If two topics are closely related (e.g., three individual layers of a framework), combine them into one card with the framework name
- Every card must be self-contained — a learner reading only that card should understand the point
- Descriptions must be a single sentence, max two lines. If it takes more, the scope of the card is too broad — split or simplify.

---

#### Step 2: Write the card content

Each card has four fields in the data:

```typescript
{
  number: 1,              // 1–5, determines order
  label: "THE PROBLEM",   // Category label — uppercase, short (2–3 words)
  title: "19% lost to rework",  // Main heading — bold, memorable, specific
  desc: "When everyone prompts differently, the team pays in rework.",  // One sentence
  icon: "⚠️",            // Single emoji representing the concept
  color: "#C4A934",       // MUST be the level's accentDark colour for ALL cards
  light: "#FEFCE8",       // MUST be the level's accentColor at low opacity for ALL cards
  visual: "calendar",     // Visual type — see Step 3
}
```

**Colour rule (CRITICAL):** All five cards MUST use the same colour — the level's accent colour. The `color` field should be set to `accentDark` and `light` should be set to `accentColor + "18"` (or the level's light tint). Do NOT use different colours per card. The summary slide should feel unified under the level's identity.

---

#### Step 3: Design the visuals

Every card MUST have a visual in the lower section. Visuals use a shared **chip style**: white background, `borderRadius: 10`, consistent padding (`5px 10px` inline / `8px 12px` fullscreen), with a subtle border in the level's accent colour. All visuals within a slide must use the same chip dimensions.

**Visual types and when to use them:**

| `visual` value | When to use | Structure |
|---|---|---|
| `"items"` | Listing 3 consequences, symptoms, or examples | 3 chips, each with emoji + text |
| `"equation"` | Decision criteria that combine to a conclusion | 3 chips joined by `+`, then `=`, then a filled conclusion button |
| `"layers"` | A sequential framework (e.g., Input → Processing → Output) | 3 chips joined by `↓` arrows, each with icon + name + description |
| `"checklist"` | Quality criteria or accountability checks | 3 chips with emoji + text + `✓` checkmark on the right |
| `"platforms"` | Tools or platforms with logos | 3 chips with `<img>` logo + name + subtitle |

**Rules for visuals:**
- Default to 3 items per visual — but if the topic genuinely has more items (e.g. 6 node types), show ALL of them in the same stacked chip format. Every item must be visualised identically; never truncate some into a text-only footnote like "+ Condition, Handoff, Output". If a visual has more than 3 items, reduce chip padding and font size proportionally so all items fit within the card height.
- Icon size: `16px` fullscreen / `13px` inline (reduce to `14px` / `11px` when showing 4+ items)
- Text size: `11px` fullscreen / `10px` inline, colour `#4A5568`, `fontWeight: 500` (reduce to `10px` / `9px` when showing 4+ items)
- Chip border: `1px solid ${accentDark}25` — subtle, not heavy
- For `"equation"`: the conclusion button uses `accentDark` as background with white text
- For `"layers"`: each layer keeps its own framework colour for the label text, but the chip border uses the level accent
- For `"platforms"`: logos are loaded from `public/logos/brands/` as `<img>` tags, `20px` fullscreen / `16px` inline

---

#### Step 4: Card layout specification

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Card 1]  [Card 2]  [Card 3]  [Card 4]  [Card 5]                  │
│  All same  All same  All same  All same  All same                   │
│  height    height    height    height    height                     │
│  flex: 1   flex: 1   flex: 1   flex: 1   flex: 1                   │
└──────────────────────────────────────────────────────────────────────┘
```

- **Container:** `display: flex`, `alignItems: 'center'`, `gap: 10px` (fs) / `7px` (inline)
- **Each card:** Fixed `height: 380px` (fs) / `320px` (inline), `flex: 1`, `borderRadius: 14`
- **Card background:** `${accentColor}18` — very light tint of the level colour
- **Card border:** `1.5px solid ${accentDark}22`, `borderTop: 4px solid ${accentDark}`
- **Card internal layout** (top to bottom):
  1. **Label:** `11px` (fs) / `10px`, `fontWeight: 800`, `accentDark`, uppercase, `letterSpacing: 0.1em`
  2. **Title:** `17px` (fs) / `14px`, `fontWeight: 700`, `#1A202C`
  3. **Description:** `11px` (fs) / `10px`, `#718096`, `lineHeight: 1.5`
  4. **Visual:** `flex: 1`, vertically centered within remaining space

---

#### Step 5: Data structure

Add `visualId: "l2-summary"` (or the appropriate level prefix) and the `summaryCards` array to the `moduleSummary` slide in `topicContent.ts`. The renderer checks for `visualId` matching `"l2-summary"` pattern.

```typescript
{
  section: "WHAT YOU'VE LEARNED", type: "moduleSummary",
  takeaway: "You now have a framework for...",
  heading: "Your five key takeaways",
  visualId: "l2-summary",  // triggers the 5-card template
  summaryCards: [
    { number: 1, label: "THE PROBLEM", title: "...", desc: "...", icon: "⚠️", color: "#C4A934", light: "#FEFCE8", visual: "items" },
    { number: 2, label: "WHEN TO ACT", title: "...", desc: "...", icon: "🎯", color: "#C4A934", light: "#FEFCE8", visual: "equation" },
    { number: 3, label: "THE FRAMEWORK", title: "...", desc: "...", icon: "🏗️", color: "#C4A934", light: "#FEFCE8", visual: "layers" },
    { number: 4, label: "THE QUALITY BAR", title: "...", desc: "...", icon: "🛡️", color: "#C4A934", light: "#FEFCE8", visual: "checklist" },
    { number: 5, label: "WHERE TO BUILD", title: "...", desc: "...", icon: "🔧", color: "#C4A934", light: "#FEFCE8", visual: "platforms" },
  ],
  voiceover: { setup: "/audio/lXt1-sNN-setup.mp3" },
}
```

---

#### Step 6: Voiceover script

The summary voiceover should be ~45–60 seconds, covering all five takeaways in sequence:

```
"Let's recap the five things you're taking away from this module.
First, [label]: [one sentence].
Second, [label]: [one sentence].
Third, [label]: [one sentence].
Fourth, [label]: [one sentence].
And fifth, [label]: [one sentence].
Head to [toolkit tool name] to put this into practice."
```

Keep it high-level — one sentence per takeaway, no elaboration. The visual carries the detail.

---

#### Level accent colours for summary cards

| Level | `color` (accentDark) | `light` (card bg) |
|-------|---------------------|-------------------|
| L1 | `#2B6CB0` | `#B2D8F718` |
| L2 | `#C4A934` | `#FEFCE8` |
| L3 | `#1A7A76` | `#E6FFFA` |
| L4 | `#8C3A1A` | `#FFF7F4` |
| L5 | `#2E3F8F` | `#EBF4FF` |

---

#### Quality checklist

- [ ] Exactly 5 cards, no more, no less
- [ ] All cards use the same level accent colour — no per-card colour variation
- [ ] All cards have a visual — no empty card bodies
- [ ] All visuals use the shared chip style (white bg, borderRadius 10, consistent padding)
- [ ] Each visual has exactly 3 items
- [ ] Descriptions are one sentence max
- [ ] Titles are specific and memorable (not generic like "Key concept")
- [ ] The 5 cards follow the narrative arc: problem → decision → design → quality → action
- [ ] Voiceover covers all 5 takeaways in ~45–60 seconds
- [ ] `visualId` is set on the slide data to trigger the 5-card renderer

---

### `bridge`
**isStretchType. No takeaway header. Full bleed — no card border.**

**Left 60%:** Solid teal `#38B2AC` bg. White heading (26–34px bold), white body (16–18px, 90% opacity), optional CTA button (white bg, teal text, pill).

**Right 40%:** `#2C9A94` bg. Panel heading (16px bold white), bullet list (14px, 85% white opacity).

CTA link must use a real internal route — never a hash fragment.

---

### `spectrum`
Three-position interactive slider.

**Track:** `height: 8px, background: linear-gradient(accentLight, accentColor), borderRadius: 4`

**Position dots:** Active = 24px, filled teal, glow shadow. Inactive = 16px, white with teal border.

**Content panel:** `borderLeft: 3px solid #38B2AC, borderRadius: 0 12px 12px 0, background: #F7FAFC`. Animates `fadeInUp 0.3s ease` on position change.

Next behavior: steps through positions 0→1→2 before advancing.

---

### `quiz`
Standard single MCQ with explicit Check Answer step.

- Eyebrow: 10px teal uppercase, `letterSpacing: 0.12em`
- Question: 16–18px bold `#1A202C`, `maxWidth: 560`
- Options: `minHeight: 44`, circular letter badge (A/B/C/D)
- `"Check Answer"` button: appears after selection, disappears after checking
- Activity gate: Blocked until selection made

Option states: Default `1px solid C.border` / Selected `2px solid C.teal, C.tealLight bg` / Correct `C.success` / Incorrect `C.error`.

---

### `comparison`
Tabbed scenario explorer.

**Scenario banner:** `background: #F7FAFC, border: 1px solid #E2E8F0`

**Tab bar:** Three pill buttons, each with its own palette (red/yellow/green). Active = solid border + coloured bg. Inactive = gray.

**Prompt block (upper ~44%):** Dark navy background (`#1A202C`) with light text (`#E2E8F0`), monospace font, and a coloured "Prompt" badge. Left border accent matches the active tab colour. This makes the prompt visually unmistakable as "what you type into the AI."

**Analysis block (remaining height):** Soft coloured background (tab's annotBg), matching border, and a "Analysis" badge. Body text 14–16px `#4A5568`.

**Badge spec (both blocks):**
```jsx
{ fontSize: 11, fontWeight: 700, background: tc.badgeBg, color: tc.badgeText,
  borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }
```

**Rule:** The two sections must always look visually opposite — dark input vs light explanation. Never render both sections on a light background.

Next behavior: steps through all tabs before advancing.

---

### `branching`
Stacked expandable option cards.

**Scenario banner:** `background: linear-gradient(#EBF4FF, #E6FFFA)`

**Options:** Full-width, stacked. Select = expands inline with quality-coded feedback. Quality: strong = green / partial = yellow (`#FFFBEB`) / weak = red.

Next behavior: expands next option before advancing.

---

### `toolkitOverview`
Three stacked cards with staggered `fadeInUp` animation (delay `i * 0.15s`).

Each card: `border: 1px solid {color}33, background: {color}06, borderRadius: 14`. Left: icon in colored circle. Right: label (16px bold), desc (14px), `"When to use:"` in accent color.

**Bottom connector bar:** centered text describing how the toolkit layers relate.

---

### `templates`
2×2 grid of copyable prompt templates. Each card: white, `border: 1px solid #E2E8F0`. Header: name + tag pill + Copy button (right-aligned, never floated). Copy button turns green `"Copied ✓"` for 2000ms.

---

### `buildAPrompt`
Two-column drag-and-drop prompt assembly.

**Left 55%:** Task description + chip bank (Fisher-Yates shuffle on first render, order locked after). On completion: transforms to assembled prompt view.

**Right 45%:** 6 labeled drop zones. Empty = colored label pill + dashed border. Filled = solid border. Check Answers button: disabled until all placed.

Desktop: HTML5 drag and drop. Mobile: tap chip → tap slot.

Activity gate: Blocked if no chips placed at all.

---

### `dragSort`
Classify drag-and-drop. Learner drags items from source pool into labelled drop zones.

**Behaviour must match `buildAPrompt` exactly:**
- Auto-checks when the last item is dropped (300ms delay)
- ✓/✗ badge appears on each chip — correct stays green, wrong turns red
- Wrong items **stay in their zone** — they do NOT snap back to the pool
- User clicks a chip in a zone to return it to the pool, then re-drags to the correct bucket
- `dragChecked` resets to `false` on every new drag/drop or return-to-pool action, so feedback refreshes cleanly on each attempt
- If the user clicks Next with all placed but some wrong: ✓/✗ shown, items stay in place, activity warning fires

Activity gate: Blocks until every item is in the correct zone.

---

### `spotTheFlaw`
3×2 option grid. Learner identifies which option contains a flaw.

Prompt display: `background: #F7FAFC, borderLeft: 3px solid accentColor`, italic 13px.

On wrong: button turns red. On correct: button turns green with ✓. Feedback only on correct answer. Once solved, all buttons lock.

Activity gate: Blocked if nothing selected.

---

### `personaCaseStudy`
Two-column layout with predict-first quiz.

**Left:** Persona header (80px avatar, name, role, tag pills) + scenario card.

**Right:** Predict-first option buttons → on correct: `"HOW [NAME] ACTUALLY DOES IT"` card showing actual prompt (italic, truncated 180 chars) + `"Why:"` explanation in accent color.

---

### `sjExercise` *(Intentional scroll — older pattern)*
Single-scenario judgment, stacked vertically.

- Purpose banner: `background: linear-gradient(#2B4C7E, #38B2AC)`, white text
- Scenario card: `background: linear-gradient(#EBF4FF, #E6FFFA)`
- Options: stacked full-width
- Feedback: green `#F0FFF4` for correct, amber `#FFFBEB` for wrong (never red)

---

## 13. Expandable Accordion Pattern

Use when a slide contains long prompt examples, full AI output text, or multi-paragraph explanations that risk overflow within the 460px content area.

**Default state:** Scannable preview — enough to understand the point without reading every word.
**Expanded state:** Full content, with `"Show full prompt ▾"` / `"Show less ▴"` affordance.

The slide must make its pedagogical point in the collapsed state. Expansion is for optional depth, not for hiding the lesson.

Toggle style:
```jsx
{
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "6px 12px", borderRadius: 6,
  border: `1px solid ${C.border}`, background: C.bg,
  fontSize: 12, fontWeight: 600, color: C.light, cursor: "pointer",
}
```

---

## 14. Prompt Box — Universal Style

Any time prompt text appears anywhere in the e-learning, use this style:
```jsx
{
  background: "#F7FAFC",
  border: "1px solid #E2E8F0",
  borderLeft: "3px solid #38B2AC",  // override colour per context
  borderRadius: "0 8px 8px 0",
  padding: "12px 16px",
  fontSize: 13,
  fontStyle: "italic",
  color: "#2D3748",
  lineHeight: 1.6,
  wordBreak: "break-word",
  overflowWrap: "break-word",
}
```

---

## 15. Read Phase

### Layout
Two-column grid (`gridTemplateColumns: "1fr 1fr"`, gap 20px).

### Article Card Structure
```
┌─────────────────────────────────────────────────────────┐
│ Card Header (C.bg or C.successLight if done)            │
│  - "Article N · read time · Source"                     │
│  - Title (strikethrough + light colour when done)       │
├─────────────────────────────────────────────────────────┤
│ Card Body                                               │
│  - Description paragraph                                │
│  - "Read article ↗" link button                         │
│  [shown after link clicked:]                            │
│  - REFLECTION eyebrow                                   │
│  - Reflection question (13px, navyMid)                  │
│  - Textarea (min-height 80px)                           │
│  - "Submit reflection →" button (disabled if empty)     │
└─────────────────────────────────────────────────────────┘
```

Article is complete when reflection is submitted. Phase 2 is complete when all articles submitted.

Reflection questions must be specific and non-generic. Examples:
- *"In one sentence, what was the single most useful idea from this article for your day-to-day work?"*
- *"Describe one situation from your own work where this technique would have changed the outcome."*

---

## 16. Watch Phase

### Layout
Single column, stacked cards with gap 24px.

### Video Card Structure
```
┌─────────────────────────────────────────────────────────┐
│ Card Header (C.bg or C.successLight if done)            │
│  - Thumbnail placeholder (80×52px, navy bg, teal ▶)    │
│  - "Video N · duration · Channel"                       │
│  - Title (strikethrough when done)                      │
├─────────────────────────────────────────────────────────┤
│ Card Body                                               │
│  - Description paragraph                                │
│  - "▶ Watch video" button                               │
│  [shown after watch clicked:]                           │
│  - KNOWLEDGE CHECK eyebrow                              │
│  - Q1 + Q2 (independent, each with its own Check)       │
└─────────────────────────────────────────────────────────┘
```

Video complete when: (1) "Watch video" clicked AND (2) both knowledge check questions answered.

When all videos complete: full-width dark navy CTA banner. Left: mint eyebrow + white h3 + grey desc. Right: teal primary button to next phase.

---

## 17. Journey Strip

Always rendered below active phase content, full content width.

```
┌──────────────────────────────────────────────────────────────┐
│ "LEARNING JOURNEY — LEVEL N" eyebrow                        │
│ [E-Learning] › [Read] › [Watch] › [Practice]                │
└──────────────────────────────────────────────────────────────┘
```

Phase tile spec:
```jsx
{
  flex: 1, padding: "14px 16px", borderRadius: 10,
  border: active ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
  background: active ? C.tealLight : done ? C.successLight : "#FAFAFA",
}
```

Completed phase: teal checkmark badge (absolute top-right, 20px circle). Title: strikethrough + `C.light` when done. The Journey Strip is always rendered — even on the first phase.

---

## 18. State Architecture

```jsx
// Phase navigation
const [activePhase, setActivePhase] = useState("elearn");
const [phasesDone, setPhasesDone] = useState(new Set());

// E-learning player
const [slide, setSlide] = useState(0);
const [visitedSlides, setVisitedSlides] = useState(new Set([0]));
const [selectedAnswer, setSelectedAnswer] = useState(null);
const [answered, setAnswered] = useState(false);
const [spectrumPos, setSpectrumPos] = useState(2);
const [flippedCards, setFlippedCards] = useState({});

// Read phase: { [articleId]: { clicked, reflectionText, submitted } }
const [articleState, setArticleState] = useState({});

// Watch phase: { [videoId]: { clicked, quizAnswers: [null, null], quizChecked: [false, false] } }
const [videoState, setVideoState] = useState({});

const markPhaseDone = (id) => setPhasesDone(prev => new Set([...prev, id]));
const readDone = ARTICLES.every(a => articleState[a.id]?.submitted);
const watchDone = VIDEOS.every(v => videoState[v.id]?.clicked && videoState[v.id]?.quizChecked?.every(Boolean));
```

---

## 19. Content Data Structure (topicContent.ts)

All slide content is stored in `data/topicContent.ts` under key `"L-T"`. Scaffold data arrays first — no content hardcoded inside component JSX.

### SLIDES array
```typescript
const SLIDES = [
  {
    id: 1,
    section: "THE REALITY",     // UPPERCASE section name
    takeaway: "...",             // single declarative statement
    type: "evidenceHero",        // one of the types defined in §12
    heading: "...",
    body: "...",
    stats: [{ value: "X%", label: "...", source: "McKinsey", visualType: "dotGrid" }],
    pullQuote: "...",
    sourceLink: "https://...",
  },
];
```

### ARTICLES array
```typescript
const ARTICLES = [
  {
    id: "a1",
    title: "...",
    source: "Publication Name",
    readTime: "X min read",
    desc: "...",
    url: "https://...",
    reflection: "...",   // specific, non-generic reflection question
  },
];
```

### VIDEOS array
```typescript
const VIDEOS = [
  {
    id: "v1",
    title: "...",
    channel: "...",
    duration: "X min",
    desc: "...",
    url: "https://...",
    quiz: [
      { q: "...", options: ["...", "...", "...", "..."], correct: 0 },
      { q: "...", options: ["...", "...", "...", "..."], correct: 2 },
    ],
  },
];
```

### PHASES array
```typescript
const PHASES = [
  { id: "elearn",   label: "E-Learning", icon: "▶", time: "X–Y min", desc: "Interactive slide module" },
  { id: "read",     label: "Read",       icon: "◎", time: "~X min",  desc: "N articles + reflection" },
  { id: "watch",    label: "Watch",      icon: "▷", time: "~X min",  desc: "N videos + knowledge check" },
  { id: "practice", label: "Practice",   icon: "◈", time: "X min",   desc: "Practice tool →", external: true },
];
```

---

## 20. Content Authoring Rules

### Writing Evidence (Beat 1 Slides)

**Source requirements — evidence must come from:**
- Consulting research: McKinsey, Deloitte, BCG, Accenture
- Academic: MIT Sloan, Stanford, Harvard Business Review
- Platform data: Microsoft/LinkedIn Workplace Reports, GitHub, Salesforce
- Peer-reviewed research with named methodology

Unacceptable: undated reports, unnamed surveys, ranges without a specific number, blog posts without primary source.

**Stat formatting rules:**
- Use one specific number, not a range (*"62%"* not *"60–65%"*)
- The stat should be surprising enough to stop the learner
- The pull-quote must state the *implication* of the stat, not restate it
- Include the source logo from `/public/logos/` (height 24px, max-width 120px, `objectFit: contain`)

### Writing Scenarios (Beat 4 Contrast Slides)

Both sides use the same task. The "before" state must be a plausible first attempt by a capable professional — not deliberately bad. The "after" state must be built using the framework just taught, with RCTF color underlines on added components.

### Writing `courseIntro` Objectives

Each objective must:
- Start with an action verb
- Describe an outcome the learner will *have*, not a topic that will be *covered*
- Match the learning objectives in the Topic Outline exactly
- Map to one of the five narrative beats

Every objective listed in `courseIntro` must be introduced in a concept slide and tested in a judgment or quiz slide before the module ends.

### Writing `contextBar` Cards

Each component card must contain:
1. **KEY** — component name in uppercase
2. **Description** — 1–2 sentences explaining what this component is
3. **Example** — short concrete example in practice (italic)
4. **Impact badge** — `"Without this → [specific observable consequence]"` — must describe a real, observable consequence, not *"the output quality drops"*

### Writing `situationalJudgment` Scenarios

One situation, 3–4 sentences max. Universal professional task. No correct answer obvious without the framework. Introduces real constraints (time, audience, stakes, format).

Three options always:

| Quality | Label | Characteristics |
|---------|-------|----------------|
| Strongest | `"STRONGEST CHOICE"` | Applies the framework correctly for this specific situation |
| Partial | `"COULD WORK"` | Applies part of the technique but misses an important nuance |
| Weakest | `"NOT THE BEST FIT"` | Misses the point or applies the wrong approach |

Feedback must explain *why* that choice is strongest/partial/weak **in this specific situation** — not just label it. Include 3–4 scenarios per `situationalJudgment` slide.

### Writing `moduleSummary` (5-Card Takeaway)

**Follow the detailed spec in the `moduleSummary` slide type section above.** The summary process is:

1. List ~10 topics covered in the module
2. Curate to exactly 5 using the arc: problem → decision → design → quality → action
3. Write one-sentence descriptions — shorter than contextBar, a single memorable phrase
4. Choose visual types (items, equation, layers, checklist, platforms) — always 3 items per visual
5. All cards use the level's accent colour — no per-card variation

`"Use when:"` conditions must be specific and actionable — not *"when you have time"* but *"when the output will be shared externally and tone consistency matters."*

### Writing Reflection Questions

Two questions per module, written fresh each time. Never reuse across modules.

- **Question 1** — prompts application to immediate real work
- **Question 2** — prompts further exploration or curiosity
- Neither should feel like an assessment

Q1 examples: *"What's one thing from this module you'll try in your next piece of work?"*
Q2 examples: *"Where in your work do you think this technique would have the biggest impact?"*

### Tone & Voice

| Avoid | Use instead |
|-------|------------|
| "Best practice" | "Effective technique" / "Recommended approach for [situation]" |
| "You've been doing this wrong" | "Here's what most people haven't been shown" |
| "Always do X" | "For [specific situation], X tends to work best" |
| Named AI tools | "your AI tool" / "any large language model" |
| Specific job titles | "you" + description of task |

**Eyebrow labels:** ALL CAPS, 1–3 words, descriptive of what follows — not decorative.

### What Must Never Appear

| Banned content | Reason |
|---------------|--------|
| Walls of text (3+ paragraphs without visual or interactive break) | Kills engagement |
| Unattributed statistics or claims | Credibility |
| Named AI tools in scenario setups | Tool-agnostic rule |
| Function-specific job titles in scenarios | Audience universality rule |
| "One right answer" framing | Contradicts Principle 5 |
| Colored heading text | Design standard — teal underline only |
| Center-aligned body text | Brand standard — left-align always |
| Strawmanned "before" states in contrasts | Pedagogical integrity |
| Mocking or shame-adjacent language | Learner respect |

---

## 21. Slide Sequencing Guide

A typical module follows this pattern. The arc is mandatory — exact slide count is flexible.

**Total slides:** 10–16 per module. Never fewer than 8 (arc cannot be completed), rarely more than 18 (engagement drops).

| Position | Slide Type(s) | Section Name | Beat |
|----------|--------------|-------------|------|
| 1 | `courseIntro` | — | Setup |
| 2–3 | `evidenceHero`, `chart` or `pyramid` | `"THE REALITY"` | Beat 1 |
| 4 | `tensionStatement` or `gapDiagram` | `"THE GAP"` | Beat 2 |
| 5 | `concept` (plain-language definition) | `"WHAT IS [X]"` | Beat 3 |
| 6 | `concept` (decision criteria / when to use) | `"THE TECHNIQUE"` | Beat 3 |
| 7–8 | `rctf`, `contextBar`, or `toolkitOverview` | `"THE ANATOMY"` | Beat 3 |
| 9–10 | `approachIntro`, `spectrum`, or `comparison` | `"IN PRACTICE"` | Beat 3/5 |
| 11–12 | `scenarioComparison`, `parallelDemo`, or `flipcard` | `"SEE THE DIFFERENCE"` | Beat 4 |
| 13–14 | `situationalJudgment` | `"IN PRACTICE"` | Beat 5 |
| 15 | `moduleSummary` or `bridge` | `"WRAP UP"` | Bridge |

**Critical rule — Definition before judgment:** Slide 5 MUST be a plain-language definition of the core concept. Learners must be shown *what something is* before they are asked to judge *when to use it*. Never place a `situationalJudgment` or decision criteria slide before the concept has been defined.

---

## 22. Quality Checklist

Check every item before considering a module complete.

### Architecture
- [ ] Slide data added to `data/topicContent.ts` under the correct `"L-T"` key
- [ ] Topic metadata added to `data/levelTopics.ts`
- [ ] No new pages or routes created — existing pipeline handles rendering
- [ ] All links to the level page include `?level=N`
- [ ] Practice tool route derived from `courseIntro.levelNumber` — never hardcoded

### Learning Objective Alignment
- [ ] `courseIntro` objectives match the Topic Outline exactly
- [ ] Every objective is introduced in at least one concept slide before it is tested
- [ ] Every `situationalJudgment` and `quiz` slide maps to a specific learning objective
- [ ] `moduleSummary` reflects the module's actual learning objectives

### Test What You Teach
- [ ] A plain-language definition slide appears before any decision criteria or judgment slides
- [ ] For every `situationalJudgment`: identify which earlier slide taught the concept being tested
- [ ] For every `quiz`: the correct answer was stated or demonstrated earlier in the module
- [ ] "When to use" concept slides appear *before* anatomy/framework slides

### Evidence
- [ ] Every evidence slide has a graphic — text-only layout is not acceptable
- [ ] Every stat has a named, reputable source
- [ ] No stat uses a range — a specific number is cited
- [ ] The pull-quote states the implication, not a restatement
- [ ] Source logos included at `/public/logos/` for named sources
- [ ] `visualType` set on each stat

### Scenarios
- [ ] Every scenario recognisable to at least 3 different job functions
- [ ] No job titles in scenario setups
- [ ] No named AI tools in scenarios or prompt demonstrations
- [ ] The "before" state is a genuine attempt, not a strawman

### Framework
- [ ] Every framework component has: definition + example + impact of omission
- [ ] The module presents situational judgment for when to use the framework vs alternatives
- [ ] No slide implies the framework is always the correct approach

### Interactive Slides
- [ ] Situational judgment options genuinely ambiguous without the framework
- [ ] Predict-first options all plausible before outcome revealed
- [ ] Feedback for every option explains *why*, not just *what*

### Player & Layout
- [ ] No scroll inside any slide (except `situationMatrix` and `sjExercise`)
- [ ] Unrevealed content uses `opacity: 0`, never `display: none`
- [ ] No layout shifts between slides
- [ ] All cards have explicit padding (minimum `14px 16px` on all sides)
- [ ] Tension/statement slides render headings on a single line (`whiteSpace: "nowrap"`)
- [ ] Key Insight cards use the animated pulse style
- [ ] Bridge slides use real internal routes — never hash fragments
- [ ] Vertical composition balanced: no top-heavy slides with empty space below
- [ ] Interactive slides with a feedback/response card always reserve space for it (see §22a below) — the card area is present before answering, never causes layout shift when it appears

### Tone & Language
- [ ] No language implies blame, shame, or inadequacy
- [ ] No "best practice" language — all framing is situational
- [ ] All heading key words use teal underline — no colored text
- [ ] No named AI tools in teaching content

### Reflection
- [ ] Both reflection questions are fresh (not reused from another module)
- [ ] Question 1 prompts application to immediate real work
- [ ] Question 2 prompts exploration or curiosity

---

## 22a. Fullscreen Layout Rules

### Dynamic zoom (non-negotiable)

`ELearningView.tsx` uses a CSS `transform: scale()` approach to fill any screen size in fullscreen mode.

**How it works:**
- Reference baseline: 900px viewport height (progress bar 3px + nav bar ~77px = 80px overhead = 820px design height)
- `slideZoom = max(1, min(2, (windowHeight − 80) / 820))` — computed live from `window.innerHeight`
- In fullscreen, a design-height container (`position: absolute, top: 0, left: 0`) is scaled up with `transform: scale(slideZoom)` and `transformOrigin: '0 0'`
- Width: `100 / slideZoom %` pre-scale, so after scaling it fills exactly 100% of container width
- On screens ≤ 900px: `slideZoom = 1` (no scaling, content renders as designed)
- On 1080p: `slideZoom ≈ 1.22`; on 1440p: `slideZoom ≈ 1.66` (capped at 2×)

**Rules:**
- Never set fixed pixel heights on slide containers — use `flex: 1`, `height: '100%'`, or `minHeight: 0` so they fill their parent
- Never use `position: fixed` inside a slide renderer — it breaks inside the scaled container
- `fs` boolean is still valid for non-size layout decisions (padding direction, grid vs stack, etc.)

### Feedback / response card reservation (non-negotiable)

Any interactive slide that reveals a response card after the user interacts (e.g. `spotTheFlaw`, predict-first persona, quiz) **must always reserve the response area's space** — even before the user has answered.

**Pattern:**
```jsx
{/* Response area — always reserves space; content appears after interaction */}
<div style={{ flexShrink: 0, minHeight: fs ? 130 : 105 }}>
  {answered && (
    <div style={{ height: '100%', ... }}>
      response card content
    </div>
  )}
</div>
```

**Rules:**
- The wrapper `div` always renders (no conditional outer element)
- Use `minHeight` on the wrapper — not `height`, which would block the wrapper from growing if text is long
- The prompt / question / options above the wrapper use `flex: 1` so they fill available space *above* the reservation; they automatically give space to the reservation without shrinking the interactive options
- Never conditionally render the outer wrapper — only the inner card content is conditional

---

## 23. Quick Reference — How to Use This Skill

When asked to build a new e-learning module:

1. **Read this skill in full before writing any code.**
2. **Obtain the Topic Outline** — topic title, learning objectives, slide-by-slide content plan, article URLs, video URLs for the specific module being built.
3. Determine the correct `"L-T"` key (e.g. `"3-2"` for Level 3, Topic 2).
4. Scaffold the data arrays first (`SLIDES`, `ARTICLES`, `VIDEOS`, `PHASES`) in `data/topicContent.ts`.
5. Add topic metadata to `data/levelTopics.ts`.
6. Test at `/app/level?level=N` — no new pages or routes needed.
7. Validate against the §22 Quality Checklist and §20 Content Authoring Rules before presenting output.

**Do not ask the user to choose a layout, colour scheme, or component style.** These are defined here. Your only creative input is the content — not the design.

**Do not create standalone marketing pages, Vercel serverless functions, or any files in the `api/` directory.** All course content lives in the app dashboard via the existing player pipeline.
