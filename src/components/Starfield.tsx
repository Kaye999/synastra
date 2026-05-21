"use client";

// Starfield.tsx — dark cosmic background with real named stars + constellations.
// Ported from Starfield.jsx. React.createElement swapped for JSX.

import React, { useMemo, memo } from 'react';

// ─── PROJECTION ──────────────────────────────────────────────────────────────
const CANVAS_W = 2000;
const CANVAS_H = 1200;

function projectRA(raHours: number): number {
  return ((24 - raHours) / 24) * CANVAS_W;
}
function projectDec(decDegrees: number): number {
  return ((90 - decDegrees) / 180) * CANVAS_H;
}

// ─── SEEDED PRNG (mulberry32) ────────────────────────────────────────────────
function makePrng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const STAR_COLORS = [
  '#FCFAF6', '#FCFAF6', '#FCFAF6', '#FCFAF6', '#FCFAF6',
  '#FCFAF6', '#FCFAF6',
  '#CBE3FF', '#CBE3FF',
  '#F4D8A8',
];

// ─── NAMED STARS ─────────────────────────────────────────────────────────────
type NamedStar = { name: string; ra: number; dec: number; mag: number; color: string };

const NAMED_STARS: NamedStar[] = [
  // Orion
  { name: 'Betelgeuse', ra: 5.92, dec: 7.4,    mag: 0.5, color: '#F4D8A8' },
  { name: 'Bellatrix',  ra: 5.42, dec: 6.35,   mag: 1.6, color: '#CBE3FF' },
  { name: 'Mintaka',    ra: 5.53, dec: -0.30,  mag: 2.2, color: '#CBE3FF' },
  { name: 'Alnilam',    ra: 5.60, dec: -1.20,  mag: 1.7, color: '#CBE3FF' },
  { name: 'Alnitak',    ra: 5.68, dec: -1.94,  mag: 1.8, color: '#CBE3FF' },
  { name: 'Saiph',      ra: 5.80, dec: -9.67,  mag: 2.1, color: '#CBE3FF' },
  { name: 'Rigel',      ra: 5.24, dec: -8.20,  mag: 0.1, color: '#CBE3FF' },
  // Ursa Major
  { name: 'Dubhe',   ra: 11.06, dec: 61.75, mag: 1.8, color: '#F4D8A8' },
  { name: 'Merak',   ra: 11.03, dec: 56.38, mag: 2.4, color: '#FCFAF6' },
  { name: 'Phecda',  ra: 11.90, dec: 53.69, mag: 2.4, color: '#FCFAF6' },
  { name: 'Megrez',  ra: 12.26, dec: 57.03, mag: 3.3, color: '#FCFAF6' },
  { name: 'Alioth',  ra: 12.90, dec: 55.96, mag: 1.8, color: '#FCFAF6' },
  { name: 'Mizar',   ra: 13.40, dec: 54.93, mag: 2.2, color: '#FCFAF6' },
  { name: 'Alkaid',  ra: 13.79, dec: 49.31, mag: 1.9, color: '#CBE3FF' },
  // Crux
  { name: 'Acrux',        ra: 12.44, dec: -63.1,  mag: 0.8, color: '#CBE3FF' },
  { name: 'Mimosa',       ra: 12.80, dec: -59.69, mag: 1.3, color: '#CBE3FF' },
  { name: 'Gacrux',       ra: 12.52, dec: -57.11, mag: 1.6, color: '#F4D8A8' },
  { name: 'Delta Crucis', ra: 12.25, dec: -58.75, mag: 2.8, color: '#CBE3FF' },
  // Scorpius
  { name: 'Antares',   ra: 16.49, dec: -26.43, mag: 1.0, color: '#F4D8A8' },
  { name: 'Shaula',    ra: 17.56, dec: -37.10, mag: 1.6, color: '#CBE3FF' },
  { name: 'Sargas',    ra: 17.62, dec: -43.00, mag: 1.9, color: '#FCFAF6' },
  { name: 'Dschubba',  ra: 16.01, dec: -22.62, mag: 2.3, color: '#CBE3FF' },
  { name: 'Graffias',  ra: 16.09, dec: -19.80, mag: 2.6, color: '#CBE3FF' },
  { name: 'Pi Sco',    ra: 15.98, dec: -26.11, mag: 2.9, color: '#CBE3FF' },
  // Cassiopeia
  { name: 'Caph',      ra: 0.15, dec: 59.15, mag: 2.3, color: '#FCFAF6' },
  { name: 'Schedar',   ra: 0.68, dec: 56.54, mag: 2.2, color: '#F4D8A8' },
  { name: 'Gamma Cas', ra: 0.95, dec: 60.72, mag: 2.2, color: '#CBE3FF' },
  { name: 'Ruchbah',   ra: 1.43, dec: 60.24, mag: 2.7, color: '#FCFAF6' },
  { name: 'Segin',     ra: 1.91, dec: 63.67, mag: 3.4, color: '#CBE3FF' },
  // Cygnus
  { name: 'Deneb',     ra: 20.69, dec: 45.28, mag: 1.3, color: '#FCFAF6' },
  { name: 'Sadr',      ra: 20.37, dec: 40.26, mag: 2.2, color: '#FCFAF6' },
  { name: 'Gienah',    ra: 20.77, dec: 33.97, mag: 2.5, color: '#F4D8A8' },
  { name: 'Delta Cyg', ra: 19.75, dec: 45.13, mag: 2.9, color: '#CBE3FF' },
  { name: 'Albireo',   ra: 19.51, dec: 27.96, mag: 3.1, color: '#F4D8A8' },
  // Lyra
  { name: 'Vega',      ra: 18.62, dec: 38.78, mag: 0.0, color: '#CBE3FF' },
  { name: 'Sheliak',   ra: 18.83, dec: 33.36, mag: 3.5, color: '#CBE3FF' },
  { name: 'Sulafat',   ra: 18.98, dec: 32.69, mag: 3.3, color: '#CBE3FF' },
  { name: 'Zeta Lyr',  ra: 18.75, dec: 37.60, mag: 4.3, color: '#FCFAF6' },
  { name: 'Delta Lyr', ra: 18.89, dec: 36.90, mag: 4.3, color: '#F4D8A8' },
  // Pleiades
  { name: 'Alcyone',  ra: 3.791, dec: 24.105, mag: 2.9, color: '#CBE3FF' },
  { name: 'Atlas',    ra: 3.819, dec: 24.053, mag: 3.6, color: '#CBE3FF' },
  { name: 'Electra',  ra: 3.748, dec: 24.113, mag: 3.7, color: '#CBE3FF' },
  { name: 'Maia',     ra: 3.767, dec: 24.368, mag: 3.9, color: '#CBE3FF' },
  { name: 'Merope',   ra: 3.772, dec: 23.948, mag: 4.2, color: '#CBE3FF' },
  { name: 'Taygeta',  ra: 3.762, dec: 24.467, mag: 4.3, color: '#CBE3FF' },
  { name: 'Pleione',  ra: 3.822, dec: 24.136, mag: 5.0, color: '#CBE3FF' },
];

