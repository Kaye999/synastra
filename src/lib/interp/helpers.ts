// Small utilities for turning raw chart data into interpretation-ready pieces.
// Used by the Western reading (Dashboard.tsx). Safe to import into other
// tradition modes later.

import type { Planet } from '@/lib/types';

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

const ELEMENT_OF: Record<string, Element> = {
  Aries: 'Fire',    Leo: 'Fire',         Sagittarius: 'Fire',
  Taurus: 'Earth',  Virgo: 'Earth',      Capricorn:   'Earth',
  Gemini: 'Air',    Libra: 'Air',        Aquarius:    'Air',
  Cancer: 'Water',  Scorpio: 'Water',    Pisces:      'Water',
};

const MODALITY_OF: Record<string, Modality> = {
  Aries: 'Cardinal',   Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed',     Leo: 'Fixed',       Scorpio: 'Fixed',  Aquarius: 'Fixed',
  Gemini: 'Mutable',   Virgo: 'Mutable',   Sagittarius: 'Mutable', Pisces: 'Mutable',
};

export function signElement(sign: string | undefined): Element | null {
  return sign ? ELEMENT_OF[sign] ?? null : null;
}

export function signModality(sign: string | undefined): Modality | null {
  return sign ? MODALITY_OF[sign] ?? null : null;
}

export type BalanceCount<T extends string> = Record<T, number>;

export type ChartBalance = {
  elements: BalanceCount<Element>;
  modalities: BalanceCount<Modality>;
  dominantElement: Element;
  dominantModality: Modality;
  totalCounted: number;
};

/**
 * Count elements + modalities across the personal-planet set (Sun..Saturn by
 * default) plus the Ascendant. Outer planets (Uranus/Neptune/Pluto) are
 * generational, so we exclude them from the "who you are" summary.
 */
export function computeChartBalance(
  planets: Planet[],
  ascendantSign?: string,
): ChartBalance {
  const elements: BalanceCount<Element> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalities: BalanceCount<Modality> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  let total = 0;

  const personal = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
  for (const p of planets) {
    if (!personal.has(p.planet)) continue;
    const e = signElement(p.sign);
    const m = signModality(p.sign);
    if (e) { elements[e] += 1; total += 1; }
    if (m) modalities[m] += 1;
  }
  if (ascendantSign) {
    const e = signElement(ascendantSign);
    const m = signModality(ascendantSign);
    if (e) { elements[e] += 1; total += 1; }
    if (m) modalities[m] += 1;
  }

  const dominantElement = (Object.entries(elements) as [Element, number][]).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
  )[0];
  const dominantModality = (Object.entries(modalities) as [Modality, number][]).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
  )[0];

  return { elements, modalities, dominantElement, dominantModality, totalCounted: total };
}

/**
 * Natural-English summary of the balance ("4 water, 3 fire, 2 air, 1 earth").
 * Sort descending by count so the dominant reads first.
 */
export function formatBalanceSummary(counts: BalanceCount<string>): string {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k.toLowerCase()}`)
    .join(', ');
}
