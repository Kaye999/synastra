/*
 * astro.ts — typed port of engine-astro.js (astronomy compute module).
 *
 * SELF-TEST — verify against Ethan's known chart:
 *   dob: 2004-07-23, time: 06:30 AEST (lat -33.87, lon +151.21, tz +10)
 *   Expected tropical:
 *     Sun: Leo ~0°29'
 *     Moon: Libra ~2°01'
 *     Ascendant: Capricorn ~22°46'
 *     MC: Taurus ~12°07'
 *   Expected sidereal (Lahiri, ayanamsa ~23.91°):
 *     Sun: Cancer ~6°
 *     Moon: Virgo ~8°
 *     Lagna: Sagittarius ~28°
 *     Nakshatra (moon): Uttara Phalguni, pada 2
 */

import * as Astronomy from 'astronomy-engine';
import type {
  AstroInput,
  Chart,
  DashaPeriod,
  Mahadasha,
  Nakshatra,
  Planet,
  SiderealChart,
} from '../types';

/* ============================================================
 * Tables
 * ============================================================ */

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type Sign = (typeof SIGNS)[number];

export const NAKSHATRAS: { name: string; lord: string }[] = [
  { name: 'Ashwini',          lord: 'Ketu'    },
  { name: 'Bharani',          lord: 'Venus'   },
  { name: 'Krittika',         lord: 'Sun'     },
  { name: 'Rohini',           lord: 'Moon'    },
  { name: 'Mrigashira',       lord: 'Mars'    },
  { name: 'Ardra',            lord: 'Rahu'    },
  { name: 'Punarvasu',        lord: 'Jupiter' },
  { name: 'Pushya',           lord: 'Saturn'  },
  { name: 'Ashlesha',         lord: 'Mercury' },
  { name: 'Magha',            lord: 'Ketu'    },
  { name: 'Purva Phalguni',   lord: 'Venus'   },
  { name: 'Uttara Phalguni',  lord: 'Sun'     },
  { name: 'Hasta',            lord: 'Moon'    },
  { name: 'Chitra',           lord: 'Mars'    },
  { name: 'Swati',            lord: 'Rahu'    },
  { name: 'Vishakha',         lord: 'Jupiter' },
  { name: 'Anuradha',         lord: 'Saturn'  },
  { name: 'Jyeshtha',         lord: 'Mercury' },
  { name: 'Mula',             lord: 'Ketu'    },
  { name: 'Purva Ashadha',    lord: 'Venus'   },
  { name: 'Uttara Ashadha',   lord: 'Sun'     },
  { name: 'Shravana',         lord: 'Moon'    },
  { name: 'Dhanishta',        lord: 'Mars'    },
  { name: 'Shatabhisha',      lord: 'Rahu'    },
  { name: 'Purva Bhadrapada', lord: 'Jupiter' },
  { name: 'Uttara Bhadrapada',lord: 'Saturn'  },
  { name: 'Revati',           lord: 'Mercury' },
];

// Vimshottari dasha years per lord (total 120)
export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

// Dasha cycle order (same as nakshatra lord cycle)
export const DASHA_ORDER = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
] as const;

// Bodies we compute (excluding nodes — handled separately)
const PLANET_BODIES: { planet: string; body: Astronomy.Body }[] = [
  { planet: 'Sun',     body: Astronomy.Body.Sun     },
  { planet: 'Moon',    body: Astronomy.Body.Moon    },
  { planet: 'Mercury', body: Astronomy.Body.Mercury },
  { planet: 'Venus',   body: Astronomy.Body.Venus   },
  { planet: 'Mars',    body: Astronomy.Body.Mars    },
  { planet: 'Jupiter', body: Astronomy.Body.Jupiter },
  { planet: 'Saturn',  body: Astronomy.Body.Saturn  },
  { planet: 'Uranus',  body: Astronomy.Body.Uranus  },
  { planet: 'Neptune', body: Astronomy.Body.Neptune },
  { planet: 'Pluto',   body: Astronomy.Body.Pluto   },
];

