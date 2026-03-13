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
  stats?: Array<{ value: string; valueColour: string; label: string; source: string; desc?: string; logoPath?: string }>;
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
    name: string; initial: string; role: string; color: string;
    tags: string[]; approach: string; approachDef: string; bestFor: string;
    prompt: string; output: string; why: string;
    modifier?: string | null; modDef?: string | null;
  };
  /* Individual situational judgment exercise (L1 v2) */
  sjData?: {
    situationNum: number; heading: string; body: string; bullets: string[];
    options: string[]; correct: number; feedback: string[];
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
    meta: ["~25 min", "16 slides", "Interactive", "Beginner friendly"],
    objectives: [
      "Why the same AI tools produce wildly different results across professionals",
      "The six-component Prompt Blueprint framework (RCTF + Steps + Checks)",
      "Five prompting approaches and when to use each",
      "How to choose the right technique for any task you face",
    ],
  },

  /* ── Slide 2 — Adoption Has Surged ── */
  { section: "THE REALITY", type: "evidenceHero",
    heading: "Adoption has surged.",
    tealWord: "surged",
    body: "AI tools are no longer experimental. They're embedded in the daily workflows of most knowledge workers — across every function, every level, every industry.",
    stats: [{ value: "75%", valueColour: "#38B2AC", label: "of knowledge workers now use generative AI as part of their regular workflow", source: "McKinsey & Company", desc: "2024", logoPath: "/logos/McKinsey___Company_idXaAYJuer_0.svg" }],
    pullQuote: "75% of your colleagues, clients, and competitors. The tools are already in the room.",
  },

  /* ── Slide 3 — Same Tools, Very Different Results ── */
  { section: "THE REALITY", type: "chart",
    heading: "Same tools. Very different results.",
    tealWord: "Very different",
    body: "Even with access to the same tools, how professionals use them varies enormously. Usage is rising. But so are expectations — and the gap between casual users and skilled ones is growing.",
    pullQuote: "The bar keeps moving. Being an AI user isn't enough — being a skilled one is what creates the gap.",
  },

  /* ── Slide 4 — Prompting Is the Foundation ── */
  { section: "THE REALITY", type: "pyramid",
    heading: "Prompting is the foundation everything else is built on.",
    tealWord: "foundation",
    body: "Every AI agent, automated workflow, intelligent dashboard, and full-stack application runs on prompts. Get the foundation right and every layer above it gets better.",
    pullQuote: "Every level of the Oxygy framework builds on the skills from this one. This is where it starts.",
  },

  /* ── Slide 5 — Manager Onboarding Scenario ── */
  { section: "SEE THE DIFFERENCE", type: "scenarioComparison",
    heading: "Onboarding a new team member.",
    body: "They're capable, eager, and smart — but they know nothing about this project. You need them to produce a stakeholder summary by end of day.",
    pullQuote: "The technology is identical. The value you extract from it is entirely determined by the quality of your briefing.",
  },

  /* ── Slide 6 — Interactive Context Bar ── */
  { section: "SEE THE DIFFERENCE", type: "contextBar",
    heading: "Context is the fuel. Fill the tank.",
    tealWord: "Fill the tank",
    body: "Each component you provide eliminates a set of assumptions. Press Next to reveal each one.",
  },

  /* ── Slide 7 — Sam the Brain Dumper ── */
  { section: "THE APPROACHES", type: "persona",
    heading: "Sam — Brain Dump",
    personaData: {
      name: "Sam", initial: "S", role: "Programme Coordinator", color: "#ED8936",
      tags: ["Synthesising notes", "Finding themes", "Making sense of ambiguity"],
      approach: "Brain Dump",
      approachDef: "Pour in everything — rough notes, half-formed thoughts, scattered observations — and let the AI find the structure. You're not organising your thinking first. You're using the AI to help you do it.",
      bestFor: "Early-stage thinking. Unknown output shape. When speed matters more than precision.",
      prompt: "Here's everything from today — my notes from the three sessions, some thoughts on what I think the priorities are (but I'm not sure), a couple of things people said that felt important but I haven't processed yet.\n\nHelp me find the structure. What are the three most important themes? What am I missing?\n\n[Raw notes, voice memo transcript — unedited]",
      output: "Three clear themes emerged from your notes:\n\n1. Stakeholder alignment is fragile — two workstream leads have conflicting priorities that haven't been surfaced publicly.\n\n2. The timeline assumption for Phase 2 doesn't account for the procurement dependency flagged in your third bullet.\n\n3. There's a resource gap: three mentions of 'capacity concerns' across different sessions point to a systemic issue, not isolated complaints.\n\nWhat you may be missing: no one has named who owns the decision on timeline. That's likely why the conflicting priorities haven't been resolved.",
      why: "Sam's work starts messy by nature. Structuring before prompting would slow them down. The brain dump lets the AI do the initial organisation.",
      modifier: null, modDef: null,
    },
  },

  /* ── Slide 8 — Priya the Conversationalist ── */
  { section: "THE APPROACHES", type: "persona",
    heading: "Priya — Conversational",
    personaData: {
      name: "Priya", initial: "P", role: "Strategy Analyst", color: "#805AD5",
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
  },

  /* ── Slide 9 — Marcus the Structured Input Provider ── */
  { section: "THE APPROACHES", type: "persona",
    heading: "Marcus — Structured Input",
    personaData: {
      name: "Marcus", initial: "M", role: "Delivery Lead", color: "#38B2AC",
      tags: ["Executive briefings", "Stakeholder summaries", "Board-ready documents"],
      approach: "Structured Input",
      approachDef: "Give the AI detailed context about the audience, purpose, and constraints — everything it needs to get it right first time. Not necessarily the full Blueprint, but rich context front-loaded into one message.",
      bestFor: "High-stakes deliverables. Known audience. When it needs to be right first time.",
      prompt: "I need a 400-word executive summary for the quarterly review. The audience is the CFO and two divisional heads — they care about commercial impact and timeline risk. Cover: (1) progress against milestones, (2) biggest risk + mitigation, (3) one recommendation. Direct tone, no jargon.\n\n[Notes attached]",
      output: "1. Milestone Progress: Three of four Q2 milestones are complete or on track. The shared-services migration (Milestone 3) is 2 weeks ahead of schedule, driven by early vendor alignment. Milestone 4 (CRM integration) is at risk — see below.\n\n2. Risk: CRM data extraction has encountered a format incompatibility with the legacy system that was not identified in the scoping phase. Current delay: 3 weeks. Mitigation: a parallel extraction using the API bridge is being tested this week; results expected by Friday.\n\n3. Recommendation: Approve the revised CRM timeline at Thursday's SteerCo and reallocate 2 FTE from the completed Milestone 1 workstream to support the extraction team.",
      why: "Marcus's outputs go straight to senior leaders. No iteration window — it needs to land first time. Front-loading context eliminates guesswork.",
      modifier: "Few-Shot Examples",
      modDef: "Show the AI what good looks like by providing 1–3 reference examples it should match.",
    },
  },

  /* ── Slide 10 — Aisha the Brainstormer ── */
  { section: "THE APPROACHES", type: "persona",
    heading: "Aisha — Brainstorming Partner",
    personaData: {
      name: "Aisha", initial: "A", role: "Communications Lead", color: "#E53E3E",
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
  },

  /* ── Slide 11 — Jordan the Blueprint Builder ── */
  { section: "THE APPROACHES", type: "persona",
    heading: "Jordan — Prompt Blueprint",
    personaData: {
      name: "Jordan", initial: "J", role: "Process Designer", color: "#1A202C",
      tags: ["Repeatable reports", "Templated outputs", "Team-wide consistency"],
      approach: "Prompt Blueprint",
      approachDef: "Use the six-component framework — Role, Context, Task, Format, Steps, Checks — to create a precise, reusable template. Invest upfront; the return compounds across every future use.",
      bestFor: "Repeatable tasks. Team-wide consistency. When format and quality must be predictable.",
      prompt: "Role: Senior analyst in operational performance.\nContext: Weekly status report for programme sponsor and three workstream leads. They want milestone progress, risks, resource utilisation. No methodology details.\nTask: Produce this week's status report.\nFormat: Four sections with headers. Max 500 words. Table for milestones. Professional tone.\nSteps: Summarise RAG ratings → flag changed risks → calculate utilisation → recommend 1–2 actions.\nChecks: RAG must match source data. No risk without mitigation. Figures as percentages, not headcount.\n\n[This week's data attached]",
      output: "MILESTONE PROGRESS\n| Milestone | Target | Status | RAG |\n| Shared Services Migration | 15 Mar | On track | Green |\n| CRM Data Extract | 28 Feb | 3 weeks delayed | Red |\n| Vendor Onboarding | 31 Mar | Complete | Green |\n| Change Comms | 15 Apr | On track | Amber |\n\nRISKS & ISSUES\n• CRM delay: format incompatibility with legacy system. Mitigation: parallel API extraction in testing.\n• Change Comms: regional teams report confusion about new escalation paths. Mitigation: supplementary FAQ being drafted...",
      why: "Jordan does this every Friday. The Blueprint took 20 minutes to write once. It now takes 30 seconds to reuse — just swap in new data.",
      modifier: null, modDef: null,
    },
  },

  /* ── Slide 12 — Situation Matrix ── */
  { section: "THE TOOLKIT", type: "situationMatrix",
    heading: "Which approach fits which situation?",
    tealWord: "situation",
    body: "The right choice depends on how well you know the desired output and whether the task repeats. Click any situation row to see a real-world example.",
  },

  /* ── Slide 13 — SJ Exercise 1 ── */
  { section: "APPLY IT", type: "sjExercise",
    heading: "Situational Judgment",
    sjData: {
      situationNum: 1, heading: "Unstructured start.",
      body: "You have rough notes from a brainstorming session and need to identify themes before deciding what the deliverable should be.",
      bullets: ["Three pages of workshop notes", "No clear output format yet", "30 minutes before the next meeting"],
      options: ["Brain Dump", "Conversational", "Blueprint"],
      correct: 0,
      feedback: [
        "Exactly right. You don't know the output shape yet — let the AI find the structure in your raw thinking.",
        "Could work iteratively, but with this much unstructured input a brain dump gets you to structure faster. Conversational works better once you have a direction.",
        "Requires you to specify format and structure upfront — but you don't have that clarity yet. Blueprint is for when you know what good looks like.",
      ],
    },
  },

  /* ── Slide 14 — SJ Exercise 2 ── */
  { section: "APPLY IT", type: "sjExercise",
    heading: "Situational Judgment",
    sjData: {
      situationNum: 2, heading: "Weekly. Same format. High stakes.",
      body: "You need to produce a status update that three senior stakeholders will read. You'll do this same task every Friday for three months.",
      bullets: ["Known audience and format", "Quality must be consistent", "Runs on new data each week"],
      options: ["Brain Dump", "Conversational", "Blueprint"],
      correct: 2,
      feedback: [
        "Would produce something each week, but quality would vary. When consistency and repeatability matter, invest upfront.",
        "Good for a first draft. But you'd redo the iteration every Friday. The Blueprint approach lets you build once and reuse.",
        "A reusable template where you just swap in new data each week. The upfront effort compounds into efficiency and consistent quality over time.",
      ],
    },
  },

  /* ── Slide 15 — SJ Exercise 3 ── */
  { section: "APPLY IT", type: "sjExercise",
    heading: "Situational Judgment",
    sjData: {
      situationNum: 3, heading: "Direction unknown. Thinking out loud.",
      body: "You're drafting a section of a proposal and you're not sure about the right angle. You want to explore a few directions before committing.",
      bullets: ["Blank page, multiple possible angles", "No final output shape yet", "You want to steer, not specify"],
      options: ["Brain Dump", "Conversational", "Blueprint"],
      correct: 1,
      feedback: [
        "Could surface initial ideas, but exploration requires the ability to steer across turns — which brain dump doesn't give you.",
        "When you want to explore and steer, conversational gives you control. Each turn sharpens the direction. Exactly the right fit.",
        "Locks you into a format before you've decided the angle. Structure becomes a constraint here, not a help.",
      ],
    },
  },

  /* ── Slide 16 — Bridge to Prompt Playground ── */
  { section: "WHAT'S NEXT", type: "bridge",
    heading: "Now build one.",
    body: "You've met five professionals who've each figured out their approach. You've seen the toolkit and the matrix. The next step is to use it on a real piece of your own work.",
    ctaText: "Open Prompt Playground →",
    ctaHref: "/app/toolkit/prompt-playground",
    panelHeading: "In the Playground, you'll:",
    panelItems: [
      "Choose a real task from your current work",
      "Decide which approach fits using the situation matrix",
      "Build your prompt with the right technique",
      "Compare your output against the quality markers from this module",
    ],
  },
];

const L1T1_ARTICLES: ArticleData[] = [
  { id: "a1", title: "What Separates Power Users from Everyone Else When Using AI at Work", source: "Harvard Business Review", readTime: "7 min read", desc: "How structured prompting is changing the way knowledge workers interact with AI tools — and what consistently separates professionals who get great outputs from those who get generic ones.", url: "#", reflection: "In one sentence, what was the single most useful idea from this article that you could apply to your own work this week?" },
  { id: "a2", title: "Why the Way You Ask Matters More Than the Tool You Use", source: "MIT Technology Review", readTime: "8 min read", desc: "A deep-dive into why prompt structure has more impact on output quality than model choice — with real examples from professional knowledge work across industries.", url: "#", reflection: "Describe one specific situation from your own work where structuring your prompt differently could have meaningfully improved the output you received." },
];

const L1T1_VIDEOS: VideoData[] = [
  { id: "v1", title: "The Prompting Spectrum in Practice", channel: "Oxygy Learning", duration: "8 min", desc: "A live walkthrough of all three prompting approaches — brain dump, conversational, and structured Blueprint — applied to the same professional task.", url: "#", quiz: [
    { q: "When is a brain dump approach most effective?", options: ["When you need a repeatable template for a weekly task", "When you have unstructured thoughts and don't yet know the output shape", "When the audience requires a specific format and professional tone", "When you want to iterate across multiple turns"], correct: 1 },
    { q: "What is the primary difference between the Conversational approach and the Structured Blueprint?", options: ["Conversational is faster; Blueprint is slower", "Conversational works for creative tasks only; Blueprint works for analytical tasks only", "Conversational builds quality across turns; Blueprint specifies everything upfront in one message", "Conversational doesn't use any Blueprint components; Blueprint uses all six"], correct: 2 },
  ]},
  { id: "v2", title: "Modifier Techniques: Chain of Thought, Few-Shot, and Iterative Refinement", channel: "Oxygy Learning", duration: "6 min", desc: "How the three modifier techniques change AI reasoning — with side-by-side examples showing the impact of each modifier on the same base prompt.", url: "#", quiz: [
    { q: "Modifier techniques change how the AI _____, not what _____ you give it.", options: ["responds / feedback", "reasons / information", "formats / templates", "writes / examples"], correct: 1 },
    { q: "Which scenario would benefit most from a Few-Shot Examples modifier?", options: ["You need the AI to think step by step through a complex problem", "You want to refine an output that's close but not quite right", "You need the AI to match a specific quality standard or format you've used before", "You're brainstorming and want the AI to explore multiple angles"], correct: 2 },
  ]},
];


/* ══════════════════════════════════════════════════════════════════
   LEVEL 2, TOPIC 1 — From Prompts to Reusable Tools
   ══════════════════════════════════════════════════════════════════ */

const L2T1_SLIDES: SlideData[] = [
  { section: "THE LEVEL 2 SHIFT", type: "courseIntro",
    heading: "From Prompts to Reusable Tools",
    subheading: "Building AI agents that standardise quality, save time, and scale across your team",
    body: "Level 1 taught you how to write effective prompts. This module shows you when and how to turn a prompt into a permanent, shareable tool — an AI agent that runs the same way every time, for anyone on your team.",
    levelNumber: 2,
    topicIcon: "🤖",
    estimatedTime: "~20 minutes",
    objectives: [
      "Recognise when a task should be an agent vs. an ad-hoc prompt",
      "Architect agents using the three-layer model (input, processing, output)",
      "Build accountability features into agent design",
      "Document and share agents for team deployment",
    ],
  },
  { section: "THE LEVEL 2 SHIFT", type: "concept",
    heading: "The gap between using AI and scaling AI",
    tealWord: "scaling",
    body: "Research consistently shows that professionals who use AI regularly report productivity gains of 20–40%. But only a fraction of those gains extend beyond the individual — most AI usage stays ad-hoc, unrepeatable, and invisible to the rest of the team.\n\nThe difference between personal productivity and organisational capability isn\u2019t how well you prompt. It\u2019s whether you\u2019ve turned your best prompts into tools others can use.",
    pullQuote: "The organisations seeing the largest returns from AI aren\u2019t prompting better. They\u2019re building reusable tools from their best prompts.",
    visualId: "l2-adoption-gap",
  },
  { section: "THE LEVEL 2 SHIFT", type: "concept",
    heading: "What most people haven\u2019t been shown",
    tealWord: "shown",
    body: "When you write a prompt that works well, you move on. Next week, you write something similar — but slightly different. A colleague writes their own version for the same task. The outputs vary in structure and detail.\n\nThere\u2019s no shared standard, no way to replicate good results consistently. This isn\u2019t a failure — it\u2019s simply what happens when the step from prompt to tool hasn\u2019t been taken yet.",
    pullQuote: "Level 1 is for the individual moment. Level 2 is for the repeated pattern.",
    visualId: "l2-diverging-paths",
  },
  { section: "BUILDING REUSABLE TOOLS", type: "concept",
    heading: "From one-off prompts to standardised agents",
    tealWord: "standardised",
    body: "The shift from Level 1 to Level 2 isn\u2019t about complexity — it\u2019s about repeatability. At Level 1, you prompt individually, get an answer, and move on. At Level 2, you\u2019ve identified a repeated task and you standardise three things: what goes in (the input format), how the AI behaves (the system prompt), and what comes out (the structured output).\n\nThe result runs the same way every time, for anyone.",
    pullQuote: "A Level 2 agent is a prompt that\u2019s been promoted to a permanent tool — with defined inputs, defined behaviour, and defined outputs.",
    visualId: "l2-level-comparison",
  },
  { section: "BUILDING REUSABLE TOOLS", type: "spectrum",
    heading: "When to build an agent vs. when to just prompt",
    tealWord: "prompt",
    body: "Not every task needs a reusable agent. The skill is recognising when a task\u2019s characteristics make it worth the investment. Use this spectrum to calibrate — and remember, the right approach depends on the situation.",
    positions: [
      { label: "Stay at Level 1", desc: "Low frequency, unique each time, no one else needs it. An ad-hoc prompt is the right tool for this.", example: "Drafting a one-time message about a unique situation — different every time, no repeatable pattern." },
      { label: "Consider Level 2", desc: "Moderate frequency, some consistency benefits, could be useful for one or two others. Worth evaluating further.", example: "Summarising meeting notes into action items — happens regularly, but the format isn\u2019t critical to standardise yet." },
      { label: "Build a Level 2 Agent", desc: "High frequency, output must be consistent, multiple people do the same task, inconsistency causes problems downstream.", example: "Preparing a structured weekly status update from multiple inputs — happens every week, the team needs a standard format, and inconsistent outputs cause confusion." },
    ],
  },
  { section: "BUILDING REUSABLE TOOLS", type: "quiz",
    heading: "Quick check",
    quizEyebrow: "PRACTICE — QUESTION 1 OF 3",
    question: "A colleague uses AI every morning to proofread their own emails before sending. The output doesn\u2019t need a specific format, and no one else on the team uses the same prompt. Which level is this?",
    quizOptions: [
      "Level 1 — ad-hoc prompting is the right fit",
      "Level 2 — this should be built as a reusable agent",
      "It depends on how complex the emails are",
      "It depends on how many emails they send",
    ],
    correct: 0,
    explanation: "This is Level 1 territory. The task is personal, the format doesn\u2019t need to be standardised, and there\u2019s no team-wide benefit to packaging it as a shared tool. Frequency alone doesn\u2019t make something a Level 2 candidate — consistency needs and shareability matter just as much.",
  },
  { section: "THE THREE LAYERS", type: "concept",
    heading: "Input, processing, output — the anatomy of a Level 2 agent",
    tealWord: "output",
    body: "Every Level 2 agent is built from three layers.\n\nLayer 1 — Input Definition: what data does the user provide each time, and in what format?\n\nLayer 2 — Processing / Behaviour: the system prompt — role definition, task instructions, reasoning steps, quality checks. This is the agent\u2019s permanent operating manual.\n\nLayer 3 — Output Definition: what structure does the output take? What fields, what format? This is where structured output — including JSON — ensures consistency across every run.",
    pullQuote: "The system prompt is the Prompt Blueprint from Level 1 — promoted. What was a one-off prompt becomes permanent instructions.",
    visualId: "l2-three-layers",
  },
  { section: "THE THREE LAYERS", type: "comparison",
    heading: "The same task, three approaches",
    scenario: "You need to produce a structured weekly status update from meeting notes, email threads, and project tracker entries.",
    tabs: [
      { label: "Ad-hoc prompt", prompt: "Summarise these notes into a status update for my team.", annotation: "No defined input format. No behaviour instructions. No output structure. Works once — but the result is different every time and from every person." },
      { label: "With input + processing", prompt: "You are a project status analyst. I will provide meeting notes, email excerpts, and tracker data. For each project: identify current status (on track / at risk / blocked), summarise key updates in 2–3 sentences, and list next actions with owners.", annotation: "The role and task are now defined. The AI knows what to do and how to reason about it — but the output is still free-form text. Format varies run to run." },
      { label: "Full three-layer agent", prompt: "You are a project status analyst. I will provide meeting notes, email excerpts, and tracker data. For each project: identify current status, summarise key updates, and list next actions with owners. Output as JSON with fields: project_name (string), status (enum: on_track / at_risk / blocked), summary (string), key_updates (array of strings), next_actions (array of {action, owner, deadline}), confidence_score (float 0–1), evidence_sources (array of strings).", annotation: "Now the output is structured, consistent, and machine-readable. Every run produces the same format — comparable week over week, shareable across the team, and ready for dashboards at Level 3." },
    ],
  },
  { section: "ACCOUNTABILITY BY DESIGN", type: "concept",
    heading: "Designing agents that make verification easy",
    tealWord: "verification",
    body: "Human-in-the-loop isn\u2019t \u2018review the output before you act on it\u2019 — that\u2019s expected regardless. The real skill is designing the agent so that verification is fast, targeted, and built into the output itself.\n\nThis means writing specific instructions into the system prompt — Layer 2 — that require the AI to show its working, cite its sources, and flag its uncertainties.",
    pullQuote: "A well-designed agent doesn\u2019t just give you answers. It gives you the evidence to check them in minutes, not hours.",
    visualId: "l2-hitl-output",
  },
  { section: "ACCOUNTABILITY BY DESIGN", type: "flipcard",
    heading: "What accountability looks like in the output",
    instruction: "Click each card to see how built-in accountability features change the agent\u2019s output.",
    cards: [
      {
        frontLabel: "Status update — standard output",
        frontBadge: "WITHOUT ACCOUNTABILITY FEATURES",
        frontPrompt: "Project Alpha: On track. Key updates: stakeholder meeting confirmed, timeline approved. Next actions: finalise budget, schedule review.",
        backLabel: "Status update — with accountability features",
        backBadge: "WITH ACCOUNTABILITY FEATURES",
        backPrompt: "Project Alpha: On track (confidence: 0.85). Key updates: stakeholder meeting confirmed [source: email from J. Lee, 7 Mar], timeline approved [source: meeting notes, 5 Mar]. Next actions: finalise budget (owner: finance lead, deadline: 14 Mar), schedule review (owner: PM, deadline: 12 Mar). Note: no tracker update found for Project Alpha since 28 Feb — recommend verifying current status directly.",
        backResponse: "The second version adds source citations, a confidence score, ownership and deadlines on actions, and an anomaly flag — all from system prompt instructions, not from the user doing extra work.",
      },
      {
        frontLabel: "Research summary — standard output",
        frontBadge: "WITHOUT ACCOUNTABILITY FEATURES",
        frontPrompt: "The three most common themes across the documents are: digital transformation readiness, resource allocation concerns, and stakeholder alignment challenges.",
        backLabel: "Research summary — with accountability features",
        backBadge: "WITH ACCOUNTABILITY FEATURES",
        backPrompt: "Theme 1: Digital transformation readiness (confidence: 0.91, cited in docs 1, 3, 4 — paragraphs 2, 7, 12). Theme 2: Resource allocation concerns (confidence: 0.78, cited in docs 2, 4 — paragraphs 4, 9). Theme 3: Stakeholder alignment (confidence: 0.64, cited in doc 3 only — paragraph 11. Low confidence: only one source document supports this theme. Suggested verification: review doc 3, paragraph 11 directly).",
        backResponse: "Source locations, confidence scoring, and a low-confidence flag with a specific verification suggestion — the human reviewer knows exactly where to look and what to check.",
      },
    ],
  },
  { section: "ACCOUNTABILITY BY DESIGN", type: "quiz",
    heading: "Quick check",
    quizEyebrow: "PRACTICE — QUESTION 2 OF 3",
    question: "Where are human-in-the-loop accountability features implemented in a Level 2 agent?",
    quizOptions: [
      "In a separate review checklist given to the person using the output",
      "In the system prompt (Layer 2) — as instructions the agent follows every time",
      "In the output template (Layer 3) — as required JSON fields",
      "In both the system prompt and the output template working together",
    ],
    correct: 3,
    explanation: "The accountability features are written as instructions in the system prompt (Layer 2) — telling the AI to cite sources, score confidence, show reasoning, and flag anomalies. But they also need corresponding fields in the output template (Layer 3) so there\u2019s a consistent place for this information in every output. Both layers work together.",
  },
  { section: "FROM TOOL TO TEAM ASSET", type: "concept",
    heading: "The value multiplier: sharing what you\u2019ve built",
    tealWord: "sharing",
    body: "A Level 2 agent that only you use is a personal shortcut. The same agent, documented and shared, becomes team infrastructure. The sharing step is where the real return on investment happens — one person\u2019s design effort multiplied across everyone who does the same task.\n\nThis requires three things: an Agent Card that documents scope and limitations, a standardised input template so anyone can provide the right data, and a cold test — having someone unfamiliar run the agent using only the documentation.",
    pullQuote: "The principle is simple: build once, share always. The agent captures your expertise in a form anyone can use.",
    visualId: "l2-hub-spoke",
  },
  { section: "TECHNIQUE IN ACTION", type: "branching",
    heading: "Your team needs a standardised weekly status tool",
    scenario: "Your team lead has asked you to create a reusable tool for producing the weekly status update. Multiple team members will use it. The output goes directly to leadership. How would you approach this?",
    branchingOptions: [
      {
        label: "Share a well-crafted prompt",
        prompt: "Write a detailed prompt for the weekly status update task and share it with the team via email or a shared document, so colleagues can copy-paste it when they need it.",
        responseQuality: "partial",
        response: "The prompt works well — for you. But each team member tweaks the wording slightly. Outputs vary in structure and detail. When a colleague forgets a section, leadership gets an incomplete update. There\u2019s no way to trace where any particular insight came from. A new joiner asks \u2018how do I use this?\u2019 and you have to walk them through it in person.",
        reflection: "A shared prompt is a good start — it\u2019s better than everyone writing their own from scratch. But without standardised inputs, defined processing behaviour, and structured outputs, consistency breaks down as soon as multiple people use it.",
      },
      {
        label: "Build a three-layer agent (without accountability)",
        prompt: "Define an input format (what to paste), write a system prompt with role and task instructions, and create a JSON output template so every run produces the same structured result. Skip the accountability features — trust the team to review the output manually.",
        responseQuality: "partial",
        response: "Consistent format across the team — every status update looks the same. But when leadership asks \u2018which meeting did this insight come from?\u2019 nobody can trace it back without manually searching the source notes. A low-confidence conclusion slips through because the output didn\u2019t flag its uncertainty. The tool is reliable but not verifiable.",
        reflection: "The structure is right — three layers are in place, and the team gets consistent outputs. But without accountability features (source citations, confidence scoring, anomaly flagging), the output is consistent but not verifiable. Adding those features completes the design.",
      },
      {
        label: "Build a full Level 2 agent with accountability",
        prompt: "Define an input template, write a system prompt with role, task, steps, quality checks, and accountability features (cite sources, score confidence, flag anomalies). Create a JSON output schema with fields for all of these. Write an Agent Card documenting the tool\u2019s scope, limitations, and verification checkpoints. Share via the team\u2019s platform.",
        responseQuality: "strong",
        response: "Every team member gets the same structured output. Each insight is cited back to specific meeting notes or emails. Low-confidence conclusions are flagged with a verification suggestion. A new team member picks it up in five minutes using the Agent Card. Leadership trusts the updates because every claim can be traced to its source.",
        reflection: "This is the complete Level 2 approach: three layers plus accountability features plus documentation for sharing. The investment is in the upfront design — the return compounds with every run and every person who uses it.",
      },
    ],
  },
  { section: "YOUR NEXT STEP", type: "templates",
    heading: "Templates to take with you",
    body: "Ready to build? The Agent Builder walks you through all three layers step by step.",
    templateItems: [
      { id: "t1", name: "Agent Suitability Check", tag: "Decision Aid", tagColor: "#38B2AC",
        template: "AGENT SUITABILITY CHECK\n\nAnswer these four questions about your task:\n\n1. FREQUENCY: Does this task happen at least weekly?\n   [ ] Yes  [ ] No\n\n2. CONSISTENCY: Does the output need to follow the same structure every time?\n   [ ] Yes  [ ] No\n\n3. SHAREABILITY: Would others on the team benefit from the exact same tool?\n   [ ] Yes  [ ] No\n\n4. STANDARDISATION RISK: Would inconsistent outputs cause confusion or problems downstream?\n   [ ] Yes  [ ] No\n\nVERDICT:\n→ 0–1 \u2018Yes\u2019 answers: Stay at Level 1. Ad-hoc prompting is the right approach.\n→ 2–3 \u2018Yes\u2019 answers: Consider Level 2. Evaluate whether the investment is worth it.\n→ 4 \u2018Yes\u2019 answers: Build a Level 2 agent.",
      },
      { id: "t2", name: "Three-Layer Agent Design Starter", tag: "Agent Design", tagColor: "#667EEA",
        template: "THREE-LAYER AGENT DESIGN\n\n--- LAYER 1: INPUT DEFINITION ---\nData source: [What does the user provide?]\nRequired fields: [What must be included every time?]\nInput format: [Paste text? Upload file? Fill a template?]\nValidation: [What happens if something is missing?]\n\n--- LAYER 2: PROCESSING / SYSTEM PROMPT ---\n[ROLE]: You are a [role description].\n[CONTEXT]: [Background information the agent needs]\n[TASK]: [Specific instructions for what to do]\n[STEPS]: [Ordered reasoning steps]\n[QUALITY CHECKS]: [Constraints, edge cases]\n[OUTPUT FORMAT]: [See Layer 3]\n\n--- LAYER 3: OUTPUT DEFINITION ---\nFormat: [JSON / structured text / other]\nKey fields: [\n  field_name (type): description\n]\nAccountability fields: [\n  confidence_score (float 0–1)\n  evidence_sources (array of strings)\n  reasoning (string)\n  anomalies_flagged (array of strings)\n]",
      },
      { id: "t3", name: "HITL Prompt Additions", tag: "Accountability", tagColor: "#A8F0E0",
        template: "HUMAN-IN-THE-LOOP PROMPT ADDITIONS\n\nAdd these to your system prompt (Layer 2):\n\n1. SOURCE CITATION:\n   \u2018For each conclusion, cite the specific input data that informed it.\u2019\n\n2. CONFIDENCE SCORING:\n   \u2018Rate confidence in each conclusion 0–1. Flag anything below 0.7.\u2019\n\n3. REASONING TRAIL:\n   \u2018For each major conclusion, provide a one-sentence explanation.\u2019\n\n4. EXCEPTION FLAGGING:\n   \u2018Call out: inputs you could not process, contradictions between sources, missing data, and assumptions.\u2019\n\n5. VERIFICATION PROMPTS:\n   \u2018Suggest 1–2 specific things the reviewer should check.\u2019",
      },
      { id: "t4", name: "Agent Card Template", tag: "Sharing", tagColor: "#F5B8A0",
        template: "AGENT CARD\n\nAGENT NAME: [Name]\nPURPOSE: [One sentence — what does this agent do?]\n\nINPUT REQUIRED:\n- Data source: [What the user provides]\n- Format: [How to provide it]\n- Required fields: [What must be included]\n\nOUTPUT FORMAT:\n- Type: [JSON / structured text / other]\n- Key fields: [List the main output fields]\n- Accountability features: [Citations, confidence, reasoning, flags]\n\nLIMITATIONS:\n- [What this agent does NOT do]\n- [Known edge cases or failure modes]\n\nHITL CHECKPOINTS:\n- [What should the reviewer always verify?]\n- [Which outputs are most likely to need correction?]\n\nOWNER: [Who to contact]\nLAST UPDATED: [Date]",
      },
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
  { id: "v1", title: "From Prompt to Agent: Building Reusable AI Tools", channel: "Oxygy Learning", duration: "10 min",
    desc: "A practical walkthrough of how to design AI agents that go beyond one-off prompting — covering how to define the agent\u2019s role, structure its instructions, and create consistent output formats.",
    url: "#", quiz: [
      { q: "What is the primary difference between a one-off prompt and a Level 2 agent?", options: ["The agent uses a more advanced AI model", "The agent has permanent instructions that define its input, behaviour, and output", "The agent can access the internet", "The agent is more expensive to run"], correct: 1 },
      { q: "In the three-layer agent model, what does Layer 2 (Processing) contain?", options: ["The data the user provides", "The JSON output template", "The system prompt — role, task, steps, and quality checks", "The sharing documentation"], correct: 2 },
    ]},
  { id: "v2", title: "Accountability by Design: Building Trust into AI Workflows", channel: "Oxygy Learning", duration: "8 min",
    desc: "An exploration of how to design AI tools that support human oversight — covering techniques like source citation, confidence scoring, and structured output formats that make verification fast and targeted.",
    url: "#", quiz: [
      { q: "What is the purpose of including a confidence score in an AI agent\u2019s output?", options: ["To make the output look more professional", "To help the reviewer know where to focus their verification effort", "To prove the AI is always accurate", "To meet compliance requirements"], correct: 1 },
      { q: "What does \u2018Build Once, Share Always\u2019 mean in the Level 2 context?", options: ["Every prompt should be saved to a personal library", "Agents should be designed once, documented, and deployed for the whole team to use", "AI tools should be purchased from vendors, not built internally", "The system prompt should never be changed after the first version"], correct: 1 },
    ]},
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
};

export function getTopicContent(level: number, topicId: number): TopicContent | undefined {
  return TOPIC_CONTENT[`${level}-${topicId}`];
}
