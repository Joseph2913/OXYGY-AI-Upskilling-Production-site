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
  /* Standardised slide takeaway (shown as header on every slide) */
  takeaway?: string;
  /* External source citation (shown as a small link at the bottom of the slide) */
  sourceLink?: string;
  sourceText?: string;
  /* Approach cards — used by approachIntro (L1) and data-driven moduleSummary (L3+) */
  approaches?: Array<{ icon: string; label?: string; name?: string; color: string; light: string; when?: string; tagline?: string; how?: string; connection?: string }>;
  /* Voiceover narration scripts (ElevenLabs TTS) */
  voiceover?: {
    setup: string;       // always present — plays on slide load
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
      setup: "Welcome to Prompt Engineering Essentials \u2014 the first module in the Oxygy AI Upskilling programme. By the end of this session, you\u2019ll understand why the same AI tools produce dramatically different results across professionals \u2014 and you\u2019ll have a complete toolkit to close that gap. We\u2019ll cover the six-component Prompt Blueprint framework, five prompting approaches, and \u2014 critically \u2014 how to choose the right technique for any situation. This module takes around twenty-five minutes. Let\u2019s get started.",
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
      setup: "Here\u2019s where we\u2019re starting. Three quarters of knowledge workers now use AI tools at work. That\u2019s not a projection \u2014 it\u2019s a 2024 survey of thirty-one thousand people across thirty-one countries. The tools are already in the room. Your colleagues, your clients, your competitors \u2014 most of them are using AI in some form every single day. But adoption tells you nothing about results. And that\u2019s what the next slide is about.",
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
      setup: "Same tool. Same AI. But depending on how you use it, the productivity gain can be anywhere from fourteen percent \u2014 or one hundred and twenty-six percent. That\u2019s a nine-times difference. Not from a better tool. Not from a smarter person. Just from knowing how to use it well. This gap is what this course exists to close.",
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
      setup: "Before we get into techniques, it\u2019s worth being clear about why prompting matters at the framework level. Every AI agent, every automated workflow, every intelligent dashboard \u2014 at the bottom of all of it, there\u2019s a prompt. The instructions that tell the AI what to do, how to think, and what to produce. Get the foundation right and everything built on top of it gets better. Let\u2019s see the difference in action.",
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
      setup: "Let\u2019s make this concrete. Imagine you\u2019re onboarding a new team member \u2014 capable, eager, ready to help. You need a stakeholder summary by end of day. Toggle between the two tabs and read both the prompt and the output on each side. Take a moment to notice what changes. The capability is identical in both cases. The only variable is how well you briefed them.",
    },
  },

  /* ── Slide 6 — Interactive Context Bar ── */
  { section: "SEE THE DIFFERENCE", type: "contextBar", takeaway: "Six context elements separate weak prompts from strong ones",
    heading: "Context is the fuel. Fill the tank.",
    tealWord: "Fill the tank",
    body: "Each component you provide eliminates a set of assumptions. Press Next to reveal each one.",
    voiceover: {
      setup: "So what exactly separates those two briefs? It comes down to six components \u2014 six types of context that determine how precisely you\u2019re guiding the AI. Each time you press Next, one component will be revealed. As you work through them, think about which ones you typically include \u2014 and which ones you tend to leave out. Every component you include removes a set of assumptions the AI would otherwise have to make on your behalf.",
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
      setup: "Now it\u2019s your turn to build one. You\u2019ve got a real task in front of you \u2014 an executive summary of a quarterly engagement survey. On the left, you\u2019ll see six component chips. Drag each one into the matching slot on the right, and watch how the prompt assembles as you add each layer. There\u2019s no trick here \u2014 this is just about building the muscle of thinking in all six components before you write a single word.",
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
      setup: "Here\u2019s a prompt someone wrote for a real task. It\u2019s actually quite detailed \u2014 and at first glance it looks solid. But one Blueprint component is completely absent. Read it carefully, then select which component you think is missing. Ask yourself: what would the AI have to guess here that it shouldn\u2019t have to?",
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
      setup: "Now here\u2019s something important. The Blueprint \u2014 the six-component framework you just built \u2014 is a powerful tool. But it\u2019s not always the right one. Skilled prompting means knowing when to reach for it, and when a different approach gets you there faster. There are three core approaches, sitting on a spectrum from unstructured to precise. Read through the three cards \u2014 Brain Dump, Conversational, and Blueprint \u2014 then we\u2019ll meet five professionals who each use a different one.",
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
      setup: "Meet Sam \u2014 a Programme Coordinator. It\u2019s four in the afternoon, they\u2019ve just come out of three back-to-back workshops, and the manager wants a summary of the key themes by nine tomorrow morning. Sam has rough notes, a half-finished voice memo, and hasn\u2019t processed any of it yet. Before I show you what Sam does \u2014 which approach do you think fits this situation? Take a moment to predict, then select your answer.",
      reveal: "Let\u2019s look at how Sam actually approaches this. When your thinking is genuinely unstructured \u2014 when you can\u2019t even fill in the Blueprint yet \u2014 a Brain Dump lets the AI find the structure for you. You\u2019re not organising first. You\u2019re using the AI to help you do it. Notice how the output doesn\u2019t just answer the question \u2014 it surfaces what Sam was missing.",
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
      setup: "This is Priya \u2014 a Strategy Analyst. She\u2019s drafting the strategic case for centralising procurement across four regions. She has a direction, but she isn\u2019t sure which argument to lead with, and she knows there\u2019ll be pushback she hasn\u2019t fully anticipated. The proposal goes to committee in forty-eight hours. Which approach do you think Priya uses? Make your prediction before we reveal it.",
      reveal: "Watch how Priya builds her answer not in one shot, but through a series of increasingly specific turns \u2014 each one sharpening the output based on what came back. She doesn\u2019t know the final shape when she starts. Conversational prompting lets her steer progressively \u2014 co-creating, not delegating. Each turn adds specificity based on the previous response.",
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
      setup: "Marcus is a Delivery Lead. The quarterly review is tomorrow at nine AM. The CFO and two divisional heads want a tight four-hundred-word executive summary \u2014 milestones, biggest risk, one recommendation. It needs to land right first time. There\u2019s no window to iterate. Which approach does Marcus use? Predict before we reveal.",
      reveal: "Notice that Marcus doesn\u2019t use the full six-component Blueprint \u2014 but he front-loads rich context in a single, precise message. That\u2019s what structured input looks like in practice. He knows the audience, the stakes, and the constraints before he starts. Front-loading all of that eliminates guesswork and gets it right first time.",
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
      setup: "Aisha is a Communications Lead. She has to write the internal announcement for a company restructuring \u2014 by end of day. She\u2019s been too close to this process for months. She knows her draft might sound defensive, but she can\u2019t see it clearly anymore. She needs fresh eyes before it goes out. What approach does Aisha reach for? Make your prediction.",
      reveal: "Aisha isn\u2019t using the AI to produce something. She\u2019s using it to think better \u2014 to see around corners she can\u2019t see from where she\u2019s standing. That\u2019s the brainstorming partner mode. Different goal, different technique. She\u2019s not asking for a draft. She\u2019s asking for challenges, alternatives, and the perspective of the most sceptical reader in the room.",
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
      setup: "And finally, Jordan \u2014 a Process Designer. Every single Friday, he produces the same programme status report for the same four stakeholders. Every single Friday, he rewrites it from scratch. It takes ninety minutes. The content barely changes \u2014 just the numbers. Which approach fits Jordan\u2019s situation? You\u2019ve now seen all approaches in context. Make your final prediction.",
      reveal: "The Blueprint took Jordan twenty minutes to write once. Now it takes him thirty seconds to reuse \u2014 he swaps in the week\u2019s data and the structure, tone, and quality are already handled. That\u2019s the compounding return of building once rather than rewriting repeatedly. The up-front investment pays back across every future use.",
    },
  },

  /* ── Slide 12 — Situation Matrix ── */
  { section: "THE TOOLKIT", type: "situationMatrix",
    takeaway: "The right approach depends on how well-defined the task is",
    heading: "Which approach fits which situation?",
    tealWord: "situation",
    body: "The right choice depends on how well you know the desired output and whether the task repeats. Click any situation row to see a real-world example.",
    voiceover: {
      setup: "Now let\u2019s pull everything together into a decision framework. The matrix on screen maps the three approaches to different types of situations \u2014 based on how well-defined the task is, and whether it repeats. Click any row to see a real-world example of that situation. The goal here isn\u2019t to memorise the grid \u2014 it\u2019s to start developing the instinct of reading a task and knowing where to start.",
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
      setup: "That\u2019s the full prompting toolkit. You\u2019ve covered the six-component Blueprint framework, three prompting approaches and five professionals who use them, and a decision framework for matching the technique to the task. The key insight: prompt engineering isn\u2019t about magic phrases. It\u2019s about reading what kind of task you have \u2014 then choosing the right tool for it. Your next step is the Prompt Playground. Click the button below to put this into practice on a task from your own work. Good luck.",
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
    stats: [{ value: "24%", valueColour: "#38B2AC", label: "of organisations have moved beyond individual AI tasks to coordinated workflow automation", source: "McKinsey", desc: "Global Survey on AI, 2024" }],
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
    stats: [{ value: "3.4×", valueColour: "#38B2AC", label: "more likely to integrate AI across enterprise-wide workflows vs. using it as a standalone tool", source: "McKinsey", desc: "The State of AI: Global Survey, 2024" }],
    pullQuote: "The competitive gap isn't between companies using AI and those that aren't. It's between those who chain it and those who silo it.",
  },

  /* ── Slide 4 — Adoption vs. Integration ── */
  {
    section: "THE REALITY", type: "evidenceHero",
    takeaway: "75% of knowledge workers use AI tools — but most use them as one-off assistants, not as parts of a designed process",
    heading: "Adoption is high. Integration is rare.",
    tealWord: "Integration is rare",
    body: "The 2024 Microsoft Work Trend Index found that 75% of knowledge workers now use AI tools at work. But the vast majority are using AI as a personal assistant — one prompt at a time, with no connection to the next step. Productivity gains stay individual and non-transferable. Workflows are what turn personal AI use into team capability that compounds.",
    pullQuote: "Personal productivity doesn't scale. Workflow design does.",
    footnote: "Source: Microsoft Work Trend Index Annual Report (2024) — survey of 31,000 people across 31 countries.",
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

  /* ── Slide 6 — When Does a Workflow Make Sense? ── */
  {
    section: "THE TECHNIQUE", type: "concept",
    takeaway: "A workflow adds value when a process is repetitive, structured, and has a defined output",
    heading: "Not every task needs a workflow.",
    tealWord: "needs a workflow",
    eyebrow: "WHEN TO USE ONE",
    body: "A workflow is the right tool when a process runs repeatedly, follows consistent steps, has a clear trigger, and produces a defined output. If the same task runs weekly, involves structured decisions, and needs to be consistent across a team — it's a strong candidate.\n\nA workflow is not the right tool when the task is a one-off, when every instance requires a different judgment call, when volume is too low to justify the design effort, or when the process itself isn't stable yet. Automating a process you don't fully understand just makes the problem run faster.\n\nThe test: if this ran a hundred times, would the right output look broadly the same each time? If yes — design a workflow. If not — keep it as a prompt.",
    pullQuote: "Automate the repetitive. Keep the judgment.",
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
    body: "Every multi-step AI workflow is built from three layers.\n\nThe Input layer captures what triggers the workflow and what data it needs. The Processing layer chains AI actions, transformations, and conditional logic. The Output layer delivers results, routes them to the right place, and surfaces them for human review.\n\nMost people operate only in the middle — missing the connective tissue at either end.",
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
        personaName: "Priya",
        personaRole: "Operations Analyst",
        scenario: "Priya is building a workflow that processes client feedback forms. She needs a step that reads the feedback text and decides whether to route it to the service team (negative sentiment) or log it automatically (positive/neutral). Which node type fits this step?",
        options: [
          "AI ACTION — the AI reads and interprets the text",
          "CONDITION — it evaluates a result and routes the workflow based on a rule",
          "TRANSFORM — it reformats the feedback into a structured record",
        ],
        strongestChoice: 1,
        feedback: [
          { quality: "partial", text: "An AI ACTION is what reads and interprets the text — that's the step before this one. The step Priya is designing takes the AI's result and makes a routing decision based on it. That's what a CONDITION node does." },
          { quality: "strong", text: "Exactly. A CONDITION node evaluates the outcome of the previous step — here, the sentiment classification — and routes the workflow down different paths based on a rule. It's what makes a workflow adaptive rather than linear." },
          { quality: "weak", text: "A TRANSFORM reformats or restructures data — for example, converting raw text into a structured record. Priya's step isn't reshaping data; it's making a routing decision. That's a CONDITION." },
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
};

export function getTopicContent(level: number, topicId: number): TopicContent | undefined {
  return TOPIC_CONTENT[`${level}-${topicId}`];
}
