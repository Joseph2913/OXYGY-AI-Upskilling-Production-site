# PRD 18 — AI Project Review System
## Oxygy AI Upskilling Platform · Learning Experience Layer

**Version:** 1.0  
**Handoff target:** Claude Code  
**Depends on:** PRD 01–05, PRD 16 (Learning Plan Gating), PRD 17 (Project Proof Page & Journey Integration) — all must be complete and passing acceptance criteria before starting this PRD  

---

## 0. Instructions for Claude Code — Read Before Starting

Before writing any code:

1. Confirm PRDs 01–05, PRD 16, and PRD 17 are complete and passing all acceptance criteria
2. Read `docs/CLAUDE.md` — specifically the sections on Firebase Cloud Functions and OpenRouter. **All AI API calls go through OpenRouter, not direct provider APIs.** New endpoints are added to `functions/src/index.ts`, not to the `api/` directory.
3. Read `functions/src/index.ts` in full — you are adding a new Cloud Function (`reviewproject`) following the exact same patterns as the existing functions
4. Read `functions/src/gemini.ts` — specifically `callOpenRouter()` / `callOpenRouterRaw()` / `fetchWithRetry()`. You will use `callOpenRouterRaw()` for this endpoint because you need to send image content blocks (vision), which `callGemini()` does not support (it only accepts a string `userMessage`)
5. Read `firebase.json` — you are adding a new rewrite: `{ "source": "/api/review-project", "function": { "functionId": "reviewproject" } }`
6. Read `src/pages/app/AppProjectProof.tsx` from PRD 17 — you are replacing the auto-complete submission flow with an AI review call and adding the scorecard UI in Zone 4
7. Read `src/lib/database.ts` — specifically the `submitProject()` function from PRD 17. You are modifying it to call the review API instead of auto-completing
8. Read `supabase/schema.sql` — specifically the `project_submissions` table. The review columns (`review_dimensions`, `review_summary`, `review_encouragement`, `review_passed`, `reviewed_at`) already exist from PRD 17 — you are now populating them

---

## 1. Overview

### Purpose
This PRD adds an AI-powered review agent that evaluates project submissions against the learner's personalised project brief. When a learner submits their project proof, the agent analyses their written responses and screenshots, produces a structured four-dimension scorecard, and determines whether the submission passes or needs revision.

### What this PRD delivers
1. **Firebase Cloud Function** — `/api/review-project` endpoint that accepts submission text + screenshots (as base64) + project brief, and returns a structured review scorecard
2. **Review system prompt** — Carefully tuned per-level evaluation criteria with a developmental, non-punitive tone
3. **Scorecard UI** — Zone 4 component on the project proof page displaying four dimensions with status indicators, specific feedback, summary, and encouragement
4. **Submission flow change** — Replace the auto-complete from PRD 17 with: submit → API call → scorecard renders → pass or needs-revision
5. **Resubmission flow** — "Edit & Resubmit" for needs-revision status, allowing learners to modify and resubmit indefinitely
6. **Loading state** — Processing indicator during the review (3–8 seconds)

### What this PRD does NOT deliver
- Facilitator/manager review dashboard (future PRD)
- Organisation-level review criteria customisation (future PRD)
- Review history (only the most recent review is stored per submission)

### Key design principles
**Mentor, not gatekeeper.** The AI reviewer should sound like a supportive senior colleague who's genuinely impressed by effort and specific about how to improve. Never dismissive, never punitive. A working professional who made a sincere attempt should pass on the first try almost every time.

**Specific, not generic.** Every piece of feedback must reference the learner's actual submission — their tool name, their described workflow, their stated impact. Generic feedback like "good effort" or "could be more detailed" is a failure of the review prompt.

**Rigorous enough to matter.** The review should catch genuinely empty or irrelevant submissions. If someone uploads a random screenshot and writes "I did the thing," that should trigger a needs-revision. The bar is low enough for honest effort but high enough to prevent gaming.

---

## 2. Firebase Cloud Function: `reviewproject`

### Endpoint
- **URL:** `/api/review-project`
- **Method:** POST
- **Added to:** `functions/src/index.ts`
- **Firebase rewrite:** `{ "source": "/api/review-project", "function": { "functionId": "reviewproject" } }`

### Request body

