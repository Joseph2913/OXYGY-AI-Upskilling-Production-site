# PRD-09: Level 2 E-Learning Module — "From Prompts to Reusable Tools"

**Version:** 1.0
**Date:** 12 March 2026
**Author:** Joseph / Oxygy AI Upskilling
**Status:** Ready for Development

---

## 1. Overview

### 1.1 What This Is

A single self-contained e-learning module for **Level 2: Applied Capability** of the Oxygy AI Upskilling Framework. The module teaches learners how to identify repeated tasks suitable for AI agent design, architect agents using the three-layer model (input, processing, output), build in human-in-the-loop accountability features, and share agents across their team.

### 1.2 Where It Lives

This module lives within the **authenticated dashboard interface** of the platform. The user journey is:

```
My Journey → Level 2: Applied Capability → Topic: "From Prompts to Reusable Tools" → Click "Review" → E-learning page loads
```

This is NOT a standalone marketing page. It renders inside the authenticated app shell with the sidebar navigation visible. The breadcrumb should read:

```
My Journey › Level 2 › From Prompts to Reusable Tools
```

### 1.3 Implementation Reference

The developer MUST read the following skill documents before writing any code:

- **`SKILL-Elearning-MyPage.md`** — The updated execution skill in the Claude Code project. This contains the exact instructions for how the e-learning page integrates within the My Journey dashboard interface. **This takes precedence** for all integration, routing, and shell-level implementation decisions.
- **`SKILL-Elearning-Page.md`** — The e-learning page template skill. This governs the player structure, slide types, phase progression, data arrays, and all component specifications. All slide content, player behaviour, phase logic, and visual tokens come from this file.
- **`ELEARNING_DESIGN_SKILL.md`** — The content design skill. This governs pedagogical structure, the five-beat narrative arc, and content authoring principles. Use for reference on beat sequencing and slide type selection rationale.

### 1.4 Level 2 Accent Colours

Per the Toolkit Page Standard, Level 2 uses:

```
LEVEL_ACCENT:      #F7E8A4  (Pale Yellow)
LEVEL_ACCENT_DARK: #8A6A00  (Dark Gold)
```

These are used for step badges, progress indicators, and any level-identity elements within the dashboard shell. The e-learning player itself uses the standard brand tokens defined in `SKILL-Elearning-Page.md` (teal for progress bar, CTAs, and interactive states).

### 1.5 Target Audience

Any knowledge worker at any seniority level, in any function, at any organisation. All scenarios and examples in this module are professionally universal — they describe tasks every knowledge worker performs (summarising, structuring, drafting, reviewing) and never anchor to a specific job title, department, or industry.

### 1.6 Prerequisite

The learner should have completed Level 1 (Fundamentals & Awareness). This module references the Prompt Blueprint / RCTF framework from Level 1 as a foundation for system prompt design.

---

## 2. Page Structure

The page follows the three-zone vertical structure defined in `SKILL-Elearning-Page.md`:

```
┌─────────────────────────────────────────────────────────┐
│ Page Hero (white bg, border-bottom)                     │
│  - Breadcrumb: My Journey › Level 2 › From Prompts...   │
│  - Level badge: LEVEL 2 (mint bg, teal text, pill)      │
│  - Eyebrow: "APPLIED CAPABILITY"                        │
│  - h1: "From Prompts to Reusable Tools"                 │
│     (teal underline on "Tools")                         │
│  - Description (see §2.1)                               │
│  - Meta pills: ~20 min | 14 slides | Quizzes | Level 2 │
│  - Right: Journey Progress X / 4 phases completed       │
├─────────────────────────────────────────────────────────┤
│ Active Phase Content (full width)                       │
│  Phase 1: E-Learning Player (14 slides)                 │
│  Phase 2: Read (2 articles + reflection)                │
│  Phase 3: Watch (2 videos + knowledge check)            │
│  Handoff CTA: Agent Builder                             │
├─────────────────────────────────────────────────────────┤
│ Journey Strip (always visible)                          │
│  [▶ E-Learning] › [◎ Read] › [▷ Watch] › [◈ Practice]  │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Page Hero Description

> "Level 1 taught you how to write effective prompts. This module shows you when and how to turn a prompt into a permanent, shareable tool — an AI agent with defined inputs, defined behaviour, and structured outputs that runs the same way every time, for anyone on your team."

---

## 3. Phase 1: E-Learning Slide Deck — Content Specification

### 3.0 Design Principles Governing All Slide Content

These principles are mandatory. The developer and content author must verify every slide against them before considering the module complete.

1. **Evidence-led openings, not frustration scenarios.** Beat 1 opens with research data and opportunity framing. Never "you failed" or "you've been doing this wrong."
2. **Gaps are opportunities, not failures.** Beat 2 names what most people haven't been shown — not what they've been getting wrong.
3. **Audience universality.** Every scenario describes tasks any knowledge worker performs. No job titles, no department-specific tasks, no industry-specific workflows.
4. **Tool-agnostic in teaching content.** No specific AI tool names (ChatGPT, Claude, Copilot, Gemini) in scenarios or teaching slides. Use "your AI tool," "the AI," or "any large language model." Tool-specific features are permitted ONLY in Beat 5 (Bridge) and the templates slide.
5. **No strawman contrasts.** Before/after comparisons show genuine attempts on both sides. The difference is in technique, not effort.
6. **No "best practice" language.** Frameworks are presented as effective tools in a broader toolkit, with situational judgment for when to use them vs. alternatives.
7. **One idea per slide.** If the slide teaches two concepts, split it.
8. **460px content area constraint.** All content must fit or scroll within the fixed 460px player content area. Dense content uses the expandable accordion pattern.

### 3.1 Anchor Scenario

The module uses a single professionally universal task throughout all five beats:

> **Preparing a structured weekly status update from multiple inputs (meeting notes, emails, project tracker entries) into a consistent format for a team or leadership audience.**

This task is performed across every function, every seniority level, every industry. It recurs weekly, it needs consistency, multiple people do it, and inconsistency causes downstream confusion — making it a natural Level 2 candidate.

---

### SLIDE 1 — Title Slide

```
type: "title"
id: 1
section: "THE LEVEL 2 SHIFT"
```

| Field | Content |
|-------|---------|
| **heading** | `From Prompts to Reusable Tools` (teal underline on "Tools") |
| **subheading** | `Building AI agents that standardise quality, save time, and scale across your team` |
| **meta** | `["~20 min", "14 slides", "Quizzes included", "Interactive exercises"]` |
| **body** | `Level 1 taught you how to write effective prompts. This module shows you when and how to turn a prompt into a permanent, shareable tool — an AI agent that runs the same way every time, for anyone on your team.` |

**Eyebrow:** `OXYGY AI UPSKILLING — LEVEL 2`

---

### SLIDE 2 — Beat 1: Evidence-Led Opening

```
type: "concept"
id: 2
section: "THE LEVEL 2 SHIFT"
```

**Beat:** SITUATION
**Teaching goal:** Establish why the Level 1-to-Level 2 shift matters, using evidence rather than assumed frustration.

| Field | Content |
|-------|---------|
| **heading** | `The gap between using AI and scaling AI` (teal underline on "scaling") |
| **body** | `Research consistently shows that professionals who use AI regularly report productivity gains of 20–40%. But only a fraction of those gains extend beyond the individual — most AI usage stays ad-hoc, unrepeatable, and invisible to the rest of the team. The difference between personal productivity and organisational capability isn't how well you prompt. It's whether you've turned your best prompts into tools others can use.` |
| **pullQuote** | `The organisations seeing the largest returns from AI aren't prompting better. They're building reusable tools from their best prompts.` |
| **visual** | Right panel: A simple diagram showing the "adoption gap" — two horizontal bars. Top bar (wide, teal fill): "Individual AI usage — high." Bottom bar (narrow, muted fill): "Team-wide standardised AI tools — low." A gap indicator between them labelled "Untapped value." |

