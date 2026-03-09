import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, RotateCcw, Code, Library, Download,
  Info, ChevronRight, ChevronDown, ChevronUp, Sparkles, Eye, Square, CheckSquare,
} from 'lucide-react';
import {
  GOOD_EXAMPLES, NOT_RECOMMENDED_EXAMPLES, CRITERIA_LABELS,
  WHY_JSON_CONTENT, PROMPT_SECTION_COLORS,
} from '../../../data/agent-builder-content';
import { useAgentDesignApi } from '../../../hooks/useAgentDesignApi';
import type { AgentDesignResult, AgentReadinessCriteria, AccountabilityCheck } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';

const FONT = "'DM Sans', sans-serif";
const LEVEL_ACCENT = '#F7E8A4';
const LEVEL_ACCENT_DARK = '#8A6A00';

/* ─── Educational content for the 4 output sections ─── */
const DESIGN_SECTIONS = [
  {
    key: 'readiness',
    label: 'Readiness Score',
    icon: '🔍',
    color: '#38B2AC',
    why: 'Not every task needs a custom agent. This section evaluates your task across five dimensions — frequency, consistency, shareability, complexity, and standardization risk — to determine whether building a reusable agent is the right investment.',
    example: 'A task scored 85% overall: high frequency (weekly), strong consistency needs, and shared across 3 departments — making it a strong candidate for a Level 2 agent.',
  },
  {
    key: 'output_format',
    label: 'Output Format',
    icon: '📐',
    color: '#5B6DC2',
    why: 'The difference between Level 1 prompting and a Level 2 agent is structure. By defining an explicit output format (both human-readable and JSON), your agent produces identical results every time — enabling dashboards, reports, and automated workflows.',
    example: 'A JSON template with fields for summary, key_themes[], sentiment_scores{}, and recommendations[] — so every survey analysis follows the same structure.',
  },
  {
    key: 'system_prompt',
    label: 'System Prompt',
    icon: '📝',
    color: '#D69E2E',
    why: 'A system prompt is the instruction set that defines how your agent behaves. It incorporates the Prompt Blueprint framework from Level 1 — Role, Context, Task, Format, Steps, and Quality Checks — into a single, comprehensive prompt ready for any AI platform.',
    example: '[ROLE] You are a survey analysis specialist... [TASK] Analyze the provided survey data to identify... [QUALITY CHECKS] Cross-reference themes against raw responses...',
  },
  {
    key: 'accountability',
    label: 'Built-In Accountability',
    icon: '✅',
    color: '#E53E3E',
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
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [selectedChecks, setSelectedChecks] = useState<Record<number, boolean>>({});
  const [showJsonTooltip, setShowJsonTooltip] = useState(false);

  // Refs
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  // API
  const { designAgent, isLoading, error, clearError } = useAgentDesignApi();

  // Staggered block appearance (4 sections)
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    setScoreAnimated(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 4; i++) {
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

  // Restore draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem('oxygy_agent-builder_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.result) setResult(parsed.result);
        if (parsed.taskDescription) setTaskDescription(parsed.taskDescription);
        if (parsed.inputDataDescription) setInputDataDescription(parsed.inputDataDescription);
        if (parsed.selectedChecks) setSelectedChecks(parsed.selectedChecks);
        localStorage.removeItem('oxygy_agent-builder_draft');
      }
    } catch {}
  }, []);

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
    setShowMarkdown(false);

    const data = await designAgent({
      task_description: taskDescription.trim(),
      input_data_description: inputDataDescription.trim() || 'Not specified',
    });

    if (data) {
      setResult(data);
      if (user) upsertToolUsed(user.id, 2);
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
    setShowMarkdown(false);
    clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  }, []);

  /** Build a single cohesive system prompt combining sections 2 (output format), 3 (system prompt), and 4 (accountability). */
  const buildFullSystemPrompt = (r: AgentDesignResult): string => {
    const selectedInstructions = r.accountability
      .filter((_, idx) => selectedChecks[idx])
      .map(c => c.prompt_instruction)
      .join('\n\n');

    return [
      r.system_prompt,
      ``,
      `--- OUTPUT FORMAT ---`,
      ``,
      `You must respond using the following JSON structure:`,
      ``,
      '```json',
      JSON.stringify(r.output_format.json_template, null, 2),
      '```',
      ``,
      `--- BUILT-IN ACCOUNTABILITY FEATURES ---`,
      ``,
      selectedInstructions,
    ].join('\n');
  };

  const handleCopyFull = async () => {
    if (!result) return;
    await copyToClipboard(buildFullSystemPrompt(result));
    setCopied(true); setToastMessage('Full system prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySection = async (key: string, label: string, content: string) => {
    await copyToClipboard(content);
    setCopiedSection(key); setToastMessage(`${label} copied`);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleDownload = () => {
    if (!result) return;
    const md = buildFullSystemPrompt(result);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'system-prompt.md'; a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Downloaded as system-prompt.md');
  };

  const handleSaveToLibrary = () => {
    if (!result || !user) return;
    const fullContent = buildFullSystemPrompt(result);
    const title = `Agent: ${taskDescription.slice(0, 50)}${taskDescription.length > 50 ? '...' : ''}`;
    dbSavePrompt(user.id, { level: 2, title, content: fullContent, source_tool: 'agent-builder' });
    setSavedToLibrary(true); setToastMessage('System prompt saved to your Prompt Library');
    setTimeout(() => setSavedToLibrary(false), 3000);
  };

  const toggleCheck = (idx: number) => {
    setSelectedChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Step indicators
  const step1Done = taskDescription.trim().length > 0 && result !== null;
  const step2Done = false; // Output step is never "done" in the collapsed sense

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
        ]}
        outcome="A complete agent design — readiness assessment, structured output format, production-ready system prompt, and built-in accountability features — ready to deploy in any AI platform."
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
                    fontSize: 13, color: '#2C7A7B', background: 'rgba(168,240,224,0.08)',
                    border: '1px solid #A8F0E0', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    textAlign: 'left', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.background = 'rgba(168,240,224,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#A8F0E0'; e.currentTarget.style.background = 'rgba(168,240,224,0.08)'; }}
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
                    textAlign: 'left', lineHeight: 1.4,
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
          subtitle={result
            ? 'Your agent has been designed across 4 sections. Review, copy, or save the complete design.'
            : "Here's what your agent design will include — each section addresses a critical aspect of agent design."}
          done={false}
          collapsed={false}
        >
          {!result ? (
            /* Educational preview or loading skeleton */
            isLoading ? (
              /* Loading skeleton */
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: LEVEL_ACCENT_DARK, marginBottom: 16 }}>
                  Designing your agent...
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {DESIGN_SECTIONS.map(block => (
                    <div key={block.key} style={{
                      height: 100, borderRadius: 10, borderLeft: `4px solid ${block.color}`,
                      background: '#F0F0F0', animation: 'ppPulse 1.5s ease-in-out infinite',
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              /* Educational default — 4-section preview */
              <div>
                <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, marginBottom: 16 }}>
                  Your output will be structured using the <strong style={{ color: '#1A202C' }}>4-part Agent Design Framework</strong> — a comprehensive approach that transforms any task into a production-ready AI agent. Complete Step 1 above and each section below will be filled with content tailored to your specific needs.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {DESIGN_SECTIONS.map((block, idx) => (
                    <div
                      key={block.key}
                      style={{
                        borderLeft: `4px solid ${block.color}`,
                        background: `${block.color}08`,
                        borderRadius: 10, padding: '16px 18px',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                      }}>
                        <span style={{ fontSize: 15 }}>{block.icon}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: '#1A202C',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {block.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#A0AEC0', marginLeft: 'auto' }}>
                          {idx + 1}/4
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 10 }}>
                        {block.why}
                      </div>
                      <div style={{
                        background: `${block.color}18`, borderRadius: 8,
                        padding: '10px 12px', borderLeft: `3px solid ${block.color}`,
                      }}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: '#A0AEC0',
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                        }}>
                          Example
                        </div>
                        <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontStyle: 'italic' }}>
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
                  {DESIGN_SECTIONS.map(block => (
                    <div key={block.key} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: '#718096',
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
              {/* View toggle + actions */}
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
                  <InfoTooltip text="Markdown preserves the structure (headings, bullets, formatting) when you paste your agent design into ChatGPT, Claude, or any AI tool — giving you better results than plain text." />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <ActionBtn
                    icon={copied ? <Check size={13} /> : <Copy size={13} />}
                    label={copied ? 'Copied!' : 'Copy Full System Prompt'}
                    onClick={handleCopyFull}
                    primary
                  />
                  <ActionBtn
                    icon={<Download size={13} />}
                    label="Download"
                    onClick={handleDownload}
                  />
                  {user && (
                    <ActionBtn
                      icon={savedToLibrary ? <Check size={13} /> : <Library size={13} />}
                      label={savedToLibrary ? 'Saved!' : 'Save to Prompt Library'}
                      onClick={handleSaveToLibrary}
                      disabled={savedToLibrary}
                      accent
                    />
                  )}
                </div>
              </div>

              {/* Markdown view — shows the cohesive system prompt */}
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
                    {buildFullSystemPrompt(result)}
                  </pre>
                </div>
              )}

              {/* Card view — 4 sections */}
              {!showMarkdown && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Section 1: Readiness Score */}
                  <OutputSection
                    section={DESIGN_SECTIONS[0]}
                    index={0}
                    visible={0 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label, content) => handleCopySection(key, label, content)}
                    copyContent={`Readiness Score: ${result.readiness.overall_score}%\nVerdict: ${result.readiness.verdict}\n\n${result.readiness.rationale}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <ScoreCircle score={result.readiness.overall_score} animated={scoreAnimated} />
                    </div>
                    {/* Criteria bars */}
                    <div style={{ marginBottom: 16 }}>
                      {(Object.entries(result.readiness.criteria) as [string, AgentReadinessCriteria][]).map(([key, val]) => (
                        <div key={key} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                          borderBottom: '1px solid #F7FAFC',
                        }}>
                          <div style={{ width: 120, flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#1A202C' }}>
                            {CRITERIA_LABELS[key]?.label || key}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, color: '#4A5568' }}>{val.assessment}</div>
                          <div style={{ width: 100, flexShrink: 0 }}>
                            <div style={{ height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 3,
                                width: `${val.score}%`, background: '#38B2AC',
                                transition: 'width 0.7s ease',
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Level 1 vs Level 2 comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#F7FAFC', borderRadius: 10, padding: 16, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>
                          Level 1: Ad-Hoc Prompting
                        </div>
                        {result.readiness.level1_points.map((point, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, display: 'flex', gap: 6, marginBottom: 4 }}>
                            <span style={{ color: '#A0AEC0', flexShrink: 0 }}>&bull;</span>{point}
                          </div>
                        ))}
                      </div>
                      <div style={{
                        background: '#F7FAFC', borderRadius: 10, padding: 16,
                        border: result.readiness.overall_score >= 50 ? '2px solid #5B6DC2' : '1px solid #E2E8F0',
                      }}>
                        {result.readiness.overall_score >= 50 && (
                          <span style={{
                            display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#FFFFFF',
                            background: '#5B6DC2', borderRadius: 10, padding: '2px 8px', marginBottom: 8,
                          }}>
                            Recommended
                          </span>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>
                          Level 2: Custom Agent
                        </div>
                        {result.readiness.level2_points.map((point, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, display: 'flex', gap: 6, marginBottom: 4 }}>
                            <span style={{ color: '#5B6DC2', flexShrink: 0 }}>&bull;</span>{point}
                          </div>
                        ))}
                      </div>
                    </div>
                  </OutputSection>

                  {/* Section 2: Output Format */}
                  <OutputSection
                    section={DESIGN_SECTIONS[1]}
                    index={1}
                    visible={1 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label, content) => handleCopySection(key, label, content)}
                    copyContent={JSON.stringify(result.output_format.json_template, null, 2)}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {/* Human-readable */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Eye size={14} color="#718096" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>What your team sees</span>
                        </div>
                        <div style={{
                          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
                          padding: 16, maxHeight: 320, overflowY: 'auto',
                        }}>
                          {result.output_format.human_readable.split('\n').map((line, i) => {
                            if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
                            if (line.startsWith('# ') || line.startsWith('## ') || /^[A-Z][A-Z\s&:]+$/.test(line.trim())) {
                              return <p key={i} style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginTop: 10, marginBottom: 4 }}>{line.replace(/^#+\s*/, '')}</p>;
                            }
                            if (line.trim().startsWith('- ') || line.trim().startsWith('\u2022 ')) {
                              return <p key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, paddingLeft: 12 }}>&bull; {line.replace(/^\s*[-\u2022]\s*/, '')}</p>;
                            }
                            return <p key={i} style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>{line}</p>;
                          })}
                        </div>
                      </div>
                      {/* JSON template */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative' }}>
                          <Code size={14} color="#718096" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>The JSON template</span>
                          <button
                            onClick={e => { e.stopPropagation(); setShowJsonTooltip(!showJsonTooltip); }}
                            style={{
                              fontSize: 11, fontWeight: 600, color: '#718096', background: '#F7FAFC',
                              border: '1px solid #E2E8F0', borderRadius: 4, padding: '2px 6px',
                              cursor: 'pointer', transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#5B6DC2')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
                          >
                            Why JSON?
                          </button>
                          {showJsonTooltip && (
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                position: 'absolute', top: 28, left: 0, zIndex: 40,
                                background: '#1A202C', color: '#E2E8F0', borderRadius: 10,
                                padding: '14px 16px', fontSize: 13, lineHeight: 1.6,
                                maxWidth: 320, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                whiteSpace: 'pre-line',
                              }}
                            >
                              {WHY_JSON_CONTENT}
                            </div>
                          )}
                        </div>
                        <div style={{
                          background: '#1A202C', borderRadius: 10,
                          padding: 16, maxHeight: 320, overflowY: 'auto',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}>
                          <pre style={{ fontSize: 12, lineHeight: 1.6, margin: 0, overflowX: 'auto' }}>
                            {JSON.stringify(result.output_format.json_template, null, 2).split('\n').map((line, i) => (
                              <div key={i}>{renderJSONLine(line)}</div>
                            ))}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </OutputSection>

                  {/* Section 3: System Prompt */}
                  <OutputSection
                    section={DESIGN_SECTIONS[2]}
                    index={2}
                    visible={2 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label, content) => handleCopySection(key, label, content)}
                    copyContent={result.system_prompt}
                  >
                    <div style={{
                      background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>
                          Your system prompt is ready
                        </div>
                        <button
                          onClick={() => setPromptExpanded(!promptExpanded)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, color: '#718096', background: 'none',
                            border: 'none', cursor: 'pointer', transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = LEVEL_ACCENT_DARK)}
                          onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
                        >
                          {promptExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View Full Prompt</>}
                        </button>
                      </div>
                      {promptExpanded && (
                        <div style={{
                          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8,
                          padding: 16, maxHeight: 400, overflowY: 'auto',
                        }}>
                          <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                            {renderColorCodedPrompt(result.system_prompt)}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 8, fontStyle: 'italic' }}>
                        This prompt follows the Prompt Blueprint framework from Level 1 — Role, Context, Task, Format, Steps, and Quality Checks.
                      </div>
                    </div>
                  </OutputSection>

                  {/* Section 4: Built-In Accountability */}
                  <OutputSection
                    section={DESIGN_SECTIONS[3]}
                    index={3}
                    visible={3 < visibleBlocks}
                    copiedSection={copiedSection}
                    onCopy={(key, label, content) => handleCopySection(key, label, content)}
                    copyContent={result.accountability.filter((_, idx) => selectedChecks[idx]).map(c => `${c.name} [${c.severity}]: ${c.prompt_instruction}`).join('\n\n')}
                  >
                    <div style={{ fontSize: 12, color: '#718096', marginBottom: 12 }}>
                      All features included by default. Uncheck any you don't need in your agent's prompt.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {result.accountability.map((check, idx) => {
                        const severity = getSeverityStyle(check.severity);
                        const isSelected = !!selectedChecks[idx];
                        return (
                          <div
                            key={idx}
                            style={{
                              background: '#FFFFFF', borderRadius: 10,
                              padding: '14px 16px', border: '1px solid #E2E8F0',
                              borderLeft: `4px solid ${isSelected ? '#5B6DC2' : '#A0AEC0'}`,
                              opacity: isSelected ? 1 : 0.6,
                              transition: 'opacity 0.2s, border-color 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <button
                                  onClick={() => toggleCheck(idx)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                                >
                                  {isSelected
                                    ? <CheckSquare size={18} color="#5B6DC2" />
                                    : <Square size={18} color="#A0AEC0" />
                                  }
                                </button>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{check.name}</span>
                              </div>
                              <span style={{
                                fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 8px',
                                background: severity.bg, color: severity.color, border: `1px solid ${severity.border}`,
                                textTransform: 'capitalize',
                              }}>
                                {check.severity}
                              </span>
                            </div>
                            <div style={{ paddingLeft: 26 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                                What the agent provides
                              </div>
                              <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8 }}>
                                {check.what_to_verify}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                                How this helps your review
                              </div>
                              <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 8 }}>
                                {check.why_it_matters}
                              </div>
                              <div style={{
                                background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                                padding: '8px 12px',
                              }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                                  Prompt instruction
                                </div>
                                <div style={{
                                  fontSize: 12, color: '#2D3748', lineHeight: 1.6,
                                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                }}>
                                  {check.prompt_instruction}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </OutputSection>
                </div>
              )}

              {/* Bottom row: Start Over + Save to Library */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginTop: 20,
              }}>
                <ActionBtn
                  icon={<RotateCcw size={13} />}
                  label="Start Over"
                  onClick={handleReset}
                />
                {user && (
                  <ActionBtn
                    icon={savedToLibrary ? <Check size={13} /> : <Library size={13} />}
                    label={savedToLibrary ? 'Saved!' : 'Save to Prompt Library'}
                    onClick={handleSaveToLibrary}
                    disabled={savedToLibrary}
                    accent
                  />
                )}
              </div>
            </>
          )}
        </StepCard>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
          padding: '10px 18px', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
          animation: 'ppFadeIn 0.15s ease both',
        }}>
          {toastMessage} ✓
        </div>
      )}
    </div>
  );
};

/* ─── Output Section Card ─── */
const OutputSection: React.FC<{
  section: typeof DESIGN_SECTIONS[number];
  index: number;
  visible: boolean;
  copiedSection: string | null;
  onCopy: (key: string, label: string, content: string) => void;
  copyContent: string;
  children: React.ReactNode;
}> = ({ section, index, visible, copiedSection, onCopy, copyContent, children }) => {
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>{section.icon}</span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#1A202C',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {section.label}
          </span>
          <span style={{ fontSize: 11, color: '#A0AEC0' }}>
            {index + 1}/4
          </span>
        </div>
        <button
          onClick={() => onCopy(section.key, section.label, copyContent)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: 3,
            padding: '2px 6px', borderRadius: 6, transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#38B2AC')}
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

/* ── Step Card wrapper ── */
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
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>{title}</div>
        {!collapsed && (
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
    {!collapsed && children}
  </div>
);

/* ── Step badge circle — uses Level 2 accent color ── */
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

/* ── Step Placeholder ── */
const StepPlaceholder: React.FC<{
  icon: React.ReactNode;
  message: string;
  detail: string;
}> = ({ icon, message, detail }) => (
  <div style={{
    background: '#F7FAFC', borderRadius: 12, border: '1px dashed #E2E8F0',
    padding: '24px 28px', textAlign: 'center',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: '#EDF2F7',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 10,
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#4A5568', marginBottom: 6 }}>
      {message}
    </div>
    <div style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
      {detail}
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
      }}
    >
      {icon} {label}
    </button>
  );
};

export default AppAgentBuilder;
