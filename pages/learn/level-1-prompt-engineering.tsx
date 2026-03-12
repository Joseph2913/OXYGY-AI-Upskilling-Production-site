import React, { useState } from 'react';

/* ── Google Fonts + Custom CSS ── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    @media (max-width: 767px) {
      .pe-two-col { flex-direction: column !important; }
      .pe-two-col > div { width: 100% !important; min-width: 0 !important; }
      .pe-player-content { padding: 20px !important; }
      .pe-article-grid { grid-template-columns: 1fr !important; }
      .pe-hero-cols { flex-direction: column !important; }
      .pe-rctf-grid { grid-template-columns: 1fr !important; }
      .pe-journey-strip { overflow-x: auto !important; }
      .pe-journey-strip > div { min-width: 480px; }
      .pe-gap-panels { flex-direction: column !important; }
      .pe-gap-panels > div { border-radius: 12px !important; }
      .pe-scenario-cards > div { min-width: 0 !important; }
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
  peachDark: "#F5B8A0",
  role: "#667EEA", roleLight: "#EBF4FF",
  context: "#38B2AC", contextLight: "#E6FFFA",
  task: "#ED8936", taskLight: "#FFFBEB",
  format: "#48BB78", formatLight: "#F0FFF4",
};
const F = { h: "'DM Sans', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

/* ── Data: Phases ── */
const PHASES = [
  { id: "elearn", label: "E-Learning", icon: "\u25B6", time: "~20 min", desc: "11-slide interactive module" },
  { id: "read", label: "Read", icon: "\u25CE", time: "~15 min", desc: "2 articles + reflection" },
  { id: "watch", label: "Watch", icon: "\u25B7", time: "~12 min", desc: "2 videos + knowledge check" },
  { id: "practice", label: "Practice", icon: "\u25C8", time: "~15 min", desc: "Prompt Playground \u2192", external: true },
];

/* ── Data: Slides ── */
const SLIDES: any[] = [
  /* Slide 1 — SITUATION — Evidence Opening */
  { id: 1, section: "THE REALITY", type: "evidence",
    heading: "AI adoption is accelerating. AI skill isn\u2019t.",
    tealWord: "skill isn\u2019t",
    body: "Most professionals now use AI tools regularly at work. Very few have ever been shown what separates a prompt that produces useful output from one that doesn\u2019t.",
    stats: [
      { value: "75%", valueColour: C.teal, label: "of knowledge workers now use generative AI at work", source: "McKinsey, 2024" },
      { value: "15%", valueColour: C.error, label: "have received any structured prompting training", source: "Deloitte, 2024" },
      { value: "3\u20135\u00D7", valueColour: C.navy, label: "output quality variance from prompt structure alone", source: "MIT Sloan, 2024" },
    ],
  },

  /* Slide 2 — SITUATION — Parallel Demonstration */
  { id: 2, section: "THE REALITY", type: "parallelDemo",
    heading: "Same task. Same tool. Very different results.",
    tealWord: "Very different",
    body: "Watch what happens when the same request \u2014 summarising key findings for a stakeholder meeting \u2014 is approached two different ways.",
    footnote: "This isn\u2019t about one being right and the other wrong. It\u2019s about understanding what changes in the output \u2014 and why.",
  },

  /* Slide 3 — TENSION — Tension Statement */
  { id: 3, section: "THE GAP", type: "tensionStatement",
    heading: "You can tell when an AI output is good.",
    subheading: "But can you explain what made your prompt produce it?",
    tealPhrase: "explain what made your prompt produce it",
    footnote: "Most professionals can recognise quality in AI outputs. Very few can reliably reproduce it \u2014 because they\u2019ve never had a framework for understanding what\u2019s actually happening between their input and the AI\u2019s response.",
  },

  /* Slide 4 — TENSION — Gap Diagram */
  { id: 4, section: "THE GAP", type: "gapDiagram",
    heading: "What moves a prompt from generic to specific?",
    tealWord: "generic to specific",
  },

  /* Slide 5 — CONCEPT — The Prompt Blueprint (6-element RCTF) */
  { id: 5, section: "THE TOOLKIT", type: "rctf",
    heading: "The Prompt Blueprint: six components, one complete instruction",
    tealWord: "Prompt Blueprint",
    subheading: "Each component fills a specific gap that most prompts leave empty. You don\u2019t always need all six \u2014 but knowing what\u2019s available means you can choose deliberately.",
    elements: [
      { key: "ROLE", color: "#667EEA", light: "#EBF4FF", desc: "Who the AI should be \u2014 their expertise, perspective, and professional context", example: "You are a senior professional with 10 years of experience in organisational transformation." },
      { key: "CONTEXT", color: "#38B2AC", light: "#E6FFFA", desc: "Your situation, constraints, and what the AI needs to know about the background", example: "We\u2019re six weeks into a technology rollout. Adoption is strong in operations but the commercial teams are showing resistance." },
      { key: "TASK", color: "#ED8936", light: "#FFFBEB", desc: "Exactly what to produce \u2014 specific, unambiguous, and measurable", example: "Draft a stakeholder update on the current status, covering progress, risks, and recommended next steps." },
      { key: "FORMAT", color: "#48BB78", light: "#F0FFF4", desc: "Output shape, length, tone, and structure", example: "Three short paragraphs. Professional tone. No jargon. Maximum 300 words." },
      { key: "STEPS", color: "#9F7AEA", light: "#FAF5FF", desc: "The reasoning sequence you want the AI to follow before producing output", example: "First assess the impact of the delay, then identify the top three risks, then recommend actions for the next 48 hours." },
      { key: "CHECKS", color: "#F6AD55", light: "#FFFBEB", desc: "Validation rules and constraints the output must meet", example: "No generic phrases. Every finding must reference specific data. Flag assumptions explicitly." },
    ],
  },

  /* Slide 6 — CONCEPT — The Prompting Spectrum */
  { id: 6, section: "THE TOOLKIT", type: "spectrum",
    heading: "The Blueprint is one approach. Here are the others.",
    tealWord: "one approach",
    body: "The best prompt isn\u2019t the most structured one. It\u2019s the one that matches your situation. These three approaches sit on a spectrum from unstructured to fully specified \u2014 and all three have tasks where they\u2019re the strongest choice.",
    positions: [
      { label: "Brain Dump", desc: "Pour in everything \u2014 rough notes, half-formed thoughts, scattered observations \u2014 and let the AI find the structure. You\u2019re not organising your thinking first. You\u2019re using the AI to help you organise it.", bestFor: "Early-stage thinking, when you don\u2019t yet know what the output should look like, when speed matters more than precision.", example: "Here\u2019s everything from the session today \u2014 my rough notes, some thoughts on next steps, a few concerns I haven\u2019t fully worked through yet. Help me find the structure in this. What are the three most important themes, and what am I missing?\n\n[Paste raw notes, bullet points, voice memo transcript \u2014 unedited]" },
      { label: "Conversational", desc: "Build the output across multiple turns. Start with a clear first request, then refine, redirect, and sharpen through back-and-forth. Each turn adds specificity based on what the AI produced last.", bestFor: "Iterative work, creative exploration, when the task evolves as you work on it, when you want to steer the output progressively.", example: "Turn 1: Help me structure the key messages for a presentation to senior leadership next week.\n\nTurn 2: Good start. The audience is specifically the finance committee \u2014 they care about cost impact, not methodology. Adjust for that.\n\nTurn 3: Make the opening more direct \u2014 they\u2019re time-poor and need the business case in the first 30 seconds." },
      { label: "Structured (Blueprint)", desc: "Invest upfront in a complete, precise instruction using the Prompt Blueprint components. Everything the AI needs is in one message \u2014 no iteration required.", bestFor: "Repeatable tasks, high-stakes outputs, prompts you\u2019ll share with colleagues or save as templates, situations where consistency matters.", example: "Role: Senior professional with experience in organisational change. Context: Preparing a quarterly review for the leadership team. The audience cares about progress against milestones and risks to timeline. Task: Draft a 400-word executive summary covering progress, risks, and recommendations. Format: Three sections with headers. Professional tone. No jargon. Steps: First summarise progress against the three agreed milestones, then flag the highest-priority risk with a proposed mitigation, then recommend one action for the next quarter. Checks: Every claim must reference a specific data point. No generic phrases." },
    ],
  },

  /* Slide 7 — CONCEPT — Modifier Techniques */
  { id: 7, section: "THE TOOLKIT", type: "modifiers",
    heading: "These aren\u2019t separate approaches. They\u2019re amplifiers.",
    tealWord: "amplifiers",
    body: "Add these on top of any prompting approach \u2014 brain dump, conversational, or Blueprint. They change how the AI reasons, not what information you give it. These are established prompting techniques used across the industry.",
    pullQuote: "A Blueprint tells the AI what to work with. A modifier tells it how to think.",
  },

  /* Slide 8 — CONCEPT — When to Use What */
  { id: 8, section: "THE TOOLKIT", type: "decisionFramework",
    heading: "Two questions. The right approach every time.",
    tealWord: "right approach",
    body: "Before you open your AI tool, ask yourself these two questions. Your answers point you to the approach that fits this specific task \u2014 not a default habit.",
    pullQuote: "The skill isn\u2019t knowing the most structured technique. It\u2019s knowing which technique to reach for right now.",
  },

  /* Slide 9 — CONTRAST — Annotated Contrast */
  { id: 9, section: "NOW YOU CAN SEE IT", type: "annotatedContrast",
    heading: "Remember these two approaches? Now you can name the difference.",
    tealWord: "name the difference",
  },

  /* Slide 10 — BRIDGE — Situational Judgment */
  { id: 10, section: "APPLY IT", type: "situationalJudgment",
    heading: "Three situations. You choose the approach.",
    tealWord: "You choose",
    instruction: "For each scenario, select the prompting approach you\u2019d use. There\u2019s a strongest choice for each \u2014 tap to find out why.",
  },

  /* Slide 11 — BRIDGE — Bridge to Prompt Playground */
  { id: 11, section: "WHAT\u2019S NEXT", type: "bridge",
    heading: "Now build one.",
    body: "You\u2019ve got the toolkit \u2014 the Blueprint, the spectrum, the modifiers, and the judgment to choose between them. The next step is to use it on a real piece of work. Open the Prompt Playground, pick a task from your actual workload, and build your first prompt using the techniques from this module.",
    ctaText: "Open Prompt Playground \u2192",
    ctaHref: "#playground",
    panelHeading: "In the Playground, you\u2019ll:",
    panelItems: [
      "Choose a real task from your current work \u2014 not a practice exercise",
      "Decide which prompting approach fits the situation using the two-question framework",
      "Build your prompt using the Blueprint components, modifiers, or a combination",
      "Compare your AI output against the quality markers from this module \u2014 specificity, audience awareness, actionable recommendations",
    ],
  },
];

