// transit-detector.ts — given a user's natal chart and a date range, detect
// "significant" transits: outer-planet hard/soft aspects to natal personal
// planets and angles, plus inner-planet stations/retrogrades hitting sensitive
// points.
//
// This is intentionally lightweight. We sample ecliptic longitudes daily using
// the existing astronomy-engine integration (src/lib/engines/astro.ts) and
// walk forward, recording ingress into orb, exact hit, and egress.
//
// Eclipse detection is approximated by nodal proximity on a New/Full Moon day
// — a cheap heuristic that catches the big ones without pulling in an SPK
// kernel. For a production-grade ephemeris, swap in a real eclipse table.

import * as Astronomy from 'astronomy-engine';
import type { Chart, SiderealChart } from '@/lib/types';

/* ============================================================
 * Types
 * ============================================================ */

export type AspectName =
  | 'conjunction'
  | 'opposition'
  | 'square'
  | 'trine'
  | 'sextile';

export type DetectedTransit = {
  planet: string;
  aspect: AspectName;
  target: string; // natal placement label
  exactDate: string; // ISO date of exact hit
  orb: number; // minimum orb observed during window (deg)
  orbEnterDate: string; // ISO date transit entered orb
  orbExitDate: string; // ISO date transit left orb
  kind: 'outer-to-personal' | 'inner-station' | 'eclipse';
};

export type DetectRange = {
  start: Date;
  end: Date;
};

/* ============================================================
 * Constants
 * ============================================================ */

const OUTER_PLANETS: { name: string; body: Astronomy.Body }[] = [
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn',  body: Astronomy.Body.Saturn  },
  { name: 'Uranus',  body: Astronomy.Body.Uranus  },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto',   body: Astronomy.Body.Pluto   },
];

const INNER_PLANETS: { name: string; body: Astronomy.Body }[] = [
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus',   body: Astronomy.Body.Venus   },
  { name: 'Mars',    body: Astronomy.Body.Mars    },
];

// Personal-planet / angle labels we track in the natal chart.
const PERSONAL_TARGETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
const ANGLE_TARGETS = ['ASC', 'MC'];

// Aspect angles + default orbs (deg). We keep orbs tight for transits.
const ASPECTS: { name: AspectName; angle: number; orb: number }[] = [
  { name: 'conjunction', angle: 0,   orb: 1.5 },
  { name: 'opposition',  angle: 180, orb: 1.5 },
  { name: 'square',      angle: 90,  orb: 1.0 },
  { name: 'trine',       angle: 120, orb: 1.0 },
  { name: 'sextile',     angle: 60,  orb: 0.8 },
];

const MS_PER_DAY = 86400 * 1000;

/* ============================================================
 * Helpers
 * ============================================================ */

