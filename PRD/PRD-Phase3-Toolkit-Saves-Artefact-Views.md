# PRD: Phase 3 — Toolkit Save Flows & Artefact Detail Views

> **Status:** Ready for implementation
> **Author:** Oxygy Design Agent
> **Date:** 2026-03-16
> **Depends on:** Phase 1 (Auth, Artefacts table), Phase 2 (Progress tracking)
> **Codebase ref:** `https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site.git`

---

## 1. Overview

### Problem

Right now, every toolkit tool saves to the database through the same function — `dbSavePrompt()` — which creates every artefact as `type: 'prompt'` with plain-text content. This means:

- An Agent Builder system prompt and a Prompt Playground prompt look identical in the Artefacts page
- Build guides and PRDs are stored as unstructured text blobs, not structured JSONB
- Some tools have two save actions (system prompt + build plan) that both create the same type
- The artefact detail panel (QuickUsePanel) renders mock content because the real saved content doesn't match the expected JSONB structure
- The new `build_guide` and `prd` types from Phase 1 are defined in the schema but nothing saves to them yet

### What this phase delivers

1. **Type-correct saves** — each toolkit tool saves with the proper artefact type and structured JSONB content
2. **Dual-artefact saves** — tools with two outputs (e.g., Agent Builder's system prompt + build plan) create two separate artefacts with distinct types
3. **New content renderers** — `BuildGuideContent` and `PrdContent` components for the Artefacts page detail panel
4. **Updated existing renderers** — all five existing content renderers updated to handle the real structured JSONB from toolkit saves
5. **Complete type maps** — all UI components (QuickUsePanel, ArtefactGrid, SearchFilterBar, ArtefactCard) updated to handle all seven artefact types
6. **"Open in Tool" flow** — clicking an artefact optionally lets the user open the associated toolkit tool pre-loaded with that artefact's data

---

## 2. Artefact Type → Toolkit Tool Mapping

| Artefact Type | Created By | Level | Content Structure | Preview Source |
|---------------|-----------|-------|-------------------|---------------|
| `prompt` | Prompt Playground | 1 | `{ promptText, strategies, userInput }` | First 200 chars of `promptText` |
| `agent` | Agent Builder | 2 | `{ systemPrompt, outputFormat, accountability, readinessScore, taskDescription }` | `"Agent: {taskDescription}"` first 200 chars |
| `build_guide` | Agent Builder, Workflow Canvas, Dashboard Designer, App Evaluator | 2–5 | `{ markdown, platform, toolName }` | `"Build Guide: {taskDescription}"` first 200 chars |
| `workflow` | Workflow Canvas | 3 | `{ designMarkdown, nodeCount, agentCount, humanCheckpoints, nodes, workflowName }` | `"{nodeCount} nodes · {agentCount} agents — {summary}"` |
| `prd` | Dashboard Designer | 4 | `{ prdMarkdown, sections, brief }` | `"PRD: {purpose}"` first 200 chars |
| `dashboard` | Dashboard Designer | 4 | `{ mockupHtml, componentCount, brief }` | `"{componentCount} components — {purpose}"` |
| `app_spec` | App Evaluator | 5 | `{ evaluationMarkdown, designScore, architectureSections, appDescription }` | `"App Spec: {appDescription}"` first 200 chars |

### Key change: Separate deliverables as separate artefacts

Several tools currently have two save buttons that both call `dbSavePrompt` with the same type. After this phase:

| Tool | Primary Save | Secondary Save |
|------|-------------|---------------|
| **Prompt Playground** | `prompt` (the optimised prompt) | — |
| **Agent Builder** | `agent` (the system prompt + output format + accountability) | `build_guide` (the platform-specific setup guide) |
| **Workflow Canvas** | `workflow` (the workflow design) | `build_guide` (the platform build guide) |
| **Dashboard Designer** | `prd` (the PRD) | `build_guide` (the platform build guide) |
| **App Evaluator** | `app_spec` (the evaluation + architecture) | `build_guide` (the build plan) |

This means a single toolkit session can produce **two artefacts** in the user's library.

---

## 3. File Changes — Complete List

| File | Action | Summary |
|------|--------|---------|
| `lib/database.ts` | **Modify** | New `createArtefactFromTool()` helper; deprecate old `savePrompt` usage |
| `hooks/useArtefactsData.ts` | **Modify** | Expand `ArtefactType` and `ArtefactContent` interfaces |
| `components/app/toolkit/AppPromptPlayground.tsx` | **Modify** | Save with structured JSONB content |
| `components/app/toolkit/AppAgentBuilder.tsx` | **Modify** | Split into two saves: `agent` + `build_guide` |
| `components/app/toolkit/AppWorkflowCanvas.tsx` | **Modify** | Split into two saves: `workflow` + `build_guide` |
| `components/app/toolkit/AppDashboardDesigner.tsx` | **Modify** | Split into two saves: `prd` + `build_guide` |
| `components/app/toolkit/AppAppEvaluator.tsx` | **Modify** | Split into two saves: `app_spec` + `build_guide` |
| `components/app/artefacts/content/PromptContent.tsx` | **Modify** | Handle real structured data |
| `components/app/artefacts/content/AgentContent.tsx` | **Modify** | Handle real structured data from Agent Builder |
| `components/app/artefacts/content/WorkflowContent.tsx` | **Modify** | Handle real structured data |
| `components/app/artefacts/content/DashboardContent.tsx` | **Modify** | Handle real structured data |
| `components/app/artefacts/content/AppSpecContent.tsx` | **Modify** | Handle real structured data |
| `components/app/artefacts/content/BuildGuideContent.tsx` | **New** | Renderer for build guide artefacts |
| `components/app/artefacts/content/PrdContent.tsx` | **New** | Renderer for PRD artefacts |
| `components/app/artefacts/QuickUsePanel.tsx` | **Modify** | Add new types to maps, wire new content renderers |
| `components/app/artefacts/ArtefactGrid.tsx` | **Modify** | Add new types to labels and ghost cards |
| `components/app/artefacts/ArtefactCard.tsx` | **Modify** | Add new types to icon/label maps |
| `components/app/artefacts/SearchFilterBar.tsx` | **Modify** | Already updated in Phase 1 — verify `build_guide` and `prd` present |

---

## 4. Database Helper — `lib/database.ts`

### New function: `createArtefactFromTool`

This is the new standard save function that all toolkit tools call. It writes structured JSONB directly to the `artefacts` table.

```typescript
export async function createArtefactFromTool(
  userId: string,
  artefact: {
    name: string;
    type: ArtefactType;
    level: number;
    sourceTool: string;
    content: Record<string, unknown>;  // structured JSONB
    preview: string;
  },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('artefacts')
    .insert({
      user_id: userId,
      name: artefact.name,
      type: artefact.type,
      level: artefact.level,
      source_tool: artefact.sourceTool,
      content: artefact.content,
      preview: artefact.preview.slice(0, 200),
    })
    .select('id')
    .single();
  if (error) { console.error('createArtefactFromTool error:', error); return null; }
  return { id: data.id };
}
```

### Backward compatibility

The existing `savePrompt` function (updated in Phase 1 to write to `artefacts`) remains for backward compatibility but is no longer called by toolkit tools. All toolkit tools migrate to `createArtefactFromTool`.

---

## 5. Toolkit Save Flow Changes

### 5.1 Prompt Playground (`AppPromptPlayground.tsx`)

**Current:** Calls `dbSavePrompt(user.id, { level: 1, title, content: result.prompt, source_tool: 'prompt-playground' })`

**New:**

```typescript
import { createArtefactFromTool } from '../../../lib/database';

const handleSaveToLibrary = async () => {
  if (!result || !user) return;
  const title = userInput.length > 60 ? userInput.slice(0, 60) + '…' : userInput;
  const saved = await createArtefactFromTool(user.id, {
    name: title,
    type: 'prompt',
    level: 1,
    sourceTool: 'prompt-playground',
    content: {
      promptText: result.prompt,
      strategies: result.strategies || [],
      userInput: userInput,
    },
    preview: result.prompt.slice(0, 200),
  });
  if (saved) {
    setSavedToLibrary(true);
    setToastMessage('Saved to your library');
  }
};
```

**Content schema:**
```typescript
{
  promptText: string;      // the full optimised prompt
  strategies: Array<{      // the strategy cards (if available)
    name: string;
    why: string;
    how_applied: string;
    prompt_excerpt: string;
  }>;
  userInput: string;        // the original user input
}
```

### 5.2 Agent Builder (`AppAgentBuilder.tsx`)

**Current:** Two save buttons both call `dbSavePrompt` with `type: 'prompt'`.

**New:** Two distinct save calls creating two different artefact types.

**Save 1 — System Prompt (primary deliverable):**
```typescript
const handleSaveToLibrary = async () => {
  if (!result || !user) return;
  const title = `Agent: ${taskDescription.slice(0, 55)}${taskDescription.length > 55 ? '…' : ''}`;
  const saved = await createArtefactFromTool(user.id, {
    name: title,
    type: 'agent',
    level: 2,
    sourceTool: 'agent-builder',
    content: {
      systemPrompt: result.system_prompt,
      outputFormat: result.output_format,
      accountability: result.accountability,
      readinessScore: result.readiness_score,
      taskDescription: taskDescription,
      inputDescription: inputDescription,
    },
    preview: `Agent: ${taskDescription.slice(0, 180)}`,
  });
  if (saved) {
    setSavedToLibrary(true);
    setToastMessage('Agent saved to your library');
  }
};
```

**Save 2 — Build Plan (secondary deliverable):**
```typescript
const handleSaveBuildPlan = async () => {
  if (!result || !user || !setupGuide) return;
  const md = buildFullBuildPlan();
  const title = `Build Guide: ${taskDescription.slice(0, 50)}${taskDescription.length > 50 ? '…' : ''}`;
  const saved = await createArtefactFromTool(user.id, {
    name: title,
    type: 'build_guide',
    level: 2,
    sourceTool: 'agent-builder',
    content: {
      markdown: md,
      platform: selectedPlatform || 'generic',
      toolName: 'Agent Builder',
      taskDescription: taskDescription,
    },
    preview: `Build Guide: ${taskDescription.slice(0, 180)}`,
  });
  if (saved) {
    setBuildPlanSaved(true);
    setToastMessage('Build guide saved to your library');
  }
};
```

### 5.3 Workflow Canvas (`AppWorkflowCanvas.tsx`)

**Current:** One save that stores stringified JSON as text content.

**New:** Two saves — workflow design + build guide.

**Save 1 — Workflow Design:**
```typescript
const handleSaveToArtefacts = async () => {
  if (!workflowResult || !user) return;
  const saved = await createArtefactFromTool(user.id, {
    name: `Workflow: ${workflowName}`,
    type: 'workflow',
    level: 3,
    sourceTool: 'workflow-canvas',
    content: {
      designMarkdown: workflowResult.design_markdown || '',
      nodeCount: workflowResult.nodes?.length || 0,
      agentCount: workflowResult.nodes?.filter((n: any) => n.type === 'agent').length || 0,
      humanCheckpoints: workflowResult.nodes?.filter((n: any) => n.type === 'human_review').length || 0,
      nodes: workflowResult.nodes || [],
      workflowName: workflowName,
    },
    preview: `${workflowResult.nodes?.length || 0} nodes — ${workflowName}`,
  });
  if (saved) {
    setSavedToArtefacts(true);
    setToastMessage('Workflow saved to your library');
  }
};
```

**Save 2 — Build Guide:**
```typescript
const handleSaveBuildGuide = async () => {
  if (!buildGuideMarkdown || !user) return;
  const saved = await createArtefactFromTool(user.id, {
    name: `Build Guide: ${workflowName}`,
    type: 'build_guide',
    level: 3,
    sourceTool: 'workflow-canvas',
    content: {
      markdown: buildGuideMarkdown,
      platform: selectedPlatform || 'n8n',
      toolName: 'Workflow Canvas',
      taskDescription: workflowDescription,
    },
    preview: `Build Guide (${selectedPlatform}): ${workflowName}`.slice(0, 200),
  });
  if (saved) {
    setBuildGuideSaved(true);
    setToastMessage('Build guide saved to your library');
  }
};
```

### 5.4 Dashboard Designer (`AppDashboardDesigner.tsx`)

**Current:** Two saves — build guide and PRD — both as `type: 'prompt'`.

**New:**

**Save 1 — PRD:**
```typescript
const handleSaveToLibrary = async () => {
  if (!prdResult || !user) return;
  const md = buildFullPRD(prdResult);
  const saved = await createArtefactFromTool(user.id, {
    name: prdResult.prd_content || `PRD: ${brief.q1_purpose.slice(0, 50)}`,
    type: 'prd',
    level: 4,
    sourceTool: 'dashboard-designer',
    content: {
      prdMarkdown: md,
      sections: prdResult.sections || [],
      brief: brief,
    },
    preview: `PRD: ${brief.q1_purpose}`.slice(0, 200),
  });
  if (saved) {
    setSavedToLibrary(true);
    setToastMessage('PRD saved to your library');
  }
};
```

**Save 2 — Build Guide:**
```typescript
const handleSaveBuildGuide = async () => {
  if (!buildGuide || !user) return;
  const md = buildFullBuildGuide();
  const saved = await createArtefactFromTool(user.id, {
    name: `Build Guide: ${brief.q1_purpose.slice(0, 50)}`,
    type: 'build_guide',
    level: 4,
    sourceTool: 'dashboard-designer',
    content: {
      markdown: md,
      platform: selectedPlatform || 'generic',
      toolName: 'Dashboard Designer',
      taskDescription: brief.q1_purpose,
    },
    preview: `Build Guide: ${brief.q1_purpose}`.slice(0, 200),
  });
  if (saved) {
    setBuildPlanSaved(true);
    setToastMessage('Build guide saved to your library');
  }
};
```

### 5.5 App Evaluator (`AppAppEvaluator.tsx`)

**Current:** One save as `type: 'prompt'`.

**New:** Two saves — app spec + build plan.

**Save 1 — App Specification:**
```typescript
const handleSaveAppSpec = async () => {
  if (!evaluationResult || !user) return;
  const saved = await createArtefactFromTool(user.id, {
    name: `App Spec: ${appDescription.slice(0, 55)}${appDescription.length > 55 ? '…' : ''}`,
    type: 'app_spec',
    level: 5,
    sourceTool: 'ai-app-evaluator',
    content: {
      evaluationMarkdown: buildFullEvaluation(evaluationResult),
      designScore: evaluationResult.design_score,
      architectureSections: evaluationResult.architecture || [],
      appDescription: appDescription,
      problemStatement: problemStatement,
    },
    preview: `App Spec: ${appDescription.slice(0, 180)}`,
  });
  if (saved) {
    setSavedToLibrary(true);
    setToastMessage('App spec saved to your library');
  }
};
```

**Save 2 — Build Plan:**
```typescript
const handleSaveBuildPlan = async () => {
  if (!buildPlan || !user) return;
  const fullContent = buildFullBuildPlan(buildPlan);
  const saved = await createArtefactFromTool(user.id, {
    name: `Build Plan: ${appDescription.slice(0, 50)}${appDescription.length > 50 ? '…' : ''}`,
    type: 'build_guide',
    level: 5,
    sourceTool: 'ai-app-evaluator',
    content: {
      markdown: fullContent,
      platform: 'generic',
      toolName: 'App Evaluator',
      taskDescription: appDescription,
    },
    preview: `Build Plan: ${appDescription.slice(0, 180)}`,
  });
  if (saved) {
    setBuildPlanSaved(true);
    setToastMessage('Build plan saved to your library');
  }
};
```

---

## 6. Updated ArtefactContent Interface

### `hooks/useArtefactsData.ts`

Expand the `ArtefactContent` interface to handle all seven types with real structured data:

```typescript
export type ArtefactType =
  | 'prompt' | 'agent' | 'workflow' | 'dashboard' | 'app_spec'
  | 'build_guide' | 'prd';

export interface ArtefactContent {
  // ── Prompt (Level 1) ──
  promptText?: string;
  strategies?: Array<{
    name: string;
    why: string;
    how_applied: string;
    prompt_excerpt: string;
  }>;
  userInput?: string;

  // ── Agent (Level 2) ──
  systemPrompt?: string;
  outputFormat?: {
    json_template?: Record<string, unknown>;
    human_readable?: string;
  };
  accountability?: Array<{
    name: string;
    prompt_instruction: string;
    severity: string;
  }>;
  readinessScore?: number;
  taskDescription?: string;
  inputDescription?: string;

  // ── Shared: persona / constraints (legacy mock format) ──
  persona?: string;
  constraints?: string[];

  // ── Build Guide (Levels 2–5) ──
  markdown?: string;
  platform?: string;
  toolName?: string;

  // ── Workflow (Level 3) ──
  designMarkdown?: string;
  nodeCount?: number;
  agentCount?: number;
  humanCheckpoints?: number;
  nodes?: Array<{ name: string; type?: string }>;
  workflowName?: string;

  // ── PRD (Level 4) ──
  prdMarkdown?: string;
  sections?: Array<Record<string, unknown>>;
  brief?: Record<string, unknown>;

  // ── Dashboard (Level 4) ──
  mockupHtml?: string;
  componentCount?: number;
  description?: string;
  title?: string;

  // ── App Spec (Level 5) ──
  evaluationMarkdown?: string;
  designScore?: number;
  architectureSections?: Array<Record<string, unknown>>;
  appDescription?: string;
  problemStatement?: string;
  userTypes?: string[];
  spec?: Record<string, unknown>;
  layout?: Record<string, unknown>;

  // ── Generic fallback ──
  summary?: string;
}
```

---

## 7. New Content Renderers

### 7.1 `BuildGuideContent.tsx`

Renders a markdown-formatted build guide with syntax highlighting for code blocks.

```
┌─────────────────────────────────────────────────────┐
│  BUILD GUIDE                                        │
│                                                      │
│  Platform: n8n                                       │
│  Source: Workflow Canvas                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  (markdown content rendered as styled HTML)    │  │
│  │  with code blocks, headers, and lists          │  │
│  │  ...                                           │  │
│  │  scrollable, max-height 400px                  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Copy markdown]  [Download .md]                     │
└─────────────────────────────────────────────────────┘
```

**Specs:**

- **Platform badge:** pill, `background: level accent at 20%`, `color: level accent dark`, `fontSize: 11`, `fontWeight: 700`, `borderRadius: 20`, `padding: 3px 10px`
- **Source label:** `fontSize: 12`, `color: #718096` — e.g., "Created with Agent Builder"
- **Markdown body:** rendered as styled HTML within a `contentBox` (same base style as other renderers)
  - Headers: `fontWeight: 700`, `color: #1A202C`, `marginTop: 16`
  - Code blocks: `background: #1A202C`, `color: #E2E8F0`, `padding: 12px 16px`, `borderRadius: 8`, `fontFamily: 'DM Mono', monospace`, `fontSize: 12`, `overflowX: auto`
  - Inline code: `background: #EDF2F7`, `padding: 1px 4px`, `borderRadius: 3`, `fontSize: 12`
  - Lists: standard indentation, `color: #4A5568`
  - `maxHeight: 400px`, `overflowY: auto`
- **Action buttons:** "Copy markdown" and "Download .md" — same ActionBtn style as toolkit pages

**Markdown rendering:** Use a simple regex-based renderer (no external library needed). Convert:
- `# ` → `<h3>`, `## ` → `<h4>`, `### ` → `<h5>`
- `` ``` `` blocks → `<pre><code>`
- `**text**` → `<strong>`
- `- ` → `<li>` within `<ul>`
- `\n\n` → `<p>` breaks

This is intentionally simple — the content is already well-structured markdown from the toolkit tools.

### 7.2 `PrdContent.tsx`

Renders a PRD with expandable sections.

```
┌─────────────────────────────────────────────────────┐
│  PRODUCT REQUIREMENTS DOCUMENT                       │
│                                                      │
│  ┌─ Section 1: Project Overview ────────── ▾ ─────┐  │
│  │  (expanded markdown content)                   │  │
│  └────────────────────────────────────────────────┘  │
│  ┌─ Section 2: User Personas ──────────── ▸ ─────┐  │
│  │  (collapsed — one-line preview)                │  │
│  └────────────────────────────────────────────────┘  │
│  ┌─ Section 3: Feature Requirements ───── ▸ ─────┐  │
│  │  (collapsed)                                   │  │
│  └────────────────────────────────────────────────┘  │
│  ...                                                 │
│                                                      │
│  [Copy full PRD]  [Download .md]                     │
└─────────────────────────────────────────────────────┘
```

**Specs:**

- If `sections` array is available, render as expandable accordion sections (first section auto-expanded)
- If only `prdMarkdown` is available, render as a single markdown body (same as BuildGuideContent)
- Section card: `border: 1px solid #E2E8F0`, `borderRadius: 10`, `marginBottom: 8`
- Section header: `padding: 12px 16px`, `display: flex`, `justifyContent: space-between`, `cursor: pointer`
- Section title: `fontSize: 13`, `fontWeight: 700`, `color: #1A202C`
- Chevron: rotates 90° on expand, `transition: transform 0.2s`
- Expanded body: `padding: 0 16px 16px`, `borderTop: 1px solid #E2E8F0`

---

## 8. Updated Existing Content Renderers

### 8.1 `PromptContent.tsx`

**Current:** Shows `content.promptText` in a monospace box with an edit button.

**New:** Also shows strategy cards (if present) below the prompt text.

Add after the prompt box:
```
{content.strategies && content.strategies.length > 0 && (
  <div style={{ marginTop: 16 }}>
    <div style={sectionLabel}>Strategies Applied</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {content.strategies.map((s, i) => (
        <div key={i} style={{
          border: '1px solid #E2E8F0', borderRadius: 8,
          padding: '10px 14px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{s.name}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{s.how_applied}</div>
        </div>
      ))}
    </div>
  </div>
)}
```

Also show the original user input:
```
{content.userInput && (
  <div style={{ marginTop: 16 }}>
    <div style={sectionLabel}>Original Input</div>
    <div style={{ fontSize: 13, color: '#718096', fontStyle: 'italic' }}>
      {content.userInput}
    </div>
  </div>
)}
```

### 8.2 `AgentContent.tsx`

**Current:** Shows `persona`, `systemPrompt`, and `constraints` from mock data.

**New:** Handle real Agent Builder output structure.

```typescript
const AgentContent: React.FC<Props> = ({ content }) => {
  // Support both legacy mock format and new structured format
  const systemPrompt = content.systemPrompt || content.persona || '';
  const hasOutputFormat = !!content.outputFormat;
  const hasAccountability = content.accountability && content.accountability.length > 0;
  const hasReadiness = typeof content.readinessScore === 'number';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Readiness Score (if present) */}
      {hasReadiness && (
        <div>
          <div style={sectionLabel}>Readiness Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `3px solid ${content.readinessScore! >= 70 ? '#48BB78' : content.readinessScore! >= 40 ? '#ED8936' : '#FC8181'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#1A202C',
            }}>
              {content.readinessScore}
            </div>
            <span style={{ fontSize: 13, color: '#718096' }}>
              {content.readinessScore! >= 70 ? 'Good candidate for automation' :
               content.readinessScore! >= 40 ? 'Moderate — review constraints' : 'Low — consider manual process'}
            </span>
          </div>
        </div>
      )}

      {/* Task Description */}
      {content.taskDescription && (
        <div>
          <div style={sectionLabel}>Task</div>
          <div style={{ fontSize: 13, color: '#4A5568' }}>{content.taskDescription}</div>
        </div>
      )}

      {/* System Prompt */}
      <div>
        <div style={sectionLabel}>System Prompt</div>
        <div style={{ ...contentBox, fontFamily: "'DM Mono', monospace", maxHeight: 280, overflowY: 'auto' }}>
          {systemPrompt || 'No system prompt'}
        </div>
      </div>

      {/* Output Format */}
      {hasOutputFormat && content.outputFormat?.json_template && (
        <div>
          <div style={sectionLabel}>Output Format</div>
          <pre style={{
            ...contentBox, fontFamily: "'DM Mono', monospace",
            fontSize: 12, maxHeight: 200, overflowY: 'auto',
          }}>
            {JSON.stringify(content.outputFormat.json_template, null, 2)}
          </pre>
        </div>
      )}

      {/* Accountability (new format) */}
      {hasAccountability && (
        <div>
          <div style={sectionLabel}>Accountability Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {content.accountability!.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#4A5568' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: a.severity === 'critical' ? '#FFF5F5' : a.severity === 'important' ? '#FFFBEB' : '#F0FFF4',
                  color: a.severity === 'critical' ? '#C53030' : a.severity === 'important' ? '#C05621' : '#276749',
                  whiteSpace: 'nowrap',
                }}>
                  {a.severity}
                </span>
                <span>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy constraints (from mock data) */}
      {!hasAccountability && content.constraints && content.constraints.length > 0 && (
        <div>
          <div style={sectionLabel}>Constraints</div>
          {/* ... existing constraint rendering ... */}
        </div>
      )}
    </div>
  );
};
```

### 8.3 `WorkflowContent.tsx`

**Current:** Shows `summary`, `nodeCount`, `agentCount`, `humanCheckpoints`, and `nodes` list.

**New:** Same layout but also renders `designMarkdown` if present.

Add below the existing nodes list:
```typescript
{content.designMarkdown && (
  <div>
    <div style={sectionLabel}>Workflow Design</div>
    <div style={{
      ...contentBox, maxHeight: 300, overflowY: 'auto',
    }}>
      {/* Render markdown as simple HTML */}
      <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(content.designMarkdown) }} />
    </div>
  </div>
)}
```

### 8.4 `DashboardContent.tsx`

**Current:** Shows `description` and `componentCount` from mock data.

**New:** Handle real Dashboard Designer output. Show the brief context and component count.

```typescript
{content.brief && (
  <div>
    <div style={sectionLabel}>Brief</div>
    <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
      {(content.brief as any).q1_purpose || 'No brief available'}
    </div>
  </div>
)}
```

### 8.5 `AppSpecContent.tsx`

**Current:** Shows `description`, `userTypes`, and `spec.summary` from mock data.

**New:** Handle real App Evaluator output. Show design score, architecture sections, and evaluation markdown.

Add design score display:
```typescript
{typeof content.designScore === 'number' && (
  <div>
    <div style={sectionLabel}>Design Score</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        fontSize: 24, fontWeight: 800, color: '#1A202C',
      }}>
        {content.designScore}/100
      </div>
    </div>
  </div>
)}
```

---

## 9. QuickUsePanel Updates

### Type maps — add new types

Update all four constant maps at the top of `QuickUsePanel.tsx`:

```typescript
import BuildGuideContent from './content/BuildGuideContent';
import PrdContent from './content/PrdContent';
import { BookOpen, FileText } from 'lucide-react';

