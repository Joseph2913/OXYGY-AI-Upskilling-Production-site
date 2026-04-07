# PRD: Level 1 Artifact — Prompt Engineering Playground

## 1. Overview

### Purpose
This is an interactive, AI-powered tool that serves as a Level 1 showcase artifact within the Oxygy AI Upskilling website. It demonstrates the tangible value of structured prompt engineering by letting users experience the transformation of a raw prompt into a well-engineered one — in real time, powered by a Gemini API backend agent.

It teaches the concept of **"The Prompt Blueprint"** — a 6-part anatomy of an effective prompt — through hands-on interaction rather than passive reading.

### Where It Sits
- Accessed as a "deep dive" artifact from the **Level 1: Fundamentals** section of the main site
- Opens as its own full page (not a modal or overlay)
- A **"← Back to Level 1"** breadcrumb/link sits at the top-left to return users to the main framework page

### Target Audience & Goals
- **External clients (showcase):** Experience firsthand what Oxygy teaches in Level 1. Leaves them thinking, "If this is just Level 1, imagine what Levels 2–5 look like."
- **Internal participants (learning hub):** A practical tool they can return to and use daily. Reinforces the 6-part Prompt Blueprint framework taught in workshops.

### Key Goal
Transform the abstract concept of "write better prompts" into a concrete, visual, interactive experience.

---

## 2. The Prompt Blueprint Framework — 6 Sections

This is the core teaching framework underpinning the entire page. Every output visualization uses these 6 labeled, color-coded sections. The AI agent in the backend is instructed to structure every enhanced prompt into exactly these 6 parts.

| # | Section Name | What It Covers | Color | Hex Code |
|---|---|---|---|---|
| 1 | **Role** | Who the AI should act as — the expertise, perspective, or persona it should adopt | Soft Lavender | `#C3D0F5` |
| 2 | **Context** | The background, situation, constraints, and relevant details the AI needs to understand | Pale Yellow | `#FBE8A6` |
| 3 | **Task** | The specific instruction — what exactly the AI should produce or do | Oxygy Teal | `#38B2AC` |
| 4 | **Format & Structure** | How the output should be organized — length, layout, tone, structure | Mint | `#B2D8F7` |
| 5 | **Steps & Process** | Explicit reasoning steps, sequence, or methodology the AI should follow | Soft Peach | `#FBCEB1` |
| 6 | **Quality Checks** | Validation rules, constraints, things to avoid, accuracy requirements | Ice Blue | `#E6FFFA` |

---

## 3. Content Specification

### 3.1 Page Header

**Breadcrumb:** `← Back to Level 1` — positioned top-left, styled as a text link in medium gray `#718096`, with a left arrow. On hover, text shifts to Oxygy Teal `#38B2AC`.

**Page Title:**
```
Craft Better Prompts, Get Better Results
```
- "Better Prompts" receives the **Oxygy teal underline decoration** (a hand-drawn-style underline beneath those two words, not colored text — the text stays dark navy `#1A202C`)
- Font: Bold (700), 40–48px, dark navy `#1A202C`

**Subtitle:**
```
The difference between a good AI output and a great one starts with how you ask.
Use this tool to see how structured prompting transforms your results —
try enhancing an existing prompt, or build one from scratch.
```
- Font: Regular (400), 16–18px, medium gray `#4A5568`
- Max-width: 600px
- Line-height: 1.7

### 3.2 Mode Switcher

Positioned directly below the subtitle, with `32px` top margin. Two tabs displayed side by side.

**Tab 1:** "Enhance a Prompt" — accompanied by a small sparkle/wand icon (16px, inline before text)
**Tab 2:** "Build from Scratch" — accompanied by a small building-blocks or puzzle-piece icon (16px, inline before text)

**Visual treatment:**
- Tabs are styled as **pill-shaped toggles** inside a shared container with a `1px solid #E2E8F0` border and `border-radius: 30px`
- The container has a light gray `#F7FAFC` background
- The **active tab** has a solid white `#FFFFFF` background, `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`, dark navy `#1A202C` text, and bold weight (600)
- The **inactive tab** has transparent background, medium gray `#718096` text, and regular weight (400)
- On hover of inactive tab: text shifts to dark navy `#1A202C`
- Transition: `all 0.2s ease`
- Each tab has horizontal padding of `24px` and vertical padding of `10px`

**Important design note:** The mode switcher must be visually prominent and unmissable. It should not look like subtle navigation — it should look like a deliberate choice the user is making. The pill-toggle pattern ensures both options are always visible and the user understands there are two distinct experiences available. Consider adding a subtle **pulse animation** on the inactive tab on first page load (a single gentle scale pulse from 1.0 → 1.02 → 1.0 over 1.5s) to draw attention to the fact that a second mode exists.

