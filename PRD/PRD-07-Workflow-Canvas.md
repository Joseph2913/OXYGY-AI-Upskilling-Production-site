# PRD-07: Level 3 — Workflow Canvas (n8n Workflow Generator)

**Status:** Ready for implementation  
**Route:** `/app/toolkit/workflow-canvas`  
**Artefact type:** `workflow` (n8n JSON)  
**Depends on:** PRD-01 (App Shell), PRD-05 (My Toolkit), PRD-06 (My Artefacts)

---

## 1. Overview

### Purpose
The Workflow Canvas is the Level 3 tool in the Oxygy AI Upskilling platform. It guides learners through designing and generating a real, importable n8n workflow — from plain-English description through a co-design loop (human-built or AI-built, both with feedback) to a validated, downloadable `.json` file.

The output is the learner's **Level 3 Artefact**: a workflow JSON that:
- Imports directly into n8n with no manual JSON editing
- Feeds into the Level 5 Business Case Evaluator as a scored input
- Lives in My Artefacts as an `artefact_type: "workflow"` record

### Where it sits
Accessed from My Toolkit → Level 3 card → "Open Tool →". Also reachable directly when completing the Level 3 learning content and clicking the practice CTA.

### Dual audience
- **Learner building for the first time:** Needs scaffolding and AI assistance. Will likely use the AI-build path.
- **Learner iterating on a real work problem:** May prefer the design-yourself path for control.

---

## 2. User Flow

```
DESCRIBE
  ↓
CHOOSE PATH
  ├── Design it myself → Node Builder → AI Feedback → [iterate] → Approve
  └── AI builds it    → AI Generation → User Feedback → [iterate] → Approve
                                              ↓
                                           EXPORT
                                              ↓
                                     [Save to Artefacts]
```

The two paths converge at the same Approve gate. After approval, both paths hit the same Export screen. The only difference is who does the first build and who gives first feedback.

---

## 3. Content Specification

### Page header (persistent, above all steps)
- **Level badge:** `LEVEL 3` — pill, background `#A8F0E0`, text `#1A7A76`, 11px, 700 weight
- **Tool name:** `Workflow Canvas` — 22px, 800 weight, navy `#1A202C`
- **Eyebrow above tool name:** `n8n Workflow Generator` — 10px, 700, teal `#38B2AC`, uppercase, letter-spacing 2px
- **Step indicator:** Three-step strip (Describe / Design & Refine / Export) — see Section 6

### Step 1 — Describe (copy)
- **Heading:** `What do you want to automate?`
- **Subheading:** `Describe your workflow in plain English. Be specific about what triggers it, what happens in between, and what the final output is.`
- **Textarea placeholder:** `e.g. When a new row is added to a Google Sheet, send the data to Claude to write a summary, then post that summary to a Slack channel.`
- **Tip chip:** `💡 Good descriptions include: a trigger event, 1–3 processing steps, and a clear output.`
- **Three example prompts** (clickable — populate textarea):
  1. "When a new row is added to a Google Sheet, send it to an AI to summarise, then post to Slack."
  2. "Every Monday, pull last week's Airtable data, generate a report with Claude, and email it to the team."
  3. "When a webhook fires from our website form, extract key fields using AI, save to Notion, and send a confirmation email."
- **CTA:** `Parse Workflow →` (disabled until textarea has ≥ 20 characters)

### Step 2 — Choose Path (copy)
After parsing, the AI produces a structured intermediate (see Section 8). Then:
- **Heading:** `How would you like to build this?`
- **Option A card heading:** `Design it myself`
- **Option A description:** `Build your workflow node by node. AI reviews your design and flags issues.`
- **Option B card heading:** `AI builds it for me`
- **Option B description:** `AI generates a full workflow from your description. You review and refine until it's right.`

### Step 2 — Design Myself path
- **Panel heading:** `Your Workflow` with node count badge
- **Add node CTA:** `+ Add Step`
- **Node types available:** Trigger, Action, AI / LLM, Condition, Transform, Output
- **AI Review CTA:** `Get AI Feedback →`
- **Feedback panel heading:** `AI Review` with inline suggestions per node

