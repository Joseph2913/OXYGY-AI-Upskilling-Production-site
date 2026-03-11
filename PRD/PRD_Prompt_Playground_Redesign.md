# PRD: Prompt Playground — Redesign
**Version:** 2.0  
**Status:** Ready for Development  
**Replaces:** PRD_Prompt_Engineering_Playground v1.0  
**Last Updated:** March 2026

---

## 1. Overview

### 1.1 Purpose

The Prompt Playground is an interactive, AI-powered tool embedded in the Level 1 section of the Oxygy AI Upskilling platform. It teaches prompt engineering by demonstration — users describe a real task in plain language, receive a single optimised prompt, and see the prompting strategies that were combined to build it.

This redesign replaces the previous two-mode mechanic (Enhance / Build from Scratch) and the mandatory 6-part blueprint output. The new version is built on a single, open input and a strategy-aware output engine that shows users that great prompting is a craft with multiple techniques — not a fixed formula.

### 1.2 Position in Site

- Accessed from the Level 1 section via the **"Try the Prompt Playground"** CTA
- Lives at `/playground` or equivalent route
- A `← Back to Level 1` breadcrumb sits top-left for return navigation
- Referenced from the Agent Builder (Level 2) with a note: *"Prompts built here power the agents you'll build in Level 2"*

### 1.3 Target Audiences

| Audience | Goal | What They Take Away |
|---|---|---|
| **Internal learners** | Use it as a real, daily work tool | A better prompt for their actual task + unconscious absorption of prompting principles |
| **External showcase viewers** | Evaluate Oxygy's pedagogical depth | Firsthand experience of the platform's intelligence; leaves them asking "what does Level 5 look like?" |

### 1.4 Key Shifts from v1.0

| v1.0 | v2.0 |
|---|---|
| Two mode cards (Enhance / Build from Scratch) | Single open textarea — no mode selection |
| 6-part Blueprint as mandatory output format | Strategy-aware output: combined prompt + strategy attribution |
| Output always structured into 6 sections | Output format adapts to the task type |
| Educational layer implicit (learn by observing structure) | Educational layer explicit (named strategies, practitioner rationale) |
| One right answer framing | "No single perfect prompt" practitioner framing |

---

## 2. The Eight Prompting Strategies

These are the canonical strategies the AI selects from. Each is defined here in full — for use in the system prompt, the strategy cards in the UI, and as the platform's reference documentation for learners.

---

### Strategy 1: Structured Blueprint
**Icon:** 🏗️  
**Colour tag:** Soft Lavender `#C3D0F5`

**Definition:**  
Breaks a prompt into named, explicit sections — typically Role, Context, Task, Format, Steps, and Quality Checks. Each section anchors a specific dimension of the AI's response, preventing the model from making unguided decisions about what to include, how to structure output, or what perspective to adopt.

**When to use:**  
Complex, multi-part deliverables where the output needs to be reliable and repeatable. Reports, structured documents, strategic analyses, workshop designs. Any task where a vague ask would produce a vague answer.

**When NOT to use:**  
Short, conversational tasks. Simple rewrites. Anything where the overhead of a 6-part structure outweighs the output complexity. Applying this to a simple email draft is like using a spreadsheet to add two numbers.

**What it teaches the learner:**  
Not every prompt needs a blueprint. Knowing when to deploy structure is the skill — not applying it universally.

---

### Strategy 2: Chain-of-Thought
**Icon:** 🧠  
**Colour tag:** Pale Yellow `#FBE8A6`

**Definition:**  
Instructs the AI to reason step-by-step before delivering a conclusion. Rather than jumping to an answer, the model works through the problem in sequence — analyse first, then synthesise, then recommend. This dramatically improves output quality on analytical, evaluative, or multi-variable tasks.

**When to use:**  
Evaluation tasks (comparing options, assessing trade-offs), diagnostic tasks (identifying root causes), planning tasks (sequencing decisions), any question where a confident wrong answer is worse than a slower right one.

**When NOT to use:**  
Simple factual retrieval. Creative tasks where structured reasoning interrupts generative flow. Tasks with a single clear output where step-by-step reasoning adds no value.

**What it teaches the learner:**  
The AI is not a search engine — it reasons. You can control how it reasons by telling it to show its work before it concludes.

---

### Strategy 3: Persona / Expert Role
**Icon:** 🎭  
**Colour tag:** Mint `#A8F0E0`

**Definition:**  
Assigns the AI a specific expert identity before the task. Not a generic instruction ("act as an expert") but a precise framing ("You are a senior L&D facilitator who specialises in executive education for sceptical audiences"). The persona anchors vocabulary, tone, assumed knowledge, and perspective for the entire response.

**When to use:**  
Almost every professional task benefits from a persona. Communication tasks (what voice?), advisory tasks (what expertise?), creative tasks (what perspective?). If you were delegating this task to a real person, you'd describe who you're delegating to — do the same with AI.

**When NOT to use:**  
Purely mechanical tasks where identity is irrelevant — e.g., "Convert this list into a table." The persona would add noise, not signal.

**What it teaches the learner:**  
Who is speaking matters as much as what is said. The single highest-leverage addition to most prompts is a well-defined role — because it shapes every word that follows.

---

### Strategy 4: Output Format Specification
**Icon:** 📐  
**Colour tag:** Teal `#38B2AC` (white text)

**Definition:**  
Explicitly defines how the output should be structured: length, layout (bullets, prose, table, numbered list), section headers, tone register, and any constraints on presentation. Prevents the AI from deciding format by default — which it will always do, and often poorly for the specific context.

**When to use:**  
Any task where the output will be shared, presented, or directly used. Stakeholder communications, reports, documentation, templates. If you know what "good" looks like structurally, specify it.

**When NOT to use:**  
Exploratory tasks where you want the AI to surprise you with structure. Brainstorming. Early-stage ideation where rigid format would constrain creative range.

