import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, Sparkles, Puzzle, Mic, MicOff, Info, Copy, Check, RotateCcw, ChevronDown, Code, Library } from 'lucide-react';
import { EXAMPLE_PROMPTS, PROMPT_BLUEPRINT, BLUEPRINT_EDUCATION } from '../data/playground-content';
import { useGeminiApi } from '../hooks/useGeminiApi';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { BuildWizard } from './playground/BuildWizard';
import type { PromptResult, WizardAnswers } from '../types';
import { ArtifactClosing } from './ArtifactClosing';
import { AuthModal } from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../lib/database';

type Mode = 'enhance' | 'build';

const CARD_MIN_HEIGHT = '180px';

export const PromptPlayground: React.FC = () => {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<Mode>('enhance');
  const [inputPrompt, setInputPrompt] = useState('');
  const [result, setResult] = useState<PromptResult | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [resultMode, setResultMode] = useState<Mode>('enhance');
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showResultsBanner, setShowResultsBanner] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [showMarkdownTooltip, setShowMarkdownTooltip] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const modeCardsRef = useRef<HTMLDivElement>(null);
  const { enhance, isLoading, error, clearError } = useGeminiApi();
  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition();

  // Staggered block appearance when result arrives
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 6; i++) {
      timers.push(setTimeout(() => setVisibleBlocks((v) => v + 1), 200 + i * 100));
    }
    return () => timers.forEach(clearTimeout);
  }, [result]);

  const handleModeSwitch = (mode: Mode) => {
    if (mode === activeMode) return;
    setActiveMode(mode);
    setResult(null);
    clearError();
    inputAreaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnhance = async () => {
    if (!inputPrompt.trim() || isLoading) return;
    setOriginalPrompt(inputPrompt);
    const data = await enhance({ mode: 'enhance', prompt: inputPrompt });
    if (data) {
      setResult(data);
      setResultMode('enhance');
      setShowResultsBanner(true);
      if (user) upsertToolUsed(user.id, 1);
      setTimeout(() => {
        setShowResultsBanner(false);
        cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 2000);
    }
  };

  const handleBuildGenerate = async (answers: WizardAnswers) => {
    const data = await enhance({ mode: 'build', wizardAnswers: answers });
    if (data) {
      setResult(data);
      setResultMode('build');
      setShowResultsBanner(true);
      if (user) upsertToolUsed(user.id, 1);
      setTimeout(() => {
        setShowResultsBanner(false);
        cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 2000);
    }
  };

  const handleTryAnother = () => {
    setResult(null);
    setInputPrompt('');
    setOriginalPrompt('');
    setSavedToLibrary(false);
    clearError();
    inputAreaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExampleClick = (example: string) => {
    setInputPrompt(example);
    if (textareaRef.current) {
      textareaRef.current.style.backgroundColor = '#E6FFFA';
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.style.backgroundColor = '';
      }, 300);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text: string) => {
        setInputPrompt((prev) => prev + (prev ? ' ' : '') + text);
      });
    }
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const fullPrompt = PROMPT_BLUEPRINT.map((block) => {
      const key = block.key as keyof PromptResult;
      return result[key];
    }).join('\n\n');

    await copyToClipboard(fullPrompt);
    setCopied(true);
    showToastNotification('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySection = async (sectionKey: string, label: string, content: string) => {
    const md = `## ${label}\n${content}`;
    await copyToClipboard(md);
    setCopiedSection(sectionKey);
    showToastNotification(`${label} copied in markdown format`);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const buildMarkdownPrompt = (r: PromptResult): string => {
    return `# Role\n${r.role}\n\n# Context\n${r.context}\n\n# Task\n${r.task}\n\n# Format & Structure\n${r.format}\n\n# Steps & Process\n${r.steps}\n\n# Quality Checks\n${r.quality}`;
  };

  const handleCopyMarkdown = async () => {
    if (!result) return;
    const md = buildMarkdownPrompt(result);
    await copyToClipboard(md);
    setCopied(true);
    showToastNotification('Markdown prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToLibrary = () => {
    if (!result) return;
    if (!user) {
      // Preserve result in localStorage so it survives an OAuth redirect
      try { localStorage.setItem('oxygy_playground_draft', JSON.stringify({ result, originalPrompt, resultMode })); } catch {}
      setShowAuthModal(true);
      return;
    }
    const fullPrompt = buildMarkdownPrompt(result);
    const title = result.task.slice(0, 60) + (result.task.length > 60 ? '...' : '');
    dbSavePrompt(user.id, { level: 1, title, content: fullPrompt, source_tool: 'prompt-playground' });
    setSavedToLibrary(true);
    showToastNotification('Prompt saved to your library');
    setTimeout(() => setSavedToLibrary(false), 3000);
  };

  // Restore draft from localStorage after OAuth redirect
  useEffect(() => {
    try {
      const draft = localStorage.getItem('oxygy_playground_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.result) setResult(parsed.result);
        if (parsed.originalPrompt) setOriginalPrompt(parsed.originalPrompt);
        if (parsed.resultMode) setResultMode(parsed.resultMode);
        localStorage.removeItem('oxygy_playground_draft');
      }
    } catch {}
  }, []);

  const scrollToModes = () => {
    modeCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <a
          href="#"
          onClick={e => { e.preventDefault(); window.location.hash = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] hover:text-[#38B2AC] transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Home
        </a>

        {/* ─── HERO: Title (centered, two-line) ─── */}
        <div ref={inputAreaRef} className="mb-8 text-center">
          <div
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: '#E6FFFA', color: '#2C7A6E', border: '1px solid #A8F0E0' }}
          >
            Level 1 &mdash; Fundamentals &amp; Awareness
          </div>
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15] mb-6">
            <span className="relative inline-block">
              Better Prompts
              <span className="absolute left-0 -bottom-1 w-full h-[4px] bg-[#38B2AC] opacity-80 rounded-full" />
            </span>
            <br />
            Get Better Results
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#718096] leading-[1.7] max-w-[700px] mx-auto mt-2">
            Learn the six building blocks of a well-engineered prompt &mdash; and watch a vague idea transform into a structured instruction that gets dramatically better AI outputs.
          </p>

          {/* ─── FUN FACT CARD ─── */}
          <div className="mb-8">
            <div
              className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(168,240,224,0.15) 0%, rgba(43,168,156,0.08) 50%, rgba(168,240,224,0.12) 100%)',
                border: '1.5px solid #A8F0E0',
              }}
            >
              {/* Decorative accent dots */}
              <div className="absolute top-3 left-4 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2BA89C] opacity-40" />
                <span className="w-2 h-2 rounded-full bg-[#A8F0E0] opacity-60" />
                <span className="w-2 h-2 rounded-full bg-[#2BA89C] opacity-30" />
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#2BA89C] mb-2">
                Did you know?
              </p>
              <p className="text-[17px] md:text-[19px] text-[#2D3748] leading-[1.6] font-medium mb-2">
                A well-structured prompt can improve AI output quality by up to <span className="text-[#2BA89C] font-bold">60%</span>.
              </p>
              <p className="text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto mb-5">
                The difference between a vague ask and a structured 6-part prompt is the difference between a generic draft and an expert-level deliverable.
              </p>

              <button
                onClick={scrollToModes}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A202C] text-white text-[14px] font-semibold rounded-full hover:bg-[#2D3748] transition-colors"
              >
                Choose your mode below <ChevronDown size={15} className="animate-bounce-down" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── TWO-COLUMN MODE CARDS ─── */}
        <div ref={modeCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Mode A Card — Teal */}
          <button
            onClick={() => handleModeSwitch('enhance')}
            className="relative text-left rounded-2xl p-6 border-2 transition-all duration-200 group"
            style={{
              borderColor: activeMode === 'enhance' ? '#38B2AC' : '#E2E8F0',
              backgroundColor: activeMode === 'enhance' ? '#E6FFFA' : '#FFFFFF',
            }}
          >
            {activeMode === 'enhance' && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#38B2AC]" />
            )}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-full bg-[#38B2AC] flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A202C]">Enhance a Prompt</h3>
            </div>
            <p className="text-[14px] text-[#4A5568] leading-relaxed mb-3">
              Already have a prompt? Paste it below and we'll transform it into a structured, optimized version using the 6-part Prompt Blueprint.
            </p>
            {activeMode === 'enhance' && (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#38B2AC] animate-bounce-down">
                <ChevronDown size={14} /> Paste your prompt below
              </span>
            )}
            {activeMode !== 'enhance' && (
              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#718096] group-hover:text-[#38B2AC] transition-colors">
                Switch to this mode <ArrowRight size={13} />
              </span>
            )}
          </button>

          {/* Mode B Card — Yellow */}
          <button
            onClick={() => handleModeSwitch('build')}
            className="relative text-left rounded-2xl p-6 border-2 transition-all duration-200 group"
            style={{
              borderColor: activeMode === 'build' ? '#D4A017' : '#E2E8F0',
              backgroundColor: activeMode === 'build' ? '#FFFBEB' : '#FFFFFF',
            }}
          >
            {activeMode === 'build' && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#D4A017]" />
            )}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-full bg-[#FBE8A6] flex items-center justify-center">
                <Puzzle size={18} className="text-[#92700C]" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A202C]">Build from Scratch</h3>
            </div>
            <p className="text-[14px] text-[#4A5568] leading-relaxed mb-3">
              Not sure where to start? Answer 6 quick questions and we'll assemble a structured prompt for you — step by step, like a guided questionnaire.
            </p>
            {activeMode === 'build' && (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#92700C] animate-bounce-down">
                <ChevronDown size={14} /> Start the questionnaire below
              </span>
            )}
            {activeMode !== 'build' && (
              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#718096] group-hover:text-[#D4A017] transition-colors">
                Switch to this mode <ArrowRight size={13} />
              </span>
            )}
          </button>
        </div>

        {/* ─── INPUT AREA ─── */}
        <div className="transition-opacity duration-200">
          {/* Mode A: Enhance */}
          {activeMode === 'enhance' && (
            <div className="animate-fade-in">
              {/* Label */}
              <label htmlFor="prompt-input" className="block text-[14px] font-semibold text-[#1A202C] mb-2">
                Paste or type your prompt below
              </label>

              {/* Example pills — 3 per row, 2 rows */}
              <div className="mb-3">
                <span className="text-[13px] text-[#718096] italic mb-2 block">Try an example:</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {EXAMPLE_PROMPTS.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(example)}
                      className="px-3.5 py-2 rounded-lg text-[13px] text-left border border-[#E2E8F0] bg-[#F7FAFC] text-[#4A5568] hover:border-[#38B2AC] hover:text-[#38B2AC] hover:bg-[#E6FFFA] transition-colors leading-snug"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="prompt-input"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="e.g., Help me write a summary of our last team meeting for my manager..."
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-4 text-[15px] text-[#1A202C] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#38B2AC] focus:ring-[3px] focus:ring-[#38B2AC1a] transition-colors resize-none"
                  style={{ minHeight: '120px', maxHeight: '200px' }}
                />
                {isSupported && (
                  <button
                    onClick={handleMicToggle}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border transition-all"
                    style={
                      isListening
                        ? { backgroundColor: '#38B2AC', borderColor: '#38B2AC' }
                        : { backgroundColor: '#F7FAFC', borderColor: '#E2E8F0' }
                    }
                  >
                    {isListening ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-[#718096]" />}
                  </button>
                )}
              </div>
              {isListening && (
                <span className="text-[12px] text-[#38B2AC] mt-1 block">Listening...</span>
              )}

              {/* CTA */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleEnhance}
                  disabled={!inputPrompt.trim() || isLoading}
                  className="px-7 py-3 bg-[#38B2AC] text-white text-[15px] font-semibold rounded-full hover:bg-[#319795] transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      Enhance My Prompt <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode B: Build Wizard */}
          {activeMode === 'build' && !result && (
            <div className="animate-fade-in">
              <BuildWizard onGenerate={handleBuildGenerate} isLoading={isLoading} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 bg-[#FFF5F5] border border-[#FC8181] text-[#C53030] rounded-lg px-4 py-3 text-[14px]">
              {error}
            </div>
          )}
        </div>

        {/* ─── "View Your Results Below" Banner ─── */}
        {showResultsBanner && (
          <div className="mt-8 flex justify-center animate-confetti-pop">
            <div className="inline-flex items-center gap-3 bg-[#E6FFFA] border border-[#38B2AC] rounded-full px-6 py-3 shadow-md">
              <span className="text-xl">🎉</span>
              <span className="text-[15px] font-semibold text-[#1A202C]">Your prompt is ready!</span>
              <span className="text-[14px] text-[#38B2AC] flex items-center gap-1">
                View your results below <ChevronDown size={16} className="animate-bounce-down" />
              </span>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────── */}
        {/* CARDS SECTION                                       */}
        {/* ──────────────────────────────────────────────────── */}
        <div ref={cardsRef} className="mt-16">
          <div className="h-px bg-[#E2E8F0] mb-10" />

          {/* Before/After label — enhance mode only */}
          {result && resultMode === 'enhance' && originalPrompt && (
            <div className="mb-8 max-w-3xl">
              <p className="text-[12px] font-semibold text-[#A0AEC0] uppercase tracking-[0.05em] mb-3">
                Your original prompt
              </p>
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg px-4 py-3 max-h-20 overflow-hidden relative">
                <p className="text-[14px] text-[#718096] leading-relaxed">{originalPrompt}</p>
              </div>
              <div className="flex items-center justify-center my-4">
                <span className="text-[14px] text-[#A0AEC0] flex items-center gap-1.5">
                  Enhanced to <ArrowDown size={14} />
                </span>
              </div>
            </div>
          )}

          {/* Section header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[22px] md:text-[26px] font-bold text-[#1A202C] mb-1">
                {result ? (
                  resultMode === 'enhance' ? 'Your Enhanced Prompt' : 'Your Generated Prompt'
                ) : (
                  'The Prompt Blueprint'
                )}
              </h2>
              <p className="text-[14px] text-[#718096] max-w-xl">
                {result
                  ? 'Your prompt has been structured into 6 optimized sections. Click the copy icon on any card to grab that section in markdown format.'
                  : 'Great prompts follow a proven structure. These are the 6 building blocks that transform a basic request into a high-quality AI output.'
                }
              </p>
            </div>

            {result && (
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <button
                  onClick={handleTryAnother}
                  className="px-4 py-2 text-[13px] border border-[#2D3748] text-[#2D3748] rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  Try Another
                </button>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-[13px] font-semibold bg-[#38B2AC] text-white rounded-full hover:bg-[#319795] transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy Full Prompt'}
                </button>
                <button
                  onClick={handleSaveToLibrary}
                  disabled={savedToLibrary}
                  className="px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-1.5"
                  style={{
                    backgroundColor: savedToLibrary ? '#E6FFFA' : '#1A202C',
                    color: savedToLibrary ? '#38B2AC' : '#FFFFFF',
                    border: savedToLibrary ? '1px solid #38B2AC' : 'none',
                    cursor: savedToLibrary ? 'default' : 'pointer',
                  }}
                >
                  {savedToLibrary ? <Check size={13} /> : <Library size={13} />}
                  {savedToLibrary ? 'Saved!' : 'Save to Library'}
                </button>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading && !result && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {PROMPT_BLUEPRINT.map((block) => (
                <div
                  key={block.key}
                  className="rounded-[10px] animate-skeleton"
                  style={{
                    borderLeft: `4px solid ${block.color}`,
                    backgroundColor: '#F7FAFC',
                    minHeight: CARD_MIN_HEIGHT,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── RESULT CARDS ── */}
          {result && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {PROMPT_BLUEPRINT.map((block, index) => {
                const key = block.key as keyof PromptResult;
                const content = result[key];
                const isVisible = index < visibleBlocks;
                const isSectionCopied = copiedSection === block.key;

                return (
                  <div
                    key={block.key}
                    className="rounded-[10px] px-5 py-4 transition-all duration-300 hover:shadow-md group/card flex flex-col"
                    style={{
                      borderLeft: `4px solid ${block.color}`,
                      backgroundColor: `${block.color}26`,
                      minHeight: CARD_MIN_HEIGHT,
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                      transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Header: centered emoji + label */}
                    <div className="flex flex-col items-center mb-3">
                      <span className="text-lg mb-1.5">{block.icon}</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[10px] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#1A202C]"
                        style={{ backgroundColor: block.color }}
                      >
                        {block.label}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-[14px] text-[#2D3748] leading-[1.7] flex-1">{content}</p>

                    {/* Footer: info + copy */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                      <div className="relative group/tip">
                        <Info size={14} className="text-[#A0AEC0] cursor-help hover:text-[#718096] transition-colors" />
                        <div className="absolute left-0 bottom-full mb-1 bg-[#1A202C] text-white text-[12px] leading-relaxed px-3 py-2 rounded-md max-w-[220px] opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-20 shadow-lg">
                          {block.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopySection(block.key, block.label, content)}
                        className="flex items-center gap-1 text-[12px] text-[#A0AEC0] hover:text-[#38B2AC] transition-colors opacity-0 group-hover/card:opacity-100"
                        title={`Copy ${block.label} as markdown`}
                      >
                        {isSectionCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isSectionCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MARKDOWN CODE BLOCK OUTPUT ── */}
          {result && !isLoading && (
            <div className="mb-10 relative"
              onMouseEnter={() => setShowMarkdownTooltip(true)}
              onMouseLeave={() => setShowMarkdownTooltip(false)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-[#718096]" />
                  <span className="text-[13px] font-semibold text-[#1A202C]">Markdown Format — Ready to Paste</span>
                </div>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-4 py-1.5 text-[13px] font-semibold bg-[#38B2AC] text-white rounded-full hover:bg-[#319795] transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  onClick={handleSaveToLibrary}
                  disabled={savedToLibrary}
                  className="px-4 py-1.5 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-1.5"
                  style={{
                    backgroundColor: savedToLibrary ? '#E6FFFA' : '#1A202C',
                    color: savedToLibrary ? '#38B2AC' : '#FFFFFF',
                    border: savedToLibrary ? '1px solid #38B2AC' : 'none',
                    cursor: savedToLibrary ? 'default' : 'pointer',
                  }}
                >
                  {savedToLibrary ? <Check size={13} /> : <Library size={13} />}
                  {savedToLibrary ? 'Saved!' : 'Save to Library'}
                </button>
              </div>
              <div className="relative">
                <pre className="bg-[#1A202C] text-[#E2E8F0] text-[13px] leading-[1.8] rounded-xl p-6 overflow-x-auto whitespace-pre-wrap font-mono">
                  {buildMarkdownPrompt(result)}
                </pre>
                {/* Hover tooltip */}
                {showMarkdownTooltip && (
                  <div className="absolute top-3 right-3 bg-[#FFFBEB] border border-[#D4A017] rounded-lg px-4 py-3 max-w-sm shadow-lg z-20 animate-fade-in">
                    <p className="text-[13px] text-[#92700C] leading-relaxed">
                      <strong>Pro tip:</strong> Markdown format is significantly better for providing large prompts like these to your AI agent — it helps them understand the different sections and use them effectively for better performance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EDUCATIONAL CARDS (default state) ── */}
          {!result && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {PROMPT_BLUEPRINT.map((block, index) => {
                const edu = BLUEPRINT_EDUCATION[index];
                return (
                  <div
                    key={block.key}
                    className="rounded-[10px] px-5 py-4 hover:shadow-md transition-shadow group flex flex-col"
                    style={{
                      borderLeft: `4px solid ${block.color}`,
                      backgroundColor: `${block.color}26`,
                      minHeight: CARD_MIN_HEIGHT,
                    }}
                  >
                    {/* Header: centered emoji + label */}
                    <div className="flex flex-col items-center mb-3">
                      <span className="text-lg mb-1.5">{block.icon}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[10px] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#1A202C]"
                          style={{ backgroundColor: block.color }}
                        >
                          {block.label}
                        </span>
                        <span className="text-[11px] font-bold text-[#A0AEC0]">{index + 1}/6</span>
                      </div>
                    </div>

                    <p className="text-[14px] text-[#2D3748] leading-[1.6] mb-3 flex-1">
                      {edu.why}
                    </p>

                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-[#E2E8F0]/50">
                      <p className="text-[12px] font-semibold text-[#A0AEC0] uppercase tracking-[0.04em] mb-1">Example</p>
                      <p className="text-[13px] text-[#4A5568] leading-relaxed italic">{edu.example}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prompt Blueprint Legend */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6">
            {PROMPT_BLUEPRINT.map((block) => (
              <span key={block.key} className="flex items-center gap-1.5 text-[12px] text-[#718096]">
                <span className="text-sm">{block.icon}</span>
                {block.label}
              </span>
            ))}
          </div>

          {/* Mobile action buttons */}
          {result && (
            <div className="flex sm:hidden flex-col gap-3 mb-8">
              <button
                onClick={handleTryAnother}
                className="px-5 py-2.5 text-[14px] border border-[#2D3748] text-[#2D3748] rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                Try Another
              </button>
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 text-[14px] font-semibold bg-[#38B2AC] text-white rounded-full hover:bg-[#319795] transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Full Prompt'}
              </button>
              <button
                onClick={handleSaveToLibrary}
                disabled={savedToLibrary}
                className="px-5 py-2.5 text-[14px] font-semibold rounded-full transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: savedToLibrary ? '#E6FFFA' : '#1A202C',
                  color: savedToLibrary ? '#38B2AC' : '#FFFFFF',
                  border: savedToLibrary ? '1px solid #38B2AC' : 'none',
                }}
              >
                {savedToLibrary ? <Check size={14} /> : <Library size={14} />}
                {savedToLibrary ? 'Saved!' : 'Save to Library'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── PAGE CLOSING ─── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <ArtifactClosing
          summaryText="You've explored the foundations of prompt engineering — the 6-block Prompt Blueprint framework that transforms vague requests into structured, high-quality AI outputs. Ready to go further?"
          ctaLabel="Continue to Level 2: Applied Capability"
          ctaHref="#agent-builder"
          accentColor="#2BA89C"
        />
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white text-[14px] px-5 py-2.5 rounded-lg shadow-lg z-50 animate-toast-enter whitespace-nowrap">
          {toastMessage} ✓
        </div>
      )}

      {/* Auth overlay for save-to-library */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};
