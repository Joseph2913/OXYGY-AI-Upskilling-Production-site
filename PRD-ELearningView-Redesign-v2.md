# PRD: ELearningView Redesign — Prompt Engineering Module
## Oxygy AI Upskilling · Level 1 · Topic 1

**Version:** 1.0
**Status:** Ready for Claude Code
**Handoff target:** Claude Code

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Read `SKILL-Elearning-Page.md` in the project — it defines brand tokens, typography, spacing, content design philosophy, and quality rules. Every visual decision not specified in this PRD defaults to that skill.
2. Read `ELEARNING_DESIGN_SKILL.md` — it defines the five-beat pedagogical structure and slide type reference.
3. Read the existing `components/app/level/ELearningView.tsx` — you are replacing its **slide content and renderSlide logic only**. The player shell (top bar, progress dots, nav buttons, fullscreen mode) stays exactly as-is.
4. Read `hooks/useLevelData.ts` — the `TOTAL_SLIDES` constant must be updated.

---

## 1. Overview

**What this PRD covers:** A full redesign of the slide content and interactive patterns inside `components/app/level/ELearningView.tsx`, plus the required `TOTAL_SLIDES` constant update in `hooks/useLevelData.ts`.

**What this PRD does NOT touch:** The player shell UI (top bar, progress dots, nav buttons, fullscreen mode), `AppCurrentLevel.tsx`, `TopicHeader.tsx`, or any phase other than E-Learning. All of that stays exactly as-is.

**Net change to slide count:** 13 → 16 slides.
- `TOTAL_SLIDES` in `hooks/useLevelData.ts` must be updated from `13` to `16`.

**Why 16:** The original 13-slide structure is being replaced with:
- +1 new Course Intro slide (slide 1)
- 3 evidence slides (slides 2–4)
- 2 scenario/comparison slides (slides 5–6)
- 5 persona slides (slides 7–11)
- 1 situation matrix (slide 12)
- 3 situational judgment exercises (slides 13–15, split from original single slide)
- 1 bridge slide (slide 16)

---

## 2. Global Design Rules (Apply to All Slides)

These rules govern every slide in this module.

### 2.1 Vertical Composition
Every slide must use `display: flex; flexDirection: column; justifyContent: space-between` at the outermost container so content is **vertically distributed**, not top-heavy. The three zones are:
- **Header zone (top ~20%, ~80–90px max):** Eyebrow label + slide heading. Keep compact.
- **Primary content zone (middle ~60%):** The main teaching element — visual, interactive, comparison.
- **Insight/anchor zone (bottom ~20%):** Pull quote, key insight bar, or summary callout anchoring the bottom.

No slide should have content clustered at the top with empty space below.

### 2.2 Left-Context / Right-Output Layout
For any slide presenting a scenario, case study, or comparison:
- **Left half:** establishes the context (who, what, situation, framing)
- **Right half:** shows the output, options, or interaction
- Use `display: grid; gridTemplateColumns: 1fr 1fr; gap: 20px`

### 2.3 Key Insight Cards
Any "Key Insight" or bottom anchor callout must use:
```jsx
background: "linear-gradient(135deg, #1A3A38, #1A202C)"
border: "1px solid #38B2AC44"
padding: "14px 20px"
borderRadius: 10
```
With a `KEY INSIGHT` eyebrow label at 10px, uppercase, teal, `letterSpacing: "0.1em"`.

### 2.4 Prompt Boxes
Any prompt text uses the universal prompt box style:
```jsx
background: "#F7FAFC"
border: "1px solid #E2E8F0"
borderLeft: "3px solid [contextual accent color]"
borderRadius: "0 8px 8px 0"
padding: "12px 16px"
fontSize: 13
fontStyle: "italic"
color: "#2D3748"
lineHeight: 1.6
```

### 2.5 Expandable Accordions
Long prompt examples and AI output text must be collapsible. Default state shows 2–3 lines with a CSS gradient fade-out mask. A "Show full prompt ▾" / "Show less ▴" toggle reveals the rest. The slide's teaching point must be clear in the collapsed state.

Toggle label style: `fontSize: 11, fontWeight: 600, color: "#38B2AC", cursor: "pointer", marginTop: 6`

### 2.6 Eyebrow Labels
All section eyebrow labels use:
```jsx
fontSize: 10, fontWeight: 700, color: "#38B2AC",
letterSpacing: "0.12em", textTransform: "uppercase",
marginBottom: 8
```

### 2.7 Teal Underline Accent
Key words in headings use teal underline (never coloured text):
```jsx
textDecoration: "underline",
textDecorationColor: "#38B2AC",
textDecorationThickness: 3,
textUnderlineOffset: 5,
```

---

## 3. Complete Slide Inventory

### SLIDE 1 — Course Intro
**Type:** `courseIntro`
**Section label:** `PROMPT ENGINEERING`

**Purpose:** Required opening slide. Sets expectations, lists learning objectives, establishes tone.

**Layout:** Dark navy gradient background (`linear-gradient(135deg, #1A202C 0%, #2D3748 100%)`). Full-bleed — use `position: absolute; inset: 0` to fill the content area without standard padding.

