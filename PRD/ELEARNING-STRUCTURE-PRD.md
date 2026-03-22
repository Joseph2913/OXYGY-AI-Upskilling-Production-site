# STRUCTURE PRD: Oxygy E-Learning Module System
### Version 1.1 — Replication Reference for New Modules

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
| Outer shell | White card with border | White full-viewport |
| Top bar | Not present | White, 48px, minimize button only (`Minimize2` icon, `#A0AEC0`) |
| Nav bar bg | White | White |
| Nav bar border | `1px solid #E2E8F0` | `1px solid #EDF2F7` |
| Previous button | `border: 1px solid #E2E8F0`, navy text; disabled = `#CBD5E0` | Same |
| Progress bar height | 2px | 3px |
| Progress bar track | `#E2E8F0` | `#EDF2F7` |
| Progress dots + counter | Inline in nav bar (right of Previous) | Bottom centre of nav bar |
| Slide padding | `14–18px` | `24–32px` |
| Base font sizes | base | base + 2–4px |

**Nav bar layout — inline:** `[← Previous]` — `[dots · counter]` — `[⛶ fullscreen] [Next →]`

**Nav bar layout — fullscreen:** `[← Previous]` — `[dots · counter (centred)]` — `[Next →]`

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

**The Next button label is always "Next →" regardless of what it will reveal.** Never change the label to describe the upcoming step (e.g. "See Tab 2 →"). The step counter inside the slide provides position context.

### Intercept Rules (evaluated in priority order)

| Slide Type | Next Behavior |
|-----------|--------------|
| `dragSort` | **Blocks** if any item in wrong zone — if all placed but some wrong: flashes red, returns incorrect items to pool after 1.2s, shows warning |
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

### Next Button — Standard Spec
Identical in both inline and fullscreen. Do not use different sizes or weights between views.
```
padding: 8px 20px
border-radius: 24px (pill)
minHeight: 40px
border: none
font-size: 13px
font-weight: 600
font-family: inherit
display: inline-flex, align-items: center, gap: 4px
cursor: pointer
```
Colors:
- Normal slides: `background: #38B2AC`, `color: #FFFFFF`
- Last slide: `background: accentColor`, `color: accentDark`

Label: always `"Next →"` except on the last slide where it reads `"Finish E-Learning →"`.

### Activity Warning
Shown **above the Next button** in both inline and fullscreen when `needsInteraction` is true and Next is clicked. Identical spec in both views.
```
Background: #1A202C (dark navy)
Color: #FFFFFF
Font: 13px, fontWeight 700
Padding: 8px 16px
Border-radius: 10px
Box-shadow: 0 4px 16px rgba(0,0,0,0.18)
White-space: nowrap
Pointer-events: none
Animation: warningPop 2.5s ease forwards (auto-dismisses)
```

**Message text — single source of truth (derive from slide type, not duplicated):**
- `situationalJudgment` or `persona` (predictFirst) → `"👆 Select an option before continuing"`
- `dragSort` (not all placed) → `"👆 Place all items before continuing"`
- `dragSort` (all placed, some wrong) → `"↩ Some items are in the wrong layer — review and try again"`
- All other blocked slide types → `"👆 Try the activity before continuing"`

**Never duplicate this conditional** in multiple render paths. Define `activityWarningMsg` once in the component and reference it in both inline and fullscreen nav bars.

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
- `Continue to Practice →` — right, navy `#1A202C` bg, white text, pill shape. Fires `onCompletePhase()` and navigates to the **level-specific practice tool** — never hardcoded to one URL. Mapping: L1 → `/app/toolkit/prompt-playground`, L2 → `/app/toolkit`, L3 → `/app/level-3/workflow-canvas`, L4 → `/app/level-4/app-designer`, L5 → `/app/level-5/app-evaluator`. Derive the level from `courseIntro.levelNumber` in the slide data.

---

## 13. All Slide Type Layouts

### `courseIntro`
**isStretchType. No takeaway header.**

**Layout rule — full-width single column.** The `courseIntro` slide uses a single full-width column. Do not add a right-side framework preview grid. The objectives and subheading have enough space to breathe and the learner's attention should not be split on the first slide.

