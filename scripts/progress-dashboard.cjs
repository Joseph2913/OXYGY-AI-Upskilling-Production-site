const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3456;
const dataDir = path.join(__dirname, '..', 'data');
const selectionsFile = path.join(dataDir, 'selections.json');

const TOPICS = [
  { topicId: '1-1', level: 1, topicTitle: 'Prompt Engineering' },
  { topicId: '1-2', level: 1, topicTitle: 'Context Engineering' },
  { topicId: '1-3', level: 1, topicTitle: 'Responsible AI Use' },
  { topicId: '1-4', level: 1, topicTitle: 'Multimodal AI (Image / Video / Audio)' },
  { topicId: '1-5', level: 1, topicTitle: 'Learning How to Learn with AI' },
  { topicId: '2-1', level: 2, topicTitle: 'From Prompts to Reusable Tools' },
  { topicId: '2-2', level: 2, topicTitle: 'What AI Agents Are & Why They Matter' },
  { topicId: '2-3', level: 2, topicTitle: 'Custom GPT / Agent Building' },
  { topicId: '2-4', level: 2, topicTitle: 'System Prompt & Instruction Design' },
  { topicId: '2-5', level: 2, topicTitle: 'Human-in-the-Loop Design' },
  { topicId: '2-6', level: 2, topicTitle: 'Sharing & Standardising Agents' },
  { topicId: '3-1', level: 3, topicTitle: 'Mapping AI Workflows' },
  { topicId: '3-2', level: 3, topicTitle: 'Agent Chaining & Orchestration' },
  { topicId: '3-3', level: 3, topicTitle: 'Input Logic & Role Mapping' },
  { topicId: '3-4', level: 3, topicTitle: 'Automated Output Generation' },
  { topicId: '3-5', level: 3, topicTitle: 'Human-in-the-Loop at Scale' },
  { topicId: '3-6', level: 3, topicTitle: 'Performance & Feedback Loops' },
  { topicId: '4-1', level: 4, topicTitle: 'Designing Interactive Interfaces' },
  { topicId: '4-2', level: 4, topicTitle: 'UI/UX Design Fundamentals for AI Products' },
  { topicId: '4-3', level: 4, topicTitle: 'Visual Design — Colour, Typography & Spacing' },
  { topicId: '4-4', level: 4, topicTitle: 'No-Code App & Website Building' },
  { topicId: '4-5', level: 4, topicTitle: 'Data Visualisation & Storytelling' },
  { topicId: '4-6', level: 4, topicTitle: 'Role-Based Views & Personalisation' },
  { topicId: '5-1', level: 5, topicTitle: 'Application Architecture' },
  { topicId: '5-2', level: 5, topicTitle: 'Personalisation Engines' },
  { topicId: '5-3', level: 5, topicTitle: 'Knowledge Base Applications' },
  { topicId: '5-4', level: 5, topicTitle: 'Custom Learning Platforms' },
  { topicId: '5-5', level: 5, topicTitle: 'Full-Stack AI Integration' },
  { topicId: '5-6', level: 5, topicTitle: 'User Testing & Scaling' },
];

const LEVEL_COLORS = {
  1: '#38B2AC',
  2: '#4299E1',
  3: '#9F7AEA',
  4: '#ED8936',
  5: '#E53E3E',
};

function loadSelections() {
  if (fs.existsSync(selectionsFile)) {
    return JSON.parse(fs.readFileSync(selectionsFile, 'utf8'));
  }
  return {};
}

function saveSelections(selections) {
  fs.writeFileSync(selectionsFile, JSON.stringify(selections, null, 2));
}

