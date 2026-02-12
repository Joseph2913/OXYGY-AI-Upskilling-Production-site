import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Bot, MessageSquare, Eye, Code, Copy, Check,
  ChevronDown, ChevronUp, Info, Square, CheckSquare,
} from 'lucide-react';
import { useAgentDesignApi } from '../hooks/useAgentDesignApi';
import {
  GOOD_EXAMPLES, NOT_RECOMMENDED_EXAMPLES, CRITERIA_LABELS,
  WHY_JSON_CONTENT, PROMPT_SECTION_COLORS,
} from '../data/agent-builder-content';
import type { AgentDesignResult, AgentReadinessCriteria } from '../types';
import { ArtifactClosing } from './ArtifactClosing';

/* ─── HELPERS ─── */

function getScoreColor(score: number) {
  if (score >= 80) return '#38B2AC';
  if (score >= 50) return '#C4A934';
  return '#E57A5A';
}

function getVerdictText(score: number) {
  if (score >= 80) return 'Strong candidate for a Level 2 agent';
  if (score >= 50) return 'Could benefit from an agent \u2014 with some caveats';
  return 'Better suited to ad-hoc prompting for now';
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'critical': return { bg: '#FFF5F5', color: '#C53030', border: '#FC8181' };
    case 'important': return { bg: '#FFFFF0', color: '#B7791F', border: '#F6E05E' };
    default: return { bg: '#E6FFFA', color: '#2C7A7B', border: '#81E6D9' };
  }
}

/** Parse the system prompt's [SECTION] markers into color-coded spans */
function renderColorCodedPrompt(prompt: string) {
  const parts: React.ReactNode[] = [];
  let key = 0;

  const markerRegex = /\[(ROLE|CONTEXT|TASK|OUTPUT FORMAT|STEPS|QUALITY CHECKS)\]/g;
  const matches = [...prompt.matchAll(markerRegex)];

  if (matches.length === 0) {
    return <span>{prompt}</span>;
  }

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
        <span key={key++} style={{ backgroundColor: colors.bg, borderRadius: '4px', padding: '2px 0' }}>
          <span style={{
            display: 'inline-block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
            padding: '1px 6px', borderRadius: '4px', marginRight: '4px',
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
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
    }
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
  if (lastIndex < line.length) {
    parts.push(<span key={key++}>{line.slice(lastIndex)}</span>);
  }
  return <>{parts}</>;
}

/* ─── SCORE CIRCLE ─── */

function ScoreCircle({ score, animated }: { score: number; animated: boolean }) {
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
    <div className="flex flex-col items-center gap-3">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Agent readiness score: ${score} percent`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: '36px', fontWeight: 700, fill: '#1A202C', fontFamily: '"DM Sans", sans-serif' }}>
          {displayScore}%
        </text>
      </svg>
      <p className="text-[16px] font-semibold" style={{ color }}>{getVerdictText(score)}</p>
    </div>
  );
}

/* ─── SKELETONS ─── */

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-[#F7FAFC] rounded-lg animate-skeleton ${className}`} />;
}

function StepOneSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center"><SkeletonBlock className="w-[120px] h-[120px] rounded-full" /></div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBlock className="w-24 h-4" />
          <SkeletonBlock className="flex-1 h-4" />
          <SkeletonBlock className="w-[120px] h-[6px]" />
        </div>
      ))}
    </div>
  );
}

function StepTwoSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SkeletonBlock className="h-[300px]" />
      <SkeletonBlock className="h-[300px]" />
    </div>
  );
}

function StepThreeSkeleton() {
  return <SkeletonBlock className="h-[200px]" />;
}

function StepFourSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i}><SkeletonBlock className="h-[160px]" /></div>
      ))}
    </div>
  );
}

/* ─── STEP CARD DEFINITIONS ─── */

