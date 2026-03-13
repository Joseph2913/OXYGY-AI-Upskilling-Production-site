# Level 2 Toolkit (Agent Builder) — Conversation Handover

> Complete context from the development sessions working on the Agent Builder page. Use this document to resume work in a new conversation with full context.

---

## 1. What This Tool Is

The **Agent Builder** is the Level 2 toolkit tool at `/app/toolkit/agent-builder`. It helps users design a reusable AI agent by:

1. **Step 1 — Describe your agent**: User enters a task description + optional input data description
2. **Step 2 — Review your agent design**: AI generates a readiness score, system prompt, output format, accountability checks, and refinement questions. User reviews, refines, and approves.
3. **Step 3 — Choose your platform**: User selects from 6 deployment platforms (ChatGPT, Claude Skills, Copilot, Gemini, API, Not Sure)
4. **Step 4 — Download your Build Plan**: AI generates a platform-specific setup guide (hardcoded steps + AI-personalized slot values and tips). User can view in Cards/Markdown, download, save, refine, or go back.

**Level 2 accent colors:** `LEVEL_ACCENT = '#F7E8A4'` (light yellow), `LEVEL_ACCENT_DARK = '#8A6A00'` (dark brown/olive)

---

## 2. Key Architecture Decisions

### 2.1 Hybrid Build Plan Architecture (Hardcoded Steps + AI Slot-Fill)

**Problem solved:** Gemini Flash was hallucinating fictional platform UI elements (e.g., "System Prompt field", "Create Project" button) when asked to generate setup steps for platforms like Claude Skills.

**Solution:** A hybrid architecture where:
- **Steps are HARDCODED** per platform in `PLATFORM_TEMPLATES` — the AI never generates navigation/UI steps
- **Personalization via `{SLOT}` placeholders** — each template has slots like `{AGENT_NAME}`, `{TASK}`, `{EXAMPLE_INPUT}` that the AI fills based on the user's actual agent
- **Tips and limitations are AI-generated** — personalized to the specific agent being built
- **Fallback defaults** — if the AI fails to fill slots, sensible defaults are used

**Authoritative implementation:** `functions/src/index.ts` — the `agentsetupguide` Cloud Function contains `PLATFORM_TEMPLATES`, the `SLOT_FILL_SYSTEM` prompt, and the merge logic.

**Localhost mirror:** `vite.config.ts` — contains an identical `agentSetupGuideProxyPlugin` for local development. **Both files must be kept in sync** — this was a major source of bugs (localhost used old proxy while production used new Cloud Function).

### 2.2 Dual Deployment Surface

- **Production:** Firebase Cloud Functions (`functions/src/index.ts`) + Firebase Hosting
- **Localhost:** Vite dev server (`vite.config.ts`) has its own proxy that mimics the Cloud Functions
- **Critical rule:** When changing API logic, update BOTH `functions/src/index.ts` AND `vite.config.ts`
- **Deploy command:** `npx vite build && npx firebase-tools deploy --only hosting,functions`
- **Force deploy:** If Firebase skips unchanged functions: `npx firebase-tools deploy --only functions:agentsetupguide --force`

### 2.3 OpenRouter for All AI Calls

- All AI calls go through OpenRouter (`https://openrouter.ai/api/v1/chat/completions`)
- Never call provider APIs directly
- Model: `google/gemini-2.0-flash-001` for the setup guide slot-filling
- Firebase secret: `OPEN_ROUTER_API`

---

## 3. Files and Their Roles

