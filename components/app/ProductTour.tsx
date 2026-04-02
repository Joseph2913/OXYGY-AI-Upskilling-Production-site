import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Home, BookOpen, Wrench, GraduationCap, Folder, Users, Award, Volume2, VolumeX, Pause, Play, RotateCcw, Maximize2 } from 'lucide-react';

/* ─── Types ─── */
interface TourStep {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
  route: string;
  icon: React.FC<any>;
  hasInlineIllustration?: 'journey' | 'tiers' | 'dashboard' | 'elearning' | 'toolkit' | 'prompt' | 'coach' | 'artefacts' | 'cohort' | null;
  hasSpotlights: boolean;
  footnote: string | null;
  secondaryNote: string | null;
  audioSrc: string;
}

interface ProductTourProps {
  onComplete: () => void;
}

/* ─── Step Data ─── */
const TOTAL_STEPS = 8;

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    eyebrow: `STEP 1 OF ${TOTAL_STEPS}`,
    title: 'Your Control Centre',
    description: 'Your Dashboard gives you an at-a-glance view of your progress, your current level, and where you left off. If you\'re part of a cohort, you\'ll also find your team leaderboard here.',
    chips: ['Progress overview', 'Resume learning', 'Cohort leaderboard'],
    route: '/app/dashboard',
    icon: Home,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-1.mp3',
  },
  {
    id: 'journey',
    eyebrow: `STEP 2 OF ${TOTAL_STEPS}`,
    title: 'Your Learning Journey',
    description: 'This is your personalised roadmap through five levels. Each level has three things to complete: e-learning, a toolkit activity, and a project submission. Track your progress across all three from right here.',
    chips: ['E-learning', 'Toolkit activity', 'Project submission'],
    route: '/app/journey',
    icon: Map,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-2.mp3',
  },
  {
    id: 'project',
    eyebrow: `STEP 3 OF ${TOTAL_STEPS}`,
    title: 'Project Submissions & Scoring',
    description: 'At the end of each level you submit real work from your role. It\'s reviewed by AI across multiple dimensions and scored into one of five grades — from Needs Improvement through to Exceptional. Aim for A or above.',
    chips: ['C · Needs improvement', 'B · Good start', 'B+ · Strong foundation', 'A · Excellent', 'A+ · Exceptional'],
    route: '/app/journey/project/1',
    icon: Award,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-3.mp3',
  },
  {
    id: 'level',
    eyebrow: `STEP 4 OF ${TOTAL_STEPS}`,
    title: 'Your E-Learning Environment',
    description: 'Interactive lessons with auto-saved progress — close the browser and pick up exactly where you left off. Enable audio narration for a guided experience, or go fullscreen to remove distractions.',
    chips: ['Auto-resumes progress', 'Audio narration', 'Fullscreen mode'],
    route: '/app/level?level=1',
    icon: BookOpen,
    hasInlineIllustration: null,
    hasSpotlights: true,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-4.mp3',
  },
  {
    id: 'toolkit',
    eyebrow: `STEP 5 OF ${TOTAL_STEPS}`,
    title: 'My Toolkit',
    description: 'Five AI-powered tools — one per level — that unlock as you progress. Describe your task, get a tailored AI output, and save it to your Artefacts. Each tool follows the same structured flow.',
    chips: ['5 AI tools', 'Level-gated', 'Saves to Artefacts'],
    route: '/app/toolkit',
    icon: Wrench,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-5.mp3',
  },
  {
    id: 'coach',
    eyebrow: `STEP 6 OF ${TOTAL_STEPS}`,
    title: 'Your Learning Coach',
    description: 'The Learning Coach curates external resources tailored to your current topic. Choose a platform — YouTube, Perplexity, or NotebookLM — set your learning goal, and get a personalised study plan.',
    chips: ['NotebookLM', 'Perplexity', 'YouTube'],
    route: '/app/toolkit/learning-coach',
    icon: GraduationCap,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-6.mp3',
  },
  {
    id: 'artefacts',
    eyebrow: `STEP 7 OF ${TOTAL_STEPS}`,
    title: 'My Artefacts',
    description: 'When you click Save to Library in any toolkit tool, it lands here — prompts, agents, workflows, and project submissions. Your growing portfolio of AI work. Click any artefact to pick up where you left off.',
    chips: ['Toolkit outputs', 'Project proofs', 'Quick access'],
    route: '/app/artefacts',
    icon: Folder,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-7.mp3',
  },
  {
    id: 'cohort',
    eyebrow: `STEP 8 OF ${TOTAL_STEPS}`,
    title: 'My Cohort',
    description: 'If you\'re enrolled in a team cohort, this is where you see everyone\'s progress together — a leaderboard, weekly activity, and learning milestones shared across your team.',
    chips: ['Team leaderboard', 'Weekly activity', 'Milestone tracking'],
    route: '/app/cohort',
    icon: Users,
    hasInlineIllustration: null,
    hasSpotlights: false,
    footnote: null,
    secondaryNote: null,
    audioSrc: '/audio/tour-step-8.mp3',
  },
];