**Tone:** Curiosity and opportunity. The learner should feel "I didn't know that — tell me more," not "I've been doing this wrong."

---

### SLIDE 3 — Beat 2: The Knowledge Gap

```
type: "concept"
id: 3
section: "THE LEVEL 2 SHIFT"
```

**Beat:** TENSION
**Teaching goal:** Name the knowledge gap — what most people haven't been shown — without implying failure.

| Field | Content |
|-------|---------|
| **heading** | `What most people haven't been shown` (teal underline on "shown") |
| **body** | `When you write a prompt that works well, you move on. Next week, you write something similar — but slightly different. A colleague writes their own version for the same task. The outputs vary in structure and detail. There's no shared standard, no way to replicate good results consistently. This isn't a failure — it's simply what happens when the step from prompt to tool hasn't been taken yet.` |
| **pullQuote** | `Level 1 is for the individual moment. Level 2 is for the repeated pattern.` |
| **visual** | Right panel: Three diverging path lines from a single task node. Path 1: "You prompt → Output A." Path 2: "You prompt again → Output B (different format)." Path 3: "Colleague prompts → Output C (completely different)." All three paths originate from the same task label: "Weekly status update." |

**Framing:** The tension is an opportunity gap, not a performance criticism. The language is "here's what most people haven't been shown" — never "here's what you've been doing wrong."

---

### SLIDE 4 — Beat 3, Theme 1: The Level 1 → Level 2 Distinction

```
type: "concept"
id: 4
section: "BUILDING REUSABLE TOOLS"
```

**Beat:** CONCEPT
**Teaching goal:** Define the Level 1 vs. Level 2 distinction crisply. Level 1 = ad-hoc. Level 2 = standardised input + defined behaviour + structured output.

| Field | Content |
|-------|---------|
| **heading** | `From one-off prompts to standardised agents` (teal underline on "standardised") |
| **body** | `The shift from Level 1 to Level 2 isn't about complexity — it's about repeatability. At Level 1, you prompt individually, get an answer, and move on. At Level 2, you've identified a repeated task and you standardise three things: what goes in (the input format), how the AI behaves (the system prompt), and what comes out (the structured output). The result runs the same way every time, for anyone.` |
| **pullQuote** | `A Level 2 agent is a prompt that's been promoted to a permanent tool — with defined inputs, defined behaviour, and defined outputs.` |
| **visual** | Right panel: Two rows stacked vertically. **Top row** (muted border, light bg): "Level 1 — Prompt → Answer → Done" with a single-use arrow. **Bottom row** (teal border, tealLight bg): "Level 2 — Defined Input → System Prompt → Structured Output" with a loop arrow returning to "Defined Input" and a "Share" icon branching to multiple user silhouettes. |

---

### SLIDE 5 — Beat 3, Theme 2: Spotting Level 2 Opportunities

```
type: "spectrum"
id: 5
section: "BUILDING REUSABLE TOOLS"
```

**Beat:** CONCEPT
**Teaching goal:** Teach the learner to distinguish Level 1 tasks from Level 2 tasks using four criteria, presented as a spectrum rather than a binary rule.

| Field | Content |
|-------|---------|
| **heading** | `When to build an agent vs. when to just prompt` (teal underline on "prompt") |
| **body** | `Not every task needs a reusable agent. The skill is recognising when a task's characteristics make it worth the investment. Use this spectrum to calibrate — and remember, the right approach depends on the situation.` |

**Positions (3):**

