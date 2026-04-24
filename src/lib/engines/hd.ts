/*
 * hd.ts — Human Design compute engine.
 *
 * Ported from engine-hd.js (archive: astral-saas-static-20260422). Preserves
 * all 64 gate interpretations, 36 channels, 9 centres, type/authority/profile
 * derivation. UI (React.createElement panel) omitted.
 *
 * SELF-TEST — Sydney-born chart: dob 2004-07-23, 06:30 AEST, Sydney (lat -33.87 lon
 * +151.21 tz +10). Sun tropical longitude ~120°29' → lands in Gate 31.
 * Personality Sun line ≈ 3 (Sun is about 42% of the way through the gate).
 * Expected: Generator or Manifesting Generator with Emotional or Sacral
 * Authority, profile around 3/5 or 3/6.
 *
 * Wheel anchor: Gate 25 starts at 0° Aries, each gate spans exactly 5.625°
 * (5°37'30"). HD_GATE_OFFSET_DEG = 0.0 — set to ~3.875 for the true Rave
 * Mandala anchor if ever needed.
 */

import * as Astronomy from 'astronomy-engine';
import type { BirthData } from '../types';

/* ============================================================
 * Types
 * ============================================================ */

export type HumanDesignType =
  | 'Manifestor'
  | 'Generator'
  | 'Manifesting Generator'
  | 'Projector'
  | 'Reflector';

export type HumanDesignAuthority =
  | 'Emotional Authority'
  | 'Sacral Authority'
  | 'Splenic Authority'
  | 'Ego / Heart Authority'
  | 'Self-Projected Authority'
  | 'Mental / Outer Authority'
  | 'Lunar Authority';

export type HumanDesignCenterName =
  | 'Head'
  | 'Ajna'
  | 'Throat'
  | 'G'
  | 'Heart'
  | 'Solar Plexus'
  | 'Sacral'
  | 'Spleen'
  | 'Root';

export type HumanDesignBodyName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'
  | 'NorthNode'
  | 'SouthNode'
  | 'Earth';

export type HumanDesignGate = {
  gate: number;
  line: number;
  withinGateDeg: number;
  longitude: number;
};

export type HumanDesignActivations = Record<HumanDesignBodyName, HumanDesignGate>;

export type HumanDesignGateInfo = {
  name: string;
  keyword: string;
  hexagram: string;
  body: string;
  shadow: string;
  gift: string;
};

export type HumanDesignGateInterpretation = {
  gate: number;
  line: number | null;
  book: 'personality' | 'design' | null;
  body: HumanDesignBodyName | null;
  name: string;
  keyword: string;
  hexagram: string;
  prose: string;
  shadow: string;
  gift: string;
};

export type HumanDesignChannel = {
  gates: [number, number];
  name: string;
  from: HumanDesignCenterName;
  to: HumanDesignCenterName;
};

export type HumanDesignIncarnationCross = {
  angle: 'Right Angle' | 'Juxtaposition' | 'Left Angle';
  name: string;
  gates: {
    personalitySun: number;
    personalityEarth: number;
    designSun: number;
    designEarth: number;
  };
  signature: string;
};

export type HumanDesignInterpretations = {
  type: string | null;
  strategy: string | null;
  notSelf: string | null;
  signature: string | null;
  authority: string | null;
  profile: string;
  gates: HumanDesignGateInterpretation[];
};

export type HumanDesignResult = {
  personality: HumanDesignActivations;
  personalityUtc: Date;
  design: HumanDesignActivations;
  designUtc: Date;
  activatedGates: number[];
  definedCenters: HumanDesignCenterName[];
  definedChannels: string[]; // e.g. "1-8", "34-57"
  type: HumanDesignType;
  strategy: string;
  authority: HumanDesignAuthority;
  profile: string;           // "3/5"
  profileName: string;       // "Martyr / Heretic"
  profileBody: string;
  incarnationCross: HumanDesignIncarnationCross;
  interpretations: HumanDesignInterpretations;
  // Lookup map of gate-number → display name (for UI consumers).
  gateNames: Record<number, string>;
};

// Extended birth-data shape used by the static engine — tz and (optional)
// lat/lon. Required for the compute since it must compute a UTC instant.
export type HumanDesignBirthData = BirthData & {
  tzOffset?: number;
  lat?: number;
  lon?: number;
};

/* ============================================================
 * Constants
 * ============================================================ */

const HD_GATE_WIDTH_DEG = 360 / 64;             // 5.625°  per gate
const HD_LINE_WIDTH_DEG = HD_GATE_WIDTH_DEG / 6; // 0.9375° per line
const HD_GATE_OFFSET_DEG = 0.0;                  // ~3.875 for true Rave anchor

// The 88° of solar arc that defines the Design moment.
const HD_DESIGN_ARC_DEG = 88.0;

// Wheel order — 64 gates starting at Gate 25 at 0° Aries.
export const HD_WHEEL_ORDER: readonly number[] = [
  // Aries
  25, 17, 21, 51, 42, 3,
  // Taurus
  27, 24, 23, 8, 20, 16,
  // Gemini
  35, 45, 12, 15, 52, 39,
  // Cancer
  53, 62, 56, 31, 33, 7,
  // Leo
  4, 29, 59, 40, 64, 47,
  // Virgo
  6, 46, 18, 48, 57, 32,
  // Libra
  50, 28, 44, 1, 43, 14,
  // Scorpio
  34, 9, 5, 26, 11, 10,
  // Sagittarius
  58, 38, 54, 61, 60, 41,
  // Capricorn
  19, 13, 49, 30, 55, 37,
  // Aquarius + Pisces
  63, 22, 36, 2,
];

/* ============================================================
 * Gate interpretation table — 64 gates
 * ============================================================ */

