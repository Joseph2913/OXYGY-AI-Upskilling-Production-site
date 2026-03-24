# PRD: Guided Product Tour — Oxygy AI Upskilling Platform

---

## 1. Overview

### 1.1 Purpose
A 7-step guided product tour that activates immediately after the self-assessment onboarding (`AppOnboarding.tsx`) completes and the user lands on My Journey for the first time. The tour walks users through every major section of the app — navigating them to each page in sequence while a persistent tour card describes what each page does and highlights specific features.

The tour is **optional** (users can skip at any time) and **re-playable** (accessible at any point via the Settings panel in the sidebar).

### 1.2 Where it sits in the app flow
```
AppOnboarding.tsx (self-assessment, 5 steps)
    ↓  navigate('/app/journey')
AppJourney.tsx ← Tour activates here after 1.5s delay
    ↓  user clicks Next
AppDashboard.tsx
    ↓  user clicks Next
AppCurrentLevel.tsx
    ↓  user clicks Next
/app/toolkit/prompt-library
    ↓  user clicks Next
/app/toolkit/learning-coach
    ↓  user clicks Next
AppArtefacts.tsx
    ↓  user clicks Next
AppCohort.tsx  ← Tour ends here
```

### 1.3 Core behaviour rules
- The tour card is a **fixed bottom-right overlay** that sits on top of whatever page is currently loaded
- Clicking **Next** navigates the user to the next page AND updates the card content simultaneously
- Clicking **Back** navigates to the previous page AND reverts the card
- Clicking **Skip tour** dismisses the card immediately without navigating away from the current page
- The tour card never covers the sidebar (positioned to the right of the sidebar, not overlapping it)
- The tour does **not** require any user interaction on the pages behind it — it is entirely observational/static
- Exception: Step 3 (Current Level) shows **spotlight rings** pointing at the narration and fullscreen controls in the live UI

---

## 2. Trigger & Persistence

### 2.1 First-time trigger
- After `AppOnboarding.tsx` calls `navigate('/app/journey', { replace: true })`, the tour auto-triggers with a **1500ms delay** to allow the Journey page to finish loading
- The trigger fires **only** if `localStorage.getItem('oxygy_tour_completed')` is `null` or `undefined`
- Once the tour is either completed (Step 7 → "Get started") or skipped, set `localStorage.setItem('oxygy_tour_completed', 'true')`

### 2.2 Re-play trigger
- The Settings panel in `AppSidebar.tsx` already renders a slide-in panel with two action items: "Edit Profile & Regenerate Plan" and "Sign Out"
- **Add a third action item** to this list:
  ```
  Label:        "Replay product tour"
  Description:  "Revisit the guided walkthrough of the platform"
  Action:       setSettingsOpen(false) → clear oxygy_tour_completed from localStorage → navigate('/app/journey') → trigger tour
  ```
- Placement: insert this item **between** "Edit Profile & Regenerate Plan" and "Sign Out" (i.e. it becomes item 2 of 3)

### 2.3 Tour state — what to persist
- `localStorage` key: `oxygy_tour_completed` (string `'true'` | absent)
- No mid-session persistence required — if the user refreshes mid-tour, the tour does not resume. It simply won't auto-trigger again (since `oxygy_tour_completed` is already set once they start). The Settings replay option covers re-access.
- **Exception:** Do not set `oxygy_tour_completed` until the user either clicks "Get started" on Step 7 or explicitly clicks "Skip tour". Closing the browser mid-tour without skipping leaves the flag unset, so the tour will re-trigger on next login.

---

## 3. Tour Card — Component Spec

### 3.1 Positioning
```
position: fixed
bottom: 24px
right: 24px
z-index: 9999
width: 400px
```
The card must not overlap the sidebar (sidebar is ~200px wide, positioned left). The card is right-aligned to the viewport edge, which naturally keeps it clear of the sidebar on standard desktop widths (1280px+). On narrower viewports (<900px), reduce width to `calc(100vw - 48px)` and cap at 400px.

