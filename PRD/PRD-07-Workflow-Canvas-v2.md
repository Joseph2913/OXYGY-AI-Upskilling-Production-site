# PRD-07 v2: Level 3 — Workflow Canvas (n8n Workflow Generator)

**Status:** Ready for implementation  
**Version:** 2.0 — replaces PRD-07 v1  
**Route:** `/app/toolkit/workflow-canvas`  
**Artefact type:** `workflow` (n8n JSON)  
**Depends on:** PRD-01 (App Shell), PRD-05 (My Toolkit), PRD-06 (My Artefacts)

**Key change from v1:** The primary JSON generation path is now **Claude API + system prompt knowledge injection** (Option A). The deterministic TypeScript template assembler is retained as a **fallback only**. A future Option B upgrade path (hosted n8n-MCP SSE endpoint) is documented in Section 14.

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
- Click `Approve & Export →` triggers JSON generation (see Section 8)
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

## 8. n8n JSON Generation — Technical Architecture (v2)

### Overview: Two-layer approach with primary AI path and TypeScript fallback

```
User approves workflow
        ↓
PRIMARY PATH: Claude API call with n8n knowledge block in system prompt
        ↓
Client-side JSON validator checks structure
        ↓
Pass?  ──Yes──→  Offer download
        │
        No (up to 3 retries with errors fed back)
        ↓
Still failing?
        ↓
FALLBACK PATH: TypeScript template assembler (deterministic)
        ↓
Offer download
```

The AI generates the full n8n JSON directly — it is not restricted to a logical intermediate at export time. The intermediate is only stored in Supabase for artefact purposes. The JSON that gets downloaded is AI-generated (primary) or template-assembled (fallback).

---

### Step 1: Logical Intermediate (stored in Supabase)

The intermediate is produced when the user first clicks `Parse Workflow →`. It is a clean, human-readable JSON representation of the workflow. This is what gets saved to the `artefacts` table. The n8n JSON is generated from this later, on demand.

**Logical Intermediate schema:**
```json
{
  "workflowName": "string",
  "summary": "string",
  "complexity": "simple | moderate | complex",
  "estimatedRunTime": "string",
  "humanInTheLoop": true,
  "nodes": [
    {
      "id": "node_1",
      "name": "string (human-readable, e.g. 'Watch Google Sheet')",
      "type": "trigger | action | ai | condition | transform | output",
      "service": "string (e.g. 'Google Sheets', 'Slack', 'Claude')",
      "n8nNodeKey": "string (from approved key list — see Section 12)",
      "description": "string (one sentence describing what this step does)",
      "configRequirements": ["string (e.g. 'Connect Google account', 'Add API key')"]
    }
  ]
}
```

---

### Step 2: AI JSON Generation (Primary Path)

When `Approve & Export →` is clicked, a new API call is made. This call passes:
- The approved intermediate
- The full n8n system prompt knowledge block (see Appendix A)
- An instruction to produce complete n8n JSON

**API call structure:**
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: N8N_SYSTEM_PROMPT,   // see Appendix A — injected at build time as a constant
    messages: [
      {
        role: "user",
        content: `Generate a complete, valid n8n workflow JSON for the following workflow. 
Respond ONLY with the raw JSON object. No markdown, no code fences, no explanation.

Workflow to build:
${JSON.stringify(intermediate, null, 2)}`
      }
    ]
  })
});

