# PRD: SCORM Module — Level 1: Prompt Engineering Essentials
**Version:** 2.0 (Amended — Interactions, Knowledge Checks, Layout Quality)
**Supersedes:** Version 1.0
**Project:** Oxygy AI Center of Excellence
**Deliverable:** Self-contained SCORM 1.2 package + local simulator

---

## How to Read This Document

This is a complete rebuild specification. It supersedes Version 1.0 in full. Do not reference the old PRD — this document contains everything needed.

Sections marked **[UNCHANGED FROM V1]** can be carried over from the existing codebase directly. Sections marked **[AMENDED]** or **[NEW]** require rebuilding or new implementation. Every slide is explicitly marked.

---

## Critical Quality Mandate — Read Before Writing Any Code

Version 1.0 had layout failures that must be completely eliminated in this version. The following are non-negotiable requirements that apply to every single slide:

**No overlapping elements, ever.** Every element must have explicit, declared dimensions and spacing. Never rely on content to determine container height without a minimum height set. All absolutely positioned elements must have z-index values explicitly declared and tested.

**No text overflow.** Every text container must have `overflow: hidden` or `overflow-wrap: break-word` set. Long words and long prompt examples must never break out of their containers. All prompt boxes must have `word-break: break-word` applied.

**Explicit minimum heights on all cards.** Every card component must declare a `min-height` value. Cards in the same row must be equal height — use CSS Grid with `align-items: stretch` rather than Flexbox where equal heights are required.

**No collapsed containers.** If a container's content is dynamically added (quiz feedback, expand/collapse reveals), the container must have a minimum height set before content loads, and transitions must animate height explicitly using `max-height` transitions rather than `height: auto` switches which cause layout jumps.

**Padding is mandatory, never optional.** Every card, panel, prompt box, and content container must have explicit padding declared on all four sides. The minimum internal padding for any card or panel is `20px` on all sides. Never use padding shorthand that results in 0 on any side unless that side has a declared border that creates visual separation.

**Borders must be visible and consistent.** Every card uses `1px solid #E2E8F0` border. This must be present and must never be overridden to 0 by a parent rule. Test that borders render at all viewport sizes.

**Content area must never overflow the slide.** The content area between the top nav and the bottom navigation bar must be scrollable if content exceeds the available height. Set `overflow-y: auto` on the content area. Never allow content to extend beneath the fixed bottom navigation bar.

**Mobile layouts must be tested explicitly.** Every two-column layout must fully collapse to single column below 768px with no horizontal overflow.

---

## 1. Overview [UNCHANGED FROM V1]

### Purpose
A SCORM 1.2 compliant e-learning module teaching prompt engineering fundamentals to enterprise employees. Client-deliverable asset for Oxygy clients (Takeda, Sanofi, L'Oréal) to deploy in their internal LMS.

### Target learner
Enterprise employees who are AI-curious but not yet practitioners. No technical background assumed.

### Learning outcomes
1. Explain what an LLM is and how it differs from a search engine
2. Describe the difference between structured and free-form prompting and when each is appropriate
3. Apply the RCTF framework to construct a well-structured prompt
4. Recognise and apply Chain of Thought, Few-Shot, Iterative, and Constraint techniques
5. Use a practical prompt starter kit to improve day-to-day AI outputs

### Key pedagogical philosophy
No single right way to prompt. RCTF is one tool in a toolkit. Free-form/brain-dump is given equal standing. The course escalates in interactivity — starts calm, becomes progressively more hands-on.

---

## 2. File Structure [AMENDED]

```
/scorm/
  /level-1-prompt-engineering/
    index-local.html          ← Local simulator entry point
    index.html                ← SCORM LMS entry point
    imsmanifest.xml           ← SCORM 1.2 manifest
    /assets/
      oxygy-logo.svg
      /icons/
    /js/
      scorm-api.js
      scorm-simulator.js
      course.js               ← AMENDED: now includes interaction engines
      drag-drop.js            ← NEW: drag and drop engine
      card-flip.js            ← NEW: card flip engine
      quiz-engine.js          ← NEW: extracted quiz logic (all 3 question types)
      spectrum-slider.js      ← NEW: interactive spectrum slider
    /css/
      course.css              ← AMENDED: full layout reset + interaction styles
      interactions.css        ← NEW: all micro-interaction styles isolated here
    /slides/
      slide-01.html  ← Welcome
      slide-02.html  ← The Prompting Mindset
      slide-03.html  ← AMENDED: Interactive Spectrum Slider
      slide-04.html  ← The Brain Dump Approach
      slide-05.html  ← When Structure Helps
      slide-06.html  ← AMENDED: RCTF Drag and Drop Deconstruction
      slide-07.html  ← AMENDED: Card Flip — Role & Context
      slide-08.html  ← RCTF Deep Dive — Task & Format
      slide-09.html  ← Chain of Thought
      slide-10.html  ← AMENDED: Card Flip — Four Techniques
      slide-11.html  ← AMENDED: Three-Format Quiz
      slide-12.html  ← AMENDED: Animated Diff Comparison
      slide-13.html  ← AMENDED: Branching Consequence Scenario
      slide-14.html  ← AMENDED: Prompt Starter Kit + Builder
      slide-15.html  ← AMENDED: Completion with confidence delta
    /slides/
      prompt-templates-print.html ← Printable template sheet
  build-scorm.sh
```

---

## 3. Local Simulator [UNCHANGED FROM V1]

Carry over exactly from Version 1.0. No changes needed.

---

## 4. SCORM Technical Specification [AMENDED]

### Standard
SCORM 1.2. Use pipwerks SCORM API Wrapper. Do not write from scratch.

### Completion logic [AMENDED]
- `lesson_status` = `"passed"` when learner reaches slide 15 AND has completed all three quiz interactions on slide 11
- `lesson_status` = `"incomplete"` on first launch
- Score = (correct quiz answers / 3) × 100, rounded to integer
- Mastery score remains 60 (2/3 correct)

### Suspend/resume [AMENDED]
Suspend data now includes interaction state for all interactive slides:
```json
{
  "slide": 7,
  "quiz": {
    "q1": { "completed": true, "correct": true, "answer": [0, 2, 1] },
    "q2": { "completed": false, "correct": null, "answer": null },
    "q3": { "completed": false, "rating": null }
  },
  "slide06_completed": true,
  "slide03_position": 42,
  "confidence_open": 7
}
```

### imsmanifest.xml [UNCHANGED FROM V1]
Carry over exactly. masteryscore remains 60.

---

## 5. Global Visual Design Specification [AMENDED]

### CSS Custom Properties — complete token set
Define ALL of the following in `:root {}` in `course.css` before any component styles. No hex values anywhere else in the codebase — only these variable names.

```css
:root {
  /* Brand Core */
  --color-navy:           #1A202C;
  --color-navy-mid:       #2D3748;
  --color-teal:           #38B2AC;
  --color-teal-dark:      #2C9A94;
  --color-teal-light:     #E6FFFA;
  --color-mint:           #B2D8F7;
  --color-mint-dark:      #2BA89C;

  /* RCTF Element Colors — used consistently across all slides */
  --color-role:           #667EEA;
  --color-role-light:     #EBF4FF;
  --color-context:        #38B2AC;
  --color-context-light:  #E6FFFA;
  --color-task:           #ED8936;
  --color-task-light:     #FFFBEB;
  --color-format:         #48BB78;
  --color-format-light:   #F0FFF4;

  /* Neutrals */
  --color-white:          #FFFFFF;
  --color-bg-light:       #F7FAFC;
  --color-bg-mid:         #EDF2F7;
  --color-border:         #E2E8F0;
  --color-border-mid:     #CBD5E0;
  --color-text-heading:   #1A202C;
  --color-text-body:      #4A5568;
  --color-text-light:     #718096;
  --color-text-muted:     #A0AEC0;

  /* Semantic */
  --color-success:        #48BB78;
  --color-success-light:  #F0FFF4;
  --color-success-border: #9AE6B4;
  --color-error:          #FC8181;
  --color-error-light:    #FFF5F5;
  --color-error-border:   #FEB2B2;
  --color-warning:        #F6AD55;
  --color-warning-light:  #FFFBEB;
  --color-warning-border: #F6E05E;

  /* Spacing Scale */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   32px;
  --space-2xl:  48px;
  --space-3xl:  64px;

  /* Border Radius */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-pill: 24px;

  /* Typography */
  --font-heading: 'DM Sans', system-ui, sans-serif;
  --font-body:    'Plus Jakarta Sans', system-ui, sans-serif;

  /* Transitions */
  --transition-fast:   150ms ease;
  --transition-mid:    300ms ease;
  --transition-slow:   500ms ease;
  --transition-flip:   600ms ease;
}
```

### Typography Scale

| Element | Font | Size | Weight | Color | Line Height |
|---|---|---|---|---|---|
| Module title (slide 1) | DM Sans | 40px | 800 | --color-navy | 1.2 |
| Section h2 | DM Sans | 28px | 700 | --color-navy | 1.3 |
| Slide h3 | DM Sans | 22px | 700 | --color-navy | 1.3 |
| Body paragraph | Plus Jakarta Sans | 15px | 400 | --color-text-body | 1.7 |
| Card title | Plus Jakarta Sans | 16px | 700 | --color-navy | 1.4 |
| Card body | Plus Jakarta Sans | 14px | 400 | --color-text-body | 1.6 |
| Caption / label | Plus Jakarta Sans | 12px | 600 | --color-text-light | 1.4 |
| Eyebrow | Plus Jakarta Sans | 11px | 700 | --color-teal | 1.4 |
| Button | Plus Jakarta Sans | 14px | 600 | — | 1 |
| Prompt example | system monospace | 13px | 400 | --color-navy-mid | 1.7 |
| Tag/pill | Plus Jakarta Sans | 11px | 700 | — | 1 |

### Teal heading underline decoration
Apply to key words in h2/h3 headings using a `<span class="accent">` wrapper:
```css
.accent {
  text-decoration: underline;
  text-decoration-color: var(--color-teal);
  text-underline-offset: 5px;
  text-decoration-thickness: 3px;
}
```
Never color heading text — always dark navy. The underline is the only accent.

### Prompt boxes — universal specification
All prompt text throughout the course must use this exact component. Never display prompt text as bare body copy.

```css
.prompt-box {
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--prompt-accent, var(--color-teal));
  border-radius: var(--radius-md);
  padding: var(--space-lg) var(--space-xl);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-navy-mid);
  word-break: break-word;
  overflow-wrap: break-word;
  min-height: 60px;
  box-sizing: border-box;
  width: 100%;
}

.prompt-box.bad {
  --prompt-accent: var(--color-error);
  background: var(--color-error-light);
}

.prompt-box.good {
  --prompt-accent: var(--color-success);
  background: var(--color-success-light);
}

.prompt-box.neutral {
  --prompt-accent: var(--color-teal);
}
```

### Card — universal specification
Every card in the course uses this base. Never deviate from this pattern.

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;          /* Prevents content bleed */
  word-break: break-word;
}

