/*
 * astrocarto.ts — Astrocartography engine (planetary lines on a world map).
 *
 * Ported from engine-astrocarto.js (archive: astral-saas-static-20260422).
 * Preserves all compute logic, interpretation tables, and reverse-geocoder
 * dataset. UI rendering (SVG string builder + DOM-tooltip wiring) omitted.
 *
 * WHAT IS ASTROCARTOGRAPHY?
 * For each planet in the natal chart, we compute the set of places on Earth
 * where that planet was angular at the instant of birth. Four lines exist
 * per planet:
 *   MC (Medium Coeli)  — the meridian where the planet was culminating.
 *   IC (Imum Coeli)    — the meridian 180° opposite, underfoot.
 *   AC (Ascendant)     — a curve of longitudes where the planet was rising.
 *   DC (Descendant)    — a curve where the planet was setting.
 *
 * SELF-TEST — Ethan, 2004-07-23 06:30 AEST (Sydney lat -33.87 lon +151.21 tz +10).
 * Sun natal ecliptic longitude ≈ 120°29' (0° Leo). Sun was rising at Sydney,
 * so the Sun AC curve passes ≈ +151° E at latitude -33.87°. By construction:
 *   Expected Sun MC longitude : ≈ +60°  (Indian Ocean)
 *   Expected Sun IC longitude : ≈ -120° (Pacific west of Los Angeles) ← the test target
 *   Expected Sun AC longitude : ≈ +151° at -33.87° (Sydney)
 *   Expected Sun DC longitude : ≈ -29°  (mid-Atlantic)
 *
 * CAVEATS (from source)
 * - β = 0 (ecliptic latitude) assumed for all bodies — ~1° error near nodes.
 * - AC/DC curves clipped at |lat| > 66° (polar-circumpolar breakdown).
 * - Reverse geocoder has ~75 curated cities; matches flagged "near" not exact.
 */

import * as Astronomy from 'astronomy-engine';
import type { BirthData, Chart } from '../types';

/* ============================================================
 * Types
 * ============================================================ */

export type AstrocartoAngle = 'MC' | 'IC' | 'AC' | 'DC';

export type AstrocartoPlanetLine = {
  planet: string;
  color: string;
  personal: boolean;
  eclipticLongitude: number;
  rightAscension: number;
  declination: number;
  mc: { lon: number };
  ic: { lon: number };
  ac: Array<[number, number]>; // [lon, lat] pairs
  dc: Array<[number, number]>;
};

export type AstrocartoMeta = {
  birthUTC: string;
  lat: number;
  lon: number;
  tzOffset: number;
  gmst: number;
  obliquity: number;
};

export type AstrocartoResult = {
  planets: AstrocartoPlanetLine[];
  meta: AstrocartoMeta | null;
  error?: string;
};

export type AstrocartoCity = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

export type AstrocartoCityMatch = {
  city: AstrocartoCity;
  delta: number;
};

export type AstrocartoNearestCity = {
  city: AstrocartoCity;
  distanceDeg: number;
};

export type AstrocartoLineDef = {
  title: string;
  body: string;
};

export type AstrocartoRankedLine = {
  planet: string;
  angle: AstrocartoAngle;
  color: string;
  personal: boolean;
  title: string;
  body: string;
  score: number;
  cities: AstrocartoCityMatch[];
  mcLon: number | null;
};

// BirthData augmented with resolved coords/tz (shape that the SaaS uses
// after resolveCityCoords). We accept this superset so callers can pass
// their extended shape directly.
type BirthDataWithCoords = BirthData & {
  lat?: number;
  lon?: number;
  tzOffset?: number;
};

/* ============================================================
 * Constants
 * ============================================================ */

export const ASTROCARTO_TOK = {
  bg: '#0A0E1A',
  bgDeep: '#060912',
  bgRaise: '#131828',
  ink: '#FCFAF6',
  inkDim: '#CFC5B1',
  inkFaint: '#7B7361',
  brass: '#C8A052',
  ember: '#A84B3E',
  rule: 'rgba(252,250,246,0.08)',
} as const;

// Palette per planet — chosen for visual distinction on a dark map.
export const ASTROCARTO_PLANET_COLORS: Record<string, string> = {
  Sun:      '#F2C14E',  // warm gold
  Moon:     '#D7E1EC',  // silver
  Mercury:  '#9DD1A7',  // pale green
  Venus:    '#E89AC3',  // rose pink
  Mars:     '#D9543B',  // ember red
  Jupiter:  '#C8A052',  // brass
  Saturn:   '#7B7361',  // dim taupe
  Uranus:   '#6EC1D2',  // ice cyan
  Neptune:  '#8AA6E0',  // sea blue
  Pluto:    '#7A4E9F',  // plum
};

