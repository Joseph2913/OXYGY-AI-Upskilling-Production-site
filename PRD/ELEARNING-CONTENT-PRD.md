# CONTENT PRD: Oxygy E-Learning Module Authoring Guide
### Version 1.0 — Learning Design & Authoring Standards for New Modules

> This document defines what goes inside the slides — the learning design principles, narrative structure, content authoring rules, and quality standards for any new e-learning module. Read this alongside STRUCTURE-PRD.md before authoring content for any new topic.

---

## 1. Five-Beat Narrative Arc

Every module follows this mandatory story structure. The beats create narrative momentum — the learner is pulled forward, not lectured at. Each beat maps to a specific set of slide types.

### Beat 1 — SITUATION (Evidence-Led Opening)
**Purpose:** Establish why this topic matters using objective, verifiable evidence.

**Tone:** Opportunity and insight, not failure and frustration. The learner should feel *"I didn't know that — tell me more"*, not *"I've been doing this wrong."*

**Acceptable openings:**
- Industry statistics that reveal a gap between adoption and skill (e.g. usage rates vs. training rates)
- Research findings that quantify the impact of the skill being taught
- Observable demonstrations showing two approaches to the same task with visibly different results — framed as curiosity, not judgment

**Unacceptable openings:**
- Any framing that assumes the learner has had a negative experience
- Dramatic or exaggerated frustration scenarios
- Language that implies the learner has been doing something wrong
- Vague opener: *"AI is changing everything"*

**Slide types:** `evidenceHero`, `chart`, `pyramid`, `tensionStatement`

---

### Beat 2 — TENSION (The Knowledge Gap)
**Purpose:** Name what's missing — not what's broken.

**Tone:** The tension is a knowledge gap, not a performance failure. Most people haven't been shown this yet — they haven't been doing it wrong.

**Language to use:** *"Here's what most people haven't been shown…"*  
**Language to avoid:** *"Here's what's broken"*, *"Here's what you've been doing wrong"*

**Slide types:** `tensionStatement`, `gapDiagram`, `concept`

---

### Beat 3 — CONCEPT (The Framework)
**Purpose:** Introduce the core framework or technique.

**Critical rule:** The same beat must also introduce alternative approaches and the situational judgment for when to use each. The learner should understand *when* to use this technique, not just *how*.

**Never imply** the framework being taught is the only valid approach. Present it as one effective tool in a broader toolkit.

**Slide types:** `contextBar`, `rctf`, `toolkitOverview`, `approachIntro`, `concept`

---

### Beat 4 — CONTRAST (Technique in Action)
**Purpose:** Show the technique applied versus not applied.

**Critical rules:**
- Frame the "before" state as *"without this technique"* — never *"the wrong way"*
- Both before and after states must represent genuine attempts — the difference is technique, not effort
- Never strawman the before state with a deliberately weak example
- The same task is used in both states

**Slide types:** `scenarioComparison`, `flipcard`, `parallelDemo`, `gapDiagram`

---

### Beat 5 — BRIDGE (From Theory to Practice)
**Purpose:** Connect the module's concepts to the learner's real work.

Provide templates, decision aids, or exercises that help the learner apply what they've just learned. This beat transitions into the Read and Watch phases.

**Slide types:** `situationalJudgment`, `situationMatrix`, `templates`, `branching`, `spectrum`, `bridge`, `moduleSummary`

---

## 2. Core Content Principles

### Principle 1: Relevance Is Earned Through Evidence, Not Assumed Through Scenario
The opening of every module establishes *why this topic matters* using objective, verifiable evidence. A compelling statistic about the learner's profession is as engaging as a personal scenario — and more defensible, because data is non-judgmental.

### Principle 2: Gaps Are Opportunities, Not Failures
Frame knowledge gaps as something most people haven't been shown yet — not something they've been getting wrong. The learner chose to take this module. Respect that choice.

### Principle 3: Every Slide Earns Its Place
No filler slides. Every slide must teach, test, or transition. If a slide doesn't change what the learner knows, believes, or can do — it doesn't belong.

