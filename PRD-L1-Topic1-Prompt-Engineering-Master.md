# PRD: Level 1 Topic 1 — Prompt Engineering (Master Build Spec)
**Version:** 1.0
**Status:** Ready for Claude Code
**Scope:** Full end-to-end build spec for the Prompt Engineering topic within the existing app architecture

---

## MANDATORY: Read These Files Before Writing Any Code

```
/PRD/SKILL-Elearning-Page.md                        — Brand tokens, slide type specs, player architecture
/docs/CLAUDE.md                                     — Project conventions and patterns
/data/topicContent.ts                               — Existing slide data structure and type definitions
/components/app/level/ELearningView.tsx             — Existing slide renderer and all state
/components/app/level/PractiseView.tsx              — File being replaced
/pages/app/AppCurrentLevel.tsx                      — Orchestrator — how all phase views are wired
/hooks/useLevelData.ts                              — Progress tracking hook
/lib/database.ts                                    — Database layer, score formula
/api/playground.ts                                  — OpenRouter API pattern to follow exactly
/supabase/schema.sql                                — Database schema
```

Do not write any code until you have read all of these. When in doubt, the existing patterns in the codebase take precedence over any assumption.

---

## 0. Start Here — Before Writing Any Code

This section tells you exactly what to do first. Follow these steps in order before touching any implementation file.

### Step 0.1 — Confirm your understanding

After reading all required files, respond with a summary confirming:
- The current number of slides in `L1T1_SLIDES` and what the last slide type is
- Where the `renderSlide()` switch statement lives and which case you will insert `buildAPrompt` after
- Which useEffect currently resets per-slide state and on line approximately what line it sits
- What the current `PractiseView` props interface looks like
- What the current score formula is in `getOrgLeaderboard`
- Whether `topicContent.ts` imports anything from `database.ts` (circular dependency check)

Do not proceed until you have confirmed all six points. If anything is unclear, ask before writing code.

### Step 0.2 — Run the database migration first

Before writing any code, run this SQL in Supabase:

```sql
alter table topic_progress
  add column if not exists practise_score integer;
```

Confirm the column exists in the `topic_progress` table before proceeding. This migration must be complete before Step 7 (PractiseView) will work correctly.

### Step 0.3 — Start the dev server

Run the development server and navigate to `/app/level?level=1` in the browser. Confirm the existing e-learning loads correctly with 16 slides before making any changes. This establishes a working baseline you can test against after each step.

```bash
npm run dev
```

### Step 0.4 — Follow the build order exactly

The eight steps in Section 8 are in a specific order for a reason. Do not skip ahead or combine steps. After each step, test the change in the browser before moving on. The sequence is:

1. Database migration (Step 0.2 above — do this now)
2. `SlideData` interface + `topicContent.ts` data changes
3. `ELearningView.tsx` — state variables + `buildAPrompt` case
4. `ELearningView.tsx` — `predictFirst` persona gate
5. `/constants/validatePromptSystemPrompt.ts` — new file
6. `/api/validate-prompt.ts` — new file
7. `PractiseView.tsx` replacement + `AppCurrentLevel.tsx` prop addition + `savePractiseScore` in `database.ts`
8. `SCORE_CONFIG` + score formula update + solo user score in `useDashboardData.ts`

Steps 2–4 affect only the e-learning player. Steps 5–7 affect only the practise phase. Step 8 affects only scoring. They are independent enough that a failure in step 8 will not break steps 2–7.

### Step 0.5 — Test commands per step

After each step, use these specific test routes to verify your work:

| Step | Test route | What to verify |
|------|-----------|----------------|
| 2 | TypeScript compiler | No type errors in `topicContent.ts` |
| 3 | `/app/level?level=1` | Navigate to slide 7 — drag-and-drop renders |
| 4 | `/app/level?level=1` | Navigate to slides 9–13 — predict panel appears |
| 6 | `curl -X POST /api/validate-prompt` | Returns valid JSON with score, improved, missing, suggestion |
| 7 | `/app/level?level=1` phase 4 | Practise phase loads, submit works, feedback renders |
| 8 | Dashboard leaderboard | Renders without errors, scores appear |

---

## 1. What This PRD Covers

This document specifies everything needed to build out the complete Prompt Engineering learning topic for Level 1. It covers four areas:

1. **E-learning slide enhancements** — two new interactive slide types added to `ELearningView.tsx` and new slide data in `topicContent.ts`
2. **Practise phase replacement** — the static placeholder `PractiseView` replaced with an AI-powered Prompt Critique activity
3. **New API endpoint** — `/api/validate-prompt.ts` for the Prompt Critique
4. **Scoring model overhaul** — a configurable `SCORE_CONFIG` constant replacing hardcoded values throughout `database.ts`

### What does NOT change
- The existing 16-slide `L1T1_SLIDES` array content is preserved exactly. New slides are inserted; no existing slide data is deleted or rewritten.
- `AppCurrentLevel.tsx` only needs one small addition: two new props on `PractiseView`.
- `ReadView.tsx` and `WatchView.tsx` are unchanged.
- `useLevelData.ts` is unchanged.
- The routing, phase progression, and completion logic are unchanged.

---

## 2. Architecture Overview

```
AppCurrentLevel.tsx
  └── Phase 1: ELearningView (slides from topicContent "1-1")
        ├── Existing slide types (unchanged)
        ├── NEW: case 'buildAPrompt' (drag-and-drop Blueprint builder)
        └── Extended: case 'persona' with predictFirst gate
  └── Phase 2: ReadView (unchanged)
  └── Phase 3: WatchView (unchanged)
  └── Phase 4: PractiseView (REPLACED — Prompt Critique activity)
        └── calls /api/validate-prompt.ts
        └── calls savePractiseScore() in lib/database.ts
        └── calls logActivity() with 'quiz_answered'

lib/database.ts
  ├── NEW: SCORE_CONFIG constant (all point values)
  ├── NEW: savePractiseScore()
  └── UPDATED: getOrgLeaderboard() score formula

/api/validate-prompt.ts (NEW FILE)
/constants/validatePromptSystemPrompt.ts (NEW FILE)

supabase: ALTER TABLE topic_progress ADD COLUMN practise_score integer
```

---

## 3. Database Migration

Run this in Supabase **before deploying any code changes**:

```sql
alter table topic_progress
  add column if not exists practise_score integer;
```

After running the migration, add `practise_score` to the `TopicProgressRow` interface in `lib/database.ts`:

