// Tarot engine — deterministic draw logic for Synastra.
//
// All draws (daily, three-card, Celtic Cross) derive from crypto-hashed seeds
// built from the userId + a scope descriptor. This guarantees:
//   - the same user sees the same daily card all day (rolls over at UTC midnight)
//   - two independent calls with the same (userId, question) return the same
//     spread — so the SSE stream and the visible card deck never drift
//   - no cards repeat within a single spread
//
// The deck lives in ../interp/tarot-deck.ts and imports TarotCard from this
// file (to avoid a cycle, we define the type here).

import { createHash } from 'crypto';
import { TAROT_DECK } from '../interp/tarot-deck';

/* ============================================================
 * Types
 * ============================================================ */

export type TarotCard = {
  id: number; // 0-77
  name: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  element: 'fire' | 'water' | 'air' | 'earth';
  zodiacal?: string;
  planetary?: string;
  keywords: { upright: string[]; reversed: string[] };
  body: string;
  shadow: string;
  gift: string;
};

export type TarotDraw = {
  card: TarotCard;
  reversed: boolean;
};

export type ThreeCardPosition = 'past' | 'present' | 'future';

export type CelticCrossPosition =
  | 'significator'
  | 'crossing'
  | 'foundation'
  | 'recent-past'
  | 'crown'
  | 'near-future'
  | 'self'
  | 'environment'
  | 'hopes-fears'
  | 'outcome';

export const CELTIC_CROSS_POSITIONS: readonly {
  key: CelticCrossPosition;
  index: number;
  label: string;
  meaning: string;
}[] = [
  { key: 'significator', index: 1, label: 'The Heart', meaning: 'the question itself; what stands at the centre' },
  { key: 'crossing', index: 2, label: 'The Crossing', meaning: 'what opposes, obstructs, or complicates' },
  { key: 'foundation', index: 3, label: 'The Foundation', meaning: 'what lies beneath; the root of the matter' },
  { key: 'recent-past', index: 4, label: 'The Recent Past', meaning: 'what has just passed; what is receding' },
  { key: 'crown', index: 5, label: 'The Crown', meaning: 'what hovers above; the aspirational possibility' },
  { key: 'near-future', index: 6, label: 'The Near Future', meaning: 'what arrives next; the step coming into view' },
  { key: 'self', index: 7, label: 'The Self', meaning: 'the reader in this situation; their stance' },
  { key: 'environment', index: 8, label: 'The Environment', meaning: 'outer influences; people and circumstances' },
  { key: 'hopes-fears', index: 9, label: 'Hopes & Fears', meaning: 'what the reader wants and dreads' },
  { key: 'outcome', index: 10, label: 'The Outcome', meaning: 'where the current trajectory lands' },
];

export type ThreeCardSpread = Array<TarotDraw & { position: ThreeCardPosition; index: number; label: string }>;
export type CelticCrossSpread = Array<TarotDraw & { position: CelticCrossPosition; index: number; label: string }>;

/* ============================================================
 * Deterministic RNG (mulberry32 seeded from a sha256 digest)
 * ============================================================ */

function seedFromHash(...parts: string[]): number {
  const digest = createHash('sha256').update(parts.join('|')).digest();
  // Fold four bytes into a 32-bit unsigned seed.
  return (
    ((digest[0] << 24) >>> 0) |
    (digest[1] << 16) |
    (digest[2] << 8) |
    digest[3]
  ) >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ============================================================
 * Draw primitives
 * ============================================================ */

function draw(rng: () => number, excluded: Set<number>): TarotDraw {
  // Reject-and-resample against the excluded set. The deck is 78; rejection
  // ratios are trivial.
  let id = Math.floor(rng() * TAROT_DECK.length);
  while (excluded.has(id)) {
    id = Math.floor(rng() * TAROT_DECK.length);
  }
  excluded.add(id);
  const card = TAROT_DECK[id];
  const reversed = rng() < 0.28; // ~28% reversed — classic Rider-Waite frequency
  return { card, reversed };
}

/* ============================================================
 * Daily card
 * ============================================================ */

/**
 * Today's card for this user. Same (userId, UTC-date) always resolves to the
 * same card and orientation. New card at UTC midnight.
 */
export function dailyCard(userId: string, date: Date = new Date()): TarotDraw {
  const seed = seedFromHash(userId, dateKey(date), 'daily');
  const rng = mulberry32(seed);
  return draw(rng, new Set<number>());
}

/* ============================================================
 * Three-card spread (past / present / future)
 * ============================================================ */

const THREE_CARD_KEYS: ThreeCardPosition[] = ['past', 'present', 'future'];
const THREE_CARD_LABELS: Record<ThreeCardPosition, string> = {
  past: 'Past',
  present: 'Present',
  future: 'Future',
};

/**
 * Draw a three-card spread keyed to userId + question context. Same
 * (userId, context) always resolves to the same spread, so a refresh of the
 * page during a reading does not reshuffle the deck mid-interpretation.
 */
export function drawThreeCard(userId: string, context = ''): ThreeCardSpread {
  const seed = seedFromHash(userId, context.trim(), 'three-card');
  const rng = mulberry32(seed);
  const excluded = new Set<number>();
  return THREE_CARD_KEYS.map((position, i) => {
    const d = draw(rng, excluded);
    return {
      ...d,
      position,
      index: i + 1,
      label: THREE_CARD_LABELS[position],
    };
  });
}

/* ============================================================
 * Celtic Cross (10 cards)
 * ============================================================ */

export function drawCelticCross(userId: string, context = ''): CelticCrossSpread {
  const seed = seedFromHash(userId, context.trim(), 'celtic-cross');
  const rng = mulberry32(seed);
  const excluded = new Set<number>();
  return CELTIC_CROSS_POSITIONS.map((spec) => {
    const d = draw(rng, excluded);
    return {
      ...d,
      position: spec.key,
      index: spec.index,
      label: spec.label,
    };
  });
}

/* ============================================================
 * Display helpers (used by UI + prompt builders)
 * ============================================================ */

export function formatCardReference(draw: TarotDraw): string {
  return `${draw.card.name}${draw.reversed ? ' (reversed)' : ''}`;
}

export function spreadToBrief(
  spread: ThreeCardSpread | CelticCrossSpread,
): Array<{ position: string; label: string; card: string; reversed: boolean; keywords: string[] }> {
  return spread.map((d) => ({
    position: d.position,
    label: d.label,
    card: d.card.name,
    reversed: d.reversed,
    keywords: d.reversed ? d.card.keywords.reversed : d.card.keywords.upright,
  }));
}
