# Toolkit Page Design Standard

> This document defines the exact structure, design principles, and implementation patterns for every tool page within the My Toolkit section of the OXYGY AI Upskilling Platform. Use this as the single source of truth when building or refactoring any tool page under `/app/toolkit/*`.

---

## 1. Core Design Principles

### 1.1 User-First, Not Marketing
Every tool page is a **practical workspace**, not a sales page. There should be no promotional language, no "Did you know?" sections, no curved hero banners, and no navigation back to marketing content. The user is already here — help them get the job done.

### 1.2 Sequential Guided Flow
Every tool page follows a **step-by-step card progression**. Each step occupies the full width of the content area and guides the user through a clear sequence: configure → input → output. Users should never feel lost about what to do next.

### 1.3 Always-Visible Steps (Progressive Disclosure)
All step cards are **always rendered on the page**, even before the user reaches them. However, only **one step is fully expanded at a time** — the step the user is currently working on. Subsequent steps appear in a **locked state**: greyed out, with a short message indicating which step must be completed first (e.g., "Complete Step 1 to generate your agent design"). This gives users a clear overview of the full process while keeping focus on the current task and reducing visual clutter.

**Locked step behavior:**
- Background: `#FAFBFC` (slightly greyed)
- Opacity: `0.7`
- Badge: `background: #EDF2F7`, `color: #CBD5E0`
- Title color: `#A0AEC0` (muted)
- Locked message below title: `fontSize: 12`, `color: #A0AEC0`
- Children are NOT rendered — only the header row with the locked message

**Unlocking rules:**
- Step 1 is always expanded on page load
- Step 2 unlocks when Step 1's action is completed (e.g., "Design My Agent" returns results)
- Step 3 unlocks when the user explicitly approves Step 2's output (e.g., "Approve Prompt" button)
- Navigation buttons ("Back to Step 1", "Back to Step 2") re-expand the target step and re-lock downstream steps

**Immediate collapse rule (one step in focus at a time):**
Each step collapses to its "Done ✓" state **immediately** when its completion condition is met — not when a later step also completes. This ensures exactly one step is expanded at any time, keeping the user focused on their current task.

- `collapsed={stepDone}` — collapse is tied solely to the step's own done state, never gated on downstream steps (e.g., never `collapsed={step1Done && step2Done}`)
- **Step 1 must collapse immediately when Generate is clicked**, not when results arrive. The `step1Done` condition must include the loading state: `const step1Done = result !== null || isLoading;` (or equivalent). This ensures the input card closes and the user sees the loading progress in Step 2 without delay. **Gold standard:** Level 1 (Prompt Playground) and Level 2 (Agent Builder) — reference their implementations.
- Loading indicators (e.g., `ProcessingProgress`) belong **inside the next step's children**, not the step that triggered the action. When the user clicks "Generate", Step 1 collapses and Step 2 shows the loading state.
- The final output step of each tool is never collapsed (`collapsed={false}`) since there is no subsequent step to focus on.

### 1.4 No Pre-Generation Educational Content
Output steps should **not** show educational preview cards or framework explanations before the user generates output. This content adds visual clutter and delays the user from engaging with the tool. Instead, locked steps use the compact locked state described in §1.3, and output steps show the `ProcessingProgress` indicator (§9.5) during generation, then reveal the actual results directly. Educational context is better served by the "How It Works" overview strip (§3.3) and the page description (§3.2).

### 1.5 Level-Themed Accent Colors
Each tool inherits the accent color of its level. This color is used **everywhere** that indicates completion or active state — step connectors, step badges (completed state), "How it works" overview badges, "Done ✓" labels, step card done borders, and all interactive accent elements throughout the page. **Never hardcode teal (`#38B2AC`) for these elements** — always use the tool's `LEVEL_ACCENT` and `LEVEL_ACCENT_DARK` constants.

| Level | Name | Accent | Accent Dark |
|-------|------|--------|-------------|
| 1 | Fundamentals & Awareness | `#A8F0E0` | `#1A6B5F` |
| 2 | Applied Capability | `#F7E8A4` | `#8A6A00` |
| 3 | Systemic Integration | `#38B2AC` | `#1A7A76` |
| 4 | Interactive Dashboards | `#F5B8A0` | `#8C3A1A` |
| 5 | AI-Powered Applications | `#C3D0F5` | `#2E3F8F` |

**Implementation pattern:** Define these as constants at the top of each tool page file:
```tsx
const LEVEL_ACCENT = '#F7E8A4';      // Set per tool based on level
const LEVEL_ACCENT_DARK = '#8A6A00';  // Set per tool based on level
```
Then use `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK` in StepBadge, StepConnector, StepCard borders, ToolOverview badges, and "Done" labels — never a hardcoded color.

### 1.6 No Emojis in Titles
Tool page titles are plain text. No emojis, no icons preceding the title. The title is the first thing the user sees.

---

## 2. Page Anatomy

Every tool page follows this exact vertical structure, top to bottom:

```
┌─────────────────────────────────────────────────────┐
│  Page Title (h1)                                    │
│  Description (2 lines max, full width)              │
├─────────────────────────────────────────────────────┤
│  How It Works — Overview Strip                      │
│  ┌──────────┐  ›  ┌──────────┐  ›  ┌──────────┐   │
│  │ Step 1   │     │ Step 2   │     │ Step 3   │   │
│  └──────────┘     └──────────┘     └──────────┘   │
│  ┌─ Outcome ────────────────────────────────────┐  │
│  │ Green bar describing the deliverable         │  │
│  └──────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  Step 1 Card (full width)                           │
│  [Expanded (active) OR collapsed "Done ✓"]          │
├─── Animated Connector ──────────────────────────────┤
│  Step 2 Card (full width)                           │
│  [Locked OR Expanded (active) OR collapsed "Done ✓"]│
├─── Animated Connector ──────────────────────────────┤
│  Step 3 Card (full width)                           │
│  [Locked OR Expanded (active) OR collapsed "Done ✓"]│
├─── Animated Connector (if Step 4 exists) ───────────┤
│  Step 4 Card (optional, full width)                 │
│  [Locked OR Expanded (active)]                      │
├─────────────────────────────────────────────────────┤
│  Toast Notification (fixed, bottom-center)          │
└─────────────────────────────────────────────────────┘
```

---

## 3. Section Specifications

### 3.1 Page Title

```tsx
<h1 style={{
  fontSize: 28, fontWeight: 800, color: '#1A202C',
  letterSpacing: '-0.4px', margin: 0, marginBottom: 6,
  fontFamily: "'DM Sans', sans-serif",
}}>
  {toolName}
</h1>
```

**Rules:**
- Plain text only — no emojis, no icons
- `fontSize: 28`, `fontWeight: 800`, `letterSpacing: '-0.4px'`
- `marginBottom: 6` (tight gap before description)

### 3.2 Description

```tsx
<p style={{
  fontSize: 14, color: '#718096', lineHeight: 1.7,
  margin: 0, marginBottom: 20,
  fontFamily: "'DM Sans', sans-serif",
}}>
  {description}
</p>
```

**Rules:**
- Maximum 2 lines at full page width (~180-220 characters)
- Must answer three questions in a single flowing paragraph:
  1. **Problem**: What challenge does the user face without this tool?
  2. **Function**: What does this tool actually do?
  3. **Outcome**: What tangible result will the user walk away with?
- Tone: Direct, confident, practical — no fluff or marketing language
- No line breaks within the paragraph

**Example (Prompt Playground):**
> "The quality of your AI output is directly determined by the quality of your prompt. Most people lose time going back and forth with vague instructions that produce generic results. The Prompt Playground helps you structure any request into a proven 6-part framework — giving you clearer, more actionable AI responses on the first try, whether you're drafting communications, building plans, or solving complex problems."

**Example (Agent Builder):**
> "Off-the-shelf AI assistants give generic answers because they lack the specifics of your role, your constraints, and your standards. The Agent Builder lets you configure a purpose-built AI agent with a defined persona, task boundaries, and quality checks — so every response is grounded in your context and ready to use."

**Example (Workflow Canvas):**
> "Most AI workflows break down at handoff points — where human judgement is needed, data changes format, or decisions branch. The Workflow Canvas lets you map multi-step AI processes visually, define triggers and checkpoints, and design workflows that are reliable, auditable, and ready to implement."

**Example (Dashboard Designer):**
> "Stakeholders need to see the impact of AI-driven processes, but translating data into clear dashboards is a skill gap for most teams. The Dashboard Designer guides you through a structured brief and generates a complete dashboard specification — from layout and widgets to data sources and interaction patterns."