**Full-width column** — `flex: 1`, gradient background using the level's accent color, padding `44px 64px` (fullscreen) / `28px 40px` (inline):
- Level badge: `background: accentLight, color: accentDark`, pill, 10px bold uppercase. Text: `"LEVEL N · E-LEARNING"`
- Hook headline: `fontSize: 28px` (fullscreen) / `22px` (inline), `fontWeight: 800`, `#1A202C`
- Subheading: `fontSize: 14px/13px`, `fontWeight: 600`, in level accent dark color, `maxWidth: 600`
- Objectives list: eyebrow `"YOU'LL WALK AWAY WITH"` (9px uppercase `#A0AEC0`, `marginBottom: 12`). Each item: emoji icon (14px) + text (`14px/13px`, `#2D3748`, `lineHeight: 1.6`, `fontWeight: 500`), `gap: 10`, `marginBottom: 10`. 3–4 items starting with action verbs.
- Start button: level accent color background, white text, `borderRadius: 24`, 13px bold, `alignSelf: flex-start`

**Level accent colors for courseIntro:**
- L1: `background: #38B2AC` (teal)
- L2: `background: #38B2AC`
- L3: `background: #C4A934` (pale yellow dark)
- L4/L5: use `accentDark` for the Start button

**Background gradient by level:**
- L1: `linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)`
- L2: `linear-gradient(160deg, #FEFCE8 0%, #FEF9C3 50%, #F7FAFC 100%)`
- L3: `linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 50%, #F7FAFC 100%)`

---

### Evidence Slides (Beat 1 — Situation)

**Every module opens with 2–3 evidence slides before moving to the tension beat.** These slides establish the real-world context that makes the module relevant. They do not need to share the same layout — the goal is to build a compelling case with varied visual rhythm, not to repeat the same template.

All evidence slides must include:
- **Takeaway header** (§5) — mandatory on every evidence slide
- **Section label** — always `"THE REALITY"` or a module-specific equivalent
- **Source citation** (§11) — whenever external data is referenced
- **Pull-quote bar** (§15) — at least one evidence slide should include one

Evidence slide layouts to draw from (mix and match per module):

---

### `evidenceHero`
Two columns (50%/50%):

**Left:** Body text only — 15px, `#4A5568`, `lineHeight: 1.75`

**Right:** Stat visual — **optional**. Use when a single strong statistic reinforces the left body text. Omit when the evidence is better conveyed through body text and pull-quote alone.

#### Graphic requirement
**Every evidence slide must include a graphic.** A slide with body text and pull-quote only is not acceptable. If no single-stat visual fits, use a `chart`, `pyramid`, or custom two-column layout instead. The visual column always occupies the right 52% of the slide.

#### Text column width — standard
The text/visual split is **48% text / 52% visual** in both inline and fullscreen. This must never vary between views. Do not apply `maxWidth` caps to the body text — let it fill its column naturally.

#### Stat Visual Types
The right-hand stat panel should be visualised in the most clear and engaging way for the specific number. Do not default to a plain large-number card if a more meaningful visual exists. Choose from:

| `visualType` | When to use | Example |
|---|---|---|
| *(default — large number card)* | Generic percentages or counts with no obvious relational meaning | "74% of workers..." |
| `dotGrid` | Percentages out of 100 — makes scale visceral and human | "24%" → 24 teal dots in a 10×10 grid of 100 |
| `barComparison` | Multipliers or ratios comparing two groups | "3.4×" → two vertical bars, Others vs Top Performers |
| `adoptionGap` | Two related stats showing a funnel drop — adoption vs integration | "75%" use AI → "24%" integrate it → "51pp gap" callout |

**Set `visualType` on the stat object in `topicContent.ts`:**
```typescript
stats: [{ value: "24%", label: "...", source: "McKinsey", visualType: "dotGrid" }]
stats: [{ value: "3.4×", label: "...", source: "McKinsey", visualType: "barComparison" }]
stats: [{ value: "75%", label: "...", source: "Microsoft", visualType: "adoptionGap" }]
// omit visualType to use the default large-number card
```

**Dot Grid spec (`dotGrid`):**
- 10×10 grid of 100 circles, gap 4–5px, dot size 16–20px
- Active dots: `#38B2AC` with subtle glow ring (`box-shadow: 0 0 0 1.5px #38B2AC55`)
- Inactive dots: `#E2E8F0`
- Below grid: stat value (28–36px, bold teal) + label + source badge