```typescript
export interface TopicProgressRow {
  user_id: string;
  level: number;
  topic_id: number;
  current_phase: number;
  current_slide: number;
  elearn_completed_at: string | null;
  read_completed_at: string | null;
  watch_completed_at: string | null;
  practise_completed_at: string | null;
  completed_at: string | null;
  visited_slides: number[];
  practise_score: number | null;  // NEW
}
```

---

## 4. E-Learning Slide Enhancements

### 4.1 New slide data fields — `SlideData` interface in `topicContent.ts`

Add the following optional fields to the existing `SlideData` interface. Do not remove or rename any existing fields.

```typescript
// ── buildAPrompt slide fields ──
buildTask?: string;
buildComponents?: Array<{
  key: string;
  color: string;
  light: string;
  chipLabel: string;
  dropHint: string;
  filledText: string;
}>;
buildAssembledPrompt?: string;
buildInsight?: string;

// ── predictFirst persona fields ──
predictFirst?: boolean;
predictOptions?: string[];
predictCorrect?: number;
predictFeedback?: string[];
```

### 4.2 New slide in `L1T1_SLIDES` — `buildAPrompt` (slide 7)

Insert this as the **7th slide** in the `L1T1_SLIDES` array, after the existing `contextBar` slide (slide 6) and before the existing `spectrum` slide (slide 7, which becomes slide 8 after insertion).

The existing slides do not move in the array — simply insert at index 6 (0-based).

```typescript
{
  section: "THE TOOLKIT",
  type: "buildAPrompt",
  heading: "Build a prompt from scratch.",
  tealWord: "prompt",
  body: "Drag each component into the right slot. Watch the prompt take shape as you add each layer.",
  buildTask: "You need to produce a one-page summary of last quarter's employee engagement survey results. The audience is the executive team. They want to know the top three themes, what's improved since last year, and one recommendation.",
  buildComponents: [
    {
      key: "Role",
      color: "#667EEA",
      light: "#EBF4FF",
      chipLabel: "Role",
      dropHint: "Who are you asking the AI to be?",
      filledText: "Act as a senior HR analyst with experience presenting people data to executive audiences.",
    },
    {
      key: "Context",
      color: "#38B2AC",
      light: "#E6FFFA",
      chipLabel: "Context",
      dropHint: "What background does the AI need?",
      filledText: "This is for our Q3 engagement survey. We ran the same survey last year so year-on-year comparison is possible. The exec team has 10 minutes to review this before a board meeting.",
    },
    {
      key: "Task",
      color: "#ED8936",
      light: "#FFFBEB",
      chipLabel: "Task",
      dropHint: "What exactly do you need?",
      filledText: "Write a one-page executive summary covering: (1) the top three themes from the survey, (2) what has improved vs last year, and (3) one clear recommendation.",
    },
    {
      key: "Format",
      color: "#48BB78",
      light: "#F0FFF4",
      chipLabel: "Format",
      dropHint: "How should the output be structured?",
      filledText: "Use three short sections with bold headers. Each section max 80 words. No bullet points — flowing prose only. Professional tone.",
    },
    {
      key: "Steps",
      color: "#9F7AEA",
      light: "#FAF5FF",
      chipLabel: "Steps",
      dropHint: "What process should the AI follow?",
      filledText: "First identify the three highest-scoring themes by frequency across responses. Then compare scores to last year's data. Then derive one recommendation from the biggest gap or opportunity.",
    },
    {
      key: "Checks",
      color: "#F6AD55",
      light: "#FFFAF0",
      chipLabel: "Checks",
      dropHint: "What quality rules must it follow?",
      filledText: "Do not include raw percentages unless they appear in the source data. Do not speculate beyond what the data shows. Flag if year-on-year comparison is not possible for any theme.",
    },
  ],
  buildAssembledPrompt: "Act as a senior HR analyst with experience presenting people data to executive audiences.\n\nThis is for our Q3 engagement survey. We ran the same survey last year so year-on-year comparison is possible. The exec team has 10 minutes to review this before a board meeting.\n\nWrite a one-page executive summary covering: (1) the top three themes from the survey, (2) what has improved vs last year, and (3) one clear recommendation.\n\nUse three short sections with bold headers. Each section max 80 words. No bullet points — flowing prose only. Professional tone.\n\nFirst identify the three highest-scoring themes by frequency across responses. Then compare scores to last year's data. Then derive one recommendation from the biggest gap or opportunity.\n\nDo not include raw percentages unless they appear in the source data. Do not speculate beyond what the data shows. Flag if year-on-year comparison is not possible for any theme.",
  buildInsight: "A complete Blueprint prompt doesn't just tell the AI what to produce — it tells it who to be, what it's working with, how to think, and what to avoid. Each component removes a set of assumptions the AI would otherwise have to make.",
},
```

### 4.3 `predictFirst` fields on persona slides

Add the following fields to the five existing persona slides in `L1T1_SLIDES`. The `personaData` content on each slide stays exactly as it is — only new fields are added.

**Slide 7 (becomes slide 8 after insertion) — Sam:**
```typescript
predictFirst: true,
predictOptions: ["Brain Dump", "Conversational", "Blueprint"],
predictCorrect: 0,
predictFeedback: [
  "Exactly right. Sam's input is unstructured by nature — rough notes, half-formed thoughts. A brain dump lets the AI find the structure rather than Sam having to organise first.",
  "Conversational works better once you have a direction to steer. Sam doesn't have a direction yet — the output shape is still unknown. Brain dump gets you there faster.",
  "Blueprint requires you to specify format and structure upfront. Sam can't do that yet — the thinking hasn't been organised. Structure before clarity slows you down.",
],
```

**Slide 8 (becomes slide 9) — Priya:**
```typescript
predictFirst: true,
predictOptions: ["Brain Dump", "Conversational", "Blueprint"],
predictCorrect: 1,
predictFeedback: [
  "Brain dump surfaces ideas but doesn't give you control across turns. Priya wants to steer — to sharpen one argument, then another. That requires back-and-forth, not a single dump.",
  "Right. Priya doesn't know the final shape when she starts. Conversational lets her co-create — each turn adds specificity based on what the AI gave back. She's steering, not delegating.",
  "Blueprint works when you know exactly what you want. Priya is still figuring out the angle — locking into a format before the direction is clear creates unnecessary constraints.",
],
```