### 3.3 Mode A: "Enhance a Prompt"

#### Input Area

**Label above textarea:**
```
Paste or type your prompt below
```
- Font: Semi-bold (600), 14px, dark navy `#1A202C`

**Textarea:**
- Width: 100% of content column (max-width `720px`)
- Min-height: `120px`, max-height: `200px` (auto-expands with content)
- `border: 1px solid #E2E8F0`, `border-radius: 12px`
- Padding: `16px`
- Font: Regular (400), 15px, dark navy `#1A202C`
- Placeholder text (in `#A0AEC0`): `"e.g., Help me write a summary of our last team meeting for my manager..."`
- On focus: `border-color: #38B2AC`, subtle `box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1)`

**Pre-loaded example prompts:**
Displayed as **3 clickable pill chips** in a horizontal row above the textarea, with a small label: *"Try an example:"*

| # | Example Prompt Text |
|---|---|
| 1 | "Help me prepare talking points for a stakeholder meeting next week" |
| 2 | "Create a 90-day onboarding plan for a new team member" |
| 3 | "Write an update email about project progress to share with leadership" |

**Pill chip styling:**
- Background: `#F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 20px`
- Padding: `6px 14px`
- Font: Regular (400), 13px, `#4A5568`
- On hover: `border-color: #38B2AC`, `color: #38B2AC`, `background: #E6FFFA`
- On click: Populates the textarea with that prompt text

**CTA Button:**
```
Enhance My Prompt →
```
- Style: Primary Oxygy teal — `background: #38B2AC`, `color: #FFFFFF`, `border-radius: 24px`
- Padding: `12px 28px`
- Font: Semi-bold (600), 15px
- Positioned below the textarea, right-aligned
- On hover: `background: #319795` (slightly darker teal)
- On click: Triggers the Gemini API call, shows a loading state (see Interactions section)
- Disabled state (when textarea is empty): `opacity: 0.5`, `cursor: not-allowed`

### 3.4 Mode B: "Build from Scratch" — Typeform-Style Wizard

#### Wizard Container
When Mode B is active, the input area is replaced by a **single-question-at-a-time wizard** inspired by Typeform. The wizard occupies the same content area as Mode A's textarea.

- Container: `max-width: 720px`, centered
- Each question animates in from the right (or fades in from below) as the user progresses
- A **progress bar** sits at the top of the wizard container:
  - Full width of container
  - Height: `4px`
  - Background track: `#E2E8F0`
  - Fill: Oxygy Teal `#38B2AC`
  - Progresses from 0% to 100% across 7 steps (intro + 6 questions)
  - Smooth transition on fill: `width 0.3s ease`

#### Step 0 — Intro Screen

**Headline:**
```
Let's build your prompt, step by step
```
- Font: Bold (700), 28px, dark navy `#1A202C`

**Body:**
```
Answer a few quick questions and we'll assemble a structured,
optimized prompt for you. Skip any question that doesn't apply.
```
- Font: Regular (400), 16px, `#4A5568`

**Pre-loaded example button:**
Below the body text, a secondary link styled as text:
```
Or try a pre-built example →
```
- Font: Regular (400), 14px, Oxygy Teal `#38B2AC`
- On click: Opens a small dropdown/popover with 3 example scenarios (see Section 8 for example data). Selecting one auto-fills all 6 questions and skips directly to the output.

**CTA:**
```
Let's Go →
```
- Primary teal pill button (same styling as "Enhance My Prompt")

#### Steps 1–6: The Six Questions

Each step follows an identical layout structure:

**Layout per step:**
- **Step indicator:** Small text at top-left — e.g., "Question 1 of 6" — font: Regular (400), 12px, `#A0AEC0`
- **Section color dot:** A small filled circle (12px diameter) in the corresponding Prompt Blueprint color, displayed inline next to the step indicator. This visually connects each question to the output section it will populate.
- **Question headline:** Bold (700), 22–24px, dark navy `#1A202C`
- **Helper text:** Regular (400), 14px, `#718096` — sits directly below the headline
- **Input area:** Textarea or chip selector depending on the question (see below)
- **Microphone button:** Positioned at the top-right corner of every text input field — a circular button (36px diameter) with a mic icon (16px). Default state: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, icon in `#718096`. Active/recording state: `background: #38B2AC`, icon in `#FFFFFF`, with a subtle pulse animation on the border. On click: Activates the browser's Web Speech API for voice-to-text dictation into the corresponding field.
- **Navigation buttons (bottom of each step):**
  - Left: `← Back` — text link style, `#718096`, no background
  - Center: `Skip →` — text link style, `#A0AEC0`. On hover: `#718096`
  - Right: `Next →` — primary teal pill button

