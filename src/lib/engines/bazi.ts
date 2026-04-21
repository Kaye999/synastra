// BaZi (Chinese Four Pillars) engine — typed port of the BaZi section of
// astrology-transits.jsx (lines 3080–3505, plus HEAVENLY_STEMS/EARTHLY_BRANCHES
// at 639–665).

import type { BirthData, Gender } from '../types';

/* ============================================================
 * Core tables
 * ============================================================ */

export const STEM_ORDER = [
  'Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui',
] as const;

export const BRANCH_ORDER = [
  'Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu_b', 'Wei', 'Shen', 'You', 'Xu', 'Hai',
] as const;

export const BRANCH_ANIMAL = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
] as const;

export type Stem = (typeof STEM_ORDER)[number];
export type Branch = (typeof BRANCH_ORDER)[number];
export type Element = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type YinYang = 'Yin' | 'Yang';

export type StemInfo = { en: string; hanzi: string; element: Element; yy: YinYang };
export type BranchInfo = { en: string; hanzi: string; animal: string; element: Element; hour: string };

export const HEAVENLY_STEMS: Record<Stem, StemInfo> = {
  Jia:  { en: 'Jia',  hanzi: '甲', element: 'Wood',  yy: 'Yang' },
  Yi:   { en: 'Yi',   hanzi: '乙', element: 'Wood',  yy: 'Yin'  },
  Bing: { en: 'Bing', hanzi: '丙', element: 'Fire',  yy: 'Yang' },
  Ding: { en: 'Ding', hanzi: '丁', element: 'Fire',  yy: 'Yin'  },
  Wu:   { en: 'Wu',   hanzi: '戊', element: 'Earth', yy: 'Yang' },
  Ji:   { en: 'Ji',   hanzi: '己', element: 'Earth', yy: 'Yin'  },
  Geng: { en: 'Geng', hanzi: '庚', element: 'Metal', yy: 'Yang' },
  Xin:  { en: 'Xin',  hanzi: '辛', element: 'Metal', yy: 'Yin'  },
  Ren:  { en: 'Ren',  hanzi: '壬', element: 'Water', yy: 'Yang' },
  Gui:  { en: 'Gui',  hanzi: '癸', element: 'Water', yy: 'Yin'  },
};

export const EARTHLY_BRANCHES: Record<Branch, BranchInfo> = {
  Zi:   { en: 'Zi',   hanzi: '子', animal: 'Rat',     element: 'Water', hour: '23:00–01:00' },
  Chou: { en: 'Chou', hanzi: '丑', animal: 'Ox',      element: 'Earth', hour: '01:00–03:00' },
  Yin:  { en: 'Yin',  hanzi: '寅', animal: 'Tiger',   element: 'Wood',  hour: '03:00–05:00' },
  Mao:  { en: 'Mao',  hanzi: '卯', animal: 'Rabbit',  element: 'Wood',  hour: '05:00–07:00' },
  Chen: { en: 'Chen', hanzi: '辰', animal: 'Dragon',  element: 'Earth', hour: '07:00–09:00' },
  Si:   { en: 'Si',   hanzi: '巳', animal: 'Snake',   element: 'Fire',  hour: '09:00–11:00' },
  Wu_b: { en: 'Wu',   hanzi: '午', animal: 'Horse',   element: 'Fire',  hour: '11:00–13:00' },
  Wei:  { en: 'Wei',  hanzi: '未', animal: 'Goat',    element: 'Earth', hour: '13:00–15:00' },
  Shen: { en: 'Shen', hanzi: '申', animal: 'Monkey',  element: 'Metal', hour: '15:00–17:00' },
  You:  { en: 'You',  hanzi: '酉', animal: 'Rooster', element: 'Metal', hour: '17:00–19:00' },
  Xu:   { en: 'Xu',   hanzi: '戌', animal: 'Dog',     element: 'Earth', hour: '19:00–21:00' },
  Hai:  { en: 'Hai',  hanzi: '亥', animal: 'Pig',     element: 'Water', hour: '21:00–23:00' },
};

// Approximate solar term boundaries (month branch start).
const MONTH_TERM_TABLE: { month: number; day: number; branchIdx: number }[] = [
  { month: 2,  day: 4, branchIdx: 2  }, // Yin / Tiger
  { month: 3,  day: 6, branchIdx: 3  }, // Mao / Rabbit
  { month: 4,  day: 5, branchIdx: 4  }, // Chen / Dragon
  { month: 5,  day: 6, branchIdx: 5  }, // Si / Snake
  { month: 6,  day: 6, branchIdx: 6  }, // Wu_b / Horse
  { month: 7,  day: 7, branchIdx: 7  }, // Wei / Goat
  { month: 8,  day: 8, branchIdx: 8  }, // Shen / Monkey
  { month: 9,  day: 8, branchIdx: 9  }, // You / Rooster
  { month: 10, day: 8, branchIdx: 10 }, // Xu / Dog
  { month: 11, day: 7, branchIdx: 11 }, // Hai / Pig
  { month: 12, day: 7, branchIdx: 0  }, // Zi / Rat
  { month: 1,  day: 6, branchIdx: 1  }, // Chou / Ox
];

export type HiddenStem = { stem: Stem; note: string };

