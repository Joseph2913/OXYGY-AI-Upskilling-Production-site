import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, Lock, ChevronDown, FolderOpen, Star, Zap } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import LearningPlanBlocker from '../../components/app/LearningPlanBlocker';
import { Tool, getPrimaryTool } from '../../data/toolkitData';
import { LEVEL_META } from '../../data/levelTopics';
import { useToolkitData } from '../../hooks/useToolkitData';

const ANIM_STYLE = `
@keyframes tkFadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tkFadeSlideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tkPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
`;

/** Routes that have real pages built */
const BUILT_ROUTES = new Set([
  '/app/toolkit/prompt-playground',
  '/app/toolkit/prompt-library',
  '/app/toolkit/agent-builder',
  '/app/toolkit/workflow-canvas',
  '/app/toolkit/dashboard-designer',
  '/app/toolkit/app-builder',
  '/app/toolkit/ai-app-evaluator',
]);

/** Steps & outcome metadata per tool */
const TOOL_GUIDE: Record<string, { steps: string[]; outcome: string }> = {
  'prompt-playground': {
    steps: [
      'Choose a prompt structure (freeform, RCTF, or Prompt Blueprint)',
      'Write your prompt in the editor with system and user messages',
      'Run it against the AI and review the response',
      'Iterate on your prompt, comparing different versions side by side',
      'Save your best prompts to your Prompt Library for reuse',
    ],
    outcome: 'A refined, tested prompt that you can reuse across projects — saved to your personal library and ready to share with your team.',
  },
  'agent-builder': {
    steps: [
      'Define your agent\'s role, persona, and target audience',
      'Write the system prompt with instructions, constraints, and tone',
      'Configure response format, guardrails, and accountability checks',
      'Test your agent in a live conversation interface',
      'Export as a reusable template or share with your team',
    ],
    outcome: 'A fully configured AI agent with a system prompt, persona, and guardrails — ready to deploy for your specific workflow and shareable as a template.',
  },
  'workflow-canvas': {
    steps: [
      'Map your business process as a series of steps and triggers',
      'Add AI agent nodes at each step where automation applies',
      'Define data inputs, outputs, and handoff points between agents',
      'Mark human-in-the-loop review checkpoints with rationale',
      'Export your workflow diagram as documentation for implementation',
    ],
    outcome: 'A visual, end-to-end workflow map with AI agent nodes, human checkpoints, and data flows — ready for implementation in Make, Zapier, or n8n.',
  },
  'dashboard-designer': {
    steps: [
      'Describe what your app needs to do, who it\'s for, and key features',
      'Review the AI-generated visual mockup of your app',
      'Refine the mockup with feedback until it matches your vision',
      'Generate a comprehensive 11-section Product Requirements Document',
      'Copy the PRD and paste it into an AI coding tool to build your app',
    ],
    outcome: 'A production-ready PRD you can paste directly into Cursor, Lovable, or Bolt.new to build your app — plus a visual mockup for reference.',
  },
  'ai-app-evaluator': {
    steps: [
      'Describe your AI application idea — its purpose, users, and value',
      'Fill in structured fields: user roles, data flows, personalisation logic',
      'Define your tech stack preferences and deployment approach',
      'Submit for AI-powered evaluation of your architecture',
      'Review your implementation readiness score and recommendations',
    ],
    outcome: 'An expert evaluation of your AI application design with an implementation readiness score, tool recommendations, and actionable next steps to build it.',
  },
};