**Example (App Builder):**
> "Building an AI-powered product requires decisions across architecture, data, personalisation, and user experience that most teams make ad-hoc. The App Builder walks you through a structured design process and produces a comprehensive product specification — covering everything from feature prioritisation to technical requirements."

### 3.3 How It Works — Overview Strip

A standardised component that sits below the description and above the step cards. It provides a bird's-eye view of the entire process.

```tsx
<ToolOverview
  steps={[
    { number: 1, label: 'Step label', detail: 'Brief description', done: step1Done },
    { number: 2, label: 'Step label', detail: 'Brief description', done: step2Done },
    { number: 3, label: 'Step label', detail: 'Brief description', done: false },
  ]}
  outcome="One sentence describing the tangible deliverable the user will get."
/>
```

**Layout:**
- White card, `borderRadius: 14`, `border: 1px solid #E2E8F0`, `padding: 20px 24px`
- "HOW IT WORKS" label: `fontSize: 11`, `fontWeight: 700`, `color: #A0AEC0`, uppercase, `letterSpacing: 0.06em`
- Steps displayed horizontally in a single row with `alignItems: 'center'`
- Each step: numbered badge (26px circle) + label (13px bold) + detail (12px muted)
- Chevron arrows (`ChevronRight`, 16px, `color: #CBD5E0`) between steps, **vertically centred** to the full step block (not just the title)
- Step badges use **level accent color** (`background: LEVEL_ACCENT`, `color: LEVEL_ACCENT_DARK`) with checkmark when `done: true` — not hardcoded teal
- Green outcome bar at the bottom: `background: #F0FFF4`, `border: 1px solid #C6F6D5`
  - "OUTCOME" label: `fontSize: 11`, `fontWeight: 700`, `color: #276749`
  - Description: `fontSize: 12`, `color: #2F855A`

### 3.4 Step Card

The primary container for each step of the tool flow.

```tsx
{/* Step collapses immediately when done — collapsed is always just stepDone, never gated on later steps */}
<StepCard
  stepNumber={1}
  title="Step title"
  subtitle="Brief instruction for this step"
  done={stepDone}
  collapsed={stepDone}
  locked={!prerequisiteMet}
  lockedMessage="Complete Step N to unlock this step"
>
  {/* Step content */}
</StepCard>
```

**Specifications:**
- `background: #FFFFFF`, `borderRadius: 16`
- Border: `1px solid #E2E8F0` (default) or `1px solid ${LEVEL_ACCENT}88` (when done)
- Padding: `24px 28px` (expanded) or `16px 24px` (collapsed/locked)
- Header row: StepBadge (32px circle) + title (16px, weight 700) + subtitle (13px, `#718096`)
- When `collapsed`: shows only header row with "Done ✓" indicator on the right
- When `locked`: shows header row with muted title (`#A0AEC0`) + locked message below title. Background changes to `#FAFBFC`, opacity `0.7`. Children are NOT rendered.
- When expanded: header + `marginBottom: 20` + children content

**Card states (mutually exclusive priority: locked > collapsed > expanded):**

| State | Background | Opacity | Title color | Shows |
|-------|-----------|---------|-------------|-------|
| Locked | `#FAFBFC` | `0.7` | `#A0AEC0` | Header + locked message only |
| Collapsed (done) | `#FFFFFF` | `1` | `#1A202C` | Header + "Done ✓" badge |
| Expanded (active) | `#FFFFFF` | `1` | `#1A202C` | Header + subtitle + children |

**Step Badge:**
- 32px circle, `fontWeight: 800`, `fontSize: 13`
- Incomplete: `background: #F7FAFC`, `border: 2px solid #E2E8F0`, `color: #718096`
- Locked: `background: #EDF2F7`, `border: 2px solid #E2E8F0`, `color: #CBD5E0`
- Complete: `background: LEVEL_ACCENT`, `color: LEVEL_ACCENT_DARK`, checkmark icon — uses the tool's level accent color, not hardcoded teal

**"Done ✓" indicator (collapsed card):**
- `fontSize: 11`, `fontWeight: 600`, `color: LEVEL_ACCENT_DARK` — matches the level theme

### 3.5 Step Connector

Animated vertical connector between step cards. Uses the tool's level accent color.

```tsx
const LEVEL_ACCENT = '#38B2AC'; // Set per tool based on level

const StepConnector: React.FC = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '6px 0',
  }}>
    <div style={{
      width: 3, height: 24, borderRadius: 2,
      background: `repeating-linear-gradient(to bottom, ${LEVEL_ACCENT} 0px, ${LEVEL_ACCENT} 4px, transparent 4px, transparent 8px)`,
      backgroundSize: '3px 20px',
      animation: 'ppConnectorFlow 0.8s linear infinite',
    }} />
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${LEVEL_ACCENT}20`, border: `2px solid ${LEVEL_ACCENT}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: 2,
    }}>
      <ArrowDown size={14} color={LEVEL_ACCENT} />
    </div>
  </div>
);
```

**Required CSS animation:**
```css
@keyframes ppConnectorFlow {
  0% { background-position: 0 0; }
  100% { background-position: 0 20px; }
}
```

### 3.6 Step Locking (replaces Step Placeholder)

Steps that haven't met their prerequisites are rendered using the StepCard's built-in `locked` prop (see §3.4) rather than a separate placeholder component inside the card. The locked state is handled at the card level — the card itself appears greyed out with a message, and its children are not rendered at all.

**This replaces the old `StepPlaceholder` component.** The locked card pattern is simpler, more consistent, and reduces visual clutter by not showing a dashed-border placeholder inside an already-visible card.

**Implementation:**
```tsx
// Step 2 is locked until Step 1 produces results
<StepCard
  stepNumber={2}
  title="Review your agent design"
  subtitle="Your agent has been designed across 4 sections."
  done={step2Done}
  collapsed={step2Done}
  locked={!result && !isLoading}
  lockedMessage="Complete Step 1 to generate your agent design"
>
  {/* Only rendered when not locked */}
</StepCard>
```

### 3.7 Educational Default (DEPRECATED — use Locked Steps instead)

> **This pattern has been superseded by the locked step pattern (§1.3, §3.6).** Output steps that haven't met their prerequisites should use the StepCard `locked` prop to show a greyed-out card with a "Complete Step X" message — not a grid of educational preview cards.

**Rationale:** Educational preview cards (2×2 grids explaining "what this section is" with examples) add significant visual clutter before the user has even engaged with the tool. The locked step pattern is cleaner, focuses attention on the active step, and still communicates the full process via the "How It Works" overview strip (§3.3).

**Exception:** The Prompt Playground (Level 1) may retain educational strategy cards in its output step because the strategies themselves are core learning content that benefits from pre-generation visibility. All other tools should use locked steps.

### 3.8 Action Buttons

Two visual variants used throughout tool pages:

| Variant | Background | Text | Border | Use Case |
|---------|-----------|------|--------|----------|
| `primary` | `#38B2AC` (teal) | `#FFFFFF` | none | Primary CTA (Approve, Generate, Copy) |
| default | `#FFFFFF` | `#4A5568` | `1px solid #E2E8F0` | Secondary (Download, Start Over, Back) |

All buttons share: `borderRadius: 24`, `padding: 9px 18px`, `fontSize: 13`, `fontWeight: 600`, `gap: 6`, `fontFamily: FONT`.

**Icon placement rules:**
- **Forward-action buttons** (Approve Prompt, Generate Build Plan, Refine): Arrow icon goes **after** the label using `iconAfter={<ArrowRight size={13} />}`. Never place the arrow before the label.
- **Back buttons** (Back to Step X): Arrow icon goes **before** the label using `icon={<ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />}`.
- **Utility buttons** (Copy, Start Over): Icon goes **before** the label using `icon`.
- **Loading state**: Replace the `iconAfter` arrow with a spinner `<div>` (see §9.5). Update the label text (e.g., "Generating…").
- Never include arrow characters (`→`) in the label text when an `iconAfter` arrow icon is present.

**Deprecated:** The `accent` variant (purple `#5A67D8`) is removed. All primary CTAs use teal (`#38B2AC`) for visual consistency.

### 3.9 Toast Notification

Fixed bottom-centre notification for action confirmations.

```tsx
<div style={{
  position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
  background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
  padding: '10px 18px', fontSize: 13, fontWeight: 500,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
}}>
  {message} ✓
</div>
```

Auto-dismiss after 2500ms.

### 3.10 Step-Back Navigation

For tools with **3 or more steps**, users must be able to navigate back to any previous step without regenerating content. This prevents the frustration of being locked into a linear flow when they want to revise an earlier decision.

**Rules:**
- Every step (except Step 1) must include a "Back to {Previous Step}" button
- Back buttons use the **default** ActionBtn variant (white background, `ArrowLeft` icon)
- Clicking "Back" resets the current step and all subsequent steps — but preserves the state of the step the user is returning to
- The user's brief/input from Step 1 is always preserved unless "Start Over" is used
- Back buttons are placed at the **left edge** of the action button row, before primary actions

