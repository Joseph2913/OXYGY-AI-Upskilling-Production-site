import type {
  DashboardNavItem,
  UserProfile,
  ProgressRow,
  InsightEntry,
  SavedPrompt,
  LevelPillStyle,
  LevelBlock,
} from './dashboard-types';

// ─── Sidebar Navigation Items (4 sections — Learning Plan merged into Progress) ───

export const SIDEBAR_NAV_ITEMS: DashboardNavItem[] = [
  { id: 'profile', label: 'My Profile', shortLabel: 'Profile', iconName: 'User' },
  { id: 'progress', label: 'My Progress', shortLabel: 'Progress', iconName: 'BarChart2' },
  { id: 'insights', label: 'Application Insights', shortLabel: 'Insights', iconName: 'Lightbulb' },
  { id: 'prompt-library', label: 'My Prompt Library', shortLabel: 'Prompts', iconName: 'Library' },
];

// ─── Section Headings & Subheadings ───

export const SECTION_META: Record<string, { heading: string; subheading: string }> = {
  profile: {
    heading: 'My Profile',
    subheading: 'Your personal learning context. This information is used to generate your AI learning pathway.',
  },
  progress: {
    heading: 'My Progress',
    subheading: 'Track your completion across all five levels. Enter your session code to mark workshop attendance.',
  },
  insights: {
    heading: 'Application Insights',
    subheading: 'Log how you\'ve applied AI in your work. Your insights help your organization understand where AI is creating real impact.',
  },
  'prompt-library': {
    heading: 'My Prompt Library',
    subheading: 'Prompts you\'ve saved from across the platform. Copy any prompt to use it in your workflows.',
  },
};

// ─── Profile Form Options (synced with Learning Pathway Generator) ───

export const FUNCTION_OPTIONS = [
  'Consulting & Delivery',
  'Proposal & Business Development',
  'Project Management',
  'L&D / Training',
  'Analytics & Insights',
  'Ops & SOP Management',
  'Communications & Change',
  'IT & Knowledge Management',
  'Human Resources & People',
  'Sales & Business Development',
  'Marketing & Communications',
  'Other',
];

export const SENIORITY_OPTIONS = [
  'Junior / early career (0\u20132 years)',
  'Mid-level / specialist (3\u20136 years)',
  'Senior / lead (7\u201312 years)',
  'Director / executive (12+ years)',
];

export const AI_EXPERIENCE_OPTIONS = [
  { id: 'beginner', emoji: '\uD83C\uDF31', label: 'Beginner', description: 'I rarely use AI tools, or I\'ve only experimented casually' },
  { id: 'comfortable-user', emoji: '\uD83D\uDD27', label: 'Comfortable User', description: 'I use ChatGPT or similar tools regularly for basic tasks like drafting, research, or brainstorming' },
  { id: 'builder', emoji: '\uD83C\uDFD7\uFE0F', label: 'Builder', description: 'I\'ve created custom GPTs, agents, or prompt templates for specific tasks in my work' },
  { id: 'integrator', emoji: '\u2699\uFE0F', label: 'Integrator', description: 'I\'ve designed or contributed to AI-powered workflows, automations, or multi-step pipelines' },
];

export const AMBITION_OPTIONS = [
  { id: 'confident-daily-use', emoji: '\uD83D\uDCA1', label: 'Confident daily use', description: 'I want to use AI effectively in my everyday work' },
  { id: 'build-reusable-tools', emoji: '\uD83D\uDEE0\uFE0F', label: 'Build reusable tools', description: 'I want to create AI tools and agents my team can use' },
  { id: 'own-ai-processes', emoji: '\uD83D\uDCD0', label: 'Own AI-powered processes', description: 'I want to design and manage automated AI workflows for my function' },
  { id: 'build-full-apps', emoji: '\uD83D\uDE80', label: 'Build full applications', description: 'I want to create complete AI-powered products with personalized experiences' },
];

