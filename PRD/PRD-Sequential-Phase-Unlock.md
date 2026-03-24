# PRD: Sequential Phase Unlock — E-Learning → Toolkit → Project

**Version:** 1.0  
**Status:** Ready for implementation  
**Scope:** `data/levelTopics.ts`, `data/toolkitData.ts`, `lib/database.ts`, `hooks/useLevelData.ts`, `hooks/useJourneyData.ts`, `hooks/useToolkitData.ts`, `pages/app/AppCurrentLevel.tsx`, `pages/app/AppJourney.tsx`, `pages/app/AppToolkit.tsx`, `components/app/level/TopicHeader.tsx`, `components/app/LevelCard.tsx`, all five tool pages in `components/app/toolkit/`

---

## 1. Overview

### Purpose
Introduce a sequential three-phase learning journey per topic — E-Learning → Toolkit → Project — with automatic, behaviour-driven phase unlocking and consistent visual treatment across the My Journey, Current Level, and My Toolkit pages. Phases unlock without any user-initiated button press; completion is inferred from platform activity. Levels not included in a user's learning plan are visually present but marked as not applicable.

### Design Principles
- **Automatic, not manual.** No "mark as complete" buttons. Completion is inferred from verifiable activity: all slides visited for E-Learning, final output received for Toolkit.
- **Show everything, unlock progressively.** Locked phases display their name, icon, and description but show a locked state. The learner always knows what's coming.
- **Topic-level granularity.** All phase tracking is at `(level, topicId)` level — not at the level level. This future-proofs the system for multiple topics per level.
- **Not applicable, not hidden.** Levels outside the learning plan are shown with a distinct greyed state — transparent about what the programme contains.

### Three Phases Per Topic
| Phase | Label | Completion Trigger | DB Column |
|-------|-------|-------------------|-----------|
| 1 | E-Learning | All slides in `topicContent.slides` have been visited | `topic_progress.elearn_completed_at` |
| 2 | Toolkit | Tool generates final output (last step completed) | `topic_progress.read_completed_at` (repurposed — see §3) |
| 3 | Project | Project submission status = `passed` | `topic_progress.practise_completed_at` (already writes on topic completion) |

---

## 2. Data Layer Changes

### 2.1 `data/levelTopics.ts` — Topic Interface Extension

Add two fields to the `Topic` interface:

```ts
export interface Topic {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  icon: string;
  phases: TopicPhase[];
  comingSoon?: boolean;
  // NEW
  toolkitToolId: string;       // matches tool `id` in toolkitData.ts, e.g. 'prompt-playground'
  toolkitToolPath: string;     // internal route, e.g. '/app/toolkit/prompt-playground'
}
```

Update all existing topic definitions in `LEVEL_TOPICS` to include these two fields:

| Level | Topic ID | `toolkitToolId` | `toolkitToolPath` |
|-------|----------|-----------------|-------------------|
| 1 | 1 | `'prompt-playground'` | `'/app/toolkit/prompt-playground'` |
| 2 | 1 | `'agent-builder'` | `'/app/toolkit/agent-builder'` |
| 3 | 1 | `'workflow-canvas'` | `'/app/toolkit/workflow-canvas'` |
| 4 | 1 | `'dashboard-designer'` | `'/app/toolkit/dashboard-designer'` |
| 5 | 1 | `'ai-app-evaluator'` | `'/app/toolkit/ai-app-evaluator'` |

`comingSoon` topics (Context Engineering, Multi-Agent Orchestration, etc.) should have empty string values for both fields:
```ts
toolkitToolId: '',
toolkitToolPath: '',
```

Update the `phases` array on all active topics to include a third phase entry:
```ts
phases: [
  { icon: '▶', label: 'E-Learning', detail: '...' },      // existing
  { icon: '⚙', label: 'Toolkit', detail: '...' },          // existing (was Practise)
  { icon: '◈', label: 'Project', detail: '...' },          // NEW
],
```

Per-topic `phases[1].detail` values (Toolkit):
- L1 T1: `"Build, test, and refine prompts using the Prompt Playground."`
- L2 T1: `"Design your first Level 2 agent using the Agent Builder."`
- L3 T1: `"Map and build a multi-step workflow using the Workflow Canvas."`
- L4 T1: `"Define and scope your AI tool brief using the Dashboard Designer."`
- L5 T1: `"Evaluate a full-stack AI application using the App Evaluator."`

