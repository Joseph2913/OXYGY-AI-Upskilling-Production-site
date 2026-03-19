# PRD 06 — Learning Plan Gating & My Journey Onboarding
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01 (App Shell & Routing), PRD 02 (Dashboard), PRD 03 (My Journey), PRD 04 (Current Level), PRD 05 (My Toolkit) — all must be complete and passing acceptance criteria before starting this PRD  
**Followed by:** PRD 07 — Project Proof Page & Journey Integration, PRD 08 — AI Project Review System

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRDs 01–05 are complete and passing all acceptance criteria
2. Read `src/components/app/AppAuthGuard.tsx` — you are extending this with learning plan detection logic
3. Read `src/App.tsx` — you need to understand the current routing structure to add the redirect logic
4. Read `src/context/AppContext.tsx` — you will extend the context with `hasLearningPlan` state
5. Read `src/pages/app/AppJourney.tsx` — you are adding a conditional onboarding mode to this page
6. Read `src/components/LearningPathway.tsx` — the marketing site's Learning Plan Generator. You are adapting (not copying wholesale) its survey logic for the in-app version
7. Read `src/hooks/usePathwayApi.ts` — the API hook that generates learning plans. You will reuse this.
8. Read `src/lib/database.ts` — specifically `saveLearningPlan()` and `upsertProfile()` functions
9. Read `supabase/schema.sql` — specifically the `learning_plans` and `profiles` tables
10. Read `src/data/levelTopics.ts` — specifically `LEVEL_META` for level names and accent colours

**Important context about upcoming PRDs:**

This PRD is the first of three that together deliver a **project-based learning and assessment system**. Understanding what comes next will help you make better architectural decisions now:

- **PRD 17 (Project Proof Page & Journey Integration)** adds a new `project_submissions` table, a dedicated `/app/journey/project/{level}` page where learners submit proof of real-world projects, and extends the My Journey level cards with project brief sections and status indicators. It also introduces a **two-tier progression model**: completing e-learning + toolkit + workshop unlocks the next level's content, but the level is only marked "complete" when the project is also done.

- **PRD 18 (AI Project Review System)** adds an AI-powered review agent that evaluates project submissions against the learning plan brief using text analysis and vision (screenshot analysis), returning a structured scorecard with four dimensions (Brief Alignment, Evidence Quality, Reflection Depth, Impact).

**What this means for your work in PRD 06:**

- The `AppContext` you extend here should be designed so PRD 07 can easily add `projectSubmissions` data alongside `hasLearningPlan`
- The onboarding survey on My Journey should write to the same `learning_plans` and `profiles` tables the marketing site version uses — PRD 07 will read from `learning_plans.levels_data` to populate project briefs on each level card
- The contextual blocker component you build here will be reused in PRD 07 for levels that are locked due to org scoping (a future enhancement)
- The redirect logic you build here (`hasLearningPlan === false → redirect to /app/journey`) establishes the pattern for PRD 07's progression gating

---

## 1. Overview

### Purpose
This PRD introduces the platform's **onboarding gate**: every new user must complete a Learning Plan Generator survey before accessing any learning content. This ensures every learner has a personalised pathway from their first interaction, and gives the platform the profile data it needs to tailor the entire experience.

### What this PRD delivers
1. **First-login redirect** — New users (no learning plan record) bypass the Dashboard and land directly on My Journey, which renders in onboarding mode
2. **My Journey onboarding mode (State A)** — A focused, in-app survey that collects profile data and generates a personalised learning plan. Replaces the marketing site's Learning Plan Generator for authenticated users
3. **Contextual blockers** — Every content page (Dashboard, Current Level, Toolkit, E-Learning) shows a soft-gate card when no learning plan exists, directing the user back to My Journey
4. **AppContext extension** — `hasLearningPlan` boolean available to all app components, enabling conditional rendering across the platform
5. **Transition from onboarding to journey** — Once the plan generates, My Journey reveals the full journey view (State B) with a satisfying animated transition

### What this PRD does NOT deliver
- Project brief sections on level cards (PRD 07)
- Project submission pages (PRD 07)
- AI review of submissions (PRD 08)
- Organisation-level scoping / level restrictions (future PRD)
- Changes to the marketing site's Learning Plan Generator (it continues to work independently for unauthenticated visitors)

### Key design principle
**The learning plan is the gateway.** No authenticated user should ever see empty dashboards, blank progress pages, or confusing zero-states. The platform should feel purposeful from the very first second — and the survey is how we achieve that.

---

## 2. Redirect Logic

### The rule
```
If authenticated user has NO record in `learning_plans` table → redirect to /app/journey
```

This rule applies to **every `/app/*` route**, not just the Dashboard. If a user bookmarks `/app/toolkit` and logs in without a learning plan, they still land on `/app/journey`.

### Implementation

**Extend `AppContext` to include learning plan state.**

In `src/context/AppContext.tsx`, add a new field to the context value:

```typescript
interface AppContextValue {
  userProfile: {
    fullName: string;
    currentLevel: number;
    streakDays: number;
  } | null;
  hasLearningPlan: boolean;  // ← NEW
  learningPlanLoading: boolean;  // ← NEW — true until the check completes
  loading: boolean;
}
```

On mount (inside the existing `useEffect` that fetches user profile), add a parallel query:

```sql
select id from learning_plans
where user_id = {userId}
limit 1
```

If a row exists, `hasLearningPlan = true`. If no row, `hasLearningPlan = false`. This query runs once on mount and again after a plan is successfully generated (see Section 5).

**Important:** `learningPlanLoading` must be a separate loading flag from the general `loading` state. The general `loading` covers the profile fetch; `learningPlanLoading` covers the learning plan check specifically. Both must resolve before any redirect decision is made. This prevents a flash where the user sees a page for a split second before being redirected.

### Redirect component

Create a new component: `src/components/app/LearningPlanGate.tsx`

```typescript
interface LearningPlanGateProps {
  children: React.ReactNode;
}
```

Logic:
```
if (learningPlanLoading) → render nothing (the AppSuspense fallback handles the loading spinner)
if (!hasLearningPlan && currentRoute !== '/app/journey') → redirect to /app/journey
if (hasLearningPlan || currentRoute === '/app/journey') → render children
```

Wrap this component around the `<Outlet />` inside `AppLayout`, **inside** the existing `AppAuthGuard`. The nesting order is:

```
<AppAuthGuard>          ← checks: is user logged in?
  <AppLayout>
    <LearningPlanGate>  ← checks: does user have a learning plan?
      <Outlet />         ← renders the matched route
    </LearningPlanGate>
  </AppLayout>
</AppAuthGuard>
```

**The redirect uses `<Navigate to="/app/journey" replace />`** — the `replace` flag ensures the redirected route is not added to browser history. The user cannot press "back" to land on a gated page.

### Edge case: `/app/journey` itself

The redirect explicitly exempts `/app/journey` — this is the one route that must render regardless of learning plan state. If the user has no plan, Journey renders in onboarding mode (State A). If the user has a plan, Journey renders normally (State B). The `LearningPlanGate` never redirects away from Journey.

### Edge case: deep-linked toolkit tool pages

Routes like `/app/toolkit/prompt-playground` are also gated. If a user shares a direct link to a tool page and the recipient has no learning plan, they land on Journey. The original URL is **not preserved** — after completing the survey, the user stays on Journey (State B), not redirected to the tool. This is intentional: after generating a plan, the natural next step is to explore the journey, not jump into a specific tool.

---

## 3. My Journey — State A: Onboarding Mode

### When it renders
State A renders when `hasLearningPlan === false`. As soon as `hasLearningPlan` becomes `true` (after successful plan generation), State A unmounts and State B mounts with a transition animation.

### Overall page layout

The page uses the same `AppLayout` shell — sidebar visible, top bar visible. This is deliberate: the user should see the navigation structure of the platform even during onboarding. It grounds them in the product and shows them what's coming.

**Content area:**
```
background: #F7FAFC
padding: 28px 36px
max-width: 900px   ← same as State B (My Journey's normal max-width)
```

### Structure (top to bottom)

```
<PageHeader />                    ← Modified title + subtitle for onboarding
<ProfileShortcuts />              ← Compact persona quick-fill cards
<SurveyForm />                    ← The survey questions (all visible, scrollable)
<GenerateButton />                ← Full-width primary CTA
<ProcessingIndicator />           ← Shows during API call (replaces button)
<CompactLevelPreview />           ← Muted mini-preview of the five levels
```

---

### 3.1 Page Header (Onboarding Mode)

**Title:**
- Text: "My Journey"
- Font-size: 28px, font-weight: 800, color: `#1A202C`, letter-spacing: -0.4px
- Margin-bottom: 6px

**Subtitle:**
- Text: "Tell us about your role and goals, and we'll generate a personalised AI learning pathway for you."
- Font-size: 14px, color: `#718096`, line-height: 1.6
- Margin-bottom: 28px

This is the same header component used in State B but with a different subtitle. Do not create a separate component — use a conditional subtitle based on `hasLearningPlan`.

---

### 3.2 Profile Shortcuts (Persona Quick-Fill)

A horizontal row of compact persona cards that pre-fill the survey. This saves time for users who roughly match a persona.

**Container:**
```
margin-bottom: 28px
```

**Section label:**
- Text: "Start from a profile"
- Font-size: 13px, font-weight: 600, color: `#1A202C`
- Margin-bottom: 4px

**Helper text:**
- Text: "Click a profile to pre-fill the form, then adjust any answers to match your situation."
- Font-size: 12px, color: `#A0AEC0`
- Margin-bottom: 14px

**Card grid:**
- `display: grid`
- `grid-template-columns: repeat(5, 1fr)`
- `gap: 12px`
- Below 768px viewport: `grid-template-columns: repeat(2, 1fr)` with a 5th card spanning full width, or `repeat(3, 1fr)` on first row and `repeat(2, 1fr)` on second row — whichever renders better. Test and pick.

