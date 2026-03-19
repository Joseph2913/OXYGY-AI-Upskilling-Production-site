# PRD-16: Learning Coach

> A personalised learning pathway generator that helps learners use AI tools to close specific knowledge gaps. The learner describes what they're struggling with, selects which AI platforms they have access to and how they prefer to learn, and receives a sequenced, multi-platform learning pathway with copy-paste prompts and step-by-step instructions for each platform's specific features.

---

## 1. Overview

### 1.1 Purpose

The Learning Coach is a meta-learning tool: it doesn't teach content itself — it generates a personalised *method* for learning content, routed through the specific AI platforms the learner actually has access to. It solves the problem that most upskilling programmes ignore: a learner finishes the e-learning module and still feels shaky on a concept, but doesn't know how to go deeper on their own. The Learning Coach gives them the self-service toolkit to do exactly that.

### 1.2 Where It Sits

- **Location:** Standalone page in the authenticated dashboard, accessible from the sidebar at all times
- **Route:** `/app/toolkit/learning-coach`
- **Nav entry:** New item in `AppSidebar.tsx` — label: "Learning Coach", icon: `GraduationCap` (from lucide-react), positioned after "My Toolkit" and before "My Artefacts"
- **Not nested** under any specific level — it's a cross-cutting utility available regardless of where the learner is in their journey
- **Lazy-loaded** via `React.lazy()` in `App.tsx`, matching the existing toolkit page pattern

### 1.3 Target Audience

All enrolled learners at any level (L1–L5). A Level 1 learner struggling with prompt engineering uses it. A Level 3 learner hitting a wall on agent chaining uses it. It's always there, always available.

### 1.4 Key Differentiator

The platform feature registry — Oxygy's curated knowledge of what each AI tool can do for learning, mapped to specific features and learning modalities. The output doesn't say "use NotebookLM" — it says "open NotebookLM, create a new notebook, paste this prompt as a source, click Audio Overview, and listen to the generated conversation." That specificity is the product.

---

## 2. Page Structure (Top to Bottom)

The page follows the Toolkit Page Standard's single-page workspace pattern. All inputs are visible at once — no stepped wizard. The output renders below the inputs after generation.

```
┌─────────────────────────────────────────────────────────┐
│  Page Title (h1): "Learning Coach"                      │
│  Description (2 lines, full width)                      │
├─────────────────────────────────────────────────────────┤
│  How It Works — Overview Strip (ToolOverview)            │
│  ┌──────────┐  ›  ┌──────────┐  ›  ┌──────────┐       │
│  │ Describe  │     │ Select   │     │ Generate  │       │
│  └──────────┘     └──────────┘     └──────────┘       │
│  ┌─ Outcome ────────────────────────────────────────┐  │
│  │ A sequenced, multi-platform learning pathway     │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Input Zone (all inputs visible, fill top-to-bottom)    │
│    Row 1: Level selector + Objective selector           │
│    Row 2: Gap description textarea                      │
│    Row 3: Platform multi-select + Preference multi-sel  │
│    Row 4: Generate CTA                                  │
├─── Animated StepConnector ──────────────────────────────┤
│  Output Zone (appears after generation)                 │
│    - Next Step Banner                                   │
│    - Top Action Row                                     │
│    - Pathway Header (gap reflection)                    │
│    - Approach Summary                                   │
│    - Sequenced Step Cards with StepConnectors           │
│    - Go Deeper (optional)                               │
│    - OutputActionsPanel                                 │
│    - Refinement Card (collapsed by default)             │
│    - Bottom Navigation Row                              │
│    - Pathway Metadata Footer                            │
├─────────────────────────────────────────────────────────┤
│  Toast Notification (fixed, bottom-center)              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Page Header

### 3.1 Title

```
Learning Coach
```

- `fontSize: 28`, `fontWeight: 800`, `color: #1A202C`, `letterSpacing: '-0.4px'`
- Plain text — no emoji, no icons
- `fontFamily: "'DM Sans', sans-serif"`

### 3.2 Description

> "Everyone learns differently, and the best AI tool for you depends on what you're trying to learn and how you think. Describe your knowledge gap, pick the platforms you have access to and how you prefer to learn — and get a sequenced, multi-tool learning pathway with ready-to-use prompts and step-by-step instructions."

- `fontSize: 14`, `color: #718096`, `lineHeight: 1.7`
- Two lines max at full width

### 3.3 How It Works — Overview Strip

Uses the existing `ToolOverview` pattern from the Toolkit Page Standard.

```tsx
<ToolOverview
  steps={[
    { number: 1, label: 'Describe your gap', detail: 'Pick level, objective & what you want to learn', done: step1Done },
    { number: 2, label: 'Choose your tools', detail: 'Select platforms & learning preferences', done: step2Done },
    { number: 3, label: 'Get your pathway', detail: 'Sequenced steps with prompts & instructions', done: step3Done },
  ]}
  outcome="A personalised, multi-platform learning pathway you can follow immediately — with copy-paste prompts for every step."
/>
```

**Level accent:** This page is not tied to a single level — the accent colour dynamically changes based on the learner's selected level. Default to teal (`#38B2AC` / `#1A7A76`) before a level is selected. Once a level is selected, switch to that level's accent pair.

| Level | LEVEL_ACCENT | LEVEL_ACCENT_DARK |
|-------|-------------|-------------------|
| Default (none selected) | `#38B2AC` | `#1A7A76` |
| 1 | `#A8F0E0` | `#1A6B5F` |
| 2 | `#F7E8A4` | `#8A6A00` |
| 3 | `#38B2AC` | `#1A7A76` |
| 4 | `#F5B8A0` | `#8C3A1A` |
| 5 | `#C3D0F5` | `#2E3F8F` |

The Overview Strip badges, StepConnectors, output cards, and all accent-dependent elements update when the level selection changes.

---

## 4. Input Zone

All inputs are rendered in a single StepCard (Step 1). The card is always visible and never collapses. The card uses the dynamic level accent for its "done" border state.

### 4.1 StepCard Configuration

| Prop | Value |
|------|-------|
| `stepNumber` | `1` |
| `title` | `"Describe what you want to learn"` |
| `subtitle` | `"Tell us about your gap and how you prefer to learn"` |
| `done` | `!!result` |
| `collapsed` | `false` (never collapses — always editable) |

### 4.2 Row 1 — Level & Objective (Two-Column)

**Layout:** `display: grid`, `gridTemplateColumns: '1fr 1fr'`, `gap: 16px`

