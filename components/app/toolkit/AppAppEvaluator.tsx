import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, RotateCcw, Code, Library, Download,
  Info, ChevronRight, ChevronDown, ChevronUp, Sparkles, X, Server, Database, Cpu,
  Users, HardDrive, Wand2, Settings, TrendingUp, Zap, Target, RefreshCw, Lightbulb,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  EVALUATOR_SECTIONS, EXAMPLE_APPS, SCORE_CRITERIA_LABELS,
  TECH_STACK_HOSTING, TECH_STACK_DATABASE, TECH_STACK_AI_ENGINE,
  MATRIX_QUADRANTS, BUILD_PLAN_LOADING_STEPS, BUILD_PLAN_REFINE_LOADING_STEPS, BUILD_PLAN_STEP_DELAYS,
  getPriorityStyle, getSeverityStyle,
} from '../../../data/app-evaluator-content';
import type { TechStackOption } from '../../../data/app-evaluator-content';
import { useAppEvaluatorApi } from '../../../hooks/useAppEvaluatorApi';
import type {
  AppEvaluatorResult, DesignScoreCriteria,
  ArchitectureComponent, RiskItem, AppBuildPlanResult, BuildPlanPhase,
} from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';
import LearningPlanBlocker from '../LearningPlanBlocker';
import { upsertToolUsed, createArtefactFromTool, updateArtefactContent } from '../../../lib/database';
import OutputActionsPanel from '../workflow/OutputActionsPanel';
import NextStepBanner from './NextStepBanner';

const FONT = "'DM Sans', sans-serif";
const LEVEL_ACCENT = '#C3D0F5';
const LEVEL_ACCENT_DARK = '#2E3F8F';

/* ─── Loading step definitions (§9.5) ─── */
const INITIAL_LOADING_STEPS = [
  'Analysing your application design…',
  'Evaluating across 5 criteria…',
  'Scoring design readiness…',
  'Mapping architecture components…',
  'Positioning on the strategic matrix…',
  'Identifying risks & gaps…',
  'Generating refinement questions…',
  'Finalising evaluation…',
];
const REFINE_LOADING_STEPS = [
  'Processing your additional context…',
  'Re-evaluating design criteria…',
  'Updating architecture mapping…',
  'Revising matrix placement…',
  'Reassessing risks…',
  'Generating deeper questions…',
  'Finalising refined evaluation…',
];
const STEP_DELAYS = [800, 1500, 3000, 3500, 4000, 4000, 4500, -1];

/* ─── Fallback refinement questions ─── */
const FALLBACK_REFINEMENT_QUESTIONS = [
  'What specific user workflows or journeys should the app prioritise?',
  'Are there particular integrations or APIs the architecture must support?',
  'What are the most critical performance or scalability constraints?',
  'Are there compliance, security, or data residency requirements?',
  'What is the team size and technical skill level for implementation?',
];

/* ─── Helpers ─── */

function getScoreColor(score: number) {
  if (score >= 80) return '#38B2AC';
  if (score >= 50) return '#C4A934';
  return '#E57A5A';
}

function getVerdictText(score: number) {
  if (score >= 80) return 'Strong foundation — ready to start building';
  if (score >= 50) return 'Promising design — address the gaps before building';
  return 'Needs more refinement before implementation';
}

/* ─── Criterion Lucide icons (replace emojis) ─── */
const CRITERIA_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  user_clarity: Users,
  data_architecture: HardDrive,
  personalisation: Wand2,
  technical_feasibility: Settings,
  scalability: TrendingUp,
};

/* ─── Quadrant Lucide icons (replace emojis) ─── */
const QUADRANT_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  'Quick Win': Zap,
  'Strategic Investment': Target,
  'Rethink': RefreshCw,
  'Nice to Have': Lightbulb,
};

/* ─── Score Circle ─── */