### 3.2 Card structure (top to bottom)
```
┌──────────────────────────────────────────────────┐
│  [3px teal gradient accent bar — full width]     │
├──────────────────────────────────────────────────┤
│  [Progress dots ·····]          [Skip tour ×]   │  ← 12px 16px padding
├──────────────────────────────────────────────────┤
│  [Text panel — left]    [Icon panel — right]     │  ← 14px 16px padding
│   Eyebrow: "Step N of 7"                         │
│   Title (15px 700 white)                         │
│   Description (12px rgba(255,255,255,0.55))      │
│                                                  │
├──────────────────────────────────────────────────┤
│  [Feature chips row]                             │  ← 0 16px 12px padding
├──────────────────────────────────────────────────┤
│  [← Back]                         [Next →]      │  ← 10px 16px 14px padding
└──────────────────────────────────────────────────┘
```

### 3.3 Visual design tokens
```
background:         #1A202C
border-radius:      14px
border:             1px solid rgba(56,178,172,0.3)
box-shadow:         0 8px 32px rgba(0,0,0,0.25)

Accent bar:         background: linear-gradient(90deg, #38B2AC, #A8F0E0), height: 3px

Eyebrow:            font-size: 10px, font-weight: 700, color: #38B2AC,
                    letter-spacing: 1.5px, text-transform: uppercase, margin-bottom: 5px

Title:              font-size: 15px, font-weight: 700, color: #FFFFFF, line-height: 1.3, margin-bottom: 6px

Description:        font-size: 12px, color: rgba(255,255,255,0.55), line-height: 1.6, font-weight: 400

Feature chips:      background: transparent, border: 1px solid rgba(255,255,255,0.1),
                    border-radius: 20px, padding: 3px 9px,
                    font-size: 10px, font-weight: 600, color: rgba(255,255,255,0.4),
                    gap: 5px, flex-wrap: wrap

Back button:        background: none, border: 1px solid rgba(255,255,255,0.12),
                    border-radius: 20px, color: rgba(255,255,255,0.45),
                    font-size: 12px, font-weight: 600, padding: 7px 14px
                    — opacity 0.3 and pointer-events: none on Step 1

Next button:        background: #38B2AC, border: none, border-radius: 20px,
                    color: white, font-size: 12px, font-weight: 700, padding: 7px 18px
                    — On Step 7: background: #48BB78, label: "Get started ✓"

Skip tour:          font-size: 11px, font-weight: 600, color: rgba(255,255,255,0.3),
                    background: none, border: none, cursor: pointer

Nav row border-top: 1px solid rgba(255,255,255,0.07)
```

### 3.4 Progress dots
- 7 dots rendered as `<div>` elements, gap: 5px
- Active dot: `width: 20px, height: 6px, border-radius: 3px, background: #38B2AC`
- Visited dot: `width: 6px, height: 6px, border-radius: 3px, background: rgba(56,178,172,0.4)`
- Unvisited dot: `width: 6px, height: 6px, border-radius: 3px, background: rgba(255,255,255,0.12)`
- Transition: `all 0.25s ease`

### 3.5 Icon panel (right side of card body)
- Width: 76px, flex-shrink: 0
- Each step has a dedicated 64×64px SVG icon (see Section 7)
- Icon container: `width: 64px, height: 64px, background: rgba(56,178,172,0.08), border: 1px solid rgba(56,178,172,0.18), border-radius: 12px, display: flex, align-items: center, justify-content: center`
- Icon: exact Lucide stroke icon, 24×24, `stroke: #38B2AC`, `stroke-width: 1.75`, `fill: none`
- Animation: `float 3s ease-in-out infinite` — `@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }`
- Each step's icon has a staggered `animation-delay` (step 1: 0s, step 2: 0.25s … step 7: 1.5s) — this stagger is cosmetic only; since only one icon is visible at a time, the delay just controls where in the float cycle it starts