| File | Purpose |
|------|---------|
| `components/app/toolkit/AppAgentBuilder.tsx` | Main UI component (~2000 lines). Contains all 4 steps, ProcessingProgress, ActionBtn, StepCard, etc. |
| `functions/src/index.ts` | Cloud Functions backend. Contains `PLATFORM_TEMPLATES`, `SLOT_FILL_SYSTEM` prompt, `agentsetupguide` function, and other API endpoints. |
| `vite.config.ts` | Vite dev proxy. Contains identical `PLATFORM_TEMPLATES` and slot-fill logic for localhost development. |
| `hooks/useAgentDesignApi.ts` | React hook for API calls (`designAgent`, `generateSetupGuide`). |
| `types.ts` | TypeScript types including `AgentDesignResult`, `AgentSetupGuide`, `AgentSetupStep`. |
| `data/agent-builder-content.ts` | Constants: `AGENT_PLATFORMS`, `SETUP_LOADING_STEPS`, `SETUP_STEP_DELAYS`, example data. |
| `constants/agentSetupGuidePrompt.ts` | Frontend reference copy of the `TIPS_PERSONALIZATION_SYSTEM` prompt (authoritative version is in Cloud Functions). |
| `components/app/workflow/OutputActionsPanel.tsx` | Shared component for Download .md / .doc + Save to Library. |
| `components/app/toolkit/NextStepBanner.tsx` | Shared "What's next" banner component. |

---

## 4. Current State of Step 4 (Build Plan Output)

Step 4 was recently rewritten to match the **BUILD-GUIDE-OUTPUT-STANDARD.md** spec. It now includes:

1. **ProcessingProgress** — 5-step loading animation while the build plan generates
2. **NextStepBanner** — Orange-yellow accent banner with deployment instructions
3. **Top Action Row** — Cards/Markdown view toggle (left) + Copy Build Plan, Download .md, Save to Library (right)
4. **Cards View** — Rich card with:
   - `BUILD PLAN` header label + platform pill (orange-yellow scheme)
   - Agent task title + overview text
   - Stat pills (step count, platform, tip count)
   - **Expandable accordion steps** (click to expand/collapse each step)
   - Pro Tips section with accent-tinted cards
   - Limitations note
   - "Want the full guide?" CTA banner
5. **Markdown View** — Dark monospace container with full build plan markdown
6. **OutputActionsPanel** — Download .md / .doc + Save to Library (uses full build plan markdown including system prompt)
7. **Refinement Section** — Collapsible caveat + 5 platform-aware refinement questions + "Regenerate Build Plan" button
8. **Bottom Navigation** — "Back to Step 3" (preserves platform selection) + "Start Over" (full reset)
9. **Staggered Animation** — Content, actions panel, and refinement section fade in sequentially via `buildPlanVisibleBlocks`

### Key State Variables for Step 4

```typescript
const [buildPlanViewMode, setBuildPlanViewMode] = useState<'cards' | 'markdown'>('cards');
const [buildPlanVisibleBlocks, setBuildPlanVisibleBlocks] = useState(0);
const [buildPlanCopied, setBuildPlanCopied] = useState(false);
const [expandedBuildSteps, setExpandedBuildSteps] = useState<Set<number>>(new Set());
const [buildPlanSaved, setBuildPlanSaved] = useState(false);
const [buildPlanRefineExpanded, setBuildPlanRefineExpanded] = useState(false);
const [buildPlanRefinementAnswers, setBuildPlanRefinementAnswers] = useState<Record<number, string>>({});
const [buildPlanAdditionalContext, setBuildPlanAdditionalContext] = useState('');
```

### Helper Functions

- `buildFullBuildPlan()` — Assembles full markdown from setup guide steps + tips + limitations + system prompt
- `handleCopyBuildPlan()` — Copies the full markdown to clipboard
- `handleSaveBuildPlan()` — Saves to Prompt Library via `dbSavePrompt()`
- `handleDownloadBuildPlan()` — Downloads as `.md` file

---

## 5. Current State of Step 2 (Design Review)

Step 2 follows the **DESIGN-REVIEW-OUTPUT-STANDARD.md** pattern (created during this session):

