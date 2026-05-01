// Ambient layer — types shared across season, sun, lunar, weather, scenes.

export type Hemisphere = 'north' | 'south';

export type BroadSeason = 'spring' | 'summer' | 'autumn' | 'winter';

// Cross-quarter calendar — eight phases of the year, each ~6 weeks.
// Ids are wheel-of-the-year names; same ids in both hemispheres but flipped six months apart.
export type SeasonPhaseId =
  | 'imbolc'
  | 'ostara'
  | 'beltane'
  | 'litha'
  | 'lammas'
  | 'mabon'
  | 'samhain'
  | 'yule';

export interface SeasonPhase {
  id: SeasonPhaseId;
  label: string;          // e.g. "Samhain rising"
  broadSeason: BroadSeason;
  daysInto: number;       // 0..~46
  daysRemaining: number;
}

export type TimeOfDayId =
  | 'deep-night'
  | 'pre-dawn'
  | 'dawn'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'dusk'
  | 'twilight'
  | 'night';

export interface TimeOfDay {
  id: TimeOfDayId;
  label: string;
  hour: number;
}

export type LunarPhaseId =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface LunarPhase {
  id: LunarPhaseId;
  label: string;
  illumination: number;   // 0..1
  age: number;            // days since new moon
}

export type WeatherId =
  | 'clear'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog';

export interface Weather {
  id: WeatherId;
  label: string;
  tempC: number;
  source: 'open-meteo' | 'fallback';
}

export interface AmbientState {
  hemisphere: Hemisphere;
  season: SeasonPhase;
  timeOfDay: TimeOfDay;
  lunar: LunarPhase;
  weather: Weather | null;          // null when no location
  location: { name: string; lat: number; lng: number } | null;
  generatedAt: string;              // ISO
}