**Left column: Level Selector**

- Label: "LEVEL" — `fontSize: 11`, `fontWeight: 700`, `color: #A0AEC0`, `textTransform: uppercase`, `letterSpacing: '0.06em'`
- Five pill buttons in a horizontal row: `L1 · Fundamentals`, `L2 · Applied`, `L3 · Systemic`, `L4 · Dashboards`, `L5 · Applications`
- Each pill:
  - Default: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 20`, `padding: '6px 14px'`, `fontSize: 12`, `fontWeight: 600`, `color: #4A5568`
  - Hover: `background: ${LEVEL_ACCENT}18`, `borderColor: ${LEVEL_ACCENT}`
  - Selected: `background: ${LEVEL_ACCENT}`, `color: ${LEVEL_ACCENT_DARK}`, `borderColor: ${LEVEL_ACCENT_DARK}40`, `fontWeight: 700`
- Selecting a level changes the page-wide `LEVEL_ACCENT` and populates the Objective selector

**Right column: Learning Objective Selector**

- Label: "LEARNING OBJECTIVE"
- Dynamically populated based on selected level (see §4.8 for the full objective list)
- Chip-style buttons that wrap (`flexWrap: wrap`, `gap: 8`)
- Same pill styling as Level selector, but using the active level's accent colour for the selected state
- Disabled (greyed out) until a level is selected

### 4.3 Row 2 — Gap Description (Full Width)

- Label: "WHAT DO YOU WANT TO LEARN?"
- Auto-growing textarea: `minHeight: 100px`, `maxHeight: 240px`, `resize: none`
- Placeholder: "What specifically are you struggling with or want to go deeper on? The more specific you are, the better your pathway will be."
- `fontSize: 14`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: '14px 16px'`, `fontFamily: "'DM Sans', sans-serif"`, `lineHeight: 1.6`
- Focus state: `borderColor: ${LEVEL_ACCENT_DARK}`, `boxShadow: '0 0 0 3px ${LEVEL_ACCENT}25'`

**Example chips** below the textarea (per Toolkit Standard §4.6):

Label: "Try an example:" — `fontSize: 12`, `color: #A0AEC0`, `fontWeight: 500`

Example chips (6 total — the full set; the visible set rotates based on selected level):

| Level | Example Chips |
|-------|--------------|
| L1 | "I understand prompting basics but I can't get consistent, high-quality results across different tasks" |
| L1 | "I know what context engineering is in theory but I'm not sure when to use documents vs system prompts vs project structures in practice" |
| L2 | "I've built a custom GPT but the outputs are inconsistent — sometimes great, sometimes completely off" |
| L2 | "I want to build an agent my whole team can use but I don't know how to write instructions that work for everyone, not just me" |
| L3 | "I've mapped out a workflow on paper but I can't figure out how to translate the decision points into automation logic" |
| L3 | "I understand agent chaining conceptually but I don't know how to handle failures or unexpected inputs mid-workflow" |
| L4 | "I have AI-generated data but I don't know how to design a dashboard that actually helps people make decisions with it" |
| L5 | "I want to build a full application with user accounts and personalised experiences but I don't know where to start with the architecture" |

Show chips for the currently selected level. If no level is selected, show 4 generic chips from across levels.

### 4.4 Row 3 — Platform & Preference (Two Sections Side by Side)

**Layout:** `display: grid`, `gridTemplateColumns: '1fr 1fr'`, `gap: 24px`

**Left section: Platform Multi-Select**

- Label: "PLATFORMS YOU HAVE ACCESS TO" — `fontSize: 11`, `fontWeight: 700`, `color: #A0AEC0`, `textTransform: uppercase`
- Subtext: "Select all that apply" — `fontSize: 12`, `color: #A0AEC0`, `marginBottom: 8`
- Six checkbox-style chip buttons in a 2×3 grid (`gridTemplateColumns: '1fr 1fr'`, `gap: 8`)
- Each chip: platform icon (16px, inline) + platform name
  - Default: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: '10px 14px'`, `fontSize: 13`, `fontWeight: 500`, `color: #4A5568`, `cursor: pointer`
  - Hover: `background: ${LEVEL_ACCENT}10`, `borderColor: ${LEVEL_ACCENT}`
  - Selected: `background: ${LEVEL_ACCENT}18`, `border: 2px solid ${LEVEL_ACCENT_DARK}`, `color: #1A202C`, `fontWeight: 600`. Checkmark icon (Check, 14px) replaces the platform icon.

**Platform list (6 platforms):**

| Platform | Icon | Features Count |
|----------|------|----------------|
| NotebookLM | 📓 | 5 features |
| Claude | 🟣 | 5 features |
| ChatGPT | 💬 | 5 features |
| Perplexity | 🔍 | 4 features |
| Gemini / Google AI Studio | ✦ | 4 features |
| YouTube | ▶ | 4 features |

**Right section: Learning Preference Multi-Select**

- Label: "HOW DO YOU PREFER TO LEARN?"
- Subtext: "Select all that apply"
- Five radio-style pill buttons in a vertical stack (`flexDirection: column`, `gap: 8`)
- Each pill: preference icon + label + short description
  - Default/Hover/Selected: same styling as platform chips
  - Description: `fontSize: 11`, `color: #718096`, `marginTop: 2`

**Preference list:**

| Preference | Label | Description |
|-----------|-------|-------------|
| listen | Listen & absorb | "I learn best hearing concepts explained conversationally" |
| read | Read & reflect | "I prefer written depth — articles, guides, detailed walkthroughs" |
| watch | Watch & follow | "Show me someone doing it and I'll follow along" |
| build | Build & experiment | "Give me a sandbox and a challenge" |
| talk | Talk it through | "I learn by asking questions in a back-and-forth" |

### 4.5 Row 4 — Generate CTA

- Full-width teal button: `background: ${LEVEL_ACCENT_DARK}`, `color: #FFFFFF`, `borderRadius: 24`, `padding: '14px 28px'`, `fontSize: 14`, `fontWeight: 700`
- Label: "Generate My Learning Pathway →"
- Disabled state (greyed out, `cursor: not-allowed`) until ALL of: level selected, objective selected, gap description non-empty (>20 chars), at least one platform selected, at least one preference selected
- Validation: if user clicks while disabled, flash a red border on the first incomplete input for 1500ms
- On click: triggers the API call and shows the ProcessingProgress indicator in the output zone

### 4.6 Draft Persistence

Save the full input state to `localStorage` with key `oxygy_learning_coach_draft`:

