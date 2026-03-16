# PRD: Phase 1 — Authentication, Onboarding & Artefacts Consolidation

> **Status:** Ready for implementation
> **Author:** Oxygy Design Agent
> **Date:** 2026-03-16
> **Codebase ref:** `https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site.git`

---

## 1. Overview

### Purpose

Replace the current mock authentication system with real Supabase Auth. Add a mandatory onboarding self-assessment wizard for new users. Consolidate the `saved_prompts` table into a unified `artefacts` table with expanded type filtering. Protect all `/app/*` routes behind authentication while keeping the marketing site public.

### What this phase delivers

1. **Real authentication** — Google and Microsoft OAuth via Supabase Auth
2. **Session persistence** — users remain signed in across visits
3. **Route protection** — unauthenticated visitors cannot access `/app/*`
4. **Login UI** — replace "My Dashboard →" navbar CTA with a sign-in button; full-page `/login` route
5. **Mandatory onboarding** — new users complete a self-assessment wizard before accessing the app
6. **Artefacts consolidation** — single `artefacts` table replaces `saved_prompts`, with expanded type taxonomy and filtering on the Artefacts page
7. **Multi-tenant readiness** — schema and auth architecture designed for future org-scoped access (not enforced in this phase)

### Scope boundaries

This phase does **not** include:
- Wiring `AppContext` / dashboard data to real Supabase queries (Phase 2)
- Organisation/multi-tenant enforcement (Phase 4)
- Leaderboard, cohort, or streak tracking from real data (Phase 4)

---

## 2. Architecture Decisions

### 2.1 Auth Providers

| Provider | Method | Supabase Config |
|----------|--------|-----------------|
| Google | `supabase.auth.signInWithOAuth({ provider: 'google' })` | Auth → Providers → Google → Client ID + Secret |
| Microsoft | `supabase.auth.signInWithOAuth({ provider: 'azure' })` | Auth → Providers → Azure → Tenant ID + Client ID + Secret |

No Magic Link or email/password. OAuth only.

### 2.2 Session Persistence

Supabase JS client already persists sessions to `localStorage` via `persistSession: true` (configured in `lib/supabase.ts`). The `autoRefreshToken: true` setting handles token renewal. No additional work needed — once a user signs in, they remain signed in until they explicitly sign out or the refresh token expires (default: 1 week, configurable in Supabase dashboard).

### 2.3 Artefact Type Taxonomy

The current `ArtefactType` union is:

```typescript
type ArtefactType = 'prompt' | 'agent' | 'workflow' | 'dashboard' | 'app_spec';
```

This maps to the five toolkit tools. Expand it to include the additional types Joseph specified:

```typescript
type ArtefactType =
  | 'prompt'         // Level 1: Prompt Playground output
  | 'agent'          // Level 2: Agent Builder system prompt
  | 'workflow'       // Level 3: Workflow Canvas design
  | 'dashboard'      // Level 4: Dashboard Designer PRD
  | 'app_spec'       // Level 5: App Evaluator specification
  | 'build_guide'    // Levels 2–5: Platform-specific build guide
  | 'prd';           // Levels 4–5: Product Requirements Document
```

### 2.4 Multi-Tenant Readiness

The existing schema already has `organisations`, `user_org_memberships`, and `workshop_sessions` tables. This phase does not enforce org scoping, but:

- All new tables include an optional `org_id uuid references organisations(id)` column
- All new RLS policies use `auth.uid() = user_id` (user-scoped)
- Future phase will add org-scoped policies using `user_org_memberships` as the join table
- The `profiles` table already has an implicit org link via `user_org_memberships`

No code changes needed for multi-tenant readiness — the schema is already designed for it. Just avoid hardcoding assumptions that a user belongs to zero or one org.

---

## 3. Database Schema Changes

### 3.1 New Table: `artefacts`

Move the SQL from the `useArtefactsData.ts` comment into `supabase/schema.sql` and extend it:

