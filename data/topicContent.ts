import samImg from '../src/assets/face-icons/sam.png';
import priyaImg from '../src/assets/face-icons/priya.png';
import marcusImg from '../src/assets/face-icons/marcus.png';
import aishaImg from '../src/assets/face-icons/aisha.png';
import jordanImg from '../src/assets/face-icons/jordan.png';

/**
 * Topic Content Registry
 *
 * All e-learning slide content, articles, and videos for every level/topic.
 * Keyed by `${level}-${topicId}` (e.g. "1-1" for Level 1 Topic 1).
 *
 * Components (ELearningView, ReadView, WatchView) receive content via props
 * from AppCurrentLevel, which looks it up here.
 */

/* ── Types ── */
export interface SlideData {
  section: string;
  type: string;
  heading: string;
  tealWord?: string;
  body?: string;
  subheading?: string;
  tealPhrase?: string;
  footnote?: string;
  elements?: Array<{ key: string; color: string; light?: string; desc: string; example?: string; whyItMatters?: string; icon?: string }>;
  positions?: Array<{ label: string; desc: string; bestFor?: string; example: string }>;
  /* courseIntro fields */
  levelNumber?: number;
  topicIcon?: string;
  objectives?: string[];
  estimatedTime?: string;
  /* gapDiagram example prompts */
  badPrompt?: string;
  goodPrompt?: string;
  gapNote?: string;
  /* Annotated prompt segments for gapDiagram */
  promptAnnotations?: Array<{ text: string; component: string; color: string }>;
  /* source logos for evidence slides */
  sourceLogo?: boolean;
  pullQuote?: string;
  revealOnNext?: boolean;
  stats?: Array<{ value: string; valueColour: string; label: string; source: string; desc?: string; logoPath?: string; visualType?: 'dotGrid' | 'barComparison' | 'adoptionGap' | 'weekBlocks' | 'performanceGap' }>;
  scenarios?: ScenarioData[];
  ctaText?: string;
  ctaHref?: string;
  panelHeading?: string;
  panelItems?: string[];
  instruction?: string;
  leftAnnotations?: Array<{ component: string; color: string; text: string }>;
  rightAnnotations?: Array<{ component: string; color: string; text: string }>;
  approach1Prompt?: string;
  approach1OutputPreview?: string;
  approach1OutputFull?: string;
  approach2PromptPreview?: string;
  approach2PromptFull?: string;
  approach2OutputPreview?: string;
  approach2OutputFull?: string;
  modifiers?: Array<{ pill: string; pillBg: string; definition: string; whyItMatters: string; example: string }>;
  decisionQ1?: Array<{ pill: string; pillBg: string; result: string; detail: string }>;
  decisionQ2?: Array<{ pill: string; pillBg: string; result: string; detail: string }>;
  modifierNote?: string;
  /* Persona case study cards */
  personas?: Array<{ name: string; role: string; icon: string; color: string; task: string; technique: string; prompt: string; outcome: string }>;
  /* Toolkit overview items */
  toolkitItems?: Array<{ label: string; icon: string; color: string; desc: string; whenToUse: string; relationship?: string }>;
  /* Approach matrix */
  matrixData?: { situations: Array<{ label: string; icon: string }>; approaches: string[]; cells: Array<{ rating: 'best' | 'ok' | 'weak'; tip: string }[]> };
  /* Quiz slide fields */
  question?: string;
  quizOptions?: string[];
  correct?: number;
  explanation?: string;
  quizEyebrow?: string;
  eyebrow?: string;
  /* Comparison slide fields */
  scenario?: string;
  tabs?: Array<{ label: string; prompt: string; annotation: string }>;
  /* Flipcard slide fields */
  cards?: Array<{ frontLabel: string; frontBadge: string; frontPrompt: string; backLabel: string; backBadge: string; backPrompt: string; backResponse: string }>;
  /* Branching slide fields */
  branchingOptions?: Array<{ label: string; prompt: string; responseQuality: string; response: string; reflection: string }>;
  /* Templates slide fields */
  templateItems?: Array<{ id: string; name: string; tag: string; tagColor: string; template: string }>;
  /* Concept visual panel identifier */
  visualId?: string;
  /* Title slide meta pills */
  meta?: string[];
  /* Individual persona slide (L1 v2) */
  personaData?: {
    name: string; initial: string; role: string; color: string; iconPath?: string;
    scenario?: string;
    tags: string[]; approach: string; approachDef: string; bestFor: string;
    prompt: string; output: string; why: string;
    modifier?: string | null; modDef?: string | null;
  };
  /* Individual situational judgment exercise (L1 v2) */
  sjData?: {
    situationNum: number; heading: string; body: string; bullets: string[];
    options: string[]; correct: number; feedback: string[];
  };
  /* buildAPrompt slide fields */
  buildTask?: string;
  buildComponents?: Array<{
    key: string; color: string; light: string;
    chipLabel: string; dropHint: string; filledText: string;
  }>;
  buildAssembledPrompt?: string;
  buildInsight?: string;
  /* predictFirst persona fields */
  predictFirst?: boolean;
  predictOptions?: string[];
  predictCorrect?: number;
  predictFeedback?: string[];
  /* dragSort slide fields */
  dragContext?: string;
  dragZones?: Array<{ id: string; label: string; color: string; light: string; icon: string }>;
  dragItems?: Array<{ id: string; label: string; correctZone: string }>;
  /* Standardised slide takeaway (shown as header on every slide) */
  takeaway?: string;
  /* External source citation (shown as a small link at the bottom of the slide) */
  sourceLink?: string;
  sourceText?: string;
  /* Approach cards — used by approachIntro (L1) and data-driven moduleSummary (L3+) */
  approaches?: Array<{ icon: string; label?: string; name?: string; color: string; light: string; when?: string; tagline?: string; how?: string; connection?: string }>;
  /* Voiceover narration — paths to static audio files in public/audio/ */
  voiceover?: {
    setup: string;       // audio file path (e.g. "/audio/l1t1-s01-setup.mp3"), plays on slide load
    reveal?: string;     // only on predictFirst persona slides — plays after prediction submitted
  };
}

export interface ScenarioData {
  scenario: string;
  options: string[];
  strongestChoice: number;
  feedback: Array<{ quality: string; text: string }>;
  /* Optional persona framing */
  personaName?: string;
  personaRole?: string;
  personaIcon?: string;
}

export interface ArticleData {
  id: string;
  title: string;
  source: string;
  readTime: string;
  desc: string;
  url: string;
  reflection: string;
}

export interface VideoData {
  id: string;
  title: string;
  channel: string;
  duration: string;
  desc: string;
  url: string;
  quiz: Array<{ q: string; options: string[]; correct: number }>;
}

export interface TopicContent {
  slides: SlideData[];
  articles: ArticleData[];
  videos: VideoData[];
}


/* ══════════════════════════════════════════════════════════════════
   LEVEL 1, TOPIC 1 — Prompt Engineering
   ══════════════════════════════════════════════════════════════════ */

