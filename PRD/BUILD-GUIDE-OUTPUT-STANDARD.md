# Build Guide Output Standard

> This document defines the exact structure, layout, component hierarchy, and interaction patterns for the **Build Guide output view** — the final step of any toolkit tool that generates a Build Guide deliverable. Use this as the single source of truth for how Build Guide output is rendered, styled, and interacted with.
>
> For the general toolkit page structure (step cards, connectors, locking, animations), refer to `TOOLKIT-PAGE-STANDARD.md`. This document covers **only** the output step content — everything that appears inside the final StepCard once the Build Guide has been generated.

---

## 1. Overview & Purpose

The Build Guide output is the primary deliverable of the Workflow Canvas tool (and any future tool that produces a Build Guide). It is a complete, platform-specific implementation document that guides the user from zero to a working automation.

The output view must accomplish three things:

1. **Immediate orientation** — the user understands what they got, what to do next, and how long it will take
2. **Deep reference** — every step, credential, and test case is accessible with full detail on demand
3. **Frictionless export** — the user can copy, download (.md or .doc), save to library, and refine — all without leaving the page

---

## 2. Component Hierarchy (Top to Bottom)

The Build Guide output step renders the following blocks in strict order. Each block is described in detail in its own section below.

```
StepCard (stepNumber=4, title="Download your Build Guide", collapsed=false)
│
├── 2.1  Loading State (ProcessingProgress) — shown while API call is in flight
│
└── Generated Output (shown once buildGuideMarkdown is available)
    │
    ├── 2.2  Next Step Banner
    ├── 2.3  Top Action Row (View Toggle + Copy/Download/Save buttons)
    ├── 2.4  Build Guide Content (Cards view OR Markdown view)
    ├── 2.5  Output Actions Panel (Download .md / Download .doc / Save to Library)
    ├── 2.6  Refinement Section (caveat + expandable refinement questions)
    └── 2.7  Bottom Navigation Row (Back to previous step / Start Over)
```

---

## 3. Step Card Configuration

The Build Guide output always lives in the **final step** of the tool. Its StepCard props are:

| Prop | Value | Rationale |
|------|-------|-----------|
| `stepNumber` | Final step number (e.g., `4` for Workflow Canvas) | Sequential from prior steps |
| `title` | `"Download your Build Guide"` | Consistent deliverable naming |
| `subtitle` | `"Your complete, platform-specific implementation document."` | Sets expectation |
| `done` | `!!buildGuideMarkdown` | True once the guide is generated |
| `collapsed` | `false` | Final output step is never collapsed (per Toolkit Standard §1.3) |
| `locked` | `!buildGuideMarkdown && !exportLoading` | Unlocks when loading starts or guide exists |
| `lockedMessage` | `"Complete Step N to generate your Build Guide"` | References the preceding step |

---

## 4. Loading State (§2.1)

While the Build Guide is being generated (or refined), the step shows a `ProcessingProgress` indicator. This is the **only** place loading indicators appear — the preceding step (e.g., "Choose the platform") collapses immediately when the user triggers generation.

### 4.1 Initial Generation Steps

Seven loading steps are displayed sequentially:

| # | Label | Delay from previous |
|---|-------|---------------------|
| 1 | Analysing your workflow nodes and connections… | 800ms |
| 2 | Translating to platform terminology… | 2000ms |
| 3 | Writing step-by-step configuration instructions… | 4000ms |
| 4 | Generating credential requirements… | 5000ms |
| 5 | Building test checklist… | 5000ms |
| 6 | Documenting edge cases… | 4500ms |
| 7 | Finalising your Build Guide… | Open-ended (stays spinning until API returns) |

**Total expected time:** 20–30 seconds.

### 4.2 Refinement Loading Steps

When the user refines an existing Build Guide, a different set of steps is shown:

| # | Label |
|---|-------|
| 1 | Processing your refinement context… |
| 2 | Re-evaluating workflow steps… |
| 3 | Updating configuration instructions… |
| 4 | Revising credential requirements… |
| 5 | Refreshing test checklist… |
| 6 | Applying quality checks… |
| 7 | Finalising refined Build Guide… |

Same delay timings as initial generation. The header text changes to `"Refining your Build Guide…"` and subtext remains `"This usually takes 20–30 seconds"`.

### 4.3 ProcessingProgress Component Spec