**Bar Comparison spec (`barComparison`):**
- Two vertical bars side by side, aligned to a shared baseline
- "Others" bar: grey (`#E2E8F0`), baseline height (65–80px)
- "Top performers" bar: teal gradient (`#38B2AC → #2C9A94`), height = baseline × multiplier
- Centre bracket: dashed or solid line with the multiplier value (22px, bold teal)
- Labels below each bar; multiplier value above performer bar
- Below bars: label text + source badge

**Default large-number card spec:**
```
borderRadius: 24
border: 2.5px solid #38B2AC
background: linear-gradient(to bottom right, #E6FFFA, #EBF8FF, #FFFFFF)
box-shadow: 0 0 0 8px #38B2AC12
```
Inside: ↑ arrow (32px teal) + stat value (88px fontWeight 900 teal) + label (16px `#2D3748`) + desc (13px `#718096`) + source badge

**Design principle:** Always ask "what visual makes this number *feel* true?" A 24% adoption rate is more striking as a sparse dot grid than as a large number. A 3.4× performance gap is more compelling as two bars of visibly different height than as digits alone. Prefer the visual that makes the insight land without needing to be explained.

When omitted: body text expands to fill the slide, or uses a two-column split with a pull-quote panel instead of a stat card.

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
**Optional per module.** Use when the goal is to show how a real person applies the framework to their specific situation. Not every topic needs persona slides — `situationalJudgment` covers the same judgment-building goal with less scaffolding.

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
The primary mechanism for judgment-building. Preferred over `persona` when the goal is response-selection practice rather than technique demonstration. Every module should include at least one `situationalJudgment` slide — persona slides are optional.

**Layout:** Content must fill the full slide frame. No large white space areas. All sections — persona header, scenario card, option buttons, and feedback — must occupy the available height. Use `flex: 1` on expanding regions and ensure cards stretch to fill their allocated space.

**Persona tabs (top):** Pill buttons. Active = navy bg white text. Inactive = `#F7FAFC` gray text.

**Persona header card:** `background: #F7FAFC, border: 1px solid #E2E8F0`, icon + name + role

**Scenario card:** White, `borderRadius: 10, border: 1px solid #E2E8F0`. Animates in with `slideInRight 0.3s ease` on scenario switch. Font size `18px` fullscreen / `16px` inline, `fontWeight: 700`. **Must always be visually larger than the option buttons** — this hierarchy is non-negotiable.

**Three option buttons:** Side-by-side, equal width, **fixed height** — option cards must use a fixed pixel height (`height: 90px` fullscreen / `75px` inline). They must never grow or shrink when the feedback panel reveals. No submit — selecting = immediate feedback. Option button font size must always be **smaller** than the scenario card text — use `15px` fullscreen / `13px` inline (`fontWeight: 600`).

**Option label length rule:** When the judgment being tested is a simple binary decision (e.g. "should I build a workflow?", "keep or remove this step?"), options must be **"Yes"** and **"No"** only — two cards, no third option. Never add a "Maybe" or "It depends" option. The feedback card explains the nuance. Reserve longer option text only for scenarios where the options are meaningfully different techniques or approaches (e.g. choosing between named node types or mapping methods).

Option styling:
- **All unselected:** Colored background using the option's quality color at low opacity (`{color}08`), matching border (`{color}33`). Never plain white or gray — every option card is colored from the start.
- **After selection — strongest:** Green fill `#F0FFF4`, border `#68D391`, `#276749` text
- **After selection — selected-but-not-strongest:** Orange fill `#FFFBEB`, border `#F6AD55`, `#C05621` text
- **After selection — unselected remaining:** Muted but still colored, reduced opacity

**Feedback card:** Quality-coded bg. Eyebrow label: `"STRONGEST CHOICE"` / `"COULD WORK"` / `"NOT THE BEST FIT"`. Appears below the option cards using a `maxHeight` transition — must never push or resize the option cards above it. Feedback body text must be the **same font size as the option button text** (`15px` fullscreen / `13px` inline) for visual consistency across all response elements.

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
Supports three layouts depending on the data. Choose based on what best serves the content.

---

#### Mode 1 — Static 3×2 grid (default)
All cards visible immediately. No interaction.

```typescript
{ type: 'rctf', elements: [...6 items] }
```

