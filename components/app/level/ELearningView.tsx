import React, { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { SlideData } from '../../../data/topicContent';

/* ── Glow + animation keyframe CSS (injected once) ── */
const GLOW_STYLE_ID = 'elearn-glow-style';
function injectGlowStyle() {
  if (document.getElementById(GLOW_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = GLOW_STYLE_ID;
  style.textContent = `
    @keyframes fsGlow {
      0%, 100% { box-shadow: 0 0 6px 2px rgba(56,178,172,0.35); }
      50% { box-shadow: 0 0 14px 5px rgba(56,178,172,0.6); }
    }
    .fs-glow-btn { animation: fsGlow 2s ease-in-out infinite; }
    @keyframes insightPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(56,178,172,0.2); }
      50% { box-shadow: 0 0 16px 4px rgba(56,178,172,0.35); }
    }
    .insight-pulse { animation: insightPulse 3s ease-in-out infinite; }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .flip-card-inner { transition: transform 0.5s ease; transform-style: preserve-3d; }
    .flip-card-inner.flipped { transform: rotateY(180deg); }
    .flip-card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .flip-card-back { transform: rotateY(180deg); }
  `;
  document.head.appendChild(style);
}

/* ── Helpers ── */
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

function TealPhrase({ text, phrase }: { text: string; phrase: string }) {
  const idx = text.indexOf(phrase);
  if (idx === -1) return <>{text}</>;
  return <>{text.slice(0, idx)}<span style={{ color: '#38B2AC', fontWeight: 700 }}>{phrase}</span>{text.slice(idx + phrase.length)}</>;
}

/* ── Annotated prompt renderer: underlines parts of prompt text with RCTF colours ── */
function AnnotatedPrompt({ text, annotations }: { text: string; annotations?: Array<{ text: string; component: string; color: string }> }) {
  if (!annotations || annotations.length === 0) {
    return <span>{text}</span>;
  }
  const parts: Array<{ text: string; color?: string; component?: string }> = [];
  let remaining = text;
  let lastIndex = 0;

  // Sort annotations by their position in the text
  const sorted = [...annotations]
    .map((a) => ({ ...a, idx: text.indexOf(a.text) }))
    .filter((a) => a.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  for (const ann of sorted) {
    if (ann.idx >= lastIndex) {
      if (ann.idx > lastIndex) {
        parts.push({ text: text.slice(lastIndex, ann.idx) });
      }
      parts.push({ text: ann.text, color: ann.color, component: ann.component });
      lastIndex = ann.idx + ann.text.length;
    }
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.color ? (
          <span key={i} style={{ textDecoration: 'underline', textDecorationColor: p.color, textDecorationThickness: 2, textUnderlineOffset: 3 }} title={p.component}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

/* ── Expandable accordion text (PRD §2.5) ── */
function ExpandableText({ text, maxLen = 180, id, expanded, onToggle }: { text: string; maxLen?: number; id: string; expanded: boolean; onToggle: (id: string) => void }) {
  const isLong = text.length > maxLen;
  if (!isLong) return <span style={{ whiteSpace: 'pre-line' }}>{text}</span>;
  return (
    <span>
      <span style={{ whiteSpace: 'pre-line' }}>{expanded ? text : text.slice(0, maxLen) + '\u2026'}</span>
      <button onClick={(e) => { e.stopPropagation(); onToggle(id); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 11, fontWeight: 600, color: '#38B2AC', cursor: 'pointer', marginTop: 6, marginLeft: 4 }}>
        {expanded ? 'Show less \u25B4' : 'Show full prompt \u25BE'}
      </button>
    </span>
  );
}

/* ── Props ── */
interface ELearningViewProps {
  slides: SlideData[];
  currentSlide: number;
  accentColor: string;
  accentDark: string;
  isReview?: boolean;
  onSlideChange: (slide: number) => void;
  onCompletePhase: () => void;
  onBackToSummary?: () => void;
}

const ELearningView: React.FC<ELearningViewProps> = ({
  slides,
  currentSlide,
  accentColor,
  accentDark,
  isReview = false,
  onSlideChange,
  onCompletePhase,
  onBackToSummary,
}) => {
  const totalSlides = slides.length;
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([currentSlide]));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsTooltip, setShowFsTooltip] = useState(true);
  const [sjScenarioIdx, setSjScenarioIdx] = useState(0);
  /* L2 interactive slide state */
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [spectrumPos, setSpectrumPos] = useState(2);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [branchingSelected, setBranchingSelected] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCompTab, setActiveCompTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  /* L1 v2 state */
  const [contextStep, setContextStep] = useState(0); // Slide 6: sequential reveal 0–6
  const [sjAnswers, setSjAnswers] = useState<Record<number, number | null>>({}); // Slides 13–15: per-slide selected option
  const [sjChecked, setSjChecked] = useState<Record<number, boolean>>({}); // Slides 13–15: per-slide checked state
  const [scenarioTab, setScenarioTab] = useState<'rushed' | 'thorough'>('rushed'); // Slide 5
  const [expandedMatrixRow, setExpandedMatrixRow] = useState<number | null>(null); // Slide 12

  useEffect(() => { injectGlowStyle(); }, []);
  useEffect(() => { setVisitedSlides((prev) => new Set(prev).add(currentSlide)); }, [currentSlide]);

  // Auto-dismiss tooltip after 8s or on first fullscreen
  useEffect(() => {
    if (isFullscreen) { setShowFsTooltip(false); return; }
    const t = setTimeout(() => setShowFsTooltip(false), 8000);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < totalSlides) onSlideChange(currentSlide + 1);
      if (e.key === 'ArrowLeft' && currentSlide > 1) onSlideChange(currentSlide - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSlide, totalSlides, onSlideChange]);

  const goToSlide = useCallback((i: number) => { if (i >= 1 && i <= totalSlides) onSlideChange(i); }, [totalSlides, onSlideChange]);
  const isLastSlide = currentSlide === totalSlides;
  const s = slides[currentSlide - 1];
  if (!s) return null;

  const fs = isFullscreen;

  /* ════════════════════════════════════════════════════
     CONCEPT VISUAL PANELS (L2)
     ════════════════════════════════════════════════════ */
  const renderConceptVisual = (visualId: string, _fs: boolean) => {
    switch (visualId) {
      case 'l2-adoption-gap':
        return (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>THE ADOPTION GAP</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#4A5568', marginBottom: 4, fontWeight: 600 }}>Individual AI usage</div>
              <div style={{ height: 28, background: 'linear-gradient(90deg, #38B2AC, #2C9A94)', borderRadius: 6, width: '90%', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 700 }}>HIGH</span>
              </div>
            </div>
            <div style={{ borderLeft: '2px dashed #FC8181', marginLeft: 20, padding: '6px 0 6px 14px', fontSize: 11, color: '#FC8181', fontWeight: 700 }}>Untapped value</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#4A5568', marginBottom: 4, fontWeight: 600 }}>Team-wide standardised AI tools</div>
              <div style={{ height: 28, background: '#A0AEC0', borderRadius: 6, width: '25%', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 700 }}>LOW</span>
              </div>
            </div>
          </div>
        );

      case 'l2-diverging-paths':
        return (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>SAME TASK, THREE PEOPLE</div>
            <div style={{ background: '#1A202C', borderRadius: 8, padding: '8px 12px', marginBottom: 14, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#A8F0E0', fontWeight: 700 }}>Weekly status update</span>
            </div>
            {[
              { who: 'You prompt', result: 'Output A', color: '#38B2AC' },
              { who: 'You prompt again', result: 'Output B (different format)', color: '#ED8936' },
              { who: 'Colleague prompts', result: 'Output C (completely different)', color: '#FC8181' },
            ].map((path, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 28, background: path.color, borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#718096', fontWeight: 600 }}>{path.who}</div>
                  <div style={{ fontSize: 11, color: '#1A202C', fontWeight: 600 }}>{path.result}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'l2-level-comparison':
        return (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>THE SHIFT</div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 12, background: '#FFFFFF' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', marginBottom: 6 }}>LEVEL 1</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['Prompt', 'Answer', 'Done'].map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ fontSize: 11, color: '#718096', fontWeight: 600, padding: '4px 10px', background: '#F7FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>{step}</span>
                    {i < 2 && <span style={{ color: '#A0AEC0', fontSize: 12 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ border: '2px solid #38B2AC', borderRadius: 10, padding: '12px 14px', background: '#E6FFFA' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', marginBottom: 6 }}>LEVEL 2</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {['Defined Input', 'System Prompt', 'Structured Output'].map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ fontSize: 11, color: '#1A202C', fontWeight: 600, padding: '4px 10px', background: '#FFFFFF', borderRadius: 6, border: '1px solid #38B2AC44' }}>{step}</span>
                    {i < 2 && <span style={{ color: '#38B2AC', fontSize: 12 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#38B2AC' }}>
                <span>↻ Reusable</span>
                <span style={{ color: '#E2E8F0' }}>·</span>
                <span>👥 Shareable</span>
                <span style={{ color: '#E2E8F0' }}>·</span>
                <span>✓ Consistent</span>
              </div>
            </div>
          </div>
        );

      case 'l2-three-layers':
        return (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>AGENT ANATOMY</div>
            {[
              { label: 'INPUT', desc: 'What goes in. Data format, required fields, what the user provides.', color: '#667EEA', light: '#EBF4FF' },
              { label: 'PROCESSING', desc: 'How it behaves. System prompt: role, task, steps, checks.', color: '#38B2AC', light: '#E6FFFA' },
              { label: 'OUTPUT', desc: 'What comes out. Structured format, JSON schema, consistent fields.', color: '#48BB78', light: '#F0FFF4' },
            ].map((layer, i) => (
              <React.Fragment key={i}>
                <div style={{ borderLeft: `3px solid ${layer.color}`, background: layer.light, borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: i < 2 ? 4 : 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: layer.color, letterSpacing: '0.08em', marginBottom: 2 }}>{layer.label}</div>
                  <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.4 }}>{layer.desc}</div>
                </div>
                {i < 2 && <div style={{ textAlign: 'center', color: '#A0AEC0', fontSize: 14, margin: '2px 0' }}>↓</div>}
              </React.Fragment>
            ))}
          </div>
        );

      case 'l2-hitl-output':
        return (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>ACCOUNTABILITY IN OUTPUT</div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#4A5568', lineHeight: 1.6, position: 'relative' }}>
              <div style={{ marginBottom: 8 }}>Project Alpha: <strong>On track</strong></div>
              {[
                { label: 'Source cited', color: '#38B2AC', text: '[email from J. Lee, 7 Mar]' },
                { label: 'Confidence scored', color: '#667EEA', text: '0.85' },
                { label: 'Reasoning shown', color: '#ED8936', text: 'Based on tracker + email alignment' },
                { label: 'Anomaly flagged', color: '#FC8181', text: 'No update since 28 Feb' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#FFFFFF', background: item.color, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: '#718096', fontStyle: 'italic' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'l2-hub-spoke':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>BUILD ONCE, SHARE ALWAYS</div>
            {/* Centre: Agent node */}
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#38B2AC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#FFFFFF', fontWeight: 700 }}>⚙</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1A202C', marginTop: 4 }}>Agent</div>
              <div style={{ fontSize: 9, color: '#38B2AC', fontWeight: 600, background: '#E6FFFA', padding: '2px 8px', borderRadius: 4, marginTop: 2 }}>+ Agent Card</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {['Team member 1', 'Team member 2', 'Team member 3', 'New joiner'].map((user, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 2, height: 16, background: '#E2E8F0' }} />
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 3 ? '#F7E8A4' : '#F7FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                  <div style={{ fontSize: 9, color: i === 3 ? '#8A6A00' : '#718096', fontWeight: i === 3 ? 700 : 400 }}>{user}</div>
                  {i === 3 && <div style={{ fontSize: 8, color: '#8A6A00', fontWeight: 600 }}>5 min to productive</div>}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ════════════════════════════════════════════════════
     SLIDE RENDERERS
     ════════════════════════════════════════════════════ */
  const renderSlide = () => {
    switch (s.type) {

      /* ── Course Intro (slide 0) ── */
      case 'courseIntro':
        return (
          <div style={{ background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: fs ? '60px 80px' : '32px 40px' }}>
            <div style={{ maxWidth: 620 }}>
              {s.levelNumber && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1A6B5F', background: '#A8F0E0', padding: '3px 10px', borderRadius: 16, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 16 }}>LEVEL {s.levelNumber} {'\u00B7'} E-LEARNING</span>
              )}
              <h1 style={{ fontSize: fs ? 28 : 26, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px', lineHeight: 1.2 }}>{s.heading}</h1>
              {s.subheading && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: '8px 0 0', lineHeight: 1.6, maxWidth: 480 }}>{s.subheading}</p>}
              {s.objectives && (
                <div style={{ textAlign: 'left', marginTop: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>WHAT YOU'LL LEARN</div>
                  {s.objectives.map((obj: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#38B2AC', fontSize: 14, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{'\u25B8'}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{obj}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Meta pills */}
            {s.meta && (
              <div style={{ position: 'absolute', bottom: 24, left: 32, display: 'flex', gap: 8 }}>
                {s.meta.map((m: string, i: number) => (
                  <span key={i} style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{m}</span>
                ))}
              </div>
            )}
          </div>
        );

      /* ── Evidence (stat cards with real logos & descriptions) ── */
      case 'evidence':
        return (
          <div style={{ padding: fs ? '40px 60px' : '24px 32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 26 : 20)}
            {s.body && <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7, margin: '0 0 16px' }}>{s.body}</p>}
            {s.stats && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.stats.length}, 1fr)`, gap: 16, flex: 1 }}>
                {s.stats.map((stat, i) => (
                  <div key={i} style={{ background: 'linear-gradient(180deg, #F7FAFC 0%, #FFFFFF 100%)', border: '1px solid #E2E8F0', borderRadius: 14, padding: fs ? '24px 20px' : '18px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Logo */}
                    {stat.logoPath && (
                      <div style={{ marginBottom: 10, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={stat.logoPath} alt={stat.source} style={{ height: 24, maxWidth: 120, objectFit: 'contain', opacity: 0.85 }} />
                      </div>
                    )}
                    {/* Big stat value */}
                    <div style={{ fontSize: fs ? 56 : 46, fontWeight: 800, color: stat.valueColour, lineHeight: 1, letterSpacing: '-0.02em' }}>{stat.value}</div>
                    {/* Stat label */}
                    <div style={{ fontSize: fs ? 14 : 13, color: '#4A5568', lineHeight: 1.4, margin: '10px 0 6px', maxWidth: 220, fontWeight: 600 }}>{stat.label}</div>
                    {/* Description */}
                    {stat.desc && (
                      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5, maxWidth: 220, marginTop: 4 }}>{stat.desc}</div>
                    )}
                    {/* Source */}
                    <div style={{ fontSize: 10, color: '#A0AEC0', fontStyle: 'italic', marginTop: 6 }}>{stat.source}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Bottom insight bar */}
            <div className="insight-pulse" style={{ marginTop: 14, padding: '12px 20px', background: 'linear-gradient(135deg, #1A202C, #2D3748)', borderRadius: 12, textAlign: 'center', border: '1px solid #38B2AC33' }}>
              <span style={{ fontSize: 13, color: '#A0AEC0' }}>The gap between </span>
              <span style={{ fontSize: 13, color: '#38B2AC', fontWeight: 700 }}>AI adoption</span>
              <span style={{ fontSize: 13, color: '#A0AEC0' }}> and </span>
              <span style={{ fontSize: 13, color: '#FC8181', fontWeight: 700 }}>AI skill</span>
              <span style={{ fontSize: 13, color: '#A0AEC0' }}> is the opportunity this module addresses.</span>
            </div>
          </div>
        );

      /* ── Evidence Hero (Slide 2 — two-column: text + big stat card) ── */
      case 'evidenceHero': {
        const stat = s.stats?.[0];
        return (
          <div style={{ padding: fs ? '36px 56px' : '20px 28px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 20, flex: 1, alignItems: 'center' }}>
              {/* Left */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{s.section}</div>
                {renderTealHeading(s.heading, s.tealWord, fs ? 22 : 18)}
                {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, maxWidth: 380, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right — stat card */}
              {stat && (
                <div style={{ padding: '28px 36px', borderRadius: 20, background: 'linear-gradient(135deg, #E6FFFA, #fff)', border: '2px solid #38B2AC', boxShadow: '0 0 32px rgba(56,178,172,0.25), 0 0 0 1px rgba(56,178,172,0.3)', textAlign: 'center', animation: 'fadeInUp 0.4s ease' }}>
                  <div style={{ fontSize: 24, color: '#38B2AC', marginBottom: 4 }}>{'\u2191'}</div>
                  <div style={{ fontSize: 56, fontWeight: 800, color: '#38B2AC', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#4A5568', marginTop: 8, maxWidth: 180, margin: '8px auto 0' }}>{stat.label}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px' }}>
                    {stat.logoPath && <img src={stat.logoPath} alt={stat.source} style={{ height: 18, maxWidth: 100, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span style={{ fontWeight: 700, fontSize: 11, color: '#1A202C' }}>{stat.source}</span>
                  </div>
                </div>
              )}
            </div>
            {/* Bottom insight bar */}
            {s.pullQuote && (
              <div style={{ marginTop: 14, padding: '12px 20px', borderLeft: '3px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>
                {s.pullQuote.split(/(\d+%)/).map((part, i) => /^\d+%$/.test(part) ? <span key={i} style={{ color: '#38B2AC', fontWeight: 800 }}>{part}</span> : <span key={i}>{part}</span>)}
              </div>
            )}
          </div>
        );
      }

      /* ── Chart (Slide 3 — two-column: text + bar chart) ── */
      case 'chart':
        return (
          <div style={{ padding: fs ? '36px 56px' : '20px 28px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {renderTealHeading(s.heading, s.tealWord, fs ? 22 : 18)}
                {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right — grouped bar chart */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 200, gap: 12 }}>
                  {[
                    { label: '6 months ago', usage: 40, quality: 35, future: false },
                    { label: 'Today', usage: 70, quality: 65, future: false },
                    { label: 'In 12 months', usage: 85, quality: 90, future: true },
                  ].map((tp, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180 }}>
                        <div style={{ width: 28, height: `${tp.usage}%`, background: '#38B2AC', borderRadius: '4px 4px 0 0', opacity: tp.future ? 0.4 : 1, border: tp.future ? '1px dashed #38B2AC' : 'none', transition: 'height 0.5s ease' }} />
                        <div style={{ width: 28, height: `${tp.quality}%`, background: '#1A202C', borderRadius: '4px 4px 0 0', opacity: tp.future ? 0.4 : 1, border: tp.future ? '1px dashed #1A202C' : 'none', transition: 'height 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#A0AEC0', textAlign: 'center', marginTop: 6 }}>{tp.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}><span style={{ width: 10, height: 10, background: '#38B2AC', borderRadius: 2, display: 'inline-block' }} /> Usage</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}><span style={{ width: 10, height: 10, background: '#1A202C', borderRadius: 2, display: 'inline-block' }} /> Expected output quality</span>
                </div>
              </div>
            </div>
            {/* Key Insight */}
            {s.pullQuote && (
              <div className="insight-pulse" style={{ marginTop: 14, padding: '14px 20px', background: 'linear-gradient(135deg, #1A3A38, #1A202C)', borderRadius: 10, border: '1px solid #38B2AC44' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>KEY INSIGHT</div>
                <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>{s.pullQuote}</div>
              </div>
            )}
          </div>
        );

      /* ── Pyramid (Slide 4 — two-column: text + pyramid stack) ── */
      case 'pyramid': {
        const pyramidLayers = [
          { label: 'Applications', width: '38%', fill: '#E2E8F0', border: '1px solid #CBD5E0', fontWeight: 600, fontSize: 12, color: '#4A5568' },
          { label: 'Dashboards', width: '50%', fill: '#FBCEB1', border: '1px solid #E8A882', fontWeight: 600, fontSize: 12, color: '#4A5568' },
          { label: 'Workflows', width: '65%', fill: '#F7E8A4', border: '1px solid #D4C070', fontWeight: 600, fontSize: 12, color: '#4A5568' },
          { label: 'AI Agents', width: '82%', fill: '#C3D0F5', border: '1px solid #A0B4E8', fontWeight: 600, fontSize: 12, color: '#4A5568' },
          { label: 'Prompting', width: '100%', fill: '#38B2AC', border: '2px solid #2C9A94', fontWeight: 800, fontSize: 13, color: '#FFFFFF', active: true },
        ];
        return (
          <div style={{ padding: fs ? '36px 56px' : '20px 28px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {renderTealHeading(s.heading, s.tealWord, fs ? 22 : 18)}
                {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: '0 0 14px' }}>{s.body}</p>}
                {s.pullQuote && (
                  <div style={{ borderLeft: '3px solid #38B2AC', paddingLeft: 12, fontSize: 12, color: '#718096', lineHeight: 1.6, fontStyle: 'italic' }}>{s.pullQuote}</div>
                )}
              </div>
              {/* Right — pyramid */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                {pyramidLayers.map((layer, i) => (
                  <div key={i} style={{ width: layer.width, margin: '0 auto', padding: '8px 14px', borderRadius: 6, background: layer.fill, border: layer.border, textAlign: 'center', fontSize: layer.fontSize, fontWeight: layer.fontWeight, color: layer.color, position: 'relative' }}>
                    {layer.label}
                    {layer.active && <span style={{ position: 'absolute', right: -90, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#2C9A94', fontWeight: 700, whiteSpace: 'nowrap' }}>{'\u25B8'} You are here</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      /* ── Scenario Comparison (Slide 5 — two-column: context + tabbed output) ── */
      case 'scenarioComparison': {
        const tabData = s.tabs || [];
        const rushedTab = tabData[0];
        const thoroughTab = tabData[1];
        const activeTab = scenarioTab === 'rushed' ? rushedTab : thoroughTab;
        return (
          <div style={{ padding: fs ? '28px 48px' : '16px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left — static context */}
              <div style={{ background: '#1A202C', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>SCENARIO</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>{s.heading}</div>
                {s.body && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 14 }}>{s.body}</div>}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 0 14px' }} />
                {s.footnote && <div style={{ fontSize: 12, color: '#38B2AC', fontStyle: 'italic' }}>{s.footnote}</div>}
              </div>
              {/* Right — tabbed toggle */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: 12 }}>
                  {(['rushed', 'thorough'] as const).map((tab) => (
                    <button key={tab} onClick={() => setScenarioTab(tab)} style={{
                      padding: '8px 16px', fontSize: 12, fontWeight: scenarioTab === tab ? 700 : 500, border: 'none', background: 'none', cursor: 'pointer',
                      color: scenarioTab === tab ? '#1A202C' : '#A0AEC0',
                      borderBottom: scenarioTab === tab ? '3px solid #38B2AC' : '3px solid transparent', marginBottom: -2,
                    }}>
                      {tab === 'rushed' ? 'Rushed Handover' : 'Thorough Onboarding'}
                    </button>
                  ))}
                </div>
                {activeTab && (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>BRIEFING</div>
                      <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: `3px solid ${scenarioTab === 'rushed' ? '#A0AEC0' : '#38B2AC'}`, borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: 13, fontStyle: 'italic', color: '#2D3748', lineHeight: 1.6 }}>
                        <ExpandableText text={activeTab.prompt} maxLen={200} id={`sc-prompt-${scenarioTab}`} expanded={!!expandedSections[`sc-prompt-${scenarioTab}`]} onToggle={(id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>OUTPUT</div>
                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: scenarioTab === 'rushed' ? '#A0AEC0' : '#2D3748', lineHeight: 1.6 }}>
                        <ExpandableText text={activeTab.annotation} maxLen={200} id={`sc-output-${scenarioTab}`} expanded={!!expandedSections[`sc-output-${scenarioTab}`]} onToggle={(id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Key Insight */}
            {s.gapNote && (
              <div className="insight-pulse" style={{ marginTop: 14, padding: '14px 20px', background: 'linear-gradient(135deg, #1A3A38, #1A202C)', borderRadius: 10, border: '1px solid #38B2AC44' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>KEY INSIGHT</div>
                <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>{s.gapNote}</div>
              </div>
            )}
          </div>
        );
      }

      /* ── Context Bar (Slide 6 — interactive sequential reveal via Next button) ── */
      case 'contextBar': {
        const BLUEPRINT = [
          { key: 'ROLE', color: '#667EEA', light: '#EBF4FF', label: 'Who should the AI be?', detail: 'Tells the AI the expertise level and perspective to adopt', example: 'A senior professional with transformation experience', impact: 'Without this \u2192 generic assistant voice' },
          { key: 'CONTEXT', color: '#38B2AC', light: '#E6FFFA', label: "What's the situation?", detail: 'Background, constraints, and what matters to the audience', example: 'Six weeks into rollout. Leadership cares about risk.', impact: 'Without this \u2192 no audience awareness' },
          { key: 'TASK', color: '#ED8936', light: '#FFFBEB', label: 'What exactly to produce?', detail: 'Specific, unambiguous deliverable', example: 'Draft a stakeholder update covering progress, risks, next steps', impact: 'Without this \u2192 vague, unfocused output' },
          { key: 'FORMAT', color: '#48BB78', light: '#F0FFF4', label: 'What shape and tone?', detail: 'Length, structure, style, constraints', example: 'Three short paragraphs. Professional tone. Max 300 words.', impact: 'Without this \u2192 wrong length, wrong tone' },
          { key: 'STEPS', color: '#9F7AEA', light: '#FAF5FF', label: 'How should it think?', detail: 'The reasoning sequence to follow', example: 'First assess impact, then identify risks, then recommend actions', impact: 'Without this \u2192 random ordering' },
          { key: 'CHECKS', color: '#F6AD55', light: '#FFFBEB', label: 'What rules must it follow?', detail: 'Validation constraints and quality gates', example: 'No generic phrases. Reference specific data points.', impact: 'Without this \u2192 filler and assumptions' },
        ];
        const levelLabels = ['Empty', 'Minimal', 'Basic', 'Good', 'Rich', 'Strong', 'Complete'];
        const barColor = contextStep <= 1 ? '#A0AEC0' : contextStep <= 3 ? '#FBCEB1' : '#38B2AC';
        return (
          <div style={{ padding: fs ? '28px 48px' : '16px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            {/* Header */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{s.section}</div>
              {renderTealHeading(s.heading, s.tealWord, fs ? 20 : 17)}
              {s.instruction && <p style={{ fontSize: 12, color: '#4A5568', margin: '0 0 12px' }}>{s.instruction}</p>}
            </div>
            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI CONTEXT LEVEL</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{levelLabels[contextStep]} — {contextStep}/6</span>
              </div>
              <div style={{ height: 10, background: '#E2E8F0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #FBCEB1, #38B2AC)', width: `${(contextStep / 6) * 100}%`, transition: 'width 400ms ease', borderRadius: 5 }} />
              </div>
            </div>
            {/* 3×2 grid of component cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flex: 1, alignContent: 'start' }}>
              {BLUEPRINT.map((bp, i) => {
                const revealed = i < contextStep;
                return (
                  <div key={bp.key} style={{
                    padding: '10px 12px', borderRadius: 10,
                    border: `1px solid ${revealed ? bp.color + '55' : '#E2E8F0'}`,
                    background: revealed ? bp.light : '#F7FAFC',
                    opacity: revealed ? 1 : 0.35,
                    transition: 'all 0.3s ease',
                    animation: revealed ? 'fadeInUp 0.2s ease' : 'none',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: bp.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{bp.key}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1A202C', marginBottom: 3 }}>{bp.label}</div>
                    <div style={{ fontSize: 10, color: '#4A5568', lineHeight: 1.4, marginBottom: 3 }}>{bp.detail}</div>
                    {revealed && (
                      <>
                        <div style={{ fontSize: 9, color: '#718096', fontStyle: 'italic', lineHeight: 1.35, borderTop: '1px solid #E2E8F0', paddingTop: 4, marginBottom: 3 }}>"{bp.example}"</div>
                        <div style={{ fontSize: 9, color: bp.color, lineHeight: 1.35, padding: '3px 6px', background: '#FFFFFF', borderRadius: 4, border: `1px solid ${bp.color}22` }}>{bp.impact}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Bottom instruction or insight */}
            {contextStep < 6 ? (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#A0AEC0' }}>Press Next to reveal each component {'\u2192'}</span>
              </div>
            ) : (
              <div className="insight-pulse" style={{ marginTop: 10, padding: '14px 20px', background: 'linear-gradient(135deg, #1A3A38, #1A202C)', borderRadius: 10, border: '1px solid #38B2AC44' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>KEY INSIGHT</div>
                <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>Complete briefing. Every component eliminated a specific assumption the AI would otherwise have made.</div>
              </div>
            )}
          </div>
        );
      }

      /* ── Persona (Slides 7–11 — two-column: context + prompt/output) ── */
      case 'persona': {
        const p = s.personaData;
        if (!p) return null;
        const toggleExpand = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
        return (
          <div style={{ padding: fs ? '24px 40px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left — context panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>{p.initial}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C' }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#718096' }}>{p.role}</div>
                  </div>
                </div>
                <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: p.color, padding: '4px 12px', borderRadius: 16 }}>{p.approach}</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.tags.map((tag, i) => <span key={i} style={{ fontSize: 10, color: '#A0AEC0', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2px 8px' }}>{tag}</span>)}
                </div>
                <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: 0 }}>{p.approachDef}</p>
                <div style={{ borderLeft: '3px solid #38B2AC', paddingLeft: 10, fontSize: 12, color: '#718096', fontStyle: 'italic' }}>Best for: {p.bestFor}</div>
                {p.modifier && (
                  <div style={{ background: '#FFFFFF', borderLeft: `3px solid ${p.color}`, padding: '8px 12px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color }}>+ {p.modifier}</div>
                    {p.modDef && <div style={{ fontSize: 11, color: '#718096' }}>{p.modDef}</div>}
                  </div>
                )}
              </div>
              {/* Right — prompt + output */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EXAMPLE PROMPT</div>
                  <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: `3px solid ${p.color}`, borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: 13, fontStyle: 'italic', color: '#2D3748', lineHeight: 1.6 }}>
                    <ExpandableText text={p.prompt} maxLen={180} id={`persona-prompt-${p.name}`} expanded={!!expandedSections[`persona-prompt-${p.name}`]} onToggle={toggleExpand} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>AI OUTPUT</div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#2D3748', lineHeight: 1.6 }}>
                    <ExpandableText text={p.output} maxLen={200} id={`persona-output-${p.name}`} expanded={!!expandedSections[`persona-output-${p.name}`]} onToggle={toggleExpand} />
                  </div>
                </div>
                <div style={{ marginTop: 'auto', fontSize: 11, fontStyle: 'italic', color: '#718096' }}>
                  <span style={{ color: '#38B2AC', marginRight: 4 }}>{'\u2022'}</span>{p.why}
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ── Situation Matrix (Slide 12 — full-width table with expandable rows) ── */
      case 'situationMatrix': {
        const SITUATIONS = [
          { label: 'Unstructured inputs, unknown output', example: "You have rough notes from a workshop and don't yet know what the deliverable should be" },
          { label: 'Exploratory work, evolving direction', example: "You're drafting a proposal and aren't sure of the right angle yet \u2014 you want to think through options" },
          { label: 'Repeatable, high-stakes, known format', example: 'You write the same executive update every Friday \u2014 same audience, same structure' },
          { label: 'Complex reasoning needed', example: 'You need the AI to work through a trade-off or a multi-step problem before giving you an answer' },
          { label: 'Quality/style calibration required', example: 'You want the output to match the tone of a previous document or a specific writing style' },
          { label: 'Close but needs refinement', example: "The first output is 70% there \u2014 you want to sharpen one section without starting again" },
        ];
        const MATRIX = [
          ['\u2605', '\u25D0', '\u25CB', '\u25D0', '\u25CB', '\u25CB'],
          ['\u25D0', '\u2605', '\u25CB', '\u25D0', '\u25D0', '\u2605'],
          ['\u25CB', '\u25D0', '\u2605', '\u2605', '\u25D0', '\u25D0'],
          ['\u25D0', '\u25D0', '\u2605', '\u2605', '\u25D0', '\u25D0'],
          ['\u25CB', '\u25D0', '\u25D0', '\u25CB', '\u2605', '\u25D0'],
          ['\u25CB', '\u2605', '\u25D0', '\u25D0', '\u25D0', '\u2605'],
        ];
        const COLS = ['Brain Dump', 'Conversational', 'Blueprint', '+ Chain of Thought', '+ Few-Shot', '+ Iterative'];
        const ratingColor = (sym: string) => sym === '\u2605' ? '#38B2AC' : sym === '\u25D0' ? '#ED8936' : '#A0AEC0';
        return (
          <div style={{ padding: fs ? '24px 36px' : '12px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 18 : 16)}
            {s.instruction && <p style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5, margin: '0 0 6px' }}>{s.instruction}</p>}
            <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 10, color: '#718096' }}>
              <span><span style={{ color: '#38B2AC', fontWeight: 700 }}>{'\u2605'}</span> Best fit</span>
              <span><span style={{ color: '#ED8936', fontWeight: 700 }}>{'\u25D0'}</span> Can work</span>
              <span><span style={{ color: '#A0AEC0' }}>{'\u25CB'}</span> Not ideal</span>
            </div>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #E2E8F0', fontSize: 10, color: '#A0AEC0', fontWeight: 600, minWidth: 160 }}>Situation</th>
                    {COLS.map((col, i) => (
                      <th key={i} style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '2px solid #E2E8F0', fontSize: 9, fontWeight: 700, minWidth: 60, color: i >= 3 ? '#2B6CB0' : '#1A202C', background: i >= 3 ? '#EBF8FF' : '#F7FAFC', borderLeft: i === 3 ? '1px solid #BEE3F8' : 'none' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SITUATIONS.map((sit, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                      <tr onClick={() => setExpandedMatrixRow(expandedMatrixRow === rowIdx ? null : rowIdx)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #E2E8F0', fontSize: 10, color: '#4A5568', fontWeight: 500 }}>
                          {sit.label}
                          <span style={{ marginLeft: 4, fontSize: 8, color: '#A0AEC0' }}>{expandedMatrixRow === rowIdx ? '\u25B4' : '\u25BE'}</span>
                        </td>
                        {MATRIX[rowIdx].map((sym, colIdx) => (
                          <td key={colIdx} style={{ padding: '6px 4px', borderBottom: '1px solid #E2E8F0', textAlign: 'center', borderLeft: colIdx === 3 ? '1px solid #BEE3F8' : 'none' }}>
                            <span style={{ fontSize: 16, color: ratingColor(sym), fontWeight: 700 }}>{sym}</span>
                          </td>
                        ))}
                      </tr>
                      {expandedMatrixRow === rowIdx && (
                        <tr>
                          <td colSpan={7} style={{ background: '#F7FAFC', borderTop: '1px solid #E2E8F0', padding: '8px 16px 8px 14px', fontSize: 11, color: '#4A5568', lineHeight: 1.5 }}>
                            {sit.example}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      /* ── SJ Exercise (Slides 13–15 — two-column: situation + question/options) ── */
      case 'sjExercise': {
        const sj = s.sjData;
        if (!sj) return null;
        const slideKey = currentSlide;
        const selectedOpt = sjAnswers[slideKey] ?? null;
        const checked = sjChecked[slideKey] ?? false;
        return (
          <div style={{ padding: fs ? '24px 40px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left — situation card */}
              <div style={{ background: '#1A202C', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>SITUATION {sj.situationNum} OF 3</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>{sj.heading}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 14 }}>{sj.body}</div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
                  {sj.bullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#38B2AC', flexShrink: 0 }} />{b}
                    </div>
                  ))}
                </div>
              </div>
              {/* Right — question + options + feedback */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 12 }}>Which prompting approach fits best?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {sj.options.map((opt, i) => {
                    const isSelected = selectedOpt === i;
                    const isCorrect = checked && i === sj.correct;
                    const isWrong = checked && isSelected && i !== sj.correct;
                    return (
                      <button key={i} onClick={() => { if (!checked) setSjAnswers(prev => ({ ...prev, [slideKey]: i })); }} style={{
                        width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: checked ? 'default' : 'pointer',
                        border: isCorrect ? '2px solid #48BB78' : isWrong ? '2px solid #FC8181' : isSelected ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                        background: isCorrect ? '#F0FFF4' : isWrong ? '#FFF5F5' : isSelected ? '#E6FFFA' : '#FFFFFF',
                        fontSize: 13, fontWeight: 600, color: '#1A202C', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        {opt}
                        {isCorrect && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#48BB78', background: '#C6F6D5', padding: '2px 8px', borderRadius: 10 }}>{'\u2605'} Best fit</span>}
                      </button>
                    );
                  })}
                </div>
                {!checked && selectedOpt !== null && (
                  <button onClick={() => setSjChecked(prev => ({ ...prev, [slideKey]: true }))} style={{ alignSelf: 'flex-start', padding: '9px 22px', borderRadius: 24, border: 'none', background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Check Answer
                  </button>
                )}
                {checked && sj.feedback[selectedOpt!] && (
                  <div style={{
                    borderRadius: 10, padding: '12px 14px', marginTop: 8,
                    background: '#F7FAFC', border: '1px solid #E2E8F0',
                    borderLeft: selectedOpt === sj.correct ? '4px solid #48BB78' : '4px solid #ED8936',
                  }}>
                    <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>{sj.feedback[selectedOpt!]}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      /* ── Parallel Demo (no dropdowns — all content visible) ── */
      case 'parallelDemo':
        return (
          <div style={{ padding: fs ? '40px 60px' : '24px 32px' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 24 : 19)}
            {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, margin: '0 0 14px' }}>{s.body}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ borderRadius: 12, border: '1px solid #FC818144', background: '#FFF5F5', padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FC8181', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>APPROACH 1 — UNSTRUCTURED</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', marginBottom: 4 }}>Prompt</div>
                <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 10, fontSize: 12, color: '#4A5568', lineHeight: 1.6, border: '1px solid #E2E8F0', marginBottom: 8, whiteSpace: 'pre-line' }}>{s.approach1Prompt}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', marginBottom: 4 }}>Output</div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{s.approach1OutputPreview}</div>
              </div>
              <div style={{ borderRadius: 12, border: '1px solid #38B2AC44', background: '#E6FFFA', padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>APPROACH 2 — STRUCTURED</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', marginBottom: 4 }}>Prompt</div>
                <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 10, fontSize: 12, color: '#4A5568', lineHeight: 1.6, border: '1px solid #E2E8F0', marginBottom: 8, whiteSpace: 'pre-line' }}>{s.approach2PromptFull || s.approach2PromptPreview}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', marginBottom: 4 }}>Output</div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{s.approach2OutputPreview}</div>
              </div>
            </div>
            {s.footnote && <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.6, margin: '10px 0 0', textAlign: 'center', fontStyle: 'italic' }}>{s.footnote}</p>}
          </div>
        );

      /* ── Tension Statement (single line, vertically centred) ── */
      case 'tensionStatement':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', padding: '40px 60px' }}>
            <h2 style={{ fontSize: fs ? 32 : 26, fontWeight: 800, color: '#1A202C', lineHeight: 1.3, margin: '0 0 14px', maxWidth: 700, whiteSpace: 'nowrap' }}>{s.heading}</h2>
            {s.subheading && (
              <p style={{ fontSize: fs ? 20 : 17, color: '#1A202C', lineHeight: 1.5, maxWidth: 700, margin: '0 0 24px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {s.tealPhrase ? <TealPhrase text={s.subheading} phrase={s.tealPhrase} /> : s.subheading}
              </p>
            )}
            {s.footnote && <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.7, maxWidth: 520, margin: 0 }}>{s.footnote}</p>}
          </div>
        );

      /* ── Gap Diagram (annotated prompt with RCTF underlines + animated insight) ── */
      case 'gapDiagram':
        return (
          <div style={{ padding: fs ? '28px 48px' : '16px 28px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              {renderTealHeading(s.heading, s.tealWord, fs ? 22 : 18)}
              {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: '0 0 12px' }}>{s.body}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0, marginBottom: 10 }}>
              {/* Limited Context */}
              <div style={{ borderRadius: 12, border: '1px solid #FC818133', background: '#FFF5F5', padding: 14, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FC8181', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>LIMITED CONTEXT</div>
                {s.badPrompt && (
                  <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 10, fontSize: 12, color: '#4A5568', lineHeight: 1.6, border: '1px solid #E2E8F0', marginBottom: 10, whiteSpace: 'pre-line' }}>{s.badPrompt}</div>
                )}
                <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: 3 }}><span style={{ fontWeight: 600 }}>No role</span> — AI uses a generic voice</div>
                  <div style={{ marginBottom: 3 }}><span style={{ fontWeight: 600 }}>No context</span> — AI fills gaps with assumptions</div>
                  <div style={{ marginBottom: 3 }}><span style={{ fontWeight: 600 }}>Vague task</span> — AI guesses the deliverable</div>
                  <div><span style={{ fontWeight: 600 }}>No format</span> — AI picks length, tone, structure</div>
                </div>
              </div>
              {/* Rich Context with annotated prompt */}
              <div style={{ borderRadius: 12, border: '1px solid #38B2AC33', background: '#E6FFFA', padding: 14, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>RICH CONTEXT</div>
                {s.goodPrompt && (
                  <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 10, fontSize: 12, color: '#4A5568', lineHeight: 1.7, border: '1px solid #E2E8F0', marginBottom: 10 }}>
                    <AnnotatedPrompt text={s.goodPrompt} annotations={s.promptAnnotations} />
                  </div>
                )}
                {/* Annotation legend */}
                {s.promptAnnotations && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
                    {s.promptAnnotations.map((ann, i) => (
                      <span key={i} style={{ fontSize: 9, fontWeight: 700, color: ann.color, background: `${ann.color}15`, padding: '2px 8px', borderRadius: 4, border: `1px solid ${ann.color}33` }}>{ann.component}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Animated key insight card */}
            {s.gapNote && (
              <div className="insight-pulse" style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #1A3A38, #1A202C)', borderRadius: 12, border: '1px solid #38B2AC44' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>KEY INSIGHT</div>
                <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>{s.gapNote}</div>
              </div>
            )}
          </div>
        );

      /* ── Toolkit Overview (Blueprint + Approaches + Amplifiers) ── */
      case 'toolkitOverview':
        return (
          <div style={{ padding: fs ? '36px 56px' : '20px 28px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 22 : 18)}
            {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: '0 0 16px' }}>{s.body}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {s.toolkitItems?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 18px', borderRadius: 14, border: `1px solid ${item.color}33`, background: `${item.color}06`, animation: `fadeInUp 0.4s ease ${i * 0.15}s both` }}>
                  <div style={{ fontSize: 32, flexShrink: 0, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${item.color}15`, borderRadius: 12 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginBottom: 4 }}>{item.desc}</div>
                    <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.4 }}><span style={{ fontWeight: 600, color: item.color }}>When to use:</span> {item.whenToUse}</div>
                    {item.relationship && (
                      <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 3, fontStyle: 'italic' }}>{item.relationship}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Relationship connector */}
            <div className="insight-pulse" style={{ marginTop: 12, padding: '10px 16px', background: 'linear-gradient(135deg, #1A3A38, #1A202C)', borderRadius: 10, textAlign: 'center', border: '1px solid #38B2AC33' }}>
              <span style={{ fontSize: 12, color: '#E2E8F0' }}>Blueprint = </span>
              <span style={{ fontSize: 12, color: '#667EEA', fontWeight: 700 }}>what to include</span>
              <span style={{ fontSize: 12, color: '#E2E8F0' }}> · Approaches = </span>
              <span style={{ fontSize: 12, color: '#ED8936', fontWeight: 700 }}>how to deliver</span>
              <span style={{ fontSize: 12, color: '#E2E8F0' }}> · Modifiers = </span>
              <span style={{ fontSize: 12, color: '#9F7AEA', fontWeight: 700 }}>how the AI thinks</span>
            </div>
          </div>
        );

      /* ── RCTF 3×2 grid (icons, no dropdowns — all visible) ── */
      case 'rctf':
        return (
          <div style={{ padding: fs ? '24px 40px' : '14px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 18 : 16)}
            {s.subheading && <p style={{ fontSize: 11, color: '#718096', lineHeight: 1.4, margin: '0 0 8px' }}>{s.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flex: 1, alignContent: 'center' }}>
              {s.elements?.map((el) => (
                <div key={el.key} style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${el.color}33`, background: el.light || `${el.color}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {el.icon && <span style={{ fontSize: 16 }}>{el.icon}</span>}
                    <span style={{ fontSize: 10, fontWeight: 800, color: el.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{el.key}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#4A5568', lineHeight: 1.4, marginBottom: 4 }}>{el.desc}</div>
                  {el.example && <div style={{ fontSize: 9, color: '#718096', fontStyle: 'italic', lineHeight: 1.35, borderTop: '1px solid #E2E8F0', paddingTop: 4, marginBottom: 3 }}>"{el.example}"</div>}
                  {el.whyItMatters && (
                    <div style={{ fontSize: 9, color: el.color, lineHeight: 1.35, padding: '3px 6px', background: '#FFFFFF', borderRadius: 4, border: `1px solid ${el.color}22` }}>
                      {el.whyItMatters}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      /* ── Persona Case Study (sliding cards) ── */
      case 'personaCaseStudy':
        return <PersonaCaseStudySlide slide={s} fs={fs} />;

      /* ── Approach Matrix ── */
      case 'approachMatrix':
        return <ApproachMatrixSlide slide={s} fs={fs} />;

      /* ── Situational Judgment (with persona framing & multi-step) ── */
      case 'situationalJudgment':
        return <SituationalJudgmentSlide slide={s} fs={fs} activeScenarioIdx={sjScenarioIdx} onScenarioChange={setSjScenarioIdx} />;

      /* ── Bridge ── */
      case 'bridge':
        return (
          <div style={{ display: 'flex', gap: 0, position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, background: '#38B2AC', padding: fs ? '48px 56px' : '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: fs ? 28 : 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.2 }}>{s.heading}</h2>
              <p style={{ fontSize: fs ? 16 : 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 0 16px' }}>{s.body}</p>
              {s.ctaText && s.ctaHref && (
                <a href={s.ctaHref} style={{ display: 'inline-block', background: '#FFFFFF', color: '#38B2AC', fontWeight: 700, fontSize: 14, padding: '10px 24px', borderRadius: 24, textDecoration: 'none', alignSelf: 'flex-start' }}>{s.ctaText}</a>
              )}
            </div>
            <div style={{ width: '40%', background: '#2C9A94', padding: fs ? '48px 40px' : '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {s.panelHeading && <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 12, lineHeight: 1.3 }}>{s.panelHeading}</div>}
              {s.panelItems && (
                <ul style={{ margin: 0, padding: '0 0 0 16px', listStyleType: 'disc' }}>
                  {s.panelItems.map((item, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 6 }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );

      /* ── Spectrum (3-position slider) ── */
      case 'spectrum':
        return (
          <div style={{ padding: fs ? '32px 48px' : '20px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 22 : 18)}
            {s.body && <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: '0 0 16px' }}>{s.body}</p>}
            {/* Spectrum track */}
            <div style={{ position: 'relative', height: 8, background: 'linear-gradient(90deg, #A8F0E0, #38B2AC)', borderRadius: 4, margin: '8px 0 16px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} onClick={() => setSpectrumPos(i)} style={{
                  position: 'absolute', top: '50%', left: `${i * 50}%`, transform: 'translate(-50%, -50%)',
                  width: spectrumPos === i ? 24 : 16, height: spectrumPos === i ? 24 : 16, borderRadius: '50%',
                  background: spectrumPos === i ? '#38B2AC' : '#FFFFFF', border: `2px solid ${spectrumPos === i ? '#2C9A94' : '#38B2AC'}`,
                  cursor: 'pointer', transition: 'all 0.2s ease', zIndex: 2,
                  boxShadow: spectrumPos === i ? '0 2px 8px rgba(56,178,172,0.4)' : 'none',
                }} />
              ))}
            </div>
            {/* Position labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              {s.positions?.map((p, i) => (
                <div key={i} onClick={() => setSpectrumPos(i)} style={{ cursor: 'pointer', textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center', flex: 1, padding: '0 4px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: spectrumPos === i ? '#38B2AC' : '#718096', transition: 'color 0.2s' }}>{p.label}</div>
                </div>
              ))}
            </div>
            {/* Active position panel */}
            {s.positions && s.positions[spectrumPos] && (
              <div key={spectrumPos} style={{ flex: 1, background: '#F7FAFC', borderLeft: '3px solid #38B2AC', borderRadius: '0 12px 12px 0', padding: '16px 20px', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>{s.positions[spectrumPos].label}</div>
                <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: '0 0 10px' }}>{s.positions[spectrumPos].desc}</p>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {s.positions[spectrumPos].example}
                </div>
              </div>
            )}
          </div>
        );

      /* ── Quiz (single MCQ with feedback) ── */
      case 'quiz':
        return (
          <div style={{ padding: fs ? '36px 60px' : '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            {s.quizEyebrow && <p style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{s.quizEyebrow}</p>}
            {s.question && <p style={{ fontSize: fs ? 18 : 16, fontWeight: 700, color: '#1A202C', lineHeight: 1.4, margin: '0 0 20px', maxWidth: 560 }}>{s.question}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {s.quizOptions?.map((opt, i) => {
                const isSelected = quizSelected === i;
                const isCorrect = quizAnswered && i === s.correct;
                const isWrong = quizAnswered && isSelected && i !== s.correct;
                return (
                  <button key={i} onClick={() => !quizAnswered && setQuizSelected(i)} style={{
                    padding: '12px 16px', borderRadius: 10, textAlign: 'left', cursor: quizAnswered ? 'default' : 'pointer',
                    border: isCorrect ? '2px solid #48BB78' : isWrong ? '2px solid #FC8181' : isSelected ? '2px solid #38B2AC' : '1px solid #E2E8F0',
                    background: isCorrect ? '#F0FFF4' : isWrong ? '#FFF5F5' : isSelected ? '#E6FFFA' : '#FFFFFF',
                    fontSize: 13, color: '#1A202C', fontWeight: isSelected ? 600 : 400, transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                  }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isCorrect ? '#48BB78' : isWrong ? '#FC8181' : isSelected ? '#38B2AC' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: isCorrect ? '#48BB78' : isWrong ? '#FC8181' : isSelected ? '#38B2AC' : '#A0AEC0' }}>
                      {isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {!quizAnswered && quizSelected !== null && (
              <button onClick={() => setQuizAnswered(true)} style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 24, border: 'none', background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Check Answer
              </button>
            )}
            {quizAnswered && s.explanation && (
              <div style={{ padding: '14px 18px', borderRadius: 10, background: quizSelected === s.correct ? '#F0FFF4' : '#FFF5F5', border: `1px solid ${quizSelected === s.correct ? '#9AE6B4' : '#FEB2B2'}`, animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: quizSelected === s.correct ? '#48BB78' : '#FC8181', marginBottom: 4 }}>
                  {quizSelected === s.correct ? 'Correct!' : 'Not quite'}
                </div>
                <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: 0 }}>{s.explanation}</p>
              </div>
            )}
          </div>
        );

      /* ── Comparison (3-tab view with expandable prompts) ── */
      case 'comparison':
        return (
          <div style={{ padding: fs ? '28px 48px' : '18px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 20 : 17)}
            {s.scenario && (
              <div style={{ background: '#1A202C', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600 }}>SCENARIO: </span>
                <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.5 }}>{s.scenario}</span>
              </div>
            )}
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: 14 }}>
              {s.tabs?.map((tab, i) => (
                <button key={i} onClick={() => setActiveCompTab(i)} style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                  color: activeCompTab === i ? '#38B2AC' : '#718096',
                  borderBottom: activeCompTab === i ? '3px solid #38B2AC' : '3px solid transparent',
                  marginBottom: -2, transition: 'all 0.15s ease',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Active tab content */}
            {s.tabs && s.tabs[activeCompTab] && (
              <div key={activeCompTab} style={{ flex: 1, animation: 'fadeInUp 0.2s ease' }}>
                <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: '3px solid #38B2AC', borderRadius: '0 8px 8px 0', padding: '12px 16px', fontSize: 12, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-line', marginBottom: 10 }}>
                  {(() => {
                    const prompt = s.tabs![activeCompTab].prompt;
                    const isLong = prompt.length > 180;
                    const isExpanded = expandedSections[`comp-${activeCompTab}`];
                    return (
                      <>
                        {isLong && !isExpanded ? prompt.slice(0, 180) + '…' : prompt}
                        {isLong && (
                          <button onClick={() => setExpandedSections(prev => ({ ...prev, [`comp-${activeCompTab}`]: !isExpanded }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 11, fontWeight: 600, color: '#718096', cursor: 'pointer', marginTop: 6, fontStyle: 'normal' }}>
                            {isExpanded ? 'Show less ▴' : 'Show full prompt ▾'}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ background: '#F7FAFC', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#718096', lineHeight: 1.6 }}>
                  {s.tabs[activeCompTab].annotation}
                </div>
              </div>
            )}
          </div>
        );

      /* ── Flipcard (two side-by-side flip cards) ── */
      case 'flipcard':
        return (
          <div style={{ padding: fs ? '28px 48px' : '18px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 20 : 17)}
            {s.instruction && <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>{s.instruction}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, alignItems: 'stretch' }}>
              {s.cards?.map((card, i) => {
                const isFlipped = flippedCards[i] || false;
                return (
                  <div key={i} onClick={() => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }))} style={{ perspective: 1000, cursor: 'pointer', minHeight: 200 }}>
                    <div className={`flip-card-inner${isFlipped ? ' flipped' : ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* Front */}
                      <div className="flip-card-face" style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid #FEB2B2', background: '#FFF5F5', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#FC8181', background: '#FED7D7', padding: '3px 10px', borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8, letterSpacing: '0.05em' }}>{card.frontBadge}</span>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>{card.frontLabel}</div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #FC8181', borderRadius: '0 8px 8px 0', padding: '10px 12px', fontSize: 11, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic', flex: 1 }}>
                          {card.frontPrompt}
                        </div>
                        <div style={{ fontSize: 10, color: '#A0AEC0', textAlign: 'center', marginTop: 8 }}>Click to flip ↺</div>
                      </div>
                      {/* Back */}
                      <div className="flip-card-face flip-card-back" style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid #9AE6B4', background: '#F0FFF4', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#48BB78', background: '#C6F6D5', padding: '3px 10px', borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8, letterSpacing: '0.05em' }}>{card.backBadge}</span>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>{card.backLabel}</div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #48BB78', borderRadius: '0 8px 8px 0', padding: '10px 12px', fontSize: 11, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic', flex: 1, overflowY: 'auto' }}>
                          {(() => {
                            const isLong = card.backPrompt.length > 160;
                            const isExpanded = expandedSections[`flip-${i}`];
                            return isLong && !isExpanded ? card.backPrompt.slice(0, 160) + '…' : card.backPrompt;
                          })()}
                          {card.backPrompt.length > 160 && (
                            <button onClick={(e) => { e.stopPropagation(); setExpandedSections(prev => ({ ...prev, [`flip-${i}`]: !prev[`flip-${i}`] })); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, border: '1px solid #E2E8F0', background: '#F7FAFC', fontSize: 10, fontWeight: 600, color: '#718096', cursor: 'pointer', marginTop: 4, fontStyle: 'normal' }}>
                              {expandedSections[`flip-${i}`] ? 'Less ▴' : 'More ▾'}
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5, marginTop: 8, padding: '8px 10px', background: '#E6FFFA', borderRadius: 6 }}>
                          {card.backResponse}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      /* ── Branching (scenario with 3 option cards) ── */
      case 'branching':
        return (
          <div style={{ padding: fs ? '24px 44px' : '16px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 20 : 17)}
            {s.scenario && (
              <div style={{ background: '#1A202C', borderRadius: 10, padding: '10px 16px', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.5 }}>{s.scenario}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
              {s.branchingOptions?.map((opt, i) => {
                const isSelected = branchingSelected === i;
                const qualityColors: Record<string, { bg: string; border: string; badge: string; badgeBg: string }> = {
                  strong: { bg: '#F0FFF4', border: '#9AE6B4', badge: '#48BB78', badgeBg: '#C6F6D5' },
                  partial: { bg: '#FFFBEB', border: '#F6E05E', badge: '#D69E2E', badgeBg: '#FEFCBF' },
                  weak: { bg: '#FFF5F5', border: '#FEB2B2', badge: '#FC8181', badgeBg: '#FED7D7' },
                };
                const qc = qualityColors[opt.responseQuality] || qualityColors.partial;
                return (
                  <div key={i}>
                    <button onClick={() => setBranchingSelected(isSelected ? null : i)} style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: isSelected ? `2px solid ${qc.border}` : '1px solid #E2E8F0',
                      background: isSelected ? qc.bg : '#FFFFFF', transition: 'all 0.15s ease',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>
                        {(() => {
                          const isLong = opt.prompt.length > 120;
                          const isExpanded = expandedSections[`branch-${i}`];
                          return isLong && !isExpanded ? opt.prompt.slice(0, 120) + '…' : opt.prompt;
                        })()}
                        {opt.prompt.length > 120 && (
                          <button onClick={(e) => { e.stopPropagation(); setExpandedSections(prev => ({ ...prev, [`branch-${i}`]: !prev[`branch-${i}`] })); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, border: '1px solid #E2E8F0', background: '#F7FAFC', fontSize: 10, fontWeight: 600, color: '#718096', cursor: 'pointer', marginLeft: 4 }}>
                            {expandedSections[`branch-${i}`] ? '▴' : '▾'}
                          </button>
                        )}
                      </div>
                    </button>
                    {isSelected && (
                      <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: qc.bg, border: `1px solid ${qc.border}`, animation: 'fadeInUp 0.3s ease' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: qc.badge, background: qc.badgeBg, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {opt.responseQuality === 'strong' ? 'Strong approach' : opt.responseQuality === 'partial' ? 'Partial approach' : 'Limited approach'}
                        </span>
                        <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, margin: '8px 0' }}>{opt.response}</p>
                        <div style={{ borderTop: `1px solid ${qc.border}`, paddingTop: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>REFLECTION</div>
                          <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>{opt.reflection}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      /* ── Templates (copyable prompt templates) ── */
      case 'templates':
        return (
          <div style={{ padding: fs ? '28px 48px' : '18px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 20 : 17)}
            {s.body && <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>{s.body}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, overflowY: 'auto', alignContent: 'start' }}>
              {s.templateItems?.map((tmpl) => (
                <div key={tmpl.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C', flex: 1 }}>{tmpl.name}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: tmpl.tagColor, background: `${tmpl.tagColor}18`, padding: '2px 8px', borderRadius: 10 }}>{tmpl.tag}</span>
                    <button onClick={() => { navigator.clipboard.writeText(tmpl.template); setCopiedId(tmpl.id); setTimeout(() => setCopiedId(null), 2000); }} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: copiedId === tmpl.id ? '#F0FFF4' : '#F7FAFC', fontSize: 10, fontWeight: 600, color: copiedId === tmpl.id ? '#48BB78' : '#718096', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {copiedId === tmpl.id ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#4A5568', lineHeight: 1.5, whiteSpace: 'pre-line', background: '#F7FAFC', borderRadius: 6, padding: '8px 10px', flex: 1, overflowY: 'auto', maxHeight: fs ? 260 : 140, border: '1px solid #E2E8F0' }}>
                    {tmpl.template}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      /* ── Concept (enhanced: two-column with visual panel when visualId present) ── */
      case 'concept':
      default:
        if (s.visualId) {
          return (
            <div style={{ padding: fs ? '28px 48px' : '18px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                {/* Left: text */}
                <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column' }}>
                  {renderTealHeading(s.heading, s.tealWord, fs ? 20 : 17)}
                  {s.body && <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{s.body}</p>}
                  {s.pullQuote && (
                    <div style={{ borderLeft: '4px solid #38B2AC', background: '#E6FFFA', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontStyle: 'italic', marginTop: 'auto' }}>
                      {s.pullQuote}
                    </div>
                  )}
                </div>
                {/* Right: visual panel */}
                <div style={{ flex: '0 0 43%', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {renderConceptVisual(s.visualId, fs)}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: fs ? '48px 80px' : '28px 40px' }}>
            {renderTealHeading(s.heading, s.tealWord, fs ? 26 : 20)}
            {s.body && <p style={{ fontSize: fs ? 16 : 14, color: '#4A5568', lineHeight: 1.7, margin: 0 }}>{s.body}</p>}
            {s.pullQuote && (
              <div style={{ borderLeft: '4px solid #38B2AC', background: '#E6FFFA', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginTop: 16, fontSize: 14, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontStyle: 'italic' }}>
                {s.pullQuote}
              </div>
            )}
          </div>
        );
    }
  };

  const isStretchType = s.type === 'dark' || s.type === 'statement' || s.type === 'tensionStatement' || s.type === 'bridge' || s.type === 'courseIntro';

  /* ── Dot indicator bar ── */
  const renderDots = (size: 'sm' | 'lg') => {
    const dotW = size === 'lg' ? 8 : 6;
    const activeW = size === 'lg' ? 24 : 18;
    const h = size === 'lg' ? 8 : 6;
    return (
      <div style={{ display: 'flex', gap: size === 'lg' ? 4 : 3, alignItems: 'center' }}>
        {Array.from({ length: totalSlides }, (_, i) => i + 1).map((n) => (
          <div key={n} onClick={() => visitedSlides.has(n) && goToSlide(n)} style={{
            width: n === currentSlide ? activeW : dotW, height: h, borderRadius: h / 2,
            cursor: visitedSlides.has(n) ? 'pointer' : 'default',
            background: n === currentSlide ? '#38B2AC' : visitedSlides.has(n) ? '#4A5568' : '#2D3748',
            transition: 'all 0.25s ease',
          }} />
        ))}
      </div>
    );
  };

  /* ── Glowing fullscreen button (inline player) ── */
  const renderFsButton = () => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        className="fs-glow-btn"
        onClick={() => { setIsFullscreen(true); setShowFsTooltip(false); }}
        style={{ background: '#38B2AC', border: 'none', cursor: 'pointer', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
        title="View fullscreen"
      >
        <Maximize2 size={12} color="#FFFFFF" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.03em' }}>Fullscreen</span>
      </button>
      {showFsTooltip && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#1A202C', color: '#FFFFFF', fontSize: 11, padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>View in full screen</div>
          <div style={{ color: '#A0AEC0', fontSize: 10 }}>Click here for the best learning experience</div>
          <div style={{ position: 'absolute', top: -4, right: 16, width: 8, height: 8, background: '#1A202C', transform: 'rotate(45deg)' }} />
        </div>
      )}
    </div>
  );

  // Reset interactive state when slide changes (sjAnswers/sjChecked persist across slides)
  useEffect(() => {
    setSjScenarioIdx(0);
    setQuizSelected(null);
    setQuizAnswered(false);
    setSpectrumPos(2);
    setFlippedCards({});
    setBranchingSelected(null);
    setCopiedId(null);
    setActiveCompTab(0);
    setExpandedSections({});
    setContextStep(0);
    setScenarioTab('rushed');
    setExpandedMatrixRow(null);
  }, [currentSlide]);

  /* ── Next button interception: contextBar reveal + situationalJudgment cycling ── */
  const handleNextClick = () => {
    // Slide 6 (contextBar): reveal components one by one before advancing
    if (s.type === 'contextBar' && contextStep < 6) {
      setContextStep(prev => prev + 1);
      return;
    }
    if (s.type === 'situationalJudgment' && s.scenarios && sjScenarioIdx < s.scenarios.length - 1) {
      setSjScenarioIdx((prev) => prev + 1);
      return;
    }
    if (isLastSlide) {
      if (isFullscreen) setIsFullscreen(false);
      onCompletePhase();
    } else {
      goToSlide(currentSlide + 1);
    }
  };

  /* ── Dynamic Next button label ── */
  const nextLabel = isLastSlide
    ? 'Finish E-Learning \u2192'
    : (s.type === 'contextBar' && contextStep < 6)
      ? 'Reveal next component \u2192'
      : 'Next \u2192';

  /* ── Fullscreen overlay ── */
  if (isFullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000000', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#1A202C', height: 48, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>
          {renderDots('lg')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#A0AEC0' }}>{currentSlide} / {totalSlides}</span>
            <button onClick={() => setIsFullscreen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} title="Exit fullscreen (Esc)">
              <Minimize2 size={16} color="#A0AEC0" />
            </button>
          </div>
        </div>
        <div style={{ height: 3, background: '#2D3748', flexShrink: 0 }}>
          <div style={{ height: '100%', background: accentColor, width: `${(currentSlide / totalSlides) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ flex: 1, position: 'relative', background: '#FFFFFF', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: isStretchType ? 'stretch' : 'flex-start' }}>
            {renderSlide()}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2D3748', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A202C', flexShrink: 0 }}>
          <button onClick={() => goToSlide(currentSlide - 1)} disabled={currentSlide === 1} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: '1px solid #4A5568', background: 'transparent', color: currentSlide === 1 ? '#4A5568' : '#E2E8F0', fontSize: 13, fontWeight: 600, cursor: currentSlide === 1 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ← Previous
          </button>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#718096', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>
          {isReview ? (
            <button onClick={() => { setIsFullscreen(false); onBackToSummary?.(); }} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: '1px solid #E2E8F0', background: 'transparent', color: '#E2E8F0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ← Back to summary
            </button>
          ) : (
            <button onClick={handleNextClick} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: 'none', background: isLastSlide ? accentColor : '#38B2AC', color: isLastSlide ? accentDark : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Inline (compact) player ── */
  return (
    <div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.05)' }}>
        <div style={{ background: '#1A202C', height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>
          {renderDots('sm')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#A0AEC0' }}>{currentSlide} / {totalSlides}</span>
            {renderFsButton()}
          </div>
        </div>
        <div style={{ height: 2, background: '#E2E8F0' }}>
          <div style={{ height: '100%', background: accentColor, width: `${(currentSlide / totalSlides) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 340px)', minHeight: 320, maxHeight: 520, background: '#FFFFFF' }}>
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: isStretchType ? 'stretch' : 'flex-start' }}>
            {renderSlide()}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF' }}>
          <button onClick={() => goToSlide(currentSlide - 1)} disabled={currentSlide === 1} style={{ padding: '7px 18px', borderRadius: 24, minHeight: 36, border: '1px solid #E2E8F0', background: 'transparent', color: currentSlide === 1 ? '#CBD5E0' : '#1A202C', fontSize: 13, fontWeight: 600, cursor: currentSlide === 1 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ← Previous
          </button>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.section}</span>
          {isReview ? (
            <button onClick={onBackToSummary} style={{ padding: '7px 18px', borderRadius: 24, minHeight: 36, border: '1px solid #1A202C', background: 'transparent', color: '#1A202C', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ← Back to summary
            </button>
          ) : (
            <button onClick={handleNextClick} style={{ padding: '7px 18px', borderRadius: 24, minHeight: 36, border: 'none', background: isLastSlide ? accentColor : '#38B2AC', color: isLastSlide ? accentDark : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PERSONA CASE STUDY SLIDE (sliding cards L→R)
   ══════════════════════════════════════════════════════════════════ */
function PersonaCaseStudySlide({ slide, fs }: { slide: SlideData; fs: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const personas = slide.personas || [];
  const active = personas[activeIdx];
  if (!active) return null;

  return (
    <div style={{ padding: fs ? '28px 48px' : '16px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {renderTealHeading(slide.heading, slide.tealWord, fs ? 20 : 17)}
      {slide.body && <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, margin: '0 0 8px' }}>{slide.body}</p>}
      {slide.pullQuote && (
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', fontStyle: 'italic', margin: '0 0 10px', padding: '6px 12px', borderLeft: '3px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0' }}>{slide.pullQuote}</div>
      )}

      {/* Persona tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {personas.map((p, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: i === activeIdx ? active.color : '#F7FAFC',
            color: i === activeIdx ? '#FFFFFF' : '#718096',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 14 }}>{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      {/* Active persona card — slides in from right */}
      <div key={activeIdx} style={{ flex: 1, borderRadius: 14, border: `1px solid ${active.color}33`, background: `${active.color}06`, padding: '14px 18px', animation: 'slideInRight 0.35s ease', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${active.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{active.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{active.name}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>{active.role}</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#FFFFFF', background: active.color, padding: '3px 10px', borderRadius: 20 }}>{active.technique}</span>
        </div>

        {/* Task */}
        <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6, marginBottom: 10, padding: '8px 12px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span style={{ fontWeight: 600, color: '#1A202C' }}>The task: </span>{active.task}
        </div>

        {/* Prompt */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: active.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>THE PROMPT</div>
          <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: `3px solid ${active.color}`, borderRadius: '0 8px 8px 0', padding: '8px 12px', fontSize: 11, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{active.prompt}</div>
        </div>

        {/* Outcome */}
        <div className="insight-pulse" style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #1A3A38, #1A202C)', borderRadius: 10, border: '1px solid #38B2AC33' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>OUTCOME</div>
          <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.5 }}>{active.outcome}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   APPROACH MATRIX SLIDE (interactive grid)
   ══════════════════════════════════════════════════════════════════ */
function ApproachMatrixSlide({ slide, fs }: { slide: SlideData; fs: boolean }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const m = slide.matrixData;
  if (!m) return null;

  const ratingColors = { best: '#48BB78', ok: '#ED8936', weak: '#E2E8F0' };
  const ratingLabels = { best: '★', ok: '◐', weak: '○' };

  return (
    <div style={{ padding: fs ? '24px 36px' : '12px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderTealHeading(slide.heading, slide.tealWord, fs ? 18 : 16)}
      {slide.body && <p style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5, margin: '0 0 8px' }}>{slide.body}</p>}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 10, color: '#718096' }}>
        <span><span style={{ color: '#48BB78', fontWeight: 700 }}>★</span> Best fit</span>
        <span><span style={{ color: '#ED8936', fontWeight: 700 }}>◐</span> Can work</span>
        <span><span style={{ color: '#A0AEC0' }}>○</span> Not ideal</span>
      </div>

      {/* Matrix grid */}
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #E2E8F0', fontSize: 10, color: '#A0AEC0', fontWeight: 600, minWidth: 140 }}>Situation</th>
              {m.approaches.map((a, i) => (
                <th key={i} style={{ padding: '6px 6px', textAlign: 'center', borderBottom: '2px solid #E2E8F0', fontSize: 9, color: '#4A5568', fontWeight: 700, minWidth: 70 }}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.situations.map((sit, rowIdx) => (
              <tr key={rowIdx}>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0', fontSize: 10, color: '#4A5568', fontWeight: 500 }}>
                  <span style={{ marginRight: 4 }}>{sit.icon}</span>{sit.label}
                </td>
                {m.cells[rowIdx]?.map((cell, colIdx) => {
                  const cellKey = `${rowIdx}-${colIdx}`;
                  const isHovered = hoveredCell === cellKey;
                  return (
                    <td key={colIdx}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{ padding: '4px 4px', borderBottom: '1px solid #E2E8F0', textAlign: 'center', position: 'relative', cursor: 'default' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, margin: '0 auto',
                        background: cell.rating === 'best' ? '#F0FFF4' : cell.rating === 'ok' ? '#FFFBEB' : '#F7FAFC',
                        border: `1px solid ${ratingColors[cell.rating]}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: ratingColors[cell.rating], fontWeight: 700,
                      }}>
                        {ratingLabels[cell.rating]}
                      </div>
                      {isHovered && (
                        <div style={{
                          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                          background: '#1A202C', color: '#E2E8F0', fontSize: 10, padding: '6px 10px',
                          borderRadius: 6, whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          marginBottom: 4,
                        }}>
                          {cell.tip}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SITUATIONAL JUDGMENT (persona-framed, multi-step navigation)
   ══════════════════════════════════════════════════════════════════ */
function SituationalJudgmentSlide({ slide, fs, activeScenarioIdx, onScenarioChange }: { slide: SlideData; fs: boolean; activeScenarioIdx: number; onScenarioChange: (idx: number) => void }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const scenarios = slide.scenarios || [];
  const scenario = scenarios[activeScenarioIdx];
  if (!scenario) return null;

  // Reset selected option when scenario changes
  const scenarioRef = React.useRef(activeScenarioIdx);
  if (scenarioRef.current !== activeScenarioIdx) {
    scenarioRef.current = activeScenarioIdx;
    // This will trigger re-render, selectedOption resets below
  }

  return (
    <div style={{ padding: fs ? '28px 48px' : '16px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderTealHeading(slide.heading, slide.tealWord, fs ? 20 : 17)}
      {slide.instruction && <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, margin: '0 0 10px' }}>{slide.instruction}</p>}

      {/* Scenario progress indicators */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {scenarios.map((sc, i) => (
          <button key={i} onClick={() => { onScenarioChange(i); setSelectedOption(null); }} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: i === activeScenarioIdx ? '#1A202C' : '#F7FAFC',
            color: i === activeScenarioIdx ? '#FFFFFF' : '#718096',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {sc.personaIcon && <span style={{ fontSize: 14 }}>{sc.personaIcon}</span>}
            {sc.personaName ? `${sc.personaName}'s Task` : `Scenario ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Persona card header */}
      {scenario.personaName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '8px 14px', background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 22 }}>{scenario.personaIcon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{scenario.personaName}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>{scenario.personaRole}</div>
          </div>
        </div>
      )}

      {/* Scenario description */}
      <div key={activeScenarioIdx} style={{ background: '#FFFFFF', borderRadius: 10, padding: '12px 16px', marginBottom: 10, fontSize: 12, color: '#4A5568', lineHeight: 1.6, border: '1px solid #E2E8F0', animation: 'slideInRight 0.3s ease' }}>
        {scenario.scenario}
      </div>

      {/* Option buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {scenario.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isStrongest = i === scenario.strongestChoice;
          const showResult = selectedOption !== null;
          let borderColor = '#E2E8F0';
          let bg = '#FFFFFF';
          if (showResult && isStrongest) { borderColor = '#48BB78'; bg = '#F0FFF4'; }
          else if (showResult && isSelected && !isStrongest) { borderColor = '#ED8936'; bg = '#FFFBEB'; }
          else if (isSelected) { borderColor = '#38B2AC'; bg = '#E6FFFA'; }
          return (
            <button key={i} onClick={() => setSelectedOption(i)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 10, border: `2px solid ${borderColor}`, background: bg,
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1A202C', transition: 'all 0.15s',
            }}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {selectedOption !== null && scenario.feedback[selectedOption] && (
        <div style={{
          borderRadius: 10, padding: '10px 14px', flex: 1,
          background: scenario.feedback[selectedOption].quality === 'strong' ? '#F0FFF4' : scenario.feedback[selectedOption].quality === 'partial' ? '#FFFBEB' : '#FFF5F5',
          border: `1px solid ${scenario.feedback[selectedOption].quality === 'strong' ? '#48BB7844' : scenario.feedback[selectedOption].quality === 'partial' ? '#ED893644' : '#FC818144'}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3,
            color: scenario.feedback[selectedOption].quality === 'strong' ? '#48BB78' : scenario.feedback[selectedOption].quality === 'partial' ? '#ED8936' : '#FC8181',
          }}>
            {scenario.feedback[selectedOption].quality === 'strong' ? 'STRONGEST CHOICE' : scenario.feedback[selectedOption].quality === 'partial' ? 'COULD WORK' : 'NOT THE BEST FIT'}
          </div>
          <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>{scenario.feedback[selectedOption].text}</div>
        </div>
      )}

      {/* Scenario navigation hint */}
      <div style={{ marginTop: 'auto', paddingTop: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#A0AEC0' }}>
          Scenario {activeScenarioIdx + 1} of {scenarios.length}
          {activeScenarioIdx < scenarios.length - 1 && ' — Click Next to continue to the next scenario'}
        </span>
      </div>
    </div>
  );
}

export default ELearningView;
