# PRD: Level 1 E-Learning Module — Prompt Engineering
**Version:** 2.0  
**Status:** Ready for Claude Code  
**File path:** `/src/pages/learn/level-1-prompt-engineering.tsx`  
**Route:** `/learn/level-1`

---

## MANDATORY: Read Before Writing Any Code

Before writing any code for this page, read and follow these skill documents:
```
ELEARNING_DESIGN_SKILL.md   — Content design principles, five-beat structure, slide type pedagogy
SKILL.md                    — React implementation, brand tokens, component specs, player architecture
```
Every decision not explicitly stated in this PRD defaults to the SKILL documents. Do not invent layout, colour, or component patterns.

---

## 1. Overview

### What this page is
A self-contained learning journey page for Level 1 of the Oxygy AI Upskilling Framework. It hosts an 11-slide interactive e-learning module on Prompt Engineering, two curated articles with reflection prompts, and two videos with knowledge check quizzes. It concludes with a handoff CTA to the Prompt Playground.

### Where it lives in the site
A subpage accessible via the **"Course Resources" dropdown** in the site navigation. It is a full separate route at `/learn/level-1`, not a section of the main page.

### Purpose
- **For external clients:** Demonstrates Oxygy's approach to Level 1 AI upskilling — the quality, depth, and interactivity of the learning content
- **For internal learners:** The actual learning experience for Prompt Engineering within Level 1 of the framework

### Core learning argument
The difference between generic AI outputs and professional-quality outputs is not the tool — it's what you give the tool to work with. This module teaches the full prompting toolkit: a structured framework, alternative approaches for different situations, and the judgment to choose between them.

### Key design principles for this module
These principles are in addition to the SKILL documents and are specific to this module:

1. **Evidence-first, not failure-first.** Beat 1 opens with data and observable demonstrations, never with frustration scenarios or implied learner failure.
2. **Role-agnostic and function-agnostic throughout.** Every scenario, example, and exercise must resonate across roles (consulting, BD, PM, HR, L&D, analytics, ops, comms, IT), seniority levels, and organisational contexts. No named job titles in scenario setups.
3. **Tool-agnostic.** No references to specific AI tools (ChatGPT, Claude, Copilot) in teaching content. Use "your AI tool" or "the AI." Exception: the Prompt Playground handoff in Beat 5.
4. **No "one right approach."** The Prompt Blueprint is presented as one tool in a broader toolkit. The module's culminating message is situational judgment, not framework compliance.
5. **Vertical balance.** Content distributed evenly across the 460px content area — no top-heavy slides with empty space below.
6. **Expandable content for dense slides.** Long prompts, full AI outputs, and detailed examples use collapsible accordion sections. Default state is scannable; expanded state gives full detail.

---

## 2. Navigation

### Course Resources dropdown
Follow the same navigation pattern established in the existing site. Add this module as an item in the Course Resources dropdown:

```
Section header: "LEVEL 1"
Item:
  - Label: "Prompt Engineering"
  - Sublabel: "Foundations · 11 slides · ~45 min"
  - href: "/learn/level-1"
  - Level badge: "L1" (mint bg, teal text)
```

### Route
```tsx
<Route path="/learn/level-1" element={<Level1PromptEngineering />} />
```

---

## 3. Page Identity

| Field | Value |
|---|---|
| Level | 1 |
| Level descriptor | Foundations & Awareness |
| Page h1 | Prompt Engineering Essentials |
| Teal underline on | "Prompt Engineering" |
| Hero description | Learn what separates professionals who get consistently excellent AI outputs from those who get generic ones — and build the skills to join the first group. This module covers the full prompting toolkit: from unstructured brain dumps to structured blueprints, and the judgment to know which approach fits each situation. |
| Meta tags | `~45 min total` · `11 slides` · `2 articles` · `2 videos` · `Beginner friendly` |
| Breadcrumb | Course Resources › Level 1 › Prompt Engineering |
| File | `/src/pages/learn/level-1-prompt-engineering.tsx` |

---

## 4. Slides — Full Content Specification

All slides follow the SKILL component specs exactly. Layout, styling, and interaction rules are in the SKILL — do not redefine them here.

### Composition rule (applies to every slide)
Content must be visually balanced across the full 460px content area:
- **Header zone (~80–90px):** Section eyebrow, heading, teal accent phrase
- **Primary content zone (~280px):** Core teaching content, centred vertically in available space
- **Supporting zone (~80–90px):** Pull quotes, footnotes, contextual links anchoring the bottom

No slide should cluster all content in the upper half with empty space below.

---

### Slide 1 — Evidence Opening
**Beat:** SITUATION | **Section label:** `THE REALITY`

**New slide type required: `"evidence"`**
Two-column layout: text left (55%), stat cards right (45%).

**Left panel:**
```
eyebrow: "THE REALITY"

heading: "AI adoption is accelerating. AI skill isn't."
tealWord: "skill isn't"

body: "Most professionals now use AI tools regularly at work. 
Very few have ever been shown what separates a prompt that 
produces useful output from one that doesn't."
```

**Right panel — three stat cards:**
Stacked vertically with 10px gap. Each card: white bg, `1px solid C.border`, borderRadius 12, padding `14px 18px`. Display as flex row: large stat number (left, 28px, DM Sans 800) + label text and source (right).

```
Stat 1:
  value: "75%"
  valueColour: C.teal
  label: "of knowledge workers now use generative AI at work"
  source: "McKinsey, 2024"

Stat 2:
  value: "15%"
  valueColour: C.error
  label: "have received any structured prompting training"
  source: "Deloitte, 2024"

Stat 3:
  value: "3–5×"
  valueColour: C.navy
  label: "output quality variance from prompt structure alone"
  source: "MIT Sloan, 2024"
```