### Step 2 — AI Builds path
- **Panel heading:** `AI-Generated Workflow`
- **Sub-label:** `Review each step. Edit anything that doesn't match your intent.`
- **Per-node edit:** inline Edit button
- **Feedback input label:** `What would you like to change?`
- **Feedback input placeholder:** `e.g. Add a condition before the Slack step that checks if the summary is more than 50 words.`
- **Regenerate CTA:** `Update Workflow →`

### Step 2 — Approve gate (bottom of both paths)
- **Green validation banner** (appears when no AI review issues remain): `✓ Your workflow looks good. Ready to generate your n8n file.`
- **CTA:** `Approve & Export →` — teal, pill, 14px, 700 weight

### Step 3 — Export screen (see Section 7 for full spec)

---

## 4. Layout & Structure

### Overall shell
```
┌──────────────────────────────────────────────────────────┐
│ App Top Bar (from PRD-01)                                │
├──────────────────────────────────────────────────────────┤
│ App Sidebar (from PRD-01)                                │
├──────────────────────────────────────────────────────────┤
│ Page Header (persistent)          max-width 900px        │
│  - Level badge + tool name + eyebrow                     │
│  - Step progress strip                                   │
├──────────────────────────────────────────────────────────┤
│ Step Content Area                 max-width 900px        │
│  padding: 32px 40px                                      │
└──────────────────────────────────────────────────────────┘
```

### Step 1 (Describe) layout
- Single column, max-width 680px
- Textarea: full width, 6 rows, auto-grow to max 10 rows
- Example prompts: vertical stack of 3 cards below textarea
- Tip chip: inline above examples
- CTA: left-aligned below examples

### Step 2 — Path chooser layout
- Two-column card grid (equal width, gap 16px)
- Each card: white bg, 1px solid `#E2E8F0` border, 16px border-radius, 24px padding
- Hover: border-color transitions to `#38B2AC`
- Active/selected: `1.5px solid #38B2AC`, `#E6FFFA` background tint
- Mobile: stacks vertically

### Step 2 — Node chain layout (both paths)
```
[Sticky Trigger node]
        ↕ 20px connector line
[Node card]
        ↕ 20px connector line
[Node card]
        ↕ 20px connector line
[+ Add Step] (design-myself only)
```
- Each node card: white bg, `1px solid #E2E8F0`, `borderLeft: 4px solid [type colour]`, 10px border-radius
- Connector: 2px wide, `#E2E8F0` colour, centred, with "THEN" label right of midpoint

### Step 2 — AI Feedback panel layout
- Appears below the node chain as a collapsible drawer
- Background: `#F7FAFC`, `1px solid #E2E8F0` border, 12px border-radius
- Per-node feedback inline (not a separate panel) — small annotation chip below relevant node

### Step 3 — Export layout (see Section 7)

---

## 5. Component Breakdown

### StepStrip
Three pills connected by a line: `01 · Describe`, `02 · Design & Refine`, `03 · Export`.
- Active step: white text, teal fill
- Completed step: teal text, `✓` prefix, teal fill at 20% opacity
- Upcoming step: `#718096` text, `#F7FAFC` bg
- Connector lines: `1px solid #E2E8F0`
- Height: 40px, sits below page header, full width

### PathChooserCard
- Props: `title`, `description`, `icon` (geometric unicode), `selected`, `onClick`
- Default: white bg, `1px solid #E2E8F0`, `border-radius: 16px`, `padding: 24px`
- Selected: `1.5px solid #38B2AC`, `background: #E6FFFA`
- Icon: 36px circle, `background: #EDF2F7`, centred geometric character, `#4A5568` colour
- Title: 16px, 800, navy
- Description: 13px, 400, `#718096`

### NodeCard
- Props: `node`, `index`, `editable`, `onEdit`, `feedbackNote`
- Layout: flex row, 12px gap
  - Left: type icon (20px emoji/unicode)
  - Body: flex-col
    - Row 1: step label (`Trigger` or `Step N`) + `<Badge type={node.type} />`
    - Row 2: node name — 14px, 700, navy
    - Row 3: description — 13px, `#718096`, line-height 1.5
    - Row 4 (if service exists): service chip — 11px, 600, `#1A7A76`, `#E6FFFA` bg, 6px border-radius
  - Right: Edit button (if `editable`) — `1px solid #E2E8F0`, 6px border-radius, 11px, 600
