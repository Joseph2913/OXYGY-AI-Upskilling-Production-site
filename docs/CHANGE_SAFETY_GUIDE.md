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

### 2026-04-08: Artefact title generation silently failing

**What happened:** When a user saves an artefact from any toolkit page, the system saves it with a long fallback name (e.g. "Build Plan: The AI-powered knowledge platform will serve as a..."), then calls an AI function to generate a short, clean title and update the artefact. The AI correctly generated the title, but the database update silently failed. Users always saw the long, ugly name.

**Root cause:** The `generateArtefactTitle()` function in `lib/database.ts` updated the artefact record without including `user_id` in the query filter. The `artefacts` table has RLS requiring `auth.uid() = user_id`. Without the filter, Supabase silently rejected the update (0 rows affected, no error thrown). The function also didn't have access to `userId` — it wasn't in the function signature. The error was caught and silently swallowed, making the failure completely invisible.

**Why it wasn't caught:**
1. RLS failures are silent by design — Supabase returns no error, just 0 rows affected
2. The primary save worked correctly, so the feature appeared to work on first glance
3. The title update was fire-and-forget with a silent catch — no logging, no user feedback
4. The function was treated as a "cosmetic enhancement" and built to a lower standard than the primary save

**Fix applied:** Added `userId` parameter to `generateArtefactTitle()`, passed it from `createArtefactFromTool()`, and added `.eq('user_id', userId)` to the update query. Added error logging to the catch block.

**Rules created:** "Secondary Database Writes" and "Silent RLS Failure Prevention" in CLAUDE.md.

---

### 2026-04-08: generateProjectChips calling Anthropic API directly from browser

**What happened:** The browser console showed repeated CORS errors (`Fetch API cannot load https://api.anthropic.com/v1/messages due to access control checks`) and `TypeError: Load failed` for levels 1–5 every time the app loaded. The `generateProjectChips()` function in `lib/generateProjectChips.ts` was calling the Anthropic API directly from the browser instead of routing through a Firebase Cloud Function via OpenRouter.

**Root cause:** The function was written to call `https://api.anthropic.com/v1/messages` directly from client-side code. This violated two established rules simultaneously:
1. **All AI calls must go through OpenRouter** — the project uses a single OpenRouter API key (`OPEN_ROUTER_API` Firebase secret) to access all AI models. There is no Anthropic API key configured anywhere.
2. **All AI calls must go through Firebase Cloud Functions** — browser-side code cannot call AI provider APIs directly because (a) CORS blocks it, (b) it would expose API keys in the browser, and (c) the project architecture routes all AI through server-side functions.

The function used the Anthropic-native request format (`model: 'claude-sonnet-4-20250514'`, `content[0].text` response shape) instead of the OpenRouter/OpenAI-compatible format (`choices[0].message.content`), confirming it was written without consulting the existing API patterns in the codebase.

**Why it wasn't caught:**
1. The errors only appeared in the browser console — no visible UI failure (the feature silently fell back to no chips)
2. The function was added as a "background enhancement" and wasn't tested against the established API architecture
3. No automated check exists to flag direct provider API URLs in client-side code

**Fix applied:** (Pending) Route the call through a new Firebase Cloud Function that uses the existing `callOpenRouter()` helper in `functions/src/gemini.ts`.

**Rules created:** "No Direct Provider API Calls — Ever" added to both CLAUDE.md and this guide.

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

### 5. Every Supabase write must include `user_id` in the filter

Every `update` and `delete` query on an RLS-protected table must include `.eq('user_id', userId)` — not just the row's primary key. RLS requires this filter to match `auth.uid()`. Without it, the operation silently fails (0 rows affected, no error). If a function needs to write to a table but doesn't have access to `userId`, that's a design smell — either pass it through or move the write to a Cloud Function with service keys.

### 6. Never silently catch database write errors

A silent `catch {}` on a database write is never acceptable. The user believes their data was saved, but it wasn't. At minimum:
- Log the error with `console.error`
- Include the function name and the operation that failed
- Consider surfacing the failure to the user if the write affects visible state

Silent catches on reads are sometimes acceptable (show empty state, retry later). Silent catches on writes create invisible data loss.

### 7. Secondary writes get the same rigour as primary writes

When a function does "save X, then also update Y in the background," the secondary write (Y) must be built to the same standard as the primary write (X):
- Same `user_id` filtering
- Same error handling
- Same RLS awareness

If the secondary write affects something the user will see (like a title, a status, or a count), it's not optional — it's a first-class operation.

### 8. No direct provider API calls — ever

**Never call AI provider APIs (Anthropic, OpenAI, Google) directly — not from the browser, not from Cloud Functions.** Every AI call in this project MUST:

1. **Go through a Firebase Cloud Function** — never from client-side code. Browser-side `fetch()` to any AI provider will fail (CORS) and would expose API keys.
2. **Use OpenRouter as the single gateway** — the only AI endpoint is `https://openrouter.ai/api/v1/chat/completions`. The only API key is `OPEN_ROUTER_API` (Firebase secret). No other AI API keys exist or should be created.
3. **Use the shared helpers** — `callOpenRouter()` or `callOpenRouterRaw()` from `functions/src/gemini.ts`. Never write raw `fetch()` calls to any AI endpoint.
4. **Use OpenRouter model IDs** — e.g. `anthropic/claude-sonnet-4`, `google/gemini-2.0-flash-001`. Never use provider-native model IDs like `claude-sonnet-4-20250514`.

**How to verify before committing:** Search for direct provider URLs in any new or modified `.ts`/`.tsx` file:
```
grep -rn "api.anthropic.com\|api.openai.com\|generativelanguage.googleapis" --include="*.ts" --include="*.tsx"
```
If this returns any matches outside of documentation files, the code must be refactored before merging.

### 9. Check backward compatibility for stored data

When changing how data is formatted, existing rows in the database still have the old format. Code that reads this data must handle both old and new formats gracefully. For example, if `ambition` used to be `"build-full-apps"` (string) and is now stored as `"build-full-apps,lead-ai-strategy"` (comma-separated), every read path must handle both cases.
