# PRD-16: Learning Coach (v2 — Chat Interface)

> A conversational AI learning coach that lives inside the authenticated dashboard. On first visit, a structured onboarding survey captures the learner's profile. On every subsequent visit, a full-screen chat interface lets the learner describe what they want to learn, and the agent guides them through a structured conversation — suggesting learning methods, recommending specific platform features, and delivering step-by-step instructions with copy-paste prompts. The agent knows the learner's profile, their onboarding data, their learning plan, and all course content available on the platform.

---

## 1. Overview

### 1.1 Purpose

The Learning Coach is a persistent AI coaching agent that helps learners use external AI tools to close specific knowledge gaps. Unlike the other toolkit pages (which are form → generate → output flows), this page is a **conversational interface** where the agent guides the learner through a structured dialogue, adapting to their responses and preferences.

The agent has three layers of knowledge:

1. **The learner** — their profile (learning preferences, available platforms, experience level, role, challenges, goals), their onboarding data (function, seniority, ambition), and their personalised learning plan (projects across levels, level depths)
2. **The platform** — all course content, topic structures, e-learning modules, articles, videos, and toolkit tools available in the Oxygy platform
3. **External AI tools** — a curated registry of what each AI platform can do for learning, mapped to specific features and learning modalities

### 1.2 Where It Sits

- **Route:** `/app/toolkit/learning-coach`
- **Nav entry:** New item in `AppSidebar.tsx` — label: `"Learning Coach"`, icon: `GraduationCap` (lucide-react), positioned after "My Toolkit" and before "My Artefacts"
- **Lazy-loaded** in `App.tsx` via `React.lazy()`
- **Layout:** Full-screen chat — minimal header, no toolkit shell (no ToolOverview strip, no description paragraph). The sidebar nav remains accessible for navigation to other pages.

### 1.3 Two Modes

| Mode | Trigger | Experience |
|------|---------|------------|
| **Onboarding Survey** | First visit (no `learner_coach_profiles` record for this user) | Structured card-based form capturing learning preferences, platforms, and context. Submits → transitions to chat. |
| **Chat Interface** | Every subsequent visit (profile exists) | Full-screen conversational interface. Agent has learner profile in context. |

---

## 2. Mode 1 — Onboarding Survey

### 2.1 When It Appears

On page mount, the component checks for an existing `learner_coach_profiles` record for the current user. If none exists, the survey renders instead of the chat interface.

### 2.2 Layout

The survey is a vertically centred card (`maxWidth: 640px`, `margin: '0 auto'`) with a stepped progression. One question category per step. A progress bar at the top shows completion (`currentStep / totalSteps`).

**Header:**
- Title: "Set Up Your Learning Coach" — `fontSize: 24`, `fontWeight: 800`, `color: #1A202C`, `fontFamily: "'DM Sans', sans-serif"`
- Subtitle: "Tell me how you learn best, and I'll personalise every recommendation to you." — `fontSize: 14`, `color: #718096`, `lineHeight: 1.6`

**Progress bar:**
- Track: `height: 3px`, `background: #E2E8F0`, `borderRadius: 2`
- Fill: `background: #38B2AC`, `width: ${(step / totalSteps) * 100}%`, `transition: width 0.3s ease`

### 2.3 Survey Steps

**Step 1 — Learning Preferences (multi-select)**

Question: "How do you prefer to learn new things?"
Subtext: "Select all that apply — this shapes how I'll recommend content to you."

Five options as selectable cards (vertical stack, `gap: 10`):

| ID | Label | Description | Icon |
|----|-------|-------------|------|
| `listen` | Listen & absorb | "I learn best hearing concepts explained conversationally — podcasts, audio, someone walking me through it" | 🎧 |
| `read` | Read & reflect | "I prefer written depth — articles, guides, detailed walkthroughs I can read at my own pace" | 📖 |
| `watch` | Watch & follow | "Show me someone doing it and I'll follow along — video tutorials, screen shares, visual demos" | 👁️ |
| `build` | Build & experiment | "Give me a sandbox and a challenge — I learn by doing, making mistakes, and iterating" | 🛠️ |
| `talk` | Talk it through | "I learn by asking questions in a back-and-forth — conversation, Socratic dialogue, Q&A" | 💬 |

Card styling:
- Default: `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: '14px 18px'`, `cursor: pointer`
- Hover: `borderColor: #38B2AC`, `background: #F0FFFE`
- Selected: `border: 2px solid #38B2AC`, `background: #E6FFFA`
- Icon: `fontSize: 20`, inline left of label
- Label: `fontSize: 14`, `fontWeight: 600`, `color: #1A202C`
- Description: `fontSize: 12`, `color: #718096`, `marginTop: 2`

**Step 2 — Available Platforms (multi-select)**

Question: "Which AI platforms do you have access to?"
Subtext: "I'll only recommend tools you can actually use."

Six platform options as a 2×3 grid (`gridTemplateColumns: '1fr 1fr'`, `gap: 10`):

| ID | Label | Icon |
|----|-------|------|
| `notebooklm` | NotebookLM | 📓 |
| `claude` | Claude | 🟣 |
| `chatgpt` | ChatGPT | 💬 |
| `perplexity` | Perplexity | 🔍 |
| `gemini` | Gemini / Google AI Studio | ✦ |
| `youtube` | YouTube | ▶ |

