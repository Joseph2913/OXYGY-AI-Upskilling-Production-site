import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, RotateCcw, Code, Library, Download,
  Info, ChevronRight, ChevronDown, ChevronUp, Sparkles, X,
} from 'lucide-react';
import {
  EVALUATOR_SECTIONS, EXAMPLE_APPS, SCORE_CRITERIA_LABELS,
  getPriorityStyle, getSeverityStyle,
} from '../../../data/app-evaluator-content';
import { useAppEvaluatorApi } from '../../../hooks/useAppEvaluatorApi';
import type {
  AppEvaluatorResult, DesignScoreCriteria,
  ArchitectureComponent, ImplementationStep, RiskItem,
} from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';
import OutputActionsPanel from '../workflow/OutputActionsPanel';

const FONT = "'DM Sans', sans-serif";
const LEVEL_ACCENT = '#C3D0F5';
const LEVEL_ACCENT_DARK = '#2E3F8F';

/* ─── Loading step definitions (§9.5) ─── */
const INITIAL_LOADING_STEPS = [
  'Analysing your application design…',
  'Evaluating across 5 criteria…',
  'Scoring design readiness…',
  'Mapping architecture components…',
  'Building implementation plan…',
  'Identifying risks & gaps…',
  'Generating refinement questions…',
  'Finalising evaluation…',
];
const REFINE_LOADING_STEPS = [
  'Processing your additional context…',
  'Re-evaluating design criteria…',
  'Updating architecture mapping…',
  'Revising implementation phases…',
  'Reassessing risks…',
  'Generating deeper questions…',
  'Finalising refined evaluation…',
];
const STEP_DELAYS = [800, 1500, 3000, 3500, 3500, 3000, 2500, 2000];

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Design score: ${score} percent`}>
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
      <p style={{ fontSize: 16, fontWeight: 600, color, textAlign: 'center', fontFamily: FONT }}>{getVerdictText(score)}</p>
    </div>
  );
};

/* ─── ProcessingProgress (§9.5) ─── */

const ProcessingProgress: React.FC<{
  steps: string[];
  currentStep: number;
  header: string;
  subtext: string;
}> = ({ steps, currentStep, header, subtext }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
    padding: '28px 32px',
  }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C', marginBottom: 4, fontFamily: FONT }}>
      {header}
    </div>
    <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 20, fontFamily: FONT }}>
      {subtext}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isComplete = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: isComplete ? LEVEL_ACCENT : 'transparent',
              border: isActive
                ? `2px solid ${LEVEL_ACCENT}`
                : isComplete ? 'none' : '2px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {isComplete && <Check size={10} color={LEVEL_ACCENT_DARK} />}
              {isActive && (
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  border: `2px solid ${LEVEL_ACCENT_DARK}`, borderTopColor: 'transparent',
                  animation: 'ppSpin 0.7s linear infinite',
                }} />
              )}
            </div>
            <span style={{
              fontSize: 13, fontFamily: FONT,
              color: isActive || isComplete ? '#2D3748' : '#A0AEC0',
              fontWeight: isActive ? 600 : 400,
            }}>
              {label}
            </span>
            {isComplete && <Check size={12} color={LEVEL_ACCENT_DARK} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
    {/* Progress bar */}
    <div style={{ height: 4, borderRadius: 2, background: '#EDF2F7', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 2, background: LEVEL_ACCENT,
        width: `${(Math.max(0, currentStep - 1) / steps.length) * 100}%`,
        transition: 'width 0.3s ease',
      }} />
    </div>
    <div style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'right', marginTop: 4, fontFamily: FONT }}>
      {Math.min(currentStep, steps.length)} of {steps.length}
    </div>
  </div>
);

/* ─── Main Component ─── */

const AppAppEvaluator: React.FC = () => {
  const { user } = useAuth();

  // Input state
  const [appDescription, setAppDescription] = useState('');
  const [problemAndUsers, setProblemAndUsers] = useState('');
  const [dataAndContent, setDataAndContent] = useState('');

  // Result & UI state
  const [result, setResult] = useState<AppEvaluatorResult | null>(null);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [architectureExpanded, setArchitectureExpanded] = useState(true);
  const [planExpanded, setPlanExpanded] = useState(true);

  // Loading progress state (§9.5)
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRefineLoading, setIsRefineLoading] = useState(false);

  // Refinement state
  const [refineExpanded, setRefineExpanded] = useState(false);
  const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
  const [refinementAdditional, setRefinementAdditional] = useState('');
  const [refinementCount, setRefinementCount] = useState(0);

  // Refs
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  // API
  const { evaluateApp, isLoading, error, clearError } = useAppEvaluatorApi();

  // Staggered block appearance (4 output sections + OutputActionsPanel)
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    setScoreAnimated(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 6; i++) {
      timers.push(setTimeout(() => {
        setVisibleBlocks(v => v + 1);
        if (i === 0) setScoreAnimated(true);
      }, 150 + i * 120));
    }
    return () => timers.forEach(clearTimeout);
  }, [result]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // ProcessingProgress step progression (§9.5)
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
      cumulative += delay;
      timers.push(setTimeout(() => setLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  // Restore draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem('oxygy_ai-app-evaluator_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.appDescription) setAppDescription(parsed.appDescription);
        if (parsed.problemAndUsers) setProblemAndUsers(parsed.problemAndUsers);
        if (parsed.dataAndContent) setDataAndContent(parsed.dataAndContent);
        if (parsed.result) setResult(parsed.result);
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
    setSavedToLibrary(false);
    setShowMarkdown(false);
    setArchitectureExpanded(true);
    setPlanExpanded(true);
    setIsRefineLoading(false);

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

  const handleReset = () => {
    setAppDescription('');
    setProblemAndUsers('');
    setDataAndContent('');
    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setCopiedSection(null);
    setSavedToLibrary(false);
    setShowMarkdown(false);
    setRefineExpanded(false);
    setRefinementAnswers({});
    setRefinementAdditional('');
    setRefinementCount(0);
    setLoadingStep(0);
    setIsRefineLoading(false);
    clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setSavedToLibrary(false);
    setShowMarkdown(false);

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

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  }, []);

  /** Build the cohesive deliverable — Product Specification combining architecture, implementation plan, and risks (§4.4). Design score excluded — informational only. */
  const buildProductSpec = (r: AppEvaluatorResult): string => {
    const lines: string[] = [];

    lines.push('# AI Application Product Specification');
    lines.push('');
    lines.push('## Architecture & Components');
    lines.push('');
    lines.push(r.architecture.summary);
    lines.push('');

    for (const comp of r.architecture.components) {
      lines.push(`### ${comp.name} [${comp.priority.toUpperCase()}]`);
      lines.push('');
      lines.push(comp.description);
      lines.push('');
      lines.push(`**Tools:** ${comp.tools.join(', ')}`);
      lines.push(`**Level Connection:** Level ${comp.level_connection}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Implementation Plan');
    lines.push('');
    lines.push(r.implementation_plan.summary);
    lines.push('');

    for (const step of r.implementation_plan.steps) {
      lines.push(`### ${step.phase} (${step.duration_estimate})`);
      lines.push('');
      lines.push(step.description);
      lines.push('');
      for (const task of step.tasks) {
        lines.push(`- ${task}`);
      }
      if (step.dependencies.length > 0) {
        lines.push('');
        lines.push(`**Dependencies:** ${step.dependencies.join(', ')}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Risks & Mitigations');
    lines.push('');
    lines.push(r.risks_and_gaps.summary);
    lines.push('');

    for (const item of r.risks_and_gaps.items) {
      lines.push(`### ${item.name} [${item.severity.toUpperCase()}]`);
      lines.push('');
      lines.push(item.description);
      lines.push('');
      lines.push(`**Mitigation:** ${item.mitigation}`);
      lines.push('');
    }

    return lines.join('\n');
  };

  const handleCopyFull = async () => {
    if (!result) return;
    await copyToClipboard(buildProductSpec(result));
    setCopied(true); setToastMessage('Full product specification copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySection = async (key: string, label: string, content: string) => {
    await copyToClipboard(content);
    setCopiedSection(key); setToastMessage(`${label} copied`);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSaveToLibrary = () => {
    if (!result || !user) return;
    const fullContent = buildProductSpec(result);
    const title = `App Spec: ${appDescription.slice(0, 50)}${appDescription.length > 50 ? '...' : ''}`;
    dbSavePrompt(user.id, { level: 5, title, content: fullContent, source_tool: 'ai-app-evaluator' });
    setSavedToLibrary(true); setToastMessage('Product specification saved to your Prompt Library');
    setTimeout(() => setSavedToLibrary(false), 3000);
  };

  const handleDownload = () => {
    if (!result) return;
    const date = new Date().toISOString().split('T')[0];
    const content = buildProductSpec(result);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-evaluation-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Step indicators
  const step1Done = appDescription.trim().length > 0 && result !== null;

  /* ─── Build section-specific copy content ─── */
  const getSectionCopyContent = (key: string): string => {
    if (!result) return '';
    switch (key) {
      case 'design_score':
        return `Design Score: ${result.design_score.overall_score}%\nVerdict: ${result.design_score.verdict}\n\n${result.design_score.rationale}`;
      case 'architecture':
        return result.architecture.components.map(c =>
          `${c.name} [${c.priority}]: ${c.description}\nTools: ${c.tools.join(', ')}`
        ).join('\n\n');
      case 'implementation_plan':
        return result.implementation_plan.steps.map(s =>
          `${s.phase} (${s.duration_estimate}): ${s.description}\nTasks:\n${s.tasks.map(t => `  - ${t}`).join('\n')}`
        ).join('\n\n');
      case 'risks_and_gaps':
        return result.risks_and_gaps.items.map(i =>
          `${i.name} [${i.severity}]: ${i.description}\nMitigation: ${i.mitigation}`
        ).join('\n\n');
      default: return '';
    }
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
        Building an AI-powered product requires decisions across architecture, data, personalisation, and user experience that most teams make ad-hoc. The App Evaluator walks you through a structured design process and produces a comprehensive product specification — covering everything from component architecture to implementation planning and risk assessment.
      </p>

      {/* ═══ How It Works — Overview Strip (§3.3) ═══ */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Describe your application', detail: 'Define what your app does, who it serves, and what data it uses', done: step1Done },
          { number: 2, label: 'Review your evaluation', detail: 'Design score, architecture, implementation plan, and risk assessment', done: false },
        ]}
        outcome="A complete product specification — design score, component architecture with tool mapping, phased implementation plan, and risk assessment — ready to guide your build."
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Describe Your Application                     */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step1Ref}>
        <StepCard
          stepNumber={1}
          title="Describe your application"
          subtitle="Tell us about your AI application idea — what it does, who uses it, and what data it needs."
          done={step1Done}
          collapsed={step1Done}
        >
          {/* Example chips (§4.6) */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 500, marginBottom: 8, fontFamily: FONT }}>
              Try an example:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXAMPLE_APPS.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => handleExampleClick(ex)}
                  style={{
                    padding: '6px 14px', borderRadius: 20,
                    fontSize: 12, fontWeight: 500, color: '#4A5568',
                    background: '#F7FAFC',
                    border: '1px solid #E2E8F0', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                    textAlign: 'left', lineHeight: 1.4,
                    fontFamily: FONT,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.background = `${LEVEL_ACCENT}18`; e.currentTarget.style.color = LEVEL_ACCENT_DARK; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F7FAFC'; e.currentTarget.style.color = '#4A5568'; }}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input 1: App Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
              What does your application do?
            </label>
            <textarea
              value={appDescription}
              onChange={e => {
                setAppDescription(e.target.value);
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.max(80, ta.scrollHeight) + 'px';
              }}
              placeholder="e.g., A personalised learning platform where students log in, see their progress, receive AI-generated study recommendations, and complete adaptive quizzes..."
              style={{
                width: '100%', minHeight: 80, maxHeight: 200,
                resize: 'none', overflow: 'auto',
                border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '14px 16px', fontSize: 15, color: '#1A202C',
                fontFamily: FONT, lineHeight: 1.6, outline: 'none',
                transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Input 2: Problem & Users */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
              Who is this for and what problem does it solve?
              <span style={{
                fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                background: `${LEVEL_ACCENT}44`, borderRadius: 10, padding: '2px 8px',
              }}>
                Recommended
              </span>
            </label>
            <textarea
              value={problemAndUsers}
              onChange={e => {
                setProblemAndUsers(e.target.value);
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.max(60, ta.scrollHeight) + 'px';
              }}
              placeholder="e.g., Students in a professional certification programme struggle to track their progress and identify weak areas. Serves 200+ students across 3 cohorts..."
              style={{
                width: '100%', minHeight: 60, maxHeight: 160,
                resize: 'none', overflow: 'auto',
                border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '14px 16px', fontSize: 15, color: '#1A202C',
                fontFamily: FONT, lineHeight: 1.6, outline: 'none',
                transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Input 3: Data & Content */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
              What data or content will it work with?
              <span style={{
                fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                background: `${LEVEL_ACCENT}44`, borderRadius: 10, padding: '2px 8px',
              }}>
                Recommended
              </span>
            </label>
            <textarea
              value={dataAndContent}
              onChange={e => {
                setDataAndContent(e.target.value);
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.max(60, ta.scrollHeight) + 'px';
              }}
              placeholder="e.g., Student profiles, quiz scores, module completion data, AI-generated recommendations. Content includes video lessons, reading materials, and practice exercises..."
              style={{
                width: '100%', minHeight: 60, maxHeight: 160,
                resize: 'none', overflow: 'auto',
                border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '14px 16px', fontSize: 15, color: '#1A202C',
                fontFamily: FONT, lineHeight: 1.6, outline: 'none',
                transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Evaluate button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleEvaluate}
              disabled={!appDescription.trim() || isLoading}
              style={{
                padding: '12px 28px', borderRadius: 24,
                background: !appDescription.trim() || isLoading ? '#CBD5E0' : '#38B2AC',
                color: '#FFFFFF', border: 'none',
                fontSize: 14, fontWeight: 700, fontFamily: FONT,
                cursor: !appDescription.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid #FFFFFF', borderTopColor: 'transparent',
                    borderRadius: '50%', display: 'inline-block',
                    animation: 'ppSpin 0.7s linear infinite',
                  }} />
                  Evaluating...
                </>
              ) : (
                <>Evaluate My App <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 14, padding: '12px 16px', borderRadius: 10,
              background: '#FFF5F5', border: '1px solid #FC8181',
              fontSize: 13, color: '#C53030', fontFamily: FONT,
            }}>
              {error}
            </div>
          )}
        </StepCard>
      </div>

      {/* Connector 1→2 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Review Your Evaluation                        */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step2Ref} style={result ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard
          stepNumber={2}
          title={result ? 'Your product specification' : 'Review your evaluation'}
          subtitle={result
            ? 'Your application has been evaluated across 4 dimensions. Review, copy, or save the complete specification.'
            : "Here's what your evaluation will include — each section addresses a critical aspect of application design."}
          done={false}
          collapsed={false}
        >
          {!result ? (
            /* Educational preview or ProcessingProgress */
            isLoading ? (
              /* ProcessingProgress indicator (§9.5) */
              <ProcessingProgress
                steps={isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS}
                currentStep={loadingStep}
                header={isRefineLoading ? 'Refining your evaluation…' : 'Evaluating your application…'}
                subtext="This usually takes 15–25 seconds"
              />
            ) : (
              /* Educational default — 4-section preview (§3.7) using LEVEL_ACCENT_DARK */
              <div>
                <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, marginBottom: 16, fontFamily: FONT }}>
                  Your output will be structured using the <strong style={{ color: '#1A202C' }}>4-part Application Evaluation Framework</strong> — a comprehensive assessment that transforms your idea into an actionable product specification. Complete Step 1 above and each section below will be filled with content tailored to your specific application.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {EVALUATOR_SECTIONS.map((block, idx) => (
                    <div
                      key={block.key}
                      style={{
                        borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`,
                        background: `${LEVEL_ACCENT_DARK}08`,
                        borderRadius: 10, padding: '16px 18px',
                        animation: 'ppFadeIn 0.3s ease both',
                        animationDelay: `${idx * 80}ms`,
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                      }}>
                        <span style={{ fontSize: 15 }}>{block.icon}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: '#1A202C',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          fontFamily: FONT,
                        }}>
                          {block.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#A0AEC0', marginLeft: 'auto' }}>
                          {idx + 1}/4
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 10, fontFamily: FONT }}>
                        {block.why}
                      </div>
                      <div style={{
                        background: `${LEVEL_ACCENT_DARK}18`, borderRadius: 8,
                        padding: '10px 12px', borderLeft: `3px solid ${LEVEL_ACCENT_DARK}`,
                      }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: '#A0AEC0',
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                          fontFamily: FONT,
                        }}>
                          Example
                        </div>
                        <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontStyle: 'italic', fontFamily: FONT }}>
                          {block.example}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Summary footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 16, marginTop: 16, padding: '10px 0',
                  borderTop: '1px solid #EDF2F7',
                }}>
                  {EVALUATOR_SECTIONS.map(block => (
                    <div key={block.key} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: '#718096', fontFamily: FONT,
                    }}>
                      <span style={{ fontSize: 13 }}>{block.icon}</span>
                      {block.label}
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* ═══ Active Output Content ═══ */
            <>
              {/* Top row: toggle (left) + Copy button (right) — §4.2 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    display: 'flex', background: '#F7FAFC', borderRadius: 10,
                    border: '1px solid #E2E8F0', overflow: 'hidden',
                  }}>
                    <ToggleBtn
                      icon={<Sparkles size={13} />}
                      label="Cards"
                      active={!showMarkdown}
                      onClick={() => setShowMarkdown(false)}
                    />
                    <ToggleBtn
                      icon={<Code size={13} />}
                      label="Markdown"
                      active={showMarkdown}
                      onClick={() => setShowMarkdown(true)}
                      highlight
                    />
                  </div>
                  <InfoTooltip text="Markdown preserves the structure (headings, bullets, formatting) when you paste your product specification into ChatGPT, Claude, or any AI tool — giving you better results than plain text." />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn
                    icon={copied ? <Check size={13} /> : <Copy size={13} />}
                    label={copied ? 'Copied!' : 'Copy Product Specification'}
                    onClick={handleCopyFull}
                    primary
                  />
                  <ActionBtn
                    icon={<Download size={13} />}
                    label="Download (.md)"
                    onClick={handleDownload}
                  />
                  <ActionBtn
                    icon={<Library size={13} />}
                    label={savedToLibrary ? 'Saved!' : 'Save to Library'}
                    onClick={handleSaveToLibrary}
                    accent
                    disabled={savedToLibrary}
                  />
                </div>
              </div>

              {/* Markdown view — shows the cohesive deliverable (§4.4) */}
              {showMarkdown && (
                <div style={{
                  background: '#1A202C', borderRadius: 12,
                  padding: '22px 24px', overflow: 'auto',
                }}>
                  <pre style={{
                    color: '#E2E8F0', fontSize: 13, lineHeight: 1.8,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    whiteSpace: 'pre-wrap', margin: 0,
                  }}>
                    {buildProductSpec(result)}
                  </pre>
                </div>
              )}

              {/* Card view — 4 sections using LEVEL_ACCENT_DARK (§4.1) */}
              {!showMarkdown && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Section 1: Design Score (informational — excluded from deliverable) */}
                  <OutputSection
                    section={EVALUATOR_SECTIONS[0]}
                    index={0}
                    visible={0 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label) => handleCopySection(key, label, getSectionCopyContent(key))}
                    totalSections={4}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <ScoreCircle score={result.design_score.overall_score} animated={scoreAnimated} />
                    </div>
                    {/* Criteria bars */}
                    <div style={{ marginBottom: 16 }}>
                      {(Object.entries(result.design_score.criteria) as [string, DesignScoreCriteria][]).map(([key, val]) => (
                        <div key={key} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                          borderBottom: '1px solid #F7FAFC',
                        }}>
                          <div style={{ width: 140, flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#1A202C', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
                            <span style={{ fontSize: 14 }}>{SCORE_CRITERIA_LABELS[key]?.icon || ''}</span>
                            {SCORE_CRITERIA_LABELS[key]?.label || key}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, color: '#4A5568', fontFamily: FONT }}>{val.assessment}</div>
                          <div style={{ width: 100, flexShrink: 0 }}>
                            <div style={{ height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 3,
                                width: `${val.score}%`, background: getScoreColor(val.score),
                                transition: 'width 0.7s ease',
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Rationale */}
                    <div style={{
                      background: '#F7FAFC', borderRadius: 10, padding: 16,
                      border: '1px solid #E2E8F0',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', marginBottom: 6, fontFamily: FONT }}>
                        Assessment Summary
                      </div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>
                        {result.design_score.rationale}
                      </div>
                    </div>
                  </OutputSection>

                  {/* Section 2: Architecture & Components */}
                  <OutputSection
                    section={EVALUATOR_SECTIONS[1]}
                    index={1}
                    visible={1 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label) => handleCopySection(key, label, getSectionCopyContent(key))}
                    totalSections={4}
                  >
                    <div style={{
                      background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                          {result.architecture.summary}
                        </div>
                        <button
                          onClick={() => setArchitectureExpanded(!architectureExpanded)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, color: '#718096', background: 'none',
                            border: 'none', cursor: 'pointer', transition: 'color 0.15s',
                            fontFamily: FONT,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = LEVEL_ACCENT_DARK)}
                          onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
                        >
                          {architectureExpanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Expand</>}
                        </button>
                      </div>
                    </div>
                    {architectureExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {result.architecture.components.map((comp: ArchitectureComponent, idx: number) => {
                          const priority = getPriorityStyle(comp.priority);
                          return (
                            <div key={idx} style={{
                              background: '#FFFFFF', borderRadius: 10,
                              padding: '14px 16px', border: '1px solid #E2E8F0',
                              borderLeft: `4px solid ${comp.priority === 'essential' ? '#38B2AC' : comp.priority === 'recommended' ? '#D69E2E' : '#A0AEC0'}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{comp.name}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 8px',
                                  background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`,
                                  textTransform: 'capitalize', fontFamily: FONT,
                                }}>
                                  {comp.priority}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8, fontFamily: FONT }}>
                                {comp.description}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                                {comp.tools.map((tool: string, i: number) => (
                                  <span key={i} style={{
                                    fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                                    background: `${LEVEL_ACCENT}30`, borderRadius: 8, padding: '3px 8px',
                                    fontFamily: FONT,
                                  }}>
                                    {tool}
                                  </span>
                                ))}
                              </div>
                              <div style={{ fontSize: 11, color: '#718096', fontFamily: FONT }}>
                                Level {comp.level_connection} connection
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </OutputSection>

                  {/* Section 3: Implementation Plan */}
                  <OutputSection
                    section={EVALUATOR_SECTIONS[2]}
                    index={2}
                    visible={2 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label) => handleCopySection(key, label, getSectionCopyContent(key))}
                    totalSections={4}
                  >
                    <div style={{
                      background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                          {result.implementation_plan.summary}
                        </div>
                        <button
                          onClick={() => setPlanExpanded(!planExpanded)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, color: '#718096', background: 'none',
                            border: 'none', cursor: 'pointer', transition: 'color 0.15s',
                            fontFamily: FONT,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = LEVEL_ACCENT_DARK)}
                          onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
                        >
                          {planExpanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Expand</>}
                        </button>
                      </div>
                    </div>
                    {planExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {result.implementation_plan.steps.map((step: ImplementationStep, idx: number) => (
                          <div key={idx} style={{
                            background: '#FFFFFF', borderRadius: 10,
                            padding: '14px 16px', border: '1px solid #E2E8F0',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 24, height: 24, borderRadius: '50%',
                                  background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 800,
                                }}>
                                  {idx + 1}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{step.phase}</span>
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 600, color: '#718096',
                                background: '#F7FAFC', borderRadius: 8, padding: '3px 8px',
                                border: '1px solid #E2E8F0', fontFamily: FONT,
                              }}>
                                {step.duration_estimate}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8, fontFamily: FONT }}>
                              {step.description}
                            </div>
                            <div style={{ paddingLeft: 4 }}>
                              {step.tasks.map((task: string, i: number) => (
                                <div key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, display: 'flex', gap: 6, marginBottom: 3, fontFamily: FONT }}>
                                  <span style={{ color: LEVEL_ACCENT_DARK, flexShrink: 0 }}>&bull;</span>{task}
                                </div>
                              ))}
                            </div>
                            {step.dependencies.length > 0 && (
                              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 6, fontFamily: FONT }}>
                                Depends on: {step.dependencies.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </OutputSection>

                  {/* Section 4: Risks & Next Steps */}
                  <OutputSection
                    section={EVALUATOR_SECTIONS[3]}
                    index={3}
                    visible={3 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label) => handleCopySection(key, label, getSectionCopyContent(key))}
                    totalSections={4}
                  >
                    <div style={{
                      background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                        {result.risks_and_gaps.summary}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {result.risks_and_gaps.items.map((item: RiskItem, idx: number) => {
                        const severity = getSeverityStyle(item.severity);
                        return (
                          <div key={idx} style={{
                            background: '#FFFFFF', borderRadius: 10,
                            padding: '14px 16px', border: '1px solid #E2E8F0',
                            borderLeft: `4px solid ${severity.border}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{item.name}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 8px',
                                background: severity.bg, color: severity.color, border: `1px solid ${severity.border}`,
                                textTransform: 'capitalize', fontFamily: FONT,
                              }}>
                                {item.severity}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8, fontFamily: FONT }}>
                              {item.description}
                            </div>
                            <div style={{
                              background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 8,
                              padding: '8px 12px',
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#276749', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontFamily: FONT }}>
                                Mitigation
                              </div>
                              <div style={{ fontSize: 12, color: '#2F855A', lineHeight: 1.6, fontFamily: FONT }}>
                                {item.mitigation}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </OutputSection>
                </div>
              )}

              {/* ── Output Actions Panel (§4.2 — separate section between output and refinement) ── */}
              <div style={{
                marginTop: 20,
                opacity: visibleBlocks >= 5 ? 1 : 0,
                transform: visibleBlocks >= 5 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}>
                <OutputActionsPanel
                  workflowName={`app-evaluation-${appDescription.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`}
                  fullMarkdown={buildProductSpec(result)}
                  onSaveToArtefacts={handleSaveToLibrary}
                  isSaved={savedToLibrary}
                />
              </div>

              {/* ── Combined Caveat + Refinement Card (§4.5 — collapsed by default) ── */}
              <div style={{
                background: '#F7FAFC',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                padding: '20px 24px',
                marginTop: 20,
                marginBottom: 20,
                opacity: visibleBlocks >= 6 ? 1 : 0,
                transform: visibleBlocks >= 6 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}>
                {/* Practitioner caveat — always visible */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  marginBottom: refineExpanded ? 16 : 12,
                }}>
                  <Info size={16} color="#718096" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                    This product specification is a strong starting point, but every project environment is different.
                    Validate the architecture against your actual infrastructure, team capabilities, and timeline constraints.
                  </div>
                </div>

                {/* Expand CTA — shown only when collapsed */}
                {!refineExpanded && (
                  <button
                    onClick={() => setRefineExpanded(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, fontSize: 13, fontWeight: 600,
                      color: LEVEL_ACCENT_DARK, fontFamily: FONT,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <ChevronDown size={14} />
                    Would you like to refine this evaluation further?
                    {refinementCount > 0 && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                        borderRadius: 20, padding: '2px 10px',
                        marginLeft: 6,
                      }}>
                        Refinement #{refinementCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Expanded refinement section */}
                {refineExpanded && (
                  <div style={{
                    borderTop: '1px solid #E2E8F0',
                    paddingTop: 16,
                    animation: 'ppSlideDown 0.3s ease-out both',
                  }}>
                    {/* Section header with close button */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          fontFamily: FONT,
                        }}>
                          Refine Your Evaluation
                        </div>
                        {refinementCount > 0 && (
                          <div style={{
                            fontSize: 11, fontWeight: 600,
                            background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                            borderRadius: 20, padding: '2px 10px',
                            fontFamily: FONT,
                          }}>
                            Refinement #{refinementCount}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setRefineExpanded(false)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 4, borderRadius: 6, display: 'flex',
                          color: '#A0AEC0', transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#4A5568')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#A0AEC0')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{
                      fontSize: 13, color: '#718096', lineHeight: 1.6,
                      margin: '0 0 18px', fontFamily: FONT,
                    }}>
                      Answer any of these to add context and get a more targeted evaluation. You don't need to answer all of them — even one helps.
                    </p>

                    {refinementQuestions.map((question, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <label style={{
                          display: 'block',
                          fontSize: 13, fontWeight: 600, color: '#2D3748',
                          marginBottom: 6, fontFamily: FONT,
                        }}>
                          {question}
                        </label>
                        <input
                          type="text"
                          value={refinementAnswers[i] || ''}
                          onChange={e => setRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Your answer…"
                          style={{
                            width: '100%',
                            border: '1px solid #E2E8F0',
                            borderRadius: 10,
                            padding: '10px 14px',
                            fontSize: 13,
                            fontFamily: FONT,
                            color: '#1A202C',
                            outline: 'none',
                            boxSizing: 'border-box' as const,
                            transition: 'border-color 0.15s',
                            background: '#FFFFFF',
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                          onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                        />
                      </div>
                    ))}

                    <div style={{ marginBottom: 18 }}>
                      <label style={{
                        display: 'block',
                        fontSize: 13, fontWeight: 600, color: '#2D3748',
                        marginBottom: 6, fontFamily: FONT,
                      }}>
                        Anything else to add?
                      </label>
                      <textarea
                        value={refinementAdditional}
                        onChange={e => setRefinementAdditional(e.target.value)}
                        placeholder="Any additional requirements, constraints, or context you'd like to include…"
                        style={{
                          width: '100%',
                          minHeight: 60,
                          resize: 'none',
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          padding: '10px 14px',
                          fontSize: 13,
                          fontFamily: FONT,
                          color: '#1A202C',
                          outline: 'none',
                          boxSizing: 'border-box' as const,
                          transition: 'border-color 0.15s',
                          background: '#FFFFFF',
                          lineHeight: 1.5,
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                        onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                      />
                    </div>

                    <ActionBtn
                      icon={isLoading ? (
                        <div style={{
                          width: 13, height: 13, border: '2px solid #FFFFFF40',
                          borderTopColor: '#FFFFFF', borderRadius: '50%',
                          animation: 'ppSpin 0.6s linear infinite',
                        }} />
                      ) : (
                        <ArrowRight size={13} />
                      )}
                      label={isLoading ? 'Refining…' : 'Refine Evaluation'}
                      onClick={handleRefineEvaluation}
                      primary
                      disabled={!hasRefinementInput || isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Bottom navigation row (per PRD §4.2) */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 20,
                flexWrap: 'wrap',
              }}>
                <ActionBtn
                  icon={<RotateCcw size={13} />}
                  label="Start Over"
                  onClick={handleReset}
                />
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
          animation: 'ppFadeIn 0.15s ease both',
          fontFamily: FONT,
        }}>
          {toastMessage} ✓
        </div>
      )}
    </div>
  );
};

/* ─── Output Section Card — uses LEVEL_ACCENT_DARK for all sections (§4.1, §13) ─── */
const OutputSection: React.FC<{
  section: typeof EVALUATOR_SECTIONS[number];
  index: number;
  visible: boolean;
  copiedSection: string | null;
  onCopy: (key: string, label: string) => void;
  totalSections: number;
  children: React.ReactNode;
}> = ({ section, index, visible, copiedSection, onCopy, totalSections, children }) => {
  const isSectionCopied = copiedSection === section.key;
  return (
    <div style={{
      borderLeft: `4px solid ${LEVEL_ACCENT_DARK}`,
      background: `${LEVEL_ACCENT_DARK}12`,
      borderRadius: 10, padding: '18px 20px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>{section.icon}</span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#1A202C',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            fontFamily: FONT,
          }}>
            {section.label}
          </span>
          <span style={{ fontSize: 11, color: '#A0AEC0' }}>
            {index + 1}/{totalSections}
          </span>
        </div>
        <button
          onClick={() => onCopy(section.key, section.label)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: 3,
            padding: '2px 6px', borderRadius: 6, transition: 'color 0.15s',
            fontFamily: FONT,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = LEVEL_ACCENT_DARK)}
          onMouseLeave={e => (e.currentTarget.style.color = '#A0AEC0')}
        >
          {isSectionCopied ? <Check size={11} /> : <Copy size={11} />}
          {isSectionCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {children}
    </div>
  );
};

/* ── Step Card wrapper (§3.4) ── */
const StepCard: React.FC<{
  stepNumber: number;
  title: string;
  subtitle: string;
  done: boolean;
  collapsed: boolean;
  children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, children }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 16,
    border: `1px solid ${done ? `${LEVEL_ACCENT}88` : '#E2E8F0'}`,
    padding: collapsed ? '16px 24px' : '24px 28px',
    transition: 'padding 0.2s ease, border-color 0.2s ease',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: collapsed ? 0 : 20,
    }}>
      <StepBadge number={stepNumber} done={done} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', fontFamily: FONT }}>{title}</div>
        {!collapsed && (
          <div style={{ fontSize: 13, color: '#718096', marginTop: 2, fontFamily: FONT }}>{subtitle}</div>
        )}
      </div>
      {done && collapsed && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK,
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: FONT,
        }}>
          <Check size={13} /> Done
        </div>
      )}
    </div>
    {!collapsed && children}
  </div>
);

/* ── Step badge circle — uses Level 5 accent color (§3.4) ── */
const StepBadge: React.FC<{ number: number; done: boolean }> = ({ number, done }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: done ? LEVEL_ACCENT : '#F7FAFC',
    border: done ? 'none' : '2px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800,
    color: done ? LEVEL_ACCENT_DARK : '#718096',
    transition: 'background 0.2s, color 0.2s',
  }}>
    {done ? <Check size={14} /> : number}
  </div>
);

/* ── Step connector (§3.5) ── */
const StepConnector: React.FC = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '6px 0',
  }}>
    <div style={{
      width: 3, height: 24, borderRadius: 2,
      background: `repeating-linear-gradient(to bottom, ${LEVEL_ACCENT} 0px, ${LEVEL_ACCENT} 4px, transparent 4px, transparent 8px)`,
      backgroundSize: '3px 20px',
      animation: 'ppConnectorFlow 0.8s linear infinite',
    }} />
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${LEVEL_ACCENT}20`, border: `2px solid ${LEVEL_ACCENT}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: 2,
    }}>
      <ArrowDown size={14} color={LEVEL_ACCENT} />
    </div>
  </div>
);