| Position | Label | Description | Example |
|----------|-------|-------------|---------|
| 0 (left) | `Stay at Level 1` | `Low frequency, unique each time, no one else needs it. An ad-hoc prompt is the right tool for this.` | `"Drafting a one-time message about a unique situation — different every time, no repeatable pattern."` |
| 1 (centre) | `Consider Level 2` | `Moderate frequency, some consistency benefits, could be useful for one or two others. Worth evaluating further.` | `"Summarising meeting notes into action items — happens regularly, but the format isn't critical to standardise yet."` |
| 2 (right) | `Build a Level 2 Agent` | `High frequency, output must be consistent, multiple people do the same task, inconsistency causes problems downstream.` | `"Preparing a structured weekly status update from multiple inputs — happens every week, the team needs a standard format, and inconsistent outputs cause confusion."` |

**Default position:** 2 (rightmost)

**Developer note:** The spectrum interaction lets the learner explore the gradient. This avoids "one right answer" framing.

---

### SLIDE 6 — Quiz: Level 2 Suitability

```
type: "quiz"
id: 6
section: "BUILDING REUSABLE TOOLS"
```

**Beat:** CONCEPT (knowledge check)

| Field | Content |
|-------|---------|
| **heading** | `Quick check` |
| **question** | `A colleague uses AI every morning to proofread their own emails before sending. The output doesn't need a specific format, and no one else on the team uses the same prompt. Which level is this?` |
| **options** | `["Level 1 — ad-hoc prompting is the right fit", "Level 2 — this should be built as a reusable agent", "It depends on how complex the emails are", "It depends on how many emails they send"]` |
| **correct** | `0` |
| **explanation** | `This is Level 1 territory. The task is personal, the format doesn't need to be standardised, and there's no team-wide benefit to packaging it as a shared tool. Frequency alone doesn't make something a Level 2 candidate — consistency needs and shareability matter just as much.` |

**Eyebrow:** `PRACTICE — QUESTION 1 OF 3`

---

### SLIDE 7 — Beat 3, Theme 3: The Three-Layer Architecture

```
type: "concept"
id: 7
section: "THE THREE LAYERS"
```

**Beat:** CONCEPT
**Teaching goal:** Introduce the three-layer model (Input → Processing → Output) as the structural backbone of every Level 2 agent.

| Field | Content |
|-------|---------|
| **heading** | `Input, processing, output — the anatomy of a Level 2 agent` (teal underline on "output") |
| **body** | `Every Level 2 agent is built from three layers. Layer 1 — Input Definition: what data does the user provide each time, and in what format? Layer 2 — Processing / Behaviour: the system prompt — role definition, task instructions, reasoning steps, quality checks. This is the agent's permanent operating manual. Layer 3 — Output Definition: what structure does the output take? What fields, what format? This is where structured output — including JSON — ensures consistency across every run.` |
| **pullQuote** | `The system prompt is the Prompt Blueprint from Level 1 — promoted. What was a one-off prompt becomes permanent instructions.` |
| **visual** | Right panel: Three stacked rows, each with a coloured left border and label. **Row 1** (role colour `#667EEA`, light bg `#EBF4FF`): "INPUT — What goes in. Data format, required fields, what the user provides." **Row 2** (context colour `#38B2AC`, light bg `#E6FFFA`): "PROCESSING — How it behaves. System prompt: role, task, steps, checks." **Row 3** (format colour `#48BB78`, light bg `#F0FFF4`): "OUTPUT — What comes out. Structured format, JSON schema, consistent fields." Connecting downward arrows between rows. |

---

### SLIDE 8 — Beat 3, Theme 3 continued: Three Layers in Action

```
type: "comparison"
id: 8
section: "THE THREE LAYERS"
```

**Beat:** CONCEPT
**Teaching goal:** Show the same task approached three ways — ad-hoc, partially structured, and fully structured — so the learner sees the progressive build without any approach being labelled "wrong."

| Field | Content |
|-------|---------|
| **heading** | `The same task, three approaches` |
| **scenario** | `You need to produce a structured weekly status update from meeting notes, email threads, and project tracker entries.` |

**Tabs (3):**

| Tab | Label | Prompt | Annotation |
|-----|-------|--------|------------|
| 1 | `Ad-hoc prompt` | `Summarise these notes into a status update for my team.` | `No defined input format. No behaviour instructions. No output structure. Works once — but the result is different every time and from every person.` |
| 2 | `With input + processing defined` | `You are a project status analyst. I will provide meeting notes, email excerpts, and tracker data. For each project: identify current status (on track / at risk / blocked), summarise key updates in 2–3 sentences, and list next actions with owners.` | `The role and task are now defined. The AI knows what to do and how to reason about it — but the output is still free-form text. Format varies run to run.` |
| 3 | `Full three-layer agent` | `You are a project status analyst. I will provide meeting notes, email excerpts, and tracker data. For each project: identify current status, summarise key updates, and list next actions with owners. Output as JSON with fields: project_name (string), status (enum: on_track / at_risk / blocked), summary (string), key_updates (array of strings), next_actions (array of {action, owner, deadline}), confidence_score (float 0–1), evidence_sources (array of strings).` | `Now the output is structured, consistent, and machine-readable. Every run produces the same format — comparable week over week, shareable across the team, and ready for dashboards at Level 3.` |

**Developer notes:**
- Tabs 2 and 3 should use diff highlighting (green background) on the additions relative to the previous tab.
- Prompt text uses the prompt box style (§7 of SKILL-Elearning-Page.md).
- The prompt text in Tabs 2 and 3 is long. Use the **expandable accordion pattern** — show the first 3 lines by default with "Show full prompt ▾" toggle. The annotation is always visible in collapsed state so the pedagogical point lands without expansion.

---

### SLIDE 9 — Beat 3, Theme 4: Human-in-the-Loop by Design