Same card styling as Step 1.

**Step 3 — Additional Context (optional free text)**

Question: "Anything else I should know about how you learn?"
Subtext: "Optional — but helpful. For example: 'I commute 45 minutes each way and prefer audio during that time' or 'I need short, focused sessions.'"

- Textarea: `minHeight: 80px`, `maxHeight: 160px`, `resize: none`, auto-growing
- `fontSize: 14`, `border: 1px solid #E2E8F0`, `borderRadius: 12`, `padding: '12px 16px'`

**Step 4 — Confirmation**

A summary card showing what was captured:

- "Your learning preferences: Listen & absorb, Build & experiment"
- "Your platforms: Claude, NotebookLM, YouTube"
- Additional context (if provided)

Subtext: "You can update these anytime from the chat using the Edit Profile button."

CTA button: "Start Learning →" — `background: #38B2AC`, `color: #FFFFFF`, `borderRadius: 24`, `padding: '12px 24px'`, `fontSize: 14`, `fontWeight: 700`

### 2.4 Survey Navigation

- "Next →" button (right-aligned) to advance steps. Disabled until at least one option is selected on Steps 1 and 2. Step 3 allows skipping.
- "← Back" button (left-aligned) to go back
- Steps 1 and 2 are required. Step 3 is optional. Step 4 is confirmation.

### 2.5 Survey Submission

On "Start Learning →" click:

1. Write the learner coach profile to the `learner_coach_profiles` table (see §9.1)
2. Transition to the chat interface with a smooth fade
3. The agent's first message is a welcome that acknowledges the profile (see §3.6)

---

## 3. Mode 2 — Chat Interface

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header Bar (48px height)                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Learning Coach          [Edit Profile] [New Chat]   │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Chat Message Area (flex: 1, overflow-y: auto)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  max-width: 760px, margin: 0 auto                    │  │
│  │                                                       │  │
│  │  [Agent message — welcome / greeting]                 │  │
│  │                                                       │  │
│  │  [User message]                                       │  │
│  │                                                       │  │
│  │  [Agent message — with buttons]                       │  │
│  │  [Button row]                                         │  │
│  │                                                       │  │
│  │  [User message — clicked button or free text]         │  │
│  │                                                       │  │
│  │  [Agent message — step-by-step instructions]          │  │
│  │  [Prompt box with copy button]                        │  │
│  │  [Numbered instructions]                              │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Input Bar (fixed bottom)                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Auto-growing textarea]            [Send button ↑]  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

  ┌──────────────────┐
  │  Edit Profile     │  ← Slide-in panel from right (§4)
  │  Side Panel       │
  └──────────────────┘
```

### 3.2 Header Bar

- Height: `48px`
- `background: #FFFFFF`, `borderBottom: 1px solid #E2E8F0`
- `padding: '0 24px'`, `display: flex`, `alignItems: center`, `justifyContent: space-between`

**Left:** "Learning Coach" — `fontSize: 16`, `fontWeight: 700`, `color: #1A202C`, `fontFamily: "'DM Sans', sans-serif"`

**Right (inline, gap: 8):**
- "Edit Profile" button: `background: transparent`, `border: 1px solid #E2E8F0`, `borderRadius: 8`, `padding: '6px 12px'`, `fontSize: 12`, `fontWeight: 600`, `color: #4A5568`. Icon: `UserCog` (lucide, 14px) left of label. Opens side panel (§4).
- "New Chat" button: same styling. Icon: `MessageSquarePlus` (lucide, 14px). Clears conversation history and starts fresh with a greeting message.

### 3.3 Chat Message Area

- `flex: 1`, `overflowY: auto`, `padding: '24px 16px'`
- Messages centred within `maxWidth: 760px`, `margin: '0 auto'`
- Scroll behaviour: auto-scroll to bottom when a new message appears. If user has scrolled up, don't auto-scroll (respect their position).

### 3.4 Message Bubbles

**Agent messages:**
- `background: #F7FAFC`, `borderRadius: '2px 16px 16px 16px'`, `padding: '14px 18px'`
- `border: 1px solid #E2E8F0`
- `fontSize: 14`, `color: #2D3748`, `lineHeight: 1.7`, `fontFamily: "'DM Sans', sans-serif"`
- `maxWidth: '85%'`, left-aligned
- Small "LC" avatar badge to the left: `width: 28px`, `height: 28px`, `borderRadius: '50%'`, `background: #38B2AC`, `color: #FFFFFF`, `fontSize: 11`, `fontWeight: 700`, `display: flex`, `alignItems: center`, `justifyContent: center`
- `marginBottom: 16` between messages

**User messages:**
- `background: #1A202C`, `color: #FFFFFF`, `borderRadius: '16px 2px 16px 16px'`, `padding: '12px 18px'`
- `fontSize: 14`, `lineHeight: 1.6`
- `maxWidth: '75%'`, right-aligned (`marginLeft: auto`)
- `marginBottom: 16`

**Typing indicator (while waiting for agent response):**
- Same shape as agent message bubble, but contains three animated dots
- Each dot: `width: 6px`, `height: 6px`, `borderRadius: '50%'`, `background: #A0AEC0`
- Animation: staggered bounce (`ppTypingDot`) with 200ms delay between dots

```css
@keyframes ppTypingDot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-6px); opacity: 1; }
}
```

### 3.5 Rich Content Rendering in Agent Messages

