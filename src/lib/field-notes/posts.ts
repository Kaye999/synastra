// Field notes — long-form companion to the ambient teachings.
// Voice: slow, observation-led, anti-rushing, somatic, names traditions specifically,
// no vague "ancient wisdom" mush. Hemisphere-aware where relevant.
//
// To add a post: append to POSTS. The index and [slug] routes pick it up automatically.

import type { SeasonPhaseId, LunarPhaseId, Hemisphere } from '@/lib/ambient/types';

export type CycleId = 'solar' | 'lunar' | 'agricultural' | 'planetary';

export type TraditionId =
  | 'celtic'
  | 'gaelic'
  | 'germanic'
  | 'slavic'
  | 'vedic'
  | 'yoruba'
  | 'mesoamerican'
  | 'nordic'
  | 'aboriginal-acknowledgement'
  | 'multi-tradition';

export interface FieldNote {
  slug: string;
  title: string;             // SEASON — THE [TENSION]
  excerpt: string;           // one-line teaser for the index card
  hero: string;              // poster path, reuses /scenes/ assets
  publishedAt: string;       // ISO date
  cycle: CycleId;
  tradition: TraditionId | TraditionId[];
  season?: SeasonPhaseId;
  lunar?: LunarPhaseId;
  hemisphere?: Hemisphere | 'both';
  body: string[];            // paragraphs
  practice: string;          // one somatic / behavioural prompt
  references?: { label: string; href?: string }[];
}