```
type: "concept"
id: 9
section: "ACCOUNTABILITY BY DESIGN"
```

**Beat:** CONCEPT
**Teaching goal:** Define human-in-the-loop in the Level 2 context — designing the agent so that verification is fast and targeted, not just reminding people to "check the output."

| Field | Content |
|-------|---------|
| **heading** | `Designing agents that make verification easy` (teal underline on "verification") |
| **body** | `Human-in-the-loop isn't "review the output before you act on it" — that's expected regardless. The real skill is designing the agent so that verification is fast, targeted, and built into the output itself. This means writing specific instructions into the system prompt — Layer 2 — that require the AI to show its working, cite its sources, and flag its uncertainties.` |
| **pullQuote** | `A well-designed agent doesn't just give you answers. It gives you the evidence to check them in minutes, not hours.` |
| **visual** | Right panel: A simplified output card with four annotation callouts, each pointing to a specific part of the output. Callout 1 (top): "Source cited" → points to a bracketed reference. Callout 2: "Confidence scored" → points to "0.82." Callout 3: "Reasoning shown" → points to an italicised logic sentence. Callout 4 (bottom): "Anomaly flagged" → points to a warning icon + text. Each callout is a small pill with the label, using muted colours. |

---

### SLIDE 10 — Beat 3, Theme 4 continued: HITL in Practice

```
type: "flipcard"
id: 10
section: "ACCOUNTABILITY BY DESIGN"
```

**Beat:** CONCEPT
**Teaching goal:** Show — through interactive before/after — how built-in accountability features transform the usefulness and trustworthiness of an agent's output.

| Field | Content |
|-------|---------|
| **heading** | `What accountability looks like in the output` |
| **instruction** | `Click each card to see how built-in accountability features change the agent's output.` |

**Cards (2):**

**Card 1:**

| Field | Content |
|-------|---------|
| **frontLabel** | `Status update — standard output` |
| **frontBadge** | `WITHOUT ACCOUNTABILITY FEATURES` |
| **frontPrompt** | `Project Alpha: On track. Key updates: stakeholder meeting confirmed, timeline approved. Next actions: finalise budget, schedule review.` |
| **backLabel** | `Status update — with accountability features` |
| **backBadge** | `WITH ACCOUNTABILITY FEATURES` |
| **backPrompt** | `Project Alpha: On track (confidence: 0.85). Key updates: stakeholder meeting confirmed [source: email from J. Lee, 7 Mar], timeline approved [source: meeting notes, 5 Mar]. Next actions: finalise budget (owner: finance lead, deadline: 14 Mar), schedule review (owner: PM, deadline: 12 Mar). Note: no tracker update found for Project Alpha since 28 Feb — recommend verifying current status directly.` |
| **backResponse** | `The second version adds source citations, a confidence score, ownership and deadlines on actions, and an anomaly flag — all from system prompt instructions, not from the user doing extra work.` |

**Card 2:**

| Field | Content |
|-------|---------|
| **frontLabel** | `Research summary — standard output` |
| **frontBadge** | `WITHOUT ACCOUNTABILITY FEATURES` |
| **frontPrompt** | `The three most common themes across the documents are: digital transformation readiness, resource allocation concerns, and stakeholder alignment challenges.` |
| **backLabel** | `Research summary — with accountability features` |
| **backBadge** | `WITH ACCOUNTABILITY FEATURES` |
| **backPrompt** | `Theme 1: Digital transformation readiness (confidence: 0.91, cited in docs 1, 3, 4 — paragraphs 2, 7, 12). Theme 2: Resource allocation concerns (confidence: 0.78, cited in docs 2, 4 — paragraphs 4, 9). Theme 3: Stakeholder alignment (confidence: 0.64, cited in doc 3 only — paragraph 11. Low confidence: only one source document supports this theme. Suggested verification: review doc 3, paragraph 11 directly).` |
| **backResponse** | `Source locations, confidence scoring, and a low-confidence flag with a specific verification suggestion — the human reviewer knows exactly where to look and what to check.` |

**Developer notes:**
- Prompt text in both front and back faces uses the prompt box style.
- Back face prompt text is long — use the expandable accordion pattern. Show 3 lines by default. The `backResponse` summary text below is always visible and conveys the teaching point without expansion.

---

### SLIDE 11 — Quiz: Human-in-the-Loop

```
type: "quiz"
id: 11
section: "ACCOUNTABILITY BY DESIGN"
```

**Beat:** CONCEPT (knowledge check)

| Field | Content |
|-------|---------|
| **heading** | `Quick check` |
| **question** | `Where are human-in-the-loop accountability features implemented in a Level 2 agent?` |
| **options** | `["In a separate review checklist given to the person using the output", "In the system prompt (Layer 2) — as instructions the agent follows every time", "In the output template (Layer 3) — as required JSON fields", "In both the system prompt and the output template working together"]` |
| **correct** | `3` |
| **explanation** | `The accountability features are written as instructions in the system prompt (Layer 2) — telling the AI to cite sources, score confidence, show reasoning, and flag anomalies. But they also need corresponding fields in the output template (Layer 3) so there's a consistent place for this information in every output. Both layers work together.` |

**Eyebrow:** `PRACTICE — QUESTION 2 OF 3`

---

### SLIDE 12 — Beat 3, Theme 5: Build Once, Share Always

```
type: "concept"
id: 12
section: "FROM TOOL TO TEAM ASSET"
```

**Beat:** CONCEPT
**Teaching goal:** Establish that the value of a Level 2 agent is only fully realised when it's shared — and that sharing requires documentation, standardised inputs, and cold testing.