function getTopicStatus(topicId) {
  const scoresFile = path.join(dataDir, `scores-${topicId}.json`);
  const pass1File = path.join(dataDir, `pass1-${topicId}.json`);

  if (fs.existsSync(scoresFile)) {
    const scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
    const qualifying = scores.filter(v => v.relevanceScore >= 0.5);
    qualifying.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return {
      status: 'complete',
      totalScored: scores.length,
      qualifying: qualifying.length,
      topVideos: qualifying.slice(0, 15).map((v, i) => ({
        index: i,
        videoId: v.videoId || '',
        title: v.title,
        channel: v.channelName,
        tier: v.channelTier,
        score: v.relevanceScore,
        topicAlignment: v.topicAlignment,
        teachingQuality: v.teachingQuality,
        audienceFit: v.audienceFit,
        method: v.learningMethodType,
        rationale: v.relevanceRationale,
        duration: v.durationSeconds,
        url: v.url,
        views: v.viewCount,
      })),
    };
  } else if (fs.existsSync(pass1File)) {
    const candidates = JSON.parse(fs.readFileSync(pass1File, 'utf8'));
    return { status: 'pass2_in_progress', candidates: candidates.length };
  } else {
    return { status: 'pending' };
  }
}

function formatDuration(s) {
  if (!s) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function buildHTML() {
  const selections = loadSelections();
  const topicData = TOPICS.map(t => {
    const topicSel = selections[t.topicId] || {};
    const ranks = Object.values(topicSel).filter(r => r !== '');
    const _picksComplete = ranks.includes('1') && ranks.includes('2') && ranks.includes('3');
    return { ...t, color: LEVEL_COLORS[t.level], ...getTopicStatus(t.topicId), _picksComplete };
  });

  // Separate topics into needs-input vs done
  const needsInput = [];
  const allDone = [];
  for (const t of topicData) {
    const topicSel = selections[t.topicId] || {};
    const ranks = Object.values(topicSel).filter(r => r !== '');
    const has1 = ranks.includes('1'), has2 = ranks.includes('2'), has3 = ranks.includes('3');
    const picksComplete = has1 && has2 && has3;
    if (picksComplete) { allDone.push(t); } else { needsInput.push(t); }
  }

  const topicCards = topicData.map(t => {
    let statusBadge, content;
    const topicSelections = selections[t.topicId] || {};
    const ranks = Object.values(topicSelections).filter(r => r !== '');
    const picksComplete = ranks.includes('1') && ranks.includes('2') && ranks.includes('3');

    if (t.status === 'complete') {
      statusBadge = picksComplete
        ? `<span style="background:#C6F6D5;color:#276749;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">PICKS DONE</span>`
        : `<span style="background:#FED7D7;color:#9B2C2C;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">NEEDS PICKS</span>`;

      const videoRows = t.topVideos.map((v, i) => {
        const currentRank = topicSelections[i] || '';
        const isRanked = currentRank !== '';
        const rankBg = currentRank === '1' ? '#FFD700' : currentRank === '2' ? '#C0C0C0' : currentRank === '3' ? '#CD7F32' : 'transparent';
        const rowBg = isRanked ? (currentRank === '1' ? '#FFFFF0' : currentRank === '2' ? '#F7FAFC' : currentRank === '3' ? '#FFFAF0' : 'white') : 'white';

        return `
        <tr style="border-bottom:1px solid #EDF2F7;background:${rowBg}">
          <td style="padding:8px 6px;text-align:center;width:60px">
            <select onchange="setRank('${t.topicId}', ${i}, this.value)" style="width:50px;padding:4px;border:1px solid ${isRanked ? rankBg : '#E2E8F0'};border-radius:6px;font-size:13px;font-weight:${isRanked ? '700' : '400'};background:${isRanked ? rankBg + '33' : 'white'};cursor:pointer;text-align:center">
              <option value="" ${currentRank === '' ? 'selected' : ''}>—</option>
              <option value="1" ${currentRank === '1' ? 'selected' : ''}>1st</option>
              <option value="2" ${currentRank === '2' ? 'selected' : ''}>2nd</option>
              <option value="3" ${currentRank === '3' ? 'selected' : ''}>3rd</option>
            </select>
          </td>
          <td style="padding:8px 6px;color:#718096;font-size:13px;text-align:center;width:30px">${i + 1}</td>
          <td style="padding:8px 6px">
            <a href="${v.url}" target="_blank" style="color:#2D3748;text-decoration:none;font-size:13px;font-weight:500">${v.title.length > 60 ? v.title.substring(0, 60) + '…' : v.title}</a>
            <div style="color:#A0AEC0;font-size:11px;margin-top:2px">${v.channel} · Tier ${v.tier} · ${(v.views || 0).toLocaleString()} views</div>
          </td>
          <td style="padding:8px 6px;text-align:center;font-size:13px;color:#4A5568;font-weight:500;white-space:nowrap">${formatDuration(v.duration)}</td>
          <td style="padding:8px 6px;text-align:center">
            <div style="background:${v.score >= 0.8 ? '#C6F6D5' : v.score >= 0.6 ? '#FEFCBF' : '#FED7D7'};color:${v.score >= 0.8 ? '#276749' : v.score >= 0.6 ? '#975A16' : '#9B2C2C'};padding:3px 8px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block">${v.score.toFixed(2)}</div>
          </td>
          <td style="padding:8px 6px;font-size:11px;color:#718096;text-align:center">${v.topicAlignment?.toFixed(2) || '-'}</td>
          <td style="padding:8px 6px;font-size:11px;color:#718096;text-align:center">${v.teachingQuality?.toFixed(2) || '-'}</td>
          <td style="padding:8px 6px;font-size:11px;color:#718096;text-align:center">${v.audienceFit?.toFixed(2) || '-'}</td>
          <td style="padding:8px 6px;text-align:center"><span style="background:#EDF2F7;padding:2px 8px;border-radius:8px;font-size:11px;color:#4A5568">${v.method || '-'}</span></td>
          <td style="padding:8px 6px;font-size:11px;color:#A0AEC0;max-width:180px">${v.rationale || ''}</td>
        </tr>`;
      }).join('');

      // Show current picks summary
      const picks = Object.entries(topicSelections)
        .filter(([_, rank]) => rank !== '')
        .sort(([_, a], [__, b]) => Number(a) - Number(b))
        .map(([idx, rank]) => {
          const v = t.topVideos[Number(idx)];
          if (!v) return '';
          const medal = rank === '1' ? '🥇' : rank === '2' ? '🥈' : '🥉';
          return `<span style="display:inline-flex;align-items:center;gap:4px;background:#F7FAFC;border:1px solid #E2E8F0;padding:4px 10px;border-radius:8px;font-size:12px">${medal} ${v.title.substring(0, 40)}${v.title.length > 40 ? '…' : ''}</span>`;
        }).filter(Boolean);

      const picksHTML = picks.length > 0
        ? `<div style="margin:12px 0;display:flex;flex-wrap:wrap;gap:8px">${picks.join('')}</div>`
        : `<div style="margin:12px 0;color:#A0AEC0;font-size:13px">No picks yet — use the dropdowns below to select your top 3</div>`;

      // If all 3 picks done, show collapsed view
      if (picksComplete) {
        content = `
          <div style="padding:4px 0">
            ${picksHTML}
          </div>`;
      } else {
      content = `
        <div style="display:flex;gap:20px;margin:12px 0">
          <div style="background:#F7FAFC;padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#2D3748">${t.totalScored}</div>
            <div style="font-size:11px;color:#A0AEC0">Pass 1 Candidates</div>
          </div>
          <div style="background:#F7FAFC;padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:${t.color}">${t.qualifying}</div>
            <div style="font-size:11px;color:#A0AEC0">Score >= 0.5</div>
          </div>
          <div style="background:#F7FAFC;padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#2D3748">${Math.min(t.qualifying, 15)}</div>
            <div style="font-size:11px;color:#A0AEC0">Shown Below</div>
          </div>
        </div>
        <div style="font-weight:600;font-size:13px;color:#2D3748;margin-top:16px">Your Top 3 Picks:</div>
        ${picksHTML}
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <thead>
            <tr style="border-bottom:2px solid #E2E8F0">
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:60px">Pick</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:30px">#</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:left">Video</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:60px">Duration</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:60px">Score</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:50px">Topic</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:50px">Teach</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:50px">Fit</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:80px">Method</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:left">Rationale</th>
            </tr>
          </thead>
          <tbody>${videoRows}</tbody>
        </table>`;
      } // end else (not picksComplete)
    } else if (t.status === 'pass2_in_progress') {
      statusBadge = `<span style="background:#FEFCBF;color:#975A16;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">SCORING (Pass 2)</span>`;
      content = `<div style="padding:20px;color:#718096;font-size:14px">${t.candidates} candidates from Pass 1 — Claude Sonnet is scoring them now…</div>`;
    } else {
      statusBadge = `<span style="background:#EDF2F7;color:#718096;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">PENDING</span>`;
      content = `<div style="padding:20px;color:#A0AEC0;font-size:14px">Waiting for earlier topics to complete</div>`;
    }

    return `
      <div style="background:white;border-radius:12px;border:1px solid #E2E8F0;margin-bottom:20px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="background:${t.color};color:white;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">L${t.level}</div>
            <div>
              <div style="font-weight:600;color:#1A202C;font-size:15px">${t.topicTitle}</div>
              <div style="color:#A0AEC0;font-size:12px">Topic ${t.topicId}</div>
            </div>
          </div>
          ${statusBadge}
        </div>
        <div style="padding:16px 20px">${content}</div>
      </div>`;
  });

  const pendingCards = topicCards.filter((_, i) => !topicData[i]._picksComplete).join('');
  const doneCards = topicCards.filter((_, i) => topicData[i]._picksComplete).join('');

  const completedCount = topicData.filter(t => t.status === 'complete').length;
  const totalQualifying = topicData.reduce((sum, t) => sum + (t.qualifying || 0), 0);
  const totalPicks = Object.values(selections).reduce((sum, t) => sum + Object.values(t).filter(v => v !== '').length, 0);

  return `<!DOCTYPE html>
<html>
<head>
  <title>Oxygy Video Curation — Progress Dashboard</title>
  <meta id="auto-refresh" http-equiv="refresh" content="10">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F7FAFC; color: #1A202C; }
    select:hover { border-color: #A0AEC0 !important; }
  </style>
</head>
<body>
  <div style="max-width:1300px;margin:0 auto;padding:24px 32px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <div>
        <h1 style="font-size:22px;font-weight:700;color:#1A202C">Video Curation Pipeline</h1>
        <p style="color:#A0AEC0;font-size:13px;margin-top:4px">Auto-refreshes every 10s · Picks are saved instantly</p>
      </div>
      <div style="display:flex;gap:16px">
        <div style="background:white;border:1px solid #E2E8F0;padding:10px 16px;border-radius:8px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#38B2AC">${completedCount}/5</div>
          <div style="font-size:11px;color:#A0AEC0">Topics Done</div>
        </div>
        <div style="background:white;border:1px solid #E2E8F0;padding:10px 16px;border-radius:8px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#1A202C">${totalQualifying}</div>
          <div style="font-size:11px;color:#A0AEC0">Videos >= 0.5</div>
        </div>
        <div style="background:white;border:1px solid #E2E8F0;padding:10px 16px;border-radius:8px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#ED8936">${totalPicks}/15</div>
          <div style="font-size:11px;color:#A0AEC0">Picks Made</div>
        </div>
      </div>
    </div>
    <h2 style="font-size:16px;font-weight:600;color:#9B2C2C;margin-bottom:12px">Needs Your Input (${needsInput.length})</h2>
    ${pendingCards}
    <h2 style="font-size:16px;font-weight:600;color:#276749;margin:24px 0 12px">Completed (${allDone.length})</h2>
    ${doneCards}
  </div>
  <script>
    function setRank(topicId, videoIndex, rank) {
      // Pause auto-refresh while user is interacting
      document.getElementById('auto-refresh')?.remove();

      fetch('/api/select?topicId=' + topicId + '&videoIndex=' + videoIndex + '&rank=' + rank)
        .then(() => {
          window.location.reload();
        });
    }
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/api/select') {
    const { topicId, videoIndex, rank } = parsed.query;
    const selections = loadSelections();

    if (!selections[topicId]) selections[topicId] = {};

    // If assigning a rank, clear it from any other video in same topic first
    if (rank && rank !== '') {
      for (const [idx, r] of Object.entries(selections[topicId])) {
        if (r === rank) {
          selections[topicId][idx] = '';
        }
      }
    }

    selections[topicId][videoIndex] = rank || '';
    saveSelections(selections);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(buildHTML());
});

server.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
  console.log('Auto-refreshes every 10 seconds. Picks saved to data/selections.json');
});