```typescript
interface ReviewProjectRequest {
  level: number;                    // 1–5
  projectBrief: {
    projectTitle: string;
    projectDescription: string;
    deliverable: string;
    challengeConnection: string;
  };
  submission: {
    toolName: string | null;
    platformUsed: string | null;
    toolLink: string | null;
    reflectionText: string;
    adoptionScope: string | null;
    outcomeText: string;
    caseStudyProblem: string | null;   // L5 only
    caseStudySolution: string | null;  // L5 only
    caseStudyOutcome: string | null;   // L5 only
    caseStudyLearnings: string | null; // L5 only
  };
  screenshots: string[];              // base64-encoded images (data URI format)
  learnerProfile: {
    role: string;
    function: string;
    seniority: string;
    aiExperience: string;
  };
}
```

### Response body

```typescript
interface ReviewProjectResponse {
  dimensions: {
    id: string;           // 'brief_alignment' | 'evidence_quality' | 'reflection_depth' | 'impact'
    name: string;         // Human-readable name
    status: string;       // 'strong' | 'developing' | 'needs_attention'
    feedback: string;     // 2–3 sentences referencing the specific submission
  }[];
  overallPassed: boolean;
  summary: string;        // 2-sentence overall assessment
  encouragement: string;  // Specific, genuine note about what they did well
}
```

### Model selection

**Use Claude Sonnet via OpenRouter:** `anthropic/claude-sonnet-4`

Claude Sonnet is required (not Gemini Flash) for two reasons:
1. **Vision capability** — screenshots are sent as base64 images in the message content array. Claude handles multi-image analysis well.
2. **Evaluation quality** — the review requires nuanced judgment about reflection quality, alignment to a brief, and image relevance. Sonnet's evaluation capabilities are stronger for this use case.

### Implementation

```typescript
export const reviewproject = onRequest(
  { secrets: [openRouterApiKey], timeoutSeconds: 60 },
  async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const apiKey = openRouterApiKey.value();
    if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

    try {
      const { level, projectBrief, submission, screenshots, learnerProfile } = req.body;

      // Validation
      if (!level || !projectBrief || !submission) {
        res.status(400).json({ error: "Missing required fields" }); return;
      }

      // Build the message content array with text + images
      const systemPrompt = buildReviewSystemPrompt(level);
      const userMessageParts = buildUserMessage(level, projectBrief, submission, learnerProfile);

      // Add screenshots as image content blocks (max 5)
      const imageBlocks = (screenshots || []).slice(0, 5).map((dataUri: string) => {
        // dataUri format: "data:image/png;base64,iVBOR..."
        const [meta, base64] = dataUri.split(",");
        const mediaType = meta.match(/data:(.*?);/)?.[1] || "image/png";
        return {
          type: "image_url",
          image_url: {
            url: dataUri,
          },
        };
      });

      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userMessageParts },
            ...imageBlocks,
          ],
        },
      ];

      // Call OpenRouter with Claude Sonnet
      const response = await fetchWithRetry(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4",
            messages,
            temperature: 0.4,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          }),
        },
        "review-project"
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter API error (review-project):", response.status, errText);
        const status = response.status === 429 ? 429 : 502;
        const message = response.status === 429
          ? "The AI service is temporarily busy. Please wait a moment and try again."
          : "AI service error";
        res.status(status).json({ error: message, retryable: true }); return;
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);

      res.status(200).json(parsed);
    } catch (err) {
      console.error("review-project error:", err);
      res.status(500).json({ error: "Internal server error", retryable: true });
    }
  }
);
```

**Note on `callOpenRouterRaw` vs direct fetch:** The existing `callGemini`/`callOpenRouter` helper accepts a string `userMessage`. Because this endpoint sends a content array (text + images), use `fetchWithRetry` directly with the full messages array, matching the pattern used in the Vite dev proxy plugins. If `callOpenRouterRaw` supports content arrays, use it instead — check `functions/src/gemini.ts` before deciding.

### Timeout

Set `timeoutSeconds: 60` on the Cloud Function. Image analysis with multiple screenshots can take 5–10 seconds. The default 10-second timeout is insufficient.

---

## 3. Review System Prompt

The system prompt is the intelligence layer. It must be carefully tuned to produce specific, developmental feedback that references the learner's actual submission.

### Base prompt (all levels)

```
REVIEW_PROJECT_SYSTEM_BASE = `You are the OXYGY AI Project Reviewer — a supportive, experienced mentor who evaluates project submissions from professionals completing an AI upskilling programme.

Your role is to review a learner's project submission and provide constructive, specific feedback across four dimensions. You are NOT a gatekeeper — you are a development coach. Your feedback should make the learner feel seen and supported, while being honest about areas that need more depth.