const ScoreCircle: React.FC<{ score: number; animated: boolean; size?: number }> = ({ score, animated, size = 56 }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const color = getScoreColor(score);

  useEffect(() => {
    if (!animated) return;
    let start: number | null = null;
    const duration = 1000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, animated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Design score: ${score} percent`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 36, fontWeight: 700, fill: '#1A202C', fontFamily: FONT }}>
          {displayScore}%
        </text>
      </svg>
    </div>
  );
};

/* ─── Mini Score Circle (for breakdown rows) ─── */

const MiniScoreCircle: React.FC<{ score: number; size?: number }> = ({ score, size = 36 }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label={`${score}%`}>
      <circle cx="18" cy="18" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="3" />
      <circle cx="18" cy="18" r={radius} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}
      />
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 10, fontWeight: 700, fill: '#1A202C', fontFamily: FONT }}>
        {score}
      </text>
    </svg>
  );
};

/* ─── Quadrant Circle (collapsed matrix card) ─── */

const QUADRANT_COLORS: Record<string, string> = {
  'Quick Win': '#38A169',
  'Strategic Investment': '#3182CE',
  'Nice to Have': '#A0AEC0',
  'Rethink': '#DD6B20',
};

const QuadrantCircle: React.FC<{
  quadrant: string;
  animated: boolean;
  size?: number;
}> = ({ quadrant, animated, size = 130 }) => {
  const color = QUADRANT_COLORS[quadrant] || '#3182CE';
  const QuadIcon = QUADRANT_ICONS[quadrant] || Zap;
  const bgAlpha = '18'; // subtle tinted background

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}30`,
      background: `${color}${bgAlpha}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 2px 8px ${color}15`,
    }}>
      <div style={{
        animation: animated ? 'ppQuadrantPulse 2s ease-in-out infinite' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <QuadIcon size={size * 0.48} color={color} strokeWidth={1.5} />
      </div>
    </div>
  );
};

/* ─── Matrix Chart (SVG quadrant) ─── */

const MATRIX_Q_STYLES: { key: string; label: string; shortLabel: string; bg: string; bgActive: string; color: string; description: string }[] = [
  { key: 'Quick Win',            label: 'Quick Win',            shortLabel: 'QW', bg: '#F0FFF4', bgActive: '#C6F6D5', color: '#276749', description: 'Low complexity, high impact — ship fast and capture value early.' },
  { key: 'Strategic Investment', label: 'Strategic Investment',  shortLabel: 'SI', bg: '#EBF4FF', bgActive: '#BEE3F8', color: '#2B6CB0', description: 'High complexity, high impact — worth the effort but plan carefully.' },
  { key: 'Nice to Have',        label: 'Nice to Have',          shortLabel: 'NH', bg: '#F7FAFC', bgActive: '#E2E8F0', color: '#718096', description: 'Low complexity, low impact — easy to build but limited value.' },
  { key: 'Rethink',             label: 'Rethink',               shortLabel: 'RT', bg: '#FFFAF0', bgActive: '#FEEBC8', color: '#C05621', description: 'High complexity, low impact — reconsider before investing effort.' },
];

const MatrixChart: React.FC<{
  technicalComplexity: number;
  businessImpact: number;
  quadrant: string;
  animated: boolean;
}> = ({ technicalComplexity, businessImpact, quadrant, animated }) => {
  const [dotScale, setDotScale] = useState(0);
  const [dotClicked, setDotClicked] = useState(false);
  const [hoveredQ, setHoveredQ] = useState<string | null>(null);

  useEffect(() => {
    if (!animated) { setDotScale(1); return; }
    const t = setTimeout(() => setDotScale(1), 400);
    return () => clearTimeout(t);
  }, [animated]);

  const dotColor = QUADRANT_COLORS[quadrant] || '#3182CE';

  // Quadrant grid positions: [row, col] — Quick Win top-left, Strategic top-right, Nice bottom-left, Rethink bottom-right
  const qGrid: { key: string; row: number; col: number }[] = [
    { key: 'Quick Win', row: 0, col: 0 },
    { key: 'Strategic Investment', row: 0, col: 1 },
    { key: 'Nice to Have', row: 1, col: 0 },
    { key: 'Rethink', row: 1, col: 1 },
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Axis labels */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#A0AEC0', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Impact ↑</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Y-axis label (rotated) */}
        <div style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#A0AEC0', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complexity →</span>
        </div>

        {/* Chart grid */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
            borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0',
            aspectRatio: '1',
          }}>
            {qGrid.map(({ key, row, col }) => {
              const qs = MATRIX_Q_STYLES.find(q => q.key === key)!;
              const isActive = key === quadrant;
              const isHov = hoveredQ === key;
              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredQ(key)}
                  onMouseLeave={() => setHoveredQ(null)}
                  style={{
                    gridRow: row + 1, gridColumn: col + 1,
                    background: isActive ? qs.bgActive : isHov ? qs.bgActive : qs.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 8, transition: 'background 0.15s',
                    borderRight: col === 0 ? '1px dashed #E2E8F0' : 'none',
                    borderBottom: row === 0 ? '1px dashed #E2E8F0' : 'none',
                    position: 'relative', cursor: 'default',
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 700 : 500, color: qs.color,
                    fontFamily: FONT, textAlign: 'center', lineHeight: 1.3,
                    opacity: isActive ? 1 : isHov ? 0.9 : 0.55,
                    transition: 'opacity 0.15s',
                  }}>
                    {qs.label}
                  </span>
                  {/* Hover tooltip */}
                  {isHov && (
                    <div style={{
                      position: 'absolute',
                      left: '50%', transform: 'translateX(-50%)',
                      ...(row === 0 ? { bottom: -4, transform: 'translateX(-50%) translateY(100%)' } : { top: -4, transform: 'translateX(-50%) translateY(-100%)' }),
                      background: '#1A202C', color: '#FFFFFF', fontSize: 10, fontFamily: FONT,
                      padding: '6px 10px', borderRadius: 6, lineHeight: 1.4,
                      width: 180, textAlign: 'center', zIndex: 20,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                      pointerEvents: 'none',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{qs.label}</div>
                      <div style={{ color: '#CBD5E0', fontWeight: 400 }}>{qs.description}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dot overlay — positioned over the grid */}
          <div
            onClick={() => setDotClicked(prev => !prev)}
            style={{
              position: 'absolute',
              left: `${technicalComplexity}%`, top: `${100 - businessImpact}%`,
              transform: `translate(-50%, -50%) scale(${dotScale})`,
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 5, cursor: 'pointer',
            }}
          >
            {/* Pulse ring */}
            <div style={{
              position: 'absolute', inset: -6,
              borderRadius: '50%', background: `${dotColor}20`,
              animation: 'ppDotPulse 2s ease-in-out infinite',
            }} />
            {/* Solid dot */}
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: dotColor, border: '2.5px solid #FFFFFF',
              boxShadow: `0 0 0 2px ${dotColor}40, 0 2px 6px rgba(0,0,0,0.15)`,
              position: 'relative',
            }} />
          </div>

          {/* Score tooltip on click */}
          {dotClicked && (
            <div
              style={{
                position: 'absolute',
                left: `${technicalComplexity}%`, top: `${100 - businessImpact}%`,
                transform: `translate(-50%, ${businessImpact > 60 ? '16px' : '-100%'}) translateY(${businessImpact > 60 ? '0' : '-12px'})`,
                background: '#1A202C', borderRadius: 8, padding: '8px 12px',
                zIndex: 10, whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animation: 'ppSlideDown 0.15s ease-out both',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, marginBottom: 4 }}>Your app's position</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 8, color: '#A0AEC0', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complexity</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT }}>{technicalComplexity}</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#A0AEC0', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impact</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT }}>{businessImpact}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Radar Chart (score breakdown spider chart) ─── */

/* Criterion color helper — derived from getScoreColor thresholds (>=80 teal, >=50 amber, <50 red) */
function getCriterionColor(score: number): { bg: string; border: string; text: string } {
  if (score >= 80) return { bg: '#E6FFFA', border: '#81E6D9', text: '#276749' };
  if (score >= 50) return { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' };
  return { bg: '#FFF5F5', border: '#FEB2B2', text: '#C53030' };
}

/* Short keys for radar axis labels */
const RADAR_LABELS: Record<string, string> = {
  user_clarity: 'UC',
  data_architecture: 'DA',
  personalisation: 'P',
  technical_feasibility: 'TF',
  scalability: 'S',
};

const RadarChart: React.FC<{
  criteria: [string, { score: number }][];
}> = ({ criteria }) => {
  const vb = 300;
  const cx = vb / 2;
  const cy = vb / 2;
  const levels = 5;
  const maxR = 100;
  const angleStep = (2 * Math.PI) / criteria.length;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const polygonPoints = criteria.map(([, val], i) => {
    const p = getPoint(i, val.score);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${vb} ${vb}`} style={{ display: 'block' }}>
        {/* Grid levels */}
        {Array.from({ length: levels }, (_, level) => {
          const r = ((level + 1) / levels) * maxR;
          const points = criteria.map((_, i) => {
            const angle = startAngle + i * angleStep;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon key={level} points={points} fill="none"
              stroke={level === levels - 1 ? '#CBD5E0' : '#EDF2F7'}
              strokeWidth={level === levels - 1 ? 1.5 : 0.8}
            />
          );
        })}

        {/* Axis lines */}
        {criteria.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#EDF2F7" strokeWidth="0.8" />;
        })}

        {/* Filled data area */}
        <polygon points={polygonPoints} fill={`${LEVEL_ACCENT_DARK}20`} stroke={LEVEL_ACCENT_DARK} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Data dots + axis icons with scores beside them */}
        {criteria.map(([key, val], i) => {
          const p = getPoint(i, val.score);
          const color = getScoreColor(val.score);
          const cColor = getCriterionColor(val.score);
          const CIcon = CRITERIA_ICONS[key] || Info;
          const angle = startAngle + i * angleStep;
          const lr = maxR + 22;
          const ix = cx + lr * Math.cos(angle);
          const iy = cy + lr * Math.sin(angle);
          const iconSize = 26;
          const cos = Math.cos(angle);
          // Score always horizontally aligned with icon center
          // For left-side icons: score to the left; right-side: score to the right; top/bottom: score to the right
          const isLeft = cos < -0.3;
          const scoreTx = isLeft ? ix - 18 : ix + 18;
          const scoreTy = iy;
          const scoreAnchor = isLeft ? 'end' : 'start';
          const foW = iconSize + 4;
          const foH = iconSize + 4;
          return (
            <g key={key}>
              <circle cx={p.x} cy={p.y} r={5} fill={color} stroke="#FFFFFF" strokeWidth="2" />
              {/* Icon at axis endpoint */}
              <foreignObject x={ix - foW / 2} y={iy - foH / 2} width={foW} height={foH} style={{ overflow: 'visible' }}>
                <div style={{
                  width: iconSize, height: iconSize, borderRadius: 6, margin: 2,
                  background: cColor.bg, border: `1px solid ${cColor.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CIcon size={13} color={cColor.text} />
                </div>
              </foreignObject>
              {/* Score horizontally aligned with icon */}
              <text x={scoreTx} y={scoreTy} textAnchor={scoreAnchor} dominantBaseline="central"
                style={{ fontSize: 12, fontWeight: 700, fill: color, fontFamily: FONT }}>
                {val.score}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend below chart */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px 18px', justifyContent: 'center', marginTop: 10, padding: '0 8px' }}>
        {criteria.map(([key, val]) => {
          const CIcon = CRITERIA_ICONS[key] || Info;
          const cColor = getCriterionColor(val.score);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: cColor.bg, border: `1px solid ${cColor.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CIcon size={11} color={cColor.text} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#4A5568', fontFamily: FONT }}>{SCORE_CRITERIA_LABELS[key]?.label || key}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── ProcessingProgress (matches L1 Prompt Playground gold standard) ─── */

const ProcessingProgress: React.FC<{
  steps: string[];
  currentStep: number;
  header: string;
  subtext: string;
}> = ({ steps, currentStep, header, subtext }) => {
  const completedSteps = Math.min(currentStep, steps.length);
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
      padding: '28px 32px',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4, fontFamily: FONT }}>
        {header}
      </div>
      <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 24, fontFamily: FONT }}>
        {subtext}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum <= completedSteps;
          const isActive = stepNum === completedSteps + 1 && completedSteps < steps.length;
          const isPending = !isComplete && !isActive;

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'opacity 0.2s',
              opacity: isPending ? 0.5 : 1,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isComplete ? LEVEL_ACCENT : '#F7FAFC',
                border: isActive
                  ? `2px solid ${LEVEL_ACCENT}`
                  : isComplete ? 'none' : '2px solid #E2E8F0',
                position: 'relative',
              }}>
                {isComplete && (
                  <Check size={10} color={LEVEL_ACCENT_DARK} strokeWidth={3} />
                )}
                {isActive && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: LEVEL_ACCENT_DARK,
                    animation: 'ppSpin 0.7s linear infinite',
                    position: 'absolute', top: -2, left: -2,
                  }} />
                )}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isPending ? '#A0AEC0' : '#2D3748',
                fontFamily: FONT,
                transition: 'color 0.2s, font-weight 0.2s',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        width: '100%', height: 4, borderRadius: 2,
        background: '#EDF2F7', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: LEVEL_ACCENT,
          width: `${progressPercent}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{
        fontSize: 11, color: '#A0AEC0',
        textAlign: 'right', marginTop: 6,
        fontFamily: FONT,
      }}>
        {completedSteps} of {steps.length}
      </div>
    </div>
  );
};

/* ─── Tech Stack Selector Group ─── */

const TechStackGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  options: TechStackOption[];
  selected: string | null;
  onSelect: (id: string) => void;
}> = ({ title, icon, options, selected, onSelect }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{title}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => {
        const isSel = selected === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            style={{
              padding: '12px 14px', borderRadius: 12, textAlign: 'left',
              background: isSel ? '#F5F7FF' : '#FFFFFF',
              border: isSel ? `1.5px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
              cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
            onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.background = `${LEVEL_ACCENT}10`; } }}
            onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; } }}
          >
            {opt.logo ? (
              <img src={opt.logo} alt={opt.label} style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 18, flexShrink: 0 }}>{opt.icon}</span>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? LEVEL_ACCENT_DARK : '#1A202C', fontFamily: FONT }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>{opt.description}</div>
            </div>
            {isSel && <Check size={14} color={LEVEL_ACCENT_DARK} />}
          </button>
        );
      })}
    </div>
  </div>
);

/* ─── CodeBlockWithCopy ─── */

const CodeBlockWithCopy: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [code]);
  return (
    <div style={{ position: 'relative', margin: '8px 0' }}>
      <button onClick={handleCopy} style={{
        position: 'absolute', top: 8, right: 8,
        background: copied ? '#38B2AC' : 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
        padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all 0.15s ease',
      }} title="Copy code">
        {copied ? <Check size={13} color="#fff" /> : <Copy size={13} color="#A0AEC0" />}
        <span style={{ fontSize: 11, color: copied ? '#fff' : '#A0AEC0', fontFamily: FONT }}>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre style={{
        background: '#1A202C', color: '#E2E8F0', padding: '14px 18px',
        borderRadius: 8, fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0,
      }}><code>{code}</code></pre>
    </div>
  );
};

/* ─── Main Component ─── */

const AppAppEvaluator: React.FC = () => {
  const { user } = useAuth();
  const { hasLearningPlan, learningPlanLoading, projectChips } = useAppContext();
  const projectChip = projectChips?.[5] ?? null;
  const location = useLocation();

  // Input state
  const [appDescription, setAppDescription] = useState('');
  const [problemAndUsers, setProblemAndUsers] = useState('');
  const [dataAndContent, setDataAndContent] = useState('');

  // Step 2 — Evaluation result & UI state
  const [result, setResult] = useState<AppEvaluatorResult | null>(null);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [step2Approved, setStep2Approved] = useState(false);

  // Step 2 — Loading progress (§9.5)
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRefineLoading, setIsRefineLoading] = useState(false);

  // Step 2 — Card expand state (mutually exclusive)
  const [expandedCard, setExpandedCard] = useState<'score' | 'matrix' | null>(null);
  const toggleCard = (card: 'score' | 'matrix') =>
    setExpandedCard(prev => prev === card ? null : card);

  // Step 2 — Inline breakdown answers (keyed by criterion key)
  const [breakdownAnswers, setBreakdownAnswers] = useState<Record<string, string>>({});
  // Step 2 — Which "what to define" sections are expanded (click to reveal)
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  // Step 2 — Refinement state
  const [refineExpanded, setRefineExpanded] = useState(false);
  const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
  const [refinementAdditional, setRefinementAdditional] = useState('');
  const [refinementCount, setRefinementCount] = useState(0);

  // Step 3 — Tech Stack
  const [selectedHosting, setSelectedHosting] = useState<string | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedAiEngine, setSelectedAiEngine] = useState<string | null>(null);

  // Step 3 — Build Plan
  const [buildPlan, setBuildPlan] = useState<AppBuildPlanResult | null>(null);
  const [buildPlanLoadingStep, setBuildPlanLoadingStep] = useState(0);
  const [isBuildPlanRefineLoading, setIsBuildPlanRefineLoading] = useState(false);
  const [buildPlanVisibleBlocks, setBuildPlanVisibleBlocks] = useState(0);
  const [buildPlanViewMode, setBuildPlanViewMode] = useState<'cards' | 'markdown'>('cards');
  const [buildPlanCopied, setBuildPlanCopied] = useState(false);
  const [buildPlanSaved, setBuildPlanSaved] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]));
  const [buildRefineExpanded, setBuildRefineExpanded] = useState(false);
  const [buildRefinementAnswers, setBuildRefinementAnswers] = useState<Record<number, string>>({});
  const [buildRefinementAdditional, setBuildRefinementAdditional] = useState('');
  const [buildRefinementCount, setBuildRefinementCount] = useState(0);
  const [sourceArtefactId, setSourceArtefactId] = useState<string | null>(null);

  // Refs
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);

  // API
  const { evaluateApp, generateBuildPlan, isLoading, isBuildPlanLoading, error, clearError } = useAppEvaluatorApi();

  // Step indicators (4-step flow)
  const step1Done = appDescription.trim().length > 0 && (result !== null || isLoading);
  const step2Done = step1Done && step2Approved;
  const allStackSelected = selectedHosting !== null && selectedDatabase !== null && selectedAiEngine !== null;
  const step3Done = step2Done && allStackSelected && (buildPlan !== null || isBuildPlanLoading);

  // Artefact prefill from "Launch in Tool" — restore full result
  useEffect(() => {
    const state = location.state as {
      sourceArtefactId?: string;
      sourceArtefactContent?: Record<string, any>;
      sourceArtefactType?: string;
      artefactPrefill?: Record<string, any>;
    } | null;
    const prefill = state?.sourceArtefactContent || state?.artefactPrefill;
    if (!prefill) return;
    // Restore inputs
    if (prefill.appDescription) setAppDescription(prefill.appDescription);
    if (prefill.problemStatement) setProblemAndUsers(prefill.problemStatement);
    // Restore full result so the evaluation output is visible immediately
    if (prefill.designScore || prefill.architecture) {
      setResult({
        design_score: prefill.designScore || { overall: 0, criteria: {}, verdict: '' },
        matrix_placement: prefill.matrixPlacement || { quadrant: '', x: 0, y: 0, label: '' },
        architecture: prefill.architecture || { summary: '', components: [] },
        implementation_plan: prefill.implementationPlan || { summary: '', steps: [] },
        risks_and_gaps: prefill.risksAndGaps || { summary: '', items: [] },
        refinement_questions: prefill.refinementQuestions || [],
      });
      setVisibleBlocks(10);
    }
    if (state?.sourceArtefactId) setSourceArtefactId(state.sourceArtefactId);
    window.history.replaceState({}, '');
  }, []);

  // Staggered block appearance — Step 2 (score card + matrix card + summary + refinement)
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setExpandedCard(null);
    setBreakdownAnswers({});
    setExpandedCriteria(new Set());
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 2; i++) {
      timers.push(setTimeout(() => {
        setVisibleBlocks(v => v + 1);
        if (i === 0) setScoreAnimated(true);
      }, 150 + i * 120));
    }
    return () => timers.forEach(clearTimeout);
  }, [result]);

  // Staggered block appearance — Step 3 build plan
  useEffect(() => {
    if (!buildPlan) return;
    setBuildPlanVisibleBlocks(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 8; i++) {
      timers.push(setTimeout(() => setBuildPlanVisibleBlocks(v => v + 1), 150 + i * 100));
    }
    return () => timers.forEach(clearTimeout);
  }, [buildPlan]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Step 2 ProcessingProgress step progression (§9.5)
  useEffect(() => {
    if (!isLoading) {
      if (loadingStep > 0) {
        const steps = isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS;
        setLoadingStep(steps.length);
        const timer = setTimeout(() => setLoadingStep(0), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    setLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    STEP_DELAYS.forEach((delay, i) => {
      if (delay < 0) return;
      cumulative += delay;
      timers.push(setTimeout(() => setLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  // Step 3 ProcessingProgress step progression
  useEffect(() => {
    if (!isBuildPlanLoading) {
      if (buildPlanLoadingStep > 0) {
        const steps = isBuildPlanRefineLoading ? BUILD_PLAN_REFINE_LOADING_STEPS : BUILD_PLAN_LOADING_STEPS;
        setBuildPlanLoadingStep(steps.length);
        const timer = setTimeout(() => setBuildPlanLoadingStep(0), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    setBuildPlanLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    BUILD_PLAN_STEP_DELAYS.forEach((delay, i) => {
      if (delay < 0) return;
      cumulative += delay;
      timers.push(setTimeout(() => setBuildPlanLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isBuildPlanLoading]);

  // Restore draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem('oxygy_ai-app-evaluator_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.appDescription) setAppDescription(parsed.appDescription);
        if (parsed.problemAndUsers) setProblemAndUsers(parsed.problemAndUsers);
        if (parsed.dataAndContent) setDataAndContent(parsed.dataAndContent);
        localStorage.removeItem('oxygy_ai-app-evaluator_draft');
      }
    } catch {}
  }, []);

  const handleExampleClick = (ex: typeof EXAMPLE_APPS[number]) => {
    setAppDescription(ex.appDescription);
    setProblemAndUsers(ex.problemAndUsers);
    setDataAndContent(ex.dataAndContent);
  };

  const handleEvaluate = async () => {
    if (!appDescription.trim() || isLoading) return;
    clearError();
    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setStep2Approved(false);
    setIsRefineLoading(false);
    resetStep3State();

    const data = await evaluateApp({
      appDescription: appDescription.trim(),
      problemAndUsers: problemAndUsers.trim() || 'Not specified',
      dataAndContent: dataAndContent.trim() || 'Not specified',
    });

    if (data) {
      setResult(data);
      // Auto-save back to source artefact if launched from library
      if (sourceArtefactId && user) {
        updateArtefactContent(sourceArtefactId, user.id, {
          designScore: data.design_score?.overall_score ?? null,
          architectureSections: data.architecture?.components || [],
          appDescription,
          problemStatement: problemAndUsers,
        });
      }
      if (user) upsertToolUsed(user.id, 5);
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  const handleApproveAndContinue = () => {
    setStep2Approved(true);
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  const handleGenerateBuildPlan = async () => {
    if (!result || !allStackSelected || isBuildPlanLoading) return;
    clearError();
    setBuildPlan(null);
    setBuildPlanVisibleBlocks(0);
    setBuildPlanSaved(false);
    setIsBuildPlanRefineLoading(false);

    const hostingLabel = TECH_STACK_HOSTING.find(h => h.id === selectedHosting)?.label || selectedHosting || '';
    const dbLabel = TECH_STACK_DATABASE.find(d => d.id === selectedDatabase)?.label || selectedDatabase || '';
    const aiLabel = TECH_STACK_AI_ENGINE.find(a => a.id === selectedAiEngine)?.label || selectedAiEngine || '';

    const data = await generateBuildPlan({
      appDescription: appDescription.trim(),
      problemAndUsers: problemAndUsers.trim() || 'Not specified',
      architecture_summary: result.architecture?.summary || '',
      design_score_summary: `Score: ${result.design_score.overall_score}% — ${result.design_score.verdict}`,
      matrix_quadrant: result.matrix_placement?.quadrant || 'Not determined',
      tech_stack: { hosting: hostingLabel, database_auth: dbLabel, ai_engine: aiLabel },
    });

    if (data) {
      setBuildPlan(data);
      setTimeout(() => step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  const resetStep3State = () => {
    setSelectedHosting(null);
    setSelectedDatabase(null);
    setSelectedAiEngine(null);
    setBuildPlan(null);
    setBuildPlanVisibleBlocks(0);
    setBuildPlanCopied(false);
    setBuildPlanSaved(false);
    setExpandedPhases(new Set([0]));
    setBuildRefineExpanded(false);
    setBuildRefinementAnswers({});
    setBuildRefinementAdditional('');
    setBuildRefinementCount(0);
    setBuildPlanLoadingStep(0);
  };

  const handleReset = () => {
    setAppDescription('');
    setProblemAndUsers('');
    setDataAndContent('');
    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setStep2Approved(false);
    setRefineExpanded(false);
    setRefinementAnswers({});
    setRefinementAdditional('');
    setRefinementCount(0);
    setLoadingStep(0);
    setIsRefineLoading(false);
    resetStep3State();
    clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBackToStep1 = () => {
    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setStep2Approved(false);
    setRefineExpanded(false);
    setRefinementAnswers({});
    setRefinementAdditional('');
    resetStep3State();
    clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBackToStep2 = () => {
    setStep2Approved(false);
    resetStep3State();
    clearError();
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleGoBackToStep3 = () => {
    setBuildPlan(null);
    setBuildPlanVisibleBlocks(0);
    setBuildPlanCopied(false);
    setBuildPlanSaved(false);
    setExpandedPhases(new Set([0]));
    setBuildRefineExpanded(false);
    setBuildRefinementAnswers({});
    setBuildRefinementAdditional('');
    setBuildPlanLoadingStep(0);
    clearError();
    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // Dynamic refinement questions from API, with fallback
  const refinementQuestions = result?.refinement_questions?.length
    ? result.refinement_questions
    : FALLBACK_REFINEMENT_QUESTIONS;

  const hasBreakdownInput = Object.values(breakdownAnswers).some(a => typeof a === 'string' && a.trim());
  const hasRefinementInput = Object.values(refinementAnswers).some(a => typeof a === 'string' && a.trim()) || refinementAdditional.trim() !== '' || hasBreakdownInput;

  const handleRefineEvaluation = async () => {
    if (!hasRefinementInput || isLoading) return;
    clearError();
    setIsRefineLoading(true);

    const answeredQuestions = refinementQuestions
      .map((q, i) => {
        const answer = refinementAnswers[i]?.trim();
        return answer ? `Q: ${q}\nA: ${answer}` : null;
      })
      .filter(Boolean).join('\n\n');

    // Include inline breakdown answers
    const breakdownContext = Object.entries(breakdownAnswers)
      .filter(([, a]) => a?.trim())
      .map(([key, a]) => `Criterion "${SCORE_CRITERIA_LABELS[key]?.label || key}" — additional detail: ${a.trim()}`)
      .join('\n');

    const parts = [
      `[REFINEMENT]\n\nOriginal task: ${appDescription}`,
      answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
      breakdownContext ? `\nScore breakdown clarifications:\n${breakdownContext}` : '',
      refinementAdditional.trim() ? `\nAdditional context: ${refinementAdditional.trim()}` : '',
    ];
    const refinementContext = parts.filter(Boolean).join('\n');

    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setStep2Approved(false);
    resetStep3State();

    const data = await evaluateApp({
      appDescription: appDescription.trim(),
      problemAndUsers: problemAndUsers.trim() || 'Not specified',
      dataAndContent: dataAndContent.trim() || 'Not specified',
      refinement_context: refinementContext,
    });

    if (data) {
      setResult(data);
      // Auto-save back to source artefact if launched from library
      if (sourceArtefactId && user) {
        updateArtefactContent(sourceArtefactId, user.id, {
          designScore: data.design_score?.overall_score ?? null,
          architectureSections: data.architecture?.components || [],
          appDescription,
          problemStatement: problemAndUsers,
        });
      }
      setRefinementCount(c => c + 1);
      setRefinementAnswers({});
      setRefinementAdditional('');
      setBreakdownAnswers({});
    setExpandedCriteria(new Set());
      setRefineExpanded(false);
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  // Build Plan refinement
  const buildRefinementQuestions = buildPlan?.refinement_questions?.length
    ? buildPlan.refinement_questions
    : FALLBACK_REFINEMENT_QUESTIONS;

  const hasBuildRefinementInput = Object.values(buildRefinementAnswers).some(a => typeof a === 'string' && a.trim()) || buildRefinementAdditional.trim() !== '';

  const handleRefineBuildPlan = async () => {
    if (!hasBuildRefinementInput || isBuildPlanLoading || !result) return;
    clearError();
    setIsBuildPlanRefineLoading(true);

    const answeredQuestions = buildRefinementQuestions
      .map((q, i) => {
        const answer = buildRefinementAnswers[i]?.trim();
        return answer ? `Q: ${q}\nA: ${answer}` : null;
      })
      .filter(Boolean).join('\n\n');

    const parts = [
      `[REFINEMENT]\n\nOriginal task: ${appDescription}`,
      answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
      buildRefinementAdditional.trim() ? `\nAdditional context: ${buildRefinementAdditional.trim()}` : '',
    ];

    const hostingLabel = TECH_STACK_HOSTING.find(h => h.id === selectedHosting)?.label || '';
    const dbLabel = TECH_STACK_DATABASE.find(d => d.id === selectedDatabase)?.label || '';
    const aiLabel = TECH_STACK_AI_ENGINE.find(a => a.id === selectedAiEngine)?.label || '';

    setBuildPlan(null);
    setBuildPlanVisibleBlocks(0);
    setBuildPlanSaved(false);

    const data = await generateBuildPlan({
      appDescription: appDescription.trim(),
      problemAndUsers: problemAndUsers.trim() || 'Not specified',
      architecture_summary: result.architecture?.summary || '',
      design_score_summary: `Score: ${result.design_score.overall_score}% — ${result.design_score.verdict}`,
      matrix_quadrant: result.matrix_placement?.quadrant || 'Not determined',
      tech_stack: { hosting: hostingLabel, database_auth: dbLabel, ai_engine: aiLabel },
      refinement_context: parts.filter(Boolean).join('\n'),
    });

    if (data) {
      setBuildPlan(data);
      setBuildRefinementCount(c => c + 1);
      setBuildRefinementAnswers({});
      setBuildRefinementAdditional('');
      setBuildRefineExpanded(false);
    }
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  }, []);

  /** Build the cohesive deliverable for Step 3 build plan */
  const buildFullBuildPlan = (bp: AppBuildPlanResult): string => {
    const lines: string[] = [];
    lines.push('# AI Application Build Plan');
    lines.push('');
    lines.push(bp.build_plan_summary);
    lines.push('');
    if (bp.build_overview) {
      lines.push('## Build Overview');
      lines.push('');
      lines.push(bp.build_overview);
      lines.push('');
    }
    lines.push('## Implementation Phases');
    lines.push('');
    for (const phase of (bp.implementation_phases || [])) {
      lines.push(`### ${phase.phase} (${phase.duration_estimate || 'TBD'})`);
      lines.push(''); lines.push(phase.description); lines.push('');
      if (phase.why_this_matters) { lines.push(`> **Why this matters:** ${phase.why_this_matters}`); lines.push(''); }
      if ((phase.key_activities || []).length > 0) {
        lines.push('**Key activities:**'); lines.push('');
        for (const activity of phase.key_activities) { lines.push(`- ${activity}`); }
        lines.push('');
      }
      if ((phase.deliverables || []).length > 0) {
        lines.push('**Deliverables:**'); lines.push('');
        for (const d of phase.deliverables) { lines.push(`- [ ] ${d}`); }
        lines.push('');
      }
      if (phase.tech_stack_notes) { lines.push(`> **Stack notes:** ${phase.tech_stack_notes}`); lines.push(''); }
    }
    lines.push('## Architecture Components');
    lines.push('');
    for (const comp of (bp.architecture_components || [])) {
      lines.push(`### ${comp.name} [${(comp.priority || '').toUpperCase()}]`);
      lines.push(''); lines.push(comp.description); lines.push('');
      lines.push(`**Tools:** ${(comp.tools || []).join(', ')}`);
      lines.push('');
    }
    if (bp.stack_integration_notes) {
      lines.push('## Stack Integration Notes'); lines.push(''); lines.push(bp.stack_integration_notes); lines.push('');
    }
    lines.push('## Risks & Mitigations'); lines.push('');
    lines.push(bp.risks_and_gaps?.summary || ''); lines.push('');
    for (const item of (bp.risks_and_gaps?.items || [])) {
      lines.push(`### ${item.name} [${(item.severity || '').toUpperCase()}]`);
      lines.push(''); lines.push(item.description); lines.push('');
      lines.push(`**Mitigation:** ${item.mitigation}`); lines.push('');
    }
    return lines.join('\n');
  };

  const handleCopyBuildPlan = async () => {
    if (!buildPlan) return;
    await copyToClipboard(buildFullBuildPlan(buildPlan));
    setBuildPlanCopied(true); setToastMessage('Build plan copied to clipboard');
    setTimeout(() => setBuildPlanCopied(false), 2500);
  };

  const handleDownloadBuildPlan = () => {
    if (!buildPlan) return;
    const date = new Date().toISOString().split('T')[0];
    const content = buildFullBuildPlan(buildPlan);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `app-build-plan-${date}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAppSpec = async () => {
    if (!result || !user) return;
    const saved = await createArtefactFromTool(user.id, {
      name: `App Spec: ${appDescription.slice(0, 55)}${appDescription.length > 55 ? '\u2026' : ''}`,
      type: 'app_spec',
      level: 5,
      sourceTool: 'ai-app-evaluator',
      content: {
        designScore: result.design_score || null,
        matrixPlacement: result.matrix_placement || null,
        architecture: result.architecture || null,
        implementationPlan: result.implementation_plan || null,
        risksAndGaps: result.risks_and_gaps || null,
        refinementQuestions: result.refinement_questions || [],
        appDescription: appDescription,
        problemStatement: problemAndUsers || '',
      },
      preview: `App Spec: ${appDescription.slice(0, 180)}`,
    });
    if (saved) {
      setToastMessage('App spec saved to your library');
    }
  };

  const handleSaveBuildPlan = async () => {
    if (!buildPlan || !user) return;
    const fullContent = buildFullBuildPlan(buildPlan);
    const title = `Build Plan: ${appDescription.slice(0, 50)}${appDescription.length > 50 ? '\u2026' : ''}`;
    const saved = await createArtefactFromTool(user.id, {
      name: title,
      type: 'build_guide',
      level: 5,
      sourceTool: 'ai-app-evaluator',
      content: {
        markdown: fullContent,
        platform: 'generic',
        toolName: 'App Evaluator',
        taskDescription: appDescription,
      },
      preview: `Build Plan: ${appDescription.slice(0, 180)}`,
    });
    if (saved) {
      setBuildPlanSaved(true);
      setToastMessage('Build plan saved to your library');
      setTimeout(() => setBuildPlanSaved(false), 3000);
    }
  };

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="this tool" />;

  return (
    <div style={{ padding: '28px 36px', minHeight: '100%', fontFamily: FONT, background: '#F7FAFC' }}>
      <style>{`
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        @keyframes ppPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes ppFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ppConnectorFlow {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
        @keyframes ppSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ppQuadrantPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes ppDotPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* ═══ Page Title (§3.1) ═══ */}
      <h1 style={{
        fontSize: 28, fontWeight: 800, color: '#1A202C',
        letterSpacing: '-0.4px', margin: 0, marginBottom: 6,
        fontFamily: FONT,
      }}>
        AI App Evaluator
      </h1>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0, marginBottom: 20, fontFamily: FONT }}>
        Building an AI-powered product requires decisions across architecture, data, and user experience that most teams make ad-hoc. The App Evaluator scores your idea, positions it on a strategic matrix, and generates a tech-stack-specific build plan — so you can start building with confidence.
      </p>

      {/* ═══ How It Works — Overview Strip (§3.3) ═══ */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Describe your idea', detail: 'What it does, who uses it, what data it needs', done: step1Done },
          { number: 2, label: 'Score & matrix', detail: 'Design score and strategic positioning', done: step2Done },
          { number: 3, label: 'Choose your stack', detail: 'Hosting, database, and AI engine', done: step3Done },
          { number: 4, label: 'Build plan', detail: 'Tech-stack-specific implementation guide', done: buildPlan !== null },
        ]}
        outcome="A design score, strategic positioning, and a complete build plan tailored to your chosen technology stack."
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Describe Your Idea                             */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step1Ref}>
        <StepCard stepNumber={1} title="Describe your idea"
          subtitle="Tell us about your AI application idea — what it does, who uses it, and what data it needs."
          done={step1Done} collapsed={step1Done}
        >
          {/* Your Project chip */}
          {projectChip && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: LEVEL_ACCENT_DARK, fontWeight: 600, marginBottom: 6, fontFamily: FONT }}>
                ◆ Your Project
              </div>
              <button
                onClick={() => { setAppDescription(projectChip.appDescription); setProblemAndUsers(projectChip.problemAndUsers); setDataAndContent(projectChip.dataAndContent); }}
                style={{
                  width: '100%', textAlign: 'left', background: `${LEVEL_ACCENT}18`,
                  border: `1.5px solid ${LEVEL_ACCENT_DARK}44`,
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 12, color: LEVEL_ACCENT_DARK, fontWeight: 500,
                  cursor: 'pointer', fontFamily: FONT, lineHeight: 1.5,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${LEVEL_ACCENT}30`)}
                onMouseLeave={e => (e.currentTarget.style.background = `${LEVEL_ACCENT}18`)}
              >
                {projectChip.appDescription}
              </button>
            </div>
          )}

          {/* Example chips (§4.6) */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500, marginBottom: 8, fontFamily: FONT }}>Try an example:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXAMPLE_APPS.map((ex) => (
                <button key={ex.name} onClick={() => handleExampleClick(ex)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: '#4A5568',
                    background: '#F7FAFC', border: '1px solid #E2E8F0', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s, color 0.15s', textAlign: 'left', lineHeight: 1.4, fontFamily: FONT,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.background = `${LEVEL_ACCENT}18`; e.currentTarget.style.color = LEVEL_ACCENT_DARK; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F7FAFC'; e.currentTarget.style.color = '#4A5568'; }}
                >{ex.name}</button>
              ))}
            </div>
          </div>

          {/* Input fields */}
          {[
            { label: 'What does your application do?', value: appDescription, onChange: setAppDescription, placeholder: 'e.g., A personalised learning platform where students log in, see their progress...', required: true, minH: 80 },
            { label: 'Who is this for and what problem does it solve?', value: problemAndUsers, onChange: setProblemAndUsers, placeholder: 'e.g., Students in a professional certification programme...', required: false, minH: 60 },
            { label: 'What data or content will it work with?', value: dataAndContent, onChange: setDataAndContent, placeholder: 'e.g., Student profiles, quiz scores, module completion data...', required: false, minH: 60 },
          ].map((field, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
                {field.label}
                {!field.required && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, background: `${LEVEL_ACCENT}44`, borderRadius: 10, padding: '2px 8px' }}>Recommended</span>
                )}
              </label>
              <textarea
                value={field.value}
                onChange={e => { field.onChange(e.target.value); const ta = e.target; ta.style.height = 'auto'; ta.style.height = Math.max(field.minH, ta.scrollHeight) + 'px'; }}
                placeholder={field.placeholder}
                style={{
                  width: '100%', minHeight: field.minH, maxHeight: 200, resize: 'none', overflow: 'auto',
                  border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#1A202C',
                  fontFamily: FONT, lineHeight: 1.6, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>
          ))}

          {/* Evaluate button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ActionBtn
              label={isLoading ? 'Evaluating...' : 'Evaluate My App'}
              onClick={handleEvaluate}
              primary
              disabled={!appDescription.trim() || isLoading}
              iconAfter={isLoading ? (
                <span style={{ width: 16, height: 16, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'ppSpin 0.7s linear infinite' }} />
              ) : <ArrowRight size={14} />}
            />
          </div>

          {error && !result && (
            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#FFF5F5', border: '1px solid #FC8181', fontSize: 13, color: '#C53030', fontFamily: FONT }}>
              {error}
            </div>
          )}
        </StepCard>
      </div>

      {/* Connector 1→2 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Score & Strategic Matrix                       */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step2Ref} style={result && !step2Done ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard stepNumber={2} title="Score & strategic matrix"
          subtitle="Your application has been evaluated across 5 criteria and positioned on the strategic matrix."
          done={step2Done} collapsed={step2Done}
          locked={!result && !isLoading}
          lockedMessage="Complete Step 1 to evaluate your idea"
        >
          {isLoading && !result ? (
            <ProcessingProgress
              steps={isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS}
              currentStep={loadingStep}
              header={isRefineLoading ? 'Refining your evaluation…' : 'Evaluating your application…'}
              subtext="This usually takes 15–25 seconds"
            />
          ) : result ? (
            <>
              {/* ── Side-by-side: Score (left) + Matrix (right) ── */}
              {(() => {
                // Compute matrix placement once for both cards
                const criteria = result.design_score.criteria || {};
                const mp = result.matrix_placement || {
                  technical_complexity: Math.round(Math.min(95, Math.max(10, 100 - ((((criteria as Record<string, DesignScoreCriteria>).technical_feasibility?.score || 50) * 0.6 + ((criteria as Record<string, DesignScoreCriteria>).scalability?.score || 50) * 0.4) * 0.8 + 10)))),
                  business_impact: Math.round(Math.min(95, Math.max(10, ((criteria as Record<string, DesignScoreCriteria>).user_clarity?.score || 50) * 0.5 + ((criteria as Record<string, DesignScoreCriteria>).personalisation?.score || 50) * 0.3 + ((criteria as Record<string, DesignScoreCriteria>).data_architecture?.score || 50) * 0.2))),
                  quadrant: '' as string,
                  quadrant_description: '',
                };
                if (!result.matrix_placement) {
                  mp.quadrant = mp.technical_complexity < 50
                    ? (mp.business_impact >= 50 ? 'Quick Win' : 'Nice to Have')
                    : (mp.business_impact >= 50 ? 'Strategic Investment' : 'Rethink');
                  const qd: Record<string, string> = {
                    'Quick Win': 'Low complexity with high business impact — ship it fast and iterate.',
                    'Strategic Investment': 'High complexity with high business impact — worth the investment, plan carefully.',
                    'Nice to Have': 'Low complexity, lower business impact — a good learning project or internal tool.',
                    'Rethink': 'High complexity with lower business impact — consider simplifying the scope.',
                  };
                  mp.quadrant_description = qd[mp.quadrant] || '';
                }
                const qInfo = MATRIX_QUADRANTS[mp.quadrant as keyof typeof MATRIX_QUADRANTS] || MATRIX_QUADRANTS['Nice to Have'];
                const QuadrantIcon = QUADRANT_ICONS[mp.quadrant] || Lightbulb;
                const playbookFirstMove = result.matrix_placement?.playbook_first_move;
                const playbookFraming = result.matrix_placement?.playbook_framing;
                const playbookQuestions = result.matrix_placement?.playbook_questions;
                const criteriaEntries = (Object.entries(criteria) as [string, DesignScoreCriteria][]);
                // Sort: strongest first for collapsed view
                const sortedStrongestFirst = [...criteriaEntries].sort(([, a], [, b]) => b.score - a.score);
                // Weakest two for highlight
                const weakest = [...criteriaEntries].sort(([, a], [, b]) => a.score - b.score).slice(0, 2);
                const weakKeys = new Set(weakest.map(([k]) => k));

                return (
                  <>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                      opacity: visibleBlocks >= 1 ? 1 : 0,
                      transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                      marginBottom: 14,
                    }}>
                      {/* ── Left: Design Score Card ── */}
                      <div style={{
                        background: '#FFFFFF', borderRadius: 14,
                        border: expandedCard === 'score' ? `1.5px solid ${LEVEL_ACCENT}` : '1px solid #E2E8F0',
                        overflow: 'hidden', transition: 'border-color 0.15s',
                      }}>
                        <button
                          onClick={() => toggleCard('score')}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'stretch',
                            padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          {/* Left column: Score circle vertically centred */}
                          <div style={{
                            flexShrink: 0, width: 150,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '24px 10px',
                          }}>
                            <ScoreCircle score={result.design_score.overall_score} animated={scoreAnimated} size={130} />
                          </div>

                          {/* Right column */}
                          <div style={{ flex: 1, padding: '18px 22px 18px 8px', display: 'flex', flexDirection: 'column' }}>
                            {/* Title + Details toggle */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Design Score</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginTop: 2 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>
                                  {expandedCard === 'score' ? 'Hide' : 'Details'}
                                </span>
                                <ChevronDown size={12} color={LEVEL_ACCENT_DARK} style={{ transform: expandedCard === 'score' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                              </div>
                            </div>

                            {/* Verdict */}
                            <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT }}>
                              {getVerdictText(result.design_score.overall_score)}
                            </div>

                            {/* Weakest callout — right under the description */}
                            {weakest.length > 0 && (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, alignSelf: 'flex-start',
                                background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6,
                                padding: '4px 9px',
                              }}>
                                <Info size={11} color="#92400E" />
                                <span style={{ fontSize: 11, color: '#92400E', fontFamily: FONT, fontWeight: 500 }}>
                                  Weakest: {weakest.map(([k]) => SCORE_CRITERIA_LABELS[k]?.label || k).join(' & ')}
                                </span>
                              </div>
                            )}

                            {/* 5 dimension rows: icon | label | bar | score — equidistant */}
                            <div style={{
                              display: 'flex', flexDirection: 'column', gap: 7,
                              marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0F0F0',
                            }}>
                              {sortedStrongestFirst.map(([key, val]) => {
                                const CriterionIcon = CRITERIA_ICONS[key] || Info;
                                const isWeak = weakKeys.has(key);
                                const barColor = getScoreColor(val.score);
                                return (
                                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 22 }}>
                                    <div style={{ width: 20, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                      <CriterionIcon size={14} color={isWeak ? '#ED8936' : '#A0AEC0'} />
                                    </div>
                                    <span style={{
                                      width: 130, flexShrink: 0, fontSize: 11.5,
                                      fontWeight: isWeak ? 600 : 500, color: isWeak ? '#744210' : '#4A5568',
                                      fontFamily: FONT, whiteSpace: 'nowrap',
                                    }}>
                                      {SCORE_CRITERIA_LABELS[key]?.label || key}
                                    </span>
                                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#EDF2F7', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', borderRadius: 3, width: `${val.score}%`, background: barColor, transition: 'width 0.7s ease' }} />
                                    </div>
                                    <span style={{ width: 28, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 700, color: isWeak ? '#ED8936' : barColor, fontFamily: FONT }}>
                                      {val.score}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* ── Right: Strategic Matrix Card ── */}
                      <div style={{
                        background: '#FFFFFF', borderRadius: 14,
                        border: expandedCard === 'matrix' ? `1.5px solid ${qInfo.border}` : '1px solid #E2E8F0',
                        overflow: 'hidden', transition: 'border-color 0.15s',
                      }}>
                        <button
                          onClick={() => toggleCard('matrix')}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'stretch',
                            padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          {/* Left column: Quadrant circle */}
                          <div style={{
                            flexShrink: 0, width: 150,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '18px 12px 14px',
                          }}>
                            <QuadrantCircle quadrant={mp.quadrant} animated={true} size={130} />
                          </div>

                          {/* Right column */}
                          <div style={{ flex: 1, padding: '18px 22px 18px 4px', display: 'flex', flexDirection: 'column' }}>
                            {/* Title + Details toggle */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{mp.quadrant}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginTop: 2 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>
                                  {expandedCard === 'matrix' ? 'Hide' : 'Details'}
                                </span>
                                <ChevronDown size={12} color={LEVEL_ACCENT_DARK} style={{ transform: expandedCard === 'matrix' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                              </div>
                            </div>

                            {/* Description */}
                            <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT }}>
                              {mp.quadrant_description}
                            </div>

                            {/* First move preview — below separator */}
                            {playbookFirstMove && (
                              <div style={{
                                marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0F0F0',
                              }}>
                                <div style={{
                                  background: '#1A202C', borderRadius: 8, padding: '10px 14px',
                                }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: LEVEL_ACCENT, letterSpacing: '0.06em', marginBottom: 4, fontFamily: FONT }}>
                                    Suggested first move
                                  </div>
                                  <div style={{
                                    fontSize: 11.5, color: '#CBD5E0', lineHeight: 1.5, fontFamily: FONT,
                                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                                  }}>
                                    {playbookFirstMove}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Complexity & Impact score rows */}
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {[
                                { label: 'Complexity', value: mp.technical_complexity, icon: Settings },
                                { label: 'Impact', value: mp.business_impact, icon: TrendingUp },
                              ].map(row => {
                                const barColor = row.value >= 70 ? '#38A169' : row.value >= 40 ? '#D69E2E' : '#E57A5A';
                                return (
                                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 22 }}>
                                    <row.icon size={14} color="#718096" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4A5568', fontFamily: FONT, width: 80, flexShrink: 0 }}>{row.label}</span>
                                    <div style={{ flex: 1, height: 6, background: '#EDF2F7', borderRadius: 3, overflow: 'hidden' }}>
                                      <div style={{ width: `${row.value}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.6s ease-out' }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1A202C', fontFamily: FONT, width: 28, textAlign: 'right', flexShrink: 0 }}>{row.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* ── Expanded: Score breakdown (full width below the grid) ── */}
                    {expandedCard === 'score' && (
                      <div style={{
                        background: '#FFFFFF', borderRadius: 14, border: `1.5px solid ${LEVEL_ACCENT}`,
                        padding: '22px 24px', marginBottom: 14,
                        animation: 'ppSlideDown 0.25s ease-out both',
                      }}>
                        {/* Header with collapse button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Score Breakdown</div>
                          <button
                            onClick={() => toggleCard('score')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                              cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#718096', fontFamily: FONT,
                            }}
                          >
                            Collapse <ChevronUp size={12} color="#718096" />
                          </button>
                        </div>

                        {/* Two-column layout: radar left, dimensions right */}
                        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
                          {/* Left: radar chart */}
                          <div style={{ flexShrink: 0, width: 380, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <RadarChart criteria={[...criteriaEntries].sort(([, a], [, b]) => a.score - b.score)} />
                          </div>

                          {/* Right: dimension rows with visible text, textarea on click */}
                          <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #F0F0F0', paddingLeft: 22 }}>
                            {[...criteriaEntries].sort(([, a], [, b]) => a.score - b.score).map(([key, val], idx, arr) => {
                              const confidence = val.confidence ?? 'inferred';
                              const whatToDefine = val.what_to_define ?? null;
                              const CriterionIcon = CRITERIA_ICONS[key] || Info;
                              const isRowExpanded = expandedCriteria.has(key);
                              const cColor = getCriterionColor(val.score);

                              return (
                                <div key={key} style={{ borderBottom: idx < arr.length - 1 ? '1px solid #F0F0F0' : 'none', padding: '12px 0' }}>
                                  {/* Header row: icon + name + score (large) */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <div style={{
                                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                      background: cColor.bg, border: `1px solid ${cColor.border}`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <CriterionIcon size={14} color={cColor.text} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>
                                        {SCORE_CRITERIA_LABELS[key]?.label || key}
                                      </span>
                                      <span style={{ fontSize: 10, color: '#A0AEC0', fontFamily: FONT, marginLeft: 8 }}>
                                        Evaluation method: {confidence === 'explicit' ? 'Based on description' : 'AI inferred'}
                                      </span>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                      <MiniScoreCircle score={val.score} size={42} />
                                    </div>
                                  </div>

                                  {/* Assessment — always visible */}
                                  <div style={{ fontSize: 11.5, color: '#4A5568', lineHeight: 1.55, fontFamily: FONT, paddingLeft: 38 }}>
                                    {val.assessment}
                                  </div>

                                  {/* What to define — always visible */}
                                  {whatToDefine && (
                                    <div style={{ paddingLeft: 38, marginTop: 6 }}>
                                      <div style={{ fontSize: 11, color: '#744210', lineHeight: 1.5, fontFamily: FONT }}>
                                        <span style={{ fontWeight: 700 }}>What to define: </span>{whatToDefine}
                                      </div>

                                      {/* Toggle for textarea */}
                                      {!isRowExpanded ? (
                                        <button
                                          onClick={() => setExpandedCriteria(prev => { const next = new Set(prev); next.add(key); return next; })}
                                          style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                            fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT,
                                          }}
                                        >
                                          <ChevronDown size={12} color={LEVEL_ACCENT_DARK} />
                                          {(breakdownAnswers[key] || '').trim() ? 'Edit your answer' : 'Add your answer'}
                                        </button>
                                      ) : (
                                        <div style={{ marginTop: 6, animation: 'ppSlideDown 0.2s ease-out both' }}>
                                          <textarea
                                            value={breakdownAnswers[key] || ''}
                                            onChange={e => setBreakdownAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                                            placeholder={`Your thoughts on ${(SCORE_CRITERIA_LABELS[key]?.label || key).toLowerCase()}...`}
                                            onClick={e => e.stopPropagation()}
                                            rows={2}
                                            style={{
                                              width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                                              padding: '8px 10px', fontSize: 12, fontFamily: FONT, color: '#1A202C',
                                              outline: 'none', boxSizing: 'border-box' as const, background: '#FFFFFF',
                                              resize: 'vertical' as const, lineHeight: 1.5,
                                            }}
                                            onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                                            onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                                          />
                                          <button
                                            onClick={() => setExpandedCriteria(prev => { const next = new Set(prev); next.delete(key); return next; })}
                                            style={{
                                              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3,
                                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                              fontSize: 10, fontWeight: 500, color: '#A0AEC0', fontFamily: FONT,
                                            }}
                                          >
                                            <ChevronUp size={11} color="#A0AEC0" /> Done
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Next Question callout */}
                            {result.next_question && (
                              <div style={{
                                marginTop: 12,
                                background: `${LEVEL_ACCENT}15`,
                                border: `1.5px solid ${LEVEL_ACCENT_DARK}30`,
                                borderRadius: 10, padding: '10px 14px',
                              }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: LEVEL_ACCENT_DARK, letterSpacing: '0.06em', marginBottom: 4, fontFamily: FONT }}>
                                  Next question to answer
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontFamily: FONT }}>
                                  {result.next_question}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Refine button if any inline answers provided */}
                        {hasBreakdownInput && (
                          <div style={{ marginTop: 14 }}>
                            <ActionBtn
                              label={isLoading ? 'Refining...' : 'Refine with these answers'}
                              onClick={handleRefineEvaluation}
                              primary
                              disabled={isLoading}
                              iconAfter={isLoading ? <span style={{ width: 13, height: 13, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block', animation: 'ppSpin 0.6s linear infinite' }} /> : <ArrowRight size={13} />}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Expanded: Matrix breakdown (full width below the grid) ── */}
                    {expandedCard === 'matrix' && (
                      <div style={{
                        background: '#FFFFFF', borderRadius: 14, border: `1.5px solid ${qInfo.border}`,
                        padding: '22px 24px', marginBottom: 14,
                        animation: 'ppSlideDown 0.25s ease-out both',
                      }}>
                        {/* Header with collapse button — matches score breakdown */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Strategic Matrix</div>
                          <button
                            onClick={() => toggleCard('matrix')}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                              cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#718096', fontFamily: FONT,
                            }}
                          >
                            Collapse <ChevronUp size={12} color="#718096" />
                          </button>
                        </div>

                        {/* Two-column layout: chart left, text right */}
                        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
                          {/* Left: matrix chart — fixed width, fills height */}
                          <div style={{ flexShrink: 0, width: 380, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                              <MatrixChart
                                technicalComplexity={mp.technical_complexity}
                                businessImpact={mp.business_impact}
                                quadrant={mp.quadrant}
                                animated={scoreAnimated}
                              />
                            </div>
                            <div style={{ fontSize: 10, color: '#A0AEC0', fontFamily: FONT, textAlign: 'center', marginTop: 6 }}>
                              Click the dot to see scores
                            </div>
                          </div>

                          {/* Right: all text content */}
                          <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #F0F0F0', paddingLeft: 22 }}>
                            {/* Quadrant rationale header */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: qInfo.color, border: `1px solid ${qInfo.border}`,
                                borderRadius: 8, padding: '6px 12px', marginBottom: 10,
                              }}>
                                <QuadrantIcon size={14} color={qInfo.textColor} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: qInfo.textColor, fontFamily: FONT }}>{mp.quadrant}</span>
                              </div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 6 }}>
                                Why is this a {mp.quadrant.toLowerCase()}?
                              </div>
                              <div style={{ fontSize: 12.5, color: '#4A5568', lineHeight: 1.65, fontFamily: FONT }}>
                                {mp.quadrant_description}
                              </div>
                            </div>

                            {/* Strategic Framing */}
                            {playbookFraming && (
                              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 14, marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 6 }}>
                                  What this means for you
                                </div>
                                <div style={{ fontSize: 12.5, color: '#4A5568', lineHeight: 1.65, fontFamily: FONT }}>
                                  {playbookFraming}
                                </div>
                              </div>
                            )}

                            {/* Questions */}
                            {playbookQuestions && playbookQuestions.length > 0 && (
                              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 14, marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT, marginBottom: 8 }}>
                                  Before you build, answer these
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {playbookQuestions.map((q: string, i: number) => (
                                    <div key={i} style={{
                                      display: 'flex', gap: 8, alignItems: 'flex-start',
                                      fontSize: 12, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT,
                                    }}>
                                      <span style={{ color: LEVEL_ACCENT_DARK, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                                      <span>{q}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Suggested first move — dark banner */}
                            {playbookFirstMove && (
                              <div style={{
                                background: '#1A202C', borderRadius: 8, padding: '12px 14px',
                              }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: LEVEL_ACCENT, letterSpacing: '0.06em', marginBottom: 4, fontFamily: FONT }}>
                                  Suggested first move
                                </div>
                                <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.6, fontFamily: FONT }}>
                                  {playbookFirstMove}
                                </div>
                              </div>
                            )}

                            {/* Fallback */}
                            {!playbookFraming && !playbookFirstMove && (
                              <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                                {mp.quadrant_description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Refinement (§4.5) */}
              <div style={{
                background: '#F7FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px',
                opacity: visibleBlocks >= 2 ? 1 : 0,
                transform: visibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: refineExpanded ? 16 : 12 }}>
                  <Info size={16} color="#718096" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                    Review the score and matrix placement above. Use the per-dimension "What to define" fields to strengthen individual scores, or refine the overall evaluation below with broader context.
                  </div>
                </div>

                {!refineExpanded && (
                  <button onClick={() => setRefineExpanded(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}
                  >
                    <ChevronDown size={14} /> Want to refine the overall evaluation?
                    {refinementCount > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, borderRadius: 20, padding: '2px 10px', marginLeft: 6 }}>
                        Refinement #{refinementCount}
                      </span>
                    )}
                  </button>
                )}

                {refineExpanded && (
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, animation: 'ppSlideDown 0.3s ease-out both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Overall Refinement</div>
                        {refinementCount > 0 && (
                          <div style={{ fontSize: 11, fontWeight: 600, background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, borderRadius: 20, padding: '2px 10px', fontFamily: FONT }}>Refinement #{refinementCount}</div>
                        )}
                      </div>
                      <button onClick={() => setRefineExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: '#A0AEC0' }}>
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>These questions look at your design holistically — across both the score and strategic matrix. Answer any to get a more targeted evaluation.</p>
                    {refinementQuestions.map((question, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>{question}</label>
                        <input type="text" value={refinementAnswers[i] || ''} onChange={e => setRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Your answer…"
                          style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const, background: '#FFFFFF' }}
                          onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                          onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                        />
                      </div>
                    ))}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>Anything else to add?</label>
                      <textarea value={refinementAdditional} onChange={e => setRefinementAdditional(e.target.value)}
                        placeholder="Any additional requirements, constraints, or context…"
                        style={{ width: '100%', minHeight: 60, resize: 'none', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const, background: '#FFFFFF', lineHeight: 1.5 }}
                        onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                        onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                      />
                    </div>
                    <ActionBtn label={isLoading ? 'Refining…' : 'Refine Evaluation'} onClick={handleRefineEvaluation} primary disabled={!hasRefinementInput || isLoading}
                      iconAfter={isLoading ? <span style={{ width: 13, height: 13, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block', animation: 'ppSpin 0.6s linear infinite' }} /> : <ArrowRight size={13} />}
                    />
                  </div>
                )}
              </div>

              {/* Action row: Back to Step 1 | Approve and Continue */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <ActionBtn icon={<ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />} label="Back to Step 1" onClick={handleGoBackToStep1} />
                <ActionBtn label="Approve and Continue" onClick={handleApproveAndContinue} primary iconAfter={<ArrowRight size={14} />} />
              </div>
            </>
          ) : null}
        </StepCard>
      </div>

      {/* Connector 2→3 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 3 — Choose Your Tech Stack                          */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step3Ref} style={step2Approved ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard stepNumber={3} title="Choose your tech stack"
          subtitle="Select your preferred hosting, database, and AI engine — your build plan will be tailored to these choices."
          done={step3Done} collapsed={step3Done}
          locked={!step2Done}
          lockedMessage="Approve your evaluation in Step 2 to unlock"
        >
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24,
          }}>
            <TechStackGroup title="Hosting" icon={<Server size={16} color={LEVEL_ACCENT_DARK} />} options={TECH_STACK_HOSTING} selected={selectedHosting} onSelect={setSelectedHosting} />
            <TechStackGroup title="Database & Auth" icon={<Database size={16} color={LEVEL_ACCENT_DARK} />} options={TECH_STACK_DATABASE} selected={selectedDatabase} onSelect={setSelectedDatabase} />
            <TechStackGroup title="AI Engine" icon={<Cpu size={16} color={LEVEL_ACCENT_DARK} />} options={TECH_STACK_AI_ENGINE} selected={selectedAiEngine} onSelect={setSelectedAiEngine} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ActionBtn icon={<ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />} label="Back to Step 2" onClick={handleGoBackToStep2} />
            <ActionBtn
              label="Generate Build Plan"
              onClick={handleGenerateBuildPlan}
              primary
              disabled={!allStackSelected || isBuildPlanLoading}
              iconAfter={<ArrowRight size={14} />}
            />
          </div>

          {error && !buildPlan && (
            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#FFF5F5', border: '1px solid #FC8181', fontSize: 13, color: '#C53030', fontFamily: FONT }}>
              {error}
            </div>
          )}
        </StepCard>
      </div>

      {/* Connector 3→4 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 4 — Build Plan                                      */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step4Ref} style={step3Done ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard stepNumber={4} title="Your build plan"
          subtitle="A complete, tech-stack-specific guide to building your AI application — from first command to deployment."
          done={buildPlan !== null && !isBuildPlanLoading} collapsed={false}
          locked={!step3Done}
          lockedMessage="Select your tech stack and generate in Step 3"
        >
          {/* Loading state */}
          {isBuildPlanLoading && !buildPlan && (
            <ProcessingProgress
              steps={isBuildPlanRefineLoading ? BUILD_PLAN_REFINE_LOADING_STEPS : BUILD_PLAN_LOADING_STEPS}
              currentStep={buildPlanLoadingStep}
              header={isBuildPlanRefineLoading ? 'Refining your build plan…' : 'Generating your build plan…'}
              subtext="This usually takes 20–30 seconds"
            />
          )}

          {/* Build Plan Output */}
          {buildPlan && (
            <>
              {/* Summary banner */}
              <div style={{
                opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0, transform: buildPlanVisibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
                background: `${LEVEL_ACCENT_DARK}06`, borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', lineHeight: 1.6, fontFamily: FONT }}>{buildPlan.build_plan_summary}</div>
              </div>

              {/* View mode toggle + actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10,
                opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0, transition: 'opacity 0.3s',
              }}>
                <div style={{ display: 'flex', background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <ToggleBtn icon={<Sparkles size={13} />} label="Guide" active={buildPlanViewMode === 'cards'} onClick={() => setBuildPlanViewMode('cards')} />
                  <ToggleBtn icon={<Code size={13} />} label="Markdown" active={buildPlanViewMode === 'markdown'} onClick={() => setBuildPlanViewMode('markdown')} highlight />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn icon={buildPlanCopied ? <Check size={13} /> : <Copy size={13} />} label={buildPlanCopied ? 'Copied!' : 'Copy'} onClick={handleCopyBuildPlan} primary />
                  <ActionBtn icon={<Download size={13} />} label="Download" onClick={handleDownloadBuildPlan} />
                  <ActionBtn icon={<Library size={13} />} label={buildPlanSaved ? 'Saved!' : 'Save'} onClick={handleSaveBuildPlan} primary disabled={buildPlanSaved} />
                </div>
              </div>

              {/* Markdown view */}
              {buildPlanViewMode === 'markdown' && (
                <div style={{ background: '#1A202C', borderRadius: 12, padding: '22px 24px', overflow: 'auto', marginBottom: 16 }}>
                  <pre style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", whiteSpace: 'pre-wrap', margin: 0 }}>
                    {buildFullBuildPlan(buildPlan)}
                  </pre>
                </div>
              )}

              {/* Cards/Guide view */}
              {buildPlanViewMode === 'cards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* ─── 1. Build Overview ─── */}
                  {buildPlan.build_overview && (
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 2 ? 1 : 0, transform: buildPlanVisibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#38B2AC', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Build Overview</div>
                        <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>— How your selected tools work together</div>
                      </div>
                      <div style={{ background: `${LEVEL_ACCENT}12`, border: `1px solid ${LEVEL_ACCENT}40`, borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.7, fontFamily: FONT }}>{buildPlan.build_overview}</div>
                      </div>
                    </div>
                  )}

                  {/* ─── 2. Stack Integration Overview ─── */}
                  {buildPlan.stack_integration_notes && (
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 3 ? 1 : 0, transform: buildPlanVisibleBlocks >= 3 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#5A67D8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>2</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>How Your Stack Connects</div>
                        <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>— How hosting, database, and AI engine work together</div>
                      </div>
                      <div style={{ background: `${LEVEL_ACCENT}12`, border: `1px solid ${LEVEL_ACCENT}40`, borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.7, fontFamily: FONT }}>{buildPlan.stack_integration_notes}</div>
                      </div>
                    </div>
                  )}

                  {/* ─── 3. Architecture Components ─── */}
                  <div style={{
                    opacity: buildPlanVisibleBlocks >= 4 ? 1 : 0, transform: buildPlanVisibleBlocks >= 4 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#D69E2E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>3</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Architecture Components</div>
                      <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>— What you need to build and the tools for each</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {(buildPlan.architecture_components || []).map((comp: ArchitectureComponent, idx: number) => {
                        const priority = getPriorityStyle(comp.priority);
                        return (
                          <div key={idx} style={{
                            background: '#FFFFFF', borderRadius: 12, padding: '16px 18px', border: '1px solid #E2E8F0',
                            borderTop: `3px solid ${comp.priority === 'essential' ? '#38B2AC' : comp.priority === 'recommended' ? '#D69E2E' : '#A0AEC0'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{comp.name}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 8px', background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`, textTransform: 'capitalize', fontFamily: FONT }}>{comp.priority}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, marginBottom: 10, fontFamily: FONT }}>{comp.description}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {(comp.tools || []).map((tool: string, i: number) => (
                                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, background: `${LEVEL_ACCENT}30`, borderRadius: 8, padding: '3px 8px', fontFamily: FONT }}>{tool}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── 4. Implementation Phases ─── */}
                  <div style={{
                    opacity: buildPlanVisibleBlocks >= 5 ? 1 : 0, transform: buildPlanVisibleBlocks >= 5 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E53E3E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>4</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Implementation Phases</div>
                      <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>— Step-by-step build roadmap</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(buildPlan.implementation_phases || []).map((phase: BuildPlanPhase, idx: number) => {
                        const isExp = expandedPhases.has(idx);
                        return (
                          <div key={idx} style={{ background: '#FFFFFF', borderRadius: 12, padding: '14px 18px', border: '1px solid #E2E8F0' }}>
                            <button onClick={() => togglePhase(idx)} style={{
                              display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', gap: 10,
                            }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                {idx + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{phase.phase}</div>
                                {!isExp && <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT, marginTop: 2 }}>{(phase.why_this_matters || phase.description || '').slice(0, 90)}{((phase.why_this_matters || phase.description || '').length) > 90 ? '…' : ''}</div>}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', background: '#F7FAFC', borderRadius: 8, padding: '3px 10px', border: '1px solid #E2E8F0', fontFamily: FONT, flexShrink: 0 }}>
                                {phase.duration_estimate || 'TBD'}
                              </span>
                              <ChevronDown size={14} color="#A0AEC0" style={{ transform: isExp ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
                            </button>
                            {isExp && (
                              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F0F0' }}>
                                <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 10, fontFamily: FONT }}>{phase.description}</div>
                                {phase.why_this_matters && (
                                  <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, marginBottom: 12, fontStyle: 'italic', fontFamily: FONT }}>{phase.why_this_matters}</div>
                                )}
                                {/* Key Activities */}
                                {(phase.key_activities || []).length > 0 && (
                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: FONT }}>Key Activities</div>
                                    <div style={{ paddingLeft: 4 }}>
                                      {phase.key_activities.map((activity: string, i: number) => (
                                        <div key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.7, display: 'flex', gap: 8, marginBottom: 4, fontFamily: FONT }}>
                                          <span style={{ color: LEVEL_ACCENT_DARK, flexShrink: 0, fontWeight: 700 }}>&bull;</span>{activity}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Deliverables */}
                                {(phase.deliverables || []).length > 0 && (
                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: FONT }}>Deliverables</div>
                                    <div style={{ paddingLeft: 4 }}>
                                      {phase.deliverables.map((d: string, i: number) => (
                                        <div key={i} style={{ fontSize: 12, color: '#276749', lineHeight: 1.7, display: 'flex', gap: 8, marginBottom: 4, fontFamily: FONT }}>
                                          <span style={{ color: '#38B2AC', flexShrink: 0 }}>✓</span>{d}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {phase.tech_stack_notes && (
                                  <div style={{ marginTop: 4, padding: '10px 14px', background: `${LEVEL_ACCENT}15`, borderRadius: 10, border: `1px solid ${LEVEL_ACCENT}35`, fontSize: 12, color: LEVEL_ACCENT_DARK, lineHeight: 1.6, fontFamily: FONT }}>
                                    <strong>Stack notes:</strong> {phase.tech_stack_notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── 5. Risks & Mitigations ─── */}
                  {(buildPlan.risks_and_gaps?.items || []).length > 0 && (
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 6 ? 1 : 0, transform: buildPlanVisibleBlocks >= 6 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#718096', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>5</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Risks & Mitigations</div>
                        <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>— What to watch out for</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(buildPlan.risks_and_gaps?.items || []).map((item: RiskItem, idx: number) => {
                          const severity = getSeverityStyle(item.severity);
                          return (
                            <div key={idx} style={{ background: '#FFFFFF', borderRadius: 12, padding: '14px 18px', border: '1px solid #E2E8F0', borderLeft: `4px solid ${severity.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{item.name}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 8px', background: severity.bg, color: severity.color, border: `1px solid ${severity.border}`, textTransform: 'capitalize', fontFamily: FONT }}>{item.severity}</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, marginBottom: 8, fontFamily: FONT }}>{item.description}</div>
                              <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 8, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#276749', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, fontFamily: FONT }}>Mitigation</div>
                                <div style={{ fontSize: 12, color: '#2F855A', lineHeight: 1.5, fontFamily: FONT }}>{item.mitigation}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OutputActionsPanel */}
              <div style={{ marginTop: 20, opacity: buildPlanVisibleBlocks >= 7 ? 1 : 0, transform: buildPlanVisibleBlocks >= 7 ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.3s, transform 0.3s' }}>
                <OutputActionsPanel
                  workflowName={`app-build-plan-${appDescription.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`}
                  fullMarkdown={buildFullBuildPlan(buildPlan)}
                  onSaveToArtefacts={handleSaveBuildPlan}
                  isSaved={buildPlanSaved}
                />
              </div>

              {/* Build Plan Refinement */}
              <div style={{
                background: '#F7FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px', marginTop: 20, marginBottom: 20,
                opacity: buildPlanVisibleBlocks >= 8 ? 1 : 0, transform: buildPlanVisibleBlocks >= 8 ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: buildRefineExpanded ? 16 : 12 }}>
                  <Info size={16} color="#718096" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                    This build plan is tailored to your selected tech stack. Validate the architecture against your actual infrastructure and team capabilities.
                  </div>
                </div>

                {!buildRefineExpanded && (
                  <button onClick={() => setBuildRefineExpanded(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}
                  >
                    <ChevronDown size={14} /> Want to refine this build plan?
                    {buildRefinementCount > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, borderRadius: 20, padding: '2px 10px', marginLeft: 6 }}>Refinement #{buildRefinementCount}</span>
                    )}
                  </button>
                )}

                {buildRefineExpanded && (
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, animation: 'ppSlideDown 0.3s ease-out both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Refine Your Build Plan</div>
                      <button onClick={() => setBuildRefineExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: '#A0AEC0' }}>
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>Answer any of these to get a more targeted build plan.</p>
                    {buildRefinementQuestions.map((question, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>{question}</label>
                        <input type="text" value={buildRefinementAnswers[i] || ''} onChange={e => setBuildRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Your answer…"
                          style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const, background: '#FFFFFF' }}
                          onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                          onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                        />
                      </div>
                    ))}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>Anything else to add?</label>
                      <textarea value={buildRefinementAdditional} onChange={e => setBuildRefinementAdditional(e.target.value)}
                        placeholder="Any additional requirements or context…"
                        style={{ width: '100%', minHeight: 60, resize: 'none', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none', boxSizing: 'border-box' as const, background: '#FFFFFF', lineHeight: 1.5 }}
                        onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                        onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                      />
                    </div>
                    <ActionBtn label={isBuildPlanLoading ? 'Refining…' : 'Refine Build Plan'} onClick={handleRefineBuildPlan} primary disabled={!hasBuildRefinementInput || isBuildPlanLoading}
                      iconAfter={isBuildPlanLoading ? <span style={{ width: 13, height: 13, border: '2px solid #FFFFFF40', borderTopColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block', animation: 'ppSpin 0.6s linear infinite' }} /> : <ArrowRight size={13} />}
                    />
                  </div>
                )}
              </div>

              {/* Bottom navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <ActionBtn icon={<ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />} label="Back to Step 3" onClick={handleGoBackToStep3} />
                <ActionBtn icon={<RotateCcw size={13} />} label="Start Over" onClick={handleReset} />
              </div>
            </>
          )}
        </StepCard>
      </div>

      {/* Toast (§3.9) */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
          animation: 'ppFadeIn 0.15s ease both', fontFamily: FONT,
        }}>
          {toastMessage} ✓
        </div>
      )}
    </div>
  );
};

/* ── Shared sub-components ── */

const ActionBtn: React.FC<{
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  iconAfter?: React.ReactNode;
  accent?: boolean;
}> = ({ icon, label, onClick, primary, disabled, iconAfter, accent }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '9px 18px', borderRadius: 24,
      fontSize: 13, fontWeight: 600, fontFamily: FONT,
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: primary || accent ? 'none' : '1px solid #E2E8F0',
      background: disabled ? '#CBD5E0' : primary ? '#38B2AC' : accent ? '#5A67D8' : '#FFFFFF',
      color: primary || accent ? '#FFFFFF' : '#4A5568',
      opacity: disabled ? 0.6 : 1,
      transition: 'background 0.15s, opacity 0.15s',
    }}
  >
    {icon}{label}{iconAfter}
  </button>
);

const ToggleBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}> = ({ icon, label, active, onClick, highlight }) => (
  <button onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '6px 14px', border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: FONT,
      background: active ? (highlight ? '#2B6CB0' : '#1A202C') : 'transparent',
      color: active ? '#FFFFFF' : '#718096',
      transition: 'background 0.15s, color 0.15s',
    }}
  >{icon}{label}</button>
);

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ width: 22, height: 22, borderRadius: '50%', background: '#F7FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', padding: 0 }}
      ><Info size={12} color="#A0AEC0" /></button>
      {show && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', width: 240, background: '#1A202C', color: '#E2E8F0', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.5, zIndex: 20, fontFamily: FONT }}>
          {text}
        </div>
      )}
    </div>
  );
};

/* ── Step Card wrapper (§3.4) ── */
const StepCard: React.FC<{
  stepNumber: number; title: string; subtitle: string;
  done: boolean; collapsed: boolean; locked?: boolean; lockedMessage?: string;
  children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, locked, lockedMessage, children }) => (
  <div style={{
    background: locked ? '#FAFBFC' : '#FFFFFF', borderRadius: 16,
    border: `1px solid ${done ? `${LEVEL_ACCENT}88` : '#E2E8F0'}`,
    padding: (collapsed || locked) ? '16px 24px' : '24px 28px',
    transition: 'padding 0.2s ease, border-color 0.2s ease',
    opacity: locked ? 0.7 : 1,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: (collapsed || locked) ? 0 : 20 }}>
      <StepBadge number={stepNumber} done={done} locked={locked} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C', fontFamily: FONT }}>{title}</div>
        {locked && lockedMessage && <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT }}>{lockedMessage}</div>}
        {!collapsed && !locked && <div style={{ fontSize: 13, color: '#718096', marginTop: 2, fontFamily: FONT }}>{subtitle}</div>}
      </div>
      {done && collapsed && (
        <div style={{ fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
          <Check size={13} /> Done
        </div>
      )}
    </div>
    {!collapsed && !locked && children}
  </div>
);

const StepBadge: React.FC<{ number: number; done: boolean; locked?: boolean }> = ({ number, done, locked }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: done ? LEVEL_ACCENT : locked ? '#EDF2F7' : '#F7FAFC',
    border: done ? 'none' : '2px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800,
    color: done ? LEVEL_ACCENT_DARK : locked ? '#CBD5E0' : '#718096',
    transition: 'background 0.2s, color 0.2s',
  }}>
    {done ? <Check size={14} /> : number}
  </div>
);

const StepConnector: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0' }}>
    <div style={{
      width: 3, height: 24, borderRadius: 2,
      background: `repeating-linear-gradient(to bottom, ${LEVEL_ACCENT} 0px, ${LEVEL_ACCENT} 4px, transparent 4px, transparent 8px)`,
      backgroundSize: '3px 20px', animation: 'ppConnectorFlow 0.8s linear infinite',
    }} />
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${LEVEL_ACCENT}20`, border: `2px solid ${LEVEL_ACCENT}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
    }}>
      <ArrowDown size={14} color={LEVEL_ACCENT} />
    </div>
  </div>
);

const ToolOverview: React.FC<{
  steps: { number: number; label: string; detail: string; done: boolean }[];
  outcome: string;
}> = ({ steps, outcome }) => (
  <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px', marginBottom: 24 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, fontFamily: FONT }}>How it works</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
      {steps.map((step, i) => (
        <React.Fragment key={step.number}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: step.done ? LEVEL_ACCENT : '#F7FAFC',
              border: step.done ? 'none' : '2px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: step.done ? LEVEL_ACCENT_DARK : '#718096',
            }}>
              {step.done ? <Check size={12} /> : step.number}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{step.label}</div>
              <div style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT }}>{step.detail}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} color="#CBD5E0" style={{ flexShrink: 0, margin: '0 8px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
    <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#276749', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: FONT }}>Outcome</div>
      <div style={{ fontSize: 12, color: '#2F855A', fontFamily: FONT }}>{outcome}</div>
    </div>
  </div>
);

export default AppAppEvaluator;
