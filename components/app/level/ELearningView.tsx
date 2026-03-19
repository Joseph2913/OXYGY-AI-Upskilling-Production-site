import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Maximize2, Minimize2, ChevronDown, ChevronUp, User, Map, Target, Layout, List, ShieldCheck } from 'lucide-react';
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
  const [spectrumPos, setSpectrumPos] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [branchingSelected, setBranchingSelected] = useState<number | null>(null);
  const [branchingStep, setBranchingStep] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCompTab, setActiveCompTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  /* L1 v2 state */
  const [contextStep, setContextStep] = useState(0); // Slide 6: sequential reveal 0–6
  const [sjAnswers, setSjAnswers] = useState<Record<number, number | null>>({}); // Slides 13–15: per-slide selected option
  const [scenarioTab, setScenarioTab] = useState<'rushed' | 'thorough'>('rushed'); // Slide 5
  const [expandedMatrixRow, setExpandedMatrixRow] = useState<number | null>(null); // Slide 12
  // buildAPrompt state
  const [placedComponents, setPlacedComponents] = useState<Record<string, string>>({});
  const [buildChecked, setBuildChecked] = useState(false);
  const [draggedChip, setDraggedChip] = useState<string | null>(null);
  const [buildComplete, setBuildComplete] = useState(false);
  const [shuffledBuildKeys, setShuffledBuildKeys] = useState<string[]>([]);
  // predictFirst persona state
  const [predictSelected, setPredictSelected] = useState<number | null>(null);
  const [predictRevealed, setPredictRevealed] = useState(false);
  const [predictChecked, setPredictChecked] = useState(false);
  // spotTheFlaw slide state
  const [flawSelected, setFlawSelected] = useState<number | null>(null);
  // toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  // reflection screen state
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionA, setReflectionA] = useState('');
  const [reflectionB, setReflectionB] = useState('');

  useEffect(() => { injectGlowStyle(); }, []);
  useEffect(() => { setVisitedSlides((prev) => new Set(prev).add(currentSlide)); }, [currentSlide]);

  // Shuffle build-a-prompt source chips once when that slide is first reached
  useEffect(() => {
    const slide = slides[currentSlide];
    if (slide?.type === 'buildAPrompt' && slide.buildComponents && shuffledBuildKeys.length === 0) {
      const keys = slide.buildComponents.map((c: any) => c.key);
      const shuffled = [...keys];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Ensure it's not in the same order as the original
      if (shuffled.every((k, i) => k === keys[i])) {
        const tmp = shuffled[0]; shuffled[0] = shuffled[1]; shuffled[1] = tmp;
      }
      setShuffledBuildKeys(shuffled);
    }
  }, [currentSlide]);

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
  const s = slides[Math.min(currentSlide, totalSlides) - 1];
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>THE ADOPTION GAP</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 4, fontWeight: 600 }}>Individual AI usage</div>
              <div style={{ height: 32, background: 'linear-gradient(90deg, #38B2AC, #2C9A94)', borderRadius: 6, width: '90%', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 700 }}>HIGH</span>
              </div>
            </div>
            <div style={{ borderLeft: '2px dashed #FC8181', marginLeft: 20, padding: '6px 0 6px 14px', fontSize: 13, color: '#FC8181', fontWeight: 700 }}>Untapped value</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, color: '#4A5568', marginBottom: 4, fontWeight: 600 }}>Team-wide standardised AI tools</div>
              <div style={{ height: 32, background: '#A0AEC0', borderRadius: 6, width: '25%', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 700 }}>LOW</span>
              </div>
            </div>
          </div>
        );

      case 'l2-diverging-paths':
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>SAME TASK, THREE PEOPLE</div>
            <div style={{ background: 'linear-gradient(135deg, #E6FFFA 0%, #EBF8FF 100%)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, textAlign: 'center', border: '1.5px solid #38B2AC44' }}>
              <span style={{ fontSize: 13, color: '#1E3A5F', fontWeight: 700 }}>Weekly status update</span>
            </div>
            {[
              { who: 'You prompt', result: 'Output A', color: '#38B2AC' },
              { who: 'You prompt again', result: 'Output B (different format)', color: '#ED8936' },
              { who: 'Colleague prompts', result: 'Output C (completely different)', color: '#FC8181' },
            ].map((path, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 32, background: path.color, borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>{path.who}</div>
                  <div style={{ fontSize: 13, color: '#1A202C', fontWeight: 600 }}>{path.result}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'l2-level-comparison':
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>THE SHIFT</div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 12, background: '#FFFFFF' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', marginBottom: 6 }}>LEVEL 1</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['Prompt', 'Answer', 'Done'].map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ fontSize: 13, color: '#718096', fontWeight: 600, padding: '4px 10px', background: '#F7FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>{step}</span>
                    {i < 2 && <span style={{ color: '#A0AEC0', fontSize: 14 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ border: '2px solid #38B2AC', borderRadius: 10, padding: '12px 14px', background: '#E6FFFA' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38B2AC', marginBottom: 6 }}>LEVEL 2</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {['Defined Input', 'System Prompt', 'Structured Output'].map((step, i) => (
                  <React.Fragment key={i}>
                    <span style={{ fontSize: 13, color: '#1A202C', fontWeight: 600, padding: '4px 10px', background: '#FFFFFF', borderRadius: 6, border: '1px solid #38B2AC44' }}>{step}</span>
                    {i < 2 && <span style={{ color: '#38B2AC', fontSize: 14 }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#38B2AC' }}>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>AGENT ANATOMY</div>
            {[
              { label: 'INPUT', desc: 'What goes in. Data format, required fields, what the user provides.', color: '#667EEA', light: '#EBF4FF' },
              { label: 'PROCESSING', desc: 'How it behaves. System prompt: role, task, steps, checks.', color: '#38B2AC', light: '#E6FFFA' },
              { label: 'OUTPUT', desc: 'What comes out. Structured format, JSON schema, consistent fields.', color: '#48BB78', light: '#F0FFF4' },
            ].map((layer, i) => (
              <React.Fragment key={i}>
                <div style={{ borderLeft: `3px solid ${layer.color}`, background: layer.light, borderRadius: '0 8px 8px 0', padding: '12px 16px', marginBottom: i < 2 ? 4 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: layer.color, letterSpacing: '0.08em', marginBottom: 3 }}>{layer.label}</div>
                  <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.4 }}>{layer.desc}</div>
                </div>
                {i < 2 && <div style={{ textAlign: 'center', color: '#A0AEC0', fontSize: 16, margin: '2px 0' }}>↓</div>}
              </React.Fragment>
            ))}
          </div>
        );

      case 'l2-hitl-output':
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>ACCOUNTABILITY IN OUTPUT</div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#4A5568', lineHeight: 1.6, position: 'relative' }}>
              <div style={{ marginBottom: 8 }}>Project Alpha: <strong>On track</strong></div>
              {[
                { label: 'Source cited', color: '#38B2AC', text: '[email from J. Lee, 7 Mar]' },
                { label: 'Confidence scored', color: '#667EEA', text: '0.85' },
                { label: 'Reasoning shown', color: '#ED8936', text: 'Based on tracker + email alignment' },
                { label: 'Anomaly flagged', color: '#FC8181', text: 'No update since 28 Feb' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: item.color, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: '#718096', fontStyle: 'italic' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'l2-hub-spoke':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>BUILD ONCE, SHARE ALWAYS</div>
            {/* Centre: Agent node */}
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#38B2AC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#FFFFFF', fontWeight: 700 }}>⚙</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C', marginTop: 4 }}>Agent</div>
              <div style={{ fontSize: 11, color: '#38B2AC', fontWeight: 600, background: '#E6FFFA', padding: '2px 8px', borderRadius: 4, marginTop: 2 }}>+ Agent Card</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {['Team member 1', 'Team member 2', 'Team member 3', 'New joiner'].map((user, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 2, height: 18, background: '#E2E8F0' }} />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 3 ? '#F7E8A4' : '#F7FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                  <div style={{ fontSize: 11, color: i === 3 ? '#8A6A00' : '#718096', fontWeight: i === 3 ? 700 : 400 }}>{user}</div>
                  {i === 3 && <div style={{ fontSize: 10, color: '#8A6A00', fontWeight: 600 }}>5 min to productive</div>}
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

      /* ── Course Intro (slide 1) ── */
      case 'courseIntro': {
        const blueprintItems = [
          { label: 'Role',    color: '#667EEA', light: '#EBF4FF', icon: '🎭' },
          { label: 'Context', color: '#38B2AC', light: '#E6FFFA', icon: '🌍' },
          { label: 'Task',    color: '#ED8936', light: '#FFFBEB', icon: '🎯' },
          { label: 'Format',  color: '#48BB78', light: '#F0FFF4', icon: '📐' },
          { label: 'Steps',   color: '#9F7AEA', light: '#FAF5FF', icon: '🪜' },
          { label: 'Checks',  color: '#F6AD55', light: '#FFFAF0', icon: '✅' },
        ];
        const objIcons = ['💡', '🗂️', '🔄', '🎯'];
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
            {/* Left column */}
            <div style={{ flex: '0 0 58%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: fs ? '44px 48px' : '28px 32px', background: 'linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)', borderRight: '1px solid #E2E8F0' }}>
              {s.levelNumber && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1A6B5F', background: '#A8F0E0', padding: '3px 10px', borderRadius: 16, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 14 }}>
                  LEVEL {s.levelNumber} · E-LEARNING
                </span>
              )}
              {/* Hook headline */}
              <h1 style={{ fontSize: fs ? 26 : 22, fontWeight: 800, color: '#1A202C', margin: '0 0 4px', lineHeight: 1.15 }}>
                Same AI.
              </h1>
              <h1 style={{ fontSize: fs ? 26 : 22, fontWeight: 800, color: '#38B2AC', margin: '0 0 12px', lineHeight: 1.15 }}>
                Very different results.
              </h1>
              <p style={{ fontSize: fs ? 13 : 12, color: '#4A5568', margin: '0 0 20px', lineHeight: 1.65, maxWidth: 380 }}>
                What separates a useful AI output from a mediocre one? Not the tool — the prompt. This module gives you a repeatable system for getting it right.
              </p>
              {/* Objectives */}
              {s.objectives && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>YOU'LL WALK AWAY WITH</div>
                  {s.objectives.map((obj: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 13, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{objIcons[i] ?? '▸'}</span>
                      <span style={{ fontSize: 12, color: '#2D3748', lineHeight: 1.55, fontWeight: 500 }}>{obj}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleNextClick} style={{ alignSelf: 'flex-start', padding: '10px 26px', borderRadius: 24, border: 'none', background: '#38B2AC', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                Start →
              </button>
            </div>
            {/* Right column — Blueprint preview */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: fs ? '36px 32px' : '24px 22px', background: '#FAFBFC', gap: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>THE PROMPT BLUEPRINT</div>
              <p style={{ fontSize: 11, color: '#718096', lineHeight: 1.55, margin: '0 0 10px' }}>
                Six components. Master these and every prompt you write gets stronger.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {blueprintItems.map((item) => (
                  <div key={item.label} style={{ background: item.light, border: `1.5px solid ${item.color}30`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#A0AEC0', lineHeight: 1.5, margin: '8px 0 0', fontStyle: 'italic' }}>
                You'll build one of these from scratch before this module ends.
              </p>
            </div>
          </div>
        );
      }

      /* ── Evidence (stat cards with real logos & descriptions) ── */
      case 'evidence':
        return (
          <div style={{ padding: fs ? '28px 48px' : '16px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: '0 0 14px' }}>{s.body}</p>}
            {s.stats && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.stats.length}, 1fr)`, gap: 12, flex: 1 }}>
                {s.stats.map((stat, i) => (
                  <div key={i} style={{ background: 'linear-gradient(180deg, #F7FAFC 0%, #FFFFFF 100%)', border: '1px solid #E2E8F0', borderRadius: 14, padding: fs ? '20px 16px' : '14px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Logo */}
                    {stat.logoPath && (
                      <div style={{ marginBottom: 10, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={stat.logoPath} alt={stat.source} style={{ height: 28, maxWidth: 140, objectFit: 'contain', opacity: 0.85 }} />
                      </div>
                    )}
                    {/* Big stat value */}
                    <div style={{ fontSize: fs ? 64 : 52, fontWeight: 800, color: stat.valueColour, lineHeight: 1, letterSpacing: '-0.02em' }}>{stat.value}</div>
                    {/* Stat label */}
                    <div style={{ fontSize: fs ? 15 : 14, color: '#4A5568', lineHeight: 1.4, margin: '10px 0 6px', maxWidth: 220, fontWeight: 600 }}>{stat.label}</div>
                    {/* Description */}
                    {stat.desc && (
                      <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, maxWidth: 220, marginTop: 4 }}>{stat.desc}</div>
                    )}
                    {/* Source */}
                    <div style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic', marginTop: 6 }}>{stat.source}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Bottom insight bar */}
            <div style={{ marginTop: 14, padding: '12px 20px', background: '#EBF8FF', borderRadius: 10, border: '1px solid #38B2AC33', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>💡</span>
              <span style={{ fontSize: 13, color: '#1A202C' }}>The gap between </span>
              <span style={{ fontSize: 13, color: '#38B2AC', fontWeight: 700 }}>AI adoption</span>
              <span style={{ fontSize: 13, color: '#1A202C' }}> and </span>
              <span style={{ fontSize: 13, color: '#FC8181', fontWeight: 700 }}>AI skill</span>
              <span style={{ fontSize: 13, color: '#1A202C' }}> is the opportunity this module addresses.</span>
            </div>
          </div>
        );

      /* ── Evidence Hero (Slide 2 — two-column: text + big stat card) ── */
      case 'evidenceHero': {
        const stat = s.stats?.[0];
        return fs ? (
          /* Fullscreen: two-column layout */
          <div style={{ padding: '24px 44px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 20, flex: 1, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: 17, color: '#4A5568', lineHeight: 1.75, maxWidth: 420, margin: 0 }}>{s.body}</p>}
              </div>
              {stat && (
                <div style={{ padding: '28px 36px', borderRadius: 20, background: 'linear-gradient(135deg, #E6FFFA, #fff)', border: '2px solid #38B2AC', textAlign: 'center', animation: 'fadeInUp 0.4s ease' }}>
                  <div style={{ fontSize: 28, color: '#38B2AC', marginBottom: 4 }}>{'\u2191'}</div>
                  <div style={{ fontSize: 68, fontWeight: 800, color: '#38B2AC', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 14, color: '#4A5568', maxWidth: 200, margin: '8px auto 0' }}>{stat.label}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px' }}>
                    {stat.logoPath && <img src={stat.logoPath} alt={stat.source} style={{ height: 18, maxWidth: 100, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span style={{ fontWeight: 700, fontSize: 11, color: '#1A202C' }}>{stat.source}</span>
                  </div>
                </div>
              )}
            </div>
            {s.pullQuote && (
              <div style={{ marginTop: 14, padding: '20px 28px', borderLeft: '4px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: 16, color: '#4A5568', lineHeight: 1.75 }}>
                {s.pullQuote.split(/(\d+%)/).map((part, i) => /^\d+%$/.test(part) ? <span key={i} style={{ color: '#38B2AC', fontWeight: 800 }}>{part}</span> : <span key={i}>{part}</span>)}
              </div>
            )}
          </div>
        ) : (
          /* Inline: two-column, stat card centred within its column */
          <div style={{ padding: '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 16, flex: 1, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: 15, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right column: flex centres the card so it doesn't hug the edge */}
              {stat && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ padding: '20px 28px', borderRadius: 20, background: 'linear-gradient(135deg, #E6FFFA, #fff)', border: '2px solid #38B2AC', textAlign: 'center', animation: 'fadeInUp 0.4s ease', maxWidth: 220, width: '100%' }}>
                    <div style={{ fontSize: 22, color: '#38B2AC', marginBottom: 4 }}>{'\u2191'}</div>
                    <div style={{ fontSize: 52, fontWeight: 800, color: '#38B2AC', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 13, color: '#4A5568', maxWidth: 160, margin: '6px auto 0' }}>{stat.label}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 10px' }}>
                      {stat.logoPath && <img src={stat.logoPath} alt={stat.source} style={{ height: 16, maxWidth: 80, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                      <span style={{ fontWeight: 700, fontSize: 11, color: '#1A202C' }}>{stat.source}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {s.pullQuote && (
              <div style={{ marginTop: 12, padding: '20px 28px', borderLeft: '4px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: 16, color: '#4A5568', lineHeight: 1.75 }}>
                {s.pullQuote.split(/(\d+%)/).map((part, i) => /^\d+%$/.test(part) ? <span key={i} style={{ color: '#38B2AC', fontWeight: 800 }}>{part}</span> : <span key={i}>{part}</span>)}
              </div>
            )}
          </div>
        );
      }

      /* ── Chart (Slide 3 — two-column: text + diverging outcomes research visual) ── */
      case 'chart': {
        const outcomes = [
          { label: 'Customer support agents', sublabel: 'AI assistance for ticket resolution', gain: 14, barW: '11%', color: '#A0AEC0', textColor: '#718096' },
          { label: 'Business professionals', sublabel: 'AI-assisted writing & analysis tasks', gain: 59, barW: '47%', color: '#4FD1C5', textColor: '#2C9A94' },
          { label: 'Software developers', sublabel: 'GitHub Copilot for coding tasks', gain: 126, barW: '100%', color: '#38B2AC', textColor: '#1A6B5F' },
        ];
        return (
          <div style={{ padding: fs ? '24px 44px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1 }}>
              {/* Left — body */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right — diverging outcomes chart */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>PRODUCTIVITY GAIN — SAME AI TOOL</div>
                {outcomes.map((o, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div>
                        <span style={{ fontSize: fs ? 14 : 13, fontWeight: 700, color: '#1A202C' }}>{o.label}</span>
                        <span style={{ fontSize: fs ? 12 : 11, color: '#A0AEC0', marginLeft: 6 }}>{o.sublabel}</span>
                      </div>
                      <span style={{ fontSize: fs ? 16 : 14, fontWeight: 800, color: o.textColor }}>+{o.gain}%</span>
                    </div>
                    <div style={{ height: fs ? 24 : 20, background: '#F7FAFC', borderRadius: 4, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <div style={{ height: '100%', width: o.barW, background: o.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 4, fontSize: 9, color: '#A0AEC0', fontStyle: 'italic', borderTop: '1px solid #E2E8F0', paddingTop: 6 }}>
                  Sources: Brynjolfsson, Li & Raymond (MIT/Stanford/NBER, 2023); Noy & Zhang (MIT, 2023); GitHub Copilot Research (GitHub, 2022). Gains relative to control groups without AI assistance.
                </div>
              </div>
            </div>
            {s.pullQuote && (
              <div style={{ marginTop: 14, padding: '20px 28px', borderLeft: '4px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: 16, color: '#4A5568', lineHeight: 1.75 }}>
                {s.pullQuote.split(/(\d+%)/).map((part, i) => /^\d+%$/.test(part) ? <span key={i} style={{ color: '#38B2AC', fontWeight: 800 }}>{part}</span> : <span key={i}>{part}</span>)}
              </div>
            )}
          </div>
        );
      }

      /* ── Pyramid (Slide 4 — two-column: text + pyramid stack) ── */
      case 'pyramid': {
        const pyramidLayers = [
          { label: 'Applications', width: '38%', fill: '#E2E8F0', border: '1px solid #CBD5E0', fontWeight: 600, fontSize: 13, color: '#4A5568' },
          { label: 'Dashboards', width: '50%', fill: '#FBCEB1', border: '1px solid #E8A882', fontWeight: 600, fontSize: 13, color: '#4A5568' },
          { label: 'Workflows', width: '65%', fill: '#F7E8A4', border: '1px solid #D4C070', fontWeight: 600, fontSize: 13, color: '#4A5568' },
          { label: 'AI Agents', width: '82%', fill: '#C3D0F5', border: '1px solid #A0B4E8', fontWeight: 600, fontSize: 13, color: '#4A5568' },
          { label: 'Prompting', width: '100%', fill: '#38B2AC', border: '2px solid #2C9A94', fontWeight: 800, fontSize: 15, color: '#FFFFFF', active: true },
        ];
        return (
          <div style={{ padding: fs ? '24px 44px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right — pyramid */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                {pyramidLayers.map((layer, i) => (
                  <div key={i} style={{ width: layer.width, margin: '0 auto', padding: '10px 16px', borderRadius: 6, background: layer.fill, border: layer.border, textAlign: 'center', fontSize: layer.fontSize, fontWeight: layer.fontWeight, color: layer.color, position: 'relative' }}>
                    {layer.label}
                    {layer.active && <span style={{ position: 'absolute', right: -90, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#2C9A94', fontWeight: 700, whiteSpace: 'nowrap' }}>{'\u25B8'} You are here</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* Bottom pull-quote bar — same style as slides 2 & 3 */}
            {s.pullQuote && (
              <div style={{ marginTop: 14, padding: '20px 28px', borderLeft: '4px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: 16, color: '#4A5568', lineHeight: 1.75 }}>
                {s.pullQuote}
              </div>
            )}
          </div>
        );
      }

      /* ── Scenario Comparison (Slide 5 — toggled single-view chat) ── */
      case 'scenarioComparison': {
        const tabData = s.tabs || [];
        const CONTEXT_KEYS = ['ROLE', 'CONTEXT', 'TASK', 'FORMAT', 'STEPS', 'CHECKS'];
        const cols = [
          { tab: tabData[0] as any, id: 'rushed', label: 'Rushed Handover', borderColor: '#FEB2B2', bgCard: '#FFF5F5', replyColor: '#9B2C2C', isRushed: true },
          { tab: tabData[1] as any, id: 'thorough', label: 'Thorough Briefing', borderColor: '#9AE6B4', bgCard: '#F0FFF4', replyColor: '#276749', isRushed: false },
        ];
        const active = scenarioTab === 'rushed' ? cols[0] : cols[1];
        const { tab: t, id, borderColor, bgCard, replyColor, isRushed } = active;
        const score = (t?.checks || []).filter(Boolean).length;
        const isOpen = !!expandedSections[`sc-check-${id}`];
        return (
          <div style={{ padding: fs ? '22px 44px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

            {/* Toggle — prominent, labelled */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Toggle to compare</span>
                <span style={{ fontSize: 13, color: '#CBD5E0' }}>⇄</span>
              </div>
              <div style={{ display: 'flex', background: '#EDF2F7', border: '1px solid #E2E8F0', borderRadius: 14, padding: 5, gap: 5 }}>
                {cols.map(col => (
                  <button
                    key={col.id}
                    onClick={() => setScenarioTab(col.id as 'rushed' | 'thorough')}
                    style={{
                      flex: 1, padding: fs ? '11px 0' : '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: fs ? 14 : 13,
                      background: scenarioTab === col.id ? (col.isRushed ? '#FED7D7' : '#C6F6D5') : 'transparent',
                      color: scenarioTab === col.id ? (col.isRushed ? '#C53030' : '#276749') : '#718096',
                      boxShadow: scenarioTab === col.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {col.isRushed ? '✗ ' : '✓ '}{col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active conversation */}
            <div style={{ flex: 1, background: bgCard, border: `2px solid ${borderColor}`, borderRadius: 16, padding: fs ? '20px 28px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, overflowY: 'auto' }}>

              {/* Score pill */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: isRushed ? '#FED7D7' : '#C6F6D5', color: isRushed ? '#C53030' : '#276749' }}>
                  {score}/6 context elements
                </span>
              </div>

              {/* You say */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>You say</span>
                <div style={{ background: '#2D3748', color: '#F7FAFC', borderRadius: '16px 4px 16px 16px', padding: fs ? '12px 16px' : '10px 14px', fontSize: fs ? 14 : 13, lineHeight: 1.6, fontStyle: 'italic', maxWidth: '85%' }}>
                  "{t?.prompt}"
                </div>
              </div>

              {/* They deliver */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>They deliver</span>
                <div style={{ background: '#FFFFFF', border: `1.5px solid ${borderColor}`, borderRadius: '4px 16px 16px 16px', padding: fs ? '12px 16px' : '10px 14px', fontSize: fs ? 14 : 13, lineHeight: 1.6, color: replyColor, fontWeight: 600, maxWidth: '85%' }}>
                  {t?.shortOutput}
                </div>
              </div>

              {/* Context checklist */}
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, [`sc-check-${id}`]: !prev[`sc-check-${id}`] }))}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: `1px dashed ${borderColor}`, borderRadius: 10, cursor: 'pointer', padding: '6px 12px' }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: '#718096' }}>What was {isRushed ? 'missing' : 'included'}?</span>
                <span style={{ fontSize: 11, color: '#A0AEC0' }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CONTEXT_KEYS.map((key, i) => {
                    const present = t?.checks?.[i] ?? false;
                    return (
                      <span key={key} style={{ fontSize: 12, fontWeight: 700, padding: '3px 11px', borderRadius: 12, background: present ? '#C6F6D5' : '#FED7D7', color: present ? '#276749' : '#C53030' }}>
                        {present ? '✓' : '✗'} {key}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        );
      }

      /* ── Context Bar (Slide 6 — click cards to reveal) ── */
      case 'contextBar': {
        const BLUEPRINT = [
          { key: 'ROLE', icon: <User size={fs ? 22 : 18} />, color: '#667EEA', light: '#EBF4FF', label: 'Who should the AI be?', detail: 'Tells the AI the expertise level and perspective to adopt', example: 'A senior professional with transformation experience', impact: 'Without this → generic assistant voice' },
          { key: 'CONTEXT', icon: <Map size={fs ? 22 : 18} />, color: '#38B2AC', light: '#E6FFFA', label: "What's the situation?", detail: 'Background, constraints, and what matters to the audience', example: 'Six weeks into rollout. Leadership cares about risk.', impact: 'Without this → no audience awareness' },
          { key: 'TASK', icon: <Target size={fs ? 22 : 18} />, color: '#ED8936', light: '#FFFBEB', label: 'What exactly to produce?', detail: 'Specific, unambiguous deliverable', example: 'Draft a stakeholder update covering progress, risks, next steps', impact: 'Without this → vague, unfocused output' },
          { key: 'FORMAT', icon: <Layout size={fs ? 22 : 18} />, color: '#48BB78', light: '#F0FFF4', label: 'What shape and tone?', detail: 'Length, structure, style, constraints', example: 'Three short paragraphs. Professional tone. Max 300 words.', impact: 'Without this → wrong length, wrong tone' },
          { key: 'STEPS', icon: <List size={fs ? 22 : 18} />, color: '#9F7AEA', light: '#FAF5FF', label: 'How should it think?', detail: 'The reasoning sequence to follow', example: 'First assess impact, then identify risks, then recommend actions', impact: 'Without this → random ordering' },
          { key: 'CHECKS', icon: <ShieldCheck size={fs ? 22 : 18} />, color: '#F6AD55', light: '#FFFBEB', label: 'What rules must it follow?', detail: 'Validation constraints and quality gates', example: 'No generic phrases. Reference specific data points.', impact: 'Without this → filler and assumptions' },
        ];
        const levelLabels = ['Empty', 'Minimal', 'Basic', 'Good', 'Rich', 'Strong', 'Complete'];
        const allRevealed = contextStep >= 6;
        return (
          <div style={{ padding: fs ? '16px 36px' : '10px 16px', display: 'flex', flexDirection: 'column', height: '100%', gap: 10, boxSizing: 'border-box' as const }}>

            {/* Instruction banner — swaps to completion message when all revealed */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: allRevealed ? '#F0FFF4' : accentColor + '15', border: `1.5px solid ${allRevealed ? '#9AE6B4' : accentColor + '55'}`, borderRadius: 12, padding: fs ? '10px 20px' : '8px 16px', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
              <span style={{ fontSize: fs ? 20 : 16 }}>{allRevealed ? '✓' : '👆'}</span>
              <span style={{ fontSize: fs ? 15 : 13, fontWeight: 700, color: allRevealed ? '#276749' : '#1A202C' }}>
                {allRevealed ? 'All six elements revealed. Each one removes a specific assumption the AI would otherwise have to make.' : 'Click each card to reveal what it does'}
              </span>
            </div>

            {/* 3×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: fs ? 12 : 8, flex: 1, minHeight: 0 }}>
              {BLUEPRINT.map((bp, i) => {
                const revealed = i < contextStep;
                return (
                  <button
                    key={bp.key}
                    onClick={() => setContextStep(revealed ? i : i + 1)}
                    style={{
                      padding: fs ? '18px 22px' : '14px 16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                      border: `2px solid ${revealed ? bp.color : '#E2E8F0'}`,
                      background: revealed ? bp.light : '#F7FAFC',
                      transition: 'border-color 0.3s ease, background 0.3s ease',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: fs ? 10 : 8,
                      height: '100%', boxSizing: 'border-box' as const, overflow: 'hidden',
                    }}
                  >
                    {/* Icon + KEY row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ color: revealed ? bp.color : '#CBD5E0', display: 'flex', transition: 'color 0.3s ease' }}>{bp.icon}</span>
                      <span style={{ fontSize: fs ? 15 : 12, fontWeight: 900, color: revealed ? bp.color : '#CBD5E0', letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'color 0.3s ease' }}>{bp.key}</span>
                      {!revealed && <span style={{ fontSize: 11, color: '#CBD5E0', marginLeft: 'auto' }}>▸</span>}
                    </div>
                    {/* Question label — always rendered, same size */}
                    <div style={{ fontSize: fs ? 18 : 15, fontWeight: 700, color: revealed ? '#1A202C' : '#718096', lineHeight: 1.3, flexShrink: 0, transition: 'color 0.3s ease' }}>{bp.label}</div>
                    {/* Detail — always in DOM, hidden until revealed to lock card height */}
                    <div style={{ fontSize: fs ? 14 : 12, color: '#2D3748', lineHeight: 1.55, flex: 1, overflow: 'hidden', opacity: revealed ? 1 : 0, transition: 'opacity 0.3s ease' }}>{bp.detail}</div>
                    {/* Impact badge — always in DOM, hidden until revealed */}
                    <div style={{ fontSize: fs ? 15 : 13, fontWeight: 700, color: bp.color, background: '#FFFFFF', border: `1px solid ${bp.color}44`, borderRadius: 8, padding: fs ? '8px 12px' : '6px 10px', flexShrink: 0, opacity: revealed ? 1 : 0, transition: 'opacity 0.3s ease' }}>{bp.impact}</div>
                  </button>
                );
              })}
            </div>

          </div>
        );
      }

      case 'buildAPrompt': {
        const comps = s.buildComponents || [];
        const isTouch = 'ontouchstart' in window;
        const allPlaced = comps.every((c: any) => !!placedComponents[c.key]);
        const placedChipKeys = Object.values(placedComponents);
        const allCorrect = buildChecked && comps.every((c: any) => placedComponents[c.key] === c.key);

        const handleDrop = (slotKey: string) => {
          if (!draggedChip) return;
          setPlacedComponents(prev => ({ ...prev, [slotKey]: draggedChip }));
          setDraggedChip(null);
          setBuildChecked(false);
        };

        const unplacedComps = (shuffledBuildKeys.length > 0
          ? shuffledBuildKeys.map(k => comps.find((c: any) => c.key === k)!).filter(Boolean)
          : comps
        ).filter((c: any) => !placedChipKeys.includes(c.key));

        return (
          <div style={{ padding: fs ? '14px 28px' : '10px 14px', display: 'flex', flexDirection: 'column', height: '100%', gap: 10, boxSizing: 'border-box' as const }}>
            {/* Instruction banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {buildComplete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: 10, padding: '7px 14px', animation: 'fadeInUp 0.25s ease' }}>
                  <span style={{ fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#276749' }}>All correct — prompt assembled below</span>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#38B2AC', padding: '3px 10px', borderRadius: 10, flexShrink: 0 }}>{isTouch ? 'TAP TO SELECT' : 'DRAG & DROP'}</span>
                  <span style={{ fontSize: 12, color: '#4A5568', fontWeight: 500 }}>{isTouch ? 'Tap a chip, then tap any slot' : 'Drag each chip into any slot on the right'}</span>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 16, flex: 1, minHeight: 0 }}>
              {/* Left — task context + chip bank, or assembled prompt when done */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                {buildComplete ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeInUp 0.3s ease' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase' }}>ASSEMBLED PROMPT</div>
                    <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderLeft: '3px solid #38B2AC', borderRadius: '0 8px 8px 0', padding: '12px 14px', fontSize: 12, fontStyle: 'italic', color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      <ExpandableText text={s.buildAssembledPrompt ?? ''} maxLen={220} id="build-assembled" expanded={!!expandedSections["build-assembled"]} onToggle={(id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))} />
                    </div>
                    <div style={{ background: '#EBF8FF', border: '1px solid #38B2AC33', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>💡</span>
                      <p style={{ fontSize: 12, color: '#1A202C', lineHeight: 1.6, margin: 0 }}>{s.buildInsight}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>THE TASK</div>
                      <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.6 }}>{s.buildTask}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                        {isTouch ? 'TAP A CARD, THEN TAP A SLOT →' : 'DRAG EACH CARD INTO A SLOT →'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {unplacedComps.map((c: any) => {
                          const snippet = c.chipText || (c.filledText.length > 60 ? c.filledText.slice(0, 60) + '…' : c.filledText);
                          const isSelected = draggedChip === c.key;
                          return isTouch ? (
                            <button
                              key={c.key}
                              onClick={() => setDraggedChip(isSelected ? null : c.key)}
                              style={{ textAlign: 'left' as const, background: isSelected ? '#2D3748' : '#EDF2F7', border: `1.5px solid ${isSelected ? '#2D3748' : '#CBD5E0'}`, borderRadius: 8, padding: '9px 12px', cursor: 'pointer', userSelect: 'none' as const, outline: isSelected ? '2px solid #4A5568' : 'none', transition: 'all 150ms ease' }}
                            >
                              <span style={{ fontSize: 12, color: isSelected ? '#fff' : '#2D3748', lineHeight: 1.5 }}>{snippet}</span>
                            </button>
                          ) : (
                            <div
                              key={c.key}
                              draggable
                              onDragStart={() => setDraggedChip(c.key)}
                              onDragEnd={() => setDraggedChip(null)}
                              style={{ background: '#EDF2F7', border: '1.5px solid #CBD5E0', borderRadius: 8, padding: '9px 12px', cursor: 'grab', userSelect: 'none' as const, opacity: isSelected ? 0.4 : 1, transition: 'opacity 150ms ease' }}
                            >
                              <span style={{ fontSize: 12, color: '#2D3748', lineHeight: 1.5 }}>{snippet}</span>
                            </div>
                          );
                        })}
                        {unplacedComps.length === 0 && !buildComplete && (
                          <span style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic' }}>All chips placed — check your answers →</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right — drop zones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {comps.map((c: any) => {
                  const placedChipKey = placedComponents[c.key];
                  const placedComp = placedChipKey ? comps.find((comp: any) => comp.key === placedChipKey) : null;
                  const isPlaced = !!placedChipKey;
                  const isCorrect = placedChipKey === c.key;
                  const isDragTarget = !!draggedChip && draggedChip !== placedChipKey;
                  return (
                    <div
                      key={c.key}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(c.key)}
                      onClick={() => { if (isTouch && draggedChip) handleDrop(c.key); }}
                      style={{ border: isPlaced ? `1.5px solid ${c.color}` : `1.5px dashed ${isDragTarget ? c.color : c.color + '55'}`, background: isPlaced ? c.light : isDragTarget ? c.color + '0A' : '#FAFAFA', borderRadius: 8, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms ease' }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', background: c.color, padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>{c.key}</span>
                      <span style={{ fontSize: 12, color: isPlaced ? '#2D3748' : '#A0AEC0', fontStyle: isPlaced ? 'normal' : 'italic', lineHeight: 1.5, flex: 1 }}>
                        {placedComp ? (placedComp.chipText || (placedComp.filledText.length > 50 ? placedComp.filledText.slice(0, 50) + '…' : placedComp.filledText)) : c.dropHint}
                      </span>
                      {buildChecked && isPlaced && (
                        <span style={{ fontSize: 16, fontWeight: 700, color: isCorrect ? '#48BB78' : '#FC8181', flexShrink: 0 }}>{isCorrect ? '✓' : '✗'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Check Answers button */}
            {!buildComplete && (
              <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setBuildChecked(true);
                    if (comps.every((comp: any) => placedComponents[comp.key] === comp.key)) {
                      setTimeout(() => setBuildComplete(true), 600);
                    }
                  }}
                  disabled={!allPlaced}
                  style={{ padding: '8px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700, border: 'none', cursor: allPlaced ? 'pointer' : 'default', background: allPlaced ? '#1A202C' : '#E2E8F0', color: allPlaced ? '#FFFFFF' : '#A0AEC0', transition: 'all 0.15s ease' }}
                >
                  Check Answers
                </button>
              </div>
            )}
          </div>
        );
      }

      /* ── Persona (Slides 7–11 — two-column: context + prompt/output) ── */
      case 'persona': {
        const p = s.personaData;
        if (!p) return null;

        // predictFirst — stays in same layout, reveals feedback + approach inline
        if (s.predictFirst) {
          const opts = s.predictOptions || ['Brain Dump', 'Conversational', 'Blueprint'];
          const isCorrect = predictSelected === s.predictCorrect;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: fs ? '20px 32px' : '12px 18px', overflowY: 'auto', boxSizing: 'border-box' as const, gap: 12 }}>

              {/* ── Persona hero card ── */}
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${p.color}33`, flexShrink: 0 }}>
                <div style={{ background: `linear-gradient(135deg, ${p.color}22 0%, ${p.color}0A 100%)`, borderBottom: `2px solid ${p.color}22`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: p.color, overflow: 'hidden', flexShrink: 0, border: `3px solid ${p.color}`, boxShadow: `0 4px 16px ${p.color}44` }}>
                    {p.iconPath
                      ? <img src={p.iconPath} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>{p.initial}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', lineHeight: 1.1, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: '#4A5568', fontWeight: 500, marginBottom: 8 }}>{p.role}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {p.tags.map((t, i) => (
                        <span key={i} style={{ fontSize: 11, color: p.color, background: `${p.color}18`, border: `1px solid ${p.color}44`, borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '12px 20px', background: '#fff' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: p.color, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 5 }}>THEIR SITUATION</div>
                  <div style={{ fontSize: 14, color: '#2D3748', lineHeight: 1.65, fontWeight: 500 }}>{p.scenario ?? p.approachDef.split('. ')[0] + '.'}</div>
                </div>
              </div>

              {/* ── Question ── */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C', marginBottom: 6 }}>
                  Which approach fits {p.name}'s situation?
                </div>
                {!predictChecked && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 8, padding: '5px 12px', marginBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>👇</span>
                    <span style={{ fontSize: 12, color: '#2B6CB0', fontWeight: 600 }}>Pick one to see the answer</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                  {opts.map((opt, i) => {
                    const isSelected = predictSelected === i;
                    const showResult = predictChecked;
                    const isBest = i === s.predictCorrect;
                    return (
                      <div key={i} onClick={() => { if (!predictChecked) { setPredictSelected(i); setPredictChecked(true); } }} style={{
                        flex: '1 1 120px', padding: '12px 16px', borderRadius: 12, textAlign: 'center' as const, fontSize: 14, fontWeight: 700, cursor: predictChecked ? 'default' : 'pointer', transition: 'all 150ms ease',
                        border: showResult ? (isBest ? '2px solid #38A169' : isSelected ? '2px solid #E53E3E' : '1px solid #E2E8F0') : (isSelected ? `2px solid ${p.color}` : '1.5px solid #E2E8F0'),
                        background: showResult ? (isBest ? '#F0FFF4' : isSelected && !isBest ? '#FFF5F5' : '#F7FAFC') : (isSelected ? `${p.color}18` : '#FAFAFA'),
                        color: showResult ? (isBest ? '#276749' : isSelected && !isBest ? '#9B2C2C' : '#718096') : (isSelected ? p.color : '#4A5568'),
                        boxShadow: isSelected && !showResult ? `0 2px 8px ${p.color}33` : 'none',
                      }}>
                        {showResult && isBest ? '★ ' : ''}{opt}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Feedback ── */}
              {predictChecked && predictSelected !== null && (
                <div style={{ animation: 'fadeInUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: isCorrect ? '#F0FFF4' : '#FFF5F5', border: `2px solid ${isCorrect ? '#68D391' : '#FC8181'}`, borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isCorrect ? '#276749' : '#9B2C2C', marginBottom: 5 }}>{isCorrect ? '✅ That\'s the best fit!' : '❌ Not quite — here\'s why'}</div>
                    <p style={{ fontSize: 13, color: isCorrect ? '#276749' : '#9B2C2C', lineHeight: 1.65, margin: 0 }}>{s.predictFeedback?.[predictSelected]}</p>
                  </div>
                  {!isCorrect && (
                    <div style={{ background: '#F0FFF4', border: '2px solid #68D391', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#276749', marginBottom: 5 }}>✅ Best fit: {opts[s.predictCorrect ?? 0]}</div>
                      <p style={{ fontSize: 13, color: '#276749', lineHeight: 1.65, margin: 0 }}>{s.predictFeedback?.[s.predictCorrect ?? 0]}</p>
                    </div>
                  )}
                  <div style={{ background: `${p.color}0D`, border: `1.5px solid ${p.color}44`, borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>HOW {p.name.toUpperCase()} ACTUALLY DOES IT</div>
                    <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.65, marginBottom: 8, fontStyle: 'italic' }}>"{p.prompt.length > 180 ? p.prompt.slice(0, 180) + '…' : p.prompt}"</div>
                    <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}><span style={{ color: p.color, fontWeight: 700 }}>Why: </span>{p.why}</div>
                  </div>
                </div>
              )}
            </div>
          );
        }

        const toggleExpand = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
        return (
          <div style={{ padding: fs ? '24px 40px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left — context panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.color, overflow: 'hidden', flexShrink: 0, border: `2px solid ${p.color}66` }}>
                    {p.iconPath
                    ? <img src={p.iconPath} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>{p.initial}</span>
                  }
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C' }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#718096' }}>{p.role}</div>
                  </div>
                </div>
                <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: p.color, padding: '4px 12px', borderRadius: 16 }}>{p.approach}</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.tags.map((tag, i) => <span key={i} style={{ fontSize: 10, color: '#A0AEC0', border: '1px solid #E2E8F0', borderRadius: 8, padding: '2px 8px' }}>{tag}</span>)}
                </div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}>
                  <ExpandableText text={p.approachDef} maxLen={130} id={`persona-def-${p.name}`} expanded={!!expandedSections[`persona-def-${p.name}`]} onToggle={toggleExpand} />
                </div>
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
          { label: 'Unstructured inputs, unknown output', example: "You have rough notes from a workshop and don't yet know what the deliverable should be." },
          { label: 'Exploratory work, evolving direction', example: "You're drafting a proposal and aren't sure of the right angle yet — you want to think through options." },
          { label: 'Repeatable, high-stakes, known format', example: 'You write the same executive update every Friday — same audience, same structure.' },
          { label: 'Complex reasoning needed', example: 'You need the AI to work through a trade-off or a multi-step problem before giving you an answer.' },
          { label: 'Quality/style calibration required', example: 'You want the output to match the tone of a previous document or a specific writing style.' },
          { label: 'Close but needs refinement', example: "The first output is 70% there — you want to sharpen one section without starting again." },
        ];
        const APPROACHES = [
          { label: 'Brain Dump',    color: '#2B4C7E', light: '#EBF4FF' },
          { label: 'Conversational', color: '#38B2AC', light: '#E6FFFA' },
          { label: 'Blueprint',     color: '#1A202C', light: '#F0F2F5' },
        ];
        // best | works | skip — modifiers removed
        const RATINGS: Array<Array<'best' | 'works' | 'skip'>> = [
          ['best',  'works', 'skip' ],
          ['works', 'best',  'skip' ],
          ['skip',  'works', 'best' ],
          ['works', 'works', 'best' ],
          ['skip',  'works', 'works'],
          ['skip',  'best',  'works'],
        ];
        return (
          <div style={{ padding: fs ? '20px 32px' : '12px 16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: 8, boxSizing: 'border-box' as const }}>
            {SITUATIONS.map((sit, rowIdx) => (
              <div key={rowIdx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {/* Left: text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', lineHeight: 1.4, marginBottom: 3 }}>{sit.label}</div>
                  <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.5 }}>{sit.example}</div>
                </div>
                {/* Right: approach chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, alignItems: 'flex-end' }}>
                  {APPROACHES.map((ap, colIdx) => {
                    const rating = RATINGS[rowIdx][colIdx];
                    if (rating === 'skip') return null;
                    const isBest = rating === 'best';
                    return (
                      <span key={colIdx} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' as const,
                        background: isBest ? ap.color : ap.light,
                        color: isBest ? '#FFFFFF' : ap.color,
                        border: isBest ? 'none' : `1.5px solid ${ap.color}70`,
                      }}>
                        {isBest ? '★' : '◐'} {ap.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }

      /* ── SJ Exercise (Slide 13 — real-world scenario judgment) ── */
      case 'sjExercise': {
        const sj = s.sjData;
        if (!sj) return null;
        const slideKey = currentSlide;
        const selectedOpt = sjAnswers[slideKey] ?? null;
        const revealed = selectedOpt !== null;
        const isCorrect = revealed && selectedOpt === sj.correct;
        return (
          <div style={{ padding: fs ? '20px 36px' : '12px 18px', display: 'flex', flexDirection: 'column', height: '100%', gap: 12, overflowY: 'auto', boxSizing: 'border-box' as const }}>

            {/* ── Purpose banner ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(90deg, #2B4C7E 0%, #38B2AC 100%)', borderRadius: 10, padding: '10px 16px' }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Quick Challenge</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Read the scenario below — which prompting approach would you use?</div>
              </div>
            </div>

            {/* ── Scenario card ── */}
            <div style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #E6FFFA 100%)', borderRadius: 12, padding: '16px 20px', border: '1.5px solid #2B4C7E22' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1E3A5F', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>THE SITUATION</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A202C', marginBottom: 6 }}>{sj.heading}</div>
              <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.65, marginBottom: 12 }}>{sj.body}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {sj.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFFFFF', border: '1px solid #C3D0F5', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#2B4C7E', fontWeight: 600 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2B4C7E', flexShrink: 0 }} />{b}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Pick an approach ── */}
            <div style={{ flexShrink: 0 }}>
              {!revealed && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 8, padding: '5px 12px', marginBottom: 10 }}>
                  <span style={{ fontSize: 13 }}>👇</span>
                  <span style={{ fontSize: 12, color: '#2B6CB0', fontWeight: 600 }}>Tap an approach to see if you're right</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sj.options.map((opt, i) => {
                  const isSelected = selectedOpt === i;
                  const isBest = i === sj.correct;
                  const isWrong = revealed && isSelected && !isBest;
                  return (
                    <button key={i} onClick={() => { if (!revealed) setSjAnswers(prev => ({ ...prev, [slideKey]: i })); }} style={{
                      width: '100%', textAlign: 'left' as const, padding: '13px 16px', borderRadius: 10,
                      cursor: revealed ? 'default' : 'pointer',
                      border: revealed ? (isBest ? '2px solid #38A169' : isWrong ? '2px solid #E53E3E' : '1px solid #E2E8F0') : '1.5px solid #E2E8F0',
                      background: revealed ? (isBest ? '#F0FFF4' : isWrong ? '#FFF5F5' : '#FAFAFA') : '#FFFFFF',
                      fontSize: 13, fontWeight: 700,
                      color: revealed ? (isBest ? '#276749' : isWrong ? '#9B2C2C' : '#A0AEC0') : '#1A202C',
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: !revealed ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <span style={{ fontSize: 15 }}>{['🧠', '💬', '📐'][i]}</span>
                      {opt}
                      {revealed && isBest && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#38A169', background: '#C6F6D5', padding: '2px 10px', borderRadius: 20 }}>✓ Best fit</span>}
                      {isWrong && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#9B2C2C', background: '#FED7D7', padding: '2px 10px', borderRadius: 20 }}>Not quite</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Feedback ── */}
            {revealed && selectedOpt !== null && (
              <div style={{ animation: 'fadeInUp 0.25s ease', borderRadius: 12, padding: '14px 16px', background: isCorrect ? '#F0FFF4' : '#FFFBEB', border: `2px solid ${isCorrect ? '#68D391' : '#F6AD55'}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: isCorrect ? '#276749' : '#C05621', marginBottom: 4 }}>{isCorrect ? '✅ Spot on!' : '💡 Here\'s why that\'s not the best fit'}</div>
                <div style={{ fontSize: 12, color: isCorrect ? '#276749' : '#744210', lineHeight: 1.65 }}>{sj.feedback[selectedOpt]}</div>
                {!isCorrect && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F6AD5533', fontSize: 12, color: '#276749', fontWeight: 600 }}>
                    The best fit: <span style={{ fontWeight: 700 }}>{sj.options[sj.correct]}</span> — {sj.feedback[sj.correct]}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      /* ── Module Summary (Wrap Up) ── */
      case 'moduleSummary': {
        const BLUEPRINT_COMPONENTS = [
          { label: 'Role',    color: '#667EEA', light: '#EBF4FF', desc: 'Who the AI is' },
          { label: 'Context', color: '#38B2AC', light: '#E6FFFA', desc: 'What it needs to know' },
          { label: 'Task',    color: '#ED8936', light: '#FFFBEB', desc: 'What to produce' },
          { label: 'Format',  color: '#48BB78', light: '#F0FFF4', desc: 'How to structure it' },
          { label: 'Steps',   color: '#9F7AEA', light: '#FAF5FF', desc: 'How to think' },
          { label: 'Checks',  color: '#F6AD55', light: '#FFFAF0', desc: 'What to avoid' },
        ];
        const APPROACH_ITEMS = [
          { icon: '🧠', label: 'Brain Dump',    color: '#ED8936', light: '#FFFBEB', when: 'Unstructured thinking — you don\'t yet know what the output should look like' },
          { icon: '💬', label: 'Conversational', color: '#9F7AEA', light: '#FAF5FF', when: 'Exploratory work — steer and refine across multiple turns' },
          { icon: '📐', label: 'Blueprint',      color: '#38B2AC', light: '#E6FFFA', when: 'Repeatable, high-stakes tasks — invest once, reuse every time' },
        ];
        return (
          <div style={{ padding: fs ? '16px 28px' : '8px 12px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' as const, gap: 12 }}>

            {/* Section 1 — Prompt Blueprint (white card) */}
            <div style={{ background: '#FFFFFF', borderRadius: 14, padding: fs ? '16px 20px' : '12px 16px', border: '1.5px solid #E2E8F0', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: fs ? 13 : 12, fontWeight: 800, color: '#38B2AC', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 4 }}>The Prompt Blueprint</div>
              <div style={{ fontSize: fs ? 15 : 14, color: '#4A5568', marginBottom: 10, lineHeight: 1.4 }}>Six components that give the AI everything it needs — and leave nothing to chance.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1 }}>
                {BLUEPRINT_COMPONENTS.map((c, i) => (
                  <div key={i} style={{ background: c.light, border: `1.5px solid ${c.color}55`, borderRadius: 10, padding: fs ? '14px 16px' : '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                    <div style={{ fontSize: fs ? 19 : 17, fontWeight: 900, color: c.color }}>{c.label}</div>
                    <div style={{ fontSize: fs ? 15 : 13, color: '#4A5568', lineHeight: 1.4 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2 — The Approaches */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: fs ? 13 : 12, fontWeight: 800, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>The Three Approaches</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
                {APPROACH_ITEMS.map((item, i) => (
                  <div key={i} style={{ background: item.light, border: `1.5px solid ${item.color}55`, borderTop: `3px solid ${item.color}`, borderRadius: 12, padding: fs ? '16px 18px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: fs ? 26 : 22 }}>{item.icon}</span>
                      <span style={{ fontSize: fs ? 19 : 16, fontWeight: 900, color: item.color }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: fs ? 15 : 13, color: '#2D3748', lineHeight: 1.6, flex: 1 }}>
                      <span style={{ fontWeight: 700, color: item.color }}>Use when: </span>{item.when}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );
      }

      /* ── Parallel Demo (no dropdowns — all content visible) ── */
      case 'parallelDemo':
        return (
          <div style={{ padding: fs ? '40px 60px' : '24px 32px' }}>
            {s.body && <p style={{ fontSize: fs ? 16 : 15, color: '#4A5568', lineHeight: 1.75, margin: '0 0 14px' }}>{s.body}</p>}
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', padding: '32px 48px' }}>
            <h2 style={{ fontSize: fs ? 40 : 30, fontWeight: 800, color: '#1A202C', lineHeight: 1.3, margin: '0 0 14px', maxWidth: 700, whiteSpace: 'nowrap' }}>{s.heading}</h2>
            {s.subheading && (
              <p style={{ fontSize: fs ? 24 : 20, color: '#1A202C', lineHeight: 1.5, maxWidth: 700, margin: '0 0 24px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {s.tealPhrase ? <TealPhrase text={s.subheading} phrase={s.tealPhrase} /> : s.subheading}
              </p>
            )}
            {s.footnote && <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.7, maxWidth: 520, margin: 0 }}>{s.footnote}</p>}
          </div>
        );

      /* ── Gap Diagram (annotated prompt with RCTF underlines + animated insight) ── */
      case 'gapDiagram':
        return (
          <div style={{ padding: fs ? '20px 36px' : '12px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: '0 0 12px' }}>{s.body}</p>}
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
              <div style={{ padding: '12px 18px', background: '#EBF8FF', borderRadius: 10, border: '1px solid #38B2AC33', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>💡</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A202C', lineHeight: 1.5 }}>{s.gapNote}</div>
              </div>
            )}
          </div>
        );

      /* ── Toolkit Overview (Blueprint + Approaches + Amplifiers) ── */
      case 'toolkitOverview':
        return (
          <div style={{ padding: fs ? '24px 44px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: '0 0 14px' }}>{s.body}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {s.toolkitItems?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderRadius: 14, border: `1px solid ${item.color}33`, background: `${item.color}06`, animation: `fadeInUp 0.4s ease ${i * 0.15}s both` }}>
                  <div style={{ fontSize: 36, flexShrink: 0, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${item.color}15`, borderRadius: 12 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.5, marginBottom: 4 }}>{item.desc}</div>
                    <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.4 }}><span style={{ fontWeight: 600, color: item.color }}>When to use:</span> {item.whenToUse}</div>
                    {item.relationship && (
                      <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 3, fontStyle: 'italic' }}>{item.relationship}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Relationship connector */}
            <div style={{ marginTop: 10, padding: '10px 16px', background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: '#4A5568' }}>Blueprint = </span>
              <span style={{ fontSize: 13, color: '#667EEA', fontWeight: 700 }}>what to include</span>
              <span style={{ fontSize: 13, color: '#4A5568' }}> · Approaches = </span>
              <span style={{ fontSize: 13, color: '#ED8936', fontWeight: 700 }}>how to deliver</span>
              <span style={{ fontSize: 13, color: '#4A5568' }}> · Modifiers = </span>
              <span style={{ fontSize: 13, color: '#9F7AEA', fontWeight: 700 }}>how the AI thinks</span>
            </div>
          </div>
        );

      /* ── RCTF 3×2 grid (icons, no dropdowns — all visible) ── */
      case 'rctf':
        return (
          <div style={{ padding: fs ? '24px 40px' : '14px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            {s.subheading && <p style={{ fontSize: fs ? 15 : 13, color: '#718096', lineHeight: 1.6, margin: '0 0 10px' }}>{s.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, flex: 1, alignContent: 'center' }}>
              {s.elements?.map((el) => (
                <div key={el.key} style={{ padding: fs ? '14px 16px' : '12px 14px', borderRadius: 10, border: `1px solid ${el.color}33`, background: el.light || `${el.color}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    {el.icon && <span style={{ fontSize: 18 }}>{el.icon}</span>}
                    <span style={{ fontSize: 11, fontWeight: 800, color: el.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{el.key}</span>
                  </div>
                  <div style={{ fontSize: fs ? 12 : 11, color: '#4A5568', lineHeight: 1.5, marginBottom: 5 }}>{el.desc}</div>
                  {el.example && <div style={{ fontSize: fs ? 11 : 10, color: '#718096', fontStyle: 'italic', lineHeight: 1.4, borderTop: '1px solid #E2E8F0', paddingTop: 5, marginBottom: 4 }}>"{el.example}"</div>}
                  {el.whyItMatters && (
                    <div style={{ fontSize: fs ? 11 : 10, color: el.color, lineHeight: 1.4, padding: '4px 8px', background: '#FFFFFF', borderRadius: 4, border: `1px solid ${el.color}22` }}>
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
      case 'approachIntro': {
        const approaches = (s as any).approaches ?? [];
        const allFlipped = approaches.every((_: any, i: number) => !!flippedCards[i]);
        return (
          <div style={{ padding: fs ? '18px 40px' : '12px 20px', display: 'flex', flexDirection: 'column', height: '100%', gap: 14, boxSizing: 'border-box' as const }}>

            {/* Instruction */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#38B2AC15', border: '1.5px solid #38B2AC55', borderRadius: 10, padding: '7px 14px' }}>
                <span style={{ fontSize: 16 }}>👆</span>
                <span style={{ fontSize: fs ? 13 : 12, fontWeight: 700, color: '#1A6B5F' }}>Click each card or use Next to explore</span>
              </div>
              <div style={{ fontSize: fs ? 12 : 11, color: '#A0AEC0', fontWeight: 500 }}>
                {approaches.filter((_: any, i: number) => !!flippedCards[i]).length}/{approaches.length} explored
              </div>
            </div>

            {/* 3-column flip cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: fs ? 14 : 10, flex: 1, minHeight: 0 }}>
              {approaches.map((a: any, i: number) => {
                const flipped = !!flippedCards[i];
                return (
                  <button
                    key={i}
                    onClick={() => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }))}
                    style={{
                      background: flipped ? a.light : '#F7FAFC',
                      border: `2px solid ${flipped ? a.color : '#E2E8F0'}`,
                      borderTop: `4px solid ${flipped ? a.color : '#CBD5E0'}`,
                      borderRadius: 14, padding: fs ? '22px 22px' : '16px 16px',
                      cursor: 'pointer', textAlign: 'left' as const,
                      display: 'flex', flexDirection: 'column',
                      gap: flipped ? 14 : 0, justifyContent: flipped ? 'flex-start' : 'center', alignItems: flipped ? 'flex-start' : 'center',
                      transition: 'all 0.2s ease', height: '100%', boxSizing: 'border-box' as const,
                    }}
                  >
                    {flipped ? (
                      <>
                        {/* Flipped: full detail */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: fs ? 24 : 20 }}>{a.icon}</span>
                          <div style={{ fontSize: fs ? 18 : 15, fontWeight: 900, color: a.color }}>{a.name}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: fs ? 10 : 9, fontWeight: 800, color: a.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>When to use</div>
                          <div style={{ fontSize: fs ? 14 : 12, color: '#2D3748', lineHeight: 1.6 }}>{a.when}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: fs ? 10 : 9, fontWeight: 800, color: a.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>How it works</div>
                          <div style={{ fontSize: fs ? 14 : 12, color: '#2D3748', lineHeight: 1.6 }}>{a.how}</div>
                        </div>

                        <div style={{ marginTop: 'auto', background: '#FFFFFF', border: `1px solid ${a.color}44`, borderRadius: 8, padding: fs ? '8px 12px' : '6px 10px', width: '100%', boxSizing: 'border-box' as const }}>
                          <div style={{ fontSize: fs ? 12 : 10, fontWeight: 700, color: a.color }}>{a.connection}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Default: just icon + name + prompt */}
                        <span style={{ fontSize: fs ? 36 : 28, marginBottom: 10 }}>{a.icon}</span>
                        <div style={{ fontSize: fs ? 18 : 15, fontWeight: 900, color: '#4A5568', marginBottom: 6 }}>{a.name}</div>
                        <div style={{ fontSize: fs ? 13 : 11, color: '#A0AEC0', fontWeight: 500, textAlign: 'center' as const }}>{a.tagline}</div>
                        <div style={{ marginTop: 16, fontSize: fs ? 11 : 10, color: '#CBD5E0', fontWeight: 600 }}>tap to explore ▸</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Completion nudge */}
            {allFlipped && (
              <div style={{ flexShrink: 0, textAlign: 'center' as const, fontSize: fs ? 13 : 11, color: '#276749', fontWeight: 600 }}>
                ✓ All three explored — next you'll see each one in action
              </div>
            )}
          </div>
        );
      }

      case 'approachMatrix':
        return <ApproachMatrixSlide slide={s} fs={fs} />;

      /* ── Situational Judgment (with persona framing & multi-step) ── */
      case 'situationalJudgment':
        return <SituationalJudgmentSlide slide={s} fs={fs} activeScenarioIdx={sjScenarioIdx} onScenarioChange={setSjScenarioIdx} />;

      /* ── Bridge ── */
      case 'bridge':
        return (
          <div style={{ display: 'flex', gap: 0, height: '100%', overflow: 'hidden' }}>
            <div style={{ flex: 1, background: '#38B2AC', padding: fs ? '36px 48px' : '22px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: fs ? 34 : 26, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.2 }}>{s.heading}</h2>
              <p style={{ fontSize: fs ? 18 : 16, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 0 16px' }}>{s.body}</p>
              {s.ctaText && s.ctaHref && (
                <a href={s.ctaHref} style={{ display: 'inline-block', background: '#FFFFFF', color: '#38B2AC', fontWeight: 700, fontSize: 15, padding: '10px 24px', borderRadius: 24, textDecoration: 'none', alignSelf: 'flex-start' }}>{s.ctaText}</a>
              )}
            </div>
            <div style={{ width: '40%', background: '#2C9A94', padding: fs ? '36px 36px' : '22px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {s.panelHeading && <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 12, lineHeight: 1.3 }}>{s.panelHeading}</div>}
              {s.panelItems && (
                <ul style={{ margin: 0, padding: '0 0 0 16px', listStyleType: 'disc' }}>
                  {s.panelItems.map((item, i) => (
                    <li key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 6 }}>{item}</li>
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
            {s.body && <p style={{ fontSize: fs ? 15 : 13, color: '#4A5568', lineHeight: 1.6, margin: '0 0 16px' }}>{s.body}</p>}
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
            {s.scenario && (
              <div style={{ background: 'linear-gradient(135deg, #E6FFFA 0%, #EBF8FF 100%)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, border: '1.5px solid #38B2AC33' }}>
                <span style={{ fontSize: 12, color: '#2B4C7E', fontWeight: 600 }}>SCENARIO: </span>
                <span style={{ fontSize: 12, color: '#2D3748', lineHeight: 1.5 }}>{s.scenario}</span>
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
            {s.instruction && <p style={{ fontSize: fs ? 14 : 12, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>{s.instruction}</p>}
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
            {s.scenario && (
              <div style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #E6FFFA 100%)', borderRadius: 10, padding: '10px 16px', marginBottom: 12, border: '1.5px solid #2B4C7E22' }}>
                <span style={{ fontSize: 12, color: '#2D3748', lineHeight: 1.5 }}>{s.scenario}</span>
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
            {s.body && <p style={{ fontSize: fs ? 14 : 12, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>{s.body}</p>}
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

      /* ── Summary Card ── */
      case 'summaryCard': {
        const els = s.elements ?? [];
        return (
          <div style={{ padding: fs ? '28px 48px' : '18px 28px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            {s.body && <p style={{ fontSize: fs ? 14 : 13, color: '#4A5568', lineHeight: 1.6, margin: '0 0 18px' }}>{s.body}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
              {els.map((el) => (
                <div key={el.key} style={{ background: el.light ?? '#F7FAFC', border: `1.5px solid ${el.color}40`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {el.icon && <span style={{ fontSize: 18 }}>{el.icon}</span>}
                    <span style={{ fontSize: fs ? 14 : 13, fontWeight: 800, color: el.color }}>{el.key}</span>
                  </div>
                  <p style={{ fontSize: fs ? 12 : 11, color: '#4A5568', margin: 0, lineHeight: 1.5 }}>{el.desc}</p>
                  <p style={{ fontSize: fs ? 11 : 10, color: '#718096', margin: 0, lineHeight: 1.5, fontStyle: 'italic', borderTop: `1px solid ${el.color}25`, paddingTop: 6 }}>{el.example}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      /* ── Spot the Flaw ── */
      case 'spotTheFlaw': {
        const flawOptions = s.quizOptions ?? [];
        const flawCorrect = s.correct ?? 0;
        const flawChosen = flawSelected !== null;
        const flawSolved = flawSelected === flawCorrect;
        const OPTION_COLORS = ['#667EEA', '#38B2AC', '#ED8936', '#48BB78', '#9F7AEA', '#F6AD55'];
        const OPTION_LIGHTS = ['#EBF4FF', '#E6FFFA', '#FFFBEB', '#F0FFF4', '#FAF5FF', '#FFFAF0'];
        return (
          <div style={{ padding: fs ? '20px 40px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', gap: 14, boxSizing: 'border-box' as const }}>
            {/* Prompt box */}
            <div style={{ background: '#EDF2F7', border: '2px solid #CBD5E0', borderLeft: '4px solid #38B2AC', borderRadius: 14, padding: fs ? '18px 24px' : '14px 18px', flexShrink: 0 }}>
              <div style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>The Prompt</div>
              <div style={{ fontSize: fs ? 17 : 15, color: '#2D3748', lineHeight: 1.75, whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                {s.buildTask?.replace(/^Here's the prompt to analyse:\n\n/, '')}
              </div>
            </div>

            {/* Question */}
            <div style={{ flexShrink: 0 }}>
              <p style={{ fontSize: fs ? 17 : 15, fontWeight: 700, color: '#1A202C', margin: 0, lineHeight: 1.4 }}>
                Which Blueprint element is missing?
              </p>
            </div>

            {/* Option buttons — 3×2 grid, fills remaining space */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: fs ? 12 : 10, flex: 1, minHeight: 0 }}>
              {flawOptions.map((opt, i) => {
                const isCorrect = i === flawCorrect;
                const isSelected = flawSelected === i;
                const wasWrong = flawChosen && isSelected && !isCorrect;
                let bg = OPTION_LIGHTS[i], border = OPTION_COLORS[i] + '66', color = OPTION_COLORS[i];
                if (flawSolved && isCorrect) { bg = '#C6F6D5'; border = '#38A169'; color = '#276749'; }
                else if (wasWrong) { bg = '#FED7D7'; border = '#E53E3E'; color = '#C53030'; }
                return (
                  <button key={opt} onClick={() => !flawSolved && setFlawSelected(i)} style={{
                    padding: fs ? '18px 14px' : '14px 10px', borderRadius: 14,
                    fontSize: fs ? 18 : 15, fontWeight: 700,
                    background: bg, border: `2px solid ${border}`, color,
                    cursor: flawSolved ? 'default' : 'pointer',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                    boxShadow: !flawSolved ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', textAlign: 'center' as const, lineHeight: 1.3,
                  }}>
                    {flawSolved && isCorrect ? '✓ ' : wasWrong ? '✗ ' : ''}{opt}
                  </button>
                );
              })}
            </div>

            {/* Feedback / hint strip — fixed at bottom */}
            <div style={{ flexShrink: 0 }}>
              {flawSolved && s.explanation && (
                <div style={{ background: '#F0FFF4', border: '2px solid #68D391', borderRadius: 12, padding: fs ? '16px 20px' : '12px 16px', animation: 'fadeInUp 0.25s ease' }}>
                  <span style={{ fontWeight: 800, fontSize: fs ? 22 : 18, color: '#276749', display: 'block', marginBottom: 6 }}>✓ Correct!</span>
                  <span style={{ fontSize: fs ? 15 : 13, color: '#2D3748', lineHeight: 1.7 }}>{s.explanation}</span>
                </div>
              )}
              {flawChosen && !flawSolved && (
                <div style={{ textAlign: 'center' as const, fontSize: fs ? 14 : 12, color: '#C53030', fontWeight: 600, padding: '8px 0' }}>
                  Not quite — try another
                </div>
              )}
              {!flawChosen && (
                <div style={{ textAlign: 'center' as const, fontSize: fs ? 13 : 11, color: '#A0AEC0', fontWeight: 500, padding: '6px 0' }}>
                  Select an answer above
                </div>
              )}
            </div>
          </div>
        );
      }

      /* ── Concept (enhanced: two-column with visual panel when visualId present) ── */
      case 'concept':
      default:
        if (s.visualId) {
          return (
            <div style={{ padding: fs ? '20px 36px' : '12px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                {/* Left: text */}
                <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column' }}>
                  {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{s.body}</p>}
                  {s.pullQuote && (
                    <div style={{ borderLeft: '4px solid #38B2AC', background: '#E6FFFA', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: 15, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontStyle: 'italic', marginTop: 'auto' }}>
                      {s.pullQuote}
                    </div>
                  )}
                </div>
                {/* Right: visual panel */}
                <div style={{ flex: '0 0 43%', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {renderConceptVisual(s.visualId, fs)}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: fs ? '36px 64px' : '22px 36px' }}>
            {s.body && <p style={{ fontSize: fs ? 22 : 18, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
            {s.pullQuote && (
              <div style={{ borderLeft: '4px solid #38B2AC', background: '#E6FFFA', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 18, fontSize: 17, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontStyle: 'italic' }}>
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
    </div>
  );

  // Reset interactive state when slide changes (sjAnswers persist across slides intentionally)
  useEffect(() => {
    setSjScenarioIdx(0);
    setQuizSelected(null);
    setQuizAnswered(false);
    setSpectrumPos(0);
    setFlippedCards({});
    setBranchingSelected(null);
    setBranchingStep(0);
    setCopiedId(null);
    setActiveCompTab(0);
    setExpandedSections({});
    setContextStep(0);
    setScenarioTab('rushed');
    setExpandedMatrixRow(null);
    setPlacedComponents({});
    setDraggedChip(null);
    setBuildComplete(false);
    setBuildChecked(false);
    setPredictSelected(null);
    setPredictRevealed(false);
    setPredictChecked(false);
    setFlawSelected(null);
  }, [currentSlide]);

  /* ── Next button interception: reveal slides + situationalJudgment cycling ── */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleNextClick = () => {
    // buildAPrompt: require at least one placement attempt before proceeding
    if (s.type === 'buildAPrompt') {
      const attempted = Object.keys(placedComponents).length > 0;
      if (!attempted) {
        showToast('Try the activity before proceeding');
        return;
      }
    }
    // situationalJudgment: cycle through scenarios
    if (s.type === 'situationalJudgment' && s.scenarios && sjScenarioIdx < s.scenarios.length - 1) {
      setSjScenarioIdx((prev) => prev + 1);
      return;
    }
    // scenarioComparison: reveal thorough tab on first Next
    if (s.type === 'scenarioComparison' && scenarioTab === 'rushed') {
      setScenarioTab('thorough');
      return;
    }
    // contextBar: reveal one card at a time
    if (s.type === 'contextBar' && contextStep < 6) {
      setContextStep((prev) => prev + 1);
      return;
    }
    // comparison: advance through tabs
    if (s.type === 'comparison') {
      const tabCount = (s as any).tabs?.length ?? 3;
      if (activeCompTab < tabCount - 1) {
        setActiveCompTab((prev) => prev + 1);
        return;
      }
    }
    // flipcard: flip next unflipped card in order
    if (s.type === 'flipcard') {
      const cards = (s as any).cards ?? [];
      const nextUnflipped = cards.findIndex((_: any, i: number) => !flippedCards[i]);
      if (nextUnflipped !== -1) {
        setFlippedCards((prev) => ({ ...prev, [nextUnflipped]: true }));
        return;
      }
    }
    // branching: expand next option in order
    if (s.type === 'branching') {
      const opts = (s as any).branchingOptions ?? [];
      if (branchingStep < opts.length) {
        setBranchingSelected(branchingStep);
        setBranchingStep((prev) => prev + 1);
        return;
      }
    }
    // spectrum: advance through positions 0 → 1 → 2
    if (s.type === 'spectrum' && spectrumPos < 2) {
      setSpectrumPos((prev) => prev + 1);
      return;
    }
    // approachIntro: flip next unflipped card in order
    if (s.type === 'approachIntro') {
      const approaches = (s as any).approaches ?? [];
      const nextUnflipped = approaches.findIndex((_: any, i: number) => !flippedCards[i]);
      if (nextUnflipped !== -1) {
        setFlippedCards((prev) => ({ ...prev, [nextUnflipped]: true }));
        return;
      }
    }
    // Default: navigate to next slide
    if (isLastSlide) {
      if (isFullscreen) setIsFullscreen(false);
      setShowReflection(true);
    } else {
      goToSlide(currentSlide + 1);
    }
  };

  /* ── Dynamic Next button label ── */
  const nextLabel = isLastSlide ? 'Finish E-Learning \u2192' : 'Next \u2192';

  /* ── Standardised takeaway title (shown at top of every slide that has one) ── */
  const renderTakeaway = () => {
    if (!s.takeaway || s.type === 'courseIntro' || s.type === 'bridge') return null;
    return (
      <div style={{ flexShrink: 0, padding: fs ? '16px 44px 12px' : '10px 20px 8px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        {s.section && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#2B4C7E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 3 }}>{s.section}</div>
        )}
        <div style={{ fontSize: fs ? 22 : 18, fontWeight: 800, color: '#1A202C', lineHeight: 1.25 }}>{s.takeaway}</div>
      </div>
    );
  };

  /* ── Fullscreen overlay ── */
  if (isFullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000000', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#1A202C', height: 48, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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
        <div style={{ flex: 1, position: 'relative', background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderTakeaway()}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: isStretchType ? 'stretch' : 'flex-start' }}>
            {renderSlide()}
          </div>
          {s.sourceLink && (
            <div style={{ flexShrink: 0, padding: '4px 32px', borderTop: '1px solid #EDF2F7', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase' as const, flexShrink: 0 }}>Source</span>
              <a href={s.sourceLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#A0AEC0', textDecoration: 'underline', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.sourceText || s.sourceLink}
              </a>
            </div>
          )}
        </div>
        {currentSlide > 1 && (
          <div style={{ borderTop: '1px solid #2D3748', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A202C', flexShrink: 0 }}>
            <button onClick={() => goToSlide(currentSlide - 1)} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: '1px solid #4A5568', background: 'transparent', color: '#E2E8F0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ← Previous
            </button>
            <button onClick={handleNextClick} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: 'none', background: isLastSlide ? accentColor : '#38B2AC', color: isLastSlide ? accentDark : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {nextLabel}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Reflection screen ── */
  if (showReflection) {
    return (
      <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ height: 3, background: accentColor }} />
        <div style={{ padding: '36px 40px' }}>
          <div style={{ display: 'inline-block', background: '#E6FFFA', borderRadius: 16, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: '#1A6B5F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            REFLECT
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', margin: '0 0 6px', lineHeight: 1.2 }}>
            Before you move on
          </h2>
          <p style={{ fontSize: 13, color: '#718096', margin: '0 0 28px', lineHeight: 1.6 }}>
            Take 60 seconds. Two questions — no right answers.
          </p>
          {/* Q1 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>
              What's one thing from this module you'll try in your next piece of work?
            </label>
            <textarea
              value={reflectionA}
              onChange={(e) => setReflectionA(e.target.value)}
              placeholder="e.g. I'll try using the Blueprint structure for my next stakeholder update…"
              rows={3}
              style={{ width: '100%', resize: 'none', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1A202C', lineHeight: 1.6, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFBFC' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#38B2AC'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
            />
          </div>
          {/* Q2 */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>
              Is there anything from this module you'd like to explore further?
            </label>
            <textarea
              value={reflectionB}
              onChange={(e) => setReflectionB(e.target.value)}
              placeholder="e.g. I want to understand more about how to use conversational prompting for…"
              rows={3}
              style={{ width: '100%', resize: 'none', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1A202C', lineHeight: 1.6, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#FAFBFC' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#38B2AC'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
            />
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setShowReflection(false)} style={{ background: 'none', border: 'none', fontSize: 13, color: '#A0AEC0', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              ← Back to slides
            </button>
            <button
              onClick={() => { onCompletePhase(); window.location.href = '/app/toolkit/prompt-playground'; }}
              style={{ padding: '10px 28px', borderRadius: 24, border: 'none', background: '#1A202C', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
            >
              Continue to Practice →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Inline (compact) player ── */
  return (
    <div style={{ position: 'relative' }}>
      {/* Toast notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#1A202C', color: '#FFFFFF', padding: '12px 24px', borderRadius: 24, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', whiteSpace: 'nowrap', animation: 'fadeInUp 0.2s ease' }}>
          {toastMsg}
        </div>
      )}
      <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ height: 2, background: '#E2E8F0' }}>
          <div style={{ height: '100%', background: accentColor, width: `${(currentSlide / totalSlides) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        {/* Nav bar and slide content are both inside the fixed-height container so nothing overflows */}
        <div style={{ width: '100%', height: 'calc(100vh - 260px)', minHeight: 440, maxHeight: 740, background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
          {renderTakeaway()}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: isStretchType ? 'stretch' : 'flex-start' }}>
            {renderSlide()}
          </div>
          {/* Source citation bar — shown only when slide has an external source */}
          {s.sourceLink && (
            <div style={{ flexShrink: 0, padding: '4px 20px', borderTop: '1px solid #EDF2F7', background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase' as const, flexShrink: 0 }}>Source</span>
              <a href={s.sourceLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#A0AEC0', textDecoration: 'underline', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.sourceText || s.sourceLink}
              </a>
            </div>
          )}
          {/* Nav bar lives inside the fixed container so it never pushes content offscreen */}
          <div style={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF' }}>
            <button
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 1}
              style={{ padding: '7px 18px', borderRadius: 24, minHeight: 36, border: '1px solid #E2E8F0', background: 'transparent', color: currentSlide === 1 ? '#CBD5E0' : '#1A202C', fontSize: 13, fontWeight: 600, cursor: currentSlide === 1 ? 'default' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              ← Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {renderDots('sm')}
              <span style={{ fontSize: 11, color: '#A0AEC0' }}>{currentSlide} / {totalSlides}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {renderFsButton()}
              <button onClick={handleNextClick} style={{ padding: '7px 18px', borderRadius: 24, minHeight: 36, border: 'none', background: isLastSlide ? accentColor : '#38B2AC', color: isLastSlide ? accentDark : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {nextLabel}
              </button>
            </div>
          </div>
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
        <div style={{ padding: '10px 14px', background: '#EBF8FF', borderRadius: 10, border: '1px solid #38B2AC33', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>OUTCOME</div>
            <div style={{ fontSize: 13, color: '#1A202C', lineHeight: 1.5 }}>{active.outcome}</div>
          </div>
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