CRITICAL TONE RULES:
- Always reference the learner's specific submission — their tool name, their described workflow, their stated outcomes. NEVER give generic feedback.
- When something is good, say specifically WHY it's good. "Your reflection shows genuine iteration" is better than "Good reflection."
- When something needs work, explain WHAT is missing and give a concrete suggestion. "Consider describing the specific instructions you gave the agent and how you iterated on them" is better than "Could be more detailed."
- Assume competence. These are working professionals, not students. Address them as peers.
- The encouragement field must identify one genuinely specific thing they did well. If you can't find something specific, you're not looking hard enough.

PASS/FAIL LOGIC:
The submission passes if ALL of these are true:
1. At least THREE dimensions are "strong" or "developing"
2. ZERO dimensions are "needs_attention"

If ANY dimension is "needs_attention", the submission needs revision. This should be RARE — only when a section is genuinely empty, clearly irrelevant, or so vague that no meaningful project work can be inferred.

"developing" is a PASS state. A learner with all four dimensions at "developing" passes. "developing" means they've done real work but could go deeper — it's feedback for growth, not a blocker.

DIMENSION DEFINITIONS:

1. BRIEF ALIGNMENT (id: "brief_alignment")
Does the submitted project roughly match the project brief? Look for alignment between the described deliverable and the brief's stated deliverable. A pivot from the original brief is ACCEPTABLE if the learner explains why — pivots can show adaptive thinking. Only mark "needs_attention" if the submission has no discernible connection to the brief.

2. EVIDENCE QUALITY (id: "evidence_quality")
Do the screenshots and descriptions demonstrate a real deliverable? For screenshots: Are they relevant to the described project? Do they show a working tool, workflow, or dashboard — not just a setup screen or blank interface? For descriptions: Are they specific enough to indicate real work was done? Only mark "needs_attention" if screenshots are missing (when required), clearly unrelated, or if the description contradicts the visual evidence.

3. REFLECTION DEPTH (id: "reflection_depth")
Does the reflection show genuine learning and thoughtful application? Look for: specific design decisions, iteration (tried X, changed to Y because Z), challenges overcome, connections between the project and their daily work. Surface-level responses ("I built it and it works") are "developing". Rich, specific reflections with evidence of iteration are "strong". Only mark "needs_attention" if the reflection is essentially empty or copied boilerplate.

4. REAL-WORLD IMPACT (id: "impact")
Has this created tangible value? Look for: specific descriptions of who uses the tool, what changed, measurable outcomes (time saved, quality improved, processes changed). Vague claims ("my team finds it useful") are "developing". Specific outcomes with evidence are "strong". Only mark "needs_attention" if the impact section is empty or the claims are clearly implausible.

RESPONSE FORMAT (JSON only, no markdown, no preamble):

{
  "dimensions": [
    {
      "id": "brief_alignment",
      "name": "Brief Alignment",
      "status": "strong",
      "feedback": "Your meeting-prep agent closely matches the original brief..."
    },
    {
      "id": "evidence_quality",
      "name": "Evidence Quality",
      "status": "developing",
      "feedback": "Your screenshots show the GPT configuration, but..."
    },
    {
      "id": "reflection_depth",
      "name": "Reflection Depth",
      "status": "strong",
      "feedback": "The way you described iterating on the system prompt..."
    },
    {
      "id": "impact",
      "name": "Real-World Impact",
      "status": "developing",
      "feedback": "You mention your team uses it weekly, which is great..."
    }
  ],
  "overallPassed": true,
  "summary": "A solid Level 2 submission that demonstrates...",
  "encouragement": "The fact that you iterated on the system prompt three times..."
}`
```

### Level-specific prompt additions

Append these to the base prompt depending on the level:

**Level 1:**
```
LEVEL 1 — ADDITIONAL CONTEXT:
This is a foundational level. The learner was asked to apply AI prompting to their daily work. They did NOT build a discrete tool — they used AI in the context of their existing job.

Be LENIENT on evidence quality — L1 learners may not have screenshots, and that's acceptable. Focus your evaluation on the quality of their reflection and whether they demonstrate genuine engagement with prompting techniques.

Screenshots are optional for L1. If provided, check that they show AI tool usage (a conversation with an AI tool, prompt inputs and outputs). If not provided, do not mark evidence_quality as needs_attention — evaluate based on written description alone.

The bar for "strong" at L1: The learner describes a specific situation, explains what they prompted, what they got back, and how it changed their approach. They show awareness of prompt structure (role, context, task).
```

