/**
 * Demo data used by all hooks when the product tour is active.
 * Generic, non-sensitive data that shows a realistic but standardised
 * view of the platform to first-time users.
 */

import type { DashboardData, LeaderboardMember, LevelProgress as DashboardLevelProgress, ToolUsage } from '../hooks/useDashboardData';
import type { JourneyData, LevelProgress as JourneyLevelProgress } from '../hooks/useJourneyData';
import type { LevelData, TopicProgress } from '../hooks/useLevelData';
import type { ToolkitData, ToolLevelStats } from '../hooks/useToolkitData';
import type { Artefact } from '../hooks/useArtefactsData';
import type { PlaygroundResult } from '../types';

/* ─── Dashboard Demo ─── */

const DEMO_LEADERBOARD: LeaderboardMember[] = [
  { name: 'Alex Morgan', initials: 'AM', avatarColor: '#38B2AC', level: 2, score: 2450, completionPct: 42, streakDays: 7, useCasesIdentified: 0, assessmentAvg: 0, isCurrentUser: false, artefactCount: 8, activeDays30: 14 },
  { name: 'Sam Rivera', initials: 'SR', avatarColor: '#5B6DC2', level: 2, score: 2100, completionPct: 35, streakDays: 5, useCasesIdentified: 0, assessmentAvg: 0, isCurrentUser: false, artefactCount: 6, activeDays30: 11 },
  { name: 'Demo User', initials: 'DU', avatarColor: '#38B2AC', level: 1, score: 1200, completionPct: 20, streakDays: 3, useCasesIdentified: 0, assessmentAvg: 0, isCurrentUser: true, artefactCount: 3, activeDays30: 7 },
  { name: 'Jordan Lee', initials: 'JL', avatarColor: '#D97B4A', level: 1, score: 950, completionPct: 15, streakDays: 2, useCasesIdentified: 0, assessmentAvg: 0, isCurrentUser: false, artefactCount: 2, activeDays30: 5 },
  { name: 'Taylor Chen', initials: 'TC', avatarColor: '#C4A934', level: 1, score: 600, completionPct: 10, streakDays: 1, useCasesIdentified: 0, assessmentAvg: 0, isCurrentUser: false, artefactCount: 1, activeDays30: 3 },
];

const DEMO_LEVEL_PROGRESS: Record<number, DashboardLevelProgress> = {
  1: { level: 1, phasesCompleted: [true, false, false, false], artefactCount: 3 },
  2: { level: 2, phasesCompleted: [false, false, false, false], artefactCount: 0 },
  3: { level: 3, phasesCompleted: [false, false, false, false], artefactCount: 0 },
  4: { level: 4, phasesCompleted: [false, false, false, false], artefactCount: 0 },
  5: { level: 5, phasesCompleted: [false, false, false, false], artefactCount: 0 },
};

const DEMO_TOOL_USAGE: Record<string, ToolUsage> = {
  'prompt-playground': { toolId: 'prompt-playground', artefactsCreated: 3, lastUsedAt: new Date() },
  'agent-builder': { toolId: 'agent-builder', artefactsCreated: 0, lastUsedAt: null },
  'workflow-canvas': { toolId: 'workflow-canvas', artefactsCreated: 0, lastUsedAt: null },
  'dashboard-designer': { toolId: 'dashboard-designer', artefactsCreated: 0, lastUsedAt: null },
  'ai-app-evaluator': { toolId: 'ai-app-evaluator', artefactsCreated: 0, lastUsedAt: null },
};

