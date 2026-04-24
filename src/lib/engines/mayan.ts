/*
 * mayan.ts — Mayan Tzolk'in / Dreamspell Galactic Signature engine.
 *
 * Ported from engine-mayan.js (archive: astral-saas-static-20260422). All
 * interpretation tables preserved verbatim; UI rendering omitted.
 *
 * ─── KIN REFERENCE & SELF-TEST ────────────────────────────────────────────
 *
 * Reference: 21 December 2012 = Kin 207 (Blue Crystal Hand).
 *   tone  = ((207 - 1) mod 13) + 1 = 12  → Crystal
 *   sign  = ((207 - 1) mod 20) + 1 = 7   → Hand (Manik)
 *
 * SELF-TEST — Sydney-born chart: 23 July 2004.
 *   Days 2004-07-23 → 2012-12-21 = 3073
 *   Kin = (((207 - 1) - 3073) mod 260 + 260) mod 260 + 1 = 254
 *   Tone = ((254 - 1) mod 13) + 1 = 7   → Resonant
 *   Sign = ((254 - 1) mod 20) + 1 = 14  → Wizard (Ix)
 *   Expected: Kin 254 — White Resonant Wizard  ✓
 *
 * NOTE: Uses straight Gregorian day arithmetic (NO leap-day skipping).
 * Dreamspell calculators that skip Feb 29 produce different kins.
 */

/* ============================================================
 * Types
 * ============================================================ */

export type MayanColor = 'Red' | 'White' | 'Blue' | 'Yellow';
export type MayanDirection = 'East' | 'North' | 'West' | 'South';

export type MayanDaySign = {
  number: number; // 1..20
  name: string;
  yucatec: string;
  color: MayanColor;
  direction: MayanDirection;
  essence: string;
  body: string;
  shadow: string;
  gift: string;
};

export type MayanTone = {
  number: number; // 1..13
  name: string;
  power: string;
  essence: string;
  body: string;
};

export type MayanOracleCard = {
  kin: number;
  name: string;
  daySign: string;
  tone: string;
  toneNumber: number;
  daySignNumber: number;
};

export type MayanOracle = {
  guide: MayanOracleCard;
  antipode: MayanOracleCard;
  analog: MayanOracleCard;
  occult: MayanOracleCard;
};

export type MayanGalacticYear = {
  kinSeed: number;
  yearSign: string;
  yearTone: string;
  yearColor: MayanColor;
  yearName: string;
  yearStartDate: string; // "YYYY-07-26"
};

export type MayanEarthFamily = {
  name: string;
  theme: string;
};

export type MayanInterpretation = {
  body: string;
  lifePurpose: string;
  shadowWork: string;
  combinedReading: string;
};

export type MayanResult = {
  kin: number;
  kinName: string;
  daySign: MayanDaySign;
  tone: MayanTone;
  colorCycle: MayanColor;
  direction: MayanDirection;
  earthFamily: MayanEarthFamily | null;
  oracle: MayanOracle;
  galacticYear: MayanGalacticYear;
  interpretation: MayanInterpretation;
};

/* ============================================================
 * Tables — 20 day-signs, 13 tones (ported verbatim)
 * ============================================================ */