const data = await response.json();
const rawJson = data.content[0].text.trim();
```

---

### Step 3: Client-Side Validation Loop

After AI generates the JSON string, validate it before offering the download. Run up to **3 retries** with errors fed back.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateN8nWorkflow(jsonString: string): ValidationResult {
  const errors: string[] = [];
  
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { valid: false, errors: ["Response is not valid JSON"] };
  }

  // Top-level structure
  if (!parsed.nodes || !Array.isArray(parsed.nodes))
    errors.push("Missing 'nodes' array");
  if (!parsed.connections || typeof parsed.connections !== "object")
    errors.push("Missing 'connections' object");
  if (!parsed.name || typeof parsed.name !== "string")
    errors.push("Missing workflow 'name'");

  if (parsed.nodes) {
    const nodeIds = new Set<string>();

    // Exactly one trigger node
    const triggerNodes = parsed.nodes.filter((n: any) =>
      n.type && (
        n.type.includes("Trigger") ||
        n.type.includes("trigger") ||
        n.type === "n8n-nodes-base.webhook"
      )
    );
    if (triggerNodes.length === 0)
      errors.push("No trigger node found — workflow must start with a trigger");
    if (triggerNodes.length > 1)
      errors.push(`Multiple trigger nodes found (${triggerNodes.length}) — only one is allowed`);

    parsed.nodes.forEach((node: any, i: number) => {
      const label = node.name || `Node at index ${i}`;

      // Required fields per node
      if (!node.id) errors.push(`${label}: missing 'id'`);
      if (!node.name) errors.push(`${label}: missing 'name'`);
      if (!node.type) errors.push(`${label}: missing 'type'`);
      if (typeof node.typeVersion !== "number")
        errors.push(`${label}: 'typeVersion' must be a number`);
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2)
        errors.push(`${label}: 'position' must be [x, y] array`);
      if (typeof node.parameters !== "object")
        errors.push(`${label}: 'parameters' must be an object`);

      // Duplicate IDs
      if (node.id) {
        if (nodeIds.has(node.id))
          errors.push(`Duplicate node id: '${node.id}'`);
        nodeIds.add(node.id);
      }
    });

    // Validate connections reference real node names
    if (parsed.connections) {
      const nodeNames = new Set(parsed.nodes.map((n: any) => n.name));
      Object.keys(parsed.connections).forEach(sourceName => {
        if (!nodeNames.has(sourceName))
          errors.push(`Connection references unknown source node: '${sourceName}'`);
        const outputs = parsed.connections[sourceName];
        if (outputs.main) {
          outputs.main.forEach((branch: any[]) => {
            branch.forEach((conn: any) => {
              if (!nodeNames.has(conn.node))
                errors.push(`Connection references unknown target node: '${conn.node}'`);
            });
          });
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Retry loop:**
```typescript
async function generateWithRetry(intermediate: WorkflowIntermediate): Promise<string> {
  let lastJson = "";
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const prompt = attempt === 1
      ? buildGeneratePrompt(intermediate)
      : buildRetryPrompt(intermediate, lastJson, lastErrors);

    const json = await callClaudeApi(prompt);
    const result = validateN8nWorkflow(json);

    if (result.valid) return json;

    lastJson = json;
    lastErrors = result.errors;
  }

  // All retries failed — fall back to TypeScript assembler
  console.warn("AI generation failed after 3 attempts. Using fallback assembler.");
  return assembleN8nWorkflow(intermediate);
}

function buildRetryPrompt(
  intermediate: WorkflowIntermediate,
  previousJson: string,
  errors: string[]
): string {
  return `Your previous n8n JSON had validation errors. Fix ALL of the following errors and regenerate the complete workflow JSON. Respond ONLY with the corrected JSON.

Errors to fix:
${errors.map(e => `- ${e}`).join("\n")}

Original workflow specification:
${JSON.stringify(intermediate, null, 2)}

Your previous (broken) JSON for reference:
${previousJson.slice(0, 2000)}...`;
}
```

---

### Step 4: Fallback — TypeScript Template Assembler

If all 3 AI generation attempts fail validation, the TypeScript assembler runs. This is purely deterministic — it maps each `n8nNodeKey` to a pre-built node template and assembles the JSON mechanically.

**`src/utils/assembleN8nWorkflow.ts`**
```
function assembleN8nWorkflow(intermediate: WorkflowIntermediate): string

1. For each node in intermediate.nodes:
   a. Look up template by n8nNodeKey from src/data/n8nNodeTemplates.ts
   b. If key not found: use httpRequest template + add advisory sticky note
   c. Assign: id (UUID v4), name (node.name), position ([250 + i*250, 300])
   d. Merge template properties with node-specific overrides

2. Add stickyNote node at position [250, 150] with setup instructions

3. Build connections object (linear chain, with branch handling for 'if' nodes)

4. Assemble top-level wrapper:
   {
     "name": intermediate.workflowName,
     "nodes": [...],
     "connections": {...},
     "active": false,
     "settings": { "executionOrder": "v1" },
     "meta": {
       "templateCredsSetupCompleted": false,
       "generatedBy": "Oxygy AI Upskilling Platform",
       "generationMethod": "template-fallback"
     }
   }

5. Return JSON.stringify(result, null, 2)
```

The fallback produces correct JSON but with generic parameters. It is always importable — just requires more manual configuration by the user.

---

### Supabase write (on Save to Artefacts)
```ts
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

The n8n JSON is never stored in Supabase. It is generated on demand from the intermediate every time the user exports.

---

## 9. AI Prompt Architecture

### Prompt A: Parse description → Logical Intermediate

Called once when the user submits their plain-English description.

