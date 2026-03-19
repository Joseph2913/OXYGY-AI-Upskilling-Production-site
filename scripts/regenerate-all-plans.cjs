/**
 * Regenerate all learning plans for existing users.
 *
 * This script:
 * 1. Reads all learning plans from Supabase (latest per user)
 * 2. Reads each user's profile to get their survey data
 * 3. Calls OpenRouter with the updated PATHWAY_SYSTEM prompt
 * 4. Updates the learning_plans row in-place with the new plan
 *
 * Usage:
 *   node scripts/regenerate-all-plans.cjs
 *   node scripts/regenerate-all-plans.cjs --dry-run   # preview without writing
 */

const { createClient } = require('@supabase/supabase-js');

// ─── Config ───
const SUPABASE_URL = 'https://wcvwhztefcmsuzmpmehw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || require('fs').readFileSync(
  require('path').join(__dirname, '..', '.env.local'), 'utf-8'
).match(/SUPABASE_SERVICE_KEY=(.*)/)?.[1]?.trim();

const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API || require('fs').readFileSync(
  require('path').join(__dirname, '..', '.env.local'), 'utf-8'
).match(/OpenRouter_API=(.*)/)?.[1]?.trim();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';
const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── The updated system prompt (must match functions/src/index.ts) ───
const PATHWAY_SYSTEM = `You are a learning pathway designer for OXYGY's AI Centre of Excellence. You generate personalized, project-based learning pathways for professionals who want to develop AI skills.

Your outputs must be practical, role-specific, empathetic, and connected. You generate content in strict JSON format. Never include markdown, backticks, or preamble outside the JSON object.

CRITICAL: In the "challengeConnection" field for EVERY level, you MUST directly reference and quote specific details from the user's stated challenge.

IMPORTANT: Level 1 and Level 2 are MANDATORY — always "full" or "fast-track", never "awareness" or "skip". Only Levels 3, 4, and 5 may be "awareness" or "skip".

Generate content ONLY for levels classified as "full" or "fast-track".

## LEVEL PROJECT REQUIREMENTS — MUST FOLLOW

Each level has a specific skill being tested. The project you design MUST target that skill. Do NOT assign projects that belong to a higher or lower level.

**Level 1 — Prompt Engineering**
The project must test the learner's ability to craft effective prompts. The deliverable should be a set of structured prompts (e.g. a prompt library, a before/after prompt comparison, or a prompt template for a specific workflow). No agents, no automation, no code — just excellent prompting applied to their real work.
Example: "Create a prompt library of 5 structured prompts for [their function], showing the before (naive prompt) and after (engineered prompt) with output comparisons."

**Level 2 — Agent Building**
The project must involve creating a reusable AI agent (e.g. a Custom GPT, Claude Project, or Copilot Agent) that automates a repeated task in their role. The agent should be designed so it can be shared with teammates to standardise a process. No multi-step workflows or pipelines — just a single, well-designed agent.
Example: "Build a Custom GPT that [specific repeated task for their role] and write a 1-page usage guide so a colleague can use it immediately."

**Level 3 — Workflow Automation**
The project must involve connecting multiple systems or steps into an automated pipeline. Think: triggers, data flows between tools, and automated outputs. The learner should use tools like n8n, Zapier, Make, or equivalent. This is NOT about building a UI — it's about orchestrating backend processes.
Example: "Design and build an automated workflow where [trigger event] feeds data into [processing step] and outputs [result] — e.g. meeting transcripts automatically summarised and pushed to a CRM."

**Level 4 — Dashboard / Frontend UI**
The project must involve building a visual interface or dashboard that surfaces data or AI outputs to users. This is where UI/UX becomes the focus. The learner should build a working frontend (using no-code tools like Lovable, Bolt, Replit, or coded with React/HTML). The dashboard typically visualises outputs from a Level 3-style workflow.
Example: "Build an interactive dashboard that displays [relevant metrics/outputs for their role] with filters, role-based views, and clean data visualisation."

**Level 5 — Full-Stack Application**
The project must involve building a complete application with backend infrastructure: database, authentication, hosting, and a polished frontend. This is the capstone — the learner architects and ships a real product. It should combine skills from all previous levels.
Example: "Architect and deploy a full-stack AI application that [solves their specific challenge], including user authentication, a database, API integrations, and a hosted frontend."

## PROJECT DESIGN RULES
- The project MUST be personalised to the learner's role, function, and stated challenge.
- The project complexity must match the level — do not over-scope Level 1 or under-scope Level 5.
- The deliverable should be concrete and demonstrable (something they can show to their manager).
- Each projectDescription should be 2-3 sentences explaining what they'll build and why it matters for their work.
- Each deliverable should be a single clear sentence describing the tangible output.

OUTPUT FORMAT (JSON only):
{
  "pathwaySummary": "...",
  "totalEstimatedWeeks": number,
  "levels": {
    "L1": { "depth": "full|fast-track", "projectTitle": "...", "projectDescription": "...", "deliverable": "...", "challengeConnection": "...", "sessionFormat": "...", "resources": [{ "name": "...", "note": "..." }] }
  }
}`;

// ─── Labels for form data ───
const ambitionLabels = {
  'confident-daily-use': 'Confident daily AI use',
  'build-reusable-tools': 'Build reusable AI tools',
  'own-ai-processes': 'Design and own AI-powered processes',
  'build-full-apps': 'Build full AI-powered applications',
};