export const MAYAN_DAY_SIGNS: readonly MayanDaySign[] = [
  {
    number: 1, yucatec: 'Imix', name: 'Dragon', color: 'Red', direction: 'East',
    essence: 'Primordial trust',
    body:
      'Imix is the womb of memory — the red dragon who nurses all beginnings. ' +
      'Where this sign falls, life is fed by ancestral sap: nothing you do is ' +
      'without a lineage behind it. You are built to initiate, to hold the ' +
      'infant form of what others finish. The task is to trust the earliest ' +
      'stirrings before they can be justified to anyone, including yourself.',
    shadow: 'A reluctance to leave the first safe harbour; nurturing drifting into enmeshment.',
    gift: 'Unreasonable generosity — a bloodstream hospitality that makes others feel chosen before they have earned it.',
  },
  {
    number: 2, yucatec: 'Ik', name: 'Wind', color: 'White', direction: 'North',
    essence: 'Spirit in motion',
    body:
      'Ik is breath, rumour, and the invisible hand behind a slammed door. ' +
      'To carry the Wind sign is to be a conduit for messages that are not ' +
      'quite your own — ideas pass through you as air through a flute. You ' +
      'speak, write, or dream things awake. The discipline is to tell the ' +
      'truth even when the truth is weightless; to let the message shape you as you shape it.',
    shadow: 'Scattering — talking the fire out of a thing before it can burn.',
    gift: 'The capacity to name what others only sense; you are the weather report the room has been waiting for.',
  },
  {
    number: 3, yucatec: 'Akbal', name: 'Night', color: 'Blue', direction: 'West',
    essence: 'The sanctuary of the dark',
    body:
      'Akbal is the innermost chamber — the cave where intuition grows its ' +
      'slow crystals. Night-born souls find their clearest knowing after the ' +
      "day's noise abates, and they serve as sanctuary for others who cannot " +
      'hear themselves elsewhere. Your task is to dignify silence, to treat ' +
      'your own dreams as data, and to resist the modern pressure to be always lit.',
    shadow: 'Hiding inside interiority; mistaking withdrawal for depth.',
    gift: 'Refuge — a private temperature of acceptance that the frayed come to rest inside.',
  },
  {
    number: 4, yucatec: 'Kan', name: 'Seed', color: 'Yellow', direction: 'South',
    essence: 'Targeted potential',
    body:
      'Kan is a germ of intention encoded with its own whole future. Where ' +
      'this sign marks, there is a long game — aims set in childhood that ' +
      'only ripen decades later. You are patient without being passive, ' +
      'because the outcome is already present in miniature. Your work is ' +
      'to tend the soil, protect the sprout, and trust the hidden timetable of growth.',
    shadow: 'Rigidity — the seed that refuses to open because the conditions are not yet immaculate.',
    gift: 'Focus; a flowering that repays the patience of everyone who watered you.',
  },
  {
    number: 5, yucatec: 'Chicchan', name: 'Serpent', color: 'Red', direction: 'East',
    essence: 'Life-force awakened',
    body:
      'Chicchan is kundalini in day-sign form — the red serpent who moves ' +
      'the body from the base upward. Those born here feel their vitality ' +
      'as a physical intelligence: illness, desire, and instinct all speak ' +
      'the same language. Your power is embodied; your mistake is to live ' +
      'too long in the head. Let the serpent teach you when to strike and when to coil.',
    shadow: 'Reactivity — venom where medicine was meant.',
    gift: 'Animal honesty; a presence the body can trust before the mind arrives.',
  },
  {
    number: 6, yucatec: 'Cimi', name: 'Worldbridger', color: 'White', direction: 'North',
    essence: 'Transition, surrender, crossing',
    body:
      'Cimi is the sign of the threshold-walker — the one who knows how to ' +
      'die on small scales so that larger continuities remain intact. You ' +
      'are skilled at endings: last conversations, last jobs, last selves. ' +
      'Others come to you when they are on the edge and do not yet have the ' +
      'permission to step off. The work is to practise surrender without romance, and to bless what is leaving.',
    shadow: 'Clinging — bridging for others while refusing to cross yourself.',
    gift: 'A rare grace for closure; the clean bow at the end of a chapter.',
  },
  {
    number: 7, yucatec: 'Manik', name: 'Hand', color: 'Blue', direction: 'West',
    essence: 'Accomplishment, healing through touch',
    body:
      'Manik is the hand that makes and heals. Where this sign appears, the ' +
      "body's intelligence is the primary teacher — whatever you understand, " +
      'you understand through doing. You finish what you start; you close ' +
      'circuits others leave frayed. The craft is to keep your hands busy ' +
      'with work that is worthy of them, and to remember that the gesture of kindness is a kind of mastery too.',
    shadow: 'Overwork — using the hand to avoid the heart.',
    gift: 'Competence that is also tenderness; the skill of making someone feel held by the quality of your attention.',
  },
  {
    number: 8, yucatec: 'Lamat', name: 'Star', color: 'Yellow', direction: 'South',
    essence: 'Harmony, elegance, beauty',
    body:
      'Lamat is Venus-as-day-sign — the octave star that arranges the messy ' +
      'material of life into pattern. You are a rememberer of harmony: in ' +
      'music, in rooms, in the way a meal should close. Your gift is that ' +
      'beauty is not decoration to you but load-bearing structure. The task ' +
      'is to bring your star-logic into unbeautiful places without losing it.',
    shadow: 'Aestheticising pain; choosing the elegant surface over the honest mess.',
    gift: 'Proportion — the ability to find the note a whole situation has been trying to sing.',
  },
  {
    number: 9, yucatec: 'Muluc', name: 'Moon', color: 'Red', direction: 'East',
    essence: 'Universal water, emotional memory',
    body:
      'Muluc is the red moon — the tidal intelligence that rises in you ' +
      'before you have words for it. You feel the weather of other people ' +
      'and of unseen systems. Your challenge is to keep channels open for ' +
      'the feeling without being flooded, to build riverbanks that honour ' +
      'the current. At your finest you purify: you take in the heavy water of a room and let it run clear through you.',
    shadow: 'Absorption — becoming everyone\'s moodwater and forgetting your own shore.',
    gift: 'Empathy as intelligence; you know what is true by how it feels to stand near it.',
  },
  {
    number: 10, yucatec: 'Oc', name: 'Dog', color: 'White', direction: 'North',
    essence: 'Loyalty, heart, unconditional love',
    body:
      'Oc is companion-soul — the sign of the one who shows up and keeps ' +
      'showing up. Loyalty here is not a performance but a constitution; ' +
      'you are built to love in long arcs. The other side of this gift is ' +
      'the risk of loving past what loves you back. The discipline is to ' +
      'stay tender without becoming a martyr, and to choose the pack as carefully as you serve it.',
    shadow: 'Servility — affection given where it is taken for granted.',
    gift: 'Reliability of the heart; an atmosphere of trust that makes other people braver.',
  },
  {
    number: 11, yucatec: 'Chuen', name: 'Monkey', color: 'Blue', direction: 'West',
    essence: 'Play, artistry, sacred trickery',
    body:
      'Chuen is the artisan-trickster — mind at play with matter. You are ' +
      'here to make, to mimic, to improvise, and to keep solemnity from ' +
      'calcifying. Your intelligence is lateral: you solve by approach angle ' +
      'rather than force. The task is to remember that play is a form of ' +
      "research, not avoidance — the child's attention is the scientist's too.",
    shadow: 'Deflection — turning what matters into a joke before it can land.',
    gift: 'Invention; a hand that can make a thing no one quite commissioned and everyone ends up needing.',
  },
  {
    number: 12, yucatec: 'Eb', name: 'Human', color: 'Yellow', direction: 'South',
    essence: 'Free will, the road of choice',
    body:
      'Eb is the road that walks itself — the humble, deliberate sign of a ' +
      'life composed by repeated small decisions. You are not driven by ' +
      'fate but by discernment. Your quietness is often mistaken for ' +
      'passivity; in truth you are tasting options and rejecting the ones ' +
      'that are slightly untrue. The work is to keep choosing, and to trust that the road is made by walking.',
    shadow: 'Over-deliberation — hesitating so long that the moment decides for you.',
    gift: 'A life with integrity of design; few wasted rooms, few rented ones.',
  },
  {
    number: 13, yucatec: 'Ben', name: 'Skywalker', color: 'Red', direction: 'East',
    essence: 'Prophecy, pillar between worlds',
    body:
      'Ben is the pillar-walker — the red sky-explorer who links heaven and ' +
      'earth. Where this sign lives, there is an urge to go and see: new ' +
      'cities, new practices, new states of mind. You are a scout by ' +
      'temperament, reporting back what most people never travel to fetch. ' +
      'The craft is to ground your visions in specifics, so that prophecy becomes architecture.',
    shadow: 'Restlessness — moving before you have let a place teach you.',
    gift: 'Sight — a view of where the common life is going, usable as compass.',
  },
  {
    number: 14, yucatec: 'Ix', name: 'Wizard', color: 'White', direction: 'North',
    essence: 'Timelessness, jaguar stillness',
    body:
      'Ix is the white jaguar — receptive power, heart-knowing, the wizard ' +
      'who does not announce. You are quietly formidable: aware of currents ' +
      'that other people do not see, capable of altering a room without ' +
      'raising your voice. The gift is not to prove this. The discipline is ' +
      'to remain porous without becoming spooky, and to let your knowing serve rather than seduce.',
    shadow: 'Disappearing into the pose of mystery; keeping silence as leverage rather than honesty.',
    gift: 'An unmistakable dignity; people feel watched over in your presence, and are.',
  },
  {
    number: 15, yucatec: 'Men', name: 'Eagle', color: 'Blue', direction: 'West',
    essence: 'Vision, the long view',
    body:
      'Men is the eagle who flies above weather. You see pattern where ' +
      'others see incident, strategy where others see stuckness. Your ' +
      'temperament wants scale — the view from altitude — and feels cramped ' +
      'in rooms that will not discuss the horizon. The task is to come down ' +
      'periodically and hunt in the grass, so that the vision has teeth.',
    shadow: 'Detachment — critiquing from the sky without landing.',
    gift: 'Strategic imagination; the ability to turn a fog into a plan.',
  },
  {
    number: 16, yucatec: 'Cib', name: 'Warrior', color: 'Yellow', direction: 'South',
    essence: 'Fearless intelligence, ancestral wisdom',
    body:
      'Cib is the warrior-scholar — questioning mind armed with ancestral ' +
      'memory. You go first into difficult thought, and you bring home what ' +
      'most people are too timid to examine. Your courage is not theatrical; ' +
      'it is a willingness to sit with the hard question until it yields. ' +
      'The work is to keep asking past the convenient answer, and to let the ancestors speak through your inquiry.',
    shadow: 'Cynicism — interrogation as armour against being changed.',
    gift: 'Moral nerve; the friend who names what the room is avoiding.',
  },
  {
    number: 17, yucatec: 'Caban', name: 'Earth', color: 'Red', direction: 'East',
    essence: 'Synchronicity, navigation, resonance',
    body:
      'Caban is earth-intelligence — the sign of the one who reads ' +
      'coincidence as language. Where this sign falls, life is full of ' +
      'small confirmations: the book opens at the right page, the stranger ' +
      'says the needed sentence. Your task is to become a listener to the ' +
      'field, to align with what is already in motion. Synchronicity is your native tongue.',
    shadow: 'Over-reading — turning every sparrow into a sign.',
    gift: 'Alignment; a life that arrives at the right crossroads as if by weather.',
  },
  {
    number: 18, yucatec: 'Etznab', name: 'Mirror', color: 'White', direction: 'North',
    essence: 'Truth, reflection, the clean cut',
    body:
      'Etznab is the obsidian blade that reflects without flattering. You ' +
      "see through — other people's fronts, your own excuses, the rust on " +
      'systems. The gift is clarity; the cost is that the world keeps ' +
      'presenting itself to you unfiltered. Your work is to cut with ' +
      'kindness: to use the mirror to free, not to humiliate, and to remember that the blade is inside you too.',
    shadow: 'Judgement — reflection weaponised.',
    gift: 'Discernment; the capacity to name what is true in a way that makes truth livable.',
  },
  {
    number: 19, yucatec: 'Cauac', name: 'Storm', color: 'Blue', direction: 'West',
    essence: 'Catalysis, purification, release',
    body:
      'Cauac is the thunderstorm that clears the air. You are built for ' +
      "transformation — yours and other people's — and you feel dull in " +
      'climates that refuse to change. The task is to accept that you ' +
      'arrive as weather: disturbance precedes clearing, and clearing is ' +
      'what you are for. Steward your intensity; let the storm have banks.',
    shadow: 'Chaos for its own sake — catalysing because stillness feels unsafe.',
    gift: 'Renewal; the friend after whose visit your whole life is re-oxygenated.',
  },
  {
    number: 20, yucatec: 'Ahau', name: 'Sun', color: 'Yellow', direction: 'South',
    essence: 'Enlightenment, universal love, source return',
    body:
      'Ahau is the sign of completion — the yellow sun that is also the ' +
      "seed's final destination. Those born here carry a solar temperament: " +
      'warmth-bringing, horizon-facing, able to illuminate without ' +
      'contesting. Your work is the long generosity of light, given without ' +
      'need for return. At your finest you are simply who you are, and that is already enough medicine for the room.',
    shadow: 'Burnout — giving light past your fuel and resenting the dark.',
    gift: 'Radiance; a quality of attention others leave your company richer for having received.',
  },
];

