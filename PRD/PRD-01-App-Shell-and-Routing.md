# PRD 01 — App Shell & Routing
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** Existing repo (`oxygy-ai-upskillingpage` on Vercel/GitHub)  
**Followed by:** PRD 02 — Dashboard Page

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code, do the following:

1. Read the existing `src/App.tsx` (or `main.tsx`) to understand the current router setup
2. Read the existing Supabase auth middleware / `ProtectedRoute` component (wherever it lives)
3. Read the existing top-level layout component (the marketing site header/nav)
4. List all current top-level routes so you know exactly what exists

Do not modify any existing marketing site routes, components, or pages. This PRD adds new structure alongside what exists — it does not replace anything.

---

## 1. Overview

### Purpose
Create a clean architectural split inside the existing codebase that separates the **marketing site** (public, existing) from the **learning platform** (authenticated, new). All learning platform pages will live under the `/app` route prefix and share a new persistent app shell (sidebar + top bar). The existing marketing site is completely untouched.

### What this PRD delivers
- A new `/app/*` route namespace inside the existing React Router setup
- A new `AppLayout` component — the persistent shell wrapping all `/app` pages (sidebar + top bar + content area)
- Auth guard: unauthenticated users hitting `/app/*` are redirected to the existing login flow
- Placeholder pages for every section in the learning platform nav (to be replaced by subsequent PRDs)
- A "Go to your dashboard →" link added to the existing marketing site nav for logged-in users