const STEP_ICONS = [Home, Map, Award, BookOpen, Wrench, GraduationCap, Folder, Users];

/* ─── Audio helper ─── */
function killAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

/* ─── Shared illustration primitives ─── */
const illBox: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 };
const illRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 5 };
const illLabel: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
const illDesc: React.CSSProperties = { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 400 };
const illDot = (color: string): React.CSSProperties => ({ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 });

/* ─── Inline Illustrations ─── */

/* Step 1 — Journey: levels × phases, row-based (consistent with Steps 2 & 5) */
const JourneyIllustration: React.FC = () => {
  const levels = [
    { n: 1, label: 'Fundamentals', color: '#38B2AC', elearn: true,  toolkit: true,  project: true  },
    { n: 2, label: 'Applied',       color: '#5B6DC2', elearn: true,  toolkit: true,  project: false },
    { n: 3, label: 'Strategic',     color: '#C4A934', elearn: false, toolkit: false, project: false },
    { n: 4, label: 'Leadership',    color: '#D97B4A', elearn: false, toolkit: false, project: false },
    { n: 5, label: 'Innovation',    color: '#2C9A94', elearn: false, toolkit: false, project: false },
  ];
  const phases: { key: 'elearn' | 'toolkit' | 'project'; label: string }[] = [
    { key: 'elearn',  label: 'E-Learn' },
    { key: 'toolkit', label: 'Toolkit' },
    { key: 'project', label: 'Project' },
  ];
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {levels.map(l => (
        <div key={l.n} style={{ ...illRow, justifyContent: 'space-between' }}>
          {/* Badge — 20px to match Steps 2 & 5 */}
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, color: '#fff',
          }}>{l.n}</div>
          {/* Level name */}
          <span style={{ fontSize: 10, fontWeight: 700, color: l.color, width: 76, flexShrink: 0 }}>{l.label}</span>
          {/* Phase tags */}
          <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
            {phases.map(p => {
              const done = l[p.key];
              return (
                <span key={p.key} style={{
                  fontSize: 8, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 3,
                  background: done ? `${l.color}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? `${l.color}55` : 'rgba(255,255,255,0.06)'}`,
                  color: done ? l.color : 'rgba(255,255,255,0.18)',
                }}>{p.label}{done ? ' ✓' : ''}</span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* Step 2 — Tiers */
const TiersIllustration: React.FC = () => {
  const tiers = [
    { letter: 'A+', label: 'Exceptional', color: '#38B2AC', desc: 'Innovative application with measurable impact' },
    { letter: 'A', label: 'Excellent', color: '#48BB78', desc: 'Clear evidence of applied learning and reflection' },
    { letter: 'B+', label: 'Strong foundation', color: '#ECC94B', desc: 'Solid understanding with room to deepen' },
    { letter: 'B', label: 'Good start', color: '#ED8936', desc: 'Meets basic requirements but lacks depth' },
    { letter: 'C', label: 'Needs improvement', color: '#E53E3E', desc: 'Needs revision — key elements missing' },
  ];
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tiers.map(t => (
        <div key={t.letter} style={illRow}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: '#FFFFFF', background: t.color,
          }}>{t.letter}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.color, width: 72, flexShrink: 0 }}>{t.label}</span>
          <span style={illDesc}>{t.desc}</span>
        </div>
      ))}
    </div>
  );
};