**Transitions between steps:**
- Outgoing question slides left and fades out (`transform: translateX(-30px)`, `opacity: 0`, duration `0.25s`)
- Incoming question slides in from right and fades in (`transform: translateX(30px) → translateX(0)`, `opacity: 0 → 1`, duration `0.3s`, with `0.1s` delay)

---

**Step 1 — Role** (maps to Soft Lavender `#C3D0F5`)

- Question: `"Who should the AI act as?"`
- Helper text: `"Describe the expertise or perspective you need — e.g., a senior consultant, a data analyst, a project manager, a communications lead"`
- Input: Textarea, 2 lines min-height
- Placeholder: `"e.g., Act as an experienced change management consultant who specializes in digital transformation..."`

---

**Step 2 — Context** (maps to Pale Yellow `#FBE8A6`)

- Question: `"What's the situation?"`
- Helper text: `"Give the AI the background it needs — what's happening, who's involved, what constraints exist"`
- Input: Textarea, 3 lines min-height
- Placeholder: `"e.g., We're halfway through a 6-month transformation project. The team has completed the discovery phase and is moving into design..."`

---

**Step 3 — Task** (maps to Oxygy Teal `#38B2AC`)

- Question: `"What exactly should the AI produce?"`
- Helper text: `"Be specific about the deliverable — what format, what content, what purpose"`
- Input: Textarea, 2 lines min-height
- Placeholder: `"e.g., Write a concise project status update email that summarizes progress, highlights risks, and outlines next steps..."`

---

**Step 4 — Format & Structure** (maps to Mint `#B2D8F7`)

- Question: `"How should the output be structured?"`
- Helper text: `"Select any that apply, or describe your preferred format"`
- Input: **Multi-select chip grid** + a textarea for custom instructions
- Chips (pre-defined, user can select multiple):
  - `Bullet points`
  - `Numbered list`
  - `Table`
  - `Short paragraph`
  - `Detailed report`
  - `Email format`
  - `Slide content`
  - `Executive summary`
- Chip styling:
  - Default: `background: #F7FAFC`, `border: 1px solid #E2E8F0`, `border-radius: 20px`, padding `6px 14px`, font 13px `#4A5568`
  - Selected: `background: #B2D8F7`, `border-color: #38B2AC`, `color: #1A202C`, font-weight 600
  - On hover (unselected): `border-color: #38B2AC`
- Below chips: Small textarea (1–2 lines) with placeholder: `"Any other formatting preferences? e.g., Keep it under 300 words, use professional tone..."`

---

**Step 5 — Steps & Process** (maps to Soft Peach `#FBCEB1`)

- Question: `"Should the AI follow specific steps?"`
- Helper text: `"Describe a sequence or process the AI should work through — or leave blank if the AI should decide"`
- Input: Textarea, 3 lines min-height
- Placeholder: `"e.g., First, review the key milestones achieved. Then, identify the top 3 risks. Finally, propose mitigation actions for each risk..."`

---

**Step 6 — Quality Checks** (maps to Ice Blue `#E6FFFA`)

- Question: `"What should the AI watch out for?"`
- Helper text: `"Add any constraints, things to avoid, or quality standards"`
- Input: **Multi-select chip grid** + textarea for custom constraints
- Chips:
  - `Keep it concise`
  - `Avoid jargon`
  - `Be specific with data`
  - `Include examples`
  - `Professional tone`
  - `Friendly tone`
  - `Cite sources`
  - `No assumptions`
- Chip styling: Same as Step 4, but selected state uses `background: #E6FFFA`, `border-color: #38B2AC`
- Below chips: Textarea with placeholder: `"Any other quality requirements? e.g., Don't reference confidential client names, keep language accessible to non-technical readers..."`

---

#### Step 7 — Confirmation / Generate

After the final question, show a brief summary screen:

**Headline:**
```
Ready to generate your prompt
```

**Body:**
A compact summary showing which questions were answered vs. skipped, using colored dots:
- Answered: Filled circle in the section's color
- Skipped: Hollow circle with a light gray `#E2E8F0` border

Example: ● ● ● ● ○ ● (meaning Q5 was skipped)

**CTA:**
```
Generate My Prompt →
```
- Primary teal pill button
- On click: Triggers the Gemini API call

---

## 4. Output Area — Shared Between Mode A and Mode B

