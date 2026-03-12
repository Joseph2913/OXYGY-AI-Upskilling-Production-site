# SKILL: E-Learning Page — Oxygy AI Upskilling Site

## When to apply this skill

Apply this skill in full whenever the user asks you to:
- Create a new e-learning page for any level of the Oxygy AI Upskilling Framework
- Add a new learning module, slide deck, or learning journey page to the site
- Update or extend an existing e-learning page
- Build any page that hosts slide-based learning content on this project

Do NOT deviate from these specifications. Every e-learning page on this site must use this exact template. Brand consistency and structural consistency across levels is a core project requirement.

---

## 1. What You Are Building

Each e-learning page is a **self-contained learning journey page** for one level of the Oxygy AI Upskilling Framework. It is not a standalone SCORM file — it is a native React page embedded within the main Oxygy website.

Every page has three zones stacked vertically:
1. **Page Hero** — level identity, title, description, metadata, progress summary
2. **Active Phase Content** — the currently active learning activity (full width)
3. **Journey Strip** — horizontal progress tracker showing all phases

The page hosts up to three sequential learning phases:
- **Phase 1: E-Learning** — an interactive slide deck (always first)
- **Phase 2: Read** — curated articles with reflection prompts
- **Phase 3: Watch** — curated videos with knowledge check quizzes
- **Handoff CTA** — redirects to the Prompt Playground or next activity (not hosted on this page)

Phases unlock sequentially. Completing Phase 1 advances to Phase 2. Completing Phase 2 advances to Phase 3. Completing Phase 3 triggers the handoff CTA. The Journey Strip is always visible and shows completion state across all phases.

---

## 2. Content Design Philosophy

This section governs the pedagogical tone, narrative structure, and content authoring standards for every e-learning slide deck built with this skill. These principles apply to all levels and all topics.

### 2.1 Core Principles

**Principle 1: Relevance Is Earned Through Evidence, Not Assumed Through Scenario.**
The opening of every module must establish *why this topic matters* using objective, verifiable evidence — not by assuming the learner has had a negative experience. A compelling statistic about the learner's profession is as engaging as a personal scenario, often more so, because data is objective and non-judgmental. Relevance can be established through industry research, adoption metrics, output quality data, or observable demonstrations that reveal a gap the learner hadn't considered.

**Principle 2: Gaps Are Opportunities, Not Failures.**
Content must frame knowledge gaps as opportunities for growth, never as personal shortcomings. The learner is a capable professional who hasn't been shown this technique yet — not someone who has been doing things wrong. Across all content, avoid language that implies blame, shame, or inadequacy. The learner chose to take this module — respect that choice by treating them as someone investing in growth, not someone being corrected.

**Principle 3: Every Slide Earns Its Place.**
No filler slides. Every slide must teach, test, or transition. If a slide doesn't change what the learner knows, believes, or can do, it doesn't belong in the deck.

**Principle 4: Show, Don't Lecture.**
Wherever possible, demonstrate the concept through interactive elements, side-by-side comparisons, or worked examples rather than paragraphs of explanation. The learner should *see* the difference a technique makes, not just read about it.

**Principle 5: Every Slide Has a Contrast Moment — But Never a Strawman.**
The most effective teaching tool is contrast: showing what happens with and without a technique. However, **never position a single framework or technique as the universally correct approach.** When teaching a framework (e.g., the Prompt Blueprint / RCTF), present it as one effective tool in a broader toolkit, not the default answer for every situation. Before/after comparisons must show genuine attempts on both sides — the difference is in technique, not effort. Any decision framework or heuristic must acknowledge that the right approach depends on the situation: the task, the stakes, the time available, and whether the output needs to be repeatable. Prefer "effective technique" or "recommended approach for [specific situation]" over "best practice."

### 2.2 Five-Beat Narrative Arc

Every e-learning slide deck follows a five-beat story structure. The beats create narrative momentum — the learner should feel pulled forward, not lectured at.

**Beat 1 — SITUATION (Evidence-Led Opening)**
Establish why this topic matters using real data, industry research, or verifiable metrics. The tone is opportunity and insight, not failure and frustration. The learner should feel "I didn't know that — tell me more," not "I've been doing this wrong."

Acceptable Beat 1 openings:
- Industry statistics that reveal a gap between adoption and skill (e.g., usage rates vs. training rates)
- Research findings that quantify the impact of the skill being taught (e.g., output quality variance attributable to prompt structure)
- Observable parallel demonstrations showing two approaches to the same task with visibly different results — framed as curiosity, not judgment

Unacceptable Beat 1 openings:
- "You failed at this task" framings
- Scenarios that assume the learner has had a negative experience
- Dramatic or exaggerated frustration moments (e.g., "The AI gives you something an intern would be embarrassed to submit")
- Any framing that positions the learner as having done something wrong

