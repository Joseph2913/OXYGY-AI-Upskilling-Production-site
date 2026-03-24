# PRD: Scoring System v2 — Leaderboard Formula Overhaul

## 1. Overview

This PRD replaces the existing leaderboard scoring formula across the Oxygy platform. It covers:

1. A new scoring formula prioritising projects > e-learning > toolkit activity > consistency signals
2. A new database column on `project_submissions` to make tier data queryable
3. Retrospective recalculation for all existing users (automatic, since scores are computed dynamically)
4. Updated UI in `AppToolkit.tsx` ("How Scoring Works" card)
5. Resolution of the existing discrepancy between `database.ts` and `useToolkitData.ts`

**Retrospective behaviour:** Scores in this system are not stored — they are computed on demand in `getLeaderboardMembers()` in `lib/database.ts`. This means updating the formula automatically recalculates all historical user scores. No data migration is needed for scores themselves. The only schema migration required is adding `tier_letter` to `project_submissions` and backfilling it from existing `review_dimensions` data.

---

## 2. New Scoring Formula

### Constants (define at top of `lib/database.ts`)

```typescript
export const SCORING = {
  PROJECT_POINTS: { S: 50, A: 42, B: 35, C: 30, R: 0 } as Record<string, number>,
  ELEARN_COMPLETION: 25,        // per topic where elearn_completed_at is set
  TOOLKIT_SESSION: 7,           // per artefact created (proxy for session — see note)
  TOOLKIT_SAVE_BONUS: 3,        // additional pts per artefact saved (always added, no cap)
  STREAK_DAY: 2,                // per consecutive day, max STREAK_CAP
  STREAK_CAP: 14,
  ACTIVE_DAY: 1,                // per distinct active day in last 30, max ACTIVE_CAP
  ACTIVE_CAP: 30,
} as const;
```

**Note on toolkit session vs save split:** `upsertToolUsed` currently records a single boolean per level, not a session count. There is no separate session-count table. For now, the 7+3 split is applied per artefact: every artefact created earns 10 pts total (7 session + 3 save). This is numerically equivalent and requires no new tracking infrastructure. A future improvement would be to log a `tool_generate` event to `activity_log` before the artefact is saved, enabling the split to function independently of whether the user saves.

### Formula applied in `getLeaderboardMembers()`

```typescript
const score =
  projectScore +                          // sum of PROJECT_POINTS[tierLetter] per passed submission
  (elearnCount * SCORING.ELEARN_COMPLETION) +   // topics with elearn_completed_at set
  (artefactCount * SCORING.TOOLKIT_SESSION) +   // proxy for sessions
  (artefactCount * SCORING.TOOLKIT_SAVE_BONUS) + // save bonus (same artefact count = always added)
  (streakDays * SCORING.STREAK_DAY) +
  (activeDays30 * SCORING.ACTIVE_DAY);
```

Which simplifies to:

```typescript
const score =
  projectScore +
  (elearnCount * 25) +
  (artefactCount * 10) +    // 7 + 3, no cap
  (streakDays * 2) +        // cap enforced before this line
  (activeDays30 * 1);       // cap enforced before this line
```

---

## 3. Schema Migration — `project_submissions`

The tier letter (S/A/B/C/R) is currently stored only inside the artefact's JSON `content` field. It is not queryable as a column. To make it available to the leaderboard query without parsing JSONB in a batch fetch, add a `tier_letter` column.

### Migration SQL

Run this in Supabase SQL editor:

```sql
-- Add tier_letter column
ALTER TABLE project_submissions
  ADD COLUMN IF NOT EXISTS tier_letter TEXT DEFAULT NULL;

-- Backfill existing passed submissions from their linked artefact content
-- This reads the tier stored in artefacts.content->>'tier' for all project_proof artefacts
UPDATE project_submissions ps
SET tier_letter = a.content->>'tier'
FROM artefacts a
WHERE a.id = ps.artefact_id
  AND a.type = 'project_proof'
  AND ps.tier_letter IS NULL
  AND ps.review_passed = true;
```

Verify the backfill worked:

```sql
SELECT id, level, status, review_passed, tier_letter
FROM project_submissions
WHERE review_passed = true
ORDER BY created_at DESC;
```

Any rows where `review_passed = true` but `tier_letter IS NULL` after backfill indicate submissions that don't have a linked artefact yet. These can be manually resolved or left as 0 pts until the user's next activity triggers a re-review.