/* Cards in a grid — always use CSS Grid, not Flexbox, for equal heights */
.card-grid {
  display: grid;
  gap: var(--space-lg);
  align-items: stretch;      /* Forces equal height */
}

.card-grid-2 { grid-template-columns: 1fr 1fr; }
.card-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.card-grid-4 { grid-template-columns: 1fr 1fr; } /* 2x2 */

@media (max-width: 768px) {
  .card-grid-2,
  .card-grid-3,
  .card-grid-4 {
    grid-template-columns: 1fr;
  }
}
```

---

## 6. Chrome — Persistent Shell [AMENDED]

The chrome wraps every slide. It must be implemented as a fixed outer layout so slide content NEVER overlaps navigation elements.

### Layout architecture
```css
.course-shell {
  display: grid;
  grid-template-rows: 56px 24px 1fr 64px;
  height: 100vh;
  width: 100%;
  overflow: hidden;          /* Shell itself never scrolls */
}

.course-nav-top    { grid-row: 1; }  /* 56px — top nav bar */
.course-progress   { grid-row: 2; }  /* 24px — progress bar + label */
.course-content    { grid-row: 3; overflow-y: auto; }  /* Scrollable content */
.course-nav-bottom { grid-row: 4; }  /* 64px — prev/next navigation */
```

This grid architecture is mandatory. It prevents content from ever overlapping the navigation bars regardless of slide content length.

### Top nav bar
- Background: `var(--color-navy)`
- Left: Oxygy logo SVG, white fill, height 22px, margin-left 32px
- Right: Module title — "LEVEL 1 — PROMPT ENGINEERING", 11px, `var(--color-text-muted)`, 700 weight, uppercase, letter-spacing 2px, margin-right 32px
- Vertically centered content using `display: flex; align-items: center; justify-content: space-between`

### Progress bar area (24px total height)
```css
.course-progress {
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 12px;
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--color-bg-mid);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-teal);
  border-radius: 3px;
  transition: width 400ms ease;
}

.progress-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
  font-family: var(--font-body);
}
```

### Content area
```css
.course-content {
  background: var(--color-white);
  overflow-y: auto;
  overflow-x: hidden;
}

.slide-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-xl);
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .slide-inner {
    padding: var(--space-lg) var(--space-md);
  }
}
```

### Bottom navigation bar
```css
.course-nav-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
}

.nav-section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-family: var(--font-body);
}
```

### Button styles [AMENDED — explicit sizing]
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 24px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  min-width: 100px;
  box-sizing: border-box;
}

.btn-primary {
  background: var(--color-teal);
  color: var(--color-white);
  border: none;
}
.btn-primary:hover  { background: var(--color-teal-dark); }
.btn-primary:disabled { background: var(--color-text-muted); cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  color: var(--color-navy);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { border-color: var(--color-teal); color: var(--color-teal-dark); }

.btn-small {
  padding: 6px 16px;
  font-size: 12px;
  min-width: 80px;
}
```

---

## 7. Section Eyebrow Component [NEW — universal]

Every slide begins with a section eyebrow. It must be consistent across the course.

```css
.slide-eyebrow {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-teal);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: var(--space-sm);
}

.slide-heading {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1.3;
  margin-bottom: var(--space-lg);
}

.slide-intro {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text-body);
  line-height: 1.7;
  max-width: 640px;
  margin-bottom: var(--space-xl);
}
```

Heading and intro text must NEVER be wider than 640px even if the content area is wider. Use `max-width: 640px` on `.slide-intro` and constrain headings to the same.

---

## 8. Slide-by-Slide Specification

