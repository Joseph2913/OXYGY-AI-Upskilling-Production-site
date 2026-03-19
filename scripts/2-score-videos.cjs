require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OpenRouter_API;
if (!OPENROUTER_API_KEY) {
  console.error('Missing OpenRouter_API in .env.local');
  process.exit(1);
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FLASH_MODEL = 'google/gemini-3.1-flash-lite-preview';
const SONNET_MODEL = 'anthropic/claude-sonnet-4';
const PASS1_CHUNK_SIZE = 1000;
const PASS2_BATCH_SIZE = 100;

const TOPICS = [
  {
    level: 1, topicId: "1-1", topicTitle: "Prompt Engineering",
    topicSubtitle: "From brain dumps to structured, repeatable prompts",
    topicDescription: "Learn the Prompt Blueprint framework — Role, Context, Task, Format, Steps, Checks — plus the prompting spectrum and modifier techniques. Build the skill to choose the right approach for every task.",
    learningObjectives: [
      "Understand the difference between unstructured and structured prompting",
      "Apply the RCTF framework (Role, Context, Task, Format) to any task",
      "Identify when to use different prompting approaches on the spectrum",
      "Apply modifier techniques: chain-of-thought, few-shot, iterative refinement",
      "Build prompts that produce consistent, repeatable results"
    ],
  },
  {
    level: 1, topicId: "1-2", topicTitle: "Context Engineering",
    topicSubtitle: "Why your AI's output can only be as good as the context it receives",
    topicDescription: "The three context layers — inline context, document/file context, and persistent project context. Learn when to use each one, how context quality drives output quality, and how to organise your work so AI always has what it needs.",
    learningObjectives: [
      "Understand the three context layers: inline, document/file, and persistent project context",
      "Choose the right context strategy for different types of tasks",
      "Structure documents and files to maximise AI comprehension",
      "Set up persistent project context for ongoing AI collaboration",
      "Diagnose poor AI outputs by identifying missing or low-quality context"
    ],
  },
  {
    level: 1, topicId: "1-3", topicTitle: "Responsible AI Use",
    topicSubtitle: "Understanding what AI can't do",
    topicDescription: "AI limitations including hallucination, bias, and recency gaps. Verification strategies, the human-in-the-loop mindset, and knowing when NOT to use AI. Building trustworthy AI workflows through critical thinking.",
    learningObjectives: [
      "Identify common AI failure modes: hallucination, bias, and recency gaps",
      "Apply verification strategies to validate AI-generated outputs",
      "Adopt a human-in-the-loop mindset for responsible AI use",
      "Recognise scenarios where AI should not be used",
      "Design workflows that maintain accountability and trust"
    ],
  },
  {
    level: 1, topicId: "1-4", topicTitle: "Multimodal AI (Image / Video / Audio)",
    topicSubtitle: "Image, Video & Audio with AI",
    topicDescription: "AI for image generation and editing, video creation, audio transcription and generation. Understanding which modality to use for which task, and how multimodal AI tools fit into professional workflows.",
    learningObjectives: [
      "Use AI tools for image generation and editing",
      "Understand AI video creation capabilities and limitations",
      "Apply AI for audio transcription and generation tasks",
      "Choose the right AI modality for different professional tasks",
      "Integrate multimodal AI into existing workflows"
    ],
  },
  {
    level: 1, topicId: "1-5", topicTitle: "Learning How to Learn with AI",
    topicSubtitle: "Meta-learning strategies for the AI era",
    topicDescription: "Using AI as a tutor versus an answer machine. Building effective learning habits, the learning-doing loop, and developing the meta-skill of continuously upskilling with AI assistance.",
    learningObjectives: [
      "Distinguish between using AI as a tutor vs an answer machine",
      "Build effective learning habits with AI assistance",
      "Apply the learning-doing loop to accelerate skill development",
      "Design a personal AI learning strategy",
      "Use AI to identify knowledge gaps and create learning plans"
    ],
  },
  {
    level: 2, topicId: "2-2", topicTitle: "What AI Agents Are & Why They Matter",
    topicSubtitle: "Understanding the shift from prompts to autonomous agents",
    topicDescription: "What makes an AI agent different from a prompt or a chatbot. Why agents matter for teams, how they standardise quality, and the key components that make an agent reliable and reusable.",
    learningObjectives: [
      "Define what an AI agent is and how it differs from a prompt or chatbot",
      "Understand why AI agents matter for team productivity and quality",
      "Identify the key components of a reliable AI agent",
      "Recognise use cases where agents outperform one-off prompts",
      "Evaluate when to build an agent vs use a prompt"
    ],
  },
  {
    level: 2, topicId: "2-3", topicTitle: "Custom GPT / Agent Building",
    topicSubtitle: "Hands-on building of custom AI agents",
    topicDescription: "How to build custom GPTs, Claude projects, Copilot agents, and other no-code AI agents. From choosing a platform to configuring inputs, instructions, and outputs that work reliably.",
    learningObjectives: [
      "Build a custom GPT or equivalent agent on major platforms",
      "Configure agent inputs, instructions, and output formats",
      "Test and iterate on agent behaviour",
      "Choose the right platform for different agent use cases",
      "Deploy agents for personal and team use"
    ],
  },
  {
    level: 2, topicId: "2-4", topicTitle: "System Prompt & Instruction Design",
    topicSubtitle: "The art of writing instructions that define agent behaviour",
    topicDescription: "Designing system prompts that control agent behaviour consistently. How to write clear instructions, define tone and constraints, handle edge cases, and create agents that behave the same way every time.",
    learningObjectives: [
      "Write system prompts that define consistent agent behaviour",
      "Structure instructions with role, constraints, and output format",
      "Handle edge cases and failure modes in system prompts",
      "Test and refine system prompts for reliability",
      "Design prompts that maintain quality across different inputs"
    ],
  },
  {
    level: 2, topicId: "2-5", topicTitle: "Human-in-the-Loop Design",
    topicSubtitle: "Keeping humans accountable in AI workflows",
    topicDescription: "Designing AI agents and workflows where humans review, approve, or redirect AI outputs before they reach the end user. Checkpoints, escalation paths, and building trust through oversight.",
    learningObjectives: [
      "Design human review checkpoints in AI agent workflows",
      "Build escalation paths for when AI output needs human intervention",
      "Balance automation speed with human oversight quality",
      "Create feedback loops that improve agent performance over time",
      "Apply accountability principles to AI-assisted decision making"
    ],
  },
  {
    level: 2, topicId: "2-6", topicTitle: "Sharing & Standardising Agents",
    topicSubtitle: "From personal tool to team standard",
    topicDescription: "How to take an AI agent from a personal tool to a shared team resource. Standardising agent behaviour, managing access, versioning, and ensuring consistent quality when multiple people use the same agent.",
    learningObjectives: [
      "Deploy agents for team-wide access and use",
      "Standardise agent behaviour across different users",
      "Manage agent versioning and updates",
      "Create documentation and onboarding for shared agents",
      "Monitor agent usage and quality across a team"
    ],
  },
  {
    level: 2, topicId: "2-1", topicTitle: "From Prompts to Reusable Tools",
    topicSubtitle: "Building AI agents that standardise quality, save time, and scale across your team",
    topicDescription: "Learn when and how to turn a prompt into a permanent, shareable tool — an AI agent with defined inputs, defined behaviour, and structured outputs that runs the same way every time, for anyone on your team.",
    learningObjectives: [
      "Understand the difference between a prompt and a reusable AI agent",
      "Design system prompts that define agent behaviour consistently",
      "Structure agents with defined inputs and structured outputs",
      "Apply human-in-the-loop design principles to agent workflows",
      "Deploy and share agents across a team"
    ],
  },
  {
    level: 3, topicId: "3-1", topicTitle: "Mapping AI Workflows",
    topicSubtitle: "Triggers, AI steps, and accountable outputs",
    topicDescription: "How to deconstruct a business process into triggers, AI steps, and outputs. The logic of agent chaining, handoff points, human-in-the-loop governance, and multi-step automation.",
    learningObjectives: [
      "Decompose a business process into trigger, steps, and output components",
      "Design multi-step AI workflows with clear handoff points",
      "Apply human-in-the-loop governance checkpoints in automated pipelines",
      "Chain multiple AI agents into a single automated workflow",
      "Build and test workflows using n8n, Make, or Zapier"
    ],
  },
  {
    level: 4, topicId: "4-1", topicTitle: "Designing Interactive Dashboards",
    topicSubtitle: "From AI outputs to designed intelligence",
    topicDescription: "Working backwards from what the end user needs to see. Learn user-centred design for AI-powered interfaces — how automated pipeline outputs become structured, interactive dashboard components.",
    learningObjectives: [
      "Apply user-centred design thinking to AI-powered interfaces",
      "Design dashboard layouts that surface the right insight for the right user",
      "Map automated pipeline outputs to dashboard components",
      "Prototype interactive dashboards using no-code tools",
      "Connect live data sources to dashboard front-ends"
    ],
  },
  {
    level: 5, topicId: "5-1", topicTitle: "Building Full-Stack AI Applications",
    topicSubtitle: "The complete picture, end to end",
    topicDescription: "How workflows, front-ends, individual accounts, and personalised experiences combine into a complete AI application. A worked example using the Oxygy platform as a Level 5 case study.",
    learningObjectives: [
      "Understand the architecture of a full-stack AI application",
      "Design personalised user experiences with role-based journeys",
      "Connect AI workflows, front-ends, and user accounts into a unified system",
      "Apply product design thinking to AI application development",
      "Plan a complete build from concept to shipped product"
    ],
  }
];

const dataDir = path.join(__dirname, '..', 'data');

// ─── API helper ───────────────────────────────────────────────
async function callLLM(model, prompt, maxTokens = 4096) {
  const response = await axios.post(OPENROUTER_URL, {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });
  return response.data.choices[0].message.content.trim();
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── PASS 1: Gemini Flash — Bulk Filter ───────────────────────
async function pass1Filter(topic, levelVideos) {
  const pass1File = path.join(dataDir, `pass1-${topic.topicId}.json`);
  if (fs.existsSync(pass1File)) {
    console.log(`  Pass 1 already done — loading from cache`);
    return JSON.parse(fs.readFileSync(pass1File, 'utf8'));
  }

  const objectivesList = topic.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
  const PASS1_CONCURRENCY = 7;

  // Build all chunks
  const totalChunks = Math.ceil(levelVideos.length / PASS1_CHUNK_SIZE);
  const chunks = [];
  for (let c = 0; c < totalChunks; c++) {
    chunks.push({
      videos: levelVideos.slice(c * PASS1_CHUNK_SIZE, (c + 1) * PASS1_CHUNK_SIZE),
      offset: c * PASS1_CHUNK_SIZE,
    });
  }

  console.log(`  Firing ${totalChunks} chunks with ${PASS1_CONCURRENCY} parallel agents...`);

  async function filterChunk(chunk, chunkIndex) {
    const videoList = chunk.videos.map((v, i) => {
      const idx = chunk.offset + i;
      return `[${idx}] "${v.title}" — ${v.channelName} (${formatDuration(v.durationSeconds)})`;
    }).join('\n');

    const prompt = `You are a content curator for Oxygy, an AI upskilling platform for professional knowledge workers.

TOPIC: ${topic.topicTitle}
Subtitle: ${topic.topicSubtitle}
Description: ${topic.topicDescription}
Learning objectives:
${objectivesList}

Below is a list of ${chunk.videos.length} YouTube videos (index, title, channel, duration). Your job is to identify EVERY video that could be relevant to teaching or learning the topic above. Be inclusive — if a video might be useful, include it. We will do detailed scoring in a second pass.

Include videos that:
- Directly teach or demonstrate concepts in the topic
- Explain frameworks, techniques, or tools mentioned in the learning objectives
- Show practical examples or walkthroughs relevant to the topic
- Provide foundational understanding needed for the topic

Exclude videos that:
- Are clearly about unrelated subjects (gaming, cooking, politics, etc.)
- Only mention a relevant keyword in passing but aren't about the topic
- Are pure news/announcements with no educational value for this topic

VIDEO LIST:
${videoList}

Respond ONLY with a JSON array of the indices of relevant videos. Example: [0, 5, 12, 34]
If none are relevant, respond with: []`;

    try {
      const raw = await callLLM(FLASH_MODEL, prompt, 8192);
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) {
        const indices = JSON.parse(match[0]);
        console.log(`    Chunk ${chunkIndex + 1}/${totalChunks} ✓ ${indices.length} candidates`);
        return indices;
      } else {
        console.warn(`    Chunk ${chunkIndex + 1}/${totalChunks} ✗ parse error`);
        return [];
      }
    } catch (err) {
      console.error(`    Chunk ${chunkIndex + 1}/${totalChunks} ✗ ${err.message}`);
      return [];
    }
  }

  // Run chunks with concurrency limit
  const allCandidateIndices = [];
  for (let i = 0; i < chunks.length; i += PASS1_CONCURRENCY) {
    const wave = chunks.slice(i, i + PASS1_CONCURRENCY);
    const waveResults = await Promise.all(
      wave.map((chunk, j) => filterChunk(chunk, i + j))
    );
    for (const indices of waveResults) {
      allCandidateIndices.push(...indices);
    }
  }

  // Collect candidate videos
  const candidates = allCandidateIndices
    .filter(i => i >= 0 && i < levelVideos.length)
    .map(i => levelVideos[i]);

  // Deduplicate by videoId
  const seen = new Set();
  const uniqueCandidates = candidates.filter(v => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });

  console.log(`  Pass 1 complete: ${uniqueCandidates.length} unique candidates from ${levelVideos.length} videos`);

  // Cache pass 1 results
  fs.writeFileSync(pass1File, JSON.stringify(uniqueCandidates, null, 2));
  return uniqueCandidates;
}