```typescript
interface LearningCoachDraft {
  level: number | null;
  objective: string | null;
  gap: string;
  platforms: string[];
  preferences: string[];
  savedAt: number;
}
```

Restore on mount. Clear after successful generation (the output is saved to Supabase, so the draft is no longer needed).

### 4.7 Input State Summary

```typescript
const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
const [gapDescription, setGapDescription] = useState('');
const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
```

### 4.8 Learning Objectives Per Level

```typescript
const LEVEL_OBJECTIVES: Record<number, string[]> = {
  1: [
    'Prompt Engineering',
    'Context Engineering',
    'Responsible AI Use',
    'Multimodal AI (Image / Video / Audio)',
    'Learning How to Learn with AI',
  ],
  2: [
    'What AI Agents Are & Why They Matter',
    'Custom GPT / Agent Building',
    'System Prompt & Instruction Design',
    'Human-in-the-Loop Design',
    'Sharing & Standardising Agents',
  ],
  3: [
    'AI Workflow Mapping',
    'Agent Chaining & Orchestration',
    'Input Logic & Role Mapping',
    'Automated Output Generation',
    'Human-in-the-Loop at Scale',
    'Performance & Feedback Loops',
  ],
  4: [
    'UX Design for AI Outputs',
    'Dashboard Prototyping',
    'User Journey Mapping',
    'Data Visualisation Principles',
    'Role-Specific Front-Ends',
  ],
  5: [
    'Application Architecture',
    'Personalisation Engines',
    'Knowledge Base Applications',
    'Custom Learning Platforms',
    'Full-Stack AI Integration',
    'User Testing & Scaling',
  ],
};
```

---

## 5. Output Zone — Component Hierarchy

The output zone renders below the input StepCard, connected by an animated StepConnector. It lives inside a second StepCard (Step 2).

### 5.1 Output StepCard Configuration

| Prop | Value |
|------|-------|
| `stepNumber` | `2` |
| `title` | `"Your learning pathway"` |
| `subtitle` | `"A personalised, sequenced learning journey across your selected platforms"` |
| `done` | `!!result` |
| `collapsed` | `false` |

### 5.2 Loading State — ProcessingProgress

While the API call is in flight, show the `ProcessingProgress` indicator inside the output StepCard.

**Initial generation steps:**

| # | Label | Delay from previous |
|---|-------|---------------------|
| 1 | Analysing your learning gap… | 800ms |
| 2 | Mapping platform features to your preferences… | 1500ms |
| 3 | Designing your learning sequence… | 3000ms |
| 4 | Generating platform-specific prompts… | 3500ms |
| 5 | Assembling your pathway… | 4000ms |
| 6 | Finalising recommendations… | -1 (open-ended) |

Header: `"Building your learning pathway…"`
Subtext: `"This usually takes 15–20 seconds"`

**Refinement steps:**

| # | Label |
|---|-------|
| 1 | Processing your refinement context… |
| 2 | Re-evaluating platform features… |
| 3 | Adjusting learning sequence… |
| 4 | Updating prompts and instructions… |
| 5 | Quality checks… |
| 6 | Finalising refined pathway… |

Header: `"Refining your pathway…"`

### 5.3 Placeholder State (Before Generation)

Before the user generates output, the StepCard shows a `StepPlaceholder`:

- Icon: `Sparkles` (lucide-react, 16px, `color: #A0AEC0`)
- Message: "Your personalised learning pathway will appear here"
- Detail: "Complete the inputs above and click 'Generate My Learning Pathway' to get a sequenced, multi-platform learning path with copy-paste prompts and step-by-step instructions."

---

## 6. Output Zone — Generated Content

Once the API returns, the output zone renders the following blocks in order. All blocks use the dynamically selected level accent colours.

### 6.1 Next Step Banner

Per Toolkit Standard §4.8. Rendered immediately above the pathway content.

- `background: ${LEVEL_ACCENT}15`
- `borderLeft: 4px solid ${LEVEL_ACCENT_DARK}`
- `borderRadius: 10`, `padding: '14px 18px'`
- Icon: `Compass` (lucide-react)
- **Headline:** "Follow the steps below in order — each one builds on the last."
- **Body:** "Start with Step 1 and work through the sequence. Copy each prompt directly into the recommended platform and follow the instructions. Come back and refine your pathway if your gap evolves."

### 6.2 Top Action Row

Per Toolkit Standard §4.2, Zone 1. Rendered between the Next Step Banner and the pathway content.

- **Left:** Cards / Markdown toggle (with info tooltip)
- **Right (inline):**
  1. **Copy Full Pathway** — primary ActionBtn (teal/level accent). Copies the cohesive markdown deliverable.
  2. **Download (.md)** — default ActionBtn. Date-stamped filename: `learning-pathway-{level}-{date}.md`
  3. **Save to Library** — accent ActionBtn (`#5A67D8`). Calls `createArtefactFromTool()` with type `'pathway'` (requires schema migration — see §11.2).

### 6.3 Cards View — Pathway Composition

The Cards view renders the pathway as a vertical composition with six zones:

#### Zone A — Pathway Header

A compact card that orients the learner. Uses the level accent colours.

- **Container:** `background: ${LEVEL_ACCENT}15`, `borderLeft: 4px solid ${LEVEL_ACCENT_DARK}`, `borderRadius: 12`, `padding: '18px 22px'`
- **Top row:** Level badge (pill: `background: ${LEVEL_ACCENT}`, `color: ${LEVEL_ACCENT_DARK}`, `fontSize: 11`, `fontWeight: 700`, `textTransform: uppercase`, `borderRadius: 20`, `padding: '3px 10px'`) + Objective name (regular weight, `fontSize: 13`, `color: #4A5568`)
- **Gap reflection:** `fontSize: 15`, `fontWeight: 500`, `color: #1A202C`, `lineHeight: 1.6`, `marginTop: 10`
- Always visible, not collapsible

#### Zone B — Approach Summary

A pull-quote styled block explaining why this combination of platforms and features was chosen.

- `borderLeft: 4px solid ${LEVEL_ACCENT_DARK}`
- `background: ${LEVEL_ACCENT}08`
- `borderRadius: '0 10px 10px 0'`
- `padding: '14px 18px'`
- `fontSize: 14`, `fontWeight: 400`, `color: #2D3748`, `lineHeight: 1.7`, `fontStyle: italic`
- `marginTop: 16`, `marginBottom: 20`

#### Zone C — Sequenced Steps (the heart of the output)