```sql
-- 10. ARTEFACTS (consolidated — replaces saved_prompts for new saves)
create table if not exists artefacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references organisations(id),          -- nullable; for future org scoping
  name text not null,
  type text not null check (type in (
    'prompt', 'agent', 'workflow', 'dashboard', 'app_spec', 'build_guide', 'prd'
  )),
  level integer not null check (level between 1 and 5),
  source_tool text check (source_tool in (
    'prompt-playground', 'agent-builder', 'workflow-canvas',
    'dashboard-designer', 'ai-app-evaluator'
  )),
  content jsonb not null default '{}',
  preview text,                                       -- short text preview for card display
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_opened_at timestamptz,
  archived_at timestamptz                             -- soft delete
);

alter table artefacts enable row level security;

create policy "Users can read own artefacts"
  on artefacts for select using (auth.uid() = user_id);
create policy "Users can insert own artefacts"
  on artefacts for insert with check (auth.uid() = user_id);
create policy "Users can update own artefacts"
  on artefacts for update using (auth.uid() = user_id);
create policy "Users can delete own artefacts"
  on artefacts for delete using (auth.uid() = user_id);

create index artefacts_user_level on artefacts(user_id, level);
create index artefacts_user_type on artefacts(user_id, type);
create index artefacts_user_active on artefacts(user_id) where archived_at is null;
```

### 3.2 Migrate `saved_prompts` Data

Write a one-time migration script (run in Supabase SQL editor):

```sql
-- Migrate existing saved_prompts into artefacts
insert into artefacts (user_id, name, type, level, source_tool, content, preview, created_at, updated_at)
select
  user_id,
  title as name,
  'prompt' as type,
  level,
  source_tool,
  jsonb_build_object('promptText', content) as content,
  left(content, 200) as preview,
  saved_at as created_at,
  saved_at as updated_at
from saved_prompts
on conflict do nothing;
```

After migration is verified, the `saved_prompts` table can be kept as-is (no need to drop it immediately) but all new writes go to `artefacts`.

### 3.3 Add `onboarding_completed` to `profiles`

The `ui_preferences` table already has `onboarding_completed`. However, this is a critical gating field — it determines whether the user sees the app or the onboarding wizard. For simplicity and to avoid a second table lookup on every page load, add it directly to `profiles`:

```sql
alter table profiles add column if not exists onboarding_completed boolean default false;
alter table profiles add column if not exists current_level integer default 1;
alter table profiles add column if not exists streak_days integer default 0;
```

Note: The `current_level` and `streak_days` columns are referenced in `AppContext.tsx` comments as a planned migration. Add them now.

---

## 4. File Changes — Complete List

| File | Action | Summary |
|------|--------|---------|
| `context/AuthContext.tsx` | **Rewrite** | Real Supabase auth with session listener |
| `components/AuthModal.tsx` | **Rewrite** | Full sign-in UI (Google + Microsoft) |
| `components/app/AppAuthGuard.tsx` | **Rewrite** | Real route protection with loading state |
| `App.tsx` | **Modify** | Re-wrap with AuthProvider, re-enable guard |
| `components/Navbar.tsx` | **Modify** | Replace "My Dashboard →" with auth-aware button |
| `components/app/AppTopBar.tsx` | **Modify** | Add sign-out option to avatar area |
| `components/app/AppLayout.tsx` | **Modify** | Wrap with AuthProvider if not already in tree |
| `context/AppContext.tsx` | **Modify** | Fetch real profile after auth; gate on onboarding |
| `pages/app/AppOnboarding.tsx` | **New** | Mandatory self-assessment wizard |
| `hooks/useArtefactsData.ts` | **Rewrite** | Replace mock data with Supabase queries |
| `lib/database.ts` | **Modify** | Add artefact CRUD functions; update savePrompt to write to artefacts |
| `components/app/artefacts/SearchFilterBar.tsx` | **Modify** | Add `build_guide` and `prd` to type filters |
| `supabase/schema.sql` | **Modify** | Add artefacts table, profile columns |
| `types.ts` | **Modify** | Update ArtefactType union |

---

## 5. AuthContext.tsx — Full Specification

### Replace entire file contents.

```typescript
// context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured — running in mock mode');
      setLoading(false);
      return;
    }

    // 1. Restore existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) ensureProfileExists(s.user);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await ensureProfileExists(newSession.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signInWithGoogle, signInWithMicrosoft, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

// ── Auth actions ──

async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/app/dashboard` },
  });
  if (error) console.error('Google sign-in error:', error);
}

