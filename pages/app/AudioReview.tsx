import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AUDIO_INVENTORY, LEVEL_GROUPS, LEVEL_LABELS, type AudioClip, type LevelGroup } from '../../data/audioInventory';
import transcriptionsData from '../../data/audioTranscriptions.json';
import flagsData from '../../data/audioFlags.json';

const TRANSCRIPTIONS: Record<string, string> = transcriptionsData as Record<string, string>;
const AI_FLAGS: { filename: string; issue: string; word: string; severity: 'high' | 'medium' }[] = flagsData as any;

/* ─── Types ─── */
type ReviewStatus = 'not-reviewed' | 'ok' | 'mispronunciation' | 're-record';

interface ClipReview {
  status: ReviewStatus;
  notes: string;
}

type ReviewState = Record<string, ClipReview>;

/* ─── Constants ─── */
const LS_KEY = 'oxygy_audio_review';

const STATUS_OPTIONS: { value: ReviewStatus; label: string; color: string; bg: string }[] = [
  { value: 'not-reviewed', label: 'Not reviewed', color: '#A0AEC0', bg: '#EDF2F7' },
  { value: 'ok', label: 'OK', color: '#48BB78', bg: '#F0FFF4' },
  { value: 'mispronunciation', label: 'Mispronunciation', color: '#ED8936', bg: '#FFFAF0' },
  { value: 're-record', label: 'Re-record', color: '#E53E3E', bg: '#FFF5F5' },
];

const SPEED_MIN = 0.5;
const SPEED_MAX = 3;
const SPEED_STEP = 0.25;

function getStatusMeta(s: ReviewStatus) {
  return STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0];
}

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s2 = Math.floor(sec % 60);
  return `${m}:${s2.toString().padStart(2, '0')}`;
}

function clipTypeBadge(clip: AudioClip): { label: string; color: string; bg: string } {
  if (clip.clipType === 'tour') return { label: 'Tour', color: '#718096', bg: '#EDF2F7' };
  if (clip.clipType === 'setup') return { label: 'Setup', color: '#2C7A7B', bg: '#E6FFFA' };
  // reveal, reveal1, reveal2, etc.
  const num = clip.clipType.replace('reveal', '');
  const label = num ? `Reveal ${num}` : 'Reveal';
  return { label, color: '#C05621', bg: '#FFFAF0' };
}