export const HD_GATES: Record<number, HumanDesignGateInfo> = {
  1: {
    name: 'The Creative',
    keyword: 'Self-Expression',
    hexagram: "Ch'ien — The Creative",
    body: "Gate 1 is the pure creative impulse at the mouth of the G-Centre — the original signature, the unrepeatable way you have of being here. It is not about making things; it is about being the thing that has to be made. When this gate is defined it presses you to express direction through form, and it will not accept a borrowed style.",
    shadow: "Depression masquerading as melancholy — the creative wound that sets in when the signature is edited down for other people's comfort.",
    gift: 'The courage to let the work carry the shape of its maker. Authority through originality, not through imitation.',
  },
  2: {
    name: 'The Receptive',
    keyword: 'Direction of the Self',
    hexagram: "K'un — The Receptive",
    body: "Gate 2 is the driver's seat of the G-Centre — the felt knowing of which direction is yours. It does not plan; it orients. When it is defined it acts like an internal compass that pulls you toward the geometry that belongs to you. Often described as receptive, it is in fact active — a steady magnetic pull toward the life that fits.",
    shadow: "Waiting to be told. The direction-giver who forgets they are the one with the compass.",
    gift: 'Knowing the way without being able to explain it. A quiet certainty about place, people, and path.',
  },
  3: {
    name: 'Ordering',
    keyword: 'Innovation Through Difficulty',
    hexagram: 'Chun — Difficulty at the Beginning',
    body: 'Gate 3 is the Sacral mutation gate — new life pushing through the thickness of the old. Mutation is uncomfortable by design. This gate knows that order does not arrive pre-built; it emerges from the friction of beginnings that do not yet have the right form. To be defined here is to carry the engine of early-stage disorder as a creative resource.',
    shadow: 'Chaos experienced as confusion rather than as material. The drive to abandon the beginning because the shape has not arrived yet.',
    gift: 'Staying with the mess until the order reveals itself. The ability to begin again without needing permission.',
  },
  4: {
    name: 'Answers',
    keyword: 'Formulisation',
    hexagram: 'Meng — Youthful Folly',
    body: "Gate 4 offers answers the way a mind offers hypotheses — it is a thinking gate at the top of the Ajna, paired with Gate 63's doubt. When defined, it generates formulas and working theories, but the answers are mental; they still need to be tested against life. Its work is to hold possibility without forcing certainty.",
    shadow: "The pretender's certainty — treating a hypothesis as a conclusion, then defending it.",
    gift: 'Hypotheses offered lightly, as material for testing. The mind as workshop, not courtroom.',
  },
  5: {
    name: 'Fixed Rhythms',
    keyword: 'Patterns',
    hexagram: 'Hsu — Waiting',
    body: 'Gate 5 is the Sacral keeper of rhythm — the felt pulse of waking, eating, moving, working, resting. When defined, it gives the body a private timetable that is sturdier than any external schedule. It is the gate that holds the pattern against which everything else is measured. Break its rhythm and the whole organism loses fidelity.',
    shadow: "Rigidity — mistaking the rhythm for the law. Or its opposite: surrendering the rhythm to other people's calendars.",
    gift: 'A body that knows when. Quiet fidelity to the small daily shapes that make everything else possible.',
  },
  6: {
    name: 'Friction',
    keyword: 'Intimacy',
    hexagram: 'Sung — Conflict',
    body: 'Gate 6 sits at the top of the Solar Plexus, governing the emotional membrane — who gets in, who does not, and when. Defined here, you oscillate between openness and closure, and both are correct at different times. Intimacy for Gate 6 is not agreement; it is the regulated friction that tells two bodies they are actually in contact.',
    shadow: 'Reactive walls up, walls down — the membrane used as a weapon or abandoned altogether.',
    gift: 'Emotional discernment. A warm yes that is actually warm, and a firm no that is actually safe.',
  },
  7: {
    name: 'The Role of the Self in Interaction',
    keyword: 'Leadership',
    hexagram: 'Shih — The Army',
    body: 'Gate 7 is the leadership gate of the G-Centre — not ambition, but the quiet capacity to direct a group toward its future. Defined here, you are pulled into roles of orientation: the one who names the direction, who makes the collective legible to itself. The leadership is functional, not charismatic.',
    shadow: 'Directing where no one asked to be directed. Or refusing the role out of modesty when the group needed it.',
    gift: 'Leadership as service — the steady hand that lets others find their place.',
  },
  8: {
    name: 'Contribution',
    keyword: 'Holding Together',
    hexagram: 'Pi — Holding Together',
    body: 'Gate 8 lives at the Throat and gives voice to what is unique in the collective. Defined, it carries the pressure to contribute — to put one\'s signature into the shared field. It does not invent from nothing; it assembles what it finds into an unmistakable statement.',
    shadow: 'Quiet conformity. The contribution edited into invisibility so as not to disturb.',
    gift: 'The visible offering. The style that could only be yours, openly on the table.',
  },
  9: {
    name: 'Focus',
    keyword: 'Determination',
    hexagram: "Hsiao Ch'u — The Taming Power of the Small",
    body: "Gate 9 is the Sacral's power of concentrated attention — the ability to stay with the detail long enough for it to yield. Defined here, the life-force can compress onto a single task without losing its vitality. The discipline is not mental; it is bodily.",
    shadow: 'Obsessive narrowing. Focus that forgets the field it came from.',
    gift: 'Deep attention as a form of love. The capacity to make the small thing matter by fully meeting it.',
  },
  10: {
    name: 'Behaviour of the Self',
    keyword: 'Self-Love',
    hexagram: 'Lu — Treading',
    body: 'Gate 10 is the G-Centre gate of self-love — how you are with yourself when no one is watching. Defined, it gives a specific behavioural signature: a way of moving through the world that is recognisably yours. The work is to like what that signature is, and to refuse to edit it for approval.',
    shadow: 'Behaving to be seen a certain way. The private self and the public self in poor alignment.',
    gift: 'Being oneself on purpose. The small, steady practice of preferring one\'s own shape.',
  },
  11: {
    name: 'Ideas',
    keyword: 'Peace',
    hexagram: "T'ai — Peace",
    body: 'Gate 11 is a storehouse of ideas on the Ajna side of the Ajna-Throat channel — images, scenarios, futures that pass through the mind. Defined here, the mind is a gallery rather than a factory: ideas arrive, are considered, and most are released. Not every idea is for you to act on.',
    shadow: 'Treating every idea as a task. The mind taken literally.',
    gift: 'Ideas as contemplation — the mind enjoyed for what it produces without being obeyed.',
  },
  12: {
    name: 'Caution',
    keyword: 'Articulation',
    hexagram: "P'i — Standstill",
    body: "Gate 12 is the Throat's pause — the moment before speech in which the right words either arrive or do not. Defined here, there is a recognisable moodiness to expression: when the channel is open, the articulation is remarkable; when it is closed, silence is the correct answer. Timing is everything.",
    shadow: 'Forcing speech when the channel is closed, or withholding when it is open out of habit.',
    gift: 'Expression that lands because it waited for its moment. The power of the pause.',
  },
  13: {
    name: 'The Listener',
    keyword: 'Narrative',
    hexagram: "T'ung Jen — Fellowship with Men",
    body: 'Gate 13 is the G-Centre gate of story — the one people tell their secrets to, the keeper of the past. Defined here, you carry other people\'s narratives lightly and give them back in a clearer shape. The work is not to forget what has been confided; it is to hold it without being weighed down by it.',
    shadow: 'Becoming the confessor who cannot put down what has been confided.',
    gift: 'The ear that changes what it hears. Stories returned to their tellers, usable.',
  },
  14: {
    name: 'Power Skills',
    keyword: 'Empowered Wealth',
    hexagram: 'Ta Yu — Possession in Great Measure',
    body: "Gate 14 is the Sacral's fuel for mastery of resources — the work that generates abundance as a by-product of genuine engagement. Defined here, the life-force turns sustained effort into tangible wealth: skills, equity, structures. It is not a get-rich gate; it is a build-quality-over-time gate.",
    shadow: 'Working for the money rather than for the mastery. Wealth extracted without the skill underneath.',
    gift: 'Resource generation through craft. Money as the natural residue of serious work.',
  },
  15: {
    name: 'Extremes',
    keyword: 'The Flow of Humanity',
    hexagram: "Ch'ien — Modesty",
    body: 'Gate 15 is the G-Centre gate of human rhythm — the capacity to love the whole range, not just the civilised middle. Defined here, you contain extremes of pace, mood, and intensity, and you normalise them for others. The flow you carry is the flow of life itself, which is not tidy.',
    shadow: "Trying to flatten one's own range to fit someone else's preferred tempo.",
    gift: 'Making room for the whole human register. The one who lets everyone be what they are.',
  },
  16: {
    name: 'Skills',
    keyword: 'Enthusiasm',
    hexagram: 'Yu — Enthusiasm',
    body: "Gate 16 is the Throat's gate of selective skill — the one who knows which craft is worth committing to and which is not. Defined here, enthusiasm is the guidance system: what genuinely excites the voice is what is worth pursuing. The gate rewards practice, not dabbling.",
    shadow: 'Performing enthusiasm for things that are not actually exciting. Or dabbling without depth.',
    gift: 'The discriminating yes. Enthusiasm directed at the thing that can be mastered.',
  },
  17: {
    name: 'Opinions',
    keyword: 'Following',
    hexagram: 'Sui — Following',
    body: 'Gate 17 is an Ajna gate that projects opinions forward — not to lecture, but to orient. Defined here, you have a natural supply of views that help others see where the next step is. The opinions want to be tested against reality, not held as positions.',
    shadow: 'Opinions dressed as facts. The know-it-all mode.',
    gift: 'Perspectives offered as tools. Opinions that clear the air rather than crowd it.',
  },
  18: {
    name: 'Correction',
    keyword: 'Work on What Has Been Spoilt',
    hexagram: 'Ku — Work on What Has Been Spoilt',
    body: 'Gate 18 is a Spleen gate that notices what is broken — patterns in families, systems, bodies — and presses toward their correction. Defined here, there is an intuitive sense of misalignment that precedes the ability to articulate it. The gift is surgical; the shadow is nagging.',
    shadow: 'Correction without invitation. The critical eye with no off-switch.',
    gift: 'The repair instinct. Making broken systems work again, quietly and accurately.',
  },
  19: {
    name: 'Wanting',
    keyword: 'Approach',
    hexagram: 'Lin — Approach',
    body: "Gate 19 is a Root gate of sensitivity to need — the vibration of what people, animals, and situations require. Defined here, you feel the room's wanting before anyone says it. The work is to stay with your own wanting too, not only the collective's.",
    shadow: 'Taking on every need as one\'s own responsibility. Self-erasure through caretaking.',
    gift: 'Sensitivity tuned into service. Responding to real need without dissolving into it.',
  },
  20: {
    name: 'The Now',
    keyword: 'Contemplation',
    hexagram: 'Kuan — Contemplation',
    body: 'Gate 20 is the Throat gate of presence — speech that belongs to the moment it is uttered in. Defined here, expression is anchored in the now: what is said is what is true right now, not a rehearsed position. It is the voice of witness.',
    shadow: 'Speech that outruns the present. Commentary rather than contact.',
    gift: 'The present-tense voice. Speaking what is here without dressing it up.',
  },
  21: {
    name: 'The Treasurer',
    keyword: 'Control',
    hexagram: 'Shih Ho — Biting Through',
    body: "Gate 21 is the Heart's will to govern its own material world — territory, resources, autonomy. Defined here, there is a felt need to be in charge of the immediate domain, and a corresponding resistance to being managed from outside.",
    shadow: "Controlling for control's sake.",
    gift: "Clean stewardship of one's own sphere.",
  },
  22: {
    name: 'Openness',
    keyword: 'Grace',
    hexagram: 'Pi — Grace',
    body: "Gate 22 is the Solar Plexus's gate of social grace — emotional presence in company, the capacity to be moved and to move others. Defined here, mood governs whether the grace is available.",
    shadow: 'Withdrawal when the mood is off; social masking.',
    gift: 'Real emotional contact, given and received cleanly.',
  },
  23: {
    name: 'Assimilation',
    keyword: 'Splitting Apart',
    hexagram: 'Po — Splitting Apart',
    body: "Gate 23 is the Throat's gate of individual knowing — articulation that changes the group's map. Defined here, what comes out of the mouth is unusual, and timing is the whole game.",
    shadow: 'Speaking before anyone asked; speaking into a closed room.',
    gift: 'The knowing voiced at the exact moment it becomes receivable.',
  },
  24: {
    name: 'Rationalisation',
    keyword: 'Returning',
    hexagram: 'Fu — Return',
    body: "Gate 24 is an Ajna mutation gate — the mind circling back to the same puzzle until the new thought arrives. Defined here, recurrence is a feature, not a fault.",
    shadow: 'Rumination mistaken for progress.',
    gift: 'The insight that only comes from going around the mountain again.',
  },
  25: {
    name: 'The Spirit of the Self',
    keyword: 'Innocence',
    hexagram: 'Wu Wang — Innocence',
    body: "Gate 25 is the G-Centre's gate of universal love — love as a fact of being, not a reaction to specific people. Defined here, it is often felt as a vulnerability to life itself.",
    shadow: 'Spiritualised detachment; love withheld from the specific.',
    gift: 'Unconditioned care that does not need a reason.',
  },
  26: {
    name: 'The Egoist',
    keyword: 'The Taming Power of the Great',
    hexagram: "Ta Ch'u — The Taming Power of the Great",
    body: "Gate 26 is the Heart's gate of persuasion — the salesman, the one who can frame anything. Defined here, there is power in the pitch and responsibility in its use.",
    shadow: 'The sell that overrides the truth.',
    gift: 'Persuasion aligned with value actually delivered.',
  },
  27: {
    name: 'Caring',
    keyword: 'Nourishment',
    hexagram: 'I — The Corners of the Mouth',
    body: "Gate 27 is the Sacral's nourishment gate — the drive to feed, protect, and provide. Defined here, caregiving is energetic, not sentimental.",
    shadow: 'Caregiving without limit; the unlimited provider role.',
    gift: 'Sustenance given with clear boundaries.',
  },
  28: {
    name: 'The Game Player',
    keyword: 'Preponderance of the Great',
    hexagram: 'Ta Kuo — Preponderance of the Great',
    body: "Gate 28 is the Spleen's gate of risk — the intuitive willingness to bet on what matters. Defined here, there is an ongoing sense of stakes.",
    shadow: "Struggle for struggle's sake.",
    gift: 'The wager placed on a purpose worth losing for.',
  },
  29: {
    name: 'Perseverance',
    keyword: 'The Abysmal',
    hexagram: "K'an — The Abysmal",
    body: "Gate 29 is the Sacral's yes — the full-bodied commitment gate. Defined here, the yes is binding; what it says yes to, it completes.",
    shadow: 'Yes given reflexively; commitments honoured past their expiry.',
    gift: 'The committed yes that can be trusted, by self and by others.',
  },
  30: {
    name: 'Feelings',
    keyword: 'The Clinging Fire',
    hexagram: 'Li — The Clinging Fire',
    body: "Gate 30 is the Solar Plexus's gate of desire — the ache for the next experience. Defined here, desire is the fuel that pulls one forward.",
    shadow: 'Desire without end; always the next thing.',
    gift: 'Desire used as direction rather than as torment.',
  },
  31: {
    name: 'Influence',
    keyword: 'Leadership',
    hexagram: 'Hsien — Influence',
    body: "Gate 31 is the Throat's gate of democratic leadership — the voice that is elected into its role. Defined here, the leadership only works when it has been invited.",
    shadow: 'Leading without a mandate; leadership pressed on those who did not ask.',
    gift: "Leadership through the people's own yes.",
  },
  32: {
    name: 'Continuity',
    keyword: 'Duration',
    hexagram: 'Heng — Duration',
    body: "Gate 32 is the Spleen's gate of endurance — the intuitive read on what will last. Defined here, there is a survivor's instinct for what to preserve and what to let go.",
    shadow: 'Fear of change masked as prudence.',
    gift: 'Long-horizon intuition applied to the right things.',
  },
  33: {
    name: 'Privacy',
    keyword: 'Retreat',
    hexagram: 'Tun — Retreat',
    body: "Gate 33 is the Throat's gate of reflection — the voice that returns from solitude with something usable. Defined here, retreat is functional, not escapist.",
    shadow: 'Retreat used to hide.',
    gift: 'The story brought back from the interior.',
  },
  34: {
    name: 'Power',
    keyword: 'The Power of the Great',
    hexagram: 'Ta Chuang — The Power of the Great',
    body: "Gate 34 is the Sacral's pure power gate — activity with no sentimentality. Defined here, the body does what it does and does not apologise.",
    shadow: 'Busyness as identity; power without pause.',
    gift: 'Power that only responds to genuine need.',
  },
  35: {
    name: 'Change',
    keyword: 'Progress',
    hexagram: 'Chin — Progress',
    body: "Gate 35 is the Throat's gate of experience — the voice of one who has been through things. Defined here, progress comes from variety, and the range of experience becomes the material for everything said later.",
    shadow: 'Experience collected without synthesis.',
    gift: 'The voice that has lived what it speaks about.',
  },
  36: {
    name: 'Crisis',
    keyword: 'Darkening of the Light',
    hexagram: 'Ming I — Darkening of the Light',
    body: "Gate 36 is the Solar Plexus's gate of new experience — the emotional wave that pushes toward territory the body has not yet touched. Defined here, there is a constant pull toward the edge.",
    shadow: "Crisis sought for its own sake.",
    gift: 'Growth through willingly entered difficulty.',
  },
  37: {
    name: 'Family',
    keyword: 'The Family',
    hexagram: 'Chia Jen — The Family',
    body: "Gate 37 is the Solar Plexus's gate of agreement — friendship, contract, and bargain held emotionally. Defined here, relationships operate through handshake and felt loyalty.",
    shadow: 'Unspoken agreements broken because they were never named.',
    gift: 'Explicit contracts held warmly.',
  },
  38: {
    name: 'The Fighter',
    keyword: 'Opposition',
    hexagram: "K'uei — Opposition",
    body: "Gate 38 is the Root's gate of struggle — the pressure to fight for what is worth fighting for. Defined here, stakes are a requirement.",
    shadow: 'Fighting as a default mode.',
    gift: 'Knowing which hill is worth dying on, and which is not.',
  },
  39: {
    name: 'Provocation',
    keyword: 'Obstruction',
    hexagram: 'Chien — Obstruction',
    body: "Gate 39 is the Throat's emotional provocateur — the voice that tests the spirit of others. Defined here, the provocation finds out whether real feeling is in the room.",
    shadow: 'Provocation that wounds without purpose.',
    gift: 'The poke that reveals what was hidden.',
  },
  40: {
    name: 'Aloneness',
    keyword: 'Deliverance',
    hexagram: 'Hsieh — Deliverance',
    body: "Gate 40 is the Heart's willpower to withdraw — the right to step back from the tribe after delivering. Defined here, rest is not optional; it is structural.",
    shadow: 'Martyrdom; giving past the point of replenishment.',
    gift: 'The clean no. Rest as an act of integrity.',
  },
  41: {
    name: 'Contraction',
    keyword: 'Decrease',
    hexagram: 'Sun — Decrease',
    body: "Gate 41 is the Root's gate of anticipation — the felt beginning of the next cycle of experience. Defined here, there is a background hum of desire for what has not yet arrived.",
    shadow: 'Fantasy that replaces engagement.',
    gift: 'Imagination that primes the life that is about to happen.',
  },
  42: {
    name: 'Growth',
    keyword: 'Increase',
    hexagram: 'I — Increase',
    body: "Gate 42 is the Sacral's gate of finishing — the drive to see cycles through to their completion. Defined here, endings are as important as beginnings.",
    shadow: 'Endings evaded; loose ends as a lifestyle.',
    gift: 'The satisfaction of the cycle closed on purpose.',
  },
  43: {
    name: 'Insight',
    keyword: 'Break-Through',
    hexagram: 'Kuai — Break-Through',
    body: "Gate 43 is the Ajna's gate of individual insight — the private knowing that arrives whole. Defined here, the challenge is expressing it in a form others can receive.",
    shadow: 'The genius who cannot translate.',
    gift: 'Insight given the patience to find its listeners.',
  },
  44: {
    name: 'Alertness',
    keyword: 'Coming to Meet',
    hexagram: 'Kou — Coming to Meet',
    body: "Gate 44 is the Spleen's gate of memory — the intuitive read on whether a situation has the shape of something that ended badly before. Defined here, the past is active data.",
    shadow: 'Pattern-matching that refuses new information.',
    gift: 'Wisdom from experience, kept current.',
  },
  45: {
    name: 'The Gatherer',
    keyword: 'Gathering Together',
    hexagram: "Ts'ui — Gathering Together",
    body: "Gate 45 is the Throat's gate of the voice that educates and gathers — the one who organises resources for the many. Defined here, there is a natural governance role.",
    shadow: 'Hoarding information or resources.',
    gift: 'The voice that coordinates plenty.',
  },
  46: {
    name: 'Love of the Body',
    keyword: 'Pushing Upward',
    hexagram: 'Sheng — Pushing Upward',
    body: "Gate 46 is the G-Centre's gate of embodiment — the love of being in a body. Defined here, the body is instrument and altar.",
    shadow: 'Disembodiment; life lived in the head.',
    gift: 'Serendipity that comes through being physically present.',
  },
  47: {
    name: 'Realising',
    keyword: 'Oppression',
    hexagram: "K'un — Oppression",
    body: "Gate 47 is the Ajna's gate of mental realisation — the moment when the struggle of the mind resolves into a clear picture. Defined here, the realisation cannot be forced; it has its own timing.",
    shadow: 'Pushing for an insight that is not ready.',
    gift: "The 'aha' allowed to arrive.",
  },
  48: {
    name: 'The Well',
    keyword: 'The Well',
    hexagram: 'Ching — The Well',
    body: "Gate 48 is the Spleen's gate of depth — the reservoir of what one knows. Defined here, the knowledge is there; the question is whether enough has been done with it.",
    shadow: 'Endless study; preparation as avoidance.',
    gift: 'Depth made useful. The well actually drawn from.',
  },
  49: {
    name: 'Revolution',
    keyword: 'Revolution',
    hexagram: 'Ko — Revolution',
    body: "Gate 49 is the Solar Plexus's gate of principles — the emotional readiness to end what cannot continue. Defined here, one carries a revolutionary's line.",
    shadow: 'Rejection without replacement.',
    gift: 'Clean separation done for the sake of what comes next.',
  },
  50: {
    name: 'Values',
    keyword: 'The Cauldron',
    hexagram: 'Ting — The Cauldron',
    body: "Gate 50 is the Spleen's gate of responsibility — the one who holds the communal values. Defined here, there is a weight to carry that does not entirely belong to oneself.",
    shadow: "Taking on everyone's weight.",
    gift: 'Values kept current for the collective that depends on them.',
  },
  51: {
    name: 'Shock',
    keyword: 'The Arousing',
    hexagram: 'Chen — The Arousing',
    body: "Gate 51 is the Heart's shock gate — the initiator, the one who knows how to meet shock by generating it. Defined here, there is a willingness to be the lightning.",
    shadow: "Aggression used for its own sake.",
    gift: 'Initiation that wakes others up to what matters.',
  },
  52: {
    name: 'Stillness',
    keyword: 'Keeping Still',
    hexagram: 'Ken — Keeping Still',
    body: "Gate 52 is the Root's gate of stillness under pressure — the capacity to stay put when everything around is moving. Defined here, stillness is a form of action.",
    shadow: 'Stagnation mistaken for stillness.',
    gift: 'Focused attention made possible by the refusal to scatter.',
  },
  53: {
    name: 'Beginnings',
    keyword: 'Development',
    hexagram: 'Chien — Development',
    body: "Gate 53 is the Root's gate of starting — the pressure to begin the next cycle. Defined here, the life hums with beginnings.",
    shadow: 'Always starting, never finishing.',
    gift: 'The courage to begin what needs to be begun.',
  },
  54: {
    name: 'Ambition',
    keyword: 'The Marrying Maiden',
    hexagram: 'Kuei Mei — The Marrying Maiden',
    body: "Gate 54 is the Root's gate of upward ambition — the pressure to rise, materially and otherwise. Defined here, the drive to improve one's station is constant.",
    shadow: 'Striving that forgets the present.',
    gift: 'Ambition used to lift others along with oneself.',
  },
  55: {
    name: 'Spirit',
    keyword: 'Abundance',
    hexagram: 'Feng — Abundance',
    body: "Gate 55 is the Solar Plexus's gate of spiritual mood — the emotional weather of spirit itself. Defined here, mood is the data, not an obstacle to the data.",
    shadow: 'Mood taken personally.',
    gift: 'Spirit felt through mood as a daily practice.',
  },
  56: {
    name: 'Stimulation',
    keyword: 'The Wanderer',
    hexagram: 'Lu — The Wanderer',
    body: "Gate 56 is the Throat's storyteller — the voice that entertains and instructs through narrative. Defined here, the story is the teaching.",
    shadow: 'Stories told because the room expects them.',
    gift: 'Narrative offered at the right moment to carry the right meaning.',
  },
  57: {
    name: 'Intuitive Clarity',
    keyword: 'The Gentle',
    hexagram: 'Sun — The Gentle',
    body: "Gate 57 is the Spleen's gate of present-tense intuition — the quietest, most precise of the intuitive gates. Defined here, the clarity arrives in real time.",
    shadow: 'Intuition overridden by the analytical mind.',
    gift: 'The subtle knowing that does not announce itself.',
  },
  58: {
    name: 'Vitality',
    keyword: 'The Joyous',
    hexagram: 'Tui — The Joyous',
    body: "Gate 58 is the Root's gate of the joy of being alive — the aliveness that wants to improve everything it touches. Defined here, vitality expresses as constructive critique.",
    shadow: 'Fault-finding without joy.',
    gift: 'Aliveness that makes things better by its presence.',
  },
  59: {
    name: 'Sexuality',
    keyword: 'Dispersion',
    hexagram: 'Huan — Dispersion',
    body: "Gate 59 is the Sacral's gate of intimacy — the dissolving of barriers between bodies. Defined here, intimacy is a creative act.",
    shadow: 'Closeness used as leverage.',
    gift: 'Intimacy that generates something new, including new people.',
  },
  60: {
    name: 'Acceptance',
    keyword: 'Limitation',
    hexagram: 'Chieh — Limitation',
    body: "Gate 60 is the Root's gate of acceptance — the pressure to work within the constraints that actually exist. Defined here, acceptance is a form of power.",
    shadow: 'Resignation mistaken for acceptance.',
    gift: 'Creativity through the limits, not around them.',
  },
  61: {
    name: 'Mystery',
    keyword: 'Inner Truth',
    hexagram: 'Chung Fu — Inner Truth',
    body: "Gate 61 is the Head's gate of inner truth — pressure to know what cannot be known through ordinary means. Defined here, the pressure is spiritual.",
    shadow: 'Demanding certainty where mystery is the correct answer.',
    gift: 'The contemplative stance that lets the unknown stay unknown and useful.',
  },
  62: {
    name: 'Detail',
    keyword: 'Preponderance of the Small',
    hexagram: 'Hsiao Kuo — Preponderance of the Small',
    body: "Gate 62 is the Throat's gate of precision — the voice that names things accurately. Defined here, the specific word matters more than the general gesture.",
    shadow: 'Pedantry; missing the forest for the naming of the trees.',
    gift: 'Accuracy that unlocks understanding.',
  },
  63: {
    name: 'Doubt',
    keyword: 'After Completion',
    hexagram: 'Chi Chi — After Completion',
    body: "Gate 63 is the Head's gate of doubt — the pressure to ask whether the answer is really correct. Defined here, doubt is a service.",
    shadow: 'Doubt turned on oneself without end.',
    gift: 'The healthy scepticism that keeps the collective honest.',
  },
  64: {
    name: 'Confusion',
    keyword: 'Before Completion',
    hexagram: 'Wei Chi — Before Completion',
    body: "Gate 64 is the Head's gate of mental pressure — the unfinished puzzle, the backlog of images awaiting resolution. Defined here, the pressure is to make sense of the past.",
    shadow: 'Confusion treated as a personal flaw.',
    gift: 'Patience with incompleteness. The mind as a place where unresolved things can wait.',
  },
};