export const DEMO_DASHBOARD_DATA: DashboardData = {
  currentLevel: 1,
  completedTopics: 0,
  totalTopics: 1,
  activeTopicIndex: 0,
  currentSlide: 5,
  totalSlides: 13,
  currentPhase: 1,

  overallCompletedTopics: 0,
  overallTotalTopics: 5,
  levelsCompleted: 0,

  overallCompletedPhases: 0,
  overallTotalPhases: 15,
  levelPhaseCompletion: {
    1: { elearn: false, toolkit: false, project: false },
    2: { elearn: false, toolkit: false, project: false },
    3: { elearn: false, toolkit: false, project: false },
    4: { elearn: false, toolkit: false, project: false },
    5: { elearn: false, toolkit: false, project: false },
  },

  levelProgress: DEMO_LEVEL_PROGRESS,
  toolUsage: DEMO_TOOL_USAGE,

  projectSubmissions: {},
  levelDepths: {},

  streakDays: 3,
  activeDaysThisWeek: [true, true, true, false, false, false, false],

  leaderboard: DEMO_LEADERBOARD,
  activeColleaguesCount: 5,
  sameLevelColleaguesCount: 3,

  lastActivityAt: new Date(),
  unlockedToolIds: ['prompt-playground', 'prompt-library', 'learning-coach'],
  assignedLevels: new Set([1, 2, 3, 4, 5]),
  completedLevelSet: new Set<number>(),
  artefactBreakdown: { coach: {}, toolkit: {}, project: {} },
};


/* ─── Journey Demo ─── */

export const DEMO_JOURNEY_DATA: JourneyData = {
  levels: [
    {
      levelNumber: 1,
      status: 'active',
      completedTopics: 0,
      totalTopics: 1,
      completedAt: null,
      artefactsCreated: 3,
      toolsUnlocked: 2,
      activeTopicIndex: 0,
      currentSlide: 5,
      currentPhase: 1,
      toolUsed: false,
      workshopAttended: false,
      projectCompleted: false,
      projectSubmission: null,
      isAssigned: true,
      topicPhases: [
        { topicId: 1, topicTitle: 'Prompt Engineering', elearnDone: false, toolkitDone: false, projectDone: false, isLocked: false },
      ],
    },
    {
      levelNumber: 2,
      status: 'not-started',
      completedTopics: 0,
      totalTopics: 1,
      completedAt: null,
      artefactsCreated: 0,
      toolsUnlocked: 1,
      activeTopicIndex: 0,
      currentSlide: 0,
      currentPhase: 1,
      toolUsed: false,
      workshopAttended: false,
      projectCompleted: false,
      projectSubmission: null,
      isAssigned: true,
      topicPhases: [
        { topicId: 1, topicTitle: 'From Prompts to Reusable Tools', elearnDone: false, toolkitDone: false, projectDone: false, isLocked: true },
      ],
    },
    {
      levelNumber: 3,
      status: 'not-started',
      completedTopics: 0,
      totalTopics: 1,
      completedAt: null,
      artefactsCreated: 0,
      toolsUnlocked: 1,
      activeTopicIndex: 0,
      currentSlide: 0,
      currentPhase: 1,
      toolUsed: false,
      workshopAttended: false,
      projectCompleted: false,
      projectSubmission: null,
      isAssigned: true,
      topicPhases: [
        { topicId: 1, topicTitle: 'Multi-Step AI Workflows', elearnDone: false, toolkitDone: false, projectDone: false, isLocked: true },
      ],
    },
    {
      levelNumber: 4,
      status: 'not-started',
      completedTopics: 0,
      totalTopics: 1,
      completedAt: null,
      artefactsCreated: 0,
      toolsUnlocked: 1,
      activeTopicIndex: 0,
      currentSlide: 0,
      currentPhase: 1,
      toolUsed: false,
      workshopAttended: false,
      projectCompleted: false,
      projectSubmission: null,
      isAssigned: true,
      topicPhases: [
        { topicId: 1, topicTitle: 'AI-Powered Dashboards', elearnDone: false, toolkitDone: false, projectDone: false, isLocked: true },
      ],
    },
    {
      levelNumber: 5,
      status: 'not-started',
      completedTopics: 0,
      totalTopics: 1,
      completedAt: null,
      artefactsCreated: 0,
      toolsUnlocked: 1,
      activeTopicIndex: 0,
      currentSlide: 0,
      currentPhase: 1,
      toolUsed: false,
      workshopAttended: false,
      projectCompleted: false,
      projectSubmission: null,
      isAssigned: true,
      topicPhases: [
        { topicId: 1, topicTitle: 'Full-Stack AI Applications', elearnDone: false, toolkitDone: false, projectDone: false, isLocked: true },
      ],
    },
  ],
  completedLevelsCount: 0,
};


