# PRD-07 v3: Workflow Canvas — Export Redesign & Feedback Loop Update

**Status:** Ready for implementation
**Replaces:** Section 7 (Export Card) and Section 8 (JSON Generation) from PRD-07 v2
**All other sections of PRD-07 v2 remain unchanged**
**Route:** `/app/toolkit/workflow-canvas`

---

## Overview of Changes in This PRD

Two discrete changes to the Workflow Canvas tool:

**Change 1 — Feedback Loop Addition (Design Myself path)**
When the user is on the design-myself path and the AI returns a review, the user can now push back on individual feedback items before deciding to act on them or dismiss them. The AI can be wrong. The user needs a way to say so.

**Change 2 — Export Redesign (both paths)**
The JSON download is replaced entirely. After approving the workflow, the user selects their automation platform, the app generates a structured Build Guide, and presents a summary card in-app with three output options: download `.md`, copy for AI agent, and share link. The full document is never rendered in full inside the app.

---

# CHANGE 1: Feedback Loop Addition

## Affected section
Step 2 — Design Myself path, AI Feedback interaction (PRD-07 v2, Section 5: `ApprovalBanner` and feedback behaviour)

## Current behaviour
User clicks `Get AI Feedback →`. AI returns a list of issues — blocking and advisory — rendered as annotation chips below each relevant node. If no blocking issues remain, `Approve & Export →` becomes active.

## New behaviour
After AI feedback renders, each feedback item now has two inline actions: **Apply** and **Disagree**. The user can engage with each note individually before deciding to approve.

---

## New Component: `FeedbackItemRow`

Replaces the simple annotation chip on the design-myself path.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ [!] severity badge   Node name — feedback message       │
│                                                         │
│ [Apply suggestion]   [I disagree →]                     │
└─────────────────────────────────────────────────────────┘
```

### Properties
- `nodeId` — which node this feedback applies to
- `severity` — `blocking` | `advisory`
- `message` — the AI's feedback text
- `status` — `pending` | `applied` | `disputed` | `resolved`
- `disputeText` — user's counter-argument (if disputed)
- `aiResolution` — AI's response to the dispute (if resolved)

### States

**Pending (default)**
- Background: blocking → `#FFFFF0`, border `#D69E2E44` / advisory → `#F7FAFC`, border `#E2E8F0`
- Severity badge: blocking → amber pill `#D69E2E` / advisory → grey pill `#A0AEC0`
- Two buttons below the message text:
  - `Apply suggestion` — secondary style, `#4A5568` text, `1px solid #E2E8F0`
  - `I disagree →` — ghost style, `#718096` text, no border, arrow icon

**Applied**
- Background: `#F0FFF4`, border `#9AE6B4`
- Left border: 4px solid `#48BB78`
- Badge replaced with `✓ Applied` in green `#38A169`
- Buttons hidden
- Node card above updates to reflect the applied change

**Disputed — input open**
- When user clicks `I disagree →`: an inline textarea expands below the two buttons
- Textarea placeholder: `Tell the AI why you disagree or what context it's missing…`
- Textarea: 2 rows, auto-resize, `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 8px`
- Below textarea: `Send →` button (teal, pill, 12px) + `Cancel` (ghost)
- Iteration label above textarea: `Responding to AI feedback`

**Disputed — awaiting AI response**
- Textarea replaced with loading state: spinner + `AI is reconsidering…`

**Resolved — AI concedes**
- Background: `#F0FFF4`, border `#9AE6B4`
- AI response text renders below original message in teal-tinted box: `#E6FFFA` bg
- AI response prefixed with: `AI response:` — 11px, 700, `#1A7A76`
- Badge: `✓ Resolved` green
- The original blocking/advisory status is cleared — this item no longer blocks approval

**Resolved — AI maintains position**
- Background: `#FFFFF0`, border `#D69E2E44`
- AI response renders in amber-tinted box: `#FFFBEB` bg
- AI response prefixed with: `AI maintains:` — 11px, 700, `#D69E2E`
- Badge remains blocking/advisory
- Additional option appears: `Dismiss anyway` — ghost text, `#718096`, 11px
  - Clicking `Dismiss anyway` marks the item as manually overridden — changes badge to `Overridden` in grey
  - Blocking issues that are manually overridden no longer prevent approval — but a warning appears in the ApprovalBanner (see below)

