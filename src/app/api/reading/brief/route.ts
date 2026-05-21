// /api/reading/brief — public, no-auth Natal Brief.
//
// Used by the /reading lead-magnet landing. Takes raw birth data, returns
// Sun · Moon · Rising · Life Path with one-paragraph interpretations drawn
// from the existing SIGN_ESSENCE / PLANET_IN_SIGN tables. No LLM call — the
// prose is hand-written, so this endpoint is free and instant.

import { NextResponse } from 'next/server';
import { computeTropicalChart } from '@/lib/engines/astro';
import { computeNumerology, NUM_MEANINGS } from '@/lib/engines/numerology';
import { SIGN_ESSENCE, PLANET_IN_SIGN } from '@/lib/interp/tables';
import type { AstroInput } from '@/lib/types';

export const runtime = 'nodejs';

type Body = {
  fullName?: string;
  dob?: { y?: number; m?: number; d?: number };
  time?: { h?: number; m?: number };
  timeUnknown?: boolean;
  coords?: { lat?: number; lon?: number; tzOffset?: number };
};

type Card = { headline: string; sign: string | null; body: string };

function signOf(longitude: number | undefined): string | null {
  if (typeof longitude !== 'number') return null;
  const signs = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
  ];
  const idx = Math.floor((((longitude % 360) + 360) % 360) / 30);
  return signs[idx] ?? null;
}

function describeSun(sign: string | null): Card {
  if (!sign) return { headline: 'Sun', sign: null, body: 'A solar essence we could not place from the data given.' };
  const prose = (PLANET_IN_SIGN as Record<string, Record<string, string>>).Sun?.[sign] ?? '';
  const essence = (SIGN_ESSENCE as Record<string, { title: string }>)[sign]?.title ?? sign;
  return {
    headline: `Sun in ${sign}`,
    sign,
    body: prose || `The core of who you are wears ${sign} — ${essence}.`,
  };
}

function describeMoon(sign: string | null): Card {
  if (!sign) return { headline: 'Moon', sign: null, body: 'The Moon could not be placed without a workable birth date.' };
  const prose = (PLANET_IN_SIGN as Record<string, Record<string, string>>).Moon?.[sign] ?? '';
  const essence = (SIGN_ESSENCE as Record<string, { title: string }>)[sign]?.title ?? sign;
  return {
    headline: `Moon in ${sign}`,
    sign,
    body: prose || `Your inner weather runs through ${sign} — ${essence}.`,
  };
}

function describeRising(sign: string | null, timeUnknown: boolean): Card {
  if (timeUnknown || !sign) {
    return {
      headline: 'Rising',
      sign: null,
      body: 'Your Rising sign needs an accurate birth time — when you have one (even within twenty minutes) it pins your house cusps and the way the world first reads you.',
    };
  }
  const ess = (SIGN_ESSENCE as Record<string, { body: string; title: string }>)[sign];
  return {
    headline: `${sign} Rising`,
    sign,
    body: ess?.body ?? `${sign} sits on your eastern horizon — the face that meets the world before you do.`,
  };
}

function describeLifePath(name: string, dob: { y: number; m: number; d: number }): Card {
  try {
    const numerology = computeNumerology(name || 'A', dob, new Date().getFullYear());
    const lp = numerology.lifePath;
    const meaning = NUM_MEANINGS[lp];
    return {
      headline: `Life Path ${lp}`,
      sign: null,
      body: meaning?.general ?? `Life Path ${lp} — a numerological signature of your birth date.`,
    };
  } catch {
    return { headline: 'Life Path', sign: null, body: 'A workable date is needed to compute your Life Path.' };
  }
}

export async function POST(request: Request) {
  let body: Body = {};
  try { body = await request.json(); } catch { /* fall through */ }

  const { dob, time, timeUnknown = !time?.h, coords, fullName } = body;
  if (!dob?.y || !dob?.m || !dob?.d) {
    return NextResponse.json({ error: 'Date of birth required.' }, { status: 400 });
  }

  const lat = coords?.lat ?? 0;
  const lon = coords?.lon ?? 0;
  const tzOffset = coords?.tzOffset ?? 0;
  const astroInput: AstroInput = {
    dob: { y: dob.y, m: dob.m, d: dob.d },
    time: { h: time?.h ?? 12, m: time?.m ?? 0 },
    timeUnknown: !!timeUnknown,
    lat,
    lon,
    tzOffset,
  };

  const chart = computeTropicalChart(astroInput);
  const sun = chart.planets.find((p) => p.planet === 'Sun');
  const moon = chart.planets.find((p) => p.planet === 'Moon');
  const sunSign = signOf(sun?.longitude);
  const moonSign = signOf(moon?.longitude);
  const ascSign = chart.ascendant?.sign ?? null;

  const cards: Card[] = [
    describeSun(sunSign),
    describeMoon(moonSign),
    describeRising(ascSign, !!timeUnknown),
    describeLifePath(fullName ?? '', { y: dob.y, m: dob.m, d: dob.d }),
  ];

  return NextResponse.json({
    cards,
    placements: { sun: sunSign, moon: moonSign, rising: ascSign },
    timeUnknown: !!timeUnknown,
  });
}
