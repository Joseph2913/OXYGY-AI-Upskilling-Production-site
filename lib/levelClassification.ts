import type { LevelDepth } from '../types';

// Shared with components/app/journey/OnboardingSurvey.tsx — the depth matrix and
// persona rule must stay identical wherever a learning plan is generated
// (initial onboarding, or an admin regenerating a plan after editing answers).

type DepthMatrix = Record<string, Record<string, [LevelDepth, LevelDepth, LevelDepth, LevelDepth, LevelDepth]>>;

export const DEPTH_MATRIX: DepthMatrix = {
  'beginner': {
    'confident-daily-use': ['full', 'full', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['full', 'full', 'awareness', 'skip', 'skip'],
    'own-ai-processes': ['full', 'full', 'full', 'awareness', 'skip'],
    'build-full-apps': ['full', 'full', 'full', 'full', 'full'],
    'lead-ai-strategy': ['full', 'full', 'full', 'full', 'full'],
  },
  'comfortable-user': {
    'confident-daily-use': ['fast-track', 'full', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'full', 'full', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'full', 'full', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'full', 'full', 'full', 'full'],
    'lead-ai-strategy': ['fast-track', 'full', 'full', 'full', 'full'],
  },
  'builder': {
    'confident-daily-use': ['fast-track', 'fast-track', 'skip', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'fast-track', 'full', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'fast-track', 'full', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'fast-track', 'full', 'full', 'full'],
    'lead-ai-strategy': ['fast-track', 'fast-track', 'full', 'full', 'full'],
  },
  'integrator': {
    'confident-daily-use': ['fast-track', 'fast-track', 'fast-track', 'skip', 'skip'],
    'build-reusable-tools': ['fast-track', 'fast-track', 'fast-track', 'skip', 'skip'],
    'own-ai-processes': ['fast-track', 'fast-track', 'fast-track', 'full', 'skip'],
    'build-full-apps': ['fast-track', 'fast-track', 'fast-track', 'full', 'full'],
    'lead-ai-strategy': ['fast-track', 'fast-track', 'fast-track', 'full', 'full'],
  },
};

const AMBITION_RANK: Record<string, number> = {
  'confident-daily-use': 1,
  'build-reusable-tools': 2,
  'own-ai-processes': 3,
  'build-full-apps': 4,
  'lead-ai-strategy': 5,
};

export function classifyLevels(aiExperience: string, ambitions: string[]): Record<string, LevelDepth> {
  const highest = [...ambitions].sort((a, b) => (AMBITION_RANK[b] || 0) - (AMBITION_RANK[a] || 0))[0] || 'confident-daily-use';
  const depths = DEPTH_MATRIX[aiExperience]?.[highest] || ['full', 'full', 'full', 'full', 'full'];
  return { L1: depths[0], L2: depths[1], L3: depths[2], L4: depths[3], L5: depths[4] };
}

export function derivePersona(seniority: string, ambitions: string[]): 'strategic-leader' | 'practitioner' {
  const isStrategicLeader =
    (seniority?.includes('Senior') || seniority?.includes('Director')) &&
    ambitions.includes('lead-ai-strategy');
  return isStrategicLeader ? 'strategic-leader' : 'practitioner';
}
