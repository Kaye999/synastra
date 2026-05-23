"use client";

// AstrocartoMap — interactive world map showing the user's planetary lines.
//
// Renders four line types per planet on an equirectangular projection:
//   - MC (Meridian Coelum)   : longitude where the planet is at upper culmination
//   - IC (Imum Coeli)        : opposite meridian (lower culmination), dashed
//   - AC (Ascendant / rising): curved locus where the planet is on the eastern horizon
//   - DC (Descendant/setting): curved locus where the planet is on the western horizon
//
// Math:
//   ε  = 23.4393° (obliquity)
//   α  = atan2(sin λ cos ε, cos λ)            (right ascension)
//   δ  = asin(sin λ sin ε)                    (declination)
//   MC longitude (world-geo)  = α − GMST      (mod 360, shifted to -180..180)
//   IC longitude              = MC + 180
//   For AC/DC: at geographic latitude φ, the hour angle H at the horizon is
//       cos H = −tan φ · tan δ
//   The meridian of the AC at a given latitude is then LST = α ± H,
//   and world longitude = LST − GMST (mod 360).
//   AC = α − H ; DC = α + H (H in the range [0, π], undefined above ±|90°−δ|).
//
// Pan / zoom are local state; we never rerender the continent polygons.
//
// Line stroke-dashoffset reveal staggers by planetary speed (Moon → Pluto).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart } from '@/lib/types';
import { WORLD_COUNTRIES } from '@/lib/world-countries';
import { WORLD_COUNTRIES as WORLD_COUNTRIES_FLAT } from '@/lib/world-countries-flat';

// ─── View modes ─────────────────────────────────────────────────────────────
//
// Two ways to see the same astrocartography data:
//
//   classic  — equirectangular, lon → x, lat → y, 1440×720.
//   flat     — azimuthal-equidistant centred on the North Pole, 900×900.
//              South Pole spreads around the outer rim. Meridians become
//              radial spokes; horizon curves bend gracefully around the disc.
//
// All path-builders take the active view as a parameter; the underlying math
// is identical, only the screen-space projection changes.

type ViewMode = 'classic' | 'flat';

const VIEW_STORAGE_KEY = 'synastra:astrocarto-view';

// ─── Props ──────────────────────────────────────────────────────────────────