/* ============================================================
 * Centres — which gates belong to each, and per-centre metadata.
 * ============================================================ */

export type HumanDesignCenterInfo = {
  gates: number[];
  theme: string;
  category: 'pressure' | 'awareness' | 'motor' | 'identity';
};

export const HD_CENTERS: Record<HumanDesignCenterName, HumanDesignCenterInfo> = {
  Head:           { gates: [64, 61, 63],                                theme: 'Pressure to know',                 category: 'pressure' },
  Ajna:           { gates: [47, 24, 4, 17, 43, 11],                     theme: 'Conceptualisation',                category: 'awareness' },
  Throat:         { gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16], theme: 'Manifestation and voice',          category: 'motor' },
  G:              { gates: [7, 1, 13, 25, 10, 15, 46, 2],               theme: 'Identity, direction, love',        category: 'identity' },
  Heart:          { gates: [21, 40, 26, 51],                            theme: 'Will, ego, and material courage',  category: 'motor' },
  'Solar Plexus': { gates: [36, 22, 37, 6, 49, 55, 30],                 theme: 'Emotional awareness',              category: 'motor' },
  Sacral:         { gates: [34, 5, 14, 29, 59, 9, 3, 42, 27],           theme: 'Life-force, work, response',       category: 'motor' },
  Spleen:         { gates: [48, 57, 44, 50, 32, 28, 18],                theme: 'Intuition, immunity, survival',    category: 'awareness' },
  Root:           { gates: [58, 38, 54, 53, 60, 52, 19, 39, 41],        theme: 'Pressure and fuel',                category: 'pressure' },
};

