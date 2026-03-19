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
    logo: '/logos/brands/icons8-google.svg',
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
    id: 'claude',
    name: 'Claude',
    icon: '🟣',
    logo: '/logos/tools/claude.svg',
    shortDescription: 'Best for deep reasoning, visual diagrams, interactive artefacts, and Socratic tutoring conversations',
    preferences: ['talk', 'build', 'watch', 'read'],
    features: [
      {
        id: 'projects',
        name: 'Projects',
        description: 'Persistent workspace with project instructions and uploaded reference documents. Context persists across conversations.',
        learningUse: 'Create a learning project with your materials as context, then have ongoing conversations that build on previous exchanges.',
        preferences: ['talk', 'build'],
        uniqueValue: 'Persistent context means you can return to your learning project days later without re-explaining.',
      },
      {
        id: 'visualiser',
        name: 'Visualiser',
        description: 'Generates inline diagrams, flowcharts, concept maps, decision trees, and visual explanations.',
        learningUse: 'Ask Claude to create visual representations of concepts — flowcharts, decision trees, concept maps — to build spatial understanding.',
        preferences: ['watch', 'read'],
        uniqueValue: 'Generates publication-quality diagrams inline — no separate diagramming tool needed.',
      },
      {
        id: 'artifacts',
        name: 'Artifacts',
        description: 'Creates standalone documents, interactive tools, code, comparison tables, quizzes in a dedicated panel.',
        learningUse: 'Generate interactive learning tools — quizzes, comparison tables, worked examples — in a side panel you can iterate on.',
        preferences: ['build', 'read'],
        uniqueValue: 'Creates interactive, self-contained learning tools you can save and reuse.',
      },
      {
        id: 'deep-research',
        name: 'Deep Research',
        description: 'Comprehensive web research with synthesis and citations. Takes several minutes, produces thorough output.',
        learningUse: 'Use Deep Research to get a comprehensive briefing on a topic with cited sources you can follow up on.',
        preferences: ['read'],
        uniqueValue: 'Most thorough research capability — produces multi-page synthesis with verified citations.',
      },
      {
        id: 'conversation',
        name: 'Conversation',
        description: 'Back-and-forth tutoring mode. Paste a structured prompt and begin learning through dialogue.',
        learningUse: 'Paste a structured learning prompt and engage in Socratic dialogue to deepen understanding.',
        preferences: ['talk'],
        uniqueValue: 'Excellent at Socratic questioning — will challenge your understanding rather than just confirming it.',
      },
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '💬',
    logo: '/logos/tools/chatgpt.svg',
    shortDescription: 'Great for building custom agents, collaborative editing, image generation, and general-purpose tutoring',
    preferences: ['build', 'talk', 'watch', 'read'],
    features: [
      {
        id: 'custom-gpts',
        name: 'Custom GPTs',
        description: 'Build a persistent AI agent with custom instructions and knowledge files. Create a dedicated tutor for a topic.',
        learningUse: 'Build a custom GPT that acts as your personal tutor for a specific topic, with your learning materials uploaded as knowledge.',
        preferences: ['build', 'talk'],
        uniqueValue: 'Create a reusable, shareable learning agent that anyone on your team can use.',
      },
      {
        id: 'canvas',
        name: 'Canvas',
        description: 'Side-by-side collaborative workspace for co-editing documents or code with ChatGPT.',
        learningUse: 'Work alongside ChatGPT to build and iterate on documents, code, or structured outputs in real time.',
        preferences: ['build'],
        uniqueValue: 'Best collaborative editing experience — see AI suggestions inline and accept/reject changes.',
      },
      {
        id: 'image-generation',
        name: 'Image Generation (DALL·E)',
        description: 'Generates images from text — visual concept explanations, metaphorical illustrations, visual mnemonics.',
        learningUse: 'Generate visual explanations, metaphors, or mnemonics to reinforce abstract concepts.',
        preferences: ['watch'],
        uniqueValue: 'Turns abstract concepts into memorable visual representations.',
      },
      {
        id: 'browsing',
        name: 'Browsing',
        description: 'Real-time web search integrated into conversation. Find current examples and case studies.',
        learningUse: 'Search for current examples, case studies, and real-world applications of concepts you are learning.',
        preferences: ['read'],
        uniqueValue: 'Seamlessly blends web research into your learning conversation.',
      },
      {
        id: 'chatgpt-conversation',
        name: 'Conversation',
        description: 'Standard chat interface for tutoring. Paste a structured prompt to begin.',
        learningUse: 'Paste a structured learning prompt and begin a tutoring conversation.',
        preferences: ['talk'],
        uniqueValue: 'Widely accessible and familiar interface for conversational learning.',
      },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '🔍',
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
    id: 'gemini',
    name: 'Gemini / Google AI Studio',
    icon: '✦',
    logo: '/logos/brands/google-gemini.svg',
    shortDescription: 'Works natively inside Google Docs, Sheets, and Slides — ideal for learning within your existing workflow',
    preferences: ['talk', 'read', 'build'],
    features: [
      {
        id: 'gemini-chat',
        name: 'Gemini Chat',
        description: 'Conversational AI with very large context window. Paste entire documents. Works inside Google Docs/Sheets/Slides.',
        learningUse: 'Paste entire documents or long materials and have detailed conversations about them — the large context window means nothing gets lost.',
        preferences: ['talk', 'read'],
        uniqueValue: 'Largest context window — paste entire textbooks or lengthy documents without truncation.',
      },
      {
        id: 'gems',
        name: 'Gems (Custom Agents)',
        description: 'Create persistent agents with custom instructions, similar to Custom GPTs.',
        learningUse: 'Create a Gem with custom learning instructions that persists your preferences and approach.',
        preferences: ['build', 'talk'],
        uniqueValue: 'Google ecosystem integration — works natively with Docs, Sheets, and Slides.',
      },
      {
        id: 'workspace-integration',
        name: 'Google Workspace Integration',
        description: 'Gemini works directly inside Docs, Sheets, Slides. Interact with learning materials without leaving the document.',
        learningUse: 'Use Gemini directly inside Google Docs to annotate, summarise, and interact with your learning materials in place.',
        preferences: ['read', 'build'],
        uniqueValue: 'Learn without context-switching — AI assistance lives inside your existing documents.',
      },
      {
        id: 'ai-studio',
        name: 'Google AI Studio (Advanced)',
        description: 'Developer-oriented interface for testing prompts, comparing outputs, adjusting parameters. Level 2+ only.',
        learningUse: 'Test different prompt strategies side by side, compare model outputs, and understand how parameters affect responses.',
        preferences: ['build'],
        uniqueValue: 'Best tool for understanding how AI models work under the hood — ideal for advanced learners.',
        levelNote: 'Recommended for Level 2+ only',
      },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶',
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
];

// ─── Level Objectives ───

export const LEVEL_OBJECTIVES: Record<number, string[]> = {
  1: [
    'Prompt Engineering',
    'Context Engineering',
    'Responsible AI Use',
    'Multimodal AI (Image / Video / Audio)',
    'Learning How to Learn with AI',
  ],
  2: [
    'What AI Agents Are & Why They Matter',
    'Custom GPT / Agent Building',
    'System Prompt & Instruction Design',
    'Human-in-the-Loop Design',
    'Sharing & Standardising Agents',
  ],
  3: [
    'AI Workflow Mapping',
    'Agent Chaining & Orchestration',
    'Input Logic & Role Mapping',
    'Automated Output Generation',
    'Human-in-the-Loop at Scale',
    'Performance & Feedback Loops',
  ],
  4: [
    'UX Design for AI Outputs',
    'Dashboard Prototyping',
    'User Journey Mapping',
    'Data Visualisation Principles',
    'Role-Specific Front-Ends',
  ],
  5: [
    'Application Architecture',
    'Personalisation Engines',
    'Knowledge Base Applications',
    'Custom Learning Platforms',
    'Full-Stack AI Integration',
    'User Testing & Scaling',
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
  1: { light: '#A8F0E0', dark: '#1A6B5F' },
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
