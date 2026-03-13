import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, RotateCcw, Code, Library, Download,
  Info, ChevronRight, ChevronDown, ChevronUp, Sparkles, X, Server, Database, Cpu,
} from 'lucide-react';
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
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';
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

/* ─── Score Circle ─── */

const ScoreCircle: React.FC<{ score: number; animated: boolean }> = ({ score, animated }) => {
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
      <svg width="56" height="56" viewBox="0 0 120 120" role="img" aria-label={`Design score: ${score} percent`}>
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

/* ─── Matrix Chart (SVG quadrant) ─── */

const MatrixChart: React.FC<{
  technicalComplexity: number;
  businessImpact: number;
  quadrant: string;
  quadrantDescription: string;
  animated: boolean;
}> = ({ technicalComplexity, businessImpact, quadrant, quadrantDescription, animated }) => {
  const [dotScale, setDotScale] = useState(0);
  const chartW = 400;
  const chartH = 280;
  const pad = 40;
  const innerW = chartW - pad * 2;
  const innerH = chartH - pad * 2;
  const midX = pad + innerW / 2;
  const midY = pad + innerH / 2;
  const dotX = pad + (technicalComplexity / 100) * innerW;
  const dotY = pad + ((100 - businessImpact) / 100) * innerH;
  const color = getScoreColor(businessImpact);
  const qInfo = MATRIX_QUADRANTS[quadrant as keyof typeof MATRIX_QUADRANTS] || MATRIX_QUADRANTS['Nice to Have'];

  useEffect(() => {
    if (!animated) return;
    const t = setTimeout(() => setDotScale(1), 400);
    return () => clearTimeout(t);
  }, [animated]);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ overflow: 'hidden' }}>
        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ maxWidth: 500, display: 'block', margin: '0 auto' }}>
          {/* Quadrant backgrounds */}
          <rect x={pad} y={pad} width={innerW / 2} height={innerH / 2} fill="#F0FFF4" opacity="0.5" />
          <rect x={midX} y={pad} width={innerW / 2} height={innerH / 2} fill="#EBF4FF" opacity="0.5" />
          <rect x={pad} y={midY} width={innerW / 2} height={innerH / 2} fill="#F7FAFC" opacity="0.5" />
          <rect x={midX} y={midY} width={innerW / 2} height={innerH / 2} fill="#FFFAF0" opacity="0.5" />

          {/* Grid lines */}
          <line x1={midX} y1={pad} x2={midX} y2={pad + innerH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={pad} y1={midY} x2={pad + innerW} y2={midY} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

          {/* Quadrant labels */}
          <text x={pad + innerW * 0.25} y={pad + innerH * 0.15} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#276749', fontFamily: FONT }}>Quick Win</text>
          <text x={pad + innerW * 0.75} y={pad + innerH * 0.15} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#2B6CB0', fontFamily: FONT }}>Strategic Investment</text>
          <text x={pad + innerW * 0.25} y={pad + innerH * 0.88} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#718096', fontFamily: FONT }}>Nice to Have</text>
          <text x={pad + innerW * 0.75} y={pad + innerH * 0.88} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#C05621', fontFamily: FONT }}>Rethink</text>

          {/* Axes */}
          <line x1={pad} y1={pad + innerH} x2={pad + innerW} y2={pad + innerH} stroke="#A0AEC0" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke="#A0AEC0" strokeWidth="1" />

          {/* Axis labels */}
          <text x={pad + innerW / 2} y={chartH - 4} textAnchor="middle" style={{ fontSize: 10, fill: '#718096', fontFamily: FONT }}>Technical Complexity →</text>
          <text x={12} y={pad + innerH / 2} textAnchor="middle" style={{ fontSize: 10, fill: '#718096', fontFamily: FONT }} transform={`rotate(-90, 12, ${pad + innerH / 2})`}>Business Impact →</text>

          {/* Dot */}
          <circle cx={dotX} cy={dotY} r={10} fill={color} opacity="0.2" style={{ transform: `scale(${dotScale})`, transformOrigin: `${dotX}px ${dotY}px`, transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={dotX} cy={dotY} r={6} fill={color} stroke="#FFFFFF" strokeWidth="2" style={{ transform: `scale(${dotScale})`, transformOrigin: `${dotX}px ${dotY}px`, transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
        </svg>
      </div>
      {/* Quadrant banner */}
      <div style={{
        marginTop: 10, padding: '10px 14px', borderRadius: 10,
        background: qInfo.color, border: `1px solid ${qInfo.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: qInfo.textColor, fontFamily: FONT }}>{quadrant}</div>
        <div style={{ fontSize: 12, color: qInfo.textColor, opacity: 0.85, fontFamily: FONT }}>{quadrantDescription}</div>
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
            <span style={{ fontSize: 18, flexShrink: 0 }}>{opt.icon}</span>
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

  // Step 2 — Card expand state
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [matrixExpanded, setMatrixExpanded] = useState(false);

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

  // Staggered block appearance — Step 2 (score card + matrix card + summary + refinement)
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setScoreExpanded(false);
    setMatrixExpanded(false);
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

  const hasRefinementInput = Object.values(refinementAnswers).some(a => typeof a === 'string' && a.trim()) || refinementAdditional.trim() !== '';

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

    const parts = [
      `[REFINEMENT]\n\nOriginal task: ${appDescription}`,
      answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
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
      setRefinementCount(c => c + 1);
      setRefinementAnswers({});
      setRefinementAdditional('');
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
    lines.push('## Getting Started');
    lines.push('');
    for (const cmd of (bp.getting_started || [])) { lines.push('```'); lines.push(cmd); lines.push('```'); lines.push(''); }
    lines.push('## Implementation Phases');
    lines.push('');
    for (const phase of (bp.implementation_phases || [])) {
      lines.push(`### ${phase.phase} (${phase.duration_estimate || 'TBD'})`);
      lines.push(''); lines.push(phase.description); lines.push('');
      for (const task of (phase.tasks || [])) { lines.push(`- ${task}`); }
      if (phase.tech_stack_notes) { lines.push(''); lines.push(`> **Stack notes:** ${phase.tech_stack_notes}`); }
      lines.push('');
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

  const handleSaveBuildPlan = () => {
    if (!buildPlan || !user) return;
    const fullContent = buildFullBuildPlan(buildPlan);
    const title = `Build Plan: ${appDescription.slice(0, 50)}${appDescription.length > 50 ? '...' : ''}`;
    dbSavePrompt(user.id, { level: 5, title, content: fullContent, source_tool: 'ai-app-evaluator' });
    setBuildPlanSaved(true); setToastMessage('Build plan saved to your Prompt Library');
    setTimeout(() => setBuildPlanSaved(false), 3000);
  };

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

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
          from { opacity: 0; max-height: 0; transform: translateY(-8px); }
          to { opacity: 1; max-height: 800px; transform: translateY(0); }
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
                  border: scoreExpanded ? `1.5px solid ${LEVEL_ACCENT}` : '1px solid #E2E8F0',
                  overflow: 'hidden', transition: 'border-color 0.15s',
                }}>
                  <button
                    onClick={() => setScoreExpanded(prev => !prev)}
                    style={{
                      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '20px 20px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', gap: 10,
                    }}
                  >
                    <ScoreCircle score={result.design_score.overall_score} animated={scoreAnimated} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Design Score</div>
                      <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT, marginTop: 4 }}>
                        {getVerdictText(result.design_score.overall_score)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>
                        {scoreExpanded ? 'Hide details' : 'View breakdown'}
                      </span>
                      <ChevronDown size={13} color={LEVEL_ACCENT_DARK} style={{ transform: scoreExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                    </div>
                  </button>
                </div>

                {/* ── Right: Strategic Matrix Card ── */}
                {(() => {
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
                  const qIcon = mp.quadrant === 'Quick Win' ? '⚡' : mp.quadrant === 'Strategic Investment' ? '🎯' : mp.quadrant === 'Rethink' ? '🔄' : '💡';

                  return (
                    <div style={{
                      background: '#FFFFFF', borderRadius: 14,
                      border: matrixExpanded ? `1.5px solid ${qInfo.border}` : '1px solid #E2E8F0',
                      overflow: 'hidden', transition: 'border-color 0.15s',
                    }}>
                      <button
                        onClick={() => setMatrixExpanded(prev => !prev)}
                        style={{
                          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '20px 20px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', gap: 10,
                        }}
                      >
                        <div style={{
                          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                          background: qInfo.color, border: `2px solid ${qInfo.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24,
                        }}>
                          {qIcon}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: qInfo.textColor, fontFamily: FONT }}>{mp.quadrant}</div>
                          <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT, marginTop: 4 }}>
                            {mp.quadrant_description}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}>
                            {matrixExpanded ? 'Hide chart' : 'View chart'}
                          </span>
                          <ChevronDown size={13} color={LEVEL_ACCENT_DARK} style={{ transform: matrixExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                        </div>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* ── Expanded: Score breakdown (full width below the grid) ── */}
              {scoreExpanded && (
                <div style={{
                  background: '#FFFFFF', borderRadius: 14, border: `1.5px solid ${LEVEL_ACCENT}`,
                  padding: '18px 22px', marginBottom: 14,
                  animation: 'ppSlideDown 0.25s ease-out both',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: FONT }}>Score Breakdown</div>
                  {(Object.entries(result.design_score.criteria || {}) as [string, DesignScoreCriteria][]).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F7FAFC' }}>
                      <div style={{ width: 150, flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#1A202C', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
                        <span style={{ fontSize: 14 }}>{SCORE_CRITERIA_LABELS[key]?.icon || ''}</span>
                        {SCORE_CRITERIA_LABELS[key]?.label || key}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, color: '#4A5568', fontFamily: FONT }}>{val.assessment}</div>
                      <div style={{ width: 90, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${val.score}%`, background: getScoreColor(val.score), transition: 'width 0.7s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', fontFamily: FONT, width: 24, textAlign: 'right' }}>{val.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Expanded: Matrix chart (full width below the grid) ── */}
              {matrixExpanded && (() => {
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
                return (
                  <div style={{
                    background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0',
                    padding: '18px 22px', marginBottom: 14,
                    animation: 'ppSlideDown 0.25s ease-out both',
                  }}>
                    <MatrixChart
                      technicalComplexity={mp.technical_complexity}
                      businessImpact={mp.business_impact}
                      quadrant={mp.quadrant}
                      quadrantDescription={mp.quadrant_description}
                      animated={scoreAnimated}
                    />
                  </div>
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
                    This evaluation is a strong starting point. Review the score and matrix placement, then approve to continue to tech stack selection and build planning.
                  </div>
                </div>

                {!refineExpanded && (
                  <button onClick={() => setRefineExpanded(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK, fontFamily: FONT }}
                  >
                    <ChevronDown size={14} /> Want to refine this evaluation first?
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
                        <div style={{ fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Refine Your Evaluation</div>
                        {refinementCount > 0 && (
                          <div style={{ fontSize: 11, fontWeight: 600, background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK, borderRadius: 20, padding: '2px 10px', fontFamily: FONT }}>Refinement #{refinementCount}</div>
                        )}
                      </div>
                      <button onClick={() => setRefineExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', color: '#A0AEC0' }}>
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>Answer any of these to add context and get a more targeted evaluation.</p>
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

                  {/* ─── 1. Getting Started ─── */}
                  {(buildPlan.getting_started || []).length > 0 && (
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 2 ? 1 : 0, transform: buildPlanVisibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#38B2AC', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>Getting Started</div>
                        <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT }}>— Run these commands to scaffold your project</div>
                      </div>
                      {(buildPlan.getting_started || []).map((cmd, i) => (
                        <CodeBlockWithCopy key={i} code={cmd} />
                      ))}
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
                                {!isExp && <div style={{ fontSize: 12, color: '#718096', fontFamily: FONT, marginTop: 2 }}>{phase.description?.slice(0, 80)}{(phase.description?.length || 0) > 80 ? '…' : ''}</div>}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', background: '#F7FAFC', borderRadius: 8, padding: '3px 10px', border: '1px solid #E2E8F0', fontFamily: FONT, flexShrink: 0 }}>
                                {phase.duration_estimate || 'TBD'}
                              </span>
                              <ChevronDown size={14} color="#A0AEC0" style={{ transform: isExp ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
                            </button>
                            {isExp && (
                              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0F0F0' }}>
                                <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 10, fontFamily: FONT }}>{phase.description}</div>
                                <div style={{ paddingLeft: 4 }}>
                                  {(phase.tasks || []).map((task: string, i: number) => (
                                    <div key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.7, display: 'flex', gap: 8, marginBottom: 4, fontFamily: FONT }}>
                                      <span style={{ color: LEVEL_ACCENT_DARK, flexShrink: 0, fontWeight: 700 }}>&bull;</span>{task}
                                    </div>
                                  ))}
                                </div>
                                {phase.tech_stack_notes && (
                                  <div style={{ marginTop: 10, padding: '10px 14px', background: `${LEVEL_ACCENT}15`, borderRadius: 10, border: `1px solid ${LEVEL_ACCENT}35`, fontSize: 12, color: LEVEL_ACCENT_DARK, lineHeight: 1.6, fontFamily: FONT }}>
                                    <strong>Stack notes:</strong> {phase.tech_stack_notes}
                                  </div>
                                )}
                                {(phase.dependencies || []).length > 0 && (
                                  <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 6, fontFamily: FONT }}>
                                    Depends on: {(phase.dependencies || []).join(', ')}
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