1. **Quality Score Banner** — Conic-gradient ring showing readiness score (0–100%), verdict, truncated rationale, "Learn more" toggle
2. **Expanded Criteria** — Per-criterion progress bars (frequency, consistency, shareability, complexity, standardization)
3. **Primary Output** — System prompt with color-coded Prompt Blueprint sections (ROLE, CONTEXT, TASK, OUTPUT FORMAT, STEPS, QUALITY CHECKS)
4. **View Toggle** — Cards (color-coded) / Markdown (raw) + supplementary tabs (Output Format, Accountability)
5. **Output Format tab** — Side-by-side: human-readable view (left) + JSON template (right)
6. **Accountability tab** — List of checks with severity badges (critical/important/info)
7. **Refinement Section** — AI-generated task-specific questions, collapsed by default
8. **Bottom Navigation** — Back to Step 1, Approve Prompt (primary teal), Start Over

---

## 6. Button Styling Standard

All primary CTAs use teal (`#38B2AC`). The purple accent variant (`#5A67D8`) was **removed**.

```typescript
const ActionBtn: React.FC<{
  icon?: React.ReactNode;       // Icon BEFORE label (for back/utility actions)
  label: string;
  onClick: () => void;
  primary?: boolean;            // teal background
  disabled?: boolean;
  iconAfter?: React.ReactNode;  // Icon AFTER label (for forward/primary actions)
}>;
```

**Convention:**
- Forward actions (Approve, Generate, Refine): `primary` + `iconAfter={<ArrowRight />}`
- Back actions: `icon={<ArrowLeft />}` (default white style)
- Utility actions (Start Over, Copy): `icon` before label
- Sizing: `padding: 9px 18px`, `fontSize: 13`, `fontWeight: 600`, `borderRadius: 24`, `gap: 6`

---

## 7. PRD Documents Created/Updated

| Document | What it covers |
|----------|---------------|
| **`PRD/DESIGN-REVIEW-OUTPUT-STANDARD.md`** (NEW) | Generalised standard for the "Review Your [X] Design" step pattern — quality score, primary output with Cards/Markdown toggle, supplementary tabs, refinement, bottom navigation. Adaptable to any toolkit tool. |
| **`PRD/BUILD-GUIDE-OUTPUT-STANDARD.md`** (existing) | Standard for the final Build Guide/Build Plan output step — loading, NextStepBanner, view toggle, ExportSummaryCard, OutputActionsPanel, refinement, download. |
| **`PRD/TOOLKIT-PAGE-STANDARD.md`** (updated) | Added cross-references to both DESIGN-REVIEW-OUTPUT-STANDARD.md and BUILD-GUIDE-OUTPUT-STANDARD.md in §4 and §12 checklist. Updated §3.8 for button variants and §6.2 for ActionBtn interface. |

---

## 8. Known Issues and Fixes Applied

### 8.1 Claude Skills Hallucination (FIXED)
**Problem:** Gemini Flash generated fictional UI elements for Claude Skills.
**Fix:** Hardcoded `PLATFORM_TEMPLATES` with `{SLOT}` placeholders. AI only fills slot values + tips.

### 8.2 Dual Deployment Surface (FIXED)
**Problem:** Changes to Cloud Functions weren't reflected on localhost.
**Fix:** Must always update both `functions/src/index.ts` AND `vite.config.ts`.

### 8.3 Step 1 Not Collapsing (FIXED)
**Problem:** Step 1 didn't collapse when "Design My Agent" was clicked.
**Fix:** Added `isLoading` to the done condition: `step1Done = taskDescription.trim().length > 0 && (result !== null || isLoading)`.

### 8.4 Purple Accent Button (FIXED)
**Problem:** "Approve Prompt" button was purple (`#5A67D8`) instead of teal.
**Fix:** Changed to `primary` prop, removed `accent` variant entirely.

### 8.5 Double Arrows on Buttons (FIXED)
**Problem:** "Generate Build Plan" had an arrow icon AND `→` in the label text.
**Fix:** Removed `→` from label, used `iconAfter` for the arrow icon.

