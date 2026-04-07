# Change Safety Guide

This document captures lessons learned from production incidents and establishes mandatory practices to prevent them from recurring. Every developer (human or AI) working on this codebase must follow these rules.

---

## Incident Log

### 2026-04-07: Ambition multi-select broke profile saves

**What happened:** The `ambition` field in the onboarding survey was changed from single-select (one string value) to multi-select (array of strings). The frontend was updated correctly, but the Supabase `profiles` table had a CHECK constraint (`profiles_ambition_check`) that only accepted one of five specific single values. The code joined multiple selections with commas (e.g. `"build-full-apps,lead-ai-strategy"`), which the constraint rejected. Profile saves failed silently, and the user saw "Something went wrong saving your profile."

**Root cause:** The data field's type was changed in the frontend without checking whether the database had validation rules on that column. The change was treated as a frontend-only task when it was actually a full-stack change.

**Fix applied:** Dropped the `profiles_ambition_check` constraint via Supabase migration.

**Rule created:** "Data Shape Changes — Full-Stack Trace Required" in CLAUDE.md.

---

### 2026-04-07: Onboarding survey shown repeatedly after completion

**What happened:** Users who completed the onboarding survey and received their learning plan were shown the survey again on every page reload. The app never recorded that onboarding was complete.

**Root cause:** The `onboarding_completed` field existed in the `profiles` table and was checked on every page load, but no code ever set it to `true`. The `upsertProfile()` function didn't include it in its field mapping, and `saveLearningPlan()` only wrote to the `learning_plans` table without updating the profile. This was a pre-existing bug that should have been caught when the onboarding flow was being edited.

**Fix applied:** (Pending) Wire up `onboarding_completed = true` in the learning plan save flow.

**Rule created:** "End-to-End Flow Verification" in CLAUDE.md.

---

### 2026-04-07: GitHub Actions overwrote locally deployed changes

**What happened:** 84 source files had been modified locally but never committed to git. Local deploys via `npx firebase-tools deploy` included these changes, but every push to `main` triggered GitHub Actions, which built from committed code only. The GA deploy finished after the local deploy and silently rolled back all uncommitted work.

**Root cause:** Changes were being deployed locally without being committed. The CI/CD pipeline and local deploys were racing against each other, with GA always winning.

**Fix applied:** Committed all 84 pending files. Added strict rule to CLAUDE.md that the only deployment path is commit -> push -> GA.

**Rule created:** "STRICT RULE — NEVER LEAVE FILES UNCOMMITTED ACROSS SESSIONS" in CLAUDE.md.

---

## Mandatory Practices

### 1. Trace data changes through every layer

When changing the type, format, or shape of any data field:

```
Frontend (component) 
  -> Type definition (types.ts) 
  -> API call (functions/src/index.ts) 
  -> Database write (lib/database.ts) 
  -> Database column + constraints (Supabase) 
  -> Database read (lib/database.ts) 
  -> Every consumer (grep the field name)
```

**Before writing any code**, run this SQL to check for constraints:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'TABLE_NAME'::regclass;
```

### 2. Verify flows end-to-end, not just the lines you changed

If you're editing code inside a critical flow (onboarding, project submission, toolkit save, e-learning completion), verify the FULL cycle:

- Does the action persist to the database?
- Does the app know the action happened on the next page load?
- Does refreshing the page show the correct state?

A success message shown to the user without a corresponding database write is a bug.

### 3. Flag pre-existing bugs when you find them

If you're editing a file and notice that the surrounding code has a bug (even one unrelated to your task), flag it immediately. Don't silently move past it. The fact that you're already reading that code means you're in the best position to catch it.

### 4. Every change must be committed before pushing

Never leave modified files uncommitted. GitHub Actions builds from committed code only. Any uncommitted file will be missing from the production deploy.

### 5. Check backward compatibility for stored data

When changing how data is formatted, existing rows in the database still have the old format. Code that reads this data must handle both old and new formats gracefully. For example, if `ambition` used to be `"build-full-apps"` (string) and is now stored as `"build-full-apps,lead-ai-strategy"` (comma-separated), every read path must handle both cases.