Agent messages are not plain text — they contain structured content that must be rendered with appropriate formatting. The API returns messages with content blocks (see §7.3), and the frontend renders each block type differently.

**Text blocks:** Standard paragraph text with markdown-style formatting. Support **bold**, *italic*, and line breaks.

**Prompt blocks:** Rendered in the E-Learning prompt box style:

```jsx
{
  background: '#F7FAFC',
  border: '1px solid #E2E8F0',
  borderLeft: '3px solid #38B2AC',
  borderRadius: '0 8px 8px 0',
  padding: '12px 16px',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  fontStyle: 'italic',
  color: '#2D3748',
  lineHeight: 1.6,
  position: 'relative',
  margin: '12px 0',
}
```

With a copy button: `position: absolute`, `top: 8`, `right: 8`, `fontSize: 11`, `color: #A0AEC0`. Copies prompt text. Shows "Copied ✓" for 2000ms.

**Instruction blocks:** Numbered steps rendered as an ordered list:

- `fontSize: 13`, `color: #4A5568`, `lineHeight: 1.7`
- Each step: `padding: '4px 0'`, `paddingLeft: 24`
- Step number: `fontWeight: 600`, `color: #1A202C`

**Section headers:** Uppercase labels within the message:

- `fontSize: 11`, `fontWeight: 700`, `color: #38B2AC`, `textTransform: uppercase`, `letterSpacing: '0.06em'`, `marginTop: 16`, `marginBottom: 6`

**Platform badges:** Inline pills showing the recommended platform:

- `display: inline-flex`, `alignItems: center`, `gap: 4`
- `background: #E6FFFA`, `border: 1px solid #B2DFDB`, `borderRadius: 16`, `padding: '3px 10px'`
- `fontSize: 11`, `fontWeight: 600`, `color: #1A7A76`
- Platform icon (12px) inline left of name

### 3.6 Button Responses

When the agent presents the user with choices, the buttons render below the agent's message bubble. Buttons are **not part of the bubble** — they sit in a dedicated row below it.

**Button row:**
- `display: flex`, `flexWrap: wrap`, `gap: 8`, `marginTop: 8`, `marginBottom: 16`, `maxWidth: '85%'`

**Each button:**
- `background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 20`, `padding: '8px 16px'`
- `fontSize: 13`, `fontWeight: 500`, `color: #2D3748`, `cursor: pointer`
- `fontFamily: "'DM Sans', sans-serif"`
- Hover: `borderColor: #38B2AC`, `background: #F0FFFE`, `color: #1A7A76`
- Active: brief press animation (`transform: scale(0.97)`)

