// Teaching layer — the bridge from data to ancestral framing.
// Voice: slow, observation-led, anti-rushing, somatic, names traditions specifically.
// Each entry is one line; longer essays live in /field-notes (next phase).

import type { LunarPhaseId, SeasonPhaseId, TimeOfDayId } from './types';

export const SEASON_TEACHINGS: Record<SeasonPhaseId, string> = {
  imbolc:
    'Imbolc — beneath frozen ground, the seed begins. You do not have to bloom yet.',
  ostara:
    'Ostara — equal light, equal dark. The threshold of return.',
  beltane:
    'Beltane — fire on the hill. The body remembers what it wants.',
  litha:
    'Litha — the longest light. Even the sun must turn.',
  lammas:
    'Lammas — first harvest. Take only what you can carry. Leave the rest for the field.',
  mabon:
    'Mabon — equal light, equal dark. What you grew is enough.',
  samhain:
    'Samhain — the world withdraws. You are allowed to also.',
  yule:
    'Yule — the longest dark. Hold the small flame. Light returns to those who wait.',
};

export const LUNAR_TEACHINGS: Record<LunarPhaseId, string> = {
  'new':
    'New moon — the dark before the seed. Set the intention quietly.',
  'waxing-crescent':
    'Waxing crescent — what you started is testing the ground.',
  'first-quarter':
    'First quarter — the resistance is the threshold, not the wall.',
  'waxing-gibbous':
    'Waxing gibbous — almost. Refine, do not rush.',
  'full':
    'Full moon — the field is illuminated. See what is, not what you wanted.',
  'waning-gibbous':
    'Waning gibbous — share what you harvested. The cup empties to fill.',
  'last-quarter':
    'Last quarter — release what no longer feeds you. The body knows.',
  'waning-crescent':
    'Waning crescent — rest. The dark before the next seed.',
};

export const TIME_OF_DAY_TEACHINGS: Record<TimeOfDayId, string> = {
  'deep-night':
    'Deep night — the hour of the unsleeping. Soften your watch.',
  'pre-dawn':
    'Pre-dawn — the world rehearses returning.',
  'dawn':
    'Dawn — first light. The day has not yet asked anything of you.',
  'morning':
    'Morning — the body opens. Move slowly enough to notice.',
  'midday':
    'Midday — the sun at its full word. Pause. Breathe under it.',
  'afternoon':
    'Afternoon — the long arc. Let the work loosen.',
  'dusk':
    'Dusk — the threshold hour. Neither day nor night. Permission to slow.',
  'twilight':
    'Twilight — the sky has more colours than language. Be quiet for them.',
  'night':
    'Night — the body asks for darkness. Give it.',
};
