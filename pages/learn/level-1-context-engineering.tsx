import React, { useState, useEffect } from 'react';

/* ── Google Fonts + Flip Card CSS ── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    .l1-flip-card { perspective: 1000px; cursor: pointer; }
    .l1-flip-inner { transition: transform 0.6s; transform-style: preserve-3d; position: relative; width: 100%; }
    .l1-flip-inner.flipped { transform: rotateY(180deg); }
    .l1-flip-front, .l1-flip-back { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .l1-flip-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .l1-slider::-webkit-slider-thumb { background: #38B2AC; }
    .l1-slider { accent-color: #38B2AC; }
    @keyframes l1-pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(56,178,172,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(56,178,172,0); }
    }
    .l1-cta-glow {
      animation: l1-pulse-glow 2s ease-in-out infinite;
    }
    @keyframes l1-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .l1-interact-hint {
      position: relative;
      border: 2px solid #38B2AC !important;
    }
    .l1-interact-hint::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      border: 2px solid transparent;
      background: linear-gradient(90deg, transparent 30%, rgba(56,178,172,0.3) 50%, transparent 70%) border-box;
      background-size: 200% 100%;
      animation: l1-shimmer 2.5s linear infinite;
      pointer-events: none;
      mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      -webkit-mask-composite: xor;
    }
    @media (max-width: 767px) {
      .l1-two-col { flex-direction: column !important; }
      .l1-two-col > div { width: 100% !important; min-width: 0 !important; }
      .l1-player-content { padding: 20px !important; }
      .l1-flip-row { flex-direction: column !important; }
      .l1-flip-row > div { width: 100% !important; }
      .l1-rctf-grid { grid-template-columns: 1fr !important; }
      .l1-drag-grid { grid-template-columns: 1fr !important; }
      .l1-article-grid { grid-template-columns: 1fr !important; }
      .l1-hero-cols { flex-direction: column !important; }
      .l1-branch-opts { flex-direction: column !important; }
      .l1-branch-opts > div { width: 100% !important; }
      .l1-layers-row { flex-direction: column !important; }
      .l1-docs-row { flex-direction: column !important; }
      .l1-journey-strip { overflow-x: auto !important; }
      .l1-journey-strip > div { min-width: 480px; }
    }
  `}</style>
);

/* ── Brand Tokens ── */
const C = {
  navy: "#1A202C", navyMid: "#2D3748", teal: "#38B2AC", tealDark: "#2C9A94",
  tealLight: "#E6FFFA", mint: "#A8F0E0", border: "#E2E8F0", bg: "#F7FAFC",
  body: "#4A5568", light: "#718096", muted: "#A0AEC0",
  success: "#48BB78", successLight: "#F0FFF4", successBorder: "#9AE6B4",
  error: "#FC8181", errorLight: "#FFF5F5", errorBorder: "#FEB2B2",
  role: "#667EEA", roleLight: "#EBF4FF",
  context: "#38B2AC", contextLight: "#E6FFFA",
  task: "#ED8936", taskLight: "#FFFBEB",
  format: "#48BB78", formatLight: "#F0FFF4",
};
const F = { h: "'DM Sans', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

/* ── Data: Phases ── */
const PHASES = [
  { id: "elearn", label: "E-Learning", icon: "▶", time: "~20 min", desc: "12-slide interactive module" },
  { id: "read", label: "Read", icon: "◎", time: "~15 min", desc: "2 articles + reflection" },
  { id: "watch", label: "Watch", icon: "▷", time: "~12 min", desc: "2 videos + knowledge check" },
  { id: "practice", label: "Practice", icon: "◈", time: "~15 min", desc: "Prompt Playground →", external: true },
];

/* ── Data: Slides ── */
const SLIDES: any[] = [
  /* Slide 1 — SITUATION — 1A: Dark full-bleed typographic statement */
  { id: 1, section: "SITUATION", type: "darkStatement",
    heading: "You\u2019ve just spent 20 minutes crafting a prompt. You hit enter. The AI gives you something a first-year intern would be embarrassed to submit." },

  /* Slide 2 — SITUATION — 1B: Text + Visual (chat mockup) */
  { id: 2, section: "SITUATION", type: "concept",
    heading: "The prompt that wasted 20 minutes", tealWord: "20 minutes",
    body: "You needed a stakeholder update for the CFO on a delayed ERP rollout. You typed a reasonable request. The AI responded with something so generic it could have been written about any project, for any person, at any company.",
    visualKey: "scenario" },

  /* Slide 3 — TENSION — 2A: Full-width statement */
  { id: 3, section: "TENSION", type: "statement",
    heading: "The AI performed exactly as instructed.",
    subheading: "The problem is: your instruction carried almost no information.",
    tealPhrase: "almost no information" },

  /* Slide 4 — TENSION — 2B: Three-panel gap diagram */
  { id: 4, section: "TENSION", type: "concept",
    heading: "What you gave vs. what it needed", tealWord: "what it needed",
    body: "Most prompts carry a single sentence of instruction and zero supporting information. The AI then fills every gap with generic assumptions \u2014 about who you are, what you need, and what \u2018good\u2019 looks like.",
    visualKey: "gap" },

  /* Slide 5 — CONCEPT — 3E: Definition + single example */
  { id: 5, section: "CONCEPT", type: "concept",
    heading: "The Prompt Blueprint", tealWord: "Prompt Blueprint",
    body: "A six-part structure for giving AI everything it needs to produce professional-quality output on the first attempt. Each part fills a specific gap that most prompts leave empty. Together, they transform a vague instruction into a precise brief.",
    visualKey: "definition" },

  /* Slide 6 — CONCEPT — 3A: Six-component framework grid */
  { id: 6, section: "CONCEPT", type: "rctf",
    heading: "Six components. One complete instruction.", tealWord: "complete instruction",
    subheading: "Each component does a specific job. Together, they eliminate the guesswork that produces generic outputs.",
    elements: [
      { key: "ROLE", color: "#667EEA", light: "#EBF4FF", desc: "Who the AI should be", example: "Senior change management consultant with pharma experience" },
      { key: "CONTEXT", color: "#38B2AC", light: "#E6FFFA", desc: "Your situation and constraints", example: "6 weeks into ERP rollout. Commercial teams showing resistance." },
      { key: "TASK", color: "#ED8936", light: "#FFFBEB", desc: "Exactly what to produce", example: "Draft a CFO stakeholder update on the timeline slip" },
      { key: "FORMAT", color: "#48BB78", light: "#F0FFF4", desc: "Output shape, length, and tone", example: "3 short paragraphs. Professional. No jargon." },
      { key: "STEPS", color: "#9F7AEA", light: "#FAF5FF", desc: "Reasoning sequence for the AI to follow", example: "First assess the delay impact, then recommend next steps" },
      { key: "CHECKS", color: "#F6AD55", light: "#FFFBEB", desc: "Validation rules and constraints", example: "No generic phrases. Must name specific dates and people." },
    ] },

  /* Slide 7 — CONCEPT — 3B: Blueprint vs Brain Dump comparison [NEW] */
  { id: 7, section: "CONCEPT", type: "concept",
    heading: "Two approaches to the same problem", tealWord: "same problem",
    body: "",
    visualKey: "approaches" },

  /* Slide 8 — CONCEPT — 3A: Modifier techniques [NEW] */
  { id: 8, section: "CONCEPT", type: "concept",
    heading: "These aren\u2019t separate approaches. They\u2019re amplifiers.", tealWord: "amplifiers",
    body: "Add these on top of a Blueprint or a brain dump \u2014 they change how the AI reasons, not what information you give it.",
    visualKey: "modifiers" },

  /* Slide 9 — CONCEPT — 3C: Situational judgment decision matrix [NEW] */
  { id: 9, section: "CONCEPT", type: "concept",
    heading: "The best prompt isn\u2019t the most structured one. It\u2019s the right one for this task.", tealWord: "right one",
    body: "",
    visualKey: "decision" },

  /* Slide 10 — CONCEPT — 3D: Interactive drag-and-drop categorisation */
  { id: 10, section: "PRACTICE", type: "dragdrop",
    heading: "Categorise the prompt fragments", tealWord: "prompt fragments",
    instruction: "These are the raw ingredients of a prompt for a graduate onboarding plan. Identify what job each fragment is doing.",
    scenario: "Creating an onboarding plan for new graduate hires joining a consulting team." },

  /* Slide 11 — CONTRAST — 4A: Side-by-side with attribution */
  { id: 11, section: "CONTRAST", type: "concept",
    heading: "Same task. Same tool. Same person.", tealWord: "Same person",
    body: "The only difference is the quality of information in the input.",
    visualKey: "contrast" },

  /* Slide 12 — BRIDGE — 5A: Two-panel action card */
  { id: 12, section: "YOUR NEXT STEP", type: "bridge",
    heading: "Now build your own.",
    body: "The Prompt Playground uses the same Blueprint framework you\u2019ve just learned. Paste a real prompt from your current work \u2014 or build one from scratch using the guided builder.",
    cta: "Open Prompt Playground \u2192", ctaHref: "#playground",
    features: ["Paste any prompt and see it restructured", "Build a Blueprint prompt step by step", "Copy your structured prompt for immediate use"] },
];

/* ── Data: Drag & Drop (Slide 10) ── */
const DRAG_CHIPS = [
  { id: "c1", text: "You are an experienced L&D consultant who has designed onboarding programmes for professional services firms.", correctZone: "ROLE" },
  { id: "c2", text: "We have 12 graduates joining in September. They have no prior consulting experience. The first 90 days are critical for retention.", correctZone: "CONTEXT" },
  { id: "c3", text: "Create a 90-day onboarding roadmap with weekly milestones.", correctZone: "TASK" },
  { id: "c4", text: "Present as a timeline table. Include a column for owner and one for success criteria.", correctZone: "FORMAT" },
  { id: "c5", text: "First identify the core skills graduates need in their first client engagement, then design activities that build those skills progressively.", correctZone: "STEPS" },
  { id: "c6", text: "Every milestone must be measurable. No generic activities like \u2018shadowing\u2019 without a defined outcome.", correctZone: "CHECKS" },
  { id: "c7", text: "Think through the most common failure points in graduate onboarding before designing the programme.", correctZone: "COT" },
  { id: "c8", text: "Here are two examples of effective milestone descriptions from previous programmes: [example A] [example B]. Match this level of specificity.", correctZone: "FEWSHOT" },
  { id: "c9", text: "This is a good start. Now make Week 3 more specific \u2014 it\u2019s too similar to Week 2.", correctZone: "ITERATIVE" },
  { id: "c10", text: "Make it really good and professional.", correctZone: "VAGUE", isDistractor: true, feedback: "This tells the AI nothing it can act on. Replace vague adjectives with specific criteria." },
];
const DROP_ZONES = [
  { id: "ROLE", label: "Role", color: "#667EEA", light: "#EBF4FF" },
  { id: "CONTEXT", label: "Context", color: "#38B2AC", light: "#E6FFFA" },
  { id: "TASK", label: "Task", color: "#ED8936", light: "#FFFBEB" },
  { id: "FORMAT", label: "Format", color: "#48BB78", light: "#F0FFF4" },
  { id: "STEPS", label: "Steps", color: "#9F7AEA", light: "#FAF5FF" },
  { id: "CHECKS", label: "Quality Checks", color: "#F6AD55", light: "#FFFBEB" },
  { id: "COT", label: "Chain of Thought", color: "#E53E3E", light: "#FFF5F5" },
  { id: "FEWSHOT", label: "Few-Shot", color: "#805AD5", light: "#FAF5FF" },
  { id: "ITERATIVE", label: "Iterative Refinement", color: "#DD6B20", light: "#FFFAF0" },
  { id: "VAGUE", label: "Too vague to be useful", color: "#A0AEC0", light: "#F7FAFC" },
];

/* ── Data: Articles ── */
const ARTICLES = [
  { id: "a1", title: "The Prompt Engineering Playbook: What Separates Power Users from Everyone Else", source: "Harvard Business Review", readTime: "7 min read", desc: "How structured prompting is changing the way knowledge workers interact with AI tools — and what consistently separates professionals who get great outputs from those who get generic ones.", url: "https://hbr.org", reflection: "In one sentence, what was the single most useful idea from this article for your day-to-day work at OXYGY?" },
  { id: "a2", title: "Why Context Is the Most Underrated Variable in AI Prompting", source: "MIT Technology Review", readTime: "8 min read", desc: "A deep-dive into why the Context element of a prompt has more impact on output quality than any other variable — with real examples from professional knowledge work.", url: "https://technologyreview.com", reflection: "Describe one specific situation from your own work where adding more context to a prompt could have meaningfully improved the output you received." },
];

/* ── Data: Videos ── */
const VIDEOS = [
  { id: "v1", title: "Context Engineering in Practice", channel: "OXYGY Learning", duration: "12 min", desc: "A live walkthrough of all three context engineering layers applied to real consulting and pharma scenarios — including before/after comparisons at each layer.", url: "https://youtube.com", quiz: [
    { q: "In the video, what was identified as the most commonly skipped element of the RCTF framework?", options: ["Role — people feel unnatural assigning a persona to AI", "Context — people assume the AI already knows their situation", "Task — people think their ask is obvious from the prompt", "Format — people let the AI decide the output structure"], correct: 1 },
    { q: "According to the video, when does attaching a document add the most value over a detailed prompt?", options: ["When the document is under 5 pages and easy to summarise", "When the content contains specific names, quotes, and details that would be lost in a text description", "When you don’t have time to write a proper RCTF prompt", "When the AI model has a large context window"], correct: 1 },
  ]},
  { id: "v2", title: "Building a Team Prompt Library", channel: "OXYGY Learning", duration: "9 min", desc: "How to move from individual prompting habits to a shared, standardised library that scales context engineering capability across your entire team.", url: "https://youtube.com", quiz: [
    { q: "What is the primary benefit of a shared prompt library over individual prompting habits?", options: ["It saves individuals time writing prompts from scratch", "It standardises inputs to produce consistent, comparable outputs across the team", "It prevents people from making mistakes in their prompts", "It allows managers to monitor what questions employees are asking AI"], correct: 1 },
    { q: "In the video, what tagging approach is recommended for organising a prompt library?", options: ["By date created and author name", "By AI tool used (Claude, ChatGPT, Copilot)", "By use case and function (e.g., BD / Meeting Debrief / Strategy)", "By output quality rating from previous uses"], correct: 2 },
  ]},
];

/* ── Reusable Components ── */
const Eyebrow = ({ t }: { t: string }) => <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: F.b, marginTop: 0 }}>{t}</p>;

