# Handover: Level 4 — App Designer Toolkit Page

> Full conversation context for continuing work on the Level 4 App Designer tool.
> **Date range:** 10 Mar – 13 Mar 2026
> **Branch:** `main`

---

## 1. What This Tool Is

The **App Designer** (Level 4 toolkit) helps users create a Product Requirements Document (PRD) for an app idea, then generates a platform-specific build guide. It lives at:

- **Page component:** `components/app/toolkit/AppDashboardDesigner.tsx`
- **Content/data:** `data/dashboard-designer-content.ts`
- **Types:** `types.ts` (search for `NewPRDResult`, `PRDReadiness`, `PRDReadinessCriteria`)
- **Backend (production):** `functions/src/index.ts` — `generateprd` Cloud Function
- **Backend (local dev):** `vite.config.ts` — PRD proxy plugin (search `prdProxyPlugin`)
- **Route:** `/app/toolkit/dashboard-designer`

---

## 2. Current Architecture (3-Step Flow)

The page was **simplified from 5 steps to 3 steps** during this conversation:

| Step | Name | What Happens |
|------|------|-------------|
| 1 | **Brief** | User writes an app description (text area). No inspiration image, no mockup. |
| 2 | **PRD Generation** | AI generates a full PRD with 12 sections + readiness score + refinement questions. User reviews, can refine, then approves. |
| 3 | **Build Guide** | User picks a vibe-coding platform (Bolt, Cursor, Lovable, Claude Code, etc.), AI generates platform-specific build instructions. |

**Removed features:** Inspiration image upload/analysis, visual style picker, mockup generation (all stripped out per user request).

---

## 3. Conversation Thread — Chronological

### Phase 1: N8N Workflow Canvas (Level 3) — 10 Mar
*(Not Level 4 but happened in same session)*

- User asked to improve the n8n template output in the Level 3 Workflow Canvas tool per `PRD/PRD-07-Workflow-Canvas-v2.md`
- Created new files: `constants/n8nSystemPrompt.ts`, `utils/validateN8nWorkflow.ts`, `utils/generateN8nWithRetry.ts`, `api/generate-n8n-workflow.ts`
- Updated `data/n8nNodeTemplates.ts` (30 node templates, typeVersion fixes)
- Updated `AppWorkflowCanvas.tsx` with AI generation → validation → retry → fallback pipeline
- Added `generaten8nworkflow` Firebase function + rewrite
- Deployed to Firebase + GitHub (commit `e90c1f0`)

### Phase 2: Cross-Toolkit Enhancements — 11 Mar
*(Affected all 5 levels including Level 4)*

- Added `ProcessingProgress` loading component to all toolkit pages
- Added practitioner caveat text, step-back navigation, structured inspiration analysis
- Deployed (commit `739c247`)

### Phase 3: Level 4 PRD Output Improvements — 11 Mar

**User feedback:** "The PRD is way too long. The page length is too much. Markdown is rendering as one long line."

Changes made:
1. **Collapsible PRD cards** — Each of 12 PRD sections shows collapsed by default with a short summary (first line, ~120 chars). Click to expand. Each has a copy button.
2. **Fixed markdown rendering** — `buildFullPRD()` had a bug where `.join()` was inside spread operator, producing one giant string. Fixed to use `---` separators.
3. **Toggle moved to action row** — Cards/Markdown toggle now sits on the same row as Copy/Download/Save buttons.

### Phase 4: Marisha Check-in Feedback (Level 4 Specific) — 12 Mar

User provided a mini-PRD with 5 targeted changes:

| # | Change | Status |
|---|--------|--------|
| 1 | Shorten tool description to single paragraph (problem → function → outcome) | Done |
| 2 | All PRD sections collapse by default (empty initial `expandedSections` Set) | Done |
| 3 | Added 12th section "Design Tokens" — content file, icon mapping, system prompt, fallback PRD | Done |
| 4 | Active step indicator in ToolOverview + scroll anchoring | Done |
| 5 | Loading timing stretch (5s → 8s delays) + Next Step Banner | Done |