**Content:**
```
Top-left: Level badge
  background: "#A8F0E0", color: "#1A6B5F"
  pill shape, padding: "3px 10px", borderRadius: 16
  text: "LEVEL 1 · E-LEARNING" (fontSize: 10, fontWeight: 700, uppercase)

Heading: "Prompt Engineering Essentials"
  fontSize: 26, fontWeight: 800, color: "#FFFFFF", marginTop: 16

Subheading: "Learn the full prompting toolkit — from brain dumps
to structured blueprints — through five professionals who've
each figured out what works."
  fontSize: 14, color: "rgba(255,255,255,0.75)", maxWidth: 480,
  lineHeight: 1.6, marginTop: 8

"What You'll Learn" block (marginTop: 24):
  Label: "WHAT YOU'LL LEARN" — 10px, "rgba(255,255,255,0.4)",
         uppercase, letterSpacing: "0.1em"
  Four items with teal "▸" bullets:
    1. "Why the same AI tools produce wildly different results
        across professionals"
    2. "The six-component Prompt Blueprint framework
        (RCTF + Steps + Checks)"
    3. "Five prompting approaches and when to use each"
    4. "How to choose the right technique for any task you face"
  Item style: fontSize: 13, color: "rgba(255,255,255,0.85)",
              lineHeight: 1.6, marginBottom: 6
  Bullet style: color: "#38B2AC", marginRight: 8

Bottom row: Meta pills (position: absolute, bottom: 24, left: 32)
  ["~25 min", "16 slides", "Interactive", "Beginner friendly"]
  Pill style: border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 16, padding: "4px 12px",
              fontSize: 11, color: "rgba(255,255,255,0.5)"
```

---

### SLIDE 2 — Adoption Has Surged
**Type:** `evidence`
**Section label:** `THE REALITY`

**Layout:** Two columns. Left (55%): heading + description + insight bar. Right (45%): large stat card.

**Left column:**
```
Eyebrow: "THE REALITY"
Heading: "Adoption has surged."
  Teal underline on: "surged"
  fontSize: 22, fontWeight: 700, color: "#1A202C"

Body: "AI tools are no longer experimental. They're embedded
in the daily workflows of most knowledge workers — across
every function, every level, every industry."
  fontSize: 13, color: "#4A5568", lineHeight: 1.7, maxWidth: 380
```

**Right column — stat card:**
```
Container:
  padding: "28px 36px", borderRadius: 20,
  background: "linear-gradient(135deg, #E6FFFA, #fff)",
  border: "2px solid #38B2AC",
  boxShadow: "0 0 32px rgba(56,178,172,0.25),
              0 0 0 1px rgba(56,178,172,0.3)",
  textAlign: "center"
  Animation on mount: fadeInUp (opacity 0→1, translateY 12→0, 400ms)

Trend icon: "↑" — fontSize: 24, color: "#38B2AC", marginBottom: 4

Stat: "75%"
  fontSize: 56, fontWeight: 800, color: "#38B2AC", lineHeight: 1

Label: "of knowledge workers now use generative AI
as part of their regular workflow"
  fontSize: 12, color: "#4A5568", marginTop: 8, maxWidth: 180

Source badge (below label, marginTop: 8):
  White card, border: "1px solid #E2E8F0", borderRadius: 8,
  padding: "6px 12px", display: inline-flex, alignItems: center, gap: 8
  Try to load: <img src="/public/logos/mckinsey.png" height="18" />
  Fallback text: "McKinsey & Company" (fontWeight: 700, fontSize: 11, color: "#1A202C")
  Year: "2024" (fontSize: 11, color: "#A0AEC0")
```

**Bottom insight bar (teal left border style):**
```
Text: "75% of your colleagues, clients, and competitors.
The tools are already in the room."
Render "75%" as <span style={{ color: "#38B2AC", fontWeight: 800 }}>
```

---

### SLIDE 3 — Same Tools, Very Different Results
**Type:** `chart`
**Section label:** `THE REALITY`

**Layout:** Two columns. Left: heading + body. Right: bar chart visual.

**Left column:**
```
Heading: "Same tools. Very different results."
  Teal underline on: "Very different"

Body: "Even with access to the same tools, how professionals
use them varies enormously. Usage is rising. But so are
expectations — and the gap between casual users and skilled
ones is growing."
  fontSize: 13, color: "#4A5568", lineHeight: 1.7
```

**Right column — grouped bar chart (CSS div-based, no chart library):**
```
X-axis labels: "6 months ago", "Today", "In 12 months"
Two bar series per time point:
  Series A "Usage" — teal bars (#38B2AC)
  Series B "Expected output quality" — navy bars (#1A202C)

Bar heights (percentage of container height ~200px):
  6 months ago: Usage 40%, Quality 35%
  Today: Usage 70%, Quality 65%
  In 12 months: Usage 85% (opacity: 0.4, dashed border),
                Quality 90% (opacity: 0.4, dashed border)

Legend below chart:
  Teal square + "Usage", Navy square + "Expected output quality"
  fontSize: 11
X-axis labels: fontSize: 10, color: "#A0AEC0", centred
```

**Bottom Key Insight card (see 2.3):**
```
"The bar keeps moving. Being an AI user isn't enough —
being a skilled one is what creates the gap."
```

---

### SLIDE 4 — Prompting Is the Foundation
**Type:** `pyramid`
**Section label:** `THE REALITY`

**Layout:** Two columns. Left: heading + body + insight bar. Right: pyramid diagram.