const STAR_BY_NAME: Record<string, NamedStar> = (() => {
  const m: Record<string, NamedStar> = {};
  for (const s of NAMED_STARS) m[s.name] = s;
  return m;
})();

// ─── CONSTELLATION LINES ─────────────────────────────────────────────────────
type Constellation = { name: string; stars: string[]; lines: [string, string][] };

const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Orion',
    stars: ['Betelgeuse', 'Bellatrix', 'Mintaka', 'Alnilam', 'Alnitak', 'Saiph', 'Rigel'],
    lines: [
      ['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Rigel'],
      ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Saiph', 'Alnitak'], ['Saiph', 'Rigel'],
    ],
  },
  {
    name: 'Ursa Major',
    stars: ['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid'],
    lines: [
      ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'],
      ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'], ['Dubhe', 'Megrez'],
    ],
  },
  {
    name: 'Crux',
    stars: ['Acrux', 'Mimosa', 'Gacrux', 'Delta Crucis'],
    lines: [['Gacrux', 'Acrux'], ['Delta Crucis', 'Mimosa']],
  },
  {
    name: 'Scorpius',
    stars: ['Antares', 'Shaula', 'Sargas', 'Dschubba', 'Graffias', 'Pi Sco'],
    lines: [
      ['Graffias', 'Dschubba'], ['Dschubba', 'Pi Sco'], ['Pi Sco', 'Antares'],
      ['Antares', 'Sargas'], ['Sargas', 'Shaula'],
    ],
  },
  {
    name: 'Cassiopeia',
    stars: ['Caph', 'Schedar', 'Gamma Cas', 'Ruchbah', 'Segin'],
    lines: [
      ['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'],
      ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin'],
    ],
  },
  {
    name: 'Cygnus',
    stars: ['Deneb', 'Sadr', 'Gienah', 'Delta Cyg', 'Albireo'],
    lines: [['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Gienah', 'Sadr'], ['Sadr', 'Delta Cyg']],
  },
  {
    name: 'Lyra',
    stars: ['Vega', 'Sheliak', 'Sulafat', 'Zeta Lyr', 'Delta Lyr'],
    lines: [
      ['Vega', 'Zeta Lyr'], ['Zeta Lyr', 'Sheliak'], ['Sheliak', 'Sulafat'],
      ['Sulafat', 'Delta Lyr'], ['Delta Lyr', 'Zeta Lyr'],
    ],
  },
  {
    name: 'Pleiades',
    stars: ['Alcyone', 'Atlas', 'Electra', 'Maia', 'Merope', 'Taygeta', 'Pleione'],
    lines: [],
  },
];