Deployed (commit `5917279`).

### Phase 5: Simplify to 3-Step Flow — 12 Mar

**User request:** "Simplify the scope. Remove inspiration image and mockup creation. Step 1 → Step 3 (PRD) directly. PRD displayed like Level 2. After approval, choose vibe-coding platform and get build guide. Look at Agent Builder (Level 2) for reference."

Major rewrite:
- Removed ~60% of old code (mockup generation, image analysis, visual style picker)
- Rewrote component as 3-step flow
- Added `appbuildguide` Cloud Function for platform-specific build guide generation
- Added new vite proxy plugin for local dev build guide generation
- Restored old exports in `dashboard-designer-content.ts` that marketing components still use
- Deployed to Firebase + GitHub (commit `5917279`)

### Phase 6: Step Collapse + Loading Fixes — 12 Mar

**User request:** "Step 2 should collapse when done. Loading should follow TOOLKIT-PAGE-STANDARD.md."

Changes:
- Fixed step collapse logic: each step collapses based solely on its own `done` state
- Step 2 uses `locked` prop when Step 1 isn't complete (no educational preview)
- Replaced old loading with correct `ProcessingProgress` component per standard

### Phase 7: Design Review Output Standard — Step 2 Rewrite — 12-13 Mar

**User request:** "Use the design philosophy in DESIGN-REVIEW-OUTPUT-STANDARD.md, take inspiration from Level 2 Agent Builder, execute as precisely as possible."

This was the largest change in the conversation. Affected files:

#### types.ts
Extended `NewPRDResult` with new fields:
```typescript
export interface PRDReadinessCriteria {
  label: string;
  score: number;
  assessment: string;
}
export interface PRDReadiness {
  overall_score: number;
  verdict: string;
  rationale: string;
  criteria: Record<string, PRDReadinessCriteria>;
}
export interface NewPRDResult {
  prd_content: string;
  sections: Record<string, string>;
  readiness: PRDReadiness;
  refinement_questions: string[];
  screen_map?: string;
  data_model?: string;
}
```

#### functions/src/index.ts (PRD_SYSTEM prompt)
Rewrote `PRD_SYSTEM` prompt to include:
- **Readiness assessment** — 5 criteria scored 0-100: Feasibility, Scope Clarity, User Value, Technical Complexity, Data Requirements
- **Refinement questions** — 3 AI-generated questions for the user
- **Supplementary views** — `screen_map` (ASCII hierarchy) and `data_model` (entity list)
- Updated JSON response format with all new fields

#### vite.config.ts (prdProxyPlugin)
Updated dev proxy system prompt to match Cloud Function changes.

#### AppDashboardDesigner.tsx — Step 2 Output Rewrite
Replaced the entire Step 2 output with Design Review Output Standard layout:

1. **Quality Score Banner** — Conic-gradient ring (56×56px), dynamic score colors (teal ≥80, amber ≥50, coral <50), verdict text, rationale, expandable criteria breakdown with individual score bars
2. **Primary Output Section** — Section header ("📄 YOUR APP PRD"), view toggle row with:
   - Left: Cards / Markdown toggle
   - Right: Screen Map / Data Model supplementary tabs
   - Uses `LEVEL_ACCENT` colors (`#F5B8A0` / `#8C3A1A`)
3. **Content area** — Switches between cards view (collapsible PRD sections), markdown view, screen map view, data model view based on `activeView` state
4. **Refinement Section** — Caveat text, expandable AI-generated questions (click to reveal), refine button with `iconAfter`
5. **Bottom Navigation Row** — Back to Step 1 / Approve PRD / Start Over

State changes:
- Replaced `showMarkdown: boolean` with `activeView: 'cards' | 'markdown' | 'screen_map' | 'data_model'`
- Added `expandedSections` state for readiness criteria panel
- Updated staggered block animation to 7-block Design Review standard