- `feedbackNote` renders as yellow advisory chip below card body if present
- Border-left: 4px solid `[type colour from NODE_TYPES]`

### NodeTypeBadge
- Props: `type` — one of `trigger | action | ai | condition | transform | output`
- Colours:
  - `trigger`: text `#38B2AC`, bg `#E6FFFA`, border `#38B2AC44`
  - `action`: text `#805AD5`, bg `#FAF5FF`, border `#805AD544`
  - `ai`: text `#1A7A76`, bg `#E6FFFA`, border `#1A7A7644`
  - `condition`: text `#D69E2E`, bg `#FFFFF0`, border `#D69E2E44`
  - `transform`: text `#2B6CB0`, bg `#EBF8FF`, border `#2B6CB044`
  - `output`: text `#276749`, bg `#F0FFF4`, border `#27674944`
- Shape: pill, `border-radius: 99px`, `padding: 2px 10px`, `font-size: 11px`, `font-weight: 700`
- Includes emoji icon prefix (10px)

### EditNodeModal
- Full-screen overlay, `background: #00000066`
- Modal card: white, `border-radius: 16px`, `padding: 28px`, `max-width: 480px`, centred
- Fields: Node Name (text input), Description (textarea, 2 rows), Service / App (text input), Node Type (pill button selector)
- Buttons: Cancel (secondary) + Save Changes (teal)
- Focus: inputs get `border-color: #38B2AC` on focus

### FeedbackInputRow (AI-build path only)
- Textarea (2 rows, auto-resize) + `Update Workflow →` button side by side on desktop
- Stacks vertically on mobile
- Textarea: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 10px`
- Shows iteration count: `Iteration 2 of 3` pill when user has already refined once

### ApprovalBanner
- Appears at bottom of node chain when AI review returns no blocking issues
- Background: `#F0FFF4`, border: `1px solid #9AE6B4`, border-radius: 12px, padding: 14px 20px
- Left: `✓` icon (green `#48BB78`), text: `Your workflow is ready. No issues found.`
- Right: `Approve & Export →` button (teal, pill, 14px, 700)
- If issues exist: amber `#FFFFF0` bg, border `#D69E2E`, text lists the issue count, CTA disabled

### ExportCard (see Section 7)

---

## 6. Interactions & Animations

### Step transitions
- Fade-up: `opacity 0 → 1`, `translateY 12px → 0`, duration 400ms, ease-out
- Step strip updates immediately on transition

### Textarea — describe step
- Character counter appears at bottom-right when ≥ 10 chars typed: `47 characters`
- CTA becomes active at ≥ 20 chars (no API call until clicked)

### Parse → path chooser transition
- Loading state on CTA button: spinner + rotating messages:
  - "Reading your description…"
  - "Identifying trigger and steps…"
  - "Mapping to n8n node types…"
- On completion: step strip advances to step 2, path chooser fades in

### Node chain — design-myself path
- `+ Add Step` button appends a blank NodeCard with an edit modal that opens immediately
- Drag-to-reorder: nodes are draggable (handle on left edge). Drop re-orders the chain, updates connector lines instantly
- Delete node: hover reveals a `×` icon in top-right of card. Click shows inline confirm: `Remove this step? [Cancel] [Remove]`

### AI feedback loop
- Feedback generates node-level annotations. Each annotation appears as a chip below the relevant node: amber bg, warning icon, one-line note
- `Update Workflow →` replaces the full node chain with a fade transition. Keeps the user's custom edits where they don't conflict with the update

### Approve → Export
- Click `Approve & Export →` triggers JSON generation
- Full-width loading bar animates across top of page (not a spinner)
- Messages cycle below bar:
  - "Building your n8n workflow…"
  - "Wiring node connections…"
  - "Configuring node parameters…"
  - "Validating JSON schema…"
  - "Preparing export package…"
- On completion: Export card slides in from below (translateY 24px → 0, 500ms ease-out)

### Export card — copy to clipboard
- Code preview has copy icon top-right. Click copies raw JSON, icon switches to `✓ Copied` for 2 seconds

### Save to Artefacts CTA
- On click: button shows spinner, then `✓ Saved` — updates artefacts table via Supabase. Does not navigate away.
- If user already has a workflow artefact: shows `Update existing artefact?` inline confirm