**Left column:**
```
Heading: "Prompting is the foundation everything else
is built on."
  Teal underline on: "foundation"

Body: "Every AI agent, automated workflow, intelligent
dashboard, and full-stack application runs on prompts.
Get the foundation right and every layer above it gets better."
  fontSize: 13, color: "#4A5568", lineHeight: 1.7

Insight bar: "Every level of the Oxygy framework builds on
the skills from this one. This is where it starts."
```

**Right column — pyramid stack (widest at bottom):**
```
| Layer (bottom→top) | Label         | Width | Fill      | Border              |
|--------------------|---------------|-------|-----------|---------------------|
| 1 (bottom)         | Prompting     | 100%  | #38B2AC   | 2px solid #2C9A94   |
| 2                  | AI Agents     | 82%   | #C3D0F5   | 1px solid #A0B4E8   |
| 3                  | Workflows     | 65%   | #F7E8A4   | 1px solid #D4C070   |
| 4                  | Dashboards    | 50%   | #FBCEB1   | 1px solid #E8A882   |
| 5 (top)            | Applications  | 38%   | #E2E8F0   | 1px solid #CBD5E0   |

Each layer: borderRadius: 6, padding: "8px 14px", marginBottom: 3,
            centred label, margin: "0 auto"
Prompting layer: fontWeight: 800, fontSize: 13, color: #FFFFFF
  Add "▸ You are here" tag — fontSize: 10, color: #2C9A94
Other layers: fontWeight: 600, fontSize: 12, color: #4A5568
```

---

### SLIDE 5 — Manager Onboarding Scenario
**Type:** `comparison`
**Section label:** `SEE THE DIFFERENCE`

**Layout:** `gridTemplateColumns: 1fr 1fr; gap: 20px; height: 100%`

**Left half — static context panel:**
```
background: "#1A202C", borderRadius: 12, padding: "20px 22px"

Eyebrow: "SCENARIO" — 10px, teal, uppercase
Heading: "Onboarding a new team member."
  fontSize: 18, fontWeight: 800, color: "#FFFFFF"
Body: "They're capable, eager, and smart — but they know
nothing about this project. You need them to produce a
stakeholder summary by end of day."
  fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6

Divider: 1px solid rgba(255,255,255,0.1), margin: "14px 0"

Bridge: "Your AI tool works the same way. How you brief it
determines what you get back."
  fontSize: 12, color: "#38B2AC", fontStyle: "italic"
```

**Right half — tabbed toggle:**
```
Tab bar: two tabs, "Rushed Handover" and "Thorough Onboarding"
  Active: borderBottom: "3px solid #38B2AC", color: "#1A202C", fontWeight: 700
  Inactive: color: "#A0AEC0", fontWeight: 500
  Default active: "Rushed Handover"

Tab A — "Rushed Handover":
  BRIEFING prompt box (borderLeft colour: "#A0AEC0"):
    "Hey, can you put together a summary of where we are on the
     project for the leadership meeting tomorrow? They'll want
     to know the key updates. Thanks.

     [Session transcript attached below]"

  OUTPUT (color: "#A0AEC0" — muted, implies low quality):
    "The session covered several important topics. Key findings
     include progress on workstream deliverables, some challenges
     with timelines, and next steps for the team. The committee
     should note that overall the project is tracking well with
     a few areas requiring attention. It is recommended that the
     team continue to monitor progress and escalate any issues."
  Expandable accordion on output.

Tab B — "Thorough Onboarding":
  BRIEFING prompt box (borderLeft colour: "#38B2AC"):
    "Here's what I need for tomorrow's leadership meeting. The
     audience is the CFO and two divisional heads — they care
     about commercial impact and timeline risk, not methodology.
     Structure it as: (1) three findings ranked by impact,
     (2) biggest risk + mitigation, (3) one recommendation.
     Under 400 words, direct tone. Here's last quarter's summary
     as a format reference.

     [Session transcript attached below]"
  Expandable accordion on prompt.

  OUTPUT (color: "#2D3748" — clear, implies high quality):
    "1. Cost synergies are tracking 12% ahead of the integration
     case — driven by procurement consolidation in Q2. This
     justifies accelerating the shared-services migration.

     2. Commercial team attrition has risen to 9.3% since the
     announcement — concentrated in the mid-market segment.
     Retention interventions should target this group within
     the next two weeks.

     3. Technology migration timeline has slipped by three weeks
     due to a dependency on the legacy CRM data extract. Revised
     go-live: 14 March.

     Risk: If mid-market attrition continues, Q3 revenue is at
     risk of a 4–6% shortfall. Proposed mitigation: accelerate
     the retention bonus programme.

     Recommendation: Approve revised timeline at Thursday's
     SteerCo and trigger retention programme this week."
  Expandable accordion on output.
```

**Bottom Key Insight card (full width, below grid):**
```
"The technology is identical. The value you extract from it is
entirely determined by the quality of your briefing."
```

---

### SLIDE 6 — Interactive Context Bar
**Type:** `interactive-sequential`
**Section label:** `SEE THE DIFFERENCE`

**Key behaviour: Next button drives sequential reveal.**

**Interaction specification:**
- Internal `contextStep` counter (0–6), starting at 0
- The player's **Next button is intercepted** by this slide:
  - Steps 0–5: pressing Next reveals the next RCTF component (`setContextStep(s => s + 1)`) instead of advancing to slide 7
  - Step 6: pressing Next advances to Slide 7 normally
