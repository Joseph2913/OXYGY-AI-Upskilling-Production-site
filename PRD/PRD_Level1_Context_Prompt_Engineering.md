# PRD: Level 1 E-Learning Page — Context & Prompt Engineering
**Version:** 1.0  
**Status:** Ready for Claude Code  
**File path:** `/src/pages/learn/level-1-context-engineering.tsx`  
**Route:** `/learn/level-1`

---

## MANDATORY: Read Before Writing Any Code

Before writing any code for this page, read and follow the skill document at:
```
PRD/SKILL-Elearning-Page.md
```
This document defines all layout rules, brand tokens, component specs, slide types, state architecture, and quality requirements. Every decision not explicitly stated in this PRD defaults to the SKILL. Do not invent layout, colour, or component patterns — they are all defined there.

---

## 1. Overview

### What this page is
A self-contained learning journey page for Level 1 of the Oxygy AI Upskilling Framework. It hosts a 13-slide interactive e-learning module, two curated articles with reflection prompts, and two videos with knowledge check quizzes. It concludes with a handoff CTA to the Prompt Playground.

### Where it lives in the site
This is a **subpage** of the main landing page, accessible via the **"Course Resources" dropdown** in the site navigation. It is not a section of the main page — it is a full separate route at `/learn/level-1`.

### Purpose
- For external clients: demonstrates Oxygy's approach to Level 1 AI upskilling — the quality, depth, and interactivity of the learning content
- For internal learners: the actual learning experience for Level 1 of the framework

### Core learning argument
AI outputs are only as good as the context you give them. Learning to engineer that context — through your prompts, your documents, and how you organise your work — is the single highest-leverage AI skill you can develop.

---

## 2. Navigation Changes Required

### 2a. Add "Course Resources" dropdown to Navbar

The existing Navbar (`components/Navbar.tsx`) has three nav items: Learning Plan Generator, AI Tools (dropdown), and Learner Journey. A fourth item must be added: **Course Resources**, implemented as a dropdown menu in the same style as the existing AI Tools dropdown.

**Position:** Add Course Resources after AI Tools, before Learner Journey.

**Dropdown trigger label:** `Course Resources`

**Dropdown contents — initial state (one item only):**
```
Section header: "LEVEL 1"
Item:
  - Label: "Context & Prompt Engineering"
  - Sublabel: "Foundations · 13 slides · ~45 min"
  - href: "/learn/level-1"
  - Level badge: "L1" (mint bg, teal text — same style as AI Tools level badges)
```

**Design note:** The dropdown is built to accommodate future items as Levels 2–5 are added. Each level will get its own section header. For now, only Level 1 is present.

**Dropdown styling — match existing AI Tools dropdown exactly:**
```
background: #FFFFFF
border: 1px solid #E2E8F0
borderRadius: 12px
boxShadow: 0 4px 16px rgba(0,0,0,0.08)
minWidth: 320px
overflow: hidden

Section header:
  padding: 10px 16px 8px
  borderBottom: 1px solid #E2E8F0
  fontSize: 11px, fontWeight: 600
  textTransform: uppercase, letterSpacing: 1px
  color: #A0AEC0

Item row:
  padding: 12px 16px
  display: flex, alignItems: center, gap: 12px
  hover: background #F7FAFC, color #38B2AC
  fontSize: 14px, fontWeight: 500, color: #2D3748

  Left: Level badge pill (mint bg #B2D8F7, teal text #2C9A94, 
        fontSize 11px, fontWeight 700, padding 3px 8px, 
        borderRadius 12px) — shows "L1"
  Centre: 
    - Title line: "Context & Prompt Engineering" 
      (14px, fontWeight 600, color #1A202C)
    - Sublabel: "Foundations · 13 slides · ~45 min" 
      (11px, color #A0AEC0)
  Right: Arrow → (12px, color #A0AEC0)
```

**Active state:** When user is on `/learn/level-1`, the Course Resources nav item gets the active pill style (`bg-[#E6FFFA] text-[#2C9A94]`) matching other active nav items.

**Mobile nav:** Add Course Resources to the mobile menu in the same position. On mobile, show the dropdown items inline (expanded by default, no hover required) with the same section header and item styling.

### 2b. Route setup

Add the route in `App.tsx` (or wherever routes are defined):
```tsx
import Level1Page from './pages/learn/level-1-context-engineering';

// Inside router:
<Route path="/learn/level-1" element={<Level1Page />} />
```

---

## 3. Page Identity

| Field | Value |
|---|---|
| Level | 1 |
| Level descriptor | Foundations & Awareness |
| Page h1 | Context & Prompt Engineering |
| Teal underline on | "Prompt Engineering" |
| Hero description | Learn how to get dramatically better AI outputs — not by using a different tool, but by changing how you communicate with it. This module covers the full context engineering toolkit: from what you write in your prompt, to the documents you attach, to how you organise your work for consistent, high-quality AI performance. |
| Meta tags | `~45 min total` · `13 slides` · `2 articles` · `2 videos` · `Beginner friendly` |
| Breadcrumb | Learning › Level 1 › Context & Prompt Engineering |
| File | `/src/pages/learn/level-1-context-engineering.tsx` |
| Confidence delta | Enabled — capture on Slide 1, re-capture on Slide 13 |

---

## 4. Slides — Full Content Specification

All slides follow the SKILL component specs exactly. Content for each slide is defined below. All layout, styling, and interaction rules are in the SKILL — do not redefine them here.

---

### Slide 1 — Title
**type:** `title` | **section:** `FOUNDATIONS`

```
heading: "Prompt Engineering Essentials"
subheading: "Why some people get dramatically better results 
             from the same tools you're already using"
meta: ["13 slides", "~20 minutes", "Interactive", "Quiz included"]
body: "You're probably already using AI. But there's a good chance 
you're getting a fraction of what it's capable of — not because the 
tool is limited, but because of what you're giving it to work with. 
This module will change how you think about AI communication 
from the ground up."
```

**Confidence slider (additional element — render below body, above the Next button):**
```
Label: "Before we start — how confident do you feel about 
        getting great outputs from AI tools?"
Scale: 1–10 slider
Left label: "Not confident at all"
Right label: "Very confident"
Behaviour: Capture value into state as `confidenceBefore` 
           on Next button click. No submit button needed.
           Slider is optional — learner can skip with Next.
```

---

### Slide 2 — Concept
**type:** `concept` | **section:** `FOUNDATIONS`

