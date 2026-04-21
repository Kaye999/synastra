// Thin wrapper around the `transit-detector` module that the
// reading-engines agent is building. This file exposes the shape the
// transit-scan cron expects and provides a safe fallback (empty list)
// until that module lands, so the cron route still compiles and runs.
//
// When `src/lib/engines/transit-detector.ts` exists, replace the body
// of `detectUpcomingTransits` with:
//
//   import { detectTransits } from '@/lib/engines/transit-detector';
//   return detectTransits({ chart, windowDays });

import type { AstroInput } from '@/lib/types';
import { computeTropicalChart } from '@/lib/engines/astro';

export type TransitAlert = {
  /** Deterministic key — e.g. "jupiter-conj-natal-sun-2026-06-09". Used
   * as the natural key for deduping in `astral.transit_alerts`. */
  transitKey: string;
  /** Human name, e.g. "Jupiter conjunct your Sun". */
  name: string;
  /** The exact date the transit peaks (YYYY-MM-DD, UTC). */
  exactDate: string;
  /** Transit planet + aspect type + natal target. */
  transitPlanet: string;
  aspect: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  natalPlanet: string;
  /** Orb in degrees at exactness (0 for exact crossings). */
  orb: number;
  /** Arbitrary extra payload the email + UI can use. */
  data: Record<string, unknown>;
};

/**
 * Compute major transits for a chart over the next N days.
 *
 * The current placeholder returns [] — safe no-op — so the cron route
 * can ship. The reading-engines agent will provide the real detector at
 * `@/lib/engines/transit-detector`; once that exists, swap the import
 * below.
 */
export async function detectUpcomingTransits(args: {
  chart: AstroInput;
  windowDays?: number;
}): Promise<TransitAlert[]> {
  // Touch the chart so unused-var lint doesn't fail. Also validates that
  // the chart computes without throwing before we hand off to a real
  // detector.
  void computeTropicalChart(args.chart);

  // When the reading-engines agent ships
  // `src/lib/engines/transit-detector.ts`, uncomment the block below and
  // remove this early return. The indirection keeps the bundler happy
  // (static imports would fail the build right now).
  //
  // try {
  //   const mod = await import('@/lib/engines/transit-detector');
  //   return await mod.detectTransits({ chart: args.chart, windowDays: args.windowDays ?? 30 });
  // } catch (err) {
  //   console.warn('[cron/transits] transit-detector threw', err);
  // }

  return [];
}

/** Short interpretation text for an alert — used in the email body and
 * the in-app list. Keeps copy consistent across both channels. */
export function interpretTransit(alert: TransitAlert): string {
  const lede: Record<TransitAlert['aspect'], string> = {
    conjunction: `${alert.transitPlanet} meets your ${alert.natalPlanet}`,
    opposition: `${alert.transitPlanet} opposes your ${alert.natalPlanet}`,
    trine: `${alert.transitPlanet} flows to your ${alert.natalPlanet}`,
    square: `${alert.transitPlanet} presses on your ${alert.natalPlanet}`,
    sextile: `${alert.transitPlanet} opens a door to your ${alert.natalPlanet}`,
  };
  return `${lede[alert.aspect]} on ${alert.exactDate}. The interpretation waits in Synastra.`;
}