/* ─── Persistence ─── */
function loadReviews(): ReviewState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveReviews(state: ReviewState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* ─── Inline Audio Player Row ─── */
const ClipPlayer: React.FC<{
  clip: AudioClip;
  isActive: boolean;
  onPlay: (clip: AudioClip) => void;
  speed: number;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}> = ({ clip, isActive, onPlay, speed, audioRef }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const rafRef = useRef(0);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync with external audioRef when this clip is active
  useEffect(() => {
    if (!isActive) {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    localAudioRef.current = audio;

    const onMeta = () => setDuration(audio.duration);
    const onEnded = () => { setPlaying(false); setProgress(1); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    if (audio.duration) setDuration(audio.duration);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, audioRef]);

  // RAF progress loop
  useEffect(() => {
    if (!playing || !isActive) { cancelAnimationFrame(rafRef.current); return; }
    const tick = () => {
      const a = localAudioRef.current;
      if (a && a.duration) {
        setProgress(a.currentTime / a.duration);
        setCurrentTime(a.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, isActive]);

  // Apply speed changes
  useEffect(() => {
    if (isActive && localAudioRef.current) {
      localAudioRef.current.playbackRate = speed;
    }
  }, [speed, isActive]);

  const handleToggle = () => {
    if (!isActive) {
      onPlay(clip);
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !localAudioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    localAudioRef.current.currentTime = pct * localAudioRef.current.duration;
    setProgress(pct);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
      <button
        onClick={handleToggle}
        style={{
          width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: isActive && playing ? '#38B2AC' : '#1A202C', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: 12,
        }}
      >
        {isActive && playing ? '❚❚' : '▶'}
      </button>
      <div
        onClick={handleSeek}
        style={{
          flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, cursor: 'pointer',
          position: 'relative', minWidth: 80,
        }}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3,
          background: '#38B2AC', width: `${progress * 100}%`, transition: 'width 0.1s linear',
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#718096', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
        {isActive ? `${fmtTime(currentTime)} / ${fmtTime(duration)}` : duration ? fmtTime(duration) : '–:––'}
      </span>
    </div>
  );
};

/* ─── Main Component ─── */
const AudioReview: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewState>(loadReviews);
  const [levelFilter, setLevelFilter] = useState<LevelGroup | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'All'>('All');
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Persist reviews
  useEffect(() => { saveReviews(reviews); }, [reviews]);

  // Load durations for all clips on mount
  useEffect(() => {
    const loaded: Record<string, number> = {};
    let mounted = true;
    AUDIO_INVENTORY.forEach(clip => {
      const a = new Audio(clip.path);
      a.addEventListener('loadedmetadata', () => {
        if (!mounted) return;
        loaded[clip.filename] = a.duration;
        if (Object.keys(loaded).length === AUDIO_INVENTORY.length) {
          setDurations({ ...loaded });
        }
      });
      // Also handle errors gracefully
      a.addEventListener('error', () => {
        if (!mounted) return;
        loaded[clip.filename] = 0;
        if (Object.keys(loaded).length === AUDIO_INVENTORY.length) {
          setDurations({ ...loaded });
        }
      });
    });
    // Set a timeout fallback to show whatever we have after 5s
    const t = setTimeout(() => { if (mounted) setDurations({ ...loaded }); }, 5000);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  const getReview = (filename: string): ClipReview =>
    reviews[filename] ?? { status: 'not-reviewed', notes: '' };

  const setClipStatus = useCallback((filename: string, status: ReviewStatus) => {
    setReviews(prev => ({ ...prev, [filename]: { ...prev[filename] ?? { status: 'not-reviewed', notes: '' }, status } }));
  }, []);

  const setClipNotes = useCallback((filename: string, notes: string) => {
    setReviews(prev => ({ ...prev, [filename]: { ...prev[filename] ?? { status: 'not-reviewed', notes: '' }, notes } }));
  }, []);

  // Filtered clips
  const filteredClips = useMemo(() => {
    return AUDIO_INVENTORY.filter(c => {
      if (levelFilter !== 'All' && c.level !== levelFilter) return false;
      if (statusFilter !== 'All' && getReview(c.filename).status !== statusFilter) return false;
      return true;
    });
  }, [levelFilter, statusFilter, reviews]);

  // Stats
  const stats = useMemo(() => {
    const total = AUDIO_INVENTORY.length;
    let reviewed = 0, ok = 0, mispro = 0, rerecord = 0;
    AUDIO_INVENTORY.forEach(c => {
      const s = getReview(c.filename).status;
      if (s !== 'not-reviewed') reviewed++;
      if (s === 'ok') ok++;
      if (s === 'mispronunciation') mispro++;
      if (s === 're-record') rerecord++;
    });
    return { total, reviewed, ok, mispro, rerecord };
  }, [reviews]);

  // Level counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { All: AUDIO_INVENTORY.length };
    LEVEL_GROUPS.forEach(g => { counts[g] = AUDIO_INVENTORY.filter(c => c.level === g).length; });
    return counts;
  }, []);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: AUDIO_INVENTORY.length };
    STATUS_OPTIONS.forEach(o => {
      counts[o.value] = AUDIO_INVENTORY.filter(c => getReview(c.filename).status === o.value).length;
    });
    return counts;
  }, [reviews]);

  // Play a clip
  const playClip = useCallback((clip: AudioClip) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    const a = new Audio(clip.path);
    a.playbackRate = speed;
    audioRef.current = a;
    setActiveClip(clip.filename);
    a.play();
  }, [speed]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!activeClip) {
          if (filteredClips.length) playClip(filteredClips[0]);
          return;
        }
        const a = audioRef.current;
        if (a) { a.paused ? a.play() : a.pause(); }
      }
      if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        e.preventDefault();
        const idx = activeClip ? filteredClips.findIndex(c => c.filename === activeClip) : -1;
        const next = e.code === 'ArrowDown' ? idx + 1 : idx - 1;
        if (next >= 0 && next < filteredClips.length) {
          playClip(filteredClips[next]);
          rowRefs.current[filteredClips[next].filename]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeClip, filteredClips, playClip]);

  // Export
  const handleExport = () => {
    const flagged = AUDIO_INVENTORY
      .filter(c => { const s = getReview(c.filename).status; return s === 'mispronunciation' || s === 're-record'; })
      .map(c => ({ filename: c.filename, level: c.level, slide: c.slide, section: c.section, heading: c.heading, ...getReview(c.filename) }));
    const blob = new Blob([JSON.stringify(flagged, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audio-review-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk actions
  const markAllOk = () => {
    if (!window.confirm('Mark all unreviewed clips as OK?')) return;
    setReviews(prev => {
      const next = { ...prev };
      AUDIO_INVENTORY.forEach(c => {
        if (!next[c.filename] || next[c.filename].status === 'not-reviewed') {
          next[c.filename] = { status: 'ok', notes: next[c.filename]?.notes ?? '' };
        }
      });
      return next;
    });
  };

  const markLevelOk = (level: LevelGroup) => {
    if (!window.confirm(`Mark all unreviewed clips in ${level} as OK?`)) return;
    setReviews(prev => {
      const next = { ...prev };
      AUDIO_INVENTORY.filter(c => c.level === level).forEach(c => {
        if (!next[c.filename] || next[c.filename].status === 'not-reviewed') {
          next[c.filename] = { status: 'ok', notes: next[c.filename]?.notes ?? '' };
        }
      });
      return next;
    });
  };

  const clearAll = () => {
    if (!window.confirm('Clear all review data? This cannot be undone.')) return;
    setReviews({});
  };

  // AI flags lookup
  const flagsByFile = useMemo(() => {
    const map: Record<string, typeof AI_FLAGS> = {};
    AI_FLAGS.forEach(f => {
      if (!map[f.filename]) map[f.filename] = [];
      map[f.filename].push(f);
    });
    return map;
  }, []);

  // Load AI flags into review state
  const loadAiFlags = () => {
    setReviews(prev => {
      const next = { ...prev };
      // Mark flagged clips as mispronunciation with AI notes
      AI_FLAGS.forEach(flag => {
        const existing = next[flag.filename];
        const note = `[AI] ${flag.issue}: "${flag.word}" (${flag.severity})`;
        if (!existing || existing.status === 'not-reviewed') {
          next[flag.filename] = { status: 'mispronunciation', notes: note };
        } else if (!existing.notes.includes(flag.word)) {
          next[flag.filename] = { ...existing, notes: existing.notes ? `${existing.notes}\n${note}` : note };
        }
      });
      // Mark all unflagged clips as OK
      AUDIO_INVENTORY.forEach(c => {
        if (!next[c.filename] || next[c.filename].status === 'not-reviewed') {
          next[c.filename] = { status: 'ok', notes: next[c.filename]?.notes ?? '' };
        }
      });
      return next;
    });
  };

  // Expanded transcription rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleTranscript = (filename: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(filename) ? next.delete(filename) : next.add(filename);
      return next;
    });
  };
  const expandAll = () => setExpandedRows(new Set(AUDIO_INVENTORY.map(c => c.filename)));
  const collapseAll = () => setExpandedRows(new Set());

  const pill = (label: string, count: number, active: boolean, onClick: () => void, color?: string) => (
    <button key={label} onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 16, border: active ? `2px solid ${color ?? '#38B2AC'}` : '1px solid #E2E8F0',
      background: active ? (color ? `${color}18` : '#E6FFFA') : '#fff', cursor: 'pointer',
      fontSize: 12, fontWeight: active ? 600 : 400, color: active ? (color ?? '#2C7A7B') : '#4A5568',
      fontFamily: "'DM Sans', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {label} <span style={{ fontSize: 10, color: '#A0AEC0' }}>({count})</span>
    </button>
  );

  return (
    <div style={{ padding: '28px 36px', fontFamily: "'DM Sans', sans-serif", color: '#1A202C' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Audio Review</h1>
          <p style={{ fontSize: 13, color: '#718096', margin: '4px 0 0' }}>
            Listen, flag mispronunciations, track re-records. {stats.total} clips total.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAiFlags} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid #805AD5', background: '#FAF5FF',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#805AD5', fontFamily: "'DM Sans', sans-serif",
          }}>Load AI Flags ({AI_FLAGS.length})</button>
          <button onClick={handleExport} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#4A5568', fontFamily: "'DM Sans', sans-serif",
          }}>Export Flagged</button>
          <button onClick={markAllOk} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#48BB78', fontFamily: "'DM Sans', sans-serif",
          }}>Mark All OK</button>
          <button onClick={clearAll} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#E53E3E', fontFamily: "'DM Sans', sans-serif",
          }}>Clear All</button>
        </div>
      </div>

      {/* Progress Summary Bar */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 20px',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <div style={{ flex: 1, display: 'flex', gap: 20, alignItems: 'center', fontSize: 13 }}>
          <span><b>{stats.reviewed}</b> / {stats.total} reviewed</span>
          <span style={{ color: '#48BB78' }}>OK: <b>{stats.ok}</b></span>
          <span style={{ color: '#ED8936' }}>Mispron: <b>{stats.mispro}</b></span>
          <span style={{ color: '#E53E3E' }}>Re-record: <b>{stats.rerecord}</b></span>
        </div>
        <div style={{ width: 200, height: 8, background: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, background: stats.reviewed === stats.total ? '#48BB78' : '#38B2AC',
            width: `${(stats.reviewed / stats.total) * 100}%`, transition: 'width 0.3s',
          }} />
        </div>
        <span style={{ fontSize: 12, color: '#718096', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round((stats.reviewed / stats.total) * 100)}%
        </span>
      </div>

      {/* Level Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {pill('All', levelCounts.All, levelFilter === 'All', () => setLevelFilter('All'))}
        {LEVEL_GROUPS.map(g => pill(g, levelCounts[g], levelFilter === g, () => setLevelFilter(g)))}
      </div>

      {/* Status Filter + Speed */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {pill('All', statusCounts.All, statusFilter === 'All', () => setStatusFilter('All'))}
        {STATUS_OPTIONS.map(o =>
          pill(o.label, statusCounts[o.value], statusFilter === o.value, () => setStatusFilter(o.value as ReviewStatus | 'All'), o.color)
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#A0AEC0', whiteSpace: 'nowrap' }}>Speed:</span>
          <input
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={SPEED_STEP}
            value={speed}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setSpeed(v);
              if (audioRef.current) audioRef.current.playbackRate = v;
            }}
            style={{ width: 120, accentColor: '#38B2AC', cursor: 'pointer' }}
          />
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#1A202C', fontVariantNumeric: 'tabular-nums',
            minWidth: 36, textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
          }}>
            {speed % 1 === 0 ? `${speed}x` : `${speed.toFixed(2).replace(/0$/, '')}x`}
          </span>
        </div>
      </div>

      {/* Per-level bulk action */}
      {levelFilter !== 'All' && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => markLevelOk(levelFilter as LevelGroup)} style={{
            padding: '5px 12px', borderRadius: 6, border: '1px solid #C6F6D5', background: '#F0FFF4',
            fontSize: 11, cursor: 'pointer', color: '#276749', fontFamily: "'DM Sans', sans-serif",
          }}>
            Mark remaining in {levelFilter} as OK
          </button>
        </div>
      )}

      {/* Keyboard hints + transcript toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#A0AEC0' }}>
          Keyboard: Space = play/pause, Arrow Down = next, Arrow Up = prev
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={expandAll} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#4A5568', fontFamily: "'DM Sans', sans-serif" }}>
            Show All Transcripts
          </button>
          <button onClick={collapseAll} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#4A5568', fontFamily: "'DM Sans', sans-serif" }}>
            Hide All Transcripts
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: 100 }}>Slide</th>
              <th style={{ padding: '8px 10px', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: 80 }}>Type</th>
              <th style={{ padding: '8px 10px', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Context</th>
              <th style={{ padding: '8px 10px', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: 240 }}>Player</th>
              <th style={{ padding: '8px 10px', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: 140 }}>Status</th>
              <th style={{ padding: '8px 10px', fontWeight: 600, color: '#718096', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: 200 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredClips.map(clip => {
              const review = getReview(clip.filename);
              const badge = clipTypeBadge(clip);
              const isActive = activeClip === clip.filename;
              const aiFlags = flagsByFile[clip.filename];
              const hasAiFlag = !!aiFlags?.length;
              const transcript = TRANSCRIPTIONS[clip.filename];
              const isExpanded = expandedRows.has(clip.filename);

              // Highlight flagged words in transcript
              const highlightTranscript = (text: string) => {
                if (!aiFlags?.length) return text;
                let result = text;
                const words = aiFlags.map(f => f.word);
                // Simple highlight: wrap matched words in styled spans
                words.forEach(word => {
                  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(${escaped})`, 'gi');
                  result = result.replace(regex, `|||$1|||`);
                });
                return result;
              };

              return (
                <React.Fragment key={clip.filename}>
                  <tr
                    ref={el => { rowRefs.current[clip.filename] = el; }}
                    style={{
                      borderBottom: isExpanded ? 'none' : '1px solid #EDF2F7',
                      borderLeft: isActive ? '3px solid #38B2AC' : hasAiFlag ? '3px solid #ED8936' : '3px solid transparent',
                      background: isActive ? '#F0FFFF' : hasAiFlag ? '#FFFCF5' : undefined,
                    }}
                  >
                    {/* Slide */}
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{clip.level}</span>
                      <span style={{ color: '#A0AEC0' }}> · </span>
                      <span style={{ color: '#4A5568' }}>{clip.level === 'Tour' ? (clip.slide === 0 ? 'Welcome' : `Step ${clip.slide}`) : `Slide ${clip.slide}`}</span>
                      {hasAiFlag && <span title={aiFlags.map(f => `${f.issue}: "${f.word}"`).join(', ')} style={{ marginLeft: 4, fontSize: 10 }}>&#9888;</span>}
                    </td>
                    {/* Type badge */}
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        fontSize: 11, fontWeight: 600, color: badge.color, background: badge.bg,
                      }}>{badge.label}</span>
                    </td>
                    {/* Context */}
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ fontSize: 10, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3 }}>{clip.section}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 12, color: '#2D3748', lineHeight: 1.3, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.heading}</div>
                        {transcript && (
                          <button onClick={() => toggleTranscript(clip.filename)} style={{
                            border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, color: '#A0AEC0',
                            padding: '0 2px', flexShrink: 0,
                          }} title="Toggle transcript">
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Player */}
                    <td style={{ padding: '6px 10px' }}>
                      <ClipPlayer clip={clip} isActive={isActive} onPlay={playClip} speed={speed} audioRef={audioRef} />
                    </td>
                    {/* Status */}
                    <td style={{ padding: '6px 10px' }}>
                      <select
                        value={review.status}
                        onChange={e => setClipStatus(clip.filename, e.target.value as ReviewStatus)}
                        style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                          border: `1px solid ${getStatusMeta(review.status).color}40`,
                          background: getStatusMeta(review.status).bg,
                          color: getStatusMeta(review.status).color,
                          fontWeight: 600, cursor: 'pointer', width: '100%',
                        }}
                      >
                        {STATUS_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    {/* Notes */}
                    <td style={{ padding: '6px 10px' }}>
                      <textarea
                        value={review.notes}
                        onChange={e => setClipNotes(clip.filename, e.target.value)}
                        placeholder="e.g. 'RCTF' at 0:12"
                        rows={1}
                        style={{
                          width: '100%', resize: 'vertical', padding: '4px 8px', borderRadius: 6,
                          border: '1px solid #E2E8F0', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                          color: '#4A5568', background: '#FAFAFA', minHeight: 26,
                        }}
                      />
                    </td>
                  </tr>
                  {/* Expandable transcript row */}
                  {isExpanded && transcript && (
                    <tr style={{
                      borderBottom: '1px solid #EDF2F7',
                      borderLeft: isActive ? '3px solid #38B2AC' : hasAiFlag ? '3px solid #ED8936' : '3px solid transparent',
                      background: '#FAFAFA',
                    }}>
                      <td colSpan={6} style={{ padding: '4px 10px 8px 30px' }}>
                        <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.6, maxWidth: 900 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transcript: </span>
                          {hasAiFlag ? (
                            highlightTranscript(transcript).split('|||').map((part, i) => {
                              const isHighlighted = i % 2 === 1;
                              return isHighlighted ? (
                                <span key={i} style={{ background: '#FED7AA', color: '#C05621', fontWeight: 700, padding: '0 2px', borderRadius: 2 }}>{part}</span>
                              ) : (
                                <span key={i}>{part}</span>
                              );
                            })
                          ) : transcript}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredClips.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#A0AEC0' }}>
                  No clips match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AudioReview;