Each step is a `CollapsibleOutputCard` connected by `StepConnector` components. The first step auto-expands; all others are collapsed by default.

**Step card props mapping:**

| Prop | Source |
|------|--------|
| `sectionKey` | `step-${index}` |
| `icon` | Platform icon (emoji or small SVG) |
| `title` | `"Step ${n} · ${platformName} · ${featureName} · ~${timeEstimate}"` |
| `summary` | First sentence of the activity description (shown when collapsed) |
| `expanded` | First step: `true`. Others: `false` (user toggles) |
| `copyContent` | The prompt text for this step (if present), or the full step content as markdown |
| `accentColor` | `LEVEL_ACCENT_DARK` |

**Expanded step card content:**

```
┌──────────────────────────────────────────────────────────┐
│  [CollapsibleOutputCard header — always visible]          │
│  Step 1 · NotebookLM · Audio Overview · ~15 min          │
├──────────────────────────────────────────────────────────┤
│  [Expanded content — below the header divider]            │
│                                                          │
│  ACTIVITY                                                │
│  2–3 sentences describing what the learner will do       │
│  and why this step matters in the sequence.              │
│                                                          │
│  YOUR PROMPT  [Copy ▢]                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [Prompt box — E-Learning SKILL §7 style]          │  │
│  │  Ready-to-use prompt text, incorporating the       │  │
│  │  learner's specific gap, level, and objective.     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  HOW TO USE THIS                                         │
│  1. Open NotebookLM and create a new notebook.           │
│  2. Click 'Add source' and paste the prompt above.       │
│  3. Click 'Audio Overview' in the top toolbar.           │
│  4. Listen to the generated conversation...              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Prompt box styling** (from E-Learning SKILL §7):

```jsx
{
  background: '#F7FAFC',
  border: '1px solid #E2E8F0',
  borderLeft: `3px solid ${LEVEL_ACCENT_DARK}`,
  borderRadius: '0 8px 8px 0',
  padding: '12px 16px',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  fontStyle: 'italic',
  color: '#2D3748',
  lineHeight: 1.6,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  width: '100%',
  position: 'relative',
}
```

Copy button floats top-right of the prompt box: `position: absolute`, `top: 8`, `right: 8`, `fontSize: 11`, `color: #A0AEC0`, click copies prompt text, changes to "Copied ✓" for 2000ms.

**Step instruction labels:**

- "ACTIVITY" — section label: `fontSize: 11`, `fontWeight: 700`, `color: ${LEVEL_ACCENT_DARK}`, `textTransform: uppercase`, `letterSpacing: '0.06em'`, `marginBottom: 6`
- "YOUR PROMPT" — same label styling
- "HOW TO USE THIS" — same label styling

**Step instruction numbering:**

Numbered steps use ordered list styling: `fontSize: 13`, `color: #4A5568`, `lineHeight: 1.7`, `paddingLeft: 20` with counter-based numbering.

**StepConnectors between step cards:**

Use the existing `StepConnector` component with `LEVEL_ACCENT` colour. Animated dashed line flowing downward, per Toolkit Standard §3.5.

**Not every step will have a prompt.** YouTube steps will have video/channel recommendations instead. The prompt box section only renders if the AI returns a `prompt` field for that step.

#### Zone D — Go Deeper (Optional)

If the AI generates supplementary recommendations, they render in a secondary card below the main steps.

- **Container:** `borderTop: 1px solid #E2E8F0`, `paddingTop: 20`, `marginTop: 24`
- **Heading:** "Reinforce Your Learning" — `fontSize: 15`, `fontWeight: 700`, `color: #1A202C`
- **Cards:** Horizontal row of 2–3 recommendation cards (`display: flex`, `gap: 12`, `flexWrap: wrap`)
- Each card: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: '12px 16px'`, `flex: '1 1 200px'`
  - Platform icon + resource title (`fontSize: 13`, `fontWeight: 600`, `color: #1A202C`)
  - One-line description (`fontSize: 12`, `color: #718096`)
  - External link (if applicable): `color: ${LEVEL_ACCENT_DARK}`, `fontSize: 12`, `fontWeight: 600`

This section only renders if the API response includes a `goDeeper` array with at least one item.

### 6.4 Markdown View

When the user toggles to Markdown view, render the cohesive deliverable in a dark code block.

- `background: #1A202C`, `borderRadius: 12`, `padding: '22px 24px'`
- `fontFamily: "'JetBrains Mono', 'Fira Code', monospace"`, `fontSize: 13`, `lineHeight: 1.8`, `color: #E2E8F0`

The Markdown view shows the **cohesive deliverable** — the structured learning pathway as a single document. It includes: the gap reflection, approach summary, and all sequenced steps with their prompts and instructions. It excludes the "Go Deeper" recommendations (those are supplementary, not part of the core pathway).

### 6.5 OutputActionsPanel

Per Toolkit Standard §4.2, Zone 2. Rendered below the pathway content and above the refinement card.

Uses the existing `OutputActionsPanel` component from `components/app/workflow/OutputActionsPanel.tsx`.

Props:

| Prop | Value |
|------|-------|
| `workflowName` | `"Learning Pathway"` |
| `fullMarkdown` | Output of `buildFullPathway(result)` |
| `onSaveToArtefacts` | Save handler (see §11.1) |
| `isSaved` | `savedToLibrary` state |

### 6.6 Refinement Card

Per Toolkit Standard §4.5. Combined caveat + refinement card, collapsed by default.

**Caveat text:** "This pathway is a starting point tailored to your described gap. As you work through it, you may discover your gap is different from what you initially thought — that's normal and expected. Come back and refine."

