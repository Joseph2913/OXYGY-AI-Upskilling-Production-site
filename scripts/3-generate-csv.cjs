const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const dataDir = path.join(__dirname, '..', 'data');
const outputDir = path.join(__dirname, '..', 'output');
fs.mkdirSync(outputDir, { recursive: true });

const TOPICS = [
  { level: 1, topicId: "1-1", topicTitle: "Prompt Engineering" },
  { level: 2, topicId: "2-1", topicTitle: "From Prompts to Reusable Tools" },
  { level: 3, topicId: "3-1", topicTitle: "Mapping AI Workflows" },
  { level: 4, topicId: "4-1", topicTitle: "Designing Interactive Dashboards" },
  { level: 5, topicId: "5-1", topicTitle: "Building Full-Stack AI Applications" },
];

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function main() {
  console.log('=== Stage 3: Generating Review CSV ===\n');

  const allRows = [];

  for (const topic of TOPICS) {
    const scoresFile = path.join(dataDir, `scores-${topic.topicId}.json`);
    if (!fs.existsSync(scoresFile)) {
      console.warn(`Missing scores-${topic.topicId}.json — skipping`);
      continue;
    }

    const scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));

    // Filter: relevanceScore >= 0.5
    const qualifying = scores.filter(v => v.relevanceScore >= 0.5);

    // Sort by relevanceScore descending
    qualifying.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Cap at top 15
    const top = qualifying.slice(0, 15);

    console.log(`Topic ${topic.topicId} (${topic.topicTitle}): ${scores.length} total → ${qualifying.length} qualifying → ${top.length} included`);

    for (const v of top) {
      allRows.push({
        level: topic.level,
        topic_id: topic.topicId,
        topic_name: topic.topicTitle,
        youtube_video_id: v.videoId || '',
        title: v.title || '',
        channel_name: v.channelName || '',
        channel_tier: v.channelTier || '',
        duration_seconds: v.durationSeconds || 0,
        duration_formatted: formatDuration(v.durationSeconds),
        url: v.url || '',
        thumbnail_url: v.thumbnailUrl || '',
        published_at: v.publishedAt || '',
        view_count: v.viewCount || 0,
        relevance_score: Number(v.relevanceScore || 0).toFixed(2),
        topic_alignment: Number(v.topicAlignment || 0).toFixed(2),
        teaching_quality: Number(v.teachingQuality || 0).toFixed(2),
        audience_fit: Number(v.audienceFit || 0).toFixed(2),
        learning_method_type: v.learningMethodType || '',
        relevance_rationale: v.relevanceRationale || '',
        approved: '',
        relevance_note: '',
      });
    }
  }

  const csvPath = path.join(outputDir, 'oxygy-video-catalogue-review.csv');

  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'level', title: 'level' },
      { id: 'topic_id', title: 'topic_id' },
      { id: 'topic_name', title: 'topic_name' },
      { id: 'youtube_video_id', title: 'youtube_video_id' },
      { id: 'title', title: 'title' },
      { id: 'channel_name', title: 'channel_name' },
      { id: 'channel_tier', title: 'channel_tier' },
      { id: 'duration_seconds', title: 'duration_seconds' },
      { id: 'duration_formatted', title: 'duration_formatted' },
      { id: 'url', title: 'url' },
      { id: 'thumbnail_url', title: 'thumbnail_url' },
      { id: 'published_at', title: 'published_at' },
      { id: 'view_count', title: 'view_count' },
      { id: 'relevance_score', title: 'relevance_score' },
      { id: 'topic_alignment', title: 'topic_alignment' },
      { id: 'teaching_quality', title: 'teaching_quality' },
      { id: 'audience_fit', title: 'audience_fit' },
      { id: 'learning_method_type', title: 'learning_method_type' },
      { id: 'relevance_rationale', title: 'relevance_rationale' },
      { id: 'approved', title: 'approved' },
      { id: 'relevance_note', title: 'relevance_note' },
    ],
  });

  await csvWriter.writeRecords(allRows);
  console.log(`\n=== Done! ${allRows.length} rows written to output/oxygy-video-catalogue-review.csv ===`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