### SLIDE 01 — Welcome / Title [MINOR AMENDMENT]

**What changes from V1:** Layout quality fixes only. No content changes.

**Layout fixes:**
- The three metadata pills must use `display: inline-flex` and must be wrapped in a flex container with `flex-wrap: wrap; gap: 12px; justify-content: center`
- Each pill: `padding: 8px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap`
- The body paragraph must have `max-width: 560px; margin: 0 auto var(--space-xl)`
- The CTA button must be centered with `display: block; margin: 0 auto; width: fit-content`

All content identical to V1.

---

### SLIDE 02 — The Prompting Mindset [MINOR AMENDMENT]

**What changes from V1:** Two-column layout quality fixes.

**Two-column layout fix:**
```css
.slide-two-col {
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: var(--space-xl);
  align-items: start;
}

@media (max-width: 768px) {
  .slide-two-col { grid-template-columns: 1fr; }
}
```

The visual panel (right column) must have:
- `border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-lg); background: var(--color-bg-light)`
- The input→output diagram boxes must each have `min-height: 48px; display: flex; align-items: center; justify-content: center; padding: 12px 16px`

Pull quote: `border-left: 4px solid var(--color-teal); background: var(--color-teal-light); padding: var(--space-md) var(--space-lg); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; margin: var(--space-lg) 0`

All content identical to V1.

---

### SLIDE 03 — Interactive Spectrum Slider [AMENDED — new interaction]

**Previous version:** Static diagram showing the prompting spectrum.
**New version:** Draggable interactive slider that updates a content panel dynamically.

**Purpose of this interaction:** The learner physically moves along the spectrum from Free-Form to Structured. As they drag, the right panel updates to show what technique lives at that point, when to use it, and a mini example. The act of dragging IS the lesson — they are literally choosing their approach.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ EYEBROW + HEADING + INTRO                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  FREE-FORM ←————————●————————————→ STRUCTURED       │
│                      ↑ draggable handle             │
│                                                     │
│  [THREE POSITION LABELS BELOW THE TRACK]            │
│  Brain Dump    Conversational    RCTF / Template    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐     │
│ │  TECHNIQUE PANEL (updates on drag)          │     │
│ │  Technique name + when to use + example     │     │
│ └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Spectrum track:**
```css
.spectrum-container {
  margin: var(--space-xl) 0;
  padding: 0 var(--space-md);
}

.spectrum-track-wrap {
  position: relative;
  padding: 20px 0 40px; /* Space for handle above + labels below */
}

.spectrum-track {
  height: 6px;
  background: linear-gradient(to right, var(--color-mint), var(--color-teal));
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.spectrum-handle {
  width: 24px;
  height: 24px;
  background: var(--color-white);
  border: 3px solid var(--color-teal);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  transition: box-shadow var(--transition-fast);
  z-index: 2;
}
.spectrum-handle:active { cursor: grabbing; box-shadow: 0 0 0 4px var(--color-teal-light); }

.spectrum-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.spectrum-label {
  text-align: center;
  width: 33.33%;
  padding: 0 4px;
  box-sizing: border-box;
}

.spectrum-label-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-navy-mid);
  display: block;
  margin-bottom: 2px;
}

.spectrum-label-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.spectrum-ends {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.spectrum-end-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

**Technique panel:**
```css
.technique-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  background: var(--color-bg-light);
  min-height: 180px;
  transition: opacity 200ms ease;
  box-sizing: border-box;
}

.technique-panel-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-navy);
  margin-bottom: var(--space-sm);
}

.technique-panel-when {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: var(--space-md);
  line-height: 1.5;
}

.technique-panel-example {
  /* Uses .prompt-box styles */
}
```

**Three data states (driven by slider position — 0–33%, 34–66%, 67–100%):**

Position 1 (left, 0–33%): Brain Dump
- Name: "Brain Dump"
- When: "Best when your thinking is unstructured — you have context but haven't formed your request yet. Let the AI find the pattern."
- Example prompt box: *"Okay so I'm preparing for a client meeting next Tuesday, pharma company, they're rolling out a new ERP and the teams are resistant, there was a failed implementation 3 years ago... what should I be thinking about?"*

Position 2 (centre, 34–66%): Conversational
- Name: "Conversational / Iterative"
- When: "Best for exploratory tasks where you want to refine through dialogue. Start with a rough ask and build through follow-up messages."
- Example prompt box: *"Help me think through the structure for a change management workshop. [AI responds] Good — can you make it more specific to a pharma ERP context? [continue iterating...]"*

Position 3 (right, 67–100%): Structured / RCTF
- Name: "Structured / RCTF"
- When: "Best when you need a consistent, repeatable output — especially for tasks your team will run multiple times or share as a template."
- Example prompt box: *"You are a senior change management consultant [Role]. We are 6 weeks into an ERP rollout with resistant commercial teams [Context]. Create a 10-question stakeholder survey [Task]. Output as a numbered list, professional tone [Format]."*

**Interaction logic (spectrum-slider.js):**
- On mousedown on handle: begin drag
- On mousemove: update handle position (clamped to track bounds), update technique panel content with fade (opacity 0 → 1, 150ms)
- On mouseup: snap handle to nearest third position (0%, 50%, 100%) with 200ms transition
- Touch events must also be supported (touchstart, touchmove, touchend)
- Initial position: right third (RCTF) — so the learner drags LEFT to explore the less structured approaches

**Key insight box (below technique panel):**
Background `var(--color-teal-light)`, border `1px solid var(--color-mint)`, border-radius `var(--radius-md)`, padding `var(--space-md) var(--space-lg)`:
"Drag the slider to explore. The best prompters don't live at one end — they move fluidly between approaches depending on the task."

---

### SLIDE 04 — The Brain Dump Approach [MINOR AMENDMENT]

**What changes from V1:** Layout quality fixes only.

Two-column grid fix (same as slide 02). The right panel "example" must be in a bordered container: `border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-lg); background: var(--color-bg-light)`.

The three scenario cards must use `.card-grid .card-grid-2` collapsed to single column on mobile. Each card: `min-height: 80px`.

All content identical to V1.

---

### SLIDE 05 — When Structure Helps [MINOR AMENDMENT]

**What changes from V1:** Three cards must use `.card-grid .card-grid-3`. Each card must have `min-height: 140px`.

Icon containers: `width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-md)`. Icons: Lucide, 24px, `var(--color-teal)`.

All content identical to V1.

---

### SLIDE 06 — RCTF Drag and Drop Deconstruction [AMENDED — new interaction]

**Previous version:** Four static information blocks describing the RCTF elements.
**New version:** An interactive prompt deconstruction exercise where the learner assigns prompt fragments to the correct RCTF elements.

**Purpose:** The learner physically categorises parts of a real prompt, reinforcing that RCTF isn't abstract — it maps to actual words they would write.

**Interaction type:** Drag on desktop, tap-to-assign on mobile (both must work).

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ EYEBROW + HEADING + INTRO                           │
├─────────────────────────────────────────────────────┤
│ INSTRUCTION BAR: "Drag each phrase into the         │
│ correct RCTF element below"                         │
├─────────────────────────────────────────────────────┤
│ DRAGGABLE CHIPS (4 fragments, displayed as pills)   │
│ [Fragment A] [Fragment B] [Fragment C] [Fragment D] │
├─────────────────────────────────────────────────────┤
│ DROP ZONES (2x2 grid)                               │
│ ┌──────────────────┐  ┌──────────────────┐         │
│ │  ROLE            │  │  CONTEXT         │         │
│ │  (drop here)     │  │  (drop here)     │         │
│ └──────────────────┘  └──────────────────┘         │
│ ┌──────────────────┐  ┌──────────────────┐         │
│ │  TASK            │  │  FORMAT          │         │
│ │  (drop here)     │  │  (drop here)     │         │
│ └──────────────────┘  └──────────────────┘         │
├─────────────────────────────────────────────────────┤
│ [CHECK ANSWERS button — disabled until all placed] │
└─────────────────────────────────────────────────────┘
```