Grid: 3 columns, fills available height (`flex: 1, minHeight: 0`). Each cell:
```
padding: 18px 20px (fullscreen) / 14px 16px (inline)
border: 1.5px solid {color}55
background: {color}08 or el.light
border-radius: 12
justifyContent: space-between
KEY: icon (22px/18px) + label (12px/11px bold uppercase in color)
description: 13px/12px #2D3748, lineHeight: 1.6
example: 12px/11px #718096 italic, borderTop: 1px solid {color}33, prefixed "e.g."
whyItMatters: white bg, border: 1px solid {color}33, accent color text, padding: 5px 10px, marginTop: auto
```

**Card sizing:** Cards must fill the slide height. Use `flex: 1` on the grid container and `minHeight: 0` to prevent overflow. Never let cards shrink to a fraction of the frame.

---

#### Mode 2 — Grid with sequential reveal (`revealOnNext`)
Same 3×2 grid, but cards reveal one-by-one as the learner clicks Next. Use when the content benefits from pacing (e.g. 6 node types — learner absorbs each before seeing the next).

```typescript
{ type: 'rctf', revealOnNext: true, elements: [...6 items] }
```

Unrevealed cards: `opacity: 0` (transparent but occupy space — layout never shifts). Revealed cards: `opacity: 1`, `transition: opacity 0.35s ease`. No visual distinction between revealed and unrevealed beyond opacity.

---

#### Mode 3 — Two-column anatomy reveal (`revealOnNext` + `visualId`)
Left column shows a concept diagram; right column reveals detail cards one-by-one as Next is clicked. The diagram dynamically highlights the currently active element. Use when introducing layered or structured concepts where a visual map and card details reinforce each other (e.g. the three-layer workflow anatomy).

```typescript
{ type: 'rctf', revealOnNext: true, visualId: 'l3-workflow-anatomy', elements: [...3 items] }
```

Layout: `display: flex`, `gap: 16px`
- **Left (38%):** `background: #F7FAFC, border: 1px solid #E2E8F0, borderRadius: 12`. Renders the named concept visual. The active element (matching `contextStep`) is highlighted: scaled up (`scale(1.02)`), full-color border and background, colored box-shadow. Elements before the active step remain visible at full opacity. Elements after the active step are dimmed (`opacity: 0.3`).
- **Right (flex: 1):** Cards reveal left-to-right one per Next click. Revealed cards slide in from the right (`translateX(12px) → 0`). Active card gets a subtle `boxShadow`. Card structure: icon + key label + description + optional example + optional `whyItMatters` tag.

State: `contextStep` drives both the anatomy highlight and card reveal. Starts at `0` — the first card and layer are always shown immediately.

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

**Eyebrow label (`eyebrow` field):** Optional. Renders above the slide heading in the takeaway header bar — 9–10px bold uppercase, `#A0AEC0`, `letterSpacing: 0.12em`. Use to give the slide a named context that the section label alone doesn't provide (e.g. `"WHEN TO USE ONE"`, `"THE LAYERS"`, `"THE TECHNIQUE"`). Eyebrows are especially useful on concept slides that introduce a specific named framework component — they orient the learner before the heading lands.

```typescript
{ type: 'concept', eyebrow: 'WHEN TO USE ONE', heading: 'Not every task needs a workflow.', ... }
```

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

### `dragSort`
Classify drag-and-drop activity. Learner drags items from a source pool into labelled drop zones.

**Layout (column, `height: 100%`, `padding: fs ? '20px 28px' : '14px 20px'`):**
1. **Context bar** — scenario description. `fontSize: 13/12`, `#718096`, `#F7FAFC` bg, `#E2E8F0` border, `borderRadius: 8`, `padding: 9px 14px / 7px 12px`
2. **Drop zones grid** — `gridTemplateColumns: 1fr 1fr 1fr`, `flex: 1, minHeight: 0`. Each zone: `2px dashed` border at `color55`, `borderRadius: 12`, `padding: 14px 12px / 10px 10px`. Zone header: icon `18/15px`, label `13/12px` bold uppercase in zone color
3. **Source pool** — below zones, `borderTop: 1px solid #E2E8F0`. Label `11/10px` uppercase gray. Items `flexWrap: wrap`, `gap: 7`
4. **Status bar** — replaces source pool when all items placed. "All placed" in teal; "All correct" in green with `#F0FFF4` bg

