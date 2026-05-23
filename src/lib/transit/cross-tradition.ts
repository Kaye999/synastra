// cross-tradition.ts
//
// Enriches a Western transit (DetectedTransit) with parallel readings
// from three other traditions: Vedic, Tarot, and Astrocartography.
//
// The principle: the same astronomical moment can be read through
// multiple lineages. When several systems point at the same theme,
// the pattern survives every filter — that is how Synastra decides
// what to trust (see "How it works", Act 2).
//
// MVP scope (this file): static planet → tradition correspondences,
// plus the user's mahadasha at the transit date (real computation
// from existing engine) and the user's tarot draw for the transit
// date (real, deterministic from userId + date).
//
// Future: live Vedic transit (Guru gocara), live astrocartography
// line positions on the transit date, Kabbalah / Human Design / full
// Numerology — once each engine exposes a date-parameterised reading.

import type { DetectedTransit } from '@/lib/prompts/transit-detector';
import type { Mahadasha, DashaPeriod } from '@/lib/types';
import { dailyCard } from '@/lib/engines/tarot';

/* ============================================================
 * Tradition correspondences (static lookups)
 * ============================================================ */

// Each planet maps to a Major Arcana card. Standard Golden Dawn /
// Crowley correspondences where they exist; modern attributions for
// the trans-Saturnians.
const PLANET_TO_MAJOR_ARCANA: Record<string, { card: string; meaning: string }> = {
  Sun:     { card: 'The Sun',              meaning: 'vitality, clarity, the self made visible' },
  Moon:    { card: 'The High Priestess',   meaning: 'inner knowing, intuition, the unseen tide' },
  Mercury: { card: 'The Magician',         meaning: 'communication, intellect, the will channelled' },
  Venus:   { card: 'The Empress',          meaning: 'love, beauty, abundance, magnetism' },
  Mars:    { card: 'The Tower',            meaning: 'rupture, action, the forced breakthrough' },
  Jupiter: { card: 'The Wheel of Fortune', meaning: 'expansion, luck, the cycle turning toward you' },
  Saturn:  { card: 'The World',            meaning: 'completion, structure, the long lesson finishing' },
  Uranus:  { card: 'The Fool',             meaning: 'sudden change, leap of faith, the unexpected door' },
  Neptune: { card: 'The Hanged Man',       meaning: 'dissolution, surrender, the in-between' },
  Pluto:   { card: 'Judgement',            meaning: 'transformation, rebirth, the final reckoning' },
};

// Vedic karaka (significator) for each planet — the life domain
// classical jyotish assigns to that graha. Outer planets are flagged
// as non-classical so we don't pretend Uranus is in the canon.
const PLANET_TO_VEDIC_KARAKA: Record<string, { karaka: string; sphere: string }> = {
  Sun:     { karaka: 'Atma karaka (Surya)',      sphere: 'soul, authority, the father' },
  Moon:    { karaka: 'Manas karaka (Chandra)',   sphere: 'mind, mother, emotional flow' },
  Mercury: { karaka: 'Vidya karaka (Budha)',     sphere: 'speech, learning, kin' },
  Venus:   { karaka: 'Kama karaka (Shukra)',     sphere: 'love, beauty, partnership' },
  Mars:    { karaka: 'Bhratri karaka (Mangal)',  sphere: 'courage, siblings, drive' },
  Jupiter: { karaka: 'Guru karaka (Guru)',       sphere: 'wisdom, children, dharma' },
  Saturn:  { karaka: 'Karma karaka (Shani)',     sphere: 'karma, discipline, longevity' },
  Uranus:  { karaka: 'non-classical',            sphere: 'sudden disruption (modern attribution)' },
  Neptune: { karaka: 'non-classical',            sphere: 'maya, dissolution (modern attribution)' },
  Pluto:   { karaka: 'non-classical',            sphere: 'death-rebirth (modern attribution)' },
};

// Astrocartography "line" type per planet — what activates when the
// transiting planet hits an angle on the user's locality map.
const PLANET_TO_ASTROCARTO_LINE: Record<string, { line: string; effect: string }> = {
  Sun:     { line: 'Sun line',     effect: 'recognition, visibility, becoming known' },
  Moon:    { line: 'Moon line',    effect: 'belonging, home, emotional anchoring' },
  Mercury: { line: 'Mercury line', effect: 'study, writing, conversation, deals' },
  Venus:   { line: 'Venus line',   effect: 'love, beauty, sweetness, ease' },
  Mars:    { line: 'Mars line',    effect: 'drive, conflict, forging, breakthrough' },
  Jupiter: { line: 'Jupiter line', effect: 'expansion, luck, teachers, opportunity' },
  Saturn:  { line: 'Saturn line',  effect: 'work, mastery, weight, structure' },
  Uranus:  { line: 'Uranus line',  effect: 'awakening, freedom, sudden shifts' },
  Neptune: { line: 'Neptune line', effect: 'dreams, art, ocean, dissolution' },
  Pluto:   { line: 'Pluto line',   effect: 'death-rebirth, power, transformation' },
};