---

## Updated ApprovalBanner states

**All clear (no pending blocking issues)**
- Background `#F0FFF4`, border `#9AE6B4`
- `✓ Your workflow is ready. No issues found.`
- `Approve & Export →` active

**Blocking issues dismissed/overridden by user**
- Background `#FFFBEB`, border `#D69E2E44`
- `⚠ You've overridden [N] blocking issue(s). Your workflow may not run as expected.`
- `Approve anyway →` — teal pill, still active — user has explicitly chosen to proceed
- Small text below: `[N] item(s) manually overridden` in `#718096`, 11px

**Advisory issues only (no blocking)**
- Background `#F0FFF4`, border `#9AE6B4`
- `✓ No blocking issues. [N] advisory note(s) noted.`
- `Approve & Export →` active

---

## AI prompt for dispute resolution (new Prompt D)

Called when user submits a dispute on a feedback item.

**System message:**
```
You are an n8n workflow reviewer. A user has pushed back on one of your feedback items.
Consider their argument carefully and honestly. If they raise a valid point or provide
context you were missing, concede and explain why the issue no longer applies.
If your original feedback is still correct despite their argument, maintain your position
and explain clearly why — but acknowledge their perspective.
Respond ONLY with valid JSON matching this schema:
{
  "outcome": "concede | maintain",
  "response": "string — 1-2 sentences. Direct, honest, not defensive."
}
```

**User message:**
```
Original feedback: [original message]
Severity: [blocking | advisory]
User's argument: [disputeText]
Workflow context: [relevant node data]
```

---

## Developer notes — feedback loop

- Each `FeedbackItemRow` manages its own local state (pending/disputed/resolved)
- The `ApprovalBanner` derives its state from the aggregate of all `FeedbackItemRow` statuses
- A blocking issue is cleared from the approval gate if: status = `applied` OR status = `resolved` with `outcome: concede` OR status = `overridden` (user dismissed)
- Dispute API calls count against the session's iteration cap (shared with the refinement loop on the AI-build path). Total cap remains 5 across all interactions.
- Max one open dispute textarea at a time — opening a new one collapses any other open input

---

# CHANGE 2: Export Redesign

## Replaces
All of PRD-07 v2 Section 7 (Export Card) and Section 8 (n8n JSON Generation Architecture).

## New export flow

```
User clicks Approve & Export →
          ↓
Platform Selector screen (Step 2.5 — between Design and Export)
          ↓
Build Guide generation (Claude API call)
          ↓
Step 3: Export screen — Summary Card + three output actions
```

---

## Step 2.5 — Platform Selector

Appears immediately after the user clicks `Approve & Export →`. Before any generation happens. Full-width step, max-width 680px, centred.

### Layout
```
┌──────────────────────────────────────────────┐
│  Heading: What tool will you use to build    │
│  this?                                       │
│                                              │
│  Sub: We'll tailor the language and          │
│  instructions to your platform.              │
│                                              │
│  [Platform grid — 2×3]                       │
│                                              │
│  [Generate Build Guide →]                    │
└──────────────────────────────────────────────┘
```

### Platform options (6 cards in 2×3 grid)

Each card: white bg, `1px solid #E2E8F0`, `border-radius: 12px`, `padding: 16px 20px`, 160px min-width.
Selected state: `1.5px solid #38B2AC`, `background: #E6FFFA`.

| Label | Sub-label |
|---|---|
| `n8n` | Nodes & connections |
| `Zapier` | Zaps & steps |
| `Make` | Scenarios & modules |
| `Power Automate` | Flows & connectors |
| `Claude Code` | Functions & API calls |
| `Not sure yet` | Platform-agnostic language |

### CTA
`Generate Build Guide →` — teal, pill, 14px, 700. Disabled until a platform is selected.

### Loading state (after click)
Full-width progress bar + cycling messages:
- `"Reading your workflow…"`
- `"Mapping steps to [platform] terminology…"`
- `"Writing your build guide…"`
- `"Adding test checklist and edge cases…"`
- `"Almost done…"`