| Field | Content |
|-------|---------|
| **heading** | `The value multiplier: sharing what you've built` (teal underline on "sharing") |
| **body** | `A Level 2 agent that only you use is a personal shortcut. The same agent, documented and shared, becomes team infrastructure. The sharing step is where the real return on investment happens — one person's design effort multiplied across everyone who does the same task. This requires three things: an Agent Card that documents scope and limitations, a standardised input template so anyone can provide the right data, and a cold test — having someone unfamiliar run the agent using only the documentation.` |
| **pullQuote** | `The principle is simple: build once, share always. The agent captures your expertise in a form anyone can use.` |
| **visual** | Right panel: A simple hub-and-spoke diagram. Centre: an "Agent" node with an "Agent Card" document icon attached. Radiating outward: 4–5 user silhouette icons connected by lines, each with a small "Input Template" icon at their connection point. One spoke is highlighted with a "New team member" label and a clock icon showing "5 min to productive." |

---

### SLIDE 13 — Beat 4: Technique in Action

```
type: "branching"
id: 13
section: "TECHNIQUE IN ACTION"
```

**Beat:** CONTRAST
**Teaching goal:** Let the learner explore three approaches to the same challenge and see the consequences of each — without any being labelled "wrong."

| Field | Content |
|-------|---------|
| **heading** | `Your team needs a standardised weekly status tool` |
| **scenario** | `Your team lead has asked you to create a reusable tool for producing the weekly status update. Multiple team members will use it. The output goes directly to leadership. How would you approach this?` |

**Options (3):**

**Option A:**

| Field | Content |
|-------|---------|
| **label** | `Share a well-crafted prompt` |
| **prompt** | `Write a detailed prompt for the weekly status update task and share it with the team via email or a shared document, so colleagues can copy-paste it when they need it.` |
| **responseQuality** | `partial` |
| **response** | `The prompt works well — for you. But each team member tweaks the wording slightly. Outputs vary in structure and detail. When a colleague forgets a section, leadership gets an incomplete update. There's no way to trace where any particular insight came from. A new joiner asks "how do I use this?" and you have to walk them through it in person.` |
| **reflection** | `A shared prompt is a good start — it's better than everyone writing their own from scratch. But without standardised inputs, defined processing behaviour, and structured outputs, consistency breaks down as soon as multiple people use it.` |

**Option B:**

| Field | Content |
|-------|---------|
| **label** | `Build a three-layer agent (without accountability)` |
| **prompt** | `Define an input format (what to paste), write a system prompt with role and task instructions, and create a JSON output template so every run produces the same structured result. Skip the accountability features — trust the team to review the output manually.` |
| **responseQuality** | `partial` |
| **response** | `Consistent format across the team — every status update looks the same. But when leadership asks "which meeting did this insight come from?" nobody can trace it back without manually searching the source notes. A low-confidence conclusion slips through because the output didn't flag its uncertainty. The tool is reliable but not verifiable.` |
| **reflection** | `The structure is right — three layers are in place, and the team gets consistent outputs. But without accountability features (source citations, confidence scoring, anomaly flagging), the output is consistent but not verifiable. Adding those features completes the design.` |

**Option C:**

| Field | Content |
|-------|---------|
| **label** | `Build a full Level 2 agent with accountability` |
| **prompt** | `Define an input template, write a system prompt with role, task, steps, quality checks, and accountability features (cite sources, score confidence, flag anomalies). Create a JSON output schema with fields for all of these. Write an Agent Card documenting the tool's scope, limitations, and verification checkpoints. Share via the team's platform.` |
| **responseQuality** | `strong` |
| **response** | `Every team member gets the same structured output. Each insight is cited back to specific meeting notes or emails. Low-confidence conclusions are flagged with a verification suggestion. A new team member picks it up in five minutes using the Agent Card. Leadership trusts the updates because every claim can be traced to its source.` |
| **reflection** | `This is the complete Level 2 approach: three layers plus accountability features plus documentation for sharing. The investment is in the upfront design — the return compounds with every run and every person who uses it.` |

**Developer notes:**
- The prompt text in each option card is dense. Use the expandable accordion pattern — show the first 2 lines by default. The response and reflection are revealed on selection, not on page load.
- All three options represent genuine, reasonable approaches. Option A is not "wrong" — it's simply Level 1 thinking applied to a Level 2 situation. Option B is structurally sound but incomplete.

---

### SLIDE 14 — Beat 5: Bridge — From Theory to Practice

```
type: "templates"
id: 14
section: "YOUR NEXT STEP"
```

**Beat:** BRIDGE
**Teaching goal:** Give the learner four concrete, copyable artefacts they can use immediately. Connect the module to the Agent Builder tool.

| Field | Content |
|-------|---------|
| **heading** | `Templates to take with you` |

**Templates (4):**

**Template 1:**

| Field | Content |
|-------|---------|
| **id** | `t1` |
| **name** | `Agent Suitability Check` |
| **tag** | `Decision Aid` |
| **tagColor** | `#38B2AC` (teal) |
| **template** | `AGENT SUITABILITY CHECK\n\nAnswer these four questions about your task:\n\n1. FREQUENCY: Does this task happen at least weekly?\n   [ ] Yes  [ ] No\n\n2. CONSISTENCY: Does the output need to follow the same structure every time?\n   [ ] Yes  [ ] No\n\n3. SHAREABILITY: Would others on the team benefit from the exact same tool?\n   [ ] Yes  [ ] No\n\n4. STANDARDISATION RISK: Would inconsistent outputs cause confusion or problems downstream?\n   [ ] Yes  [ ] No\n\nVERDICT:\n→ 0–1 "Yes" answers: Stay at Level 1. Ad-hoc prompting is the right approach.\n→ 2–3 "Yes" answers: Consider Level 2. Evaluate whether the investment is worth it.\n→ 4 "Yes" answers: Build a Level 2 agent. You should have built this last month.` |