### Principle 4: Show, Don't Lecture
Wherever possible, demonstrate the concept through interactive elements, side-by-side comparisons, or worked examples. The learner should *see* the difference a technique makes, not just read about it.

### Principle 5: Frameworks Are Tools, Not Rules
When teaching a framework, present it as one effective tool in a broader toolkit. Before/after comparisons show genuine attempts on both sides — the difference is in technique, not effort. Prefer *"effective technique"* or *"recommended approach for [specific situation]"* over *"best practice."*

---

## 3. Tool-Agnostic Framing

**All content must be tool-agnostic.** Never reference specific AI tools (ChatGPT, Claude, Copilot, Gemini) in scenario setups, prompt demonstrations, or teaching content.

**Instead use:** "your AI tool", "the AI", "any large language model"

**Rationale:** Learners use different tools depending on their organisation's approved software. The skills taught (prompting, context engineering, workflow design) are transferable across all tools.

**Exceptions:**
- Tool-specific features can be referenced in Beat 5 (Bridge) when pointing to specific practice activities
- Tool-specific capabilities (e.g. "Projects" in Claude) can be referenced in Levels 2+ where the learning objective is specifically about that tool's feature set
- Internal Oxygy platform tools (Prompt Playground, etc.) are not subject to this rule

---

## 4. Audience Universality Rule

Every scenario, example, prompt demonstration, and exercise must resonate across roles, functions, seniority levels, and organisational contexts. This is mandatory, not aspirational.

### What "Universal" Means
Scenarios must describe tasks that every knowledge worker performs:
- Preparing for a meeting
- Summarising information
- Drafting a communication
- Structuring a recommendation
- Creating a first draft of a document
- Reviewing and improving existing content
- Synthesising inputs from multiple sources

### What to Avoid
- Anchoring a scenario to a specific function (e.g. *"as a consultant preparing a client debrief"*)
- Naming specific job titles in scenario setups
- Using tasks that only one department would recognise
- Industry-specific examples unless they appear in a context any professional in that industry would recognise

### Test Before Finalising
Before using any scenario, ask: *"Could this task be faced by at least 3 completely different job functions?"* If not, rewrite it.

---

## 5. Writing Evidence (Beat 1 Slides)

### The Standard
One dominant statistic per slide. The stat earns its place by being surprising, counterintuitive, or quantifiably significant.

### Source Requirements
Evidence must come from named, reputable sources:
- Consulting research: McKinsey, Deloitte, BCG, Accenture
- Academic: MIT Sloan, Stanford, Harvard Business Review
- Platform data: Microsoft/LinkedIn Workplace Reports, GitHub, Salesforce
- Peer-reviewed research with methodology

Unacceptable: undated reports, unnamed surveys, ranges without a specific number, blog posts without primary source.

### Stat Formatting Rules
- Use one specific number, not a range (*"62%"* not *"60–65%"*)
- The stat value should be surprising enough to stop the learner
- The label below the stat should be a concise descriptor, not a repeat of the eyebrow
- The pull-quote below must state the *implication* of the stat, not just restate it

### Source Badge
For known sources, always include the source logo image at `/public/logos/`. Height: 24px, max-width: 120px, `objectFit: contain`.

### Pull-Quote Rule
The pull-quote below a stat slide must answer the implicit question: *"So what does this mean for me?"* It should contain the key implication, not a rewording of the stat.

---

## 6. Writing Scenarios (Beat 4 Contrast Slides)

### The Setup
Both sides of the comparison use the same task. The difference is technique, not effort. The "before" state is a genuine first attempt by a reasonable professional — not a deliberately bad example.

### Writing the "Before" State
The before prompt must be a plausible first attempt — the kind of thing a capable professional would write before being shown this technique. It should not be:
- Obviously lazy or negligent
- Missing information no one would include
- Mocking or condescending in how it's framed

### Writing the "After" State
The after prompt must be built using the framework just taught. The learner should be able to look at it and trace which components were added and where.

### The Scenario Task
Must be universally recognisable: a meeting, a document, a communication, a decision, a summary. Not a specialist task.

### Diff Highlighting
When showing the "after" version, highlight the additions using RCTF component colors on the relevant phrases. This makes the technique visible rather than abstract.

