import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { callGemini, fetchWithRetry, callOpenRouterRaw, callOpenRouter } from "./gemini";

const openRouterApiKey = defineSecret("OPEN_ROUTER_API");
const resendApiKey = defineSecret("RESEND_API_KEY");
const supabaseUrl = defineSecret("SUPABASE_URL");
const supabaseServiceKey = defineSecret("SUPABASE_SERVICE_KEY");
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

ABSOLUTE RULE — TOOL AND MODEL AGNOSTIC:
Never mention specific AI providers (OpenAI, Anthropic, Google) or models (GPT-4, Claude, Gemini) in the output. Use generic terms: "AI model", "LLM", "your chosen AI platform", "the AI model approved by your organisation".

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
// 4b. AGENT SETUP GUIDE — Hybrid Architecture v2
// Steps are HARDCODED templates with {SLOT} placeholders.
// AI fills slot values + tips (personalised to the agent).
// Steps stay accurate; content adapts to each agent.
// ═══════════════════════════════════════════════════════════════

type SetupStep = { title: string; instruction: string };
type PlatformTemplate = {
  steps: SetupStep[];
  slots: Record<string, string>; // default slot values if AI fails
  fallbackTips: string[];
  fallbackLimitations: string;
};

const PLATFORM_TEMPLATES: Record<string, PlatformTemplate> = {
  "ChatGPT Custom GPTs": {
    slots: {
      AGENT_NAME: "your agent",
      TASK: "your agent's task",
      KNOWLEDGE_FILES: "relevant documents, templates, and reference data",
      CAPABILITIES: "Code Interpreter for data processing, Web Search for research",
      CONVERSATION_STARTERS: "example prompts that show your agent's core use cases",
    },
    steps: [
      { title: "Open the GPT Builder", instruction: "Go to chat.openai.com → Explore GPTs → + Create. Switch to the \"Configure\" tab." },
      { title: "Paste your system prompt", instruction: "Paste the full system prompt into the \"Instructions\" field. Name your GPT \"{AGENT_NAME}\" and add a short description." },
      { title: "Upload Knowledge files", instruction: "In the \"Knowledge\" section, upload {KNOWLEDGE_FILES}. The GPT will search these files when generating responses." },
      { title: "Configure Capabilities", instruction: "Toggle on the capabilities your agent needs: {CAPABILITIES}. Only enable what's relevant to keep responses focused." },
      { title: "Set up Actions (optional)", instruction: "If your agent needs external data, click \"Create new action\" and define an OpenAPI schema for the API endpoints it should access." },
      { title: "Add Conversation Starters", instruction: "Add 3–4 starters like: {CONVERSATION_STARTERS}. These teach users how to interact with your agent effectively." },
      { title: "Test and publish", instruction: "Test in the Preview pane with realistic inputs. When ready, click \"Create\" and choose your sharing level (Private, Team, or Public)." }
    ],
    fallbackTips: [
      "Upload example outputs as Knowledge files — concrete examples teach the GPT your expected format better than instructions alone.",
      "Duplicate your GPT before making changes (three-dot menu → Copy) to create a safe rollback point.",
      "Use the Analytics tab (Team/Enterprise plans) to see which conversation starters get used most and where users drop off."
    ],
    fallbackLimitations: "Requires ChatGPT Plus, Team, or Enterprise. Knowledge limited to 20 files (512 MB each)."
  },
  "Claude Skills": {
    slots: {
      AGENT_NAME: "your agent",
      TASK: "your agent's task",
      EXAMPLE_INPUT: "the relevant input data",
      EXAMPLE_OUTPUT: "structured output in your expected format",
      CHAIN_SUGGESTION: "a formatting skill (e.g., report generator or slide deck builder)",
      SKILL_DESCRIPTION: "a short description of what this skill does",
    },
    steps: [
      { title: "Prepare your design answers", instruction: "Before building, decide: What input will users provide ({EXAMPLE_INPUT})? What should the output look like ({EXAMPLE_OUTPUT})? Should this skill chain into another (e.g., {CHAIN_SUGGESTION})?" },
      { title: "Use the built-in skill-creator", instruction: "Start a new Claude chat and say: \"Help me build a skill that {TASK}\". Claude's skill-creator will guide you through design questions and generate the skill automatically." },
      { title: "Install with one click", instruction: "When the skill is ready, click the \"Copy to your skills\" button at the bottom of the chat. It's instantly added to Customize > Skills. Toggle it on or off any time." },
      { title: "Test in a new conversation", instruction: "Open a fresh chat and describe a task naturally — don't mention the skill by name. If the skill activates, you'll see \"Using {AGENT_NAME}\" appear. If not, edit the description at Customize > Skills." },
      { title: "Chain with other skills", instruction: "Build a complementary skill (e.g., {CHAIN_SUGGESTION}) using the skill-creator. Toggle both on, and Claude will chain them automatically when the task fits." }
    ],
    fallbackTips: [
      "The skill description (max 200 chars) determines when Claude activates it — write it as \"activate when the user asks about [specific task]\". Vague descriptions mean the skill never fires.",
      "Skills work across ALL conversations, not just one Project — once installed, it's always available.",
      "Pair this skill with a formatting skill (slides, reports, docs) so structured output feeds directly into professional deliverables.",
      "Connect to document repositories via MCP connectors so the skill can access live organisational data."
    ],
    fallbackLimitations: "Requires Claude Pro or Team. Skill description limited to 200 characters. Skills can't call each other by name — chaining relies on Claude matching descriptions to the task."
  },
  "Microsoft Copilot": {
    slots: {
      AGENT_NAME: "your agent",
      TASK: "your agent's task",
      KNOWLEDGE_SOURCES: "relevant SharePoint sites, documents, or data sources",
      ACTIONS: "automations like sending emails, creating tasks, or updating records",
      CHANNEL: "Microsoft Teams",
    },
    steps: [
      { title: "Create a new Agent", instruction: "Open Copilot Studio (copilotstudio.microsoft.com) → Create → New Agent. Name it \"{AGENT_NAME}\"." },
      { title: "Paste your system prompt", instruction: "Paste the full system prompt into the \"Instructions\" field. This defines your agent's behaviour and output format." },
      { title: "Connect Knowledge sources", instruction: "Add {KNOWLEDGE_SOURCES} via the Knowledge section. The agent will search these when responding to users." },
      { title: "Configure Actions", instruction: "Connect Power Automate flows for {ACTIONS}. Map your agent's output fields to flow inputs for seamless automation." },
      { title: "Set up Topics", instruction: "Create Topics for your agent's main use cases. Each Topic guides users through providing the right inputs step by step." },
      { title: "Test your agent", instruction: "Click \"Test\" in the top-right to open the test pane. Run through realistic scenarios and check that Knowledge and Actions work correctly." },
      { title: "Publish to {CHANNEL}", instruction: "Go to Channels and deploy to {CHANNEL}. Your team can start using the agent immediately." }
    ],
    fallbackTips: [
      "Use Adaptive Cards for rich output — formatted cards with tables, buttons, and input fields are much more engaging than plain text.",
      "Connect to Microsoft Graph so your agent can access calendars, emails, files, and org data for context-aware responses.",
      "Use the Analytics tab to monitor which Topics get triggered most and where users abandon conversations."
    ],
    fallbackLimitations: "Requires Microsoft 365 with Copilot Studio access. Some Power Automate connectors need additional licensing."
  },
  "Google Gemini Gems": {
    slots: {
      AGENT_NAME: "your agent",
      TASK: "your agent's task",
      REFERENCE_DOCS: "relevant Google Docs, Sheets, or PDFs",
      WORKSPACE_INTEGRATIONS: "Drive, Docs, Sheets, or Slides",
    },
    steps: [
      { title: "Open the Gem Manager", instruction: "Go to gemini.google.com → Gem manager → New Gem. Requires Gemini Advanced (Google One AI Premium)." },
      { title: "Configure name and instructions", instruction: "Name your Gem \"{AGENT_NAME}\" and paste the full system prompt into the \"Instructions\" field." },
      { title: "Upload reference documents", instruction: "Attach {REFERENCE_DOCS} so the Gem can reference them when generating responses." },
      { title: "Test and calibrate", instruction: "Send representative inputs in the conversation area. If the output format or tone isn't right, refine the Instructions — changes take effect immediately." },
      { title: "Connect Workspace integrations", instruction: "Grant the Gem access to {WORKSPACE_INTEGRATIONS} so it can pull live organisational data when needed." },
      { title: "Test with realistic data", instruction: "Test with actual data, not toy examples. Verify the output matches your expected format, especially for structured output like JSON." },
      { title: "Share with your team", instruction: "Click Share and add collaborators by email. They'll see the Gem in their Gem manager immediately." }
    ],
    fallbackTips: [
      "Link to live Google Sheets for real-time data access — the Gem always works with the latest information.",
      "Pair with Google Apps Script to automatically write structured output to Sheets, Docs, or Slides.",
      "Create a shared Drive folder with all reference materials — updating the folder updates the Gem's knowledge."
    ],
    fallbackLimitations: "Requires Google One AI Premium (Gemini Advanced). Gems can't execute code, call APIs, or trigger automations directly."
  },
  "Open Source / API": {
    slots: {
      AGENT_NAME: "your agent",
      TASK: "your agent's task",
      SDK_EXAMPLE: "pip install openai (Python) or npm install openai (Node.js)",
      OUTPUT_FORMAT: "your expected JSON schema",
      DATA_SOURCES: "your document store, database, or file system",
      DEPLOY_FRAMEWORK: "FastAPI (Python) or Express (Node.js)",
    },
    steps: [
      { title: "Install the SDK", instruction: "Set up API access with your chosen provider: {SDK_EXAMPLE}. Store the API key as an environment variable." },
      { title: "Configure the system message", instruction: "Pass the system prompt as the \"system\" role in the chat completions API. This loads before every user interaction." },
      { title: "Parse structured output", instruction: "Use JSON mode or function calling to enforce {OUTPUT_FORMAT}. Add a validation retry loop for malformed responses." },
      { title: "Build the input pipeline", instruction: "Create a function that prepares user input — extracting text from files, formatting data, and truncating to fit context limits." },
      { title: "Add error handling", instruction: "Handle rate limits (exponential backoff), timeouts (retry), and invalid output (re-prompt). This is critical for production reliability." },
      { title: "Connect to data sources", instruction: "Integrate with {DATA_SOURCES} so the agent can access reference materials at runtime. For large collections, consider a vector database for RAG." },
      { title: "Deploy as a service", instruction: "Wrap in an API endpoint ({DEPLOY_FRAMEWORK}) or build a simple UI (Streamlit, Gradio, Next.js). Add auth, rate limiting, and logging." }
    ],
    fallbackTips: [
      "Use streaming (stream: true) for long outputs — users get immediate feedback instead of waiting.",
      "Count tokens before each API call to stay within context limits and truncate intelligently.",
      "Log every API call (input, output, latency, tokens) for debugging and quality monitoring.",
      "For large document collections, implement RAG with a vector database (Pinecone, Weaviate, ChromaDB)."
    ],
    fallbackLimitations: "API costs scale with usage — monitor token consumption. You're responsible for data handling, security, and compliance."
  },
  "Not sure yet": {
    slots: {
      AGENT_NAME: "your agent",
      TASK: "your agent's task",
      REFERENCE_MATERIALS: "relevant documents, templates, and example data",
    },
    steps: [
      { title: "Find the instructions field", instruction: "Every AI platform has a place for \"system instructions\" or \"custom instructions\" — look for Settings, Configure, or Instructions in your platform." },
      { title: "Paste the full system prompt", instruction: "Copy the entire prompt (all sections) into the instructions field. Don't shorten it — the sections work together." },
      { title: "Upload reference materials", instruction: "Most platforms support file uploads. Add {REFERENCE_MATERIALS} to give the agent context beyond the prompt." },
      { title: "Test with realistic inputs", instruction: "Use actual data, not toy examples. Run 3–5 test cases including messy or incomplete inputs to check edge cases." },
      { title: "Iterate on output quality", instruction: "If the format is wrong, tighten the format instructions. If the tone is off, adjust the role section. Expect 2–3 rounds of iteration." },
      { title: "Share with your team", instruction: "Use your platform's sharing features to deploy the agent. Collect feedback from real users in the first week and iterate." }
    ],
    fallbackTips: [
      "Start with the full prompt — only simplify if the platform has strict character limits.",
      "Upload 2–3 example outputs alongside the prompt — examples teach the AI more effectively than instructions alone.",
      "Test your hardest use case first — if that works, simpler ones will too."
    ],
    fallbackLimitations: ""
  }
};