**Implementation pattern:**

```typescript
// Step-back handlers — reset current + downstream state, preserve upstream state
const handleGoBackToStep1 = () => {
  // Reset step 2 + step 3 state, keep step 1 (brief) intact
  setStep2State(initial); setStep3State(initial);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleGoBackToStep2 = () => {
  // Reset step 3 state, keep steps 1 + 2 intact
  setStep3State(initial);
};
```

**Placement:**
- In Step 2 action row: `<ActionBtn icon={<ArrowLeft />} label="Back to Brief" onClick={handleGoBackToStep1} />`
- In Step 3 action row: `<ActionBtn icon={<ArrowLeft />} label="Back to {Step 2 name}" onClick={handleGoBackToStep2} />`
- In Step 4 (if present): `<ActionBtn icon={<ArrowLeft />} label="Back to {Step 3 name}" onClick={handleGoBackToStep3} />`

**Note:** "Start Over" remains available as a separate action that resets ALL state including the Step 1 input.

---

## 4. Output Step Patterns

> **Design Review outputs:** Any tool that presents an AI-generated design for the user to review, refine, and approve (e.g., Agent Builder Step 2, App Designer Step 2) must follow the dedicated **[Design Review Output Standard](DESIGN-REVIEW-OUTPUT-STANDARD.md)**. That document defines the quality score banner, primary output view (Cards/Markdown toggle + supplementary tabs), refinement flow, and bottom navigation (Back / Approve / Start Over) specific to design review steps.
>
> **Build Guide outputs:** Any tool that generates a Build Guide or Build Plan as its final deliverable (e.g., Workflow Canvas Step 4, Agent Builder Step 4) must follow the dedicated **[Build Guide Output Standard](BUILD-GUIDE-OUTPUT-STANDARD.md)**. That document defines the complete component hierarchy, layout, interaction patterns, loading states, refinement flow, and export behavior specific to Build Guide outputs. The patterns below still apply as general defaults for non–Build Guide output steps.

### 4.1 Cards + Markdown Toggle

When the output consists of structured sections, provide a **view toggle** between Cards view and Markdown view.

**Toggle component:**
- Pill-style toggle: `background: #F7FAFC`, `borderRadius: 10`, `border: 1px solid #E2E8F0`
- "Cards" button (default active): dark background when active
- "Markdown" button: blue highlight (`#2B6CB0`) when active — visually emphasised
- Info tooltip (ℹ️ button, 22px circle) next to the toggle explaining why Markdown is better

**Markdown view:**
- `background: #1A202C`, `borderRadius: 12`, `padding: 22px 24px`
- Monospace font: `'JetBrains Mono', 'Fira Code', monospace`
- `fontSize: 13`, `lineHeight: 1.8`, `color: #E2E8F0`
- **Important:** The Markdown view must show the tool's **cohesive deliverable** (see §4.4), not a raw dump of all output sections. Some sections are informational only (e.g., readiness scores) and should NOT appear in the Markdown view.

**Cards view:**
- 2-column grid (`gridTemplateColumns: '1fr 1fr'`, `gap: 12`)
- Each card: `borderLeft: 4px solid ${LEVEL_ACCENT_DARK}`, `background: ${LEVEL_ACCENT_DARK}12` — uses the tool's level accent color for all section cards, not per-section custom colors
- Per-section copy button (top-right corner of each card)
- Cards view shows ALL output sections — both informational and actionable — for the user to review

### 4.2 Action Layout

Output actions are organised into **three zones**: a top action row, an Output Actions Panel, and a bottom navigation row. Every toolkit page must provide all three zones consistently.

**Zone 1 — Top row (above output content):**
- **Left:** View toggle (Cards / Markdown) + InfoTooltip
- **Right (inline, wrapped in a `<div style={{ display: 'flex', gap: 8 }}>`):**
  1. **Copy {Deliverable Name}** — `primary` ActionBtn (teal). Label must name the specific deliverable, e.g., "Copy Full System Prompt", "Copy Build Guide". Never use generic labels like "Copy All".
  2. **Download (.md)** — default ActionBtn (white). Downloads the cohesive deliverable as a `.md` file with a date-stamped filename.
  3. **Save to Prompt Library** — `primary` ActionBtn (teal). Calls `dbSavePrompt()`. Shows disabled state with "Saved!" label after saving. Resets on new generation.

**Zone 2 — Output Actions Panel (between output content and refinement card):**
- Uses the `OutputActionsPanel` component (`components/app/workflow/OutputActionsPanel.tsx`)
- Provides **Download Markdown** (.md), **Download Word** (.doc with branded OXYGY HTML), and **Save to Library** as large, prominent cards
- Staggered animation via `visibleBlocks` counter
- Props: `workflowName`, `fullMarkdown`, `onSaveToArtefacts`, `isSaved`
- This zone is **required on every toolkit page** — it gives users a prominent, consistent location for export/save actions and adds Word document export that isn't available in the top row

**Zone 3 — Bottom navigation row (below refinement card):**
- **Back to previous step** (default ActionBtn) — only if the tool has a multi-step flow
- **Start Over** (default ActionBtn)
- No duplicate Copy/Download/Save here — they live in Zones 1 and 2
- Standard style: `display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap'`

**Download handler pattern:**
```tsx
const handleDownload = () => {
  if (!result) return;
  const date = new Date().toISOString().split('T')[0];
  const content = buildFull{Deliverable}(result); // cohesive deliverable
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `{tool-name}-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Key rules:**
- Copy/Download/Save all operate on the **cohesive deliverable**, not the full set of displayed sections
- Never use generic labels like "Copy All" or "Copy Output" — always name the specific deliverable
- All three actions must appear in every toolkit page's top action row (Zone 1) — this is not optional
- The OutputActionsPanel (Zone 2) must appear on every toolkit page between output content and the refinement card

### 4.4 Output = Cohesive Deliverable

**Principle:** The sections displayed on the Cards view are for the user's review and understanding. The **exported/copied/saved content** is a single cohesive deliverable that combines only the actionable sections into one usable artifact.

**Pattern:**
- Some output sections are **informational** (e.g., readiness assessment, score gauges). These are displayed for the user to review but are NOT included in copy/download/save.
- Other sections are **actionable** (e.g., system prompt, output format, accountability instructions). These are combined into a single cohesive deliverable.
- The `build{Deliverable}` function composes the cohesive deliverable from the actionable sections only.