export const HD_CENTER_NAMES: readonly HumanDesignCenterName[] = [
  'Head', 'Ajna', 'Throat', 'G', 'Heart',
  'Solar Plexus', 'Sacral', 'Spleen', 'Root',
];

// Motor centres (used for Type determination).
export const HD_MOTORS: readonly HumanDesignCenterName[] = ['Sacral', 'Heart', 'Solar Plexus', 'Root'];

/* ============================================================
 * Channels — 36 pairs of gates
 * ============================================================ */

export const HD_CHANNELS: readonly HumanDesignChannel[] = [
  { gates: [1,  8],   name: 'Inspiration',         from: 'G',            to: 'Throat' },
  { gates: [2,  14],  name: 'The Beat',            from: 'G',            to: 'Sacral' },
  { gates: [3,  60],  name: 'Mutation',            from: 'Sacral',       to: 'Root' },
  { gates: [4,  63],  name: 'Logic',               from: 'Ajna',         to: 'Head' },
  { gates: [5,  15],  name: 'Rhythm',              from: 'Sacral',       to: 'G' },
  { gates: [6,  59],  name: 'Mating',              from: 'Solar Plexus', to: 'Sacral' },
  { gates: [7,  31],  name: 'The Alpha',           from: 'G',            to: 'Throat' },
  { gates: [9,  52],  name: 'Concentration',       from: 'Sacral',       to: 'Root' },
  { gates: [10, 20],  name: 'Awakening',           from: 'G',            to: 'Throat' },
  { gates: [10, 34],  name: 'Exploration',         from: 'G',            to: 'Sacral' },
  { gates: [10, 57],  name: 'Perfected Form',      from: 'G',            to: 'Spleen' },
  { gates: [11, 56],  name: 'Curiosity',           from: 'Ajna',         to: 'Throat' },
  { gates: [12, 22],  name: 'Openness',            from: 'Throat',       to: 'Solar Plexus' },
  { gates: [13, 33],  name: 'The Prodigal',        from: 'G',            to: 'Throat' },
  { gates: [16, 48],  name: 'The Wavelength',      from: 'Throat',       to: 'Spleen' },
  { gates: [17, 62],  name: 'Acceptance',          from: 'Ajna',         to: 'Throat' },
  { gates: [18, 58],  name: 'Judgement',           from: 'Spleen',       to: 'Root' },
  { gates: [19, 49],  name: 'Synthesis',           from: 'Root',         to: 'Solar Plexus' },
  { gates: [20, 34],  name: 'Charisma',            from: 'Throat',       to: 'Sacral' },
  { gates: [20, 57],  name: 'The Brainwave',       from: 'Throat',       to: 'Spleen' },
  { gates: [21, 45],  name: 'Money',               from: 'Heart',        to: 'Throat' },
  { gates: [23, 43],  name: 'Structuring',         from: 'Throat',       to: 'Ajna' },
  { gates: [24, 61],  name: 'Awareness',           from: 'Ajna',         to: 'Head' },
  { gates: [25, 51],  name: 'Initiation',          from: 'G',            to: 'Heart' },
  { gates: [26, 44],  name: 'Surrender',           from: 'Heart',        to: 'Spleen' },
  { gates: [27, 50],  name: 'Preservation',        from: 'Sacral',       to: 'Spleen' },
  { gates: [28, 38],  name: 'Struggle',            from: 'Spleen',       to: 'Root' },
  { gates: [29, 46],  name: 'Discovery',           from: 'Sacral',       to: 'G' },
  { gates: [30, 41],  name: 'Recognition',         from: 'Solar Plexus', to: 'Root' },
  { gates: [32, 54],  name: 'Transformation',      from: 'Spleen',       to: 'Root' },
  { gates: [34, 57],  name: 'Power',               from: 'Sacral',       to: 'Spleen' },
  { gates: [35, 36],  name: 'Transitoriness',      from: 'Throat',       to: 'Solar Plexus' },
  { gates: [37, 40],  name: 'Community',           from: 'Solar Plexus', to: 'Heart' },
  { gates: [39, 55],  name: 'Emoting',             from: 'Root',         to: 'Solar Plexus' },
  { gates: [42, 53],  name: 'Maturation',          from: 'Sacral',       to: 'Root' },
  { gates: [47, 64],  name: 'Abstraction',         from: 'Ajna',         to: 'Head' },
];

