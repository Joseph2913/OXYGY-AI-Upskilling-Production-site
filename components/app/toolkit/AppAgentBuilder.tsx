import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, ArrowLeft, Copy, Check, RotateCcw, Code, Download, Library,
  Info, ChevronRight, ChevronDown, ChevronUp, Sparkles, Eye, Square, CheckSquare, X,
  FileText, BookOpen,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  GOOD_EXAMPLES, NOT_RECOMMENDED_EXAMPLES, CRITERIA_LABELS,
  WHY_JSON_CONTENT, PROMPT_SECTION_COLORS,
  AGENT_PLATFORMS, SETUP_LOADING_STEPS, SETUP_STEP_DELAYS,
} from '../../../data/agent-builder-content';
import { useAgentDesignApi } from '../../../hooks/useAgentDesignApi';
import type { AgentDesignResult, AgentReadinessCriteria, AccountabilityCheck, AgentSetupGuide } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';
import LearningPlanBlocker from '../LearningPlanBlocker';
import { upsertToolUsed, createArtefactFromTool, updateArtefactContent } from '../../../lib/database';
import OutputActionsPanel from '../workflow/OutputActionsPanel';
import NextStepBanner from './NextStepBanner';

const FONT = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";
const LEVEL_ACCENT = '#F7E8A4';
const LEVEL_ACCENT_DARK = '#8A6A00';

