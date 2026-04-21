// enneagram.ts — scoring engine for Synastra's 36-question Enneagram
// assessment.
//
// Given a set of 1-5 Likert answers keyed by question id, the engine:
//   1. Sums per-type scores (each question maps to one of nine types).
//   2. Chooses the dominant type, then the higher-scoring adjacent type as
//      the wing (wings are only ever the two neighbours on the circle).
//   3. Derives a tritype — one representative from each of the three centres
//      (head 5/6/7, heart 2/3/4, gut 8/9/1).
//   4. Looks up the integration and disintegration arrows for the primary
//      type.
//   5. Infers a level of health (1-9) from how tightly the answers cluster
//      around the primary type and how much the disintegration-type score
//      leaks in.
//
// The engine takes only the answers map; the question → type mapping is
// re-imported so the two files stay the single source of truth.

import { ENNEAGRAM_QUESTIONS } from '@/lib/interp/enneagram-questions';

export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Wing = { primary: EnneagramType; wing: EnneagramType | null };

export type InstinctualStack = 'sp' | 'so' | 'sx';

export type EnneagramResult = {
  primary: EnneagramType;
  scores: Record<EnneagramType, number>;
  wing: EnneagramType | null;
  tritype: [EnneagramType, EnneagramType, EnneagramType];
  integration: EnneagramType;
  disintegration: EnneagramType;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
};

// Arrows: integration = direction of growth, disintegration = direction of
// stress. These are the canonical Enneagram lines (Naranjo / Riso-Hudson).
const INTEGRATION: Record<EnneagramType, EnneagramType> = {
  1: 7,
  2: 4,
  3: 6,
  4: 1,
  5: 8,
  6: 9,
  7: 5,
  8: 2,
  9: 3,
};

const DISINTEGRATION: Record<EnneagramType, EnneagramType> = {
  1: 4,
  2: 8,
  3: 9,
  4: 2,
  5: 7,
  6: 3,
  7: 1,
  8: 5,
  9: 6,
};

// Centre groupings: head = 5/6/7, heart = 2/3/4, gut = 8/9/1.
const HEAD: ReadonlyArray<EnneagramType> = [5, 6, 7];
const HEART: ReadonlyArray<EnneagramType> = [2, 3, 4];
const GUT: ReadonlyArray<EnneagramType> = [8, 9, 1];

export function adjacentTypes(t: EnneagramType): [EnneagramType, EnneagramType] {
  // Wings are the two literal neighbours on the 1..9 ring.
  const left = (t === 1 ? 9 : t - 1) as EnneagramType;
  const right = (t === 9 ? 1 : t + 1) as EnneagramType;
  return [left, right];
}

function emptyScoreMap(): Record<EnneagramType, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
}

function pickHighest(
  scores: Record<EnneagramType, number>,
  pool: ReadonlyArray<EnneagramType>,
): EnneagramType {
  // Ties break toward the lower type number — keeps results deterministic
  // even when the test is answered in a perfectly balanced way.
  let best: EnneagramType = pool[0];
  for (const t of pool) {
    if (scores[t] > scores[best]) best = t;
  }
  return best;
}

/**
 * Infer a 1-9 level of health.
 *
 * The algorithm:
 *   - The primary type's share of total signal determines *clarity* of
 *     identification. Tightly clustered answers (high share) push level
 *     toward healthy (1-3). Diffuse answers push toward average (4-6).
 *   - The disintegration-type's score relative to the primary indicates
 *     stress-contamination. Heavy disintegration pulls level toward
 *     unhealthy (7-9).
 */
function inferLevel(
  scores: Record<EnneagramType, number>,
  primary: EnneagramType,
): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total <= 0) return 5;

  const primaryShare = scores[primary] / total; // 0..~0.4
  const disScore = scores[DISINTEGRATION[primary]];
  const disRatio = scores[primary] > 0 ? disScore / scores[primary] : 1;

  // Base level from clarity. Higher share = healthier identification.
  // The bands are calibrated against 36 questions / 4 per type (max 20 per
  // type, max 180 total). A primary share above ~0.22 reads as a strong,
  // well-integrated identification.
  let level: number;
  if (primaryShare >= 0.22) level = 2;
  else if (primaryShare >= 0.18) level = 3;
  else if (primaryShare >= 0.15) level = 4;
  else if (primaryShare >= 0.13) level = 5;
  else level = 6;

  // Stress contamination pushes toward the unhealthy band.
  if (disRatio >= 0.95) level += 3;
  else if (disRatio >= 0.85) level += 2;
  else if (disRatio >= 0.75) level += 1;

  if (level < 1) level = 1;
  if (level > 9) level = 9;
  return level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export function scoreAssessment(
  answers: Record<string, 1 | 2 | 3 | 4 | 5>,
): EnneagramResult {
  const scores = emptyScoreMap();

  for (const q of ENNEAGRAM_QUESTIONS) {
    const raw = answers[q.id];
    if (!raw) continue;
    // Likert 1..5 maps to score 1..5 directly; the primary type is the one
    // the reader most strongly endorses across its four questions.
    scores[q.typeScored] += raw;
  }

  // Pick primary (with deterministic tiebreak toward lower numbers).
  let primary: EnneagramType = 1;
  for (let t = 2 as EnneagramType; t <= 9; t = (t + 1) as EnneagramType) {
    if (scores[t] > scores[primary]) primary = t;
  }

  // Wing is the higher-scoring of the two adjacent types. If both neighbours
  // are empty, wing is null.
  const [leftN, rightN] = adjacentTypes(primary);
  const leftScore = scores[leftN];
  const rightScore = scores[rightN];
  let wing: EnneagramType | null;
  if (leftScore === 0 && rightScore === 0) {
    wing = null;
  } else if (leftScore === rightScore) {
    // Deterministic tiebreak: pick the numerically lower neighbour.
    wing = (leftN < rightN ? leftN : rightN) as EnneagramType;
  } else {
    wing = leftScore > rightScore ? leftN : rightN;
  }

  // Tritype — one representative per centre.
  const headT = pickHighest(scores, HEAD);
  const heartT = pickHighest(scores, HEART);
  const gutT = pickHighest(scores, GUT);

  // Canonical tritype ordering is ascending by type number.
  const tritypeArr = [headT, heartT, gutT].sort((a, b) => a - b) as [
    EnneagramType,
    EnneagramType,
    EnneagramType,
  ];

  const integration = INTEGRATION[primary];
  const disintegration = DISINTEGRATION[primary];
  const level = inferLevel(scores, primary);

  return {
    primary,
    scores,
    wing,
    tritype: tritypeArr,
    integration,
    disintegration,
    level,
  };
}

// Convenience re-exports so callers only need to import from this module.
export { ENNEAGRAM_QUESTIONS } from '@/lib/interp/enneagram-questions';