**The four prompt fragments (draggable chips):**
These are segments of a single real prompt, broken apart:
- Fragment A: *"You are a senior change management consultant with pharma experience"*
- Fragment B: *"We are 6 weeks into an ERP rollout at a global pharma company. Teams are resistant due to a failed implementation 3 years ago."*
- Fragment C: *"Create a 10-question stakeholder survey to identify root causes of resistance"*
- Fragment D: *"Output as a numbered list, professional tone, no preamble, max 15 words per question"*

**Correct answers:**
- Fragment A → ROLE
- Fragment B → CONTEXT
- Fragment C → TASK
- Fragment D → FORMAT

**Draggable chip styles:**
```css
.drag-chip {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  background: var(--color-white);
  border: 2px solid var(--color-border-mid);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-navy-mid);
  cursor: grab;
  user-select: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  margin: 4px;
  max-width: 100%;
  word-break: break-word;
}
.drag-chip:hover { border-color: var(--color-teal); }
.drag-chip.dragging {
  opacity: 0.5;
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.drag-chip.placed { display: none; } /* Removed from source area when placed */
```

**Drop zone styles:**
```css
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  transition: border-color var(--transition-fast), background var(--transition-fast);
  box-sizing: border-box;
}

.drop-zone-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.drop-zone-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  color: var(--color-white);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Element-specific colors */
.drop-zone[data-zone="role"]    { border-color: var(--color-role);    }
.drop-zone[data-zone="role"] .drop-zone-pill    { background: var(--color-role); }
.drop-zone[data-zone="context"] { border-color: var(--color-context); }
.drop-zone[data-zone="context"] .drop-zone-pill { background: var(--color-context); }
.drop-zone[data-zone="task"]    { border-color: var(--color-task);    }
.drop-zone[data-zone="task"] .drop-zone-pill    { background: var(--color-task); }
.drop-zone[data-zone="format"]  { border-color: var(--color-format);  }
.drop-zone[data-zone="format"] .drop-zone-pill  { background: var(--color-format); }

.drop-zone.drag-over { background: var(--color-teal-light); border-style: solid; }

/* After a correct answer is placed */
.drop-zone.correct { background: var(--color-success-light); border-color: var(--color-success); border-style: solid; }
.drop-zone.incorrect { background: var(--color-error-light); border-color: var(--color-error); border-style: solid; }
```

**Chip source area:**
```css
.chips-source {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-height: 60px;
  margin-bottom: var(--space-lg);
}
```

**Drop zones grid:**
```css
.drop-zones-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (max-width: 768px) {
  .drop-zones-grid { grid-template-columns: 1fr; }
}
```

**Interaction logic (drag-drop.js):**

Desktop (mouse events):
- `dragstart` on chip: set dragging class, store chip ID in dataTransfer
- `dragover` on drop zone: preventDefault (allow drop), add `drag-over` class
- `dragleave` on drop zone: remove `drag-over` class
- `drop` on drop zone: place chip in zone, remove from source, check if all 4 placed → enable Check Answers button

Mobile (touch fallback):
- On tap of a chip in the source area: chip becomes "selected" (highlighted border `var(--color-teal)`, 2px solid)
- On tap of a drop zone while a chip is selected: place chip in that zone
- Allow chips placed in a zone to be tapped and returned to the source (to change an answer)

**Check Answers button:**
- Disabled (grey) until all 4 chips are placed in a zone
- On click: evaluate each placement, apply `.correct` or `.incorrect` to each drop zone
- Correct zones: green background + checkmark icon + brief explanation (13px, `var(--color-text-body)`) appears below the chip inside the zone
- Incorrect zones: red background + X icon + correct label text appears: "This was [ELEMENT]. [Fragment] belongs here because [reason]."
- After checking: a success message appears below the grid if all correct: "Perfect — you've mapped the full RCTF prompt correctly." styled as a success panel (`var(--color-success-light)` bg, `var(--color-success-border)` border)
- Partially correct: "You got [X]/4 correct. Review the highlighted zones and try again?" — a "Reset" button appears to clear all zones and try again
- "Next →" in the bottom nav is ONLY enabled after checking answers (regardless of score)

**Slide 06 summary box (shows AFTER checking answers, before Next):**
Collapsed initially. After checking: fade in a horizontal summary of all four elements with their color-coded pills + one-line descriptions. This replaces the static four-block grid from V1 and serves as the learner's reference going forward.

---

### SLIDE 07 — Card Flip: Role & Context [AMENDED — new interaction]

**Previous version:** Toggle reveal buttons showing before/after prompt comparison.
**New version:** 3D flip cards — learner clicks a card to flip between the "without" and "with" versions.

**Purpose:** The physical flip mirrors the conceptual flip in quality — the learner enacts the transformation.

**Layout:**
```
EYEBROW + HEADING

INSTRUCTION: "Click each card to flip between the prompt — and the AI response it generates"

[FLIP CARD — ROLE]          [FLIP CARD — CONTEXT]
Front: Without Role prompt   Front: Without Context prompt
Back: With Role prompt       Back: With Context prompt
+ AI response preview        + AI response preview

INSIGHT BOX
```

**Flip card CSS:**
```css
.flip-card-wrap {
  perspective: 1000px;
}

.flip-card {
  position: relative;
  width: 100%;
  min-height: 280px;
  transform-style: preserve-3d;
  transition: transform var(--transition-flip);
  cursor: pointer;
}

.flip-card.flipped {
  transform: rotateY(180deg);
}

.flip-card-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 280px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.flip-card-front {
  background: var(--color-bg-light);
}

.flip-card-back {
  background: var(--color-white);
  transform: rotateY(180deg);
}
```

**Grid for two flip cards side by side:**
```css
.flip-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

@media (max-width: 768px) {
  .flip-card-grid { grid-template-columns: 1fr; }
}
```

**Flip card internal content structure:**
Each face has:
- Top: a small status badge — "WITHOUT ROLE" (red pill) or "WITH ROLE" (green pill)
  - `font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-pill)`
  - Without: `background: var(--color-error-light); color: var(--color-error); border: 1px solid var(--color-error-border)`
  - With: `background: var(--color-success-light); color: var(--color-success); border: 1px solid var(--color-success-border)`
- A prompt box (using `.prompt-box` class, `.bad` or `.good` modifier)
- A separator line `1px solid var(--color-border)`, margin 12px 0
- "AI Response Preview" label (11px, muted, uppercase)
- Response preview text (13px, `var(--color-text-body)`, italic, line-height 1.6, max 3 lines, truncated with `...`)
- A "Click to flip ↺" label on the front face only — 11px, `var(--color-text-muted)`, centered at bottom

