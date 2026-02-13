import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const GEMINI_SYSTEM_PROMPT = `You are the Oxygy Prompt Engineering Coach — an expert in transforming raw, unstructured prompts into well-engineered, structured prompts that produce dramatically better AI outputs.

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

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: GEMINI_SYSTEM_PROMPT }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error:', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error' }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Parse the JSON response — handle potential markdown fences
            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response:', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        });
      });
    },
  };
}

function agentDesignProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the Oxygy Agent Design Advisor — an expert in helping people design effective, reusable, and accountable AI agents for professional use.

You will receive a description of a task that a user wants to build an AI agent for, and optionally a description of the input data that agent will process.

You must respond with a JSON object containing exactly 4 sections that correspond to the 4 steps of the Agent Builder Toolkit:

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
a) A human-readable version — formatted as clean, professional output that a team member would want to read. Use clear headings, sections, and structure.
b) A JSON template — the exact JSON schema that the agent should produce. Include all fields, nested objects, arrays where appropriate, and use descriptive key names. Add brief comments (as string values) explaining what each field should contain.

The JSON template should be comprehensive and production-ready.

SECTION 3: SYSTEM PROMPT
Generate a complete, ready-to-use system prompt for this agent that incorporates:
- A clear role definition
- Context about the task and domain
- Explicit task instructions
- The JSON output format from Section 2 (embedded in the prompt)
- Step-by-step processing instructions
- Quality checks and constraints
- Human-in-the-loop requirements from Section 4

Mark each section of the prompt with labels: [ROLE], [CONTEXT], [TASK], [OUTPUT FORMAT], [STEPS], [QUALITY CHECKS] — so the frontend can apply color-coding.

SECTION 4: BUILT-IN ACCOUNTABILITY FEATURES
The goal here is NOT to remind humans to "review the output" — that's obvious and expected. Instead, design 3-5 specific features that are built into the agent's prompt to actively support human oversight. Each feature should describe how the agent itself is designed to make verification easy and effective.

Focus on what the agent PROVIDES to support the reviewer:
- Source citations (row numbers, timestamps, page references, speaker names)
- Confidence scores or uncertainty flags for each conclusion
- Reasoning trails that show how the agent arrived at its conclusions
- Data coverage summaries (what was analyzed vs. what was skipped)
- Alternative interpretations or dissenting patterns the agent considered

Each accountability feature must include:
- name: A short, clear name for this agent behavior (e.g., "Source Citation", "Confidence Scoring", "Reasoning Trail")
- severity: "critical", "important", or "recommended"
- what_to_verify: 1-2 sentences describing what the agent provides or does (NOT what the human should check — frame it as "The agent includes...", "The agent flags...", "The agent provides...")
- why_it_matters: 1-2 sentences on how this specific agent behavior helps the reviewer do their job faster and more effectively
- prompt_instruction: The exact text to add to the agent's prompt to enforce this behavior

RESPONSE FORMAT:
You must respond with the following JSON structure ONLY — no markdown, no extra text:

{
  "readiness": {
    "overall_score": 85,
    "verdict": "Strong candidate for a custom agent",
    "rationale": "This task is performed frequently...",
    "criteria": {
      "frequency": { "score": 90, "assessment": "Weekly or more frequent task" },
      "consistency": { "score": 85, "assessment": "Output structure must be consistent for team use" },
      "shareability": { "score": 80, "assessment": "Multiple team members would benefit" },
      "complexity": { "score": 75, "assessment": "Requires domain knowledge in..." },
      "standardization_risk": { "score": 90, "assessment": "Variable outputs would cause..." }
    },
    "level1_points": ["Point about when ad-hoc prompting would suffice"],
    "level2_points": ["Point about why a custom agent is recommended"]
  },
  "output_format": {
    "human_readable": "The formatted output as a string with newlines",
    "json_template": { "example": "nested object" }
  },
  "system_prompt": "The full system prompt text with [ROLE], [CONTEXT], [TASK], [OUTPUT FORMAT], [STEPS], [QUALITY CHECKS] section markers",
  "accountability": [
    {
      "name": "Source Row References",
      "severity": "critical",
      "what_to_verify": "Description...",
      "why_it_matters": "Description...",
      "prompt_instruction": "The exact prompt text..."
    }
  ]
}`;

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

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (agent design):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error' }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (agent design):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (agent design):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        });
      });
    },
  };
}

function workflowDesignProxyPlugin(apiKey: string, model: string): Plugin {
  const pathAPrompt = `You are the Oxygy Workflow Architect — an expert in designing AI-powered automation workflows. You help users map their business processes into structured, multi-step workflows using a node-based system.

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

  const pathBPrompt = `You are the Oxygy Workflow Reviewer — an expert in evaluating and improving AI-powered automation workflows.

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

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (workflow design):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error' }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (workflow design):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (workflow design):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        });
      });
    },
  };
}

function architectureProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the Oxygy AI Build Plan Advisor — an expert in helping business professionals plan AI-powered applications using a 5-tool development pipeline.

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

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (architecture):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error' }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (architecture):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (architecture):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        });
      });
    },
  };
}

function pathwayProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are a learning pathway designer for Oxygy's AI Center of Excellence. You generate personalized, project-based learning pathways for professionals who want to develop AI skills.

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
Topics: Application Architecture, User-Centred Dashboard Design, Data Visualization, Role-Based Views, Prototype Testing, Stakeholder Feedback
Tools: Figma, V0, Google AI Studio, Cursor, dashboard prototyping tools
Objective: Shift from data-in-a-sheet to tailored experiences built for specific end users

### Level 5: Full AI-Powered Applications
Topics: Application Architecture, Personalisation Engines, Knowledge Base Applications, Custom Learning Platforms, Full-Stack AI Integration, User Testing & Scaling
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

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (pathway):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error' }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (pathway):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (pathway):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        });
      });
    },
  };
}

function dashboardDesignProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are an elite UI designer AND data strategist creating stunning, modern dashboard mockups. Your dashboards should look like they belong on Dribbble or Behance — minimal, airy, and visually refined.

You will receive a description of dashboard needs, target audience, key metrics, data sources, and optionally an inspiration URL. Generate a complete HTML dashboard.

METRIC REQUIREMENTS (CRITICAL):
- You MUST include EVERY metric the user listed in KEY METRICS. Each one must appear as either a KPI card or a chart — never omit any.
- Beyond the user's listed metrics, INFER 3-5 additional relevant metrics based on the dashboard purpose, target audience, and data sources. For example:
  - If the user asks for a "sales dashboard" with "Revenue, Deals" → also add: Conversion Rate, Average Deal Size, Sales Pipeline Value, Win Rate, Monthly Growth Trend
  - If the user asks for "marketing analytics" with "Website Traffic" → also add: Bounce Rate, Session Duration, Top Channels, Lead Generation, Cost per Acquisition
  - If the user asks for "HR dashboard" with "Headcount" → also add: Attrition Rate, Time to Hire, Employee Satisfaction, Department Distribution, Open Positions
- Use realistic sample data with plausible values. Include % change indicators (up/down arrows with green/red badges) on KPI cards.
- Show a mix of visualization types: KPI cards for headline numbers, an area/line chart for trends over time, a bar chart or donut chart for breakdowns by category.

DESIGN AESTHETIC (MANDATORY):
- MINIMAL and AIRY — think Notion analytics, Linear insights, or Vercel dashboard. NO sidebars, NO navigation menus, NO buttons. This is a data visualization mockup, not a full app.
- Font: 'DM Sans', sans-serif loaded via Google Fonts link in HTML — NEVER use Inter, Roboto, or Arial
- Background: #F8FAFC (soft off-white), NOT pure white
- Cards: white (#FFFFFF) with border-radius: 16px, border: 1px solid #E2E8F0, subtle shadow: 0 1px 3px rgba(0,0,0,0.04)
- Color palette:
  - Primary: #38B2AC (teal) for charts, highlights
  - Secondary: #5B6DC2 (lavender-indigo) for secondary charts
  - Accent: #D47B5A (warm peach) for alerts, important callouts
  - Gold: #C4A934 for tertiary data
  - Text: #1A202C (headings), #4A5568 (body), #94A3B8 (muted)
  - Borders: #E2E8F0
- Layout: Single-column or grid layout with NO sidebar. Start with a simple header (dashboard title + subtitle/date range), then a row of compact KPI cards, then charts below. Lots of whitespace. Think content-first, not chrome-heavy.
- KPI Cards: Compact — metric label (11px, uppercase, muted), large bold value (28-36px), small colored badge with % change. Keep cards slim, not tall.
- Charts: Use inline SVG for smooth, elegant visualizations — area charts with gradient fills, clean bar charts, or donut charts. Keep them lightweight with thin grid lines, subtle axis labels, and smooth curves. NO heavy borders or 3D effects. IMPORTANT: All SVG charts must use viewBox (e.g. viewBox="0 0 400 200") and NOT use fixed width/height attributes — they should scale naturally with their container without stretching. Keep chart aspect ratios reasonable (roughly 2:1 width to height).
- Typography hierarchy: Title (22-28px bold), values (28-36px bold), labels (11px semibold uppercase tracking-wide), body (13-14px regular)
- Spacing: Moderate padding (20-24px in cards), consistent gaps (16-20px grid gaps). Avoid oversized paddings that make cards feel bloated.
- DO NOT include: sidebars, navigation menus, hamburger menus, buttons, links, footers, or any interactive chrome. This is a clean data dashboard mockup — content only.

If an INSPIRATION URL is provided, try to match the overall layout style, color mood, and component arrangement of that site while still using the color palette above.

RESPONSE FORMAT (JSON only, no markdown):

{
  "image_url": "",
  "image_prompt": "A description of the dashboard that was generated",
  "html_content": "<!DOCTYPE html><html>...</html>"
}

The html_content MUST be a complete, self-contained HTML document with a <link> to Google Fonts for DM Sans, all styles in a <style> tag, and semantic HTML. CRITICAL SIZING RULES:
- The dashboard will be displayed inside an iframe that is approximately 1100px wide and 700px tall.
- ALL content MUST fit within this size WITHOUT scrolling.
- Add "html, body { margin: 0; padding: 24px; overflow: hidden; height: 100%; box-sizing: border-box; }" to the CSS.
- Do NOT use fixed pixel widths on containers — use percentages or max-width instead so content adapts.
- SVG charts should NOT have fixed width/height — use width: 100% and a viewBox so they scale proportionally without stretching.
- Keep the layout compact: max 4-5 KPI cards in a row, max 2 charts side by side. Do not overfill the page.
The dashboard should feel lightweight and breathable — something a designer would showcase as a clean data visualization.`;

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
            const { user_needs, target_audience, key_metrics, data_sources, dashboard_title, dashboard_subtitle, inspiration_url } = JSON.parse(body);

            const userMessage = [
              `DASHBOARD PURPOSE: ${user_needs}`,
              target_audience ? `TARGET AUDIENCE: ${target_audience}` : '',
              key_metrics ? `KEY METRICS: ${key_metrics}` : '',
              data_sources ? `DATA SOURCES: ${data_sources}` : '',
              dashboard_title ? `DASHBOARD TITLE: ${dashboard_title}` : '',
              dashboard_subtitle ? `DASHBOARD SUBTITLE: ${dashboard_subtitle}` : '',
              inspiration_url ? `INSPIRATION URL: ${inspiration_url} — Use this website's layout, style, and visual approach as design inspiration for the dashboard.` : '',
            ].filter(Boolean).join('\n');

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (dashboard):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error', use_fallback: true }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (dashboard):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response', use_fallback: true }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (dashboard):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', use_fallback: true }));
          }
        });
      });
    },
  };
}