/* ============================================================
 * Type / Authority / Profile tables
 * ============================================================ */

export type HumanDesignTypeInfo = {
  strategy: string;
  notSelf: string;
  signature: string;
  body: string;
};

export const HD_TYPES: Record<HumanDesignType, HumanDesignTypeInfo> = {
  Manifestor: {
    strategy: 'Inform before you act',
    notSelf: 'Anger',
    signature: 'Peace',
    body: 'You are here to initiate. The work is to inform the people your action affects before you move — not to seek their permission, but to close the gap that your speed would otherwise open. When you inform, doors open. When you do not, the world resists for reasons that look unfair and are not.',
  },
  Generator: {
    strategy: 'To respond',
    notSelf: 'Frustration',
    signature: 'Satisfaction',
    body: 'You are a builder. Your life-force is designed to respond, not to initiate — the strategy is to wait for something to respond to, then to fully meet it. Satisfaction is the signal that you are on your correct work; frustration is the signal that you initiated something the Sacral did not actually say yes to.',
  },
  'Manifesting Generator': {
    strategy: 'Respond, then inform',
    notSelf: 'Frustration and anger',
    signature: 'Satisfaction and peace',
    body: 'You are a builder who moves fast. Like a Generator, you are waiting to respond — and like a Manifestor, once the response is clear, you need to inform the people who will be affected by how quickly you now move. Your speed is a feature, not a problem, when the response was genuine and the informing was done.',
  },
  Projector: {
    strategy: 'Wait for the invitation',
    notSelf: 'Bitterness',
    signature: 'Success',
    body: 'You are here to guide. You see others clearly — too clearly to pretend you cannot — but the world only hears you when you are recognised and invited into a role. Without invitation, the insight lands as pressure. With it, the same insight becomes leadership. Your rest is non-negotiable; your recognition is the system.',
  },
  Reflector: {
    strategy: 'Wait a lunar cycle',
    notSelf: 'Disappointment',
    signature: 'Surprise',
    body: 'You are the mirror of the field around you. Your openness is total — every centre undefined — and so you read the health of the world you are in. Big decisions take a full lunar cycle because the sampling takes that long. Your community is your authority; surprise is the signature that the reflection has resolved cleanly.',
  },
};