### What this PRD does NOT deliver
- Any real page content (that's PRDs 02–05)
- Changes to the marketing site layout, pages, or components
- Changes to the existing auth flow or Supabase configuration
- Mobile responsive behaviour for the app shell (deferred to a later PRD)

---

## 2. Route Architecture

### Existing routes (DO NOT TOUCH)
All current routes remain exactly as they are. Examples:
- `/` — homepage / marketing
- `/methodology` — methodology page
- `/login` — existing login page
- `/learning-pathway` — existing pathway generator
- `/dashboard` — if this already exists as a marketing page, leave it; the new app dashboard lives at `/app/dashboard`

### New routes to add

| Path | Component | Description |
|---|---|---|
| `/app` | Redirect → `/app/dashboard` | Convenience redirect |
| `/app/dashboard` | `AppDashboard` (placeholder) | Learning dashboard (PRD 02) |
| `/app/journey` | `AppJourney` (placeholder) | Five-level journey map (PRD 03) |
| `/app/level` | `AppCurrentLevel` (placeholder) | Current level detail (PRD 04) |
| `/app/toolkit` | `AppToolkit` (placeholder) | My Toolkit page (PRD 05) |
| `/app/toolkit/prompt-playground` | Existing `PromptPlayground` component | Wrapped in app shell |
| `/app/toolkit/prompt-library` | Existing `PromptLibrary` component | Wrapped in app shell |
| `/app/toolkit/workflow-designer` | Existing `WorkflowDesigner` component | Wrapped in app shell |
| `/app/artefacts` | `AppArtefacts` (placeholder) | My Artefacts (future PRD) |
| `/app/cohort` | `AppCohort` (placeholder) | My Cohort (future PRD) |

**All `/app/*` routes must be wrapped in the auth guard.** If the user is not authenticated, redirect to the existing `/login` page with a `?redirect=/app/dashboard` query param so they land in the right place after login.

**Existing toolkit tools** (Prompt Playground, Prompt Library, Workflow Designer) — identify their current route paths and current components. Move those components to the new `/app/toolkit/*` paths. If they currently live at public routes (e.g. `/prompt-playground`), add redirects from the old paths to the new ones so existing links don't break.

---

## 3. AppLayout Component

This is the most important deliverable of this PRD. Every `/app/*` route renders inside `AppLayout`. It is never rendered on the marketing site.

### Structure
```
<AppLayout>
  ├── <AppSidebar />        — fixed left, 240px wide
  ├── <div class="app-main">
  │     ├── <AppTopBar />   — sticky top, 54px tall
  │     └── <div class="app-content">
  │           {children}    — page content renders here
  │         </div>
  │   </div>
</AppLayout>
```

### AppLayout file location
`src/components/app/AppLayout.tsx`

Create a new folder `src/components/app/` for all app shell components. Do not put these in the existing components folder root to avoid confusion with marketing site components.

---

## 4. AppSidebar Component

**File:** `src/components/app/AppSidebar.tsx`

### Visual specification

**Dimensions:** 240px wide, full viewport height, fixed position (does not scroll with content)

**Background:** `#1A202C` (dark navy)

**Right border:** `1px solid rgba(255, 255, 255, 0.06)`

**Font:** DM Sans (already imported via Google Fonts — confirm it's in the existing project; add if not)

### Sections (top to bottom)

---

#### Section 1 — Logo block
**Height:** ~70px  
**Padding:** 22px 20px 18px  
**Bottom border:** `1px solid rgba(255, 255, 255, 0.08)`

Contents:
- Flex row, gap 10px, align center
- **Logo mark:** 32×32px, border-radius 8px, background `#38B2AC` (teal), centered white bold "O", font-size 15px, font-weight 800
- **Wordmark column:**
  - Line 1: "OXYGY" — color `#FFFFFF`, font-weight 700, font-size 15px, letter-spacing -0.3px
  - Line 2: "AI Upskilling" — color `rgba(255,255,255,0.35)`, font-size 10px, font-weight 500, letter-spacing 0.08em, text-transform uppercase

---

#### Section 2 — User identity block
**Padding:** 14px 20px  
**Bottom border:** `1px solid rgba(255, 255, 255, 0.08)`

Data source: pull `user.user_metadata.full_name` (or `email` as fallback) and current level from Supabase `profiles` table (`current_level` column, integer 1–5).

Contents:
- Flex row, gap 10px, align center
- **Avatar circle:** 34×34px, border-radius 50%, background `#38B2AC`, centered initial letter, color `#1A202C`, font-weight 700, font-size 14px
- **Text column:**
  - Line 1: First name — color `#FFFFFF`, font-weight 600, font-size 14px
  - Line 2: Level badge pill — `background: rgba(247, 232, 164, 0.13)`, `border: 1px solid rgba(247, 232, 164, 0.27)`, border-radius 20px, padding 2px 8px, font-size 10px, font-weight 600, color `#F7E8A4`
  - Badge text format: `"Level {n} · {LevelShortName}"` — e.g. "Level 2 · Applied"
  - Level short names: 1 = Fundamentals, 2 = Applied, 3 = Systemic, 4 = Dashboards, 5 = Applications

---

#### Section 3 — Primary navigation
**Padding:** 10px 0  
**Flex:** 1 (fills available space)

Nav items in order:
1. Dashboard — icon: `Home`
2. My Journey — icon: `Map`
3. Current Level — icon: `BookOpen`
4. My Toolkit — icon: `Wrench`
5. My Artefacts — icon: `Folder`
6. My Cohort — icon: `Users`

Use Lucide React icons (already in the project — confirm; install if missing: `lucide-react`).

**Each nav item:**
- Flex row, gap 10px, align center
- Padding: 10px 20px
- Cursor: pointer
- Left border: `3px solid transparent` (default) → `3px solid #38B2AC` (active)
- Background: `transparent` (default) → `rgba(56, 178, 172, 0.10)` (active)
- Icon color: `rgba(255,255,255,0.40)` (default) → `#4FD1C5` (active)
- Label color: `rgba(255,255,255,0.50)` (default) → `#FFFFFF` (active)
- Label font-size: 14px, font-weight: 400 (default) → 600 (active)
- Hover background (non-active): `rgba(255, 255, 255, 0.06)`
- Transition: `background 0.15s, color 0.15s`

Active state is determined by matching the current route path (`/app/dashboard`, `/app/journey`, etc.). Use React Router's `useLocation()` hook to determine active item. The toolkit subroutes (`/app/toolkit/*`) should keep "My Toolkit" highlighted.

**Navigation behaviour:** clicking a nav item uses React Router `<Link>` or `useNavigate()` — no full page reloads.

---

#### Section 4 — Bottom utilities
**Padding:** 10px 0  
**Top border:** `1px solid rgba(255, 255, 255, 0.08)`

Items:
- Settings — icon: `Settings`, label "Settings"
- Same styling as nav items above, but default icon color `rgba(255,255,255,0.30)`, label color `rgba(255,255,255,0.30)`, no active state needed for now (Settings page is a future PRD)

---

## 5. AppTopBar Component

**File:** `src/components/app/AppTopBar.tsx`

**Dimensions:** full width of content area (viewport minus 240px sidebar), height 54px, sticky top 0, z-index 5

**Background:** `#FFFFFF`

**Bottom border:** `1px solid #E2E8F0`

**Padding:** 0 36px

**Layout:** flex row, space-between, align center

### Left side — Breadcrumb
Display the current page name only (no path hierarchy for now).  
Map route to label:
- `/app/dashboard` → "Dashboard"
- `/app/journey` → "My Journey"
- `/app/level` → "Current Level"
- `/app/toolkit` → "My Toolkit"
- `/app/toolkit/*` → "My Toolkit"
- `/app/artefacts` → "My Artefacts"
- `/app/cohort` → "My Cohort"

Font-size: 13px, color: `#718096`, font-weight: 400

### Right side — User strip
Flex row, gap 16px, align center:

1. **Streak indicator:**
   - Flame emoji 🔥, followed by streak count (pull from Supabase `profiles.streak_days` or default to 0), followed by "day streak"
   - Font-size 13px, color `#718096`; streak number is font-weight 700, color `#1A202C`
   - If streak is 0, show nothing (hide the element entirely)

2. **Divider:** 1px × 18px, background `#E2E8F0`

3. **Avatar:** 30×30px circle, background `#38B2AC`, initial letter, color `#1A202C`, font-weight 700, font-size 13px

---

## 6. Placeholder Pages

For each route in the new `/app/*` namespace (except the existing toolkit tool routes), create a minimal placeholder page component. These will be replaced by subsequent PRDs.

**File location:** `src/pages/app/{PageName}.tsx`

Each placeholder should render inside `AppLayout` and display:
- The page title (e.g. "Dashboard", "My Journey") in `#1A202C`, font-size 24px, font-weight 700
- A subtitle: "This page is coming soon." in `#718096`, font-size 14px
- Background: `#F7FAFC`, padding 36px

This confirms routing is working before real content is built.

**Files to create:**
- `src/pages/app/AppDashboard.tsx`
- `src/pages/app/AppJourney.tsx`
- `src/pages/app/AppCurrentLevel.tsx`
- `src/pages/app/AppToolkit.tsx`
- `src/pages/app/AppArtefacts.tsx`
- `src/pages/app/AppCohort.tsx`

---

## 7. Marketing Site Integration

### "Go to your dashboard" link in the existing marketing nav

In the existing marketing site header/nav component, add a conditional element:

- **If user is authenticated:** show a pill-style CTA link — label "My Dashboard →", route `/app/dashboard`
  - Style: border `1px solid #1A202C`, border-radius 24px, padding 8px 18px, font-size 13px, font-weight 600, color `#1A202C`, background transparent
  - Hover: background `#1A202C`, color `#FFFFFF`
  - Position: far right of nav, after all existing nav links
- **If user is not authenticated:** show nothing (existing nav is unchanged)

Use the existing Supabase auth session hook to determine authenticated state. Do not restructure the existing nav — this is an additive change only.

---

## 8. Auth Guard Implementation

Create an `AppAuthGuard` component (or extend the existing `ProtectedRoute` if one exists):

**File:** `src/components/app/AppAuthGuard.tsx`

Logic:
```
if (loading) → show full-screen loading spinner (teal, centered)
if (!user) → redirect to /login?redirect=/app/dashboard
if (user) → render children
```

Loading spinner: a simple teal `#38B2AC` circular spinner, centered both axes, on a white background. No text.

Wrap every `/app/*` route in this guard inside the router configuration.

---

## 9. Supabase Data Requirements

The app shell needs two pieces of live data per authenticated user. Both should be fetched once at the `AppLayout` level and passed down via context or props:

### 9a. User profile
**Table:** `profiles`  
**Columns needed:** `id`, `full_name`, `current_level` (int), `streak_days` (int)  
**If `current_level` is null:** default to 1  
**If `streak_days` is null:** default to 0

### 9b. Create missing columns if they don't exist
If the `profiles` table does not have `current_level` or `streak_days` columns, add them via a Supabase migration:
```sql
alter table profiles add column if not exists current_level integer default 1;
alter table profiles add column if not exists streak_days integer default 0;
```
Include this migration as a comment in the code with instructions to run it in the Supabase dashboard — do not auto-run migrations from the frontend.

### 9c. AppContext
Create `src/context/AppContext.tsx` that provides:
```typescript
interface AppContextValue {
  userProfile: {
    fullName: string;
    currentLevel: number;  // 1–5
    streakDays: number;
  } | null;
  loading: boolean;
}
```
Wrap `AppLayout` in this provider. All child pages can consume via `useAppContext()` hook.

---

## 10. File Structure Summary

New files to create (do not modify existing files outside of what's listed):

```
src/
├── components/
│   └── app/
│       ├── AppLayout.tsx          ← shell wrapper
│       ├── AppSidebar.tsx         ← left nav
│       ├── AppTopBar.tsx          ← sticky top bar
│       └── AppAuthGuard.tsx       ← auth redirect
├── pages/
│   └── app/
│       ├── AppDashboard.tsx       ← placeholder
│       ├── AppJourney.tsx         ← placeholder
│       ├── AppCurrentLevel.tsx    ← placeholder
│       ├── AppToolkit.tsx         ← placeholder
│       ├── AppArtefacts.tsx       ← placeholder
│       └── AppCohort.tsx          ← placeholder
└── context/
    └── AppContext.tsx             ← shared app state
```

Existing files to modify (minimally):
- `src/App.tsx` (or wherever the router lives) — add `/app/*` routes
- Existing marketing nav component — add conditional dashboard CTA link

---

## 11. Visual Design Tokens

Use these exact values. Do not introduce any new colours, shadows, or fonts not listed here.

```css
/* Backgrounds */
--app-sidebar-bg: #1A202C;
--app-content-bg: #F7FAFC;
--app-topbar-bg: #FFFFFF;
--app-card-bg: #FFFFFF;

/* Brand colours */
--teal: #38B2AC;
--teal-light: #4FD1C5;
--navy: #1A202C;
--yellow: #F7E8A4;

/* Text */
--text-primary: #1A202C;
--text-secondary: #4A5568;
--text-muted: #718096;
--text-sidebar-active: #FFFFFF;
--text-sidebar-inactive: rgba(255,255,255,0.50);

/* Borders */
--border-default: #E2E8F0;
--border-sidebar: rgba(255,255,255,0.08);

/* Font */
font-family: 'DM Sans', sans-serif;
/* Confirm Google Fonts import exists in index.html:
   https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap
   Add it if missing. */
```

**No drop shadows anywhere.** No purple gradients. No glassmorphism. Borders over shadows for all card/panel separation.

---

## 12. Acceptance Criteria

Before marking this PRD complete, verify:

- [ ] Navigating to `/app/dashboard` when logged out redirects to `/login`
- [ ] Navigating to `/app/dashboard` when logged in shows the app shell with sidebar + top bar + placeholder content
- [ ] All six nav items link to their correct `/app/*` routes without full page reload
- [ ] Active nav item is correctly highlighted based on current route
- [ ] `/app/toolkit/prompt-playground` (and other existing tools) render inside the app shell, not the marketing site layout
- [ ] Old public routes for existing tools redirect to the new `/app/toolkit/*` paths
- [ ] Marketing site homepage renders exactly as before with no visual changes
- [ ] Logged-in users see "My Dashboard →" link in the marketing site nav
- [ ] Top bar shows correct page name breadcrumb for each route
- [ ] Top bar shows streak count (or hides it if streak is 0)
- [ ] User's first name and level badge appear correctly in sidebar
- [ ] No TypeScript errors on build
- [ ] No console errors in browser on any `/app/*` route

---

## 13. Developer Notes

- **Do not use `<a href>` for internal navigation.** Use React Router `<Link>` or `useNavigate()` everywhere.
- **DM Sans must be the font across the entire app shell.** If the existing codebase uses a different font elsewhere, do not change it — but ensure all new `src/components/app/` and `src/pages/app/` components explicitly set `fontFamily: 'DM Sans', sans-serif` or inherit it from a wrapper.
- **The sidebar is fixed, not sticky.** Use `position: fixed` with `height: 100vh`. The content area must have `margin-left: 240px` to avoid being obscured.
- **Existing tool components** (Prompt Playground, Prompt Library, Workflow Designer) may have their own internal layout (headers, padding). When wrapping them in `AppLayout`, remove any top-level wrapper padding or margins they add that would conflict with the shell. Check each one individually.
- **Supabase queries in AppContext** should use `.single()` with proper error handling. If the profile row doesn't exist yet for a user (race condition on first login), fall back to defaults gracefully rather than crashing.
- **React Router version:** Check the existing `package.json` to confirm which version of `react-router-dom` is installed (v5 vs v6). The routing syntax differs significantly. Use whichever version is already installed — do not upgrade.

---

## Amendment — Navigation & Scroll Standards (added post-initial-build)

### Scroll-to-top on route change
A `ScrollToTop` component must be rendered inside the router in `App.tsx`. It listens to `pathname` changes via `useLocation` and calls `window.scrollTo({ top: 0, behavior: 'instant' })` on every route change. This ensures every page navigation starts at the top — no page should ever open mid-scroll.

Implementation: `components/app/ScrollToTop.tsx` — rendered as the first child inside the router wrapper in `App.tsx`.

### Settings panel
The Settings button at the bottom of `AppSidebar.tsx` opens a slide-in panel overlay (not a route). The panel contains: Account actions (Edit Profile, Sign Out), Notification preferences (toggles, currently placeholder), and About info. Do not route `/app/settings` — settings UI lives entirely in the sidebar panel.

### Rule: no dead navigation elements
Every clickable element in the app shell — sidebar items, buttons, CTAs, step indicators — must either navigate to a real route or trigger a real action. Dead `div` elements styled as buttons are not acceptable. If a feature is not yet built, either omit the element or render it as explicitly disabled with a "Coming soon" tooltip.