// Personal vs outer — drives stroke width and opacity.
const ASTROCARTO_PERSONAL: Record<string, boolean> = {
  Sun: true, Moon: true, Mercury: true, Venus: true, Mars: true,
};

// Planets we render lines for. Order matters for the legend.
export const ASTROCARTO_PLANETS: readonly string[] = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
];

// Latitude clamp — AC/DC curves blow up inside polar regions.
const LAT_LIMIT = 66;

/* ============================================================
 * Angle helpers
 * ============================================================ */

const deg2rad = (d: number): number => (d * Math.PI) / 180;
const rad2deg = (r: number): number => (r * 180) / Math.PI;

function norm360(x: number): number {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

// Normalise into (-180, +180] — natural geographic-longitude range.
function norm180(x: number): number {
  let v = ((x + 180) % 360 + 360) % 360 - 180;
  if (v <= -180) v += 360;
  return v;
}

/* ============================================================
 * Ecliptic → equatorial conversion (β = 0)
 * ============================================================ */

function eclipticToEquatorial(lambdaDeg: number, epsDeg: number): { ra: number; dec: number } {
  const lam = deg2rad(lambdaDeg);
  const eps = deg2rad(epsDeg);
  const sinL = Math.sin(lam);
  const cosL = Math.cos(lam);
  const sinE = Math.sin(eps);
  const cosE = Math.cos(eps);

  // RA = atan2(sin λ · cos ε, cos λ)     (because β = 0)
  const ra = rad2deg(Math.atan2(sinL * cosE, cosL));
  // Dec = asin(sin λ · sin ε)
  const dec = rad2deg(Math.asin(sinL * sinE));

  return { ra: norm360(ra), dec };
}

// Mean obliquity of the ecliptic (IAU 1980), degrees.
function meanObliquityDeg(astroTime: Astronomy.AstroTime): number {
  const T = astroTime.tt / 36525.0;
  const seconds =
    84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return seconds / 3600.0;
}

// Greenwich Mean Sidereal Time, in degrees (0..360).
function gmstDeg(astroTime: Astronomy.AstroTime): number {
  const gstHours = Astronomy.SiderealTime(astroTime);
  return norm360(gstHours * 15.0);
}

/* ============================================================
 * Line computation
 * ============================================================ */

// MC line longitude (east-of-Greenwich, -180..+180) where the planet is on
// the upper meridian. IC is mcLon + 180.
//   mcLon = ra − GMST
function mcLongitude(raDeg: number, gmstDegV: number): number {
  return norm180(raDeg - gmstDegV);
}

// Hour-angle at the horizon for observer latitude & declination.
// Returns H in degrees ∈ [0, 180] or null if circumpolar / never visible.
//   cos(H) = -tan(lat) · tan(dec)
function horizonHourAngle(latDeg: number, decDeg: number): number | null {
  const lat = deg2rad(latDeg);
  const dec = deg2rad(decDeg);
  const arg = -Math.tan(lat) * Math.tan(dec);
  if (arg < -1 || arg > 1) return null;
  return rad2deg(Math.acos(arg));
}

/*
 * AC (rising) and DC (setting) curves, sampled every 3° of latitude.
 *
 *   Rising:  HA = -H  →  lon = (RA - H) - GMST
 *   Setting: HA = +H  →  lon = (RA + H) - GMST
 */
function horizonCurves(
  raDeg: number,
  decDeg: number,
  gmstDegV: number,
): { ac: Array<[number, number]>; dc: Array<[number, number]> } {
  const ac: Array<[number, number]> = [];
  const dc: Array<[number, number]> = [];
  const step = 3;
  for (let lat = -LAT_LIMIT; lat <= LAT_LIMIT; lat += step) {
    const H = horizonHourAngle(lat, decDeg);
    if (H == null) continue;
    const acLon = norm180(raDeg - H - gmstDegV);
    const dcLon = norm180(raDeg + H - gmstDegV);
    ac.push([acLon, lat]);
    dc.push([dcLon, lat]);
  }
  return { ac, dc };
}

/* ============================================================
 * Birth data → UTC Date
 * ============================================================ */

function birthDataToUTCDate(birthData: BirthDataWithCoords): Date | null {
  if (!birthData || !birthData.dob) return null;
  const { y, m, d } = birthData.dob;
  const hour = birthData.timeUnknown ? 12 : birthData.time?.h ?? 0;
  const minute = birthData.timeUnknown ? 0 : birthData.time?.m ?? 0;
  const tz = birthData.tzOffset ?? 0;
  let utcMs = Date.UTC(y, m - 1, d, hour, minute, 0);
  utcMs -= tz * 3600 * 1000;
  return new Date(utcMs);
}

/* ============================================================
 * Top-level compute
 * ============================================================ */

export function computeAstrocarto(
  birthData: BirthDataWithCoords,
  tropicalChart: Chart,
): AstrocartoResult {
  if (!birthData || !tropicalChart || !tropicalChart.planets) {
    return { planets: [], meta: null, error: 'missing inputs' };
  }

  const utcDate = birthDataToUTCDate(birthData);
  if (!utcDate) return { planets: [], meta: null, error: 'bad birth data' };

  const astroTime = new Astronomy.AstroTime(utcDate);
  const gmst = gmstDeg(astroTime);
  const eps = meanObliquityDeg(astroTime);

  // Index the natal longitudes by planet name.
  const lonByPlanet: Record<string, number> = {};
  for (const p of tropicalChart.planets) {
    lonByPlanet[p.planet] = p.longitude;
  }

  const out: AstrocartoPlanetLine[] = [];
  for (const name of ASTROCARTO_PLANETS) {
    const lam = lonByPlanet[name];
    if (typeof lam !== 'number') continue;

    const eq = eclipticToEquatorial(lam, eps);
    const mcLon = mcLongitude(eq.ra, gmst);
    const icLon = norm180(mcLon + 180);
    const curves = horizonCurves(eq.ra, eq.dec, gmst);

    out.push({
      planet: name,
      color: ASTROCARTO_PLANET_COLORS[name] ?? ASTROCARTO_TOK.brass,
      personal: !!ASTROCARTO_PERSONAL[name],
      eclipticLongitude: lam,
      rightAscension: eq.ra,
      declination: eq.dec,
      mc: { lon: mcLon },
      ic: { lon: icLon },
      ac: curves.ac,
      dc: curves.dc,
    });
  }

  return {
    planets: out,
    meta: {
      birthUTC: utcDate.toISOString(),
      lat: birthData.lat ?? 0,
      lon: birthData.lon ?? 0,
      tzOffset: birthData.tzOffset ?? 0,
      gmst,
      obliquity: eps,
    },
  };
}

/* ============================================================
 * Line interpretations — 40 cells (10 planets × 4 angles)
 * ============================================================ */

export const ASTROCARTO_LINES: Record<string, Record<AstrocartoAngle, AstrocartoLineDef>> = {
  Sun: {
    MC: {
      title: 'Sun on the MC',
      body:
        'Places under your Sun MC line are where you are recognised. Your ' +
        'natural authority is visible here — work, title and reputation take ' +
        'centre stage, and the room turns toward you without effort. If you ' +
        'have ambitions you want the world to watch, move closer to this ' +
        'meridian; the light finds you here.',
    },
    IC: {
      title: 'Sun on the IC',
      body:
        'Sun IC places feel like home in the quiet sense — roots, privacy, ' +
        'and the raw material of who you are. You rebuild your inner life ' +
        'here, often out of public view. The ambition dims; the identity ' +
        'deepens. Good for sabbaticals, family, and the long interior work ' +
        'that never fits on a CV.',
    },
    AC: {
      title: 'Sun rising',
      body:
        'Along your Sun AC line you walk into rooms as yourself. The mask ' +
        'thins and the essence becomes legible to strangers. People see ' +
        'your confidence and your warmth before you speak. This is the ' +
        "classic 'good skin' line — a place to reintroduce yourself to " +
        'your own life.',
    },
    DC: {
      title: 'Sun setting',
      body:
        'On the Sun DC line the most important encounters are with other ' +
        'people. Partners and rivals shine brighter than you do, and the ' +
        'relationship itself becomes the teacher. Not a bad line — simply ' +
        'a place where you learn who you are by watching who comes toward ' +
        'you.',
    },
  },

  Moon: {
    MC: {
      title: 'Moon on the MC',
      body:
        'Under a Moon MC line your public face is nurturing. You are known ' +
        'for how you make people feel — care work, hospitality, the ' +
        'emotional centre of a scene. Reputation rises and falls on mood. ' +
        'These places reward the parts of you that tend rather than ' +
        'perform.',
    },
    IC: {
      title: 'Moon on the IC',
      body:
        'The Moon IC line is the deepest domestic line you have. Home ' +
        'finds you here — literal walls, family, the smell of a kitchen ' +
        'that belongs to you. Emotional memory settles. Many people feel ' +
        'inexplicably safe in Moon IC cities, even on their first visit.',
    },
    AC: {
      title: 'Moon rising',
      body:
        'Your Moon AC line makes your inner life visible. Strangers sense ' +
        'your emotional weather before you have named it. You are softer, ' +
        'more receptive, more easily moved. Beautiful for healing work and ' +
        'rest; trickier if you need a protective shell for a season.',
    },
    DC: {
      title: 'Moon setting',
      body:
        'On the Moon DC line relationships arrive with a maternal charge. ' +
        'You project feeling onto the other person — they remind you of ' +
        'mother, of home, of childhood. This is a line for long pair-bonds ' +
        'and for re-parenting, in both directions.',
    },
  },

  Mercury: {
    MC: {
      title: 'Mercury on the MC',
      body:
        'Mercury MC makes you known for your mind. Writing, speaking, ' +
        'teaching and media become visible on this meridian. Cities ' +
        'under this line tend to push you onto stages — panels, ' +
        'podcasts, opinion columns. Your ideas travel further than they ' +
        'do elsewhere.',
    },
    IC: {
      title: 'Mercury on the IC',
      body:
        'Mercury IC is a reading line, a thinking line, a study line. ' +
        'The interior dialogue accelerates; you fill notebooks. Good for ' +
        'quiet research and for living inside the archive. Not a line for ' +
        'charisma — a line for depth of thought.',
    },
    AC: {
      title: 'Mercury rising',
      body:
        'Your Mercury AC line sharpens how you come across. Speech is ' +
        'faster, wittier, more exact. You think on your feet and people ' +
        'quote you. Excellent for negotiations, new collaborations and ' +
        'any profession that rewards articulacy. Minor risk: overexplaining.',
    },
    DC: {
      title: 'Mercury setting',
      body:
        'On the Mercury DC line your relationships are built out of ' +
        'conversation. Friendships form through shared ideas; romance ' +
        'runs on banter. You attract partners who clarify your own ' +
        'thinking — sometimes by argument. A good city for writers and ' +
        'their muses.',
    },
  },

  Venus: {
    MC: {
      title: 'Venus on the MC',
      body:
        'Under Venus MC your public image softens — you are seen as ' +
        'beautiful, tasteful, worth being near. Careers in design, ' +
        'fashion, art and luxury bloom on this meridian. Social ' +
        'invitations multiply. The line rewards aesthetic choices; it ' +
        'punishes crude ones.',
    },
    IC: {
      title: 'Venus on the IC',
      body:
        'Venus IC is one of the loveliest home lines on the map. Your ' +
        'private life becomes pleasurable — a kitchen you love cooking ' +
        'in, a bed that feels like grace. Romantic cohabitation and ' +
        'quiet domestic happiness settle here. A line to choose with ' +
        'intention.',
    },
    AC: {
      title: 'Venus rising',
      body:
        'Your Venus AC line is the skin-glow line. People read you as ' +
        'attractive before you have spoken — a gravitational pull ' +
        'unconnected to what you are actually doing. Flirtation, ' +
        'creative flow, sheer physical ease. Try not to get lazy about ' +
        'your own worth.',
    },
    DC: {
      title: 'Venus setting',
      body:
        'On the Venus DC line the partners who arrive are, simply, your ' +
        'type — aesthetic and emotional rhyme. Love affairs begin easily ' +
        'here; marriages often. The risk is idealisation. You are seeing ' +
        'your own beauty reflected, and forgetting to read the other ' +
        'person in full.',
    },
  },

  Mars: {
    MC: {
      title: 'Mars on the MC',
      body:
        "Mars MC is the warrior's meridian. You are visible here as " +
        'driven, competitive, a person who finishes. Careers involving ' +
        'physical effort, risk, advocacy and fight thrive. It is not a ' +
        'subtle line — expect conflict, expect attention, expect the ' +
        'adrenaline you moved for.',
    },
    IC: {
      title: 'Mars on the IC',
      body:
        'Mars IC brings edge to the private life. You renovate, ' +
        'restructure, fight with family, train hard in a home gym. Old ' +
        'anger surfaces for integration. Productive in the long arc, ' +
        'restless in the short. Not a line for convalescence.',
    },
    AC: {
      title: 'Mars rising',
      body:
        'Your Mars AC line turns up the heat on your body and your ' +
        'presence. Energy climbs, desire climbs, patience drops. ' +
        'Wonderful for athletes, founders and anyone who has been stuck. ' +
        'Watch for the shorter fuse — the fight that was not worth ' +
        'having.',
    },
    DC: {
      title: 'Mars setting',
      body:
        'On the Mars DC line partners arrive with heat. Attraction is ' +
        'fast and physical; conflict almost as fast. You are drawing ' +
        'in figures who awaken your own drive, including competitors. A ' +
        'powerful line for romance with teeth and for mentors who push ' +
        'you forward.',
    },
  },

  Jupiter: {
    MC: {
      title: 'Jupiter on the MC',
      body:
        'Jupiter MC is the great career-luck line. Doors open, ' +
        'sponsors appear, titles arrive earlier than your CV suggests. ' +
        'Teaching, publishing, law, travel and the businesses built ' +
        'around them all flourish. The work itself feels bigger than ' +
        'you — in a good way.',
    },
    IC: {
      title: 'Jupiter on the IC',
      body:
        'Jupiter IC is the wise-home line. The private life expands — ' +
        'property, family, faith, a sense of being blessed at dinner. ' +
        'Many people buy their first real house on a Jupiter IC line. ' +
        'Watch the waistline and the optimism; both grow.',
    },
    AC: {
      title: 'Jupiter rising',
      body:
        "Your Jupiter AC line is the classic 'good fortune' line. You " +
        'are read as generous, large-spirited, someone worth betting on. ' +
        'Opportunity gravitates. Health tends to improve. This is the ' +
        'line to choose if you need to believe in yourself again.',
    },
    DC: {
      title: 'Jupiter setting',
      body:
        'On the Jupiter DC line the partners who arrive are teachers, ' +
        'elders, foreigners, people of means. Marriages formed here ' +
        'tend to enlarge both lives. Watch only for the blind trust ' +
        'that Jupiter hands out too easily. Do your due diligence.',
    },
  },

  Saturn: {
    MC: {
      title: 'Saturn on the MC',
      body:
        'Saturn MC is a career of discipline and duty. Reputation is ' +
        'earned slowly and lasts. Institutions, government, law and the ' +
        'long apprenticed crafts do well here. Not a flashy line. A ' +
        'line for people willing to be good at something for twenty ' +
        'years.',
    },
    IC: {
      title: 'Saturn on the IC',
      body:
        'Saturn IC is the karmic home line. Old family material ' +
        'surfaces — duty to parents, ancestral property, the weight of ' +
        'where you come from. Can feel heavy; can also be where you ' +
        'finally finish the work your lineage started. Choose with eyes ' +
        'open.',
    },
    AC: {
      title: 'Saturn rising',
      body:
        'Your Saturn AC line makes you look older, more serious, more ' +
        'authoritative. Responsibility finds you — often more than is ' +
        'comfortable. Good for leadership training, bad for rest. You ' +
        'will mature here; you may also age here faster than you would ' +
        'like.',
    },
    DC: {
      title: 'Saturn setting',
      body:
        'On the Saturn DC line partnerships arrive as commitments. ' +
        'Older partners, authority figures, contracts. Marriages formed ' +
        'here are serious, sometimes somber, usually durable. The risk ' +
        'is a relationship that feels like obligation more than joy.',
    },
  },

  Uranus: {
    MC: {
      title: 'Uranus on the MC',
      body:
        'Uranus MC is the breakthrough career line. You are seen as an ' +
        'innovator, a disruptor, sometimes a freak — in the admiring ' +
        'sense. Tech, science, activism and any profession that rewards ' +
        'original thinking spike. Employment structures will not be ' +
        'conventional.',
    },
    IC: {
      title: 'Uranus on the IC',
      body:
        'Uranus IC breaks and remakes the domestic life. Living ' +
        'arrangements change often; chosen family replaces given ' +
        'family. The energy in the home is unusual — a studio, a ' +
        'commune, a co-living experiment. Great for inventors; harder ' +
        'if you crave stability.',
    },
    AC: {
      title: 'Uranus rising',
      body:
        'Your Uranus AC line electrifies your presence. You look and ' +
        'feel original, unpredictable, allergic to the expected script. ' +
        'Sudden insight, sudden reinvention, sudden departure. A line ' +
        'for quantum leaps and for waking up from a life that had gone ' +
        'stale.',
    },
    DC: {
      title: 'Uranus setting',
      body:
        'On the Uranus DC line partners arrive unexpectedly and leave ' +
        'the same way. Unusual relationships — open structures, long ' +
        'distance, radical age or culture gaps. The connection is ' +
        'stimulating and rarely steady. Freedom is the covenant.',
    },
  },

  Neptune: {
    MC: {
      title: 'Neptune on the MC',
      body:
        'Neptune MC is a career of image, dream and influence. Film, ' +
        'music, photography, spirituality, charity — vocations that ' +
        'deal in the invisible — flourish here. Reputation can be ' +
        'diffuse; people project onto you. Beware of public roles that ' +
        'ask you to wear a fantasy.',
    },
    IC: {
      title: 'Neptune on the IC',
      body:
        'Neptune IC dissolves the edges of home. Houses by water, ' +
        'contemplative retreats, places where you lose track of time. ' +
        'Inner life deepens, practical life gets fuzzy. Sublime for ' +
        'artists and mystics; risky for anyone prone to escapism.',
    },
    AC: {
      title: 'Neptune rising',
      body:
        'Your Neptune AC line softens and glamorises you. People read ' +
        'you as magnetic, mysterious, slightly mythical — and ' +
        'sometimes unknowable. Creativity rises. So does suggestibility. ' +
        'Avoid signing contracts and starting substance habits on this ' +
        'line.',
    },
    DC: {
      title: 'Neptune setting',
      body:
        'On the Neptune DC line partners arrive as mirrors and muses. ' +
        'The attraction is dreamlike, sometimes saintly, occasionally ' +
        'delusional. Beautiful for artists finding their collaborator; ' +
        'dangerous for anyone who tends to rescue. Check what is real ' +
        'before you commit.',
    },
  },

  Pluto: {
    MC: {
      title: 'Pluto on the MC',
      body:
        'Pluto MC is a career of power — you work at depth, with ' +
        'taboo, with transformation. Surgery, psychotherapy, finance, ' +
        'detective work, crisis leadership. You are seen as intense; ' +
        'people either trust you fully or steer clear. Reputation can ' +
        'rebirth more than once.',
    },
    IC: {
      title: 'Pluto on the IC',
      body:
        'Pluto IC turns the home into a crucible. Old patterns are ' +
        'exposed, inherited wounds surface, the family story rewrites ' +
        'itself. Not an easy line — a line where you finally grow up. ' +
        'If you are ready to confront the past, this is the place.',
    },
    AC: {
      title: 'Pluto rising',
      body:
        'Your Pluto AC line makes you magnetic and a little dangerous. ' +
        'Your presence is heavier; strangers feel it. Life intensifies — ' +
        'old selves die, new ones ignite. Transformative in the true ' +
        'sense of the word. Not a line for passing through lightly.',
    },
    DC: {
      title: 'Pluto setting',
      body:
        'On the Pluto DC line partners arrive as catalysts. Love and ' +
        'power braid together; control, jealousy, obsession and ' +
        'profound loyalty all rise. Relationships formed here remake ' +
        'you. Choose carefully — and only if you want to be changed.',
    },
  },
};

/* ============================================================
 * Reverse geocoder dataset — ~75 major cities
 * ============================================================ */

export const ASTROCARTO_CITIES: readonly AstrocartoCity[] = [
  { name: 'Sydney',         country: 'Australia',      lat: -33.87, lon:  151.21 },
  { name: 'Melbourne',      country: 'Australia',      lat: -37.81, lon:  144.96 },
  { name: 'Brisbane',       country: 'Australia',      lat: -27.47, lon:  153.03 },
  { name: 'Perth',          country: 'Australia',      lat: -31.95, lon:  115.86 },
  { name: 'Adelaide',       country: 'Australia',      lat: -34.93, lon:  138.60 },
  { name: 'Auckland',       country: 'New Zealand',    lat: -36.85, lon:  174.76 },
  { name: 'Wellington',     country: 'New Zealand',    lat: -41.29, lon:  174.78 },
  { name: 'Tokyo',          country: 'Japan',          lat:  35.68, lon:  139.69 },
  { name: 'Osaka',          country: 'Japan',          lat:  34.69, lon:  135.50 },
  { name: 'Seoul',          country: 'South Korea',    lat:  37.57, lon:  126.98 },
  { name: 'Beijing',        country: 'China',          lat:  39.90, lon:  116.41 },
  { name: 'Shanghai',       country: 'China',          lat:  31.23, lon:  121.47 },
  { name: 'Hong Kong',      country: 'China',          lat:  22.30, lon:  114.17 },
  { name: 'Singapore',      country: 'Singapore',      lat:   1.35, lon:  103.82 },
  { name: 'Bangkok',        country: 'Thailand',       lat:  13.76, lon:  100.50 },
  { name: 'Jakarta',        country: 'Indonesia',      lat:  -6.21, lon:  106.85 },
  { name: 'Manila',         country: 'Philippines',    lat:  14.60, lon:  120.98 },
  { name: 'Mumbai',         country: 'India',          lat:  19.08, lon:   72.88 },
  { name: 'Delhi',          country: 'India',          lat:  28.61, lon:   77.21 },
  { name: 'Bengaluru',      country: 'India',          lat:  12.97, lon:   77.59 },
  { name: 'Karachi',        country: 'Pakistan',       lat:  24.86, lon:   67.01 },
  { name: 'Dubai',          country: 'UAE',            lat:  25.20, lon:   55.27 },
  { name: 'Istanbul',       country: 'Turkey',         lat:  41.01, lon:   28.98 },
  { name: 'Tel Aviv',       country: 'Israel',         lat:  32.08, lon:   34.78 },
  { name: 'Cairo',          country: 'Egypt',          lat:  30.04, lon:   31.24 },
  { name: 'Nairobi',        country: 'Kenya',          lat:  -1.29, lon:   36.82 },
  { name: 'Lagos',          country: 'Nigeria',        lat:   6.52, lon:    3.38 },
  { name: 'Johannesburg',   country: 'South Africa',   lat: -26.20, lon:   28.05 },
  { name: 'Cape Town',      country: 'South Africa',   lat: -33.92, lon:   18.42 },
  { name: 'Casablanca',     country: 'Morocco',        lat:  33.57, lon:   -7.59 },
  { name: 'London',         country: 'UK',             lat:  51.51, lon:   -0.13 },
  { name: 'Manchester',     country: 'UK',             lat:  53.48, lon:   -2.24 },
  { name: 'Edinburgh',      country: 'UK',             lat:  55.95, lon:   -3.19 },
  { name: 'Dublin',         country: 'Ireland',        lat:  53.35, lon:   -6.26 },
  { name: 'Paris',          country: 'France',         lat:  48.86, lon:    2.35 },
  { name: 'Madrid',         country: 'Spain',          lat:  40.42, lon:   -3.70 },
  { name: 'Barcelona',      country: 'Spain',          lat:  41.39, lon:    2.17 },
  { name: 'Lisbon',         country: 'Portugal',       lat:  38.72, lon:   -9.14 },
  { name: 'Rome',           country: 'Italy',          lat:  41.90, lon:   12.50 },
  { name: 'Milan',          country: 'Italy',          lat:  45.46, lon:    9.19 },
  { name: 'Berlin',         country: 'Germany',        lat:  52.52, lon:   13.40 },
  { name: 'Munich',         country: 'Germany',        lat:  48.14, lon:   11.58 },
  { name: 'Amsterdam',      country: 'Netherlands',    lat:  52.37, lon:    4.90 },
  { name: 'Brussels',       country: 'Belgium',        lat:  50.85, lon:    4.35 },
  { name: 'Copenhagen',     country: 'Denmark',        lat:  55.68, lon:   12.57 },
  { name: 'Stockholm',      country: 'Sweden',         lat:  59.33, lon:   18.07 },
  { name: 'Oslo',           country: 'Norway',         lat:  59.91, lon:   10.75 },
  { name: 'Helsinki',       country: 'Finland',        lat:  60.17, lon:   24.94 },
  { name: 'Vienna',         country: 'Austria',        lat:  48.21, lon:   16.37 },
  { name: 'Prague',         country: 'Czech Republic', lat:  50.08, lon:   14.44 },
  { name: 'Warsaw',         country: 'Poland',         lat:  52.23, lon:   21.01 },
  { name: 'Athens',         country: 'Greece',         lat:  37.98, lon:   23.73 },
  { name: 'Moscow',         country: 'Russia',         lat:  55.76, lon:   37.62 },
  { name: 'New York',       country: 'USA',            lat:  40.71, lon:  -74.01 },
  { name: 'Boston',         country: 'USA',            lat:  42.36, lon:  -71.06 },
  { name: 'Washington DC',  country: 'USA',            lat:  38.91, lon:  -77.04 },
  { name: 'Miami',          country: 'USA',            lat:  25.76, lon:  -80.19 },
  { name: 'Chicago',        country: 'USA',            lat:  41.88, lon:  -87.63 },
  { name: 'Austin',         country: 'USA',            lat:  30.27, lon:  -97.74 },
  { name: 'Denver',         country: 'USA',            lat:  39.74, lon: -104.99 },
  { name: 'Los Angeles',    country: 'USA',            lat:  34.05, lon: -118.24 },
  { name: 'San Francisco',  country: 'USA',            lat:  37.77, lon: -122.42 },
  { name: 'Seattle',        country: 'USA',            lat:  47.61, lon: -122.33 },
  { name: 'Vancouver',      country: 'Canada',         lat:  49.28, lon: -123.12 },
  { name: 'Toronto',        country: 'Canada',         lat:  43.65, lon:  -79.38 },
  { name: 'Montreal',       country: 'Canada',         lat:  45.50, lon:  -73.57 },
  { name: 'Mexico City',    country: 'Mexico',         lat:  19.43, lon:  -99.13 },
  { name: 'Havana',         country: 'Cuba',           lat:  23.13, lon:  -82.38 },
  { name: 'Bogota',         country: 'Colombia',       lat:   4.71, lon:  -74.07 },
  { name: 'Lima',           country: 'Peru',           lat: -12.05, lon:  -77.04 },
  { name: 'Santiago',       country: 'Chile',          lat: -33.45, lon:  -70.67 },
  { name: 'Buenos Aires',   country: 'Argentina',      lat: -34.60, lon:  -58.38 },
  { name: 'Sao Paulo',      country: 'Brazil',         lat: -23.55, lon:  -46.63 },
  { name: 'Rio de Janeiro', country: 'Brazil',         lat: -22.91, lon:  -43.17 },
];

/* ============================================================
 * Reverse geocoder helpers (pure compute; no DOM)
 * ============================================================ */

export function reverseGeocode(
  lon: number,
  lat: number,
  tolDeg = 4,
): AstrocartoNearestCity | null {
  let best: AstrocartoCity | null = null;
  let bestDist = Infinity;
  for (const c of ASTROCARTO_CITIES) {
    const dLon = Math.abs(norm180(c.lon - lon));
    const dLat = Math.abs(c.lat - lat);
    const dist = Math.sqrt(dLon * dLon + dLat * dLat);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  if (!best) return null;
  if (bestDist > tolDeg * 4) return null;
  return { city: best, distanceDeg: bestDist };
}

// Cities within ±tolDeg of an MC/IC meridian (absolute longitude).
export function citiesNearMeridian(
  mcLon: number,
  tolDeg = 3,
  limit = 4,
): AstrocartoCityMatch[] {
  const list: AstrocartoCityMatch[] = [];
  for (const c of ASTROCARTO_CITIES) {
    const dLon = Math.abs(norm180(c.lon - mcLon));
    if (dLon <= tolDeg) list.push({ city: c, delta: dLon });
  }
  list.sort((a, b) => a.delta - b.delta);
  return list.slice(0, limit);
}

// Cities within tolDeg of any sample point on an AC/DC curve.
export function citiesNearCurve(
  curve: Array<[number, number]>,
  tolDeg = 3,
  limit = 4,
): AstrocartoCityMatch[] {
  const candidates: AstrocartoCityMatch[] = [];
  for (const c of ASTROCARTO_CITIES) {
    let bestDist = Infinity;
    for (const pt of curve) {
      const dLon = Math.abs(norm180(c.lon - pt[0]));
      const dLat = Math.abs(c.lat - pt[1]);
      const d = Math.sqrt(dLon * dLon + dLat * dLat);
      if (d < bestDist) bestDist = d;
    }
    if (bestDist <= tolDeg) candidates.push({ city: c, delta: bestDist });
  }
  candidates.sort((a, b) => a.delta - b.delta);
  return candidates.slice(0, limit);
}

/* ============================================================
 * Line "interestingness" scoring (for picking top-N writeups)
 * ============================================================ */

function scoreLine(
  planetEntry: AstrocartoPlanetLine,
  angle: AstrocartoAngle,
): { score: number; cities: AstrocartoCityMatch[] } {
  const personalBonus = planetEntry.personal ? 3 : 0;
  let cities: AstrocartoCityMatch[] = [];
  if (angle === 'MC')      cities = citiesNearMeridian(planetEntry.mc.lon, 3, 8);
  else if (angle === 'IC') cities = citiesNearMeridian(planetEntry.ic.lon, 3, 8);
  else if (angle === 'AC') cities = citiesNearCurve(planetEntry.ac, 3, 8);
  else if (angle === 'DC') cities = citiesNearCurve(planetEntry.dc, 3, 8);
  return { score: cities.length * 10 + personalBonus, cities };
}

export function rankAstrocartoLines(result: AstrocartoResult): AstrocartoRankedLine[] {
  if (!result || !result.planets) return [];
  const rows: AstrocartoRankedLine[] = [];
  const angles: AstrocartoAngle[] = ['MC', 'IC', 'AC', 'DC'];
  for (const pe of result.planets) {
    for (const ang of angles) {
      const s = scoreLine(pe, ang);
      const byPlanet = ASTROCARTO_LINES[pe.planet];
      const lineDef: AstrocartoLineDef =
        (byPlanet && byPlanet[ang]) ?? { title: `${pe.planet} ${ang}`, body: '' };
      const mcLon = ang === 'MC' ? pe.mc.lon : (ang === 'IC' ? pe.ic.lon : null);
      rows.push({
        planet: pe.planet,
        angle: ang,
        color: pe.color,
        personal: pe.personal,
        title: lineDef.title,
        body: lineDef.body,
        score: s.score,
        cities: s.cities,
        mcLon,
      });
    }
  }
  rows.sort((a, b) => b.score - a.score);
  return rows;
}