**Each persona card:**
```
background: #FFFFFF
border: 1px solid #E2E8F0
border-radius: 12px
padding: 14px
cursor: pointer
transition: border-color 0.15s
```

- Hover: `border-color: #38B2AC`
- Selected: `background: #F0FFFC`, `border: 2px solid #38B2AC`

**Card contents:**
- Emoji: font-size 28px, margin-bottom: 6px
- Name: font-size 13px, font-weight: 700, color: `#1A202C`
- Role: font-size 11px, color: `#718096`, margin-bottom: 8px
- Pills row: flex wrap, gap 4px — each pill: font-size 10px, background `#F7FAFC`, color `#4A5568`, padding 2px 8px, border-radius 4px

**The five personas are identical to those in `LearningPathway.tsx`:**

| ID | Name | Emoji | Role |
|---|---|---|---|
| new-starter | The New Starter | 🌱 | Marketing Coordinator |
| curious-pm | The Curious PM | 🔧 | Project Manager |
| ld-champion | The L&D Champion | 📚 | L&D Manager |
| ops-director | The Ops Director | ⚙️ | Operations Director |
| innovation-lead | The Innovation Lead | 🚀 | Director of Digital Transformation |

**On click:** Pre-fill all survey fields with the persona's data (same mapping as `handleProfileSelect` in `LearningPathway.tsx`). Scroll smoothly to the survey form.

---

### 3.3 Survey Form

The survey is rendered as a **vertical stack of question cards**, all visible at once. This is not a wizard — professionals prefer seeing the full scope upfront. Each question occupies a white card.

**Container:**
```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 28px 32px
margin-bottom: 20px
```

**Section heading inside the card:**
- Text: "Tell Us About You"
- Font-size: 18px, font-weight: 700, color: `#1A202C`
- Margin-bottom: 4px

**Section subheading:**
- Text: "Answer the required questions and we'll generate a learning pathway built around projects relevant to your actual work."
- Font-size: 13px, color: `#718096`, line-height: 1.5
- Margin-bottom: 24px

**Question layout:**
Each question is separated by `24px` vertical spacing and a `1px solid #F7FAFC` divider line (very subtle — just enough to create visual rhythm without heaviness).

---

#### Question 1: Role (Required)
- **Label:** "What is your current role?" — font-size: 14px, font-weight: 600, color: `#1A202C`
- **Required badge:** Small "Required" text — font-size: 10px, font-weight: 600, color: `#E53E3E`, margin-left: 8px, inline with label
- **Input:** Single-line text input
  - `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `border-radius: 10px`, `padding: 10px 14px`
  - `font-size: 14px`, `color: #1A202C`
  - `placeholder: "e.g., Project Manager, HR Business Partner, Senior Analyst"`
  - Focus: `border-color: #38B2AC`, `outline: none`, `box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1)`
- **Field name in state:** `role`

#### Question 2: Function (Required)
- **Label:** "Which function do you work in?"
- **Input type:** Selectable card grid — `display: grid`, `grid-template-columns: repeat(2, 1fr)`, `gap: 8px`
- **Options** (each as a selectable card):

| Value | Label |
|---|---|
| `Consulting / Advisory` | Consulting / Advisory |
| `Proposal & BD` | Proposal & BD |
| `Project Management` | Project Management |
| `L&D / Training` | L&D / Training |
| `Analytics & Insights` | Analytics & Insights |
| `Ops & SOP Management` | Ops & SOP Management |
| `Comms & Change` | Comms & Change |
| `IT & Knowledge Management` | IT & Knowledge Management |
| `Other` | Other |

- **Card style (unselected):** `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `border-radius: 10px`, `padding: 10px 14px`, `cursor: pointer`
- **Card style (selected):** `background: #F0FFFC`, `border: 2px solid #38B2AC`
- **Card text:** font-size 13px, font-weight: 600, color: `#1A202C`
- **If "Other" selected:** show a text input below the grid — `placeholder: "Your function"`
- **Field name:** `function` (and `functionOther` if Other)

#### Question 3: Seniority (Required)
- **Label:** "What's your seniority level?"
- **Input type:** Selectable card grid — `grid-template-columns: repeat(2, 1fr)`
- **Options:**

| Value | Label | Description |
|---|---|---|
| `Junior / early career (0–2 years)` | Junior / Early Career | 0–2 years experience |
| `Mid-level / specialist (3–6 years)` | Mid-Level / Specialist | 3–6 years experience |
| `Senior / lead (7–12 years)` | Senior / Lead | 7–12 years experience |
| `Director / executive (12+ years)` | Director / Executive | 12+ years experience |

- **Card contains:** Label (13px bold) + Description (11px muted) — stacked vertically
- **Field name:** `seniority`

#### Question 4: AI Experience (Required)
- **Label:** "How would you describe your AI experience?"
- **Input type:** Selectable card grid — `grid-template-columns: repeat(2, 1fr)`
- **Options:**

