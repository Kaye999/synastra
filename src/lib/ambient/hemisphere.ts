import type { Hemisphere } from './types';

// Southern-hemisphere IANA prefixes / known zones.
// Anything not matched falls back to 'north'.
const SOUTH_PREFIXES = [
  'Australia/',
  'Pacific/Auckland',
  'Pacific/Chatham',
  'Pacific/Fiji',
  'Pacific/Norfolk',
  'Pacific/Noumea',
  'Pacific/Port_Moresby',
  'Pacific/Tahiti',
  'Pacific/Apia',
  'Pacific/Easter',
  'Antarctica/',
  'Africa/Johannesburg',
  'Africa/Cape_Town',
  'Africa/Maputo',
  'Africa/Windhoek',
  'Africa/Harare',
  'Africa/Lusaka',
  'Africa/Maseru',
  'Africa/Mbabane',
  'America/Argentina/',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/La_Paz',
  'America/Asuncion',
  'America/Lima',
  'America/Montevideo',
  'America/Punta_Arenas',
  'America/Recife',
  'America/Fortaleza',
  'America/Bahia',
  'Indian/Mauritius',
  'Indian/Reunion',
  'Indian/Antananarivo',
];

export function hemisphereFromTimezone(tz: string): Hemisphere {
  if (!tz) return 'north';
  if (SOUTH_PREFIXES.some((p) => tz.startsWith(p) || tz === p.replace(/\/$/, ''))) {
    return 'south';
  }
  return 'north';
}

export function hemisphereFromLatitude(lat: number): Hemisphere {
  return lat < 0 ? 'south' : 'north';
}

export function detectHemisphere(opts?: { lat?: number }): Hemisphere {
  if (opts?.lat !== undefined) return hemisphereFromLatitude(opts.lat);
  if (typeof Intl !== 'undefined') {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return hemisphereFromTimezone(tz);
  }
  return 'north';
}
