# Design Review Output Standard

> This document defines the exact structure, layout, component hierarchy, and interaction patterns for the **Design Review output step** — the step in any toolkit tool where the AI-generated design is presented for the user to review, refine, and approve before proceeding. Use this as the single source of truth for how design review output is rendered, styled, and interacted with.
>
> For the general toolkit page structure (step cards, connectors, locking, animations), refer to `TOOLKIT-PAGE-STANDARD.md`. For the final Build Guide/Build Plan output step, refer to `BUILD-GUIDE-OUTPUT-STANDARD.md`. This document covers **only** the design review step — the intermediate step where the user evaluates and approves the AI's work before moving on to platform selection or export.

---

## 1. Overview & Purpose

The Design Review output step is the **second major step** in most toolkit tools. It sits between the user's initial input (Step 1) and the downstream actions (platform selection, build plan generation, export). It is the point where the user sees what the AI produced and decides whether to approve, refine, or restart.

The design review step must accomplish four things:

1. **Quality signal** — an at-a-glance score or assessment tells the user how strong the output is
2. **Primary deliverable** — the main output (system prompt, PRD, workflow spec, etc.) is displayed with both structured and raw views
3. **Supplementary views** — additional facets of the output (output format, accountability, metadata) are accessible via toggle tabs
4. **Iterative refinement** — the user can provide additional context and regenerate without starting over

---

## 2. Component Hierarchy (Top to Bottom)

The Design Review output step renders the following blocks in strict order inside a `StepCard`:

```
StepCard (stepNumber=2, title="Your [X] design", collapsed=stepDone)
│
├── 2.1  Loading State (ProcessingProgress) — shown while API call is in flight
│
└── Generated Output (shown once result is available)
    │
    ├── 2.2  Quality Score Banner
    │   └── Expandable detail panel (criteria breakdown)
    │
    ├── 2.3  Primary Output Section
    │   ├── Section header + Copy button
    │   ├── View Toggle Row (Cards / Markdown + supplementary tabs)
    │   ├── Content area (switches based on active view)
    │   └── Framework labels (if applicable)
    │
    ├── 2.4  Refinement Section (caveat + expandable questions)
    │
    └── 2.5  Bottom Navigation Row (Back / Approve / Start Over)
```

---

## 3. Step Card Configuration

The Design Review step uses the following `StepCard` props:

| Prop | Value | Rationale |
|------|-------|-----------|
| `stepNumber` | `2` (typically) | Follows the input step |
| `title` | `"Your [X] design"` when result exists, `"Review your [X] design"` when locked/loading | Dynamic title signals state |
| `subtitle` | `"Your [X] has been designed across N sections. Review, copy, or save the complete design."` | Sets expectation |
| `done` | `stepDone` (e.g., user clicked "Approve") | True once the user explicitly approves |
| `collapsed` | `stepDone` | Collapses when approved, per progressive disclosure rule |
| `locked` | `!result && !isLoading` | Unlocks when loading starts or result exists |
| `lockedMessage` | `"Complete Step 1 to generate your [X] design"` | References the preceding step |

---

## 4. Loading State (§2.1)

While the design is being generated (or refined), the step shows a `ProcessingProgress` indicator. This is the **same** `ProcessingProgress` component used in the Build Guide Output Standard.

### 4.1 Loading Steps

Each tool defines its own loading step labels tailored to its domain. The general pattern is:

| # | Pattern | Example (Agent Builder) | Example (App Designer) |
|---|---------|------------------------|----------------------|
| 1 | Evaluating input… | Evaluating readiness… | Analysing requirements… |
| 2 | Structuring output… | Designing output format… | Defining screen layout… |
| 3 | Writing primary deliverable… | Writing system prompt… | Writing PRD sections… |
| 4 | Adding quality features… | Adding accountability features… | Adding interaction specs… |
| 5 | Scoring/evaluating… | Scoring criteria… | Evaluating complexity… |
| 6 | Generating follow-ups… | Generating refinement questions… | Generating refinement questions… |
| 7 | Finalising… | Finalising design… | Finalising design… |