**Slide 9 (becomes slide 10) — Marcus:**
```typescript
predictFirst: true,
predictOptions: ["Brain Dump", "Conversational", "Blueprint"],
predictCorrect: 2,
predictFeedback: [
  "Marcus's output goes straight to senior leaders. Quality needs to be consistent and there's no iteration window. A brain dump might produce something, but the quality would vary.",
  "Conversational is useful for exploration, but Marcus already knows exactly what he needs. Spending turns refining when you could specify upfront wastes the only advantage conversation offers.",
  "Correct. Marcus knows the audience, the format, and the constraints before he starts. Front-loading all of that eliminates guesswork and gets it right first time.",
],
```

**Slide 10 (becomes slide 11) — Aisha:**
```typescript
predictFirst: true,
predictOptions: ["Brain Dump", "Conversational", "Blueprint"],
predictCorrect: 1,
predictFeedback: [
  "A brain dump would surface raw material, but Aisha doesn't need more raw material — she needs perspectives and challenges she hasn't considered. That requires a structured interrogation across turns.",
  "Right. Aisha is using the AI as a thinking partner — asking it to generate alternatives, surface reactions, and stress-test her draft. That back-and-forth structure is exactly the conversational approach.",
  "Blueprint optimises for a known, repeatable output. Aisha's goal is the opposite — she wants to be surprised, challenged, and shown angles she hasn't considered.",
],
```

**Slide 11 (becomes slide 12) — Jordan:**
```typescript
predictFirst: true,
predictOptions: ["Brain Dump", "Conversational", "Blueprint"],
predictCorrect: 2,
predictFeedback: [
  "Jordan does this every Friday. A brain dump might produce something each week, but quality would vary. When consistency and repeatability matter, the upfront Blueprint investment pays back every time.",
  "Conversational would produce a good first draft but Jordan would redo the iteration every Friday. The Blueprint lets him build once and reuse — swapping in new data each week in under 30 seconds.",
  "Exactly right. Jordan's task is repeatable, the audience is known, and the format is fixed. The Blueprint takes 20 minutes to write once and saves hours across months of weekly reports.",
],
```

### 4.4 Final slide order after changes

| Position | Type | Section | Notes |
|----------|------|---------|-------|
| 1 | `courseIntro` | PROMPT ENGINEERING | Unchanged |
| 2 | `evidenceHero` | THE REALITY | Unchanged |
| 3 | `chart` | THE REALITY | Unchanged |
| 4 | `pyramid` | THE REALITY | Unchanged |
| 5 | `scenarioComparison` | SEE THE DIFFERENCE | Unchanged |
| 6 | `contextBar` | SEE THE DIFFERENCE | Unchanged |
| 7 | `buildAPrompt` | THE TOOLKIT | **NEW** |
| 8 | `spectrum` | THE TOOLKIT | Unchanged (was 7) |
| 9 | `persona` | THE APPROACHES | Sam — predictFirst added |
| 10 | `persona` | THE APPROACHES | Priya — predictFirst added |
| 11 | `persona` | THE APPROACHES | Marcus — predictFirst added |
| 12 | `persona` | THE APPROACHES | Aisha — predictFirst added |
| 13 | `persona` | THE APPROACHES | Jordan — predictFirst added |
| 14 | `situationMatrix` | THE TOOLKIT | Unchanged (was 12) |
| 15 | `sjExercise` | APPLY IT | Unchanged (was 13) |
| 16 | `sjExercise` | APPLY IT | Unchanged (was 14) |
| 17 | `sjExercise` | APPLY IT | Unchanged (was 15) |
| 18 | `bridge` | WHAT'S NEXT | Unchanged (was 16) |

Also update the `courseIntro` slide's `meta` array to reflect the new slide count:
```typescript
meta: ["~20 min", "18 slides", "Interactive", "Beginner friendly"],
```

---

## 5. ELearningView Changes

### 5.1 New state variables

Add these to the existing state declarations block in `ELearningView.tsx`, alongside the existing L1 v2 state variables (around line 152):

```typescript
// buildAPrompt state
const [placedComponents, setPlacedComponents] = useState<Record<string, boolean>>({});
const [draggedChip, setDraggedChip] = useState<string | null>(null);
const [buildComplete, setBuildComplete] = useState(false);

// predictFirst persona state
const [predictSelected, setPredictSelected] = useState<number | null>(null);
const [predictRevealed, setPredictRevealed] = useState(false);
```

### 5.2 Reset on slide change

Add these five new state resets to the **existing** `useEffect` at line 1388 that already resets quiz, spectrum, and other per-slide state. Do not create a new useEffect — add to the existing one:

```typescript
// ADD to existing reset useEffect
setPlacedComponents({});
setDraggedChip(null);
setBuildComplete(false);
setPredictSelected(null);
setPredictRevealed(false);
```

### 5.3 New `case 'buildAPrompt'` in `renderSlide()`

Insert this case after the existing `case 'contextBar'` block. The slide uses the fixed 460px content area like all other slides — content scrolls internally if needed.

#### Layout overview

Two states: **building** (two-column drag-and-drop) and **complete** (assembled prompt + insight callout).

Transition: when `buildComplete` becomes true, fade out the building layout and fade in the complete layout. Use opacity transition over 200ms.

#### Building layout (two columns)

Left column (45% width):
- Eyebrow: "THE TASK" — `fontSize: 10`, `fontWeight: 700`, `color: '#38B2AC'`, uppercase, `letterSpacing: '0.12em'`, `marginBottom: 6`
- Task description: `fontSize: 13`, `color: '#4A5568'`, `lineHeight: 1.6`, `marginBottom: 16`
- Eyebrow: "COMPONENTS TO PLACE" — same eyebrow style
- Chip bank: flex-wrap row, `gap: 8`
- Chips: only unplaced components render here. When a component is placed (`placedComponents[key] === true`), remove it from the bank.

Chip style:
```typescript
{
  padding: '5px 14px',
  borderRadius: 20,
  background: component.light,
  border: `1px solid ${component.color}66`,
  fontSize: 12,
  fontWeight: 700,
  color: component.color,
  cursor: 'grab',
  userSelect: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}
```
Dragging state: `opacity: 0.4` on the chip in the bank, cursor: `grabbing`.

Drag events on chips:
- `draggable={true}`
- `onDragStart`: `setDraggedChip(component.key)`
- `onDragEnd`: `setDraggedChip(null)`

Right column (55% width):
- Six drop zones stacked vertically, `gap: 6`

Drop zone style (empty):
```typescript
{
  border: `1.5px dashed ${component.color}55`,
  background: '#FAFAFA',
  borderRadius: 8,
  padding: '8px 12px',
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  transition: 'all 150ms ease',
}
```