/* ─── Copyable code block for build guide steps ─── */
const AgentBuildGuideCodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div style={{ position: 'relative', margin: '8px 0' }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: copied ? '#38B2AC' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '4px 8px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.15s ease',
        }}
        title="Copy code"
      >
        {copied ? <Check size={13} color="#fff" /> : <Copy size={13} color="#A0AEC0" />}
        <span style={{ fontSize: 11, color: copied ? '#fff' : '#A0AEC0', fontFamily: FONT }}>
          {copied ? 'Copied' : 'Copy'}
        </span>
      </button>
      <pre style={{
        background: '#1A202C', color: '#E2E8F0', padding: '14px 18px',
        borderRadius: 8, fontSize: 12, fontFamily: MONO,
        overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
        margin: 0,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

/* ─── Render inline markdown: bold, italic, code, links ─── */
function renderAgentInlineParts(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
    if (match[2]) {
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: '#1A202C' }}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++} style={{ fontStyle: 'italic' }}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code key={key++} style={{
          background: '#EDF2F7', padding: '1px 6px', borderRadius: 4,
          fontSize: '0.92em', fontFamily: MONO, color: '#8A6A00',
        }}>{match[4]}</code>
      );
    } else if (match[5] && match[6]) {
      parts.push(
        <a key={key++} href={match[6]} target="_blank" rel="noopener noreferrer" style={{
          color: '#2B6CB0', textDecoration: 'underline', fontWeight: 600,
        }}>{match[5]}</a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

/* ─── Rich markdown renderer for build guide steps ─── */
function renderAgentFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks (``` delimited)
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(<AgentBuildGuideCodeBlock key={key++} code={codeLines.join('\n')} />);
      continue;
    }

    // Heuristic: unfenced JSON blocks
    if (line.trim() === '{') {
      const codeLines: string[] = [line];
      let depth = 1;
      let j = i + 1;
      while (j < lines.length && depth > 0) {
        codeLines.push(lines[j]);
        const trimmed = lines[j].trim();
        for (const ch of trimmed) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        j++;
      }
      if (depth === 0) {
        elements.push(<AgentBuildGuideCodeBlock key={key++} code={codeLines.join('\n')} />);
        i = j;
        continue;
      }
    }

    // Empty lines / dividers
    if (line.trim() === '' || line.trim() === '---') { i++; continue; }

    // Regular paragraph with inline formatting
    elements.push(
      <p key={key++} style={{ margin: '4px 0', lineHeight: 1.7, fontSize: 13, color: '#4A5568', fontFamily: FONT }}>
        {renderAgentInlineParts(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

/* ── Loading progress steps (per PRD §9.5) ── */
const INITIAL_LOADING_STEPS = [
  'Evaluating readiness…',
  'Designing output format…',
  'Writing system prompt…',
  'Adding accountability features…',
  'Scoring criteria…',
  'Generating refinement questions…',
  'Finalising design…',
];
const REFINE_LOADING_STEPS = [
  'Processing your additional context…',
  'Re-evaluating readiness…',
  'Refining output format…',
  'Strengthening system prompt…',
  'Updating accountability…',
  'Generating deeper questions…',
  'Finalising refined design…',
];
// Front-loaded timing: early steps fast, later steps slower (~21.8s total)
const STEP_DELAYS = [800, 1500, 3000, 4000, 4500, 4000, 4000];

const DRAFT_KEY = 'oxygy_agent-builder_draft';

/* ─── Educational content for the 4 output sections ─── */
const DESIGN_SECTIONS = [
  {
    key: 'readiness',
    label: 'Readiness Score',
    icon: '🔍',
    color: LEVEL_ACCENT_DARK,
    why: 'Not every task needs a custom agent. This section evaluates your task across five dimensions — frequency, consistency, shareability, complexity, and standardization risk — to determine whether building a reusable agent is the right investment.',
    example: 'A task scored 85% overall: high frequency (weekly), strong consistency needs, and shared across 3 departments — making it a strong candidate for a Level 2 agent.',
  },
  {
    key: 'output_format',
    label: 'Output Format',
    icon: '📐',
    color: LEVEL_ACCENT_DARK,
    why: 'The difference between Level 1 prompting and a Level 2 agent is structure. By defining an explicit output format (both human-readable and JSON), your agent produces identical results every time — enabling dashboards, reports, and automated workflows.',
    example: 'A JSON template with fields for summary, key_themes[], sentiment_scores{}, and recommendations[] — so every survey analysis follows the same structure.',
  },
  {
    key: 'system_prompt',
    label: 'System Prompt',
    icon: '📝',
    color: LEVEL_ACCENT_DARK,
    why: 'A system prompt is the instruction set that defines how your agent behaves. It incorporates the Prompt Blueprint framework from Level 1 — Role, Context, Task, Format, Steps, and Quality Checks — into a single, comprehensive prompt ready for any AI platform.',
    example: '[ROLE] You are a survey analysis specialist... [TASK] Analyze the provided survey data to identify... [QUALITY CHECKS] Cross-reference themes against raw responses...',
  },
  {
    key: 'accountability',
    label: 'Built-In Accountability',
    icon: '✅',
    color: LEVEL_ACCENT_DARK,
    why: 'A well-built agent cites specific sources (row numbers, timestamps, page references), provides confidence scores, explains its reasoning, and flags areas of uncertainty — so the human reviewer can verify quickly rather than starting from scratch.',
    example: 'The agent includes row-level references for every theme it identifies, confidence scores per conclusion, and a data coverage summary showing what was analyzed vs. skipped.',
  },
];

/* ─── Helpers ─── */

function getScoreColor(score: number) {
  if (score >= 80) return '#38B2AC';
  if (score >= 50) return '#C4A934';
  return '#E57A5A';
}

function getVerdictText(score: number) {
  if (score >= 80) return 'Strong candidate for a Level 2 agent';
  if (score >= 50) return 'Could benefit from an agent — with some caveats';
  return 'Better suited to ad-hoc prompting for now';
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'critical': return { bg: '#FFF5F5', color: '#C53030', border: '#FC8181' };
    case 'important': return { bg: '#FFFFF0', color: '#B7791F', border: '#F6E05E' };
    default: return { bg: '#E6FFFA', color: '#2C7A7B', border: '#81E6D9' };
  }
}

function renderColorCodedPrompt(prompt: string) {
  const parts: React.ReactNode[] = [];
  let key = 0;
  const markerRegex = /\[(ROLE|CONTEXT|TASK|OUTPUT FORMAT|STEPS|QUALITY CHECKS)\]/g;
  const matches = [...prompt.matchAll(markerRegex)];
  if (matches.length === 0) return <span>{prompt}</span>;
  if (matches[0].index! > 0) {
    parts.push(<span key={key++}>{prompt.slice(0, matches[0].index!)}</span>);
  }
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const sectionName = match[1];
    const startIdx = match.index! + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : prompt.length;
    const sectionText = prompt.slice(startIdx, endIdx);
    const colors = PROMPT_SECTION_COLORS[sectionName];
    if (colors) {
      parts.push(
        <span key={key++} style={{ backgroundColor: colors.bg, borderRadius: 4, padding: '2px 0' }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
            padding: '1px 6px', borderRadius: 4, marginRight: 4,
            backgroundColor: colors.bg, color: '#4A5568',
          }}>
            {colors.emoji} {colors.label}
          </span>
          {sectionText}
        </span>
      );
    } else {
      parts.push(<span key={key++}>{sectionText}</span>);
    }
  }
  return <>{parts}</>;
}

function renderJSONLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;
  const regex = /("(?:[^"\\]|\\.)*")(\s*:\s*)?|(\btrue\b|\bfalse\b|\bnull\b|\b\d+\.?\d*\b)|([{}\[\],:])/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
    if (match[1]) {
      if (match[2]) {
        parts.push(<span key={key++} style={{ color: '#38B2AC' }}>{match[1]}</span>);
        parts.push(<span key={key++} style={{ color: '#718096' }}>{match[2]}</span>);
      } else {
        parts.push(<span key={key++} style={{ color: '#A8F0E0' }}>{match[1]}</span>);
      }
    } else if (match[3]) {
      parts.push(<span key={key++} style={{ color: '#FBE8A6' }}>{match[3]}</span>);
    } else if (match[4]) {
      parts.push(<span key={key++} style={{ color: '#718096' }}>{match[4]}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) parts.push(<span key={key++}>{line.slice(lastIndex)}</span>);
  return <>{parts}</>;
}

/* ─── Score Circle (inline styles, no Tailwind) ─── */

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
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Agent readiness score: ${score} percent`}>
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

/* ─── Main Component ─── */

const AppAgentBuilder: React.FC = () => {
  const { user } = useAuth();
  const { hasLearningPlan, learningPlanLoading, projectChips } = useAppContext();
  const projectChip = projectChips?.[2] ?? null;
  const location = useLocation();

  // Input state
  const [taskDescription, setTaskDescription] = useState('');
  const [inputDataDescription, setInputDataDescription] = useState('');

  // Result & UI state
  const [result, setResult] = useState<AgentDesignResult | null>(null);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [activeView, setActiveView] = useState<'cards' | 'markdown' | 'output_format' | 'accountability'>('cards');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['system_prompt']));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [selectedChecks, setSelectedChecks] = useState<Record<number, boolean>>({});
  const [showJsonTooltip, setShowJsonTooltip] = useState(false);
  const [hasTrackedUsage, setHasTrackedUsage] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRefineLoading, setIsRefineLoading] = useState(false);

  // Refinement state
  const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [refinementCount, setRefinementCount] = useState(0);
  const [refineExpanded, setRefineExpanded] = useState(false);

  // Step 3 — Choose Platform / Step 4 — Build Plan
  const [step2Approved, setStep2Approved] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [setupGuide, setSetupGuide] = useState<AgentSetupGuide | null>(null);
  const [setupLoadingStep, setSetupLoadingStep] = useState(0);

  // Step 4 — Build Plan output (per BUILD-GUIDE-OUTPUT-STANDARD)
  const [buildPlanViewMode, setBuildPlanViewMode] = useState<'cards' | 'markdown'>('cards');
  const [buildPlanVisibleBlocks, setBuildPlanVisibleBlocks] = useState(0);
  const [buildPlanCopied, setBuildPlanCopied] = useState(false);
  const [expandedBuildSteps, setExpandedBuildSteps] = useState<Set<number>>(new Set());
  const [buildPlanSaved, setBuildPlanSaved] = useState(false);
  const [buildPlanRefineExpanded, setBuildPlanRefineExpanded] = useState(false);
  const [buildPlanRefinementAnswers, setBuildPlanRefinementAnswers] = useState<Record<number, string>>({});
  const [buildPlanAdditionalContext, setBuildPlanAdditionalContext] = useState('');
  const [sourceArtefactId, setSourceArtefactId] = useState<string | null>(null);

  // Refs
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);

  // API
  const { designAgent, generateSetupGuide, isLoading, setupLoading, error, clearError } = useAgentDesignApi();

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
    if (prefill.taskDescription) setTaskDescription(prefill.taskDescription);
    if (prefill.inputDescription) setInputDataDescription(prefill.inputDescription);
    // Restore full result so the output section is visible immediately
    if (prefill.systemPrompt) {
      setResult({
        readiness: {
          overall_score: prefill.readinessScore ?? 0,
          verdict: '',
          rationale: '',
          criteria: {
            frequency: { score: 0, assessment: '' },
            consistency: { score: 0, assessment: '' },
            shareability: { score: 0, assessment: '' },
            complexity: { score: 0, assessment: '' },
          },
        },
        output_format: prefill.outputFormat || { human_readable: '', json_template: {} },
        system_prompt: prefill.systemPrompt,
        accountability: prefill.accountability || [],
        refinement_questions: prefill.refinementQuestions || [],
      });
      setVisibleBlocks(10);
    }
    if (state?.sourceArtefactId) setSourceArtefactId(state.sourceArtefactId);
    window.history.replaceState({}, '');
  }, []);

  // Loading step progression (per PRD §9.5)
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
      if (delay < 0) return; // -1 = open-ended buffer, don't auto-advance
      cumulative += delay;
      timers.push(setTimeout(() => setLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  // Staggered block animation for Step 4 build plan output
  useEffect(() => {
    if (!setupGuide) return;
    setBuildPlanVisibleBlocks(0);
    setBuildPlanViewMode('cards');
    const totalBlocks = 4; // content + actions + refinement + buffer
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      timers.push(setTimeout(() => setBuildPlanVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
  }, [setupGuide]);

  // Setup guide loading step progression
  useEffect(() => {
    if (!setupLoading) {
      if (setupLoadingStep > 0) {
        setSetupLoadingStep(SETUP_LOADING_STEPS.length);
        const timer = setTimeout(() => setSetupLoadingStep(0), 400);
        return () => clearTimeout(timer);
      }
      return;
    }
    setSetupLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    SETUP_STEP_DELAYS.forEach((delay, i) => {
      if (delay < 0) return;
      cumulative += delay;
      timers.push(setTimeout(() => setSetupLoadingStep(i + 1), cumulative));
    });
    return () => timers.forEach(clearTimeout);
  }, [setupLoading]);

  // Staggered block appearance (4 sections + refinement card)
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    setScoreAnimated(false);
    const totalSections = 7; // 4 output sections + OutputActionsPanel + refinement card + buffer
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < totalSections; i++) {
      timers.push(setTimeout(() => {
        setVisibleBlocks(v => v + 1);
        if (i === 0) setScoreAnimated(true);
      }, 150 + i * 120));
    }
    return () => timers.forEach(clearTimeout);
  }, [result]);

  // Init all checks as selected when result arrives
  useEffect(() => {
    if (result && result.accountability) {
      const initial: Record<number, boolean> = {};
      result.accountability.forEach((_, idx) => { initial[idx] = true; });
      setSelectedChecks(initial);
    }
  }, [result]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Draft persistence
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.taskDescription) setTaskDescription(parsed.taskDescription);
        if (parsed.inputDataDescription) setInputDataDescription(parsed.inputDataDescription);
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if ((taskDescription.trim() || inputDataDescription.trim()) && !result) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ taskDescription, inputDataDescription }));
    }
  }, [taskDescription, inputDataDescription, result]);

  // Close JSON tooltip on outside click / Escape
  useEffect(() => {
    if (!showJsonTooltip) return;
    const handleClick = () => setShowJsonTooltip(false);
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowJsonTooltip(false); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('click', handleClick); document.removeEventListener('keydown', handleEsc); };
  }, [showJsonTooltip]);

  const handleExampleClick = (task: string, inputData: string) => {
    setTaskDescription(task);
    setInputDataDescription(inputData);
  };

  const handleDesign = async () => {
    if (!taskDescription.trim() || isLoading) return;
    clearError();
    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setPromptExpanded(false);
    setSelectedChecks({});
    setSavedToLibrary(false);
    setActiveView('cards');
    setIsRefineLoading(false);
    setRefinementAnswers({});
    setAdditionalContext('');
    setRefineExpanded(false);

    const data = await designAgent({
      task_description: taskDescription.trim(),
      input_data_description: inputDataDescription.trim() || 'Not specified',
    });

    if (data) {
      setResult(data);
      localStorage.removeItem(DRAFT_KEY);
      // Auto-save back to source artefact if launched from library
      if (sourceArtefactId && user) {
        updateArtefactContent(sourceArtefactId, user.id, {
          systemPrompt: data.system_prompt,
          outputFormat: data.output_format || null,
          accountability: data.accountability || [],
          readinessScore: data.readiness?.overall_score || null,
          taskDescription,
          inputDescription: inputDataDescription,
        });
      }
      if (!hasTrackedUsage && user) {
        upsertToolUsed(user.id, 2);
        setHasTrackedUsage(true);
      }
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  const handleReset = () => {
    setTaskDescription('');
    setInputDataDescription('');
    setResult(null);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setPromptExpanded(false);
    setCopiedSection(null);
    setSelectedChecks({});
    setSavedToLibrary(false);
    setActiveView('cards');
    setRefinementAnswers({});
    setAdditionalContext('');
    setRefinementCount(0);
    setRefineExpanded(false);
    setStep2Approved(false);
    setSelectedPlatform(null);
    setSetupGuide(null);
    setBuildPlanViewMode('cards');
    setBuildPlanVisibleBlocks(0);
    setBuildPlanCopied(false);
    setExpandedBuildSteps(new Set());
    setBuildPlanSaved(false);
    setBuildPlanRefineExpanded(false);
    setBuildPlanRefinementAnswers({});
    setBuildPlanAdditionalContext('');
    clearError();
    localStorage.removeItem(DRAFT_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateSetupGuide = async () => {
    if (!result || !selectedPlatform) return;
    const platformLabel = AGENT_PLATFORMS.find(p => p.id === selectedPlatform)?.label || selectedPlatform;
    const guide = await generateSetupGuide({
      platform: platformLabel,
      system_prompt: result.system_prompt,
      output_format: result.output_format,
      task_description: taskDescription,
    });
    if (guide) {
      setSetupGuide(guide);
      setTimeout(() => step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  /* ── Build refinement message ── */
  const buildRefinementMessage = (): string => {
    const answeredQuestions = (result?.refinement_questions || [])
      .map((q, i) => {
        const answer = refinementAnswers[i]?.trim();
        return answer ? `Q: ${q}\nA: ${answer}` : null;
      })
      .filter(Boolean)
      .join('\n\n');

    const parts = [
      `[REFINEMENT]\n\nOriginal task: ${taskDescription}\nInput data: ${inputDataDescription || 'Not specified'}`,
      answeredQuestions ? `\nContext from follow-up questions:\n\n${answeredQuestions}` : '',
      additionalContext.trim() ? `\nAdditional context: ${additionalContext.trim()}` : '',
    ];

    return parts.filter(Boolean).join('\n');
  };

  /* ── Handle refinement ── */
  const handleRefine = async () => {
    const hasAnswers = Object.values(refinementAnswers).some(a => (a as string).trim());
    if (!hasAnswers && !additionalContext.trim()) return;

    setIsRefineLoading(true);
    setVisibleBlocks(0);
    setScoreAnimated(false);
    setPromptExpanded(false);
    setSavedToLibrary(false);
    setCopied(false);

    const enrichedInput = buildRefinementMessage();
    const data = await designAgent({
      task_description: enrichedInput,
      input_data_description: '',
    });

    if (data) {
      setResult(data);
      // Auto-save back to source artefact if launched from library
      if (sourceArtefactId && user) {
        updateArtefactContent(sourceArtefactId, user.id, {
          systemPrompt: data.system_prompt,
          outputFormat: data.output_format || null,
          accountability: data.accountability || [],
          readinessScore: data.readiness?.overall_score || null,
          taskDescription,
          inputDescription: inputDataDescription,
        });
      }
      setRefinementAnswers({});
      setAdditionalContext('');
      setRefinementCount(c => c + 1);
      setActiveView('cards');
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  const hasRefinementInput = Object.values(refinementAnswers).some(a => (a as string).trim()) || additionalContext.trim();

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  }, []);

  /** Build a single cohesive system prompt combining the system prompt (which already includes
   *  [OUTPUT FORMAT]) and accountability features. The output format is NOT appended separately
   *  because the system prompt's [OUTPUT FORMAT] section already defines it. */
  const buildFullSystemPrompt = (r: AgentDesignResult): string => {
    const selectedInstructions = r.accountability
      .filter((_, idx) => selectedChecks[idx])
      .map(c => c.prompt_instruction)
      .join('\n\n');

    return [
      r.system_prompt,
      ``,
      `--- BUILT-IN ACCOUNTABILITY FEATURES ---`,
      ``,
      selectedInstructions,
    ].join('\n');
  };

  /** Build a full Build Plan markdown document combining setup guide steps, tips, system prompt */
  const buildFullBuildPlan = (): string => {
    if (!setupGuide || !result) return '';
    const platformLabel = AGENT_PLATFORMS.find(p => p.id === selectedPlatform)?.label || 'your platform';
    const parts: string[] = [
      `# Build Plan`,
      `## Agent: ${taskDescription.slice(0, 80)}`,
      ``,
      `**Platform:** ${platformLabel}`,
      `**Steps:** ${setupGuide.steps.length}`,
      ``,
      `---`,
      ``,
      `## Setup Steps`,
      ``,
    ];
    setupGuide.steps.forEach((step: { title: string; instruction: string }, i: number) => {
      parts.push(`### Step ${i + 1} — ${step.title}`);
      parts.push(``);
      parts.push(step.instruction);
      parts.push(``);
    });
    if (setupGuide.tips.length > 0) {
      parts.push(`---`);
      parts.push(``);
      parts.push(`## Pro Tips`);
      parts.push(``);
      setupGuide.tips.forEach((tip: string) => {
        parts.push(`- ${tip}`);
      });
      parts.push(``);
    }
    if (setupGuide.limitations) {
      parts.push(`> **Note:** ${setupGuide.limitations}`);
      parts.push(``);
    }
    parts.push(`---`);
    parts.push(``);
    parts.push(`## System Prompt`);
    parts.push(``);
    parts.push('```');
    parts.push(buildFullSystemPrompt(result));
    parts.push('```');
    return parts.join('\n');
  };

  const handleCopyFull = async () => {
    if (!result) return;
    await copyToClipboard(buildFullSystemPrompt(result));
    setCopied(true); setToastMessage('Full system prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  /** One-line summary for collapsed output sections */
  const getSectionSummary = (key: string): string => {
    if (!result) return '';
    switch (key) {
      case 'readiness': return `Score: ${result.readiness.overall_score}% — ${result.readiness.verdict}`;
      case 'output_format': return result.output_format.human_readable.split('\n')[0] || 'Structured output format defined';
      case 'system_prompt': return `${result.system_prompt.length} characters — ready to paste into your AI platform`;
      case 'accountability': return `${result.accountability.length} built-in checks for verification and traceability`;
      default: return '';
    }
  };

  const handleCopySection = async (key: string, label: string, content: string) => {
    await copyToClipboard(content);
    setCopiedSection(key); setToastMessage(`${label} copied`);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSaveToLibrary = async () => {
    if (!result || !user) return;
    const fullContent = buildFullSystemPrompt(result);
    const title = `Agent: ${taskDescription.slice(0, 55)}${taskDescription.length > 55 ? '\u2026' : ''}`;
    const saved = await createArtefactFromTool(user.id, {
      name: title,
      type: 'agent',
      level: 2,
      sourceTool: 'agent-builder',
      content: {
        systemPrompt: fullContent,
        outputFormat: result.output_format || null,
        accountability: result.accountability || [],
        readinessScore: result.readiness_score || null,
        taskDescription: taskDescription,
        inputDescription: inputDataDescription,
      },
      preview: `Agent: ${taskDescription.slice(0, 180)}`,
    });
    if (saved) {
      setSavedToLibrary(true);
      setToastMessage('Agent saved to your library');
      setTimeout(() => setSavedToLibrary(false), 3000);
    }
  };

  const handleCopyBuildPlan = async () => {
    const md = buildFullBuildPlan();
    if (!md) return;
    await copyToClipboard(md);
    setBuildPlanCopied(true); setToastMessage('Build plan copied to clipboard');
    setTimeout(() => setBuildPlanCopied(false), 2500);
  };

  const handleSaveBuildPlan = async () => {
    if (!result || !user || !setupGuide) return;
    const md = buildFullBuildPlan();
    const title = `Build Guide: ${taskDescription.slice(0, 50)}${taskDescription.length > 50 ? '\u2026' : ''}`;
    const saved = await createArtefactFromTool(user.id, {
      name: title,
      type: 'build_guide',
      level: 2,
      sourceTool: 'agent-builder',
      content: {
        markdown: md,
        platform: selectedPlatform || 'generic',
        toolName: 'Agent Builder',
        taskDescription: taskDescription,
      },
      preview: `Build Guide: ${taskDescription.slice(0, 180)}`,
    });
    if (saved) {
      setBuildPlanSaved(true);
      setToastMessage('Build guide saved to your library');
    }
  };

  const handleDownloadBuildPlan = () => {
    const md = buildFullBuildPlan();
    if (!md) return;
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-build-plan-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!result) return;
    const date = new Date().toISOString().split('T')[0];
    const content = buildFullSystemPrompt(result);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-design-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCheck = (idx: number) => {
    setSelectedChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Step indicators
  const step1Done = taskDescription.trim().length > 0 && (result !== null || isLoading);
  const step2Done = step1Done && step2Approved;
  const step3Done = step2Done && selectedPlatform !== null && (setupGuide !== null || setupLoading);
  const step4Done = setupGuide !== null;

  if (learningPlanLoading) return null;
  if (!hasLearningPlan) return <LearningPlanBlocker pageName="this tool" />;

  return (
    <div style={{ padding: '28px 36px', minHeight: '100%', fontFamily: FONT }}>
      <style>{`
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        @keyframes ppPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes ppFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ppConnectorFlow {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
        @keyframes ppSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ Page Title ═══ */}
      <h1 style={{
        fontSize: 28, fontWeight: 800, color: '#1A202C',
        letterSpacing: '-0.4px', margin: 0, marginBottom: 6,
      }}>
        Agent Builder
      </h1>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0, marginBottom: 20 }}>
        Off-the-shelf AI assistants give generic answers because they lack the specifics of your role, your constraints, and your standards. The Agent Builder lets you configure a purpose-built AI agent with a defined persona, task boundaries, and quality checks — so every response is grounded in your context and ready to use.
      </p>

      {/* ═══ How It Works — Overview Strip ═══ */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Describe your agent', detail: 'Define the task and the data your agent will process', done: step1Done },
          { number: 2, label: 'Review your agent design', detail: 'Readiness score, output format, system prompt, and accountability', done: step2Done },
          { number: 3, label: 'Choose your platform', detail: 'Select where you want to deploy this agent', done: step3Done },
          { number: 4, label: 'Build plan', detail: 'Get a tailored setup guide for your platform', done: step4Done },
        ]}
        outcome="A complete agent — system prompt, structured output format, accountability features, and step-by-step deployment guide for your chosen AI platform."
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Describe Your Agent                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step1Ref}>
        <StepCard
          stepNumber={1}
          title="Describe your agent"
          subtitle="Define the task your agent should handle and the data it will process."
          done={step1Done}
          collapsed={step1Done}
        >
          {/* Your Project chip */}
          {projectChip && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: LEVEL_ACCENT_DARK, fontWeight: 600, marginBottom: 6, fontFamily: FONT }}>
                ◆ Your Project
              </div>
              <button
                onClick={() => handleExampleClick(projectChip.task, projectChip.inputData)}
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
                {projectChip.task}
              </button>
            </div>
          )}

          {/* Example pills */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Try an example:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOOD_EXAMPLES.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => handleExampleClick(ex.task, ex.inputData)}
                  style={{
                    padding: '7px 14px', borderRadius: 10,
                    fontSize: 13, color: LEVEL_ACCENT_DARK,
                    background: `${LEVEL_ACCENT}12`,
                    border: `1px solid ${LEVEL_ACCENT}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    textAlign: 'left', lineHeight: 1.4, fontFamily: FONT,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK; e.currentTarget.style.background = `${LEVEL_ACCENT}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = LEVEL_ACCENT; e.currentTarget.style.background = `${LEVEL_ACCENT}12`; }}
                >
                  {ex.name}
                </button>
              ))}
              {NOT_RECOMMENDED_EXAMPLES.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => handleExampleClick(ex.task, ex.inputData)}
                  style={{
                    padding: '7px 14px', borderRadius: 10,
                    fontSize: 13, color: '#B7791F', background: 'rgba(251,206,177,0.08)',
                    border: '1px solid #FBCEB1', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    textAlign: 'left', lineHeight: 1.4, fontFamily: FONT,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#E57A5A'; e.currentTarget.style.background = 'rgba(251,206,177,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#FBCEB1'; e.currentTarget.style.background = 'rgba(251,206,177,0.08)'; }}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input 1: Task Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6 }}>
              What should this agent do?
            </label>
            <textarea
              value={taskDescription}
              onChange={e => {
                setTaskDescription(e.target.value);
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.max(80, ta.scrollHeight) + 'px';
              }}
              placeholder="e.g., Analyze customer feedback surveys and identify the top themes, sentiment patterns, and actionable recommendations..."
              style={{
                width: '100%', minHeight: 80, maxHeight: 200,
                resize: 'none', overflow: 'auto',
                border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '14px 16px', fontSize: 15, color: '#1A202C',
                fontFamily: FONT, lineHeight: 1.6, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Input 2: Input Data Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 6 }}>
              What data will this agent work with?
              <span style={{
                fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                background: `${LEVEL_ACCENT}44`, borderRadius: 10, padding: '2px 8px',
              }}>
                Recommended
              </span>
            </label>
            <textarea
              value={inputDataDescription}
              onChange={e => {
                setInputDataDescription(e.target.value);
                const ta = e.target;
                ta.style.height = 'auto';
                ta.style.height = Math.max(60, ta.scrollHeight) + 'px';
              }}
              placeholder="e.g., Excel files containing survey responses with columns for respondent role, department, rating (1-5), and open-text feedback..."
              style={{
                width: '100%', minHeight: 60, maxHeight: 160,
                resize: 'none', overflow: 'auto',
                border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '14px 16px', fontSize: 15, color: '#1A202C',
                fontFamily: FONT, lineHeight: 1.6, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Design button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleDesign}
              disabled={!taskDescription.trim() || isLoading}
              style={{
                padding: '12px 28px', borderRadius: 24,
                background: !taskDescription.trim() || isLoading ? '#CBD5E0' : '#38B2AC',
                color: '#FFFFFF', border: 'none',
                fontSize: 14, fontWeight: 700,
                cursor: !taskDescription.trim() || isLoading ? 'not-allowed' : 'pointer',
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
                  Designing...
                </>
              ) : (
                <>Design My Agent <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 14, padding: '12px 16px', borderRadius: 10,
              background: '#FFF5F5', border: '1px solid #FC8181',
              fontSize: 13, color: '#C53030',
            }}>
              {error}
            </div>
          )}
        </StepCard>
      </div>

      {/* Connector 1→2 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Review Your Agent Design                      */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step2Ref} style={result ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard
          stepNumber={2}
          title={result ? 'Your agent design' : 'Review your agent design'}
          subtitle="Your agent has been designed across 4 sections. Review, copy, or save the complete design."
          done={step2Done}
          collapsed={step2Done}
          locked={!result && !isLoading}
          lockedMessage="Complete Step 1 to generate your agent design"
        >
          {isLoading ? (
            /* ── Processing Progress Indicator ── */
            <ProcessingProgress
              steps={isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS}
              currentStep={loadingStep}
              header={isRefineLoading ? 'Refining your agent design…' : 'Designing your agent…'}
              subtext="This usually takes 15–20 seconds"
            />
          ) : result ? (
            /* ═══ Active Output — Simplified Layout ═══ */
            <>
              {/* ── Compact Readiness Score ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: '#F7FAFC', borderRadius: 14,
                border: '1px solid #E2E8F0', padding: '18px 22px',
                marginBottom: 16,
                opacity: 0 < visibleBlocks ? 1 : 0,
                transform: 0 < visibleBlocks ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${getScoreColor(result.readiness.overall_score)} ${result.readiness.overall_score * 3.6}deg, #E2E8F0 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#F7FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: getScoreColor(result.readiness.overall_score),
                    fontFamily: FONT,
                  }}>
                    {result.readiness.overall_score}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', fontFamily: FONT, lineHeight: 1.3 }}>
                    {result.readiness.verdict}
                  </div>
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5, fontFamily: FONT, marginTop: 4 }}>
                    {result.readiness.rationale.length > 200
                      ? result.readiness.rationale.slice(0, 200) + '…'
                      : result.readiness.rationale}
                  </div>
                </div>
                <button
                  onClick={() => toggleSection('readiness')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: FONT, flexShrink: 0, padding: '4px 0',
                  }}
                >
                  {expandedSections.has('readiness') ? 'Hide' : 'Learn more'}
                  <ChevronDown size={13} style={{
                    transform: expandedSections.has('readiness') ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </button>
              </div>

              {/* Expanded readiness detail */}
              {expandedSections.has('readiness') && (
                <div style={{
                  background: '#FFFFFF', borderRadius: 12,
                  border: '1px solid #E2E8F0', padding: '18px 20px',
                  marginBottom: 16, marginTop: -8,
                  animation: 'ppSlideDown 0.2s ease both',
                }}>
                  {(Object.entries(result.readiness.criteria) as [string, AgentReadinessCriteria][]).map(([key, val]) => (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                      borderBottom: '1px solid #F7FAFC',
                    }}>
                      <div style={{ width: 120, flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#1A202C' }}>
                        {CRITERIA_LABELS[key]?.label || key}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, color: '#718096' }}>{val.assessment}</div>
                      <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${val.score}%`, background: getScoreColor(val.score),
                            transition: 'width 0.7s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#718096', width: 28, textAlign: 'right' }}>{val.score}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.6, marginTop: 12, fontFamily: FONT }}>
                    {result.readiness.rationale}
                  </div>
                </div>
              )}

              {/* ── System Prompt — primary deliverable ── */}
              <div style={{
                marginBottom: 16,
                opacity: 1 < visibleBlocks ? 1 : 0,
                transform: 1 < visibleBlocks ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 10, flexWrap: 'wrap', gap: 8,
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: '#1A202C',
                    textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: FONT,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 15 }}>📝</span> Your System Prompt
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn
                      icon={copied ? <Check size={13} /> : <Copy size={13} />}
                      label={copied ? 'Copied!' : 'Copy'}
                      onClick={handleCopyFull}
                      primary
                    />
                  </div>
                </div>

                {/* ── Unified view toggle row: Cards/Markdown LEFT — Output Format/Accountability RIGHT ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      display: 'flex', background: '#F7FAFC', borderRadius: 8,
                      border: '1px solid #E2E8F0', overflow: 'hidden',
                    }}>
                      <ToggleBtn
                        icon={<Eye size={12} />}
                        label="Cards"
                        active={activeView === 'cards'}
                        onClick={() => setActiveView('cards')}
                      />
                      <ToggleBtn
                        icon={<Code size={12} />}
                        label="Markdown"
                        active={activeView === 'markdown'}
                        onClick={() => setActiveView('markdown')}
                        highlight
                      />
                    </div>
                    <span style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>
                      {result.system_prompt.length.toLocaleString()} characters
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {([
                      { key: 'output_format' as const, label: 'Output Format', icon: '📐' },
                      { key: 'accountability' as const, label: 'Accountability', icon: '✅' },
                    ]).map(tab => {
                      const isActive = activeView === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveView(isActive ? 'cards' : tab.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 8,
                            background: isActive ? `${LEVEL_ACCENT}30` : '#F7FAFC',
                            border: isActive ? `1.5px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
                            cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            color: isActive ? LEVEL_ACCENT_DARK : '#4A5568',
                            fontFamily: FONT, transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{tab.icon}</span>
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── View content area ── */}
                {activeView === 'markdown' ? (
                  <div style={{
                    background: '#1A202C', borderRadius: 12,
                    padding: '20px 22px', overflow: 'auto', maxHeight: 500,
                  }}>
                    <pre style={{
                      color: '#E2E8F0', fontSize: 13, lineHeight: 1.7,
                      fontFamily: MONO, whiteSpace: 'pre-wrap', margin: 0,
                    }}>
                      {buildFullSystemPrompt(result)}
                    </pre>
                  </div>
                ) : activeView === 'output_format' ? (
                  <div style={{
                    background: '#FFFFFF', borderRadius: 12,
                    border: '1px solid #E2E8F0', padding: '18px 20px',
                    animation: 'ppSlideDown 0.2s ease both',
                  }}>
                    <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, marginBottom: 14, fontFamily: FONT }}>
                      Your agent uses a structured output format so every run produces identical, machine-readable results. The <strong style={{ color: '#1A202C' }}>[OUTPUT FORMAT]</strong> section in the prompt above defines this structure.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Eye size={13} color="#718096" />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#1A202C' }}>What your team sees</span>
                        </div>
                        <div style={{
                          background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
                          padding: 14, maxHeight: 400, overflowY: 'auto',
                        }}>
                          {result.output_format.human_readable.split('\n').map((line: string, i: number) => {
                            if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                            if (line.startsWith('# ') || line.startsWith('## ') || /^[A-Z][A-Z\s&:]+$/.test(line.trim())) {
                              return <p key={i} style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', marginTop: 8, marginBottom: 3 }}>{line.replace(/^#+\s*/, '')}</p>;
                            }
                            if (line.trim().startsWith('- ') || line.trim().startsWith('\u2022 ')) {
                              return <p key={i} style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5, paddingLeft: 10 }}>&bull; {line.replace(/^\s*[-\u2022]\s*/, '')}</p>;
                            }
                            return <p key={i} style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5 }}>{line}</p>;
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Code size={13} color="#718096" />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#1A202C' }}>JSON template</span>
                        </div>
                        <div style={{
                          background: '#1A202C', borderRadius: 10,
                          padding: 14, maxHeight: 400, overflowY: 'auto', fontFamily: MONO,
                        }}>
                          <pre style={{ fontSize: 11, lineHeight: 1.5, margin: 0, overflowX: 'auto' }}>
                            {JSON.stringify(result.output_format.json_template, null, 2).split('\n').map((line: string, i: number) => (
                              <div key={i}>{renderJSONLine(line)}</div>
                            ))}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeView === 'accountability' ? (
                  <div style={{
                    background: '#FFFFFF', borderRadius: 12,
                    border: '1px solid #E2E8F0', padding: '18px 20px',
                    animation: 'ppSlideDown 0.2s ease both',
                  }}>
                    <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, marginBottom: 14, fontFamily: FONT }}>
                      Your agent includes {result.accountability.length} built-in accountability features — source citations, confidence scores, and verification aids — so every output can be trusted and traced.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.accountability.map((check: AccountabilityCheck, idx: number) => {
                        const severity = getSeverityStyle(check.severity);
                        return (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '10px 14px', borderRadius: 10,
                            background: '#F7FAFC', border: '1px solid #EDF2F7',
                          }}>
                            <span style={{
                              fontSize: 10, fontWeight: 600, borderRadius: 8, padding: '2px 6px',
                              background: severity.bg, color: severity.color, border: `1px solid ${severity.border}`,
                              textTransform: 'capitalize', flexShrink: 0, marginTop: 2,
                            }}>
                              {check.severity}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', fontFamily: FONT }}>
                                {check.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, marginTop: 2, fontFamily: FONT }}>
                                {check.what_to_verify}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Cards view (default) */
                  <div style={{
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
                    padding: '18px 20px', maxHeight: 500, overflowY: 'auto',
                  }}>
                    <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {renderColorCodedPrompt(buildFullSystemPrompt(result))}
                    </div>
                  </div>
                )}

                {/* Prompt Blueprint labels — show for Cards and Markdown views */}
                {(activeView === 'cards' || activeView === 'markdown') && (
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 8, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>Follows the Prompt Blueprint framework:</span>
                    {Object.entries(PROMPT_SECTION_COLORS).map(([key, val]) => (
                      <span key={key} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                        padding: '2px 8px', borderRadius: 6,
                        backgroundColor: val.bg, color: '#4A5568',
                        border: `1px solid ${val.bg.replace('0.3)', '0.5)').replace('0.15)', '0.35)').replace('0.5)', '0.7)')}`,
                      }}>
                        <span style={{ fontSize: 11 }}>{val.emoji}</span> {val.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Combined Caveat + Refinement Card (matches Workflow Canvas pattern) ── */}
              {(() => {
                const questions = result.refinement_questions || [];
                return (
                  <div style={{
                    background: '#F7FAFC', borderRadius: 14,
                    border: '1px solid #E2E8F0', padding: '20px 24px',
                    marginBottom: 16,
                    opacity: 3 < visibleBlocks ? 1 : 0,
                    transform: 3 < visibleBlocks ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    {/* Caveat text */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: refineExpanded ? 20 : 0 }}>
                      <Info size={16} color="#A0AEC0" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                          This agent design is a strong starting point, but every environment is different.
                          Test the system prompt in your actual AI platform, verify the output format works with your data,
                          and adjust the accountability checks to match your review process.
                        </div>

                        {/* Expand CTA */}
                        {!refineExpanded && (
                          <button
                            onClick={() => setRefineExpanded(true)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: 'none', border: 'none', padding: '8px 0 0',
                              fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                              cursor: 'pointer', fontFamily: FONT,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                          >
                            Would you like to refine this agent design further?
                            <ChevronDown size={14} />
                            {refinementCount > 0 && (
                              <span style={{
                                fontSize: 11, fontWeight: 600,
                                background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                                borderRadius: 20, padding: '2px 10px', fontFamily: FONT,
                                marginLeft: 4,
                              }}>
                                Refinement #{refinementCount}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded refinement questions */}
                    {refineExpanded && (
                      <div style={{ animation: 'ppSlideDown 0.3s ease-out' }}>
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                                textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: FONT,
                              }}>
                                Refine Your Agent Design
                              </div>
                              {refinementCount > 0 && (
                                <div style={{
                                  fontSize: 11, fontWeight: 600,
                                  background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                                  borderRadius: 20, padding: '2px 10px', fontFamily: FONT,
                                }}>
                                  Refinement #{refinementCount}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setRefineExpanded(false)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                                color: '#A0AEC0', display: 'flex', alignItems: 'center',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#4A5568'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#A0AEC0'; }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>
                            {questions.length > 0
                              ? "Answer any of these to add context and get a more targeted agent design. You don't need to answer all of them — even one helps."
                              : 'Add any additional context below to refine your agent design.'}
                          </p>

                          {questions.map((question: string, i: number) => (
                            <div key={i} style={{ marginBottom: 16 }}>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                                {question}
                              </label>
                              <input
                                type="text"
                                value={refinementAnswers[i] || ''}
                                onChange={e => setRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                placeholder="Your answer…"
                                style={{
                                  width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
                                  padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C',
                                  outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
                                  background: '#FFFFFF',
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                              />
                            </div>
                          ))}

                          <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                              Anything else to add?
                            </label>
                            <textarea
                              value={additionalContext}
                              onChange={e => setAdditionalContext(e.target.value)}
                              placeholder="Any additional requirements, constraints, or context you'd like to include…"
                              style={{
                                width: '100%', minHeight: 60, resize: 'none',
                                border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px',
                                fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none',
                                boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
                                background: '#FFFFFF', lineHeight: 1.5,
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                            />
                          </div>

                          <ActionBtn
                            label={isLoading ? 'Refining…' : 'Refine Agent Design'}
                            onClick={handleRefine}
                            primary
                            disabled={!hasRefinementInput || isLoading}
                            iconAfter={isLoading ? (
                              <div style={{
                                width: 13, height: 13, border: '2px solid #FFFFFF40',
                                borderTopColor: '#FFFFFF', borderRadius: '50%',
                                animation: 'ppSpin 0.6s linear infinite',
                              }} />
                            ) : (
                              <ArrowRight size={13} />
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bottom navigation */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap',
              }}>
                <ActionBtn
                  icon={<ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />}
                  label="Back to Step 1"
                  onClick={() => {
                    setResult(null);
                    setVisibleBlocks(0);
                    setStep2Approved(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                <ActionBtn
                  label="Approve Prompt"
                  onClick={() => {
                    setStep2Approved(true);
                    setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  }}
                  iconAfter={<ArrowRight size={13} />}
                  primary
                />
                <ActionBtn
                  icon={<RotateCcw size={13} />}
                  label="Start Over"
                  onClick={handleReset}
                />
              </div>
            </>
          ) : null}
        </StepCard>
      </div>

      {/* ═══ Step 3 — Choose Your Platform ═══ */}
      <StepConnector />
      <div ref={step3Ref} style={step2Approved ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard
          stepNumber={3}
          title="Choose your platform"
          subtitle="Select where you want to deploy this agent"
          done={step3Done}
          collapsed={step3Done}
          locked={!step2Approved}
          lockedMessage="Complete Step 2 to choose your platform"
        >
              {/* Platform selector — 2×3 grid */}
              <div style={{ marginBottom: 8 }}>
                <p style={{
                  fontSize: 14, fontWeight: 600, color: '#1A202C',
                  margin: '0 0 4px 0', fontFamily: FONT,
                }}>
                  Where will you deploy this agent?
                </p>
                <p style={{
                  fontSize: 13, color: '#718096', margin: '0 0 16px 0',
                  fontFamily: FONT, lineHeight: 1.5,
                }}>
                  We'll tailor the setup instructions to your chosen platform.
                </p>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12, marginBottom: 20,
                }}>
                  {AGENT_PLATFORMS.map(platform => {
                    const isSelected = selectedPlatform === platform.id;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: isSelected ? '#FFFDF5' : '#FFFFFF',
                          border: isSelected ? `1.5px solid ${LEVEL_ACCENT_DARK}` : '1px solid #E2E8F0',
                          borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                          fontFamily: FONT, transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 18, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                          {platform.logo ? (
                            <img src={platform.logo} alt={platform.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          ) : (
                            <span>{platform.icon}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 2, fontFamily: FONT }}>
                          {platform.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#A0AEC0', fontFamily: FONT }}>{platform.description}</div>
                      </button>
                    );
                  })}
                </div>

                <ActionBtn
                  label={setupLoading ? 'Generating…' : 'Generate Build Plan'}
                  onClick={handleGenerateSetupGuide}
                  primary
                  disabled={!selectedPlatform || setupLoading}
                  iconAfter={setupLoading ? (
                    <div style={{
                      width: 13, height: 13, border: '2px solid #FFFFFF40',
                      borderTopColor: '#FFFFFF', borderRadius: '50%',
                      animation: 'ppSpin 0.6s linear infinite',
                    }} />
                  ) : (
                    <ArrowRight size={13} />
                  )}
                />
              </div>
        </StepCard>
      </div>

      {/* ═══ Step 4 — Download your Build Plan (per BUILD-GUIDE-OUTPUT-STANDARD) ═══ */}
      <StepConnector />
      <div ref={step4Ref} style={step3Done ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard
          stepNumber={4}
          title="Download your Build Plan"
          subtitle="Your complete, platform-specific deployment guide."
          done={step4Done}
          collapsed={false}
          locked={!setupGuide && !setupLoading}
          lockedMessage="Complete Step 3 to generate your Build Plan"
        >
              {/* §2.1 Loading State */}
              {setupLoading && (
                <ProcessingProgress
                  steps={SETUP_LOADING_STEPS}
                  currentStep={setupLoadingStep}
                  header="Generating your build plan…"
                  subtext={`Tailoring instructions for ${AGENT_PLATFORMS.find(p => p.id === selectedPlatform)?.label || 'your platform'}`}
                />
              )}

              {/* §2.2–2.7 Generated Output */}
              {setupGuide && !setupLoading && (() => {
                const platformLabel = AGENT_PLATFORMS.find(p => p.id === selectedPlatform)?.label || 'your platform';
                const fullBuildPlanMd = buildFullBuildPlan();
                const hasBuildPlanRefinementInput = Object.values(buildPlanRefinementAnswers).some(a => (a as string).trim()) || buildPlanAdditionalContext.trim();
                const buildPlanRefinementQuestions = [
                  `Are there specific error scenarios for this ${platformLabel} deployment you want the guide to address?`,
                  'Should any steps include alternative approaches or fallback options?',
                  'Are there team-specific naming conventions or folder structures to follow?',
                  `What level of detail do you need for the ${platformLabel} configuration — beginner-friendly or advanced?`,
                  'Are there any compliance or security requirements to document?',
                ];

                return (
                  <>
                    {/* §2.2 Next Step Banner */}
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0,
                      transform: buildPlanVisibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <NextStepBanner
                        accentColor={LEVEL_ACCENT}
                        accentDark={LEVEL_ACCENT_DARK}
                        text={`Download your Build Plan and follow the steps in ${platformLabel}. Use the system prompt from Step 2 and deploy it step by step.`}
                      />
                    </div>

                    {/* §2.3 Top Action Row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, marginBottom: 14, flexWrap: 'wrap',
                      opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0,
                      transform: buildPlanVisibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      {/* View toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          display: 'inline-flex', background: '#F7FAFC', borderRadius: 10,
                          border: '1px solid #E2E8F0', overflow: 'hidden',
                        }}>
                          <ToggleBtn
                            icon={<Eye size={13} />}
                            label="Cards"
                            active={buildPlanViewMode === 'cards'}
                            onClick={() => setBuildPlanViewMode('cards')}
                          />
                          <ToggleBtn
                            icon={<Code size={13} />}
                            label="Markdown"
                            active={buildPlanViewMode === 'markdown'}
                            onClick={() => setBuildPlanViewMode('markdown')}
                            highlight
                          />
                        </div>
                        <InfoTooltip text="Markdown view shows the raw Build Plan ready to paste into any tool or docs system. Cards view provides an interactive breakdown of each section." />
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <ActionBtn
                          icon={buildPlanCopied ? <Check size={13} /> : <Copy size={13} />}
                          label={buildPlanCopied ? 'Copied!' : 'Copy Build Plan'}
                          onClick={handleCopyBuildPlan}
                          primary
                        />
                        <ActionBtn
                          icon={<Download size={13} />}
                          label="Download (.md)"
                          onClick={handleDownloadBuildPlan}
                        />
                        <ActionBtn
                          icon={<BookOpen size={13} />}
                          label={buildPlanSaved ? 'Saved!' : 'Save to Library'}
                          onClick={handleSaveBuildPlan}
                          primary
                          disabled={buildPlanSaved}
                        />
                      </div>
                    </div>

                    {/* §2.4 Build Plan Content */}
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 1 ? 1 : 0,
                      transform: buildPlanVisibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      {buildPlanViewMode === 'markdown' ? (
                        /* §2.4b Markdown View */
                        <div style={{
                          background: '#1A202C', borderRadius: 12, padding: '22px 24px',
                          fontFamily: MONO, fontSize: 13, lineHeight: 1.8, color: '#E2E8F0',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          maxHeight: 600, overflow: 'auto', marginBottom: 16,
                        }}>
                          {fullBuildPlanMd}
                        </div>
                      ) : (
                        /* §2.4a Cards View */
                        <div style={{
                          background: '#FFFFFF', border: '1px solid #E2E8F0',
                          borderRadius: 16, padding: '28px 32px', marginBottom: 16,
                        }}>
                          {/* Header row */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 16,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText size={20} color={LEVEL_ACCENT_DARK} />
                              <span style={{
                                fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                                textTransform: 'uppercase', letterSpacing: 2,
                              }}>
                                BUILD PLAN
                              </span>
                            </div>
                            <span style={{
                              background: `${LEVEL_ACCENT}30`, color: LEVEL_ACCENT_DARK,
                              border: `1px solid ${LEVEL_ACCENT}88`, borderRadius: 99,
                              padding: '3px 12px', fontSize: 11, fontWeight: 700,
                            }}>
                              {platformLabel}
                            </span>
                          </div>

                          {/* Title & overview */}
                          <h2 style={{
                            fontSize: 22, fontWeight: 800, color: '#1A202C',
                            margin: '0 0 12px 0', fontFamily: FONT,
                          }}>
                            {taskDescription.slice(0, 80)}{taskDescription.length > 80 ? '…' : ''}
                          </h2>
                          <p style={{
                            fontSize: 14, color: '#4A5568', lineHeight: 1.7,
                            margin: '0 0 20px 0', fontFamily: FONT,
                          }}>
                            Step-by-step instructions to deploy your agent on {platformLabel}. Follow each step in order, then use the system prompt from Step 2.
                          </p>

                          {/* Stat pills */}
                          <div style={{
                            display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24,
                          }}>
                            {[
                              `${setupGuide.steps.length} steps`,
                              platformLabel,
                              setupGuide.tips.length > 0 ? `${setupGuide.tips.length} pro tips` : null,
                            ].filter(Boolean).map((pill, i) => (
                              <span key={i} style={{
                                background: '#F7FAFC', border: '1px solid #E2E8F0',
                                borderRadius: 99, padding: '4px 12px',
                                fontSize: 12, fontWeight: 600, color: '#4A5568',
                              }}>
                                {pill}
                              </span>
                            ))}
                          </div>

                          {/* Steps section */}
                          <div style={{ marginBottom: 24 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 700, color: '#1A202C',
                              marginBottom: 10, fontFamily: FONT,
                            }}>
                              {setupGuide.steps.length} steps in this build plan
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {setupGuide.steps.map((step: { title: string; instruction: string }, i: number) => {
                                const isExpanded = expandedBuildSteps.has(i);
                                return (
                                  <div key={i}>
                                    {/* Step row (clickable) */}
                                    <button
                                      onClick={() => setExpandedBuildSteps(prev => {
                                        const next = new Set(prev);
                                        next.has(i) ? next.delete(i) : next.add(i);
                                        return next;
                                      })}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        width: '100%', textAlign: 'left',
                                        padding: '10px 14px', border: 'none', cursor: 'pointer',
                                        borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                                        background: isExpanded ? `${LEVEL_ACCENT}18` : '#F7FAFC',
                                        transition: 'background 0.15s',
                                        fontFamily: FONT,
                                      }}
                                    >
                                      <div style={{
                                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                        background: LEVEL_ACCENT, color: LEVEL_ACCENT_DARK,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700,
                                      }}>
                                        {i + 1}
                                      </div>
                                      <span style={{
                                        flex: 1, fontSize: 13, fontWeight: 600, color: '#1A202C',
                                      }}>
                                        {step.title}
                                      </span>
                                      {isExpanded
                                        ? <ChevronUp size={16} color="#718096" />
                                        : <ChevronDown size={16} color="#718096" />
                                      }
                                    </button>

                                    {/* Expanded detail panel */}
                                    {isExpanded && (
                                      <div style={{
                                        padding: '16px 18px',
                                        background: `${LEVEL_ACCENT}08`,
                                        border: `1px solid ${LEVEL_ACCENT}44`,
                                        borderTop: 'none',
                                        borderRadius: '0 0 10px 10px',
                                      }}>
                                        <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, fontFamily: FONT }}>
                                          {renderAgentFormattedText(step.instruction)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Pro Tips section */}
                          {setupGuide.tips.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 700, color: '#1A202C',
                                marginBottom: 10, fontFamily: FONT,
                                display: 'flex', alignItems: 'center', gap: 8,
                              }}>
                                <Sparkles size={16} color={LEVEL_ACCENT_DARK} />
                                Pro Tips
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {setupGuide.tips.map((tip: string, i: number) => (
                                  <div key={i} style={{
                                    display: 'flex', gap: 10, alignItems: 'flex-start',
                                    padding: '10px 14px', borderRadius: 10,
                                    background: `${LEVEL_ACCENT}12`,
                                    border: `1px solid ${LEVEL_ACCENT}44`,
                                  }}>
                                    <div style={{
                                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                      background: `${LEVEL_ACCENT}40`, color: LEVEL_ACCENT_DARK,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, fontWeight: 800, marginTop: 1,
                                    }}>
                                      {'\u2022'}
                                    </div>
                                    <div style={{ flex: 1, fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT }}>
                                      {tip}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Limitations note */}
                          {setupGuide.limitations && (
                            <div style={{
                              fontSize: 12, color: '#A0AEC0', lineHeight: 1.5,
                              fontFamily: FONT, fontStyle: 'italic', padding: '0 4px',
                            }}>
                              Note: {setupGuide.limitations}
                            </div>
                          )}

                          {/* "Want the full guide?" CTA */}
                          <div style={{
                            background: '#F7FAFC', border: '1px solid #E2E8F0',
                            borderRadius: 10, padding: '16px 20px', marginTop: 20,
                            display: 'flex', alignItems: 'center', gap: 12,
                          }}>
                            <Download size={18} color="#718096" />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5568', fontFamily: FONT }}>
                                Want the full guide?
                              </div>
                              <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT }}>
                                Download as a Markdown or Word document using the buttons below.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* §2.5 Output Actions Panel */}
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 2 ? 1 : 0,
                      transform: buildPlanVisibleBlocks >= 2 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <OutputActionsPanel
                        workflowName={`Agent: ${taskDescription.slice(0, 50)}`}
                        fullMarkdown={fullBuildPlanMd}
                        onSaveToArtefacts={handleSaveBuildPlan}
                        isSaved={buildPlanSaved}
                      />
                    </div>

                    {/* §2.6 Refinement Section */}
                    <div style={{
                      opacity: buildPlanVisibleBlocks >= 3 ? 1 : 0,
                      transform: buildPlanVisibleBlocks >= 3 ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s, transform 0.3s',
                    }}>
                      <div style={{
                        background: '#F7FAFC', borderRadius: 14,
                        border: '1px solid #E2E8F0', padding: '20px 24px',
                        marginTop: 20,
                      }}>
                        {/* Caveat text */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: buildPlanRefineExpanded ? 20 : 0 }}>
                          <Info size={16} color="#A0AEC0" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                              This Build Plan is a strong starting point, but every environment is different.
                              Test each step in your actual {platformLabel} workspace, and adjust field
                              mappings or credentials as needed.
                            </div>

                            {!buildPlanRefineExpanded && (
                              <button
                                onClick={() => setBuildPlanRefineExpanded(true)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  background: 'none', border: 'none', padding: '8px 0 0',
                                  fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                                  cursor: 'pointer', fontFamily: FONT,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                              >
                                Would you like to refine this Build Plan further?
                                <ChevronDown size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded refinement */}
                        {buildPlanRefineExpanded && (
                          <div style={{ animation: 'ppSlideDown 0.3s ease-out' }}>
                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div style={{
                                  fontSize: 11, fontWeight: 700, color: LEVEL_ACCENT_DARK,
                                  textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: FONT,
                                }}>
                                  Refine Your Build Plan
                                </div>
                                <button
                                  onClick={() => setBuildPlanRefineExpanded(false)}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                                    color: '#A0AEC0', display: 'flex', alignItems: 'center',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#4A5568'; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = '#A0AEC0'; }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: '0 0 18px', fontFamily: FONT }}>
                                Answer any of these to add context and get a more targeted Build Plan. You don't need to answer all.
                              </p>

                              {buildPlanRefinementQuestions.map((question, i) => (
                                <div key={i} style={{ marginBottom: 16 }}>
                                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                                    {question}
                                  </label>
                                  <input
                                    type="text"
                                    value={buildPlanRefinementAnswers[i] || ''}
                                    onChange={e => setBuildPlanRefinementAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                    placeholder="Your answer…"
                                    style={{
                                      width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
                                      padding: '10px 14px', fontSize: 13, fontFamily: FONT, color: '#1A202C',
                                      outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
                                      background: '#FFFFFF',
                                    }}
                                    onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                                    onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                                  />
                                </div>
                              ))}

                              <div style={{ marginBottom: 18 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2D3748', marginBottom: 6, fontFamily: FONT }}>
                                  Anything else to add?
                                </label>
                                <textarea
                                  value={buildPlanAdditionalContext}
                                  onChange={e => setBuildPlanAdditionalContext(e.target.value)}
                                  placeholder="Any additional requirements, constraints, or context…"
                                  style={{
                                    width: '100%', minHeight: 60, resize: 'none',
                                    border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px',
                                    fontSize: 13, fontFamily: FONT, color: '#1A202C', outline: 'none',
                                    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
                                    background: '#FFFFFF', lineHeight: 1.5,
                                  }}
                                  onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                                  onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                                />
                              </div>

                              <ActionBtn
                                label={setupLoading ? 'Regenerating…' : 'Regenerate Build Plan'}
                                onClick={async () => {
                                  // Re-generate with refinement context appended to the task
                                  if (!hasBuildPlanRefinementInput) return;
                                  const refinementParts = buildPlanRefinementQuestions
                                    .map((q, idx) => {
                                      const a = buildPlanRefinementAnswers[idx]?.trim();
                                      return a ? `Q: ${q}\nA: ${a}` : null;
                                    })
                                    .filter(Boolean)
                                    .join('\n\n');
                                  const extra = buildPlanAdditionalContext.trim();
                                  const refinementNote = [refinementParts, extra ? `Additional: ${extra}` : ''].filter(Boolean).join('\n\n');

                                  const guide = await generateSetupGuide({
                                    platform: platformLabel,
                                    system_prompt: result!.system_prompt,
                                    output_format: result!.output_format,
                                    task_description: `${taskDescription}\n\n[REFINEMENT CONTEXT]\n${refinementNote}`,
                                  });
                                  if (guide) {
                                    setSetupGuide(guide);
                                    setBuildPlanRefinementAnswers({});
                                    setBuildPlanAdditionalContext('');
                                    setBuildPlanRefineExpanded(false);
                                    setBuildPlanSaved(false);
                                    setBuildPlanCopied(false);
                                  }
                                }}
                                primary
                                disabled={!hasBuildPlanRefinementInput || setupLoading}
                                iconAfter={setupLoading ? (
                                  <div style={{
                                    width: 13, height: 13, border: '2px solid #FFFFFF40',
                                    borderTopColor: '#FFFFFF', borderRadius: '50%',
                                    animation: 'ppSpin 0.6s linear infinite',
                                  }} />
                                ) : (
                                  <ArrowRight size={13} />
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* §2.7 Bottom Navigation Row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap',
                    }}>
                      <ActionBtn
                        icon={<ArrowLeft size={14} />}
                        label="Back to Step 3"
                        onClick={() => {
                          setSetupGuide(null);
                          setBuildPlanVisibleBlocks(0);
                          setBuildPlanViewMode('cards');
                          setBuildPlanSaved(false);
                          setBuildPlanCopied(false);
                          setExpandedBuildSteps(new Set());
                          setBuildPlanRefineExpanded(false);
                          setBuildPlanRefinementAnswers({});
                          setBuildPlanAdditionalContext('');
                          setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                        }}
                      />
                      <ActionBtn
                        icon={<RotateCcw size={14} />}
                        label="Start Over"
                        onClick={handleReset}
                      />
                    </div>
                  </>
                );
              })()}
        </StepCard>
      </div>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
          fontFamily: FONT,
          animation: 'ppFadeIn 0.2s ease both',
        }}>
          {toastMessage} ✓
        </div>
      )}
    </div>
  );
};

/* ─── Output Section Card (collapsible per §4.7) ─── */
const OutputSection: React.FC<{
  section: typeof DESIGN_SECTIONS[number];
  index: number;
  visible: boolean;
  copiedSection: string | null;
  onCopy: (key: string, label: string, content: string) => void;
  copyContent: string;
  expanded: boolean;
  onToggle: () => void;
  summary?: string;
  children: React.ReactNode;
}> = ({ section, index, visible, copiedSection, onCopy, copyContent, expanded, onToggle, summary, children }) => {
  const isSectionCopied = copiedSection === section.key;
  return (
    <div style={{
      borderLeft: `4px solid ${section.color}`,
      background: `${section.color}08`,
      borderRadius: 10, padding: '18px 20px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {/* Header row — clickable to expand/collapse */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>{section.icon}</span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#1A202C',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          fontFamily: "'DM Sans', sans-serif", flex: 1,
        }}>
          {section.label}
        </span>
        <span style={{ fontSize: 11, color: '#A0AEC0' }}>
          {index + 1}/4
        </span>
        <span
          onClick={e => { e.stopPropagation(); onCopy(section.key, section.label, copyContent); }}
          style={{
            color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, padding: '2px 6px', flexShrink: 0,
          }}
        >
          {isSectionCopied ? <Check size={11} /> : <Copy size={11} />}
          {isSectionCopied ? 'Copied' : 'Copy'}
        </span>
        <ChevronDown size={14} color="#A0AEC0" style={{
          flexShrink: 0,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }} />
      </button>

      {/* Summary — shown when collapsed */}
      {!expanded && summary && (
        <div style={{
          fontSize: 13, color: '#718096', lineHeight: 1.5,
          fontFamily: "'DM Sans', sans-serif", marginTop: 6,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          {summary}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EDF2F7', animation: 'ppSlideDown 0.2s ease both' }}>
          {children}
        </div>
      )}
    </div>
  );
};

/* ── Step Card wrapper ── */
const StepCard: React.FC<{
  stepNumber: number;
  title: string;
  subtitle: string;
  done: boolean;
  collapsed: boolean;
  locked?: boolean;
  lockedMessage?: string;
  children: React.ReactNode;
}> = ({ stepNumber, title, subtitle, done, collapsed, locked, lockedMessage, children }) => (
  <div style={{
    background: locked ? '#FAFBFC' : '#FFFFFF', borderRadius: 16,
    border: `1px solid ${done ? `${LEVEL_ACCENT}88` : '#E2E8F0'}`,
    padding: (collapsed || locked) ? '16px 24px' : '24px 28px',
    transition: 'padding 0.2s ease, border-color 0.2s ease',
    opacity: locked ? 0.7 : 1,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: (collapsed || locked) ? 0 : 20,
    }}>
      <StepBadge number={stepNumber} done={done} locked={locked} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C' }}>{title}</div>
        {locked && lockedMessage && (
          <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: FONT }}>{lockedMessage}</div>
        )}
        {!collapsed && !locked && (
          <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {done && collapsed && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: LEVEL_ACCENT_DARK,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Check size={13} /> Done
        </div>
      )}
    </div>
    {!collapsed && !locked && children}
  </div>
);

/* ── Step badge circle — uses Level 2 accent color ── */
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

/* ── Step connector ── */
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

/* ── Tool Overview — standardised "How it works" strip ── */
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
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 2 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5 }}>
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
      }}>
        Outcome
      </div>
      <div style={{ fontSize: 12, color: '#2F855A', lineHeight: 1.5 }}>
        {outcome}
      </div>
    </div>
  </div>
);

/* ── Toggle Button (Cards / Markdown) ── */
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
    }}
  >
    {icon} {label}
  </button>
);

/* ── Info Tooltip ── */
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

/* ── Action Button ── */
const ActionBtn: React.FC<{
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  iconAfter?: React.ReactNode;
}> = ({ icon, label, onClick, primary, disabled, iconAfter }) => {
  const bg = primary ? '#38B2AC' : '#FFFFFF';
  const color = primary ? '#FFFFFF' : '#4A5568';
  const border = primary ? 'none' : '1px solid #E2E8F0';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: disabled ? '#E2E8F0' : bg,
        color: disabled ? '#A0AEC0' : color,
        border,
        borderRadius: 24,
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {icon} {label} {iconAfter}
    </button>
  );
};

/* ── Processing Progress Indicator (per PRD §9.5) ── */
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
      background: '#FFFFFF',
      borderRadius: 14,
      border: '1px solid #E2E8F0',
      padding: '28px 32px',
    }}>
      <div style={{
        fontSize: 15, fontWeight: 700, color: '#1A202C',
        marginBottom: 4, fontFamily: FONT,
      }}>
        {header}
      </div>
      <div style={{
        fontSize: 12, color: '#A0AEC0',
        marginBottom: 24, fontFamily: FONT,
      }}>
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

export default AppAgentBuilder;