export type AstrocartoMapProps = {
  chart: Chart;
  birthLocation?: { lat: number; lon: number };
  onLineClick?: (planet: string, lineType: 'MC' | 'IC' | 'AC' | 'DC') => void;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const MAP_W = 1440;
const MAP_H = 720;

// Flat-earth (azimuthal-equidistant) viewBox.
const FLAT_SIZE = 900;
const FLAT_CX = FLAT_SIZE / 2;
const FLAT_CY = FLAT_SIZE / 2;
const FLAT_R_FULL = 360; // pixel radius assigned to the South Pole (90°S).
// FLAT_R_EQ ≈ 180; rim of the disc lies at FLAT_R_FULL.

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const OBLIQUITY = 23.4393 * DEG;

// ─── Projection ─────────────────────────────────────────────────────────────
//
// Equirectangular (classic): straightforward lon→x, lat→y.
// Azimuthal-equidistant (flat): polar coords centred on the North Pole.
//   ρ = (90 - lat) × (R_FULL / 90)
//   θ = lon · DEG
//   x = CX + ρ sin θ
//   y = CY - ρ cos θ          (cos θ is negated so north = up, +lon = east)
//
// project() is the single source of truth — every callsite goes through it.

function lonToX(lon: number): number {
  // normalise to -180..180
  let l = lon;
  while (l > 180) l -= 360;
  while (l < -180) l += 360;
  return ((l + 180) / 360) * MAP_W;
}
function latToY(lat: number): number {
  return ((90 - lat) / 180) * MAP_H;
}

function project(lon: number, lat: number, view: ViewMode): [number, number] {
  if (view === 'classic') {
    return [lonToX(lon), latToY(lat)];
  }
  // azimuthal-equidistant from North Pole
  const rho = (90 - lat) * (FLAT_R_FULL / 90);
  const theta = lon * DEG;
  return [FLAT_CX + rho * Math.sin(theta), FLAT_CY - rho * Math.cos(theta)];
}

// View metadata for downstream layout decisions.
function viewDims(view: ViewMode): { w: number; h: number } {
  return view === 'classic' ? { w: MAP_W, h: MAP_H } : { w: FLAT_SIZE, h: FLAT_SIZE };
}

function normalise360(d: number): number {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}
function normalise180(d: number): number {
  let x = normalise360(d);
  if (x > 180) x -= 360;
  return x;
}

// GMST (sidereal time at Greenwich, degrees) for a given Date.
// Uses a simple formula (Meeus ch.12) accurate enough for line plotting.
function gmstDeg(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return normalise360(gmst);
}

// ─── Planet palette ─────────────────────────────────────────────────────────

type PlanetStyle = { color: string; order: number; glyph: string };

const PLANET_STYLE: Record<string, PlanetStyle> = {
  Sun: { color: '#C8A052', order: 4, glyph: '☉' },
  Moon: { color: '#E6DCCB', order: 0, glyph: '☽' },
  Mercury: { color: '#A8B4C4', order: 1, glyph: '☿' },
  Venus: { color: '#CE8878', order: 2, glyph: '♀' },
  Mars: { color: '#A84B3E', order: 3, glyph: '♂' },
  Jupiter: { color: '#D4956B', order: 5, glyph: '♃' },
  Saturn: { color: '#8E7A5A', order: 6, glyph: '♄' },
  Uranus: { color: '#7FA8B0', order: 7, glyph: '♅' },
  Neptune: { color: '#6D7FA8', order: 8, glyph: '♆' },
  Pluto: { color: '#7A5A8E', order: 9, glyph: '♇' },
};

const LINE_THEMES: Record<
  string,
  { MC: string; IC: string; AC: string; DC: string }
> = {
  Sun: {
    MC: 'identity where you are seen',
    IC: 'identity where you are rooted',
    AC: 'identity rising, visible from within',
    DC: 'identity mirrored in partnership',
  },
  Moon: {
    MC: 'public feeling, remembered',
    IC: 'home, inner tides',
    AC: 'emotion worn outward',
    DC: 'you are felt by the other',
  },
  Mercury: {
    MC: 'where your voice carries',
    IC: 'private thought, quiet study',
    AC: 'quick-witted, local',
    DC: 'found in conversation with others',
  },
  Venus: {
    MC: 'beauty and favour in public',
    IC: 'domestic tenderness',
    AC: 'graceful and sought after',
    DC: 'magnetic to partners',
  },
  Mars: {
    MC: 'reputation built by effort',
    IC: 'private drive, simmering',
    AC: 'combustive, forward motion',
    DC: 'attractive conflict, rivals',
  },
  Jupiter: {
    MC: 'abundance where you are seen',
    IC: 'inner faith, generous roots',
    AC: 'expansive, lucky',
    DC: 'mentors, wealthy partners',
  },
  Saturn: {
    MC: 'duty, long work, respect',
    IC: 'inherited weight, discipline',
    AC: 'sober, formed by time',
    DC: 'older partners, tested bonds',
  },
  Uranus: {
    MC: 'sudden recognition, disruption',
    IC: 'an awakening at home',
    AC: 'magnetic eccentric',
    DC: 'electric strangers',
  },
  Neptune: {
    MC: 'dreamed-of, half-seen',
    IC: 'dissolving roots, sanctuary',
    AC: 'iridescent, veiled',
    DC: 'fated blurred partnerships',
  },
  Pluto: {
    MC: 'power and its cost',
    IC: 'buried wealth, deep taproot',
    AC: 'intense, transformative',
    DC: 'obsessive, fated binds',
  },
};

// ─── Line-type guide — what each of the four lines means ────────────────────

const LINE_GUIDE = [
  {
    code: 'MC',
    area: 'Career & calling',
    line: 'solid vertical',
    meaning: 'where you are seen and what you become known for',
  },
  {
    code: 'IC',
    area: 'Home & roots',
    line: 'dashed vertical',
    meaning: 'family, belonging and the private self',
  },
  {
    code: 'AC',
    area: 'Self & vitality',
    line: 'solid curve',
    meaning: 'how you come across and feel in your body',
  },
  {
    code: 'DC',
    area: 'Relationships',
    line: 'dashed curve',
    meaning: 'partnership and the people you attract',
  },
] as const;

// ─── Major cities (lat, lon) ────────────────────────────────────────────────

const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: 'Sydney', lat: -33.87, lon: 151.21 },
  { name: 'Melbourne', lat: -37.81, lon: 144.96 },
  { name: 'Auckland', lat: -36.85, lon: 174.76 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69 },
  { name: 'Seoul', lat: 37.57, lon: 126.98 },
  { name: 'Beijing', lat: 39.9, lon: 116.4 },
  { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  { name: 'Hong Kong', lat: 22.3, lon: 114.17 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Bangkok', lat: 13.75, lon: 100.5 },
  { name: 'Delhi', lat: 28.61, lon: 77.21 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Dubai', lat: 25.2, lon: 55.27 },
  { name: 'Istanbul', lat: 41.01, lon: 28.98 },
  { name: 'Cairo', lat: 30.05, lon: 31.23 },
  { name: 'Johannesburg', lat: -26.2, lon: 28.05 },
  { name: 'Nairobi', lat: -1.29, lon: 36.82 },
  { name: 'Lagos', lat: 6.52, lon: 3.38 },
  { name: 'Athens', lat: 37.98, lon: 23.73 },
  { name: 'Rome', lat: 41.9, lon: 12.5 },
  { name: 'Paris', lat: 48.86, lon: 2.35 },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Berlin', lat: 52.52, lon: 13.4 },
  { name: 'Moscow', lat: 55.76, lon: 37.62 },
  { name: 'Reykjavik', lat: 64.15, lon: -21.94 },
  { name: 'New York', lat: 40.71, lon: -74.0 },
  { name: 'Toronto', lat: 43.65, lon: -79.38 },
  { name: 'Chicago', lat: 41.88, lon: -87.63 },
  { name: 'Mexico City', lat: 19.43, lon: -99.13 },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'San Francisco', lat: 37.77, lon: -122.42 },
  { name: 'Lima', lat: -12.05, lon: -77.04 },
  { name: 'Rio de Janeiro', lat: -22.91, lon: -43.17 },
  { name: 'Buenos Aires', lat: -34.6, lon: -58.38 },
  { name: 'Antananarivo', lat: -18.88, lon: 47.51 },
];

// ─── Line-building math ─────────────────────────────────────────────────────

function rightAscensionDeclination(eclipticLonDeg: number): {
  raDeg: number;
  decDeg: number;
} {
  const lam = eclipticLonDeg * DEG;
  const ra = Math.atan2(Math.sin(lam) * Math.cos(OBLIQUITY), Math.cos(lam));
  const dec = Math.asin(Math.sin(lam) * Math.sin(OBLIQUITY));
  return { raDeg: normalise360(ra * RAD), decDeg: dec * RAD };
}

function buildMCPath(
  raDeg: number,
  gmst: number,
  view: ViewMode,
): { mc: string; ic: string } {
  // World longitudes where the planet is on the upper / lower meridian.
  const mcLon = normalise180(raDeg - gmst);
  const icLon = normalise180(mcLon + 180);

  if (view === 'classic') {
    const mcX = lonToX(mcLon);
    const icX = lonToX(icLon);
    return {
      mc: `M${mcX} 0 L${mcX} ${MAP_H}`,
      ic: `M${icX} 0 L${icX} ${MAP_H}`,
    };
  }

  // Flat (azimuthal): a meridian is a single value of θ — a radial spoke
  // from the North Pole. Sample lat from +90° (centre) down to -90° (rim).
  // Sample finely so the spoke renders at full length under animation.
  const meridian = (lon: number): string => {
    const pts: string[] = [];
    for (let lat = 90; lat >= -90; lat -= 2) {
      const [x, y] = project(lon, lat, view);
      pts.push(`${pts.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return { mc: meridian(mcLon), ic: meridian(icLon) };
}

function buildACDCPaths(
  raDeg: number,
  decDeg: number,
  gmst: number,
  view: ViewMode,
): { ac: string[]; dc: string[] } {
  // Sample latitudes from -66° to +66° in 3° steps (classic) — same range
  // works for flat-earth too; the projection handles the shape change.
  const lats: number[] = [];
  for (let lat = -66; lat <= 66; lat += 3) lats.push(lat);

  const dec = decDeg * DEG;
  const acPoints: [number, number][] = [];
  const dcPoints: [number, number][] = [];

  for (const lat of lats) {
    const phi = lat * DEG;
    const cosH = -Math.tan(phi) * Math.tan(dec);
    if (cosH < -1 || cosH > 1) continue; // circumpolar / never-rising — no line
    const H = Math.acos(cosH) * RAD; // 0..180
    // AC at this latitude: LST = RA − H  (planet on the eastern horizon)
    const acLon = normalise180(raDeg - H - gmst);
    const dcLon = normalise180(raDeg + H - gmst);
    acPoints.push([acLon, lat]);
    dcPoints.push([dcLon, lat]);
  }

  return {
    ac: segmentsFromPoints(acPoints, view),
    dc: segmentsFromPoints(dcPoints, view),
  };
}

function segmentsFromPoints(
  pts: [number, number][],
  view: ViewMode,
): string[] {
  // Break the polyline whenever the longitude wraps (|Δlon| > 180). In
  // classic that prevents a horizon line from streaking across the map; in
  // flat-earth the wrap is also a visual jump (the spoke crosses the
  // anti-meridian), so we cut there too.
  const segs: string[] = [];
  let cur: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [lon, lat] = pts[i];
    const [x, y] = project(lon, lat, view);
    if (i === 0) {
      cur.push(`M${x.toFixed(1)} ${y.toFixed(1)}`);
      continue;
    }
    const prev = pts[i - 1];
    if (Math.abs(lon - prev[0]) > 180) {
      if (cur.length > 1) segs.push(cur.join(' '));
      cur = [`M${x.toFixed(1)} ${y.toFixed(1)}`];
    } else {
      cur.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }
  if (cur.length > 1) segs.push(cur.join(' '));
  return segs;
}

// ─── Component ──────────────────────────────────────────────────────────────

type Tooltip =
  | {
      x: number;
      y: number;
      title: string;
      subtitle?: string;
    }
  | null;

type LineKind = 'MC' | 'IC' | 'AC' | 'DC';

export default function AstrocartoMap({
  chart,
  birthLocation,
  onLineClick,
}: AstrocartoMapProps) {
  // Derive GMST from the chart's MC + birth longitude when available.
  //
  //   RA(MC) = Local Sidereal Time at birth
  //   GMST   = LST − birth_longitude
  //
  // This keeps the map aligned with the user's actual sky at birth without
  // requiring UT as a separate prop. Falls back to J2000 if the chart lacks
  // an MC or birth coords (degenerate but deterministic).
  const gmst = useMemo(() => {
    if (chart.mc && birthLocation) {
      const { raDeg } = rightAscensionDeclination(chart.mc.longitude);
      return normalise360(raDeg - birthLocation.lon);
    }
    return gmstDeg(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
  }, [chart.mc, birthLocation]);

  // Flat-earth (azimuthal) view archived 2026-05-20 — Ethan disliked it.
  // We keep the projection code below in case we ever want to bring it back,
  // but the runtime is locked to 'classic'. If any user had 'flat' persisted
  // from before, we clear it so they're not stuck on a hidden mode.
  const [view] = useState<ViewMode>('classic');
  useEffect(() => {
    try {
      if (window.localStorage.getItem(VIEW_STORAGE_KEY) === 'flat') {
        window.localStorage.removeItem(VIEW_STORAGE_KEY);
      }
    } catch {
      /* ignore — localStorage may be disabled */
    }
  }, []);

  const dims = viewDims(view);

  const planetsData = useMemo(() => {
    type PD = {
      planet: string;
      color: string;
      order: number;
      mc: string;
      ic: string;
      ac: string[];
      dc: string[];
    };
    const out: PD[] = [];
    for (const p of chart.planets ?? []) {
      const style = PLANET_STYLE[p.planet];
      if (!style) continue;
      const { raDeg, decDeg } = rightAscensionDeclination(p.longitude);
      const { mc, ic } = buildMCPath(raDeg, gmst, view);
      const { ac, dc } = buildACDCPaths(raDeg, decDeg, gmst, view);
      out.push({
        planet: p.planet,
        color: style.color,
        order: style.order,
        mc,
        ic,
        ac,
        dc,
      });
    }
    out.sort((a, b) => a.order - b.order);
    return out;
  }, [chart.planets, gmst, view]);

  // Visibility toggles
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const p of planetsData) init[p.planet] = true;
    return init;
  });
  // keep the toggle map in sync if the chart changes
  useEffect(() => {
    setVisible((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of planetsData) {
        if (!(p.planet in next)) {
          next[p.planet] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [planetsData]);

  // Pan / zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', onChange);
    const id = requestAnimationFrame(() => setMounted(true));
    return () => {
      mq.removeEventListener?.('change', onChange);
      cancelAnimationFrame(id);
    };
  }, []);

  // Native wheel listener — React's synthetic `onWheel` is passive in
  // modern React, so e.preventDefault() inside it silently no-ops and
  // the browser zooms the whole page instead. Attaching natively with
  // { passive: false } lets us actually stop the page-zoom.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoom((z) => Math.min(6, Math.max(0.5, z * (1 + delta * 0.0015))));
    };
    svg.addEventListener('wheel', handler, { passive: false });
    return () => svg.removeEventListener('wheel', handler);
  }, []);

  function screenToMap(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function showLineTooltip(
    planet: string,
    kind: LineKind,
    e: React.PointerEvent,
  ) {
    // Cancel any pending hide — if the pointer just moved from one line
    // to an adjacent one, we want a smooth tooltip swap, not a flicker.
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    const theme = LINE_THEMES[planet]?.[kind] ?? '';
    const { x, y } = screenToMap(e);
    setTooltip({ x, y, title: `${planet} ${kind}`, subtitle: theme });
  }

  function hideTooltip() {
    // Debounce: gives the pointer a beat to enter an adjacent line
    // before we clear, so MC→IC→AC transitions look like one tooltip
    // settling rather than three rapid blinks.
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setTooltip(null);
      hideTimerRef.current = null;
    }, 120);
  }

  function showCityTooltip(
    cityName: string,
    cityLat: number,
    cityLon: number,
    e: React.PointerEvent,
  ) {
    const { x, y } = screenToMap(e);
    // Find nearby lines (within ~300km great-circle).
    const near: string[] = [];
    for (const pd of planetsData) {
      if (!visible[pd.planet]) continue;
      const planetObj = (chart.planets ?? []).find((p) => p.planet === pd.planet);
      if (!planetObj) continue;
      const { raDeg, decDeg } = rightAscensionDeclination(planetObj.longitude);
      // MC distance
      const mcLon = normalise180(raDeg - gmst);
      const icLon = normalise180(mcLon + 180);
      const kmPerDeg = 111.32 * Math.cos(cityLat * DEG);
      const dMC = Math.abs(normalise180(cityLon - mcLon)) * kmPerDeg;
      const dIC = Math.abs(normalise180(cityLon - icLon)) * kmPerDeg;
      if (dMC < 300) near.push(`${pd.planet} MC`);
      if (dIC < 300) near.push(`${pd.planet} IC`);
      // AC/DC approximate: compute AC/DC longitude at this latitude
      const phi = cityLat * DEG;
      const dec = decDeg * DEG;
      const cosH = -Math.tan(phi) * Math.tan(dec);
      if (cosH >= -1 && cosH <= 1) {
        const H = Math.acos(cosH) * RAD;
        const acLon = normalise180(raDeg - H - gmst);
        const dcLon = normalise180(raDeg + H - gmst);
        const dAC = Math.abs(normalise180(cityLon - acLon)) * kmPerDeg;
        const dDC = Math.abs(normalise180(cityLon - dcLon)) * kmPerDeg;
        if (dAC < 300) near.push(`${pd.planet} AC`);
        if (dDC < 300) near.push(`${pd.planet} DC`);
      }
    }
    setHoveredCity(cityName);
    setTooltip({
      x,
      y,
      title: cityName,
      subtitle: near.length ? `near: ${near.slice(0, 4).join(' · ')}` : 'no lines within 300 km',
    });
  }

  function hideCityTooltip() {
    setHoveredCity(null);
    setTooltip(null);
  }

  // Graticule (meridians every 30°, parallels at 0 / ±30 / ±60).
  // In classic these are straight lines; in flat-earth meridians become
  // radial spokes and parallels become concentric circles. Both are built
  // by sampling under project() so the math stays single-source-of-truth.
  const graticule = useMemo(() => {
    const paths: string[] = [];
    // Meridians
    for (let lon = -150; lon <= 180; lon += 30) {
      const pts: string[] = [];
      for (let lat = 90; lat >= -90; lat -= 3) {
        const [x, y] = project(lon, lat, view);
        pts.push(`${pts.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      paths.push(pts.join(' '));
    }
    // Parallels
    for (const lat of [60, 30, 0, -30, -60]) {
      const pts: string[] = [];
      for (let lon = -180; lon <= 180; lon += 3) {
        const [x, y] = project(lon, lat, view);
        pts.push(`${pts.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      paths.push(pts.join(' '));
    }
    return paths.join(' ');
  }, [view]);

  // Real country outlines — Natural Earth 1:110m, pre-projected at build
  // time into whichever space the active view uses. Single concatenated
  // path for fast render (177 features otherwise) — fill-rule:evenodd
  // handles holes correctly.
  const continentPaths = useMemo(() => {
    const source = view === 'classic' ? WORLD_COUNTRIES : WORLD_COUNTRIES_FLAT;
    return source.map((c) => c.d).join(' ');
  }, [view]);

  // Equator polyline (used as a brass accent) — sampled through project().
  const equatorPath = useMemo(() => {
    const pts: string[] = [];
    for (let lon = -180; lon <= 180; lon += 3) {
      const [x, y] = project(lon, 0, view);
      pts.push(`${pts.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [view]);

  // Outer rim ring — only meaningful in flat-earth, demarcates the South Pole
  // edge and gives the Gleason-style disc its silhouette.
  const flatRimRadius = FLAT_R_FULL;

  // Order planets mount-in by speed (Moon first)
  const planetMountDelay = (order: number): number =>
    reducedMotion ? 0 : 0.15 + order * 0.12;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        background: '#070B16',
        border: '1px solid rgba(200,160,82,0.18)',
        overflow: 'hidden',
        color: 'var(--ink)',
      }}
    >
      {/* ── How to read this map ── */}
      <div
        style={{
          padding: '20px 24px 22px',
          borderBottom: '1px solid rgba(200,160,82,0.12)',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#C8A052',
            marginBottom: 8,
          }}
        >
          § Reading your map
        </div>
        <p
          style={{
            fontFamily: "'Hanken Grotesk', serif",
            fontSize: 14.5,
            lineHeight: 1.65,
            color: 'rgba(252,250,246,0.78)',
            margin: '0 0 16px',
            maxWidth: 780,
          }}
        >
          Astrocartography projects your birth chart onto the world. Every
          planet draws lines across the map — stand near one and that
          planet&apos;s energy grows louder in a particular part of your life.
          Each planet can draw four kinds of line. Hover or tap any line on the
          map to read what it carries for you.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {LINE_GUIDE.map((g) => (
            <div
              key={g.code}
              style={{
                flex: '1 1 160px',
                minWidth: 160,
                padding: '10px 13px',
                border: '1px solid rgba(200,160,82,0.16)',
                background: 'rgba(200,160,82,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    color: '#C8A052',
                  }}
                >
                  {g.code}
                </span>
                <span
                  style={{
                    fontFamily: "'Hanken Grotesk', serif",
                    fontSize: 13,
                    color: '#FCFAF6',
                  }}
                >
                  {g.area}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8.5,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#7B7361',
                  marginBottom: 5,
                }}
              >
                {g.line}
              </div>
              <div
                style={{
                  fontFamily: "'Hanken Grotesk', serif",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: 'rgba(252,250,246,0.62)',
                }}
              >
                {g.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {/* Map column */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 640px',
            minWidth: 0,
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${dims.w} ${dims.h}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Astrocartography map"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              touchAction: 'none',
              overscrollBehavior: 'contain',
              cursor: dragRef.current ? 'grabbing' : 'grab',
            }}
          >
            {/* Ocean */}
            <rect x="0" y="0" width={dims.w} height={dims.h} fill="#0A0E1A" />

            {/* Pan/zoom transform group */}
            <g
              transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
            >
              {/* Graticule */}
              <path
                d={graticule}
                fill="none"
                stroke="#C8A052"
                strokeWidth={0.6}
                opacity={0.08}
              />

              {/* Countries (real Natural Earth outlines, very faint) */}
              <path
                d={continentPaths}
                fillRule="evenodd"
                fill="rgba(200,160,82,0.05)"
                stroke="rgba(200,160,82,0.28)"
                strokeWidth={0.6}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Equator accent */}
              <path
                d={equatorPath}
                fill="none"
                stroke="#C8A052"
                strokeWidth={0.5}
                opacity={0.18}
              />

              {/* Flat-earth rim — the South Pole disc edge */}
              {view === 'flat' && (
                <circle
                  cx={FLAT_CX}
                  cy={FLAT_CY}
                  r={flatRimRadius}
                  fill="none"
                  stroke="rgba(200,160,82,0.35)"
                  strokeWidth={0.8}
                />
              )}

              {/* Planetary lines */}
              {planetsData.map((pd) => {
                if (!visible[pd.planet]) return null;
                const delay = planetMountDelay(pd.order);
                const baseOpacity = hoveredLine
                  ? hoveredLine.startsWith(pd.planet)
                    ? 0.95
                    : 0.18
                  : 0.72;
                return (
                  <g key={pd.planet}>
                    {/* MC */}
                    <AstroLine
                      d={pd.mc}
                      stroke={pd.color}
                      strokeWidth={hoveredLine === `${pd.planet}-MC` ? 2.6 : 1.4}
                      opacity={baseOpacity}
                      dashed={false}
                      mounted={mounted}
                      reducedMotion={reducedMotion}
                      delay={delay}
                      onEnter={(e) => {
                        setHoveredLine(`${pd.planet}-MC`);
                        showLineTooltip(pd.planet, 'MC', e);
                      }}
                      onLeave={() => {
                        setHoveredLine(null);
                        hideTooltip();
                      }}
                      onClick={() => onLineClick?.(pd.planet, 'MC')}
                    />
                    {/* IC */}
                    <AstroLine
                      d={pd.ic}
                      stroke={pd.color}
                      strokeWidth={hoveredLine === `${pd.planet}-IC` ? 2.6 : 1.1}
                      opacity={baseOpacity * 0.85}
                      dashed
                      mounted={mounted}
                      reducedMotion={reducedMotion}
                      delay={delay + 0.04}
                      onEnter={(e) => {
                        setHoveredLine(`${pd.planet}-IC`);
                        showLineTooltip(pd.planet, 'IC', e);
                      }}
                      onLeave={() => {
                        setHoveredLine(null);
                        hideTooltip();
                      }}
                      onClick={() => onLineClick?.(pd.planet, 'IC')}
                    />
                    {/* AC segments */}
                    {pd.ac.map((seg, i) => (
                      <AstroLine
                        key={`ac-${i}`}
                        d={seg}
                        stroke={pd.color}
                        strokeWidth={hoveredLine === `${pd.planet}-AC` ? 2.6 : 1.2}
                        opacity={baseOpacity * 0.9}
                        dashed={false}
                        mounted={mounted}
                        reducedMotion={reducedMotion}
                        delay={delay + 0.08 + i * 0.01}
                        onEnter={(e) => {
                          setHoveredLine(`${pd.planet}-AC`);
                          showLineTooltip(pd.planet, 'AC', e);
                        }}
                        onLeave={() => {
                          setHoveredLine(null);
                          hideTooltip();
                        }}
                        onClick={() => onLineClick?.(pd.planet, 'AC')}
                      />
                    ))}
                    {/* DC segments */}
                    {pd.dc.map((seg, i) => (
                      <AstroLine
                        key={`dc-${i}`}
                        d={seg}
                        stroke={pd.color}
                        strokeWidth={hoveredLine === `${pd.planet}-DC` ? 2.6 : 1.2}
                        opacity={baseOpacity * 0.9}
                        dashed
                        mounted={mounted}
                        reducedMotion={reducedMotion}
                        delay={delay + 0.12 + i * 0.01}
                        onEnter={(e) => {
                          setHoveredLine(`${pd.planet}-DC`);
                          showLineTooltip(pd.planet, 'DC', e);
                        }}
                        onLeave={() => {
                          setHoveredLine(null);
                          hideTooltip();
                        }}
                        onClick={() => onLineClick?.(pd.planet, 'DC')}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Cities */}
              {CITIES.map((c) => {
                const [cx, cy] = project(c.lon, c.lat, view);
                return (
                <g key={c.name}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={2.2}
                    fill="rgba(252,250,246,0.55)"
                    stroke="rgba(200,160,82,0.5)"
                    strokeWidth={0.4}
                    style={{ cursor: 'pointer' }}
                    onPointerEnter={(e) =>
                      showCityTooltip(c.name, c.lat, c.lon, e)
                    }
                    onPointerLeave={hideCityTooltip}
                  />
                  {hoveredCity === c.name && (
                    <text
                      x={cx + 6}
                      y={cy - 6}
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        fill: '#CFC5B1',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {c.name}
                    </text>
                  )}
                </g>
                );
              })}

              {/* Birth marker */}
              {birthLocation && (() => {
                const [bx, by] = project(birthLocation.lon, birthLocation.lat, view);
                return (
                <g
                  transform={`translate(${bx} ${by})`}
                >
                  <circle
                    r={8}
                    fill="none"
                    stroke="#C8A052"
                    strokeWidth={0.8}
                    opacity={0.5}
                    style={{
                      animation: reducedMotion
                        ? 'none'
                        : 'acmap-pulse 3.6s ease-in-out infinite',
                      transformOrigin: 'center',
                    }}
                  />
                  <polygon
                    points="0,-5 1.4,-1.4 5,0 1.4,1.4 0,5 -1.4,1.4 -5,0 -1.4,-1.4"
                    fill="#C8A052"
                    stroke="#FCFAF6"
                    strokeWidth={0.4}
                  />
                </g>
                );
              })()}
            </g>
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              role="tooltip"
              style={{
                position: 'absolute',
                left: tooltip.x + 14,
                top: tooltip.y + 12,
                pointerEvents: 'none',
                background: 'rgba(10,14,26,0.94)',
                border: '1px solid rgba(200,160,82,0.4)',
                padding: '8px 12px',
                maxWidth: 260,
                zIndex: 6,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#C8A052',
                  marginBottom: 3,
                }}
              >
                {tooltip.title}
              </div>
              {tooltip.subtitle && (
                <div
                  style={{
                    fontFamily: "'Hanken Grotesk', serif",
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: '#CFC5B1',
                    lineHeight: 1.35,
                  }}
                >
                  {tooltip.subtitle}
                </div>
              )}
            </div>
          )}

          {/* View toggle archived 2026-05-20 — flat-earth (azimuthal) hidden;
              classic equirectangular is the only mode. */}

          {/* Zoom controls */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              display: 'flex',
              gap: 6,
              zIndex: 3,
            }}
          >
            <ZoomButton onClick={() => setZoom((z) => Math.min(6, z * 1.25))} label="+" />
            <ZoomButton
              onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}
              label="−"
            />
            <ZoomButton
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              label="RESET"
              wide
            />
          </div>
        </div>

        {/* Legend */}
        <aside
          style={{
            flex: '0 1 220px',
            minWidth: 200,
            padding: '20px 22px',
            borderLeft: '1px solid rgba(200,160,82,0.12)',
            background: 'rgba(6,9,18,0.6)',
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#C8A052',
              marginBottom: 12,
            }}
          >
            § Planets
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {planetsData.map((pd) => {
              const isOn = visible[pd.planet] ?? true;
              const style = PLANET_STYLE[pd.planet];
              return (
                <li key={pd.planet} style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontFamily: "'Hanken Grotesk', serif",
                      fontSize: 15,
                      color: isOn ? '#FCFAF6' : 'rgba(252,250,246,0.45)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() =>
                        setVisible((v) => ({ ...v, [pd.planet]: !v[pd.planet] }))
                      }
                      style={{
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        width: 12,
                        height: 12,
                        border: '1px solid #C8A052',
                        background: isOn ? '#C8A052' : 'transparent',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-block',
                        width: 18,
                        height: 2,
                        background: pd.color,
                        opacity: isOn ? 1 : 0.3,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 16,
                        color: pd.color,
                      }}
                    >
                      {style.glyph}
                    </span>
                    {pd.planet}
                  </label>
                </li>
              );
            })}
          </ul>

          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid rgba(200,160,82,0.12)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#7B7361',
              lineHeight: 1.6,
            }}
          >
            <div>MC · solid vertical · career</div>
            <div>IC · dashed vertical · home</div>
            <div>AC · solid curve · self</div>
            <div>DC · dashed curve · partners</div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes acmap-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Inner primitives ───────────────────────────────────────────────────────

type AstroLineProps = {
  d: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  dashed: boolean;
  mounted: boolean;
  reducedMotion: boolean;
  delay: number;
  onEnter: (e: React.PointerEvent) => void;
  onLeave: () => void;
  onClick: () => void;
};

function AstroLine({
  d,
  stroke,
  strokeWidth,
  opacity,
  dashed,
  mounted,
  reducedMotion,
  delay,
  onEnter,
  onLeave,
  onClick,
}: AstroLineProps) {
  // Use a large pathLength so stroke-dashoffset draw-in works for any length.
  const drawInReady = mounted || reducedMotion;
  return (
    <g>
      {/* invisible fat hit-area — non-scaling so the click target stays
          a constant pixel width regardless of zoom. */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        vectorEffect="non-scaling-stroke"
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
        pathLength={1}
        vectorEffect="non-scaling-stroke"
        style={{
          strokeDasharray: dashed
            ? drawInReady
              ? '0.012 0.012'
              : `${1} ${1}`
            : drawInReady
              ? 'none'
              : `${1} ${1}`,
          strokeDashoffset: drawInReady ? 0 : 1,
          transition:
            'stroke-dashoffset 900ms cubic-bezier(.2,.7,.3,1), stroke-width 220ms ease, opacity 220ms ease',
          transitionDelay: drawInReady ? `${delay}s` : '0s',
          pointerEvents: 'none',
        }}
      />
    </g>
  );
}

function ZoomButton({
  onClick,
  label,
  wide,
}: {
  onClick: () => void;
  label: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'rgba(10,14,26,0.85)',
        border: '1px solid rgba(200,160,82,0.5)',
        color: '#C8A052',
        padding: wide ? '6px 10px' : '6px 8px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        minWidth: wide ? 60 : 28,
      }}
    >
      {label}
    </button>
  );
}

function ViewToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: active ? 'rgba(200,160,82,0.18)' : 'transparent',
        border: 'none',
        borderRight: '1px solid rgba(200,160,82,0.25)',
        color: active ? '#FCFAF6' : '#C8A052',
        padding: '6px 12px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