**System message:**
```
You are an n8n workflow architect helping learners on an AI upskilling programme.
Parse a plain-English workflow description into a structured node breakdown.
Respond ONLY with valid JSON matching the WorkflowIntermediate schema below. No markdown, no code fences, no explanation.

SCHEMA:
{
  "workflowName": "string — concise name for this workflow",
  "summary": "string — one sentence description",
  "complexity": "simple | moderate | complex",
  "estimatedRunTime": "string — e.g. '< 30 seconds', '1-2 minutes'",
  "humanInTheLoop": boolean,
  "nodes": [
    {
      "id": "node_1",
      "name": "string — human-readable step name",
      "type": "trigger | action | ai | condition | transform | output",
      "service": "string — app/service name (e.g. 'Google Sheets')",
      "n8nNodeKey": "string — from approved list below",
      "description": "string — one sentence: what this step does",
      "configRequirements": ["string"]
    }
  ]
}

APPROVED n8nNodeKey VALUES (use only these):
webhook, schedule, googleSheetsTrigger, googleSheets, gmail, emailSend, slack, discord,
telegram, microsoftOutlook, airtable, notion, googleDrive, dropbox, hubspot, typeform,
postgres, supabase, claudeAi, openAi, httpRequest, set, if, filter, merge,
splitInBatches, code, wait, respondToWebhook, stickyNote

RULES:
- First node must always be type "trigger"
- 3–8 nodes total
- humanInTheLoop: true if any step involves irreversible actions (sending emails, writing to databases, posting publicly)
- Use "httpRequest" as fallback n8nNodeKey if no exact match exists
```

---

### Prompt B: AI Review of user-designed workflow

Called when user clicks `Get AI Feedback →` on the design-myself path.

**System message:**
```
You are an expert n8n workflow reviewer. Analyse the provided workflow for structural issues, missing error handling, and best practice violations.
Respond ONLY with valid JSON matching the schema below.

SCHEMA:
{
  "issues": [
    {
      "nodeId": "string — id of the affected node",
      "severity": "blocking | advisory",
      "message": "string — concise, actionable description of the issue"
    }
  ],
  "overallAssessment": "string — 1-2 sentence summary",
  "readyToApprove": boolean
}

BLOCKING issues (prevent approval):
- No trigger node as first step
- A condition/if node with no handling for one branch
- An AI node with no downstream node to receive its output
- Circular connections

ADVISORY issues (show warning, don't block):
- Missing error handling for external API nodes
- No human-in-the-loop step before an irreversible output
- AI node with no system prompt defined
- More than 2 sequential AI calls without a merge/check step
```

---

### Prompt C: Refine AI-generated workflow from user feedback

Called when user submits feedback on the AI-build path. Returns an updated full intermediate.

**System message:**
```
You are an n8n workflow architect. Update the provided workflow according to the user's feedback.
Return the complete updated workflow as JSON matching the WorkflowIntermediate schema.
Preserve any nodes in the lockedNodes array exactly — do not modify them.
Respond ONLY with valid JSON. No markdown, no explanation.
```

**User message structure:**
```
Current workflow:
${JSON.stringify(currentIntermediate)}

Locked nodes (do not modify):
${JSON.stringify(lockedNodes)}

User feedback:
${feedbackText}
```

---

### Prompt D: Full n8n JSON generation (Primary Export Path)

Called at export time. System prompt = full N8N_SYSTEM_PROMPT constant (see Appendix A).

**User message:**
```
Generate a complete, valid n8n workflow JSON for the following workflow.
Respond ONLY with the raw JSON object. No markdown, no code fences, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}
```

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

## 12. Content Data — Approved Node Key List

The `n8nNodeKey` field in the intermediate must use only these values. The primary AI path generates correct n8n type strings from these keys using the knowledge in Appendix A.

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
| `typeform` | Typeform Trigger | `typeformApi` |
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

### Generation method indicator
The export UI should show which generation method was used. In Panel 1 (Download block), add a small badge below the stats row:
- Primary AI path: `✦ AI-generated workflow` — teal text, `#E6FFFA` bg, 10px 700
- Fallback path: `◈ Template-assembled workflow` — `#718096` text, `#F7FAFC` bg, 10px 700

This is helpful for debugging and transparency with users.

### N8N_SYSTEM_PROMPT as a constant
The full n8n knowledge block (Appendix A) should be stored as a TypeScript constant at the top of `WorkflowCanvas.tsx` or in a dedicated `src/constants/n8nSystemPrompt.ts` file. It is injected at the API call site. It does not change per-user or per-workflow.

### JSON stripping before parse
The Claude API sometimes wraps JSON in markdown fences despite instructions. Always strip before parsing:
```typescript
function extractJson(raw: string): string {
  // Remove markdown fences if present
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
```

### Credentials in generated JSON
All credential fields should use placeholder format: `{ "id": "YOUR_CREDENTIAL_ID", "name": "Your [Service] Account" }`. These are intentionally placeholder — n8n will prompt the user to connect their own credentials on import.