const experienceLabels = {
  'beginner': 'Beginner — rarely uses AI tools',
  'comfortable-user': 'Comfortable User — uses AI tools regularly',
  'builder': 'Builder — has created custom AI agents or prompt templates',
  'integrator': 'Integrator — has designed AI-powered workflows or multi-step pipelines',
};

// ─── OpenRouter call ───
async function callOpenRouter(systemPrompt, userMessage) {
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  };

  const resp = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenRouter ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Build the user message (same as Cloud Function) ───
function buildUserMessage(profile, levelDepths) {
  return `Generate a personalized learning pathway for the following professional.

## LEARNER PROFILE
- Role: ${profile.role || 'Not specified'}
- Function: ${profile.function === 'Other' ? (profile.function_other || 'Other') : (profile.function || 'Not specified')}
- Seniority: ${profile.seniority || 'Not specified'}
- AI Experience: ${experienceLabels[profile.ai_experience] || profile.ai_experience || 'Not specified'}
- Ambition: ${ambitionLabels[profile.ambition] || profile.ambition || 'Not specified'}
- Specific Challenge: "${profile.challenge || 'Not specified'}"
- Weekly Availability: ${profile.availability || 'Not specified'}${profile.experience_description ? `\n- AI Experience Details: "${profile.experience_description}"` : ''}${profile.goal_description ? `\n- Specific Goal: "${profile.goal_description}"` : ''}

## LEVEL CLASSIFICATIONS
- Level 1: ${levelDepths.L1 || 'full'}
- Level 2: ${levelDepths.L2 || 'full'}
- Level 3: ${levelDepths.L3 || 'full'}
- Level 4: ${levelDepths.L4 || 'full'}
- Level 5: ${levelDepths.L5 || 'full'}`;
}

// ─── Main ───
async function main() {
  console.log(`\n🔄 Regenerate All Learning Plans${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  // 1. Fetch all learning plans (latest per user via distinct on user_id)
  const { data: plans, error: plansErr } = await supabase
    .from('learning_plans')
    .select('id, user_id, level_depths, generated_at')
    .order('generated_at', { ascending: false });

  if (plansErr) { console.error('Failed to fetch plans:', plansErr); process.exit(1); }

  // Deduplicate: keep only the latest plan per user
  const latestByUser = new Map();
  for (const plan of plans) {
    if (!latestByUser.has(plan.user_id)) {
      latestByUser.set(plan.user_id, plan);
    }
  }

  const uniquePlans = Array.from(latestByUser.values());
  console.log(`Found ${plans.length} total plans, ${uniquePlans.length} unique users.\n`);

  // 2. Fetch all profiles in one go
  const userIds = uniquePlans.map(p => p.user_id);
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profErr) { console.error('Failed to fetch profiles:', profErr); process.exit(1); }

  const profileMap = new Map();
  for (const p of profiles) { profileMap.set(p.id, p); }

  // 3. Regenerate each plan
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < uniquePlans.length; i++) {
    const plan = uniquePlans[i];
    const profile = profileMap.get(plan.user_id);

    if (!profile) {
      console.log(`  [${i + 1}/${uniquePlans.length}] ⏭  User ${plan.user_id.slice(0, 8)}... — no profile, skipping`);
      skipped++;
      continue;
    }

    // Skip users with no challenge/role (incomplete profiles)
    if (!profile.role && !profile.challenge) {
      console.log(`  [${i + 1}/${uniquePlans.length}] ⏭  ${profile.full_name || plan.user_id.slice(0, 8)}... — empty profile, skipping`);
      skipped++;
      continue;
    }

    const levelDepths = plan.level_depths || { L1: 'full', L2: 'full', L3: 'full', L4: 'full', L5: 'full' };
    const userName = profile.full_name || profile.role || plan.user_id.slice(0, 8);

    console.log(`  [${i + 1}/${uniquePlans.length}] 🔄 ${userName} (${profile.role || '?'}, ${profile.function || '?'})`);

    if (DRY_RUN) {
      console.log(`           → Would regenerate with depths: L1=${levelDepths.L1}, L2=${levelDepths.L2}, L3=${levelDepths.L3}, L4=${levelDepths.L4}, L5=${levelDepths.L5}`);
      success++;
      continue;
    }

    try {
      const userMessage = buildUserMessage(profile, levelDepths);
      const result = await callOpenRouter(PATHWAY_SYSTEM, userMessage);

      // Validate the response has the expected shape
      if (!result.levels || !result.pathwaySummary) {
        throw new Error('Invalid response shape — missing levels or pathwaySummary');
      }

      // Update the existing plan row in-place
      const { error: updateErr } = await supabase
        .from('learning_plans')
        .update({
          pathway_summary: result.pathwaySummary,
          total_estimated_weeks: result.totalEstimatedWeeks || 0,
          levels_data: result.levels,
          generated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (updateErr) throw new Error(`Supabase update failed: ${updateErr.message}`);

      // Log the project titles for verification
      const levelKeys = ['L1', 'L2', 'L3', 'L4', 'L5'];
      for (const key of levelKeys) {
        const lvl = result.levels[key];
        if (lvl?.projectTitle) {
          console.log(`           ${key}: "${lvl.projectTitle}"`);
        }
      }

      success++;

      // Rate limit: small delay between API calls
      if (i < uniquePlans.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`           ❌ Error: ${err.message}`);
      failed++;

      // On rate limit, wait longer
      if (err.message.includes('429')) {
        console.log('           ⏳ Rate limited — waiting 10s...');
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }

  console.log(`\n✅ Done! Success: ${success}, Skipped: ${skipped}, Failed: ${failed}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