**What it teaches the learner:**  
Format is not cosmetic — it determines usability. The same information as a bulleted list versus a narrative paragraph serves completely different purposes in completely different contexts.

---

### Strategy 5: Constraint Framing
**Icon:** 🚧  
**Colour tag:** Soft Peach `#FBCEB1`

**Definition:**  
Scopes the prompt by defining what the AI should NOT do — topics to avoid, assumptions it shouldn't make, length it shouldn't exceed, risks it shouldn't introduce. Constraints focus the model's range of possible outputs and prevent scope creep, off-brand language, or hallucinated details.

**When to use:**  
Any high-stakes communication where errors matter. Client-facing documents. Tasks with known risk areas (confidentiality, legal accuracy, brand tone). Situations where a wide but wrong answer is worse than a narrow but right one.

**When NOT to use:**  
Unconstrained creative brainstorming. Research tasks where you want the AI to range widely. Exploratory tasks where breadth is the goal.

**What it teaches the learner:**  
The AI will fill any silence with assumptions. Constraints are not limitations on the AI's creativity — they are specifications of your actual requirements. A prompt without constraints is a brief without a scope.

---

### Strategy 6: Few-Shot Examples
**Icon:** 📖  
**Colour tag:** Ice Blue `#E6FFFA`

**Definition:**  
Includes one or more concrete examples of desired output directly inside the prompt. Rather than describing what you want, you show it. The AI pattern-matches from your examples and produces output that follows the same structure, tone, length, and style.

**When to use:**  
Repeatable tasks where consistency matters — template creation, standardised reports, agenda formats, email signatures. Highly stylised writing where tone is difficult to describe but easy to demonstrate. Any task where "like this, but for X" is the most natural instruction.

**When NOT to use:**  
Tasks where the example might anchor the AI too narrowly. Novel tasks with no clear prior. Situations where you want genuine creative range rather than a pattern replicated.

**What it teaches the learner:**  
Showing beats telling. One well-chosen example does more work than three paragraphs of description. This is why building a personal prompt library (Level 1, Topic 6) is a legitimate productivity strategy — your best outputs become inputs.

---

### Strategy 7: Iterative Decomposition
**Icon:** 🔗  
**Colour tag:** Soft Lavender `#C3D0F5` (secondary, used when Blueprint is not also present)

**Definition:**  
Breaks a complex task into explicit sub-tasks that the AI handles sequentially. Rather than asking for one large output, the prompt defines a series of discrete steps — each building on the previous — that together produce a coherent whole. This prevents the AI from collapsing nuance in the name of brevity.

**When to use:**  
Large, multi-component deliverables. Strategic plans, research summaries with recommendations, multi-section documents. Tasks where intermediate outputs matter as much as the final one. Workshop designs with distinct phases.

**When NOT to use:**  
Simple, single-output tasks. Anything where the decomposition overhead is greater than the task complexity. Short communications.

**What it teaches the learner:**  
Complex tasks given to AI in one shot produce compressed, generic outputs. Breaking the task into explicit sub-tasks forces the AI to do real work at each stage — and gives you checkpoints to course-correct before the final output.

---

### Strategy 8: Tone & Voice Setting
**Icon:** 🎙️  
**Colour tag:** Pale Yellow `#FBE8A6` (secondary, used when Chain-of-Thought is not also present)

**Definition:**  
Specifies the register, emotional temperature, and relational dynamic of the output — beyond simple instructions like "professional" or "friendly." Effective tone-setting goes deeper: "peer-to-peer, not evangelical," "confident but not dismissive," "warm but not informal." These precise framings do more tonal work than any structural rule.

**When to use:**  
Any communication task where the relationship with the reader is as important as the information itself. Change communications. Executive messaging. Client-facing documents. Culture-sensitive content. Any context where getting the tone wrong would undermine the message entirely.

**When NOT to use:**  
Internal technical documentation where tone is irrelevant. Mechanical tasks with no audience consideration. Structured data generation.

**What it teaches the learner:**  
Most people think of tone as a finishing touch — a final pass over the output. In prompting, tone instruction shapes the AI's entire approach from the first word. Setting it at the start is not stylistic preference; it is a structural decision.

---

## 3. Strategy Combination Logic

The following matrix defines how strategies combine — which pairings are natural, which are redundant, and which combinations produce specific output types. This is the decision logic the AI system prompt uses internally, and it is also the framework that should be documented in the platform's learning resources.

### 3.1 Combination Principles

**Rule 1 — Minimum one, maximum four.**  
Every output uses at least one strategy. Four is the ceiling — beyond that, the prompt becomes overcrowded and the pedagogical signal is diluted.

**Rule 2 — Persona almost always appears.**  
The only exception is purely mechanical tasks (format conversion, data restructuring) where identity is genuinely irrelevant.

**Rule 3 — Blueprint and Chain-of-Thought are rarely combined.**  
Blueprint provides explicit structural scaffolding. Chain-of-Thought provides reasoning scaffolding. Using both simultaneously is usually redundant — choose the one that matches whether the task is primarily about *structure* (Blueprint) or *reasoning* (Chain-of-Thought).

**Rule 4 — Constraint Framing is additive, not standalone.**  
It always appears alongside at least one other strategy. It modifies and focuses the output of other strategies — it doesn't drive the output alone.

**Rule 5 — Few-Shot Examples and Output Format Specification are complementary but not equivalent.**  
Format Spec says *how* to structure the output. Few-Shot Examples *show* what a good output looks like. Combined, they produce highly predictable, consistent outputs — valuable for templates and repeatable deliverables.

---

### 3.2 Task Type → Strategy Combination Map

