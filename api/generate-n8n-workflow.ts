import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API endpoint for AI-powered n8n workflow JSON generation.
 *
 * Primary export path: sends the workflow intermediate + full n8n knowledge block
 * to Claude via OpenRouter, validates the result, and retries up to 3 times.
 *
 * POST /api/generate-n8n-workflow
 * Body: { intermediate: WorkflowIntermediate, attempt?: number, previousErrors?: string[] }
 */

import { N8N_SYSTEM_PROMPT } from '../constants/n8nSystemPrompt';

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
        console.warn(`[${label}] OpenRouter returned ${response.status}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        lastResponse = response;
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${label}] Network error: ${lastError.message}, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('All retries exhausted');
}

function buildGeneratePrompt(intermediate: unknown): string {
  return `Generate a complete, valid n8n workflow JSON for the following workflow.
Respond ONLY with the raw JSON object. No markdown, no code fences, no explanation.

Workflow specification:
${JSON.stringify(intermediate, null, 2)}`;
}

function buildRetryPrompt(
  intermediate: unknown,
  previousJson: string,
  errors: string[],
): string {
  return `Your previous n8n JSON had validation errors. Fix ALL of the following errors and regenerate the complete workflow JSON. Respond ONLY with the corrected JSON.

Errors to fix:
${errors.map(e => `- ${e}`).join('\n')}

Original workflow specification:
${JSON.stringify(intermediate, null, 2)}

Your previous (broken) JSON for reference:
${previousJson.slice(0, 2000)}...`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OpenRouter_API;
  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured' });
  }

  try {
    const { intermediate, attempt, previousJson, previousErrors } = req.body;

    if (!intermediate) {
      return res.status(400).json({ error: 'Missing intermediate workflow data' });
    }

    // Build the user prompt — first attempt or retry
    const isRetry = attempt && attempt > 1 && previousErrors?.length > 0;
    const userMessage = isRetry
      ? buildRetryPrompt(intermediate, previousJson || '', previousErrors)
      : buildGeneratePrompt(intermediate);

    // Use Claude via OpenRouter for higher-quality n8n JSON generation
    const model = 'anthropic/claude-sonnet-4-20250514';

    const response = await fetchWithRetry(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: N8N_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    }, 'generate-n8n-workflow');

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter API error (n8n generation):', response.status, errText);
      const status = response.status === 429 ? 429 : 502;
      const message = response.status === 429
        ? 'The AI service is temporarily busy. Please wait a moment and try again.'
        : 'AI service error';
      return res.status(status).json({ error: message, retryable: true });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';

    // Strip markdown fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return res.status(200).json({ json: cleaned });
  } catch (err) {
    console.error('Serverless function error (n8n generation):', err);
    return res.status(500).json({ error: 'Internal server error', retryable: true });
  }
}