export const POSTS: FieldNote[] = [
  {
    slug: 'samhain-the-world-withdraws',
    title: 'Samhain — The World Withdraws',
    excerpt:
      'The threshold between bright half and dark half of the year. The land rests. So can you.',
    hero: '/scenes/autumn-dusk.jpg',
    publishedAt: '2026-05-01',
    cycle: 'agricultural',
    tradition: ['celtic', 'gaelic'],
    season: 'samhain',
    hemisphere: 'south',
    body: [
      'In the old Gaelic year there are two halves: the bright half, beginning at Beltane, and the dark half, beginning at Samhain. Not winter and summer. Half and half. The wheel turns by halves.',
      'Samhain — pronounced sow-in — was the threshold between them. A cross-quarter day, halfway between the autumn equinox and the winter solstice. The cattle were brought down from the high pastures. The harvest was finished or it was not. What had been gathered was gathered. What was still in the field belonged now to the dark.',
      'It was understood, then, that the year had a withdrawal in it. That the land needed to rest, and so the people did too. Not stop — rest. There is a difference. Stopping is forced. Rest is permitted.',
      'In the Southern Hemisphere, where the calendar runs upside down to the one the wheel was named for, Samhain falls in late April and early May. The Australian bush is leafless in some places, mist-bound in others. The temperature drops a few degrees and the sky thins. The body feels it before the mind does.',
      'You will be tempted to push through. The work is loud. The pace is unbroken. Modernity has no Samhain — only Mondays. But the body remembers what the calendar has forgotten. The dark half asks something of you that the bright half does not.',
      'It asks you to stop performing growth.',
      'Samhain is not a holiday for productivity. It is a permission slip for the part of you that has been operating on borrowed light. Drop one thing this week. Not forever — just for the dark half. The land does this. It does not apologise.',
    ],
    practice:
      'Tonight, name one thing you have been forcing through. Tomorrow, do not do it. Notice what fills the space.',
    references: [
      { label: 'Hutton, R. — "The Stations of the Sun" (1996)' },
      { label: 'Mac Cana, P. — "Celtic Mythology"' },
    ],
  },
  {
    slug: 'beltane-fire-on-the-hill',
    title: 'Beltane — Fire on the Hill',
    excerpt:
      'The opposite threshold to Samhain — the bright half begins. The body wakes before the mind catches up.',
    hero: '/scenes/spring-day.jpg',
    publishedAt: '2026-05-01',
    cycle: 'agricultural',
    tradition: ['celtic', 'gaelic'],
    season: 'beltane',
    hemisphere: 'north',
    body: [
      'Six months opposite Samhain on the wheel sits Beltane — the first of May, the start of the bright half. In the old practice, two fires were lit on a hill. The cattle were driven between them. The smoke was understood to cleanse. The fire was understood to bless. Then the herds went up to the high pastures for the long light.',
      'Beltane is not the first day of summer. It is the threshold. The promise that summer is coming and the body had better get ready.',
      'You can feel this in the Northern hemisphere right now. The light returns in minutes per day. The ground warms. Things that were brittle become pliable again. The body wants to move outside before the mind has caught up to the season.',
      'There is a danger in Beltane — and the old people knew this. The danger is rushing. The bright half wants you to commit. To plant, to leap, to bind yourself to the year ahead. But Beltane is still a threshold, not the destination. The cattle are driven between the fires; they do not stay in them.',
      'The somatic instruction is: feel the fire, do not become it. Notice what wants to begin. Notice it twice before you start it. The seed knows when the soil is ready. The instinct that says "now" can be trusted; the urgency that says "right now or never" cannot.',
      'Beltane is the season of held desire. The land has not lied to you about what is coming. It has only asked you to walk between the fires before you run.',
    ],
    practice:
      'Name one thing you feel pulled to start this week. Wait three days. If the pull is still there, begin — slowly.',
    references: [
      { label: 'Hutton, R. — "The Stations of the Sun" (1996)' },
      { label: 'Carmichael, A. — "Carmina Gadelica" (Vol. I)' },
    ],
  },
  {
    slug: 'the-cross-quarter-days',
    title: 'The Cross-Quarter Days — The Wheel That Holds The Year',
    excerpt:
      'Eight thresholds, six weeks apart. The skeleton of any calendar that pre-dates the clock.',
    hero: '/scenes/dawn-generic.jpg',
    publishedAt: '2026-05-01',
    cycle: 'solar',
    tradition: 'multi-tradition',
    body: [
      'Most living calendars older than mechanical time are built on eight thresholds, not twelve months. Four are the solar quarters — the two solstices and the two equinoxes — and four are the cross-quarters, halfway between them.',
      'The Celtic version names them Samhain, Imbolc, Beltane, and Lughnasadh (also called Lammas). The Slavic, Germanic, and pre-Christian Mediterranean traditions have their own names — Maslenitsa, Walpurgisnacht, the Roman Lupercalia — but the dates and the function are uncannily similar. It is not coincidence. It is the same skeleton, dressed in different cloth.',
      'A cross-quarter is a threshold day. The land has not yet finished one season but is no longer fully in it. Imbolc — early February in the North — is not winter and not yet spring; the ewes are lactating and the buds are tight. Lammas — early August — is not yet autumn but the first grain has been cut. The cross-quarters are the body of the year. The solstices and equinoxes are the joints.',
      'Why does this matter, in a year now ruled by quarters and weeks? Because the body still keeps the older calendar. The energy systems do not know what month means. They know light, temperature, hormonal cadence, agricultural rhythm. A nervous system that has been managing modernity all year will, around Samhain, want to withdraw — and may not know why. Around Beltane, it will want to begin — and may not know why. Naming the thresholds is one way to stop pathologising rhythm.',
      'You do not have to believe in the gods who held these days. You only have to believe in the year — the actual one, with its tilt and its orbit. The wheel was reverse-engineered from observation. It is one of the oldest pieces of decent science.',
      'Use it as a frame, not a religion. Eight thresholds, six weeks apart. Notice which one you are closest to. Notice what your body wants. Most of the time the answer is in the calendar itself, written in light.',
    ],
    practice:
      'Look at the date. Find the cross-quarter or solstice nearest to it. Set one ten-minute window this week to walk outside without your phone, at roughly that hour, and ask the body what it knows.',
    references: [
      { label: 'Hutton, R. — "The Stations of the Sun" (1996)' },
      { label: 'Frazer, J. — "The Golden Bough" (use with caution; period-of-its-time)' },
      { label: 'Latour, B. — "Facing Gaia" — on the modern temporal flattening' },
    ],
  },
];

export function getPost(slug: string): FieldNote | undefined {
  return POSTS.find((p) => p.slug === slug);
}