```
heading: "Your AI outputs are a mirror"
teal underline on: "mirror"

body: "When you get a disappointing response from an AI, the instinct 
is to blame the tool. Almost every time, the real issue is something 
else: the AI was working with incomplete information about you, your 
situation, your constraints, and what 'good' actually looks like.

AI has no memory of previous conversations, no knowledge of your 
organisation, no idea who your audience is, or what you've already 
tried. Every time you start a new chat, it starts completely blank."

pullQuote: "The AI is not underperforming. It's performing 
perfectly on incomplete information. The information is 
your job to provide."
```

**Right panel — two-column comparison table:**

Render as a bordered card (`bg: C.bg, border: 1px solid C.border, borderRadius: 12, padding: 20`).

Table title: "What the AI starts with vs. what it needs" (12px, fontWeight 700, navy, marginBottom 12)

Two columns side by side, each as a list:

```
Left column header: "What AI starts with" 
  - colour: C.error (#FC8181)
  - header bg: C.errorLight
  - borderRadius: 6px, padding: 6px 10px, marginBottom: 10

Items (each with ✗ prefix in C.error):
  ✗ Your role or function
  ✗ Your organisation's context
  ✗ Who your audience is
  ✗ What 'good' looks like for you
  ✗ Your constraints or timeline
  ✗ Your previous work on this

Right column header: "What it needs from you"
  - colour: C.success (#48BB78)  
  - header bg: C.successLight
  - borderRadius: 6px, padding: 6px 10px, marginBottom: 10

Items (each with ✓ prefix in C.success):
  ✓ Who you are and your expertise
  ✓ The situation and background
  ✓ The exact task and deliverable
  ✓ The format and length required
  ✓ Any constraints or priorities
  ✓ Examples of what you want
```

---

### Slide 3 — Spectrum
**type:** `spectrum` | **section:** `FOUNDATIONS`

```
heading: "There's no single right way to prompt"
teal underline on: "prompt"

body: "Effective prompting isn't about following one formula. The 
approach that works depends on what you're trying to do, how much 
time you have, and how clearly you've formed your own thinking. 
Think of it as a spectrum."
```

**Three spectrum positions:**

```
Position 0 — "Brain Dump"
desc: "Best when your thinking is unstructured"
example: "We've just finished a difficult client workshop. There 
was tension around the change management timeline, the sponsor 
seemed disengaged, and three team members gave conflicting views 
on scope. I'm not sure how to frame the debrief. What should I 
be thinking about and what would you suggest I do next?"

Position 1 — "Conversational"
desc: "Best for iterative, exploratory tasks"
example: "Turn 1: Help me structure the key messages for a pitch 
to a pharma L&D team. Turn 2: The audience will be the L&D 
director, not commercial. Adjust for that. Turn 3: Make the 
opening more direct — they're time-poor and need the business 
case upfront."

Position 2 — "Structured (RCTF)"
desc: "Best for repeatable, consistent outputs"
example: "Role: Senior L&D consultant. Context: Designing a 
capability framework for a 500-person pharma organisation 
post-merger. Task: Draft the 5 core competency areas. Format: 
Table with competency name, 2-sentence description, and one 
example behaviour per competency."
```