const L1T1_SLIDES: SlideData[] = [
  /* ── Slide 1 — Course Intro ── */
  { section: "PROMPT ENGINEERING", type: "courseIntro",
    heading: "Prompt Engineering Essentials",
    subheading: "Learn the full prompting toolkit — from brain dumps to structured blueprints — through five professionals who've each figured out what works.",
    levelNumber: 1,
    estimatedTime: "~25 min",
    objectives: [
      "Why the same AI tools produce wildly different results across professionals",
      "The six-component Prompt Blueprint framework (RCTF + Steps + Checks)",
      "Five prompting approaches and when to use each",
      "How to choose the right technique for any task you face",
    ],
    voiceover: {
      setup: "/audio/l1t1-s01-setup.mp3",
    },
  },

  /* ── Slide 2 — Adoption Has Surged ── */
  { section: "THE REALITY", type: "evidenceHero",
    takeaway: "75% of professionals use AI daily — but results vary dramatically",
    heading: "Adoption has surged.",
    tealWord: "surged",
    body: "AI tools are no longer experimental. They're embedded in the daily workflows of most knowledge workers — across every function, every level, every industry.",
    stats: [{ value: "75%", valueColour: "#38B2AC", label: "of knowledge workers now use AI at work", source: "Microsoft & LinkedIn", desc: "2024 Work Trend Index" }],
    pullQuote: "75% of your colleagues, clients, and competitors. The tools are already in the room.",
    sourceLink: "https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part",
    sourceText: "Microsoft & LinkedIn: 2024 Work Trend Index \u2014 survey of 31,000 people across 31 countries (May 2024)",
    voiceover: {
      setup: "/audio/l1t1-s02-setup.mp3",
    },
  },

  /* ── Slide 3 — Same Tools, Very Different Results ── */
  { section: "THE REALITY", type: "chart",
    takeaway: "Access to the tool is equal — skill with it is not",
    heading: "Same tools. Very different results.",
    tealWord: "Very different",
    body: "Same tool. Same AI. Up to 9× more output — just from knowing how to use it.\n\nThe difference between +14% and +126% isn't the technology. It's the skill of the person using it.",
    pullQuote: "The bar keeps moving. Being an AI user isn't enough — being a skilled one is what creates the gap.",
    sourceLink: "https://www.nngroup.com/articles/ai-tools-productivity-gains/",
    sourceText: "NN/G meta-analysis (2023) of: Brynjolfsson, Li & Raymond (NBER/Stanford/MIT, 2023); Noy & Zhang (MIT, 2023); GitHub Copilot Research (GitHub, 2022)",
    voiceover: {
      setup: "/audio/l1t1-s03-setup.mp3",
    },
  },

  /* ── Slide 4 — Prompting Is the Foundation ── */
  { section: "THE REALITY", type: "pyramid",
    takeaway: "Every advanced AI capability is built on top of prompting",
    heading: "Prompting is the foundation everything else is built on.",
    tealWord: "foundation",
    body: "Every AI agent, automated workflow, intelligent dashboard, and full-stack application runs on prompts. Get the foundation right and every layer above it gets better.",
    pullQuote: "Every level of the OXYGY framework builds on the skills from this one. This is where it starts.",
    voiceover: {
      setup: "/audio/l1t1-s04-setup.mp3",
    },
  },

  /* ── Slide 5 — Manager Onboarding Scenario ── */
  { section: "SEE THE DIFFERENCE", type: "scenarioComparison",
    takeaway: "Your instructions determine the quality of every output",
    heading: "Same task. Same person. Completely different result.",
    body: "Imagine you're onboarding a new team member. They're capable and eager — but they only know what you tell them. You need them to produce a stakeholder summary by end of day. Toggle between two ways you could brief them and see how the output changes.",
    pullQuote: "The capability is the same in both cases. The difference is entirely in how you briefed them.",
    tabs: [
      {
        label: "Rushed Handover",
        prompt: "Hey, can you put together a summary for the leadership meeting tomorrow? They'll want the key updates.",
        shortOutput: "The project is going well overall. There have been some challenges but the team is tracking against their deliverables. A few timeline items to be aware of. Things are generally on track and we should continue to monitor progress going forward.",
        checks: [false, false, true, false, false, false],
      },
      {
        label: "Thorough Onboarding",
        prompt: "Audience is CFO + two divisional heads — they care about commercial impact and timeline risk. Three findings ranked by impact, biggest risk + mitigation, one recommendation. Under 400 words, direct tone.",
        shortOutput: "1. Cost synergies tracking 12% ahead — procurement driving it.\n2. Mid-market attrition at 9.3% — retention intervention needed within 2 weeks.\n3. Tech migration slipped 3 weeks. Revised go-live: 14 March.\n\nRisk: Q3 revenue shortfall of 4–6% if attrition continues.\nRecommendation: Approve revised timeline at SteerCo Thursday.",
        checks: [false, true, true, true, true, true],
      },
    ],
    voiceover: {
      setup: "/audio/l1t1-s05-setup.mp3",
    },
  },

  /* ── Slide 6 — Interactive Context Bar ── */
  { section: "SEE THE DIFFERENCE", type: "contextBar", takeaway: "Six context elements separate weak prompts from strong ones",
    heading: "Context is the fuel. Fill the tank.",
    tealWord: "Fill the tank",
    body: "Each component you provide eliminates a set of assumptions. Press Next to reveal each one.",
    voiceover: {
      setup: "/audio/l1t1-s06-setup.mp3",
    },
  },

  /* ── Slide 7 — Build A Prompt ── */
  {
    section: "THE TOOLKIT",
    type: "buildAPrompt",
    takeaway: "Assembling all six elements produces a prompt that leaves nothing to chance",
    heading: "Build a prompt from scratch.",
    tealWord: "prompt",
    body: "Drag each component into the right slot. Watch the prompt take shape as you add each layer.",
    buildTask: "You need to produce a one-page summary of last quarter's employee engagement survey results. The audience is the executive team. They want to know the top three themes, what's improved since last year, and one recommendation.",
    buildComponents: [
      { key: "Role", color: "#667EEA", light: "#EBF4FF", chipLabel: "Role", chipText: "Senior HR analyst presenting people data to execs", dropHint: "Who are you asking the AI to be?", filledText: "Act as a senior HR analyst with experience presenting people data to executive audiences." },
      { key: "Context", color: "#38B2AC", light: "#E6FFFA", chipLabel: "Context", chipText: "Q3 engagement survey, year-on-year data, exec review in 10 min", dropHint: "What background does the AI need?", filledText: "This is for our Q3 engagement survey. We ran the same survey last year so year-on-year comparison is possible. The exec team has 10 minutes to review this before a board meeting." },
      { key: "Task", color: "#ED8936", light: "#FFFBEB", chipLabel: "Task", chipText: "One-page summary: top 3 themes, YoY improvement, 1 recommendation", dropHint: "What exactly do you need?", filledText: "Write a one-page executive summary covering: (1) the top three themes from the survey, (2) what has improved vs last year, and (3) one clear recommendation." },
      { key: "Format", color: "#48BB78", light: "#F0FFF4", chipLabel: "Format", chipText: "3 sections, bold headers, max 80 words each, prose only", dropHint: "How should the output be structured?", filledText: "Use three short sections with bold headers. Each section max 80 words. No bullet points — flowing prose only. Professional tone." },
      { key: "Steps", color: "#9F7AEA", light: "#FAF5FF", chipLabel: "Steps", chipText: "ID themes → compare YoY → derive recommendation", dropHint: "What process should the AI follow?", filledText: "First identify the three highest-scoring themes by frequency across responses. Then compare scores to last year's data. Then derive one recommendation from the biggest gap or opportunity." },
      { key: "Checks", color: "#F6AD55", light: "#FFFAF0", chipLabel: "Checks", chipText: "No raw % unless in data. No speculation. Flag missing YoY data.", dropHint: "What quality rules must it follow?", filledText: "Do not include raw percentages unless they appear in the source data. Do not speculate beyond what the data shows. Flag if year-on-year comparison is not possible for any theme." },
    ],
    buildAssembledPrompt: "Act as a senior HR analyst with experience presenting people data to executive audiences.\n\nThis is for our Q3 engagement survey. We ran the same survey last year so year-on-year comparison is possible. The exec team has 10 minutes to review this before a board meeting.\n\nWrite a one-page executive summary covering: (1) the top three themes from the survey, (2) what has improved vs last year, and (3) one clear recommendation.\n\nUse three short sections with bold headers. Each section max 80 words. No bullet points — flowing prose only. Professional tone.\n\nFirst identify the three highest-scoring themes by frequency across responses. Then compare scores to last year's data. Then derive one recommendation from the biggest gap or opportunity.\n\nDo not include raw percentages unless they appear in the source data. Do not speculate beyond what the data shows. Flag if year-on-year comparison is not possible for any theme.",
    buildInsight: "A complete Blueprint prompt doesn't just tell the AI what to produce \u2014 it tells it who to be, what it's working with, how to think, and what to avoid. Each component removes a set of assumptions the AI would otherwise have to make.",
    voiceover: {
      setup: "/audio/l1t1-s07-setup.mp3",
    },
  },

  /* ── Slide 8 — Spot the Flaw ── */
  {
    section: "TEST YOURSELF",
    type: "spotTheFlaw",
    takeaway: "A prompt missing even one element leaves the AI to guess",
    heading: "Spot the missing element.",
    tealWord: "missing element",
    body: "Read the prompt below. One Blueprint component is completely absent. Can you identify which one?",
    buildTask: "You are a senior strategy analyst — our B2B SaaS churn rose from 9% to 14% last quarter among 6–12 month accounts — identify the top three churn drivers, break them down by company size, and suggest two retention initiatives ranked by impact for a report our Head of Customer Success will present at next week's leadership review, flagging any conclusions where the data is too thin to be confident.",
    quizOptions: ["Role", "Context", "Task", "Format", "Steps", "Checks"],
    correct: 3,
    explanation: "The prompt has a clear task and some context \u2014 but it gives the AI zero guidance on how the output should be structured. Should it be a slide deck, a memo, a table, a bulleted list? The AI will guess. Adding a Format instruction (e.g. 'Two-page memo, section headers, executive tone') removes that ambiguity entirely.",
    voiceover: {
      setup: "/audio/l1t1-s08-setup.mp3",
    },
  },

  /* ── Slide 9 — The Three Approaches Intro ── */
  {
    section: "THE APPROACHES",
    type: "approachIntro",
    takeaway: "The Blueprint isn't always the right tool — knowing when to use each approach is the real skill",
    heading: "Three ways to prompt. Each built for a different situation.",
    tealWord: "Three",
    body: "You've mastered the Blueprint — the structured six-component framework. But skilled prompting means knowing when to reach for it, and when a different approach gets you there faster. The three approaches below sit on a spectrum from unstructured to precise. Meet the people who use each one.",
    approaches: [
      {
        name: "Brain Dump",
        icon: "🧠",
        color: "#ED8936",
        light: "#FFFBEB",
        tagline: "Let the AI find the structure",
        when: "Your thinking is unorganised. You don't know what shape the output should take yet.",
        how: "Pour everything in — raw notes, scattered thoughts, voice memo transcripts. The AI becomes your thinking partner, not your executor.",
        connection: "Pre-Blueprint. Use this when you can't fill in the Blueprint yet.",
      },
      {
        name: "Conversational",
        icon: "💬",
        color: "#805AD5",
        light: "#FAF5FF",
        tagline: "Co-create across multiple turns",
        when: "You have a direction but not the full picture. You want to refine as you go.",
        how: "Start with a loose brief, then steer turn by turn — sharpen the angle, push back on output, redirect. You're building through dialogue.",
        connection: "Partial Blueprint. You know the task but discover format and checks as you go.",
      },
      {
        name: "Blueprint",
        icon: "⚡",
        color: "#667EEA",
        light: "#EBF4FF",
        tagline: "Six components. One complete prompt.",
        when: "You know exactly what you need — the output shape, the audience, the constraints.",
        how: "Specify Role, Context, Task, Format, Steps, and Checks upfront. Zero ambiguity. Repeatable, shareable, consistent quality every time.",
        connection: "Full framework. Use this when precision matters more than speed.",
      },
    ],
    voiceover: {
      setup: "/audio/l1t1-s09-setup.mp3",
    },
  },

  /* ── Slide 10 — Sam the Brain Dumper ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Sam — Programme Coordinator",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 0, predictFeedback: ["Exactly right. Sam's input is unstructured by nature — rough notes, half-formed thoughts. A brain dump lets the AI find the structure rather than Sam having to organise first.", "Conversational works better once you have a direction to steer. Sam doesn't have a direction yet — the output shape is still unknown. Brain dump gets you there faster.", "Blueprint requires you to specify format and structure upfront. Sam can't do that yet — the thinking hasn't been organised. Structure before clarity slows you down."],
    personaData: {
      name: "Sam", initial: "S", role: "Programme Coordinator", color: "#ED8936", iconPath: samImg,
      scenario: "It's 4pm on Monday. Sam has just come out of three back-to-back workshops. There are rough notes in a notebook, a half-finished voice memo, and a half-written email. The manager wants a summary of the key themes by 9am tomorrow — but Sam hasn't even started making sense of it all yet.",
      tags: ["Synthesising notes", "Finding themes", "Making sense of ambiguity"],
      approach: "Brain Dump",
      approachDef: "Pour in everything — rough notes, half-formed thoughts, scattered observations — and let the AI find the structure. You're not organising your thinking first. You're using the AI to help you do it.",
      bestFor: "Early-stage thinking. Unknown output shape. When speed matters more than precision.",
      prompt: "Here's everything from today — my notes from the three sessions, some thoughts on what I think the priorities are (but I'm not sure), a couple of things people said that felt important but I haven't processed yet.\n\nHelp me find the structure. What are the three most important themes? What am I missing?\n\n[Raw notes, voice memo transcript — unedited]",
      output: "Three clear themes emerged from your notes:\n\n1. Stakeholder alignment is fragile — two workstream leads have conflicting priorities that haven't been surfaced publicly.\n\n2. The timeline assumption for Phase 2 doesn't account for the procurement dependency flagged in your third bullet.\n\n3. There's a resource gap: three mentions of 'capacity concerns' across different sessions point to a systemic issue, not isolated complaints.\n\nWhat you may be missing: no one has named who owns the decision on timeline. That's likely why the conflicting priorities haven't been resolved.",
      why: "Sam's work starts messy by nature. Structuring before prompting would slow them down. The brain dump lets the AI do the initial organisation.",
      modifier: null, modDef: null,
    },
    voiceover: {
      setup: "/audio/l1t1-s10-setup.mp3",
      reveal: "/audio/l1t1-s10-reveal.mp3",
    },
  },

  /* ── Slide 8 — Priya the Conversationalist ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Priya — Strategy Analyst",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 1, predictFeedback: ["Brain dump surfaces ideas but doesn't give you control across turns. Priya wants to steer — to sharpen one argument, then another. That requires back-and-forth, not a single dump.", "Right. Priya doesn't know the final shape when she starts. Conversational lets her co-create — each turn adds specificity based on what the AI gave back. She's steering, not delegating.", "Blueprint works when you know exactly what you want. Priya is still figuring out the angle — locking into a format before the direction is clear creates unnecessary constraints."],
    personaData: {
      name: "Priya", initial: "P", role: "Strategy Analyst", color: "#805AD5", iconPath: priyaImg,
      scenario: "Priya is drafting the strategic case for centralising procurement across four regions. She has a direction, but isn't sure which argument to lead with or how to handle the likely pushback from regional leaders. The proposal goes to committee in 48 hours.",
      tags: ["Exploring angles", "Drafting proposals", "Pressure-testing ideas"],
      approach: "Conversational",
      approachDef: "Build the output across multiple turns. Start with a clear first request, then refine and sharpen through back-and-forth. Each turn adds specificity based on what the AI produced last.",
      bestFor: "Exploratory work. Evolving direction. When you want to steer, not specify.",
      prompt: "Turn 1: Help me think through the three strongest arguments for centralising procurement.\n\nTurn 2: Good — but the second argument is too generic. Make it specific to a 4,000+ employee organisation across multiple regions.\n\nTurn 3: Now anticipate the two most likely objections from regional leaders and how I'd address each one.\n\nTurn 4: Draft the full section — 300 words, direct tone, lead with the strongest argument.",
      output: "Revised argument 2: For organisations operating across 6+ regions with 4,000 employees, centralised procurement unlocks volume discounts of 12–18% on category spend — but only when regional variation in specifications is less than 30%. The key is standardising categories where variation adds no value while preserving regional flexibility where it does.\n\nObjection 1: 'We'll lose responsiveness to local supplier relationships.' Address: centralisation doesn't eliminate local procurement — it consolidates only the 60% of spend that's already commoditised...",
      why: "Priya doesn't know the final shape when she starts. Conversational prompting lets her steer progressively — co-creating, not delegating.",
      modifier: "Iterative Refinement",
      modDef: "Improve output across turns by giving targeted, specific feedback on what to change.",
    },
    voiceover: {
      setup: "/audio/l1t1-s11-setup.mp3",
      reveal: "/audio/l1t1-s11-reveal.mp3",
    },
  },

  /* ── Slide 10 — Marcus the Structured Input Provider ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Marcus — Delivery Lead",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 2, predictFeedback: ["Marcus's output goes straight to senior leaders. Quality needs to be consistent and there's no iteration window. A brain dump might produce something, but the quality would vary.", "Conversational is useful for exploration, but Marcus already knows exactly what he needs. Spending turns refining when you could specify upfront wastes the only advantage conversation offers.", "Correct. Marcus knows the audience, the format, and the constraints before he starts. Front-loading all of that eliminates guesswork and gets it right first time."],
    personaData: {
      name: "Marcus", initial: "M", role: "Delivery Lead", color: "#38B2AC", iconPath: marcusImg,
      scenario: "The quarterly review is tomorrow at 9am. The CFO and two divisional heads want a tight 400-word executive summary — milestone progress, the biggest risk, and one clear recommendation. Marcus needs it to land right first time. There's no window to iterate.",
      tags: ["Executive briefings", "Stakeholder summaries", "Board-ready documents"],
      approach: "Structured Input",
      approachDef: "Give the AI detailed context about the audience, purpose, and constraints — everything it needs to get it right first time. Not necessarily the full Blueprint, but rich context front-loaded into one message.",
      bestFor: "High-stakes deliverables. Known audience. When it needs to be right first time.",
      prompt: "I need a 400-word executive summary for the quarterly review. The audience is the CFO and two divisional heads — they care about commercial impact and timeline risk. Cover: (1) progress against milestones, (2) biggest risk + mitigation, (3) one recommendation. Direct tone, no jargon.\n\n[Notes attached]",
      output: "1. Milestone Progress: Three of four Q2 milestones are complete or on track. The shared-services migration (Milestone 3) is 2 weeks ahead of schedule, driven by early vendor alignment. Milestone 4 (CRM integration) is at risk — see below.\n\n2. Risk: CRM data extraction has encountered a format incompatibility with the legacy system that was not identified in the scoping phase. Current delay: 3 weeks. Mitigation: a parallel extraction using the API bridge is being tested this week; results expected by Friday.\n\n3. Recommendation: Approve the revised CRM timeline at Thursday's SteerCo and reallocate 2 FTE from the completed Milestone 1 workstream to support the extraction team.",
      why: "Marcus's outputs go straight to senior leaders. No iteration window — it needs to land first time. Front-loading context eliminates guesswork.",
      modifier: "Few-Shot Examples",
      modDef: "Show the AI what good looks like by providing 1\u20133 reference examples it should match.",
    },
    voiceover: {
      setup: "/audio/l1t1-s12-setup.mp3",
      reveal: "/audio/l1t1-s12-reveal.mp3",
    },
  },

  /* ── Slide 10 — Aisha the Brainstormer ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Aisha — Communications Lead",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 1, predictFeedback: ["A brain dump would surface raw material, but Aisha doesn't need more raw material — she needs perspectives and challenges she hasn't considered. That requires a structured interrogation across turns.", "Right. Aisha is using the AI as a thinking partner — asking it to generate alternatives, surface reactions, and stress-test her draft. That back-and-forth structure is exactly the conversational approach.", "Blueprint optimises for a known, repeatable output. Aisha's goal is the opposite — she wants to be surprised, challenged, and shown angles she hasn't considered."],
    personaData: {
      name: "Aisha", initial: "A", role: "Communications Lead", color: "#E53E3E", iconPath: aishaImg,
      scenario: "Aisha has to write the internal announcement for a company restructuring — by end of day. She's been too close to the process for months and is worried her draft sounds defensive. She needs to see it through fresh eyes before it goes out.",
      tags: ["Generating alternatives", "Challenging assumptions", "Finding fresh angles"],
      approach: "Brainstorming Partner",
      approachDef: "Use the AI to expand your thinking — generating options, challenging assumptions, finding angles you haven't considered. The AI is a thinking partner, not a production tool.",
      bestFor: "Creative work. Messaging and framing. When you need perspectives you're too close to see.",
      prompt: "I'm writing the internal announcement for the restructuring. Before I finalise:\n\n1. Give me three alternative opening angles I haven't considered\n2. What are the two most likely emotional reactions from mid-level managers?\n3. Read my draft as the most sceptical reader. What would they push back on?\n\n[Draft attached]",
      output: "Alternative angles:\n(1) Lead with what's NOT changing — anchor stability before introducing change.\n(2) Lead with the problem the restructuring solves — make it feel necessary, not imposed.\n(3) Lead with a question: 'What would we do differently if we were starting from scratch?' — invites buy-in.\n\nMost likely emotional reactions from mid-level managers:\n1. Anxiety about role clarity — 'Does this affect my team?'\n2. Fatigue — 'Another restructuring after last year's changes.'\n\nSceptical reader pushback: Paragraph 3 makes a promise ('no roles will be lost') that isn't supported by the specifics that follow. Either add the evidence or soften the claim.",
      why: "Aisha's value is in the quality of her thinking. AI helps her see around corners — surfacing perspectives she'd miss working alone.",
      modifier: "Chain of Thought",
      modDef: "Ask the AI to reason through the problem step by step before producing output.",
    },
    voiceover: {
      setup: "/audio/l1t1-s13-setup.mp3",
      reveal: "/audio/l1t1-s13-reveal.mp3",
    },
  },

  /* ── Slide 11 — Jordan the Blueprint Builder ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Jordan — Process Designer",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 2, predictFeedback: ["Jordan does this every Friday. A brain dump might produce something each week, but quality would vary. When consistency and repeatability matter, the upfront Blueprint investment pays back every time.", "Conversational would produce a good first draft but Jordan would redo the iteration every Friday. The Blueprint lets him build once and reuse — swapping in new data each week in under 30 seconds.", "Exactly right. Jordan's task is repeatable, the audience is known, and the format is fixed. The Blueprint takes 20 minutes to write once and saves hours across months of weekly reports."],
    personaData: {
      name: "Jordan", initial: "J", role: "Process Designer", color: "#1A202C", iconPath: jordanImg,
      scenario: "Jordan produces a weekly programme status report every Friday for the same four stakeholders. Each week he rewrites it from scratch, reformatting data and second-guessing structure. It takes 90 minutes. The content barely changes — just the numbers.",
      tags: ["Repeatable reports", "Templated outputs", "Team-wide consistency"],
      approach: "Prompt Blueprint",
      approachDef: "Use the six-component framework — Role, Context, Task, Format, Steps, Checks — to create a precise, reusable template. Invest upfront; the return compounds across every future use.",
      bestFor: "Repeatable tasks. Team-wide consistency. When format and quality must be predictable.",
      prompt: "Role: Senior analyst in operational performance.\nContext: Weekly status report for programme sponsor and three workstream leads. They want milestone progress, risks, resource utilisation. No methodology details.\nTask: Produce this week's status report.\nFormat: Four sections with headers. Max 500 words. Table for milestones. Professional tone.\nSteps: Summarise RAG ratings → flag changed risks → calculate utilisation → recommend 1–2 actions.\nChecks: RAG must match source data. No risk without mitigation. Figures as percentages, not headcount.\n\n[This week's data attached]",
      output: "MILESTONE PROGRESS\n| Milestone | Target | Status | RAG |\n| Shared Services Migration | 15 Mar | On track | Green |\n| CRM Data Extract | 28 Feb | 3 weeks delayed | Red |\n| Vendor Onboarding | 31 Mar | Complete | Green |\n| Change Comms | 15 Apr | On track | Amber |\n\nRISKS & ISSUES\n• CRM delay: format incompatibility with legacy system. Mitigation: parallel API extraction in testing.\n• Change Comms: regional teams report confusion about new escalation paths. Mitigation: supplementary FAQ being drafted...",
      why: "Jordan does this every Friday. The Blueprint took 20 minutes to write once. It now takes 30 seconds to reuse \u2014 just swap in new data.",
      modifier: null, modDef: null,
    },
    voiceover: {
      setup: "/audio/l1t1-s14-setup.mp3",
      reveal: "/audio/l1t1-s14-reveal.mp3",
    },
  },

  /* ── Slide 12 — Situation Matrix ── */
  { section: "THE TOOLKIT", type: "situationMatrix",
    takeaway: "The right approach depends on how well-defined the task is",
    heading: "Which approach fits which situation?",
    tealWord: "situation",
    body: "The right choice depends on how well you know the desired output and whether the task repeats. Click any situation row to see a real-world example.",
    voiceover: {
      setup: "/audio/l1t1-s15-setup.mp3",
    },
  },

  /* ── Slide 16 — Module Summary ── */
  { section: "WRAP UP", type: "moduleSummary",
    takeaway: "You now have a toolkit for prompting with intent",
    heading: "What you've learned",
    body: "Prompt engineering isn't about magic phrases. It's about understanding what kind of task you have — and choosing the right technique for it.",
    elements: [
      { key: "Brain Dump", color: "#2B4C7E", light: "#EBF4FF", icon: "🧠",
        desc: "Pour in unstructured input — notes, ideas, rough thinking. Let the AI find the structure.",
        example: "Best when: you don't know what shape the output should take yet." },
      { key: "Conversational", color: "#38B2AC", light: "#E6FFFA", icon: "💬",
        desc: "Build through dialogue. Steer iteratively, one exchange at a time.",
        example: "Best when: the goal is clear but the path needs exploring." },
      { key: "Blueprint", color: "#805AD5", light: "#FAF5FF", icon: "📐",
        desc: "Write one precise, reusable template. Swap in new data, get consistent output every time.",
        example: "Best when: the task repeats and quality must be predictable." },
      { key: "Brainstorming Partner", color: "#E53E3E", light: "#FFF5F5", icon: "🔄",
        desc: "Use AI to challenge your thinking — surface alternatives, stress-test assumptions.",
        example: "Best when: you're too close to the problem and need fresh perspectives." },
      { key: "Prompt Blueprint", color: "#1A202C", light: "#F7FAFC", icon: "🗂️",
        desc: "Combine the six RCTF+ components into a full system prompt that anyone on your team can reuse.",
        example: "Best when: team-wide consistency and repeatable quality are the goal." },
    ],
    ctaText: "Open Prompt Playground \u2192",
    ctaHref: "/app/toolkit/prompt-playground",
    voiceover: {
      setup: "/audio/l1t1-s16-setup.mp3",
    },
  },
];