**Beat 2 — TENSION (The Knowledge Gap)**
Name what's missing or unknown — not what's broken or wrong. The tension is a knowledge gap, not a performance failure. Frame the gap as something most people haven't been shown, not something they've been getting wrong. Replace language like "here's what's broken" with "here's what most people haven't been shown."

**Beat 3 — CONCEPT (The Framework)**
Introduce the core framework or technique. When presenting a structured framework, the same beat must also introduce the alternative approaches and the situational judgment for choosing between them. The learner should understand *when* to use this technique, not just *how*. Avoid implying that the framework is the only valid approach.

**Beat 4 — CONTRAST (Technique in Action)**
Show the technique applied versus not applied. Frame the "before" state as "without this technique" rather than "the wrong way." The before state is neutral — it's simply what happens when the technique hasn't been applied yet. Both states should represent genuine attempts — the difference is in technique, not effort. Avoid strawmanning the before state with deliberately weak examples.

**Beat 5 — BRIDGE (From Theory to Practice)**
Connect the module's concepts to the learner's real work. Provide templates, decision aids, or next-step prompts that help the learner apply what they've learned immediately. This beat transitions into the Read and Watch phases.

### 2.3 Tool-Agnostic Framing

All e-learning content must be tool-agnostic. Do not reference specific AI tools (ChatGPT, Claude, Copilot, Gemini) in scenario setups, prompt demonstrations, or teaching content. Instead, use neutral framing like "your AI tool," "the AI," or "any large language model."

Rationale: Learners will be using different tools depending on their organisation's approved software. The skills taught (prompting, context engineering, workflow design) are transferable across all tools. Anchoring examples to a specific tool creates an unnecessary barrier for learners whose organisation uses a different one.

Exceptions:
- Tool-specific features can be referenced in Beat 5 (Bridge) when pointing learners to specific practice activities
- Tool-specific interface elements (e.g., "Projects" in Claude, "Custom GPTs" in ChatGPT) can be referenced in Levels 2+ where the learning objective is specifically about that tool's capabilities
- The Prompt Playground and other Oxygy platform tools are not subject to this rule — they are internal tools, not third-party AI products

### 2.4 Audience Universality Rule

Every scenario, example, prompt demonstration, and exercise must resonate across roles, functions, seniority levels, and organisational contexts. This is mandatory — not aspirational.

- Scenarios must describe tasks that every knowledge worker performs: preparing for meetings, summarising information, drafting communications, synthesising inputs from multiple sources, structuring a recommendation, creating a first draft of a document, reviewing and improving existing content.
- Never anchor a scenario to a specific function (e.g., "as a consultant preparing a client debrief" or "as an HR lead designing an onboarding programme") unless the exercise explicitly asks the learner to choose their own role.
- Never name specific job titles in scenario setups. Use "you" and describe the task, not the role.
- When parallel demonstrations are used (showing two approaches to the same task), the task itself must be one that any professional in any team could face.
- Interactive exercises (branching scenarios, situational judgment, drag-and-drop) must use prompts and tasks drawn from universally recognisable professional situations — not function-specific workflows.
- If a slide references an industry (e.g., pharma, professional services), it must be in a context that any professional in that industry would recognise, not a context specific to one department.

This rule applies to: Beat 1 scenario setups, Beat 3 worked examples, Beat 4 contrast scenarios, Beat 5 interactive exercises, and any prompt text shown on screen.

---

## 3. Brand & Visual Tokens

These are the only values to use. Never introduce new colours, fonts, or spacing values not listed here.

### Colours
```js
const C = {
  navy:          "#1A202C",  // headings, nav bg, primary text
  navyMid:       "#2D3748",  // secondary headings, diagram elements
  teal:          "#38B2AC",  // primary CTA, progress bar, active state, eyebrows
  tealDark:      "#2C9A94",  // teal hover state
  tealLight:     "#E6FFFA",  // teal tint backgrounds, active phase bg
  mint:          "#A8F0E0",  // level badges, accent borders
  border:        "#E2E8F0",  // all card borders, dividers (1px solid)
  bg:            "#F7FAFC",  // page background, secondary panels
  body:          "#4A5568",  // body copy
  light:         "#718096",  // secondary body, captions
  muted:         "#A0AEC0",  // placeholders, disabled, eyebrow labels
  success:       "#48BB78",  // correct answer, completed state
  successLight:  "#F0FFF4",  // correct answer bg
  successBorder: "#9AE6B4",  // correct answer border
  error:         "#FC8181",  // wrong answer
  errorLight:    "#FFF5F5",  // wrong answer bg
  errorBorder:   "#FEB2B2",  // wrong answer border

  // RCTF element colours — used consistently across all levels
  role:          "#667EEA",  roleLight:    "#EBF4FF",
  context:       "#38B2AC",  contextLight: "#E6FFFA",
  task:          "#ED8936",  taskLight:    "#FFFBEB",
  format:        "#48BB78",  formatLight:  "#F0FFF4",
};
```