| Value | Label | Description |
|---|---|---|
| `beginner` | Beginner | I've barely used AI tools |
| `comfortable-user` | Comfortable User | I use AI tools regularly for basic tasks |
| `builder` | Builder | I've built custom GPTs, agents, or automations |
| `integrator` | Integrator | I've connected AI into workflows or systems |

- **Field name:** `aiExperience`

#### Question 5: Ambition (Required)
- **Label:** "What do you want to achieve with AI?"
- **Input type:** Selectable card grid — `grid-template-columns: repeat(1, 1fr)` (single column — these descriptions are longer)
- **Options:**

| Value | Label | Description |
|---|---|---|
| `confident-daily-use` | Confident Daily Use | Use AI confidently for everyday tasks |
| `build-reusable-tools` | Build Reusable Tools | Create AI tools my team can use |
| `own-ai-processes` | Own AI Processes | Design and manage AI-powered workflows |
| `build-full-apps` | Build Full Applications | Build complete AI-powered products |
| `lead-ai-strategy` | Lead AI Strategy | Lead AI transformation at an organisational level |

- **Field name:** `ambition`

#### Question 6: Challenge (Required) — THE MOST IMPORTANT QUESTION
- **Label:** "What's the biggest challenge you'd like AI to help you solve?"
- **Helper text:** "Be as specific as you can — this directly shapes the projects in your learning plan."
- **Helper text style:** font-size: 12px, color: `#718096`, margin-bottom: 8px
- **Input:** Textarea, auto-growing
  - `min-height: 100px`
  - Same border/focus styling as Question 1
  - `placeholder: "e.g., I spend hours every week summarising meeting notes and creating status updates. I want to automate this so I can focus on strategic work."`
- **Word count:** displayed below the textarea — `"{n} words"` — font-size: 11px, color: `#A0AEC0`
- **Field name:** `challenge`

#### Question 7: Availability (Required)
- **Label:** "How much time can you dedicate to learning each week?"
- **Input type:** Selectable card row — `display: flex`, `gap: 8px`
- **Options:**

| Value | Label |
|---|---|
| `1-2 hours` | 1–2 hours |
| `3-4 hours` | 3–4 hours |
| `5+ hours` | 5+ hours |

- **Cards are pill-shaped:** `border-radius: 24px`, `padding: 8px 18px` — smaller than the card-select used above
- **Field name:** `availability`

---

#### Optional Questions Section

Below Question 7, a collapsible section with a toggle:

**Toggle button (full-width divider-style):**
```
display: flex
align-items: center
gap: 12px
padding: 12px 0
cursor: pointer
```
- Left divider line: `flex: 1`, `height: 1px`, `background: #E2E8F0`
- Toggle text: "Additional questions that improve accuracy" — font-size: 12px, font-weight: 600, color: `#718096`
- ChevronDown icon (12px): rotates 180° when expanded
- Right divider line: same as left

**When expanded, show two additional questions:**

#### Question 8: Experience Description (Optional)
- **Label:** "Describe Your AI Experience"
- **Optional badge:** "Optional" — font-size: 10px, color: `#A0AEC0`, inline with label
- **Helper text:** "Tell us more about how you've used AI tools so far — this helps us calibrate the right starting point."
- **Input:** Textarea, auto-growing, min-height: 80px
- **Field name:** `experienceDescription`

#### Question 9: Goal Description (Optional)
- **Label:** "Describe Your Goal"
- **Optional badge:** same as Q8
- **Helper text:** "What does success look like for you at the end of this programme?"
- **Input:** Textarea, auto-growing, min-height: 80px
- **Field name:** `goalDescription`

**Default state:** collapsed. The optional section is hidden on first load.

---

### 3.4 Generate Button

Below the survey card, full-width:

**Button container:**
```
margin-top: 8px
margin-bottom: 28px
```

**Button:**
```
width: 100%
background: #38B2AC
color: #FFFFFF
border: none
border-radius: 12px
padding: 16px 24px
font-size: 16px
font-weight: 700
cursor: pointer
transition: background 0.15s
```

- Text: "Generate My Learning Plan →"
- Hover: `background: #2D9E99`
- Disabled state (form incomplete): `background: #E2E8F0`, `color: #A0AEC0`, `cursor: not-allowed`

**Form validation — button is disabled until ALL required fields are filled:**
- `role` is non-empty
- `function` is selected (and `functionOther` is non-empty if function is "Other")
- `seniority` is selected
- `aiExperience` is selected
- `ambition` is selected
- `challenge` is non-empty
- `availability` is selected

The same `isFormComplete` memo pattern used in `LearningPathway.tsx` applies here.

---

### 3.5 Processing Indicator

When the user clicks "Generate My Learning Plan →", the button is replaced by a processing indicator. This sits in the same position as the button.

**Use the same loading step pattern as `LearningPathway.tsx`:**

A card with animated step labels that progress as the API call runs:

```
background: #FFFFFF
border-radius: 14px
border: 1px solid #E2E8F0
padding: 24px
text-align: center
```

