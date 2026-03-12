import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { callGemini, fetchWithRetry, callOpenRouterRaw } from "./gemini";

const openRouterApiKey = defineSecret("OPEN_ROUTER_API");
// Note: All API calls go through OpenRouter. Use the appropriate model ID
// (e.g. "anthropic/claude-sonnet-4-20250514") to access different providers.

function getEnv() {
  const apiKey = openRouterApiKey.value();
  const model = process.env.GEMINI_MODEL || "google/gemini-2.0-flash-001";
  return { apiKey, model };
}

// ═══════════════════════════════════════════════════════════════
// 1. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

export const health = onRequest({ secrets: [openRouterApiKey] }, (_req, res) => {
  res.status(200).json({
    status: "ok",
    hasApiKey: !!openRouterApiKey.value(),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. ENHANCE PROMPT
// ═══════════════════════════════════════════════════════════════

const ENHANCE_PROMPT_SYSTEM = `You are the OXYGY Prompt Engineering Coach — an expert in transforming raw, unstructured prompts into well-engineered, structured prompts that produce dramatically better AI outputs.

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

You must respond in the following JSON format ONLY — no markdown, no extra text, no code fences:

{
  "role": "The enhanced Role section text",
  "context": "The enhanced Context section text",
  "task": "The enhanced Task section text",
  "format": "The enhanced Format & Structure section text",
  "steps": "The enhanced Steps & Process section text",
  "quality": "The enhanced Quality Checks section text"
}`;

export const enhanceprompt = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { mode, prompt, wizardAnswers } = req.body;
    let userMessage: string;
    if (mode === "enhance") {
      userMessage = prompt;
    } else {
      const wa = wizardAnswers;
      const formatText = [...(wa.formatChips || []), wa.formatCustom || ""].filter(Boolean).join(", ") || "Not specified";
      const qualityText = [...(wa.qualityChips || []), wa.qualityCustom || ""].filter(Boolean).join(", ") || "Not specified";
      userMessage = `The user wants to build a prompt with the following inputs:\n\nRole: ${wa.role || "Not specified"}\nContext: ${wa.context || "Not specified"}\nTask: ${wa.task || "Not specified"}\nFormat preferences: ${formatText}\nSteps: ${wa.steps || "Not specified"}\nQuality constraints: ${qualityText}\n\nPlease enhance and expand each section into a polished, comprehensive prompt following The Prompt Blueprint framework.`;
    }

    const result = await callGemini({ apiKey, model, systemPrompt: ENHANCE_PROMPT_SYSTEM, userMessage, label: "enhance-prompt" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("enhance-prompt error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 3. SUMMARIZE ROLE
// ═══════════════════════════════════════════════════════════════

const SUMMARIZE_ROLE_SYSTEM = `You are a concise profile summarizer. Given a user's role description, produce a short professional title (max 8 words). Return ONLY the title text, nothing else. Examples:
- Input: "I'm the Head of the AI Centre of Excellence. My goal is to improve the adoption of AI within the organisation, upscale the rest of the team..."
- Output: "Head of AI Centre of Excellence"
- Input: "I work as a marketing manager and I'm responsible for digital campaigns and brand strategy across EMEA"
- Output: "Marketing Manager — Digital & Brand Strategy"
- Input: "Software engineer focused on backend APIs and data pipelines for our analytics platform"
- Output: "Backend Engineer — Analytics Platform"`;

export const summarizerole = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { role } = req.body;
    if (!role || typeof role !== "string" || role.trim().length < 10) {
      res.status(400).json({ error: "Role text too short to summarize" }); return;
    }

    const openRouterModel = model.startsWith("google/") ? model : `google/${model}`;
    const geminiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: "system", content: SUMMARIZE_ROLE_SYSTEM },
          { role: "user", content: role },
        ],
        temperature: 0.2,
        max_tokens: 30,
      }),
    });

    if (!geminiResponse.ok) {
      console.error("OpenRouter API error (summarize-role):", geminiResponse.status);
      res.status(502).json({ error: "AI service unavailable" }); return;
    }

    const data = await geminiResponse.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ summary });
  } catch (err) {
    console.error("summarize-role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 4. DESIGN AGENT
// ═══════════════════════════════════════════════════════════════

const DESIGN_AGENT_SYSTEM = `You are the OXYGY Agent Design Advisor — an expert in helping people design effective, reusable, and accountable AI agents for professional use.

You will receive a description of a task that a user wants to build an AI agent for, and optionally a description of the input data that agent will process.

You must respond with a JSON object containing exactly 5 sections:

SECTION 1: AGENT READINESS ASSESSMENT
Evaluate the task against 5 criteria to determine if it warrants a custom agent:
- Frequency: How often is this task likely performed? (Score 0-100)
- Consistency: Does the output need the same structure each time? (Score 0-100)
- Shareability: Would others on the team benefit from this same tool? (Score 0-100)
- Complexity: Does it require domain expertise or multi-step reasoning? (Score 0-100)
- Standardization Risk: Would variable outputs cause downstream problems? (Score 0-100)

Calculate an overall score (weighted average — Frequency 20%, Consistency 25%, Shareability 20%, Complexity 15%, Standardization Risk 20%).

Provide a verdict, a rationale paragraph, and specific bullet points for why Level 1 ad-hoc prompting might suffice vs. why a Level 2 custom agent is recommended.

SECTION 2: OUTPUT FORMAT DESIGN
Based on the task, design a structured output format in two representations:
a) A human-readable version — formatted as clean, professional output that a team member would want to read.
b) A JSON template — the exact JSON schema that the agent should produce.

SECTION 3: SYSTEM PROMPT
Generate a complete, ready-to-use system prompt for this agent that incorporates:
- A clear role definition
- Context about the task and domain
- Explicit task instructions
- The JSON output format from Section 2
- Step-by-step processing instructions
- Quality checks and constraints
- Human-in-the-loop requirements from Section 4

Mark each section with labels: [ROLE], [CONTEXT], [TASK], [OUTPUT FORMAT], [STEPS], [QUALITY CHECKS].

SECTION 4: BUILT-IN ACCOUNTABILITY FEATURES
Design 3-5 specific features built into the agent's prompt to actively support human oversight. Each must include: name, severity (critical/important/recommended), what_to_verify, why_it_matters, prompt_instruction.

SECTION 5: REFINEMENT QUESTIONS
Generate 3-5 specific follow-up questions that would help refine and improve the agent design. These should probe for missing context about the user's specific situation — audience, constraints, edge cases, data quirks, quality standards, etc. Make each question specific to the task described, not generic.

If the user message starts with [REFINEMENT], they are providing answers to previous questions plus additional context. Use this to significantly improve the agent design. Generate new, deeper refinement questions that build on what was already answered.

RESPONSE FORMAT (JSON only, no markdown):

{
  "readiness": {
    "overall_score": 85,
    "verdict": "Strong candidate for a custom agent",
    "rationale": "...",
    "criteria": {
      "frequency": { "score": 90, "assessment": "..." },
      "consistency": { "score": 85, "assessment": "..." },
      "shareability": { "score": 80, "assessment": "..." },
      "complexity": { "score": 75, "assessment": "..." },
      "standardization_risk": { "score": 90, "assessment": "..." }
    },
    "level1_points": ["..."],
    "level2_points": ["..."]
  },
  "output_format": {
    "human_readable": "...",
    "json_template": {}
  },
  "system_prompt": "...",
  "accountability": [
    { "name": "...", "severity": "critical", "what_to_verify": "...", "why_it_matters": "...", "prompt_instruction": "..." }
  ],
  "refinement_questions": [
    "Specific question about the user's audience, constraints, or edge cases (3-5 required)",
    "Another specific question probing for missing context",
    "Another specific question about quality standards or data quirks"
  ]
}

CRITICAL RULES:
- The "refinement_questions" array is REQUIRED and must contain 3-5 task-specific questions. Never omit it.
- Each refinement question must be specific to the user's task (e.g., "What format are the survey responses in — Excel, CSV, or a database export?" not "What is your data format?").
- Do NOT add preamble, commentary, or explanation outside the JSON object.`;

export const designagent = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { task_description, input_data_description } = req.body;
    const userMessage = `Task Description: ${task_description}\n\nInput Data Description: ${input_data_description || "Not specified"}`;

    const result = await callGemini({ apiKey, model, systemPrompt: DESIGN_AGENT_SYSTEM, userMessage, label: "design-agent" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("design-agent error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 5. DESIGN WORKFLOW
// ═══════════════════════════════════════════════════════════════

const WORKFLOW_PATH_A = `You are the OXYGY Workflow Architect — an expert in designing AI-powered automation workflows. You help users map their business processes into structured, multi-step workflows using a node-based system.

You will receive a description of a process the user wants to automate, and optionally a description of their existing tools and systems.

Your job is to design an optimal workflow using nodes from three layers:

LAYER 1 — DATA INPUT NODES:
input-excel, input-gsheets, input-webhook, input-api, input-form, input-email, input-schedule, input-database, input-file, input-crm, input-chat, input-transcript

LAYER 2 — PROCESSING NODES:
proc-ai-agent, proc-ai-loop, proc-text-extract, proc-code, proc-mapper, proc-filter, proc-merge, proc-sentiment, proc-classifier, proc-summarizer, proc-translate, proc-validator, proc-human-review

LAYER 3 — DATA OUTPUT NODES:
output-excel, output-gsheets, output-database, output-email, output-slack, output-pdf, output-word, output-pptx, output-api, output-crm, output-dashboard, output-notification, output-calendar, output-kb

RULES:
- Every workflow must have at least one node from each layer
- Workflows typically have 4-10 nodes total
- Include a proc-human-review node whenever AI output feeds directly into client-facing, decision-critical, or externally shared deliverables

RESPONSE FORMAT (JSON only):
{
  "workflow_name": "...",
  "workflow_description": "...",
  "nodes": [
    { "id": "node-1", "node_id": "input-form", "name": "Survey Submission", "custom_description": "...", "layer": "input" }
  ]
}`;

const WORKFLOW_PATH_B = `You are the OXYGY Workflow Reviewer — an expert in evaluating and improving AI-powered automation workflows.

You will receive the user's manually-built workflow and optionally their rationale. Review and suggest improvements (add, remove, reorder, or keep unchanged).

AVAILABLE NODES: Same as the Workflow Architect (input-*, proc-*, output-*).

RESPONSE FORMAT (JSON only):
{
  "overall_assessment": "...",
  "suggested_workflow": [
    { "id": "node-1", "node_id": "...", "name": "...", "custom_description": "...", "layer": "...", "status": "unchanged|added|removed" }
  ],
  "changes": [
    { "type": "added|removed|reordered", "node_id": "...", "node_name": "...", "rationale": "..." }
  ]
}`;

export const designworkflow = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { mode, task_description, tools_and_systems, user_workflow, user_rationale } = req.body;
    const systemPrompt = mode === "auto_generate" ? WORKFLOW_PATH_A : WORKFLOW_PATH_B;

    let userMessage: string;
    if (mode === "auto_generate") {
      userMessage = `Process to automate: ${task_description}\n\nExisting tools and systems: ${tools_and_systems || "Not specified"}`;
    } else {
      const nodeList = (user_workflow || [])
        .map((n: { id: string; node_id: string; name: string; layer: string }) => `  ${n.id}: ${n.node_id} ("${n.name}") [${n.layer}]`)
        .join("\n");
      userMessage = `Process to automate: ${task_description}\n\nExisting tools and systems: ${tools_and_systems || "Not specified"}\n\nUser's workflow:\n${nodeList}\n\nUser's design rationale: ${user_rationale || "Not provided"}`;
    }

    const result = await callGemini({ apiKey, model, systemPrompt, userMessage, label: "design-workflow" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("design-workflow error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 6. ANALYZE ARCHITECTURE
// ═══════════════════════════════════════════════════════════════

const ARCHITECTURE_SYSTEM = `You are the OXYGY AI Build Plan Advisor — an expert in helping business professionals plan AI-powered applications using a 5-tool development pipeline.

You will receive a user's project details including their app description, target users and problem, data/feature needs, and technical comfort level. Generate a personalized build plan for their specific project.

THE 5-TOOL PIPELINE:
1. Google AI Studio — Rapid prototyping
2. GitHub — Version control and collaboration
3. Claude Code — AI-powered development tool
4. Supabase — Database, authentication, and backend infrastructure
5. Vercel — Deployment platform

For each tool, generate: classification (essential/recommended/optional), forYourProject, howToApproach, tips (array of 3), levelConnection, connectedLevels.

Respond with ONLY JSON — no markdown, no extra text.`;

export const analyzearchitecture = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { appDescription, problemAndUsers, dataAndContent, technicalLevel } = req.body;
    const techLabels: Record<string, string> = {
      "non-technical": "Non-technical (never written code, not planning to)",
      "semi-technical": "Semi-technical (comfortable with no-code tools, can follow technical instructions)",
      "technical": "Technical (some coding experience or willing to learn)",
    };
    const userMessage = [
      `APP DESCRIPTION:\n${appDescription || "Not provided"}`,
      `PROBLEM & USERS:\n${problemAndUsers || "Not provided"}`,
      `DATA & KEY FEATURES:\n${dataAndContent || "Not provided"}`,
      `TECHNICAL COMFORT LEVEL: ${techLabels[technicalLevel || ""] || technicalLevel || "Not specified"}`,
    ].join("\n\n");

    const result = await callGemini({ apiKey, model, systemPrompt: ARCHITECTURE_SYSTEM, userMessage, label: "analyze-architecture" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("analyze-architecture error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 7. ANALYZE INSIGHT
// ═══════════════════════════════════════════════════════════════

const INSIGHT_SYSTEM = `You are an AI Upskilling Coach for the OXYGY AI Centre of Excellence. You analyze how learners apply AI in their work and give concise, actionable feedback.

CRITICAL RULE — QUALITY GATE:
Before providing analysis, assess whether the learner has given enough meaningful information. If too vague, nonsensical, or too short (<15 words), respond with the clarification format instead.

RESPONSE FORMAT — Choose ONE:

FORMAT A (needs clarification):
{ "needsClarification": true, "clarificationMessage": "...", "useCaseSummary": "", "nextLevelTranslation": "", "considerations": [], "nextSteps": "" }

FORMAT B (full analysis):
{ "needsClarification": false, "useCaseSummary": "...", "nextLevelTranslation": "...", "considerations": ["...", "..."], "nextSteps": "..." }

RULES: Keep text concise. No filler. Be direct and useful. Respond in valid JSON only.`;

export const analyzeinsight = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { level, topic, context, outcome, rating, userProfile } = req.body;
    const profileContext = userProfile
      ? `\n\nLearner Profile:\n- Role: ${userProfile.role || "Not specified"}\n- Function: ${userProfile.function || "Not specified"}\n- Seniority: ${userProfile.seniority || "Not specified"}\n- AI Experience Level: ${userProfile.aiExperience || "Not specified"}`
      : "";
    const userMessage = `Please analyze this AI application insight:\n\nLevel: ${level}\nTopic: ${topic}\nContext: ${context}\nOutcome: ${outcome}\nSelf-assessed Impact Rating: ${rating}/5${profileContext}`;

    const result = await callGemini({ apiKey, model, systemPrompt: INSIGHT_SYSTEM, userMessage, label: "analyze-insight" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("analyze-insight error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 8. GENERATE PATHWAY
// ═══════════════════════════════════════════════════════════════

const PATHWAY_SYSTEM = `You are a learning pathway designer for OXYGY's AI Centre of Excellence. You generate personalized, project-based learning pathways for professionals who want to develop AI skills.

Your outputs must be practical, role-specific, empathetic, and connected. You generate content in strict JSON format. Never include markdown, backticks, or preamble outside the JSON object.

CRITICAL: In the "challengeConnection" field for EVERY level, you MUST directly reference and quote specific details from the user's stated challenge.

IMPORTANT: Level 1 and Level 2 are MANDATORY — always "full" or "fast-track", never "awareness" or "skip". Only Levels 3, 4, and 5 may be "awareness" or "skip".

Generate content ONLY for levels classified as "full" or "fast-track".

OUTPUT FORMAT (JSON only):
{
  "pathwaySummary": "...",
  "totalEstimatedWeeks": number,
  "levels": {
    "L1": { "depth": "full|fast-track", "projectTitle": "...", "projectDescription": "...", "deliverable": "...", "challengeConnection": "...", "sessionFormat": "...", "resources": [{ "name": "...", "note": "..." }] }
  }
}`;

export const generatepathway = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { formData, levelDepths } = req.body;

    const ambitionLabels: Record<string, string> = {
      "confident-daily-use": "Confident daily AI use",
      "build-reusable-tools": "Build reusable AI tools",
      "own-ai-processes": "Design and own AI-powered processes",
      "build-full-apps": "Build full AI-powered applications",
    };
    const experienceLabels: Record<string, string> = {
      "beginner": "Beginner — rarely uses AI tools",
      "comfortable-user": "Comfortable User — uses ChatGPT or similar regularly",
      "builder": "Builder — has created custom GPTs, agents, or prompt templates",
      "integrator": "Integrator — has designed AI-powered workflows or multi-step pipelines",
    };

    const userMessage = `Generate a personalized learning pathway for the following professional.

## LEARNER PROFILE
- Role: ${formData.role || "Not specified"}
- Function: ${formData.function === "Other" ? formData.functionOther : formData.function || "Not specified"}
- Seniority: ${formData.seniority || "Not specified"}
- AI Experience: ${experienceLabels[formData.aiExperience] || formData.aiExperience || "Not specified"}
- Ambition: ${ambitionLabels[formData.ambition] || formData.ambition || "Not specified"}
- Specific Challenge: "${formData.challenge || "Not specified"}"
- Weekly Availability: ${formData.availability || "Not specified"}${formData.experienceDescription ? `\n- AI Experience Details: "${formData.experienceDescription}"` : ""}${formData.goalDescription ? `\n- Specific Goal: "${formData.goalDescription}"` : ""}

## LEVEL CLASSIFICATIONS
- Level 1: ${levelDepths.L1}
- Level 2: ${levelDepths.L2}
- Level 3: ${levelDepths.L3}
- Level 4: ${levelDepths.L4}
- Level 5: ${levelDepths.L5}`;

    const result = await callGemini({ apiKey, model, systemPrompt: PATHWAY_SYSTEM, userMessage, label: "generate-pathway" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("generate-pathway error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 9. DESIGN DASHBOARD
// ═══════════════════════════════════════════════════════════════

const DASHBOARD_HTML_FALLBACK = `You are an elite UI designer AND data strategist creating stunning, modern dashboard mockups. Your dashboards should look like they belong on Dribbble or Behance.

METRIC REQUIREMENTS: Include EVERY metric the user listed. Infer 3-5 additional relevant metrics.

DESIGN AESTHETIC: MINIMAL and AIRY. Font: 'DM Sans'. Background: #F8FAFC. Cards: white, border-radius: 16px, border: 1px solid #E2E8F0. Colors: Primary #38B2AC, Secondary #5B6DC2, Accent #D47B5A. NO sidebars, NO navigation menus, NO buttons.

RESPONSE FORMAT (JSON only):
{ "image_url": "", "image_prompt": "...", "html_content": "<!DOCTYPE html><html>...</html>" }

The html_content MUST fit inside a 1100x700px iframe WITHOUT scrolling.`;

const DASHBOARD_INSPIRATION = `You are an expert UI/UX analyst specializing in dashboard and application design. Analyze the provided screenshot(s) and extract a comprehensive design brief. You MUST respond with valid JSON only — no markdown, no code fences, no explanation.

JSON schema:
{
  "color_scheme": {
    "primary": "<hex>",
    "secondary": "<hex>",
    "accent": "<hex>",
    "background": "<hex>",
    "card_background": "<hex>",
    "text_primary": "<hex>",
    "text_secondary": "<hex>",
    "palette_description": "<1 sentence describing the overall color mood — e.g. 'warm earth tones with a teal accent' or 'dark mode with neon highlights'>"
  },
  "composition": "<Describe the spatial layout: grid structure, column count, header/sidebar presence, card arrangement, visual hierarchy, whitespace balance, and how sections flow top-to-bottom or left-to-right>",
  "components": ["<list each distinct UI element: KPI cards, line charts, bar charts, donut charts, tables, progress bars, avatars, stat badges, sparklines, heatmaps, maps, calendar widgets, etc.>"],
  "typography": "<Font style observations: serif/sans-serif, weight contrasts, heading vs body sizing, letter-spacing, uppercase labels>",
  "visual_effects": "<Border radius style, shadow depth, gradients, glassmorphism, divider lines, iconography style, micro-interactions implied by the design>",
  "data_density": "<low | medium | high — how much information is packed per viewport>",
  "design_instructions": "<A 3-5 sentence paragraph combining all the above into actionable design instructions for generating a similar mockup. Emphasise the COLOR SCHEME prominently — state exact hex values and where each color is used. Then describe layout, component types, and overall aesthetic.>"
}

IMPORTANT: The color_scheme is the MOST critical extraction. Users provide inspiration images primarily because they want the generated mockup to match or echo the reference palette. Extract exact hex values by sampling dominant colors from the image. If you cannot determine an exact hex, estimate the closest value.`;

const DASHBOARD_REFINEMENT = `You are an expert at refining image generation prompts for dashboard mockups. Produce a NEW, complete prompt that incorporates user feedback while keeping all good parts of the original. Output ONLY the refined prompt text.`;

function parseInspirationImage(img: string): { inlineData: { mimeType: string; data: string } } | null {
  if (!img.startsWith("data:")) return null;
  const commaIdx = img.indexOf(",");
  if (commaIdx === -1) return null;
  const header = img.slice(5, commaIdx);
  const semiIdx = header.indexOf(";");
  if (semiIdx === -1) return null;
  const mimeType = header.slice(0, semiIdx);
  const data = img.slice(commaIdx + 1);
  if (!mimeType.startsWith("image/") || !data) return null;
  return { inlineData: { mimeType, data } };
}

export const designdashboard = onRequest({ secrets: [openRouterApiKey], timeoutSeconds: 120 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model: textModel } = getEnv();
  const imageModel = process.env.DASHBOARD_MODEL || "google/gemini-3.1-flash-image-preview";
  if (!apiKey) { res.status(503).json({ error: "API key not configured", use_fallback: true }); return; }

  try {
    const {
      user_needs, target_audience, key_metrics, data_sources,
      dashboard_type, visual_style, inspiration_url,
      refinement_feedback, previous_prompt, inspiration_images,
    } = req.body;

    const styleDesc = visual_style === "data-dense" ? "data-dense with maximum information density"
      : visual_style === "executive-polished" ? "executive and polished with large KPI cards"
      : visual_style === "colorful-visual" ? "colorful and visual with bold infographic style"
      : "clean and minimal with lots of whitespace";

    // Analyze inspiration images if provided
    let inspirationPatterns = "";
    if (inspiration_images && Array.isArray(inspiration_images) && inspiration_images.length > 0) {
      try {
        const imageParts = inspiration_images.map(parseInspirationImage).filter(Boolean);
        const openRouterModel = textModel.startsWith("google/") ? textModel : `google/${textModel}`;
        if (imageParts.length > 0) {
          const imageUrls = imageParts.map((p: any) => ({
            type: "image_url",
            image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` },
          }));
          const analyzeResponse = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: openRouterModel,
              messages: [
                { role: "system", content: DASHBOARD_INSPIRATION },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Analyze these screenshot(s) and extract the design traits as JSON. Pay special attention to the exact color palette used:" },
                    ...imageUrls,
                  ],
                },
              ],
              temperature: 0.3,
            }),
          }, "dashboard-inspiration");
          if (analyzeResponse.ok) {
            const analyzeData = await analyzeResponse.json();
            const rawPatterns = analyzeData?.choices?.[0]?.message?.content || "";
            if (rawPatterns.trim()) {
              // Try to parse structured JSON response
              try {
                const cleaned = rawPatterns.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
                const parsed = JSON.parse(cleaned);
                // Build a rich design reference from the structured analysis
                const cs = parsed.color_scheme || {};
                const colorBlock = cs.primary
                  ? `COLOR SCHEME: primary=${cs.primary}, secondary=${cs.secondary || "N/A"}, accent=${cs.accent || "N/A"}, background=${cs.background || "#FFFFFF"}, card_bg=${cs.card_background || "#FFFFFF"}, text=${cs.text_primary || "#1A202C"}. ${cs.palette_description || ""}`
                  : "";
                const parts = [
                  colorBlock,
                  parsed.composition ? `LAYOUT: ${parsed.composition}` : "",
                  parsed.components?.length ? `COMPONENTS: ${parsed.components.join(", ")}` : "",
                  parsed.typography ? `TYPOGRAPHY: ${parsed.typography}` : "",
                  parsed.visual_effects ? `VISUAL STYLE: ${parsed.visual_effects}` : "",
                  parsed.data_density ? `DATA DENSITY: ${parsed.data_density}` : "",
                  parsed.design_instructions ? `INSTRUCTIONS: ${parsed.design_instructions}` : "",
                ].filter(Boolean);
                inspirationPatterns = parts.join("\n");
              } catch {
                // Fallback: use raw text if JSON parse fails
                inspirationPatterns = rawPatterns.trim();
              }
            }
          }
        }
      } catch (analyzeErr) {
        console.log("Inspiration analysis error, continuing without it:", analyzeErr);
      }
    }

    // Build image generation prompt
    let imagePrompt: string;
    if (refinement_feedback && previous_prompt) {
      const refinementModel = textModel.startsWith("google/") ? textModel : `google/${textModel}`;
      const inspirationContext = inspirationPatterns ? `\n\nDESIGN REFERENCE: ${inspirationPatterns}` : "";
      const refinementResponse = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: refinementModel,
          messages: [
            { role: "system", content: DASHBOARD_REFINEMENT },
            { role: "user", content: `ORIGINAL PROMPT:\n${previous_prompt}\n\nUSER FEEDBACK:\n${refinement_feedback}${inspirationContext}\n\nGenerate the refined prompt:` },
          ],
          temperature: 0.4,
        }),
      }, "dashboard-refinement");

      if (refinementResponse.ok) {
        const refinementData = await refinementResponse.json();
        const refinedText = refinementData?.choices?.[0]?.message?.content || "";
        imagePrompt = refinedText.trim() || `${previous_prompt} IMPORTANT CHANGES REQUESTED: ${refinement_feedback}`;
      } else {
        imagePrompt = `${previous_prompt} IMPORTANT CHANGES REQUESTED: ${refinement_feedback}`;
      }
    } else {
      const defaultColors = inspirationPatterns ? "" : " Teal and navy color scheme.";
      imagePrompt = `Generate a high-fidelity professional dashboard UI screenshot mockup for ${target_audience || "business users"}. The dashboard shows: ${key_metrics || "key business metrics"}. Purpose: ${user_needs}. Style: ${styleDesc}. ${dashboard_type ? `Type: ${dashboard_type}.` : ""} Modern flat design.${defaultColors} DM Sans font. Make ALL text crisp and readable. 16:9 aspect ratio.${inspirationPatterns ? `\n\nDESIGN REFERENCE (match this palette and style closely):\n${inspirationPatterns}` : ""}`;
    }

    // Strategy 1: Try image generation with Nano Banana 2
    const imgModel = imageModel.startsWith("google/") ? imageModel : `google/${imageModel}`;
    console.log("Strategy 1: Attempting image generation with", imgModel);

    try {
      const imageResponse = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: imgModel,
          messages: [{ role: "user", content: imagePrompt }],
          temperature: 0.7,
        }),
      }, "dashboard-image");

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const message = imageData?.choices?.[0]?.message;

        // OpenRouter returns images in message.images array
        const images = message?.images;
        if (Array.isArray(images) && images.length > 0) {
          const imagePart = images.find((p: any) => p.type === "image_url" && p.image_url?.url);
          if (imagePart) {
            console.log("Image generated successfully via Nano Banana 2");
            res.status(200).json({ image_url: imagePart.image_url.url, image_prompt: imagePrompt, generation_method: "gemini-image", ...(inspirationPatterns ? { inspiration_analysis: inspirationPatterns } : {}) });
            return;
          }
        }

        // Also check content array (alternative format)
        const content = message?.content;
        if (Array.isArray(content)) {
          const contentImg = content.find((p: any) => p.type === "image_url" && p.image_url?.url);
          if (contentImg) {
            res.status(200).json({ image_url: contentImg.image_url.url, image_prompt: imagePrompt, generation_method: "gemini-image", ...(inspirationPatterns ? { inspiration_analysis: inspirationPatterns } : {}) });
            return;
          }
        }

        console.log("Image model responded but no image found, falling back to HTML");
      } else {
        console.log("Image generation failed with status", imageResponse.status, ", falling back to HTML");
      }
    } catch (imgErr) {
      console.log("Image generation error, falling back to HTML:", imgErr);
    }

    // Strategy 2: Fall back to HTML dashboard generation
    console.log("Strategy 2: Generating HTML dashboard with", textModel);
    const userMessage = [
      `DASHBOARD PURPOSE: ${user_needs}`,
      target_audience ? `TARGET AUDIENCE: ${target_audience}` : "",
      key_metrics ? `KEY METRICS: ${key_metrics}` : "",
      data_sources ? `DATA SOURCES: ${data_sources}` : "",
      dashboard_type ? `DASHBOARD TYPE: ${dashboard_type}` : "",
      visual_style ? `VISUAL STYLE: ${visual_style}` : "",
      inspiration_url ? `INSPIRATION URL: ${inspiration_url}` : "",
    ].filter(Boolean).join("\n");

    const result = await callGemini({ apiKey, model: textModel, systemPrompt: DASHBOARD_HTML_FALLBACK, userMessage, label: "dashboard-html" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, use_fallback: true, retryable: result.retryable }); return; }
    result.data.generation_method = "html";
    res.status(200).json(result.data);
  } catch (err) {
    console.error("design-dashboard error:", err);
    res.status(500).json({ error: "Internal server error", use_fallback: true, retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 10. EVALUATE APP (Level 5 — AI App Evaluator)
// ═══════════════════════════════════════════════════════════════

const EVALUATE_APP_SYSTEM = `You are the OXYGY AI Application Evaluator — an expert in assessing AI-powered application designs and producing actionable product specifications.

You will receive a description of an AI application the user wants to build, including what it does, who it serves, and what data it uses.

You must respond with a JSON object containing exactly 4 sections:

SECTION 1: DESIGN SCORE
Evaluate the application design across 5 criteria:
- User Clarity: How well-defined are the user roles, needs, and journeys? (Score 0-100)
- Data Architecture: How clear and feasible is the data model, storage, and flow? (Score 0-100)
- Personalisation: How well does the design incorporate user-specific experiences? (Score 0-100)
- Technical Feasibility: How realistic is the proposed architecture with available tools? (Score 0-100)
- Scalability: How well would this design handle growth in users, data, or features? (Score 0-100)

Calculate an overall score (weighted average — User Clarity 25%, Data Architecture 25%, Personalisation 15%, Technical Feasibility 20%, Scalability 15%).

Provide a verdict, a rationale paragraph explaining the score.

SECTION 2: ARCHITECTURE & COMPONENTS
Break the application into its core components. For each component, provide:
- name: Component name (e.g., "Authentication Layer", "Content Engine", "Analytics Dashboard")
- description: What this component does and why it's needed
- tools: Array of recommended tools/technologies (e.g., ["Supabase Auth", "Row-Level Security"])
- level_connection: Which OXYGY level (1-5) this component most relates to
- priority: "essential" | "recommended" | "optional"

Include 4-8 components. Always include authentication, core AI logic, data storage, and user interface.

SECTION 3: IMPLEMENTATION PLAN
Break the build into phased steps. For each step:
- phase: Phase name (e.g., "Phase 1: Foundation & Scaffold")
- description: What happens in this phase
- tasks: Array of specific tasks (3-6 per phase)
- duration_estimate: Realistic time estimate (e.g., "1-2 weeks")
- dependencies: Array of phases this depends on (empty array for Phase 1)

Include 3-5 phases covering the full build from scaffold to deployment.

SECTION 4: RISKS & GAPS
Identify 3-5 potential risks or gaps in the design. For each:
- name: Short risk name
- severity: "high" | "medium" | "low"
- description: What the risk is and why it matters
- mitigation: Specific strategy to address this risk

Include at least one risk from each severity level when possible.

Provide a summary sentence for each of sections 2, 3, and 4.

SECTION 5: REFINEMENT QUESTIONS
Generate 3-5 follow-up questions that would help you produce a significantly improved evaluation if the user answered them. Questions must be specific to the user's particular application — not generic. Reference their app name, domain, or specific features in the questions.

RESPONSE FORMAT (JSON only, no markdown):

{
  "design_score": {
    "overall_score": 75,
    "verdict": "Promising design with solid user clarity",
    "rationale": "...",
    "criteria": {
      "user_clarity": { "score": 85, "assessment": "..." },
      "data_architecture": { "score": 70, "assessment": "..." },
      "personalisation": { "score": 65, "assessment": "..." },
      "technical_feasibility": { "score": 80, "assessment": "..." },
      "scalability": { "score": 60, "assessment": "..." }
    }
  },
  "architecture": {
    "summary": "Your application requires 6 core components...",
    "components": [
      { "name": "...", "description": "...", "tools": ["..."], "level_connection": 1, "priority": "essential" }
    ]
  },
  "implementation_plan": {
    "summary": "A 4-phase build over approximately 6-8 weeks...",
    "steps": [
      { "phase": "...", "description": "...", "tasks": ["..."], "duration_estimate": "...", "dependencies": [] }
    ]
  },
  "risks_and_gaps": {
    "summary": "3 key risks identified across data, security, and scalability...",
    "items": [
      { "name": "...", "severity": "high", "description": "...", "mitigation": "..." }
    ]
  },
  "refinement_questions": [
    "Specific question about the user's app...",
    "Another specific question..."
  ]
}`;

export const evaluateapp = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { appDescription, problemAndUsers, dataAndContent, refinement_context } = req.body;
    const baseParts = [
      `APP DESCRIPTION:\n${appDescription || "Not provided"}`,
      `PROBLEM & USERS:\n${problemAndUsers || "Not provided"}`,
      `DATA & CONTENT:\n${dataAndContent || "Not provided"}`,
    ];
    if (refinement_context && typeof refinement_context === "string") {
      baseParts.push(`\n${refinement_context}`);
    }
    const userMessage = baseParts.join("\n\n");

    const result = await callGemini({ apiKey, model, systemPrompt: EVALUATE_APP_SYSTEM, userMessage, label: "evaluate-app" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("evaluate-app error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 11. GENERATE PRD
// ═══════════════════════════════════════════════════════════════

const PRD_SYSTEM = `You are a senior product manager and technical writer specializing in dashboard and data visualization products. You create production-grade Product Requirements Documents (PRDs).

You will receive details about a dashboard project. Generate a comprehensive, detailed, and actionable PRD.

CRITICAL: Every section value MUST be a plain text STRING, not a JSON object. Use formatted text with newlines and bullets within the string.

RESPONSE FORMAT (JSON only):
{
  "prd_content": "PRD: [Dashboard name]",
  "sections": {
    "dashboard_overview": "...",
    "target_users": "...",
    "information_architecture": "...",
    "widget_specifications": "...",
    "visual_design": "...",
    "tech_stack": "...",
    "data_integration": "...",
    "interactions_filtering": "...",
    "responsive_behavior": "...",
    "human_checkpoints": "...",
    "acceptance_criteria": "..."
  }
}`;

export const generateprd = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { user_needs, image_prompt, target_audience, key_metrics, data_sources, dashboard_type, visual_style, color_scheme, update_frequency } = req.body;
    const userMessage = [
      `DASHBOARD PURPOSE: ${user_needs}`,
      `DASHBOARD DESIGN: ${image_prompt}`,
      target_audience ? `TARGET AUDIENCE: ${target_audience}` : "",
      key_metrics ? `KEY METRICS: ${key_metrics}` : "",
      data_sources ? `DATA SOURCES: ${data_sources}` : "",
      dashboard_type ? `DASHBOARD TYPE: ${dashboard_type}` : "",
      visual_style ? `VISUAL STYLE: ${visual_style}` : "",
      color_scheme ? `COLOR SCHEME: ${color_scheme}` : "",
      update_frequency ? `UPDATE FREQUENCY: ${update_frequency}` : "",
    ].filter(Boolean).join("\n");

    const result = await callGemini({ apiKey, model, systemPrompt: PRD_SYSTEM, userMessage, label: "generate-prd" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("generate-prd error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 12. GENERATE N8N WORKFLOW JSON (AI primary path)
// ═══════════════════════════════════════════════════════════════

import { N8N_SYSTEM_PROMPT } from "./n8nSystemPrompt";

function buildN8nGeneratePrompt(intermediate: any): string {
  return `Generate a complete, valid n8n workflow JSON for the following workflow.
Respond ONLY with the raw JSON object. No markdown, no code fences, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}`;
}

function buildN8nRetryPrompt(intermediate: any, previousJson: string, errors: string[]): string {
  return `Your previous n8n JSON had validation errors. Fix ALL of the following errors and regenerate the complete workflow JSON. Respond ONLY with the corrected JSON.

Errors to fix:
${errors.map((e: string) => `- ${e}`).join("\n")}

Original workflow specification:
${JSON.stringify(intermediate, null, 2)}

Your previous (broken) JSON for reference:
${previousJson.slice(0, 2000)}...`;
}

export const generaten8nworkflow = onRequest({ secrets: [openRouterApiKey], timeoutSeconds: 60 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { intermediate, attempt, previousJson, previousErrors } = req.body;
    if (!intermediate) { res.status(400).json({ error: "Missing intermediate workflow data" }); return; }

    const isRetry = attempt && attempt > 1 && previousErrors?.length > 0;
    const userMessage = isRetry
      ? buildN8nRetryPrompt(intermediate, previousJson || "", previousErrors)
      : buildN8nGeneratePrompt(intermediate);

    const result = await callOpenRouterRaw({
      apiKey,
      model: "anthropic/claude-sonnet-4",
      systemPrompt: N8N_SYSTEM_PROMPT,
      userMessage,
      label: "generate-n8n-workflow",
      temperature: 0.3,
      maxTokens: 4000,
    });

    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json({ json: result.text });
  } catch (err) {
    console.error("generate-n8n-workflow error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 13. GENERATE BUILD GUIDE (markdown)
// ═══════════════════════════════════════════════════════════════

const BUILD_GUIDE_SYSTEM_PROMPT = `
You are an expert workflow automation consultant and technical writer.
Your task is to generate a complete, practical Build Guide for an automation workflow.
The guide must be immediately actionable — readable by a non-technical user building
it themselves, usable as a handover document for a developer, and structured enough
to be parsed by an AI agent to generate a platform-specific workflow template.

CRITICAL FORMATTING RULES:
- Respond ONLY with the raw markdown document. No preamble, no explanation.
- Follow the exact document structure below. Do not add, remove, or rename sections.
- Use the platform's correct terminology throughout (provided in the user message).
- Write in imperative voice for all Configure sections.
- Every step must have a "What happens:" sentence before the configuration detail.
- Code blocks must use triple backtick fences with the language identifier.
- The Test Checklist must contain specific, testable actions — not generic advice.
- Known Edge Cases must be real failure modes, not theoretical ones.
- Minimum 3 edge cases, maximum 6.

CODE FENCING — MANDATORY (THIS IS CRITICAL FOR USABILITY):
The following content MUST ALWAYS be wrapped in triple-backtick fenced code blocks.
Users will copy these directly into their platform — plain text is NOT acceptable.

MUST be fenced:
- System prompts / system messages (use triple-backtick text)
- User prompts / user messages (use triple-backtick text)
- JSON schemas, structured output parsers, API payloads (use triple-backtick json)
- Field mapping expressions when shown as a block (use triple-backtick text)
- Message templates (Slack messages, email bodies, Teams messages) (use triple-backtick text)
- Any multi-line configuration that a user would copy-paste into a platform field

DO NOT present prompts, JSON schemas, or message templates as regular paragraph text.
They MUST be in fenced code blocks so users can visually distinguish and copy them directly.

PLATFORM VOCABULARY:
| Concept | n8n | Zapier | Make | Power Automate | AI Coding Agent |
|---|---|---|---|---|---|
| Workflow container | Workflow | Zap | Scenario | Flow | Script / Agent |
| Single unit | Node | Step | Module | Action | Function / Tool call |
| Start event | Trigger node | Trigger | Trigger module | Trigger | Entry point |
| Conditional branch | IF node | Filter / Paths | Router | Condition | if/else block |
| Data transform | Set node / Code node | Formatter | Tools module | Data operations | Transform function |
| Loop | Split in Batches | Looping | Iterator | Apply to each | for loop / map |

CRITICAL — STAY MODEL & TOOL AGNOSTIC (THIS OVERRIDES EVERYTHING ELSE):
You MUST NOT mention any specific AI provider, model name, or provider-branded API key
anywhere in the Build Guide. This rule is absolute and non-negotiable.

NEVER write any of these (or similar):
  ✗ "Enter your Anthropic API key"        → ✓ "Enter the LLM API key approved by your team"
  ✗ "Set the model to claude-3-sonnet"    → ✓ "Select the AI model approved by your organisation"
  ✗ "OpenAI API key"                      → ✓ "Your LLM API key"
  ✗ "Claude", "GPT-4", "Gemini"           → ✓ "your chosen LLM", "the AI model"
  ✗ "Anthropic Console → API Keys"        → ✓ "Your LLM provider's console → API Keys"
  ✗ "OpenAI Chat Model node"              → ✓ "LLM Chat Model node (select your preferred provider)"
  ✗ "Anthropic Chat Model"                → ✓ "LLM Chat Model"

The ONLY exception: you may mention a platform's UI label (e.g., n8n's "AI Agent" node name)
because that is the node's actual name in the platform — but credential and model references
must always be provider-agnostic.

AI AGENT NODE CONFIGURATION (n8n and similar platforms):
When a workflow step uses an AI Agent or LLM node, you MUST document ALL THREE prompt
components separately and explain the difference:

1. **System Prompt** — The persistent instructions that define the agent's role, behaviour,
   and constraints. This stays the same across all executions.
2. **User Prompt** — The per-execution input that contains the dynamic data being processed
   (e.g., the survey response, the document text). This changes every time the workflow runs.
   Show the exact field mapping expression.
3. **Structured Output Parser** — The schema or format instruction that tells the LLM to
   return data in a specific structure (JSON, table, etc.) so downstream nodes can reliably
   parse the response. Include the full example schema.

Always present these three as distinct subsections within the step's Configure block.

TONE: Direct. Practical. Confident. No filler phrases.

DOCUMENT STRUCTURE — follow exactly:

# Build Guide
## [workflow name]

---

**What this workflow does**
[paragraph]

**Complexity** \`[value]\` &nbsp; **Estimated build time** \`[value]\` &nbsp; **Steps** \`[N]\`

---

## Before You Start

[one sentence intro]

| What | Where to find it | Used in |
|---|---|---|
[rows]

**Accounts to connect**
[list]

---

## The Workflow

---

### Step [N] — [Name]
**What happens:** [sentence]

**Configure:**
[instructions]

---

[repeat for all steps]

---

## Test Checklist

Before going live, run through this with test data.

- [ ] [item]

---

## Known Edge Cases

**[name]**
[paragraph]
`;

// Platform-specific knowledge addenda — appended to the system prompt based on selected platform
const PLATFORM_ADDENDA: Record<string, string> = {
'n8n': `
PLATFORM-SPECIFIC KNOWLEDGE — n8n (v1.x)

Use these exact node names, syntax, and patterns when writing the Build Guide.

EXACT NODE NAMES (use these in step titles and instructions):
- Triggers: Webhook, Schedule Trigger, Manual Trigger, Email Trigger (IMAP), Chat Trigger
- HTTP: HTTP Request (supports all methods, auth types, pagination, retry)
- Logic: IF (true/false branches), Switch (multi-branch), Filter, Merge
- Data: Edit Fields (Set), Sort, Limit, Remove Duplicates, Aggregate, Split Out, Summarize, Compare Datasets
- Code: Code (JavaScript or Python), Execute Command
- Flow: Loop Over Items (formerly Split In Batches), Wait, Execute Workflow, Respond to Webhook
- Error: Error Trigger (workflow-level error handler)
- AI: AI Agent, Basic LLM Chain, LLM Chat Model (select your preferred provider), Structured Output Parser, Tool sub-nodes, Vector Store nodes

AI AGENT NODE — TRIPLE PROMPT PATTERN (critical for any step using AI Agent):
When configuring an AI Agent node, document ALL THREE prompt fields:

1. System Prompt (under "Options" → "System Message"):
   - Persistent instructions: role definition, constraints, behaviour rules
   - Does NOT change per execution — defines WHO the agent is

2. User Prompt (the main "Prompt" / "Text" input field):
   - Per-execution dynamic input — mapped from trigger or previous node
   - Use field expressions: \`{{ $json.response_text }}\`, etc.

3. Structured Output Parser (add as a sub-node under the AI Agent):
   - Attach a "Structured Output Parser" sub-node to force JSON output
   - Define the exact JSON schema the agent must return
   - Ensures downstream nodes can reliably parse the response

POPULAR INTEGRATION NODES (exact names):
| Service | Trigger | Action Node |
|---|---|---|
| Slack | Slack Trigger | Slack |
| Google Sheets | Google Sheets Trigger | Google Sheets |
| Gmail | Gmail Trigger | Gmail |
| Airtable | Airtable Trigger | Airtable |
| Notion | Notion Trigger | Notion |
| AI / LLM | — | AI node (your chosen provider) |
| PostgreSQL | — | Postgres |
| MySQL | — | MySQL |
| MongoDB | — | MongoDB |
| HubSpot | HubSpot Trigger | HubSpot |
| GitHub | GitHub Trigger | GitHub |
| Supabase | — | Supabase |

DATA REFERENCE SYNTAX:
- Current item field: \`{{ $json.fieldName }}\` or \`{{ $json["field name"] }}\`
- Nested: \`{{ $json.nested.field }}\` or \`{{ $json.array[0].name }}\`
- From another node: \`{{ $('NodeName').item.json.field }}\`
- First/last item: \`{{ $('NodeName').first().json.field }}\` / \`{{ $('NodeName').last().json.field }}\`
- All items: \`{{ $('NodeName').all() }}\`
- Built-ins: \`{{ $now }}\`, \`{{ $today }}\`, \`{{ $itemIndex }}\`, \`{{ $runIndex }}\`
- Execution: \`{{ $execution.id }}\`, \`{{ $workflow.name }}\`
- Env vars: \`{{ $vars.myVar }}\` (Cloud/Enterprise) or \`{{ $env.MY_VAR }}\` (self-hosted)
- Ternary: \`{{ $if($json.score > 50, "pass", "fail") }}\`

CREDENTIAL SETUP (tell users exactly where to go):
1. Left sidebar → Credentials → Add Credential
2. Search for the credential type (e.g. "Slack OAuth2 API", or the LLM API credential approved by your team)
3. For API keys: paste the key → Save. For OAuth2: fill Client ID + Secret → click Connect → authorize in popup → Save
Auth types on HTTP Request node: Predefined Credential Type, Header Auth, OAuth2, Basic Auth, Query Auth, Digest Auth

CODE NODE:
- JavaScript "Run Once for All Items": access \`$input.all()\`, return array of \`{ json: {...} }\`
- JavaScript "Run Once for Each Item": access \`$input.item\`, return single \`{ json: {...} }\`
- Python: use \`_input.all()\` / \`_input.item\`, same return shape
- require() blocked by default. Self-hosted: set NODE_FUNCTION_ALLOW_EXTERNAL=moduleName

WEBHOOK SETUP:
- Test URL: https://<domain>/webhook-test/<path> — works only in editor with "Listen for Test Event"
- Production URL: https://<domain>/webhook/<path> — works only when workflow is active

LOOPING (Loop Over Items node):
- Set Batch Size (default 1). Two outputs: "Loop" and "Done". Most nodes auto-iterate — only use when you need batch control.

CONDITIONAL ROUTING:
- IF node: boolean condition → True/False branches. Switch node: multiple outputs. Filter node: single output, drops non-matching.

ERROR HANDLING:
- Per-node: Settings tab → "Retry On Fail" or "Continue On Fail". Workflow-level: Error Trigger node.

GOTCHAS:
- Cloud execution timeout varies by plan. Self-hosted: configurable via EXECUTIONS_TIMEOUT env var.
- Self-hosted default DB is SQLite — use PostgreSQL for production.
- No built-in rate limiting — add Wait nodes or use Loop Over Items with small batches.
- Binary data flows through \`binary\` property alongside \`json\`.
- Dates use Luxon: \`{{ $json.date.toDateTime().toFormat('yyyy-MM-dd') }}\`
`,

'Zapier': `
PLATFORM-SPECIFIC KNOWLEDGE — Zapier (2025)

Use these exact step type names, syntax, and patterns when writing the Build Guide.

TERMINOLOGY:
- A workflow is called a "Zap". Each Zap has a Trigger (step 1) and one or more Actions.
- Steps are numbered: 1 (trigger), 2, 3, etc.

STEP TYPES (exact names in UI):
- Trigger: first step, starts the Zap
- Action: performs an operation in an app
- Search: looks up an existing record
- Filter by Zapier: continues only if conditions are met
- Paths by Zapier: conditional branching — up to 3-5 paths depending on plan
- Formatter by Zapier: text/number/date transformations
- Delay by Zapier: pause for a duration or until a specific time
- Looping by Zapier: iterate over a line-item array
- Sub-Zap by Zapier: call another Zap as a subroutine
- Code by Zapier: run JavaScript or Python
- Webhooks by Zapier: send/receive raw HTTP requests
- Digest by Zapier: collect data over time, then release as a batch
- Storage by Zapier: simple key-value store across Zap runs

POPULAR APP NAMES (exact):
| Service | Trigger Example | Action Example |
|---|---|---|
| Slack | New Message in Channel | Send Channel Message |
| Google Sheets | New or Updated Spreadsheet Row | Create Spreadsheet Row |
| Gmail | New Email | Send Email |
| Webhooks by Zapier | Catch Hook | Custom Request |
| Airtable | New Record | Create Record |
| Notion | New Database Item | Create Database Item |
| AI / LLM | — | Send Prompt (via your chosen AI provider) |
| HubSpot | New Contact | Create Contact |
| Salesforce | New Record | Create Record |

DATA REFERENCE / FIELD MAPPING:
- In the Zap editor, click a field → "Insert Data" dropdown shows output fields from all previous steps
- Data pills: displayed as chips showing "Step N. Field Name"
- In Code by Zapier: access via \`inputData.fieldName\` (define input fields that map to previous steps)

CREDENTIAL SETUP:
1. When adding a step, Zapier prompts "Connect [App Name]" → click "Sign in to [App]"
2. OAuth apps: authorize in popup. API key apps: paste key. Zapier tests the connection.
3. Manage connections: Settings → Connections

CODE BY ZAPIER:
- JavaScript: access input via \`inputData\` object. Return: \`output = { key: value }\`
- Python: access input via \`input_data\` dict. Return: \`output = [{"key": "value"}]\`
- No external packages. 10-second timeout. 1MB memory limit.

WEBHOOKS BY ZAPIER:
- Catch Hook (trigger): unique URL → send POST/GET to it → Zap fires
- Custom Request (action): make any HTTP request with custom headers, body, auth

PATHS BY ZAPIER:
- Each path has filter conditions (AND/OR). Only matching paths execute. All matching paths run in parallel.

LOOPING BY ZAPIER:
- Takes a line-item field (array) and runs subsequent steps per item. Max 500 iterations.

FILTER BY ZAPIER:
- Operators: Contains, Exactly matches, Is greater than, Exists, Starts with, etc. AND/OR logic.
- If filter fails, Zap stops for that run. Use Paths for if/else.

GOTCHAS:
- Polling triggers: 1-15 min depending on plan (Free: 15min, Professional: 2min, Team: 1min). Instant triggers fire immediately.
- Task usage: each action step that runs = 1 task. Triggers and Filters don't count.
- Free: 100 tasks/month, 5 Zaps, single-step. Professional: 2,000 tasks/month, unlimited Zaps.
- 30-second timeout per step (Code is 10s). Entire Zap timeout: 30 minutes.
- Data flows strictly forward — cannot loop back to earlier steps. Use Sub-Zaps for recursion.
- Zap History for debugging: shows every run with input/output data per step.
`,

'Make': `
PLATFORM-SPECIFIC KNOWLEDGE — Make (formerly Integromat, 2025)

Use these exact module names, syntax, and patterns when writing the Build Guide.

TERMINOLOGY:
- A workflow is called a "Scenario". Scenarios contain Modules connected by routes.
- Each module has a number (1, 2, 3...) used in data references.

MODULE TYPES:
- Trigger modules: start a scenario (instant webhook or polling)
- Action modules: create, update, delete, send
- Search modules: look up records (returns multiple items, triggers implicit loop)
- Aggregator modules: Array Aggregator, Text Aggregator, Table Aggregator
- Iterator module: takes an array, outputs individual items
- Router module: splits flow into parallel routes with optional filters
- Tools: Set Variable, Get Variable, Sleep, Ignore, Compose a string

HTTP MODULE (exact name: "HTTP — Make a request"):
- Auth: No Auth, Basic, API Key, OAuth 2.0, Client Certificate, AWS Signature
- Also: "HTTP — Make a Basic Auth request", "HTTP — Make an OAuth 2.0 request"

WEBHOOKS:
- "Webhooks — Custom webhook" (trigger): Make gives you a URL → send data to it
- "Webhook response" module: send custom HTTP response

POPULAR APP MODULES (exact names):
| Service | Trigger Module | Action Module |
|---|---|---|
| Slack | Watch Messages | Create a Message |
| Google Sheets | Watch Changes, Watch New Rows | Add a Row, Update a Row |
| Gmail | Watch Emails | Send an Email |
| Airtable | Watch Records | Create a Record |
| Notion | Watch Database Items | Create a Database Item |
| AI / LLM | — | Create a Completion (Chat) via your chosen provider |
| PostgreSQL | — | Execute a query |
| HubSpot | Watch Contacts/Deals | Create a Contact |
| Salesforce | Watch Records | Create a Record |

DATA REFERENCE SYNTAX:
- Module number reference: \`{{1.fieldName}}\` — module 1's output field
- Nested: \`{{1.data.nested.field}}\`
- Functions: \`{{formatDate(1.date; "YYYY-MM-DD")}}\`, \`{{lower(1.name)}}\`, \`{{length(1.items)}}\`
- Conditionals: \`{{if(1.status = "active"; "yes"; "no")}}\`, \`{{ifempty(1.field; "default")}}\`
- Array access: \`{{1.items[1]}}\` (1-indexed!)
- Concatenation: \`{{1.firstName}} {{1.lastName}}\`

CREDENTIAL SETUP (Connections):
1. When adding a module, click "Add" next to the Connection dropdown
2. Name the connection → for OAuth: click Authorize → popup → grant access. For API keys: paste key → Save.
3. Connections are reusable across scenarios. Manage at: Organization → Connections.

ROUTER (conditional branching):
- Add Router → creates multiple routes. Each route can have a Filter (conditions with AND/OR).
- Fallback route: last route with no filter = "else" branch. Set via "Set as fallback".
- All matching routes execute in parallel by default.

ITERATOR + AGGREGATOR:
- Iterator: input array → outputs individual bundles. Array Aggregator: collects bundles back into array.
- Must pair them: Iterator expands → processing → Aggregator collects.

ERROR HANDLING (per-module):
- Right-click module → "Add error handler" → directives: Resume, Rollback, Ignore, Break, Commit
- Break: stores incomplete execution for retry. Auto-retry configurable (max retries + interval).
- Incomplete Executions: Scenario → Incomplete Executions tab.

GOTCHAS:
- Operation limits: Free 1,000 ops/month. Each module execution = 1 operation.
- Execution time: max 40 minutes per scenario (hard limit).
- Bundle size: max 50MB per bundle.
- Free plan: minimum 15-minute scheduling interval. Paid: 1-minute minimum.
- Data Stores: built-in key-value databases. Create at Organization → Data Stores. Use "Data Store" modules.
- 1-indexed arrays: \`{{1.items[1]}}\` is the FIRST item, not the second.
- Search modules return multiple bundles — triggers implicit iteration through all downstream modules.
`,

'Power Automate': `
PLATFORM-SPECIFIC KNOWLEDGE — Microsoft Power Automate (2025)

Use these exact action/connector names, syntax, and patterns when writing the Build Guide.

TERMINOLOGY:
- A workflow is called a "Flow". Operations are "Actions" (or "Triggers" for start events).
- Services are accessed via "Connectors" (Standard or Premium).

FLOW TYPES:
- Automated cloud flow: triggered by an event
- Instant cloud flow: triggered manually or via HTTP request
- Scheduled cloud flow: runs on a cron schedule

CORE ACTIONS (exact names):
- Compose, Initialize variable, Set variable, Append to string/array variable
- Condition (if/then/else), Switch (multi-branch)
- Apply to each (loop over array), Do until (loop until condition)
- Scope (group actions — used for try-catch patterns)
- Terminate (end flow with Succeeded/Failed/Cancelled status)
- Delay, Delay until
- HTTP (Premium — raw HTTP requests), Parse JSON
- Select (array map), Filter array, Join, Create CSV/HTML table

POPULAR CONNECTORS (exact names):
| Service | Connector | Premium? | Example |
|---|---|---|---|
| Outlook | Office 365 Outlook | Standard | When a new email arrives → Send an email (V2) |
| SharePoint | SharePoint | Standard | When an item is created → Create item, Get items |
| Teams | Microsoft Teams | Standard | When a message is posted → Post message |
| OneDrive | OneDrive for Business | Standard | When a file is created → Create file |
| Excel | Excel Online (Business) | Standard | List rows present in a table → Add a row |
| SQL Server | SQL Server | Premium | Execute a SQL query, Get rows (V2) |
| Dataverse | Microsoft Dataverse | Premium | When a row is added → List rows, Add a new row |
| HTTP | HTTP | Premium | Make any REST call |
| Slack | Slack | Standard | When a new message is posted → Post message |
| Google Sheets | Google Sheets | Standard | When a row is added → Insert row |
| AI Builder | AI Builder | Premium | Create text with AI, Extract info from documents |

DATA REFERENCE SYNTAX (expressions):
- Dynamic Content panel: click field → pick from list of outputs from previous actions
- Expressions tab: formulas using Workflow Definition Language
- Trigger output: \`@{triggerOutputs()?['body/field']}\` or \`@{triggerBody()?['field']}\`
- Action output: \`@{body('ActionName')?['field']}\` or \`@{outputs('ActionName')?['body/field']}\`
- Variables: \`@{variables('varName')}\`
- Loop current item: \`@{items('Apply_to_each')?['field']}\`
- Common functions: concat(), substring(), replace(), split(), toLower(), toUpper(), trim(), length()
- Date functions: utcNow(), addDays(), formatDateTime(utcNow(), 'yyyy-MM-dd')
- Logic: if(condition, trueValue, falseValue), equals(), and(), or(), not(), empty(), coalesce()
- Null-safe navigation: use ?[] operator — \`body('Action')?['field']\` returns null safely

CREDENTIAL / CONNECTION SETUP:
1. First time adding a connector: Power Automate prompts "Sign in"
2. Microsoft services: signs in via M365 account (automatic OAuth)
3. Third-party: redirects to their OAuth page or enter API key
4. Manage connections: Power Automate portal → Data → Connections
5. Custom connectors: Data → Custom connectors → define from OpenAPI spec

CONDITION (if/then/else):
- Condition action → value1 [operator] value2. Operators: equals, not equals, greater than, contains, starts with, etc.
- AND/OR groups. Two branches: "If yes" and "If no".

APPLY TO EACH (looping):
- Select array to loop over. Add actions inside loop body.
- Concurrency: Settings → Concurrency Control → 1-50 (default 20). Set to 1 for sequential.

ERROR HANDLING:
- Click (...) on action → Configure run after → "is successful", "has failed", "is skipped", "has timed out"
- Try-catch pattern: put risky actions in Scope → add Scope after configured to "Run after: has failed"
- Terminate action: use in catch block to mark flow as Failed with custom error message

GOTCHAS:
- Premium connectors (HTTP, SQL, Dataverse, Custom) require paid license (~$15/user/month or $150/flow/month for Process plan).
- Max 500 actions per workflow. Max 8 nesting levels. Max 25 cases per Switch. Max 250 variables per flow.
- Initialize variable must be at top level (not inside loops/conditions). Set variable can be used anywhere.
- Do until: default max 60 iterations, configurable up to 5,000.
- Apply to each: array limit 5,000 items (basic plan) / 100,000 (premium). Concurrency default 20, set to 1 for sequential.
- Pagination: enable on "List" actions via Settings → set threshold (up to 100,000).
- Always use ?[] safe navigation to avoid null errors — \`body('Action')?['field']\` not \`body('Action')['field']\`.
- Outbound request timeout: 120 seconds. Flow run duration: max 30 days.
- Approval actions: built-in "Start and wait for an approval" — sends via Teams/email. Very common in business flows.
- Environment variables: available in Solutions for configurable values across dev/test/prod.
- AI Builder: built-in AI capabilities (AI-powered text generation, document processing) — no external API key needed with AI Builder credits (5,000/month with Premium).
- Connection References: use in solution-aware flows to decouple connections from flow definitions for Dev/Test/Prod deployment.
`,

'AI Coding Agent': `
PLATFORM-SPECIFIC KNOWLEDGE — AI Coding Agent

An AI coding agent is a CLI-based or SDK-based AI assistant that writes and executes code.
Build guides for this platform describe scripts, agent loops, or tool-use patterns — not
visual drag-and-drop workflows.

CORE CONCEPTS:
- Entry point: A script file (TypeScript/Python) or a prompt-driven agent session
- Tool calls: The AI agent can call tools (read files, write files, run commands, search, etc.)
- Agent loop: The AI reasons → selects a tool → observes result → repeats until done
- No visual canvas — everything is code or prompt-based

SDK & API:
- Use the SDK or API provided by your chosen LLM provider
- Authentication: Use the API key provided by your LLM provider, stored as an environment variable
- Follow your provider's documentation for model IDs, endpoints, and token limits

TOOL USE PATTERN:
\`\`\`typescript
// Example using a generic LLM SDK (adapt to your chosen provider)
const response = await llmClient.chat({
  model: 'your-chosen-model',
  max_tokens: 4096,
  tools: [{ name: 'tool_name', description: '...', input_schema: { type: 'object', properties: { ... } } }],
  messages: [{ role: 'user', content: '...' }],
});
\`\`\`

AGENT LOOP:
1. Send initial message with tools defined
2. If response includes a tool call, execute the tool
3. Send tool result back to the LLM
4. Repeat until the LLM returns a final answer (no more tool calls)

CREDENTIAL SETUP:
- API Key: Generated from your LLM provider's console — use the key approved by your team
- Set as environment variable (e.g. LLM_API_KEY or your provider's convention)
- Most SDKs auto-read from the environment variable

GOTCHAS:
- Rate limits vary by provider and tier. Check response headers for remaining quota.
- Context window varies by model (typically 128K–200K tokens input).
- Tool schemas must be valid JSON Schema.
- max_tokens is typically required and caps output.
- Rate limit errors (429): back off with exponential delay. Overloaded: retry after seconds.

COMMON PATTERNS:
- Text processing: single API call with detailed system prompt
- Multi-step agent: tool-use loop with file system tools
- Batch processing: parallel execution for multiple items
- Structured output: use tool definitions to force JSON schema
`,
};

/**
 * Look up platform-specific knowledge addendum. Returns empty string for unknown platforms.
 */
function getPlatformAddendum(platform: string): string {
  return PLATFORM_ADDENDA[platform] || '';
}

export const generatebuildguide = onRequest({ secrets: [openRouterApiKey], timeoutSeconds: 60 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { intermediate, platform } = req.body;
    if (!intermediate || !platform) { res.status(400).json({ error: "Missing intermediate or platform" }); return; }

    // Append platform-specific knowledge to the system prompt
    const platformKnowledge = getPlatformAddendum(platform);
    const fullSystemPrompt = platformKnowledge
      ? `${BUILD_GUIDE_SYSTEM_PROMPT}\n\n${platformKnowledge}`
      : BUILD_GUIDE_SYSTEM_PROMPT;

    // Build enriched user message with context from all prior steps
    const ctx = intermediate.context;
    let contextBlock = '';
    if (ctx) {
      const parts: string[] = [];

      // Original user intent
      if (ctx.originalTaskDescription) {
        parts.push(`USER'S ORIGINAL REQUEST:\n${ctx.originalTaskDescription}`);
      }
      if (ctx.toolsAndSystems && ctx.toolsAndSystems !== 'Not specified') {
        parts.push(`TOOLS & SYSTEMS THE USER ALREADY USES:\n${ctx.toolsAndSystems}`);
      }

      // Design path context
      parts.push(`DESIGN PATH: ${ctx.pathUsed === 'a' ? 'AI-generated workflow (Path A)' : 'User-designed workflow (Path B)'}`);

      // Feedback & review history
      if (ctx.overallAssessment) {
        parts.push(`AI REVIEW ASSESSMENT:\n${ctx.overallAssessment}`);
      }
      if (ctx.pathARefinementText) {
        parts.push(`USER'S REFINEMENT FEEDBACK:\n${ctx.pathARefinementText}`);
      }
      if (ctx.feedbackItems && ctx.feedbackItems.length > 0) {
        const fbLines = ctx.feedbackItems.map((fi: { nodeName: string; type: string; rationale: string; resolution: string; disputeText?: string; disputeOutcome?: string; disputeResponse?: string }) => {
          let line = `- [${fi.type.toUpperCase()}] "${fi.nodeName}": ${fi.rationale} → Resolution: ${fi.resolution}`;
          if (fi.disputeText) line += `\n  User disputed: "${fi.disputeText}"`;
          if (fi.disputeOutcome) line += `\n  Outcome: ${fi.disputeOutcome}${fi.disputeResponse ? ` — ${fi.disputeResponse}` : ''}`;
          return line;
        });
        parts.push(`FEEDBACK ITEMS & RESOLUTIONS:\n${fbLines.join('\n')}`);
      }

      // Canvas layout
      if (ctx.canvasLayout && ctx.canvasLayout.length > 0) {
        const layoutLines = ctx.canvasLayout.map((n: { position: number; nodeName: string; layer: string; connections: string[] }) =>
          `${n.position}. ${n.nodeName} [${n.layer}]${n.connections.length > 0 ? ` → ${n.connections.join(', ')}` : ''}`
        );
        parts.push(`CANVAS LAYOUT (execution order):\n${layoutLines.join('\n')}`);
      }

      contextBlock = `\n\nADDITIONAL CONTEXT FROM PRIOR STEPS:\n${parts.join('\n\n')}`;
    }

    const userMessage = `Generate a complete Build Guide for the following workflow.
Platform: ${platform}
Respond ONLY with the raw markdown document. No preamble, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}${contextBlock}`;

    const result = await callOpenRouterRaw({
      apiKey,
      model: "anthropic/claude-sonnet-4",
      systemPrompt: fullSystemPrompt,
      userMessage,
      label: "generate-build-guide",
      temperature: 0.5,
      maxTokens: 6000,
    });

    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }

    const cleaned = result.text.replace(/^```markdown\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    res.status(200).json({ markdown: cleaned });
  } catch (err) {
    console.error("generate-build-guide error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 14. RESOLVE FEEDBACK DISPUTE
// ═══════════════════════════════════════════════════════════════

const DISPUTE_SYSTEM_PROMPT = `You are an n8n workflow reviewer. A user has pushed back on one of your feedback items.
Consider their argument carefully and honestly. If they raise a valid point or provide
context you were missing, concede and explain why the issue no longer applies.
If your original feedback is still correct despite their argument, maintain your position
and explain clearly why — but acknowledge their perspective.
Respond ONLY with valid JSON matching this schema:
{
  "outcome": "concede | maintain",
  "response": "string — 1-2 sentences. Direct, honest, not defensive."
}`;

export const resolvedispute = onRequest({ secrets: [openRouterApiKey], timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { originalMessage, severity, disputeText, nodeContext } = req.body;

    const userMessage = `Original feedback: ${originalMessage}
Severity: ${severity}
User's argument: ${disputeText}
Workflow context: ${JSON.stringify(nodeContext || {})}`;

    const openRouterModel = model.startsWith("google/") ? model : `google/${model}`;
    const result = await callGemini({
      apiKey,
      model: openRouterModel,
      systemPrompt: DISPUTE_SYSTEM_PROMPT,
      userMessage,
      label: "resolve-dispute",
      temperature: 0.5,
    });

    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("resolve-dispute error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// PROMPT PLAYGROUND V2
// ═══════════════════════════════════════════════════════════════

const PLAYGROUND_V2_SYSTEM = `You are the Oxygy Prompt Engineering Coach — an expert practitioner in AI prompting who helps professionals build better prompts for their real work tasks.

Your job is to:
1. Read the user's task description
2. Select 2–4 prompting strategies from the approved list below that are most appropriate for this specific task
3. Write a single, clean, optimised prompt that combines those strategies
4. Provide a practitioner's rationale for why each strategy was chosen for this specific task

---

APPROVED PROMPTING STRATEGIES:

1. STRUCTURED_BLUEPRINT — Use for complex, multi-part deliverables needing explicit structure. Defines Role, Context, Task, Format, Steps, Quality Checks. Avoid for simple tasks.

2. CHAIN_OF_THOUGHT — Use for analytical, evaluative, or reasoning tasks. Instructs the AI to work step-by-step before concluding. Avoid for simple factual or creative tasks.

3. PERSONA_EXPERT_ROLE — Use for almost all professional tasks. Assigns a specific expert identity that anchors tone, vocabulary, and perspective.

4. OUTPUT_FORMAT_SPECIFICATION — Use when the output will be shared or directly used. Defines length, layout, tone, structure. Avoid for exploratory or ideation tasks.

5. CONSTRAINT_FRAMING — Always used alongside other strategies, never alone. Scopes what the AI should NOT do. Use for high-stakes or sensitive outputs.

6. FEW_SHOT_EXAMPLES — Use for repeatable, template-style tasks where showing the desired output pattern is more effective than describing it.

7. ITERATIVE_DECOMPOSITION — Use for large, multi-component deliverables. Breaks the task into sequential sub-tasks. Avoid for simple outputs.

8. TONE_AND_VOICE — Use for communication tasks where the relationship with the reader matters. Specifies register and relational dynamic precisely.

---

COMBINATION RULES:

- Minimum 2 strategies, maximum 4
- PERSONA almost always appears (exception: purely mechanical tasks)
- STRUCTURED_BLUEPRINT and CHAIN_OF_THOUGHT are rarely combined — choose one based on whether the task is primarily about structure or reasoning
- CONSTRAINT_FRAMING is always additive — never the sole strategy
- Colour-coded pairs that share a colour tag (Blueprint/Decomposition = Lavender; Chain-of-Thought/Tone = Yellow) should not both appear in the same output

---

TASK TYPE GUIDANCE:

- Simple communication tasks (emails, updates, messages): PERSONA + OUTPUT_FORMAT + optionally CONSTRAINT_FRAMING (2–3 strategies)
- Analytical / evaluative tasks: CHAIN_OF_THOUGHT + CONSTRAINT_FRAMING + PERSONA + optionally OUTPUT_FORMAT (3–4 strategies)
- Complex structured deliverables: STRUCTURED_BLUEPRINT + PERSONA + optionally ITERATIVE_DECOMPOSITION (3–4)
- Workshop / facilitation design: PERSONA + CHAIN_OF_THOUGHT + TONE_AND_VOICE + optionally FEW_SHOT_EXAMPLES
- Template / repeatable format creation: FEW_SHOT_EXAMPLES + OUTPUT_FORMAT + optionally PERSONA (2–3)
- Stakeholder / executive communication: PERSONA + TONE_AND_VOICE + OUTPUT_FORMAT + optionally CONSTRAINT_FRAMING (3–4)

---

OUTPUT FORMAT:

You must respond in the following JSON format ONLY — no markdown, no extra text, no code fences:

{
  "prompt": "The full optimised prompt as a clean, copy-ready string. Use \\n for line breaks within the prompt.",
  "strategies_used": [
    {
      "id": "PERSONA_EXPERT_ROLE",
      "name": "Persona / Expert Role",
      "icon": "🎭",
      "why": "A single sentence — practitioner's rationale specific to this task.",
      "what": "One sentence — general description of what this strategy does.",
      "how_applied": "1–2 sentences describing exactly how this strategy was applied in the generated prompt. Be specific — reference the actual content.",
      "prompt_excerpt": "The exact substring from the 'prompt' field that most clearly demonstrates this strategy in action. Must be a verbatim excerpt — copy it character-for-character from the prompt. Choose the most illustrative passage (1–3 sentences)."
    }
  ],
  "refinement_questions": [
    "A specific context-seeking question that, if answered, would let you write a significantly better prompt for this task. 3-5 questions total."
  ]
}

REFINEMENT HANDLING:

If the user's message begins with "[REFINEMENT]", it contains their original task description followed by answers to your previous questions and/or additional context. Use ALL provided context to write a significantly improved prompt. The refinement answers provide crucial specifics — weave them deeply into the prompt structure, not as afterthoughts. Generate new refinement_questions that probe even deeper.

RULES:
- The prompt must be clean, professional, and immediately usable in ChatGPT or Claude without modification
- The "why" must be specific to the user's task — not a generic description of the strategy
- The "what" is the stable, general description — it can be consistent across similar tasks
- The "how_applied" must describe the specific way this strategy manifests in the generated prompt — reference actual content you wrote
- The "prompt_excerpt" MUST be an exact, verbatim substring copied character-for-character from the "prompt" field. Do not paraphrase, summarise, or reword. Copy a meaningful passage (1–3 full sentences) that clearly demonstrates the strategy — not a fragment or partial sentence. The frontend uses indexOf() to highlight this excerpt, so even a single character difference will break highlighting. After writing each prompt_excerpt, mentally verify it appears as-is in the prompt field
- "refinement_questions" must contain 3-5 questions seeking specific context not provided in the input. Each must be practical and answerable in 1-2 sentences
- Do NOT add preamble, commentary, or explanation outside the JSON object
- If the user's input is very short or vague, make reasonable inferences and build the best possible prompt — do not ask for clarification`;

export const generateplaygroundprompt = onRequest({ secrets: [openRouterApiKey], timeoutSeconds: 30 }, async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const apiKey = openRouterApiKey.value();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { userInput } = req.body;
    if (!userInput || typeof userInput !== "string" || userInput.trim().length === 0) {
      res.status(400).json({ error: "userInput is required" }); return;
    }

    const result = await callGemini({
      apiKey,
      model: "anthropic/claude-sonnet-4",
      systemPrompt: PLAYGROUND_V2_SYSTEM,
      userMessage: userInput,
      label: "playground-v2",
      temperature: 0.7,
      maxTokens: 2000,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.message, retryable: result.retryable }); return;
    }

    res.status(200).json(result.data);
  } catch (err) {
    console.error("playground-v2 error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});