**Design note:** The visual contrast between Stat 1 (75%, teal — high adoption) and Stat 2 (15%, red — low training) does the pedagogical work. The learner sees the gap immediately.

**Vertical balance:** Stats occupy the right column at even vertical spacing. Left-panel text aligns to the top third; bottom third has breathing room or a subtle footnote if needed.

---

### Slide 2 — Parallel Demonstration
**Beat:** SITUATION | **Section label:** `THE REALITY`

**Type:** `"concept"` (two-column with custom visual panel)

This slide requires the **expandable accordion pattern** for prompt text and AI output.

**Header zone (compact, ~70px):**
```
eyebrow: "THE REALITY"

heading: "Same task. Same tool. Very different results."
tealWord: "Very different"

body: "Watch what happens when the same request — summarising 
key findings for a stakeholder meeting — is approached two 
different ways."

footnote: "This isn't about one being right and the other 
wrong. It's about understanding what changes in the output 
— and why."
```
Footnote style: 11px, C.muted, italic, positioned below body with 6px gap.

**Primary content zone — two side-by-side cards:**
Use `gridTemplateColumns: "1fr 1fr"`, gap 12px. Each card has a header bar and expandable content sections.

**Card A — "Approach 1":**
```
Header bar:
  bg: C.bg
  label: "APPROACH 1" (11px, fontWeight 700, C.muted, 
         uppercase, letterSpacing 1)

PROMPT section:
  Section label: "PROMPT" (10px, 700, C.muted, uppercase)
  Default (collapsed): Show full prompt — it is short enough 
    to display without truncation.
  Content:
    "Summarise the key findings from yesterday's session 
     for the steering committee.
     
     [Session transcript attached below]"

AI OUTPUT section:
  Section label: "AI OUTPUT" (10px, 700, C.muted, uppercase)
  Expandable: Yes — show first 2 lines by default, 
    "Show full output ▾" toggle to reveal rest.
  Default preview (2 lines, faded gradient mask at bottom):
    "The session covered several important topics. Key 
     findings include progress on workstream deliverables, 
     some challenges with timelines, and next steps for 
     the team."
  Full content (revealed on expand):
    "The session covered several important topics. Key 
     findings include progress on workstream deliverables, 
     some challenges with timelines, and next steps for 
     the team. The committee should note that overall the 
     project is tracking well with a few areas requiring 
     attention. It is recommended that the team continue 
     to monitor progress and escalate any issues as needed."
```
Output style: white bg, `1px solid C.border`, borderRadius 8, padding `10px 14px`, fontSize 12, color C.light (deliberately muted to signal generic quality).

**Card B — "Approach 2":**
```
Header bar:
  bg: C.tealLight
  label: "APPROACH 2" (11px, fontWeight 700, C.tealDark, 
         uppercase, letterSpacing 1)

PROMPT section:
  Section label: "PROMPT" (10px, 700, C.muted, uppercase)
  Expandable: Yes — show first 3 lines by default, 
    "Show full prompt ▾" toggle to reveal rest.
  Default preview (3 lines, faded gradient mask):
    "You are a senior professional preparing a 300-word 
     debrief for the steering committee. The audience 
     includes senior leaders who care about commercial 
     impact and timeline risk, not methodology."
  Full content (revealed on expand):
    "You are a senior professional preparing a 300-word 
     debrief for the steering committee. The audience 
     includes senior leaders who care about commercial 
     impact and timeline risk, not methodology. Using the 
     session transcript attached below, structure the 
     summary as: (1) three key findings ranked by business 
     impact, (2) one risk flagged with a proposed 
     mitigation, (3) a clear recommendation for the next 
     48 hours. Keep the tone direct and evidence-based. 
     No generic phrases — every finding must reference 
     specific data points from the transcript.
     
     [Session transcript attached below]"

AI OUTPUT section:
  Section label: "AI OUTPUT" (10px, 700, C.muted, uppercase)
  Expandable: Yes — show first 3 lines by default.
  Default preview (3 lines):
    "1. Cost synergies are tracking 12% ahead of the 
     integration case — driven by procurement consolidation 
     in Q2. This justifies accelerating the shared-services 
     migration by one quarter."
  Full content (revealed on expand):
    "1. Cost synergies are tracking 12% ahead of the 
     integration case — driven by procurement consolidation 
     in Q2. This justifies accelerating the shared-services 
     migration by one quarter.

     2. Commercial team attrition has risen to 9.3% since 
     the announcement — concentrated in the mid-market 
     segment. Retention interventions should target this 
     group specifically within the next two weeks.

     3. The technology migration timeline has slipped by 
     three weeks due to a dependency on the legacy CRM 
     data extract. Current revised go-live: 14 March.

     Risk: If mid-market attrition continues at this rate, 
     Q3 revenue targets are at risk of a 4–6% shortfall. 
     Proposed mitigation: accelerate the retention bonus 
     programme approved in the last board cycle.

     Recommendation: Approve the revised technology 
     timeline at Thursday's SteerCo and trigger the 
     retention programme this week."
```
Output style: white bg, `1px solid C.border`, borderRadius 8, padding `10px 14px`, fontSize 12, color C.navyMid (deliberately darker to signal specific, professional quality).

**Expandable accordion interaction:**
```
Toggle label style:
  fontSize: 11, fontWeight: 600, color: C.teal, 
  cursor: "pointer", display: "inline-flex", 
  alignItems: "center", gap: 4, marginTop: 6

Collapsed label: "Show full [prompt/output] ▾"
Expanded label: "Show less ▴"

Transition: max-height with 200ms ease, opacity 0→1
```

**Critical design note:** Both cards include "[Session transcript attached below]" in their prompts. This makes clear that both approaches include the same source material — the only difference is the prompt itself. This is essential for the pedagogical point.