### The stickyNote node
Every generated workflow must include one `n8n-nodes-base.stickyNote` node at approximately position `[250, 150]` (above the trigger). Its content should be dynamically generated from the workflow's `configRequirements` array:

```
🔧 SETUP REQUIRED — [Workflow Name]

Generated by Oxygy AI Upskilling Platform. Before activating this workflow:

1. Connect your credentials:
   [list each configRequirement]

2. Test with sample data before activating

3. Review AI node prompts — edit the system prompt to match your specific use case

Generated on [date]. Workflow complexity: [complexity].
```

### AI node system prompt placeholders
For any `claudeAi` or `openAi` node, the `options.systemPrompt` field should contain a descriptive placeholder: `"YOUR_SYSTEM_PROMPT_HERE — describe the AI's role, what it should do, and the format of its output. Use the Oxygy Prompt Playground (Level 1) or Agent Builder (Level 2) to craft this."`

### humanInTheLoop advisory banner
If `intermediate.humanInTheLoop === true`, display an advisory banner above the Approve gate: `💡 This workflow performs irreversible actions. Consider adding a manual review step before the output. n8n's "Wait" node can pause execution for human approval.` Advisory only — does not block approval.

### Existing artefact handling
If the user already has a `workflow` artefact saved, clicking `Save to Artefacts →` shows inline confirmation: `You already have a saved workflow. Replace it with this one? [Cancel] [Replace]`. On confirm: upsert where `user_id = current` and `artefact_type = "workflow"`.

### Iteration cap
The feedback → regenerate loop is capped at **5 iterations** per session. After 5: `You've refined this workflow 5 times. Approve the current version or start over.` The Approve button remains active; Start Over resets the tool entirely.

### No draft saving
No auto-save. A `beforeunload` warning fires if navigating away from an unsaved workflow: `You have an unsaved workflow. Leave anyway?`

### Cross-tool link routing
- `Open Prompt Playground →` → `/app/toolkit/prompt-playground`
- `Open Agent Builder →` → `/app/toolkit/agent-builder`
- Locked if `current_level < 1` or `< 2` respectively — show `Unlocks at Level N` in muted grey, no navigation

### Option B upgrade path
When ready to upgrade to a hosted n8n-MCP endpoint, the change required is minimal:
1. Deploy `czlonkowski/n8n-mcp` as a public SSE endpoint (Railway or Render)
2. In the export API call, add: `mcp_servers: [{ type: "url", url: "YOUR_MCP_URL/sse", name: "n8n-mcp" }]`
3. Update Prompt D to instruct Claude to use `search_nodes` and `validate_workflow` MCP tools instead of relying solely on the knowledge block
4. The validation loop (Section 8 Step 3) can be simplified — defer to MCP validation

---

## 14. New Files Required

```
src/
├── pages/app/
│   └── WorkflowCanvas.tsx                    ← main page component
├── components/app/workflow/
│   ├── StepStrip.tsx
│   ├── PathChooserCard.tsx
│   ├── NodeCard.tsx
│   ├── NodeTypeBadge.tsx
│   ├── EditNodeModal.tsx
│   ├── FeedbackInputRow.tsx
│   ├── ApprovalBanner.tsx
│   └── ExportCard.tsx
├── constants/
│   └── n8nSystemPrompt.ts                    ← N8N_SYSTEM_PROMPT constant (from Appendix A)
├── utils/
│   ├── assembleN8nWorkflow.ts                ← fallback TypeScript assembler
│   └── validateN8nWorkflow.ts                ← client-side validator
└── data/
    └── n8nNodeTemplates.ts                   ← 30-node fallback template library
```

Route: add `/app/toolkit/workflow-canvas` to the router in `src/App.tsx`.

---

## 15. Success Criteria

- [ ] All 3 steps render and transition correctly
- [ ] Both paths (design-myself and AI-builds) reach the Approve gate
- [ ] AI feedback renders as node-level annotations, not a generic panel
- [ ] Primary AI path generates JSON that imports into n8n Cloud without errors for the 10 most common node types
- [ ] Fallback assembler activates when AI validation fails 3 times
- [ ] Generation method badge is displayed correctly in export card
- [ ] The stickyNote node appears inside the imported workflow with accurate setup instructions
- [ ] Variables-to-configure list dynamically generated from actual workflow nodes
- [ ] Cross-tool links navigate correctly and show lock state when inaccessible
- [ ] Save to Artefacts writes the logical intermediate (not the n8n JSON) to Supabase
- [ ] `beforeunload` warning fires when navigating away from an unsaved workflow
- [ ] All responsive breakpoints pass visual review
- [ ] No drop shadows, no purple gradients, no Inter/Roboto fonts

