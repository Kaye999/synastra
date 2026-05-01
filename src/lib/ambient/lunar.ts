import * as Astronomy from 'astronomy-engine';
import type { LunarPhase, LunarPhaseId } from './types';

const LABELS: Record<LunarPhaseId, string> = {
  'new':              'New moon',
  'waxing-crescent':  'Waxing crescent',
  'first-quarter':    'First quarter',
  'waxing-gibbous':   'Waxing gibbous',
  'full':             'Full moon',
  'waning-gibbous':   'Waning gibbous',
  'last-quarter':     'Last quarter',
  'waning-crescent':  'Waning crescent',
};

const SYNODIC_DAYS = 29.530588853;

export function getLunarPhase(date: Date): LunarPhase {
  // Phase angle: 0 = new, 90 = first quarter, 180 = full, 270 = last quarter
  const angle = Astronomy.MoonPhase(date);
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;

  let id: LunarPhaseId;
  if      (angle < 22.5)   id = 'new';
  else if (angle < 67.5)   id = 'waxing-crescent';
  else if (angle < 112.5)  id = 'first-quarter';
  else if (angle < 157.5)  id = 'waxing-gibbous';
  else if (angle < 202.5)  id = 'full';
  else if (angle < 247.5)  id = 'waning-gibbous';
  else if (angle < 292.5)  id = 'last-quarter';
  else if (angle < 337.5)  id = 'waning-crescent';
  else                     id = 'new';

  const age = (angle / 360) * SYNODIC_DAYS;

  return { id, label: LABELS[id], illumination, age };
}