Duration: 8–15 seconds depending on workflow complexity.

---

## Step 3 — Export Screen

Two-column layout on desktop (60% / 40%). Single column on mobile.

---

### LEFT COLUMN — Summary Card

White bg, `1px solid #E2E8F0`, `border-radius: 16px`, `padding: 28px 32px`.

**Header row**
- Left: document icon (20px, `#38B2AC`) + `Build Guide` label (11px, 700, teal, uppercase, letter-spacing 2px)
- Right: platform badge — e.g. `n8n` pill, `background: #E6FFFA`, `color: #1A7A76`, `border: 1px solid #38B2AC44`, 11px 700

**Workflow title**
- 22px, 800, navy `#1A202C`
- Teal underline on key word (brand pattern)

**One-paragraph overview**
- 14px, `#4A5568`, line-height 1.7, max-width 520px
- The overview paragraph from the generated Build Guide

**Three stat pills (horizontal row)**
- `[N] steps` · `[complexity]` · `Est. [X–Y hrs] to build`
- Pill style: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 99px`, `padding: 4px 12px`, 12px, 600, `#4A5568`

**Before You Start — credential table**
- Heading: `What you'll need` — 13px, 700, navy
- Table: 3 columns — `What`, `Where to find it`, `Used in`
- Table style: no outer border, `1px solid #E2E8F0` row dividers, 12px text, `#4A5568`
- Background alternating: white / `#F7FAFC`
- Max 6 rows visible; if more, show `+ [N] more` expand link in teal

**Step list (collapsed)**
- Heading: `[N] steps in this workflow` — 13px, 700, navy
- Numbered list of step titles only — no detail
- 13px, `#4A5568`, line-height 1.8
- `Preview full guide ↓` link at bottom — teal text, 12px, 700
  - On click: expands an inline scrollable preview of the full markdown document (max-height 360px, `overflowY: auto`, `background: #F7FAFC`, `border-radius: 10px`, `padding: 20px 24px`, monospace 12px for code blocks, standard prose otherwise)
  - Collapse link replaces expand link: `Collapse preview ↑`

**Test Checklist (interactive)**
- Heading: `Test checklist` — 13px, 700, navy
- Rendered as real checkboxes — each item from the Build Guide's test checklist section
- Checkbox style: teal when checked (`#38B2AC`), `border: 1.5px solid #E2E8F0` unchecked
- Items: 13px, `#4A5568`. Checked items: `text-decoration: line-through`, `color: #A0AEC0`
- Progress indicator: `[N / Total] complete` — 11px, `#718096`, updates as user checks items
- These checkboxes are session-only — not persisted to Supabase

---

### RIGHT COLUMN — Output Actions

Three action cards stacked vertically, gap 12px.

---

**Card 1 — Download**
- Background: `#E6FFFA`, border: `1.5px solid #38B2AC44`, `border-radius: 14px`, `padding: 20px 24px`
- Icon: ⬇ (20px, `#38B2AC`)
- Title: `Download Build Guide` — 15px, 700, navy
- Sub: `A complete markdown document. Opens in Notion, VS Code, or any text editor.` — 12px, `#718096`
- Button: `Download .md` — full width, teal fill, pill, 13px, 700
- File name: `[workflow-name-slug]-build-guide.md`

---

**Card 2 — Copy for AI Agent**
- Background: white, `border: 1px solid #E2E8F0`, `border-radius: 14px`, `padding: 20px 24px`
- Icon: ◈ (20px, `#805AD5`)
- Title: `Copy for AI Agent` — 15px, 700, navy
- Sub: `Paste directly into Claude, Claude Code, or any AI tool to generate a platform-specific workflow template.` — 12px, `#718096`
- Button: `Copy to clipboard` — full width, `background: #FAF5FF`, `border: 1px solid #805AD544`, `color: #805AD5`, pill, 13px, 700
- On click: copies full markdown to clipboard. Button text changes to `✓ Copied` for 2 seconds, then resets.
- Below button: small inline tip — `💡 Paste this into Claude and ask it to generate a [platform] workflow template.` — 11px, `#718096`, italic

---

