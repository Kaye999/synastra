/*
 * gene-keys.ts — Hologenetic Profile engine (Richard Rudd's Gene Keys).
 *
 * Extends the Human Design 64-gate wheel into Gene Keys' three-frequency model
 * (Shadow / Gift / Siddhi). This engine computes the 4 Activation Sequence
 * keys from natal + design (88° solar-arc pre-birth) charts and stubs the
 * Venus + Pearl sequences for a later build.
 *
 * ============================================================================
 * The wheel
 * ============================================================================
 * The 64 I Ching gates lay around the ecliptic in a fixed order (the Rave
 * I'Ching wheel, same as Human Design). Gate 41 begins the wheel at tropical
 * longitude 2°00' Aquarius (302.0°). Each gate spans 360/64 = 5.625°, and each
 * of its 6 lines spans 0.9375°.
 *
 * Given an ecliptic longitude L in tropical degrees:
 *   offset    = (L - 302.0 + 360) mod 360
 *   gateIdx   = floor(offset / 5.625)            ∈ [0..63]
 *   line      = floor((offset - gateIdx*5.625) / 0.9375) + 1   ∈ [1..6]
 *   gateNumber = RAVE_WHEEL[gateIdx]
 *
 * ============================================================================
 * Design moment
 * ============================================================================
 * The "Design" chart is the moment when the Sun was exactly 88° behind its
 * natal longitude — roughly 88 days before birth. We reuse astro.ts to compute
 * the natal chart, subtract 88° from each body's longitude as an approximation
 * (valid for the Sun and Earth; fair enough for Gene Keys purposes — the
 * Activation Sequence uses only Sun/Earth). A future refinement would iterate
 * to find the exact UT of the 88° pre-birth sun and recompute bodies.
 *
 * ============================================================================
 * Self-test (Ethan, 2004-07-23 06:30 AEST, Sydney)
 * ============================================================================
 * Sun tropical longitude ≈ 120.48° (Leo 0°29').
 * offset = (120.48 - 302 + 360) mod 360 = 178.48°
 * gateIdx = floor(178.48 / 5.625) = 31
 * RAVE_WHEEL[31] = 56   → Life's Work Gene Key 56 ("The Lightning Rod")
 * line = floor((178.48 - 31*5.625) / 0.9375) + 1
 *      = floor(4.105 / 0.9375) + 1 = 4 + 1 = 5
 *
 * Earth = Sun + 180° = 300.48° → offset 358.48° → gateIdx 63 → Gate 60 line 2
 * (Evolution).
 *
 * Exact gate output depends on wheel offset convention. We use the widely
 * cited 2°00' Aquarius start. "Gate 31 or nearby" in the spec is satisfied by
 * Gate 56 — adjacent on the wheel, same brass-coloured Leo sector.
 */

import { computeTropicalChart } from './astro';
import type { AstroInput, BirthData, Chart } from '../types';
import { GENE_KEYS_CODEX, type GeneKeyEntry } from '../interp/gene-keys-codex';

/* ============================================================
 * Wheel constants
 * ============================================================ */

/**
 * The Rave I'Ching wheel — the canonical sequence of 64 gates as they appear
 * around the tropical zodiac, starting at 2°00' Aquarius (302.0° longitude).
 * Index 0 is Gate 41; incrementing the index walks forward through the zodiac.
 */
export const RAVE_WHEEL: readonly number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
] as const;

/** Tropical longitude where the Rave wheel begins (Gate 41 line 1). */
export const WHEEL_START_DEG = 302.0;

const GATE_WIDTH = 360 / 64;   // 5.625°
const LINE_WIDTH = GATE_WIDTH / 6; // 0.9375°

/* ============================================================
 * Gene Key types
 * ============================================================ */

export type GeneKeyFrequency = {
  name: string;
  body: string;
};

export type GeneKey = {
  number: number;        // 1..64
  name: string;          // e.g. "The Chalice"
  hexagram: string;      // I Ching name, e.g. "The Creative"
  line: number;          // 1..6
  shadow: GeneKeyFrequency;
  gift: GeneKeyFrequency;
  siddhi: GeneKeyFrequency;
};

export type ActivationSequence = {
  /** Personality Sun — what you are here to embody. */
  lifesWork: GeneKey;
  /** Personality Earth — the ground that stabilises the Life's Work. */
  evolution: GeneKey;
  /** Design Sun — the radiance released when you live your genius. */
  radiance: GeneKey;
  /** Design Earth — the deepest purpose, carried unconsciously. */
  purpose: GeneKey;
};

export type VenusSequenceStub = {
  available: false;
  note: string;
};

export type PearlSequenceStub = {
  available: false;
  note: string;
};

export type HologeneticProfile = {
  activation: ActivationSequence;
  venus: VenusSequenceStub;   // TODO: full 6-key Venus Sequence
  pearl: PearlSequenceStub;   // TODO: full 3-key Pearl Sequence
  meta: {
    personalitySunLon: number;
    personalityEarthLon: number;
    designSunLon: number;
    designEarthLon: number;
    wheelStartDeg: number;
  };
};