Cleanup:
- Removed unused imports: `Library`, `Download` from lucide-react
- Removed unused `InfoTooltip` component definition
- Removed unused `handleDownloadPRD` function
- `Info` icon kept (still used in refinement section)
- `NextStepBanner` kept (still used in Step 3)

---

## 4. Current File State (Uncommitted)

These files have uncommitted changes relevant to Level 4:

| File | What Changed |
|------|-------------|
| `components/app/toolkit/AppDashboardDesigner.tsx` | Full Step 2 output rewrite per Design Review Output Standard |
| `types.ts` | Added `PRDReadiness`, `PRDReadinessCriteria`, extended `NewPRDResult` |
| `functions/src/index.ts` | Updated `PRD_SYSTEM` prompt with readiness scoring + refinement questions |
| `vite.config.ts` | Updated PRD proxy plugin system prompt to match |
| `data/dashboard-designer-content.ts` | 12 PRD sections including Design Tokens |

**Build status:** `npx vite build` passes cleanly as of 13 Mar.

**Not yet deployed** — these changes are local only. Previous deploy was commit `5917279`.

---

## 5. Key Design Decisions & Constraints

1. **Level accent colors for Level 4:** `LEVEL_ACCENT = '#F5B8A0'` (peach), `LEVEL_ACCENT_DARK = '#8C3A1A'` (dark brown)
2. **Font:** DM Sans only, never Plus Jakarta Sans in app pages
3. **Layout:** `padding: '28px 36px'`, no maxWidth, fills available space
4. **Inline styles only** — no CSS modules
5. **Firebase only** — no Vercel. Cloud Functions for backend, Firebase Hosting for frontend
6. **OpenRouter only** — all AI calls via OpenRouter, never direct provider APIs
7. **Deploy both** — always `npx vite build && npx firebase-tools deploy --only hosting,functions`

---

## 6. Reference Files

| File | Purpose |
|------|---------|
| `PRD/DESIGN-REVIEW-OUTPUT-STANDARD.md` | Spec for the Step 2 output layout (Quality Score Banner, View Toggle, etc.) |
| `PRD/TOOLKIT-PAGE-STANDARD.md` | General toolkit page structure (step cards, connectors, locking, loading) |
| `PRD/BUILD-GUIDE-OUTPUT-STANDARD.md` | Spec for the Step 3 build guide output |
| `components/app/toolkit/AppAgentBuilder.tsx` | Level 2 reference implementation (lines 880-1480 for Design Review output) |
| `components/app/level/ELearningView.tsx` | E-learning player (separate from toolkit) |
| `data/levelTopics.ts` | Level accent colors (`LEVEL_ACCENT_COLORS`, `LEVEL_ACCENT_DARK_COLORS`) |

---

## 7. Known Issues / Future Work

1. **Unused code in other files** — Some files changed in this session (`AppAgentBuilder.tsx`, `PlatformSelector.tsx`, `agent-builder-content.ts`, `topicContent.ts`, `ELearningView.tsx`, `TOOLKIT-PAGE-STANDARD.md`) have uncommitted changes from parallel work in the same session — not all are Level 4 related.
2. **Refinement flow** — When user clicks "Refine PRD", the AI-generated refinement questions are used as context for the next generation. The refinement UX (selecting questions, adding custom feedback) follows the pattern from `AppAgentBuilder.tsx`.
3. **Screen Map & Data Model tabs** — These supplementary views are generated by the AI alongside the PRD. They render as preformatted text. Could be enhanced with visual rendering in the future.
4. **Score accuracy** — The readiness score is AI-generated and may not always be calibrated. The 5 criteria (Feasibility, Scope Clarity, User Value, Technical Complexity, Data Requirements) are defined in the system prompt.

---

## 8. How to Test Locally

```bash
# Start dev server (uses vite proxy for API calls)
npx vite --port 3003

# Build check
npx vite build

# Deploy (when ready)
cd functions && npm run build && cd ..
npx vite build && npx firebase-tools deploy --only hosting,functions
```

Navigate to `http://localhost:3003/app/toolkit/dashboard-designer` and test the 3-step flow.