---

## Appendix A: N8N_SYSTEM_PROMPT Knowledge Block

This is the full content of `src/constants/n8nSystemPrompt.ts`. Store as a TypeScript template literal.

```typescript
export const N8N_SYSTEM_PROMPT = `
You are an expert n8n workflow engineer. Your task is to generate complete, valid, production-ready n8n workflow JSON files that can be imported directly into n8n Cloud or n8n self-hosted with no manual JSON editing required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: N8N WORKFLOW JSON STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every n8n workflow JSON must have this top-level structure:
{
  "name": "string — workflow display name",
  "nodes": [ ...array of node objects... ],
  "connections": { ...connection map... },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "meta": {
    "templateCredsSetupCompleted": false,
    "generatedBy": "Oxygy AI Upskilling Platform"
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: NODE OBJECT SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every node object must include ALL of these fields:
{
  "id": "uuid-v4-string",          // unique UUID per node — generate a fresh UUID4 for each
  "name": "string",                 // human-readable display name — can be the same as type alias
  "type": "string",                 // exact n8n type string — see Section 3
  "typeVersion": number,            // exact version number — see Section 3
  "position": [x, y],              // integer array — see Section 5 for layout rules
  "parameters": { ... },           // node-specific parameters — see Section 3
  "credentials": { ... }           // credential references — omit for nodes that need none
}

CRITICAL: typeVersion must be a NUMBER (e.g. 2, not "2"). Never a string.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: NODE REFERENCE LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use EXACTLY these type strings and typeVersion values. Do not invent type strings.

── TRIGGERS ──

WEBHOOK TRIGGER
type: "n8n-nodes-base.webhook"
typeVersion: 2
parameters: {
  "httpMethod": "POST",
  "path": "your-webhook-path",
  "responseMode": "onReceived",
  "options": {}
}
// No credentials needed. n8n generates the webhook URL automatically.

SCHEDULE TRIGGER
type: "n8n-nodes-base.scheduleTrigger"
typeVersion: 1.2
parameters: {
  "rule": {
    "interval": [{ "field": "weeks", "weeksInterval": 1, "triggerAtDay": [1], "triggerAtHour": 9 }]
  }
}
// Adjust interval/field/triggerAtDay/triggerAtHour as needed. No credentials.

GOOGLE SHEETS TRIGGER
type: "n8n-nodes-base.googleSheetsTrigger"
typeVersion: 1
parameters: {
  "documentId": { "__rl": true, "value": "YOUR_SPREADSHEET_ID", "mode": "id" },
  "sheetName": { "__rl": true, "value": "Sheet1", "mode": "name" },
  "event": "rowAdded",
  "pollTime": { "mode": "everyMinute" }
}
credentials: { "googleSheetsOAuth2Api": { "id": "YOUR_CREDENTIAL_ID", "name": "Google Sheets account" } }

TYPEFORM TRIGGER
type: "n8n-nodes-base.typeformTrigger"
typeVersion: 1
parameters: { "formId": "YOUR_FORM_ID" }
credentials: { "typeformApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Typeform account" } }

── ACTIONS / INTEGRATIONS ──

GOOGLE SHEETS (read/write)
type: "n8n-nodes-base.googleSheets"
typeVersion: 4.5
parameters: {
  "operation": "append",          // or "read", "update", "delete"
  "documentId": { "__rl": true, "value": "YOUR_SPREADSHEET_ID", "mode": "id" },
  "sheetName": { "__rl": true, "value": "Sheet1", "mode": "name" },
  "columns": { "mappingMode": "autoMapInputData", "value": {}, "matchingColumns": [] }
}
credentials: { "googleSheetsOAuth2Api": { "id": "YOUR_CREDENTIAL_ID", "name": "Google Sheets account" } }

GMAIL (send email)
type: "n8n-nodes-base.gmail"
typeVersion: 2.1
parameters: {
  "resource": "message",
  "operation": "send",
  "toList": "={{ $json.email }}",
  "subject": "Your subject here",
  "message": "={{ $json.body }}",
  "options": {}
}
credentials: { "gmailOAuth2": { "id": "YOUR_CREDENTIAL_ID", "name": "Gmail account" } }

EMAIL SEND (SMTP — use when not Gmail-specific)
type: "n8n-nodes-base.emailSend"
typeVersion: 2.1
parameters: {
  "toList": "={{ $json.email }}",
  "subject": "Your subject here",
  "message": "={{ $json.body }}",
  "options": {}
}
credentials: { "smtp": { "id": "YOUR_CREDENTIAL_ID", "name": "SMTP account" } }

SLACK
type: "n8n-nodes-base.slack"
typeVersion: 2.3
parameters: {
  "resource": "message",
  "operation": "post",
  "channel": { "__rl": true, "value": "YOUR_CHANNEL_ID", "mode": "id" },
  "text": "={{ $json.output }}",
  "otherOptions": {}
}
credentials: { "slackApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Slack account" } }

