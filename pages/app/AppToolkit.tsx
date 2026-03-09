import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, Check, Lock, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ALL_TOOLS, Tool, getPrimaryTool } from '../../data/toolkitData';
import { LEVEL_META } from '../../data/levelTopics';

const ANIM_STYLE = `
@keyframes tkFadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tkFadeSlideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
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
      'Define your end user — who they are and what decisions they make',
      'Work backwards from what they need to see on screen',
      'Drag and drop dashboard components to build your layout',
      'Connect panels to AI workflow outputs and data sources',
      'Configure role-based views for different user types',
    ],
    outcome: 'A working dashboard prototype with AI-powered panels, role-based views, and connected data — ready for user testing and development handoff.',
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

function getToolState(tool: Tool, currentLevel: number): 'unlocked' | 'in-progress' | 'locked' {
  if (tool.levelRequired <= currentLevel) return 'unlocked';
  return 'locked';
}

const AppToolkit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile } = useAppContext();
  const currentLevel = userProfile?.currentLevel ?? 1;

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

  const unlockedCount = primaryTools.filter(t => {
    const s = getToolState(t, currentLevel);
    return s === 'unlocked' || s === 'in-progress';
  }).length;

  // Banner data
  const bannerMeta = unlockedLevel ? LEVEL_META.find(m => m.number === unlockedLevel) : null;
  const bannerTool = unlockedLevel ? getPrimaryTool(unlockedLevel) : null;
  const bannerAccent = bannerMeta?.accentColor ?? '#38B2AC';
  const bannerDark = bannerMeta?.accentDark ?? '#1A7A76';

  return (
    <div style={{
      padding: '28px 36px', minHeight: '100%',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{ANIM_STYLE}</style>

      {/* Page Header */}
      <div style={{
        marginBottom: 24,
        animation: 'tkFadeSlideUp 0.3s ease 0ms both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: '#1A202C',
              letterSpacing: '-0.4px', margin: 0, marginBottom: 5,
            }}>
              My Toolkit
            </h1>
            <p style={{
              fontSize: 14, color: '#718096', lineHeight: 1.6, margin: 0,
            }}>
              One powerful tool per level. Each tool unlocks as you complete the level before it.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <StatPill label={`${unlockedCount} of 5 Unlocked`} teal={unlockedCount > 0} />
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

      {/* Tool Cards — one per level, full width */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {levels.map((lvl, idx) => {
          const tool = getPrimaryTool(lvl);
          if (!tool) return null;
          const meta = LEVEL_META.find(m => m.number === lvl)!;
          const state = getToolState(tool, currentLevel);
          const isLocked = state === 'locked';
          const isAccessible = state === 'unlocked' || state === 'in-progress';
          const accent = meta.accentColor;
          const accentDark = meta.accentDark;
          const guide = TOOL_GUIDE[tool.id];
          const isExpanded = expandedTools.has(tool.id);

          const statusLabel = state === 'unlocked' ? '✓ Unlocked'
            : state === 'in-progress' ? '● In Progress'
            : 'Locked';
          const statusBg = state === 'unlocked' ? '#F0FFF4'
            : state === 'in-progress' ? `${accent}30`
            : '#F7FAFC';
          const statusColor = state === 'unlocked' ? '#276749'
            : state === 'in-progress' ? accentDark : '#A0AEC0';
          const statusBorder = state === 'unlocked' ? '#C6F6D5'
            : state === 'in-progress' ? `${accent}88`
            : '#E2E8F0';

          return (
            <div
              key={lvl}
              style={{
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                borderLeft: `4px solid ${accent}`,
                background: '#FFFFFF',
                overflow: 'hidden',
                opacity: isLocked ? 0.7 : 1,
                animation: `tkFadeSlideUp 0.3s ease ${60 + idx * 60}ms both`,
              }}
            >
              {/* Header row */}
              <div style={{
                padding: '16px 22px 0',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: `${accent}55`, border: `1px solid ${accent}88`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: accentDark,
                  }}>
                    {lvl}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#718096' }}>
                    Level {lvl} · {meta.shortName}
                  </span>
                </div>
                <div style={{
                  background: statusBg, border: `1px solid ${statusBorder}`,
                  borderRadius: 16, padding: '3px 12px', fontSize: 11, fontWeight: 700,
                  color: statusColor, whiteSpace: 'nowrap',
                }}>
                  {statusLabel}
                </div>
              </div>

              {/* Main content — two columns */}
              <div style={{
                padding: '14px 22px 18px',
                display: 'flex', gap: 24, alignItems: 'stretch',
              }}>
                {/* Left — tool info */}
                <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isLocked ? '#F0F0F0' : `${accent}44`,
                      fontSize: 26,
                    }}>
                      {isLocked ? <Lock size={20} color="#CBD5E0" /> : tool.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: isLocked ? '#A0AEC0' : '#1A202C', letterSpacing: '-0.2px' }}>
                        {tool.name}
                      </div>
                      <div style={{ fontSize: 11, color: isLocked ? '#A0AEC0' : '#718096', marginTop: 1 }}>
                        {tool.toolType}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: 12.5, color: isLocked ? '#A0AEC0' : '#4A5568',
                    lineHeight: 1.65, marginBottom: 14,
                  }}>
                    {tool.description}
                  </div>

                  {/* Capabilities */}
                  <SectionLabel locked={isLocked}>What You Can Do</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                    {tool.capabilities.map((cap, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <Check size={12} color={isLocked ? '#CBD5E0' : accentDark} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: isLocked ? '#A0AEC0' : '#4A5568', lineHeight: 1.5 }}>{cap}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA buttons */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    {isAccessible && (
                      <button
                        onClick={() => handleOpenTool(tool)}
                        style={{
                          background: accentDark, color: '#FFFFFF', border: 'none',
                          borderRadius: 20, padding: '9px 22px', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', transition: 'opacity 0.15s',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        Open Tool <ArrowRight size={13} />
                      </button>
                    )}
                    {isLocked && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        color: '#A0AEC0', fontSize: 12, fontWeight: 600,
                      }}>
                        <Lock size={13} /> Complete Level {lvl - 1} to unlock
                      </div>
                    )}
                  </div>
                </div>

                {/* Right — steps & outcome */}
                {guide && (
                  <div style={{
                    flex: '1 1 50%', minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    paddingLeft: 22,
                    borderLeft: '1px solid #F0F0F0',
                  }}>
                    {/* How to use */}
                    <SectionLabel locked={isLocked}>How To Use It</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {guide.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            background: isLocked ? '#F0F0F0' : `${accent}33`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, color: isLocked ? '#CBD5E0' : accentDark,
                          }}>
                            {i + 1}
                          </div>
                          <span style={{
                            fontSize: 11.5, color: isLocked ? '#A0AEC0' : '#4A5568',
                            lineHeight: 1.5, paddingTop: 2,
                          }}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Outcome */}
                    <SectionLabel locked={isLocked}>What You'll Create</SectionLabel>
                    <div style={{
                      background: isLocked ? '#FAFAFA' : `${accent}12`,
                      border: `1px solid ${isLocked ? '#E2E8F0' : accent + '44'}`,
                      borderRadius: 10, padding: '12px 14px',
                      fontSize: 11.5, color: isLocked ? '#A0AEC0' : '#4A5568',
                      lineHeight: 1.6,
                    }}>
                      {guide.outcome}
                    </div>
                  </div>
                )}
              </div>
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

/* ── Stat Pill ── */
const StatPill: React.FC<{ label: string; teal?: boolean }> = ({ label, teal }) => (
  <div style={{
    padding: '6px 14px', borderRadius: 20,
    fontSize: 12, fontWeight: 600,
    background: teal ? '#E6FFFA' : '#FFFFFF',
    border: `1px solid ${teal ? '#38B2AC' : '#E2E8F0'}`,
    color: teal ? '#1A7A76' : '#4A5568',
    whiteSpace: 'nowrap',
  }}>
    {label}
  </div>
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

export default AppToolkit;