**Pivot panel — render below spectrum as a distinct callout (navy left border 4px, bg: #F7FAFC, borderRadius: "0 8px 8px 0", padding: 16px 20px, marginTop: 20):**

```
Panel eyebrow: "BUT HERE'S THE LIMIT" 
  (10px, fontWeight 700, color: C.error, letterSpacing 2)

Panel heading: "Prompting alone has a ceiling"
  (15px, fontWeight 700, color: C.navy, marginBottom: 8)

Panel body (14px, color: C.body, lineHeight: 1.7):
"All three approaches share the same constraint: the AI only 
knows what you type. If your project has 40 pages of background 
documents, a team methodology, or weeks of shared context — none 
of that exists inside a single prompt, no matter how well-crafted.

That's where context engineering comes in."

Teal pill at bottom-right: 
  Text: "Continue to see what this means →"
  Style: bg C.tealLight, color C.teal, fontSize 12, 
         fontWeight 700, padding "4px 12px", borderRadius 20
```

---

### Slide 4 — Concept
**type:** `concept` | **section:** `THE BIGGER PICTURE`

```
heading: "Prompting is one layer of a bigger skill"
teal underline on: "bigger skill"

body: "Context engineering is the practice of giving AI everything 
it needs to perform at its best — through your prompt, through the 
documents you provide, and through how you organise your working 
environment.

Prompting is Layer 1. It's essential and it's where everyone 
starts. But the people getting the most from AI at work have 
gone further — and in this module, you'll see exactly what 
that looks like."
```

**Right panel — three-layer diagram:**

Render as a vertical stack of three bars inside a bordered card. Each bar is a full-width horizontal band with rounded corners. Bars connect with a downward arrow (↓) between them. Widest at bottom, thinnest at top (or equal width — keep clean).

```
Bar 1 — Layer 1 (top)
  bg: C.teal (#38B2AC)
  text: white
  Label: "LAYER 1 — IN YOUR PROMPT" 
    (10px, fontWeight 700, letterSpacing 1.5, uppercase)
  Desc: "What you write in the message box"
    (13px, fontWeight 400, opacity 0.9)
  Status pill: "Slides 5–7 →"
    (bg: rgba(255,255,255,0.2), color white, 
     fontSize 10, fontWeight 700, borderRadius 20, 
     padding "3px 10px")
  Examples row (11px, opacity 0.8): 
    Role · Context · Task · Format · Chain of Thought

↓ arrow (C.teal, centred, marginY: 4)

Bar 2 — Layer 2 (middle)
  bg: C.navyMid (#2D3748)
  text: white
  Label: "LAYER 2 — THROUGH DOCUMENTS"
  Desc: "Files, transcripts, reports, and briefs you attach"
  Status pill: "Slides 8–9 →"
  Examples row: 
    Meeting transcripts · Strategy docs · Previous outputs · Briefs

↓ arrow (#2D3748, centred, marginY: 4)

Bar 3 — Layer 3 (bottom)
  bg: C.navy (#1A202C)
  text: white
  Label: "LAYER 3 — THROUGH ORGANISATION"
  Desc: "Projects, system prompts, cross-chat memory"
  Status pill: "Level 2 Preview →"
    (bg: C.teal, color white — distinct from others)
  Examples row: 
    System prompts · Shared projects · Persistent context
```

**Below diagram — caption:**
```
12px, color: C.muted, fontStyle: italic, marginTop: 12
"You don't need to master all three layers today. By the end of 
this module you'll understand how they connect — and you'll be 
practising Layers 1 and 2 immediately."
```

---

### Slide 5 — RCTF
**type:** `rctf` | **section:** `LAYER 1 — IN YOUR PROMPT`

```
heading: "The RCTF Framework"
teal underline on: "RCTF"
subheading: "The most practical structured approach — and the one 
             your whole team can standardise on"
```

**Four RCTF elements:**

```
ROLE
color: #667EEA | light: #EBF4FF
desc: "Tell the AI who to be. A specific persona unlocks a specific 
      style of thinking and a specific type of expertise."
example: "You are a senior change management consultant with 15 
years of experience in large-scale digital transformations within 
pharmaceutical companies."
whyItMatters: "Without a role, the AI defaults to a generic helpful 
assistant. With one, it reasons from a specific professional 
perspective."

CONTEXT
color: #38B2AC | light: #E6FFFA
desc: "Tell the AI about your situation — who's involved, what's 
      happened so far, what the constraints are."
example: "We are 6 weeks into an ERP rollout. Commercial teams are 
showing resistance. A failed IT project 3 years ago has damaged 
trust in tech initiatives."
whyItMatters: "This is the element most people skip. Skipping it 
forces the AI to make assumptions — and those assumptions are 
almost always wrong."

TASK
color: #ED8936 | light: #FFFBEB
desc: "Tell the AI exactly what to produce. Vague tasks produce 
      vague outputs — every time."
example: "Create a 10-question stakeholder survey to identify the 
root causes of commercial team resistance to the ERP rollout."
whyItMatters: "The task should be specific enough that there is 
only one reasonable interpretation of what you want."

FORMAT
color: #48BB78 | light: #F0FFF4
desc: "Tell the AI how to structure the output — length, layout, 
      tone, what to include and what to leave out."
example: "Output as a numbered list. Max 15 words per question. 
Professional tone. No preamble or explanation — just the 
questions."
whyItMatters: "Without a format, the AI decides for you. Usually 
it writes more than you need and in a structure that requires 
editing."
```

**Assembled prompt panel (below the 2×2 grid):**

Render as a left-bordered panel (`borderLeft: "4px solid #38B2AC", bg: C.bg, borderRadius: "0 8px 8px 0", padding: "14px 20px"`).

```
Panel eyebrow: "WHAT IT LOOKS LIKE ASSEMBLED" 
  (10px, fontWeight 700, color: C.teal, letterSpacing 2)

Assembled prompt text (13px, fontFamily F.b, lineHeight 1.7):
Display each RCTF element with its colour tag inline:

[ROLE — indigo pill] You are a senior change management 
consultant with 15 years of experience in large-scale digital 
transformations within pharmaceutical companies.

[CONTEXT — teal pill] We are 6 weeks into an ERP rollout. 
Commercial teams are showing resistance. A failed IT project 
3 years ago has damaged trust in tech initiatives.

[TASK — orange pill] Create a 10-question stakeholder survey 
to identify the root causes of commercial team resistance.

[FORMAT — green pill] Numbered list. Max 15 words per question. 
Professional tone. No preamble.

Implementation note: Each [ELEMENT — pill] renders as an 
inline-flex span with the element's colour as bg, white text, 
10px, fontWeight 700, borderRadius 20, padding "2px 8px", 
marginRight 6px. The rest of the line is normal body text.
```

---

### Slide 6 — Drag and Drop
**type:** `dragdrop` | **section:** `LAYER 1 — PRACTICE`

```
heading: "Build an RCTF prompt"
teal underline on: "RCTF prompt"
instruction: "Below is a prompt someone wrote before they knew 
about RCTF. Drag each fragment into the correct category. 
Some fragments are deliberately missing — that's part of 
the exercise."
```

**Scenario context box (navy bg, white text, mint accent on bold words):**
```
"You work in the Learning & Development team at a large 
consulting firm. You need to brief AI on creating an 
onboarding plan for new graduate hires."
```

**7 chips to drag:**
```
Chip 1: "Create a 4-week onboarding plan"
  → Correct zone: TASK

Chip 2: "You are an experienced L&D specialist with deep 
          knowledge of professional services firms"
  → Correct zone: ROLE

Chip 3: "Output as a week-by-week table with: focus area, 
          key activities, and success criteria for each week"
  → Correct zone: FORMAT

Chip 4: "Our graduate cohort joins in September. They have 
          no prior consulting experience. We want them 
          client-ready within 30 days."
  → Correct zone: CONTEXT

Chip 5: "Professional tone. No jargon."
  → Correct zone: FORMAT

Chip 6: "For a professional services firm"
  → Correct zone: CONTEXT

Chip 7: "Make it detailed and useful"
  → Distractor — goes in TASK zone but triggers special 
    feedback: "This is too vague to be a useful task 
    instruction. Specific tasks produce specific outputs. 
    Try: 'Create a 4-week onboarding plan' instead."
```

**4 drop zones (2×2 grid):**
```
ROLE     — bg: #EBF4FF, border: #667EEA, label colour: #667EEA
CONTEXT  — bg: #E6FFFA, border: #38B2AC, label colour: #38B2AC
TASK     — bg: #FFFBEB, border: #ED8936, label colour: #ED8936
FORMAT   — bg: #F0FFF4, border: #48BB78, label colour: #48BB78
```

**Success feedback panel:**
```
"Well built. Notice how each element is doing a specific job. 
The assembled prompt is dramatically more powerful than 
'create an onboarding plan for graduates' — which is what 
most people actually send."
```

**Partial feedback:** Per-zone — show which chips are misplaced and why.  
**Reset button:** Always visible. Label: "Start again ↺"  
**Mobile fallback:** Tap chip to select, tap zone to place.

---

### Slide 7 — Flipcard
**type:** `flipcard` | **section:** `LAYER 1 — ADVANCED MOVES`

```
heading: "Beyond RCTF — when to go further"
teal underline on: "go further"

bodyAboveCards: "RCTF covers most situations. Two additional 
techniques unlock significantly better results for specific 
types of task. They take 30 seconds to learn."
```

**Card 1 — Chain of Thought:**
```
front:
  badge: "TECHNIQUE" (teal pill)
  label: "Chain of Thought"
  oneLiner: "When you need the AI to reason, not just respond"
  promptExcerpt: "Think through this step by step before 
                  giving your final answer..."
  hint: "Flip to see when and why →"

back:
  whenToUse: "Complex decisions, multi-variable analysis, 
              anything where you'd want to see the working — 
              not just the conclusion."
  example: "Analyse the risks of launching our new service in 
  EMEA before the US. Think through this step by step: consider 
  market readiness, regulatory environment, resource requirements, 
  and competitive timing. Then give your recommendation."
  whyItWorks: "Asking the AI to reason out loud catches errors 
  in its logic — and yours. It produces outputs that are easier 
  to challenge and refine."
```

**Card 2 — Few-Shot Prompting:**
```
front:
  badge: "TECHNIQUE" (teal pill)
  label: "Few-Shot Prompting"
  oneLiner: "When you want consistent style — show, don't tell"
  promptExcerpt: "Here are two examples of what I'm looking for. 
                  Follow this pattern exactly..."
  hint: "Flip to see when and why →"

back:
  whenToUse: "Recurring outputs where format and tone matter — 
              status updates, client emails, meeting summaries. 
              Anything your team produces repeatedly."
  example: "Here are two examples of how we write project status 
  updates: [Example 1] [Example 2]. Now write a status update 
  for this week using the same structure and tone."
  whyItWorks: "Showing is more precise than describing. A good 
  example eliminates ambiguity about format, tone, and depth in 
  a way that written instructions alone cannot."
```

**Insight box (appears after both cards flipped):**
```
"These techniques stack — they don't replace each other. 
A Few-Shot prompt can also be RCTF-structured. Chain of 
Thought works even better when you've defined the Role and 
Context first. Think of them as additions to your toolkit, 
not alternatives."
```

---

### Slide 8 — Concept
**type:** `concept` | **section:** `LAYER 2 — THROUGH DOCUMENTS`

```
heading: "Stop describing your work. Start showing it."
teal underline on: "showing it"

body: "Everything in Layer 1 — the role, the context, the format 
— you've been writing by hand. That works. But there's a faster, 
more powerful approach for anything that involves real documents: 
attach them directly.

When you give an AI a meeting transcript, a strategy document, 
a client brief, or a previous output, you're not just saving 
time. You're giving it access to specificity that no prompt 
description could replicate. The nuance, the exact language 
used, the real constraints — all of it is in the document."

pullQuote: "Uploading a 30-page strategy document takes 10 
seconds. Describing its contents accurately in a prompt would 
take 30 minutes — and you'd still lose most of the nuance."
```

**Right panel — three document type cards (stacked vertically):**

Each card: `bg: white, border: 1px solid C.border, borderRadius: 8, padding: 14px, marginBottom: 10`

```
Card 1 — Meeting Transcript
eyebrow: "CONSULTING / ANY FUNCTION"
document: "Post-workshop transcript (Circleback, Otter.ai)"
prompt: "Identify the three unresolved tensions from this 
         workshop and suggest how to address each one 
         in the next session."
contrast:
  without: "Generic facilitation advice"
  with: "Specific points grounded in what was actually said"

Card 2 — Strategy Document
eyebrow: "STRATEGY / LEADERSHIP"
document: "Company strategy deck or annual report (PDF)"
prompt: "Based on this strategy document, identify the top 
         3 capability gaps that would prevent us from 
         achieving the Year 3 targets."
contrast:
  without: "Theoretical gap analysis"
  with: "Gaps mapped to the organisation's own stated priorities"

Card 3 — Previous Output
eyebrow: "BD / COMMS / ANY WRITTEN OUTPUT"
document: "Last quarter's proposal, report, or email thread"
prompt: "Using this previous proposal as a style and structure 
         reference, draft a new proposal for [new client]. 
         Match the tone exactly."
contrast:
  without: "Generic proposal structure"
  with: "Output that matches your team's actual voice and standards"
```

**Render contrast rows as:**
- Small label "WITHOUT:" in C.error (10px, fontWeight 700)
- Small label "WITH:" in C.success (10px, fontWeight 700)
- Values in 12px, C.body

**Below panel — tools row:**
```
Label: "TOOLS THAT MAKE THIS EASY" 
  (10px, fontWeight 700, C.muted, letterSpacing 1.5, marginBottom 8)

Four tool pills (inline-flex, gap 8):
  Circleback  |  Otter.ai  |  NotebookLM  |  Claude / ChatGPT

Pill style: border: 1px solid C.border, borderRadius 20, 
            padding "5px 14px", fontSize 12, 
            fontWeight 600, color C.body
```

---

### Slide 9 — Flipcard
**type:** `flipcard` | **section:** `LAYER 2 — SEE THE DIFFERENCE`

```
heading: "The same prompt. A document changes everything."
teal underline on: "document changes everything"

instruction: "Both cards start with the same request. 
              Flip each to see what the AI produced."
```

**Card 1 — Without Document:**
```
front:
  badge: "PROMPT — NO ATTACHMENT" (error colours)
  label: "Summarise the key decisions from our last 
          leadership meeting"
  contextNote: "No document attached"
  hint: "Flip to see the AI response →"

back:
  badge: "AI RESPONSE" (muted colours)
  response: "I'd be happy to help summarise your leadership 
  meeting decisions, but I don't have access to the content 
  of your meeting. Could you share the key discussion points, 
  agenda items, or notes from the meeting so I can help 
  organise and summarise them for you?"
  insight: "The AI can't help. It has nothing to work with."
  insightStyle: bg C.errorLight, border C.errorBorder
```

**Card 2 — With Document:**
```
front:
  badge: "PROMPT + MEETING TRANSCRIPT" (success colours)
  label: "Summarise the key decisions from our last 
          leadership meeting"
  contextNote: "Circleback transcript attached (47 min meeting)"
  hint: "Flip to see the AI response →"

back:
  badge: "AI RESPONSE" (success colours)
  response: 
"Key decisions from the 14 Feb leadership meeting:

1. APPROVED: Q2 hiring plan — 3 additional consultants, 
   start dates staggered April–June

2. DEFERRED: New client pricing structure — CFO requested 
   revised modelling before sign-off (deadline: 28 Feb)

3. ASSIGNED: Sarah to lead the Frankfurt office proposal — 
   first draft due 21 Feb for review

4. ESCALATED: Capacity concern on Project Delta flagged to 
   MD — decision expected by EOW"

  insight: "Same prompt. The document turned a dead-end into 
            a complete, actionable output."
  insightStyle: bg C.successLight, border C.successBorder
```

**Insight box (after both flipped):**
```
"The prompt didn't change. The effort didn't change. What 
changed was the context available to the AI — and the output 
quality changed completely as a result. More context, better 
output. Every time."
```

---

### Slide 10 — Concept
**type:** `concept` | **section:** `LAYER 3 — THROUGH ORGANISATION`

```
heading: "When your AI knows your world"
teal underline on: "knows your world"

body: "Layers 1 and 2 work session by session. Each time you 
start a new chat, you start from zero — re-write the role, 
re-upload the documents, re-explain the constraints.

Layer 3 changes that. By organising your AI work into Projects 
— with a system prompt, shared documents, and context that 
builds across conversations — you move from prompting to 
partnership. The AI stops being a tool you instruct and starts 
being a collaborator that understands your work."
```

**Right panel — Project UI mockup:**

Render as a schematic card (`border: 2px solid C.border, borderRadius: 12, overflow: hidden, bg: white`).

```
Mockup header bar (navy bg, padding 10px 14px):
  Text: "PROJECT: Client Delivery Support" 
  (12px, fontWeight 700, color white)

Mockup body (padding 14px):
  Three sections separated by 1px dashed C.border:

  Section A — System Prompt:
    Label: "SYSTEM PROMPT" (10px, fontWeight 700, C.teal)
    Content (12px, C.body, bg C.bg, borderRadius 6, padding 8):
      "You are a senior Oxygy consultant supporting client 
       delivery teams. Always be direct. Prioritise practical 
       recommendations over theory..."
    [CALLOUT A tag — right side]

  Section B — Files:
    Label: "FILES" (10px, fontWeight 700, C.teal)
    Three file rows (each: 📄 icon + filename, 12px, C.body):
      📄 Oxygy_Methodology.pdf
      📄 Client_Brief_Q1.docx  
      📄 Engagement_Tracker.xlsx
    [CALLOUT B tag — right side]

  Section C — Conversations:
    Label: "CONVERSATIONS" (10px, fontWeight 700, C.teal)
    Three chat rows (each: ◎ icon + label, 12px, C.body):
      ◎ Workshop prep — Feb 12
      ◎ Stakeholder mapping — Feb 14
      ◎ Risk register review — Feb 18
    [CALLOUT C tag — right side]
```

**Three callout annotations (render as numbered list below mockup, or as side annotations if space allows):**
```
A — System Prompt:
"Defines who the AI is and how it behaves across every 
conversation in this project. Write it once. It applies 
everywhere."

B — Shared Files:
"Documents always available — no re-uploading each session. 
The AI knows your methodology, your client context, and 
your standards before you type a word."

C — Cross-Chat Memory:
"Previous conversations are accessible. The AI builds 
understanding of your work over time — not just in one session."
```

**Level 2 teaser panel (teal left border 4px, bg: C.tealLight, borderRadius: "0 10px 10px 0", padding: 16px 20px, marginTop: 20):**
```
Pill: "→ LEVEL 2 PREVIEW" 
  (bg: C.teal, color white, 10px, fontWeight 700, 
   borderRadius 20, padding "3px 10px", marginBottom 8)

heading: "Setting this up is a Level 2 skill"
  (15px, fontWeight 700, color: C.navy, marginBottom: 8)

body (13px, color: C.body, lineHeight: 1.7):
"Designing a system prompt, structuring a project, and 
building shared context across your team is exactly what 
Level 2: Applied Capability covers. You'll build your 
first project from scratch in that module.

For now, the key insight: everything you've learned in 
Layers 1 and 2 becomes dramatically more powerful when 
organised into a project. The techniques are the same. 
The compounding effect is what changes."

Link: "Preview Level 2 →" 
  (fontSize 13, fontWeight 700, color C.teal, 
   textDecoration none, display inline-flex, 
   alignItems center, gap 4, marginTop 8)
```

---

### Slide 11 — Branching
**type:** `branching` | **section:** `APPLY IT`

```
heading: "One scenario. You choose the approach."
teal underline on: "you choose"

bodyAboveScenario: "You've just finished a 90-minute client 
discovery session. Your notes are scattered. The partner wants 
a debrief summary by end of day. You have 30 minutes. Which 
context strategy do you use?"
```

**Scenario box (navy bg, white text):**
```
Client:     Mid-size pharma company
Situation:  Exploring whether to outsource their 
            medical affairs function
Your role:  Lead consultant
You have:   Rough bullet notes, a Circleback transcript, 
            and the original client brief
```

**Three option cards:**

```
Option A
cardLabel: "LAYER 1 — PROMPT ONLY"
whatYouDo: "Paste your rough notes into a brain dump prompt. 
            Let the AI find structure in your unorganised thinking."
promptPreview:
"Here are my raw notes from the discovery session: [paste 
everything]. The partner needs a debrief summary by EOD. 
Help me structure the key findings, tensions we observed, 
and recommended next steps."

Option B
cardLabel: "LAYER 2 — DOCUMENT + PROMPT"
whatYouDo: "Upload the Circleback transcript and write a 
            structured RCTF prompt. Let the document carry 
            the context."
promptPreview:
"[Transcript attached] You are a senior management consultant. 
Using this discovery session transcript, produce a debrief 
summary covering: key themes, stakeholder concerns, open 
questions, and recommended next steps. Format as a structured 
brief, max 400 words."

Option C
cardLabel: "LAYER 3 — ORGANISED CONTEXT"
whatYouDo: "Open your existing client project where the client 
            brief and methodology are already loaded. Ask 
            directly — the AI already knows the context."
promptPreview:
"[In client project — brief and methodology already loaded] 
Summarise the key findings from today's discovery session 
transcript [attached]. Flag any tensions with the original 
brief and suggest 3 next steps."
```

**Consequence screen for each option (shown after selection + confirm click):**

```
Option A consequence:
qualityBadge: "GOOD — Fast and usable" (orange/warning colours)
outputSnippet:
"Key findings from discovery session:

1. Strategic fit uncertain — client sees outsourcing as cost 
   reduction but hasn't defined what 'good' looks like for 
   medical affairs

2. Internal tension flagged — Medical Director supportive; 
   VP Commercial resistant (perceived loss of control)

3. Decision timeline unclear — Board wants a recommendation 
   in 6 weeks but due diligence scope isn't agreed"

reflection:
"Brain dump works well here — your rough notes had enough 
substance for the AI to find structure. The output is solid 
but generic. It doesn't reflect your firm's methodology or 
specific framing. Good first draft. Needs editing for 
client delivery."
tradingOff: "Fast · Generic · Good first draft"

Option B consequence:
qualityBadge: "STRONG — Specific and grounded" (success colours)
outputSnippet:
"Discovery Debrief — Medical Affairs Outsourcing
[Client], 18 Feb 2026

KEY THEMES
→ Strategic ambiguity: Client hasn't defined the 'make vs 
  buy' criteria. Outsourcing is being treated as a cost lever, 
  not a capability decision.

→ Stakeholder misalignment: Medical Director aligned on 
  rationale; VP Commercial concerned about loss of KOL 
  relationship ownership. Needs a change management workstream.

→ Regulatory risk underweighted: No discussion of 
  pharmacovigilance handover. Flag for next session.

RECOMMENDED NEXT STEPS
1. Workshop: Define outsourcing success criteria with ExCo (Wk 2)
2. Stakeholder map: KOL relationship ownership — current vs. outsourced
3. Regulatory review: Bring in PV lead for risk assessment"

reflection:
"The transcript gave the AI specificity no prompt description 
could replicate — names, specific concerns, exact tensions. 
This is near client-ready with minimal editing. Layer 2 at work."
tradingOff: "Specific · Grounded · Near client-ready"

Option C consequence:
qualityBadge: "POWERFUL — Contextually aware" (teal colours)
outputSnippet:
"[Same quality as Option B output, plus:]

ALIGNMENT WITH ENGAGEMENT BRIEF
Findings broadly consistent with original scope. However, the 
regulatory risk gap identified represents a material scope 
addition. Recommend flagging to the partner before submitting.

Suggested framing: 'We've identified a PV risk dimension not 
in original scope but significant for the recommendation. 
Suggest a 30-min call before we submit findings.'"

reflection:
"Because the project contained the original brief and your 
methodology, the AI cross-referenced what it heard against 
what was expected — and proactively flagged the gap. 

You didn't build this project today — that's Level 2. But 
now you know exactly why you will."
tradingOff: "Contextually aware · Proactive · Level 2 skill"
```

**Closing insight box (below all options, always visible after selection):**
```
"All three approaches produced something useful. The difference 
isn't right vs. wrong — it's depth of context vs. speed. As 
your practice matures, you'll move naturally up the layers. 
Most people start at A, build habits around B, and eventually 
live in C."
```

---

### Slide 12 — Quiz
**type:** `quiz` | **section:** `CHECK YOUR INSTINCTS`

```
eyebrow: "CHECK YOUR INSTINCTS"
heading: "One question. Think it through."
```

**Question:**
```
"A colleague asks you to review a 15-page client proposal 
they've written and give feedback on clarity and structure. 
You want AI's help. What's the most effective approach?"
```

**Options:**
```
A: "Write a detailed RCTF prompt describing what a good 
    proposal looks like and asking for feedback criteria"

B: "Attach the proposal and write: 'Review this for clarity 
    and structure. Flag the three weakest sections and suggest 
    specific improvements for each.'"

C: "Ask the AI: 'What makes a great consulting proposal?' 
    and use its answer as a checklist to review the document 
    yourself"

D: "Brain dump your initial impressions of the proposal and 
    ask the AI to help you structure your feedback"
```

**Correct answer: B**

**Per-option feedback (shown after Check Answer clicked):**
```
A — Partially correct, but inefficient:
"You could describe what a good proposal looks like — but 
why describe it when you can show it? RCTF shines when you 
don't have a document to provide. Here, the document exists. 
Attach it."

B — Correct:
"Layer 2 in action. The proposal carries all the context 
the AI needs. Your prompt is precise — specific task, 
specific format, specific depth. The combination of document 
plus structured prompt produces feedback grounded in the 
actual content, not generic best practices."

C — Misses the point:
"This uses the AI to generate abstract criteria rather than 
apply them to the specific document. You'd get a useful 
general framework — but you'd still be doing all the 
document analysis yourself. You've used AI as a search 
engine, not a collaborator."

D — Not wrong, but not optimal:
"Brain dumping your impressions could produce useful 
structured feedback — but it relies on your memory of a 
15-page document, which is exactly where humans are 
unreliable. Attaching the document lets the AI read it 
directly rather than through your paraphrase."
```

**Post-answer insight:**
```
"The pattern is consistent: when you have a document, attach 
it. Your prompt can then be shorter and more precise — 
because the document is doing the heavy lifting on context."
```

---

### Slide 13 — Templates
**type:** `templates` | **section:** `YOUR STARTER KIT`

```
heading: "Five templates you can use tomorrow"
teal underline on: "use tomorrow"

body: "Each template is structured using RCTF and ready to 
use. Customise the bracketed fields for your situation. The 
'What to attach' note tells you what document context will 
make each one significantly more powerful."
```

**Five templates:**

```
Template 1 — Meeting Debrief
tag: "CONSULTING · L&D · BD"
tagColor: C.teal

prompt:
"You are a senior [role] at a professional services firm. 
Review the attached meeting transcript and produce a structured 
debrief covering:
• Key decisions made (with owners)
• Open questions and unresolved tensions  
• Action items (owner + deadline)
• What I should flag to my manager before next steps

Format: Structured bullet points. Max 300 words. 
Direct tone — no filler."

whatToAttach: "Your Circleback or Otter.ai transcript from 
               the meeting"
proTip: "No transcript? Paste your rough notes instead — 
         brain dump them directly above this prompt."

---

Template 2 — Document Analysis
tag: "STRATEGY · CONSULTING · ANY FUNCTION"
tagColor: "#667EEA"

prompt:
"You are a [role] with expertise in [domain]. Review the 
attached document and identify:
• The 3 most important insights or findings
• The key assumptions being made (and whether they hold up)
• The single most important question this document leaves 
  unanswered
• What I should do with this information

Format: Numbered list for each section. Analytical tone. 
Flag uncertainty explicitly — don't guess."

whatToAttach: "The document, report, or strategy deck 
               you want analysed"
proTip: "Works especially well for long documents you don't 
         have time to read in full. Attach and let AI surface 
         what matters."

---

Template 3 — First Draft Generator
tag: "BD · COMMS · ANY WRITTEN OUTPUT"
tagColor: "#ED8936"

prompt:
"You are an experienced [consultant / writer / analyst] 
specialising in [domain or sector]. Draft a [document type 
— email / proposal section / briefing note] for the 
following situation:

[Describe your situation here — or attach the brief]

Audience: [Who will read this]
Tone: [Professional / direct / warm / technical]
Length: [Max word count or format]

Do not add preamble or sign-off unless specified."

whatToAttach: "A previous example of a similar document 
               written in your team's voice — or the brief 
               you're working from"
proTip: "Attaching a previous example is often more powerful 
         than describing tone in text. Show it what 
         'good' looks like."

---

Template 4 — Stakeholder Preparation
tag: "CONSULTING · BD · LEADERSHIP"
tagColor: "#48BB78"

prompt:
"You are a senior advisor helping me prepare for an important 
meeting. Based on the attached context, help me:

• Anticipate the 3 most likely objections or concerns this 
  stakeholder will raise
• Prepare a response or position for each
• Identify the one thing I must NOT say or do in this meeting
• Suggest the ideal opening 2 minutes

Format: Structured by section. Practical and specific — 
no generic advice."

whatToAttach: "Stakeholder profile, LinkedIn background, 
               previous meeting notes, or the document 
               they will have reviewed"
proTip: "More specific context = more specific preparation. 
         Generic background produces generic prep."

---

Template 5 — Learning & Synthesis
tag: "L&D · RESEARCH · PERSONAL DEVELOPMENT"
tagColor: C.navyMid

prompt:
"You are a knowledgeable [subject matter expert]. I have 
just [read / attended / completed] [resource name or type].

Help me:
• Summarise the 3 most important ideas in plain language
• Connect these ideas to [my role / current project / 
  specific challenge]
• Give me 2 questions I should now be asking myself
• Suggest one immediate action I can take

Format: Short paragraphs per section. Practical and specific."

whatToAttach: "The article, transcript, or notes from 
               whatever you just consumed"
proTip: "Use after every significant piece of learning — 
         articles, podcasts, workshops. Turns passive 
         consumption into active synthesis."
```

**Template card rendering spec:**
Each template renders as a white card with `border: 1px solid C.border, borderRadius: 12, overflow: hidden`.

```
Card header (bg: C.bg, padding: 12px 16px, 
             borderBottom: 1px solid C.border):
  Left: Template name (14px, fontWeight 700, C.navy, F.h)
  Right: Tag pill (tagColor bg, white text, 10px, fontWeight 700, 
                   borderRadius 20, padding "3px 10px")
         + Copy button (teal outlined, 12px, 
                        "Copy ✓" for 2000ms after click)

Card body (padding: 16px):
  Prompt text in prompt box style (Section 6 of SKILL)
  
  "WHAT TO ATTACH" section:
    Eyebrow: 10px, fontWeight 700, C.teal, letterSpacing 1.5
    Content: 13px, C.body, 
             bg C.tealLight, borderLeft "3px solid C.teal",
             borderRadius "0 6px 6px 0", padding "8px 12px"
  
  "PRO TIP" section (marginTop 8):
    Eyebrow: 10px, fontWeight 700, C.muted, letterSpacing 1.5
    Content: 12px, C.body, fontStyle italic
```

**Confidence delta capture (below all templates):**

Render as a panel `(bg: C.tealLight, border: 1px solid C.mint, borderRadius: 12, padding: 20px 24px, marginTop: 24)`.

```
Heading: "One last question before you go"
  (16px, fontWeight 700, C.navy, F.h, marginBottom: 8)

Body: "At the start of this module, you rated your confidence 
at [confidenceBefore] out of 10."
  (Dynamically insert the captured value from Slide 1. 
   If not captured, show: "at the start of this module".)

Slider: Same 1–10 as Slide 1
Label: "How confident do you feel now?"
Submit button: "Save my rating" (primary teal pill)

On submit — show delta panel:

If increased (confidenceAfter > confidenceBefore):
  bg: C.successLight, border C.successBorder
  "↑ +[delta] points — A meaningful shift. Lock it in: 
   use one of these templates on a real piece of work today."

If same (confidenceAfter === confidenceBefore):
  bg: C.bg, border C.border
  "Your rating stayed at [X]. Confidence comes from 
   practice, not learning. Pick one template and use it 
   today. Come back and re-rate after."

If decreased (confidenceAfter < confidenceBefore):
  bg: C.tealLight, border C.mint
  "Your rating went down — that's a healthy sign. You 
   now know more about what you don't know yet. That's 
   the foundation of genuine skill development. Level 2 
   will fill the gaps."
```

**Save to prompt library link:**
```
Below delta panel:
Text: "Save all 5 templates to your Prompt Library →"
Style: fontSize 13, fontWeight 700, color C.teal, 
       textDecoration none, display block, 
       textAlign center, marginTop 12
href: "#dashboard" (links to personal dashboard section)
Condition: Only show if user is authenticated
```

---

## 5. Read Phase — Full Content Specification

### Article 1
```
id: "a1"
title: "The Prompt Engineering Playbook: What Separates 
        Power Users from Everyone Else"
source: "Harvard Business Review"
readTime: "7 min read"
desc: "How structured prompting is changing the way knowledge 
workers interact with AI tools — and what consistently separates 
professionals who get great outputs from those who get generic ones."
url: "https://hbr.org" 
  (placeholder — replace with actual URL when published)
reflection: "In one sentence, what was the single most useful 
idea from this article for your day-to-day work at Oxygy?"
```

### Article 2
```
id: "a2"
title: "Why Context Is the Most Underrated Variable in AI Prompting"
source: "MIT Technology Review"
readTime: "8 min read"
desc: "A deep-dive into why the Context element of a prompt has 
more impact on output quality than any other variable — with 
real examples from professional knowledge work."
url: "https://technologyreview.com"
  (placeholder — replace with actual URL when published)
reflection: "Describe one specific situation from your own work 
where adding more context to a prompt could have meaningfully 
improved the output you received."
```

---

## 6. Watch Phase — Full Content Specification

### Video 1
```
id: "v1"
title: "Context Engineering in Practice"
channel: "Oxygy Learning"
duration: "12 min"
desc: "A live walkthrough of all three context engineering layers 
applied to real consulting and pharma scenarios — including 
before/after comparisons at each layer."
url: "https://youtube.com" (placeholder)

quiz:
  Q1:
    question: "In the video, what was identified as the most 
               commonly skipped element of the RCTF framework?"
    options: [
      "Role — people feel unnatural assigning a persona to AI",
      "Context — people assume the AI already knows their situation",
      "Task — people think their ask is obvious from the prompt",
      "Format — people let the AI decide the output structure"
    ]
    correct: 1

  Q2:
    question: "According to the video, when does attaching a 
               document add the most value over a detailed prompt?"
    options: [
      "When the document is under 5 pages and easy to summarise",
      "When the content contains specific names, quotes, and 
       details that would be lost in a text description",
      "When you don't have time to write a proper RCTF prompt",
      "When the AI model has a large context window"
    ]
    correct: 1
```

### Video 2
```
id: "v2"
title: "Building a Team Prompt Library"
channel: "Oxygy Learning"
duration: "9 min"
desc: "How to move from individual prompting habits to a shared, 
standardised library that scales context engineering capability 
across your entire team."
url: "https://youtube.com" (placeholder)

quiz:
  Q1:
    question: "What is the primary benefit of a shared prompt 
               library over individual prompting habits?"
    options: [
      "It saves individuals time writing prompts from scratch",
      "It standardises inputs to produce consistent, comparable 
       outputs across the team",
      "It prevents people from making mistakes in their prompts",
      "It allows managers to monitor what questions employees 
       are asking AI"
    ]
    correct: 1

  Q2:
    question: "In the video, what tagging approach is recommended 
               for organising a prompt library?"
    options: [
      "By date created and author name",
      "By AI tool used (Claude, ChatGPT, Copilot)",
      "By use case and function (e.g., BD / Meeting Debrief / 
       Strategy)",
      "By output quality rating from previous uses"
    ]
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
    desc: "13-slide interactive module" 
  },
  { 
    id: "read", 
    label: "Read", 
    icon: "◎", 
    time: "~15 min", 
    desc: "2 articles + reflection" 
  },
  { 
    id: "watch", 
    label: "Watch", 
    icon: "▷", 
    time: "~12 min", 
    desc: "2 videos + knowledge check" 
  },
  { 
    id: "practice", 
    label: "Practice", 
    icon: "◈", 
    time: "~15 min", 
    desc: "Prompt Playground →", 
    external: true 
  },
];
```

---

## 8. Page Hero — Exact Copy

```
Breadcrumb: Learning › Level 1 › Context & Prompt Engineering

Level badge: "LEVEL 1" (mint bg, teal text)
Eyebrow: "FOUNDATIONS & AWARENESS"

h1: "Context & Prompt Engineering"
    (teal underline on "Prompt Engineering")

Description: "Learn how to get dramatically better AI outputs — 
not by using a different tool, but by changing how you communicate 
with it. This module covers the full context engineering toolkit: 
from what you write in your prompt, to the documents you attach, 
to how you organise your work for consistent, high-quality 
AI performance."

Meta tags: "~45 min total" · "3 activities" · "Beginner friendly" · 
           "Pharma & Consulting"

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

Description: "Apply your context engineering skills to a 
structured real-work challenge. Build prompts, attach context, 
and get feedback — then save your best work to your personal 
prompt library."

CTA button: "Open Prompt Playground →"
href: "#prompt-playground" 
  (link to the Prompt Playground section/page on the site)
```

---

## 10. State Architecture

Follow the SKILL exactly. Additional state specific to this page:

```tsx
// Confidence delta (Slide 1 + Slide 13)
const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null);
const [confidenceSubmitted, setConfidenceSubmitted] = useState(false);

// Branching scenario (Slide 11)
const [scenarioChoice, setScenarioChoice] = useState<number | null>(null);
const [scenarioConfirmed, setScenarioConfirmed] = useState(false);
```

Confidence delta logic:
```tsx
const confidenceDelta = 
  confidenceAfter !== null && confidenceBefore !== null 
    ? confidenceAfter - confidenceBefore 
    : null;

const deltaMessage = 
  confidenceDelta === null ? null
  : confidenceDelta > 0 
    ? `↑ +${confidenceDelta} points — A meaningful shift. Lock it in: use one of these templates on a real piece of work today.`
  : confidenceDelta === 0
    ? `Your rating stayed at ${confidenceAfter}. Confidence comes from practice, not learning. Pick one template and use it today.`
  : `Your rating went down — that's a healthy sign. You now know more about what you don't know yet. Level 2 will fill the gaps.`;
```

---

## 11. Responsive Behaviour

Follow the SKILL. Page-specific notes:

**Desktop (1200px+):** Full layout as specified. Player at full content width (max 1100px).

**Tablet (768–1199px):**
- Hero: Stack left/right columns vertically (description above, progress summary below as a horizontal bar)
- Slide 2 right panel: Stack below left column
- Slide 4 three-layer diagram: Full width, bars stack with reduced padding
- Slide 8 right panel: Stack below left column, cards go single column
- Journey strip: Compress tile labels to icon + label only, hide descriptions

**Mobile (<768px):**
- Nav: Course Resources appears in mobile menu as collapsible section
- Hero: Single column, progress summary collapses to inline "1/3 complete" badge
- Player: Full width, padding reduced to 20px 20px
- Slide 5 RCTF grid: Single column (4 cards stacked)
- Slide 6 dragdrop: Tap-to-select mode (no HTML5 drag)
- Slide 7 flipcards: Stack vertically, tap to flip
- Slide 11 scenario options: Stack vertically
- Journey strip: Horizontal scroll on mobile, tiles min-width 120px

---

## 12. Developer Notes

**Navigation first.** Implement the Navbar change and route before building the page. The route must resolve correctly before testing page content.

**Navbar modification is surgical.** Only add the Course Resources dropdown — do not change any existing nav items, active states, or mobile menu behaviour.

**Slide 6 drag and drop.** Use the HTML5 Drag and Drop API with a manual touch event handler for mobile (tap-to-select chip, tap zone to place). Do not use third-party DnD libraries.

**Slide 11 branching.** The confirm step between selection and consequence reveal is important — it prevents accidental selections. Pattern: select option card → "Confirm this approach →" button appears → click to reveal consequence.

**Confidence delta.** `confidenceBefore` is captured silently on Next from Slide 1. If the learner skips the slider, `confidenceBefore` stays null and the delta panel on Slide 13 shows the closing question without referencing an opening score.

**Template copy buttons.** On click: copy to clipboard using `navigator.clipboard.writeText()`. Change button text to "Copied ✓" for 2000ms, then revert. Handle clipboard permission errors gracefully.

**Assembled prompt on Slide 5.** The inline RCTF colour pills are `<span>` elements with inline styles. They are not interactive — purely visual.

**Level 2 preview link on Slide 10.** The `href` for "Preview Level 2 →" should point to `/learn/level-2` — this route does not exist yet, so implement as a disabled link or a `#coming-soon` anchor with a tooltip: "Level 2 coming soon".

**Save to Prompt Library link on Slide 13.** Only render if user is authenticated (check auth state). If not authenticated, replace with: "Create an account to save templates to your Prompt Library →" linking to the auth flow.

**Single file.** The entire page — data, components, state, and styles — lives in `/src/pages/learn/level-1-context-engineering.tsx`. No separate CSS files. Import only the site Nav component from elsewhere.
```
