# Oxygy AI Upskilling Website

## Project Overview
Interactive multi-section website for Oxygy's AI Centre of Excellence. Showcases a five-level AI upskilling framework. Dual audience: external clients (showcase) + internal participants (learning hub).

## Site Sections
1. Homepage / Hero
2. Five Levels (L1-L5, progressive complexity)
3. Cross-Functional Use Cases (8 functions)
4. Learning Formats
5. Skills-Based Competency Gaps
6. Using AI to Learn Better
7. Footer CTA

## Brand & Visual Guidelines

### Colors
- Dark Navy: #1A202C to #2D3748 (headings, hero bg, nav, primary text)
- Oxygy Blue: #1E3A5F to #2B4C7E (icon circles, accents)
- Teal: #38B2AC to #4FD1C5 (primary CTAs, accent borders, links)
- Lavender: #C3D0F5 to #B8C9F0
- Pale Yellow: #F7E8A4 to #FBE8A6
- Soft Peach: #F5B8A0 to #FBCEB1
- Sky Blue: #B2D8F7 to #B2F5EA
- Ice Blue bg: #E6FFFA to #F0FFF4
- White: #FFFFFF (dominant bg)
- Light Gray: #F7FAFC to #EDF2F7 (alt section bg)
- Medium Gray: #A0AEC0 (body text)
- Body Text Gray: #4A5568 to #718096
- Border Gray: #E2E8F0

### Typography
- Font: Geometric/humanist sans-serif from Google Fonts (DM Sans, Outfit, Plus Jakarta Sans, Manrope)
- NEVER: Inter, Roboto, Arial
- Headings: Bold 700-800, dark navy #1A202C. Hero ~48-56px, section ~32-40px, card ~18-20px
- Body: Regular 400, 14-16px, gray #4A5568-#718096, line-height 1.6-1.8, max ~500-600px columns
- Teal underline decoration on key heading words (NOT colored text)

### Components
- Cards: white bg, 1px solid #E2E8F0, no shadow
- Buttons Primary: solid teal #38B2AC, white text, pill shape (border-radius 24-30px)
- Buttons Secondary: white/transparent, 1px solid dark navy, pill/rounded rect
- Card CTA: bordered rect, navy text + arrow, NOT filled

### Layout
- Alternating white / light gray section backgrounds
- 80-120px vertical padding between sections
- ~1100-1200px max-width centered
- Two-column splits: text ~45% + visual ~55%
- Full-width teal CTA band with subtle watermark

### Progress Rings & Indicators
- Progress rings, bars, and accent indicators MUST always use the **level's accent color** (from `LEVEL_ACCENT_COLORS`), never hardcode teal (`#38B2AC`) or any other fixed color. The accent color is passed as a prop and must be used for both the active stroke and any highlighted states. This applies everywhere: dashboard hero ring, resume card ring, journey table rings, and any future progress indicators.