export const MAYAN_TONES: readonly MayanTone[] = [
  {
    number: 1, name: 'Magnetic', power: 'Attract',
    essence: 'Unifies purpose; the call that gathers.',
    body:
      "The Magnetic tone is the opening note — the question 'What is my " +
      "purpose?' made audible. Where this tone falls, there is a gravitas " +
      'of beginning: a pull that organises the rest of the pattern. Your ' +
      'work is to honour the magnet rather than rush past it to its products.',
  },
  {
    number: 2, name: 'Lunar', power: 'Stabilize',
    essence: 'Polarises; reveals the challenge.',
    body:
      'The Lunar tone is the sacred no — the obstacle that tells you what ' +
      'your purpose costs. Where this tone falls, duality is the teacher: ' +
      'every yes has a no inside it, and refusing to see the no weakens the yes. ' +
      'Your craft is to stabilise by accepting what resists you.',
  },
  {
    number: 3, name: 'Electric', power: 'Activate',
    essence: 'Bonds; initiates service.',
    body:
      'The Electric tone is the spark of connection — the current that ' +
      'turns purpose into activation. Here ideas become kinetic; you are ' +
      'the conductor between insight and world. The discipline is to serve ' +
      'rather than perform, to keep the circuit live in the direction of use.',
  },
  {
    number: 4, name: 'Self-Existing', power: 'Define',
    essence: "Measures form; the architect's instinct.",
    body:
      'The Self-Existing tone is the measuring tape — the tone that asks ' +
      "'What form?' and builds scaffolding for intuition. Where it falls, " +
      'there is an architectural patience: the willingness to draw the ' +
      'plan before raising the wall. Your power is definition, and ' +
      'definition is a form of love when done in the service of making a thing real.',
  },
  {
    number: 5, name: 'Overtone', power: 'Empower',
    essence: 'Radiates command; the commanding centre.',
    body:
      'The Overtone tone is the harmonic that commands attention — the ' +
      'note at the centre of the chord, around which the others arrange ' +
      'themselves. Where this tone falls, there is natural authority, and ' +
      'the invitation is to lead by being rather than by pressing. Command radiates; it does not need to push.',
  },
  {
    number: 6, name: 'Rhythmic', power: 'Organize',
    essence: 'Balances in motion; equalises.',
    body:
      'The Rhythmic tone is the equaliser — the inherent intelligence for ' +
      'ordering moving parts. Where it falls, you are the one who notices ' +
      'what is out of symmetry and nudges it back. Your competence is ' +
      'operational: a steadying hand on a process that would otherwise drift.',
  },
  {
    number: 7, name: 'Resonant', power: 'Inspire',
    essence: 'Channels attunement; mystic centre.',
    body:
      'The Resonant tone is the still centre of the thirteen — the mystic ' +
      'mid-point where attunement replaces striving. Where this tone falls, ' +
      'you are built to channel rather than to invent, to vibrate with ' +
      'sources larger than your personal will. Your task is to become a ' +
      'tuning fork: to keep yourself clean enough that what passes through you arrives intact.',
  },
  {
    number: 8, name: 'Galactic', power: 'Harmonize',
    essence: 'Models integrity; as above, so below.',
    body:
      "The Galactic tone is the integrity-model — the tone that asks 'Do I " +
      "live what I believe?' Where it falls, there is a built-in intolerance " +
      'for hypocrisy in oneself. Your discipline is coherence across scale: ' +
      'the small behaviours match the stated values, and the match itself is a form of prayer.',
  },
  {
    number: 9, name: 'Solar', power: 'Realize',
    essence: 'Pulses intention; brings into being.',
    body:
      'The Solar tone is the pulse of realisation — intention made radiant. ' +
      'Where this tone falls, you are here to manifest on a visible scale; ' +
      'things do not stay private long. The craft is to realise without ' +
      'inflating, to pulse your purpose like the sun pulses warmth: ' +
      'steadily, reliably, without needing to be praised for it.',
  },
  {
    number: 10, name: 'Planetary', power: 'Manifest',
    essence: 'Perfects the material form.',
    body:
      'The Planetary tone is the moment a purpose enters the tangible ' +
      'world. Where it falls, you are the finisher — the one who turns ' +
      'the promising sketch into a usable object. Your power is completion ' +
      'in matter, and matter rewards you: your work lasts.',
  },
  {
    number: 11, name: 'Spectral', power: 'Release',
    essence: 'Dissolves; liberates structure.',
    body:
      'The Spectral tone is the dissolver — the tone that unmakes what is ' +
      'already finished, so that the form can be freed back into spirit. ' +
      'Where this tone falls, you are disruptive by constitution: you ' +
      'cannot help clearing what has stopped serving. The discipline is ' +
      'to release with love, not anger, and to let the ending be a gift and not a wound.',
  },
  {
    number: 12, name: 'Crystal', power: 'Cooperate',
    essence: 'Dedicates universal service; the lattice.',
    body:
      'The Crystal tone is the lattice — the tone of dedicated cooperation, ' +
      'where individual will consents to the shape of the collective. Here ' +
      'you thrive in concert: in the sangha, the team, the chorus. Your ' +
      'intelligence is relational, and the relational field you steward is luminous because you will not cheat it.',
  },
  {
    number: 13, name: 'Cosmic', power: 'Endure',
    essence: 'Transcends presence; returns the spiral.',
    body:
      'The Cosmic tone is the final turn of the wavespell — the tone of ' +
      'transcendent presence, where the personal story returns to the ' +
      'larger spiral it was always part of. Where this tone falls, there ' +
      'is a longevity of soul: you are here to see something all the way ' +
      'through, and the endurance is itself the teaching.',
  },
];

