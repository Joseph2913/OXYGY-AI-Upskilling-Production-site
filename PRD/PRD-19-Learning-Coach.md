# PRD: Learning Coach — AI Upskilling Toolkit Page

**Status:** Ready for implementation  
**Level:** 1 (Fundamentals & Awareness)  
**Level Accent:** `#A8F0E0` / `#1A6B5F`  
**Route:** `/app/toolkit/learning-coach`  
**File location:** `components/app/toolkit/AppLearningCoach.tsx`

---

## 1. Overview

The Learning Coach is a guided, four-step tool that helps a learner close a specific knowledge gap using the AI platform of their choice. Rather than surfacing content directly, it generates a tailored, platform-specific learning prompt and step-by-step instructions — the learner copies the prompt, opens their chosen tool, and follows the guide.

It sits in the Level 1 toolkit alongside the Prompt Playground and Prompt Library. It is positioned as a meta-learning tool: it teaches learners how to use AI to learn better, which reinforces the Level 1 learning objectives around prompting and AI fluency.

**The four-step flow:**
1. Describe your knowledge gap
2. Choose your learning method
3. Choose your platform
4. Receive your personalised learning guide

Every platform routes to a different output format, UI layout, and backend system prompt. This PRD specifies all four steps and all six platform experiences in full.

---

## 2. Page Header & ToolOverview Strip

### Page Title
```
Learning Coach
```
Plain text, no emoji. `fontSize: 28`, `fontWeight: 800`, `color: #1A202C`, `letterSpacing: -0.4px`.

### Description
```
Most people know what they want to learn but don't know how to start. The Learning Coach turns your 
knowledge gap into a tailored learning plan — generating a platform-specific prompt and step-by-step 
guide so you can close the gap today, using the AI tool you already have access to.
```
`fontSize: 14`, `color: #718096`, `lineHeight: 1.7`, max 2 lines at full width, `marginBottom: 20`.

### ToolOverview Strip
Follows the standard `ToolOverview` component pattern.

**Steps:**
| # | Label | Detail |
|---|-------|--------|
| 1 | Describe your gap | Tell us what you're trying to learn or where you're stuck |
| 2 | Choose how you learn | Pick the learning style that works best for you |
| 3 | Choose your platform | Select the AI tool you have access to |
| 4 | Get your guide | Receive a tailored prompt and step-by-step instructions |

**Outcome bar:**
> "A personalised learning guide — a ready-to-use prompt and platform-specific instructions — tailored to your gap, your learning style, and your chosen AI tool."

Step badges use `LEVEL_ACCENT` (`#A8F0E0`) / `LEVEL_ACCENT_DARK` (`#1A6B5F`).

---

## 3. Step 1 — Describe Your Gap

### Step Card Header
- **Title:** Describe your knowledge gap
- **Subtitle:** What are you trying to learn, or where are you stuck?

### Content
A single auto-growing textarea. No other fields.

**Textarea spec:**
- `minHeight: 120px`, `maxHeight: 300px`, `resize: none`
- Auto-grows on input (measure scrollHeight, set height)
- Placeholder: `"e.g. I understand what prompting is but I don't know how to structure prompts that get consistent results. I keep getting vague or off-topic responses."`
- `fontSize: 14`, `color: #1A202C`, `lineHeight: 1.7`
- `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 14px 16px`
- Focus: `border-color: #A8F0E0`, `outline: none`, `box-shadow: 0 0 0 3px rgba(168,240,224,0.2)`

**Example chips** (below the textarea, labelled "Try an example:"):
- `"I keep forgetting when to use few-shot prompting vs chain-of-thought"`
- `"I don't understand the difference between a system prompt and a user message"`
- `"I want to build a custom AI agent but don't know how to write the instructions"`
- `"I'm unsure how to structure a workflow when multiple AI steps are involved"`
- `"I understand the concepts but can't translate them into prompts that actually work"`

Chips follow standard spec: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `borderRadius: 20px`, `padding: 6px 14px`, `fontSize: 12`, `color: #4A5568`. Hover: `background: #A8F0E020`, `borderColor: #A8F0E0`, `color: #1A6B5F`.

**Validation:** If the user clicks "Continue" with an empty or <20-character input, flash a red border on the textarea for 600ms and show inline error text: `"Please describe your gap in a bit more detail — the more specific, the better your guide."`

**Continue button:** Right-aligned below the chips. `"Continue →"` primary style. Disabled until `gap.length >= 20`.

**Collapsed state (after Step 1 is done):** Shows the first 80 characters of their input followed by `"..."`, with a `"Done ✓"` badge right-aligned in `LEVEL_ACCENT_DARK`.

---

## 4. Step 2 — Choose Your Learning Method

