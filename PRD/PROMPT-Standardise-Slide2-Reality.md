# Prompt: Standardise Slide 2 ("THE REALITY" evidenceHero) Across All E-Learnings

## Objective

Standardise the formatting and accent colours of slide 2 across all five e-learning modules so they follow a consistent `evidenceHero` pattern. Level 2 has already been standardised and serves as the reference implementation.

---

## Required reading — do this FIRST

Before making any changes, read these files in full:

1. **`PRD/SKILL-Elearning-Page.md`** — The e-learning template skill. Pay special attention to:
   - The **"Level accent color rule (CRITICAL)"** section — defines which colours each level must use
   - The **`evidenceHero`** section — defines the slide structure, visual types, `valueColour` requirement, pull-quote formatting, and calendar visual rules
   - The **`courseIntro`** section — defines the two-column layout standard (already implemented)

2. **`data/topicContent.ts`** — All slide data lives here. Search for `type: "evidenceHero"` to find every reality slide.

3. **`data/levelTopics.ts`** — Contains `LEVEL_ACCENT_COLORS` and `LEVEL_ACCENT_DARK_COLORS` which define the accent palette for each level.

4. **`components/app/level/ELearningView.tsx`** — The renderer. The `evidenceHero` case already uses a `statColor` variable derived from `stat.valueColour || accentDark`. All visual renderers (dotGrid, barComparison, adoptionGap, weekBlocks, performanceGap, default large number card) already support this. You should NOT need to change any rendering code — only data.

5. **`CLAUDE.md`** — Project rules including git workflow, deployment, and component safety rules.

---

## What has already been done (Level 2 — the reference)