// AI prompt — fills personalised slot values + tips for this specific agent.
// The AI never generates steps or UI navigation, eliminating hallucination risk.
const SLOT_FILL_SYSTEM = `You personalise a build plan for deploying a specific AI agent on a platform.

You will receive the agent's task description and output format. Your job is to fill in personalised values for template slots AND generate tailored tips.

RULES:
- Fill EVERY slot with a value specific to THIS agent (not generic placeholders)
- Slot values should be concise — a few words to one short sentence max
- Generate exactly 3-4 tips specific to THIS agent on this platform
- Tips should reference the agent's actual task, data, and use case
- Do NOT describe UI navigation or setup steps
- Do NOT mention specific model names
- Note limitations specific to THIS agent (or empty string if none)

RESPONSE FORMAT (JSON only, no markdown):

{
  "slots": {
    "AGENT_NAME": "short name for this agent",
    "TASK": "concise description of what the agent does",
    ...other slots as provided...
  },
  "tips": [
    "Specific tip for this agent",
    "Another tip referencing the agent's actual task"
  ],
  "limitations": "Limitations for THIS agent on this platform, or empty string"
}

Do NOT add preamble, commentary, or explanation outside the JSON object.`;

export const agentsetupguide = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { platform, output_format, task_description } = req.body;

    // 1. Look up hardcoded template for this platform
    const template = PLATFORM_TEMPLATES[platform];
    if (!template) {
      res.status(400).json({ error: `Unknown platform: ${platform}` });
      return;
    }

    // 2. Ask AI to fill slots + generate tips (one simple call)
    let slotValues: Record<string, string> = { ...template.slots, TASK: task_description || template.slots.TASK };
    let tips = template.fallbackTips;
    let limitations = template.fallbackLimitations;

    try {
      const slotNames = Object.keys(template.slots).join(", ");
      const userMessage = `Platform: ${platform}\n\nAgent Task: ${task_description}\n\nOutput Format: ${JSON.stringify(output_format, null, 2)}\n\nSlots to fill: ${slotNames}\n\nFill each slot with a value personalised to this specific agent, and generate tips.`;

      const result = await callGemini({ apiKey, model, systemPrompt: SLOT_FILL_SYSTEM, userMessage, label: "agent-setup-slots" });
      if (result.ok && result.data) {
        // Merge AI slots with defaults (AI values override defaults)
        if (result.data.slots && typeof result.data.slots === "object") {
          slotValues = { ...slotValues, ...result.data.slots };
        }
        if (Array.isArray(result.data.tips) && result.data.tips.length > 0) {
          tips = result.data.tips;
        }
        if (typeof result.data.limitations === "string") {
          limitations = result.data.limitations;
        }
      }
    } catch (aiErr) {
      console.warn("Slot personalization failed, using defaults:", aiErr);
    }

    // 3. Inject slot values into step templates
    const steps = template.steps.map(s => ({
      title: s.title.replace(/\{(\w+)\}/g, (_: string, k: string) => slotValues[k] || k),
      instruction: s.instruction.replace(/\{(\w+)\}/g, (_: string, k: string) => slotValues[k] || k),
    }));

    // 4. Return merged response
    res.status(200).json({ steps, tips, limitations });
  } catch (err) {
    console.error("agent-setup-guide error:", err);
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

## LEVEL PROJECT REQUIREMENTS — MUST FOLLOW

Each level has a specific skill being tested. The project you design MUST target that skill. Do NOT assign projects that belong to a higher or lower level.

**Level 1 — Prompt Engineering**
The project must test the learner's ability to craft effective prompts. The deliverable should be a set of structured prompts (e.g. a prompt library, a before/after prompt comparison, or a prompt template for a specific workflow). No agents, no automation, no code — just excellent prompting applied to their real work.
Example: "Create a prompt library of 5 structured prompts for [their function], showing the before (naive prompt) and after (engineered prompt) with output comparisons."

**Level 2 — Agent Building**
The project must involve creating a reusable AI agent (e.g. a Custom GPT, Claude Project, or Copilot Agent) that automates a repeated task in their role. The agent should be designed so it can be shared with teammates to standardise a process. No multi-step workflows or pipelines — just a single, well-designed agent.
Example: "Build a Custom GPT that [specific repeated task for their role] and write a 1-page usage guide so a colleague can use it immediately."

**Level 3 — Workflow Automation**
The project must involve connecting multiple systems or steps into an automated pipeline. Think: triggers, data flows between tools, and automated outputs. The learner should use tools like n8n, Zapier, Make, or equivalent. This is NOT about building a UI — it's about orchestrating backend processes.
Example: "Design and build an automated workflow where [trigger event] feeds data into [processing step] and outputs [result] — e.g. meeting transcripts automatically summarised and pushed to a CRM."

**Level 4 — Dashboard / Frontend UI**
The project must involve building a visual interface or dashboard that surfaces data or AI outputs to users. This is where UI/UX becomes the focus. The learner should build a working frontend (using no-code tools like Lovable, Bolt, Replit, or coded with React/HTML). The dashboard typically visualises outputs from a Level 3-style workflow.
Example: "Build an interactive dashboard that displays [relevant metrics/outputs for their role] with filters, role-based views, and clean data visualisation."

**Level 5 — Full-Stack Application**
The project must involve building a complete application with backend infrastructure: database, authentication, hosting, and a polished frontend. This is the capstone — the learner architects and ships a real product. It should combine skills from all previous levels.
Example: "Architect and deploy a full-stack AI application that [solves their specific challenge], including user authentication, a database, API integrations, and a hosted frontend."

## PROJECT DESIGN RULES
- The project MUST be personalised to the learner's role, function, and stated challenge.
- The project complexity must match the level — do not over-scope Level 1 or under-scope Level 5.
- The deliverable should be concrete and demonstrable (something they can show to their manager).
- Each projectDescription should be 2-3 sentences explaining what they'll build and why it matters for their work.
- Each deliverable should be a single clear sentence describing the tangible output.

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
      "comfortable-user": "Comfortable User — uses AI tools regularly",
      "builder": "Builder — has created custom AI agents or prompt templates",
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

You must respond with a JSON object containing these sections:

SECTION 1: DESIGN SCORE
Evaluate the application design across 5 criteria:
- User Clarity: How well-defined are the user roles, needs, and journeys? (Score 0-100)
- Data Architecture: How clear and feasible is the data model, storage, and flow? (Score 0-100)
- Personalisation: How well does the design incorporate user-specific experiences? (Score 0-100)
- Technical Feasibility: How realistic is the proposed architecture with available tools? (Score 0-100)
- Scalability: How well would this design handle growth in users, data, or features? (Score 0-100)

Calculate an overall score (weighted average — User Clarity 25%, Data Architecture 25%, Personalisation 15%, Technical Feasibility 20%, Scalability 15%).

Provide a verdict, a rationale paragraph explaining the score.

For EACH criterion, also provide:
- "assessment": A concise summary of the score rationale. MAXIMUM 120 characters (roughly one printed line). Be direct and specific — no filler words.
- "confidence": "explicit" if the user's description gave enough information to score this directly, "inferred" if you had to make assumptions to score it.
- "what_to_define": A specific, actionable prompt describing what the user needs to clarify. MAXIMUM 150 characters. Reference their actual app — not generic advice.

SECTION 2: MATRIX PLACEMENT
Position the application on a 2D strategic matrix:
- technical_complexity (0-100): Derived from how complex the build is. Higher = more complex. Consider: number of integrations, data pipeline complexity, real-time requirements, security needs. Approximate formula: 100 - ((technical_feasibility * 0.6 + scalability * 0.4) * 0.8 + 10). Clamp to 10-95 range.
- business_impact (0-100): Derived from how much value this delivers. Higher = more impact. Consider: user base size, problem urgency, revenue potential, competitive advantage. Approximate formula: (user_clarity * 0.5 + personalisation * 0.3 + data_architecture * 0.2). Clamp to 10-95 range.
- quadrant: One of "Quick Win" (complexity<50, impact>=50), "Strategic Investment" (complexity>=50, impact>=50), "Nice to Have" (complexity<50, impact<50), "Rethink" (complexity>=50, impact<50)
- quadrant_description: One sentence explaining WHY this app falls in this quadrant, specific to the user's app.
- playbook_framing: 2-3 sentences directly addressing the user's situation given their quadrant, score, and app context. Acknowledge specifics from their description. Tone: a senior colleague giving honest advice.
- playbook_questions: Array of exactly 4 questions the user should be able to answer before moving forward. Tailored to their quadrant AND their specific app — not generic. Each question is 1 sentence.
- playbook_first_move: The single most important next action for this user given their quadrant. 2-3 sentences. Concrete and specific to their app.

SECTION 3: ARCHITECTURE & COMPONENTS
Break the application into its core components. For each component, provide:
- name: Component name (e.g., "Authentication Layer", "Content Engine", "Analytics Dashboard")
- description: What this component does and why it's needed
- tools: Array of recommended tools/technologies (e.g., ["Supabase Auth", "Row-Level Security"])
- level_connection: Which OXYGY level (1-5) this component most relates to
- priority: "essential" | "recommended" | "optional"

Include 4-8 components. Always include authentication, core AI logic, data storage, and user interface.

SECTION 4: RISKS & GAPS
Identify 3-5 potential risks or gaps in the design. For each:
- name: Short risk name
- severity: "high" | "medium" | "low"
- description: What the risk is and why it matters
- mitigation: Specific strategy to address this risk

Include at least one risk from each severity level when possible.

Provide a summary sentence for sections 3 and 4.

ABSOLUTE RULE — TOOL AND MODEL AGNOSTIC:
Never mention specific AI providers (OpenAI, Anthropic, Google) or models (GPT-4, Claude, Gemini) in the output. Use generic terms: "AI model", "LLM", "your chosen AI platform", "the AI model approved by your organisation".

SECTION 5: NEXT QUESTION
Provide a "next_question" field: the single most important unresolved question the evaluation surfaced. 1-2 sentences. This should be the thing most likely to change the score or the quadrant if answered well.

SECTION 6: REFINEMENT QUESTIONS
Generate 3-5 follow-up questions that would help you produce a significantly improved evaluation if the user answered them. Questions must be specific to the user's particular application — not generic. Reference their app name, domain, or specific features in the questions.

RESPONSE FORMAT (JSON only, no markdown):

{
  "design_score": {
    "overall_score": 75,
    "verdict": "Promising design with solid user clarity",
    "rationale": "...",
    "criteria": {
      "user_clarity": { "score": 85, "assessment": "...", "confidence": "explicit", "what_to_define": "..." },
      "data_architecture": { "score": 70, "assessment": "...", "confidence": "inferred", "what_to_define": "..." },
      "personalisation": { "score": 65, "assessment": "...", "confidence": "inferred", "what_to_define": "..." },
      "technical_feasibility": { "score": 80, "assessment": "...", "confidence": "explicit", "what_to_define": "..." },
      "scalability": { "score": 60, "assessment": "...", "confidence": "inferred", "what_to_define": "..." }
    }
  },
  "matrix_placement": {
    "technical_complexity": 62,
    "business_impact": 78,
    "quadrant": "Strategic Investment",
    "quadrant_description": "Your learning platform has high user value but requires complex data pipelines and real-time personalisation — a worthy investment with careful phasing.",
    "playbook_framing": "Your app has strong user clarity but the personalisation engine needs real-time data pipelines that add significant complexity. The score gap between user clarity (85) and scalability (60) suggests you should validate the data architecture before committing to the full build.",
    "playbook_questions": ["What volume of concurrent users do you need to support at launch vs. year one?", "Which personalisation signals (behaviour, role, explicit preferences) will drive the AI model?", "Do you have existing data infrastructure or are you building from scratch?", "What is your team's experience with real-time data pipelines and event-driven architecture?"],
    "playbook_first_move": "Before writing any code, map out exactly which data points feed your personalisation engine and where they come from. Build a simple prototype that proves the AI can deliver meaningfully different experiences for two distinct user segments — this validates the core value proposition before you invest in the full architecture."
  },
  "architecture": {
    "summary": "Your application requires 6 core components...",
    "components": [
      { "name": "...", "description": "...", "tools": ["..."], "level_connection": 1, "priority": "essential" }
    ]
  },
  "risks_and_gaps": {
    "summary": "3 key risks identified across data, security, and scalability...",
    "items": [
      { "name": "...", "severity": "high", "description": "...", "mitigation": "..." }
    ]
  },
  "next_question": "The single most important unresolved question...",
  "refinement_questions": [
    "Specific question about the user's app...",
    "Another specific question..."
  ]
}`;

const EVALUATE_APP_BUILD_PLAN_SYSTEM = `You are the OXYGY AI Build Plan Generator — an expert in creating practical, strategic build plans for AI-powered applications.

You will receive:
1. An application description and its approved design assessment
2. The user's CHOSEN tech stack: specific hosting platform, database/auth provider, and AI model provider

Your job is to generate a strategic, practical build plan that guides the user through building their AI app step by step. Reference their specific tools by name (e.g., "Vercel", "Supabase", "Claude") — the user has explicitly chosen these.

IMPORTANT: This is a STRATEGIC build plan, not a technical tutorial. Focus on WHAT to do and WHY, not CLI commands or file paths. Write for someone who will use an AI coding platform (Cursor, Lovable, Bolt, Replit, etc.) to do the actual coding.

You must respond with a JSON object containing these sections:

SECTION 1: BUILD PLAN SUMMARY
2-3 sentences naming the chosen stack and summarising the overall approach.

SECTION 2: BUILD OVERVIEW
A 3-4 sentence narrative paragraph explaining how the user's selected tools (hosting, database, AI engine) work together to power this specific application. Describe the data flow: how user requests reach the AI engine, how data is stored, and how the frontend serves it all. Name the specific tools.

SECTION 3: IMPLEMENTATION PHASES
Generate EXACTLY 7 phases in this order. Each phase has:
- phase: Phase title (use the exact titles below)
- description: 2-3 sentences on what this phase achieves
- why_this_matters: 1-2 sentences explaining why this phase comes at this point in the sequence
- key_activities: 3-5 practical activities (NOT CLI commands — describe what to do, not how to type it)
- deliverables: 2-4 concrete outputs the user should have when this phase is complete
- tech_stack_notes: 1-2 sentences on how the chosen hosting/database/AI engine specifically applies to this phase. Name the actual tools.
- duration_estimate: Realistic time estimate

The 7 phases in order:

PHASE 1: "How Your Tools Work Together"
Overview of the selected tech stack architecture. Explain which tool handles what (frontend hosting, data persistence, AI processing), how data flows between them, and common integration patterns for this specific combination.

PHASE 2: "Generate Your PRD"
Using the OXYGY Level 4 App Designer to create a complete Product Requirements Document. Reference the importance of PRD generation before any building. Address gaps identified by the design score. Define features with user stories, acceptance criteria, and data requirements.

PHASE 3: "Build the Core AI Pipeline"
Get the primary user flow working end-to-end using an AI coding platform. Build the core AI-powered feature first — data ingestion, AI processing, output display. Ensure the UI renders correctly. The goal is a near-complete first version where a target user can walk through the main flow and see real results.

PHASE 4: "Validate Data Quality & Output Accuracy"
Before adding users, ensure the information quality is good. Test data ingestion, data aggregation, data processing, output format, and user expectations. Run representative test cases. Refine AI prompts based on failures. Check for hallucinations and edge cases.

PHASE 5: "Define Your Full Feature Set"
Now that the core works, define ALL remaining features before building infrastructure. Review what's working, define secondary features/settings/admin views, prioritise into must-have vs later iterations, and map each feature to the data it needs stored and the user roles that access it. This MUST happen before database setup.

PHASE 6: "Set Up Authentication & Database"
Add persistent infrastructure now that features are clearly defined. Set up the selected database with schema matching the full feature set. Add authentication, configure access controls, secure API keys, migrate from mock data to real storage.

PHASE 7: "User Testing with Target Groups"
Structured testing with real users from the target audience. Identify 2-3 core testing groups from the problem statement. Define specific test cases per group. Give testers clear instructions. Collect feedback on task completion, AI output usefulness, and UI intuitiveness.

SECTION 4: ARCHITECTURE COMPONENTS
4-8 components, each with:
- name, description, tools (specific to chosen stack), level_connection, priority
Reference the ACTUAL chosen tools, not generic alternatives.

SECTION 5: RISKS & GAPS
3-5 risks specific to the chosen stack combination. For each:
- name, severity, description, mitigation
Include at least one risk about how the chosen tools interact with each other.

SECTION 6: STACK INTEGRATION NOTES
A paragraph explaining how the 3 chosen tools work together — what connects them, common patterns, and gotchas specific to this combination.

SECTION 7: REFINEMENT QUESTIONS
3-5 follow-up questions to improve the build plan further.

If the user selected "Not sure yet" for any stack component, provide platform-agnostic guidance for that layer and suggest 2-3 options with trade-offs.

RESPONSE FORMAT (JSON only, no markdown):

{
  "build_plan_summary": "...",
  "build_overview": "...",
  "implementation_phases": [
    { "phase": "...", "description": "...", "why_this_matters": "...", "key_activities": ["..."], "deliverables": ["..."], "tech_stack_notes": "...", "duration_estimate": "..." }
  ],
  "architecture_components": [
    { "name": "...", "description": "...", "tools": ["..."], "level_connection": 1, "priority": "essential" }
  ],
  "risks_and_gaps": {
    "summary": "...",
    "items": [
      { "name": "...", "severity": "high", "description": "...", "mitigation": "..." }
    ]
  },
  "stack_integration_notes": "...",
  "refinement_questions": ["...", "..."]
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
// 10b. EVALUATE APP BUILD PLAN (Level 5 — Step 3)
// ═══════════════════════════════════════════════════════════════

export const evaluateappbuildplan = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey, model } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { appDescription, problemAndUsers, architecture_summary, design_score_summary, matrix_quadrant, tech_stack, refinement_context } = req.body;

    const baseParts = [
      `APP DESCRIPTION:\n${appDescription || "Not provided"}`,
      `PROBLEM & USERS:\n${problemAndUsers || "Not provided"}`,
      `DESIGN SCORE SUMMARY:\n${design_score_summary || "Not provided"}`,
      `ARCHITECTURE OVERVIEW:\n${architecture_summary || "Not provided"}`,
      `MATRIX QUADRANT: ${matrix_quadrant || "Not determined"}`,
      `\nSELECTED TECH STACK:`,
      `- Hosting: ${tech_stack?.hosting || "Not selected"}`,
      `- Database & Auth: ${tech_stack?.database_auth || "Not selected"}`,
      `- AI Engine: ${tech_stack?.ai_engine || "Not selected"}`,
    ];
    if (refinement_context && typeof refinement_context === "string") {
      baseParts.push(`\n${refinement_context}`);
    }
    const userMessage = baseParts.join("\n");

    const result = await callGemini({ apiKey, model, systemPrompt: EVALUATE_APP_BUILD_PLAN_SYSTEM, userMessage, label: "evaluate-app-build-plan" });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }
    res.status(200).json(result.data);
  } catch (err) {
    console.error("evaluate-app-build-plan error:", err);
    res.status(500).json({ error: "Internal server error", retryable: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 11. GENERATE PRD
// ═══════════════════════════════════════════════════════════════

const PRD_SYSTEM = `You are a senior product manager who writes PRDs specifically optimised for AI coding tools (Cursor, Lovable, Bolt.new, V0, Replit Agent, Claude Code). Your PRDs are the exact specification an AI agent reads to build a working app — every sentence either constrains a decision or describes a testable behaviour.

The user may be building anything — a professional dashboard, a personal side project, an internal tool, or any web application. Match the PRD's complexity to the project scope.

CRITICAL RULES:
- Be SPECIFIC — reference the user's exact features, users, data sources in every section.
- Every feature: "When X happens, do Y." Not vague goals.
- Lock down every decision point. Include edge cases, error states, empty states, loading states.
- Be quantitative: pixel sizes, breakpoints, loading times, grid ratios.
- IMPORTANT: Every section value MUST be a plain text STRING. Use newlines and bullets. Never nest JSON objects.

READINESS ASSESSMENT:
After generating the PRD, evaluate the user's brief across 5 criteria. Score each 0-100:
- Feasibility: Can this realistically be built with the described tech stack and scope?
- Scope Clarity: How well-defined are the boundaries, features, and requirements?
- User Value: How clear and compelling is the value proposition for the target users?
- Technical Complexity: How appropriate is the complexity level for the chosen tools?
- Data Requirements: How well-defined are the data sources, models, and integrations?

Provide an overall_score (0-100), a one-line verdict, and a 2-3 sentence rationale.

REFINEMENT QUESTIONS:
Generate 3-5 targeted follow-up questions that would meaningfully improve the PRD if answered. Questions must:
- Reference the user's actual task, data, and context
- Seek information that would fill gaps in the PRD
- NOT ask about things already specified in the brief

SUPPLEMENTARY VIEWS:
- screen_map: A text description of the app's screens/pages with navigation flow. Use arrows (→) and indentation to show hierarchy. Include screen names, key components on each screen, and navigation paths.
- data_model: A text description of the core data entities, their fields, relationships, and constraints. Use a structured format like "Entity { field: type }" with relationship annotations.

RESPONSE FORMAT (JSON only, no markdown, no code fences):
{
  "prd_content": "PRD: [Descriptive app name]",
  "sections": {
    "project_overview": "SECTION CONTENT",
    "tech_stack": "SECTION CONTENT",
    "file_structure": "SECTION CONTENT",
    "data_models": "SECTION CONTENT",
    "feature_requirements": "SECTION CONTENT",
    "api_routes": "SECTION CONTENT",
    "ui_specifications": "SECTION CONTENT",
    "auth_permissions": "SECTION CONTENT",
    "scope_boundaries": "SECTION CONTENT",
    "acceptance_criteria": "SECTION CONTENT",
    "design_tokens": "SECTION CONTENT",
    "implementation_plan": "SECTION CONTENT"
  },
  "readiness": {
    "overall_score": 82,
    "verdict": "Strong foundation — ready to build with minor refinements",
    "rationale": "2-3 sentence explanation of the score",
    "criteria": {
      "feasibility": { "label": "Feasibility", "score": 85, "assessment": "One-line assessment" },
      "scope_clarity": { "label": "Scope Clarity", "score": 80, "assessment": "One-line assessment" },
      "user_value": { "label": "User Value", "score": 90, "assessment": "One-line assessment" },
      "technical_complexity": { "label": "Technical Complexity", "score": 75, "assessment": "One-line assessment" },
      "data_requirements": { "label": "Data Requirements", "score": 80, "assessment": "One-line assessment" }
    }
  },
  "refinement_questions": [
    "Question 1 referencing the user's specific context?",
    "Question 2 about a gap in the brief?",
    "Question 3 about an important decision point?"
  ],
  "screen_map": "Screen map text content",
  "data_model": "Data model text content"
}

SECTIONS:
1. PROJECT OVERVIEW (20-30 sentences): App name, elevator pitch, problem, users, success criteria, scope boundaries. Detailed VISUAL DESCRIPTION of layout. Colour/style direction with hex codes. 2-3 key user flows step-by-step. Must be enough to understand the full app alone.
2. TECH STACK & CONSTRAINTS (10-15 sentences): Lock down framework+version, styling, UI library, charting, backend, database, auth, hosting, key dependencies, packages to avoid.
3. FILE & FOLDER STRUCTURE (8-12 sentences): Explicit directory tree. Naming conventions. Where pages, components, hooks, utils, types, and tests live.
4. DATA MODELS & SCHEMA (10-15 sentences): Every entity: EntityName { field: type }. Relationships. Enums. Required vs optional. Defaults. Validation rules.
5. FEATURE REQUIREMENTS (15-25 sentences): "When X, do Y" for every feature. Trigger → action → result → error. Loading states. Empty states. Error states.
6. API & DATA LAYER (10-15 sentences): Per operation: method, path, request/response shapes, error codes. Refresh strategy. Caching. Error handling.
7. UI & DESIGN SYSTEM (12-18 sentences): Colour palette (hex codes). Typography scale. Spacing system. Card specs. Page layouts referencing mockup. Component hierarchy. Responsive breakpoints. Accessibility.
8. AUTH & PERMISSIONS (6-10 sentences): Auth provider, method, roles, protected routes. Or explicitly "No auth needed."
9. SCOPE & BOUNDARIES (8-12 sentences): ALWAYS DO / ASK FIRST / NEVER DO tiers. Out-of-scope list. Future considerations.
10. ACCEPTANCE CRITERIA (15-25 numbered items): One per feature. Performance. Responsive. Error handling. Accessibility. Verification commands.
11. DESIGN TOKENS & VISUAL REFERENCE: Based on the user's brief (visual style, color scheme, inspiration images), generate a concrete design token specification. Include primary, secondary, accent, and neutral color hex values. Font family from Google Fonts. Border radius, spacing scale, and shadow tokens. Component-level style notes (card, button, input). Format as a CSS variables block (:root { --color-primary: #...; ... }).
12. IMPLEMENTATION PHASES (10-15 sentences): Vertical slices: Phase 1 foundation, Phase 2 core feature, Phase 3 secondary, Phase 4 polish. Each: files, deliverable, verification.`;

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
// 11b. APP BUILD GUIDE (platform-specific instructions from PRD)
// ═══════════════════════════════════════════════════════════════

const APP_BUILD_GUIDE_SYSTEM = `You are an expert AI-assisted development coach. The user has already generated a PRD (Product Requirements Document) for their app and has chosen an AI coding platform. They already have the platform installed and ready to go.

Your job is to create a practical guide for HOW TO USE THE PRD with their chosen platform to kick off the build. This is NOT a guide for building each component — it is a guide for setting up their AI coding environment, configuring the AI's context with the PRD, and prompting effectively so the platform can do the heavy lifting.

CRITICAL FRAMING:
- The user is NOT a developer — they are using an AI coding platform to build for them
- The platform is already installed. Do NOT include installation or download steps
- The PRD is the user's primary asset. The guide should teach them how to feed it to the platform
- Each step should tell the user what to do in the platform's UI and what to paste/configure
- The goal is: user finishes the guide → the AI platform has full context → they can start prompting for features

RESPONSE FORMAT (JSON only, no markdown fences, no preamble):
{
  "steps": [
    {
      "title": "Step title",
      "instruction": "Detailed instruction text. Can include markdown formatting like **bold**, \`code\`, and line breaks via \\n\\n."
    }
  ],
  "tips": ["Pro tip 1", "Pro tip 2"],
  "limitations": "Platform-specific limitations or caveats",
  "prd_snippet": "A ready-to-paste excerpt from the PRD, formatted for the platform. For CLI tools this should be markdown. For chat-based tools this should be a well-structured prompt. Include the app name, purpose, key features, tech stack, and UI/design requirements — trimmed to what the platform needs for a strong first pass."
}

STEP STRUCTURE — generate 4-6 steps covering these phases:
1. PROJECT INITIALISATION — Create a new project/workspace in the platform. What to name it, what template to pick (if any).
2. CONFIGURE AI CONTEXT — This is the most important step. Teach the user how to set up the platform's AI context mechanism with their PRD content:
   - For CLI tools: what file to create (e.g. CLAUDE.md, .cursorrules), what to put in it
   - For chat tools: how to structure the initial prompt or system instructions
   - For agent tools: how to describe the project scope
   Be specific about WHERE in the platform UI to paste and WHAT sections of the PRD to include.
3. FIRST PROMPT / KICK-OFF — What to say or do to get the platform to start generating the app. Reference specific PRD sections. Explain what a good first prompt looks like vs a bad one.
4. REVIEW & ITERATE — How to review what the platform generates, how to give feedback, how to course-correct using the PRD as the source of truth. Platform-specific features for iteration (e.g. plan mode, composer, chat follow-ups).
5. OPTIONAL: Any platform-specific extras (e.g. connecting a database, enabling specific modes, setting up environment variables).

RULES:
- Each step instruction should be 3-6 sentences with specific, actionable detail
- Reference PRD sections by name (e.g. "the Tech Stack section", "the UI & Design System section")
- Include exact UI paths where relevant (e.g. "Open Settings → System Prompt", "Create a file called CLAUDE.md in the project root")
- The prd_snippet field must be a condensed, ready-to-paste version of the PRD — not the full document. Focus on: app purpose, core features, tech stack, and design requirements. Format it appropriately for the platform
- Tips should be platform-specific best practices for getting the best AI output (3-5 tips)
- Limitations should honestly state what the platform struggles with for this type of app
- NEVER mention specific AI model names (GPT-4, Claude, Gemini). Use "the AI" or "the platform's AI"

PLATFORM-SPECIFIC GUIDANCE:

Cursor:
- Context file: .cursorrules in project root — paste a condensed PRD here so the AI always has context
- Composer mode: teach users to use Composer (Cmd+I) for multi-file generation, referencing the PRD
- Step-by-step prompting: start with "Build the app described in .cursorrules" then iterate section by section
- Chat vs Composer: explain when to use inline chat (small edits) vs Composer (new features)
- Reference files: teach @-mentioning files and the PRD in prompts

Lovable:
- Initial prompt: the entire PRD can be pasted as the first message — Lovable handles long context well
- Iteration: use follow-up messages to refine, reference specific PRD sections
- Supabase: if the PRD mentions a database, guide them through Lovable's Supabase integration
- Preview: use the live preview to compare against PRD design requirements

Bolt.new:
- Initial prompt: paste a focused version of the PRD as the first message
- StackBlitz: explain the live environment, how to see changes in real-time
- Iteration: use chat to request changes, referencing PRD sections
- Limitations: mention file system constraints and package limitations

Claude Code:
- CLAUDE.md: create this file in project root with the full PRD content — this is the AI's persistent memory
- Plan mode: start with /plan to let the AI read the PRD and propose an architecture before coding
- Agentic workflow: the AI will create files, run commands, and iterate — teach the user to review and approve
- Iterative prompting: after the initial build, reference specific PRD sections for refinement

Codex (OpenAI):
- Task description: paste the PRD summary as the task, let the agent plan the implementation
- Repository structure: if starting fresh, describe the desired structure from the PRD
- Review: Codex proposes changes — teach the user to review diffs against PRD requirements

Google AI Studio:
- System instructions: paste the condensed PRD into the System Instructions field
- Structured prompting: teach users to ask for one section at a time, referencing the PRD
- Code generation: explain how to request full file outputs and copy them into their project
- This platform requires more manual assembly — the user copies generated code into their own project

V0 (Vercel):
- Component-by-component: V0 excels at generating individual UI components — reference the UI & Design System section
- Prompt structure: include design details, colour palette, and component behaviour from the PRD
- Next.js: V0 generates Next.js/React code — mention this if the PRD specifies a different framework
- Integration: teach users to copy generated components into their project and connect them

Replit Agent:
- Project description: paste the PRD summary as the initial agent description
- Replit handles deployment, database, and hosting — guide users to enable these from the PRD requirements
- Iteration: use chat to refine, reference specific PRD sections
- Database: if the PRD includes data models, guide the user to describe them to the agent

Not sure yet:
- Give platform-agnostic advice: create a project context file, structure the PRD as an effective prompt, iterate section by section
- Recommend trying a chat-based platform (Lovable, Bolt, Replit) for beginners or a CLI tool (Cursor, Claude Code) for more control`;

export const appbuildguide = onRequest({ secrets: [openRouterApiKey] }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { apiKey } = getEnv();
  if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

  try {
    const { platform, prd_content, app_description } = req.body;
    if (!platform || !prd_content) {
      res.status(400).json({ error: "Missing platform or prd_content" });
      return;
    }

    const userMessage = `Platform: ${platform}\n\nApp Description: ${app_description || "See PRD"}\n\nFull PRD:\n${prd_content.slice(0, 12000)}`;

    const result = await callOpenRouterRaw({
      apiKey,
      model,
      systemPrompt: APP_BUILD_GUIDE_SYSTEM,
      userMessage,
      label: "app-build-guide",
      temperature: 0.4,
      maxTokens: 4000,
    });
    if (!result.ok) { res.status(result.status).json({ error: result.message, retryable: result.retryable }); return; }

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = result.text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(cleaned);
    } catch {
      console.error("app-build-guide: failed to parse JSON response:", cleaned.slice(0, 500));
      res.status(502).json({ error: "Failed to parse AI response", retryable: true });
      return;
    }

    const steps = Array.isArray(data.steps) ? data.steps : [];
    const tips = Array.isArray(data.tips) ? data.tips : [];
    const limitations = typeof data.limitations === "string" ? data.limitations : "";
    const prd_snippet = typeof data.prd_snippet === "string" ? data.prd_snippet : "";

    res.status(200).json({ steps, tips, limitations, prd_snippet });
  } catch (err) {
    console.error("app-build-guide error:", err);
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
      model,
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
      model,
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

const PLAYGROUND_V2_SYSTEM = `You are the OXYGY Prompt Engineering Coach — an expert practitioner in AI prompting who helps professionals build better prompts for their real work tasks.

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

ABSOLUTE RULE — TOOL AND MODEL AGNOSTIC:
Never mention specific AI providers (OpenAI, Anthropic, Google) or models (GPT-4, Claude, Gemini) in the output. Use generic terms: "AI model", "LLM", "your chosen AI platform", "the AI model approved by your organisation". Platform UI labels (e.g., an n8n node called "OpenAI Chat Model") are acceptable only with a note that the user can substitute their preferred provider.

RULES:
- The prompt must be clean, professional, and immediately usable in any AI platform without modification
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
      model,
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

// ═══════════════════════════════════════════════════════════════
// SEND INVITE EMAIL (via Resend)
// Looks up the user's org by email domain, finds their invite
// code, and sends a formatted email with the code.
// ═══════════════════════════════════════════════════════════════

export const sendinviteemail = onRequest(
  { secrets: [resendApiKey, supabaseUrl, supabaseServiceKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { email, name } = req.body;
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      const domain = email.split("@")[1]?.toLowerCase();
      if (!domain) {
        res.status(400).json({ error: "Invalid email" });
        return;
      }

      // Query Supabase for the org matching this email domain
      const sbUrl = supabaseUrl.value();
      const sbKey = supabaseServiceKey.value();

      // 1. Find org by domain
      const orgRes = await fetchWithRetry(
        `${sbUrl}/rest/v1/organisations?domain=eq.${encodeURIComponent(domain)}&active=eq.true&limit=1`,
        {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json",
          },
        },
        "org-lookup"
      );
      const orgs = await orgRes.json();

      if (!Array.isArray(orgs) || orgs.length === 0) {
        res.status(404).json({
          error: "No organisation found for your email domain. Please contact your facilitator for an invite code.",
        });
        return;
      }

      const org = orgs[0];

      // 2. Find an available (unaccepted) invite code for this org
      const inviteRes = await fetchWithRetry(
        `${sbUrl}/rest/v1/org_invites?org_id=eq.${org.id}&accepted_by=is.null&order=created_at.desc&limit=1`,
        {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            "Content-Type": "application/json",
          },
        },
        "invite-lookup"
      );
      const invites = await inviteRes.json();

      if (!Array.isArray(invites) || invites.length === 0) {
        res.status(404).json({
          error: "No invite codes are currently available for your organisation. Please contact your facilitator.",
        });
        return;
      }

      const inviteCode = invites[0].invite_code;
      const firstName = (name || email.split("@")[0]).split(" ")[0];

      // 3. Send email via Resend
      const resendKey = resendApiKey.value();
      const emailRes = await fetchWithRetry("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "OXYGY AI Upskilling <onboarding@resend.dev>",
          to: [email],
          subject: `Your OXYGY Cohort Code: ${inviteCode}`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;background:#F7FAFC;">
  <div style="max-width:520px;margin:32px auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <!-- Header -->
    <div style="background:#1A202C;padding:28px 32px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.3px;">OXYGY AI Upskilling</div>
      <div style="font-size:13px;color:#A0AEC0;margin-top:4px;">Your Cohort Invite Code</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <div style="font-size:16px;color:#1A202C;font-weight:600;margin-bottom:8px;">
        Hi ${firstName},
      </div>
      <div style="font-size:14px;color:#4A5568;line-height:1.65;margin-bottom:24px;">
        You're part of the <strong>${org.name}</strong> cohort on OXYGY. Enter the code below in the app to join your team's leaderboard and track progress together.
      </div>

      <!-- Code box -->
      <div style="background:#F7FAFC;border:2px dashed #38B2AC;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">
          Your Invite Code
        </div>
        <div style="font-size:32px;font-weight:800;color:#1A202C;letter-spacing:0.15em;font-family:monospace;">
          ${inviteCode}
        </div>
      </div>

      <div style="font-size:13px;color:#718096;line-height:1.6;margin-bottom:24px;">
        <strong>How to use it:</strong><br>
        1. Open the OXYGY app and go to your Dashboard<br>
        2. Find the "Join your cohort" card on the right<br>
        3. Enter the code above and click "Join"
      </div>

      <div style="text-align:center;">
        <a href="https://oxygy-ai-upskilling-site.web.app/app/dashboard" style="display:inline-block;background:#38B2AC;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:24px;font-size:14px;font-weight:700;">
          Open OXYGY Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
      <div style="font-size:11px;color:#A0AEC0;">
        This email was sent by the OXYGY AI Upskilling platform.<br>
        If you didn't request this, you can safely ignore it.
      </div>
    </div>
  </div>
</body>
</html>`,
        }),
      }, "resend-email");

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error("Resend API error:", emailRes.status, errBody);
        res.status(500).json({ error: "Failed to send email. Please try again." });
        return;
      }

      res.status(200).json({ success: true, message: "Invite code sent to your email." });
    } catch (err) {
      console.error("send-invite-email error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ADMIN: INVITE USER (PRD-13)
// ═══════════════════════════════════════════════════════════════

export const admininviteuser = onRequest(
  { secrets: [supabaseUrl, supabaseServiceKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sbUrl = supabaseUrl.value();
    const sbKey = supabaseServiceKey.value();

    // Verify caller is admin
    const token = authHeader.split(" ")[1];
    const userRes = await fetchWithRetry(`${sbUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: sbKey },
    }, "verify-user");
    if (!userRes.ok) { res.status(401).json({ error: "Invalid session" }); return; }
    const caller = await userRes.json();

    // Check platform_role
    const profileRes = await fetchWithRetry(`${sbUrl}/rest/v1/profiles?id=eq.${caller.id}&select=platform_role`, {
      headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey },
    }, "check-profile");
    const profiles = await profileRes.json();
    const role = profiles?.[0]?.platform_role;
    if (role !== "oxygy_admin" && role !== "super_admin") {
      res.status(403).json({ error: "Forbidden — admin access required" });
      return;
    }

    const { email, orgId, cohortId, role: memberRole } = req.body;
    if (!email || !orgId) { res.status(400).json({ error: "email and orgId are required" }); return; }

    try {
      // Check if user already exists by searching admin users API
      const searchRes = await fetchWithRetry(
        `${sbUrl}/auth/v1/admin/users?page=1&per_page=50`,
        { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
        "search-users"
      );
      const allUsers = await searchRes.json();
      const existingUser = allUsers?.users?.find((u: { email: string }) => u.email === email);

      let userId: string;
      let invited = false;

      if (existingUser) {
        userId = existingUser.id;

        // Check for duplicate membership
        const dupRes = await fetchWithRetry(
          `${sbUrl}/rest/v1/user_org_memberships?user_id=eq.${userId}&org_id=eq.${orgId}&active=eq.true&select=id`,
          { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
          "check-dup"
        );
        const dups = await dupRes.json();
        if (dups && dups.length > 0) {
          res.status(409).json({ error: "This user is already enrolled in this organisation." });
          return;
        }
      } else {
        // Invite new user
        const inviteRes = await fetchWithRetry(`${sbUrl}/auth/v1/admin/invite`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sbKey}`,
            apikey: sbKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }, "invite-user");

        if (!inviteRes.ok) {
          const errText = await inviteRes.text();
          console.error("Invite error:", errText);
          res.status(500).json({ error: "Failed to send invite" });
          return;
        }
        const inviteData = await inviteRes.json();
        userId = inviteData.id || inviteData.user?.id;
        invited = true;
      }

      // Create membership
      const membershipBody: Record<string, unknown> = {
        user_id: userId,
        org_id: orgId,
        role: memberRole || "learner",
        cohort_id: cohortId || null,
        enrolled_via: "admin_invite",
        active: true,
      };
      if (invited) membershipBody.pending_email = email;

      const memRes = await fetchWithRetry(`${sbUrl}/rest/v1/user_org_memberships`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sbKey}`,
          apikey: sbKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(membershipBody),
      }, "create-membership");

      if (!memRes.ok) {
        const errText = await memRes.text();
        console.error("Membership creation error:", errText);
        res.status(500).json({ error: "Failed to create membership" });
        return;
      }

      // Write audit log
      await fetchWithRetry(`${sbUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sbKey}`,
          apikey: sbKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          actor_id: caller.id,
          action: "user.invite",
          target_type: "user",
          target_id: userId,
          org_id: orgId,
          metadata: { email, role: memberRole || "learner", invited },
        }),
      }, "audit-log");

      res.status(200).json({ success: true, userId, invited });
    } catch (err) {
      console.error("admin-invite-user error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ADMIN: SCAN USERS BY DOMAIN (PRD-13 — Retroactive Domain Enrollment)
// ═══════════════════════════════════════════════════════════════

export const adminscanbydomian = onRequest(
  { secrets: [supabaseUrl, supabaseServiceKey], cors: true, cpu: "gcf_gen1", minInstances: 0, maxInstances: 3 },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sbUrl = supabaseUrl.value();
    const sbKey = supabaseServiceKey.value();

    // Verify caller is admin
    const token = authHeader.split(" ")[1];
    const userRes = await fetchWithRetry(`${sbUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: sbKey },
    }, "verify-user");
    if (!userRes.ok) { res.status(401).json({ error: "Invalid session" }); return; }
    const caller = await userRes.json();

    // Use the caller's own token to read their profile (RLS allows self-read)
    const profileRes = await fetchWithRetry(`${sbUrl}/rest/v1/profiles?id=eq.${caller.id}&select=platform_role`, {
      headers: { Authorization: `Bearer ${token}`, apikey: sbKey },
    }, "check-profile");
    const profiles = await profileRes.json();
    const role = profiles?.[0]?.platform_role;
    if (role !== "oxygy_admin" && role !== "super_admin") {
      res.status(403).json({ error: "Forbidden — admin access required" });
      return;
    }

    const { domain, orgId } = req.body;
    if (!domain || !orgId) { res.status(400).json({ error: "domain and orgId are required" }); return; }

    try {
      // Paginate through all auth users to find domain matches
      const matchingUsers: { id: string; email: string; fullName: string; alreadyEnrolled: boolean }[] = [];
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      console.log(`[scan-domain] Scanning for domain="${domain}" orgId="${orgId}"`);

      while (hasMore) {
        const listRes = await fetchWithRetry(
          `${sbUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
          { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
          "list-users"
        );

        if (!listRes.ok) {
          const errText = await listRes.text();
          console.error(`[scan-domain] Admin API returned ${listRes.status}: ${errText}`);
          res.status(502).json({ error: `Failed to list users from auth (${listRes.status})` });
          return;
        }

        const data = await listRes.json();
        const users = Array.isArray(data) ? data : (data?.users || []);
        console.log(`[scan-domain] Page ${page}: ${users.length} users returned (response keys: ${Object.keys(data || {}).join(",")})`);

        for (const u of users) {
          const emailDomain = (u.email || "").split("@")[1]?.toLowerCase();
          if (emailDomain === domain.toLowerCase()) {
            matchingUsers.push({
              id: u.id,
              email: u.email,
              fullName: u.user_metadata?.full_name || "",
              alreadyEnrolled: false,
            });
          }
        }

        hasMore = users.length === perPage;
        page++;
        // Safety cap at 50 pages (5000 users)
        if (page > 50) break;
      }

      console.log(`[scan-domain] Total matching users for "${domain}": ${matchingUsers.length}`);
      if (matchingUsers.length === 0) {
        res.status(200).json({ users: [] });
        return;
      }

      // Check which users already have active memberships in this org
      const userIds = matchingUsers.map(u => u.id);
      // Supabase REST API supports in filter
      const inFilter = userIds.map(id => `"${id}"`).join(",");
      const memRes = await fetchWithRetry(
        `${sbUrl}/rest/v1/user_org_memberships?user_id=in.(${inFilter})&org_id=eq.${orgId}&active=eq.true&select=user_id`,
        { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
        "check-memberships"
      );
      const existingMemberships = await memRes.json();
      const enrolledSet = new Set((existingMemberships || []).map((m: { user_id: string }) => m.user_id));

      // Also fetch profile names for users that have them
      const profilesRes = await fetchWithRetry(
        `${sbUrl}/rest/v1/profiles?id=in.(${inFilter})&select=id,full_name`,
        { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
        "fetch-profiles"
      );
      const profileData = await profilesRes.json();
      const nameMap = new Map<string, string>((profileData || []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));

      for (const u of matchingUsers) {
        u.alreadyEnrolled = enrolledSet.has(u.id);
        if (nameMap.has(u.id) && nameMap.get(u.id)) {
          u.fullName = nameMap.get(u.id)!;
        }
      }

      res.status(200).json({ users: matchingUsers });
    } catch (err) {
      console.error("admin-scan-domain error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ADMIN: BULK ENROLL USERS (CSV Upload)
// ═══════════════════════════════════════════════════════════════

export const adminbulkenroll = onRequest(
  { secrets: [supabaseUrl, supabaseServiceKey], cors: true, cpu: "gcf_gen1", minInstances: 0, maxInstances: 3 },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sbUrl = supabaseUrl.value();
    const sbKey = supabaseServiceKey.value();

    // Verify caller is admin
    const token = authHeader.split(" ")[1];
    const userRes = await fetchWithRetry(`${sbUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: sbKey },
    }, "verify-user");
    if (!userRes.ok) { res.status(401).json({ error: "Invalid session" }); return; }
    const caller = await userRes.json();

    // Check platform_role
    const profileRes = await fetchWithRetry(`${sbUrl}/rest/v1/profiles?id=eq.${caller.id}&select=platform_role`, {
      headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey },
    }, "check-profile");
    const profiles = await profileRes.json();
    const role = profiles?.[0]?.platform_role;
    if (role !== "oxygy_admin" && role !== "super_admin") {
      res.status(403).json({ error: "Forbidden — admin access required" });
      return;
    }

    const { users, orgId, cohortId } = req.body;

    // Validate inputs
    if (!orgId) { res.status(400).json({ error: "orgId is required" }); return; }
    if (!Array.isArray(users) || users.length === 0) { res.status(400).json({ error: "users array is required and must not be empty" }); return; }
    if (users.length > 200) { res.status(400).json({ error: "Maximum 200 users per request" }); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const u of users) {
      if (!u.email || !emailRegex.test(u.email)) {
        res.status(400).json({ error: `Invalid email: ${u.email || "(empty)"}` });
        return;
      }
    }

    try {
      const results: Array<{ email: string; success: boolean; error?: string; invited: boolean; alreadyEnrolled: boolean }> = [];
      let enrolledCount = 0;
      let invitedCount = 0;
      let failedCount = 0;
      let alreadyEnrolledCount = 0;

      for (const userEntry of users) {
        const email = userEntry.email.trim().toLowerCase();
        const fullName = userEntry.full_name?.trim() || "";
        const memberRole = userEntry.role || "learner";

        try {
          // Search for existing user by paginating through auth users
          let existingUser: { id: string; email: string } | null = null;
          let page = 1;
          const perPage = 100;
          let hasMore = true;

          while (hasMore && !existingUser) {
            const listRes = await fetchWithRetry(
              `${sbUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
              { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
              "list-users"
            );

            if (!listRes.ok) {
              throw new Error(`Failed to list users from auth (${listRes.status})`);
            }

            const data = await listRes.json();
            const authUsers = Array.isArray(data) ? data : (data?.users || []);

            const found = authUsers.find((u: { email: string }) => u.email?.toLowerCase() === email);
            if (found) {
              existingUser = { id: found.id, email: found.email };
            }

            hasMore = authUsers.length === perPage;
            page++;
            if (page > 50) break; // Safety cap
          }

          let userId: string;
          let invited = false;

          if (existingUser) {
            userId = existingUser.id;
          } else {
            // Invite new user
            const inviteRes = await fetchWithRetry(`${sbUrl}/auth/v1/admin/invite`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${sbKey}`,
                apikey: sbKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email }),
            }, "invite-user");

            if (!inviteRes.ok) {
              const errText = await inviteRes.text();
              console.error(`[bulk-enroll] Invite error for ${email}:`, errText);
              results.push({ email, success: false, error: "Failed to send invite", invited: false, alreadyEnrolled: false });
              failedCount++;
              continue;
            }
            const inviteData = await inviteRes.json();
            userId = inviteData.id || inviteData.user?.id;
            invited = true;
          }

          // Check if already has membership in this org
          const dupRes = await fetchWithRetry(
            `${sbUrl}/rest/v1/user_org_memberships?user_id=eq.${userId}&org_id=eq.${orgId}&active=eq.true&select=id`,
            { headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey } },
            "check-dup"
          );
          const dups = await dupRes.json();
          if (dups && dups.length > 0) {
            results.push({ email, success: true, invited: false, alreadyEnrolled: true });
            alreadyEnrolledCount++;
            continue;
          }

          // Create membership
          const membershipBody: Record<string, unknown> = {
            user_id: userId,
            org_id: orgId,
            role: memberRole,
            cohort_id: cohortId || null,
            enrolled_via: "csv_upload",
            active: true,
          };
          if (invited) membershipBody.pending_email = email;

          const memRes = await fetchWithRetry(`${sbUrl}/rest/v1/user_org_memberships`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${sbKey}`,
              apikey: sbKey,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(membershipBody),
          }, "create-membership");

          if (!memRes.ok) {
            const errText = await memRes.text();
            console.error(`[bulk-enroll] Membership error for ${email}:`, errText);
            results.push({ email, success: false, error: "Failed to create membership", invited, alreadyEnrolled: false });
            failedCount++;
            continue;
          }

          // If new user with full_name, upsert profile
          if (invited && fullName) {
            await fetchWithRetry(`${sbUrl}/rest/v1/profiles`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${sbKey}`,
                apikey: sbKey,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates,return=minimal",
              },
              body: JSON.stringify({ id: userId, full_name: fullName }),
            }, "upsert-profile");
          }

          results.push({ email, success: true, invited, alreadyEnrolled: false });
          enrolledCount++;
          if (invited) invitedCount++;

        } catch (userErr) {
          console.error(`[bulk-enroll] Error processing ${email}:`, userErr);
          results.push({ email, success: false, error: String(userErr), invited: false, alreadyEnrolled: false });
          failedCount++;
        }
      }

      // Write ONE audit log entry with summary
      await fetchWithRetry(`${sbUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sbKey}`,
          apikey: sbKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          actor_id: caller.id,
          action: "user.bulk_enroll",
          target_type: "organisation",
          target_id: orgId,
          org_id: orgId,
          metadata: {
            total: users.length,
            enrolled: enrolledCount,
            invited: invitedCount,
            failed: failedCount,
            already_enrolled: alreadyEnrolledCount,
            cohort_id: cohortId || null,
          },
        }),
      }, "audit-log");

      res.status(200).json({
        results,
        summary: {
          enrolled: enrolledCount,
          invited: invitedCount,
          failed: failedCount,
          alreadyEnrolled: alreadyEnrolledCount,
        },
      });
    } catch (err) {
      console.error("admin-bulk-enroll error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ADMIN: SEND REMINDER EMAILS (Inactive Users)
// Sends personalised "we miss you" emails to inactive users
// via Resend, with audit logging.
// ═══════════════════════════════════════════════════════════════

export const adminsendreminderemails = onRequest(
  { secrets: [resendApiKey, supabaseUrl, supabaseServiceKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sbUrl = supabaseUrl.value();
    const sbKey = supabaseServiceKey.value();

    try {
      // Verify caller is admin
      const token = authHeader.split(" ")[1];
      const userRes = await fetchWithRetry(`${sbUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: sbKey },
      }, "verify-user");
      if (!userRes.ok) { res.status(401).json({ error: "Invalid session" }); return; }
      const caller = await userRes.json();

      // Check platform_role
      const profileRes = await fetchWithRetry(`${sbUrl}/rest/v1/profiles?id=eq.${caller.id}&select=platform_role`, {
        headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey },
      }, "check-profile");
      const profiles = await profileRes.json();
      const role = profiles?.[0]?.platform_role;
      if (role !== "oxygy_admin" && role !== "super_admin") {
        res.status(403).json({ error: "Forbidden — admin access required" });
        return;
      }

      const { users } = req.body;

      // Validate inputs
      if (!Array.isArray(users) || users.length === 0) {
        res.status(400).json({ error: "users array is required and must not be empty" });
        return;
      }
      if (users.length > 100) {
        res.status(400).json({ error: "Maximum 100 users per request" });
        return;
      }

      const resendKey = resendApiKey.value();
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      let sentCount = 0;
      let failedCount = 0;

      for (const user of users) {
        const { email, name, daysInactive, orgName } = user;
        if (!email) {
          results.push({ email: email || "(empty)", success: false, error: "Missing email" });
          failedCount++;
          continue;
        }

        const firstName = (name || email.split("@")[0]).split(" ")[0];
        const daysLabel = daysInactive ? `${daysInactive} days` : "a while";

        try {
          const emailRes = await fetchWithRetry("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Oxygy AI Upskilling <noreply@oxygyconsulting.com>",
              to: [email],
              subject: `We miss you on Oxygy, ${firstName}!`,
              html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;background:#F7FAFC;">
  <div style="max-width:520px;margin:32px auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <!-- Header -->
    <div style="background:#1A202C;padding:28px 32px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.3px;">Oxygy AI Upskilling</div>
      <div style="font-size:13px;color:#A0AEC0;margin-top:4px;">We Miss You!</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <div style="font-size:16px;color:#1A202C;font-weight:600;margin-bottom:8px;">
        Hey ${firstName} 👋
      </div>
      <div style="font-size:14px;color:#4A5568;line-height:1.7;margin-bottom:20px;">
        We noticed you haven't logged in for <strong>${daysLabel}</strong>. Your${orgName ? ` <strong>${orgName}</strong>` : ""} cohort has been making great progress — and we'd love to see you back on track!
      </div>
      <div style="font-size:14px;color:#4A5568;line-height:1.7;margin-bottom:24px;">
        AI skills are evolving fast, and even a few minutes a day can make a real difference. Pick up right where you left off — your progress is saved and waiting for you.
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="https://oxygy-ai-upskilling-site.web.app/app/dashboard"
           style="display:inline-block;background:#38B2AC;color:#FFFFFF;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
          Jump Back In →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#F7FAFC;border-top:1px solid #E2E8F0;text-align:center;">
      <div style="font-size:11px;color:#A0AEC0;line-height:1.6;">
        You're receiving this because you're enrolled in the Oxygy AI Upskilling programme.<br/>
        If you believe this was sent in error, please contact your facilitator.
      </div>
    </div>
  </div>
</body>
</html>`,
            }),
          }, "send-reminder-email");

          if (emailRes.ok) {
            results.push({ email, success: true });
            sentCount++;
          } else {
            const errText = await emailRes.text();
            console.error(`[reminder-email] Resend error for ${email}:`, errText);
            results.push({ email, success: false, error: `Resend API error: ${emailRes.status}` });
            failedCount++;
          }
        } catch (sendErr) {
          console.error(`[reminder-email] Error sending to ${email}:`, sendErr);
          results.push({ email, success: false, error: String(sendErr) });
          failedCount++;
        }
      }

      // Write ONE audit log entry with summary
      await fetchWithRetry(`${sbUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sbKey}`,
          apikey: sbKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          actor_id: caller.id,
          action: "user.reminder_email",
          target_type: "users",
          metadata: {
            total: users.length,
            sent: sentCount,
            failed: failedCount,
            emails: users.map((u: { email: string }) => u.email),
          },
        }),
      }, "audit-log");

      res.status(200).json({ results, sent: sentCount, failed: failedCount });
    } catch (err) {
      console.error("admin-send-reminder-emails error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// REVIEW PROJECT (PRD 18)
// ═══════════════════════════════════════════════════════════════

const REVIEW_PROJECT_SYSTEM_BASE = `You are the OXYGY AI Project Reviewer — a supportive, experienced mentor who evaluates project submissions from professionals completing an AI upskilling programme.

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
}`;

const LEVEL_PROMPT_ADDITIONS: Record<number, string> = {
  1: `\n\nLEVEL 1 — ADDITIONAL CONTEXT:
This is a foundational level. The learner was asked to apply AI prompting to their daily work. They did NOT build a discrete tool — they used AI in the context of their existing job.

Be LENIENT on evidence quality — L1 learners may not have screenshots, and that's acceptable. Focus your evaluation on the quality of their reflection and whether they demonstrate genuine engagement with prompting techniques.

Screenshots are optional for L1. If provided, check that they show AI tool usage (a conversation with an AI tool, prompt inputs and outputs). If not provided, do not mark evidence_quality as needs_attention — evaluate based on written description alone.

The bar for "strong" at L1: The learner describes a specific situation, explains what they prompted, what they got back, and how it changed their approach. They show awareness of prompt structure (role, context, task).`,

  2: `\n\nLEVEL 2 — ADDITIONAL CONTEXT:
The learner was asked to build a custom AI agent or GPT. They should have a discrete, named tool that others can use.

Screenshots are REQUIRED. At minimum, look for evidence of the agent's configuration or instructions AND evidence of it working (a sample conversation or output). A screenshot of just the builder interface without a working example is "developing" for evidence quality, not "strong".

The bar for "strong" at L2: The learner built a working agent, can explain the design decisions behind their instructions, and shows evidence of iteration. Bonus: evidence that others are actually using it.`,

  3: `\n\nLEVEL 3 — ADDITIONAL CONTEXT:
The learner was asked to design an automated workflow connecting multiple AI steps. This is a systems-level project.

Screenshots are REQUIRED. Look for a workflow canvas showing connected nodes, not just a single step. The complexity should be proportional to the described workflow — a two-node chain for a complex process described in detail is a mismatch.

The bar for "strong" at L3: The workflow has clear input → processing → output logic with multiple steps. The learner describes where human-in-the-loop checkpoints are and why. They can articulate the end-to-end flow and its business impact.`,

  4: `\n\nLEVEL 4 — ADDITIONAL CONTEXT:
The learner was asked to build a dashboard or front-end interface. This is a design project.

A link to the live dashboard is REQUIRED. Screenshots should show the actual dashboard with data, not just wireframes or design mockups. At least 2 screenshots are expected.

The bar for "strong" at L4: The dashboard is live and accessible. It has a clear intended audience. The layout shows intentional design decisions (not just a default template). The reflection describes the design rationale — who sees what, why the data is presented this way, what decisions the dashboard enables.`,

  5: `\n\nLEVEL 5 — ADDITIONAL CONTEXT:
This is the capstone level. The learner was asked to build a full application AND write a structured case study (Problem, Solution, Outcome, Learnings).

A link to the deployed app is REQUIRED. Multiple screenshots (2+) are expected showing different views. The case study sections should each be substantive (100+ words).

The bar for "strong" at L5: The app is deployed and functional. The case study reads like a professional portfolio piece — specific about the problem, detailed about the solution, honest about outcomes and learnings. The learner demonstrates integration of skills from all previous levels.

For the case study dimensions, evaluate:
- Brief alignment: Does the app match the project brief?
- Evidence quality: Is the app deployed? Do screenshots show a real, functional product?
- Reflection depth: Are the case study sections (especially Problem and Solution) specific and detailed?
- Impact: Does the Outcome section include measurable results or specific user feedback?`,
};

function buildReviewSystemPrompt(level: number): string {
  return REVIEW_PROJECT_SYSTEM_BASE + (LEVEL_PROMPT_ADDITIONS[level] || "");
}

function buildReviewUserMessage(
  level: number,
  brief: { projectTitle: string; projectDescription: string; deliverable: string; challengeConnection: string },
  submission: {
    toolName: string | null; platformUsed: string | null; toolLink: string | null;
    reflectionText: string; adoptionScope: string | null; outcomeText: string;
    caseStudyProblem: string | null; caseStudySolution: string | null;
    caseStudyOutcome: string | null; caseStudyLearnings: string | null;
  },
  profile: { role: string; function: string; seniority: string; aiExperience: string },
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
    parts.push("\n--- What They Built ---");
    parts.push(`Tool/Agent Name: ${submission.toolName}`);
    if (submission.platformUsed) parts.push(`Platform: ${submission.platformUsed}`);
    if (submission.toolLink) parts.push(`Link: ${submission.toolLink}`);
  }

  parts.push("\n--- Reflection ---");
  parts.push(submission.reflectionText || "(No reflection provided)");

  parts.push("\n--- Impact ---");
  if (submission.adoptionScope) parts.push(`Adoption: ${submission.adoptionScope}`);
  parts.push(submission.outcomeText || "(No outcome provided)");

  if (level === 5) {
    parts.push("\n--- Case Study: Problem ---");
    parts.push(submission.caseStudyProblem || "(Not provided)");
    parts.push("\n--- Case Study: Solution ---");
    parts.push(submission.caseStudySolution || "(Not provided)");
    parts.push("\n--- Case Study: Outcome ---");
    parts.push(submission.caseStudyOutcome || "(Not provided)");
    parts.push("\n--- Case Study: Learnings ---");
    parts.push(submission.caseStudyLearnings || "(Not provided)");
  }

  parts.push("\n=== SCREENSHOTS: Screenshots attached below ===");
  parts.push("Evaluate the attached screenshots for relevance and evidence of a working deliverable.");

  return parts.join("\n");
}

export const reviewproject = onRequest(
  { secrets: [openRouterApiKey], timeoutSeconds: 60 },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    const apiKey = openRouterApiKey.value();
    if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

    try {
      const { level, projectBrief, submission, screenshots, learnerProfile } = req.body;

      if (!level || !projectBrief || !submission) {
        res.status(400).json({ error: "Missing required fields" }); return;
      }

      const systemPrompt = buildReviewSystemPrompt(level);
      const userMessageText = buildReviewUserMessage(level, projectBrief, submission, learnerProfile || {});

      const imageBlocks = (screenshots || []).slice(0, 5).map((dataUri: string) => ({
        type: "image_url",
        image_url: { url: dataUri },
      }));

      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userMessageText },
            ...imageBlocks,
          ],
        },
      ];

      const response = await fetchWithRetry(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.4,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          }),
        },
        "review-project",
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

