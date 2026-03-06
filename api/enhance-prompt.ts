import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { mode, prompt, wizardAnswers } = req.body;

    let userMessage: string;
    if (mode === 'enhance') {
      userMessage = prompt;
    } else {
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
    const geminiResponse = await fetchWithRetry(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: 'system', content: GEMINI_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    }, 'enhance-prompt-vercel');

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('OpenRouter API error (enhance-prompt):', geminiResponse.status, errText);
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
    console.error('Serverless function error (enhance-prompt):', err);
    return res.status(500).json({ error: 'Internal server error', retryable: true });
  }
}