### 8.6 Missing Exports in DashboardDesigner (FIXED)
**Problem:** `DashboardDesigner.tsx` imported `WHY_MOCKUP_TOOLTIP`, `INSPIRATION_SITES`, `INSPIRATION_TOOLTIP_CONTENT` from `dashboard-designer-content.ts` but they didn't exist, causing a blank page.
**Fix:** Added the three exports to `data/dashboard-designer-content.ts`.

### 8.7 Firebase "No Changes Detected" (WORKAROUND)
**Problem:** Firebase skipped function deployment because compiled hash matched.
**Fix:** Target the specific function with `--force`: `npx firebase-tools deploy --only functions:agentsetupguide --force`

---

## 9. Platform Templates (Reference)

The 6 platform templates in `functions/src/index.ts` (and mirrored in `vite.config.ts`):

| Platform | Steps | Slot Keys |
|----------|-------|-----------|
| ChatGPT | 5 | AGENT_NAME, TASK, EXAMPLE_INPUT, OUTPUT_FIELD |
| Claude Skills | 5 | AGENT_NAME, TASK, EXAMPLE_INPUT, EXAMPLE_OUTPUT, CHAIN_SUGGESTION, SKILL_DESCRIPTION |
| Microsoft Copilot | 5 | AGENT_NAME, TASK, EXAMPLE_INPUT, OUTPUT_FIELD |
| Google Gemini | 5 | AGENT_NAME, TASK, EXAMPLE_INPUT, OUTPUT_FIELD |
| API / Custom | 5 | AGENT_NAME, TASK, EXAMPLE_INPUT, OUTPUT_FIELD, LANGUAGE |
| Not Sure Yet | 4 | AGENT_NAME, TASK, EXAMPLE_INPUT, OUTPUT_FIELD |

Each template also has `fallbackTips` (4 strings) and `fallbackLimitations` (string) used when AI slot-filling fails.

---

## 10. Step Completion Logic

```typescript
const step1Done = taskDescription.trim().length > 0 && (result !== null || isLoading);
const step2Done = step1Done && step2Approved;
const step3Done = step2Done && selectedPlatform !== null && (setupGuide !== null || setupLoading);
const step4Done = setupGuide !== null;
```

- Step 1 collapses when `step1Done` (immediately on "Design My Agent" click due to `isLoading`)
- Step 2 collapses when `step2Done` (user explicitly clicks "Approve Prompt")
- Step 3 collapses when `step3Done` (user clicks "Generate Build Plan")
- Step 4 **never collapses** (`collapsed={false}`) — it's the final output step

---

## 11. Dev Server Notes

- **Port:** 5178
- **Start command:** `npx vite --port 5178`
- The Vite dev server tends to die when left idle — restart with the command above
- Use `nohup npx vite --port 5178 > /tmp/vite-dev.log 2>&1 &` for more persistent background running
- The Vite proxy handles `/api/*` routes locally — it does NOT hit Firebase Cloud Functions

---

## 12. What's NOT Done / Potential Next Steps

- **Production deploy:** The Step 4 rewrite and dashboard-designer fix are frontend-only changes not yet deployed. Deploy with: `npx vite build && npx firebase-tools deploy --only hosting,functions`
- **Applying DESIGN-REVIEW-OUTPUT-STANDARD to other tools:** The standard document is written but only the Agent Builder implements it. Other toolkit tools (Prompt Playground, App Designer, Workflow Canvas, Dashboard Designer) could adopt the same design review pattern.
- **Applying BUILD-GUIDE-OUTPUT-STANDARD to other tools:** The Agent Builder now follows this standard in Step 4. The Workflow Canvas already had it. Other tools that generate build plans could adopt it.
- **Build Plan refinement:** The refinement section in Step 4 calls `generateSetupGuide` with appended refinement context, but since the steps are hardcoded templates, only the tips/limitations will change meaningfully. A more sophisticated approach could adjust slot values based on refinement input.
- **Test the build plan output UI:** The Step 4 rewrite hasn't been fully user-tested yet.