### Step Card Header
- **Title:** How do you learn best?
- **Subtitle:** We'll shape the guide around your preferred learning style.

### Content
Six method cards in a 2×3 grid. Single-select.

**The six methods:**

| ID | Label | Icon | Description |
|----|-------|------|-------------|
| `watch` | Watch & follow | ▶ | You learn by watching demonstrations and following along visually |
| `read` | Read & reflect | ◎ | You prefer written explanations you can read at your own pace and revisit |
| `talk` | Talk it through | ◇ | You learn by asking questions and having concepts explained conversationally |
| `build` | Build & experiment | ◈ | You learn by creating something hands-on — you need to do to understand |
| `listen` | Listen & absorb | ♫ | You prefer audio — you learn well from podcasts, walkthroughs, narrated content |
| `research` | Research in depth | ⌖ | You want comprehensive, source-backed answers you can dig into at your own pace |

**Card spec (each method card):**
- `padding: 16px 18px`, `borderRadius: 12`, `border: 1px solid #E2E8F0`
- Default: `background: #FFFFFF`
- Selected: `background: #A8F0E020`, `border: 1.5px solid #A8F0E0`
- Icon: 32px circle, `background: #F7FAFC` (default) / `#A8F0E040` (selected), geometric unicode character at 16px in `#1A6B5F`
- Label: `fontSize: 14`, `fontWeight: 700`, `color: #1A202C`, `marginBottom: 4`
- Description: `fontSize: 12`, `color: #718096`, `lineHeight: 1.55`
- Hover (unselected): `background: #F7FAFC`, `border-color: #CBD5E0`
- Transition: `all 150ms ease`

**Continue button:** Same pattern as Step 1. Disabled until a method is selected.

**Collapsed state:** Shows the selected method label and icon with a `"Done ✓"` badge.

---

## 5. Step 3 — Choose Your Platform

### Step Card Header
- **Title:** Which AI platform will you use?
- **Subtitle:** We'll generate instructions tailored to that tool's specific features.

### Content
Six platform tiles in a 2×3 grid. Single-select.

**The six platforms:**

| ID | Label | Sub-label | Logo path |
|----|-------|-----------|-----------|
| `notebooklm` | NotebookLM | Deep Research + Audio | `/logos/brands/notebooklm.svg` |
| `claude` | Claude | Visualiser + Projects | `/logos/brands/claude.svg` |
| `chatgpt` | ChatGPT | Canvas collaborative mode | `/logos/brands/chatgpt.svg` |
| `perplexity` | Perplexity | Research + reading paths | `/logos/brands/perplexity.svg` |
| `gemini` | Gemini / AI Studio | Prompting sandbox | `/logos/brands/gemini.svg` |
| `youtube` | YouTube | Optimised search queries | `/logos/brands/youtube.svg` |

**Tile spec:** Identical to the existing `PlatformSelector` card pattern in `components/app/workflow/PlatformSelector.tsx`, but using Level 1 accent colours for selected state (`background: #A8F0E020`, `border: 1.5px solid #A8F0E0`).