MICROSOFT OUTLOOK
type: "n8n-nodes-base.microsoftOutlook"
typeVersion: 2
parameters: {
  "resource": "message",
  "operation": "send",
  "toRecipients": "={{ $json.email }}",
  "subject": "Your subject",
  "bodyContent": "={{ $json.body }}",
  "additionalFields": {}
}
credentials: { "microsoftOutlookOAuth2Api": { "id": "YOUR_CREDENTIAL_ID", "name": "Outlook account" } }

AIRTABLE
type: "n8n-nodes-base.airtable"
typeVersion: 2.1
parameters: {
  "resource": "record",
  "operation": "create",
  "base": { "__rl": true, "value": "YOUR_BASE_ID", "mode": "id" },
  "table": { "__rl": true, "value": "YOUR_TABLE_NAME", "mode": "name" },
  "fields": { "fieldMappingMode": "autoMapInputData", "value": {}, "schema": [] }
}
credentials: { "airtableTokenApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Airtable account" } }

NOTION (create page)
type: "n8n-nodes-base.notion"
typeVersion: 2.2
parameters: {
  "resource": "page",
  "operation": "create",
  "databaseId": { "__rl": true, "value": "YOUR_DATABASE_ID", "mode": "id" },
  "title": "={{ $json.title }}",
  "propertiesUi": { "propertyValues": [] }
}
credentials: { "notionApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Notion account" } }

GOOGLE DRIVE (upload file)
type: "n8n-nodes-base.googleDrive"
typeVersion: 3
parameters: {
  "resource": "file",
  "operation": "upload",
  "name": "={{ $json.filename }}",
  "folderId": { "__rl": true, "value": "YOUR_FOLDER_ID", "mode": "id" }
}
credentials: { "googleDriveOAuth2Api": { "id": "YOUR_CREDENTIAL_ID", "name": "Google Drive account" } }

HUBSPOT (create contact)
type: "n8n-nodes-base.hubspot"
typeVersion: 2
parameters: {
  "resource": "contact",
  "operation": "create",
  "additionalFields": {}
}
credentials: { "hubspotApi": { "id": "YOUR_CREDENTIAL_ID", "name": "HubSpot account" } }

SUPABASE (insert row)
type: "n8n-nodes-base.supabase"
typeVersion: 1
parameters: {
  "operation": "insert",
  "tableId": "your_table_name",
  "fieldsUi": { "fieldValues": [] }
}
credentials: { "supabaseApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Supabase account" } }

POSTGRES (execute query)
type: "n8n-nodes-base.postgres"
typeVersion: 2.5
parameters: {
  "operation": "executeQuery",
  "query": "SELECT * FROM your_table WHERE id = $1",
  "additionalFields": {}
}
credentials: { "postgres": { "id": "YOUR_CREDENTIAL_ID", "name": "Postgres account" } }

HTTP REQUEST (generic API call)
type: "n8n-nodes-base.httpRequest"
typeVersion: 4.2
parameters: {
  "method": "POST",
  "url": "https://api.yourservice.com/endpoint",
  "authentication": "genericCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [{ "name": "Content-Type", "value": "application/json" }]
  },
  "sendBody": true,
  "bodyParameters": { "parameters": [] }
}
// Credentials vary — set manually by user

DISCORD (send message)
type: "n8n-nodes-base.discord"
typeVersion: 2
parameters: {
  "resource": "message",
  "operation": "send",
  "channelId": { "__rl": true, "value": "YOUR_CHANNEL_ID", "mode": "id" },
  "content": "={{ $json.message }}"
}
credentials: { "discordApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Discord account" } }

TELEGRAM (send message)
type: "n8n-nodes-base.telegram"
typeVersion: 1.2
parameters: {
  "resource": "message",
  "operation": "sendMessage",
  "chatId": "YOUR_CHAT_ID",
  "text": "={{ $json.message }}",
  "additionalFields": {}
}
credentials: { "telegramApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Telegram account" } }

DROPBOX (upload file)
type: "n8n-nodes-base.dropbox"
typeVersion: 1
parameters: {
  "resource": "file",
  "operation": "upload",
  "path": "/your-folder/={{ $json.filename }}",
  "binaryPropertyName": "data"
}
credentials: { "dropboxApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Dropbox account" } }

── AI / LLM NODES ──

