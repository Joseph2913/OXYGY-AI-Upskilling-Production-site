import type { VercelRequest, VercelResponse } from '@vercel/node';

const PATH_A_PROMPT = `You are the OXYGY Workflow Architect — an expert in designing AI-powered automation workflows. You help users map their business processes into structured, multi-step workflows using a node-based system.

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

const PATH_B_PROMPT = `You are the OXYGY Workflow Reviewer — an expert in evaluating and improving AI-powered automation workflows.

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

// ─── Retry helper for OpenRouter API calls ───

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
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

      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get('retry-after');
        const delayMs = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 10000)
          : BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${label}] OpenRouter API returned ${response.status}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        lastResponse = response;
        continue;
      }

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

  if (lastResponse) return lastResponse;
  throw lastError || new Error('All retries exhausted');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OpenRouter_API;
  const model = process.env.GEMINI_MODEL || 'google/gemini-2.0-flash-001';

  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured' });
  }

  try {
    const { mode, task_description, tools_and_systems, user_workflow, user_rationale } = req.body;

    const systemPrompt = mode === 'auto_generate' ? PATH_A_PROMPT : PATH_B_PROMPT;

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
    const geminiResponse = await fetchWithRetry(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    }, 'design-workflow-vercel');

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('OpenRouter API error (workflow design):', geminiResponse.status, errText);
      const status = geminiResponse.status === 429 ? 429 : 502;
      const message = geminiResponse.status === 429
        ? 'The AI service is temporarily busy. Please wait a moment and try again.'
        : 'AI service error';
      return res.status(status).json({ error: message, retryable: true });
    }

    const data = await geminiResponse.json();
    const text = data?.choices?.[0]?.message?.content || '';

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Serverless function error (workflow design):', err);
    return res.status(500).json({ error: 'Internal server error', retryable: true });
  }
}