**Refinement questions** (3–5, generated by the AI, specific to the learner's gap and pathway):

Example questions the AI might generate:
- "After reviewing the pathway, is there a specific concept within [objective] you want more depth on?"
- "Are there time constraints that would change how long you can spend on each step?"
- "Did the pathway miss any context about your current understanding level?"
- "Is there a specific output you need to produce after learning this (e.g., a presentation, a document, a demo)?"

**Expand CTA:** "Would you like to refine this pathway further?" — `fontWeight: 600`, `color: ${LEVEL_ACCENT_DARK}`

**Refinement counter badge:** Shown if `refinementCount > 0`

### 6.7 Bottom Navigation Row

Per Toolkit Standard §4.2, Zone 3.

- **Start Over** — default ActionBtn. Resets all input state and output state. Clears localStorage draft.
- No "Back" button needed — this is a two-step flow (input → output) and the input card is always visible/editable.

### 6.8 Pathway Metadata Footer

A small, muted footer below everything.

- `borderTop: 1px solid #E2E8F0`, `paddingTop: 12`, `marginTop: 20`
- Horizontal row: Level badge (pill) + Objective name + Platform icons (small, inline) + Preference labels + Date generated
- All text: `fontSize: 11`, `color: #A0AEC0`, `fontFamily: "'DM Sans', sans-serif"`
- Layout: `display: flex`, `alignItems: center`, `gap: 12`, `flexWrap: wrap`

---

## 7. Staggered Reveal Animation

Per Toolkit Standard §4.3. When the output first appears, animate blocks in with staggered delay:

```typescript
useEffect(() => {
  if (!result) return;
  setVisibleBlocks(0);
  const timers: ReturnType<typeof setTimeout>[] = [];
  const totalSections = 3 + (result.steps?.length || 0) + (result.goDeeper?.length ? 1 : 0);
  for (let i = 0; i < totalSections; i++) {
    timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
  }
  return () => timers.forEach(clearTimeout);
}, [result]);
```

Block order: Pathway Header → Approach Summary → Step 1 → Step 2 → ... → Step N → Go Deeper (if present).

---

## 8. Platform Feature Registry (Data)

This data structure powers the system prompt. It lives in `data/learningCoachContent.ts`.

```typescript
export interface PlatformFeature {
  id: string;
  name: string;
  description: string;        // What it does
  learningUse: string;         // How a learner uses it
  preferences: string[];       // Which learning preferences it serves
  uniqueValue: string;         // What makes it different
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  features: PlatformFeature[];
  preferences: string[];       // Aggregate of all feature preferences
  levelNote?: string;          // e.g., "Recommended for Level 2+ only" for AI Studio
}

export const PLATFORMS: Platform[] = [/* ... */];
```

### 8.1 Platform 1: NotebookLM

| Feature | Description | Learning Preferences |
|---------|-------------|---------------------|
| Audio Overview | Generates a conversational podcast-style discussion about uploaded sources. 10–20 min. Customisable focus via instructions. | Listen & absorb |
| Source Guide | Creates a structured study guide/handout from uploaded sources with key concepts, definitions, and relationships. | Read & reflect |
| Briefing Doc | Generates a concise executive summary of key points across uploaded sources. | Read & reflect |
| Chat | Interactive Q&A grounded in uploaded sources with inline citations. | Talk it through, Build & experiment |
| FAQ Generation | Auto-generates frequently asked questions with answers from uploaded sources. | Read & reflect, Build & experiment |

### 8.2 Platform 2: Claude

| Feature | Description | Learning Preferences |
|---------|-------------|---------------------|
| Projects | Persistent workspace with project instructions and uploaded reference documents. Context persists across conversations. | Talk it through, Build & experiment |
| Visualiser | Generates inline diagrams, flowcharts, concept maps, decision trees, and visual explanations. | Watch & follow, Read & reflect |
| Artifacts | Creates standalone documents, interactive tools, code, comparison tables, quizzes in a dedicated panel. | Build & experiment, Read & reflect |
| Deep Research | Comprehensive web research with synthesis and citations. Takes several minutes, produces thorough output. | Read & reflect |
| Conversation | Back-and-forth tutoring mode. Paste a structured prompt and begin learning through dialogue. | Talk it through |

### 8.3 Platform 3: ChatGPT

| Feature | Description | Learning Preferences |
|---------|-------------|---------------------|
| Custom GPTs | Build a persistent AI agent with custom instructions and knowledge files. Create a dedicated tutor for a topic. | Build & experiment, Talk it through |
| Canvas | Side-by-side collaborative workspace for co-editing documents or code with ChatGPT. | Build & experiment |
| Image Generation (DALL·E) | Generates images from text — visual concept explanations, metaphorical illustrations, visual mnemonics. | Watch & follow |
| Browsing | Real-time web search integrated into conversation. Find current examples and case studies. | Read & reflect |
| Conversation | Standard chat interface for tutoring. Paste a structured prompt to begin. | Talk it through |

### 8.4 Platform 4: Perplexity

| Feature | Description | Learning Preferences |
|---------|-------------|---------------------|
| Search & Cited Answers | Answers questions with inline citations linking to specific sources. Every claim is traceable. | Read & reflect |
| Focus Modes | Narrow search scope: Academic (papers), Writing (synthesis), Web (broad), YouTube (videos), Reddit (community). | Read & reflect, Listen & absorb, Watch & follow |
| Spaces | Persistent research collection with saved searches and organised sources. Set custom instructions per Space. | Read & reflect, Build & experiment |
| Pages | AI-generated shareable write-ups on a topic with sections, visuals, and citations. | Read & reflect |

### 8.5 Platform 5: Gemini / Google AI Studio

| Feature | Description | Learning Preferences |
|---------|-------------|---------------------|
| Gemini Chat | Conversational AI with very large context window. Paste entire documents. Works inside Google Docs/Sheets/Slides. | Talk it through, Read & reflect |
| Gems (Custom Agents) | Create persistent agents with custom instructions, similar to Custom GPTs. | Build & experiment, Talk it through |
| Google Workspace Integration | Gemini works directly inside Docs, Sheets, Slides. Interact with learning materials without leaving the document. | Read & reflect, Build & experiment |
| Google AI Studio (Advanced) | Developer-oriented interface for testing prompts, comparing outputs, adjusting parameters. Level 2+ only. | Build & experiment |

### 8.6 Platform 6: YouTube

| Feature | Description | Learning Preferences |
|---------|-------------|---------------------|
| Conceptual Explainers | Channels that break down complex concepts from first principles with strong visual production. (3Blue1Brown, Fireship style) | Listen & absorb, Watch & follow |
| Practical Tutorials | Step-by-step screen-share walkthroughs demonstrating exactly how to do something. | Watch & follow |
| Industry Commentary | Channels covering AI news, trends, product launches, and strategic implications. | Listen & absorb |
| Short-Form Primers | Videos under 10 minutes with dense, focused introductions to a single concept. | Listen & absorb, Watch & follow |

### 8.7 Preference-to-Platform Coverage Matrix

| Preference | Platforms & Features |
|-----------|---------------------|
| Listen & absorb | NotebookLM (Audio Overview), YouTube (Explainers, Commentary, Primers), Perplexity (YouTube Focus) |
| Read & reflect | Perplexity (Search, Pages, Spaces), NotebookLM (Source Guide, Briefing Doc), Claude (Deep Research), ChatGPT (Browsing), Gemini (Chat, Workspace) |
| Watch & follow | YouTube (Tutorials, Explainers), Claude (Visualiser), ChatGPT (Image Generation) |
| Build & experiment | ChatGPT (Custom GPTs, Canvas), Claude (Artifacts, Projects), Gemini/AI Studio (Prompt prototyping), Perplexity (Spaces) |
| Talk it through | Claude (Conversation, Projects), ChatGPT (Conversation), NotebookLM (Chat), Gemini (Chat, Gems) |

---

## 9. API Architecture

### 9.1 Endpoint

**File:** `api/generate-learning-pathway.ts`
**Method:** POST
**Route:** `/api/generate-learning-pathway`

### 9.2 Request Body

```typescript
interface LearningCoachRequest {
  level: number;                    // 1-5
  objective: string;                // The selected learning objective
  gap: string;                      // The learner's gap description
  platforms: string[];              // Platform IDs: ['notebooklm', 'claude', ...]
  preferences: string[];            // Preference IDs: ['listen', 'build', ...]
  refinement?: {                    // Present only on refinement passes
    previousPathway: string;        // The previous pathway (markdown)
    answers: Record<string, string>; // Answered refinement questions
    additionalContext?: string;     // Free-text additional context
  };
}
```

### 9.3 Response Shape

```typescript
interface LearningCoachResponse {
  gapReflection: string;            // 1-2 sentence restatement of the gap
  approachSummary: string;          // Why this combination was chosen
  steps: PathwayStep[];             // The sequenced learning activities
  goDeeper?: GoDeepResource[];      // Optional supplementary recommendations
  refinementQuestions: string[];    // 3-5 questions for refinement
}

interface PathwayStep {
  stepNumber: number;
  platform: string;                 // Platform ID
  platformName: string;             // Display name
  feature: string;                  // Feature name
  timeEstimate: string;             // e.g., "~15 min"
  activity: string;                 // 2-3 sentence description
  prompt?: string;                  // Copy-paste prompt (if applicable)
  instructions: string[];           // Numbered how-to steps
}

interface GoDeepResource {
  platform: string;
  title: string;
  description: string;
  url?: string;                     // External link (if applicable)
}
```

### 9.4 System Prompt Architecture (Three Layers)

The system prompt is composed of three layers:

**Layer 1 — Platform Feature Registry**

The full platform feature registry (§8) serialised as structured text. This is Oxygy's curated knowledge that the AI cannot invent on its own. Example:

```
## PLATFORM: NotebookLM
### Feature: Audio Overview
- What it does: Generates a conversational podcast-style discussion about your uploaded sources...
- How a learner uses it: Upload the relevant learning material, optionally add a focus instruction...
- Learning preferences served: Listen & absorb
- Unique value: No other platform turns your own materials into a bespoke podcast...
```

**Layer 2 — Learning Design Framework**

Rules for sequencing a learning journey (not listing tools):

```
## LEARNING DESIGN RULES
1. Start with the learner's PRIMARY preference to build immediate engagement
2. Sequence from passive to active: absorption → understanding → testing → application
3. Alternate between platforms to prevent fatigue and leverage each tool's unique strengths
4. Always end with an APPLICATION step that connects back to the learner's real work
5. Include 3-6 steps total — enough for a complete learning arc, short enough to feel achievable
6. Each step should build on the previous one — reference prior steps in activity descriptions
7. Time estimates should be realistic — 10-20 minutes per step, 45-90 minutes total
8. When the learner selects multiple preferences, blend them in the sequence (don't just serve the first one)
9. Generate prompts that incorporate the learner's specific gap, level context, and objective — never generic
10. YouTube steps should recommend specific TYPES of content (not specific videos), with channel archetype guidance
```

**Layer 3 — Level-Specific Curriculum Context**

What each learning objective actually covers at each level, so the AI can generate prompts that are actually useful:

```
## LEVEL 1: FUNDAMENTALS & AWARENESS

### Objective: Prompt Engineering
Covers: The Prompt Blueprint framework (Role, Context, Task, Format, Steps, Checks), the RCTF subset for quick prompts, the prompting spectrum (brain dump → conversational → structured), modifier techniques (Chain of Thought, Few-Shot, Iterative Refinement). Key concept: choosing the right level of structure for the situation — not always using the most structured approach.

### Objective: Context Engineering
Covers: The three context layers (inline context, document/file context, persistent project context), when to use each one, how context quality drives output quality. Key concept: the context-output relationship — the AI's output can only be as good as the context it receives.

[... continues for all objectives across all levels ...]
```

### 9.5 System Prompt — Full Template

```typescript
const SYSTEM_PROMPT = `You are the Learning Coach for OXYGY's AI Centre of Excellence. You generate personalised, sequenced learning pathways that help professionals learn specific AI skills using the AI tools they have access to.

You are NOT a generic chatbot. You are a learning designer. Your output is a choreographed learning sequence — a mini curriculum that moves the learner across tools in a deliberate order. Each step builds on the previous one.

## YOUR OUTPUT RULES
- Generate 3-6 steps total (never more than 6)
- Each step must use a specific FEATURE of a specific PLATFORM from the learner's selected platforms
- Prompts must incorporate the learner's specific gap description — never generic "teach me about X" prompts
- Activity descriptions must explain WHY this step matters in the sequence, not just WHAT to do
- Instructions must be platform-specific and feature-specific: exact button names, exact menu locations
- Time estimates must be realistic: 10-20 minutes per step
- The gap reflection must demonstrate you understood the learner's specific situation
- The approach summary must explain the pedagogical reasoning behind the sequence
- Generate 3-5 refinement questions that are specific to the learner's gap (not generic)
- If the learner selected YouTube, recommend TYPES of content and channel archetypes, not specific video URLs
- Be tool-agnostic in your teaching language (don't favour one platform over another)
- Never reference "OXYGY" or the "Learning Coach" in the pathway content — the learner will use this outside the platform

${PLATFORM_FEATURE_REGISTRY}

${LEARNING_DESIGN_FRAMEWORK}

${LEVEL_CURRICULUM_CONTEXT}

## OUTPUT FORMAT
Respond ONLY with valid JSON, no backticks or markdown:
{
  "gapReflection": "string",
  "approachSummary": "string",
  "steps": [
    {
      "stepNumber": 1,
      "platform": "platform_id",
      "platformName": "Display Name",
      "feature": "Feature Name",
      "timeEstimate": "~15 min",
      "activity": "string",
      "prompt": "string or null",
      "instructions": ["string", "string", ...]
    }
  ],
  "goDeeper": [
    { "platform": "platform_id", "title": "string", "description": "string", "url": "string or null" }
  ],
  "refinementQuestions": ["string", "string", "string"]
}`;
```

### 9.6 User Message Construction

```typescript
function buildUserMessage(input: LearningCoachRequest): string {
  const preferenceLabels: Record<string, string> = {
    listen: 'Listen & absorb — I learn best hearing concepts explained conversationally',
    read: 'Read & reflect — I prefer written depth, articles, guides, detailed walkthroughs',
    watch: 'Watch & follow — Show me someone doing it and I\'ll follow along',
    build: 'Build & experiment — Give me a sandbox and a challenge',
    talk: 'Talk it through — I learn by asking questions in a back-and-forth',
  };

  let message = `Generate a personalised learning pathway.

## LEARNER INPUT
- Level: ${input.level}
- Learning Objective: ${input.objective}
- Gap Description: "${input.gap}"
- Available Platforms: ${input.platforms.join(', ')}
- Learning Preferences: ${input.preferences.map(p => preferenceLabels[p] || p).join('; ')}`;

  if (input.refinement) {
    message += `

## REFINEMENT CONTEXT
This is a refinement of a previous pathway. The learner wants to improve it.

Previous pathway:
${input.refinement.previousPathway}

Answered questions:
${Object.entries(input.refinement.answers)
  .filter(([, v]) => v.trim())
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join('\n\n')}
${input.refinement.additionalContext ? `\nAdditional context: ${input.refinement.additionalContext}` : ''}

Generate a significantly improved pathway that addresses the refinement context. Generate new, deeper refinement questions.`;
  }

  return message;
}
```

### 9.7 API Handler Pattern

Follow the existing pattern from `api/enhance-prompt.ts` and `api/design-agent.ts`:

- OpenRouter API via `OPENROUTER_URL` with retry logic (`fetchWithRetry`)
- Model: `process.env.GEMINI_MODEL || 'google/gemini-2.0-flash-001'`
- `temperature: 0.7`
- `response_format: { type: 'json_object' }`
- JSON parsing with backtick stripping
- Error handling with retryable status codes (429, 500, 502, 503, 504)

---

## 10. Cohesive Deliverable

Per Toolkit Standard §4.4, the exported/copied/saved content is a single cohesive deliverable.

### 10.1 `buildFullPathway` Function

```typescript
function buildFullPathway(result: LearningCoachResponse): string {
  const steps = result.steps.map(s => {
    let stepMd = `## Step ${s.stepNumber}: ${s.platformName} — ${s.feature} (~${s.timeEstimate})\n\n`;
    stepMd += `${s.activity}\n\n`;
    if (s.prompt) {
      stepMd += `### Prompt\n\n\`\`\`\n${s.prompt}\n\`\`\`\n\n`;
    }
    stepMd += `### Instructions\n\n${s.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n`;
    return stepMd;
  }).join('\n---\n\n');

  return [
    `# Learning Pathway: ${selectedObjective}`,
    '',
    `> ${result.gapReflection}`,
    '',
    `*${result.approachSummary}*`,
    '',
    '---',
    '',
    steps,
  ].join('\n');
}
```

**Included:** Gap reflection, approach summary, all sequenced steps with prompts and instructions.

**Excluded:** Go Deeper recommendations (supplementary), refinement questions (internal to the tool), metadata footer.

---

## 11. Persistence & Save Model

### 11.1 Save to Artefacts

When the user clicks "Save to Library":

```typescript
const handleSaveToLibrary = async () => {
  if (!result || !user) return;
  const artefact = await createArtefactFromTool(user.id, {
    name: `Learning Pathway: ${selectedObjective}`,
    type: 'pathway',
    level: selectedLevel!,
    sourceTool: 'learning-coach',
    content: {
      result,
      inputs: {
        level: selectedLevel,
        objective: selectedObjective,
        gap: gapDescription,
        platforms: selectedPlatforms,
        preferences: selectedPreferences,
      },
      markdown: buildFullPathway(result),
    },
    preview: result.gapReflection,
  });
  if (artefact) {
    setSavedToLibrary(true);
    showToast('Pathway saved to your artefacts');
  }
};
```

### 11.2 Schema Migration Required

The `artefacts` table currently constrains `type` to: `'prompt', 'agent', 'workflow', 'dashboard', 'app_spec', 'build_guide', 'prd'`. Add `'pathway'` to the check constraint.

The `source_tool` column currently constrains to: `'prompt-playground', 'agent-builder', 'workflow-canvas', 'dashboard-designer', 'ai-app-evaluator'`. Add `'learning-coach'`.

```sql
-- Migration: Add pathway type and learning-coach source
ALTER TABLE artefacts DROP CONSTRAINT IF EXISTS artefacts_type_check;
ALTER TABLE artefacts ADD CONSTRAINT artefacts_type_check
  CHECK (type IN ('prompt', 'agent', 'workflow', 'dashboard', 'app_spec', 'build_guide', 'prd', 'pathway'));

