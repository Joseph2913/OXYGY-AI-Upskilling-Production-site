# STRUCTURE PRD: Oxygy E-Learning Module System
### Version 1.0 — Replication Reference for New Modules

> This document defines every technical and visual specification needed to build a new e-learning module from scratch. It covers architecture, player mechanics, all slide type layouts, interactive patterns, animations, and state management. Read this alongside CONTENT-PRD.md before building any new module.

---

## 1. Architecture & File Map

### Where E-Learning Lives
Course content is always built inside the app dashboard, never on the marketing site.

| Path | Purpose |
|------|---------|
| `/app/level?level=N` | URL for any level's content. Always include `?level=N` — bare `/app/level` falls back to the user's active level, which may not be the intended one |
| `pages/app/AppCurrentLevel.tsx` | Orchestrator — reads `?level=` param, loads topic content, passes to phase views |
| `components/app/level/ELearningView.tsx` | The e-learning player — renders all slides |
| `data/topicContent.ts` | All slide data, stored under key `"L-T"` (e.g. `"1-1"` = Level 1, Topic 1) |
| `data/levelTopics.ts` | Topic metadata: level number, name, tagline, accent colors, topics array |

### Adding a New Topic
1. Add slide data to `data/topicContent.ts` under a new `"L-T"` key
2. Add topic metadata to `data/levelTopics.ts`
3. No new pages or routes needed — the existing pipeline handles rendering automatically
4. Test at `/app/level?level=N`

### Navigation Rules
- Every component that links to the level page must include `?level=N`
- Breadcrumb: `← Back to My Journey` — links to `/app/journey`
- Journey Strip is always visible below content, showing all phases with completion state

---

## 2. Level Roadmap & Topic Progression

### Level Structure (levelTopics.ts)
Each level entry requires:

```typescript
{
  level: number,             // 1–5
  name: string,              // e.g. "AI Fundamentals & Awareness"
  tagline: string,           // short descriptor shown on level card
  accentColor: string,       // e.g. "#A8F0E0" — mint for Level 1
  accentDark: string,        // e.g. "#1A6B5F" — used for text on accent bg
  topics: Topic[]
}
```

Each topic entry:
```typescript
{
  id: string,                // e.g. "1-1"
  title: string,
  phases: 2,                 // always 2: E-Learn + Practise
}
```

### Status Badge Logic
| State | Condition | Display |
|-------|-----------|---------|
| Complete | `completedAt !== null` | Green "Complete" badge |
| In Progress | First incomplete topic | Orange "In Progress" badge |
| Locked | No prior topic complete | Gray, no CTA |

Active topic = first topic where `completedAt === null`. If all complete, defaults to last topic.

### Level Card (LevelCard.tsx)
**Collapsed view:** level badge, name, tagline, status badge, CTA button  
**Expanded view:** topic list left, phase stepper right  
Phase stepper: circles with connector lines, hover tooltips showing phase detail  
Level badge circle shifts color based on completion state using `accentColor` at different opacities

---

## 3. Scoring & Progression

### Database Fields (Supabase — topic_progress table)
| Field | Type | Notes |
|-------|------|-------|
| `current_phase` | int | 1 = E-Learn, 2 = Practise |
| `current_slide` | int | 1-indexed |
| `visited_slides` | int[] | Array of slide numbers viewed |
| `elearn_completed_at` | timestamp | null until E-Learn finished |
| `practise_completed_at` | timestamp | null until Practise finished |
| `completed_at` | timestamp | null until both phases done |

### Write Pattern
- Slide advance: optimistic local state update → debounced 500ms Supabase write via `dbUpdateSlide`
- Phase complete: `completePhaseDb()` + `logActivity('phase_completed')` → phase counter increments, slide resets to 0
- Topic complete: `completeTopic()` + `logActivity('topic_completed')` → checks if all topics done → fires `logActivity('level_completed')`

### No-Auth Fallback
Renders full content with empty progress state. `phaseCompletions: [false, false]`. Unauthenticated users can view but progress is not saved.

---

## 4. Player Shell

### Dimensions
```
height: calc(100vh - 260px)
minHeight: 440px
maxHeight: 740px
```
**Never hardcode a pixel height.** Fullscreen expands to full viewport.