### 4.1 Layout

The output area appears **below the input area**, separated by `48px` of vertical space and a thin `1px solid #E2E8F0` horizontal divider.

**Initial state (before any prompt is generated):** The output area is **not visible**. It appears with a smooth slide-down + fade-in animation (`0.4s ease`) once the API returns a result.

### 4.2 Before/After Comparison (Mode A only)

When triggered from Mode A ("Enhance a Prompt"), the output area shows **both** the original and enhanced prompt:

**Original prompt section:**
- Label: `"Your original prompt"` — font: Semi-bold (600), 12px, `#A0AEC0`, uppercase, letter-spacing `0.05em`
- The original prompt text displayed in a lightly styled block:
  - `background: #F7FAFC`
  - `border: 1px solid #E2E8F0`
  - `border-radius: 8px`
  - Padding: `12px 16px`
  - Font: Regular (400), 14px, `#718096`
  - Max-height: `80px`, overflow hidden with a "show more" toggle if needed

**Arrow/transition visual:**
A downward arrow icon (or a small label: `"Enhanced to ↓"`) centered between the original and enhanced sections. Keep it subtle — `#A0AEC0`, 14px.

### 4.3 Enhanced Prompt Display (Shared between Mode A and Mode B)

**Section label:**
- Mode A: `"Your enhanced prompt"` — font: Semi-bold (600), 12px, `#A0AEC0`, uppercase, letter-spacing `0.05em`
- Mode B: `"Your generated prompt"` — same styling

**The enhanced prompt is displayed as 6 stacked, color-coded blocks:**

Each block follows this structure:
```
┌─────────────────────────────────────────────┐
│ [COLOR DOT] SECTION LABEL          [i icon] │
│                                             │
│ Prompt text for this section goes here.     │
│ It can be multiple lines long.              │
│                                             │
└─────────────────────────────────────────────┘
```

**Block styling:**
- Width: 100% of content column (max-width `720px`)
- `border-radius: 10px`
- `border-left: 4px solid [SECTION COLOR]` — the thick left border uses the section's designated color
- `background: [SECTION COLOR at 15% opacity]` — very light tint of the section color
- Padding: `16px 20px`
- Margin-bottom: `12px` between blocks
- On hover: subtle `box-shadow: 0 2px 8px rgba(0,0,0,0.06)` — provides a gentle lift effect

**Inside each block:**
- **Section label pill:** Displayed top-left. A small pill/badge with:
  - Background: the section's color at full opacity
  - Text: section name in dark navy `#1A202C`, font: Semi-bold (600), 11px, uppercase, letter-spacing `0.04em`
  - Padding: `3px 10px`, `border-radius: 10px`
  - A small filled circle (8px) in the section color appears before the text inside the pill
- **Info icon (ⓘ):** Positioned top-right of the block. 16px, `#A0AEC0`. On hover: shows a tooltip with the section's description (from the Prompt Blueprint table in Section 2). Tooltip: dark navy `#1A202C` background, white text, `border-radius: 6px`, padding `8px 12px`, max-width `240px`, font 13px.
- **Prompt text:** Font: Regular (400), 15px, `#2D3748`. Line-height `1.7`. Left-aligned.

**Block appearance animation:**
When the output first loads, the 6 blocks appear in sequence — each block fades in and slides up slightly (`translateY(10px) → translateY(0)`, `opacity 0 → 1`) with a stagger delay of `0.1s` between each block. Total animation duration: ~`0.8s`.

### 4.4 Prompt Blueprint Legend

Displayed below the 6 blocks as a compact horizontal legend strip:

**Label:** `"The Prompt Blueprint"` — font: Semi-bold (600), 13px, dark navy `#1A202C`

**Legend items:** 6 items displayed in a single horizontal row (wrapping to 2 rows on mobile):
Each item: `[colored dot 10px] Section Name` — font: Regular (400), 12px, `#718096`

Spacing: `20px` between items.

### 4.5 Action Buttons (below the output)

A horizontal button row below the legend, right-aligned:

**Primary:** `Copy Full Prompt` — teal pill button (`background: #38B2AC`, white text, `border-radius: 24px`, padding `10px 22px`, font 14px semi-bold). On click: copies the full enhanced prompt as plain text (without section labels) to clipboard. Shows a brief "Copied ✓" toast notification.

**Secondary:** `Try Another` — bordered pill button (`background: transparent`, `border: 1px solid #2D3748`, dark navy text, `border-radius: 24px`, padding `10px 22px`, font 14px). On click: scrolls back up to the input area, clears the current input and output, resets to a fresh state.

---

## 5. Interactions & Animations