- The Next button label changes:
  - Steps 0–5: `"Reveal next component →"`
  - Step 6: `"Next →"` (normal)

**Implementation for Claude Code:**
The `handleNext` function in the player's nav bar must check: `if (currentSlide === 6 && contextStep < 6)` → call `setContextStep(s => s + 1)` instead of `goToSlide(currentSlide + 1)`. When `contextStep === 6`, Next advances normally. This requires the `contextStep` state to be accessible in the nav bar's onClick handler.

**Layout:**
```
Top: Eyebrow + heading + instruction
  Heading: "Context is the fuel. Fill the tank."
    Teal underline on: "Fill the tank"
  Instruction: "Each component you provide eliminates a set of
  assumptions. Press Next to reveal each one."
    fontSize: 12, color: "#4A5568"

Middle: Context level progress bar
  Left label: "AI CONTEXT LEVEL" (10px, 700, muted, uppercase)
  Right label: "[Label] — [X/6]" (10px, 700,
    colour transitions: muted→peach→teal as bar fills)
  Bar: height: 10, background: "#E2E8F0", borderRadius: 5
  Fill: gradient from #FBCEB1 to #38B2AC,
        width: (contextStep / 6) * 100%, transition: 400ms
  Labels by step count: "Empty", "Minimal", "Basic",
    "Good", "Rich", "Strong", "Complete"

Below bar: 3×2 grid of six component cards
  Unrevealed: opacity: 0.35, greyscale border, background: "#F7FAFC"
  Revealed: opacity: 1, coloured border, background: [light colour],
            animate in with fadeInUp (200ms)

Bottom instruction (visible at steps 0–5):
  "Press Next to reveal each component →"
  fontSize: 11, color: "#A0AEC0", textAlign: center

When all 6 revealed (step 6):
  Key Insight card: "Complete briefing. Every component eliminated
  a specific assumption the AI would otherwise have made."
```

**Six component cards data:**
```js
const BLUEPRINT = [
  { key: "ROLE", color: "#667EEA", light: "#EBF4FF",
    label: "Who should the AI be?",
    detail: "Tells the AI the expertise level and perspective to adopt",
    example: "A senior professional with transformation experience",
    impact: "Without this → generic assistant voice" },
  { key: "CONTEXT", color: "#38B2AC", light: "#E6FFFA",
    label: "What's the situation?",
    detail: "Background, constraints, and what matters to the audience",
    example: "Six weeks into rollout. Leadership cares about risk.",
    impact: "Without this → no audience awareness" },
  { key: "TASK", color: "#ED8936", light: "#FFFBEB",
    label: "What exactly to produce?",
    detail: "Specific, unambiguous deliverable",
    example: "Draft a stakeholder update covering progress, risks, next steps",
    impact: "Without this → vague, unfocused output" },
  { key: "FORMAT", color: "#48BB78", light: "#F0FFF4",
    label: "What shape and tone?",
    detail: "Length, structure, style, constraints",
    example: "Three short paragraphs. Professional tone. Max 300 words.",
    impact: "Without this → wrong length, wrong tone" },
  { key: "STEPS", color: "#9F7AEA", light: "#FAF5FF",
    label: "How should it think?",
    detail: "The reasoning sequence to follow",
    example: "First assess impact, then identify risks, then recommend actions",
    impact: "Without this → random ordering" },
  { key: "CHECKS", color: "#F6AD55", light: "#FFFBEB",
    label: "What rules must it follow?",
    detail: "Validation constraints and quality gates",
    example: "No generic phrases. Reference specific data points.",
    impact: "Without this → filler and assumptions" },
];
```

---

### SLIDES 7–11 — Persona Slides
**Type:** `persona`
**Section label:** `THE APPROACHES`

**Shared layout (all five slides identical structure):**

`gridTemplateColumns: 1fr 1fr; gap: 20px; height: 100%`

**Left half — Context panel:**
```
Persona avatar: width: 56, height: 56, borderRadius: "50%",
  solid fill with persona colour, initial letter centred in
  white, fontSize: 22, fontWeight: 800

Below avatar:
  Name: fontSize: 16, fontWeight: 800, color: "#1A202C"
  Role: fontSize: 13, color: "#718096"

Approach badge: pill, persona colour bg, white text,
  fontSize: 11, fontWeight: 700

Tags row: 2–3 small grey pills
  fontSize: 10, color: "#A0AEC0",
  border: "1px solid #E2E8F0", borderRadius: 8

Approach definition: 2–3 sentences
  fontSize: 13, color: "#4A5568", lineHeight: 1.6

"Best for:" section:
  borderLeft: "3px solid #38B2AC", paddingLeft: 10
  fontSize: 12, color: "#718096", fontStyle: "italic"

Modifier card (if present):
  white bg, borderLeft: "3px solid [persona colour]",
  padding: "8px 12px", borderRadius: 8, marginTop: 8
  "+ [Modifier Name]" heading: fontSize: 11, fontWeight: 700,
    color: persona colour
  Definition: fontSize: 11, color: "#718096"
```

**Right half — Output panel:**
```
"EXAMPLE PROMPT" label: 10px, uppercase, #A0AEC0, letterSpacing: 1
Prompt box (see 2.4): borderLeft colour = persona colour
  Expandable accordion

"AI OUTPUT" label: same style
Output box: white bg, 1px solid #E2E8F0, borderRadius: 8,
  padding: "10px 12px", fontSize: 12, color: "#2D3748",
  lineHeight: 1.6
  Expandable accordion

"Why this works" rationale at bottom:
  fontSize: 11, fontStyle: "italic", color: "#718096",
  teal dot "•" prefix
```