// ─── PASS 2: Claude Sonnet — Detailed Scoring ────────────────
async function pass2Score(topic, candidates) {
  const pass2File = path.join(dataDir, `scores-${topic.topicId}.json`);
  if (fs.existsSync(pass2File)) {
    console.log(`  Pass 2 already done — loading from cache`);
    return JSON.parse(fs.readFileSync(pass2File, 'utf8'));
  }

  const objectivesList = topic.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
  const totalBatches = Math.ceil(candidates.length / PASS2_BATCH_SIZE);
  const CONCURRENCY = 11;

  // Build all batch tasks
  const batches = [];
  for (let b = 0; b < totalBatches; b++) {
    batches.push(candidates.slice(b * PASS2_BATCH_SIZE, (b + 1) * PASS2_BATCH_SIZE));
  }

  console.log(`  Firing ${totalBatches} batches with ${CONCURRENCY} parallel agents...`);

  // Process a single batch — returns array of scored videos
  async function scoreBatch(batch, batchIndex) {
    const videoList = batch.map((v, i) => {
      return `[${i}] Title: "${v.title}"
    Channel: ${v.channelName} (Tier ${v.channelTier})
    Duration: ${formatDuration(v.durationSeconds)}
    Views: ${v.viewCount || 'N/A'}`;
    }).join('\n\n');

    const prompt = `You are a content curator for Oxygy, an AI upskilling platform. Score each video's relevance to a specific learning topic.

TOPIC: ${topic.topicTitle} (Level ${topic.level})
Description: ${topic.topicDescription}
Learning objectives:
${objectivesList}

AUDIENCE: ${topic.level === 1 ? 'Beginner-friendly — professional knowledge workers new to AI. No coding required.' : topic.level <= 3 ? 'Intermediate practitioners — comfortable with AI tools, learning to build and automate.' : 'Advanced builders — designing systems, dashboards, and full applications.'}

Score each video on:
1. TOPIC ALIGNMENT (0–0.4): How directly does this video teach the topic and its learning objectives?
2. TEACHING QUALITY (0–0.3): Tutorial/explainer (high) vs commentary/news (lower). Practical demonstrations and walkthroughs score highest.
3. AUDIENCE FIT (0–0.3): Appropriate depth for Level ${topic.level}? Too technical for beginners or too shallow for advanced = score down.

Also classify each video's learning method: "explainer" / "tutorial" / "walkthrough" / "commentary" / "primer"

VIDEOS TO SCORE:
${videoList}

Respond ONLY with a JSON array. Each element must have: index, relevanceScore (sum of the 3 sub-scores, 0.0–1.0), topicAlignment, teachingQuality, audienceFit, learningMethodType, relevanceRationale (one sentence).

Example:
[
  {"index": 0, "relevanceScore": 0.85, "topicAlignment": 0.35, "teachingQuality": 0.25, "audienceFit": 0.25, "learningMethodType": "tutorial", "relevanceRationale": "Directly teaches prompt frameworks with practical examples."}
]`;

    try {
      const raw = await callLLM(SONNET_MODEL, prompt, 8192);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const scores = JSON.parse(match[0]);
        const results = [];
        for (const score of scores) {
          const video = batch[score.index];
          if (video) {
            results.push({
              ...video,
              relevanceScore: score.relevanceScore,
              topicAlignment: score.topicAlignment,
              teachingQuality: score.teachingQuality,
              audienceFit: score.audienceFit,
              learningMethodType: score.learningMethodType,
              relevanceRationale: score.relevanceRationale,
            });
          }
        }
        console.log(`    Batch ${batchIndex + 1}/${totalBatches} ✓ ${scores.length} scored`);
        return results;
      } else {
        console.warn(`    Batch ${batchIndex + 1}/${totalBatches} ✗ parse error`);
        return batch.map(v => ({ ...v, relevanceScore: 0, topicAlignment: 0, teachingQuality: 0, audienceFit: 0, learningMethodType: 'unknown', relevanceRationale: 'Parse error in batch' }));
      }
    } catch (err) {
      console.error(`    Batch ${batchIndex + 1}/${totalBatches} ✗ ${err.message}`);
      return batch.map(v => ({ ...v, relevanceScore: 0, topicAlignment: 0, teachingQuality: 0, audienceFit: 0, learningMethodType: 'unknown', relevanceRationale: `Error: ${err.message}` }));
    }
  }

  // Run batches with concurrency limit
  const allScored = [];
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const wave = batches.slice(i, i + CONCURRENCY);
    const waveResults = await Promise.all(
      wave.map((batch, j) => scoreBatch(batch, i + j))
    );
    for (const results of waveResults) {
      allScored.push(...results);
    }
  }

  // Sort by relevanceScore descending
  allScored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`  Pass 2 complete: ${allScored.length} videos scored`);

  // Save results
  fs.writeFileSync(pass2File, JSON.stringify(allScored, null, 2));
  return allScored;
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('=== Stage 2: Two-Pass Video Scoring ===\n');
  console.log('Pass 1: Gemini Flash (bulk filter in chunks of 1,000)');
  console.log('Pass 2: Claude Sonnet (detailed scoring in batches of 50)\n');

  const cataloguePath = path.join(dataDir, 'channel-catalogue-raw.json');
  if (!fs.existsSync(cataloguePath)) {
    console.error('Missing data/channel-catalogue-raw.json — run Stage 1 first');
    process.exit(1);
  }

  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  console.log(`Loaded ${catalogue.length} videos from catalogue\n`);

  for (const topic of TOPICS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Topic ${topic.topicId}: ${topic.topicTitle} (Level ${topic.level})`);
    console.log('='.repeat(60));

    // Filter to level
    const levelVideos = catalogue.filter(v => v.channelLevels.includes(topic.level));
    console.log(`  ${levelVideos.length} videos from channels mapped to Level ${topic.level}`);

    // Pass 1: Bulk filter with Gemini Flash
    console.log(`\n  --- Pass 1: Gemini Flash Filter ---`);
    const candidates = await pass1Filter(topic, levelVideos);

    // Pass 2: Detailed scoring with Claude Sonnet
    console.log(`\n  --- Pass 2: Claude Sonnet Scoring ---`);
    const scored = await pass2Score(topic, candidates);

    const qualifying = scored.filter(v => v.relevanceScore >= 0.5);
    console.log(`\n  Results: ${qualifying.length} videos scored >= 0.5`);
  }

  console.log('\n\n=== Stage 2 complete! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