Per-topic `phases[2].detail` values (Project):
- L1 T1: `"Apply the Prompt Blueprint to a real task from your own work and submit your prompt for review."`
- L2 T1: `"Deploy your agent to a teammate and document the outcome."`
- L3 T1: `"Implement one step of your workflow in Make, Zapier, or n8n and document the result."`
- L4 T1: `"Submit your completed dashboard brief and mockup for review."`
- L5 T1: `"Present your application design and architecture for review."`

### 2.2 `data/toolkitData.ts` — Tool-to-Topic Mapping

Add a new exported constant `TOOL_TOPIC_MAPPING`:

```ts
export const TOOL_TOPIC_MAPPING: Record<string, { level: number; topicId: number }> = {
  'prompt-playground':  { level: 1, topicId: 1 },
  'agent-builder':      { level: 2, topicId: 1 },
  'workflow-canvas':    { level: 3, topicId: 1 },
  'dashboard-designer': { level: 4, topicId: 1 },
  'ai-app-evaluator':   { level: 5, topicId: 1 },
};
```

When new topics are added to a level with their own toolkit, this mapping is extended. Each tool ID maps to exactly one `(level, topicId)` pair.

### 2.3 `lib/database.ts` — New Function + Repurposed Column

#### Column repurposing (no schema migration required)
`topic_progress.read_completed_at` is repurposed as the toolkit completion timestamp. The column already exists, is already nullable, and is not referenced in any user-facing UI. The internal name changes meaning only in application code — the DB column name stays the same to avoid a migration.

Add a code comment at every reference to `read_completed_at` in `database.ts`:
```ts
// read_completed_at is used as toolkit_completed_at in application logic
```

#### New exported function: `completeToolkitPhase`

```ts
export async function completeToolkitPhase(
  userId: string,
  level: number,
  topicId: number,
): Promise<boolean> {
  const now = new Date().toISOString();
  return upsertTopicProgress(userId, level, topicId, {
    read_completed_at: now,   // repurposed as toolkit_completed_at
    current_phase: 3,         // advance to Project phase
    updated_at: now,
  });
}
```

This function is **idempotent** — calling it when `read_completed_at` is already set is a safe no-op at the DB level (the timestamp will be overwritten with a newer value, which is acceptable).

#### Update `TopicProgressRow` interface

Add a comment on the repurposed field:

```ts
export interface TopicProgressRow {
  // ...existing fields...
  read_completed_at: string | null;   // repurposed: toolkit_completed_at
  // ...
}
```

#### Update `completePhaseDb`

The existing `completePhaseDb` function maps phase numbers 1–4 to columns. Since this PRD repurposes `read_completed_at` for toolkit and `watch_completed_at` is now unused in any active flow, update the mapping comment but do not change the column keys — they remain valid for backward compatibility:

```ts
const phaseColumns: Record<number, string> = {
  1: 'elearn_completed_at',
  2: 'read_completed_at',   // toolkit completion (repurposed)
  3: 'watch_completed_at',  // unused in current topic model
  4: 'practise_completed_at',
};
```

#### Update `TOTAL_PHASES` usage in analytics

`getAdminAnalytics` and `getProgressDashboard` currently count phases using all four columns. Update these to treat only three columns as "meaningful" for progress calculation:
- `elearn_completed_at` → 1 phase
- `read_completed_at` → 1 phase (toolkit)
- `practise_completed_at` → 1 phase (project)
- `watch_completed_at` → ignore (unused)

This changes `totalPhases` for progress percentage calculation from `20` (5 × 4) to `15` (5 × 3). Update the constant in `getProgressDashboard` accordingly:
```ts
const totalPhases = 15; // 5 levels × 3 phases per topic (E-Learning, Toolkit, Project)
```

---

## 3. Hook Changes

### 3.1 `hooks/useLevelData.ts`

#### `TOTAL_PHASES` constant
Change from `2` to `3`:
```ts
export const TOTAL_PHASES = 3;
export const PHASE_LABELS = ['E-Learning', 'Toolkit', 'Project'];
export const PHASE_ICONS  = ['▶', '⚙', '◈'];
```

#### `TopicProgress` interface
Add `toolkitCompletedAt` field. Rename internal mapping for clarity:

```ts
export interface TopicProgress {
  topicId: number;
  phase: number;           // 1 = E-Learning, 2 = Toolkit, 3 = Project
  slide: number;
  completedAt: Date | null;
  phaseCompletions: [boolean, boolean, boolean]; // [elearn, toolkit, project]
  visitedSlides: Set<number>;
  elearnCompletedAt: Date | null;    // NEW — needed by phase gate logic
  toolkitCompletedAt: Date | null;   // NEW — read from read_completed_at
}
```

#### `useLevelData` fetch block
Update the mapping from DB rows to `TopicProgress` objects:

```ts
return {
  topicId: topic.id,
  phase: row?.current_phase ?? 1,
  slide: Math.max(1, row?.current_slide ?? 1),
  completedAt: row?.completed_at ? new Date(row.completed_at) : null,
  phaseCompletions: [
    !!row?.elearn_completed_at,
    !!row?.read_completed_at,       // toolkit
    !!row?.practise_completed_at,   // project
  ] as [boolean, boolean, boolean],
  visitedSlides: visited,
  elearnCompletedAt:   row?.elearn_completed_at   ? new Date(row.elearn_completed_at) : null,
  toolkitCompletedAt:  row?.read_completed_at     ? new Date(row.read_completed_at)   : null,
};
```

#### Active topic calculation
No change needed — logic already finds the first incomplete, non-comingSoon topic.

#### `completePhase` callback
The current `completePhase` advances `phase` by 1 and calls `completePhaseDb`. This continues to work for E-Learning → Toolkit (phase 1 → 2). 

**Do not call `completePhase` for the Toolkit → Project transition.** That transition is driven by the tool page calling `completeToolkitPhase` directly. The hook's `completePhase` is only used for E-Learning completion.

Add a new exported callback `markToolkitComplete` alongside the existing ones:

```ts
const markToolkitComplete = useCallback((topicId: number) => {
  if (!user) return;

  setLevelData(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      topicProgress: prev.topicProgress.map(tp => {
        if (tp.topicId !== topicId) return tp;
        return {
          ...tp,
          phase: 3,
          toolkitCompletedAt: new Date(),
          phaseCompletions: [tp.phaseCompletions[0], true, tp.phaseCompletions[2]],
        };
      }),
    };
  });

  completeToolkitPhase(user.id, currentLevel, topicId);
  logActivity(user.id, 'phase_completed', currentLevel, topicId, { phase: 2 });
}, [user, currentLevel]);
```

Export `markToolkitComplete` from `UseLevelDataReturn`.

#### Phase unlock helpers (new)

Add two derived helpers that can be called from `AppCurrentLevel` and exported for use in other components:

```ts
// Returns true if the user can access phase 2 (Toolkit) for a given topic
export function isToolkitUnlocked(tp: TopicProgress): boolean {
  return !!tp.elearnCompletedAt || tp.phaseCompletions[0];
}

// Returns true if the user can access phase 3 (Project) for a given topic
export function isProjectUnlocked(tp: TopicProgress): boolean {
  return !!tp.toolkitCompletedAt || tp.phaseCompletions[1];
}
```

Export both from the hook file.

### 3.2 `hooks/useJourneyData.ts`

#### `LevelProgress` interface — add `isAssigned` flag

```ts
export interface LevelProgress {
  // ...existing fields...
  isAssigned: boolean;   // NEW — true if this level is in the user's learning plan
  topicPhases: Array<{  // NEW — per-topic phase breakdown for LevelCard display
    topicId: number;
    topicTitle: string;
    elearnDone: boolean;
    toolkitDone: boolean;
    projectDone: boolean;
    isLocked: boolean;  // true if previous topic is not yet complete
  }>;
}
```

#### Populating `isAssigned`
In the `useJourneyData` data assembly block, fetch the learning plan and parse `levels_data`:

```ts
// After the existing Promise.all, also fetch the learning plan:
const learningPlan = await getLearningPlan(user.id);
const assignedLevelKeys = learningPlan
  ? Object.keys(learningPlan.levels_data)    // e.g. ['L1', 'L2', 'L3']
  : ['L1', 'L2', 'L3', 'L4', 'L5'];         // fallback: all assigned if no plan

// When building LevelProgress for each level:
const isAssigned = assignedLevelKeys.includes(`L${levelNumber}`);
```

#### Populating `topicPhases`
For each level, map through `LEVEL_TOPICS[levelNumber]` and join to `topicProgressRows`:

