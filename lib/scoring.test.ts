/**
 * Tests for the school-grade scoring system (A+/A/B+/B/C).
 * Run with: npx tsx lib/scoring.test.ts
 * Expected: 66 passed, 0 failed.
 */

import { calculateTier, requiresRevision, getImprovementHint } from './scoring';
import type { Tier, TierInfo } from './scoring';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function eq<T>(actual: T, expected: T, message: string) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ─── Helper: build dimensions array ───

type Status = 'strong' | 'developing' | 'needs_attention';

function dims(...statuses: Status[]) {
  return statuses.map((status, i) => ({
    id: `dim_${i}`,
    name: `Dimension ${i + 1}`,
    status,
  }));
}

// ═══════════════════════════════════════════════
// 1. Tier type values
// ═══════════════════════════════════════════════
console.log('\n── Tier type values ──');

const validTiers: Tier[] = ['A+', 'A', 'B+', 'B', 'C'];
for (const t of validTiers) {
  assert(typeof t === 'string', `Tier '${t}' is a valid string`);
}

// ═══════════════════════════════════════════════
// 2. calculateTier — all strong (12/12 → A+)
// ═══════════════════════════════════════════════
console.log('── calculateTier: all strong → A+ ──');

const allStrong = calculateTier(dims('strong', 'strong', 'strong', 'strong'));
eq(allStrong.tier, 'A+', 'all strong → A+');
eq(allStrong.label, 'Exceptional', 'A+ label');
eq(allStrong.points, 12, 'A+ points = 12');
eq(allStrong.maxPoints, 12, 'maxPoints = 12');
eq(allStrong.color, '#FEF3C7', 'A+ color (gold)');
eq(allStrong.darkColor, '#92400E', 'A+ darkColor');
eq(allStrong.nextTier, null, 'A+ has no next tier');
eq(allStrong.pointsToNext, 0, 'A+ pointsToNext = 0');

// ═══════════════════════════════════════════════
// 3. calculateTier — 3 strong + 1 developing (11/12 → A)
// ═══════════════════════════════════════════════
console.log('── calculateTier: 11 pts → A ──');

const elevenPts = calculateTier(dims('strong', 'strong', 'strong', 'developing'));
eq(elevenPts.tier, 'A', '11 pts → A');
eq(elevenPts.label, 'Excellent', 'A label');
eq(elevenPts.points, 11, 'A points = 11');
eq(elevenPts.color, '#D1FAE5', 'A color (green)');
eq(elevenPts.darkColor, '#065F46', 'A darkColor');
eq(elevenPts.nextTier, 'A+', 'A next tier = A+');
eq(elevenPts.pointsToNext, 1, 'A pointsToNext = 1');

// ═══════════════════════════════════════════════
// 4. calculateTier — 10 pts boundary → A
// ═══════════════════════════════════════════════
console.log('── calculateTier: 10 pts boundary → A ──');

const tenPts = calculateTier(dims('strong', 'strong', 'developing', 'developing'));
eq(tenPts.tier, 'A', '10 pts → A');
eq(tenPts.points, 10, 'boundary points = 10');
eq(tenPts.pointsToNext, 2, 'A at 10 pts → 2 to A+');

// ═══════════════════════════════════════════════
// 5. calculateTier — 9 pts → B+
// ═══════════════════════════════════════════════
console.log('── calculateTier: 9 pts → B+ ──');

const ninePts = calculateTier(dims('strong', 'strong', 'developing', 'needs_attention'));
eq(ninePts.tier, 'B+', '9 pts → B+');
eq(ninePts.label, 'Strong foundation', 'B+ label');
eq(ninePts.points, 9, 'B+ points = 9');
eq(ninePts.color, '#DBEAFE', 'B+ color (blue)');
eq(ninePts.darkColor, '#1E40AF', 'B+ darkColor');
eq(ninePts.nextTier, 'A', 'B+ next tier = A');
eq(ninePts.pointsToNext, 1, 'B+ at 9 → 1 to A');

// ═══════════════════════════════════════════════
// 6. calculateTier — 8 pts boundary → B+
// ═══════════════════════════════════════════════
console.log('── calculateTier: 8 pts boundary → B+ ──');

const eightPts = calculateTier(dims('strong', 'developing', 'developing', 'needs_attention'));
eq(eightPts.tier, 'B+', '8 pts → B+');
eq(eightPts.points, 8, 'boundary points = 8');

// ═══════════════════════════════════════════════
// 7. calculateTier — 7 pts → B
// ═══════════════════════════════════════════════
console.log('── calculateTier: 7 pts → B ──');

const sevenPts = calculateTier(dims('strong', 'developing', 'needs_attention', 'needs_attention'));
eq(sevenPts.tier, 'B', '7 pts → B');
eq(sevenPts.label, 'Good start', 'B label');
eq(sevenPts.points, 7, 'B points = 7');
eq(sevenPts.color, '#F3F4F6', 'B color (gray)');
eq(sevenPts.darkColor, '#374151', 'B darkColor');
eq(sevenPts.nextTier, 'B+', 'B next tier = B+');
eq(sevenPts.pointsToNext, 1, 'B at 7 → 1 to B+');