---

## 7. Export Card — Full Specification

This is the primary deliverable screen. It renders after JSON generation succeeds.

### Layout
Two-column layout on desktop (≥ 768px): left column 55% width, right column 45%.
Single column on mobile. Gap: 24px. Max-width: 900px.

### LEFT COLUMN — Download & Import

**Panel 1: Download block**
- Background: `#E6FFFA`, border: `1.5px solid #38B2AC44`, border-radius: 16px, padding: 28px
- Top: success checkmark icon (32px, `#38B2AC`) + workflow name (20px, 800, navy) + summary sentence (13px, `#718096`)
- Stats row: three pills — `[N] nodes`, `[complexity]`, `[estimated run time]`
- Download button: full width, teal fill, pill, 15px, 700 — `⬇  Download workflow.json`
- Sub-label below button: `Compatible with n8n Cloud and n8n self-hosted`

**Panel 2: How to import into n8n**
- Background: white, border: `1px solid #E2E8F0`, border-radius: 14px, padding: 22px 24px
- Heading: `How to import into n8n` — 15px, 800, navy
- 5-step numbered list using teal-outlined step number chips:
  1. Open your n8n instance and click **Create new workflow**
  2. Click the **⋯** menu in the top-right corner of the canvas
  3. Select **Import from File** and choose `[workflow-name].json`
  4. Reconnect credentials for each node that requires authentication
  5. Click **Execute once** with test data to validate the workflow runs correctly
- Each step: 22px chip (teal bg tint, teal border, teal text, 11px 700) + 13px text, `#4A5568`

### RIGHT COLUMN — Setup Guide

**Panel 3: Variables to configure**
- Background: white, border: `1px solid #E2E8F0`, border-radius: 14px, padding: 22px 24px
- Heading: `What you'll need to configure` — 15px, 800, navy
- Sub-label: `After importing, you'll need to connect these to your own accounts and settings.`
- Dynamically generated list based on nodes in the workflow. For each node that requires credentials or configuration, one row:

Row structure:
  - Left: node type icon + service name (13px, 700, navy)
  - Right: configuration label chip (amber bg `#FFFFF0`, border `#D69E2E44`, amber text `#8A6A00`, 11px, 700)
  
Common configurations generated dynamically:
  - Google Sheets node → `Connect Google account`
  - Slack node → `Connect Slack workspace`
  - Gmail / email node → `Connect email account`
  - Claude / OpenAI node → `Add API key` + `Edit system prompt`
  - HTTP Request node → `Set endpoint URL` + `Add authentication header`
  - Webhook trigger → `Copy webhook URL to your app`
  - Airtable node → `Connect Airtable account` + `Set base ID`
  - Notion node → `Connect Notion workspace`
  - n8n Set node → `Review field mappings`
  - n8n If / Condition node → `Review condition logic`

**Panel 4: Improve this workflow — cross-tool references**
- Background: `#F7FAFC`, border: `1px solid #E2E8F0`, border-radius: 14px, padding: 20px 24px
- Heading: `Want to go further?` — 14px, 800, navy
- Three cross-tool reference cards (horizontal stack, gap 8px):

  Card A — `Improve the system prompt`
  - Level badge: `L1` (mint bg, teal text, 10px 700)
  - Icon: geometric unicode `◈` 
  - Text: `Use the Prompt Playground to test and refine any AI prompts in this workflow before locking them in.`
  - Link: `Open Prompt Playground →` — teal text, 12px, 700, no underline by default, underline on hover

  Card B — `Build an AI agent for a step`
  - Level badge: `L2`
  - Icon: `◉`
  - Text: `If any step uses an AI model, replace it with a custom agent built in the Agent Builder for better control.`
  - Link: `Open Agent Builder →` — teal text, 12px, 700

  Card C — `Save this as your Level 3 Artefact`
  - Level badge: `L3`
  - Icon: `▣`
  - Text: `This workflow feeds directly into your Level 5 Business Case evaluation. Save it to your Artefacts library.`
  - CTA button (not link): `Save to Artefacts →` — teal fill, pill, 12px, 700

Cross-tool card style:
- White bg, `1px solid #E2E8F0`, `border-radius: 10px`, `padding: 14px 16px`
- Level badge: pill, 10px, positioned top-left of card body