**Card 1 — ROLE:**
- Front (Without Role):
  - Prompt: *"Write a stakeholder communication about our system migration."*
  - Response preview: *"Here is a stakeholder communication about your system migration: Dear Team, we wanted to update you on the ongoing system migration..."* (truncated)
- Back (With Role):
  - Prompt: *"You are the Head of Internal Communications at a global pharma company with 20,000 employees. Write a stakeholder communication about our ERP migration."*
  - Response preview: *"Subject: An Important Update on Our ERP Transition. Dear Colleagues, I'm writing to you directly because I know this transition touches every one of your workflows..."* (truncated)

**Card 2 — CONTEXT:**
- Front (Without Context):
  - Prompt: *"Help me prepare talking points for a difficult leadership conversation."*
  - Response preview: *"Here are some general talking points for a difficult leadership conversation: 1. Start by acknowledging the other person's perspective..."* (truncated)
- Back (With Context):
  - Prompt: *"Help me prepare talking points for a conversation with a CFO who is sceptical about our change management proposal. She previously approved a failed implementation and is now very risk-averse."*
  - Response preview: *"Given her context, I'd lead with risk mitigation rather than opportunity. Here are five specific talking points: 1. Acknowledge the previous experience directly — don't avoid it..."* (truncated)

**Flip toggle instructions (card-flip.js):**
- Click anywhere on the card → add/remove `.flipped` class
- Clicking one card should NOT affect the other
- Track flip state per card; both cards must have been flipped at least once before the insight box below fully appears (fade in on second flip)

**Insight box:**
`background: var(--color-teal-light); border: 1px solid var(--color-mint); border-radius: var(--radius-md); padding: var(--space-md) var(--space-lg)`
Text: "The same task. Completely different outputs. Role and Context don't constrain the AI — they give it the information it needs to think like someone relevant to your situation."

---

### SLIDE 08 — Task & Format Deep Dive [MINOR AMENDMENT]

**What changes from V1:** Layout quality only. Two-column panels use the same grid fix as slides 02 and 04.

**Panel structure:**
Each panel (Task / Format) must be wrapped in:
```css
.content-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  background: var(--color-white);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}
```

Format tag grid — wrap all format option tags in:
```css
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.format-tag {
  padding: 6px 14px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-body);
  white-space: nowrap;
}
```

All content identical to V1.

---

### SLIDE 09 — Chain of Thought [MINOR AMENDMENT]

**What changes from V1:** The three-step visual and before/after comparison get layout fixes.

Three-step visual must use:
```css
.steps-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin: var(--space-xl) 0;
}

.step-item {
  flex: 1;
  text-align: center;
  padding: var(--space-md);
}

.step-connector {
  width: 32px;
  flex-shrink: 0;
  padding-top: 28px;
  color: var(--color-text-muted);
  text-align: center;
  font-size: 18px;
}

@media (max-width: 768px) {
  .steps-row { flex-direction: column; }
  .step-connector { display: none; }
}
```

Before/after boxes: wrap in a grid `grid-template-columns: 1fr 1fr; gap: var(--space-lg)`. Each box uses `.prompt-box` class. On mobile: single column.

All content identical to V1.

---

### SLIDE 10 — Flippable Technique Cards [AMENDED — new interaction]

**Previous version:** Four static information cards in a 2×2 grid.
**New version:** Four flippable cards using the same CSS flip mechanism as slide 07.

**Purpose:** Each card front shows the technique name and a one-line hook. Flipping reveals when to use it + a concrete mini-example. Learner controls the pace of discovery.

**Layout:** 2×2 grid using `.card-grid .card-grid-4`.

**Flip card dimensions:**
Each flip card: `min-height: 220px`. Both front and back faces: `min-height: 220px; padding: var(--space-lg); box-sizing: border-box`.

**Card content — FRONT face (all four cards):**
- Element number badge: `1`, `2`, `3`, `4` — 20px circle, `var(--color-navy)` bg, white text, positioned top-right
- Lucide icon (24px, `var(--color-teal)`): RefreshCw, Copy, Slash, Layers respectively
- Technique name (16px, 700, `var(--color-navy)`)
- One-line hook (13px, `var(--color-text-light)`)
- Bottom: "Click to explore ↺" — 11px, `var(--color-text-muted)`, centered

**Card content — BACK face (all four cards):**
- "WHEN TO USE" label — eyebrow style
- When to use text (13px, `var(--color-text-body)`, line-height 1.5)
- Separator
- "EXAMPLE" label — eyebrow style
- Mini prompt example in a `.prompt-box.neutral` (font-size 12px)

**Card 1: Few-Shot Prompting**
- Front hook: "Give examples — the AI matches the pattern"
- Back when: "When you have a very specific output format that's easier to show than describe. Most effective for writing tasks with a strong house style."
- Back example: *"Here are two examples of how we write client emails: [Ex1] [Ex2]. Now write one for [new scenario] using the same tone."*

**Card 2: Iterative Prompting**
- Front hook: "Refine through conversation, not one-shot requests"
- Back when: "For complex outputs that need multiple rounds — reports, strategies, frameworks. Treat each response as a draft, not a deliverable."
- Back example: *"Good first draft. Now make the executive summary 30% shorter and replace all jargon with plain language. Keep everything else identical."*

**Card 3: Constraint Prompting**
- Front hook: "Tell it what NOT to do — often more powerful"
- Back when: "When AI outputs consistently include something unwanted. Negative constraints are frequently more effective than positive instructions alone."
- Back example: *"Do not use jargon. Do not start with 'As an AI'. Do not add disclaimers. Do not include a preamble — begin with the first point directly."*

**Card 4: Persona Stacking**
- Front hook: "Assign multiple roles to stress-test ideas"
- Back when: "For balanced analysis or simulating stakeholder reactions. Ask the AI to evaluate its own output from a different perspective."
- Back example: *"You just wrote this proposal as a consultant. Now review it as a sceptical CFO and identify the three weakest points in the business case."*

**"Flip all" button:**
Below the grid: a secondary button "Explore all techniques ↺" — clicking flips all four cards simultaneously. After all have been manually or programmatically flipped, the button text changes to "Reset cards". The Next button is enabled after all 4 cards have been flipped at least once.

---

### SLIDE 11 — Three-Format Quiz [AMENDED — all three question types new]

**Previous version:** Three multiple choice questions in sequence.
**New version:** Three distinct question formats, one per question.

**Quiz engine (quiz-engine.js):**
- Tracks: currentQuestion (1, 2, or 3), answers, correctness for all three
- Renders one question at a time with animated transition between questions
- Progress indicator: "Question 1 of 3" — displayed above question, styled as eyebrow
- "Check Answer" button is separate from "Next Question" button
- Next Question only appears after Check Answer is clicked
- Next → in bottom nav is disabled until all three questions are completed

---

**Question 1: Drag and Drop Sorting**

**Type:** Categorisation drag and drop — learner drags prompt element chips into one of three technique buckets.

**Question text:** "Sort these prompting approaches into the correct categories. Drag each card to where it belongs."

**Five chips to sort:**
- "Say everything you know about the problem before asking" → Brain Dump
- "Assign the AI a specific professional role" → RCTF
- "Ask the AI to think step by step before concluding" → Chain of Thought
- "Give 2-3 examples of the output you want first" → Other Technique (Few-Shot)
- "Specify exactly how to format the response" → RCTF