**Level 2:**
```
LEVEL 2 — ADDITIONAL CONTEXT:
The learner was asked to build a custom AI agent or GPT. They should have a discrete, named tool that others can use.

Screenshots are REQUIRED. At minimum, look for evidence of the agent's configuration or instructions AND evidence of it working (a sample conversation or output). A screenshot of just the builder interface without a working example is "developing" for evidence quality, not "strong".

The bar for "strong" at L2: The learner built a working agent, can explain the design decisions behind their instructions, and shows evidence of iteration. Bonus: evidence that others are actually using it.
```

**Level 3:**
```
LEVEL 3 — ADDITIONAL CONTEXT:
The learner was asked to design an automated workflow connecting multiple AI steps. This is a systems-level project.

Screenshots are REQUIRED. Look for a workflow canvas showing connected nodes, not just a single step. The complexity should be proportional to the described workflow — a two-node chain for a complex process described in detail is a mismatch.

The bar for "strong" at L3: The workflow has clear input → processing → output logic with multiple steps. The learner describes where human-in-the-loop checkpoints are and why. They can articulate the end-to-end flow and its business impact.
```

**Level 4:**
```
LEVEL 4 — ADDITIONAL CONTEXT:
The learner was asked to build a dashboard or front-end interface. This is a design project.

A link to the live dashboard is REQUIRED. Screenshots should show the actual dashboard with data, not just wireframes or design mockups. At least 2 screenshots are expected.

The bar for "strong" at L4: The dashboard is live and accessible. It has a clear intended audience. The layout shows intentional design decisions (not just a default template). The reflection describes the design rationale — who sees what, why the data is presented this way, what decisions the dashboard enables.
```

**Level 5:**
```
LEVEL 5 — ADDITIONAL CONTEXT:
This is the capstone level. The learner was asked to build a full application AND write a structured case study (Problem, Solution, Outcome, Learnings).

A link to the deployed app is REQUIRED. Multiple screenshots (2+) are expected showing different views. The case study sections should each be substantive (100+ words).

The bar for "strong" at L5: The app is deployed and functional. The case study reads like a professional portfolio piece — specific about the problem, detailed about the solution, honest about outcomes and learnings. The learner demonstrates integration of skills from all previous levels.

For the case study dimensions, evaluate:
- Brief alignment: Does the app match the project brief?
- Evidence quality: Is the app deployed? Do screenshots show a real, functional product?
- Reflection depth: Are the case study sections (especially Problem and Solution) specific and detailed?
- Impact: Does the Outcome section include measurable results or specific user feedback?
```

### Building the user message

The `buildUserMessage()` function assembles a text block that the model evaluates alongside the screenshots:

```typescript
function buildUserMessage(
  level: number,
  brief: ReviewProjectRequest["projectBrief"],
  submission: ReviewProjectRequest["submission"],
  profile: ReviewProjectRequest["learnerProfile"]
): string {
  const parts: string[] = [];

  parts.push("=== PROJECT BRIEF (what the learner was asked to do) ===");
  parts.push(`Title: ${brief.projectTitle}`);
  parts.push(`Description: ${brief.projectDescription}`);
  parts.push(`Expected Deliverable: ${brief.deliverable}`);
  parts.push(`Challenge Connection: ${brief.challengeConnection}`);

  parts.push("\n=== LEARNER PROFILE ===");
  parts.push(`Role: ${profile.role}`);
  parts.push(`Function: ${profile.function}`);
  parts.push(`Seniority: ${profile.seniority}`);
  parts.push(`AI Experience: ${profile.aiExperience}`);

  parts.push("\n=== SUBMISSION ===");

  if (submission.toolName) {
    parts.push(`\n--- What They Built ---`);
    parts.push(`Tool/Agent Name: ${submission.toolName}`);
    if (submission.platformUsed) parts.push(`Platform: ${submission.platformUsed}`);
    if (submission.toolLink) parts.push(`Link: ${submission.toolLink}`);
  }

  parts.push(`\n--- Reflection ---`);
  parts.push(submission.reflectionText || "(No reflection provided)");

  parts.push(`\n--- Impact ---`);
  if (submission.adoptionScope) parts.push(`Adoption: ${submission.adoptionScope}`);
  parts.push(submission.outcomeText || "(No outcome provided)");

  if (level === 5) {
    parts.push(`\n--- Case Study: Problem ---`);
    parts.push(submission.caseStudyProblem || "(Not provided)");
    parts.push(`\n--- Case Study: Solution ---`);
    parts.push(submission.caseStudySolution || "(Not provided)");
    parts.push(`\n--- Case Study: Outcome ---`);
    parts.push(submission.caseStudyOutcome || "(Not provided)");
    parts.push(`\n--- Case Study: Learnings ---`);
    parts.push(submission.caseStudyLearnings || "(Not provided)");
  }

  const screenshotCount = "Screenshots attached below";
  parts.push(`\n=== SCREENSHOTS: ${screenshotCount} ===`);
  parts.push("Evaluate the attached screenshots for relevance and evidence of a working deliverable.");

  return parts.join("\n");
}
```

