# Toolkit Page Design Standard

> This document defines the exact structure, design principles, and implementation patterns for every tool page within the My Toolkit section of the OXYGY AI Upskilling Platform. Use this as the single source of truth when building or refactoring any tool page under `/app/toolkit/*`.

---

## 1. Core Design Principles

### 1.1 User-First, Not Marketing
Every tool page is a **practical workspace**, not a sales page. There should be no promotional language, no "Did you know?" sections, no curved hero banners, and no navigation back to marketing content. The user is already here — help them get the job done.

### 1.2 Sequential Guided Flow
Every tool page follows a **step-by-step card progression**. Each step occupies the full width of the content area and guides the user through a clear sequence: configure → input → output. Users should never feel lost about what to do next.

### 1.3 Always-Visible Steps
All step cards are **always rendered on the page**, even before the user reaches them. Incomplete steps show contextual placeholder content that explains what will appear once the prerequisite steps are completed. This gives users a complete overview of the process from the moment they land on the page and creates an incentive to engage.

### 1.4 Educational Defaults
For output steps that will display structured results (e.g., the 6-part Prompt Blueprint, agent configuration sections, workflow components), show the **educational/generic version** of those sections by default. Each section should explain what it is, why it matters, and include an example — so the user learns the framework before they even start. Once the user generates output, the educational content is replaced with their personalised results in the same layout.

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
│  [Active content OR collapsed summary]              │
├─── Animated Connector ──────────────────────────────┤
│  Step 2 Card (full width)                           │
│  [Active content OR placeholder]                    │
├─── Animated Connector ──────────────────────────────┤
│  Step 3 Card (full width)                           │
│  [Active content OR educational default]            │
├─── Animated Connector (if Step 4 exists) ───────────┤
│  Step 4 Card (optional, full width)                 │
│  [Active content OR placeholder]                    │
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
<StepCard
  stepNumber={1}
  title="Step title"
  subtitle="Brief instruction for this step"
  done={stepDone}
  collapsed={stepDone && nextStepDone}
>
  {/* Step content */}
</StepCard>
```

**Specifications:**
- `background: #FFFFFF`, `borderRadius: 16`
- Border: `1px solid #E2E8F0` (default) or `1px solid ${LEVEL_ACCENT}88` (when done)
- Padding: `24px 28px` (expanded) or `16px 24px` (collapsed)
- Header row: StepBadge (32px circle) + title (16px, weight 700) + subtitle (13px, `#718096`)
- When `collapsed`: shows only header row with "Done ✓" indicator on the right
- When expanded: header + `marginBottom: 20` + children content

**Step Badge:**
- 32px circle, `fontWeight: 800`, `fontSize: 13`
- Incomplete: `background: #F7FAFC`, `border: 2px solid #E2E8F0`, `color: #718096`
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

### 3.6 Step Placeholder

Shown inside a step card when its prerequisite step hasn't been completed yet.

```tsx
<StepPlaceholder
  icon={<ArrowRight size={16} color="#A0AEC0" />}
  message="Complete the step above to unlock this"
  detail="Longer description of what will appear here once the prerequisite is met."
/>
```

**Specifications:**
- `background: #F7FAFC`, `borderRadius: 12`, `border: 1px dashed #E2E8F0`
- `padding: 24px 28px`, `textAlign: center`
- Icon in a 36px circle (`background: #EDF2F7`)
- Message: `fontSize: 14`, `fontWeight: 700`, `color: #4A5568`
- Detail: `fontSize: 13`, `color: #A0AEC0`, `maxWidth: 480px`, centred

### 3.7 Educational Default (for Output Steps)

When the output step has structured sections (e.g., Blueprint sections, agent config sections), show them in a **2-column grid** with educational content before the user generates output.

**Structure per section card:**
- `borderLeft: 4px solid {sectionColor}`
- `background: {sectionColor}08` (very subtle tint)
- `borderRadius: 10`, `padding: 16px 18px`
- Header: icon + label (uppercase, 12px, weight 700) + position indicator (e.g., "1/6")
- Body: educational "why this matters" text (13px, `#4A5568`, `lineHeight: 1.6`)
- Example block: tinted background (`{sectionColor}18`), `borderLeft: 3px solid {sectionColor}`, italic example text

**Intro text above the grid:**
> "Your output will be structured using the **[Framework Name]** — [one-line description]. Complete the steps above and each section below will be filled with content tailored to your specific needs."

**Summary footer below the grid:**
- Horizontal row of all section icons + labels
- `borderTop: 1px solid #EDF2F7`, `padding: 10px 0`

### 3.8 Action Buttons