```ts
const topicPhases = LEVEL_TOPICS[levelNumber]
  .filter(t => !t.comingSoon)
  .map((topic, idx) => {
    const tp = topicProgressRows.find(
      r => r.level === levelNumber && r.topic_id === topic.id
    );
    const prevTopic = idx > 0
      ? topicProgressRows.find(r => r.level === levelNumber && r.topic_id === LEVEL_TOPICS[levelNumber][idx - 1].id)
      : null;
    const prevComplete = idx === 0 || !!prevTopic?.completed_at;
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      elearnDone: !!tp?.elearn_completed_at,
      toolkitDone: !!tp?.read_completed_at,
      projectDone: !!tp?.practise_completed_at,
      isLocked: !prevComplete,
    };
  });
```

### 3.3 `hooks/useToolkitData.ts`

Remove the hardcoded `unlocked: true`. Replace with:

```ts
// A toolkit level is "unlocked" if the associated topic's elearn_completed_at is set
const topicRows = await getAllTopicProgress(user.id);

const levelStats: ToolLevelStats[] = [1, 2, 3, 4, 5].map(lvl => {
  const tool = getPrimaryTool(lvl);
  const primaryTopicId = 1; // first topic per level; extend as topics are added
  const topicRow = topicRows.find(r => r.level === lvl && r.topic_id === primaryTopicId);
  const artefactsCreated = artefactCounts[lvl] || 0;
  const elearnDone = !!topicRow?.elearn_completed_at;
  const toolkitDone = !!topicRow?.read_completed_at;
  const isAssigned = assignedLevelKeys.includes(`L${lvl}`);
  return {
    levelNumber: lvl,
    toolId: tool?.id || '',
    artefactsCreated,
    pointsEarned: artefactsCreated * 30,
    timesUsed: artefactsCreated,
    unlocked: elearnDone,
    toolkitCompleted: toolkitDone,
    isAssigned,
  };
});
```

Extend `ToolLevelStats` interface:

```ts
export interface ToolLevelStats {
  levelNumber: number;
  toolId: string;
  artefactsCreated: number;
  pointsEarned: number;
  timesUsed: number;
  unlocked: boolean;       // elearn done → toolkit is unlocked
  toolkitCompleted: boolean; // NEW
  isAssigned: boolean;       // NEW
}
```

---

## 4. Tool Page Changes (All Five)

### Files
- `components/app/toolkit/AppPromptPlayground.tsx`
- `components/app/toolkit/AppAgentBuilder.tsx`
- `components/app/toolkit/AppWorkflowCanvas.tsx`
- `components/app/toolkit/AppDashboardDesigner.tsx`
- `components/app/toolkit/AppAppEvaluator.tsx`

### Change per file

**Import addition:**
```ts
import { completeToolkitPhase } from '../../../lib/database';
import { TOOL_TOPIC_MAPPING } from '../../../data/toolkitData';
```

**At the point the final output is displayed** (i.e., when `setResult(...)` is called with the completed output), add:

```ts
// After setResult(data):
if (user) {
  const toolId = 'prompt-playground'; // substitute correct id per file
  const mapping = TOOL_TOPIC_MAPPING[toolId];
  if (mapping) {
    completeToolkitPhase(user.id, mapping.level, mapping.topicId);
  }
  upsertToolUsed(user.id, mapping.level); // keep existing call
}
```

The `completeToolkitPhase` call is **idempotent** — calling it on a second or third generation run is safe and has no side effects beyond updating the timestamp.

**Per-file `toolId` values:**
- `AppPromptPlayground.tsx` → `'prompt-playground'`
- `AppAgentBuilder.tsx` → `'agent-builder'`
- `AppWorkflowCanvas.tsx` → `'workflow-canvas'`
- `AppDashboardDesigner.tsx` → `'dashboard-designer'`
- `AppAppEvaluator.tsx` → `'ai-app-evaluator'`

---

## 5. Component Changes

### 5.1 `hooks/useLevelData.ts` — Export `UseLevelDataReturn`
Add `markToolkitComplete` to the return type:
```ts
export interface UseLevelDataReturn {
  levelData: LevelData | null;
  loading: boolean;
  advanceSlide: (topicId: number, newSlide: number) => void;
  completePhase: (topicId: number) => void;
  completeTopic: (topicId: number) => void;
  markToolkitComplete: (topicId: number) => void; // NEW
}
```

### 5.2 `components/app/level/TopicHeader.tsx`