### Player Card Style
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 16px;
box-shadow: 0 2px 24px rgba(0,0,0,0.05);
overflow: hidden;
```

### Layer Stack (top to bottom)
```
┌──────────────────────────────────────────┐
│  TOP BAR — 44px, navy #1A202C            │
│  Left: section name (10px, muted, caps)  │
│  Center: progress dots                   │
│  Right: "X / Y" count                   │
├──────────────────────────────────────────┤
│  PROGRESS BAR — 2px inline / 3px full    │
│  Fill: accentColor  Track: #E2E8F0       │
├──────────────────────────────────────────┤
│  CONTENT AREA — fills remaining height   │
│  padding: 14–18px inline / 24–32px full  │
│  No overflow, no scroll (see §8)         │
├──────────────────────────────────────────┤
│  NAV BAR — white, border-top #E2E8F0     │
│  padding: 14px 28px                      │
│  Left: ← Previous  Center: section name │
│  Right: Next → or "Finish E-Learning →" │
└──────────────────────────────────────────┘
```

### Fullscreen vs Inline Differences
| Element | Inline | Fullscreen |
|---------|--------|-----------|
| Outer shell | White | Black outer, white content |
| Top bar | Not present | Navy 48px |
| Nav bar bg | White | Navy `#1A202C` |
| Nav bar border | `1px solid #E2E8F0` | `1px solid #2D3748` |
| Previous button | `border: 1px solid #E2E8F0`, navy text | `border: 1px solid #4A5568`, `#E2E8F0` text |
| Progress bar height | 2px | 3px |
| Progress bar track | `#E2E8F0` | `#2D3748` |
| Slide padding | `14–18px` | `24–32px` |
| Base font sizes | base | base + 2–4px |

### Fullscreen Button
```css
animation: fsGlow 2s ease-in-out infinite;
/* Pulsing teal glow */
```
Tooltip auto-appears on load: `"View in full screen — Click here for the best learning experience"`  
Auto-dismisses after 8 seconds or on first fullscreen entry. Escape key exits fullscreen.

### Keyboard Navigation
- `ArrowRight` → next slide
- `ArrowLeft` → previous slide
- `Escape` → exit fullscreen

---

## 5. Takeaway Header

**Mandatory on every slide except `courseIntro` and `bridge`.**

This is the single most important consistency element across modules. Every learner sees a fixed header strip above slide content that names the section and states the key takeaway.

```
┌─────────────────────────────────────────────┐
│ SECTION NAME        ← 10px, bold, uppercase,│
│                       #2B4C7E, tracking 0.12em │
│ Takeaway text       ← 18px (22px full),     │
│                       fontWeight 800, #1A202C│
│                       lineHeight 1.25        │
└─────────────────────────────────────────────┘
padding: 10px 20px 8px (inline) / 16px 44px 12px (fullscreen)
border-bottom: 1px solid #E2E8F0
background: #FFFFFF
```

**Section names** group slides into phases (e.g. "THE REALITY", "SEE THE DIFFERENCE", "THE TOOLKIT"). Each module defines its own section names matching its narrative arc.

**Takeaway text** is a single declarative statement — what the learner carries forward. Not a question. Not a heading. A statement.

---

## 6. Progress Dots

| State | Width | Height | Color |
|-------|-------|--------|-------|
| Active | 22px (inline) / 24px (full) | 8px | `#38B2AC` |
| Visited | 8px | 8px | `#4A5568` |
| Unvisited | 8px | 8px | `#2D3748` |

```css
border-radius: 4px;
transition: all 250ms ease;
cursor: pointer; /* only if in visitedSlides */
```

Dots are clickable only for slides in the `visitedSlides` set. Clicking jumps to that slide.

---

## 7. Next Button — Complete Intercept System

The Next button is a multi-stage content reveal controller before it becomes a slide navigator. It never simply navigates until all in-slide steps are complete.

### Intercept Rules (evaluated in priority order)

| Slide Type | Next Behavior |
|-----------|--------------|
| `buildAPrompt` | **Blocks** if no chips placed — shows activity warning |
| `spotTheFlaw` | **Blocks** if nothing selected — shows activity warning |
| `quiz` | **Blocks** if nothing selected — shows activity warning |
| `sjExercise` | **Blocks** if no answer — shows activity warning |
| `persona` (predictFirst) | **Blocks** if no option selected — shows activity warning |
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

### Activity Warning
```
Text: "Try the activity before proceeding"
Background: dark navy #1A202C
Color: white
Font: 13px bold
Border-radius: 10px
Padding: 8px 16px
Position: above nav bar
Animation: warningPop 2.5s ease forwards (auto-dismisses, no button)
```

---

## 8. No-Scroll Enforcement

**Zero scroll inside any slide.** No `overflowY` on any element within the content area.

### How to Handle Content Visibility Without Scroll
Content that hasn't been revealed yet must be in the DOM at full rendered size, hidden via `opacity: 0` — never `display: none` or conditional rendering. This locks card heights before and after reveal — no layout jumps.

```jsx
// Correct — opacity controls visibility, layout is always present
<div style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.3s ease' }}>
  {detailContent}
</div>

// Wrong — causes layout shift when revealed
{revealed && <div>{detailContent}</div>}
```