### 3.6 Card entrance animation
```css
@keyframes tourCardIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
Applies each time the card content changes (step transition). Duration: 0.25s, easing: ease.

### 3.7 Card dismiss animation
On Skip or "Get started":
```css
transition: opacity 0.3s, transform 0.3s;
opacity: 0;
transform: translateY(16px);
```
After 300ms: set `display: none` or unmount the component.

---

## 4. Navigation Behaviour

### 4.1 Route map per step
| Step | Page navigated to | Route |
|------|-------------------|-------|
| 1 | My Journey | `/app/journey` |
| 2 | Dashboard | `/app/dashboard` |
| 3 | Current Level | `/app/level?level=1` |
| 4 | Prompt Library | `/app/toolkit/prompt-library` |
| 5 | Learning Coach | `/app/toolkit/learning-coach` |
| 6 | My Artefacts | `/app/artefacts` |
| 7 | My Cohort | `/app/cohort` |

### 4.2 Navigation implementation
- Use `useNavigate()` from `react-router-dom`
- Navigate **before** updating the step counter — the page transition and card update fire together
- `replace: false` — add to browser history so native back button works (though this is secondary; the card's Back button is the primary nav mechanism)
- The tour card component must live **above the `<Routes>` tree** in `App.tsx` so it persists across page navigations without remounting

### 4.3 Component placement in App.tsx
The `<ProductTour />` component should be rendered **inside the `/app` route wrapper but outside the individual route `<Switch>`**, so it is always mounted while the user is within the app shell. It reads the current step from its own state and controls its own visibility independently of the router.

---

## 5. Step-by-Step Content Specification

### Step 1 — My Journey
**Route:** `/app/journey`
**Icon:** Map (Lucide)

**Card content:**
- Eyebrow: `STEP 1 OF 7`
- Title: `Your Learning Journey`
- Description: `This is your personalised roadmap. Each level you've been assigned contains three things to complete: an e-learning module, a toolkit activity, and a project submission.`
- Feature chips: `E-learning`, `Toolkit activity`, `Project submission`

**In-card illustration (below description, above chips):**
A compact static mockup of a project submission card rendered inside the tour card itself. This is the only step with an in-card illustration. It sits between the description text and the feature chips, occupying the full width of the text column.

Project card illustration spec:
```
Container: background: rgba(255,255,255,0.04), border: 1px solid rgba(255,255,255,0.1),
           border-radius: 8px, padding: 10px 12px, margin-top: 8px, margin-bottom: 8px

Row 1:  Left: "Level 1 Project" label (10px, teal, font-weight 700, uppercase, letter-spacing 1px)
        Right: Tier badge "A" (14px circle, background #D1FAE5, color #065F46, font-weight 900)

Row 2 (margin-top 6px):
        Title text "Prompt Engineering in Practice" (12px, white, font-weight 600)

Row 3 (margin-top 6px):
        Five small score indicator pills in a row: R · C · B · [A filled teal] · S
        Each pill: 18px × 18px circle, font-size 9px, font-weight 800
        R: rgba(255,255,255,0.08) bg, rgba(255,255,255,0.2) text
        C: same
        B: same
        A: #38B2AC bg, white text (active tier)
        S: rgba(255,255,255,0.08) bg, rgba(255,255,255,0.2) text
        Label "Your score" sits left of the pill row (9px, rgba(255,255,255,0.3))

Row 4 (margin-top 8px):
        "Submit project →" text (10px, #38B2AC, font-weight 600)
```

**Callout note below illustration:**
```
"Projects are scored across five tiers: R → C → B → A → S. Aim for A or above."
```
Font: 10px, `rgba(255,255,255,0.35)`, italic.

**No spotlight overlays on this step.**

---

### Step 2 — Dashboard
**Route:** `/app/dashboard`
**Icon:** Home (Lucide)

**Card content:**
- Eyebrow: `STEP 2 OF 7`
- Title: `Your Control Centre`
- Description: `Track your overall progress, pick up where you left off, and — if you're part of a cohort — see how your team is progressing on the leaderboard.`
- Feature chips: `Resume learning`, `Progress overview`, `Cohort leaderboard*`

**Chip footnote:** The asterisk on "Cohort leaderboard*" should be followed by a footnote line below the chips row:
```
* Only visible if you're enrolled in a cohort
```
Font: 10px, `rgba(255,255,255,0.3)`, italic. Padding: 0 16px 4px. No asterisk on the other chips.