---

## 7. Writing the `courseIntro` Slide

### Hook Headline
Two lines:
- Line 1: navy, bold — states the core skill or topic
- Line 2: teal (or teal-underlined key word) — states the transformation or outcome

The headline should create a gap the learner wants to close. Avoid generic openers like *"Welcome to Level 1"*.

### Objectives List (3–4 Items)
Each objective must:
- Start with an action verb
- Describe an outcome the learner will have — not a topic that will be covered
- Map to one of the five narrative beats

| Wrong (topic coverage) | Right (learner outcome) |
|------------------------|------------------------|
| "Introduction to the Prompt Blueprint" | "A repeatable system for structuring any prompt from scratch" |
| "Understanding context engineering" | "The ability to diagnose why an AI output missed the mark — and fix it in one edit" |
| "Approach comparison" | "A decision framework for choosing the right prompting style for any task" |

### Framework Preview Grid (right column)
Previews the core framework being taught. Each cell in the 2×3 or 3×2 grid represents one component. Use the framework component colors defined in STRUCTURE-PRD §15.

---

## 8. Writing `contextBar` Cards

Each of the 6 (or N) framework component cards must contain:

1. **KEY** — the component name in uppercase (e.g. `ROLE`, `CONTEXT`, `TASK`)
2. **Description** — 1–2 sentences explaining what this component is
3. **Example** — a short, concrete example of this component in practice (italic)
4. **Impact badge** — `"Without this → [specific consequence]"` — what changes in the AI's behaviour or output when this component is missing

### Impact Badge Writing
The impact must describe a real, observable consequence — not a vague statement like *"the response won't be as good."*

Good: `"Without this → the AI defaults to a generic tone that doesn't match your document's audience"`  
Bad: `"Without this → the output quality drops"`

---

## 9. Writing `persona` (Predict-First) Slides

### Purpose
Predict-first slides test the learner's intuition before showing the answer. The mechanic forces active engagement — not passive reading.

### Persona Design Rules
- Each persona represents a distinct technique on a spectrum (least to most structured)
- Personas should feel distinct but not stereotyped
- Face icon images are required — stored at `/public/face-icons/`
- Role and name should feel realistic, not cartoonish
- The persona's task must be universally recognisable (not role-specific)

### Predict Options Must Be Genuinely Ambiguous
All three options must be plausible to a learner without prior knowledge. The learner should not be able to eliminate any option without having engaged with the module's content. If one option is obviously wrong, rewrite it.

### The Outcome Reveal
The reveal must show:
1. The actual prompt the persona used (full text, annotated with RCTF color underlines where applicable)
2. A summary of the AI output they received
3. A clear link between technique choice and output quality — not just *"this worked better"* but *"this worked better because X"*

---

## 10. Writing `situationalJudgment` Scenarios

### Purpose
Situational judgment tests judgment, not recall. The learner must weigh trade-offs in a realistic situation — not remember a rule.

### Scenario Writing Rules
- One situation, described concisely (3–4 sentences maximum)
- Universal professional task — recognisable across functions
- No correct answer is obvious without the framework
- The scenario must introduce real constraints (e.g. time, audience, stakes, format)

### The Three Options
Every scenario has exactly three options:

| Quality | Label | Characteristics |
|---------|-------|----------------|
| Strongest | `"STRONGEST CHOICE"` | Uses the framework correctly for this specific situation |
| Partial | `"COULD WORK"` | Applies part of the technique but misses an important nuance |
| Weakest | `"NOT THE BEST FIT"` | Misses the point of the technique or applies the wrong approach |

### Feedback Writing
Feedback for each option must explain *why* that choice is strongest/partial/weak **in this specific situation** — not just label it.

Good feedback (weakest option): *"Jumping straight into the task skips the context the AI needs to match your document's register. The output will likely feel generic for this audience."*

Bad feedback: *"This isn't the best approach because it doesn't use the Blueprint."*

### Scale Requirements
- 3–4 scenarios per slide (navigated via persona pill tabs)
- Enough to feel like a real judgment exercise; not so many it becomes exhausting

