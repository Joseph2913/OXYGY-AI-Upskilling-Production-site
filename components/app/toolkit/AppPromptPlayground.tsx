import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowDown, Copy, Check, Download, RotateCcw,
  ChevronRight, ChevronDown, Library, Code, Eye, Info, X,
} from 'lucide-react';
import { usePlaygroundApi } from '../../../hooks/usePlaygroundApi';
import type { PlaygroundResult, PlaygroundStrategy } from '../../../types';
import {
  STRATEGY_DEFINITIONS, PLAYGROUND_EXAMPLE_CHIPS,
} from '../../../data/playground-content';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';
import OutputActionsPanel from '../workflow/OutputActionsPanel';
import NextStepBanner from './NextStepBanner';

const FONT = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

/* ── Level 1 accent colours ── */
const LEVEL_ACCENT = '#A8F0E0';
const LEVEL_ACCENT_DARK = '#1A6B5F';

/* ── Strategy accent colour — consistent LEVEL_ACCENT per toolkit standard §1.5 ── */
const STRATEGY_COLOR = LEVEL_ACCENT;

const DRAFT_KEY = 'oxygy_prompt_playground_draft';

/* ── Loading progress steps ── */
const INITIAL_LOADING_STEPS = [
  'Analysing your task…',
  'Selecting prompting strategies…',
  'Crafting your prompt…',
  'Applying quality checks…',
  'Preparing strategy breakdown…',
  'Generating refinement questions…',
  'Finalising output…',
];
const REFINE_LOADING_STEPS = [
  'Processing your additional context…',
  'Re-evaluating strategies…',
  'Weaving in new specifics…',
  'Refining prompt structure…',
  'Running quality checks…',
  'Generating deeper questions…',
  'Finalising refined output…',
];
// Front-loaded timing: early steps fast, later steps slower
// Last step = -1 (open-ended buffer — stays spinning until API returns)
const STEP_DELAYS = [800, 1500, 3000, 4000, 4500, 5000, -1];

