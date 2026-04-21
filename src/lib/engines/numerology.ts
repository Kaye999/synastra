// Numerology engine — typed port of the numerology section of astrology-transits.jsx
// (lines 343–513, 2925–3077).

import type { BirthData } from '../types';

/* ============================================================
 * Letter maps
 * ============================================================ */

// Pythagorean letter values (A=1..I=9, J=1..R=9, S=1..Z=8)
export const PYTH_MAP: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};

// Chaldean letter values (1-8, no 9 — 9 reserved as sacred)
export const CHALDEAN_MAP: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,
  J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,
  S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7,
};

// Hebrew gematria (for Kabbalah use — reused by the kabbalah UI).
export const GEMATRIA_MAP: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:3,H:5,I:10,J:10,
  K:11,L:30,M:40,N:50,O:70,P:80,Q:100,R:200,
  S:300,T:400,U:6,V:6,W:6,X:60,Y:10,Z:7,
};

export const VOWELS: ReadonlySet<string> = new Set(['A','E','I','O','U']);

/* ============================================================
 * Helpers
 * ============================================================ */

// 'Y' is often a vowel in numerology — treat Y as vowel when between consonants or at word-end.
function isVowelAt(str: string, i: number): boolean {
  const c = str[i];
  if (!c) return false;
  if (VOWELS.has(c)) return true;
  if (c === 'Y') {
    const prev = str[i - 1];
    const next = str[i + 1];
    const prevIsVowel = !!prev && VOWELS.has(prev);
    const nextIsVowel = !!next && VOWELS.has(next);
    if (!prevIsVowel && !nextIsVowel) return true;
    return false;
  }
  return false;
}

export function letterSum(name: string, map: Record<string, number>): number {
  return name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((s, c) => s + (map[c] || 0), 0);
}