**No spotlight overlays on this step.**

---

### Step 3 — Current Level
**Route:** `/app/level?level=1`
**Icon:** BookOpen (Lucide)

**Card content:**
- Eyebrow: `STEP 3 OF 7`
- Title: `Your Learning Environment`
- Description: `This is where you pick up your e-learning exactly where you left off. We recommend enabling narration and using fullscreen mode for the best experience.`
- Feature chips: `Auto-resumes progress`, `Audio narration`, `Fullscreen mode`

**Spotlight overlays — this is the only step with live UI spotlights:**

Two spotlight rings must be rendered on top of the Current Level page UI (not inside the card). They are absolutely positioned rings that appear after the tour card renders on this step, with a 600ms delay to allow the ELearning player to settle.

**Spotlight 1 — Narration button:**
- Target: the play/pause audio button in the `AudioBar` component (the bottom control bar of the ELearning player)
- The AudioBar renders at the bottom of the ELearning player inside `ELearningView.tsx`
- Implementation: use a `data-tour="narration-btn"` attribute on the audio play/pause button element in `ELearningView.tsx`, then in the tour component use `document.querySelector('[data-tour="narration-btn"]')` to get its `getBoundingClientRect()` and position the spotlight ring

**Spotlight 2 — Fullscreen button:**
- Target: the fullscreen toggle button (`Maximize2` icon) in the ELearning player top bar
- Implementation: use a `data-tour="fullscreen-btn"` attribute on that button in `ELearningView.tsx`

**Spotlight ring visual spec:**
```
position: fixed
border-radius: 50%   (circular ring)
border: 2px solid #38B2AC
box-shadow: 0 0 0 4px rgba(56,178,172,0.15), 0 0 16px rgba(56,178,172,0.3)
pointer-events: none
z-index: 9998   (below the card at 9999 but above page content)
animation: spotlightPulse 1.8s ease-in-out infinite

@keyframes spotlightPulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(56,178,172,0.15), 0 0 16px rgba(56,178,172,0.3); }
  50%       { box-shadow: 0 0 0 8px rgba(56,178,172,0.2), 0 0 24px rgba(56,178,172,0.4); }
}
```

Size: 8px padding around the target element on all sides (i.e. `width = rect.width + 16`, `height = rect.height + 16`, `top = rect.top - 8`, `left = rect.left - 8`).

A small label floats below each spotlight ring:
```
"Enable narration"    (below spotlight 1)
"Go fullscreen"       (below spotlight 2)
```
Label style: `font-size: 10px, font-weight: 700, color: #38B2AC, background: #1A202C, padding: 2px 8px, border-radius: 10px, border: 1px solid rgba(56,178,172,0.3)`
Position: centred horizontally below the ring, `margin-top: 6px`

Spotlights disappear when the user navigates to Step 4 (clicks Next).

---

### Step 4 — My Toolkit (Prompt Library)
**Route:** `/app/toolkit/prompt-library`
**Icon:** Wrench (Lucide)

**Card content:**
- Eyebrow: `STEP 4 OF 7`
- Title: `My Toolkit`
- Description: `Your toolkit contains AI tools that match your current level. Here's the Prompt Library — where every prompt you've saved from the Prompt Playground lives, ready to reuse.`
- Feature chips: `5 AI tools`, `Level-gated`, `Saves to Artefacts`

**Secondary note below chips:**
```
"Explore your other unlocked tools in your own time — each one follows the same structured flow."
```
Font: 10px, `rgba(255,255,255,0.35)`, italic. Padding: 0 16px 4px.

**No spotlight overlays on this step.** The tour navigates the user to the actual Prompt Library page (`/app/toolkit/prompt-library`) so they can see the real UI behind the card.

---

### Step 5 — Learning Coach
**Route:** `/app/toolkit/learning-coach`
**Icon:** GraduationCap (Lucide)

**Card content:**
- Eyebrow: `STEP 5 OF 7`
- Title: `Your Learning Coach`
- Description: `The Learning Coach curates external learning resources tailored to your current topic and learning style. Choose a platform, pick your objective, and get a personalised plan.`
- Feature chips: `NotebookLM`, `Perplexity`, `YouTube`

