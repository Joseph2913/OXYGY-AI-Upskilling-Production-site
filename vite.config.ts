import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// ─── Shared retry helper for Gemini API calls ───

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1500;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  label: string,
): Promise<Response> {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      // If this is a retryable status code and we have retries left, wait and retry
      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get('retry-after');
        const delayMs = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 10000)
          : BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${label}] Gemini API returned ${response.status}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        lastResponse = response;
        continue;
      }

      // Non-retryable error or no retries left
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${label}] Network error: ${lastError.message}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  // All retries exhausted
  if (lastResponse) return lastResponse;
  throw lastError || new Error('All retries exhausted');
}

const GEMINI_SYSTEM_PROMPT = `You are the OXYGY Prompt Engineering Coach — an expert in transforming raw, unstructured prompts into well-engineered, structured prompts that produce dramatically better AI outputs.

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

function geminiProxyPlugin(apiKey: string, model: string): Plugin {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/enhance-prompt', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { mode, prompt, wizardAnswers } = JSON.parse(body);

            let userMessage: string;
            if (mode === 'enhance') {
              userMessage = prompt;
            } else {
              // Build mode — assemble wizard answers into a structured message
              const wa = wizardAnswers;
              const formatText = [
                ...(wa.formatChips || []),
                wa.formatCustom || '',
              ].filter(Boolean).join(', ') || 'Not specified';
              const qualityText = [
                ...(wa.qualityChips || []),
                wa.qualityCustom || '',
              ].filter(Boolean).join(', ') || 'Not specified';

              userMessage = `The user wants to build a prompt with the following inputs:\n\nRole: ${wa.role || 'Not specified'}\nContext: ${wa.context || 'Not specified'}\nTask: ${wa.task || 'Not specified'}\nFormat preferences: ${formatText}\nSteps: ${wa.steps || 'Not specified'}\nQuality constraints: ${qualityText}\n\nPlease enhance and expand each section into a polished, comprehensive prompt following The Prompt Blueprint framework.`;
            }

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: GEMINI_SYSTEM_PROMPT },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'enhance-prompt');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error:', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            // Parse the JSON response — handle potential markdown fences
            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response:', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function agentDesignProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the OXYGY Agent Design Advisor — an expert in helping people design effective, reusable, and accountable AI agents for professional use.

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

  return {
    name: 'agent-design-proxy',
    configureServer(server) {
      server.middlewares.use('/api/design-agent', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { task_description, input_data_description } = JSON.parse(body);

            const userMessage = `Task Description: ${task_description}\n\nInput Data Description: ${input_data_description || 'Not specified'}`;

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'agent-design');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (agent design):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (agent design):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (agent design):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function agentSetupGuideProxyPlugin(apiKey: string, model: string): Plugin {
  // ── Hybrid v2: Short templates with {SLOT} placeholders + AI slot-filling ──
  type SetupStep = { title: string; instruction: string };
  type PlatformTemplate = {
    steps: SetupStep[];
    slots: Record<string, string>;
    fallbackTips: string[];
    fallbackLimitations: string;
  };

  const PLATFORM_TEMPLATES: Record<string, PlatformTemplate> = {
    "ChatGPT Custom GPTs": {
      slots: { AGENT_NAME: "your agent", TASK: "your agent's task", KNOWLEDGE_FILES: "relevant documents, templates, and reference data", CAPABILITIES: "Code Interpreter for data processing, Web Search for research", CONVERSATION_STARTERS: "example prompts that show your agent's core use cases" },
      steps: [
        { title: "Open the GPT Builder", instruction: "Go to chat.openai.com → Explore GPTs → + Create. Switch to the \"Configure\" tab." },
        { title: "Paste your system prompt", instruction: "Paste the full system prompt into the \"Instructions\" field. Name your GPT \"{AGENT_NAME}\" and add a short description." },
        { title: "Upload Knowledge files", instruction: "In the \"Knowledge\" section, upload {KNOWLEDGE_FILES}. The GPT will search these files when generating responses." },
        { title: "Configure Capabilities", instruction: "Toggle on the capabilities your agent needs: {CAPABILITIES}. Only enable what's relevant to keep responses focused." },
        { title: "Set up Actions (optional)", instruction: "If your agent needs external data, click \"Create new action\" and define an OpenAPI schema for the API endpoints it should access." },
        { title: "Add Conversation Starters", instruction: "Add 3–4 starters like: {CONVERSATION_STARTERS}. These teach users how to interact with your agent effectively." },
        { title: "Test and publish", instruction: "Test in the Preview pane with realistic inputs. When ready, click \"Create\" and choose your sharing level (Private, Team, or Public)." }
      ],
      fallbackTips: [ "Upload example outputs as Knowledge files — concrete examples teach the GPT your expected format better than instructions alone.", "Duplicate your GPT before making changes (three-dot menu → Copy) to create a safe rollback point.", "Use the Analytics tab (Team/Enterprise plans) to see which conversation starters get used most and where users drop off." ],
      fallbackLimitations: "Requires ChatGPT Plus, Team, or Enterprise. Knowledge limited to 20 files (512 MB each)."
    },
    "Claude Skills": {
      slots: { AGENT_NAME: "your agent", TASK: "your agent's task", EXAMPLE_INPUT: "the relevant input data", EXAMPLE_OUTPUT: "structured output in your expected format", CHAIN_SUGGESTION: "a formatting skill (e.g., report generator or slide deck builder)", SKILL_DESCRIPTION: "a short description of what this skill does" },
      steps: [
        { title: "Prepare your design answers", instruction: "Before building, decide: What input will users provide ({EXAMPLE_INPUT})? What should the output look like ({EXAMPLE_OUTPUT})? Should this skill chain into another (e.g., {CHAIN_SUGGESTION})?" },
        { title: "Use the built-in skill-creator", instruction: "Start a new Claude chat and say: \"Help me build a skill that {TASK}\". Claude's skill-creator will guide you through design questions and generate the skill automatically." },
        { title: "Install with one click", instruction: "When the skill is ready, click the \"Copy to your skills\" button at the bottom of the chat. It's instantly added to Customize > Skills. Toggle it on or off any time." },
        { title: "Test in a new conversation", instruction: "Open a fresh chat and describe a task naturally — don't mention the skill by name. If the skill activates, you'll see \"Using {AGENT_NAME}\" appear. If not, edit the description at Customize > Skills." },
        { title: "Chain with other skills", instruction: "Build a complementary skill (e.g., {CHAIN_SUGGESTION}) using the skill-creator. Toggle both on, and Claude will chain them automatically when the task fits." }
      ],
      fallbackTips: [ "The skill description (max 200 chars) determines when Claude activates it — write it as \"activate when the user asks about [specific task]\". Vague descriptions mean the skill never fires.", "Skills work across ALL conversations, not just one Project — once installed, it's always available.", "Pair this skill with a formatting skill (slides, reports, docs) so structured output feeds directly into professional deliverables.", "Connect to document repositories via MCP connectors so the skill can access live organisational data." ],
      fallbackLimitations: "Requires Claude Pro or Team. Skill description limited to 200 characters. Skills can't call each other by name — chaining relies on Claude matching descriptions to the task."
    },
    "Microsoft Copilot": {
      slots: { AGENT_NAME: "your agent", TASK: "your agent's task", KNOWLEDGE_SOURCES: "relevant SharePoint sites, documents, or data sources", ACTIONS: "automations like sending emails, creating tasks, or updating records", CHANNEL: "Microsoft Teams" },
      steps: [
        { title: "Create a new Agent", instruction: "Open Copilot Studio (copilotstudio.microsoft.com) → Create → New Agent. Name it \"{AGENT_NAME}\"." },
        { title: "Paste your system prompt", instruction: "Paste the full system prompt into the \"Instructions\" field. This defines your agent's behaviour and output format." },
        { title: "Connect Knowledge sources", instruction: "Add {KNOWLEDGE_SOURCES} via the Knowledge section. The agent will search these when responding to users." },
        { title: "Configure Actions", instruction: "Connect Power Automate flows for {ACTIONS}. Map your agent's output fields to flow inputs for seamless automation." },
        { title: "Set up Topics", instruction: "Create Topics for your agent's main use cases. Each Topic guides users through providing the right inputs step by step." },
        { title: "Test your agent", instruction: "Click \"Test\" in the top-right to open the test pane. Run through realistic scenarios and check that Knowledge and Actions work correctly." },
        { title: "Publish to {CHANNEL}", instruction: "Go to Channels and deploy to {CHANNEL}. Your team can start using the agent immediately." }
      ],
      fallbackTips: [ "Use Adaptive Cards for rich output — formatted cards with tables, buttons, and input fields are much more engaging than plain text.", "Connect to Microsoft Graph so your agent can access calendars, emails, files, and org data for context-aware responses.", "Use the Analytics tab to monitor which Topics get triggered most and where users abandon conversations." ],
      fallbackLimitations: "Requires Microsoft 365 with Copilot Studio access. Some Power Automate connectors need additional licensing."
    },
    "Google Gemini Gems": {
      slots: { AGENT_NAME: "your agent", TASK: "your agent's task", REFERENCE_DOCS: "relevant Google Docs, Sheets, or PDFs", WORKSPACE_INTEGRATIONS: "Drive, Docs, Sheets, or Slides" },
      steps: [
        { title: "Open the Gem Manager", instruction: "Go to gemini.google.com → Gem manager → New Gem. Requires Gemini Advanced (Google One AI Premium)." },
        { title: "Configure name and instructions", instruction: "Name your Gem \"{AGENT_NAME}\" and paste the full system prompt into the \"Instructions\" field." },
        { title: "Upload reference documents", instruction: "Attach {REFERENCE_DOCS} so the Gem can reference them when generating responses." },
        { title: "Test and calibrate", instruction: "Send representative inputs in the conversation area. If the output format or tone isn't right, refine the Instructions — changes take effect immediately." },
        { title: "Connect Workspace integrations", instruction: "Grant the Gem access to {WORKSPACE_INTEGRATIONS} so it can pull live organisational data when needed." },
        { title: "Test with realistic data", instruction: "Test with actual data, not toy examples. Verify the output matches your expected format, especially for structured output like JSON." },
        { title: "Share with your team", instruction: "Click Share and add collaborators by email. They'll see the Gem in their Gem manager immediately." }
      ],
      fallbackTips: [ "Link to live Google Sheets for real-time data access — the Gem always works with the latest information.", "Pair with Google Apps Script to automatically write structured output to Sheets, Docs, or Slides.", "Create a shared Drive folder with all reference materials — updating the folder updates the Gem's knowledge." ],
      fallbackLimitations: "Requires Google One AI Premium (Gemini Advanced). Gems can't execute code, call APIs, or trigger automations directly."
    },
    "Open Source / API": {
      slots: { AGENT_NAME: "your agent", TASK: "your agent's task", SDK_EXAMPLE: "pip install openai (Python) or npm install openai (Node.js)", OUTPUT_FORMAT: "your expected JSON schema", DATA_SOURCES: "your document store, database, or file system", DEPLOY_FRAMEWORK: "FastAPI (Python) or Express (Node.js)" },
      steps: [
        { title: "Install the SDK", instruction: "Set up API access with your chosen provider: {SDK_EXAMPLE}. Store the API key as an environment variable." },
        { title: "Configure the system message", instruction: "Pass the system prompt as the \"system\" role in the chat completions API. This loads before every user interaction." },
        { title: "Parse structured output", instruction: "Use JSON mode or function calling to enforce {OUTPUT_FORMAT}. Add a validation retry loop for malformed responses." },
        { title: "Build the input pipeline", instruction: "Create a function that prepares user input — extracting text from files, formatting data, and truncating to fit context limits." },
        { title: "Add error handling", instruction: "Handle rate limits (exponential backoff), timeouts (retry), and invalid output (re-prompt). This is critical for production reliability." },
        { title: "Connect to data sources", instruction: "Integrate with {DATA_SOURCES} so the agent can access reference materials at runtime. For large collections, consider a vector database for RAG." },
        { title: "Deploy as a service", instruction: "Wrap in an API endpoint ({DEPLOY_FRAMEWORK}) or build a simple UI (Streamlit, Gradio, Next.js). Add auth, rate limiting, and logging." }
      ],
      fallbackTips: [ "Use streaming (stream: true) for long outputs — users get immediate feedback instead of waiting.", "Count tokens before each API call to stay within context limits and truncate intelligently.", "Log every API call (input, output, latency, tokens) for debugging and quality monitoring.", "For large document collections, implement RAG with a vector database (Pinecone, Weaviate, ChromaDB)." ],
      fallbackLimitations: "API costs scale with usage — monitor token consumption. You're responsible for data handling, security, and compliance."
    },
    "Not sure yet": {
      slots: { AGENT_NAME: "your agent", TASK: "your agent's task", REFERENCE_MATERIALS: "relevant documents, templates, and example data" },
      steps: [
        { title: "Find the instructions field", instruction: "Every AI platform has a place for \"system instructions\" or \"custom instructions\" — look for Settings, Configure, or Instructions in your platform." },
        { title: "Paste the full system prompt", instruction: "Copy the entire prompt (all sections) into the instructions field. Don't shorten it — the sections work together." },
        { title: "Upload reference materials", instruction: "Most platforms support file uploads. Add {REFERENCE_MATERIALS} to give the agent context beyond the prompt." },
        { title: "Test with realistic inputs", instruction: "Use actual data, not toy examples. Run 3–5 test cases including messy or incomplete inputs to check edge cases." },
        { title: "Iterate on output quality", instruction: "If the format is wrong, tighten the format instructions. If the tone is off, adjust the role section. Expect 2–3 rounds of iteration." },
        { title: "Share with your team", instruction: "Use your platform's sharing features to deploy the agent. Collect feedback from real users in the first week and iterate." }
      ],
      fallbackTips: [ "Start with the full prompt — only simplify if the platform has strict character limits.", "Upload 2–3 example outputs alongside the prompt — examples teach the AI more effectively than instructions alone.", "Test your hardest use case first — if that works, simpler ones will too." ],
      fallbackLimitations: ""
    }
  };

  // AI fills personalised slot values + tips — never generates steps or UI navigation
  const slotFillPrompt = `You personalise a build plan for deploying a specific AI agent on a platform.

