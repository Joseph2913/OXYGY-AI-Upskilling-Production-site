import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, Check, Lock, ChevronDown, FolderOpen, Star, Zap } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
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

function getToolState(tool: Tool, currentLevel: number): 'unlocked' | 'locked' {
  if (tool.levelRequired <= currentLevel) return 'unlocked';
  return 'locked';
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
  const { userProfile } = useAppContext();
  const currentLevel = userProfile?.currentLevel ?? 1;
  const { data: tkData, loading } = useToolkitData();

  const [showBanner, setShowBanner] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  // Unlock banner from URL param
  useEffect(() => {
    const unlocked = searchParams.get('unlocked');
    if (unlocked) {
      const lvl = parseInt(unlocked, 10);
      if (lvl >= 1 && lvl <= 5) {
        setUnlockedLevel(lvl);
        setShowBanner(true);
      }
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
    if (BUILT_ROUTES.has(tool.route)) {
      navigate(tool.route);
    } else {
      setToastMessage(`${tool.name} is coming soon. You'll be the first to know when it launches.`);
    }
  }, [navigate]);

  const levels = [1, 2, 3, 4, 5];
  const primaryTools = levels.map(lvl => getPrimaryTool(lvl)).filter(Boolean) as Tool[];

  const unlockedCount = primaryTools.filter(t => getToolState(t, currentLevel) === 'unlocked').length;

  // Banner data
  const bannerMeta = unlockedLevel ? LEVEL_META.find(m => m.number === unlockedLevel) : null;
  const bannerTool = unlockedLevel ? getPrimaryTool(unlockedLevel) : null;
  const bannerAccent = bannerMeta?.accentColor ?? '#38B2AC';
  const bannerDark = bannerMeta?.accentDark ?? '#1A7A76';

  // Current level meta for colour coordination
  const currentMeta = LEVEL_META.find(m => m.number === currentLevel)!;

  if (loading || !tkData) {
    return (
      <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{ANIM_STYLE}</style>
        <Skeleton height={40} />
        <div style={{ height: 16 }} />
        <Skeleton height={180} />
        <div style={{ height: 16 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Skeleton height={120} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      padding: '28px 36px', minHeight: '100%',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{ANIM_STYLE}</style>

      {/* ═══ Page Header ═══ */}
      <div style={{
        marginBottom: 28,
        animation: 'tkFadeSlideUp 0.3s ease 0ms both',
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#1A202C',
          letterSpacing: '-0.4px', margin: 0, marginBottom: 6,
        }}>
          My Toolkit
        </h1>
        <p style={{
          fontSize: 14, color: '#718096', lineHeight: 1.6,
          margin: 0, marginBottom: 20,
        }}>
          One powerful tool per level. Build artefacts to earn points on the leaderboard.
        </p>

        {/* ═══ Progress Header Card (mirrors Journey page) ═══ */}
        <div style={{
          background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
          padding: '20px 24px',
        }}>
          {/* Top row: overall stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#718096',
              textTransform: 'uppercase' as const, letterSpacing: '0.07em',
              whiteSpace: 'nowrap',
            }}>
              Tools Unlocked
            </div>
            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(unlockedCount / 5) * 100}%`,
                background: currentMeta.accentDark,
                borderRadius: 6, transition: 'width 0.6s ease',
              }} />
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
                    <div style={{
                      flex: 1, height: 2,
                      background: prevUnlocked ? (prevMeta?.accentDark || '#E2E8F0') : '#E2E8F0',
                    }} />
                  )}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{
                      width: isCurrent ? 30 : 24, height: isCurrent ? 30 : 24,
                      borderRadius: '50%', flexShrink: 0,
                      background: isUnlocked ? lvlMeta.accentColor : '#F7FAFC',
                      border: isUnlocked ? `2px solid ${lvlMeta.accentDark}` : '1.5px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isCurrent ? 14 : 11, fontWeight: 800,
                      color: isUnlocked ? lvlMeta.accentDark : '#A0AEC0',
                      transition: 'all 0.2s ease',
                    }}>
                      {tool?.icon ? <span style={{ fontSize: isCurrent ? 14 : 11 }}>{tool.icon}</span> : lvl}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: isUnlocked ? 700 : 500,
                      color: isUnlocked ? lvlMeta.accentDark : '#A0AEC0',
                      whiteSpace: 'nowrap',
                    }}>
                      {tool?.name ? (tool.name.length > 14 ? tool.name.split(' ')[0] : tool.name) : lvlMeta.shortName}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Stats summary row */}
          <div style={{
            display: 'flex', gap: 0,
            background: '#F7FAFC', borderRadius: 10, overflow: 'hidden',
            border: '1px solid #E2E8F0',
          }}>
            {[
              { icon: <FolderOpen size={14} color={currentMeta.accentDark} />, label: 'Artefacts Created', value: tkData.totalArtefacts },
              { icon: <Star size={14} color="#F6AD55" />, label: 'Points Earned', value: tkData.totalPoints },
              { icon: <Zap size={14} color="#8B5CF6" />, label: 'Total Usage', value: `${tkData.totalUsage} sessions` },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                borderRight: i < 2 ? '1px solid #E2E8F0' : 'none',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: '#FFFFFF', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: '#718096', marginTop: 1 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-level breakdown row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {tkData.levelStats.map(stats => {
              const lvlMeta = LEVEL_META.find(m => m.number === stats.levelNumber)!;
              const tool = getPrimaryTool(stats.levelNumber);
              const isUnlocked = stats.unlocked;
              return (
                <div key={stats.levelNumber} style={{
                  flex: 1, borderRadius: 8,
                  background: isUnlocked ? `${lvlMeta.accentColor}15` : '#FAFBFC',
                  border: `1px solid ${isUnlocked ? lvlMeta.accentColor + '44' : '#E2E8F0'}`,
                  padding: '10px 12px',
                  opacity: isUnlocked ? 1 : 0.5,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: lvlMeta.accentDark,
                    marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    L{stats.levelNumber} · {tool?.name || lvlMeta.shortName}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: '#718096' }}>Artefacts</span>
                      <span style={{ fontWeight: 700, color: '#1A202C' }}>{stats.artefactsCreated}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: '#718096' }}>Points</span>
                      <span style={{ fontWeight: 700, color: '#1A202C' }}>{stats.pointsEarned}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: '#718096' }}>Sessions</span>
                      <span style={{ fontWeight: 700, color: '#1A202C' }}>{stats.timesUsed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
            <div style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700,
              color: bannerDark, background: 'rgba(255,255,255,0.35)',
              padding: '3px 10px', borderRadius: 20, marginBottom: 8,
            }}>
              New Tool Unlocked
            </div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: bannerDark,
              letterSpacing: '-0.3px', marginBottom: 4,
            }}>
              {bannerTool.icon} {bannerTool.name}
            </div>
            <div style={{ fontSize: 13, color: bannerDark, fontWeight: 500 }}>
              Level {unlockedLevel} tool is now available
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              opacity: 0.6, padding: 4, position: 'relative', zIndex: 1,
              display: 'flex', flexShrink: 0,
            }}
          >
            <X size={18} color={bannerDark} />
          </button>
        </div>
      )}

      {/* ═══ Tool Cards — collapsed / expanded ═══ */}
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
                opacity: isLocked ? 0.65 : 1,
                animation: `tkFadeSlideUp 0.3s ease ${60 + idx * 60}ms both`,
              }}
            >
              {/* ════════════════════════════════════════════════
                  COLLAPSED VIEW — always visible
                  Left: level + icon + name + description + capabilities
                  Right: artefacts/points stats + Open CTA + chevron
                 ════════════════════════════════════════════════ */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpanded(tool.id)}
              >
                {/* Left — Tool info */}
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

                  {/* Text block */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row: level label + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: accentDark,
                        textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                      }}>
                        Level {lvl} · {meta.shortName}
                      </span>
                      {isAccessible && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#276749',
                          background: '#F0FFF4', border: '1px solid #C6F6D5',
                          borderRadius: 10, padding: '1px 8px',
                        }}>
                          Unlocked
                        </span>
                      )}
                    </div>

                    {/* Tool name */}
                    <div style={{
                      fontSize: 17, fontWeight: 700, color: isLocked ? '#A0AEC0' : '#1A202C',
                      letterSpacing: '-0.2px', lineHeight: 1.25, marginBottom: 3,
                    }}>
                      {tool.name}
                    </div>

                    {/* Tool type */}
                    <div style={{
                      fontSize: 12, color: isLocked ? '#CBD5E0' : accentDark,
                      fontWeight: 500, fontStyle: 'italic', marginBottom: 6,
                    }}>
                      {tool.toolType}
                    </div>

                    {/* Description */}
                    <div style={{
                      fontSize: 12, color: isLocked ? '#A0AEC0' : '#4A5568', lineHeight: 1.6,
                      marginBottom: 10,
                    }}>
                      {tool.description}
                    </div>

                    {/* Capabilities — inline */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {tool.capabilities.map((cap, i) => (
                        <span key={i} style={{
                          fontSize: 10, fontWeight: 600,
                          color: isLocked ? '#CBD5E0' : '#4A5568',
                          background: isLocked ? '#FAFAFA' : `${accent}15`,
                          border: `1px solid ${isLocked ? '#E2E8F0' : accent + '33'}`,
                          borderRadius: 6, padding: '2px 8px',
                          whiteSpace: 'nowrap',
                        }}>
                          <Check size={8} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          {cap.length > 45 ? cap.slice(0, 42) + '…' : cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — Stats + CTA + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  {/* Artefacts + points mini stat */}
                  {isAccessible && stats && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                      background: '#F7FAFC', border: '1px solid #E2E8F0',
                      borderRadius: 10, padding: '10px 16px',
                      minWidth: 110,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FolderOpen size={11} color={accentDark} />
                        <span style={{ fontSize: 11, color: '#718096' }}>Artefacts</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1A202C', marginLeft: 'auto' }}>{stats.artefactsCreated}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={11} color="#F6AD55" />
                        <span style={{ fontSize: 11, color: '#718096' }}>Points</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1A202C', marginLeft: 'auto' }}>{stats.pointsEarned}</span>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  {isAccessible ? (
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleOpenTool(tool); }}
                      style={{
                        background: '#1A202C', color: '#FFFFFF', border: 'none',
                        borderRadius: 24, padding: '10px 22px', fontSize: 13, fontWeight: 700,
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
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: '#A0AEC0', fontSize: 12, fontWeight: 600,
                      padding: '10px 16px',
                    }}>
                      <Lock size={13} /> Complete L{lvl - 1}
                    </div>
                  )}

                  {/* Expand chevron */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: isExpanded ? `${accent}25` : '#F7FAFC',
                    border: `1px solid ${isExpanded ? accent + '55' : '#E2E8F0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s ease',
                  }}>
                    <ChevronDown size={14} color={isExpanded ? accentDark : '#718096'} style={{
                      transition: 'transform 0.25s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }} />
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════
                  EXPANDED VIEW
                  Left: How To Use It (steps)
                  Right: What You'll Create (outcome)
                 ════════════════════════════════════════════════ */}
              {guide && (
                <div style={{
                  maxHeight: isExpanded ? 500 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease',
                }}>
                  <div style={{
                    borderTop: '1px solid #E2E8F0',
                    padding: '20px 24px',
                    display: 'flex',
                    gap: 0,
                    alignItems: 'stretch',
                  }}>
                    {/* Left — How To Use It */}
                    <div style={{
                      flex: '1 1 55%', minWidth: 0,
                      display: 'flex', flexDirection: 'column',
                      paddingRight: 24,
                      borderRight: '1px solid #F0F0F0',
                    }}>
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
                            <span style={{
                              fontSize: 12, color: isLocked ? '#A0AEC0' : '#4A5568',
                              lineHeight: 1.55, paddingTop: 2,
                            }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right — What You'll Create */}
                    <div style={{
                      flex: '1 1 45%', minWidth: 0,
                      display: 'flex', flexDirection: 'column',
                      paddingLeft: 24,
                    }}>
                      <SectionLabel locked={isLocked}>What You'll Create</SectionLabel>
                      <div style={{
                        background: isLocked ? '#FAFAFA' : `${accent}12`,
                        border: `1px solid ${isLocked ? '#E2E8F0' : accent + '44'}`,
                        borderRadius: 10, padding: '14px 16px',
                        fontSize: 12, color: isLocked ? '#A0AEC0' : '#4A5568',
                        lineHeight: 1.65, marginBottom: 16,
                      }}>
                        {guide.outcome}
                      </div>

                      {/* Points explanation */}
                      <SectionLabel locked={isLocked}>Points & Leaderboard</SectionLabel>
                      <div style={{
                        background: isLocked ? '#FAFAFA' : '#FFFDF0',
                        border: `1px solid ${isLocked ? '#E2E8F0' : '#F7E8A4'}`,
                        borderRadius: 10, padding: '12px 16px',
                        fontSize: 11.5, color: isLocked ? '#A0AEC0' : '#4A5568',
                        lineHeight: 1.55,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Star size={12} color={isLocked ? '#CBD5E0' : '#F6AD55'} />
                          <span style={{ fontWeight: 700, color: isLocked ? '#CBD5E0' : '#1A202C' }}>
                            Earn points for every artefact
                          </span>
                        </div>
                        Each artefact you create is scored on quality, completeness, and relevance. Higher-quality work earns more points, which contribute directly to your leaderboard ranking.
                      </div>
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