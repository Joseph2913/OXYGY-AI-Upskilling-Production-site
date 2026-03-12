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

// L2 content will be added back


/* ══════════════════════════════════════════════════════════════════
   TOPIC CONTENT REGISTRY
   ══════════════════════════════════════════════════════════════════ */

export const TOPIC_CONTENT: Record<string, TopicContent> = {
  "1-1": {
    slides: L1T1_SLIDES,
    articles: L1T1_ARTICLES,
    videos: L1T1_VIDEOS,
  },
};

export function getTopicContent(level: number, topicId: number): TopicContent | undefined {
  return TOPIC_CONTENT[`${level}-${topicId}`];
}
