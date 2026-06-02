// Mode taxonomy shared across the chart Dashboard and the Tradition top bar.
// Keeping it here lets /today and /chart import the same source of truth without
// pulling the whole Dashboard component graph.

import type { Tradition } from '@/lib/tiers';

export type Mode =
  | 'astro' | 'vedic' | 'kab' | 'numerology'
  | 'hd' | 'astrocarto' | 'tarot';

export const MODE_LABELS: Record<Mode, string> = {
  astro: 'Western',
  vedic: 'Vedic',
  kab: 'Kabbalah',
  numerology: 'Numerology',
  hd: 'Human Design',
  astrocarto: 'Astrocartography',
  tarot: 'Tarot',
};

// Maps a chart Mode to its tiers.ts Tradition key — used to gate tabs per tier.
export const MODE_TRADITION: Record<Mode, Tradition> = {
  astro: 'western',
  vedic: 'vedic',
  kab: 'kabbalah',
  numerology: 'numerology',
  hd: 'humanDesign',
  astrocarto: 'astrocartography',
  tarot: 'tarot',
};

export const TRADITION_TAB_ORDER: readonly Mode[] = [
  'astro',
  'vedic',
  'numerology',
  'kab',
  'hd',
  'tarot',
  'astrocarto',
];

export function isMode(value: string): value is Mode {
  return (TRADITION_TAB_ORDER as readonly string[]).includes(value);
}
