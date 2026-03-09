import React, { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { TOTAL_SLIDES } from '../../../hooks/useLevelData';

/* ── Realistic Prompt Engineering slide content ── */
const SLIDES = [
  { section: 'SITUATION', type: 'dark' as const,
    heading: "You've just spent 20 minutes crafting a prompt.\nYou hit enter.\nThe AI gives you something a first-year intern would be embarrassed to submit." },
  { section: 'SITUATION', type: 'concept' as const,
    heading: 'The prompt that wasted 20 minutes', tealWord: '20 minutes',
    body: 'You needed a stakeholder update for the CFO on a delayed ERP rollout. You typed a reasonable request. The AI responded with something so generic it could have been written about any project, for any person, at any company.' },
  { section: 'TENSION', type: 'statement' as const,
    heading: 'The AI performed exactly as instructed.',
    subheading: 'The problem is: your instruction carried almost no information.',
    tealPhrase: 'almost no information' },
  { section: 'TENSION', type: 'concept' as const,
    heading: 'What you gave vs. what it needed', tealWord: 'what it needed',
    body: "Most prompts carry a single sentence of instruction and zero supporting information. The AI then fills every gap with generic assumptions — about who you are, what you need, and what 'good' looks like." },
  { section: 'CONCEPT', type: 'concept' as const,
    heading: 'The Prompt Blueprint', tealWord: 'Prompt Blueprint',
    body: 'A six-part structure for giving AI everything it needs to produce professional-quality output on the first attempt. Each part fills a specific gap that most prompts leave empty.' },
  { section: 'CONCEPT', type: 'framework' as const,
    heading: 'Six components. One complete instruction.', tealWord: 'complete instruction',
    elements: [
      { key: 'ROLE', color: '#667EEA', desc: 'Who the AI should be' },
      { key: 'CONTEXT', color: '#38B2AC', desc: 'Your situation and constraints' },
      { key: 'TASK', color: '#ED8936', desc: 'Exactly what to produce' },
      { key: 'FORMAT', color: '#48BB78', desc: 'Output shape, length, and tone' },
      { key: 'STEPS', color: '#9F7AEA', desc: 'Reasoning sequence for the AI to follow' },
      { key: 'CHECKS', color: '#F6AD55', desc: 'Validation rules and constraints' },
    ] },
  { section: 'CONCEPT', type: 'concept' as const,
    heading: 'Two approaches to the same problem', tealWord: 'same problem',
    body: "A brain dump gives the AI raw information and hopes for the best. A Blueprint organises that same information into a structure the AI can reliably act on. Same effort — dramatically different output." },
  { section: 'CONCEPT', type: 'concept' as const,
    heading: "These aren't separate approaches. They're amplifiers.", tealWord: 'amplifiers',
    body: 'Chain-of-thought, few-shot examples, and iterative refinement add on top of a Blueprint — they change how the AI reasons, not what information you give it.' },
  { section: 'CONCEPT', type: 'statement' as const,
    heading: "The best prompt isn't the most structured one.",
    subheading: "It's the right one for this task.",
    tealPhrase: 'right one' },
  { section: 'PRACTICE', type: 'concept' as const,
    heading: 'Categorise the prompt fragments', tealWord: 'prompt fragments',
    body: 'Raw ingredients of a prompt for a graduate onboarding plan. Identify what job each fragment is doing — Role, Context, Task, Format, Steps, or Quality Checks.' },
  { section: 'CONTRAST', type: 'concept' as const,
    heading: 'Same task. Same tool. Same person.', tealWord: 'Same person',
    body: 'The only difference is the quality of information in the input. The Blueprint version produced an output the user could send to the CFO with minor edits. The brain dump version needed to be rewritten entirely.' },
  { section: 'KEY TAKEAWAYS', type: 'concept' as const,
    heading: 'What you now know', tealWord: 'now know',
    body: "AI output quality is determined by input quality. The Prompt Blueprint gives you a repeatable structure: Role, Context, Task, Format, Steps, Checks. Use it whenever the stakes matter — skip it when you're just brainstorming." },
  { section: 'YOUR NEXT STEP', type: 'bridge' as const,
    heading: 'Now build your own.',
    body: "The Prompt Playground uses the same Blueprint framework you've just learned. Paste a real prompt from your current work — or build one from scratch using the guided builder." },
];

function renderTealHeading(text: string, tealWord?: string, fontSize = 22) {
  const style: React.CSSProperties = { fontSize, fontWeight: 700, color: '#1A202C', margin: '0 0 12px', lineHeight: 1.3 };
  if (!tealWord) return <h2 style={style}>{text}</h2>;
  const idx = text.indexOf(tealWord);
  if (idx === -1) return <h2 style={style}>{text}</h2>;
  return (
    <h2 style={style}>
      {text.slice(0, idx)}
      <span style={{ textDecoration: 'underline', textDecorationColor: '#38B2AC', textDecorationThickness: 3, textUnderlineOffset: 5 }}>{tealWord}</span>
      {text.slice(idx + tealWord.length)}
    </h2>
  );
}

interface ELearningViewProps {
  currentSlide: number;
  accentColor: string;
  accentDark: string;
  isReview?: boolean;
  onSlideChange: (slide: number) => void;
  onCompletePhase: () => void;
  onBackToSummary?: () => void;
}

const ELearningView: React.FC<ELearningViewProps> = ({
  currentSlide,
  accentColor,
  accentDark,
  isReview = false,
  onSlideChange,
  onCompletePhase,
  onBackToSummary,
}) => {
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([currentSlide]));
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setVisitedSlides((prev) => new Set(prev).add(currentSlide));
  }, [currentSlide]);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  // Arrow key navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < TOTAL_SLIDES) onSlideChange(currentSlide + 1);
      if (e.key === 'ArrowLeft' && currentSlide > 1) onSlideChange(currentSlide - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSlide, onSlideChange]);

  const goToSlide = useCallback((i: number) => { if (i >= 1 && i <= TOTAL_SLIDES) onSlideChange(i); }, [onSlideChange]);
  const isLastSlide = currentSlide === TOTAL_SLIDES;
  const s = SLIDES[currentSlide - 1];

  const renderSlide = () => {
    switch (s.type) {
      case 'dark':
        return (
          <div style={{ background: '#1A202C', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px' }}>
            <h1 style={{ fontSize: isFullscreen ? 32 : 24, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.5, textAlign: 'center', maxWidth: 620, whiteSpace: 'pre-line' }}>{s.heading}</h1>
          </div>
        );
      case 'statement':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', padding: '40px 60px' }}>
            <h2 style={{ fontSize: isFullscreen ? 32 : 26, fontWeight: 800, color: '#1A202C', lineHeight: 1.3, margin: '0 0 14px', maxWidth: 560 }}>{s.heading}</h2>
            {s.subheading && (
              <p style={{ fontSize: isFullscreen ? 18 : 15, color: '#4A5568', lineHeight: 1.7, maxWidth: 500, margin: 0 }}>
                {s.tealPhrase ? (() => {
                  const idx = s.subheading!.indexOf(s.tealPhrase!);
                  if (idx === -1) return s.subheading;
                  return <>{s.subheading!.slice(0, idx)}<span style={{ color: '#38B2AC', fontWeight: 700 }}>{s.tealPhrase}</span>{s.subheading!.slice(idx + s.tealPhrase!.length)}</>;
                })() : s.subheading}
              </p>
            )}
          </div>
        );
      case 'framework':
        return (
          <div style={{ padding: isFullscreen ? '48px 80px' : '28px 40px' }}>
            {renderTealHeading(s.heading, s.tealWord, isFullscreen ? 26 : 20)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              {(s as any).elements?.map((el: any) => (
                <div key={el.key} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${el.color}44`, background: `${el.color}08` }}>
                  <span style={{ fontSize: isFullscreen ? 11 : 10, fontWeight: 800, color: el.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{el.key}</span>
                  <div style={{ fontSize: isFullscreen ? 14 : 13, color: '#4A5568', marginTop: 4, lineHeight: 1.5 }}>{el.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'bridge':
        return (
          <div style={{ display: 'flex', gap: 0, position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, background: '#38B2AC', padding: isFullscreen ? '48px 56px' : '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: isFullscreen ? 28 : 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.2 }}>{s.heading}</h2>
              <p style={{ fontSize: isFullscreen ? 16 : 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </div>
            <div style={{ width: '40%', background: '#2C9A94', padding: isFullscreen ? '48px 40px' : '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A8F0E0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Coming next</div>
              <h3 style={{ fontSize: isFullscreen ? 22 : 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.3 }}>Context Engineering</h3>
              <p style={{ fontSize: isFullscreen ? 14 : 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>Go one layer deeper — give AI standing context about who you are and what good looks like, before you write a single prompt.</p>
            </div>
          </div>
        );
      case 'concept':
      default:
        return (
          <div style={{ padding: isFullscreen ? '48px 80px' : '28px 40px' }}>
            {renderTealHeading(s.heading, s.tealWord, isFullscreen ? 26 : 20)}
            {s.body && <p style={{ fontSize: isFullscreen ? 16 : 14, color: '#4A5568', lineHeight: 1.7, margin: 0 }}>{s.body}</p>}
          </div>
        );
    }
  };

  /* ── Fullscreen overlay ── */
  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ background: '#1A202C', height: 48, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => i + 1).map((n) => (
              <div key={n} onClick={() => visitedSlides.has(n) && goToSlide(n)} style={{
                width: n === currentSlide ? 24 : 8, height: 8, borderRadius: 4,
                cursor: visitedSlides.has(n) ? 'pointer' : 'default',
                background: n === currentSlide ? '#38B2AC' : visitedSlides.has(n) ? '#4A5568' : '#2D3748',
                transition: 'all 0.25s ease',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#A0AEC0' }}>{currentSlide} / {TOTAL_SLIDES}</span>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              title="Exit fullscreen (Esc)"
            >
              <Minimize2 size={16} color="#A0AEC0" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#2D3748', flexShrink: 0 }}>
          <div style={{ height: '100%', background: accentColor, width: `${(currentSlide / TOTAL_SLIDES) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Content — fills remaining space */}
        <div style={{ flex: 1, position: 'relative', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: s.type === 'dark' || s.type === 'statement' || s.type === 'bridge' ? 'stretch' : 'flex-start' }}>
            {renderSlide()}
          </div>
        </div>

        {/* Navigation bar */}
        <div style={{ borderTop: '1px solid #2D3748', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A202C', flexShrink: 0 }}>
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 1}
            style={{
              padding: '8px 20px', borderRadius: 24, minHeight: 40, border: '1px solid #4A5568', background: 'transparent',
              color: currentSlide === 1 ? '#4A5568' : '#E2E8F0', fontSize: 13, fontWeight: 600,
              cursor: currentSlide === 1 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: 10, fontWeight: 700, color: '#718096', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>

          {isReview ? (
            <button
              onClick={() => { setIsFullscreen(false); onBackToSummary?.(); }}
              style={{
                padding: '8px 20px', borderRadius: 24, minHeight: 40, border: '1px solid #E2E8F0', background: 'transparent',
                color: '#E2E8F0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ← Back to summary
            </button>
          ) : (
            <button
              onClick={() => isLastSlide ? (setIsFullscreen(false), onCompletePhase()) : goToSlide(currentSlide + 1)}
              style={{
                padding: '8px 20px', borderRadius: 24, minHeight: 40, border: 'none',
                background: isLastSlide ? accentColor : '#38B2AC',
                color: isLastSlide ? accentDark : '#FFFFFF',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {isLastSlide ? 'Finish E-Learning →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Inline (compact) player ── */
  return (
    <div>
      {/* Player card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.05)' }}>
        {/* Dark navy top bar */}
        <div style={{ background: '#1A202C', height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => i + 1).map((n) => (
              <div key={n} onClick={() => visitedSlides.has(n) && goToSlide(n)} style={{
                width: n === currentSlide ? 18 : 6, height: 6, borderRadius: 3,
                cursor: visitedSlides.has(n) ? 'pointer' : 'default',
                background: n === currentSlide ? '#38B2AC' : visitedSlides.has(n) ? '#4A5568' : '#2D3748',
                transition: 'all 0.25s ease',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#A0AEC0' }}>{currentSlide} / {TOTAL_SLIDES}</span>
            <button
              onClick={() => setIsFullscreen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              title="View fullscreen"
            >
              <Maximize2 size={14} color="#A0AEC0" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: '#E2E8F0' }}>
          <div style={{ height: '100%', background: accentColor, width: `${(currentSlide / TOTAL_SLIDES) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Content area — compact height to fit single screen, use calc for viewport fit */}
        <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 340px)', minHeight: 320, maxHeight: 520, background: '#FFFFFF' }}>
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: s.type === 'dark' || s.type === 'statement' || s.type === 'bridge' ? 'stretch' : 'flex-start' }}>
            {renderSlide()}
          </div>
        </div>

        {/* Navigation bar */}
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF' }}>
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 1}
            style={{
              padding: '7px 18px', borderRadius: 24, minHeight: 36, border: '1px solid #E2E8F0', background: 'transparent',
              color: currentSlide === 1 ? '#CBD5E0' : '#1A202C', fontSize: 13, fontWeight: 600,
              cursor: currentSlide === 1 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>

          {isReview ? (
            <button
              onClick={onBackToSummary}
              style={{
                padding: '7px 18px', borderRadius: 24, minHeight: 36, border: '1px solid #1A202C', background: 'transparent',
                color: '#1A202C', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ← Back to summary
            </button>
          ) : (
            <button
              onClick={() => isLastSlide ? onCompletePhase() : goToSlide(currentSlide + 1)}
              style={{
                padding: '7px 18px', borderRadius: 24, minHeight: 36, border: 'none',
                background: isLastSlide ? accentColor : '#38B2AC',
                color: isLastSlide ? accentDark : '#FFFFFF',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {isLastSlide ? 'Finish E-Learning →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ELearningView;