// Plain-English verb for each aspect (used in headline phrasing)
const ASPECT_PHRASE: Record<string, string> = {
  conjunction: 'fuses with',
  opposition:  'pulls against',
  square:      'cuts across',
  trine:       'flows into',
  sextile:     'opens to',
};

/* ============================================================
 * Public types
 * ============================================================ */

export type TraditionPanel = {
  headline: string;  // one-line synthesis (UI card title)
  detail: string;    // longer narrative (UI expanded body)
};

export type CrossTraditionEnrichment = {
  western: TraditionPanel;
  vedic: TraditionPanel;
  tarot: TraditionPanel;
  astrocartography: TraditionPanel;
};

export type EnrichInput = {
  transit: DetectedTransit;
  userId: string;           // needed for deterministic tarot draw
  mahadasha?: Mahadasha;    // optional — caller computes from natal Moon
};

/* ============================================================
 * Helpers
 * ============================================================ */

function findDashaAt(maha: Mahadasha, date: Date): DashaPeriod | null {
  for (const d of maha.allDashas) {
    if (date >= d.start && date < d.end) return d;
  }
  return null;
}

function formatAU(d: Date): string {
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ============================================================
 * Main entry point
 * ============================================================ */

export function enrichTransit({ transit, userId, mahadasha }: EnrichInput): CrossTraditionEnrichment {
  const { planet, aspect, target, exactDate } = transit;
  const date = new Date(exactDate);
  const phrase = ASPECT_PHRASE[aspect] ?? aspect;

  // ── Western: restate the transit in plain language ────────────
  const western: TraditionPanel = {
    headline: `${planet} ${phrase} your ${target}`,
    detail:
      `Transiting ${planet} forms an exact ${aspect} to your natal ${target} ` +
      `on ${formatAU(date)}. The Western reading: this is the planet's signature ` +
      `playing out against the natal point — the same archetype Synastra's "This Year" ` +
      `panel scores by potency.`,
  };

  // ── Vedic: planet's karaka + active mahadasha at transit date ─
  const karaka = PLANET_TO_VEDIC_KARAKA[planet];
  let vedicHeadline = `${planet} as ${karaka?.karaka ?? 'modern significator'}`;
  let vedicDetail =
    `In jyotish, ${planet} is ${karaka?.karaka ?? 'a non-classical body'} — ` +
    `governing ${karaka?.sphere ?? 'modern themes outside the canonical seven grahas'}.`;
  if (mahadasha) {
    const dasha = findDashaAt(mahadasha, date);
    if (dasha) {
      vedicHeadline = `${dasha.lord} mahadasha · ${planet} as ${karaka?.karaka ?? 'significator'}`;
      vedicDetail =
        `On ${formatAU(date)} you are in your ${dasha.lord} mahadasha — the ${dasha.years}-year ` +
        `planetary period that colours every transit underneath it. The Western event ` +
        `(${planet} ${phrase} ${target}) is filtered through ${dasha.lord}'s themes. ` +
        `${planet} itself is ${karaka?.karaka ?? 'a non-classical body'} — ${karaka?.sphere ?? 'modern themes'}.`;
    }
  }
  const vedic: TraditionPanel = { headline: vedicHeadline, detail: vedicDetail };

  // ── Tarot: planet's Major Arcana + user's draw for that day ──
  const arc = PLANET_TO_MAJOR_ARCANA[planet];
  const draw = dailyCard(userId, date);
  const drawName = `${draw.card.name}${draw.reversed ? ' (reversed)' : ''}`;
  const tarotHeadline = arc
    ? `${arc.card} (${planet}) meets ${drawName}`
    : `${planet}'s archetype meets ${drawName}`;
  const tarotDetail = arc
    ? `${planet} corresponds to ${arc.card} — ${arc.meaning}. Your draw for ` +
      `${formatAU(date)} is ${drawName}. Read together, the two cards frame ` +
      `the transit's energetic colour: the standing archetype of ${planet}, ` +
      `crossed with the card that surfaces for you specifically on this day.`
    : `Your draw for ${formatAU(date)} is ${drawName}. ${planet} sits outside the ` +
      `classical Tarot correspondences, so the day's card carries the reading on its own.`;
  const tarot: TraditionPanel = { headline: tarotHeadline, detail: tarotDetail };

  // ── Astrocartography: planet's line type + activation note ────
  const line = PLANET_TO_ASTROCARTO_LINE[planet];
  const astrocartography: TraditionPanel = {
    headline: `${line?.line ?? planet + ' line'} activated`,
    detail:
      `During this transit, your astrocartographic ${line?.line ?? planet + ' line'} ` +
      `runs live. The line itself signifies ${line?.effect ?? 'modern themes'} — places ` +
      `the line passes through become more potent for those themes during the window ` +
      `(${formatAU(new Date(transit.orbEnterDate))} → ${formatAU(new Date(transit.orbExitDate))}). ` +
      `Open your map page to see exactly which cities the line crosses.`,
  };

  return { western, vedic, tarot, astrocartography };
}