/* 5 Earth Families — groups of 4 day-signs (Argüelles). */
export const EARTH_FAMILIES: Record<string, { signs: number[]; theme: string }> = {
  Polar:    { signs: [1, 6, 11, 16], theme: 'Gate-keepers of form — they anchor the pattern.' },
  Cardinal: { signs: [2, 7, 12, 17], theme: 'Openers of direction — they set the compass.' },
  Core:     { signs: [3, 8, 13, 18], theme: 'Holders of the axis — they stabilise the centre.' },
  Signal:   { signs: [4, 9, 14, 19], theme: 'Transducers — they translate spirit into signal.' },
  Gateway:  { signs: [5, 10, 15, 20], theme: 'Initiators — they open thresholds for others.' },
};

export const MAYAN_COLORS: readonly MayanColor[] = ['Red', 'White', 'Blue', 'Yellow'];
export const MAYAN_DIRECTIONS: readonly MayanDirection[] = ['East', 'North', 'West', 'South'];

/* ============================================================
 * Core compute
 * ============================================================ */

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/* Integer days between two UTC dates — pure Gregorian, no leap-skipping. */
function dayDiff(aY: number, aM: number, aD: number, bY: number, bM: number, bD: number): number {
  const aMs = Date.UTC(aY, aM - 1, aD);
  const bMs = Date.UTC(bY, bM - 1, bD);
  return Math.round((bMs - aMs) / 86400000);
}