You will receive the agent's task description and output format. Fill in personalised values for template slots AND generate tailored tips.

RULES:
- Fill EVERY slot with a value specific to THIS agent (not generic placeholders)
- Slot values should be concise — a few words to one short sentence max
- Generate exactly 3-4 tips specific to THIS agent on this platform
- Do NOT describe UI navigation or setup steps
- Do NOT mention specific model names
- Note limitations specific to THIS agent (or empty string if none)

RESPONSE FORMAT (JSON only, no markdown):
{
  "slots": { "AGENT_NAME": "short name", "TASK": "what it does", ...other slots... },
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "limitations": "Limitations or empty string"
}

Do NOT add preamble or explanation outside the JSON object.`;

  return {
    name: 'agent-setup-guide-proxy',
    configureServer(server) {
      server.middlewares.use('/api/agent-setup-guide', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { platform, output_format, task_description } = JSON.parse(body);

            // 1. Look up hardcoded template
            const template = PLATFORM_TEMPLATES[platform];
            if (!template) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Unknown platform: ${platform}` }));
              return;
            }

            // 2. Ask AI to fill slots + generate tips
            let slotValues: Record<string, string> = { ...template.slots, TASK: task_description || template.slots.TASK };
            let tips = template.fallbackTips;
            let limitations = template.fallbackLimitations;

            try {
              const slotNames = Object.keys(template.slots).join(", ");
              const userMessage = `Platform: ${platform}\n\nAgent Task: ${task_description}\n\nOutput Format: ${JSON.stringify(output_format, null, 2)}\n\nSlots to fill: ${slotNames}\n\nFill each slot with a value personalised to this specific agent, and generate tips.`;
              const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
              const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: openRouterModel,
                  messages: [
                    { role: 'system', content: slotFillPrompt },
                    { role: 'user', content: userMessage },
                  ],
                  temperature: 0.7,
                  response_format: { type: 'json_object' },
                }),
              }, 'agent-setup-slots');

              if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                const text = data?.choices?.[0]?.message?.content || '';
                const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const parsed = JSON.parse(cleaned);
                if (parsed.slots && typeof parsed.slots === 'object') {
                  slotValues = { ...slotValues, ...parsed.slots };
                }
                if (Array.isArray(parsed.tips) && parsed.tips.length > 0) tips = parsed.tips;
                if (typeof parsed.limitations === 'string') limitations = parsed.limitations;
              }
            } catch (aiErr) {
              console.warn('Slot personalization failed, using defaults:', aiErr);
            }

            // 3. Inject slot values into step templates
            const steps = template.steps.map(s => ({
              title: s.title.replace(/\{(\w+)\}/g, (_: string, k: string) => slotValues[k] || k),
              instruction: s.instruction.replace(/\{(\w+)\}/g, (_: string, k: string) => slotValues[k] || k),
            }));

            // 4. Return merged response
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ steps, tips, limitations }));
          } catch (err) {
            console.error('Proxy error (agent-setup-guide):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function workflowDesignProxyPlugin(apiKey: string, model: string): Plugin {
  const pathAPrompt = `You are the OXYGY Workflow Architect — an expert in designing AI-powered automation workflows. You help users map their business processes into structured, multi-step workflows using a node-based system.

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
- Workflows typically have 4–10 nodes total
- Node order matters: the sequence should reflect a logical data flow
- Include a proc-human-review node whenever AI output feeds directly into client-facing, decision-critical, or externally shared deliverables
- Choose nodes that match the user's described tools and systems
- If the user mentions specific tools (e.g., "Microsoft Forms"), map to the closest node (e.g., input-form)
- Provide a brief description for each node explaining its specific role in THIS workflow (not a generic description)

RESPONSE FORMAT (JSON only, no markdown):

{
  "workflow_name": "A short descriptive name for this workflow",
  "workflow_description": "A 2-3 sentence summary of what this workflow does end-to-end",
  "nodes": [
    {
      "id": "node-1",
      "node_id": "input-form",
      "name": "Survey Submission",
      "custom_description": "Receives client engagement survey responses submitted via Microsoft Forms. Each submission triggers the workflow automatically.",
      "layer": "input"
    },
    {
      "id": "node-2",
      "node_id": "proc-ai-agent",
      "name": "Theme Analysis",
      "custom_description": "A Level 2 AI agent analyzes each survey response to identify recurring themes, categorize feedback by topic, and score sentiment.",
      "layer": "processing"
    }
  ]
}

The "nodes" array must be ordered sequentially — node-1 connects to node-2, node-2 connects to node-3, and so on. This order will be rendered directly as the workflow flow.

The "name" field is a SHORT custom label for the node in this specific workflow context (e.g., "Theme Analysis" not "AI Agent"). Max 20 characters.

The "node_id" must exactly match one of the node IDs listed above.`;

  const pathBPrompt = `You are the OXYGY Workflow Reviewer — an expert in evaluating and improving AI-powered automation workflows.

You will receive:
1. A description of the process being automated
2. Optionally, a description of existing tools and systems
3. The user's manually-built workflow as an ordered list of nodes
4. Optionally, the user's rationale for their design decisions

Your job is to review the user's workflow and suggest improvements. You may:
- ADD nodes that are missing (e.g., a human review step, a data validation step, a filter/router for different data types)
- REMOVE nodes that are redundant or unnecessary
- REORDER nodes if the sequence could be improved
- Keep nodes unchanged if they are well-placed

IMPORTANT PRINCIPLES:
- There is no single "right" way to build a workflow. Acknowledge the user's design decisions and explain trade-offs rather than prescribing one approach.
- Be specific about WHY each change is suggested — reference the user's context and data types.
- If the user provided a rationale, respond to it directly. Validate good decisions and gently explain where improvements could help.
- Always explain the risks of NOT making a suggested change.

AVAILABLE NODES:

LAYER 1 — DATA INPUT NODES:
input-excel, input-gsheets, input-webhook, input-api, input-form, input-email, input-schedule, input-database, input-file, input-crm, input-chat, input-transcript

LAYER 2 — PROCESSING NODES:
proc-ai-agent, proc-ai-loop, proc-text-extract, proc-code, proc-mapper, proc-filter, proc-merge, proc-sentiment, proc-classifier, proc-summarizer, proc-translate, proc-validator, proc-human-review

LAYER 3 — DATA OUTPUT NODES:
output-excel, output-gsheets, output-database, output-email, output-slack, output-pdf, output-word, output-pptx, output-api, output-crm, output-dashboard, output-notification, output-calendar, output-kb

RESPONSE FORMAT (JSON only, no markdown):

{
  "overall_assessment": "A 2-3 sentence summary of the workflow's strengths and areas for improvement",
  "suggested_workflow": [
    {
      "id": "node-1",
      "node_id": "input-form",
      "name": "Survey Submission",
      "custom_description": "Receives client engagement survey responses...",
      "layer": "input",
      "status": "unchanged"
    },
    {
      "id": "node-2",
      "node_id": "proc-validator",
      "name": "Data Quality Check",
      "custom_description": "Validates that all required fields are present...",
      "layer": "processing",
      "status": "added"
    }
  ],
  "changes": [
    {
      "type": "added",
      "node_id": "proc-validator",
      "node_name": "Data Quality Check",
      "rationale": "Adding a validation step before AI processing ensures that incomplete or malformed survey responses are flagged before analysis. Without this, the AI agent may produce unreliable theme analysis from partial data."
    }
  ]
}

The "status" field for each node in suggested_workflow must be one of: "unchanged", "added", or "removed" (removed nodes are still included in the array for rendering purposes, but with status "removed").

For the user's original workflow, you will receive nodes with IDs like "user-node-1", "user-node-2", etc. In your suggested_workflow, keep the same IDs for unchanged nodes and use new IDs for added nodes.`;

  return {
    name: 'workflow-design-proxy',
    configureServer(server) {
      server.middlewares.use('/api/design-workflow', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { mode, task_description, tools_and_systems, user_workflow, user_rationale } = JSON.parse(body);

            const systemPrompt = mode === 'auto_generate' ? pathAPrompt : pathBPrompt;

            let userMessage: string;
            if (mode === 'auto_generate') {
              userMessage = `Process to automate: ${task_description}\n\nExisting tools and systems: ${tools_and_systems || 'Not specified'}`;
            } else {
              const nodeList = (user_workflow || [])
                .map((n: { id: string; node_id: string; name: string; layer: string }) => `  ${n.id}: ${n.node_id} ("${n.name}") [${n.layer}]`)
                .join('\n');
              userMessage = `Process to automate: ${task_description}\n\nExisting tools and systems: ${tools_and_systems || 'Not specified'}\n\nUser's workflow:\n${nodeList}\n\nUser's design rationale: ${user_rationale || 'Not provided'}`;
            }

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'workflow-design');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (workflow design):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (workflow design):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (workflow design):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function architectureProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the OXYGY AI Build Plan Advisor — an expert in helping business professionals plan AI-powered applications using a 5-tool development pipeline.

You will receive a user's project details including their app description, target users and problem, data/feature needs, and technical comfort level. Generate a personalized build plan for their specific project.

THE OXYGY AI UPSKILLING FRAMEWORK (5 Levels):
- Level 1 (Fundamentals & Awareness): Prompt engineering basics — writing clear, structured instructions for AI
- Level 2 (Applied Capability): Designing reusable AI agents with system prompts, structured outputs, and accountability
- Level 3 (Systemic Integration): Workflow architecture — connecting multiple AI tools and agents into automated pipelines
- Level 4 (Strategic Oversight): Design thinking for AI outputs — dashboards, user experiences, and stakeholder-ready deliverables
- Level 5 (Full-Stack AI Development): Building complete AI-powered applications using the 5 tools below

THE 5-TOOL PIPELINE:

1. Google AI Studio — Rapid prototyping. Turn ideas into working first drafts. "Like your Word — where the first draft comes to life."
   - Always essential for every project
   - Connects to Level 1 (Prompt Engineering) and Level 4 (Design Thinking)

2. GitHub — Version control and collaboration. "Like your SharePoint — where code lives and teams collaborate."
   - Essential for most projects; recommended for very simple non-technical projects
   - Connects to Level 3 (Systemic Integration / Workflow Architecture)

3. Claude Code — AI-powered development tool for sophisticated features, integrations, and polish. "Like hiring a specialist contractor — called in for the complex work."
   - Essential for complex projects (user accounts + heavy data + technical users); recommended for medium complexity; optional for simple projects
   - Connects to Level 1 (Prompting), Level 2 (Agent/Instruction Design), Level 3 (Workflow Architecture)

4. Supabase — Database, authentication, and backend infrastructure. "Like your Excel — where all your data lives, organized in tables."
   - Essential if user accounts or heavy data are needed; recommended for moderate data needs; optional for simple stateless tools
   - Connects to Level 3 (Workflow Architecture) and optionally Level 4 (Design Thinking)

5. Vercel — Deployment platform that makes the app live and accessible. "Like your PowerPoint — where the final work is presented to the audience."
   - Always essential for any project that needs real users to access it
   - Connects to all levels (Level 1 through Level 4) as the culmination of the full framework

CLASSIFICATION RULES:
- "essential": The project cannot succeed without this tool
- "recommended": The project would benefit significantly, but could work without it
- "optional": Nice to have, but the project works fine without it

For each tool, generate:
- classification: "essential", "recommended", or "optional"
- forYourProject: 2-3 sentences explaining how this specific tool applies to THEIR project. Be specific — reference features, screens, or use cases they described.
- howToApproach: 2-3 sentences with concrete first steps for getting started with this tool for their project.
- tips: Array of exactly 3 specific, actionable tips tailored to their project.
- levelConnection: 2-3 sentences explaining how skills from earlier levels connect to this tool. IMPORTANT: When referencing earlier levels, always use the exact format "Level 1", "Level 2", "Level 3", or "Level 4" — the frontend will parse these into clickable links.
- connectedLevels: Array of level numbers this tool connects to (e.g., [1, 4])

IMPORTANT GUIDELINES:
- Be SPECIFIC to the user's actual project — not generic. Reference specific features, screens, user types, or data they described.
- Keep language accessible for business professionals, not developers.
- Be encouraging but honest about complexity.
- When mentioning levels, ALWAYS use "Level 1", "Level 2", "Level 3", "Level 4" format.
- For tips, give concrete actionable steps, not abstract advice.

Respond with ONLY this JSON structure — no markdown, no extra text:

{
  "google-ai-studio": {
    "classification": "essential",
    "forYourProject": "...",
    "howToApproach": "...",
    "tips": ["...", "...", "..."],
    "levelConnection": "...",
    "connectedLevels": [1, 4]
  },
  "github": {
    "classification": "essential",
    "forYourProject": "...",
    "howToApproach": "...",
    "tips": ["...", "...", "..."],
    "levelConnection": "...",
    "connectedLevels": [3]
  },
  "claude-code": {
    "classification": "essential|recommended|optional",
    "forYourProject": "...",
    "howToApproach": "...",
    "tips": ["...", "...", "..."],
    "levelConnection": "...",
    "connectedLevels": [1, 2, 3]
  },
  "supabase": {
    "classification": "essential|recommended|optional",
    "forYourProject": "...",
    "howToApproach": "...",
    "tips": ["...", "...", "..."],
    "levelConnection": "...",
    "connectedLevels": [3]
  },
  "vercel": {
    "classification": "essential",
    "forYourProject": "...",
    "howToApproach": "...",
    "tips": ["...", "...", "..."],
    "levelConnection": "...",
    "connectedLevels": [1, 2, 3, 4]
  }
}`;

  return {
    name: 'architecture-proxy',
    configureServer(server) {
      server.middlewares.use('/api/analyze-architecture', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { appDescription, problemAndUsers, dataAndContent, technicalLevel } = JSON.parse(body);

            const techLabels: Record<string, string> = {
              'non-technical': 'Non-technical (never written code, not planning to)',
              'semi-technical': 'Semi-technical (comfortable with no-code tools, can follow technical instructions)',
              'technical': 'Technical (some coding experience or willing to learn)',
            };

            const userMessage = [
              `APP DESCRIPTION:\n${appDescription || 'Not provided'}`,
              `PROBLEM & USERS:\n${problemAndUsers || 'Not provided'}`,
              `DATA & KEY FEATURES:\n${dataAndContent || 'Not provided'}`,
              `TECHNICAL COMFORT LEVEL: ${techLabels[technicalLevel || ''] || technicalLevel || 'Not specified'}`,
            ].join('\n\n');

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'architecture');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (architecture):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (architecture):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (architecture):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function pathwayProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are a learning pathway designer for OXYGY's AI Centre of Excellence. You generate personalized, project-based learning pathways for professionals who want to develop AI skills.

Your outputs must be:
- Practical and actionable — every project should be something the learner can start within a week
- Role-specific — projects should directly relate to the learner's stated function and challenge
- Empathetic — acknowledge where the learner is starting from and build confidence
- Connected — explicitly reference how each project relates to the learner's specific challenge from their questionnaire input

You generate content in strict JSON format. Never include markdown, backticks, or preamble outside the JSON object.

CRITICAL: In the "challengeConnection" field for EVERY level, you MUST directly reference and quote specific details from the user's stated challenge. This is the most important personalization element — the learner should feel that this pathway was built specifically for their situation.`;

  return {
    name: 'pathway-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-pathway', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { formData, levelDepths } = JSON.parse(body);

            const ambitionLabels: Record<string, string> = {
              'confident-daily-use': 'Confident daily AI use',
              'build-reusable-tools': 'Build reusable AI tools',
              'own-ai-processes': 'Design and own AI-powered processes',
              'build-full-apps': 'Build full AI-powered applications',
            };

            const experienceLabels: Record<string, string> = {
              'beginner': 'Beginner — rarely uses AI tools',
              'comfortable-user': 'Comfortable User — uses ChatGPT or similar regularly for basic tasks',
              'builder': 'Builder — has created custom GPTs, agents, or prompt templates',
              'integrator': 'Integrator — has designed AI-powered workflows or multi-step pipelines',
            };

            const userMessage = `Generate a personalized learning pathway for the following professional.

## LEARNER PROFILE
- Role: ${formData.role || 'Not specified'}
- Function: ${formData.function === 'Other' ? formData.functionOther : formData.function || 'Not specified'}
- Seniority: ${formData.seniority || 'Not specified'}
- AI Experience: ${experienceLabels[formData.aiExperience] || formData.aiExperience || 'Not specified'}
- Ambition: ${ambitionLabels[formData.ambition] || formData.ambition || 'Not specified'}
- Specific Challenge: "${(formData.challenge || 'Not specified').slice(0, 500)}"
- Weekly Availability: ${formData.availability || 'Not specified'}${formData.experienceDescription ? `\n- AI Experience Details: "${formData.experienceDescription.slice(0, 500)}"` : ''}${formData.goalDescription ? `\n- Specific Goal: "${formData.goalDescription.slice(0, 500)}"` : ''}

## LEVEL CLASSIFICATIONS (pre-determined, do not change)
- Level 1 (Fundamentals): ${levelDepths.L1}
- Level 2 (Applied Capability): ${levelDepths.L2}
- Level 3 (Systemic Integration): ${levelDepths.L3}
- Level 4 (Dashboards & Front-Ends): ${levelDepths.L4}
- Level 5 (Full AI Applications): ${levelDepths.L5}

## FRAMEWORK CONTEXT

### Level 1: Fundamentals of AI for Everyday Use
Topics: What is an LLM, Prompting Basics, Everyday Use Cases, Intro to Creative AI, Responsible Use, Prompt Library Creation
Tools: ChatGPT, DALL-E, Opus Clip, Snipd, Descript
Objective: Build comfort, curiosity, and foundational confidence

### Level 2: Applied Capability
Topics: What Are AI Agents?, Custom GPTs, Instruction Design, Human-in-the-Loop, Ethical Framing, Agent Templates
Tools: ChatGPT Custom GPT Builder, Claude Projects & Skills, Microsoft Copilot Agents, Google Gems
Objective: Empower individuals to design AI assistants tailored to their work

### Level 3: Systemic Integration
Topics: AI Workflow Mapping, Agent Chaining, Input Logic & Role Mapping, Automated Output Generation, Process Use Cases, Performance & Feedback Loops
Tools: Make, Zapier, n8n, API integrations, Airtable
Objective: Scale AI usage through integrated, automated pipelines

### Level 4: Interactive Dashboards & Tailored Front-Ends
Topics: Application Architecture, User-Centered Dashboard Design, Data Visualization, Role-Based Views, Prototype Testing, Stakeholder Feedback
Tools: Figma, V0, Google AI Studio, Cursor, dashboard prototyping tools
Objective: Shift from data-in-a-sheet to tailored experiences built for specific end users

### Level 5: Full AI-Powered Applications
Topics: Application Architecture, Personalization Engines, Knowledge Base Applications, Custom Learning Platforms, Full-Stack AI Integration, User Testing & Scaling
Tools: Google AI Studio, GitHub, Claude Code, Supabase, Vercel
Objective: Full-stack AI applications where different users get different experiences

### Cross-Functional Use Cases
- Consulting & Delivery: Create tailored client insights from notes and transcripts
- Proposal & BD: Generate draft proposals from templates and client inputs
- Project Management: Summarize risks, status updates, and meeting notes
- L&D / Training: Match individual skill gaps to existing learning modules
- Analytics & Insights: Process survey results and tag responses by role & sentiment
- Ops & SOP Management: Convert conversations into visual SOPs or step-by-step guides
- Comms & Change: Draft announcements or FAQs adapted to persona groups
- IT & Knowledge Management: Set up internal AI chatbots to retrieve documents or SOPs

## INSTRUCTIONS

Generate content ONLY for levels classified as "full" or "fast-track". Do NOT generate content for "awareness" or "skip" levels.

For each applicable level, generate:
1. A project title — action-oriented, specific to the learner's role and function
2. A project description — 2-3 sentences explaining what they'll build
3. A deliverable — one concrete, tangible output
4. A challengeConnection — 2-3 sentences that DIRECTLY reference the learner's stated challenge. Quote their exact words. This is the most important personalization element.
5. A recommended session format — based on their seniority level
6. 2-4 suggested resources — real tools, platforms, guides relevant to the project

For "fast-track" levels, frame as "validate and sharpen" rather than "learn from scratch."

## OUTPUT FORMAT

Respond ONLY with valid JSON:

{
  "pathwaySummary": "1-2 sentence personalized overview",
  "totalEstimatedWeeks": number,
  "levels": {
    "L1": {
      "depth": "full|fast-track",
      "projectTitle": "string",
      "projectDescription": "string",
      "deliverable": "string",
      "challengeConnection": "string",
      "sessionFormat": "string",
      "resources": [{ "name": "string", "note": "string" }]
    }
  }
}

Only include levels that are "full" or "fast-track". Omit "awareness" and "skip" levels entirely.`;

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const requestBody = JSON.stringify({
              model: openRouterModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
              temperature: 0.7,
              response_format: { type: 'json_object' },
            });

            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: requestBody,
            }, 'pathway');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (pathway):', geminiResponse.status, errText);
              const status = geminiResponse.status === 429 ? 429 : 502;
              const message = geminiResponse.status === 429
                ? 'The AI service is temporarily busy. Please wait a moment and try again.'
                : 'AI service error';
              res.statusCode = status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: message, retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (pathway):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (pathway):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function dashboardDesignProxyPlugin(apiKey: string, model: string, textModel?: string): Plugin {
  const htmlModel = textModel || 'google/gemini-2.0-flash-001';
  // System prompt for Gemini HTML fallback (used when Imagen is unavailable)
  const htmlFallbackPrompt = `You are an elite UI designer creating stunning, modern dashboard mockups. Generate a complete HTML dashboard.

METRIC REQUIREMENTS: Include EVERY metric the user listed. Infer 3-5 additional relevant metrics. Use realistic sample data with % change indicators.

DESIGN AESTHETIC: MINIMAL and AIRY. Font: 'DM Sans'. Background: #F8FAFC. Cards: white, border-radius: 16px, border: 1px solid #E2E8F0. Colors: Primary #38B2AC, Secondary #5B6DC2, Accent #D47B5A. NO sidebars, NO navigation menus, NO buttons. Content only.

RESPONSE FORMAT (JSON only, no markdown):
{
  "image_url": "",
  "image_prompt": "A description of the dashboard",
  "html_content": "<!DOCTYPE html><html>...</html>"
}

The html_content MUST fit inside a 1100x700px iframe WITHOUT scrolling. Add "html, body { margin: 0; padding: 24px; overflow: hidden; height: 100%; box-sizing: border-box; }" to CSS. Use viewBox for SVG charts. Keep compact: max 4-5 KPI cards, max 2 charts side by side.`;

  return {
    name: 'dashboard-design-proxy',
    configureServer(server) {
      server.middlewares.use('/api/design-dashboard', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured', use_fallback: true }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const {
              user_needs, target_audience, key_metrics, data_sources,
              dashboard_type, visual_style, inspiration_url,
              refinement_feedback, previous_prompt,
              inspiration_images,
            } = JSON.parse(body);

            // Build a descriptive prompt for Gemini image generation
            const styleDesc = visual_style === 'data-dense' ? 'data-dense with maximum information density'
              : visual_style === 'executive-polished' ? 'executive and polished with large KPI cards'
              : visual_style === 'colorful-visual' ? 'colorful and visual with bold infographic style'
              : 'clean and minimal with lots of whitespace';

            // ─── Analyze inspiration images if provided ───
            let inspirationPatterns = '';
            if (inspiration_images && Array.isArray(inspiration_images) && inspiration_images.length > 0) {
              console.log(`Analyzing ${inspiration_images.length} inspiration image(s)...`);
              try {
                const inspModel = htmlModel.startsWith('google/') ? htmlModel : `google/${htmlModel}`;
                const imageParts = inspiration_images.map((img: string) => {
                  if (!img.startsWith('data:')) return null;
                  const commaIdx = img.indexOf(',');
                  if (commaIdx === -1) return null;
                  const header = img.slice(5, commaIdx);
                  const semiIdx = header.indexOf(';');
                  if (semiIdx === -1) return null;
                  const mimeType = header.slice(0, semiIdx);
                  const data = img.slice(commaIdx + 1);
                  if (!mimeType.startsWith('image/') || !data) return null;
                  return { mimeType, data };
                }).filter(Boolean);

                if (imageParts.length > 0) {
                  const imageUrls = imageParts.map((p: any) => ({
                    type: 'image_url',
                    image_url: { url: `data:${p.mimeType};base64,${p.data}` },
                  }));
                  const analyzeResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                      model: inspModel,
                      messages: [
                        { role: 'system', content: `You are an expert UI/UX analyst specializing in dashboard and application design. Analyze the provided screenshot(s) and extract a comprehensive design brief. You MUST respond with valid JSON only — no markdown, no code fences, no explanation.\n\nJSON schema:\n{\n  "color_scheme": {\n    "primary": "<hex>",\n    "secondary": "<hex>",\n    "accent": "<hex>",\n    "background": "<hex>",\n    "card_background": "<hex>",\n    "text_primary": "<hex>",\n    "text_secondary": "<hex>",\n    "palette_description": "<1 sentence describing the overall color mood>"\n  },\n  "composition": "<layout description>",\n  "components": ["<list UI elements>"],\n  "typography": "<font style observations>",\n  "visual_effects": "<border radius, shadows, gradients, icons>",\n  "data_density": "<low | medium | high>",\n  "design_instructions": "<3-5 sentence paragraph combining all above into actionable design instructions. Emphasise COLOR SCHEME prominently with exact hex values.>"\n}\n\nIMPORTANT: The color_scheme is the MOST critical extraction. Extract exact hex values by sampling dominant colors from the image.` },
                        {
                          role: 'user',
                          content: [
                            { type: 'text', text: 'Analyze these screenshot(s) and extract the design traits as JSON. Pay special attention to the exact color palette used:' },
                            ...imageUrls,
                          ],
                        },
                      ],
                      temperature: 0.3,
                    }),
                  }, 'dashboard-analyze');

                  if (analyzeResponse.ok) {
                    const analyzeData = await analyzeResponse.json();
                    const rawPatterns = analyzeData?.choices?.[0]?.message?.content || '';
                    if (rawPatterns.trim()) {
                      try {
                        const cleaned = rawPatterns.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                        const parsed = JSON.parse(cleaned);
                        const cs = parsed.color_scheme || {};
                        const colorBlock = cs.primary
                          ? `COLOR SCHEME: primary=${cs.primary}, secondary=${cs.secondary || 'N/A'}, accent=${cs.accent || 'N/A'}, background=${cs.background || '#FFFFFF'}, card_bg=${cs.card_background || '#FFFFFF'}, text=${cs.text_primary || '#1A202C'}. ${cs.palette_description || ''}`
                          : '';
                        const parts = [
                          colorBlock,
                          parsed.composition ? `LAYOUT: ${parsed.composition}` : '',
                          parsed.components?.length ? `COMPONENTS: ${parsed.components.join(', ')}` : '',
                          parsed.typography ? `TYPOGRAPHY: ${parsed.typography}` : '',
                          parsed.visual_effects ? `VISUAL STYLE: ${parsed.visual_effects}` : '',
                          parsed.data_density ? `DATA DENSITY: ${parsed.data_density}` : '',
                          parsed.design_instructions ? `INSTRUCTIONS: ${parsed.design_instructions}` : '',
                        ].filter(Boolean);
                        inspirationPatterns = parts.join('\n');
                      } catch {
                        inspirationPatterns = rawPatterns.trim();
                      }
                      console.log('✅ Inspiration image analysis complete');
                    }
                  } else {
                    console.log('Inspiration analysis failed, continuing without it');
                  }
                }
              } catch (analyzeErr) {
                console.log('Inspiration analysis error, continuing without it:', analyzeErr);
              }
            }

            let imagePrompt: string;

            // ─── If refinement feedback is provided, use Gemini text model to refine the prompt ───
            if (refinement_feedback && previous_prompt) {
              console.log('Refining image prompt based on user feedback...');
              const refModel = htmlModel.startsWith('google/') ? htmlModel : `google/${htmlModel}`;

              const inspirationContext = inspirationPatterns
                ? `\n\nDESIGN REFERENCE FROM INSPIRATION IMAGES (must be maintained in the refined prompt): ${inspirationPatterns}`
                : '';

              const refinementResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: refModel,
                  messages: [
                    { role: 'system', content: `You are an expert at refining image generation prompts for dashboard mockups. Produce a NEW, complete prompt that incorporates user feedback while keeping all good parts of the original. Output ONLY the refined prompt text. Keep all formatting instructions from the original. If design reference patterns are provided, incorporate them.` },
                    { role: 'user', content: `ORIGINAL PROMPT:\n${previous_prompt}\n\nUSER FEEDBACK:\n${refinement_feedback}${inspirationContext}\n\nGenerate the refined prompt:` },
                  ],
                  temperature: 0.4,
                }),
              }, 'dashboard-refine');

              if (refinementResponse.ok) {
                const refinementData = await refinementResponse.json();
                const refinedText = refinementData?.choices?.[0]?.message?.content || '';
                if (refinedText.trim()) {
                  imagePrompt = refinedText.trim();
                  console.log('✅ Prompt refined successfully (with inspiration:', !!inspirationPatterns, ')');
                } else {
                  imagePrompt = `${previous_prompt} IMPORTANT CHANGES REQUESTED: ${refinement_feedback}${inspirationPatterns ? ` DESIGN REFERENCE: ${inspirationPatterns}` : ''}`;
                }
              } else {
                imagePrompt = `${previous_prompt} IMPORTANT CHANGES REQUESTED: ${refinement_feedback}${inspirationPatterns ? ` DESIGN REFERENCE: ${inspirationPatterns}` : ''}`;
              }
            } else {
              const defaultColors = inspirationPatterns ? '' : ' Teal and navy color scheme.';
              imagePrompt = `Generate a high-fidelity professional dashboard UI screenshot mockup for ${target_audience || 'business users'}. The dashboard shows: ${key_metrics || 'key business metrics'}. Purpose: ${user_needs}. Style: ${styleDesc}. ${dashboard_type ? `Type: ${dashboard_type}.` : ''} Modern flat design.${defaultColors} DM Sans font. Make ALL text crisp and readable. 16:9 aspect ratio.${inspirationPatterns ? `\n\nDESIGN REFERENCE (match this palette and style closely):\n${inspirationPatterns}` : ''}`;
            }

            console.log('Generating dashboard via OpenRouter...');
            console.log('  → Prompt length:', imagePrompt.length, 'chars');

            // ─── Strategy 1: Try image generation with Nano Banana 2 ───
            const imgModel = model.startsWith('google/') ? model : `google/${model}`;
            console.log('Strategy 1: Attempting image generation with', imgModel);

            try {
              const imageResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: imgModel,
                  messages: [
                    { role: 'user', content: imagePrompt },
                  ],
                  temperature: 0.7,
                }),
              }, 'dashboard-image');

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                const message = imageData?.choices?.[0]?.message;

                // OpenRouter returns images in message.images array
                const images = message?.images;
                if (Array.isArray(images) && images.length > 0) {
                  const imagePart = images.find((p: any) => p.type === 'image_url' && p.image_url?.url);
                  if (imagePart) {
                    console.log('Image generated successfully via Nano Banana 2');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      image_url: imagePart.image_url.url,
                      image_prompt: imagePrompt,
                      generation_method: 'gemini-image',
                      ...(inspirationPatterns ? { inspiration_analysis: inspirationPatterns } : {}),
                    }));
                    return;
                  }
                }

                // Also check content array (alternative format)
                const content = message?.content;
                if (Array.isArray(content)) {
                  const contentImg = content.find((p: any) => p.type === 'image_url' && p.image_url?.url);
                  if (contentImg) {
                    console.log('Image generated successfully via Nano Banana 2 (content array)');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      image_url: contentImg.image_url.url,
                      image_prompt: imagePrompt,
                      generation_method: 'gemini-image',
                      ...(inspirationPatterns ? { inspiration_analysis: inspirationPatterns } : {}),
                    }));
                    return;
                  }
                }

                console.log('Image model responded but no image found, falling back to HTML');
              } else {
                console.log('Image generation failed with status', imageResponse.status, ', falling back to HTML');
              }
            } catch (imgErr) {
              console.log('Image generation error, falling back to HTML:', imgErr);
            }

            // ─── Strategy 2: Fall back to HTML dashboard generation ───
            const htmlModelId = htmlModel.startsWith('google/') ? htmlModel : `google/${htmlModel}`;
            console.log('Strategy 2: Generating HTML dashboard with', htmlModelId);
            const userMessage = [
              `APP PURPOSE: ${user_needs}`,
              target_audience ? `TARGET USERS: ${target_audience}` : '',
              key_metrics ? `KEY FEATURES / METRICS: ${key_metrics}` : '',
              data_sources ? `DATA SOURCES: ${data_sources}` : '',
              dashboard_type ? `APP TYPE: ${dashboard_type}` : '',
              visual_style ? `VISUAL STYLE: ${visual_style}` : '',
              inspiration_url ? `INSPIRATION URL: ${inspiration_url}` : '',
              inspirationPatterns ? `\nCRITICAL DESIGN REFERENCE — The user provided inspiration images. You MUST match these design patterns closely (colours, layout, typography, card styles, spacing):\n${inspirationPatterns}` : '',
            ].filter(Boolean).join('\n');

            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: htmlModelId,
                messages: [
                  { role: 'system', content: htmlFallbackPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'dashboard-html');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('OpenRouter API error (dashboard):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', use_fallback: true, retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
              parsed.generation_method = 'html';
              if (inspirationPatterns) parsed.inspiration_analysis = inspirationPatterns;
            } catch {
              console.error('Failed to parse response (dashboard):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', use_fallback: true, retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (dashboard):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', use_fallback: true, retryable: true }));
          }
        });
      });
    },
  };
}

function prdProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are a senior product manager who writes PRDs specifically optimised for AI coding tools (Cursor, Lovable, Bolt.new, V0, Replit Agent, Claude Code). Your PRDs are the exact specification an AI agent reads to build a working app — every sentence either constrains a decision or describes a testable behaviour.

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

  return {
    name: 'prd-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-prd', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { user_needs, image_prompt, target_audience, key_metrics, data_sources, dashboard_type, visual_style, color_scheme, update_frequency } = JSON.parse(body);

            const userMessage = [
              `APP PURPOSE: ${user_needs}`,
              `APP DESIGN / MOCKUP DESCRIPTION: ${image_prompt}`,
              target_audience ? `TARGET USERS: ${target_audience}` : '',
              key_metrics ? `KEY FEATURES / METRICS: ${key_metrics}` : '',
              data_sources ? `DATA SOURCES: ${data_sources}` : '',
              dashboard_type ? `APP TYPE: ${dashboard_type}` : '',
              visual_style ? `VISUAL STYLE: ${visual_style}` : '',
              color_scheme ? `COLOR SCHEME: ${color_scheme}` : '',
              update_frequency ? `UPDATE FREQUENCY: ${update_frequency}` : '',
            ].filter(Boolean).join('\n');

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'prd');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (PRD):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (PRD):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (PRD):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

