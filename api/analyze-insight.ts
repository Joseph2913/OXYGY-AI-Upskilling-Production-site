import type { VercelRequest, VercelResponse } from '@vercel/node';

const INSIGHT_SYSTEM_PROMPT = `You are an AI Upskilling Coach for the Oxygy AI Centre of Excellence. You analyze how learners apply AI in their work and give concise, actionable feedback.

CRITICAL RULE — QUALITY GATE:
Before providing analysis, assess whether the learner has given enough meaningful information. If the context or outcome is:
- Too vague (e.g., "used AI for something", "it was good")
- Nonsensical or irrelevant (e.g., random text, off-topic content)
- Too short to meaningfully analyze (fewer than ~15 words across both fields)

Then you MUST respond with the clarification format instead of the analysis format.

The five levels of the Oxygy AI upskilling framework are:
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: INSIGHT_SYSTEM_PROMPT }],
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
      console.error('Gemini API error (Insight):', errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Serverless function error (Insight):', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