| Task Type | Primary Strategies | Secondary Strategies | Typical Count | Rationale |
|---|---|---|---|---|
| **Simple communication** (email, update, message) | Persona, Output Format | Constraint Framing | 2–3 | Short outputs don't need reasoning scaffolding. Format and voice are the levers. |
| **Analytical / evaluative** (comparison, recommendation, assessment) | Chain-of-Thought, Constraint Framing | Persona, Output Format | 3–4 | Reasoning quality is the bottleneck. Constraints prevent scope overreach. |
| **Complex structured deliverable** (report, plan, strategy document) | Structured Blueprint, Persona | Output Format, Iterative Decomposition | 3–4 | Structure and role anchor the output. Decomposition handles multi-section complexity. |
| **Workshop / facilitation design** | Persona, Chain-of-Thought | Tone & Voice, Few-Shot Examples | 3–4 | Facilitator expertise shapes everything. Reasoning ensures logical arc. Tone is critical for audience-sensitive design. |
| **Template / repeatable format creation** | Few-Shot Examples, Output Format | Persona, Constraint Framing | 2–3 | Pattern-matching is the dominant mechanism. Format locks the structure. |
| **Stakeholder / executive communication** | Persona, Tone & Voice | Output Format, Constraint Framing | 3–4 | Relationship dynamics determine whether the message lands. Constraints prevent off-brand or off-tone content. |
| **Creative ideation / brainstorming** | Persona | Iterative Decomposition | 1–2 | Over-constraining creative tasks narrows the range. Minimal scaffolding, strong persona. |
| **Research synthesis** | Chain-of-Thought, Iterative Decomposition | Constraint Framing, Output Format | 3–4 | Sequential reasoning prevents premature synthesis. Decomposition handles multi-source complexity. |

---

### 3.3 Worked Combination Examples

These three worked examples should be hardcoded as the pre-loaded example prompts visible in the UI before a user has submitted their first input.

---

#### Example A — Simple Communication Task

**User input:** *"Write an update email about project progress to share with leadership"*

**Strategies selected:** Persona (🎭) + Output Format Specification (📐) — *2 strategies*

**Generated prompt:**
```
You are a senior project manager writing a concise progress update for a 
leadership audience who are time-poor and expect clarity over comprehensiveness.

Write a professional email that includes:
- A 2-sentence summary of overall project status
- The top 2–3 milestones completed this week
- Any active risks or blockers, each with a proposed mitigation step
- What decisions or support you need from leadership in the next two weeks

Keep the email under 250 words. Use clear, scannable section headers. 
Avoid jargon. Do not use passive voice.
```

**Strategy rationale (for the UI cards):**
- *Persona:* "A leadership audience expects authority and brevity — assigning a senior PM role shapes the voice before a word is written."
- *Output Format:* "Without format specification, a status email becomes a wall of prose. Defining the structure makes it scannable for a time-poor audience."

---

#### Example B — Analytical / Reasoning Task

**User input:** *"Help me evaluate which AI tool to recommend to my team for research and summarisation"*

**Strategies selected:** Chain-of-Thought (🧠) + Constraint Framing (🚧) + Persona (🎭) — *3 strategies*

**Generated prompt:**
```
You are an AI tools specialist with experience advising professional services 
teams on practical technology adoption.

Before giving a recommendation, work through the following steps:
1. Identify the 3–4 most relevant AI tools for research and summarisation 
   in a professional context
2. For each tool, assess: quality of summaries, ease of use for 
   non-technical staff, data privacy posture, and integration with 
   standard document workflows
3. Compare the tools against each other — note where genuine trade-offs exist
4. Provide a clear, justified recommendation with a brief rationale

Constraints: Do not recommend tools that require coding or API configuration 
to operate. Assume the team has no existing AI subscriptions. Limit the 
recommendation to one primary tool with one alternative noted.
```

**Strategy rationale (for the UI cards):**
- *Chain-of-Thought:* "This is a comparative evaluation — jumping to a conclusion without reasoning through trade-offs produces a generic answer. Forcing step-by-step logic dramatically improves recommendation quality."
- *Constraint Framing:* "Without boundaries, AI recommends technically impressive tools that don't fit the actual context. Constraints align the output with the real team environment."
- *Persona:* "A tools specialist brings a practitioner's lens — not an enthusiast's — which produces measured, realistic recommendations."

---

#### Example C — Workshop / Facilitation Design

**User input:** *"Create a workshop agenda for a half-day session introducing AI to a senior leadership team who are sceptical"*

**Strategies selected:** Persona (🎭) + Chain-of-Thought (🧠) + Few-Shot Examples (📖) + Tone & Voice Setting (🎙️) — *4 strategies*

**Generated prompt:**
```
You are an experienced L&D facilitator who designs executive workshops on 
emerging technology for senior leadership teams.

Your audience is a group of C-suite and director-level leaders who are 
sceptical about AI — their concerns centre on job displacement, data 
security, and implementation cost. They are intelligent, evidence-driven 
professionals who respond to rigour, not enthusiasm.

Design a half-day workshop agenda (3.5 hours) by working through the 
following logic:
1. Map the arc of the session — what does scepticism look like at the 
   start and what does readiness look like at the end?
2. Identify the pivot points — moments in the agenda where the 
   audience's stance is most likely to shift
3. Design each session block around that arc

For each session block, provide the following structure:
- Time slot and duration
- Session title
- Objective (what participants will leave knowing or feeling)
- Format (presentation, facilitated discussion, hands-on demo, etc.)
- Facilitator notes (tone, approach, what to watch for)

Guidelines:
- Open with their scepticism directly — acknowledge concerns before 
  introducing possibility
- Include at least one moment where participants interact with an AI 
  tool themselves
- Close with one concrete, individual commitment per participant
- Tone throughout: peer-to-peer, not evangelical. Evidence over excitement.
```

