# Prompt: Create the "What You've Learned" Summary Slide for Level 3

## Task

Create the final summary slide for the Level 3 e-learning module (Workflow Design). Follow the `moduleSummary` 5-card takeaway template exactly as specified in `PRD/SKILL-Elearning-Page.md` — read the full `moduleSummary` section before starting.

## Required reading

1. **`PRD/SKILL-Elearning-Page.md`** — Read the `moduleSummary` section in full. It defines the 6-step process: identify takeaways, write card content, design visuals, card layout, data structure, and voiceover.
2. **`data/topicContent.ts`** — Find the Level 3 slides (key `"3-1"`). Read every slide to understand what was taught.
3. **`components/app/level/ELearningView.tsx`** — Search for `l2-summary` to see the working reference implementation. Your L3 version will follow the same renderer pattern.
4. **`data/levelTopics.ts`** — L3 accent colours: `accentColor: "#38B2AC"`, `accentDark: "#1A7A76"`.

## What to do

1. Read all L3 slides and list ~10 topics covered
2. Curate to exactly 5 following the arc: problem → decision → design → quality → action
3. Update the existing L3 `moduleSummary` slide in `data/topicContent.ts` — add `visualId: "l3-summary"` and the `summaryCards` array
4. Add a `case 'l3-summary'` check in the `moduleSummary` renderer in `ELearningView.tsx` that reuses the same 5-card template (or make the existing `l2-summary` check generic enough to handle both)
5. Generate a voiceover using `edge-tts` with voice `en-GB-RyanNeural` (~45-60 seconds covering all 5 takeaways)
6. Embed the voiceover path in the slide data

## Colour rules

All 5 cards must use:
- `color: "#1A7A76"` (L3 accentDark)
- `light: "#E6FFFA"` (L3 accentColor tint)

Do NOT use different colours per card. Read the colour rule in the skill file.

## Reference implementation

The L2 summary slide (search for `l2-summary` in both `topicContent.ts` and `ELearningView.tsx`) is the working reference. Match its structure exactly — 5 cards, same chip style, same fixed height, same layout.