// ═══════════════════════════════════════════════════════════════
// GENERATE LEARNING PATHWAY (Learning Coach — PRD-16)
// ═══════════════════════════════════════════════════════════════

const LEARNING_COACH_SYSTEM = `You are the Learning Coach for OXYGY's AI Centre of Excellence. You generate personalised, sequenced learning pathways that help professionals learn specific AI skills using the AI tools they have access to.

You are NOT a generic chatbot. You are a learning designer. Your output is a choreographed learning sequence — a mini curriculum that moves the learner across tools in a deliberate order. Each step builds on the previous one.

## YOUR OUTPUT RULES
- Generate 3-6 steps total (never more than 6)
- Each step must use a specific FEATURE of a specific PLATFORM from the learner's selected platforms
- Prompts must incorporate the learner's specific gap description — never generic "teach me about X" prompts
- Activity descriptions must explain WHY this step matters in the sequence, not just WHAT to do
- Instructions must be platform-specific and feature-specific: exact button names, exact menu locations
- Time estimates must be realistic: 10-20 minutes per step
- The gap reflection must demonstrate you understood the learner's specific situation
- The approach summary must explain the pedagogical reasoning behind the sequence
- Generate 3-5 refinement questions that are specific to the learner's gap (not generic)
- If the learner selected YouTube, recommend TYPES of content and channel archetypes, not specific video URLs
- Be tool-agnostic in your teaching language (don't favour one platform over another)
- Never reference "OXYGY" or the "Learning Coach" in the pathway content — the learner will use this outside the platform

## PLATFORM FEATURE REGISTRY

## PLATFORM: NotebookLM (id: notebooklm)
### Feature: Audio Overview
- What it does: Generates a conversational podcast-style discussion about uploaded sources. 10–20 min. Customisable focus via instructions.
- Learning preferences served: listen
- Unique value: No other platform turns your own materials into a bespoke podcast.
### Feature: Source Guide
- What it does: Creates a structured study guide/handout from uploaded sources with key concepts, definitions, and relationships.
- Learning preferences served: read
### Feature: Briefing Doc
- What it does: Generates a concise executive summary of key points across uploaded sources.
- Learning preferences served: read
### Feature: Chat
- What it does: Interactive Q&A grounded in uploaded sources with inline citations.
- Learning preferences served: talk, build
### Feature: FAQ Generation
- What it does: Auto-generates frequently asked questions with answers from uploaded sources.
- Learning preferences served: read, build

## PLATFORM: Claude (id: claude)
### Feature: Projects
- What it does: Persistent workspace with project instructions and uploaded reference documents. Context persists across conversations.
- Learning preferences served: talk, build
### Feature: Visualiser
- What it does: Generates inline diagrams, flowcharts, concept maps, decision trees, and visual explanations.
- Learning preferences served: watch, read
### Feature: Artifacts
- What it does: Creates standalone documents, interactive tools, code, comparison tables, quizzes in a dedicated panel.
- Learning preferences served: build, read
### Feature: Deep Research
- What it does: Comprehensive web research with synthesis and citations. Takes several minutes, produces thorough output.
- Learning preferences served: read
### Feature: Conversation
- What it does: Back-and-forth tutoring mode. Paste a structured prompt and begin learning through dialogue.
- Learning preferences served: talk

## PLATFORM: ChatGPT (id: chatgpt)
### Feature: Custom GPTs
- What it does: Build a persistent AI agent with custom instructions and knowledge files.
- Learning preferences served: build, talk
### Feature: Canvas
- What it does: Side-by-side collaborative workspace for co-editing documents or code with ChatGPT.
- Learning preferences served: build
### Feature: Image Generation (DALL·E)
- What it does: Generates images from text — visual concept explanations, metaphorical illustrations, visual mnemonics.
- Learning preferences served: watch
### Feature: Browsing
- What it does: Real-time web search integrated into conversation.
- Learning preferences served: read
### Feature: Conversation
- What it does: Standard chat interface for tutoring.
- Learning preferences served: talk

## PLATFORM: Perplexity (id: perplexity)
### Feature: Search & Cited Answers
- What it does: Answers questions with inline citations linking to specific sources.
- Learning preferences served: read
### Feature: Focus Modes
- What it does: Narrow search scope: Academic, Writing, Web, YouTube, Reddit.
- Learning preferences served: read, listen, watch
### Feature: Spaces
- What it does: Persistent research collection with saved searches and organised sources.
- Learning preferences served: read, build
### Feature: Pages
- What it does: AI-generated shareable write-ups on a topic with sections, visuals, and citations.
- Learning preferences served: read

## PLATFORM: Gemini / Google AI Studio (id: gemini)
### Feature: Gemini Chat
- What it does: Conversational AI with very large context window. Works inside Google Docs/Sheets/Slides.
- Learning preferences served: talk, read
### Feature: Gems (Custom Agents)
- What it does: Create persistent agents with custom instructions.
- Learning preferences served: build, talk
### Feature: Google Workspace Integration
- What it does: Gemini works directly inside Docs, Sheets, Slides.
- Learning preferences served: read, build
### Feature: Google AI Studio (Advanced)
- What it does: Developer-oriented interface for testing prompts, comparing outputs. Level 2+ only.
- Learning preferences served: build

## PLATFORM: YouTube (id: youtube)
### Feature: Conceptual Explainers
- What it does: Channels that break down complex concepts from first principles with strong visual production.
- Learning preferences served: listen, watch
### Feature: Practical Tutorials
- What it does: Step-by-step screen-share walkthroughs.
- Learning preferences served: watch
### Feature: Industry Commentary
- What it does: Channels covering AI news, trends, product launches.
- Learning preferences served: listen
### Feature: Short-Form Primers
- What it does: Videos under 10 minutes with dense, focused introductions.
- Learning preferences served: listen, watch

## LEARNING DESIGN RULES
1. Start with the learner's PRIMARY preference to build immediate engagement
2. Sequence from passive to active: absorption → understanding → testing → application
3. Alternate between platforms to prevent fatigue and leverage each tool's unique strengths
4. Always end with an APPLICATION step that connects back to the learner's real work
5. Include 3-6 steps total
6. Each step should build on the previous one
7. Time estimates should be realistic — 10-20 minutes per step, 45-90 minutes total
8. When the learner selects multiple preferences, blend them in the sequence
9. Generate prompts that incorporate the learner's specific gap, level context, and objective — never generic
10. YouTube steps should recommend specific TYPES of content, not specific video URLs

## OUTPUT FORMAT
Respond ONLY with valid JSON, no backticks or markdown:
{
  "gapReflection": "string",
  "approachSummary": "string",
  "steps": [
    {
      "stepNumber": 1,
      "platform": "platform_id",
      "platformName": "Display Name",
      "feature": "Feature Name",
      "timeEstimate": "~15 min",
      "activity": "string",
      "prompt": "string or null",
      "instructions": ["string", "string"]
    }
  ],
  "goDeeper": [
    { "platform": "platform_id", "title": "string", "description": "string", "url": "string or null" }
  ],
  "refinementQuestions": ["string", "string", "string"]
}`;