**In-card illustration (below description, above chips):**
A compact static mockup showing the platform selector and a sample YouTube output card. This is an illustrative mock — not interactive.

Platform selector row:
```
Three pill buttons in a horizontal row:
  "NotebookLM"  |  "Perplexity"  |  [YouTube — active]

Inactive pill: background: rgba(255,255,255,0.05), border: 1px solid rgba(255,255,255,0.1),
               border-radius: 20px, padding: 4px 10px, font-size: 10px, font-weight: 600,
               color: rgba(255,255,255,0.3)

Active pill (YouTube): background: rgba(56,178,172,0.15), border: 1px solid rgba(56,178,172,0.4),
                        color: #38B2AC
```

Sample output card below the selector:
```
Container: background: rgba(255,255,255,0.04), border: 1px solid rgba(255,255,255,0.08),
           border-radius: 6px, padding: 8px 10px, margin-top: 6px

Row 1: "YouTube · Practical Tutorials" label (9px, rgba(255,255,255,0.35), font-weight 600)
Row 2: "How Prompt Engineering Actually Works" (11px, white, font-weight 600, margin-top 3px)
Row 3: Two small meta pills: "▶ 12 min"  "Beginner-friendly"
        Pill style: background rgba(255,255,255,0.06), border-radius 4px,
                    padding 1px 6px, font-size 9px, color rgba(255,255,255,0.4)
```

---

### Step 6 — My Artefacts
**Route:** `/app/artefacts`
**Icon:** Folder (Lucide)

**Card content:**
- Eyebrow: `STEP 6 OF 7`
- Title: `My Artefacts`
- Description: `Everything you create is saved here automatically — prompts from the Playground, agents from the Agent Builder, and completed project submissions. Click any artefact to open it directly.`
- Feature chips: `Toolkit outputs`, `Project proofs`, `Quick access`

**In-card illustration (below description, above chips):**
Three stacked artefact row items, showing the variety of artefact types.

```
Container: margin-top: 8px, display: flex, flex-direction: column, gap: 5px

Row 1 — Prompt artefact:
  Left dot: 8×8px circle, background #A8F0E0
  Type label: "Prompt" (9px, #A8F0E0, font-weight 700, width: 52px)
  Name: "Stakeholder briefing prompt" (10px, rgba(255,255,255,0.6), font-weight 500)
  Right: "↗" link icon (10px, rgba(56,178,172,0.6))

Row 2 — Agent artefact:
  Left dot: 8×8px circle, background #F7E8A4
  Type label: "Agent" (9px, #C4A934, font-weight 700, width: 52px)
  Name: "Weekly report assistant" (10px, rgba(255,255,255,0.6), font-weight 500)
  Right: "↗" link icon (10px, rgba(56,178,172,0.6))

Row 3 — Project proof:
  Left dot: 8×8px circle, background #C3D0F5
  Type label: "Project" (9px, #5B6DC2, font-weight 700, width: 52px)
  Name: "Level 1 — Prompt Engineering" (10px, rgba(255,255,255,0.6), font-weight 500)
  Right: "↗" link icon (10px, rgba(56,178,172,0.6))

Each row: display flex, align-items center, gap 8px, padding 5px 8px,
          background rgba(255,255,255,0.03), border-radius 5px
```

**Callout note below illustration:**
```
"The ↗ icon on each artefact links back to the tool page where it was created."
```
Font: 10px, `rgba(255,255,255,0.35)`, italic.

---

### Step 7 — My Cohort
**Route:** `/app/cohort`
**Icon:** Users (Lucide)

**Card content:**
- Eyebrow: `STEP 7 OF 7`
- Title: `My Cohort`
- Description: `If you're enrolled in a cohort, this is where you track your team's collective progress — weekly activity, learning milestones, and how everyone is moving through the programme together.`
- Feature chips: `Team leaderboard`, `Weekly activity`, `Milestone tracking`

**No spotlight overlays on this step.**