**Item cards:** `fontSize: 14/13`, `padding: 10px 14px / 8px 12px`, `borderRadius: 8`, `lineHeight: 1.4`, `cursor: grab`

**Item states:**
- Unplaced: white bg, `#E2E8F0` border, `#4A5568` text
- Placed (in zone): zone `light` bg, `zone.color55` border, `#1A202C` text
- `dragChecked` correct: `#F0FFF4` bg, `#68D391` border, `#276749` text + `✓`
- `dragChecked` wrong: `#FFF5F5` bg, `#FC8181` border, `#C53030` text + `✗`

**Click on placed item** → returns it to source pool (removes from `dragPlacements`).

**Next button logic:**
1. Not all placed → block + `"👆 Place all items before continuing"`
2. All placed, some wrong → `dragChecked = true` (flash colors), remove wrong items from placements after 1.2s, block + warning
3. All correct → advance

**Required `SlideData` fields:** `dragContext`, `dragZones[]` (`id, label, color, light, icon`), `dragItems[]` (`id, label, correctZone`)

**When to use:** After a concept slide that introduces a classification framework (e.g. three-layer model, node types). Tests whether learners can apply the taxonomy before seeing it in practice.

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

Every new module must follow this structure, mapping to the five-beat narrative arc:

| Slide Type | Beat | Count | Required? |
|-----------|------|-------|-----------|
| `courseIntro` | — | 1 | **Mandatory** — always slide 1 |
| Evidence slides (`evidenceHero`, `chart`, `rctf`, or any layout) | Beat 1 — Situation | **2–3** | **Mandatory** — layouts may vary; all must include takeaway header and source citation |
| `tensionStatement` | Beat 2 — Tension | 1 | **Mandatory** |
| `concept`, `rctf`, or `contextBar` | Beat 3 — Concept | 1–2 | **Mandatory** |
| `comparison` or `scenarioComparison` | Beat 4 — Contrast | 1 | **Mandatory** |
| `persona` (predictFirst) | Beat 3–4 support | 0–2 | **Optional** — only when showing a named person's application adds value |
| `situationalJudgment` | Beat 5 — Bridge | 1 | **Mandatory** — always included |
| `bridge` or `moduleSummary` | — | 1 | **Mandatory** — always the last slide |

**Evidence slides:** Use 2–3 evidence slides to build the Beat 1 case. They must not all use the same layout — vary between `evidenceHero`, `chart`, `concept`, or a custom two-column layout. Each must have a takeaway header, section label (`"THE REALITY"`), and source citation where applicable.

**Narrative flow within Beat 3 (Concept):** When introducing a technique or framework, follow this order inside Beat 3:
1. **"When to use it" concept slide** — Before explaining *how* it works, establish *when* it's appropriate. This sets expectation and gives learners a filter before they encounter the anatomy. Use `eyebrow: "WHEN TO USE ONE"` (or equivalent). This slide should directly follow the `tensionStatement`.
2. **Judgment activity** — Immediately after the "when to use" slide, include a `situationalJudgment` with binary Yes/No scenarios. Learners apply the decision test before the full anatomy is introduced.
3. **Anatomy/framework slides** — Only after learners have a working decision filter should you introduce the structural breakdown (layers, node types, components). Use `rctf` mode 3 (anatomy + reveal) for layered frameworks.

This order — *decide → understand → apply* — prevents learners from memorising structure before they know when to use it.

**Persona guidance:** Persona slides are optional. Use `situationalJudgment` as the primary judgment mechanic. Add persona slides only when showing how a specific person applies the technique adds meaningful context that scenarios alone do not provide.

The `courseIntro` slide always comes first. The `bridge` or `moduleSummary` always comes last before the Reflection screen.

---

## 20. Test What You Teach — Content Integrity Rule

**Every concept, term, node type, or decision pattern tested in a `situationalJudgment` or `persona` slide must have been explicitly introduced earlier in the same module.**

This is a non-negotiable content integrity rule. Learners should never encounter a question that requires knowledge the module has not yet provided.

### What counts as "introduced"
- Named in a `concept`, `rctf`, or `contextBar` slide with a definition or example
- Shown in a `comparison` or `scenarioComparison` slide as a contrast
- Explained in a `persona` slide that precedes the judgment slide
- Stated in the `tensionStatement` as a core claim the module substantiates

### What does NOT count
- Appearing only in the `courseIntro` objectives list
- Being referenced in a pull quote without explanation
- Being assumed as general knowledge