### Typography
```js
const F = {
  h: "'DM Sans', system-ui, sans-serif",       // all headings
  b: "'Plus Jakarta Sans', system-ui, sans-serif", // all body, labels, buttons
};
```

Always load both from Google Fonts at the top of the component:
```js
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

### Typography scale
| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Page h1 | DM Sans | 28px | 800 | navy |
| Section h2 | DM Sans | 22px | 700 | navy |
| Slide h2 | DM Sans | 22px | 700 | navy |
| Card title | DM Sans | 15px | 700 | navy |
| Eyebrow | Plus Jakarta Sans | 10–11px | 700 | teal |
| Body paragraph | Plus Jakarta Sans | 14–15px | 400 | body (#4A5568) |
| Card body | Plus Jakarta Sans | 13px | 400 | body |
| Caption / label | Plus Jakarta Sans | 11–12px | 600 | muted |
| Button | Plus Jakarta Sans | 13px | 600 | — |
| Prompt example | Plus Jakarta Sans | 13px | 400 italic | navyMid |
| Tag / pill | Plus Jakarta Sans | 10–12px | 700 | — |

### Teal heading accent
Key words in h1/h2 headings get a teal underline. Never colour the text — only underline:
```jsx
<span style={{
  textDecoration: "underline",
  textDecorationColor: "#38B2AC",
  textDecorationThickness: 3,
  textUnderlineOffset: 5,
}}>word</span>
```

### Spacing
Use multiples of 4px. Standard values: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48.

---

## 4. Page Layout

### Shell structure
```
┌─────────────────────────────────────────────────────────┐
│ Site Nav (52px, navy bg)                                │
├─────────────────────────────────────────────────────────┤
│ Page Hero (white bg, border-bottom)                     │
│  - Breadcrumb                                           │
│  - Level badge + title + description + meta tags        │
│  - Progress summary (right-aligned)                     │
├─────────────────────────────────────────────────────────┤
│ Main Content (max-width 1100px, padding 32px 40px)      │
│                                                         │
│  PhaseLabel                                             │
│  Active Phase Content (full width)                      │
│                                                         │
│  Journey Strip (full width, always visible)             │
└─────────────────────────────────────────────────────────┘
```

### Max width
All content: `maxWidth: 1100px, margin: "0 auto", padding: "0 40px"`.

### Page Hero spec
```jsx
// Breadcrumb: Learning › Level N › [Topic Name]
// Left column (flex: 1, minWidth 320):
//   - Level badge: mint bg (#A8F0E0), teal text, pill shape, UPPERCASE
//   - Eyebrow: "FOUNDATIONS & AWARENESS" (or relevant descriptor)
//   - h1 with teal accent underline on key word
//   - Description paragraph (14px, body colour, max 600px wide)
//   - Meta tag row: duration, activity count, difficulty, context
//
// Right column (minWidth 200, fixed):
//   - "Journey Progress" label
//   - Large number: X / [total phases]
//   - "phases completed" label
//   - Teal progress bar
```

Meta tags use this pattern:
```jsx
<span style={{
  padding: "5px 12px",
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  fontSize: 12,
  color: C.body,
  fontWeight: 600,
  fontFamily: F.b,
}}>Label</span>
```

---

## 5. The E-Learning Player

### Critical constraint: FIXED HEIGHT
The player content area **must always be exactly 460px tall** with `overflowY: "auto"`. This never changes regardless of slide content length. The outer player card never resizes — slides scroll internally if needed. This is non-negotiable.

### Player structure
```
┌─────────────────────────────────────────────────────────┐
│ Top bar (navy, 44px)                                    │
│  Left: SECTION NAME (uppercase, muted)                  │
│  Centre: Slide progress dots                            │
│  Right: "X / Y" count                                  │
├─────────────────────────────────────────────────────────┤
│ Progress bar (3px, teal fill, E2E8F0 track)             │
├─────────────────────────────────────────────────────────┤
│ CONTENT AREA — fixed 460px height, overflowY: auto      │
│ padding: 36px 48px                                      │
│ (slide content renders here)                            │
├─────────────────────────────────────────────────────────┤
│ Nav bar (white, border-top, padding 14px 28px)          │
│  Left: ← Previous (secondary button)                   │
│  Centre: SECTION NAME (muted, uppercase)                │
│  Right: Next → or Finish → (primary button)             │
└─────────────────────────────────────────────────────────┘
```

### Progress dots (in top bar)
```jsx
{SLIDES.map((_, i) => (
  <div key={i}
    onClick={() => goToSlide(i)}
    style={{
      width: i === currentSlide ? 22 : 8,
      height: 8,
      borderRadius: 4,
      background: i === currentSlide ? C.teal
                : visitedSlides.has(i) ? "#4A5568"
                : "#2D3748",
      cursor: "pointer",
      transition: "all 250ms ease",
    }}
  />
))}
```

### Navigation state
- Previous disabled on slide 0
- Final slide Next button reads "Finish E-Learning →" and advances to Read phase on click
- `visitedSlides` is a `Set` tracking which slides have been viewed
- Slide transitions reset `selectedAnswer` and `answered` state

### Player card style
```jsx
{
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 2px 24px rgba(0,0,0,0.05)",
}
```

---

## 6. Slide Types

Every slide must declare a `type` field. The following types are available. Use only these types — do not invent new ones without extending this skill document.

### type: "title"
The opening slide. Always slide index 0.

Required fields: `heading`, `subheading`, `body`, `meta` (array of strings)

Layout:
- Eyebrow: "OXYGY AI UPSKILLING — LEVEL [N]"
- h1 with teal accent on key word
- Subheading (14px, light)
- Meta pills row (bordered pills, inline-flex)
- Body paragraph (14px, body colour, max 560px)

### type: "concept"
Two-column layout: text left, visual panel right.

Required fields: `heading`, `body`, `pullQuote`, and optionally `visual` for the right panel.

Layout:
- Left (55%): eyebrow, h2, body paragraph, pull quote (teal left border, tealLight bg)
- Right (45%): bordered panel (`bg: C.bg, border: 1px solid C.border, borderRadius: 12, padding: 20`) containing a diagram, comparison, or illustration relevant to the concept

Pull quote style:
```jsx
{
  borderLeft: "4px solid #38B2AC",
  background: "#E6FFFA",
  padding: "12px 16px",
  borderRadius: "0 8px 8px 0",
}
```

### type: "spectrum"
Interactive slider with three positions. Used to show a spectrum of approaches.

Required fields: `heading`, `body`, `positions` (array of 3: `{ label, desc, example }`)

Layout:
- Eyebrow + h2 + body paragraph
- Spectrum track with gradient (mint → teal), three clickable handle dots at 0%, 50%, 100%
- Position labels below track (click to switch)
- Active technique panel: `bg: C.bg, borderLeft: "3px solid #38B2AC"`, showing the example for the selected position

State: `spectrumPos` (0 | 1 | 2), default to 2 (rightmost / most structured)

### type: "rctf"
Four-element grid for the RCTF framework. Always uses the four canonical RCTF colours.

Required fields: `heading`, `subheading`, `elements` (array of 4: `{ key, color, light, desc, example }`)

Layout: 2×2 grid, gap 10px. Each card:
- Colour pill (key name, colour bg, white text)
- Description (12px, body colour)
- Example prompt box (white bg, colour left border, italic text)

Always use the canonical RCTF colours from the token set: Role = #667EEA, Context = #38B2AC, Task = #ED8936, Format = #48BB78.

### type: "flipcard"
Two side-by-side flip cards. Used for before/after comparisons.

Required fields: `heading`, `instruction`, `cards` (array of 2: `{ frontLabel, frontBadge, frontPrompt, backLabel, backBadge, backPrompt, backResponse }`)

Each card: 3D CSS flip on click. Front = "without" state, Back = "with" state.
- Status badges: "WITHOUT X" (error colours) and "WITH X" (success colours)
- Prompt text in `.prompt-box` style
- "Click to flip ↺" hint at bottom of front face (11px, muted)
- `perspective: 1000px` on wrapper, `transform-style: preserve-3d` on card
- Both faces: `backface-visibility: hidden; -webkit-backface-visibility: hidden`

### type: "dragdrop"
Drag-and-drop categorisation exercise. Used to test RCTF element identification.

Required fields: `heading`, `instruction`, `chips` (array: `{ id, text, correctZone }`), `zones` (array: `{ id, label, color }`)

Behaviour:
- Desktop: HTML5 drag and drop API
- Mobile: tap-to-select chip, tap zone to place
- "Check Answers" button enabled only when all chips placed
- Correct: green border on zone. Incorrect: red border + correct label shown
- "Reset" button to retry

### type: "quiz"
Knowledge check with a single multiple choice question.

Required fields: `heading`, `question`, `options` (array of strings), `correct` (index), `explanation`

Layout:
- Eyebrow showing "PRACTICE — QUESTION X OF Y"
- Question text (18px, DM Sans, max 560px)
- Option cards (click to select, teal border when selected)
- "Check Answer" button (appears after selection, primary style)
- Feedback panel (success/error bg, correct/incorrect label + explanation)

Option card states:
```
Default:   border: 1px solid C.border, bg: white
Selected:  border: 2px solid C.teal, bg: C.tealLight
Correct:   border: 2px solid C.success, bg: C.successLight
Incorrect: border: 2px solid C.error, bg: C.errorLight
```

### type: "comparison"
Three-tab comparison of the same scenario approached three different ways.

Required fields: `heading`, `scenario`, `tabs` (array of 3: `{ label, prompt, annotation }`)

Layout:
- Scenario box (navy bg, white text, mint accent for bold)
- Tab bar (border-bottom 2px C.border, active tab gets 3px teal bottom border)
- Active panel fades in (opacity 0→1, 200ms)
- Prompt in `.prompt-box` style with diff highlighting on tabs 2 and 3 (`bg: rgba(72,187,120,0.2), border-bottom: 2px solid C.success`)
- Annotation below prompt (12px, muted, bg: C.bg, borderRadius: 4, padding: 8px 12px)

### type: "branching"
Scenario with three option cards, each revealing a simulated AI response after selection.

Required fields: `heading`, `scenario`, `options` (array of 3: `{ label, prompt, responseQuality, response, reflection }`)

responseQuality values: `"strong"` | `"partial"` | `"weak"` — controls the badge colour on the response panel.

### type: "templates"
A set of copyable prompt templates plus an optional template builder.

Required fields: `heading`, `templates` (array: `{ id, name, tag, tagColor, template }`)

Each template card:
- Header: name + tag pill + copy button (right-aligned, never floated/absolute)
- Body: prompt text in monospace-ish style, full width
- Copy button: on click, copies text, changes to "Copied ✓" for 2000ms then reverts

### Expandable Accordion Pattern

A standing interaction pattern for any slide that contains content at risk of truncation or overflow within the 460px content area.

**When to use:** When a slide contains long prompt examples, full AI output text, detailed annotations, or multi-paragraph explanations, the content must be presented in an expandable/collapsible format.

**Default state:** A scannable preview — enough for the learner to understand the point without reading every word. This might be 2–3 lines of a prompt, the first sentence of an AI output, or a summary label.

**Expanded state:** The full content, revealed on click. A clear visual affordance (chevron icon, "Show full prompt ▾" / "Show less ▴" label) must indicate expandability.

Key rules:
- This pattern serves two audiences: the fast scanner who wants to absorb the concept and move on, and the deep reader who wants to examine every detail.
- Expandable sections must never be the *only* way to access critical teaching content. The slide must make its pedagogical point in the default (collapsed) state. Expansion is for optional depth, not for hiding the lesson.

Slide types most likely to need this pattern:
- `comparison` and `branching` slides where prompt text is long
- Beat 4 contrast slides where before/after outputs are shown
- Any slide showing a worked example with a full prompt + full output

Accordion toggle style:
```jsx
{
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 12px",
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: C.bg,
  fontSize: 12,
  fontWeight: 600,
  color: C.light,
  cursor: "pointer",
  fontFamily: F.b,
}
```

State: `expanded` (boolean), toggle on click. Content area uses `maxHeight` transition (0 → auto equivalent via measured height) with 200ms ease.

---

## 7. Prompt Box — Universal Style

Any time prompt text appears anywhere in the e-learning (slides, articles, video descriptions), use this style:
```jsx
{
  background: "#F7FAFC",
  border: "1px solid #E2E8F0",
  borderLeft: "3px solid #38B2AC",  // override colour per context
  borderRadius: "0 8px 8px 0",
  padding: "12px 16px",
  fontSize: 13,
  fontFamily: F.b,
  fontStyle: "italic",
  color: "#2D3748",
  lineHeight: 1.6,
  wordBreak: "break-word",
  overflowWrap: "break-word",
  boxSizing: "border-box",
  width: "100%",
}
```

---

## 8. Read Phase

### Layout
Two-column grid (`gridTemplateColumns: "1fr 1fr"`, gap 20px).
Each article gets one card.

### Article card structure
```
┌─────────────────────────────────────────────────────────┐
│ Card Header (C.bg or C.successLight if done)            │
│  - "Article N · read time · Source"                     │
│  - Title (strikethrough + light colour when done)       │
│  - ✓ checkmark (right-aligned, when done)               │
├─────────────────────────────────────────────────────────┤
│ Card Body                                               │
│  - Description paragraph                                │
│  - "Read article ↗" link button                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─               │
│  [shown after link clicked:]                            │
│  - REFLECTION eyebrow                                   │
│  - Reflection question (13px, navyMid)                  │
│  - Textarea (min-height 80px, C.bg fill)                │
│  - "Submit reflection →" button (disabled if empty)     │
└─────────────────────────────────────────────────────────┘
```

### Article card border/bg states
- Default: `border: 1px solid C.border, bg: white`
- Done: `header bg: C.successLight`

### Read article link button style
```jsx
{
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 18px",
  borderRadius: 24,
  border: `1px solid ${C.teal}`,
  color: C.teal,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  fontFamily: F.b,
}
```

### Completion logic
Article is complete when reflection is submitted (any non-empty text). Phase 2 is complete when all articles are submitted. Show "Continue to Watch →" button right-aligned below the grid.

### Reflection questions
Each article must have a distinct, thought-provoking reflection question relevant to its content. Not generic. Examples:
- "In one sentence, what was the single most useful idea from this article for your day-to-day work?"
- "Describe one situation from your own work where adding more context to a prompt could have improved the result."

---

## 9. Watch Phase

### Layout
Single column, stacked cards with gap 24px.

### Video card structure
```
┌─────────────────────────────────────────────────────────┐
│ Card Header (C.bg or C.successLight if done)            │
│  - Thumbnail placeholder (80×52px, navy bg, teal ▶)    │
│  - "Video N · duration · Channel"                       │
│  - Title (strikethrough + light colour when done)       │
│  - ✓ checkmark (right-aligned, when done)               │
├─────────────────────────────────────────────────────────┤
│ Card Body                                               │
│  - Description paragraph                                │
│  - "▶ Watch video" button                               │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─               │
│  [shown after watch clicked:]                           │
│  - KNOWLEDGE CHECK eyebrow                              │
│  - Q1: question + options + Check answer                │
│  - Q2: question + options + Check answer                │
└─────────────────────────────────────────────────────────┘
```

### Video knowledge check
Two multiple choice questions per video. Each question is in its own bordered panel (`C.bg, border: 1px solid C.border, borderRadius: 10`). Questions use the same option card interaction pattern as the quiz slide type. Each question has its own "Check answer" button — questions are independent.

### Video completion
Video is marked complete when:
1. "Watch video" has been clicked AND
2. Both knowledge check questions have been answered (Check answer clicked on both)

### Watch phase completion CTA
When all videos are complete, show a full-width dark navy CTA banner:
```jsx
{
  background: C.navy,
  borderRadius: 16,
  padding: "28px 32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
}
```
Left: mint eyebrow "LEARNING JOURNEY COMPLETE", white h3, grey description.
Right: teal primary button "Go to Prompt Playground →".

---

## 10. Handoff CTA

When the user clicks the final CTA in Watch phase, switch `activePhase` to `"practice"` and render:
- Centred card (white bg, bordered, borderRadius 16, padding 48px)
- Icon circle (tealLight bg, mint border, 64px)
- "NEXT STEP" eyebrow
- h2: "Prompt Playground"
- Description paragraph
- Teal CTA link button: "Open Prompt Playground →"

This page does not host the Prompt Playground itself — it links to it. The `href` will be the route to the Prompt Playground page on the site.

---

## 11. Journey Strip

Always rendered below the active phase content, at full content width.

### Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ "LEARNING JOURNEY — LEVEL N" eyebrow                           │
│                                                                 │
│ [E-Learning] › [Read] › [Watch] › [Practice]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase tile spec
Each phase is a clickable tile (except "Practice" which is external):
```jsx
{
  flex: 1,
  padding: "14px 16px",
  borderRadius: 10,
  border: active ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
  background: active ? C.tealLight : done ? C.successLight : "#FAFAFA",
  cursor: external ? "default" : "pointer",
  transition: "all 200ms ease",
  position: "relative",
}
```

Completed phase: teal checkmark badge (absolute, top-right, 20px circle, C.success bg).
Phase title: strikethrough + C.light colour when done.
Phase time: stays visible always.
Phase description: 11px, muted.

### Connector arrows between tiles
```jsx
<div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}>
  <div style={{ height: 1, width: 16, background: done ? C.teal : C.border }} />
  <span style={{ fontSize: 12, color: done ? C.teal : C.muted }}>›</span>