/* Reference: 21 Dec 2012 = Kin 207 (Blue Crystal Hand). */
const MAYAN_REF_KIN = 207;
const MAYAN_REF_Y = 2012;
const MAYAN_REF_M = 12;
const MAYAN_REF_D = 21;

function kinFromDate(y: number, m: number, d: number): number {
  const diff = dayDiff(MAYAN_REF_Y, MAYAN_REF_M, MAYAN_REF_D, y, m, d);
  return mod(MAYAN_REF_KIN - 1 + diff, 260) + 1;
}

function daySignForKin(kin: number): MayanDaySign {
  return MAYAN_DAY_SIGNS[mod(kin - 1, 20)];
}

function toneForKin(kin: number): MayanTone {
  return MAYAN_TONES[mod(kin - 1, 13)];
}

function kinFromToneSign(toneNumber: number, signNumber: number): number {
  for (let k = 1; k <= 260; k++) {
    if (mod(k - 1, 13) + 1 === toneNumber && mod(k - 1, 20) + 1 === signNumber) {
      return k;
    }
  }
  // Mathematically unreachable for valid inputs (CRT guarantees a solution in [1,260]).
  throw new Error(`kinFromToneSign: no kin found for tone=${toneNumber} sign=${signNumber}`);
}

function oracleCard(kin: number): MayanOracleCard {
  const ds = daySignForKin(kin);
  const tn = toneForKin(kin);
  return {
    kin,
    name: `${ds.color} ${tn.name} ${ds.name}`,
    daySign: ds.name,
    tone: tn.name,
    toneNumber: tn.number,
    daySignNumber: ds.number,
  };
}

