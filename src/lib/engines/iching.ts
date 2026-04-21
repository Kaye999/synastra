// I Ching engine — deterministic daily hexagrams and seeded consultations.
//
// Uses the classical three-coin method to generate six lines bottom-to-top.
// Heads counted as 3, tails as 2. Totals:
//   6 → changing yin   (old yin, transforms to yang)
//   7 → young yang     (static solid line)
//   8 → young yin      (static broken line)
//   9 → changing yang  (old yang, transforms to yin)
//
// Seeding:
//   - Daily:        sha256(userId + 'YYYY-MM-DD')        → reproducible per day
//   - Consultation: sha256(userId + timestamp + question) → unique per ask
//
// Both return a Consultation with primary hexagram, changing line positions,
// and (if any lines change) the resulting hexagram they transform into.

import { createHash } from 'crypto';
import { HEXAGRAMS, type HexagramEntry } from '../interp/iching-hexagrams';

/* ============================================================
 * Public types
 * ============================================================ */

export type HexagramLine = {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  keywords: string[];
};

export type Hexagram = {
  number: number; // 1-64, King Wen sequence
  name: string;
  chinese: string;
  trigrams: { upper: string; lower: string };
  image: string;
  judgement: string;
  lines: HexagramLine[];
};

export type Consultation = {
  primary: Hexagram;
  changingLines: number[]; // 1-based positions (bottom=1, top=6)
  resulting: Hexagram | null;
};

/* ============================================================
 * Seeded RNG — deterministic PRNG driven by sha256 of a seed string.
 * Pulls 32-bit integers out of the hash stream; rehashes when exhausted.
 * ============================================================ */

class SeededRng {
  private seed: string;
  private buffer: Buffer;
  private offset = 0;

  constructor(seed: string) {
    this.seed = seed;
    this.buffer = createHash('sha256').update(seed).digest();
  }

  private nextUint32(): number {
    if (this.offset + 4 > this.buffer.length) {
      // Rehash with a counter to extend the stream deterministically.
      this.buffer = createHash('sha256')
        .update(this.seed)
        .update(this.buffer)
        .digest();
      this.offset = 0;
    }
    const v = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return v;
  }

  // Uniform integer in [0, max).
  nextInt(max: number): number {
    return this.nextUint32() % max;
  }

  // Single coin flip — heads=true, tails=false.
  flipCoin(): boolean {
    return (this.nextUint32() & 1) === 1;
  }
}

/* ============================================================
 * Three-coin method — toss three coins, sum values (H=3, T=2).
 * Returns 6, 7, 8 or 9 per toss.
 * ============================================================ */

function tossLine(rng: SeededRng): 6 | 7 | 8 | 9 {
  let total = 0;
  for (let i = 0; i < 3; i++) {
    total += rng.flipCoin() ? 3 : 2;
  }
  // Always 6, 7, 8 or 9 by construction.
  return total as 6 | 7 | 8 | 9;
}

/* ============================================================
 * Trigram & hexagram lookup — build a 64-element King Wen index from the
 * interpretation table. The lookup key is the 6-bit binary representation
 * of the hexagram (bottom line = LSB, 1 = yang, 0 = yin).
 * ============================================================ */

// King Wen sequence ordered by upper/lower trigram binary key. This is NOT
// a simple binary-count — the King Wen order is traditional and non-obvious.
// We encode each of the 64 hexagrams by its 6-bit binary signature derived
// from the interp table's trigram names.
const TRIGRAM_BIN: Record<string, number> = {
  Heaven:   0b111,
  Lake:     0b110,
  Fire:     0b101,
  Thunder:  0b100,
  Wind:     0b011,
  Water:    0b010,
  Mountain: 0b001,
  Earth:    0b000,
};

function hexagramBinary(entry: HexagramEntry): number {
  const upper = TRIGRAM_BIN[entry.trigrams.upper] ?? 0;
  const lower = TRIGRAM_BIN[entry.trigrams.lower] ?? 0;
  // Lower trigram occupies positions 1-3 (bits 0-2), upper occupies 4-6 (bits 3-5).
  return (upper << 3) | lower;
}

// Build a lookup: binary-key → hexagram number (1-64) once at module load.
const BINARY_TO_KW: Record<number, number> = (() => {
  const map: Record<number, number> = {};
  for (const entry of HEXAGRAMS) {
    map[hexagramBinary(entry)] = entry.number;
  }
  return map;
})();

function hexagramFromLines(lines: Array<6 | 7 | 8 | 9>): Hexagram {
  // Build binary: yang (7 or 9) = 1, yin (6 or 8) = 0. Line 1 is the bottom.
  let bin = 0;
  for (let i = 0; i < 6; i++) {
    const isYang = lines[i] === 7 || lines[i] === 9;
    if (isYang) bin |= (1 << i);
  }
  const kw = BINARY_TO_KW[bin];
  const entry = HEXAGRAMS.find((h) => h.number === kw);
  if (!entry) {
    throw new Error(`I Ching: no hexagram for binary ${bin.toString(2)}`);
  }
  return {
    number: entry.number,
    name: entry.name,
    chinese: entry.chinese,
    trigrams: { upper: entry.trigrams.upper, lower: entry.trigrams.lower },
    image: entry.image,
    judgement: entry.judgement,
    lines: entry.lines.map((l) => ({
      position: l.position,
      text: l.text,
      keywords: [...l.keywords],
    })),
  };
}

/* ============================================================
 * Core cast — six tosses, compute primary + changing lines + (optional)
 * resulting hexagram where changing lines have transformed.
 * ============================================================ */

function cast(rng: SeededRng): Consultation {
  const tosses: Array<6 | 7 | 8 | 9> = [
    tossLine(rng), tossLine(rng), tossLine(rng),
    tossLine(rng), tossLine(rng), tossLine(rng),
  ];

  const primary = hexagramFromLines(tosses);
  const changingLines: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (tosses[i] === 6 || tosses[i] === 9) changingLines.push(i + 1);
  }

  let resulting: Hexagram | null = null;
  if (changingLines.length > 0) {
    // Changing yang (9) → yin (becomes 8). Changing yin (6) → yang (becomes 7).
    const transformed = tosses.map((t) => {
      if (t === 9) return 8 as const;
      if (t === 6) return 7 as const;
      return t;
    });
    resulting = hexagramFromLines(transformed);
  }

  return { primary, changingLines, resulting };
}

/* ============================================================
 * Public API
 * ============================================================ */

function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Deterministic daily hexagram for a given user on a given date.
 * The same (userId, date) always produces the same Consultation.
 */
export function dailyHexagram(userId: string, date: Date): Consultation {
  const seed = `iching-daily:${userId}:${formatDateKey(date)}`;
  return cast(new SeededRng(seed));
}

/**
 * Consultation driven by the user's question. Seeded with the current
 * timestamp so repeated asks produce distinct castings — this is the
 * traditional behaviour of the oracle.
 */
export function consultWithQuestion(userId: string, question: string): Consultation {
  const ts = Date.now().toString();
  const seed = `iching-consult:${userId}:${ts}:${question.trim()}`;
  return cast(new SeededRng(seed));
}

/**
 * Deterministic consultation variant — useful for tests and reproducible
 * server-side work where the caller supplies the timestamp seed themselves.
 */
export function consultWithSeed(userId: string, seedSuffix: string): Consultation {
  const seed = `iching-consult:${userId}:${seedSuffix}`;
  return cast(new SeededRng(seed));
}