### How to check before publishing
Before finalising any `situationalJudgment` scenario, answer:
1. *What concept or skill is this scenario testing?*
2. *Which earlier slide introduced it?*

If you cannot answer both questions, the scenario must be simplified or a teaching slide must be added first.

### Common violation patterns to avoid
- Testing node type names (e.g. CONDITION, HANDOFF) before the `rctf` or `concept` slide that defines them
- Testing a mapping approach (trigger-first, output-first) before the `persona` slides that demonstrate them
- Using technical vocabulary in options that has not appeared in the module body

---

## 21. Teach → Activity Structure — One Activity per Major Concept

**Every major teaching concept in a module must have an associated activity slide that tests it before the learner moves on.**

This is a non-negotiable learning design rule. A concept that is explained but never tested is a concept that doesn't stick.

### What counts as a "major concept"
A concept is major if it:
- Is named in the `courseIntro` learning objectives
- Is a framework component (e.g. a layer, a node type, an approach) that the module's `situationalJudgment` or `persona` slides depend on
- Requires learners to make a decision or identification using it later in the module

### Required structure per major concept

```
Concept slide (concept / rctf / contextBar) → Activity slide (quiz / situationalJudgment)
```

The activity slide must immediately follow (or be within 1–2 slides of) the concept it tests. Learners should practice while the concept is fresh.

### Activity quality rules
- The activity must test the specific concept taught — not a variation, not a related concept
- There must be exactly one clearly correct answer
- Wrong options must be plausible but distinguishable by someone who understood the teaching slide
- The explanation must reference the concept by name and reinforce why the correct answer is right
- Activity questions must use vocabulary that appeared in the teaching slide — no new terms

### Next button behavior on quiz activity slides
Quiz slides with body teaching content (the `s.body` field is present) auto-reveal the correct answer on Next if the learner skips — they are not hard-blocked. This is intentional: the quiz is a learning tool, not a gate. The learner sees the correct answer and explanation either way.

### Layer concept example (L3 reference implementation)
For Level 3 Topic 1, each of the three workflow layers (Input, Processing, Output) has:
1. A concept overview slide (slide 6) showing all three layers together
2. A dedicated quiz slide per layer (slides 7, 8, 9) with:
   - Body text: what the layer contains, which node types live there, and an example
   - An `ACTIVITY` divider (visual separator rendered by the quiz type when `s.body` is present)
   - A question testing node type identification within that layer
   - Three options, one correct, with an explanation

This structure ensures every node type is introduced, explained, and tested before it appears in the `situationalJudgment` slide.

### `quiz` slide with body — field reference
```typescript
{
  section: "THE LAYERS",
  type: "quiz",
  takeaway: "...",          // shown in the takeaway header bar
  heading: "The X Layer",   // slide heading
  quizEyebrow: "X LAYER",  // shown inside the teaching box (all caps)
  body: "...",              // teaching content — renders above the ACTIVITY divider
  question: "...",          // the activity question (larger text)
  quizOptions: ["A", "B", "C"],
  correct: 1,               // zero-indexed
  explanation: "...",       // shown after answer is revealed
}
```

---

*Companion document: CONTENT-PRD.md*

---

## 19. Rendered Fields Reference — Per Slide Type

**Read this before authoring content for any slide.** Every field you add must appear in the "Rendered" column for that slide type. Fields not listed are silently ignored — they will not appear in the player and may mask content gaps.

### `rctf` — Rendered fields

| Field | Mode 1 (static grid) | Mode 2 (revealOnNext) | Mode 3 (revealOnNext + visualId) |
|---|---|---|---|
| `heading` | ✅ | ✅ | ❌ Not rendered in content area |
| `tealWord` | ✅ | ✅ | ❌ |
| `takeaway` | ✅ | ✅ | ✅ (in takeaway header) |
| `subheading` | ⚠️ Only when `contextStep < 0` | ⚠️ Only when `contextStep < 0` | ❌ Dead field — `contextStep` initialises at 0, this never renders |
| `visualId` | ❌ | ❌ | ✅ Controls left anatomy panel |
| `elements[].key` | ✅ | ✅ | ✅ |
| `elements[].desc` | ✅ | ✅ | ✅ |
| `elements[].icon` | ✅ | ✅ | ✅ |
| `elements[].example` | ✅ | ✅ | ❌ Omitted in Mode 3 to keep cards compact |
| `elements[].whyItMatters` | ✅ | ✅ | ❌ Omitted in Mode 3 to keep cards compact |
| `elements[].color` / `light` | ✅ | ✅ | ✅ |