**On click:**
- The button label appears as a user message in the chat
- The button row disappears (buttons are consumed — they don't persist)
- The agent receives the button label as the user's next message and continues the conversation

**The user can always type instead.** The input bar is never disabled when buttons are shown. If the user types and sends a message while buttons are visible, the buttons disappear and the typed message is sent instead.

### 3.7 Initial Greeting Message

When the chat loads (after survey or on returning visit), the agent sends an opening message. This is **not** an API call — it's a locally generated message that incorporates the learner profile.

**First time (immediately after survey):**

> "Welcome! I've got your learning profile set up. I know you prefer to learn by **[preferences]**, and you have access to **[platforms]**. Whenever you're stuck on something or want to go deeper on a topic from your courses, just tell me what you're trying to learn and I'll help you figure out the best way to approach it."

**Returning visit:**

> "Welcome back, **[firstName]**. What would you like to learn today?"

If the user's current level is known from `AppContext`:

> "Welcome back, **[firstName]**. You're currently on Level [N] — [levelName]. What would you like to work on?"

### 3.8 Input Bar

- Fixed to the bottom of the page
- `background: #FFFFFF`, `borderTop: 1px solid #E2E8F0`, `padding: '12px 16px'`
- Inner container: `maxWidth: 760px`, `margin: '0 auto'`, `display: flex`, `gap: 8`, `alignItems: flex-end`

**Textarea:**
- `flex: 1`, `minHeight: 40px`, `maxHeight: 160px`, `resize: none`, auto-growing
- `border: 1px solid #E2E8F0`, `borderRadius: 20`, `padding: '10px 16px'`
- `fontSize: 14`, `fontFamily: "'DM Sans', sans-serif"`, `lineHeight: 1.5`
- Focus: `borderColor: #38B2AC`, `boxShadow: '0 0 0 3px rgba(56, 178, 172, 0.15)'`
- Placeholder: "Describe what you'd like to learn..."

**Send button:**
- `width: 36px`, `height: 36px`, `borderRadius: '50%'`, `background: #38B2AC`, `border: none`
- Icon: `ArrowUp` (lucide, 18px, white)
- Disabled state (empty textarea): `background: #E2E8F0`, `cursor: not-allowed`
- On click or Enter key: sends the message

---

## 4. Edit Profile Side Panel

### 4.1 Trigger

Clicking "Edit Profile" in the header bar slides the panel in from the right.

### 4.2 Layout

- `position: fixed`, `top: 0`, `right: 0`, `width: 380px`, `height: 100vh`
- `background: #FFFFFF`, `borderLeft: 1px solid #E2E8F0`, `boxShadow: '-4px 0 24px rgba(0,0,0,0.06)'`
- `zIndex: 40`
- Slide-in animation: `transform: translateX(100%) → translateX(0)`, `transition: transform 0.25s ease`
- Backdrop: `position: fixed`, full screen, `background: rgba(0,0,0,0.15)`, click to close

### 4.3 Content

**Header:** "Your Learning Profile" — `fontSize: 16`, `fontWeight: 700`, `padding: '20px 24px'`, `borderBottom: 1px solid #E2E8F0`. Close button (X) right-aligned.

**Body** (`padding: '20px 24px'`, `overflowY: auto`):

Each field from the survey is shown as an editable section:

**Learning Preferences:**
- Label: "HOW YOU PREFER TO LEARN" — section label style
- The five preference chips (same as survey), showing current selections
- Click to toggle

**Available Platforms:**
- Label: "PLATFORMS YOU USE"
- The six platform chips, showing current selections
- Click to toggle

**Additional Context:**
- Label: "ADDITIONAL CONTEXT"
- The free-text textarea, pre-populated with current value

**Footer:** "Save Changes" button — `background: #38B2AC`, `color: #FFFFFF`, `borderRadius: 24`, `padding: '10px 20px'`, full width. Disabled until changes are made. On save: updates the database, closes the panel, and optionally shows a toast "Profile updated."

---

## 5. Conversation Flow Architecture

The agent follows a **guided conversation arc** with four phases. Each phase has a structured path (buttons) and an open path (free text). The user can derail at any point and the agent adapts gracefully.

### 5.1 Phase 1 — Topic Discovery

The user describes what they want to learn in natural language. No buttons — this is inherently open-ended.

The agent processes the response and asks a clarifying question to sharpen the topic. It uses its knowledge of the platform's courses to contextualise: *"That maps to the Context Engineering topic in Level 1 — specifically the three context layers. What's tripping you up — the concept itself, or knowing when to apply each approach in practice?"*

The agent should reference the platform's actual course content when relevant — topic names, module structures, e-learning concepts — so the learner feels the recommendations are connected to their learning journey, not generic.

### 5.2 Phase 2 — Method Suggestion

Once the topic is clear, the agent suggests a learning method based on the learner profile.

Agent message example: *"Based on how you learn, I'd suggest starting with an audio deep-dive on the three context layers, then following up with a hands-on exercise where you apply each layer to a real task. Does that sound right?"*

**Buttons:** `[Yes, sounds good]` `[I'd prefer something different]`

If "Yes" → Phase 3.
If "No" → Agent asks what they'd prefer, optionally showing preference buttons:
`[Listen to an explanation]` `[Read in depth]` `[Watch a walkthrough]` `[Build something hands-on]` `[Talk it through with me]`

### 5.3 Phase 3 — Tool Recommendation

Agent recommends a specific platform and feature from the learner's available set.

Agent message example: *"For the audio piece, I'd suggest* **NotebookLM** *— specifically the Audio Overview feature. You can upload your learning materials and it'll generate a conversational podcast tailored to the content. For the hands-on exercise,* **Claude** *'s Artifacts would let you build an interactive comparison tool. Want me to walk you through exactly how to do this step by step?"*

**Buttons:** `[Yes, walk me through it]` `[I'd prefer a different tool]`

If "Yes" → Phase 4.
If "No" → Agent lists alternatives from the learner's available platforms.

### 5.4 Phase 4 — Step-by-Step Delivery

The agent generates detailed, structured instructions. This is the richest message in the conversation — it uses the full range of rich content rendering (§3.5):

```
AGENT MESSAGE:

Here's your step-by-step guide:

───── STEP 1 · NotebookLM · Audio Overview · ~15 min ─────

Upload the context engineering module summary into a new notebook
and generate an Audio Overview. The conversational format will help
the three context layers click in a way reading alone often doesn't.

YOUR PROMPT
┌────────────────────────────────────────────────────────┐
│  "Focus on explaining the three context engineering    │
│  layers — inline context, document/file context, and   │  [Copy]
│  persistent project context. Use practical workplace   │
│  examples for each layer. Explain when each layer is   │
│  the right choice and when it's overkill."             │
└────────────────────────────────────────────────────────┘

HOW TO USE THIS
1. Open NotebookLM and create a new notebook
2. Click 'Add source' and paste the prompt above
3. Click 'Audio Overview' in the top toolbar
4. Listen to the generated conversation (~10-15 min)
5. After listening, open the Chat tab and ask follow-up
   questions about anything that wasn't clear

───── STEP 2 · Claude · Artifacts · ~15 min ─────

[... second step ...]

Want me to help with anything else on this topic, or is
there something new you'd like to explore?
```

**Buttons after delivery:** `[This is great, thanks]` `[Can you adjust something?]` `[New topic]`

### 5.5 Phase 5 — Open Follow-Up

After delivering instructions, the conversation stays open. The user can:
- Ask follow-up questions ("What if the podcast is too high-level?")
- Request modifications ("Can you give me a version for ChatGPT instead?")
- Start a new topic entirely
- Close the conversation (navigate away)

---

## 6. Agent Context — What the Agent Knows

The system prompt is constructed from multiple data sources loaded at page mount. This is the critical piece that makes the agent genuinely useful.

### 6.1 Layer 1 — Learner Profile

Loaded from `learner_coach_profiles` table on mount. Injected into every API call.

```
## LEARNER PROFILE
- Name: Joseph
- Learning preferences: Listen & absorb, Build & experiment
- Available platforms: Claude, NotebookLM, YouTube
- Additional context: "I commute 45 minutes each way and prefer audio during that time"
```

### 6.2 Layer 2 — Onboarding Profile & Learning Plan

Loaded from `profiles` and `learning_plans` tables via existing `getProfile()` and `getLatestLearningPlan()` functions. This gives the agent deep context about who the learner is professionally and what their personalised learning journey looks like.

```
## PROFESSIONAL PROFILE
- Name: Joseph
- Role: Consultant
- Function: Consulting
- Seniority: Senior / Lead
- AI Experience: Builder — has created custom prompts, GPTs, or agents
- Ambition: Own AI Processes — design and run automated AI workflows
- Challenge: "I want to build AI-powered tools that my team can reuse but I don't know how to structure the instructions so they work for everyone"
- Goal: "Design a suite of standardised AI agents for my consulting team's most common deliverables"
- Availability: 3-4 hours per week

## PERSONALISED LEARNING PLAN
- Pathway summary: "Your journey focuses on deepening your prompt engineering foundations, then moving quickly into agent design and workflow automation..."
- Level 1 (Fast-track): Project — "Prompt Audit & Blueprint Library"
  - Deliverable: A structured prompt library of 10+ templates for recurring consulting tasks
  - Challenge connection: Directly addresses your need for standardised, reusable prompts
- Level 2 (Full): Project — "Consulting Delivery Agent Suite"
  - Deliverable: 3 custom AI agents for proposal drafting, status updates, and client insights
  - Challenge connection: These are the reusable tools you described wanting to build for your team
- Level 3 (Full): Project — "Automated Client Insight Pipeline"
  - Deliverable: An end-to-end workflow that ingests meeting notes and produces structured client briefs
  [... etc ...]
```

### 6.3 Layer 3 — Platform Course Content

The agent needs to know what's available on the platform so it can reference specific courses, modules, and materials. This is loaded from `data/levelTopics.ts` and `data/topicContent.ts` at build time (compiled into the system prompt constants file, not fetched dynamically).

```
## OXYGY PLATFORM COURSES

### Level 1: AI Fundamentals & Awareness
Topic 1: Prompt Engineering — "From brain dumps to structured, repeatable prompts"
  E-Learning: 13-slide interactive module covering the Prompt Blueprint, RCTF framework, context layers, and the prompting spectrum
  Read: Curated articles on structured prompting and context engineering with guided reflection
  Watch: Videos demonstrating prompt and context engineering in practice
  Practice: Build, test, and refine prompts using the Prompt Playground
  Key concepts taught: Prompt Blueprint (Role, Context, Task, Format, Steps, Checks), RCTF subset, prompting spectrum (brain dump → conversational → structured), modifier techniques (Chain of Thought, Few-Shot, Iterative Refinement)

### Level 2: Applied Capability
Topic 1: From Prompts to Reusable Tools — "Building AI agents that standardise quality, save time, and scale across your team"
  E-Learning: 14-slide interactive module covering the Level 2 shift, three-layer agent model, accountability by design, and team deployment
  Key concepts taught: When to build an agent vs use a prompt, the three-layer agent model (instruction layer, knowledge layer, output layer), accountability features, standardisation principles

[... continues for all levels and topics ...]

### Toolkit Tools Available
- Level 1: Prompt Playground (write, test, refine prompts), Prompt Library (save and organise prompts)
- Level 2: Agent Builder (design custom AI agents with system prompts and accountability)
- Level 3: Workflow Canvas (map end-to-end AI workflows with agent chaining)
- Level 4: App Designer (design web applications with AI-generated PRDs)
- Level 5: AI App Evaluator (evaluate AI application architecture and get implementation scores)
```

### 6.4 Layer 4 — External Platform Feature Registry

The curated registry of what each external AI tool can do for learning (unchanged from PRD v1 §8). This is the agent's knowledge of NotebookLM's features, Claude's Visualiser, ChatGPT's Custom GPTs, etc. — the specific capabilities and instructions for each platform.

### 6.5 Layer 5 — Learning Design Rules

The rules for how to design a learning experience (unchanged from PRD v1 §9.4, Layer 2):

```
## LEARNING DESIGN RULES
1. Start with the learner's PRIMARY preference to build immediate engagement
2. Sequence from passive to active: absorption → understanding → testing → application
3. Always connect recommendations to the learner's real work and stated challenges
4. Reference specific Oxygy course content when the learner's question maps to a covered topic
5. When recommending external tools, explain WHY this tool/feature fits this specific gap
6. Generate prompts that incorporate the learner's specific situation — never generic
7. Keep step-by-step instructions platform-specific: exact button names, exact menu locations
8. Time estimates should be realistic: 10-20 minutes per activity
```

---

## 7. API Architecture

### 7.1 Endpoint

**File:** `api/learning-coach-chat.ts`
**Method:** POST
**Route:** `/api/learning-coach-chat`

### 7.2 Request Body

```typescript
interface LearningCoachChatRequest {
  messages: ChatMessage[];         // Full conversation history
  learnerProfile: LearnerProfile;  // From learner_coach_profiles
  userProfile: UserProfileContext;  // From profiles + learning_plans
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LearnerProfile {
  preferences: string[];
  platforms: string[];
  additionalContext: string;
}

interface UserProfileContext {
  fullName: string;
  role: string;
  function: string;
  seniority: string;
  aiExperience: string;
  ambition: string;
  challenge: string;
  goalDescription: string;
  currentLevel: number;
  learningPlan: {
    pathwaySummary: string;
    levels: Record<string, {
      depth: string;
      projectTitle: string;
      projectDescription: string;
      deliverable: string;
      challengeConnection: string;
    }>;
  } | null;
}
```

### 7.3 Response Shape

```typescript
interface LearningCoachChatResponse {
  content: ContentBlock[];
  buttons?: ButtonOption[];
}

interface ContentBlock {
  type: 'text' | 'prompt' | 'instructions' | 'section_header' | 'platform_badge';
  content: string;          // Text content
  platform?: string;        // For prompt/instructions: which platform
  feature?: string;         // For prompt/instructions: which feature
  timeEstimate?: string;    // For instructions: "~15 min"
}

interface ButtonOption {
  label: string;            // Button display text
  value: string;            // Sent as user message when clicked
}
```

**Critical:** The AI must return structured JSON with content blocks and optional buttons. The frontend parses these blocks and renders each one with the appropriate styling (§3.5). This is what enables rich output — prompt boxes, numbered instructions, section headers — rather than plain text.

### 7.4 System Prompt Structure

```typescript
const SYSTEM_PROMPT = `You are the Learning Coach for OXYGY's AI Centre of Excellence. You help professionals learn AI skills through personalised, conversational guidance.

## YOUR PERSONALITY
- Warm, direct, and practical — like a knowledgeable colleague, not a tutor
- You ask clarifying questions before jumping to recommendations
- You reference the learner's actual situation (their role, challenges, projects) naturally
- You keep messages concise — 2-4 paragraphs max for conversational messages, longer only for step-by-step instructions
- You use the learner's name occasionally but not excessively

## YOUR CONVERSATION FLOW
Follow this arc naturally (don't announce the phases):

1. TOPIC DISCOVERY: Understand what they want to learn. Ask a clarifying question. Reference relevant Oxygy courses if the topic maps to one.

2. METHOD SUGGESTION: Based on their learning preferences, suggest an approach. Offer buttons: [Yes, sounds good] [I'd prefer something different]. If they want something different, offer preference-based buttons.

3. TOOL RECOMMENDATION: Based on the method and their available platforms, recommend a specific platform + feature. Explain WHY this combination fits their gap. Offer buttons: [Yes, walk me through it] [I'd prefer a different tool]

4. STEP-BY-STEP DELIVERY: Generate structured instructions using content blocks:
   - Use "section_header" blocks for step labels (e.g., "STEP 1 · NotebookLM · Audio Overview · ~15 min")
   - Use "text" blocks for activity descriptions
   - Use "prompt" blocks for copy-paste prompts (these render in a special prompt box with a copy button)
   - Use "instructions" blocks for numbered how-to steps
   - Use "platform_badge" blocks for inline platform references
   After delivery, offer buttons: [This is great, thanks] [Can you adjust something?] [New topic]

5. OPEN FOLLOW-UP: Answer follow-up questions, adjust recommendations, or start a new topic.

## BUTTON RULES
- Include buttons in your response when the learner faces a decision point
- Always include 2-3 buttons max
- Buttons should represent genuinely different paths, not just variations of "yes"
- The learner can always type freely instead of clicking a button — don't force button use
- Never include buttons during Phase 1 (topic discovery) — that should be open-ended
- Always include buttons after Phase 2 (method suggestion) and Phase 3 (tool recommendation)

## CONTENT RULES
- When generating prompts, incorporate the learner's specific gap and situation — NEVER generic "teach me about X"
- When giving platform instructions, use exact feature names and menu locations
- Reference Oxygy course content when the topic maps to a specific module — "This connects to the Context Engineering topic in your Level 1 e-learning, specifically the section on the three context layers"
- When recommending a tool, only recommend platforms from the learner's available set
- Time estimates must be realistic: 10-20 minutes per activity
- Be tool-agnostic in teaching language — don't favour one platform over another

## OUTPUT FORMAT
Respond ONLY with valid JSON, no backticks or markdown:
{
  "content": [
    { "type": "text", "content": "Your conversational message here" },
    { "type": "section_header", "content": "STEP 1 · NotebookLM · Audio Overview · ~15 min" },
    { "type": "text", "content": "Activity description..." },
    { "type": "prompt", "content": "The prompt to copy-paste...", "platform": "notebooklm", "feature": "Audio Overview" },
    { "type": "instructions", "content": "1. Open NotebookLM...\\n2. Click 'Add source'...\\n3. ..." }
  ],
  "buttons": [
    { "label": "Yes, sounds good", "value": "Yes, sounds good" },
    { "label": "I'd prefer something different", "value": "I'd prefer something different" }
  ]
}

The "buttons" field is optional — only include it at decision points.
For simple conversational messages, the content array will have just one text block and no buttons.

${LEARNER_PROFILE_CONTEXT}

${USER_PROFILE_AND_LEARNING_PLAN}

${PLATFORM_COURSE_CONTENT}

${EXTERNAL_PLATFORM_FEATURE_REGISTRY}

${LEARNING_DESIGN_RULES}`;
```

### 7.5 Message History Management

The full conversation history is sent with every API call. The frontend maintains the history in React state.

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
```

On send:
1. Append the user message to `messages`
2. Show typing indicator
3. POST to `/api/learning-coach-chat` with `{ messages, learnerProfile, userProfile }`
4. On response: parse the `ContentBlock[]` into a rendered agent message, append to `messages`
5. If `buttons` are present, show them below the message
6. Hide typing indicator

**Context window management:** If the conversation exceeds ~20 messages, trim the oldest messages (keeping the first 2 and the most recent 16) to stay within token limits. The learner profile and course content are always included regardless of trimming.

### 7.6 Session Persistence

The conversation is stored in React state. Additionally, mirror to `localStorage` with key `oxygy_learning_coach_session` so it survives page refreshes within the same browser session.

```typescript
interface StoredSession {
  messages: ChatMessage[];
  updatedAt: number;          // Timestamp
}
```

On mount: check localStorage. If a session exists and is less than 4 hours old, restore it. Otherwise, start fresh with the greeting message.

On "New Chat" click: clear localStorage and reset to greeting.

### 7.7 API Handler Pattern

Follow the existing pattern from other toolkit API endpoints:

- OpenRouter via `fetchWithRetry`
- Model: `process.env.GEMINI_MODEL || 'google/gemini-2.0-flash-001'`
- `temperature: 0.7`
- `response_format: { type: 'json_object' }`
- JSON parsing with backtick stripping
- Error handling with retryable status codes

### 7.8 Loading Experience

While waiting for the agent's response:

1. The typing indicator (three bouncing dots) appears as the first affordance (~0ms delay)
2. If the response takes longer than 4 seconds, a subtle progress label appears below the typing indicator: *"Thinking..."* — `fontSize: 11`, `color: #A0AEC0`, fades in with 300ms transition
3. If the response takes longer than 10 seconds, the label changes to *"Still working on this..."*
4. On response arrival: typing indicator disappears, agent message renders with a quick fade-in (200ms)

This is deliberately simpler than the ProcessingProgress indicator used on toolkit pages. A chat interface with a multi-step progress indicator would feel jarring — the typing dots are the established pattern for conversational AI interfaces.

---

## 8. Data Schema

### 8.1 New Table: `learner_coach_profiles`

```sql
create table if not exists learner_coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferences text[] not null default '{}',        -- ['listen', 'build', ...]
  platforms text[] not null default '{}',           -- ['claude', 'notebooklm', ...]
  additional_context text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table learner_coach_profiles enable row level security;

create policy "Users can read own coach profile"
  on learner_coach_profiles for select using (auth.uid() = user_id);
create policy "Users can insert own coach profile"
  on learner_coach_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own coach profile"
  on learner_coach_profiles for update using (auth.uid() = user_id);
```

### 8.2 TypeScript Interface

```typescript
export interface LearnerCoachProfile {
  id: string;
  userId: string;
  preferences: string[];
  platforms: string[];
  additionalContext: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8.3 Database Functions

Add to `lib/database.ts`:

```typescript
export async function getLearnerCoachProfile(userId: string): Promise<LearnerCoachProfile | null> {
  const { data, error } = await supabase
    .from('learner_coach_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    preferences: data.preferences || [],
    platforms: data.platforms || [],
    additionalContext: data.additional_context || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function upsertLearnerCoachProfile(
  userId: string,
  profile: { preferences: string[]; platforms: string[]; additionalContext: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('learner_coach_profiles')
    .upsert({
      user_id: userId,
      preferences: profile.preferences,
      platforms: profile.platforms,
      additional_context: profile.additionalContext,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  return !error;
}
```

---

## 9. State Architecture

```typescript
// ── Page mode ──
const [coachProfile, setCoachProfile] = useState<LearnerCoachProfile | null>(null);
const [profileLoading, setProfileLoading] = useState(true);
const hasProfile = !!coachProfile;

// ── Survey state (Mode 1) ──
const [surveyStep, setSurveyStep] = useState(1);
const [surveyPreferences, setSurveyPreferences] = useState<string[]>([]);
const [surveyPlatforms, setSurveyPlatforms] = useState<string[]>([]);
const [surveyContext, setSurveyContext] = useState('');

// ── Chat state (Mode 2) ──
const [messages, setMessages] = useState<DisplayMessage[]>([]);
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [activeButtons, setActiveButtons] = useState<ButtonOption[] | null>(null);

// ── Side panel ──
const [editPanelOpen, setEditPanelOpen] = useState(false);
const [editPreferences, setEditPreferences] = useState<string[]>([]);
const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
const [editContext, setEditContext] = useState('');

// ── External data (loaded on mount) ──
const { userProfile } = useAppContext();
const [fullProfile, setFullProfile] = useState<UserProfile | null>(null);
const [learningPlan, setLearningPlan] = useState<PathwayApiResponse | null>(null);

// ── Display message type ──
interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];     // For assistant messages: structured blocks
  text?: string;               // For user messages: plain text
  buttons?: ButtonOption[];    // For assistant messages: optional buttons
  timestamp: number;
}
```

---

## 10. File Structure

### New Files

| File | Purpose |
|------|---------|
| `components/app/toolkit/AppLearningCoach.tsx` | Main page component (survey + chat) |
| `components/app/toolkit/LearningCoachSurvey.tsx` | Survey component (extracted for clarity) |
| `components/app/toolkit/LearningCoachChat.tsx` | Chat interface component |
| `components/app/toolkit/LearningCoachEditPanel.tsx` | Edit profile side panel |
| `components/app/toolkit/ChatMessageBubble.tsx` | Message bubble renderer (handles all content block types) |
| `data/learningCoachContent.ts` | Platform feature registry, preference definitions, platform definitions |
| `constants/learningCoachSystemPrompt.ts` | System prompt builder (assembles all five layers) |
| `api/learning-coach-chat.ts` | Serverless API endpoint |
| `hooks/useLearningCoachApi.ts` | API hook for chat messages |

### Modified Files

| File | Change |
|------|--------|
| `App.tsx` | Add lazy import + route: `path="toolkit/learning-coach"` |
| `components/app/AppSidebar.tsx` | Add "Learning Coach" nav item with `GraduationCap` icon |
| `lib/database.ts` | Add `getLearnerCoachProfile()` and `upsertLearnerCoachProfile()` |
| `supabase/schema.sql` | Add `learner_coach_profiles` table |

---

## 11. CSS Animations

```css
/* Typing indicator dots */
@keyframes ppTypingDot {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-6px); opacity: 1; }
}

/* Slide-in panel */
@keyframes lcSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Message fade-in */
@keyframes lcMessageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Button row fade-in */
@keyframes lcButtonsIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 12. Responsive Behaviour

### Desktop (1200px+)
- Chat messages: `maxWidth: 760px`, centred
- Edit panel: `width: 380px`, slides from right
- Full layout as described

### Tablet (768–1199px)
- Chat messages: `maxWidth: 640px`
- Edit panel: `width: 320px`
- Survey card: `maxWidth: 560px`

### Mobile (<768px)
- Chat messages: `maxWidth: 100%`, `padding: '0 12px'`
- Edit panel: full width (`width: 100vw`), slides from bottom instead of right
- Survey card: full width, `padding: '0 16px'`
- Input bar: `padding: '8px 12px'`
- Header: icons only (no text labels on buttons)

---

## 13. Checklist

### Onboarding Survey
- [ ] Check for `learner_coach_profiles` record on mount
- [ ] 4-step card-based survey with progress bar
- [ ] Learning preferences: 5 options, multi-select, required
- [ ] Available platforms: 6 options, multi-select, required
- [ ] Additional context: optional free text
- [ ] Confirmation step showing summary
- [ ] Save to database on submit
- [ ] Transition to chat interface after submit

### Chat Interface
- [ ] Full-screen layout with minimal header
- [ ] Agent avatar badge (LC, teal circle)
- [ ] User messages: dark navy, right-aligned
- [ ] Agent messages: light grey, left-aligned
- [ ] Rich content rendering: text, prompt boxes (with copy), instructions (numbered), section headers, platform badges
- [ ] Button rows below agent messages at decision points
- [ ] Buttons disappear when clicked or when user types instead
- [ ] Typing indicator (three bouncing dots) during loading
- [ ] Progressive loading labels ("Thinking..." → "Still working on this...")
- [ ] Auto-scroll to new messages (respecting user scroll position)
- [ ] Auto-growing textarea in input bar
- [ ] Send on Enter, Shift+Enter for new line
- [ ] "New Chat" button clears conversation

### Agent Context
- [ ] Learner coach profile injected into system prompt
- [ ] Onboarding profile (role, function, seniority, challenge, ambition, goals) injected
- [ ] Learning plan (pathway summary, per-level projects) injected
- [ ] Platform course content (all topics, modules, key concepts) in system prompt constants
- [ ] External platform feature registry in system prompt constants
- [ ] Learning design rules in system prompt

### Edit Profile Panel
- [ ] Slides from right on "Edit Profile" click
- [ ] Backdrop closes panel on click
- [ ] Pre-populated with current profile values
- [ ] Save updates database and closes panel
- [ ] Toast confirmation on save

### Session Persistence
- [ ] Conversation stored in React state
- [ ] Mirrored to localStorage (`oxygy_learning_coach_session`)
- [ ] Restored on mount if < 4 hours old
- [ ] Cleared on "New Chat"

### Routing & Integration
- [ ] Route: `/app/toolkit/learning-coach` in `App.tsx`
- [ ] Sidebar nav item: "Learning Coach" with `GraduationCap` icon
- [ ] Schema migration for `learner_coach_profiles` table
- [ ] Database functions in `lib/database.ts`

---

## 14. Anti-Patterns

- **No toolkit page shell** — no ToolOverview strip, no step cards, no connectors. This is a chat interface, not a form-to-output tool.
- **No streaming for v1** — non-streaming with typing indicator. Streaming is a future enhancement.
- **No conversation history persistence beyond the session** — conversations are ephemeral. The coach profile is the persistent memory, not transcripts.
- **No learning log for v1** — topic tracking and key insights are a future enhancement once the core chat experience is validated.
- **No generic "AI tutor" responses** — the agent must reference the learner's specific profile, challenges, and available courses. Generic responses are a failure mode.
- **No emoji in the header** — "Learning Coach", not "🎓 Learning Coach"
- **No forced button clicks** — the user can always type freely. Buttons are shortcuts, not constraints.
- **No multi-step progress indicator** — use typing dots for loading. The ProcessingProgress pattern is for toolkit pages, not chat.
- **No marketing language** — this is a workspace, not a landing page.

---

*End of PRD-16 v2.*