```
┌─────────────────────────────────────────────┐
│  Header (15px, bold, #1A202C)               │
│  Subtext (12px, #A0AEC0)                    │
│                                             │
│  ● Step 1 label            (completed)      │
│  ● Step 2 label            (completed)      │
│  ◌ Step 3 label            (active/spinning)│
│  ○ Step 4 label            (pending, 0.5)   │
│  ○ Step 5 label            (pending, 0.5)   │
│  ○ Step 6 label            (pending, 0.5)   │
│  ○ Step 7 label            (pending, 0.5)   │
│                                             │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  Progress bar        │
│                                3 of 7       │
└─────────────────────────────────────────────┘
```

- Container: `background: #FFFFFF`, `borderRadius: 14`, `border: 1px solid #E2E8F0`, `padding: 28px 32px`
- Completed step badge: `background: LEVEL_ACCENT`, checkmark icon
- Active step badge: spinning border animation (`ppSpin 0.7s linear infinite`)
- Pending steps: `opacity: 0.5`
- Progress bar: `background: #EDF2F7` track, `background: LEVEL_ACCENT` fill, `height: 4px`
- Counter: `fontSize: 11`, `color: #A0AEC0`, right-aligned

### 4.4 Loading Placement Rule

**Critical rule:** Loading indicators belong inside the **output step** (the step that will display the result), NOT inside the step that triggered the action. When the user clicks "Generate Build Guide" in Step 3:

1. Step 3 sets `platformStepDone = true` → immediately collapses → shows "Done ✓"
2. Step 4 unlocks (`exportLoading = true` makes `locked` false)
3. Step 4 shows `ProcessingProgress` inside its children
4. When the API returns, `ProcessingProgress` is replaced by the generated output

This follows the Toolkit Page Standard §1.3 rule: "Loading indicators belong inside the next step's children, not the step that triggered the action."

---

## 5. Next Step Banner (§2.2)

The first element inside the generated output. Uses the `NextStepBanner` shared component.

### 5.1 Layout

```
┌─────────────────────────────────────────────┐
│ → What's next                               │
│   Download your Build Guide and follow the  │
│   steps in your chosen platform. Use the    │
│   test checklist to verify each step.       │
└─────────────────────────────────────────────┘
```

### 5.2 Styling

| Property | Value |
|----------|-------|
| Background | `${LEVEL_ACCENT}15` (accent at 15% opacity) |
| Left border | `4px solid ${LEVEL_ACCENT_DARK}` |
| Border radius | `10px` |
| Padding | `14px 18px` |
| Margin bottom | `16px` |
| Icon | `ArrowRight`, size 16, color `LEVEL_ACCENT_DARK` |
| Title | `"What's next"`, fontSize 13, fontWeight 700, color `#1A202C` |
| Body text | fontSize 13, fontWeight 400, color `#4A5568`, lineHeight 1.6 |

### 5.3 Content Guidelines

The banner text should:
- Tell the user the immediate next action (download/follow steps)
- Reference the platform they chose
- Mention the test checklist as a verification tool
- Be 1–2 sentences maximum

---

## 6. Top Action Row (§2.3)

A flex row positioned between the Next Step Banner and the Build Guide content. Contains the view toggle on the left and action buttons on the right.

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Cards] [Markdown]  ⓘ        [Copy Build Guide] [↓.md] [📚]│
└─────────────────────────────────────────────────────────────┘
```

### 6.2 View Toggle

A pill-style toggle allowing the user to switch between Cards view and Markdown view.

| Property | Value |
|----------|-------|
| Container | `display: inline-flex`, `background: #F7FAFC`, `borderRadius: 10`, `border: 1px solid #E2E8F0` |
| "Cards" button | Active: `background: #1A202C`, `color: #FFFFFF` / Inactive: `background: transparent`, `color: #718096` |
| "Markdown" button | Active: `background: #2B6CB0`, `color: #FFFFFF` (blue highlight) / Inactive: same as Cards inactive |
| Icons | `Eye` (13px) for Cards, `Code` (13px) for Markdown |
| Font | fontSize 12, fontWeight 600, DM Sans |

**Default view:** Cards.

**Info tooltip** (22px circle, `ℹ` icon) positioned next to the toggle:
- Text: `"Markdown view shows the raw Build Guide ready to paste into any tool or docs system. Cards view provides an interactive breakdown of each section."`
- Tooltip: `background: #1A202C`, `color: #E2E8F0`, `borderRadius: 8`, `padding: 8px 12px`, `fontSize: 11`, `width: 240px`

### 6.3 Action Buttons

Three `ActionBtn` components in a flex row (`gap: 8`):