**Header:** "Generating your learning plan..." — font-size: 16px, font-weight: 700, color: `#1A202C`

**Subtext:** "This usually takes 15–20 seconds" — font-size: 13px, color: `#A0AEC0`, margin-top: 4px

**Step labels** (cycle through these at 3-second intervals):
1. "Analysing your profile..."
2. "Mapping your experience to the framework..."
3. "Designing your projects..."
4. "Calibrating difficulty levels..."
5. "Finalising your pathway..."

Each step shows with a small teal spinner (16px) to the left. Previous steps show a teal checkmark. Same visual pattern as the marketing site version.

### 3.6 API Call & Data Persistence

On clicking "Generate My Learning Plan →":

1. **Classify levels** — call the same `classifyLevels(aiExperience, ambition)` function used in `LearningPathway.tsx`. This determines which levels are "full", "fast-track", "awareness", or "skip" for this user.

2. **Call the pathway API** — use the existing `usePathwayApi` hook's `generatePathway(formData, depths)` function. This calls the `/api/generate-pathway` endpoint.

3. **On success:**
   - Call `saveLearningPlan(userId, result, depths)` — writes to `learning_plans` table
   - Call `upsertProfile(userId, profileData)` — writes to `profiles` table (role, function, seniority, etc.)
   - Update `AppContext` — set `hasLearningPlan = true`
   - Trigger the State A → State B transition (see Section 5)

4. **On error:**
   - Show an inline error message below the processing indicator
   - Text: "Something went wrong generating your plan. Please try again." — font-size: 13px, color: `#E53E3E`
   - Show a "Try Again" button (secondary style) that re-enables the form and restores the Generate button

**Do not save a draft to localStorage for the in-app version.** The marketing site version saves drafts because users might need to log in mid-flow. In-app users are already authenticated — the form is short enough to fill in one sitting. If they navigate away, the form resets. This is acceptable.

---

### 3.7 Compact Level Preview

Below the Generate button (and below the processing indicator during generation), show a muted preview of the five levels. This gives context for what the survey generates — "here are the five levels your plan will cover."

**Container:**
```
padding: 20px 24px
background: #FFFFFF
border-radius: 14px
border: 1px solid #E2E8F0
```

**Label:**
- Text: "YOUR LEARNING PATHWAY" — font-size: 10px, font-weight: 700, color: `#A0AEC0`, text-transform: uppercase, letter-spacing: 0.08em
- Margin-bottom: 14px

**Five level rows** — each is a compact horizontal row:
```
display: flex
align-items: center
gap: 12px
padding: 8px 0
border-bottom: 1px solid #F7FAFC    ← except last row
```

Each row contains:
- **Level badge:** 28px circle, `background: {levelAccent}33`, `border: 1px solid {levelAccent}66`
  - Number inside: font-size: 11px, font-weight: 800, color: `{levelAccentDark}`
- **Level name:** font-size: 13px, font-weight: 600, color: `#A0AEC0` (muted — not full navy)
- **Tagline:** font-size: 12px, color: `#CBD5E0` (very muted), truncated to one line with `text-overflow: ellipsis`

Use `LEVEL_META` from `levelTopics.ts` for level names, accent colours, and taglines.

**This entire section has `opacity: 0.7`** — subtly muted to indicate "this is a preview, not active content."

---

## 4. Contextual Blockers

When `hasLearningPlan === false` and the user somehow reaches a content page (by typing a URL, using browser back, or exploiting a race condition), every content page shows a **contextual blocker** instead of its normal content.

### Shared component

Create: `src/components/app/LearningPlanBlocker.tsx`

```typescript
interface LearningPlanBlockerProps {
  pageName: string;  // e.g., "Dashboard", "My Toolkit", "Current Level"
}
```

**Visual specification:**

The blocker renders as a centered card within the normal page content area:

```
display: flex
flex-direction: column
align-items: center
justify-content: center
min-height: calc(100vh - 54px - 80px)   ← fills the viewport minus top bar and padding
text-align: center
padding: 40px
```

**Card:**
```
background: #FFFFFF
border-radius: 16px
border: 1px solid #E2E8F0
padding: 40px 48px
max-width: 480px
```

**Contents (stacked vertically, centered):**

1. **Icon:** Lucide `Map` icon, 40px, color: `#38B2AC`, margin-bottom: 16px

2. **Heading:** "Complete Your Learning Plan" — font-size: 20px, font-weight: 800, color: `#1A202C`, margin-bottom: 8px

3. **Body text:** "The {pageName} will be available once you've completed the Learning Plan Generator. It takes about 2 minutes and creates a personalised pathway tailored to your role and goals." — font-size: 14px, color: `#718096`, line-height: 1.6, margin-bottom: 24px, max-width: 380px

4. **CTA button:** "Go to My Journey →"
   - `background: #38B2AC`, `color: #FFFFFF`, `border-radius: 24px`, `padding: 12px 28px`
   - `font-size: 14px`, `font-weight: 600`
   - `cursor: pointer`
   - Hover: `background: #2D9E99`
   - On click: `navigate('/app/journey')`