/* Step 3 — Dashboard: progress overview */
const DashboardIllustration: React.FC = () => (
  <div style={{ marginTop: 10, ...illBox, padding: '8px 10px' }}>
    {/* Mini progress bars */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ ...illLabel, color: '#38B2AC', fontSize: 8 }}>Overall</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: '35%', height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #38B2AC, #A8F0E0)' }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>35%</span>
    </div>
    {/* Level mini-rings row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
      {[
        { n: 1, pct: 100, color: '#38B2AC' },
        { n: 2, pct: 60, color: '#5B6DC2' },
        { n: 3, pct: 0, color: '#C4A934' },
        { n: 4, pct: 0, color: '#D97B4A' },
        { n: 5, pct: 0, color: '#2C9A94' },
      ].map(l => (
        <div key={l.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `2px solid ${l.pct > 0 ? l.color : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: l.pct > 0 ? l.color : 'rgba(255,255,255,0.15)',
            background: l.pct === 100 ? `${l.color}15` : 'transparent',
          }}>
            {l.pct === 100 ? '✓' : `L${l.n}`}
          </div>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{l.pct}%</span>
        </div>
      ))}
    </div>
    {/* Streak */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 12 }}>🔥</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>3-day streak</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 9, color: '#38B2AC', fontWeight: 600 }}>Resume learning →</span>
    </div>
  </div>
);

/* Step 4 — E-learning: narration + fullscreen */
const ElearningIllustration: React.FC = () => (
  <div style={{ marginTop: 10, ...illBox, padding: '10px 12px' }}>
    {/* Mock slide header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#38B2AC', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Slide 3 of 12</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i < 3 ? '#38B2AC' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
    </div>
    {/* Feature rows */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(56,178,172,0.12)', border: '1px solid rgba(56,178,172,0.25)',
        }}>
          <Volume2 size={13} stroke="#38B2AC" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF' }}>Audio narration</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Listen as you learn — adjustable speed</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(56,178,172,0.12)', border: '1px solid rgba(56,178,172,0.25)',
        }}>
          <Maximize2 size={13} stroke="#38B2AC" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF' }}>Fullscreen mode</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Distraction-free immersive experience</div>
        </div>
      </div>
    </div>
  </div>
);

/* Step 5 — Toolkit: tools across levels */
const ToolkitIllustration: React.FC = () => {
  const tools = [
    { level: 1, name: 'Prompt Playground', color: '#38B2AC', desc: 'Build & refine AI prompts' },
    { level: 2, name: 'Agent Builder', color: '#5B6DC2', desc: 'Design AI agent personas' },
    { level: 3, name: 'Workflow Canvas', color: '#C4A934', desc: 'Map multi-step AI workflows' },
    { level: 4, name: 'Dashboard Designer', color: '#D97B4A', desc: 'Create AI adoption PRDs' },
    { level: 5, name: 'App Evaluator', color: '#2C9A94', desc: 'Evaluate AI app readiness' },
  ];
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tools.map(t => (
        <div key={t.level} style={illRow}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, color: '#FFFFFF', background: t.color,
          }}>
            {t.level}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.color, width: 100, flexShrink: 0 }}>{t.name}</span>
          <span style={illDesc}>{t.desc}</span>
        </div>
      ))}
    </div>
  );
};

/* Step 6 — Prompt Playground: flow diagram */
const PromptFlowIllustration: React.FC = () => {
  const steps = [
    { icon: '✏️', label: 'Describe your task' },
    { icon: '⚡', label: 'Get optimised prompt' },
    { icon: '🧠', label: 'Strategy breakdown' },
    { icon: '💾', label: 'Copy or save to Library' },
  ];
  return (
    <div style={{ marginTop: 10, ...illBox, padding: '8px 10px' }}>
      {steps.map((s, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <span style={{ fontSize: 12, width: 20, textAlign: 'center' }}>{s.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: i === 1 ? '#38B2AC' : 'rgba(255,255,255,0.6)' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.08)', marginLeft: 10 }} />
          )}
        </div>
      ))}
    </div>
  );
};