> **Mode 3 card height budget:** With `example` and `whyItMatters` omitted, each card is ~110px. Four cards + three gaps = ~470px, which fits the ~576px available content area. Never add both fields back to Mode 3 — total card height will exceed the frame.

### `scenarioComparison` — Rendered fields

| Field | Rendered? | Notes |
|---|---|---|
| `tabs[].label` | ✅ | Tab button text |
| `tabs[].prompt` | ✅ | "You say" chat bubble |
| `tabs[].shortOutput` | ✅ **Required** | "They deliver" bubble — omit = empty section |
| `tabs[].checks` | ✅ Required for checklist | Boolean array — omit = no component checklist |
| `tabs[].annotation` | ❌ Not rendered | Use `comparison` type instead if annotation is needed |
| `body` | ❌ Not rendered | |
| `tealWord` | ❌ Not rendered | |

> **Format constraint:** `scenarioComparison` is hardcoded to prompt → AI-output chat bubbles. It is not suitable for document-vs-document comparisons (briefs, PRDs, structured text). For side-by-side document comparison, use `comparison` type.

### `comparison` — Rendered fields

| Field | Rendered? | Notes |
|---|---|---|
| `scenario` | ✅ | Top banner text (gradient bg) |
| `tabs[].label` | ✅ | Tab button text |
| `tabs[].prompt` | ✅ | Styled prompt box (italic, teal left border) |
| `tabs[].annotation` | ✅ | Annotation below prompt in `#F7FAFC` |
| `heading` / `tealWord` | ✅ | In takeaway header and content |
| `body` | ❌ Not rendered | |

### `situationalJudgment` — Rendered fields

| Field | Rendered? | Notes |
|---|---|---|
| `scenarios[].personaName` | ✅ | Name shown in persona tab and header |
| `scenarios[].personaRole` | ✅ | Role shown in persona header |
| `scenarios[].personaIcon` | ✅ | **Must be an imported asset variable — not a raw string** |
| `scenarios[].scenario` | ✅ | Scenario card text — keep under 3 lines (inline) / 4 lines (fullscreen) |
| `scenarios[].options` | ✅ | Three option buttons at fixed height (`75px` inline / `90px` fullscreen) |
| `scenarios[].feedback` | ✅ | Quality-coded feedback card |
| `heading` | ✅ | |
| `tealWord` | ✅ | |

> **Vertical budget:** The full `situationalJudgment` layout (persona tabs + header + scenario card + 3 option cards + feedback) totals ~600px. The available content area is ~576px. Scenario text exceeding 3–4 lines will push the slide over budget and clip content at the top.

> **Option card fill rule:** Options render at `height: 75px` (inline) / `90px` (fullscreen). At 13px/15px line-height 1.5, each card holds 4–5 lines. Options should be **80–160 characters** to fill the card without appearing sparse.

### `moduleSummary` — Rendered fields

| Field | Rendered? | Notes |
|---|---|---|
| `elements[]` | ✅ | Framework component grid |
| `elements[].key` | ✅ | Component name |
| `elements[].desc` | ✅ | One-line description |
| `elements[].color` / `light` | ✅ | Card colour |
| `approaches[]` | ✅ | Bottom row of approach cards |
| `panelHeading` | ✅ | Label above element grid |
| `tealWord` | ❌ Not rendered | moduleSummary does not apply tealWord to its heading |
| `body` | ✅ | Shown below panelHeading label |

> **Grid column rule:** The element grid uses `gridTemplateColumns` derived from `elements.length`: 4 elements → 2×2 grid, 3 or 6 elements → 3-column grid. **Element count must be 3, 4, or 6.** Any other count leaves empty grid cells. Do not add a 5th or 7th element.

### `flipcard` — Rendered fields

| Field | Rendered? | Notes |
|---|---|---|
| `cards[].frontLabel` | ✅ | Front badge label |
| `cards[].frontBadge` | ✅ | Front quality tag |
| `cards[].frontPrompt` | ✅ | Front text content |
| `cards[].backLabel` | ✅ | Back badge label |
| `cards[].backBadge` | ✅ | Back quality tag |
| `cards[].backPrompt` | ✅ | Back text content |
| `cards[].backResponse` | ✅ **Required** | Back explanation panel — omit = empty explanation box |