### 5.1 Mode Switching
- Clicking the inactive tab in the mode switcher swaps the content area below
- Transition: The current mode's content fades out (`opacity 0`, `0.2s`), then the new mode's content fades in (`opacity 1`, `0.25s`)
- If the user has already generated an output in Mode A and switches to Mode B (or vice versa), the output area is hidden and only reappears when a new generation is triggered
- The mode switcher does **not** scroll — if the user has scrolled down to the output, switching modes should smooth-scroll them back up to the input area

### 5.2 Loading State (API call in progress)
When the user clicks "Enhance My Prompt" or "Generate My Prompt":
1. The CTA button changes to a **loading state**: text changes to `"Enhancing..."` or `"Generating..."`, a small spinner (16px, white) appears inline before the text, button becomes non-clickable (`pointer-events: none`, `opacity: 0.8`)
2. Below the input area (where the output will appear), show a **skeleton loading visualization**: 6 rectangular placeholder blocks stacked vertically, each with:
   - `background: #F7FAFC`
   - Animated shimmer effect (a light gradient sweeping left to right, `1.5s` infinite loop)
   - Heights matching roughly what the output blocks will be (~60–80px each)
   - Left borders in the correct section colors (so the user can already see the 6-part structure forming)
3. Once the API returns, the skeleton blocks are replaced by the real output blocks with the staggered fade-in animation described in Section 4.3

### 5.3 Typeform Wizard Keyboard Navigation
- **Enter key** advances to the next question (same as clicking "Next →")
- **Shift+Enter** creates a new line within a textarea (standard behavior)
- **Tab** key does NOT advance questions — it moves focus normally within the current step
- **Escape** key is equivalent to "Skip →"

### 5.4 Voice Input (Microphone)
- Browser's **Web Speech API** (`SpeechRecognition`) is used for voice-to-text
- On clicking the mic button: Request microphone permission (if not already granted)
- While recording: The mic button pulses with a teal glow (`box-shadow: 0 0 0 4px rgba(56, 178, 172, 0.3)`, pulsing at `1s` intervals). A small `"Listening..."` label appears below the button in `#38B2AC`, 12px.
- Speech-to-text result is appended to the current textarea content (does not replace)
- On clicking the mic button again (or after a 3-second silence timeout): Recording stops, mic returns to default state
- **Fallback:** If the browser does not support Web Speech API, the mic button is hidden entirely (do not show a disabled state — just remove it)

### 5.5 Pre-loaded Examples
- In Mode A: Clicking an example pill populates the textarea immediately, with a brief highlight flash on the textarea (`background: #E6FFFA` for `0.3s`, then back to white)
- In Mode B: Clicking "Or try a pre-built example →" opens a small popover with 3 example cards. Clicking one triggers the API call directly (bypassing the wizard entirely) and shows the output with a note: `"Generated from example: [example name]"`

### 5.6 Copy to Clipboard
- On clicking "Copy Full Prompt": A small toast notification appears at the bottom-center of the viewport
- Toast: `background: #1A202C`, `color: #FFFFFF`, `border-radius: 8px`, padding `10px 20px`, text: `"Prompt copied to clipboard ✓"`, font 14px
- Toast auto-dismisses after `2.5s` with a fade-out

---

## 6. Visual Design Specification

### 6.1 Page Background
- `#FFFFFF` (white) for the main content area
- No alternating section backgrounds on this page — it's a single focused tool

### 6.2 Typography (Summary)

| Element | Font Weight | Size | Color | Notes |
|---|---|---|---|---|
| Page title | 700 (Bold) | 40–48px | `#1A202C` | "Better Prompts" gets teal underline |
| Page subtitle | 400 (Regular) | 16–18px | `#4A5568` | Max-width 600px |
| Mode tab (active) | 600 (Semi-bold) | 15px | `#1A202C` | — |
| Mode tab (inactive) | 400 (Regular) | 15px | `#718096` | — |
| Input label | 600 (Semi-bold) | 14px | `#1A202C` | — |
| Textarea text | 400 (Regular) | 15px | `#1A202C` | — |
| Textarea placeholder | 400 (Regular) | 15px | `#A0AEC0` | — |
| Example pill chip | 400 (Regular) | 13px | `#4A5568` | — |
| Wizard question headline | 700 (Bold) | 22–24px | `#1A202C` | — |
| Wizard helper text | 400 (Regular) | 14px | `#718096` | — |
| Wizard step indicator | 400 (Regular) | 12px | `#A0AEC0` | — |
| Output section label | 600 (Semi-bold) | 12px | `#A0AEC0` | Uppercase, letter-spacing 0.05em |
| Output prompt text | 400 (Regular) | 15px | `#2D3748` | Line-height 1.7 |
| Section pill badge | 600 (Semi-bold) | 11px | `#1A202C` | Uppercase |
| Button primary | 600 (Semi-bold) | 15px | `#FFFFFF` | — |
| Button secondary | 400 (Regular) | 14px | `#2D3748` | — |

