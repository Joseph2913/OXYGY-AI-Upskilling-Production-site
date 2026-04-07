# Prompt: Standardise Visual Formatting of "THE REALITY" evidenceHero Slides

## Objective

Apply the Level 2 visual formatting pattern to the `evidenceHero` reality slides across Levels 1, 3, 4, and 5. Level 2 has already been standardised and is the reference. For Level 5, this slide doesn't exist yet — you will create it.

This prompt focuses on three specific formatting rules:
1. **Pull quote style** — stat text + source citation (not a narrative quote)
2. **Visual prominence** — the stat visual should dominate the right column
3. **Accent colour** — `valueColour` must match the level's accent, not hardcoded teal

---

## Required reading — do this FIRST

Read these files in full before making any changes:

1. **`PRD/SKILL-Elearning-Page.md`** — Pay attention to:
   - **"Level accent color rule (CRITICAL)"** — which colours each level MUST use
   - **`evidenceHero`** section — the updated spec including visual types, `valueColour` requirement, pull-quote formatting rules, and calendar visual design rules
2. **`data/topicContent.ts`** — All slide data. Search for `type: "evidenceHero"` to find every reality slide.
3. **`data/levelTopics.ts`** — `LEVEL_ACCENT_COLORS` and `LEVEL_ACCENT_DARK_COLORS`
4. **`components/app/level/ELearningView.tsx`** — The renderer. The `evidenceHero` case uses a `statColor` variable derived from `stat.valueColour || accentDark`. All visual renderers already support this. You should NOT need to change rendering code.
5. **`CLAUDE.md`** — Project rules (git workflow, deployment, safety).

---

## The Level 2 reference (what "done" looks like)

Here is the standardised L2 slide 2 — every other level's slide 2 must match this pattern:

```typescript
{
  section: "THE REALITY", type: "evidenceHero",
  takeaway: "When everyone uses AI differently, the team pays for it in rework and inconsistency",
  heading: "Everyone's using AI differently.",
  tealWord: "differently",
  body: "Teams across every function are using AI — but almost always individually and ad hoc. Each person runs their own version of the same task, producing outputs that look different, feel different, and can't be compared or built on.\n\nThe result? Rework. Inconsistency. Knowledge that lives with one person and disappears when they're out of office.",
  stats: [{
    value: "19%",
    valueColour: "#C4A934",    // Level 2's gold accent — NOT teal
    label: "of the average knowledge worker's week is spent recreating information that already exists somewhere in their organisation",
    source: "McKinsey Global Institute",
    desc: "Global knowledge worker productivity study",
    visualType: "weekBlocks",
  }],
  // Pull quote = stat sentence + source citation (NOT a narrative quote)
  pullQuote: "19% of the average knowledge worker's week is spent recreating information that already exists somewhere in their organisation — McKinsey Global Institute, The Social Economy",
  sourceLink: "https://www.mckinsey.com/...",
  sourceText: "McKinsey Global Institute — The Social Economy: ...",
  voiceover: { setup: "/audio/l2t1-s02-setup.mp3" },
},
```

**Three rules this template establishes:**

### Rule 1: Pull quote = stat text + source citation
The `pullQuote` field must contain the stat value, stat label, and source name in a single sentence. Format: `"[value] [label] — [source], [study name]"`. Do NOT use narrative or editorial quotes like "The tools are already in the room." The pull quote is now a data citation bar, not a commentary bar.

### Rule 2: `valueColour` = level accent dark colour
Every `stats[].valueColour` must use the level's accent dark colour, not hardcoded teal. This colour drives the visual fill (dots, bars, calendar cells), the large stat number, the pull-quote border, and highlighted numbers within the pull quote.

### Rule 3: Visuals should be prominent and fill the right column
The stat visual (dotGrid, barComparison, weekBlocks, etc.) should take up the full 52% right column and feel like the visual anchor of the slide. The `ELearningView.tsx` renderer already handles this — but if you notice any visual type that looks too small or cramped when you test, flag it.

---

## Level-by-level changes

### Level 1 (Slides 2–3)

