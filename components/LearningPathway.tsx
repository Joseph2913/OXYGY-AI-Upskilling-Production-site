import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Copy, FileText, Download,
  Loader2, Check, RotateCcw, ChevronRight, ChevronDown, ChevronUp,
  Link2, AlertCircle, BookOpen, Users, Briefcase, Sparkles,
} from 'lucide-react';
import { ArtifactClosing } from './ArtifactClosing';
import { usePathwayApi } from '../hooks/usePathwayApi';
import { useAuth } from '../context/AuthContext';
import { getProfile, upsertProfile, getLatestLearningPlan, saveLearningPlan } from '../lib/database';
import type { PathwayFormData, PathwayApiResponse, PathwayLevelResult, LevelDepth } from '../types';

// ---- Constants ----

const ACCENT = '#38B2AC';
const ACCENT_DARK = '#2C9A94';

const LEVEL_COLORS: Record<number, { accent: string; dark: string; name: string; tagline: string }> = {
  1: { accent: '#A8F0E0', dark: '#2C7A6E', name: 'Fundamentals of AI for Everyday Use', tagline: 'Build comfort, curiosity, and foundational confidence' },
  2: { accent: '#C3D0F5', dark: '#4A5A8A', name: 'Applied Capability', tagline: 'Design AI assistants tailored to your work' },
  3: { accent: '#F7E8A4', dark: '#C4A934', name: 'Systemic Integration', tagline: 'Scale AI through integrated, automated pipelines' },
  4: { accent: '#F5B8A0', dark: '#D47B5A', name: 'Interactive Dashboards & Tailored Front-Ends', tagline: 'Shift from data-in-a-sheet to tailored experiences' },
  5: { accent: '#38B2AC', dark: '#2C9A94', name: 'Full AI-Powered Applications', tagline: 'Build complete AI-powered products' },
};

const LEVEL_TOPICS: Record<number, { label: string; description: string }[]> = {
  1: [
    { label: 'What is an LLM', description: 'Understand how large language models work, their limits, and safe usage' },
    { label: 'Prompting Basics', description: 'Learn the structure of a good prompt and how to improve outputs' },
    { label: 'Everyday Use Cases', description: 'Apply AI to emails, notes, brainstorming, research, and planning' },
    { label: 'Intro to Creative AI', description: 'Experiment with image, video, and podcast AI tools for storytelling' },
    { label: 'Responsible Use', description: 'Recognize risks, avoid overreliance, and protect confidentiality' },
    { label: 'Prompt Library Creation', description: 'Build a reusable library of prompts relevant to your role' },
  ],
  2: [
    { label: 'What Are AI Agents?', description: 'Understand the difference between LLMs, GPTs, bots, and agents' },
    { label: 'Custom GPTs', description: 'Create purpose-specific agents with tailored instructions and tools' },
    { label: 'Instruction Design', description: 'Learn how to structure effective system instructions and conversation logic' },
    { label: 'Human-in-the-Loop', description: 'Integrate AI with human judgment for validation and oversight' },
    { label: 'Ethical Framing', description: 'De-risk language tone, add transparency markers' },
    { label: 'Agent Templates', description: 'Explore starter blueprints for real workflows' },
  ],
  3: [
    { label: 'AI Workflow Mapping', description: 'Identify where and how AI fits into end-to-end processes' },
    { label: 'Agent Chaining', description: 'Connect multiple GPTs to perform multi-step actions' },
    { label: 'Input Logic & Role Mapping', description: 'Build logic for interpreting who the user is and what their input means' },
    { label: 'Automated Output Generation', description: 'Trigger dynamic, personalized outputs based on data' },
    { label: 'Process Use Cases', description: 'Build full systems: Skills Survey to AI Analysis to Gap Mapping to Training Plan' },
    { label: 'Performance & Feedback Loops', description: 'Track adoption, flag gaps, incorporate user feedback' },
  ],
  4: [
    { label: 'Application Architecture', description: 'Design the structure of an interactive dashboard or front-end' },
    { label: 'User-Centered Dashboard Design', description: 'Work backwards from the end user\'s needs' },
    { label: 'Data Visualization Principles', description: 'Present AI outputs in clear, actionable visual formats' },
    { label: 'Role-Based Views', description: 'Different users see different things based on their role' },
    { label: 'Prototype Testing', description: 'Test dashboard prototypes with real users' },
    { label: 'Stakeholder Feedback Integration', description: 'Incorporate feedback loops into dashboard design' },
  ],
  5: [
    { label: 'Application Architecture', description: 'Design complete application structures with frontend, backend, and AI layers' },
    { label: 'Personalisation Engines', description: 'Build systems where different users get different experiences' },
    { label: 'Knowledge Base Applications', description: 'AI processes documents, transcripts, notes into searchable knowledge' },
    { label: 'Custom Learning Platforms', description: 'Individual learning pathways, per-account tracking, admin dashboards' },
    { label: 'Full-Stack AI Integration', description: 'Connect AI to databases, authentication, and deployment' },
    { label: 'User Testing & Scaling', description: 'Test with real users and prepare for production scale' },
  ],
};

// ---- Default pathway content (shown before generation) ----

const DEFAULT_LEVEL_CONTENT: Record<number, {
  project: string;
  description: string;
  deliverable: string;
  learningBreakdown: { applied: string; community: string; individual: string };
}> = {
  1: {
    project: 'Build Your Personal AI Prompt Library',
    description: 'Create a curated collection of reusable prompts for your most common tasks \u2014 emails, meeting prep, research summaries, and brainstorming. Learn how different prompt structures produce dramatically different outputs.',
    deliverable: 'A documented prompt library with 10\u201315 tested prompts you can use every day.',
    learningBreakdown: {
      applied: 'Test prompts against real work tasks, iterate on structure, and measure output quality',
      community: 'Share prompt discoveries in a peer workshop and learn from others\u2019 approaches',
      individual: 'Study prompt engineering fundamentals and explore creative AI tools',
    },
  },
  2: {
    project: 'Design a Reusable AI Agent for Your Team',
    description: 'Build a custom GPT or AI agent with structured instructions, clear output formats, and built-in accountability features. Designed so your colleagues can use it without needing your help.',
    deliverable: 'A working custom GPT your team can use for a recurring task starting this week.',
    learningBreakdown: {
      applied: 'Build and test the agent with real inputs from your team\u2019s workflows',
      community: 'Run a peer review session where colleagues test your agent and share feedback',
      individual: 'Study instruction design patterns and ethical framing principles',
    },
  },
  3: {
    project: 'Map and Automate a Multi-Step Workflow',
    description: 'Identify a process in your function that involves multiple handoffs and manual steps. Design an AI-powered pipeline that connects data inputs, processing agents, and structured outputs.',
    deliverable: 'A working automated workflow that reduces a multi-step manual process to a triggered pipeline.',
    learningBreakdown: {
      applied: 'Map a real process from your team, build the pipeline, and run it on live data',
      community: 'Present your workflow to peers and incorporate feedback on gaps and improvements',
      individual: 'Study workflow architecture patterns and automation platform capabilities',
    },
  },
  4: {
    project: 'Prototype a Stakeholder-Ready Dashboard',
    description: 'Take AI-generated outputs and transform them into a visual, role-based dashboard prototype. Design different views for different users \u2014 managers see summaries, analysts see details.',
    deliverable: 'A clickable dashboard prototype tested with at least two real stakeholders.',
    learningBreakdown: {
      applied: 'Design and build the prototype using real data and test with actual end users',
      community: 'Run a stakeholder feedback session and iterate based on user needs',
      individual: 'Study data visualization principles and user-centered design patterns',
    },
  },
  5: {
    project: 'Build and Deploy a Full AI-Powered Application',
    description: 'Create a complete application where different users get personalized experiences \u2014 with authentication, a database, AI-powered features, and a live deployment accessible to real users.',
    deliverable: 'A deployed, user-tested application with personalized AI features.',
    learningBreakdown: {
      applied: 'Build the full application stack, deploy it, and iterate based on real user behavior',
      community: 'Collaborate with technical and non-technical stakeholders throughout the build',
      individual: 'Study full-stack architecture, personalisation engines, and scaling patterns',
    },
  },
};