**Strategy rationale (for the UI cards):**
- *Persona:* "Senior leaders respond to a peer voice — the facilitator identity frames the output as an experienced practitioner's design, not an AI's best guess at a workshop."
- *Chain-of-Thought:* "A workshop isn't a list — it's a journey with a logical arc. Forcing the AI to reason through the audience's journey before designing sessions produces a far more coherent agenda."
- *Few-Shot Examples:* "Defining the exact structure for each session block (time, title, objective, format, notes) shows the AI precisely what a good output looks like — eliminating the risk of a generic 'here are some ideas' response."
- *Tone & Voice Setting:* "'Peer-to-peer, not evangelical' does more work than any structural instruction when the audience is a sceptical leadership group. Tone setting is not a stylistic choice here — it determines whether the agenda design is fit for the room."

---

## 4. Input Section

### 4.1 Layout

The input section sits at the top of the page, below the page header. It occupies the full content width (`max-width: 800px`, centred). No columns — the input is singular and uncluttered.

### 4.2 Header Block

**Label (above textarea):**  
`"Describe what you're trying to do"`  
— Font: Semi-bold (600), 16px, `#1A202C`

**Subtext (below label):**  
`"Describe the task, share the context, or paste a rough draft — whatever you have. The more specific you are, the more precisely the prompt can be optimised for your situation."`  
— Font: Regular (400), 14px, `#718096`, max-width 600px

### 4.3 Textarea

- **Dimensions:** Full width of container, min-height `120px`, auto-expands with content up to `300px` before scrolling
- **Background:** `#FFFFFF`
- **Border:** `1px solid #E2E8F0`, `border-radius: 12px`
- **Focus state:** Border changes to `#38B2AC` (Oxygy Teal), no shadow
- **Padding:** `16px`
- **Font:** Regular (400), 15px, `#1A202C`, line-height 1.6
- **Placeholder text:** `"e.g., I need to write a project status update for my leadership team, or Help me design a workshop for a sceptical audience, or Summarise a long research report into three key recommendations..."`  
  — Placeholder font: Regular (400), 15px, `#A0AEC0`
- **Character count indicator:** Bottom-right of textarea, appears after user types. Format: `"142 characters"` — 12px, `#A0AEC0`. No maximum character limit, but indicator makes length visible.

### 4.4 Pre-loaded Example Chips

Displayed below the textarea label line, before the textarea itself. A horizontal scroll row of clickable chips:

**Label:** `"Try an example:"` — 13px, `#A0AEC0`, Regular

**Chips (6 examples):**
1. `Write a stakeholder update email`
2. `Design an AI introduction workshop for sceptics`
3. `Evaluate tools for my team`
4. `Create a 90-day onboarding plan`
5. `Summarise a research report into recommendations`
6. `Draft a business case for a new initiative`

**Chip styling:**
- Background: `#F7FAFC`
- Border: `1px solid #E2E8F0`
- Border-radius: `20px`
- Padding: `6px 14px`
- Font: 13px, Regular (400), `#4A5568`
- Hover: Background `#EDF2F7`, border `#CBD5E0`
- On click: Chip text populates the textarea with a brief highlight flash (`background: #E6FFFA` for `0.3s`, then back to white)

### 4.5 CTA Button

**Label:** `Build My Prompt →`  
**Style:** Solid teal `#38B2AC`, white text, pill shape (`border-radius: 24px`), padding `10px 28px`, font Semi-bold (600), 15px  
**Hover state:** Background `#2C9A94`  
**Disabled state:** Background `#A0AEC0`, cursor `not-allowed` — disabled while API call is in progress or for 5 seconds after each submission (client-side rate limit)  
**Position:** Below textarea, left-aligned  
**Loading state:** Button text changes to `"Building your prompt..."` with a subtle animated ellipsis. The teal background remains — no spinner icon needed.

---

## 5. Output Section

### 5.1 Visibility and Appearance

The output section is **hidden until the first successful API response**. It appears with a smooth `slide-down + fade-in` animation (`0.4s ease`) once the response is received and parsed. The page scrolls automatically to bring the output into view.

A thin `1px solid #E2E8F0` horizontal divider separates the input section from the output section. Above the divider: a subtle success indicator:

```
🎉  Your prompt is ready — view your results below ↓
```
Styled as a teal-bordered pill: `background: #E6FFFA`, `border: 1px solid #38B2AC`, `border-radius: 24px`, padding `10px 20px`, font 14px Semi-bold (600), `#1A202C`. Auto-dismisses after `5s` with a fade-out.

### 5.2 Two-Column Output Layout

The output section is a **two-column layout** with the prompt dominant on the left and the strategy panel supporting on the right.

```
┌─────────────────────────────────────────┬──────────────────────────┐
│                                         │                          │
│   LEFT COLUMN — 65% width               │  RIGHT COLUMN — 35%     │
│   The optimised prompt                  │  Strategy cards          │
│   (dominant, full height)               │  (collapsible, stacked)  │
│                                         │                          │
└─────────────────────────────────────────┴──────────────────────────┘
```

**Desktop (1200px+):** True two-column as above, `gap: 32px`  
**Tablet (768–1199px):** Two-column maintained, left column `60%`, right `40%`, `gap: 24px`  
**Mobile (<768px):** Stacked — left column (prompt) first, right column (strategy cards) below

### 5.3 Left Column — The Optimised Prompt

#### Header

**Label:** `"Your optimised prompt"` — 12px, Semi-bold (600), `#A0AEC0`, uppercase, letter-spacing `0.05em`

**Original input preview** (shown above the optimised prompt, in enhance context):  
- Label: `"Your original input"` — same style as above
- Displayed in a subtle block: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 8px`, padding `12px 16px`, font 14px Regular, `#718096`, max-height `80px`, overflow hidden with a `"show more ↓"` text toggle

**Arrow divider:**  
`"Optimised to ↓"` — centred, 13px, `#A0AEC0`, displayed between original input preview and optimised prompt

#### Prompt Display Block