**Refinement loading steps** follow the same structure but with "Re-" / "Refining" / "Updating" prefixes.

### 4.2 Timing

Front-loaded timing — early steps fast, later steps slower:

```
[800, 1500, 3000, 4000, 4500, 4000, 4000]  // ~21.8s total
```

Last step may use `-1` (open-ended) to stay spinning until the API returns.

### 4.3 Loading Placement Rule

**Critical rule (from Toolkit Standard §1.3):** Loading indicators belong inside the **design review step** (the step that will display the result), NOT inside the input step that triggered the action. When the user clicks "Design My Agent" in Step 1:

1. Step 1 sets `step1Done = true` → immediately collapses → shows "Done ✓"
2. Step 2 unlocks (`isLoading = true` makes `locked` false)
3. Step 2 shows `ProcessingProgress` inside its children
4. When the API returns, `ProcessingProgress` is replaced by the generated output

---

## 5. Quality Score Banner (§2.2)

The first element inside the generated output. Provides an at-a-glance quality assessment of the AI's work.

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Score Ring]   Verdict headline                            │
│     85%         Rationale text (truncated to 200 chars)     │
│                                                [Learn more ▾]│
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Score Ring

A compact conic-gradient circle showing the percentage:

| Property | Value |
|----------|-------|
| Outer ring | 56×56px, `conic-gradient(scoreColor ${score * 3.6}deg, #E2E8F0 0deg)` |
| Inner circle | 44×44px, `background: #F7FAFC`, centered |
| Score text | fontSize 15, fontWeight 800, color `scoreColor` |

### 5.3 Score Colors

Dynamic color based on the score value:

| Range | Color | Meaning |
|-------|-------|---------|
| 80–100 | `#38B2AC` (teal) | Strong candidate |
| 50–79 | `#C4A934` (amber) | Possible with caveats |
| 0–49 | `#E57A5A` (coral) | Not recommended |

### 5.4 Verdict & Rationale

| Element | Spec |
|---------|------|
| Verdict | fontSize 16, fontWeight 700, color `#1A202C`, lineHeight 1.3 |
| Rationale | fontSize 13, color `#718096`, lineHeight 1.5, truncated to 200 characters with `…` |

### 5.5 "Learn more" Toggle

| Property | Value |
|----------|-------|
| Font | fontSize 12, fontWeight 600, color `LEVEL_ACCENT_DARK` |
| Icon | `ChevronDown` (13px), rotates 180° when expanded |
| Behavior | Toggles the expanded detail panel |

### 5.6 Expanded Detail Panel

Slides in below the score banner (`marginTop: -8px` to connect visually):

```
┌─────────────────────────────────────────────────────────────┐
│  Criterion Label    Assessment text              [▓▓▓░░] 75 │
│  Criterion Label    Assessment text              [▓▓▓▓░] 85 │
│  Criterion Label    Assessment text              [▓▓░░░] 40 │
│  ...                                                         │
│  Full rationale text (no truncation)                         │
└─────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | `background: #FFFFFF`, `borderRadius: 12`, `border: 1px solid #E2E8F0`, `padding: 18px 20px` |
| Animation | `ppSlideDown 0.2s ease both` |
| Criterion label | width 120px, fontSize 12, fontWeight 600, color `#1A202C` |
| Assessment text | flex 1, fontSize 12, color `#718096` |
| Progress bar | width 80px, height 5px, `borderRadius: 3`, `background: #E2E8F0`, fill uses `scoreColor` |
| Score number | width 28px, fontSize 11, fontWeight 600, color `#718096`, right-aligned |
| Full rationale | fontSize 12, color `#718096`, lineHeight 1.6, marginTop 12 |

### 5.7 Staggered Animation

