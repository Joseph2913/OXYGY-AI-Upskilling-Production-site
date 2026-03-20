# SKILL: Voiceover Narration — Oxygy E-Learning Courses

## When to apply this skill

Apply this skill whenever the user asks you to:
- Add voiceover narration to a new or existing e-learning course
- Generate audio clips for a set of e-learning slides
- Set up the narration player for a new level/topic
- Update or re-record voiceover scripts for existing slides

This skill covers the **complete end-to-end workflow**: writing narration scripts, generating static audio files, embedding them in slide data, and wiring them to the audio player UI.

---

## 1. Architecture Overview

Voiceover narration uses **pre-generated static MP3 files** served from `public/audio/`. There are **zero runtime API calls** — all audio is generated once at build time and loaded as static assets via Firebase Hosting.

```
Slide data (topicContent.ts)
  └── voiceover.setup: "/audio/l2t1-s01-setup.mp3"
  └── voiceover.reveal: "/audio/l2t1-s01-reveal.mp3"  (persona slides only)
        │
        ▼
useVoiceover hook (hooks/useVoiceover.ts)
  └── new Audio(src) → HTMLAudioElement
        │
        ▼
AudioBar component (inside ELearningView.tsx)
  └── Play/Pause, Speed, Volume, Mute, Progress bar
```

### Why static files (not runtime TTS)

- **Cost**: Runtime TTS (ElevenLabs, etc.) charges per character per user per session. For identical content, this is pure waste.
- **Speed**: Static files load instantly from CDN. No API latency.
- **Reliability**: No dependency on third-party API uptime, rate limits, or quota.
- **Consistency**: Every user hears the exact same narration.

Runtime TTS should only be considered for **dynamic/personalised content** where the text changes per user.

---

## 2. Audio Generation

### 2.1 Platform: edge-tts (Microsoft Edge Neural TTS)