**Card 3 — Share / Handover**
- Background: white, `border: 1px solid #E2E8F0`, `border-radius: 14px`, `padding: 20px 24px`
- Icon: ↗ (20px, `#2B6CB0`)
- Title: `Share with your team` — 15px, 700, navy
- Sub: `Generate a shareable link to send to a developer or tech team.` — 12px, `#718096`
- Button: `Generate link` — full width, `background: #EBF8FF`, `border: 1px solid #2B6CB044`, `color: #2B6CB0`, pill, 13px, 700
- On click: generates a read-only URL containing the Build Guide rendered as a simple hosted page
  - URL format: `/app/artefacts/[artefact-id]/build-guide`
  - Page is publicly readable (no auth required to view) — so it can be sent to an external tech team
  - Copy link icon appears next to the URL: `✓ Link copied` feedback on click
- Below button: `Anyone with the link can view but not edit.` — 11px, `#A0AEC0`

---

### Below both columns — Save to Artefacts

Full-width banner, `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 12px`, `padding: 16px 24px`, flex row, space-between.

- Left: `Save this workflow to your Artefacts library` — 14px, 600, navy. Sub: `Your Build Guide will be saved and accessible from My Artefacts.` — 12px, `#718096`
- Right: `Save to Artefacts →` — teal, pill, 13px, 700

On save: writes to Supabase `artefacts` table (see data spec below). Button changes to `✓ Saved`.
If already saved: `Update saved artefact →` with inline confirm.

---

## Build Guide Generation — Technical Architecture

### What replaces the JSON generation pipeline from PRD-07 v2

The entire n8n JSON generation pipeline (primary AI path + TypeScript fallback + validator) is **removed**. No JSON is generated. No `assembleN8nWorkflow.ts` is needed.

The new generation pipeline produces a single markdown string — the Build Guide document.

---

### API call structure

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: BUILD_GUIDE_SYSTEM_PROMPT,   // see Appendix A
    messages: [
      {
        role: "user",
        content: `Generate a complete Build Guide for the following workflow.
Platform: ${selectedPlatform}
Respond ONLY with the raw markdown document. No preamble, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}`
      }
    ]
  })
});

const data = await response.json();
const buildGuideMarkdown = data.content[0].text.trim();
```

---

### BUILD_GUIDE_SYSTEM_PROMPT structure

Stored in `src/constants/buildGuideSystemPrompt.ts`.

The system prompt instructs Claude to generate the Build Guide in the following exact structure. Every generated guide must follow this structure without deviation.

```
# Build Guide
## [Workflow Name]

---

**What this workflow does**
[One paragraph. Plain English. What it does, what problem it solves,
what the end state looks like. No bullet points.]

**Complexity** `[Simple|Moderate|Moderate–High|High]`
**Estimated build time** `[X–Y hours]`
**Steps** `[N]`

---

## Before You Start

[Intro sentence]

| What | Where to find it | Used in |
|---|---|---|
[One row per credential/ID/value needed]

**Accounts to connect**
[Comma-separated list of services]

---

## The Workflow

---

### Step [N] — [Step Name]
**What happens:** [One sentence. Plain English. What this step does.]

**Configure:**
[Platform-specific instructions. Imperative voice.
For [platform], use the correct UI terminology.
Include specific field names, values, and settings.]

[If a code snippet is needed:]
```[language]
[code]
```

[If there is a condition/branch:]
> **If** [condition] → continue to Step [N]
> **Otherwise** → skip to Step [N]

[If there is a warning or tip:]
> ⚠️ [Warning text]
> 💡 [Tip text]

---

[Repeat for all steps]

---

## Test Checklist

Before going live, run through this with test data.

- [ ] [Specific, testable action — not generic]
[One checkbox per meaningful test scenario]

---

## Known Edge Cases

**[Edge case name]**
[One short paragraph. What can go wrong, why, and what to do about it.]

