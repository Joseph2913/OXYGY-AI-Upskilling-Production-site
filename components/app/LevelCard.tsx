import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ArrowRight, Lock, Play, PenTool, FileText } from 'lucide-react';
import { LEVEL_META } from '../../data/levelTopics';
import { LEVEL_TOPICS } from '../../data/levelTopics';
import { getPrimaryTool } from '../../data/toolkitData';
import { LEVELS } from '../../data/content';
import { LevelProgress } from '../../hooks/useJourneyData';
import { ActivityTracker } from './journey/ActivityTracker';

interface LevelCardProps {
  level: LevelProgress;
  animDelay: number;
  projectTitle?: string | null;
  deliverable?: string | null;
  planDepth?: string | null;
  planTime?: string | null;
  forceExpand?: boolean;
  hasLearningPlan?: boolean;
}

/* ── Phase step data with tooltips ── */
const PHASE_STEPS = [
  { label: 'E-Learning', shortLabel: 'E-Learn', icon: <Play size={11} /> },
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

/* ── Status badge styles for project submission ── */
const STATUS_BADGE_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  draft: { bg: '#F7FAFC', color: '#718096', border: '1px solid #E2E8F0', label: 'Draft saved' },
  submitted: { bg: '#FEFCE8', color: '#92400E', border: '1px solid #FDE68A', label: 'Under review' },
  passed: { bg: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5', label: 'Passed \u2713' },
  needs_revision: { bg: '#FFF5F5', color: '#C53030', border: '1px solid #FEB2B2', label: 'Needs revision' },
};

/* ════════════════════════════════════════════════
   MAIN LEVEL CARD
   ════════════════════════════════════════════════ */
export const LevelCard: React.FC<LevelCardProps> = ({ level, animDelay, projectTitle, deliverable, planDepth, planTime, forceExpand, hasLearningPlan }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when forceExpand prop changes to true
  React.useEffect(() => {
    if (forceExpand) setExpanded(true);
  }, [forceExpand]);
  const meta = LEVEL_META.find(m => m.number === level.levelNumber)!;
  const marketingData = LEVELS.find(l => l.id === level.levelNumber);
  const accent = meta.accentColor;
  const accentDark = meta.accentDark;
  const topics = LEVEL_TOPICS[level.levelNumber] || [];
  const topic = topics[0];
  const primaryTool = getPrimaryTool(level.levelNumber);

  const isCompleted = level.status === 'completed';
  const isActive = level.status === 'active';
  const isProjectPending = level.status === 'project-pending';
  const isAccessible = true; // All levels accessible

  const ctaLabel = isCompleted ? 'Review' : isActive ? 'Continue' : 'Start';
  const description = marketingData?.descriptionCollapsed || meta.tagline;

  // Project submission status badge
  const subStatus = level.projectSubmission?.status;
  const statusBadge = subStatus ? STATUS_BADGE_STYLES[subStatus] : null;

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
          ROW 1 — HEADER (always visible, click to expand)
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
              {/* Activity tracker for active/project-pending/completed — hidden for L1 */}
              {level.levelNumber !== 1 && (isActive || isProjectPending || isCompleted) && (
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

        {/* Right — Depth/time + CTA + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {/* Depth + time metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {planDepth && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: accentDark,
                background: `${accent}20`,
                borderRadius: 6, padding: '2px 8px',
                textTransform: 'uppercase' as const, letterSpacing: '0.04em',
              }}>
                {planDepth === 'full' ? 'Full Program' : 'Fast-track'}
              </span>
            )}
            {planTime && (
              <span style={{ fontSize: 10, color: '#A0AEC0' }}>
                {planTime}
              </span>
            )}
          </div>

          {/* CTA button — level-coloured */}
          {isAccessible ? (
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate(level.levelNumber === 1 ? '/app/level-1' : `/app/level?level=${level.levelNumber}`); }}
              style={{
                background: `${accent}30`,
                color: accentDark,
                border: `1.5px solid ${accent}88`,
                borderRadius: 24, padding: '10px 22px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                flexShrink: 0, fontFamily: 'inherit',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = `${accent}50`;
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = `${accent}30`;
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
          ROW 2 — COURSE TOPICS (always visible)
         ════════════════════════════════════════════════ */}
      {marketingData?.topics && marketingData.topics.length > 0 && (
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            borderTop: '1px solid #F7FAFC',
            padding: '10px 24px',
            cursor: 'pointer',
          }}
        >
          <SectionLabel>Course Topics</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {marketingData.topics.map(t => (
              <TagChip key={t} label={t} accent={accent} accentDark={accentDark} />
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          ROW 3 — PROJECT (always visible, replaces ProjectBriefSection)
         ════════════════════════════════════════════════ */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          borderTop: '1px solid #F7FAFC',
          padding: '12px 24px 20px',
          background: `${accent}08`,
          cursor: 'pointer',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          {/* Left — Project info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: accentDark,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4,
            }}>
              Your Project
            </div>
            {projectTitle ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
                  {projectTitle}
                </div>
                {deliverable && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <FileText size={12} color={accentDark} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: '#4A5568' }}>
                      <strong style={{ color: '#1A202C' }}>Deliverable: </strong>
                      {deliverable}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic' }}>
                {hasLearningPlan
                  ? 'Not included in your programme'
                  : 'Project brief will appear once you generate a learning plan'}
              </div>
            )}
          </div>

          {/* Right — Status badge only (project CTA is in expanded view) */}
          {statusBadge && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 8px',
              borderRadius: 10, background: statusBadge.bg,
              border: statusBadge.border, color: statusBadge.color,
              flexShrink: 0,
            }}>
              {statusBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          EXPANDED VIEW
          Left: Target Audience, Key Tools
          Right: Learning Phases (with tooltips), Toolkit, Project
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

            {/* Project — navigate to project proof page */}
            {projectTitle && (
              <div>
                <SectionLabel>Project</SectionLabel>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  background: `${accent}12`,
                  border: `1.5px solid ${accent}55`,
                }}>
                  <FileText size={20} color={accentDark} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>
                      {projectTitle}
                    </div>
                    {statusBadge && (
                      <div style={{ fontSize: 10.5, color: statusBadge.color, lineHeight: 1.4, marginTop: 1 }}>
                        {statusBadge.label}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate('/app/journey/project/' + level.levelNumber); }}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