/* ── Data: Situational Judgment Scenarios (Slide 10) ── */
const SCENARIOS = [
  {
    scenario: "You have rough notes from a brainstorming session \u2014 bullet points, half-finished thoughts, a few voice memo transcripts. You need to identify the key themes before you can even decide what the final deliverable should be.",
    options: ["Brain Dump", "Conversational", "Structured (Blueprint)"],
    strongestChoice: 0,
    feedback: [
      { quality: "strong", text: "This is exactly what brain dumps are designed for. You don\u2019t yet know the output shape, so structuring the prompt would force premature decisions. Pour everything in and let the AI find the patterns." },
      { quality: "partial", text: "Conversational could work \u2014 you\u2019d iterate toward clarity. But with this much raw, unstructured input, a brain dump lets the AI do the initial organisation for you. You can switch to conversational once themes emerge." },
      { quality: "weak", text: "A Blueprint requires you to specify the output format, audience, and success criteria upfront. You don\u2019t have that clarity yet \u2014 that\u2019s the whole point of this task. Structure would constrain the AI\u2019s ability to surface unexpected connections." },
    ],
  },
  {
    scenario: "You need to produce a weekly status update that three different stakeholders will read. You\u2019ll need to do this same task every Friday for the next three months.",
    options: ["Brain Dump", "Conversational", "Structured (Blueprint)"],
    strongestChoice: 2,
    feedback: [
      { quality: "weak", text: "A brain dump would produce something each week, but quality would vary. With three stakeholders reading this every Friday, consistency and professionalism matter. Structure is worth the upfront investment here." },
      { quality: "partial", text: "Conversational would produce a good first output. But you\u2019d be re-doing the iteration every Friday. For repeatable tasks, invest upfront in a structured prompt and save it as a template." },
      { quality: "strong", text: "This is a repeatable, high-consistency task with a known audience and format. A Blueprint prompt you can reuse every week \u2014 just swapping in the new data \u2014 saves time and ensures consistent quality across all three months." },
    ],
  },
  {
    scenario: "You\u2019re drafting a section of a proposal and you\u2019re not sure about the right angle. You want to explore a few directions before committing to one.",
    options: ["Brain Dump", "Conversational", "Structured (Blueprint)"],
    strongestChoice: 1,
    feedback: [
      { quality: "partial", text: "A brain dump could help you surface initial ideas. But exploration requires steering \u2014 you need to react and redirect. Conversational gives you that control across turns." },
      { quality: "strong", text: "When you want to explore and steer, conversational is the strongest choice. Start with a direction, see what comes back, adjust. Each turn sharpens the output based on your reactions to the previous one. You\u2019re co-creating, not delegating." },
      { quality: "weak", text: "A Blueprint locks you into a specific format and output shape before you\u2019ve decided on the angle. For exploratory work, that structure becomes a constraint rather than an asset." },
    ],
  },
];