### Where to add the blocker

Each of these page components needs a check at the top of their render:

```typescript
const { hasLearningPlan, learningPlanLoading } = useAppContext();

if (learningPlanLoading) return null; // AppSuspense handles loading
if (!hasLearningPlan) return <LearningPlanBlocker pageName="Dashboard" />;
```

Add this check to:
- `src/pages/app/AppDashboard.tsx` — pageName: "Dashboard"
- `src/pages/app/AppCurrentLevel.tsx` — pageName: "Current Level"
- `src/pages/app/AppToolkit.tsx` — pageName: "My Toolkit"
- `src/pages/app/AppArtefacts.tsx` — pageName: "My Artefacts"
- Every `/app/toolkit/*` tool page (Prompt Playground, Agent Builder, etc.) — pageName: "this tool"

**Do NOT add the blocker to:**
- `src/pages/app/AppJourney.tsx` — Journey handles both states internally
- `src/pages/app/AppCohort.tsx` — Cohort is a social feature that doesn't depend on a learning plan

### Blocker vs redirect: when each fires

In practice, users will almost never see the blocker. The `LearningPlanGate` in `AppLayout` redirects them to Journey before any page component mounts. The blocker exists as a **safety net** for edge cases:

- React Router race conditions where the redirect hasn't fired yet
- Direct URL entry faster than the context can load
- Future scenarios where we want to show the blocker on specific pages without a full redirect (e.g., org-scoped level restrictions in a future PRD)

---

## 5. State A → State B Transition

When the API call succeeds and `hasLearningPlan` flips to `true`, the page transitions from the onboarding survey to the full journey view. This is a key emotional moment — the user should feel like their personalised path is being revealed.

### Transition sequence

1. **Survey fade-out** (300ms): The entire State A content (header, profile shortcuts, survey, button, level preview) fades out — `opacity: 1 → 0`, `transform: translateY(0) → translateY(-8px)`. Easing: `ease-in`.

2. **Brief pause** (200ms): Content area is empty (just the `#F7FAFC` background visible).

3. **Journey fade-in** (400ms): State B content (header with updated subtitle, overall progress bar, level cards) fades in with the existing stagger animation from PRD 03:
   - Header: delay 0ms
   - Level card 1: delay 60ms
   - Level card 2: delay 120ms
   - Level card 3: delay 180ms
   - Level card 4: delay 240ms
   - Level card 5: delay 300ms
   
   Each element: `opacity: 0 → 1`, `transform: translateY(12px) → translateY(0)`, duration 300ms, ease.

4. **Scroll to top**: Before State B renders, scroll the content area to `scrollTop = 0` so the user sees the header first.

### Implementation approach

Use a local state variable in `AppJourney.tsx`:
```typescript
const [showOnboarding, setShowOnboarding] = useState(!hasLearningPlan);
const [transitioning, setTransitioning] = useState(false);
```

When the plan is generated:
1. Set `transitioning = true` → triggers fade-out CSS class on State A
2. After 500ms (fade-out + pause), set `showOnboarding = false` → unmounts State A, mounts State B
3. State B's mount triggers its own entry animations (the stagger from PRD 03)
4. Set `transitioning = false`

---

## 6. My Journey — State B Updates (Minimal for This PRD)

State B is the existing My Journey page from PRD 03. This PRD makes **two small changes** to State B:

### 6.1 Updated subtitle

When `hasLearningPlan === true`, the page subtitle changes from the onboarding message to the standard journey subtitle:

- Text: "Your path through the five levels of AI capability."
- (This is the same subtitle already specified in PRD 03)

### 6.2 Regeneration link

Add a link below the overall progress bar that allows the user to regenerate their learning plan:

**Container:** `margin-top: 8px`, below the progress bar block

**Link:**
- Text: "Regenerate your learning plan →"
- Font-size: 12px, font-weight: 500, color: `#38B2AC`, text-decoration: none
- Hover: text-decoration underline
- On click: set `showOnboarding = true` — this re-renders State A with the survey pre-filled with the user's existing profile data

**Pre-filling on regeneration:**

When the user clicks "Regenerate", State A renders with all fields pre-populated from the `profiles` table (role, function, seniority, aiExperience, ambition, challenge, availability, experienceDescription, goalDescription). The user can modify any answers and re-generate. On generation, the old `learning_plans` record stays (for history) and a new one is inserted. The platform always uses the **most recent** `learning_plans` record (ordered by `generated_at DESC`).

### 6.3 Future-proofing note for PRD 07

PRD 07 will add substantial content to each level card: a project brief section, status badges, and a CTA that links to the project proof page. PRD 07 will also add a four-activity tracker (E-Learning, Toolkit, Workshop, Project) to each card. This PRD (06) does NOT make those changes — but the developer should be aware they are coming and should not introduce patterns that would make those additions difficult (e.g., do not hardcode the level card's internal structure in a way that's hard to extend).

---

## 7. Supabase Data Requirements