Drop zone style (filled — when `placedComponents[key] === true`):
```typescript
{
  border: `1px solid ${component.color}`,
  background: component.light,
  borderRadius: 8,
  padding: '8px 12px',
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}
```

Drop zone contents:
- Key pill (always visible): `fontSize: 10`, `fontWeight: 700`, `color: '#FFFFFF'`, `background: component.color`, `padding: '2px 8px'`, `borderRadius: 10`, `flexShrink: 0`
- Empty text: `dropHint` — `fontSize: 12`, `color: '#A0AEC0'`, `fontStyle: 'italic'`
- Filled text: `filledText` — `fontSize: 12`, `color: '#2D3748'`, `lineHeight: 1.5`

Drop events on zones:
- `onDragOver`: `e.preventDefault()`
- `onDrop`: if `draggedChip === component.key`, call `setPlacedComponents(prev => ({ ...prev, [component.key]: true }))` and `setDraggedChip(null)`. If wrong key, do nothing (silent fail — chip snaps back).
- After each placement, check if all 6 components are placed. If yes, call `setTimeout(() => setBuildComplete(true), 400)`.

Mobile fallback (tap-to-place):
Detect touch with `'ontouchstart' in window`. When true, render chips as tappable buttons. Tapping a chip sets `draggedChip` to that key. Tapping a drop zone with a selected chip places it. Show a subtle highlight border on the selected chip.

#### Complete layout (shown when `buildComplete === true`)

Fade in (opacity 0 → 1, 200ms). Full width, flex column.

Assembled prompt box — wrap in existing `ExpandableText` component with `maxLen={200}`:
```typescript
{
  background: '#F7FAFC',
  border: '1px solid #E2E8F0',
  borderLeft: '3px solid #38B2AC',
  borderRadius: '0 8px 8px 0',
  padding: '14px 18px',
  fontSize: 13,
  fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
  fontStyle: 'italic',
  color: '#2D3748',
  lineHeight: 1.7,
  whiteSpace: 'pre-line',
  marginBottom: 14,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
}
```

Key insight callout — use `className="insight-pulse"` (already injected by `injectGlowStyle()`):
```typescript
{
  background: 'linear-gradient(135deg, #1A3A38, #1A202C)',
  border: '1px solid rgba(56,178,172,0.27)',
  borderRadius: 10,
  padding: '14px 20px',
}
```
- Eyebrow: "KEY INSIGHT" — `fontSize: 10`, `fontWeight: 700`, `color: '#38B2AC'`, uppercase, `letterSpacing: '0.1em'`, `marginBottom: 6`
- Body: `fontSize: 13`, `color: 'rgba(255,255,255,0.85)'`, `lineHeight: 1.6`, `margin: 0`

### 5.4 Extended `case 'persona'` — `predictFirst` gate

The existing persona case starts at line 668. Wrap its current content with a gate at the top of the case block.

Structure:
```typescript
case 'persona': {
  const p = s.personaData;
  if (!p) return null;

  // GATE: show prediction UI if predictFirst and not yet revealed
  if (s.predictFirst && !predictRevealed) {
    // → render PredictPanel (spec below)
  }

  // EXISTING persona content — unchanged
  const toggleExpand = ...
  return ( ... existing JSX ... );
}
```

#### Predict panel layout

```
┌─────────────────────────────────────────────────────┐
│ [Avatar] Name · Role                                │
│ Tags row                                            │
│                                                     │
│ THEIR SITUATION eyebrow                             │
│ First sentence of p.approachDef (teaser)            │
│                                                     │
│ "Which approach would you choose?" (15px, navy 700) │
│                                                     │
│ [Brain Dump] [Conversational] [Blueprint]           │
│ Three option cards in a row                         │
│                                                     │
│ [Check →] button                                    │
│                                                     │
│ [Feedback panel — shown after Check clicked]        │
└─────────────────────────────────────────────────────┘
```

Avatar + name + role: identical to existing persona layout (56px circle, `p.color` bg, `p.initial` white text).

Tags: identical flex-wrap row as existing persona layout.

Situation teaser:
- Eyebrow: "THEIR SITUATION" — 10px, teal, uppercase, `letterSpacing: '0.12em'`, `marginBottom: 6`, `marginTop: 12`
- Text: first sentence of `p.approachDef` — split on `. ` and take index 0. `fontSize: 13`, `color: '#4A5568'`, `lineHeight: 1.6`

Question: `fontSize: 15`, `fontWeight: 700`, `color: '#1A202C'`, `margin: '16px 0 12px'`

Option cards: three cards in a flex row, `gap: 10`, each `flex: 1`.

Option card default:
```typescript
{
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: '#2D3748',
  textAlign: 'center',
  transition: 'all 150ms ease',
}
```

Option card selected (before Check):
```typescript
{
  border: '2px solid #38B2AC',
  background: '#E6FFFA',
  color: '#1A202C',
}
```

Check button: teal primary style — `background: '#38B2AC'`, `color: '#FFFFFF'`, `border: 'none'`, `borderRadius: 24`, `padding: '10px 24px'`, `fontSize: 13`, `fontWeight: 600`. Disabled when `predictSelected === null`.

#### After Check is clicked

Show feedback panel below the option cards. After 1500ms, call `setPredictRevealed(true)` to show the full persona content. The Next button remains active throughout — learner can always advance without completing the prediction.

**Correct answer** (`predictSelected === s.predictCorrect`):
```typescript
{
  background: '#F0FFF4',
  border: '1px solid #9AE6B4',
  borderRadius: 10,
  padding: '12px 16px',
  marginTop: 12,
}
```
- Eyebrow: "Correct ✓" — `fontSize: 11`, `fontWeight: 700`, `color: '#276749'`, uppercase, `marginBottom: 6`
- Body: `s.predictFeedback[predictSelected]` — `fontSize: 13`, `color: '#276749'`, `lineHeight: 1.6`

**Wrong answer** (`predictSelected !== s.predictCorrect`):

Two panels stacked, `gap: 8`:

Panel 1 — wrong choice:
```typescript
{
  background: '#FFF5F5',
  border: '1px solid #FEB2B2',
  borderRadius: 10,
  padding: '12px 16px',
}
```
- Eyebrow: "Not the best fit" — `fontSize: 11`, `fontWeight: 700`, `color: '#9B2C2C'`, uppercase, `marginBottom: 6`
- Body: `s.predictFeedback[predictSelected]` — `fontSize: 13`, `color: '#9B2C2C'`, `lineHeight: 1.6`