const TYPE_ICONS: Record<ArtefactType, React.FC<{ size?: number; color?: string }>> = {
  prompt: Zap, agent: Bot, workflow: GitBranch, dashboard: LayoutDashboard,
  app_spec: Layers, build_guide: BookOpen, prd: FileText,
};

const TYPE_LABELS: Record<ArtefactType, string> = {
  prompt: 'Prompt', agent: 'Agent', workflow: 'Workflow', dashboard: 'Dashboard',
  app_spec: 'App Spec', build_guide: 'Build Guide', prd: 'PRD',
};

const TOOL_NAMES: Record<ArtefactType, string> = {
  prompt: 'Prompt Playground', agent: 'Agent Builder', workflow: 'Workflow Canvas',
  dashboard: 'Dashboard Designer', app_spec: 'App Builder',
  build_guide: 'Various', prd: 'Dashboard Designer',
};

const TOOL_ROUTES: Record<ArtefactType, string> = {
  prompt: '/app/toolkit/prompt-playground', agent: '/app/toolkit/agent-builder',
  workflow: '/app/toolkit/workflow-canvas', dashboard: '/app/toolkit/dashboard-designer',
  app_spec: '/app/toolkit/app-builder', build_guide: '', prd: '/app/toolkit/dashboard-designer',
};
```

### Content renderer routing

Update the content rendering section to route to the correct renderer:

```typescript
function renderContent(artefact: Artefact, content: ArtefactContent, onSave: (c: ArtefactContent) => void) {
  switch (artefact.type) {
    case 'prompt':       return <PromptContent content={content} onSave={onSave} />;
    case 'agent':        return <AgentContent content={content} />;
    case 'workflow':     return <WorkflowContent content={content} />;
    case 'dashboard':    return <DashboardContent content={content} />;
    case 'app_spec':     return <AppSpecContent content={content} level={artefact.level} />;
    case 'build_guide':  return <BuildGuideContent content={content} level={artefact.level} />;
    case 'prd':          return <PrdContent content={content} level={artefact.level} />;
    default:             return <PromptContent content={content} onSave={onSave} />;
  }
}
```

### Copy text function

Update `getCopyText` to handle new types:

```typescript
function getCopyText(content: ArtefactContent, type: ArtefactType): string {
  switch (type) {
    case 'prompt':       return content.promptText || '';
    case 'agent':        return content.systemPrompt || '';
    case 'workflow':     return content.designMarkdown || content.summary || '';
    case 'dashboard':    return content.description || '';
    case 'app_spec':     return content.evaluationMarkdown || content.description || '';
    case 'build_guide':  return content.markdown || '';
    case 'prd':          return content.prdMarkdown || '';
    default:             return '';
  }
}
```

---

## 10. ArtefactGrid & ArtefactCard Updates

### ArtefactGrid — ghost cards and type labels

Add `build_guide` and `prd` to `TYPE_LABELS` and `GHOST_TYPES`:

```typescript
const TYPE_LABELS: Record<ArtefactType, string> = {
  prompt: 'Prompt', agent: 'Agent', workflow: 'Workflow', dashboard: 'Dashboard',
  app_spec: 'App Spec', build_guide: 'Build Guide', prd: 'PRD',
};

