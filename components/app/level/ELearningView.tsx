import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Maximize2, Minimize2, ChevronDown, ChevronUp, User, Map, Target, Layout, List, ShieldCheck } from 'lucide-react';
import { SlideData } from '../../../data/topicContent';
import { useVoiceover, UseVoiceoverReturn } from '../../../hooks/useVoiceover';

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
    @keyframes warningPop {
      0% { opacity: 0; transform: translateY(6px) scale(0.95); }
      15% { opacity: 1; transform: translateY(0) scale(1); }
      75% { opacity: 1; }
      100% { opacity: 0; transform: translateY(-4px) scale(0.97); }
    }
    .activity-warning { animation: warningPop 2.5s ease forwards; }
    .flip-card-inner { transition: transform 0.5s ease; transform-style: preserve-3d; }
    .flip-card-inner.flipped { transform: rotateY(180deg); }
    .flip-card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .flip-card-back { transform: rotateY(180deg); }
    @keyframes voWave {
      0%, 100% { height: 4px; }
      50% { height: 14px; }
    }
    @keyframes voSpin {
      to { transform: rotate(360deg); }
    }
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

/* ── Audio Bar (voiceover narration) ── */
function AudioBar({ voiceover, isFullscreen }: { voiceover: UseVoiceoverReturn; isFullscreen?: boolean }) {
  const { isLoading, isPlaying, isMuted, speed, volume, progress, duration } = voiceover;
  const speeds: Array<0.75 | 1 | 1.25 | 1.5 | 1.75 | 2> = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const barPx = isFullscreen ? 28 : 16;
  const waveDelays = [0, 0.1, 0.2, 0.1, 0];
  const pct = Math.min(progress * 100, 100);

  // Time display
  const elapsed = duration > 0 ? Math.floor(progress * duration) : 0;
  const total = Math.ceil(duration);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const timeStr = duration > 0 ? `${fmt(elapsed)} / ${fmt(total)}` : '';

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const speedRef = React.useRef<HTMLDivElement>(null);
  const volumeRef = React.useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    if (!showSpeedMenu && !showVolumeMenu) return;
    const handler = (e: MouseEvent) => {
      if (showSpeedMenu && speedRef.current && !speedRef.current.contains(e.target as Node)) setShowSpeedMenu(false);
      if (showVolumeMenu && volumeRef.current && !volumeRef.current.contains(e.target as Node)) setShowVolumeMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSpeedMenu, showVolumeMenu]);

  const volPct = Math.round((isMuted ? 0 : volume) * 100);

  // Speaker icon changes based on volume level
  const speakerIcon = isMuted || volume === 0 ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
  ) : volume < 0.5 ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
  );

  const popoverStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', right: 0, marginTop: 6,
    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '8px 0',
    zIndex: 100, minWidth: 56,
  };

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Controls row */}
      <div style={{ height: isFullscreen ? 40 : 36, background: '#F7FAFC', padding: `0 ${barPx}px`, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Play / Pause / Spinner */}
        <button
          onClick={() => { if (isLoading) return; isPlaying ? voiceover.pause() : voiceover.play(); }}
          style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A202C', border: 'none', cursor: isLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
          onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#2D3748'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#1A202C'; }}
        >
          {isLoading ? (
            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'voSpin 0.6s linear infinite' }} />
          ) : isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="3.5" height="10" rx="1" fill="white"/><rect x="7.5" y="1" width="3.5" height="10" rx="1" fill="white"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 1L10.5 6L2.5 11V1Z" fill="white"/></svg>
          )}
        </button>

        {/* Waveform bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
          {waveDelays.map((delay, i) => (
            <div key={i} style={{
              width: 2, borderRadius: 2, background: '#38B2AC',
              height: isPlaying ? undefined : 4,
              opacity: isPlaying ? 1 : 0.3,
              animation: isPlaying ? `voWave 0.9s ease-in-out ${delay}s infinite` : (isLoading ? `voWave 1.5s ease-in-out ${delay}s infinite` : 'none'),
              ...(isLoading && !isPlaying ? { opacity: 0.35 } : {}),
              ...(!isPlaying && !isLoading ? { height: 4 } : {}),
            }} />
          ))}
        </div>

        {/* Label */}
        <span style={{ fontSize: 11, fontWeight: 600, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Narration</span>
        {timeStr && <span style={{ fontSize: 10, fontWeight: 500, color: '#A0AEC0', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{timeStr}</span>}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Speed toggle + popover */}
        <div ref={speedRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowVolumeMenu(false); }}
            style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
              border: '1px solid #E2E8F0', background: showSpeedMenu ? '#1A202C' : '#FFFFFF',
              color: showSpeedMenu ? '#FFFFFF' : '#4A5568', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            {speed}× <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 3L4 6L7 3" stroke={showSpeedMenu ? '#FFFFFF' : '#A0AEC0'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {showSpeedMenu && (
            <div style={popoverStyle}>
              {speeds.map((s) => (
                <button key={s} onClick={() => { voiceover.setSpeed(s); setShowSpeedMenu(false); }} style={{
                  display: 'block', width: '100%', padding: '6px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, fontWeight: speed === s ? 700 : 500,
                  background: speed === s ? '#F7FAFC' : 'transparent',
                  color: speed === s ? '#1A202C' : '#4A5568',
                }}>
                  {s}×{speed === s ? ' ✓' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume: single click = open panel, click again (when open) = mute */}
        <div ref={volumeRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowSpeedMenu(false);
              if (showVolumeMenu) {
                voiceover.toggleMute();
                setShowVolumeMenu(false);
              } else {
                setShowVolumeMenu(true);
              }
            }}
            style={{ width: 28, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, color: '#718096' }}
          >
            {speakerIcon}
          </button>
          {showVolumeMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 6,
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '10px 12px',
              zIndex: 100, width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              {/* Percentage */}
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1A202C' }}>{volPct}%</span>
              {/* Vertical slider track */}
              <div style={{ position: 'relative', width: 20, height: 120, display: 'flex', justifyContent: 'center' }}>
                {/* Track bg */}
                <div style={{ position: 'absolute', top: 0, width: 4, height: '100%', background: '#E2E8F0', borderRadius: 2 }} />
                {/* Track fill (from bottom) */}
                <div style={{ position: 'absolute', bottom: 0, width: 4, height: `${volPct}%`, background: '#38B2AC', borderRadius: 2 }} />
                {/* Visible thumb */}
                <div style={{
                  position: 'absolute', bottom: `calc(${volPct}% - 7px)`, left: '50%', transform: 'translateX(-50%)',
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#38B2AC', border: '2px solid #FFFFFF',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', pointerEvents: 'none',
                }} />
                {/* Clickable track area — captures clicks to set volume by position */}
                <div
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const setFromY = (clientY: number) => {
                      const pxFromBottom = rect.bottom - clientY;
                      const ratio = Math.max(0, Math.min(1, pxFromBottom / rect.height));
                      voiceover.setVolume(ratio);
                    };
                    setFromY(e.clientY);
                    const onMove = (ev: MouseEvent) => setFromY(ev.clientY);
                    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                  }}
                />
              </div>
              {/* Mute icon button */}
              <button
                onClick={() => { voiceover.toggleMute(); setShowVolumeMenu(false); }}
                style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: isMuted ? '1.5px solid #E53E3E' : '1.5px solid #E2E8F0', cursor: 'pointer', padding: 0,
                  background: isMuted ? '#FFF5F5' : '#F7FAFC',
                  color: isMuted ? '#E53E3E' : '#718096',
                }}
              >
                {isMuted ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress line */}
      <div style={{ height: 3, background: '#E2E8F0' }}>
        <div style={{ height: '100%', background: '#38B2AC', width: `${pct}%`, transition: isPlaying ? 'none' : 'width 0.2s ease', borderRadius: '0 1.5px 1.5px 0' }} />
      </div>
    </div>
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
  const moduleLevel = slides.find(s => s.type === 'courseIntro')?.levelNumber ?? 1;
  const PRACTICE_URLS: Record<number, string> = {
    1: '/app/toolkit/prompt-playground',
    2: '/app/toolkit',
    3: '/app/level-3/workflow-canvas',
    4: '/app/level-4/app-designer',
    5: '/app/level-5/app-evaluator',
  };
  const practiceUrl = PRACTICE_URLS[moduleLevel] ?? '/app/toolkit';
  const voiceover = useVoiceover();
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
  const [personaCaseStudyIdx, setPersonaCaseStudyIdx] = useState(0);
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
  // situationalJudgment selected option (lifted so parent can block Next)
  const [sjSelectedOption, setSjSelectedOption] = useState<number | null>(null);
  // dragSort slide state
  const [dragPlacements, setDragPlacements] = useState<Record<string, string>>({});
  const [dragChecked, setDragChecked] = useState(false);
  const [dragSortItemId, setDragSortItemId] = useState<string | null>(null);
  // spotTheFlaw slide state
  const [flawSelected, setFlawSelected] = useState<number | null>(null);
  // toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  // activity warning popup
  const [showActivityWarning, setShowActivityWarning] = useState(false);
  const activityWarningTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const renderConceptVisual = (visualId: string, _fs: boolean, activeIdx?: number) => {
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

      case 'l2-custom-gpt': {
        const builderFields = [
          {
            fieldName: 'Instructions',
            fieldHint: 'e.g. "You are a project status analyst. For each project: assess status, summarise key updates, cite sources…"',
            layer: 'PROCESSING LAYER',
            layerDesc: 'Your system prompt — role, task, reasoning steps, accountability rules',
            color: '#38B2AC',
            light: '#E6FFFA',
            icon: '⚙️',
          },
          {
            fieldName: 'Knowledge',
            fieldHint: 'Upload files the agent can reference — templates, guidelines, past reports, org context',
            layer: 'INPUT ENRICHMENT',
            layerDesc: 'Permanent context files that improve accuracy on every run',
            color: '#667EEA',
            light: '#EBF4FF',
            icon: '📁',
          },
          {
            fieldName: 'Conversation starters',
            fieldHint: '"Summarise this week\'s project notes" · "Draft a status update for stakeholders" · "Flag any blockers"',
            layer: 'INPUT INTERFACE',
            layerDesc: 'Pre-defined prompts that guide your team to provide the right input',
            color: '#48BB78',
            light: '#F0FFF4',
            icon: '💬',
          },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fs ? 10 : 7, height: '100%', justifyContent: 'center' }}>
            {/* Builder header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: '10px 10px 0 0', padding: fs ? '8px 14px' : '6px 12px', marginBottom: -4 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#FC8181', '#F6AD55', '#68D391'].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
              </div>
              <span style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#718096', letterSpacing: '0.04em' }}>Custom GPT Builder — Configure</span>
            </div>
            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: fs ? 7 : 5, border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: fs ? '12px 14px' : '9px 12px', background: '#FFFFFF' }}>
              {builderFields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Left: builder field */}
                  <div style={{ flex: '0 0 48%', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: fs ? '8px 10px' : '6px 9px' }}>
                    <div style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#1A202C', marginBottom: 3 }}>{f.fieldName}</div>
                    <div style={{ fontSize: fs ? 10 : 9, color: '#A0AEC0', fontStyle: 'italic', lineHeight: 1.4 }}>{f.fieldHint}</div>
                  </div>
                  {/* Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: fs ? 10 : 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: f.color, fontWeight: 700 }}>→</span>
                  </div>
                  {/* Right: layer badge */}
                  <div style={{ flex: 1, background: f.light, border: `1.5px solid ${f.color}55`, borderRadius: 8, padding: fs ? '8px 10px' : '6px 9px' }}>
                    <div style={{ fontSize: fs ? 9 : 8, fontWeight: 800, color: f.color, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                      <span style={{ marginRight: 4 }}>{f.icon}</span>{f.layer}
                    </div>
                    <div style={{ fontSize: fs ? 10 : 9, color: '#4A5568', lineHeight: 1.4 }}>{f.layerDesc}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Share note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#E6FFFA', border: '1px solid #38B2AC44', borderRadius: 8, padding: fs ? '7px 12px' : '5px 10px' }}>
              <span style={{ fontSize: 14 }}>🔗</span>
              <span style={{ fontSize: fs ? 11 : 10, color: '#2C9A94', fontWeight: 600 }}>Share via link — your team gets the same agent, every time, from any device</span>
            </div>
          </div>
        );
      }

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

      case 'l3-workflow-anatomy': {
        const layers = [
          { label: 'INPUT LAYER',      icon: '📥', color: '#667EEA', light: '#EBF4FF', items: ['Trigger', 'Data / context'] },
          { label: 'PROCESSING LAYER', icon: '⚙️', color: '#38B2AC', light: '#E6FFFA', items: ['AI Actions', 'Transforms', 'Conditions'] },
          { label: 'OUTPUT LAYER',     icon: '📤', color: '#48BB78', light: '#F0FFF4', items: ['Handoffs', 'Final output'] },
        ];
        return (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>THREE LAYERS</div>
            {layers.map((layer, i) => {
              const isActive  = activeIdx === i;
              const isRevealed = activeIdx === undefined || i <= activeIdx;
              return (
                <div key={i}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                    background: isRevealed ? layer.light : '#F7FAFC',
                    border: `${isActive ? 2 : 1.5}px solid ${isRevealed ? layer.color : '#E2E8F0'}${isRevealed ? '' : '55'}`,
                    marginBottom: 4,
                    opacity: activeIdx !== undefined && i > activeIdx ? 0.3 : 1,
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.35s ease',
                    boxShadow: isActive ? `0 2px 12px ${layer.color}33` : 'none',
                  }}>
                    <span style={{ fontSize: isActive ? 20 : 17, transition: 'font-size 0.3s ease' }}>{layer.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isRevealed ? layer.color : '#A0AEC0', letterSpacing: '0.06em', transition: 'color 0.3s ease' }}>{layer.label}</div>
                      <div style={{ fontSize: 11, color: isRevealed ? '#4A5568' : '#CBD5E0', marginTop: 2, transition: 'color 0.3s ease' }}>{layer.items.join(' · ')}</div>
                    </div>
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: layer.color, flexShrink: 0 }} />}
                  </div>
                  {i < 2 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                      <div style={{ width: 2, height: 14, background: activeIdx !== undefined && i < activeIdx ? '#CBD5E0' : '#E2E8F0', borderRadius: 1, transition: 'background 0.3s ease' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      case 'l3-workflow-decision': {
        const useWhen = [
          { icon: '🔁', text: 'Runs repeatedly — same steps each time' },
          { icon: '⚡', text: 'Has a clear, consistent trigger' },
          { icon: '📋', text: 'Produces a defined, predictable output' },
          { icon: '👥', text: 'Needs to be consistent across a team' },
        ];
        const skipWhen = [
          { icon: '🎲', text: 'Every case requires a different judgment call' },
          { icon: '🔬', text: "The process isn't stable or well-understood yet" },
          { icon: '1️⃣', text: "It's a one-off — not worth the design effort" },
          { icon: '🌀', text: 'Stakes are high and context changes each time' },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, minHeight: 0 }}>
              {/* Use it */}
              <div style={{ background: '#F0FFF4', border: '1.5px solid #68D39155', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 15 }}>✅</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#276749', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Use a workflow</span>
                </div>
                {useWhen.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFFFF', borderRadius: 8, padding: '8px 10px', border: '1px solid #68D39133' }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: '#276749', lineHeight: 1.45, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              {/* Skip it */}
              <div style={{ background: '#FFFBEB', border: '1.5px solid #F6AD5555', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 15 }}>⚠️</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#C05621', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Skip it when</span>
                </div>
                {skipWhen.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFFFF', borderRadius: 8, padding: '8px 10px', border: '1px solid #F6AD5533' }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: '#C05621', lineHeight: 1.45, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'l2-agent-vs-prompt': {
        const promptTraits = [
          { icon: '💬', text: 'One-time conversation' },
          { icon: '🔄', text: 'Explained fresh every session' },
          { icon: '📊', text: 'Output varies each time' },
          { icon: '👤', text: 'Lives with one person' },
        ];
        const agentTraits = [
          { icon: '⚙️', text: 'Configured once, runs forever' },
          { icon: '📌', text: 'Purpose and rules are permanent' },
          { icon: '📋', text: 'Consistent, structured output' },
          { icon: '👥', text: 'Anyone on the team can use it' },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: fs ? 12 : 11, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Prompt</span>
              <div style={{ flex: 1, maxWidth: 60, height: 2, background: 'linear-gradient(90deg, #CBD5E0, #38B2AC)', borderRadius: 2 }} />
              <span style={{ fontSize: fs ? 12 : 11, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Agent</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, minHeight: 0 }}>
              <div style={{ background: '#F7FAFC', border: '1.5px solid #CBD5E0', borderRadius: 14, padding: fs ? '14px 16px' : '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14 }}>💬</span>
                  <span style={{ fontSize: fs ? 11 : 10, fontWeight: 800, color: '#718096', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Prompt</span>
                </div>
                {promptTraits.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFFFF', borderRadius: 8, padding: fs ? '8px 10px' : '6px 8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
                    <span style={{ fontSize: fs ? 12 : 11, color: '#718096', lineHeight: 1.45, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#E6FFFA', border: '1.5px solid #38B2AC55', borderRadius: 14, padding: fs ? '14px 16px' : '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14 }}>🤖</span>
                  <span style={{ fontSize: fs ? 11 : 10, fontWeight: 800, color: '#2C9A94', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Agent</span>
                </div>
                {agentTraits.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFFFF', borderRadius: 8, padding: fs ? '8px 10px' : '6px 8px', border: '1px solid #38B2AC33' }}>
                    <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
                    <span style={{ fontSize: fs ? 12 : 11, color: '#2C9A94', lineHeight: 1.45, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'l3-workflow-vs-agent': {
        const stepRow1 = [
          { icon: '⚡', label: 'TRIGGER', desc: 'Event starts the process', color: '#667EEA', light: '#EBF4FF' },
          { icon: '🤖', label: 'AGENT STEP 1', desc: 'First task runs', color: '#38B2AC', light: '#E6FFFA' },
          { icon: '🔀', label: 'CONDITION', desc: 'Decision branch', color: '#E53E3E', light: '#FFF5F5' },
        ];
        const stepRow2 = [
          { icon: '🤖', label: 'AGENT STEP 2', desc: 'Next task runs', color: '#38B2AC', light: '#E6FFFA' },
          { icon: '👤', label: 'HUMAN REVIEW', desc: 'Approval checkpoint', color: '#C05621', light: '#FFFBEB' },
          { icon: '📤', label: 'FINAL OUTPUT', desc: 'Result delivered', color: '#276749', light: '#F0FFF4' },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: fs ? 12 : 9, height: '100%', justifyContent: 'center' }}>
            {/* Level 2 reference */}
            <div>
              <div style={{ fontSize: fs ? 10 : 9, fontWeight: 800, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: fs ? 6 : 4 }}>Level 2 — Single Agent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[
                  { icon: '📥', label: 'INPUT', color: '#667EEA', light: '#EBF4FF' },
                  { icon: '⚙️', label: 'AGENT', color: '#38B2AC', light: '#E6FFFA' },
                  { icon: '📤', label: 'OUTPUT', color: '#276749', light: '#F0FFF4' },
                ].map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ background: s.light, border: `1.5px solid ${s.color}55`, borderRadius: 8, padding: fs ? '7px 12px' : '5px 9px', flex: 1, textAlign: 'center' as const }}>
                      <span style={{ fontSize: 13 }}>{s.icon}</span>
                      <div style={{ fontSize: fs ? 10 : 9, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.label}</div>
                    </div>
                    {i < 2 && <span style={{ fontSize: 14, color: '#CBD5E0' }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {/* Down arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.06em' }}>↓ Level 3 scales up</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>
            {/* Level 3 workflow */}
            <div>
              <div style={{ fontSize: fs ? 10 : 9, fontWeight: 800, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: fs ? 6 : 4 }}>Level 3 — Workflow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {stepRow1.map((s, i) => (
                    <React.Fragment key={i}>
                      <div style={{ background: s.light, border: `1.5px solid ${s.color}55`, borderRadius: 8, padding: fs ? '7px 10px' : '5px 7px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 12 }}>{s.icon}</span>
                          <div style={{ fontSize: fs ? 9 : 8, fontWeight: 700, color: s.color, letterSpacing: '0.06em' }}>{s.label}</div>
                        </div>
                        <div style={{ fontSize: fs ? 10 : 9, color: '#4A5568', marginTop: 2 }}>{s.desc}</div>
                      </div>
                      {i < 2 && <span style={{ fontSize: 13, color: '#CBD5E0', flexShrink: 0 }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '34%' }}>
                  <span style={{ fontSize: 13, color: '#CBD5E0' }}>↓</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {stepRow2.map((s, i) => (
                    <React.Fragment key={i}>
                      <div style={{ background: s.light, border: `1.5px solid ${s.color}55`, borderRadius: 8, padding: fs ? '7px 10px' : '5px 7px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 12 }}>{s.icon}</span>
                          <div style={{ fontSize: fs ? 9 : 8, fontWeight: 700, color: s.color, letterSpacing: '0.06em' }}>{s.label}</div>
                        </div>
                        <div style={{ fontSize: fs ? 10 : 9, color: '#4A5568', marginTop: 2 }}>{s.desc}</div>
                      </div>
                      {i < 2 && <span style={{ fontSize: 13, color: '#CBD5E0', flexShrink: 0 }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'l2-agent-decision': {
        const buildWhen = [
          { icon: '🔁', text: 'Runs at least weekly — same steps each time' },
          { icon: '👥', text: 'Others on your team do the same task' },
          { icon: '📋', text: 'Output must follow a consistent structure' },
          { icon: '⚡', text: 'Inconsistency is causing quality gaps' },
        ];
        const promptWhen = [
          { icon: '1️⃣', text: "It's a one-off — unique context each time" },
          { icon: '🔬', text: "The best approach isn't clear yet" },
          { icon: '🎨', text: 'Output needs to vary by situation' },
          { icon: '⏱️', text: "The investment isn't worth it (yet)" },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, minHeight: 0 }}>
              {/* Build an agent */}
              <div style={{ background: '#F0FFF4', border: '1.5px solid #68D39155', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 15 }}>✅</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#276749', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Build an agent</span>
                </div>
                {buildWhen.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFFFF', borderRadius: 8, padding: '8px 10px', border: '1px solid #68D39133' }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: '#276749', lineHeight: 1.45, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              {/* Just prompt */}
              <div style={{ background: '#FFFBEB', border: '1.5px solid #F6AD5555', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 15 }}>💬</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#C05621', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Just prompt</span>
                </div>
                {promptWhen.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFFFF', borderRadius: 8, padding: '8px 10px', border: '1px solid #F6AD5533' }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.3 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: '#C05621', lineHeight: 1.45, fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'l3-example-workflow': {
        const layers = [
          {
            label: 'INPUT LAYER', color: '#667EEA', light: '#EBF4FF',
            nodes: [
              { type: 'TRIGGER', icon: '⚡', desc: 'New expense email arrives' },
              { type: 'DATA', icon: '📎', desc: 'Email + attachment details' },
            ],
          },
          {
            label: 'PROCESSING LAYER', color: '#38B2AC', light: '#E6FFFA',
            nodes: [
              { type: 'AI ACTION', icon: '🤖', desc: 'Extract amounts, dates, categories' },
              { type: 'CONDITION', icon: '🔀', desc: 'Total > £500?' },
              { type: 'TRANSFORM', icon: '⚙️', desc: 'Format into expense report' },
            ],
          },
          {
            label: 'OUTPUT LAYER', color: '#48BB78', light: '#F0FFF4',
            nodes: [
              { type: 'HANDOFF', icon: '🔗', desc: 'Manager approves (if > £500)' },
              { type: 'OUTPUT', icon: '📤', desc: 'Record created + email sent' },
            ],
          },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EXPENSE CLAIM WORKFLOW</div>
            {layers.map((layer, li) => (
              <div key={li}>
                <div style={{ background: layer.light, border: `1.5px solid ${layer.color}55`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: layer.color, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{layer.label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {layer.nodes.map((node, ni) => (
                      <div key={ni} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', borderRadius: 6, padding: '5px 8px', border: `1px solid ${layer.color}33` }}>
                        <span style={{ fontSize: 13 }}>{node.icon}</span>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 800, color: layer.color, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{node.type}</span>
                          <span style={{ fontSize: 10, color: '#4A5568', marginLeft: 5 }}>{node.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {li < layers.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
                    <div style={{ fontSize: 14, color: '#CBD5E0' }}>↓</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }

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
        const objIcons = ['🎯', '🏗️', '🛡️', '🤝'];

        /* ── Level 2 intro variant — full-width single column ── */
        if (s.levelNumber === 2) {
          const l2ObjIcons = ['🎯', '🏗️', '🛡️', '🤝'];
          return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: fs ? '44px 64px' : '28px 40px', background: 'linear-gradient(160deg, #FEFCE8 0%, #FEF9C3 50%, #F7FAFC 100%)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8A6A00', background: '#F7E8A4', padding: '3px 10px', borderRadius: 16, letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'inline-block', marginBottom: 14 }}>
                  LEVEL 2 · E-LEARNING
                </span>
                <h1 style={{ fontSize: fs ? 28 : 22, fontWeight: 800, color: '#1A202C', margin: '0 0 6px', lineHeight: 1.2 }}>
                  {s.heading}
                </h1>
                {s.subheading && (
                  <p style={{ fontSize: fs ? 14 : 13, color: '#8A6A00', margin: '0 0 16px', lineHeight: 1.5, fontWeight: 600, maxWidth: 600 }}>
                    {s.subheading}
                  </p>
                )}
                {s.objectives && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>YOU'LL WALK AWAY WITH</div>
                    {s.objectives.map((obj: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{l2ObjIcons[i] ?? '▸'}</span>
                        <span style={{ fontSize: fs ? 14 : 13, color: '#2D3748', lineHeight: 1.6, fontWeight: 500 }}>{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleNextClick} style={{ alignSelf: 'flex-start', padding: '10px 26px', borderRadius: 24, border: 'none', background: '#C4A934', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                  Start →
                </button>
              </div>
            </div>
          );
        }

        /* ── Level 3 intro variant ── */
        if (s.levelNumber === 3) {
          const l3ObjIcons = ['🗺️', '⚙️', '🔁', '🎯'];
          const nodePreview = [
            { label: 'TRIGGER',   color: '#667EEA', light: '#EBF4FF', icon: '▶' },
            { label: 'AI ACTION', color: '#38B2AC', light: '#E6FFFA', icon: '🤖' },
            { label: 'TRANSFORM', color: '#ED8936', light: '#FFFBEB', icon: '↔' },
            { label: 'CONDITION', color: '#48BB78', light: '#F0FFF4', icon: '?' },
            { label: 'HANDOFF',   color: '#9F7AEA', light: '#FAF5FF', icon: '🤝' },
            { label: 'OUTPUT',    color: '#F6AD55', light: '#FFFAF0', icon: '📤' },
          ];
          return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: fs ? '44px 64px' : '28px 40px', background: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 50%, #F7FAFC 100%)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8A6A00', background: '#FBE8A6', padding: '3px 10px', borderRadius: 16, letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'inline-block', marginBottom: 14 }}>
                  LEVEL 3 · E-LEARNING
                </span>
                <h1 style={{ fontSize: fs ? 28 : 22, fontWeight: 800, color: '#1A202C', margin: '0 0 6px', lineHeight: 1.2 }}>
                  {s.heading}
                </h1>
                {s.subheading && (
                  <p style={{ fontSize: fs ? 14 : 13, color: '#8A6A00', margin: '0 0 16px', lineHeight: 1.5, fontWeight: 600, maxWidth: 600 }}>
                    {s.subheading}
                  </p>
                )}
                {s.objectives && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>YOU'LL WALK AWAY WITH</div>
                    {s.objectives.map((obj: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{l3ObjIcons[i] ?? '▸'}</span>
                        <span style={{ fontSize: fs ? 14 : 13, color: '#2D3748', lineHeight: 1.6, fontWeight: 500 }}>{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleNextClick} style={{ alignSelf: 'flex-start', padding: '10px 26px', borderRadius: 24, border: 'none', background: '#C4A934', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                  Start →
                </button>
              </div>
            </div>
          );
        }

        /* ── Level 1 intro (default) ── */
        const blueprintItems = [
          { label: 'Role',    color: '#667EEA', light: '#EBF4FF', icon: '🎭' },
          { label: 'Context', color: '#38B2AC', light: '#E6FFFA', icon: '🌍' },
          { label: 'Task',    color: '#ED8936', light: '#FFFBEB', icon: '🎯' },
          { label: 'Format',  color: '#48BB78', light: '#F0FFF4', icon: '📐' },
          { label: 'Steps',   color: '#9F7AEA', light: '#FAF5FF', icon: '🪜' },
          { label: 'Checks',  color: '#F6AD55', light: '#FFFAF0', icon: '✅' },
        ];
        const l1ObjIcons = ['💡', '🗂️', '🔄', '🎯'];
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
            {/* Left column */}
            <div style={{ flex: '0 0 58%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: fs ? '44px 48px' : '28px 32px', background: 'linear-gradient(160deg, #E6FFFA 0%, #EBF8FF 60%, #F7FAFC 100%)', borderRight: '1px solid #E2E8F0' }}>
              {s.levelNumber && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1A6B5F', background: '#A8F0E0', padding: '3px 10px', borderRadius: 16, letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'inline-block', marginBottom: 14 }}>
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
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>YOU'LL WALK AWAY WITH</div>
                  {s.objectives.map((obj: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 13, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{l1ObjIcons[i] ?? '▸'}</span>
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
              <div style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4 }}>THE PROMPT BLUEPRINT</div>
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
          <div style={{ padding: fs ? '28px 32px' : '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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

      /* ── Evidence Hero (two-column when stat present, full-width when no stat) ── */
      case 'evidenceHero': {
        const stat = s.stats?.[0];
        const hasStat = !!stat;

        /* — Dot Grid visual (e.g. 24%) — 10×10 grid, N dots highlighted — */
        const renderDotGrid = (value: string, label: string, source: string, desc?: string) => {
          const pct = parseInt(value, 10) || 0;
          const dots = Array.from({ length: 100 }, (_, i) => i < pct);
          const dotSize = fs ? 20 : 16;
          const gap = fs ? 5 : 4;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: fs ? 16 : 12, animation: 'fadeInUp 0.4s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(10, ${dotSize}px)`, gap, flexShrink: 0 }}>
                {dots.map((active, i) => (
                  <div key={i} style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: active ? '#38B2AC' : '#E2E8F0', transition: 'background 0.2s ease', boxShadow: active ? '0 0 0 1.5px #38B2AC55' : 'none' }} />
                ))}
              </div>
              <div style={{ textAlign: 'center', maxWidth: fs ? 280 : 230 }}>
                <div style={{ fontSize: fs ? 36 : 28, fontWeight: 900, color: '#38B2AC', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ fontSize: fs ? 13 : 12, color: '#4A5568', lineHeight: 1.5, marginTop: 6 }}>{label}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: fs ? '5px 12px' : '4px 10px' }}>
                  <span style={{ fontWeight: 700, fontSize: fs ? 11 : 10, color: '#1A202C' }}>{source}</span>
                  {desc && <span style={{ fontSize: fs ? 10 : 9, color: '#A0AEC0' }}>— {desc}</span>}
                </div>
              </div>
            </div>
          );
        };

        /* — Bar Comparison visual (e.g. 3.4×) — two vertical bars — */
        const renderBarComparison = (value: string, label: string, source: string, desc?: string) => {
          const multiplier = parseFloat(value.replace('×', '').replace('x', '')) || 3.4;
          const baseH = fs ? 80 : 65;
          const topH = Math.round(baseH * multiplier);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: fs ? 16 : 12, animation: 'fadeInUp 0.4s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: fs ? 28 : 20, flexShrink: 0 }}>
                {/* Others bar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: fs ? 12 : 11, fontWeight: 700, color: '#A0AEC0' }}>1×</div>
                  <div style={{ width: fs ? 56 : 44, height: baseH, background: '#E2E8F0', borderRadius: '6px 6px 0 0', border: '1.5px solid #CBD5E0' }} />
                  <div style={{ fontSize: fs ? 11 : 10, color: '#A0AEC0', textAlign: 'center', maxWidth: fs ? 70 : 56 }}>Others</div>
                </div>
                {/* Gap bracket */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: topH, gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 1.5, flex: 1, background: '#CBD5E0' }} />
                  <div style={{ fontSize: fs ? 22 : 18, fontWeight: 900, color: '#38B2AC', lineHeight: 1, whiteSpace: 'nowrap' as const }}>{value}</div>
                  <div style={{ width: 1.5, flex: 1, background: '#CBD5E0' }} />
                </div>
                {/* Top performers bar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: fs ? 12 : 11, fontWeight: 700, color: '#2C9A94' }}>{value}</div>
                  <div style={{ width: fs ? 56 : 44, height: topH, background: 'linear-gradient(180deg, #38B2AC, #2C9A94)', borderRadius: '6px 6px 0 0', border: '1.5px solid #2C9A94', boxShadow: '0 0 0 3px #38B2AC18' }} />
                  <div style={{ fontSize: fs ? 11 : 10, color: '#2D3748', fontWeight: 600, textAlign: 'center', maxWidth: fs ? 70 : 60 }}>Top AI<br />performers</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', maxWidth: fs ? 280 : 230 }}>
                <div style={{ fontSize: fs ? 13 : 12, color: '#4A5568', lineHeight: 1.5 }}>{label}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: fs ? '5px 12px' : '4px 10px' }}>
                  <span style={{ fontWeight: 700, fontSize: fs ? 11 : 10, color: '#1A202C' }}>{source}</span>
                  {desc && <span style={{ fontSize: fs ? 10 : 9, color: '#A0AEC0' }}>— {desc}</span>}
                </div>
              </div>
            </div>
          );
        };

        /* — Adoption Gap visual (e.g. 75% → 24%) — funnel drop — */
        const renderAdoptionGap = (value: string, label: string, source: string, desc?: string) => {
          const topPct = parseInt(value, 10) || 75;
          const bottomPct = 24; // integration benchmark (McKinsey 24%)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: fs ? 10 : 8, animation: 'fadeInUp 0.4s ease' }}>
              {/* Top stat — adoption */}
              <div style={{ width: '100%', background: '#E6FFFA', border: '1.5px solid #38B2AC55', borderRadius: 14, padding: fs ? '14px 20px' : '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: fs ? 42 : 34, fontWeight: 900, color: '#38B2AC', lineHeight: 1, letterSpacing: '-0.02em', flexShrink: 0 }}>{value}</div>
                <div>
                  <div style={{ fontSize: fs ? 13 : 11, fontWeight: 700, color: '#2C9A94' }}>{label}</div>
                  <div style={{ fontSize: fs ? 11 : 10, color: '#718096', marginTop: 2 }}>{source} — {desc}</div>
                </div>
              </div>
              {/* Funnel connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 2, height: fs ? 10 : 8, background: '#CBD5E0', borderRadius: 1 }} />
                <div style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>but only</div>
                <div style={{ width: 2, height: fs ? 10 : 8, background: '#CBD5E0', borderRadius: 1 }} />
              </div>
              {/* Bottom stat — integration */}
              <div style={{ width: '78%', background: '#F0FFF4', border: '1.5px solid #48BB7855', borderRadius: 14, padding: fs ? '14px 20px' : '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: fs ? 42 : 34, fontWeight: 900, color: '#276749', lineHeight: 1, letterSpacing: '-0.02em', flexShrink: 0 }}>24%</div>
                <div>
                  <div style={{ fontSize: fs ? 13 : 11, fontWeight: 700, color: '#276749' }}>have integrated AI into workflows</div>
                  <div style={{ fontSize: fs ? 11 : 10, color: '#718096', marginTop: 2 }}>McKinsey Global Survey, 2024</div>
                </div>
              </div>
            </div>
          );
        };

        /* — Week Blocks visual (e.g. 19% of work week wasted) — 5-day × 8-hour grid — */
        const renderWeekBlocks = (value: string, label: string, source: string, desc?: string) => {
          const pct = parseInt(value, 10) || 19;
          const totalBlocks = 40; // 5 days × 8 hours
          const lostBlocks = Math.round(totalBlocks * pct / 100);
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          const hoursPerDay = 8;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: fs ? 14 : 10, animation: 'fadeInUp 0.4s ease' }}>
              {/* Grid */}
              <div style={{ display: 'flex', gap: fs ? 6 : 4 }}>
                {days.map((day, di) => {
                  const startBlock = di * hoursPerDay;
                  return (
                    <div key={di} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ fontSize: fs ? 10 : 9, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.04em' }}>{day}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {Array.from({ length: hoursPerDay }, (_, hi) => {
                          const idx = startBlock + hi;
                          const isLost = idx < lostBlocks;
                          return (
                            <div key={hi} style={{ width: fs ? 30 : 24, height: fs ? 13 : 10, borderRadius: 3, background: isLost ? '#38B2AC' : '#E2E8F0', boxShadow: isLost ? '0 0 0 1.5px #38B2AC44' : 'none' }} />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#38B2AC' }} />
                  <span style={{ fontSize: fs ? 11 : 10, color: '#4A5568', fontWeight: 600 }}>Lost to rework</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#E2E8F0' }} />
                  <span style={{ fontSize: fs ? 11 : 10, color: '#A0AEC0' }}>Productive work</span>
                </div>
              </div>
              {/* Stat + source */}
              <div style={{ textAlign: 'center', maxWidth: fs ? 280 : 230 }}>
                <div style={{ fontSize: fs ? 34 : 28, fontWeight: 900, color: '#38B2AC', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ fontSize: fs ? 13 : 12, color: '#4A5568', lineHeight: 1.5, marginTop: 6 }}>{label}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: fs ? '5px 12px' : '4px 10px' }}>
                  <span style={{ fontWeight: 700, fontSize: fs ? 11 : 10, color: '#1A202C' }}>{source}</span>
                  {desc && <span style={{ fontSize: fs ? 10 : 9, color: '#A0AEC0' }}>— {desc}</span>}
                </div>
              </div>
            </div>
          );
        };

        /* — Performance Gap visual (e.g. 3.4×) — two contrasting stacked cards with VS divider — */
        const renderPerformanceGap = (value: string, label: string, source: string, desc?: string) => {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', height: '100%', gap: fs ? 8 : 6, animation: 'fadeInUp 0.4s ease' }}>
              {/* Top performers */}
              <div style={{ background: '#E6FFFA', border: '1.5px solid #38B2AC', borderRadius: 14, padding: fs ? '16px 20px' : '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: fs ? 44 : 36, fontWeight: 900, color: '#38B2AC', lineHeight: 1, letterSpacing: '-0.02em', flexShrink: 0 }}>{value}</div>
                <div>
                  <div style={{ fontSize: fs ? 12 : 10, fontWeight: 800, color: '#2C9A94', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Top AI performers</div>
                  <div style={{ fontSize: fs ? 12 : 11, color: '#4A5568', lineHeight: 1.45 }}>Integrate AI across connected, multi-step workflows</div>
                </div>
              </div>
              {/* VS divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>vs.</span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>
              {/* Average */}
              <div style={{ background: '#F7FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: fs ? '16px 20px' : '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: fs ? 44 : 36, fontWeight: 900, color: '#CBD5E0', lineHeight: 1, letterSpacing: '-0.02em', flexShrink: 0 }}>1×</div>
                <div>
                  <div style={{ fontSize: fs ? 12 : 10, fontWeight: 800, color: '#A0AEC0', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Most companies</div>
                  <div style={{ fontSize: fs ? 12 : 11, color: '#A0AEC0', lineHeight: 1.45 }}>Using AI as a standalone, single-purpose tool</div>
                </div>
              </div>
              {/* Source */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: fs ? '5px 12px' : '4px 10px' }}>
                  <span style={{ fontWeight: 700, fontSize: fs ? 11 : 10, color: '#1A202C' }}>{source}</span>
                  {desc && <span style={{ fontSize: fs ? 10 : 9, color: '#A0AEC0' }}>— {desc}</span>}
                </div>
              </div>
            </div>
          );
        };

        const renderStatVisual = () => {
          if (!stat) return null;
          if (stat.visualType === 'dotGrid') return renderDotGrid(stat.value, stat.label, stat.source, stat.desc);
          if (stat.visualType === 'barComparison') return renderBarComparison(stat.value, stat.label, stat.source, stat.desc);
          if (stat.visualType === 'adoptionGap') return renderAdoptionGap(stat.value, stat.label, stat.source, stat.desc);
          if (stat.visualType === 'weekBlocks') return renderWeekBlocks(stat.value, stat.label, stat.source, stat.desc);
          if (stat.visualType === 'performanceGap') return renderPerformanceGap(stat.value, stat.label, stat.source, stat.desc);
          /* default: large number card */
          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div style={{
                padding: fs ? '28px 36px' : '32px 36px', borderRadius: fs ? 20 : 24,
                background: 'linear-gradient(145deg, #E6FFFA 0%, #EBF8FF 50%, #FFFFFF 100%)',
                border: `${fs ? 2 : 2.5}px solid #38B2AC`,
                textAlign: 'center', animation: 'fadeInUp 0.4s ease',
                width: '100%', boxSizing: 'border-box' as const,
                boxShadow: fs ? 'none' : '0 0 0 8px #38B2AC12',
              }}>
                <div style={{ fontSize: fs ? 28 : 32, color: '#38B2AC', marginBottom: fs ? 4 : 8, lineHeight: 1 }}>↑</div>
                <div style={{ fontSize: fs ? 68 : 88, fontWeight: fs ? 800 : 900, color: '#38B2AC', lineHeight: 1, letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div style={{ fontSize: fs ? 14 : 16, fontWeight: fs ? 400 : 600, color: fs ? '#4A5568' : '#2D3748', maxWidth: fs ? 200 : 220, margin: `${fs ? 8 : 12}px auto 0`, lineHeight: 1.4 }}>{stat.label}</div>
                {stat.desc && <div style={{ marginTop: 6, fontSize: 13, color: '#718096' }}>{stat.desc}</div>}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: fs ? 8 : 6, marginTop: fs ? 8 : 14, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: fs ? 8 : 10, padding: fs ? '6px 12px' : '6px 14px' }}>
                  {stat.logoPath && <img src={stat.logoPath} alt={stat.source} style={{ height: 18, maxWidth: 100, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <span style={{ fontWeight: 700, fontSize: fs ? 11 : 12, color: '#1A202C' }}>{stat.source}</span>
                </div>
              </div>
            </div>
          );
        };

        const pullQuoteEl = s.pullQuote ? (
          <div style={{ flexShrink: 0, marginTop: fs ? 14 : 10, padding: fs ? '20px 28px' : '14px 20px', borderLeft: '4px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: fs ? 16 : 14, color: '#4A5568', lineHeight: fs ? 1.75 : 1.65 }}>
            {s.pullQuote.split(/(\d+(?:\.\d+)?[×x%])/).map((part, i) => /^\d+(?:\.\d+)?[×x%]$/.test(part) ? <span key={i} style={{ color: '#38B2AC', fontWeight: 800 }}>{part}</span> : <span key={i}>{part}</span>)}
          </div>
        ) : null;

        return (
          <div style={{ padding: fs ? '24px 44px' : '14px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: hasStat ? '48% 52%' : '1fr', gap: fs ? 20 : 16, flex: 1, alignItems: 'center', minHeight: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: fs ? 17 : 15, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
              </div>
              {hasStat && renderStatVisual()}
            </div>
            {pullQuoteEl}
          </div>
        );
      }

      /* ── Chart (Slide 3 — two-column: text + diverging outcomes research visual) ── */
      case 'chart': {
        const outcomes = [
          { label: 'Customer support agents', sublabel: 'AI assistance for ticket resolution', gain: 14, barW: '6%', color: '#A0AEC0', textColor: '#718096' },
          { label: 'Business professionals', sublabel: 'AI-assisted writing & analysis tasks', gain: 59, barW: '22%', color: '#4FD1C5', textColor: '#2C9A94' },
          { label: 'Software developers', sublabel: 'GitHub Copilot for coding tasks', gain: 126, barW: '45%', color: '#38B2AC', textColor: '#1A6B5F' },
        ];
        return (
          <div style={{ padding: fs ? '24px 28px' : '14px 16px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, flex: 1, minHeight: 0 }}>
              {/* Left — body */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right — chart pinned to left of its column */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: fs ? 360 : 290 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>PRODUCTIVITY GAIN — SAME AI TOOL</div>
                  {outcomes.map((o, i) => (
                    <div key={i} style={{ marginBottom: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: fs ? 15 : 14, fontWeight: 700, color: '#1A202C' }}>{o.label}</div>
                          <div style={{ fontSize: fs ? 12 : 11, color: '#A0AEC0' }}>{o.sublabel}</div>
                        </div>
                        <span style={{ fontSize: fs ? 18 : 16, fontWeight: 800, color: o.textColor, flexShrink: 0 }}>+{o.gain}%</span>
                      </div>
                      <div style={{ height: 32, background: '#F7FAFC', borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                        <div style={{ height: '100%', width: o.barW, background: o.color, borderRadius: 6, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 4, fontSize: 10, color: '#A0AEC0', fontStyle: 'italic', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                    Sources: Brynjolfsson, Li & Raymond (MIT/Stanford/NBER, 2023); Noy & Zhang (MIT, 2023); GitHub Copilot Research (GitHub, 2022).
                  </div>
                </div>
              </div>
            </div>
            {s.pullQuote && (
              <div style={{ flexShrink: 0, marginTop: 10, padding: '14px 20px', borderLeft: '4px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0', fontSize: fs ? 15 : 14, color: '#4A5568', lineHeight: 1.65 }}>
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
          <div style={{ padding: fs ? '24px 28px' : '14px 16px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {s.body && <p style={{ fontSize: fs ? 17 : 16, color: '#4A5568', lineHeight: 1.75, margin: 0 }}>{s.body}</p>}
              </div>
              {/* Right — pyramid */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, overflow: 'hidden', maxWidth: '100%' }}>
                {pyramidLayers.map((layer, i) => (
                  <div key={i} style={{ width: layer.width, margin: '0 auto', padding: '8px 12px', borderRadius: 6, background: layer.fill, border: layer.border, textAlign: 'center', fontSize: layer.fontSize, fontWeight: layer.fontWeight, color: layer.color, position: 'relative', boxSizing: 'border-box' as const }}>
                    {layer.label}
                    {layer.active && <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' as const }}>{'\u25B8'} You are here</span>}
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
          <div style={{ padding: fs ? '22px 26px' : '14px 16px', display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

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
          <div style={{ padding: fs ? '16px 20px' : '10px 12px', display: 'flex', flexDirection: 'column', height: '100%', gap: 10, boxSizing: 'border-box' as const }}>

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
          <div style={{ padding: fs ? '14px 16px' : '10px 12px', display: 'flex', flexDirection: 'column', height: '100%', gap: 10, boxSizing: 'border-box' as const }}>
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

              {/* Right — drop zones + check button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0, paddingRight: fs ? 16 : 10 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', minHeight: 0 }}>
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
                      onClick={() => {
                        if (isTouch && draggedChip) handleDrop(c.key);
                        else if (isTouch && !draggedChip && isPlaced && !buildComplete) {
                          setDraggedChip(placedChipKey);
                          setPlacedComponents(prev => { const n = { ...prev }; delete n[c.key]; return n; });
                          setBuildChecked(false);
                        }
                      }}
                      style={{ border: isPlaced ? `1.5px solid ${c.color}` : `1.5px dashed ${isDragTarget ? c.color : c.color + '55'}`, background: isPlaced ? c.light : isDragTarget ? c.color + '0A' : '#FAFAFA', borderRadius: 8, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms ease' }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', background: c.color, padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>{c.key}</span>
                      {isPlaced && placedComp ? (
                        <span
                          draggable={!buildComplete}
                          onDragStart={(e) => {
                            if (buildComplete) { e.preventDefault(); return; }
                            setDraggedChip(placedChipKey);
                            setPlacedComponents(prev => { const n = { ...prev }; delete n[c.key]; return n; });
                            setBuildChecked(false);
                          }}
                          style={{ fontSize: 12, color: '#2D3748', lineHeight: 1.5, flex: 1, cursor: !buildComplete ? 'grab' : 'default' }}
                        >
                          {placedComp.chipText || (placedComp.filledText.length > 50 ? placedComp.filledText.slice(0, 50) + '…' : placedComp.filledText)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', lineHeight: 1.5, flex: 1 }}>{c.dropHint}</span>
                      )}
                      {buildChecked && isPlaced && (
                        <span style={{ fontSize: 16, fontWeight: 700, color: isCorrect ? '#48BB78' : '#FC8181', flexShrink: 0 }}>{isCorrect ? '✓' : '✗'}</span>
                      )}
                    </div>
                  );
                })}
                </div>
                {!buildComplete && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
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
            </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: fs ? '20px 24px' : '12px 14px', overflowY: 'auto', boxSizing: 'border-box' as const, gap: 12 }}>

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
                {predictSelected === null && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 8, padding: '5px 12px', marginBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>👇</span>
                    <span style={{ fontSize: 12, color: '#2B6CB0', fontWeight: 600 }}>Pick one to see the answer</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                  {opts.map((opt, i) => {
                    const isSelected = predictSelected === i;
                    const hasSelected = predictSelected !== null;
                    return (
                      <div key={i} onClick={() => { if (!isCorrect) setPredictSelected(i); }} style={{
                        flex: '1 1 120px', padding: '12px 16px', borderRadius: 12, textAlign: 'center' as const, fontSize: 14, fontWeight: 700, cursor: isCorrect ? 'default' : 'pointer', transition: 'all 150ms ease',
                        border: (isCorrect && isSelected) ? '2px solid #38A169' : (hasSelected && isSelected && !isCorrect) ? '2px solid #E53E3E' : '1.5px solid #E2E8F0',
                        background: (isCorrect && isSelected) ? '#F0FFF4' : (hasSelected && isSelected && !isCorrect) ? '#FFF5F5' : '#FAFAFA',
                        color: (isCorrect && isSelected) ? '#276749' : (hasSelected && isSelected && !isCorrect) ? '#9B2C2C' : '#4A5568',
                        boxShadow: isSelected && !isCorrect ? `0 2px 8px ${p.color}33` : 'none',
                      }}>
                        {isSelected && isCorrect ? '★ ' : ''}{opt}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Feedback ── */}
              {predictSelected !== null && (
                <div key={predictSelected} style={{ animation: 'fadeInUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: isCorrect ? '#F0FFF4' : '#FFF5F5', border: `2px solid ${isCorrect ? '#68D391' : '#FC8181'}`, borderRadius: 12, padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isCorrect ? '#276749' : '#9B2C2C', marginBottom: 5 }}>{isCorrect ? '✅ That\'s the best fit!' : '❌ Not quite — here\'s why'}</div>
                    <p style={{ fontSize: 13, color: isCorrect ? '#276749' : '#9B2C2C', lineHeight: 1.65, margin: 0 }}>{s.predictFeedback?.[predictSelected]}</p>
                  </div>
                  {isCorrect && (
                    <div style={{ background: `${p.color}0D`, border: `1.5px solid ${p.color}44`, borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>HOW {p.name.toUpperCase()} ACTUALLY DOES IT</div>
                      <div style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.65, marginBottom: 8, fontStyle: 'italic' }}>"{p.prompt.length > 180 ? p.prompt.slice(0, 180) + '…' : p.prompt}"</div>
                      <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.6 }}><span style={{ color: p.color, fontWeight: 700 }}>Why: </span>{p.why}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        const toggleExpand = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
        return (
          <div style={{ padding: fs ? '24px 28px' : '14px 16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        const APPROACH_ICONS = ['🧠', '💬', '📋'];
        const APPROACH_TAGLINES = [
          'Start messy, let AI find the shape',
          'Think out loud with AI as your partner',
          'Structured input for consistent output',
        ];
        return (
          <div style={{ padding: fs ? '16px 18px' : '10px 12px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: 14, boxSizing: 'border-box' as const }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {APPROACHES.map((ap, colIdx) => (
                <div key={colIdx} style={{
                  background: `linear-gradient(135deg, ${ap.color}18 0%, ${ap.color}08 100%)`,
                  border: `2px solid ${ap.color}`,
                  borderRadius: 14, padding: '14px 16px', textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: fs ? 36 : 28, lineHeight: 1, marginBottom: 6 }}>{APPROACH_ICONS[colIdx]}</div>
                  <div style={{ fontSize: fs ? 16 : 14, fontWeight: 800, color: ap.color, marginBottom: 4 }}>{ap.label}</div>
                  <div style={{ fontSize: fs ? 12 : 11, color: '#718096', lineHeight: 1.4 }}>{APPROACH_TAGLINES[colIdx]}</div>
                </div>
              ))}
            </div>
            {/* ★ Best when row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {APPROACHES.map((ap, colIdx) => {
                const bestSituations = SITUATIONS.filter((_, i) => RATINGS[i][colIdx] === 'best');
                return (
                  <div key={colIdx}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: ap.color, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>★ Best when</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {bestSituations.map((sit, i) => (
                        <div key={i} style={{ background: ap.light, border: `1.5px solid ${ap.color}50`, borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: fs ? 13 : 12, fontWeight: 700, color: '#1A202C', lineHeight: 1.4, marginBottom: 4 }}>{sit.label}</div>
                          <div style={{ fontSize: fs ? 11 : 10, color: '#718096', lineHeight: 1.5, fontStyle: 'italic' as const }}>{sit.example}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* ◐ Also works row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {APPROACHES.map((ap, colIdx) => {
                const worksSituations = SITUATIONS.filter((_, i) => RATINGS[i][colIdx] === 'works');
                return (
                  <div key={colIdx}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>◐ Also works</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {worksSituations.map((sit, i) => (
                        <div key={i} style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px' }}>
                          <div style={{ fontSize: fs ? 12 : 11, fontWeight: 600, color: '#4A5568', lineHeight: 1.4 }}>{sit.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
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
          <div style={{ padding: fs ? '20px 24px' : '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', gap: 12, overflowY: 'auto', boxSizing: 'border-box' as const }}>

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
              {selectedOpt === null && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 8, padding: '5px 12px', marginBottom: 10 }}>
                  <span style={{ fontSize: 13 }}>👇</span>
                  <span style={{ fontSize: 12, color: '#2B6CB0', fontWeight: 600 }}>Tap an approach to see if you're right</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sj.options.map((opt, i) => {
                  const isSelected = selectedOpt === i;
                  return (
                    <button key={i} onClick={() => { if (!isCorrect) setSjAnswers(prev => ({ ...prev, [slideKey]: i })); }} style={{
                      width: '100%', textAlign: 'left' as const, padding: '13px 16px', borderRadius: 10,
                      cursor: isCorrect ? 'default' : 'pointer',
                      border: (isCorrect && isSelected) ? '2px solid #38A169' : (isSelected && !isCorrect) ? '2px solid #E53E3E' : '1.5px solid #E2E8F0',
                      background: (isCorrect && isSelected) ? '#F0FFF4' : (isSelected && !isCorrect) ? '#FFF5F5' : '#FFFFFF',
                      fontSize: 13, fontWeight: 700,
                      color: (isCorrect && isSelected) ? '#276749' : (isSelected && !isCorrect) ? '#9B2C2C' : '#1A202C',
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: !isCorrect ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <span style={{ fontSize: 15 }}>{['🧠', '💬', '📐'][i]}</span>
                      {opt}
                      {isCorrect && isSelected && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#38A169', background: '#C6F6D5', padding: '2px 10px', borderRadius: 20 }}>✓ Best fit</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Feedback ── */}
            {selectedOpt !== null && (
              <div key={selectedOpt} style={{ animation: 'fadeInUp 0.25s ease', borderRadius: 12, padding: '14px 16px', background: isCorrect ? '#F0FFF4' : '#FFFBEB', border: `2px solid ${isCorrect ? '#68D391' : '#F6AD55'}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: isCorrect ? '#276749' : '#C05621', marginBottom: 4 }}>{isCorrect ? '✅ Spot on!' : '💡 Here\'s why that\'s not the best fit'}</div>
                <div style={{ fontSize: 12, color: isCorrect ? '#276749' : '#744210', lineHeight: 1.65 }}>{sj.feedback[selectedOpt]}</div>
              </div>
            )}
          </div>
        );
      }

      /* ── Module Summary (Wrap Up) ── */
      case 'moduleSummary': {
        /* Data-driven path for L3+ — renders from s.elements (node types) + s.approaches */
        if (s.elements && s.elements.length > 0) {
          const approachItems = (s as any).approaches ?? [];
          return (
            <div style={{ padding: fs ? '16px 20px' : '8px 10px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' as const, gap: 12 }}>
              {/* Section 1 — Node types grid */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, padding: fs ? '16px 20px' : '12px 16px', border: '1.5px solid #E2E8F0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: fs ? 13 : 12, fontWeight: 800, color: '#38B2AC', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{s.panelHeading || 'The Six Node Types'}</div>
                <div style={{ fontSize: fs ? 15 : 14, color: '#4A5568', marginBottom: 10, lineHeight: 1.4 }}>{s.body || 'Every workflow step is one of these six. Identify them and you can map any process.'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1 }}>
                  {s.elements.map((el, i) => (
                    <div key={i} style={{ background: el.light || `${el.color}0A`, border: `1.5px solid ${el.color}55`, borderRadius: 10, padding: fs ? '14px 16px' : '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                      <div style={{ fontSize: fs ? 15 : 13, fontWeight: 900, color: el.color }}>{el.key}</div>
                      <div style={{ fontSize: fs ? 13 : 11, color: '#4A5568', lineHeight: 1.4 }}>{el.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Section 2 — Mapping approaches */}
              {approachItems.length > 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: fs ? 13 : 12, fontWeight: 800, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{s.subheading || 'Three Mapping Approaches'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
                    {approachItems.map((item: any, i: number) => (
                      <div key={i} style={{ background: item.light, border: `1.5px solid ${item.color}55`, borderTop: `3px solid ${item.color}`, borderRadius: 12, padding: fs ? '16px 18px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: fs ? 26 : 22 }}>{item.icon}</span>
                          <span style={{ fontSize: fs ? 18 : 15, fontWeight: 900, color: item.color }}>{item.label}</span>
                        </div>
                        <div style={{ fontSize: fs ? 14 : 12, color: '#2D3748', lineHeight: 1.6, flex: 1 }}>
                          <span style={{ fontWeight: 700, color: item.color }}>Use when: </span>{item.when}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        /* Legacy hardcoded path for L1T1 */
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
          <div style={{ padding: fs ? '16px 20px' : '8px 10px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' as const, gap: 12 }}>

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
          <div style={{ padding: fs ? '20px 24px' : '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
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
          <div style={{ padding: fs ? '24px 28px' : '14px 16px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
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

      /* ── RCTF — two-column with anatomy when visualId present, else 3×2 grid ── */
      case 'rctf':
        if (s.visualId) {
          return (
            <div style={{ padding: fs ? '20px 24px' : '12px 16px', display: 'flex', gap: 16, height: '100%', boxSizing: 'border-box' as const }}>
              {/* Left: anatomy diagram, highlights active layer */}
              <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: fs ? '18px 20px' : '14px 16px' }}>
                {renderConceptVisual(s.visualId, fs, contextStep >= 0 ? contextStep : undefined)}
              </div>
              {/* Right: cards reveal one by one */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                {s.subheading && contextStep < 0 && <p style={{ fontSize: fs ? 14 : 12, color: '#718096', lineHeight: 1.6, margin: 0 }}>{s.subheading}</p>}
                {s.elements?.map((el, i) => {
                  const revealed = !(s as any).revealOnNext || i <= contextStep;
                  return (
                    <div key={el.key} style={{
                      padding: fs ? '14px 18px' : '12px 14px', borderRadius: 12,
                      border: `1.5px solid ${el.color}${i === contextStep ? '' : '55'}`,
                      background: i === contextStep ? el.light : `${el.color}08`,
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? 'translateX(0)' : 'translateX(12px)',
                      transition: 'opacity 0.4s ease, transform 0.4s ease',
                      boxShadow: i === contextStep ? `0 2px 10px ${el.color}22` : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        {el.icon && <span style={{ fontSize: fs ? 18 : 16 }}>{el.icon}</span>}
                        <span style={{ fontSize: fs ? 12 : 11, fontWeight: 800, color: el.color, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{el.key}</span>
                      </div>
                      <div style={{ fontSize: fs ? 13 : 12, color: '#2D3748', lineHeight: 1.6, marginBottom: 6 }}>{el.desc}</div>
                      {el.example && <div style={{ fontSize: fs ? 11 : 10, color: '#718096', fontStyle: 'italic', lineHeight: 1.5, borderTop: `1px solid ${el.color}33`, paddingTop: 6, marginBottom: 5 }}>{el.example}</div>}
                      {el.whyItMatters && (
                        <div style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: el.color, padding: '4px 10px', background: '#FFFFFF', borderRadius: 6, border: `1px solid ${el.color}33`, display: 'inline-block' }}>
                          {el.whyItMatters}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: fs ? '16px 20px' : '10px 12px', display: 'flex', flexDirection: 'column', height: '100%', gap: 8, boxSizing: 'border-box' as const }}>
            {s.subheading && <p style={{ fontSize: fs ? 14 : 12, color: '#718096', lineHeight: 1.6, margin: 0, flexShrink: 0 }}>{s.subheading}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: fs ? 10 : 8, flex: 1, minHeight: 0 }}>
              {s.elements?.map((el, i) => (
                <div key={el.key} style={{ padding: fs ? '18px 20px' : '14px 16px', borderRadius: 12, border: `1.5px solid ${el.color}55`, background: el.light || `${el.color}08`, opacity: !(s as any).revealOnNext || i <= contextStep ? 1 : 0, transition: 'opacity 0.35s ease', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      {el.icon && <span style={{ fontSize: fs ? 22 : 18 }}>{el.icon}</span>}
                      <span style={{ fontSize: fs ? 12 : 11, fontWeight: 800, color: el.color, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{el.key}</span>
                    </div>
                    <div style={{ fontSize: fs ? 13 : 12, color: '#2D3748', lineHeight: 1.6, marginBottom: 8 }}>{el.desc}</div>
                    {el.example && <div style={{ fontSize: fs ? 12 : 11, color: '#718096', fontStyle: 'italic', lineHeight: 1.5, borderTop: `1px solid ${el.color}33`, paddingTop: 8, marginBottom: 6 }}>e.g. {el.example}</div>}
                  </div>
                  {el.whyItMatters && (
                    <div style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: el.color, lineHeight: 1.4, padding: '5px 10px', background: '#FFFFFF', borderRadius: 6, border: `1px solid ${el.color}33`, marginTop: 'auto' }}>
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
        return <PersonaCaseStudySlide slide={s} fs={fs} activeIdx={personaCaseStudyIdx} onIdxChange={setPersonaCaseStudyIdx} />;

      /* ── Approach Matrix ── */
      case 'approachIntro': {
        const approaches = (s as any).approaches ?? [];
        const allFlipped = approaches.every((_: any, i: number) => !!flippedCards[i]);
        return (
          <div style={{ padding: fs ? '18px 22px' : '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', gap: 14, boxSizing: 'border-box' as const }}>

            {/* Instruction / completion banner — same slot, swaps on allFlipped */}
            <div style={{ flexShrink: 0 }}>
              {allFlipped ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FFF4', border: '1.5px solid #38A16955', borderRadius: 10, padding: '7px 14px' }}>
                  <span style={{ fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: fs ? 13 : 12, fontWeight: 700, color: '#276749' }}>All three explored — next you'll see each one in action</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#38B2AC15', border: '1.5px solid #38B2AC55', borderRadius: 10, padding: '7px 14px' }}>
                  <span style={{ fontSize: 16 }}>👆</span>
                  <span style={{ fontSize: fs ? 13 : 12, fontWeight: 700, color: '#1A6B5F' }}>Click each card or use Next to explore</span>
                </div>
              )}
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
                      borderTop: `5px solid ${flipped ? a.color : '#CBD5E0'}`,
                      borderRadius: 14, padding: fs ? '28px 26px' : '20px 20px',
                      cursor: 'pointer', textAlign: 'left' as const,
                      display: 'flex', flexDirection: 'column',
                      gap: fs ? 20 : 16, justifyContent: flipped ? 'flex-start' : 'space-evenly', alignItems: flipped ? 'flex-start' : 'center',
                      transition: 'all 0.2s ease', height: '100%', boxSizing: 'border-box' as const,
                    }}
                  >
                    {flipped ? (
                      <>
                        {/* Flipped: full detail */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: fs ? 32 : 26 }}>{a.icon}</span>
                          <div style={{ fontSize: fs ? 24 : 20, fontWeight: 900, color: a.color }}>{a.name}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: fs ? 12 : 11, fontWeight: 800, color: a.color, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>When to use</div>
                          <div style={{ fontSize: fs ? 17 : 15, color: '#2D3748', lineHeight: 1.65 }}>{a.when}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: fs ? 12 : 11, fontWeight: 800, color: a.color, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>How it works</div>
                          <div style={{ fontSize: fs ? 17 : 15, color: '#2D3748', lineHeight: 1.65 }}>{a.how}</div>
                        </div>

                        <div style={{ marginTop: 'auto', background: '#FFFFFF', border: `1.5px solid ${a.color}55`, borderRadius: 10, padding: fs ? '12px 16px' : '10px 14px', width: '100%', boxSizing: 'border-box' as const }}>
                          <div style={{ fontSize: fs ? 16 : 14, fontWeight: 700, color: a.color }}>{a.connection}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Default: icon + name + tagline */}
                        <span style={{ fontSize: fs ? 72 : 56 }}>{a.icon}</span>
                        <div style={{ fontSize: fs ? 26 : 22, fontWeight: 900, color: '#4A5568', textAlign: 'center' as const }}>{a.name}</div>
                        <div style={{ fontSize: fs ? 17 : 15, color: '#718096', fontWeight: 500, textAlign: 'center' as const, lineHeight: 1.55 }}>{a.tagline}</div>
                        <div style={{ fontSize: fs ? 14 : 12, color: '#CBD5E0', fontWeight: 600 }}>tap to explore ▸</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        );
      }

      case 'approachMatrix':
        return <ApproachMatrixSlide slide={s} fs={fs} />;

      /* ── Drag Sort — classify items into labelled zones ── */
      case 'dragSort': {
        const zones = s.dragZones ?? [];
        const allItems = s.dragItems ?? [];
        const unplaced = allItems.filter(item => !dragPlacements[item.id]);

        const handleItemDragStart = (itemId: string) => setDragSortItemId(itemId);
        const handleZoneDrop = (e: React.DragEvent, zoneId: string) => {
          e.preventDefault();
          if (!dragSortItemId) return;
          setDragPlacements(prev => ({ ...prev, [dragSortItemId]: zoneId }));
          setDragSortItemId(null);
        };
        const handleReturnToPool = (itemId: string) => {
          setDragPlacements(prev => { const next = { ...prev }; delete next[itemId]; return next; });
        };

        const itemCard = (item: { id: string; label: string; correctZone: string }, inZone?: boolean) => {
          const placed = !!dragPlacements[item.id];
          const zone = zones.find(z => z.id === dragPlacements[item.id]);
          let bg = '#FFFFFF', border = '1.5px solid #E2E8F0', color = '#4A5568';
          if (dragChecked && placed) {
            const correct = dragPlacements[item.id] === item.correctZone;
            bg = correct ? '#F0FFF4' : '#FFF5F5';
            border = correct ? '1.5px solid #68D391' : '1.5px solid #FC8181';
            color = correct ? '#276749' : '#C53030';
          } else if (placed && zone) {
            bg = zone.light; border = `1.5px solid ${zone.color}55`; color = '#1A202C';
          }
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleItemDragStart(item.id)}
              onClick={inZone ? () => handleReturnToPool(item.id) : undefined}
              title={inZone ? 'Click to return to pool' : 'Drag to a layer'}
              style={{
                background: bg, border, borderRadius: 8,
                padding: fs ? '10px 14px' : '8px 12px',
                fontSize: fs ? 14 : 13, color, fontWeight: 500, lineHeight: 1.4,
                cursor: 'grab', userSelect: 'none' as const,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              {dragChecked && placed && (
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {dragPlacements[item.id] === item.correctZone ? '✓' : '✗'}
                </span>
              )}
              {item.label}
            </div>
          );
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: fs ? 12 : 10, padding: fs ? '20px 28px' : '14px 20px', boxSizing: 'border-box' as const }}>
            {/* Context */}
            {s.dragContext && (
              <div style={{ flexShrink: 0, fontSize: fs ? 13 : 12, color: '#718096', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: fs ? '9px 14px' : '7px 12px', lineHeight: 1.5 }}>
                {s.dragContext}
              </div>
            )}

            {/* Drop zones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: fs ? 10 : 8, flex: 1, minHeight: 0 }}>
              {zones.map(zone => {
                const zoneItems = allItems.filter(item => dragPlacements[item.id] === zone.id);
                return (
                  <div
                    key={zone.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleZoneDrop(e, zone.id)}
                    style={{
                      background: zoneItems.length > 0 ? zone.light : '#FAFAFA',
                      border: `2px dashed ${zone.color}55`,
                      borderRadius: 12, padding: fs ? '14px 12px' : '10px 10px',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Zone header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: fs ? 18 : 15 }}>{zone.icon}</span>
                      <span style={{ fontSize: fs ? 13 : 12, fontWeight: 800, color: zone.color, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{zone.label}</span>
                    </div>
                    {/* Placed items */}
                    {zoneItems.length === 0 ? (
                      <div style={{ fontSize: fs ? 13 : 12, color: '#CBD5E0', fontStyle: 'italic', textAlign: 'center' as const, marginTop: 12 }}>Drop here</div>
                    ) : (
                      zoneItems.map(item => itemCard(item, true))
                    )}
                  </div>
                );
              })}
            </div>

            {/* Source pool */}
            {unplaced.length > 0 && (
              <div style={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', paddingTop: fs ? 10 : 8 }}>
                <div style={{ fontSize: fs ? 11 : 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  Drag to sort — {unplaced.length} remaining
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
                  {unplaced.map(item => itemCard(item, false))}
                </div>
              </div>
            )}

            {/* Status messages */}
            {unplaced.length === 0 && !dragAllCorrect && (
              <div style={{ flexShrink: 0, fontSize: fs ? 13 : 12, color: '#38B2AC', fontWeight: 600, textAlign: 'center' as const, padding: '5px 0' }}>
                All placed — hit Next to check your answers
              </div>
            )}
            {dragAllCorrect && (
              <div style={{ flexShrink: 0, fontSize: fs ? 13 : 12, color: '#276749', fontWeight: 700, textAlign: 'center' as const, background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 8, padding: '8px 0' }}>
                ✓ All correct — you can continue
              </div>
            )}
          </div>
        );
      }

      /* ── Situational Judgment (with persona framing & multi-step) ── */
      case 'situationalJudgment':
        return <SituationalJudgmentSlide slide={s} fs={fs} activeScenarioIdx={sjScenarioIdx} onScenarioChange={setSjScenarioIdx} selectedOption={sjSelectedOption} onSelectOption={setSjSelectedOption} />;

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
          <div style={{ padding: fs ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: spectrumPos === i ? '#38B2AC' : '#718096', transition: 'color 0.2s' }}>{p.label}</div>
                </div>
              ))}
            </div>
            {/* Active position panel */}
            {s.positions && s.positions[spectrumPos] && (
              <div key={spectrumPos} style={{ flex: 1, background: '#F7FAFC', borderLeft: '3px solid #38B2AC', borderRadius: '0 12px 12px 0', padding: '16px 20px', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>{s.positions[spectrumPos].label}</div>
                <p style={{ fontSize: 15, color: '#4A5568', lineHeight: 1.6, margin: '0 0 10px' }}>{s.positions[spectrumPos].desc}</p>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {s.positions[spectrumPos].example}
                </div>
              </div>
            )}
          </div>
        );

      /* ── Quiz (single MCQ with feedback) ── */
      case 'quiz':
        return (
          <div style={{ padding: fs ? '20px 36px' : '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: s.body ? 'flex-start' : 'center', height: '100%', gap: 10 }}>
            {/* Teaching section — only rendered when slide has body content */}
            {s.body && (
              <div style={{ flexShrink: 0, background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: fs ? '14px 20px' : '12px 14px' }}>
                {s.quizEyebrow && <div style={{ fontSize: 10, fontWeight: 800, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{s.quizEyebrow}</div>}
                <p style={{ fontSize: fs ? 13 : 12, color: '#2D3748', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{s.body}</p>
              </div>
            )}
            {/* Activity divider */}
            {s.body && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#A0AEC0', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>ACTIVITY</span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>
            )}
            {!s.body && s.quizEyebrow && <p style={{ fontSize: 10, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{s.quizEyebrow}</p>}
            {s.question && <p style={{ fontSize: fs ? 16 : 14, fontWeight: 700, color: '#1A202C', lineHeight: 1.4, margin: s.body ? '0' : '0 0 20px', flexShrink: 0 }}>{s.question}</p>}
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

      /* ── Comparison (3-tab, full-height, colored panels) ── */
      case 'comparison': {
        const TAB_PALETTE = [
          { bg: '#FFF5F5', border: '#FC8181', annotBg: '#FED7D755', badgeBg: '#FED7D7', badgeText: '#C53030', tabText: '#C53030' },
          { bg: '#FFFBEB', border: '#ECC94B', annotBg: '#FEFCBF55', badgeBg: '#FEFCBF', badgeText: '#975A16', tabText: '#975A16' },
          { bg: '#F0FFF4', border: '#48BB78', annotBg: '#C6F6D555', badgeBg: '#C6F6D5', badgeText: '#22543D', tabText: '#22543D' },
        ];
        const tc = TAB_PALETTE[activeCompTab] ?? TAB_PALETTE[0];
        return (
          <div style={{ padding: fs ? '20px 36px 16px' : '12px 20px 10px', display: 'flex', flexDirection: 'column', height: '100%', gap: 10, boxSizing: 'border-box' }}>
            {/* Scenario banner */}
            {s.scenario && (
              <div style={{ flexShrink: 0, background: '#F7FAFC', borderRadius: 10, padding: '10px 16px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: fs ? 13 : 11, fontWeight: 700, color: '#2B4C7E', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>SCENARIO: </span>
                <span style={{ fontSize: fs ? 13 : 12, color: '#2D3748', lineHeight: 1.5 }}>{s.scenario}</span>
              </div>
            )}
            {/* Tab buttons + step counter */}
            <div style={{ flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
              {s.tabs?.map((tab, i) => {
                const isActive = activeCompTab === i;
                const p = TAB_PALETTE[i] ?? TAB_PALETTE[0];
                return (
                  <button key={i} onClick={() => setActiveCompTab(i)} style={{
                    flex: 1, padding: '9px 10px', fontSize: fs ? 13 : 12, fontWeight: 700,
                    border: isActive ? `2px solid ${p.border}` : '2px solid #E2E8F0',
                    borderRadius: 10, background: isActive ? p.bg : '#FAFBFC',
                    color: isActive ? p.tabText : '#A0AEC0', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}>
                    {tab.label}
                  </button>
                );
              })}
              <span style={{ flexShrink: 0, fontSize: 11, color: '#A0AEC0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {activeCompTab + 1} / {s.tabs?.length ?? 3}
              </span>
            </div>
            {/* Active tab content — fills remaining height */}
            {s.tabs && s.tabs[activeCompTab] && (
              <div key={activeCompTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeInUp 0.2s ease', minHeight: 0 }}>
                {/* Prompt block */}
                <div style={{
                  flex: 1, background: tc.bg, border: `1.5px solid ${tc.border}`,
                  borderLeft: `4px solid ${tc.border}`, borderRadius: '0 10px 10px 0',
                  padding: fs ? '16px 20px' : '12px 16px',
                  fontSize: fs ? 14 : 13, color: '#2D3748', lineHeight: 1.75,
                  fontStyle: 'italic', whiteSpace: 'pre-line', overflowY: 'auto', minHeight: 0,
                }}>
                  {s.tabs![activeCompTab].prompt}
                </div>
                {/* Annotation block */}
                <div style={{
                  flex: 1, background: tc.annotBg, borderRadius: 10,
                  border: `1px solid ${tc.border}55`,
                  padding: fs ? '14px 18px' : '10px 14px',
                  fontSize: fs ? 14 : 13, color: '#4A5568', lineHeight: 1.7,
                  overflowY: 'auto', minHeight: 0,
                }}>
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, background: tc.badgeBg, color: tc.badgeText, borderRadius: 6, padding: '2px 8px', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>Analysis</span>
                  <div>{s.tabs[activeCompTab].annotation}</div>
                </div>
              </div>
            )}
          </div>
        );
      }

      /* ── Flipcard (two side-by-side flip cards) ── */
      case 'flipcard':
        return (
          <div style={{ padding: fs ? '28px 32px' : '18px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {s.instruction && <p style={{ fontSize: fs ? 14 : 12, color: '#718096', lineHeight: 1.5, margin: '0 0 14px' }}>{s.instruction}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, alignItems: 'stretch' }}>
              {s.cards?.map((card, i) => {
                const isFlipped = flippedCards[i] || false;
                return (
                  <div key={i} onClick={() => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }))} style={{ perspective: 1000, cursor: 'pointer', minHeight: 200 }}>
                    <div className={`flip-card-inner${isFlipped ? ' flipped' : ''}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* Front */}
                      <div className="flip-card-face" style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid #FEB2B2', background: '#FFF5F5', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#FC8181', background: '#FED7D7', padding: '3px 10px', borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8, letterSpacing: '0.05em' }}>{card.frontBadge}</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>{card.frontLabel}</div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #FC8181', borderRadius: '0 8px 8px 0', padding: '10px 12px', fontSize: 13, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic', flex: 1 }}>
                          {card.frontPrompt}
                        </div>
                        <div style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'center', marginTop: 8 }}>Click to flip ↺</div>
                      </div>
                      {/* Back */}
                      <div className="flip-card-face flip-card-back" style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid #9AE6B4', background: '#F0FFF4', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#48BB78', background: '#C6F6D5', padding: '3px 10px', borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8, letterSpacing: '0.05em' }}>{card.backBadge}</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>{card.backLabel}</div>
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '3px solid #48BB78', borderRadius: '0 8px 8px 0', padding: '10px 12px', fontSize: 13, color: '#2D3748', lineHeight: 1.6, fontStyle: 'italic', flex: 1, overflowY: 'auto' }}>
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
                        <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginTop: 8, padding: '8px 10px', background: '#E6FFFA', borderRadius: 6 }}>
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
          <div style={{ padding: fs ? '24px 28px' : '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {s.scenario && (
              <div style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #E6FFFA 100%)', borderRadius: 10, padding: '10px 16px', marginBottom: 12, border: '1.5px solid #2B4C7E22' }}>
                <span style={{ fontSize: 14, color: '#2D3748', lineHeight: 1.5 }}>{s.scenario}</span>
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
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1A202C', marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.5 }}>
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
          <div style={{ padding: fs ? '28px 32px' : '18px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <div style={{ padding: fs ? '28px 32px' : '18px 20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
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
          <div style={{ padding: fs ? '20px 24px' : '14px 16px', display: 'flex', flexDirection: 'column', height: '100%', gap: 14, boxSizing: 'border-box' as const }}>
            {/* Prompt box — fixed height, not flex-1 */}
            <div style={{ background: '#EDF2F7', border: '2px solid #CBD5E0', borderLeft: '4px solid #38B2AC', borderRadius: 12, padding: fs ? '14px 20px' : '12px 16px', flexShrink: 0, overflowY: 'auto', maxHeight: fs ? 220 : 180 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#38B2AC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>The Prompt</div>
              <div style={{ fontSize: fs ? 18 : 16, color: '#2D3748', lineHeight: 1.7, whiteSpace: 'pre-line', fontStyle: 'italic' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: fs ? 10 : 8, flex: 1, minHeight: 0 }}>
              {flawOptions.map((opt, i) => {
                const isCorrect = i === flawCorrect;
                const isSelected = flawSelected === i;
                const wasWrong = flawChosen && isSelected && !isCorrect;
                let bg = OPTION_LIGHTS[i], border = OPTION_COLORS[i] + '66', color = OPTION_COLORS[i];
                if (flawSolved && isCorrect) { bg = '#C6F6D5'; border = '#38A169'; color = '#276749'; }
                else if (wasWrong) { bg = '#FED7D7'; border = '#E53E3E'; color = '#C53030'; }
                return (
                  <button key={opt} onClick={() => !flawSolved && setFlawSelected(i)} style={{
                    padding: '6px 8px', borderRadius: 10,
                    fontSize: fs ? 15 : 13, fontWeight: 700,
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

            {/* Feedback — only shown on correct, no placeholder text so grid stays stable */}
            {flawSolved && s.explanation && (
              <div style={{ flexShrink: 0, background: '#F0FFF4', border: '2px solid #68D391', borderRadius: 12, padding: fs ? '16px 20px' : '12px 16px', animation: 'fadeInUp 0.25s ease' }}>
                <span style={{ fontWeight: 800, fontSize: fs ? 22 : 18, color: '#276749', display: 'block', marginBottom: 6 }}>✓ Correct!</span>
                <span style={{ fontSize: fs ? 15 : 13, color: '#2D3748', lineHeight: 1.7 }}>{s.explanation}</span>
              </div>
            )}
          </div>
        );
      }

      /* ── Concept (enhanced: two-column with visual panel when visualId present) ── */
      case 'concept':
      default:
        if (s.visualId) {
          const wideVisual = s.visualId === 'l3-workflow-decision' || s.visualId === 'l2-agent-decision';
          return (
            <div style={{ padding: fs ? '20px 24px' : '12px 14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
                {/* Left: text */}
                <div style={{ flex: wideVisual ? '0 0 28%' : '0 0 55%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {s.eyebrow && (
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#A0AEC0', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{s.eyebrow}</div>
                  )}
                  {s.body && <p style={{ fontSize: fs ? 17 : 15, color: '#4A5568', lineHeight: 1.75, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{s.body}</p>}
                  {s.pullQuote && (
                    <div style={{ borderLeft: '4px solid #38B2AC', background: '#E6FFFA', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: fs ? 15 : 13, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontStyle: 'italic', marginTop: s.body ? 12 : 0 }}>
                      {s.pullQuote}
                    </div>
                  )}
                </div>
                {/* Right: visual panel */}
                <div style={{ flex: 1, background: wideVisual ? 'transparent' : '#F7FAFC', border: wideVisual ? 'none' : '1px solid #E2E8F0', borderRadius: 12, padding: wideVisual ? 0 : '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
                  {renderConceptVisual(s.visualId, fs)}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: fs ? '32px 64px' : '20px 36px' }}>
            {s.eyebrow && (
              <div style={{ fontSize: 11, fontWeight: 800, color: '#38B2AC', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: fs ? 14 : 10 }}>
                {s.eyebrow}
              </div>
            )}
            {s.body && <p style={{ fontSize: fs ? 17 : 15, color: '#4A5568', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{s.body}</p>}
            {s.pullQuote && (
              <div style={{ borderLeft: '4px solid #38B2AC', background: '#E6FFFA', padding: '14px 18px', borderRadius: '0 8px 8px 0', marginTop: 20, fontSize: fs ? 16 : 14, fontWeight: 600, color: '#1A202C', lineHeight: 1.5, fontStyle: 'italic' }}>
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
    setPersonaCaseStudyIdx(0);
    setSjSelectedOption(null);
    setDragPlacements({});
    setDragChecked(false);
    setDragSortItemId(null);
    // Voiceover: load the new slide's setup clip (loadClip handles stopping previous audio)
    const currentSlideData = slides[currentSlide - 1];
    if (currentSlideData?.voiceover?.setup) {
      voiceover.loadClip(currentSlideData.voiceover.setup, 'setup');
    } else {
      voiceover.stopAndReset();
    }
  }, [currentSlide]);

  // Voiceover: play reveal clip when correct prediction is selected on persona slides
  useEffect(() => {
    const slide = slides[currentSlide - 1];
    if (slide?.predictFirst && predictSelected !== null && predictSelected === slide.predictCorrect && slide.voiceover?.reveal) {
      voiceover.loadClip(slide.voiceover.reveal, 'reveal');
    }
  }, [predictSelected]);

  /* ── Next button interception: reveal slides + situationalJudgment cycling ── */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Slides that block Next until the user makes a selection
  const dragAllPlaced = s.type === 'dragSort' && s.dragItems
    ? s.dragItems.every(item => !!dragPlacements[item.id])
    : false;
  const dragAllCorrect = s.type === 'dragSort' && s.dragItems
    ? s.dragItems.every(item => dragPlacements[item.id] === item.correctZone)
    : false;

  const needsInteraction =
    (s.type === 'buildAPrompt' && Object.keys(placedComponents).length === 0) ||
    (s.type === 'persona' && s.predictFirst && predictSelected === null) ||
    (s.type === 'situationalJudgment' && sjSelectedOption === null) ||
    (s.type === 'dragSort' && !dragAllCorrect);

  // Single source of truth for the activity warning message
  const activityWarningMsg =
    (s.type === 'persona' && s.predictFirst) || s.type === 'situationalJudgment'
      ? '👆 Select an option before continuing'
      : s.type === 'dragSort' && !dragAllPlaced
      ? '👆 Place all items before continuing'
      : s.type === 'dragSort' && !dragAllCorrect
      ? '↩ Some items are in the wrong layer — review and try again'
      : '👆 Try the activity before continuing';

  const triggerActivityWarning = () => {
    setShowActivityWarning(true);
    if (activityWarningTimer.current) clearTimeout(activityWarningTimer.current);
    activityWarningTimer.current = setTimeout(() => setShowActivityWarning(false), 2500);
  };

  const handleNextClick = () => {
    // dragSort: if all placed but some wrong, show feedback then return wrong items to pool
    if (s.type === 'dragSort' && dragAllPlaced && !dragAllCorrect) {
      setDragChecked(true);
      // Remove incorrectly placed items from their zones
      const corrected: Record<string, string> = {};
      s.dragItems?.forEach(item => {
        if (dragPlacements[item.id] === item.correctZone) corrected[item.id] = item.correctZone;
      });
      setTimeout(() => { setDragPlacements(corrected); setDragChecked(false); }, 1200);
      triggerActivityWarning();
      return;
    }
    if (needsInteraction) { triggerActivityWarning(); return; }
    // situationalJudgment: cycle through scenarios (only reachable after selection due to needsInteraction block)
    if (s.type === 'situationalJudgment' && s.scenarios && sjScenarioIdx < s.scenarios.length - 1) {
      setSjScenarioIdx((prev) => prev + 1);
      setSjSelectedOption(null);
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
    // rctf with revealOnNext: reveal one card at a time (uses contextStep)
    if (s.type === 'rctf' && (s as any).revealOnNext) {
      const total = s.elements?.length ?? 0;
      if (contextStep < total - 1) {
        setContextStep((prev) => prev + 1);
        return;
      }
    }
    // comparison: cycle through tabs before advancing to next slide
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
    // quiz: auto-select correct answer if not yet answered
    if (s.type === 'quiz' && !quizAnswered) {
      if (quizSelected === null) setQuizSelected(s.correct ?? 0);
      setQuizAnswered(true);
      return;
    }
    // spotTheFlaw: auto-reveal correct answer if not yet solved
    if (s.type === 'spotTheFlaw') {
      const flawCorrect = s.correct ?? 0;
      if (flawSelected !== flawCorrect) {
        setFlawSelected(flawCorrect);
        return;
      }
    }
    // sjExercise: auto-select correct answer if nothing chosen
    if (s.type === 'sjExercise' && (s as any).sjData) {
      const slideKey = currentSlide;
      if (sjAnswers[slideKey] == null) {
        setSjAnswers((prev) => ({ ...prev, [slideKey]: (s as any).sjData.correct }));
        return;
      }
    }
    // persona (predictFirst): Next only reachable after selection (needsInteraction blocks otherwise)
    // personaCaseStudy: cycle through persona tabs one by one
    if (s.type === 'personaCaseStudy' && (s as any).personas) {
      const personas = (s as any).personas;
      if (personaCaseStudyIdx < personas.length - 1) {
        setPersonaCaseStudyIdx((prev) => prev + 1);
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
  const nextLabel = isLastSlide ? 'Finish E-Learning →' : 'Next →';

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
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Top bar — white, minimize only */}
        <div style={{ background: '#FFFFFF', height: 48, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, borderBottom: '1px solid #EDF2F7' }}>
          <button onClick={() => setIsFullscreen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} title="Exit fullscreen (Esc)">
            <Minimize2 size={16} color="#A0AEC0" />
          </button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: '#EDF2F7', flexShrink: 0 }}>
          <div style={{ height: '100%', background: accentColor, width: `${(currentSlide / totalSlides) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        <AudioBar voiceover={voiceover} isFullscreen />
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
        {/* Bottom nav bar — white, dots centred */}
        <div style={{ borderTop: '1px solid #EDF2F7', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', flexShrink: 0 }}>
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 1}
            style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: '1px solid #E2E8F0', background: 'transparent', color: currentSlide === 1 ? '#CBD5E0' : '#1A202C', fontSize: 13, fontWeight: 600, cursor: currentSlide === 1 ? 'default' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            ← Previous
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {renderDots('lg')}
            <span style={{ fontSize: 10, color: '#A0AEC0' }}>{currentSlide} / {totalSlides}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {showActivityWarning && (
              <div className="activity-warning" style={{ background: '#1A202C', color: '#FFFFFF', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', whiteSpace: 'nowrap', letterSpacing: '0.01em', pointerEvents: 'none' }}>
                {activityWarningMsg}
              </div>
            )}
            <button onClick={handleNextClick} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: 'none', background: isLastSlide ? accentColor : '#38B2AC', color: isLastSlide ? accentDark : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              {nextLabel}
            </button>
          </div>
        </div>
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
              onClick={() => { onCompletePhase(); window.location.href = practiceUrl; }}
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
        <AudioBar voiceover={voiceover} />
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {showActivityWarning && (
                <div className="activity-warning" style={{ background: '#1A202C', color: '#FFFFFF', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', whiteSpace: 'nowrap', letterSpacing: '0.01em', pointerEvents: 'none' }}>
                  {activityWarningMsg}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderFsButton()}
                <button onClick={handleNextClick} style={{ padding: '8px 20px', borderRadius: 24, minHeight: 40, border: 'none', background: isLastSlide ? accentColor : '#38B2AC', color: isLastSlide ? accentDark : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                  {nextLabel}
                </button>
              </div>
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
function PersonaCaseStudySlide({ slide, fs, activeIdx, onIdxChange }: { slide: SlideData; fs: boolean; activeIdx: number; onIdxChange: (idx: number) => void }) {
  const personas = slide.personas || [];
  const active = personas[activeIdx];
  if (!active) return null;

  return (
    <div style={{ padding: fs ? '28px 32px' : '16px 18px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {slide.body && <p style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.5, margin: '0 0 8px' }}>{slide.body}</p>}
      {slide.pullQuote && (
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', fontStyle: 'italic', margin: '0 0 10px', padding: '6px 12px', borderLeft: '3px solid #38B2AC', background: '#F7FAFC', borderRadius: '0 8px 8px 0' }}>{slide.pullQuote}</div>
      )}

      {/* Persona tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {personas.map((p, i) => (
          <button key={i} onClick={() => onIdxChange(i)} style={{
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
    <div style={{ padding: fs ? '24px 28px' : '12px 14px', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
function SituationalJudgmentSlide({ slide, fs, activeScenarioIdx, onScenarioChange, selectedOption, onSelectOption }: { slide: SlideData; fs: boolean; activeScenarioIdx: number; onScenarioChange: (idx: number) => void; selectedOption: number | null; onSelectOption: (opt: number) => void }) {
  const scenarios = slide.scenarios || [];
  const scenario = scenarios[activeScenarioIdx];
  if (!scenario) return null;

  /* Default colors per option slot (before selection — always colored, never white) */
  const OPTION_DEFAULT = [
    { bg: '#EBF8FF', border: '#90CDF4', text: '#2B6CB0' },
    { bg: '#E6FFFA', border: '#81E6D9', text: '#1A6B5F' },
    { bg: '#FAF5FF', border: '#D6BCFA', text: '#553C9A' },
  ];

  const fb = selectedOption !== null ? scenario.feedback[selectedOption] : null;
  const fbQ = fb?.quality ?? 'partial';
  const fbBg    = fbQ === 'strong' ? '#F0FFF4' : fbQ === 'partial' ? '#FFFBEB' : '#FFF5F5';
  const fbBorder = fbQ === 'strong' ? '#68D391' : fbQ === 'partial' ? '#F6AD55' : '#FC8181';
  const fbColor  = fbQ === 'strong' ? '#276749'  : fbQ === 'partial' ? '#C05621'  : '#9B2C2C';
  const fbLabel  = fbQ === 'strong' ? 'STRONGEST CHOICE' : fbQ === 'partial' ? 'COULD WORK' : 'NOT THE BEST FIT';

  return (
    <div style={{ padding: fs ? '20px 24px' : '12px 14px', display: 'flex', flexDirection: 'column', height: '100%', gap: 8, boxSizing: 'border-box' as const }}>

      {/* Scenario tabs */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {scenarios.map((sc, i) => (
          <button key={i} onClick={() => { onScenarioChange(i); }} style={{
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

      {/* Persona header */}
      {scenario.personaName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#F7FAFC', borderRadius: 10, border: '1px solid #E2E8F0', flexShrink: 0 }}>
          {scenario.personaIcon && <span style={{ fontSize: 20 }}>{scenario.personaIcon}</span>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{scenario.personaName}</div>
            <div style={{ fontSize: 11, color: '#718096' }}>{scenario.personaRole}</div>
          </div>
        </div>
      )}

      {/* Scenario description — always larger than option buttons */}
      <div key={activeScenarioIdx} style={{ background: '#F7FAFC', borderRadius: 10, padding: fs ? '16px 20px' : '12px 16px', fontSize: fs ? 18 : 16, fontWeight: 700, color: '#1A202C', lineHeight: 1.65, border: '1px solid #E2E8F0', animation: 'slideInRight 0.3s ease', flexShrink: 0 }}>
        {scenario.scenario}
      </div>

      {/* Option cards — fixed height, text always smaller than scenario */}
      <div style={{ display: 'flex', gap: 8, height: fs ? 90 : 75, flexShrink: 0 }}>
        {scenario.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isStrongest = i === scenario.strongestChoice;
          const showResult = selectedOption !== null;
          let bg = OPTION_DEFAULT[i]?.bg ?? '#F7FAFC';
          let border = `2px solid ${OPTION_DEFAULT[i]?.border ?? '#CBD5E0'}`;
          let textColor = OPTION_DEFAULT[i]?.text ?? '#2D3748';
          if (showResult && isStrongest) { bg = '#F0FFF4'; border = '2px solid #68D391'; textColor = '#276749'; }
          else if (showResult && isSelected && !isStrongest) { bg = '#FFFBEB'; border = '2px solid #F6AD55'; textColor = '#C05621'; }
          return (
            <button key={i} onClick={() => onSelectOption(i)} style={{
              flex: 1, height: '100%', padding: '10px 12px', borderRadius: 12, border,
              background: bg, cursor: 'pointer',
              fontSize: fs ? 15 : 13, fontWeight: 600, color: textColor,
              lineHeight: 1.5, textAlign: 'center' as const,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease, border 0.15s ease, color 0.15s ease',
            }}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback — maxHeight transition so option cards never move */}
      <div style={{
        maxHeight: selectedOption !== null ? (fs ? 140 : 120) : 0,
        overflow: 'hidden',
        borderRadius: 10,
        padding: selectedOption !== null ? '10px 14px' : '0 14px',
        background: fbBg, border: `1.5px solid ${selectedOption !== null ? fbBorder : 'transparent'}`,
        opacity: selectedOption !== null ? 1 : 0,
        transition: 'opacity 0.25s ease, max-height 0.25s ease, padding 0.2s ease',
        flexShrink: 0,
      }}>
        {fb && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 5, color: fbColor }}>{fbLabel}</div>
            <div style={{ fontSize: fs ? 15 : 13, color: '#4A5568', lineHeight: 1.65 }}>{fb.text}</div>
          </>
        )}
      </div>

    </div>
  );
}

export default ELearningView;