---

### Slide 3 — Tension Statement
**Beat:** TENSION | **Section label:** `THE GAP`

**Type:** `"statement"` (full-width typographic statement — adapted from existing `darkStatement` or `statement` patterns)

White background. Content vertically centred in the 460px area.

```
eyebrow: "THE GAP"

heading: "You can tell when an AI output is good."
  (fontFamily: F.h, fontSize: 26, fontWeight: 700, 
   color: C.navy, lineHeight: 1.3)

subheading: "But can you explain what made your prompt 
produce it?"
  (fontFamily: F.h, fontSize: 20, fontWeight: 600, 
   color: C.navy, lineHeight: 1.4)
  Teal-coloured phrase: "explain what made your prompt 
  produce it" — render in C.teal, not as underline but 
  as coloured text (exception to the normal underline 
  rule, because this is a tension statement where the 
  coloured phrase IS the tension)

divider: 48px wide, 2px height, C.border, marginTop: 20, 
         marginBottom: 16

footnote: "Most professionals can recognise quality in 
AI outputs. Very few can reliably reproduce it — because 
they've never had a framework for understanding what's 
actually happening between their input and the AI's 
response."
  (fontSize: 14, color: C.light, fontFamily: F.b, 
   lineHeight: 1.7, fontStyle: "italic", maxWidth: 560)
```

**Vertical balance:** Heading + subheading centred at roughly the 35% mark. Divider and footnote fill the lower portion. No content in the bottom 20% — the white space after the footnote is intentional breathing room.

---

### Slide 4 — Quality Spectrum (Gap Diagram)
**Beat:** TENSION | **Section label:** `THE GAP`

**New slide type required: `"gapDiagram"`**
Three-panel horizontal layout with centre connector.

**Header zone:**
```
eyebrow: "THE GAP"

heading: "What moves a prompt from generic to specific?"
tealWord: "generic to specific"
```

**Three-panel layout:**
`gridTemplateColumns: "1fr auto 1fr"`, alignItems: "stretch"

**Left panel — "Low-context prompt":**
```
Top accent bar: 4px height, C.peachDark (#F5B8A0)
Border: 1px solid C.border
borderRadius: "12px 0 0 12px"
Padding: 16px 18px

Title: "LOW-CONTEXT PROMPT"
  (fontFamily: F.h, fontSize: 13, fontWeight: 700, 
   color: C.navy, textTransform: uppercase, 
   letterSpacing: 0.5, marginBottom: 10)

Attribute list (3 items, each with × icon in C.error):
  - "Single instruction"
  - "No audience or constraints specified"
  - "AI fills every gap with assumptions"

Attribute style: flex row, gap 8. Icon: C.error, 14px.
Text: fontFamily F.b, fontSize 12, color C.body, 
lineHeight 1.5. Gap between items: 6px.
```

**Centre panel — gap connector:**
```
Background: C.bg
borderTop/borderBottom: 1px solid C.border
minWidth: 140
padding: 12px 20px
Flex column, centred

Label: "WHAT MOVES YOU FROM HERE → TO HERE?"
  (fontFamily: F.b, fontSize: 10, fontWeight: 700, 
   color: C.muted, textAlign: center, letterSpacing: 1, 
   textTransform: uppercase, marginBottom: 8)

Gradient bar: 
  width: 100%, height: 6px, borderRadius: 3
  background: linear-gradient(90deg, C.peachDark, 
              C.muted 40%, C.teal)
  opacity: 0.7

Question mark circle:
  marginTop: 10, width: 32, height: 32, borderRadius: 50%
  background: C.tealLight, border: 2px solid C.teal
  Font: F.h, 16px, 700, C.teal
  Content: "?"
```

**Right panel — "High-context prompt":**
```
Top accent bar: 4px height, C.teal
Border: 1px solid C.border
borderRadius: "0 12px 12px 0"
Padding: 16px 18px

Title: "HIGH-CONTEXT PROMPT"
  (same style as left panel title)

Attribute list (3 items, each with ✓ icon in C.success):
  - "Task + surrounding information"
  - "Audience, constraints, and success criteria included"
  - "AI works with specifics, not assumptions"
```

**Below panels — teal callout:**
```
borderLeft: 4px solid C.teal
background: C.tealLight
borderRadius: "0 8px 8px 0"
padding: 12px 16px
marginTop: 16

Text: "The rest of this module gives you the tools to 
move deliberately along this spectrum — and to choose 
the right position for each task."
  (fontFamily: F.b, fontSize: 13, color: C.navyMid, 
   lineHeight: 1.6)
```

---

### Slide 5 — The Prompt Blueprint
**Beat:** CONCEPT | **Section label:** `THE TOOLKIT`

**Type:** `"rctf"` — extended from 4 to 6 elements

The existing `rctf` type uses a 2×2 grid of 4 elements. This slide needs a **3×2 grid** for 6 elements. Extend the type to support 6 elements with the same card style.

```
eyebrow: "THE TOOLKIT"

heading: "The Prompt Blueprint: six components, one 
complete instruction"
tealWord: "Prompt Blueprint"

subheading: "Each component fills a specific gap that 
most prompts leave empty. You don't always need all six 
— but knowing what's available means you can choose 
deliberately."
```

**3×2 grid, gap 10px. Each element:**
Colour pill (key name, bg colour, white text) + description (12px, C.body) + example prompt box (white bg, colour left border, italic text).