### Layout Rules to Prevent Overflow
- Use `flex: 1` on expanding regions
- Use `flexShrink: 0` on fixed-height elements
- Use `minHeight: 0` on flex children that need to shrink into parent bounds
- Root slide div: `height: '100%', display: 'flex', flexDirection: 'column'`

### Scroll Exceptions (Only Two)
These two slide types contain intentional `overflowY: auto` because their content structurally cannot fit within the frame:
- `situationMatrix` — complex multi-row approach comparison matrix
- `sjExercise` — older judgment pattern with longer scenario content

All other slide types must fit without scroll.

---

## 9. Layout Modes (isStretchType)

| Mode | Value | Used By |
|------|-------|---------|
| Default | `justifyContent: 'flex-start'` | All slide types not listed below |
| Stretch | `justifyContent: 'stretch'` | `courseIntro`, `bridge`, `tensionStatement` |

Stretch mode makes content fill the full frame height. Default anchors content to the top.

---

## 10. State Reset on Slide Change

All interactive state resets when `currentSlide` changes. Exception: `sjAnswers` persists intentionally so returning to a completed scenario shows the previous answer.

State to reset on every slide change:
```typescript
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

Any new interactive state added to a slide type must be added to this reset block.

---

## 11. Source Citation Bar

For any slide with external data, a citation strip renders at the very bottom of the slide area, above the nav bar.

```
padding: 4px 20px (inline) / 4px 32px (fullscreen)
border-top: 1px solid #EDF2F7
background: #FAFBFC
"Source" label: 9px bold uppercase #A0AEC0 letterSpacing 0.08em
Link: 9px #A0AEC0, underlined, overflow hidden, textOverflow ellipsis
```

Only renders when the slide data includes a `sourceLink` field.

---

## 12. Reflection Screen

Appears when Next is clicked on the last slide. Replaces the slide — does not navigate away.

```
Outer card: border 1.5px solid #CBD5E0, borderRadius 16, boxShadow 0 4px 24px rgba(0,0,0,0.07)
Accent line (top): 3px solid accentColor
"REFLECT" badge: #E6FFFA bg, #1A6B5F text, uppercase, 10px
Heading: "Before you move on" — 20px fontWeight 800
Subtext: "Take 60 seconds. Two questions — no right answers." — 13px #718096
```

Two open-ended textarea questions (written fresh per module — see Content PRD §8):
```
Textarea: rows 3, resize: none
border: 1.5px solid #E2E8F0, borderRadius 10
Focus: border-color turns #38B2AC
```

Navigation:
- `← Back to slides` — left, plain text, `#A0AEC0`
- `Continue to Practice →` — right, navy `#1A202C` bg, white text, pill shape. Fires `onCompletePhase()`.

---

## 13. All Slide Type Layouts

### `courseIntro`
**isStretchType. No takeaway header.**  
Two columns:

**Left 58%** — `background: linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)`, `borderRight: 1px solid #E2E8F0`:
- Level badge: `background: accentLight, color: accentDark`, pill, 10px bold uppercase. Text: `"LEVEL N · E-LEARNING"`
- Hook headline: two lines — line 1 navy bold, line 2 teal (or teal-underlined key word)
- Description: 12px, `#4A5568`, maxWidth 380
- Objectives list: eyebrow `"YOU'LL WALK AWAY WITH"` (9px uppercase `#A0AEC0`). Each item: emoji icon (13px) + text (12px `#2D3748` lineHeight 1.55 fontWeight 500). 3–4 items starting with action verbs.
- Start button: teal `#38B2AC`, white, `borderRadius: 24`, 13px bold

**Right 42%** — `#FAFBFC` background:
- Eyebrow + one-line description
- Framework preview grid (2×3 or 3×2): each cell `background: componentLight`, `border: 1.5px solid {componentColor}30`, `borderRadius: 10`, `padding: 10px 12px`, icon + label. Previews the core framework being taught.
- Italic footnote (12px `#718096`)

---

### `evidenceHero`
Two columns (50%/50%):

**Left:** Body text only — 15px, `#4A5568`, `lineHeight: 1.75`

**Right:** Large stat card:
```
borderRadius: 24
border: 2.5px solid #38B2AC
background: linear-gradient(to bottom right, #E6FFFA, #EBF8FF, #FFFFFF)
box-shadow: 0 0 0 8px #38B2AC12
```
Inside: ↑ arrow (32px teal) + stat value (88px fontWeight 900 teal) + label (16px `#2D3748`) + desc (13px `#718096`) + source badge (white pill, `border: 1px solid #E2E8F0`)

**Bottom (full width):** Pull-quote bar (see §15)

---