**Next button state:** On this final step, the Next button changes to:
```
label:      "Get started ✓"
background: #48BB78
```
Clicking it: sets `localStorage.setItem('oxygy_tour_completed', 'true')` → dismisses the card with the fade-out animation → stays on `/app/cohort`.

---

## 6. Component Architecture

### 6.1 New file to create
```
components/app/ProductTour.tsx
```

This is a single self-contained component. All step data (content, routes, icons, illustrations) is defined as a constant array within this file.

### 6.2 Props / interface
```typescript
interface ProductTourProps {
  onComplete: () => void;  // called when tour completes or is skipped
}
```

### 6.3 State
```typescript
const [step, setStep] = useState(0);           // 0–6 (maps to 7 steps)
const [visible, setVisible] = useState(true);  // controls card render
const [spotlightsVisible, setSpotlightsVisible] = useState(false); // Step 3 only
```

### 6.4 Step data array
```typescript
const TOUR_STEPS: TourStep[] = [
  {
    id: 'journey',
    eyebrow: 'Step 1 of 7',
    title: 'Your Learning Journey',
    description: '...',
    chips: ['E-learning', 'Toolkit activity', 'Project submission'],
    route: '/app/journey',
    icon: 'Map',
    hasInlineIllustration: true,   // renders the project card illustration
    hasSpotlights: false,
    footnote: null,
  },
  // ... all 7 steps
];
```

### 6.5 Where to mount in App.tsx
Inside the `/app` route group, wrap the existing `<AppLayout>` with a fragment that also renders `<ProductTour>` when the tour flag is active:

```typescript
// In App.tsx, within the /app route element:
{tourActive && <ProductTour onComplete={() => setTourActive(false)} />}
```

`tourActive` is derived from `localStorage.getItem('oxygy_tour_completed') !== 'true'` on mount, plus the replay trigger from Settings.

### 6.6 AppSidebar.tsx changes
Add the replay option to the existing settings items array:
```typescript
const SETTINGS_ITEMS = [
  { label: 'Edit Profile & Regenerate Plan', desc: '...', action: () => { ... } },
  {
    label: 'Replay product tour',
    desc: 'Revisit the guided walkthrough of the platform',
    action: () => {
      setSettingsOpen(false);
      localStorage.removeItem('oxygy_tour_completed');
      navigate('/app/journey');
      // parent component re-reads localStorage and re-mounts ProductTour
    }
  },
  { label: 'Sign Out', desc: '...', action: () => { ... } },
];
```
The replay action needs a way to signal the parent (`App.tsx`) to re-mount the tour. Implement this via a `window.dispatchEvent(new CustomEvent('oxygy:replay-tour'))` approach, or lift `tourActive` state to a context that both `AppSidebar` and `App.tsx` can access. The simpler approach is a `window` event.

### 6.7 ELearningView.tsx changes (for spotlight targets)
Add `data-tour` attributes to exactly two elements:

1. The audio play/pause button in `AudioBar`:
   ```tsx
   <button data-tour="narration-btn" onClick={...}>
   ```

2. The fullscreen toggle button (`Maximize2` icon):
   ```tsx
   <button data-tour="fullscreen-btn" onClick={...}>
   ```

No other changes to `ELearningView.tsx`.

---

## 7. SVG Icons per Step

Each step icon is a 24×24 Lucide stroke icon matching the sidebar exactly. Render inside a 64×64 container (see Section 3.5). Apply the `float` animation class.

| Step | Icon name | Lucide import |
|------|-----------|---------------|
| 1 — My Journey | Map | `Map` from `lucide-react` |
| 2 — Dashboard | Home | `Home` from `lucide-react` |
| 3 — Current Level | BookOpen | `BookOpen` from `lucide-react` |
| 4 — My Toolkit | Wrench | `Wrench` from `lucide-react` |
| 5 — Learning Coach | GraduationCap | `GraduationCap` from `lucide-react` |
| 6 — My Artefacts | Folder | `Folder` from `lucide-react` |
| 7 — My Cohort | Users | `Users` from `lucide-react` |

