# Level 1 Toolkit (Prompt Playground) — Conversation Handover

> Complete context from the development sessions working on the Prompt Playground page. Use this document to resume work in a new conversation with full context.

---

## 1. What This Tool Is

The **Prompt Playground** is the Level 1 toolkit tool at `/app/toolkit/prompt-playground`. It helps users learn prompt engineering by:

1. **Input**: User enters a plain-language description of what they want the AI to do (e.g., "Write a stakeholder update email")
2. **AI Generation**: Backend selects appropriate prompting strategies and generates an optimised prompt with strategy annotations
3. **Output — Cards view**: Shows the generated prompt with inline numbered badges linking strategy excerpts, plus expandable strategy cards explaining each strategy used
4. **Output — Markdown view**: Shows the raw prompt ready to copy/paste into any AI tool
5. **Refinement loop**: User can answer AI-generated refinement questions or add freeform context, then regenerate for an improved prompt

**Level 1 accent colors:** `LEVEL_ACCENT = '#A8F0E0'` (mint), `LEVEL_ACCENT_DARK = '#1A6B5F'` (dark teal)

---

## 2. Key Files

| File | Purpose |
|------|---------|
| `components/app/toolkit/AppPromptPlayground.tsx` | Main component — all UI, state, rendering logic |
| `functions/src/index.ts` | Backend — `generateplaygroundprompt` Cloud Function with system prompt |
| `data/playground-content.ts` | Static data — 8 strategy definitions, example chips, wizard steps, blueprint education content |
| `types.ts` | TypeScript types — `PlaygroundResult`, `PlaygroundStrategy`, `StrategyId` |
| `hooks/usePlaygroundApi.ts` | API hook — calls the Cloud Function, handles loading/error state |
| `PRD/TOOLKIT-PAGE-STANDARD.md` | Design standard — all toolkit pages must follow this for layout, colors, patterns |
| `PRD/PRD_Prompt_Playground_Redesign.md` | Original v2 PRD for the strategy-aware redesign |

---

## 3. Architecture & Key Decisions

### 3.1 Strategy-Aware Prompt Generation

The backend (`generateplaygroundprompt` in `functions/src/index.ts`) uses a detailed system prompt (`PLAYGROUND_V2_SYSTEM`) that instructs the AI to:
- Select 2-4 prompting strategies from 8 canonical strategies
- Generate an optimised prompt using those strategies
- Return structured JSON with `prompt`, `strategies_used[]`, and `refinement_questions[]`

Each strategy in `strategies_used` includes:
- `id` — matches a `StrategyId` enum (e.g., `CHAIN_OF_THOUGHT`)
- `name`, `icon` — display metadata
- `prompt_excerpt` — a verbatim substring of the generated prompt demonstrating that strategy
- `how_applied` — explanation of how the strategy was used in this specific prompt
- `why` — why this strategy was chosen for the user's task
- `what` — general description of the strategy

### 3.2 Excerpt Highlighting with Fuzzy Matching

**Problem:** The LLM's `prompt_excerpt` field often doesn't exactly match the prompt text (whitespace differences, minor rewording, truncation).

**Solution:** `findExcerptRange()` function uses a 4-level fallback:
1. Exact `indexOf` match
2. Normalised whitespace match (collapses runs of whitespace, maps indices back to original)
3. Case-insensitive match
4. Prefix-based fuzzy match (matches first ~60 chars, extends to paragraph end)

The backend system prompt was also strengthened to emphasize that `prompt_excerpt` must be an exact verbatim substring.

### 3.3 Numbered Badge System (Strategy ↔ Prompt Linking)

Each strategy gets a numbered badge (①②③④) that appears in two places:
- **In the prompt text**: Inline `BadgeCircle` component at the start of each excerpt, with a subtle highlight on the excerpt text
- **On strategy card headers**: Matching `BadgeCircle` next to the strategy name

`BadgeCircle` renders as an 18px circle with `LEVEL_ACCENT_DARK` background and white number. All excerpts are highlighted simultaneously (not just the active one) — active excerpts get a stronger highlight (`40` opacity + solid border), inactive ones get a subtle highlight (`18` opacity + dashed border).

The old single-strategy highlight system (`activeHighlight` state + "highlighted above" bar + "↑ See highlighted section" dashed box) was replaced by this always-visible badge system.

### 3.4 Unified Strategy Colors