Panel 2 — correct choice:
```typescript
{
  background: '#F0FFF4',
  border: '1px solid #9AE6B4',
  borderRadius: 10,
  padding: '12px 16px',
}
```
- Eyebrow: `"Best approach: ${s.predictOptions[s.predictCorrect]}"` — `fontSize: 11`, `fontWeight: 700`, `color: '#276749'`, uppercase, `marginBottom: 6`
- Body: `s.predictFeedback[s.predictCorrect]` — `fontSize: 13`, `color: '#276749'`, `lineHeight: 1.6`

---

## 6. Practise Phase — Prompt Critique Activity

### 6.1 `AppCurrentLevel.tsx` — add props to PractiseView

Find the existing `PractiseView` render (around line 327). Add two new props:

```tsx
{displayPhase === 4 && (
  <PractiseView
    accentColor={accentColor}
    accentDark={accentDark}
    level={currentLevel}           // ADD
    topicId={selectedTopicId}      // ADD
    onCompleteTopic={() => handleCompleteTopic(selectedTopicId)}
  />
)}
```

### 6.2 New API file — `/api/validate-prompt.ts`

Copy the full structure of `/api/playground.ts` exactly — same imports, same `fetchWithRetry` helper (copy verbatim), same error handling pattern, same retry logic. Only the system prompt constant and request body differ.

**Request body:**
```typescript
const { originalTask, weakPrompt, learnerRewrite } = req.body;
```

Return `400` if any field is missing or an empty string.

**OpenRouter call:**
```typescript
{
  model: 'anthropic/claude-sonnet-4',
  max_tokens: 1000,
  temperature: 0.4,
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: VALIDATE_PROMPT_SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({ originalTask, weakPrompt, learnerRewrite })
    }
  ]
}
```

**Response:** Parse JSON from `data.choices[0].message.content` and return it directly (same pattern as `playground.ts`).

### 6.3 New constants file — `/constants/validatePromptSystemPrompt.ts`

```typescript
export const VALIDATE_PROMPT_SYSTEM_PROMPT = `You are an expert prompt engineering coach evaluating a learner's rewritten prompt.

The learner has been shown a business task and a weak prompt. They have rewritten it using the Blueprint framework (Role, Context, Task, Format, Steps, Checks).

Evaluate their rewrite and return a JSON object with exactly this structure:
{
  "score": <integer 0-100>,
  "improved": "<1-2 sentences referencing specific phrases from their rewrite that show genuine improvement. Start with what they got right.>",
  "missing": "<1-2 sentences identifying the most important gap still present. Be specific — name the Blueprint component and explain what it would add.>",
  "suggestion": "<One concrete rewrite of the weakest part of their prompt. Show the before and after inline. Keep it under 60 words.>"
}

Scoring guide:
- 80-100: All six Blueprint components present and specific
- 60-79: Most components present, substantive improvement over the original
- 40-59: Some improvement, key components missing or vague
- 0-39: Minimal improvement over the original

Critical rules:
- Reference the learner's ACTUAL text in the "improved" field — never give generic praise
- The "missing" field must name a specific Blueprint component
- The "suggestion" field must be a concrete rewrite, not advice
- Never mention specific AI tools by name (ChatGPT, Claude, etc.) — use "your AI tool"
- Keep all feedback constructive — gaps are opportunities, not failures
- Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON.`;
```

### 6.4 Full replacement of `PractiseView.tsx`

#### Props interface

```typescript
interface PractiseViewProps {
  accentColor: string;
  accentDark: string;
  level: number;
  topicId: number;
  onCompleteTopic: () => void;
}
```

Get `userId` inside the component via `useAuth` (already used throughout the app):
```typescript
import { useAuth } from '../../context/AuthContext';
const { user } = useAuth();
```

#### Hardcoded content

```typescript
const CRITIQUE_CONTENT = {
  task: "Write a summary of last quarter's employee engagement survey results for the leadership team. They want to know the top three themes, what's improved since last year, and one recommendation.",
  weakPrompt: "Summarise our performance reviews from last quarter for leadership.",
  weaknesses: [
    { label: "No role", desc: "The AI doesn't know who it's acting as" },
    { label: "No context", desc: "No audience detail, no data reference, no constraints" },
    { label: "No format", desc: "No structure, length, or tone specified" },
    { label: "No checks", desc: "Nothing to prevent speculation or errors" },
  ],
  blueprintReminder: [
    { key: "Role",    color: "#667EEA" },
    { key: "Context", color: "#38B2AC" },
    { key: "Task",    color: "#ED8936" },
    { key: "Format",  color: "#48BB78" },
    { key: "Steps",   color: "#9F7AEA" },
    { key: "Checks",  color: "#F6AD55" },
  ],
};
```

#### State

```typescript
const [rewrite, setRewrite] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [feedback, setFeedback] = useState<{
  score: number;
  improved: string;
  missing: string;
  suggestion: string;
} | null>(null);
const [error, setError] = useState<string | null>(null);
const [submitted, setSubmitted] = useState(false);
```