```
Element 1:
  key: "ROLE"
  color: "#667EEA"
  light: "#EBF4FF"
  desc: "Who the AI should be — their expertise, 
         perspective, and professional context"
  example: "You are a senior professional with 10 years 
of experience in organisational transformation."

Element 2:
  key: "CONTEXT"
  color: "#38B2AC"
  light: "#E6FFFA"
  desc: "Your situation, constraints, and what the AI 
         needs to know about the background"
  example: "We're six weeks into a technology rollout. 
Adoption is strong in operations but the commercial 
teams are showing resistance."

Element 3:
  key: "TASK"
  color: "#ED8936"
  light: "#FFFBEB"
  desc: "Exactly what to produce — specific, 
         unambiguous, and measurable"
  example: "Draft a stakeholder update on the current 
status, covering progress, risks, and recommended 
next steps."

Element 4:
  key: "FORMAT"
  color: "#48BB78"
  light: "#F0FFF4"
  desc: "Output shape, length, tone, and structure"
  example: "Three short paragraphs. Professional tone. 
No jargon. Maximum 300 words."

Element 5:
  key: "STEPS"
  color: "#9F7AEA"
  light: "#FAF5FF"
  desc: "The reasoning sequence you want the AI to 
         follow before producing output"
  example: "First assess the impact of the delay, then 
identify the top three risks, then recommend actions 
for the next 48 hours."

Element 6:
  key: "CHECKS"
  color: "#F6AD55"
  light: "#FFFBEB"
  desc: "Validation rules and constraints the output 
         must meet"
  example: "No generic phrases. Every finding must 
reference specific data. Flag assumptions explicitly."
```

**Below the grid — qualifier note:**
```
borderLeft: 4px solid C.navy
background: C.bg
borderRadius: "0 8px 8px 0"
padding: 10px 16px
marginTop: 12

Text: "Role, Context, Task, and Format are the 
foundation. Steps and Checks add precision for 
high-stakes or repeatable work. Not every prompt 
needs all six."
  (fontSize: 12, color: C.light, fontFamily: F.b, 
   lineHeight: 1.6)
```

---

### Slide 6 — The Prompting Spectrum
**Beat:** CONCEPT | **Section label:** `THE TOOLKIT`

**Type:** `"spectrum"` (existing type — three interactive positions)

```
eyebrow: "THE TOOLKIT"

heading: "The Blueprint is one approach. Here are 
the others."
tealWord: "one approach"

body: "The best prompt isn't the most structured one. 
It's the one that matches your situation. These three 
approaches sit on a spectrum from unstructured to 
fully specified — and all three have tasks where 
they're the strongest choice."
```

**Spectrum track:** gradient from mint (left) → teal (right). Three clickable handle dots at 0%, 50%, 100%.

**Position labels below track (click to switch):**

```
Position 0 — "Brain Dump"
  desc: "Pour in everything — rough notes, half-formed 
thoughts, scattered observations — and let the AI find 
the structure. You're not organising your thinking 
first. You're using the AI to help you organise it."
  bestFor: "Early-stage thinking, when you don't yet 
know what the output should look like, when speed 
matters more than precision."
  example: "Here's everything from the session today — 
my rough notes, some thoughts on next steps, a few 
concerns I haven't fully worked through yet. Help me 
find the structure in this. What are the three most 
important themes, and what am I missing?

[Paste raw notes, bullet points, voice memo 
transcript — unedited]"

Position 1 — "Conversational"
  desc: "Build the output across multiple turns. Start 
with a clear first request, then refine, redirect, and 
sharpen through back-and-forth. Each turn adds 
specificity based on what the AI produced last."
  bestFor: "Iterative work, creative exploration, when 
the task evolves as you work on it, when you want to 
steer the output progressively."
  example: "Turn 1: Help me structure the key messages 
for a presentation to senior leadership next week.

Turn 2: Good start. The audience is specifically the 
finance committee — they care about cost impact, not 
methodology. Adjust for that.

Turn 3: Make the opening more direct — they're 
time-poor and need the business case in the first 
30 seconds."

Position 2 — "Structured (Blueprint)"
  desc: "Invest upfront in a complete, precise 
instruction using the Prompt Blueprint components. 
Everything the AI needs is in one message — no 
iteration required."
  bestFor: "Repeatable tasks, high-stakes outputs, 
prompts you'll share with colleagues or save as 
templates, situations where consistency matters."
  example: "Role: Senior professional with experience 
in organisational change. Context: Preparing a 
quarterly review for the leadership team. The 
audience cares about progress against milestones 
and risks to timeline. Task: Draft a 400-word 
executive summary covering progress, risks, and 
recommendations. Format: Three sections with headers. 
Professional tone. No jargon. Steps: First summarise 
progress against the three agreed milestones, then 
flag the highest-priority risk with a proposed 
mitigation, then recommend one action for the 
next quarter. Checks: Every claim must reference 
a specific data point. No generic phrases."
```

**Default state:** `spectrumPos: 2` (Blueprint position selected by default). Learner clicks any position to see its panel.

---

### Slide 7 — Modifier Techniques
**Beat:** CONCEPT | **Section label:** `THE TOOLKIT`

**Type:** `"concept"` (text left, visual panel right)

```
eyebrow: "THE TOOLKIT"

heading: "These aren't separate approaches. They're 
amplifiers."
tealWord: "amplifiers"

body: "Add these on top of any prompting approach — 
brain dump, conversational, or Blueprint. They change 
how the AI reasons, not what information you give it. 
These are established prompting techniques used across 
the industry."

pullQuote: "A Blueprint tells the AI what to work with. 
A modifier tells it how to think."
```

**Right panel — three stacked modifier cards:**
Each card: white bg, `1px solid C.border`, borderRadius 10, padding `14px 16px`. Cards stacked with 8px gap.