const TOOL_QUALITY_GUIDE: Record<string, {
  goodLabel: string;
  goodExample: string;
  badLabel: string;
  badExample: string;
  scoringNote: string;
}> = {
  'prompt-playground': {
    goodLabel: 'Specific, contextual task description',
    goodExample: 'Summarise the key decisions and action owners from a 45-minute client steering committee meeting transcript. Format as a bullet list grouped by workstream. Tone should be formal and concise for a senior stakeholder audience.',
    badLabel: 'Vague or one-line request',
    badExample: 'Summarise a meeting.',
    scoringNote: 'Prompts are scored on specificity (role, context, task, format), completeness of the RCTF framework, and whether the output would be immediately usable without further editing.',
  },
  'agent-builder': {
    goodLabel: 'Well-scoped agent with clear role and constraints',
    goodExample: 'An HR onboarding assistant for new joiners at a professional services firm. It answers questions about policies, IT setup, and first-week logistics. It never gives legal or contractual advice, and always directs sensitive questions to the HR Business Partner.',
    badLabel: 'Overly broad or undefined agent purpose',
    badExample: 'A helpful assistant that can answer any HR question.',
    scoringNote: 'Agents are scored on role clarity, constraint definition, persona consistency, and whether the system prompt would produce reliably consistent outputs across different user inputs.',
  },
  'workflow-canvas': {
    goodLabel: 'End-to-end process with triggers, steps, and handoffs defined',
    goodExample: 'A proposal generation workflow: triggered when a pursuit is marked active in the CRM. Step 1 — AI drafts an exec summary from the client brief. Step 2 — human reviews and approves tone. Step 3 — AI populates the full proposal template. Step 4 — compliance check flags any restricted terms. Final output stored in SharePoint and notified to the pursuit lead.',
    badLabel: 'Process description with no structure or handoff points',
    badExample: 'Use AI to help write proposals faster.',
    scoringNote: 'Workflows are scored on process completeness, clarity of human-in-the-loop checkpoints, data flow definition, and whether the output could be implemented without further clarification.',
  },
  'dashboard-designer': {
    goodLabel: 'Clear audience, metrics, and decision context',
    goodExample: 'A weekly AI adoption dashboard for L&D programme managers. Key metrics: module completion rates by cohort, artefact creation per learner, leaderboard trends, and stalled learners flagged for follow-up. Primary action: identify which cohort needs a nudge campaign this week.',
    badLabel: 'Undefined audience or generic metric list',
    badExample: 'A dashboard showing AI usage data for the team.',
    scoringNote: 'Dashboard designs are scored on audience specificity, metric relevance to a stated decision, layout clarity, and whether a developer could build it from the specification alone.',
  },
  'ai-app-evaluator': {
    goodLabel: 'Concrete app idea with defined users, data, and value proposition',
    goodExample: 'A personalised learning path recommender for mid-career professionals returning to the workforce. Users input their work history and target role; the app cross-references a skills gap database and generates a weekly study plan. Data source: user CV uploads + O*NET skills taxonomy. Key differentiator: recommendations update as the user completes modules.',
    badLabel: 'Abstract idea without users or data defined',
    badExample: 'An AI app that helps people learn new skills.',
    scoringNote: 'App evaluations are scored on idea specificity, feasibility of the described architecture, clarity of the personalisation logic, and alignment between the stated problem and the proposed solution.',
  },
};

function getToolState(_tool: Tool, _currentLevel: number): 'unlocked' | 'locked' {
  // All tools unlocked by default
  return 'unlocked';
}

/* ── Skeleton for loading ── */
const Skeleton: React.FC<{ height: number }> = ({ height }) => (
  <div style={{
    width: '100%', height, borderRadius: 16,
    background: '#E2E8F0',
    animation: 'tkPulse 1.5s ease-in-out infinite',
  }} />
);

/* ── Section Label ── */
const SectionLabel: React.FC<{ children: React.ReactNode; locked?: boolean }> = ({ children, locked }) => (
  <div style={{
    fontSize: 9, fontWeight: 700, color: locked ? '#CBD5E0' : '#718096',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
  }}>
    {children}
  </div>
);

/* ════════════════════════════════════════════════
   MAIN TOOLKIT PAGE
   ════════════════════════════════════════════════ */