**Three buckets:**
- "Brain Dump"
- "RCTF Framework"
- "Other Technique"

**Correct mappings:**
- "Say everything..." → Brain Dump ✓
- "Assign the AI a role" → RCTF ✓
- "Think step by step" → Other Technique (Chain of Thought) ✓
- "Give 2-3 examples" → Other Technique (Few-Shot) ✓
- "Specify format" → RCTF ✓

**Bucket styles:** Same `.drop-zone` CSS from slide 06 but with three zones in a horizontal row on desktop, stacked on mobile. Each bucket min-height: 120px to accommodate multiple chips.

**Feedback:** On Check Answer — each correctly placed chip gets a green border. Incorrectly placed chips get a red border and a tooltip showing the correct bucket. A score summary appears: "You got X/5 correct."

---

**Question 2: Hotspot on a Visual**

**Type:** Learner clicks a region of a visual to answer a question.

**Question text:** "Look at this AI conversation. Click the moment where the user's prompt is weakest — where adding more information would have made the biggest difference."

**The visual:** A rendered "chat interface" mockup — styled as a simple chat UI with alternating user/AI message bubbles. Four regions are visually distinct and labelled A, B, C, D as clickable hotspot overlays.

```
┌─────────────────────────────────────────────────────┐
│ USER: Help me write something for the client.       │ ← HOTSPOT A
├─────────────────────────────────────────────────────┤
│ AI: I'd be happy to help! Could you tell me more   │
│ about what you need to write and who the client is? │
├─────────────────────────────────────────────────────┤
│ USER: It's a proposal. The usual format.            │ ← HOTSPOT B (CORRECT)
├─────────────────────────────────────────────────────┤
│ AI: Here is a standard proposal structure:          │
│ Executive Summary, Background, Proposed Solution... │
├─────────────────────────────────────────────────────┤
│ USER: Make it shorter.                              │ ← HOTSPOT C
├─────────────────────────────────────────────────────┤
│ AI: Here is a condensed version...                  │
├─────────────────────────────────────────────────────┤
│ USER: Thanks, this works.                           │ ← HOTSPOT D
└─────────────────────────────────────────────────────┘
```

**Correct answer:** Hotspot B — "It's a proposal. The usual format."

**Explanation:** "This is where the conversation went wrong. 'The usual format' means nothing to the AI — it has no access to your team's conventions. Specifying client name, industry, proposal type, length, and tone here would have transformed the output."

**Hotspot styling:**
```css
.chat-mockup {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin: var(--space-lg) 0;
}

.chat-message {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-body);
  position: relative;
}

.chat-message.user-msg {
  background: var(--color-bg-light);
}

.chat-message.ai-msg {
  background: var(--color-white);
}

.hotspot-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  cursor: pointer;
  z-index: 2;
  transition: background var(--transition-fast);
}
.hotspot-overlay:hover { background: rgba(56, 178, 172, 0.08); }

.hotspot-label {
  position: absolute;
  top: 50%;
  right: var(--space-md);
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-navy);
  color: var(--color-white);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hotspot-overlay.selected { background: rgba(56, 178, 172, 0.15); }
.hotspot-overlay.correct  { background: rgba(72, 187, 120, 0.15); }
.hotspot-overlay.incorrect { background: rgba(252, 129, 129, 0.10); }
```

After selecting a hotspot and clicking Check Answer: correct region gets green background tint + checkmark, incorrect regions get explanation text appended below the chat mockup.

---

**Question 3: Confidence Slider**

**Type:** Learner rates their confidence before answering, then sees a before/after delta on slide 15.

**Question text:** "Before answering — how confident are you right now in your ability to write a strong, structured prompt for a real work task?"

**Slider component:**
```css
.confidence-slider-wrap {
  margin: var(--space-xl) 0;
}

.confidence-scale {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.confidence-scale span {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 600;
}

input[type="range"].confidence-input {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  appearance: none;
  background: linear-gradient(
    to right,
    var(--color-teal) 0%,
    var(--color-teal) var(--fill-percent, 50%),
    var(--color-bg-mid) var(--fill-percent, 50%),
    var(--color-bg-mid) 100%
  );
  outline: none;
  cursor: pointer;
}

input[type="range"].confidence-input::-webkit-slider-thumb {
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-white);
  border: 3px solid var(--color-teal);
  cursor: pointer;
}

.confidence-value-display {
  text-align: center;
  font-size: 32px;
  font-weight: 800;
  color: var(--color-navy);
  margin: var(--space-md) 0;
  font-family: var(--font-heading);
}

.confidence-label-display {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-light);
}
```

Range: 1–10. Initial value: 5.
Labels at 1: "Not confident at all", at 5: "Somewhat confident", at 10: "Very confident"

As learner drags the slider the large number in the center updates in real time.

Below slider: a standard multiple choice question:
"Which of the following would most improve a weak prompt?"

Options:
- A) Making it longer and more detailed ← incorrect (length ≠ quality)
- B) Adding a clear Role, specific Context, and defined Format ✓
- C) Using more formal language
- D) Breaking it into multiple separate messages

Correct answer: B. Explanation: "Length doesn't make a prompt better — specificity does. Role, Context, and Format are the three elements most often missing from prompts that produce disappointing results."

Store confidence rating in quiz state. After Check Answer, confirm: "Your confidence rating has been saved. We'll show you how it's changed by the end of the module."

**SCORM suspend_data update:** Store `confidence_open: [rating value]` on completion of Q3.

---

### SLIDE 12 — Animated Diff Comparison [AMENDED]

**Previous version:** Three tabs showing the same task approached three different ways.
**New version:** Three tabs with animated diff-style highlighting showing exactly what changes between approaches.

**Tab component [AMENDED]:**
```css
.tab-bar {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-lg);
  gap: 0;
}

.tab-btn {
  padding: 10px 20px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-light);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: -2px;
  white-space: nowrap;
}

.tab-btn:hover { color: var(--color-navy); }
.tab-btn.active { color: var(--color-teal); border-bottom-color: var(--color-teal); }
```

**Tab panels:** Each panel fades in (opacity 0→1, 200ms) on tab switch. Panel content wraps in:
```css
.tab-panel {
  display: none;
  animation: fadeIn 200ms ease;
}
.tab-panel.active { display: block; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
```

**Diff highlighting:**
Words or phrases that are NEW in a given approach (compared to the previous tab) are wrapped in:
```css
.diff-add {
  background: rgba(72, 187, 120, 0.2);
  border-bottom: 2px solid var(--color-success);
  border-radius: 2px;
  padding: 0 2px;
}
```

This applies inside the `.prompt-box` content for tabs 2 and 3 — showing exactly what was added versus the previous approach.

**Scenario context box:**
```css
.scenario-box {
  background: var(--color-navy);
  color: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}
.scenario-box strong { color: var(--color-mint); }
```

All three tab content items identical to V1. Diff highlighting added to tabs 2 and 3.

**Annotation beneath each prompt box:**
```css
.prompt-annotation {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-light);
  line-height: 1.5;
}
```

---

### SLIDE 13 — Branching Consequence Scenario [AMENDED]

**Previous version:** Three option cards, text-based feedback after selection.
**New version:** After selecting an approach and confirming, a realistic "AI response" is rendered showing what that prompt would actually produce.