Inject animations on mount:
```typescript
useEffect(() => {
  if (document.getElementById('practise-anim')) return;
  const s = document.createElement('style');
  s.id = 'practise-anim';
  s.textContent = `
    @keyframes insightPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(56,178,172,0.2); }
      50% { box-shadow: 0 0 16px 4px rgba(56,178,172,0.35); }
    }
    .insight-pulse { animation: insightPulse 3s ease-in-out infinite; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in-up { animation: fadeInUp 0.3s ease forwards; }
  `;
  document.head.appendChild(s);
}, []);
```

#### Submit handler

```typescript
const handleSubmit = async () => {
  if (!user || rewrite.trim().length < 50 || isLoading) return;
  setIsLoading(true);
  setError(null);

  try {
    const res = await fetch('/api/validate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalTask: CRITIQUE_CONTENT.task,
        weakPrompt: CRITIQUE_CONTENT.weakPrompt,
        learnerRewrite: rewrite.trim(),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Feedback unavailable. Please try again.');
    }

    const data = await res.json();
    setFeedback(data);
    setSubmitted(true);

    // Save score and log activity
    await savePractiseScore(user.id, level, topicId, data.score);
    logActivity(user.id, 'quiz_answered', level, topicId, {
      type: 'prompt_critique',
      score: data.score,
    });

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

Import `savePractiseScore` and `logActivity` from `../../lib/database`.

#### Full page layout — vertical stack, `padding: '0 0 48px'`

**Card wrapper:**
```typescript
{
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E2E8F0',
  overflow: 'hidden',
  marginBottom: 24,
}
```

**Header strip:**
```typescript
{
  background: `linear-gradient(135deg, ${accentDark}, ${accentDark}dd)`,
  padding: '20px 32px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}
```
- Icon: `PenTool` from lucide-react, size 20, color `accentColor`
- Title: "Validate Your Knowledge" — 16px, 700, white
- Subtitle: "Apply the Blueprint framework to improve a real prompt" — 12px, `rgba(255,255,255,0.6)`

**Content area padding:** `padding: 32`

**Step 1 — Task box:**
```typescript
{
  background: `${accentColor}10`,
  border: `1px solid ${accentColor}33`,
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 20,
}
```
- Eyebrow: "THE TASK"
- Text: `CRITIQUE_CONTENT.task` — `fontSize: 15`, `color: '#1A202C'`, `lineHeight: 1.7`, `fontWeight: 500`

**Step 2 — Weak prompt:**
- Eyebrow: "WHAT WAS WRITTEN"
- Prompt box: `background: '#F7FAFC'`, `border: '1px solid #E2E8F0'`, `borderLeft: '3px solid #FC8181'`, `borderRadius: '0 8px 8px 0'`, `padding: '12px 16px'`, `fontSize: 13`, `fontStyle: 'italic'`, `color: '#2D3748'`
- Weakness pills: `display: flex`, `flexWrap: wrap`, `gap: 8`, `marginTop: 12`
- Each pill: `background: '#FFF5F5'`, `border: '1px solid #FEB2B2'`, `borderRadius: 20`, `padding: '4px 12px'`, `fontSize: 11`, `fontWeight: 600`, `color: '#9B2C2C'`
- Format: `"{label} — {desc}"`

**Step 3 — Blueprint reminder:**
- Eyebrow: "BLUEPRINT REMINDER"
- Six pills: `display: flex`, `flexWrap: wrap`, `gap: 6`, `marginTop: 8`
- Each pill: `background: '{color}15'`, `border: '1px solid ${color}40'`, `borderRadius: 20`, `padding: '5px 12px'`, `fontSize: 11`, `fontWeight: 700`, `color: component.color`

**Step 4 — Rewrite:**
- Eyebrow: "YOUR REWRITE"
- Textarea: `width: '100%'`, `minHeight: 140`, `border: '1px solid #E2E8F0'`, `borderRadius: 10`, `padding: '14px 16px'`, `fontSize: 14`, `lineHeight: 1.7`, `color: '#1A202C'`, `fontFamily: 'inherit'`, `resize: 'vertical'`, `boxSizing: 'border-box'`
- On focus: `border: '1px solid ${accentColor}'`
- Character count: right-aligned, `fontSize: 11`, `color: '#A0AEC0'`, `marginBottom: 12` — shows `rewrite.length` characters
- Submit button: `background: isLoading || rewrite.trim().length < 50 ? '#E2E8F0' : '#38B2AC'`, `color: isLoading || rewrite.trim().length < 50 ? '#A0AEC0' : '#FFFFFF'`, `border: 'none'`, `borderRadius: 24`, `padding: '10px 24px'`, `fontSize: 14`, `fontWeight: 600`, `cursor: disabled ? 'not-allowed' : 'pointer'`
- Loading label: "Getting feedback…" with a 16px spinning div (border 2px solid `#38B2AC`, border-top transparent, border-radius 50%, animation: spin 0.8s linear infinite)
- Error state: `background: '#FFF5F5'`, `border: '1px solid #FEB2B2'`, `borderRadius: 10`, `padding: '12px 16px'`, `marginTop: 12`, `fontSize: 13`, `color: '#9B2C2C'`

**Feedback panel** — `className="fade-in-up"`, shown when `submitted === true`:

Score row (flex, `alignItems: 'center'`, `gap: 16`, `marginBottom: 20`):
- Score ring: SVG, 64px, stroke 5px. Copy `ProgressRing` from `TopicHeader.tsx`. Fill colour: score ≥ 80 → `#48BB78`, score ≥ 60 → `#ED8936`, score < 60 → `#FC8181`. Track: fill colour at 20% opacity. Centre: score number (18px, 800) + "/ 100" (10px, `#718096`).
- Label block: "Your prompt score" (13px, 600, `#1A202C`) + band label below (12px, `#718096`):
  - ≥ 80: "Strong — all key components present"
  - ≥ 60: "Good — most components covered"
  - ≥ 40: "Developing — key components missing"
  - < 40: "Needs work — revisit the Blueprint"

What you improved card:
```typescript
{
  background: '#F0FFF4', border: '1px solid #9AE6B4',
  borderLeft: '3px solid #48BB78', borderRadius: '0 10px 10px 0',
  padding: '14px 18px', marginBottom: 10,
}
```
Eyebrow: "WHAT YOU IMPROVED" — green. Body: `feedback.improved` — green.

Still missing card:
```typescript
{
  background: '#FFFBEB', border: '1px solid #F6AD55',
  borderLeft: '3px solid #ED8936', borderRadius: '0 10px 10px 0',
  padding: '14px 18px', marginBottom: 10,
}
```
Eyebrow: "STILL MISSING" — `#92400E`. Body: `feedback.missing` — `#92400E`.

One suggestion card — `className="insight-pulse"`:
```typescript
{
  background: 'linear-gradient(135deg, #1A3A38, #1A202C)',
  border: '1px solid rgba(56,178,172,0.27)',
  borderRadius: 10,
  padding: '14px 20px',
}
```
Eyebrow: "ONE SUGGESTION" — teal. Body: `feedback.suggestion` — `rgba(255,255,255,0.85)`.

**Complete Topic button** — shown below feedback panel when `submitted === true`:
```typescript
{
  background: submitted ? accentColor : '#E2E8F0',
  color: submitted ? accentDark : '#A0AEC0',
  border: 'none',
  borderRadius: 24,
  padding: '12px 32px',
  fontSize: 15,
  fontWeight: 700,
  cursor: submitted ? 'pointer' : 'default',
  fontFamily: "'DM Sans', sans-serif",
}
```
Before submission: render disabled. After submission: enabled, calls `onCompleteTopic`.

---

## 7. Scoring Model

### 7.1 `SCORE_CONFIG` constant in `lib/database.ts`

Add this export near the top of `lib/database.ts`, before the first function declaration. This is the **only place** any point value should appear in the scoring logic:

```typescript
// ─── SCORE CONFIGURATION ───────────────────────────────────────────
// To rebalance scoring, edit values here only. No other changes needed.
export const SCORE_CONFIG = {
  // Base points awarded per phase completion (e-learning, read, watch, practise)
  perPhaseCompleted: 15,

  // Bonus when learner visits all slides in the e-learning phase
  eLearningBonus: 10,

  // Bonus when learner submits the prompt critique (practise_score is set)
  practiseBonus: 20,

  // Bonus when learner completes all topics in a level
  levelCompletionBonus: 50,

  // Points per saved artefact
  perArtefact: 25,
  artefactCap: 20,

  // Points per insight logged
  perInsight: 30,
  insightCap: 10,

  // Points per streak day
  perStreakDay: 5,
  streakCap: 14,

  // Points per active day in last 30 days
  perActiveDay: 2,
  activeDayCap: 30,
} as const;
```

### 7.2 New `savePractiseScore` function in `lib/database.ts`

Add after the existing `completeTopicDb` function:

```typescript
export async function savePractiseScore(
  userId: string,
  level: number,
  topicId: number,
  score: number,
): Promise<boolean> {
  return upsertTopicProgress(userId, level, topicId, {
    practise_score: score,
  } as any);
}
```

### 7.3 Updated `getOrgLeaderboard` score formula

#### Step 1 — Update the topic_progress select query (step 3 in the function)

Replace the existing select:
```typescript
.select('user_id, elearn_completed_at, read_completed_at, watch_completed_at, practise_completed_at')
```

With:
```typescript
.select('user_id, level, topic_id, elearn_completed_at, read_completed_at, watch_completed_at, practise_completed_at, completed_at, visited_slides, practise_score')
```

#### Step 2 — Import `getTopicContent` and `LEVEL_TOPICS`

`LEVEL_TOPICS` is already imported in `database.ts`. Add `getTopicContent`:

```typescript
import { getTopicContent } from '../data/topicContent';
```

**Important:** Check for circular dependencies before adding this import. If `topicContent.ts` imports anything from `database.ts`, this will cause a circular dependency. In that case, build the `slideCountMap` in `useDashboardData.ts` instead and pass it as a parameter to the score calculation. See Developer Notes section.

#### Step 3 — Build slide count map (add before the scoring section)

```typescript
// Build slide count map for e-learning bonus calculation
const slideCountMap: Record<string, number> = {};
for (let lvl = 1; lvl <= 5; lvl++) {
  const topics = LEVEL_TOPICS[lvl] || [];
  topics.forEach(topic => {
    const content = getTopicContent(lvl, topic.id);
    if (content) slideCountMap[`${lvl}-${topic.id}`] = content.slides.length;
  });
}
```

#### Step 4 — Replace the scoring computation block

Replace the entire section from `// Phase completions per user` through the end of `phaseCountMap.set(...)` with:

```typescript
// Phase completions, e-learning bonuses, practise bonuses, level completions
const phaseCountMap = new Map<string, number>();
const eLearningBonusMap = new Map<string, number>();
const practiseBonusMap = new Map<string, number>();
const levelTopicCompletionMap = new Map<string, Map<number, number>>();
// ^ userId → Map<level, completedTopicCount>

(topicRows || []).forEach((row: Record<string, unknown>) => {
  const uid = row.user_id as string;
  const lvl = row.level as number;
  const topicId = row.topic_id as number;

  // Base phase points
  let phases = 0;
  if (row.elearn_completed_at) phases++;
  if (row.read_completed_at) phases++;
  if (row.watch_completed_at) phases++;
  if (row.practise_completed_at) phases++;
  phaseCountMap.set(uid, (phaseCountMap.get(uid) || 0) + phases);

  // E-learning bonus: only if all slides visited
  if (row.elearn_completed_at) {
    const totalSlides = slideCountMap[`${lvl}-${topicId}`] || 0;
    const visited = (row.visited_slides as number[] || []).length;
    if (totalSlides > 0 && visited >= totalSlides) {
      eLearningBonusMap.set(uid, (eLearningBonusMap.get(uid) || 0) + 1);
    }
  }

  // Practise bonus: only if practise_score is set
  if (row.practise_score !== null && row.practise_score !== undefined) {
    practiseBonusMap.set(uid, (practiseBonusMap.get(uid) || 0) + 1);
  }

  // Level completion tracking
  if (row.completed_at) {
    if (!levelTopicCompletionMap.has(uid)) {
      levelTopicCompletionMap.set(uid, new Map());
    }
    const levelMap = levelTopicCompletionMap.get(uid)!;
    levelMap.set(lvl, (levelMap.get(lvl) || 0) + 1);
  }
});

// Count complete levels per user
const completeLevelCountMap = new Map<string, number>();
userIds.forEach(uid => {
  let completeLevels = 0;
  const levelMap = levelTopicCompletionMap.get(uid) || new Map();
  for (let lvl = 1; lvl <= 5; lvl++) {
    const totalTopicsInLevel = (LEVEL_TOPICS[lvl] || []).length;
    if (totalTopicsInLevel > 0 && (levelMap.get(lvl) || 0) >= totalTopicsInLevel) {
      completeLevels++;
    }
  }
  completeLevelCountMap.set(uid, completeLevels);
});
```

#### Step 5 — Replace the score formula

Replace the existing `const score = ...` block:

```typescript
const phasesCompleted  = phaseCountMap.get(userId) || 0;
const eLearningBonuses = eLearningBonusMap.get(userId) || 0;
const practiseBonuses  = practiseBonusMap.get(userId) || 0;
const completeLevels   = completeLevelCountMap.get(userId) || 0;
const artefactCount    = Math.min(artefactCountMap.get(userId) || 0, SCORE_CONFIG.artefactCap);
const insightCount     = Math.min(insightCountMap.get(userId) || 0, SCORE_CONFIG.insightCap);
const streakDays       = Math.min(profile?.streak_days || 0, SCORE_CONFIG.streakCap);
const activeDays30     = Math.min(activeDaysMap.get(userId) || 0, SCORE_CONFIG.activeDayCap);

const score =
  (phasesCompleted  * SCORE_CONFIG.perPhaseCompleted) +
  (eLearningBonuses * SCORE_CONFIG.eLearningBonus) +
  (practiseBonuses  * SCORE_CONFIG.practiseBonus) +
  (completeLevels   * SCORE_CONFIG.levelCompletionBonus) +
  (artefactCount    * SCORE_CONFIG.perArtefact) +
  (insightCount     * SCORE_CONFIG.perInsight) +
  (streakDays       * SCORE_CONFIG.perStreakDay) +
  (activeDays30     * SCORE_CONFIG.perActiveDay);

const totalPhases = 20; // 5 levels × 4 phases — unchanged
const completionPct = Math.round((phasesCompleted / totalPhases) * 100);
```

### 7.4 Solo user score in `useDashboardData.ts`

The current solo user score is hardcoded as `overallCompletedTopics * 100`. Update it to use `SCORE_CONFIG`:

```typescript
// Add import at top of useDashboardData.ts
import { SCORE_CONFIG } from '../lib/database';

// Replace hardcoded score:
// OLD: score: overallCompletedTopics * 100,
// NEW:
score: overallCompletedTopics * SCORE_CONFIG.perPhaseCompleted * 4,
```

---

## 8. Build Order for Claude Code

Follow this sequence. Each step should be tested before moving to the next.

**Step 1 — Database migration**
Run the SQL migration in Supabase. Verify the `practise_score` column exists before writing any code.

**Step 2 — `SlideData` interface + `topicContent.ts` data**
Add the new fields to the `SlideData` interface. Insert the `buildAPrompt` slide into `L1T1_SLIDES`. Add `predictFirst` fields to the five persona slides. Update the `courseIntro` meta. Do not touch any other slide data.

**Step 3 — `ELearningView.tsx` state + `buildAPrompt` case**
Add the five new state variables. Add their resets to the existing slide-change useEffect. Add `case 'buildAPrompt'` to `renderSlide()`. Test by navigating to `/app/level?level=1` and advancing to slide 7.

**Step 4 — `ELearningView.tsx` persona predictFirst gate**
Extend `case 'persona'` with the predict panel. Test by advancing to slides 9–13 and verifying the prediction UI appears, feedback shows correctly, and the persona content reveals after 1500ms.

**Step 5 — `/constants/validatePromptSystemPrompt.ts`**
Create the constants file. No testing needed yet.

**Step 6 — `/api/validate-prompt.ts`**
Create the API endpoint. Test with a direct POST request before wiring up the UI.

**Step 7 — `PractiseView.tsx` replacement**
Replace the file. Add `savePractiseScore` to `database.ts` first (needed for the import). Update `AppCurrentLevel.tsx` to pass the two new props. Test the full practise phase flow.

**Step 8 — `SCORE_CONFIG` and score formula**
Add `SCORE_CONFIG` to `database.ts`. Check for circular dependency before importing `getTopicContent`. Update the score formula. Update solo user score in `useDashboardData.ts`. Test by checking the leaderboard renders without errors.

---

## 9. Quality Checklist

**E-learning — `buildAPrompt`:**
- [ ] Slide appears at position 7 (after contextBar, before spectrum)
- [ ] Chip bank shows only unplaced components
- [ ] Dropping wrong chip onto a zone does nothing (silent fail)
- [ ] All 6 placed → 400ms delay → completion state fades in
- [ ] Assembled prompt uses `ExpandableText` with `maxLen={200}`
- [ ] Key insight uses `insight-pulse` class
- [ ] Mobile tap-to-place fallback implemented
- [ ] All five new state variables reset on slide change

**E-learning — `predictFirst` personas:**
- [ ] Prediction UI shows on slides 9–13 before persona content
- [ ] Correct answer: green feedback → 1500ms → full persona revealed
- [ ] Wrong answer: red + green panels → 1500ms → full persona revealed
- [ ] Next button never blocked — learner can always advance
- [ ] `predictSelected` and `predictRevealed` reset on slide change
- [ ] Existing persona rendering is pixel-identical for slides without `predictFirst`

**Practise phase:**
- [ ] `PractiseView` receives `level` and `topicId` props from `AppCurrentLevel`
- [ ] Submit disabled until `rewrite.trim().length >= 50`
- [ ] Loading spinner shows during API call
- [ ] Score ring colour correct per band (green/amber/red)
- [ ] All three feedback cards render with correct colours
- [ ] `savePractiseScore` called after successful response
- [ ] `logActivity('quiz_answered')` called after successful response
- [ ] Error state renders if API call fails
- [ ] `fade-in-up` animation on feedback panel
- [ ] `insight-pulse` on suggestion card
- [ ] Complete Topic button only active after `submitted === true`

**Scoring:**
- [ ] `SCORE_CONFIG` exported before all functions in `database.ts`
- [ ] Zero hardcoded point values in the score formula
- [ ] `getOrgLeaderboard` selects `visited_slides`, `practise_score`, `completed_at`, `level`, `topic_id`
- [ ] E-learning bonus only awarded when all slides visited
- [ ] Practise bonus only awarded when `practise_score` is not null
- [ ] Level completion counts complete levels, not topics
- [ ] Solo user score in `useDashboardData.ts` uses `SCORE_CONFIG`
- [ ] `SCORE_CONFIG` imported in `useDashboardData.ts`
- [ ] Leaderboard renders without TypeScript errors

**Database:**
- [ ] `practise_score integer` column exists in `topic_progress`
- [ ] `TopicProgressRow` interface includes `practise_score: number | null`
- [ ] `savePractiseScore` function added to `database.ts`

---

## 10. Developer Notes

**Circular dependency risk.** `database.ts` is a low-level module. Before adding `import { getTopicContent } from '../data/topicContent'`, check whether `topicContent.ts` (or any file it imports) imports from `database.ts`. If a circular dependency exists, move the `slideCountMap` construction to `useDashboardData.ts` and pass the completed map into `getOrgLeaderboard` as an additional parameter.

**`LEVEL_TOPICS` already imported.** `database.ts` already imports `LEVEL_TOPICS` from `data/levelTopics.ts`. No change needed there.

**Do not refactor `renderSlide()`.** The switch statement is large but it is the established pattern. Add new cases cleanly without restructuring the function.

**`injectGlowStyle()` already provides `insight-pulse` and `slideInRight`.** Do not re-inject these in `ELearningView.tsx`. The `PractiseView` injects its own minimal animation set separately because it is a different component tree.

**The `ExpandableText` component is defined inside `ELearningView.tsx` around line 102.** It is not exported. Use it only within `ELearningView.tsx` — do not import it elsewhere.

**`savePractiseScore` uses `as any` cast.** The `upsertTopicProgress` function's `updates` parameter type does not currently include `practise_score`. Using `as any` is intentional and acceptable here. Do not widen the type signature of `upsertTopicProgress` as it is used in many places.

**Feedback must not stream or appear partially.** Show the loading spinner until the complete JSON is returned and all four fields (`score`, `improved`, `missing`, `suggestion`) are present. Do not render partial feedback.

**The `totalPhases = 20` constant in `getOrgLeaderboard` is correct** for 5 levels × 4 phases. Do not change it — it is used for `completionPct`, not the score.
