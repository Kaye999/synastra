"use client";

// NatalChartWheel — interactive Western natal chart wheel.
//
// Pure SVG (600×600, responsive via viewBox). Layers, outer-in:
//   1. Zodiac ring       (12 sectors with glyphs)
//   2. House ring        (12 house divisions with Roman numerals)
//   3. Aspect lines      (optional, between planets within orb)
//   4. Planet ring       (glyphs positioned at ecliptic longitude)
//   5. Cardinal axes     (ASC/DSC, MC/IC)
//
// All brass-tinted on transparent background so the page Starfield shows through.

import { useState, useMemo, useEffect } from 'react';
import type { Chart } from '@/lib/types';
import { PLANET_IN_SIGN, PLANET_IN_HOUSE } from '@/lib/interp/tables';

// ─── GLYPHS + CONSTANTS ──────────────────────────────────────────────────────
const SIGN_GLYPH: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

const SIGN_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Geometry — centred on (300, 300) with outer radius 290
const CX = 300;
const CY = 300;
const R_OUTER = 290;
const R_ZODIAC_IN = 250;  // inner edge of zodiac ring
const R_HOUSE_OUT = 250;
const R_HOUSE_IN = 210;   // inner edge of house ring
const R_PLANET = 175;     // mid-radius planet ring
const R_CENTRAL = 90;     // central circle

// Aspect definitions (angle, orb)
const ASPECTS: Array<{ name: string; angle: number; orb: number }> = [
  { name: 'conjunction', angle: 0, orb: 8 },
  { name: 'opposition', angle: 180, orb: 8 },
  { name: 'trine', angle: 120, orb: 8 },
  { name: 'square', angle: 90, orb: 8 },
  { name: 'sextile', angle: 60, orb: 4 },
];

// Convert astrological longitude (0° at Aries, counter-clockwise) to SVG angle.
// SVG 0° is at 3 o'clock; we want Aries at 9 o'clock on the wheel (west, the
// ascendant position in the standard unequal-aspect natal wheel) and the sign
// ring running counter-clockwise. We map: svgAngle = 180 - longitude.
function lonToSvgRad(longitude: number): number {
  const deg = 180 - longitude;
  return (deg * Math.PI) / 180;
}

function polar(radius: number, longitude: number): { x: number; y: number } {
  const a = lonToSvgRad(longitude);
  return { x: CX + radius * Math.cos(a), y: CY - radius * Math.sin(a) };
}

// Degree-within-sign → full longitude.
function planetLongitude(p: { sign: string; deg: number; longitude?: number }): number {
  if (typeof p.longitude === 'number' && !Number.isNaN(p.longitude)) return p.longitude;
  const i = SIGN_ORDER.indexOf(p.sign);
  return i >= 0 ? i * 30 + (p.deg ?? 0) : 0;
}