// ═══════════════════════════════════════════════
// 8. calculateTier — 6 pts boundary → B
// ═══════════════════════════════════════════════
console.log('── calculateTier: 6 pts boundary → B ──');

const sixPts = calculateTier(dims('developing', 'developing', 'needs_attention', 'needs_attention'));
eq(sixPts.tier, 'B', '6 pts → B');
eq(sixPts.points, 6, 'boundary points = 6');

// ═══════════════════════════════════════════════
// 9. calculateTier — 5 pts → C
// ═══════════════════════════════════════════════
console.log('── calculateTier: 5 pts → C ──');

const fivePts = calculateTier(dims('developing', 'needs_attention', 'needs_attention', 'needs_attention'));
eq(fivePts.tier, 'C', '5 pts → C');
eq(fivePts.label, 'Needs improvement', 'C label');
eq(fivePts.points, 5, 'C points = 5');
eq(fivePts.color, '#FEE2E2', 'C color (red)');
eq(fivePts.darkColor, '#991B1B', 'C darkColor');
eq(fivePts.nextTier, 'B', 'C next tier = B');
eq(fivePts.pointsToNext, 1, 'C at 5 → 1 to B');

// ═══════════════════════════════════════════════
// 10. calculateTier — all needs_attention (4/12 → C)
// ═══════════════════════════════════════════════
console.log('── calculateTier: all needs_attention → C ──');

const allNA = calculateTier(dims('needs_attention', 'needs_attention', 'needs_attention', 'needs_attention'));
eq(allNA.tier, 'C', 'all needs_attention → C');
eq(allNA.points, 4, 'all NA points = 4');
eq(allNA.pointsToNext, 2, 'C at 4 → 2 to B');

// ═══════════════════════════════════════════════
// 11. requiresRevision
// ═══════════════════════════════════════════════
console.log('── requiresRevision ──');

eq(requiresRevision('C'), true, 'C requires revision');
eq(requiresRevision('B'), false, 'B does not require revision');
eq(requiresRevision('B+'), false, 'B+ does not require revision');
eq(requiresRevision('A'), false, 'A does not require revision');
eq(requiresRevision('A+'), false, 'A+ does not require revision');

// ═══════════════════════════════════════════════
// 12. getImprovementHint — A+ returns null
// ═══════════════════════════════════════════════
console.log('── getImprovementHint ──');

const aPlusDims = dims('strong', 'strong', 'strong', 'strong');
const aPlusTier = calculateTier(aPlusDims);
eq(getImprovementHint(aPlusDims, aPlusTier), null, 'A+ → no hint');

// ═══════════════════════════════════════════════
// 13. getImprovementHint — needs_attention present
// ═══════════════════════════════════════════════
console.log('── getImprovementHint: needs_attention ──');

const mixedDims = dims('strong', 'strong', 'developing', 'needs_attention');
const mixedTier = calculateTier(mixedDims);
const mixedHint = getImprovementHint(mixedDims, mixedTier);
assert(mixedHint !== null, 'B+ with needs_attention → has hint');
assert(mixedHint!.includes('Address the feedback'), 'hint mentions addressing feedback');
assert(mixedHint!.includes('Dimension 4'), 'hint mentions the needs_attention dimension');

// ═══════════════════════════════════════════════
// 14. getImprovementHint — developing only (single)
// ═══════════════════════════════════════════════
console.log('── getImprovementHint: single developing ──');

const singleDevDims = dims('strong', 'strong', 'strong', 'developing');
const singleDevTier = calculateTier(singleDevDims);
const singleDevHint = getImprovementHint(singleDevDims, singleDevTier);
assert(singleDevHint !== null, 'A with 1 developing → has hint');
assert(singleDevHint!.includes('Strengthen'), 'single developing hint says Strengthen');
assert(singleDevHint!.includes('A+'), 'single developing hint mentions next tier A+');

// ═══════════════════════════════════════════════
// 15. getImprovementHint — developing only (multiple)
// ═══════════════════════════════════════════════
console.log('── getImprovementHint: multiple developing ──');

const multiDevDims = dims('strong', 'strong', 'developing', 'developing');
const multiDevTier = calculateTier(multiDevDims);
const multiDevHint = getImprovementHint(multiDevDims, multiDevTier);
assert(multiDevHint !== null, 'A with 2 developing → has hint');
assert(multiDevHint!.includes('Deepen 2 areas'), 'multiple developing hint says Deepen N areas');
assert(multiDevHint!.includes('A+'), 'multiple developing hint mentions next tier A+');

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(40)}\n`);

if (failed > 0) process.exit(1);
