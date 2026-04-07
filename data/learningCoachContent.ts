// ─── Learning Coach — Platform Feature Registry, Objectives, Preferences, Examples ───

export interface PlatformFeature {
  id: string;
  name: string;
  description: string;
  learningUse: string;
  preferences: string[];
  uniqueValue: string;
  levelNote?: string;
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  logo?: string;               // Path to SVG logo in /public/logos/
  shortDescription: string;    // One-line description for platform selection
  features: PlatformFeature[];
  preferences: string[];
  levelNote?: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: 'notebooklm',
    name: 'NotebookLM',
    icon: '📓',
    logo: '/logos/brands/notebooklm.svg',
    shortDescription: 'Turn documents into podcasts, study guides, and interactive Q&A — ideal for absorbing complex material',
    preferences: ['listen', 'read', 'talk', 'build'],
    features: [
      {
        id: 'audio-overview',
        name: 'Audio Overview',
        description: 'Generates a conversational podcast-style discussion about uploaded sources. 10–20 min. Customisable focus via instructions.',
        learningUse: 'Upload the relevant learning material, optionally add a focus instruction, and listen to a bespoke audio discussion that breaks down concepts conversationally.',
        preferences: ['listen'],
        uniqueValue: 'No other platform turns your own materials into a bespoke podcast. Ideal for auditory learners and commute-time learning.',
      },
      {
        id: 'source-guide',
        name: 'Source Guide',
        description: 'Creates a structured study guide/handout from uploaded sources with key concepts, definitions, and relationships.',
        learningUse: 'Upload your learning materials and get a structured summary that highlights key concepts and how they relate to each other.',
        preferences: ['read'],
        uniqueValue: 'Auto-generates a study companion from your own materials — no manual note-taking needed.',
      },
      {
        id: 'briefing-doc',
        name: 'Briefing Doc',
        description: 'Generates a concise executive summary of key points across uploaded sources.',
        learningUse: 'Upload multiple sources to get a quick-read briefing that synthesises the most important points.',
        preferences: ['read'],
        uniqueValue: 'Best for getting the "big picture" from dense or lengthy materials quickly.',
      },
      {
        id: 'chat',
        name: 'Chat',
        description: 'Interactive Q&A grounded in uploaded sources with inline citations.',
        learningUse: 'Ask questions about your uploaded materials and get cited answers you can verify.',
        preferences: ['talk', 'build'],
        uniqueValue: 'Every answer is grounded in your sources with clickable citations — no hallucination risk.',
      },
      {
        id: 'faq-generation',
        name: 'FAQ Generation',
        description: 'Auto-generates frequently asked questions with answers from uploaded sources.',
        learningUse: 'Generate a set of FAQs from your materials to test your understanding or prepare for discussions.',
        preferences: ['read', 'build'],
        uniqueValue: 'Instantly creates a self-test bank from your own content.',
      },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '🔍',
    logo: '/logos/brands/perplexity.svg',
    shortDescription: 'Best for research with cited sources, academic papers, and building organised knowledge collections',
    preferences: ['read', 'listen', 'watch', 'build'],
    features: [
      {
        id: 'search-cited',
        name: 'Search & Cited Answers',
        description: 'Answers questions with inline citations linking to specific sources. Every claim is traceable.',
        learningUse: 'Ask questions and get answers with clickable citations — verify every claim against the original source.',
        preferences: ['read'],
        uniqueValue: 'Most transparent AI search — every statement links to its source.',
      },
      {
        id: 'focus-modes',
        name: 'Focus Modes',
        description: 'Narrow search scope: Academic (papers), Writing (synthesis), Web (broad), YouTube (videos), Reddit (community).',
        learningUse: 'Use focus modes to target specific source types — academic papers for depth, YouTube for visual explanations, Reddit for community insights.',
        preferences: ['read', 'listen', 'watch'],
        uniqueValue: 'Only AI search tool that lets you target specific content types (academic, video, community).',
      },
      {
        id: 'spaces',
        name: 'Spaces',
        description: 'Persistent research collection with saved searches and organised sources. Set custom instructions per Space.',
        learningUse: 'Create a Space for your learning topic to build a curated collection of sources and research threads.',
        preferences: ['read', 'build'],
        uniqueValue: 'Build a persistent, organised knowledge base around a learning topic.',
      },
      {
        id: 'pages',
        name: 'Pages',
        description: 'AI-generated shareable write-ups on a topic with sections, visuals, and citations.',
        learningUse: 'Generate a comprehensive, shareable write-up on a topic — useful for creating study materials or briefings.',
        preferences: ['read'],
        uniqueValue: 'Creates polished, shareable research documents automatically.',
      },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶',
    logo: '/logos/brands/youtube.svg',
    shortDescription: 'Visual and audio learning — concept explainers, step-by-step tutorials, and industry commentary',
    preferences: ['listen', 'watch'],
    features: [
      {
        id: 'conceptual-explainers',
        name: 'Conceptual Explainers',
        description: 'Channels that break down complex concepts from first principles with strong visual production. (3Blue1Brown, Fireship style)',
        learningUse: 'Watch concept explainer videos that use animations and visual metaphors to build intuition about complex topics.',
        preferences: ['listen', 'watch'],
        uniqueValue: 'High production-value explanations that make abstract concepts visual and intuitive.',
      },
      {
        id: 'practical-tutorials',
        name: 'Practical Tutorials',
        description: 'Step-by-step screen-share walkthroughs demonstrating exactly how to do something.',
        learningUse: 'Follow along with screen-share tutorials that show you exactly how to use a tool or complete a task.',
        preferences: ['watch'],
        uniqueValue: 'See exactly how something is done — step by step, on screen.',
      },
      {
        id: 'industry-commentary',
        name: 'Industry Commentary',
        description: 'Channels covering AI news, trends, product launches, and strategic implications.',
        learningUse: 'Stay current with AI industry developments and understand how trends affect your work.',
        preferences: ['listen'],
        uniqueValue: 'Best for building strategic awareness of the AI landscape.',
      },
      {
        id: 'short-form-primers',
        name: 'Short-Form Primers',
        description: 'Videos under 10 minutes with dense, focused introductions to a single concept.',
        learningUse: 'Get a quick, focused introduction to a concept in under 10 minutes.',
        preferences: ['listen', 'watch'],
        uniqueValue: 'Maximum learning density — perfect for filling a specific knowledge gap quickly.',
      },
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '💬',
    logo: '/logos/brands/chatgpt.svg',
    shortDescription: 'Conversational AI for brainstorming, drafting, coding, and exploring ideas through dialogue',
    preferences: ['talk', 'build', 'read'],
    features: [
      {
        id: 'conversation',
        name: 'Conversation',
        description: 'Open-ended chat for brainstorming, drafting, explaining concepts, and working through problems step by step.',
        learningUse: 'Ask questions, request explanations at different levels, and iterate on ideas through back-and-forth dialogue.',
        preferences: ['talk'],
        uniqueValue: 'The most natural way to explore a topic — ask follow-ups, challenge assumptions, and build understanding through conversation.',
      },
      {
        id: 'custom-gpts',
        name: 'Custom GPTs',
        description: 'Pre-configured AI assistants with specific instructions, knowledge, and behaviour for a particular use case.',
        learningUse: 'Use or build Custom GPTs tailored to specific learning tasks — study coaches, writing tutors, or domain-specific advisors.',
        preferences: ['build', 'talk'],
        uniqueValue: 'Create a reusable, shareable AI tool that embodies specific expertise or workflows.',
      },
      {
        id: 'code-interpreter',
        name: 'Code Interpreter & Data Analysis',
        description: 'Upload files and run Python code to analyse data, create charts, and process documents.',
        learningUse: 'Upload datasets or documents and ask ChatGPT to analyse, summarise, or visualise them as part of your learning.',
        preferences: ['build', 'read'],
        uniqueValue: 'Hands-on data exploration without needing to write code yourself.',
      },
      {
        id: 'canvas',
        name: 'Canvas',
        description: 'Side-by-side editing workspace for writing and code — iterate on drafts with AI suggestions inline.',
        learningUse: 'Draft and refine written work or code with AI feedback directly in context, not just in chat.',
        preferences: ['build', 'read'],
        uniqueValue: 'Edit collaboratively with AI in a document-like interface rather than copy-pasting from chat.',
      },
    ],
  },
];

// ─── Level Objectives ───

export const LEVEL_OBJECTIVES: Record<number, { label: string; hint: string }[]> = {
  1: [
    { label: 'Prompt Engineering', hint: 'Structuring your instructions to get better, more consistent AI outputs' },
    { label: 'Context Engineering', hint: 'Giving AI the right background information so it understands your situation' },
    { label: 'Responsible AI Use', hint: 'Understanding AI limitations, bias, and when not to trust the output' },
    { label: 'Multimodal AI (Image / Video / Audio)', hint: 'Using AI to generate or edit images, video, and audio' },
    { label: 'Learning How to Learn with AI', hint: 'Using AI tools to accelerate your own learning and skill development' },
  ],
  2: [
    { label: 'What AI Agents Are & Why They Matter', hint: 'Understanding how agents differ from one-off prompts' },
    { label: 'Custom GPT / Agent Building', hint: 'Creating a reusable AI tool with saved instructions and behaviour' },
    { label: 'System Prompt & Instruction Design', hint: 'Writing the rules and personality that define how your agent responds' },
    { label: 'Human-in-the-Loop Design', hint: 'Building checkpoints where a human reviews before the AI acts' },
    { label: 'Sharing & Standardising Agents', hint: 'Making your agent available for colleagues to use consistently' },
  ],
  3: [
    { label: 'AI Workflow Mapping', hint: 'Designing multi-step processes where AI handles parts automatically' },
    { label: 'Agent Chaining & Orchestration', hint: 'Connecting multiple AI agents so the output of one feeds the next' },
    { label: 'Input Logic & Role Mapping', hint: 'Defining what triggers a workflow and who is responsible for each step' },
    { label: 'Automated Output Generation', hint: 'Setting up AI to produce reports, summaries, or documents on a schedule' },
    { label: 'Human-in-the-Loop at Scale', hint: 'Adding review checkpoints across automated pipelines' },
    { label: 'Performance & Feedback Loops', hint: 'Measuring whether your AI workflow is actually producing good results' },
  ],
  4: [
    { label: 'UX Design for AI Outputs', hint: 'Presenting AI-generated data in a way that helps people make decisions' },
    { label: 'Dashboard Prototyping', hint: 'Building interactive dashboards that visualise AI-processed information' },
    { label: 'User Journey Mapping', hint: 'Designing the end-to-end experience for someone using your dashboard' },
    { label: 'Data Visualisation Principles', hint: 'Choosing the right charts, layouts, and metrics for your audience' },
    { label: 'Role-Specific Front-Ends', hint: 'Building different views for different users (e.g., manager vs analyst)' },
  ],
  5: [
    { label: 'Application Architecture', hint: 'Structuring a full app with database, backend, and user interface' },
    { label: 'Personalisation Engines', hint: 'Building features that adapt to each individual user\'s needs' },
    { label: 'Knowledge Base Applications', hint: 'Apps that process and organise documents, notes, and transcripts' },
    { label: 'Custom Learning Platforms', hint: 'Building personalised training or education tools' },
    { label: 'Full-Stack AI Integration', hint: 'Connecting AI across every layer of an application' },
    { label: 'User Testing & Scaling', hint: 'Testing with real users and preparing your app for wider rollout' },
  ],
};

// ─── Learning Preferences ───

export const LEARNING_PREFERENCES = [
  { id: 'listen', label: 'Listen & absorb', description: 'I learn best hearing concepts explained conversationally', icon: '🎧' },
  { id: 'read', label: 'Read & reflect', description: 'I prefer written depth — articles, guides, detailed walkthroughs', icon: '📖' },
  { id: 'watch', label: 'Watch & follow', description: 'Show me someone doing it and I\'ll follow along', icon: '👁' },
  { id: 'build', label: 'Build & experiment', description: 'Give me a sandbox and a challenge', icon: '🔧' },
  { id: 'talk', label: 'Talk it through', description: 'I learn by asking questions in a back-and-forth', icon: '💬' },
];

// ─── Example Chips (per level) ───

export const EXAMPLE_CHIPS: Record<number, string[]> = {
  1: [
    "I understand prompting basics but I can't get consistent, high-quality results across different tasks",
    "I know what context engineering is in theory but I'm not sure when to use documents vs system prompts vs project structures in practice",
  ],
  2: [
    "I've built a custom GPT but the outputs are inconsistent — sometimes great, sometimes completely off",
    "I want to build an agent my whole team can use but I don't know how to write instructions that work for everyone, not just me",
  ],
  3: [
    "I've mapped out a workflow on paper but I can't figure out how to translate the decision points into automation logic",
    "I understand agent chaining conceptually but I don't know how to handle failures or unexpected inputs mid-workflow",
  ],
  4: [
    "I have AI-generated data but I don't know how to design a dashboard that actually helps people make decisions with it",
  ],
  5: [
    "I want to build a full application with user accounts and personalised experiences but I don't know where to start with the architecture",
  ],
};

// Generic chips shown before a level is selected
export const GENERIC_EXAMPLE_CHIPS = [
  "I understand prompting basics but I can't get consistent, high-quality results across different tasks",
  "I've built a custom GPT but the outputs are inconsistent — sometimes great, sometimes completely off",
  "I've mapped out a workflow on paper but I can't figure out how to translate the decision points into automation logic",
  "I want to build a full application with user accounts and personalised experiences but I don't know where to start with the architecture",
];

// ─── Level Accent Colours ───

export const LEVEL_ACCENTS: Record<number, { light: string; dark: string }> = {
  1: { light: '#B2D8F7', dark: '#2B6CB0' },
  2: { light: '#F7E8A4', dark: '#8A6A00' },
  3: { light: '#38B2AC', dark: '#1A7A76' },
  4: { light: '#F5B8A0', dark: '#8C3A1A' },
  5: { light: '#C3D0F5', dark: '#2E3F8F' },
};

export const DEFAULT_ACCENT = { light: '#38B2AC', dark: '#1A7A76' };

// ─── Level Short Names ───

export const LEVEL_SHORT_NAMES: Record<number, string> = {
  1: 'Fundamentals',
  2: 'Applied',
  3: 'Systemic',
  4: 'Dashboards',
  5: 'Applications',
};

// ─── Preference Labels for API ───

export const PREFERENCE_LABELS: Record<string, string> = {
  listen: 'Listen & absorb — I learn best hearing concepts explained conversationally',
  read: 'Read & reflect — I prefer written depth, articles, guides, detailed walkthroughs',
  watch: 'Watch & follow — Show me someone doing it and I\'ll follow along',
  build: 'Build & experiment — Give me a sandbox and a challenge',
  talk: 'Talk it through — I learn by asking questions in a back-and-forth',
};