export const HD_AUTHORITIES: Record<HumanDesignAuthority, { body: string }> = {
  'Emotional Authority': {
    body: 'You are here to ride the wave. Decisions made at the top or bottom of the emotional wave are not decisions; they are weather. Clarity arrives through time — sleeping on it, talking it through more than once, noticing how the same choice feels on different days. When the wave resolves into a steady note, that note is the answer.',
  },
  'Sacral Authority': {
    body: 'Your body answers in real time. The uh-huh / uh-uh of the Sacral is the whole decision; anything that talks around it is not listening. The work is to arrange your life so that the yes and the no can actually be heard — often that means asking better yes/no questions and removing ambient pressure to perform.',
  },
  'Splenic Authority': {
    body: 'Your intuition speaks once, in the present tense, quietly. It does not repeat itself. When you override it in favour of analysis, the signal stays quiet until the next moment. Splenic authority works by daily practice — small yeses and nos in low-stakes moments — so that the instrument is warm when the important moment arrives.',
  },
  'Ego / Heart Authority': {
    body: "You are here to follow what you actually want. Willpower comes and goes in bursts; inside the burst, the truth is whatever you are willing to commit to out loud. Promises are sacred for you because they are the shape the authority takes. When the answer is 'I want to', that is the answer.",
  },
  'Self-Projected Authority': {
    body: 'You hear yourself decide. Your truth lives in your own voice — not in thought, but in speech. You find the answer by talking out loud to someone who will not rush you, and by listening to what you actually said. The sound of the words is the instrument.',
  },
  'Mental / Outer Authority': {
    body: 'Your inner process is mental; your actual authority is the quality of the environment you place yourself in. Decisions happen through talking them through with trusted others, in the right places, over time. The mental authority type must not trust the mind as a private oracle; it works only through dialogue.',
  },
  'Lunar Authority': {
    body: 'Wait a lunar cycle. A full 28-day arc samples the entire field you are embedded in, and only by the end of the cycle is the decision clean. Discuss it across the cycle with different people in different settings. This is the one authority that cannot be rushed.',
  },
};

// Profile lines: [Personality line][Design line]
export const HD_PROFILES: Record<string, { name: string; body: string }> = {
  '1/3': { name: 'Investigator / Martyr',     body: 'The researcher who learns by doing and breaking. Profile 1/3 needs foundations (line 1) and lives through trial and correction (line 3). Nothing is wasted, but much of what is tried does not stay.' },
  '1/4': { name: 'Investigator / Opportunist', body: 'Learns deep (line 1) and lives through a network of close relationships (line 4). Opportunities come through known people, not cold approach.' },
  '2/4': { name: 'Hermit / Opportunist',       body: 'A natural gift (line 2) emerges when a close network (line 4) calls it out. Requires being found rather than selling.' },
  '2/5': { name: 'Hermit / Heretic',           body: 'Natural gift (line 2) projected onto by the collective (line 5). The hermit is periodically required to deliver a practical solution and then retreat.' },
  '3/5': { name: 'Martyr / Heretic',           body: 'Trial and error (line 3) combined with the karmic projection of line 5. Lives by experiment; is seen by others as someone who can fix things, often before the experiment has resolved.' },
  '3/6': { name: 'Martyr / Role Model',        body: 'First half of life is experiment (line 3); second half is role model (line 6). The mistakes are the curriculum for the later authority.' },
  '4/6': { name: 'Opportunist / Role Model',   body: 'A life of close networks (line 4) that matures into role-model authority (line 6) after the mid-thirties transition.' },
  '4/1': { name: 'Opportunist / Investigator', body: 'Close network (line 4) built on investigated foundations (line 1). One of the more fixed profiles — the life shape is consistent.' },
  '5/1': { name: 'Heretic / Investigator',     body: 'Practical solutions (line 5) backed by deep study (line 1). Projection-heavy; the 5 must manage how it is seen.' },
  '5/2': { name: 'Heretic / Hermit',           body: 'Practical solution (line 5) with a hidden natural gift (line 2). The heretic delivers, the hermit retreats to refill.' },
  '6/2': { name: 'Role Model / Hermit',        body: 'The role model (line 6) with a private natural gift (line 2). Lives in three chapters — on the roof, off the roof, back on — the hermit is constant underneath.' },
  '6/3': { name: 'Role Model / Martyr',        body: 'The role model (line 6) lived into through trial and error (line 3). Matures slowly, becomes an authority through scars.' },
  '1/6': { name: 'Investigator / Role Model',  body: 'Deep study (line 1) feeding into role-model maturity (line 6). Rare and consequential.' },
  '2/6': { name: 'Hermit / Role Model',        body: 'A private gift (line 2) matured into public authority (line 6).' },
  '6/1': { name: 'Role Model / Investigator',  body: 'Role model on foundations of deep study.' },
  '1/5': { name: 'Investigator / Heretic',     body: 'Deep study offered as a practical solution.' },
  '1/1': { name: 'Investigator / Investigator', body: 'Pure foundation — the double investigator. Rare.' },
};