const GHOST_TYPES = [
  { type: 'prompt', level: 1, Icon: Zap },
  { type: 'agent', level: 2, Icon: Bot },
  { type: 'build_guide', level: 2, Icon: BookOpen },
  { type: 'workflow', level: 3, Icon: GitBranch },
  { type: 'prd', level: 4, Icon: FileText },
  { type: 'app_spec', level: 5, Icon: Layers },
];
```

### ArtefactCard

Ensure the card's type icon and label handle all seven types. Add `BookOpen` and `FileText` to the icon map.

---

## 11. Shared Markdown Renderer Utility

Multiple content renderers need to convert markdown to styled HTML. Create a shared utility:

### `utils/markdownToHtml.ts`

```typescript
/**
 * Simple markdown-to-HTML converter for artefact content.
 * Handles: headings, bold, code blocks, inline code, lists, paragraphs.
 * No external dependencies.
 */
export function simpleMarkdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push('</code></pre>');
        inCodeBlock = false;
      } else {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push('<pre style="background:#1A202C;color:#E2E8F0;padding:12px 16px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:8px 0;"><code>');
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      html.push(escapeHtml(line) + '\n');
      continue;
    }

    // Close list if not a list item
    if (inList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ') && line.trim() !== '') {
      html.push('</ul>');
      inList = false;
    }

    // Headings
    if (line.startsWith('### ')) { html.push(`<h5 style="font-size:13px;font-weight:700;color:#1A202C;margin:12px 0 4px;">${inlineFormat(line.slice(4))}</h5>`); continue; }
    if (line.startsWith('## '))  { html.push(`<h4 style="font-size:14px;font-weight:700;color:#1A202C;margin:14px 0 6px;">${inlineFormat(line.slice(3))}</h4>`); continue; }
    if (line.startsWith('# '))   { html.push(`<h3 style="font-size:15px;font-weight:700;color:#1A202C;margin:16px 0 8px;">${inlineFormat(line.slice(2))}</h3>`); continue; }

    // List items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) { html.push('<ul style="margin:4px 0;padding-left:20px;">'); inList = true; }
      html.push(`<li style="font-size:13px;color:#4A5568;margin:2px 0;">${inlineFormat(line.trim().slice(2))}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') { continue; }

    // Paragraph
    html.push(`<p style="font-size:13px;color:#4A5568;line-height:1.7;margin:4px 0;">${inlineFormat(line)}</p>`);
  }

  if (inList) html.push('</ul>');
  if (inCodeBlock) html.push('</code></pre>');

  return html.join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:#EDF2F7;padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');
}
```

---

## 12. Toast Confirmation Updates

Each save action should show a toast that names the specific artefact type:

| Action | Toast Message |
|--------|-------------|
| Save prompt | "Prompt saved to your library" |
| Save agent | "Agent saved to your library" |
| Save agent build guide | "Build guide saved to your library" |
| Save workflow | "Workflow saved to your library" |
| Save workflow build guide | "Build guide saved to your library" |
| Save PRD | "PRD saved to your library" |
| Save dashboard build guide | "Build guide saved to your library" |
| Save app spec | "App spec saved to your library" |
| Save app build plan | "Build plan saved to your library" |

Never use "Saved to Prompt Library" — it's now "Saved to your library" (since it's not just prompts anymore).