/* ─── Level Data Demo (Level 1, Topic 1) ─── */

export const DEMO_LEVEL_DATA: LevelData = {
  topicProgress: [
    {
      topicId: 1,
      phase: 1,
      slide: 1,
      completedAt: null,
      phaseCompletions: [false, false, false],
      visitedSlides: new Set([1]),
      elearnCompletedAt: null,
      toolkitCompletedAt: null,
    },
  ],
  activeTopicId: 1,
};


/* ─── Toolkit Demo ─── */

export const DEMO_TOOLKIT_DATA: ToolkitData = {
  currentLevel: 1,
  totalArtefacts: 3,
  totalPoints: 450,
  totalUsage: 3,
  levelStats: [
    { levelNumber: 1, toolId: 'prompt-playground', artefactsCreated: 3, pointsEarned: 450, timesUsed: 3, unlocked: true, toolkitCompleted: false, isAssigned: true },
    { levelNumber: 2, toolId: 'agent-builder', artefactsCreated: 0, pointsEarned: 0, timesUsed: 0, unlocked: false, toolkitCompleted: false, isAssigned: true },
    { levelNumber: 3, toolId: 'workflow-canvas', artefactsCreated: 0, pointsEarned: 0, timesUsed: 0, unlocked: false, toolkitCompleted: false, isAssigned: true },
    { levelNumber: 4, toolId: 'dashboard-designer', artefactsCreated: 0, pointsEarned: 0, timesUsed: 0, unlocked: false, toolkitCompleted: false, isAssigned: true },
    { levelNumber: 5, toolId: 'ai-app-evaluator', artefactsCreated: 0, pointsEarned: 0, timesUsed: 0, unlocked: false, toolkitCompleted: false, isAssigned: true },
  ],
};


/* ─── Artefacts Demo ─── */

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

export const DEMO_ARTEFACTS: Artefact[] = [
  { id: 'demo-1', name: 'Weekly team update prompt', type: 'prompt' as any, level: 1, preview: 'A structured prompt for generating concise weekly status updates for cross-functional teams.', createdAt: daysAgo(2), updatedAt: daysAgo(1), lastOpenedAt: daysAgo(1) },
  { id: 'demo-2', name: 'Client briefing prompt', type: 'prompt' as any, level: 1, preview: 'Transforms rough notes into a polished client-ready briefing document with key highlights and next steps.', createdAt: daysAgo(5), updatedAt: daysAgo(3), lastOpenedAt: daysAgo(3) },
  { id: 'demo-3', name: 'Meeting summary prompt', type: 'prompt' as any, level: 1, preview: 'Extracts action items, decisions, and owners from meeting transcripts in a clean, scannable format.', createdAt: daysAgo(7), updatedAt: daysAgo(7), lastOpenedAt: daysAgo(4) },
];


/* ─── Prompt Playground Demo Result ─── */