The score banner animates in as the first visible block:
```tsx
opacity: visibleBlocks >= 1 ? 1 : 0,
transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
transition: 'opacity 0.3s, transform 0.3s',
```

### 5.8 Adapting the Score for Different Tools

Each tool defines its own scoring dimensions. The AI backend must return a score object with this shape:

```typescript
interface DesignScore {
  overall_score: number;         // 0–100
  verdict: string;               // One-line human summary
  rationale: string;             // 2–3 sentence explanation
  criteria: Record<string, {
    label: string;               // Display name
    score: number;               // 0–100
    assessment: string;          // One-line per criterion
  }>;
}
```

**Examples of tool-specific criteria:**

| Tool | Criteria |
|------|----------|
| **Agent Builder** | Frequency, Consistency, Shareability, Complexity, Standardization Risk |
| **Prompt Playground** | Clarity, Specificity, Completeness, Actionability, Reproducibility |
| **App Designer** | Feasibility, Scope Clarity, User Value, Technical Complexity, Data Requirements |
| **Workflow Canvas** | Automation Potential, Integration Complexity, Error Handling, Scalability, ROI |
| **Dashboard Designer** | Data Availability, Visual Clarity, Audience Fit, Interactivity Needs, Maintenance Burden |

The backend system prompt for each tool must include instructions to score the user's input across the relevant criteria and return the `DesignScore` object as part of the response.

---

## 6. Primary Output Section (§2.3)

The main deliverable of the design step. This is the section the user will copy, paste, and use.

### 6.1 Section Header

```
┌─────────────────────────────────────────────────────────────┐
│  📝 YOUR SYSTEM PROMPT                        [Copy] (teal) │
└─────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Icon | Tool-specific emoji (📝 for prompts, 📄 for PRDs, etc.), fontSize 15 |
| Label | fontSize 13, fontWeight 700, color `#1A202C`, uppercase, letterSpacing `0.04em` |
| Copy button | `ActionBtn` with `primary` style, icon `Copy` → `Check`, label `"Copy"` → `"Copied!"` |

### 6.2 View Toggle Row

A flex row with the primary view toggle on the left and supplementary tabs on the right:

```
┌─────────────────────────────────────────────────────────────┐
│ [Cards] [Markdown]  1,234 chars    [📐 Output Format] [✅ ...]│
└─────────────────────────────────────────────────────────────┘
```

**Primary toggle (left):**

| Property | Value |
|----------|-------|
| Container | `display: flex`, `background: #F7FAFC`, `borderRadius: 8`, `border: 1px solid #E2E8F0` |
| "Cards" button | Active: `background: #1A202C`, `color: #FFFFFF` / Inactive: `transparent`, `#718096` |
| "Markdown" button | Active: `background: #2B6CB0`, `color: #FFFFFF` (blue) / Inactive: same as Cards |
| Icons | `Eye` (12px) for Cards, `Code` (12px) for Markdown |
| Font | fontSize 12, fontWeight 600 (active: 700) |
| Default | Cards view |

**Character count** (optional): `fontSize: 11`, `color: #A0AEC0`, shown next to the toggle.

**Supplementary tabs (right):**

Tool-specific tabs that toggle additional views. Each tab is a button:

| Property | Active State | Inactive State |
|----------|-------------|----------------|
| Background | `${LEVEL_ACCENT}30` | `#F7FAFC` |
| Border | `1.5px solid ${LEVEL_ACCENT_DARK}` | `1px solid #E2E8F0` |
| Color | `LEVEL_ACCENT_DARK` | `#4A5568` |
| Font | fontSize 11, fontWeight 600 |
| Padding | `6px 12px` |
| Border radius | `8px` |
| Icon | fontSize 13, tool-specific emoji |

Clicking an active tab returns to the Cards view. Clicking an inactive tab switches to that view.

**Examples of supplementary tabs by tool:**