const AppPromptPlayground: React.FC = () => {
  const { user } = useAuth();
  const { generate, isLoading, error, clearError } = usePlaygroundApi();

  /* ── State ── */
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null); // strategy ID whose excerpt to highlight
  const [validationError, setValidationError] = useState(false);
  const [textareaFlash, setTextareaFlash] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'markdown'>('cards');
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [hasTrackedUsage, setHasTrackedUsage] = useState(false);
  const [refinementAnswers, setRefinementAnswers] = useState<Record<number, string>>({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [refinementCount, setRefinementCount] = useState(0);
  const [refineExpanded, setRefineExpanded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRefineLoading, setIsRefineLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  /* ── Derived step state ── */
  const step1Done = result !== null || isLoading;
  const step2Done = false; // output step is never "done" per se

  /* ── Draft persistence ── */
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      setUserInput(draft);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (userInput.trim() && !result) {
      localStorage.setItem(DRAFT_KEY, userInput);
    }
  }, [userInput, result]);

  /* ── Loading step progression ── */
  useEffect(() => {
    if (!isLoading) {
      // When loading finishes, jump to last step briefly then reset
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

  /* ── Toast auto-dismiss ── */
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  /* ── Staggered block animation ── */
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    const totalSections = result.strategies_used.length + 1 + (result.refinement_questions?.length ? 1 : 0); // prompt + strategies + refinement card
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < totalSections; i++) {
      timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
  }, [result]);

  /* ── Auto-grow textarea ── */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
    if (validationError) setValidationError(false);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(300, Math.max(120, ta.scrollHeight)) + 'px';
  };

  /* ── Example chip click ── */
  const handleChipClick = (text: string) => {
    setUserInput(text);
    if (validationError) setValidationError(false);
    setTextareaFlash(true);
    setTimeout(() => setTextareaFlash(false), 300);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(300, Math.max(120, textareaRef.current.scrollHeight)) + 'px';
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (isLoading) return;
    if (!userInput.trim()) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    setIsRefineLoading(false);
    setRefineExpanded(false);
    const data = await generate(userInput);
    if (data) {
      setResult(data);
      localStorage.removeItem(DRAFT_KEY);
      // Track first usage
      if (!hasTrackedUsage && user) {
        upsertToolUsed(user.id, 1);
        setHasTrackedUsage(true);
      }
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  };

  /* ── Copy prompt ── */
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, []);

  const handleCopyPrompt = async () => {
    if (!result) return;
    await copyToClipboard(result.prompt);
    setCopied(true);
    setToastMessage('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Download as .md ── */
  const handleDownload = () => {
    if (!result) return;
    const date = new Date().toISOString().split('T')[0];
    const strategyNames = result.strategies_used.map(s => s.name).join(', ');
    const content = [
      '# Optimised Prompt',
      '',
      `> Generated by OXYGY Prompt Playground on ${date}`,
      `> Strategies used: ${strategyNames}`,
      '',
      '---',
      '',
      result.prompt,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oxygy-prompt-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Downloaded as .md');
  };

  /* ── Save to Prompt Library ── */
  const handleSaveToLibrary = async () => {
    if (!result || !user) return;
    const title = userInput.length > 60 ? userInput.slice(0, 60) + '…' : userInput;
    const saved = await dbSavePrompt(user.id, {
      level: 1,
      title,
      content: result.prompt,
      source_tool: 'prompt-playground',
    });
    if (saved) {
      setSavedToLibrary(true);
      setToastMessage('Saved to Prompt Library');
    }
  };

  /* ── Start Over ── */
  const handleStartOver = () => {
    setResult(null);
    setUserInput('');
    setExpandedCards(new Set());
    setActiveHighlight(null);
    setCopied(false);
    setSavedToLibrary(false);
    setViewMode('cards');
    setVisibleBlocks(0);
    setRefinementAnswers({});
    setAdditionalContext('');
    setRefinementCount(0);
    setRefineExpanded(false);
    clearError();
    localStorage.removeItem(DRAFT_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.style.height = '120px';
    }, 100);
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
      `[REFINEMENT]\n\nOriginal task: ${userInput}`,
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
    const enrichedInput = buildRefinementMessage();
    const data = await generate(enrichedInput);
    if (data) {
      setResult(data);
      setSavedToLibrary(false);
      setCopied(false);
      setRefinementAnswers({});
      setAdditionalContext('');
      setRefinementCount(c => c + 1);
      setExpandedCards(new Set());
      setActiveHighlight(null);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  };

  const hasRefinementInput = Object.values(refinementAnswers).some(a => (a as string).trim()) || additionalContext.trim();

  /* ── Find excerpt in prompt with fuzzy whitespace matching ── */
  const findExcerptRange = (prompt: string, excerpt: string): { start: number; end: number } | null => {
    // 1. Exact match
    const exactIdx = prompt.indexOf(excerpt);
    if (exactIdx !== -1) return { start: exactIdx, end: exactIdx + excerpt.length };

    // 2. Normalised whitespace match — collapse runs of whitespace in both strings
    const normalise = (s: string) => s.replace(/\s+/g, ' ').trim();
    const normExcerpt = normalise(excerpt);
    const normPrompt = normalise(prompt);
    const normIdx = normPrompt.indexOf(normExcerpt);
    if (normIdx !== -1) {
      // Map normalised index back to original prompt position
      let origStart = -1;
      let origEnd = -1;
      let normPos = 0;
      let origPos = 0;
      const normPromptChars = normPrompt;
      while (origPos <= prompt.length && normPos <= normPromptChars.length) {
        if (normPos === normIdx && origStart === -1) origStart = origPos;
        if (normPos === normIdx + normExcerpt.length && origEnd === -1) { origEnd = origPos; break; }
        if (origPos < prompt.length && /\s/.test(prompt[origPos])) {
          // Consume all whitespace in original
          while (origPos < prompt.length && /\s/.test(prompt[origPos])) origPos++;
          // Consume the single space in normalised (if present)
          if (normPos < normPromptChars.length && normPromptChars[normPos] === ' ') normPos++;
        } else {
          origPos++;
          normPos++;
        }
      }
      if (origStart !== -1 && origEnd !== -1) return { start: origStart, end: origEnd };
    }

    // 3. Case-insensitive match
    const lowerIdx = prompt.toLowerCase().indexOf(excerpt.toLowerCase());
    if (lowerIdx !== -1) return { start: lowerIdx, end: lowerIdx + excerpt.length };

    // 4. Try matching just the first ~60 characters (LLM may have truncated or extended)
    if (excerpt.length > 60) {
      const prefix = normalise(excerpt.slice(0, 60));
      const prefIdx = normPrompt.indexOf(prefix);
      if (prefIdx !== -1) {
        // Find the end of the sentence/paragraph from that point in the original
        let origStart2 = -1;
        let normPos2 = 0;
        let origPos2 = 0;
        while (origPos2 <= prompt.length && normPos2 <= normPrompt.length) {
          if (normPos2 === prefIdx && origStart2 === -1) { origStart2 = origPos2; break; }
          if (origPos2 < prompt.length && /\s/.test(prompt[origPos2])) {
            while (origPos2 < prompt.length && /\s/.test(prompt[origPos2])) origPos2++;
            if (normPos2 < normPrompt.length && normPrompt[normPos2] === ' ') normPos2++;
          } else {
            origPos2++;
            normPos2++;
          }
        }
        if (origStart2 !== -1) {
          // Extend to end of the paragraph or a reasonable chunk
          const endSearch = prompt.indexOf('\n\n', origStart2 + 20);
          const end = endSearch !== -1 ? endSearch : Math.min(origStart2 + excerpt.length + 50, prompt.length);
          return { start: origStart2, end };
        }
      }
    }

    return null;
  };

  /* ── Number badges (circled digits) for strategy ↔ excerpt linking ── */
  const BadgeCircle: React.FC<{ num: number; size?: number }> = ({ num, size = 18 }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: LEVEL_ACCENT_DARK, color: '#FFFFFF',
      fontSize: size * 0.55, fontWeight: 700, fontFamily: FONT,
      lineHeight: 1, flexShrink: 0, verticalAlign: 'middle',
    }}>
      {num}
    </span>
  );

  /* ── Render prompt with ALL excerpt badges inline ── */
  const renderHighlightedPrompt = (prompt: string): React.ReactNode => {
    if (!result) return prompt;

    // Collect all valid ranges with their strategy index
    const ranges: { start: number; end: number; idx: number }[] = [];
    result.strategies_used.forEach((s: PlaygroundStrategy, i: number) => {
      if (!s.prompt_excerpt) return;
      const range = findExcerptRange(prompt, s.prompt_excerpt);
      if (range) ranges.push({ ...range, idx: i });
    });

    if (ranges.length === 0) return prompt;

    // Sort by start position, deduplicate overlaps (keep first)
    ranges.sort((a, b) => a.start - b.start);
    const deduped: typeof ranges = [];
    for (const r of ranges) {
      if (deduped.length === 0 || r.start >= deduped[deduped.length - 1].end) {
        deduped.push(r);
      }
    }

    // Build React nodes with inline badges at each excerpt
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    deduped.forEach((r, i) => {
      if (r.start > cursor) parts.push(prompt.slice(cursor, r.start));
      const isActive = activeHighlight === result!.strategies_used[r.idx].id;
      parts.push(
        <span key={`badge-${i}`} style={{ position: 'relative' }}>
          <span style={{
            display: 'inline', marginRight: 3, verticalAlign: 'middle',
          }}>
            <BadgeCircle num={r.idx + 1} />
          </span>
          <span style={{
            background: isActive ? `${STRATEGY_COLOR}40` : `${STRATEGY_COLOR}18`,
            borderBottom: isActive ? `2px solid ${STRATEGY_COLOR}` : `1px dashed ${STRATEGY_COLOR}`,
            borderRadius: 3,
            padding: '1px 0',
            transition: 'background 0.3s',
          }}>
            {prompt.slice(r.start, r.end)}
          </span>
        </span>
      );
      cursor = r.end;
    });
    if (cursor < prompt.length) parts.push(prompt.slice(cursor));

    return <>{parts}</>;
  };

  /* ── Toggle strategy card ── */
  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setActiveHighlight(h => h === id ? null : h);
      } else {
        next.add(id);
        setActiveHighlight(id);
      }
      return next;
    });
  };

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
        fontFamily: FONT,
      }}>
        Prompt Playground
      </h1>
      <p style={{
        fontSize: 14, color: '#718096', lineHeight: 1.7,
        margin: 0, marginBottom: 20, fontFamily: FONT,
      }}>
        The quality of your AI output is directly determined by the quality of your prompt. Most people lose time going back and forth with vague instructions that produce generic results. The Prompt Playground analyses your task and selects from 8 proven prompting strategies to build a structured, optimised prompt — giving you clearer, more actionable AI responses on the first try.
      </p>

      {/* ═══ How It Works — Overview Strip ═══ */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Describe your task', detail: 'Tell us what you need the AI to help you with', done: step1Done },
          { number: 2, label: 'Your optimised prompt', detail: 'Review your prompt and the strategies behind it', done: step2Done },
        ]}
        outcome="A ready-to-use, strategy-optimised prompt tailored to your specific task — plus an explanation of which prompting strategies were applied and why."
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Describe your task                            */}
      {/* ════════════════════════════════════════════════════════ */}
      <StepCard
        stepNumber={1}
        title="Describe your task"
        subtitle="Tell us what you need the AI to help you with — the more specific, the better the prompt."
        done={step1Done}
        collapsed={step1Done}
      >
        {/* Example chips */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 8, fontFamily: FONT }}>Try an example:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLAYGROUND_EXAMPLE_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleChipClick(chip)}
                style={{
                  padding: '7px 14px', borderRadius: 10,
                  fontSize: 13, color: LEVEL_ACCENT_DARK,
                  background: `${LEVEL_ACCENT}12`,
                  border: `1px solid ${LEVEL_ACCENT}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  textAlign: 'left', lineHeight: 1.4, fontFamily: FONT,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK;
                  e.currentTarget.style.background = `${LEVEL_ACCENT}30`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = LEVEL_ACCENT;
                  e.currentTarget.style.background = `${LEVEL_ACCENT}12`;
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleTextareaChange}
            placeholder="e.g., I need to write a project status update for my leadership team, or Help me design a workshop for a sceptical audience, or Summarise a long research report into three key recommendations..."
            style={{
              width: '100%',
              minHeight: 120,
              maxHeight: 300,
              resize: 'none',
              overflow: 'auto',
              background: textareaFlash ? `${LEVEL_ACCENT}20` : '#FFFFFF',
              border: `1px solid ${validationError ? '#FC8181' : '#E2E8F0'}`,
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              color: '#1A202C',
              fontFamily: FONT,
              lineHeight: 1.6,
              outline: 'none',
              transition: 'border-color 0.15s, background 0.3s',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              if (!validationError) e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK;
            }}
            onBlur={e => {
              if (!validationError) e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          />
        </div>

        {/* Validation + char count */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, minHeight: 18,
        }}>
          <div>
            {validationError && (
              <span style={{ fontSize: 13, color: '#C53030', fontFamily: FONT }}>
                Please describe your task first
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#A0AEC0', fontFamily: FONT }}>
            {userInput.length} characters
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            background: isLoading ? '#A0AEC0' : '#38B2AC',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 24,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: FONT,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#2C9A94'; }}
          onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#38B2AC'; }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: 14, height: 14, border: '2px solid #FFFFFF40',
                borderTopColor: '#FFFFFF', borderRadius: '50%',
                animation: 'ppSpin 0.6s linear infinite',
              }} />
              Building your prompt…
            </>
          ) : (
            <>Build My Prompt</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#FFF5F5',
            border: '1px solid #FC8181',
            fontSize: 13,
            color: '#C53030',
            fontFamily: FONT,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
      </StepCard>

      {/* ── Connector ── */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Your optimised prompt                         */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={outputRef}>
        <StepCard
          stepNumber={2}
          title="Your optimised prompt"
          subtitle="Review your AI-ready prompt and the strategies that shaped it."
          done={false}
          collapsed={false}
          locked={!result && !isLoading}
          lockedMessage="Complete Step 1 to generate your optimised prompt"
        >
          {!result && !isLoading ? (
            /* ── Educational default ── */
            <div>
              <p style={{
                fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 16,
                fontFamily: FONT,
              }}>
                Your prompt will be built using a combination of <strong>8 proven prompting strategies</strong> — selected dynamically based on your specific task. Complete the step above and each section below will be filled with content tailored to your needs.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}>
                {STRATEGY_DEFINITIONS.map((strat, idx) => (
                  <div key={strat.id} style={{
                    borderLeft: `4px solid ${LEVEL_ACCENT}`,
                    background: `${LEVEL_ACCENT}08`,
                    borderRadius: 10,
                    padding: '16px 18px',
                    opacity: 1,
                    animation: 'ppFadeIn 0.3s ease both',
                    animationDelay: `${idx * 60}ms`,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 16 }}>{strat.icon}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#4A5568',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        fontFamily: FONT,
                      }}>
                        {strat.name}
                      </span>
                      <span style={{
                        fontSize: 11, color: '#A0AEC0', marginLeft: 'auto', fontFamily: FONT,
                      }}>
                        {idx + 1}/8
                      </span>
                    </div>
                    <div style={{
                      fontSize: 13, color: '#4A5568', lineHeight: 1.6, fontFamily: FONT,
                      marginBottom: 10,
                    }}>
                      {strat.definition}
                    </div>
                    <div style={{
                      background: `${LEVEL_ACCENT}18`,
                      borderLeft: `3px solid ${LEVEL_ACCENT}`,
                      borderRadius: 6,
                      padding: '8px 12px',
                    }}>
                      <div style={{
                        fontSize: 12, color: '#718096', lineHeight: 1.5,
                        fontStyle: 'italic', fontFamily: FONT,
                      }}>
                        Best for: {strat.whenToUse}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary footer */}
              <div style={{
                borderTop: '1px solid #EDF2F7',
                padding: '10px 0 0',
                marginTop: 16,
                display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              }}>
                {STRATEGY_DEFINITIONS.map(s => (
                  <span key={s.id} style={{
                    fontSize: 11, color: '#718096', fontFamily: FONT,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>{s.icon}</span> {s.name}
                  </span>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            /* ── Processing Progress Indicator ── */
            <ProcessingProgress
              steps={isRefineLoading ? REFINE_LOADING_STEPS : INITIAL_LOADING_STEPS}
              currentStep={loadingStep}
              header={isRefineLoading ? 'Refining your prompt…' : 'Building your prompt…'}
              subtext="This usually takes 15–20 seconds"
            />
          ) : result ? (
            /* ── Generated output ── */
            <div>
              {/* Next Step Banner (§4.8) */}
              <NextStepBanner
                accentColor={LEVEL_ACCENT}
                accentDark={LEVEL_ACCENT_DARK}
                text="Copy your prompt and test it in your AI tool of choice. Come back and refine it based on what you learn."
              />

              {/* Top action row — toggle + actions on one line */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 16, flexWrap: 'wrap',
              }}>
                {/* View toggle (left) */}
                <div style={{
                  display: 'inline-flex',
                  background: '#F7FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                }}>
                  <ToggleBtn
                    icon={<Eye size={13} />}
                    label="Cards"
                    active={viewMode === 'cards'}
                    onClick={() => setViewMode('cards')}
                  />
                  <ToggleBtn
                    icon={<Code size={13} />}
                    label="Markdown"
                    active={viewMode === 'markdown'}
                    onClick={() => setViewMode('markdown')}
                    highlight
                  />
                </div>
                <InfoTooltip text="Markdown view shows the cohesive prompt ready to paste directly into any AI tool. Cards view shows the prompt plus strategy explanations." />

                {/* Spacer pushes action buttons right */}
                <div style={{ flex: 1 }} />

                {/* Action buttons (right) */}
                <ActionBtn
                  icon={copied ? <Check size={13} /> : <Copy size={13} />}
                  label={copied ? 'Copied!' : 'Copy Optimised Prompt'}
                  onClick={handleCopyPrompt}
                  primary
                />
                <ActionBtn
                  icon={<Download size={13} />}
                  label="Download (.md)"
                  onClick={handleDownload}
                />
                <ActionBtn
                  icon={<Library size={13} />}
                  label="Save to Prompt Library"
                  onClick={handleSaveToLibrary}
                  accent
                  disabled={savedToLibrary}
                />
              </div>

              {/* ── Next Step Banner ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `${LEVEL_ACCENT}18`,
                border: `1px solid ${LEVEL_ACCENT}`,
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                opacity: visibleBlocks >= 1 ? 1 : 0,
                transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                  fontFamily: FONT, lineHeight: 1.4,
                }}>
                  Your prompt is ready — try it out
                </span>
                <span style={{
                  fontSize: 12, color: '#4A5568', fontFamily: FONT,
                  marginLeft: 4,
                }}>
                  Copy it and paste into any AI tool to see the difference a well-structured prompt makes.
                </span>
              </div>

              {viewMode === 'markdown' ? (
                /* ── Markdown view ── */
                <div style={{
                  background: '#1A202C',
                  borderRadius: 12,
                  padding: '22px 24px',
                  fontFamily: MONO,
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: '#E2E8F0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  opacity: visibleBlocks >= 1 ? 1 : 0,
                  transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.3s, transform 0.3s',
                }}>
                  {result.prompt}
                </div>
              ) : (
                /* ── Cards view ── */
                <div>
                  {/* Prompt card (full width) */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 16,
                    opacity: visibleBlocks >= 1 ? 1 : 0,
                    transform: visibleBlocks >= 1 ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: 12, fontFamily: FONT,
                    }}>
                      Your Prompt
                    </div>
                    <div style={{
                      fontSize: 14, color: '#2D3748', lineHeight: 1.75,
                      fontFamily: FONT, whiteSpace: 'pre-wrap',
                    }}>
                      {renderHighlightedPrompt(result.prompt)}
                    </div>
                  </div>

                  {/* Strategy cards heading */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: 10, fontFamily: FONT,
                  }}>
                    Strategies Applied ({result.strategies_used.length})
                  </div>

                  {/* Strategy cards — 2-col grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 16,
                  }}>
                    {result.strategies_used.map((strategy: PlaygroundStrategy, idx: number) => {
                      const isExpanded = expandedCards.has(strategy.id);
                      const accentColor = STRATEGY_COLOR;
                      const blockIdx = idx + 1; // offset by 1 for prompt block

                      return (
                        <div key={strategy.id} style={{
                          borderLeft: `4px solid ${accentColor}`,
                          background: `${accentColor}12`,
                          borderRadius: 10,
                          overflow: 'hidden',
                          opacity: visibleBlocks >= blockIdx + 1 ? 1 : 0,
                          transform: visibleBlocks >= blockIdx + 1 ? 'translateY(0)' : 'translateY(8px)',
                          transition: 'opacity 0.3s, transform 0.3s',
                        }}>
                          <button
                            onClick={() => toggleCard(strategy.id)}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              padding: '14px 16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              textAlign: 'left',
                              fontFamily: FONT,
                            }}
                          >
                            <span style={{ fontSize: 16, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>{strategy.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 700, color: '#1A202C',
                                fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6,
                              }}>
                                <BadgeCircle num={idx + 1} size={18} />
                                {strategy.name}
                              </div>
                              {strategy.how_applied && !isExpanded && (
                                <div style={{
                                  fontSize: 12, color: '#718096', lineHeight: 1.4,
                                  fontFamily: FONT, marginTop: 3,
                                  overflow: 'hidden', textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}>
                                  {strategy.how_applied}
                                </div>
                              )}
                            </div>
                            <ChevronDown
                              size={14}
                              color="#A0AEC0"
                              style={{
                                flexShrink: 0, alignSelf: 'flex-start', marginTop: 4,
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }}
                            />
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div style={{
                              padding: '0 16px 14px',
                              animation: 'ppSlideDown 0.2s ease both',
                            }}>
                              {/* How it was applied (specific to this prompt) */}
                              {strategy.how_applied && (
                                <div style={{
                                  marginBottom: 12,
                                  padding: '10px 14px',
                                  background: `${accentColor}15`,
                                  borderRadius: 8,
                                  borderLeft: `3px solid ${accentColor}`,
                                }}>
                                  <div style={{
                                    fontSize: 10, fontWeight: 600, color: LEVEL_ACCENT_DARK,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    marginBottom: 4, fontFamily: FONT,
                                  }}>
                                    How it was applied
                                  </div>
                                  <div style={{
                                    fontSize: 13, color: '#2D3748',
                                    lineHeight: 1.6, fontFamily: FONT,
                                  }}>
                                    {strategy.how_applied}
                                  </div>
                                </div>
                              )}

                              {/* Why this was chosen */}
                              <div style={{ marginBottom: 10 }}>
                                <div style={{
                                  fontSize: 10, fontWeight: 600, color: '#A0AEC0',
                                  textTransform: 'uppercase', letterSpacing: '0.05em',
                                  marginBottom: 4, fontFamily: FONT,
                                }}>
                                  Why this strategy was chosen
                                </div>
                                <div style={{
                                  fontSize: 13, color: '#4A5568',
                                  lineHeight: 1.6, fontFamily: FONT,
                                }}>
                                  {strategy.why}
                                </div>
                              </div>

                              {/* What this strategy does (general) */}
                              <div>
                                <div style={{
                                  fontSize: 10, fontWeight: 600, color: '#A0AEC0',
                                  textTransform: 'uppercase', letterSpacing: '0.05em',
                                  marginBottom: 4, fontFamily: FONT,
                                }}>
                                  What this strategy does
                                </div>
                                <div style={{
                                  fontSize: 13, color: '#718096',
                                  lineHeight: 1.6, fontFamily: FONT,
                                }}>
                                  {strategy.what}
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* ── Output Actions Panel (per PRD §4.2) ── */}
              <div style={{
                marginTop: 24,
                opacity: visibleBlocks >= (result.strategies_used.length + 1) ? 1 : 0,
                transform: visibleBlocks >= (result.strategies_used.length + 1) ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s, transform 0.3s',
              }}>
                <OutputActionsPanel
                  workflowName={`Prompt: ${userInput.slice(0, 50)}`}
                  fullMarkdown={result.prompt}
                  onSaveToArtefacts={handleSaveToLibrary}
                  isSaved={savedToLibrary}
                />
              </div>

              {/* ── Combined Caveat + Refinement Card (per PRD §4.5) ── */}
              {result.refinement_questions && result.refinement_questions.length > 0 && (() => {
                const refIdx = result.strategies_used.length + 2; // after prompt + all strategies + 1
                return (
                  <div style={{
                    background: '#FFFBF0',
                    borderRadius: 14,
                    border: '1px solid #F7E8A4',
                    borderLeft: '4px solid #F7E8A4',
                    padding: '20px 24px',
                    marginTop: 24,
                    opacity: visibleBlocks >= refIdx ? 1 : 0,
                    transform: visibleBlocks >= refIdx ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s, transform 0.3s',
                  }}>
                    {/* Practitioner caveat — always visible */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      marginBottom: refineExpanded ? 16 : 12,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✨</span>
                      <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, fontFamily: FONT }}>
                        This is an optimised starting point built for your context — not the only valid approach.
                        Adapt it, iterate on it, and make it yours. The strategies above are the craft behind it;
                        understanding them is more valuable than any individual prompt.
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
                        Sharpen this prompt — add more context
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
                              Refine Your Prompt
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
                          Answer any of these to add context and get a more targeted prompt. You don't need to answer all of them — even one helps.
                        </p>

                        {/* Questions */}
                        {result.refinement_questions.map((question, i) => (
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
                                boxSizing: 'border-box',
                                transition: 'border-color 0.15s',
                                background: '#FFFFFF',
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                            />
                          </div>
                        ))}

                        {/* Open-ended additional context */}
                        <div style={{ marginBottom: 18 }}>
                          <label style={{
                            display: 'block',
                            fontSize: 13, fontWeight: 600, color: '#2D3748',
                            marginBottom: 6, fontFamily: FONT,
                          }}>
                            Anything else to add?
                          </label>
                          <textarea
                            value={additionalContext}
                            onChange={e => setAdditionalContext(e.target.value)}
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
                              boxSizing: 'border-box',
                              transition: 'border-color 0.15s',
                              background: '#FFFFFF',
                              lineHeight: 1.5,
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = LEVEL_ACCENT_DARK)}
                            onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                          />
                        </div>

                        {/* Refine button */}
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
                          label={isLoading ? 'Refining…' : 'Refine Prompt'}
                          onClick={handleRefine}
                          primary
                          disabled={!hasRefinementInput || isLoading}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bottom navigation row (per PRD §4.2) */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 20,
                flexWrap: 'wrap',
              }}>
                <ActionBtn
                  icon={<RotateCcw size={13} />}
                  label="Start Over"
                  onClick={handleStartOver}
                />
              </div>
            </div>
          ) : null}
        </StepCard>
      </div>

      {/* ═══ Toast Notification ═══ */}
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

export default AppPromptPlayground;

/* ═══════════════════════════════════════════════════════════ */
/* Shared-style sub-components (per Toolkit Page Standard)    */
/* ═══════════════════════════════════════════════════════════ */

/* ── Processing Progress Indicator ── */
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
      {/* Header */}
      <div style={{
        fontSize: 15, fontWeight: 700, color: '#1A202C',
        marginBottom: 4, fontFamily: "'DM Sans', sans-serif",
      }}>
        {header}
      </div>
      <div style={{
        fontSize: 12, color: '#A0AEC0',
        marginBottom: 24, fontFamily: "'DM Sans', sans-serif",
      }}>
        {subtext}
      </div>

      {/* Step list */}
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
              {/* Step circle */}
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
                    border: `2px solid transparent`,
                    borderTopColor: LEVEL_ACCENT_DARK,
                    animation: 'ppSpin 0.7s linear infinite',
                    position: 'absolute', top: -2, left: -2,
                  }} />
                )}
              </div>

              {/* Step label */}
              <div style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isPending ? '#A0AEC0' : '#2D3748',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.2s, font-weight 0.2s',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
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
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {completedSteps} of {steps.length}
      </div>
    </div>
  );
};

/* ── Step Badge ── */
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

/* ── Step Card ── */
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
        <div style={{ fontSize: 16, fontWeight: 700, color: locked ? '#A0AEC0' : '#1A202C', fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </div>
        {locked && lockedMessage && (
          <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{lockedMessage}</div>
        )}
        {!collapsed && !locked && (
          <div style={{ fontSize: 13, color: '#718096', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
            {subtitle}
          </div>
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

/* ── Step Connector ── */
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

/* ── Tool Overview ── */
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
      fontFamily: "'DM Sans', sans-serif",
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
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>
                {step.label}
              </div>
              <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
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
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Outcome
      </div>
      <div style={{ fontSize: 12, color: '#2F855A', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
        {outcome}
      </div>
    </div>
  </div>
);

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
  const color = primary || accent ? '#FFFFFF' : '#4A5568';
  const border = primary || accent ? 'none' : '1px solid #E2E8F0';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: disabled ? '#E2E8F0' : bg,
        color: disabled ? '#A0AEC0' : color,
        border,
        borderRadius: 24,
        padding: '8px 16px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {icon}
      {label}
    </button>
  );
};

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
      padding: '6px 14px',
      fontSize: 12, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif",
      border: 'none',
      cursor: 'pointer',
      borderRadius: 8,
      background: active
        ? highlight ? '#2B6CB0' : '#1A202C'
        : 'transparent',
      color: active ? '#FFFFFF' : '#718096',
      transition: 'background 0.15s, color 0.15s',
    }}
  >
    {icon}
    {label}
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
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#F7FAFC', border: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'help', padding: 0,
        }}
      >
        <Info size={12} color="#A0AEC0" />
      </button>
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)', marginBottom: 6,
          background: '#1A202C', color: '#E2E8F0',
          borderRadius: 8, padding: '8px 12px',
          fontSize: 11, lineHeight: 1.5, width: 240,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 20, fontFamily: "'DM Sans', sans-serif",
        }}>
          {text}
        </div>
      )}
    </div>
  );
};