**Persona 1 — Slide 7: Sam the Brain Dumper**
```js
{
  name: "Sam", initial: "S",
  role: "Programme Coordinator",
  color: "#ED8936",
  tags: ["Synthesising notes", "Finding themes", "Making sense of ambiguity"],
  approach: "Brain Dump",
  approachDef: "Pour in everything — rough notes, half-formed thoughts, scattered observations — and let the AI find the structure. You're not organising your thinking first. You're using the AI to help you do it.",
  bestFor: "Early-stage thinking. Unknown output shape. When speed matters more than precision.",
  prompt: "Here's everything from today — my notes from the three sessions, some thoughts on what I think the priorities are (but I'm not sure), a couple of things people said that felt important but I haven't processed yet.\n\nHelp me find the structure. What are the three most important themes? What am I missing?\n\n[Raw notes, voice memo transcript — unedited]",
  output: "Three clear themes emerged from your notes:\n\n1. Stakeholder alignment is fragile — two workstream leads have conflicting priorities that haven't been surfaced publicly.\n\n2. The timeline assumption for Phase 2 doesn't account for the procurement dependency flagged in your third bullet.\n\n3. There's a resource gap: three mentions of 'capacity concerns' across different sessions point to a systemic issue, not isolated complaints.\n\nWhat you may be missing: no one has named who owns the decision on timeline. That's likely why the conflicting priorities haven't been resolved.",
  why: "Sam's work starts messy by nature. Structuring before prompting would slow them down. The brain dump lets the AI do the initial organisation.",
  modifier: null, modDef: null,
}
```

**Persona 2 — Slide 8: Priya the Conversationalist**
```js
{
  name: "Priya", initial: "P",
  role: "Strategy Analyst",
  color: "#805AD5",
  tags: ["Exploring angles", "Drafting proposals", "Pressure-testing ideas"],
  approach: "Conversational",
  approachDef: "Build the output across multiple turns. Start with a clear first request, then refine and sharpen through back-and-forth. Each turn adds specificity based on what the AI produced last.",
  bestFor: "Exploratory work. Evolving direction. When you want to steer, not specify.",
  prompt: "Turn 1: Help me think through the three strongest arguments for centralising procurement.\n\nTurn 2: Good — but the second argument is too generic. Make it specific to a 4,000+ employee organisation across multiple regions.\n\nTurn 3: Now anticipate the two most likely objections from regional leaders and how I'd address each one.\n\nTurn 4: Draft the full section — 300 words, direct tone, lead with the strongest argument.",
  output: "Revised argument 2: For organisations operating across 6+ regions with 4,000 employees, centralised procurement unlocks volume discounts of 12–18% on category spend — but only when regional variation in specifications is less than 30%. The key is standardising categories where variation adds no value while preserving regional flexibility where it does.\n\nObjection 1: 'We'll lose responsiveness to local supplier relationships.' Address: centralisation doesn't eliminate local procurement — it consolidates only the 60% of spend that's already commoditised...",
  why: "Priya doesn't know the final shape when she starts. Conversational prompting lets her steer progressively — co-creating, not delegating.",
  modifier: "Iterative Refinement",
  modDef: "Improve output across turns by giving targeted, specific feedback on what to change.",
}
```

**Persona 3 — Slide 9: Marcus the Structured Input Provider**
```js
{
  name: "Marcus", initial: "M",
  role: "Delivery Lead",
  color: "#38B2AC",
  tags: ["Executive briefings", "Stakeholder summaries", "Board-ready documents"],
  approach: "Structured Input",
  approachDef: "Give the AI detailed context about the audience, purpose, and constraints — everything it needs to get it right first time. Not necessarily the full Blueprint, but rich context front-loaded into one message.",
  bestFor: "High-stakes deliverables. Known audience. When it needs to be right first time.",
  prompt: "I need a 400-word executive summary for the quarterly review. The audience is the CFO and two divisional heads — they care about commercial impact and timeline risk. Cover: (1) progress against milestones, (2) biggest risk + mitigation, (3) one recommendation. Direct tone, no jargon.\n\n[Notes attached]",
  output: "1. Milestone Progress: Three of four Q2 milestones are complete or on track. The shared-services migration (Milestone 3) is 2 weeks ahead of schedule, driven by early vendor alignment. Milestone 4 (CRM integration) is at risk — see below.\n\n2. Risk: CRM data extraction has encountered a format incompatibility with the legacy system that was not identified in the scoping phase. Current delay: 3 weeks. Mitigation: a parallel extraction using the API bridge is being tested this week; results expected by Friday.\n\n3. Recommendation: Approve the revised CRM timeline at Thursday's SteerCo and reallocate 2 FTE from the completed Milestone 1 workstream to support the extraction team.",
  why: "Marcus's outputs go straight to senior leaders. No iteration window — it needs to land first time. Front-loading context eliminates guesswork.",
  modifier: "Few-Shot Examples",
  modDef: "Show the AI what good looks like by providing 1–3 reference examples it should match.",
}
```