---

## 4. Scorecard UI (Zone 4)

This replaces the empty `data-testid="review-scorecard-zone"` placeholder from PRD 17. It renders after submission, between Zone 1 (brief) and Zone 2 (submission form, now read-only).

### When it renders

- **Before submission:** Not visible
- **During review:** Shows the processing indicator (Section 5)
- **After review (passed):** Shows the full scorecard with a success banner
- **After review (needs revision):** Shows the full scorecard with a revision banner

### Scorecard card

```
background: #FFFFFF
borderRadius: 16px
border: 1px solid {levelAccent}
padding: 24px 28px
marginBottom: 20px
```

### Header

- Text: "Review Feedback" — `fontSize: 18px`, `fontWeight: 700`, `color: #1A202C`
- Subtext: "Reviewed on {date}" — `fontSize: 12px`, `color: #A0AEC0`, `marginTop: 2px`
- `marginBottom: 20px`

### Dimension rows

Four rows, one per dimension. Each separated by `borderBottom: 1px solid #F7FAFC` (except the last). Padding: `14px 0`.

**Each row layout:**
```
display: flex
flexDirection: column
gap: 6px
```

**Row header (flex row, space-between, align-items center):**

Left side (flex row, gap 10px, align-items center):
- **Dimension icon:** 28px circle, `display: flex`, `alignItems: center`, `justifyContent: center`
  - `brief_alignment`: `Target` icon (14px)
  - `evidence_quality`: `Image` icon (14px)
  - `reflection_depth`: `Lightbulb` icon (14px)
  - `impact`: `TrendingUp` icon (14px)
  - Circle background: `{levelAccent}22`
  - Icon colour: `{levelAccentDark}`
- **Dimension name:** `fontSize: 14px`, `fontWeight: 600`, `color: #1A202C`

Right side:
- **Status indicator** (flex row, gap 6px, align-items center):

| Status | Circle | Text Colour | Text |
|---|---|---|---|
| `strong` | 10px filled circle, `background: {levelAccentDark}` | `{levelAccentDark}` | "Strong" |
| `developing` | 10px circle, half-filled — `background: linear-gradient(to right, #F59E0B 50%, transparent 50%)`, `border: 1.5px solid #F59E0B` | `#92400E` | "Developing" |
| `needs_attention` | 10px circle, outlined only — `border: 1.5px solid #EF4444`, `background: transparent` | `#DC2626` | "Needs Attention" |

Status text: `fontSize: 12px`, `fontWeight: 600`

**Row feedback (below the header):**
- The AI's feedback text for this dimension
- `fontSize: 13px`, `color: #4A5568`, `lineHeight: 1.6`, `marginLeft: 38px` (indented to align with the dimension name, past the icon)

### Summary section

Below all four dimension rows, separated by `borderTop: 1px solid #E2E8F0`, `paddingTop: 16px`, `marginTop: 8px`.

- **Summary text:** `fontSize: 14px`, `fontWeight: 500`, `color: #1A202C`, `lineHeight: 1.6`
- **Encouragement text:** `fontSize: 13px`, `color: {levelAccentDark}`, `fontStyle: italic`, `marginTop: 8px`, `lineHeight: 1.5`

### Result banners

Below the summary, `marginTop: 16px`.

**Passed banner:**
```
background: {levelAccent}12
border: 1px solid {levelAccent}
borderRadius: 12px
padding: 16px 20px
display: flex
alignItems: center
gap: 10px
```
- `CheckCircle` icon (20px, `{levelAccentDark}`)
- Text: "Project complete — this has been recorded on your learning journey." — `fontSize: 14px`, `fontWeight: 600`, `color: {levelAccentDark}`

**Needs revision banner:**
```
background: #FFF7ED
border: 1px solid #FDBA74
borderRadius: 12px
padding: 16px 20px
```
- Top row (flex, space-between, align-items center):
  - Left: `AlertCircle` icon (20px, `#F59E0B`) + "One or more areas need attention" — `fontSize: 14px`, `fontWeight: 600`, `color: #9A3412`
  - Right: "Edit & Resubmit" button — `background: transparent`, `border: 1px solid #F59E0B`, `color: #92400E`, `borderRadius: 20px`, `padding: 8px 18px`, `fontSize: 13px`, `fontWeight: 600`, `cursor: pointer`
