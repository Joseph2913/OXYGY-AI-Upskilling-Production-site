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
  /* Standardised slide takeaway (shown as header on every slide) */
  takeaway?: string;
  /* External source citation (shown as a small link at the bottom of the slide) */
  sourceLink?: string;
  sourceText?: string;
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
    sourceText: "Microsoft & LinkedIn: 2024 Work Trend Index — survey of 31,000 people across 31 countries (May 2024)",
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
  },

  /* ── Slide 4 — Prompting Is the Foundation ── */
  { section: "THE REALITY", type: "pyramid",
    takeaway: "Every advanced AI capability is built on top of prompting",
    heading: "Prompting is the foundation everything else is built on.",
    tealWord: "foundation",
    body: "Every AI agent, automated workflow, intelligent dashboard, and full-stack application runs on prompts. Get the foundation right and every layer above it gets better.",
    pullQuote: "Every level of the OXYGY framework builds on the skills from this one. This is where it starts.",
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
  },

  /* ── Slide 6 — Interactive Context Bar ── */
  { section: "SEE THE DIFFERENCE", type: "contextBar", takeaway: "Six context elements separate weak prompts from strong ones",
    heading: "Context is the fuel. Fill the tank.",
    tealWord: "Fill the tank",
    body: "Each component you provide eliminates a set of assumptions. Press Next to reveal each one.",
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
    buildInsight: "A complete Blueprint prompt doesn't just tell the AI what to produce — it tells it who to be, what it's working with, how to think, and what to avoid. Each component removes a set of assumptions the AI would otherwise have to make.",
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
    explanation: "The prompt has a clear task and some context — but it gives the AI zero guidance on how the output should be structured. Should it be a slide deck, a memo, a table, a bulleted list? The AI will guess. Adding a Format instruction (e.g. 'Two-page memo, section headers, executive tone') removes that ambiguity entirely.",
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
  },

  /* ── Slide 10 — Sam the Brain Dumper ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Sam — Programme Coordinator",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 0, predictFeedback: ["Exactly right. Sam's input is unstructured by nature — rough notes, half-formed thoughts. A brain dump lets the AI find the structure rather than Sam having to organise first.", "Conversational works better once you have a direction to steer. Sam doesn't have a direction yet — the output shape is still unknown. Brain dump gets you there faster.", "Blueprint requires you to specify format and structure upfront. Sam can't do that yet — the thinking hasn't been organised. Structure before clarity slows you down."],
    personaData: {
      name: "Sam", initial: "S", role: "Programme Coordinator", color: "#ED8936", iconPath: "/face-icons/sam.png",
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
  },

  /* ── Slide 8 — Priya the Conversationalist ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Priya — Strategy Analyst",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 1, predictFeedback: ["Brain dump surfaces ideas but doesn't give you control across turns. Priya wants to steer — to sharpen one argument, then another. That requires back-and-forth, not a single dump.", "Right. Priya doesn't know the final shape when she starts. Conversational lets her co-create — each turn adds specificity based on what the AI gave back. She's steering, not delegating.", "Blueprint works when you know exactly what you want. Priya is still figuring out the angle — locking into a format before the direction is clear creates unnecessary constraints."],
    personaData: {
      name: "Priya", initial: "P", role: "Strategy Analyst", color: "#805AD5", iconPath: "/face-icons/priya.png",
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
  },

  /* ── Slide 9 — Marcus the Structured Input Provider ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Marcus — Delivery Lead",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 2, predictFeedback: ["Marcus's output goes straight to senior leaders. Quality needs to be consistent and there's no iteration window. A brain dump might produce something, but the quality would vary.", "Conversational is useful for exploration, but Marcus already knows exactly what he needs. Spending turns refining when you could specify upfront wastes the only advantage conversation offers.", "Correct. Marcus knows the audience, the format, and the constraints before he starts. Front-loading all of that eliminates guesswork and gets it right first time."],
    personaData: {
      name: "Marcus", initial: "M", role: "Delivery Lead", color: "#38B2AC", iconPath: "/face-icons/marcus.png",
      scenario: "The quarterly review is tomorrow at 9am. The CFO and two divisional heads want a tight 400-word executive summary — milestone progress, the biggest risk, and one clear recommendation. Marcus needs it to land right first time. There's no window to iterate.",
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
    takeaway: "What would you do in this situation?",
    heading: "Aisha — Communications Lead",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 1, predictFeedback: ["A brain dump would surface raw material, but Aisha doesn't need more raw material — she needs perspectives and challenges she hasn't considered. That requires a structured interrogation across turns.", "Right. Aisha is using the AI as a thinking partner — asking it to generate alternatives, surface reactions, and stress-test her draft. That back-and-forth structure is exactly the conversational approach.", "Blueprint optimises for a known, repeatable output. Aisha's goal is the opposite — she wants to be surprised, challenged, and shown angles she hasn't considered."],
    personaData: {
      name: "Aisha", initial: "A", role: "Communications Lead", color: "#E53E3E", iconPath: "/face-icons/aisha.png",
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
  },

  /* ── Slide 11 — Jordan the Blueprint Builder ── */
  { section: "THE APPROACHES", type: "persona",
    takeaway: "What would you do in this situation?",
    heading: "Jordan — Process Designer",
    predictFirst: true, predictOptions: ["Brain Dump", "Conversational", "Blueprint"], predictCorrect: 2, predictFeedback: ["Jordan does this every Friday. A brain dump might produce something each week, but quality would vary. When consistency and repeatability matter, the upfront Blueprint investment pays back every time.", "Conversational would produce a good first draft but Jordan would redo the iteration every Friday. The Blueprint lets him build once and reuse — swapping in new data each week in under 30 seconds.", "Exactly right. Jordan's task is repeatable, the audience is known, and the format is fixed. The Blueprint takes 20 minutes to write once and saves hours across months of weekly reports."],
    personaData: {
      name: "Jordan", initial: "J", role: "Process Designer", color: "#1A202C", iconPath: "/face-icons/jordan.png",
      scenario: "Jordan produces a weekly programme status report every Friday for the same four stakeholders. Each week he rewrites it from scratch, reformatting data and second-guessing structure. It takes 90 minutes. The content barely changes — just the numbers.",
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
    takeaway: "The right approach depends on how well-defined the task is",
    heading: "Which approach fits which situation?",
    tealWord: "situation",
    body: "The right choice depends on how well you know the desired output and whether the task repeats. Click any situation row to see a real-world example.",
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
    ctaText: "Open Prompt Playground →",
    ctaHref: "/app/toolkit/prompt-playground",
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