</div>
```

---

## 12. Reusable Components

Always implement these as local components within the page file.

### PhaseLabel
```jsx
function PhaseLabel({ label, time, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#48BB78" : "#ED8936" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: 1, fontFamily: F.b }}>
          {done ? `${label} — Complete ✓` : `${label} — In Progress`}
        </span>
      </div>
      <span style={{ fontSize: 12, color: "#A0AEC0", fontFamily: F.b }}>{time}</span>
    </div>
  );
}
```

### Btn
```jsx
function Btn({ children, onClick, disabled, secondary }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 22px",
      borderRadius: 24,
      border: secondary ? `1px solid ${C.border}` : "none",
      background: disabled ? C.muted : secondary ? "transparent" : C.teal,
      color: disabled ? "#fff" : secondary ? C.navy : "#fff",
      fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: F.b,
      display: "flex", alignItems: "center", gap: 5,
      transition: "all 150ms ease",
    }}>{children}</button>
  );
}
```

### Eyebrow
```jsx
const Eyebrow = ({ t }) => (
  <p style={{
    fontSize: 10, fontWeight: 700, color: C.teal,
    letterSpacing: 2, textTransform: "uppercase",
    marginBottom: 8, fontFamily: F.b,
  }}>{t}</p>
);
```

---

## 13. State Architecture

Use this state structure as a starting point for every e-learning page. Extend as needed for additional slide interactions.

```jsx
// Phase navigation
const [activePhase, setActivePhase] = useState("elearn");
const [phasesDone, setPhasesDone] = useState(new Set());