| Button | Style | Label | Behavior |
|--------|-------|-------|----------|
| Copy Build Guide | `primary` (teal) | `"Copy Build Guide"` → `"Copied!"` | Copies full markdown to clipboard. Shows checkmark for 2s. |
| Download (.md) | default (white border) | `"Download (.md)"` | Downloads markdown as `build-guide-YYYY-MM-DD.md` |
| Save to Library | `accent` (indigo `#5A67D8`) | `"Save to Library"` → `"Saved!"` | Calls `handleSaveToArtefacts`. Disabled after save. |

**ActionBtn shared spec** (from Toolkit Standard §3.8):
- `padding: 8px 16px`, `borderRadius: 24`, `fontSize: 12`, `fontWeight: 600`
- Primary: `background: #38B2AC`, `color: #FFFFFF`, no border
- Accent: `background: #5A67D8`, `color: #FFFFFF`, no border
- Default: `background: #FFFFFF`, `color: #4A5568`, `border: 1px solid #E2E8F0`
- Hover: `opacity: 0.85`
- Disabled: `opacity: 0.5`, `cursor: not-allowed`

---

## 7. Build Guide Content — Cards View (§2.4a)

The Cards view is the default and primary way users interact with the Build Guide. It uses the `ExportSummaryCard` component, which renders a structured, interactive breakdown of the Build Guide content.

### 7.1 Overall Card Container

```
┌─────────────────────────────────────────────────────────────┐
│  📄 BUILD GUIDE                              [platform pill]│
│                                                             │
│  Workflow Name (h2)                                         │
│  Overview paragraph                                         │
│                                                             │
│  [N steps] [complexity] [Est. time to build]                │
│                                                             │
│  ── Steps Section ──────────────────────────────────────    │
│  ── What You'll Need Section ───────────────────────────    │
│  ── Test Checklist Section ─────────────────────────────    │
│  ── Want Full Guide? CTA ───────────────────────────────    │
└─────────────────────────────────────────────────────────────┘
```

- Container: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 16`, `padding: 28px 32px`

### 7.2 Header Row

| Element | Spec |
|---------|------|
| Icon | `FileText` (20px), color `LEVEL_ACCENT` |
| Label | `"BUILD GUIDE"`, fontSize 11, fontWeight 700, color `LEVEL_ACCENT`, uppercase, letterSpacing `2px` |
| Platform pill (right-aligned) | `background: #E6FFFA`, `color: #1A7A76`, `border: 1px solid #38B2AC44`, `borderRadius: 99`, `padding: 3px 12px`, fontSize 11, fontWeight 700 |

### 7.3 Title & Overview

| Element | Spec |
|---------|------|
| Workflow name | `h2`, fontSize 22, fontWeight 800, color `#1A202C`, margin `0 0 12px 0` |
| Overview text | `p`, fontSize 14, color `#4A5568`, lineHeight 1.7, margin `0 0 20px 0` |

The overview is extracted from the markdown using `extractOverview()` — it pulls the paragraph under `**What this workflow does**`.

### 7.4 Stat Pills

A flex row of pill badges summarizing key metrics:

| Pill | Example |
|------|---------|
| Step count | `"6 steps"` |
| Complexity | `"Moderate"` |
| Estimated build time | `"Est. 45–60 minutes to build"` |

Pill style: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 99`, `padding: 4px 12px`, fontSize 12, fontWeight 600, color `#4A5568`.

### 7.5 Steps Section

Shows all workflow steps as expandable accordion items.

**Section header:** `"N steps in this workflow"` — fontSize 14, fontWeight 700, color `#1A202C`.

**Each step row:**

```
┌─────────────────────────────────────────────────────────────┐
│  ● Step N   Step Name                                   ▾  │
└─────────────────────────────────────────────────────────────┘
```

| Element | Collapsed State | Expanded State |
|---------|----------------|----------------|
| Container | `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 10` | `background: #F0FFF4`, `border: 1px solid #C6F6D5`, `borderRadius: 10px 10px 0 0` |
| Step badge | 22px circle, `background: LEVEL_ACCENT`, `color: #FFFFFF`, fontSize 11, fontWeight 700 | Same |
| Step name | fontSize 13, fontWeight 600, color `#1A202C` | Same |
| Chevron | `ChevronDown` (16px, `#718096`) | `ChevronUp` (16px, `#718096`) |
| Padding | `10px 14px` | Same |
| Gap between items | `6px` | Same |

**Expanded step detail panel:**

