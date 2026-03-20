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
  loadClip: (text: string, type: 'setup' | 'reveal') => Promise<void>;
  stopAndReset: () => void;
}

/* ── Module-level cache: hash(text) → blobURL ── */
const audioCache = new Map<string, string>();

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return String(hash);
}

/* ── Voice ID resolution ── */
let resolvedVoiceId: string | null = null;
let voiceIdPromise: Promise<string> | null = null;
const FALLBACK_VOICE_ID = 'nPczCjzI2devNBz1zQrb'; // Brian

function getVoiceId(apiKey: string): Promise<string> {
  if (resolvedVoiceId) return Promise.resolve(resolvedVoiceId);
  if (voiceIdPromise) return voiceIdPromise;
  voiceIdPromise = fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  })
    .then((r) => r.json())
    .then((data) => {
      const brian = data.voices?.find((v: any) => v.name === 'Brian');
      resolvedVoiceId = brian?.voice_id || FALLBACK_VOICE_ID;
      return resolvedVoiceId!;
    })
    .catch(() => {
      resolvedVoiceId = FALLBACK_VOICE_ID;
      return resolvedVoiceId;
    });
  return voiceIdPromise;
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

/**
 * Forcefully kill an HTMLAudioElement so it cannot produce sound.
 * After this call the element is inert — no events, no playback.
 */
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
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTextRef = useRef<string | null>(null);
  const currentTypeRef = useRef<'setup' | 'reveal'>('setup');

  // Generation counter: incremented on every load/stop. Any async work
  // that started under a previous generation is stale and must not touch state.
  const genRef = useRef(0);

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;

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
      genRef.current += 1; // invalidate any in-flight loads
      killAudio(audioRef.current);
      audioRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  /* ── Stop everything ── */
  const stopAndReset = useCallback(() => {
    genRef.current += 1; // cancel any in-flight async loads
    stopProgressLoop();
    killAudio(audioRef.current);
    audioRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    setHasAudio(false);
    setProgress(0);
    setDuration(0);
    if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; }
  }, [stopProgressLoop]);

  /* ── Core load logic ── */
  const loadClip = useCallback(async (text: string, type: 'setup' | 'reveal') => {
    if (!apiKey) return;

    // 1. Kill any existing audio immediately — no gap, no delay
    genRef.current += 1;
    const myGen = genRef.current;
    stopProgressLoop();
    killAudio(audioRef.current);
    audioRef.current = null;
    if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; }

    currentTextRef.current = text;
    currentTypeRef.current = type;
    setClipType(type);
    setIsPlaying(false);
    setHasAudio(false);
    setProgress(0);
    setDuration(0);
    setIsLoading(true);

    // Helper: check if this call is still the active one
    const isStale = () => genRef.current !== myGen;

    // 2. Check cache first
    const cacheKey = simpleHash(text);
    let blobUrl = audioCache.get(cacheKey);

    // 3. Fetch from API if not cached
    if (!blobUrl) {
      try {
        const voiceId = await getVoiceId(apiKey);
        if (isStale()) return; // another load started while we waited

        const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true },
          }),
        });
        if (isStale()) return;

        if (!resp.ok) {
          loadingTimerRef.current = setTimeout(() => {
            if (!isStale()) { setIsLoading(false); setHasAudio(false); }
          }, 2000);
          return;
        }

        const blob = await resp.blob();
        if (isStale()) return;

        blobUrl = URL.createObjectURL(blob);
        audioCache.set(cacheKey, blobUrl);
      } catch {
        if (!isStale()) {
          loadingTimerRef.current = setTimeout(() => {
            if (!isStale()) { setIsLoading(false); setHasAudio(false); }
          }, 2000);
        }
        return;
      }
    }

    if (isStale()) return; // one final check before creating the audio element

    // 4. Create audio element and play
    const audio = new Audio(blobUrl);
    audio.playbackRate = readSpeed();
    audio.muted = readMuted();
    audio.volume = readVolume();
    audioRef.current = audio;

    audio.addEventListener('play', () => { if (!isStale()) { setIsPlaying(true); startProgressLoop(); } });
    audio.addEventListener('pause', () => { if (!isStale() && !audio.ended) { setIsPlaying(false); stopProgressLoop(); } });
    audio.addEventListener('ended', () => { if (!isStale()) { setIsPlaying(false); stopProgressLoop(); setProgress(1); } });
    audio.addEventListener('loadedmetadata', () => { if (!isStale() && isFinite(audio.duration)) setDuration(audio.duration); });

    setHasAudio(true);
    setIsLoading(false);
    setProgress(0);

    audio.play().catch(() => { /* autoplay blocked — user can click play */ });
  }, [apiKey, startProgressLoop, stopProgressLoop]);

  /* ── Play (resume or reload) ── */
  const play = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(() => {});
    } else if (currentTextRef.current) {
      loadClip(currentTextRef.current, currentTypeRef.current);
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