async function signInWithMicrosoft(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/app/dashboard`,
      scopes: 'email profile openid',
    },
  });
  if (error) console.error('Microsoft sign-in error:', error);
}

async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign-out error:', error);
  window.location.href = '/';
}

// ── Profile auto-creation ──

async function ensureProfileExists(user: User): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Profile check error:', error);
    return;
  }

  if (!data) {
    // Create skeleton profile for new user
    const fullName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || '';
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName,
        onboarding_completed: false,
      });
    if (insertError) console.error('Profile creation error:', insertError);
  }
}
```

### Key behaviours

- `loading` is `true` until `getSession()` resolves — prevents flash of login screen for returning users
- `ensureProfileExists` creates a skeleton `profiles` row on first sign-in with `onboarding_completed: false`
- OAuth `redirectTo` sends the user back to `/app/dashboard` after the provider flow
- `signOut()` navigates to `/` (marketing site homepage)
- If Supabase is not configured (dev mode without env vars), sets `loading: false` immediately and remains in unauthenticated state

---

## 6. AuthModal.tsx — Full Specification

### Replace the no-op component.

This is a **full-page login view**, not a floating modal. It renders at the `/login` route.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  (full viewport, #F7FAFC background)                    │
│                                                         │
│           ┌─────────────────────────┐                   │
│           │  OXYGY wordmark (navy)  │                   │
│           │                         │                   │
│           │  "Sign in to your       │                   │
│           │   AI upskilling         │                   │
│           │   workspace"            │                   │
│           │                         │                   │
│           │  ┌─────────────────┐    │                   │
│           │  │ G  Continue     │    │                   │
│           │  │    with Google  │    │                   │
│           │  └─────────────────┘    │                   │
│           │                         │                   │
│           │  ┌─────────────────┐    │                   │
│           │  │ M  Continue     │    │                   │
│           │  │    with         │    │                   │
│           │  │    Microsoft    │    │                   │
│           │  └─────────────────┘    │                   │
│           │                         │                   │
│           │  "By signing in, you    │                   │
│           │   agree to our Terms"   │                   │
│           └─────────────────────────┘                   │
│                                                         │
│           ← Back to homepage                            │
└─────────────────────────────────────────────────────────┘
```

### Specifications

**Page container:**
- `minHeight: 100vh`, `background: #F7FAFC`
- `display: flex`, `alignItems: center`, `justifyContent: center`
- `padding: 24px`

**Card:**
- `maxWidth: 400px`, `width: 100%`
- `background: #FFFFFF`
- `border: 1px solid #E2E8F0`
- `borderRadius: 16`
- `padding: 40px 32px`
- `textAlign: center`

**OXYGY wordmark:**
- Text "OXYGY" in DM Sans, `fontSize: 24`, `fontWeight: 800`, `color: #1A202C`, `letterSpacing: -0.5`
- `marginBottom: 32`

**Heading:**
- "Sign in to your AI upskilling workspace"
- DM Sans, `fontSize: 22`, `fontWeight: 700`, `color: #1A202C`
- `marginBottom: 8`

**Subheading:**
- "Continue with your work account"
- `fontSize: 14`, `color: #718096`, `marginBottom: 32`

**OAuth buttons (stacked vertically, full width):**

Each button:
- `width: 100%`
- `padding: 12px 20px`
- `borderRadius: 10`
- `border: 1px solid #E2E8F0`
- `background: #FFFFFF`
- `fontSize: 14`, `fontWeight: 600`, `color: #2D3748`
- `display: flex`, `alignItems: center`, `justifyContent: center`, `gap: 10`
- Hover: `background: #F7FAFC`, `borderColor: #CBD5E0`
- `cursor: pointer`
- `marginBottom: 12` between buttons

Google button:
- Google "G" multicolour logo (inline SVG, 20px)
- Label: "Continue with Google"

Microsoft button:
- Microsoft four-square logo (inline SVG, 20px)
- Label: "Continue with Microsoft"

**Terms text:**
- `fontSize: 12`, `color: #A0AEC0`, `marginTop: 24`
- "By signing in, you agree to Oxygy's Terms of Service and Privacy Policy"

**Back link:**
- Below the card, `marginTop: 20`
- "← Back to homepage"
- `fontSize: 13`, `color: #718096`, hover `color: #38B2AC`
- `href: /`

### Loading state

When a button is clicked:
- The clicked button shows a small spinner (14px teal border-spin) replacing the icon
- The label changes to "Redirecting…"
- The other button is disabled (`opacity: 0.5`, `pointerEvents: none`)

### Error state

If the OAuth redirect fails or the user returns with an error:
- Show a red error banner above the buttons
- `background: #FFF5F5`, `border: 1px solid #FEB2B2`, `borderRadius: 8`, `padding: 12px 16px`
- `fontSize: 13`, `color: #C53030`
- Text: "Sign-in failed. Please try again."
- Auto-dismiss after 8 seconds

### Redirect handling

The `/login` route should accept a `?redirect=` query parameter. After successful sign-in, redirect to that path instead of the default `/app/dashboard`. This is used by `AppAuthGuard` when it intercepts an unauthenticated visit to a protected route.

Implementation:
```typescript
// In the /login page component:
const searchParams = new URLSearchParams(window.location.search);
const redirectPath = searchParams.get('redirect') || '/app/dashboard';

// Pass redirectPath to OAuth:
signInWithGoogle(); // redirectTo is already set in AuthContext
// After auth state changes to signed-in, navigate:
useEffect(() => {
  if (user && !loading) {
    navigate(redirectPath, { replace: true });
  }
}, [user, loading]);
```

---

## 7. AppAuthGuard.tsx — Full Specification

### Replace the bypass.

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AppAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#F7FAFC',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%',
          animation: 'app-spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
};
```

### Key behaviours

- Shows a teal spinner while `loading` is `true` (initial session check)
- Redirects unauthenticated users to `/login` with a `?redirect=` param preserving their intended destination
- Once `user` is set, renders children immediately

---

## 8. App.tsx — Changes

### 8.1 Re-enable AuthProvider

```tsx
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ... all existing routes ... */}
      </Routes>
    </AuthProvider>
  );
}
```

### 8.2 Re-enable AppAuthGuard

Change the `/app` route from:
```tsx
<Route path="/app" element={<AppLayout />}>
```
To:
```tsx
<Route path="/app" element={<AppAuthGuard><AppLayout /></AppAuthGuard>}>
```

### 8.3 Update `/login` route

Change from:
```tsx
<Route path="/login" element={<LoginRedirect />} />
```
To:
```tsx
<Route path="/login" element={<AppSuspense><LoginPage /></AppSuspense>} />
```

Where `LoginPage` is a new lazy-loaded component that renders the `AuthModal` (now a full-page view) and handles the redirect-after-auth logic.

### 8.4 Add onboarding route

```tsx
const AppOnboarding = React.lazy(() => import('./pages/app/AppOnboarding'));

