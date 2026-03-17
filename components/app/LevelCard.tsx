import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ArrowRight, Lock, Play, FileText, Video, PenTool } from 'lucide-react';
import { LEVEL_META } from '../../data/levelTopics';
import { LEVEL_TOPICS } from '../../data/levelTopics';
import { getPrimaryTool } from '../../data/toolkitData';
import { LEVELS } from '../../data/content';
import { LevelProgress } from '../../hooks/useJourneyData';
import { TOPIC_SVGS } from './TopicSvgs';
import { ActivityTracker } from './journey/ActivityTracker';
import { ProjectBriefSection } from './journey/ProjectBriefSection';

interface LevelCardProps {
  level: LevelProgress;
  animDelay: number;
  projectTitle?: string | null;
  deliverable?: string | null;
}

/* ── Phase step data with tooltips ── */
const PHASE_STEPS = [
  { label: 'E-Learning', shortLabel: 'E-Learn', icon: <Play size={11} /> },
  { label: 'Read', shortLabel: 'Read', icon: <FileText size={11} /> },
  { label: 'Watch', shortLabel: 'Watch', icon: <Video size={11} /> },
  { label: 'Practise', shortLabel: 'Practise', icon: <PenTool size={11} /> },
];

/* ── Tooltip CSS (injected once) ── */
const tooltipStyle = `
.phase-step-tooltip {
  position: relative;
}
.phase-step-tooltip .phase-tooltip-text {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1A202C;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.45;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: normal;
  width: 200px;
  z-index: 20;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.phase-step-tooltip .phase-tooltip-text::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #1A202C transparent transparent transparent;
}
.phase-step-tooltip:hover .phase-tooltip-text {
  visibility: visible;
  opacity: 1;
}
`;

