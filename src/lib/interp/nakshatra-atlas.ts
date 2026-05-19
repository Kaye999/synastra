// Nakshatra Atlas — enrichment grid for the Vedic tab of Sign Atlas.
// Pairs alongside NAKSHATRA_ESSENCE in tables.ts. The 27-nakshatra
// (Abhijit-excluded) sidereal system, with traditional pada count, gana,
// yoni, single-keyword distillation, and degree range.

export type NakshatraEnrichment = {
  /** Pada count — always 4 for the 27-nakshatra system */
  padas: number;
  /** Gana — Deva (divine), Manushya (human), Rakshasa (demonic) */
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  /** Yoni (animal symbolism) — e.g., 'Horse', 'Cow', 'Snake' */
  yoni: string;
  /** Single short keyword — e.g., 'beginnings', 'discernment' */
  keyword: string;
  /** Degree range in sidereal zodiac, e.g., '0°00′ – 13°20′ Aries' */
  range: string;
};

export const NAKSHATRA_ATLAS: Record<string, NakshatraEnrichment> = {
  Ashwini: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Horse',
    keyword: 'beginnings',
    range: '0°00′ – 13°20′ Aries',
  },
  Bharani: {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Elephant',
    keyword: 'threshold',
    range: '13°20′ – 26°40′ Aries',
  },
  Krittika: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Sheep',
    keyword: 'cutting',
    range: '26°40′ Aries – 10°00′ Taurus',
  },
  Rohini: {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Serpent',
    keyword: 'allure',
    range: '10°00′ – 23°20′ Taurus',
  },
  Mrigashira: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Serpent',
    keyword: 'searching',
    range: '23°20′ Taurus – 6°40′ Gemini',
  },
  Ardra: {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Dog',
    keyword: 'storm',
    range: '6°40′ – 20°00′ Gemini',
  },
  Punarvasu: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Cat',
    keyword: 'return',
    range: '20°00′ Gemini – 3°20′ Cancer',
  },
  Pushya: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Sheep',
    keyword: 'nourishment',
    range: '3°20′ – 16°40′ Cancer',
  },
  Ashlesha: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Cat',
    keyword: 'embrace',
    range: '16°40′ – 30°00′ Cancer',
  },
  Magha: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Rat',
    keyword: 'lineage',
    range: '0°00′ – 13°20′ Leo',
  },
  'Purva Phalguni': {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Rat',
    keyword: 'pleasure',
    range: '13°20′ – 26°40′ Leo',
  },
  'Uttara Phalguni': {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Cow',
    keyword: 'patronage',
    range: '26°40′ Leo – 10°00′ Virgo',
  },
  Hasta: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Buffalo',
    keyword: 'craft',
    range: '10°00′ – 23°20′ Virgo',
  },
  Chitra: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Tiger',
    keyword: 'pattern',
    range: '23°20′ Virgo – 6°40′ Libra',
  },
  Swati: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Buffalo',
    keyword: 'independence',
    range: '6°40′ – 20°00′ Libra',
  },
  Vishakha: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Tiger',
    keyword: 'aim',
    range: '20°00′ Libra – 3°20′ Scorpio',
  },
  Anuradha: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Deer',
    keyword: 'devotion',
    range: '3°20′ – 16°40′ Scorpio',
  },
  Jyeshtha: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Deer',
    keyword: 'eldership',
    range: '16°40′ – 30°00′ Scorpio',
  },
  Mula: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Dog',
    keyword: 'root',
    range: '0°00′ – 13°20′ Sagittarius',
  },
  'Purva Ashadha': {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Monkey',
    keyword: 'invigoration',
    range: '13°20′ – 26°40′ Sagittarius',
  },
  'Uttara Ashadha': {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Mongoose',
    keyword: 'victory',
    range: '26°40′ Sagittarius – 10°00′ Capricorn',
  },
  Shravana: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Monkey',
    keyword: 'listening',
    range: '10°00′ – 23°20′ Capricorn',
  },
  Dhanishta: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Lion',
    keyword: 'rhythm',
    range: '23°20′ Capricorn – 6°40′ Aquarius',
  },
  Shatabhisha: {
    padas: 4,
    gana: 'Rakshasa',
    yoni: 'Horse',
    keyword: 'remedy',
    range: '6°40′ – 20°00′ Aquarius',
  },
  'Purva Bhadrapada': {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Lion',
    keyword: 'fire',
    range: '20°00′ Aquarius – 3°20′ Pisces',
  },
  'Uttara Bhadrapada': {
    padas: 4,
    gana: 'Manushya',
    yoni: 'Cow',
    keyword: 'depth',
    range: '3°20′ – 16°40′ Pisces',
  },
  Revati: {
    padas: 4,
    gana: 'Deva',
    yoni: 'Elephant',
    keyword: 'safe passage',
    range: '16°40′ – 30°00′ Pisces',
  },
};