ALTER TABLE artefacts DROP CONSTRAINT IF EXISTS artefacts_source_tool_check;
ALTER TABLE artefacts ADD CONSTRAINT artefacts_source_tool_check
  CHECK (source_tool IN (
    'prompt-playground', 'agent-builder', 'workflow-canvas',
    'dashboard-designer', 'ai-app-evaluator', 'learning-coach'
  ));
```

### 11.3 `upsertToolUsed` Call

On first successful generation in a session, call:

```typescript
upsertToolUsed(user.id, selectedLevel!);
```

This registers the tool usage for analytics.

---

## 12. CSS Animations

Include these in a `<style>` tag at the top of the component. Reuse existing animations from the Toolkit Standard:

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
@keyframes ppSlideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}
```

---

## 13. Responsive Behaviour

### Desktop (1200px+)

- Full layout as described
- Two-column grids for Row 1, Row 3
- Step cards at full width

### Tablet (768–1199px)

- Row 1 (Level + Objective) stays two-column but with tighter gap
- Row 3 (Platforms + Preferences) stacks to single column
- Overview strip steps stack vertically
- Go Deeper recommendation cards stack vertically

### Mobile (<768px)

- Everything single column
- Level selector pills wrap to two rows
- Platform chips become single column list
- Preference pills become single column list
- Step cards remain full width (they already are)
- Top action row buttons stack