```
┌─────────────────────────────────────────────────────────────┐
│  **What happens:** [sentence]                               │
│                                                             │
│  **Configure:**                                             │
│  [instructions with inline code, bold labels, etc.]         │
│                                                             │
│  ┌─── Code Block ─────────────────────────── [Copy] ──┐    │
│  │  {                                                  │    │
│  │    "system_prompt": "...",                           │    │
│  │    "output_schema": { ... }                         │    │
│  │  }                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  > 💡 Tip: [contextual advice]                              │
│  > ⚠️ Warning: [critical note]                              │
└─────────────────────────────────────────────────────────────┘
```

- Panel: `padding: 16px 18px`, `background: #FAFFFE`, `border: 1px solid #C6F6D5`, `borderTop: none`, `borderRadius: 0 0 10px 10px`
- Content is parsed from the raw markdown for each step using `getStepDetail(stepNumber)`

**Content rendering rules (via `renderStepContent`):**

| Markdown pattern | Rendered as |
|-----------------|-------------|
| ` ``` ` fenced code | `CodeBlockWithCopy` — dark code block with copy button |
| `{ ... }` unfenced JSON | `CodeBlockWithCopy` (auto-detected) |
| `{{ $json... }}` expressions | `CodeBlockWithCopy` (auto-detected) |
| `> text` blockquote | Styled callout with left border (teal for 💡, amber for ⚠️) |
| `**bold** text` | Bold label paragraph |
| Regular text | Standard paragraph, fontSize 13, color `#4A5568` |
| Inline `` `code` `` | Pink inline code (`#D53F8C`) with grey background |
| Inline `**bold**` | Strong, color `#1A202C` |

**CodeBlockWithCopy spec:**

| Property | Value |
|----------|-------|
| Container | `position: relative`, `margin: 8px 0` |
| Code block | `background: #1A202C`, `color: #E2E8F0`, `padding: 14px 18px`, `borderRadius: 8` |
| Font | `'JetBrains Mono', 'Fira Code', Consolas, monospace`, fontSize 12, lineHeight 1.6 |
| Copy button | `position: absolute`, `top: 8px`, `right: 8px`, `borderRadius: 6`, `padding: 4px 8px` |
| Copy idle | `background: rgba(255,255,255,0.1)`, `border: 1px solid rgba(255,255,255,0.15)` |
| Copy success | `background: #38B2AC`, label changes to "Copied" with checkmark, reverts after 2s |

### 7.6 What You'll Need (Credentials)

Shows all credentials/prerequisites as a responsive grid of cards.

**Section header:** `"What you'll need"` — fontSize 14, fontWeight 700, color `#1A202C`.

**Grid:** `gridTemplateColumns: repeat(auto-fill, minmax(220px, 1fr))`, `gap: 10`.

**Each credential card:**

```
┌──────────────────────────────┐
│  API Key Name (bold)         │
│  Why it's needed (grey)      │
│  Where to find it (muted)    │
│  Used in: Step Name          │
└──────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 14px 16px` |
| Credential name | fontSize 13, fontWeight 700, color `#1A202C` |
| Why text | fontSize 12, color `#4A5568`, lineHeight 1.5 |
| Where to find | fontSize 12, color `#718096`, lineHeight 1.5 |
| Used in | fontSize 11, color `#A0AEC0`, marginTop 6 |

The "why" text is generated by `inferCredentialPurpose()` — it infers a human-readable explanation based on the credential type (API key, OAuth, webhook URL, etc.).

### 7.7 Test Checklist

Interactive checklist with checkboxes that the user can tick off.

**Section header:** `"Test checklist"` — fontSize 14, fontWeight 700, color `#1A202C`.

**Each checklist item:**

```
☐  Verify webhook fires on form submit
☑  Check AI output contains expected JSON fields  (struck through)
```

| Element | Unchecked | Checked |
|---------|-----------|---------|
| Checkbox | 18x18px, `borderRadius: 4`, `border: 1.5px solid #E2E8F0`, `background: #FFFFFF` | `border: 1.5px solid LEVEL_ACCENT`, `background: LEVEL_ACCENT`, white checkmark SVG |
| Label | fontSize 13, color `#4A5568` | fontSize 13, color `#A0AEC0`, `textDecoration: line-through` |

**Progress counter:** `"N / M complete"` — fontSize 11, color `#718096`, marginTop 10.

### 7.8 "Want the Full Guide?" CTA

A subtle banner at the bottom of the card directing the user to the download options below.

```
┌─────────────────────────────────────────────────────────────┐
│  ↓  Want the full guide?                                    │
│     Download as a Markdown or Word document using the       │
│     buttons below.                                          │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Container | `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: 16px 20px` |
| Layout | flex row, `alignItems: center`, `gap: 12` |
| Icon | `Download` (18px, `#718096`) |
| Title | fontSize 13, fontWeight 600, color `#4A5568` |
| Subtitle | fontSize 12, color `#A0AEC0`, marginTop 2 |