- **Background:** `#FFFFFF`
- **Border:** `1px solid #E2E8F0`
- **Border-radius:** `12px`
- **Padding:** `24px`
- **Font:** Regular (400), 15px, `#2D3748`, line-height `1.75`
- The prompt is displayed as plain text — no colour-coded sections, no labelled blocks. The prompt is clean and copy-ready.
- Monospaced font is NOT used — this is a natural language prompt, not code

#### Action Bar (below prompt block)

A row of small action buttons, left-aligned, `gap: 12px`, `margin-top: 16px`:

1. **Copy Full Prompt** — Primary teal pill button, `14px`, Semi-bold, `"Copy Prompt"` label with a copy icon. On click: text copies to clipboard, button label changes to `"Copied ✓"` for `2s`, then resets.

2. **Try Another** — Secondary button (white, `1px solid #E2E8F0` border, pill), `14px` Regular, `"← Try another task"` label. On click: scrolls back to input textarea, clears output section with a fade-out, clears textarea content.

3. **Export as .txt** — Ghost button (no border, `#718096` text), `14px` Regular, download icon + `"Save as .txt"` label. On click: downloads the prompt as a plain `.txt` file named `prompt-[timestamp].txt`.

### 5.4 Right Column — Strategy Cards

#### Column Header

`"How this prompt was built"` — 13px, Semi-bold (600), `#A0AEC0`, uppercase, letter-spacing `0.05em`

A sub-label below it:  
`"2–4 prompting strategies were combined for this task. Click each to see why."` — 12px, Regular (400), `#A0AEC0`

#### Individual Strategy Cards

Each strategy used in the output is rendered as a **collapsible card**. Cards stack vertically with `gap: 10px` between them.

**Collapsed state (default):**

```
┌──────────────────────────────────┐
│  🎭  Persona / Expert Role    ↓  │
└──────────────────────────────────┘
```

- Background: `#F7FAFC`
- Border: `1px solid #E2E8F0`
- Border-radius: `10px`
- Padding: `12px 16px`
- Left accent strip: `4px` wide, colour matches the strategy's assigned colour tag (see Section 2)
- Icon: strategy emoji, `18px`
- Strategy name: Semi-bold (600), `14px`, `#1A202C`
- Chevron: `↓` icon, `#A0AEC0`, right-aligned. Rotates `180°` when expanded (`transition: 0.2s ease`)
- Hover: Border colour shifts to `#CBD5E0`, background to `#EDF2F7`

**Expanded state (on click):**

```
┌──────────────────────────────────┐
│  🎭  Persona / Expert Role    ↑  │
├──────────────────────────────────┤
│  WHY THIS WAS USED               │
│  A leadership audience expects   │
│  authority — assigning a senior  │
│  PM role shapes the voice before │
│  a word is written.              │
│                                  │
│  WHAT THIS STRATEGY DOES         │
│  Sets a specific expert identity │
│  that anchors the AI's register, │
│  vocabulary, and level of        │
│  authority throughout the        │
│  entire response.                │
└──────────────────────────────────┘
```

**Expanded state content:**

*Why this was used section:*
- Label: `"WHY THIS WAS USED"` — 10px, Semi-bold (600), `#A0AEC0`, uppercase, letter-spacing `0.08em`
- Body: 13px, Regular (400), `#4A5568`, line-height `1.6` — this is the task-specific practitioner rationale, generated dynamically by the AI for this specific input. It explains why this strategy was the right choice for the user's particular task.

*What this strategy does section:*
- Label: `"WHAT THIS STRATEGY DOES"` — same label style as above
- Body: 13px, Regular (400), `#718096`, line-height `1.6` — this is the general educational description of the strategy, consistent across all uses. It can be drawn from Section 2 of this document.

**Card grid layout by strategy count:**  
- **1–2 strategies:** Full-width stacked cards
- **3 strategies:** Full-width stacked cards
- **4 strategies:** `2×2` grid (two cards per row, `gap: 10px`) — on mobile, reverts to single column

#### Practitioner Caveat Banner

Displayed below the strategy cards, inside the right column. Always present — never dismissible.

**Style:**
- Background: `#F7FAFC`
- Border: `1px solid #E2E8F0`
- Border-radius: `10px`
- Padding: `14px 16px`
- Left accent strip: `4px`, `#A0AEC0`

**Content:**
```
There's no single perfect prompt.

This is an optimised starting point built for your context — not the only 
valid approach. Adapt it, iterate on it, and make it yours. The strategies 
above are the craft behind it; understanding them is more valuable than 
any individual prompt.
```

- Header line: Semi-bold (600), 13px, `#1A202C`
- Body: Regular (400), 12px, `#718096`, line-height `1.6`

---

## 6. The Pedagogy Layer

This section defines the learning design intent behind every interaction. It should be referenced by both the developer (to ensure nothing that serves the pedagogy is cut) and by any future content designer iterating on the tool.

### 6.1 Learning Design Principles

**Principle 1 — Learning happens in the output, not the input.**  
The single open textarea removes instructional scaffolding from the input stage. There are no questions guiding the user toward a better prompt — the user writes naturally, and the intelligence lives in what comes back. This prevents the tool from feeling like a questionnaire and makes it usable for real tasks rather than just educational exercises.

**Principle 2 — Strategies are named, not implied.**  
The previous version taught the 6-part Blueprint by showing it. Users could observe the structure but not name the principle. This version names every strategy explicitly — giving learners vocabulary they can carry forward. After three uses, a learner can say "I need chain-of-thought here" rather than "I need to add more detail."

**Principle 3 — Rationale is task-specific, not generic.**  
The "Why this was used" content in each strategy card is generated dynamically by the AI, tailored to the user's specific input. This is intentional — a generic description of Chain-of-Thought feels like documentation. A sentence that says "your task involves comparing multiple options, and jumping to a conclusion without reasoning through trade-offs produces a generic answer" feels like a colleague's observation. The latter is what produces learning.