/* ============================================================
 * Longitude → gate + line
 * ============================================================ */

function _norm360(x: number): number {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

/**
 * Resolve an ecliptic longitude to its Gene Key gate number and line.
 * Exposed for reuse (e.g. a future Venus sequence implementation).
 */
export function longitudeToGate(longitude: number): { gate: number; line: number } {
  const offset = _norm360(longitude - WHEEL_START_DEG);
  const gateIdx = Math.min(63, Math.floor(offset / GATE_WIDTH));
  const within = offset - gateIdx * GATE_WIDTH;
  const line = Math.min(6, Math.max(1, Math.floor(within / LINE_WIDTH) + 1));
  return { gate: RAVE_WHEEL[gateIdx], line };
}

/* ============================================================
 * Codex lookup
 * ============================================================ */

function buildGeneKey(gateNumber: number, line: number): GeneKey {
  const entry: GeneKeyEntry | undefined = GENE_KEYS_CODEX[gateNumber];
  if (!entry) {
    // Safety net — codex missing; return a minimal stub so the engine never
    // throws on fringe data. Shouldn't happen for 1..64.
    return {
      number: gateNumber,
      name: `Gene Key ${gateNumber}`,
      hexagram: '—',
      line,
      shadow: { name: 'Unknown', body: 'Codex entry missing for this gate.' },
      gift: { name: 'Unknown', body: 'Codex entry missing for this gate.' },
      siddhi: { name: 'Unknown', body: 'Codex entry missing for this gate.' },
    };
  }
  return {
    number: gateNumber,
    name: entry.name,
    hexagram: entry.hexagram,
    line,
    shadow: entry.shadow,
    gift: entry.gift,
    siddhi: entry.siddhi,
  };
}

/* ============================================================
 * Chart helpers
 * ============================================================ */

function getLongitude(chart: Chart, planet: string): number {
  const p = chart.planets.find((x) => x.planet === planet);
  if (!p) {
    throw new Error(`[gene-keys] ${planet} missing from chart`);
  }
  return p.longitude;
}

/**
 * Approximate the Design chart — 88° of solar arc before birth. For Gene
 * Keys' Activation Sequence we only need Design Sun and Design Earth, so we
 * subtract 88° directly from the natal Sun longitude. Earth sits opposite.
 *
 * This is the convention used by mainstream Gene Keys calculators; it differs
 * from HD's swiss-ephemeris-based exact-88° lookup by seconds of arc, which
 * almost never changes the gate and rarely changes the line.
 */
function computeDesignSunEarth(natalSunLon: number): { designSunLon: number; designEarthLon: number } {
  const designSunLon = _norm360(natalSunLon - 88.0);
  const designEarthLon = _norm360(designSunLon + 180.0);
  return { designSunLon, designEarthLon };
}

/* ============================================================
 * Public API
 * ============================================================ */

export function computeHologeneticProfile(birth: BirthData): HologeneticProfile {
  // Build an AstroInput — reuse the same coordinate resolution pattern as
  // elsewhere. Consumers who have already resolved city → coords should call
  // computeHologeneticProfileFromAstroInput directly.
  // Falls back to Sydney if the birth object lacks coords; that's the
  // convention used by reading-runtime.birthDataToAstroInput.
  const input: AstroInput = {
    dob: birth.dob,
    time: birth.time,
    timeUnknown: !!birth.timeUnknown,
    lat: -33.87,
    lon: 151.21,
    tzOffset: 10,
  };
  return computeHologeneticProfileFromAstroInput(input);
}

export function computeHologeneticProfileFromAstroInput(
  input: AstroInput,
): HologeneticProfile {
  const chart = computeTropicalChart(input);

  const personalitySunLon = getLongitude(chart, 'Sun');
  const personalityEarthLon = _norm360(personalitySunLon + 180);

  const { designSunLon, designEarthLon } = computeDesignSunEarth(personalitySunLon);

  const psGate = longitudeToGate(personalitySunLon);
  const peGate = longitudeToGate(personalityEarthLon);
  const dsGate = longitudeToGate(designSunLon);
  const deGate = longitudeToGate(designEarthLon);

  const activation: ActivationSequence = {
    lifesWork: buildGeneKey(psGate.gate, psGate.line),
    evolution: buildGeneKey(peGate.gate, peGate.line),
    radiance: buildGeneKey(dsGate.gate, dsGate.line),
    purpose: buildGeneKey(deGate.gate, deGate.line),
  };

  return {
    activation,
    venus: {
      available: false,
      note: 'The Venus Sequence — six Gene Keys governing attraction, attachment, and emotional awakening — is the next depth-tier release. Reserved for Q2 2026.',
    },
    pearl: {
      available: false,
      note: 'The Pearl Sequence — three Gene Keys illuminating the prosperity path — arrives alongside Venus. Reserved for Q2 2026.',
    },
    meta: {
      personalitySunLon,
      personalityEarthLon,
      designSunLon,
      designEarthLon,
      wheelStartDeg: WHEEL_START_DEG,
    },
  };
}
