/**
 * S-Tier scoring system for project proof submissions.
 * Maps the 4 review dimensions to a points-based tier grade.
 * Tier is determined purely by points — no overrides.
 */

export type Tier = 'S' | 'A' | 'B' | 'C' | 'R';

export interface TierInfo {
  tier: Tier;
  label: string;
  points: number;
  maxPoints: number;
  color: string;        // badge bg
  darkColor: string;    // badge text / accent
  nextTier: Tier | null;
  pointsToNext: number; // how many more points for next tier
}

const POINTS: Record<string, number> = {
  strong: 3,
  developing: 2,
  needs_attention: 1,
};

const TIER_MAP: { minPoints: number; tier: Tier; label: string; color: string; darkColor: string }[] = [
  { minPoints: 12, tier: 'S', label: 'Exceptional', color: '#FEF3C7', darkColor: '#92400E' },
  { minPoints: 10, tier: 'A', label: 'Excellent', color: '#D1FAE5', darkColor: '#065F46' },
  { minPoints: 8,  tier: 'B', label: 'Strong foundation', color: '#DBEAFE', darkColor: '#1E40AF' },
  { minPoints: 6,  tier: 'C', label: 'Good start', color: '#F3F4F6', darkColor: '#374151' },
  { minPoints: 0,  tier: 'R', label: 'Keep going', color: '#FEE2E2', darkColor: '#991B1B' },
];

export function calculateTier(
  dimensions: { status: 'strong' | 'developing' | 'needs_attention' }[],
): TierInfo {
  const maxPoints = dimensions.length * 3;
  const points = dimensions.reduce((sum, d) => sum + (POINTS[d.status] || 0), 0);

  // Tier is purely points-based
  let tierEntry = TIER_MAP[TIER_MAP.length - 1];
  for (const t of TIER_MAP) {
    if (points >= t.minPoints) {
      tierEntry = t;
      break;
    }
  }

  // Calculate points to next tier
  let nextTier: Tier | null = null;
  let pointsToNext = 0;
  if (tierEntry.tier !== 'S') {
    const currentIdx = TIER_MAP.findIndex(t => t.tier === tierEntry.tier);
    if (currentIdx > 0) {
      const next = TIER_MAP[currentIdx - 1];
      nextTier = next.tier;
      pointsToNext = next.minPoints - points;
    }
  }

  return {
    tier: tierEntry.tier,
    label: tierEntry.label,
    points,
    maxPoints,
    color: tierEntry.color,
    darkColor: tierEntry.darkColor,
    nextTier,
    pointsToNext,
  };
}

/** Whether this tier requires revision (cannot be confirmed) */
export function requiresRevision(tier: Tier): boolean {
  return tier === 'R';
}

/**
 * Returns a short description of what would improve the tier.
 */
export function getImprovementHint(
  dimensions: { id: string; name: string; status: 'strong' | 'developing' | 'needs_attention' }[],
  tierInfo: TierInfo,
): string | null {
  if (tierInfo.tier === 'S') return null;

  const developing = dimensions.filter(d => d.status === 'developing');
  const needsAttention = dimensions.filter(d => d.status === 'needs_attention');

  if (needsAttention.length > 0) {
    const names = needsAttention.map(d => d.name).join(' and ');
    return `Address the feedback on ${names} to improve your score.`;
  }

  if (developing.length > 0 && tierInfo.nextTier) {
    if (developing.length === 1) {
      return `Strengthen your ${developing[0].name.toLowerCase()} to reach ${tierInfo.nextTier} tier.`;
    }
    return `Deepen ${developing.length} areas to reach ${tierInfo.nextTier} tier — the reviewer feedback above shows exactly what to add.`;
  }

  return null;
}