[Repeat for all relevant edge cases — minimum 3, maximum 6]
```

---

### Platform vocabulary map

The system prompt includes this vocabulary reference so Claude uses the correct terminology per platform:

| Concept | n8n | Zapier | Make | Power Automate | Claude Code |
|---|---|---|---|---|---|
| Workflow container | Workflow | Zap | Scenario | Flow | Script / Agent |
| Single unit | Node | Step | Module | Action | Function / Tool call |
| Start event | Trigger node | Trigger | Trigger module | Trigger | Entry point |
| Conditional branch | IF node | Filter / Paths | Router | Condition | if/else block |
| Data transform | Set node / Code node | Formatter | Tools module | Data operations | Transform function |
| Loop | Split in Batches | Looping | Iterator | Apply to each | for loop / map |
| Data reference | `{{ $json.field }}` | `{{field}}` | `{{1.field}}` | `@{field}` | `response.field` |

---

### Supabase write (on Save to Artefacts)

```typescript
{
  user_id: session.user.id,
  artefact_type: "workflow",
  title: intermediate.workflowName,
  summary: intermediate.summary,
  content: {
    intermediate: intermediate,        // logical workflow spec
    buildGuide: buildGuideMarkdown,    // full generated markdown
    platform: selectedPlatform,        // selected platform string
    generatedAt: new Date().toISOString()
  },
  level: 3,
  created_at: now(),
  updated_at: now()
}
```

The Build Guide markdown is stored so it can be retrieved for the share link route without regenerating.

---

### Share link route

**Route:** `/app/artefacts/[artefact-id]/build-guide`

This route renders the Build Guide markdown as a clean, readable page. It must be publicly accessible (no auth required) so it can be shared with external developers.

**Page design:**
- White background, max-width 720px, centred, `padding: 48px 40px`
- DM Sans + Plus Jakarta Sans fonts (same as app)
- Oxygy logo top-left (small, 24px height) + `Workflow Build Guide` label
- Markdown rendered with standard heading hierarchy, code blocks syntax-highlighted, tables styled to brand
- No sidebar, no navigation, no app chrome
- Print-friendly: `@media print` removes logo, preserves all content
- At top: `Generated by Oxygy AI Upskilling Platform` — 11px, `#A0AEC0`

---

## Files to add / modify

**New files:**
```
src/constants/buildGuideSystemPrompt.ts     ← BUILD_GUIDE_SYSTEM_PROMPT constant
src/components/app/workflow/
  ├── PlatformSelector.tsx                  ← Step 2.5 platform chooser
  ├── ExportSummaryCard.tsx                 ← Left column summary card
  ├── OutputActionsPanel.tsx                ← Right column three action cards
  ├── BuildGuidePreview.tsx                 ← Inline expandable preview
  ├── FeedbackItemRow.tsx                   ← Replaces annotation chip (Change 1)
  └── TestChecklist.tsx                     ← Interactive checklist component
src/pages/app/BuildGuideView.tsx            ← Public share link page
```

**Modified files:**
```
src/pages/app/WorkflowCanvas.tsx            ← Add platform selector step,
                                              replace export card,
                                              update feedback item components
src/App.tsx                                 ← Add /app/artefacts/:id/build-guide route
                                              (public — no auth guard on this route)
```

**Removed (no longer needed):**
```
src/utils/assembleN8nWorkflow.ts            ← TypeScript JSON assembler — delete
src/utils/validateN8nWorkflow.ts            ← JSON validator — delete
src/data/n8nNodeTemplates.ts               ← Node template library — delete
src/constants/n8nSystemPrompt.ts           ← n8n knowledge block — delete
```

---

## Updated Step Strip

The step strip now reads:
`01 · Describe` → `02 · Design & Refine` → `02.5 · Choose Platform` → `03 · Export`

The platform selection is a distinct visible step — not a modal or inline prompt — because it's a meaningful decision that affects the entire document. However it should feel lightweight: one question, six cards, one button. Not a full page.

On the step strip, `02.5` renders as a smaller intermediate pip between steps 2 and 3 rather than a full numbered step — visually it's a sub-step of the design phase.

---

## Responsive behaviour

### Platform selector
- Desktop: 2×3 grid
- Tablet: 2×3 grid, smaller cards
- Mobile: 2-column grid, stacked

### Export screen (Step 3)
- Desktop (≥ 768px): two-column (60% / 40%)
- Mobile: single column — summary card first, action cards below, save banner last

### Share link page
- All breakpoints: single column, max-width 720px. Fully readable on mobile.