### `chart`
Two columns (1fr 1fr):

**Left:** Body text — 16px, `lineHeight: 1.75`

**Right:** Eyebrow label (12px bold uppercase `#A0AEC0`) + 2–3 bar items:
- Each: label + sublabel + percentage value + bar
- Bar: `height: 32px, borderRadius: 6, background: #F7FAFC`, overflow hidden with colored fill
- Source citation: italic 10px at bottom

**Bottom:** Pull-quote bar

---

### `pyramid`
Two columns (1fr 1fr):

**Left:** Body text

**Right:** 4–6 stacked pyramid layers, centered at increasing widths (38% → 50% → 65% → 82% → 100%):
- Each: `padding: 8px 12px, borderRadius: 6, textAlign: center`
- Bottom/active layer: level `accentColor` bg, white text
- Upper layers: increasingly muted fills
- Active layer gets `"▸ You are here"` label

**Bottom:** Pull-quote bar

---

### `scenarioComparison`
Toggle between two approaches to the same task.

**Toggle:** Two-button pill switcher — `background: #EDF2F7, border: 1px solid #E2E8F0, borderRadius: 14`. Active tab is colored (red-tinted or green-tinted). `"Toggle to compare ⇄"` label above.

**Score pill (top-right):** `"X/N context elements"` — red bg for low score, green for high.

**Chat bubbles:**
- "You say" (right-aligned): `background: #2D3748`, white italic text, `borderRadius: 16px 4px 16px 16px`
- "They deliver" (left-aligned): white bg, colored border matching quality, `borderRadius: 4px 16px 16px 16px`

**Expandable checklist:** Dashed-border button → opens RCTF component chips (green ✓ or red ✗)

**Next behavior:** First Next → switches to second tab. Second Next → advances slide.

---

### `contextBar`
3×2 grid, click-to-reveal per card. **All 6 cards render at identical fixed height from the start.** Opacity controls visibility — never conditional rendering.

**Unrevealed card:**
```
border: 2px solid #E2E8F0
background: #F7FAFC
text: muted colors
detail + impact badge: opacity 0
▸ hint visible
```

**Revealed card:**
```
border: colored (component color)
background: componentLight
text: full color
detail + impact badge: opacity 1, transition: opacity 0.3s ease
▸ hint disappears
```

**Impact badge** (always in DOM at full size): `white bg, border: 1px solid {color}44, borderRadius: 8, accent text`. Format: `"Without this → [consequence]"`

**Instruction banner:** Swaps when all 6 revealed (see §16 for banner spec).

**Next behavior:** Each press reveals one card (contextStep 0→6). At 6 → advances slide.

---

### `buildAPrompt`
Two-column drag-and-drop prompt assembly.

**Left 55%:**
- `"THE TASK"` eyebrow + task description
- Chip bank: unplaced chips as gray draggable cards, shuffled randomly on first render (Fisher-Yates), order locked after
- On completion: transforms to assembled prompt view — prompt box (borderLeft 3px solid `#38B2AC`, italic 12px) + insight card (`#EBF8FF` bg, `#38B2AC33` border, 💡)

**Right 45%:** 6 labeled drop zones — one per framework component:
- Empty: colored label pill + dashed border
- Filled: solid border, chip shown in slot
- Check Answers button: disabled/gray until all placed, navy when enabled

**On correct:** ✓ marks appear, 600ms delay, left column transforms to assembled prompt view.

**Desktop drag behavior:** Dragging chip dims it to `opacity: 0.4`. Drop zone highlights on `dragOver`.

**Mobile tap behavior:** Tap chip → turns dark navy (selected). Tap slot → places chip. Tap filled slot → returns chip to bank.

**Activity gate:** Blocked if no chips placed at all.

---

### `spotTheFlaw`
3×2 option grid, immediate feedback.

**Prompt display:** `background: #F7FAFC, border: 1px solid #E2E8F0, borderLeft: 3px solid accentColor`, italic 13px

**Six option buttons in 3×2 grid:** All same size, use RCTF component colors. On wrong: button turns red. On correct: button turns green with ✓ prefix.

**Feedback:** Only shows on correct answer (`#F0FFF4`, green border). Red button state is sufficient feedback for wrong answers.

Once solved, all buttons lock — no further clicks. **Activity gate:** Blocked if nothing selected.

---

### `approachIntro`
Three flip cards side by side.

**Unflipped face:**
```
Large centered icon (56px)
Name: 22px bold #4A5568 centered
Tagline: 15px #718096 centered
"tap to explore ▸" hint: #CBD5E0
Border: 2px solid #E2E8F0, top 5px solid #CBD5E0
```