// E-learning player
const [slide, setSlide] = useState(0);
const [visitedSlides, setVisitedSlides] = useState(new Set([0]));
const [selectedAnswer, setSelectedAnswer] = useState(null);
const [answered, setAnswered] = useState(false);
const [spectrumPos, setSpectrumPos] = useState(2);      // for spectrum slides
const [flippedCards, setFlippedCards] = useState({});   // for flipcard slides

// Read phase: { [articleId]: { clicked, reflectionText, submitted } }
const [articleState, setArticleState] = useState({});

// Watch phase: { [videoId]: { clicked, quizAnswers: [null, null], quizChecked: [false, false] } }
const [videoState, setVideoState] = useState({});

// Completion helpers
const markPhaseDone = (id) => setPhasesDone(prev => new Set([...prev, id]));
const readDone = ARTICLES.every(a => articleState[a.id]?.submitted);
const watchDone = VIDEOS.every(v => videoState[v.id]?.clicked && videoState[v.id]?.quizChecked?.every(Boolean));
```

---

## 14. Content Data Structure

When building a new level's e-learning page, provide all content as data arrays at the top of the file. The components read from this data — no content should be hardcoded inside component JSX.

### SLIDES array
```js
const SLIDES = [
  {
    id: 1,                        // sequential integer
    section: "FOUNDATIONS",       // UPPERCASE section name for top bar
    type: "title",                // one of the types defined in Section 6
    heading: "...",
    subheading: "...",
    body: "...",
    meta: ["X min", "Y slides", "Quiz included"],
  },
  // ... more slides
];
```

### ARTICLES array
```js
const ARTICLES = [
  {
    id: "a1",                     // unique string ID
    title: "...",
    source: "Publication Name",
    readTime: "X min read",
    desc: "...",                  // one paragraph description
    url: "https://...",
    reflection: "...",            // specific, non-generic reflection question
  },
];
```

### VIDEOS array
```js
const VIDEOS = [
  {
    id: "v1",
    title: "...",
    channel: "Oxygy Learning",
    duration: "X min",
    desc: "...",
    url: "https://...",           // YouTube or video URL
    quiz: [
      {
        q: "...",
        options: ["...", "...", "...", "..."],
        correct: 0,               // index of correct option
      },
      {
        q: "...",
        options: ["...", "...", "...", "..."],
        correct: 2,
      },
    ],
  },
];
```

### PHASES array
```js
const PHASES = [
  { id: "elearn",   label: "E-Learning", icon: "▶", time: "X–Y min", desc: "Interactive slide module" },
  { id: "read",     label: "Read",       icon: "◎", time: "~X min",  desc: "N articles + reflection" },
  { id: "watch",    label: "Watch",      icon: "▷", time: "~X min",  desc: "N videos + knowledge check" },
  { id: "practice", label: "Practice",   icon: "◈", time: "X min",   desc: "Prompt Playground →", external: true },
];
```

---

## 15. Topic Authoring Guidance

These rules govern the *content* written for slides, articles, and video descriptions. They apply to every level and every topic.

### Tone and framing

- Frame gaps as opportunities, not failures. The learner is investing in growth — treat them accordingly.
- Never use language that implies blame, shame, or inadequacy.
- Avoid "best practice" — prefer "effective technique" or "recommended approach for [specific situation]."
- When introducing a framework, always present the situational judgment for when to use it vs. alternatives.

### Scenario and example requirements

All scenarios and examples must pass the **audience universality test** defined in Section 2.4. In addition:

- Scenarios should be professionally universal — recognisable to any knowledge worker regardless of role, function, or seniority.
- Never anchor a scenario to a specific job title or department unless the exercise explicitly asks the learner to choose their own role.
- Prompt demonstrations must use tasks any professional could face: summarising, drafting, structuring, reviewing, synthesising.
- Before/after comparisons must use genuine attempts on both sides. Never strawman the "before" state.

### Tool-agnostic content

Follow the tool-agnostic framing rules in Section 2.3. In particular:
- Never reference specific AI tools (ChatGPT, Claude, Copilot, Gemini) in scenario setups or teaching content.
- Use "your AI tool," "the AI," or "any large language model" instead.
- Exceptions are listed in Section 2.3.

### Content that should never appear in self-paced slides

- Walls of text without visual breaks (max 3 consecutive body paragraphs without an interactive or visual element)
- Unattributed statistics or claims
- References to specific AI tools in scenario setups (see Section 2.3 for exceptions)
- Function-specific or role-specific scenarios that violate the audience universality rule (Section 2.4)
- "One right answer" framing that positions a single technique as universally correct (see Principle 5 in Section 2.1)

---

## 16. Quality Rules — Non-Negotiable

These apply to every build. Check before considering the page complete.

**No overlapping content.** The player shell is a fixed grid: `topBar (44px) + progressBar (3px) + contentArea (460px, scrollable) + navBar (~52px)`. Content never bleeds outside the content area.

**No layout shifts.** The player card height never changes between slides. If slide content is shorter, it sits at the top with empty space below. If it's longer, the content area scrolls.

**All cards use explicit padding.** Minimum `padding: 14px 16px` on all sides. Never 0 on any side.

**Equal height card grids use CSS Grid with `alignItems: "stretch"`.** Never Flexbox for equal-height columns.

**All text containers have `wordBreak: "break-word"` and `overflowWrap: "break-word"`.**

**Borders are always `1px solid #E2E8F0`** on cards and panels. Never omit.