// ─── MAGNITUDE → VISUAL ──────────────────────────────────────────────────────
function magToRadius(mag: number): number {
  const clamped = Math.max(-1, Math.min(5, mag));
  const t = (5 - clamped) / 6;
  return 1.0 + t * 1.4;
}
function magToOpacity(mag: number): number {
  const clamped = Math.max(-1, Math.min(5, mag));
  const t = (5 - clamped) / 6;
  return 0.55 + t * 0.4;
}

type BgStar = {
  x: number; y: number; radius: number; opacity: number; color: string;
  tier: 'dim' | 'mid' | 'bright';
  twinkle: boolean; twinkleDur: number; twinkleDelay: number;
};

function generateBackgroundStars(count: number, seed: number): BgStar[] {
  const rand = makePrng(seed);
  const stars: BgStar[] = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * CANVAS_W;
    const y = rand() * CANVAS_H;
    const roll = rand();

    let tier: 'dim' | 'mid' | 'bright';
    if (roll < 0.015) tier = 'bright';
    else if (roll < 0.115) tier = 'mid';
    else tier = 'dim';

    let radius: number;
    let opacity: number;
    if (tier === 'dim') {
      radius = 0.4 + rand() * 0.4;
      opacity = 0.15 + rand() * 0.20;
    } else if (tier === 'mid') {
      radius = 1.0 + rand() * 0.4;
      opacity = 0.5 + rand() * 0.25;
    } else {
      radius = 1.8 + rand() * 0.6;
      opacity = 0.8 + rand() * 0.15;
    }

    const color = STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)];
    const twinkle = tier === 'dim' && rand() < 0.05;
    const twinkleDur = 3 + rand() * 5;
    const twinkleDelay = rand() * 6;

    stars.push({ x, y, radius, opacity, color, tier, twinkle, twinkleDur, twinkleDelay });
  }
  return stars;
}

function computeCentroid(starNames: string[]): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const nm of starNames) {
    const s = STAR_BY_NAME[nm];
    if (!s) continue;
    sx += projectRA(s.ra);
    sy += projectDec(s.dec);
    n++;
  }
  return n ? { x: sx / n, y: sy / n } : { x: 0, y: 0 };
}

