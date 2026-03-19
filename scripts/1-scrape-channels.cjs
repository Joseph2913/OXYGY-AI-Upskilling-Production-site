require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const APIFY_TOKEN = process.env.Apify_key || process.env.APIFY_API_TOKEN;
if (!APIFY_TOKEN) {
  console.error('Missing Apify API token. Set Apify_key or APIFY_API_TOKEN in .env.local');
  process.exit(1);
}

const CHANNELS = [
  { channelName: "Jeff Su", channelUrl: "https://www.youtube.com/@JeffSu", levels: [1], tier: 1 },
  { channelName: "Kevin Stratvert", channelUrl: "https://www.youtube.com/@KevinStratvert", levels: [1, 2, 3], tier: 1 },
  { channelName: "Matthew Berman", channelUrl: "https://www.youtube.com/@matthew_berman", levels: [1, 2], tier: 1 },
  { channelName: "IBM Technology", channelUrl: "https://www.youtube.com/@IBMTechnology", levels: [1, 2, 3], tier: 1 },
  { channelName: "Anthropic", channelUrl: "https://www.youtube.com/@anthropic-ai", levels: [1, 2], tier: 1 },
  { channelName: "OpenAI", channelUrl: "https://www.youtube.com/@OpenAI", levels: [1, 2], tier: 1 },
  { channelName: "Google for Developers", channelUrl: "https://www.youtube.com/@GoogleDevelopers", levels: [1, 2, 5], tier: 1 },
  { channelName: "David Ondrej", channelUrl: "https://www.youtube.com/@DavidOndrej", levels: [1, 2], tier: 2 },
  { channelName: "Grace Leung", channelUrl: "https://www.youtube.com/@GraceLeung_", levels: [1, 2], tier: 2 },
  { channelName: "Tina Huang", channelUrl: "https://www.youtube.com/@TinaHuang1", levels: [1, 2], tier: 2 },
  { channelName: "3Blue1Brown", channelUrl: "https://www.youtube.com/@3blue1brown", levels: [1], tier: 2 },
  { channelName: "Shaw Talebi", channelUrl: "https://www.youtube.com/@ShawhinTalebi", levels: [1, 2], tier: 2 },
  { channelName: "Fireship", channelUrl: "https://www.youtube.com/@Fireship", levels: [1, 3], tier: 2 },
  { channelName: "Aurelius Tjin", channelUrl: "https://www.youtube.com/@AureliusTjin", levels: [1, 3], tier: 2 },
  { channelName: "Synthesia", channelUrl: "https://www.youtube.com/@Synthesia-io", levels: [1], tier: 3 },
  { channelName: "ElevenLabs", channelUrl: "https://www.youtube.com/@elevenlabsio", levels: [1], tier: 3 },
  { channelName: "Google DeepMind", channelUrl: "https://www.youtube.com/@GoogleDeepMind", levels: [1], tier: 3 },
  { channelName: "Dylan Davis", channelUrl: "https://www.youtube.com/@DylanDavisAI", levels: [1, 2], tier: 3 },
  { channelName: "Skill Leap AI", channelUrl: "https://www.youtube.com/@SkillLeapAI", levels: [1], tier: 3 },
  { channelName: "Wes Roth", channelUrl: "https://www.youtube.com/@WesRoth", levels: [1], tier: 4 },
  { channelName: "ColdFusion", channelUrl: "https://www.youtube.com/@ColdFusion", levels: [1], tier: 4 },
  { channelName: "Varun Mayya", channelUrl: "https://www.youtube.com/@VarunMayya", levels: [1, 2], tier: 4 },
  { channelName: "Dwarkesh Patel", channelUrl: "https://www.youtube.com/@DwarkeshPatel", levels: [1], tier: 4 },
  { channelName: "Lex Fridman", channelUrl: "https://www.youtube.com/@lexfridman", levels: [1], tier: 4 },
  { channelName: "The AI Daily Brief", channelUrl: "https://www.youtube.com/@TheAIDailyBrief", levels: [1, 3], tier: 4 },
  { channelName: "SXSW", channelUrl: "https://www.youtube.com/@sxsw", levels: [1], tier: 4 },
  { channelName: "Nate Herk", channelUrl: "https://www.youtube.com/@nateherk", levels: [2, 3], tier: 1 },
  { channelName: "Cole Medin", channelUrl: "https://www.youtube.com/@ColeMedin", levels: [2, 3], tier: 1 },
  { channelName: "The AI Automators", channelUrl: "https://www.youtube.com/@theaiautomators", levels: [2, 3], tier: 2 },
  { channelName: "AI Engineer", channelUrl: "https://www.youtube.com/@aiDotEngineer", levels: [2, 3, 5], tier: 2 },
  { channelName: "AI Jason", channelUrl: "https://www.youtube.com/@AIJasonZ", levels: [2, 3], tier: 2 },
  { channelName: "Liam Ottley", channelUrl: "https://www.youtube.com/@LiamOttley", levels: [2], tier: 2 },
  { channelName: "Chase AI", channelUrl: "https://www.youtube.com/@chaseai", levels: [2, 3, 5], tier: 2 },
  { channelName: "Mark Kashef", channelUrl: "https://www.youtube.com/@MarkKashef", levels: [2, 3], tier: 3 },
  { channelName: "Sam Witteveen", channelUrl: "https://www.youtube.com/@SamWitteveenAI", levels: [2], tier: 3 },
  { channelName: "Microsoft Community Learning", channelUrl: "https://www.youtube.com/@MicrosoftCommunityLearning", levels: [2, 4], tier: 3 },
  { channelName: "MindStudio", channelUrl: "https://www.youtube.com/@MindStudioAI", levels: [2, 5], tier: 3 },
  { channelName: "Dewain Robinson", channelUrl: "https://www.youtube.com/@CopilotStudioDude", levels: [2], tier: 3 },
  { channelName: "n8n", channelUrl: "https://www.youtube.com/@n8n-io", levels: [3], tier: 1 },
  { channelName: "Leon van Zyl", channelUrl: "https://www.youtube.com/@leonvanzyl", levels: [3], tier: 2 },
  { channelName: "Nick Saraev", channelUrl: "https://www.youtube.com/@nicksaraev", levels: [3], tier: 2 },
  { channelName: "Bart Slodyczka", channelUrl: "https://www.youtube.com/@BartSlodyczka", levels: [3], tier: 3 },
  { channelName: "Jono Catliff", channelUrl: "https://www.youtube.com/@JonoCatliff", levels: [3], tier: 3 },
  { channelName: "Sequoia Capital", channelUrl: "https://www.youtube.com/@sequoiacapital", levels: [3, 5], tier: 4 },
  { channelName: "Christian Peverelli - WeAreNoCode", channelUrl: "https://www.youtube.com/@WeAreNoCode", levels: [4, 5], tier: 2 },
  { channelName: "Glide", channelUrl: "https://www.youtube.com/@GlideApps", levels: [4, 5], tier: 3 },
  { channelName: "How to Power BI", channelUrl: "https://www.youtube.com/@HowtoPowerBI", levels: [4], tier: 3 },
  { channelName: "Y Combinator", channelUrl: "https://www.youtube.com/@ycombinator", levels: [5], tier: 4 },
  { channelName: "Greg Isenberg", channelUrl: "https://www.youtube.com/@GregIsenberg", levels: [5], tier: 4 },
  { channelName: "Lenny's Podcast", channelUrl: "https://www.youtube.com/@LennysPodcast", levels: [5], tier: 4 },
  { channelName: "a16z", channelUrl: "https://www.youtube.com/@a16z", levels: [5], tier: 4 },
];