export const DEMO_PLAYGROUND_RESULT: PlaygroundResult = {
  prompt: `You are a senior project manager at a consulting firm. You communicate in a concise, action-oriented style.

## Context
I need to draft a weekly status update email for my cross-functional project team. The project is a digital transformation initiative with 3 active workstreams: data migration, UX redesign, and API integration. We are in week 6 of a 12-week timeline.

## Task
Generate a professional weekly status update email that:
1. Opens with a one-line executive summary of overall project health
2. Breaks down progress by workstream (data migration, UX redesign, API integration)
3. Highlights 2–3 key wins from this week
4. Flags any blockers or risks with proposed mitigations
5. Lists the top 3 priorities for next week
6. Closes with a clear call-to-action for the team

## Format
- Use headers and bullet points for scannability
- Keep total length under 400 words
- Use a professional but approachable tone
- Include a [RAG status] indicator (Green/Amber/Red) per workstream`,

  strategies_used: [
    {
      id: 'PERSONA_EXPERT_ROLE',
      name: 'Role Framing',
      icon: '🎭',
      why: 'Setting a specific professional persona ensures the AI writes with the right authority and communication style.',
      what: 'Assigns a role or persona to the AI to anchor its responses in a specific professional context.',
      how_applied: 'Cast the AI as a "senior project manager at a consulting firm" to ensure executive-level communication.',
      prompt_excerpt: 'You are a senior project manager at a consulting firm. You communicate in a concise, action-oriented style.',
    },
    {
      id: 'OUTPUT_FORMAT_SPECIFICATION',
      name: 'Structured Output',
      icon: '📋',
      why: 'Status updates need consistent formatting so stakeholders can quickly scan for the information they need.',
      what: 'Specifies the exact structure, sections, and formatting the output should follow.',
      how_applied: 'Defined six clear sections (summary, workstreams, wins, blockers, priorities, CTA) with formatting rules.',
      prompt_excerpt: '1. Opens with a one-line executive summary\n2. Breaks down progress by workstream\n3. Highlights 2–3 key wins',
    },
    {
      id: 'CONSTRAINT_FRAMING',
      name: 'Constraint Framing',
      icon: '🔒',
      why: 'Without constraints, status updates tend to balloon in length and lose focus.',
      what: 'Sets boundaries on length, tone, or scope to keep the output focused and useful.',
      how_applied: 'Capped the output at 400 words and specified bullet-point formatting for scannability.',
      prompt_excerpt: 'Keep total length under 400 words\nUse headers and bullet points for scannability',
    },
  ],
  refinement_questions: [
    'What is the current RAG status for each workstream?',
    'Are there any specific blockers you want highlighted?',
    'Who is the primary audience — your team, leadership, or the client?',
  ],
};


/* ─── Cohort Demo (ScoredMember format from database) ─── */

export interface DemoScoredMember {
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  role: string;
  level: number;
  score: number;
  completionPct: number;
  elearnCount: number;
  streakDays: number;
  artefactCount: number;
  activeDays30: number;
  isCurrentUser: boolean;
}

export const DEMO_COHORT_MEMBERS: DemoScoredMember[] = [
  { userId: 'demo-1', fullName: 'Alex Morgan', initials: 'AM', avatarColor: '#38B2AC', role: 'Strategy Consultant', level: 2, score: 2450, completionPct: 42, elearnCount: 3, streakDays: 7, artefactCount: 8, activeDays30: 14, isCurrentUser: false },
  { userId: 'demo-2', fullName: 'Sam Rivera', initials: 'SR', avatarColor: '#5B6DC2', role: 'Senior Analyst', level: 2, score: 2100, completionPct: 35, elearnCount: 2, streakDays: 5, artefactCount: 6, activeDays30: 11, isCurrentUser: false },
  { userId: 'demo-3', fullName: 'Demo User', initials: 'DU', avatarColor: '#38B2AC', role: 'Consultant', level: 1, score: 1200, completionPct: 20, elearnCount: 1, streakDays: 3, artefactCount: 3, activeDays30: 7, isCurrentUser: true },
  { userId: 'demo-4', fullName: 'Jordan Lee', initials: 'JL', avatarColor: '#D97B4A', role: 'Project Manager', level: 1, score: 950, completionPct: 15, elearnCount: 1, streakDays: 2, artefactCount: 2, activeDays30: 5, isCurrentUser: false },
  { userId: 'demo-5', fullName: 'Taylor Chen', initials: 'TC', avatarColor: '#C4A934', role: 'Business Analyst', level: 1, score: 600, completionPct: 10, elearnCount: 1, streakDays: 1, artefactCount: 1, activeDays30: 3, isCurrentUser: false },
];

export const DEMO_WEEKLY_ACTIVITY: number[] = [3, 4, 5, 2, 3, 1, 0];

export const DEMO_WORKSHOP_SESSIONS: Array<{ id: string; level: number; code: string; name: string; date: string | null; active: boolean }> = [
  { id: 'ws-1', level: 1, code: 'WS-L1', name: 'Level 1 Workshop: Prompt Engineering Fundamentals', date: null, active: true },
  { id: 'ws-2', level: 2, code: 'WS-L2', name: 'Level 2 Workshop: Building AI Agents', date: null, active: false },
];
