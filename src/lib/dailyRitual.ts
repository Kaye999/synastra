// Daily Ritual — three habit-loop content pieces shown on the Dashboard for
// every tier (including The Two/free). Calculated deterministically from the
// date so the same user sees the same content as everyone else that day, and
// the same content reappears if they reload at noon vs midnight.
//
// Inspired by Moon Omens' free-tier daily content (planet of the day, daily
// affirmation, weekly aspect) — but computed locally with no LLM round-trip
// so it costs zero per render and works offline-from-Claude.

import * as Astronomy from 'astronomy-engine';

// ─── Planet of the Day ──────────────────────────────────────────────────────
// Chaldean planetary day rulership — the rulership scheme that gives the days
// their names in most European languages.

export type DailyPlanet = {
  planet: 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
  glyph: string;
  themes: string[];
  invitation: string;
};

const PLANETS_BY_WEEKDAY: Record<number, DailyPlanet> = {
  0: { // Sunday
    planet: 'Sun',
    glyph: '☉',
    themes: ['radiance', 'vitality', 'core self', 'sovereignty'],
    invitation: 'Stand in the light of your own life. Do the one thing that makes you most recognisable to yourself.',
  },
  1: { // Monday
    planet: 'Moon',
    glyph: '☽',
    themes: ['feeling', 'rhythm', 'sanctuary', 'memory'],
    invitation: 'Move at the pace your body actually has today. Receive what arrives; do not chase.',
  },
  2: { // Tuesday
    planet: 'Mars',
    glyph: '♂',
    themes: ['will', 'edge', 'courage', 'forward motion'],
    invitation: 'Pick the harder of the two things in front of you. Begin it before you feel ready.',
  },
  3: { // Wednesday
    planet: 'Mercury',
    glyph: '☿',
    themes: ['exchange', 'language', 'transit', 'curiosity'],
    invitation: 'Send the message you have been delaying. Ask the question whose answer would change your week.',
  },
  4: { // Thursday
    planet: 'Jupiter',
    glyph: '♃',
    themes: ['expansion', 'meaning', 'mercy', 'higher view'],
    invitation: 'Zoom out. Say yes to one thing larger than you would normally agree to carry.',
  },
  5: { // Friday
    planet: 'Venus',
    glyph: '♀',
    themes: ['beauty', 'attraction', 'relating', 'pleasure'],
    invitation: 'Make one room, meal, or message more beautiful than necessary. Let someone know you noticed them.',
  },
  6: { // Saturday
    planet: 'Saturn',
    glyph: '♄',
    themes: ['structure', 'time', 'consequence', 'mastery'],
    invitation: 'Honour a boundary you have been letting slip. Finish the thing that has been half-finished too long.',
  },
};

export function planetOfDay(date: Date = new Date()): DailyPlanet {
  return PLANETS_BY_WEEKDAY[date.getDay()];
}

// ─── Daily Affirmation ──────────────────────────────────────────────────────
// 7 affirmations × 7 planets = 49 entries, deterministically picked by
// floor(day-of-year / 7) so each affirmation runs ~once per week per planet
// but cycles through the year predictably.

const AFFIRMATIONS_BY_PLANET: Record<DailyPlanet['planet'], string[]> = {
  Sun: [
    'I am allowed to take up the space I was born to occupy.',
    'My presence is not a problem to be managed — it is a gift to be given.',
    'I am the steady centre around which my life arranges itself.',
    'I am visible without apology today.',
    'My light does not dim others; it invites them to brighten.',
    'I do not need permission to be myself.',
    'I lead from the warmth of my own clarity.',
  ],
  Moon: [
    'I am safe to feel what I feel, fully and without performance.',
    'I trust the wisdom that arrives in quiet.',
    'My rhythms are not deviations from productivity — they are the source of it.',
    'I belong to myself first.',
    'I do not have to be available to be loved.',
    'The tide of me will return; I do not need to force it.',
    'I am gentle with the part of me that is still learning.',
  ],
  Mars: [
    'I do not have to feel brave to act bravely.',
    'My anger is a signal, not a stain.',
    'I am allowed to want what I want, and to go for it.',
    'I move because I am alive — not because I am afraid.',
    'I trust the part of me that says: enough.',
    'I begin before I am certain. Certainty is downstream of action.',
    'I am sharper than I let myself be.',
  ],
  Mercury: [
    'I think clearly; I speak truthfully; I listen all the way through.',
    'Curiosity is my safer-than-certainty.',
    'I can ask any question without making it mean anything about me.',
    'The words I need will arrive in the moment I need them.',
    'I learn quickly because I am willing to be wrong.',
    'My mind is a tool I am still learning to use kindly.',
    'I am allowed to change my mind in public.',
  ],
  Jupiter: [
    'There is more than I can see, and most of it is in my favour.',
    'My life is permitted to be larger than I planned.',
    'Generosity opens doors that strategy cannot find.',
    'I do not have to shrink to be safe.',
    'I trust that meaning will reveal itself in the doing.',
    'I am one yes away from a different year.',
    'Abundance is not earned by suffering; it is allowed by widening.',
  ],
  Venus: [
    'I am worthy of beauty I have not yet imagined for myself.',
    'I attract by being more, not less, of who I actually am.',
    'My pleasure is not frivolous — it is intelligence.',
    'Love is the room I get to walk into, not the room I have to deserve.',
    'I let myself be seen, and stay anyway.',
    'I am allowed to enjoy this.',
    'I choose the softer way, where the softer way is also the truer one.',
  ],
  Saturn: [
    'I keep my own promises before I keep anyone else\'s.',
    'I am building something that requires my patience.',
    'Time is on my side when I work with it instead of against it.',
    'I respect the part of me that says: not yet.',
    'I do not have to do it all today. I have to do it well today.',
    'My limits are also my craft.',
    'Mastery is just attention, repeated.',
  ],
};

