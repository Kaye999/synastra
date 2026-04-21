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

// ─── Props ──────────────────────────────────────────────────────────────────

export type AstrocartoMapProps = {
  chart: Chart;
  birthLocation?: { lat: number; lon: number };
  onLineClick?: (planet: string, lineType: 'MC' | 'IC' | 'AC' | 'DC') => void;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const MAP_W = 1440;
const MAP_H = 720;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const OBLIQUITY = 23.4393 * DEG;

// Projection helpers.
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

// ─── Very simplified continent outlines ─────────────────────────────────────
// Low-fi polygons — intentionally loose, for atmospheric context only.
// Coordinates are [lon, lat] pairs.

const CONTINENTS: [number, number][][] = [
  // North America (very rough)
  [
    [-168, 66], [-140, 70], [-125, 60], [-120, 49], [-124, 40], [-120, 33],
    [-110, 23], [-97, 26], [-88, 30], [-80, 26], [-80, 33], [-75, 39],
    [-70, 43], [-60, 47], [-55, 52], [-65, 60], [-80, 65], [-100, 70],
    [-120, 72], [-150, 70], [-168, 66],
  ],
  // South America
  [
    [-80, 10], [-73, 12], [-60, 8], [-51, 4], [-43, -5], [-35, -10],
    [-40, -23], [-52, -35], [-65, -44], [-73, -55], [-72, -40], [-75, -20],
    [-80, -5], [-80, 10],
  ],
  // Europe
  [
    [-10, 36], [0, 36], [15, 36], [30, 40], [40, 46], [50, 54], [40, 60],
    [25, 65], [10, 60], [0, 55], [-8, 50], [-10, 44], [-10, 36],
  ],
  // Africa
  [
    [-17, 14], [-10, 30], [10, 35], [30, 32], [40, 15], [48, 10], [50, -5],
    [40, -20], [30, -30], [18, -35], [12, -20], [5, -5], [-5, 4], [-17, 14],
  ],
  // Asia (very rough combined landmass)
  [
    [30, 40], [50, 45], [65, 50], [80, 55], [100, 60], [130, 65], [150, 68],
    [160, 60], [140, 50], [135, 40], [125, 35], [120, 25], [105, 18],
    [100, 10], [95, 18], [78, 8], [73, 22], [60, 25], [50, 25], [45, 35],
    [40, 40], [30, 40],
  ],
  // Australia
  [
    [115, -22], [128, -15], [140, -12], [145, -18], [153, -26], [150, -38],
    [140, -38], [130, -34], [115, -32], [114, -25], [115, -22],
  ],
  // Antarctica (as a band at the bottom)
  [
    [-180, -65], [180, -65], [180, -85], [-180, -85], [-180, -65],
  ],
  // Greenland
  [
    [-55, 60], [-30, 60], [-20, 70], [-25, 82], [-45, 83], [-55, 76], [-55, 60],
  ],
  // Indonesia / SE Asia cluster
  [
    [95, -2], [108, -6], [120, -8], [130, -7], [135, -4], [128, 2], [115, 3],
    [105, 5], [95, 2], [95, -2],
  ],
];

function projectPolygon(poly: [number, number][]): string {
  return poly
    .map((p, i) => {
      const x = lonToX(p[0]);
      const y = latToY(p[1]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

// ─── Line-building math ─────────────────────────────────────────────────────

type Segment = string; // SVG path 'd' string fragment

function rightAscensionDeclination(eclipticLonDeg: number): {
  raDeg: number;
  decDeg: number;
} {
  const lam = eclipticLonDeg * DEG;
  const ra = Math.atan2(Math.sin(lam) * Math.cos(OBLIQUITY), Math.cos(lam));
  const dec = Math.asin(Math.sin(lam) * Math.sin(OBLIQUITY));
  return { raDeg: normalise360(ra * RAD), decDeg: dec * RAD };
}

function buildMCPath(raDeg: number, gmst: number): { mc: string; ic: string } {
  // world longitude where the planet is on the upper meridian
  const mcLon = normalise180(raDeg - gmst);
  const icLon = normalise180(mcLon + 180);
  const mcX = lonToX(mcLon);
  const icX = lonToX(icLon);
  return {
    mc: `M${mcX} 0 L${mcX} ${MAP_H}`,
    ic: `M${icX} 0 L${icX} ${MAP_H}`,
  };
}

function buildACDCPaths(
  raDeg: number,
  decDeg: number,
  gmst: number,
): { ac: string[]; dc: string[] } {
  // Sample latitudes from -66° to +66° in 3° steps.
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
    ac: segmentsFromPoints(acPoints),
    dc: segmentsFromPoints(dcPoints),
  };
}

function segmentsFromPoints(pts: [number, number][]): string[] {
  // Break when longitude wraps (abs diff > 180).
  const segs: string[] = [];
  let cur: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [lon, lat] = pts[i];
    const x = lonToX(lon);
    const y = latToY(lat);
    if (i === 0) {
      cur.push(`M${x.toFixed(1)} ${y.toFixed(1)}`);
      continue;
    }
    const prev = pts[i - 1];
    if (Math.abs(lon - prev[0]) > 180) {
      // wrap
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
      const { mc, ic } = buildMCPath(raDeg, gmst);
      const { ac, dc } = buildACDCPaths(raDeg, decDeg, gmst);
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
  }, [chart.planets, gmst]);

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

  function onWheel(e: React.WheelEvent) {
    e.preventDefault?.();
    const delta = -e.deltaY;
    setZoom((z) => {
      const next = Math.min(6, Math.max(0.5, z * (1 + delta * 0.0015)));
      return next;
    });
  }

  function showLineTooltip(
    planet: string,
    kind: LineKind,
    e: React.PointerEvent,
  ) {
    const theme = LINE_THEMES[planet]?.[kind] ?? '';
    const { x, y } = screenToMap(e);
    setTooltip({ x, y, title: `${planet} ${kind}`, subtitle: theme });
  }

  function hideTooltip() {
    setTooltip(null);
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

  // Graticule (10 meridians every 30°, parallels at 0 / ±30 / ±60).
  const graticule = useMemo(() => {
    const paths: string[] = [];
    for (let lon = -150; lon <= 180; lon += 30) {
      const x = lonToX(lon);
      paths.push(`M${x} 0 L${x} ${MAP_H}`);
    }
    for (const lat of [60, 30, 0, -30, -60]) {
      const y = latToY(lat);
      paths.push(`M0 ${y} L${MAP_W} ${y}`);
    }
    return paths.join(' ');
  }, []);

  const continentPaths = useMemo(
    () => CONTINENTS.map((poly) => projectPolygon(poly)).join(' '),
    [],
  );

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
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Astrocartography map"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              touchAction: 'none',
              cursor: dragRef.current ? 'grabbing' : 'grab',
            }}
          >
            {/* Ocean */}
            <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#0A0E1A" />

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

              {/* Continents (very faint) */}
              <path
                d={continentPaths}
                fill="rgba(200,160,82,0.05)"
                stroke="rgba(200,160,82,0.22)"
                strokeWidth={0.8}
              />

              {/* Equator accent */}
              <line
                x1={0}
                y1={latToY(0)}
                x2={MAP_W}
                y2={latToY(0)}
                stroke="#C8A052"
                strokeWidth={0.5}
                opacity={0.18}
              />

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
                      onMove={(e) => showLineTooltip(pd.planet, 'MC', e)}
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
                      onMove={(e) => showLineTooltip(pd.planet, 'IC', e)}
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
                        onMove={(e) => showLineTooltip(pd.planet, 'AC', e)}
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
                        onMove={(e) => showLineTooltip(pd.planet, 'DC', e)}
                        onClick={() => onLineClick?.(pd.planet, 'DC')}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Cities */}
              {CITIES.map((c) => (
                <g key={c.name}>
                  <circle
                    cx={lonToX(c.lon)}
                    cy={latToY(c.lat)}
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
                      x={lonToX(c.lon) + 6}
                      y={latToY(c.lat) - 6}
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
              ))}

              {/* Birth marker */}
              {birthLocation && (
                <g
                  transform={`translate(${lonToX(birthLocation.lon)} ${latToY(birthLocation.lat)})`}
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
              )}
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
                    fontFamily: "'Crimson Pro', serif",
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
                      fontFamily: "'Crimson Pro', serif",
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
            <div>MC · solid vertical</div>
            <div>IC · dashed vertical</div>
            <div>AC · solid curve</div>
            <div>DC · dashed curve</div>
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
  onMove: (e: React.PointerEvent) => void;
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
  onMove,
  onClick,
}: AstroLineProps) {
  // Use a large pathLength so stroke-dashoffset draw-in works for any length.
  const drawInReady = mounted || reducedMotion;
  return (
    <g>
      {/* invisible fat hit-area */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        onPointerEnter={onEnter}
        onPointerMove={onMove}
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