- Bottom text: "Review the feedback above, then update your submission. You can resubmit as many times as needed." — `fontSize: 12px`, `color: #92400E`, `marginTop: 8px`

---

## 5. Processing Indicator

When the user clicks "Confirm & Submit" and the review API is called, show a processing indicator in place of the submit button area.

**Container:**
```
background: #FFFFFF
borderRadius: 14px
border: 1px solid #E2E8F0
padding: 24px
textAlign: center
marginTop: 12px
```

**Header:** "Reviewing your submission..." — `fontSize: 16px`, `fontWeight: 700`, `color: #1A202C`

**Subtext:** "This usually takes 5–10 seconds" — `fontSize: 13px`, `color: #A0AEC0`, `marginTop: 4px`

**Step labels** (cycle at 2-second intervals):
1. "Reading your reflection..."
2. "Analysing your screenshots..."
3. "Comparing against your project brief..."
4. "Evaluating depth and impact..."
5. "Preparing your feedback..."

Same visual treatment as the Learning Plan Generator processing indicator from PRD 16 — small teal spinner (16px) to the left of each step, checkmark for completed steps.

---

## 6. Submission Flow Change

### PRD 17 flow (being replaced)
```
Submit → auto-set status to 'passed' → auto-set project_completed → show completion card
```

### New flow (this PRD)
```
Submit → call /api/review-project → receive scorecard → 
  if overallPassed: set status to 'passed', set project_completed, show scorecard + passed banner
  if !overallPassed: set status to 'needs_revision', show scorecard + revision banner
```

### Implementation changes to `submitProject()` in `database.ts`

Replace the auto-complete logic from PRD 17 with:

```typescript
export async function submitProject(
  userId: string,
  level: number,
  submission: ProjectSubmission,
  screenshotDataUris: string[],
  projectBrief: { projectTitle: string; projectDescription: string; deliverable: string; challengeConnection: string },
  learnerProfile: { role: string; function: string; seniority: string; aiExperience: string },
): Promise<{ success: boolean; review: ReviewProjectResponse | null; error: string | null }> {
  try {
    // 1. Set status to 'submitted'
    await supabase
      .from('project_submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('level', level);

    // 2. Call the review API
    const response = await fetch('/api/review-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        projectBrief,
        submission: {
          toolName: submission.toolName,
          platformUsed: submission.platformUsed,
          toolLink: submission.toolLink,
          reflectionText: submission.reflectionText,
          adoptionScope: submission.adoptionScope,
          outcomeText: submission.outcomeText,
          caseStudyProblem: submission.caseStudyProblem,
          caseStudySolution: submission.caseStudySolution,
          caseStudyOutcome: submission.caseStudyOutcome,
          caseStudyLearnings: submission.caseStudyLearnings,
        },
        screenshots: screenshotDataUris,
        learnerProfile,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Review API failed');
    }

    const review: ReviewProjectResponse = await response.json();

    // 3. Store the review results
    const newStatus = review.overallPassed ? 'passed' : 'needs_revision';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      review_dimensions: review.dimensions,
      review_summary: review.summary,
      review_encouragement: review.encouragement,
      review_passed: review.overallPassed,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (review.overallPassed) {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('project_submissions')
      .update(updateData)
      .eq('user_id', userId)
      .eq('level', level);

    // 4. If passed, update level_progress
    if (review.overallPassed) {
      // Check if level_progress row exists
      const { data: existing } = await supabase
        .from('level_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('level', level)
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('level_progress')
          .update({
            project_completed: true,
            project_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('level_progress')
          .insert({
            user_id: userId,
            level,
            project_completed: true,
            project_completed_at: new Date().toISOString(),
          });
      }
    }

    return { success: true, review, error: null };
  } catch (err) {
    console.error('submitProject error:', err);
    return { success: false, review: null, error: (err as Error).message };
  }
}
```

### Error handling

If the review API call fails (network error, timeout, 5xx):
1. Set status back to `'draft'` (revert the `'submitted'` status)
2. Show an error message on the proof page: "Something went wrong reviewing your submission. Your draft has been saved — please try again." — `fontSize: 13px`, `color: #E53E3E`
3. Restore the "Submit for Review" button

The learner's draft is never lost — the worst case is they need to click submit again.

---

## 7. Resubmission Flow

When a submission has `status = 'needs_revision'`:

### Page state
- Zone 1 (brief): unchanged, read-only
- Zone 4 (scorecard): visible, showing the review feedback with the revision banner
- Zone 2 (form): **read-only** by default, with an "Edit & Resubmit" CTA on the revision banner