**Template 2:**

| Field | Content |
|-------|---------|
| **id** | `t2` |
| **name** | `Three-Layer Agent Design Starter` |
| **tag** | `Agent Design` |
| **tagColor** | `#C3D0F5` (lavender) |
| **template** | `THREE-LAYER AGENT DESIGN\n\n─── LAYER 1: INPUT DEFINITION ───\nData source: [What does the user provide? E.g., CSV, meeting notes, email text]\nRequired fields: [What must be included every time?]\nInput format: [Paste text? Upload file? Fill a template?]\nValidation: [What happens if something is missing?]\n\n─── LAYER 2: PROCESSING / SYSTEM PROMPT ───\n[ROLE]: You are a [role description].\n[CONTEXT]: [Background information the agent needs to know]\n[TASK]: [Specific instructions for what to do with the input]\n[STEPS]: [Ordered reasoning steps]\n[QUALITY CHECKS]: [Constraints, edge cases, things to watch for]\n[OUTPUT FORMAT]: [See Layer 3]\n\n─── LAYER 3: OUTPUT DEFINITION ───\nFormat: [JSON / structured text / other]\nKey fields: [\n  field_name (type): description\n  field_name (type): description\n]\nAccountability fields: [\n  confidence_score (float 0–1)\n  evidence_sources (array of strings)\n  reasoning (string)\n  anomalies_flagged (array of strings)\n]` |

**Template 3:**

| Field | Content |
|-------|---------|
| **id** | `t3` |
| **name** | `HITL Prompt Additions` |
| **tag** | `Accountability` |
| **tagColor** | `#A8F0E0` (mint) |
| **template** | `HUMAN-IN-THE-LOOP PROMPT ADDITIONS\n\nAdd these instructions to your system prompt (Layer 2) to build accountability into every output:\n\n1. SOURCE CITATION:\n   "For each conclusion or insight, cite the specific input data that informed it. Reference the source type and location (e.g., 'meeting notes, paragraph 3' or 'email from [sender], [date]')."\n\n2. CONFIDENCE SCORING:\n   "Rate your confidence in each conclusion on a scale of 0–1. Flag any conclusion with confidence below 0.7 with a warning note."\n\n3. REASONING TRAIL:\n   "For each major conclusion, provide a one-sentence explanation of your reasoning — not just the conclusion itself."\n\n4. EXCEPTION FLAGGING:\n   "Explicitly call out: inputs you could not process, contradictions between sources, missing data that would improve the analysis, and any assumptions you made."\n\n5. VERIFICATION PROMPTS:\n   "At the end of each output, suggest 1–2 specific things the human reviewer should check to verify the most important conclusions."` |

**Template 4:**

| Field | Content |
|-------|---------|
| **id** | `t4` |
| **name** | `Agent Card Template` |
| **tag** | `Sharing` |
| **tagColor** | `#F5B8A0` (peach) |
| **template** | `AGENT CARD\n\nAGENT NAME: [Name]\nPURPOSE: [One sentence — what does this agent do?]\n\nINPUT REQUIRED:\n- Data source: [What the user provides]\n- Format: [How to provide it]\n- Required fields: [What must be included]\n\nOUTPUT FORMAT:\n- Type: [JSON / structured text / other]\n- Key fields: [List the main output fields]\n- Accountability features: [Citations, confidence, reasoning, flags]\n\nLIMITATIONS:\n- [What this agent does NOT do]\n- [Known edge cases or failure modes]\n- [Maximum input size or complexity]\n\nHITL CHECKPOINTS:\n- [What should the reviewer always verify?]\n- [Which outputs are most likely to need correction?]\n\nOWNER: [Who to contact with issues or improvement suggestions]\nLAST UPDATED: [Date]` |

**Developer notes:**
- Each template card has a copy button that changes to "Copied ✓" for 2000ms.
- The final slide's nav button reads "Finish E-Learning →" and advances to Read phase on click.
- This slide is the bridge to the Agent Builder tool. A brief text line below the templates grid should read: "Ready to build? The Agent Builder walks you through all three layers step by step." (This foreshadows the Handoff CTA without duplicating it.)

---

## 4. Phase 2: Read — Articles + Reflection

Two articles, displayed in a two-column grid per `SKILL-Elearning-Page.md` §8.

### ARTICLES Array

**Article 1:**

| Field | Content |
|-------|---------|
| **id** | `a1` |
| **title** | `TBD — Article on scaling AI from individual use to team-wide standardised tools` |
| **source** | `TBD (target: HBR, MIT Sloan Review, or equivalent)` |
| **readTime** | `~8 min read` |
| **desc** | `This article examines why most organisations see AI productivity gains at the individual level but struggle to scale those gains across teams. It explores the structural gap between personal AI usage and standardised, repeatable AI tools — and what organisations that have closed that gap did differently.` |
| **url** | `TBD — URL must be verified before deployment` |
| **reflection** | `Think about one task in your work that you do at least weekly and that someone else on your team also does. What would need to be true about the input, the AI's behaviour, and the output format for a reusable tool to handle it reliably?` |

**Article 2:**

| Field | Content |
|-------|---------|
| **id** | `a2` |
| **title** | `TBD — Article on trust, verifiability, and accountability in AI-generated outputs` |
| **source** | `TBD (target: industry publication on AI governance or practical AI adoption)` |
| **readTime** | `~6 min read` |
| **desc** | `This article explores what makes AI-generated outputs trustworthy at an organisational level — focusing on citability, confidence signalling, and the design decisions that make human verification fast rather than burdensome. It argues that trust in AI is designed, not assumed.` |
| **url** | `TBD — URL must be verified before deployment` |
| **reflection** | `If a senior stakeholder asked you to prove that an AI-generated summary was accurate, what specific features in the output would make that possible in under two minutes?` |