// Inside the /app route children:
<Route path="onboarding" element={<AppSuspense><AppOnboarding /></AppSuspense>} />
```

---

## 9. Navbar.tsx — Changes

### Replace the "My Dashboard →" pill CTA and user icon (lines 546–586)

**When user is NOT signed in (on marketing site):**
- Show a "Sign In" pill button in the same position
- Style: `border: 1px solid #1A202C`, `borderRadius: 24`, `padding: 8px 18px`, `fontSize: 13`, `fontWeight: 600`, `color: #1A202C`, `background: transparent`
- Hover: `background: #1A202C`, `color: #FFFFFF`
- `href: /login`
- No user avatar icon

**When user IS signed in:**
- Show "My Dashboard →" pill (existing style, unchanged)
- Show user avatar circle (existing style, but use real initials from `user.user_metadata.full_name`)

### Implementation

Import `useAuth` and check `user`:
```tsx
import { useAuth } from '../context/AuthContext';

// Inside the component:
const { user } = useAuth();
const isSignedIn = !!user;
```

Conditionally render:
```tsx
{isSignedIn ? (
  <>
    {/* Existing "My Dashboard →" pill */}
    {/* Existing user avatar icon */}
  </>
) : (
  <a href="/login" className="hidden sm:flex items-center transition-all duration-200"
    style={{
      border: '1px solid #1A202C',
      borderRadius: 24,
      padding: '8px 18px',
      fontSize: 13,
      fontWeight: 600,
      color: '#1A202C',
      background: 'transparent',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.background = '#1A202C';
      (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.background = 'transparent';
      (e.currentTarget as HTMLElement).style.color = '#1A202C';
    }}
  >
    Sign In
  </a>
)}
```

### Mobile menu

In the mobile slide-out menu (lines 790–803), apply the same logic:
- Signed out: show "Sign In" linking to `/login`
- Signed in: show "My Dashboard" linking to `/app/dashboard`

---

## 10. AppTopBar.tsx — Sign Out

