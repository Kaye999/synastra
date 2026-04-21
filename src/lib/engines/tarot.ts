// Tarot engine — STUB. Type exports only, pending full engine implementation.
// The deck corpus lives in src/lib/interp/tarot-deck.ts and imports TarotCard from here.
// Full implementation (deterministic draw, spreads, SSE API) pending re-dispatch
// after the Claude usage window resets.

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

export type ThreeCardSpread = Array<TarotDraw & { position: 'past' | 'present' | 'future' }>;
export type CelticCrossSpread = Array<TarotDraw & { position: string }>;

// TODO: implement deterministic draw + shuffle logic
export function dailyCard(_userId: string, _date: Date): TarotDraw {
  throw new Error('Tarot engine not yet implemented');
}
export function drawThreeCard(_userId: string, _context: string): ThreeCardSpread {
  throw new Error('Tarot engine not yet implemented');
}
export function drawCelticCross(_userId: string, _context: string): CelticCrossSpread {
  throw new Error('Tarot engine not yet implemented');
}