**Flipped face:**
```
Icon + name top-left
"WHEN TO USE" section
"HOW IT WORKS" section
Connection card: border 1.5px solid {color}55, white bg
Border: colored + colored top stripe
transition: all 0.2s ease
```

Instruction banner swaps when all 3 flipped. Clicking a card flips it. **Next behavior:** Flips next unflipped card before advancing.

---

### `persona` (predictFirst mechanic)
Three-stage engagement on a single slide. No navigation between stages.

**Stage 1 — Predict:**
- Persona hero card: 80px circle avatar, name (20px bold), role (14px), approach tag pills
- Scenario description below
- `"Which approach fits [name]'s situation?"` question
- Option buttons: `flex: 1 1 120px, wrap`
- `"Pick one to see the answer"` hint badge

**Stage 2 — Selected (before correct):**
- Selected option shows colored border/bg
- Feedback card appears: `fadeInUp 0.25s ease`
- Wrong = red card `"Not quite — here's why"`. Learner can re-select until correct.

**Stage 3 — Revealed (correct):**
- Green feedback card `"That's the best fit!"`
- Approach detail card in persona's accent color: eyebrow `"HOW [NAME] ACTUALLY DOES IT"`, prompt text (italic, truncated at 180 chars via ExpandableText), `"Why:"` explanation in accent color

**Activity gate:** Blocked until an option is selected.

---

### `situationalJudgment`
Multi-scenario judgment exercise with persona tabs.

**Persona tabs (top):** Pill buttons. Active = navy bg white text. Inactive = `#F7FAFC` gray text.

**Persona header card:** `background: #F7FAFC, border: 1px solid #E2E8F0`, icon + name + role

**Scenario card:** White, `borderRadius: 10, border: 1px solid #E2E8F0`. Animates in with `slideInRight 0.3s ease` on scenario switch.

**Three option buttons:** Side-by-side, `flex: 1`, equal width. No submit — selecting = immediate feedback. Option border/bg updates: strongest → green, selected-but-wrong → orange, unselected → no change.

**Feedback card:** Quality-coded bg. Eyebrow label: `"STRONGEST CHOICE"` / `"COULD WORK"` / `"NOT THE BEST FIT"`.

**Next behavior:** Cycles through all scenarios before advancing. Switching scenario tab resets the selected option.

---

### `sjExercise` *(Intentional scroll — older pattern)*
Single-scenario judgment, stacked vertically.

- Purpose banner: `background: linear-gradient(#2B4C7E, #38B2AC)`, `borderRadius: 10`, white text, 🎯 icon
- Scenario card: `background: linear-gradient(#EBF4FF, #E6FFFA)`, detail bullets as navy-bordered pill chips
- Options: stacked full-width (not side-by-side)
- Feedback: green `#F0FFF4` for correct, amber `#FFFBEB` for wrong (never red)

---

### `situationMatrix` *(Intentional scroll)*
Three-column approach matrix.

**Column headers:** Large icon (28px inline / 36px full), approach name (14–16px bold in approach color), tagline (11–12px `#718096`). `border: 2px solid {color}`, gradient bg.

**"★ Best when" rows:** Colored cards — `background: ap.light, border: 1.5px solid {color}50`. Label (12px bold `#1A202C`) + italic example (10–11px `#718096`).

**"◐ Also works" rows:** Neutral gray cards — `background: #F7FAFC, border: 1px solid #E2E8F0`. Label only, no example text.

---

### `moduleSummary`
Two-section summary filling the frame.

**Section 1 (framework grid):** White card, `border: 1.5px solid #E2E8F0, borderRadius: 14`. 3×2 grid — each component card: `background: componentLight, border: 1.5px solid {color}55`. Component name (17–19px fontWeight 900) + one-line description (13–15px `#4A5568`).

**Section 2 (approaches):** 3 cards in a row. Each: `background: ap.light, border: 1.5px solid {color}55, borderTop: 3px solid {color}`. Icon + name + `"Use when:"` in bold accent color + condition text.

---

### `bridge`
**isStretchType. No takeaway header. Full bleed — no card border.**

**Left 60%:** Solid teal `#38B2AC` bg. White heading (26–34px bold), white body (16–18px, 90% opacity), optional CTA button (white bg, teal text, pill).

**Right 40%:** `#2C9A94` bg. Panel heading (16px bold white), bullet list (14px, 85% white opacity).

---

### `tensionStatement`
**isStretchType. Vertically and horizontally centered.**

```
padding: 32px 48px
Heading: 30px (40px full), fontWeight 800, #1A202C, whiteSpace: nowrap
Subheading: 20px (24px full), fontWeight 600, #1A202C — supports TealPhrase for inline teal highlight
Footnote: 13px #718096, maxWidth 520, centered
```

---