### Query: Check for existing learning plan (on mount)
```sql
select id from learning_plans
where user_id = {userId}
order by generated_at desc
limit 1
```

If a row exists → `hasLearningPlan = true`. If no row → `hasLearningPlan = false`.

This query runs in `AppContext` alongside the existing profile fetch. Use `Promise.all` with the profile query for parallel execution.

### Query: Load existing profile data (for regeneration pre-fill)
```sql
select role, function, function_other, seniority, ai_experience,
       ambition, challenge, availability, experience_description, goal_description
from profiles
where id = {userId}
```

This is only needed when the user clicks "Regenerate" — it pre-fills the survey. Fetch it on demand, not on page mount.

### Write: Save learning plan (on generation)

Use the existing `saveLearningPlan()` function from `src/lib/database.ts`. Do not duplicate this logic.

### Write: Update profile (on generation)

Use the existing `upsertProfile()` function from `src/lib/database.ts`. Do not duplicate this logic.

### Post-generation: Refresh AppContext

After both writes succeed, trigger a re-fetch of the learning plan check in `AppContext`. The simplest approach: expose a `refreshLearningPlan()` method from the context that re-runs the learning plan query and updates `hasLearningPlan`. Call this from the survey component after successful generation.

```typescript
// Add to AppContextValue
refreshLearningPlan: () => Promise<void>;
```

---