export const BRANCH_HIDDEN: Record<Branch, HiddenStem[]> = {
  Zi:   [{ stem: 'Gui',  note: 'primary (Yin Water)' }],
  Chou: [{ stem: 'Ji',   note: 'primary (Yin Earth)' }, { stem: 'Gui', note: 'secondary (Yin Water)' }, { stem: 'Xin', note: 'tertiary (Yin Metal)' }],
  Yin:  [{ stem: 'Jia',  note: 'primary (Yang Wood)' }, { stem: 'Bing', note: 'secondary (Yang Fire)' }, { stem: 'Wu', note: 'tertiary (Yang Earth)' }],
  Mao:  [{ stem: 'Yi',   note: 'primary (Yin Wood)' }],
  Chen: [{ stem: 'Wu',   note: 'primary (Yang Earth)' }, { stem: 'Yi', note: 'secondary (Yin Wood)' }, { stem: 'Gui', note: 'tertiary (Yin Water)' }],
  Si:   [{ stem: 'Bing', note: 'primary (Yang Fire)' }, { stem: 'Geng', note: 'secondary (Yang Metal)' }, { stem: 'Wu', note: 'tertiary (Yang Earth)' }],
  Wu_b: [{ stem: 'Ding', note: 'primary (Yin Fire)' }, { stem: 'Ji', note: 'secondary (Yin Earth)' }],
  Wei:  [{ stem: 'Ji',   note: 'primary (Yin Earth)' }, { stem: 'Ding', note: 'secondary (Yin Fire)' }, { stem: 'Yi', note: 'tertiary (Yin Wood)' }],
  Shen: [{ stem: 'Geng', note: 'primary (Yang Metal)' }, { stem: 'Ren', note: 'secondary (Yang Water)' }, { stem: 'Wu', note: 'tertiary (Yang Earth)' }],
  You:  [{ stem: 'Xin',  note: 'primary (Yin Metal)' }],
  Xu:   [{ stem: 'Wu',   note: 'primary (Yang Earth)' }, { stem: 'Xin', note: 'secondary (Yin Metal)' }, { stem: 'Ding', note: 'tertiary (Yin Fire)' }],
  Hai:  [{ stem: 'Ren',  note: 'primary (Yang Water)' }, { stem: 'Jia', note: 'secondary (Yang Wood)' }],
};

export type AnimalTraits = {
  strengths: string[];
  weaknesses: string[];
  luckyColors: string[];
  luckyNumbers: number[];
  luckyDirections: string[];
  careerAffinity: string;
};

export const ANIMAL_TRAITS_MAP: Record<string, AnimalTraits> = {
  Rat:     { strengths:['Intelligent','Resourceful','Charming','Adaptable','Ambitious'], weaknesses:['Restless','Opportunistic under stress','Over-thinker'], luckyColors:['Blue','Gold','Green'], luckyNumbers:[2,3], luckyDirections:['North','Southeast'], careerAffinity:'Finance, writing, research, technology, strategy.' },
  Ox:      { strengths:['Dependable','Strong-willed','Methodical','Patient','Honest'],   weaknesses:['Stubborn','Slow to change','Over-serious'],               luckyColors:['Yellow','White','Green'], luckyNumbers:[1,4], luckyDirections:['North','South'],   careerAffinity:'Agriculture, engineering, law, project management.' },
  Tiger:   { strengths:['Courageous','Charismatic','Dynamic','Generous','Independent'],  weaknesses:['Impulsive','Restless','Authority-resistant'],             luckyColors:['Blue','Grey','Orange'], luckyNumbers:[1,3,4], luckyDirections:['East','North'], careerAffinity:'Leadership, entrepreneurship, creative arts, activism.' },
  Rabbit:  { strengths:['Gentle','Strategic','Diplomatic','Refined','Intuitive'],        weaknesses:['Conflict-averse','Moody','Over-cautious'],                luckyColors:['Red','Pink','Purple'], luckyNumbers:[3,4,6], luckyDirections:['East','South'], careerAffinity:'Design, diplomacy, healing arts, publishing.' },
  Dragon:  { strengths:['Powerful','Visionary','Magnetic','Generous','Confident'],      weaknesses:['Arrogant','Impatient','Demanding'],                        luckyColors:['Gold','Silver','White'], luckyNumbers:[1,6,7], luckyDirections:['East','North'], careerAffinity:'Entrepreneurship, politics, performance, leadership.' },
  Snake:   { strengths:['Wise','Intuitive','Elegant','Strategic','Deep'],                weaknesses:['Secretive','Jealous','Overly-introspective'],              luckyColors:['Red','Yellow','Black'], luckyNumbers:[2,8,9], luckyDirections:['South','West'], careerAffinity:'Research, analysis, the arts, philosophy, mysticism.' },
  Horse:   { strengths:['Energetic','Free-spirited','Warm','Witty','Confident'],        weaknesses:['Impatient','Scattered','Impulsive'],                      luckyColors:['Brown','Yellow','Violet'], luckyNumbers:[2,3,7], luckyDirections:['South','East'], careerAffinity:'Travel, sports, sales, communications, entertainment.' },
  Goat:    { strengths:['Artistic','Gentle','Empathetic','Creative','Persistent'],      weaknesses:['Moody','Indecisive','Self-pitying'],                       luckyColors:['Green','Red','Purple'], luckyNumbers:[3,4,9], luckyDirections:['North','East'], careerAffinity:'Arts, design, caregiving, teaching, crafts.' },
  Monkey:  { strengths:['Intelligent','Strategic','Adaptable','Witty','Innovative','Curious','Resourceful'], weaknesses:['Impatient','Over-confident','Mischievous when bored','Can be manipulative under stress'], luckyColors:['White','Gold','Blue'], luckyNumbers:[1,7,8], luckyDirections:['North','Northwest','West'], careerAffinity:'Entrepreneurship, finance, strategy, technology, consulting.' },
  Rooster: { strengths:['Confident','Punctual','Honest','Hard-working','Observant'],    weaknesses:['Critical','Proud','Show-off tendency'],                    luckyColors:['Gold','Brown','Yellow'], luckyNumbers:[5,7,8], luckyDirections:['South','Southeast'], careerAffinity:'Journalism, performance, analysis, military, public service.' },
  Dog:     { strengths:['Loyal','Honest','Just','Protective','Kind'],                    weaknesses:['Anxious','Stubborn','Pessimistic'],                         luckyColors:['Red','Green','Purple'], luckyNumbers:[3,4,9], luckyDirections:['East','South'], careerAffinity:'Law, medicine, social work, service, counselling.' },
  Pig:     { strengths:['Honest','Generous','Diligent','Optimistic','Sincere'],         weaknesses:['Naïve','Indulgent','Over-trusting'],                       luckyColors:['Yellow','Grey','Brown'], luckyNumbers:[2,5,8], luckyDirections:['Southeast','Northeast'], careerAffinity:'Hospitality, entrepreneurship, caregiving, finance.' },
};