---

## 4. Changes to `lib/database.ts`

### 4a. Add SCORING constants (top of file, after imports)

Add the `SCORING` constant block defined in Section 2 above.

### 4b. Fix existing discrepancy

Remove any hardcoded `25` or `30` values used for artefact points in the file. All point values must reference `SCORING.*` constants from this point forward.

### 4c. Update `getLeaderboardMembers()` function

**Step 1 — Remove the existing insight query** (query 5, fetching from `application_insights`). Insights have been removed from the product. Delete:
- The Supabase query fetching `insightRows`
- The `insightCountMap` computation block
- The `insightCount` variable
- The `(insightCount * 30)` term in the score formula

**Step 2 — Update the topic phase query** (query 3). Change the select to only fetch `elearn_completed_at` — the other phase columns are no longer scored:

```typescript
const { data: topicRows } = await supabase
  .from('topic_progress')
  .select('user_id, elearn_completed_at')
  .in('user_id', userIds);
```

**Step 3 — Replace `phaseCountMap` with `elearnCountMap`**. The current block counts all four phase columns. Replace entirely with:

```typescript
const elearnCountMap = new Map<string, number>();
(topicRows || []).forEach((row: Record<string, unknown>) => {
  const uid = row.user_id as string;
  if (row.elearn_completed_at) {
    elearnCountMap.set(uid, (elearnCountMap.get(uid) || 0) + 1);
  }
});
```

**Step 4 — Add a project tier query** (new query, after artefact count query):

```typescript
// Batch fetch passed project submissions with tier letters
const { data: projectRows } = await supabase
  .from('project_submissions')
  .select('user_id, tier_letter')
  .in('user_id', userIds)
  .eq('review_passed', true);
```

**Step 5 — Add `projectScoreMap` computation** (after the artefact count block):

```typescript
const projectScoreMap = new Map<string, number>();
(projectRows || []).forEach((row: Record<string, unknown>) => {
  const uid = row.user_id as string;
  const tier = (row.tier_letter as string) || 'R';
  const pts = SCORING.PROJECT_POINTS[tier] ?? 0;
  projectScoreMap.set(uid, (projectScoreMap.get(uid) || 0) + pts);
});
```

**Step 6 — Update the score formula** in the `scored` array map:

Replace:
```typescript
const phasesCompleted = phaseCountMap.get(userId) || 0;
const artefactCount = Math.min(artefactCountMap.get(userId) || 0, 20);
const insightCount = Math.min(insightCountMap.get(userId) || 0, 10);
const streakDays = Math.min(profile?.streak_days || 0, 14);
const activeDays30 = Math.min(activeDaysMap.get(userId) || 0, 30);

const score =
  (phasesCompleted * 4) +
  (artefactCount * 25) +
  (insightCount * 30) +
  (streakDays * 5) +
  (activeDays30 * 2);
```

With:
```typescript
const projectScore = projectScoreMap.get(userId) || 0;
const elearnCount = elearnCountMap.get(userId) || 0;
const artefactCount = artefactCountMap.get(userId) || 0;  // no cap
const streakDays = Math.min(profile?.streak_days || 0, SCORING.STREAK_CAP);
const activeDays30 = Math.min(activeDaysMap.get(userId) || 0, SCORING.ACTIVE_CAP);

const score =
  projectScore +
  (elearnCount * SCORING.ELEARN_COMPLETION) +
  (artefactCount * (SCORING.TOOLKIT_SESSION + SCORING.TOOLKIT_SAVE_BONUS)) +
  (streakDays * SCORING.STREAK_DAY) +
  (activeDays30 * SCORING.ACTIVE_DAY);
```

**Step 7 — Remove insight-related fields from the returned `ScoredMember` object** if `insightCount` is currently included. Check the `ScoredMember` interface and the return object — remove `insightCount` from both.

---

## 5. Changes to `hooks/useToolkitData.ts`

The hook currently sets `pointsEarned: artefactsCreated * 30`. Update to use the SCORING constants and match the new formula:

```typescript
import { SCORING } from '../lib/database';

// In the levelStats map:
pointsEarned: artefactsCreated * (SCORING.TOOLKIT_SESSION + SCORING.TOOLKIT_SAVE_BONUS),
```

This resolves the existing discrepancy (was 30, now correctly 10 per artefact matching the leaderboard formula).