```
Card 1:
  pill: "CHAIN OF THOUGHT" 
    (bg: "#E53E3E", white text, fontSize: 10, 
     fontWeight: 700, borderRadius: 12, padding: "2px 8px")
  definition: "Ask the AI to reason through the problem 
step by step before producing output."
    (fontSize: 12, color: C.body, marginTop: 6, 
     marginBottom: 6)
  example (prompt box style):
    "Think through the three most likely objections 
     this audience will raise before drafting the 
     recommendation."

Card 2:
  pill: "FEW-SHOT EXAMPLES"
    (bg: "#805AD5", white text)
  definition: "Show the AI what good output looks like 
by providing 1–3 examples it should match."
  example:
    "Here are two examples of strong executive summaries 
     from previous projects: [Example A] [Example B]. 
     Match this level of specificity and structure."

Card 3:
  pill: "ITERATIVE REFINEMENT"
    (bg: "#DD6B20", white text)
  definition: "Improve the output across multiple turns 
by giving targeted, specific feedback on what to change."
  example:
    "This is a good start. Now make the second section 
     more specific — it reads too similarly to the first. 
     Add the timeline data I mentioned earlier."
```

---

### Slide 8 — When to Use What
**Beat:** CONCEPT | **Section label:** `THE TOOLKIT`

**Type:** `"concept"` (text left, decision framework right)

```
eyebrow: "THE TOOLKIT"

heading: "Two questions. The right approach every time."
tealWord: "right approach"

body: "Before you open your AI tool, ask yourself these 
two questions. Your answers point you to the approach 
that fits this specific task — not a default habit."

pullQuote: "The skill isn't knowing the most structured 
technique. It's knowing which technique to reach for 
right now."
```

**Right panel — decision framework visual:**

A simple two-question flowchart rendered as stacked decision cards.

**Question 1 card:**
```
Header: "DO I KNOW EXACTLY WHAT I WANT?"
  (bg: C.navy, color: white, padding: "10px 16px", 
   borderRadius: "10px 10px 0 0", fontSize: 13, 
   fontWeight: 700, fontFamily: F.h)

Three answer rows (stacked, each is a flex row):

Row 1:
  Answer pill: "YES" (bg: C.success, white, 10px bold)
  Arrow: "→"
  Result: "Structured (Blueprint)" 
    (fontWeight: 600, color: C.navy)
  Detail: "Specify everything upfront"
    (fontSize: 11, color: C.light)

Row 2:
  Answer pill: "SORT OF" (bg: "#ED8936", white)
  Arrow: "→"
  Result: "Conversational"
  Detail: "Build it iteratively, refine as you go"

Row 3:
  Answer pill: "NO" (bg: C.error, white)
  Arrow: "→"
  Result: "Brain Dump"
  Detail: "Let the AI help you find the structure"
```

**Question 2 card (below, connected by a thin 1px C.border line):**
```
Header: "WILL I NEED THIS OUTPUT PATTERN AGAIN?"
  (same style as Question 1 header)

Two answer rows:

Row 1:
  Answer pill: "YES" (bg: C.teal, white)
  Arrow: "→"
  Result: "Save as a template"
  Detail: "Use the Blueprint — it's reusable by design"

Row 2:
  Answer pill: "NO" (bg: C.muted, white)
  Arrow: "→"
  Result: "Use whichever approach fits Question 1"
  Detail: "Optimise for this task, not future ones"
```

**Below the framework — modifier note:**
```
Background: C.bg
border: 1px solid C.border
borderRadius: 8
padding: 10px 14px
marginTop: 10

Text: "For any approach, consider adding a modifier if 
the task involves complex reasoning (Chain of Thought), 
quality calibration (Few-Shot), or multi-step refinement 
(Iterative)."
  (fontSize: 11, color: C.light, fontFamily: F.b)
```

---

### Slide 9 — Contrast: The Same Two Approaches, Decoded
**Beat:** CONTRAST | **Section label:** `NOW YOU CAN SEE IT`

**New slide type required: `"annotatedContrast"`**
Returns to the exact parallel demonstration from Slide 2, now with colour-coded Blueprint annotations.

```
eyebrow: "NOW YOU CAN SEE IT"

heading: "Remember these two approaches? Now you can 
name the difference."
tealWord: "name the difference"
```

**Two-column layout (same grid as Slide 2):**

**Left column — Approach 1 (decoded):**
```
Header bar:
  bg: C.bg
  label: "APPROACH 1 — DECODED"

Prompt shown in prompt box style (same text as Slide 2):
  "Summarise the key findings from yesterday's session 
   for the steering committee.
   
   [Session transcript attached below]"

Annotation layer (expandable accordion, collapsed by 
default, "Show what's missing ▾"):
  Three annotation items, each as a flex row:
  
  Item 1:
    Pill: "ROLE" (bg: #667EEA, white, 10px)
    Text: "No role specified — AI defaults to a generic 
           assistant voice"
    (fontSize: 11, color: C.body)

  Item 2:
    Pill: "CONTEXT" (bg: #38B2AC, white, 10px)
    Text: "No audience — AI doesn't know what the 
           steering committee cares about"

  Item 3:
    Pill: "FORMAT" (bg: #48BB78, white, 10px)
    Text: "No format or constraints — AI guesses at 
           length, tone, and structure"

  Each item: gap 8px between pill and text. 
  Items stacked with 6px gap.
```