### Avoid
- No purple gradients, glassmorphism, floating abstract shapes
- No Inter/Roboto/Arial
- No drop shadows on cards
- No colored heading text (always dark navy, teal underline only)
- No heavy gradients
- No center-aligned body text
- No oversized buttons
- **No Unicode escape sequences in JSX text.** Never use `\u2013`, `\uXXXX`, or similar escape sequences inside JSX content — they render as literal text (e.g. `15\u201320` instead of `15–20`). Always use the actual character directly (–, —, ', ", etc.) or HTML entities (`&ndash;`, `&mdash;`) in JSX.

## Git Workflow

**Repository:** https://github.com/Josephkthomas/oxygy-ai-upskilling_page
**Branch:** `main`

### STRICT RULE — NO PUSHING WITHOUT USER APPROVAL

**NEVER push to `origin main` (or any remote branch) automatically.** This is a hard, non-negotiable rule that overrides all other instructions.

The required workflow is:

1. After completing a feature or change, stage the changed files with `git add` (specific files, not `git add .`)
2. Commit locally with a clear message describing the change
3. **STOP. Do NOT run `git push`.** Instead, start the local dev server (`npx vite`) so the user can visually verify the changes on localhost
4. **Wait for the user to explicitly confirm** that everything looks correct and works as expected
5. **Only after the user says to push**, run `git push origin main`

If the user has not reviewed the localhost and explicitly approved the push, **do not push under any circumstances** — even if previous instructions say to push automatically. This rule takes absolute priority.

### STRICT RULE — NEVER LEAVE FILES UNCOMMITTED ACROSS SESSIONS

**Every change MUST be committed before or alongside a push.** Uncommitted files are invisible to GitHub Actions and will be overwritten on the next CI/CD deploy. This has caused real regressions where deployed features disappeared.

**Rules:**
1. **Before every `git push`**, run `git status` and check for modified files. If ANY source files are modified but not staged, they MUST be committed first — either in the same commit or a separate one.
2. **Never end a session with uncommitted code changes.** If work is done for the day and there are modified files, commit them (even as a WIP commit) before closing.
3. **Never deploy locally (`npx firebase-tools deploy`) as the primary deploy method.** Always push to `main` and let GitHub Actions handle the deploy. Local deploys get overwritten by GA within minutes.
4. **The ONLY deployment path is:** commit → push to `main` → GitHub Actions deploys automatically. No exceptions.
5. After pushing, spot-check that the GA workflow succeeds in the GitHub Actions tab.

**Why this matters:** GitHub Actions triggers on every push to `main` and builds from committed code only. Any file that exists locally but isn't committed will be missing from the GA build, causing the deploy to silently roll back those changes. This is invisible until someone notices features have disappeared.

If a task involves multiple related changes, commit them together as one logical unit. If a task involves unrelated changes, use separate commits.

Never commit `.env.local`, credentials, or large binary files.

## Artifact Page Design Standards

Every Level artifact page (L1 Playground, L2 Agent Builder, L3 Workflow Designer, etc.) MUST follow this consistent layout pattern. These rules are non-negotiable for visual consistency across all artifact pages.

### Page Structure (top to bottom)

1. **Outermost container**: `min-h-screen bg-white pt-24 pb-16`
2. **Content wrapper**: `max-w-7xl mx-auto px-6` — full-width (1280px), NOT narrow (never use max-w-3xl for the main wrapper)
3. **Breadcrumb**: `← Back to Level N` link at top-left, `text-[14px] text-[#718096]`, hover changes to level accent color
4. **Centered Title**: `text-center`, `text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15]` with a `<br />` between two lines. One keyword gets an accent-colored underline (`absolute left-0 -bottom-1 w-full h-[4px] opacity-80 rounded-full`). NEVER use colored text — always dark navy with underline decoration only.
5. **Fun Fact Card**: Full-width `rounded-2xl` card with:
   - Subtle gradient background using the level's accent color at low opacity
   - Border: `1.5px solid [accent color]`
   - Three decorative dots top-left (`absolute top-3 left-4`, 2x2 rounded-full circles in accent colors)
   - "Did you know?" label: `text-[11px] font-bold uppercase tracking-[0.1em]` in accent color
   - Main fact: `text-[17px] md:text-[19px] font-medium text-[#2D3748] leading-[1.6]` with a key stat bolded in accent color
   - Supporting text: `text-[15px] text-[#718096] leading-[1.6]`
   - Text centered (`text-center`)
6. **Input Section**: Wrapped in a visually distinct colored card:
   - Background: subtle gradient using the level's accent color (e.g., lavender for L2, pale yellow for L3)
   - Border: `1.5px solid [accent color]`
   - Rounded: `rounded-2xl`
   - Padding: `p-6 sm:p-8`
   - Contains: example pills, labeled textareas, CTA button, optional callout
   - Textarea border color matches accent color (`border-2 border-[accent]`)
   - Focus state: `focus:border-[darker accent] focus:ring-[3px]`
7. **Results/Output Section**: Full-width cards, accordions, or canvas depending on the level
8. **Bottom Actions**: `Start Over` button + link to next level

### Level Accent Colors (for artifact pages)

| Level | Accent Light | Accent Dark | Use For |
|-------|-------------|-------------|---------|
| L1 | `#38B2AC` (Teal) | `#2C9A94` | Underline, fun fact, buttons, focus |
| L2 | `#C3D0F5` (Lavender) | `#5B6DC2` | Underline, fun fact, input card bg, buttons |
| L3 | `#FBE8A6` (Pale Yellow) | `#C4A934` | Underline, fun fact, input card bg, buttons |
| L4 | `#FBCEB1` (Soft Peach) | `#D97B4A` | Underline, fun fact, input card bg, buttons |
| L5 | `#38B2AC` (Teal) | `#2C9A94` | Underline, fun fact, input card bg, buttons |

### Rules

- Title is ALWAYS centered (`text-center`), NEVER left-aligned
- Fun fact card is ALWAYS present, NEVER omitted
- Input section ALWAYS has a colored background card, NEVER plain white
- Content uses `max-w-7xl` (full-width layout), NOT `max-w-3xl` or narrower
- Every artifact page has a breadcrumb, centered title, fun fact, input section, and results section in that order
- Toast notifications: fixed bottom-center, dark navy bg, white text
- Example pills are inline flex-wrap, styled with the level's accent border/bg
- CTA buttons use the level's dark accent color as background with white text

## Cross-Page Standards
- See `ARTIFACT_PAGE_STANDARDS.md` for mandatory design specifications for all artifact pages
- All new artifact pages MUST follow these standards
- Shared closing component: `components/ArtifactClosing.tsx`

## Local Development

**Always start the dev server on port 5173:** `npx vite --port 5173 --strictPort`

If port 5173 is occupied, kill existing processes first: `lsof -ti:5173 | xargs kill -9`, then start Vite. Never let Vite auto-pick another port — the user expects `http://localhost:5173/`.

## CI/CD — Auto-Deploy via GitHub Actions

Pushing to `main` automatically deploys to Firebase via GitHub Actions.

**Workflow file:** `.github/workflows/firebase-deploy.yml`

**What it does on every push to `main`:**
1. Installs frontend dependencies and builds with Vite
2. Installs and builds Cloud Functions
3. Deploys both hosting + functions to Firebase (`oxygy-ai-upskilling-site`)

**Required GitHub Secrets** (Settings → Secrets and variables → Actions):
- `FIREBASE_SERVICE_ACCOUNT` — Firebase service account JSON key (Firebase Console → Project Settings → Service accounts → Generate new private key)
- `VITE_SUPABASE_URL` — from `.env`
- `VITE_SUPABASE_ANON_KEY` — from `.env`

**To monitor a deploy:** GitHub repo → Actions tab. Each push triggers a new run (~2-3 mins). After it goes green, hard-refresh the site (Ctrl+Shift+R) to bypass browser cache.

**Note:** Manual deploys (`npx firebase-tools deploy`) are no longer needed for routine changes. Use them only for emergency hotfixes or secret/config updates.

## Hosting — Firebase ONLY (NO Vercel)

**This project is hosted entirely on Firebase. Vercel is NOT used.**

Do not create Vercel serverless functions, Vercel edge functions, or any `api/*.ts` files intended for Vercel. If a PRD or specification mentions Vercel, Netlify, or any other hosting platform, **ignore that and implement it on Firebase instead.**

- **Firebase Hosting** serves the static frontend (built by Vite into `dist/`)
- **Firebase Cloud Functions** handle all backend/API logic (`functions/src/index.ts`)
- **`firebase.json`** maps `/api/*` URL paths to Cloud Functions via `rewrites`
- The `api/` directory at the project root contains **legacy Vercel files that are NOT used in production** — all production API logic lives in `functions/src/index.ts`

### Deploying to Firebase

**CRITICAL: ALWAYS deploy BOTH hosting AND functions together. Never deploy one without the other.**

System prompts, AI logic, and all API behaviour live in Cloud Functions (`functions/src/index.ts`). Deploying only hosting leaves stale backend code in production — this has caused real bugs (e.g. prompt changes not taking effect for users).

**Standard deployment sequence:**
1. Build the frontend: `npx vite build`
2. Build functions (if any `.ts` files in `functions/` changed): `cd functions && npm run build && cd ..`
3. Deploy both: `npx firebase-tools deploy --only hosting,functions`

**Never run `--only hosting` alone** unless you are 100% certain no function code has changed. When in doubt, deploy both — it only adds ~60 seconds.

**Do NOT rely on `npx firebase-tools deploy` (no flags)** — it may deploy functions successfully while serving a stale hosting build. Always use the explicit `--only hosting,functions` flag after a fresh `npx vite build`.

After deploying, verify the release timestamp in Firebase Console → Hosting → Dashboard, and remind the user to **hard-refresh** (Cmd+Shift+R / Ctrl+Shift+R) to bypass browser cache.

### Caching Strategy

`firebase.json` uses a three-tier header strategy so team members never see stale app versions after a deploy:

1. **Catch-all `**`** → `no-cache, no-store, must-revalidate` — covers all SPA routes (`/app/dashboard`, etc.) which serve `index.html` via the rewrite. Firebase header `source` patterns match the **request URL**, not the rewrite destination, so a rule targeting only `index.html` misses SPA routes.
2. **`**/*.@(js|css)`** → `immutable, max-age=1yr` — safe because Vite hashes filenames; a new deploy = new filename = cache miss.
3. **`**/*.@(png|jpg|jpeg|gif|svg|ico|webp)`** → `max-age=1day` — moderate cache for images.

Firebase applies the **last matching** header for conflicts, so rules 2 & 3 override rule 1 for static assets. **Never remove the catch-all rule or revert to targeting only `index.html`.**

### Adding a new API endpoint

1. Add the Cloud Function in `functions/src/index.ts` using `onRequest()` from `firebase-functions/v2/https`
2. Add a rewrite in `firebase.json` under `hosting.rewrites`: `{ "source": "/api/your-endpoint", "function": { "functionId": "yourfunctionname" } }`
3. Call it from the frontend as `fetch('/api/your-endpoint', ...)`
4. **Do NOT create files in the `api/` directory** — those are legacy Vercel artifacts

## API Calls — OpenRouter Only

**All AI API calls MUST go through OpenRouter** — never call provider APIs (Anthropic, Google, OpenAI) directly.

- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Auth:** `Authorization: Bearer <OPEN_ROUTER_API_KEY>`
- **Response format:** OpenAI-compatible (`choices[0].message.content`)
- **Model selection:** Use the OpenRouter model ID to pick the provider:
  - `anthropic/claude-sonnet-4` — Claude Sonnet (used by Prompt Playground v2)
  - `google/gemini-2.0-flash-001` — Gemini Flash (used by most other toolkit tools)
  - Choose the best model for the use case; the key is the same regardless of provider
- **Firebase secret:** `OPEN_ROUTER_API` (set via `firebase functions:secrets:set OPEN_ROUTER_API`)
- **Shared helpers:** `functions/src/gemini.ts` exports `callGemini()` / `callOpenRouter()` / `callOpenRouterRaw()`

## Supabase RLS Policies — Recursion Prevention

**READ `docs/SUPABASE_RLS_RECURSION_GUIDE.md` before writing or modifying ANY RLS policy.**

This project experienced a critical RLS infinite recursion bug (2026-03-16) where cross-table policy references created a cycle: `profiles` → `user_org_memberships` → `profiles`. Key rules:

1. **Never create circular cross-table references** in RLS policies. If table A's policies query table B, table B's policies must NOT query table A.
2. **Always use `LANGUAGE plpgsql`** for SECURITY DEFINER functions. `LANGUAGE sql` functions get inlined by PostgreSQL, silently stripping SECURITY DEFINER context.
3. **Use existing SECURITY DEFINER helper functions** instead of raw subqueries in policies:
   - `is_oxygy_admin()` — checks if current user is oxygy_admin/super_admin
   - `get_admin_org_ids()` — returns org_ids where current user is org admin
   - `get_user_org_ids()` — returns org_ids where current user is any active member
   - `get_org_colleague_ids()` — returns all user_ids in the same org(s) as current user
4. **Never use raw subqueries on `user_org_memberships`** within policies on the same table — causes infinite recursion. Always use `get_user_org_ids()`.
5. **Never use `profiles.org_id`** for org membership checks — multi-tenancy uses `user_org_memberships`, not `profiles.org_id`.
6. **Audit all existing policies** before adding new ones: `SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'your_table'`
7. **PostgreSQL evaluates ALL select policies (OR'd)** — one recursive policy poisons every query on that table, even if simpler policies exist.

## Supabase RLS — Mandatory Org-Scoped SELECT Policies (CRITICAL)

**Every table whose data is read by `getOrgLeaderboard()` or any other cross-user feature (cohort page, leaderboard, admin analytics) MUST have an org-scoped SELECT policy.** Without it, user A cannot see user B's data even if they are in the same org — the Supabase anon key enforces RLS on all client-side queries, silently returning zero rows instead of an error.

### Required policy pattern
Every such table needs **both** of these SELECT policies:
1. `"Users can read own …"` → `auth.uid() = user_id` (own data)
2. `"Org members can read org …"` → `user_id IN (SELECT get_org_colleague_ids())` (colleague data)

### Tables that MUST have org-scoped SELECT policies

| Table | Org-scoped SELECT policy | Used by leaderboard for |
|-------|:------------------------:|-------------------------|
| `profiles` | ✅ Required | Names, streak days, current level |
| `topic_progress` | ✅ Required | E-learning completion count |
| `artefacts` | ✅ Required | Artefact/toolkit count + per-level 3-phase check |
| `project_submissions` | ✅ Required | Project scores (tier points) + per-level 3-phase check |
| `activity_log` | ✅ Required | Active days in last 30 days |
| `application_insights` | ✅ Required | App evaluator insights |

### What happens when the policy is missing
A missing org-scoped SELECT policy causes **silent data loss** — no errors, just zero rows returned for other users. This leads to:
- **Wrong scores**: components of the score that depend on the invisible table read as 0
- **Wrong levels**: the 3-phase completion check fails (e.g. missing project data → no level ever completes → user shows as L1)
- **Wrong completion %**: derived from the broken 3-phase check → shows 0%
- **Inconsistent views**: each user sees correct data for themselves but wrong data for every colleague

### Rule for new tables
When creating any new table that stores per-user data which other org members need to see (for leaderboard, cohort, admin views, or any cross-user feature), **always add the org-scoped SELECT policy at table creation time**:
```sql
CREATE POLICY "Org members can read org [table_name]"
ON [table_name] FOR SELECT
USING (user_id IN (SELECT get_org_colleague_ids()));
```
Never defer this to a later PR — a missing policy is invisible until someone notices wrong numbers in production.

## Data Shape Changes — Full-Stack Trace Required (CRITICAL)

**When changing the type, format, or shape of ANY data field, you MUST trace the full journey of that data through every layer of the system BEFORE writing any code.** A field change is never just a frontend change — it touches the database, API, validation rules, and every consumer.

### Background (2026-04-07 incident)
The `ambition` field was changed from single-select (string) to multi-select (array). The frontend was updated, but the database had a CHECK constraint that only accepted single enum values. The comma-separated string from the multi-select was rejected by the database, causing profile saves to fail silently in production.

### Mandatory checklist for ANY data shape change

Before changing a field's type or format, complete this checklist in order:

1. **Database column type** — Is the column `text`, `jsonb`, `integer`, etc.? Will the new format fit?
2. **Database constraints** — Run: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'TABLE_NAME'::regclass;` Check for CHECK constraints, ENUM types, NOT NULL rules, foreign keys.
3. **Database defaults** — Does the column have a default that conflicts with the new format?
4. **Write path** — Trace every function that writes to this column. What format does it send? Will the new format pass validation?
5. **Read path** — Trace every function that reads this column. Will they parse the new format correctly? Do any do `=== 'value'` comparisons that would break with comma-separated strings?
6. **API layer** — Does the backend API (Cloud Functions) reference this field? Does it need to handle both old and new formats for backward compatibility?
7. **Other consumers** — Search the entire codebase with `Grep` for the field name. Check every file that references it.

### Rules
1. **Always check database constraints first** — before writing any frontend code. Run the SQL query above.
2. **Migration before code** — if a constraint needs to change, apply the database migration FIRST, then change the code.
3. **Handle backward compatibility** — existing data in the old format must still work. If the column has `'build-full-apps'` (old single value) and new code expects an array, add parsing logic for both formats.
4. **Never assume a field is frontend-only** — every field that touches a form is stored somewhere. Trace it.

## End-to-End Flow Verification (CRITICAL)

**When editing code inside a user-facing flow (onboarding, project submission, toolkit save, etc.), you MUST verify that the entire flow completes successfully — not just the specific lines you changed.**

### Background (2026-04-07 incident)
The onboarding survey was edited to change the ambition selector. The code changes were correct in isolation, but the broader onboarding flow had a pre-existing bug: the `onboarding_completed` flag was never being set to `true` after plan generation. This meant every user who completed onboarding was shown the survey again on page reload. The bug existed before the edit but should have been caught while working in the same file.

### Mandatory checklist for flow-critical code changes

When editing code inside any of these flows, verify the FULL cycle works:

| Flow | What to verify |
|------|---------------|
| **Onboarding** | Survey → Generate → Profile saved → Plan saved → `onboarding_completed = true` → Reload → Dashboard shown (not survey) |
| **E-Learning completion** | Finish module → `topic_progress` updated → Dashboard/Journey reflect completion → Phase shows "Done" |
| **Toolkit save** | Create artefact → `artefacts` table updated → Toolkit phase marked complete → Progress rings update |
| **Project submission** | Submit → `project_submissions` updated → Status shows "Submitted" → After review, level advances |
| **Profile update** | Edit profile → `profiles` table updated → All pages reflect new data |

### Rules
1. **Read the surrounding flow, not just the lines you're changing.** If you're editing line 500 of OnboardingSurvey.tsx, also read what happens at line 510, 520, 530 — what runs after your edit? Does the flow reach its intended conclusion?
2. **Check that every "success" state is actually persisted.** If a flow ends with a success card shown to the user, verify that the database reflects that success too. A success message without a database write is a lie.
3. **Verify the re-entry path.** After a flow completes, what happens when the user refreshes or comes back later? Does the app know the flow was completed, or does it show the flow again?
4. **If you find a pre-existing bug while editing a flow, flag it.** Don't silently move past it. Tell the user: "I noticed that [X] isn't working correctly in this flow — should I fix it as part of this change?"

## Component Import Safety

**Every icon or component used in a file MUST be imported.** A missing import (e.g. using `FileText` without importing it from `lucide-react`) will cause a `ReferenceError` at runtime that crashes the entire React tree — the user sees a blank page with no visible error unless they open the console.

**Rules:**
1. When adding a new icon or component reference to a file, always verify it is listed in the file's import statement.
2. After editing a component, check the browser console for `ReferenceError` or `is not defined` errors — these indicate missing imports.
3. Never assume an icon/component is already imported. Grep the import block before using it.

## Variable Removal & Rename Safety

**When removing or renaming ANY variable, function, or type, ALWAYS grep the entire codebase for remaining references before finishing.** A missed reference will cause a `ReferenceError` at runtime that crashes the app — the user sees a broken page with no data.

**Rules:**
1. After every variable removal or rename, run `Grep` for the old name across all `*.ts` and `*.tsx` files.
2. Verify **zero matches** before moving on.
3. Do this even if you believe the variable was only used in one place — shared hooks (`useDashboardData`, `useJourneyData`, `useLevelData`, etc.) are consumed by multiple files.
4. Do NOT rely on the TypeScript compiler to catch these — pre-existing TS errors can mask new ones, and Vite's dev server may not surface them until the code path executes at runtime.

## Async State & Onboarding Guards

**Never derive initial UI state from async values that haven't loaded yet.** Context values like `hasLearningPlan` default to `false` before Supabase responds. If you use them to initialise `useState`, the component will render incorrectly during loading and may never self-correct.

**Rules:**
1. If a state value depends on an async context value, default to a safe/neutral state and let a `useEffect` set the correct value once loading completes.
2. Any `useEffect` that sets a boolean to `true` based on a condition must also set it to `false` in the `else` branch — otherwise state can get stuck.
3. Background refresh functions (e.g. `refreshLearningPlan()`) must NOT set loading flags that cause parent components to re-render with skeletons. Use a ref to track whether the initial load is done, and only show loading UI on the first call.

## Cross-Hook Data Invalidation (CRITICAL)

**Every database write that changes progress data MUST call `invalidateProgress()` from AppContext.** Without this, other pages display stale data — the write succeeds but the UI doesn't update until a full page reload.

### How it works
`AppContext` exposes a `dataVersion` counter and an `invalidateProgress()` function that increments it. The data-fetching hooks (`useDashboardData`, `useJourneyData`, `useToolkitData`) include `dataVersion` in their dependency arrays, so incrementing it triggers a re-fetch.

### When to call `invalidateProgress()`
Any function that writes to these tables MUST call it afterward:
- `topic_progress` — e-learning completion, toolkit phase completion, topic completion
- `artefacts` — saving a toolkit artefact (any of the 5 tools)
- `project_submissions` — submitting or saving a project draft
- `activity_log` — logging user activity (streak/active days)
- `profiles` — updating current level

### At-risk write functions (must always trigger invalidation)
| Function | Table | Called from |
|----------|-------|------------|
| `completePhaseDb()` | topic_progress | `useLevelData.completePhase()` |
| `completeToolkitPhase()` | topic_progress | `useLevelData.markToolkitComplete()` |
| `completeTopicDb()` | topic_progress | `useLevelData.completeTopic()` |
| `createArtefactFromTool()` | artefacts | All 5 toolkit tool pages |
| `submitProject()` | project_submissions + others | `useProjectData.submitForReview()` |
| `upsertProjectDraft()` | project_submissions | `useProjectData.saveDraft()` |
| `logActivity()` | activity_log | `useLevelData` (multiple places) |

### Rules for new write operations
1. If your new code writes to any table that `useDashboardData`, `useJourneyData`, or `useToolkitData` reads from, you MUST call `invalidateProgress()` after the write.
2. Never assume navigation will trigger a re-fetch — hooks only re-run when their dependency arrays change.
3. Call `invalidateProgress()` AFTER the database write succeeds, not before.

### Background (2026-03-25 incident)
Users completed e-learning but the dashboard still showed "Resume E-Learning" and My Journey showed the phase as "To do". The Current Level page (which uses local state) displayed correctly, masking the fact that cross-page state was stale. The root cause was that `completePhaseDb()` wrote to Supabase but no hook was notified to re-fetch. This same pattern affected all 8 write operations listed above.

## Topic Completion — Canonical Logic (CRITICAL)

**Every piece of code that checks whether a topic is complete MUST use the 3-phase check exclusively.** This is non-negotiable.

A topic is complete if and only if ALL three user-visible phases are done:
1. **E-Learning**: `elearn_completed_at` is set in `topic_progress`
2. **Toolkit**: artefact count > 0 for the level (from `getArtefactCountsByLevel`)
3. **Project**: level's project submission has `status === 'passed'` (from `getAllProjectSubmissions`)

**NEVER use `completed_at` as a completion signal** — it may be set prematurely in the database (e.g. from testing or legacy writes), causing the system to report 100% completion even when the project has not been submitted. The `completed_at` field is treated as a cache/write-through artefact only, never as the source of truth. If code ever reads `completed_at` to determine completion, it is a bug.

**NEVER use `read_completed_at` or `practise_completed_at`** as proxies for toolkit/project completion. These are legacy DB timestamp fields that do not get set in the current 3-phase flow. Toolkit completion is determined by artefact count > 0 (from `getArtefactCountsByLevel`). Project completion is determined by project submission status === 'passed' (from `getAllProjectSubmissions`). The completion logic MUST match what the dashboard UI displays as 100%.

Using the wrong fields causes:
- Wrong current level (user stuck on a completed level)
- Wrong completion percentages in progress rings
- Levels incorrectly locked/greyed out
- Leaderboard scores that don't match visible progress

The canonical implementation lives in `hooks/useDashboardData.ts`. Any new code that checks topic completion — for level advancement, progress display, unlock gating, scoring, or any other purpose — must replicate this logic exactly.

## Level Advancement & Unlock Logic (CRITICAL)

When a user completes all active topics in a level (using the 3-phase check above), the following MUST happen immediately and consistently across ALL pages:

### Auto-advance to next level
1. The **current level** is always the first level where not all topics are complete. Derive it by iterating levels 1-5 and finding the first level NOT in the `completedLevelSet`.
2. If the next level is assigned in the user's learning plan → its status MUST be `'active'`, giving full access to all phases (E-Learning, Toolkit, Project).
3. If the next level is NOT assigned → show "Not part of your current learning plan" and grey it out.

### Phase access within an active level — NO sequential locking
Once a level's status is `'active'` (or `'completed'` or `'project-pending'`), ALL three phases — E-Learning, Toolkit, and Project — MUST be immediately accessible. There is NO sequential phase-locking within a level (i.e. do not require E-Learning to be done before Toolkit, or Toolkit before Project). Phases may show their current state (To do / Done) but must never show a lock icon or be unclickable for an accessible level.

### Status promotion rule (CRITICAL — applies to `useJourneyData`)
A level with zero progress rows in the DB would normally compute as `'not-started'`. If that level IS the current level (first level not in `completedLevelSet`) AND it is assigned in the user's learning plan, its status MUST be upgraded to `'active'`. Never leave the current assigned level in `'not-started'` — this causes the My Journey page to show all phases locked.

### Where level status MUST be consistent
- **Dashboard hero card**: shows current level number, name, and overall progress ring in the level's accent color
- **Dashboard resume card**: shows next topic to work on with phase progress ring in the level's accent color
- **Dashboard journey table**: all 5 levels visible; completed levels show 100%, current level active with all phases accessible, future unassigned levels greyed
- **My Journey page (`AppJourney`)**: level cards show `status: 'completed'` for completed levels, `'active'` for the current level — never `'not-started'` for the current assigned level
- **Toolkit page (`AppToolkit`)**: tools unlock when either (a) the level's own elearn is done, OR (b) all previous levels are complete (i.e. `prevLevelsComplete`)
- **Current Level page (`AppCurrentLevel`)**: navigates to the correct current level automatically
- **Cohort page**: scores and ranks derived from completed topics/levels using the same `completedLevelSet`

### Progress ring color rule (CRITICAL)
Every progress ring, progress bar, or circular indicator MUST use the **level's accent color** from `LEVEL_ACCENT_COLORS[level]`. NEVER hardcode `#38B2AC` (teal) or any other fixed color. The accent color MUST be passed as a prop and used for both the active stroke and any highlighted states. This applies to: dashboard hero ring, dashboard resume card ring, journey table rings, and any future progress indicators.

### Rules for all hooks
Every hook that derives level state (`useDashboardData`, `useJourneyData`, `useToolkitData`) MUST:
1. Build a `completedLevelSet` using the canonical 3-phase topic completion check
2. Derive `currentLevel` from `completedLevelSet` (first level NOT in the set)
3. Never use `userProfile.currentLevel` as the source of truth — it may be stale. Always derive from live data and sync back to the profile if needed.
4. In `useJourneyData`, promote `'not-started'` → `'active'` for the derived current level if it is assigned.

### 3-Phase Model & Legacy DB Column Mapping (CRITICAL)

The platform uses a **3-phase model**: E-Learning → Toolkit → Project. There are NO "Read" or "Watch" phases.

The `topic_progress` table still has legacy column names from a previous 4-phase model. The current mapping is:

| Phase | Phase Number | DB Column | Purpose |
|-------|-------------|-----------|---------|
| E-Learning | 1 | `elearn_completed_at` | E-learning module finished |
| Toolkit | 2 | `read_completed_at` | Toolkit artefact saved (legacy column name) |
| Project | 3 | `practise_completed_at` | Project submission passed (legacy column name) |
| — | — | `watch_completed_at` | **UNUSED — do not read or write** |

**Rules:**
1. `current_phase` values are 1–3, NOT 1–4. Max is 3.
2. `completePhaseDb()` maps phase numbers 1/2/3 to the columns above. Phase 4 does not exist.
3. `watch_completed_at` is a dead column — never read it, never write it, never use it in any logic.
4. `phasesCompleted` arrays are always 3 elements: `[elearn, toolkit, project]`, NOT 4.
5. When adding new code that reads phase completion, use the column mapping above — not the column name.

## Navigation & Scroll Behaviour — App Shell Rules

These rules apply to every page under `/app/*` and must be followed consistently across all current and future pages.

### Scroll-to-top on route change
Every route change within the app shell must scroll the window to the top. This is handled globally by the `ScrollToTop` component in `components/app/ScrollToTop.tsx`, which is rendered inside the router in `App.tsx`. **Do not add per-page scroll-to-top logic.** The global component handles it. If you add a new route, it is covered automatically.

### Toolkit step auto-scroll
Every toolkit tool page (Prompt Playground, Agent Builder, Workflow Canvas, Dashboard Designer, App Evaluator) must auto-scroll to the next step card when a step is completed. Use a `ref` on each step card div and call `ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })` with a 120ms delay after the state update that reveals the next step. **Never require the user to manually scroll down to see that a new step has been revealed.**

### Settings panel
The Settings button in the sidebar opens a slide-in panel (`components/app/AppSidebar.tsx`). It is **not** a separate route. Do not create a `/app/settings` page. All settings UI lives in the panel. When adding new settings options, add them to the panel's existing sections — do not create new routes or pages.

### In-page anchor navigation
When any button or link is intended to scroll the user to a specific section within the same page (e.g. clicking a level dot scrolling to that level's card), use `ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`. Never rely on the user manually scrolling. Any interactive element that implies "jump to section X" must deliver that scroll automatically.

## Reference
- Full content spec: OXYGY_AI_UPSKILLING_SYSTEM_PROMPT.md
- PDF content source: OXYGY_AI_Upskilling.pdf
- RLS recursion guide: SUPABASE_RLS_RECURSION_GUIDE.md
- Journey page post-mortem: docs/JOURNEY_BLANK_PAGE_POSTMORTEM.md
- Change safety guide: docs/CHANGE_SAFETY_GUIDE.md

## Skills

Before building any e-learning page or learning module, read and follow:
`PRD/SKILL-Elearning-Page.md`

This file defines the mandatory template, brand tokens, component specs, slide types, and quality rules for all e-learning pages on this site. Do not deviate from it.