| Tool | Tab 1 | Tab 2 |
|------|-------|-------|
| **Agent Builder** | 📐 Output Format | ✅ Accountability |
| **App Designer** | 🗺️ Screen Map | 📊 Data Model |
| **Workflow Canvas** | 🔗 Node Map | ⚙️ Trigger Logic |
| **Prompt Playground** | None (prompt-only) | None |

### 6.3 Content Area — Cards View (Default)

The Cards view renders the primary output with rich formatting:

| Property | Value |
|----------|-------|
| Container | `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 18px 20px`, `maxHeight: 500`, `overflowY: auto` |
| Text | fontSize 13, color `#2D3748`, lineHeight 1.7, `whiteSpace: pre-wrap` |

**Color-coded sections (if applicable):** When the output contains framework markers (e.g., `[ROLE]`, `[CONTEXT]`, `[TASK]`), each section is rendered with a distinct background color using a `renderColorCodedPrompt()` function. Each marker gets:
- A small colored label badge (fontSize 10, fontWeight 600, letterSpacing `0.05em`)
- A background highlight spanning the section text

**Framework labels row:** Shown below the content for Cards and Markdown views:
- Container: flex row, `gap: 6`, `flexWrap: wrap`, `fontSize: 12`, `color: #718096`, marginTop 8
- Each label: inline pill, fontSize 10, fontWeight 700, letterSpacing `0.04em`, `padding: 2px 8px`, `borderRadius: 6`, background and border tinted to match the section color

### 6.4 Content Area — Markdown View

Raw text displayed in a dark code container:

| Property | Value |
|----------|-------|
| Container | `background: #1A202C`, `borderRadius: 12`, `padding: 20px 22px`, `overflow: auto`, `maxHeight: 500` |
| Font | `'JetBrains Mono', 'Fira Code', monospace`, fontSize 13, lineHeight 1.7 |
| Color | `#E2E8F0` |
| White space | `pre-wrap` |

### 6.5 Content Area — Supplementary Views

Each supplementary tab renders a dedicated panel:

| Property | Value |
|----------|-------|
| Container | `background: #FFFFFF`, `borderRadius: 12`, `border: 1px solid #E2E8F0`, `padding: 18px 20px` |
| Animation | `ppSlideDown 0.2s ease both` |
| Intro text | fontSize 12, color `#718096`, lineHeight 1.5, marginBottom 14 |

The content inside each supplementary view is tool-specific. For example:
- **Output Format** (Agent Builder): Side-by-side grid — human-readable view (left) + JSON template (right)
- **Accountability** (Agent Builder): List of accountability checks with severity badges
- **Screen Map** (App Designer): Visual grid of screens with navigation arrows
- **Data Model** (App Designer): Entity-relationship table or schema view

### 6.6 Staggered Animation

The primary output section animates in as the second visible block:
```tsx
opacity: visibleBlocks >= 2 ? 1 : 0
```

---

## 7. Refinement Section (§2.4)

A collapsible card that allows the user to provide additional context and regenerate the design. This follows the exact same pattern as the Build Guide Output Standard §10.

### 7.1 Collapsed State

```
┌─────────────────────────────────────────────────────────────┐
│  ⓘ  This [X] design is a strong starting point, but every  │
│     environment is different. Test the [primary output] in  │
│     your actual [platform/context], and adjust as needed.   │
│                                                             │
│     Would you like to refine this [X] design further?  ▾   │
│                                            [Refinement #N]  │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Container | `background: #F7FAFC`, `borderRadius: 14`, `border: 1px solid #E2E8F0`, `padding: 20px 24px`, `marginBottom: 16` |
| Icon | `Info` (16px, `#A0AEC0`) |
| Caveat text | fontSize 13, color `#718096`, lineHeight 1.6 |
| Expand CTA | fontSize 13, fontWeight 600, color `LEVEL_ACCENT_DARK`, hover → opacity 0.8 |
| Refinement badge | `background: LEVEL_ACCENT`, `color: LEVEL_ACCENT_DARK`, `borderRadius: 20`, `padding: 2px 10px`, fontSize 11, fontWeight 600 |