export const ANIMAL_HANZI: Record<string, string> = {
  Rat:'鼠', Ox:'牛', Tiger:'虎', Rabbit:'兔', Dragon:'龍', Snake:'蛇',
  Horse:'馬', Goat:'羊', Monkey:'猴', Rooster:'雞', Dog:'狗', Pig:'豬',
};

/* ============================================================
 * Helpers
 * ============================================================ */

export function jdnFromDate(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d
    + Math.floor((153 * m2 + 2) / 5)
    + 365 * y2
    + Math.floor(y2 / 4)
    - Math.floor(y2 / 100)
    + Math.floor(y2 / 400)
    - 32045;
}

function pillarInterp(
  key: 'year' | 'month' | 'day' | 'hour',
  _label: string,
  stem: string,
  element: string,
  yy: string,
  animal: string,
  _hiddenStems: HiddenStem[],
  FN: string,
): string {
  const framing: Record<string, string> = {
    year:  `Your year pillar is the signature strangers meet first — your public-facing identity and the energy of your first 16 years of life.`,
    month: `Your month pillar governs career and parents, and dominates life between ages 17 and 32. This is the engine of your working life.`,
    day:   `Your day pillar is your core self — the you beneath the performed identity, and the energy of your primary relationship and ages 33-48.`,
    hour:  `Your hour pillar is the legacy kernel — the seed that ripens in the second half of life, and the energy you transmit to children and long-term work.`,
  };
  return `${framing[key] || ''} ${yy} ${element} over ${animal} (${stem}) carries the ${element.toLowerCase()}-${yy.toLowerCase()} signature. ${FN}, read the pillar as a compound note: the stem shows what you express; the branch shows the hidden conditions you carry; the hidden stems inside the branch show the sub-frequencies of this pillar. The work of this pillar is to live its energy consciously rather than by default.`;
}

type TenGodName =
  | 'Friend' | 'Rob Wealth' | 'Eating God' | 'Hurting Officer'
  | 'Direct Wealth' | 'Indirect Wealth' | 'Direct Officer' | '7 Killings'
  | 'Direct Resource' | 'Indirect Resource';

function tenGodFor(dayStem: Stem, targetStem: Stem): TenGodName | null {
  const DS = HEAVENLY_STEMS[dayStem];
  const TS = HEAVENLY_STEMS[targetStem];
  if (!DS || !TS) return null;
  const samePol = DS.yy === TS.yy;
  const GEN: Record<Element, Element> = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  const CTRL: Record<Element, Element> = { Wood:'Earth', Fire:'Metal', Earth:'Water', Metal:'Wood', Water:'Fire' };
  if (TS.element === DS.element) return samePol ? 'Friend' : 'Rob Wealth';
  if (GEN[DS.element] === TS.element) return samePol ? 'Eating God' : 'Hurting Officer';
  if (CTRL[DS.element] === TS.element) return samePol ? 'Indirect Wealth' : 'Direct Wealth';
  if (CTRL[TS.element] === DS.element) return samePol ? '7 Killings' : 'Direct Officer';
  if (GEN[TS.element] === DS.element) return samePol ? 'Indirect Resource' : 'Direct Resource';
  return null;
}