/* ============================================================
 * Angle helpers
 * ============================================================ */

function norm360(x: number): number {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

// Given an ecliptic longitude, return the gate + line.
export function hdLongitudeToGateLine(longitudeDeg: number): {
  gate: number;
  line: number;
  withinGateDeg: number;
} {
  const L = norm360(longitudeDeg - HD_GATE_OFFSET_DEG);
  let idx = Math.floor(L / HD_GATE_WIDTH_DEG);
  if (idx < 0) idx = 0;
  if (idx > 63) idx = 63;
  const within = L - idx * HD_GATE_WIDTH_DEG; // 0 .. 5.625
  let lineIdx = Math.floor(within / HD_LINE_WIDTH_DEG);
  if (lineIdx < 0) lineIdx = 0;
  if (lineIdx > 5) lineIdx = 5;
  return {
    gate: HD_WHEEL_ORDER[idx],
    line: lineIdx + 1,
    withinGateDeg: within,
  };
}

/* ============================================================
 * Astronomy helpers
 * ============================================================ */

function birthDataToUTCDate(birthData: HumanDesignBirthData): Date {
  const { dob, time, timeUnknown } = birthData;
  const hour = timeUnknown ? 12 : time.h;
  const minute = timeUnknown ? 0 : time.m;
  const tz = birthData.tzOffset ?? 0;
  let utcMs = Date.UTC(dob.y, dob.m - 1, dob.d, hour, minute, 0);
  utcMs -= tz * 3600 * 1000;
  return new Date(utcMs);
}

function eclipticLongitude(bodyName: HumanDesignBodyName, astroTime: Astronomy.AstroTime): number {
  if (bodyName === 'Moon') {
    const moonVec = Astronomy.GeoMoon(astroTime);
    const eclM = Astronomy.Ecliptic(moonVec);
    return norm360(eclM.elon);
  }
  // Earth/Node handled by caller; this path only for actual ephemeris bodies.
  const body = Astronomy.Body[bodyName as keyof typeof Astronomy.Body];
  const vec = Astronomy.GeoVector(body, astroTime, true);
  const ecl = Astronomy.Ecliptic(vec);
  return norm360(ecl.elon);
}

function meanNodeLongitude(astroTime: Astronomy.AstroTime): number {
  const T = astroTime.tt / 36525.0;
  const omega =
    125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T * T
    + (T * T * T) / 467441.0
    - (T * T * T * T) / 60616000.0;
  return norm360(omega);
}

/*
 * Find the Design moment — the UTC Date at which the Sun's ecliptic
 * longitude is exactly 88° LESS than at birth (modulo 360).
 *
 * Bisection on time: Sun moves ~0.9856°/day, so 88° ≈ 88.98 days earlier.
 * We search within [birth - 92d, birth - 85d] and bisect until the
 * longitude difference is below 1e-6 degrees.
 */
function findDesignTime(birthUtc: Date, birthSunLon: number): Date {
  const targetLon = norm360(birthSunLon - HD_DESIGN_ARC_DEG);

  function sunLonAt(dateMs: number): number {
    const t = new Astronomy.AstroTime(new Date(dateMs));
    return eclipticLongitude('Sun', t);
  }

  // Signed delta (actual - target), normalised to (-180, 180].
  function signedDelta(dateMs: number): number {
    const actual = sunLonAt(dateMs);
    return ((actual - targetLon + 540) % 360) - 180;
  }

  const ms = birthUtc.getTime();
  const DAY = 86400000;
  let hi = ms - 85 * DAY;   // 85 days before birth — Sun still ahead of target
  let lo = ms - 92 * DAY;   // 92 days before birth — Sun behind target

  let dHi = signedDelta(hi);
  let dLo = signedDelta(lo);

  // Widen the bracket if the signs don't straddle zero (year-boundary edges).
  let guard = 0;
  while (dHi * dLo > 0 && guard < 4) {
    lo -= DAY;
    hi += DAY / 4;
    if (hi > ms) hi = ms - DAY;
    dHi = signedDelta(hi);
    dLo = signedDelta(lo);
    guard++;
  }

  // 60 bisection steps — far more than needed.
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const dMid = signedDelta(mid);
    if (Math.abs(dMid) < 1e-6) {
      lo = hi = mid;
      break;
    }
    if (dMid * dLo > 0) {
      lo = mid;
      dLo = dMid;
    } else {
      hi = mid;
      dHi = dMid;
    }
  }
  return new Date((lo + hi) / 2);
}

/* ============================================================
 * Body set — 13 bodies (10 planets + N/S Node + Earth)
 * ============================================================ */

export const HD_BODIES: readonly HumanDesignBodyName[] = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  'NorthNode', 'SouthNode', 'Earth',
];

type ActivationPack = {
  astroTime: Astronomy.AstroTime;
  longitudes: Record<HumanDesignBodyName, number>;
  activations: HumanDesignActivations;
};

function computeActivations(utcDate: Date): ActivationPack {
  const astroTime = new Astronomy.AstroTime(utcDate);
  const longitudes: Partial<Record<HumanDesignBodyName, number>> = {};
  const activations: Partial<HumanDesignActivations> = {};

  // The 10 ephemeris planets.
  for (let i = 0; i < 10; i++) {
    const name = HD_BODIES[i];
    const lon = eclipticLongitude(name, astroTime);
    longitudes[name] = lon;
    const gl = hdLongitudeToGateLine(lon);
    activations[name] = { ...gl, longitude: lon };
  }

  // Nodes + Earth derived from ephemeris.
  const nodeLon = meanNodeLongitude(astroTime);
  const southNodeLon = norm360(nodeLon + 180);
  const sunLon = longitudes.Sun;
  if (sunLon === undefined) throw new Error('Sun longitude missing after ephemeris pass');
  const earthLon = norm360(sunLon + 180);

  longitudes.NorthNode = nodeLon;
  longitudes.SouthNode = southNodeLon;
  longitudes.Earth = earthLon;

  activations.NorthNode = { ...hdLongitudeToGateLine(nodeLon),       longitude: nodeLon };
  activations.SouthNode = { ...hdLongitudeToGateLine(southNodeLon),  longitude: southNodeLon };
  activations.Earth     = { ...hdLongitudeToGateLine(earthLon),      longitude: earthLon };

  return {
    astroTime,
    longitudes: longitudes as Record<HumanDesignBodyName, number>,
    activations: activations as HumanDesignActivations,
  };
}

/* ============================================================
 * Centre / Channel / Type / Authority derivation
 * ============================================================ */

function deriveCentersAndChannels(activatedGates: number[]): {
  definedChannels: string[];
  definedCenters: HumanDesignCenterName[];
} {
  const gateSet = new Set<number>(activatedGates);
  const definedChannels: string[] = [];
  const touchedCenters = new Set<HumanDesignCenterName>();

  for (const ch of HD_CHANNELS) {
    if (gateSet.has(ch.gates[0]) && gateSet.has(ch.gates[1])) {
      definedChannels.push(`${ch.gates[0]}-${ch.gates[1]}`);
      touchedCenters.add(ch.from);
      touchedCenters.add(ch.to);
    }
  }

  const definedCenters: HumanDesignCenterName[] =
    HD_CENTER_NAMES.filter((cn) => touchedCenters.has(cn));

  return { definedChannels, definedCenters };
}