// Two years ago from today (2026-03-18)
const DATE_CUTOFF = '2024-03-18';

const ACTOR_ID = 'streamers~youtube-channel-scraper';
const FALLBACK_ACTOR_ID = 'delicious_zebu~youtube-channel-video-scraper';

const logsDir = path.join(__dirname, '..', 'logs');
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

function appendLog(file, message) {
  fs.appendFileSync(path.join(logsDir, file), `${new Date().toISOString()} | ${message}\n`);
}

async function runActorAndWait(actorId, input) {
  // Start the actor run
  const startUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}`;
  const startRes = await axios.post(startUrl, input, {
    headers: { 'Content-Type': 'application/json' },
  });
  const runId = startRes.data.data.id;
  console.log(`  Actor run started: ${runId}`);

  // Poll until finished
  const statusUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`;
  let status = 'RUNNING';
  while (status === 'RUNNING' || status === 'READY') {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await axios.get(statusUrl);
    status = statusRes.data.data.status;
    process.stdout.write('.');
  }
  console.log(` ${status}`);

  if (status !== 'SUCCEEDED') {
    throw new Error(`Actor run ${runId} finished with status: ${status}`);
  }

  // Fetch dataset items
  const datasetId = startRes.data.data.defaultDatasetId;
  const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&clean=true`;
  const dataRes = await axios.get(datasetUrl);
  return dataRes.data;
}

async function scrapeChannel(channel, actorId) {
  console.log(`\nScraping: ${channel.channelName} (${channel.channelUrl})`);

  const input = {
    startUrls: [{ url: channel.channelUrl }],
    maxResults: 500,
  };

  try {
    const items = await runActorAndWait(actorId, input);

    // Filter: only videos (not shorts/live), must have title and url
    const videos = items
      .filter(item => {
        if (!item.title || !item.url) return false;
        // Parse relative date ("5 days ago", "2 months ago", etc.) to check cutoff
        const parsedDate = parseRelativeDate(item.date);
        if (parsedDate && parsedDate < new Date(DATE_CUTOFF)) return false;
        return true;
      })
      .map(item => ({
        videoId: item.id || extractVideoId(item.url),
        title: item.title,
        description: item.aboutChannelInfo?.channelDescription || '',
        url: item.url,
        thumbnailUrl: item.thumbnailUrl || '',
        durationSeconds: parseDuration(item.duration),
        publishedAt: item.date || '',
        viewCount: item.viewCount || 0,
        channelId: item.channelId || '',
        channelName: channel.channelName,
        channelTier: channel.tier,
        channelLevels: channel.levels,
      }));

    appendLog('scrape-summary.log', `${channel.channelName}: ${videos.length} videos (from ${items.length} raw)`);
    console.log(`  → ${videos.length} videos after filtering`);
    return videos;
  } catch (err) {
    const msg = `${channel.channelName}: ${err.message}`;
    appendLog('scrape-errors.log', msg);
    console.error(`  ERROR: ${err.message}`);
    return [];
  }
}

function parseRelativeDate(dateStr) {
  if (!dateStr) return null;
  // If it's already a parseable date, use it directly
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime()) && dateStr.includes('-')) return direct;

  // Parse relative dates like "5 days ago", "2 months ago", "1 year ago"
  const match = dateStr.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const now = new Date();

  switch (unit) {
    case 'second': return new Date(now - amount * 1000);
    case 'minute': return new Date(now - amount * 60 * 1000);
    case 'hour': return new Date(now - amount * 3600 * 1000);
    case 'day': return new Date(now - amount * 86400 * 1000);
    case 'week': return new Date(now - amount * 7 * 86400 * 1000);
    case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - amount); return d; }
    case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - amount); return d; }
    default: return null;
  }
}

function extractVideoId(url) {
  if (!url) return '';
  const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function parseDuration(dur) {
  if (typeof dur === 'number') return dur;
  if (!dur) return 0;
  // Handle "HH:MM:SS" or "MM:SS" format
  if (typeof dur === 'string' && dur.includes(':')) {
    const parts = dur.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  // Handle ISO 8601 duration like PT12M34S
  if (typeof dur === 'string') {
    const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      return (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0);
    }
  }
  return parseInt(dur) || 0;
}

async function main() {
  console.log('=== Stage 1: Scraping YouTube Channel Catalogues ===');
  console.log(`Date cutoff: ${DATE_CUTOFF}`);
  console.log(`Channels to scrape: ${CHANNELS.length}\n`);

  // Clear previous logs
  ['scrape-errors.log', 'scrape-summary.log'].forEach(f => {
    const p = path.join(logsDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // Check if we have existing data to resume from
  const outputPath = path.join(dataDir, 'channel-catalogue-raw.json');
  let allVideos = [];

  // Load existing catalogue and figure out which channels are already scraped
  const alreadyScraped = new Set();
  if (fs.existsSync(outputPath)) {
    allVideos = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    allVideos.forEach(v => alreadyScraped.add(v.channelName));
    console.log(`Loaded existing catalogue: ${allVideos.length} videos from ${alreadyScraped.size} channels`);
    console.log(`Channels already scraped: ${[...alreadyScraped].join(', ')}\n`);
  }

  const progressPath = path.join(dataDir, 'scrape-progress.json');
  if (fs.existsSync(progressPath)) {
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    allVideos = progress.videos;
    progress.videos.forEach(v => alreadyScraped.add(v.channelName));
    console.log(`Resuming from progress file (${allVideos.length} videos already scraped)`);
  }

  let actorId = ACTOR_ID;

  for (let i = 0; i < CHANNELS.length; i++) {
    const channel = CHANNELS[i];
    if (alreadyScraped.has(channel.channelName)) {
      console.log(`\nSkipping: ${channel.channelName} (already scraped)`);
      continue;
    }
    try {
      const videos = await scrapeChannel(channel, actorId);
      allVideos = allVideos.concat(videos);
    } catch (err) {
      // Try fallback actor on first failure
      if (actorId === ACTOR_ID) {
        console.log(`Primary actor failed, trying fallback: ${FALLBACK_ACTOR_ID}`);
        actorId = FALLBACK_ACTOR_ID;
        try {
          const videos = await scrapeChannel(channel, actorId);
          allVideos = allVideos.concat(videos);
        } catch (err2) {
          appendLog('scrape-errors.log', `${channel.channelName}: Fallback also failed: ${err2.message}`);
        }
      }
    }

    // Save progress after each channel
    fs.writeFileSync(progressPath, JSON.stringify({ nextIndex: i + 1, videos: allVideos }));
  }

  // Write final output
  fs.writeFileSync(outputPath, JSON.stringify(allVideos, null, 2));
  console.log(`\n=== Done! ${allVideos.length} total videos saved to data/channel-catalogue-raw.json ===`);

  // Clean up progress file
  if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);

  appendLog('scrape-summary.log', `TOTAL: ${allVideos.length} videos from ${CHANNELS.length} channels`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
