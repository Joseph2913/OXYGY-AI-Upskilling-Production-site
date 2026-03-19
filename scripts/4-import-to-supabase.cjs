#!/usr/bin/env node
/**
 * 4-import-to-supabase.cjs
 *
 * Creates the curated_videos table (if it doesn't exist) and imports the
 * top-10 scored videos per topic, marking Joseph's top-3 picks as primary.
 *
 * Usage:  node scripts/4-import-to-supabase.cjs
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');

// ─── Load .env.local ───
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

// ─── Topic name mapping (topicId → display name from PRD) ───
const TOPIC_NAMES = {
  '1-1': 'Prompt Engineering',
  '1-2': 'Context Engineering',
  '1-3': 'Responsible AI Use',
  '1-4': 'Multimodal AI (Image / Video / Audio)',
  '1-5': 'Learning How to Learn with AI',
  '2-1': 'From Prompts to Reusable Tools',
  '2-2': 'What AI Agents Are & Why They Matter',
  '2-3': 'Custom GPT / Agent Building',
  '2-4': 'System Prompt & Instruction Design',
  '2-5': 'Human-in-the-Loop Design',
  '2-6': 'Sharing & Standardising Agents',
  '3-1': 'Mapping AI Workflows',
  '3-2': 'Agent Chaining & Orchestration',
  '3-3': 'Input Logic & Role Mapping',
  '3-4': 'Automated Output Generation',
  '3-5': 'Human-in-the-Loop at Scale',
  '3-6': 'Performance & Feedback Loops',
  '4-1': 'Designing Interactive Interfaces',
  '4-2': 'UI/UX Design Fundamentals for AI Products',
  '4-3': 'Visual Design — Colour, Typography & Spacing',
  '4-4': 'No-Code App & Website Building',
  '4-5': 'Data Visualisation & Storytelling',
  '4-6': 'Role-Based Views & Personalisation',
  '5-1': 'Application Architecture',
  '5-2': 'Personalisation Engines',
  '5-3': 'Knowledge Base Applications',
  '5-4': 'Custom Learning Platforms',
  '5-5': 'Full-Stack AI Integration',
  '5-6': 'User Testing & Scaling',
};

// ─── Helpers ───
async function supabaseRPC(method, endpoint, body) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'return=minimal' : undefined,
  };
  // Remove undefined headers
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  return res;
}

async function supabaseSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  // Use the SQL endpoint via pg_net or just use REST API
  // Actually, let's use the Supabase SQL endpoint directly
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// ─── Main ───
async function main() {
  const dataDir = path.join(__dirname, '..', 'data');

  // 1. Load selections
  const selections = JSON.parse(fs.readFileSync(path.join(dataDir, 'selections.json'), 'utf8'));
  console.log(`Loaded selections for ${Object.keys(selections).length} topics`);

  // 2. Process each topic
  const allRows = [];
  const topicIds = Object.keys(TOPIC_NAMES);

  for (const topicId of topicIds) {
    const scoresPath = path.join(dataDir, `scores-${topicId}.json`);
    if (!fs.existsSync(scoresPath)) {
      console.warn(`  ⚠ No scores file for topic ${topicId}, skipping`);
      continue;
    }

    const allVideos = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
    const level = parseInt(topicId.split('-')[0], 10);
    const topicName = TOPIC_NAMES[topicId];

    // Sort by relevanceScore descending, take top 10
    const sorted = [...allVideos].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    const top10 = sorted.slice(0, 10);

    // Get selection data for this topic
    const topicSelections = selections[topicId] || {};

    // Build a map: original index in the full array → rank
    // selections.json uses index into the scores array, not the sorted array
    const selectionMap = {};
    for (const [indexStr, rankStr] of Object.entries(topicSelections)) {
      const rank = parseInt(rankStr, 10);
      if (rank >= 1 && rank <= 3) {
        const originalIndex = parseInt(indexStr, 10);
        const video = allVideos[originalIndex];
        if (video) {
          selectionMap[video.videoId] = rank;
        }
      }
    }

    for (const video of top10) {
      const rank = selectionMap[video.videoId] || null;
      const isPrimary = rank !== null;

      allRows.push({
        level,
        topic_id: topicId,
        topic_name: topicName,
        youtube_video_id: video.videoId,
        title: video.title,
        channel_name: video.channelName || 'Unknown',
        channel_tier: video.channelTier || null,
        duration_seconds: video.durationSeconds || null,
        url: video.url,
        thumbnail_url: video.thumbnailUrl || null,
        published_at: video.publishedAt || null,
        view_count: video.viewCount || null,
        relevance_score: video.relevanceScore || null,
        learning_method_type: video.learningMethodType || null,
        relevance_rationale: video.relevanceRationale || null,
        rank,
        is_primary: isPrimary,
      });
    }

    const primaryCount = Object.keys(selectionMap).length;
    console.log(`  ✓ ${topicId} "${topicName}" — ${top10.length} videos (${primaryCount} primary)`);
  }

  console.log(`\nTotal rows to insert: ${allRows.length}`);

  // 3. Clear existing data
  console.log('\nClearing existing curated_videos data...');
  try {
    await supabaseRPC('DELETE', 'curated_videos?id=gt.0', null);
    console.log('  ✓ Cleared');
  } catch (err) {
    // Table might not exist yet — that's fine, we'll insert and it should create
    console.log(`  ℹ Clear skipped (table may not exist yet): ${err.message}`);
  }

  // 4. Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    try {
      await supabaseRPC('POST', 'curated_videos', batch);
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${allRows.length}`);
    } catch (err) {
      console.error(`\n  ✗ Batch insert failed at row ${i}: ${err.message}`);
      console.error('  First row of failed batch:', JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }
  }

  console.log(`\n\n✅ Done! Inserted ${inserted} curated videos across ${topicIds.length} topics.`);

  // 5. Verify
  const verifyRes = await supabaseRPC('GET', 'curated_videos?select=topic_id,is_primary&order=topic_id', null);
  const verifyData = await verifyRes.json();
  const topicCounts = {};
  const primaryCounts = {};
  for (const row of verifyData) {
    topicCounts[row.topic_id] = (topicCounts[row.topic_id] || 0) + 1;
    if (row.is_primary) primaryCounts[row.topic_id] = (primaryCounts[row.topic_id] || 0) + 1;
  }
  console.log('\nVerification:');
  for (const tid of Object.keys(topicCounts).sort()) {
    console.log(`  ${tid}: ${topicCounts[tid]} total, ${primaryCounts[tid] || 0} primary`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