const L1T1_ARTICLES: ArticleData[] = [
  { id: "a1", title: "What Separates Power Users from Everyone Else When Using AI at Work", source: "Harvard Business Review", readTime: "7 min read", desc: "How structured prompting is changing the way knowledge workers interact with AI tools — and what consistently separates professionals who get great outputs from those who get generic ones.", url: "#", reflection: "In one sentence, what was the single most useful idea from this article that you could apply to your own work this week?" },
  { id: "a2", title: "Why the Way You Ask Matters More Than the Tool You Use", source: "MIT Technology Review", readTime: "8 min read", desc: "A deep-dive into why prompt structure has more impact on output quality than model choice — with real examples from professional knowledge work across industries.", url: "#", reflection: "Describe one specific situation from your own work where structuring your prompt differently could have meaningfully improved the output you received." },
];

const L1T1_VIDEOS: VideoData[] = [
  { id: "v1", title: "The Prompting Spectrum in Practice", channel: "OXYGY Learning", duration: "8 min", desc: "A live walkthrough of all three prompting approaches — brain dump, conversational, and structured Blueprint — applied to the same professional task.", url: "#", quiz: [
    { q: "When is a brain dump approach most effective?", options: ["When you need a repeatable template for a weekly task", "When you have unstructured thoughts and don't yet know the output shape", "When the audience requires a specific format and professional tone", "When you want to iterate across multiple turns"], correct: 1 },
    { q: "What is the primary difference between the Conversational approach and the Structured Blueprint?", options: ["Conversational is faster; Blueprint is slower", "Conversational works for creative tasks only; Blueprint works for analytical tasks only", "Conversational builds quality across turns; Blueprint specifies everything upfront in one message", "Conversational doesn't use any Blueprint components; Blueprint uses all six"], correct: 2 },
  ]},
  { id: "v2", title: "Modifier Techniques: Chain of Thought, Few-Shot, and Iterative Refinement", channel: "OXYGY Learning", duration: "6 min", desc: "How the three modifier techniques change AI reasoning — with side-by-side examples showing the impact of each modifier on the same base prompt.", url: "#", quiz: [
    { q: "Modifier techniques change how the AI _____, not what _____ you give it.", options: ["responds / feedback", "reasons / information", "formats / templates", "writes / examples"], correct: 1 },
    { q: "Which scenario would benefit most from a Few-Shot Examples modifier?", options: ["You need the AI to think step by step through a complex problem", "You want to refine an output that's close but not quite right", "You need the AI to match a specific quality standard or format you've used before", "You're brainstorming and want the AI to explore multiple angles"], correct: 2 },
  ]},
];


/* ══════════════════════════════════════════════════════════════════
   LEVEL 2, TOPIC 1 — From Prompts to Reusable Tools
   ══════════════════════════════════════════════════════════════════ */