**Right column — Approach 2 (decoded):**
```
Header bar:
  bg: C.tealLight
  label: "APPROACH 2 — DECODED"

Prompt shown in prompt box style (same text as Slide 2, 
collapsed with "Show full prompt ▾" accordion).

Annotation layer (expandable accordion, collapsed by 
default, "Show Blueprint mapping ▾"):
  Six annotation items mapping prompt segments to 
  Blueprint components:

  Item 1:
    Pill: "ROLE" (bg: #667EEA)
    Text: "'Senior professional' — gives the AI an 
           expertise level and professional perspective"

  Item 2:
    Pill: "CONTEXT" (bg: #38B2AC)
    Text: "'Leaders who care about commercial impact 
           and timeline risk' — tells the AI what 
           matters to the audience"

  Item 3:
    Pill: "TASK" (bg: #ED8936)
    Text: "'Structure the summary as three findings, 
           one risk, one recommendation' — specific 
           and measurable"

  Item 4:
    Pill: "FORMAT" (bg: #48BB78)
    Text: "'300-word debrief, direct and evidence-based' 
           — clear shape, tone, and length"

  Item 5:
    Pill: "STEPS" (bg: #9F7AEA)
    Text: "'Ranked by business impact' — tells the AI 
           the reasoning sequence to follow"

  Item 6:
    Pill: "CHECKS" (bg: #F6AD55)
    Text: "'No generic phrases, reference specific 
           data points' — validation rules that 
           prevent filler"
```

**Design note:** Both annotation layers are collapsed by default so the slide is scannable. The learner who wants to study the mapping clicks to expand. The learner who gets the point at a glance moves on. This serves both audiences.

---

### Slide 10 — Situational Judgment Exercise
**Beat:** BRIDGE | **Section label:** `APPLY IT`

**Type:** `"branching"` (adapted — three sequential mini-scenarios rather than one scenario with three options)

```
eyebrow: "APPLY IT"

heading: "Three situations. You choose the approach."
tealWord: "You choose"

instruction: "For each scenario, select the prompting 
approach you'd use. There's a strongest choice for 
each — tap to find out why."
```

**Three scenario cards, stacked vertically with 10px gap.**
Each card: collapsed by default showing only the scenario text and three option pills. On selection, expands to show feedback.

**Scenario 1:**
```
scenario: "You have rough notes from a brainstorming 
session — bullet points, half-finished thoughts, a 
few voice memo transcripts. You need to identify the 
key themes before you can even decide what the final 
deliverable should be."

options:
  A: "Brain Dump" 
  B: "Conversational"
  C: "Structured (Blueprint)"

strongestChoice: "A" (Brain Dump)

feedback:
  A (strong): "This is exactly what brain dumps are 
designed for. You don't yet know the output shape, 
so structuring the prompt would force premature 
decisions. Pour everything in and let the AI find 
the patterns."

  B (partial): "Conversational could work — you'd 
iterate toward clarity. But with this much raw, 
unstructured input, a brain dump lets the AI do the 
initial organisation for you. You can switch to 
conversational once themes emerge."

  C (weak): "A Blueprint requires you to specify the 
output format, audience, and success criteria upfront. 
You don't have that clarity yet — that's the whole 
point of this task. Structure would constrain the 
AI's ability to surface unexpected connections."
```

**Scenario 2:**
```
scenario: "You need to produce a weekly status update 
that three different stakeholders will read. You'll 
need to do this same task every Friday for the next 
three months."

options:
  A: "Brain Dump"
  B: "Conversational"
  C: "Structured (Blueprint)"

strongestChoice: "C" (Blueprint)

feedback:
  C (strong): "This is a repeatable, high-consistency 
task with a known audience and format. A Blueprint 
prompt you can reuse every week — just swapping in 
the new data — saves time and ensures consistent 
quality across all three months."

  B (partial): "Conversational would produce a good 
first output. But you'd be re-doing the iteration 
every Friday. For repeatable tasks, invest upfront 
in a structured prompt and save it as a template."

  A (weak): "A brain dump would produce something 
each week, but quality would vary. With three 
stakeholders reading this every Friday, consistency 
and professionalism matter. Structure is worth 
the upfront investment here."
```

**Scenario 3:**
```
scenario: "You're drafting a section of a proposal 
and you're not sure about the right angle. You want 
to explore a few directions before committing to one."

options:
  A: "Brain Dump"
  B: "Conversational"
  C: "Structured (Blueprint)"

strongestChoice: "B" (Conversational)

feedback:
  B (strong): "When you want to explore and steer, 
conversational is the strongest choice. Start with a 
direction, see what comes back, adjust. Each turn 
sharpens the output based on your reactions to the 
previous one. You're co-creating, not delegating."

  A (partial): "A brain dump could help you surface 
initial ideas. But exploration requires steering — 
you need to react and redirect. Conversational gives 
you that control across turns."

  C (weak): "A Blueprint locks you into a specific 
format and output shape before you've decided on the 
angle. For exploratory work, that structure becomes 
a constraint rather than an asset."
```

**Interaction pattern:**
- All three scenarios visible on load (stacked, collapsed)
- Learner taps an option pill for each scenario
- On tap: selected pill gets teal border, feedback panel expands below with responseQuality badge (strong = C.success, partial = C.teal, weak = C.error)
- Learner can change selection before moving to next slide

**Scoring (optional, non-blocking):**
Show a small summary after all three are answered: "You matched [X] of 3 strongest choices." No gate — the learner proceeds regardless.

---

### Slide 11 — Bridge to the Prompt Playground
**Beat:** BRIDGE | **Section label:** `WHAT'S NEXT`

**New slide type required: `"bridge"`**
Full teal background slide. Two-column layout.

```
Background: C.teal (full slide)
```

**Left column (55%):**
```
eyebrow: "WHAT'S NEXT"
  (fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", 
   letterSpacing: 2, textTransform: uppercase)

heading: "Now build one."
  (fontFamily: F.h, fontSize: 28, fontWeight: 800, 
   color: "#FFFFFF", lineHeight: 1.2, marginBottom: 12)

body: "You've got the toolkit — the Blueprint, the 
spectrum, the modifiers, and the judgment to choose 
between them. The next step is to use it on a real 
piece of work. Open the Prompt Playground, pick a 
task from your actual workload, and build your 
first prompt using the techniques from this module."
  (fontSize: 14, color: "rgba(255,255,255,0.9)", 
   fontFamily: F.b, lineHeight: 1.7, maxWidth: 420)

CTA button:
  text: "Open Prompt Playground →"
  style: bg white, color C.teal, padding "12px 28px", 
         borderRadius 24, fontWeight 700, fontSize 14, 
         fontFamily F.b, border none, cursor pointer
  href: "#prompt-playground"
```

