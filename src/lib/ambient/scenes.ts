import type {
  AmbientState,
  BroadSeason,
  Hemisphere,
  LunarPhaseId,
  TimeOfDayId,
  WeatherId,
} from './types';

// Time-of-day groups — coarser than the underlying ids so manifest entries don't have to
// enumerate every variant. Each TimeOfDayId maps to exactly one group.
export type TimeOfDayGroup = 'day' | 'night' | 'dawn' | 'dusk';

const TOD_GROUP: Record<TimeOfDayId, TimeOfDayGroup> = {
  'deep-night': 'night',
  'pre-dawn':   'dawn',
  'dawn':       'dawn',
  'morning':    'day',
  'midday':     'day',
  'afternoon':  'day',
  'dusk':       'dusk',
  'twilight':   'dusk',
  'night':      'night',
};

export interface SceneConditions {
  hemisphere?: Hemisphere;
  broadSeason?: BroadSeason | BroadSeason[];
  seasonId?: string | string[];
  timeOfDayGroup?: TimeOfDayGroup | TimeOfDayGroup[];
  timeOfDayId?: TimeOfDayId | TimeOfDayId[];
  weather?: WeatherId | WeatherId[];
  lunar?: LunarPhaseId | LunarPhaseId[];
}

export interface VideoSource {
  src: string;
  type: 'video/mp4' | 'video/webm';
}

export interface Scene {
  id: string;
  label: string;
  conditions: SceneConditions;
  poster: string;
  videos?: VideoSource[];
  attribution?: string;        // e.g. "Photo: Pexels / Jane Doe"
}

// Base manifest. Order matters only for tie-breaking — higher-scoring (more specific) scenes win.
// Add a new scene by appending here. No code changes needed.
export const SCENE_MANIFEST: Scene[] = [
  {
    id: 'autumn-day',
    label: 'Autumn — golden canopy',
    conditions: { broadSeason: 'autumn', timeOfDayGroup: 'day' },
    poster: '/scenes/autumn-day.jpg',
    videos: [
      { src: '/scenes/autumn-day.mp4',  type: 'video/mp4' },
      { src: '/scenes/autumn-day.webm', type: 'video/webm' },
    ],
  },
  {
    id: 'autumn-dusk',
    label: 'Autumn — low golden hour',
    conditions: { broadSeason: 'autumn', timeOfDayGroup: 'dusk' },
    poster: '/scenes/autumn-dusk.jpg',
    videos: [{ src: '/scenes/autumn-dusk.mp4', type: 'video/mp4' }],
  },
  {
    id: 'summer-day-clear',
    label: 'Summer — full sun, blue sky',
    conditions: { broadSeason: 'summer', timeOfDayGroup: 'day', weather: 'clear' },
    poster: '/scenes/summer-day-clear.jpg',
    videos: [
      { src: '/scenes/summer-day-clear.mp4',  type: 'video/mp4' },
      { src: '/scenes/summer-day-clear.webm', type: 'video/webm' },
    ],
  },
  {
    id: 'summer-day',
    label: 'Summer — warm light',
    conditions: { broadSeason: 'summer', timeOfDayGroup: 'day' },
    poster: '/scenes/summer-day.jpg',
    videos: [{ src: '/scenes/summer-day.mp4', type: 'video/mp4' }],
  },
  {
    id: 'spring-day',
    label: 'Spring — emergence',
    conditions: { broadSeason: 'spring', timeOfDayGroup: 'day' },
    poster: '/scenes/spring-day.jpg',
    videos: [{ src: '/scenes/spring-day.mp4', type: 'video/mp4' }],
  },
  {
    id: 'winter-frost-aus',
    label: 'Winter — frost, breath, low sun',
    conditions: { broadSeason: 'winter', timeOfDayGroup: 'day', hemisphere: 'south' },
    poster: '/scenes/winter-frost-aus.jpg',
    videos: [{ src: '/scenes/winter-frost-aus.mp4', type: 'video/mp4' }],
  },
  {
    id: 'winter-day',
    label: 'Winter — pale light',
    conditions: { broadSeason: 'winter', timeOfDayGroup: 'day' },
    poster: '/scenes/winter-day.jpg',
    videos: [{ src: '/scenes/winter-day.mp4', type: 'video/mp4' }],
  },
  {
    id: 'night-clear-fullmoon',
    label: 'Night — full moon, clear',
    conditions: { timeOfDayGroup: 'night', lunar: 'full' },
    poster: '/scenes/night-clear-fullmoon.jpg',
    videos: [
      { src: '/scenes/night-clear-fullmoon.mp4',  type: 'video/mp4' },
      { src: '/scenes/night-clear-fullmoon.webm', type: 'video/webm' },
    ],
  },
  {
    id: 'night-clear-dark',
    label: 'Night — deep stars',
    conditions: { timeOfDayGroup: 'night', lunar: ['new', 'waxing-crescent', 'waning-crescent'] },
    poster: '/scenes/night-clear-dark.jpg',
    videos: [{ src: '/scenes/night-clear-dark.mp4', type: 'video/mp4' }],
  },
  {
    id: 'night-cloudy',
    label: 'Night — cloud-filtered moon',
    conditions: { timeOfDayGroup: 'night', weather: ['cloudy', 'overcast'] },
    poster: '/scenes/night-cloudy.jpg',
    videos: [{ src: '/scenes/night-cloudy.mp4', type: 'video/mp4' }],
  },
  // Generic fallbacks — kept last so they only fire when nothing more specific matched.
  {
    id: 'night-generic',
    label: 'Night sky',
    conditions: { timeOfDayGroup: 'night' },
    poster: '/scenes/night-generic.jpg',
    videos: [{ src: '/scenes/night-generic.mp4', type: 'video/mp4' }],
  },
  {
    id: 'dawn-generic',
    label: 'Dawn',
    conditions: { timeOfDayGroup: 'dawn' },
    poster: '/scenes/dawn-generic.jpg',
  },
  {
    id: 'dusk-generic',
    label: 'Dusk',
    conditions: { timeOfDayGroup: 'dusk' },
    poster: '/scenes/dusk-generic.jpg',
  },
  {
    id: 'day-generic',
    label: 'Daylight',
    conditions: {},
    poster: '/scenes/day-generic.jpg',
  },
];

