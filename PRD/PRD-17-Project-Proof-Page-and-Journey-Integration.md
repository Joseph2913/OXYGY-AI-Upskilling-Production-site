# PRD 17 — Project Proof Page & My Journey Integration
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing), PRD 02 (Dashboard), PRD 03 (My Journey), PRD 04 (Current Level), PRD 05 (My Toolkit), PRD 16 (Learning Plan Gating & Onboarding) — all must be complete and passing acceptance criteria before starting this PRD  
**Followed by:** PRD 18 — AI Project Review System

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRDs 01–05 and PRD 16 are complete and passing all acceptance criteria
2. Read `supabase/schema.sql` in full — you are adding a new table (`project_submissions`) and extending `level_progress`
3. Read `src/pages/app/AppJourney.tsx` — you are adding project brief sections to every level card and a new "Project Pending" visual state
4. Read `src/components/app/LevelCard.tsx` — this is the component you will extend with project brief content
5. Read `src/data/levelTopics.ts` — specifically `LEVEL_META` for level names, accent colours, and taglines
6. Read `src/lib/database.ts` — you are adding new database functions for project submissions
7. Read `src/context/AppContext.tsx` — you are extending the context with project submission state
8. Read `src/hooks/useJourneyData.ts` — you are extending this hook to fetch project submission data alongside journey progress
9. Read `src/components/dashboard/sections/MyProgress.tsx` — you are adding inline project status to this component
10. Read `src/App.tsx` — you are adding a new route: `/app/journey/project/:level`

**Important context about PRD 18 (AI Project Review System):**

This PRD builds the complete project submission system — the form, the data model, the file uploads, and the journey integration. However, **submissions in this PRD auto-complete on submit.** There is no AI review step yet. PRD 18 will add:

- An API endpoint that accepts submission data + screenshots and returns a structured review scorecard
- A review scorecard UI component (Zone 4) on the project proof page
- A status flow change: submit → AI review → pass/needs-revision (instead of submit → auto-complete)
- Resubmission logic for "needs revision" feedback

**What this means for your work in PRD 17:**

- The `project_submissions` table you create includes columns for AI review data (`review_dimensions`, `review_summary`, `review_encouragement`, `review_passed`, `reviewed_at`) — but these remain `null` in this PRD. They exist so PRD 18 doesn't need a schema migration.
- The status flow in this PRD is: `draft` → `submitted` → `passed` (auto-set on submit). PRD 18 will change this to: `draft` → `submitted` → `passed` OR `needs_revision`.
- Leave a clearly marked **Zone 4 placeholder** in the project proof page layout where the review scorecard will render. This placeholder should be invisible to users but present in the component structure as a comment and an empty container with a `data-testid="review-scorecard-zone"` attribute.
- The "Submit for Review" button text should say exactly that — "Submit for Review" — even though this PRD auto-completes. This ensures the UI language is already correct for when PRD 18 adds the actual review step.

---

## 1. Overview

### Purpose
This PRD delivers two things: a **dedicated page where learners submit proof of real-world projects** (one page per level), and the **integration of project status into My Journey** so the learner's progress map reflects their applied work alongside their content completion.