function interpretGod(god: TenGodName, present: boolean, FN: string): string {
  const absent = ` Its absence means this theme doesn't come pre-installed for you — when you want its gifts, you import them deliberately through environment, practice, or relationships that carry the energy.`;
  const presentMsg: Record<TenGodName, string> = {
    'Friend':            `Peer-level relationships are core to how you operate. ${FN}, you work best alongside trusted equals rather than under hierarchy or in isolation — collaborations grounded in mutual respect tend to unlock your best work.`,
    'Rob Wealth':        `Watch for competitive forces in your orbit — people who appear aligned but drain resources. ${FN}, this isn't paranoia, it's pattern-recognition: review your circle periodically and notice where value flows out without returning.`,
    'Eating God':        `You have a natural current of refined creative output — the craftsman's pleasant productivity. ${FN}, content, design, polished work, and anything that expresses your aesthetic sensibility comes easily and feeds you.`,
    'Hurting Officer':   `You carry the innovation stem — unconventional thinking, willingness to question established structures. ${FN}, this energy needs an outlet or it turns into corrosive criticism of yourself and others. Build where you would otherwise complain.`,
    'Direct Wealth':     `Your steady income current is present — salary, savings, conservative accumulation. ${FN}, this is the baseline wealth stream that doesn't dazzle but compounds. Don't ignore it for the flashier pursuits.`,
    'Indirect Wealth':   `Entrepreneurial, deal-based, opportunity-catching wealth is your natural channel. ${FN}, your real fortune comes through ventures, equity, and systems others don't immediately see — not through a straight paycheck.`,
    'Direct Officer':    `Structured authority is available to you — titles, formal roles, reputation built through recognised channels. ${FN}, don't hide behind the team; claiming the authority position openly tends to compound your credibility.`,
    '7 Killings':        `You carry the ruthless drive stem — the willingness to break things to build. ${FN}, this heat is power when channelled into strategic decisions; when suppressed it leaks out as interpersonal friction. Direct it.`,
    'Direct Resource':   `Mentors, teachers, and wisdom through conventional study flow naturally to you. ${FN}, books, courses, and guides land disproportionately well for you — knowledge is a reliable input for your growth.`,
    'Indirect Resource': `You're drawn toward unconventional or esoteric learning — mysticism, hidden systems, step-parent figures. ${FN}, this energy makes you a polymath when directed; when scattered it becomes restless knowledge-chasing.`,
  };
  return present ? presentMsg[god] : presentMsg[god] + absent;
}

export type TenGodEntry = {
  name: TenGodName;
  chinese: string;
  role: string;
  present: boolean;
  forYou: string;
};

function buildTenGods(dayStem: Stem, otherStems: Stem[], branches: Branch[], firstName: string): TenGodEntry[] {
  const FN = firstName || 'You';
  const GOD_META: Record<TenGodName, { chinese: string; role: string }> = {
    'Friend':            { chinese: '比肩', role: 'Friends · Peers · Siblings' },
    'Rob Wealth':        { chinese: '劫財', role: 'Competitors · Rivals · Wealth-drainers' },
    'Eating God':        { chinese: '食神', role: 'Creative output · Enjoyment · Pleasant productivity' },
    'Hurting Officer':   { chinese: '傷官', role: 'Genius · Innovation · Rule-breaking · Outspoken' },
    'Direct Wealth':     { chinese: '正財', role: 'Earned income · Conservative wealth · Savings' },
    'Indirect Wealth':   { chinese: '偏財', role: 'Business income · Entrepreneurial wealth · Opportunity-based fortune' },
    'Direct Officer':    { chinese: '正官', role: 'Authority · Career status · Structured reputation' },
    '7 Killings':        { chinese: '七殺', role: 'Power · Ruthless drive · Competitive spirit' },
    'Direct Resource':   { chinese: '正印', role: 'Mother · Mentors · Wisdom · Education' },
    'Indirect Resource': { chinese: '偏印', role: 'Unconventional learning · Step-parent · Mystical knowledge' },
  };

  const allStems: Stem[] = [dayStem, ...otherStems];
  branches.forEach(b => (BRANCH_HIDDEN[b] || []).forEach(h => allStems.push(h.stem)));

  return (Object.keys(GOD_META) as TenGodName[]).map(god => {
    let present = false;
    for (const s of allStems) {
      if (s === dayStem && god === 'Friend') { present = true; break; }
      if (tenGodFor(dayStem, s) === god) { present = true; break; }
    }
    return {
      name: god,
      chinese: GOD_META[god].chinese,
      role: GOD_META[god].role,
      present,
      forYou: interpretGod(god, present, FN),
    };
  });
}

export type CompatibilityEntry = { animal: string; note: string };