### On clicking "Edit & Resubmit"

1. Zone 2 transitions back to editable mode — form fields become active inputs again, pre-filled with the existing submission data
2. The scorecard (Zone 4) remains visible above the form — the learner can reference the feedback while editing
3. The "Submit for Review" button reappears in Zone 3
4. The learner modifies their submission and clicks "Submit for Review" again
5. The same review flow runs — API call, scorecard, pass or needs-revision

### No limit on resubmissions

A learner can resubmit indefinitely. Each resubmission overwrites the previous review data (`review_dimensions`, `review_summary`, etc.) in the same `project_submissions` row. There is no review history — only the most recent review is stored.

### Status transitions

```
draft → submitted → passed (done)
draft → submitted → needs_revision → submitted → passed (done)
draft → submitted → needs_revision → submitted → needs_revision → ... (repeat until passed)
```

---

## 8. Screenshot Handling for Review

Screenshots need to be sent to the review API as base64 data URIs. Here's the flow:

### On submission

1. For **new screenshots** (local files not yet uploaded to Storage): convert to base64 using `FileReader.readAsDataURL()`
2. For **existing screenshots** (already in Supabase Storage): fetch the signed URL, then fetch the image and convert to base64
3. Collect all base64 data URIs into an array
4. Send this array in the `screenshots` field of the review API request
5. **Also** upload any new screenshots to Supabase Storage (as PRD 17 specifies) — the Storage upload and the review API call can happen in parallel

### Size considerations

Base64-encoded images are ~33% larger than the original file. With 5 screenshots at max 5MB each, the worst case is ~33MB of base64 in the request body. This is within Cloud Function limits (Firebase allows up to 32MB for HTTP functions). However, to be safe:

- Resize images client-side before encoding: max dimension 1600px, JPEG quality 0.8. This reduces most screenshots to 200–500KB.
- If total base64 payload exceeds 10MB after resize, warn the user: "Some screenshots are very large. Consider using smaller files for faster review." — This is a non-blocking warning, not an error.

### Client-side resize function

```typescript
async function resizeImage(file: File, maxDim: number = 1600, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 9. File Structure

New files to create:
```
src/
├── components/
│   └── app/
│       └── journey/
│           └── project/
│               ├── ReviewScorecard.tsx       ← Zone 4 scorecard component
│               ├── ReviewProcessing.tsx      ← Processing indicator during review
│               └── DimensionRow.tsx          ← Single dimension row in scorecard
└── hooks/
    └── useProjectReview.ts                   ← API call + state management for review