Also update:
```typescript
timesUsed: artefactsCreated,  // unchanged — proxy for sessions until session tracking is added
```

---

## 6. Write-time update — `upsertProjectArtefact()`

When a reviewed project submission is saved (the function `upsertProjectArtefact` in `lib/database.ts`), also write the tier letter back to `project_submissions`. This ensures `tier_letter` stays current without needing to re-run the backfill SQL for new submissions.

Locate the `upsertProjectArtefact` function. After the artefact is successfully written, add:

```typescript
// Keep tier_letter on project_submissions in sync
await supabase
  .from('project_submissions')
  .update({ tier_letter: tierLetter, updated_at: new Date().toISOString() })
  .eq('id', submission.id)
  .eq('user_id', userId);
```

This call should be fire-and-forget (no error throw) — it's a cache column, not the source of truth.

---

## 7. Changes to `pages/app/AppToolkit.tsx` — "How Scoring Works" UI

Update the scoring breakdown pills in the `showScoring` collapsible card. Replace the current five rows with the following four:

```typescript
[
  { label: 'Per project completed (C–S tier)', value: '30–50 pts', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Per e-learning module completed',  value: '25 pts',    color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Per toolkit artefact created',     value: '10 pts',    color: '#38B2AC', bg: '#E6FFFA' },
  { label: 'Per streak day (max 14)',           value: '2 pts',     color: '#ED8936', bg: '#FFF5EB' },
  { label: 'Per active day, last 30',           value: '1 pt',      color: '#718096', bg: '#F7FAFC' },
]
```

Also update the explanatory copy (the `div` on the left of the scoring card) to:

> "Points are earned by completing e-learning modules, using toolkit tools, and submitting projects. Project scores scale with the quality grade your submission receives — stronger projects earn more. Your cohort leaderboard ranking reflects the depth of your engagement, not just how often you log in."

---

## 8. Retrospective Score Recalculation

Because `getLeaderboardMembers()` computes scores dynamically from raw database tables on every call, **no score migration is required**. The moment the formula changes in `database.ts`, all leaderboard scores reflect the new formula automatically — including all historical data.

The only action needed for existing users is the SQL backfill in Section 3 (populating `tier_letter` on existing `project_submissions`). Without this, existing passed project submissions will score 0 pts under the new formula, because the leaderboard query reads `tier_letter` and finds `NULL`.

**Order of operations for deployment:**

1. Run the SQL migration (Section 3) in Supabase — backfill `tier_letter` on existing rows
2. Deploy the updated `lib/database.ts` — new formula goes live, leaderboard immediately reflects it for all users
3. Deploy the updated `hooks/useToolkitData.ts` — toolkit page points display now matches leaderboard
4. Deploy the updated `pages/app/AppToolkit.tsx` — scoring UI card shows correct values

**Do not deploy step 2 before step 1.** If the formula goes live before `tier_letter` is populated, existing passed project submissions will temporarily score 0 pts on the leaderboard.

---

## 9. Developer Notes

- **`SCORING` export**: export the constant so it can be imported by `useToolkitData.ts` and any future components that need to display point values. Centralising in `lib/database.ts` ensures the formula shown in the UI always matches what's computed.
- **`insightCount` removal**: double-check the `ScoredMember` interface return type. If `insightCount` is in the interface, remove it. If it's used anywhere on the Cohort leaderboard UI (`pages/app/AppCohort.tsx`), remove or hide that column.
- **No cap on artefacts**: the previous formula capped artefacts at 20. The new formula has no cap. Remove the `Math.min(..., 20)` call around `artefactCount`.
- **Streak cap**: still enforced at 14 days via `Math.min(..., SCORING.STREAK_CAP)`. No change to streak calculation logic.
- **Active days cap**: still enforced at 30 days via `Math.min(..., SCORING.ACTIVE_CAP)`. No change.
- **`totalPhases` constant**: the existing code uses `const totalPhases = 20` (5 levels × 4 phases) to compute `completionPct`. Update to reflect that only elearn is now scored: `const totalPhases = 5` (one elearn module per level, assuming one topic per level for now — revisit if multi-topic levels are added). Adjust `completionPct` computation accordingly.
- **Verify post-deployment**: after deploying all four steps, check the leaderboard for 2–3 known test users and manually verify their scores match the formula expectations.