/* ============================================================
 * Angle helpers
 * ============================================================ */

const _deg2rad = (d: number) => (d * Math.PI) / 180;
const _rad2deg = (r: number) => (r * 180) / Math.PI;

function _norm360(x: number): number {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

type SignDeg = { sign: string; signIdx: number; deg: number; longitude: number };

function _longitudeToSignDeg(longitude: number): SignDeg {
  const L = _norm360(longitude);
  const idx = Math.floor(L / 30);
  const deg = L - idx * 30;
  return { sign: SIGNS[idx], signIdx: idx, deg, longitude: L };
}

/* ============================================================
 * Time / Julian helpers
 * ============================================================ */

function _birthDataToUTCDate(input: AstroInput): Date {
  const { dob, time, timeUnknown, tzOffset } = input;
  const hour = timeUnknown ? 12 : time.h;
  const minute = timeUnknown ? 0 : time.m;
  let utcMs = Date.UTC(dob.y, dob.m - 1, dob.d, hour, minute, 0);
  utcMs -= (tzOffset || 0) * 3600 * 1000;
  return new Date(utcMs);
}

/* ============================================================
 * Astronomy-engine wrappers
 * ============================================================ */

function _eclipticLongitude(body: Astronomy.Body, astroTime: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Moon) {
    const moonVec = Astronomy.GeoMoon(astroTime);
    const eclM = Astronomy.Ecliptic(moonVec);
    return _norm360(eclM.elon);
  }
  const vec = Astronomy.GeoVector(body, astroTime, true);
  const ecl = Astronomy.Ecliptic(vec);
  return _norm360(ecl.elon);
}

function _localSiderealTimeDeg(astroTime: Astronomy.AstroTime, lonEastDeg: number): number {
  const gstHours = Astronomy.SiderealTime(astroTime);
  const gstDeg = gstHours * 15.0;
  return _norm360(gstDeg + lonEastDeg);
}

function _meanObliquityDeg(astroTime: Astronomy.AstroTime): number {
  const T = astroTime.tt / 36525.0;
  const seconds =
    84381.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return seconds / 3600.0;
}

/* ============================================================
 * Ascendant & Midheaven
 * ============================================================ */

function _computeMidheaven(ramcDeg: number, epsDeg: number): number {
  const ramc = _deg2rad(ramcDeg);
  const eps = _deg2rad(epsDeg);
  const y = Math.sin(ramc);
  const x = Math.cos(ramc) * Math.cos(eps);
  const mc = _rad2deg(Math.atan2(y, x));
  return _norm360(mc);
}

function _computeAscendant(ramcDeg: number, epsDeg: number, latDeg: number): number {
  const ramc = _deg2rad(ramcDeg);
  const eps = _deg2rad(epsDeg);
  const lat = _deg2rad(latDeg);

  const y = -Math.cos(ramc);
  const x = Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(ramc);
  let asc = _rad2deg(Math.atan2(y, x));
  asc = _norm360(asc);

  const mc = _computeMidheaven(ramcDeg, epsDeg);
  const diff = _norm360(asc - mc);
  if (diff < 1 || diff > 359) return asc;
  if (diff < 180) return asc;
  return _norm360(asc + 180);
}

/* ============================================================
 * Lunar nodes (Mean Node)
 * ============================================================ */

function _meanLunarNodeLongitude(astroTime: Astronomy.AstroTime): number {
  const T = astroTime.tt / 36525.0;
  const omega =
    125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T * T
    + (T * T * T) / 467441.0
    - (T * T * T * T) / 60616000.0;
  return _norm360(omega);
}

/* ============================================================
 * Ayanamsa (Lahiri)
 * ============================================================ */

function _lahiriAyanamsa(astroTime: Astronomy.AstroTime): number {
  const T = astroTime.tt / 36525.0;
  return 22.460148 + 1.396042 * T + 0.000309 * T * T;
}

/* ============================================================
 * Whole-Sign houses
 * ============================================================ */