function prdProxyPlugin(apiKey: string, model: string): Plugin {
  const systemPrompt = `You are the Oxygy PRD Writer — an expert in creating Product Requirements Documents for AI-powered dashboard applications.

You will receive details about a dashboard (user needs, target audience, key metrics, data sources, and an image prompt describing the visual design). Generate a comprehensive PRD.

RESPONSE FORMAT (JSON only, no markdown):

{
  "prd_content": "Full PRD title",
  "sections": {
    "title_and_author": "Title, author, date, version info",
    "purpose_and_scope": "Business purpose and technical scope",
    "stakeholders": "Primary and secondary stakeholders",
    "market_assessment": "Target market and competitive context",
    "product_overview": "High-level product description",
    "functional_requirements": "Detailed functional requirements",
    "usability_requirements": "UX and accessibility requirements",
    "technical_requirements": "Tech stack, architecture, performance",
    "environmental_requirements": "Hosting, infrastructure, compliance",
    "support_requirements": "Documentation, monitoring, training",
    "interaction_requirements": "API integrations and data connections",
    "assumptions": "Key assumptions",
    "constraints": "Known constraints",
    "dependencies": "External dependencies",
    "workflow_timeline": "Development phases and milestones",
    "evaluation_metrics": "Success metrics and KPIs"
  }
}

Each section should be 3-8 sentences of professional, specific content tailored to the user's dashboard project. Reference their specific metrics, audience, and data sources throughout.`;

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
            const { user_needs, image_prompt, target_audience, key_metrics, data_sources } = JSON.parse(body);

            const userMessage = [
              `DASHBOARD PURPOSE: ${user_needs}`,
              `DASHBOARD DESIGN: ${image_prompt}`,
              target_audience ? `TARGET AUDIENCE: ${target_audience}` : '',
              key_metrics ? `KEY METRICS: ${key_metrics}` : '',
              data_sources ? `DATA SOURCES: ${data_sources}` : '',
            ].filter(Boolean).join('\n');

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userMessage }],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              console.error('Gemini API error (PRD):', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'AI service error' }));
              return;
            }

            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
              const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              console.error('Failed to parse Gemini response (PRD):', text);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
              return;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            console.error('Proxy error (PRD):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const geminiModel = env.GEMINI_MODEL || 'gemini-2.0-flash';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      geminiProxyPlugin(env.GEMINI_API_KEY, geminiModel),
      agentDesignProxyPlugin(env.GEMINI_API_KEY, geminiModel),
      workflowDesignProxyPlugin(env.GEMINI_API_KEY, geminiModel),
      architectureProxyPlugin(env.GEMINI_API_KEY, geminiModel),
      pathwayProxyPlugin(env.GEMINI_API_KEY, geminiModel),
      dashboardDesignProxyPlugin(env.GEMINI_API_KEY, geminiModel),
      prdProxyPlugin(env.GEMINI_API_KEY, geminiModel),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
