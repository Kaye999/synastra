// Ported from astrology-transits.jsx — 150-city gazetteer for birth-place → coords/tz resolution.
// Lowercase keys; lookups are case-insensitive via resolveCityCoords below.

import type { CityCoords } from '../types';

export const CITY_COORDS: Record<string, CityCoords> = {
  // ── Australia / NZ ───────────────────────────────────────────────
  "sydney":         { lat:-33.87, lon:151.21, tzOffset:10 },
  "melbourne":      { lat:-37.81, lon:144.96, tzOffset:10 },
  "brisbane":       { lat:-27.47, lon:153.03, tzOffset:10 },
  "perth":          { lat:-31.95, lon:115.86, tzOffset:8  },
  "adelaide":       { lat:-34.93, lon:138.60, tzOffset:9.5 },
  "canberra":       { lat:-35.28, lon:149.13, tzOffset:10 },
  "hobart":         { lat:-42.88, lon:147.33, tzOffset:10 },
  "darwin":         { lat:-12.46, lon:130.85, tzOffset:9.5 },
  "gold coast":     { lat:-28.02, lon:153.40, tzOffset:10 },
  "newcastle":      { lat:-32.93, lon:151.78, tzOffset:10 },
  "auckland":       { lat:-36.85, lon:174.76, tzOffset:12 },
  "wellington":     { lat:-41.29, lon:174.78, tzOffset:12 },
  "christchurch":   { lat:-43.53, lon:172.64, tzOffset:12 },

  // ── UK / Ireland ─────────────────────────────────────────────────
  "london":         { lat:51.51,  lon:-0.13,  tzOffset:0  },
  "edinburgh":      { lat:55.95,  lon:-3.19,  tzOffset:0  },
  "glasgow":        { lat:55.86,  lon:-4.25,  tzOffset:0  },
  "manchester":     { lat:53.48,  lon:-2.24,  tzOffset:0  },
  "birmingham":     { lat:52.49,  lon:-1.90,  tzOffset:0  },
  "liverpool":      { lat:53.41,  lon:-2.99,  tzOffset:0  },
  "cardiff":        { lat:51.48,  lon:-3.18,  tzOffset:0  },
  "belfast":        { lat:54.60,  lon:-5.93,  tzOffset:0  },
  "bristol":        { lat:51.45,  lon:-2.58,  tzOffset:0  },
  "leeds":          { lat:53.80,  lon:-1.55,  tzOffset:0  },
  "oxford":         { lat:51.75,  lon:-1.26,  tzOffset:0  },
  "cambridge":      { lat:52.20,  lon:0.12,   tzOffset:0  },
  "dublin":         { lat:53.35,  lon:-6.26,  tzOffset:0  },

  // ── Europe ───────────────────────────────────────────────────────
  "paris":          { lat:48.86,  lon:2.35,   tzOffset:1  },
  "berlin":         { lat:52.52,  lon:13.40,  tzOffset:1  },
  "madrid":         { lat:40.42,  lon:-3.70,  tzOffset:1  },
  "barcelona":      { lat:41.39,  lon:2.17,   tzOffset:1  },
  "rome":           { lat:41.90,  lon:12.50,  tzOffset:1  },
  "milan":          { lat:45.46,  lon:9.19,   tzOffset:1  },
  "amsterdam":      { lat:52.37,  lon:4.90,   tzOffset:1  },
  "brussels":       { lat:50.85,  lon:4.35,   tzOffset:1  },
  "lisbon":         { lat:38.72,  lon:-9.14,  tzOffset:0  },
  "stockholm":      { lat:59.33,  lon:18.07,  tzOffset:1  },
  "helsinki":       { lat:60.17,  lon:24.94,  tzOffset:2  },
  "oslo":           { lat:59.91,  lon:10.75,  tzOffset:1  },
  "copenhagen":     { lat:55.68,  lon:12.57,  tzOffset:1  },
  "reykjavik":      { lat:64.15,  lon:-21.94, tzOffset:0  },
  "warsaw":         { lat:52.23,  lon:21.01,  tzOffset:1  },
  "prague":         { lat:50.08,  lon:14.44,  tzOffset:1  },
  "vienna":         { lat:48.21,  lon:16.37,  tzOffset:1  },
  "budapest":       { lat:47.50,  lon:19.04,  tzOffset:1  },
  "zurich":         { lat:47.38,  lon:8.54,   tzOffset:1  },
  "geneva":         { lat:46.20,  lon:6.14,   tzOffset:1  },
  "athens":         { lat:37.98,  lon:23.73,  tzOffset:2  },
  "moscow":         { lat:55.76,  lon:37.62,  tzOffset:3  },
  "saint petersburg":{lat:59.93,  lon:30.34,  tzOffset:3  },
  "kyiv":           { lat:50.45,  lon:30.52,  tzOffset:2  },
  "bucharest":      { lat:44.43,  lon:26.10,  tzOffset:2  },
  "sofia":          { lat:42.70,  lon:23.32,  tzOffset:2  },
  "belgrade":       { lat:44.7866, lon:20.4489, tzOffset:1, tzId:'Europe/Belgrade' },

  // ── North America ────────────────────────────────────────────────
  "new york":       { lat:40.71,  lon:-74.01, tzOffset:-5 },
  "los angeles":    { lat:34.05,  lon:-118.24,tzOffset:-8 },
  "chicago":        { lat:41.88,  lon:-87.63, tzOffset:-6 },
  "san francisco":  { lat:37.77,  lon:-122.42,tzOffset:-8 },
  "seattle":        { lat:47.61,  lon:-122.33,tzOffset:-8 },
  "boston":         { lat:42.36,  lon:-71.06, tzOffset:-5 },
  "miami":          { lat:25.77,  lon:-80.19, tzOffset:-5 },
  "washington":     { lat:38.90,  lon:-77.04, tzOffset:-5 },
  "washington dc":  { lat:38.90,  lon:-77.04, tzOffset:-5 },
  "atlanta":        { lat:33.75,  lon:-84.39, tzOffset:-5 },
  "houston":        { lat:29.76,  lon:-95.37, tzOffset:-6 },
  "dallas":         { lat:32.78,  lon:-96.80, tzOffset:-6 },
  "phoenix":        { lat:33.45,  lon:-112.07,tzOffset:-7 },
  "denver":         { lat:39.74,  lon:-104.99,tzOffset:-7 },
  "las vegas":      { lat:36.17,  lon:-115.14,tzOffset:-8 },
  "philadelphia":   { lat:39.95,  lon:-75.17, tzOffset:-5 },
  "detroit":        { lat:42.33,  lon:-83.05, tzOffset:-5 },
  "minneapolis":    { lat:44.98,  lon:-93.27, tzOffset:-6 },
  "hartford":       { lat:41.7637, lon:-72.6851, tzOffset:-5, tzId:'America/New_York' },
  "cleveland":      { lat:41.4993, lon:-81.6944, tzOffset:-5, tzId:'America/New_York' },
  "pittsburgh":     { lat:40.4406, lon:-79.9959, tzOffset:-5, tzId:'America/New_York' },
  "portland":       { lat:45.5152, lon:-122.6784, tzOffset:-8, tzId:'America/Los_Angeles' },
  "nashville":      { lat:36.1627, lon:-86.7816, tzOffset:-6, tzId:'America/Chicago' },
  "austin":         { lat:30.2672, lon:-97.7431, tzOffset:-6, tzId:'America/Chicago' },
  "salt lake city": { lat:40.7608, lon:-111.8910, tzOffset:-7, tzId:'America/Denver' },
  "toronto":        { lat:43.65,  lon:-79.38, tzOffset:-5 },
  "vancouver":      { lat:49.28,  lon:-123.12,tzOffset:-8 },
  "montreal":       { lat:45.50,  lon:-73.57, tzOffset:-5 },
  "calgary":        { lat:51.05,  lon:-114.07,tzOffset:-7 },
  "ottawa":         { lat:45.42,  lon:-75.70, tzOffset:-5 },
  "mexico city":    { lat:19.43,  lon:-99.13, tzOffset:-6 },
  "guadalajara":    { lat:20.67,  lon:-103.35,tzOffset:-6 },
  "honolulu":       { lat:21.31,  lon:-157.86,tzOffset:-10},

  // ── South America ────────────────────────────────────────────────
  "sao paulo":      { lat:-23.55, lon:-46.63, tzOffset:-3 },
  "são paulo":      { lat:-23.55, lon:-46.63, tzOffset:-3 },
  "rio de janeiro": { lat:-22.91, lon:-43.17, tzOffset:-3 },
  "buenos aires":   { lat:-34.61, lon:-58.38, tzOffset:-3 },
  "santiago":       { lat:-33.45, lon:-70.67, tzOffset:-4 },
  "lima":           { lat:-12.05, lon:-77.04, tzOffset:-5 },
  "bogota":         { lat:4.71,   lon:-74.07, tzOffset:-5 },
  "bogotá":         { lat:4.7110, lon:-74.0721, tzOffset:-5, tzId:'America/Bogota' },
  "caracas":        { lat:10.48,  lon:-66.90, tzOffset:-4 },
  "quito":          { lat:-0.18,  lon:-78.47, tzOffset:-5 },
  "asuncion":       { lat:-25.2637, lon:-57.5759, tzOffset:-4, tzId:'America/Asuncion' },
  "asunción":       { lat:-25.2637, lon:-57.5759, tzOffset:-4, tzId:'America/Asuncion' },
  "montevideo":     { lat:-34.90, lon:-56.16, tzOffset:-3 },
  "la paz":         { lat:-16.50, lon:-68.12, tzOffset:-4 },

  // ── Asia ─────────────────────────────────────────────────────────
  "tokyo":          { lat:35.68,  lon:139.76, tzOffset:9  },
  "osaka":          { lat:34.69,  lon:135.50, tzOffset:9  },
  "kyoto":          { lat:35.01,  lon:135.77, tzOffset:9  },
  "seoul":          { lat:37.57,  lon:126.98, tzOffset:9  },
  "busan":          { lat:35.18,  lon:129.08, tzOffset:9  },
  "shanghai":       { lat:31.23,  lon:121.47, tzOffset:8  },
  "beijing":        { lat:39.90,  lon:116.41, tzOffset:8  },
  "guangzhou":      { lat:23.13,  lon:113.26, tzOffset:8  },
  "shenzhen":       { lat:22.54,  lon:114.06, tzOffset:8  },
  "hong kong":      { lat:22.32,  lon:114.17, tzOffset:8  },
  "taipei":         { lat:25.03,  lon:121.57, tzOffset:8  },
  "singapore":      { lat:1.35,   lon:103.82, tzOffset:8  },
  "kuala lumpur":   { lat:3.14,   lon:101.69, tzOffset:8  },
  "bangkok":        { lat:13.76,  lon:100.50, tzOffset:7  },
  "jakarta":        { lat:-6.21,  lon:106.85, tzOffset:7  },
  "manila":         { lat:14.60,  lon:120.98, tzOffset:8  },
  "hanoi":          { lat:21.03,  lon:105.85, tzOffset:7  },
  "ho chi minh city":{lat:10.82,  lon:106.63, tzOffset:7  },
  "phnom penh":     { lat:11.56,  lon:104.92, tzOffset:7  },
  "yangon":         { lat:16.87,  lon:96.20,  tzOffset:6.5 },
  "colombo":        { lat:6.93,   lon:79.86,  tzOffset:5.5 },
  "kathmandu":      { lat:27.72,  lon:85.32,  tzOffset:5.75},
  "dhaka":          { lat:23.81,  lon:90.41,  tzOffset:6  },

  // ── India / Pakistan ─────────────────────────────────────────────
  "mumbai":         { lat:19.08,  lon:72.88,  tzOffset:5.5 },
  "delhi":          { lat:28.61,  lon:77.21,  tzOffset:5.5 },
  "new delhi":      { lat:28.61,  lon:77.21,  tzOffset:5.5 },
  "bangalore":      { lat:12.97,  lon:77.59,  tzOffset:5.5 },
  "bengaluru":      { lat:12.97,  lon:77.59,  tzOffset:5.5 },
  "chennai":        { lat:13.08,  lon:80.27,  tzOffset:5.5 },
  "kolkata":        { lat:22.57,  lon:88.36,  tzOffset:5.5 },
  "hyderabad":      { lat:17.38,  lon:78.49,  tzOffset:5.5 },
  "pune":           { lat:18.52,  lon:73.86,  tzOffset:5.5 },
  "ahmedabad":      { lat:23.02,  lon:72.57,  tzOffset:5.5 },
  "jaipur":         { lat:26.92,  lon:75.79,  tzOffset:5.5 },
  "karachi":        { lat:24.86,  lon:67.01,  tzOffset:5  },
  "lahore":         { lat:31.55,  lon:74.34,  tzOffset:5  },
  "islamabad":      { lat:33.68,  lon:73.05,  tzOffset:5  },

  // ── Middle East ──────────────────────────────────────────────────
  "dubai":          { lat:25.20,  lon:55.27,  tzOffset:4  },
  "abu dhabi":      { lat:24.47,  lon:54.37,  tzOffset:4  },
  "doha":           { lat:25.29,  lon:51.53,  tzOffset:3  },
  "riyadh":         { lat:24.71,  lon:46.68,  tzOffset:3  },
  "jeddah":         { lat:21.49,  lon:39.19,  tzOffset:3  },
  "kuwait city":    { lat:29.38,  lon:47.99,  tzOffset:3  },
  "muscat":         { lat:23.59,  lon:58.41,  tzOffset:4  },
  "tehran":         { lat:35.69,  lon:51.39,  tzOffset:3.5 },
  "istanbul":       { lat:41.01,  lon:28.98,  tzOffset:3  },
  "ankara":         { lat:39.93,  lon:32.86,  tzOffset:3  },
  "tel aviv":       { lat:32.08,  lon:34.78,  tzOffset:2  },
  "jerusalem":      { lat:31.77,  lon:35.23,  tzOffset:2  },
  "amman":          { lat:31.95,  lon:35.93,  tzOffset:2  },
  "beirut":         { lat:33.89,  lon:35.50,  tzOffset:2  },
  "baghdad":        { lat:33.31,  lon:44.37,  tzOffset:3  },

  // ── Africa ───────────────────────────────────────────────────────
  "cairo":          { lat:30.04,  lon:31.24,  tzOffset:2  },
  "alexandria":     { lat:31.20,  lon:29.92,  tzOffset:2  },
  "lagos":          { lat:6.52,   lon:3.38,   tzOffset:1  },
  "abuja":          { lat:9.07,   lon:7.49,   tzOffset:1  },
  "nairobi":        { lat:-1.29,  lon:36.82,  tzOffset:3  },
  "addis ababa":    { lat:9.03,   lon:38.74,  tzOffset:3  },
  "cape town":      { lat:-33.92, lon:18.42,  tzOffset:2  },
  "johannesburg":   { lat:-26.20, lon:28.05,  tzOffset:2  },
  "durban":         { lat:-29.86, lon:31.02,  tzOffset:2  },
  "casablanca":     { lat:33.57,  lon:-7.59,  tzOffset:1  },
  "marrakech":      { lat:31.63,  lon:-7.99,  tzOffset:1  },
  "tunis":          { lat:36.81,  lon:10.18,  tzOffset:1  },
  "algiers":        { lat:36.7538, lon:3.0588, tzOffset:1, tzId:'Africa/Algiers' },
  "accra":          { lat:5.56,   lon:-0.20,  tzOffset:0  },
  "dakar":          { lat:14.72,  lon:-17.47, tzOffset:0  },
};

// Case-insensitive lookup. Accepts plain "Sydney", "Sydney, Australia",
// "sydney, au", etc. Returns CityCoords or null.
export function resolveCityCoords(cityString: string | null | undefined): CityCoords | null {
  if (!cityString) return null;
  const raw = String(cityString).trim().toLowerCase();
  if (!raw) return null;
  if (CITY_COORDS[raw]) return CITY_COORDS[raw];
  const firstTok = raw.split(',')[0].trim();
  if (firstTok && CITY_COORDS[firstTok]) return CITY_COORDS[firstTok];
  const stripped = raw.replace(/[^\w\s]/g, '').trim();
  if (CITY_COORDS[stripped]) return CITY_COORDS[stripped];
  const strippedFirst = stripped.split(/\s{2,}|,/)[0].trim();
  if (CITY_COORDS[strippedFirst]) return CITY_COORDS[strippedFirst];
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[synastra] resolveCityCoords: no match for', cityString, '— falling back to Sydney.');
  }
  return null;
}