---

## 13. Testing Checklist

### Save flows

- [ ] Prompt Playground save creates an artefact with `type: 'prompt'` and structured JSONB content including `promptText`, `strategies`, and `userInput`
- [ ] Agent Builder "Save to Library" creates `type: 'agent'` with `systemPrompt`, `outputFormat`, `accountability`, `readinessScore`
- [ ] Agent Builder "Save Build Plan" creates `type: 'build_guide'` with `markdown` and `platform`
- [ ] Workflow Canvas "Save to Library" creates `type: 'workflow'` with `designMarkdown`, `nodes`, stat counts
- [ ] Workflow Canvas "Save Build Guide" creates `type: 'build_guide'`
- [ ] Dashboard Designer "Save PRD" creates `type: 'prd'` with `prdMarkdown` and `sections`
- [ ] Dashboard Designer "Save Build Guide" creates `type: 'build_guide'`
- [ ] App Evaluator "Save" creates `type: 'app_spec'` with `evaluationMarkdown`, `designScore`, `architectureSections`
- [ ] App Evaluator "Save Build Plan" creates `type: 'build_guide'`
- [ ] All saves show the correct toast message

### Artefacts page

- [ ] All seven types appear in the type filter bar
- [ ] Filtering by "Build Guide" shows only build guide artefacts
- [ ] Filtering by "PRD" shows only PRD artefacts
- [ ] Opening a prompt artefact shows the prompt text, strategies, and original input
- [ ] Opening an agent artefact shows readiness score, system prompt, output format, and accountability
- [ ] Opening a build guide artefact shows the platform badge and rendered markdown
- [ ] Opening a workflow artefact shows stats, nodes list, and design markdown
- [ ] Opening a PRD artefact shows expandable sections
- [ ] Opening an app spec artefact shows design score and architecture
- [ ] "Copy" button on each artefact type copies the correct content
- [ ] Editing a prompt artefact's text saves the update to Supabase