```

Existing files to modify:
- `functions/src/index.ts` — add `reviewproject` Cloud Function + system prompt constants
- `firebase.json` — add rewrite for `/api/review-project`
- `src/lib/database.ts` — modify `submitProject()` to call review API instead of auto-completing
- `src/pages/app/AppProjectProof.tsx` — integrate scorecard UI, processing indicator, resubmission flow
- `src/components/app/journey/project/SubmissionControls.tsx` — handle review loading state and error recovery

---

## 10. Interactions & Animations

### Scorecard reveal
After the review API returns, the scorecard fades in:
- Card: `opacity: 0 → 1`, `transform: translateY(8px) → translateY(0)`, duration 0.4s, ease
- Dimension rows stagger: each row delays 80ms after the previous
- Summary section: delays 320ms (after all four rows)
- Result banner: delays 400ms, slight scale-up: `transform: scale(0.98) → scale(1)`

### Status indicator transitions
The status circles (strong/developing/needs_attention) fade in with the dimension row. No additional animation.

### Edit & Resubmit transition
When the learner clicks "Edit & Resubmit":
- Form fields transition from read-only to editable: borders fade in over 0.2s
- Submit button fades in below the form: `opacity: 0 → 1`, 0.2s
- Scroll smoothly to the first form card

### Processing indicator
Step labels cycle with a cross-fade: current step fades out (0.15s), next step fades in (0.15s). Teal spinner rotates continuously.

---

## 11. Developer Notes

- **The review API sends images inline in the message content array.** This is the standard OpenRouter/OpenAI vision format where the `content` field is an array of `{type: "text", text: "..."}` and `{type: "image_url", image_url: { url: "data:image/jpeg;base64,..." }}` objects. Verify that `fetchWithRetry` in `functions/src/gemini.ts` doesn't modify the messages structure before sending.

- **Temperature 0.4** is intentional. We want some variation in feedback language (so learners don't get identical boilerplate on resubmission) but not so much that evaluation criteria drift. 0.4 is the sweet spot for consistent-but-varied evaluative output.

- **The `response_format: { type: "json_object" }` parameter** forces JSON output from the model. This is supported by OpenRouter for Claude models. If it causes issues, fall back to the `cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()` pattern used in other endpoints.

- **Client-side image resize is critical.** Without it, sending 5 raw screenshots from a retina display could easily exceed 30MB. The resize function should run before base64 encoding, not after.

- **The review scorecard data is stored as JSONB in `review_dimensions`.** When reading it back from the database, parse it as `ReviewProjectResponse["dimensions"]` — no additional parsing needed since Supabase returns JSONB as parsed objects.

- **On resubmission, the review columns are overwritten.** There is no review history table. This is intentional — keeping things simple for now. If review history is needed later, it's a separate migration and PRD.

- **The processing indicator should NOT show a fake progress bar.** The review takes a variable amount of time (3–10 seconds depending on screenshot count). Use cycling step labels, not a percentage bar, to avoid the "stuck at 90%" antipattern.

- **No `console.log` statements** in final output.

- **Error recovery is important.** If the review API fails mid-submission, the user's draft must not be lost. The `submitProject` function should revert status to `'draft'` on failure. The form should still be pre-filled with all their data.

---

## 12. Acceptance Criteria

Before marking this PRD complete, verify:

**Cloud Function:**
- [ ] `/api/review-project` endpoint is accessible and returns 200 on valid requests
- [ ] Endpoint handles missing fields with a 400 error
- [ ] Endpoint handles API key not configured with a 503 error
- [ ] Endpoint handles OpenRouter errors (429, 500) with appropriate retryable responses
- [ ] Timeout is set to 60 seconds
- [ ] Firebase rewrite is configured in `firebase.json`
- [ ] Function is deployed and working in the live environment

**Review quality:**
- [ ] Review response contains exactly 4 dimensions with correct IDs
- [ ] Each dimension has a status of `strong`, `developing`, or `needs_attention`
- [ ] Each dimension's feedback references specific content from the submission (not generic)
- [ ] Summary is 1–3 sentences long
- [ ] Encouragement identifies a specific positive aspect
- [ ] `overallPassed` is `true` when all dimensions are `strong` or `developing`
- [ ] `overallPassed` is `false` when any dimension is `needs_attention`

**Screenshot analysis:**
- [ ] Screenshots are sent as base64 data URIs to the API
- [ ] Client-side resize runs before encoding (max 1600px dimension)
- [ ] Evidence quality feedback references visual content from screenshots
- [ ] Multiple screenshots (up to 5) are handled correctly
- [ ] Submissions without screenshots (L1) are reviewed without error

**Scorecard UI:**
- [ ] Scorecard renders in Zone 4 after review completes
- [ ] All four dimension rows display with correct icons, names, and status indicators
- [ ] Status indicators use correct visual treatment (filled/half/outlined circles)
- [ ] Feedback text is specific to the submission
- [ ] Summary and encouragement render below the dimensions
- [ ] Passed banner shows with check icon and success message
- [ ] Needs-revision banner shows with alert icon and "Edit & Resubmit" button
- [ ] Stagger animation plays correctly on scorecard reveal

**Submission flow:**
- [ ] Clicking "Submit for Review" calls the review API (not auto-complete)
- [ ] Processing indicator shows during API call with cycling step labels
- [ ] On pass: status set to `passed`, `project_completed` set to `true`, scorecard + passed banner rendered
- [ ] On needs-revision: status set to `needs_revision`, scorecard + revision banner rendered, `project_completed` remains `false`
- [ ] On API error: status reverted to `draft`, error message shown, form remains editable

**Resubmission:**
- [ ] "Edit & Resubmit" button puts form back into editable mode
- [ ] Scorecard remains visible above the form during editing
- [ ] Resubmitting triggers a new review API call
- [ ] New review results overwrite the previous review data
- [ ] Submission can go from `needs_revision` → `submitted` → `passed`
- [ ] No limit on number of resubmissions

**Integration:**
- [ ] My Journey level card status badge updates correctly after review
- [ ] My Progress project column reflects current review status
- [ ] AppContext `projectSubmissions` refreshes after review completes
- [ ] Four-activity tracker on My Journey updates when project passes

**General:**
- [ ] No TypeScript errors on build
- [ ] No console errors in browser
- [ ] All existing PRD 01–05, PRD 16, and PRD 17 functionality continues to work (no regressions)
- [ ] Submissions that passed under PRD 17's auto-complete continue to show as passed (backwards compatible)