const L2T1_SLIDES: SlideData[] = [

  /* ── Slide 1 — Course Intro ── */
  {
    section: "DESIGNING YOUR FIRST AI AGENT", type: "courseIntro",
    heading: "Designing Your First AI Agent",
    subheading: "Turn your best prompts into permanent tools that run the same way for everyone",
    levelNumber: 2,
    topicIcon: "🤖",
    estimatedTime: "~20 minutes",
    objectives: [
      "Recognise when a task should be an agent, not just a prompt",
      "Design an agent using the three-layer model (Input, Processing, Output)",
      "Build in accountability so your outputs can be trusted and verified",
    ],
  },

  /* ── Slide 2 — Evidence: The rework problem ── */
  {
    section: "THE STANDARDISATION GAP", type: "evidenceHero",
    takeaway: "When everyone uses AI differently, the team pays for it in rework and inconsistency",
    heading: "Everyone's using AI differently.",
    tealWord: "differently",
    body: "Teams across every function are using AI — but almost always individually and ad hoc. Each person runs their own version of the same task, producing outputs that look different, feel different, and can't be compared or built on.\n\nThe result? Rework. Inconsistency. Knowledge that lives with one person and disappears when they're out of office.",
    stats: [{
      value: "19%",
      valueColour: "#38B2AC",
      label: "of the average knowledge worker's week is spent recreating information that already exists somewhere in their organisation",
      source: "McKinsey Global Institute",
      desc: "Global knowledge worker productivity study",
      visualType: "weekBlocks",
    }],
    pullQuote: "The gap isn't between teams using AI and those that aren't. It's between teams where AI produces the same result and teams where it doesn't.",
    sourceLink: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    sourceText: "McKinsey Global Institute — The Social Economy: Unlocking Value and Productivity Through Social Technologies",
  },

  /* ── Slide 3 — Evidence: One agent. Compounding returns. ── */
  {
    section: "THE STANDARDISATION GAP", type: "evidenceHero",
    takeaway: "A single well-built agent delivers compounding returns — every run, for every person who uses it",
    heading: "One agent. Compounding returns.",
    tealWord: "Compounding",
    body: "A prompt runs once. A well-designed agent runs every time — for anyone. The effort of building one good agent pays back on every subsequent run, multiplied across everyone on your team who does the same task.\n\nThis is why standardisation changes the economics. You're not saving time once. You're saving it hundreds of times.",
    stats: [{
      value: "2.4×",
      valueColour: "#38B2AC",
      label: "more value created when AI tools are standardised and shared across a team vs. used individually",
      source: "McKinsey Global Survey 2024",
      desc: "Survey of 1,363 participants across industries",
      visualType: "barComparison",
    }],
    pullQuote: "A prompt runs once. An agent runs every time — for anyone.",
    sourceLink: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    sourceText: "McKinsey Global Survey on AI, 2024",
  },

  /* ── Slide 4 — Tension Statement ── */
  {
    section: "THE LEVEL 2 SHIFT", type: "tensionStatement",
    heading: "You've built something great.",
    subheading: "But it only works when you're there.",
    tealPhrase: "only works when you're there",
    footnote: "Level 2 turns your best work into tools that run without you — consistently, for everyone on your team.",
  },

  /* ── Slide 5 — What is an AI agent? ── */
  {
    section: "WHAT IS AN AGENT", type: "concept",
    takeaway: "An agent is a configured AI tool that runs consistently for anyone — not a one-time conversation",
    heading: "What is an AI agent?",
    tealWord: "AI agent",
    eyebrow: "THE DEFINITION",
    body: "A prompt is a one-time request — you write it, run it, and it disappears. An agent is a configured AI tool — you design it once, and it runs the same way every time, for anyone on your team.\n\nThe key difference isn't intelligence. It's permanence. An agent remembers its purpose, its rules, and its output format — so you don't have to explain it again every session.",
    pullQuote: "A prompt is a conversation. An agent is a colleague.",
    visualId: "l2-agent-vs-prompt",
  },

  /* ── Slide 6 — When does a prompt become an agent? ── */
  {
    section: "KNOW THE DIFFERENCE", type: "concept",
    takeaway: "Three conditions determine whether a task is worth building as an agent",
    heading: "When does a prompt become an agent?",
    tealWord: "become an agent",
    eyebrow: "KNOW THE DIFFERENCE",
    body: "Not every prompt should become an agent. The investment makes sense when three conditions are true: the task repeats on a regular pattern, the output needs to look the same every time, and more than one person on your team needs to run it.\n\nWhen all three apply, a well-crafted prompt has earned its promotion.",
    pullQuote: "An agent is a prompt that earned a permanent address.",
    visualId: "l2-agent-decision",
  },

  /* ── Slide 6 — Situational Judgment: Agent or prompt? ── */
  {
    section: "WHEN TO BUILD ONE", type: "situationalJudgment",
    takeaway: "Apply the agent decision test to real tasks from three different roles",
    heading: "Agent or prompt?",
    scenarios: [
      {
        personaName: "Maya",
        personaRole: "Operations Manager",
        scenario: "Maya starts every morning by reading 20+ internal emails and manually summarising the key actions for her team. She does this every single day, and her colleague does the same — but their summaries look completely different.",
        options: ["Build a reusable agent", "Just write a good prompt"],
        strongestChoice: 0,
        feedback: [
          { quality: "strong", text: "Correct. Daily frequency, consistency gap across two people, and a structured output that matters downstream — all three agent conditions are met. This is exactly the kind of task worth standardising." },
          { quality: "weak", text: "A prompt would work, but it disappears after each session. With daily frequency and two people producing inconsistent outputs, an agent would standardise the result once and run the same way every time." },
        ],
      },
      {
        personaName: "James",
        personaRole: "Senior Strategy Consultant",
        scenario: "James's manager has asked for a one-time competitor landscape report ahead of a client pitch next week. Different competitors, different client framing — the context changes completely each time this type of analysis comes up.",
        options: ["Build a reusable agent", "Just write a good prompt"],
        strongestChoice: 1,
        feedback: [
          { quality: "weak", text: "Building an agent adds complexity without value here. The analysis is one-time and highly context-dependent — the effort of standardising inputs and outputs won't pay off for a single use." },
          { quality: "strong", text: "Right. One-time, context-dependent tasks are prompt territory. A well-crafted Level 1 prompt is the right tool. Save the agent investment for tasks that repeat." },
        ],
      },
      {
        personaName: "Priya",
        personaRole: "Risk & Compliance Lead",
        scenario: "Priya's team produces a risk summary for six stakeholder groups every quarter. Each uses the same structure and the same source data — just different audience framing. Three people on her team produce these independently, with inconsistent results.",
        options: ["Build a reusable agent", "Just write a good prompt"],
        strongestChoice: 0,
        feedback: [
          { quality: "strong", text: "Strong agent case. Quarterly cadence, same structure across six outputs, and three people producing inconsistent results — standardising this as an agent delivers consistent quality every quarter with no extra effort." },
          { quality: "weak", text: "A prompt alone won't solve the inconsistency across three people. This task repeats on a schedule and follows a fixed structure — the conditions for an agent are all there." },
        ],
      },
    ],
  },

  /* ── Slide 7 — The Three-Layer Model (concept with visual) ── */
  {
    section: "THE THREE-LAYER MODEL", type: "concept",
    takeaway: "Every agent is built from three layers: Input, Processing, Output",
    heading: "Every agent is built from three layers.",
    tealWord: "three layers",
    eyebrow: "THE ANATOMY",
    body: "A Level 2 agent isn't just a better prompt. It's a structured system with three distinct layers:\n\n— What goes in (Input)\n— How the AI behaves (Processing)\n— What comes out (Output)\n\nDesigning all three makes the agent reusable, consistent, and shareable.",
    pullQuote: "The system prompt is the Prompt Blueprint from Level 1 — promoted to permanent instructions.",
    visualId: "l2-three-layers",
  },

  /* ── Slide 8 — Three Layers Deep Dive (rctf, revealOnNext) ── */
  {
    section: "THE THREE-LAYER MODEL", type: "rctf",
    takeaway: "Each layer has a specific job — get all three right and the agent runs consistently every time",
    heading: "Inside the three layers.",
    tealWord: "three layers",
    subheading: "Each layer has a specific job. Get all three right and the agent runs consistently every time.",
    revealOnNext: true,
    elements: [
      {
        key: "INPUT",
        color: "#667EEA",
        light: "#EBF4FF",
        icon: "📥",
        desc: "What the user provides each time. Define the data format, required fields, and how to supply them.",
        example: "Meeting notes, email threads, project tracker entries — pasted into a standard template",
        whyItMatters: "Consistent input = consistent output",
      },
      {
        key: "PROCESSING",
        color: "#38B2AC",
        light: "#E6FFFA",
        icon: "⚙️",
        desc: "The system prompt — the agent's permanent operating manual. Role definition, task instructions, reasoning steps, accountability rules.",
        example: "You are a project status analyst. For each project: assess status, summarise updates, cite sources, score confidence.",
        whyItMatters: "The system prompt never changes run to run",
      },
      {
        key: "OUTPUT",
        color: "#48BB78",
        light: "#F0FFF4",
        icon: "📤",
        desc: "The structure of what comes out. A defined format — JSON schema, structured template — that stays consistent across every run.",
        example: "{ project_name, status, key_updates[], next_actions[], confidence_score, evidence_sources[] }",
        whyItMatters: "Structured output = comparable, shareable results",
      },
    ],
  },

  /* ── Slide 9 — Sort the Layers (drag-and-drop activity) ── */
  {
    section: "TEST YOUR UNDERSTANDING", type: "dragSort",
    takeaway: "Apply the three-layer model by classifying each element of a real agent design",
    heading: "Sort these into the three layers.",
    tealWord: "three layers",
    dragContext: "Scenario: a weekly status update agent for a project team. Drag each design element to the layer it belongs in.",
    dragZones: [
      { id: "input",      label: "INPUT",      color: "#667EEA", light: "#EBF4FF", icon: "📥" },
      { id: "processing", label: "PROCESSING", color: "#38B2AC", light: "#E6FFFA", icon: "⚙️" },
      { id: "output",     label: "OUTPUT",     color: "#48BB78", light: "#F0FFF4", icon: "📤" },
    ],
    dragItems: [
      { id: "d1", label: "Meeting notes pasted by the user",       correctZone: "input" },
      { id: "d2", label: "Email thread provided as context",        correctZone: "input" },
      { id: "d3", label: "Standard input template for each run",   correctZone: "input" },
      { id: "d4", label: "You are a project status analyst",       correctZone: "processing" },
      { id: "d5", label: "Cite every conclusion to a source",       correctZone: "processing" },
      { id: "d6", label: "Flag anything below 0.7 confidence",     correctZone: "processing" },
      { id: "d7", label: "JSON schema with fixed output fields",    correctZone: "output" },
      { id: "d8", label: "Status: on track / at risk / blocked",   correctZone: "output" },
    ],
  },

  /* ── Slide 10 — Custom GPTs: Real-world implementation ── */
  {
    section: "IN THE REAL WORLD", type: "concept",
    takeaway: "Custom GPTs are a no-code way to deploy the three-layer model inside ChatGPT — shareable with your team immediately",
    heading: "Custom GPTs are agents you can build today.",
    tealWord: "agents you can build today",
    eyebrow: "PLATFORM EXAMPLE",
    body: "OpenAI's Custom GPTs are a no-code implementation of the three-layer agent model — available inside ChatGPT without any coding. Each field in the builder maps directly to one of the three layers you just learned.\n\nThe Instructions field is your system prompt (Processing layer). The Knowledge section is where you upload context files the agent draws from (Input enrichment). Conversation starters define how your team begins each interaction — building the input interface on your behalf.\n\nOnce built, a Custom GPT can be shared with your team via a link — making it one of the fastest routes from concept to deployed agent.",
    pullQuote: "Every field in the Custom GPT builder is one of the three layers.",
    visualId: "l2-custom-gpt",
  },

  /* ── Slide 10 — Comparison: Same task, three approaches ── */
  {
    section: "IN PRACTICE", type: "comparison",
    takeaway: "The difference between a prompt and an agent is structure at every layer",
    heading: "The same task, three approaches.",
    tealWord: "three approaches",
    scenario: "Your team needs a structured weekly status update from meeting notes, email threads, and project tracker entries.",
    tabs: [
      {
        label: "Ad-hoc prompt",
        prompt: "Summarise these notes into a status update for my team.",
        annotation: "No defined input. No behaviour instructions. No output structure. Works once — but the result looks different every time and from every person.",
      },
      {
        label: "Layer 2 added",
        prompt: "You are a project status analyst. I will provide meeting notes, email excerpts, and tracker data. For each project: identify current status (on track / at risk / blocked), summarise key updates in 2–3 sentences, and list next actions with owners.",
        annotation: "The role and task are now defined. The AI knows what to do and how to reason — but the output is still free-form text. Format varies run to run.",
      },
      {
        label: "Full three-layer agent",
        prompt: "You are a project status analyst. I will provide meeting notes, email excerpts, and tracker data. For each project: identify status, summarise updates, list next actions with owners. Cite each conclusion to a specific source. Score confidence 0–1, flag anything below 0.7. Output as JSON: { project_name, status, summary, key_updates[], next_actions[], confidence_score, evidence_sources[] }.",
        annotation: "Structured, consistent, verifiable. Every run produces the same format — comparable week over week, shareable across the team, with accountability built in by design.",
      },
    ],
  },

  /* ── Slide 10 — Module Summary ── */
  {
    section: "WHAT YOU'VE LEARNED", type: "moduleSummary",
    takeaway: "You now have a framework for building agents that run consistently for anyone on your team",
    heading: "What you've learned",
    panelHeading: "The Three-Layer Agent Model",
    body: "Three layers that define what goes in, how the AI behaves, and what comes out.",
    subheading: "When to build an agent",
    elements: [
      { key: "INPUT",      color: "#667EEA", light: "#EBF4FF", desc: "Define what goes in — data source, format, required fields" },
      { key: "PROCESSING", color: "#38B2AC", light: "#E6FFFA", desc: "The system prompt — role, task, steps, and accountability rules" },
      { key: "OUTPUT",     color: "#48BB78", light: "#F0FFF4", desc: "Structured format — consistent fields, JSON schema, verifiable" },
    ],
    approaches: [
      { icon: "🔁", label: "Repeat pattern", color: "#667EEA", light: "#EBF4FF", when: "Same task runs repeatedly — the standardisation investment pays off" },
      { icon: "✅", label: "Consistent output", color: "#38B2AC", light: "#E6FFFA", when: "Output must follow the same structure every time — for you or your team" },
      { icon: "🛡️", label: "Accountability built in", color: "#48BB78", light: "#F0FFF4", when: "Stakes require sources, confidence scores, and anomaly flagging by design" },
    ],
  },
];