const TU = ({ children }: { children: React.ReactNode }) => <span style={{ textDecoration: "underline", textDecorationColor: C.teal, textDecorationThickness: 3, textUnderlineOffset: 5 }}>{children}</span>;

function renderH2(heading: string, tw: string, fs = 22) {
  if (!tw) return <h2 style={{ fontFamily: F.h, fontSize: fs, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.3 }}>{heading}</h2>;
  const idx = heading.indexOf(tw);
  if (idx === -1) return <h2 style={{ fontFamily: F.h, fontSize: fs, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.3 }}>{heading}</h2>;
  return <h2 style={{ fontFamily: F.h, fontSize: fs, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.3 }}>{heading.slice(0, idx)}<TU>{tw}</TU>{heading.slice(idx + tw.length)}</h2>;
}

function PhaseLabel({ label, time, done }: { label: string; time: string; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? C.success : "#ED8936" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: F.b }}>{done ? `${label} — Complete ✓` : `${label} — In Progress`}</span>
      </div>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: F.b }}>{time}</span>
    </div>
  );
}

function Btn({ children, onClick, disabled, secondary }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 22px", borderRadius: 24, minWidth: 100, minHeight: 44,
      border: secondary ? `1px solid ${C.border}` : "none",
      background: disabled ? C.muted : secondary ? "transparent" : C.teal,
      color: disabled ? "#fff" : secondary ? C.navy : "#fff",
      fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: F.b, display: "inline-flex", alignItems: "center", gap: 5, transition: "all 150ms ease",
    }}>{children}</button>
  );
}

