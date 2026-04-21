// Shared types used across engines and UI.

export type Gender = 'male' | 'female';

export type BirthData = {
  dob: { y: number; m: number; d: number };
  time: { h: number; m: number };
  timeUnknown: boolean;
  city: string;
  gender: Gender;
  fullName: string;
  name: string;
};

// Extended input shape consumed by the astro engine.
// Coords + tz resolved from the city via resolveCityCoords.
export type AstroInput = {
  dob: { y: number; m: number; d: number };
  time: { h: number; m: number };
  timeUnknown: boolean;
  lat: number;
  lon: number;
  tzOffset: number;
};

export type Planet = {
  planet: string;
  sign: string;
  deg: number;
  house: number | null;
  longitude: number;
};

export type Angle = {
  sign: string;
  deg: number;
  longitude: number;
};

export type Chart = {
  planets: Planet[];
  ascendant: Angle | null;
  mc: Angle | null;
  houses: Record<number, string> | null;
};

export type Nakshatra = {
  name: string;
  pada: number;
  lord: string;
  deg: number;
};

export type SiderealChart = Chart & {
  rahu?: Planet;
  ketu?: Planet;
  nakshatra?: Nakshatra;
};

export type DashaPeriod = {
  lord: string;
  start: Date;
  end: Date;
  years: number;
};

export type Mahadasha = {
  currentLord: string;
  nextLord: string;
  currentStart: Date;
  currentEnd: Date;
  allDashas: DashaPeriod[];
};

export type Tier = 'free' | 'reader' | 'depth';

export type CityCoords = {
  lat: number;
  lon: number;
  tzOffset: number;
};