Level 2's slide 2 has been standardised with:
- `section: "THE REALITY"` (was previously `"THE STANDARDISATION GAP"`)
- `type: "evidenceHero"` with a two-column layout (48% text / 52% visual)
- `valueColour: "#C4A934"` (Level 2's gold accent — NOT teal)
- A `weekBlocks` visual type showing a monthly calendar (Mon-Fri x 4 weeks)
- Pull-quote bar with the stat text and source citation, using the level's accent colour for the border and highlighted numbers
- The `evidenceHero` renderer now uses `statColor` (from `stat.valueColour`) for all visual fills, borders, pull-quote accents, etc.

---

## Tasks

### Task 1: Update `valueColour` in existing evidenceHero slides

For each level, ensure every `evidenceHero` slide's `stats[].valueColour` matches the level's accent dark colour:

| Level | Correct `valueColour` | Current status |
|-------|----------------------|----------------|
| L1 | `#1A6B5F` (mint dark) | Currently `#38B2AC` — **NEEDS UPDATE** |
| L2 | `#C4A934` (gold) | Already correct |
| L3 | `#38B2AC` (teal) | Already correct (teal IS L3's accent) |
| L4 | `#8C3A1A` (peach dark) | Already correct |
| L5 | N/A — see Task 3 | Slide doesn't exist yet |

**Steps:**
1. Open `data/topicContent.ts`
2. Find all `evidenceHero` slides for Level 1 (search for the L1 slide data — slides 2-3 in the `"1-1"` key)
3. Change `valueColour: "#38B2AC"` to `valueColour: "#1A6B5F"` on every stat object in L1's evidenceHero slides
4. Verify L3 and L4 are already correct (they should be — L3 uses `#38B2AC`, L4 uses `#8C3A1A`)

### Task 2: Ensure all slide 2s have `section: "THE REALITY"`

Verify that every level's slide 2 (the first slide after `courseIntro`) uses `section: "THE REALITY"`. This should already be the case for L1-L4. For L5, the existing slide 2 already has `section: "THE REALITY"` but is a `comparison` type, not `evidenceHero` — that's addressed in Task 3.

### Task 3: Add a new `evidenceHero` slide to Level 5

Level 5 currently has NO `evidenceHero` slide. Its slide 2 is a `comparison` type (the "dashboard vs application" toggle). This is valuable content and must NOT be removed or replaced.

**What to do:** Insert a NEW `evidenceHero` slide as slide 2 (between the current `courseIntro` slide 1 and the current `comparison` slide, which becomes slide 3). This shifts all subsequent L5 slide numbers up by 1.

**Content guidance for the new L5 slide 2:**

The module is about building full-stack AI applications. A strong reality stat would highlight the gap between AI adoption and actual product deployment. Suggested content:

```typescript
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
  pullQuote: "90% of AI proofs of concept never reach production — the gap isn't technical skill, it's knowing the stages between prototype and product. — Gartner, AI in the Enterprise Survey, 2024",
  sourceLink: "https://www.gartner.com/en/newsroom/press-releases/2024-ai-deployment",
  sourceText: "Gartner — AI in the Enterprise: From Proof of Concept to Production (2024)",
  voiceover: { setup: "/audio/l5t1-s02-setup.mp3" },
},
```

**Important considerations:**
- The `valueColour` MUST be `#2E3F8F` (Level 5's lavender dark accent)
- The `visualType` should be `dotGrid` (90 out of 100 dots filled — viscerally shows how few make it)
- The existing slide 2 (`comparison` type) keeps its voiceover file (`/audio/l5t1-s02-setup.mp3`). The new slide should reference the same audio file initially — or you can set the voiceover to `undefined` if no audio file exists for it yet. Do NOT create or reference audio files that don't exist in `public/audio/`.
- Check `public/audio/` for available L5 audio files before assigning voiceover paths.
- All subsequent L5 slides shift down by 1 position (this is automatic — the array order determines slide number).
- You may need to verify the stat/source. If you cannot verify the Gartner stat, use a different credible stat about the AI prototype-to-production gap. The key message is: most AI projects die between prototype and deployment.

### Task 4: Verify visual consistency

After making changes, start the dev server (`npx vite --port 5173 --strictPort`) and visually check each level's slide 2:

1. **L1** — Should show mint/dark-green accent (not teal) on the stat card, pull-quote border, and highlighted numbers
2. **L2** — Should show gold/yellow accent (already done — just verify it still works)
3. **L3** — Should show teal accent (correct — teal is L3's colour)
4. **L4** — Should show peach/terracotta accent (already done — just verify)
5. **L5** — Should show a new `evidenceHero` slide with lavender/indigo accent, followed by the existing comparison slide

### Task 5: Check for remaining hardcoded teal in data

Run a search across `data/topicContent.ts` for any remaining `valueColour: "#38B2AC"` entries. After Task 1, the ONLY level that should have teal `valueColour` is Level 3 (because teal is L3's accent colour). If any L1, L2, L4, or L5 stats still use `#38B2AC`, update them to the correct level accent dark colour.

---

## Rules to follow

- **DO NOT remove, replace, or reorder existing slides** (except inserting the new L5 slide 2, which shifts others down)
- **DO NOT modify the rendering code** in `ELearningView.tsx` — the `statColor` system already handles level-specific colours. Only change data in `topicContent.ts`.
- **DO NOT hardcode teal (`#38B2AC`)** for any level other than L3
- **DO NOT create or reference audio files** that don't exist in `public/audio/`
- Follow the git workflow in `CLAUDE.md`: stage specific files, commit locally, start the dev server for visual verification, and WAIT for user approval before pushing
- After any variable rename or removal, grep the entire codebase for remaining references (per `CLAUDE.md` safety rules)

---

## Level accent colour reference

| Level | Light (`accentColor`) | Dark (`accentDark` / `valueColour`) |
|-------|----------------------|------------------------------------|
| L1 | `#A8F0E0` (Mint) | `#1A6B5F` |
| L2 | `#F7E8A4` (Pale Yellow) | `#8A6A00` (use `#C4A934` for stat fills) |
| L3 | `#38B2AC` (Teal) | `#1A7A76` (use `#38B2AC` for stat fills) |
| L4 | `#F5B8A0` (Soft Peach) | `#8C3A1A` |
| L5 | `#C3D0F5` (Lavender) | `#2E3F8F` |

---

## Files you will modify

- `data/topicContent.ts` — Update `valueColour` values, add new L5 slide
- `PRD/SKILL-Elearning-Page.md` — Already updated, read-only reference

## Files you must NOT modify

- `components/app/level/ELearningView.tsx` — Already handles level-specific colours via `statColor`
- `hooks/useVoiceover.ts` — No changes needed