**Persona 4 — Slide 10: Aisha the Brainstormer**
```js
{
  name: "Aisha", initial: "A",
  role: "Communications Lead",
  color: "#E53E3E",
  tags: ["Generating alternatives", "Challenging assumptions", "Finding fresh angles"],
  approach: "Brainstorming Partner",
  approachDef: "Use the AI to expand your thinking — generating options, challenging assumptions, finding angles you haven't considered. The AI is a thinking partner, not a production tool.",
  bestFor: "Creative work. Messaging and framing. When you need perspectives you're too close to see.",
  prompt: "I'm writing the internal announcement for the restructuring. Before I finalise:\n\n1. Give me three alternative opening angles I haven't considered\n2. What are the two most likely emotional reactions from mid-level managers?\n3. Read my draft as the most sceptical reader. What would they push back on?\n\n[Draft attached]",
  output: "Alternative angles:\n(1) Lead with what's NOT changing — anchor stability before introducing change.\n(2) Lead with the problem the restructuring solves — make it feel necessary, not imposed.\n(3) Lead with a question: 'What would we do differently if we were starting from scratch?' — invites buy-in.\n\nMost likely emotional reactions from mid-level managers:\n1. Anxiety about role clarity — 'Does this affect my team?'\n2. Fatigue — 'Another restructuring after last year's changes.'\n\nSceptical reader pushback: Paragraph 3 makes a promise ('no roles will be lost') that isn't supported by the specifics that follow. Either add the evidence or soften the claim.",
  why: "Aisha's value is in the quality of her thinking. AI helps her see around corners — surfacing perspectives she'd miss working alone.",
  modifier: "Chain of Thought",
  modDef: "Ask the AI to reason through the problem step by step before producing output.",
}
```

**Persona 5 — Slide 11: Jordan the Blueprint Builder**
```js
{
  name: "Jordan", initial: "J",
  role: "Process Designer",
  color: "#1A202C",
  tags: ["Repeatable reports", "Templated outputs", "Team-wide consistency"],
  approach: "Prompt Blueprint",
  approachDef: "Use the six-component framework — Role, Context, Task, Format, Steps, Checks — to create a precise, reusable template. Invest upfront; the return compounds across every future use.",
  bestFor: "Repeatable tasks. Team-wide consistency. When format and quality must be predictable.",
  prompt: "Role: Senior analyst in operational performance.\nContext: Weekly status report for programme sponsor and three workstream leads. They want milestone progress, risks, resource utilisation. No methodology details.\nTask: Produce this week's status report.\nFormat: Four sections with headers. Max 500 words. Table for milestones. Professional tone.\nSteps: Summarise RAG ratings → flag changed risks → calculate utilisation → recommend 1–2 actions.\nChecks: RAG must match source data. No risk without mitigation. Figures as percentages, not headcount.\n\n[This week's data attached]",
  output: "MILESTONE PROGRESS\n| Milestone | Target | Status | RAG |\n| Shared Services Migration | 15 Mar | On track | 🟢 |\n| CRM Data Extract | 28 Feb | 3 weeks delayed | 🔴 |\n| Vendor Onboarding | 31 Mar | Complete | 🟢 |\n| Change Comms | 15 Apr | On track | 🟡 |\n\nRISKS & ISSUES\n• CRM delay: format incompatibility with legacy system. Mitigation: parallel API extraction in testing.\n• Change Comms: regional teams report confusion about new escalation paths. Mitigation: supplementary FAQ being drafted...",
  why: "Jordan does this every Friday. The Blueprint took 20 minutes to write once. It now takes 30 seconds to reuse — just swap in new data.",
  modifier: null, modDef: null,
}
```

---

### SLIDE 12 — Situation Matrix
**Type:** `matrix`
**Section label:** `THE TOOLKIT`

**Layout:** Full-width table with expandable situation rows.

```
Heading: "Which approach fits which situation?"
  Teal underline on: "situation"

Instruction: "The right choice depends on how well you know
the desired output and whether the task repeats. Click any
situation row to see a real-world example."
  fontSize: 11, color: "#4A5568", lineHeight: 1.5
```

**Legend row:**
```
Row 1: ★ Best fit (teal) · ◐ Can work (orange) · ○ Not ideal (muted)
Row 2: ■ Primary approaches (navy square) · ■ Add-on techniques (blue #2B6CB0 square)
  fontSize: 10, gap: 16px
```

**Table structure:**
```
Columns split into two visual groups:
  Primary (columns 1–3): "Brain Dump", "Conversational", "Blueprint"
    Header background: #F7FAFC, text: #1A202C, fontWeight: 700
  Add-on (columns 4–6): "+ Chain of Thought", "+ Few-Shot", "+ Iterative"
    Header background: #EBF8FF, text: #2B6CB0, fontWeight: 700
    Left border on first add-on column: 1px solid #BEE3F8

Row height: padding: "10px 8px" per cell
Heading row: padding: "8px 8px"
```

**Matrix data:**
```js
const SITUATIONS = [
  "Unstructured inputs, unknown output",
  "Exploratory work, evolving direction",
  "Repeatable, high-stakes, known format",
  "Complex reasoning needed",
  "Quality/style calibration required",
  "Close but needs refinement",
];

const MATRIX = [
  // BrainDump, Conv, Blueprint, +CoT, +FewShot, +Iterative
  ["★", "◐", "○", "◐", "○", "○"],
  ["◐", "★", "○", "◐", "◐", "★"],
  ["○", "◐", "★", "★", "◐", "◐"],
  ["◐", "◐", "★", "★", "◐", "◐"],
  ["○", "◐", "◐", "○", "★", "◐"],
  ["○", "★", "◐", "◐", "◐", "★"],
];
```

