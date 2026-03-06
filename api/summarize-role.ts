import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { role } = req.body;
    if (!role || typeof role !== 'string' || role.trim().length < 10) {
      return res.status(400).json({ error: 'Role text too short to summarize' });
    }

    const openRouterModel = model.startsWith('google/') ? model : `google/${model}`;

    const geminiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          {
            role: 'system',
            content: `You are a concise profile summarizer. Given a user's role description, produce a short professional title (max 8 words). Return ONLY the title text, nothing else. Examples:
- Input: "I'm the Head of the AI Centre of Excellence. My goal is to improve the adoption of AI within the organisation, upscale the rest of the team..."
- Output: "Head of AI Centre of Excellence"
- Input: "I work as a marketing manager and I'm responsible for digital campaigns and brand strategy across EMEA"
- Output: "Marketing Manager — Digital & Brand Strategy"
- Input: "Software engineer focused on backend APIs and data pipelines for our analytics platform"
- Output: "Backend Engineer — Analytics Platform"`,
          },
          { role: 'user', content: role },
        ],
        temperature: 0.2,
        max_tokens: 30,
      }),
    });

    if (!geminiResponse.ok) {
      console.error('OpenRouter API error (summarize-role):', geminiResponse.status);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await geminiResponse.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ summary });
  } catch (err) {
    console.error('summarize-role error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