### Add a dropdown to the avatar area

When the user clicks their avatar circle in the top bar, show a small dropdown:

```
┌────────────────────────┐
│  Joseph Thomas          │
│  joseph@oxygy.ai        │
│  ──────────────────────  │
│  Sign out               │
└────────────────────────┘
```

**Dropdown specs:**
- `position: absolute`, `top: 48px`, `right: 0`
- `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 10`
- `padding: 12px 16px`, `minWidth: 200px`
- `boxShadow: 0 4px 12px rgba(0,0,0,0.08)`
- `zIndex: 20`

**User name:** DM Sans, `fontSize: 13`, `fontWeight: 700`, `color: #1A202C`
**User email:** `fontSize: 12`, `color: #718096`
**Divider:** `1px solid #E2E8F0`, `margin: 8px 0`
**Sign out button:** `fontSize: 13`, `color: #718096`, hover `color: #E53E3E`, `cursor: pointer`, full width text-align left, `padding: 4px 0`

Click outside closes the dropdown. Sign out calls `signOut()` from `useAuth()`.

---

## 11. Mandatory Onboarding Wizard — `pages/app/AppOnboarding.tsx`

### Purpose

New users (where `profiles.onboarding_completed = false`) are redirected here before they can access any other `/app/*` route. The wizard collects the same data as the Learning Pathway Generator form, saves it to the `profiles` table, then generates a personalised learning plan.

### Gating logic

In `AppContext.tsx` (or a new `OnboardingGuard` component wrapping the `AppLayout` outlet):

1. After auth is confirmed and profile is loaded, check `onboarding_completed`
2. If `false`, redirect to `/app/onboarding`
3. The onboarding page itself is NOT gated by this check (to avoid a redirect loop)
4. On completion, set `onboarding_completed = true` in the profile, then navigate to `/app/dashboard`

```typescript
// In AppLayout.tsx or a new OnboardingGate wrapper:
const { userProfile } = useAppContext();
const location = useLocation();

if (userProfile && !userProfile.onboardingCompleted && location.pathname !== '/app/onboarding') {
  return <Navigate to="/app/onboarding" replace />;
}
```

### Wizard Steps

The wizard is a multi-step form, 5 steps, one screen per step. Progress bar at the top shows completion.

**Step 1 — Who You Are**
Fields:
- Full name (text input, pre-filled from OAuth if available)
- Role / job title (text input, placeholder: "e.g., Senior Consultant, Project Manager, L&D Lead")
- Function (dropdown: Consulting, Business Development, Project Management, L&D, Analytics, Operations, Communications, IT, Other)
- If "Other": free text input for function name
- Seniority (dropdown: Junior / Associate, Mid-Level, Senior / Lead, Manager / Director, VP / C-Suite)

**Step 2 — Your AI Experience**
Fields:
- AI experience level (single select cards):
  - "Beginner" — I've tried AI a few times but don't use it regularly
  - "Comfortable User" — I use AI tools weekly for basic tasks
  - "Builder" — I've created custom prompts, GPTs, or agents
  - "Integrator" — I've connected AI into workflows or built AI-powered tools
- Experience description (optional textarea): "Briefly describe how you currently use AI in your work"

**Step 3 — Your Ambition**
Fields:
- Primary ambition (single select cards):
  - "Confident Daily Use" — Use AI effectively every day
  - "Build Reusable Tools" — Create AI agents and templates my team can use
  - "Own AI Processes" — Design and run automated AI workflows
  - "Build Full Apps" — Create complete AI-powered applications
  - "Lead AI Strategy" — Drive AI adoption across my organisation
- Goal description (optional textarea): "What specific goal would you like to work towards?"

**Step 4 — Your Context**
Fields:
- Current challenge (textarea): "What's the biggest challenge you face when using AI right now?"
- Weekly availability (single select pills): "1–2 hours", "3–4 hours", "5+ hours"

**Step 5 — Review & Generate Plan**
- Summary card showing all answers (editable — click any section to jump back to that step)
- "Generate My Learning Plan →" primary CTA button
- On click: calls the `/api/generate-pathway` endpoint with the form data
- Shows a processing indicator while the plan generates
- On success: saves profile + learning plan to Supabase, sets `onboarding_completed = true`, navigates to `/app/dashboard`

### Visual Design