**Right column (45%) — darker teal panel:**
```
background: "rgba(0,0,0,0.15)"
borderRadius: 12
padding: 24px

Panel heading: "In the Playground, you'll:"
  (fontSize: 14, fontWeight: 700, color: "#FFFFFF", 
   marginBottom: 16, fontFamily: F.h)

Four items (each with a white circle bullet):

Item 1: "Choose a real task from your current work — 
not a practice exercise"

Item 2: "Decide which prompting approach fits the 
situation using the two-question framework"

Item 3: "Build your prompt using the Blueprint 
components, modifiers, or a combination"

Item 4: "Compare your AI output against the quality 
markers from this module — specificity, audience 
awareness, actionable recommendations"

Item style: flex row, gap 10. Bullet: 6px white 
circle, flexShrink 0, marginTop 5. Text: fontSize 13, 
color "rgba(255,255,255,0.9)", fontFamily F.b, 
lineHeight 1.6.
```

---

## 5. Read Phase — Full Content Specification

### Article 1
```
id: "a1"
title: "What Separates Power Users from Everyone Else 
        When Using AI at Work"
source: "Harvard Business Review"
readTime: "7 min read"
desc: "How structured prompting is changing the way 
knowledge workers interact with AI tools — and what 
consistently separates professionals who get great 
outputs from those who get generic ones."
url: "https://hbr.org"
  (placeholder — replace with actual URL when sourced)
reflection: "In one sentence, what was the single most 
useful idea from this article that you could apply to 
your own work this week?"
```

### Article 2
```
id: "a2"
title: "Why the Way You Ask Matters More Than the 
        Tool You Use"
source: "MIT Technology Review"
readTime: "8 min read"
desc: "A deep-dive into why prompt structure has more 
impact on output quality than model choice — with real 
examples from professional knowledge work across 
industries."
url: "https://technologyreview.com"
  (placeholder — replace with actual URL when sourced)
reflection: "Describe one specific situation from your 
own work where structuring your prompt differently 
could have meaningfully improved the output you 
received."
```

---

## 6. Watch Phase — Full Content Specification

### Video 1
```
id: "v1"
title: "The Prompting Spectrum in Practice"
channel: "Oxygy Learning"
duration: "8 min"
desc: "A live walkthrough of all three prompting 
approaches — brain dump, conversational, and structured 
Blueprint — applied to the same professional task, 
with before-and-after comparisons at each stage."
url: "https://youtube.com"
  (placeholder — replace with actual URL when produced)
quiz:
  q1:
    question: "When is a brain dump approach most 
    effective?"
    options:
      - "When you need a repeatable template for a 
         weekly task"
      - "When you have unstructured thoughts and 
         don't yet know the output shape"
      - "When the audience requires a specific format 
         and professional tone"
      - "When you want to iterate across multiple turns"
    correct: 1
  q2:
    question: "What is the primary difference between 
    the Conversational approach and the Structured 
    Blueprint?"
    options:
      - "Conversational is faster; Blueprint is slower"
      - "Conversational works for creative tasks only; 
         Blueprint works for analytical tasks only"
      - "Conversational builds quality across turns; 
         Blueprint specifies everything upfront in 
         one message"
      - "Conversational doesn't use any Blueprint 
         components; Blueprint uses all six"
    correct: 2
```

### Video 2
```
id: "v2"
title: "Modifier Techniques: Chain of Thought, 
        Few-Shot, and Iterative Refinement"
channel: "Oxygy Learning"
duration: "6 min"
desc: "How the three modifier techniques change AI 
reasoning — with side-by-side examples showing the 
impact of each modifier on the same base prompt."
url: "https://youtube.com"
  (placeholder — replace with actual URL when produced)
quiz:
  q1:
    question: "Modifier techniques change how the AI 
    _____, not what _____ you give it."
    options:
      - "responds / feedback"
      - "reasons / information"
      - "formats / templates"
      - "writes / examples"
    correct: 1
  q2:
    question: "Which scenario would benefit most from 
    a Few-Shot Examples modifier?"
    options:
      - "You need the AI to think step by step through 
         a complex problem before answering"
      - "You want to refine an output that's close but 
         not quite right"
      - "You need the AI to match a specific quality 
         standard or format you've used before"
      - "You're brainstorming and want the AI to 
         explore multiple angles"
    correct: 2
```

---

## 7. Journey Strip — Phase Data

```js
const PHASES = [
  {
    id: "elearn",
    label: "E-Learning",
    icon: "▶",
    time: "~20 min",
    desc: "11-slide interactive module",
  },
  {
    id: "read",
    label: "Read",
    icon: "◎",
    time: "~15 min",
    desc: "2 articles + reflection",
  },
  {
    id: "watch",
    label: "Watch",
    icon: "▷",
    time: "~12 min",
    desc: "2 videos + knowledge check",
  },
  {
    id: "practice",
    label: "Practice",
    icon: "◈",
    time: "~15 min",
    desc: "Prompt Playground →",
    external: true,
  },
];
```

---

## 8. Page Hero — Exact Copy