**Principle 4 — The caveat is the most important sentence on the page.**  
"There's no single perfect prompt" is not a disclaimer — it is the core epistemic claim the tool is making. The previous version implicitly positioned the 6-part Blueprint as the answer. This version positions prompting as a craft with judgment calls. That shift is the difference between training users to follow a template and training them to think.

**Principle 5 — Repeated use compounds learning.**  
A user who runs 10 different tasks through the tool will notice:
- Chain-of-Thought appears for analytical tasks but not communication tasks
- Persona appears almost every time — reinforcing that "who is speaking" is almost always the highest-leverage variable
- Constraint Framing never appears alone — teaching that constraints are modifiers, not drivers
- Tone & Voice appears for communication tasks with sensitive audiences — signalling that register is structural, not cosmetic

These patterns are not explained anywhere in the interface. They emerge through repeated use — which is the right model for building intuition rather than rule-following.

### 6.2 What Learners Absorb at Each Stage

| Interaction Moment | What the Learner Absorbs |
|---|---|
| Typing a task in the open textarea | Prompting starts with articulating what you actually need — most people's prompts fail at this stage |
| Receiving the optimised prompt | The gap between what I asked and what a good prompt looks like — and that the gap is closeable |
| Opening strategy cards | That there are named techniques behind this, not magic — and I can learn them |
| Reading "Why this was used" | Why this technique was the right choice for this specific situation — begins building judgment |
| Noticing which strategies repeat across tasks | Pattern recognition: some techniques are almost universal (Persona), some are situational (Few-Shot), some are risky to overuse (Blueprint) |
| Reading the practitioner caveat | That their job is not to memorise a formula but to develop a craft — this is a starting point, not the answer |

### 6.3 Connection to Wider Curriculum

This tool is the experiential anchor for Level 1, Topic 2: Prompting Basics. It should be cross-referenced as follows:

- **Level 1, Topic 2** — Links to the Playground as the hands-on application of what the lesson covers
- **Level 1, Topic 6 (Prompt Library Creation)** — The "Save as .txt" export feature is the first act of building a personal prompt library; the connection should be made explicit in the Level 1 topic description
- **Level 2, Agent Builder** — References the Playground with a note: *"The system prompt inside every agent is just a well-engineered prompt. The strategies you learned in Level 1 are what makes an agent work."*

---

## 7. Visual Design Specification

### 7.1 Colour Palette

| Element | Hex | Usage |
|---|---|---|
| Primary text | `#1A202C` | Page title, section headers, card titles, labels |
| Secondary text | `#4A5568` | Body copy |
| Tertiary text | `#718096` | Helper text, card descriptions |
| Placeholder / meta text | `#A0AEC0` | Textarea placeholder, character count, column headers |
| Teal (primary CTA) | `#38B2AC` | CTA button, focus borders, success indicator, copy success |
| Teal hover | `#2C9A94` | CTA button hover state |
| Page background | `#FFFFFF` | Full page |
| Input background | `#FFFFFF` | Textarea |
| Card background | `#F7FAFC` | Strategy cards, caveat banner, example chips |
| Light hover | `#EDF2F7` | Chip hover, card hover |
| Border default | `#E2E8F0` | All card borders, dividers |
| Border hover | `#CBD5E0` | Card hover borders |
| Error background | `#FFF5F5` | API error message |
| Error border | `#FC8181` | API error message |
| Error text | `#C53030` | API error message |
| Success background | `#E6FFFA` | Success banner, textarea flash on example selection |
| Success border | `#38B2AC` | Success banner |

**Strategy colour tags (left accent strips on cards):**

| Strategy | Colour | Hex |
|---|---|---|
| Structured Blueprint | Soft Lavender | `#C3D0F5` |
| Chain-of-Thought | Pale Yellow | `#FBE8A6` |
| Persona / Expert Role | Mint | `#A8F0E0` |
| Output Format Specification | Teal | `#38B2AC` |
| Constraint Framing | Soft Peach | `#FBCEB1` |
| Few-Shot Examples | Ice Blue | `#E6FFFA` with `#38B2AC` border strip |
| Iterative Decomposition | Soft Lavender | `#C3D0F5` (same as Blueprint — only one will appear at a time per Rule 3) |
| Tone & Voice Setting | Pale Yellow | `#FBE8A6` (same as Chain-of-Thought — only one will appear at a time per Rule 3) |

### 7.2 Typography

| Element | Font | Weight | Size | Colour |
|---|---|---|---|---|
| Page title | DM Sans | 700 | 40–48px | `#1A202C` |
| Page subtitle | DM Sans | 400 | 16–18px | `#4A5568` |
| Input label | DM Sans | 600 | 16px | `#1A202C` |
| Input subtext | DM Sans | 400 | 14px | `#718096` |
| Textarea text | DM Sans | 400 | 15px | `#1A202C` |
| Textarea placeholder | DM Sans | 400 | 15px | `#A0AEC0` |
| Example chip | DM Sans | 400 | 13px | `#4A5568` |
| CTA button | DM Sans | 600 | 15px | `#FFFFFF` |
| Output label (uppercase) | DM Sans | 600 | 12px | `#A0AEC0` |
| Optimised prompt body | DM Sans | 400 | 15px | `#2D3748` |
| Strategy card name | DM Sans | 600 | 14px | `#1A202C` |
| Strategy card label (WHY / WHAT) | DM Sans | 600 | 10px | `#A0AEC0` |
| Strategy card body | DM Sans | 400 | 13px | `#4A5568` |
| Caveat header | DM Sans | 600 | 13px | `#1A202C` |
| Caveat body | DM Sans | 400 | 12px | `#718096` |

**Font:** DM Sans from Google Fonts. Fallbacks: Plus Jakarta Sans, Outfit. Never Inter, Roboto, or Arial.