**Prompt text is never rendered as bare body copy.** Always use the prompt box style from Section 7.

**Button minimum width: 100px.** Buttons never collapse to icon-only on desktop.

**Touch targets minimum height: 44px** on all interactive elements.

**The journey strip is always rendered** — even when on the first phase. It shows the learner what's coming.

**No emoji in professional UI.** Phase icons use geometric unicode characters (▶ ◎ ▷ ◈ ◉ ◇), not emoji.

**Google Fonts must be loaded** via `@import` in the `<style>` tag at the top of every component. Never fall back to system fonts as the primary choice.

**Vertical composition must be balanced across the full 460px content area.** No slide should feel top-heavy with content clustered in the upper half and empty space below.
- **Header zone (top ~20%, max ~80–90px):** Section eyebrow, slide heading, teal-underlined key phrase. Keep compact.
- **Primary content zone (middle ~60%):** Core teaching content — frameworks, diagrams, comparisons, interactive elements. Vertically centred or evenly distributed, not pushed to the top.
- **Supporting content zone (bottom ~20%):** Pull quotes, footnotes, "continue" prompts, contextual links. Anchors the bottom of the slide.
- If a slide's content naturally occupies less than 460px, distribute it with balanced vertical spacing rather than top-aligning everything with empty space below.
- Minimum 16px between heading and body text. Minimum 20–24px between body text and primary visual content.