// ─── App Build Guide Proxy ───

function appBuildGuideProxyPlugin(apiKey: string, _model: string): Plugin {
  const systemPrompt = `You are an expert AI-assisted development coach. The user has already generated a PRD (Product Requirements Document) for their app and has chosen an AI coding platform. They already have the platform installed and ready to go.

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
- Cursor: Context file is .cursorrules in project root. Use Composer (Cmd+I) for multi-file generation. Start with "Build the app described in .cursorrules" then iterate. Explain chat vs Composer. Teach @-mentioning files.
- Lovable: Paste the entire PRD as the first message. Iterate with follow-up messages referencing specific PRD sections. Guide Supabase integration if PRD mentions a database.
- Bolt.new: Paste a focused PRD version as the first message. Explain the live StackBlitz environment. Use chat to request changes referencing PRD sections.
- Claude Code: Create CLAUDE.md in project root with PRD content. Start with /plan to let the AI propose architecture. The AI creates files and runs commands — teach reviewing and approving. Reference specific PRD sections for refinement.
- Codex (OpenAI): Paste PRD summary as the task description. Let the agent plan implementation. Teach reviewing diffs against PRD requirements.
- Google AI Studio: Paste condensed PRD into System Instructions field. Ask for one section at a time. Explain how to request full file outputs and copy them into a project. This platform requires more manual assembly.
- V0 (Vercel): V0 generates individual UI components. Reference the UI & Design System section. Include design details, colour palette, component behaviour. Generated code is Next.js/React.
- Replit Agent: Paste PRD summary as initial agent description. Enable deployment, database, hosting from PRD requirements. Use chat to refine referencing PRD sections.
- Not sure yet: Platform-agnostic advice — create a project context file, structure PRD as an effective prompt, iterate section by section.`;

  return {
    name: 'app-build-guide-proxy',
    configureServer(server) {
      server.middlewares.use('/api/app-build-guide', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { platform, prd_content, app_description } = JSON.parse(body);

            const userMessage = `Platform: ${platform}\n\nApp Description: ${app_description || "See PRD"}\n\nFull PRD:\n${(prd_content || '').slice(0, 12000)}`;

            const openRouterResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.4,
                max_tokens: 4000,
              }),
            }, 'app-build-guide');

            if (!openRouterResponse.ok) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await openRouterResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              steps: Array.isArray(parsed.steps) ? parsed.steps : [],
              tips: Array.isArray(parsed.tips) ? parsed.tips : [],
              limitations: typeof parsed.limitations === 'string' ? parsed.limitations : '',
              prd_snippet: typeof parsed.prd_snippet === 'string' ? parsed.prd_snippet : '',
            }));
          } catch (err) {
            console.error('Proxy error (app-build-guide):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

// ─── Insight Analysis Proxy ───

function insightAnalysisProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are an AI Upskilling Coach for the OXYGY AI Centre of Excellence. You analyze how learners apply AI in their work and give concise, actionable feedback.

CRITICAL RULE — QUALITY GATE:
Before providing analysis, assess whether the learner has given enough meaningful information. If the context or outcome is:
- Too vague (e.g., "used AI for something", "it was good")
- Nonsensical or irrelevant (e.g., random text, off-topic content)
- Too short to meaningfully analyze (fewer than ~15 words across both fields)

Then you MUST respond with the clarification format instead of the analysis format.

The five levels of the OXYGY AI upskilling framework are:
- Level 1: AI Fundamentals & Awareness — Basic prompting, everyday use cases, understanding LLMs
- Level 2: Applied Capability — Custom GPTs, AI agents, system prompt design
- Level 3: Systemic Integration — Workflow mapping, agent chaining, automated processes
- Level 4: Interactive Dashboards & Front-Ends — UX design for AI, dashboard prototyping, data visualization
- Level 5: Full AI-Powered Applications — Application architecture, personalization engines, full-stack AI

RESPONSE FORMAT — Choose ONE of the two formats below:

FORMAT A — When the insight lacks sufficient detail:
{
  "needsClarification": true,
  "clarificationMessage": "A friendly 1-2 sentence message explaining what additional detail would help. Be specific about what's missing.",
  "useCaseSummary": "",
  "nextLevelTranslation": "",
  "considerations": [],
  "nextSteps": ""
}

FORMAT B — When the insight has enough detail to analyze:
{
  "needsClarification": false,
  "useCaseSummary": "A concise 2-3 sentence summary of what they built or applied. Start with what they did, then acknowledge the outcome. Keep it factual and encouraging.",
  "nextLevelTranslation": "1-2 sentences explaining how this use case could be evolved into the NEXT level of the framework. Be specific — e.g., if they built a Level 2 custom GPT, describe what a Level 3 workflow integration version would look like.",
  "considerations": [
    "A practical consideration about data privacy, security, or governance",
    "A consideration about reliability, testing, or user adoption"
  ],
  "nextSteps": "1 sentence with a specific, actionable next step for their learning journey."
}

RULES:
- Keep all text concise. No filler phrases.
- Be direct and useful. Every sentence should contain actionable information.
- The nextLevelTranslation is the most important field — make it specific and practical.
- You must respond in valid JSON only.`;

  return {
    name: 'insight-analysis-proxy',
    configureServer(server) {
      server.middlewares.use('/api/analyze-insight', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { level, topic, context, outcome, rating, userProfile } = JSON.parse(body);

            const profileContext = userProfile
              ? `\n\nLearner Profile:\n- Role: ${userProfile.role || 'Not specified'}\n- Function: ${userProfile.function || 'Not specified'}\n- Seniority: ${userProfile.seniority || 'Not specified'}\n- AI Experience Level: ${userProfile.aiExperience || 'Not specified'}`
              : '';

            const userMessage = `Please analyze this AI application insight:

Level: ${level}
Topic: ${topic}
Context: ${context}
Outcome: ${outcome}
Self-assessed Impact Rating: ${rating}/5${profileContext}`;

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'insight');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (Insight):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (Insight):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (Insight):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function evaluateAppProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the OXYGY AI Application Evaluator — an expert in assessing AI-powered application designs and producing actionable product specifications.

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
  }
}`;

  return {
    name: 'evaluate-app-proxy',
    configureServer(server) {
      server.middlewares.use('/api/evaluate-app', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { appDescription, problemAndUsers, dataAndContent } = JSON.parse(body);

            const userMessage = [
              `APP DESCRIPTION:\n${appDescription || 'Not provided'}`,
              `PROBLEM & USERS:\n${problemAndUsers || 'Not provided'}`,
              `DATA & CONTENT:\n${dataAndContent || 'Not provided'}`,
            ].join('\n\n');

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'evaluate-app');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (evaluate-app):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (evaluate-app):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (evaluate-app):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function evaluateAppBuildPlanProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the OXYGY AI Build Plan Generator — an expert in creating actionable, tech-stack-specific implementation plans for AI-powered applications.

You will receive:
1. An application description and its approved design assessment
2. The user's CHOSEN tech stack: specific hosting platform, database/auth provider, and AI model provider

Your job is to generate a detailed, practical build plan that is FULLY CUSTOMISED to the user's selected technology stack. Reference their specific tools by name (e.g., "Vercel", "Supabase", "Claude Sonnet 4") — the user has explicitly chosen these.

You must respond with a JSON object containing these sections:

SECTION 1: BUILD PLAN SUMMARY
A 2-3 sentence overview of the build plan that names the chosen stack and summarises the approach.

SECTION 2: IMPLEMENTATION PHASES
3-5 phases, each with:
- phase: Phase name (e.g., "Phase 1: Foundation & Scaffold")
- description: What happens in this phase
- tasks: Array of 3-6 specific tasks. Be VERY specific — include actual CLI commands, file names, configuration steps referencing the chosen tools.
- duration_estimate: Realistic time estimate
- dependencies: Array of phases this depends on
- tech_stack_notes: 1-2 sentences on how the chosen stack specifically applies to this phase

SECTION 3: ARCHITECTURE COMPONENTS
4-8 components, each with:
- name, description, tools (specific to chosen stack), level_connection, priority
These should reference the ACTUAL chosen tools, not generic alternatives.

SECTION 4: RISKS & GAPS
3-5 risks specific to the chosen stack combination. For each:
- name, severity, description, mitigation

SECTION 5: STACK INTEGRATION NOTES
A paragraph explaining how the 3 chosen tools work together.

SECTION 6: GETTING STARTED
An array of 3-5 terminal commands to scaffold the project with the chosen stack.

SECTION 7: REFINEMENT QUESTIONS
3-5 follow-up questions to improve the build plan further.

If the user selected "Not sure yet" for any stack component, provide platform-agnostic guidance for that layer and suggest 2-3 options with trade-offs.

RESPONSE FORMAT (JSON only, no markdown):

{
  "build_plan_summary": "...",
  "implementation_phases": [
    { "phase": "...", "description": "...", "tasks": ["..."], "duration_estimate": "...", "dependencies": [], "tech_stack_notes": "..." }
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
  "getting_started": ["npx create-next-app@latest ...", "..."],
  "refinement_questions": ["...", "..."]
}`;

  return {
    name: 'evaluate-app-build-plan-proxy',
    configureServer(server) {
      server.middlewares.use('/api/evaluate-app-build-plan', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { appDescription, problemAndUsers, architecture_summary, design_score_summary, matrix_quadrant, tech_stack, refinement_context } = JSON.parse(body);

            const baseParts = [
              `APP DESCRIPTION:\n${appDescription || 'Not provided'}`,
              `PROBLEM & USERS:\n${problemAndUsers || 'Not provided'}`,
              `DESIGN SCORE SUMMARY:\n${design_score_summary || 'Not provided'}`,
              `ARCHITECTURE OVERVIEW:\n${architecture_summary || 'Not provided'}`,
              `MATRIX QUADRANT: ${matrix_quadrant || 'Not determined'}`,
              `\nSELECTED TECH STACK:`,
              `- Hosting: ${tech_stack?.hosting || 'Not selected'}`,
              `- Database & Auth: ${tech_stack?.database_auth || 'Not selected'}`,
              `- AI Engine: ${tech_stack?.ai_engine || 'Not selected'}`,
            ];
            if (refinement_context && typeof refinement_context === 'string') {
              baseParts.push(`\n${refinement_context}`);
            }
            const userMessage = baseParts.join('\n');

            const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;
            const geminiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'evaluate-app-build-plan');

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (evaluate-app-build-plan):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (evaluate-app-build-plan):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', retryable: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (evaluate-app-build-plan):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function n8nGenerateProxyPlugin(apiKey: string): Plugin {
  // Lazy-load the system prompt from the constants file
  let systemPrompt: string | null = null;
  function getSystemPrompt(): string {
    if (!systemPrompt) {
      const raw = fs.readFileSync(path.resolve(__dirname, 'constants/n8nSystemPrompt.ts'), 'utf-8');
      // Extract the template literal content between the backticks
      const match = raw.match(/export const N8N_SYSTEM_PROMPT = `([\s\S]*?)`;/);
      systemPrompt = match ? match[1] : '';
    }
    return systemPrompt!;
  }

  function buildN8nGeneratePrompt(intermediate: any): string {
    return `Generate a complete, valid n8n workflow JSON for the following workflow.
Respond ONLY with the raw JSON object. No markdown, no code fences, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}`;
  }

  function buildN8nRetryPrompt(intermediate: any, previousJson: string, errors: string[]): string {
    return `Your previous n8n JSON had validation errors. Fix ALL of the following errors and regenerate the complete workflow JSON. Respond ONLY with the corrected JSON.

Errors to fix:
${errors.map((e: string) => `- ${e}`).join('\n')}

Original workflow specification:
${JSON.stringify(intermediate, null, 2)}

Your previous (broken) JSON for reference:
${previousJson.slice(0, 2000)}...`;
  }

  return {
    name: 'n8n-generate-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-n8n-workflow', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { intermediate, attempt, previousJson, previousErrors } = JSON.parse(body);

            if (!intermediate) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing intermediate workflow data' }));
              return;
            }

            const isRetry = attempt && attempt > 1 && previousErrors?.length > 0;
            const userMessage = isRetry
              ? buildN8nRetryPrompt(intermediate, previousJson || '', previousErrors)
              : buildN8nGeneratePrompt(intermediate);

            // Use Claude via OpenRouter (not Gemini)
            const openRouterResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4',
                messages: [
                  { role: 'system', content: getSystemPrompt() },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.3,
                max_tokens: 4000,
              }),
            }, 'generate-n8n-workflow');

            if (!openRouterResponse.ok) {
              const errText = await openRouterResponse.text();
              console.error('OpenRouter API error (generate-n8n-workflow):', errText);
              const status = openRouterResponse.status === 429 ? 429 : 502;
              const message = openRouterResponse.status === 429
                ? 'The AI service is temporarily busy. Please wait a moment and try again.'
                : 'AI service error';
              res.statusCode = status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: message, retryable: true }));
              return;
            }

            const data = await openRouterResponse.json();
            const rawText = data?.choices?.[0]?.message?.content || '';
            const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ json: cleaned }));
          } catch (err) {
            console.error('Proxy error (generate-n8n-workflow):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function buildGuideProxyPlugin(apiKey: string): Plugin {
  let systemPrompt: string | null = null;
  function getSystemPrompt(): string {
    if (!systemPrompt) {
      const raw = fs.readFileSync(path.resolve(__dirname, 'constants/buildGuideSystemPrompt.ts'), 'utf-8');
      const match = raw.match(/export const BUILD_GUIDE_SYSTEM_PROMPT = `([\s\S]*?)`;/);
      systemPrompt = match ? match[1] : '';
    }
    return systemPrompt!;
  }

  return {
    name: 'build-guide-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-build-guide', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'API key not configured' })); return; }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { intermediate, platform } = JSON.parse(body);
            if (!intermediate || !platform) { res.statusCode = 400; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'Missing intermediate or platform' })); return; }

            const userMessage = `Generate a complete Build Guide for the following workflow.
Platform: ${platform}
Respond ONLY with the raw markdown document. No preamble, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}`;

            const openRouterResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4',
                messages: [
                  { role: 'system', content: getSystemPrompt() },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.5,
                max_tokens: 4000,
              }),
            }, 'generate-build-guide');

            if (!openRouterResponse.ok) {
              const errText = await openRouterResponse.text();
              console.error('OpenRouter API error (generate-build-guide):', errText);
              res.statusCode = openRouterResponse.status === 429 ? 429 : 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: openRouterResponse.status === 429 ? 'AI service busy. Try again.' : 'AI service error', retryable: true }));
              return;
            }

            const data = await openRouterResponse.json();
            const rawText = data?.choices?.[0]?.message?.content || '';
            const cleaned = rawText.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ markdown: cleaned }));
          } catch (err) {
            console.error('Proxy error (generate-build-guide):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

function disputeResolutionProxyPlugin(apiKey: string): Plugin {
  const systemPrompt = `You are an n8n workflow reviewer. A user has pushed back on one of your feedback items.
Consider their argument carefully and honestly. If they raise a valid point or provide
context you were missing, concede and explain why the issue no longer applies.
If your original feedback is still correct despite their argument, maintain your position
and explain clearly why — but acknowledge their perspective.
Respond ONLY with valid JSON matching this schema:
{
  "outcome": "concede | maintain",
  "response": "string — 1-2 sentences. Direct, honest, not defensive."
}`;

  return {
    name: 'dispute-resolution-proxy',
    configureServer(server) {
      server.middlewares.use('/api/resolve-dispute', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'API key not configured' })); return; }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { originalMessage, severity, disputeText, nodeContext } = JSON.parse(body);

            const userMessage = `Original feedback: ${originalMessage}
Severity: ${severity}
User's argument: ${disputeText}
Workflow context: ${JSON.stringify(nodeContext || {})}`;

            const openRouterModel = 'google/gemini-2.0-flash-001';
            const openRouterResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: openRouterModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userMessage },
                ],
                temperature: 0.5,
                response_format: { type: 'json_object' },
              }),
            }, 'resolve-dispute');

            if (!openRouterResponse.ok) {
              const errText = await openRouterResponse.text();
              console.error('OpenRouter API error (resolve-dispute):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await openRouterResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (resolve-dispute):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

// ─── Prompt Playground v2 — Strategy-aware prompt generation ───

function playgroundProxyPlugin(apiKey: string): Plugin {
  const systemPrompt = fs.readFileSync(
    path.resolve(__dirname, 'constants/playgroundSystemPrompt.ts'),
    'utf-8',
  );
  // Extract the template literal content between the backticks
  const match = systemPrompt.match(/`([\s\S]*)`/);
  const PLAYGROUND_SYSTEM = match ? match[1] : '';

  return {
    name: 'playground-proxy',
    configureServer(server) {
      server.middlewares.use('/api/playground', (req: Connect.IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'API key not configured' })); return; }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const { userInput } = JSON.parse(body);
            if (!userInput || typeof userInput !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'userInput is required' }));
              return;
            }

            const openRouterResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4',
                messages: [
                  { role: 'system', content: PLAYGROUND_SYSTEM },
                  { role: 'user', content: userInput },
                ],
                max_tokens: 2000,
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }, 'playground');

            if (!openRouterResponse.ok) {
              const errText = await openRouterResponse.text();
              console.error('OpenRouter API error (playground):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', retryable: true }));
              return;
            }

            const data = await openRouterResponse.json();
            const text = data?.choices?.[0]?.message?.content || '';
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (playground):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', retryable: true }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const geminiModel = env.GEMINI_MODEL || 'google/gemini-2.0-flash-001';
  const dashboardModel = env.DASHBOARD_MODEL || 'google/gemini-3.1-flash-image-preview';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      geminiProxyPlugin(env.OpenRouter_API, geminiModel),
      agentDesignProxyPlugin(env.OpenRouter_API, geminiModel),
      agentSetupGuideProxyPlugin(env.OpenRouter_API, geminiModel),
      workflowDesignProxyPlugin(env.OpenRouter_API, geminiModel),
      architectureProxyPlugin(env.OpenRouter_API, geminiModel),
      pathwayProxyPlugin(env.OpenRouter_API, geminiModel),
      dashboardDesignProxyPlugin(env.OpenRouter_API, dashboardModel, geminiModel),
      prdProxyPlugin(env.OpenRouter_API, geminiModel),
      appBuildGuideProxyPlugin(env.OpenRouter_API, geminiModel),
      insightAnalysisProxyPlugin(env.OpenRouter_API, geminiModel),
      evaluateAppBuildPlanProxyPlugin(env.OpenRouter_API, geminiModel),
      evaluateAppProxyPlugin(env.OpenRouter_API, geminiModel),
      n8nGenerateProxyPlugin(env.OpenRouter_API),
      buildGuideProxyPlugin(env.OpenRouter_API),
      disputeResolutionProxyPlugin(env.OpenRouter_API),
      playgroundProxyPlugin(env.OpenRouter_API),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
