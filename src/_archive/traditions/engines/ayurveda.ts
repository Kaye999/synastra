// ayurveda.ts — prakruti (constitution) scoring engine.
//
// The caller passes an object keyed by question id with the chosen dosha
// per answer. We tally the three doshas, normalize to percentages, and
// classify the constitution as single-dosha, dual-dosha, or tri-dosha.
//
// Classification rule, grounded in the standard prakruti literature:
//   - If the dominant dosha leads the runner-up by >= 15 percentage points
//     and the third dosha trails the second by a comparable margin, the
//     constitution reads as SINGLE. Example: 60/25/15.
//   - If the top two doshas sit within 12 points of each other and both
//     clear 30%, the constitution is DUAL (e.g. Vata-Pitta at 45/38/17).
//   - If all three doshas land between 25% and 40%, the constitution is
//     TRI-DOSHIC. These readings are rare in the population and warrant
//     a distinct editorial tone.

export type Dosha = 'vata' | 'pitta' | 'kapha';

export type Prakruti = {
  dominant: Dosha;
  secondary: Dosha | null;
  type: 'single' | 'dual' | 'tri';
  scores: Record<Dosha, number>;
  percentages: Record<Dosha, number>;
};

const DOSHAS: readonly Dosha[] = ['vata', 'pitta', 'kapha'] as const;

/** Clamp + round percentages so they sum to 100 (rounding-error-safe). */
function normalizePercentages(raw: Record<Dosha, number>): Record<Dosha, number> {
  const total = raw.vata + raw.pitta + raw.kapha;
  if (total <= 0) {
    // No answers — return an even split rather than NaN.
    return { vata: 34, pitta: 33, kapha: 33 };
  }
  const floats: Record<Dosha, number> = {
    vata: (raw.vata / total) * 100,
    pitta: (raw.pitta / total) * 100,
    kapha: (raw.kapha / total) * 100,
  };
  const rounded: Record<Dosha, number> = {
    vata: Math.round(floats.vata),
    pitta: Math.round(floats.pitta),
    kapha: Math.round(floats.kapha),
  };
  // Correct for rounding drift so the three add to 100 exactly.
  const drift = 100 - (rounded.vata + rounded.pitta + rounded.kapha);
  if (drift !== 0) {
    // Apply drift to the largest value.
    const biggest = (Object.keys(rounded) as Dosha[]).reduce((a, b) =>
      rounded[a] >= rounded[b] ? a : b,
    );
    rounded[biggest] += drift;
  }
  return rounded;
}

function sortByScoreDesc(scores: Record<Dosha, number>): Dosha[] {
  return [...DOSHAS].sort((a, b) => scores[b] - scores[a]);
}

function classify(percentages: Record<Dosha, number>): {
  dominant: Dosha;
  secondary: Dosha | null;
  type: 'single' | 'dual' | 'tri';
} {
  const [first, second, third] = sortByScoreDesc(percentages);
  const top = percentages[first];
  const mid = percentages[second];
  const low = percentages[third];

  // Tri-doshic: all three are close, none dominates.
  if (top - low <= 12 && top >= 28 && low >= 25) {
    return { dominant: first, secondary: second, type: 'tri' };
  }
  // Dual: top two close, third distinctly lower.
  if (top - mid <= 12 && mid >= 30 && mid - low >= 8) {
    return { dominant: first, secondary: second, type: 'dual' };
  }
  // Default: single-dosha constitution.
  return { dominant: first, secondary: null, type: 'single' };
}

/**
 * Score a set of questionnaire answers into a full prakruti profile.
 * Answers are a map of question id -> the chosen dosha for that question.
 * Unanswered questions are ignored (no score contribution).
 */
export function scoreConstitution(answers: Record<string, Dosha>): Prakruti {
  const scores: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
  for (const key of Object.keys(answers)) {
    const v = answers[key];
    if (v === 'vata' || v === 'pitta' || v === 'kapha') {
      scores[v] += 1;
    }
  }
  const percentages = normalizePercentages(scores);
  const { dominant, secondary, type } = classify(percentages);
  return { dominant, secondary, type, scores, percentages };
}

/**
 * Human-readable constitution label. 'Vata', 'Vata-Pitta', 'Tri-doshic'.
 * Used by the profile UI hero.
 */
export function constitutionLabel(p: Prakruti): string {
  if (p.type === 'tri') return 'Tri-doshic';
  if (p.type === 'dual' && p.secondary) {
    return `${capitalize(p.dominant)}-${capitalize(p.secondary)}`;
  }
  return capitalize(p.dominant);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