const STEP_CARDS = [
  {
    num: 1, icon: '\u{1F50D}', title: 'Agent Readiness',
    shortDesc: 'Is this task a good fit for a Level 2 agent?',
    education: {
      heading: 'Why does readiness matter?',
      body: 'Not every task needs a custom Level 2 agent. This step evaluates your task across five dimensions — frequency, consistency, shareability, complexity, and standardization risk — to determine whether building a reusable agent is the right investment, or if ad-hoc prompting (Level 1) is sufficient.',
      keyPoint: 'A strong score means the task is repeated often enough, structured enough, and shared widely enough to justify the upfront effort of agent design.',
    },
  },
  {
    num: 2, icon: '\u{1F4D0}', title: 'Output Format',
    shortDesc: 'Define the structured format your Level 2 agent produces.',
    education: {
      heading: 'Why does output format matter?',
      body: 'The difference between Level 1 prompting and a Level 2 agent is structure. By defining an explicit output format (both human-readable and JSON), your agent produces identical results every time — enabling dashboards, reports, and automated workflows downstream.',
      keyPoint: 'JSON templates turn variable AI outputs into reliable, machine-readable data that your team can build on.',
    },
  },
  {
    num: 3, icon: '\u{1F4DD}', title: 'System Prompt',
    shortDesc: 'Get a complete, ready-to-use prompt for your Level 2 agent.',
    education: {
      heading: 'Why does the system prompt matter?',
      body: 'A system prompt is the instruction set that defines how your Level 2 agent behaves. It incorporates the Prompt Blueprint framework from Level 1 — Role, Context, Task, Format, Steps, and Quality Checks — into a single, comprehensive prompt ready for any AI platform.',
      keyPoint: 'A well-crafted system prompt is what transforms a generic AI chatbot into a purpose-built Level 2 agent for your specific task.',
    },
  },
  {
    num: 4, icon: '\u{2705}', title: 'Built-In Accountability',
    shortDesc: 'How your Level 2 agent is designed to support human oversight.',
    education: {
      heading: 'How does a Level 2 agent support human oversight?',
      body: 'The goal isn\'t just to remind people to "check the output" — that\'s a given. The real question is: how is the agent itself designed to make that review easy and effective? A well-built Level 2 agent cites specific sources (row numbers, timestamps, page references), provides confidence scores, explains its reasoning, and flags areas of uncertainty — so the human reviewer can verify quickly rather than starting from scratch.',
      keyPoint: 'Built-in accountability means the agent does the heavy lifting of transparency: citing sources, showing its rationale, and surfacing what it\'s unsure about — so reviewers can focus on judgment, not detective work.',
    },
  },
];

const STEP_SKELETONS = [StepOneSkeleton, StepTwoSkeleton, StepThreeSkeleton, StepFourSkeleton];

/* ─── MAIN COMPONENT ─── */