/* ── Learning phases stepper with hover tooltips ── */
const PhaseStepperWithTooltips: React.FC<{
  accent: string;
  accentDark: string;
  isCompleted: boolean;
  isActive: boolean;
  currentPhase: number;
  phaseDetails: { label: string; detail: string }[];
}> = ({ accent, accentDark, isCompleted, isActive, currentPhase, phaseDetails }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
    {PHASE_STEPS.map((step, i) => {
      const phaseNum = i + 1;
      const isDone = isCompleted || (isActive && phaseNum < currentPhase);
      const isCurrent = isActive && phaseNum === currentPhase;
      const detail = phaseDetails[i]?.detail || '';
      return (
        <React.Fragment key={step.label}>
          {i > 0 && (
            <div style={{
              flex: 1, height: 2, marginTop: 14,
              background: isDone ? accent : '#E2E8F0',
              flexShrink: 0, minWidth: 12,
            }} />
          )}
          <div className="phase-step-tooltip" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            cursor: 'default',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: isDone ? accent : isCurrent ? '#FFFFFF' : '#F7FAFC',
              border: isDone ? 'none' : isCurrent ? `2.5px solid ${accent}` : '1.5px solid #E2E8F0',
              transition: 'all 0.2s ease',
            }}>
              {isDone ? (
                <Check size={12} strokeWidth={3} color={accentDark} />
              ) : isCurrent ? (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CBD5E0' }} />
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: isDone || isCurrent ? 700 : 500,
              color: isDone ? accentDark : isCurrent ? accentDark : '#A0AEC0',
              whiteSpace: 'nowrap',
            }}>
              {step.shortLabel}
            </span>
            {/* Tooltip */}
            <div className="phase-tooltip-text">
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{step.label}</div>
              {detail}
            </div>
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

/* ── Fixed dimensions for topic mini-cards ── */
const TOPIC_CARD_WIDTH = 280;
const TOPIC_CARD_ICON_SIZE = 48;

/* ════════════════════════════════════════════════
   MAIN LEVEL CARD
   ════════════════════════════════════════════════ */
export const LevelCard: React.FC<LevelCardProps> = ({ level, animDelay, projectTitle, deliverable }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
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
  const isProjectPending = level.status === 'project-pending';
  const isLocked = level.status === 'not-started' && level.completedTopics === 0 && level.levelNumber > 1;
  const isAccessible = true; // All levels accessible

  const completionDate = level.completedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(level.completedAt)
    : null;

  const ctaLabel = isCompleted ? 'Review' : isActive ? 'Continue' : 'Start';
  const description = marketingData?.descriptionCollapsed || meta.tagline;

  return (
    <div
      style={{
        borderRadius: 14,
        border: isProjectPending ? `1px solid ${accent}88` : '1px solid #E2E8F0',
        borderLeft: `4px solid ${isProjectPending ? accent : accent}`,
        background: '#FFFFFF',
        overflow: 'hidden',
        cursor: 'pointer',
        animation: `journeyFadeSlideUp 0.3s ease ${animDelay}ms both`,
      }}
    >
      <style>{tooltipStyle}</style>

      {/* ════════════════════════════════════════════════
          COLLAPSED VIEW — always visible
          Left: tick + title + tagline + description
          Right: topic card (fixed size) + CTA
         ════════════════════════════════════════════════ */}
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left — Level badge + title + description */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
          {/* Level circle */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            background: isCompleted ? `${accent}55` : isActive ? accent : `${accent}33`,
            border: isCompleted ? 'none' : isActive ? 'none' : `1px solid ${accent}88`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: accentDark,
          }}>
            {isCompleted ? <Check size={18} color={accentDark} strokeWidth={3} /> : isAccessible ? level.levelNumber : <Lock size={15} color="#A0AEC0" />}
          </div>

          {/* Title + description block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top row: Level label + status badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: accentDark,
                textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              }}>
                Level {level.levelNumber}
              </span>
              {completionDate && (
                <span style={{ fontSize: 10, color: '#A0AEC0' }}>{completionDate}</span>
              )}
              {/* Activity tracker for active/project-pending/completed */}
              {(isActive || isProjectPending || isCompleted) && (
                <ActivityTracker
                  elearningDone={level.completedTopics === level.totalTopics && level.totalTopics > 0}
                  toolkitDone={level.toolUsed}
                  workshopDone={level.workshopAttended}
                  projectDone={level.projectCompleted}
                  accentColor={accent}
                  accentDark={accentDark}
                />
              )}
              {isCompleted && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#276749',
                  background: '#F0FFF4', border: '1px solid #C6F6D5',
                  borderRadius: 10, padding: '1px 8px',
                }}>
                  Complete
                </span>
              )}
              {isProjectPending && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#92400E',
                  background: '#FEFCE8', border: '1px solid #FDE68A',
                  borderRadius: 20, padding: '4px 12px',
                }}>
                  Project Pending
                </span>
              )}
              {isActive && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: accentDark,
                  background: `${accent}30`, border: `1px solid ${accent}88`,
                  borderRadius: 10, padding: '1px 8px',
                }}>
                  In Progress
                </span>
              )}
            </div>

            {/* Title */}
            <div style={{
              fontSize: 17, fontWeight: 700, color: '#1A202C',
              letterSpacing: '-0.2px', lineHeight: 1.25, marginBottom: 3,
            }}>
              {meta.name}
            </div>

            {/* Tagline */}
            {marketingData?.tagline && (
              <div style={{ fontSize: 12, color: accentDark, fontWeight: 500, fontStyle: 'italic', marginBottom: 6 }}>
                {marketingData.tagline}
              </div>
            )}

            {/* Description */}
            <div style={{
              fontSize: 12, color: '#4A5568', lineHeight: 1.6,
            }}>
              {description}
            </div>
          </div>
        </div>

        {/* Right — Topic card (fixed size) + CTA + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {/* Topic card — fixed dimensions */}
          {topic && (
            <div style={{
              width: TOPIC_CARD_WIDTH,
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#FAFBFC', border: '1px solid #E2E8F0',
              borderRadius: 10, padding: '10px 16px',
            }}>
              {/* SVG illustration */}
              <div style={{
                width: TOPIC_CARD_ICON_SIZE, height: TOPIC_CARD_ICON_SIZE,
                borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                background: `linear-gradient(135deg, ${accent}25 0%, ${accent}08 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {SvgIllustration ? (
                  <SvgIllustration accent={accent} accentDark={accentDark} active={false} />
                ) : (
                  <span style={{ fontSize: 22 }}>{topic.icon}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#1A202C', lineHeight: 1.3,
                  marginBottom: 2,
                }}>
                  {topic.title}
                </div>
                <div style={{ fontSize: 10.5, color: '#718096', lineHeight: 1.4 }}>
                  {topic.subtitle}
                </div>
                <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 3 }}>
                  {topic.estimatedMinutes} min
                </div>
              </div>
            </div>
          )}

          {/* CTA button */}
          {isAccessible ? (
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate('/app/level'); }}
              style={{
                background: isActive ? '#1A202C' : 'transparent',
                color: isActive ? '#FFFFFF' : '#1A202C',
                border: isActive ? 'none' : '1.5px solid #E2E8F0',
                borderRadius: 24, padding: '10px 22px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                flexShrink: 0, fontFamily: 'inherit',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (isActive) e.currentTarget.style.background = '#2D3748';
                else { e.currentTarget.style.background = '#F7FAFC'; e.currentTarget.style.borderColor = '#CBD5E0'; }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (isActive) e.currentTarget.style.background = '#1A202C';
                else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E2E8F0'; }
              }}
            >
              {ctaLabel} <ArrowRight size={13} />
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#A0AEC0', fontSize: 12, fontWeight: 600,
              padding: '10px 16px',
            }}>
              <Lock size={13} /> Locked
            </div>
          )}

          {/* Expand chevron */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: expanded ? `${accent}25` : '#F7FAFC',
            border: `1px solid ${expanded ? accent + '55' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s ease',
          }}>
            <ChevronDown size={14} color={expanded ? accentDark : '#718096'} style={{
              transition: 'transform 0.25s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PROJECT BRIEF SECTION
         ════════════════════════════════════════════════ */}
      <div style={{ padding: '0 24px 16px' }}>
        <ProjectBriefSection
          level={level.levelNumber}
          isLocked={isLocked}
          projectTitle={projectTitle || null}
          deliverable={deliverable || null}
          projectSubmission={level.projectSubmission}
          accentColor={accent}
          accentDark={accentDark}
        />
      </div>

      {/* ════════════════════════════════════════════════
          EXPANDED VIEW
          Left: Core Topics, Target Audience, Key Tools
          Right: Learning Phases (with tooltips), Toolkit
         ════════════════════════════════════════════════ */}
      <div style={{
        maxHeight: expanded ? 500 : 0,
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
          {/* ── LEFT HALF ── */}
          <div style={{
            flex: '1 1 55%', minWidth: 0,
            display: 'flex', flexDirection: 'column',
            paddingRight: 24,
            borderRight: '1px solid #F0F0F0',
            gap: 14,
          }}>
            {/* Core Topics */}
            {marketingData?.topics && marketingData.topics.length > 0 && (
              <div>
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
              <div>
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

          {/* ── RIGHT HALF ── */}
          <div style={{
            flex: '1 1 45%', minWidth: 0,
            display: 'flex', flexDirection: 'column',
            paddingLeft: 24,
            gap: 18,
          }}>
            {/* Learning Phases — with hover tooltips */}
            {topic && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <SectionLabel>Learning Phases</SectionLabel>
                  <span style={{
                    fontSize: 9, color: '#A0AEC0', fontWeight: 500, fontStyle: 'italic',
                    marginBottom: 6,
                  }}>
                    Hover for details
                  </span>
                </div>
                <PhaseStepperWithTooltips
                  accent={accent}
                  accentDark={accentDark}
                  isCompleted={isCompleted}
                  isActive={isActive}
                  currentPhase={level.currentPhase}
                  phaseDetails={topic.phases}
                />
              </div>
            )}

            {/* Toolkit — primary tool only */}
            {primaryTool && (
              <div>
                <SectionLabel>Toolkit</SectionLabel>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  background: isAccessible ? `${primaryTool.accentColor}12` : '#FAFAFA',
                  border: `1.5px solid ${isAccessible ? primaryTool.accentColor + '55' : '#E2E8F0'}`,
                }}>
                  <span style={{ fontSize: 24 }}>{primaryTool.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: isAccessible ? '#1A202C' : '#A0AEC0',
                    }}>
                      {primaryTool.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#718096', lineHeight: 1.4, marginTop: 1 }}>
                      {primaryTool.toolType}
                    </div>
                  </div>
                  {isAccessible && (
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate(primaryTool.route); }}
                      style={{
                        background: accentDark, color: '#FFFFFF', border: 'none',
                        borderRadius: 8, cursor: 'pointer', padding: '6px 14px',
                        fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'opacity 0.15s', whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85'; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      Open <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};