const AppToolkit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile, hasLearningPlan, learningPlanLoading } = useAppContext();
  const currentLevel = userProfile?.currentLevel ?? 1;
  const { data: tkData, loading } = useToolkitData();

  const [showBanner, setShowBanner] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [showScoring, setShowScoring] = useState(false);

  useEffect(() => {
    const unlocked = searchParams.get('unlocked');
    if (unlocked) {
      const lvl = parseInt(unlocked, 10);
      if (lvl >= 1 && lvl <= 5) { setUnlockedLevel(lvl); setShowBanner(true); }
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!showBanner) return;
    const timer = setTimeout(() => setShowBanner(false), 6000);
    return () => clearTimeout(timer);
  }, [showBanner]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleExpanded = useCallback((toolId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }, []);

  const handleOpenTool = useCallback((tool: Tool) => {
    if (BUILT_ROUTES.has(tool.route)) { navigate(tool.route); }
    else { setToastMessage(`${tool.name} is coming soon.`); }
  }, [navigate]);

  const levels = [1, 2, 3, 4, 5];
  const primaryTools = levels.map(lvl => getPrimaryTool(lvl)).filter(Boolean) as Tool[];
  const unlockedCount = primaryTools.filter(t => getToolState(t, currentLevel) === 'unlocked').length;
  const currentMeta = LEVEL_META.find(m => m.number === currentLevel)!;

  // Banner
  const bannerMeta = unlockedLevel ? LEVEL_META.find(m => m.number === unlockedLevel) : null;
  const bannerTool = unlockedLevel ? getPrimaryTool(unlockedLevel) : null;
  const bannerAccent = bannerMeta?.accentColor ?? '#38B2AC';
  const bannerDark = bannerMeta?.accentDark ?? '#1A7A76';

  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="My Toolkit" />;

  if (loading || !tkData) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{ANIM_STYLE}</style>
        <Skeleton height={40} />
        <div style={{ height: 16 }} />
        <Skeleton height={160} />
        <div style={{ height: 16 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ marginBottom: 16 }}><Skeleton height={110} /></div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px', minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{ANIM_STYLE}</style>

      {/* ═══ Page Header ═══ */}
      <div style={{ marginBottom: 28, animation: 'tkFadeSlideUp 0.3s ease 0ms both' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', letterSpacing: '-0.4px', margin: 0, marginBottom: 6 }}>
              My Toolkit
            </h1>
            <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6, margin: 0 }}>
              One powerful tool per level. Build artefacts to earn points on the leaderboard.
            </p>
          </div>
          <button
            onClick={() => setShowScoring(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: 20, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, color: '#4A5568',
              cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              transition: 'border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#38B2AC')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
          >
            <Star size={14} color="#F6AD55" /> How Scoring Works
          </button>
        </div>

        {/* ═══ Scoring Overview (collapsible) ═══ */}
        {/* NOTE TO DEVELOPER: The scoring values below reflect the current formula in
            lib/database.ts (leaderboard scoring) and hooks/useToolkitData.ts (toolkit points).
            Please update this card whenever the scoring logic changes. Note: there is currently
            a discrepancy — the leaderboard uses 25 pts per artefact, but useToolkitData.ts uses
            30 pts per artefact. Align these before showing exact values to users. */}
        <div style={{
          maxHeight: showScoring ? 300 : 0,
          opacity: showScoring ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.25s ease, margin 0.3s ease',
          marginTop: showScoring ? 16 : 0,
          marginBottom: showScoring ? 20 : 0,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
            padding: '18px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
              {/* Left — explanation */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>
                  How Points Work
                </div>
                <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
                  Every artefact you create in a toolkit tool earns points that count toward your cohort leaderboard ranking. The quality and completeness of your input directly affects your score — a well-structured brief produces a stronger artefact and earns more points.
                </div>
              </div>
              {/* Right — scoring breakdown pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {[
                  { label: 'Per artefact created', value: '25 pts', color: '#38B2AC', bg: '#E6FFFA' },
                  { label: 'Per learning phase completed', value: '4 pts', color: '#8B5CF6', bg: '#F5F3FF' },
                  { label: 'Per insight saved', value: '30 pts', color: '#F6AD55', bg: '#FFFBEB' },
                  { label: 'Per streak day (max 14)', value: '5 pts', color: '#ED8936', bg: '#FFF5EB' },
                  { label: 'Per active day, last 30', value: '2 pts', color: '#718096', bg: '#F7FAFC' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#718096' }}>{item.label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: item.color,
                      background: item.bg, borderRadius: 6, padding: '2px 8px',
                      whiteSpace: 'nowrap',
                    }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Progress Header Card ═══ */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
              Tools Unlocked
            </div>
            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(unlockedCount / 5) * 100}%`, background: currentMeta.accentDark, borderRadius: 6, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', minWidth: 50, textAlign: 'right' as const }}>
              {unlockedCount} of 5
            </div>
          </div>

          {/* Level tool indicators — colour-coordinated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
            {levels.map((lvl, i) => {
              const lvlMeta = LEVEL_META.find(m => m.number === lvl)!;
              const tool = getPrimaryTool(lvl);
              const isUnlocked = lvl <= currentLevel;
              const isCurrent = lvl === currentLevel;
              const prevMeta = i > 0 ? LEVEL_META.find(m => m.number === levels[i - 1])! : null;
              const prevUnlocked = i > 0 && levels[i - 1] <= currentLevel;
              return (
                <React.Fragment key={lvl}>
                  {i > 0 && (
                    <div style={{ flex: 1, height: 2, background: prevUnlocked ? (prevMeta?.accentDark || '#E2E8F0') : '#E2E8F0' }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: isCurrent ? 30 : 24, height: isCurrent ? 30 : 24,
                      borderRadius: '50%', flexShrink: 0,
                      background: isUnlocked ? lvlMeta.accentColor : '#F7FAFC',
                      border: isUnlocked ? `2px solid ${lvlMeta.accentDark}` : '1.5px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isCurrent ? 14 : 11,
                      color: isUnlocked ? lvlMeta.accentDark : '#A0AEC0',
                      transition: 'all 0.2s ease',
                    }}>
                      {tool?.icon ? <span style={{ fontSize: isCurrent ? 14 : 11 }}>{tool.icon}</span> : lvl}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: isUnlocked ? 700 : 500, color: isUnlocked ? lvlMeta.accentDark : '#A0AEC0', whiteSpace: 'nowrap' }}>
                      {tool?.name ? (tool.name.length > 14 ? tool.name.split(' ')[0] : tool.name) : lvlMeta.shortName}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Summary stats — 3 large numbers */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            {[
              { icon: <FolderOpen size={16} color={currentMeta.accentDark} />, value: tkData.totalArtefacts, label: 'Artefacts Created' },
              { icon: <Star size={16} color="#F6AD55" />, value: tkData.totalPoints, label: 'Points Earned' },
              { icon: <Zap size={16} color="#8B5CF6" />, value: tkData.totalUsage, label: 'Sessions Logged' },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, padding: '14px 20px',
                background: i === 0 ? `${currentMeta.accentColor}10` : '#F7FAFC',
                borderRight: i < 2 ? '1px solid #E2E8F0' : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#FFFFFF', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unlock Banner */}
      {showBanner && unlockedLevel && bannerTool && (
        <div style={{
          background: `linear-gradient(135deg, ${bannerAccent} 0%, ${bannerAccent}CC 100%)`,
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
          animation: 'tkFadeSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: bannerDark, background: 'rgba(255,255,255,0.35)', padding: '3px 10px', borderRadius: 20, marginBottom: 8 }}>
              New Tool Unlocked
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: bannerDark, letterSpacing: '-0.3px', marginBottom: 4 }}>
              {bannerTool.icon} {bannerTool.name}
            </div>
            <div style={{ fontSize: 13, color: bannerDark, fontWeight: 500 }}>
              Level {unlockedLevel} tool is now available
            </div>
          </div>
          <button onClick={() => setShowBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 4, position: 'relative', zIndex: 1, display: 'flex', flexShrink: 0 }}>
            <X size={18} color={bannerDark} />
          </button>
        </div>
      )}

      {/* ═══ Tool Cards ═══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {levels.map((lvl, idx) => {
          const tool = getPrimaryTool(lvl);
          if (!tool) return null;
          const meta = LEVEL_META.find(m => m.number === lvl)!;
          const state = getToolState(tool, currentLevel);
          const isLocked = state === 'locked';
          const isAccessible = state === 'unlocked';
          const accent = meta.accentColor;
          const accentDark = meta.accentDark;
          const guide = TOOL_GUIDE[tool.id];
          const isExpanded = expandedTools.has(tool.id);
          const stats = tkData.levelStats.find(s => s.levelNumber === lvl);

          return (
            <div
              key={lvl}
              style={{
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                borderLeft: `4px solid ${accent}`,
                background: '#FFFFFF',
                overflow: 'hidden',
                opacity: isLocked ? 0.6 : 1,
                animation: `tkFadeSlideUp 0.3s ease ${60 + idx * 60}ms both`,
              }}
            >
              {/* ════════════════════════════════════════
                  COLLAPSED — always visible
                 ════════════════════════════════════════ */}
              <div
                style={{ padding: '20px 24px', display: 'flex', gap: 20, cursor: 'pointer' }}
                onClick={() => toggleExpanded(tool.id)}
              >
                {/* LEFT — all metadata */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                  {/* Tool icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0, marginTop: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isLocked ? '#F0F0F0' : `${accent}44`,
                    fontSize: 26,
                  }}>
                    {isLocked ? <Lock size={20} color="#CBD5E0" /> : tool.icon}
                  </div>

                  {/* Text content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Level label + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: accentDark, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                        Level {lvl} · {meta.shortName}
                      </span>
                      {isAccessible && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#276749', background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '1px 8px' }}>
                          Unlocked
                        </span>
                      )}
                    </div>

                    {/* Name + type */}
                    <div style={{ fontSize: 17, fontWeight: 700, color: isLocked ? '#A0AEC0' : '#1A202C', letterSpacing: '-0.2px', lineHeight: 1.25, marginBottom: 2 }}>
                      {tool.name}
                    </div>
                    <div style={{ fontSize: 12, color: isLocked ? '#CBD5E0' : accentDark, fontWeight: 500, fontStyle: 'italic', marginBottom: 8 }}>
                      {tool.toolType}
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: 12, color: isLocked ? '#A0AEC0' : '#4A5568', lineHeight: 1.65 }}>
                      {tool.description}
                    </div>
                  </div>
                </div>

                {/* RIGHT — stats inline + buttons + chevron */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 10 }}>
                  {/* Stats — inline, not in a card */}
                  {isAccessible && stats && (
                    <div style={{ display: 'flex', gap: 16 }}>
                      {[
                        { icon: <FolderOpen size={12} color={accentDark} />, label: 'Artefacts', value: stats.artefactsCreated },
                        { icon: <Star size={12} color="#F6AD55" />, label: 'Points', value: stats.pointsEarned },
                        { icon: <Zap size={12} color="#8B5CF6" />, label: 'Sessions', value: stats.timesUsed },
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                            {s.icon}
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{s.value}</span>
                          </div>
                          <div style={{ fontSize: 9, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Buttons row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Learn more button */}
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggleExpanded(tool.id); }}
                      style={{
                        background: 'transparent', color: isLocked ? '#A0AEC0' : accentDark,
                        border: `1.5px solid ${isLocked ? '#E2E8F0' : accent + '88'}`,
                        borderRadius: 22, padding: '8px 16px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!isLocked) e.currentTarget.style.background = `${accent}20`; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {isExpanded ? 'Less' : 'Learn more'}
                      <ChevronDown size={12} style={{ transition: 'transform 0.25s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>

                    {/* Open / Locked CTA */}
                    {isAccessible ? (
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleOpenTool(tool); }}
                        style={{
                          background: '#1A202C', color: '#FFFFFF', border: 'none',
                          borderRadius: 22, padding: '9px 22px', fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                          flexShrink: 0, fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = '#2D3748'; }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = '#1A202C'; }}
                      >
                        Open <ArrowRight size={13} />
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A0AEC0', fontSize: 12, fontWeight: 600, padding: '9px 14px' }}>
                        <Lock size={13} /> Complete L{lvl - 1}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════
                  EXPANDED — dropdown
                  Left: How To Use It
                  Right: What You'll Create + Points
                 ════════════════════════════════════════ */}
              {guide && (
                <div style={{ maxHeight: isExpanded ? 500 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
                  <div style={{ borderTop: '1px solid #E2E8F0', padding: '20px 24px', display: 'flex', gap: 0, alignItems: 'stretch' }}>
                    {/* Left — How To Use It */}
                    <div style={{ flex: '1 1 55%', minWidth: 0, display: 'flex', flexDirection: 'column', paddingRight: 24, borderRight: '1px solid #F0F0F0' }}>
                      <SectionLabel locked={isLocked}>How To Use It</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {guide.steps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              background: isLocked ? '#F0F0F0' : `${accent}33`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: isLocked ? '#CBD5E0' : accentDark,
                            }}>
                              {i + 1}
                            </div>
                            <span style={{ fontSize: 12, color: isLocked ? '#A0AEC0' : '#4A5568', lineHeight: 1.55, paddingTop: 2 }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right — What You'll Create + Points */}
                    <div style={{ flex: '1 1 45%', minWidth: 0, display: 'flex', flexDirection: 'column', paddingLeft: 24, gap: 16 }}>
                      <div>
                        <SectionLabel locked={isLocked}>What You'll Create</SectionLabel>
                        <div style={{
                          background: isLocked ? '#FAFAFA' : `${accent}12`,
                          border: `1px solid ${isLocked ? '#E2E8F0' : accent + '44'}`,
                          borderRadius: 10, padding: '14px 16px',
                          fontSize: 12, color: isLocked ? '#A0AEC0' : '#4A5568', lineHeight: 1.65,
                        }}>
                          {guide.outcome}
                        </div>
                      </div>

                      {/* Good vs Bad input */}
                      {TOOL_QUALITY_GUIDE[tool.id] && (
                        <div>
                          <SectionLabel locked={isLocked}>What Makes a Good Input</SectionLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Good example */}
                            <div style={{
                              background: isLocked ? '#FAFAFA' : '#F0FFF4',
                              border: `1px solid ${isLocked ? '#E2E8F0' : '#C6F6D5'}`,
                              borderRadius: 10, padding: '10px 14px',
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: isLocked ? '#CBD5E0' : '#276749', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>
                                ✓ {TOOL_QUALITY_GUIDE[tool.id].goodLabel}
                              </div>
                              <div style={{ fontSize: 11, color: isLocked ? '#A0AEC0' : '#2D3748', lineHeight: 1.55, fontStyle: 'italic' }}>
                                "{TOOL_QUALITY_GUIDE[tool.id].goodExample}"
                              </div>
                            </div>
                            {/* Bad example */}
                            <div style={{
                              background: isLocked ? '#FAFAFA' : '#FFF5F5',
                              border: `1px solid ${isLocked ? '#E2E8F0' : '#FEB2B2'}`,
                              borderRadius: 10, padding: '10px 14px',
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: isLocked ? '#CBD5E0' : '#C53030', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>
                                ✗ {TOOL_QUALITY_GUIDE[tool.id].badLabel}
                              </div>
                              <div style={{ fontSize: 11, color: isLocked ? '#A0AEC0' : '#2D3748', lineHeight: 1.55, fontStyle: 'italic' }}>
                                "{TOOL_QUALITY_GUIDE[tool.id].badExample}"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scoring guidance */}
                      {TOOL_QUALITY_GUIDE[tool.id] && (
                        <div>
                          <SectionLabel locked={isLocked}>How Your Artefact Is Scored</SectionLabel>
                          <div style={{
                            background: isLocked ? '#FAFAFA' : '#FFFDF0',
                            border: `1px solid ${isLocked ? '#E2E8F0' : '#F7E8A4'}`,
                            borderRadius: 10, padding: '10px 14px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <Star size={12} color={isLocked ? '#CBD5E0' : '#F6AD55'} style={{ marginTop: 2, flexShrink: 0 }} />
                              <div style={{ fontSize: 11, color: isLocked ? '#A0AEC0' : '#4A5568', lineHeight: 1.6 }}>
                                {TOOL_QUALITY_GUIDE[tool.id].scoringNote}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 12,
          padding: '12px 20px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 30,
          animation: 'tkFadeSlideUp 0.2s ease both',
          maxWidth: 480, textAlign: 'center',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default AppToolkit;