---

## 11. Writing the `moduleSummary` Slide

The final slide before the Reflection screen should consolidate the two most important things the learner is leaving with:

1. **The framework** (what to include) — shown as a grid, one cell per component
2. **The approaches** (how to choose) — shown as comparison cards with *"Use when:"* conditions

### Component Descriptions (Summary Version)
Each component description in the summary grid must be shorter than the `contextBar` version — a single memorable phrase, not a full explanation. The learner has already seen the detail; this is a reference they'll return to.

### "Use when:" Conditions
Each approach card's *"Use when:"* condition must be specific enough to be actionable. Not *"when you have time"* but *"when the output will be shared externally and tone consistency matters."*

---

## 12. Writing Reflection Questions

Reflection questions appear on the final screen before *"Continue to Practice →"*. Two questions per module, written fresh for each topic.

### Rules
- Both questions are open-ended — no right answer
- Question 1 should prompt application to immediate real work
- Question 2 should prompt further exploration or curiosity
- Neither question should feel like an assessment
- Never repeat the same questions across modules

### Examples — Question 1 (Application)
- *"What's one thing from this module you'll try in your next piece of work?"*
- *"In your next prompt, which component do you think you most often leave out — and why?"*
- *"Think of a piece of work you recently sent to an AI tool. Which element of the Blueprint was missing from your prompt?"*

### Examples — Question 2 (Exploration)
- *"Is there anything from this module you'd like to explore further?"*
- *"Where in your work do you think structured prompting would have the biggest impact?"*
- *"What's one situation where you'd expect the 'Brain Dump' approach to outperform the Blueprint — and why?"*

---

## 13. Writing the Practice Component Brief

The practice task must:
- Be tool-agnostic (describes a task, not a specific AI interaction)
- Naturally require all framework components taught in the module — not just some
- Be completable in under 5 minutes
- Use a universally recognisable professional scenario

### Example Prompt Pills
3–4 pills giving starting points — not complete answers. A pill should give the learner enough to begin writing without doing the work for them.

Good pill: *"Draft a meeting agenda for…"*  
Bad pill: *"Write a Role: Senior Manager who needs to…"* (too leading)

### Scoring Rubric (per component)
For each framework component, the practice submission is scored as one of:

| Level | Criteria |
|-------|---------|
| **Strong** | Component is clearly present, specific, and appropriate for the task |
| **Partial** | Component is present but vague, generic, or incomplete |
| **Missing** | Component is absent |

The rubric must be written for this specific module's framework — not a generic rubric applied to all modules.

---

## 14. Tone & Voice Standards

### Register
- Second person ("you"), present tense
- Confident but not prescriptive
- Never preachy — make the point once, clearly, then move on

### Language Rules
| Avoid | Use instead |
|-------|------------|
| "Best practice" | "Effective technique" / "Recommended approach for [situation]" |
| "You've been doing this wrong" | "Here's what most people haven't been shown" |
| "Always do X" | "For [specific situation], X tends to work best" |
| "AI" with a capital and indefinite article | "the AI" / "your AI tool" |
| Named AI tools | "your AI tool" / "any large language model" |
| Specific job titles | "you" + description of task |

### Eyebrow Labels
- ALL CAPS, 1–3 words
- Descriptive of what follows, not decorative
- Examples: `"THE REALITY"`, `"THE TECHNIQUE"`, `"IN PRACTICE"`, `"THE SETUP"`, `"WHAT CHANGES"`

### Teal Underline Word
Each heading has one key word underlined in teal — the word that carries the most meaning. Not the verb. Not a filler word. The concept word.

Good: *"Prompts that __generate__ results"* → underline `generate`  
Bad: *"Why context __matters__ for AI"* → underline `context` not `matters`

---

## 15. What Must Never Appear in E-Learning Content