**Panel 5: JSON preview (collapsible)**
- `<details>` element, closed by default
- Summary label: `View raw n8n JSON` — 13px, 700, `#718096`
- Expanded: `<pre>` with monospace 11px, `#4A5568`, `background: #F7FAFC`, max-height 280px, `overflowY: auto`, horizontal scroll
- Copy icon in top-right of pre block

---

## 8. n8n JSON Generation — Technical Architecture

### Critical design decision: Intermediate → Template Assembly

The AI **never writes raw n8n JSON directly.** Instead:

1. **AI produces a Logical Intermediate** — a clean JSON representation of the workflow at the conceptual level (stored in Supabase)
2. **A deterministic template assembly function** converts the intermediate into a valid n8n JSON file using a pre-built node template library

This decouples AI output quality from n8n schema compliance. The AI is only responsible for the logical layer. The code is responsible for producing valid JSON.

### Logical Intermediate schema (stored in `artefacts.content`)
```json
{
  "workflowName": "string",
  "summary": "string",
  "complexity": "simple | moderate | complex",
  "estimatedRunTime": "string",
  "humanInTheLoop": boolean,
  "nodes": [
    {
      "id": "string",
      "name": "string",
      "type": "trigger | action | ai | condition | transform | output",
      "service": "string | null",
      "n8nNodeKey": "string",
      "description": "string",
      "configRequirements": ["string"]
    }
  ]
}
```

The `n8nNodeKey` is a short identifier (e.g. `"googleSheets"`, `"slack"`, `"claudeAi"`, `"webhook"`, `"httpRequest"`, `"if"`, `"set"`) that maps to a template in the node library.

### Node template library (`src/data/n8nNodeTemplates.ts`)
A TypeScript object keyed by `n8nNodeKey`. Each entry is a function that returns a partial n8n node JSON object (all fields except `id`, `name`, and `position`, which are assigned by the assembler).

Example entries:
```ts
googleSheets: {
  type: "n8n-nodes-base.googleSheets",
  typeVersion: 4,
  parameters: {
    operation: "append",
    sheetId: { __rl: true, value: "YOUR_SHEET_ID", mode: "id" },
    columns: { mappingMode: "autoMapInputData" }
  },
  credentials: {
    googleSheetsOAuth2Api: { id: "YOUR_CREDENTIAL_ID", name: "Google Sheets account" }
  }
}

slack: {
  type: "n8n-nodes-base.slack",
  typeVersion: 2.2,
  parameters: {
    resource: "message",
    operation: "post",
    channel: "YOUR_CHANNEL_ID",
    text: "={{ $json.output }}"
  },
  credentials: {
    slackApi: { id: "YOUR_CREDENTIAL_ID", name: "Slack account" }
  }
}

claudeAi: {
  type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
  typeVersion: 1,
  parameters: {
    model: "claude-sonnet-4-20250514",
    options: { systemPrompt: "YOUR_SYSTEM_PROMPT_HERE" }
  },
  credentials: {
    anthropicApi: { id: "YOUR_CREDENTIAL_ID", name: "Anthropic API" }
  }
}

webhook: {
  type: "n8n-nodes-base.webhook",
  typeVersion: 2,
  parameters: {
    httpMethod: "POST",
    path: "YOUR_WEBHOOK_PATH",
    responseMode: "onReceived"
  }
}

if: {
  type: "n8n-nodes-base.if",
  typeVersion: 2,
  parameters: {
    conditions: {
      options: { caseSensitive: true },
      conditions: [{ id: "condition_1", leftValue: "={{ $json.value }}", rightValue: "", operator: { type: "string", operation: "exists" } }]
    }
  }
}

set: {
  type: "n8n-nodes-base.set",
  typeVersion: 3.4,
  parameters: {
    mode: "manual",
    fields: { values: [{ name: "output", value: "={{ $json.output }}" }] }
  }
}
```

Minimum required library at launch (30 nodes):
`webhook`, `googleSheets`, `googleSheetsTrigger`, `slack`, `gmail`, `emailSend`, `httpRequest`, `airtable`, `notion`, `claudeAi`, `openAi`, `set`, `if`, `merge`, `code`, `schedule`, `stickyNote`, `splitInBatches`, `wait`, `respondToWebhook`, `postgres`, `supabase`, `hubspot`, `typeform`, `googleDrive`, `dropbox`, `telegram`, `discord`, `microsoftOutlook`, `filter`