const L2T1_ARTICLES: ArticleData[] = [
  { id: "a1", title: "Why Most AI Productivity Gains Stay Individual — and How to Change That", source: "Harvard Business Review", readTime: "~8 min read",
    desc: "This article examines why most organisations see AI productivity gains at the individual level but struggle to scale those gains across teams. It explores the structural gap between personal AI usage and standardised, repeatable AI tools — and what organisations that have closed that gap did differently.",
    url: "#", reflection: "Think about one task in your work that you do at least weekly and that someone else on your team also does. What would need to be true about the input, the AI\u2019s behaviour, and the output format for a reusable tool to handle it reliably?" },
  { id: "a2", title: "Designing AI Outputs That Earn Trust: Citations, Confidence, and Verification", source: "MIT Sloan Management Review", readTime: "~6 min read",
    desc: "This article explores what makes AI-generated outputs trustworthy at an organisational level — focusing on citability, confidence signalling, and the design decisions that make human verification fast rather than burdensome. It argues that trust in AI is designed, not assumed.",
    url: "#", reflection: "If a senior stakeholder asked you to prove that an AI-generated summary was accurate, what specific features in the output would make that possible in under two minutes?" },
];

const L2T1_VIDEOS: VideoData[] = [
  { id: "v1", title: "From Prompt to Agent: Building Reusable AI Tools", channel: "OXYGY Learning", duration: "10 min",
    desc: "A practical walkthrough of how to design AI agents that go beyond one-off prompting — covering how to define the agent\u2019s role, structure its instructions, and create consistent output formats.",
    url: "#", quiz: [
      { q: "What is the primary difference between a one-off prompt and a Level 2 agent?", options: ["The agent uses a more advanced AI model", "The agent has permanent instructions that define its input, behaviour, and output", "The agent can access the internet", "The agent is more expensive to run"], correct: 1 },
      { q: "In the three-layer agent model, what does Layer 2 (Processing) contain?", options: ["The data the user provides", "The JSON output template", "The system prompt — role, task, steps, and quality checks", "The sharing documentation"], correct: 2 },
    ]},
  { id: "v2", title: "Accountability by Design: Building Trust into AI Workflows", channel: "OXYGY Learning", duration: "8 min",
    desc: "An exploration of how to design AI tools that support human oversight — covering techniques like source citation, confidence scoring, and structured output formats that make verification fast and targeted.",
    url: "#", quiz: [
      { q: "What is the purpose of including a confidence score in an AI agent\u2019s output?", options: ["To make the output look more professional", "To help the reviewer know where to focus their verification effort", "To prove the AI is always accurate", "To meet compliance requirements"], correct: 1 },
      { q: "What does \u2018Build Once, Share Always\u2019 mean in the Level 2 context?", options: ["Every prompt should be saved to a personal library", "Agents should be designed once, documented, and deployed for the whole team to use", "AI tools should be purchased from vendors, not built internally", "The system prompt should never be changed after the first version"], correct: 1 },
    ]},
];


/* ══════════════════════════════════════════════════════════════════
   LEVEL 3, TOPIC 1 — Mapping a Multi-Step AI Workflow
   ══════════════════════════════════════════════════════════════════ */