### 7.3 Spacing

| Context | Value |
|---|---|
| Page horizontal padding | `48px` (desktop), `24px` (tablet), `16px` (mobile) |
| Section vertical padding | `64px` top and bottom |
| Input to CTA gap | `16px` |
| CTA to divider gap | `48px` |
| Output section top padding | `48px` |
| Left column to right column gap | `32px` (desktop), `24px` (tablet) |
| Strategy card gap | `10px` |
| Card internal padding | `12px 16px` (collapsed), `16px 20px` (expanded) |

---

## 8. Responsive Behaviour

### 8.1 Desktop (1200px+)

- Two-column output layout: left `65%`, right `35%`, `gap: 32px`
- Max-width of content area: `1100px`, centred
- Textarea min-height: `120px`
- Example chips: horizontal scroll row, all visible without scrolling
- Strategy cards at 4: render as `2×2` grid

### 8.2 Tablet (768–1199px)

- Two-column output maintained: left `60%`, right `40%`, `gap: 24px`
- Textarea min-height: `100px`
- Example chips: horizontal scroll row, may require scroll
- Strategy cards at 4: remain single-column vertical stack (no `2×2` at this breakpoint)
- Page horizontal padding: `24px`

### 8.3 Mobile (<768px)

- Input section: single column, full width
- Output section: single column — optimised prompt displayed first (full width), strategy cards displayed below (full width), caveat banner below strategy cards
- Textarea min-height: `100px`
- Example chips: horizontal scroll row, `2-line wrap` allowed if scroll is awkward
- CTA button: full width
- Copy / Export / Try Another action bar: stacks vertically with `8px` gap
- Page horizontal padding: `16px`

---

## 9. API Specification

### 9.1 Endpoint

The Anthropic Claude API (`/v1/messages`). All calls must go through a **backend proxy endpoint** — never call the API directly from the frontend.

If the site is static/JAMstack: implement as a Vercel or Netlify serverless function.

### 9.2 Model

`claude-sonnet-4-20250514`  
`max_tokens: 1500`

### 9.3 System Prompt

The system prompt is the intelligence layer of the tool. It must be treated as a configurable asset — stored server-side, not hardcoded in the frontend.

```
You are the Oxygy Prompt Engineering Coach — an expert practitioner in 
AI prompting who helps professionals build better prompts for their real 
work tasks.

Your job is to:
1. Read the user's task description
2. Select 2–4 prompting strategies from the approved list below that 
   are most appropriate for this specific task
3. Write a single, clean, optimised prompt that combines those strategies
4. Provide a practitioner's rationale for why each strategy was chosen 
   for this specific task

---

APPROVED PROMPTING STRATEGIES:

1. STRUCTURED_BLUEPRINT — Use for complex, multi-part deliverables needing 
   explicit structure. Defines Role, Context, Task, Format, Steps, Quality 
   Checks. Avoid for simple tasks.

2. CHAIN_OF_THOUGHT — Use for analytical, evaluative, or reasoning tasks. 
   Instructs the AI to work step-by-step before concluding. Avoid for simple 
   factual or creative tasks.

3. PERSONA_EXPERT_ROLE — Use for almost all professional tasks. Assigns 
   a specific expert identity that anchors tone, vocabulary, and perspective.

4. OUTPUT_FORMAT_SPECIFICATION — Use when the output will be shared or 
   directly used. Defines length, layout, tone, structure. Avoid for 
   exploratory or ideation tasks.

5. CONSTRAINT_FRAMING — Always used alongside other strategies, never alone. 
   Scopes what the AI should NOT do. Use for high-stakes or sensitive outputs.

6. FEW_SHOT_EXAMPLES — Use for repeatable, template-style tasks where 
   showing the desired output pattern is more effective than describing it.

7. ITERATIVE_DECOMPOSITION — Use for large, multi-component deliverables. 
   Breaks the task into sequential sub-tasks. Avoid for simple outputs.

8. TONE_AND_VOICE — Use for communication tasks where the relationship with 
   the reader matters. Specifies register and relational dynamic precisely.

---

COMBINATION RULES:

- Minimum 2 strategies, maximum 4
- PERSONA almost always appears (exception: purely mechanical tasks)
- STRUCTURED_BLUEPRINT and CHAIN_OF_THOUGHT are rarely combined — choose 
  one based on whether the task is primarily about structure or reasoning
- CONSTRAINT_FRAMING is always additive — never the sole strategy
- Colour-coded pairs that share a colour tag 
  (Blueprint/Decomposition = Lavender; Chain-of-Thought/Tone = Yellow) 
  should not both appear in the same output

---

TASK TYPE GUIDANCE:

- Simple communication tasks (emails, updates, messages): 
  PERSONA + OUTPUT_FORMAT + optionally CONSTRAINT_FRAMING (2–3 strategies)
- Analytical / evaluative tasks: 
  CHAIN_OF_THOUGHT + CONSTRAINT_FRAMING + PERSONA + optionally OUTPUT_FORMAT 
  (3–4 strategies)
- Complex structured deliverables: 
  STRUCTURED_BLUEPRINT + PERSONA + optionally ITERATIVE_DECOMPOSITION (3–4)
- Workshop / facilitation design: 
  PERSONA + CHAIN_OF_THOUGHT + TONE_AND_VOICE + optionally FEW_SHOT_EXAMPLES
- Template / repeatable format creation: 
  FEW_SHOT_EXAMPLES + OUTPUT_FORMAT + optionally PERSONA (2–3)
- Stakeholder / executive communication: 
  PERSONA + TONE_AND_VOICE + OUTPUT_FORMAT + optionally CONSTRAINT_FRAMING (3–4)

---

OUTPUT FORMAT:

You must respond in the following JSON format ONLY — no markdown, no 
extra text, no code fences:

{
  "prompt": "The full optimised prompt as a clean, copy-ready string. 
             Use \\n for line breaks within the prompt.",
  "strategies_used": [
    {
      "id": "PERSONA_EXPERT_ROLE",
      "name": "Persona / Expert Role",
      "icon": "🎭",
      "why": "A single sentence — practitioner's rationale specific to 
              this task. Written as a peer observation, not a lesson. 
              e.g., 'A sceptical executive audience responds to a peer 
              voice — the facilitator identity frames the output as an 
              experienced practitioner's design, not an AI's best guess.'",
      "what": "One sentence — general description of what this strategy 
               does. e.g., 'Sets a specific expert identity that anchors 
               the AI's register, vocabulary, and level of authority 
               throughout the entire response.'"
    }
  ]
}

RULES:
- The prompt must be clean, professional, and immediately usable in 
  ChatGPT or Claude without modification
- The "why" must be specific to the user's task — not a generic 
  description of the strategy
- The "what" is the stable, general description — it can be consistent 
  across similar tasks
- Do NOT add preamble, commentary, or explanation outside the JSON object
- If the user's input is very short or vague, make reasonable inferences 
  and build the best possible prompt — do not ask for clarification
```

