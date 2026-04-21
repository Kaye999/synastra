// ayurveda-questions.ts — 30-question prakruti assessment.
//
// Each question presents three self-descriptive options; each option maps to
// exactly one dosha. The labels are observational (what the reader notices
// about their own body and behaviour), not diagnostic. We never surface the
// dosha names in the UI — the reader should not be able to game the quiz.
//
// Distribution:
//   Physical          — 10 questions (frame, skin, hair, teeth, nails,
//                       weight, sweat, temperature, digestion tempo,
//                       stool tendency)
//   Mental-emotional  — 10 questions (sleep, memory, stress response,
//                       speech, decision-making, emotional baseline,
//                       criticism, creativity, friendship, argument)
//   Lifestyle         — 10 questions (appetite rhythm, energy curve,
//                       weather preference, exercise default, travel,
//                       money habit, room preference, daily rhythm,
//                       eating speed, enthusiasm recovery)

import type { Dosha } from '@/lib/engines/ayurveda';

export type AyurvedaOption = {
  id: string; // 'a' | 'b' | 'c' — stable within a question
  label: string;
  dosha: Dosha;
};

export type AyurvedaQuestion = {
  id: string; // q01 .. q30, used as answer key
  category: 'physical' | 'mental' | 'lifestyle';
  prompt: string;
  options: AyurvedaOption[]; // always 3, one per dosha, presented in written order
};