const L3T1_SLIDES: SlideData[] = [

  /* ── Slide 1 — Course Intro ── */
  {
    section: "WORKFLOW DESIGN", type: "courseIntro",
    heading: "Mapping a Multi-Step AI Workflow",
    subheading: "Most professionals use AI one step at a time. This module teaches you to think in processes — mapping triggers, actions, conditions, and handoffs into repeatable workflows.",
    levelNumber: 3,
    topicIcon: "🗺️",
    estimatedTime: "~20 min",
    objectives: [
      "🗺️ The three-layer model — inputs, processing, and outputs — and how every workflow is built from them",
      "🔁 How to translate a familiar professional process into a mapped, node-based workflow",
      "⚠️ Where handoffs between steps create risk or opportunity — and how to design for both",
    ],
  },

  /* ── Slide 2 — The Process Gap Is Real ── */
  {
    section: "THE REALITY", type: "evidenceHero",
    takeaway: "Most AI projects stall at isolated tasks — workflow automation is where the real gains are",
    heading: "The task-to-workflow gap.",
    tealWord: "task-to-workflow gap",
    body: "Professionals are using AI tools — but mostly for isolated, one-off tasks. The organisations seeing 3× to 4× productivity gains aren't using AI more often. They're chaining it across connected, multi-step workflows.",
    stats: [{ value: "24%", valueColour: "#38B2AC", label: "of organisations have moved beyond individual AI tasks to coordinated workflow automation", source: "McKinsey", desc: "Global Survey on AI, 2024", visualType: "dotGrid" }],
    pullQuote: "The frontier isn't a better prompt. It's a process that runs itself.",
    sourceLink: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    sourceText: "McKinsey Global Survey on AI (2024) — survey of 1,363 participants across industries and geographies",
  },

  /* ── Slide 3 — The Performance Gap ── */
  {
    section: "THE REALITY", type: "evidenceHero",
    takeaway: "Top AI performers are 3.4× more likely to have integrated AI across connected workflows — not just deployed it as a standalone tool",
    heading: "The gap is widening.",
    tealWord: "widening",
    body: "Organisations in the top quartile for AI productivity aren't using better models — they're using AI differently. McKinsey's 2024 global survey found that high performers are 3.4× more likely to have embedded AI across connected, multi-step workflows rather than deploying it as a single-purpose tool. The difference is process design, not model access.",
    stats: [{ value: "3.4×", valueColour: "#38B2AC", label: "more likely to integrate AI across enterprise-wide workflows vs. using it as a standalone tool", source: "McKinsey", desc: "The State of AI: Global Survey, 2024", visualType: "performanceGap" }],
    pullQuote: "The competitive gap isn't between companies using AI and those that aren't. It's between those who chain it and those who silo it.",
    sourceLink: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    sourceText: "McKinsey Global Survey on AI (2024) — survey of 1,363 participants across industries and geographies",
  },

  /* ── Slide 4 — Adoption vs. Integration ── */
  {
    section: "THE REALITY", type: "evidenceHero",
    takeaway: "75% of knowledge workers use AI tools — but most use them as one-off assistants, not as parts of a designed process",
    heading: "Adoption is high. Integration is rare.",
    tealWord: "Integration is rare",
    body: "Three in four knowledge workers now use AI at work. But the vast majority use it as a personal assistant — one prompt at a time, disconnected from the next step. Productivity gains stay individual and non-transferable. Workflows are what turn personal AI use into team capability that compounds.",
    stats: [{ value: "75%", valueColour: "#38B2AC", label: "of knowledge workers use AI tools at work", source: "Microsoft", desc: "Work Trend Index, 2024", visualType: "adoptionGap" }],
    pullQuote: "Personal productivity doesn't scale. Workflow design does.",
    sourceLink: "https://www.microsoft.com/en-us/worklab/work-trend-index",
    sourceText: "Microsoft Work Trend Index Annual Report (2024) — survey of 31,000 people across 31 countries",
  },

  /* ── Slide 5 — You've Learned to Prompt ── */
  {
    section: "THE GAP", type: "tensionStatement",
    takeaway: "A prompt is a request. A workflow is a system. The next skill is building the system.",
    heading: "You've learned to prompt.",
    subheading: "But a prompt is a request. A workflow is a system.",
    tealPhrase: "a prompt is a request. A workflow is a system.",
    body: "The next skill gap isn't writing better prompts — it's knowing which steps connect, what triggers each one, where a human must review, and what the output feeds into next.",
    footnote: "Most people who consider themselves 'good at AI' are still thinking one step at a time.",
  },

  /* ── Slide 6 — What is an AI workflow? ── */
  {
    section: "WHAT IS A WORKFLOW", type: "concept",
    takeaway: "A workflow chains multiple agents into a process — trigger, steps, conditions, and output",
    heading: "What is an AI workflow?",
    tealWord: "AI workflow",
    eyebrow: "THE DEFINITION",
    body: "At Level 2, you built agents — individual AI tools that handle one task reliably. At Level 3, you connect those agents into a workflow: a sequence of steps triggered by an event, passing outputs between stages, applying conditions, and routing results to the right place.\n\nAn agent handles a task. A workflow handles a process.",
    pullQuote: "Agents are the building blocks. Workflows are the architecture.",
    visualId: "l3-workflow-vs-agent",
  },

  /* ── Slide 7 — When Does a Workflow Make Sense? ── */
  {
    section: "THE TECHNIQUE", type: "concept",
    takeaway: "A workflow adds value when a process is repetitive, structured, and has a defined output",
    heading: "Not every task needs a workflow.",
    tealWord: "needs a workflow",
    eyebrow: "WHEN TO USE ONE",
    body: "The test is simple: if this task ran a hundred times, would the right output look broadly the same each time?",
    pullQuote: "Automate the repetitive. Keep the judgment.",
    visualId: "l3-workflow-decision",
  },

  /* ── Slide 7 — Workflow or Not? (Activity) ── */
  {
    section: "THE TECHNIQUE", type: "situationalJudgment",
    takeaway: "Apply the workflow decision test to real tasks from three different roles",
    heading: "Workflow or not?",
    scenarios: [
      {
        personaName: "Lena",
        personaRole: "HR Manager",
        scenario: "Every time a new employee joins, Lena manually sends a welcome email, shares an onboarding document pack, creates a system account request, and schedules a Day 1 check-in. The steps are always the same — the only variable is the employee's name and start date. Should Lena build a workflow?",
        options: ["Yes", "No"],
        strongestChoice: 0,
        feedback: [
          { quality: "strong", text: "Exactly right. The trigger is clear (new hire confirmed), the steps are fixed, and the output is always the same set of actions. Personalisation — name, start date — is just data the workflow receives. This is a textbook workflow candidate." },
          { quality: "weak", text: "A workflow doesn't remove the personal touch — it ensures it happens consistently. The steps Lena does manually are identical every time. A workflow handles the repetitive parts and frees Lena's attention for the genuinely personal moments." },
        ],
      },
      {
        personaName: "Ravi",
        personaRole: "Senior Strategy Consultant",
        scenario: "A client has escalated a complaint about a project that went over budget. Ravi needs to review six months of project history, understand the client relationship context, and decide whether to offer a partial refund, a discount on future work, or simply a detailed explanation. Should Ravi build a workflow?",
        options: ["Yes", "No"],
        strongestChoice: 1,
        feedback: [
          { quality: "weak", text: "Consistency matters for routine complaints, but this case requires Ravi to weigh context that changes significantly from client to client. A workflow would force a structured response onto a situation that needs genuine judgment." },
          { quality: "strong", text: "Correct. The decision depends on relationship history, risk appetite, and strategic context — none of which can be reliably encoded as rules. Ravi should handle this as a one-off, with AI as a thinking tool if helpful, not as an automated step." },
        ],
      },
      {
        personaName: "Diane",
        personaRole: "Marketing Manager",
        scenario: "Diane's team receives inbound press enquiries by email. Each one needs to be categorised (media, analyst, or blogger), checked against a media list, and either forwarded to the PR lead or logged as low priority. The volume is two to three per day and the routing logic is always the same. Should Diane build a workflow?",
        options: ["Yes", "No"],
        strongestChoice: 0,
        feedback: [
          { quality: "strong", text: "Right. The trigger is clear (email arrives), the logic is rule-based (media list check + category routing), and the output is always the same type of action. Volume is low but the process is perfectly suited to a workflow." },
          { quality: "weak", text: "Low volume doesn't disqualify a workflow — even two to three requests a day adds up to 600–900 per year. Consistent categorisation and routing at that scale is worth automating." },
        ],
      },
    ],
  },

  /* ── Slide 8 — The Anatomy of an AI Workflow ── */
  {
    section: "THE TECHNIQUE", type: "concept",
    takeaway: "Every AI workflow has three layers: Input → Processing → Output",
    heading: "The Anatomy of an AI Workflow",
    tealWord: "Anatomy",
    body: "At Level 2, you applied the three-layer model to a single agent — input, processing, output. At Level 3, the same structure scales up. Now the Input layer captures what triggers an entire process. The Processing layer chains multiple AI steps, conditions, and transformations together. The Output layer routes results to the right destination — or surfaces them for human review.\n\nThe difference isn't the shape. It's the scope.",
    pullQuote: "Without defined triggers and outputs, your AI workflow is just a series of prompts waiting for someone to remember them.",
    visualId: "l3-workflow-anatomy",
  },

  /* ── Slide 9 — The Three Layers (reveal) ── */
  {
    section: "THE LAYERS", type: "rctf",
    revealOnNext: true,
    takeaway: "Every AI workflow has three layers — each with a distinct job",
    heading: "The Three Layers",
    tealWord: "Three Layers",
    subheading: "Click Next to explore each layer.",
    visualId: "l3-workflow-anatomy",
    elements: [
      {
        key: "INPUT LAYER",
        color: "#667EEA",
        light: "#EBF4FF",
        icon: "📥",
        desc: "Every workflow starts with two things: a starting event and the data it needs. Without a defined trigger, the workflow has no way of knowing when to run.",
        example: "A form submitted · A file arriving · A scheduled time · A message received",
        whyItMatters: "Nothing runs until a starting event is defined",
      },
      {
        key: "PROCESSING LAYER",
        color: "#38B2AC",
        light: "#E6FFFA",
        icon: "⚙️",
        desc: "This is where the actual work happens. AI steps, conditional logic, and data transformations chain together to turn inputs into something useful.",
        example: "AI reads brief · Checks budget threshold · Reformats into template",
        whyItMatters: "This is where input becomes output",
      },
      {
        key: "OUTPUT LAYER",
        color: "#48BB78",
        light: "#F0FFF4",
        icon: "📤",
        desc: "Results are delivered here — to a person for review, or directly to a destination. A well-designed output makes the final step as frictionless as possible.",
        example: "Document saved · Message sent · Manager review triggered · Record updated",
        whyItMatters: "Every workflow ends with something delivered",
      },
    ],
  },

  /* ── Slide 10 — The Six Node Types ── */
  {
    section: "THE TECHNIQUE", type: "rctf",
    revealOnNext: true,
    takeaway: "Six node types cover every step in every workflow — learn to spot them",
    heading: "The Six Node Types",
    tealWord: "Six Node Types",
    subheading: "Every workflow step is one of six types. Learn to recognise them — and you can map any process.",
    elements: [
      { key: "TRIGGER",    color: "#667EEA", light: "#EBF4FF", desc: "Starts the workflow. A user action, a schedule, an event.",     example: "Form submitted / Email arrives / Monday 9 am",          whyItMatters: "No trigger = no automation" },
      { key: "AI ACTION",  color: "#38B2AC", light: "#E6FFFA", desc: "A step where an AI model does the work.",                        example: "Classify intent / Summarise document / Draft reply",      whyItMatters: "The value step — where AI generates output" },
      { key: "TRANSFORM",  color: "#ED8936", light: "#FFFBEB", desc: "Reformats or restructures data between steps.",                  example: "Extract fields from text / Merge two responses",          whyItMatters: "Connects outputs to the next step's inputs" },
      { key: "CONDITION",  color: "#48BB78", light: "#F0FFF4", desc: "Routes the workflow based on a rule.",                           example: "Confidence < 80%? → Escalate / Else → Continue",         whyItMatters: "Makes the workflow adaptive, not brittle" },
      { key: "HANDOFF",    color: "#9F7AEA", light: "#FAF5FF", desc: "Passes work to a human or another system.",                      example: "Manager review / CRM update / Slack notification",        whyItMatters: "Human oversight and cross-system action" },
      { key: "OUTPUT",     color: "#F6AD55", light: "#FFFAF0", desc: "The final result — a document, a decision, a message.",          example: "Drafted report / Approved response / Updated record",     whyItMatters: "The thing the workflow exists to produce" },
    ],
  },

  /* ── Slide 11 — See It in Action: Example Workflow ── */
  {
    section: "THE TECHNIQUE", type: "concept",
    takeaway: "A mapped workflow ties all three layers together into something that runs on its own",
    heading: "A workflow in action.",
    tealWord: "in action",
    body: "Here's a complete example: an expense claim workflow.\n\nWhen a new expense email arrives, the workflow triggers automatically. The Processing Layer extracts the claim data, checks if it exceeds the approval threshold, and formats a summary. The Output Layer routes large claims to a manager for review — and sends everything else straight to the finance system.\n\nThis is the three-layer structure in practice: a trigger starts it, processing handles the logic, and the output delivers the result.",
    pullQuote: "Every step has a purpose. Nothing runs on memory.",
    visualId: "l3-example-workflow",
  },

  /* ── Slide 12 — Handoffs: Where Risk and Opportunity Meet ── */
  {
    section: "THE TECHNIQUE", type: "concept",
    takeaway: "Every handoff is a decision point — design it deliberately or leave it to chance",
    heading: "Handoffs: where things go right or wrong.",
    tealWord: "right or wrong",
    eyebrow: "LEARNING OBJECTIVE 3",
    body: "A handoff is any point where work passes from one step to the next — between AI nodes, from AI to a human, or from your workflow to another system.\n\nHandoffs create risk when they're implicit. If a step assumes the previous one completed correctly — but there's no check — errors travel silently downstream. By the time someone notices, the damage is already done.\n\nHandoffs create opportunity when they're explicit. A deliberate handoff to a human reviewer catches errors before they matter. A handoff to another system triggers the next part of a larger process. A conditional handoff routes high-stakes cases for approval while letting routine ones through automatically.\n\nThe goal isn't to minimise handoffs — it's to design each one with intent.",
    pullQuote: "An undesigned handoff is just a gap waiting to cause a problem.",
  },

  /* ── Slide 13 — Apply It: Situational Judgment ── */
  {
    section: "IN PRACTICE", type: "situationalJudgment",
    takeaway: "Apply the three-layer model, node types, and handoff design to real workflow decisions",
    heading: "Apply It: Workflow Design Decisions",
    scenarios: [
      {
        personaName: "Alex",
        personaRole: "Marketing Coordinator",
        scenario: "Alex is mapping a workflow. A client brief arrives by email → the AI extracts key themes → the AI formats the content into a standard template → the final document is emailed to the client. She's unsure where each step sits. Which layer does the formatting step belong to?",
        options: [
          "Input Layer — it's working with data that arrived in the email",
          "Processing Layer — it transforms the extracted content into a new structure",
          "Output Layer — it produces the final document the client will receive",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "weak", text: "The Input Layer captures the trigger and incoming data — in this case, the email arriving. Formatting happens after that data has already been received and processed. It belongs in the middle layer." },
          { quality: "strong", text: "Correct. Formatting is a Processing Layer step — it takes extracted content and reshapes it into a new structure. The Processing Layer handles all AI work, logic, and transformation between what arrives and what gets delivered." },
          { quality: "partial", text: "The Output Layer is where the final document is delivered — the email to the client. But formatting it is the step before that. Transformation belongs in the Processing Layer; delivery belongs in the Output Layer." },
        ],
      },
      {
        personaName: "Nia",
        personaRole: "Operations Analyst",
        scenario: "Nia is building a workflow that processes client feedback forms. She needs a step that reads the feedback text and decides whether to route it to the service team (negative sentiment) or log it automatically (positive/neutral). Which node type fits this step?",
        options: [
          "AI ACTION — the AI reads and interprets the text",
          "CONDITION — it evaluates a result and routes the workflow based on a rule",
          "TRANSFORM — it reformats the feedback into a structured record",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "partial", text: "An AI ACTION is what reads and interprets the text — that's the step before this one. The step Nia is designing takes the AI's result and makes a routing decision based on it. That's what a CONDITION node does." },
          { quality: "strong", text: "Exactly. A CONDITION node evaluates the outcome of the previous step — here, the sentiment classification — and routes the workflow down different paths based on a rule. It's what makes a workflow adaptive rather than linear." },
          { quality: "weak", text: "A TRANSFORM reformats or restructures data — for example, converting raw text into a structured record. Nia's step isn't reshaping data; it's making a routing decision. That's a CONDITION." },
        ],
      },
      {
        personaName: "Tom",
        personaRole: "HR Coordinator",
        scenario: "Tom's AI workflow drafts interview invitation emails for incoming job applications. It's been running accurately in testing. He wants to remove the human review step to speed things up. What's the right call?",
        options: [
          "Remove it — the AI is accurate and the extra step slows the process down",
          "Keep a quick human check before sending — candidate emails carry reputational risk",
          "Replace the human review with a second AI pass to check for errors",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "weak", text: "Testing accuracy doesn't guarantee production accuracy. A single wrong name, role, or tone in a candidate email can damage trust and the employer brand. The cost of a 30-second review is far lower than the cost of a mistake." },
          { quality: "strong", text: "This is good handoff design. A lightweight human review on high-stakes outputs is worth keeping — at least until you have weeks of consistent real-world results. Design the handoff as a feature, not a bottleneck." },
          { quality: "partial", text: "A second AI pass catches some errors, but AI can't reliably catch its own mistakes — especially issues of tone, context, or candidate-specific details. A human handoff is more reliable for this type of output." },
        ],
      },
    ],
  },

  /* ── Slide 14 — Module Summary ── */
  {
    section: "WRAP UP", type: "moduleSummary",
    takeaway: "You now have a complete framework for mapping any multi-step AI workflow",
    heading: "Workflow Design: Your Framework",
    elements: [
      { key: "TRIGGER",   color: "#667EEA", light: "#EBF4FF", desc: "What starts the workflow" },
      { key: "AI ACTION", color: "#38B2AC", light: "#E6FFFA", desc: "Where AI generates value" },
      { key: "TRANSFORM", color: "#ED8936", light: "#FFFBEB", desc: "Connects outputs to next inputs" },
      { key: "CONDITION", color: "#48BB78", light: "#F0FFF4", desc: "Routes based on logic" },
      { key: "HANDOFF",   color: "#9F7AEA", light: "#FAF5FF", desc: "Human oversight + system action" },
      { key: "OUTPUT",    color: "#F6AD55", light: "#FFFAF0", desc: "The workflow's final result" },
    ],
    approaches: [
      { icon: "🗺️", label: "Three-Layer Model",  color: "#38B2AC", light: "#E6FFFA", when: "Every workflow has an Input layer (trigger + data), a Processing layer (AI work + logic), and an Output layer (delivery + handoff)" },
      { icon: "🔧", label: "Process → Nodes",     color: "#667EEA", light: "#EBF4FF", when: "Map any process by asking: what triggers this step, what does it do, and what does it hand off to next?" },
      { icon: "⚠️", label: "Design Handoffs",      color: "#9F7AEA", light: "#FAF5FF", when: "Every handoff is a risk or opportunity — implicit handoffs cause errors; explicit handoffs create quality control points" },
    ],
  },

];

const L3T1_ARTICLES: ArticleData[] = [
  {
    id: "a1",
    title: "Why Most AI Productivity Gains Don't Scale — and What Workflow Design Changes",
    source: "McKinsey Digital",
    readTime: "~9 min read",
    desc: "This article examines why most organisations see AI productivity gains at the individual level but struggle to scale them across teams. It explores the gap between ad hoc AI use and repeatable, automated workflows — and what distinguishes organisations that have successfully bridged it.",
    url: "#",
    reflection: "Think about one multi-step process in your work that runs at least weekly. How many of those steps involve structured, repeatable decisions — the kind an AI could handle consistently if given the right trigger and instructions?",
  },
  {
    id: "a2",
    title: "Designing AI Workflows That Survive Human Review",
    source: "Harvard Business Review",
    readTime: "~7 min read",
    desc: "This article explores how to design AI workflows that support rather than bypass human judgment — covering the role of handoff nodes, how to structure outputs for fast review, and the conditions under which it's safe to reduce or remove human checkpoints.",
    url: "#",
    reflection: "In a workflow you currently run manually, which steps would you feel confident automating immediately — and which steps do you think need human review, at least to start? What evidence would change your mind about the latter?",
  },
];

const L3T1_VIDEOS: VideoData[] = [
  {
    id: "v1",
    title: "From Prompts to Processes: Mapping Your First AI Workflow",
    channel: "OXYGY Learning",
    duration: "11 min",
    desc: "A practical walkthrough of workflow mapping using the six-node framework — covering how to identify triggers, chain AI actions, design condition branches, and define handoff points. Includes a live example of mapping a document review process end-to-end.",
    url: "#",
    quiz: [
      { q: "What is the primary purpose of a CONDITION node in an AI workflow?", options: ["To run the AI model", "To route the workflow based on a rule or threshold", "To format the final output", "To notify users"], correct: 1 },
      { q: "Why should most workflows start with fewer conditions rather than more?", options: ["Conditions are expensive to run", "Too many conditions create brittle, hard-to-maintain workflows", "Conditions slow down AI response time", "Conditions require special permissions"], correct: 1 },
    ],
  },
  {
    id: "v2",
    title: "Handoffs, Conditions, and Human-in-the-Loop Design",
    channel: "OXYGY Learning",
    duration: "8 min",
    desc: "A practical guide to designing the handoff and condition layers of an AI workflow — when to route to a human, how to build conditional branches, and how to decide which steps need oversight versus which can run fully automatically.",
    url: "#",
    quiz: [
      { q: "What is a CONDITION node primarily used for?", options: ["To run an AI model on incoming data", "To route the workflow based on a rule or threshold", "To reformat data between steps", "To notify a user that a task is complete"], correct: 1 },
      { q: "When should a human HANDOFF node be kept in a workflow?", options: ["Only when the AI is inaccurate", "When the output carries reputational, legal, or quality risk", "Only during the testing phase", "When the process runs infrequently"], correct: 1 },
    ],
  },
];