export const AVAILABILITY_OPTIONS = [
  { id: '1-2 hours', label: '1\u20132 hours', description: 'Fits around a busy schedule' },
  { id: '3-4 hours', label: '3\u20134 hours', description: 'Dedicated learning time each week' },
  { id: '5+ hours', label: '5+ hours', description: 'Intensive \u2014 I want to move fast' },
];

// ─── Default Profile ───

export const DEFAULT_PROFILE: UserProfile = {
  fullName: '',
  role: '',
  function: '',
  functionOther: '',
  seniority: '',
  aiExperience: '',
  ambition: '',
  challenge: '',
  availability: '',
  experienceDescription: '',
  goalDescription: '',
};

// ─── Impact Rating Tooltip ───

export const IMPACT_TOOLTIP_TEXT =
  'How much did this AI application change how you work? 1 star = minor time savings. 3 stars = noticeable improvement in speed or quality. 5 stars = transformative \u2014 couldn\'t do this without AI.';

// ─── Level Accent Colors ───

export const LEVEL_ACCENTS: Record<number, { light: string; dark: string }> = {
  1: { light: '#B2D8F7', dark: '#2BA89C' },
  2: { light: '#C3D0F5', dark: '#5B6DC2' },
  3: { light: '#F7E8A4', dark: '#C4A934' },
  4: { light: '#F5B8A0', dark: '#D47B5A' },
  5: { light: '#38B2AC', dark: '#38B2AC' },
};

// ─── Level Tag Pill Styles ───

export const LEVEL_PILL_STYLES: Record<number, LevelPillStyle> = {
  1: { bg: '#B2D8F7', text: '#1A202C' },
  2: { bg: '#C3D0F5', text: '#1A202C' },
  3: { bg: '#F7E8A4', text: '#1A202C' },
  4: { bg: '#F5B8A0', text: '#1A202C' },
  5: { bg: '#38B2AC', text: '#FFFFFF' },
};

// ─── Level Names ───

export const LEVEL_NAMES: Record<number, string> = {
  1: 'AI Fundamentals & Awareness',
  2: 'Applied Capability',
  3: 'Systemic Integration',
  4: 'Interactive Dashboards & Front-Ends',
  5: 'Full AI-Powered Applications',
};

// ─── Topic Options by Level (for Application Insights) ───

export const TOPIC_OPTIONS_BY_LEVEL: Record<number, string[]> = {
  1: [
    'What is an LLM',
    'Prompting Basics',
    'Everyday Use Cases',
    'Intro to Creative AI',
    'Responsible Use & Governance',
    'Prompt Library Creation',
  ],
  2: [
    'What are AI Agents',
    'Custom GPTs',
    'System Prompt Design',
    'Human-in-the-Loop Integration',
    'Ethical Framing',
    'Agent Templates',
  ],
  3: [
    'AI Workflow Mapping',
    'Agent Chaining',
    'Input Logic & Role Mapping',
    'Automated Output Generation',
    'Performance & Feedback Loops',
  ],
  4: [
    'UX Design for AI Outputs',
    'Dashboard Prototyping',
    'User Journey Mapping',
    'Data Visualization Principles',
    'Role-Specific Front-Ends',
  ],
  5: [
    'Application Architecture',
    'Personalization Engines',
    'Knowledge Base Applications',
    'Custom Learning Platforms',
    'Full-Stack AI Integration',
    'User Testing & Scaling',
  ],
};

// ─── Progress Table Data ───

export const PROGRESS_ACTIVITY_LABELS: Record<number, { tool: string; output: string; workshop: string }> = {
  1: { tool: 'Prompt Builder used', output: 'Prompt saved to library', workshop: 'L1 session code' },
  2: { tool: 'Agent Builder used', output: 'Agent template saved', workshop: 'L2 session code' },
  3: { tool: 'Workflow Designer used', output: 'Workflow map saved', workshop: 'L3 session code' },
  4: { tool: 'Dashboard Builder used', output: 'Dashboard config saved', workshop: 'L4 session code' },
  5: { tool: 'App Configurator used', output: 'App blueprint saved', workshop: 'L5 session code' },
};