const TWINKLE_CSS = [
  '@keyframes sf-twinkle {',
  '  0%   { opacity: var(--sf-o, 0.25); }',
  '  50%  { opacity: calc(var(--sf-o, 0.25) + 0.20); }',
  '  100% { opacity: var(--sf-o, 0.25); }',
  '}',
  '.sf-twinkle {',
  '  animation-name: sf-twinkle;',
  '  animation-iteration-count: infinite;',
  '  animation-timing-function: ease-in-out;',
  '}',
].join('\n');

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export type StarfieldProps = {
  showLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

function Starfield({ showLabels = false, className, style }: StarfieldProps) {
  const bgStars = useMemo(() => generateBackgroundStars(800, 1337), []);

  const namedProjected = useMemo(
    () => NAMED_STARS.map(s => ({
      ...s,
      x: projectRA(s.ra),
      y: projectDec(s.dec),
      r: magToRadius(s.mag),
      o: magToOpacity(s.mag),
    })),
    [],
  );

  const namedMap = useMemo(() => {
    const m: Record<string, (typeof namedProjected)[number]> = {};
    for (const s of namedProjected) m[s.name] = s;
    return m;
  }, [namedProjected]);

  const centroids = useMemo(
    () => CONSTELLATIONS.map(c => ({ name: c.name, ...computeCentroid(c.stars) })),
    [],
  );

  const mergedStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 50% 40%, #0b1020 0%, #060912 55%, #030509 100%)',
    ...(style || {}),
  };

  return (
    <div className={className} style={mergedStyle} aria-hidden="true">
      <style>{TWINKLE_CSS}</style>
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="sf-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sf-softglow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sf-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0"
            />
          </filter>
          <radialGradient
            id="sf-milkyway"
            cx="50%"
            cy="50%"
            r="70%"
            gradientTransform="translate(0.0 0.1) rotate(-28 0.5 0.5) scale(1.2 0.32)"
          >
            <stop offset="0%" stopColor="#F4D8A8" stopOpacity="0.09" />
            <stop offset="40%" stopColor="#CBE3FF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* MILKY WAY BAND */}
        <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="url(#sf-milkyway)" />

        {/* BACKGROUND STARS */}
        <g style={{ pointerEvents: 'none' }}>
          {bgStars.map((s, i) => {
            const twinkleStyle: React.CSSProperties | undefined = s.twinkle
              ? ({
                  ['--sf-o' as string]: s.opacity,
                  animationDuration: `${s.twinkleDur.toFixed(2)}s`,
                  animationDelay: `${s.twinkleDelay.toFixed(2)}s`,
                  opacity: s.opacity,
                } as React.CSSProperties)
              : undefined;
            return (
              <circle
                key={`bg${i}`}
                cx={s.x.toFixed(2)}
                cy={s.y.toFixed(2)}
                r={s.radius.toFixed(2)}
                fill={s.color}
                opacity={s.twinkle ? undefined : s.opacity}
                className={s.twinkle ? 'sf-twinkle' : undefined}
                style={twinkleStyle}
                filter={s.tier === 'bright' ? 'url(#sf-softglow)' : undefined}
              />
            );
          })}
        </g>

        {/* CONSTELLATION LINES */}
        <g
          style={{ pointerEvents: 'none' }}
          stroke="#C8A052"
          strokeWidth={0.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.12}
        >
          {CONSTELLATIONS.flatMap((c, ci) =>
            c.lines.map((pair, li) => {
              const a = namedMap[pair[0]];
              const b = namedMap[pair[1]];
              if (!a || !b) return null;
              return (
                <line
                  key={`L-${ci}-${li}`}
                  x1={a.x.toFixed(2)}
                  y1={a.y.toFixed(2)}
                  x2={b.x.toFixed(2)}
                  y2={b.y.toFixed(2)}
                />
              );
            }),
          )}
        </g>

        {/* NAMED STARS with glow */}
        <g style={{ pointerEvents: 'none' }} filter="url(#sf-glow)">
          {namedProjected.map((s, i) => (
            <React.Fragment key={`ns${i}`}>
              <circle cx={s.x.toFixed(2)} cy={s.y.toFixed(2)} r={(s.r * 2.6).toFixed(2)} fill={s.color} opacity={0.08} />
              <circle cx={s.x.toFixed(2)} cy={s.y.toFixed(2)} r={s.r.toFixed(2)} fill={s.color} opacity={s.o} />
            </React.Fragment>
          ))}
        </g>

        {/* CONSTELLATION LABELS */}
        {showLabels && (
          <g
            style={{ pointerEvents: 'none' }}
            fontFamily="'Alice', Georgia, serif"
            fontStyle="italic"
            fontSize={18}
            letterSpacing="0.12em"
            fill="#F4D8A8"
            opacity={0.35}
            textAnchor="middle"
          >
            {centroids.map((c, i) => (
              <text key={`lbl${i}`} x={c.x.toFixed(2)} y={(c.y - 18).toFixed(2)}>
                {c.name}
              </text>
            ))}
          </g>
        )}

        {/* GRAIN OVERLAY */}
        <rect
          x={0}
          y={0}
          width={CANVAS_W}
          height={CANVAS_H}
          filter="url(#sf-grain)"
          opacity={0.5}
          style={{ mixBlendMode: 'overlay' }}
        />
      </svg>
    </div>
  );
}

export default memo(Starfield);