---

## 8. Build Guide Content — Markdown View (§2.4b)

The raw markdown output displayed in a dark code-style container.

### 8.1 Styling

| Property | Value |
|----------|-------|
| Container | `background: #1A202C`, `borderRadius: 12`, `padding: 22px 24px` |
| Font | `'JetBrains Mono', 'Fira Code', monospace`, fontSize 13, lineHeight 1.8 |
| Color | `#E2E8F0` |
| White space | `pre-wrap` |
| Word break | `break-word` |
| Max height | `600px` with `overflow: auto` |

### 8.2 Content

Shows the complete `buildGuideMarkdown` string as-is — no parsing, no rendering. This is the raw deliverable the user would paste into Notion, VS Code, or any other tool.

### 8.3 Animation

Both Cards and Markdown views use the staggered block animation:
- `opacity: visibleBlocks >= 1 ? 1 : 0`
- `transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)'`
- `transition: opacity 0.3s, transform 0.3s`

---

## 9. Output Actions Panel (§2.5)

Uses the shared `OutputActionsPanel` component. Provides prominent download and save options below the Build Guide content.

### 9.1 Layout

```
┌──────────────────────────┬──────────────────────────┐
│  ↓ Download as Markdown  │  ↓ Download as Word      │
│                          │                          │
│  Opens in Notion, VS     │  Opens in Microsoft Word,│
│  Code, or any text       │  Google Docs, or Pages.  │
│  editor.                 │  Easy to share.          │
│                          │                          │
│  [Download .md]          │  [Download .doc]         │
└──────────────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  📖 Save to your Shared Library              [Save →]       │
│     Your Build Guide will be saved and accessible           │
│     from your library.                                      │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Download Markdown Card

| Property | Value |
|----------|-------|
| Container | `background: #E6FFFA`, `border: 1.5px solid #38B2AC44`, `borderRadius: 14`, `padding: 20px 24px` |
| Icon | `Download` (20px, `#38B2AC`) |
| Title | fontSize 15, fontWeight 700, color `#1A202C` |
| Description | fontSize 12, color `#718096` |
| Button | Full width, `background: #38B2AC`, `color: #FFFFFF`, `borderRadius: 99`, `padding: 10px 0`, fontSize 13, fontWeight 700 |
| Filename | `{slugified-workflow-name}-build-guide.md` |

### 9.3 Download Word Card

| Property | Value |
|----------|-------|
| Container | `background: #EBF8FF`, `border: 1.5px solid #2B6CB044`, `borderRadius: 14`, `padding: 20px 24px` |
| Icon | `Download` (20px, `#2B6CB0`) |
| Button | Full width, `background: #2B6CB0`, `color: #FFFFFF` |
| Filename | `{slugified-workflow-name}-build-guide.doc` |

**Word document format:** HTML-based `.doc` file using `markdownToWordHtml()` converter. Includes:
- OXYGY branded header (logo treatment + "AI Centre of Excellence")
- Teal gradient divider
- "WORKFLOW BUILD GUIDE" label badge
- Date stamp
- Full content with styled headings, tables, code blocks, blockquotes, checklists
- OXYGY branded footer

### 9.4 Save to Library Banner

| Property | Value |
|----------|-------|
| Container | `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 16px 24px` |
| Layout | flex row, `justifyContent: space-between`, `gap: 16` |
| Icon | `BookOpen` (20px, `#38B2AC`) |
| Title | fontSize 14, fontWeight 600, color `#1A202C` |
| Description | fontSize 12, color `#718096` |
| Button | `background: #38B2AC` (active) / `#E2E8F0` (saved), `borderRadius: 99`, `padding: 10px 20px` |
| Button label | `"Save to Library →"` / `"✓ Saved"` |

### 9.5 Animation

The Output Actions Panel animates in via the staggered block system:
- `opacity: visibleBlocks >= 2 ? 1 : 0`
- Same `translateY` transition as the content block

### 9.6 Download Content Requirements

Both the `.md` and `.doc` downloads must include the **complete** Build Guide content:
- Workflow overview and metadata
- All credential/prerequisite information
- Every step with full configuration instructions and code blocks
- All prompts (system prompt, user prompt, structured output parser) in copyable format
- Test checklist
- Known edge cases
- The user's original task description and tools/systems context

---