/* Oracle positions — standard Dreamspell reading.
 *
 *   Guide    = same tone, same colour family. Formula produces the correct
 *              guide for the canonical 260 kin combinations.
 *   Antipode = kin + 130 (mod 260); opposite polarity, same tone.
 *   Analog   = sign index (19 - i); same tone.
 *   Occult   = kin_occult = 261 - kin.
 */
function oracleForKin(kin: number): MayanOracle {
  const toneIdx = mod(kin - 1, 13); // 0..12
  const signIdx = mod(kin - 1, 20); // 0..19

  // Guide — same tone, same colour family (sign indices share mod 4).
  let guideSignIdx = mod(signIdx + 8 * (toneIdx % 5), 20);
  while (guideSignIdx % 4 !== signIdx % 4) {
    guideSignIdx = mod(guideSignIdx + 1, 20);
  }
  const guideKin = kinFromToneSign(toneIdx + 1, guideSignIdx + 1);

  // Antipode — opposite point on the 260-cycle.
  const antipodeKin = mod(kin - 1 + 130, 260) + 1;

  // Analog — partner pairing (1-20, 2-19, ..., 10-11). Same tone.
  const analogSignIdx = 19 - signIdx;
  const analogKin = kinFromToneSign(toneIdx + 1, analogSignIdx + 1);

  // Occult — hidden polarity: kin_occult = 261 - kin.
  let occultKin = 261 - kin;
  if (occultKin < 1) occultKin += 260;
  if (occultKin > 260) occultKin -= 260;

  return {
    guide: oracleCard(guideKin),
    antipode: oracleCard(antipodeKin),
    analog: oracleCard(analogKin),
    occult: oracleCard(occultKin),
  };
}