// ═══════════════════════════════════════════════════════════════
// LEARNING COACH CHAT (v2 — conversational interface)
// ═══════════════════════════════════════════════════════════════

const LEARNING_COACH_CHAT_SYSTEM_BASE = `You are the Learning Coach for OXYGY's AI Centre of Excellence. You help professionals learn AI skills through personalised, conversational guidance.

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
   After delivery, offer buttons: [This is great, thanks] [Can you adjust something?] [New topic]

5. OPEN FOLLOW-UP: Answer follow-up questions, adjust recommendations, or start a new topic.

## BUTTON RULES
- Include buttons in your response when the learner faces a decision point
- Always include 2-3 buttons max
- Buttons should represent genuinely different paths, not just variations of "yes"
- The learner can always type freely instead of clicking a button
- Never include buttons during Phase 1 (topic discovery)
- Always include buttons after Phase 2 and Phase 3

## CONTENT RULES
- When generating prompts, incorporate the learner's specific gap and situation — NEVER generic
- When giving platform instructions, use exact feature names and menu locations
- Reference Oxygy course content when the topic maps to a specific module
- Only recommend platforms from the learner's available set
- Time estimates: 10-20 minutes per activity
- Be tool-agnostic — don't favour one platform over another

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
For simple conversational messages, the content array will have just one text block and no buttons.`;

