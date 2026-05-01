import { detectHemisphere, hemisphereFromLatitude } from './hemisphere';
import { getLunarPhase } from './lunar';
import { getSeasonPhase } from './season';
import { getTimeOfDay } from './sun';
import type { AmbientState, Weather } from './types';

export interface BuildAmbientStateInput {
  date?: Date;
  location?: { name: string; lat: number; lng: number } | null;
  weather?: Weather | null;
}

export function buildAmbientState(input: BuildAmbientStateInput = {}): AmbientState {
  const date = input.date ?? new Date();
  const location = input.location ?? null;
  const hemisphere = location
    ? hemisphereFromLatitude(location.lat)
    : detectHemisphere();
  const season = getSeasonPhase(date, hemisphere);
  const timeOfDay = getTimeOfDay(date, location?.lat, location?.lng);
  const lunar = getLunarPhase(date);

  return {
    hemisphere,
    season,
    timeOfDay,
    lunar,
    weather: input.weather ?? null,
    location,
    generatedAt: date.toISOString(),
  };
}