function computeCompatibility(yearAnimal: string, dayAnimal: string, _FN: string): { best: CompatibilityEntry[]; worst: CompatibilityEntry[] } {
  const SAN_HE: string[][] = [
    ['Rat','Dragon','Monkey'],
    ['Ox','Snake','Rooster'],
    ['Tiger','Horse','Dog'],
    ['Rabbit','Goat','Pig'],
  ];
  const LIU_HE: Record<string, string> = {
    Rat:'Ox', Ox:'Rat', Tiger:'Pig', Pig:'Tiger', Rabbit:'Dog', Dog:'Rabbit',
    Dragon:'Rooster', Rooster:'Dragon', Snake:'Monkey', Monkey:'Snake', Horse:'Goat', Goat:'Horse',
  };
  const CLASH: Record<string, string> = {
    Rat:'Horse', Horse:'Rat', Ox:'Goat', Goat:'Ox', Tiger:'Monkey', Monkey:'Tiger',
    Rabbit:'Rooster', Rooster:'Rabbit', Dragon:'Dog', Dog:'Dragon', Snake:'Pig', Pig:'Snake',
  };

  const anchor = dayAnimal;
  const best: CompatibilityEntry[] = [];
  const trio = SAN_HE.find(t => t.includes(anchor));
  if (trio) trio.filter(a => a !== anchor).forEach(a => best.push({
    animal: a,
    note: `San He triangle with your Day Master ${anchor} — deep structural compatibility. Partnerships in this triangle tend toward enduring alignment.`,
  }));
  const harmony = LIU_HE[anchor];
  if (harmony) best.push({
    animal: harmony,
    note: `Six Harmony pair with your Day Master ${anchor}. Relational ease, mutual understanding, and the partner who "gets" you without constant translation.`,
  });
  if (yearAnimal !== anchor) {
    const yearHarmony = LIU_HE[yearAnimal];
    if (yearHarmony && !best.find(b => b.animal === yearHarmony)) best.push({
      animal: yearHarmony,
      note: `Six Harmony with your Year animal ${yearAnimal} — supportive public-sphere ally.`,
    });
  }

  const worst: CompatibilityEntry[] = [];
  const clash = CLASH[anchor];
  if (clash) worst.push({
    animal: clash,
    note: `Direct clash with your Day Master ${anchor}. Partnerships tend to create friction at the level of core values unless both parties consciously manage the tension.`,
  });
  const yearClash = CLASH[yearAnimal];
  if (yearClash && yearClash !== clash) worst.push({
    animal: yearClash,
    note: `Clash with your Year pillar animal ${yearAnimal}. Surface-level friction in first-impression contexts; long-term partnerships need deliberate communication.`,
  });

  return { best, worst };
}

/* ============================================================
 * Public: computeBaZi
 * ============================================================ */

export type Pillar = {
  key: 'year' | 'month' | 'day' | 'hour';
  label: string;
  subtitle: string;
  stem: string;
  branch: string;
  stemHz: string;
  branchHz: string;
  combined: string;
  animal: string;
  element: string;
  yy: string;
  branchElement: string;
  hiddenStems: HiddenStem[];
  meaning: string;
  forYou: string;
};

export type FiveElementsMap = Record<Element, { count: number; color: string; label: Element; hanzi: string }>;

export type LuckPillar = {
  range: string;
  stem: Stem;
  branch: string;
  combined: string;
  element: Element | undefined;
  active: boolean;
  note: string;
};

export type NineStar = {
  mainStar: number;
  mainName: string;
  calc: string;
  meaning: string;
  forYou: string;
};

export type BaZiResult = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  pillars: Pillar[];
  fiveElements: FiveElementsMap;
  analysis: {
    dayMaster: string;
    strength: string;
    favourable: string[];
    unfavourable: string[];
    yongshenNote: string;
    jishenNote: string;
  };
  tenGods: TenGodEntry[];
  luckPillars: LuckPillar[];
  annual: {
    stem: string;
    branch: string;
    stemHz: string | undefined;
    branchHz: string | undefined;
    combined: string;
    element: Element | undefined;
    animal: string;
    yy: YinYang | undefined;
    interaction: string;
  };
  compatibility: { best: CompatibilityEntry[]; worst: CompatibilityEntry[] };
  nineStar: NineStar;
  animalTraits: AnimalTraits & { hanzi: string };
};