Three visual variants used throughout tool pages:

| Variant | Background | Text | Border | Use Case |
|---------|-----------|------|--------|----------|
| `primary` | `#38B2AC` | `#FFFFFF` | none | Primary CTA (Copy, Generate) |
| `accent` | `#5A67D8` | `#FFFFFF` | none | Save to Library |
| default | `#FFFFFF` | `#4A5568` | `1px solid #E2E8F0` | Secondary (Download, Start Over, Back) |

All buttons: `borderRadius: 24`, `padding: 8px 16px`, `fontSize: 12`, `fontWeight: 600`, icon + label with `gap: 5`

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

---

## 4. Output Step Patterns

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
- Each card: `borderLeft: 4px solid {color}`, `background: {color}12`
- Per-section copy button (top-right corner of each card)
- Cards view shows ALL output sections — both informational and actionable — for the user to review

### 4.2 Action Rows

Output actions are split across **two locations** to ensure the user always has quick access to the key actions:

**Top action row (right-aligned, above output content):**
- **Copy {Deliverable Name}** (primary) — e.g., "Copy Full System Prompt", "Copy Full Blueprint". Never use the generic label "Copy All". The button name must describe the specific cohesive deliverable the tool produces.
- **Download** (.md) (default) — downloads the same cohesive deliverable as a Markdown file
- **Save to Prompt Library** (accent, `#5A67D8`) — saves the cohesive deliverable

**Bottom action row (left-aligned, below output content):**
- **Start Over** (default) — resets the tool to its initial state
- **Save to Prompt Library** (accent, `#5A67D8`) — duplicate of the top Save button for convenience

**Key rules:**
- The Save to Prompt Library button must appear at **both** top and bottom
- Copy/Download/Save all operate on the **cohesive deliverable**, not the full set of displayed sections
- Never use generic labels like "Copy All" or "Copy Output" — always name the specific deliverable

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

---

## 5. Tool-Specific Step Definitions

### 5.1 Prompt Playground (Level 1)

| Step | Title | Content |
|------|-------|---------|
| 1 | Choose your mode | Two side-by-side ModeCards: "Enhance a Prompt" (teal) / "Build from Scratch" (gold) |
| 2 | Paste your prompt / Answer the questions | Enhance: textarea + example pills. Build: BuildWizard 6-question survey |
| 3 | Your enhanced/generated prompt | 6-section Blueprint output (Role, Context, Task, Format, Steps, Quality) with Cards/Markdown toggle |

**Educational default (Step 3):** Show all 6 Blueprint sections with `BLUEPRINT_EDUCATION` content (why + example per section).

### 5.2 Agent Builder (Level 2)

| Step | Title | Content |
|------|-------|---------|
| 1 | Describe your agent | Two input fields: task description + input data description. Example agents (good + not-recommended) for quick-fill. Draft persistence via localStorage. |
| 2 | Review your agent design | 4-section output displayed for review, with a cohesive system prompt as the deliverable |

**Displayed sections (Cards view):**
1. **Readiness Score** — Circular gauge (0-100) with verdict and per-criteria breakdown (Frequency, Consistency, Shareability, Complexity, Standardization Risk). Level 1 vs Level 2 comparison points. **Informational only — not included in the deliverable.**
2. **Output Format** — Side-by-side human-readable + JSON template views. Both displayed for review; the JSON template is embedded into the cohesive deliverable.
3. **System Prompt** — Color-coded prompt sections (Role, Context, Task, Output Format, Steps, Quality Checks) matching the Level 1 Prompt Blueprint framework. Expandable/collapsible. This is the core of the cohesive deliverable.
4. **Built-In Accountability** — Checkbox-selectable accountability features with severity badges (critical/important/recommended). Only selected items are included in the deliverable.

**Cohesive deliverable:** "Full System Prompt" — combines sections 2 (JSON template), 3 (system prompt), and 4 (selected accountability instructions) into a single ready-to-use prompt. Section 1 (readiness) is excluded.

**Educational default (Step 2):** Show 4 cards in a 2×2 grid, each explaining what the section assesses and why it matters, with a brief example. Uses the same layout as the output cards but with educational content.

**Level accent:** `#F7E8A4` (light) / `#8A6A00` (dark)

### 5.3 Workflow Canvas (Level 3)

| Step | Title | Content |
|------|-------|---------|
| 1 | Define your workflow | Text description of the workflow + example workflows for quick-fill |
| 2 | Build your canvas | Visual node canvas with node library panel (Input / Processing / Output tabs). Drag-and-drop node placement |
| 3 | Export your workflow | Workflow summary with connection map, Markdown export, and implementation notes |

