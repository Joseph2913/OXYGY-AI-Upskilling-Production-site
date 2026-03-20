import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ArrowRight, Lock, Play, PenTool, FileText, BookOpen, Wrench, FolderKanban, ChevronsRight } from 'lucide-react';
import { LEVEL_META } from '../../data/levelTopics';
import { LEVEL_TOPICS } from '../../data/levelTopics';
import { getPrimaryTool } from '../../data/toolkitData';
import { LEVELS } from '../../data/content';
import { LevelProgress } from '../../hooks/useJourneyData';

interface LevelCardProps {
  level: LevelProgress;
  animDelay: number;
  projectTitle?: string | null;
  deliverable?: string | null;
  planDepth?: string | null;
  planTime?: string | null;
  forceExpand?: boolean;
  hasLearningPlan?: boolean;
  isFocused?: boolean;
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
export const LevelCard: React.FC<LevelCardProps> = ({ level, animDelay, projectTitle, deliverable, planDepth, planTime, forceExpand, hasLearningPlan, isFocused }) => {
  const navigate = useNavigate();
  // Two-tier expansion: mid = phase chips visible, full = detailed expanded view
  const [showPhases, setShowPhases] = useState(!!isFocused);
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when forceExpand prop changes to true
  React.useEffect(() => {
    if (forceExpand) { setShowPhases(true); setExpanded(true); }
  }, [forceExpand]);

  // Sync isFocused
  React.useEffect(() => {
    if (isFocused) setShowPhases(true);
  }, [isFocused]);
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
          HEADER — always visible, click to toggle phases
         ════════════════════════════════════════════════ */}
      <div
        onClick={() => setShowPhases(!showPhases)}
        style={{
          padding: showPhases ? '16px 20px 0' : '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          transition: 'padding 0.2s',
        }}
      >
        {/* Level circle */}
        <div style={{
          width: showPhases ? 40 : 34, height: showPhases ? 40 : 34, borderRadius: '50%', flexShrink: 0,
          background: isCompleted ? `${accent}55` : isActive ? accent : `${accent}33`,
          border: isCompleted ? 'none' : isActive ? 'none' : `1px solid ${accent}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: showPhases ? 15 : 13, fontWeight: 800, color: accentDark,
          transition: 'all 0.2s',
        }}>
          {isCompleted ? <Check size={showPhases ? 16 : 14} color={accentDark} strokeWidth={3} /> : isAccessible ? level.levelNumber : <Lock size={14} color="#A0AEC0" />}
        </div>

        {/* Title + description block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: Level label + depth badge + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: accentDark, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Level {level.levelNumber}
            </span>
            {planDepth && (
              <span style={{ fontSize: 9, fontWeight: 700, color: accentDark, background: `${accent}20`, borderRadius: 6, padding: '1px 7px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                {planDepth === 'full' ? 'Full Program' : 'Fast-track'}
              </span>
            )}
            {planTime && (
              <span style={{ fontSize: 10, color: '#A0AEC0' }}>{planTime}</span>
            )}
          </div>

          {/* Title */}
          <div style={{
            fontSize: showPhases ? 16 : 14, fontWeight: 700, color: '#1A202C',
            letterSpacing: '-0.2px', lineHeight: 1.25, marginBottom: showPhases ? 4 : 2,
            transition: 'font-size 0.2s',
          }}>
            {meta.name}
          </div>

          {/* Description — full when focused, truncated tagline when collapsed */}
          {showPhases ? (
            <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>{description}</div>
          ) : (
            <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.tagline}</div>
          )}
        </div>

        {/* Right side — status badges + chevron */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {isCompleted && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#276749', background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '2px 10px' }}>Complete</span>
          )}
          {isProjectPending && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 10, padding: '2px 10px' }}>Project Pending</span>
          )}
          {isActive && (
            <span style={{ fontSize: 10, fontWeight: 700, color: accentDark, background: `${accent}30`, border: `1px solid ${accent}88`, borderRadius: 10, padding: '2px 10px' }}>In Progress</span>
          )}
          {level.status === 'not-started' && !isProjectPending && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#A0AEC0' }}>Not started</span>
          )}
          <ChevronDown size={14} color={showPhases ? accentDark : '#A0AEC0'} style={{
            transition: 'transform 0.25s ease',
            transform: showPhases ? 'rotate(180deg)' : 'rotate(0deg)',
          }} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PHASE CHIPS — visible when showPhases is true
         ════════════════════════════════════════════════ */}
      {showPhases && (
      <>
      <div style={{ padding: '10px 20px 0', paddingLeft: 70 }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {(() => {
            const phasesTotal = topic?.phases?.length ?? 2;
            const phasesDone = isCompleted ? phasesTotal : isActive ? Math.max(0, level.currentPhase - 1) : 0;
            const eLearnDone = isCompleted || phasesDone >= phasesTotal;
            const eLearnInProgress = !eLearnDone && phasesDone > 0;
            const eLearnLabel = eLearnDone ? 'Done' : eLearnInProgress ? `${phasesDone}/${phasesTotal}` : 'To do';
            const eLearnBadge = eLearnDone
              ? { bg: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5' }
              : eLearnInProgress
              ? { bg: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }
              : { bg: '#F7FAFC', color: '#A0AEC0', border: '1px solid #E2E8F0' };

            const toolkitDone = level.toolUsed;
            const toolkitLabel = toolkitDone ? 'Done' : 'To do';
            const toolkitBadge = toolkitDone
              ? { bg: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5' }
              : { bg: '#F7FAFC', color: '#A0AEC0', border: '1px solid #E2E8F0' };

            const ps = level.projectSubmission?.status;
            const projectDone = ps === 'passed';
            const projectInProgress = ps === 'submitted' || ps === 'needs_revision' || ps === 'draft';
            const projectLabel = projectDone ? 'Done' : ps === 'submitted' ? 'Review' : ps === 'needs_revision' ? 'Revise' : ps === 'draft' ? 'Draft' : 'To do';
            const projectBadge = projectDone
              ? { bg: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5' }
              : projectInProgress
              ? { bg: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }
              : { bg: '#F7FAFC', color: '#A0AEC0', border: '1px solid #E2E8F0' };

            const PHASE_SHORT: Record<number, { elearn: string; toolkit: string; project: string }> = {
              1: { elearn: 'Prompt engineering fundamentals', toolkit: 'Prompt Playground – test and refine prompts live', project: 'Apply prompts to a real workplace scenario' },
              2: { elearn: 'Building reusable AI agents', toolkit: 'Agent Builder – create custom AI assistants', project: 'Design an agent for your role' },
              3: { elearn: 'Mapping end-to-end AI workflows', toolkit: 'Workflow Canvas – design automated pipelines', project: 'Document a workflow for your team' },
              4: { elearn: 'Turning AI outputs into dashboards', toolkit: 'App Designer – brief to mockup to PRD', project: 'Prototype an AI-driven dashboard' },
              5: { elearn: 'Full-stack AI application architecture', toolkit: 'AI App Evaluator – score your app idea', project: 'Present a complete AI app case study' },
            };
            const shorts = PHASE_SHORT[level.levelNumber] || PHASE_SHORT[1];

            const chipStyle: React.CSSProperties = {
              flex: 1, minWidth: 0,
              padding: '10px 12px', borderRadius: 8,
              background: '#F7FAFC', border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              display: 'flex', alignItems: 'center', gap: 10,
            };

            const hoverOn = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `${accent}08`; };
            const hoverOff = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F7FAFC'; };

            const connector = (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, flexShrink: 0 }}>
                <ChevronsRight size={16} color={accentDark} strokeWidth={2.5} style={{ opacity: 0.45 }} />
              </div>
            );

            const statusBadgeStyle = (b: { bg: string; color: string; border: string }): React.CSSProperties => ({
              fontSize: 9, fontWeight: 700, color: b.color, background: b.bg, border: b.border,
              borderRadius: 8, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0,
            });

            return (
              <>
                <div style={chipStyle} onClick={() => navigate(level.levelNumber === 1 ? '/app/level-1' : '/app/level')} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <BookOpen size={14} color={accentDark} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>E-Learning</span>
                      <span style={statusBadgeStyle(eLearnBadge)}>{eLearnLabel}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#718096', lineHeight: 1.4, marginTop: 2 }}>{shorts.elearn}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: accentDark, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    Open <ArrowRight size={11} />
                  </span>
                </div>

                {connector}

                <div style={chipStyle} onClick={() => primaryTool && navigate(primaryTool.route)} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <Wrench size={14} color={accentDark} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>Toolkit</span>
                      <span style={statusBadgeStyle(toolkitBadge)}>{toolkitLabel}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#718096', lineHeight: 1.4, marginTop: 2 }}>{shorts.toolkit}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: accentDark, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    Open <ArrowRight size={11} />
                  </span>
                </div>

                {connector}

                <div style={chipStyle} onClick={() => navigate('/app/journey/project/' + level.levelNumber)} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <FolderKanban size={14} color={accentDark} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>Project</span>
                      <span style={statusBadgeStyle(projectBadge)}>{projectLabel}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#718096', lineHeight: 1.4, marginTop: 2 }}>{shorts.project}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: accentDark, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    Open <ArrowRight size={11} />
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* BOTTOM ROW — Learn more (left) + Continue CTA (right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 14px' }}>
        <span
          onClick={() => setExpanded(!expanded)}
          style={{ fontSize: 12, fontWeight: 600, color: accentDark, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 50 }}
        >
          {expanded ? 'Show less' : 'Learn more'}
          <ChevronDown size={13} style={{ transition: 'transform 0.25s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </span>
        {isAccessible ? (
          <button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate(level.levelNumber === 1 ? '/app/level-1' : '/app/level'); }}
            style={{
              background: `${accent}30`, color: accentDark, border: `1.5px solid ${accent}88`,
              borderRadius: 20, padding: '7px 18px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}50`; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}30`; }}
          >
            {ctaLabel} <ArrowRight size={12} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A0AEC0', fontSize: 11, fontWeight: 600 }}>
            <Lock size={12} /> Locked
          </div>
        )}
      </div>
      </>
      )}

      {/* ════════════════════════════════════════════════
          EXPANDED VIEW — detailed phase info (only when phases visible)
         ════════════════════════════════════════════════ */}
      <div style={{
        maxHeight: (showPhases && expanded) ? 600 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        <div style={{
          borderTop: '1px solid #E2E8F0',
          padding: '18px 22px 20px',
          paddingLeft: 66,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* ── PHASE 1: LEARNING (E-Learning) ── */}
          {(() => {
            const phasesTotal = topic?.phases?.length ?? 2;
            const phasesDone = isCompleted
              ? phasesTotal
              : isActive
              ? Math.max(0, level.currentPhase - 1)
              : 0;
            const isDone = isCompleted || phasesDone >= phasesTotal;
            const inProgress = !isDone && phasesDone > 0;
            const statusColor = isDone ? '#48BB78' : inProgress ? '#ED8936' : '#CBD5E0';
            const statusLabel = isDone ? 'Complete' : inProgress ? `${phasesDone} of ${phasesTotal} phases` : 'Not started';

            return (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 10,
                background: isDone ? '#F0FFF408' : '#F7FAFC',
                border: `1px solid ${isDone ? '#C6F6D544' : '#E2E8F0'}`,
              }}>
                {/* Phase number badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#48BB7820' : inProgress ? '#ED893620' : `${accent}15`,
                  border: `1.5px solid ${isDone ? '#48BB7855' : inProgress ? '#ED893655' : accent + '44'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: isDone ? '#276749' : inProgress ? '#C05621' : accentDark,
                }}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : '1'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>Learning</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: accentDark, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>E-Learning</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                      <span style={{ fontSize: 10, color: '#718096' }}>{statusLabel}</span>
                    </div>
                  </div>
                  {topic ? (
                    <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.55, marginBottom: 2 }}>
                      <strong style={{ color: '#1A202C' }}>{topic.title}</strong> — {topic.subtitle}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic' }}>No topic assigned</div>
                  )}
                  {topic?.phases && topic.phases.length > 0 && (
                    <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5, marginTop: 4 }}>
                      {topic.phases.map((p, i) => (
                        <span key={i}>{i > 0 ? ' → ' : ''}{p.label}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    navigate(level.levelNumber === 1 ? '/app/level-1' : '/app/level');
                  }}
                  style={{
                    background: `${accent}20`, color: accentDark, border: `1px solid ${accent}55`,
                    borderRadius: 8, cursor: 'pointer', padding: '6px 14px',
                    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}35`; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}20`; }}
                >
                  {isDone ? 'Review' : inProgress ? 'Continue' : 'Start'} <ArrowRight size={11} />
                </button>
              </div>
            );
          })()}

          {/* ── PHASE 2: APPLYING (Toolkit) ── */}
          {primaryTool && (() => {
            const isDone = level.toolUsed;
            const statusColor = isDone ? '#48BB78' : '#CBD5E0';
            const statusLabel = isDone ? 'Complete' : 'Not started';

            return (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 10,
                background: isDone ? '#F0FFF408' : '#F7FAFC',
                border: `1px solid ${isDone ? '#C6F6D544' : '#E2E8F0'}`,
              }}>
                {/* Phase number badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#48BB7820' : `${accent}15`,
                  border: `1.5px solid ${isDone ? '#48BB7855' : accent + '44'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: isDone ? '#276749' : accentDark,
                }}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : '2'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>Applying</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: accentDark, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Toolkit</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                      <span style={{ fontSize: 10, color: '#718096' }}>{statusLabel}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.55, marginBottom: 2 }}>
                    <strong style={{ color: '#1A202C' }}>{primaryTool.name}</strong> — {primaryTool.description || primaryTool.toolType}
                  </div>
                  {primaryTool.capabilities && primaryTool.capabilities.length > 0 && (
                    <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5, marginTop: 4 }}>
                      {primaryTool.capabilities.slice(0, 2).join(' · ')}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate(primaryTool.route); }}
                  style={{
                    background: `${accent}20`, color: accentDark, border: `1px solid ${accent}55`,
                    borderRadius: 8, cursor: 'pointer', padding: '6px 14px',
                    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}35`; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}20`; }}
                >
                  Open <ArrowRight size={11} />
                </button>
              </div>
            );
          })()}

          {/* ── PHASE 3: IMPLEMENTING (Project) ── */}
          {(() => {
            const ps = level.projectSubmission?.status;
            const isDone = ps === 'passed';
            const inProgress = ps === 'submitted' || ps === 'needs_revision' || ps === 'draft';
            const statusColor = isDone ? '#48BB78' : inProgress ? '#ED8936' : '#CBD5E0';
            const statusLabel = isDone
              ? 'Complete'
              : ps === 'submitted' ? 'Under review'
              : ps === 'needs_revision' ? 'Needs revision'
              : ps === 'draft' ? 'Draft saved'
              : 'Not started';

            return (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 10,
                background: isDone ? '#F0FFF408' : '#F7FAFC',
                border: `1px solid ${isDone ? '#C6F6D544' : '#E2E8F0'}`,
              }}>
                {/* Phase number badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? '#48BB7820' : inProgress ? '#ED893620' : `${accent}15`,
                  border: `1.5px solid ${isDone ? '#48BB7855' : inProgress ? '#ED893655' : accent + '44'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: isDone ? '#276749' : inProgress ? '#C05621' : accentDark,
                }}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : '3'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>Implementing</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: accentDark, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Project</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                      <span style={{ fontSize: 10, color: '#718096' }}>{statusLabel}</span>
                    </div>
                  </div>
                  {projectTitle ? (
                    <>
                      <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.55, marginBottom: 2 }}>
                        <strong style={{ color: '#1A202C' }}>{projectTitle}</strong>
                        {deliverable && <span> — Deliverable: {deliverable}</span>}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic' }}>
                      {hasLearningPlan ? 'Not included in your programme' : 'Generate a learning plan to see your project'}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate('/app/journey/project/' + level.levelNumber); }}
                  style={{
                    background: `${accent}20`, color: accentDark, border: `1px solid ${accent}55`,
                    borderRadius: 8, cursor: 'pointer', padding: '6px 14px',
                    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}35`; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${accent}20`; }}
                >
                  {isDone ? 'Review' : inProgress ? 'Continue' : 'Start'} <ArrowRight size={11} />
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