It also introduces the platform's **two-tier progression model**: completing e-learning, toolkit, and workshop activities unlocks the next level's content (so learners aren't blocked while doing real-world project work), but the level is only fully "complete" when the project is also submitted and accepted.

### What this PRD delivers
1. **New Supabase table** — `project_submissions` for storing submission drafts, evidence, and review data
2. **Schema extension** — `project_completed` and `project_completed_at` columns on `level_progress`
3. **Two-tier progression model** — "Unlocked" (can access next level content) vs "Complete" (project done)
4. **My Journey level card extensions** — Project brief section, status badges, four-activity tracker on each card
5. **New "Project Pending" level card state** — For levels where content is done but project is not
6. **Project Proof page** — `/app/journey/project/:level` with level-specific submission forms, auto-save drafts, image upload, and submit flow
7. **My Progress integration** — Inline project status on the dashboard progress section
8. **New route** — `/app/journey/project/:level` added to React Router

### What this PRD does NOT deliver
- AI-powered review of submissions (PRD 18)
- Review scorecard UI (PRD 18)
- Resubmission flow for "needs revision" feedback (PRD 18)
- Organisation-level scoping (future PRD)

### Key design principles
**Projects are the capstone, not a checkbox.** The proof page should feel like a professional portfolio workspace, not a homework upload form. The submission experience should make learners feel proud of what they've built.

**Unlock fast, complete thoughtfully.** Learners shouldn't be blocked from new content while working on a multi-day project. The two-tier model keeps momentum while maintaining rigour.

**Progressive proof complexity.** L1 asks for a reflection. L5 asks for a case study. The proof mechanism escalates with the levels, just like everything else in the framework.

---

## 2. Two-Tier Progression Model

This is the most significant architectural change in this PRD. It redefines how level advancement works.

### Current model (PRDs 01–05)
A level is "complete" when all e-learning topics have `completed_at` set. Completing the final topic increments `profiles.current_level` and unlocks the next level.

### New model (this PRD)

**Level "unlocked" (next level content accessible):**
All e-learning topics completed + toolkit tool used (`tool_used = true` in `level_progress`) + workshop attended (`workshop_attended = true` in `level_progress`).

When these three conditions are met, `profiles.current_level` increments — exactly as it does today. The learner can access the next level's e-learning, toolkit, and workshop immediately.

**Level "complete" (full credit):**
All of the above + project submitted and passed (`project_completed = true` in `level_progress`).

Until the project is complete, the level card on My Journey shows in a new "Project Pending" state (see Section 4) — visually distinct from both "active" and "completed."

### Implementation

The existing level completion logic in `AppCurrentLevel.tsx` (PRD 04, Section 12) already increments `current_level` when all topics are done. **Do not change this trigger.** The project is an additional requirement for full completion, not a blocker for level unlocking.

Add the project check as a **display concern only** — My Journey reads both the existing topic/tool/workshop data AND the new `project_completed` flag to determine which visual state to show. The routing/access logic (what content the user can see) is unchanged — it still relies solely on `profiles.current_level`.

This separation is critical: `current_level` controls **access**, `project_completed` controls **display**.

---

## 3. Schema Changes

### 3.1 New table: `project_submissions`

```sql
-- PROJECT SUBMISSIONS
-- Run this migration in the Supabase dashboard before deploying this PRD.
create table if not exists project_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  level int not null check (level >= 1 and level <= 5),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'passed', 'needs_revision')),

  -- Card A: What You Built / Designed
  tool_name text,
  platform_used text,
  tool_link text,
  screenshot_paths text[],          -- array of Supabase Storage paths

  -- Card B: How You Applied It
  reflection_text text,

  -- Card C: What Impact It Had
  adoption_scope text
    check (adoption_scope is null or adoption_scope in (
      'just-me', 'immediate-team', 'wider-department', 'organisation-wide'
    )),
  outcome_text text,

  -- Card D: Case Study (L5 only)
  case_study_problem text,
  case_study_solution text,
  case_study_outcome text,
  case_study_learnings text,

  -- AI Review (populated by PRD 18 — null in this PRD)
  review_dimensions jsonb,          -- four-dimension scorecard
  review_summary text,
  review_encouragement text,
  review_passed boolean,
  reviewed_at timestamptz,

  -- Timestamps
  submitted_at timestamptz,
  completed_at timestamptz,         -- set when project is accepted (auto-set in this PRD)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Constraint: one submission per user per level
  unique (user_id, level)
);

alter table project_submissions enable row level security;
create policy "Users can read own submissions"
  on project_submissions for select using (auth.uid() = user_id);
create policy "Users can insert own submissions"
  on project_submissions for insert with check (auth.uid() = user_id);
create policy "Users can update own submissions"
  on project_submissions for update using (auth.uid() = user_id);

create index project_submissions_user_level
  on project_submissions(user_id, level);
```

### 3.2 Extend `level_progress`

```sql
alter table level_progress
  add column if not exists project_completed boolean default false,
  add column if not exists project_completed_at timestamptz;
```

### 3.3 Supabase Storage bucket

Create a new storage bucket for project screenshots:

```
Bucket name: project-screenshots
Public: false (private — accessed via signed URLs)
File size limit: 5MB per file
Allowed MIME types: image/png, image/jpeg, image/webp
```

Storage policy:
```sql
-- Users can upload to their own folder
create policy "Users upload own screenshots"
  on storage.objects for insert
  with check (bucket_id = 'project-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- Users can read their own screenshots
create policy "Users read own screenshots"
  on storage.objects for select
  using (bucket_id = 'project-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own screenshots
create policy "Users delete own screenshots"
  on storage.objects for delete
  using (bucket_id = 'project-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
```

File path convention: `{userId}/{level}/{timestamp}_{filename}`

Include all SQL above as a comment block at the top of the new database functions file with instructions to run in Supabase dashboard.

---

## 4. My Journey — Level Card Extensions

### 4.1 New Level Card State: "Project Pending"

In addition to the existing three states (completed, active, locked), add a fourth: **project pending**.

**When it applies:** A level where:
- All e-learning topics have `completed_at` set
- `tool_used = true` in `level_progress`
- `workshop_attended = true` in `level_progress`
- BUT `project_completed = false` or no project submission exists

This is a level where the learner has done all the content work and unlocked the next level, but hasn't submitted their project yet.

**Visual treatment:**
```
cardBorder: {levelAccent}88
cardLeftBorder: {levelAccent}
cardBg: #FFFFFF
cardCursor: pointer
```

The card looks similar to a completed card but with a distinguishing marker. It should feel "almost done" — settled but with one clear call to action remaining.

**Status badge (top-right of card header):**
- Text: "Project Pending"
- `background: #FEFCE8`, `border: 1px solid #FDE68A`, `color: #92400E`
- `font-size: 11px`, `font-weight: 700`, `padding: 4px 12px`, `border-radius: 20px`

**All other card content** (topic list, stats, description) renders identically to the completed state — topics are all shown as done, stats are populated.

The key visual difference from "completed" is:
1. The status badge says "Project Pending" (amber) instead of "✓ Complete" (green/accent)
2. The project brief section (see 4.2) shows a prominent "Start Project" or "Continue Project" CTA instead of "Completed ✓"
3. The four-activity tracker (see 4.3) shows three filled dots and one open

### 4.2 Project Brief Section (All Level Cards)

Add a new section at the bottom of every level card, below the existing content (topic list, stats, etc.), separated by a thin divider.

**Divider:**
```
border-top: 1px solid {levelAccent}22
margin-top: 14px
padding-top: 14px
```

**Section layout:**
```
display: flex
align-items: flex-start
justify-content: space-between
gap: 16px
```

**Left side — project info:**

- **Section label:** "YOUR PROJECT" — `fontSize: 10px`, `fontWeight: 700`, `color: {levelAccentDark}`, `textTransform: uppercase`, `letterSpacing: 0.08em`, `marginBottom: 6px`
- **Project title:** pulled from `learning_plans.levels_data` for this level — `fontSize: 14px`, `fontWeight: 700`, `color: #1A202C`, `marginBottom: 4px`
- **Deliverable:** one line from the learning plan — `fontSize: 12px`, `color: #4A5568`, `lineHeight: 1.5`

If no learning plan data exists for this level (the level was classified as "skip" or "awareness"), show:
- Text: "No project assigned for this level." — `fontSize: 12px`, `color: #A0AEC0`, `fontStyle: italic`

**Right side — status + CTA:**

A vertical stack (flex column, align-items: flex-end, gap: 8px):

**Status badge** (pill):

| Status | Background | Border | Text Colour | Label |
|---|---|---|---|---|
| Not Started | `#F7FAFC` | `1px solid #E2E8F0` | `#A0AEC0` | "Not Started" |
| Draft Saved | `#FEFCE8` | `1px solid #FDE68A` | `#92400E` | "Draft Saved" |
| Submitted | `#F0FFFC` | `1px solid #A8F0E0` | `#1A6B5F` | "Submitted" |
| Passed | `{levelAccent}22` | `1px solid {levelAccent}` | `{levelAccentDark}` | "Completed ✓" |
| Needs Revision | `#FFF7ED` | `1px solid #FDBA74` | `#9A3412` | "Needs Revision" |

All badges: `fontSize: 11px`, `fontWeight: 600`, `padding: 3px 10px`, `borderRadius: 16px`

**CTA button** (below the badge):

| Status | Text | Style |
|---|---|---|
| Not Started | "Start Project →" | Secondary: `border: 1px solid {levelAccentDark}`, `color: {levelAccentDark}`, `background: transparent`, `borderRadius: 20px`, `padding: 6px 16px`, `fontSize: 12px`, `fontWeight: 600` |
| Draft Saved | "Continue Project →" | Same secondary style |
| Submitted / Passed | "View Submission →" | Text link: `color: {levelAccentDark}`, `fontSize: 12px`, `fontWeight: 600`, no border/background |
| Needs Revision | "View Feedback →" | Secondary style with amber accent: `border-color: #F59E0B`, `color: #92400E` |

All CTAs navigate to `/app/journey/project/{level}`.

**For locked level cards:**
The project section renders in fully muted style:
- Label: "YOUR PROJECT" in `#CBD5E0`
- Text: "Complete Level {n-1} to unlock your project brief." — `fontSize: 12px`, `color: #A0AEC0`
- No badge, no CTA

### 4.3 Four-Activity Progress Tracker

Add a row of four small indicators to the **active** and **project pending** level card headers. This sits to the left of the status badge, inline with the card header row.

**Layout:**
```
display: flex
align-items: center
gap: 6px
margin-right: 12px
```

**Four indicators:**

| Position | Icon | Label (tooltip) |
|---|---|---|
| 1 | `BookOpen` (12px) | E-Learning |
| 2 | `Wrench` (12px) | Toolkit |
| 3 | `Users` (12px) | Workshop |
| 4 | `Target` (12px) | Project |

**Each indicator:**
- Container: `20px × 20px` circle, `display: flex`, `alignItems: center`, `justifyContent: center`
- **Complete:** `background: {levelAccent}`, icon colour: `{levelAccentDark}`
- **Incomplete:** `background: transparent`, `border: 1.5px solid #E2E8F0`, icon colour: `#CBD5E0`

**Tooltip on hover:** Show the activity name — `fontSize: 11px`, simple native `title` attribute is sufficient.

**Determination logic:**
- E-Learning complete: all topics for this level have `completed_at` set
- Toolkit complete: `tool_used = true` in `level_progress` for this level
- Workshop complete: `workshop_attended = true` in `level_progress` for this level
- Project complete: `project_completed = true` in `level_progress` for this level

**For completed level cards:** All four dots are filled. The tracker shows inline but in a more muted position (smaller, less prominent).

**For locked level cards:** Do not show the four-activity tracker.

---

## 5. Project Proof Page

### Route
`/app/journey/project/:level`

Add this route to `src/App.tsx` inside the `/app` route group:
```tsx
<Route path="journey/project/:level" element={<AppSuspense><AppProjectProof /></AppSuspense>} />
```

**Sidebar:** "My Journey" remains the active nav item on this route. Add route matching for `/app/journey/*` to the sidebar's active-state logic.

### Page-level guards

1. If `hasLearningPlan === false` → show `LearningPlanBlocker` (from PRD 16)
2. If `:level` param is not a number 1–5 → redirect to `/app/journey`
3. If the level has no project brief in `learning_plans.levels_data` (was classified as "skip" or "awareness") → show an empty state: "No project has been assigned for this level." with a "Back to My Journey" link
4. If the level is still locked (`:level` > `profiles.current_level` AND the previous level's content isn't all done) → show a locked state: "Complete Level {n-1} to unlock this project." with a "Back to My Journey" link

### Page layout

```
background: #F7FAFC
padding: 28px 36px
max-width: 720px
margin: 0 auto
font-family: 'DM Sans', sans-serif
```

### Structure (top to bottom)

```
<BackLink />                    ← "← Back to My Journey"
<ProjectBriefCard />            ← Zone 1: read-only brief from learning plan
<ReviewScorecard />             ← Zone 4 placeholder (PRD 18)
<SubmissionForm />              ← Zone 2: level-specific input cards
<SubmissionControls />          ← Zone 3: save/submit controls
```

---

### 5.1 Back Link

```
margin-bottom: 20px
```

- Text: "← Back to My Journey"
- `fontSize: 13px`, `fontWeight: 500`, `color: #718096`
- Hover: `color: #4A5568`
- On click: `navigate('/app/journey')`
- The `←` is a Lucide `ArrowLeft` icon, size 14, inline

---

### 5.2 Zone 1: Project Brief Card (Read-Only)

Displays the project brief from the user's learning plan. This reminds the learner what they're supposed to have done.

**Card:**
```
background: #FFFFFF
borderRadius: 16px
border: 1px solid #E2E8F0
borderLeft: 4px solid {levelAccentDark}
padding: 24px 28px
marginBottom: 20px
```

**Contents:**

- **Level badge:** `"LEVEL {n} — {LEVEL_NAME}"` — `fontSize: 10px`, `fontWeight: 700`, `color: {levelAccentDark}`, `textTransform: uppercase`, `letterSpacing: 0.08em`

- **Project title:** from `learning_plans.levels_data[level].projectTitle` — `fontSize: 20px`, `fontWeight: 800`, `color: #1A202C`, `marginTop: 8px`

- **Project description:** from `levels_data[level].projectDescription` — `fontSize: 14px`, `color: #4A5568`, `lineHeight: 1.6`, `marginTop: 8px`

- **Deliverable row:** `marginTop: 14px`, flex row with icon
  - `FileText` icon (14px, `{levelAccentDark}`)
  - **Label:** "Deliverable:" — `fontSize: 13px`, `fontWeight: 600`, `color: #1A202C`
  - **Text:** from `levels_data[level].deliverable` — `fontSize: 13px`, `color: #4A5568`

- **Challenge connection:** `marginTop: 10px`, flex row with icon
  - `Lightbulb` icon (14px, `{levelAccentDark}`)
  - **Text:** from `levels_data[level].challengeConnection` — `fontSize: 13px`, `color: #718096`, `fontStyle: italic`, `lineHeight: 1.5`

---

### 5.3 Zone 4 Placeholder: Review Scorecard (PRD 18)

This is where PRD 18's AI review scorecard will render. In this PRD, it is invisible to users.

```tsx
{/* Zone 4: AI Review Scorecard — populated by PRD 18 */}
<div data-testid="review-scorecard-zone" />
```

No visual output. Just a marker in the DOM for PRD 18 to replace.

---

### 5.4 Zone 2: Submission Form

The form consists of a series of **section cards** — one per proof category. Each card is a white container.

**Shared card style:**
```
background: #FFFFFF
borderRadius: 14px
border: 1px solid #E2E8F0
padding: 20px 24px
marginBottom: 16px
```

**Shared label style:**
```
fontSize: 14px
fontWeight: 600
color: #1A202C
marginBottom: 2px
```

**Shared helper text style:**
```
fontSize: 12px
color: #718096
marginBottom: 10px
```

**Shared text input style:**
```
width: 100%
background: #FFFFFF
border: 1px solid #E2E8F0
borderRadius: 10px
padding: 10px 14px
fontSize: 14px
color: #1A202C
fontFamily: 'DM Sans', sans-serif
transition: border-color 0.15s, box-shadow 0.15s
```
Focus: `borderColor: #38B2AC`, `outline: none`, `boxShadow: 0 0 0 3px rgba(56, 178, 172, 0.1)`

**Shared textarea style:**
Same as text input, plus:
```
resize: none
minHeight: varies by field (specified below)
overflow: hidden     ← auto-grow by adjusting height on input
lineHeight: 1.6
```

Auto-grow implementation: on every `onInput` event, set `element.style.height = 'auto'` then `element.style.height = element.scrollHeight + 'px'`.

**Word count display:**
Below textareas that have a minimum word count:
```
fontSize: 11px
fontWeight: 500
marginTop: 4px
textAlign: right
```
- Below minimum: `color: #A0AEC0` — text: `"{n} / {min} words"`
- At or above minimum: `color: {levelAccentDark}` — text: `"{n} / {min} words ✓"`

Word count calculation: split on whitespace, filter out empty strings, count. (`text.trim().split(/\s+/).filter(Boolean).length`)

---

### 5.5 Level-Specific Form Configurations

#### Level 1: Two Cards

**Card B: "How You Applied It"**

- **Header:** "How You Applied It" — with `Lightbulb` icon (16px, `{levelAccentDark}`) inline
- **Guiding prompt** (muted block above textarea):
  > *Describe a specific situation where you used AI prompting in your daily work. What did you ask? What did you get back? How did it change your approach?*
  - `fontSize: 13px`, `color: #A0AEC0`, `fontStyle: italic`, `lineHeight: 1.5`, `marginBottom: 12px`, `padding: 12px 16px`, `background: #F7FAFC`, `borderRadius: 8px`
- **Field:** `reflection_text` — textarea, `minHeight: 140px`, minimum 150 words
- **Screenshots (optional):** Upload zone — label: "Screenshots (optional)" — helper text: "If you have screenshots of your prompts or outputs, add them here." — Min: 0, Max: 5

**Card C: "What Impact It Had"**

- **Header:** "What Impact It Had" — with `Target` icon
- **Adoption field:** label: "Who benefited from this?" — pill-select (single choice):
  - "Just me" (`just-me`) | "My team" (`immediate-team`) | "Wider department" (`wider-department`) | "Organisation-wide" (`organisation-wide`)
  - Pill style: `borderRadius: 24px`, `padding: 6px 16px`, `fontSize: 13px`, `border: 1px solid #E2E8F0`, `cursor: pointer`
  - Selected: `background: {levelAccent}22`, `border: 1px solid {levelAccent}`, `color: {levelAccentDark}`, `fontWeight: 600`
- **Outcome field:** `outcome_text` — textarea, `minHeight: 80px`, minimum 80 words
  - Label: "What changed as a result?"
  - Helper: "Give a specific example of how AI improved your work output."

---

#### Level 2: Three Cards

**Card A: "What You Built"**

- **Header:** "What You Built" — with `Wrench` icon (16px, `{levelAccentDark}`)
- **Tool name field:** `tool_name` — single-line text input
  - Label: "What did you name your agent or tool?"
  - Placeholder: `"e.g., Meeting Notes Summariser, Client Brief Drafter"`
- **Platform field:** `platform_used` — dropdown select
  - Label: "Which platform did you use?"
  - Options: Custom GPT (ChatGPT) | Claude Project | Copilot Agent | Other
  - If "Other" selected: show a text input below — placeholder: "Specify the platform"
  - Dropdown style: same border/radius as text inputs, native `<select>` is acceptable, or a custom dropdown if the codebase already has one
- **Link field:** `tool_link` — single-line URL input
  - Label: "Share link (optional)"
  - Helper: "Paste the share link to your custom GPT or agent, if available."
  - Validate as URL format on blur (starts with `http://` or `https://`). If invalid, show `"Please enter a valid URL"` in `#E53E3E`, `fontSize: 11px` below the field
- **Screenshots field:** `screenshot_paths` — upload zone
  - Label: "Upload screenshots showing your agent in action"
  - Helper: "Show the configuration, a sample input, and a sample output."
  - **Required: at least 1 image. Maximum: 5.**
  - Accepts: PNG, JPG, WEBP — max 5MB per file
  - Upload zone: dashed border, `2px dashed #E2E8F0`, `borderRadius: 12px`, `padding: 16px 20px`, `textAlign: center`, `cursor: pointer`, `background: #F7FAFC`
  - Drag-over state: `borderColor: {levelAccent}`, `background: {levelAccent}08`
  - Upload icon: `Upload` from Lucide (20px, `#A0AEC0`)
  - Text: "Drop screenshots here or click to upload" — `fontSize: 13px`, `color: #718096`
  - Uploaded thumbnails: `80px × 80px`, `borderRadius: 8px`, `objectFit: cover`, `border: 1px solid #E2E8F0`
  - Delete button on thumbnail: 18px circle, `background: #1A202C`, white X icon (10px), `position: absolute`, top-right
  - Support clipboard paste (`Ctrl+V` / `Cmd+V`) — listen for `paste` events on the form container

**Card B: "How You Applied It"**

- **Header:** "How You Applied It" — with `Lightbulb` icon
- **Guiding prompt:**
  > *Describe how you designed this agent for your specific role. What instructions did you give it? How does it handle your typical inputs? What did you learn about prompt or instruction design through building it?*
- **Field:** `reflection_text` — textarea, `minHeight: 120px`, minimum 150 words

**Card C: "What Impact It Had"**

Same structure as L1 Card C. Adoption pills + outcome textarea (min 80 words).

---

#### Level 3: Three Cards

Same three-card structure as L2, with these modifications:

**Card A becomes "What You Designed":**
- Header: "What You Designed" — with `GitBranch` icon (from Lucide)
- Tool name label: "What did you name your workflow?"
- Platform dropdown options: Make | Zapier | n8n | Power Automate | Other
- Link label: "Link to your workflow (optional)"
- Screenshots label: "Upload screenshots of your workflow canvas"
- Screenshots helper: "Show the full workflow with connected nodes, any configuration panels, and a sample output."
- **Required: at least 1 screenshot. Maximum: 5.**

**Card B:** Same as L2 but guiding prompt adjusted:
> *Describe the end-to-end workflow you designed. What triggers it? What does each step do? Where are the human-in-the-loop checkpoints? What did you learn about workflow design through building it?*

**Card C:** Same as L2.

---

#### Level 4: Three Cards

Same three-card structure as L2, with these modifications:

**Card A becomes "What You Designed":**
- Header: "What You Designed" — with `LayoutDashboard` icon (from Lucide)
- Tool name label: "What did you name your dashboard or front-end?"
- Platform dropdown options: React | Streamlit | Retool | Bubble | Other
- Link label: "Share the URL of your dashboard" — **this field is required for L4** (not optional). Validate on submit — if empty, show error: `"A link to your dashboard is required for Level 4 submissions."`
- Screenshots: **Required: at least 2. Maximum: 5.**
- Screenshots helper: "Show the dashboard layout, key visualisations, and any interactive elements."

**Card B guiding prompt:**
> *Describe your design rationale. Who is the intended audience? What decisions did you make about layout, data presentation, and interaction? How does the dashboard answer their key questions?*
- Minimum words: 200 (increased from 150)

**Card C:** Same as L2 but outcome minimum increased to 100 words.

---

#### Level 5: Four Cards

L5 adds a fourth card for the structured case study.

**Cards A, B, C:** Same as L4, with these modifications:
- Card A: Link field required. Screenshots required: at least 2, max 5.
- Card A platform options: React + Vercel | Next.js | Streamlit | Bubble | Other
- Card B minimum words: 200
- Card C outcome minimum: 100 words

**Card D: "Case Study" (L5 only)**

- **Header:** "Case Study" — with `FileText` icon (16px, `{levelAccentDark}`)
- **Intro text:** "Document your project as a structured case study. This is your portfolio piece — the work you'd present to a stakeholder or include in a capability review." — `fontSize: 13px`, `color: #718096`, `lineHeight: 1.5`, `marginBottom: 16px`

**Four sub-sections within the card**, each with its own label and textarea:

| Section | Label | Field | Min Words | Guiding Text |
|---|---|---|---|---|
| Problem | "The Problem" | `case_study_problem` | 100 | "What problem were you solving? Who was affected? What was the cost of not solving it?" |
| Solution | "Your Solution" | `case_study_solution` | 100 | "What did you build? How does it work? What technologies and approaches did you use?" |
| Outcome | "The Outcome" | `case_study_outcome` | 100 | "What changed after deployment? Include specific metrics, user feedback, or efficiency gains where possible." |
| Learnings | "What You Learned" | `case_study_learnings` | 100 | "What would you do differently? What surprised you? What skills from the programme were most valuable?" |

Each guiding text displays above the textarea in the same muted block style as the Card B guiding prompts. Textareas: `minHeight: 100px` each.

---

### 5.6 Zone 3: Submission Controls

Below the last section card.

**Container:**
```
display: flex
alignItems: center
justifyContent: space-between
padding: 16px 0
marginTop: 4px
```

**Left side — auto-save indicator:**
- When auto-save fires: show "Draft saved ✓" — `fontSize: 12px`, `color: #A0AEC0`, with a `Check` icon (12px, `#A0AEC0`). Fades in, holds for 2 seconds, fades out.
- Default (nothing happening): empty

**Right side — action buttons:**

**Draft state (status = 'draft' or no submission exists):**

"Submit for Review" button:
```
background: #38B2AC
color: #FFFFFF
border: none
borderRadius: 24px
padding: 12px 28px
fontSize: 14px
fontWeight: 700
cursor: pointer (when enabled)
transition: background 0.15s
```
- Hover: `background: #2D9E99`
- **Disabled state** (not all required fields met): `background: #E2E8F0`, `color: #A0AEC0`, `cursor: not-allowed`
- Tooltip on hover when disabled: "Complete all required fields to submit"

**Validation per level** (all must pass for button to enable):

| Level | Required |
|---|---|
| L1 | `reflection_text` ≥ 150 words, `adoption_scope` selected, `outcome_text` ≥ 80 words |
| L2 | `tool_name` non-empty, `platform_used` selected, at least 1 screenshot, `reflection_text` ≥ 150 words, `adoption_scope` selected, `outcome_text` ≥ 80 words |
| L3 | Same as L2 |
| L4 | Same as L2 + `tool_link` non-empty and valid URL + at least 2 screenshots + `reflection_text` ≥ 200 words + `outcome_text` ≥ 100 words |
| L5 | Same as L4 + all four case study fields ≥ 100 words each |

**On clicking "Submit for Review":**

Show an inline confirmation below the button (not a modal):

```
background: #F7FAFC
borderRadius: 10px
border: 1px solid #E2E8F0
padding: 14px 18px
marginTop: 10px
```

- Text: "Once submitted, your project will be reviewed. You'll receive feedback shortly, and you can edit and resubmit if needed." — `fontSize: 13px`, `color: #4A5568`, `lineHeight: 1.5`
- Two buttons: "Confirm & Submit" (primary teal) | "Cancel" (text link, `#718096`)

**On "Confirm & Submit":**
1. Upload any new screenshots to Supabase Storage (see Section 6)
2. Update the `project_submissions` row: set `status = 'submitted'`, `submitted_at = now()`
3. **Auto-complete (this PRD only):** Immediately set `status = 'passed'`, `completed_at = now()`. Also set `project_completed = true` and `project_completed_at = now()` on `level_progress`. PRD 18 will remove this auto-complete step and replace it with an AI review call.
4. Transition the page to the post-submission read-only view

**Post-submission state (status = 'passed'):**

The form transitions to **read-only**:
- All text fields become styled text (not inputs) — same font sizing, but no border, no background, just the text
- Screenshots display as a gallery of thumbnails (click to enlarge in a lightbox)
- The link field becomes a clickable hyperlink
- Adoption scope shows as a static pill
- The "Submit for Review" button area is replaced with:

**Completion card:**
```
background: {levelAccent}12
border: 1px solid {levelAccent}
borderRadius: 12px
padding: 16px 20px
textAlign: center
```
- `Check` icon (20px, `{levelAccentDark}`) — inline with text
- Text: "Project complete — this has been recorded on your learning journey." — `fontSize: 14px`, `fontWeight: 600`, `color: {levelAccentDark}`
- Submitted date below: "Submitted on {date}" — `fontSize: 12px`, `color: #718096`, `marginTop: 4px`

---

## 6. Auto-Save & Image Upload

### Auto-save behaviour

Every form field auto-saves to the `project_submissions` row **3 seconds after the user stops typing** (debounced). This means:

1. On first edit: if no `project_submissions` row exists for this user + level, insert one with `status = 'draft'`
2. On subsequent edits: update the existing row
3. Save all text fields in a single update call (not one per field)
4. Do NOT auto-save screenshots — screenshots are uploaded only on form submit or on an explicit "Upload" action. Store the local file references in component state and upload to Supabase Storage on submission.

**Auto-save indicator:** After each successful save, briefly show "Draft saved ✓" on the left side of the controls bar. Fade in → hold 2s → fade out.

**Auto-save on navigation:** If the user navigates away (clicks sidebar, clicks "Back to My Journey"), trigger an immediate save of current state before unmounting. Use a `beforeunload` event listener for browser tab closes.

### Image upload flow

Screenshots are stored locally in component state as `{ file: File; preview: string }[]` where `preview` is a `URL.createObjectURL()` reference.

**On form submission** (not before):
1. For each file in the local screenshots array that hasn't been uploaded yet (check against `screenshot_paths` already in the database row):
   - Upload to Supabase Storage: `project-screenshots/{userId}/{level}/{timestamp}_{filename}`
   - Collect the returned storage paths
2. Update `project_submissions.screenshot_paths` with the full array of storage paths
3. Then proceed with the status update (`submitted` → `passed`)

**On re-opening a draft:**
If the submission row already has `screenshot_paths`, fetch signed URLs from Supabase Storage and display them as thumbnails. These are "already uploaded" images and should be visually identical to newly-added local files.

**Deleting a screenshot (draft mode):**
- If the image is local (not yet uploaded): just remove from component state
- If the image is already in Supabase Storage: remove from `screenshot_paths` array in the database row AND delete the file from storage

---

## 7. My Progress Dashboard Integration

In `src/components/dashboard/sections/MyProgress.tsx`, add a project status indicator to each level row.

### Current state
Each level row currently shows three status columns: Tool Used, Output Saved, Workshop Attended.

### Addition
Add a fourth column: **Project**.

**Column header:** "Project" — same styling as existing column headers

**Status indicator per level:**

| Project Status | Display |
|---|---|
| No submission exists | Grey dash `—` (same as current "N/A" treatment) |
| Draft saved | Amber dot + "Draft" text — `fontSize: 11px`, `color: #92400E` |
| Submitted | Teal dot + "Submitted" — `fontSize: 11px`, `color: #1A6B5F` |
| Passed | Green checkmark (same as existing "complete" indicator) |
| Needs Revision | Amber dot + "Revision" — `fontSize: 11px`, `color: #9A3412` |

**Each status is also a clickable link** — navigates to `/app/journey/project/{level}`.

### Stats update

The existing stats at the top of My Progress calculate `activitiesCompleted` based on three activities per level. Update this to **four activities per level**:

```
totalActivities = 20  (was 12 — now 4 per level × 5 levels)
```

Update `activitiesCompleted` to include `project_completed` from `level_progress`.

Update the progress percentage calculation accordingly.

---

## 8. Supabase Data Requirements

### New database functions

Add to `src/lib/database.ts`:

```typescript
// ─── PROJECT SUBMISSIONS ───

export interface ProjectSubmission {
  id: string;
  userId: string;
  level: number;
  status: 'draft' | 'submitted' | 'passed' | 'needs_revision';
  toolName: string | null;
  platformUsed: string | null;
  toolLink: string | null;
  screenshotPaths: string[];
  reflectionText: string | null;
  adoptionScope: string | null;
  outcomeText: string | null;
  caseStudyProblem: string | null;
  caseStudySolution: string | null;
  caseStudyOutcome: string | null;
  caseStudyLearnings: string | null;
  reviewDimensions: any | null;    // PRD 18
  reviewSummary: string | null;     // PRD 18
  reviewEncouragement: string | null; // PRD 18
  reviewPassed: boolean | null;     // PRD 18
  reviewedAt: number | null;        // PRD 18
  submittedAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

**Functions to implement:**

1. `getProjectSubmission(userId: string, level: number): Promise<ProjectSubmission | null>` — fetch a single submission by user + level
2. `getAllProjectSubmissions(userId: string): Promise<ProjectSubmission[]>` — fetch all submissions for a user (used on My Journey and My Progress)
3. `upsertProjectDraft(userId: string, level: number, data: Partial<ProjectSubmission>): Promise<boolean>` — create or update a draft submission (auto-save)
4. `submitProject(userId: string, level: number): Promise<boolean>` — set status to 'submitted', then 'passed', and update `level_progress.project_completed`
5. `uploadProjectScreenshot(userId: string, level: number, file: File): Promise<string | null>` — upload to Supabase Storage, return the path
6. `deleteProjectScreenshot(path: string): Promise<boolean>` — delete from Supabase Storage
7. `getScreenshotUrl(path: string): Promise<string | null>` — get a signed URL for a screenshot

### Data flow for My Journey

Extend `src/hooks/useJourneyData.ts` to also fetch:

```sql
select level, status, submitted_at, completed_at
from project_submissions
where user_id = {userId}
```

AND

```sql
select level, tool_used, workshop_attended, project_completed
from level_progress
where user_id = {userId}
```

Combine these with the existing topic progress query. The hook should return enough data to determine the four-activity state for each level and the project status badge.

### Data flow for Project Proof page

Create a new hook: `src/hooks/useProjectData.ts`

```typescript
interface UseProjectDataReturn {
  submission: ProjectSubmission | null;
  projectBrief: {
    projectTitle: string;
    projectDescription: string;
    deliverable: string;
    challengeConnection: string;
  } | null;
  loading: boolean;
  saving: boolean;
  saveDraft: (data: Partial<ProjectSubmission>) => Promise<void>;
  submitForReview: () => Promise<boolean>;
  uploadScreenshot: (file: File) => Promise<string | null>;
  deleteScreenshot: (path: string) => Promise<boolean>;
}
```

This hook fetches the submission data AND the project brief from `learning_plans.levels_data` for the given level. It provides all CRUD operations the form needs.

---

## 9. AppContext Extension

Add project submission counts to `AppContext` so other components can react to project state changes:

```typescript
interface AppContextValue {
  userProfile: { ... } | null;
  hasLearningPlan: boolean;
  learningPlanLoading: boolean;
  refreshLearningPlan: () => Promise<void>;
  // NEW in PRD 17:
  projectSubmissions: {
    [level: number]: {
      status: 'draft' | 'submitted' | 'passed' | 'needs_revision';
      completedAt: number | null;
    };
  };
  refreshProjectSubmissions: () => Promise<void>;
  loading: boolean;
}
```

Fetch all project submissions on mount (alongside the learning plan check). Expose a `refreshProjectSubmissions()` method for the project proof page to call after submitting.

---

## 10. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       └── journey/
│           ├── ProjectBriefCard.tsx        ← Zone 1: read-only brief
│           ├── ProjectBriefSection.tsx     ← Project section on level cards
│           ├── ActivityTracker.tsx         ← Four-dot progress indicator
│           └── project/
│               ├── SubmissionFormL1.tsx    ← L1 form (2 cards)
│               ├── SubmissionFormL2.tsx    ← L2 form (3 cards)
│               ├── SubmissionFormL3.tsx    ← L3 form (3 cards)
│               ├── SubmissionFormL4.tsx    ← L4 form (3 cards)
│               ├── SubmissionFormL5.tsx    ← L5 form (4 cards)
│               ├── ScreenshotUploader.tsx ← Shared drag-and-drop upload zone
│               ├── WordCountField.tsx     ← Textarea with word count indicator
│               ├── AdoptionPills.tsx       ← Pill selector for adoption scope
│               └── SubmissionControls.tsx  ← Save/submit bar
├── pages/
│   └── app/
│       └── AppProjectProof.tsx            ← The proof page
└── hooks/
    └── useProjectData.ts                  ← Supabase queries + CRUD for project
```

Existing files to modify:
- `src/App.tsx` — add `/app/journey/project/:level` route
- `src/context/AppContext.tsx` — add `projectSubmissions` and `refreshProjectSubmissions`
- `src/pages/app/AppJourney.tsx` — pass project data to level cards
- `src/components/app/LevelCard.tsx` — add project brief section and four-activity tracker
- `src/hooks/useJourneyData.ts` — extend to fetch project submissions and level_progress
- `src/components/dashboard/sections/MyProgress.tsx` — add project column
- `src/lib/database.ts` — add project submission functions
- `src/components/app/AppSidebar.tsx` — update active-state matching to include `/app/journey/*`

---

## 11. Interactions & Animations

### Page load (Project Proof)
Same stagger as other app pages:
- Back link: delay 0ms
- Brief card: delay 60ms
- Form cards: delay 120ms, 180ms, 240ms (one per card)
- Controls bar: delay 300ms

### Form interactions
- **Card select (platform, adoption):** Selected state transitions in 0.15s
- **Text input focus:** Border colour and shadow transition in 0.15s
- **Screenshot upload:** Drag-over state transitions border and background in 0.2s
- **Thumbnail appear:** New thumbnails fade in: `opacity: 0 → 1`, duration 0.2s
- **Word count colour change:** Transitions colour in 0.15s when minimum is reached
- **Auto-save indicator:** Fades in over 0.2s, holds 2s, fades out over 0.3s

### Submission transition
On successful submit:
1. "Submit for Review" button shows a brief spinner (0.5s)
2. Button transforms into the completion card with a fade: `opacity: 0 → 1`, `transform: translateY(4px) → translateY(0)`, duration 0.3s
3. Form fields simultaneously transition to read-only: borders fade out, backgrounds become transparent, over 0.3s

### My Journey level card project section
Project status badge transitions colour on state change (0.15s). CTA button hover effects match existing card CTA patterns.

---

## 12. Responsive Behaviour

Desktop-first (matching all prior PRDs). Minimum accommodations:

- **Project Proof page:** `max-width: 720px` already constrains width. On narrow viewports (<640px): form cards stack naturally (already single-column). Screenshot thumbnails wrap to new rows.
- **My Journey project brief section:** On narrow viewports, the left (info) and right (status/CTA) sides should stack vertically instead of sitting side-by-side.
- **My Progress project column:** On narrow viewports, the four-column status grid may need horizontal scroll. Apply `overflow-x: auto` to the progress table container.

---

## 13. Developer Notes

- **The two-tier progression model is a display concern, not an access concern.** `profiles.current_level` still controls what content the user can access. `project_completed` only affects how My Journey renders the level card. Do not add project completion checks to any routing or content gating logic.

- **The `unique (user_id, level)` constraint on `project_submissions`** means one submission per user per level. The `upsertProjectDraft` function should use `upsert` with `onConflict: 'user_id, level'`. This simplifies the data model — no need to track multiple submissions per level.

- **Screenshot paths are stored as a text array**, not JSONB. This keeps the storage simple and avoids nested parsing. Paths are Supabase Storage paths, not full URLs. Generate signed URLs on read using `supabase.storage.from('project-screenshots').createSignedUrl(path, 3600)` (1-hour expiry).

- **Auto-save debouncing:** Use a 3-second debounce timer that resets on every keystroke. Use `useRef` for the timer to avoid stale closures. The debounced save should batch all changed fields into a single `upsertProjectDraft` call.

- **Form state on mount:** If a draft exists in the database, pre-populate all fields. If screenshots exist in the database, fetch signed URLs and display them. The form should feel seamless whether the user is starting fresh or returning to a draft.

- **The submission form components (`SubmissionFormL1` through `SubmissionFormL5`) share a lot of structure.** Consider extracting shared building blocks (`WordCountField`, `ScreenshotUploader`, `AdoptionPills`) and composing them differently per level, rather than duplicating the full form for each level.

- **PRD 18 integration point:** When PRD 18 replaces the auto-complete step with an AI review call, the change is localised to the `submitProject` function in `database.ts` and the post-submission rendering in `AppProjectProof.tsx`. The form itself, the auto-save, the image upload, and the journey integration all remain unchanged.

- **Do not modify the level completion logic in `AppCurrentLevel.tsx`.** The existing trigger (all topics complete → increment `current_level`) stays as-is. This PRD only adds a new dimension of tracking (project completion) that sits alongside the existing flow.

- **No `console.log` statements** in final output.

---

## 14. Acceptance Criteria

Before marking this PRD complete, verify:

**Schema:**
- [ ] `project_submissions` table exists with all columns specified
- [ ] `level_progress` has `project_completed` and `project_completed_at` columns
- [ ] `project-screenshots` storage bucket exists with correct policies
- [ ] RLS policies on `project_submissions` work correctly (user can only access own data)

**Two-tier progression:**
- [ ] Completing all e-learning topics + tool + workshop still increments `current_level` (no regression)
- [ ] A level with all content done but no project shows as "Project Pending" on My Journey (not "Complete")
- [ ] A level with all content done AND project passed shows as "Complete" on My Journey
- [ ] The next level's content is accessible as soon as content activities are done (does not wait for project)

**My Journey level cards:**
- [ ] Every level card (completed, active, project pending, locked) shows the project brief section
- [ ] Project title and deliverable are pulled correctly from `learning_plans.levels_data`
- [ ] Status badge shows correct state (Not Started / Draft Saved / Submitted / Passed / Needs Revision)
- [ ] CTA button text and behaviour matches the status
- [ ] Locked level cards show muted project section with "Complete Level {n-1} to unlock" text
- [ ] Four-activity tracker shows on active and project-pending cards with correct fill states
- [ ] "Project Pending" card state renders correctly with amber status badge

**Project Proof page:**
- [ ] Page renders at `/app/journey/project/:level` inside AppLayout
- [ ] "My Journey" is active in the sidebar
- [ ] "← Back to My Journey" link navigates correctly
- [ ] Project brief card displays correct data from learning plan
- [ ] Invalid level param (not 1–5) redirects to `/app/journey`
- [ ] Level with no project brief shows appropriate empty state
- [ ] Locked level shows appropriate locked state

**Level-specific forms:**
- [ ] L1 renders 2 cards (How You Applied It + What Impact It Had)
- [ ] L2 renders 3 cards (What You Built + How You Applied It + What Impact It Had)
- [ ] L3 renders 3 cards with adjusted labels and platform options
- [ ] L4 renders 3 cards with required link field and 2+ screenshot minimum
- [ ] L5 renders 4 cards including Case Study with four sub-sections
- [ ] All word count minimums enforce correctly (button stays disabled until met)
- [ ] Word count indicator changes colour when minimum is reached

**Screenshots:**
- [ ] Drag-and-drop upload works
- [ ] Click-to-upload works
- [ ] Clipboard paste works (Ctrl+V / Cmd+V)
- [ ] File type validation (PNG, JPG, WEBP only)
- [ ] File size validation (max 5MB)
- [ ] Thumbnails display correctly with delete button
- [ ] Screenshots upload to Supabase Storage on submission
- [ ] Signed URLs load correctly for existing screenshots (draft reload)
- [ ] Deleting a screenshot removes it from both UI and Storage

**Auto-save:**
- [ ] Draft saves 3 seconds after last keystroke
- [ ] "Draft saved ✓" indicator appears briefly after each save
- [ ] Navigation away triggers immediate save
- [ ] Returning to a draft pre-populates all fields correctly

**Submission:**
- [ ] "Submit for Review" is disabled until all required fields meet minimums
- [ ] Confirmation inline card appears on click
- [ ] "Confirm & Submit" uploads screenshots then updates status
- [ ] Status transitions: draft → submitted → passed (auto-complete in this PRD)
- [ ] `level_progress.project_completed` is set to `true` on submission
- [ ] Page transitions to read-only view after submission
- [ ] Completion card renders with correct date and message

**My Progress integration:**
- [ ] Fourth column "Project" appears in the progress table
- [ ] Project status per level is correct (dash / Draft / Submitted / checkmark)
- [ ] Project status is a clickable link to the proof page
- [ ] Total activities updated to 20 (4 × 5 levels)
- [ ] Overall progress percentage recalculated correctly

**General:**
- [ ] `AppContext` includes `projectSubmissions` and `refreshProjectSubmissions`
- [ ] Zone 4 placeholder exists with `data-testid="review-scorecard-zone"`
- [ ] No TypeScript errors on build
- [ ] No console errors in browser on any page
- [ ] All existing PRD 01–05 and PRD 16 functionality continues to work (no regressions)
