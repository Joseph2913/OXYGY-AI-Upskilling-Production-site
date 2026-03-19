# Post-Mortem: Blank My Journey Page (2026-03-19)

## Symptoms

- Clicking "My Journey" in the sidebar showed a completely blank page.
- Reloading on `/app/journey` redirected the user to the onboarding survey, even though they had already completed it.
- Completing the onboarding survey did not show the completion card; the page flickered and went blank again.

## Root Causes

### 1. Missing `FileText` import in LevelCard.tsx (immediate crash)

`LevelCard.tsx` used the `FileText` icon from `lucide-react` at line 437 but did not include it in the import statement. This caused an **unrecoverable `ReferenceError`** at runtime:

```
Uncaught ReferenceError: FileText is not defined
    at LevelCard (LevelCard.tsx:437:22)
```

React caught this as a component error and unmounted the entire `<LevelCard>` subtree. Since `AppJourney` renders five `LevelCard` components and has no error boundary, the crash propagated and blanked the page.

**Fix:** Added `FileText` to the lucide-react import in `LevelCard.tsx`.

### 2. `showOnboarding` initialised from stale async state (wrong initial render)

In `AppJourney.tsx`, the `showOnboarding` state was initialised like this:

```typescript
const [showOnboarding, setShowOnboarding] = useState(() => {
  if (!hasLearningPlan || simulateNewUser || demoMode) return true;
  return sessionStorage.getItem('oxygy_survey_active') === 'true';
});
```

**Problem:** `hasLearningPlan` defaults to `false` in `AppContext` because the Supabase query hasn't completed yet. So on first render, `!hasLearningPlan` is `true`, and `showOnboarding` is set to `true` even for users who have a plan.

**Why it persisted:** The sync `useEffect` that was supposed to correct this only had a branch to set `showOnboarding = true` (when no plan found) but no branch to set it back to `false` (when plan is found). So even after `hasLearningPlan` flipped to `true`, the onboarding stayed visible.

**Fix:**
- Changed initialisation to default to `false` while `learningPlanLoading` is `true`.
- Added an `else` branch to the sync `useEffect` to dismiss onboarding when `hasLearningPlan` is `true`.

### 3. Background refresh triggered loading skeleton (completion card wipe)

After onboarding completion, `OnboardingSurvey` called `refreshLearningPlan()` to update the context. This function set `learningPlanLoading = true`, which caused `AppJourney` to re-render and show a loading skeleton — destroying the completion card the user was supposed to see.

**Fix:** Added a `useRef` flag (`learningPlanInitialLoadDone`) in `AppContext`. `checkLearningPlan()` now only sets `learningPlanLoading = true` on the first call. Subsequent refresh calls silently update `hasLearningPlan` without triggering the skeleton.

## Files Changed

| File | Change |
|------|--------|
| `components/app/LevelCard.tsx` | Added `FileText` to lucide-react imports |
| `context/AppContext.tsx` | Added `useRef` import; `checkLearningPlan()` skips loading state on background refreshes |
| `pages/app/AppJourney.tsx` | Fixed `showOnboarding` initialisation; added `else` branch to sync `useEffect` |

## Prevention Rules (added to CLAUDE.md)

1. **Always verify imports.** When using an icon or component in JSX, confirm it appears in the file's import block. A missing import = blank page with no visible UI error.
2. **Never derive initial state from unloaded async values.** If a context value hasn't loaded yet, default to a neutral state and let a `useEffect` correct it.
3. **Every useEffect that conditionally sets `true` must also handle `false`.** Otherwise state gets stuck.
4. **Background refresh functions must not trigger loading UI.** Use a ref to distinguish the initial load from subsequent refreshes.