// Does there exist a chain of defined channels from any motor centre to Throat?
function motorToThroat(
  definedChannelsArr: string[],
): { connected: boolean; motor: HumanDesignCenterName | null } {
  const adj: Partial<Record<HumanDesignCenterName, Set<HumanDesignCenterName>>> = {};
  const addEdge = (a: HumanDesignCenterName, b: HumanDesignCenterName): void => {
    if (!adj[a]) adj[a] = new Set();
    if (!adj[b]) adj[b] = new Set();
    adj[a]!.add(b);
    adj[b]!.add(a);
  };
  const byKey: Record<string, HumanDesignChannel> = {};
  for (const ch of HD_CHANNELS) {
    byKey[`${ch.gates[0]}-${ch.gates[1]}`] = ch;
  }
  for (const key of definedChannelsArr) {
    const ch = byKey[key];
    if (ch) addEdge(ch.from, ch.to);
  }

  for (const start of HD_MOTORS) {
    const startAdj = adj[start];
    if (!startAdj) continue;
    const seen = new Set<HumanDesignCenterName>([start]);
    const q: HumanDesignCenterName[] = [start];
    while (q.length) {
      const n = q.shift()!;
      if (n === 'Throat') return { connected: true, motor: start };
      const nbrs = adj[n];
      if (!nbrs) continue;
      for (const nb of nbrs) {
        if (!seen.has(nb)) {
          seen.add(nb);
          q.push(nb);
        }
      }
    }
  }
  return { connected: false, motor: null };
}

function determineType(
  definedCenters: HumanDesignCenterName[],
  definedChannels: string[],
): HumanDesignType {
  if (definedCenters.length === 0) return 'Reflector';

  const defSet = new Set<HumanDesignCenterName>(definedCenters);
  const sacralDefined = defSet.has('Sacral');
  const m2t = motorToThroat(definedChannels);

  if (sacralDefined) {
    // Any motor-to-throat connection (including Sacral itself) ⇒ Manifesting Generator.
    if (m2t.connected) return 'Manifesting Generator';
    return 'Generator';
  }

  // Sacral not defined.
  if (m2t.connected && m2t.motor !== 'Sacral') return 'Manifestor';

  // No motor-to-throat, no Sacral ⇒ Projector.
  return 'Projector';
}

function determineAuthority(
  definedCenters: HumanDesignCenterName[],
  type: HumanDesignType,
): HumanDesignAuthority {
  if (type === 'Reflector') return 'Lunar Authority';
  const s = new Set<HumanDesignCenterName>(definedCenters);
  if (s.has('Solar Plexus')) return 'Emotional Authority';
  if (s.has('Sacral'))       return 'Sacral Authority';
  if (s.has('Spleen'))       return 'Splenic Authority';
  if (s.has('Heart'))        return 'Ego / Heart Authority';
  if (s.has('G'))            return 'Self-Projected Authority';
  if (s.has('Head') && s.has('Ajna')) return 'Mental / Outer Authority';
  return 'Lunar Authority';
}

/* ============================================================
 * Incarnation Cross
 * ============================================================ */

function incarnationCross(
  personality: HumanDesignActivations,
  design: HumanDesignActivations,
): HumanDesignIncarnationCross {
  const pSunLine = personality.Sun.line;
  let angle: HumanDesignIncarnationCross['angle'];
  if (pSunLine >= 1 && pSunLine <= 3) angle = 'Right Angle';
  else if (pSunLine === 4)            angle = 'Juxtaposition';
  else                                angle = 'Left Angle';

  const sig =
    `${personality.Sun.gate}/${personality.Earth.gate}` +
    ` | ${design.Sun.gate}/${design.Earth.gate}`;

  return {
    angle,
    name:
      `${angle} Cross of ${personality.Sun.gate}/${personality.Earth.gate}` +
      ` (Design ${design.Sun.gate}/${design.Earth.gate})`,
    gates: {
      personalitySun: personality.Sun.gate,
      personalityEarth: personality.Earth.gate,
      designSun: design.Sun.gate,
      designEarth: design.Earth.gate,
    },
    signature: sig,
  };
}

/* ============================================================
 * Public: computeHumanDesign(birthData)
 * ============================================================ */

export function computeHumanDesign(birthData: HumanDesignBirthData): HumanDesignResult {
  const birthUtc = birthDataToUTCDate(birthData);
  const pAstroTime = new Astronomy.AstroTime(birthUtc);
  const birthSunLon = eclipticLongitude('Sun', pAstroTime);

  // Personality — at birth.
  const pers = computeActivations(birthUtc);

  // Design — 88° of solar arc earlier.
  const designUtc = findDesignTime(birthUtc, birthSunLon);
  const desn = computeActivations(designUtc);

  // Union of activated gates.
  const gateSet = new Set<number>();
  for (const body of HD_BODIES) {
    gateSet.add(pers.activations[body].gate);
    gateSet.add(desn.activations[body].gate);
  }
  const activatedGates = Array.from(gateSet).sort((a, b) => a - b);

  // Centres + channels.
  const cc = deriveCentersAndChannels(activatedGates);
  const type = determineType(cc.definedCenters, cc.definedChannels);
  const authority = determineAuthority(cc.definedCenters, type);
  const strategy = HD_TYPES[type].strategy;

  // Profile = personality Sun line . design Sun line
  const profileKey = `${pers.activations.Sun.line}/${desn.activations.Sun.line}`;
  const profileEntry = HD_PROFILES[profileKey] ?? {
    name: `Profile ${profileKey}`,
    body: 'A rarer combination; consult a practitioner for depth.',
  };

  // Incarnation cross.
  const cross = incarnationCross(pers.activations, desn.activations);

  // Per-gate interpretation list (unique gates, both books combined).
  const interpGates: HumanDesignGateInterpretation[] = [];
  for (const gn of activatedGates) {
    const g = HD_GATES[gn];
    if (!g) continue;
    // Which body activated it? Prefer Personality-first.
    let book: 'personality' | 'design' | null = null;
    let bodyName: HumanDesignBodyName | null = null;
    let line: number | null = null;
    for (const bn of HD_BODIES) {
      if (pers.activations[bn].gate === gn) {
        book = 'personality';
        bodyName = bn;
        line = pers.activations[bn].line;
        break;
      }
    }
    if (!book) {
      for (const bn of HD_BODIES) {
        if (desn.activations[bn].gate === gn) {
          book = 'design';
          bodyName = bn;
          line = desn.activations[bn].line;
          break;
        }
      }
    }
    interpGates.push({
      gate: gn,
      line,
      book,
      body: bodyName,
      name: g.name,
      keyword: g.keyword,
      hexagram: g.hexagram,
      prose: g.body,
      shadow: g.shadow,
      gift: g.gift,
    });
  }

  // Build gate-number → name lookup for UI consumers.
  const gateNames: Record<number, string> = {};
  for (const k of Object.keys(HD_GATES)) {
    const n = Number(k);
    gateNames[n] = HD_GATES[n].name;
  }

  const typeInfo = HD_TYPES[type];

  return {
    personality: pers.activations,
    personalityUtc: birthUtc,
    design: desn.activations,
    designUtc,
    activatedGates,
    definedCenters: cc.definedCenters,
    definedChannels: cc.definedChannels,
    type,
    strategy,
    authority,
    profile: profileKey,
    profileName: profileEntry.name,
    profileBody: profileEntry.body,
    incarnationCross: cross,
    interpretations: {
      type: typeInfo.body,
      strategy: typeInfo.strategy,
      notSelf: typeInfo.notSelf,
      signature: typeInfo.signature,
      authority: HD_AUTHORITIES[authority].body,
      profile: profileEntry.body,
      gates: interpGates,
    },
    gateNames,
  };
}