### 6.3 Font Family
Use **DM Sans** from Google Fonts (or Outfit / Plus Jakarta Sans as fallbacks). Never Inter, Roboto, or Arial.

### 6.4 Spacing
- Page horizontal padding: `24px` on mobile, `48px` on tablet, auto-centered `max-width: 800px` on desktop
- Content column max-width: `720px` for all input and output elements
- Vertical spacing between major sections: `48px`
- Vertical spacing between blocks within a section: `12px`

### 6.5 Borders
- All card/block borders: `1px solid #E2E8F0` unless otherwise specified
- Border radius: `12px` for input containers, `10px` for output blocks, `20–24px` for pills and buttons

### 6.6 Icons
- Use **Lucide Icons** (open source, consistent line-weight style)
- Icon size: `16px` inline with text, `20px` for standalone buttons
- Icon color: Matches the text color of its context (e.g., `#718096` for helper contexts, `#FFFFFF` inside teal buttons)
- Specific icons needed:
  - Sparkle/wand (Mode A tab)
  - Building blocks or puzzle piece (Mode B tab)
  - Microphone (voice input)
  - Info circle (tooltip trigger on output blocks)
  - Copy (copy to clipboard button)
  - Arrow left (back navigation)
  - Arrow right (next/CTA arrows)
  - Check (clipboard success toast)

---

## 7. Responsive Behavior

### 7.1 Desktop (1200px+)
- Content centered within `max-width: 800px` container
- All elements as described above
- Wizard question + navigation buttons comfortably fit in a single view without scrolling
- Output blocks display at full width within the `720px` content column
- Legend displays as a single horizontal row

### 7.2 Tablet (768–1199px)
- Same layout as desktop — `max-width: 800px` still fits comfortably
- Horizontal padding reduces to `32px`
- No layout changes needed — this page is inherently single-column

### 7.3 Mobile (<768px)
- Horizontal padding: `16px`
- Page title: Scales down to `32–36px`
- Mode switcher tabs: Stack vertically if they don't fit horizontally (but they likely will at this size — test). If stacked, each tab becomes a full-width block with `8px` gap between them.
- Wizard questions: Same layout, but textarea fields take full width
- Multi-select chips (Steps 4 and 6): Wrap into 2 columns instead of flowing freely
- Output blocks: Full width, same structure. Left border remains `4px`.
- Legend: Wraps into 2 rows of 3 items each
- "Copy Full Prompt" and "Try Another" buttons: Stack vertically, each full-width, `8px` gap
- Microphone button: Remains at the same position (top-right of textarea). Ensure touch target is at least `44px`.
- Pre-loaded example pills (Mode A): Wrap to new lines as needed. Consider reducing to 2 examples on very small screens.

---

## 8. Content Data — Pre-loaded Examples

### 8.1 Mode A: Example Prompts (3)

These populate the textarea when clicked:

**Example 1:**
```
Help me prepare talking points for a stakeholder meeting next week
```

**Example 2:**
```
Create a 90-day onboarding plan for a new team member
```

**Example 3:**
```
Write an update email about project progress to share with leadership
```

### 8.2 Mode B: Pre-built Example Scenarios (3)

When a user clicks "Or try a pre-built example →" on the wizard intro screen, they see these 3 options:

**Example A: "Meeting Preparation"**
Pre-fills:
- Role: "Act as a senior facilitator who specializes in running efficient, outcome-driven meetings"
- Context: "We have a 1-hour meeting scheduled with cross-functional team leads to review progress on a strategic initiative. Some attendees are skeptical about the current direction."
- Task: "Prepare a structured agenda with talking points for each section, including 3 discussion prompts to surface concerns constructively"
- Format: "Bullet points" chip selected + custom text: "Keep the agenda to one page, include time allocations for each section"
- Steps: "Start with a brief recap of decisions made so far. Then address each workstream's progress. End with an open discussion section and clear next steps."
- Quality Checks: "Professional tone" chip selected + custom text: "Avoid making assumptions about attendees' positions. Keep language neutral and inclusive."