**Action required:** Article URLs must be sourced and verified before locking in. Same caution as Level 1 YouTube URL verification — confirmed sources only.

---

## 5. Phase 3: Watch — Videos + Knowledge Check

Two videos, displayed in a single-column stacked layout per `SKILL-Elearning-Page.md` §9.

### VIDEOS Array

**Video 1:**

| Field | Content |
|-------|---------|
| **id** | `v1` |
| **title** | `TBD — Video on building custom AI agents / reusable AI tools` |
| **channel** | `TBD` |
| **duration** | `~10 min` |
| **desc** | `A practical walkthrough of how to design AI agents that go beyond one-off prompting — covering how to define the agent's role, structure its instructions, and create consistent output formats. Relevant to any AI tool, not platform-specific.` |
| **url** | `TBD — URL must be verified before deployment` |
| **quiz** | See below |

Video 1 Quiz:

| Q | Question | Options | Correct |
|---|----------|---------|---------|
| 1 | `What is the primary difference between a one-off prompt and a Level 2 agent?` | `["The agent uses a more advanced AI model", "The agent has permanent instructions that define its input, behaviour, and output", "The agent can access the internet", "The agent is more expensive to run"]` | `1` |
| 2 | `In the three-layer agent model, what does Layer 2 (Processing) contain?` | `["The data the user provides", "The JSON output template", "The system prompt — role, task, steps, and quality checks", "The sharing documentation"]` | `2` |

**Video 2:**

| Field | Content |
|-------|---------|
| **id** | `v2` |
| **title** | `TBD — Video on AI accountability, structured outputs, or human oversight in AI workflows` |
| **channel** | `TBD` |
| **duration** | `~8 min` |
| **desc** | `An exploration of how to design AI tools that support human oversight — covering techniques like source citation, confidence scoring, and structured output formats that make verification fast and targeted.` |
| **url** | `TBD — URL must be verified before deployment` |
| **quiz** | See below |

Video 2 Quiz:

| Q | Question | Options | Correct |
|---|----------|---------|---------|
| 1 | `What is the purpose of including a confidence score in an AI agent's output?` | `["To make the output look more professional", "To help the reviewer know where to focus their verification effort", "To prove the AI is always accurate", "To meet compliance requirements"]` | `1` |
| 2 | `What does 'Build Once, Share Always' mean in the Level 2 context?` | `["Every prompt should be saved to a personal library", "Agents should be designed once, documented, and deployed for the whole team to use", "AI tools should be purchased from vendors, not built internally", "The system prompt should never be changed after the first version"]` | `1` |

**Action required:** Video URLs must be sourced and verified before deployment. Target creators who demonstrate agent design concepts in a tool-agnostic or transferable way.

---

## 6. Handoff CTA

When all three phases are complete, the Handoff CTA renders:

| Field | Content |
|-------|---------|
| **eyebrow** | `NEXT STEP` |
| **heading** | `Agent Builder` |
| **description** | `Design your first Level 2 agent. Define the input format, write the system prompt using the six-section structure, create a structured output template with accountability features, and generate an Agent Card for team deployment — all in one guided workspace.` |
| **CTA button** | `Open Agent Builder →` |
| **CTA link** | Route to the Agent Builder tool page within the app (`/app/toolkit/agent-builder` or equivalent) |

Layout: Centred card, white bg, bordered, `borderRadius: 16`, `padding: 48px`. Teal CTA button.

---

## 7. PHASES Array

```js
const PHASES = [
  { id: "elearn",   label: "E-Learning", icon: "▶", time: "~20 min",  desc: "Interactive slide module" },
  { id: "read",     label: "Read",       icon: "◎", time: "~15 min",  desc: "2 articles + reflection" },
  { id: "watch",    label: "Watch",      icon: "▷", time: "~18 min",  desc: "2 videos + knowledge check" },
  { id: "practice", label: "Practice",   icon: "◈", time: "~30 min",  desc: "Agent Builder →", external: true },
];
```

---

## 8. State Architecture

Extend the base state structure from `SKILL-Elearning-Page.md` §12/13:

```js
// Phase navigation
const [activePhase, setActivePhase] = useState("elearn");
const [phasesDone, setPhasesDone] = useState(new Set());

// E-learning player
const [slide, setSlide] = useState(0);
const [visitedSlides, setVisitedSlides] = useState(new Set([0]));
const [selectedAnswer, setSelectedAnswer] = useState(null);
const [answered, setAnswered] = useState(false);
const [spectrumPos, setSpectrumPos] = useState(2);      // Slide 5
const [flippedCards, setFlippedCards] = useState({});    // Slide 10

// Read phase
const [articleState, setArticleState] = useState({});

// Watch phase
const [videoState, setVideoState] = useState({});

// Completion helpers
const markPhaseDone = (id) => setPhasesDone(prev => new Set([...prev, id]));
const readDone = ARTICLES.every(a => articleState[a.id]?.submitted);
const watchDone = VIDEOS.every(v => videoState[v.id]?.clicked && videoState[v.id]?.quizChecked?.every(Boolean));
```

Additional state needed for this module:
- `branchingSelection` (number | null) — tracks which option the learner selected on Slide 13
- Expandable accordion states for Slides 8, 10, and 13 (one boolean per expandable section)

---

## 9. Developer Notes

### 9.1 Critical Implementation References

1. **Read `SKILL-Elearning-MyPage.md` first** — This file (in the Claude Code project) contains the exact integration instructions for how this page renders within the My Journey dashboard. It takes precedence for all routing, shell, and navigation decisions.

2. **Read `SKILL-Elearning-Page.md` second** — This file contains every component specification, slide type definition, brand token, and quality rule. Do not deviate from it.