> **Front card fill rule:** Front cards render at a fixed height. `frontPrompt` should be **100–200 characters** to fill the card face. A one-sentence prompt will appear sparse. Add a prompt cue or question to fill the space (e.g., "What questions does this leave unanswered?").

---

## 20. Topic Composition Rules

Apply these rules before authoring any new topic. Violating them produces redundant UX, confusing personas, and activity fatigue within a single module.

### Evidence slide variety
> No two consecutive evidence slides may use the same slide type. A module with two evidence slides must use two different layouts (e.g. `evidenceHero` + `concept`, not `evidenceHero` + `evidenceHero`). Use `visualType` variants (`dotGrid`, `barComparison`, `adoptionGap`) to further differentiate within the same slide type.

### Interactive slide type limits
> No interactive slide type may appear **more than twice** in a single topic. A third `situationalJudgment` in one topic is a content design failure — replace it with `dragSort`, `buildAPrompt`, `spotTheFlaw`, or `flipcard`.

### No consecutive identical types
> Never place two instances of the same interactive slide type back-to-back. If `situationalJudgment` appears on slide 7, the next interactive slide must be a different type.

### Activity variety by beat
> Each narrative beat (Situation / Tension / Concept / Contrast / Bridge) should use a different interaction format. Do not use `situationalJudgment` for both the Concept beat and the Contrast beat.

### Persona name uniqueness
> Each persona name may be used **once per topic**. Personas carry identity — reusing a name with a different role in the same module creates learner confusion. Track names in a per-topic register before authoring. Available personas: Sam, Priya, Marcus, Aisha, Jordan.

### dragSort as default for classification tasks
> When the goal is to apply a classification framework (scoring rubric, category system, level taxonomy), prefer `dragSort` over `situationalJudgment`. Reserve `situationalJudgment` for judgment calls where the right answer requires reasoning, not categorisation.

---

## 21. Asset Reference Conventions

### Persona images
Persona face icons are imported at the top of `data/topicContent.ts` as named TypeScript variables:

```typescript
import samImg from '../src/assets/face-icons/sam.png';
import priyaImg from '../src/assets/face-icons/priya.png';
import marcusImg from '../src/assets/face-icons/marcus.png';
import aishaImg from '../src/assets/face-icons/aisha.png';
import jordanImg from '../src/assets/face-icons/jordan.png';
```

The `personaIcon` field on `ScenarioData` **must reference the imported variable**, never a raw string:

```typescript
// ✅ Correct
personaIcon: samImg

// ❌ Wrong — will not resolve to an image
personaIcon: "sam"
```

---

## 22. Content Authoring Checklist

Run this checklist before adding any new topic to `topicContent.ts`. Do not author slide content without completing it.

```
EVIDENCE SLIDES
[ ] Two or more evidence slides use different slide types or visualType variants
[ ] Every evidence slide includes a graphic (no text-only stat slides)
[ ] No two consecutive evidence slides share the same layout

INTERACTIVE SLIDES
[ ] No interactive slide type appears more than twice in the topic
[ ] No two consecutive slides use the same interactive type
[ ] Each narrative beat uses a different interaction format
[ ] Each persona name is used only once in the topic
[ ] Classification tasks use dragSort, not situationalJudgment

FIELD VALIDATION
[ ] Every field used appears in the §19 Rendered Fields table for that slide type
[ ] scenarioComparison tabs include shortOutput on every tab (or use comparison instead)
[ ] moduleSummary element count is 3, 4, or 6 (not 5 or 7)
[ ] moduleSummary does not use tealWord (not rendered)
[ ] personaIcon references imported asset variables, not raw strings
[ ] rctf Mode 3 slides do not set subheading (dead field)
[ ] flipcard frontPrompt is 100–200 characters per card

VERTICAL BUDGET
[ ] situationalJudgment scenario text is under 3 lines (inline) / 4 lines (fullscreen)
[ ] situationalJudgment option text is 80–160 characters per option
[ ] rctf Mode 3 does not include example or whyItMatters on elements (Mode 3 omits them)
[ ] All slide content verified in fullscreen mode before commit
```
