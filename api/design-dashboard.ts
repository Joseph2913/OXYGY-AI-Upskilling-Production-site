import type { VercelRequest, VercelResponse } from '@vercel/node';

const HTML_FALLBACK_PROMPT = `You are an elite UI designer AND data strategist creating stunning, modern dashboard mockups. Your dashboards should look like they belong on Dribbble or Behance — minimal, airy, and visually refined.

METRIC REQUIREMENTS: Include EVERY metric the user listed. Infer 3-5 additional relevant metrics. Use realistic sample data with % change indicators.

DESIGN AESTHETIC: MINIMAL and AIRY. Font: 'DM Sans'. Background: #F8FAFC. Cards: white, border-radius: 16px, border: 1px solid #E2E8F0. Colors: Primary #38B2AC, Secondary #5B6DC2, Accent #D47B5A. NO sidebars, NO navigation menus, NO buttons. Content only.

RESPONSE FORMAT (JSON only, no markdown):
{
  "image_url": "",
  "image_prompt": "A description of the dashboard",
  "html_content": "<!DOCTYPE html><html>...</html>"
}

The html_content MUST fit inside a 1100x700px iframe WITHOUT scrolling. Add "html, body { margin: 0; padding: 24px; overflow: hidden; height: 100%; box-sizing: border-box; }" to CSS. Use viewBox for SVG charts. Keep compact: max 4-5 KPI cards, max 2 charts side by side.`;

const INSPIRATION_ANALYSIS_PROMPT = `You are an expert UI/UX analyst specializing in dashboard design. Analyze the provided dashboard screenshot(s) and extract the key design patterns. Focus on:

1. LAYOUT STRUCTURE: How are widgets arranged? Grid layout, column count, section grouping
2. COLOR SCHEME: Primary colors, accent colors, background tones, card styling
3. CHART TYPES: What visualization types are used (bar, line, donut, gauge, heatmap, sparkline, etc.)
4. INFORMATION DENSITY: Is it data-dense or spacious? How many KPIs/widgets are visible?
5. TYPOGRAPHY: Font style, heading sizes relative to body text, label formatting
6. CARD DESIGN: Border radius, shadows, borders, padding style
7. SPECIAL ELEMENTS: Any unique design patterns like progress bars, status indicators, alerts, tabs

Output a concise paragraph (3-5 sentences) describing these patterns as design instructions that could guide generating a similar dashboard. Be specific about colors, layout ratios, and widget types. Do NOT describe the data — only the visual design patterns.`;

const REFINEMENT_PROMPT = `You are an expert at refining image generation prompts for dashboard mockups. You will receive the original prompt that generated a dashboard image, the user's feedback about what they want changed, and optionally design patterns extracted from the user's inspiration images. Your job is to produce a NEW, complete image generation prompt that incorporates the user's feedback and the inspiration design patterns while keeping all the good parts of the original prompt. Output ONLY the refined prompt text, nothing else. Keep all formatting instructions (crisp text, 16:9 ratio, DM Sans font, etc.) from the original. If design reference patterns from inspiration images are provided, make sure they are incorporated into the new prompt.`;

