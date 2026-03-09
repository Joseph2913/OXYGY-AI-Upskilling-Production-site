import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowDown, Sparkles, Puzzle, Mic, MicOff, Copy, Check, RotateCcw, Code, Library, Download, Info, ChevronRight } from 'lucide-react';
import { EXAMPLE_PROMPTS, PROMPT_BLUEPRINT, BLUEPRINT_EDUCATION } from '../../../data/playground-content';
import { useGeminiApi } from '../../../hooks/useGeminiApi';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { BuildWizard } from '../../playground/BuildWizard';
import type { PromptResult, WizardAnswers } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { upsertToolUsed, savePrompt as dbSavePrompt } from '../../../lib/database';

type Mode = 'enhance' | 'build' | null;

const FONT = "'DM Sans', sans-serif";

const AppPromptPlayground: React.FC = () => {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<Mode>(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [result, setResult] = useState<PromptResult | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [resultMode, setResultMode] = useState<Mode>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const { enhance, isLoading, error, clearError } = useGeminiApi();
  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition();

  // Staggered block appearance
  useEffect(() => {
    if (!result) return;
    setVisibleBlocks(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 6; i++) {
      timers.push(setTimeout(() => setVisibleBlocks(v => v + 1), 150 + i * 80));
    }
    return () => timers.forEach(clearTimeout);
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
      const draft = localStorage.getItem('oxygy_playground_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.result) { setResult(parsed.result); setActiveMode('enhance'); }
        if (parsed.originalPrompt) setOriginalPrompt(parsed.originalPrompt);
        if (parsed.resultMode) setResultMode(parsed.resultMode);
        localStorage.removeItem('oxygy_playground_draft');
      }
    } catch {}
  }, []);

  const selectMode = (mode: Mode) => {
    setActiveMode(mode);
    setResult(null);
    clearError();
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  };

  const buildMarkdownPrompt = (r: PromptResult): string =>
    `# Role\n${r.role}\n\n# Context\n${r.context}\n\n# Task\n${r.task}\n\n# Format & Structure\n${r.format}\n\n# Steps & Process\n${r.steps}\n\n# Quality Checks\n${r.quality}`;

  const handleEnhance = async () => {
    if (!inputPrompt.trim() || isLoading) return;
    setOriginalPrompt(inputPrompt);
    const data = await enhance({ mode: 'enhance', prompt: inputPrompt });
    if (data) {
      setResult(data); setResultMode('enhance');
      if (user) upsertToolUsed(user.id, 1);
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  const handleBuildGenerate = async (answers: WizardAnswers) => {
    const data = await enhance({ mode: 'build', wizardAnswers: answers });
    if (data) {
      setResult(data); setResultMode('build');
      if (user) upsertToolUsed(user.id, 1);
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  };

  const handleReset = () => {
    setActiveMode(null); setResult(null); setInputPrompt(''); setOriginalPrompt('');
    setSavedToLibrary(false); setShowMarkdown(false); clearError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyFull = async () => {
    if (!result) return;
    await copyToClipboard(buildMarkdownPrompt(result));
    setCopied(true); setToastMessage('Full prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySection = async (key: string, label: string, content: string) => {
    await copyToClipboard(`## ${label}\n${content}`);
    setCopiedSection(key); setToastMessage(`${label} copied`);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleDownload = () => {
    if (!result) return;
    const md = buildMarkdownPrompt(result);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'prompt.md'; a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Downloaded as prompt.md');
  };

  const handleSaveToLibrary = () => {
    if (!result || !user) return;
    const fullPrompt = buildMarkdownPrompt(result);
    const title = result.task.slice(0, 60) + (result.task.length > 60 ? '...' : '');
    dbSavePrompt(user.id, { level: 1, title, content: fullPrompt, source_tool: 'prompt-playground' });
    setSavedToLibrary(true); setToastMessage('Saved to your Prompt Library');
    setTimeout(() => setSavedToLibrary(false), 3000);
  };

  const handleMicToggle = () => {
    if (isListening) { stopListening(); } else {
      startListening((text: string) => setInputPrompt(prev => prev + (prev ? ' ' : '') + text));
    }
  };

  // Step indicators
  const step1Done = activeMode !== null;
  const step2Done = result !== null;

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
        Prompt Playground
      </h1>
      <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0, marginBottom: 20 }}>
        The quality of your AI output is directly determined by the quality of your prompt. Most people lose time going back and forth with vague instructions that produce generic results. The Prompt Playground helps you structure any request into a proven 6-part framework — giving you clearer, more actionable AI responses on the first try, whether you're drafting communications, building plans, or solving complex problems.
      </p>

      {/* ═══ How It Works — Overview Strip ═══ */}
      <ToolOverview
        steps={[
          { number: 1, label: 'Choose your mode', detail: 'Enhance an existing prompt or build one from scratch', done: step1Done },
          { number: 2, label: 'Provide your input', detail: 'Paste a prompt or answer 6 guided questions', done: step2Done },
          { number: 3, label: 'Get your output', detail: 'Copy, download, or save your structured prompt', done: false },
        ]}
        outcome="A structured prompt across 6 sections (Role, Context, Task, Format, Steps, Quality) — ready to copy into any AI tool."
      />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Choose Your Mode                              */}
      {/* ════════════════════════════════════════════════════════ */}
      <StepCard
        stepNumber={1}
        title="Choose your mode"
        subtitle="How would you like to create your prompt?"
        done={step1Done}
        collapsed={step1Done && step2Done}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Enhance card */}
          <ModeCard
            icon={<Sparkles size={20} color="#FFFFFF" />}
            iconBg="#38B2AC"
            title="Enhance a Prompt"
            description="Already have a prompt? Paste it in and we'll transform it into a structured, optimised version using the 6-part Prompt Blueprint."
            selected={activeMode === 'enhance'}
            accentColor="#38B2AC"
            onClick={() => selectMode('enhance')}
          />
          {/* Build card */}
          <ModeCard
            icon={<Puzzle size={20} color="#92700C" />}
            iconBg="#FBE8A6"
            title="Build from Scratch"
            description="Not sure where to start? Answer 6 guided questions and we'll assemble a structured prompt for you — step by step."
            selected={activeMode === 'build'}
            accentColor="#D4A017"
            onClick={() => selectMode('build')}
          />
        </div>
      </StepCard>

      {/* Connector 1→2 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Provide Your Input                            */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step2Ref}>
        <StepCard
          stepNumber={2}
          title={step1Done
            ? (activeMode === 'enhance' ? 'Paste your prompt' : 'Answer the questions')
            : 'Provide your input'}
          subtitle={step1Done
            ? (activeMode === 'enhance'
              ? 'Type or paste your existing prompt below. Try an example to see how it works.'
              : 'Work through each question to build your prompt step by step.')
            : ''}
          done={step2Done}
          collapsed={step1Done && step2Done}
        >
          {!step1Done ? (
            /* Placeholder — waiting for Step 1 */
            <StepPlaceholder
              icon={<ArrowRight size={16} color="#A0AEC0" />}
              message="Choose your mode above to unlock this step"
              detail="Select whether you want to enhance an existing prompt or build one from scratch. This area will then show the appropriate input method."
            />
          ) : (
            /* Active content */
            <>
              {activeMode === 'enhance' ? (
                <>
                  {/* Example pills */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Try an example:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {EXAMPLE_PROMPTS.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setInputPrompt(ex)}
                          style={{
                            padding: '7px 14px', borderRadius: 10,
                            fontSize: 13, color: '#4A5568', background: '#F7FAFC',
                            border: '1px solid #E2E8F0', cursor: 'pointer',
                            transition: 'border-color 0.15s, background 0.15s',
                            textAlign: 'left', lineHeight: 1.4,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#38B2AC'; e.currentTarget.style.background = '#E6FFFA'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F7FAFC'; }}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea — auto-grows with content */}
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <textarea
                      ref={textareaRef}
                      value={inputPrompt}
                      onChange={e => {
                        setInputPrompt(e.target.value);
                        const ta = e.target;
                        ta.style.height = 'auto';
                        ta.style.height = Math.max(80, ta.scrollHeight) + 'px';
                      }}
                      placeholder="e.g., Help me write a summary of our last team meeting for my manager..."
                      style={{
                        width: '100%', minHeight: 80, maxHeight: 320,
                        resize: 'none', overflow: 'auto',
                        border: '1px solid #E2E8F0', borderRadius: 12,
                        padding: '14px 16px', fontSize: 15, color: '#1A202C',
                        fontFamily: FONT, lineHeight: 1.6, outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#38B2AC')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                    />
                    {isSupported && (
                      <button
                        onClick={handleMicToggle}
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          width: 36, height: 36, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #E2E8F0', cursor: 'pointer',
                          background: isListening ? '#38B2AC' : '#FFFFFF',
                          transition: 'background 0.15s',
                        }}
                      >
                        {isListening ? <MicOff size={16} color="#FFFFFF" /> : <Mic size={16} color="#718096" />}
                      </button>
                    )}
                  </div>
                  {isListening && (
                    <div style={{ fontSize: 12, color: '#38B2AC', marginBottom: 8 }}>Listening...</div>
                  )}

                  {/* Enhance button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={handleEnhance}
                      disabled={!inputPrompt.trim() || isLoading}
                      style={{
                        padding: '12px 28px', borderRadius: 24,
                        background: !inputPrompt.trim() || isLoading ? '#CBD5E0' : '#38B2AC',
                        color: '#FFFFFF', border: 'none',
                        fontSize: 14, fontWeight: 700,
                        cursor: !inputPrompt.trim() || isLoading ? 'not-allowed' : 'pointer',
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
                          Enhancing...
                        </>
                      ) : (
                        <>Enhance My Prompt <ArrowRight size={16} /></>
                      )}
                    </button>
                    {!isLoading && (
                      <button
                        onClick={() => { setActiveMode(null); setResult(null); setInputPrompt(''); clearError(); }}
                        style={{
                          padding: '12px 20px', borderRadius: 24,
                          background: 'transparent', color: '#718096',
                          border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Back
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Build wizard */
                !result ? (
                  <div>
                    <BuildWizard onGenerate={handleBuildGenerate} isLoading={isLoading} />
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => { setActiveMode(null); setResult(null); clearError(); }}
                        style={{
                          padding: '10px 20px', borderRadius: 24,
                          background: 'transparent', color: '#718096',
                          border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Back to mode selection
                      </button>
                    </div>
                  </div>
                ) : null
              )}

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
            </>
          )}
        </StepCard>
      </div>

      {/* Connector 2→3 */}
      <StepConnector />

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 3 — Your Output                                   */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={step3Ref} style={result ? { animation: 'ppFadeIn 0.3s ease both' } : undefined}>
        <StepCard
          stepNumber={3}
          title={result
            ? (resultMode === 'enhance' ? 'Your enhanced prompt' : 'Your generated prompt')
            : 'Get your output'}
          subtitle={result
            ? 'Copy the full prompt, download it, or save it to your Prompt Library.'
            : 'Here\'s what your structured prompt will look like — each section plays a specific role.'}
          done={false}
          collapsed={false}
        >
          {!result ? (
            /* Educational preview or loading skeleton */
            isLoading && step1Done ? (
              /* Loading skeleton */
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#38B2AC', marginBottom: 16 }}>
                  Generating your prompt...
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {PROMPT_BLUEPRINT.map(block => (
                    <div key={block.key} style={{
                      height: 80, borderRadius: 10, borderLeft: `4px solid ${block.color}`,
                      background: '#F0F0F0', animation: 'ppPulse 1.5s ease-in-out infinite',
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              /* Educational Blueprint preview */
              <div>
                <div style={{
                  fontSize: 13, color: '#718096', lineHeight: 1.6, marginBottom: 16,
                }}>
                  Your output will be structured using the <strong style={{ color: '#1A202C' }}>6-part Prompt Blueprint</strong> — a proven framework that transforms any request into a high-quality AI prompt. Complete the steps above and each section below will be filled with content tailored to your specific needs.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {PROMPT_BLUEPRINT.map((block, idx) => {
                    const edu = BLUEPRINT_EDUCATION.find(e => e.key === block.key);
                    return (
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
                            {idx + 1}/6
                          </span>
                        </div>
                        {edu && (
                          <>
                            <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, marginBottom: 10 }}>
                              {edu.why}
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
                                {edu.example}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Summary footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 16, marginTop: 16, padding: '10px 0',
                  borderTop: '1px solid #EDF2F7',
                }}>
                  {PROMPT_BLUEPRINT.map(block => (
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
            /* Active output content */
            <>
              {/* View toggle + actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap', gap: 10,
              }}>
                {/* View toggle — prominent with info tooltip for markdown */}
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
                  <InfoTooltip text="Markdown preserves the structure (headings, bullets, formatting) when you paste your prompt into ChatGPT, Claude, or any AI tool — giving you better results than plain text." />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <ActionBtn
                    icon={copied ? <Check size={13} /> : <Copy size={13} />}
                    label={copied ? 'Copied!' : 'Copy'}
                    onClick={handleCopyFull}
                    primary
                  />
                  <ActionBtn
                    icon={<Download size={13} />}
                    label="Download"
                    onClick={handleDownload}
                  />
                </div>
              </div>

              {/* Original prompt (enhance mode) */}
              {resultMode === 'enhance' && originalPrompt && !showMarkdown && (
                <div style={{
                  background: '#F7FAFC', borderRadius: 10,
                  border: '1px solid #E2E8F0', padding: '12px 16px',
                  marginBottom: 16,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#A0AEC0',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                  }}>
                    Your original prompt
                  </div>
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>
                    {originalPrompt}
                  </div>
                </div>
              )}

              {/* Markdown view */}
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
                    {buildMarkdownPrompt(result)}
                  </pre>
                </div>
              )}

              {/* Card view — 2-column grid */}
              {!showMarkdown && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {PROMPT_BLUEPRINT.map((block, idx) => {
                    const key = block.key as keyof PromptResult;
                    const content = result[key];
                    const isVisible = idx < visibleBlocks;
                    const isSectionCopied = copiedSection === block.key;

                    return (
                      <div
                        key={block.key}
                        style={{
                          borderLeft: `4px solid ${block.color}`,
                          background: `${block.color}12`,
                          borderRadius: 10, padding: '16px 18px',
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                          transition: 'opacity 0.3s ease, transform 0.3s ease',
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 15 }}>{block.icon}</span>
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: '#1A202C',
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>
                              {block.label}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopySection(block.key, block.label, content)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 11, color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: 3,
                              padding: '2px 6px', borderRadius: 6,
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#38B2AC')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#A0AEC0')}
                          >
                            {isSectionCopied ? <Check size={11} /> : <Copy size={11} />}
                            {isSectionCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.7 }}>
                          {content}
                        </div>
                      </div>
                    );
                  })}
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
    border: `1px solid ${done ? '#38B2AC44' : '#E2E8F0'}`,
    padding: collapsed ? '16px 24px' : '24px 28px',
    transition: 'padding 0.2s ease, border-color 0.2s ease',
  }}>
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: collapsed ? 0 : 20,
    }}>
      <StepBadge number={stepNumber} done={done} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
          {title}
        </div>
        {!collapsed && (
          <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {done && collapsed && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#38B2AC',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Check size={13} /> Done
        </div>
      )}
    </div>
    {/* Body */}
    {!collapsed && children}
  </div>
);

/* ── Step badge circle ── */
const StepBadge: React.FC<{ number: number; done: boolean }> = ({ number, done }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: done ? '#38B2AC' : '#F7FAFC',
    border: done ? 'none' : '2px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800,
    color: done ? '#FFFFFF' : '#718096',
    transition: 'background 0.2s, color 0.2s',
  }}>
    {done ? <Check size={14} /> : number}
  </div>
);

/* ── Step connector (vertical line + animated arrow) ── */
const LEVEL_ACCENT = '#38B2AC'; // Level 1 theme color for Prompt Playground
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

/* ── Mode selection card ── */
const ModeCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  selected: boolean;
  accentColor: string;
  onClick: () => void;
}> = ({ icon, iconBg, title, description, selected, accentColor, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, textAlign: 'left', cursor: 'pointer',
        background: selected ? `${accentColor}10` : '#FFFFFF',
        border: `2px solid ${selected ? accentColor : hovered ? '#CBD5E0' : '#E2E8F0'}`,
        borderRadius: 14, padding: '22px 24px',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 10, height: 10, borderRadius: '50%', background: accentColor,
        }} />
      )}
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
        {description}
      </div>
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
      padding: '8px 16px', border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: active ? 700 : 600,
      background: active
        ? (highlight ? '#2B6CB0' : '#1A202C')
        : 'transparent',
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
              background: step.done ? '#38B2AC' : '#F7FAFC',
              border: step.done ? 'none' : '2px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: step.done ? '#FFFFFF' : '#718096',
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

/* ── Step Placeholder — shown when a prerequisite step isn't complete ── */
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

export default AppPromptPlayground;