const PromptBox = ({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) => (
  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColor || C.teal}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", fontSize: 13, fontFamily: F.b, fontStyle: "italic", color: C.navyMid, lineHeight: 1.6, wordBreak: "break-word", overflowWrap: "break-word", width: "100%", whiteSpace: "pre-wrap", boxSizing: "border-box" as const }}>{children}</div>
);

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function Level1Page() {
  /* ── Phase State ── */
  const [activePhase, setActivePhase] = useState("elearn");
  const [phasesDone, setPhasesDone] = useState<Set<string>>(new Set());

  /* ── E-Learning Player ── */
  const [slide, setSlide] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [spectrumPos, setSpectrumPos] = useState(2);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  /* ── Confidence Delta ── */
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
  const [confSliderBefore, setConfSliderBefore] = useState(5);
  const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null);
  const [confSliderAfter, setConfSliderAfter] = useState(5);
  const [confidenceSubmitted, setConfidenceSubmitted] = useState(false);

  /* ── Drag & Drop (Slide 6) ── */
  const [chipPlacements, setChipPlacements] = useState<Record<string, string>>({});
  const [selectedDragChip, setSelectedDragChip] = useState<string | null>(null);
  const [dragChecked, setDragChecked] = useState(false);

  /* ── Branching (Slide 11) ── */
  const [scenarioChoice, setScenarioChoice] = useState<number | null>(null);
  const [scenarioConfirmed, setScenarioConfirmed] = useState(false);

  /* ── Template Copy ── */
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  /* ── Read Phase ── */
  const [articleState, setArticleState] = useState<Record<string, { clicked: boolean; reflectionText: string; submitted: boolean }>>({});

  /* ── Watch Phase ── */
  const [videoState, setVideoState] = useState<Record<string, { clicked: boolean; quizAnswers: (number | null)[]; quizChecked: boolean[] }>>({});

  /* ── Helpers ── */
  const markPhaseDone = (id: string) => setPhasesDone(prev => new Set([...prev, id]));
  const readDone = ARTICLES.every(a => articleState[a.id]?.submitted);
  const watchDone = VIDEOS.every(v => videoState[v.id]?.clicked && videoState[v.id]?.quizChecked?.every(Boolean));
  const completedPhases = (phasesDone.has("elearn") ? 1 : 0) + (phasesDone.has("read") ? 1 : 0) + (phasesDone.has("watch") ? 1 : 0);

  const goToSlide = (i: number) => {
    setSlide(i);
    setVisitedSlides(prev => new Set([...prev, i]));
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const nextSlide = () => {
    if (slide === 0) setConfidenceBefore(confSliderBefore);
    if (slide === SLIDES.length - 1) {
      markPhaseDone("elearn");
      setActivePhase("read");
    } else {
      goToSlide(slide + 1);
    }
  };

  const prevSlide = () => { if (slide > 0) goToSlide(slide - 1); };

  const copyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  /* ── Drag & Drop Helpers ── */
  const placeChip = (chipId: string, zoneId: string) => {
    setChipPlacements(prev => ({ ...prev, [chipId]: zoneId }));
    setSelectedDragChip(null);
  };
  const removeChip = (chipId: string) => {
    setChipPlacements(prev => { const n = { ...prev }; delete n[chipId]; return n; });
  };
  const allChipsPlaced = DRAG_CHIPS.every(c => chipPlacements[c.id]);
  const resetDrag = () => { setChipPlacements({}); setDragChecked(false); setSelectedDragChip(null); };

  /* ════════════════════════════════════════════════════════════
     SLIDE RENDERER
     ════════════════════════════════════════════════════════════ */
  const renderSlide = () => {
    const s = SLIDES[slide];
    switch (s.type) {

      /* ── DARK STATEMENT (1A) ── */
      case "darkStatement": return (
        <div style={{ background: C.navy, margin: "-36px -48px", padding: "36px 48px", minHeight: "calc(100% + 72px)", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" as const }}>
          <h1 style={{ fontFamily: F.h, fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.5, textAlign: "center", maxWidth: 540 }}>{s.heading}</h1>
        </div>
      );

      /* ── STATEMENT (2A) ── */
      case "statement": {
        const phrase = s.tealPhrase || "";
        const idx = s.subheading ? s.subheading.indexOf(phrase) : -1;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <h1 style={{ fontFamily: F.h, fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1.3, maxWidth: 600, margin: "0 0 20px" }}>{s.heading}</h1>
            <p style={{ fontFamily: F.h, fontSize: 20, fontWeight: 600, color: C.teal, lineHeight: 1.4, maxWidth: 500, margin: 0 }}>
              {idx > -1 ? (
                <>{s.subheading.slice(0, idx)}<TU>{phrase}</TU>{s.subheading.slice(idx + phrase.length)}</>
              ) : s.subheading}
            </p>
          </div>
        );
      }

      /* ── CONCEPT ── */
      case "concept": {
        const renderVisual = () => {
          /* ── scenario: chat mockup (Slide 2) ── */
          if (s.visualKey === "scenario") return (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ background: C.navy, padding: "10px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.error }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ED8936" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, fontFamily: F.b, marginLeft: 8 }}>AI Chat</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <div style={{ background: C.tealLight, border: `1px solid ${C.mint}`, borderRadius: "12px 12px 0 12px", padding: "10px 14px", maxWidth: "80%" }}>
                    <p style={{ fontSize: 12, color: C.navyMid, fontFamily: F.b, margin: 0, fontStyle: "italic" }}>Write me a stakeholder update email about the ERP project delays</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "12px 12px 12px 0", padding: "10px 14px", maxWidth: "80%" }}>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, margin: "0 0 4px", lineHeight: 1.5 }}>Dear Stakeholder,</p>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, margin: "0 0 4px", lineHeight: 1.5 }}>I am writing to provide an update on the project status. We have encountered some delays which we are working to resolve...</p>
                    <p style={{ fontSize: 11, color: C.muted, fontFamily: F.b, margin: 0, fontStyle: "italic" }}>[continues with generic corporate filler...]</p>
                  </div>
                </div>
                <div style={{ background: C.errorLight, border: `1px solid ${C.errorBorder}`, borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: 11, color: C.error, fontWeight: 600, fontFamily: F.b, margin: 0 }}>No names. No specifics. No usable content.</p>
                </div>
              </div>
            </div>
          );
          /* ── gap: three-panel (Slide 4) ── */
          if (s.visualKey === "gap") return (
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
              <div style={{ flex: 1, background: C.errorLight, border: `1px solid ${C.errorBorder}`, borderRadius: "10px 0 0 10px", padding: "14px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 1, margin: "0 0 8px", fontFamily: F.b }}>WHAT YOU GAVE</p>
                <div style={{ background: "#fff", borderRadius: 6, padding: "8px 10px" }}>
                  <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, fontStyle: "italic", margin: 0 }}>&quot;Write me a stakeholder update email about the ERP project delays&quot;</p>
                </div>
              </div>
              <div style={{ width: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 60, fontWeight: 800, color: C.teal }}>?</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 1 }}>What&apos;s{"\n"}missing?</span>
              </div>
              <div style={{ flex: 1, background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: "0 10px 10px 0", padding: "14px 14px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 1, margin: "0 0 8px", fontFamily: F.b }}>WHAT IT NEEDED</p>
                {[
                  "Who you are and your role",
                  "The specific situation and constraints",
                  "Exactly what to produce",
                  "How the output should be structured",
                  "What \u201Cgood\u201D looks like for this audience",
                ].map((item, i) => (
                  <p key={i} style={{ margin: "4px 0", fontSize: 11, fontFamily: F.b, color: C.body, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: C.teal, fontWeight: 700, flexShrink: 0 }}>{"\u2022"}</span> {item}
                  </p>
                ))}
              </div>
            </div>
          );
          /* ── definition: Blueprint definition + single example (Slide 5) ── */
          if (s.visualKey === "definition") return (
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, margin: "0 0 10px", fontFamily: F.b }}>IN PRACTICE — ROLE COMPONENT ONLY</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ background: "#667EEA", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 12px", fontFamily: F.b }}>ROLE</span>
              </div>
              <PromptBox borderColor="#667EEA">Senior change management consultant with pharmaceutical sector experience and expertise in ERP implementation programmes.</PromptBox>
              <p style={{ fontSize: 11, color: C.muted, fontStyle: "italic", margin: "10px 0 0", fontFamily: F.b }}>Five more components follow. Each one does a specific job the bare prompt left undone.</p>
            </div>
          );
          /* ── approaches: Blueprint vs Brain Dump (Slide 7) ── */
          if (s.visualKey === "approaches") return (
            <div>
              <Eyebrow t="TWO APPROACHES TO THE SAME PROBLEM" />
              <div className="l1-two-col" style={{ display: "flex", gap: 14 }}>
                {/* Blueprint panel */}
                <div style={{ flex: 1, minWidth: 0, background: "#EBF4FF", border: "1px solid #C3DAFE", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: F.h }}>THE BLUEPRINT</p>
                  <span style={{ display: "inline-block", fontSize: 9, fontWeight: 600, color: C.light, border: `1px solid ${C.border}`, borderRadius: 12, padding: "2px 8px", marginBottom: 8, fontFamily: F.b }}>High structure · Reproducible · Best for recurring tasks</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {[
                      { label: "ROLE", color: "#667EEA", text: "Senior change management consultant with pharma experience" },
                      { label: "CONTEXT", color: "#38B2AC", text: "ERP rollout week 6, data migration slip, vendor issue, 3 Feb steering committee" },
                      { label: "TASK", color: "#ED8936", text: "CFO stakeholder update on timeline slip" },
                      { label: "FORMAT", color: "#48BB78", text: "3 paragraphs, professional, forwardable to board" },
                      { label: "STEPS", color: "#9F7AEA", text: "Assess impact \u2192 timeline \u2192 recommend next steps" },
                      { label: "CHECKS", color: "#F6AD55", text: "Named stakeholder, specific dates, actionable" },
                    ].map(c => (
                      <div key={c.label} style={{ background: "#fff", borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: c.color, fontFamily: F.b, minWidth: 40 }}>{c.label}</span>
                        <span style={{ fontSize: 10, color: C.body, fontFamily: F.b }}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 6, padding: "5px 10px", marginTop: 8 }}>
                    <p style={{ fontSize: 10, color: C.success, fontWeight: 600, margin: 0, fontFamily: F.b }}>Rich context \u2192 professional output</p>
                  </div>
                </div>
                {/* Brain Dump panel */}
                <div style={{ flex: 1, minWidth: 0, background: "#FFFFF0", border: "1px solid #FAF089", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: F.h }}>THE BRAIN DUMP</p>
                  <span style={{ display: "inline-block", fontSize: 9, fontWeight: 600, color: C.light, border: `1px solid ${C.border}`, borderRadius: 12, padding: "2px 8px", marginBottom: 8, fontFamily: F.b }}>Low friction · Dictated · Best for one-off complex requests</span>
                  <div style={{ background: "#fff", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>Okay so I need to write an update for Sarah the CFO about the ERP delays &mdash; we&apos;re about 6 weeks in and the data migration slipped, vendor integration issue, it came up in the 3 Feb steering committee. The commercial team, especially Marcus&apos;s group, are resistant. Go-live was supposed to be March but now looks like mid-April. Sarah probably knows the headline but not the detail. I want something she can forward to the board if needed, three paragraphs max, professional but not stiff.</p>
                  </div>
                  <span style={{ display: "inline-block", fontSize: 9, fontWeight: 600, color: "#805AD5", background: "#FAF5FF", border: "1px solid #E9D8FD", borderRadius: 12, padding: "2px 8px", marginBottom: 6, fontFamily: F.b }}>Spoken in ~35 seconds via Wispr Flow or built-in dictation</span>
                  <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 6, padding: "5px 10px" }}>
                    <p style={{ fontSize: 10, color: C.success, fontWeight: 600, margin: 0, fontFamily: F.b }}>Rich context \u2192 professional output</p>
                  </div>
                </div>
              </div>
            </div>
          );
          /* ── modifiers: three technique cards (Slide 8) ── */
          if (s.visualKey === "modifiers") return (
            <div className="l1-layers-row" style={{ display: "flex", gap: 12 }}>
              {[
                { title: "Chain of Thought", icon: "\u21E2", what: "Ask the AI to reason step-by-step before answering", example: "Think through this carefully before responding. Show your reasoning.", badge: "Use when: Analysis, judgment calls, multi-step reasoning" },
                { title: "Few-Shot Examples", icon: "\u25EB", what: "Show the AI 2\u20133 examples of good output before asking it to produce", example: "Here are two examples of the format I want: [example 1] [example 2]. Now produce one for\u2026", badge: "Use when: Format or tone is critical and hard to describe in words" },
                { title: "Iterative Refinement", icon: "\u21BB", what: "Treat the first output as a draft; give specific feedback to develop it", example: "Good start. Now make it more direct in the second paragraph and cut the final sentence.", badge: "Use when: Open-ended or creative tasks where you need to see something before you know what you want" },
              ].map(card => (
                <div key={card.title} style={{ flex: 1, minWidth: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 22, marginBottom: 4, color: C.teal }}>{card.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "0 0 4px", fontFamily: F.h }}>{card.title}</p>
                  <p style={{ fontSize: 11, color: C.body, margin: "0 0 8px", fontFamily: F.b, lineHeight: 1.5 }}>{card.what}</p>
                  <PromptBox>{card.example}</PromptBox>
                  <span style={{ display: "inline-block", fontSize: 9, fontWeight: 600, color: C.teal, border: `1px solid ${C.teal}`, borderRadius: 12, padding: "3px 8px", marginTop: 8, fontFamily: F.b, alignSelf: "flex-start" }}>{card.badge}</span>
                </div>
              ))}
            </div>
          );
          /* ── decision: 2x2 situational judgment matrix (Slide 9) ── */
          if (s.visualKey === "decision") return (
            <div>
              <Eyebrow t="SITUATIONAL JUDGMENT" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {[
                  { accent: "#C3D0F5", type: "Recurring \u00B7 High-stakes \u00B7 Needs to be reusable", approach: "Blueprint", modifier: "+ Quality Checks", example: "Proposal template, weekly client update, analysis report" },
                  { accent: "#F7E8A4", type: "One-off \u00B7 Complex \u00B7 Lots of nuance", approach: "Brain Dump", modifier: "+ Chain of Thought", example: "Stakeholder message, sensitive email, judgment call" },
                  { accent: "#A8F0E0", type: "Format-critical \u00B7 Tone matters \u00B7 Hard to describe", approach: "Blueprint or Brain Dump", modifier: "+ Few-Shot Examples", example: "Slide deck, exec summary, specific document style" },
                  { accent: "#F5B8A0", type: "Exploratory \u00B7 Creative \u00B7 Open-ended", approach: "Brain Dump", modifier: "+ Iterative Refinement", example: "Strategy framing, ideation, first draft of anything new" },
                ].map((card, i) => (
                  <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", borderTop: `4px solid ${card.accent}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.light, margin: "0 0 6px", fontFamily: F.b }}>{card.type}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 2px", fontFamily: F.h }}>{card.approach}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.teal, margin: "0 0 6px", fontFamily: F.b }}>{card.modifier}</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0, fontFamily: F.b, fontStyle: "italic" }}>{card.example}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: C.muted, fontFamily: F.b, textAlign: "center", margin: 0, lineHeight: 1.5 }}>Approaches combine. A Blueprint prompt on a complex analysis task should also use Chain of Thought. There is no wrong combination &mdash; only incomplete information.</p>
            </div>
          );
          /* ── contrast: side-by-side with attribution (Slide 11) ── */
          if (s.visualKey === "contrast") return (
            <div>
              <Eyebrow t="SAME TASK \u00B7 SAME TOOL \u00B7 SAME PERSON" />
              <div className="l1-two-col" style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                {/* Without */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: C.errorLight, border: `1px solid ${C.errorBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>WITHOUT THE BLUEPRINT</p>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 10px", marginBottom: 6, borderLeft: `3px solid ${C.error}` }}>
                      <p style={{ fontSize: 11, color: C.body, fontFamily: F.b, fontStyle: "italic", margin: 0 }}>Write me a stakeholder update email about the ERP project delays</p>
                    </div>
                    <p style={{ fontSize: 9, fontWeight: 700, color: C.error, letterSpacing: 1, margin: "0 0 4px", fontFamily: F.b }}>AI OUTPUT</p>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 10px" }}>
                      <p style={{ fontSize: 11, color: C.body, fontFamily: F.b, margin: 0, lineHeight: 1.5 }}>Dear Stakeholder, I am writing to provide an update on the project status. We have encountered some delays which we are working to resolve. We remain committed to delivering a high-quality outcome and will keep you informed of any further developments.</p>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "5px 10px", marginTop: 6 }}>
                      <p style={{ fontSize: 10, color: C.error, fontWeight: 600, margin: 0, fontFamily: F.b }}>Generic. No names. Could be about any project. Not sendable.</p>
                    </div>
                  </div>
                </div>
                {/* With */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.success, letterSpacing: 1, margin: "0 0 6px", fontFamily: F.b }}>WITH THE BLUEPRINT</p>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "6px 10px", marginBottom: 6, borderLeft: `3px solid ${C.success}` }}>
                      {[
                        { k: "Role", c: "#667EEA" }, { k: "Context", c: C.teal }, { k: "Task", c: "#ED8936" },
                        { k: "Format", c: "#48BB78" }, { k: "Quality", c: "#F6AD55" },
                      ].map(item => (
                        <span key={item.k} style={{ display: "inline-block", fontSize: 8, fontWeight: 700, color: item.c, background: `${item.c}15`, borderRadius: 8, padding: "1px 6px", marginRight: 3, marginBottom: 2, fontFamily: F.b }}>{item.k}</span>
                      ))}
                      <p style={{ fontSize: 9, color: C.muted, fontStyle: "italic", margin: "3px 0 0", fontFamily: F.b }}>Senior change mgmt consultant \u00B7 ERP week 6 \u00B7 CFO update \u00B7 3 paras \u00B7 Named dates</p>
                    </div>
                    <p style={{ fontSize: 9, fontWeight: 700, color: C.success, letterSpacing: 1, margin: "0 0 4px", fontFamily: F.b }}>AI OUTPUT</p>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 10px" }}>
                      <p style={{ fontSize: 11, color: C.body, fontFamily: F.b, margin: 0, lineHeight: 1.5 }}>Hi Sarah, Quick update on the ERP timeline: the data migration phase has slipped by two weeks due to the vendor integration issue flagged at the 3 February steering committee. Revised go-live is now 14 April. I&apos;d recommend briefing Marcus&apos;s commercial team before Thursday&apos;s town hall &mdash; I can draft talking points if that&apos;s helpful. Let me know how you&apos;d like to handle the board communication.</p>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "5px 10px", marginTop: 6 }}>
                      <p style={{ fontSize: 10, color: C.success, fontWeight: 600, margin: 0, fontFamily: F.b }}>Named stakeholder. Specific dates. Actionable. Ready to send.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Attribution callouts */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { detail: "The name \u2018Sarah\u2019", source: "Role + Context" },
                  { detail: "The date \u201814 April\u2019", source: "Context" },
                  { detail: "The recommended action", source: "Steps" },
                ].map((attr, i) => (
                  <div key={i} style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.navy, margin: "0 0 2px", fontFamily: F.b }}>{attr.detail}</p>
                    <p style={{ fontSize: 10, color: C.teal, fontWeight: 600, margin: 0, fontFamily: F.b }}>{"\u2192"} came from: {attr.source}</p>
                  </div>
                ))}
              </div>
            </div>
          );
          return null;
        };
        const renderTextBlock = (maxW?: number) => (
          <div style={{ marginBottom: 16 }}>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord)}
            {s.body && s.body.split("\n\n").map((p: string, i: number) => <p key={i} style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 12px", ...(maxW ? { maxWidth: maxW } : {}) }}>{p}</p>)}
            {s.pullQuote && (
              <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.tealLight, padding: "12px 16px", borderRadius: "0 8px 8px 0", marginTop: 12, ...(maxW ? { maxWidth: maxW } : {}) }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{s.pullQuote}</p>
              </div>
            )}
          </div>
        );

        /* Full-width stacked layout */
        return (
          <div>
            {renderTextBlock(640)}
            {renderVisual()}
          </div>
        );
      }

      /* ── SPECTRUM ── */
      case "spectrum": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord, 20)}
          <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{s.body}</p>
          {/* Toggle selector */}
          <div className="l1-cta-glow" style={{ display: "inline-flex", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 30, padding: 3, marginBottom: 14 }}>
            {s.positions.map((p: any, i: number) => (
              <button key={i} onClick={() => setSpectrumPos(i)} style={{
                background: spectrumPos === i ? C.teal : "transparent",
                color: spectrumPos === i ? "#fff" : C.muted,
                border: "none", borderRadius: 24, padding: "7px 18px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: F.b, transition: "all 200ms ease", whiteSpace: "nowrap",
              }}>{p.label}</button>
            ))}
          </div>
          {/* Active panel */}
          <div style={{ background: C.bg, borderLeft: `3px solid ${C.teal}`, borderRadius: "0 8px 8px 0", padding: "12px 18px", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 3px", fontFamily: F.h }}>{s.positions[spectrumPos].label}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 6px", fontFamily: F.b }}>{s.positions[spectrumPos].desc}</p>
            <PromptBox>{s.positions[spectrumPos].example}</PromptBox>
          </div>
          {/* Pivot panel */}
          <div style={{ borderLeft: `4px solid ${C.navy}`, background: C.bg, borderRadius: "0 8px 8px 0", padding: "12px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.error, letterSpacing: 2, margin: "0 0 3px", fontFamily: F.b }}>BUT HERE&apos;S THE LIMIT</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 4px", fontFamily: F.h }}>Prompting alone has a ceiling</p>
            <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, margin: "0 0 4px", fontFamily: F.b }}>All three approaches share the same constraint: the AI only knows what you type. If your project has 40 pages of background documents, a team methodology, or weeks of shared context — none of that exists inside a single prompt, no matter how well-crafted.</p>
            <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, margin: 0, fontFamily: F.b }}>That&apos;s where context engineering comes in.</p>
          </div>
        </div>
      );

      /* ── RCTF ── */
      case "rctf": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord)}
          <p style={{ fontSize: 14, color: C.light, fontFamily: F.b, margin: "0 0 16px" }}>{s.subheading}</p>
          <div className="l1-rctf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {s.elements.map((el: any) => (
              <div key={el.key} style={{ background: el.light, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <span style={{ display: "inline-block", background: el.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", marginBottom: 8 }}>{el.key}</span>
                <p style={{ fontSize: 12, color: C.body, margin: "0 0 8px", fontFamily: F.b }}>{el.desc}</p>
                <PromptBox borderColor={el.color}>{el.example}</PromptBox>
              </div>
            ))}
          </div>
          {/* Assembled prompt */}
          <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.bg, borderRadius: "0 8px 8px 0", padding: "14px 20px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, margin: "0 0 8px", fontFamily: F.b }}>WHAT IT LOOKS LIKE ASSEMBLED</p>
            {s.elements.map((el: any) => (
              <p key={el.key} style={{ fontSize: 13, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 8px", color: C.navyMid }}>
                <span style={{ display: "inline-flex", background: el.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px", marginRight: 6, verticalAlign: "middle" }}>{el.key}</span>
                {el.example}
              </p>
            ))}
          </div>
        </div>
      );

      /* ── DRAG & DROP (Slide 10) ── */
      case "dragdrop": {
        const chipsInPool = DRAG_CHIPS.filter(c => !chipPlacements[c.id]);
        const blueprintZones = DROP_ZONES.filter(z => ["ROLE","CONTEXT","TASK","FORMAT","STEPS","CHECKS"].includes(z.id));
        const modifierZones = DROP_ZONES.filter(z => ["COT","FEWSHOT","ITERATIVE"].includes(z.id));
        const invalidZones = DROP_ZONES.filter(z => z.id === "VAGUE");
        const renderZone = (zone: any) => {
          const zoneChips = DRAG_CHIPS.filter(c => chipPlacements[c.id] === zone.id);
          const hasError = dragChecked && zoneChips.some(c => c.correctZone !== zone.id);
          const allCorrect = dragChecked && zoneChips.length > 0 && zoneChips.every(c => c.correctZone === zone.id && !c.isDistractor);
          return (
            <div key={zone.id}
              onDragOver={(e: any) => e.preventDefault()}
              onDrop={(e: any) => { e.preventDefault(); const chipId = e.dataTransfer.getData("chipId"); if (chipId) placeChip(chipId, zone.id); }}
              onClick={() => { if (selectedDragChip) placeChip(selectedDragChip, zone.id); }}
              style={{
                background: zone.light, borderRadius: 10, padding: "10px 14px", minHeight: 52,
                border: dragChecked ? (hasError ? `2px solid ${C.error}` : allCorrect ? `2px solid ${C.success}` : `1px solid ${zone.color}`) : `1px solid ${zone.color}`,
              }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: zone.color, textTransform: "uppercase" as const, letterSpacing: 1, fontFamily: F.b }}>{zone.label}</span>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                {zoneChips.map(chip => {
                  const isCorrect = chip.correctZone === zone.id && !chip.isDistractor;
                  const showDistractor = dragChecked && chip.isDistractor && chip.correctZone === zone.id;
                  return (
                    <div key={chip.id} onClick={(e: any) => { e.stopPropagation(); if (!dragChecked) removeChip(chip.id); }}
                      style={{
                        padding: "5px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.b, color: C.navyMid,
                        background: dragChecked ? (isCorrect ? C.successLight : C.errorLight) : "#fff",
                        border: `1px solid ${dragChecked ? (isCorrect ? C.successBorder : C.errorBorder) : C.border}`,
                        cursor: dragChecked ? "default" : "pointer", wordBreak: "break-word" as const,
                      }}>
                      {chip.text}
                      {dragChecked && !isCorrect && !showDistractor && <span style={{ display: "block", fontSize: 9, color: C.error, marginTop: 2 }}>{"\u2192"} Belongs in {chip.correctZone}</span>}
                      {showDistractor && <span style={{ display: "block", fontSize: 9, color: C.error, marginTop: 2 }}>{(chip as any).feedback}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        };
        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord)}
            <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 8px" }}>{s.instruction}</p>
            <div style={{ background: C.navy, borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: "#fff", fontFamily: F.b, lineHeight: 1.5, margin: 0 }}>{s.scenario}</p>
            </div>
            {/* Chip pool */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, minHeight: 36 }}>
              {chipsInPool.map(chip => (
                <div key={chip.id} draggable onDragStart={(e: any) => e.dataTransfer.setData("chipId", chip.id)}
                  onClick={() => setSelectedDragChip(selectedDragChip === chip.id ? null : chip.id)}
                  style={{
                    padding: "6px 10px", borderRadius: 8, fontSize: 11, fontFamily: F.b, color: C.navyMid,
                    background: selectedDragChip === chip.id ? C.tealLight : "#fff",
                    border: `1px solid ${selectedDragChip === chip.id ? C.teal : C.border}`,
                    cursor: "grab", fontWeight: 500, maxWidth: "100%", wordBreak: "break-word" as const, minHeight: 44,
                    display: "flex", alignItems: "center",
                  }}>{chip.text}</div>
              ))}
            </div>
            {/* Blueprint zones (2x3) */}
            <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, margin: "0 0 6px", fontFamily: F.b }}>BLUEPRINT COMPONENTS</p>
            <div className="l1-drag-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {blueprintZones.map(renderZone)}
            </div>
            {/* Modifier zones (3 columns) */}
            <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, margin: "0 0 6px", fontFamily: F.b }}>MODIFIER TECHNIQUES</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {modifierZones.map(renderZone)}
            </div>
            {/* Invalid zone (full width) */}
            <div style={{ marginBottom: 10 }}>
              {invalidZones.map(renderZone)}
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Btn onClick={() => setDragChecked(true)} disabled={!allChipsPlaced || dragChecked}>Check Answers</Btn>
              <Btn onClick={resetDrag} secondary>Start again {"\u21BA"}</Btn>
            </div>
            {dragChecked && allChipsPlaced && DRAG_CHIPS.filter(c => chipPlacements[c.id] !== c.correctZone || c.isDistractor).length === 0 && (
              <div style={{ background: C.successLight, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                <p style={{ fontSize: 12, color: C.navyMid, fontFamily: F.b, margin: 0, lineHeight: 1.5 }}>Every fragment is doing a specific job. The distractor (&quot;Make it really good and professional&quot;) tells the AI nothing it can act on &mdash; replace vague adjectives with specific criteria.</p>
              </div>
            )}
          </div>
        );
      }

      /* ── BRIDGE (Slide 12) ── */
      case "bridge": return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", gap: 0, flex: 1, borderRadius: 16, overflow: "hidden" }}>
            {/* Left panel — Playground CTA */}
            <div style={{ flex: 1, minWidth: 0, background: C.teal, padding: "28px 32px", display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontFamily: F.h, fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>{s.heading}</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontFamily: F.b, lineHeight: 1.6, margin: "0 0 16px" }}>{s.body}</p>
              <a href={s.ctaHref} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "12px 28px", borderRadius: 24, minHeight: 44,
                background: "#fff", color: C.tealDark,
                fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: F.b,
                alignSelf: "flex-start",
              }}>{s.cta}</a>
              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                {s.features.map((f: string, i: number) => (
                  <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: F.b, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: C.mint }}>{"\u00B7"}</span> {f}
                  </p>
                ))}
              </div>
            </div>
            {/* Right panel — Context Engineering tease */}
            <div style={{ width: "42%", minWidth: 0, background: C.tealDark, padding: "28px 28px", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.mint, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 10px", fontFamily: F.b }}>COMING NEXT</p>
              <h3 style={{ fontFamily: F.h, fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 10px", lineHeight: 1.3 }}>Context Engineering</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: F.b, lineHeight: 1.6, margin: "0 0 16px" }}>Everything you&apos;ve just learned works at the prompt level. In the next topic, you&apos;ll go one layer deeper &mdash; giving AI standing context about who you are, what you&apos;re working on, and what good looks like, before you write a single prompt. That&apos;s where the real leverage compounds.</p>
              <a href="#level-1-context-engineering" style={{ fontSize: 13, fontWeight: 600, color: C.mint, textDecoration: "none", fontFamily: F.b, marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>Preview topic {"\u2192"}</a>
            </div>
          </div>
        </div>
      );

      default: return <p>Unknown slide type</p>;
    }
  };

  /* ════════════════════════════════════════════════════════════
     READ PHASE
     ════════════════════════════════════════════════════════════ */
  const renderReadPhase = () => (
    <div>
      <PhaseLabel label="Phase 2: Read" time="~15 min" done={phasesDone.has("read")} />
      <div className="l1-article-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {ARTICLES.map((article, idx) => {
          const st = articleState[article.id] || { clicked: false, reflectionText: "", submitted: false };
          return (
            <div key={article.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: st.submitted ? C.successLight : C.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 4px", fontFamily: F.b }}>Article {idx + 1} · {article.readTime} · {article.source}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: st.submitted ? C.light : C.navy, fontFamily: F.h, margin: 0, textDecoration: st.submitted ? "line-through" : "none" }}>{article.title}</p>
                </div>
                {st.submitted && <span style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>✓</span>}
              </div>
              {/* Body */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{article.desc}</p>
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setArticleState(prev => ({ ...prev, [article.id]: { ...st, clicked: true } }))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 24, border: `1px solid ${C.teal}`, color: C.teal, fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F.b }}>
                  Read article ↗
                </a>
                {st.clicked && !st.submitted && (
                  <div style={{ marginTop: 16, borderTop: `1px dashed ${C.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, margin: "0 0 6px", fontFamily: F.b }}>REFLECTION</p>
                    <p style={{ fontSize: 13, color: C.navyMid, margin: "0 0 8px", fontFamily: F.b }}>{article.reflection}</p>
                    <textarea value={st.reflectionText}
                      onChange={e => setArticleState(prev => ({ ...prev, [article.id]: { ...st, reflectionText: e.target.value } }))}
                      style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: F.b, resize: "vertical", boxSizing: "border-box" as const }}
                      placeholder="Write your reflection here..." />
                    <div style={{ marginTop: 8, textAlign: "right" }}>
                      <Btn onClick={() => setArticleState(prev => ({ ...prev, [article.id]: { ...st, submitted: true } }))} disabled={!st.reflectionText.trim()}>Submit reflection →</Btn>
                    </div>
                  </div>
                )}
                {st.submitted && (
                  <div style={{ marginTop: 12, background: C.successLight, borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: C.success, fontWeight: 600, margin: 0, fontFamily: F.b }}>Reflection submitted ✓</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {readDone && (
        <div style={{ textAlign: "right" }}>
          <Btn onClick={() => { markPhaseDone("read"); setActivePhase("watch"); }}>Continue to Watch →</Btn>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     WATCH PHASE
     ════════════════════════════════════════════════════════════ */
  const renderWatchPhase = () => (
    <div>
      <PhaseLabel label="Phase 3: Watch" time="~12 min" done={phasesDone.has("watch")} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        {VIDEOS.map((video, idx) => {
          const st = videoState[video.id] || { clicked: false, quizAnswers: [null, null], quizChecked: [false, false] };
          const videoComplete = st.clicked && st.quizChecked.every(Boolean);
          return (
            <div key={video.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: videoComplete ? C.successLight : C.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, height: 52, background: C.navy, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: C.teal, fontSize: 20 }}>▶</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 2px", fontFamily: F.b }}>Video {idx + 1} · {video.duration} · {video.channel}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: videoComplete ? C.light : C.navy, fontFamily: F.h, margin: 0, textDecoration: videoComplete ? "line-through" : "none" }}>{video.title}</p>
                </div>
                {videoComplete && <span style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>✓</span>}
              </div>
              {/* Body */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{video.desc}</p>
                <a href={video.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setVideoState(prev => ({ ...prev, [video.id]: { ...st, clicked: true } }))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 24, background: C.teal, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F.b, minHeight: 44 }}>
                  ▶ Watch video
                </a>
                {/* Knowledge check */}
                {st.clicked && (
                  <div style={{ marginTop: 16, borderTop: `1px dashed ${C.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 1.5, margin: "0 0 12px", fontFamily: F.b }}>KNOWLEDGE CHECK</p>
                    {video.quiz.map((q: any, qi: number) => (
                      <div key={qi} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: "0 0 10px", fontFamily: F.b }}>Q{qi + 1}: {q.q}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {q.options.map((opt: string, oi: number) => {
                            const isSelected = st.quizAnswers[qi] === oi;
                            const checked = st.quizChecked[qi];
                            const isCorrect = oi === q.correct;
                            let bg = "#fff", border = `1px solid ${C.border}`;
                            if (checked) {
                              if (isCorrect) { bg = C.successLight; border = `2px solid ${C.success}`; }
                              else if (isSelected) { bg = C.errorLight; border = `2px solid ${C.error}`; }
                            } else if (isSelected) { bg = C.tealLight; border = `2px solid ${C.teal}`; }
                            return (
                              <div key={oi} onClick={() => {
                                if (checked) return;
                                setVideoState(prev => {
                                  const s = prev[video.id] || { clicked: true, quizAnswers: [null, null], quizChecked: [false, false] };
                                  const ans = [...s.quizAnswers]; ans[qi] = oi;
                                  return { ...prev, [video.id]: { ...s, quizAnswers: ans } };
                                });
                              }}
                              style={{ background: bg, border, borderRadius: 8, padding: "10px 14px", cursor: checked ? "default" : "pointer", fontSize: 12, fontFamily: F.b, color: C.body, transition: "all 200ms ease", minHeight: 44, display: "flex", alignItems: "center" }}>
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                        {st.quizAnswers[qi] !== null && !st.quizChecked[qi] && (
                          <div style={{ marginTop: 8, textAlign: "right" }}>
                            <Btn onClick={() => {
                              setVideoState(prev => {
                                const s = prev[video.id] || { clicked: true, quizAnswers: [null, null], quizChecked: [false, false] };
                                const chk = [...s.quizChecked]; chk[qi] = true;
                                return { ...prev, [video.id]: { ...s, quizChecked: chk } };
                              });
                            }}>Check answer</Btn>
                          </div>
                        )}
                        {st.quizChecked[qi] && (
                          <div style={{ marginTop: 8, background: st.quizAnswers[qi] === q.correct ? C.successLight : C.errorLight, borderRadius: 6, padding: "6px 10px" }}>
                            <p style={{ fontSize: 12, color: st.quizAnswers[qi] === q.correct ? C.success : C.error, fontWeight: 600, margin: 0, fontFamily: F.b }}>{st.quizAnswers[qi] === q.correct ? "Correct!" : `Incorrect — the answer is: ${q.options[q.correct]}`}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Completion CTA */}
      {watchDone && (
        <div style={{ background: C.navy, borderRadius: 16, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" as const }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.mint, letterSpacing: 2, margin: "0 0 4px", fontFamily: F.b, textTransform: "uppercase" as const }}>LEARNING JOURNEY COMPLETE</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: F.h }}>Ready to put it into practice</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, fontFamily: F.b }}>Apply your prompt engineering skills in the Prompt Playground.</p>
          </div>
          <Btn onClick={() => { markPhaseDone("watch"); setActivePhase("practice"); }}>Go to Prompt Playground →</Btn>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     HANDOFF CTA (Practice Phase)
     ════════════════════════════════════════════════════════════ */
  const renderHandoff = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 48, textAlign: "center", maxWidth: 500 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.tealLight, border: `2px solid ${C.mint}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: C.teal }}>◈</div>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, margin: "0 0 8px", fontFamily: F.b, textTransform: "uppercase" as const }}>NEXT STEP</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: F.h, margin: "0 0 8px" }}>Prompt Playground</h2>
        <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 20px" }}>Apply the Blueprint framework to a real prompt from your work. Build, test, and refine structured prompts — then save your best work to your personal prompt library.</p>
        <a href="#playground" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 28px", borderRadius: 24, background: "#00EDFF", color: "#0F172A", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: F.b }}>Open Prompt Playground →</a>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     JOURNEY STRIP
     ════════════════════════════════════════════════════════════ */
  const renderJourneyStrip = () => (
    <div className="l1-journey-strip" style={{ marginTop: 32, marginBottom: 32 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 12, fontFamily: F.b }}>LEARNING JOURNEY — LEVEL 1</p>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {PHASES.map((phase, i) => {
          const isActive = activePhase === phase.id;
          const isDone = phasesDone.has(phase.id);
          const isExternal = (phase as any).external;
          const prevDone = i === 0 ? true : phasesDone.has(PHASES[i - 1].id);
          return (
            <React.Fragment key={phase.id}>
              {i > 0 && (
                <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}>
                  <div style={{ height: 1, width: 16, background: prevDone ? C.teal : C.border }} />
                  <span style={{ fontSize: 12, color: prevDone ? C.teal : C.muted }}>›</span>
                </div>
              )}
              <div onClick={() => {
                if (!isExternal && (isDone || isActive || prevDone)) setActivePhase(phase.id);
              }}
                style={{
                  flex: 1, padding: "14px 16px", borderRadius: 10, position: "relative" as const,
                  border: isActive ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                  background: isActive ? C.tealLight : isDone ? C.successLight : "#FAFAFA",
                  cursor: isExternal ? "default" : "pointer", transition: "all 200ms ease",
                }}>
                {isDone && (
                  <div style={{ position: "absolute" as const, top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: C.success, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{phase.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? C.light : C.navy, fontFamily: F.h, textDecoration: isDone ? "line-through" : "none" }}>{phase.label}</span>
                </div>
                <p style={{ fontSize: 11, color: C.muted, margin: "0 0 2px", fontFamily: F.b }}>{phase.time}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0, fontFamily: F.b }}>{phase.desc}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     PAGE HERO
     ════════════════════════════════════════════════════════════ */
  const renderHero = () => (
    <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "24px 0 28px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", fontFamily: F.b }}>
          <a href="#course-resources" style={{ color: C.muted, textDecoration: "none" }}>Course Resources</a> <span style={{ margin: "0 4px" }}>›</span>
          <span>Level 1</span> <span style={{ margin: "0 4px" }}>›</span>
          <span style={{ color: C.body }}>Prompt Engineering</span>
        </p>
        <div className="l1-hero-cols" style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <span style={{ display: "inline-block", background: C.mint, color: C.tealDark, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 8, fontFamily: F.b, textTransform: "uppercase" as const }}>LEVEL 1</span>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 8px", fontFamily: F.b }}>FOUNDATIONS & AWARENESS</p>
            <h1 style={{ fontFamily: F.h, fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1.2, margin: "0 0 12px" }}>
              <TU>Prompt Engineering</TU> Essentials
            </h1>
            <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, maxWidth: 600, margin: "0 0 16px" }}>
              Learn the Prompt Blueprint — a six-part framework for giving AI everything it needs to produce professional-quality output on the first attempt. You&apos;ll practise building structured prompts, see the before-and-after difference, and leave with a tool you can use immediately.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["~40 min total", "3 activities", "Beginner friendly", "Pharma & Consulting"].map(tag => (
                <span key={tag} style={{ padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.body, fontWeight: 600, fontFamily: F.b }}>{tag}</span>
              ))}
            </div>
          </div>
          {/* Right: Progress */}
          <div className="l1-hero-progress" style={{ minWidth: 200, textAlign: "center", padding: "20px 24px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const, margin: "0 0 8px", fontFamily: F.b }}>Journey Progress</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: C.navy, fontFamily: F.h, margin: "0 0 2px" }}>{completedPhases} <span style={{ fontSize: 18, color: C.muted }}>/ 3</span></p>
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", fontFamily: F.b }}>phases completed</p>
            <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: C.teal, width: `${(completedPhases / 3) * 100}%`, transition: "width 400ms ease" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════════════════════════ */
  const s = SLIDES[slide];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 68 }}>
      <FontStyle />
      {renderHero()}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px 0" }}>

        {/* ── E-LEARNING PHASE ── */}
        {activePhase === "elearn" && (
          <>
            <PhaseLabel label="Phase 1: E-Learning" time="~20 min" done={phasesDone.has("elearn")} />
            {/* Player card */}
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }}>
              {/* Top bar */}
              <div style={{ background: C.navy, height: 44, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, fontFamily: F.b }}>{s.section}</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {SLIDES.map((_: any, i: number) => (
                    <div key={i} onClick={() => goToSlide(i)} style={{
                      width: i === slide ? 22 : 8, height: 8, borderRadius: 4, cursor: "pointer",
                      background: i === slide ? C.teal : visitedSlides.has(i) ? "#4A5568" : "#2D3748",
                      transition: "all 250ms ease",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: F.b }}>{slide + 1} / {SLIDES.length}</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 3, background: C.border }}>
                <div style={{ height: "100%", background: C.teal, width: `${((slide + 1) / SLIDES.length) * 100}%`, transition: "width 300ms ease" }} />
              </div>
              {/* Content area */}
              <div className="l1-player-content" style={{ height: 620, overflowY: "auto" as const, padding: "36px 48px" }}>
                {renderSlide()}
              </div>
              {/* Nav bar */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                <Btn onClick={prevSlide} disabled={slide === 0} secondary>← Previous</Btn>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, fontFamily: F.b }}>{s.section}</span>
                <Btn onClick={nextSlide}>{slide === SLIDES.length - 1 ? "Finish E-Learning →" : "Next →"}</Btn>
              </div>
            </div>
          </>
        )}

        {/* ── READ PHASE ── */}
        {activePhase === "read" && renderReadPhase()}

        {/* ── WATCH PHASE ── */}
        {activePhase === "watch" && renderWatchPhase()}

        {/* ── PRACTICE PHASE ── */}
        {activePhase === "practice" && renderHandoff()}

        {/* ── JOURNEY STRIP ── */}
        {renderJourneyStrip()}
      </div>
    </div>
  );
}