For any `n8nNodeKey` not in the library: fall back to `httpRequest` node with a sticky note: `⚠ [Service] not in template library — configure this as an HTTP Request node or install the community node.`

### Assembly function (`src/utils/assembleN8nWorkflow.ts`)
```
function assembleN8nWorkflow(intermediate: WorkflowIntermediate): string

1. For each node in intermediate.nodes:
   a. Look up template by n8nNodeKey
   b. Assign: id (UUID v4), name (node.name), position ([250 + i*250, 300])
   c. Merge template properties
   d. Add to nodes array

2. Add one stickyNote node at position [250, 150]:
   - Content: setup instructions + credential checklist for this specific workflow
   - Lists every configRequirement from all nodes

3. Build connections object:
   - Linear chain: nodes[0] → nodes[1] → ... → nodes[n]
   - For "if" nodes: main[0] (true branch) continues chain, main[1] (false branch) connects to next non-branching node

4. Assemble top-level wrapper:
   {
     "name": intermediate.workflowName,
     "nodes": [...],
     "connections": {...},
     "active": false,
     "settings": { "executionOrder": "v1" },
     "meta": { "templateCredsSetupCompleted": false, "generatedBy": "Oxygy AI Upskilling Platform" }
   }

5. Return JSON.stringify(result, null, 2)
```

### Where generation runs
Client-side. The assembly function runs in the browser at the moment the user clicks `Approve & Export →`. No server round-trip needed — the intermediate is already in state. The resulting JSON string is offered as a Blob download.

### Supabase write (on Save to Artefacts)
```ts
// Insert or upsert into artefacts table
{
  user_id: session.user.id,
  artefact_type: "workflow",
  title: intermediate.workflowName,
  summary: intermediate.summary,
  content: intermediate,          // the logical intermediate — NOT the n8n JSON
  level: 3,
  created_at: now(),
  updated_at: now()
}
```

The n8n JSON is never stored — it is generated on demand from the intermediate every time the user exports.

---

## 9. AI Prompt Architecture

### Prompt A: Parse description → Logical Intermediate
Called once when the user submits their plain-English description. Returns the full intermediate JSON.

System message:
```
You are an n8n workflow architect helping learners on an AI upskilling programme. 
Parse a plain-English workflow description into a structured node breakdown. 
Respond ONLY with valid JSON matching the WorkflowIntermediate schema. No markdown.
```

User message: the description + schema definition

Key constraints for the AI:
- First node must always be `type: "trigger"`
- 3–8 nodes total
- `n8nNodeKey` must be one of the 30 library keys (or `"httpRequest"` as fallback)
- `humanInTheLoop` should be `true` if any step involves irreversible actions (sending emails, posting publicly, writing to databases with no review)

### Prompt B: AI Review of user-designed workflow
Called when user clicks `Get AI Feedback →` on the design-myself path.

Returns:
```json
{
  "issues": [
    { "nodeId": "string", "severity": "blocking | advisory", "message": "string" }
  ],
  "overallAssessment": "string",
  "readyToApprove": boolean
}
```

Blocking issues prevent approval. Advisory issues show as amber chips but don't block.

Example blocking issues the AI should flag:
- No trigger node as first step
- A condition node with no branch handling
- An AI node with no output node to receive its response
- Circular connections

Example advisory issues:
- Missing error handling
- No human-in-the-loop before an irreversible action
- System prompt not defined for an AI node

### Prompt C: Refine AI-generated workflow from user feedback
Called when user submits feedback text on the AI-build path.

Returns a full updated intermediate. The AI should preserve any nodes the user has manually edited (passed in as `lockedNodes` array).

---

## 10. Visual Design Spec

### Colours (all from brand system)
- Page background: `#F7FAFC`
- Card background: `#FFFFFF`
- All card borders: `1px solid #E2E8F0`
- Teal CTA: `#38B2AC`
- Navy headings: `#1A202C`
- Body text: `#4A5568`
- Secondary text: `#718096`
- Muted / labels: `#A0AEC0`
- Level 3 accent (teal): `#38B2AC`, dark `#1A7A76`, light `#E6FFFA`

