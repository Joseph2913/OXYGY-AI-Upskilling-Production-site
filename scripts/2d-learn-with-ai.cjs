require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OpenRouter_API;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';
const CHUNK_SIZE = 1000;
const CONCURRENCY = 7;
const dataDir = path.join(__dirname, '..', 'data');

const topic = {
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
};

async function callLLM(prompt) {
  const response = await axios.post(OPENROUTER_URL, {
    model: MODEL, max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 120000,
  });
  return response.data.choices[0].message.content.trim();
}

function formatDuration(s) {
  if (!s) return '0:00';
  const m = Math.floor(s / 60); const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(path.join(dataDir, 'channel-catalogue-all-l1.json'), 'utf8'));
  console.log(`Scanning ALL ${catalogue.length} videos for: ${topic.topicTitle}`);

  const objectivesList = topic.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
  const totalChunks = Math.ceil(catalogue.length / CHUNK_SIZE);
  const chunks = [];
  for (let c = 0; c < totalChunks; c++) {
    chunks.push({ videos: catalogue.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE), offset: c * CHUNK_SIZE });
  }

  console.log(`Firing ${totalChunks} chunks with ${CONCURRENCY} parallel agents...`);

  const allPicks = [];
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const wave = chunks.slice(i, i + CONCURRENCY);
    const waveResults = await Promise.all(wave.map(async (chunk, j) => {
      const idx = i + j;
      const videoList = chunk.videos.map((v, vi) => {
        return `[${chunk.offset + vi}] "${v.title}" — ${v.channelName} (Tier ${v.channelTier}, ${formatDuration(v.durationSeconds)}, ${(v.viewCount || 0).toLocaleString()} views)`;
      }).join('\n');

      const prompt = `You are a content curator for Oxygy, an AI upskilling platform.

TOPIC: ${topic.topicTitle}
Subtitle: ${topic.topicSubtitle}
Description: ${topic.topicDescription}
Learning objectives:
${objectivesList}

AUDIENCE: Level 1 — Beginners, professional knowledge workers new to AI. No coding required.

Below are ${chunk.videos.length} YouTube videos. Find the BEST videos for teaching this topic. Look for videos about:
- Using AI as a learning tool or tutor
- How to learn new skills with AI help
- AI-assisted education and upskilling
- Meta-learning, learning strategies, study techniques with AI
- How to get better at using AI over time
- Building AI habits, AI literacy, becoming AI-native

Return your TOP 10 picks, ranked best first. If fewer than 10 are relevant, return fewer.

VIDEO LIST:
${videoList}

Respond ONLY with a JSON array:
[{"index": 0, "relevanceScore": 0.85, "learningMethodType": "tutorial", "rationale": "One sentence."}]
If nothing relevant: []`;

      try {
        const raw = await callLLM(prompt);
        const match = raw.match(/\[[\s\S]*?\]/);
        if (match) {
          const results = JSON.parse(match[0]);
          console.log(`  Chunk ${idx + 1}/${totalChunks} ✓ ${results.length} picks`);
          return results.map(r => ({
            ...chunk.videos[r.index - chunk.offset] || chunk.videos[r.index],
            relevanceScore: r.relevanceScore, learningMethodType: r.learningMethodType,
            relevanceRationale: r.rationale, topicAlignment: 0, teachingQuality: 0, audienceFit: 0,
          })).filter(v => v && v.title);
        }
        console.warn(`  Chunk ${idx + 1}/${totalChunks} ✗ parse error`);
        return [];
      } catch (err) {
        console.error(`  Chunk ${idx + 1}/${totalChunks} ✗ ${err.message}`);
        return [];
      }
    }));
    for (const picks of waveResults) allPicks.push(...picks);
  }

  allPicks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const top10 = allPicks.slice(0, 10);
  fs.writeFileSync(path.join(dataDir, 'scores-1-5.json'), JSON.stringify(top10, null, 2));

  console.log(`\n→ ${allPicks.length} total picks, top 10 saved`);
  for (let i = 0; i < top10.length; i++) {
    const v = top10[i];
    console.log(`  ${i+1}. [${v.relevanceScore.toFixed(2)}] ${v.title.substring(0, 65)}`);
    console.log(`     ${v.channelName} | ${formatDuration(v.durationSeconds)}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