export function affirmationOfDay(date: Date = new Date()): string {
  const planet = planetOfDay(date).planet;
  const list = AFFIRMATIONS_BY_PLANET[planet];
  // Day-of-year keeps it stable across the day; integer-divide so the same
  // affirmation runs for a week before rotating.
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return list[Math.floor(dayOfYear / 7) % list.length];
}

// ─── Weekly Aspect ──────────────────────────────────────────────────────────
// Major aspect closest to today's date this week, computed from
// astronomy-engine ecliptic longitudes. Returns a one-line headline.

type MajorAspect = { name: string; degrees: number };
const MAJOR_ASPECTS: MajorAspect[] = [
  { name: 'conjunct', degrees: 0 },
  { name: 'sextile', degrees: 60 },
  { name: 'square', degrees: 90 },
  { name: 'trine', degrees: 120 },
  { name: 'opposite', degrees: 180 },
];

const ASPECT_VOICE: Record<string, string> = {
  conjunct: 'fuse',
  sextile: 'reach toward',
  square: 'press on',
  trine: 'flow into',
  opposite: 'face',
};

const OUTER_BODIES: Astronomy.Body[] = [
  Astronomy.Body.Sun,
  Astronomy.Body.Mercury,
  Astronomy.Body.Venus,
  Astronomy.Body.Mars,
  Astronomy.Body.Jupiter,
  Astronomy.Body.Saturn,
];

function eclipticLongitude(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  return ((ecl.elon % 360) + 360) % 360;
}

function angularDiff(a: number, b: number): number {
  const d = Math.abs(((a - b + 540) % 360) - 180);
  return d;
}

export type WeeklyAspect = {
  headline: string;
  bodyA: string;
  bodyB: string;
  aspect: string;
};

export function weeklyAspect(date: Date = new Date()): WeeklyAspect {
  // Look across this week — same Monday-start window as a normal calendar.
  // Best aspect = smallest orb (closest exact).
  const start = new Date(date);
  const diffToMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(12, 0, 0, 0);

  let best: { orb: number; aspect: MajorAspect; a: Astronomy.Body; b: Astronomy.Body } | null = null;

  for (let d = 0; d < 7; d++) {
    const probe = new Date(start);
    probe.setDate(start.getDate() + d);
    const longitudes: Map<Astronomy.Body, number> = new Map();
    for (const body of OUTER_BODIES) longitudes.set(body, eclipticLongitude(body, probe));
    for (let i = 0; i < OUTER_BODIES.length; i++) {
      for (let j = i + 1; j < OUTER_BODIES.length; j++) {
        const a = OUTER_BODIES[i];
        const b = OUTER_BODIES[j];
        const diff = angularDiff(longitudes.get(a)!, longitudes.get(b)!);
        for (const asp of MAJOR_ASPECTS) {
          const orb = Math.abs(diff - asp.degrees);
          if (!best || orb < best.orb) best = { orb, aspect: asp, a, b };
        }
      }
    }
  }

  // Astronomy.Body is a string enum; rendering the value gives "Mars" etc.
  const bodyA = String(best!.a);
  const bodyB = String(best!.b);
  const verb = ASPECT_VOICE[best!.aspect.name] ?? 'meet';
  return {
    headline: `${bodyA} and ${bodyB} ${verb} this week — a ${best!.aspect.name} at ${best!.orb.toFixed(1)}° orb.`,
    bodyA,
    bodyB,
    aspect: best!.aspect.name,
  };
}

// ─── Public composite ──────────────────────────────────────────────────────

export type DailyRitualPayload = {
  date: string; // ISO date
  planet: DailyPlanet;
  affirmation: string;
  weekly: WeeklyAspect;
};

export function dailyRitual(date: Date = new Date()): DailyRitualPayload {
  return {
    date: date.toISOString().slice(0, 10),
    planet: planetOfDay(date),
    affirmation: affirmationOfDay(date),
    weekly: weeklyAspect(date),
  };
}