**Example B: "Training Plan"**
Pre-fills:
- Role: "Act as a learning and development specialist with experience designing practical upskilling programs"
- Context: "A team of 15 people with mixed experience levels needs to develop foundational skills in a new area. The timeline is 90 days and the budget is limited, so most learning should be self-directed with periodic group sessions."
- Task: "Create a structured 90-day learning plan broken into 3 phases (30 days each) with specific milestones, recommended resources, and a group session outline for each phase"
- Format: "Table" chip + "Detailed report" chip selected
- Steps: "Phase 1 should focus on awareness and vocabulary. Phase 2 on hands-on practice with guided exercises. Phase 3 on independent application with peer review."
- Quality Checks: "Avoid jargon" chip + "Include examples" chip selected + custom text: "Make sure the plan is realistic for people who are also managing their regular workload."

**Example C: "Stakeholder Communication"**
Pre-fills:
- Role: "Act as a communications advisor experienced in drafting clear, concise updates for senior audiences"
- Context: "A 6-month project is at the halfway point. The team has completed the discovery and design phases. There are 2 risks flagged (resource availability and timeline pressure) but overall the project is on track."
- Task: "Write a project status update email that summarizes progress, highlights the risks with proposed mitigations, and outlines the plan for the next 3 months"
- Format: "Email format" chip selected + custom text: "Keep it under 400 words. Use a confident but transparent tone."
- Steps: "Open with a 1-sentence summary of overall status. Then cover key achievements. Then address risks directly with what's being done about them. Close with next milestones and any asks."
- Quality Checks: "Keep it concise" chip + "Professional tone" chip selected + custom text: "Don't sugarcoat the risks — leadership prefers transparency. Avoid generic phrases like 'things are going well.'"

---

## 9. AI Agent Specification — Gemini API Backend

### 9.1 API Configuration

- **API:** Google Gemini API (use the `gemini-2.0-flash` model for speed, or `gemini-2.5-pro` for higher quality — developer should make this configurable via environment variable)
- **Authentication:** API key stored as an environment variable (`GEMINI_API_KEY`), never exposed to the frontend
- **Endpoint:** The frontend sends the user's input to a backend endpoint (e.g., `/api/enhance-prompt`), which then calls the Gemini API and returns the structured result
- **Response format:** The Gemini API should be instructed to return a JSON object (see below)

### 9.2 System Prompt for the AI Agent

The following system prompt should be sent with every Gemini API call. This is the "Prompt Engineering Coach" agent:

```
You are the Oxygy Prompt Engineering Coach — an expert in transforming raw, unstructured prompts into well-engineered, structured prompts that produce dramatically better AI outputs.

Your job is to take a user's input and produce an enhanced prompt structured into exactly 6 sections. These 6 sections are called "The Prompt Blueprint":

1. ROLE — Define who the AI should act as. Specify the expertise, perspective, seniority level, and domain knowledge the AI should adopt. Be specific (not just "act as an expert" but "act as a senior change management consultant with 15 years of experience in digital transformation for large enterprises").

2. CONTEXT — Provide the background information the AI needs. Include the situation, environment, constraints, stakeholders involved, timeline, and any relevant details that shape the response. Infer reasonable context from the user's input even if they didn't provide much.

3. TASK — State the specific instruction clearly and precisely. What exactly should the AI produce? Be explicit about the deliverable (e.g., "Write a 500-word email" not "Help me with an email"). If the user was vague, sharpen the task into something concrete and actionable.

4. FORMAT & STRUCTURE — Specify how the output should be organized. Include guidance on length, layout (bullets, tables, paragraphs, numbered lists), tone (formal, conversational, technical), and any structural requirements (e.g., "Include an executive summary at the top").

5. STEPS & PROCESS — Outline the explicit reasoning steps or methodology the AI should follow. Break down the task into a logical sequence (e.g., "First, analyze X. Then, compare with Y. Finally, recommend Z with supporting evidence"). This guides the AI to think systematically rather than jumping to conclusions.

6. QUALITY CHECKS — Define validation rules, constraints, and things the AI should avoid. Include accuracy requirements, tone guardrails, things to exclude, assumptions to avoid, and any quality standards (e.g., "Do not make up statistics. Cite specific examples where possible. Avoid generic corporate language.").

RULES FOR YOUR OUTPUT:

- You must ALWAYS produce all 6 sections, even if the user's input is minimal. Use reasonable inference to fill in sections the user didn't address.
- Each section should be substantive — at least 1-2 sentences, ideally 2-4 sentences.
- Write in a clear, professional, confident tone.
- Do NOT repeat the user's exact words — enhance, expand, and professionalize their intent.
- Do NOT add preamble, commentary, or explanation outside of the 6 sections. Just return the structured prompt.
- If the user's input is very short or vague (e.g., "help me write an email"), make reasonable assumptions and note them within the Context section (e.g., "Assuming this is a professional context...").

You must respond in the following JSON format ONLY — no markdown, no extra text:

{
  "role": "The enhanced Role section text",
  "context": "The enhanced Context section text",
  "task": "The enhanced Task section text",
  "format": "The enhanced Format & Structure section text",
  "steps": "The enhanced Steps & Process section text",
  "quality": "The enhanced Quality Checks section text"
}
```

