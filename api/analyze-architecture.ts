import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are the OXYGY AI Build Plan Advisor — an expert in helping business professionals plan AI-powered applications using a 5-tool development pipeline.

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
    const { appDescription, problemAndUsers, dataAndContent, technicalLevel } = req.body;

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
    const geminiResponse = await fetchWithRetry(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    }, 'analyze-architecture-vercel');

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('OpenRouter API error (architecture):', geminiResponse.status, errText);
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
    console.error('Serverless function error (architecture):', err);
    return res.status(500).json({ error: 'Internal server error', retryable: true });
  }
}