**Current state:**
- Slide 2: `valueColour: "#2B6CB0"` (correct, already updated), default large number card visual, pull quote = `"75% of your colleagues, clients, and competitors. The tools are already in the room."` (narrative — needs update)
- Slide 3: `type: "chart"` (not evidenceHero — leave as-is), pull quote = `"The bar keeps moving. Being an AI user isn't enough — being a skilled one is what creates the gap."` (narrative — needs update)

**Changes needed:**
1. **Slide 2 pull quote** — Change to stat citation format:
   ```
   "75% of knowledge workers now use AI at work — Microsoft & LinkedIn, 2024 Work Trend Index"
   ```
2. **Slide 3 pull quote** — This is a `chart` type, not `evidenceHero`, but the pull-quote bar uses the same renderer. Update to include the key stat from that slide's content:
   ```
   "Up to 9x more output from the same AI tool — the gap isn't access, it's skill. — NN/g meta-analysis of Brynjolfsson, Li & Raymond (2023); Noy & Zhang (2023); GitHub Copilot Research (2022)"
   ```

**Do NOT change:** Slide 2's `visualType` (default large number card is appropriate for a clean percentage), heading, body, or takeaway.

### Level 3 (Slides 2–4)

**Current state:**
- Slide 2: `valueColour: "#38B2AC"` (correct — teal IS L3's accent), `visualType: "dotGrid"`, pull quote = `"The frontier isn't a better prompt. It's a process that runs itself."` (narrative — needs update)
- Slide 3: `valueColour: "#38B2AC"` (correct), `visualType: "performanceGap"`, pull quote = `"The competitive gap isn't between companies using AI and those that aren't. It's between those who chain it and those who silo it."` (narrative — needs update)
- Slide 4: `valueColour: "#38B2AC"` (correct), `visualType: "adoptionGap"`, pull quote = `"Personal productivity doesn't scale. Workflow design does."` (narrative — needs update)

**Changes needed:**
1. **Slide 2 pull quote:**
   ```
   "24% of organisations have moved beyond individual AI tasks to coordinated workflow automation — McKinsey, Global Survey on AI, 2024"
   ```
2. **Slide 3 pull quote:**
   ```
   "Top AI performers are 3.4x more likely to integrate AI across enterprise-wide workflows vs. using it as a standalone tool — McKinsey, The State of AI: Global Survey, 2024"
   ```
3. **Slide 4 pull quote:**
   ```
   "75% of knowledge workers use AI tools at work, but most use them as one-off assistants, not as parts of a designed process — Microsoft, Work Trend Index, 2024"
   ```

**Do NOT change:** Any `valueColour`, `visualType`, heading, body, or takeaway in L3 slides. Teal is correct for L3.

### Level 4 (Slide 2)

**Current state:**
- `valueColour: "#8C3A1A"` (correct — peach dark), `visualType: "dotGrid"`, pull quote = `"When building is this accessible, the constraint shifts. The question is no longer 'can you code?' — it's 'can you clearly define what you want?'"` (narrative — needs update)

**Changes needed:**
1. **Slide 2 pull quote:**
   ```
   "65% of organizations now regularly use generative AI — up from 33% just two years earlier — McKinsey, State of AI Global Survey, 2024"
   ```

**Do NOT change:** `valueColour`, `visualType`, heading, body, or takeaway.

### Level 5 (NEW slide — insert as slide 2)

**Current state:** Level 5 has NO `evidenceHero` slide. Its current slide 2 is a `comparison` type (dashboard vs application toggle). This slide must NOT be removed — you will insert a new slide before it.

**What to do:** Insert a new `evidenceHero` slide as slide 2, between the existing `courseIntro` (slide 1) and the existing `comparison` slide (which becomes slide 3). All subsequent L5 slides shift down by 1.

**New slide content:**

```typescript
/* ── Slide 2 — The Prototype-to-Production Gap ── */
{
  section: "THE REALITY", type: "evidenceHero",
  takeaway: "Most AI projects never make it past the prototype — only a fraction become products that others can actually use",
  heading: "Everyone's prototyping. Almost nobody's shipping.",
  tealWord: "shipping",
  body: "AI tools have made it trivially easy to build a prototype in an afternoon. But the gap between 'it works on my laptop' and 'other people can log in and use it' is where most projects stall.\n\nThe build pipeline that turns an idea into a deployed product has five distinct stages — and most builders skip straight to the middle.",
  stats: [{
    value: "90%",
    valueColour: "#2E3F8F",
    label: "of AI proofs of concept never make it to production deployment",
    source: "Gartner",
    desc: "AI in the Enterprise Survey, 2024",
    visualType: "dotGrid",
  }],
  pullQuote: "90% of AI proofs of concept never make it to production deployment — Gartner, AI in the Enterprise Survey, 2024",
  sourceLink: "https://www.gartner.com/en/newsroom/press-releases/2024-ai-deployment",
  sourceText: "Gartner — AI in the Enterprise: From Proof of Concept to Production (2024)",
},
```

**Important notes for L5:**
- `valueColour` MUST be `#2E3F8F` (Level 5's lavender dark accent)
- `visualType: "dotGrid"` — 90 out of 100 dots filled in lavender/indigo. Viscerally shows how few make it to production.
- The `pullQuote` follows the stat-citation format (Rule 1)
- **Voiceover:** Check `public/audio/` for available L5 audio files. The existing slide 2 uses `/audio/l5t1-s02-setup.mp3`. Since you are inserting a new slide before it, you have two options:
  - If there is no spare audio file, omit the `voiceover` field entirely on the new slide (the player handles this gracefully)
  - Do NOT reassign existing audio files — each file was recorded for specific slide content
- The existing `comparison` slide (now slide 3) keeps its current voiceover path unchanged.
- All subsequent L5 slides shift down by 1 in position (automatic — array order determines slide number).
- If you cannot verify the Gartner stat, use another credible stat about the AI prototype-to-production gap. The message must be: most AI projects die between prototype and deployment.

---

## Accent colour reference

| Level | `valueColour` to use | Status |
|-------|---------------------|--------|
| L1 | `#2B6CB0` (mint dark) | Already correct |
| L2 | `#C4A934` (gold) | Already correct (reference) |
| L3 | `#38B2AC` (teal) | Already correct |
| L4 | `#8C3A1A` (peach dark) | Already correct |
| L5 | `#2E3F8F` (lavender dark) | New slide — use this |

---

## Verification checklist

After making all changes, start the dev server (`npx vite --port 5173 --strictPort`) and check:

- [ ] **L1 slide 2** — Pull quote shows "75% of knowledge workers now use AI at work — Microsoft & LinkedIn, 2024 Work Trend Index" with mint-green accent on border and "75%" text
- [ ] **L1 slide 3** — Pull quote shows stat-citation format with the productivity gap data
- [ ] **L3 slide 2** — Pull quote shows "24% of organisations..." with teal accent
- [ ] **L3 slide 3** — Pull quote shows "Top AI performers are 3.4x..." with teal accent
- [ ] **L3 slide 4** — Pull quote shows "75% of knowledge workers..." with teal accent
- [ ] **L4 slide 2** — Pull quote shows "65% of organizations..." with peach accent
- [ ] **L5 slide 2** — NEW `evidenceHero` with lavender dotGrid (90%), stat-citation pull quote
- [ ] **L5 slide 3** — The existing comparison slide (dashboard vs application) is intact and unchanged
- [ ] **L5 total slide count** — One more than before (was 16, now 17)

---

## Rules

- **DO NOT remove, replace, or reorder existing slides** — only modify `pullQuote` fields on existing slides, and insert the new L5 slide
- **DO NOT modify `ELearningView.tsx`** — the rendering code already handles level-specific colours via `statColor`
- **DO NOT change headings, body text, takeaways, stats values, stats labels, or visualTypes** on existing slides — only change `pullQuote` and `valueColour` where specified
- **DO NOT create or reference audio files** that don't exist in `public/audio/`
- **DO NOT hardcode teal (`#38B2AC`)** for any level other than L3
- Follow the git workflow in `CLAUDE.md`: stage specific files, commit locally, start the dev server for visual verification, and WAIT for user approval before pushing

---

## Files you will modify

- `data/topicContent.ts` — Update pull quotes on L1/L3/L4 slides, insert new L5 slide

## Files you must NOT modify

- `components/app/level/ELearningView.tsx` — Rendering already handles everything
- `hooks/useVoiceover.ts` — No changes needed
- `PRD/SKILL-Elearning-Page.md` — Read-only reference (already updated)