## 8. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       ├── LearningPlanGate.tsx         ← redirect logic (wraps Outlet in AppLayout)
│       ├── LearningPlanBlocker.tsx       ← contextual blocker card
│       └── journey/
│           ├── OnboardingSurvey.tsx      ← State A survey form (all questions)
│           ├── ProfileShortcuts.tsx      ← Persona quick-fill cards
│           ├── CompactLevelPreview.tsx   ← Muted five-level preview
│           └── SurveyProcessing.tsx      ← Processing indicator with step labels
```

Existing files to modify:
- `src/context/AppContext.tsx` — add `hasLearningPlan`, `learningPlanLoading`, `refreshLearningPlan`
- `src/components/app/AppLayout.tsx` — wrap `<Outlet />` in `<LearningPlanGate>`
- `src/pages/app/AppJourney.tsx` — add conditional rendering: State A (onboarding) vs State B (journey), transition logic, regeneration flow
- `src/pages/app/AppDashboard.tsx` — add `LearningPlanBlocker` check
- `src/pages/app/AppCurrentLevel.tsx` — add `LearningPlanBlocker` check
- `src/pages/app/AppToolkit.tsx` — add `LearningPlanBlocker` check
- `src/pages/app/AppArtefacts.tsx` — add `LearningPlanBlocker` check
- All `/app/toolkit/*` tool page components — add `LearningPlanBlocker` check

---

## 9. Interactions & Animations

### Page load (State A)
Same stagger pattern as other app pages:
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
- Page header: delay 0ms
- Profile shortcuts: delay 60ms
- Survey card: delay 120ms
- Generate button: delay 180ms
- Level preview: delay 240ms

All: duration 0.3s, ease, `animation-fill-mode: both`

### Survey interactions
- **Card select (function, seniority, experience, ambition):** Selected card transitions border and background in 0.15s
- **Text inputs:** Focus ring transitions in 0.15s
- **Optional section expand:** `max-height: 0 → max-height: 400px`, duration 0.2s, ease. ChevronDown rotates 180°.
- **Generate button enable/disable:** Background and color transition in 0.15s

### State A → State B transition
As specified in Section 5: fade-out (300ms) → pause (200ms) → stagger fade-in (300ms per element, 60ms stagger).

### Contextual blocker
Fades in on mount: `opacity: 0 → 1`, `transform: translateY(8px) → translateY(0)`, duration 0.3s, ease.

---

## 10. Visual Design Tokens

All tokens from PRD 01 Section 11 apply. No new colours or fonts introduced. Specific references:

| Element | Value |
|---|---|
| Survey card background | `#FFFFFF` |
| Survey card border | `1px solid #E2E8F0` |
| Survey card border-radius | `16px` |
| Selected card background | `#F0FFFC` |
| Selected card border | `2px solid #38B2AC` |
| Required badge colour | `#E53E3E` |
| Input focus border | `#38B2AC` |
| Input focus shadow | `0 0 0 3px rgba(56, 178, 172, 0.1)` |
| Generate button background | `#38B2AC` |
| Generate button hover | `#2D9E99` |
| Disabled button background | `#E2E8F0` |
| Disabled button text | `#A0AEC0` |
| Error text | `#E53E3E` |
| Level preview accent colours | Use `LEVEL_META` from `levelTopics.ts` |
| Blocker icon colour | `#38B2AC` |

---

## 11. Responsive Behaviour

This PRD focuses on the desktop experience (matching PRDs 01–05). Mobile responsive behaviour is deferred to a future PRD. However, these minimum accommodations should be made:

- **Profile shortcuts grid:** Collapse from 5 columns to 2-3 columns below 768px
- **Survey card selectors:** Collapse from 2-column grid to single column below 640px
- **Generate button:** Already full-width, no change needed
- **Contextual blocker:** Card max-width is 480px — already works on narrow viewports

---

## 12. Developer Notes

- **`LearningPlanGate` wraps `<Outlet />`, not individual routes.** This means it checks once per navigation, not once per page component. This is more efficient and ensures consistent behaviour.

- **The `hasLearningPlan` check in `AppContext` must not block the initial render of `AppLayout`.** The sidebar and top bar should render immediately. Only the content area (inside `LearningPlanGate`) waits for the check to complete.

- **Do not import components from `LearningPathway.tsx` directly.** That component is designed for the marketing site and includes marketing-specific logic (localStorage drafts, auth modals, scroll handling for the marketing page layout). Instead, extract the survey question data (options, labels) into a shared data file if not already shared, and build fresh components for the in-app version.

- **However, DO reuse the API layer.** `usePathwayApi`, `classifyLevels`, `saveLearningPlan`, and `upsertProfile` should be imported and used as-is. Do not duplicate these.

- **The form state for the in-app survey should use the same `PathwayFormData` interface** defined in the existing codebase. This ensures compatibility with the API and database functions.

- **When adding `LearningPlanBlocker` checks to existing page components,** add the check as the FIRST conditional return in the component — before any hooks that depend on learning plan data. This prevents errors from missing data.

- **The `refreshLearningPlan()` method on AppContext** should be called AFTER both `saveLearningPlan()` and `upsertProfile()` succeed. If either fails, do not update `hasLearningPlan` — show the error state instead.

- **No `console.log` statements** in final output.

- **Auth guard note:** The current `AppAuthGuard.tsx` is in DEV MODE (bypasses auth). When auth is re-enabled, `LearningPlanGate` should sit inside `AppAuthGuard` — the auth check happens first, then the learning plan check. The nesting must be: AuthGuard → AppLayout → LearningPlanGate → Outlet.

---

## 13. Acceptance Criteria

Before marking this PRD complete, verify:

**Redirect logic:**
- [ ] A new user with no `learning_plans` record navigating to `/app/dashboard` is redirected to `/app/journey`
- [ ] The redirect works for ALL `/app/*` routes, not just dashboard
- [ ] The redirect uses `replace` — pressing browser "back" does not return to the gated page
- [ ] `/app/journey` renders without redirect regardless of learning plan state
- [ ] No flash of page content before redirect (loading state is handled properly)

**Onboarding survey (State A):**
- [ ] My Journey shows the survey when `hasLearningPlan === false`
- [ ] All 7 required questions render correctly with proper input types
- [ ] Optional questions section is collapsed by default and expands on click
- [ ] "Generate My Learning Plan" button is disabled until all required fields are filled
- [ ] Clicking a persona card pre-fills all form fields and scrolls to the survey
- [ ] Persona card shows selected state (teal border, light background)
- [ ] Form validation matches the existing `LearningPathway.tsx` validation logic

**Plan generation:**
- [ ] Clicking "Generate" shows the processing indicator with cycling step labels
- [ ] The API call uses the existing `usePathwayApi` hook
- [ ] On success, `learning_plans` record is created in Supabase
- [ ] On success, `profiles` record is updated in Supabase
- [ ] On success, `hasLearningPlan` updates to `true` in AppContext
- [ ] On error, an error message displays with a "Try Again" button
- [ ] The "Try Again" button restores the form (not blank — keeps user's answers)

**State transition:**
- [ ] On successful generation, State A fades out (300ms)
- [ ] After fade-out, State B fades in with stagger animation
- [ ] Content area scrolls to top before State B renders
- [ ] State B shows the full journey view with level cards populated from the new learning plan data

**Contextual blockers:**
- [ ] Dashboard shows `LearningPlanBlocker` when `hasLearningPlan === false`
- [ ] Current Level shows `LearningPlanBlocker` when `hasLearningPlan === false`
- [ ] My Toolkit shows `LearningPlanBlocker` when `hasLearningPlan === false`
- [ ] My Artefacts shows `LearningPlanBlocker` when `hasLearningPlan === false`
- [ ] All toolkit tool pages show `LearningPlanBlocker` when `hasLearningPlan === false`
- [ ] Blocker card displays correctly with heading, body text, and CTA button
- [ ] CTA button navigates to `/app/journey`
- [ ] Blocker uses correct `pageName` for each page

**Regeneration:**
- [ ] "Regenerate your learning plan →" link appears below the progress bar on State B
- [ ] Clicking it shows State A with all fields pre-filled from existing profile data
- [ ] Regenerating creates a new `learning_plans` record (does not delete the old one)
- [ ] After regeneration, State B updates with the new plan data

**General:**
- [ ] Compact level preview renders correctly with all five levels and accent colours
- [ ] No TypeScript errors on build
- [ ] No console errors in browser on any page
- [ ] All existing PRD 01–05 functionality continues to work (no regressions)
- [ ] Sidebar and top bar render during onboarding (State A) — the shell is always visible