/* Galactic Year-bearer — the Kin for the July-26 that begins the year
 * containing the birthdate. */
function galacticYearForDate(y: number, m: number, d: number): MayanGalacticYear {
  let yearStartY = y;
  if (m < 7 || (m === 7 && d < 26)) yearStartY = y - 1;
  const yearKin = kinFromDate(yearStartY, 7, 26);
  const ds = daySignForKin(yearKin);
  const tn = toneForKin(yearKin);
  return {
    kinSeed: yearKin,
    yearSign: ds.name,
    yearTone: tn.name,
    yearColor: ds.color,
    yearName: `${ds.color} ${tn.name} ${ds.name}`,
    yearStartDate: `${yearStartY}-07-26`,
  };
}

/* Earth family membership for a given day-sign number (1..20). */
function earthFamilyForSign(signNumber: number): MayanEarthFamily | null {
  for (const fam of Object.keys(EARTH_FAMILIES)) {
    if (EARTH_FAMILIES[fam].signs.indexOf(signNumber) >= 0) {
      return { name: fam, theme: EARTH_FAMILIES[fam].theme };
    }
  }
  return null;
}

/* Compose a 4-5 sentence combined reading from tone + sign bodies. */
function composeReading(tone: MayanTone, sign: MayanDaySign, kin: number): string {
  const opener =
    `You enter the Tzolkin as Kin ${kin} — the ${sign.color} ${tone.name} ${sign.name}. `;
  const toneLine =
    `The ${tone.name} tone sets your opening move: ${tone.power.toLowerCase()}. `;
  const signLine =
    `${sign.name} is your day-sign, ${sign.essence.toLowerCase()} — ` +
    sign.body.split('. ')[0].replace(/^[A-Za-z]+ is /, '').toLowerCase() +
    ', and your nervous system is tuned to that frequency. ';
  const fusion =
    `Together, tone and sign ask you to ${tone.power.toLowerCase()}` +
    ` through the medium of ${sign.name.toLowerCase()} — to use ` +
    `${sign.essence.toLowerCase()} as the instrument that makes your ${tone.power.toLowerCase()} visible. `;
  const closing =
    'The practice of this Kin is to live it on purpose: not as destiny, ' +
    'but as a signal to tune by.';
  return opener + toneLine + signLine + fusion + closing;
}