export function wholeSignHouse(ascendantSignIdx: number, planetSignIdx: number): number {
  return ((planetSignIdx - ascendantSignIdx + 12) % 12) + 1;
}

function _buildHousesMap(ascSignIdx: number): Record<number, string> {
  const houses: Record<number, string> = {};
  for (let i = 0; i < 12; i++) {
    houses[i + 1] = SIGNS[(ascSignIdx + i) % 12];
  }
  return houses;
}

/* ============================================================
 * Core chart builder
 * ============================================================ */

type RawLongitudes = {
  astroTime: Astronomy.AstroTime;
  utcDate: Date;
  longitudes: Record<string, number>;
  rahuLon: number;
  ascLon: number | null;
  mcLon: number | null;
  ayanamsa: number;
};

function _buildRawLongitudes(input: AstroInput): RawLongitudes {
  const utcDate = _birthDataToUTCDate(input);
  const astroTime = new Astronomy.AstroTime(utcDate);

  const longitudes: Record<string, number> = {};
  for (const pb of PLANET_BODIES) {
    longitudes[pb.planet] = _eclipticLongitude(pb.body, astroTime);
  }

  const rahuLon = _meanLunarNodeLongitude(astroTime);

  let ascLon: number | null = null;
  let mcLon: number | null = null;
  if (!input.timeUnknown) {
    const ramc = _localSiderealTimeDeg(astroTime, input.lon);
    const eps = _meanObliquityDeg(astroTime);
    mcLon = _computeMidheaven(ramc, eps);
    ascLon = _computeAscendant(ramc, eps, input.lat);
  }

  return {
    astroTime,
    utcDate,
    longitudes,
    rahuLon,
    ascLon,
    mcLon,
    ayanamsa: _lahiriAyanamsa(astroTime),
  };
}

function _shapeChart(
  longitudes: Record<string, number>,
  ascLon: number | null,
  mcLon: number | null,
  nodeLon: number | null,
  includeNodes: boolean,
  moonSideLon: number | null,
): SiderealChart {
  const ascSignIdx = ascLon == null ? null : _longitudeToSignDeg(ascLon).signIdx;

  const planets: Planet[] = [];
  for (const pb of PLANET_BODIES) {
    const info = _longitudeToSignDeg(longitudes[pb.planet]);
    planets.push({
      planet: pb.planet,
      sign: info.sign,
      deg: info.deg,
      house: ascSignIdx == null ? null : wholeSignHouse(ascSignIdx, info.signIdx),
      longitude: info.longitude,
    });
  }

  const chart: SiderealChart = {
    planets,
    ascendant: null,
    mc: null,
    houses: ascSignIdx == null ? null : _buildHousesMap(ascSignIdx),
  };

  if (ascLon != null) {
    const ascInfo = _longitudeToSignDeg(ascLon);
    chart.ascendant = {
      sign: ascInfo.sign,
      deg: ascInfo.deg,
      longitude: ascInfo.longitude,
    };
  }
  if (mcLon != null) {
    const mcInfo = _longitudeToSignDeg(mcLon);
    chart.mc = {
      sign: mcInfo.sign,
      deg: mcInfo.deg,
      longitude: mcInfo.longitude,
    };
  }

  if (includeNodes && nodeLon != null) {
    const rahuInfo = _longitudeToSignDeg(nodeLon);
    const ketuInfo = _longitudeToSignDeg(nodeLon + 180);
    chart.rahu = {
      planet: 'Rahu',
      sign: rahuInfo.sign,
      deg: rahuInfo.deg,
      house: ascSignIdx == null ? null : wholeSignHouse(ascSignIdx, rahuInfo.signIdx),
      longitude: rahuInfo.longitude,
    };
    chart.ketu = {
      planet: 'Ketu',
      sign: ketuInfo.sign,
      deg: ketuInfo.deg,
      house: ascSignIdx == null ? null : wholeSignHouse(ascSignIdx, ketuInfo.signIdx),
      longitude: ketuInfo.longitude,
    };
  }

  if (moonSideLon != null) {
    chart.nakshatra = _computeNakshatra(moonSideLon);
  }

  return chart;
}

