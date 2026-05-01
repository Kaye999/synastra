import type { TimeOfDay, TimeOfDayId } from './types';

const LABELS: Record<TimeOfDayId, string> = {
  'deep-night': 'Deep night',
  'pre-dawn':   'Pre-dawn',
  'dawn':       'Dawn',
  'morning':    'Morning',
  'midday':     'Midday',
  'afternoon':  'Afternoon',
  'dusk':       'Dusk',
  'twilight':   'Twilight',
  'night':      'Night',
};

// Without latitude we use a simple hour-based map. With latitude we can refine using a
// sunrise/sunset calculation (NOAA solar position) — kept self-contained, no external deps.
//
// Hour-based bands are local-clock approximations. They're fine when location is not given;
// if location is provided, sunPhaseFromAngle() picks bands from the actual solar altitude.

export function getTimeOfDayFromClock(date: Date): TimeOfDay {
  const hour = date.getHours() + date.getMinutes() / 60;
  let id: TimeOfDayId = 'deep-night';

  if (hour < 4)        id = 'deep-night';
  else if (hour < 5.5) id = 'pre-dawn';
  else if (hour < 7)   id = 'dawn';
  else if (hour < 11)  id = 'morning';
  else if (hour < 13)  id = 'midday';
  else if (hour < 16)  id = 'afternoon';
  else if (hour < 18)  id = 'dusk';
  else if (hour < 20)  id = 'twilight';
  else if (hour < 23)  id = 'night';
  else                 id = 'deep-night';

  return { id, label: LABELS[id], hour };
}

// Solar position — NOAA approximation. Returns altitude in degrees.
function solarAltitude(date: Date, lat: number, lng: number): number {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const ms = date.getTime() - start;
  const dayOfYear = ms / 86_400_000;

  // Solar declination (radians)
  const decl = 23.44 * rad * Math.sin(((360 / 365) * (dayOfYear - 81)) * rad);
  // Equation of time (minutes)
  const b = ((360 / 365) * (dayOfYear - 81)) * rad;
  const eqTime = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  // Solar time
  const tzOffsetMin = -date.getTimezoneOffset();
  const solarMin = date.getUTCHours() * 60 + date.getUTCMinutes() + 4 * lng + eqTime;
  const hourAngleDeg = (solarMin / 4) - 180;
  const hourAngle = hourAngleDeg * rad;
  const latRad = lat * rad;
  const sinAlt =
    Math.sin(latRad) * Math.sin(decl) +
    Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
  return Math.asin(sinAlt) / rad;
  void tzOffsetMin;
}

export function getTimeOfDay(date: Date, lat?: number, lng?: number): TimeOfDay {
  if (lat === undefined || lng === undefined) {
    return getTimeOfDayFromClock(date);
  }

  const altitude = solarAltitude(date, lat, lng);
  const hour = date.getHours() + date.getMinutes() / 60;
  let id: TimeOfDayId;

  // Use altitude bands; rising vs setting determined by clock hour.
  if (altitude > 50)        id = 'midday';
  else if (altitude > 15)   id = hour < 12 ? 'morning' : 'afternoon';
  else if (altitude > 0)    id = hour < 12 ? 'dawn' : 'dusk';
  else if (altitude > -6)   id = hour < 12 ? 'pre-dawn' : 'twilight';
  else if (altitude > -12)  id = hour < 12 ? 'pre-dawn' : 'night';
  else                      id = (hour < 4 || hour >= 23) ? 'deep-night' : 'night';

  return { id, label: LABELS[id], hour };
}