function lifePurposeLine(tone: MayanTone, sign: MayanDaySign): string {
  return (
    `To ${tone.power.toLowerCase()} what ${sign.name.toLowerCase()} ` +
    `was born to carry — ${sign.essence.toLowerCase()} — in a form ` +
    'the world can receive.'
  );
}

function shadowWorkLine(tone: MayanTone, sign: MayanDaySign): string {
  const tail =
    tone.number <= 4 ? 'premature action' :
    tone.number <= 8 ? 'performative balance' :
    tone.number <= 11 ? 'brittle perfectionism' :
    'loftiness that forgets the body';
  return (
    `The pitfall is ${sign.shadow.replace(/\.$/, '')}, compounded when ` +
    `the ${tone.name} tone overshoots into ${tail}. ` +
    'The inner work is to stay honest with the signal and patient with the form.'
  );
}

/* ============================================================
 * Public API
 * ============================================================ */

export type MayanInput = { y: number; m: number; d: number };

export function computeMayan(input: MayanInput): MayanResult {
  const { y, m, d } = input;

  const kin = kinFromDate(y, m, d);
  const ds = daySignForKin(kin);
  const tn = toneForKin(kin);
  const earthFam = earthFamilyForSign(ds.number);
  const oracle = oracleForKin(kin);
  const gYear = galacticYearForDate(y, m, d);

  const reading = composeReading(tn, ds, kin);
  const life = lifePurposeLine(tn, ds);
  const shadowWork = shadowWorkLine(tn, ds);

  return {
    kin,
    kinName: `${ds.color} ${tn.name} ${ds.name}`,
    daySign: ds,
    tone: tn,
    colorCycle: ds.color,
    direction: ds.direction,
    earthFamily: earthFam,
    oracle,
    galacticYear: gYear,
    interpretation: {
      body: ds.body,
      lifePurpose: life,
      shadowWork,
      combinedReading: reading,
    },
  };
}