/* ══════════════════════════════════════════════════════════════════
   LEVEL 4, TOPIC 1 — Scoping an AI-Powered Tool
   ══════════════════════════════════════════════════════════════════ */

const L4T1_SLIDES: SlideData[] = [

  /* ── Slide 1 — Course Intro ── */
  {
    section: "DASHBOARD DESIGNER", type: "courseIntro",
    heading: "From Idea to Brief: Scoping Your AI Tool",
    subheading: "The barrier to building has moved. AI makes creating tools accessible to everyone — but the bottleneck is no longer technical. It's clarity. This module teaches you to define what you want before you build it.",
    levelNumber: 4,
    topicIcon: "📋",
    estimatedTime: "~20 min",
    objectives: [
      "📋 What a PRD is and why it's the most underrated tool in any AI builder's kit",
      "🎯 The four components of a strong brief: Purpose, Users, Features, and Data Sources",
      "⚖️ How to tell a well-scoped AI tool from an under-defined idea",
      "✅ A scoring framework to pressure-test any brief before you build",
    ],
  },

  /* ── Slide 2 — The New Building Paradigm ── */
  {
    section: "THE REALITY", type: "evidenceHero",
    takeaway: "Building AI tools is no longer a developer skill — it's a professional skill",
    heading: "Anyone can build now.",
    tealWord: "build",
    body: "A new paradigm has arrived: describe what you want in plain language, and an AI tool builds it. No traditional coding required. 'Vibe coding' — the practice of directing AI to generate working software through natural language — has moved AI tool creation into the hands of any knowledge worker.\n\nIn two years, generative AI has moved from experimental to embedded in the majority of organisations. The barrier to creating AI-powered tools has never been lower.",
    stats: [{ value: "65%", valueColour: "#8C3A1A", label: "of organizations now regularly use generative AI — up from 33% just two years earlier", source: "McKinsey", desc: "State of AI Global Survey, 2024", visualType: "dotGrid" }],
    pullQuote: "When building is this accessible, the constraint shifts. The question is no longer 'can you code?' — it's 'can you clearly define what you want?'",
    sourceLink: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    sourceText: "McKinsey Global Survey on AI (2024) — survey of 1,363 participants across industries and geographies",
  },

  /* ── Slide 3 — Most AI Projects Don't Make It ── */
  {
    section: "THE REALITY", type: "evidenceHero",
    takeaway: "The problem isn't the build — it's what comes before it",
    heading: "Most AI projects stall — not because of the tech.",
    tealWord: "stall",
    body: "When organisations are surveyed on why generative AI projects are abandoned after proof of concept, technical failure ranks well below unclear business value, poor data quality, and misaligned expectations.\n\nThe tools work. The problem is that builders couldn't articulate who the tool was for, what it needed to do, or what data it needed to run.",
    stats: [{ value: "30%", valueColour: "#8C3A1A", label: "of generative AI projects will be abandoned after proof of concept — most due to unclear scope or misaligned expectations", source: "Gartner", desc: "Top Strategic Technology Trends, 2024" }],
    pullQuote: "The build takes hours. A project abandoned because the brief was wrong takes weeks.",
    sourceLink: "https://www.gartner.com/en/articles/gartner-top-10-strategic-technology-trends-for-2024",
    sourceText: "Gartner Top Strategic Technology Trends for 2024 — published October 2023",
  },

  /* ── Slide 4 — The Brief Is the Bottleneck ── */
  {
    section: "THE GAP", type: "tensionStatement",
    takeaway: "When building is easy, the brief becomes the bottleneck — not the build",
    heading: "The tool gets built. The problem doesn't get solved.",
    subheading: "When the build takes hours, the wrong build takes hours too.",
    tealPhrase: "the brief becomes the bottleneck",
    footnote: "Most failed AI tools weren't badly built — they were badly defined. The builder knew what to build. Nobody had agreed on what was worth building.",
  },

  /* ── Slide 5 — What is a PRD? ── */
  {
    section: "THE TECHNIQUE", type: "concept",
    takeaway: "A PRD is a structured definition of what you're building, for whom, and why — written before you build",
    heading: "What is a Product Requirements Document?",
    tealWord: "Requirements Document",
    eyebrow: "THE DEFINITION",
    body: "A Product Requirements Document — or PRD — is a written definition of the tool you intend to build, created before a single line of code is written or a single prompt is submitted to an AI builder.\n\nIt answers four questions: What problem does this solve? Who will use it? What should it do? What data does it need?\n\nIt's not a specification for engineers — it's a clarity tool for the builder. In an era where AI can build almost anything you describe, the PRD is how you make sure you describe the right thing.",
    pullQuote: "A PRD isn't bureaucracy. It's the shortest path between an idea and a working tool.",
  },

  /* ── Slide 6 — The Four Components ── */
  {
    section: "THE TECHNIQUE", type: "rctf",
    revealOnNext: true,
    visualId: "l4-prd-components",
    takeaway: "A strong brief has exactly four components — skip one and the build will reflect it",
    heading: "The Four Components of a Brief",
    tealWord: "Four Components",
    subheading: "Click Next to explore each component.",
    elements: [
      {
        key: "PURPOSE",
        color: "#667EEA",
        light: "#EBF4FF",
        icon: "🎯",
        desc: "What problem this tool solves and for whom. A clear purpose includes the trigger (when someone opens the tool), the outcome (what they should be able to do after using it), and the success criteria (how you'll know it's working).",
        example: "A manager opens this dashboard every Monday to see which projects are at risk before the weekly sync",
        whyItMatters: "Without this → any output feels like it worked — there's no agreed definition of success",
      },
      {
        key: "USERS",
        color: "#38B2AC",
        light: "#E6FFFA",
        icon: "👥",
        desc: "Who will actually use the tool day-to-day. Not the team it benefits — the specific person who opens it. Their role, context, technical comfort, and what they already know shape every design decision that follows.",
        example: "A non-technical operations manager who checks in weekly — not a data analyst who reads raw tables",
        whyItMatters: "Without this → features get built for the builder's preferences, not the user's actual needs",
      },
      {
        key: "FEATURES",
        color: "#ED8936",
        light: "#FFFBEB",
        icon: "⚙️",
        desc: "What the tool does: what inputs it accepts, what AI processing it performs, and what outputs it produces. Features should be scoped to what the user needs — not to everything the builder could add.",
        example: "Input: project name. AI step: risk assessment prompt. Output: traffic-light status + one recommended action",
        whyItMatters: "Without this → the build has no scope and expands indefinitely as new ideas arrive",
      },
      {
        key: "DATA SOURCES",
        color: "#48BB78",
        light: "#F0FFF4",
        icon: "🗄️",
        desc: "Where the tool gets its information. Every AI-powered tool depends on data — and many fail at this point because the data required doesn't exist, isn't accessible, or isn't clean enough to use. Define this before you build.",
        example: "Project status from the existing tracker spreadsheet · risk criteria from the delivery framework doc",
        whyItMatters: "Without this → the tool gets built and then discovers the data it needs doesn't exist",
      },
    ],
  },

  /* ── Slide 7 — Spot the Missing Component (Activity) ── */
  {
    section: "THE TECHNIQUE", type: "situationalJudgment",
    takeaway: "Every failing brief has a missing or vague component — learn to identify which one",
    heading: "Which component is under-defined?",
    scenarios: [
      {
        personaName: "Sam",
        personaRole: "Product Manager",
        personaIcon: "sam",
        scenario: "Sam's brief describes a tool to 'give management visibility into project performance.' The data sources are confirmed and the user is defined (a VP who checks in on Fridays). But after launch, the VP doesn't know what to do with what they're seeing. Which component was under-defined?",
        options: [
          "Users — the VP's needs weren't understood well enough",
          "Purpose — 'visibility' doesn't define what decisions this should enable",
          "Data Sources — the data doesn't match what the VP needs to see",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "partial", text: "The user is partially defined — we know who opens the tool. But 'visibility' as a purpose leaves no clear outcome. Without defining what decision the VP should make after using it, there's no way to know if the tool is working." },
          { quality: "strong", text: "Exactly. 'Visibility' isn't a purpose — it's a vague gesture toward one. A strong purpose defines the outcome: what decision the user should be able to make, and what action they should take. Without that, every design decision gets made by default." },
          { quality: "weak", text: "The data sources may well be appropriate — the issue is that we don't know what 'appropriate' looks like because success criteria were never defined. The gap is in purpose, not data." },
        ],
      },
      {
        personaName: "Priya",
        personaRole: "Marketing Lead",
        personaIcon: "priya",
        scenario: "Priya's team builds a tool that surfaces 'key metrics from the sales pipeline for the sales team.' Purpose, features, and data are all confirmed. It launches — and adoption is near zero within two weeks. Which component was most likely under-defined?",
        options: [
          "Features — the tool showed too many metrics",
          "Users — the brief described the team, not the person who opens it and why",
          "Purpose — the success criteria weren't tied to a specific outcome",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "partial", text: "Feature overload is a symptom — but it's caused by not knowing who the actual user is and what they need to do. When you design for 'the sales team,' you design for everyone — which means designing for no one." },
          { quality: "strong", text: "Right. 'The sales team' is not a user. A user is a specific person with a specific need at a specific moment. Is it the rep reviewing their own pipeline before a call? The manager preparing for a Monday forecast? Each person needs something different." },
          { quality: "weak", text: "The purpose was described as clear. But even a well-defined purpose produces the wrong tool if you're building for a team instead of a person. The user definition was too broad to make any design decision." },
        ],
      },
      {
        personaName: "Jordan",
        personaRole: "Operations Analyst",
        personaIcon: "jordan",
        scenario: "Jordan's brief is thorough — purpose, users, and features are all well-defined. The build starts and stalls on day three. The AI classification step can't run because the historical ticket data exists only in PDF format with no consistent structure. Which component should have caught this?",
        options: [
          "Features — the classification feature was too ambitious",
          "Purpose — the success criteria assumed data quality that wasn't there",
          "Data Sources — this needed to be validated before the build started",
        ],
        strongestChoice: 2,
        feedback: [
          { quality: "partial", text: "The feature may need revision — but the root issue is that the data dependency wasn't evaluated before building. Even a simple classification feature fails without accessible, structured data. That's a data sources problem." },
          { quality: "weak", text: "The purpose is well-defined and reasonable. The issue is that the data required to fulfil it was never evaluated for accessibility or quality. A thorough data sources review would have surfaced this on day one, not day three." },
          { quality: "strong", text: "Exactly. The data sources component of a brief isn't just 'what data do we need?' — it's 'does it exist, is it accessible, and is it usable?' PDFs with inconsistent formatting aren't a usable data source for classification without significant preprocessing." },
        ],
      },
    ],
  },

  /* ── Slide 8 — Weak vs. Strong Brief ── */
  {
    section: "SEE THE DIFFERENCE", type: "scenarioComparison",
    takeaway: "The same idea produces a very different tool depending on the brief it's built from",
    heading: "Same idea. Two very different briefs.",
    tealWord: "Two very different",
    body: "Toggle between two briefs for the same tool idea — a project status dashboard for the leadership team. One will produce something. The other will produce the right thing.",
    tabs: [
      {
        label: "Under-defined Brief",
        prompt: "Build a dashboard showing project status for leadership.",
        annotation: "Every design decision — what 'status' means, which projects, what format, which leader, what action they should take — gets made by the AI tool or the builder's assumption. Not by the actual user's need.",
      },
      {
        label: "Strong Brief",
        prompt: "PURPOSE: Give the Head of Delivery a Monday pre-standup view of which projects need attention this week.\n\nUSERS: Head of Delivery — checks for 5 minutes before 9am standup, non-technical, needs actionable summaries not raw data.\n\nFEATURES: Input = project list + status updates. AI step = risk classification + recommended action. Output = traffic-light card per project + one-sentence next step.\n\nDATA SOURCES: Weekly status updates from the existing project tracker spreadsheet, exported every Friday at 5pm.",
        annotation: "Every design decision is now answerable: format (summary-first, mobile-friendly), content (at-risk projects only), language (non-technical, action-oriented), timing (available by Monday 8am).",
      },
    ],
  },

  /* ── Slide 9 — Flipcard: Strong vs. Weak Components ── */
  {
    section: "SEE THE DIFFERENCE", type: "flipcard",
    takeaway: "Specific components produce working tools — vague components produce generic ones",
    heading: "Strong vs. weak at the component level.",
    tealWord: "Strong vs. weak",
    cards: [
      {
        frontLabel: "WEAK PURPOSE",
        frontBadge: "Under-defined",
        frontPrompt: "Create a tool that gives the team visibility into customer feedback.",
        backLabel: "STRONG PURPOSE",
        backBadge: "Well-scoped",
        backPrompt: "Give the Customer Success lead a weekly view of the top 5 recurring complaints, so they can prepare specific talking points for the Friday client review.",
        backResponse: "Clear trigger (weekly), clear user (CS lead), clear output (top 5 complaints), clear use case (client review prep). Every feature decision follows naturally from this.",
      },
      {
        frontLabel: "WEAK USERS",
        frontBadge: "Under-defined",
        frontPrompt: "Users: the leadership team.",
        backLabel: "STRONG USERS",
        backBadge: "Well-scoped",
        backPrompt: "User: the COO. Checks the dashboard Monday mornings for 5 minutes before the weekly review. Non-technical — needs summaries, not charts. Needs to act, not just observe.",
        backResponse: "This level of user detail changes everything: fewer data points, action-oriented language, summary-first layout, mobile-compatible format. 'Leadership team' could mean 12 different people with 12 different needs.",
      },
    ],
  },

  /* ── Slide 10 — Brief Readiness Scoring (Activity) ── */
  {
    section: "IN PRACTICE", type: "situationalJudgment",
    takeaway: "Apply the Brief Readiness Framework: score each component before you build",
    heading: "Is this brief ready to build from?",
    scenarios: [
      {
        personaName: "Aisha",
        personaRole: "Finance Manager",
        personaIcon: "aisha",
        scenario: "A brief reads: 'Build a tool for the finance team that surfaces budget variance data from our monthly reports. The CFO will check it at the end of each month.' Purpose and users are present — but features and data sources are absent. What's the readiness verdict?",
        options: [
          "Ready — purpose and users are clear enough to start",
          "Partial — needs features and data sources before building",
          "Not ready — purpose and users are still too vague",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "weak", text: "Purpose and users are a starting point — but without defined features (what 'surfaces' means in practice) and confirmed data sources (which reports, in what format, how they're accessed), every build decision gets made by default. Starting now adds unnecessary risk." },
          { quality: "strong", text: "Correct. This brief scores well on purpose and users but features and data sources are blank. In the Brief Readiness Framework, any component scoring 0 or 1 is a gap to close before building. Define those two components first." },
          { quality: "partial", text: "Purpose and users are present — the reason to pause isn't them, it's the missing components. Features and data sources are the blockers. The brief doesn't need to be scrapped — it needs two more sections." },
        ],
      },
      {
        personaName: "Marcus",
        personaRole: "Strategy Analyst",
        personaIcon: "marcus",
        scenario: "A brief defines purpose, users, and data sources clearly. Under features, it reads: 'Show everything we know about each client — sentiment, usage data, renewal risk, support history, NPS, and account health.' What's the most likely problem?",
        options: [
          "The feature list is data-led rather than user-need-led — no prioritisation",
          "The data sources may not support all of these features",
          "The purpose needs to be tighter before features can be scoped",
        ],
        strongestChoice: 0,
        feedback: [
          { quality: "strong", text: "Exactly. 'Show everything we know' is not a feature definition — it's an invitation to never finish. Strong features are scoped to what the user needs to decide and act, not to what data exists. This needs to be cut to 2–3 outcomes the user will actually use." },
          { quality: "partial", text: "Data source gaps may emerge — but that's a secondary problem. The primary issue is that this feature list was written by asking 'what do we have?' rather than 'what does the user need?' Scope to user need first, then validate data availability." },
          { quality: "weak", text: "The purpose may be solid — but even a well-defined purpose can't rescue a feature list built around data availability rather than user need. The features component is the problem here." },
        ],
      },
      {
        personaName: "Sam",
        personaRole: "Operations Lead",
        personaIcon: "sam",
        scenario: "Sam has a brief that scores 3 on purpose, 3 on users, 2 on features, and 2 on data sources — a total of 10 out of 12. Is this brief ready to build from?",
        options: [
          "Yes — a score of 10 or above is ready to build",
          "Not quite — the two partial scores need more detail first",
          "No — all four components need to score 3 before building",
        ],
        strongestChoice: 0,
        feedback: [
          { quality: "strong", text: "A brief scoring 10 or above is build-ready. Scores of 2 on features and data sources mean some assumptions will be tested in the first day of building — which is fine. A score of 10/12 means the core decisions are made. Build it." },
          { quality: "partial", text: "A score of 2 means 'partial but defined' — not 'vague and risky.' The Brief Readiness Framework sets 10 as the threshold because expecting perfect clarity before starting is a path to never building. Partial clarity on features and data is enough to proceed." },
          { quality: "weak", text: "A score of 3 on every component is aspirational, not required. Waiting for perfect clarity produces paralysis — not better tools. The threshold is 10/12, which flags genuine gaps (0s and 1s) without demanding a specification-grade document." },
        ],
      },
    ],
  },

  /* ── Slide 11 — The Brief Readiness Framework ── */
  {
    section: "IN PRACTICE", type: "concept",
    takeaway: "Score your brief on four dimensions before you build — a score of 10+ means you're ready",
    heading: "The Brief Readiness Framework.",
    tealWord: "Brief Readiness Framework",
    eyebrow: "YOUR PRE-BUILD CHECKPOINT",
    body: "Before you open any AI builder tool, score your brief on each of the four components:\n\n3 — Specific: clear enough to make a design decision from it\n2 — Partial: defined, but some decisions still need more detail\n1 — Vague: something is there, but not specific enough to act on\n0 — Missing: not addressed at all\n\nA brief scoring 10 or above (out of 12) is ready to build from. Below 8, identify your lowest-scoring component and define it further before starting. Any 0 is a blocker — do not build until it has at least a 1.",
    pullQuote: "A brief that scores 10 takes 20 minutes to write. The rebuild it prevents takes weeks.",
  },

  /* ── Slide 12 — Module Summary ── */
  {
    section: "WRAP UP", type: "moduleSummary",
    takeaway: "You now have a complete framework for scoping any AI-powered tool before you build it",
    heading: "The Brief: Your Pre-Build Toolkit",
    tealWord: "Pre-Build Toolkit",
    elements: [
      { key: "PURPOSE",      color: "#667EEA", light: "#EBF4FF", desc: "What problem it solves and how success is defined" },
      { key: "USERS",        color: "#38B2AC", light: "#E6FFFA", desc: "Who opens it, when, and what they need to do" },
      { key: "FEATURES",     color: "#ED8936", light: "#FFFBEB", desc: "Inputs, AI processing, outputs — scoped to user need" },
      { key: "DATA SOURCES", color: "#48BB78", light: "#F0FFF4", desc: "What data the tool needs — and whether it exists" },
    ],
    approaches: [
      { icon: "📋", label: "Write before you build", color: "#667EEA", light: "#EBF4FF", when: "Before opening any AI builder — write all four components. Even a rough first draft surfaces gaps you wouldn't find mid-build." },
      { icon: "✅", label: "Score before you start",  color: "#38B2AC", light: "#E6FFFA", when: "Use the Brief Readiness Framework. Any component scoring 0 or 1 needs more definition before you proceed." },
      { icon: "🎯", label: "Define users precisely",  color: "#ED8936", light: "#FFFBEB", when: "The more specific your user definition, the fewer design decisions get made by default. A team is not a user. A person with a specific task is." },
    ],
  },

  /* ── Slide 13 — Bridge to Dashboard Designer ── */
  {
    section: "WHAT'S NEXT", type: "bridge",
    heading: "Your brief is ready. Now build it.",
    body: "You've defined purpose, users, features, and data sources. You've scored your brief against the readiness framework. The Dashboard Designer takes it from here — walk through the scoping tool, refine your components, and produce a specification ready to build from.",
    ctaText: "Open the Dashboard Designer →",
    ctaHref: "/app/level-4/app-designer",
    panelHeading: "What the Dashboard Designer does",
    panelItems: [
      "Guides you through each brief component step by step",
      "Flags gaps between your features and your data sources",
      "Scores your brief on the Brief Readiness Framework",
      "Produces a shareable specification document",
    ],
  },

];