---

## 14. State Architecture Summary

```typescript
// ── Input state ──
const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
const [gapDescription, setGapDescription] = useState('');
const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

// ── Dynamic accent ──
const LEVEL_ACCENT = selectedLevel ? LEVEL_ACCENTS[selectedLevel].light : '#38B2AC';
const LEVEL_ACCENT_DARK = selectedLevel ? LEVEL_ACCENTS[selectedLevel].dark : '#1A7A76';

// ── Output state ──
const [result, setResult] = useState<LearningCoachResponse | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [isRefineLoading, setIsRefineLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [loadingStep, setLoadingStep] = useState(0);

// ── Output interaction state ──
const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0])); // First step expanded
const [viewMode, setViewMode] = useState<'cards' | 'markdown'>('cards');
const [visibleBlocks, setVisibleBlocks] = useState(0);

// ── Action state ──
const [copied, setCopied] = useState(false);
const [savedToLibrary, setSavedToLibrary] = useState(false);
const [toastMessage, setToastMessage] = useState<string | null>(null);

// ── Refinement state ──
const [refineExpanded, setRefineExpanded] = useState(false);
const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
const [additionalContext, setAdditionalContext] = useState('');
const [refinementCount, setRefinementCount] = useState(0);

// ── Derived ──
const step1Done = !!(selectedLevel && selectedObjective && gapDescription.length > 20 && selectedPlatforms.length > 0 && selectedPreferences.length > 0);
const step2Done = !!result;
```