### Node type colours (left border + badge)
- Trigger: `#38B2AC`
- Action: `#805AD5`
- AI / LLM: `#1A7A76`
- Condition: `#D69E2E`
- Transform: `#2B6CB0`
- Output: `#276749`

### Typography
- All fonts: DM Sans (headings) + Plus Jakarta Sans (body, labels, buttons)
- Google Fonts import at top of component file
- No system font fallbacks as primary
- Heading sizes: 22px (panel headings), 16px (card titles), 13px (body), 11px (chips/badges)

### No drop shadows anywhere
All elevation via `border: 1px solid #E2E8F0` only.

### Spacing
Multiples of 4px throughout. Standard gaps: 8, 12, 16, 20, 24, 32, 40px.

### Border radii
- Cards / panels: 14–16px
- Buttons: 99px (pill)
- Chips / badges: 99px
- Node cards: 10px
- Input fields: 10px

---

## 11. Responsive Behaviour

### Desktop (≥ 1200px)
Full layout as described. Export card: two-column (55% / 45%). Node chain: single column max-width 680px centred. Cross-tool reference cards: horizontal row.

### Tablet (768–1199px)
Export card: single column (left column first, then right). All panels full width. Step strip: compressed labels (icons only below 900px). Cross-tool cards: horizontal row with smaller padding. Path chooser: two columns maintained.

### Mobile (< 768px)
Everything single column. Path chooser cards stack vertically. Node chain: full width. Export card: panels stack (download first, then setup guide, then variables). Cross-tool reference cards stack vertically. Textarea: 4 rows. Buttons: full width.

---

## 12. Content Data — Node Template Library Keys

The AI must produce `n8nNodeKey` values from this list only:

| Key | Service | Credential type |
|---|---|---|
| `webhook` | Webhook Trigger | None — URL generated by n8n |
| `schedule` | Schedule Trigger | None |
| `googleSheetsTrigger` | Google Sheets (trigger) | `googleSheetsOAuth2Api` |
| `googleSheets` | Google Sheets | `googleSheetsOAuth2Api` |
| `gmail` | Gmail | `gmailOAuth2` |
| `emailSend` | Send Email (SMTP) | `smtp` |
| `slack` | Slack | `slackApi` |
| `discord` | Discord | `discordApi` |
| `telegram` | Telegram | `telegramApi` |
| `microsoftOutlook` | Microsoft Outlook | `microsoftOutlookOAuth2Api` |
| `airtable` | Airtable | `airtableTokenApi` |
| `notion` | Notion | `notionApi` |
| `googleDrive` | Google Drive | `googleDriveOAuth2Api` |
| `dropbox` | Dropbox | `dropboxApi` |
| `hubspot` | HubSpot | `hubspotApi` |
| `typeform` | Typeform | `typeformApi` |
| `postgres` | PostgreSQL | `postgres` |
| `supabase` | Supabase | `supabaseApi` |
| `claudeAi` | Claude (Anthropic) | `anthropicApi` |
| `openAi` | OpenAI | `openAiApi` |
| `httpRequest` | HTTP Request | Varies — set manually |
| `set` | Set / Edit Fields | None |
| `if` | IF Condition | None |
| `filter` | Filter | None |
| `merge` | Merge | None |
| `splitInBatches` | Split in Batches | None |
| `code` | Code (JS) | None |
| `wait` | Wait | None |
| `respondToWebhook` | Respond to Webhook | None |
| `stickyNote` | Sticky Note | None |

---

## 13. Developer Notes & Edge Cases

### JSON generation is client-side only
The assembly function runs in the browser. No API call is made during export. The intermediate is assembled into JSON using a pure TypeScript function imported from `src/utils/assembleN8nWorkflow.ts`. This keeps exports fast and avoids any backend dependency.

### Credentials in generated JSON
All credential fields use the format `{ "id": "YOUR_CREDENTIAL_ID", "name": "Your [Service] Account" }`. These are intentionally placeholder — n8n will prompt the user to connect their own credentials when they import the file. The sticky note inside the workflow explains this.

### The stickyNote node
Every generated workflow includes one `n8n-nodes-base.stickyNote` node at position `[250, 150]` (above the trigger node). Its content is dynamically generated from the workflow's `configRequirements` array. It should read:

```
🔧 SETUP REQUIRED — [Workflow Name]

Generated by Oxygy AI Upskilling Platform. Before activating this workflow:

1. Connect your credentials:
   [list each configRequirement with bullet]

2. Test with sample data before activating

3. Review AI node prompts — edit the system prompt to match your specific use case

Generated on [date]. Workflow complexity: [complexity].
```

### AI node system prompts
For any `claudeAi` or `openAi` node, the `parameters.options.systemPrompt` field should contain a descriptive placeholder rather than an empty string: `"YOUR_SYSTEM_PROMPT_HERE — describe the AI's role, what it should do, and the format of its output. Use the Oxygy Prompt Playground (Level 1) or Agent Builder (Level 2) to craft this."` This is intentionally long — it's a reminder, not live code.

### Existing artefact handling
If the user already has a `workflow` artefact saved, clicking `Save to Artefacts →` shows an inline confirmation: `You already have a saved workflow. Replace it with this one? [Cancel] [Replace]`. On confirm: `upsert` into the `artefacts` table where `user_id = current` and `artefact_type = "workflow"`.

### `humanInTheLoop` flag
If `intermediate.humanInTheLoop === true`, the node chain should display an advisory banner above the Approve gate: `💡 This workflow performs irreversible actions (sending messages, writing to databases). Consider adding a manual review step before the output. n8n's "Wait" node can pause execution for human approval.` This is advisory, not blocking.

### Version pinning
All `typeVersion` values in the template library should match the n8n LTS version at time of build. Document the n8n version in a comment at the top of `n8nNodeTemplates.ts`. When updating the template library, increment typeVersions with reference to n8n release notes.

### Cross-tool link routing
- `Open Prompt Playground →` links to `/app/toolkit/prompt-playground`
- `Open Agent Builder →` links to `/app/toolkit/agent-builder`
- These links are locked if the user's `current_level < 1` or `< 2` respectively. In that case, replace the link with `Unlocks at Level [N]` in muted grey — do not navigate.

### Iteration cap
The feedback → regenerate loop is capped at **5 iterations** per session. After 5, a message appears: `You've refined this workflow 5 times. Approve the current version or start over.` The Approve button remains active; Start Over resets the tool entirely.

### No draft saving
This tool does not auto-save drafts. If the user navigates away before saving to Artefacts, they lose their work. A `beforeunload` warning should appear if the user has a workflow in state that hasn't been saved: `You have an unsaved workflow. Leave anyway?`

---

## 14. New Files Required

```
src/
├── pages/app/
│   └── WorkflowCanvas.tsx               ← main page component
├── components/app/workflow/
│   ├── StepStrip.tsx
│   ├── PathChooserCard.tsx
│   ├── NodeCard.tsx
│   ├── NodeTypeBadge.tsx
│   ├── EditNodeModal.tsx
│   ├── FeedbackInputRow.tsx
│   ├── ApprovalBanner.tsx
│   └── ExportCard.tsx
├── utils/
│   └── assembleN8nWorkflow.ts           ← deterministic JSON assembler
└── data/
    └── n8nNodeTemplates.ts              ← 30-node template library
```

Route: add `/app/toolkit/workflow-canvas` to the router in `src/App.tsx`.

---

## 15. Success Criteria

A build is complete when:
- [ ] All 5 steps render and transition correctly
- [ ] Both paths (design-myself and AI-builds) reach the Approve gate
- [ ] AI feedback renders as node-level annotations, not a generic panel
- [ ] `assembleN8nWorkflow()` produces JSON that imports into n8n Cloud without errors for at least the 10 most common node types
- [ ] The stickyNote node appears inside the imported workflow with accurate setup instructions
- [ ] The variables-to-configure list in the Export card is dynamically generated from the workflow's actual nodes
- [ ] Cross-tool links navigate to the correct routes and show lock state for inaccessible tools
- [ ] Save to Artefacts writes the logical intermediate (not the n8n JSON) to Supabase
- [ ] `beforeunload` warning fires when navigating away from an unsaved workflow
- [ ] All responsive breakpoints pass visual review
- [ ] No drop shadows, no purple gradients, no Inter/Roboto fonts
```