/* ============================================================
 * Nakshatra
 * ============================================================ */

function _computeNakshatra(siderealMoonLon: number): Nakshatra {
  const L = _norm360(siderealMoonLon);
  const spanNak = 360 / 27;
  const spanPada = 360 / 108;
  let idx = Math.floor(L / spanNak);
  if (idx > 26) idx = 26;
  const withinNak = L - idx * spanNak;
  let pada = Math.floor(withinNak / spanPada) + 1;
  if (pada > 4) pada = 4;
  const nak = NAKSHATRAS[idx];
  return {
    name: nak.name,
    pada,
    lord: nak.lord,
    deg: withinNak,
  };
}

/* ============================================================
 * Public chart computers
 * ============================================================ */

export function computeTropicalChart(input: AstroInput): Chart {
  const raw = _buildRawLongitudes(input);
  return _shapeChart(raw.longitudes, raw.ascLon, raw.mcLon, null, false, null);
}

export function computeSiderealChart(input: AstroInput): SiderealChart {
  const raw = _buildRawLongitudes(input);
  const aya = raw.ayanamsa;

  const sideLongitudes: Record<string, number> = {};
  for (const k of Object.keys(raw.longitudes)) {
    sideLongitudes[k] = _norm360(raw.longitudes[k] - aya);
  }
  const sideAsc = raw.ascLon == null ? null : _norm360(raw.ascLon - aya);
  const sideMc = raw.mcLon == null ? null : _norm360(raw.mcLon - aya);
  const sideRahu = raw.rahuLon == null ? null : _norm360(raw.rahuLon - aya);
  const sideMoon = sideLongitudes.Moon;

  return _shapeChart(sideLongitudes, sideAsc, sideMc, sideRahu, true, sideMoon);
}

/* ============================================================
 * Vimshottari Mahadasha
 * ============================================================ */

export function computeMahadasha(moonSidereal: number, birthDate: Date): Mahadasha {
  const L = _norm360(moonSidereal);
  const spanNak = 360 / 27;
  let nakIdx = Math.floor(L / spanNak);
  if (nakIdx > 26) nakIdx = 26;
  const withinNak = L - nakIdx * spanNak;
  const fractionConsumed = withinNak / spanNak;

  const startingLord = NAKSHATRAS[nakIdx].lord;
  const orderStart = DASHA_ORDER.indexOf(startingLord as typeof DASHA_ORDER[number]);

  const MS_PER_YEAR = 365.2425 * 86400 * 1000;

  const firstLord = DASHA_ORDER[orderStart];
  const firstYears = DASHA_YEARS[firstLord];
  const firstRemainingYears = (1 - fractionConsumed) * firstYears;
  const firstConsumedYears = fractionConsumed * firstYears;

  const firstStart = new Date(birthDate.getTime() - firstConsumedYears * MS_PER_YEAR);
  const firstEnd = new Date(birthDate.getTime() + firstRemainingYears * MS_PER_YEAR);

  const allDashas: DashaPeriod[] = [];
  allDashas.push({
    lord: firstLord,
    start: firstStart,
    end: firstEnd,
    years: firstYears,
  });

  let cursor = firstEnd.getTime();
  for (let i = 1; i < DASHA_ORDER.length; i++) {
    const lord = DASHA_ORDER[(orderStart + i) % DASHA_ORDER.length];
    const years = DASHA_YEARS[lord];
    const start = new Date(cursor);
    const end = new Date(cursor + years * MS_PER_YEAR);
    allDashas.push({ lord, start, end, years });
    cursor = end.getTime();
  }

  return {
    currentLord: allDashas[0].lord,
    nextLord: allDashas[1].lord,
    currentStart: allDashas[0].start,
    currentEnd: allDashas[0].end,
    allDashas,
  };
}