function norm360(x: number): number {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

// Returns the smallest angular separation in [0, 180].
function angularSeparation(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

// Ecliptic longitude of a body at a given instant.
function eclipticLongitude(body: Astronomy.Body, t: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Moon) {
    const v = Astronomy.GeoMoon(t);
    return norm360(Astronomy.Ecliptic(v).elon);
  }
  const v = Astronomy.GeoVector(body, t, true);
  return norm360(Astronomy.Ecliptic(v).elon);
}

// Pull natal longitudes we care about out of the user's chart. Accepts either
// tropical or sidereal; for transit detection we use tropical geocentric
// longitudes, so pass a tropical chart.
type NatalPoint = { target: string; longitude: number };

export function extractNatalPoints(chart: Chart | SiderealChart): NatalPoint[] {
  const out: NatalPoint[] = [];
  for (const p of chart.planets) {
    if (PERSONAL_TARGETS.includes(p.planet)) {
      out.push({ target: `natal ${p.planet}`, longitude: norm360(p.longitude) });
    }
  }
  if (chart.ascendant) out.push({ target: 'ASC', longitude: norm360(chart.ascendant.longitude) });
  if (chart.mc)        out.push({ target: 'MC',  longitude: norm360(chart.mc.longitude) });
  return out;
}

/* ============================================================
 * Detector
 * ============================================================ */

type OrbWindow = {
  key: string;
  planet: string;
  body: Astronomy.Body;
  aspect: AspectName;
  target: string;
  natalLon: number;
  orbLimit: number;
  minSep: number; // smallest separation from exact observed so far
  minSepDate: Date;
  enterDate: Date;
  lastDate: Date;
};

/**
 * Walk `range` day-by-day, sampling each outer planet's aspect to each natal
 * point. Track open orb-windows; emit one DetectedTransit per completed window
 * (orb enter -> minimum -> orb exit).
 */
export function detectOuterTransits(
  natalPoints: NatalPoint[],
  range: DetectRange,
): DetectedTransit[] {
  const results: DetectedTransit[] = [];
  const open = new Map<string, OrbWindow>();

  const startMs = range.start.getTime();
  const endMs = range.end.getTime();

  for (let ms = startMs; ms <= endMs; ms += MS_PER_DAY) {
    const when = new Date(ms);
    const t = new Astronomy.AstroTime(when);

    for (const pl of OUTER_PLANETS) {
      const plLon = eclipticLongitude(pl.body, t);

      for (const nat of natalPoints) {
        for (const asp of ASPECTS) {
          const sep = Math.abs(angularSeparation(plLon, nat.longitude) - asp.angle);
          // sep = 0 means exact aspect; we consider it "in orb" when sep <= orb.
          const key = `${pl.name}|${asp.name}|${nat.target}`;
          const existing = open.get(key);

          if (sep <= asp.orb) {
            if (!existing) {
              open.set(key, {
                key,
                planet: pl.name,
                body: pl.body,
                aspect: asp.name,
                target: nat.target,
                natalLon: nat.longitude,
                orbLimit: asp.orb,
                minSep: sep,
                minSepDate: when,
                enterDate: when,
                lastDate: when,
              });
            } else {
              existing.lastDate = when;
              if (sep < existing.minSep) {
                existing.minSep = sep;
                existing.minSepDate = when;
              }
            }
          } else if (existing) {
            // exiting orb — finalise
            results.push({
              planet: existing.planet,
              aspect: existing.aspect,
              target: existing.target,
              exactDate: existing.minSepDate.toISOString(),
              orb: Number(existing.minSep.toFixed(3)),
              orbEnterDate: existing.enterDate.toISOString(),
              orbExitDate: existing.lastDate.toISOString(),
              kind: 'outer-to-personal',
            });
            open.delete(key);
          }
        }
      }
    }
  }

  // Flush anything still open at end of window
  for (const w of open.values()) {
    results.push({
      planet: w.planet,
      aspect: w.aspect,
      target: w.target,
      exactDate: w.minSepDate.toISOString(),
      orb: Number(w.minSep.toFixed(3)),
      orbEnterDate: w.enterDate.toISOString(),
      orbExitDate: w.lastDate.toISOString(),
      kind: 'outer-to-personal',
    });
  }

  // Sort by exact date
  results.sort((a, b) => a.exactDate.localeCompare(b.exactDate));
  return results;
}

/**
 * Inner-planet stations hitting natal placements. Very light-weight: detect
 * days where an inner planet's longitude motion reverses direction within
 * `orb` of a natal point.
 */
export function detectInnerStations(
  natalPoints: NatalPoint[],
  range: DetectRange,
  orb = 2,
): DetectedTransit[] {
  const results: DetectedTransit[] = [];
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();

  for (const pl of INNER_PLANETS) {
    let prev = eclipticLongitude(pl.body, new Astronomy.AstroTime(new Date(startMs)));
    let curr = eclipticLongitude(pl.body, new Astronomy.AstroTime(new Date(startMs + MS_PER_DAY)));

    for (let ms = startMs + MS_PER_DAY; ms <= endMs - MS_PER_DAY; ms += MS_PER_DAY) {
      const when = new Date(ms);
      const next = eclipticLongitude(pl.body, new Astronomy.AstroTime(new Date(ms + MS_PER_DAY)));

      // Speed sign flips across today => station
      const sPrev = Math.sign(angularDelta(prev, curr));
      const sNext = Math.sign(angularDelta(curr, next));
      if (sPrev !== 0 && sNext !== 0 && sPrev !== sNext) {
        // Station detected — check proximity to each natal point
        for (const nat of natalPoints) {
          const sep = angularSeparation(curr, nat.longitude);
          if (sep <= orb) {
            results.push({
              planet: pl.name,
              aspect: 'conjunction',
              target: nat.target,
              exactDate: when.toISOString(),
              orb: Number(sep.toFixed(3)),
              orbEnterDate: when.toISOString(),
              orbExitDate: when.toISOString(),
              kind: 'inner-station',
            });
          }
        }
      }

      prev = curr;
      curr = next;
    }
  }

  results.sort((a, b) => a.exactDate.localeCompare(b.exactDate));
  return results;
}

// Signed angular delta in (-180, 180]. Positive = direct motion (zodiacal order).
function angularDelta(a: number, b: number): number {
  let d = norm360(b) - norm360(a);
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Approximate eclipse detection. We treat a New or Full Moon occurring within
 * `orb` of the lunar nodes as an eclipse, and emit one DetectedTransit per
 * eclipse that falls within `orb` of any natal point.
 */
export function detectEclipseHits(
  natalPoints: NatalPoint[],
  range: DetectRange,
  orb = 3,
): DetectedTransit[] {
  const results: DetectedTransit[] = [];
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();

  // Iterate lunations within the window
  let searchStart = new Astronomy.AstroTime(new Date(startMs));
  while (true) {
    const newMoon = Astronomy.SearchMoonPhase(0, searchStart, 40);
    if (!newMoon || newMoon.date.getTime() > endMs) break;
    processLunation(newMoon, 'solar');
    searchStart = new Astronomy.AstroTime(new Date(newMoon.date.getTime() + MS_PER_DAY));
  }

  searchStart = new Astronomy.AstroTime(new Date(startMs));
  while (true) {
    const fullMoon = Astronomy.SearchMoonPhase(180, searchStart, 40);
    if (!fullMoon || fullMoon.date.getTime() > endMs) break;
    processLunation(fullMoon, 'lunar');
    searchStart = new Astronomy.AstroTime(new Date(fullMoon.date.getTime() + MS_PER_DAY));
  }

  function processLunation(when: Astronomy.AstroTime, kind: 'solar' | 'lunar') {
    // Sun longitude at this instant
    const sunLon = eclipticLongitude(Astronomy.Body.Sun, when);
    // Lunar node longitude (mean node, fast approximation)
    const nodeLon = meanLunarNodeLon(when);
    const nodeSep = angularSeparation(sunLon, nodeLon);
    const nodeSep180 = angularSeparation(sunLon, norm360(nodeLon + 180));
    const minNodeSep = Math.min(nodeSep, nodeSep180);
    if (minNodeSep > 18) return; // outside eclipse season

    // Eclipse point longitude = Sun (solar) or Sun+180 (lunar)
    const eclipsePoint = kind === 'solar' ? sunLon : norm360(sunLon + 180);

    for (const nat of natalPoints) {
      const sep = angularSeparation(eclipsePoint, nat.longitude);
      if (sep <= orb) {
        results.push({
          planet: kind === 'solar' ? 'Solar Eclipse' : 'Lunar Eclipse',
          aspect: 'conjunction',
          target: nat.target,
          exactDate: when.date.toISOString(),
          orb: Number(sep.toFixed(3)),
          orbEnterDate: when.date.toISOString(),
          orbExitDate: when.date.toISOString(),
          kind: 'eclipse',
        });
      }
    }
  }

  results.sort((a, b) => a.exactDate.localeCompare(b.exactDate));
  return results;
}

// Mean node longitude (same formula as src/lib/engines/astro.ts).
function meanLunarNodeLon(t: Astronomy.AstroTime): number {
  const T = t.tt / 36525.0;
  const omega =
    125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T * T
    + (T * T * T) / 467441.0
    - (T * T * T * T) / 60616000.0;
  return norm360(omega);
}

/* ============================================================
 * Top-level API
 * ============================================================ */

export type DetectOptions = {
  includeInnerStations?: boolean;
  includeEclipses?: boolean;
};

/**
 * Detect all significant transits for this natal chart within [start, end].
 * Pass a tropical Chart (we use tropical geocentric longitudes).
 */
export function detectSignificantTransits(
  chart: Chart | SiderealChart,
  range: DetectRange,
  opts: DetectOptions = {},
): DetectedTransit[] {
  const natalPoints = extractNatalPoints(chart);
  if (natalPoints.length === 0) return [];

  const out: DetectedTransit[] = [];
  out.push(...detectOuterTransits(natalPoints, range));
  if (opts.includeInnerStations) out.push(...detectInnerStations(natalPoints, range));
  if (opts.includeEclipses) out.push(...detectEclipseHits(natalPoints, range));
  out.sort((a, b) => a.exactDate.localeCompare(b.exactDate));
  return out;
}