**Example (Agent Builder):**
- **Displayed sections (Cards view):** Readiness Score, Output Format, System Prompt, Built-In Accountability — all 4 shown for review
- **Cohesive deliverable:** System Prompt + Output Format JSON + selected Accountability instructions — combined into one ready-to-use prompt
- **Excluded from deliverable:** Readiness Score (informational only — helps the user decide whether to proceed, but isn't part of the prompt)

**Implementation:**
```tsx
const buildFullSystemPrompt = (r: AgentDesignResult): string => {
  const selectedInstructions = r.accountability
    .filter((_, idx) => selectedChecks[idx])
    .map(c => c.prompt_instruction)
    .join('\n\n');
  return [
    r.system_prompt,
    '',
    '--- OUTPUT FORMAT ---',
    '',
    'You must respond using the following JSON structure:',
    '',
    '```json',
    JSON.stringify(r.output_format.json_template, null, 2),
    '```',
    '',
    '--- BUILT-IN ACCOUNTABILITY FEATURES ---',
    '',
    selectedInstructions,
  ].join('\n');
};
```

Each tool page must define its own `build{Deliverable}` function that composes the appropriate sections into a single, coherent output.

### 4.5 Iterative Refinement

Tools that generate AI output should support an **iterative refinement loop** — allowing the user to provide additional context and regenerate an improved version. This reinforces the learning principle that prompting is a conversation, not a one-shot task.

**Collapsed refinement card structure (caveat + refinement combined):**

This card is placed as the **last section** of the output area, after the OutputActionsPanel and before the bottom navigation row. It combines the practitioner caveat with the refinement questions in a single card that is **collapsed by default**.

```
┌──────────────────────────────────────────────────────┐
│  ℹ️  This {Deliverable} is a strong starting point,   │
│  but every environment is different. Test each step   │
│  in your actual {platform} workspace.                 │
│                                                       │
│  ▸ Would you like to refine this further?             │
│     [Refinement #N badge if applicable]               │
└──────────────────────────────────────────────────────┘

  ↓  (user clicks "Would you like to refine…")

┌──────────────────────────────────────────────────────┐
│  ℹ️  This {Deliverable} is a strong starting point…   │
│                                                       │
│  ─────────────────────────────────────────────────    │
│  REFINE YOUR {DELIVERABLE}           [×] [#N badge]  │
│  "Answer any of these to add context…"                │
│                                                       │
│  Q: Who is the primary audience for this output?      │
│  [ Answer field                                    ]  │
│                                                       │
│  Q: Are there constraints on length or format?        │
│  [ Answer field                                    ]  │
│                                                       │
│  Anything else to add?                                │
│  [ Open-ended textarea                             ]  │
│                                                       │
│  [ → Refine {Deliverable} ]                           │
└──────────────────────────────────────────────────────┘
```

**Specifications:**

- **Container**: `background: #F7FAFC`, `borderRadius: 14`, `border: 1px solid #E2E8F0`, `padding: 20px 24px`
- **Caveat text**: Always visible. ℹ️ icon + practitioner caveat text (`fontSize: 13`, `color: #718096`, `lineHeight: 1.6`)
- **Expand CTA**: "Would you like to refine this {Deliverable} further?" — text link styled as `fontWeight: 600`, `color: LEVEL_ACCENT_DARK` with `ChevronDown` icon. Shown only when collapsed.
- **Refinement counter badge**: Shown next to the CTA if `refinementCount > 0` — `fontSize: 11`, pill style with `LEVEL_ACCENT` background
- **Expanded section**: Separated from caveat by `borderTop: 1px solid #E2E8F0`. Contains:
  - Section header: "REFINE YOUR {DELIVERABLE}" uppercase label + close (×) button to collapse
  - Refinement questions: 3–5 context-seeking questions with single-line input fields
    - Question label: `fontSize: 13`, `fontWeight: 600`, `color: #2D3748`
    - Input: `fontSize: 13`, `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: 10px 14px`
  - Open-ended textarea: "Anything else to add?" (`minHeight: 60`)
  - Refine button: Primary ActionBtn, disabled until at least one input is provided
- **Animation**: Expanded section uses `ppSlideDown` animation (0.3s ease-out)

**State:** `const [refineExpanded, setRefineExpanded] = useState(false);` — reset to `false` in `handleStartOver` and step-back handlers.

**How it works:**

1. The AI generates `refinement_questions` as part of its output (3–5 questions)
2. The user answers any subset of questions and/or adds open-ended context
3. On "Refine", the frontend builds a `[REFINEMENT]` message containing the original task, answered questions, and additional context
4. The API treats this as a refinement pass and generates a significantly improved output
5. New refinement questions are generated that probe even deeper based on what's been answered
6. The refinement counter increments — there is no limit on refinement passes

**Implementation pattern:**

```typescript
const buildRefinementMessage = (): string => {
  const answeredQuestions = (result?.refinement_questions || [])
    .map((q, i) => {
      const answer = refinementAnswers[i]?.trim();
      return answer ? `Q: ${q}\nA: ${answer}` : null;
    })
    .filter(Boolean).join('\n\n');
  const parts = [
    `[REFINEMENT]\n\nOriginal task: ${userInput}`,
    answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
    additionalContext.trim() ? `\nAdditional context: ${additionalContext.trim()}` : '',
  ];
  return parts.filter(Boolean).join('\n');
};
```

**Rules:**
- Refinement questions must be task-specific, not generic (e.g., "Who is the primary audience for this status update?" not "Who is your audience?")
- The refine button must be disabled until the user provides at least one input
- Previous answers are cleared after each refinement pass (the AI generates new questions)
- The combined caveat + refinement card appears as the **last section** of the output area, above the bottom navigation row
- The refinement questions are **hidden by default** — the user must click the "Would you like to refine…" CTA to expand them
- The practitioner caveat is always visible (not collapsed) as the intro text of the card
- During refinement, the ProcessingProgress indicator shows refinement-specific step labels (see §9.5)

### 4.6 Example Chips

For input steps where the user needs to describe a task or scenario, provide **example chips** — pre-written examples that populate the input field on click. These reduce the blank-page problem and give users a concrete starting point.

**Specifications:**
- Chips row: `display: flex`, `flexWrap: wrap`, `gap: 8px`, below the textarea
- Each chip: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 20px`, `padding: 6px 14px`
- Text: `fontSize: 12`, `color: #4A5568`, `fontWeight: 500`
- Hover: `background: ${LEVEL_ACCENT}18`, `borderColor: ${LEVEL_ACCENT}`, `color: LEVEL_ACCENT_DARK`
- On click: populate the textarea with the chip text and trigger auto-resize
- Label above chips: "Try an example:" — `fontSize: 12`, `color: #A0AEC0`, `fontWeight: 500`

**Rules:**
- 4–6 chips per tool, covering diverse use cases
- Chip text should be complete enough to generate useful output on its own
- Chips must be specific to the tool's domain (not generic)

### 4.3 Staggered Block Animation

When output sections first appear, animate them in with a staggered delay:

```tsx
useEffect(() => {
  if (!result) return;
  setVisibleBlocks(0);
  const timers = [];
  for (let i = 0; i < totalSections; i++) {
    timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
  }
  return () => timers.forEach(clearTimeout);
}, [result]);
```

Each block: `opacity` and `translateY(8px)` transition over 0.3s.

### 4.7 Collapsed-by-Default Output Sections

On pages with multiple output sections (Agent Builder, App Designer, App Evaluator), output cards render **collapsed by default** after generation. This prevents a wall of expanded content and lets users scan results quickly.

**Rules:**
- Collapsed state: show section icon, title, and a one-line summary or score (if applicable). Hide the full body content.
- Click the header row or chevron to expand/collapse.
- The **primary deliverable** section (e.g., system prompt on L2, PRD project_overview on L4) auto-expands since it's the main artifact the user came for.
- Staggered reveal animation still applies — cards fade in one by one, but in their collapsed state.

**Implementation pattern:**
```tsx
const [expandedSections, setExpandedSections] = useState<Set<string>>(
  new Set(['primary_deliverable_key']) // only the main deliverable starts expanded
);

const toggleSection = (key: string) => {
  setExpandedSections(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
};
```

**Applies to:** Agent Builder (4 sections), App Designer (11 PRD sections), App Evaluator (4 sections). Prompt Playground and Workflow Canvas have different output structures — assess case by case.

### 4.8 Next Step Banner

After output generates, a **Next Step Banner** appears immediately above the output sections (below the top action row). This single, prominent card tells the user the most important next action and eliminates decision paralysis.

**Specifications:**
- Background: `${LEVEL_ACCENT}15`
- `borderLeft: 4px solid ${LEVEL_ACCENT_DARK}`
- `borderRadius: 10`, `padding: 14px 18px`
- Icon (Lucide) + bold headline (13px, 700) + one sentence body (13px, 400, `#4A5568`)

**Per-page content:**

| Page | Banner Text |
|------|-------------|
| L1 Prompt Playground | "Copy your prompt and test it in your AI tool of choice. Come back and refine it based on what you learn." |
| L2 Agent Builder | "Copy the Full System Prompt below and paste it into your AI platform. The sections below break down how it was built." |
| L3 Workflow Canvas | "Download your Build Guide and follow the steps in your chosen platform. Use the test checklist to verify each step." |
| L4 App Designer | "Copy the PRD and paste it into an AI coding tool (Cursor, Lovable, Bolt.new) to start building. The mockup above is your visual reference." |
| L5 App Evaluator | "Review your Design Score, then use the Architecture and Implementation Plan sections to plan your build. Start with the highest-priority components." |

### 4.9 CollapsibleOutputCard Component

A shared component for collapsible output section cards, supporting §4.7 above.

**Props:**
```tsx
interface CollapsibleOutputCardProps {
  sectionKey: string;
  icon: string | React.ReactNode;
  title: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  copyContent?: string;
  accentColor: string;      // LEVEL_ACCENT_DARK
  accentBg?: string;        // defaults to `${accentColor}08`
  index?: number;
  total?: number;
  visible?: boolean;
  children: React.ReactNode;
}
```

**Specs:**
- `borderLeft: 4px solid ${accentColor}`, `background: ${accentBg || accentColor + '08'}`
- `borderRadius: 10`, `padding: 16px 18px`
- Header row: icon + title (13px, 700) + summary when collapsed (13px, `#718096`) + chevron right-aligned
- Collapsed: header row only. Expanded: header + `borderTop: 1px solid #EDF2F7` + children.
- Transition: `ppSlideDown` animation on expand.
- Per-section copy button (top-right, appears on hover or always on mobile).

---

## 5. Tool-Specific Step Definitions

### 5.1 Prompt Playground (Level 1)

| Step | Title | Content |
|------|-------|---------|
| 1 | Describe your task | Auto-growing textarea with example chips for quick-fill. Collapses immediately when Generate is clicked. |
| 2 | Your optimised prompt | Strategy-aware output: AI-generated prompt with numbered strategy badges, prompt highlighting, combined caveat + refinement card (collapsed by default), OutputActionsPanel, and bottom navigation. |

**Progressive disclosure:**
- **Step 1** expanded on load. Step 2 visible but locked (`locked={!result && !isLoading}`, `lockedMessage="Complete Step 1 to generate your optimised prompt"`).
- **Step 1 collapses immediately on Generate click** — `step1Done = result !== null || isLoading` ensures the input card closes and Step 2 shows the `ProcessingProgress` indicator without delay.
- **Step 2** unlocks when loading starts. It is never collapsed (`collapsed={false}`) since it is the final output step.

**Input (Step 1):**
- Example chips above the textarea (`PLAYGROUND_EXAMPLE_CHIPS`) — clicking one populates the textarea with that text
- Auto-growing textarea (`minHeight: 120`, `maxHeight: 300`, `resize: none`) with character-level auto-height
- Character count displayed below-right
- "Build My Prompt" button with validation (red border flash on empty submit)
- Error messages displayed in a red-tinted card below the button

**Educational default (Step 2 — exception to §1.4):** The Prompt Playground retains educational strategy cards before generation because the strategies themselves are core learning content. Shows all 8 prompting strategies in a 2-column grid using `STRATEGY_DEFINITIONS`. Each card uses `LEVEL_ACCENT` (not per-strategy colors) for left border and background tint, with: icon + name (uppercase), definition text, and a "Best for:" block with `whenToUse` content. Summary footer below lists all 8 strategies with icons.

**Generated output (Step 2) — structure from top to bottom:**

1. **Next Step Banner** (§4.8): `<NextStepBanner>` component — "Copy your prompt and test it in your AI tool of choice. Come back and refine it based on what you learn."
2. **Top action row**: Left: Cards/Markdown toggle + InfoTooltip. Right: Copy Optimised Prompt (primary), Download .md (default), Save to Prompt Library (primary).
3. **Prompt card**: White card displaying the full generated prompt with **numbered badge annotations** — each strategy's excerpt is marked with a `BadgeCircle` (circled digit) inline at the start of the excerpt, plus a subtle highlight (`LEVEL_ACCENT` tint). Clicking a strategy card intensifies the highlight for that excerpt.
4. **Strategy cards** (2-column grid): One card per strategy used (2–4 cards). All cards use `LEVEL_ACCENT` as their accent color (left border, background tint) — not per-strategy colors. Each card shows:
   - Header: strategy icon + `BadgeCircle` number (matching the prompt annotation) + name
   - Collapsed summary: 2-line truncation of `how_applied`
   - Expandable via chevron toggle. Expanding a card also activates its highlight in the prompt above.
   - Expanded detail sections: "How it was applied" (tinted block with `LEVEL_ACCENT`), "Why this strategy was chosen", "What this strategy does" (general definition)
5. **OutputActionsPanel** (§4.2 Zone 2): Download Markdown, Download Word, Save to Library
6. **Combined caveat + refinement card** (§4.5): Collapsed by default. Warm-toned card (`#FFFBF0` background, `#F7E8A4` border). Practitioner caveat always visible. "Sharpen this prompt — add more context" CTA expands the refinement questions section.
7. **Bottom navigation row**: Start Over (default)

**Strategy ↔ prompt linking (BadgeCircle system):**
- Each strategy is assigned a number (1-based index from `strategies_used`)
- `BadgeCircle` components (18px circles, `LEVEL_ACCENT_DARK` background, white number) appear both in the prompt text (at the start of each excerpt) and in the strategy card header
- This visual link helps the user immediately see which part of the prompt each strategy influenced
- All excerpts are subtly highlighted by default (`LEVEL_ACCENT` at 18% opacity, dashed underline). Clicking a strategy card intensifies its highlight (`40%` opacity, solid underline).

**Fuzzy excerpt matching (`findExcerptRange`):**
The AI sometimes returns excerpts with slightly different whitespace or casing than the actual prompt. The `findExcerptRange()` function uses a 4-level fallback:
1. Exact substring match
2. Normalised whitespace match (collapse runs of whitespace in both strings, then map back to original positions)
3. Case-insensitive match
4. Prefix match (first ~60 characters) — extends to end of paragraph

This ensures strategy highlighting works reliably even when the AI's excerpt isn't character-perfect.

**Level accent:** `#A8F0E0` (light) / `#1A6B5F` (dark)

### 5.2 Agent Builder (Level 2)

| Step | Title | Content |
|------|-------|---------|
| 1 | Describe your agent | Two input fields: task description + input data description. Example agents (good + not-recommended) for quick-fill. Draft persistence via localStorage. |
| 2 | Review your agent design | 4-section output displayed for review, with a cohesive system prompt as the deliverable. Includes "Approve Prompt" action to unlock Step 3. |
| 3 | Deploy your agent | Platform selector (6 options) + AI-generated build plan with platform-specific setup instructions and pro tips. |

**Progressive disclosure flow:**
- **Step 1** expanded on load. Steps 2 and 3 visible but locked.
- **Step 2** unlocks when "Design My Agent" returns results. Step 1 collapses to "Done ✓".
- **Step 3** unlocks when user clicks "Approve Prompt" in Step 2. Step 2 collapses to "Done ✓".
- "Back to Step 1" / "Back to Step 2" buttons re-expand the target step and re-lock downstream steps.
- `step2Approved` state tracks whether the user has explicitly approved the prompt.

**Step 2 — View toggle with inline tabs:**
The system prompt view area has a unified toggle row:
- **Left side:** Cards / Markdown toggle (same as §4.1)
- **Right side:** Output Format and Accountability buttons — clicking either switches the content card below to show that view instead of the prompt. Clicking again returns to Cards view.
- This replaces the old separate collapsible sections and gives more vertical space to each view.

**Displayed views (Step 2):**
1. **Cards view (default)** — Color-coded system prompt with Prompt Blueprint section labels (Role, Context, Task, Output Format, Steps, Quality Checks)
2. **Markdown view** — Dark-background raw prompt text
3. **Output Format view** — Side-by-side human-readable + JSON template
4. **Accountability view** — Severity-badged accountability features list
5. **Readiness Score** — Always visible above the toggle row as a compact card. **Informational only — not included in the deliverable.**

**Cohesive deliverable:** "Full System Prompt" — combines the system prompt, JSON template, and selected accountability instructions into a single ready-to-use prompt. Readiness score is excluded.

**Step 3 — Deploy:**
- 2×3 grid of platform cards (ChatGPT Custom GPTs, Claude Skills, Microsoft Copilot, Google Gemini Gems, Open Source / API, Not sure yet)
- "Generate Build Plan" button triggers AI-generated platform-specific setup guide
- Build plan displayed as numbered steps + Pro Tips card + limitations note
- Smart, advanced guidance: data source connections, tool composition, team deployment, power-user tips

**Level accent:** `#F7E8A4` (light) / `#8A6A00` (dark)

### 5.3 Workflow Canvas (Level 3)

| Step | Title | Content |
|------|-------|---------|
| 1 | Define your workflow | Text description of the workflow + example workflows for quick-fill |
| 2 | Build your canvas | Visual node canvas with node library panel (Input / Processing / Output tabs). Drag-and-drop node placement |
| 3 | Export your workflow | Workflow summary with connection map, Markdown export, and implementation notes |

**Educational default (Step 3):** Show node type categories with example nodes and their purposes.

**Build Guide output (Step 4):** The Workflow Canvas produces a Build Guide as its final deliverable. For the complete specification of Step 4's output view — including the loading state, Cards/Markdown toggle, ExportSummaryCard, OutputActionsPanel, refinement flow, and download behavior — refer to **[BUILD-GUIDE-OUTPUT-STANDARD.md](BUILD-GUIDE-OUTPUT-STANDARD.md)**.

### 5.4 Dashboard Designer (Level 4)

| Step | Title | Content |
|------|-------|---------|
| 1 | Complete your brief | 9-question structured brief (purpose, audience, metrics, etc.) with image upload support |
| 2 | Review your mockup | Generated dashboard mockup with approve/reject/refine workflow |
| 3 | Your dashboard PRD | 11-section PRD output with per-section copy and full export |

**Educational default (Step 3):** Show all 11 PRD sections with descriptions of what each covers and why it's needed.

### 5.5 App Builder (Level 5)

| Step | Title | Content |
|------|-------|---------|
| 1 | Describe your application | 3 input fields: app description, problem/users, data/content. Example apps for quick-fill |
| 2 | Architecture & tool mapping | Architecture design + tool mapping to Level 1-4 toolkit + component breakdown |
| 3 | Your product specification | Full PRD with 11 sections, classification system (Essential/Recommended/Optional), export options |

**Educational default (Step 3):** Show all PRD sections with generic explanations of what each covers.

### 5.6 Prompt Library (Level 1)

This tool follows a **different pattern** — it is a library/collection view, not a guided generation flow. It should show saved prompts with search, filter, and management capabilities. The "How it works" strip still applies but with library-specific steps (Browse → Select → Use/Edit).

---

## 6. Shared Components

The following components should be extracted and shared across all tool pages. They currently live in `AppPromptPlayground.tsx` and should be moved to a shared location (e.g., `components/app/toolkit/shared/`).

### 6.1 Extractable Components

| Component | Purpose |
|-----------|---------|
| `ToolOverview` | "How it works" overview strip with steps + outcome |
| `StepCard` | Full-width step container with badge, title, collapse |
| `StepBadge` | Numbered circle indicator (done/not done) |
| `StepConnector` | Animated vertical connector between steps |
| `StepPlaceholder` | Dashed placeholder for locked steps |
| `ProcessingProgress` | Step-by-step loading indicator for API calls (see §9.5) |
| `ActionBtn` | Standardised button (primary/accent/default variants) |
| `ToggleBtn` | Cards/Markdown toggle button |
| `InfoTooltip` | Hover tooltip with info icon |

### 6.2 Component Props (for reference)

```typescript
// ToolOverview
interface ToolOverviewProps {
  steps: { number: number; label: string; detail: string; done: boolean }[];
  outcome: string;
}

// StepCard
interface StepCardProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  done: boolean;
  collapsed: boolean;
  locked?: boolean;          // Greyed-out state for steps whose prerequisite isn't met
  lockedMessage?: string;    // e.g., "Complete Step 1 to generate your agent design"
  children: React.ReactNode;
}

// StepPlaceholder (DEPRECATED — use StepCard locked prop instead, see §3.6)
interface StepPlaceholderProps {
  icon: React.ReactNode;
  message: string;
  detail: string;
}

// ProcessingProgress
interface ProcessingProgressProps {
  steps: string[];        // Tool-specific step labels
  currentStep: number;    // 0 = not started, 1-N = step in progress/complete
  header: string;         // e.g., "Building your prompt…"
  subtext: string;        // e.g., "This usually takes 15–20 seconds"
}

// ActionBtn
interface ActionBtnProps {
  icon?: React.ReactNode;      // Icon before label (back buttons, utility buttons)
  label: string;
  onClick: () => void;
  primary?: boolean;            // teal (#38B2AC) background
  disabled?: boolean;
  iconAfter?: React.ReactNode;  // Icon after label (forward-action buttons)
}
// Note: `accent` variant (purple) is deprecated — use `primary` (teal) for all CTAs
```

---

## 7. Typography & Spacing Reference

### 7.1 Font

All tool pages use `'DM Sans', sans-serif` as the base font. Monospace code blocks use `'JetBrains Mono', 'Fira Code', monospace`.

### 7.1a Copyable Text Blocks in Build Guide Steps (Mandatory)

**All** build guide / setup guide step instructions across every tool must render text using a rich markdown renderer that converts fenced code blocks (` ``` `), unfenced JSON blocks, and code-like expressions into **dark copyable blocks with a Copy button** — never as plain text. This applies to every tool that has a build guide output (Agent Builder Step 4, Dashboard Designer Step 4, Workflow Canvas Step 4, etc.).

**Required rendering rules for step instruction text:**

| Pattern | Rendered as |
|---------|-------------|
| ` ``` ` fenced code blocks | `CodeBlockWithCopy` — dark block (`#1A202C`) with Copy button |
| `{ ... }` unfenced JSON | `CodeBlockWithCopy` (auto-detected by brace matching) |
| `**bold**` | `<strong>` with `fontWeight: 700`, `color: #1A202C` |
| `*italic*` | `<em>` |
| `` `inline code` `` | Inline code span with `background: #EDF2F7`, monospace font, level accent color |
| `[text](url)` | Clickable link, `color: #2B6CB0`, `fontWeight: 600` |
| Regular text | Paragraph, `fontSize: 13`, `color: #4A5568`, `lineHeight: 1.7` |

**CodeBlockWithCopy spec** (same across all tools):
- Container: `position: relative`, `margin: 8px 0`
- Code block: `background: #1A202C`, `color: #E2E8F0`, `padding: 14px 18px`, `borderRadius: 8`, `fontSize: 12`, monospace font
- Copy button: `position: absolute`, `top: 8`, `right: 8`, idle `background: rgba(255,255,255,0.1)`, success `background: #38B2AC` with "Copied" label for 2s

**Never** render step instructions as plain `<p>` text with `whiteSpace: pre-wrap`. Always use the rich renderer so that system prompts, JSON schemas, configuration snippets, and code examples are presented as copyable blocks the user can directly paste into their platform.

### 7.2 Type Scale

| Element | Size | Weight | Color | Letter Spacing |
|---------|------|--------|-------|----------------|
| Page title (h1) | 28px | 800 | `#1A202C` | -0.4px |
| Step card title | 16px | 700 | `#1A202C` | — |
| Step card subtitle | 13px | 400 | `#718096` | — |
| Page description | 14px | 400 | `#718096` | — |
| Section labels (uppercase) | 11-12px | 700 | varies | 0.04-0.06em |
| Body text | 13px | 400 | `#2D3748` or `#4A5568` | — |
| Muted/helper text | 12px | 500 | `#718096` or `#A0AEC0` | — |
| Button text | 12-14px | 600-700 | varies | — |

### 7.3 Spacing

| Use | Value |
|-----|-------|
| Page padding | `28px 36px` |
| Card internal padding | `24px 28px` |
| Collapsed card padding | `16px 24px` |
| Gap between step cards | Connector height (~50px) |
| Grid gap (2-col) | `12px` |
| Section margins | `16-20px` |
| Smallest gap | `4px` |

### 7.4 Border Radius

| Element | Radius |
|---------|--------|
| Step card | `16px` |
| Mode card / inner card | `14px` |
| Input fields | `12px` |
| Section blocks | `10px` |
| Buttons (pill) | `24px` |
| Toggle group | `10px` |
| Badges | `20px` |

---

## 8. State Management Patterns

### 8.1 Required State Variables

Every tool page should track:

```typescript
const [result, setResult] = useState<ResultType | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [copied, setCopied] = useState(false);
const [savedToLibrary, setSavedToLibrary] = useState(false);
const [toastMessage, setToastMessage] = useState<string | null>(null);
```

### 8.2 Step Completion Tracking

Derive step completion from state, don't duplicate it:

```typescript
const step1Done = /* first choice made */ activeMode !== null;
const step2Done = /* output generated AND approved */ result !== null && step2Approved;
const step3Done = /* deployment guide generated */ setupGuide !== null;
```

**Explicit approval gates:** For tools with 3+ steps, intermediate steps may require an explicit user action (e.g., "Approve Prompt") before downstream steps unlock. Track this with a separate boolean state:

```typescript
const [step2Approved, setStep2Approved] = useState(false);
// Reset in handleReset, handleGoBackToStep1, handleGoBackToStep2
```

This prevents users from accidentally advancing past an unreviewed output.

### 8.3 Database Integration

Every tool should call `upsertToolUsed(user.id, toolLevel)` when the user generates output for the first time in a session. Use the tool's level number as the second argument.

### 8.4 Draft Persistence

For tools with significant input (textarea, multi-field forms), save drafts to `localStorage` with the key pattern `oxygy_{toolId}_draft`. Restore on mount and clear after restoration.

---

## 8b. Step Auto-Scroll (mandatory)

Every toolkit tool page must auto-scroll to the next step card whenever a step is completed and the next step becomes visible. This is non-negotiable — the user must never have to manually scroll down to discover that a new step has appeared.

**Implementation pattern:**
```tsx
const step2Ref = useRef<HTMLDivElement>(null);
const step3Ref = useRef<HTMLDivElement>(null); // for 3-step tools only

// Attach to the outermost div of each step card:
<div ref={step2Ref}>
  <StepCard stepNumber={2} ...>...</StepCard>
</div>

// Call after each step-advance state update:
setTimeout(() => {
  step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 120);
```

The 120ms delay allows React to complete its render cycle before scrolling, ensuring the full step card is present in the DOM when `scrollIntoView` fires.

This rule applies to all current and future toolkit tool pages. When building a new tool page, add step refs and scroll calls as part of the initial build — not as a retrofit.

---

## 9. CSS Animations

Every tool page should include these base animations in a `<style>` tag:

```css
@keyframes ppSpin { to { transform: rotate(360deg); } }
@keyframes ppPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
@keyframes ppFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ppConnectorFlow {
  0% { background-position: 0 0; }
  100% { background-position: 0 20px; }
}
```

```css
@keyframes ppSlideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}
```

| Animation | Use |
|-----------|-----|
| `ppSpin` | Loading spinners in buttons, ProcessingProgress active step indicator |
| `ppPulse` | Skeleton loading blocks (legacy — prefer ProcessingProgress for API calls) |
| `ppFadeIn` | Step card entrance, toast entrance, educational default cards |
| `ppConnectorFlow` | Dashed connector line flowing downward |
| `ppSlideDown` | Expanding content sections (strategy card details, refinement card) |

### 9.5 Processing Progress Indicator

**Every API call that takes more than ~1 second must show an interactive progress indicator** — not a generic spinner or pulsing skeleton. The progress indicator communicates to the user that real, multi-step work is happening behind the scenes, keeps them engaged during the wait, and sets expectations for how long it will take.

**Structure:**

```
┌──────────────────────────────────────────────────────┐
│  [Tool-specific header, e.g. "Building your prompt"] │
│                                                      │
│  ● Analysing your task…                     ✓        │
│  ● Selecting prompting strategies…          ✓        │
│  ◉ Crafting your prompt…                    ⟳        │ ← active step (spinning)
│  ○ Applying quality checks…                          │
│  ○ Preparing strategy breakdown…                     │
│  ○ Generating refinement questions…                  │
│  ○ Finalising output…                                │
│                                                      │
│  ━━━━━━━━━━━━━━━━━━━░░░░░░░░░  4 of 7               │ ← progress bar
└──────────────────────────────────────────────────────┘
```

**Specifications:**

- **Container**: Replaces the skeleton/placeholder content inside the active step card. White background, `borderRadius: 14`, `border: 1px solid #E2E8F0`, `padding: 28px 32px`.
- **Header**: `fontSize: 15`, `fontWeight: 700`, `color: #1A202C`. Tool-specific — e.g., "Building your prompt…", "Designing your agent…", "Generating your workflow…". Changes for refinement passes (e.g., "Refining your prompt…").
- **Subtext**: `fontSize: 12`, `color: #A0AEC0`. Brief context — e.g., "This usually takes 15–20 seconds".
- **Step list**: 5–8 contextual steps, each with:
  - **Step indicator**: 18px circle.
    - Pending: `background: #F7FAFC`, `border: 2px solid #E2E8F0`
    - Active: `border: 2px solid ${LEVEL_ACCENT}`, spinning inner arc animation
    - Complete: `background: ${LEVEL_ACCENT}`, checkmark icon in `LEVEL_ACCENT_DARK`
  - **Step label**: `fontSize: 13`, `color: #2D3748` (active/complete) or `#A0AEC0` (pending). `fontWeight: 600` for active step, `400` for others.
  - Vertical spacing: `gap: 10px` between steps
- **Progress bar**: Full width, `height: 4px`, `borderRadius: 2`, `background: #EDF2F7`. Fill uses `LEVEL_ACCENT`, width = `(completedSteps / totalSteps) * 100%`, `transition: width 0.3s ease`.
- **Step counter**: Right-aligned below bar, `fontSize: 11`, `color: #A0AEC0`, "N of M".

**Timing pattern:**

Steps advance on a timed schedule that approximates the expected API duration. The schedule should be front-loaded (early steps advance quickly to give immediate feedback) and back-loaded (later steps take longer to avoid finishing before the API responds).

```typescript
// Example: 7 steps over ~24 seconds (last step is open-ended buffer)
const STEP_DELAYS = [800, 1500, 3000, 3500, 4000, 4500, -1];
// Cumulative: 0.8s, 2.3s, 5.3s, 8.8s, 12.8s, 17.3s, ∞ (waits for API)
// -1 means "never auto-advance" — the final step stays spinning until isLoading flips
```

The final step ("Finalising…") must remain in the **active/spinning state** until the API actually returns. It should never show a checkmark until `isLoading` flips to `false`. Use `-1` as the delay for the last step to indicate it should not auto-advance.

If the API returns before all timed steps complete, immediately jump all remaining steps to ✓ simultaneously, hold 400ms, then reveal output. If the API takes longer than expected, the last step stays active with the spinner — it never goes backwards.

**Step content is tool-specific.** Each tool defines its own step labels that describe what the AI is actually doing for that tool. Examples:

| Tool | Steps |
|------|-------|
| Prompt Playground (initial) | Analysing your task → Selecting strategies → Crafting prompt → Applying quality checks → Preparing strategy breakdown → Generating refinement questions → Finalising output |
| Prompt Playground (refine) | Processing context → Re-evaluating strategies → Weaving in specifics → Refining structure → Quality checks → Deeper questions → Finalising |
| Agent Builder | Evaluating readiness → Designing output format → Writing system prompt → Adding accountability → Scoring criteria → Finalising design |
| Workflow Canvas | Parsing workflow description → Mapping node types → Defining connections → Adding decision points → Generating export → Finalising |
| Dashboard Designer | Analysing brief → Generating layout → Designing widgets → Mapping data sources → Defining interactions → Building specification |
| App Builder | Analysing requirements → Mapping architecture → Designing features → Planning integrations → Generating specification → Finalising PRD |

**Implementation pattern:**

```typescript
const INITIAL_LOADING_STEPS = [
  'Analysing your task…',
  'Selecting prompting strategies…',
  'Crafting your prompt…',
  'Applying quality checks…',
  'Preparing strategy breakdown…',
  'Generating refinement questions…',
  'Finalising output…',
];
const REFINE_LOADING_STEPS = [
  'Processing your additional context…',
  'Re-evaluating strategies…',
  'Weaving in new specifics…',
  'Refining prompt structure…',
  'Running quality checks…',
  'Generating deeper questions…',
  'Finalising refined output…',
];
// Front-loaded timing: early steps fast, later steps slower
// Last step uses -1 = open-ended buffer (never auto-advances)
const STEP_DELAYS = [800, 1500, 3000, 3500, 4000, 4500, -1];

// In component:
const [loadingStep, setLoadingStep] = useState(0);
const [isRefineLoading, setIsRefineLoading] = useState(false);

useEffect(() => {
  if (!isLoading) {
    // When loading finishes, jump to last step briefly then reset
    if (loadingStep > 0) {
      const steps = isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS;
      setLoadingStep(steps.length);
      const timer = setTimeout(() => setLoadingStep(0), 400);
      return () => clearTimeout(timer);
    }
    return;
  }
  // Start step progression
  setLoadingStep(0);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cumulative = 0;
  STEP_DELAYS.forEach((delay, i) => {
    if (delay < 0) return; // -1 = open-ended buffer, don't auto-advance
    cumulative += delay;
    timers.push(setTimeout(() => setLoadingStep(i + 1), cumulative));
  });
  return () => timers.forEach(clearTimeout);
}, [isLoading]);
```

**Completion behavior:** When `isLoading` transitions from `true` to `false` (API returns), the useEffect jumps `loadingStep` to `steps.length` (all steps complete with checkmarks), holds for 400ms so the user sees the completed state, then resets to 0 to reveal the output. This creates a satisfying "all done" moment before the results appear.

**Refinement-aware steps:** Tools with iterative refinement (see §4.5) should define separate step arrays for initial generation vs refinement passes. The `isRefineLoading` flag controls which set of labels is displayed. Set `isRefineLoading = false` in `handleSubmit` and `isRefineLoading = true` in `handleRefine` before calling the API.

**Rules:**
- Never show a generic spinner or pulsing skeleton for API calls — always use the progress indicator
- Steps must be tool-specific and describe plausible processing stages
- The progress indicator lives inside the output step card (not a modal or overlay)
- If the API errors, immediately show the error state — do not leave the progress indicator spinning
- The last step label should always be "Finalising…" or equivalent — it acts as a buffer for variable API times

---

## 10. Responsive Considerations

- Step cards always span full width (no side-by-side steps)
- 2-column output grids should collapse to 1 column on narrow viewports
- Mode selection cards (side-by-side) should stack vertically below ~640px
- The "How it works" strip should stack steps vertically on mobile
- Minimum content width assumption: `600px` (the sidebar is ~60px)

---

## 11. File Structure Convention

```
components/app/toolkit/
├── shared/
│   ├── ToolOverview.tsx        # "How it works" strip
│   ├── StepCard.tsx            # Step card + badge + connector
│   ├── StepPlaceholder.tsx     # Placeholder for locked steps
│   ├── ActionBtn.tsx           # Button variants
│   └── ToggleBtn.tsx           # Cards/Markdown toggle
├── AppPromptPlayground.tsx     # Level 1 - Prompt Playground
├── AppAgentBuilder.tsx         # Level 2 - Agent Builder
├── AppWorkflowCanvas.tsx       # Level 3 - Workflow Canvas
├── AppDashboardDesigner.tsx    # Level 4 - Dashboard Designer
├── AppAppBuilder.tsx           # Level 5 - App Builder
├── ToolCard.tsx                # Tool card (for toolkit grid)
├── ToolDetailPanel.tsx         # Slide-in detail panel
└── LevelGroup.tsx              # Level section wrapper
```

**Naming convention:** `App{ToolName}.tsx` for tool pages within the app shell. These are lazy-loaded via `React.lazy()` in `App.tsx`.

---

## 12. Checklist for Building a New Tool Page

**Structure & Layout:**
- [ ] Page title: plain text, 28px, weight 800, no emoji
- [ ] Description: 2 lines max, answers problem/function/outcome
- [ ] `ToolOverview` strip with 3-4 steps + outcome bar
- [ ] All step cards visible on first load (locked steps use `locked` prop, not hidden)
- [ ] Only one step expanded at a time — downstream steps show locked state with "Complete Step N" message
- [ ] Steps unlock progressively as prerequisites are met (e.g., API returns results, user clicks "Approve")
- [ ] Animated `StepConnector` between every step card

**Theming & Accent Colors:**
- [ ] `LEVEL_ACCENT` and `LEVEL_ACCENT_DARK` constants defined at top of file
- [ ] Level accent color used for: connectors, step badges (done), overview badges (done), "Done ✓" labels, step card done borders
- [ ] No hardcoded teal (`#38B2AC`) for completion indicators — always use level accent variables
- [ ] Output section cards use `LEVEL_ACCENT_DARK` for left border, background tint, and interactive states — no per-section custom colors

**Design Review Step (if applicable — see [DESIGN-REVIEW-OUTPUT-STANDARD.md](DESIGN-REVIEW-OUTPUT-STANDARD.md)):**
- [ ] Quality score banner with conic-gradient ring, verdict, rationale, and expandable criteria breakdown
- [ ] Score uses dynamic colors (teal ≥80, amber ≥50, coral <50)
- [ ] Primary output section with Cards/Markdown toggle + optional supplementary tabs
- [ ] Supplementary tabs use `LEVEL_ACCENT` colors when active
- [ ] Caveat + refinement card with AI-generated questions (collapsed by default)
- [ ] Bottom navigation: Back to Step 1, Approve [X] (primary, teal), Start Over
- [ ] Step collapses only when user explicitly clicks "Approve", not on result arrival

**Output & Deliverable:**
- [ ] Cohesive deliverable defined — a `build{Deliverable}` function that combines only actionable sections
- [ ] Informational sections displayed but excluded from copy/download/save
- [ ] Primary copy button named after the specific deliverable (e.g., "Copy Full System Prompt"), never "Copy All"
- [ ] Cards/Markdown toggle for structured output (with info tooltip)
- [ ] Markdown view shows the cohesive deliverable, not a dump of all sections

**Actions & Persistence:**
- [ ] Save to Prompt Library in OutputActionsPanel section
- [ ] Save to Library button uses accent variant (`#5A67D8`)
- [ ] Download (.md) exports the cohesive deliverable
- [ ] Start Over button at bottom of output
- [ ] `upsertToolUsed()` called on first generation
- [ ] Draft persistence via localStorage for significant input fields
- [ ] Toast notifications for all user actions

**Loading & Progress:**
- [ ] `ProcessingProgress` indicator for all API calls (not generic spinners or skeletons) — see §9.5
- [ ] Tool-specific step labels for both initial generation and refinement passes
- [ ] Front-loaded timing pattern (`STEP_DELAYS`) that matches expected API duration
- [ ] Completion jump behavior (all steps → checkmarks → 400ms hold → reveal output)

**Iterative Refinement (if applicable):**
- [ ] AI generates `refinement_questions` (3–5 task-specific questions) as part of output
- [ ] Combined caveat + refinement card as the **last section** of the output area (see §4.5)
- [ ] Refinement questions **collapsed by default** — user clicks CTA to expand
- [ ] Practitioner caveat always visible as intro text of the card
- [ ] Refine button disabled until at least one input is provided
- [ ] Refinement counter badge displayed next to expand CTA
- [ ] `[REFINEMENT]` message format sent to API with original task + answers + additional context

**Polish:**
- [ ] Staggered block reveal animation for output sections
- [ ] Error state displayed within the relevant step card
- [ ] `DM Sans` font throughout, inline styles (no CSS modules)
- [ ] Example chips for input steps (4–6 domain-specific examples)

---

## 13. Anti-Patterns (What NOT to Do)

**Layout & Structure:**
- **No marketing language** — no "Did you know?", no promotional banners
- **No back-to-home navigation** — the app shell handles navigation
- **No level/course badges** — tool pages are workspaces, not course content
- **No two-column step layouts** — steps are always full-width, one per row
- **No hidden steps** — all steps are always visible (locked steps use `locked` prop, not `display: none`)
- **No multiple expanded steps** — only one step card is expanded at a time; downstream steps show locked state, completed steps collapse to "Done ✓"
- **No educational preview cards in locked steps** — locked steps show a compact greyed-out card with "Complete Step N" message, not a grid of educational content. The old `StepPlaceholder` and educational default patterns are deprecated (see §1.4, §3.6, §3.7).
- **No manual resize textareas** — use auto-growing textareas (`resize: none`, auto-height on change)
- **No emoji in titles** — first thing visible is the tool name in plain text

**Theming:**
- **No hardcoded teal for completion indicators** — step badges, overview badges, done labels, and card borders must use `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK`, not `#38B2AC`
- **No hardcoded colors anywhere** — use level accent variables for all theme-dependent elements
- **No per-section custom colors for output cards** — all output section cards (educational defaults and generated output) must use `LEVEL_ACCENT_DARK` as their accent color (left border, background tint, hover states). Using different colors per section (e.g., teal for section 1, indigo for section 2, red for section 3) creates visual noise and breaks the level identity. The only exception is the Prompt Playground strategy cards, where per-strategy colors are part of the educational framework being taught.

**Output & Actions:**
- **No generic "Copy All" button** — the copy button must name the specific cohesive deliverable (e.g., "Copy Full System Prompt", "Copy Full Blueprint")
- **No dumping all sections into export** — informational sections (scores, assessments) are for display only and must NOT be included in copy/download/save. Only actionable sections go into the cohesive deliverable.
- **No Save button missing from Output Actions Panel** — Save to Prompt Library must appear in the OutputActionsPanel section (between output content and refinement)
- **No exporting raw API response** — always compose a polished, cohesive deliverable via a dedicated `build{Deliverable}` function

**Loading & Progress:**
- **No generic spinners or pulsing skeletons for API calls** — always use the `ProcessingProgress` indicator with tool-specific step labels (see §9.5)
- **No progress indicators that finish before the API responds** — use front-loaded timing with a buffer step ("Finalising…") at the end
- **No modals or overlays for loading** — the progress indicator lives inside the output step card

**Refinement:**
- **No one-shot-only tools** — if a tool generates AI output, it should support iterative refinement with context-seeking questions
- **No generic refinement questions** — questions must be specific to the user's task (e.g., "Who is the primary audience for this status update?" not "Who is your audience?")
- **No refinement questions visible by default** — the refinement section must be collapsed, expanded only when the user clicks the CTA
- **No separate practitioner caveat and refinement cards** — these must be combined into a single card (caveat as intro text, refinement questions as expandable section)

**AI Content — Model & Tool Agnostic (absolute rule):**
- **No specific AI provider names** in generated content — never say "OpenAI", "Anthropic", "Claude", "GPT", "Gemini" in user-facing output. Use "AI agent", "LLM", "your chosen AI model", "AI model approved by your organisation".
- **No specific API key references** — say "your LLM API key" or "the API key approved by your team", not "OpenAI API key" or "Anthropic API key".
- **No specific model names** — say "select the AI model approved by your organisation", not "set the model to claude-3-sonnet" or "use GPT-4".
- **No specific provider consoles** — say "your LLM provider's console → API Keys", not "Anthropic Console → API Keys".
- **Platform node names are acceptable** — if a platform's UI calls a node "OpenAI Chat Model" (e.g., in n8n), you may reference that UI label, but always note the user can substitute their preferred provider.
- **AI Agent nodes must document all three prompt components** — System Prompt, User Prompt, and Structured Output Parser as separate subsections (see system prompt rules).

**Code:**
- **No duplicate state** — derive step completion from existing state
- **No Tailwind in tool pages** — inline styles only (exception: BuildWizard uses Tailwind as it's a pre-existing component)