Render pattern:
```tsx
import { Map, Home, BookOpen, Wrench, GraduationCap, Folder, Users } from 'lucide-react';
const STEP_ICONS = [Map, Home, BookOpen, Wrench, GraduationCap, Folder, Users];
const Icon = STEP_ICONS[step];

<div style={{ /* 64×64 container */ }}>
  <Icon
    size={24}
    stroke="#38B2AC"
    strokeWidth={1.75}
    fill="none"
    className="tour-icon-float"
    style={{ animationDelay: `${step * 0.25}s` }}
  />
</div>
```

CSS animation (inject via `<style>` tag or global stylesheet):
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
.tour-icon-float {
  animation: float 3s ease-in-out infinite;
}
```

---

## 8. Responsive Behaviour

| Viewport | Behaviour |
|----------|-----------|
| ≥ 1280px | Full spec: fixed bottom-right, width 400px |
| 900–1279px | width: calc(100vw - 248px - 48px) — accounts for 200px sidebar + 24px each side |
| < 900px | width: calc(100vw - 32px), bottom: 16px, right: 16px. Spotlights hidden on mobile (too fragile). In-card illustrations scale down to 100% width. |
| Mobile | Tour is functional but spotlight overlays (Step 3) are suppressed — the card description still mentions narration and fullscreen. |

---

## 9. Animations Summary

| Animation | Applied to | Spec |
|-----------|------------|------|
| `tourCardIn` | Card on each step change | `from: {opacity:0, translateY:16px}` → `to: {opacity:1, translateY:0}`, 0.25s ease |
| `tourCardOut` | Card on skip/complete | opacity → 0, translateY → 16px, 0.3s, then display:none |
| `float` | Icon inside card | 0→-4px→0, 3s ease-in-out infinite |
| `spotlightPulse` | Spotlight rings on Step 3 | box-shadow expands/contracts, 1.8s infinite |
| `spotlightFadeIn` | Spotlight rings on Step 3 entry | opacity 0→1 with 600ms delay after navigation |
| Dots resize | Progress dots on step change | width 6→20px on active, 0.25s ease |

---

## 10. Edge Cases & Developer Notes

**Existing `AppOnboarding.tsx` behaviour:** The existing onboarding (`/app/onboarding`) is the self-assessment wizard that already navigates to `/app/journey` on completion. No changes needed to `AppOnboarding.tsx` — the tour trigger fires on the Journey page itself via the localStorage check, not from the onboarding component.

**Users who already completed onboarding before the tour is deployed:** `localStorage.getItem('oxygy_tour_completed')` will be `null` for existing users too, which would incorrectly trigger the tour. To avoid this, also check that the user's profile has been set up (i.e. `hasLearningPlan === true` and the user has been active before). If `hasLearningPlan` is true and the user has any existing artefacts or tool usage, do not auto-trigger the tour. The Settings replay option remains available for all users.

**The Prompt Library page (Step 4):** The route `/app/toolkit/prompt-library` is already built (`AppPromptLibrary.tsx`). The tour navigates there directly — no changes needed to that page.

**Learning Coach platform selector (Step 5):** The in-card illustration is purely static — it does not connect to the real `PLATFORMS` data. It is hardcoded HTML/JSX inside the tour card to show NotebookLM, Perplexity, and YouTube as pill options with YouTube active.

**Spotlight positioning (Step 3):** If `document.querySelector('[data-tour="narration-btn"]')` returns `null` (e.g. the e-learning hasn't loaded yet), suppress the spotlight and show only the card description. Add a `MutationObserver` or a 2000ms retry to handle delayed renders.

**Z-index stack:**
```
Page content:        1–100
Sidebar:             200
Tour spotlight rings: 9998
Tour card:           9999
```

**Browser back button:** If the user presses the browser back button while mid-tour, the router navigates back but the tour card does not update. This is acceptable — the tour is overlaid, not router-controlled. The user can continue using the Next/Back buttons on the card.

**Accessibility:** The tour card must be keyboard-navigable. Tab order: Skip → Back → Next. Add `role="dialog"`, `aria-label="Product tour"` to the card container. The `Escape` key should trigger the skip action.