---

## Success criteria

**Change 1 — Feedback loop:**
- [ ] `FeedbackItemRow` renders for each AI feedback item on the design-myself path
- [ ] `I disagree →` expands an inline textarea without navigating or reloading
- [ ] Dispute API call returns `concede | maintain` and renders correctly in both states
- [ ] `Dismiss anyway` removes item from blocking gate with visible overridden badge
- [ ] `ApprovalBanner` reflects correct state when all issues are resolved/dismissed
- [ ] Dispute calls count against the 5-iteration session cap

**Change 2 — Export:**
- [ ] Platform selector renders as Step 2.5 after Approve click
- [ ] All 6 platform options selectable; `Not sure yet` produces platform-agnostic language
- [ ] Loading progress bar shows with cycling messages during generation
- [ ] Summary card renders with correct data from generated Build Guide
- [ ] Credential table shows correct rows from Build Guide `Before You Start` section
- [ ] Step list renders titles only (not full content)
- [ ] `Preview full guide` expands inline with correct markdown rendering
- [ ] Test checklist checkboxes are interactive (check/uncheck) with progress counter
- [ ] Download button produces correct `.md` file with full Build Guide content
- [ ] Copy button copies full markdown and shows `✓ Copied` feedback
- [ ] Share link generates correctly and is accessible without authentication
- [ ] Share link page renders markdown cleanly with no app chrome
- [ ] Save to Artefacts writes `intermediate + buildGuide + platform` to Supabase
- [ ] No JSON is generated anywhere in this flow
- [ ] `assembleN8nWorkflow.ts` and related files removed with no broken imports

---

## Appendix A: BUILD_GUIDE_SYSTEM_PROMPT

```typescript
export const BUILD_GUIDE_SYSTEM_PROMPT = `
You are an expert workflow automation consultant and technical writer.
Your task is to generate a complete, practical Build Guide for an automation workflow.
The guide must be immediately actionable — readable by a non-technical user building
it themselves, usable as a handover document for a developer, and structured enough
to be parsed by an AI agent to generate a platform-specific workflow template.

CRITICAL FORMATTING RULES:
- Respond ONLY with the raw markdown document. No preamble, no explanation.
- Follow the exact document structure below. Do not add, remove, or rename sections.
- Use the platform's correct terminology throughout (provided in the user message).
- Write in imperative voice for all Configure sections: "Connect your account", not
  "The account should be connected".
- Every step must have a "What happens:" sentence before the configuration detail.
- Code blocks must use triple backtick fences with the language identifier.
- The Test Checklist must contain specific, testable actions — not generic advice.
- Known Edge Cases must be real failure modes, not theoretical ones.
- Minimum 3 edge cases, maximum 6.

PLATFORM VOCABULARY:
Use the correct terminology for the selected platform. If platform is "Not sure yet",
use generic terms: "workflow", "step", "trigger", "condition", "field reference".

TONE:
Direct. Practical. Confident. A smart colleague wrote this — not a manual.
No filler phrases like "it's important to note that" or "please ensure that".
Just: what to do, where, and why it matters if something is non-obvious.

DOCUMENT STRUCTURE — follow exactly:

# Build Guide
## [workflow name]

---

**What this workflow does**
[paragraph]

**Complexity** \`[value]\` &nbsp; **Estimated build time** \`[value]\` &nbsp; **Steps** \`[N]\`

---

## Before You Start

[one sentence intro]

| What | Where to find it | Used in |
|---|---|---|
[rows]

**Accounts to connect**
[list]

---

## The Workflow

---

### Step [N] — [Name]
**What happens:** [sentence]

**Configure:**
[instructions]

[code block if needed]

[conditional routing if needed, formatted as:]
> **If** [condition] → continue to Step N
> **Otherwise** → skip to Step N

[warning or tip if needed, formatted as:]
> ⚠️ [warning]
> 💡 [tip]

---

[repeat for all steps]

---

## Test Checklist

Before going live, run through this with test data.

- [ ] [item]
[all items]

---

## Known Edge Cases

**[name]**
[paragraph]

[repeat for all edge cases]
`;
```

---

*End of PRD-07 v3*