## 10. Refinement Section (§2.6)

A collapsible card below the Output Actions Panel that allows the user to provide additional context and regenerate the Build Guide.

### 10.1 Collapsed State

```
┌─────────────────────────────────────────────────────────────┐
│  ⓘ  This Build Guide is a strong starting point, but       │
│     every environment is different. Test each step in       │
│     your actual [platform] workspace, and adjust field      │
│     mappings or credentials as needed.                      │
│                                                             │
│     Would you like to refine this Build Guide further?  ▾   │
│                                            [Refinement #N]  │
└─────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Container | `background: #F7FAFC`, `borderRadius: 14`, `border: 1px solid #E2E8F0`, `padding: 20px 24px` |
| Icon | `Info` (16px, `#A0AEC0`) |
| Caveat text | fontSize 13, color `#718096`, lineHeight 1.6 |
| Expand CTA | fontSize 13, fontWeight 600, color `LEVEL_ACCENT_DARK`, hover → `LEVEL_ACCENT` |
| Refinement badge | `background: LEVEL_ACCENT`, `color: LEVEL_ACCENT_DARK`, `borderRadius: 20`, `padding: 2px 10px`, fontSize 11, fontWeight 600 |

### 10.2 Expanded State

```
┌─────────────────────────────────────────────────────────────┐
│  ⓘ  [caveat text]                                          │
│  ─────────────────────────────────────────────────────      │
│  REFINE YOUR BUILD GUIDE                [Refinement #N] ✕   │
│  Answer any of these to add context and get a more          │
│  targeted Build Guide. You don't need to answer all.        │
│                                                             │
│  Q1: Are there specific error scenarios for this            │
│      [platform] workflow you want the guide to address?     │
│  [text input]                                               │
│                                                             │
│  Q2: Should any steps include alternative approaches        │
│      or fallback options?                                   │
│  [text input]                                               │
│                                                             │
│  Q3: Are there team-specific naming conventions or          │
│      folder structures to follow?                           │
│  [text input]                                               │
│                                                             │
│  Q4: What level of detail do you need for the [platform]    │
│      configuration — beginner-friendly or advanced?         │
│  [text input]                                               │
│                                                             │
│  Q5: Are there any compliance or security requirements      │
│      to document?                                           │
│  [text input]                                               │
│                                                             │
│  Anything else to add?                                      │
│  [textarea]                                                 │
│                                                             │
│  [→ Refine Build Guide]                                     │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 Refinement Questions

Five platform-aware questions are generated dynamically:

1. `"Are there specific error scenarios for this {platform} workflow you want the guide to address?"`
2. `"Should any steps include alternative approaches or fallback options?"`
3. `"Are there team-specific naming conventions or folder structures to follow?"`
4. `"What level of detail do you need for the {platform} configuration — beginner-friendly or advanced?"`
5. `"Are there any compliance or security requirements to document?"`

Each question has a single-line `<input>` with placeholder `"Your answer…"`.

The "Anything else to add?" field is a `<textarea>` with `minHeight: 60px`.

### 10.4 Refinement Input Styling

| Property | Value |
|----------|-------|
| Label | fontSize 13, fontWeight 600, color `#2D3748` |
| Input/Textarea | `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: 10px 14px`, fontSize 13, `background: #FFFFFF` |
| Focus state | `borderColor: LEVEL_ACCENT_DARK` |
| Gap between questions | `marginBottom: 16` |

### 10.5 Refine Button

Uses `ActionBtn` with `primary` style. Label: `"Refine Build Guide"` (idle) / `"Refining…"` (loading with spinner). Disabled when no inputs have content or when loading.

### 10.6 Refinement Behavior

When the user clicks "Refine Build Guide":
1. `isRefineLoading = true`, `exportLoading = true`
2. Refinement answers + additional context are assembled into a refinement message
3. The existing `buildGuideIntermediate` is enriched with the refinement context
4. A new API call is made to `/api/generate-build-guide` with the enriched intermediate
5. On success: `buildGuideMarkdown` is updated, `refinementCount` increments, inputs are cleared
6. The entire Build Guide output re-renders with the new content
7. The ProcessingProgress loading indicator shows in Step 4 during generation (same as initial)

### 10.7 Animation

The refinement section animates in as the third staggered block:
- `opacity: visibleBlocks >= 3 ? 1 : 0`
- `animation: ppSlideDown 0.3s ease-out` when expanding

---

## 11. Bottom Navigation Row (§2.7)

The final element in the output step. Provides navigation back to prior steps or a full reset.

### 11.1 Layout