**Layout:**
```
SCENARIO BOX

THREE OPTION CARDS (select one)

[CONFIRM button — appears after selection]

↓ After confirming:

AI RESPONSE PANEL
(Shows the simulated output of that prompt)

REFLECTION TEXT
```

**Option card styles [AMENDED]:**
```css
.option-card {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: var(--space-md);
  background: var(--color-white);
  box-sizing: border-box;
  width: 100%;
}

.option-card:hover { border-color: var(--color-teal); background: var(--color-teal-light); }
.option-card.selected { border-color: var(--color-teal); background: var(--color-teal-light); }
.option-card.correct  { border-color: var(--color-success); background: var(--color-success-light); }
.option-card.incorrect { border-color: var(--color-error); background: var(--color-error-light); }
```

**Confirm button:** Secondary style. Appears below the three cards (fade in, 200ms) after an option is selected. On click: the selected card gets `.correct` or `.incorrect` class, then the AI Response Panel fades in below.

**AI Response Panel:**
```css
.ai-response-panel {
  margin-top: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  animation: fadeIn 400ms ease;
}

.ai-response-header {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.ai-response-body {
  padding: var(--space-lg);
  font-size: 14px;
  color: var(--color-text-body);
  line-height: 1.7;
}
```

**The three simulated AI responses (pre-written):**

Option A (weak prompt — just adds context):
- Response panel header: "AI RESPONSE TO OPTION A — What this prompt actually produces"
- Badge: "Partially improved" (orange)
- Response body: *"Here are some points to consider for your client meeting: 1. Review the client's current situation and pain points 2. Prepare an agenda for the 2-hour session 3. Consider stakeholder engagement approaches 4. Have clear next steps ready. Would you like me to expand on any of these areas?"*
- Reflection text: "Better than the original, but still generic. The AI doesn't know who the client is, what the real challenge is, or what format you need. It's responding with a framework, not a plan."

Option B (full RCTF — correct answer):
- Response panel header: "AI RESPONSE TO OPTION B — What this prompt actually produces"
- Badge: "Strong output" (green)
- Response body: *"**Workshop Structure — Leadership Alignment on LMS Adoption**\n\n**Objective:** Surface and address root causes of resistance from a position of honest dialogue rather than change management orthodoxy.\n\n**Agenda (2 hours):**\n1. Open honestly (15 min): Acknowledge the three previous tech failures. Name the fear in the room. This earns trust.\n2. Diagnostic exercise (30 min): Small group activity — what specifically failed before and why? Separate technology failure from change management failure.\n3. This time is different (25 min): Present the differences in implementation approach. Invite challenge.\n4. Commitment building (30 min): What would each leader need to see in the first 30 days to believe this is working?\n5. Close with actions (20 min): Named owners, specific commitments, review date."*
- Reflection text: "This is immediately usable. The AI understood the client context, the history of failure, and the workshop objective — and produced a structured, specific output with named activities and timings."

Option C (Chain of Thought only, no context):
- Response panel header: "AI RESPONSE TO OPTION C — What this prompt actually produces"
- Badge: "Reasonable but incomplete" (orange)
- Response body: *"Let me think through this step by step. Step 1 — What makes leadership alignment workshops succeed: Psychological safety, shared diagnosis of the problem, clear decision rights... Step 2 — Common failure modes: Rushing to solutions, underestimating resistance, not naming the real issue... Step 3 — Recommendation: I would structure this around diagnosis before prescription. However, I'd need to know more about your client context to be specific — what industry, what's the history, who are the key stakeholders?"*
- Reflection text: "The reasoning is strong — but the AI correctly flagged that it doesn't have enough context. Chain of Thought without context produces thoughtful generalities. Combining it with context would produce something far more specific and actionable."

---

### SLIDE 14 — Prompt Starter Kit + Builder [AMENDED]

**Previous version:** Five static template cards with copy button.
**New version:** Five templates PLUS a build-your-own prompt assembler at the bottom.

**Template cards [AMENDED layout fixes]:**
Each card must use:
```css
.template-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-lg);
  background: var(--color-white);
}

.template-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-light);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.template-card-body {
  padding: var(--space-lg);
}

.template-tag {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  flex-shrink: 0;
}
```

The copy button must always be in the card header, right-aligned. Never floating or absolutely positioned:
```css
.copy-btn {
  /* Uses .btn .btn-secondary .btn-small */
  flex-shrink: 0;
}
.copy-btn.copied {
  border-color: var(--color-success);
  color: var(--color-success);
}
```

Copy button click: copies template text to clipboard, changes label to "Copied ✓" for 2000ms, reverts.

All five template contents identical to V1.

**NEW: Build-Your-Own Prompt Assembler**

Below the five templates, a clearly separated section with a top border and a heading:
"Build your own template — 30 seconds"

```css
.builder-section {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 2px solid var(--color-border);
}

.builder-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (max-width: 768px) {
  .builder-controls { grid-template-columns: 1fr; }
}

.builder-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-navy);
  background: var(--color-white);
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron-down SVG */
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
  box-sizing: border-box;
}

.builder-select:focus { outline: 2px solid var(--color-teal); outline-offset: 2px; }

.builder-context {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-navy);
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
}

.builder-output {
  display: none; /* Shown after Generate is clicked */
  animation: fadeIn 300ms ease;
}
.builder-output.visible { display: block; }
```

**Three dropdowns:**
1. Technique: Brain Dump / RCTF / Chain of Thought / Few-Shot / Iterative
2. Use Case: Client Meeting Prep / Research Summary / Stakeholder Email / Workshop Design / Proposal Draft / Data Analysis Request
3. Output Format: Bullet Points / Numbered List / Structured Report / Executive Summary / Table

**Context textarea:** Placeholder: "Add any specific context about your situation (optional — but makes the template much more relevant)"

**Generate Template button:** Primary style. On click: assembles a template from the selections using pre-defined logic (no API), displays result in a `.prompt-box.neutral` in the `.builder-output` area with a copy button.

**Assembly logic (JavaScript template strings — no API required):**
The output combines the selected elements into a coherent prompt template. Example logic:
- If Technique = RCTF + Use Case = Client Meeting Prep + Format = Bullet Points → assemble the RCTF meeting prep template with bullet format specified
- The context textarea content is inserted into the [Context] slot if provided

---

### SLIDE 15 — Completion with Confidence Delta [AMENDED]

**Previous version:** Standard completion screen.
**New version:** Same completion content PLUS a confidence before/after comparison using the Q3 slider rating from slide 11.

**Layout additions:**

After the "What you've learned" summary, insert a **confidence delta panel:**

```css
.confidence-delta-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin: var(--space-xl) 0;
  background: var(--color-bg-light);
}

.confidence-delta-header {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--space-lg);
  font-family: var(--font-body);
}

.confidence-delta-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.confidence-score-box {
  text-align: center;
  min-width: 80px;
}

.confidence-score-num {
  font-size: 40px;
  font-weight: 800;
  color: var(--color-navy);
  font-family: var(--font-heading);
  line-height: 1;
}

.confidence-score-label {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-top: 4px;
}

.confidence-arrow {
  font-size: 24px;
  color: var(--color-teal);
}

.confidence-delta-message {
  font-size: 14px;
  color: var(--color-text-body);
  line-height: 1.6;
  margin-top: var(--space-md);
}
```