// Short one-sentence essence pulled from the interp tables.
function firstSentence(text: string | undefined): string {
  if (!text) return '';
  const m = text.match(/[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
}

function meaningFor(planet: string, sign: string, house: number | null): string {
  type TableRow = Record<string, Record<string, string>>;
  type HouseRow = Record<string, Record<number, string>>;
  const signText = (PLANET_IN_SIGN as unknown as TableRow)[planet]?.[sign];
  const houseText = house ? (PLANET_IN_HOUSE as unknown as HouseRow)[planet]?.[house] : undefined;
  const primary = firstSentence(signText) || firstSentence(houseText);
  return primary || `${planet} in ${sign}${house ? ` · House ${house}` : ''}`;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export type NatalChartWheelProps = {
  chart: Chart;
  onPlanetClick?: (planet: string) => void;
  showAspects?: boolean;
};

export default function NatalChartWheel({
  chart,
  onPlanetClick,
  showAspects = true,
}: NatalChartWheelProps) {
  const [hoverPlanet, setHoverPlanet] = useState<string | null>(null);
  const [hoverSign, setHoverSign] = useState<string | null>(null);
  const [hoverHouse, setHoverHouse] = useState<number | null>(null);
  const [flashPlanet, setFlashPlanet] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  // Compute planet positions (memoised).
  const planetPos = useMemo(() => {
    return chart.planets
      .filter((p) => PLANET_GLYPH[p.planet])
      .map((p) => {
        const lon = planetLongitude(p);
        const pt = polar(R_PLANET, lon);
        return { ...p, lon, x: pt.x, y: pt.y };
      });
  }, [chart.planets]);

  // Compute aspect lines (memoised).
  const aspectLines = useMemo(() => {
    if (!showAspects) return [];
    const lines: Array<{ a: string; b: string; type: string; x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < planetPos.length; i++) {
      for (let j = i + 1; j < planetPos.length; j++) {
        const a = planetPos[i];
        const b = planetPos[j];
        let diff = Math.abs(a.lon - b.lon);
        if (diff > 180) diff = 360 - diff;
        for (const asp of ASPECTS) {
          if (Math.abs(diff - asp.angle) <= asp.orb) {
            lines.push({
              a: a.planet,
              b: b.planet,
              type: asp.name,
              x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            });
            break;
          }
        }
      }
    }
    return lines;
  }, [planetPos, showAspects]);

  // Ascendant longitude — used to align the house cusps. Default 0 if absent.
  const ascLon = chart.ascendant?.longitude ?? 0;
  const mcLon = chart.mc?.longitude ?? (ascLon + 270) % 360;

  function handlePlanetClick(name: string) {
    setFlashPlanet(name);
    onPlanetClick?.(name);
    window.setTimeout(() => setFlashPlanet((n) => (n === name ? null : n)), 900);
  }

  const tooltip = (() => {
    if (hoverPlanet) {
      const p = planetPos.find((x) => x.planet === hoverPlanet);
      if (!p) return null;
      const deg = Math.floor(p.deg ?? 0);
      const min = Math.floor(((p.deg ?? 0) - deg) * 60);
      return {
        x: p.x, y: p.y,
        title: `${PLANET_GLYPH[p.planet]}  ${p.planet}`,
        line1: `${deg}°${String(min).padStart(2, '0')}′ ${p.sign}${p.house ? ` · House ${p.house}` : ''}`,
        body: meaningFor(p.planet, p.sign, p.house),
      };
    }
    if (hoverSign) {
      const pt = polar(R_ZODIAC_IN - 30, SIGN_ORDER.indexOf(hoverSign) * 30 + 15);
      return {
        x: pt.x, y: pt.y,
        title: `${SIGN_GLYPH[hoverSign]}  ${hoverSign}`,
        line1: '',
        body: '',
      };
    }
    if (hoverHouse !== null) {
      const mid = (hoverHouse - 1) * 30 + 15;
      const pt = polar((R_HOUSE_IN + R_HOUSE_OUT) / 2, mid + ascLon);
      return {
        x: pt.x, y: pt.y,
        title: `House ${ROMAN[hoverHouse - 1]}`,
        line1: '',
        body: '',
      };
    }
    return null;
  })();

  return (
    <div style={{ width: '100%', position: 'relative', fontFamily: 'var(--font-body)' }}>
      <svg
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Natal chart wheel"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <filter id="ncw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="ncw-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(200,160,82,0.05)" />
            <stop offset="100%" stopColor="rgba(200,160,82,0)" />
          </radialGradient>
        </defs>

        {/* Soft central fill */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="url(#ncw-center)" />

        {/* ── ZODIAC RING ── */}
        <g>
          <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="var(--brass)" strokeWidth="0.8" opacity="0.7" />
          <circle cx={CX} cy={CY} r={R_ZODIAC_IN} fill="none" stroke="var(--brass)" strokeWidth="0.6" opacity="0.45" />

          {SIGN_ORDER.map((sign, i) => {
            const startLon = i * 30;
            const start = polar(R_OUTER, startLon);
            const inEdge = polar(R_ZODIAC_IN, startLon);
            const midPt = polar((R_OUTER + R_ZODIAC_IN) / 2, startLon + 15);
            const active = hoverSign === sign;

            // sector arc for hover target
            const arcA = polar(R_OUTER, startLon);
            const arcB = polar(R_OUTER, startLon + 30);
            const arcC = polar(R_ZODIAC_IN, startLon + 30);
            const arcD = polar(R_ZODIAC_IN, startLon);
            const sectorPath = [
              `M ${arcA.x} ${arcA.y}`,
              `A ${R_OUTER} ${R_OUTER} 0 0 0 ${arcB.x} ${arcB.y}`,
              `L ${arcC.x} ${arcC.y}`,
              `A ${R_ZODIAC_IN} ${R_ZODIAC_IN} 0 0 1 ${arcD.x} ${arcD.y}`,
              'Z',
            ].join(' ');

            return (
              <g
                key={sign}
                onMouseEnter={() => setHoverSign(sign)}
                onMouseLeave={() => setHoverSign((s) => (s === sign ? null : s))}
                style={{ cursor: 'default' }}
              >
                <path
                  d={sectorPath}
                  fill={active ? 'rgba(200,160,82,0.1)' : 'rgba(200,160,82,0.02)'}
                  stroke="none"
                />
                {/* sector divider hairline */}
                <line
                  x1={start.x} y1={start.y}
                  x2={inEdge.x} y2={inEdge.y}
                  stroke="var(--brass)"
                  strokeWidth="0.5"
                  opacity="0.45"
                />
                <text
                  x={midPt.x}
                  y={midPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={active ? '22' : '20'}
                  fill="var(--brass)"
                  opacity={active ? 1 : 0.82}
                  style={{
                    filter: active ? 'url(#ncw-glow)' : undefined,
                    transition: reducedMotion ? 'none' : 'all 240ms cubic-bezier(.2,.7,.3,1)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {SIGN_GLYPH[sign]}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── HOUSE RING ── */}
        <g>
          <circle cx={CX} cy={CY} r={R_HOUSE_IN} fill="none" stroke="var(--brass)" strokeWidth="0.5" opacity="0.35" />
          {Array.from({ length: 12 }).map((_, i) => {
            const houseStartLon = (ascLon + i * 30) % 360;
            const mid = (ascLon + i * 30 + 15) % 360;
            const sOut = polar(R_HOUSE_OUT, houseStartLon);
            const sIn = polar(R_HOUSE_IN, houseStartLon);
            const lblPt = polar((R_HOUSE_OUT + R_HOUSE_IN) / 2, mid);
            const houseNum = i + 1;
            const active = hoverHouse === houseNum;

            // sector path for hover area
            const arcA = polar(R_HOUSE_OUT, houseStartLon);
            const arcB = polar(R_HOUSE_OUT, houseStartLon + 30);
            const arcC = polar(R_HOUSE_IN, houseStartLon + 30);
            const arcD = polar(R_HOUSE_IN, houseStartLon);
            const sectorPath = [
              `M ${arcA.x} ${arcA.y}`,
              `A ${R_HOUSE_OUT} ${R_HOUSE_OUT} 0 0 0 ${arcB.x} ${arcB.y}`,
              `L ${arcC.x} ${arcC.y}`,
              `A ${R_HOUSE_IN} ${R_HOUSE_IN} 0 0 1 ${arcD.x} ${arcD.y}`,
              'Z',
            ].join(' ');

            return (
              <g
                key={houseNum}
                onMouseEnter={() => setHoverHouse(houseNum)}
                onMouseLeave={() => setHoverHouse((h) => (h === houseNum ? null : h))}
              >
                <path
                  d={sectorPath}
                  fill={active ? 'rgba(200,160,82,0.08)' : 'transparent'}
                  stroke="none"
                />
                <line
                  x1={sOut.x} y1={sOut.y}
                  x2={sIn.x} y2={sIn.y}
                  stroke="var(--brass)"
                  strokeWidth="0.4"
                  opacity="0.3"
                />
                <text
                  x={lblPt.x}
                  y={lblPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="var(--ink-dim)"
                  fontFamily="var(--font-mono)"
                  opacity={active ? 1 : 0.55}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {ROMAN[i]}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── CARDINAL AXES (ASC/DSC, MC/IC) ── */}
        <g opacity="0.55">
          {/* ASC/DSC */}
          {(() => {
            const a = polar(R_OUTER, ascLon);
            const b = polar(R_OUTER, (ascLon + 180) % 360);
            return (
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--brass)"
                strokeWidth="0.7"
                strokeDasharray="3 3"
              />
            );
          })()}
          {(() => {
            const a = polar(R_OUTER, mcLon);
            const b = polar(R_OUTER, (mcLon + 180) % 360);
            return (
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--brass)"
                strokeWidth="0.7"
                strokeDasharray="3 3"
              />
            );
          })()}
          {/* axis labels */}
          {(() => {
            const asc = polar(R_OUTER + 14, ascLon);
            const dsc = polar(R_OUTER + 14, (ascLon + 180) % 360);
            const mc = polar(R_OUTER + 14, mcLon);
            const ic = polar(R_OUTER + 14, (mcLon + 180) % 360);
            const lblStyle = {
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.2em',
              fill: 'var(--brass)',
            } as const;
            return (
              <g>
                <text x={asc.x} y={asc.y} textAnchor="middle" dominantBaseline="central" {...lblStyle}>ASC</text>
                <text x={dsc.x} y={dsc.y} textAnchor="middle" dominantBaseline="central" {...lblStyle}>DSC</text>
                <text x={mc.x} y={mc.y} textAnchor="middle" dominantBaseline="central" {...lblStyle}>MC</text>
                <text x={ic.x} y={ic.y} textAnchor="middle" dominantBaseline="central" {...lblStyle}>IC</text>
              </g>
            );
          })()}
        </g>

        {/* ── CENTRAL CIRCLE ── */}
        <circle cx={CX} cy={CY} r={R_CENTRAL} fill="none" stroke="var(--brass)" strokeWidth="0.5" opacity="0.4" />

        {/* ── ASPECT LINES ── */}
        {showAspects && (
          <g>
            {aspectLines.map((ln, idx) => {
              const isDashed = ln.type === 'square' || ln.type === 'opposition';
              const dx = ln.x2 - ln.x1;
              const dy = ln.y2 - ln.y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              return (
                <line
                  key={`${ln.a}-${ln.b}-${idx}`}
                  x1={ln.x1} y1={ln.y1}
                  x2={ln.x2} y2={ln.y2}
                  stroke="var(--brass)"
                  strokeWidth="0.5"
                  strokeDasharray={isDashed ? '2 3' : undefined}
                  opacity="0.28"
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          strokeDasharray: `${len}`,
                          strokeDashoffset: `${len}`,
                          animation: `ncw-draw 1200ms cubic-bezier(.3,.7,.3,1) both`,
                          animationDelay: `${800 + idx * 30}ms`,
                        }
                  }
                />
              );
            })}
          </g>
        )}

        {/* ── PLANET GLYPHS ── */}
        <g>
          {planetPos.map((p, idx) => {
            const active = hoverPlanet === p.planet;
            const flash = flashPlanet === p.planet;
            return (
              <g
                key={p.planet}
                onMouseEnter={() => setHoverPlanet(p.planet)}
                onMouseLeave={() => setHoverPlanet((n) => (n === p.planet ? null : n))}
                onClick={() => handlePlanetClick(p.planet)}
                style={{
                  cursor: 'pointer',
                  opacity: reducedMotion ? 1 : 0,
                  animation: reducedMotion
                    ? undefined
                    : `ncw-rise 320ms cubic-bezier(.2,.7,.3,1) both`,
                  animationDelay: reducedMotion ? undefined : `${idx * 40}ms`,
                }}
              >
                {/* hit-target backing circle */}
                <circle
                  cx={p.x} cy={p.y} r="18"
                  fill="transparent"
                />
                {/* flash ring on click */}
                {flash && (
                  <circle
                    cx={p.x} cy={p.y} r="16"
                    fill="none"
                    stroke="var(--brass)"
                    strokeWidth="1.2"
                    opacity="0.85"
                    style={
                      reducedMotion
                        ? undefined
                        : { animation: 'ncw-flash 900ms ease-out both' }
                    }
                  />
                )}
                {/* hover halo */}
                <circle
                  cx={p.x} cy={p.y} r="14"
                  fill={active ? 'rgba(200,160,82,0.12)' : 'transparent'}
                  stroke={active ? 'var(--brass)' : 'none'}
                  strokeWidth="0.6"
                  opacity={active ? 0.9 : 0}
                  style={{
                    transition: reducedMotion ? 'none' : 'all 220ms cubic-bezier(.2,.7,.3,1)',
                  }}
                />
                <text
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={active ? '22' : '20'}
                  fill="var(--ink)"
                  style={{
                    filter: active ? 'url(#ncw-glow)' : undefined,
                    transition: reducedMotion ? 'none' : 'font-size 220ms cubic-bezier(.2,.7,.3,1)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {PLANET_GLYPH[p.planet]}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── TOOLTIP ── */}
      {tooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${(tooltip.x / 600) * 100}%`,
            top: `${(tooltip.y / 600) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 14px))',
            maxWidth: '280px',
            padding: '10px 14px',
            background: 'rgba(10, 14, 26, 0.94)',
            border: '1px solid var(--brass-soft)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            lineHeight: 1.45,
            pointerEvents: 'none',
            boxShadow: '0 0 24px rgba(200,160,82,0.18)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              color: 'var(--brass)',
              marginBottom: tooltip.line1 || tooltip.body ? '4px' : 0,
              letterSpacing: '0.04em',
            }}
          >
            {tooltip.title}
          </div>
          {tooltip.line1 && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--ink-dim)',
                marginBottom: tooltip.body ? '6px' : 0,
              }}
            >
              {tooltip.line1}
            </div>
          )}
          {tooltip.body && (
            <div style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}>{tooltip.body}</div>
          )}
        </div>
      )}

      <style>{`
        @keyframes ncw-rise {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes ncw-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes ncw-flash {
          0%   { r: 8;  opacity: 1;   stroke-width: 1.6; }
          100% { r: 22; opacity: 0;   stroke-width: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          svg [style*="ncw-rise"], svg [style*="ncw-draw"], svg [style*="ncw-flash"] {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