export const learningcoachchat = onRequest(
  { secrets: [openRouterApiKey] },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const { apiKey, model } = getEnv();
    if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

    try {
      const { messages, learnerProfile, userProfile } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Missing messages array" }); return;
      }

      // Build dynamic system prompt with learner context
      let systemPrompt = LEARNING_COACH_CHAT_SYSTEM_BASE;

      if (learnerProfile) {
        systemPrompt += `\n\n## LEARNER PROFILE
- Learning preferences: ${(learnerProfile.preferences || []).join(", ")}
- Available platforms: ${(learnerProfile.platforms || []).join(", ")}
${learnerProfile.additionalContext ? `- Additional context: "${learnerProfile.additionalContext}"` : ""}`;
      }

      if (userProfile) {
        systemPrompt += `\n\n## PROFESSIONAL PROFILE
- Name: ${userProfile.fullName || "Learner"}
- Role: ${userProfile.role || "Not specified"}
- Function: ${userProfile.function || "Not specified"}
- Seniority: ${userProfile.seniority || "Not specified"}
- AI Experience: ${userProfile.aiExperience || "Not specified"}
- Ambition: ${userProfile.ambition || "Not specified"}
- Challenge: "${userProfile.challenge || "Not specified"}"
- Goal: "${userProfile.goalDescription || "Not specified"}"
- Current Level: ${userProfile.currentLevel || 1}`;

        if (userProfile.learningPlan) {
          const lp = userProfile.learningPlan;
          const levelEntries = Object.entries(lp.levels || {})
            .map(([lvl, info]: [string, any]) =>
              `- Level ${lvl} (${info.depth}): Project — "${info.projectTitle}"\n  Deliverable: ${info.deliverable}\n  Challenge connection: ${info.challengeConnection}`
            ).join("\n");
          systemPrompt += `\n\n## PERSONALISED LEARNING PLAN
- Pathway summary: "${lp.pathwaySummary}"
${levelEntries}`;
        }
      }

      // Include platform feature registry (abbreviated for token efficiency)
      systemPrompt += `\n\n` + LEARNING_COACH_SYSTEM.split("## PLATFORM FEATURE REGISTRY")[1]?.split("## OUTPUT FORMAT")[0] || "";

      // Trim messages if > 20 to manage context
      let trimmedMessages = messages;
      if (messages.length > 20) {
        trimmedMessages = [
          ...messages.slice(0, 2),
          ...messages.slice(-16),
        ];
      }

      // Build OpenRouter messages array
      const openRouterMessages = [
        { role: "system" as const, content: systemPrompt },
        ...trimmedMessages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await fetchWithRetry(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://app.oxygy.co",
          },
          body: JSON.stringify({
            model,
            messages: openRouterMessages,
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        },
        "learning-coach-chat"
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("learning-coach-chat API error:", errText);
        res.status(response.status).json({ error: "AI service error", retryable: response.status >= 500 });
        return;
      }

      const json = await response.json();
      const raw = json.choices?.[0]?.message?.content || "";
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        res.status(200).json(parsed);
      } catch {
        // If JSON parsing fails, wrap raw text as a single text block
        res.status(200).json({
          content: [{ type: "text", content: raw }],
        });
      }
    } catch (err) {
      console.error("learning-coach-chat error:", err);
      res.status(500).json({ error: "Internal server error", retryable: true });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// LEARNING PATHWAY (v1 — form-based pathway generator)
// ═══════════════════════════════════════════════════════════════

export const generatelearningpathway = onRequest(
  { secrets: [openRouterApiKey] },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const { apiKey, model } = getEnv();
    if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

    try {
      const { level, objective, gap, platforms, preferences, refinement } = req.body;

      if (!level || !objective || !platforms?.length || !preferences?.length) {
        res.status(400).json({ error: "Missing required fields" }); return;
      }

      const preferenceLabels: Record<string, string> = {
        listen: "Listen & absorb — I learn best hearing concepts explained conversationally",
        read: "Read & reflect — I prefer written depth, articles, guides, detailed walkthroughs",
        watch: "Watch & follow — Show me someone doing it and I'll follow along",
        build: "Build & experiment — Give me a sandbox and a challenge",
        talk: "Talk it through — I learn by asking questions in a back-and-forth",
      };

      let userMessage = `Generate a personalised learning pathway.

## LEARNER INPUT
- Level: ${level}
- Learning Objective: ${objective}${gap ? `\n- Gap Description: "${gap}"` : ""}
- Available Platforms: ${platforms.join(", ")}
- Learning Preferences: ${preferences.map((p: string) => preferenceLabels[p] || p).join("; ")}`;

      if (refinement) {
        userMessage += `

## REFINEMENT CONTEXT
This is a refinement of a previous pathway. The learner wants to improve it.

Previous pathway:
${refinement.previousPathway}

Answered questions:
${Object.entries(refinement.answers || {})
  .filter(([, v]) => (v as string).trim())
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join("\n\n")}
${refinement.additionalContext ? `\nAdditional context: ${refinement.additionalContext}` : ""}

Generate a significantly improved pathway that addresses the refinement context. Generate new, deeper refinement questions.`;
      }

      const result = await callOpenRouter({
        apiKey,
        model,
        systemPrompt: LEARNING_COACH_SYSTEM,
        userMessage,
        label: "generate-learning-pathway",
        temperature: 0.7,
      });

      if (!result.ok) {
        res.status(result.status).json({ error: result.message, retryable: result.retryable }); return;
      }

      res.status(200).json(result.data);
    } catch (err) {
      console.error("generate-learning-pathway error:", err);
      res.status(500).json({ error: "Internal server error", retryable: true });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// NOTEBOOKLM DEEP RESEARCH GUIDE
// ═══════════════════════════════════════════════════════════════

const NOTEBOOK_GUIDE_SYSTEM = `You are a learning guide generator for the OXYGY AI Upskilling platform. The user has selected NotebookLM as their learning tool. Your job is to generate two things:

1. A "deepResearchPrompt" — a prompt for NotebookLM's Deep Research feature. This must: frame the gap as an investigative question (e.g. "Research the practical differences between X and Y for a professional trying to understand Z"); ask Deep Research to structure the report pedagogically — foundational concepts first, then practical application, then advanced nuance; reference the user's specific topic and gap description directly; not be a generic "explain me" request.

2. A "studioConfig" object — this tells the user exactly which Studio feature to use after Deep Research, and what settings to apply. The Studio feature is chosen based on the user's selected learning approach using this exact mapping:

— "listen" → Audio Overview. Settings: format = "In-depth". tone = "Professional but conversational". Steering prompt = "Focus on [their gap topic]. Explain concepts progressively, starting with the basics before building to advanced nuance. Use concrete examples throughout."

— "watch" → Video Overview. Settings: format = "Explainer" (not Brief, not Cinematic). visualStyle = "Whiteboard" (best for conceptual/instructional content). Steering prompt = "Create an explainer focused on [their gap topic] for a professional learner who is new to this concept. Prioritise clarity over comprehensiveness. Use diagrams and quotes from the sources."

— "read" → Slide Deck. Settings: deckType = "Detailed" (not Presenter — they are reading alone, not presenting). Steering prompt = "Summarise [their gap topic] as a structured reference deck. Start with core definitions, then practical examples, then common mistakes to avoid. Target audience: professional with no prior knowledge of this topic."

— "research" → Reports - Study Guide. Settings: reportSubType = "Study Guide". No additional customisation needed — instruct the user to select "Study Guide" from within the Reports tile. The Study Guide generates a short-answer quiz and glossary of key terms grounded in the sources.

— "build" → Reports - FAQ. Settings: reportSubType = "FAQ". Instruct the user to select "FAQ" from within the Reports tile. This generates a set of questions and answers grounded in their sources — the user should then test themselves by answering each question before revealing the answer.

— "talk" → Flashcards. Settings: difficulty = "Beginner" (if Level 1) or "Intermediate" (if Level 2+). cardCount = 10. Steering prompt = their specific gap description. After generating, instruct the user to use the Chat panel alongside the flashcards to ask follow-up questions on any card they get wrong.

If the user has multiple learning preferences, use the FIRST one in the list to determine the studio feature.

Return ONLY a JSON object with this shape:
{
  "deepResearchPrompt": "...",
  "studioConfig": {
    "feature": "Audio Overview | Video Overview | Slide Deck | Reports - Study Guide | Reports - FAQ | Flashcards",
    "settings": {
      "format": "...",
      "visualStyle": "...",
      "deckType": "...",
      "reportSubType": "...",
      "tone": "...",
      "difficulty": "...",
      "cardCount": 10
    },
    "steeringPrompt": "...",
    "featureInstructions": "1. ...\\n2. ...\\n3. ..."
  }
}

Only include the settings fields that are relevant to the chosen feature. Omit the rest.

The "featureInstructions" must be 3–5 numbered steps referencing exact UI element names (e.g. "the pencil/customise icon next to the tile", "the Steering Prompt field", "the Reports tile → select Study Guide from the dropdown"). Separate steps with newlines.`;

export const generatenotebookguide = onRequest(
  { secrets: [openRouterApiKey] },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const { apiKey, model } = getEnv();
    if (!apiKey) { res.status(503).json({ error: "API key not configured" }); return; }

    try {
      const { level, objective, gap, preferences } = req.body;

      if (!level || !objective || !preferences?.length) {
        res.status(400).json({ error: "Missing required fields" }); return;
      }

      const preferenceLabels: Record<string, string> = {
        listen: "Listen & absorb",
        read: "Read & reflect",
        watch: "Watch & follow",
        build: "Build & experiment",
        talk: "Talk it through",
      };

      const userMessage = `Generate a NotebookLM Deep Research prompt and Studio configuration for this learner.

## LEARNER INPUT
- Level: ${level}
- Learning Topic: ${objective}${gap ? `\n- Specific gap: "${gap}"` : ""}
- Learning Preferences (in priority order): ${preferences.map((p: string) => preferenceLabels[p] || p).join("; ")}`;

      const result = await callOpenRouter({
        apiKey,
        model,
        systemPrompt: NOTEBOOK_GUIDE_SYSTEM,
        userMessage,
        label: "generate-notebook-guide",
        temperature: 0.7,
        jsonMode: true,
      });

      if (!result.ok) {
        res.status(result.status).json({ error: result.message, retryable: result.retryable }); return;
      }

      res.status(200).json(result.data);
    } catch (err) {
      console.error("generate-notebook-guide error:", err);
      res.status(500).json({ error: "Internal server error", retryable: true });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// CURATED VIDEOS — Serve human-approved YouTube recommendations
// ═══════════════════════════════════════════════════════════════

export const curatedvideos = onRequest(
  { secrets: [supabaseUrl, supabaseServiceKey], cors: true },
  async (req, res) => {
    if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

    const sbUrl = supabaseUrl.value();
    const sbKey = supabaseServiceKey.value();

    try {
      const topicId = req.query.topicId as string | undefined;
      const level = req.query.level as string | undefined;
      const includeBackup = req.query.includeBackup === "true";

      if (!topicId && !level) {
        res.status(400).json({ error: "Provide topicId or level query parameter" }); return;
      }

      // Build Supabase REST query
      let endpoint = `${sbUrl}/rest/v1/curated_videos?select=*`;

      if (topicId) {
        endpoint += `&topic_id=eq.${encodeURIComponent(topicId)}`;
        if (!includeBackup) {
          endpoint += "&is_primary=eq.true";
        }
      } else if (level) {
        endpoint += `&level=eq.${encodeURIComponent(level)}`;
        endpoint += "&is_primary=eq.true";
      }

      // Order: primary first by rank, then backup by relevance_score desc
      endpoint += "&order=is_primary.desc,rank.asc.nullslast,relevance_score.desc";

      const response = await fetchWithRetry(endpoint, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }, "curated-videos");

      if (!response.ok) {
        const text = await response.text();
        console.error("curated-videos Supabase error:", text);
        res.status(502).json({ error: "Failed to fetch curated videos" }); return;
      }

      const videos = await response.json();
      res.status(200).json({ videos });
    } catch (err) {
      console.error("curated-videos error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