// ─── Mock Progress Data ───

export const DEFAULT_PROGRESS_ROWS: ProgressRow[] = [
  { level: 1, name: 'Level 1: AI Fundamentals', toolUsed: 'complete', outputSaved: 'complete', workshopAttended: 'complete' },
  { level: 2, name: 'Level 2: Applied Capability', toolUsed: 'complete', outputSaved: 'incomplete', workshopAttended: 'incomplete' },
  { level: 3, name: 'Level 3: Systemic Integration', toolUsed: 'incomplete', outputSaved: 'incomplete', workshopAttended: 'incomplete' },
  { level: 4, name: 'Level 4: Dashboards', toolUsed: 'incomplete', outputSaved: 'incomplete', workshopAttended: 'incomplete' },
  { level: 5, name: 'Level 5: AI Applications', toolUsed: 'incomplete', outputSaved: 'incomplete', workshopAttended: 'incomplete' },
];

export const DEFAULT_STATS = {
  levelsStarted: 2,
  activitiesCompleted: 4,
  totalActivities: 15,
  overallProgress: 27,
};

// ─── Mock Prompt Library Cards (Level 1 and 2 only) ───

export const MOCK_PROMPTS: SavedPrompt[] = [
  {
    id: 'prompt-1',
    level: 1,
    title: 'Beginner concept explainer',
    content: 'Explain [topic] to me as if I am a complete beginner, using a real-world analogy and a practical example I can relate to.',
    savedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'prompt-2',
    level: 2,
    title: 'Consulting proposal assistant',
    content: 'You are a consulting proposal assistant. When given a client brief, produce a structured outline with an executive summary, three strategic recommendations, and suggested next steps.',
    savedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'prompt-3',
    level: 1,
    title: 'Meeting summary generator',
    content: 'Summarise the following meeting notes into: (1) Key decisions made, (2) Action items with owners, (3) Open questions. Use bullet points and keep it under 200 words.',
    savedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'prompt-4',
    level: 1,
    title: 'Email tone adjuster',
    content: 'Rewrite the following email to be more [professional/friendly/concise]. Keep the core message the same but adjust the tone. Highlight any parts you changed and explain why.',
    savedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'prompt-5',
    level: 2,
    title: 'Client discovery question generator',
    content: 'You are a senior business development consultant. Based on the following client industry and challenge description, generate 10 discovery questions that will help uncover the real problem, ordered from broad to specific. For each question, add a one-line note explaining what the answer will reveal.',
    savedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'prompt-6',
    level: 1,
    title: 'Research brief creator',
    content: 'I need to research [topic]. Create a structured research brief with: (1) Key questions to answer, (2) Suggested sources to check, (3) A summary template I can fill in as I go. Keep it to one page.',
    savedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'prompt-7',
    level: 2,
    title: 'Workshop facilitator agent',
    content: 'You are an experienced workshop facilitator. I will describe a workshop objective and audience. Design a 90-minute workshop agenda with: (1) An icebreaker activity, (2) Three main sections with timing and facilitation notes, (3) A closing reflection exercise, (4) A list of materials needed. Make it interactive and engaging.',
    savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
];

// ─── Mock Application Insight Cards ───

export const MOCK_INSIGHTS: InsightEntry[] = [
  {
    id: 'insight-1',
    level: 2,
    topic: 'Custom GPTs',
    context: 'Built a custom GPT to structure client discovery notes into a standardised format after each workshop...',
    outcome: 'Reduced post-workshop synthesis time from 3 hours to 45 minutes. Output quality more consistent across team members.',
    rating: 4,
    aiFeedback: 'This is a strong Level 2 application in a consulting context. You\'ve created a repeatable tool that standardises a previously manual process \u2014 exactly what Level 2 is designed to achieve. Consider whether this GPT could be shared across your project team as a standard tool.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'insight-2',
    level: 1,
    topic: 'Prompting Basics',
    context: 'Used ChatGPT to draft the first version of a capability statement for a new sector pitch...',
    outcome: 'First draft ready in 20 minutes. Required significant editing but provided a strong structural starting point.',
    rating: 3,
    aiFeedback: 'A solid first application of Level 1 skills. The editing required is completely normal at this stage \u2014 as your prompt engineering improves, output quality will increase. Try adding more specific context about the audience and sector in your next prompt.',
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
];

// ─── AI Feedback Generator (template-based for MVP) ───

export function generateInsightFeedback(entry: {
  level: number;
  topic: string;
  context: string;
  outcome: string;
  rating: number;
}): string {
  const levelLabel = `Level ${entry.level}`;
  const ratingWord = entry.rating >= 4 ? 'strong' : entry.rating >= 3 ? 'solid' : 'early-stage';

  const openers = [
    `This is a ${ratingWord} ${levelLabel} application.`,
    `A ${ratingWord} example of ${levelLabel} skills in practice.`,
    `This demonstrates ${ratingWord} application of ${levelLabel} concepts.`,
  ];

  const middles = [
    `Your focus on ${entry.topic.toLowerCase()} shows you're building practical skills that translate directly to workplace impact.`,
    `The way you've applied ${entry.topic.toLowerCase()} here shows a clear understanding of the core principles.`,
    `Working with ${entry.topic.toLowerCase()} in this context is exactly the kind of applied learning that drives real results.`,
  ];

  const closers = entry.rating >= 4
    ? [
        'Consider documenting this as a reusable approach for your team.',
        'This could become a template that others in your organization benefit from.',
        'Think about how this approach could be scaled or shared with colleagues.',
      ]
    : [
        'As you refine your approach, the output quality will continue improving.',
        'Try iterating on this with more specific instructions to see how the results change.',
        'Each application builds your confidence \u2014 keep experimenting with different approaches.',
      ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(openers)} ${pick(middles)} ${pick(closers)}`;
}

// ─── Learning Plan Generator ───

export function generateDefaultLearningPlan(): LevelBlock[] {
  return [
    {
      level: 1,
      name: 'Level 1 — AI Fundamentals',
      status: 'complete',
      activities: [
        { id: 'l1-a1', label: 'Complete the Prompt Playground', completed: true },
        { id: 'l1-a2', label: 'Save 3 prompts to your library', completed: true },
        { id: 'l1-a3', label: 'Attend Level 1 Workshop', completed: true },
      ],
    },
    {
      level: 2,
      name: 'Level 2 — Applied Capability',
      status: 'in-progress',
      activities: [
        { id: 'l2-a1', label: 'Build a custom agent in the Agent Builder', completed: true },
        { id: 'l2-a2', label: 'Design an agent for your function', completed: false },
        { id: 'l2-a3', label: 'Attend Level 2 Workshop', completed: false },
      ],
    },
    {
      level: 3,
      name: 'Level 3 — Systemic Integration',
      status: 'not-started',
      activities: [
        { id: 'l3-a1', label: 'Design a workflow in the Workflow Designer', completed: false },
        { id: 'l3-a2', label: 'Map a cross-functional process', completed: false },
        { id: 'l3-a3', label: 'Attend Level 3 Workshop', completed: false },
      ],
    },
    {
      level: 4,
      name: 'Level 4 — Product Architecture',
      status: 'not-started',
      activities: [
        { id: 'l4-a1', label: 'Complete the Dashboard Designer', completed: false },
        { id: 'l4-a2', label: 'Generate a PRD', completed: false },
        { id: 'l4-a3', label: 'Attend Level 4 Workshop', completed: false },
      ],
    },
    {
      level: 5,
      name: 'Level 5 — Enterprise Strategy',
      status: 'not-started',
      activities: [
        { id: 'l5-a1', label: 'Complete the Learning Pathway Generator', completed: false },
        { id: 'l5-a2', label: 'Present your capstone project', completed: false },
        { id: 'l5-a3', label: 'Attend Level 5 Workshop', completed: false },
      ],
    },
  ];
}

// ─── Date Formatting Helper ───

export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