**Progress bar:**
- Full width, `height: 4px`, `background: #E2E8F0`
- Fill: teal `#38B2AC`, width = `(currentStep / totalSteps) * 100%`
- `transition: width 0.3s ease`
- Step counter: "Step N of 5" — `fontSize: 12`, `color: #A0AEC0`, centred above bar

**Page layout:**
- `maxWidth: 640px`, `margin: 0 auto`, `padding: 40px 24px`
- `background: #FFFFFF` card with `border: 1px solid #E2E8F0`, `borderRadius: 16`, `padding: 32px`
- Step heading: DM Sans, `fontSize: 22`, `fontWeight: 700`, `color: #1A202C`, `marginBottom: 8`
- Step description: `fontSize: 14`, `color: #718096`, `marginBottom: 24`

**Input fields:**
- `border: 1px solid #E2E8F0`, `borderRadius: 10`, `padding: 12px 16px`
- `fontSize: 14`, `color: #1A202C`
- Focus: `borderColor: #38B2AC`, `boxShadow: 0 0 0 3px rgba(56, 178, 172, 0.1)`
- Label: `fontSize: 13`, `fontWeight: 600`, `color: #2D3748`, `marginBottom: 6`

**Single select cards (for AI experience and ambition):**
- `padding: 14px 18px`, `borderRadius: 12`, `border: 1px solid #E2E8F0`
- `cursor: pointer`
- Selected: `border: 2px solid #38B2AC`, `background: #E6FFFA`
- Title: `fontSize: 14`, `fontWeight: 700`, `color: #1A202C`
- Description: `fontSize: 13`, `color: #718096`

**Navigation buttons:**
- "Back" (left): secondary style — `border: 1px solid #E2E8F0`, `color: #4A5568`, `borderRadius: 24`
- "Continue →" (right): primary style — `background: #38B2AC`, `color: #FFFFFF`, `borderRadius: 24`
- Disabled state: `background: #A0AEC0`, `cursor: not-allowed`
- "Continue →" is disabled until all required fields in the current step are filled

**Review step summary card:**
- Each section: left-bordered card (`borderLeft: 3px solid #38B2AC`)
- Section label (uppercase, 11px, `#A0AEC0`) + value (14px, `#1A202C`)
- "Edit" link (right-aligned, 12px, teal) to jump back to that step

### Data flow

1. On "Generate My Learning Plan →", call `upsertProfile(user.id, formData)` to save all profile fields
2. Call `/api/generate-pathway` with the form data (same endpoint the marketing site Learning Pathway uses)
3. On success, call `saveLearningPlan(user.id, response, levelDepths)`
4. Set `onboarding_completed = true` via `upsertProfile`
5. Navigate to `/app/dashboard`

### Profile fields mapping

| Wizard field | Profile column | Type |
|--------------|---------------|------|
| Full name | `full_name` | text |
| Role | `role` | text |
| Function | `function` | text |
| Function (other) | `function_other` | text |
| Seniority | `seniority` | text |
| AI experience | `ai_experience` | enum |
| Experience description | `experience_description` | text |
| Ambition | `ambition` | enum |
| Goal description | `goal_description` | text |
| Challenge | `challenge` | text |
| Availability | `availability` | enum |

These map exactly to the existing `profiles` schema — no new columns needed beyond `onboarding_completed`, `current_level`, and `streak_days` (added in §3.3).

---

## 12. Artefacts Data Layer — `hooks/useArtefactsData.ts`

### Replace all mock data with Supabase queries.

The hook signature and return type remain the same. The internal implementation changes from `MOCK_ARTEFACTS` / `MOCK_CONTENT` to real Supabase calls.

### Updated type

```typescript
export type ArtefactType =
  | 'prompt' | 'agent' | 'workflow' | 'dashboard' | 'app_spec'
  | 'build_guide' | 'prd';
```

### Functions to implement in `lib/database.ts`