### `gapDiagram`
Two-column before/after with annotated prompt.

**Left (red):** `background: #FFF5F5, border: 1px solid #FC818133`. Eyebrow `"LIMITED CONTEXT"` in red. White prompt box inside. Bullet list of what's missing.

**Right (teal):** `background: #E6FFFA, border: 1px solid #38B2AC33`. Eyebrow `"RICH CONTEXT"` in teal. White prompt box using `AnnotatedPrompt` component — RCTF color underlines on relevant phrases. Annotation legend at bottom (9px colored pills).

**Bottom:** Insight bar (`#EBF8FF` bg, `#38B2AC33` border, 💡)

---

### `rctf`
3×2 grid. No interaction — all content visible immediately.

Each cell:
```
border: 1px solid {color}33
background: {color}08
border-radius: 10
KEY: 11px bold uppercase
description: 11–12px #4A5568
example: italic, borderTop: 1px solid #E2E8F0
whyItMatters: white bg, border: 1px solid {color}22, accent text
```

---

### `toolkitOverview`
Three stacked cards with staggered `fadeInUp` animation (delay `i * 0.15s`):

Each card: `border: 1px solid {color}33, background: {color}06, borderRadius: 14, padding: 14px 18px`  
Left: icon in colored circle (`background: {color}15, borderRadius: 12, 36px`)  
Right: label (16px bold), desc (14px `#4A5568`), `"When to use:"` in accent color

**Bottom connector bar:** `#F7FAFC`, centered text describing how the toolkit layers relate.

---

### `concept` (with visualId)
Left 55% / right 43%:

**Left:** Body text (16–17px, `lineHeight: 1.75`) + pull-quote at bottom  
**Right:** `background: #F7FAFC, border: 1px solid #E2E8F0, borderRadius: 12, padding: 18px 22px`. Renders a named concept diagram.

Pull-quote: `borderLeft: 4px solid #38B2AC, background: #E6FFFA`, 15px italic bold

---

### `concept` (plain — no visualId)
Single column, wide padding (`22px 36px` inline / `36px 64px` full):

Body text: 18–22px, `lineHeight: 1.75`, pull-quote below

---

### `spectrum`
Three-position interactive slider.

**Track:** `height: 8px, background: linear-gradient(accentLight, accentColor), borderRadius: 4`

**Position dots:**
- Active: 24px, filled teal, `boxShadow: 0 2px 8px rgba(56,178,172,0.4)`
- Inactive: 16px, white with teal border

**Content panel:** `borderLeft: 3px solid #38B2AC, borderRadius: 0 12px 12px 0, background: #F7FAFC`. Animates in with `fadeInUp 0.3s ease` on position change.

**Next behavior:** Steps through positions 0→1→2 before advancing.

---

### `quiz`
Standard single MCQ with explicit Check Answer step.

- Eyebrow: 10px teal uppercase, `letterSpacing: 0.12em`
- Question: 16–18px bold `#1A202C`, `maxWidth: 560`
- Options: `minHeight: 44`, circular letter badge (A/B/C/D) left-aligned, 24px circle
- Badge updates: ✓ green / ✗ red after check
- `"Check Answer"` button: appears only after selection, disappears after checking
- Feedback: `fadeInUp 0.3s ease`
- **Activity gate:** Blocked until selection made

---

### `comparison`
Tabbed scenario explorer.

**Scenario banner:** `background: linear-gradient(#E6FFFA, #EBF8FF), border: 1.5px solid #38B2AC33`

**Tab bar:** `borderBottom: 2px solid #E2E8F0`. Active tab: `borderBottom: 3px solid #38B2AC` (overlaps bar by 1px), teal text.

**Prompt box:** `borderLeft: 3px solid #38B2AC`, italic. Annotation below in `#F7FAFC`.

Content animates `fadeInUp 0.2s ease` on tab switch.

**Next behavior:** Steps through all tabs before advancing.

---

### `flipcard`
Two side-by-side CSS 3D flip cards.

**Front:** `background: #FFF5F5`, red badge + label + prompt box (red left border). `"Click to flip ↺"` hint at bottom in `#A0AEC0`.

**Back:** `background: #F0FFF4`, green badge + label + prompt box (green left border) + response in `#E6FFFA` rounded box.

```css
perspective: 1000px;
transform-style: preserve-3d;
transition: transform 0.5s ease;
backface-visibility: hidden;
/* flip: transform: rotateY(180deg) */
```

**Next behavior:** Flips next unflipped card before advancing.

---

### `branching`
Stacked expandable option cards.

**Scenario banner:** `background: linear-gradient(#EBF4FF, #E6FFFA)`

**Options:** Full-width, stacked. Select = expands inline with quality-coded feedback panel.