CLAUDE (Anthropic) — used as a standalone AI step in Basic LLM Chain
type: "@n8n/n8n-nodes-langchain.lmChatAnthropic"
typeVersion: 1.3
parameters: {
  "model": "claude-sonnet-4-20250514",
  "options": {
    "systemPrompt": "YOUR_SYSTEM_PROMPT_HERE — describe the AI's role and output format"
  }
}
credentials: { "anthropicApi": { "id": "YOUR_CREDENTIAL_ID", "name": "Anthropic API" } }

// When using Claude in a chain, pair it with the Basic LLM Chain node:
BASIC LLM CHAIN (wrapper for Claude/OpenAI)
type: "@n8n/n8n-nodes-langchain.chainLlm"
typeVersion: 1.4
parameters: {
  "promptType": "define",
  "text": "={{ $json.inputText }}",
  "messages": { "messageValues": [] }
}
// Connect the Claude/OpenAI LLM node as a sub-node input

OPENAI
type: "@n8n/n8n-nodes-langchain.lmChatOpenAi"
typeVersion: 1.2
parameters: {
  "model": { "__rl": true, "value": "gpt-4o", "mode": "list" },
  "options": {}
}
credentials: { "openAiApi": { "id": "YOUR_CREDENTIAL_ID", "name": "OpenAI account" } }

── UTILITY / LOGIC NODES ──

SET / EDIT FIELDS (data transformation)
type: "n8n-nodes-base.set"
typeVersion: 3.4
parameters: {
  "mode": "manual",
  "fields": {
    "values": [
      { "name": "outputField", "type": "string", "value": "={{ $json.inputField }}" }
    ]
  },
  "options": {}
}
// No credentials needed

IF CONDITION (branching)
type: "n8n-nodes-base.if"
typeVersion: 2.2
parameters: {
  "conditions": {
    "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict" },
    "conditions": [
      {
        "id": "condition_1",
        "leftValue": "={{ $json.fieldName }}",
        "rightValue": "your_value",
        "operator": {
          "type": "string",
          "operation": "equals"     // or: notEquals, contains, startsWith, endsWith, exists
        }
      }
    ],
    "combinator": "and"
  }
}
// IMPORTANT: binary operators (equals, contains, etc.) must NOT have singleValue: true

FILTER
type: "n8n-nodes-base.filter"
typeVersion: 2
parameters: {
  "conditions": {
    "conditions": [
      {
        "id": "filter_1",
        "leftValue": "={{ $json.fieldName }}",
        "rightValue": "value_to_check",
        "operator": { "type": "string", "operation": "contains" }
      }
    ],
    "combinator": "and"
  },
  "options": {}
}

MERGE
type: "n8n-nodes-base.merge"
typeVersion: 3
parameters: {
  "mode": "combine",
  "combinationMode": "mergeByPosition",
  "options": {}
}

SPLIT IN BATCHES (loop processing)
type: "n8n-nodes-base.splitInBatches"
typeVersion: 3
parameters: {
  "batchSize": 10,
  "options": {}
}

CODE (custom JavaScript)
type: "n8n-nodes-base.code"
typeVersion: 2
parameters: {
  "jsCode": "// Write your JavaScript here\\n// Access input: items[0].json.fieldName\\n// Return array of objects\\nreturn items.map(item => ({\\n  json: {\\n    ...item.json,\\n    processedAt: new Date().toISOString()\\n  }\\n}));"
}
// No credentials needed

WAIT (pause for time or webhook)
type: "n8n-nodes-base.wait"
typeVersion: 1.1
parameters: {
  "resume": "timeInterval",
  "unit": "hours",
  "amount": 1,
  "options": {}
}

RESPOND TO WEBHOOK (return response to caller)
type: "n8n-nodes-base.respondToWebhook"
typeVersion: 1.1
parameters: {
  "respondWith": "json",
  "responseBody": "={{ JSON.stringify($json) }}",
  "options": { "responseCode": 200 }
}
// Only valid in workflows triggered by a Webhook node