/* ── Data: Articles ── */
const ARTICLES = [
  { id: "a1", title: "What Separates Power Users from Everyone Else When Using AI at Work", source: "Harvard Business Review", readTime: "7 min read", desc: "How structured prompting is changing the way knowledge workers interact with AI tools \u2014 and what consistently separates professionals who get great outputs from those who get generic ones.", url: "#", reflection: "In one sentence, what was the single most useful idea from this article that you could apply to your own work this week?" },
  { id: "a2", title: "Why the Way You Ask Matters More Than the Tool You Use", source: "MIT Technology Review", readTime: "8 min read", desc: "A deep-dive into why prompt structure has more impact on output quality than model choice \u2014 with real examples from professional knowledge work across industries.", url: "#", reflection: "Describe one specific situation from your own work where structuring your prompt differently could have meaningfully improved the output you received." },
];

/* ── Data: Videos ── */
const VIDEOS = [
  { id: "v1", title: "The Prompting Spectrum in Practice", channel: "Oxygy Learning", duration: "8 min", desc: "A live walkthrough of all three prompting approaches \u2014 brain dump, conversational, and structured Blueprint \u2014 applied to the same professional task, with before-and-after comparisons at each stage.", url: "#", quiz: [
    { q: "When is a brain dump approach most effective?", options: ["When you need a repeatable template for a weekly task", "When you have unstructured thoughts and don\u2019t yet know the output shape", "When the audience requires a specific format and professional tone", "When you want to iterate across multiple turns"], correct: 1 },
    { q: "What is the primary difference between the Conversational approach and the Structured Blueprint?", options: ["Conversational is faster; Blueprint is slower", "Conversational works for creative tasks only; Blueprint works for analytical tasks only", "Conversational builds quality across turns; Blueprint specifies everything upfront in one message", "Conversational doesn\u2019t use any Blueprint components; Blueprint uses all six"], correct: 2 },
  ]},
  { id: "v2", title: "Modifier Techniques: Chain of Thought, Few-Shot, and Iterative Refinement", channel: "Oxygy Learning", duration: "6 min", desc: "How the three modifier techniques change AI reasoning \u2014 with side-by-side examples showing the impact of each modifier on the same base prompt.", url: "#", quiz: [
    { q: "Modifier techniques change how the AI _____, not what _____ you give it.", options: ["responds / feedback", "reasons / information", "formats / templates", "writes / examples"], correct: 1 },
    { q: "Which scenario would benefit most from a Few-Shot Examples modifier?", options: ["You need the AI to think step by step through a complex problem before answering", "You want to refine an output that\u2019s close but not quite right", "You need the AI to match a specific quality standard or format you\u2019ve used before", "You\u2019re brainstorming and want the AI to explore multiple angles"], correct: 2 },
  ]},
];


/* ── Reusable Components ── */
const Eyebrow = ({ t }: { t: string }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: F.b, marginTop: 0 }}>{t}</p>
);

const TU = ({ children }: { children: React.ReactNode }) => (
  <span style={{ textDecoration: "underline", textDecorationColor: C.teal, textDecorationThickness: 3, textUnderlineOffset: 5 }}>{children}</span>
);

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
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: F.b }}>{done ? `${label} \u2014 Complete \u2713` : `${label} \u2014 In Progress`}</span>
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

/* ── Expandable Accordion ── */
function Expandable({ previewContent, fullContent, label = "Show more" }: { previewContent: React.ReactNode; fullContent: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {open ? fullContent : previewContent}
      <button onClick={() => setOpen(!open)} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
        background: C.bg, fontSize: 12, fontWeight: 600, color: C.light,
        cursor: "pointer", fontFamily: F.b, marginTop: 6,
      }}>
        {open ? "Show less \u25B4" : `${label} \u25BE`}
      </button>
    </div>
  );
}


