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
      topVideos: qualifying.slice(0, 30).map((v, i) => ({
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
    const statusData = getTopicStatus(t.topicId);

    // Check if any picked video is over 15 min
    let _pickedOver15 = 0;
    let _pickedMaxDur = 0;
    if (statusData.topVideos) {
      const pickedIndices = Object.entries(topicSel).filter(([_, r]) => r !== '').map(([idx]) => Number(idx));
      pickedIndices.forEach(idx => {
        const v = statusData.topVideos[idx];
        if (v && v.duration > 900) _pickedOver15++;
        if (v && v.duration > _pickedMaxDur) _pickedMaxDur = v.duration;
      });
    }

    return { ...t, color: LEVEL_COLORS[t.level], ...statusData, _picksComplete, _pickedOver15, _pickedMaxDur };
  });

  const needsInput = topicData.filter(t => !t._picksComplete);
  const allDone = topicData.filter(t => t._picksComplete);

  const topicCards = topicData.map(t => {
    let statusBadge, content;
    const topicSelections = selections[t.topicId] || {};
    const ranks = Object.values(topicSelections).filter(r => r !== '');
    const picksComplete = ranks.includes('1') && ranks.includes('2') && ranks.includes('3');

    if (t.status === 'complete') {
      const durationWarning = t._pickedOver15 > 0
        ? `<span style="background:#FEEBC8;color:#C05621;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;margin-right:6px">&#9888; ${t._pickedOver15} PICK${t._pickedOver15 > 1 ? 'S' : ''} OVER 15 MIN</span>`
        : '';
      statusBadge = picksComplete
        ? `${durationWarning}<span style="background:#C6F6D5;color:#276749;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">PICKS DONE</span>`
        : `${durationWarning}<span style="background:#FED7D7;color:#9B2C2C;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">NEEDS PICKS</span>`;

      const videoRows = t.topVideos.map((v, i) => {
        const currentRank = topicSelections[i] || '';
        const isRanked = currentRank !== '';
        const rankBg = currentRank === '1' ? '#FFD700' : currentRank === '2' ? '#C0C0C0' : currentRank === '3' ? '#CD7F32' : 'transparent';
        const rowBg = isRanked ? (currentRank === '1' ? '#FFFFF0' : currentRank === '2' ? '#F7FAFC' : currentRank === '3' ? '#FFFAF0' : 'white') : 'white';

        const durMins = v.duration ? v.duration / 60 : 0;
        const durColor = durMins > 20 ? '#E53E3E' : durMins > 15 ? '#DD6B20' : durMins > 10 ? '#D69E2E' : '#276749';
        const durBg = durMins > 20 ? '#FED7D7' : durMins > 15 ? '#FEEBC8' : durMins > 10 ? '#FEFCBF' : '#C6F6D5';
        const durIcon = durMins > 20 ? '&#10060;' : durMins <= 10 ? '&#9989;' : '';

        return `
        <tr class="video-row" data-duration="${v.duration || 0}" style="border-bottom:1px solid #EDF2F7;background:${rowBg}">
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
            <a href="${v.url}" target="_blank" style="color:#2D3748;text-decoration:none;font-size:13px;font-weight:500">${v.title.length > 65 ? v.title.substring(0, 65) + '...' : v.title}</a>
            <div style="color:#A0AEC0;font-size:11px;margin-top:2px">${v.channel} &middot; Tier ${v.tier} &middot; ${(v.views || 0).toLocaleString()} views</div>
          </td>
          <td style="padding:8px 6px;text-align:center;width:90px">
            <span style="background:${durBg};color:${durColor};padding:3px 8px;border-radius:8px;font-weight:700;font-size:12px;display:inline-block;white-space:nowrap">${durIcon} ${formatDuration(v.duration)}</span>
          </td>
          <td style="padding:8px 6px;text-align:center">
            <div style="background:${v.score >= 0.8 ? '#C6F6D5' : v.score >= 0.6 ? '#FEFCBF' : '#FED7D7'};color:${v.score >= 0.8 ? '#276749' : v.score >= 0.6 ? '#975A16' : '#9B2C2C'};padding:3px 8px;border-radius:8px;font-weight:700;font-size:13px;display:inline-block">${v.score.toFixed(2)}</div>
          </td>
          <td style="padding:8px 6px;font-size:11px;color:#718096;text-align:center">${v.topicAlignment?.toFixed(2) || '-'}</td>
          <td style="padding:8px 6px;font-size:11px;color:#718096;text-align:center">${v.teachingQuality?.toFixed(2) || '-'}</td>
          <td style="padding:8px 6px;font-size:11px;color:#718096;text-align:center">${v.audienceFit?.toFixed(2) || '-'}</td>
          <td style="padding:8px 6px;text-align:center"><span style="background:#EDF2F7;padding:2px 8px;border-radius:8px;font-size:11px;color:#4A5568">${v.method || '-'}</span></td>
          <td style="padding:8px 6px;font-size:11px;color:#A0AEC0;max-width:200px">${v.rationale || ''}</td>
        </tr>`;
      }).join('');

      // Current picks summary
      const picks = Object.entries(topicSelections)
        .filter(([_, rank]) => rank !== '')
        .sort(([_, a], [__, b]) => Number(a) - Number(b))
        .map(([idx, rank]) => {
          const v = t.topVideos[Number(idx)];
          if (!v) return '';
          const medal = rank === '1' ? '&#129351;' : rank === '2' ? '&#129352;' : '&#129353;';
          const durMins = v.duration ? (v.duration / 60).toFixed(0) : '?';
          return `<span style="display:inline-flex;align-items:center;gap:4px;background:#F7FAFC;border:1px solid #E2E8F0;padding:4px 10px;border-radius:8px;font-size:12px">${medal} ${v.title.substring(0, 40)}${v.title.length > 40 ? '...' : ''} <span style="color:#718096;font-size:11px">(${durMins} min)</span></span>`;
        }).filter(Boolean);

      const picksHTML = picks.length > 0
        ? `<div style="margin:12px 0;display:flex;flex-wrap:wrap;gap:8px">${picks.join('')}</div>`
        : `<div style="margin:12px 0;color:#A0AEC0;font-size:13px">No picks yet — use the dropdowns below to select your top 3</div>`;

      // Duration distribution for this topic
      const under10 = t.topVideos.filter(v => v.duration && v.duration <= 600).length;
      const from10to20 = t.topVideos.filter(v => v.duration && v.duration > 600 && v.duration <= 1200).length;
      const over20 = t.topVideos.filter(v => v.duration && v.duration > 1200).length;

      if (picksComplete) {
        content = `
          <div style="padding:4px 0">
            ${picksHTML}
            <div style="margin-top:8px;font-size:11px;color:#A0AEC0;cursor:pointer" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.textContent = this.nextElementSibling.style.display === 'none' ? 'Show all videos ▸' : 'Hide videos ▾'">Show all videos &#9656;</div>
            <div style="display:none">
              <div style="margin:12px 0 8px;display:flex;align-items:center;gap:12px">
                <span style="font-size:12px;font-weight:600;color:#4A5568">Filter by duration:</span>
                <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', 0)" style="background:#C6F6D5;color:#276749;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">&#9989; Under 10 min (${under10})</button>
                <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', 600)" style="background:#FEFCBF;color:#975A16;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">10–20 min (${from10to20})</button>
                <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', 1200)" style="background:#FED7D7;color:#9B2C2C;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">&#10060; Over 20 min (${over20})</button>
                <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', -1)" style="background:#EDF2F7;color:#4A5568;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">All (${t.topVideos.length})</button>
              </div>
              <table id="table-${t.topicId}" style="width:100%;border-collapse:collapse;margin-top:4px">
                <thead>
                  <tr style="border-bottom:2px solid #E2E8F0">
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:60px">Pick</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:30px">#</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:left">Video</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:90px">Duration</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:60px">Score</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:50px">Topic</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:50px">Teach</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:50px">Fit</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:80px">Method</th>
                    <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:left">Rationale</th>
                  </tr>
                </thead>
                <tbody>${videoRows}</tbody>
              </table>
            </div>
          </div>`;
      } else {
        content = `
        <div style="display:flex;gap:16px;margin:12px 0;flex-wrap:wrap;align-items:center">
          <div style="background:#F7FAFC;padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${t.color}">${t.topVideos.length}</div>
            <div style="font-size:11px;color:#A0AEC0">Videos Available</div>
          </div>
          <div style="background:#C6F6D5;padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#276749">${under10}</div>
            <div style="font-size:11px;color:#276749">Under 10 min</div>
          </div>
          <div style="background:#FEFCBF;padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#975A16">${from10to20}</div>
            <div style="font-size:11px;color:#975A16">10–20 min</div>
          </div>
          <div style="background:${over20 > 0 ? '#FED7D7' : '#F7FAFC'};padding:10px 16px;border-radius:8px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:${over20 > 0 ? '#9B2C2C' : '#A0AEC0'}">${over20}</div>
            <div style="font-size:11px;color:${over20 > 0 ? '#9B2C2C' : '#A0AEC0'}">Over 20 min</div>
          </div>
        </div>
        <div style="font-weight:600;font-size:13px;color:#2D3748;margin-top:16px">Your Top 3 Picks:</div>
        ${picksHTML}
        <div style="margin:12px 0 8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:600;color:#4A5568">Filter by duration:</span>
          <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', 0)" style="background:#C6F6D5;color:#276749;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">&#9989; Under 10 min (${under10})</button>
          <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', 600)" style="background:#FEFCBF;color:#975A16;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">10–20 min (${from10to20})</button>
          <button class="dur-filter" onclick="filterDuration(this, '${t.topicId}', 1200)" style="background:#FED7D7;color:#9B2C2C;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">&#10060; Over 20 min (${over20})</button>
          <button class="dur-filter active-filter" onclick="filterDuration(this, '${t.topicId}', -1)" style="background:#2D3748;color:white;border:none;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600;cursor:pointer">All (${t.topVideos.length})</button>
        </div>
        <table id="table-${t.topicId}" style="width:100%;border-collapse:collapse;margin-top:4px">
          <thead>
            <tr style="border-bottom:2px solid #E2E8F0">
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:60px">Pick</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:30px">#</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:left">Video</th>
              <th style="padding:8px 6px;font-size:11px;color:#A0AEC0;text-transform:uppercase;text-align:center;width:90px">Duration</th>
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
      }
    } else if (t.status === 'pass2_in_progress') {
      statusBadge = `<span style="background:#FEFCBF;color:#975A16;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">SCORING (Pass 2)</span>`;
      content = `<div style="padding:20px;color:#718096;font-size:14px">${t.candidates} candidates from Pass 1 — scoring in progress...</div>`;
    } else {
      statusBadge = `<span style="background:#EDF2F7;color:#718096;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">PENDING</span>`;
      content = `<div style="padding:20px;color:#A0AEC0;font-size:14px">No scored videos found for this topic</div>`;
    }

    return { html: `
      <div id="card-${t.topicId}" class="topic-card" data-level="${t.level}" data-complete="${t._picksComplete}" style="background:${t._pickedOver15 > 0 ? '#FFFAF0' : 'white'};border-radius:12px;border:${t._pickedOver15 > 0 ? '2px solid #ED8936' : '1px solid #E2E8F0'};margin-bottom:20px;overflow:hidden">
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
      </div>`, data: t };
  });

  const needsInputHTML = topicCards.filter(c => !c.data._picksComplete).map(c => c.html).join('');
  const doneHTML = topicCards.filter(c => c.data._picksComplete).map(c => c.html).join('');

  const completedPicks = topicData.filter(t => t._picksComplete).length;
  const totalPicks = Object.values(selections).reduce((sum, t) => sum + Object.values(t).filter(v => v !== '').length, 0);

  const flaggedTopics = topicData.filter(t => t._pickedOver15 > 0).length;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Oxygy Video Curation Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F7FAFC; color: #1A202C; }
    select:hover { border-color: #A0AEC0 !important; }
    .dur-filter { transition: all 0.15s; }
    .dur-filter:hover { opacity: 0.85; transform: scale(1.03); }
    .active-filter { outline: 2px solid #2D3748; outline-offset: 1px; }
    .level-btn { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; }
    .level-btn:hover { transform: scale(1.05); }
    .level-btn.active { border-color: #1A202C; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div style="max-width:1400px;margin:0 auto;padding:24px 32px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div>
        <h1 style="font-size:22px;font-weight:700;color:#1A202C">Video Curation Dashboard</h1>
        <p style="color:#A0AEC0;font-size:13px;margin-top:4px">Pick your top 3 videos per topic. Selections saved instantly. Guideline: all videos under 20 min, at least one under 10 min.</p>
      </div>
      <div style="display:flex;gap:12px">
        <div style="background:white;border:1px solid #E2E8F0;padding:10px 16px;border-radius:8px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#38B2AC">${completedPicks}/${TOPICS.length}</div>
          <div style="font-size:11px;color:#A0AEC0">Topics Done</div>
        </div>
        <div style="background:white;border:1px solid #E2E8F0;padding:10px 16px;border-radius:8px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:#ED8936">${totalPicks}</div>
          <div style="font-size:11px;color:#A0AEC0">Picks Made</div>
        </div>
        <div style="background:${flaggedTopics > 0 ? '#FFFAF0' : 'white'};border:${flaggedTopics > 0 ? '2px solid #ED8936' : '1px solid #E2E8F0'};padding:10px 16px;border-radius:8px;text-align:center">
          <div style="font-size:20px;font-weight:700;color:${flaggedTopics > 0 ? '#C05621' : '#276749'}">${flaggedTopics}</div>
          <div style="font-size:11px;color:${flaggedTopics > 0 ? '#C05621' : '#A0AEC0'}">Topics &gt;15 min</div>
        </div>
      </div>
    </div>

    <!-- Level filter bar -->
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
      <span style="font-size:13px;font-weight:600;color:#4A5568;margin-right:4px">Level:</span>
      <button class="level-btn active" onclick="filterLevel(this, 0)" style="background:#EDF2F7;color:#4A5568">All</button>
      <button class="level-btn" onclick="filterLevel(this, 1)" style="background:#E6FFFA;color:#38B2AC">L1 Fundamentals</button>
      <button class="level-btn" onclick="filterLevel(this, 2)" style="background:#EBF8FF;color:#4299E1">L2 Applied</button>
      <button class="level-btn" onclick="filterLevel(this, 3)" style="background:#FAF5FF;color:#9F7AEA">L3 Systemic</button>
      <button class="level-btn" onclick="filterLevel(this, 4)" style="background:#FFFAF0;color:#ED8936">L4 Dashboards</button>
      <button class="level-btn" onclick="filterLevel(this, 5)" style="background:#FFF5F5;color:#E53E3E">L5 Applications</button>
    </div>

    <!-- Needs input section -->
    <h2 id="needs-heading" style="font-size:16px;font-weight:600;color:#9B2C2C;margin-bottom:12px">Needs Your Input (${needsInput.length})</h2>
    ${needsInputHTML}

    <!-- Completed section -->
    <h2 id="done-heading" style="font-size:16px;font-weight:600;color:#276749;margin:24px 0 12px">Completed (${allDone.length})</h2>
    ${doneHTML}
  </div>

  <script>
    function setRank(topicId, videoIndex, rank) {
      fetch('/api/select?topicId=' + topicId + '&videoIndex=' + videoIndex + '&rank=' + rank)
        .then(() => window.location.reload());
    }

    function filterDuration(btn, topicId, minSeconds) {
      const table = document.getElementById('table-' + topicId);
      if (!table) return;
      const rows = table.querySelectorAll('.video-row');

      // Update active state for sibling buttons
      btn.parentElement.querySelectorAll('.dur-filter').forEach(b => {
        b.classList.remove('active-filter');
        b.style.outline = 'none';
      });
      btn.classList.add('active-filter');
      btn.style.outline = '2px solid #2D3748';
      btn.style.outlineOffset = '1px';

      rows.forEach(row => {
        const dur = parseInt(row.getAttribute('data-duration') || '0');
        let show = false;

        if (minSeconds === -1) {
          show = true; // All
        } else if (minSeconds === 0) {
          show = dur <= 600; // Under 10 min
        } else if (minSeconds === 600) {
          show = dur > 600 && dur <= 1200; // 10-20 min
        } else if (minSeconds === 1200) {
          show = dur > 1200; // Over 20 min
        }

        row.style.display = show ? '' : 'none';
      });
    }

    // Level filter
    let activeLevel = 0;
    function filterLevel(btn, level) {
      activeLevel = level;
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.topic-card').forEach(card => {
        const cardLevel = parseInt(card.getAttribute('data-level'));
        if (level === 0 || cardLevel === level) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
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

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(buildHTML());
});

server.listen(PORT, () => {
  console.log(`\nVideo Curation Dashboard running at http://localhost:${PORT}\n`);
  console.log('Selections reset. All picks cleared.');
  console.log('Picks are saved instantly to data/selections.json');
});
