import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are a senior product manager and technical writer specializing in dashboard and data visualization products. You create production-grade Product Requirements Documents (PRDs) that development teams can use to build real dashboards.

You will receive details about a dashboard project including: purpose, target audience, key metrics, data sources, visual style preferences, and a description of the mockup design. Your job is to generate a comprehensive, detailed, and actionable PRD that a real development team or AI coding tool could use to build this dashboard.

CRITICAL RULES:
- Every section must be SPECIFIC to the user's actual project — reference their exact metrics, audience, data sources, and use case throughout.
- Write at a professional level — this should read like a real PRD from a product team at a tech company.
- Be quantitative wherever possible — specify pixel sizes, grid ratios, refresh intervals, loading times, character limits.
- Include edge cases, error states, and fallback behaviors.
- Use concrete examples that reference the user's specific metrics and data.
- IMPORTANT: Every section value MUST be a plain text STRING, not a JSON object. Use formatted text with newlines, bullets (using * or -), and headers (using plain text) within the string. Never nest JSON objects inside section values.

RESPONSE FORMAT (JSON only, no markdown, no code fences):

{
  "prd_content": "PRD: [Descriptive dashboard name based on the user's purpose]",
  "sections": {
    "dashboard_overview": "SECTION CONTENT — see requirements below",
    "target_users": "SECTION CONTENT",
    "information_architecture": "SECTION CONTENT",
    "widget_specifications": "SECTION CONTENT",
    "visual_design": "SECTION CONTENT",
    "tech_stack": "SECTION CONTENT",
    "data_integration": "SECTION CONTENT",
    "interactions_filtering": "SECTION CONTENT",
    "responsive_behavior": "SECTION CONTENT",
    "human_checkpoints": "SECTION CONTENT",
    "acceptance_criteria": "SECTION CONTENT"
  }
}

SECTION REQUIREMENTS (each section must be comprehensive):

1. DASHBOARD OVERVIEW (15-25 sentences — this is the most important section):
- Dashboard name and one-line elevator pitch
- The specific business problem this dashboard solves — be very specific about the pain points
- Who requested it and why existing tools (spreadsheets, manual reports, existing dashboards) are insufficient
- 3-5 key success metrics for the dashboard itself (adoption rate >X%, time-to-insight <Xs, decision turnaround improvement)
- Scope boundaries: what this dashboard covers AND what it explicitly does not cover
- Expected launch timeline and iteration plan
- VISUAL DESCRIPTION: Provide an extremely detailed description of what the dashboard should look like when built. Describe the overall layout (e.g., "A top navigation bar with the dashboard title and date filters, followed by a row of 4-5 KPI summary cards, then a 2-column section with a line chart on the left and a bar chart on the right, and a full-width data table at the bottom"). Reference specific widget types, their approximate sizes, positions, and how they relate to each other.
- COLOR AND STYLE DIRECTION: Describe the intended visual tone — modern and minimal? Data-dense and enterprise? Colorful and engaging? Specify the primary color palette direction.
- KEY USER FLOWS: Describe the 2-3 most important things a user does when they open this dashboard (e.g., "1. Glance at KPI cards to see today's numbers. 2. Check the trend chart to see if metrics are improving. 3. Filter by region to compare performance.")
- This section should be comprehensive enough that an AI coding tool (like Cursor, Bolt, or Lovable) or a developer could read ONLY this section and understand exactly what to build

2. TARGET USERS & USER STORIES (10-15 sentences):
- 2-3 distinct user personas with their roles, goals, technical comfort, and typical usage patterns
- 5-8 user stories in 'As a [specific role], I want to [concrete action on the dashboard] so that [specific business outcome]' format
- Frequency of use per persona (daily, weekly, on-demand)
- Key decisions each persona needs to make using this dashboard

3. INFORMATION ARCHITECTURE (8-12 sentences):
- Page layout description: header region, navigation, main content zones, sidebar (if applicable)
- Section hierarchy with specific regions (e.g., "Top banner: 4 KPI summary cards. Middle: 2-column chart area. Bottom: data table with pagination")
- Content priority ordering — what the user sees first, second, third
- Navigation patterns (tabs, filters, drill-down paths)
- State management: default view, filtered view, detail view, empty state, error state

4. WIDGET SPECIFICATIONS (create a detailed spec for EACH metric):
For each key metric, specify:
- Widget type (KPI card, line chart, bar chart, donut chart, data table, sparkline, gauge, heatmap)
- Data displayed: primary value, comparison value (vs. previous period), trend direction, percentage change
- Visualization details: chart type, axis labels, legend, tooltip content, color coding rules
- Size: grid position (e.g., "Row 1, spans 3 of 12 columns")
- Interaction: hover behavior, click-through destination, drill-down capability
- Update frequency and loading state behavior
- Create at least one additional derived widget (e.g., trend chart combining multiple metrics, ranking table, distribution chart)