// ─── Retry helper for Gemini API calls ───

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
        console.warn(`[${label}] Gemini API returned ${response.status}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
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

function parseInspirationImage(img: string): { inlineData: { mimeType: string; data: string } } | null {
  if (!img.startsWith('data:')) return null;
  const commaIdx = img.indexOf(',');
  if (commaIdx === -1) return null;
  const header = img.slice(5, commaIdx);
  const semiIdx = header.indexOf(';');
  if (semiIdx === -1) return null;
  const mimeType = header.slice(0, semiIdx);
  const data = img.slice(commaIdx + 1);
  if (!mimeType.startsWith('image/') || !data) return null;
  return { inlineData: { mimeType, data } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured', use_fallback: true });
  }

  try {
    const {
      user_needs, target_audience, key_metrics, data_sources,
      dashboard_type, visual_style, inspiration_url,
      refinement_feedback, previous_prompt,
      inspiration_images,
    } = req.body;

    // ─── Build style description ───
    const styleDesc = visual_style === 'data-dense' ? 'data-dense with maximum information density'
      : visual_style === 'executive-polished' ? 'executive and polished with large KPI cards'
      : visual_style === 'colorful-visual' ? 'colorful and visual with bold infographic style'
      : 'clean and minimal with lots of whitespace';

    // ─── Analyze inspiration images if provided ───
    let inspirationPatterns = '';
    if (inspiration_images && Array.isArray(inspiration_images) && inspiration_images.length > 0) {
      console.log(`Analyzing ${inspiration_images.length} inspiration image(s)...`);
      try {
        const analyzeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const imageParts = inspiration_images.map(parseInspirationImage).filter(Boolean);

        if (imageParts.length > 0) {
          const analyzeResponse = await fetchWithRetry(analyzeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: INSPIRATION_ANALYSIS_PROMPT }] },
              contents: [{
                role: 'user',
                parts: [
                  { text: 'Analyze these dashboard screenshot(s) and extract the key design patterns:' },
                  ...imageParts,
                ],
              }],
              generationConfig: { temperature: 0.3 },
            }),
          }, 'design-dashboard-inspiration-vercel');

          if (analyzeResponse.ok) {
            const analyzeData = await analyzeResponse.json();
            const patterns = analyzeData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (patterns.trim()) {
              inspirationPatterns = patterns.trim();
              console.log('Inspiration image analysis complete');
            }
          } else {
            console.log('Inspiration analysis failed, continuing without it');
          }
        }
      } catch (analyzeErr) {
        console.log('Inspiration analysis error, continuing without it:', analyzeErr);
      }
    }

    // ─── Build image generation prompt ───
    let imagePrompt: string;

    if (refinement_feedback && previous_prompt) {
      // Refine the previous prompt with user feedback
      console.log('Refining image prompt based on user feedback...');
      const refinementUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const inspirationContext = inspirationPatterns
        ? `\n\nDESIGN REFERENCE FROM INSPIRATION IMAGES (must be maintained in the refined prompt): ${inspirationPatterns}`
        : '';

      const refinementResponse = await fetchWithRetry(refinementUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: REFINEMENT_PROMPT }] },
          contents: [{
            role: 'user',
            parts: [{ text: `ORIGINAL PROMPT:\n${previous_prompt}\n\nUSER FEEDBACK:\n${refinement_feedback}${inspirationContext}\n\nGenerate the refined prompt:` }],
          }],
          generationConfig: { temperature: 0.4 },
        }),
      }, 'design-dashboard-refinement-vercel');

      if (refinementResponse.ok) {
        const refinementData = await refinementResponse.json();
        const refinedText = refinementData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (refinedText.trim()) {
          imagePrompt = refinedText.trim();
          console.log('Prompt refined successfully');
        } else {
          imagePrompt = `${previous_prompt} IMPORTANT CHANGES REQUESTED: ${refinement_feedback}${inspirationPatterns ? ` DESIGN REFERENCE: ${inspirationPatterns}` : ''}`;
        }
      } else {
        imagePrompt = `${previous_prompt} IMPORTANT CHANGES REQUESTED: ${refinement_feedback}${inspirationPatterns ? ` DESIGN REFERENCE: ${inspirationPatterns}` : ''}`;
      }
    } else {
      imagePrompt = `Generate a high-fidelity professional dashboard UI screenshot mockup for ${target_audience || 'business users'}. The dashboard shows: ${key_metrics || 'key business metrics'}. Purpose: ${user_needs}. Style: ${styleDesc}. ${dashboard_type ? `Type: ${dashboard_type}.` : ''} The dashboard has KPI metric cards at the top showing exact numbers with percentage change indicators, followed by line charts and bar charts below with clearly labeled axes. Modern flat design, white background with subtle gray borders, teal and navy color scheme. DM Sans font. Make ALL text, numbers, labels, and axis values crisp, sharp, and perfectly readable. 16:9 aspect ratio. This should look like a real production web application screenshot.${inspirationPatterns ? `\n\nIMPORTANT DESIGN REFERENCE — The user provided inspiration images. Match these design patterns closely: ${inspirationPatterns}` : ''}`;
    }

    console.log('Generating dashboard with Gemini 2.5 Flash Image...');
    console.log('  → Prompt length:', imagePrompt.length, 'chars');

    // ─── Strategy 1: Gemini 2.5 Flash Image (native image generation) ───
    try {
      const geminiImageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
      const geminiImageResponse = await fetchWithRetry(geminiImageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            imageConfig: { aspectRatio: '16:9' },
          },
        }),
      }, 'design-dashboard-image-vercel');

      if (geminiImageResponse.ok) {
        const geminiImageData = await geminiImageResponse.json();
        const parts = geminiImageData?.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);
        if (imagePart?.inlineData?.data) {
          const mimeType = imagePart.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
          console.log('Gemini 2.5 Flash Image generation successful');
          return res.status(200).json({
            image_url: imageUrl,
            image_prompt: imagePrompt,
            generation_method: 'gemini-image',
          });
        }
      }
      const errText = await geminiImageResponse.text().catch(() => '');
      console.log('Gemini Image not available, falling back to HTML generation:', errText.slice(0, 200));
    } catch (geminiImageErr) {
      console.log('Gemini Image error, falling back to HTML generation:', geminiImageErr);
    }

    // ─── Strategy 2: Fallback to Gemini HTML generation ───
    console.log('Using Gemini HTML fallback...');
    const userMessage = [
      `DASHBOARD PURPOSE: ${user_needs}`,
      target_audience ? `TARGET AUDIENCE: ${target_audience}` : '',
      key_metrics ? `KEY METRICS: ${key_metrics}` : '',
      data_sources ? `DATA SOURCES: ${data_sources}` : '',
      dashboard_type ? `DASHBOARD TYPE: ${dashboard_type}` : '',
      visual_style ? `VISUAL STYLE: ${visual_style}` : '',
      inspiration_url ? `INSPIRATION URL: ${inspiration_url} — Use this website's layout, style, and visual approach as design inspiration for the dashboard.` : '',
    ].filter(Boolean).join('\n');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiResponse = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: HTML_FALLBACK_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    }, 'design-dashboard-html-vercel');

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error (dashboard):', geminiResponse.status, errText);
      const status = geminiResponse.status === 429 ? 429 : 502;
      const message = geminiResponse.status === 429
        ? 'The AI service is temporarily busy. Please wait a moment and try again.'
        : 'AI service error';
      return res.status(status).json({ error: message, use_fallback: true, retryable: true });
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    parsed.generation_method = 'html';

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Serverless function error (dashboard):', err);
    return res.status(500).json({ error: 'Internal server error', use_fallback: true, retryable: true });
  }
}