**Expandable situation examples (click row or ▾ chevron):**
```
State: expandedRow: number | null — one row open at a time

| Situation | Example |
|-----------|---------|
| Unstructured inputs | "You have rough notes from a workshop and don't yet know what the deliverable should be" |
| Exploratory work | "You're drafting a proposal and aren't sure of the right angle yet — you want to think through options" |
| Repeatable, high-stakes | "You write the same executive update every Friday — same audience, same structure" |
| Complex reasoning | "You need the AI to work through a trade-off or a multi-step problem before giving you an answer" |
| Quality calibration | "You want the output to match the tone of a previous document or a specific writing style" |
| Close but needs refinement | "The first output is 70% there — you want to sharpen one section without starting again" |

Expanded row style:
  background: "#F7FAFC", borderTop: "1px solid #E2E8F0",
  padding: "8px 16px 8px 14px", fontSize: 11,
  color: "#4A5568", lineHeight: 1.5
```

---

### SLIDES 13–15 — Situational Judgment Exercises
**Type:** `situational-judgment`
**Section label:** `APPLY IT`

**Shared layout (all three slides):** `gridTemplateColumns: 1fr 1fr; gap: 20px`

**Left half — Situation card:**
```
background: "#1A202C", borderRadius: 12, padding: "20px 22px"

Eyebrow: "SITUATION [N] OF 3" — 10px, teal, uppercase
Heading: [situation-specific] — 18px, fontWeight: 800, white
Body: [situation-specific] — 13px, rgba(255,255,255,0.8)

Context block:
  background: "rgba(255,255,255,0.06)", borderRadius: 8,
  padding: "10px 12px"
  Bullet items with small teal dots, fontSize: 12
```

**Right half — Question + options + feedback:**
```
Question: "Which prompting approach fits best?"
  fontSize: 14, fontWeight: 700, color: "#1A202C"

Three option buttons (stacked, full width):
  Default: white bg, border: "1px solid #E2E8F0", borderRadius: 10,
           padding: "12px 14px"
  Selected (pre-check): border: "2px solid #38B2AC", background: "#E6FFFA"
  Correct revealed: border: "2px solid #48BB78", background: "#F0FFF4",
                    "★ Best fit" green pill badge
  Incorrect revealed: border: "2px solid #FC8181", background: "#FFF5F5"

"Check Answer" button: teal fill, white text, pill,
  padding: "9px 22px", disabled until selection

Feedback panel (after check):
  background: "#F7FAFC", border: "1px solid #E2E8F0",
  borderRadius: 10, padding: "12px 14px", marginTop: 12
  Correct: green left border (4px solid #48BB78)
  Incorrect: orange left border (4px solid #ED8936)
```

**SLIDE 13 content:**
```
Heading: "Unstructured start."
Body: "You have rough notes from a brainstorming session and need
to identify themes before deciding what the deliverable should be."
Bullets: "Three pages of workshop notes", "No clear output format yet",
         "30 minutes before the next meeting"
Options: ["Brain Dump", "Conversational", "Blueprint"]
Correct: 0 (Brain Dump)
Feedback:
  0: "Exactly right. You don't know the output shape yet — let the
      AI find the structure in your raw thinking."
  1: "Could work iteratively, but with this much unstructured input
      a brain dump gets you to structure faster. Conversational works
      better once you have a direction."
  2: "Requires you to specify format and structure upfront — but you
      don't have that clarity yet. Blueprint is for when you know
      what good looks like."
```

**SLIDE 14 content:**
```
Heading: "Weekly. Same format. High stakes."
Body: "You need to produce a status update that three senior
stakeholders will read. You'll do this same task every Friday
for three months."
Bullets: "Known audience and format", "Quality must be consistent",
         "Runs on new data each week"
Options: ["Brain Dump", "Conversational", "Blueprint"]
Correct: 2 (Blueprint)
Feedback:
  0: "Would produce something each week, but quality would vary.
      When consistency and repeatability matter, invest upfront."
  1: "Good for a first draft. But you'd redo the iteration every
      Friday. The Blueprint approach lets you build once and reuse."
  2: "A reusable template where you just swap in new data each week.
      The upfront effort compounds into efficiency and consistent
      quality over time."
```

**SLIDE 15 content:**
```
Heading: "Direction unknown. Thinking out loud."
Body: "You're drafting a section of a proposal and you're not sure
about the right angle. You want to explore a few directions before
committing."
Bullets: "Blank page, multiple possible angles",
         "No final output shape yet",
         "You want to steer, not specify"
Options: ["Brain Dump", "Conversational", "Blueprint"]
Correct: 1 (Conversational)
Feedback:
  0: "Could surface initial ideas, but exploration requires the
      ability to steer across turns — which brain dump doesn't give you."
  1: "When you want to explore and steer, conversational gives you
      control. Each turn sharpens the direction. Exactly the right fit."
  2: "Locks you into a format before you've decided the angle. Structure
      becomes a constraint here, not a help."
```

---

### SLIDE 16 — Bridge to Prompt Playground
**Type:** `bridge`
**Section label:** `WHAT'S NEXT`

**Full-bleed teal background.** Use `position: absolute; inset: 0` to fill the content area.

