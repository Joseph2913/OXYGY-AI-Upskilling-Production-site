import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Types ── */
type Speed = 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface VoiceoverState {
  isLoading: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  speed: Speed;
  volume: number;
  hasAudio: boolean;
  clipType: 'setup' | 'reveal';
  progress: number;
  duration: number;
}

export interface UseVoiceoverReturn extends VoiceoverState {
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  setSpeed: (speed: Speed) => void;
  setVolume: (vol: number) => void;
  loadClip: (src: string, type: 'setup' | 'reveal') => Promise<void>;
  stopAndReset: () => void;
}

/* ── localStorage helpers ── */
function readMuted(): boolean {
  try { return localStorage.getItem('oxygy_vo_muted') === 'true'; } catch { return false; }
}
function readSpeed(): Speed {
  try {
    const v = parseFloat(localStorage.getItem('oxygy_vo_speed') || '1');
    if ([0.75, 1, 1.25, 1.5, 1.75, 2].includes(v)) return v as Speed;
  } catch { /* ignore */ }
  return 1;
}
function readVolume(): number {
  try {
    const v = parseFloat(localStorage.getItem('oxygy_vo_volume') || '0.8');
    if (v >= 0 && v <= 1) return v;
  } catch { /* ignore */ }
  return 0.8;
}

/** Forcefully kill an HTMLAudioElement so it cannot produce sound. */
function killAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  try { audio.pause(); } catch { /* ignore */ }
  try { audio.removeAttribute('src'); audio.load(); } catch { /* ignore */ }
}

/* ── Hook ── */
export function useVoiceover(): UseVoiceoverReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(readMuted);
  const [speed, setSpeedState] = useState<Speed>(readSpeed);
  const [volume, setVolumeState] = useState(readVolume);
  const [hasAudio, setHasAudio] = useState(false);
  const [clipType, setClipType] = useState<'setup' | 'reveal'>('setup');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentSrcRef = useRef<string | null>(null);
  const currentTypeRef = useRef<'setup' | 'reveal'>('setup');
  const genRef = useRef(0);

  /* ── Progress animation ── */
  const startProgressLoop = useCallback(() => {
    const tick = () => {
      const a = audioRef.current;
      if (a && a.duration && isFinite(a.duration)) {
        setProgress(a.currentTime / a.duration);
        setDuration(a.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      genRef.current += 1;
      killAudio(audioRef.current);
      audioRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Stop everything ── */
  const stopAndReset = useCallback(() => {
    genRef.current += 1;
    stopProgressLoop();
    killAudio(audioRef.current);
    audioRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    setHasAudio(false);
    setProgress(0);
    setDuration(0);
  }, [stopProgressLoop]);

  /* ── Load a static audio file ── */
  const loadClip = useCallback(async (src: string, type: 'setup' | 'reveal') => {
    // Kill any existing audio immediately
    genRef.current += 1;
    const myGen = genRef.current;
    stopProgressLoop();
    killAudio(audioRef.current);
    audioRef.current = null;

    currentSrcRef.current = src;
    currentTypeRef.current = type;
    setClipType(type);
    setIsPlaying(false);
    setHasAudio(false);
    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    const isStale = () => genRef.current !== myGen;

    // Create audio element pointing to the static file
    const audio = new Audio(src);
    audio.playbackRate = readSpeed();
    audio.muted = readMuted();
    audio.volume = readVolume();
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('canplaythrough', () => {
      if (isStale()) return;
      setHasAudio(true);
      setIsLoading(false);
      if (isFinite(audio.duration)) setDuration(audio.duration);
      audio.play().catch(() => { /* autoplay blocked — user can click play */ });
    }, { once: true });

    audio.addEventListener('play', () => { if (!isStale()) { setIsPlaying(true); startProgressLoop(); } });
    audio.addEventListener('pause', () => { if (!isStale() && !audio.ended) { setIsPlaying(false); stopProgressLoop(); } });
    audio.addEventListener('ended', () => { if (!isStale()) { setIsPlaying(false); stopProgressLoop(); setProgress(1); } });
    audio.addEventListener('loadedmetadata', () => { if (!isStale() && isFinite(audio.duration)) setDuration(audio.duration); });
    audio.addEventListener('error', () => {
      if (!isStale()) { setIsLoading(false); setHasAudio(false); }
    });

    // Kick off loading
    audio.load();
  }, [startProgressLoop, stopProgressLoop]);

  /* ── Play (resume or reload) ── */
  const play = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(() => {});
    } else if (currentSrcRef.current) {
      loadClip(currentSrcRef.current, currentTypeRef.current);
    }
  }, [loadClip]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      try { localStorage.setItem('oxygy_vo_muted', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const setSpeed = useCallback((s: Speed) => {
    setSpeedState(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
    try { localStorage.setItem('oxygy_vo_speed', String(s)); } catch { /* ignore */ }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    try { localStorage.setItem('oxygy_vo_volume', String(clamped)); } catch { /* ignore */ }
    if (clamped > 0 && readMuted()) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
      try { localStorage.setItem('oxygy_vo_muted', 'false'); } catch { /* ignore */ }
    }
  }, []);

  return {
    isLoading, isPlaying, isMuted, speed, volume, hasAudio, clipType, progress, duration,
    play, pause, toggleMute, setSpeed, setVolume, loadClip, stopAndReset,
  };
}
