import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ArrowRight, Lock } from 'lucide-react';
import { LEVEL_META } from '../../data/levelTopics';
import { LEVEL_TOPICS } from '../../data/levelTopics';
import { getPrimaryTool } from '../../data/toolkitData';
import { LEVELS } from '../../data/content';
import { LevelProgress } from '../../hooks/useJourneyData';
import { TOPIC_SVGS } from './TopicSvgs';

interface LevelCardProps {
  level: LevelProgress;
  animDelay: number;
}

/* ── Phase step data ── */
const PHASE_STEPS = [
  { label: 'E-Learning', shortLabel: 'E-Learn' },
  { label: 'Read', shortLabel: 'Read' },
  { label: 'Watch', shortLabel: 'Watch' },
  { label: 'Practise', shortLabel: 'Practise' },
];

/* ── Connected sequential phase stepper ── */
const PhaseStepper: React.FC<{
  accent: string;
  accentDark: string;
  isCompleted: boolean;
  isActive: boolean;
  currentPhase: number;
}> = ({ accent, accentDark, isCompleted, isActive, currentPhase }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    {PHASE_STEPS.map((step, i) => {
      const phaseNum = i + 1;
      const isDone = isCompleted || (isActive && phaseNum < currentPhase);
      const isCurrent = isActive && phaseNum === currentPhase;
      return (
        <React.Fragment key={step.label}>
          {i > 0 && (
            <div style={{
              flex: 1, height: 2,
              background: isDone ? accent : '#E2E8F0',
              flexShrink: 0, minWidth: 8,
            }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: isDone ? accent : isCurrent ? '#FFFFFF' : '#F7FAFC',
              border: isDone ? 'none' : isCurrent ? `2px solid ${accent}` : '1.5px solid #E2E8F0',
              transition: 'all 0.2s ease',
            }}>
              {isDone ? (
                <Check size={10} strokeWidth={3} color={accentDark} />
              ) : isCurrent ? (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent }} />
              ) : (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#CBD5E0' }} />
              )}
            </div>
            <span style={{
              fontSize: 9, fontWeight: isDone || isCurrent ? 700 : 500,
              color: isDone ? accentDark : isCurrent ? accentDark : '#A0AEC0',
              whiteSpace: 'nowrap',
            }}>
              {step.shortLabel}
            </span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

/* ── Section label ── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 9, fontWeight: 700, color: '#718096',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
  }}>
    {children}
  </div>
);

/* ── Tag chip ── */
const TagChip: React.FC<{ label: string; accent?: string; accentDark?: string }> = ({ label, accent, accentDark }) => (
  <span style={{
    fontSize: 10, fontWeight: 600,
    color: accentDark || '#4A5568',
    background: accent ? `${accent}20` : '#F7FAFC',
    border: `1px solid ${accent ? accent + '44' : '#E2E8F0'}`,
    borderRadius: 6, padding: '2px 8px',
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

/* ── Main Level Card ── */
export const LevelCard: React.FC<LevelCardProps> = ({ level, animDelay }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [toolExpanded, setToolExpanded] = useState(false);
  const meta = LEVEL_META.find(m => m.number === level.levelNumber)!;
  const marketingData = LEVELS.find(l => l.id === level.levelNumber);
  const accent = meta.accentColor;
  const accentDark = meta.accentDark;
  const topics = LEVEL_TOPICS[level.levelNumber] || [];
  const topic = topics[0];
  const primaryTool = getPrimaryTool(level.levelNumber);
  const SvgIllustration = topic ? TOPIC_SVGS[`${level.levelNumber}-${topic.id}`] : null;

  const isCompleted = level.status === 'completed';
  const isActive = level.status === 'active';
  const isAccessible = isCompleted || isActive;

  const completionDate = level.completedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(level.completedAt)
    : null;

  const statusLabel = isCompleted ? '✓ Complete'
    : isActive ? '● In Progress'
    : 'Locked';
  const statusBg = isCompleted ? '#F0FFF4'
    : isActive ? `${accent}30`
    : '#F7FAFC';
  const statusColor = isCompleted ? '#276749' : isActive ? accentDark : '#A0AEC0';
  const statusBorder = isCompleted ? '#C6F6D5'
    : isActive ? `${accent}88`
    : '#E2E8F0';

  const description = marketingData?.descriptionExpanded || meta.tagline;

  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${accent}`,
        background: '#FFFFFF',
        overflow: 'hidden',
        animation: `journeyFadeSlideUp 0.3s ease ${animDelay}ms both`,
      }}
    >
      {/* ── Status badge — top right ── */}
      <div style={{
        padding: '14px 22px 0',
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
      }}>
        {completionDate && (
          <span style={{ fontSize: 10, color: '#718096' }}>{completionDate}</span>
        )}
        <div style={{
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 16, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: statusColor,
          whiteSpace: 'nowrap',
        }}>
          {statusLabel}
        </div>
      </div>

      {/* ── Two-half body ── */}
      <div style={{
        padding: '8px 22px 20px',
        display: 'flex',
        gap: 0,
        alignItems: 'stretch',
      }}>
        {/* ═══════════════════════════════════════════════════════════════
            LEFT HALF — About the level
            Level number, title, description, core topics, audience, tools
           ═══════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '1 1 50%', minWidth: 0,
          display: 'flex', flexDirection: 'column',
          paddingRight: 22,
          borderRight: '1px solid #F0F0F0',
        }}>
          {/* Level badge + title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: isCompleted ? `${accent}55` : isActive ? accent : `${accent}33`,
              border: isActive ? 'none' : `1px solid ${accent}88`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: accentDark,
            }}>
              {isCompleted ? <Check size={18} color={accentDark} /> : level.levelNumber}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: accentDark,
                textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2,
              }}>
                Level {level.levelNumber}
              </div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: '#1A202C',
                letterSpacing: '-0.2px', lineHeight: 1.25,
              }}>
                {meta.name}
              </div>
              {marketingData?.tagline && (
                <div style={{ fontSize: 12, color: accentDark, fontWeight: 500, marginTop: 2, fontStyle: 'italic' }}>
                  {marketingData.tagline}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.65, marginBottom: 16 }}>
            {description}
          </div>

          {/* Core Topics */}
          {marketingData?.topics && marketingData.topics.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionLabel>Core Topics</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {marketingData.topics.map(t => (
                  <TagChip key={t} label={t} accent={accent} accentDark={accentDark} />
                ))}
              </div>
            </div>
          )}

          {/* Target Audience */}
          {marketingData?.targetAudience && marketingData.targetAudience.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionLabel>Target Audience</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {marketingData.targetAudience.map(a => (
                  <TagChip key={a} label={a} />
                ))}
              </div>
            </div>
          )}

          {/* Key Tools */}
          {marketingData?.keyTools && marketingData.keyTools.length > 0 && (
            <div>
              <SectionLabel>Key Tools</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {marketingData.keyTools.map(k => (
                  <TagChip key={k} label={k} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT HALF — Training topic & progress
            Topic card (full-height, left) | Phases + Toolkit + CTA (right)
           ═══════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '1 1 50%', minWidth: 0,
          display: 'flex', gap: 16,
          paddingLeft: 22,
        }}>
          {/* Topic card — full height, wider */}
          {topic && (
            <div style={{
              flex: '0 0 300px',
              background: '#FAFBFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                flex: '0 0 100px',
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${accent}25 0%, ${accent}08 100%)`,
              }}>
                {SvgIllustration ? (
                  <SvgIllustration accent={accent} accentDark={accentDark} active={false} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, opacity: 0.5,
                  }}>
                    {topic.icon}
                  </div>
                )}
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(255,255,255,0.92)', borderRadius: 7,
                  padding: '2px 7px', fontSize: 9, fontWeight: 600, color: '#4A5568',
                }}>
                  {topic.estimatedMinutes} min
                </div>
              </div>
              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 3, lineHeight: 1.25 }}>
                  {topic.title}
                </div>
                <div style={{ fontSize: 11, color: accentDark, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>
                  {topic.subtitle}
                </div>
                <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.55, marginBottom: 10 }}>
                  {topic.description}
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    background: `${accent}20`, border: `1px solid ${accent}55`,
                    borderRadius: 8, cursor: 'pointer', padding: '6px 12px',
                    fontSize: 11, fontWeight: 600, color: accentDark, marginTop: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${accent}35`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${accent}20`; }}
                >
                  {expanded ? 'Hide details' : 'View phase details'}
                  <ChevronDown size={11} style={{
                    transition: 'transform 0.2s ease',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} />
                </button>
              </div>
            </div>
          )}

          {/* Right sub-column: phases, toolkit, CTA */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Learning Phases */}
            {topic && (
              <div style={{ marginBottom: 14 }}>
                <SectionLabel>Learning Phases</SectionLabel>
                <PhaseStepper
                  accent={accent}
                  accentDark={accentDark}
                  isCompleted={isCompleted}
                  isActive={isActive}
                  currentPhase={level.currentPhase}
                />
              </div>
            )}

            {/* Toolkit — single prominent tool */}
            {primaryTool && (
              <div style={{ marginBottom: 12 }}>
                <SectionLabel>Toolkit</SectionLabel>
                <div style={{
                  borderRadius: 10,
                  background: isAccessible ? `${primaryTool.accentColor}15` : '#FAFAFA',
                  border: `1.5px solid ${isAccessible ? primaryTool.accentColor + '66' : '#E2E8F0'}`,
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}>
                  {/* Tool header row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                  }}>
                    <span style={{ fontSize: 22 }}>{primaryTool.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isAccessible ? '#1A202C' : '#A0AEC0' }}>
                        {primaryTool.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#718096', lineHeight: 1.3, marginTop: 1 }}>
                        {primaryTool.toolType}
                      </div>
                    </div>
                    {/* Learn more toggle */}
                    <button
                      onClick={() => setToolExpanded(!toolExpanded)}
                      style={{
                        background: `${accent}20`, border: `1px solid ${accent}44`,
                        borderRadius: 6, cursor: 'pointer', padding: '4px 10px',
                        fontSize: 10, fontWeight: 600, color: accentDark,
                        display: 'flex', alignItems: 'center', gap: 3,
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${accent}35`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${accent}20`; }}
                    >
                      {toolExpanded ? 'Less' : 'Learn more'}
                      <ChevronDown size={9} style={{
                        transition: 'transform 0.2s ease',
                        transform: toolExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }} />
                    </button>
                    {isAccessible && (
                      <button
                        onClick={() => navigate(primaryTool.route)}
                        style={{
                          background: accentDark, color: '#FFFFFF', border: 'none',
                          borderRadius: 6, cursor: 'pointer', padding: '5px 12px',
                          fontSize: 11, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 4,
                          transition: 'opacity 0.15s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        Open <ArrowRight size={11} />
                      </button>
                    )}
                  </div>

                  {/* Expandable detail */}
                  <div style={{
                    maxHeight: toolExpanded ? 300 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.25s ease',
                  }}>
                    <div style={{
                      padding: '0 14px 12px',
                      borderTop: `1px solid ${accent}33`,
                      paddingTop: 10,
                    }}>
                      <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.55, marginBottom: 8 }}>
                        {primaryTool.description}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {primaryTool.capabilities.map((cap, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <div style={{
                              width: 4, height: 4, borderRadius: '50%',
                              background: accentDark, flexShrink: 0, marginTop: 5,
                            }} />
                            <span style={{ fontSize: 10.5, color: '#4A5568', lineHeight: 1.4 }}>
                              {cap}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA — bottom right */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {/* Learn more button — always visible */}
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'transparent', color: accentDark, border: `1px solid ${accent}66`,
                  borderRadius: 20, padding: '8px 18px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${accent}20`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {expanded ? 'Less' : 'Learn more'}
                <ChevronDown size={12} style={{
                  transition: 'transform 0.2s ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
              </button>
              {isActive && (
                <button
                  onClick={() => navigate('/app/level')}
                  style={{
                    background: '#38B2AC', color: '#FFFFFF', border: 'none',
                    borderRadius: 20, padding: '8px 20px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2D9E99')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#38B2AC')}
                >
                  Continue <ArrowRight size={12} />
                </button>
              )}
              {isCompleted && (
                <button
                  onClick={() => navigate('/app/level')}
                  style={{
                    background: 'transparent', color: '#1A202C', border: '1px solid #E2E8F0',
                    borderRadius: 20, padding: '8px 20px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F7FAFC'; e.currentTarget.style.borderColor = '#CBD5E0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  Review <ArrowRight size={12} />
                </button>
              )}
              {!isAccessible && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: '#A0AEC0', fontSize: 11, fontWeight: 600,
                }}>
                  <Lock size={12} /> Locked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expandable phase details ── */}
      {topic && (
        <div style={{
          maxHeight: expanded ? 500 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}>
          <div style={{
            borderTop: '1px solid #E2E8F0',
            padding: '14px 22px',
            background: '#FAFBFC',
          }}>
            <div style={{ fontSize: 11.5, color: '#4A5568', lineHeight: 1.6, marginBottom: 12 }}>
              {topic.description}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {topic.phases.map(phase => (
                <div key={phase.label} style={{
                  flex: '1 1 200px',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '8px 10px', background: '#FFFFFF',
                  border: '1px solid #E2E8F0', borderRadius: 8,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: accentDark,
                  }}>
                    {phase.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1A202C', marginBottom: 1 }}>
                      {phase.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#718096', lineHeight: 1.45 }}>
                      {phase.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