#### Props interface — add phase unlock flags
```ts
interface TopicHeaderProps {
  // ...existing props...
  phaseCompletions: [boolean, boolean, boolean]; // [elearn, toolkit, project]
  toolkitUnlocked: boolean;   // elearn done
  projectUnlocked: boolean;   // toolkit done
}
```

#### Phase tab rendering — locked state

Replace the current unconditional `onClick={() => onPhaseClick(phaseNum)}` with:

```ts
const PHASE_LABELS = ['E-Learning', 'Toolkit', 'Project'];

{PHASE_LABELS.map((label, i) => {
  const phaseNum = i + 1;
  const isDone = phaseCompletions[i];
  const isActive = phaseNum === currentPhase;

  // Determine if this phase is accessible
  const isLocked =
    (phaseNum === 2 && !toolkitUnlocked) ||
    (phaseNum === 3 && !projectUnlocked);

  return (
    <button
      key={i}
      onClick={isLocked ? undefined : () => onPhaseClick(phaseNum)}
      disabled={isLocked}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 8, border: 'none',
        cursor: isLocked ? 'default' : 'pointer',
        background: isActive ? accentColor : 'transparent',
        opacity: isLocked ? 0.45 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Badge: lock icon when locked, number otherwise */}
      <span style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        background: isLocked ? '#E2E8F0' : isActive ? accentDark : isDone ? '#1A202C' : '#E2E8F0',
        color: isLocked ? '#A0AEC0' : isActive || isDone ? '#FFFFFF' : '#A0AEC0',
        fontSize: 9, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isLocked
          ? <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M9 5H3V10H9V5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          : phaseNum
        }
      </span>
      <span style={{
        fontSize: 11, fontWeight: isActive ? 700 : 500,
        color: isLocked ? '#CBD5E0' : isActive ? accentDark : isDone ? '#4A5568' : '#A0AEC0',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  );
})}
```

#### `ProgressRing` — update to use `TOTAL_PHASES = 3`
No code change needed — it receives `total` as a prop and `AppCurrentLevel` passes `TOTAL_PHASES`.

### 5.3 `pages/app/AppCurrentLevel.tsx`

#### Destructure `markToolkitComplete` from hook
```ts
const { levelData, loading, advanceSlide, completePhase, completeTopic, markToolkitComplete } =
  useLevelData(currentLevel);
```

#### Pass phase unlock flags to `TopicHeader`
```ts
<TopicHeader
  // ...existing props...
  phaseCompletions={selectedProgress.phaseCompletions}
  toolkitUnlocked={isToolkitUnlocked(selectedProgress)}
  projectUnlocked={isProjectUnlocked(selectedProgress)}
/>
```

Import `isToolkitUnlocked` and `isProjectUnlocked` from `useLevelData`.

#### `handleCompletePhase` — no change needed
This fires on E-Learning completion and advances `phase` to 2. The transition from Toolkit (phase 2) to Project (phase 3) is driven automatically by the tool page via `completeToolkitPhase`.

However, `useLevelData` must **re-fetch or reactively update** when the toolkit completion fires from within the tool page (a separate route). Since the tool page runs in a different route, the `levelData` in `AppCurrentLevel` won't auto-update until the user navigates back and the hook re-runs. This is acceptable — when the user returns from the tool page, they land back on the Current Level page, which will re-mount `useLevelData` and fetch fresh state from Supabase, picking up the `read_completed_at` timestamp.

#### Phase 2 render block — replace current "Practise" card

Replace the existing `{displayPhase === 2 && (...)}` block entirely:

```tsx
{displayPhase === 2 && (
  <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
    <div style={{ maxWidth: 520, width: '100%', background: '#FFFFFF', border: `1.5px solid ${accentColor}44`, borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>

      {/* Phase heading */}
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accentColor}18`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>⚙️</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: accentDark, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>TOOLKIT — PHASE 2</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', marginBottom: 10 }}>
        {selectedTopic.toolkitToolId
          ? `Use the ${ALL_TOOLS.find(t => t.id === selectedTopic.toolkitToolId)?.name ?? 'toolkit'}`
          : 'Apply it with the toolkit'}
      </div>
      <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, marginBottom: 24 }}>
        {selectedTopic.phases[1]?.detail ?? 'Open the toolkit and work through all steps to complete this phase.'}
      </div>

      {/* Completion state */}
      {selectedProgress.phaseCompletions[1] ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#276749', fontWeight: 600 }}>
            ✓ Toolkit phase complete — Project unlocked
          </div>
          <button
            onClick={() => { setViewingPhase(3); scrollToTop(); }}
            style={{ background: accentColor, color: '#FFFFFF', border: 'none', borderRadius: 24, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Continue to Project →
          </button>
        </div>
      ) : (
        <a
          href={selectedTopic.toolkitToolPath}
          style={{ display: 'block', background: accentColor, color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 24, textDecoration: 'none' }}
        >
          Open {ALL_TOOLS.find(t => t.id === selectedTopic.toolkitToolId)?.name ?? 'Toolkit'} →
        </a>
      )}
    </div>
  </div>
)}
```

Import `ALL_TOOLS` from `'../../data/toolkitData'`.

#### Phase 3 render block — new Project phase

Add a new render block for `displayPhase === 3`:

```tsx
{displayPhase === 3 && (
  <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
    <div style={{ maxWidth: 520, width: '100%', background: '#FFFFFF', border: `1.5px solid ${accentColor}44`, borderRadius: 16, padding: '32px 28px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accentColor}18`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>◈</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: accentDark, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>PROJECT — PHASE 3</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', marginBottom: 10 }}>Apply it to a real challenge</div>
      <div style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, marginBottom: 24 }}>
        {selectedTopic.phases[2]?.detail ?? 'Complete and submit your project to finish this topic.'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a
          href="/app/projects"
          style={{ display: 'block', background: accentColor, color: '#FFFFFF', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 24, textDecoration: 'none' }}
        >
          Go to My Projects →
        </a>
        {!selectedProgress.phaseCompletions[2] && (
          <button
            onClick={() => handleCompleteTopic(selectedTopicId)}
            style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 24, padding: '11px 28px', fontSize: 13, fontWeight: 600, color: '#718096', cursor: 'pointer' }}
          >
            Mark topic as complete
          </button>
        )}
        {selectedProgress.phaseCompletions[2] && (
          <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#276749', fontWeight: 600 }}>
            ✓ Project complete — topic finished
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

Note: The "Mark topic as complete" button is a fallback for the period before automated project review is live. It can be removed once the project submission + review system fully drives `practise_completed_at`.

#### `completedPhases` calculation
Update to use the `phaseCompletions` array rather than the phase number:
```ts
const completedPhases = isCompleted
  ? TOTAL_PHASES
  : selectedProgress.phaseCompletions.filter(Boolean).length;
```

### 5.4 `components/app/LevelCard.tsx`

#### `PHASE_STEPS` constant — update to 3 entries
```ts
const PHASE_STEPS = [
  { label: 'E-Learning', shortLabel: 'E-Learn', icon: <Play size={11} /> },
  { label: 'Toolkit',    shortLabel: 'Toolkit',  icon: <Wrench size={11} /> },
  { label: 'Project',    shortLabel: 'Project',  icon: <FolderKanban size={11} /> },
];
```

#### `PhaseStepperWithTooltips` — add locked state rendering
The stepper currently computes `isDone` and `isCurrent` per step. Add `isLocked`:

```ts
const isLocked =
  (i === 1 && !phaseDetails[0]?.done) ||  // Toolkit locked until E-Learning done
  (i === 2 && !phaseDetails[1]?.done);    // Project locked until Toolkit done
```

Render a lock icon in the badge when `isLocked`:
```tsx
<span style={{
  // ...existing badge styles...
  opacity: isLocked ? 0.4 : 1,
}}>
  {isLocked
    ? <Lock size={8} />
    : isDone ? <Check size={8} /> : i + 1
  }
</span>
```

#### `PhaseStepperWithTooltips` props — extend `phaseDetails`
```ts
phaseDetails: {
  label: string;
  detail: string;
  done: boolean;    // NEW — needed for lock calculation
}[]
```

Update all call sites of `PhaseStepperWithTooltips` to include `done` in each `phaseDetails` entry, sourced from `topicPhases` from `useJourneyData`.

#### `LevelCard` — not-applicable state

Add a new `isAssigned` prop:
```ts
interface LevelCardProps {
  // ...existing props...
  isAssigned: boolean; // NEW
}
```

When `isAssigned === false`, render the card in a muted, non-interactive state:

```tsx
if (!isAssigned) {
  return (
    <div style={{
      background: '#FAFAFA',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      padding: '16px 20px',
      opacity: 0.55,
      position: 'relative',
      animationDelay: `${animDelay}ms`,
    }}>
      {/* Level badge + name — identical to normal card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          background: accentColor + '40',
          color: accentDark,
          fontSize: 9, fontWeight: 700,
          padding: '2px 8px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>Level {level.levelNumber}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{levelName}</span>
      </div>

      {/* Phase strip — show structure but greyed */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {['E-Learning', 'Toolkit', 'Project'].map((label) => (
          <span key={label} style={{
            fontSize: 10, fontWeight: 600, color: '#A0AEC0',
            background: '#F7FAFC', border: '1px solid #E2E8F0',
            borderRadius: 20, padding: '3px 10px',
          }}>{label}</span>
        ))}
      </div>

      {/* Not applicable badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 600, color: '#A0AEC0',
        background: '#F7FAFC', border: '1px solid #E2E8F0',
        borderRadius: 20, padding: '4px 10px',
      }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#CBD5E0" strokeWidth="1.5"/>
          <line x1="3" y1="3" x2="9" y2="9" stroke="#CBD5E0" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Not part of your current learning plan
      </div>
    </div>
  );
}
```

#### Pass `isAssigned` from `AppJourney`
In `AppJourney.tsx`, the existing `const isAssigned = !!planLevel` variable is already computed. Pass it as a prop to `<LevelCard isAssigned={isAssigned} ... />`.

### 5.5 `pages/app/AppJourney.tsx`

No new structural changes beyond:
- Pass `isAssigned` to `<LevelCard>` (see §5.4)
- Pass `topicPhases` to `<LevelCard>` (source from `useJourneyData` return value)

### 5.6 `pages/app/AppToolkit.tsx`

#### Gating display per level card

The toolkit page shows a card per level with the tool. Update the rendering to use the new `unlocked`, `toolkitCompleted`, and `isAssigned` fields from `useToolkitData`:

**If `!isAssigned`:**
Render a muted card with "Not part of your current learning plan" label. Same treatment as LevelCard (§5.4). Show the tool name and description greyed out.

**If `isAssigned && !unlocked` (E-Learning not complete):**
Render the tool card with a lock overlay:
```tsx
<div style={{
  background: '#F7FAFC', borderRadius: 14,
  border: '1px solid #E2E8F0', padding: '20px 24px',
  position: 'relative', overflow: 'hidden',
}}>
  {/* Tool name + description — greyed */}
  <div style={{ opacity: 0.4 }}>
    {/* existing tool card content */}
  </div>
  {/* Lock banner */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: '#1A202C', padding: '10px 16px',
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <Lock size={12} color="#A0AEC0" />
    <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0' }}>
      Complete the E-Learning for Level {levelNumber} to unlock
    </span>
  </div>
</div>
```

**If `isAssigned && unlocked && !toolkitCompleted`:**
Normal card. "Open tool" button active. No lock. Badge reads "Unlocked — not yet used".

**If `isAssigned && unlocked && toolkitCompleted`:**
Normal card with a completion badge: "✓ Completed" in level accent colour. "Open again" link still present.

---

## 6. Visual Specification

### Phase tab states (TopicHeader)

| State | Badge BG | Badge colour | Label colour | Clickable |
|-------|----------|-------------|--------------|-----------|
| Locked | `#E2E8F0` | `#A0AEC0` | `#CBD5E0` | No |
| Not started | `#E2E8F0` | `#A0AEC0` | `#A0AEC0` | No (not yet reached) |
| Active | `accentColor` | `accentDark` | `accentDark` | Yes |
| Done (not active) | `#1A202C` | `#FFFFFF` | `#4A5568` | Yes (review) |

### Not-applicable level cards (My Journey + My Toolkit)

- Overall `opacity: 0.55` on the card
- Background: `#FAFAFA`
- Border: `1px solid #E2E8F0`
- No hover effects, no click targets
- Badge: small pill, `#F7FAFC` bg, `#A0AEC0` text: "Not part of your current learning plan"
- Phase labels still visible as greyed pills — transparent about programme structure

### Toolkit phase card (Current Level page, Phase 2)

- Card border: `1.5px solid ${accentColor}44`
- Icon circle: `${accentColor}18` bg with `${accentColor}44` border
- CTA button: `accentColor` background, white text
- On completion: green success banner (`#F0FFF4` bg, `#276749` text, `#C6F6D5` border)

---

## 7. Routing Considerations

No new routes required. The three phases use the existing `/app/level?level=N` route with `viewingPhase` local state. The Toolkit phase links out to the existing `/app/toolkit/{toolPath}` route and returns to `/app/level?level=N` via the "My Journey" breadcrumb or direct navigation. State is refreshed on return via `useLevelData` re-mounting.

---

## 8. Edge Cases and Notes

### New topics added to a level
When a second topic is added to Level 1 (e.g., Context Engineering), the `TOOL_TOPIC_MAPPING` in `toolkitData.ts` must be extended with its tool ID and `{ level: 1, topicId: 2 }`. The `Topic` interface fields `toolkitToolId` and `toolkitToolPath` must be populated. The sequential unlock between Topic 1 and Topic 2 is already handled by `useLevelData`'s "first incomplete topic" logic — Topic 2 becomes the active topic only after Topic 1 is fully complete.

### E-Learning slide completion detection
"All slides visited" is already tracked via `visitedSlides` Set. The `ELearningView` component calls `onCompletePhase` when the user clicks "Finish E-Learning →" on the final slide. This already writes `elearn_completed_at` via `completePhaseDb`. No change needed here.

### User with no learning plan
If `getLearningPlan` returns null (user hasn't completed onboarding), treat all five levels as assigned (`isAssigned: true` for all). The `LearningPlanBlocker` component already guards the pages before the user reaches this state, so this is a belt-and-suspenders fallback.

### Backward compatibility — existing progress
Users who have already completed E-Learning and the "Practise" phase (old two-phase model) will have `elearn_completed_at` set and `practise_completed_at` set, but `read_completed_at` (now toolkit) will be null. Their topic will show as `phase: 3` (Project) in `current_phase`, but `toolkitCompletedAt` will be null — which means the Toolkit phase tab will appear locked.

To handle this gracefully, add a migration fallback in `useLevelData`'s fetch block: if `practise_completed_at` is set but `read_completed_at` is null, treat `toolkitCompletedAt` as if complete (inherit from practise completion date). This prevents existing users from being locked out of phases they've already passed through:

```ts
const toolkitCompletedAt =
  row?.read_completed_at
    ? new Date(row.read_completed_at)
    : row?.practise_completed_at   // migration fallback for pre-PRD users
      ? new Date(row.practise_completed_at)
      : null;
```

### `TOTAL_PHASES` change from 2 to 3
Any component currently referencing `TOTAL_PHASES` from `useLevelData` will automatically pick up the change. Audit references: `AppCurrentLevel` (completedPhases calculation — already updated above), `TopicHeader` (ProgressRing total prop — already updates via prop), `LevelCard` (uses `topic.phases.length` locally — already correct once phases array has 3 entries).

### Analytics phase count
`getProgressDashboard` currently uses `totalPhases = 20` (5 levels × 4). This changes to `15` (5 × 3). This is a deliberate correction — the old count included `read_completed_at` and `watch_completed_at` which were never wired up, so progress percentages in the admin dashboard were always artificially low. The corrected count will show higher percentages for existing users, which is accurate.

---

## 9. Implementation Order

To avoid breaking the live app at any point, implement in this order:

1. `data/levelTopics.ts` — add `toolkitToolId`, `toolkitToolPath`, update `phases` arrays
2. `data/toolkitData.ts` — add `TOOL_TOPIC_MAPPING`
3. `lib/database.ts` — add `completeToolkitPhase`, add column comments, update analytics phase count
4. `hooks/useLevelData.ts` — `TOTAL_PHASES = 3`, update `TopicProgress`, add `markToolkitComplete`, add unlock helpers
5. `hooks/useJourneyData.ts` — add `isAssigned`, `topicPhases`
6. `hooks/useToolkitData.ts` — replace `unlocked: true` with real gate logic
7. Tool pages (all five) — add `completeToolkitPhase` call at output generation
8. `components/app/level/TopicHeader.tsx` — 3-phase tabs with lock state
9. `pages/app/AppCurrentLevel.tsx` — Phase 2 and Phase 3 render blocks, updated `completedPhases`
10. `components/app/LevelCard.tsx` — 3-phase stepper, not-applicable state, `isAssigned` prop
11. `pages/app/AppJourney.tsx` — pass `isAssigned` and `topicPhases` to LevelCard
12. `pages/app/AppToolkit.tsx` — lock, unlocked, and completed states per level card

---

*Preserve all existing prop names, function signatures, and file structure not explicitly changed above. Do not rename any DB columns. Do not modify `watch_completed_at` — it remains in the schema and interfaces but is unused in the active topic model.*