/* Step 7 — Coach: platform pills + YouTube card (larger) */
const CoachIllustration: React.FC = () => (
  <div style={{ marginTop: 8, marginBottom: 4 }}>
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {['NotebookLM', 'Perplexity', 'YouTube'].map(p => (
        <span key={p} style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
          background: p === 'YouTube' ? 'rgba(56,178,172,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${p === 'YouTube' ? 'rgba(56,178,172,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: p === 'YouTube' ? '#38B2AC' : 'rgba(255,255,255,0.3)',
        }}>{p}</span>
      ))}
    </div>
    {/* YouTube video card — prominent */}
    <div style={{ ...illBox, padding: '10px 12px', borderColor: 'rgba(56,178,172,0.2)', background: 'rgba(56,178,172,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Play button thumbnail */}
        <div style={{
          width: 44, height: 32, borderRadius: 5, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(255,0,0,0.15), rgba(255,0,0,0.06))',
          border: '1px solid rgba(255,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* YouTube play triangle */}
          <div style={{
            width: 0, height: 0, borderLeft: '10px solid #FF0000', borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>YouTube · Practical Tutorials</div>
          <div style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 600, marginTop: 2 }}>How Prompt Engineering Actually Works</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {['▶ 12 min', 'Beginner-friendly'].map(m => (
              <span key={m} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* Step 8 — Artefacts: full type inventory (larger for readability) */
const ArtefactsIllustration: React.FC = () => {
  const rows = [
    { color: '#38B2AC', type: 'Prompt',     name: 'Stakeholder briefing prompt' },
    { color: '#5B6DC2', type: 'Agent',      name: 'Weekly report assistant' },
    { color: '#C4A934', type: 'Workflow',   name: 'Client onboarding flow' },
    { color: '#D97B4A', type: 'Build Guide',name: 'AI adoption roadmap' },
    { color: '#A8F0E0', type: 'PRD',        name: 'Product requirements doc' },
    { color: '#FBCEB1', type: 'App Spec',   name: 'Internal tool evaluation' },
    { color: '#C3D0F5', type: 'Project',    name: 'Level 1 — Prompt Engineering' },
  ];
  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {rows.map(r => (
        <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Larger dot — 10px */}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: r.color, width: 72, flexShrink: 0 }}>{r.type}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
        </div>
      ))}
    </div>
  );
};

/* Step 9 — Cohort: leaderboard + activity */
const CohortIllustration: React.FC = () => {
  const members = [
    { rank: '🥇', name: 'Sarah M.', level: 3, score: 2450, pct: 48 },
    { rank: '🥈', name: 'James L.', level: 2, score: 1820, pct: 35 },
    { rank: '🥉', name: 'Priya K.', level: 2, score: 1640, pct: 30 },
  ];
  return (
    <div style={{ marginTop: 10, ...illBox, padding: '8px 10px' }}>
      <div style={{ ...illLabel, color: '#38B2AC', fontSize: 8, marginBottom: 6 }}>Team Leaderboard</div>
      {members.map(m => (
        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
          <span style={{ fontSize: 11, width: 18, textAlign: 'center' }}>{m.rank}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#FFFFFF', flex: 1 }}>{m.name}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>L{m.level}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#38B2AC', width: 38, textAlign: 'right' }}>{m.score}</span>
        </div>
      ))}
      {/* Activity hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
            <div key={d + i} style={{
              width: 14, height: 14, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 700,
              background: [0, 2, 4].includes(i) ? 'rgba(56,178,172,0.2)' : 'rgba(255,255,255,0.04)',
              color: [0, 2, 4].includes(i) ? '#38B2AC' : 'rgba(255,255,255,0.15)',
            }}>{d}</div>
          ))}
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Weekly activity</span>
      </div>
    </div>
  );
};

/* ─── Spotlight Overlay ─── */
const SpotlightRing: React.FC<{ selector: string; label: string }> = ({ selector, label }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let retries = 0;
    const maxRetries = 10;
    const interval = 200;
    const tryFind = () => {
      const el = document.querySelector(selector);
      if (el) { setRect(el.getBoundingClientRect()); return; }
      retries++;
      if (retries < maxRetries) setTimeout(tryFind, interval);
    };
    const timer = setTimeout(tryFind, 600);
    return () => clearTimeout(timer);
  }, [selector]);

  useEffect(() => {
    if (!rect) return;
    const handleScroll = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [rect, selector]);

  if (!rect || window.innerWidth < 900) return null;

  return (
    <div style={{
      position: 'fixed', top: rect.top - 6, left: rect.left - 8,
      width: rect.width + 16, height: rect.height + 12,
      borderRadius: 10, border: '2px solid #38B2AC',
      boxShadow: '0 0 0 3px rgba(56,178,172,0.12), 0 0 12px rgba(56,178,172,0.18)',
      pointerEvents: 'none', zIndex: 9998,
      animation: 'spotlightPulse 2.4s ease-in-out infinite, spotlightFadeIn 0.4s ease',
    }}>
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        marginTop: 6, fontSize: 10, fontWeight: 700, color: '#38B2AC',
        background: '#1A202C', padding: '2px 8px', borderRadius: 10,
        border: '1px solid rgba(56,178,172,0.3)', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  );
};

/* ─── Waveform bars (visual indicator when narration is playing) ─── */
const WaveformBars: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 14 }}>
    {[0, 0.1, 0.2, 0.1, 0].map((delay, i) => (
      <div key={i} style={{
        width: 2, borderRadius: 1, background: '#38B2AC',
        height: isPlaying ? undefined : 4,
        animation: isPlaying ? `tourWave 0.6s ease-in-out ${delay}s infinite alternate` : 'none',
        transition: 'height 0.2s ease',
      }} />
    ))}
  </div>
);

/* ─── Main Component ─── */
export const ProductTour: React.FC<ProductTourProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tour phases: 'welcome' (opt-in screen) → 'touring' (step-by-step) → done
  const [phase, setPhase] = useState<'welcome' | 'touring'>('welcome');
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Voiceover state
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('oxygy_tour_vo_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  type Speed = 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
  const SPEEDS: Speed[] = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const [speed, setSpeedState] = useState<Speed>(() => {
    const saved = localStorage.getItem('oxygy_tour_vo_speed');
    return saved ? (parseFloat(saved) as Speed) : 1;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const genRef = useRef(0);
  const speedRef = useRef(speed);
  const volumeRef = useRef(volume);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const volumePopRef = useRef<HTMLDivElement>(null);

  const current = phase === 'touring' ? TOUR_STEPS[step] : null;
  const isLast = step === TOUR_STEPS.length - 1;

  /* ── Persist & sync refs ── */
  const setSpeed = useCallback((s: Speed) => {
    setSpeedState(s);
    speedRef.current = s;
    localStorage.setItem('oxygy_tour_vo_speed', String(s));
    if (audioRef.current) audioRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  }, []);

  const setVol = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    volumeRef.current = clamped;
    localStorage.setItem('oxygy_tour_vo_volume', String(clamped));
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  /* ── Close popovers on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showSpeedMenu && speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) setShowSpeedMenu(false);
      if (showVolumeSlider && volumePopRef.current && !volumePopRef.current.contains(e.target as Node)) setShowVolumeSlider(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSpeedMenu, showVolumeSlider]);

  /* ── Audio playback ── */
  const playAudio = useCallback((src: string) => {
    if (audioRef.current) killAudio(audioRef.current);

    genRef.current++;
    const gen = genRef.current;
    const audio = new Audio(src);
    audioRef.current = audio;

    // Apply speed + volume immediately and aggressively
    const applySettings = () => {
      if (gen !== genRef.current) return;
      audio.playbackRate = speedRef.current;
      audio.volume = volumeRef.current;
    };
    applySettings();

    // Enforce speed at every lifecycle point — some browsers reset playbackRate
    let timeupdateCount = 0;
    audio.addEventListener('loadedmetadata', applySettings);
    audio.addEventListener('canplaythrough', () => {
      if (gen !== genRef.current) return;
      applySettings();
      audio.play().then(applySettings).catch(() => {});
    }, { once: true });
    audio.addEventListener('play', () => {
      if (gen === genRef.current) { setIsPlaying(true); applySettings(); }
    });
    audio.addEventListener('timeupdate', () => {
      if (gen !== genRef.current) return;
      // Enforce for the first 10 timeupdate events to catch late browser resets
      if (timeupdateCount < 10) {
        timeupdateCount++;
        applySettings();
      }
    });
    audio.addEventListener('pause', () => {
      if (gen === genRef.current) setIsPlaying(false);
    });
    audio.addEventListener('ended', () => {
      if (gen === genRef.current) setIsPlaying(false);
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      killAudio(audioRef.current);
      audioRef.current = null;
    }
    genRef.current++;
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const restartAudio = useCallback(() => {
    if (phase !== 'touring') return;
    const s = TOUR_STEPS[step];
    if (s?.audioSrc) playAudio(s.audioSrc);
  }, [step, phase, playAudio]);

  /* ── Play audio when step changes (if narration enabled) ── */
  useEffect(() => {
    if (phase !== 'touring' || !narrationEnabled) return;
    const s = TOUR_STEPS[step];
    if (s?.audioSrc) {
      // Small delay to let the card animate in
      const t = setTimeout(() => playAudio(s.audioSrc), 300);
      return () => clearTimeout(t);
    }
  }, [step, phase, narrationEnabled, playAudio]);

  /* ── Clean up audio on unmount ── */
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  /* ── Navigation ── */
  const goToStep = useCallback((idx: number) => {
    stopAudio();
    const s = TOUR_STEPS[idx];
    navigate(s.route);
    setStep(idx);
    setAnimKey(k => k + 1);
  }, [navigate, stopAudio]);

  const handleNext = () => {
    if (isLast) {
      handleDismiss(true);
    } else {
      goToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) goToStep(step - 1);
  };

  const handleDismiss = useCallback((completed: boolean) => {
    stopAudio();
    setDismissing(true);
    localStorage.setItem('oxygy_tour_completed', 'true');
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 300);
  }, [onComplete, stopAudio]);

  /* ── Welcome screen actions ── */
  const startTourWithNarration = () => {
    setNarrationEnabled(true);
    setPhase('touring');
    navigate(TOUR_STEPS[0].route);
    // Play welcome clip first, then step 1 audio will play when step effect fires
    playAudio('/audio/tour-welcome.mp3');
  };

  const startTourWithoutNarration = () => {
    setNarrationEnabled(false);
    setPhase('touring');
    navigate(TOUR_STEPS[0].route);
  };

  /* ── Toggle narration mid-tour ── */
  const toggleNarration = useCallback(() => {
    if (narrationEnabled) {
      stopAudio();
      setNarrationEnabled(false);
    } else {
      setNarrationEnabled(true);
      // Start playing current step's audio
      const s = TOUR_STEPS[step];
      if (s?.audioSrc) playAudio(s.audioSrc);
    }
  }, [narrationEnabled, step, stopAudio, playAudio]);

  /* ── Keyboard: Escape to skip ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDismiss]);

  if (!visible) return null;

  /* ─── Shared card shell style ─── */
  const CARD_HEIGHT = 400; // Fixed height — no illustrations, consistent across all steps
  const cardStyle: React.CSSProperties = {
    position: 'fixed', bottom: 24, right: 24, width: 400,
    maxWidth: 'calc(100vw - 48px)', zIndex: 9999,
    background: '#1A202C', borderRadius: 14,
    border: '1px solid rgba(56,178,172,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    fontFamily: "'DM Sans', sans-serif", overflow: 'hidden',
    animation: dismissing ? 'none' : 'tourCardIn 0.25s ease',
    opacity: dismissing ? 0 : 1,
    transform: dismissing ? 'translateY(16px)' : 'translateY(0)',
    transition: dismissing ? 'opacity 0.3s, transform 0.3s' : 'none',
    display: 'flex', flexDirection: 'column',
  };

  /* ═══════════════════════ WELCOME SCREEN ═══════════════════════ */
  if (phase === 'welcome') {
    return (
      <>
        <style>{`
          @keyframes tourCardIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div role="dialog" aria-label="Product tour welcome" style={cardStyle}>
          {/* Accent bar */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #38B2AC, #A8F0E0)' }} />

          <div style={{ padding: '20px 20px 16px' }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(56,178,172,0.1)', border: '1px solid rgba(56,178,172,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Map size={22} stroke="#38B2AC" strokeWidth={1.75} fill="none" />
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                Welcome to OXYGY's AI Upskilling Platform
              </div>
            </div>

            {/* Description */}
            <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 16 }}>
              Would you like a quick guided tour of the platform? We can walk you through each section with an optional voiceover to help you understand the core features.
            </div>

            {/* Narration opt-in */}
            <div style={{
              background: 'rgba(56,178,172,0.06)', border: '1px solid rgba(56,178,172,0.15)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Volume2 size={14} stroke="#38B2AC" strokeWidth={2} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.03em' }}>Audio narration available</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Enable voiceover narration for a guided walkthrough of each page. You can toggle it on or off at any time during the tour.
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={startTourWithNarration}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 10,
                  background: '#38B2AC', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#FFFFFF',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Volume2 size={14} />
                Start tour with narration
              </button>
              <button
                onClick={startTourWithoutNarration}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit',
                }}
              >
                Start tour without narration
              </button>
            </div>

            {/* Skip */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={() => handleDismiss(false)}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#38B2AC',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Skip tour entirely
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ═══════════════════════ TOUR STEPS ═══════════════════════ */
  const Icon = STEP_ICONS[step];

  return (
    <>
      {/* Global styles */}
      <style>{`
        @keyframes tourCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .tour-icon-float {
          animation: float 3s ease-in-out infinite;
        }
        .tour-card-scroll::-webkit-scrollbar { display: none; }
        .tour-card-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spotlightPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(56,178,172,0.12), 0 0 12px rgba(56,178,172,0.18); }
          50%      { box-shadow: 0 0 0 6px rgba(56,178,172,0.16), 0 0 18px rgba(56,178,172,0.25); }
        }
        @keyframes spotlightFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tourWave {
          0% { height: 4px; }
          100% { height: 14px; }
        }
      `}</style>

      {/* Spotlight rings for Step 3 */}
      {current?.hasSpotlights && !dismissing && (
        <>
          <SpotlightRing selector='[data-tour="narration-btn"]' label="Enable narration" />
          <SpotlightRing selector='[data-tour="fullscreen-btn"]' label="Go fullscreen" />
        </>
      )}

      {/* Tour Card */}
      <div ref={cardRef} role="dialog" aria-label="Product tour" key={animKey} style={{ ...cardStyle, height: CARD_HEIGHT }}>
        {/* Accent bar */}
        <div style={{ height: 3, flexShrink: 0, background: 'linear-gradient(90deg, #38B2AC, #A8F0E0)' }} />

        {/* Progress dots + Skip — pinned top */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{
                height: 6, borderRadius: 3, transition: 'all 0.25s ease',
                width: i === step ? 20 : 6,
                background: i === step ? '#38B2AC' : i < step ? 'rgba(56,178,172,0.4)' : 'rgba(255,255,255,0.12)',
              }} />
            ))}
          </div>
          <button
            onClick={() => handleDismiss(false)}
            style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            Skip tour ×
          </button>
        </div>

        {/* ── Scrollable body — fills remaining space ── */}
        <div className="tour-card-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Header: icon + eyebrow + title */}
          <div style={{ display: 'flex', padding: '6px 16px 0', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>
                {current!.eyebrow}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>
                {current!.title}
              </div>
            </div>
            <div style={{ width: 56, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(56,178,172,0.08)', border: '1px solid rgba(56,178,172,0.18)',
              }}>
                <Icon size={20} stroke="#38B2AC" strokeWidth={1.75} fill="none"
                  className="tour-icon-float" style={{ animationDelay: `${step * 0.25}s` }} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ padding: '8px 16px 0', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, fontWeight: 400 }}>
            {current!.description}
          </div>

          {/* Inline illustration (if any) */}
          <div style={{ padding: '0 16px' }}>
            {current!.hasInlineIllustration === 'journey' && <JourneyIllustration />}
            {current!.hasInlineIllustration === 'tiers' && <TiersIllustration />}
            {current!.hasInlineIllustration === 'dashboard' && <DashboardIllustration />}
            {current!.hasInlineIllustration === 'elearning' && <ElearningIllustration />}
            {current!.hasInlineIllustration === 'toolkit' && <ToolkitIllustration />}
            {current!.hasInlineIllustration === 'prompt' && <PromptFlowIllustration />}
            {current!.hasInlineIllustration === 'coach' && <CoachIllustration />}
            {current!.hasInlineIllustration === 'artefacts' && <ArtefactsIllustration />}
            {current!.hasInlineIllustration === 'cohort' && <CohortIllustration />}
          </div>

          {/* Feature chips */}
          <div style={{ padding: '10px 16px 0', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {current!.chips.map(c => (
              <span key={c} style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                padding: '3px 9px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              }}>{c}</span>
            ))}
          </div>

          {/* Footnote / secondary note */}
          {current!.footnote && (
            <div style={{ padding: '6px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              {current!.footnote}
            </div>
          )}
          {current!.secondaryNote && (
            <div style={{ padding: '6px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
              {current!.secondaryNote}
            </div>
          )}

          {/* Bottom padding inside scroll area */}
          <div style={{ height: 12 }} />
        </div>

        {/* ── Audio control bar (when narration enabled) — pinned ── */}
        {narrationEnabled && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(56,178,172,0.04)',
          }}>
            {/* Play / Pause */}
            <button
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1A202C', border: '1px solid rgba(56,178,172,0.3)',
                cursor: 'pointer', padding: 0,
              }}
            >
              {isPlaying
                ? <Pause size={11} fill="#38B2AC" stroke="#38B2AC" />
                : <Play size={11} fill="#38B2AC" stroke="#38B2AC" style={{ marginLeft: 1 }} />
              }
            </button>

            {/* Waveform */}
            <WaveformBars isPlaying={isPlaying} />

            {/* Restart */}
            <button
              onClick={restartAudio}
              title="Restart narration"
              style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', padding: 0,
              }}
            >
              <RotateCcw size={11} stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Speed selector */}
            <div ref={speedMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowSpeedMenu(v => !v); setShowVolumeSlider(false); }}
                title="Playback speed"
                style={{
                  padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                  color: speed === 1 ? 'rgba(255,255,255,0.4)' : '#38B2AC',
                  background: speed === 1 ? 'rgba(255,255,255,0.06)' : 'rgba(56,178,172,0.12)',
                  border: `1px solid ${speed === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(56,178,172,0.25)'}`,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                {speed}×
              </button>
              {showSpeedMenu && (
                <div style={{
                  position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
                  background: '#1A202C', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: 4, display: 'flex', flexDirection: 'column', gap: 2,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 10,
                }}>
                  {SPEEDS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, fontFamily: 'inherit', textAlign: 'center',
                        background: s === speed ? '#38B2AC' : 'transparent',
                        color: s === speed ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume */}
            <div ref={volumePopRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowVolumeSlider(v => !v); setShowSpeedMenu(false); }}
                title={`Volume: ${Math.round(volume * 100)}%`}
                style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {volume === 0
                  ? <VolumeX size={12} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
                  : <Volume2 size={12} stroke="#38B2AC" strokeWidth={2} />
                }
              </button>
              {showVolumeSlider && (
                <div style={{
                  position: 'absolute', bottom: '100%', right: -4, marginBottom: 6,
                  background: '#1A202C', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '12px 10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 10,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  width: 36,
                }}>
                  {/* Vertical slider (rendered as rotated range) */}
                  <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="range" min="0" max="100" step="1"
                      value={Math.round(volume * 100)}
                      onChange={e => setVol(parseInt(e.target.value, 10) / 100)}
                      style={{
                        writingMode: 'vertical-lr' as any,
                        direction: 'rtl',
                        width: 80, height: 4,
                        accentColor: '#38B2AC',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Mute/unmute toggle */}
            <button
              onClick={toggleNarration}
              title={narrationEnabled ? 'Disable narration' : 'Enable narration'}
              style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', padding: 0,
              }}
            >
              <VolumeX size={12} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Narration off — subtle enable hint — pinned */}
        {!narrationEnabled && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '6px 16px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}>
            <button
              onClick={toggleNarration}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
              }}
            >
              <Volume2 size={12} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>Enable narration</span>
            </button>
          </div>
        )}

        {/* Nav row — pinned bottom */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px 14px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <button onClick={handleBack} tabIndex={0} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
            color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, padding: '7px 14px',
            cursor: step === 0 ? 'default' : 'pointer',
            opacity: step === 0 ? 0.3 : 1,
            pointerEvents: step === 0 ? 'none' : 'auto', fontFamily: 'inherit',
          }}>
            ← Back
          </button>
          <button onClick={handleNext} tabIndex={0} style={{
            background: isLast ? '#48BB78' : '#38B2AC',
            border: 'none', borderRadius: 20,
            color: '#FFFFFF', fontSize: 12, fontWeight: 700, padding: '7px 18px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {isLast ? 'Get started ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductTour;