**Platform capability badges** (shown below each tile's sub-label, only on the selected tile):
A one-line contextual note in `#1A6B5F` at `fontSize: 11` confirming what the guide will focus on:
- NotebookLM: `"Guide focuses on: Deep Research → output format"`
- Claude: `"Guide focuses on: Visualiser prompts + concept maps"`
- ChatGPT: `"Guide focuses on: Canvas collaborative build"`
- Perplexity: `"Guide focuses on: Curated reading path with citations"`
- Gemini: `"Guide focuses on: AI Studio prompt sandbox (L2+)"`
- YouTube: `"Guide focuses on: Optimised search queries + what to watch for"`

**Generate button:** `"Generate My Learning Guide →"` — primary teal, `borderRadius: 999`, disabled until platform is selected.

**Collapsed state:** Shows platform logo + name with `"Done ✓"` badge.

---

## 6. Step 4 — Your Learning Guide (Output)

This step renders differently depending on the platform selected. All six layouts share a common outer wrapper but have distinct inner structures.

### 6.0 Common outer wrapper (all platforms)

**Next Step Banner** (appears at the top of the output, below the top action row, standard spec):
- Copy of the generated prompt and instructions tailored to platform
- Body: `"Your guide is ready. Follow the steps below, then come back and try the next level activity."`

**Top action row** (right-aligned):
- **Copy Guide** — primary ActionBtn. Copies the full guide (prompt + instructions) as plain text.
- **Download (.md)** — default ActionBtn. Exports as `learning-guide-{date}.md`.
- **Save to Artefacts** — accent ActionBtn (`#5A67D8`). Saves to the user's artefacts library.

**Processing Progress** (shown while generating, inside Step 4 card):
Steps (tool-specific labels, ~5 steps, standard timing pattern):
1. "Analysing your knowledge gap…"
2. "Mapping to learning objective…"
3. "Selecting the right platform features…"
4. "Crafting your personalised prompt…"
5. "Finalising your guide…"

---

### 6.1 NotebookLM Output

**Primary feature:** Deep Research → multi-format output consumption.

**Output layout — two sections:**

**Section A: Your Deep Research Prompt**
- Eyebrow: `"STEP 1 — DEEP RESEARCH PROMPT"` in `#1A6B5F`
- Description text (13px, #718096): `"Paste this into NotebookLM's Deep Research field. It will search the web for sources on your gap and produce a structured, source-backed report."`
- Prompt box (standard prompt-box style, teal left border): The generated Deep Research prompt
- Copy button (right-aligned above the box): `"Copy Prompt"` — copies prompt text only

**Section B: After Deep Research — What to do next**
- Eyebrow: `"STEP 2 — ENGAGE WITH YOUR RESULTS"`
- Instruction card (white, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: 20px`):
  - Heading: `"Once your Deep Research report generates:"` (14px, 700, navy)
  - Three follow-on action cards in a row, chosen by **learning method**:
    - `watch` / `listen` → **Generate Audio Overview**: "Click 'Generate' in the Audio section to create a podcast-style conversation between two AI hosts discussing your topic. Listen while you work."
    - `read` / `research` → **Use the Source Guide**: "In the left panel, click 'Studio' → 'Study Guide' to generate a structured handout from the report's sources."
    - `talk` → **Start a Chat conversation**: "Use the Chat panel to ask follow-up questions. Start with: 'What is the most important thing a beginner should understand about [topic]?'"
    - `build` → **Create an FAQ**: "Click 'Studio' → 'FAQ' to generate a set of questions and answers from the sources. Use them to test yourself."
  - Each action card: icon (geometric unicode) + label + 2-sentence instruction + `"Why this works"` in muted italic

**Step-by-step instructions** (below both sections):
Numbered list (1–5) of exact steps to follow in the NotebookLM interface. Referencing specific UI elements by name ("the Deep Research tab", "the Studio panel", "the Audio Overview button").

---

### 6.2 Claude Output

**Primary feature:** Visualiser — interactive diagrams and concept maps.

**Output layout — two sections:**

**Section A: Your Visualiser Prompt**
- Eyebrow: `"YOUR CLAUDE PROMPT"`
- Description (13px, #718096): `"Paste this into Claude. It's designed to trigger the Visualiser — Claude will generate an interactive diagram, concept map, or decision tree that makes the concept visual and explorable."`
- Prompt box: The generated Visualiser-optimised prompt
- Copy button

**Section B: How to get the most from Claude**
- Eyebrow: `"AFTER YOU PASTE THE PROMPT"`
- Three follow-on prompt chips — suggested follow-up prompts the learner can type to Claude after the initial visual appears:
  - `"Can you add examples to each part of the diagram?"`
  - `"Show me a simpler version — just the core concept"`
  - `"What's the most common mistake people make with this?"`
  - Each chip: bordered pill, click to copy, `fontSize: 12`, `color: #1A6B5F`
- Feature note card (light bg, `#F7FAFC`, `borderRadius: 10`, `padding: 14px 16px`):
  - Icon + `"About the Visualiser"` label
  - `"Claude's Visualiser renders inline interactive diagrams directly in the conversation — not images, but explorable SVGs you can examine and ask questions about. It's available on all Claude plans."`

**Step-by-step instructions:** Numbered list. References specific Claude UI: "Open Claude at claude.ai", "Type or paste your prompt into the message box", "If Claude doesn't produce a diagram automatically, add: 'Please use the Visualiser to show this as a diagram'", etc.

---

### 6.3 ChatGPT Output

**Primary feature:** Canvas — collaborative building mode.

**Output layout — two sections:**

**Section A: Your Canvas Prompt**
- Eyebrow: `"YOUR CHATGPT CANVAS PROMPT"`
- Description (13px, #718096): `"Paste this into ChatGPT in Canvas mode. You and ChatGPT will collaboratively build a [deliverable relevant to their gap] — ChatGPT drafts, you edit, and through the back-and-forth you'll internalise the concept."`
- Prompt box: The generated Canvas prompt
- Copy button

**Section B: How Canvas works for learning**
- Eyebrow: `"LEARNING THROUGH CANVAS"`
- Feature explanation card:
  - `"Canvas is ChatGPT's collaborative editor. When you paste this prompt, ChatGPT will create a working document in the Canvas panel — something you can edit directly, not just read. The act of revising and pushing back on the content is what creates understanding."`
- What you'll build: A short description of the specific deliverable the prompt will create (e.g., "A structured reference guide on the three context layers, written in your own words with ChatGPT's guidance").
- Three follow-on suggestions for how to use Canvas:
  - `"Ask ChatGPT to quiz you by hiding parts of the document"`
  - `"Request a simpler version of any section you don't understand"`
  - `"Ask it to add real examples from your industry"`

**Step-by-step instructions:** "Open ChatGPT → click the pencil icon next to the message box to switch to Canvas mode → paste the prompt → hit Enter." Includes a note: "If Canvas mode isn't showing, make sure you're using ChatGPT Plus or Team."

---

### 6.4 Perplexity Output

**Primary feature:** Research-backed curated reading path.

**Output layout — two sections:**

**Section A: Your Research Prompt**
- Eyebrow: `"YOUR PERPLEXITY PROMPT"`
- Description (13px, #718096): `"This prompt asks Perplexity to build you a step-by-step reading path — not just an answer, but a sequenced curriculum. Each step in the path will include a source recommendation and what to focus on when reading it."`
- Prompt box: The generated reading-path prompt
- Copy button
- **Focus Mode badge** (below the copy button, not inside the box): A pill indicating which Focus Mode to use:
  - Most gaps → `"Use: Academic Focus"` (badge colour `#C3D0F5`)
  - `research` method → `"Use: Academic Focus"`
  - `build` method → `"Use: Writing Focus"`
  - `watch` / `listen` → `"Use: YouTube Focus"` (in this case the prompt asks for video recommendations instead of articles)

**Section B: How to use your reading path**
- Eyebrow: `"AFTER YOU GET YOUR RESULTS"`
- Instruction: `"Perplexity will return a sequenced list of sources. Don't just read Perplexity's summary — follow the path it lays out. Each source will build on the previous one."`
- Three-step reading guide (numbered, card-style):
  1. Read Step 1 of the path for the foundational concept
  2. Read Step 2 for a practical application or worked example
  3. Use the Perplexity Chat to ask follow-up questions about anything unclear
- Spaces tip card: `"Save this to a Space in Perplexity to keep your research connected. Next time you have a question about this topic, search within the same Space to build your knowledge incrementally."`

**Step-by-step instructions:** "Open Perplexity → change the Focus Mode (top-left of the search bar) to [Academic/Writing/YouTube] → paste the prompt → press Enter."

---

### 6.5 Gemini / AI Studio Output

**Primary feature:** Prompt experimentation sandbox (Level 2+ framing).

**Output layout — two sections:**

**Section A: Your AI Studio Prompt**
- Eyebrow: `"YOUR GOOGLE AI STUDIO PROMPT"`
- Description (13px, #718096): `"This prompt is designed for Google AI Studio — a sandbox where you can test prompts, adjust parameters, and see exactly how changing your instructions changes the AI's output. It's a hands-on way to build intuition for how prompting works."`
- Prompt box: The generated system prompt (formatted as a system prompt, not a user message)
- Copy button

**Section B: How to use AI Studio for learning**
- Eyebrow: `"GETTING STARTED IN AI STUDIO"`
- Feature explanation card:
  - `"Unlike a chat interface, AI Studio lets you adjust the System Instructions, the temperature, and the model separately. Changing these while keeping the user message the same lets you see exactly what each variable does."`
- Three experiments panel — three bordered experiment cards in a row:
  - **Experiment 1:** "Run this prompt as-is and read the output"
  - **Experiment 2:** "Change the temperature from 0.5 to 1.0 and run again. Notice how the output changes."
  - **Experiment 3:** "Edit the System Instructions to remove one section, then run again. What's missing?"
  - Each card: light `#F7FAFC` background, `borderLeft: 3px solid #A8F0E0`, numbered badge, short description

**Step-by-step instructions:** "Go to aistudio.google.com → Create new prompt → Set type to 'Chat' → Paste the prompt text into the System Instructions field → Add your test message in the user turn → Click Run."

**Level note** (for L1 learners — conditional): A muted callout card: `"This tool is most powerful at Level 2 where you're designing system prompts for real agents. For now, use it to see how the structure of instructions shapes the AI's response."` Only shown if `userProfile.currentLevel === 1`.

---

### 6.6 YouTube Output

**Primary feature:** Optimised search queries + watching guidance.

**Output layout — two sections:**

**Section A: Your Optimised Search Queries**
- Eyebrow: `"YOUR YOUTUBE SEARCH QUERIES"`
- Description (13px, #718096): `"These search queries have been optimised for your specific gap and learning style. Use them in order — start with the first to get the foundational concept, then use the second for a practical demonstration."`
- Three search query cards (stacked):
  - Each card: `borderRadius: 10`, `border: 1px solid #E2E8F0`, `padding: 14px 16px`, `background: #F7FAFC`
  - Query number label (`"Query 1"`, `"Query 2"`, `"Query 3"`) in muted uppercase
  - The search string in `fontSize: 14`, `fontWeight: 600`, `color: #1A202C`
  - `"Search on YouTube →"` link button (opens `https://www.youtube.com/results?search_query={encodedQuery}` in a new tab)
  - Copy button (copies just the query string)
  - What to look for note (1–2 sentences in `fontSize: 12`, `color: #718096`): e.g., `"Look for videos under 15 minutes that show a live demo, not just slides. Channels like 'AI Explained', 'Matt Wolfe', and 'Wes Roth' tend to be high quality for this topic."`

**Section B: How to watch effectively**
- Eyebrow: `"WHILE YOU WATCH"`
- Method-specific guidance card:
  - `watch` → `"Pause whenever you see a technique applied. Try to predict what the presenter will do before they do it — this forces active engagement."`
  - `listen` → `"You don't need to watch the screen. Listen to the first video at 1.25x speed, then rewatch any section where you lost the thread."`
  - `build` → `"Open your AI tool next to the video and try to replicate each step as you go. Pause frequently."`
  - `read` / `research` → `"Enable captions and follow along in text. Pause to take brief notes — one bullet per key concept."`
  - `talk` → `"After watching, ask your AI tool to quiz you on what you just learned."`
- Filter guidance: `"Filter by: Upload date → This year, Duration → 4-20 minutes, Sort by → Relevance"` shown as a code-style block.

**Note on curated database (developer implementation note — see Section 9):** The system checks a `data/learningCoachVideos.ts` curated database before generating search queries. If the learner's gap maps to a known topic, curated video recommendations are shown first (with an "Oxygy Recommended" badge), followed by the generated search queries. If no curated match is found, only generated queries are shown.

---

## 7. Iterative Refinement

The output step includes a collapsed refinement card (standard pattern from TOOLKIT-PAGE-STANDARD §4.5).

**Caveat text:** `"This guide is a starting point — your actual learning journey will depend on what you find on the platform. Come back and use the coach again once you've worked through the first guide."`

**Refinement questions (AI-generated, task-specific examples):**
- `"Was there a specific part of the guide that felt unclear or didn't match your situation?"`
- `"Did the platform you chose work as expected, or do you want to try a different one?"`
- `"What's still unclear after reviewing the guide?"`

**Refine CTA:** `"Refine My Guide →"` — disabled until at least one field is answered.

---

## 8. State Architecture

```typescript
// Step tracking
const [gap, setGap] = useState('');
const [learningMethod, setLearningMethod] = useState<string | null>(null);
const [platform, setPlatform] = useState<string | null>(null);
const [result, setResult] = useState<LearningGuideResult | null>(null);

// UI state
const [isLoading, setIsLoading] = useState(false);
const [loadingStep, setLoadingStep] = useState(0);
const [error, setError] = useState<string | null>(null);
const [copied, setCopied] = useState(false);
const [savedToLibrary, setSavedToLibrary] = useState(false);
const [toastMessage, setToastMessage] = useState<string | null>(null);
const [refineExpanded, setRefineExpanded] = useState(false);
const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
const [additionalContext, setAdditionalContext] = useState('');
const [refinementCount, setRefinementCount] = useState(0);

// Step completion (derived)
const step1Done = gap.trim().length >= 20;
const step2Done = learningMethod !== null;
const step3Done = platform !== null;
const step4Done = result !== null;
```

**Draft persistence:** Save `gap` to `localStorage` with key `oxygy_learning_coach_draft`. Restore on mount.

---

## 9. Backend: System Prompts & Processing Pipeline

### 9.1 API Route

**Endpoint:** `POST /api/learning-coach`  
**File:** `api/learning-coach.ts`

**Request body:**
```typescript
interface LearningCoachRequest {
  gap: string;              // The learner's described knowledge gap
  learningMethod: string;   // One of: watch, read, talk, build, listen, research
  platform: string;         // One of: notebooklm, claude, chatgpt, perplexity, gemini, youtube
  refinement?: string;      // Optional: refinement message for second+ passes
}
```

**Response body:**
```typescript
interface LearningGuideResult {
  platform: string;
  learningMethod: string;
  prompt: string;              // The main prompt for the learner to copy
  platformInstructions: string; // Step-by-step instructions for the platform
  followOnActions: string[];   // 2-4 suggested follow-on actions / prompts
  focusMode?: string;          // Perplexity only: which Focus Mode to use
  searchQueries?: string[];    // YouTube only: 2-3 optimised search queries
  watchGuidance?: string;      // YouTube only: method-specific watching tip
  levelNote?: string;          // Gemini only: L1 vs L2+ framing
  refinement_questions: string[]; // 3 task-specific refinement questions
}
```

---

### 9.2 Master System Prompt (all platforms)

The following system prompt is sent as the `system` field in every API call. Platform-specific instructions are injected into the `[PLATFORM_INSTRUCTIONS]` slot.

```
You are an expert learning designer and AI tutor. Your job is to turn a learner's knowledge gap into a practical, immediately actionable learning guide tailored to a specific AI platform.

You will receive:
- The learner's gap description (what they're trying to understand or where they're stuck)
- Their preferred learning method (watch, read, talk, build, listen, or research)
- Their chosen platform (notebooklm, claude, chatgpt, perplexity, gemini, or youtube)

Your output must be a JSON object with the following fields:
{
  "prompt": "...",
  "platformInstructions": "...",
  "followOnActions": ["...", "...", "..."],
  "refinement_questions": ["...", "...", "..."]
}

[Additional platform-specific fields are defined below per platform.]

UNIVERSAL RULES:
1. The prompt field must be immediately usable — the learner should be able to paste it into the platform with zero editing.
2. The prompt must be specific to the learner's gap. Do not write a generic "teach me about X" prompt. Reference the specific confusion or gap they described.
3. Never mention specific AI company names (OpenAI, Anthropic, Google) in the prompt or instructions. Use "your AI tool", "the AI", or the platform name only.
4. Frame the gap as a knowledge opportunity, not a failure. Tone is always: curious, capable professional who hasn't been shown this yet.
5. The prompt must incorporate the learning method. A "build" learner gets a prompt that asks for a collaborative exercise or creation task. A "read" learner gets a prompt that asks for a comprehensive, structured written explanation. A "watch" learner gets a prompt that asks for visual output.
6. platformInstructions must reference exact UI element names from the platform. Be specific: "the Deep Research tab", "Canvas mode (pencil icon)", "the Studio panel". Don't describe the platform generically.
7. followOnActions must be 3 specific suggested follow-up prompts or actions the learner can do after the main prompt, written as strings they can copy and use directly.
8. refinement_questions must be 3 specific questions relevant to THIS learner's gap — not generic. Write them as if you know what confused them.

[PLATFORM_INSTRUCTIONS]
```

---

### 9.3 Platform-Specific Prompt Injection (`[PLATFORM_INSTRUCTIONS]`)

**NotebookLM:**
```
PLATFORM: NotebookLM — Deep Research

The prompt you generate must be optimised for NotebookLM's Deep Research feature. Deep Research searches the web for sources and produces a structured, cited report. It works best with research-framed questions, not open-ended "explain me" prompts.

Generate a Deep Research prompt that:
- Frames the gap as an investigation question ("Research the practical differences between X and Y for a professional who is trying to...")
- Asks Deep Research to structure the report pedagogically: foundational concepts first, then practical applications, then advanced nuance
- Specifies that the report should include concrete examples, not just definitions
- References the learner's specific gap in the framing

Add a "platformInstructions" string describing these steps:
1. Open NotebookLM at notebooklm.google.com
2. Click "New notebook" → select "Deep Research" tab (not "Sources")
3. Paste the prompt into the Deep Research field
4. Click "Research" and wait 2-5 minutes for the report to generate
5. Based on learning method — add specific instruction for the follow-on feature to use:
   - watch/listen → "Click 'Audio Overview' → 'Generate' to create a podcast-style summary"
   - read/research → "Click 'Studio' → 'Study Guide' to create a structured handout"
   - talk → "Use the Chat panel to ask follow-up questions"
   - build → "Click 'Studio' → 'FAQ' to generate self-testing questions"

No additional JSON fields required for this platform.
```

**Claude:**
```
PLATFORM: Claude — Visualiser

The prompt you generate must be designed to trigger Claude's Visualiser feature — which renders interactive SVG diagrams, concept maps, and flowcharts directly in the conversation. The prompt must explicitly ask Claude to create a visual representation.

Generate a prompt that:
- Explicitly requests a diagram, concept map, or decision tree ("Create a visual diagram showing...")
- Names the specific concept from the learner's gap as the subject of the diagram
- Specifies what the diagram should show (relationships between concepts, decision criteria, a sequence of steps)
- For "build" learners: asks Claude to also create an Artifacts interactive exercise alongside the diagram
- For "talk" learners: after the diagram, asks Claude to walk through each part conversationally

Add a "platformInstructions" string describing:
1. Open Claude at claude.ai (any plan)
2. Type or paste the prompt into the message box
3. If Claude doesn't automatically create a visual, add: "Please use the Visualiser to show this as an interactive diagram"
4. Click on any part of the diagram to explore it further
5. Use the follow-on prompts below to deepen the visual

No additional JSON fields required.
```

**ChatGPT:**
```
PLATFORM: ChatGPT — Canvas mode

The prompt you generate must be designed for ChatGPT's Canvas mode — a collaborative document editor where the learner and ChatGPT build something together. The prompt should set up a creation task relevant to the learner's gap, not just a "teach me" request.

Generate a prompt that:
- Asks ChatGPT to open Canvas and collaboratively build a specific deliverable relevant to the gap
  - Examples: a reference guide, a decision framework, a set of worked examples, a comparison matrix
- Frames it as collaborative: "Let's build together..." or "Help me create..."
- For "build" learners: make the deliverable a practical tool they'll actually use
- For "read" learners: make the deliverable a structured guide they'll reference later
- Specifies that they should start with an outline and build from there, so the learner can edit at each stage

Add a "platformInstructions" string describing:
1. Open ChatGPT at chat.openai.com (requires Plus or Team plan)
2. Click the pencil/canvas icon next to the message input to enable Canvas mode
3. Paste the prompt and press Enter
4. ChatGPT will create a document in the right Canvas panel — you can click to edit any part of it directly
5. If ChatGPT doesn't open Canvas automatically, type: "Open this in Canvas so we can edit it together"

No additional JSON fields required.
```

**Perplexity:**
```
PLATFORM: Perplexity — Curated reading path

The prompt you generate must ask Perplexity to build a sequenced, step-by-step reading path — not a general answer. Perplexity's strength is citing sources; the prompt should exploit this by asking for a structured curriculum where each step includes a specific source recommendation.

Generate a prompt that:
- Explicitly asks for "a step-by-step reading path" or "a sequenced learning curriculum"
- Asks for 4-6 steps, each with: a source recommendation, what concept it covers, and what to focus on when reading
- Frames it as a progression: foundational → applied → advanced
- References the learner's specific gap as the topic
- For "research" learners: add "Include academic or practitioner-written sources where possible"

Determine and include in the JSON response a "focusMode" field:
- research / read → "Academic"
- build → "Writing"
- watch / listen → "YouTube"
- talk → "Academic"

Add a "platformInstructions" string describing:
1. Open Perplexity at perplexity.ai
2. Before searching, click the Focus selector (top-left of the search bar) and select [focusMode]
3. Paste the prompt and press Enter
4. Follow the reading path in order — open each linked source and read what Perplexity says to focus on
5. Optionally: click "Save" to add this to a Space for future reference
```

**Gemini / AI Studio:**
```
PLATFORM: Gemini / Google AI Studio — Prompt sandbox

The prompt you generate must be formatted as a SYSTEM PROMPT — not a user message. AI Studio separates system instructions from user turns, and this is the learning mechanic: the learner sees how system instructions shape output by experimenting with them.

Generate a system prompt that:
- Defines the AI's role as a tutor for the specific topic in the learner's gap
- Sets constraints and expectations for the tutoring style (based on learning method)
- For "build" learners: instructs the AI to guide them through creating something, not just explaining
- For "talk" learners: instructs the AI to use Socratic questioning
- Includes explicit instructions about response format and length

Also include a "userTurnMessage" field (not in the standard schema, add it) — a test user message they should paste into the user turn to test the system prompt. This should be directly relevant to their gap.

Add a "platformInstructions" string describing:
1. Go to aistudio.google.com (free with a Google account)
2. Click "Create new prompt" → select "Chat" type
3. Paste the system prompt text into the "System instructions" field (top section)
4. In the user turn below, type or paste the test message provided
5. Click "Run" and observe how the system instructions shaped the response
6. Try: increase Temperature to 1.0 and run again — notice how the output changes

Add a "levelNote" field:
- If gap is related to prompting basics / Level 1 concepts: "This sandbox is most powerful at Level 2 when you're designing real system prompts for agents. For now, use it to build intuition for how instructions shape AI behaviour."
- If gap is related to agents / system prompts / Level 2+: leave levelNote as null
```

**YouTube:**
```
PLATFORM: YouTube — Optimised search queries

Do not generate a prompt for the learner to copy. Instead, generate three optimised YouTube search queries and watching guidance.

Generate:
- "searchQueries": an array of 3 strings, each a YouTube search query optimised for the learner's gap and learning method:
  - Query 1: foundational — designed to surface conceptual explainer videos
  - Query 2: practical — designed to surface tutorial or demo videos
  - Query 3: advanced — designed to surface advanced practitioner discussions
  - Each query should be 4-8 words, specific to the gap, natural search language
  - For "watch"/"build": include words like "tutorial", "demo", "walkthrough"
  - For "listen": include words like "explained", "podcast", "deep dive"
  - For "research": include words like "breakdown", "analysis", "guide"

- "watchGuidance": a string (1-2 sentences) of method-specific watching advice:
  - watch: pause-and-predict technique
  - listen: audio-only approach at 1.25x
  - build: replicate each step in parallel
  - read: enable captions and take notes
  - talk: self-quiz after watching
  - research: look for channel credibility signals

- "filterGuidance": a string describing the YouTube filter settings to use ("Upload date: This year, Duration: 4-20 minutes, Sort by: Relevance")

Set "prompt" to an empty string — there is no platform prompt for YouTube.
Set "platformInstructions" to describe how to use the search queries and filters.

CURATED DATABASE NOTE (for the developer, not in the AI output):
Before calling the AI for YouTube, the frontend checks data/learningCoachVideos.ts. If a curated match is found for the gap topic, those videos are displayed first. The AI-generated queries are used as a fallback or supplement.
```

---

### 9.4 Curated Video Database

**File:** `data/learningCoachVideos.ts`

```typescript
export interface CuratedVideo {
  id: string;
  title: string;
  channel: string;
  url: string;                    // Full YouTube URL
  duration: string;               // e.g. "12 min"
  topicIds: string[];             // Maps to learning objective IDs
  learningMethods: string[];      // Which methods this video suits: watch, listen, build, etc.
  relevanceNote: string;          // 1-2 sentences: why Oxygy recommends this
  level: 1 | 2 | 3 | 4 | 5;     // Which level's content it covers
}

export const CURATED_VIDEOS: CuratedVideo[] = [
  // Populated manually. Start with 20-30 videos across L1-L3 topics.
  // Example:
  {
    id: "cv-001",
    title: "Prompt Engineering Full Course",
    channel: "Learn Prompting",
    url: "https://www.youtube.com/watch?v=...",
    duration: "18 min",
    topicIds: ["prompt-structure", "rctf", "context-engineering"],
    learningMethods: ["watch", "build"],
    relevanceNote: "Covers prompt structure with live demos in multiple AI tools. Especially good for understanding when to add context vs when to keep it short.",
    level: 1,
  },
];
```

**Matching logic (frontend, before API call for YouTube):**
```typescript
function findCuratedMatches(gap: string, learningMethod: string): CuratedVideo[] {
  // Simple keyword matching against topicIds and learningMethods
  // If 2+ matches: show them first with "Oxygy Recommended" badge
  // If 0-1 matches: skip curated section, show only AI-generated queries
}
```

---

## 10. Responsive Behaviour

- **Desktop (1200px+):** Full 2-column grid for method and platform selection. Output sections stacked full width.
- **Tablet (768-1199px):** 2-column grids collapse to 2 columns (3 rows of 2). Output sections full width.
- **Mobile (<768px):** All grids collapse to 1 column. Textarea `minHeight: 100px`. Step cards `padding: 16px 18px`.

---

## 11. Developer Notes

1. **No new route needed in BUILT_ROUTES** — add `'/app/toolkit/learning-coach'` to the `BUILT_ROUTES` Set in `AppToolkit.tsx`.
2. **Sidebar entry** — add a Learning Coach entry to `AppSidebar.tsx` navigation, grouped under Level 1 tools.
3. **Tool card in AppToolkit** — add an entry to `data/toolkitData.ts` for the Learning Coach tool with the correct level, icon, route, and description.
4. **YouTube query links** — encode search queries using `encodeURIComponent` before building the YouTube search URL: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`.
5. **AI Studio "userTurnMessage"** — this extra field from the Gemini platform path is not part of the standard `LearningGuideResult` interface. Add it as an optional field: `userTurnMessage?: string`.
6. **Curated video database** — start with a manually curated set of 20-30 videos in `data/learningCoachVideos.ts`. Topic IDs should map to the same topic identifier system used in `data/levelTopics.ts`.
7. **Tool usage tracking** — call `upsertToolUsed(user.id, 1)` when the learner generates their first guide in a session.
8. **Focus Mode badge for Perplexity** — the `focusMode` field from the API response drives which badge is shown below the platform selection confirmation and in the instructions. Map: `"Academic"` → badge `#C3D0F5`, `"Writing"` → badge `#A8F0E0`, `"YouTube"` → badge `#F5B8A0`.
9. **YouTube platform — prompt field is empty** — the standard "Copy Guide" action for YouTube should copy the three search queries formatted as plain text, not an empty string. Build a `buildYouTubeGuide()` function that composes the three queries + watchGuidance into a clean copyable format.
10. **Error handling** — if the API call fails, display the error within the Step 4 card (not as a toast). Provide a "Try again" button that retries the same request.