**Layout:** Two columns within the teal fill.

**Left column (55%):**
```
Eyebrow: "WHAT'S NEXT"
  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
  letterSpacing: "0.12em", textTransform: "uppercase"

Heading: "Now build one."
  fontSize: 28, fontWeight: 800, color: "#FFFFFF"

Body: "You've met five professionals who've each figured out their
approach. You've seen the toolkit and the matrix. The next step is
to use it on a real piece of your own work."
  fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.7,
  maxWidth: 380

CTA button:
  text: "Open Prompt Playground →"
  background: "#FFFFFF", color: "#38B2AC",
  padding: "12px 28px", borderRadius: 24,
  fontSize: 14, fontWeight: 700, border: "none"
  href: "/app/toolkit/prompt-playground"
```

**Right column (45%) — panel:**
```
background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: "20px"

Heading: "In the Playground, you'll:"
  fontSize: 13, fontWeight: 700, color: "#FFFFFF"

Four bullet items (white circle bullets, 6px):
  1. "Choose a real task from your current work"
  2. "Decide which approach fits using the situation matrix"
  3. "Build your prompt with the right technique"
  4. "Compare your output against the quality markers
      from this module"
  Item style: fontSize: 12, color: "rgba(255,255,255,0.9)",
              lineHeight: 1.6
```

---

## 4. New State Variables

Add these to ELearningView.tsx alongside existing state:

```typescript
// Slide 6: sequential context bar reveal
const [contextStep, setContextStep] = useState(0); // 0–6

// Slides 13–15: situational judgment
const [sjAnswers, setSjAnswers] = useState<Record<number, number | null>>({});
const [sjChecked, setSjChecked] = useState<Record<number, boolean>>({});

// Slide 5: active tab
const [scenarioTab, setScenarioTab] = useState<'rushed' | 'thorough'>('rushed');

// Slide 12: expanded matrix row
const [expandedMatrixRow, setExpandedMatrixRow] = useState<number | null>(null);

// Generic: expandable accordion sections
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
```

Reset `contextStep` when navigating away from slide 6. Reset `sjAnswers`/`sjChecked` entries are persistent within the session (learner can navigate back to review their answers).

---

## 5. Next Button Interception (Slide 6)

The player's Next button handler must be modified. Currently it calls `goToSlide(currentSlide + 1)`. Change the handler to:

```typescript
const handleNext = () => {
  if (currentSlide === 6 && contextStep < 6) {
    setContextStep(s => s + 1);
    return;
  }
  if (isLastSlide) {
    onCompletePhase();
  } else {
    goToSlide(currentSlide + 1);
  }
};
```

And the Next button label:
```typescript
const nextLabel = isLastSlide
  ? 'Finish E-Learning →'
  : (currentSlide === 6 && contextStep < 6)
    ? 'Reveal next component →'
    : 'Next →';
```

---

## 6. Files to Modify

| File | Change |
|------|--------|
| `hooks/useLevelData.ts` | Line with `TOTAL_SLIDES = 13` → change to `TOTAL_SLIDES = 16` |
| `components/app/level/ELearningView.tsx` | Full replacement of: SLIDES array, all slide renderer functions, renderSlide() switch, add new state variables and Next button interception |

**Do NOT modify:** The player shell (top bar, progress dots, fullscreen toggle, nav button styles). Only the slide content renderers and the Next button click handler logic change.

---

## 7. Content Assets

| Asset | Path | Used on | Fallback |
|-------|------|---------|----------|
| McKinsey logo | `/public/logos/mckinsey.png` | Slide 2 | Text badge: "McKinsey & Company" in fontWeight 700, fontSize 11, color "#1A202C" |

---

## 8. Summary of All Slides

| # | Section | Type | Core Idea |
|---|---------|------|-----------|
| 1 | PROMPT ENGINEERING | courseIntro | Learning objectives, meta, tone-setting |
| 2 | THE REALITY | evidence | 75% adoption — technology is here |
| 3 | THE REALITY | chart | Same tools, different results — usage vs. expectations bar chart |
| 4 | THE REALITY | pyramid | Prompting as the foundational layer (coding analogy) |
| 5 | SEE THE DIFFERENCE | comparison | Manager onboarding scenario — rushed vs. thorough briefing |
| 6 | SEE THE DIFFERENCE | interactive-sequential | Context bar — sequential component reveal via Next button |
| 7 | THE APPROACHES | persona | Sam — Brain Dump |
| 8 | THE APPROACHES | persona | Priya — Conversational (+ Iterative Refinement) |
| 9 | THE APPROACHES | persona | Marcus — Structured Input (+ Few-Shot Examples) |
| 10 | THE APPROACHES | persona | Aisha — Brainstorming Partner (+ Chain of Thought) |
| 11 | THE APPROACHES | persona | Jordan — Prompt Blueprint |
| 12 | THE TOOLKIT | matrix | Situation × approach matrix with expandable rows |
| 13 | APPLY IT | situational-judgment | Scenario: Unstructured start (answer: Brain Dump) |
| 14 | APPLY IT | situational-judgment | Scenario: Weekly repeatable (answer: Blueprint) |
| 15 | APPLY IT | situational-judgment | Scenario: Exploratory writing (answer: Conversational) |
| 16 | WHAT'S NEXT | bridge | Bridge to Prompt Playground |

---

*PRD version: 2.0 · Ready for Claude Code implementation*