const L4T1_ARTICLES: ArticleData[] = [
  {
    id: "a1",
    title: "The State of AI in 2024: Building Has Gone Mainstream — Briefing Hasn't",
    source: "McKinsey Global Institute",
    readTime: "~12 min read",
    desc: "McKinsey's annual global AI survey tracks how organisations are adopting, deploying, and — most importantly — failing to scale generative AI. The patterns of project abandonment map directly to the four components of a weak brief: unclear purpose, unspecified users, undefined features, and unvalidated data.",
    url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    reflection: "Which of the failure modes described in this report most closely resembles a project you've seen stall or underdeliver? Which PRD component would have changed the outcome?",
  },
  {
    id: "a2",
    title: "Why Software Projects Fail — and What Requirements Have to Do With It",
    source: "Harvard Business Review",
    readTime: "~8 min read",
    desc: "A recurring finding across decades of software project research: the number one cause of project failure is not technical complexity — it's unclear requirements. This HBR analysis connects the dots between product definition quality and delivery outcomes, with practical implications for anyone scoping an AI-powered tool.",
    url: "https://hbr.org/2021/09/why-your-it-project-may-be-riskier-than-you-think",
    reflection: "The article distinguishes between 'soft failures' (delivered but not used) and 'hard failures' (cancelled or abandoned). Which type of failure is more likely when the Users component of a brief is under-defined?",
  },
  {
    id: "a3",
    title: "How to Write a Product Requirements Document",
    source: "Nielsen Norman Group",
    readTime: "~10 min read",
    desc: "The Nielsen Norman Group's definitive guide to writing PRDs that actually drive design decisions. Covers how to frame user needs, how to distinguish a feature from a capability, and how to write requirements that a builder — human or AI — can act on without interpretation.",
    url: "https://www.nngroup.com/articles/ux-without-user-research/",
    reflection: "NNG makes a distinction between 'user requirements' and 'product requirements.' How does this map to the Users and Features components of the PRD framework from this module?",
  },
];

const L4T1_VIDEOS: VideoData[] = [
  {
    id: "v1",
    title: "What Is Vibe Coding — and Why It Changes Everything About How We Build",
    channel: "Y Combinator",
    duration: "18:42",
    desc: "An accessible introduction to the 'vibe coding' paradigm — describing what you want in natural language and letting AI generate the implementation. This video covers how the shift changes the skill profile of effective builders and why brief quality has become the determining factor in whether a tool works.",
    url: "https://www.youtube.com/watch?v=XHmNXf8Gxrg",
    quiz: [
      {
        q: "According to the video, what has become the primary bottleneck in AI-assisted building?",
        options: [
          "Access to capable AI models",
          "Clearly defining what you want the tool to do",
          "Finding engineers who understand the AI tools",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "v2",
    title: "Product Thinking for Non-Product People: How to Define What You're Building",
    channel: "Lenny's Podcast",
    duration: "24:15",
    desc: "Lenny Rachitsky interviews product leaders on how non-PMs approach product definition — and where they consistently go wrong. The recurring theme: skipping from idea to build without stopping to define who the tool is for and what success looks like. Directly applicable to the PRD framework in this module.",
    url: "https://www.youtube.com/watch?v=GWkMs385Uas",
    quiz: [
      {
        q: "The video describes a common mistake when scoping a new tool. What is it?",
        options: [
          "Defining features before defining the user",
          "Spending too long on the brief before starting to build",
          "Using too many data sources in the first version",
        ],
        correct: 0,
      },
    ],
  },
  {
    id: "v3",
    title: "How to Write a PRD: Structure, Examples, and Common Mistakes",
    channel: "Product School",
    duration: "21:30",
    desc: "A practical walkthrough of the PRD format, with real examples of weak and strong briefs for the same product idea. Covers the four components covered in this module — purpose, users, features, and data — and demonstrates how each component change affects the resulting tool.",
    url: "https://www.youtube.com/watch?v=NxG1PMTQ1Qo",
    quiz: [
      {
        q: "In the video's before/after comparison, what single change had the biggest impact on the quality of the resulting tool?",
        options: [
          "Specifying more features in the brief",
          "Defining a specific user instead of a general audience",
          "Adding more detail to the data sources section",
        ],
        correct: 1,
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════
   TOPIC CONTENT REGISTRY
   ══════════════════════════════════════════════════════════════════ */

export const TOPIC_CONTENT: Record<string, TopicContent> = {
  "1-1": {
    slides: L1T1_SLIDES,
    articles: L1T1_ARTICLES,
    videos: L1T1_VIDEOS,
  },
  "2-1": {
    slides: L2T1_SLIDES,
    articles: L2T1_ARTICLES,
    videos: L2T1_VIDEOS,
  },
  "3-1": {
    slides: L3T1_SLIDES,
    articles: L3T1_ARTICLES,
    videos: L3T1_VIDEOS,
  },
  "4-1": {
    slides: L4T1_SLIDES,
    articles: L4T1_ARTICLES,
    videos: L4T1_VIDEOS,
  },
};

export function getTopicContent(level: number, topicId: number): TopicContent | undefined {
  return TOPIC_CONTENT[`${level}-${topicId}`];
}