export const AYURVEDA_QUESTIONS: AyurvedaQuestion[] = [
  // ── Physical ──────────────────────────────────────────────────────────────
  {
    id: 'q01',
    category: 'physical',
    prompt: 'Your body frame, since adolescence:',
    options: [
      { id: 'a', label: 'Thin and light — hard to put weight on, even eating well', dosha: 'vata' },
      { id: 'b', label: 'Medium and muscular — proportioned, responds quickly to training', dosha: 'pitta' },
      { id: 'c', label: 'Solid and broad — gains easily, loses with difficulty', dosha: 'kapha' },
    ],
  },
  {
    id: 'q02',
    category: 'physical',
    prompt: 'Your skin, in a neutral climate:',
    options: [
      { id: 'a', label: 'Dry, cool, sometimes rough at the knuckles and heels', dosha: 'vata' },
      { id: 'b', label: 'Warm, ruddy or freckled, prone to flushing and rashes', dosha: 'pitta' },
      { id: 'c', label: 'Thick, smooth, cool, oily across the T-zone', dosha: 'kapha' },
    ],
  },
  {
    id: 'q03',
    category: 'physical',
    prompt: 'Your hair:',
    options: [
      { id: 'a', label: 'Fine, dry, frizzes easily, ends split', dosha: 'vata' },
      { id: 'b', label: 'Fine-to-medium, early grey or early thinning at the crown', dosha: 'pitta' },
      { id: 'c', label: 'Thick, heavy, lustrous, slow to grey', dosha: 'kapha' },
    ],
  },
  {
    id: 'q04',
    category: 'physical',
    prompt: 'Your teeth and gums:',
    options: [
      { id: 'a', label: 'Irregular, crowded, or protruding; gums recede easily', dosha: 'vata' },
      { id: 'b', label: 'Medium-sized, yellowish cast, gums bleed if brushed hard', dosha: 'pitta' },
      { id: 'c', label: 'Large, even, very white; strong gums', dosha: 'kapha' },
    ],
  },
  {
    id: 'q05',
    category: 'physical',
    prompt: 'Your nails:',
    options: [
      { id: 'a', label: 'Brittle, ridged, break easily', dosha: 'vata' },
      { id: 'b', label: 'Pink, flexible, smooth', dosha: 'pitta' },
      { id: 'c', label: 'Thick, strong, slightly pale', dosha: 'kapha' },
    ],
  },
  {
    id: 'q06',
    category: 'physical',
    prompt: 'Your weight, across the last ten years:',
    options: [
      { id: 'a', label: 'Fluctuates with stress and appetite; stays on the lighter end', dosha: 'vata' },
      { id: 'b', label: 'Sits in a reliable band; responds sharply to diet changes', dosha: 'pitta' },
      { id: 'c', label: 'Drifts upward unless actively managed; holds weight well', dosha: 'kapha' },
    ],
  },
  {
    id: 'q07',
    category: 'physical',
    prompt: 'You sweat:',
    options: [
      { id: 'a', label: 'Very little, even in heat or exercise', dosha: 'vata' },
      { id: 'b', label: 'Easily and profusely — heat is hard', dosha: 'pitta' },
      { id: 'c', label: 'Moderately, evenly, without discomfort', dosha: 'kapha' },
    ],
  },
  {
    id: 'q08',
    category: 'physical',
    prompt: 'Your temperature preference:',
    options: [
      { id: 'a', label: 'Always cold; sleeps under two blankets in summer', dosha: 'vata' },
      { id: 'b', label: 'Runs hot; window open in winter, sheets kicked off by 2am', dosha: 'pitta' },
      { id: 'c', label: 'Cool and comfortable; dislikes damp cold more than heat', dosha: 'kapha' },
    ],
  },
  {
    id: 'q09',
    category: 'physical',
    prompt: 'Your digestion:',
    options: [
      { id: 'a', label: 'Variable — one day strong, the next bloated or cramped', dosha: 'vata' },
      { id: 'b', label: 'Sharp and reliable — hungry on schedule, irritable if delayed', dosha: 'pitta' },
      { id: 'c', label: 'Slow and steady — meals sit a long time, rarely urgent', dosha: 'kapha' },
    ],
  },
  {
    id: 'q10',
    category: 'physical',
    prompt: 'Your stools tend to be:',
    options: [
      { id: 'a', label: 'Dry, hard, irregular; constipation is the default problem', dosha: 'vata' },
      { id: 'b', label: 'Loose, frequent, sometimes burning; urgency after hot food', dosha: 'pitta' },
      { id: 'c', label: 'Well-formed, heavy, daily, unhurried', dosha: 'kapha' },
    ],
  },

  // ── Mental-emotional ──────────────────────────────────────────────────────
  {
    id: 'q11',
    category: 'mental',
    prompt: 'Your sleep:',
    options: [
      { id: 'a', label: 'Light and broken — wake at 3am, hard to fall back', dosha: 'vata' },
      { id: 'b', label: 'Moderate and efficient — six or seven clean hours', dosha: 'pitta' },
      { id: 'c', label: 'Deep and long — hard to wake, slow out of the blankets', dosha: 'kapha' },
    ],
  },
  {
    id: 'q12',
    category: 'mental',
    prompt: 'Your memory:',
    options: [
      { id: 'a', label: 'Quick to take in, quick to forget; dates slip, ideas stick', dosha: 'vata' },
      { id: 'b', label: 'Sharp and selective; remembers what was useful or offensive', dosha: 'pitta' },
      { id: 'c', label: 'Slow to register, long to retain; never forgets a face', dosha: 'kapha' },
    ],
  },
  {
    id: 'q13',
    category: 'mental',
    prompt: 'Under stress, your first response is:',
    options: [
      { id: 'a', label: 'Anxiety — racing thoughts, restless limbs, over-talking', dosha: 'vata' },
      { id: 'b', label: 'Anger — impatience, cutting remarks, control over the room', dosha: 'pitta' },
      { id: 'c', label: 'Withdrawal — go quiet, go still, eat something heavy', dosha: 'kapha' },
    ],
  },
  {
    id: 'q14',
    category: 'mental',
    prompt: 'Your speech:',
    options: [
      { id: 'a', label: 'Fast, lyrical, associative — drifts, circles, returns', dosha: 'vata' },
      { id: 'b', label: 'Clear, decisive, precise — does not tolerate padding', dosha: 'pitta' },
      { id: 'c', label: 'Slow, warm, thoughtful — pauses before replying', dosha: 'kapha' },
    ],
  },
  {
    id: 'q15',
    category: 'mental',
    prompt: 'Your decision-making:',
    options: [
      { id: 'a', label: 'Revisited, re-weighed, sometimes reversed the next morning', dosha: 'vata' },
      { id: 'b', label: 'Fast, confident, rarely second-guessed once made', dosha: 'pitta' },
      { id: 'c', label: 'Slow, deliberate, reluctant to move until the ground is clear', dosha: 'kapha' },
    ],
  },
  {
    id: 'q16',
    category: 'mental',
    prompt: 'Your emotional baseline:',
    options: [
      { id: 'a', label: 'Variable — moods shift quickly with weather, food, company', dosha: 'vata' },
      { id: 'b', label: 'Focused — emotion channels into purpose or problem', dosha: 'pitta' },
      { id: 'c', label: 'Steady — slow to rise, slow to fall, hard to destabilise', dosha: 'kapha' },
    ],
  },
  {
    id: 'q17',
    category: 'mental',
    prompt: 'When criticised:',
    options: [
      { id: 'a', label: 'Ruminate and replay — the sting lingers days', dosha: 'vata' },
      { id: 'b', label: 'Counter on the spot — sharpen the argument', dosha: 'pitta' },
      { id: 'c', label: 'Absorb without reply — but remember for years', dosha: 'kapha' },
    ],
  },
  {
    id: 'q18',
    category: 'mental',
    prompt: 'Your creativity:',
    options: [
      { id: 'a', label: 'Many ideas, multiple projects open, some unfinished', dosha: 'vata' },
      { id: 'b', label: 'Structured, competitive, driven to excellence in one chosen line', dosha: 'pitta' },
      { id: 'c', label: 'Patient, craft-based, steady — lacquer, garden, handmade', dosha: 'kapha' },
    ],
  },
  {
    id: 'q19',
    category: 'mental',
    prompt: 'Your friendships:',
    options: [
      { id: 'a', label: 'Many and varied — easy to start, harder to keep routine', dosha: 'vata' },
      { id: 'b', label: 'Few and intense — chosen people, held tightly, honestly', dosha: 'pitta' },
      { id: 'c', label: 'Small and lifelong — the same people across decades', dosha: 'kapha' },
    ],
  },
  {
    id: 'q20',
    category: 'mental',
    prompt: 'In an argument, you:',
    options: [
      { id: 'a', label: 'Get flustered, talk over yourself, often leave the room', dosha: 'vata' },
      { id: 'b', label: 'Cut cleanly — want the issue named and resolved today', dosha: 'pitta' },
      { id: 'c', label: 'Go quiet, wait the other person out, rarely escalate', dosha: 'kapha' },
    ],
  },

  // ── Lifestyle ─────────────────────────────────────────────────────────────
  {
    id: 'q21',
    category: 'lifestyle',
    prompt: 'Your appetite:',
    options: [
      { id: 'a', label: 'Irregular — some days ravenous, some days forget to eat', dosha: 'vata' },
      { id: 'b', label: 'Strong and punctual — hunger becomes irritability within the hour', dosha: 'pitta' },
      { id: 'c', label: 'Moderate and emotional — can skip a meal without noticing', dosha: 'kapha' },
    ],
  },
  {
    id: 'q22',
    category: 'lifestyle',
    prompt: 'Your energy across the day:',
    options: [
      { id: 'a', label: 'Spiky — bursts of focus, sudden crashes, second wind at 10pm', dosha: 'vata' },
      { id: 'b', label: 'Peaks from late morning through afternoon, declines after dinner', dosha: 'pitta' },
      { id: 'c', label: 'Slow start, steady middle, comfortable evening', dosha: 'kapha' },
    ],
  },
  {
    id: 'q23',
    category: 'lifestyle',
    prompt: 'Your weather preference:',
    options: [
      { id: 'a', label: 'Late summer — warmth, dryness, long golden evenings', dosha: 'vata' },
      { id: 'b', label: 'Early autumn — cool air, clear light, low humidity', dosha: 'pitta' },
      { id: 'c', label: 'Late spring — warm, bright, dry; dislikes damp cold', dosha: 'kapha' },
    ],
  },
  {
    id: 'q24',
    category: 'lifestyle',
    prompt: 'Your default exercise:',
    options: [
      { id: 'a', label: 'Walking, yin yoga, dance — variety over intensity', dosha: 'vata' },
      { id: 'b', label: 'Competitive sport, hard running, weights to failure', dosha: 'pitta' },
      { id: 'c', label: 'Hiking, swimming laps, long steady cycling', dosha: 'kapha' },
    ],
  },
  {
    id: 'q25',
    category: 'lifestyle',
    prompt: 'Travel leaves you:',
    options: [
      { id: 'a', label: 'Exhilarated but depleted — needs several days of rhythm to restore', dosha: 'vata' },
      { id: 'b', label: 'Energised — plans the next trip before the current one ends', dosha: 'pitta' },
      { id: 'c', label: 'Content but tired — happy to stay home for weeks afterward', dosha: 'kapha' },
    ],
  },
  {
    id: 'q26',
    category: 'lifestyle',
    prompt: 'Your money habit:',
    options: [
      { id: 'a', label: 'Spontaneous — saves in spurts, spends on travel and small pleasures', dosha: 'vata' },
      { id: 'b', label: 'Organised and goal-directed — invests, tracks, optimises', dosha: 'pitta' },
      { id: 'c', label: 'Accumulative — saves steadily, slow to spend, reluctant to part with things', dosha: 'kapha' },
    ],
  },
  {
    id: 'q27',
    category: 'lifestyle',
    prompt: 'A room you live well in:',
    options: [
      { id: 'a', label: 'Bright, airy, high-ceilinged, lightly furnished', dosha: 'vata' },
      { id: 'b', label: 'Clean-lined, well-lit, organised, functional', dosha: 'pitta' },
      { id: 'c', label: 'Warm, layered, cushioned, low-ceilinged and cosy', dosha: 'kapha' },
    ],
  },
  {
    id: 'q28',
    category: 'lifestyle',
    prompt: 'Your daily rhythm:',
    options: [
      { id: 'a', label: 'Varies day to day — structure wobbles under inspiration', dosha: 'vata' },
      { id: 'b', label: 'Disciplined and planned — a schedule you defend', dosha: 'pitta' },
      { id: 'c', label: 'Habitual and slow to change — the same hours, the same routes', dosha: 'kapha' },
    ],
  },
  {
    id: 'q29',
    category: 'lifestyle',
    prompt: 'You eat:',
    options: [
      { id: 'a', label: 'Quickly, often while doing something else, sometimes standing', dosha: 'vata' },
      { id: 'b', label: 'At pace, methodically, finishes before others at the table', dosha: 'pitta' },
      { id: 'c', label: 'Slowly, with pleasure, taking the meal at its own time', dosha: 'kapha' },
    ],
  },
  {
    id: 'q30',
    category: 'lifestyle',
    prompt: 'Your enthusiasm, when a project is new:',
    options: [
      { id: 'a', label: 'Intense but short — exhaustion follows the second week', dosha: 'vata' },
      { id: 'b', label: 'Focused and sustained — finishes what is started', dosha: 'pitta' },
      { id: 'c', label: 'Slow to ignite but, once lit, hard to extinguish', dosha: 'kapha' },
    ],
  },
];

/** The fixed question count surfaced by the UI for the progress bar. */
export const AYURVEDA_QUESTION_COUNT = AYURVEDA_QUESTIONS.length;