### 9.3 Input Handling

**For Mode A (Enhance a Prompt):**
Send the user's raw prompt as a single user message:
```json
{
  "user_message": "The user's raw prompt text goes here"
}
```

**For Mode B (Build from Scratch):**
Assemble the questionnaire answers into a structured user message:
```json
{
  "user_message": "The user wants to build a prompt with the following inputs:\n\nRole: [Q1 answer or 'Not specified']\nContext: [Q2 answer or 'Not specified']\nTask: [Q3 answer or 'Not specified']\nFormat preferences: [Q4 chips + custom text, or 'Not specified']\nSteps: [Q5 answer or 'Not specified']\nQuality constraints: [Q6 chips + custom text, or 'Not specified']\n\nPlease enhance and expand each section into a polished, comprehensive prompt following The Prompt Blueprint framework."
}
```

For skipped questions, send `"Not specified"` — the system prompt instructs the agent to infer reasonable content for missing sections.

### 9.4 Response Parsing

The frontend should:
1. Parse the JSON response from the API
2. Map each key to its corresponding Prompt Blueprint section and color
3. Render the 6 color-coded blocks as specified in Section 4.3
4. If the API returns an error or the response doesn't parse as valid JSON, show a friendly error message: `"Something went wrong generating your prompt. Please try again."` in a subtle red-tinted box (`background: #FFF5F5`, `border: 1px solid #FC8181`, `color: #C53030`, `border-radius: 8px`, padding `12px 16px`)

### 9.5 Rate Limiting & Error Handling

- Implement a simple **client-side rate limit** of 1 request per 5 seconds (disable the CTA button for 5s after each click)
- Show a **timeout message** if the API doesn't respond within 15 seconds: `"This is taking longer than expected. Please try again."`
- If the API key is missing or invalid, show: `"The prompt enhancement service is temporarily unavailable."` — do NOT expose API error details to the user

---

## 10. Developer Notes

### 10.1 Technical Architecture
- This page should be built as a **standalone React component** (or Next.js page, depending on the site's framework)
- The Gemini API call **must** go through a backend proxy/endpoint — never call the Gemini API directly from the frontend (API key security)
- If the site is static/JAMstack, use a serverless function (Vercel/Netlify function) for the API proxy

### 10.2 Web Speech API Considerations
- The Web Speech API (`SpeechRecognition`) is supported in Chrome, Edge, and Safari. Firefox support is limited.
- Always feature-detect before showing the mic button: `if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)`
- Set the recognition language to `en-US` by default
- Use `continuous: false` and `interimResults: true` for a responsive experience

### 10.3 Clipboard API
- Use `navigator.clipboard.writeText()` for the copy function
- Fallback: `document.execCommand('copy')` for older browsers

### 10.4 Accessibility
- All interactive elements must be keyboard accessible
- Textarea labels must use proper `<label>` elements with `for` attributes
- Color-coded blocks must not rely on color alone for meaning — each block has a text label (the section pill badge)
- The tooltip on the info icon should be accessible via keyboard focus (not hover-only)
- Voice input button should have `aria-label="Start voice input"` / `aria-label="Stop voice input"`
- Progress bar in the wizard should use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### 10.5 Performance
- The page should load and be interactive within 2 seconds
- The Gemini API call typically returns in 2–5 seconds — the skeleton loader keeps the experience smooth
- Pre-loaded examples should be hardcoded in the frontend (no API call needed to display them)
- Lazy-load the Web Speech API polyfill only if needed

### 10.6 State Management
- Track the current mode (A or B) in component state
- Track wizard progress (current step, answers per step, skipped steps) in component state
- The output should be stored in state so that if the user scrolls back up and then down, it's still there (until they click "Try Another")
- Do NOT persist state between page reloads — each visit is a fresh start

### 10.7 Dependencies
- Google Gemini API (requires API key)
- Lucide Icons (or similar icon library)
- DM Sans from Google Fonts
- Web Speech API (browser-native, no library needed)
- Clipboard API (browser-native)

### 10.8 Environment Variables
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash  # or gemini-2.5-pro
```