### 9.4 Response Parsing

The frontend should:
1. Parse the JSON response
2. Map `prompt` to the left column prompt display block
3. Map each item in `strategies_used` to a strategy card in the right column
4. Use `id` to determine the left accent strip colour (see Section 7.1)
5. Render `icon` + `name` in the collapsed card header
6. Render `why` under `"WHY THIS WAS USED"` label in expanded state
7. Render `what` under `"WHAT THIS STRATEGY DOES"` label in expanded state

If parsing fails or the response is not valid JSON, show the error message specified in Section 10.4.

### 9.5 Input Payload

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1500,
  "system": "[system prompt as above]",
  "messages": [
    {
      "role": "user",
      "content": "[user's textarea input verbatim]"
    }
  ]
}
```

### 9.6 Rate Limiting

- Client-side: disable CTA button for `5s` after each submission
- Timeout: if API does not respond within `15s`, show: `"This is taking longer than expected. Please try again."` — styled as a subtle amber-tinted notice (`background: #FFFBEB`, `border: 1px solid #F6E05E`, `color: #744210`, border-radius `8px`, padding `12px 16px`)

---

## 10. Error Handling

| Error Type | Display Message | Styling |
|---|---|---|
| API parse failure / invalid JSON | `"Something went wrong generating your prompt. Please try again."` | Background `#FFF5F5`, border `#FC8181`, text `#C53030` |
| API timeout (>15s) | `"This is taking longer than expected. Please try again."` | Background `#FFFBEB`, border `#F6E05E`, text `#744210` |
| API key missing / invalid | `"The prompt service is temporarily unavailable."` | Same as parse failure — do NOT expose API error details |
| Empty textarea submission | Textarea border shifts to `#FC8181`, helper text below: `"Please describe your task first"` — 13px, `#C53030` | No toast — inline validation only |

---

## 11. Developer Notes

### 11.1 Technical Architecture

- Built as a standalone React component (`/playground` route)
- API call via backend serverless function — never client-side
- All state managed in component state (`useState`) — no persistence between sessions required
- The system prompt is stored as a server-side environment variable, not hardcoded in frontend

### 11.2 State Management

| State Variable | Type | Description |
|---|---|---|
| `userInput` | `string` | Current textarea content |
| `isLoading` | `boolean` | API call in progress |
| `result` | `object \| null` | Parsed API response (`prompt` + `strategies_used`) |
| `expandedCards` | `Set<string>` | Strategy IDs currently expanded |
| `copySuccess` | `boolean` | Controls copy button label change |
| `originalInput` | `string` | Snapshot of input at time of submission (for display above output) |

### 11.3 Accessibility

- Textarea must have a proper `<label>` with `for` attribute
- CTA button must have descriptive `aria-label` that updates during loading: `aria-label="Build my prompt"` / `aria-label="Building prompt, please wait"`
- Strategy cards must be keyboard accessible: `Enter` or `Space` to expand/collapse
- Expanded strategy content must be announced by screen readers using `aria-expanded` attribute on the trigger and `aria-live="polite"` on the content panel
- Colour is not the sole differentiator for strategy types — the strategy name and icon carry the same information

### 11.4 Clipboard API

- Use `navigator.clipboard.writeText()` for copy function
- Fallback: `document.execCommand('copy')` for older browsers
- Toast notification for copy confirmation: `background: #1A202C`, `color: #FFFFFF`, `border-radius: 8px`, padding `10px 20px`, text `"Prompt copied to clipboard ✓"`, 14px, auto-dismiss after `2.5s` with fade-out, positioned bottom-centre of viewport

### 11.5 Export Function

- On "Save as .txt" click: generate a Blob with the prompt text and trigger a browser download
- Filename: `oxygy-prompt-[YYYY-MM-DD].txt`
- File header (prepended to the prompt text, separated by a line break):
  ```
  OXYGY AI UPSKILLING — PROMPT PLAYGROUND
  Generated: [date]
  Strategies used: [comma-separated list of strategy names]
  ────────────────────────────────────────
  
  [prompt text]
  ```

### 11.6 Environment Variables

```
ANTHROPIC_API_KEY=your_api_key_here
```

### 11.7 Dependencies

- Anthropic Claude API (via backend proxy)
- DM Sans from Google Fonts
- Lucide Icons (or equivalent icon library)
- Clipboard API (browser-native)

### 11.8 Performance

- Page should be interactive within `2s` of load
- API call returns in `2–6s` typically — skeleton loader or loading state on the CTA button keeps the experience smooth
- Pre-loaded example chips are hardcoded — no API call needed for display
- Lazy-load the output section component to reduce initial bundle size

---

*End of PRD v2.0*