```
[← Back to Step 3]  [↺ Start Over]
```

### 11.2 Buttons

| Button | Icon | Label | Behavior |
|--------|------|-------|----------|
| Back to Step 3 | `ArrowLeft` (14px) | `"Back to Step 3"` | Clears build guide state, re-opens platform selector step |
| Start Over | `RotateCcw` (14px) | `"Start Over"` | Resets ALL state, scrolls to top |

Both use default `ActionBtn` style (white background, grey border).

### 11.3 "Back to Step 3" Reset Behavior

When the user clicks "Back to Step 3", the following state is reset:
- `buildGuideMarkdown = null`
- `buildGuideIntermediate = null`
- `platformStepDone = false` (re-opens Step 3)
- `savedToArtefacts = false`
- `exportLoading = false`
- `viewMode = 'cards'`
- `visibleBlocks = 0`
- `loadingStep = 0`
- `refinementAnswers = {}`
- `additionalContext = ''`
- `refinementCount = 0`
- `refineExpanded = false`

**Important:** `selectedPlatform` is NOT reset — the user's platform choice is preserved so they don't have to re-select it.

### 11.4 "Start Over" Reset Behavior

Resets everything — all step state, all inputs, all outputs. Calls `localStorage.removeItem(DRAFT_KEY)` and scrolls to top.

### 11.5 Styling

`display: flex`, `alignItems: center`, `gap: 8`, `marginTop: 20`, `flexWrap: wrap`.

---

## 12. Staggered Block Animation System

The output content uses a `visibleBlocks` counter to stagger the appearance of major sections.

### 12.1 Block Assignments

| Block # | Content |
|---------|---------|
| 1 | Build Guide content (Cards or Markdown view) |
| 2 | Output Actions Panel |
| 3+ | Refinement section |

### 12.2 Timing

Triggered when `buildGuideMarkdown` becomes non-null:
- `visibleBlocks` resets to 0
- Each block appears 80ms after the previous, starting at 150ms
- Total sections: `BUILD_GUIDE_SECTIONS.length + 2` (summary + sections + refinement)

### 12.3 Application

Each animated block wraps its content with:
```tsx
style={{
  opacity: visibleBlocks >= N ? 1 : 0,
  transform: visibleBlocks >= N ? 'translateY(0)' : 'translateY(8px)',
  transition: 'opacity 0.3s, transform 0.3s',
}}
```

---

## 13. Build Guide Markdown Structure

The AI-generated markdown follows a strict document structure defined in `constants/buildGuideSystemPrompt.ts`. Every Build Guide contains:

### 13.1 Document Sections

| Section | Heading | Content |
|---------|---------|---------|
| Title | `# Build Guide` / `## [Workflow Name]` | Document title |
| Overview | `**What this workflow does**` | Plain-language summary paragraph |
| Metadata | `**Complexity** ... **Estimated build time** ... **Steps**` | Inline stat badges |
| Prerequisites | `## Before You Start` | Credential table + accounts to connect |
| Workflow Steps | `## The Workflow` / `### Step N — [Name]` | Per-step instructions with code blocks |
| Test Checklist | `## Test Checklist` | Checkbox items (`- [ ] item`) |
| Edge Cases | `## Known Edge Cases` | Named failure modes with descriptions |

### 13.2 Extraction Functions

The Cards view extracts structured data from the raw markdown:

| Function | Extracts | Regex/Pattern |
|----------|----------|---------------|
| `extractOverview(md)` | Overview paragraph | Content between `**What this workflow does**` and next `**` or `---` |
| `extractStepCount(md)` | Number of steps | Count of `### Step \d+` headings |
| `extractBuildTime(md)` | Estimated time | Content of `` `[value]` `` after `**Estimated build time**` |
| `extractCredentials(md)` | Credential table rows | Table rows in `## Before You Start` section |
| `extractSteps(md)` | Step names and numbers | `### Step (\d+) — (.+)` matches |
| `extractTestChecklist(md)` | Checklist items | `- [ ] (.+)` lines in `## Test Checklist` section |
| `getStepDetail(stepNumber)` | Full step content | Content between `### Step N` and next `### Step` or `## ` |
| `inferCredentialPurpose(what, usedIn)` | Human-readable "why" text | Pattern matching on credential name keywords |

### 13.3 Platform Vocabulary

The Build Guide uses platform-correct terminology throughout. Supported platforms and their vocabulary:

