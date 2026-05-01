import type {
  BroadSeason,
  Hemisphere,
  SeasonPhase,
  SeasonPhaseId,
} from './types';

// Wheel-of-the-year anchors as (month, day) pairs in the *northern* hemisphere.
// Each phase begins on its anchor and runs until the next anchor.
const NORTH_ANCHORS: Array<{ id: SeasonPhaseId; month: number; day: number; broad: BroadSeason }> = [
  { id: 'yule',    month: 12, day: 21, broad: 'winter' },   // winter solstice
  { id: 'imbolc',  month: 2,  day: 1,  broad: 'winter' },   // first stirrings
  { id: 'ostara',  month: 3,  day: 20, broad: 'spring' },   // spring equinox
  { id: 'beltane', month: 5,  day: 1,  broad: 'spring' },   // peak spring → summer threshold
  { id: 'litha',   month: 6,  day: 21, broad: 'summer' },   // summer solstice
  { id: 'lammas',  month: 8,  day: 1,  broad: 'summer' },   // first harvest
  { id: 'mabon',   month: 9,  day: 22, broad: 'autumn' },   // autumn equinox
  { id: 'samhain', month: 11, day: 1,  broad: 'autumn' },   // threshold to winter
];

// Southern hemisphere: same phase ids, anchors offset by ~6 months (and broadSeason flips).
const SOUTH_ANCHORS: Array<{ id: SeasonPhaseId; month: number; day: number; broad: BroadSeason }> = [
  { id: 'litha',   month: 12, day: 21, broad: 'summer' },
  { id: 'lammas',  month: 2,  day: 1,  broad: 'summer' },
  { id: 'mabon',   month: 3,  day: 20, broad: 'autumn' },
  { id: 'samhain', month: 5,  day: 1,  broad: 'autumn' },
  { id: 'yule',    month: 6,  day: 21, broad: 'winter' },
  { id: 'imbolc',  month: 8,  day: 1,  broad: 'winter' },
  { id: 'ostara',  month: 9,  day: 22, broad: 'spring' },
  { id: 'beltane', month: 11, day: 1,  broad: 'spring' },
];

const LABELS: Record<SeasonPhaseId, string> = {
  imbolc:  'Imbolc — first stirrings',
  ostara:  'Ostara — spring equinox',
  beltane: 'Beltane — peak spring',
  litha:   'Litha — summer solstice',
  lammas:  'Lammas — first harvest',
  mabon:   'Mabon — autumn equinox',
  samhain: 'Samhain — the threshold',
  yule:    'Yule — winter solstice',
};

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start;
  return Math.floor(ms / 86_400_000);
}

function anchorDayOfYear(year: number, month: number, day: number): number {
  return dayOfYear(new Date(Date.UTC(year, month - 1, day)));
}

export function getSeasonPhase(date: Date, hemisphere: Hemisphere): SeasonPhase {
  const anchors = hemisphere === 'south' ? SOUTH_ANCHORS : NORTH_ANCHORS;
  const year = date.getUTCFullYear();
  const today = dayOfYear(date);

  // Build sorted anchor day-of-year values for THIS year (with previous-year carry for the phase that wraps).
  const sorted = anchors
    .map((a) => ({ ...a, doy: anchorDayOfYear(year, a.month, a.day) }))
    .sort((a, b) => a.doy - b.doy);

  // Find the most recent anchor on or before today; if today is before the earliest anchor, we're
  // still in the previous wheel's last phase and the next anchor is sorted[0] of this year.
  let current = sorted[sorted.length - 1];
  let nextStart = sorted[0].doy;
  for (let i = 0; i < sorted.length; i += 1) {
    if (today >= sorted[i].doy) {
      current = sorted[i];
      const next = sorted[(i + 1) % sorted.length];
      nextStart = i === sorted.length - 1
        ? next.doy + (isLeap(year) ? 366 : 365)
        : next.doy;
    }
  }

  const startDoy =
    today >= current.doy ? current.doy : current.doy - (isLeap(year - 1) ? 366 : 365);
  const daysInto = today - startDoy;
  const daysRemaining = nextStart - today;

  return {
    id: current.id,
    label: LABELS[current.id],
    broadSeason: current.broad,
    daysInto,
    daysRemaining,
  };
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