```typescript
// ─── ARTEFACTS ───

export async function getArtefacts(userId: string): Promise<Artefact[]> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('id, name, type, level, source_tool, preview, created_at, updated_at, last_opened_at')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (error) { console.error('getArtefacts error:', error); return []; }
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    type: row.type as ArtefactType,
    level: row.level,
    sourceTool: row.source_tool,
    preview: row.preview,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastOpenedAt: row.last_opened_at ? new Date(row.last_opened_at) : null,
  }));
}

export async function getArtefactContent(id: string, userId: string): Promise<ArtefactContent | null> {
  const { data, error } = await supabase
    .from('artefacts')
    .select('content')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) { console.error('getArtefactContent error:', error); return null; }
  // Also update last_opened_at
  await supabase.from('artefacts').update({ last_opened_at: new Date().toISOString() }).eq('id', id);
  return data.content as ArtefactContent;
}

export async function createArtefact(
  userId: string,
  artefact: {
    name: string;
    type: ArtefactType;
    level: number;
    source_tool: string;
    content: ArtefactContent;
    preview?: string;
  },
): Promise<Artefact | null> {
  const { data, error } = await supabase
    .from('artefacts')
    .insert({
      user_id: userId,
      name: artefact.name,
      type: artefact.type,
      level: artefact.level,
      source_tool: artefact.source_tool,
      content: artefact.content,
      preview: artefact.preview || null,
    })
    .select()
    .single();
  if (error) { console.error('createArtefact error:', error); return null; }
  return {
    id: data.id,
    name: data.name,
    type: data.type as ArtefactType,
    level: data.level,
    preview: data.preview,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    lastOpenedAt: null,
  };
}

export async function renameArtefact(id: string, userId: string, newName: string): Promise<boolean> {
  const { error } = await supabase
    .from('artefacts')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

export async function archiveArtefact(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('artefacts')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}

export async function duplicateArtefact(id: string, userId: string): Promise<Artefact | null> {
  // Fetch original
  const { data: original, error: fetchErr } = await supabase
    .from('artefacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (fetchErr || !original) return null;

  // Insert copy
  const { data: copy, error: insertErr } = await supabase
    .from('artefacts')
    .insert({
      user_id: userId,
      name: `${original.name} (copy)`,
      type: original.type,
      level: original.level,
      source_tool: original.source_tool,
      content: original.content,
      preview: original.preview,
    })
    .select()
    .single();
  if (insertErr || !copy) return null;
  return {
    id: copy.id,
    name: copy.name,
    type: copy.type as ArtefactType,
    level: copy.level,
    preview: copy.preview,
    createdAt: new Date(copy.created_at),
    updatedAt: new Date(copy.updated_at),
    lastOpenedAt: null,
  };
}

export async function updateArtefactContent(
  id: string, userId: string, content: ArtefactContent,
): Promise<boolean> {
  const { error } = await supabase
    .from('artefacts')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
}
```

### Update `dbSavePrompt` (backward compatibility)

The existing `savePrompt` function in `lib/database.ts` should be updated to write to `artefacts` instead of `saved_prompts`:

```typescript
export async function savePrompt(
  userId: string,
  prompt: { level: number; title: string; content: string; source_tool: string },
): Promise<SavedPrompt | null> {
  // Write to artefacts table instead of saved_prompts
  const artefact = await createArtefact(userId, {
    name: prompt.title,
    type: 'prompt',
    level: prompt.level,
    source_tool: prompt.source_tool,
    content: { promptText: prompt.content },
    preview: prompt.content.substring(0, 200),
  });
  if (!artefact) return null;
  return {
    id: artefact.id,
    level: artefact.level,
    title: artefact.name,
    content: prompt.content,
    savedAt: artefact.createdAt.getTime(),
  };
}
```

This ensures all existing toolkit pages that call `dbSavePrompt()` automatically write to the `artefacts` table without any changes to those components.

---

## 13. SearchFilterBar.tsx — Expanded Type Filters

### Add new types

Update the `TYPE_CONFIG` array to include the new artefact types:

```typescript
import { FileText, BookOpen } from 'lucide-react';  // add to imports

const TYPE_CONFIG: { type: ArtefactType; label: string; Icon: ... }[] = [
  { type: 'prompt',      label: 'Prompt',      Icon: Zap },
  { type: 'agent',       label: 'Agent',       Icon: Bot },
  { type: 'workflow',    label: 'Workflow',     Icon: GitBranch },
  { type: 'dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { type: 'app_spec',    label: 'App Spec',    Icon: Layers },
  { type: 'build_guide', label: 'Build Guide', Icon: BookOpen },
  { type: 'prd',         label: 'PRD',         Icon: FileText },
];
```

No other changes needed — the filter logic in `AppArtefacts.tsx` already handles arbitrary types via the `activeTypes` Set.

---

## 14. Supabase Dashboard Configuration