const FUNCTIONS = [
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

const SENIORITY_OPTIONS = [
  'Junior / early career (0\u20132 years)',
  'Mid-level / specialist (3\u20136 years)',
  'Senior / lead (7\u201312 years)',
  'Director / executive (12+ years)',
];

const AI_EXPERIENCE_OPTIONS = [
  { id: 'beginner', emoji: '\uD83C\uDF31', label: 'Beginner', description: 'I rarely use AI tools, or I\'ve only experimented casually' },
  { id: 'comfortable-user', emoji: '\uD83D\uDD27', label: 'Comfortable User', description: 'I use ChatGPT or similar tools regularly for basic tasks like drafting, research, or brainstorming' },
  { id: 'builder', emoji: '\uD83C\uDFD7\uFE0F', label: 'Builder', description: 'I\'ve created custom GPTs, agents, or prompt templates for specific tasks in my work' },
  { id: 'integrator', emoji: '\u2699\uFE0F', label: 'Integrator', description: 'I\'ve designed or contributed to AI-powered workflows, automations, or multi-step pipelines' },
];

const AMBITION_OPTIONS = [
  { id: 'confident-daily-use', emoji: '\uD83D\uDCA1', label: 'Confident daily use', description: 'I want to use AI effectively in my everyday work' },
  { id: 'build-reusable-tools', emoji: '\uD83D\uDEE0\uFE0F', label: 'Build reusable tools', description: 'I want to create AI tools and agents my team can use' },
  { id: 'own-ai-processes', emoji: '\uD83D\uDCD0', label: 'Own AI-powered processes', description: 'I want to design and manage automated AI workflows for my function' },
  { id: 'build-full-apps', emoji: '\uD83D\uDE80', label: 'Build full applications', description: 'I want to create complete AI-powered products with personalized experiences' },
];

const AVAILABILITY_OPTIONS = [
  { id: '1-2 hours', label: '1\u20132 hours', description: 'Fits around a busy schedule' },
  { id: '3-4 hours', label: '3\u20134 hours', description: 'Dedicated learning time each week' },
  { id: '5+ hours', label: '5+ hours', description: 'Intensive \u2014 I want to move fast' },
];

const PROFILES = [
  {
    id: 'new-starter', name: 'The New Starter', emoji: '\uD83C\uDF31',
    role: 'Junior Analyst', function: 'Consulting & Delivery',
    seniority: 'Junior / early career (0\u20132 years)', aiExperience: 'beginner',
    ambition: 'confident-daily-use',
    challenge: 'I feel like everyone around me is using AI tools and I\'m falling behind. I want to be confident using AI for everyday tasks like drafting emails, summarizing documents, and preparing for meetings.',
    availability: '1-2 hours',
    pills: ['Beginner', '0\u20132 years', 'Daily confidence'],
  },
  {
    id: 'curious-pm', name: 'The Curious PM', emoji: '\uD83D\uDD27',
    role: 'Project Manager', function: 'Project Management',
    seniority: 'Mid-level / specialist (3\u20136 years)', aiExperience: 'comfortable-user',
    ambition: 'build-reusable-tools',
    challenge: 'I spend hours every week summarizing meeting notes and status updates. I want to build something my team can use to automate this \u2014 paste in the notes, get a structured summary with action items.',
    availability: '3-4 hours',
    pills: ['Comfortable user', '3\u20136 years', 'Build tools'],
  },
  {
    id: 'ld-champion', name: 'The L&D Champion', emoji: '\uD83D\uDCDA',
    role: 'L&D Manager', function: 'L&D / Training',
    seniority: 'Mid-level / specialist (3\u20136 years)', aiExperience: 'builder',
    ambition: 'own-ai-processes',
    challenge: 'I want to automate our skills assessment process \u2014 currently we run surveys manually, analyze results in spreadsheets, and create individual training plans by hand. It takes weeks.',
    availability: '3-4 hours',
    pills: ['Builder', '3\u20136 years', 'Own processes'],
  },
  {
    id: 'ops-director', name: 'The Ops Director', emoji: '\u2699\uFE0F',
    role: 'Operations Director', function: 'Ops & SOP Management',
    seniority: 'Senior / lead (7\u201312 years)', aiExperience: 'comfortable-user',
    ambition: 'own-ai-processes',
    challenge: 'I need to standardize SOPs across 6 regional teams. Each team documents processes differently, and I spend weeks reconciling them. I want AI to help convert, standardize, and maintain these documents.',
    availability: '1-2 hours',
    pills: ['Comfortable user', '7\u201312 years', 'Own processes'],
  },
  {
    id: 'innovation-lead', name: 'The Innovation Lead', emoji: '\uD83D\uDE80',
    role: 'Director of Digital Transformation', function: 'IT & Knowledge Management',
    seniority: 'Director / executive (12+ years)', aiExperience: 'integrator',
    ambition: 'build-full-apps',
    challenge: 'I want to build an internal knowledge base for the firm \u2014 a place where consultants can search across project reports, methodologies, and case studies using AI, and get personalized recommendations based on their current project.',
    availability: '5+ hours',
    pills: ['Integrator', '12+ years', 'Full apps'],
  },
];

const LOADING_STEPS = [
  'Analyzing your profile...',
  'Classifying your learning levels...',
  'Designing personalized projects...',
  'Connecting to your challenge...',
  'Finalizing your pathway...',
];

// ---- Level Depth Matrix ----

type DepthMatrix = Record<string, Record<string, [LevelDepth, LevelDepth, LevelDepth, LevelDepth, LevelDepth]>>;

const DEPTH_MATRIX: DepthMatrix = {
  // Level 1 and Level 2 are MANDATORY for everyone — minimum is 'fast-track'.
  // Only Levels 3–5 can be skipped when too advanced for the learner.
  'beginner': {
    'confident-daily-use': ['full', 'full', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['full', 'full', 'awareness', 'skip', 'skip'],
    'own-ai-processes': ['full', 'full', 'full', 'awareness', 'skip'],
    'build-full-apps': ['full', 'full', 'full', 'full', 'full'],
  },
  'comfortable-user': {
    'confident-daily-use': ['fast-track', 'full', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'full', 'full', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'full', 'full', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'full', 'full', 'full', 'full'],
  },
  'builder': {
    'confident-daily-use': ['fast-track', 'fast-track', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'fast-track', 'full', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'fast-track', 'full', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'fast-track', 'full', 'full', 'full'],
  },
  'integrator': {
    'confident-daily-use': ['fast-track', 'fast-track', 'fast-track', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'fast-track', 'fast-track', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'fast-track', 'fast-track', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'fast-track', 'fast-track', 'full', 'full'],
  },
};

function classifyLevels(aiExperience: string, ambition: string): Record<string, LevelDepth> {
  const depths = DEPTH_MATRIX[aiExperience]?.[ambition] || ['full', 'full', 'full', 'full', 'full'];
  return { L1: depths[0], L2: depths[1], L3: depths[2], L4: depths[3], L5: depths[4] };
}

// ---- Time Estimates ----

const TIME_ESTIMATES: Record<string, Record<string, string>> = {
  'full': { '1-2 hours': '3 weeks', '3-4 hours': '2 weeks', '5+ hours': '1 week' },
  'fast-track': { '1-2 hours': '1.5 weeks', '3-4 hours': '1 week', '5+ hours': '3 days' },
  'awareness': { '1-2 hours': '1 session', '3-4 hours': '1 session', '5+ hours': '1 session' },
};

function getTimeEstimate(depth: LevelDepth, availability: string): string {
  return TIME_ESTIMATES[depth]?.[availability] || '';
}

// ---- Level artifact link helper ----

function getLevelHref(level: number): string {
  if (level === 1) return '#playground';
  if (level === 2) return '#agent-builder';
  if (level === 3) return '#workflow-designer';
  if (level === 4) return '#dashboard-design';
  if (level === 5) return '#product-architecture';
  return '#';
}

function getLevelToolName(level: number): string {
  if (level === 1) return 'Prompt Playground';
  if (level === 2) return 'Agent Builder';
  if (level === 3) return 'Workflow Designer';
  if (level === 4) return 'Dashboard Designer';
  if (level === 5) return 'Product Architecture';
  return 'Interactive Tool';
}

// ---- Export helpers ----

function generateTextExport(
  formData: PathwayFormData,
  results: PathwayApiResponse,
  levelDepths: Record<string, LevelDepth>,
): string {
  let text = `AI LEARNING PATHWAY\n${'='.repeat(40)}\n\n`;
  text += `${results.pathwaySummary}\n\n`;
  text += `PROFILE\n${'-'.repeat(20)}\n`;
  text += `Role: ${formData.role}\n`;
  text += `Function: ${formData.function === 'Other' ? formData.functionOther : formData.function}\n`;
  text += `Seniority: ${formData.seniority}\n`;
  text += `AI Experience: ${formData.aiExperience}\n`;
  text += `Challenge: ${formData.challenge}\n`;
  text += `Availability: ${formData.availability}\n\n`;

  for (let i = 1; i <= 5; i++) {
    const key = `L${i}`;
    const depth = levelDepths[key];
    const level = LEVEL_COLORS[i];
    const result = results.levels[key] as PathwayLevelResult | undefined;

    if (depth === 'skip') {
      text += `LEVEL ${i}: ${level.name} \u2014 Skipped\n\n`;
      continue;
    }
    if (depth === 'awareness') {
      text += `LEVEL ${i}: ${level.name} \u2014 Awareness\n`;
      text += `Topics: ${LEVEL_TOPICS[i].map(t => t.label).join(', ')}\n\n`;
      continue;
    }
    if (result) {
      text += `LEVEL ${i}: ${level.name} \u2014 ${depth === 'full' ? 'Full Program' : 'Fast-track'}\n`;
      text += `Time: ~${getTimeEstimate(depth, formData.availability)}\n\n`;
      text += `PROJECT: ${result.projectTitle}\n`;
      text += `${result.projectDescription}\n`;
      text += `Deliverable: ${result.deliverable}\n\n`;
      text += `HOW THIS CONNECTS TO YOUR CHALLENGE:\n${result.challengeConnection}\n\n`;
      text += `Key Concepts: ${LEVEL_TOPICS[i].map(t => t.label).join(', ')}\n`;
      text += `Format: ${result.sessionFormat}\n`;
      text += `Resources:\n${result.resources.map(r => `  - ${r.name}: ${r.note}`).join('\n')}\n\n`;
    }
  }
  return text;
}

function generateMarkdownExport(
  formData: PathwayFormData,
  results: PathwayApiResponse,
  levelDepths: Record<string, LevelDepth>,
): string {
  let md = `# AI Learning Pathway\n\n`;
  md += `> ${results.pathwaySummary}\n\n`;
  md += `## Profile\n`;
  md += `| Field | Value |\n|---|---|\n`;
  md += `| Role | ${formData.role} |\n`;
  md += `| Function | ${formData.function === 'Other' ? formData.functionOther : formData.function} |\n`;
  md += `| Seniority | ${formData.seniority} |\n`;
  md += `| AI Experience | ${formData.aiExperience} |\n`;
  md += `| Challenge | ${formData.challenge} |\n`;
  md += `| Availability | ${formData.availability} |\n\n`;
  md += `---\n\n`;

  for (let i = 1; i <= 5; i++) {
    const key = `L${i}`;
    const depth = levelDepths[key];
    const level = LEVEL_COLORS[i];
    const result = results.levels[key] as PathwayLevelResult | undefined;

    if (depth === 'skip') {
      md += `## Level ${i}: ${level.name} \u2014 *Skipped*\n\n`;
      continue;
    }
    if (depth === 'awareness') {
      md += `## Level ${i}: ${level.name} \u2014 *Awareness*\n`;
      md += `**Topics:** ${LEVEL_TOPICS[i].map(t => t.label).join(', ')}\n\n`;
      continue;
    }
    if (result) {
      md += `## Level ${i}: ${level.name} \u2014 ${depth === 'full' ? 'Full Program' : 'Fast-track'}\n`;
      md += `*~${getTimeEstimate(depth, formData.availability)}*\n\n`;
      md += `### Project: ${result.projectTitle}\n`;
      md += `${result.projectDescription}\n\n`;
      md += `**Deliverable:** ${result.deliverable}\n\n`;
      md += `### How This Connects to Your Challenge\n`;
      md += `*${result.challengeConnection}*\n\n`;
      md += `**Key Concepts:** ${LEVEL_TOPICS[i].map(t => t.label).join(', ')}\n\n`;
      md += `**Recommended Format:** ${result.sessionFormat}\n\n`;
      md += `**Resources:**\n${result.resources.map(r => `- **${r.name}** \u2014 ${r.note}`).join('\n')}\n\n`;
      md += `---\n\n`;
    }
  }
  return md;
}

// ---- 70-20-10 Learning Breakdown sub-component ----

function LearningBreakdown({ applied, community, individual, accentColor }: {
  applied: string; community: string; individual: string; accentColor: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
      <div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}40` }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Briefcase size={13} style={{ color: accentColor }} />
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            70% Applied
          </p>
        </div>
        <p className="text-xs text-[#4A5568] leading-relaxed">{applied}</p>
      </div>
      <div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Users size={13} style={{ color: accentColor }} />
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            20% Community
          </p>
        </div>
        <p className="text-xs text-[#4A5568] leading-relaxed">{community}</p>
      </div>
      <div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <BookOpen size={13} style={{ color: accentColor }} />
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            10% Individual
          </p>
        </div>
        <p className="text-xs text-[#4A5568] leading-relaxed">{individual}</p>
      </div>
    </div>
  );
}

// ---- Main Component ----

const EMPTY_FORM: PathwayFormData = {
  role: '', function: '', functionOther: '', seniority: '',
  aiExperience: '', ambition: '', challenge: '', availability: '',
  experienceDescription: '', goalDescription: '',
};

export const LearningPathway: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  // Form state — pre-fill from Supabase profile if available
  const [formData, setFormData] = useState<PathwayFormData>(EMPTY_FORM);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [answersChanged, setAnswersChanged] = useState(false);

  // Results state — load previously generated plan from Supabase
  const [pathwayResults, setPathwayResults] = useState<PathwayApiResponse | null>(null);
  const [levelDepths, setLevelDepths] = useState<Record<string, LevelDepth> | null>(null);

  // Load saved profile + plan from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getProfile(userId),
      getLatestLearningPlan(userId),
    ]).then(([profileData, planData]) => {
      if (profileData) {
        setFormData({
          role: profileData.role || '',
          function: profileData.function || '',
          functionOther: profileData.functionOther || '',
          seniority: profileData.seniority || '',
          aiExperience: profileData.aiExperience || '',
          ambition: profileData.ambition || '',
          challenge: profileData.challenge || '',
          availability: profileData.availability || '',
          experienceDescription: profileData.experienceDescription || '',
          goalDescription: profileData.goalDescription || '',
        });
      }
      if (planData) {
        setPathwayResults(planData.plan);
        setLevelDepths(planData.level_depths);
      }
    });
  }, [userId]);

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(0);
  const [expandedDefaults, setExpandedDefaults] = useState<Record<number, boolean>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [showOptional, setShowOptional] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Refs
  const questionnaireRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // API
  const { generatePathway, isLoading, error, clearError } = usePathwayApi();

  // Reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Form validation — only required fields
  const isFormComplete = useMemo(() => {
    return (
      formData.role.trim() !== '' &&
      formData.function !== '' &&
      (formData.function !== 'Other' || formData.functionOther.trim() !== '') &&
      formData.seniority !== '' &&
      formData.aiExperience !== '' &&
      formData.ambition !== '' &&
      formData.challenge.trim() !== '' &&
      formData.availability !== ''
    );
  }, [formData]);

  // Handlers
  const updateField = useCallback((field: keyof PathwayFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (pathwayResults) setAnswersChanged(true);
  }, [pathwayResults]);

  const handleProfileSelect = useCallback((profile: typeof PROFILES[0]) => {
    setSelectedProfile(profile.id);
    setFormData({
      role: profile.role,
      function: profile.function,
      functionOther: '',
      seniority: profile.seniority,
      aiExperience: profile.aiExperience,
      ambition: profile.ambition,
      challenge: profile.challenge,
      availability: profile.availability,
      experienceDescription: '',
      goalDescription: '',
    });
    if (pathwayResults) setAnswersChanged(true);
    setTimeout(() => {
      questionnaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [pathwayResults]);

  const handleGenerate = useCallback(async () => {
    clearError();
    const depths = classifyLevels(formData.aiExperience, formData.ambition);
    setLevelDepths(depths);
    setCardsRevealed(0);
    setAnswersChanged(false);
    setExpandedResults({});
    setLoadingStep(0);

    // Scroll to loading section
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const result = await generatePathway(formData, depths);
    if (result) {
      setPathwayResults(result);
      // Persist plan and profile data to Supabase for dashboard integration
      if (userId) {
        saveLearningPlan(userId, result, depths);
        upsertProfile(userId, {
          role: formData.role,
          function: formData.function,
          functionOther: formData.functionOther,
          seniority: formData.seniority,
          aiExperience: formData.aiExperience,
          ambition: formData.ambition,
          challenge: formData.challenge,
          availability: formData.availability,
          experienceDescription: formData.experienceDescription,
          goalDescription: formData.goalDescription,
        } as any);
      }
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [formData, generatePathway, clearError]);

  const handleReset = useCallback(() => {
    setFormData({
      role: '', function: '', functionOther: '', seniority: '',
      aiExperience: '', ambition: '', challenge: '', availability: '',
      experienceDescription: '', goalDescription: '',
    });
    setSelectedProfile(null);
    setPathwayResults(null);
    setLevelDepths(null);
    setCardsRevealed(0);
    setAnswersChanged(false);
    setExpandedResults({});
    setShowOptional(false);
    clearError();
    setTimeout(() => {
      questionnaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [clearError]);

  const copyToClipboard = useCallback((text: string, label: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setToastMessage(label);
      setShowToast(true);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setShowToast(false), 2500);
    });
  }, []);

  const handleDownloadMd = useCallback(() => {
    if (!pathwayResults || !levelDepths) return;
    const md = generateMarkdownExport(formData, pathwayResults, levelDepths);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Learning_Pathway_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Downloaded');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, [pathwayResults, levelDepths, formData]);

  const toggleDefaultExpand = useCallback((level: number) => {
    setExpandedDefaults(prev => ({ ...prev, [level]: !prev[level] }));
  }, []);

  const toggleResultExpand = useCallback((key: string) => {
    setExpandedResults(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Staggered card reveal
  useEffect(() => {
    if (!pathwayResults || prefersReducedMotion) {
      if (pathwayResults) setCardsRevealed(5);
      return;
    }
    if (cardsRevealed < 5) {
      const timer = setTimeout(() => setCardsRevealed(prev => prev + 1), 200);
      return () => clearTimeout(timer);
    }
  }, [pathwayResults, cardsRevealed, prefersReducedMotion]);

  // Loading step animation
  useEffect(() => {
    if (!isLoading) return;
    if (loadingStep < LOADING_STEPS.length - 1) {
      const timer = setTimeout(() => setLoadingStep(prev => prev + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingStep]);

  // ---- Shared input style helpers ----
  const inputBorderStyle = { border: '1px solid #E2E8F0' };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = ACCENT;
    e.target.style.boxShadow = `0 0 0 1px ${ACCENT}33`;
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#E2E8F0';
    e.target.style.boxShadow = 'none';
  };

  // ---- Render ----
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <a
          href="#"
          onClick={e => { e.preventDefault(); window.location.hash = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-flex items-center gap-1.5 text-[14px] text-[#718096] transition-colors mb-8"
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT_DARK)}
          onMouseLeave={e => (e.currentTarget.style.color = '#718096')}
        >
          <ArrowLeft size={16} /> Home
        </a>

        {/* Centered Title */}
        <div className="mb-8 text-center">
          <div
            className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: '#E6FFFA', color: ACCENT_DARK, border: `1px solid ${ACCENT}` }}
          >
            AI Learning Pathway &mdash; Personalized
          </div>
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#1A202C] leading-[1.15]">
            Your Personalized AI
            <br />
            <span className="relative inline-block">
              Learning Pathway
              <span
                className="absolute left-0 -bottom-1 w-full h-[4px] rounded-full"
                style={{ backgroundColor: ACCENT_DARK, opacity: 0.8 }}
              />
            </span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#718096] leading-[1.7] max-w-[700px] mx-auto mt-6">
            This generator builds you a personalized plan for progressing through the levels &mdash; and assigns a relevant, hands-on project at each level to ensure your learning is applied and grounded in real business needs.
          </p>
        </div>

        {/* Did You Know? Card */}
        <div
          className="relative rounded-2xl px-8 md:px-12 py-8 text-center overflow-hidden mb-12"
          style={{
            background: 'linear-gradient(135deg, rgba(56,178,172,0.15) 0%, rgba(44,154,148,0.08) 50%, rgba(56,178,172,0.12) 100%)',
            border: `1.5px solid ${ACCENT}`,
          }}
        >
          <div className="absolute top-3 left-4 flex gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT_DARK, opacity: 0.4 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#B2F5EA', opacity: 0.6 }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT_DARK, opacity: 0.3 }} />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: ACCENT_DARK }}>
            Did you know?
          </p>
          <p className="text-[17px] md:text-[19px] text-[#2D3748] leading-[1.6] font-medium mb-2 max-w-3xl mx-auto">
            Research consistently shows that project-based learning leads to{' '}
            <span className="font-bold" style={{ color: ACCENT_DARK }}>2&ndash;3&times; higher skill retention</span>{' '}
            than passive content consumption. When learners apply new concepts to real problems from their own work,
            they build durable skills they actually use.
          </p>
          <p className="text-[15px] text-[#718096] leading-[1.6] max-w-3xl mx-auto">
            That&rsquo;s why every level of this pathway is built around a project, not a syllabus.
          </p>
          <p className="text-[12px] text-[#A0AEC0] mt-2 italic">
            &mdash; Adapted from Harvard Business Review, &ldquo;The Case for Project-Based Learning in Professional Development,&rdquo; 2023
          </p>
        </div>

        {/* Profile Shortcuts — full width grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Start from a Profile</h2>
          <p className="text-sm text-[#718096] leading-relaxed mb-6">
            See yourself in one of these? Click to pre-fill the questionnaire, then adjust any answers to make it yours.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROFILES.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className="text-left rounded-xl p-5 transition-colors duration-200"
                style={{
                  backgroundColor: selectedProfile === profile.id ? '#F0FFFC' : '#FFFFFF',
                  border: selectedProfile === profile.id ? `2px solid ${ACCENT}` : '1px solid #E2E8F0',
                }}
                onMouseEnter={e => { if (selectedProfile !== profile.id) e.currentTarget.style.borderColor = ACCENT; }}
                onMouseLeave={e => { if (selectedProfile !== profile.id) e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <span className="text-[36px] leading-none block mb-2">{profile.emoji}</span>
                <p className="text-sm font-bold text-[#1A202C] mb-0.5">{profile.name}</p>
                <p className="text-xs text-[#718096] mb-3">{profile.role}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.pills.map(pill => (
                    <span key={pill} className="text-[11px] bg-[#F7FAFC] text-[#4A5568] px-2 py-0.5 rounded">
                      {pill}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Questionnaire Section */}
        <div ref={questionnaireRef} className="py-16 -mx-4 sm:-mx-6 px-4 sm:px-6" style={{ backgroundColor: '#F7FAFC' }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1A202C] mb-2">Tell Us About You</h2>
            <p className="text-sm text-[#718096] leading-relaxed mb-8">
              Answer the required questions and we&rsquo;ll generate a learning pathway built around projects relevant to your actual work.
            </p>

            <div className="space-y-8">
              {/* Q1: Role */}
              <div>
                <label htmlFor="pathway-role" className="block text-sm font-semibold text-[#1A202C] mb-2">
                  Your Role
                </label>
                <input
                  id="pathway-role"
                  type="text"
                  value={formData.role}
                  onChange={e => updateField('role', e.target.value)}
                  placeholder="e.g., Project Manager, L&D Coordinator, Senior Consultant, Marketing Lead"
                  className="w-full rounded-lg p-3 text-sm text-[#1A202C] placeholder-[#A0AEC0] bg-white focus:outline-none transition-colors"
                  style={inputBorderStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Q2 + Q3: Function & Seniority side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pathway-function" className="block text-sm font-semibold text-[#1A202C] mb-2">
                    Your Function
                  </label>
                  <select
                    id="pathway-function"
                    value={formData.function}
                    onChange={e => updateField('function', e.target.value)}
                    className="w-full rounded-lg p-3 text-sm text-[#1A202C] bg-white focus:outline-none transition-colors appearance-none"
                    style={inputBorderStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  >
                    <option value="">Select your function...</option>
                    {FUNCTIONS.map(fn => (
                      <option key={fn} value={fn}>{fn}</option>
                    ))}
                  </select>
                  {formData.function === 'Other' && (
                    <input
                      type="text"
                      value={formData.functionOther}
                      onChange={e => updateField('functionOther', e.target.value)}
                      placeholder="Please specify your function"
                      className="w-full mt-3 rounded-lg p-3 text-sm text-[#1A202C] placeholder-[#A0AEC0] bg-white focus:outline-none transition-colors"
                      style={inputBorderStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="pathway-seniority" className="block text-sm font-semibold text-[#1A202C] mb-2">
                    Your Seniority
                  </label>
                  <select
                    id="pathway-seniority"
                    value={formData.seniority}
                    onChange={e => updateField('seniority', e.target.value)}
                    className="w-full rounded-lg p-3 text-sm text-[#1A202C] bg-white focus:outline-none transition-colors appearance-none"
                    style={inputBorderStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  >
                    <option value="">Select your seniority level...</option>
                    {SENIORITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Q4: AI Experience */}
              <div>
                <label className="block text-sm font-semibold text-[#1A202C] mb-3">
                  Your AI Experience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="AI Experience">
                  {AI_EXPERIENCE_OPTIONS.map(opt => {
                    const isSelected = formData.aiExperience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => updateField('aiExperience', isSelected ? '' : opt.id)}
                        className="relative text-left rounded-xl p-4 transition-colors duration-200"
                        style={{
                          backgroundColor: isSelected ? '#F0FFFC' : '#FFFFFF',
                          border: isSelected ? `2px solid ${ACCENT}` : '1px solid #E2E8F0',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = ACCENT; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2">
                            <Check size={16} style={{ color: ACCENT }} />
                          </span>
                        )}
                        <span className="text-[24px] block mb-1">{opt.emoji}</span>
                        <p className="text-sm font-bold text-[#1A202C] mb-0.5">{opt.label}</p>
                        <p className="text-xs text-[#718096] leading-relaxed">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q5: Ambition */}
              <div>
                <label className="block text-sm font-semibold text-[#1A202C] mb-3">
                  Your Ambition
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="Ambition">
                  {AMBITION_OPTIONS.map(opt => {
                    const isSelected = formData.ambition === opt.id;
                    return (
                      <button
                        key={opt.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => updateField('ambition', isSelected ? '' : opt.id)}
                        className="relative text-left rounded-xl p-4 transition-colors duration-200"
                        style={{
                          backgroundColor: isSelected ? '#F0FFFC' : '#FFFFFF',
                          border: isSelected ? `2px solid ${ACCENT}` : '1px solid #E2E8F0',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = ACCENT; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2">
                            <Check size={16} style={{ color: ACCENT }} />
                          </span>
                        )}
                        <span className="text-[24px] block mb-1">{opt.emoji}</span>
                        <p className="text-sm font-bold text-[#1A202C] mb-0.5">{opt.label}</p>
                        <p className="text-xs text-[#718096] leading-relaxed">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q6: Challenge */}
              <div>
                <label htmlFor="pathway-challenge" className="block text-sm font-semibold text-[#1A202C] mb-2">
                  Your Challenge
                </label>
                <div className="relative">
                  <textarea
                    id="pathway-challenge"
                    value={formData.challenge}
                    onChange={e => updateField('challenge', e.target.value.slice(0, 500))}
                    placeholder='e.g., "I spend hours summarizing meeting notes and action items every week" or "I need a better way to match employee skills to training modules"'
                    className="w-full rounded-lg p-3 text-sm text-[#1A202C] placeholder-[#A0AEC0] bg-white focus:outline-none transition-colors resize-y"
                    style={{ ...inputBorderStyle, minHeight: '80px' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-[#A0AEC0]">
                    {formData.challenge.length}/500
                  </span>
                </div>
              </div>

              {/* Q7: Availability */}
              <div>
                <label className="block text-sm font-semibold text-[#1A202C] mb-3">
                  Your Availability
                </label>
                <div className="flex flex-col sm:flex-row gap-3" role="radiogroup" aria-label="Weekly availability">
                  {AVAILABILITY_OPTIONS.map(opt => {
                    const isSelected = formData.availability === opt.id;
                    return (
                      <button
                        key={opt.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => updateField('availability', isSelected ? '' : opt.id)}
                        className="rounded-lg px-4 py-3 transition-colors duration-200 text-left"
                        style={{
                          backgroundColor: isSelected ? '#F0FFFC' : '#FFFFFF',
                          border: isSelected ? `2px solid ${ACCENT}` : '1px solid #E2E8F0',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = ACCENT; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        <p className="text-sm font-semibold text-[#1A202C]">{opt.label}</p>
                        <p className="text-xs text-[#718096]">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional questions — collapsible dropdown */}
              <div className="pt-2">
                <button
                  onClick={() => setShowOptional(!showOptional)}
                  className="w-full flex items-center gap-3 py-3 group cursor-pointer"
                >
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-[#718096] group-hover:text-[#4A5568] transition-colors select-none">
                    {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Additional questions that improve accuracy
                  </span>
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                </button>

                {showOptional && (
                  <div className="space-y-6 pt-4 animate-fadeIn">
                    {/* Q8: Experience Description (Optional) */}
                    <div>
                      <label htmlFor="pathway-experience-desc" className="block text-sm font-semibold text-[#1A202C] mb-1">
                        Describe Your AI Experience
                        <span className="text-xs font-normal text-[#A0AEC0] ml-2">Optional</span>
                      </label>
                      <p className="text-xs text-[#718096] mb-2">
                        Tell us more about how you&rsquo;ve used AI tools so far &mdash; this helps us calibrate the right starting point.
                      </p>
                      <textarea
                        id="pathway-experience-desc"
                        value={formData.experienceDescription}
                        onChange={e => updateField('experienceDescription', e.target.value.slice(0, 500))}
                        placeholder={'e.g., "I use ChatGPT daily for email drafts and have built two custom GPTs for my team" or "I\'ve only tried AI a couple of times"'}
                        className="w-full rounded-lg p-3 text-sm text-[#1A202C] placeholder-[#A0AEC0] bg-white focus:outline-none transition-colors resize-y"
                        style={{ ...inputBorderStyle, minHeight: '70px' }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* Q9: Goal Description (Optional) */}
                    <div>
                      <label htmlFor="pathway-goal-desc" className="block text-sm font-semibold text-[#1A202C] mb-1">
                        What Goal Would You Like to Work Towards?
                        <span className="text-xs font-normal text-[#A0AEC0] ml-2">Optional</span>
                      </label>
                      <p className="text-xs text-[#718096] mb-2">
                        A specific outcome you&rsquo;d like to achieve &mdash; this helps us tailor the projects to something you care about.
                      </p>
                      <textarea
                        id="pathway-goal-desc"
                        value={formData.goalDescription}
                        onChange={e => updateField('goalDescription', e.target.value.slice(0, 500))}
                        placeholder='e.g., "I want to be the go-to person for AI tools on my team within 6 months" or "I want to automate our entire client onboarding flow"'
                        className="w-full rounded-lg p-3 text-sm text-[#1A202C] placeholder-[#A0AEC0] bg-white focus:outline-none transition-colors resize-y"
                        style={{ ...inputBorderStyle, minHeight: '70px' }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              {answersChanged && pathwayResults && (
                <p className="text-sm text-[#718096] mb-3">
                  Your answers have changed &mdash;{' '}
                  <button onClick={handleGenerate} className="underline font-semibold" style={{ color: ACCENT_DARK }}>
                    regenerate?
                  </button>
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={!isFormComplete || isLoading}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-[15px] font-semibold text-white transition-all duration-300"
                style={{
                  backgroundColor: (!isFormComplete || isLoading) ? '#E2E8F0' : ACCENT,
                  color: (!isFormComplete || isLoading) ? '#A0AEC0' : '#FFFFFF',
                  cursor: (!isFormComplete || isLoading) ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (isFormComplete && !isLoading) e.currentTarget.style.backgroundColor = ACCENT_DARK; }}
                onMouseLeave={e => { if (isFormComplete && !isLoading) e.currentTarget.style.backgroundColor = ACCENT; }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate My Learning Pathway
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-600">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                  <button
                    onClick={handleGenerate}
                    className="ml-2 underline font-semibold"
                    style={{ color: ACCENT_DARK }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Animation — shown during generation */}
        {isLoading && (
          <div ref={loadingRef} className="py-16">
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
                style={{ backgroundColor: `${ACCENT}15` }}
              >
                <Sparkles size={28} className="animate-pulse" style={{ color: ACCENT }} />
              </div>
              <p className="text-xl font-bold text-[#1A202C] mb-2">
                Building Your Pathway
              </p>
              <p
                className="text-sm font-medium mb-6 transition-opacity duration-500"
                style={{ color: ACCENT_DARK }}
                key={loadingStep}
              >
                {LOADING_STEPS[loadingStep]}
              </p>

              {/* Progress dots */}
              <div className="flex justify-center gap-2">
                {LOADING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: i <= loadingStep ? '28px' : '8px',
                      backgroundColor: i <= loadingStep ? ACCENT : '#E2E8F0',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Skeleton cards */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(level => {
                const colors = LEVEL_COLORS[level];
                const isActive = level - 1 <= loadingStep;
                return (
                  <div
                    key={level}
                    className="rounded-xl p-5 transition-all duration-500"
                    style={{
                      border: '1px solid #E2E8F0',
                      borderLeft: `4px solid ${colors.accent}`,
                      opacity: isActive ? 0.7 : 0.3,
                    }}
                  >
                    <div className={`flex items-center gap-4 ${isActive ? 'animate-pulse' : ''}`}>
                      <div
                        className="w-20 h-6 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${colors.accent}40` }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="w-3/5 h-4 bg-[#E2E8F0] rounded" />
                        <div className="w-2/5 h-3 bg-[#F7FAFC] rounded" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Default Pathway Preview — shown when no results yet and not loading */}
        {!pathwayResults && !isLoading && (
          <div className="py-16">
            <h2 className="text-2xl font-bold text-[#1A202C] mb-2">The Five Levels at a Glance</h2>
            <p className="text-sm text-[#718096] leading-relaxed mb-8">
              Every pathway is built from these five levels. Fill out the questionnaire above to get a personalized plan &mdash; or explore the general framework below.
            </p>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(level => {
                const colors = LEVEL_COLORS[level];
                const content = DEFAULT_LEVEL_CONTENT[level];
                const isExpanded = expandedDefaults[level];

                return (
                  <div
                    key={level}
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid #E2E8F0', borderLeft: `4px solid ${colors.accent}` }}
                  >
                    {/* Collapsed header — always visible */}
                    <button
                      onClick={() => toggleDefaultExpand(level)}
                      className="w-full text-left p-5 flex items-start gap-4 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-block text-xs font-bold uppercase px-3 py-1.5 rounded-full mb-3"
                          style={{ backgroundColor: `${colors.accent}33`, color: '#2D3748' }}
                        >
                          Level {String(level).padStart(2, '0')} &mdash; {colors.name}
                        </span>
                        {/* Project — emphasized */}
                        <div
                          className="rounded-lg p-3"
                          style={{ backgroundColor: `${colors.accent}0D`, border: `1px solid ${colors.accent}25` }}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.dark }}>
                            Project
                          </p>
                          <p className="text-base font-bold text-[#1A202C] mb-1">{content.project}</p>
                          <p className="text-xs text-[#4A5568]">
                            <span className="font-semibold text-[#1A202C]">Deliverable:</span> {content.deliverable}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1.5 pt-1">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: colors.dark }}
                        >
                          {isExpanded ? 'Less' : 'More'}
                        </span>
                        {isExpanded
                          ? <ChevronUp size={18} style={{ color: colors.dark }} />
                          : <ChevronDown size={18} style={{ color: colors.dark }} />
                        }
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #E2E8F0' }}>
                        {/* Project description */}
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2">
                            Sample Project
                          </p>
                          <p className="text-sm text-[#4A5568] leading-relaxed">{content.description}</p>
                        </div>

                        {/* 70-20-10 Learning Breakdown */}
                        <div className="px-5 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">
                            Learning Approach &mdash; 70-20-10 Model
                          </p>
                          <LearningBreakdown
                            applied={content.learningBreakdown.applied}
                            community={content.learningBreakdown.community}
                            individual={content.learningBreakdown.individual}
                            accentColor={colors.dark}
                          />
                        </div>

                        {/* Topic pills */}
                        <div className="px-5 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2">
                            Key Concepts
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {LEVEL_TOPICS[level].map(topic => (
                              <span
                                key={topic.label}
                                className="text-[12px] font-medium px-3 py-1.5 rounded-md"
                                style={{ backgroundColor: `${colors.accent}33`, color: '#2D3748' }}
                              >
                                {topic.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Artifact link — prominent button with level color */}
                        <div
                          className="px-5 py-4 flex items-center justify-between"
                          style={{ borderTop: '1px solid #E2E8F0', backgroundColor: `${colors.accent}10` }}
                        >
                          <p className="text-xs text-[#718096]">
                            Try the interactive tool for this level
                          </p>
                          <a
                            href={getLevelHref(level)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: colors.dark }}
                          >
                            {getLevelToolName(level)}
                            <ChevronRight size={14} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Section */}
        {pathwayResults && levelDepths && !isLoading && (
          <div ref={resultsRef} className="py-16">

            {/* Pathway Header */}
            <div
              className="mb-8"
              style={prefersReducedMotion ? {} : { animation: 'fadeInUp 500ms ease forwards' }}
            >
              <h2 className="text-2xl font-bold text-[#1A202C] mb-3">Your Learning Pathway</h2>
              <p className="text-sm text-[#4A5568] leading-relaxed max-w-3xl mb-6 italic">
                {pathwayResults.pathwaySummary}
              </p>

              {/* Summary Bar */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {[1, 2, 3, 4, 5].map(level => {
                  const key = `L${level}`;
                  const depth = levelDepths[key];
                  const colors = LEVEL_COLORS[level];

                  if (depth === 'full') {
                    return (
                      <span key={key} className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: colors.dark }}>
                        L{level}: Full
                      </span>
                    );
                  }
                  if (depth === 'fast-track') {
                    return (
                      <span key={key} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ border: `1.5px solid ${colors.dark}`, color: colors.dark }}>
                        L{level}: Fast-track
                      </span>
                    );
                  }
                  if (depth === 'awareness') {
                    return (
                      <span key={key} className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#F7FAFC] text-[#A0AEC0]" style={{ border: '1px solid #E2E8F0' }}>
                        L{level}: Awareness
                      </span>
                    );
                  }
                  return (
                    <span key={key} className="text-xs font-bold px-3 py-1.5 rounded-full text-[#CBD5E0] line-through" style={{ border: '1px dashed #E2E8F0' }}>
                      L{level}: Skip
                    </span>
                  );
                })}

                <span className="ml-auto text-xs text-[#A0AEC0]">
                  ~{pathwayResults.totalEstimatedWeeks} weeks at {formData.availability}/week
                </span>
              </div>
            </div>

            {/* Export Action Bar — includes Start Over on same line */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6"
              style={{ borderBottom: '1px solid #E2E8F0' }}
            >
              <p className="text-lg font-bold text-[#1A202C]">Your Pathway Plan</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                  style={{ border: '1px solid #E2E8F0', color: '#4A5568' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT_DARK; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#4A5568'; }}
                >
                  <RotateCcw size={13} />
                  Start Over
                </button>

                <span className="w-px h-5 bg-[#E2E8F0] hidden sm:block" />

                <button
                  onClick={() => copyToClipboard(
                    generateTextExport(formData, pathwayResults, levelDepths),
                    'Copied as text', 'text',
                  )}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                  style={{ border: '1px solid #E2E8F0', color: '#4A5568' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT_DARK; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#4A5568'; }}
                >
                  {copiedId === 'text' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === 'text' ? 'Copied!' : 'Copy as Text'}
                </button>

                <button
                  onClick={() => copyToClipboard(
                    generateMarkdownExport(formData, pathwayResults, levelDepths),
                    'Copied as Markdown', 'markdown',
                  )}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                  style={{ border: '1px solid #E2E8F0', color: '#4A5568' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT_DARK; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#4A5568'; }}
                >
                  {copiedId === 'markdown' ? <Check size={14} /> : <FileText size={14} />}
                  {copiedId === 'markdown' ? 'Copied!' : 'Copy as Markdown'}
                </button>

                <button
                  onClick={handleDownloadMd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                  style={{ border: '1px solid #E2E8F0', color: '#4A5568' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT_DARK; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#4A5568'; }}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            {/* Level Cards */}
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((level, idx) => {
                const key = `L${level}`;
                const depth = levelDepths[key];
                const colors = LEVEL_COLORS[level];
                const result = pathwayResults.levels[key] as PathwayLevelResult | undefined;
                const visible = idx < cardsRevealed;
                const isExpanded = expandedResults[key];

                // Skip line
                if (depth === 'skip') {
                  return (
                    <div
                      key={key}
                      className="px-6 py-4 rounded-lg flex items-center justify-between gap-4"
                      style={{
                        border: '1px dashed #E2E8F0', backgroundColor: '#FAFAFA',
                        opacity: visible ? 1 : 0,
                        transition: prefersReducedMotion ? 'none' : 'opacity 300ms ease',
                      }}
                    >
                      <p className="text-sm text-[#A0AEC0]">
                        <span className="font-semibold">Level {level}: {colors.name}</span>
                        {' '}&mdash; Not part of your current pathway
                      </p>
                      <a
                        href={getLevelHref(level)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-colors"
                        style={{ border: `1px solid ${colors.accent}`, color: colors.dark }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${colors.accent}20`; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        Explore {getLevelToolName(level)}
                        <ChevronRight size={12} />
                      </a>
                    </div>
                  );
                }

                // Awareness card
                if (depth === 'awareness') {
                  return (
                    <div
                      key={key}
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: '1px solid #E2E8F0', borderLeft: `4px solid ${colors.accent}`,
                        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
                        transition: prefersReducedMotion ? 'none' : 'opacity 400ms ease, transform 400ms ease',
                      }}
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-full" style={{ backgroundColor: `${colors.accent}33`, color: '#2D3748' }}>
                            Level {String(level).padStart(2, '0')} &mdash; {colors.name}
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F7FAFC] text-[#A0AEC0]" style={{ border: '1px solid #E2E8F0' }}>
                            Awareness
                          </span>
                        </div>
                        <p className="text-sm text-[#4A5568] leading-relaxed mb-4">
                          You don&rsquo;t need a full project at this level, but understanding these concepts will
                          strengthen your work at higher levels. Explore when you&rsquo;re curious.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {LEVEL_TOPICS[level].map(topic => (
                            <span key={topic.label} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ backgroundColor: `${colors.accent}33`, color: '#2D3748' }}>
                              {topic.label}
                            </span>
                          ))}
                        </div>
                        <a
                          href={getLevelHref(level)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: colors.dark }}
                        >
                          Try {getLevelToolName(level)}
                          <ChevronRight size={14} />
                        </a>
                      </div>
                    </div>
                  );
                }

                // Full or Fast-track card — collapsed/expandable
                if (!result) return null;

                return (
                  <div
                    key={key}
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: '1px solid #E2E8F0', borderLeft: `4px solid ${colors.accent}`,
                      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
                      transition: prefersReducedMotion ? 'none' : 'opacity 400ms ease, transform 400ms ease',
                    }}
                  >
                    {/* Section 1: Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-full" style={{ backgroundColor: `${colors.accent}33`, color: '#2D3748' }}>
                          Level {String(level).padStart(2, '0')} &mdash; {colors.name}
                        </span>
                        {depth === 'full' ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                            Full Program
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ border: `1px solid ${ACCENT}`, color: ACCENT }}>
                            Fast-track
                          </span>
                        )}
                        <span className="ml-auto text-xs text-[#A0AEC0]">
                          ~{getTimeEstimate(depth, formData.availability)} at {formData.availability}/week
                        </span>
                      </div>
                    </div>

                    {/* Section 2: Your Project — emphasized */}
                    <div className="mx-6 mb-5 rounded-lg p-4" style={{ backgroundColor: `${colors.accent}0D`, border: `1px solid ${colors.accent}25` }}>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.dark }}>Your Project</p>
                      <h4 className="text-lg font-bold text-[#1A202C] mb-2">{result.projectTitle}</h4>
                      <p className="text-sm text-[#4A5568] leading-relaxed mb-3">{result.projectDescription}</p>
                      <p className="text-xs">
                        <span className="font-bold text-[#1A202C]">Deliverable: </span>
                        <span className="text-[#4A5568]">{result.deliverable}</span>
                      </p>
                    </div>

                    {/* Section 3: Challenge Connection */}
                    <div className="px-6 py-4" style={{ backgroundColor: '#F0FFFC', borderTop: '1px solid #E2E8F0' }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Link2 size={16} style={{ color: ACCENT }} />
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
                          How This Connects to Your Challenge
                        </p>
                      </div>
                      <p className="text-sm italic leading-relaxed" style={{ color: '#2C7A6E' }}>
                        {result.challengeConnection}
                      </p>
                    </div>

                    {/* Expand/Collapse toggle — more prominent */}
                    <button
                      onClick={() => toggleResultExpand(key)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold transition-colors"
                      style={{
                        borderTop: '1px solid #E2E8F0',
                        color: colors.dark,
                        backgroundColor: isExpanded ? 'transparent' : `${colors.accent}08`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${colors.accent}15`; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isExpanded ? 'transparent' : `${colors.accent}08`; }}
                    >
                      {isExpanded ? (
                        <>Show less <ChevronUp size={16} /></>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          Key concepts, learning approach &amp; resources
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>

                    {/* Expandable sections */}
                    {isExpanded && (
                      <>
                        {/* Key Concepts */}
                        <div className="px-6 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2">Key Concepts</p>
                          <div className="flex flex-wrap gap-2">
                            {LEVEL_TOPICS[level].map(topic => (
                              <span key={topic.label} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ backgroundColor: `${colors.accent}33`, color: '#2D3748' }}>
                                {topic.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 70-20-10 Learning Approach */}
                        <div className="px-6 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-1">
                            Learning Approach &mdash; 70-20-10 Model
                          </p>
                          <LearningBreakdown
                            applied={DEFAULT_LEVEL_CONTENT[level].learningBreakdown.applied}
                            community={DEFAULT_LEVEL_CONTENT[level].learningBreakdown.community}
                            individual={DEFAULT_LEVEL_CONTENT[level].learningBreakdown.individual}
                            accentColor={colors.dark}
                          />
                        </div>

                        {/* Recommended Format + Resources */}
                        <div className="px-6 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2">Recommended Format</p>
                              <p className="text-sm text-[#4A5568]">{result.sessionFormat}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2">Where to Learn More</p>
                              <div className="space-y-1.5">
                                {result.resources.map((resource, ri) => (
                                  <div key={ri} className="flex gap-2 items-start">
                                    <span className="text-[10px] mt-1.5 flex-shrink-0" style={{ color: colors.dark }}>{'\u25CF'}</span>
                                    <p className="text-sm text-[#4A5568]">
                                      <span className="font-semibold">{resource.name}</span>
                                      {' '}&mdash; {resource.note}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Artifact link — prominent button with level color */}
                        <div
                          className="px-6 py-4 flex items-center justify-between"
                          style={{ borderTop: '1px solid #E2E8F0', backgroundColor: `${colors.accent}10` }}
                        >
                          <p className="text-xs text-[#718096]">
                            Try the interactive tool for this level
                          </p>
                          <a
                            href={getLevelHref(level)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: colors.dark }}
                          >
                            {getLevelToolName(level)}
                            <ChevronRight size={14} />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Artifact Closing — shown after results OR default preview */}
        {!isLoading && (
          <ArtifactClosing
            summaryText={
              pathwayResults
                ? "You\u2019ve mapped your personalized learning pathway \u2014 a project-based plan built around your role, your experience level, and your real work challenges."
                : undefined
            }
            ctaLabel="Explore All Five Levels"
            ctaHref="#"
            accentColor={ACCENT_DARK}
            ctaScrollTo="journey"
          />
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white text-[14px] px-5 py-2.5 rounded-lg shadow-lg z-50 whitespace-nowrap"
          style={{ animation: prefersReducedMotion ? 'none' : 'fadeInUp 300ms ease' }}
        >
          {toastMessage} &#10003;
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 300ms ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
