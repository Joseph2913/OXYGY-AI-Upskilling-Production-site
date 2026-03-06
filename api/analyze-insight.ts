import type { VercelRequest, VercelResponse } from '@vercel/node';

const INSIGHT_SYSTEM_PROMPT = `You are an AI Upskilling Coach for the OXYGY AI Centre of Excellence. You analyze how learners apply AI in their work and give concise, actionable feedback.

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
  "clarificationMessage": "A friendly 1-2 sentence message explaining what additional detail would help. Be specific about what's missing — e.g., 'Could you describe the specific task you used AI for and what the output looked like?' Do NOT be condescending.",
  "useCaseSummary": "",
  "nextLevelTranslation": "",
  "considerations": [],
  "nextSteps": ""
}

FORMAT B — When the insight has enough detail to analyze:
{
  "needsClarification": false,
  "useCaseSummary": "A concise 2-3 sentence summary of what they built or applied. Start with what they did, then acknowledge the outcome. Keep it factual and encouraging.",
  "nextLevelTranslation": "1-2 sentences explaining how this use case could be evolved into the NEXT level of the framework. Be specific — e.g., if they built a Level 2 custom GPT, describe what a Level 3 workflow integration version would look like. If they are at Level 5, suggest scaling or enterprise deployment instead.",
  "considerations": [
    "A practical consideration about data privacy, security, or governance",
    "A consideration about reliability, testing, or user adoption"
  ],
  "nextSteps": "1 sentence with a specific, actionable next step for their learning journey."
}

RULES:
- Keep all text concise. No filler phrases like "Great job!" or "This is impressive!"
- Be direct and useful. Every sentence should contain actionable information.
- The nextLevelTranslation is the most important field — make it specific and practical.
- Considerations should be relevant to their specific use case, not generic advice.
- You must respond in valid JSON only. No markdown, no extra text.`;

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
    const { level, topic, context, outcome, rating, userProfile } = req.body;

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
    const geminiResponse = await fetchWithRetry(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    }, 'analyze-insight-vercel');

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('OpenRouter API error (Insight):', geminiResponse.status, errText);
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
    console.error('Serverless function error (Insight):', err);
    return res.status(500).json({ error: 'Internal server error', retryable: true });
  }
}