export function computeBaZi(
  dob: BirthData['dob'],
  time: BirthData['time'],
  timeUnknown: boolean,
  gender: Gender,
  firstName: string | undefined,
  currentYear: number,
): BaZiResult {
  const FN = firstName || 'You';
  const y = dob.y;
  const m = dob.m;
  const d = dob.d;
  const h = timeUnknown ? 12 : (time?.h ?? 12);

  let effectiveYear = y;
  if (m < 2 || (m === 2 && d < 4)) effectiveYear = y - 1;

  const yearStemIdx = ((effectiveYear - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((effectiveYear - 4) % 12 + 12) % 12;
  const yearStem = STEM_ORDER[yearStemIdx];
  const yearBranch = BRANCH_ORDER[yearBranchIdx];

  // Month pillar — find branch by solar term table.
  let monthBranchIdx = 0;
  for (let i = 0; i < MONTH_TERM_TABLE.length; i++) {
    const cur = MONTH_TERM_TABLE[i];
    const nxt = MONTH_TERM_TABLE[(i + 1) % MONTH_TERM_TABLE.length];
    const curMD = cur.month * 100 + cur.day;
    const nxtMD = nxt.month * 100 + nxt.day;
    const thisMD = m * 100 + d;
    if (curMD <= nxtMD) {
      if (thisMD >= curMD && thisMD < nxtMD) { monthBranchIdx = cur.branchIdx; break; }
    } else {
      if (thisMD >= curMD || thisMD < nxtMD) { monthBranchIdx = cur.branchIdx; break; }
    }
  }
  const monthBranch = BRANCH_ORDER[monthBranchIdx];

  const yinStartStem = (2 * (yearStemIdx % 5) + 2) % 10;
  const monthStepsFromYin = (monthBranchIdx - 2 + 12) % 12;
  const monthStemIdx = (yinStartStem + monthStepsFromYin) % 10;
  const monthStem = STEM_ORDER[monthStemIdx];

  // Day pillar via JDN.
  const JDN = jdnFromDate(y, m, d);
  const dayStemIdx = ((JDN + 5) % 10 + 10) % 10;
  const dayBranchIdx = ((JDN + 5) % 12 + 12) % 12;
  const dayStem = STEM_ORDER[dayStemIdx];
  const dayBranch = BRANCH_ORDER[dayBranchIdx];

  // Hour pillar.
  const hourBranchIdx = timeUnknown ? -1 : Math.floor(((h + 1) % 24) / 2);
  const hourBranch: Branch | null = hourBranchIdx >= 0 ? BRANCH_ORDER[hourBranchIdx] : null;
  const ziStartStem = (2 * (dayStemIdx % 5)) % 10;
  const hourStemIdx = hourBranchIdx >= 0 ? (ziStartStem + hourBranchIdx) % 10 : -1;
  const hourStem: Stem | null = hourStemIdx >= 0 ? STEM_ORDER[hourStemIdx] : null;

  const makePillar = (
    key: 'year' | 'month' | 'day' | 'hour',
    label: string,
    subtitle: string,
    stem: Stem,
    branch: Branch,
  ): Pillar => {
    const s = HEAVENLY_STEMS[stem];
    const b = EARTHLY_BRANCHES[branch];
    const animal = b?.animal || '';
    const hidden = BRANCH_HIDDEN[branch] || [];
    const combined = `${stem} ${branch.replace('_b', '')} (${s?.hanzi}${b?.hanzi})`;
    const element = s?.element;
    const yy = s?.yy;
    const meaning = `${yy} ${element} over ${b?.element || ''} ${animal} — the ${combined.split(' ')[0]} ${combined.split(' ')[1]} pillar. Each pillar combines a heavenly stem (expressed character) with an earthly branch (embedded conditions and hidden stems). Read it as a single compound note rather than two separate letters.`;
    const forYou = pillarInterp(key, label, stem, element, yy, animal, hidden, FN);
    return {
      key, label, subtitle,
      stem, branch: branch.replace('_b', ''),
      stemHz: s?.hanzi || '', branchHz: b?.hanzi || '',
      combined,
      animal, element, yy,
      branchElement: b?.element,
      hiddenStems: hidden,
      meaning, forYou,
    };
  };

  const year = makePillar('year', 'Year Pillar', 'Ancestors · Public Self · First 16 years', yearStem, yearBranch);
  const month = makePillar('month', 'Month Pillar', 'Parents · Career · Ages 17-32', monthStem, monthBranch);
  const day = makePillar('day', 'Day Pillar · Day Master', 'Self · Spouse · Ages 33-48', dayStem, dayBranch);
  const hour: Pillar = (hourStem && hourBranch) ? makePillar('hour', 'Hour Pillar', 'Children · Legacy · Ages 49+', hourStem, hourBranch) : {
    key: 'hour', label: 'Hour Pillar', subtitle: 'Children · Legacy · Ages 49+',
    stem: '—', branch: '—', stemHz: '—', branchHz: '—', combined: 'time unknown',
    animal: '—', element: '—', yy: '—', branchElement: '—',
    hiddenStems: [],
    meaning: 'Hour pillar requires birth time — enable it in settings to see this pillar.',
    forYou: `${FN}, add your birth time in settings to unlock the hour pillar — it governs the long-horizon destiny kernel and matters most in the second half of life.`,
  };

  // Element counts across stems + branches + hidden stems.
  const elementCounts: Record<Element, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  const stemsToCount: Stem[] = [yearStem, monthStem, dayStem];
  if (hourStem) stemsToCount.push(hourStem);
  const branchesToCount: Branch[] = [yearBranch, monthBranch, dayBranch];
  if (hourBranch) branchesToCount.push(hourBranch);
  stemsToCount.forEach(s => { const el = HEAVENLY_STEMS[s]?.element; if (el) elementCounts[el]++; });
  branchesToCount.forEach(b => { const el = EARTHLY_BRANCHES[b]?.element; if (el) elementCounts[el]++; });
  branchesToCount.forEach(b => (BRANCH_HIDDEN[b] || []).forEach(hh => { const el = HEAVENLY_STEMS[hh.stem]?.element; if (el) elementCounts[el]++; }));

  const ELEM_META: Record<Element, { color: string; hanzi: string }> = {
    Wood:  { color: '#5FA05F', hanzi: '木' },
    Fire:  { color: '#D96B4B', hanzi: '火' },
    Earth: { color: '#B8935A', hanzi: '土' },
    Metal: { color: '#9FA8B8', hanzi: '金' },
    Water: { color: '#4A7DB8', hanzi: '水' },
  };
  const fiveElements: FiveElementsMap = {
    Wood:  { count: elementCounts.Wood,  color: ELEM_META.Wood.color,  label: 'Wood',  hanzi: ELEM_META.Wood.hanzi  },
    Fire:  { count: elementCounts.Fire,  color: ELEM_META.Fire.color,  label: 'Fire',  hanzi: ELEM_META.Fire.hanzi  },
    Earth: { count: elementCounts.Earth, color: ELEM_META.Earth.color, label: 'Earth', hanzi: ELEM_META.Earth.hanzi },
    Metal: { count: elementCounts.Metal, color: ELEM_META.Metal.color, label: 'Metal', hanzi: ELEM_META.Metal.hanzi },
    Water: { count: elementCounts.Water, color: ELEM_META.Water.color, label: 'Water', hanzi: ELEM_META.Water.hanzi },
  };

  const dayMasterElement = HEAVENLY_STEMS[dayStem]?.element;
  const dayMasterYY = HEAVENLY_STEMS[dayStem]?.yy;
  const dayMasterAnimal = EARTHLY_BRANCHES[dayBranch]?.animal;

  const GENERATES: Record<Element, Element> = { Wood:'Fire', Fire:'Earth', Earth:'Metal', Metal:'Water', Water:'Wood' };
  const CONTROLS: Record<Element, Element> = { Wood:'Earth', Fire:'Metal', Earth:'Water', Metal:'Wood', Water:'Fire' };
  const GENERATED_BY: Record<Element, Element> = { Fire:'Wood', Earth:'Fire', Metal:'Earth', Water:'Metal', Wood:'Water' };

  const selfCount = elementCounts[dayMasterElement];
  const supportCount = elementCounts[GENERATED_BY[dayMasterElement]];
  const leakCount = elementCounts[GENERATES[dayMasterElement]];
  const controlCount = elementCounts[CONTROLS[dayMasterElement]];
  const controlledByElement = (Object.keys(CONTROLS) as Element[]).find(k => CONTROLS[k] === dayMasterElement);
  const pressureCount = controlledByElement ? (elementCounts[controlledByElement] || 0) : 0;
  const supportTotal = selfCount + supportCount;
  const pressureTotal = leakCount + controlCount + pressureCount;
  let strengthLabel: string;
  if (supportTotal >= pressureTotal + 3) strengthLabel = 'Strong';
  else if (supportTotal >= pressureTotal + 1) strengthLabel = 'Balanced-to-strong';
  else if (supportTotal <= pressureTotal - 3) strengthLabel = 'Weak';
  else if (supportTotal <= pressureTotal - 1) strengthLabel = 'Balanced-to-weak';
  else strengthLabel = 'Balanced';

  let favourable: Element[];
  let unfavourable: Element[];
  if (strengthLabel.includes('strong') || strengthLabel === 'Strong') {
    favourable = [GENERATES[dayMasterElement], CONTROLS[dayMasterElement]];
    if (controlledByElement) favourable.push(controlledByElement);
    unfavourable = [dayMasterElement, GENERATED_BY[dayMasterElement]];
  } else if (strengthLabel.includes('weak') || strengthLabel === 'Weak') {
    favourable = [dayMasterElement, GENERATED_BY[dayMasterElement]];
    unfavourable = [CONTROLS[dayMasterElement]];
    if (controlledByElement) unfavourable.push(controlledByElement);
  } else {
    favourable = [GENERATES[dayMasterElement], CONTROLS[dayMasterElement]];
    unfavourable = controlledByElement ? [controlledByElement] : [];
  }
  favourable = Array.from(new Set(favourable)).filter(Boolean) as Element[];
  unfavourable = Array.from(new Set(unfavourable)).filter(Boolean) as Element[];

  const analysis = {
    dayMaster: `${dayStem} ${dayBranch.replace('_b', '')} · ${dayMasterYY} ${dayMasterElement} ${dayMasterAnimal}`,
    strength: `${strengthLabel}. Day Master (${dayMasterElement}) count ${selfCount}, supporting resource count ${supportCount}; pressure (output+control) total ${pressureTotal}.`,
    favourable,
    unfavourable,
    yongshenNote: `Your favourable elements are ${favourable.join(' and ')}. Seek environments, colours, and practices that bring these elements into your daily field — they stabilise the Day Master and let your work flow without forcing. ${FN}, where these elements are absent, add them deliberately.`,
    jishenNote: `Your unfavourable elements are ${unfavourable.join(' and ')}. These don't need to be avoided entirely, but when life feels like grinding or when your energy drops suddenly, check your environment for an overload of these elements. ${FN}, you can feel the imbalance before you can name it.`,
  };

  const tenGodsList = buildTenGods(
    dayStem,
    [yearStem, monthStem, hourStem].filter((s): s is Stem => !!s),
    branchesToCount,
    FN,
  );

  const forward = (gender === 'male' && yearStemIdx % 2 === 0) || (gender === 'female' && yearStemIdx % 2 === 1);
  const startAge = 3;
  const luckPillars: LuckPillar[] = [];
  const nowAge = currentYear - y;
  for (let i = 0; i < 6; i++) {
    const stepBranchIdx = (monthBranchIdx + (forward ? (i + 1) : -(i + 1)) + 12 * 10) % 12;
    const stepStemIdx = (monthStemIdx + (forward ? (i + 1) : -(i + 1)) + 10 * 10) % 10;
    const startA = startAge + i * 10;
    const endA = startA + 10;
    const startYr = y + startA;
    const endYr = y + endA;
    const s = STEM_ORDER[stepStemIdx];
    const b = BRANCH_ORDER[stepBranchIdx];
    const active = nowAge >= startA && nowAge < endA;
    const element = HEAVENLY_STEMS[s]?.element;
    const isFav = !!element && favourable.includes(element);
    luckPillars.push({
      range: `${startYr}–${endYr} (age ${startA}–${endA})`,
      stem: s, branch: b.replace('_b', ''),
      combined: `${s} ${b.replace('_b', '')}`,
      element, active,
      note: `${HEAVENLY_STEMS[s]?.yy} ${element} ${EARTHLY_BRANCHES[b]?.animal}. ${isFav ? 'This 10-year pillar carries a favourable element for your Day Master — lean into its themes and the decade works with you.' : "This pillar carries an element that tests the Day Master. The work is to steady the centre rather than match the pillar's pace."}`,
    });
  }

  const annualStemIdx = ((currentYear - 4) % 10 + 10) % 10;
  const annualBranchIdx = ((currentYear - 4) % 12 + 12) % 12;
  const annualStem = STEM_ORDER[annualStemIdx];
  const annualBranch = BRANCH_ORDER[annualBranchIdx];
  const annualElement = HEAVENLY_STEMS[annualStem]?.element;
  const annualAnimal = EARTHLY_BRANCHES[annualBranch]?.animal;
  const annualIsFav = !!annualElement && favourable.includes(annualElement);
  const annual = {
    stem: annualStem,
    branch: annualBranch.replace('_b', ''),
    stemHz: HEAVENLY_STEMS[annualStem]?.hanzi,
    branchHz: EARTHLY_BRANCHES[annualBranch]?.hanzi,
    combined: `${annualStem} ${annualBranch.replace('_b', '')}`,
    element: annualElement,
    animal: annualAnimal,
    yy: HEAVENLY_STEMS[annualStem]?.yy,
    interaction: `${currentYear} is a ${HEAVENLY_STEMS[annualStem]?.yy} ${annualElement} ${annualAnimal} year. For your ${dayMasterYY} ${dayMasterElement} Day Master, this ${annualIsFav ? 'brings a favourable current — the year supports rather than resists your work' : 'creates friction with the Day Master — expect the year to demand extra discipline where it pushes against your natural element'}. ${FN}, align decisions with this seasonal current rather than fighting it.`,
  };

  const compatibility = computeCompatibility(year.animal, day.animal, FN);

  // Nine Star Ki.
  const yearSum = String(effectiveYear).split('').reduce((s, c) => s + parseInt(c, 10), 0);
  const yearSumR = yearSum > 9 ? String(yearSum).split('').reduce((s, c) => s + parseInt(c, 10), 0) : yearSum;
  let mainStar: number;
  if (gender === 'female') {
    mainStar = yearSumR + 4;
    while (mainStar > 9) mainStar -= 9;
    if (mainStar < 1) mainStar += 9;
  } else {
    mainStar = 11 - yearSumR;
    if (mainStar > 9) mainStar -= 9;
    if (mainStar < 1) mainStar += 9;
  }
  const nineStarNames: Record<number, string> = {
    1: '1 White Water · North',     2: '2 Black Earth · Southwest',   3: '3 Jade Wood · East',
    4: '4 Green Wood · Southeast',  5: '5 Yellow Earth · Center',     6: '6 White Metal · Northwest',
    7: '7 Red Metal · West',        8: '8 White Earth · Northeast',   9: '9 Purple Fire · South',
  };
  const nineStarMeanings: Record<number, string> = {
    1: 'One White is the water star — movement, adaptability, quiet persistence. Natives shape situations through flow rather than force.',
    2: 'Two Black is the earth-mother star — nurturance, loyalty, patient support. Natives build through steady care and relational depth.',
    3: 'Three Jade Wood is the spring thunder star — rapid growth, new ideas, youthful initiative. Natives start things and bring energy into old patterns.',
    4: 'Four Green Wood is the gentle wind — communication, relationships, reputation built through elegance and persistence.',
    5: 'Five Yellow is the central star — the axis around which other stars orbit. Natives have magnetic presence and natural authority; attention collects around them.',
    6: 'Six White Metal is the heavenly father star — authority, order, father-figure energy. Natives lead through structure and earned respect.',
    7: 'Seven Red Metal is the lake star — joy, communication, refinement. Natives charm and persuade; they are the performers and polished voices of the group.',
    8: 'Eight White Earth is the mountain star — stillness, accumulation, inheritance. Natives build what lasts and often come into wealth through discipline.',
    9: 'Nine Purple Fire is the illumination star — fame, expression, vision. Natives shine; their work is about revelation and being seen.',
  };
  const nineStar: NineStar = {
    mainStar,
    mainName: nineStarNames[mainStar] || `${mainStar}`,
    calc: `${String(effectiveYear).split('').join('+')} = ${yearSum}${yearSumR !== yearSum ? ` → ${yearSumR}` : ''}; ${gender === 'female' ? `${yearSumR} + 4` : `11 − ${yearSumR}`} → ${mainStar}`,
    meaning: nineStarMeanings[mainStar] || '',
    forYou: `${FN}, Nine Star Ki is a feng-shui lens on character. Your ${nineStarNames[mainStar]} star layers onto the BaZi Day Master to show how your energy lands in rooms. Treat it as a second opinion rather than a replacement for the Four Pillars — when they agree on a theme, that's signal; when they differ, each is pointing at a different dimension of the same you.`,
  };

  const animalTraitsBase = ANIMAL_TRAITS_MAP[year.animal] || ANIMAL_TRAITS_MAP.Monkey;
  const animalTraits = { ...animalTraitsBase, hanzi: ANIMAL_HANZI[year.animal] || '' };

  return {
    year, month, day, hour,
    pillars: [year, month, day, hour],
    fiveElements,
    analysis,
    tenGods: tenGodsList,
    luckPillars,
    annual,
    compatibility,
    nineStar,
    animalTraits,
  };
}