Feedback sections: quality badge + response text + `"REFLECTION"` section (below divider)

Quality colors: strong = green / partial = yellow (`#FFFBEB`, `#F6E05E`) / weak = red

**Next behavior:** Expands next option before advancing.

---

### `parallelDemo`
Two-column static comparison. No interaction.

**Left:** `#FFF5F5` — `"APPROACH 1 — UNSTRUCTURED"` eyebrow (red uppercase)  
**Right:** `#E6FFFA` — `"APPROACH 2 — STRUCTURED"` eyebrow (teal uppercase)  
Both: inner white prompt box + output text. Optional centered italic footnote (12px).

---

### `templates`
2×2 grid of copyable prompt templates.

Each card: white, `border: 1px solid #E2E8F0`. Header row: name + tag pill + Copy button (right-aligned).

Copy button: turns green `"Copied ✓"` for 2000ms. Template text: 10px, `background: #F7FAFC`, `maxHeight: 140px` (inline) / `260px` (full).

---

### `personaCaseStudy`
Two-column layout with predict-first quiz.

**Left:** Persona header (circle avatar 80px, name 20px bold, role 14px, tag pills) + scenario card (colored gradient header + white body)

**Right:** Predict-first option buttons → on correct: `"HOW [NAME] ACTUALLY DOES IT"` card showing actual prompt (italic, truncated to 180 chars) + `"Why:"` explanation in accent color

---

### `approachMatrix`
Hover-to-reveal matrix grid. Cells: 28×28px, `borderRadius: 8`.

- Best fit: green
- Also works: yellow
- Neutral/not ideal: gray

Hover tooltip: `position: absolute, bottom: 100%, background: #1A202C, 10px, zIndex: 10`

---

## 14. Universal Component Patterns

### Pull-Quote Bar
Used on `evidenceHero`, `chart`, `pyramid`, `concept`. Always at the bottom of the slide.

```css
border-left: 4px solid #38B2AC;
background: #F7FAFC; /* or #E6FFFA for concept */
border-radius: 0 8px 8px 0;
padding: 14px 20px (inline) / 20px 28px (full);
font-size: 14–16px;
color: #4A5568;
line-height: 1.65;
```

Numbers matching `\d+%` pattern are highlighted teal via regex split.

---

### ExpandableText Component
Applies to any text exceeding its threshold.

| Context | Threshold |
|---------|-----------|
| Prompts | 180 chars |
| AI outputs | 200 chars |
| Branching options | 120 chars |
| Flipcard backs | 160 chars |

Toggle button: `padding: 3px 10px, borderRadius: 6, border: 1px solid #E2E8F0, color: #38B2AC, fontSize: 11px bold`  
Labels: `"Show full prompt ▾"` / `"Show less ▴"`  
Always `e.stopPropagation()` on click.

---

### Instruction Banner
Every interactive slide that gates Next has an instruction banner at the top. Two states in the same DOM slot — no layout shift.

**Before completion:**
```css
background: {accentColor}15;
border: 1.5px solid {accentColor}55;
border-radius: 10–12px;
padding: 7–8px 14–16px;
/* 👆 icon + instruction text */
font-size: 13px bold, color: #1A6B5F;
```

**After all items complete:**
```css
background: #F0FFF4;
border: 1.5px solid #38A16955;
/* ✓ icon + completion message */
font-size: 13px bold, color: #276749;
```

---

### Feedback Color System — Universal
Used identically across `situationalJudgment`, `sjExercise`, `persona`, `quiz`, `branching`, `spotTheFlaw`.

| Quality | Background | Border | Text |
|---------|-----------|--------|------|
| Correct / Strongest | `#F0FFF4` | `#68D391` | `#276749` |
| Partial / Could work | `#FFFBEB` | `#F6AD55` | `#C05621` |
| Wrong / Weakest | `#FFF5F5` | `#FC8181` | `#9B2C2C` |

---

### Chat Bubble Pattern
Used in `scenarioComparison`.

- **"You say" (sender, right-aligned):** `background: #2D3748`, white italic text, `borderRadius: 16px 4px 16px 16px`
- **"They deliver" (response, left-aligned):** white bg, colored border matching quality, `borderRadius: 4px 16px 16px 16px`

---

### Insight Bar
Recurring bottom-of-slide callout.

```css
background: #EBF8FF;
border: 1px solid #38B2AC33;
border-radius: 10px;
padding: 12px 18px;
/* 💡 icon (16px, flexShrink: 0) + text (13px bold #1A202C, lineHeight 1.5) */
```

---

### Eyebrow Labels
All eyebrows follow the same pattern:

```css
font-size: 10–11px;
font-weight: 700–800;
text-transform: uppercase;
letter-spacing: 0.08–0.14em;
margin-bottom: 4–8px;
```