### Ghost cards

- [ ] Empty state shows ghost cards for all types (not just the original five)

### Backward compatibility

- [ ] Existing artefacts (from Phase 1 migration or Phase 2 usage) still render correctly
- [ ] Artefacts with `content: { promptText: "..." }` (Phase 1 format) render in PromptContent
- [ ] Legacy mock content format (if any rows remain) is handled gracefully

---

## 14. Implementation Order

1. **Shared utility** — Create `utils/markdownToHtml.ts`
2. **Database** — Add `createArtefactFromTool` to `lib/database.ts`
3. **Type definitions** — Update `ArtefactType` and `ArtefactContent` in `useArtefactsData.ts`
4. **New content renderers** — Create `BuildGuideContent.tsx` and `PrdContent.tsx`
5. **Update existing renderers** — Modify all five existing content components to handle real data
6. **QuickUsePanel** — Add new types to all maps, wire new renderers
7. **ArtefactGrid + ArtefactCard** — Add new types to icon/label maps and ghost cards
8. **SearchFilterBar** — Verify `build_guide` and `prd` are present (should already be from Phase 1)
9. **Toolkit tools** — Update all five toolkit components to use `createArtefactFromTool` with correct types and structured content. Do these in order: Prompt Playground → Agent Builder → Workflow Canvas → Dashboard Designer → App Evaluator
10. **Toast messages** — Update all save confirmations
11. **Test end-to-end** against the checklist in §13