```
Breadcrumb: Course Resources › Level 1 › 
            Prompt Engineering

Level badge: "LEVEL 1" (mint bg, teal text)
Eyebrow: "FOUNDATIONS & AWARENESS"

h1: "Prompt Engineering Essentials"
    (teal underline on "Prompt Engineering")

Description: "Learn what separates professionals who 
get consistently excellent AI outputs from those who 
get generic ones — and build the skills to join the 
first group. This module covers the full prompting 
toolkit: from unstructured brain dumps to structured 
blueprints, and the judgment to know which approach 
fits each situation."

Meta tags: "~45 min total" · "11 slides" · 
           "Interactive" · "Beginner friendly"

Progress summary (right column):
  Label: "Journey Progress"
  Count: [completedPhases] / 3
  Subtext: "phases completed"
  Progress bar: teal fill
```

---

## 9. Handoff CTA — Practice Phase Content

```
Icon: ◈ (in tealLight circle)
Eyebrow: "NEXT STEP"
Heading: "Prompt Playground"

Description: "Apply your prompting skills to a real 
task from your own work. Build prompts, choose your 
approach, test the modifiers, and compare your outputs 
against the quality markers from this module — then 
save your best work to your personal prompt library."

CTA button: "Open Prompt Playground →"
href: "#prompt-playground"
```

---

## 10. State Architecture

Follow the SKILL exactly. Additional state specific to this page:

```tsx
// Expandable accordion sections (Slides 2, 9)
const [expandedSections, setExpandedSections] = 
  useState<Record<string, boolean>>({});

const toggleExpand = (key: string) => 
  setExpandedSections(prev => ({ 
    ...prev, 
    [key]: !prev[key] 
  }));

// Spectrum position (Slide 6)
const [spectrumPos, setSpectrumPos] = useState(2);

// Situational judgment (Slide 10)
const [scenarioAnswers, setScenarioAnswers] = 
  useState<Record<number, string | null>>({
    0: null, 1: null, 2: null
  });

// Standard player state
const [slide, setSlide] = useState(0);
const [visitedSlides, setVisitedSlides] = 
  useState(new Set([0]));
```

---

## 11. New Slide Types Required

This module requires three slide types not currently defined in the SKILL. These should be added to the component library:

### type: "evidence"
Two-column layout: text left (55%), stat cards right (45%).

Required fields: `heading`, `tealWord`, `body`, `stats` (array: `{ value, valueColour, label, source }`)

Layout:
- Left: Eyebrow + h2 with teal accent + body paragraph
- Right: Vertically stacked stat cards (white bg, bordered, borderRadius 12). Each card: large stat value (28px, DM Sans 800, custom colour) + label text (13px, body) + source (10px, muted, italic)

### type: "gapDiagram"
Three-panel horizontal layout with centre connector.

Required fields: `heading`, `tealWord`, `leftTitle`, `leftAttributes` (array of strings), `rightTitle`, `rightAttributes` (array of strings), `calloutText`

Layout:
- Three panels: left (peach accent), centre (gradient bar + ? circle), right (teal accent)
- Each side panel: accent top bar, title, attribute list with ×/✓ icons
- Callout below panels with teal left border

### type: "annotatedContrast"
Two-column layout returning to a previous parallel demonstration with colour-coded annotations.

Required fields: `heading`, `tealWord`, `leftPrompt`, `leftAnnotations` (array: `{ component, colour, text }`), `rightPrompt`, `rightAnnotations` (array: `{ component, colour, text }`)

Layout:
- Two cards with prompt boxes and expandable annotation layers
- Annotations use RCTF colour-coded pills matching Slide 5's framework colours

### type: "bridge"
Full teal background, two-column action card.

Required fields: `heading`, `body`, `ctaText`, `ctaHref`, `panelHeading`, `panelItems` (array of strings)

Layout:
- Left: heading + body + white CTA button
- Right: darker teal panel with bulleted list of what the learner will do next

---

## 12. Developer Notes

### Dependencies
- This page does not depend on any other page's state or data
- The Prompt Playground (`#prompt-playground`) must exist as a route for the handoff CTA to work
- Article and video URLs are placeholders — replace when actual content is sourced and verified

### Expandable accordion component
Build as a reusable local component within this page file. Pattern:
```tsx
function Expandable({ previewContent, fullContent, 
                      label = "Show more" }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {open ? fullContent : previewContent}
      <button onClick={() => setOpen(!open)}>
        {open ? "Show less ▴" : `${label} ▾`}
      </button>
    </div>
  );
}
```
Style the toggle label as: fontSize 11, fontWeight 600, color C.teal, cursor pointer, marginTop 6. Preview content uses a CSS gradient mask (`linear-gradient(180deg, #000 60%, transparent 100%)`) on the container to create the fade-out effect.

### Vertical balance
Every slide renderer must distribute content across the full 460px. Use `minHeight: 380` on the primary content zone and `justifyContent: "center"` or calculated padding to prevent top-heavy layouts. Test each slide by visual inspection — if the bottom third of the content area is empty, redistribute spacing.

### Three-scenario branching on Slide 10
The standard `branching` type supports one scenario with three options. Slide 10 needs three scenarios with three options each. Extend the branching type or build a custom `situationalJudgment` renderer for this slide. All three scenarios should be visible simultaneously (stacked), not paginated.

### RCTF grid on Slide 5
The existing `rctf` type supports a 2×2 grid of 4 elements. This slide needs a 3×2 grid for 6 elements. Extend the grid layout to `gridTemplateColumns: "1fr 1fr 1fr"` with `gridTemplateRows: "1fr 1fr"`. Keep the same card styling. Reduce internal padding slightly (12px 14px instead of 14px 16px) to fit 6 cards within the available height.

### Article and video URLs
All URLs are placeholders. The team must source and verify actual URLs before production deployment. Do not use broken or fictional URLs in the deployed build — use `#` as href with a `[URL pending]` tooltip until real URLs are available.