**Educational default (Step 3):** Show node type categories with example nodes and their purposes.

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
  children: React.ReactNode;
}

// StepPlaceholder
interface StepPlaceholderProps {
  icon: React.ReactNode;
  message: string;
  detail: string;
}

// ActionBtn
interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;  // teal background
  accent?: boolean;   // indigo background (Save to Library)
  disabled?: boolean;
}
```

---

## 7. Typography & Spacing Reference

### 7.1 Font

All tool pages use `'DM Sans', sans-serif` as the base font. Monospace code blocks use `'JetBrains Mono', 'Fira Code', monospace`.

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
const step2Done = /* output generated */ result !== null;
```

### 8.3 Database Integration

Every tool should call `upsertToolUsed(user.id, toolLevel)` when the user generates output for the first time in a session. Use the tool's level number as the second argument.

### 8.4 Draft Persistence

For tools with significant input (textarea, multi-field forms), save drafts to `localStorage` with the key pattern `oxygy_{toolId}_draft`. Restore on mount and clear after restoration.

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

| Animation | Use |
|-----------|-----|
| `ppSpin` | Loading spinners in buttons |
| `ppPulse` | Skeleton loading blocks |
| `ppFadeIn` | Step card entrance, toast entrance |
| `ppConnectorFlow` | Dashed connector line flowing downward |

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
- [ ] All step cards visible on first load
- [ ] Incomplete steps show `StepPlaceholder` or educational default
- [ ] Output step shows educational/generic content before generation
- [ ] Animated `StepConnector` between every step card

**Theming & Accent Colors:**
- [ ] `LEVEL_ACCENT` and `LEVEL_ACCENT_DARK` constants defined at top of file
- [ ] Level accent color used for: connectors, step badges (done), overview badges (done), "Done ✓" labels, step card done borders
- [ ] No hardcoded teal (`#38B2AC`) for completion indicators — always use level accent variables

**Output & Deliverable:**
- [ ] Cohesive deliverable defined — a `build{Deliverable}` function that combines only actionable sections
- [ ] Informational sections displayed but excluded from copy/download/save
- [ ] Primary copy button named after the specific deliverable (e.g., "Copy Full System Prompt"), never "Copy All"
- [ ] Cards/Markdown toggle for structured output (with info tooltip)
- [ ] Markdown view shows the cohesive deliverable, not a dump of all sections

**Actions & Persistence:**
- [ ] Save to Prompt Library button at **both** top and bottom of output
- [ ] Save to Library button uses accent variant (`#5A67D8`)
- [ ] Download (.md) exports the cohesive deliverable
- [ ] Start Over button at bottom of output
- [ ] `upsertToolUsed()` called on first generation
- [ ] Draft persistence via localStorage for significant input fields
- [ ] Toast notifications for all user actions

**Polish:**
- [ ] Loading skeleton with `ppPulse` animation
- [ ] Staggered block reveal animation for output sections
- [ ] Error state displayed within the relevant step card
- [ ] `DM Sans` font throughout, inline styles (no CSS modules)

---

## 13. Anti-Patterns (What NOT to Do)

**Layout & Structure:**
- **No marketing language** — no "Did you know?", no promotional banners
- **No back-to-home navigation** — the app shell handles navigation
- **No level/course badges** — tool pages are workspaces, not course content
- **No two-column step layouts** — steps are always full-width, one per row
- **No hidden steps** — all steps are always visible (with placeholders)
- **No manual resize textareas** — use auto-growing textareas (`resize: none`, auto-height on change)
- **No emoji in titles** — first thing visible is the tool name in plain text

**Theming:**
- **No hardcoded teal for completion indicators** — step badges, overview badges, done labels, and card borders must use `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK`, not `#38B2AC`
- **No hardcoded colors anywhere** — use level accent variables for all theme-dependent elements

**Output & Actions:**
- **No generic "Copy All" button** — the copy button must name the specific cohesive deliverable (e.g., "Copy Full System Prompt", "Copy Full Blueprint")
- **No dumping all sections into export** — informational sections (scores, assessments) are for display only and must NOT be included in copy/download/save. Only actionable sections go into the cohesive deliverable.
- **No Save button at only one location** — Save to Prompt Library must appear at both the top and bottom of the output area
- **No exporting raw API response** — always compose a polished, cohesive deliverable via a dedicated `build{Deliverable}` function

**Code:**
- **No duplicate state** — derive step completion from existing state
- **No Tailwind in tool pages** — inline styles only (exception: BuildWizard uses Tailwind as it's a pre-existing component)