3. **Read `ELEARNING_DESIGN_SKILL.md` for content reference** — Use for understanding the five-beat arc, escalation guidance, and pedagogical rationale.

### 9.2 Slide Type Summary

| Slide | Type | Beat | Section |
|-------|------|------|---------|
| 1 | `courseIntro` | Setup | DESIGNING YOUR FIRST AI AGENT |
| 2 | `evidenceHero` | Beat 1 | THE STANDARDISATION GAP |
| 3 | `evidenceHero` | Beat 1 | THE STANDARDISATION GAP |
| 4 | `tensionStatement` | Beat 2 | THE LEVEL 2 SHIFT |
| 5 | `concept` — definition (`l2-agent-vs-prompt` visual) | Beat 3 | WHAT IS AN AGENT |
| 6 | `concept` — decision criteria (`l2-agent-decision` visual) | Beat 3 | KNOW THE DIFFERENCE |
| 7 | `situationalJudgment` | Beat 5 | WHEN TO BUILD ONE |
| 8 | `concept` — anatomy (`l2-three-layers` visual) | Beat 3 | THE THREE-LAYER MODEL |
| 9 | `rctf` (revealOnNext) | Beat 3 | THE THREE-LAYER MODEL |
| 10 | `comparison` | Beat 4 | IN PRACTICE |
| 11 | `moduleSummary` | Bridge | WHAT YOU'VE LEARNED |

> **Note (2026-03-20):** Slide structure updated from the original PRD-09 v1.0 design (14 slides with legacy types: `spectrum`, `flipcard`, `branching`, `templates`) to match the implemented ELEARNING-CONTENT-PRD template. Slide 5 ("What is an AI agent?") added to provide a plain-language definition before decision criteria and judgment slides — per the definition-before-judgment rule added to ELEARNING-CONTENT-PRD §17 and §18.

### 9.3 Expandable Accordion Requirements

The following slides contain content that will exceed comfortable reading within the 460px content area and MUST use the expandable accordion pattern:

- **Slide 8** (`comparison`): Tabs 2 and 3 have long prompt text. Show first 3 lines by default, accordion for full text. Annotations always visible.
- **Slide 10** (`flipcard`): Back face prompt text is long. Show first 3 lines, accordion for full text. `backResponse` summary always visible below.
- **Slide 13** (`branching`): Option prompt descriptions are dense. Show first 2 lines, accordion for full text. Response and reflection revealed on selection.

### 9.4 Quality Checklist

Before considering the page complete, verify:

- [ ] All slide content fits or scrolls within the 460px content area — no content bleeds
- [ ] Player card height never changes between slides
- [ ] All cards use explicit padding (minimum `14px 16px`)
- [ ] All prompt text uses the prompt box style (§7 of SKILL-Elearning-Page)
- [ ] No emoji in UI — phase icons use geometric unicode characters
- [ ] Google Fonts (DM Sans + Plus Jakarta Sans) loaded via `@import`
- [ ] All borders are `1px solid #E2E8F0`
- [ ] Vertical composition is balanced across the full 460px content area per §16 of SKILL-Elearning-Page
- [ ] Journey strip is always rendered, even on Phase 1
- [ ] Tool-agnostic content in all teaching slides — no AI tool names except in templates (Slide 14)
- [ ] No scenarios anchored to specific job titles or departments
- [ ] No "best practice" language — frameworks presented as effective tools with situational judgment
- [ ] Before/after comparisons show genuine attempts on both sides — no strawmanning
- [ ] Beat 1 uses evidence-led opening, not frustration scenario
- [ ] All statistics or claims are attributable

### 9.5 Dependencies

- Level 1 e-learning module (for Prompt Blueprint / RCTF callback reference)
- Agent Builder tool page (for Handoff CTA destination)
- Article and video URLs (TBD — must be sourced and verified before deployment)
- `SKILL-Elearning-MyPage.md` (updated version in Claude Code project — must be read before implementation)

### 9.6 Out of Scope

- The Agent Builder tool itself (separate PRD / already built)
- Tool-specific tutorials for ChatGPT Custom GPT Builder, Claude Projects, etc. (these are live workshop content, not self-paced e-learning)
- Client-specific responsible AI policies (live session content only)
- Level 3 workflow automation content (separate module)

---

## 10. Content Narrative Summary

The module tells one continuous story across all 14 slides:

**Slides 1–3 (Situation + Tension):** The evidence shows most AI usage stays individual and ad-hoc. The knowledge gap isn't about prompting skill — it's about the step from prompt to tool that most people haven't been shown.

**Slides 4–6 (Concept — Themes 1–2):** Level 2 is about identifying repeated tasks and standardising them. Not every task qualifies — the spectrum helps the learner calibrate when to build an agent vs. when to just prompt.

**Slides 7–8 (Concept — Theme 3):** Every Level 2 agent has three layers: input, processing, output. The same task shown three ways reveals how each layer adds value — culminating in structured JSON output that's consistent and machine-readable.

**Slides 9–11 (Concept — Theme 4):** Human-in-the-loop is designed into the agent, not added after. Five accountability features (citation, confidence, reasoning, exception flagging, verification prompts) are written into the system prompt. The flipcards show the difference in practice.

**Slide 12 (Concept — Theme 5):** The agent's full value is unlocked when it's shared. An Agent Card, standardised input template, and cold test are the three requirements for team deployment.

**Slide 13 (Contrast):** The branching scenario lets the learner choose their approach and see the consequences — revealing that the full Level 2 approach (three layers + accountability + sharing) delivers compounding returns.

**Slide 14 (Bridge):** Four copyable templates give the learner concrete artefacts. The module hands off to the Agent Builder tool for practice.

---

*End of PRD-09.*