STICKY NOTE (documentation node — always include one per workflow)
type: "n8n-nodes-base.stickyNote"
typeVersion: 1
parameters: {
  "content": "## Setup Instructions\\n\\nReplace all YOUR_* placeholders before activating.\\n\\n**Credentials to connect:**\\n- List each service here",
  "height": 200,
  "width": 380,
  "color": 5
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: EXPRESSION SYNTAX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

n8n expressions MUST always be wrapped in {{ }}. Never use ${} or bare variable names.

ACCESSING DATA:
{{ $json.fieldName }}                        // current item's JSON field
{{ $json.body.fieldName }}                   // webhook data is under .body
{{ $json.body.email }}                       // e.g. webhook form field 'email'
{{ $node["Node Name"].json.fieldName }}      // specific node's output
{{ $items("Node Name")[0].json.fieldName }}  // first item from a named node

DATE AND TIME:
{{ $now.toISO() }}                           // current time as ISO string
{{ DateTime.now().toFormat("yyyy-MM-dd") }}  // formatted date
{{ $now.minus({ days: 7 }).toISO() }}        // 7 days ago

STRING OPERATIONS:
{{ $json.name.toLowerCase() }}
{{ $json.firstName + " " + $json.lastName }}
{{ $json.text.slice(0, 100) }}

CONDITIONAL EXPRESSIONS:
{{ $json.score > 80 ? "pass" : "fail" }}
{{ $json.status === "active" ? $json.email : "no-reply@company.com" }}

JSON HANDLING IN CODE NODES:
// In Code nodes, access data via items array:
const data = items[0].json;
return items.map(item => ({ json: { output: item.json.field } }));

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: CONNECTIONS SCHEMA AND NODE POSITIONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONNECTIONS OBJECT FORMAT:
{
  "Source Node Name": {
    "main": [
      [
        { "node": "Target Node Name", "type": "main", "index": 0 }
      ]
    ]
  }
}

For IF nodes (two branches):
{
  "IF Condition": {
    "main": [
      // main[0] = TRUE branch
      [ { "node": "True Path Node", "type": "main", "index": 0 } ],
      // main[1] = FALSE branch
      [ { "node": "False Path Node", "type": "main", "index": 0 } ]
    ]
  }
}

For Basic LLM Chain + AI model sub-node connection:
// The AI model (Claude/OpenAI) connects to the chain via "ai_languageModel":
{
  "Claude": {
    "ai_languageModel": [
      [ { "node": "Basic LLM Chain", "type": "ai_languageModel", "index": 0 } ]
    ]
  }
}

NODE POSITIONING RULES:
- Sticky Note: position [250, 150]
- Trigger node: position [500, 300]
- Subsequent nodes: increment X by 250 each time
  - Node 2: [750, 300]
  - Node 3: [1000, 300]
  - Node 4: [1250, 300]
- For IF branches: true branch continues horizontally; false branch drops to Y+200
- AI sub-nodes (model): position 100px above their parent chain node

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: FIVE COMMON WORKFLOW PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATTERN 1: WEBHOOK → AI PROCESS → RESPOND
Best for: form submissions, API integrations, real-time events
Nodes: Webhook → Set (extract fields) → Basic LLM Chain + Claude → Respond to Webhook

PATTERN 2: SCHEDULE → PULL → PROCESS → OUTPUT
Best for: reports, digests, regular data processing
Nodes: Schedule → Google Sheets (read) → Basic LLM Chain + Claude → Gmail (send)

PATTERN 3: TRIGGER → VALIDATE → BRANCH → ROUTE
Best for: conditional workflows, approval routing, tiered responses
Nodes: Webhook/Trigger → IF Condition → [TRUE: process A] | [FALSE: process B]

PATTERN 4: TRIGGER → AI ANALYSIS → MULTI-CHANNEL OUTPUT
Best for: notifications, alerts, broadcast updates
Nodes: Trigger → Basic LLM Chain + Claude → [Slack + Email + Notion in parallel]

PATTERN 5: BATCH LOOP PROCESSING
Best for: processing lists of items, bulk operations
Nodes: Trigger → Google Sheets (read all) → Split in Batches → process each → Merge → Output

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: VALIDATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY RULES — violating these will cause import errors:
1. Every workflow must have exactly one trigger node
2. The trigger node must have no incoming connections
3. Every node.id must be a unique UUID string
4. Every node.id referenced in connections must exist in the nodes array
5. typeVersion must be a number, not a string
6. position must be an [x, y] integer array
7. parameters must be an object (never null or undefined)
8. Binary operators in IF/Filter nodes must NOT have singleValue: true
9. n8n expressions use {{ }} — never ${} or bare variable references

BEST PRACTICES:
- Always include a stickyNote node with setup instructions
- Always set "active": false on generated workflows
- Credential objects always use { "id": "YOUR_CREDENTIAL_ID", "name": "descriptive name" }
- For AI nodes: always provide a meaningful systemPrompt placeholder
- For webhook workflows: pair with Respond to Webhook as the last node
- For batch workflows: always use Merge after Split in Batches completes

RESPOND WITH:
Complete, valid n8n workflow JSON only. No markdown fences, no explanation, no preamble.
The response must be parseable by JSON.parse() without any pre-processing.
`;
```

---

*End of PRD-07 v2*