5. VISUAL DESIGN REQUIREMENTS (8-12 sentences):
- Color palette: primary, secondary, accent, success/warning/error states — with hex codes
- Typography: font family, heading sizes (H1-H4), body text size, line height, font weights
- Spacing system: padding, margins, gap between cards (use 4px/8px grid system)
- Card component spec: background color, border radius, border color, shadow, padding
- Chart color sequences for multi-series data
- Dark mode support (if applicable) or explanation of why single-mode
- Accessibility: contrast ratios, focus states, screen reader considerations

6. RECOMMENDED TECH STACK (8-12 sentences):
- Frontend framework recommendation with rationale (e.g., React + TypeScript for component reusability, or Next.js for SSR)
- Charting/visualization library (e.g., Recharts, Tremor, D3.js, Chart.js) with rationale based on the dashboard's complexity
- Backend/API layer (e.g., Node.js + Express, Supabase Edge Functions, serverless functions) based on data sources
- Database recommendation if persistent storage is needed (e.g., PostgreSQL via Supabase, MongoDB)
- Authentication approach (e.g., Clerk, Supabase Auth, Auth0) if role-based access is needed
- Hosting/deployment platform (e.g., Vercel, Netlify, AWS Amplify) with rationale
- Key dependencies and libraries (e.g., date-fns for date handling, tanstack-query for data fetching)
- Development tools (e.g., ESLint, Prettier, Storybook for component development)
- This section should be written so a non-technical stakeholder can understand WHY each technology is chosen — use analogies and plain language alongside the technical names

7. DATA INTEGRATION (8-12 sentences):
- List each data source with: connection method (API, database query, file import, webhook)
- Data refresh strategy: real-time, polling interval, scheduled batch, on-demand
- Data transformation pipeline: raw data → cleaned data → aggregated metrics → display-ready values
- Caching strategy: what gets cached, TTL, invalidation triggers
- Error handling: what happens when a data source is unavailable, stale data indicators
- Data volume estimates: expected row counts, query performance requirements
- Authentication and access control for each data source

8. INTERACTIONS & FILTERING (8-12 sentences):
- Global filters: date range picker (presets: Today, 7D, 30D, 90D, Custom), refresh button
- Dimension filters: dropdowns for each categorical dimension (e.g., region, product, team)
- Cross-filtering: clicking one widget filters others (specify which widgets are linked)
- Drill-down paths: what happens when a user clicks a KPI card, chart data point, or table row
- Search functionality: where applicable, what fields are searchable
- Sort behavior: default sort order, sortable columns, multi-column sort
- Export options: CSV, PDF, screenshot, email scheduled report

9. RESPONSIVE BEHAVIOR (6-10 sentences):
- Desktop (>1200px): full layout with all widgets visible, specific column grid (e.g., 12-column)
- Tablet (768-1200px): reorganized grid, specify which widgets stack or collapse
- Mobile (<768px): single-column stack, specify order priority, which widgets are hidden or collapsed
- Touch interactions: swipe between tabs, pinch-to-zoom on charts
- Performance: lazy loading for below-fold content, skeleton loading states

10. HUMAN-IN-THE-LOOP CHECKPOINTS (6-10 sentences):
- Data accuracy review: who verifies metric calculations before dashboard goes live
- Metric definition sign-off: stakeholder approval of how each metric is calculated
- Threshold configuration: who sets alert thresholds and how they are updated
- Access control review: who approves user permissions for sensitive data views
- Change management: process for updating metric definitions, adding new widgets, or modifying data sources
- Anomaly escalation: when the dashboard flags unusual data, who gets notified and what is the review process

11. ACCEPTANCE CRITERIA (12-20 numbered items):
- Specific, testable criteria covering: data accuracy, performance (load time <2s), responsive behavior, filter functionality, export functionality, error handling, accessibility (WCAG 2.1 AA), cross-browser compatibility
- Include edge cases: empty data states, single data point, maximum data volume, concurrent users
- Each criterion must be binary pass/fail testable`;

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
    const { user_needs, image_prompt, target_audience, key_metrics, data_sources, dashboard_type, visual_style, color_scheme, update_frequency } = req.body;

    const userMessage = [
      `DASHBOARD PURPOSE: ${user_needs}`,
      `DASHBOARD DESIGN: ${image_prompt}`,
      target_audience ? `TARGET AUDIENCE: ${target_audience}` : '',
      key_metrics ? `KEY METRICS: ${key_metrics}` : '',
      data_sources ? `DATA SOURCES: ${data_sources}` : '',
      dashboard_type ? `DASHBOARD TYPE: ${dashboard_type}` : '',
      visual_style ? `VISUAL STYLE: ${visual_style}` : '',
      color_scheme ? `COLOR SCHEME: ${color_scheme}` : '',
      update_frequency ? `UPDATE FREQUENCY: ${update_frequency}` : '',
    ].filter(Boolean).join('\n');

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
    }, 'generate-prd-vercel');

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('OpenRouter API error (PRD):', geminiResponse.status, errText);
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
    console.error('Serverless function error (PRD):', err);
    return res.status(500).json({ error: 'Internal server error', retryable: true });
  }
}