Color by context:
- Teal `#38B2AC` — positive/outcome
- Muted `#A0AEC0` — neutral/informational
- Navy `#2B4C7E` — structural/important
- Approach accent — within approach-specific context

---

## 15. Framework Component Colors — Fixed, Never Change

These values are used identically across every level and every module. Never reassign them.

| Component | Color | Light |
|-----------|-------|-------|
| Role | `#667EEA` | `#EBF4FF` |
| Context | `#38B2AC` | `#E6FFFA` |
| Task | `#ED8936` | `#FFFBEB` |
| Format | `#48BB78` | `#F0FFF4` |
| Steps | `#9F7AEA` | `#FAF5FF` |
| Checks | `#F6AD55` | `#FFFAF0` |

---

## 16. CSS Animations

All animations are injected via a `<style>` tag. Every module must include this full set.

| Animation | Usage | Duration |
|-----------|-------|---------|
| `fsGlow` | Fullscreen button pulsing teal glow | 2s loop |
| `insightPulse` | Insight cards teal pulse | 3s loop |
| `slideInRight` | Scenario card entry (from x+30) | 0.3s ease |
| `fadeInUp` | Content reveal (from y+12) | 0.3s ease |
| `warningPop` | Activity warning auto-dismiss | 2.5s forwards |
| `flip-card` | CSS 3D card rotation | 0.5s ease |

---

## 17. Brand & Visual Tokens

### Color Palette
```javascript
const C = {
  navy:          "#1A202C",
  navyMid:       "#2D3748",
  teal:          "#38B2AC",
  tealDark:      "#2C9A94",
  tealLight:     "#E6FFFA",
  mint:          "#A8F0E0",
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
};
```

### Typography
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Page h1 | DM Sans | 28px | 800 | `#1A202C` |
| Slide h2 (inline) | DM Sans | 18–22px | 700 | `#1A202C` |
| Slide h2 (fullscreen) | DM Sans | 22–26px | 700 | `#1A202C` |
| Body | Plus Jakarta Sans | 14–15px | 400 | `#4A5568` |
| Eyebrow | Plus Jakarta Sans | 10–11px | 700 | Varies |
| Button | Plus Jakarta Sans | 13px | 600 | — |
| Prompt text | Plus Jakarta Sans | 13px | 400 italic | `#2D3748` |

Google Fonts import (required in every module):
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

### Teal Heading Underline
Key words in headings get a teal underline — **never colored text**:
```css
text-decoration: underline;
text-decoration-color: #38B2AC;
text-decoration-thickness: 3px;
text-underline-offset: 5px;
```

### Spacing
Multiples of 4px only: `4, 8, 12, 16, 20, 24, 28, 32, 40, 48`

### Borders
All cards and panels: `1px solid #E2E8F0`  
Accent left borders: `3–4px solid {color}`  
Card border-radius: `10–16px`  
Button border-radius: `24px` (pill)

---

## 18. Practice Component

Follows the same player shell as the e-learning player (same dimensions, same nav bar, same progress dots extended to include the Practise slide).

### Layout
**Left 55%:** Task brief card, example prompt pills, labeled textarea (`border: 2px solid accentColor`), Submit button (`accentDark` background)

**Right 45%:** Feedback card — placeholder state until submit, then quality-scored feedback using the same feedback color system (§14) applied per framework component

### Behavior
- `"Start Over"` resets textarea and feedback
- `"Complete Practice →"` fires `completePhase()` and navigates to next phase
- Feedback endpoint: `/api/validate-prompt`
- Uses the same `accentColor` / `accentDark` pair as the parent level for all interactive states

### Content Required per Module
- Task brief: one scenario, universal, tool-agnostic, requires all framework components
- 3–4 example prompt pills (clicking inserts text into the textarea)
- System prompt configured to score against the specific framework taught
- Feedback rubric: defines `"strong"`, `"partial"`, and `"missing"` per component for this specific module

---

## 19. Minimum Slide Set per Module

Every new module must include at minimum these four slide types, mapping to the five-beat narrative arc:

| Slide Type | Beat | Purpose |
|-----------|------|---------|
| `evidenceHero` or `evidenceHero`/`chart` | Beat 1 — Situation | Evidence-led opening |
| `contextBar` | Beat 3 — Concept | Framework reveal, click-to-explore |
| `scenarioComparison` | Beat 4 — Contrast | Technique applied vs not applied |
| `situationalJudgment` | Beat 5 — Bridge | Real-world judgment exercise |

The `courseIntro` slide always comes first (slide 0). The `bridge` or `moduleSummary` always comes last before the Reflection screen.

---

*Companion document: CONTENT-PRD.md*