/* ── Tool Overview — standardised "How it works" strip (§3.3) ── */
const ToolOverview: React.FC<{
  steps: { number: number; label: string; detail: string; done: boolean }[];
  outcome: string;
}> = ({ steps, outcome }) => (
  <div style={{
    background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0',
    padding: '20px 24px', marginBottom: 24,
  }}>
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#A0AEC0',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14,
      fontFamily: FONT,
    }}>
      How it works
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
      {steps.map((step, i) => (
        <React.Fragment key={step.number}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: step.done ? LEVEL_ACCENT : '#F7FAFC',
              border: step.done ? 'none' : '2px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: step.done ? LEVEL_ACCENT_DARK : '#718096',
            }}>
              {step.done ? <Check size={12} /> : step.number}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 2, fontFamily: FONT }}>
                {step.label}
              </div>
              <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: FONT }}>
                {step.detail}
              </div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} color="#CBD5E0" style={{ flexShrink: 0, margin: '0 10px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
    <div style={{
      background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 10,
      padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#276749',
        textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, marginTop: 1,
        fontFamily: FONT,
      }}>
        Outcome
      </div>
      <div style={{ fontSize: 12, color: '#2F855A', lineHeight: 1.5, fontFamily: FONT }}>
        {outcome}
      </div>
    </div>
  </div>
);

/* ── Toggle Button — Cards / Markdown (§4.1) ── */
const ToggleBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}> = ({ icon, label, active, onClick, highlight }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '8px 16px', border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: active ? 700 : 600,
      background: active ? (highlight ? '#2B6CB0' : '#1A202C') : 'transparent',
      color: active ? '#FFFFFF' : (highlight ? '#2B6CB0' : '#718096'),
      transition: 'background 0.15s, color 0.15s',
      fontFamily: FONT,
    }}
  >
    {icon} {label}
  </button>
);

/* ── Info Tooltip (§6.1) ── */
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#EBF4FF', border: '1px solid #BEE3F8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, flexShrink: 0,
        }}
        aria-label="Why use Markdown?"
      >
        <Info size={12} color="#3182CE" />
      </button>
      {show && (
        <div style={{
          position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#E2E8F0', borderRadius: 10,
          padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
          width: 280, zIndex: 30, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          fontFamily: FONT,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#90CDF4' }}>
            Why Markdown?
          </div>
          {text}
          <div style={{
            position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10, background: '#1A202C',
          }} />
        </div>
      )}
    </div>
  );
};

/* ── Action Button (§3.8) ── */
const ActionBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  accent?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, primary, accent, disabled }) => {
  const bg = primary ? '#38B2AC' : accent ? '#5A67D8' : '#FFFFFF';
  const fg = (primary || accent) ? '#FFFFFF' : '#4A5568';
  const bdr = (primary || accent) ? 'none' : '1px solid #E2E8F0';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 16px', borderRadius: 24,
        fontSize: 12, fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        background: bg, color: fg, border: bdr,
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
        fontFamily: FONT,
      }}
    >
      {icon} {label}
    </button>
  );
};

export default AppAppEvaluator;