| Banned content | Reason |
|---------------|--------|
| Walls of text (3+ body paragraphs without a visual or interactive break) | Kills engagement |
| Unattributed statistics or claims | Credibility |
| Named AI tools in scenario setups | Tool-agnostic rule (see §3) |
| Function-specific job titles in scenarios | Audience universality rule (see §4) |
| "One right answer" framing positioning a single technique as always correct | Contradicts Principle 5 |
| Colored heading text | Design standard — teal underline only |
| Center-aligned body text | Brand standard — left-align always |
| Strawmanned "before" states in contrasts | Pedagogical integrity |
| Mocking or shame-adjacent language | Learner respect |
| Purple gradients, glassmorphism, floating shapes | Visual standard |
| Inter, Roboto, or Arial fonts | Brand standard |

---

## 16. Section Name Convention

Section names group slides in the Top Bar and Takeaway Header. They should describe the phase of the learning journey, not the topic.

### Examples of Good Section Names
- `"THE REALITY"` — opening evidence beats
- `"THE GAP"` — tension beats
- `"THE TECHNIQUE"` — concept introduction
- `"SEE THE DIFFERENCE"` — contrast beats
- `"IN PRACTICE"` — judgment and application
- `"THE TOOLKIT"` — framework overview
- `"WRAP UP"` — summary

### Rules
- Always uppercase
- 2–4 words maximum
- Describes the narrative phase, not the slide content
- Stays consistent across all slides within that phase

---

## 17. Slide Sequencing Guide

A typical module structure follows this pattern. Adapt to the topic — the arc is mandatory, the exact slide count is flexible.

| Position | Slide Type(s) | Section Name | Beat |
|----------|--------------|-------------|------|
| 1 | `courseIntro` | — | Setup |
| 2–3 | `evidenceHero`, `chart` or `pyramid` | `"THE REALITY"` | Beat 1 |
| 4 | `tensionStatement` or `gapDiagram` | `"THE GAP"` | Beat 2 |
| 5–6 | `concept`, `contextBar`, or `rctf` | `"THE TECHNIQUE"` | Beat 3 |
| 7–8 | `scenarioComparison`, `parallelDemo`, or `flipcard` | `"SEE THE DIFFERENCE"` | Beat 4 |
| 9–10 | `persona` (×2–3) | `"THE APPROACHES"` | Beat 3/4 |
| 11 | `situationMatrix` or `approachMatrix` | `"THE TOOLKIT"` | Beat 5 |
| 12–13 | `situationalJudgment` | `"IN PRACTICE"` | Beat 5 |
| 14 | `moduleSummary` or `bridge` | `"WRAP UP"` | Bridge |

**Total slides:** 10–16 per module is typical. Never fewer than 8 (arc cannot be completed), rarely more than 18 (engagement drops).

---

## 18. Content Quality Checklist

Before any module is submitted for build, every item on this checklist must be confirmed.

### Evidence
- [ ] Every stat has a named, reputable source
- [ ] No stat uses a range — a specific number is cited
- [ ] The pull-quote states the implication of the stat, not a restatement of it
- [ ] Source logos are available at `/public/logos/` for named sources

### Scenarios
- [ ] Every scenario is recognisable to at least 3 completely different job functions
- [ ] No job titles appear in scenario setups
- [ ] No named AI tools appear in scenarios or prompt demonstrations
- [ ] The "before" state in every contrast is a genuine attempt, not a strawman

### Framework
- [ ] Every framework component has: definition + example + impact of omission
- [ ] The module presents situational judgment for when to use the framework vs alternatives
- [ ] No slide implies the framework is always the correct approach

### Interactive Slides
- [ ] Situational judgment options are genuinely ambiguous without the framework
- [ ] Predict-first options are all plausible before the outcome is revealed
- [ ] Feedback for every option explains *why*, not just *what*

### Tone & Language
- [ ] No language implies blame, shame, or inadequacy
- [ ] No "best practice" language — all framing is situational
- [ ] All heading key words use teal underline — no colored text

### Practice
- [ ] Practice task naturally requires all framework components taught
- [ ] Scoring rubric is written specifically for this module's framework
- [ ] Example prompt pills give starting points, not complete answers

### Reflection
- [ ] Both reflection questions are fresh (not reused from another module)
- [ ] Question 1 prompts application to immediate real work
- [ ] Question 2 prompts exploration or curiosity

---

*Companion document: STRUCTURE-PRD.md*