### Required before deployment

1. **Create Supabase project** (if not already done) and note the project URL + anon key
2. **Set environment variables** in the deployment environment (Vercel / Firebase Hosting):
   - `VITE_SUPABASE_URL` = `https://[project-ref].supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the anon/public key from Supabase dashboard
3. **Auth → Providers → Google:**
   - Create a Google Cloud OAuth 2.0 client (Web application type)
   - Set Authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
   - Add Client ID and Client Secret in Supabase
4. **Auth → Providers → Azure (Microsoft):**
   - Create an Azure AD app registration
   - Set redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
   - Add Tenant ID, Client ID, Client Secret in Supabase
5. **Auth → URL Configuration:**
   - Site URL: `https://[production-domain]`
   - Redirect URLs: add `https://[production-domain]/app/dashboard`
6. **Run schema migrations** in SQL Editor:
   - The full `schema.sql` (which now includes the `artefacts` table)
   - The `saved_prompts` → `artefacts` migration script from §3.2

---

## 15. Testing Checklist

### Authentication

- [ ] Visiting `/app/dashboard` while signed out redirects to `/login?redirect=%2Fapp%2Fdashboard`
- [ ] Visiting `/login` shows the sign-in card with Google and Microsoft buttons
- [ ] Clicking "Continue with Google" initiates Google OAuth and redirects back to the app on success
- [ ] Clicking "Continue with Microsoft" initiates Microsoft OAuth and redirects back to the app on success
- [ ] After sign-in, refreshing the page does NOT prompt sign-in again (session persisted)
- [ ] Signing out clears the session and redirects to `/`
- [ ] The marketing site (all non-`/app` routes) remains accessible without authentication
- [ ] A new user signing in for the first time has a `profiles` row created automatically
- [ ] The `?redirect=` param works — signing in from `/login?redirect=%2Fapp%2Fartefacts` lands on `/app/artefacts`

### Onboarding

- [ ] A new user (with `onboarding_completed = false`) is redirected to `/app/onboarding` from any `/app/*` route
- [ ] All 5 wizard steps render correctly with proper validation
- [ ] "Back" and "Continue" navigation works between steps
- [ ] The review step shows all entered data and allows editing
- [ ] "Generate My Learning Plan →" calls the API and shows a processing indicator
- [ ] On success, the profile is saved, `onboarding_completed = true`, and the user is redirected to `/app/dashboard`
- [ ] Subsequent visits go directly to `/app/dashboard` (not back to onboarding)

### Navbar

- [ ] Signed out: "Sign In" button appears in navbar (desktop and mobile)
- [ ] Signed in: "My Dashboard →" pill and avatar appear (existing behaviour)
- [ ] Avatar dropdown shows user name, email, and "Sign out" option

### Artefacts

- [ ] Saving from any toolkit tool writes to the `artefacts` table (not `saved_prompts`)
- [ ] The Artefacts page loads real data from Supabase
- [ ] Type filters include "Build Guide" and "PRD" options
- [ ] Level filters (1–5) work correctly
- [ ] Search, sort, rename, duplicate, and archive all work against real data
- [ ] Quick-use panel loads artefact content from Supabase

### Data integrity

- [ ] `user.id` from `useAuth()` is a real Supabase UUID (not `mock-user-001`)
- [ ] All `upsertToolUsed(user.id, ...)` calls succeed with the real user ID
- [ ] RLS policies are enforced — User A cannot see User B's artefacts

---

## 16. Implementation Order

Recommended sequence for the developer:

1. **Schema first** — Run the SQL migrations (artefacts table, profile columns)
2. **AuthContext** — Rewrite with real Supabase auth
3. **Login page** — Build the `/login` route with AuthModal
4. **AppAuthGuard** — Re-enable route protection
5. **App.tsx** — Wire AuthProvider and guard
6. **Navbar** — Auth-aware button swap
7. **AppTopBar** — Sign-out dropdown
8. **Onboarding wizard** — Build the 5-step form at `/app/onboarding`
9. **AppContext / OnboardingGate** — Add the onboarding redirect logic
10. **Database layer** — Add artefact CRUD functions to `lib/database.ts`, update `savePrompt`
11. **useArtefactsData** — Replace mocks with Supabase queries
12. **SearchFilterBar** — Add new type filters
13. **Test end-to-end** against the checklist in §15
