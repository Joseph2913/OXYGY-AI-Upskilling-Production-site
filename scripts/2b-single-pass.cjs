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
const MODEL = 'google/gemini-2.5-flash';
const CHUNK_SIZE = 1000;
const CONCURRENCY = 7;

const TOPICS = [
  {
    level: 5, topicId: "5-1", topicTitle: "Application Architecture",
    topicSubtitle: "Structuring AI-powered applications",
    topicDescription: "How to structure AI-powered applications — from database design and API layers to front-end architecture. Understanding the components of a full-stack AI app and how they connect.",
    learningObjectives: [
      "Understand the architecture of a full-stack AI application",
      "Design database schemas and API layers for AI products",
      "Connect front-end interfaces to AI backend services",
      "Choose between monolithic and microservice architectures",
      "Plan application architecture from concept to deployment"
    ],
  },
  {
    level: 5, topicId: "5-2", topicTitle: "Personalisation Engines",
    topicSubtitle: "Systems that adapt to individual users",
    topicDescription: "Building systems that adapt to individual users — recommendation engines, personalised content feeds, adaptive interfaces. How to design AI products that get smarter with each interaction.",
    learningObjectives: [
      "Design personalisation systems that adapt to user behaviour",
      "Build recommendation engines for content and features",
      "Implement user preference tracking and profiling",
      "Create adaptive interfaces that evolve per user",
      "Balance personalisation with privacy and transparency"
    ],
  },
  {
    level: 5, topicId: "5-3", topicTitle: "Knowledge Base Applications",
    topicSubtitle: "RAG, vector databases, and document processing",
    topicDescription: "RAG (Retrieval-Augmented Generation), vector databases, and document processing pipelines. How to build AI applications that reason over your organisation's knowledge and documents.",
    learningObjectives: [
      "Understand RAG architecture and when to use it",
      "Set up vector databases for semantic search",
      "Build document processing and ingestion pipelines",
      "Design knowledge base applications for enterprise use",
      "Evaluate and improve retrieval quality"
    ],
  },
  {
    level: 5, topicId: "5-4", topicTitle: "Custom Learning Platforms",
    topicSubtitle: "Educational tools, progress tracking, and adaptive learning",
    topicDescription: "Building educational tools and learning platforms powered by AI — progress tracking, adaptive learning paths, assessment engines, and personalised learning experiences.",
    learningObjectives: [
      "Design AI-powered learning experiences and curricula",
      "Build progress tracking and assessment systems",
      "Implement adaptive learning paths that respond to learner performance",
      "Create interactive educational tools with AI tutoring",
      "Measure learning outcomes and platform effectiveness"
    ],
  },
  {
    level: 5, topicId: "5-5", topicTitle: "Full-Stack AI Integration",
    topicSubtitle: "Connecting AI to production applications",
    topicDescription: "Connecting AI models, APIs, and workflows to production applications. Authentication, deployment, monitoring, error handling, and making AI features reliable in real products.",
    learningObjectives: [
      "Integrate AI APIs into production applications",
      "Implement authentication and access control for AI features",
      "Deploy AI-powered features with monitoring and error handling",
      "Manage AI model versioning and updates in production",
      "Build reliable AI features that handle edge cases gracefully"
    ],
  },
  {
    level: 5, topicId: "5-6", topicTitle: "User Testing & Scaling",
    topicSubtitle: "Usability testing, performance, and scaling",
    topicDescription: "Usability testing for AI products, performance optimisation, and scaling. How to validate that your AI product works for real users and prepare it for growth.",
    learningObjectives: [
      "Design and run usability tests for AI-powered products",
      "Identify and fix UX issues specific to AI features",
      "Optimise application performance for AI workloads",
      "Plan scaling strategies for growing user bases",
      "Build feedback loops that drive continuous product improvement"
    ],
  },
  {
    level: 4, topicId: "4-1", topicTitle: "Designing Interactive Interfaces",
    topicSubtitle: "From AI outputs to designed intelligence",
    topicDescription: "Building user-facing products powered by AI — websites, apps, dashboards, and tools. How to take automated outputs and present them through well-designed, interactive interfaces that users actually want to use.",
    learningObjectives: [
      "Design interactive interfaces for AI-powered products",
      "Connect AI backend outputs to front-end components",
      "Build websites, apps, and dashboards that present AI insights",
      "Choose the right interface pattern for different product types",
      "Ship polished, user-facing products powered by AI"
    ],
  },
  {
    level: 4, topicId: "4-2", topicTitle: "UI/UX Design Fundamentals for AI Products",
    topicSubtitle: "Making AI products intuitive and trustworthy",
    topicDescription: "Core UI/UX principles applied to AI-powered products. Layout, navigation, information hierarchy, handling uncertainty in AI outputs, and designing interfaces that build user confidence and reduce friction.",
    learningObjectives: [
      "Apply core UI/UX principles to AI-powered product design",
      "Design clear navigation and information hierarchy",
      "Handle AI uncertainty and errors gracefully in the interface",
      "Create onboarding flows that build user confidence",
      "Test and iterate on AI product interfaces with real users"
    ],
  },
  {
    level: 4, topicId: "4-3", topicTitle: "Visual Design — Colour, Typography & Spacing",
    topicSubtitle: "The design language of professional products",
    topicDescription: "Colour theory, font selection, spacing systems, and visual hierarchy. How to make AI-powered tools look polished and professional without a design degree — using design tokens, consistent systems, and proven patterns.",
    learningObjectives: [
      "Apply colour theory to create cohesive product palettes",
      "Choose and pair fonts for readability and brand consistency",
      "Use spacing systems and grids for clean, balanced layouts",
      "Build visual hierarchy that guides the user's eye",
      "Create a consistent design language using tokens and systems"
    ],
  },
  {
    level: 4, topicId: "4-4", topicTitle: "No-Code App & Website Building",
    topicSubtitle: "From prototype to shipped product without writing code",
    topicDescription: "Rapid prototyping and building with no-code tools like Glide, Bubble, Lovable, Bolt.new, and Retool. How to go from wireframe to working product, connect AI backends, and ship something real.",
    learningObjectives: [
      "Build functional apps and websites using no-code platforms",
      "Choose the right no-code tool for different product types",
      "Connect AI APIs and backends to no-code front-ends",
      "Prototype rapidly and iterate based on user feedback",
      "Ship production-ready products without writing code"
    ],
  },
  {
    level: 4, topicId: "4-5", topicTitle: "Data Visualisation & Storytelling",
    topicSubtitle: "Charts, graphs, and narratives that drive decisions",
    topicDescription: "Choosing the right chart type, designing for clarity, and telling compelling stories with data. How to turn raw AI outputs into visual insights that decision-makers can act on.",
    learningObjectives: [
      "Choose appropriate chart types for different data patterns",
      "Apply colour and accessibility principles to visualisations",
      "Design data narratives that tell compelling stories",
      "Avoid common data visualisation mistakes and misleading charts",
      "Build interactive visualisations that invite exploration"
    ],
  },
  {
    level: 4, topicId: "4-6", topicTitle: "Role-Based Views & Personalisation",
    topicSubtitle: "Different experiences for different users",
    topicDescription: "Designing products where different users see different things. Role-based access, personalised dashboards, tailored experiences — how one product serves multiple audiences effectively.",
    learningObjectives: [
      "Design role-based views within a single product",
      "Implement permission-based UI that shows relevant features per role",
      "Create personalised dashboard layouts for different stakeholders",
      "Balance feature richness with simplicity for each role",
      "Test multi-role products with representative users"
    ],
  },
  {
    level: 3, topicId: "3-2", topicTitle: "Agent Chaining & Orchestration",
    topicSubtitle: "Connecting multiple AI agents in sequence",
    topicDescription: "Connecting multiple AI agents in sequence, passing outputs between them, and managing context across chain steps. How to design multi-agent workflows that handle complex tasks reliably.",
    learningObjectives: [
      "Design multi-agent chains where outputs feed into subsequent agents",
      "Manage context passing between chained agents",
      "Handle errors and fallbacks in agent chains",
      "Choose between sequential and parallel agent orchestration",
      "Test and debug multi-agent workflows"
    ],
  },
  {
    level: 3, topicId: "3-3", topicTitle: "Input Logic & Role Mapping",
    topicSubtitle: "Routing the right data to the right agent",
    topicDescription: "Input schemas, role-based access, and conditional routing in AI workflows. How to design systems that route different inputs to different agents based on rules, roles, and conditions.",
    learningObjectives: [
      "Design input schemas for AI workflow triggers",
      "Implement conditional routing based on input type or user role",
      "Map organisational roles to workflow permissions",
      "Build branching logic in automation pipelines",
      "Validate and sanitise inputs before AI processing"
    ],
  },
  {
    level: 3, topicId: "3-4", topicTitle: "Automated Output Generation",
    topicSubtitle: "Templated outputs, format consistency, and batch processing",
    topicDescription: "Templated outputs, format consistency, batch processing, and quality assurance for AI-generated content. How to design workflows that produce reliable, formatted outputs at scale.",
    learningObjectives: [
      "Design output templates for consistent AI-generated content",
      "Implement batch processing for high-volume AI tasks",
      "Build quality assurance checks into automated pipelines",
      "Format AI outputs for different downstream systems",
      "Monitor and maintain output quality over time"
    ],
  },
  {
    level: 3, topicId: "3-5", topicTitle: "Human-in-the-Loop at Scale",
    topicSubtitle: "Approval workflows, exception handling, and escalation",
    topicDescription: "Approval workflows, exception handling, and escalation paths in automated AI systems. How to maintain human oversight without bottlenecking throughput when operating at scale.",
    learningObjectives: [
      "Design approval workflows for high-volume AI pipelines",
      "Build exception handling and escalation paths",
      "Balance automation throughput with human oversight",
      "Implement sampling and spot-check strategies",
      "Create dashboards for monitoring AI workflow quality"
    ],
  },
  {
    level: 3, topicId: "3-6", topicTitle: "Performance & Feedback Loops",
    topicSubtitle: "Measuring effectiveness and iterating on workflows",
    topicDescription: "Measuring workflow effectiveness, collecting feedback, iterating on AI workflows, and assessing ROI. How to build continuous improvement into your automation systems.",
    learningObjectives: [
      "Define metrics for measuring AI workflow effectiveness",
      "Build feedback collection mechanisms into workflows",
      "Iterate on workflow design based on performance data",
      "Calculate ROI for AI automation investments",
      "Design A/B testing for workflow improvements"
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
];

const dataDir = path.join(__dirname, '..', 'data');

async function callLLM(prompt, maxTokens = 8192) {
  const response = await axios.post(OPENROUTER_URL, {
    model: MODEL,
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

async function scoreChunk(chunk, chunkOffset, topic, chunkIndex, totalChunks) {
  const objectivesList = topic.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n');

  const videoList = chunk.map((v, i) => {
    const idx = chunkOffset + i;
    return `[${idx}] "${v.title}" — ${v.channelName} (Tier ${v.channelTier}, ${formatDuration(v.durationSeconds)}, ${(v.viewCount || 0).toLocaleString()} views)`;
  }).join('\n');

  const prompt = `You are a content curator for Oxygy, an AI upskilling platform for professional knowledge workers.

TOPIC: ${topic.topicTitle}
Subtitle: ${topic.topicSubtitle}
Description: ${topic.topicDescription}
Learning objectives:
${objectivesList}

AUDIENCE: Level ${topic.level} — ${topic.level === 1 ? 'Beginners new to AI, no coding.' : topic.level <= 3 ? 'Intermediate practitioners comfortable with AI tools.' : 'Advanced builders designing systems and apps.'}

Below are ${chunk.length} YouTube videos. Find the BEST videos for teaching this topic. Consider:
- Topic alignment: Does it directly teach the topic and learning objectives?
- Teaching quality: Is it a tutorial/explainer (best) or just news/commentary (weaker)?
- Audience fit: Right depth for Level ${topic.level}?

Return your TOP 10 picks from this chunk, ranked best first. If fewer than 10 are relevant, return fewer.

VIDEO LIST:
${videoList}

Respond ONLY with a JSON array. Each element:
{"index": 0, "relevanceScore": 0.85, "learningMethodType": "tutorial", "rationale": "One sentence."}

Scores: 0.0–1.0. Method types: "explainer" / "tutorial" / "walkthrough" / "commentary" / "primer"
If nothing relevant: []`;

  try {
    const raw = await callLLM(prompt);
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) {
      const results = JSON.parse(match[0]);
      console.log(`    Chunk ${chunkIndex + 1}/${totalChunks} ✓ ${results.length} picks`);
      return results.map(r => ({
        ...chunk[r.index - chunkOffset] || chunk[r.index],  // handle both absolute and relative indices
        relevanceScore: r.relevanceScore,
        learningMethodType: r.learningMethodType,
        relevanceRationale: r.rationale,
        topicAlignment: 0,
        teachingQuality: 0,
        audienceFit: 0,
      })).filter(v => v && v.title);
    } else {
      console.warn(`    Chunk ${chunkIndex + 1}/${totalChunks} ✗ parse error`);
      return [];
    }
  } catch (err) {
    console.error(`    Chunk ${chunkIndex + 1}/${totalChunks} ✗ ${err.message}`);
    return [];
  }
}

async function scoreTopic(topic, catalogue) {
  const outputFile = path.join(dataDir, `scores-${topic.topicId}.json`);
  if (fs.existsSync(outputFile)) {
    const existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    if (existing.length > 0) {
      console.log(`  Already scored — skipping`);
      return;
    }
  }

  const levelVideos = catalogue.filter(v => v.channelLevels.includes(topic.level));
  console.log(`  ${levelVideos.length} videos from Level ${topic.level} channels`);

  // Build chunks
  const totalChunks = Math.ceil(levelVideos.length / CHUNK_SIZE);
  const chunks = [];
  for (let c = 0; c < totalChunks; c++) {
    chunks.push({
      videos: levelVideos.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE),
      offset: c * CHUNK_SIZE,
    });
  }

  console.log(`  Firing ${totalChunks} chunks with ${CONCURRENCY} parallel agents...`);

  // Run all chunks in parallel waves
  const allPicks = [];
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const wave = chunks.slice(i, i + CONCURRENCY);
    const waveResults = await Promise.all(
      wave.map((chunk, j) => scoreChunk(chunk.videos, chunk.offset, topic, i + j, totalChunks))
    );
    for (const picks of waveResults) {
      allPicks.push(...picks);
    }
  }

  // Sort by score, take top 10
  allPicks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const top10 = allPicks.slice(0, 10);

  console.log(`  → ${allPicks.length} total picks across chunks, top 10 saved`);

  fs.writeFileSync(outputFile, JSON.stringify(top10, null, 2));
  return top10;
}

async function main() {
  console.log('=== Single-Pass Scoring (Gemini Flash) ===');
  console.log(`Model: ${MODEL}`);
  console.log(`Processing ${TOPICS.length} topics\n`);

  const cataloguePath = path.join(dataDir, 'channel-catalogue-raw.json');
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  console.log(`Loaded ${catalogue.length} videos\n`);

  for (const topic of TOPICS) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${topic.topicId}: ${topic.topicTitle}`);
    console.log('='.repeat(50));
    await scoreTopic(topic, catalogue);
  }

  console.log('\n=== Done! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