**Decision:** All strategy cards use a single `STRATEGY_COLOR = LEVEL_ACCENT` (#A8F0E0) instead of per-strategy colors. This follows TOOLKIT-PAGE-STANDARD.md §1.5 (level-themed accent colors). The `STRATEGY_ACCENT_COLORS` map in `data/playground-content.ts` is no longer imported.

### 3.5 Loading Progress Indicator

A `ProcessingProgress` component shows 7 steps with staggered timing:
```
STEP_DELAYS = [800, 1500, 3000, 4000, 4500, 5000, -1]
```
The `-1` on the last step means it stays spinning until the API returns (open-ended buffer). Separate step labels exist for initial generation vs. refinement.

### 3.6 Cards/Markdown Toggle + Action Buttons

The view toggle (Cards | Markdown) and action buttons (Copy, Download, Save to Library) are on a single row with a flex spacer between them. The `ToggleBtn` and `ActionBtn` are local helper components within the file.

### 3.7 Next Step Banner

A teal-tinted banner appears above the output content: "Your prompt is ready — try it out" with helper text about copying into any AI tool.

### 3.8 Refinement Card Styling

The combined caveat + refinement card uses:
- Warm cream background: `#FFFBF0`
- Gold border: `1px solid #F7E8A4` with `4px solid #F7E8A4` left accent bar
- ✨ icon (replaced the old `<Info>` icon)
- CTA text: "Sharpen this prompt — add more context"

The refinement section expands to show AI-generated questions (from `result.refinement_questions`) plus a freeform "additional context" textarea.

### 3.9 Output Actions Panel

Below the main output, an `OutputActionsPanel` component (shared across toolkit pages) provides additional actions. It follows the same visibility animation pattern (staggered `visibleBlocks`).

---

## 4. What Was Built (Chronological)

### Session 1 — Strategy-Aware v2 Redesign (earlier, pre-handover)
- Implemented the full v2 Prompt Playground with strategy selection, structured output, cards/markdown views
- Added the 8 canonical prompting strategies to `data/playground-content.ts`
- Built the `generateplaygroundprompt` Cloud Function with `PLAYGROUND_V2_SYSTEM` prompt
- Added educational default state (before generation) showing strategy definitions
- Added loading progress indicator with staggered step animations

### Session 2 — Polish Round 1 (3 changes)
1. **Unified strategy card colors** — Replaced per-strategy `STRATEGY_COLORS` map with single `STRATEGY_COLOR = LEVEL_ACCENT`. All strategy cards, educational cards, and highlight accents now use `#A8F0E0`.
2. **Fixed excerpt highlighting** — Replaced simple `indexOf` with `findExcerptRange()` fuzzy matching (4-level fallback). Also strengthened the backend system prompt to emphasize verbatim excerpts.
3. **Merged layout** — Moved Cards/Markdown toggle to same row as Copy/Download/Save buttons using flex layout with spacer.

### Session 3 — Polish Round 2 (4 PRD changes)
1. **Numbered badges** — Added `BadgeCircle` component. Modified `renderHighlightedPrompt` to inject badges at ALL excerpt locations simultaneously. Added matching badges to strategy card headers. Removed old "↑ See highlighted section" dashed box and single-strategy "highlighted above" bar.
2. **Refinement card restyled** — Background to `#FFFBF0`, border to `#F7E8A4`, added left accent bar, changed icon to ✨, CTA to "Sharpen this prompt — add more context".
3. **Loading timing stretched** — `STEP_DELAYS` updated to `[800, 1500, 3000, 4000, 4500, 5000, -1]` (last step open-ended).
4. **Next Step Banner** — Added above output content with mint-tinted background, 🎯 icon, and helper copy.

---

## 5. Deployment Status

- **Hosting**: Deployed successfully (latest build includes all changes)
- **Functions**: `generateplaygroundprompt` deployed successfully. Several unrelated functions (`designagent`, `enhanceprompt`, etc.) failed due to CPU quota exceeded — this is a pre-existing infrastructure issue, not related to Prompt Playground changes.
- **Uncommitted changes**: `AppPromptPlayground.tsx` changes from Sessions 2-3 are deployed but NOT committed to git. Run `git status` to see full list.

---

## 6. Known Issues & Future Work

### 6.1 Uncommitted Changes
The Prompt Playground changes from the polish sessions are deployed to Firebase but not committed. You should commit them.

### 6.2 CPU Quota Issue
Multiple Cloud Functions fail to deploy with "Quota exceeded for total allowable CPU per project per region." This affects `designagent`, `enhanceprompt`, `analyzearchitecture`, `summarizerole`, `generatebuildguide`, `analyzeinsight`, `evaluateapp`, `designdashboard`, `generatepathway`, `resolvedispute`, `agentsetupguide`, `generaten8nworkflow`. Fix requires either waiting for instances to scale down or requesting a quota increase in GCP Console.

### 6.3 Excerpt Matching Reliability
The fuzzy matching in `findExcerptRange()` handles most cases but isn't perfect. If the LLM significantly rewrites the excerpt vs. what appears in the prompt, some badges may not appear. The backend system prompt mitigates this but LLMs are non-deterministic.

### 6.4 Badge Overlap
If two strategy excerpts overlap in the prompt text, the deduplication logic keeps only the first and drops the second. This is rare since strategies typically apply to different sections.

### 6.5 `activeHighlight` State — Partially Vestigial
The `activeHighlight` state and `toggleCard` function still exist and control which excerpt gets a stronger highlight when a strategy card is clicked/expanded. This works alongside the always-visible badges. The state could potentially be removed if the badges alone are sufficient, but currently it provides useful emphasis.

---

## 7. The 8 Canonical Prompting Strategies

Defined in `data/playground-content.ts` as `STRATEGY_DEFINITIONS`:

| ID | Name | Icon |
|----|------|------|
| `STRUCTURED_BLUEPRINT` | Structured Blueprint | 🏗️ |
| `CHAIN_OF_THOUGHT` | Chain-of-Thought | 🧠 |
| `PERSONA_EXPERT_ROLE` | Persona / Expert Role | 🎭 |
| `OUTPUT_FORMAT_SPECIFICATION` | Output Format Specification | 📐 |
| `CONSTRAINT_FRAMING` | Constraint Framing | 🚧 |
| `FEW_SHOT_EXAMPLES` | Few-Shot Examples | 📖 |
| `ITERATIVE_DECOMPOSITION` | Iterative Decomposition | 🔗 |
| `TONE_AND_VOICE` | Tone & Voice Setting | 🎙️ |

---

## 8. Design Standards Reference

All toolkit pages must follow `PRD/TOOLKIT-PAGE-STANDARD.md`. Key rules for Prompt Playground:

- **§1.5** — Level-themed accent colors, never hardcode teal. Use `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK`.
- **§3.7** — Educational default section: output section cards use `LEVEL_ACCENT_DARK`.
- **Layout** — `padding: '28px 36px'` with no maxWidth (fills available space).
- **Font** — DM Sans only. Never use Plus Jakarta Sans in app pages.
- **Animations** — Staggered block animations via `visibleBlocks` counter, `ppFadeIn` / `ppSlideDown` keyframes.

---

## 9. API Contract

### Request
```
POST /api/generateplaygroundprompt
Content-Type: application/json

{
  "userMessage": "string — the user's task description",
  "previousResult": PlaygroundResult | null,    // for refinements
  "refinementAnswers": Record<string, string>,  // answers to refinement questions
  "additionalContext": "string"                 // freeform refinement context
}
```

### Response — `PlaygroundResult`
```typescript
interface PlaygroundResult {
  prompt: string;                    // The generated optimised prompt
  strategies_used: PlaygroundStrategy[];  // 2-4 strategies with annotations
  refinement_questions: string[];    // 3-5 questions to improve the prompt
}

interface PlaygroundStrategy {
  id: StrategyId;
  name: string;
  icon: string;
  prompt_excerpt: string;   // Verbatim substring of `prompt` demonstrating this strategy
  how_applied: string;      // How the strategy was applied in this specific prompt
  why: string;              // Why this strategy was chosen
  what: string;             // General description of the strategy
}
```

---

## 10. Local Development

```bash
# Start dev server (Vite proxy handles API calls to localhost)
npm run dev

# Build + deploy
npx vite build && npx firebase-tools deploy --only hosting,functions

# Build functions only (if TS changes in functions/)
cd functions && npm run build && cd ..
```

The `vite.config.ts` proxy mirrors the Cloud Function for local dev. The `generateplaygroundprompt` proxy is defined there — if the system prompt or API logic changes in `functions/src/index.ts`, you may also need to update the Vite proxy (check if it has its own copy of the logic or just forwards to the function).