**Package**: `edge-tts` (PyPI) — [github.com/rany2/edge-tts](https://github.com/rany2/edge-tts)

**Why edge-tts**:
- Free, no API key required, no per-character charges
- Uses Microsoft Azure Neural voices — near-commercial quality
- 300+ voices across 100+ languages
- Trivial installation: `pip install edge-tts`
- Fast generation: all clips for a 16-slide course in under 2 minutes

**Licensing note**: Microsoft's ToS technically reserve commercial use for Azure Speech Services (paid). For internal training content served from your own platform, the risk is minimal. If licensing becomes a concern, **Piper TTS** (MIT-licensed, fully offline) is the recommended fallback.

### 2.2 Voice Selection

| Voice ID | Name | Description | Use Case |
|----------|------|-------------|----------|
| `en-GB-RyanNeural` | Ryan | British male, warm and professional | **Current default** — used for L1 |
| `en-GB-SoniaNeural` | Sonia | British female, friendly and clear | Alternative narrator |
| `en-US-GuyNeural` | Guy | American male, warm | American English courses |
| `en-US-AriaNeural` | Aria | American female, versatile | American English courses |

**Voice consistency rule**: Use the **same voice for all slides within a single course/topic**. Switching voices mid-course is disorienting. Different topics or levels may use different voices if desired.

### 2.3 Generation Command

```bash
# Install (one-time)
pip install edge-tts

# Generate a single clip
edge-tts --text "Your narration script here" \
  --voice en-GB-RyanNeural \
  --write-media public/audio/l1t1-s01-setup.mp3
```

### 2.4 File Naming Convention

```
public/audio/{level}t{topic}-s{slide}-{type}.mp3
```

| Segment | Description | Examples |
|---------|-------------|----------|
| `{level}` | Level number | `l1`, `l2`, `l3` |
| `{topic}` | Topic number within level | `t1`, `t2` |
| `{slide}` | Slide number, zero-padded to 2 digits | `s01`, `s02`, `s16` |
| `{type}` | Clip type | `setup` (plays on slide load), `reveal` (plays after prediction) |

**Examples**:
- `l1t1-s01-setup.mp3` — Level 1, Topic 1, Slide 1, setup clip
- `l2t1-s10-reveal.mp3` — Level 2, Topic 1, Slide 10, reveal clip

### 2.5 Batch Generation Script

For a full course, generate all clips in parallel batches of 5:

```bash
EDGE=edge-tts  # or full path if not on PATH
OUT=public/audio
VOICE="en-GB-RyanNeural"

# Batch — run up to 5 in parallel
$EDGE --voice $VOICE --write-media "$OUT/l1t1-s01-setup.mp3" --text "Script for slide 1..." &
$EDGE --voice $VOICE --write-media "$OUT/l1t1-s02-setup.mp3" --text "Script for slide 2..." &
$EDGE --voice $VOICE --write-media "$OUT/l1t1-s03-setup.mp3" --text "Script for slide 3..." &
$EDGE --voice $VOICE --write-media "$OUT/l1t1-s04-setup.mp3" --text "Script for slide 4..." &
$EDGE --voice $VOICE --write-media "$OUT/l1t1-s05-setup.mp3" --text "Script for slide 5..." &
wait
echo "Batch done"
```

After generation, verify all files exist and are >10KB (files under 1KB indicate an error):

```bash
ls -lh public/audio/l1t1-*.mp3
```

---

## 3. Slide Data Integration

### 3.1 SlideData Interface

The `voiceover` field on `SlideData` in `data/topicContent.ts`:

```typescript
voiceover?: {
  setup: string;    // Path to audio file, e.g. "/audio/l1t1-s01-setup.mp3"
  reveal?: string;  // Only on predictFirst persona slides
};
```

### 3.2 Clip Types

| Type | When it plays | Which slides |
|------|--------------|--------------|
| `setup` | Automatically on slide load | **Every slide** that has narration |
| `reveal` | After learner submits correct prediction | Only `predictFirst: true` persona slides |

### 3.3 Adding voiceover to slides

Add the `voiceover` property to each slide object. Do not modify any other existing properties.

```typescript
/* ── Slide 1 — Course Intro ── */
{ section: "PROMPT ENGINEERING", type: "courseIntro",
  heading: "Prompt Engineering Essentials",
  // ... existing fields unchanged ...
  voiceover: {
    setup: "/audio/l1t1-s01-setup.mp3",
  },
},

/* ── Persona slide with prediction ── */
{ section: "THE APPROACHES", type: "persona",
  predictFirst: true,
  // ... existing fields unchanged ...
  voiceover: {
    setup: "/audio/l1t1-s10-setup.mp3",
    reveal: "/audio/l1t1-s10-reveal.mp3",
  },
},
```

---

## 4. Narration Script Writing Guidelines

### 4.1 Tone and Style

- **Conversational, not academic** — speak as a knowledgeable colleague, not a textbook
- **Direct address** — use "you" and "your", not "the learner" or "one"
- **Present tense** — "You'll see six chips on the left" not "You would see..."
- **Complement, don't duplicate** — narration adds context the visual can't; it does not read the slide text aloud
- **Bridge slides** — end each clip with a forward pointer: "And that's what the next slide is about" or "Let's see this in action"

### 4.2 Clip Length

- Target **15–45 seconds** per setup clip (~40–120 words)
- Reveal clips can be shorter: **10–30 seconds** (~25–80 words)
- Avoid clips over 60 seconds — split into shorter segments or simplify

### 4.3 Slide-Type-Specific Guidance

| Slide Type | Narration Approach |
|-----------|-------------------|
| `courseIntro` | Welcome, set expectations, preview structure, state duration |
| `evidenceHero` / `chart` | Contextualise the statistic, explain why it matters |
| `scenarioComparison` | Set up the scenario, instruct the learner what to do ("Toggle between...") |
| `contextBar` | Explain what's about to happen, prime them to notice which components they use |
| `buildAPrompt` | Explain the task, instruct the drag interaction |
| `spotTheFlaw` | Set the challenge, prompt critical thinking ("Ask yourself...") |
| `approachIntro` | Transition from previous section, preview what's coming |
| `persona` (setup) | Introduce the character, describe their situation, ask for prediction |
| `persona` (reveal) | Explain the correct approach, connect back to the framework |
| `situationMatrix` | Explain the decision framework, instruct interaction |
| `moduleSummary` | Recap key takeaways, point to next action (Prompt Playground, etc.) |

### 4.4 Persona Slide Two-Clip Pattern

Persona slides with `predictFirst: true` require **two clips**:

1. **Setup clip** — plays on slide load. Introduces the persona, describes their situation, asks the learner to predict which approach fits. Ends with "Make your prediction" or similar.

2. **Reveal clip** — plays after the learner selects the correct answer. Explains why that approach fits, connects to the broader framework. Does NOT repeat the persona introduction.

---

## 5. Audio Player UI (AudioBar)

### 5.1 Component Location

`AudioBar` is defined as a local component inside `components/app/level/ELearningView.tsx`. It is **not** a separate file.

### 5.2 Placement

The AudioBar renders in **both inline and fullscreen modes**, positioned immediately below the progress bar and above the slide content area.

```
┌─ Progress bar (2px) ─────────────────────────────────┐
├─ AudioBar ────────────────────────────────────────────┤
│  ▶  ||||| NARRATION          ─────────  1× ▾   🔊   │
├─ Progress line (3px teal fill) ───────────────────────┤
├─ Slide content ───────────────────────────────────────┤
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 5.3 Controls

| Control | Behaviour | Persistence |
|---------|-----------|-------------|
| **Play/Pause** | 28px circle, navy bg, white icon. Toggles playback. Shows CSS spinner while loading. | — |
| **Waveform** | 5 animated teal bars. Bounce when playing, static when idle, pulse when loading. | — |
| **Label** | "NARRATION" — always visible, uppercase, 11px, gray | — |
| **Speed** | Dropdown toggle showing current speed (e.g. "1×"). Click opens popover with options: 0.75×, 1×, 1.25×, 1.5×, 1.75×, 2×. Selection closes popover. | `localStorage: oxygy_vo_speed` |
| **Volume** | Speaker icon. First click opens vertical slider popover (drag to adjust 0–100%). Click again while open toggles mute. | `localStorage: oxygy_vo_volume` |
| **Mute** | Available inside volume popover and via speaker icon double-click. | `localStorage: oxygy_vo_muted` |
| **Progress line** | 3px bar below controls. Teal fill advances smoothly via requestAnimationFrame. Resets on slide change. | — |

### 5.4 Inline vs Fullscreen Dimensions

| Property | Inline | Fullscreen |
|----------|--------|------------|
| Bar height | 36px | 40px |
| Horizontal padding | 16px | 28px |

### 5.5 Visual Spec

- **Bar background**: `#F7FAFC`
- **Bar border**: `borderBottom: 1px solid #E2E8F0`
- **Play button**: `background: #1A202C`, hover `#2D3748`
- **Waveform bars**: `background: #38B2AC`, `width: 2px`, animated heights 4–14px
- **Speed active pill**: `background: #1A202C`, `color: #FFFFFF`
- **Progress fill**: `background: #38B2AC`
- **Popover**: white bg, `border: 1px solid #E2E8F0`, `borderRadius: 10px`, `boxShadow: 0 4px 16px rgba(0,0,0,0.12)`, opens **downward** (not upward — upward gets clipped by container overflow)

### 5.6 CSS Animations

Added to the existing `<style>` tag in ELearningView.tsx:

```css
@keyframes voWave {
  0%, 100% { height: 4px; }
  50% { height: 14px; }
}
@keyframes voSpin {
  to { transform: rotate(360deg); }
}
```

Waveform bar stagger delays: `0s, 0.1s, 0.2s, 0.1s, 0s` (symmetric).

---

## 6. useVoiceover Hook

### 6.1 Location

`hooks/useVoiceover.ts`

### 6.2 Interface

```typescript
interface UseVoiceoverReturn {
  // State
  isLoading: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  speed: 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
  volume: number;       // 0–1
  hasAudio: boolean;
  clipType: 'setup' | 'reveal';
  progress: number;     // 0–1
  duration: number;     // seconds

  // Actions
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  setSpeed: (speed: Speed) => void;
  setVolume: (vol: number) => void;
  loadClip: (src: string, type: 'setup' | 'reveal') => Promise<void>;
  stopAndReset: () => void;
}
```

### 6.3 Key Behaviours

- **Module-level settings** (`_speed`, `_volume`, `_muted`): Speed, volume, and mute are stored as module-level variables (not React state or refs). This guarantees that when a new `Audio` element is created on slide change, it always reads the exact value the user last set — no stale closures, no React batching delays, no localStorage timing issues. React state mirrors these for UI rendering, but the module variables are the single source of truth for audio element configuration.
- **Aggressive speed enforcement**: Some browsers reset `playbackRate` when `play()` is called or when audio metadata loads. The hook applies speed at 5 points: (1) on `Audio` creation, (2) on `canplaythrough`, (3) after `play()` resolves, (4) on the `play` event, and (5) via a `timeupdate` listener for the first ~10 updates. This guarantees the user's chosen speed sticks across every slide transition.
- **Generation counter** (`genRef`): Incremented on every `loadClip` and `stopAndReset` call. All event listeners check `isStale()` before updating state. Prevents overlapping audio from React Strict Mode double-mounts or rapid slide changes.
- **`killAudio()` helper**: Calls `pause()`, removes `src` attribute, calls `load()` to force the browser to release the audio resource. More thorough than just clearing `src`.
- **Progress tracking**: Uses `requestAnimationFrame` loop for smooth progress updates. Starts on `play`, stops on `pause`/`ended`. The progress bar width = `(currentTime / duration) * 100%`. Duration is read from the audio element's `loadedmetadata` event.
- **Time display**: The AudioBar shows elapsed and total time (e.g. `0:12 / 0:45`) next to the "Narration" label. Uses `tabular-nums` font variant for stable digit widths. Time is based on the actual audio file duration, not estimated from text length.
- **`canplaythrough` event**: Audio auto-plays once enough data is buffered — no waiting for the entire file. For cached files, a `readyState >= 4` check in `loadedmetadata` acts as a fallback.
- **Persistence**: Speed, volume, and mute are saved to `localStorage` on every change and restored on hook initialisation. The module-level variables are initialised from localStorage once at module load.

### 6.4 localStorage Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `oxygy_vo_muted` | `"true"` / `"false"` | `"false"` | Mute state |
| `oxygy_vo_speed` | `"0.75"` – `"2"` | `"1"` | Playback speed |
| `oxygy_vo_volume` | `"0"` – `"1"` | `"0.8"` | Volume level |

---

## 7. ELearningView Integration

### 7.1 Hook Instantiation

At the top of `ELearningView`:

```typescript
const voiceover = useVoiceover();
```

### 7.2 Slide Change Trigger

In the `useEffect` that watches `currentSlide` and resets per-slide state:

```typescript
// Load the new slide's setup clip (loadClip handles stopping previous audio)
const currentSlideData = slides[currentSlide - 1];
if (currentSlideData?.voiceover?.setup) {
  voiceover.loadClip(currentSlideData.voiceover.setup, 'setup');
} else {
  voiceover.stopAndReset();
}
```

### 7.3 Predict-First Reveal Trigger

Separate `useEffect` watching `predictSelected`:

```typescript
useEffect(() => {
  const slide = slides[currentSlide - 1];
  if (slide?.predictFirst && predictSelected !== null
      && predictSelected === slide.predictCorrect && slide.voiceover?.reveal) {
    voiceover.loadClip(slide.voiceover.reveal, 'reveal');
  }
}, [predictSelected]);
```

### 7.4 AudioBar Placement

Insert `<AudioBar voiceover={voiceover} />` after the progress bar div in **both** inline and fullscreen returns. Add `isFullscreen` prop in the fullscreen return:

```tsx
<AudioBar voiceover={voiceover} />                    {/* inline */}
<AudioBar voiceover={voiceover} isFullscreen />        {/* fullscreen */}
```

---

## 8. Step-by-Step: Adding Voiceover to a New Course

### Step 1: Write narration scripts

For each slide in the course, write a narration script following the guidelines in Section 4. For persona slides with `predictFirst: true`, write both a setup and reveal script.

### Step 2: Generate MP3 files

```bash
# Ensure edge-tts is installed
pip install edge-tts

# Generate all clips (example for Level 2, Topic 1, 12 slides)
VOICE="en-GB-RyanNeural"
OUT="public/audio"

edge-tts --voice $VOICE --write-media "$OUT/l2t1-s01-setup.mp3" --text "Script for slide 1..." &
edge-tts --voice $VOICE --write-media "$OUT/l2t1-s02-setup.mp3" --text "Script for slide 2..." &
# ... repeat for all slides ...
wait

# Verify
ls -lh $OUT/l2t1-*.mp3
```

### Step 3: Add voiceover paths to slide data

In `data/topicContent.ts`, add the `voiceover` property to each slide:

```typescript
voiceover: {
  setup: "/audio/l2t1-s01-setup.mp3",
},
```

### Step 4: Verify integration

The `ELearningView` component already handles all wiring automatically:
- Setup clips play on slide load
- Reveal clips play after correct persona predictions
- Audio stops on slide change
- All player controls work

No code changes to `ELearningView.tsx` or `useVoiceover.ts` are needed when adding voiceover to a new course — only the slide data and audio files.

### Step 5: Test locally

```bash
npx vite --port 5173 --strictPort
```

Navigate to the course and verify:
- [ ] Audio plays automatically on each slide
- [ ] Audio stops when navigating between slides (no overlap)
- [ ] Speed persists across slide changes
- [ ] Mute persists across slide changes
- [ ] Volume persists across slide changes
- [ ] Progress bar advances smoothly
- [ ] Persona slides: setup plays on load, reveal plays after correct prediction
- [ ] Both inline and fullscreen modes show the AudioBar

### Step 6: Deploy

Commit the MP3 files and updated `topicContent.ts`, push to main. GitHub Actions builds and deploys to Firebase automatically. The MP3 files are served as static assets from Firebase Hosting.

---

## 9. Decisions and Rationale Log

| Decision | Rationale |
|----------|-----------|
| **Static files over runtime TTS** | Same content for every user = generate once, serve forever. Saves API costs, eliminates latency, removes third-party dependency. |
| **edge-tts over ElevenLabs** | Free, no API key, neural-quality voices. ElevenLabs free tier has 10K character quota and blocks library voices. |
| **en-GB-RyanNeural voice** | Warm British male, professional tone. Matches the platform's consultancy brand. Similar to the "Brian" voice initially chosen from ElevenLabs. |
| **Generation counter (genRef)** | Prevents overlapping audio from React Strict Mode (dev) and rapid slide navigation. Each load increments the counter; stale async work bails out. |
| **Module-level settings variables** | Speed/volume/mute are stored as module-level `let` variables (`_speed`, `_volume`, `_muted`), not React refs or state. Module variables are immune to React batching, closure staleness, and re-render timing. Every `new Audio()` reads the exact latest value. React state mirrors these for UI rendering only. |
| **Aggressive speed enforcement (5 points)** | Some browsers (especially Safari/mobile) reset `playbackRate` at various points during audio lifecycle. Applying speed at creation, canplaythrough, play resolve, play event, and via timeupdate for the first ~10 updates guarantees it sticks. |
| **killAudio() with removeAttribute + load()** | Simply setting `audio.src = ""` doesn't always release the resource in all browsers. Removing the attribute and calling `.load()` forces the browser to fully release the audio. |
| **Popovers open downward** | The AudioBar sits at the top of the player container. Upward popovers get clipped by `overflow: hidden` on the parent. |
| **Volume default 80%** | Full volume (100%) can be jarring. 80% is a comfortable default that gives headroom to increase. |
| **No VITE_ELEVENLABS_API_KEY needed** | The static file approach means no API key is required at runtime. The workflow env var was added for potential future use but is not consumed by the current implementation. |

---

## 10. File Reference

| File | Role |
|------|------|
| `public/audio/*.mp3` | Static narration audio files |
| `data/topicContent.ts` | Slide data with `voiceover.setup` / `voiceover.reveal` paths |
| `hooks/useVoiceover.ts` | Audio playback hook (load, play, pause, speed, volume, mute, progress) |
| `components/app/level/ELearningView.tsx` | AudioBar UI component + integration with slide lifecycle |
| `PRD/SKILL-Voiceover-Narration.md` | This document |