export function timeOfDayGroup(id: TimeOfDayId): TimeOfDayGroup {
  return TOD_GROUP[id];
}

// Score how well a scene matches the current ambient state.
// Higher = more specific. -1 = condition mismatched, scene is excluded.
function score(scene: Scene, state: AmbientState): number {
  const c = scene.conditions;
  let s = 0;

  const checkSet = <T>(want: T | T[] | undefined, have: T): -1 | 0 | 1 => {
    if (want === undefined) return 0;
    const arr = Array.isArray(want) ? want : [want];
    return arr.includes(have) ? 1 : -1;
  };

  const tg = timeOfDayGroup(state.timeOfDay.id);

  const checks = [
    checkSet(c.hemisphere,    state.hemisphere),
    checkSet(c.broadSeason,   state.season.broadSeason),
    checkSet(c.seasonId,      state.season.id),
    checkSet(c.timeOfDayGroup, tg),
    checkSet(c.timeOfDayId,   state.timeOfDay.id),
    checkSet(c.weather,       state.weather?.id ?? ('clear' as WeatherId)),
    checkSet(c.lunar,         state.lunar.id),
  ];

  for (const r of checks) {
    if (r === -1) return -1;
    s += r;
  }
  return s;
}

export function resolveScene(state: AmbientState, manifest: Scene[] = SCENE_MANIFEST): Scene {
  let best: { scene: Scene; s: number } | null = null;
  for (const scene of manifest) {
    const s = score(scene, state);
    if (s < 0) continue;
    if (!best || s > best.s) best = { scene, s };
  }
  // Manifest always ends in `day-generic` with no conditions, so this is unreachable in practice —
  // but guard anyway in case a future edit removes the catch-all.
  return best?.scene ?? manifest[manifest.length - 1];
}