**Dense content must use the expandable accordion pattern** (defined in Section 6). Long prompt examples, full AI outputs, and multi-paragraph explanations must be collapsible. The slide's pedagogical point must be clear in the collapsed state — expansion is for optional depth.

---

## 17. File Location & Naming

New e-learning pages live in the site's route structure at:
```
/src/pages/learn/level-[N]-[topic-slug].jsx
```

Example: `/src/pages/learn/level-1-prompt-engineering.jsx`

Each page is a single self-contained `.jsx` file. All data, components, and styles live in that one file. No separate CSS files, no imported sub-components from other files (except global site components like the Nav).

---

## 18. How to Use This Skill — Quick Reference

When asked to build a new e-learning page:

1. **Read this SKILL.md in full before writing any code.**
2. Ask the user for (or check project context for): level number, level name, slide content, article URLs + reflection questions, video URLs + quiz questions.
3. Scaffold the data arrays first (SLIDES, ARTICLES, VIDEOS, PHASES).
4. Build the page shell (Nav, Hero, phase switching logic, Journey Strip).
5. Build or reuse the SlideContent renderer, Read phase, and Watch phase.
6. Wire up state and phase progression logic.
7. Validate against Section 16 quality rules and Section 15 topic authoring guidance before presenting output.
8. Output a single `.jsx` file at the correct path.

Do not ask the user to choose a layout, colour scheme, or component style. These are defined here. Your only creative input is the content itself — not the design.