/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function Level1PromptEngineering() {
  /* ── Phase State ── */
  const [activePhase, setActivePhase] = useState("elearn");
  const [phasesDone, setPhasesDone] = useState<Set<string>>(new Set());

  /* ── E-Learning Player ── */
  const [slide, setSlide] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));

  /* ── Spectrum (Slide 6) ── */
  const [spectrumPos, setSpectrumPos] = useState(2);

  /* ── Expandable sections (Slides 2, 9) ── */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleExpand = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── Situational Judgment (Slide 10) ── */
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<number, number | null>>({ 0: null, 1: null, 2: null });

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
  };

  const nextSlide = () => {
    if (slide === SLIDES.length - 1) {
      markPhaseDone("elearn");
      setActivePhase("read");
    } else {
      goToSlide(slide + 1);
    }
  };

  const prevSlide = () => { if (slide > 0) goToSlide(slide - 1); };

  /* ================================================================
     SLIDE RENDERER
     ================================================================ */
  const renderSlide = () => {
    const s = SLIDES[slide];
    switch (s.type) {

      /* ── SLIDE 1: Evidence Opening ── */
      case "evidence": return (
        <div>
          <Eyebrow t={s.section} />
          <div className="pe-two-col" style={{ display: "flex", gap: 24 }}>
            {/* Left panel (55%) */}
            <div style={{ flex: "0 0 55%", minWidth: 0 }}>
              {renderH2(s.heading, s.tealWord)}
              <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 12px" }}>{s.body}</p>
            </div>
            {/* Right panel — stat cards (45%) */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {s.stats.map((stat: any, i: number) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, fontFamily: F.h, color: stat.valueColour, flexShrink: 0, minWidth: 60 }}>{stat.value}</span>
                  <div>
                    <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, margin: "0 0 2px", lineHeight: 1.4 }}>{stat.label}</p>
                    <p style={{ fontSize: 10, color: C.muted, fontFamily: F.b, margin: 0, fontStyle: "italic" }}>{stat.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      /* ── SLIDE 2: Parallel Demonstration ── */
      case "parallelDemo": {
        const approach1Prompt = "Summarise the key findings from yesterday\u2019s session for the steering committee.\n\n[Session transcript attached below]";
        const approach1OutputPreview = "The session covered several important topics. Key findings include progress on workstream deliverables, some challenges with timelines, and next steps for the team.";
        const approach1OutputFull = "The session covered several important topics. Key findings include progress on workstream deliverables, some challenges with timelines, and next steps for the team. The committee should note that overall the project is tracking well with a few areas requiring attention. It is recommended that the team continue to monitor progress and escalate any issues as needed.";

        const approach2PromptPreview = "You are a senior professional preparing a 300-word debrief for the steering committee. The audience includes senior leaders who care about commercial impact and timeline risk, not methodology.";
        const approach2PromptFull = "You are a senior professional preparing a 300-word debrief for the steering committee. The audience includes senior leaders who care about commercial impact and timeline risk, not methodology. Using the session transcript attached below, structure the summary as: (1) three key findings ranked by business impact, (2) one risk flagged with a proposed mitigation, (3) a clear recommendation for the next 48 hours. Keep the tone direct and evidence-based. No generic phrases \u2014 every finding must reference specific data points from the transcript.\n\n[Session transcript attached below]";

        const approach2OutputPreview = "1. Cost synergies are tracking 12% ahead of the integration case \u2014 driven by procurement consolidation in Q2. This justifies accelerating the shared-services migration by one quarter.";
        const approach2OutputFull = "1. Cost synergies are tracking 12% ahead of the integration case \u2014 driven by procurement consolidation in Q2. This justifies accelerating the shared-services migration by one quarter.\n\n2. Commercial team attrition has risen to 9.3% since the announcement \u2014 concentrated in the mid-market segment. Retention interventions should target this group specifically within the next two weeks.\n\n3. The technology migration timeline has slipped by three weeks due to a dependency on the legacy CRM data extract. Current revised go-live: 14 March.\n\nRisk: If mid-market attrition continues at this rate, Q3 revenue targets are at risk of a 4\u20136% shortfall. Proposed mitigation: accelerate the retention bonus programme approved in the last board cycle.\n\nRecommendation: Approve the revised technology timeline at Thursday\u2019s SteerCo and trigger the retention programme this week.";

        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord, 20)}
            <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 4px" }}>{s.body}</p>
            <p style={{ fontSize: 11, color: C.muted, fontStyle: "italic", margin: "0 0 14px", fontFamily: F.b }}>{s.footnote}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Card A — Approach 1 */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: C.bg, padding: "8px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const }}>APPROACH 1</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const, margin: "0 0 4px", fontFamily: F.b }}>PROMPT</p>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: F.b, color: C.body, lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 10 }}>{approach1Prompt}</div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const, margin: "0 0 4px", fontFamily: F.b }}>AI OUTPUT</p>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: F.b, color: C.light, lineHeight: 1.5 }}>
                    <Expandable
                      label="Show full output"
                      previewContent={<div style={{ position: "relative" }}><p style={{ margin: 0 }}>{approach1OutputPreview}</p><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "linear-gradient(transparent, #fff)" }} /></div>}
                      fullContent={<p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{approach1OutputFull}</p>}
                    />
                  </div>
                </div>
              </div>

              {/* Card B — Approach 2 */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: C.tealLight, padding: "8px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.tealDark, letterSpacing: 1, textTransform: "uppercase" as const }}>APPROACH 2</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const, margin: "0 0 4px", fontFamily: F.b }}>PROMPT</p>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: F.b, color: C.body, lineHeight: 1.5, marginBottom: 10 }}>
                    <Expandable
                      label="Show full prompt"
                      previewContent={<div style={{ position: "relative" }}><p style={{ margin: 0 }}>{approach2PromptPreview}</p><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "linear-gradient(transparent, #fff)" }} /></div>}
                      fullContent={<p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{approach2PromptFull}</p>}
                    />
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const, margin: "0 0 4px", fontFamily: F.b }}>AI OUTPUT</p>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: F.b, color: C.navyMid, lineHeight: 1.5 }}>
                    <Expandable
                      label="Show full output"
                      previewContent={<div style={{ position: "relative" }}><p style={{ margin: 0 }}>{approach2OutputPreview}</p><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "linear-gradient(transparent, #fff)" }} /></div>}
                      fullContent={<p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{approach2OutputFull}</p>}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ── SLIDE 3: Tension Statement ── */
      case "tensionStatement": {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <h1 style={{ fontFamily: F.h, fontSize: 26, fontWeight: 700, color: C.navy, lineHeight: 1.3, maxWidth: 600, margin: "0 0 12px" }}>{s.heading}</h1>
            <p style={{ fontFamily: F.h, fontSize: 20, fontWeight: 600, color: C.navy, lineHeight: 1.4, maxWidth: 560, margin: "0 0 20px" }}>
              {(() => {
                const phrase = s.tealPhrase || "";
                const idx = s.subheading.indexOf(phrase);
                if (idx === -1) return s.subheading;
                return <>{s.subheading.slice(0, idx)}<span style={{ color: C.teal }}>{phrase}</span>{s.subheading.slice(idx + phrase.length)}</>;
              })()}
            </p>
            <div style={{ width: 48, height: 2, background: C.border, marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: C.light, fontFamily: F.b, lineHeight: 1.7, fontStyle: "italic", maxWidth: 560, margin: 0 }}>{s.footnote}</p>
          </div>
        );
      }

      /* ── SLIDE 4: Gap Diagram ── */
      case "gapDiagram": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord)}

          <div className="pe-gap-panels" style={{ display: "flex", gap: 0, alignItems: "stretch", marginBottom: 16 }}>
            {/* Left panel */}
            <div style={{ flex: 1, borderTop: `4px solid ${C.peachDark}`, border: `1px solid ${C.border}`, borderRadius: "12px 0 0 12px", padding: "16px 18px" }}>
              <p style={{ fontFamily: F.h, fontSize: 13, fontWeight: 700, color: C.navy, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 10, marginTop: 0 }}>LOW-CONTEXT PROMPT</p>
              {["Single instruction", "No audience or constraints specified", "AI fills every gap with assumptions"].map((item, i) => (
                <p key={i} style={{ margin: "6px 0", fontSize: 12, fontFamily: F.b, color: C.body, lineHeight: 1.5, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: C.error, fontSize: 14, flexShrink: 0 }}>\u00D7</span> {item}
                </p>
              ))}
            </div>

            {/* Centre connector */}
            <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, minWidth: 140, padding: "12px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: F.b, fontSize: 10, fontWeight: 700, color: C.muted, textAlign: "center", letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 8, marginTop: 0 }}>WHAT MOVES YOU FROM HERE \u2192 TO HERE?</p>
              <div style={{ width: "100%", height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.peachDark}, ${C.muted} 40%, ${C.teal})`, opacity: 0.7, marginBottom: 10 }} />
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.tealLight, border: `2px solid ${C.teal}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.h, fontSize: 16, fontWeight: 700, color: C.teal }}>?</span>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ flex: 1, borderTop: `4px solid ${C.teal}`, border: `1px solid ${C.border}`, borderRadius: "0 12px 12px 0", padding: "16px 18px" }}>
              <p style={{ fontFamily: F.h, fontSize: 13, fontWeight: 700, color: C.navy, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 10, marginTop: 0 }}>HIGH-CONTEXT PROMPT</p>
              {["Task + surrounding information", "Audience, constraints, and success criteria included", "AI works with specifics, not assumptions"].map((item, i) => (
                <p key={i} style={{ margin: "6px 0", fontSize: 12, fontFamily: F.b, color: C.body, lineHeight: 1.5, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: C.success, fontSize: 14, flexShrink: 0 }}>\u2713</span> {item}
                </p>
              ))}
            </div>
          </div>

          {/* Teal callout */}
          <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.tealLight, borderRadius: "0 8px 8px 0", padding: "12px 16px" }}>
            <p style={{ fontFamily: F.b, fontSize: 13, color: C.navyMid, lineHeight: 1.6, margin: 0 }}>The rest of this module gives you the tools to move deliberately along this spectrum \u2014 and to choose the right position for each task.</p>
          </div>
        </div>
      );

      /* ── SLIDE 5: RCTF (6 elements, 3x2 grid) ── */
      case "rctf": return (
        <div>
          <Eyebrow t={s.section} />
          {renderH2(s.heading, s.tealWord, 20)}
          <p style={{ fontSize: 13, color: C.light, fontFamily: F.b, margin: "0 0 12px", lineHeight: 1.5 }}>{s.subheading}</p>
          <div className="pe-rctf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            {s.elements.map((el: any) => (
              <div key={el.key} style={{ background: el.light, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <span style={{ display: "inline-block", background: el.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", marginBottom: 6, fontFamily: F.b }}>{el.key}</span>
                <p style={{ fontSize: 11, color: C.body, margin: "0 0 6px", fontFamily: F.b, lineHeight: 1.4 }}>{el.desc}</p>
                <PromptBox borderColor={el.color}><span style={{ fontSize: 11 }}>{el.example}</span></PromptBox>
              </div>
            ))}
          </div>
          {/* Qualifier note */}
          <div style={{ borderLeft: `4px solid ${C.navy}`, background: C.bg, borderRadius: "0 8px 8px 0", padding: "10px 16px" }}>
            <p style={{ fontSize: 12, color: C.light, fontFamily: F.b, lineHeight: 1.6, margin: 0 }}>Role, Context, Task, and Format are the foundation. Steps and Checks add precision for high-stakes or repeatable work. Not every prompt needs all six.</p>
          </div>
        </div>
      );

      /* ── SLIDE 6: Spectrum ── */
      case "spectrum": {
        const pos = s.positions[spectrumPos];
        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord, 20)}
            <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 14px" }}>{s.body}</p>

            {/* Spectrum track */}
            <div style={{ position: "relative", height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.mint}, ${C.teal})`, marginBottom: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} onClick={() => setSpectrumPos(i)} style={{
                  position: "absolute", top: -5, left: `${i * 50}%`, transform: "translateX(-50%)",
                  width: spectrumPos === i ? 18 : 14, height: spectrumPos === i ? 18 : 14,
                  borderRadius: "50%", background: spectrumPos === i ? C.teal : "#fff",
                  border: `2px solid ${C.teal}`, cursor: "pointer", transition: "all 200ms ease",
                }} />
              ))}
            </div>

            {/* Position labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              {s.positions.map((p: any, i: number) => (
                <button key={i} onClick={() => setSpectrumPos(i)} style={{
                  background: spectrumPos === i ? C.teal : "transparent",
                  color: spectrumPos === i ? "#fff" : C.muted,
                  border: spectrumPos === i ? "none" : `1px solid ${C.border}`,
                  borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: F.b, transition: "all 200ms ease",
                }}>{p.label}</button>
              ))}
            </div>

            {/* Active panel */}
            <div style={{ background: C.bg, borderLeft: `3px solid ${C.teal}`, borderRadius: "0 8px 8px 0", padding: "14px 18px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "0 0 4px", fontFamily: F.h }}>{pos.label}</p>
              <p style={{ fontSize: 12, color: C.body, margin: "0 0 6px", fontFamily: F.b, lineHeight: 1.5 }}>{pos.desc}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.teal, margin: "0 0 6px", fontFamily: F.b }}>Best for: {pos.bestFor}</p>
              <PromptBox><span style={{ fontSize: 12 }}>{pos.example}</span></PromptBox>
            </div>
          </div>
        );
      }

      /* ── SLIDE 7: Modifier Techniques ── */
      case "modifiers": return (
        <div>
          <Eyebrow t={s.section} />
          <div className="pe-two-col" style={{ display: "flex", gap: 20 }}>
            {/* Left: text */}
            <div style={{ flex: "0 0 45%", minWidth: 0 }}>
              {renderH2(s.heading, s.tealWord, 20)}
              <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{s.body}</p>
              <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.tealLight, padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{s.pullQuote}</p>
              </div>
            </div>
            {/* Right: three modifier cards */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { pill: "CHAIN OF THOUGHT", pillBg: "#E53E3E", definition: "Ask the AI to reason through the problem step by step before producing output.", example: "Think through the three most likely objections this audience will raise before drafting the recommendation." },
                { pill: "FEW-SHOT EXAMPLES", pillBg: "#805AD5", definition: "Show the AI what good output looks like by providing 1\u20133 examples it should match.", example: "Here are two examples of strong executive summaries from previous projects: [Example A] [Example B]. Match this level of specificity and structure." },
                { pill: "ITERATIVE REFINEMENT", pillBg: "#DD6B20", definition: "Improve the output across multiple turns by giving targeted, specific feedback on what to change.", example: "This is a good start. Now make the second section more specific \u2014 it reads too similarly to the first. Add the timeline data I mentioned earlier." },
              ].map(card => (
                <div key={card.pill} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <span style={{ display: "inline-block", background: card.pillBg, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 12, padding: "2px 8px", marginBottom: 6, fontFamily: F.b }}>{card.pill}</span>
                  <p style={{ fontSize: 12, color: C.body, margin: "0 0 6px", fontFamily: F.b, lineHeight: 1.5 }}>{card.definition}</p>
                  <PromptBox borderColor={card.pillBg}><span style={{ fontSize: 11 }}>{card.example}</span></PromptBox>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      /* ── SLIDE 8: Decision Framework ── */
      case "decisionFramework": return (
        <div>
          <Eyebrow t={s.section} />
          <div className="pe-two-col" style={{ display: "flex", gap: 20 }}>
            {/* Left: text */}
            <div style={{ flex: "0 0 42%", minWidth: 0 }}>
              {renderH2(s.heading, s.tealWord, 20)}
              <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{s.body}</p>
              <div style={{ borderLeft: `4px solid ${C.teal}`, background: C.tealLight, padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 13, color: C.navyMid, fontFamily: F.b, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>{s.pullQuote}</p>
              </div>
            </div>
            {/* Right: decision framework */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Question 1 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ background: C.navy, color: "#fff", padding: "10px 16px", borderRadius: "10px 10px 0 0", fontSize: 13, fontWeight: 700, fontFamily: F.h }}>DO I KNOW EXACTLY WHAT I WANT?</div>
                <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  {[
                    { pill: "YES", pillBg: C.success, result: "Structured (Blueprint)", detail: "Specify everything upfront" },
                    { pill: "SORT OF", pillBg: "#ED8936", result: "Conversational", detail: "Build it iteratively, refine as you go" },
                    { pill: "NO", pillBg: C.error, result: "Brain Dump", detail: "Let the AI help you find the structure" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ background: row.pillBg, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px", fontFamily: F.b, minWidth: 48, textAlign: "center" }}>{row.pill}</span>
                      <span style={{ color: C.muted, fontSize: 12 }}>\u2192</span>
                      <div>
                        <span style={{ fontWeight: 600, color: C.navy, fontSize: 12, fontFamily: F.b }}>{row.result}</span>
                        <p style={{ fontSize: 11, color: C.light, margin: 0, fontFamily: F.b }}>{row.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector line */}
              <div style={{ display: "flex", justifyContent: "center", height: 16 }}>
                <div style={{ width: 1, height: "100%", background: C.border }} />
              </div>

              {/* Question 2 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ background: C.navy, color: "#fff", padding: "10px 16px", borderRadius: "10px 10px 0 0", fontSize: 13, fontWeight: 700, fontFamily: F.h }}>WILL I NEED THIS OUTPUT PATTERN AGAIN?</div>
                <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  {[
                    { pill: "YES", pillBg: C.teal, result: "Save as a template", detail: "Use the Blueprint \u2014 it\u2019s reusable by design" },
                    { pill: "NO", pillBg: C.muted, result: "Use whichever approach fits Question 1", detail: "Optimise for this task, not future ones" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: i < 1 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ background: row.pillBg, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px", fontFamily: F.b, minWidth: 48, textAlign: "center" }}>{row.pill}</span>
                      <span style={{ color: C.muted, fontSize: 12 }}>\u2192</span>
                      <div>
                        <span style={{ fontWeight: 600, color: C.navy, fontSize: 12, fontFamily: F.b }}>{row.result}</span>
                        <p style={{ fontSize: 11, color: C.light, margin: 0, fontFamily: F.b }}>{row.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modifier note */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, color: C.light, fontFamily: F.b, margin: 0, lineHeight: 1.5 }}>For any approach, consider adding a modifier if the task involves complex reasoning (Chain of Thought), quality calibration (Few-Shot), or multi-step refinement (Iterative).</p>
              </div>
            </div>
          </div>
        </div>
      );

      /* ── SLIDE 9: Annotated Contrast ── */
      case "annotatedContrast": {
        const approach1Prompt = "Summarise the key findings from yesterday\u2019s session for the steering committee.\n\n[Session transcript attached below]";
        const approach2PromptFull = "You are a senior professional preparing a 300-word debrief for the steering committee. The audience includes senior leaders who care about commercial impact and timeline risk, not methodology. Using the session transcript attached below, structure the summary as: (1) three key findings ranked by business impact, (2) one risk flagged with a proposed mitigation, (3) a clear recommendation for the next 48 hours. Keep the tone direct and evidence-based. No generic phrases \u2014 every finding must reference specific data points from the transcript.\n\n[Session transcript attached below]";
        const approach2PromptPreview = "You are a senior professional preparing a 300-word debrief for the steering committee. The audience includes senior leaders who care about commercial impact and timeline risk, not methodology.";

        const leftAnnotations = [
          { component: "ROLE", color: "#667EEA", text: "No role specified \u2014 AI defaults to a generic assistant voice" },
          { component: "CONTEXT", color: "#38B2AC", text: "No audience \u2014 AI doesn\u2019t know what the steering committee cares about" },
          { component: "FORMAT", color: "#48BB78", text: "No format or constraints \u2014 AI guesses at length, tone, and structure" },
        ];
        const rightAnnotations = [
          { component: "ROLE", color: "#667EEA", text: "\u2018Senior professional\u2019 \u2014 gives the AI an expertise level and professional perspective" },
          { component: "CONTEXT", color: "#38B2AC", text: "\u2018Leaders who care about commercial impact and timeline risk\u2019 \u2014 tells the AI what matters to the audience" },
          { component: "TASK", color: "#ED8936", text: "\u2018Structure the summary as three findings, one risk, one recommendation\u2019 \u2014 specific and measurable" },
          { component: "FORMAT", color: "#48BB78", text: "\u2018300-word debrief, direct and evidence-based\u2019 \u2014 clear shape, tone, and length" },
          { component: "STEPS", color: "#9F7AEA", text: "\u2018Ranked by business impact\u2019 \u2014 tells the AI the reasoning sequence to follow" },
          { component: "CHECKS", color: "#F6AD55", text: "\u2018No generic phrases, reference specific data points\u2019 \u2014 validation rules that prevent filler" },
        ];

        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord, 20)}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Left — Approach 1 decoded */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: C.bg, padding: "8px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase" as const }}>APPROACH 1 \u2014 DECODED</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: F.b, color: C.body, lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 8 }}>{approach1Prompt}</div>
                  <Expandable
                    label="Show what\u2019s missing"
                    previewContent={null}
                    fullContent={
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                        {leftAnnotations.map((a, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "inline-block", background: a.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px", fontFamily: F.b, flexShrink: 0 }}>{a.component}</span>
                            <span style={{ fontSize: 11, color: C.body, fontFamily: F.b }}>{a.text}</span>
                          </div>
                        ))}
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Right — Approach 2 decoded */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: C.tealLight, padding: "8px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.tealDark, letterSpacing: 1, textTransform: "uppercase" as const }}>APPROACH 2 \u2014 DECODED</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontFamily: F.b, color: C.body, lineHeight: 1.5, marginBottom: 8 }}>
                    <Expandable
                      label="Show full prompt"
                      previewContent={<div style={{ position: "relative" }}><p style={{ margin: 0 }}>{approach2PromptPreview}</p><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "linear-gradient(transparent, #fff)" }} /></div>}
                      fullContent={<p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{approach2PromptFull}</p>}
                    />
                  </div>
                  <Expandable
                    label="Show Blueprint mapping"
                    previewContent={null}
                    fullContent={
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                        {rightAnnotations.map((a, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "inline-block", background: a.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 8px", fontFamily: F.b, flexShrink: 0 }}>{a.component}</span>
                            <span style={{ fontSize: 11, color: C.body, fontFamily: F.b }}>{a.text}</span>
                          </div>
                        ))}
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ── SLIDE 10: Situational Judgment ── */
      case "situationalJudgment": {
        const allAnswered = Object.values(scenarioAnswers).every(v => v !== null);
        const correctCount = SCENARIOS.reduce((acc, sc, i) => acc + (scenarioAnswers[i] === sc.strongestChoice ? 1 : 0), 0);
        return (
          <div>
            <Eyebrow t={s.section} />
            {renderH2(s.heading, s.tealWord, 20)}
            <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 14px" }}>{s.instruction}</p>

            <div className="pe-scenario-cards" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SCENARIOS.map((sc, si) => {
                const selected = scenarioAnswers[si];
                return (
                  <div key={si} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", background: "#fff" }}>
                    <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, lineHeight: 1.5, margin: "0 0 10px" }}>{sc.scenario}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: selected !== null ? 8 : 0 }}>
                      {sc.options.map((opt, oi) => {
                        const isSelected = selected === oi;
                        const isStrongest = selected !== null && oi === sc.strongestChoice;
                        let bg = "#fff", border = `1px solid ${C.border}`, color = C.body;
                        if (isSelected && selected !== null) {
                          const quality = sc.feedback[oi].quality;
                          if (quality === "strong") { bg = C.successLight; border = `2px solid ${C.success}`; color = C.navy; }
                          else if (quality === "partial") { bg = C.tealLight; border = `2px solid ${C.teal}`; color = C.navy; }
                          else { bg = C.errorLight; border = `2px solid ${C.error}`; color = C.navy; }
                        }
                        return (
                          <button key={oi} onClick={() => setScenarioAnswers(prev => ({ ...prev, [si]: oi }))}
                            style={{ background: bg, border, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color, cursor: "pointer", fontFamily: F.b, transition: "all 200ms ease", minHeight: 36 }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {selected !== null && (
                      <div style={{ background: sc.feedback[selected].quality === "strong" ? C.successLight : sc.feedback[selected].quality === "partial" ? C.tealLight : C.errorLight, borderRadius: 8, padding: "8px 12px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F.b, textTransform: "uppercase" as const, letterSpacing: 1,
                          color: sc.feedback[selected].quality === "strong" ? C.success : sc.feedback[selected].quality === "partial" ? C.teal : C.error,
                        }}>{sc.feedback[selected].quality === "strong" ? "STRONGEST CHOICE" : sc.feedback[selected].quality === "partial" ? "COULD WORK" : "LESS EFFECTIVE"}</span>
                        <p style={{ fontSize: 12, color: C.body, fontFamily: F.b, lineHeight: 1.5, margin: "4px 0 0" }}>{sc.feedback[selected].text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allAnswered && (
              <p style={{ fontSize: 12, color: C.muted, fontFamily: F.b, textAlign: "center", marginTop: 12 }}>You matched {correctCount} of 3 strongest choices.</p>
            )}
          </div>
        );
      }

      /* ── SLIDE 11: Bridge ── */
      case "bridge": return (
        <div style={{ display: "flex", gap: 0, borderRadius: 16, overflow: "hidden", height: "100%" }}>
          {/* Left panel (55%) */}
          <div style={{ flex: "0 0 55%", background: C.teal, padding: "28px 32px", display: "flex", flexDirection: "column" }}>
            <Eyebrow t={s.section} />
            <h2 style={{ fontFamily: F.h, fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>{s.heading}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontFamily: F.b, lineHeight: 1.7, maxWidth: 420, margin: "0 0 20px" }}>{s.body}</p>
            <a href={s.ctaHref} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "12px 28px", borderRadius: 24, minHeight: 44,
              background: "#fff", color: C.teal, fontSize: 14, fontWeight: 700,
              textDecoration: "none", fontFamily: F.b, alignSelf: "flex-start", border: "none",
            }}>{s.ctaText}</a>
          </div>
          {/* Right panel (45%) */}
          <div style={{ flex: 1, background: "rgba(0,0,0,0.15)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16, fontFamily: F.h, marginTop: 0 }}>{s.panelHeading}</p>
            {s.panelItems.map((item: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", flexShrink: 0, marginTop: 5 }} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontFamily: F.b, lineHeight: 1.6, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      );

      default: return <p>Unknown slide type: {s.type}</p>;
    }
  };


  /* ================================================================
     READ PHASE
     ================================================================ */
  const renderReadPhase = () => (
    <div>
      <PhaseLabel label="Phase 2: Read" time="~15 min" done={phasesDone.has("read")} />
      <div className="pe-article-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {ARTICLES.map((article, idx) => {
          const st = articleState[article.id] || { clicked: false, reflectionText: "", submitted: false };
          return (
            <div key={article.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: st.submitted ? C.successLight : C.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 4px", fontFamily: F.b }}>Article {idx + 1} \u00B7 {article.readTime} \u00B7 {article.source}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: st.submitted ? C.light : C.navy, fontFamily: F.h, margin: 0, textDecoration: st.submitted ? "line-through" : "none" }}>{article.title}</p>
                </div>
                {st.submitted && <span style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>\u2713</span>}
              </div>
              {/* Body */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{article.desc}</p>
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setArticleState(prev => ({ ...prev, [article.id]: { ...st, clicked: true } }))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 24, border: `1px solid ${C.teal}`, color: C.teal, fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F.b }}>
                  Read article \u2197
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
                      <Btn onClick={() => setArticleState(prev => ({ ...prev, [article.id]: { ...st, submitted: true } }))} disabled={!st.reflectionText.trim()}>Submit reflection \u2192</Btn>
                    </div>
                  </div>
                )}
                {st.submitted && (
                  <div style={{ marginTop: 12, background: C.successLight, borderRadius: 8, padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: C.success, fontWeight: 600, margin: 0, fontFamily: F.b }}>Reflection submitted \u2713</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {readDone && (
        <div style={{ textAlign: "right" }}>
          <Btn onClick={() => { markPhaseDone("read"); setActivePhase("watch"); }}>Continue to Watch \u2192</Btn>
        </div>
      )}
    </div>
  );


  /* ================================================================
     WATCH PHASE
     ================================================================ */
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
                  <span style={{ color: C.teal, fontSize: 20 }}>\u25B6</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 2px", fontFamily: F.b }}>Video {idx + 1} \u00B7 {video.duration} \u00B7 {video.channel}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: videoComplete ? C.light : C.navy, fontFamily: F.h, margin: 0, textDecoration: videoComplete ? "line-through" : "none" }}>{video.title}</p>
                </div>
                {videoComplete && <span style={{ color: C.success, fontSize: 18, fontWeight: 700 }}>\u2713</span>}
              </div>
              {/* Body */}
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: C.body, fontFamily: F.b, lineHeight: 1.6, margin: "0 0 12px" }}>{video.desc}</p>
                <a href={video.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setVideoState(prev => ({ ...prev, [video.id]: { ...st, clicked: true } }))}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 24, background: C.teal, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F.b, minHeight: 44 }}>
                  \u25B6 Watch video
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
                            <p style={{ fontSize: 12, color: st.quizAnswers[qi] === q.correct ? C.success : C.error, fontWeight: 600, margin: 0, fontFamily: F.b }}>{st.quizAnswers[qi] === q.correct ? "Correct!" : `Incorrect \u2014 the answer is: ${q.options[q.correct]}`}</p>
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
          <Btn onClick={() => { markPhaseDone("watch"); setActivePhase("practice"); }}>Go to Prompt Playground \u2192</Btn>
        </div>
      )}
    </div>
  );


  /* ================================================================
     HANDOFF CTA (Practice Phase)
     ================================================================ */
  const renderHandoff = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: 48, textAlign: "center", maxWidth: 500 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.tealLight, border: `2px solid ${C.mint}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: C.teal }}>\u25C8</div>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, margin: "0 0 8px", fontFamily: F.b, textTransform: "uppercase" as const }}>NEXT STEP</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: F.h, margin: "0 0 8px" }}>Prompt Playground</h2>
        <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, margin: "0 0 20px" }}>Apply your prompting skills to a real task from your own work. Build prompts, choose your approach, test the modifiers, and compare your outputs against the quality markers from this module \u2014 then save your best work to your personal prompt library.</p>
        <a href="#playground" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 28px", borderRadius: 24, background: C.teal, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: F.b }}>Open Prompt Playground \u2192</a>
      </div>
    </div>
  );


  /* ================================================================
     JOURNEY STRIP
     ================================================================ */
  const renderJourneyStrip = () => (
    <div className="pe-journey-strip" style={{ marginTop: 32, marginBottom: 32 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 12, fontFamily: F.b }}>LEARNING JOURNEY \u2014 LEVEL 1</p>
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
                  <span style={{ fontSize: 12, color: prevDone ? C.teal : C.muted }}>\u203A</span>
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
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>\u2713</span>
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


  /* ================================================================
     PAGE HERO
     ================================================================ */
  const renderHero = () => (
    <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "24px 0 28px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
        {/* Breadcrumb */}
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px", fontFamily: F.b }}>
          <a href="#course-resources" style={{ color: C.muted, textDecoration: "none" }}>Course Resources</a> <span style={{ margin: "0 4px" }}>\u203A</span>
          <span>Level 1</span> <span style={{ margin: "0 4px" }}>\u203A</span>
          <span style={{ color: C.body }}>Prompt Engineering</span>
        </p>
        <div className="pe-hero-cols" style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <span style={{ display: "inline-block", background: C.mint, color: C.tealDark, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 8, fontFamily: F.b, textTransform: "uppercase" as const }}>LEVEL 1</span>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 8px", fontFamily: F.b }}>FOUNDATIONS & AWARENESS</p>
            <h1 style={{ fontFamily: F.h, fontSize: 28, fontWeight: 800, color: C.navy, lineHeight: 1.2, margin: "0 0 12px" }}>
              <TU>Prompt Engineering</TU> Essentials
            </h1>
            <p style={{ fontSize: 14, color: C.body, fontFamily: F.b, lineHeight: 1.7, maxWidth: 600, margin: "0 0 16px" }}>
              Learn what separates professionals who get consistently excellent AI outputs from those who get generic ones \u2014 and build the skills to join the first group. This module covers the full prompting toolkit: from unstructured brain dumps to structured blueprints, and the judgment to know which approach fits each situation.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["~45 min total", "11 slides", "Interactive", "Beginner friendly"].map(tag => (
                <span key={tag} style={{ padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.body, fontWeight: 600, fontFamily: F.b }}>{tag}</span>
              ))}
            </div>
          </div>
          {/* Right: Progress */}
          <div style={{ minWidth: 200, textAlign: "center", padding: "20px 24px", background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
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


  /* ================================================================
     MAIN RENDER
     ================================================================ */
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
              {/* Content area — 460px fixed height per SKILL */}
              <div className="pe-player-content" style={{ height: 460, overflowY: "auto" as const, padding: "36px 48px" }}>
                {renderSlide()}
              </div>
              {/* Nav bar */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                <Btn onClick={prevSlide} disabled={slide === 0} secondary>\u2190 Previous</Btn>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" as const, fontFamily: F.b }}>{s.section}</span>
                <Btn onClick={nextSlide}>{slide === SLIDES.length - 1 ? "Finish E-Learning \u2192" : "Next \u2192"}</Btn>
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