**Closing confidence prompt:**
Below the delta panel, ask the learner to rate their confidence NOW using a second identical slider (1–10). On submission:
- If close-open ≥ 2: message in success panel: "Your confidence grew by [X] points. That's the foundation building."
- If close-open = 1: "Even a small shift in confidence matters. Keep using these techniques and it will compound."
- If close-open ≤ 0: "Confidence sometimes dips when you realise how much there is to learn. That's a sign you're thinking more carefully — which is exactly right."

Store closing confidence in suspend_data: `confidence_close: [value]`.

SCORM completion trigger: `lesson_status = "passed"` fires when slide 15 renders and closing confidence has been submitted.

All other V1 completion screen content (heading, takeaway quote, CTA cards, Oxygy footer) carries over unchanged with layout quality fixes applied.

---

## 9. Interactions & Animations — Complete Reference [AMENDED]

### Global rules [UNCHANGED]
All slide transitions: opacity fade 300ms ease.
Content: staggered fade-up (translateY 20px→0, opacity 0→1, 400ms ease, 80ms sibling stagger).
Button hovers: 150ms ease all.

### All interactive elements

| Slide | Element | Interaction | Behaviour |
|---|---|---|---|
| All | Next button | Click | Advance slide, scroll content to top |
| All | Previous button | Click | Previous slide |
| All | Progress bar | Slide change | Width animates 400ms |
| 03 | Spectrum handle | Drag/touch | Move along track, update panel 150ms fade |
| 03 | Spectrum handle | Release | Snap to nearest third, 200ms transition |
| 06 | Drag chips | Drag / tap | Move to drop zone, highlight on hover |
| 06 | Drop zones | Drop | Accept chip, remove drag-over state |
| 06 | Check Answers | Click | Evaluate placements, show feedback |
| 06 | Reset | Click | Return all chips to source, clear zones |
| 07 | Flip card | Click | rotateY 180deg, 600ms transition |
| 07 | "Flip all" | Click | All cards flip simultaneously |
| 10 | Flip cards (x4) | Click | rotateY 180deg per card, independent |
| 10 | "Explore all" | Click | Flip all four simultaneously |
| 11 Q1 | Drag chips | Drag/tap | Sort into three buckets |
| 11 Q1 | Check Answer | Click | Evaluate, show per-chip feedback |
| 11 Q2 | Hotspot | Click | Select region, highlight |
| 11 Q2 | Check Answer | Click | Reveal correct region + explanation |
| 11 Q3 | Confidence slider | Drag | Update displayed number, fill track |
| 11 Q3 | Check Answer | Click | Evaluate MCQ, save confidence rating |
| 12 | Tab buttons | Click | Switch panel, 200ms fade |
| 13 | Option cards | Click | Select (border + bg change) |
| 13 | Confirm button | Click (appears after selection) | Evaluate, show AI response panel |
| 14 | Copy buttons | Click | Clipboard copy, "Copied ✓" for 2s |
| 14 | Builder dropdowns | Change | Update selections |
| 14 | Generate button | Click | Assemble and display template |
| 15 | Closing confidence | Drag + submit | Calculate delta, display comparison |

### Keyboard navigation [UNCHANGED FROM V1]
Tab/Enter/Space for all interactive elements. Focus ring: `2px solid var(--color-teal); outline-offset: 2px` on all interactive elements.

---

## 10. Responsive Behaviour [AMENDED]

### Desktop (1200px+)
Grid shell: `grid-template-rows: 56px 24px 1fr 64px`
Content max-width: 800px
Two-column slides: `grid-template-columns: 55fr 45fr`
Four-block grids: `grid-template-columns: 1fr 1fr`
Three-column rows: `grid-template-columns: 1fr 1fr 1fr`

### Tablet (768–1199px)
Content max-width: 680px, padding 32px 24px
Two-column slides: single column (visual below text)
Four-block grids: `grid-template-columns: 1fr 1fr` if ≥900px, else single column
Three-column rows: two columns
Flip cards: remain side by side down to 600px

### Mobile (<768px)
Content padding: 24px 16px
ALL multi-column layouts: single column, no exceptions
Shell rows: `56px 20px 1fr 56px` (bottom nav slightly shorter)
Bottom nav: Previous = icon only (←), Next = text maintained
Progress label: hidden, track remains
Prompt boxes: 13px font
Drag and drop: tap-to-select mode (tap chip, tap bucket)
Quiz options: min-height 52px tap targets
Spectrum: works with touch events
Flip cards: full width, stacked

---

## 11. Content Data Reference [UNCHANGED FROM V1]

All pharma/consulting scenario content identical to V1. No content changes in this version — only interaction and layout amendments.

---

## 12. Developer Notes [AMENDED]

### JavaScript module architecture
Separate JS files as listed in the file structure. Load order in index.html:
1. `scorm-api.js` (or `scorm-simulator.js` for local)
2. `drag-drop.js`
3. `card-flip.js`
4. `spectrum-slider.js`
5. `quiz-engine.js`
6. `course.js` (main controller — loads last, depends on all others)

### CSS loading order
1. Google Fonts `<link>` (in `<head>`)
2. `course.css` (tokens + base + chrome + typography + cards + buttons)
3. `interactions.css` (flip cards, drag/drop, spectrum, quiz-specific styles)

Never mix interaction styles into course.css — keep them isolated in interactions.css for easier debugging.

### Drag and drop implementation
Use the HTML5 Drag and Drop API for desktop. For touch support, implement a manual touch event handler that:
- Tracks `touchstart`, `touchmove`, `touchend`
- Calculates element position under touch point using `document.elementFromPoint()`
- Applies the same drop logic as the mouse event handler

Do not use a third-party drag and drop library — keep the package self-contained.

### Card flip — iOS Safari fix
iOS Safari has a known bug with `backface-visibility`. Apply both the standard and webkit-prefixed version:
```css
.flip-card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

Also add `-webkit-transform-style: preserve-3d` to `.flip-card`.

### Confidence delta storage
The opening confidence rating (Q3 on slide 11) must be stored in the course's state object immediately on submission and included in every subsequent `cmi.suspend_data` serialisation. The closing confidence slider on slide 15 reads this stored value to calculate the delta. If the stored value is null (learner skipped quiz somehow), show the closing slider only with no delta comparison.

### Build script [UNCHANGED FROM V1]
Same as V1. ZIP excludes: `index-local.html`, `scorm-simulator.js`, `vercel.json`.

### Browser compatibility [UNCHANGED FROM V1]
Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.

### Accessibility additions for new interactions
- Drag and drop: provide a keyboard alternative for every drag interaction. When a chip is focused and the user presses Enter/Space, enter "placement mode" — arrow keys move through available zones, Enter confirms placement
- Flip cards: pressing Enter/Space on a focused card must trigger the flip
- Spectrum slider: must respond to arrow keys when focused (left/right in 10% increments)
- Hotspot: all hotspot regions must be keyboard-focusable with Tab, activated with Enter
- All new animations must respect `prefers-reduced-motion` media query — if set, remove all transitions and animations, show states instantly

```css
@media (prefers-reduced-motion: reduce) {
  .flip-card { transition: none; }
  .spectrum-handle { transition: none; }
  .tab-panel { animation: none; }
  .ai-response-panel { animation: none; }
  /* etc. */
}
```

---

*End of PRD — Version 2.0*
*Supersedes Version 1.0 in full*
*Prepared for handoff to Claude Code*
*Repository location: `/scorm/level-1-prompt-engineering/`*