### 7.2 Expanded State

When expanded, a divider + refinement form appears below the caveat:

```
┌─────────────────────────────────────────────────────────────┐
│  ⓘ  [caveat text]                                          │
│  ─────────────────────────────────────────────────────      │
│  REFINE YOUR [X] DESIGN                [Refinement #N] ✕   │
│  Answer any of these to add context...                      │
│                                                             │
│  Q1: [AI-generated contextual question]                     │
│  [text input]                                               │
│  Q2: [AI-generated contextual question]                     │
│  [text input]                                               │
│  ...                                                        │
│  Anything else to add?                                      │
│  [textarea]                                                 │
│                                                             │
│  [→ Refine [X] Design]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Refinement Questions

Questions should be **AI-generated and task-specific**, returned as part of the design API response. The backend must include a `refinement_questions: string[]` field (typically 3–5 questions).

**Question generation rules:**
- Questions must reference the user's actual task, data, and context
- Questions should seek information that would meaningfully improve the output
- Questions should NOT ask about things already specified in Step 1
- Each question gets a single-line `<input>` with placeholder `"Your answer…"`
- A final `<textarea>` with label `"Anything else to add?"` (minHeight 60px)

### 7.4 Input Styling

| Property | Value |
|----------|-------|
| Label | fontSize 13, fontWeight 600, color `#2D3748` |
| Input/Textarea | `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: 10px 14px`, fontSize 13, `background: #FFFFFF` |
| Focus state | `borderColor: LEVEL_ACCENT_DARK` |
| Gap between questions | `marginBottom: 16` |

### 7.5 Refine Button

| Property | Value |
|----------|-------|
| Style | `ActionBtn` with `primary` (teal) |
| Label | `"Refine [X] Design"` (idle) / `"Refining…"` (loading with spinner) |
| Icon | `iconAfter={<ArrowRight size={13} />}` (idle) / spinner (loading) |
| Disabled | When no inputs have content OR when `isLoading = true` |

### 7.6 Refinement Behavior

When the user clicks "Refine":
1. `isRefineLoading = true`
2. Answered questions + additional context are assembled into a refinement message
3. A new API call is made with the enriched context (same endpoint, prepended with `[REFINEMENT]`)
4. On success: `result` is updated, `refinementCount` increments, inputs are cleared
5. Step 2 replaces its content with the new design (full re-render)
6. `ProcessingProgress` shows refinement-specific loading steps during generation

### 7.7 Staggered Animation

The refinement section animates in as the third or later visible block:
```tsx
opacity: visibleBlocks >= 4 ? 1 : 0
```

---

## 8. Bottom Navigation Row (§2.5)

The final element in the design review step. Provides navigation backward, forward (approve), and full reset.

### 8.1 Layout

```
[← Back to Step 1]  [Approve [X] →]  [↺ Start Over]
```

### 8.2 Buttons

| Button | Style | Icon | Label | Behavior |
|--------|-------|------|-------|----------|
| Back to Step 1 | default (white) | `ArrowRight` rotated 180° (before label) | `"Back to Step 1"` | Clears result, re-opens Step 1 |
| Approve [X] | `primary` (teal) | `ArrowRight` (after label via `iconAfter`) | `"Approve Prompt"` / `"Approve PRD"` / etc. | Sets `stepDone = true`, scrolls to Step 3 |
| Start Over | default (white) | `RotateCcw` (before label) | `"Start Over"` | Resets ALL state, scrolls to top |

### 8.3 "Approve" Behavior

When the user clicks "Approve":
1. `step2Approved = true` → step collapses to "Done ✓" state
2. Step 3 unlocks and scrolls into view
3. The approved output is passed downstream (e.g., the system prompt is used in the build plan generation)

**Important:** The user must explicitly approve — the step does NOT auto-approve when the result arrives. This gives the user the chance to refine before committing.

### 8.4 "Back to Step 1" Reset Behavior