| Concept | n8n | Zapier | Make | Power Automate | AI Coding Agent |
|---------|-----|--------|------|----------------|-----------------|
| Workflow container | Workflow | Zap | Scenario | Flow | Script / Agent |
| Single unit | Node | Step | Module | Action | Function / Tool call |
| Start event | Trigger node | Trigger | Trigger module | Trigger | Entry point |
| Data reference | `{{ $json.field }}` | `{{field}}` | `{{1.field}}` | `@{field}` | `response.field` |

### 13.4 AI Model Agnosticism Rule

The Build Guide NEVER mentions specific AI providers, model names, or provider-branded API keys. All references use generic terms:
- "the AI model approved by your organisation" (not "Claude" or "GPT-4")
- "Your LLM API key" (not "OpenAI API key")
- "LLM Chat Model node" (not "Anthropic Chat Model")

---

## 14. State Variables Reference

All state variables involved in the Build Guide output:

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `buildGuideMarkdown` | `string \| null` | `null` | The generated markdown content |
| `buildGuideIntermediate` | `WorkflowIntermediate \| null` | `null` | Structured intermediate data passed to the API |
| `exportLoading` | `boolean` | `false` | Whether the API call is in flight |
| `platformStepDone` | `boolean` | `false` | Whether the platform has been selected and generation triggered |
| `selectedPlatform` | `string \| null` | `null` | The chosen automation platform |
| `viewMode` | `'cards' \| 'markdown'` | `'cards'` | Current view toggle state |
| `visibleBlocks` | `number` | `0` | Counter for staggered block animation |
| `loadingStep` | `number` | `0` | Current step in ProcessingProgress |
| `isRefineLoading` | `boolean` | `false` | Whether a refinement (vs initial) generation is in progress |
| `copied` | `boolean` | `false` | Whether "Copy Build Guide" was just clicked |
| `refinementAnswers` | `Record<number, string>` | `{}` | User's answers to refinement questions |
| `additionalContext` | `string` | `''` | Free-text refinement input |
| `refinementCount` | `number` | `0` | How many times the user has refined |
| `refineExpanded` | `boolean` | `false` | Whether the refinement section is expanded |
| `savedToArtefacts` | `boolean` | `false` | Whether the guide has been saved to library |

---

## 15. File & Component Reference

| Component | File | Purpose |
|-----------|------|---------|
| `ExportSummaryCard` | `components/app/workflow/ExportSummaryCard.tsx` | Cards view — structured Build Guide breakdown |
| `OutputActionsPanel` | `components/app/workflow/OutputActionsPanel.tsx` | Download .md / .doc + Save to Library |
| `NextStepBanner` | `components/app/toolkit/NextStepBanner.tsx` | "What's next" orientation banner |
| `ProcessingProgress` | Inline in `AppWorkflowCanvas.tsx` | 7-step loading indicator |
| `CodeBlockWithCopy` | Inside `ExportSummaryCard.tsx` | Dark code block with copy button |
| `BUILD_GUIDE_SYSTEM_PROMPT` | `constants/buildGuideSystemPrompt.ts` | AI system prompt defining document structure |
| `buildIntermediate()` | `utils/assembleN8nWorkflow.ts` | Assembles structured intermediate data |

---

## 16. Checklist for Building a Build Guide Output

Use this when implementing or auditing a Build Guide output step:

- [ ] StepCard is the final step, `collapsed={false}`, `locked` until loading or guide exists
- [ ] ProcessingProgress shows 7 steps with correct labels and timing
- [ ] Loading shows ONLY in the output step, not in the triggering step
- [ ] NextStepBanner appears as the first element after loading completes
- [ ] View toggle defaults to Cards, Markdown button uses blue highlight
- [ ] Top row has Copy Build Guide (teal), Download .md (white), Save to Library (indigo)
- [ ] Cards view shows: header + title + overview + stat pills + steps + credentials + test checklist + CTA
- [ ] Each step is expandable with full detail, code blocks have copy buttons
- [ ] Markdown view shows raw markdown in dark container, monospace font
- [ ] OutputActionsPanel provides Download .md, Download .doc, Save to Library
- [ ] Word download includes OXYGY branding, proper HTML formatting
- [ ] Refinement section starts collapsed with caveat text
- [ ] Five platform-aware refinement questions + free-text area
- [ ] Refinement triggers re-generation with enriched context
- [ ] Bottom navigation has "Back to Step 3" (preserves platform) and "Start Over" (full reset)
- [ ] All animations use staggered `visibleBlocks` system
- [ ] DM Sans font throughout, monospace for code blocks only
- [ ] All accent colors use `LEVEL_ACCENT` / `LEVEL_ACCENT_DARK` constants