---

## 15. File Structure

### New Files

| File | Purpose |
|------|---------|
| `components/app/toolkit/AppLearningCoach.tsx` | The main page component |
| `data/learningCoachContent.ts` | Platform feature registry, level objectives, learning preferences, example chips |
| `api/generate-learning-pathway.ts` | Serverless API endpoint (replaces or extends existing `api/generate-pathway.ts` which serves the onboarding pathway) |
| `constants/learningCoachSystemPrompt.ts` | The three-layer system prompt |

### Modified Files

| File | Change |
|------|--------|
| `App.tsx` | Add lazy import + route: `path="toolkit/learning-coach"` |
| `components/app/AppSidebar.tsx` | Add "Learning Coach" nav item with `GraduationCap` icon |
| `supabase/schema.sql` | Add `'pathway'` to artefacts type check, `'learning-coach'` to source_tool check |
| `lib/database.ts` | Update `ArtefactType` union type to include `'pathway'` |

### Shared Components Used (No Modifications)

| Component | From |
|-----------|------|
| `CollapsibleOutputCard` | `components/app/toolkit/CollapsibleOutputCard.tsx` |
| `OutputActionsPanel` | `components/app/workflow/OutputActionsPanel.tsx` |
| `Toast` | `components/app/Toast.tsx` |

---

## 16. Checklist

### Structure & Layout
- [ ] Page title: plain text, 28px, weight 800, no emoji
- [ ] Description: 2 lines max, answers problem/function/outcome
- [ ] `ToolOverview` strip with 3 steps + outcome bar
- [ ] All inputs visible on single page, no wizard
- [ ] Output zone shows `StepPlaceholder` before generation
- [ ] Animated `StepConnector` between input and output StepCards

### Theming & Dynamic Accent
- [ ] Accent colour dynamically changes based on selected level
- [ ] Default accent (teal) shown before level selection
- [ ] All accent-dependent elements update on level change: Overview badges, StepConnectors, step badges, prompt box borders, pathway header, approach summary border
- [ ] No hardcoded teal where level accent should be used

### Input Zone
- [ ] Level pills with dynamic accent colouring
- [ ] Objective chips dynamically populated from `LEVEL_OBJECTIVES`
- [ ] Auto-growing textarea with example chips (level-specific)
- [ ] Platform multi-select as checkbox chips with icons
- [ ] Preference multi-select as vertical pills with descriptions
- [ ] Generate button disabled until all inputs complete
- [ ] Draft persistence to localStorage

### Output & Deliverable
- [ ] Pathway Header with level badge, objective, gap reflection
- [ ] Approach Summary in pull-quote style
- [ ] Sequenced step cards using `CollapsibleOutputCard`, first expanded
- [ ] StepConnectors between step cards
- [ ] Prompt boxes using E-Learning §7 universal style
- [ ] Per-step copy buttons on prompts
- [ ] Go Deeper section (conditional)
- [ ] Cards / Markdown toggle
- [ ] Markdown view shows cohesive deliverable only

### Actions & Persistence
- [ ] Copy Full Pathway (primary button, named deliverable)
- [ ] Download .md with date-stamped filename
- [ ] Save to Library (accent button, `#5A67D8`)
- [ ] OutputActionsPanel between content and refinement card
- [ ] Start Over button in bottom nav row
- [ ] `upsertToolUsed()` on first generation
- [ ] Draft cleared after successful generation
- [ ] Toast notifications for all user actions

### Loading & Progress
- [ ] `ProcessingProgress` indicator with Learning Coach-specific steps
- [ ] Separate step labels for initial generation and refinement
- [ ] Front-loaded timing with open-ended buffer on last step
- [ ] Completion jump → 400ms hold → reveal output

### Refinement
- [ ] AI generates 3-5 task-specific refinement questions
- [ ] Combined caveat + refinement card, collapsed by default
- [ ] Refine button disabled until at least one input provided
- [ ] Refinement counter badge
- [ ] Separate refinement loading steps in ProcessingProgress

### Routing & Integration
- [ ] Route registered in `App.tsx` as `/app/toolkit/learning-coach`
- [ ] Sidebar nav item added with `GraduationCap` icon
- [ ] Schema migration for `'pathway'` type and `'learning-coach'` source_tool
- [ ] `ArtefactType` updated in `lib/database.ts`

---

## 17. Anti-Patterns (What NOT to Do)

- **No wizard / stepped flow for inputs** — all inputs visible at once on a single page
- **No history panel on this page** — saved pathways surface in My Artefacts
- **No generic "Copy All" button** — the copy button is labelled "Copy Full Pathway"
- **No generic refinement questions** — questions must be specific to the learner's gap
- **No generic spinners** — use ProcessingProgress with Learning Coach-specific steps
- **No hardcoded platform-specific prompts in the frontend** — all prompt generation happens server-side via the AI
- **No specific video URLs in YouTube steps** — recommend content types and channel archetypes, not URLs that will go stale
- **No marketing language** — this is a workspace, not a landing page
- **No emoji in the page title** — "Learning Coach", not "🎓 Learning Coach"
- **No static accent colour** — the accent must change dynamically based on the selected level

---

*End of PRD-16.*