Resets:
- `result = null`
- `visibleBlocks = 0`
- `step2Approved = false`

Does NOT reset:
- Step 1 inputs (task description, etc.) — preserved so the user can edit and re-submit

### 8.5 Styling

`display: flex`, `alignItems: center`, `gap: 8`, `marginTop: 16`, `flexWrap: wrap`.

---

## 9. Staggered Block Animation System

The output content uses a `visibleBlocks` counter to stagger the appearance of major sections.

### 9.1 Block Assignments

| Block # | Content |
|---------|---------|
| 1 | Quality Score Banner |
| 2 | Primary Output Section (header + toggle + content) |
| 3 | (reserved for additional output sections if needed) |
| 4+ | Refinement Section |

### 9.2 Timing

Triggered when `result` becomes non-null:
- `visibleBlocks` resets to 0
- `scoreAnimated` resets to false
- Each block appears 120ms after the previous, starting at 150ms
- Total sections: 7 (4 content sections + actions + refinement + buffer)

### 9.3 Application

Each animated block wraps its content with:
```tsx
style={{
  opacity: visibleBlocks >= N ? 1 : 0,
  transform: visibleBlocks >= N ? 'translateY(0)' : 'translateY(8px)',
  transition: 'opacity 0.3s, transform 0.3s',
}}
```

---

## 10. State Variables Reference

All state variables involved in the Design Review output:

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `result` | `DesignResult \| null` | `null` | The AI-generated design (tool-specific shape) |
| `isLoading` | `boolean` | `false` | Whether the design API call is in flight |
| `isRefineLoading` | `boolean` | `false` | Whether a refinement (vs initial) generation is in progress |
| `visibleBlocks` | `number` | `0` | Counter for staggered block animation |
| `scoreAnimated` | `boolean` | `false` | Whether the score ring has animated in |
| `loadingStep` | `number` | `0` | Current step in ProcessingProgress |
| `activeView` | `'cards' \| 'markdown' \| string` | `'cards'` | Current view toggle state (includes supplementary tab keys) |
| `expandedSections` | `Set<string>` | `new Set(['primary'])` | Which detail panels are expanded |
| `copied` | `boolean` | `false` | Whether the copy button was just clicked |
| `refinementAnswers` | `Record<number, string>` | `{}` | User's answers to refinement questions |
| `additionalContext` | `string` | `''` | Free-text refinement input |
| `refinementCount` | `number` | `0` | How many times the user has refined |
| `refineExpanded` | `boolean` | `false` | Whether the refinement section is expanded |
| `step2Approved` | `boolean` | `false` | Whether the user has approved and moved on |

---

## 11. Backend API Contract

Every tool that implements the Design Review pattern must return a response with at least these fields:

```typescript
interface DesignReviewResponse {
  // Quality score (§5)
  readiness: {
    overall_score: number;
    verdict: string;
    rationale: string;
    criteria: Record<string, {
      score: number;
      assessment: string;
    }>;
  };

  // Primary deliverable (§6)
  // Tool-specific — e.g., system_prompt, prd_markdown, workflow_spec
  [primary_output_key: string]: any;

  // Supplementary data (§6.5)
  // Tool-specific — e.g., output_format, accountability, screen_map
  [supplementary_key: string]: any;

  // Refinement questions (§7.3)
  refinement_questions: string[];
}
```

The backend system prompt must include instructions to:
1. Score the user's input across tool-specific criteria (§5.8)
2. Generate the primary deliverable
3. Generate supplementary data for the supplementary tabs
4. Generate 3–5 task-specific refinement questions

---

## 12. Adapting for Different Tools

When implementing the Design Review pattern in a new tool, customize these elements:

| Element | What to change |
|---------|---------------|
| **Step title** | `"Your [X] design"` — e.g., "Your agent design", "Your app design", "Your workflow design" |
| **Score criteria** | Define 3–6 scoring dimensions relevant to the tool (§5.8) |
| **Primary output label** | `"YOUR SYSTEM PROMPT"` / `"YOUR PRD"` / `"YOUR WORKFLOW SPEC"` etc. |
| **Primary output icon** | 📝 for prompts, 📄 for documents, 🔧 for workflows, etc. |
| **Supplementary tabs** | Define 0–2 tabs with tool-specific content (§6.2) |
| **Cards view rendering** | Tool-specific formatting (color-coded sections, structured cards, etc.) |
| **Framework labels** | If the output uses a framework (e.g., Prompt Blueprint), show the labels |
| **Caveat text** | Tool-specific advice about testing and adapting the output |
| **Refinement CTA** | `"Would you like to refine this [X] design further?"` |
| **Approve button label** | `"Approve Prompt"` / `"Approve PRD"` / `"Approve Design"` etc. |
| **Loading steps** | 5–7 domain-specific labels (§4.1) |
| **Accent colors** | Use the tool's `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK` constants |

---

## 13. Checklist for Implementing a Design Review Step

Use this when building or auditing a Design Review output step:

- [ ] StepCard title is dynamic: shows `"Review your [X] design"` when locked, `"Your [X] design"` when result exists
- [ ] StepCard collapses when the user clicks "Approve", not when the result arrives
- [ ] Loading shows ONLY in the design review step, not in the input step that triggered the action
- [ ] ProcessingProgress shows 5–7 steps with domain-specific labels and front-loaded timing
- [ ] Quality score banner appears as the first element with conic-gradient ring
- [ ] Score uses dynamic colors (teal/amber/coral) based on score value
- [ ] "Learn more" expands a criteria breakdown panel with per-criterion progress bars
- [ ] Primary output section has Copy button (teal) in the header
- [ ] View toggle defaults to Cards, Markdown button uses blue `#2B6CB0` highlight
- [ ] Supplementary tabs (if any) use `LEVEL_ACCENT` colors when active
- [ ] Clicking an active supplementary tab returns to Cards view
- [ ] Cards view shows formatted content (color-coded sections, structured layout)
- [ ] Markdown view shows raw text in dark monospace container
- [ ] Refinement section starts collapsed with caveat text + expand CTA
- [ ] Refinement questions are AI-generated and task-specific (not generic)
- [ ] Refine button triggers re-generation with enriched context
- [ ] Refinement count badge shows after the first refinement
- [ ] Bottom navigation has "Back to Step 1" (preserves inputs), "Approve [X]" (primary), "Start Over" (full reset)
- [ ] Approve button uses `primary` style with `iconAfter` arrow
- [ ] All animations use staggered `visibleBlocks` system
- [ ] DM Sans font throughout, monospace for code/raw views only
- [ ] All accent colors use `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK` constants
- [ ] Backend returns `readiness` (score), primary output, supplementary data, and `refinement_questions`

---

## 14. File & Component Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProcessingProgress` | Inline per tool page | 5–7 step loading indicator |
| `ActionBtn` | Inline per tool page | Standardised button (primary/default variants) |
| `ToggleBtn` | Inline per tool page | Cards/Markdown view toggle pill |
| `InfoTooltip` | Inline per tool page | Hover tooltip for contextual help |
| `StepCard` | Inline per tool page | Step container with locking/collapsing |
| `StepConnector` | Inline per tool page | Animated dashed connector between steps |

---

## 15. Reference Implementation

The **Agent Builder** (`components/app/toolkit/AppAgentBuilder.tsx`) is the reference implementation of this standard. Its Step 2 implements every pattern described in this document:

- Quality score: `result.readiness` with 5 criteria (frequency, consistency, shareability, complexity, standardization)
- Primary output: System prompt with color-coded Prompt Blueprint sections
- Supplementary tabs: Output Format (human-readable + JSON) and Accountability (severity-tagged checks)
- Refinement: AI-generated questions via `result.refinement_questions`
- Bottom navigation: Back to Step 1, Approve Prompt, Start Over