export const AgentBuilder: React.FC = () => {
  // Input state
  const [taskDescription, setTaskDescription] = useState('');
  const [inputDataDescription, setInputDataDescription] = useState('');
  const [flashTask, setFlashTask] = useState(false);
  const [flashData, setFlashData] = useState(false);

  // Result state
  const [result, setResult] = useState<AgentDesignResult | null>(null);
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(false);

  // Accordion state
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  // UI state
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [showJsonTooltip, setShowJsonTooltip] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Accountability checkbox state
  const [selectedChecks, setSelectedChecks] = useState<Record<number, boolean>>({});

  // Refs
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // API
  const { designAgent, isLoading, error, clearError } = useAgentDesignApi();

  // ─── Staggered step reveal ───
  useEffect(() => {
    if (!result || stepsRevealed >= 4) return;
    const timer = setTimeout(() => {
      setStepsRevealed(prev => prev + 1);
      if (stepsRevealed === 0) setScoreAnimated(true);
    }, stepsRevealed === 0 ? 200 : 300);
    return () => clearTimeout(timer);
  }, [result, stepsRevealed]);

  // ─── Init all checks as selected when result arrives ───
  useEffect(() => {
    if (result && result.accountability) {
      const initial: Record<number, boolean> = {};
      result.accountability.forEach((_, idx) => { initial[idx] = true; });
      setSelectedChecks(initial);
    }
  }, [result]);

  // ─── Handlers ───
  const handleExampleClick = (task: string, inputData: string) => {
    setTaskDescription(task);
    setInputDataDescription(inputData);
    setFlashTask(true);
    setFlashData(true);
    setTimeout(() => { setFlashTask(false); setFlashData(false); }, 300);
  };

  const handleDesign = async () => {
    if (!taskDescription.trim()) return;
    clearError();
    setResult(null);
    setStepsRevealed(0);
    setScoreAnimated(false);
    setPromptExpanded(false);
    setSelectedChecks({});

    // Expand all cards to show skeletons
    setExpandedSteps({ 0: true, 1: true, 2: true, 3: true });
    setTimeout(() => {
      cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const data = await designAgent({
      task_description: taskDescription.trim(),
      input_data_description: inputDataDescription.trim() || 'Not specified',
    });

    if (data) {
      setResult(data);
    }
  };

  const handleStartOver = () => {
    setTaskDescription('');
    setInputDataDescription('');
    setResult(null);
    setStepsRevealed(0);
    setScoreAnimated(false);
    setPromptExpanded(false);
    setCopiedItems({});
    setSelectedChecks({});
    setExpandedSteps({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardToggle = (idx: number) => {
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const scrollToCards = () => {
    setExpandedSteps(prev => ({ ...prev, 0: true }));
    setTimeout(() => {
      cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleCheck = (idx: number) => {
    setSelectedChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyToClipboard = useCallback((text: string, label: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItems(prev => ({ ...prev, [id]: true }));
      setToastMessage(label);
      setShowToast(true);
      setTimeout(() => setCopiedItems(prev => ({ ...prev, [id]: false })), 2000);
      setTimeout(() => setShowToast(false), 2500);
    });
  }, []);

  const scrollToInput = () => {
    inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const buildSelectedChecksText = (): string => {
    if (!result) return '';
    return result.accountability
      .filter((_, idx) => selectedChecks[idx])
      .map(c => `## ${c.name} [${c.severity.toUpperCase()}]\n${c.prompt_instruction}`)
      .join('\n\n');
  };

  const buildFullPromptWithChecks = (): string => {
    if (!result) return '';
    const selectedInstructions = result.accountability
      .filter((_, idx) => selectedChecks[idx])
      .map(c => c.prompt_instruction)
      .join('\n\n');
    return result.system_prompt + '\n\n--- BUILT-IN ACCOUNTABILITY FEATURES ---\n\n' + selectedInstructions;
  };

  const selectedCount = Object.values(selectedChecks).filter(Boolean).length;

  // Close JSON tooltip on outside click
  useEffect(() => {
    if (!showJsonTooltip) return;
    const handleClick = () => setShowJsonTooltip(false);
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowJsonTooltip(false); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('click', handleClick); document.removeEventListener('keydown', handleEsc); };
  }, [showJsonTooltip]);

  /* ─── STEP CONTENT RENDERERS ─── */

  const renderStep1Content = () => (
    <>
      <div className="mb-8">
        <ScoreCircle score={result!.readiness.overall_score} animated={scoreAnimated} />
      </div>
      <div className="mb-8">
        {(Object.entries(result!.readiness.criteria) as [string, AgentReadinessCriteria][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-4 py-3 border-b border-[#F7FAFC] last:border-b-0">
            <div className="w-[140px] shrink-0">
              <p className="text-[14px] font-bold text-[#1A202C]">{CRITERIA_LABELS[key]?.label || key}</p>
            </div>
            <p className="flex-1 text-[14px] text-[#4A5568]">{val.assessment}</p>
            <div className="w-[120px] shrink-0">
              <div className="h-[6px] rounded-full bg-[#E2E8F0] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val.score}%`, backgroundColor: '#38B2AC' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#F7FAFC] rounded-lg p-4 border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-[#A0AEC0]" />
            <h4 className="text-[14px] font-semibold text-[#1A202C]">Level 1: Ad-Hoc Prompting</h4>
          </div>
          <ul className="space-y-2">
            {result!.readiness.level1_points.map((point, i) => (
              <li key={i} className="text-[13px] text-[#4A5568] leading-[1.6] flex gap-2">
                <span className="text-[#A0AEC0] shrink-0">&bull;</span>{point}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#F7FAFC] rounded-lg p-4"
          style={{ border: result!.readiness.overall_score >= 50 ? '2px solid #5B6DC2' : '1px solid #E2E8F0' }}
        >
          {result!.readiness.overall_score >= 50 && (
            <span className="inline-block text-[11px] font-semibold text-white bg-[#5B6DC2] rounded-[10px] px-2 py-0.5 mb-2">Recommended</span>
          )}
          <div className="flex items-center gap-2 mb-3">
            <Bot size={18} className="text-[#5B6DC2]" />
            <h4 className="text-[14px] font-semibold text-[#1A202C]">Level 2 Agent</h4>
          </div>
          <ul className="space-y-2">
            {result!.readiness.level2_points.map((point, i) => (
              <li key={i} className="text-[13px] text-[#4A5568] leading-[1.6] flex gap-2">
                <span className="text-[#5B6DC2] shrink-0">&bull;</span>{point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  const renderStep2Content = () => (
    <>
      <div className="rounded-lg p-4 sm:p-5 mb-6" style={{ background: 'rgba(195, 208, 245, 0.2)', border: '1px solid #C3D0F5', borderLeft: '4px solid #5B6DC2' }}>
        <p className="text-[14px] font-semibold text-[#1A202C] mb-1">{'\uD83D\uDD17'} Build once, share across the team</p>
        <p className="text-[13px] text-[#4A5568] leading-[1.6]">Standardized output formats mean no one has to guess what the agent will produce — it works the same way for everyone.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-[#718096]" />
            <span className="text-[13px] font-semibold text-[#1A202C]">What your team sees</span>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 overflow-y-auto" style={{ maxHeight: '400px' }}>
            {result!.output_format.human_readable.split('\n').map((line, i) => {
              if (!line.trim()) return <div key={i} className="h-3" />;
              if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ') || /^[A-Z][A-Z\s&:]+$/.test(line.trim())) {
                return <p key={i} className="text-[14px] font-semibold text-[#1A202C] mt-3 first:mt-0 mb-1">{line.replace(/^#+\s*/, '')}</p>;
              }
              if (line.trim().startsWith('- ') || line.trim().startsWith('\u2022 ')) {
                return <p key={i} className="text-[13px] text-[#4A5568] leading-[1.6] pl-4">&bull; {line.replace(/^\s*[-\u2022]\s*/, '')}</p>;
              }
              return <p key={i} className="text-[13px] text-[#4A5568] leading-[1.6]">{line}</p>;
            })}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2 relative">
            <Code size={16} className="text-[#718096]" />
            <span className="text-[13px] font-semibold text-[#1A202C]">The JSON template</span>
            <button onClick={e => { e.stopPropagation(); setShowJsonTooltip(!showJsonTooltip); }}
              className="text-[11px] font-semibold text-[#718096] hover:text-[#5B6DC2] bg-[#F7FAFC] border border-[#E2E8F0] rounded px-1.5 py-0.5 transition-colors"
            >Why JSON?</button>
            {showJsonTooltip && (
              <div className="absolute top-full left-0 mt-1 z-40 bg-[#1A202C] text-white rounded-lg p-4 sm:p-5 max-w-[320px] animate-fade-in"
                onClick={e => e.stopPropagation()}>
                <p className="text-[13px] leading-[1.6] whitespace-pre-line">{WHY_JSON_CONTENT}</p>
              </div>
            )}
          </div>
          <div className="relative bg-[#1A202C] rounded-[10px] p-5 overflow-y-auto" style={{ maxHeight: '400px', fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace' }}>
            <button
              onClick={() => copyToClipboard(JSON.stringify(result!.output_format.json_template, null, 2), 'JSON template copied to clipboard', 'json')}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {copiedItems['json'] ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
            <pre className="text-[13px] leading-[1.6] overflow-x-auto">
              {JSON.stringify(result!.output_format.json_template, null, 2).split('\n').map((line, i) => (
                <div key={i}>{renderJSONLine(line)}</div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </>
  );

  const renderStep3Content = () => (
    <>
      <p className="text-[13px] text-[#718096] mb-5">
        {'\uD83D\uDD17'} This prompt follows the Prompt Blueprint framework from Level 1.{' '}
        <a href="#playground" className="text-[#5B6DC2] hover:underline inline-flex items-center gap-1">
          Visit the Prompt Engineering Playground <ArrowRight size={12} />
        </a>
      </p>
      <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[14px] text-[#1A202C] font-medium">
            <span>{'\uD83D\uDCCB'}</span> Your system prompt is ready
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => copyToClipboard(result!.system_prompt, 'System prompt copied to clipboard', 'system-prompt')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#5B6DC2] hover:bg-[#4A5AB0] transition-colors"
            >
              {copiedItems['system-prompt'] ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy System Prompt</>}
            </button>
            <button onClick={() => setPromptExpanded(!promptExpanded)}
              className="flex items-center gap-1 text-[14px] text-[#718096] hover:text-[#5B6DC2] transition-colors"
              aria-expanded={promptExpanded}
            >
              {promptExpanded ? <><ChevronUp size={16} /> Hide</> : <><ChevronDown size={16} /> View Full Prompt</>}
            </button>
          </div>
        </div>
        <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: promptExpanded ? '500px' : '0' }}>
          <div className="mt-4 bg-white border border-[#E2E8F0] rounded-lg p-4 sm:p-5 overflow-y-auto" style={{ maxHeight: '460px' }}>
            <div className="text-[14px] text-[#2D3748] leading-[1.7] whitespace-pre-wrap">
              {renderColorCodedPrompt(result!.system_prompt)}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderStep4Content = () => (
    <>
      <div className="rounded-lg p-4 sm:p-5 mb-5" style={{ background: 'rgba(195, 208, 245, 0.15)', border: '1px solid #C3D0F5', borderLeft: '4px solid #5B6DC2' }}>
        <p className="text-[14px] font-semibold text-[#1A202C] mb-1">These aren't reminders to "check the output" — that's a given.</p>
        <p className="text-[13px] text-[#4A5568] leading-[1.6]">
          Each feature below is a design choice built into your agent's prompt — ensuring it cites sources, explains its reasoning, flags uncertainty, and provides the evidence trail your team needs to verify outputs quickly and confidently.
        </p>
      </div>
      <p className="text-[13px] text-[#718096] mb-5">
        {'\u2611'} All features included by default. Uncheck any you don't need in your agent's prompt.
      </p>
      <div className="space-y-3">
        {result!.accountability.map((check, idx) => {
          const severity = getSeverityStyle(check.severity);
          const isSelected = !!selectedChecks[idx];
          return (
            <div
              key={idx}
              className="bg-white border rounded-lg p-4 sm:p-5 relative transition-all duration-200"
              style={{
                borderLeft: `4px solid ${isSelected ? '#5B6DC2' : '#E2E8F0'}`,
                borderColor: isSelected ? '#E2E8F0' : '#E2E8F0',
                borderLeftColor: isSelected ? '#5B6DC2' : '#A0AEC0',
                opacity: isSelected ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleCheck(idx)} className="mt-0.5 shrink-0 transition-colors" aria-label={`${isSelected ? 'Deselect' : 'Select'} ${check.name}`}>
                    {isSelected ? (
                      <CheckSquare size={20} className="text-[#5B6DC2]" />
                    ) : (
                      <Square size={20} className="text-[#A0AEC0] hover:text-[#718096]" />
                    )}
                  </button>
                  <h4 className="text-[16px] font-bold text-[#1A202C]">{check.name}</h4>
                </div>
                <span className="text-[11px] font-semibold rounded-[10px] px-2 py-0.5 shrink-0 capitalize"
                  style={{ backgroundColor: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}>
                  {check.severity}
                </span>
              </div>
              <div className="pl-8">
                <p className="text-[12px] font-semibold text-[#A0AEC0] uppercase tracking-wide mt-3 mb-1">What the agent provides</p>
                <p className="text-[14px] text-[#4A5568] leading-[1.6]">{check.what_to_verify}</p>
                <p className="text-[12px] font-semibold text-[#A0AEC0] uppercase tracking-wide mt-3 mb-1">How this helps your review</p>
                <p className="text-[14px] text-[#4A5568] leading-[1.6]">{check.why_it_matters}</p>
                <p className="text-[12px] font-semibold text-[#A0AEC0] uppercase tracking-wide mt-3 mb-1">Prompt instruction</p>
                <div className="relative bg-[#F7FAFC] border border-[#E2E8F0] rounded-md px-3.5 py-2.5">
                  <p className="text-[13px] text-[#2D3748] leading-[1.6] pr-12"
                    style={{ fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace' }}>
                    {check.prompt_instruction}
                  </p>
                  <button onClick={() => copyToClipboard(check.prompt_instruction, `"${check.name}" instruction copied`, `check-${idx}`)}
                    className="absolute top-2 right-2 text-[12px] text-[#5B6DC2] hover:underline">
                    {copiedItems[`check-${idx}`] ? 'Copied \u2713' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <Check size={14} className="text-[#5B6DC2]" />
                  <span className="text-[12px] text-[#5B6DC2]">Built into your agent's system prompt (Step 3)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy options bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl">
        <p className="text-[13px] text-[#718096] shrink-0">
          {selectedCount} of {result!.accountability.length} features included
        </p>
        <div className="flex-1" />
        <button
          onClick={() => copyToClipboard(buildSelectedChecksText(), 'Selected accountability features copied to clipboard', 'selected-checks')}
          disabled={selectedCount === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold border border-[#1A202C] text-[#1A202C] hover:bg-[#EDF2F7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copiedItems['selected-checks'] ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Selected Features</>}
        </button>
        <button
          onClick={() => copyToClipboard(buildFullPromptWithChecks(), 'Full prompt with accountability features copied to clipboard', 'full-with-checks')}
          disabled={selectedCount === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white bg-[#5B6DC2] hover:bg-[#4A5AB0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copiedItems['full-with-checks'] ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Full Prompt + Features</>}
        </button>
      </div>
    </>
  );

  const STEP_RENDERERS = [renderStep1Content, renderStep2Content, renderStep3Content, renderStep4Content];

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* ─── BREADCRUMB ─── */}
        <a href="#home" className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] hover:text-[#5B6DC2] transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Level 2
        </a>

        {/* ─── HERO: Title (centered, matching L1 style) ─── */}
        <div className="mb-8 text-center">
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15] mb-6">
            Design Your Own
            <br />
            <span className="relative inline-block">
              Level 2 AI Agent
              <span className="absolute left-0 -bottom-1 w-full h-[4px] bg-[#5B6DC2] opacity-80 rounded-full" />
            </span>
          </h1>

          {/* ─── FUN FACT CARD ─── */}
          <div className="mb-4">
            <div
              className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(195, 208, 245, 0.15) 0%, rgba(91, 109, 194, 0.08) 50%, rgba(195, 208, 245, 0.12) 100%)',
                border: '1.5px solid #C3D0F5',
              }}
            >
              <div className="absolute top-3 left-4 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5B6DC2] opacity-40" />
                <span className="w-2 h-2 rounded-full bg-[#C3D0F5] opacity-60" />
                <span className="w-2 h-2 rounded-full bg-[#5B6DC2] opacity-30" />
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5B6DC2] mb-2">
                Did you know?
              </p>
              <p className="text-[17px] md:text-[19px] text-[#2D3748] leading-[1.6] font-medium mb-2">
                Teams that use standardized AI agents see up to <span className="text-[#5B6DC2] font-bold">3x faster adoption</span> across departments
                than those relying on ad-hoc prompts alone.
              </p>
              <p className="text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto">
                The difference between a one-off prompt and a Level 2 agent is the difference between a single answer and a reusable tool your entire team can rely on.
              </p>
            </div>
          </div>
        </div>

        {/* ─── 4-STEP OVERVIEW ─── */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STEP_CARDS.map((step) => (
              <div key={step.num} className="flex items-center gap-3 bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3.5">
                <div className="w-8 h-8 rounded-full bg-[#C3D0F5] flex items-center justify-center text-[14px] font-bold text-[#5B6DC2] shrink-0">
                  {step.num}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#1A202C] leading-tight">{step.icon} {step.title}</p>
                  <p className="text-[12px] text-[#718096] leading-snug mt-0.5">{step.shortDesc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={scrollToCards}
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#5B6DC2] hover:text-[#4A5AB0] transition-colors"
            >
              Learn more about each of these stages <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* ─── INPUT SECTION ─── */}
        <div
          ref={inputSectionRef}
          className="rounded-2xl p-6 sm:p-8 mb-8 scroll-mt-24"
          style={{
            background: 'linear-gradient(135deg, rgba(195, 208, 245, 0.12) 0%, rgba(195, 208, 245, 0.06) 100%)',
            border: '1.5px solid #C3D0F5',
          }}
        >
          <h2 className="text-[16px] font-bold text-[#1A202C] mb-4">
            Describe the task your Level 2 agent should handle
          </h2>

          {/* Example pills — single row, color-coded */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {GOOD_EXAMPLES.map((ex) => (
              <button key={ex.name} onClick={() => handleExampleClick(ex.task, ex.inputData)}
                className="px-3 py-1 rounded-full text-[13px] border border-[#A8F0E0] bg-[rgba(168,240,224,0.08)] text-[#2C7A7B] hover:border-[#38B2AC] hover:bg-[rgba(168,240,224,0.2)] transition-colors"
              >
                {ex.name}
              </button>
            ))}
            {NOT_RECOMMENDED_EXAMPLES.map((ex) => (
              <button key={ex.name} onClick={() => handleExampleClick(ex.task, ex.inputData)}
                className="px-3 py-1 rounded-full text-[13px] border border-[#FBCEB1] bg-[rgba(251,206,177,0.08)] text-[#B7791F] hover:border-[#E57A5A] hover:bg-[rgba(251,206,177,0.2)] transition-colors"
              >
                {ex.name}
              </button>
            ))}
          </div>

          {/* Input 1: Task Description */}
          <label className="block text-[13px] font-semibold text-[#1A202C] mb-1.5">
            What should this Level 2 agent do?
          </label>
          <textarea
            value={taskDescription} onChange={e => setTaskDescription(e.target.value)}
            placeholder="e.g., Analyze customer feedback surveys and identify the top themes, sentiment patterns, and actionable recommendations..."
            className="w-full rounded-xl border-2 border-[#C3D0F5] bg-white px-4 py-3.5 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] resize-none focus:outline-none focus:border-[#5B6DC2] focus:ring-[3px] focus:ring-[rgba(91,109,194,0.12)] transition-all"
            style={{
              minHeight: '100px', maxHeight: '160px',
              backgroundColor: flashTask ? 'rgba(195,208,245,0.2)' : '#FFFFFF',
              transition: 'background-color 0.3s, border-color 0.2s, box-shadow 0.2s',
            }}
          />

          {/* Input 2: Input Data */}
          <div className="mt-4">
            <label className="text-[13px] font-semibold text-[#1A202C] mb-1.5 flex items-center gap-2">
              What data will this Level 2 agent work with?
              <span className="text-[11px] font-semibold text-[#5B6DC2] bg-[rgba(195,208,245,0.3)] rounded-[10px] px-2 py-0.5">
                Recommended
              </span>
            </label>
            <textarea
              value={inputDataDescription} onChange={e => setInputDataDescription(e.target.value)}
              placeholder="e.g., Excel files containing survey responses with columns for respondent role, department, rating (1-5), and open-text feedback..."
              className="w-full rounded-xl border-2 border-[#C3D0F5] bg-white px-4 py-3.5 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] resize-none focus:outline-none focus:border-[#5B6DC2] focus:ring-[3px] focus:ring-[rgba(91,109,194,0.12)] transition-all mt-1.5"
              style={{
                minHeight: '72px', maxHeight: '120px',
                backgroundColor: flashData ? 'rgba(195,208,245,0.2)' : '#FFFFFF',
                transition: 'background-color 0.3s, border-color 0.2s, box-shadow 0.2s',
              }}
            />
          </div>

          {/* Callout + CTA button side by side */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1 bg-white border border-[#E2E8F0] border-l-[3px] border-l-[#5B6DC2] rounded-lg px-4 py-3">
              <p className="text-[13px] font-semibold text-[#1A202C] mb-0.5 flex items-center gap-1.5">
                <Info size={14} className="text-[#5B6DC2]" />
                Why does input data matter?
              </p>
              <p className="text-[12px] text-[#4A5568] leading-[1.5]">
                The type of data your Level 2 agent processes determines how its output is structured, what evidence it cites, and what human checks are needed.
              </p>
            </div>
            <button
              onClick={handleDesign}
              disabled={!taskDescription.trim() || isLoading}
              className="flex items-center justify-center gap-2 px-7 py-3 rounded-full text-[15px] font-semibold text-white transition-all shrink-0"
              style={{
                backgroundColor: '#5B6DC2',
                opacity: (!taskDescription.trim() || isLoading) ? 0.5 : 1,
                cursor: (!taskDescription.trim() || isLoading) ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (taskDescription.trim() && !isLoading) (e.target as HTMLElement).style.backgroundColor = '#4A5AB0'; }}
              onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = '#5B6DC2'}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Designing...
                </>
              ) : (
                <>Design My Level 2 Agent <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-[#FFF5F5] border border-[#FC8181] text-[#C53030] rounded-lg px-4 py-3 text-[14px]">
              {error}
            </div>
          )}
        </div>

        {/* ─── UNIFIED STEP CARDS (accordion) ─── */}
        <div ref={cardsRef} className="space-y-3 scroll-mt-24">
          {STEP_CARDS.map((step, idx) => {
            const isExpanded = !!expandedSteps[idx];
            const hasContent = stepsRevealed > idx && result !== null;
            const showSkeleton = isExpanded && stepsRevealed <= idx && (isLoading || result !== null);
            const showContent = isExpanded && hasContent;
            const showEducation = isExpanded && !hasContent && !showSkeleton;
            const StepSkeleton = STEP_SKELETONS[idx];

            const stepStatus: 'complete' | 'loading' | 'pending' =
              hasContent ? 'complete' :
              (isExpanded && (isLoading || result) && stepsRevealed <= idx) ? 'loading' :
              'pending';

            return (
              <div
                key={step.num}
                className="bg-white border rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  borderColor: isExpanded || stepStatus !== 'pending' ? '#C3D0F5' : '#E2E8F0',
                  borderLeftWidth: isExpanded || stepStatus !== 'pending' ? '4px' : '1px',
                  borderLeftColor: isExpanded || stepStatus !== 'pending' ? '#5B6DC2' : '#E2E8F0',
                }}
              >
                {/* ── Card Header (always clickable) ── */}
                <div
                  className="flex items-center gap-4 px-5 sm:px-6 py-4 select-none cursor-pointer hover:bg-[#FAFBFF] transition-colors"
                  onClick={() => handleCardToggle(idx)}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  {/* Step number / status circle */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: stepStatus === 'complete' ? '#5B6DC2' : stepStatus === 'loading' ? '#C3D0F5' : '#F7FAFC',
                      color: stepStatus === 'complete' ? '#FFFFFF' : stepStatus === 'loading' ? '#5B6DC2' : '#A0AEC0',
                      border: stepStatus === 'pending' ? '1px solid #E2E8F0' : 'none',
                    }}
                  >
                    {stepStatus === 'complete' ? <Check size={16} /> :
                     stepStatus === 'loading' ? <span className="w-3.5 h-3.5 border-2 border-[#5B6DC2] border-t-transparent rounded-full animate-spin" /> :
                     step.num}
                  </div>

                  {/* Title + short description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{step.icon}</span>
                      <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1A202C]">{step.title}</h3>
                    </div>
                    {!isExpanded && (
                      <p className="text-[13px] text-[#718096] mt-0.5 truncate">{step.shortDesc}</p>
                    )}
                  </div>

                  {/* Chevron (always visible) */}
                  <div className="shrink-0 text-[#A0AEC0]">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* ── Expandable Content ── */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-6 pt-1">
                      {showSkeleton && <StepSkeleton />}
                      {showContent && STEP_RENDERERS[idx]()}
                      {showEducation && (
                        <div className="rounded-xl p-5" style={{ background: 'rgba(195, 208, 245, 0.1)', border: '1px solid #E2E8F0' }}>
                          <h4 className="text-[15px] font-bold text-[#1A202C] mb-2">{step.education.heading}</h4>
                          <p className="text-[14px] text-[#4A5568] leading-[1.7] mb-3">{step.education.body}</p>
                          <div className="flex items-start gap-2 bg-white rounded-lg px-4 py-3 border border-[#C3D0F5]">
                            <span className="text-[#5B6DC2] text-[14px] mt-0.5 shrink-0">💡</span>
                            <p className="text-[13px] text-[#2D3748] leading-[1.6] font-medium">{step.education.keyPoint}</p>
                          </div>
                          <p className="text-[13px] text-[#718096] mt-3 italic">
                            Describe your task above and click "Design My Level 2 Agent" to see personalized results for this step.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── FINAL ACTION BAR ─── */}
        {stepsRevealed >= 4 && result && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 mb-4 animate-fade-in-up">
            <button onClick={handleStartOver}
              className="px-6 py-2.5 rounded-full text-[14px] font-semibold border border-[#1A202C] text-[#1A202C] hover:bg-[#F7FAFC] transition-colors">
              Start Over
            </button>
          </div>
        )}

        {/* ─── PAGE CLOSING ─── */}
        <ArtifactClosing
          summaryText="You've designed a reusable AI agent — from readiness assessment to system prompt to built-in accountability. Now see how to connect multiple agents into automated workflows."
          ctaLabel="Continue to Level 3: Systemic Integration"
          ctaHref="#workflow-designer"
          accentColor="#5B6DC2"
        />
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white text-[14px] px-5 py-2.5 rounded-lg shadow-lg z-50 animate-toast-enter whitespace-nowrap">
          {toastMessage} {'\u2713'}
        </div>
      )}
    </div>
  );
};