export function reduceNum(n: number, keepMaster = true): number {
  let x = n;
  const isMaster = (v: number) => v === 11 || v === 22 || v === 33;
  while (x > 9) {
    if (keepMaster && isMaster(x)) return x;
    x = String(x).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return x;
}

export function vowelSum(name: string, map: Record<string, number>): number {
  const clean = name.toUpperCase().replace(/[^A-Z ]/g, '');
  const words = clean.split(' ').filter(Boolean);
  let raw = 0;
  for (const w of words) {
    let s = 0;
    for (let i = 0; i < w.length; i++) {
      if (isVowelAt(w, i)) s += (map[w[i]] || 0);
    }
    raw += s;
  }
  return raw;
}

export function consonantSum(name: string, map: Record<string, number>): number {
  const clean = name.toUpperCase().replace(/[^A-Z ]/g, '');
  const words = clean.split(' ').filter(Boolean);
  let raw = 0;
  for (const w of words) {
    let s = 0;
    for (let i = 0; i < w.length; i++) {
      if (/[A-Z]/.test(w[i]) && !isVowelAt(w, i)) s += (map[w[i]] || 0);
    }
    raw += s;
  }
  return raw;
}

/* ============================================================
 * Kabbalah gematria helpers (re-exported for Kabbalah UI).
 * ============================================================ */

export function calcG(name: string): number {
  return name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((s, c) => s + (GEMATRIA_MAP[c] || 0), 0);
}

export function reduceS(n: number): number {
  let x = n;
  while (x > 10) {
    x = String(x).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return x;
}

/* ============================================================
 * Shared meanings
 * ============================================================ */

export const NUM_MEANINGS: Record<number, { title: string; general: string }> = {
  1: { title:'The Pioneer',      general:'Independence, initiative, leadership, originality. The number of the one who starts things. Pure self, willpower, and the authority to lead.' },
  2: { title:'The Diplomat',     general:'Cooperation, sensitivity, balance, partnership. The number of the peacemaker — works through harmony, tact, and receptivity to nuance.' },
  3: { title:'The Communicator', general:'Creativity, self-expression, joy, social energy. The number of the artist and the storyteller — lives through voice, words, and shared celebration.' },
  4: { title:'The Builder',      general:'Order, structure, foundations, discipline. The number of the craftsman — masters form, systems, and long-horizon construction.' },
  5: { title:'The Explorer',     general:'Freedom, change, adaptability, sensory curiosity. The number of the wanderer — thrives on variety, risk, and dynamic experience.' },
  6: { title:'The Nurturer',     general:'Responsibility, service, beauty, home. The number of the carer and the aesthete — builds through love, harmony, and protective attention.' },
  7: { title:'The Mystic',       general:'Analysis, introspection, spiritual depth, solitude. The number of the sage — seeks truth beneath surfaces, prefers wisdom over applause.' },
  8: { title:'The Executive',    general:'Power, authority, material mastery, ambition. The number of the empire-builder — operates through scale, leverage, and the architecture of capital.' },
  9: { title:'The Humanitarian', general:'Completion, universal love, wisdom of the old soul. The number of endings that become beginnings — serves the many through transmuted personal experience.' },
  11:{ title:'The Illuminator',  general:'Master intuition, psychic sensitivity, spiritual revelation. 11 is the electric channel — inspiration strikes through rather than being manufactured.' },
  22:{ title:'Master Builder',   general:'The highest manifestation number — turns visionary intuition into durable physical architecture. 11\'s vision plus 4\'s discipline, doubled.' },
  33:{ title:'Master Teacher',   general:'Christ consciousness, service through sacrificial love. The rarest master number — only genuine when expressed through complete devotion to others.' },
};

/* ============================================================
 * Public engine
 * ============================================================ */

export type NumerologyObj = {
  number: number;
  raw: number;
  calc: string;
  title: string;
  general: string;
  forYou: string;
  year?: number;
};

export type PinnaclePhase = {
  n: number;
  ageRange: string;
  phase: string;
  calc: string;
  title: string | undefined;
  forYou: string;
};

export type ChallengePhase = {
  n: number;
  phase: string;
  calc: string;
  forYou: string;
};

export type NumerologyResult = {
  lifePath: number;
  lifePathRaw: number;
  expression: number;
  expressionRaw: number;
  soulUrge: number;
  soulUrgeRaw: number;
  personality: number;
  personalityRaw: number;
  birthday: number;
  maturity: number;
  personalYear: number;
  p1End: number;
  p3End: number;

  lifePathObj: NumerologyObj;
  expressionObj: NumerologyObj;
  soulUrgeObj: NumerologyObj;
  personalityObj: NumerologyObj;
  birthdayObj: NumerologyObj;
  maturityObj: NumerologyObj;
  personalYearObj: NumerologyObj;
  balanceObj: NumerologyObj;
  hiddenPassionObj: NumerologyObj;

  pinnacles: PinnaclePhase[];
  challenges: ChallengePhase[];
  karmicDebts: { name: string; value: number }[];
  karmicLessons: number[];
  hiddenPassion: { number: number; count: number; distribution: Record<number, number> };
  tradCompare: {
    name: string;
    pyth: { raw: number; reduced: number };
    chal: { raw: number; reduced: number };
    kab: { raw: number | null; reduced: number | null };
  }[];
};

export function computeNumerology(
  fullName: string,
  dob: BirthData['dob'],
  currentYear: number,
  firstName?: string,
): NumerologyResult {
  const name = fullName || '';
  const FN = firstName || name.split(' ')[0] || 'You';
  const { d, m, y } = dob;

  const sumDigits = (n: number) => String(Math.abs(n)).split('').reduce((s, c) => s + parseInt(c, 10), 0);

  const LP_RAW = sumDigits(d) + sumDigits(m) + sumDigits(y);
  const LP = reduceNum(LP_RAW);

  const EXPR_RAW = letterSum(name, PYTH_MAP);
  const EXPR = reduceNum(EXPR_RAW);

  const SU_RAW = vowelSum(name, PYTH_MAP);
  const SU = reduceNum(SU_RAW);

  const PR_RAW = consonantSum(name, PYTH_MAP);
  const PR = reduceNum(PR_RAW);

  const BD = reduceNum(d);

  const MAT_RAW = LP + EXPR;
  const MAT = reduceNum(MAT_RAW);

  const PY_RAW = reduceNum(d, false) + reduceNum(m, false) + reduceNum(currentYear, false);
  const PY = reduceNum(PY_RAW);

  const PIN1 = reduceNum(reduceNum(m, false) + reduceNum(d, false));
  const PIN2 = reduceNum(reduceNum(d, false) + reduceNum(y, false));
  const PIN3 = reduceNum(PIN1 + PIN2);
  const PIN4 = reduceNum(reduceNum(m, false) + reduceNum(y, false));
  const P1_END = Math.max(0, 36 - LP);
  const P2_END = P1_END + 9;
  const P3_END = P2_END + 9;

  const CHAL1 = Math.abs(reduceNum(m, false) - reduceNum(d, false));
  const CHAL2 = Math.abs(reduceNum(d, false) - reduceNum(y, false));
  const CHAL3 = Math.abs(CHAL1 - CHAL2);
  const CHAL4 = Math.abs(reduceNum(m, false) - reduceNum(y, false));

  const debts = [
    { name: 'Life Path raw',   value: LP_RAW },
    { name: 'Expression raw',  value: EXPR_RAW },
    { name: 'Soul Urge raw',   value: SU_RAW },
    { name: 'Personality raw', value: PR_RAW },
    { name: 'Birthday',        value: d },
  ].filter(c => [13, 14, 16, 19].includes(c.value));

  const nameDigits = name.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => PYTH_MAP[c] || 0);
  const present = new Set(nameDigits);
  const lessons: number[] = [];
  for (let i = 1; i <= 9; i++) if (!present.has(i)) lessons.push(i);

  const counts: Record<number, number> = {};
  nameDigits.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  let maxC = 0;
  let hpNum = 0;
  for (const [k, c] of Object.entries(counts)) {
    if (c > maxC) { maxC = c; hpNum = parseInt(k, 10); }
  }

  const initials = name.split(' ').filter(Boolean).map(w => w[0] || '').join('').toUpperCase();
  const BAL_RAW = letterSum(initials, PYTH_MAP);
  const BAL = reduceNum(BAL_RAW);

  const CHAL_EXP_RAW = letterSum(name, CHALDEAN_MAP);
  const CHAL_EXP = reduceNum(CHAL_EXP_RAW);
  const CHAL_SU_RAW = vowelSum(name, CHALDEAN_MAP);
  const CHAL_SU = reduceNum(CHAL_SU_RAW);
  const CHAL_PR_RAW = consonantSum(name, CHALDEAN_MAP);
  const CHAL_PR = reduceNum(CHAL_PR_RAW);

  const KAB_RAW = calcG(name);
  const KAB_RED = reduceS(KAB_RAW);

  const LP_FOR: Record<number, string> = {
    1: `Life Path 1 is the initiator's number — you arrived to start things. ${FN}, your work is to lead by example, to take first steps others hesitate at, and to trust your own direction. The shadow is isolation masquerading as independence; the gift is the authority to begin.`,
    2: `Life Path 2 is the diplomat's number — you arrived to build through partnership, harmony, and tactful reading of others. ${FN}, your power is relational. The shadow is over-accommodation; the gift is the capacity to mediate without losing yourself.`,
    3: `Life Path 3 is the communicator's number — you arrived to express, create, and uplift through voice. ${FN}, your craft is shared celebration and spoken colour. The shadow is scattered energy; the gift is language that moves people.`,
    4: `Life Path 4 is the builder's number — you arrived to work with structure, patience, and long-horizon construction. ${FN}, your domain is durable systems. The shadow is rigidity; the gift is integrity that outlasts short cycles.`,
    5: `Life Path 5 is the explorer's number — you arrived to move through variety, risk, and sensory experience. ${FN}, your vitality depends on change. The shadow is restlessness; the gift is adaptive intelligence others cannot match.`,
    6: `Life Path 6 is the nurturer's number — you arrived to protect, beautify, and take responsibility for those inside your circle. ${FN}, your work is care made concrete. The shadow is over-responsibility; the gift is the home others return to.`,
    7: `Life Path 7 is the mystic's number — you arrived for depth, analysis, and the truths hidden beneath surfaces. ${FN}, your mode is solitude that becomes wisdom. The shadow is withdrawal; the gift is sight.`,
    8: `Life Path 8 is the executive's number — you arrived to work with power, material mastery, and the architecture of leverage. ${FN}, your frequency is scale. The shadow is dominance without service; the gift is sovereign stewardship of resources.`,
    9: `Life Path 9 is the completionist's number — you arrived with the wisdom of the old soul, to serve the many by transmuting personal experience. ${FN}, your work closes cycles others cannot see the shape of. The shadow is arrogance dressed as vision; the gift is the capacity to weave whole systems.`,
    11: `Life Path 11 is the illuminator's master number — you arrived as a channel. ${FN}, inspiration strikes through you rather than being manufactured. The shadow is nervous overload; the gift is prophetic clarity.`,
    22: `Life Path 22 is the master builder — you arrived to turn vision into durable architecture. ${FN}, you carry the capacity to build what lasts centuries. The shadow is paralysis before the scale; the gift is manifestation at industrial weight.`,
    33: `Life Path 33 is the master teacher — you arrived for service through sacrificial love. ${FN}, this is the rarest vibration. The shadow is martyrdom; the gift is transmission that changes people without their knowing it.`,
  };

  type Kind =
    | 'lifePath' | 'expression' | 'soulUrge' | 'personality'
    | 'birthday' | 'maturity' | 'personalYear' | 'balance' | 'hiddenPassion';

  const generalInterp = (n: number, kind: Kind) => {
    const base = NUM_MEANINGS[n]?.general || '';
    const suffixes: Record<Kind, string> = {
      lifePath: '',
      expression: ` Your Expression ${n} is the outer manifestation of your identity — how you build, speak, and leave a mark. ${FN}, your name vibrates at this frequency; it is the resonance strangers feel before you open your mouth.`,
      soulUrge:   ` Your Soul Urge ${n} is what you secretly want beneath all the surface goals. ${FN}, this is the quiet engine driving your decisions when no one is watching. Direct it consciously.`,
      personality:` Your Personality ${n} is the mask — what people perceive before you speak. ${FN}, this is the first signal your name emits; notice whether it helps or hides what you actually offer.`,
      birthday:   ` Your Birthday ${n} is the secondary note beneath your Life Path — a specific gift stamped into the day you arrived. ${FN}, this is the tool you were given to complete the lifetime's larger work.`,
      maturity:   ` Your Maturity ${n} is the integrated self that comes fully online around ages 35-45 — the final form of your character when Life Path and Expression merge. ${FN}, this is who you are becoming.`,
      personalYear: ` Personal Year ${n} in ${currentYear} colours the whole year with a specific current. ${FN}, align your moves with this vibration and the year works with you; push against it and the year costs more than it should.`,
      balance:    ` Your Balance Number ${n} is the default you return to under pressure — the reset frequency of your system. ${FN}, when stress spikes, this is the state your nature reaches for.`,
      hiddenPassion: ` Hidden Passion ${n} is the frequency your name sounds unconsciously — the skill your nature keeps reaching for without being asked. ${FN}, it's a default, not a destination. Direct it and it becomes a superpower.`,
    };
    return base + (suffixes[kind] || '');
  };

  const makeObj = (num: number, raw: number, calc: string, kind: Kind): NumerologyObj => ({
    number: num,
    raw,
    calc,
    title: NUM_MEANINGS[num]?.title || '—',
    general: NUM_MEANINGS[num]?.general || '',
    forYou: kind === 'lifePath'
      ? LP_FOR[num] || `Life Path ${num} carries its own work. ${FN}, meet it with honesty.`
      : generalInterp(num, kind),
  });

  const pinnacleFor = (n: number, phase: string) =>
    `This ${phase.toLowerCase()} pinnacle carries the vibration of ${n} — ${NUM_MEANINGS[n]?.general || ''} ${FN}, the lesson of this cycle is to live the ${NUM_MEANINGS[n]?.title?.toLowerCase() || n}'s gift consciously rather than by reflex.`;
  const challengeFor = (n: number, phase: string) =>
    `This ${phase.toLowerCase()} challenge is the friction of ${n} — the specific internal tension to work through during this cycle. ${FN}, name it when it shows up; named friction is workable, unnamed friction loops.`;

  return {
    lifePath: LP, lifePathRaw: LP_RAW,
    expression: EXPR, expressionRaw: EXPR_RAW,
    soulUrge: SU, soulUrgeRaw: SU_RAW,
    personality: PR, personalityRaw: PR_RAW,
    birthday: BD, maturity: MAT, personalYear: PY,
    p1End: P1_END, p3End: P3_END,

    lifePathObj: makeObj(LP, LP_RAW, `${sumDigits(d)} (day) + ${sumDigits(m)} (month) + ${sumDigits(y)} (year) = ${LP_RAW} → ${LP}`, 'lifePath'),
    expressionObj: makeObj(EXPR, EXPR_RAW, `sum of all letters in "${name}" = ${EXPR_RAW} → ${EXPR}`, 'expression'),
    soulUrgeObj: makeObj(SU, SU_RAW, `sum of vowels in "${name}" = ${SU_RAW} → ${SU}`, 'soulUrge'),
    personalityObj: makeObj(PR, PR_RAW, `sum of consonants in "${name}" = ${PR_RAW} → ${PR}`, 'personality'),
    birthdayObj: makeObj(BD, d, `Day of birth ${d} → ${BD}`, 'birthday'),
    maturityObj: makeObj(MAT, MAT_RAW, `Life Path ${LP} + Expression ${EXPR} = ${MAT_RAW} → ${MAT}`, 'maturity'),
    personalYearObj: { ...makeObj(PY, PY_RAW, `Day + Month + Year(${currentYear}) reduced = ${PY_RAW} → ${PY}`, 'personalYear'), year: currentYear },
    balanceObj: makeObj(BAL, BAL_RAW, `Initials ${initials} → ${BAL_RAW} → ${BAL}`, 'balance'),
    hiddenPassionObj: makeObj(hpNum, maxC, `Most frequent digit in name · ${hpNum} appears ${maxC} times`, 'hiddenPassion'),

    pinnacles: [
      { n: PIN1, ageRange: `Birth – ${P1_END}`,      phase: 'First Pinnacle · Youth',        calc: `month + day → ${PIN1}`, title: NUM_MEANINGS[PIN1]?.title, forYou: pinnacleFor(PIN1, 'first') },
      { n: PIN2, ageRange: `${P1_END + 1} – ${P2_END}`, phase: 'Second Pinnacle · Building',    calc: `day + year → ${PIN2}`,  title: NUM_MEANINGS[PIN2]?.title, forYou: pinnacleFor(PIN2, 'second') },
      { n: PIN3, ageRange: `${P2_END + 1} – ${P3_END}`, phase: 'Third Pinnacle · Integration',  calc: `P1 + P2 → ${PIN3}`,     title: NUM_MEANINGS[PIN3]?.title, forYou: pinnacleFor(PIN3, 'third') },
      { n: PIN4, ageRange: `${P3_END + 1} – onwards`,   phase: 'Fourth Pinnacle · Legacy',      calc: `month + year → ${PIN4}`, title: NUM_MEANINGS[PIN4]?.title, forYou: pinnacleFor(PIN4, 'fourth') },
    ],
    challenges: [
      { n: CHAL1, phase: 'First Challenge · Youth',      calc: `|month − day| = ${CHAL1}`, forYou: challengeFor(CHAL1, 'first') },
      { n: CHAL2, phase: 'Second Challenge · Adulthood', calc: `|day − year| = ${CHAL2}`, forYou: challengeFor(CHAL2, 'second') },
      { n: CHAL3, phase: 'Main Challenge · Lifetime',    calc: `|C1 − C2| = ${CHAL3}`, forYou: challengeFor(CHAL3, 'main') },
      { n: CHAL4, phase: 'Fourth Challenge · Later Life', calc: `|month − year| = ${CHAL4}`, forYou: challengeFor(CHAL4, 'fourth') },
    ],
    karmicDebts: debts,
    karmicLessons: lessons,
    hiddenPassion: { number: hpNum, count: maxC, distribution: counts },
    tradCompare: [
      { name: 'Expression',  pyth: { raw: EXPR_RAW, reduced: EXPR }, chal: { raw: CHAL_EXP_RAW, reduced: CHAL_EXP }, kab: { raw: KAB_RAW, reduced: KAB_RED } },
      { name: 'Soul Urge',   pyth: { raw: SU_RAW, reduced: SU },     chal: { raw: CHAL_SU_RAW, reduced: CHAL_SU },   kab: { raw: null, reduced: null } },
      { name: 'Personality', pyth: { raw: PR_RAW, reduced: PR },     chal: { raw: CHAL_PR_RAW, reduced: CHAL_PR },   kab: { raw: null, reduced: null } },
    ],
  };
}
