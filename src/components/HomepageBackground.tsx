"use client";

// HomepageBackground.tsx — cinematic celestial backdrop for the Synastra
// landing page. Scroll-tied night-to-dawn transition with a sun rising at
// the bottom, plus parallax depth, atmospheric polish, and one signature
// constellation moment timed to the "The Seven" section.
//
// Architecture (unchanged from prior version — preserved for performance):
//   - One rAF-throttled scroll listener writes CSS custom properties on
//     :root. Every layer consumes those vars via calc()/gradients. Zero
//     React re-renders. No canvas, no Three.js, no new npm deps.
//   - All layers are position:fixed full-viewport divs/SVGs.
//   - Respects prefers-reduced-motion: locks the dawn state and freezes
//     ambient animations.
//
// Layers (back → front):
//   01 Sky gradient (existing, deepened palette)
//   02 Aurora curtains (new) — soft vertical color bands at deep night
//   03 Star field FAR  (smallest, slowest parallax, dimmest twinkle)
//   04 Star field MID  (medium)
//   05 Star field NEAR (largest, fastest parallax, brightest twinkle)
//   06 Shooting stars  (new) — 3 timed streaks, night phase only
//   07 Heptagram constellation (new) — 7-pointed star draws itself when
//      scroll enters the "The Seven" band (~35–55%); fades out after
//   08 Horizon haze (existing)
//   09 Wisp clouds (existing, now drifting horizontally)
//   10 Volumetric godrays (new) — radial beams from sun at dawn
//   11 Sun corona (existing, now breathes)
//   12 Sun core (existing)
//   13 Lens flare ghosts (new) — chromatic circles along the sun axis
//   14 Vignette (new) — soft edge darken
//   15 Film grain (new) — SVG noise overlay, very subtle
//   16 Footer veil (existing, for footer legibility against dawn brass)

import { useEffect, useMemo } from 'react';

// ─── Star generation ─────────────────────────────────────────────────
const STARS_FAR_COUNT = 90;
const STARS_MID_COUNT = 110;
const STARS_NEAR_COUNT = 60;
const STARS_SEED = 7777;

function makePrng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = {
  x: number;        // % from left
  y: number;        // % from top
  r: number;        // px radius
  alpha: number;    // base opacity
  twinkleDelay: number; // s
  twinkleDur: number;   // s
};

type StarLayerSpec = {
  count: number;
  // radius range
  rMin: number;
  rMax: number;
  // base alpha range
  aMin: number;
  aMax: number;
  // twinkle duration range (s)
  durMin: number;
  durMax: number;
  // vertical bias top fraction (0-1) — keeps most stars in the night sky
  yMax: number;
};

function generateLayer(
  rand: () => number,
  spec: StarLayerSpec,
): Star[] {
  const out: Star[] = [];
  for (let i = 0; i < spec.count; i++) {
    out.push({
      x: rand() * 100,
      y: rand() * (spec.yMax * 100),
      r: spec.rMin + rand() * (spec.rMax - spec.rMin),
      alpha: spec.aMin + rand() * (spec.aMax - spec.aMin),
      twinkleDelay: -rand() * 6, // negative so they're already mid-cycle
      twinkleDur: spec.durMin + rand() * (spec.durMax - spec.durMin),
    });
  }
  return out;
}

function generateAllStars(seed: number) {
  const rand = makePrng(seed);
  // Order matters — same seed must always generate the same fields.
  const far = generateLayer(rand, {
    count: STARS_FAR_COUNT,
    rMin: 0.4, rMax: 0.9,
    aMin: 0.25, aMax: 0.55,
    durMin: 4, durMax: 8,
    yMax: 0.65,
  });
  const mid = generateLayer(rand, {
    count: STARS_MID_COUNT,
    rMin: 0.7, rMax: 1.4,
    aMin: 0.40, aMax: 0.78,
    durMin: 3, durMax: 7,
    yMax: 0.60,
  });
  const near = generateLayer(rand, {
    count: STARS_NEAR_COUNT,
    rMin: 1.0, rMax: 2.0,
    aMin: 0.55, aMax: 0.95,
    durMin: 2.5, durMax: 5,
    yMax: 0.55,
  });
  return { far, mid, near };
}

// ─── Sacred-geometry yantra (built around the heptagram) ─────────────
// All geometry lives inside a 100×100 viewBox centred at (50, 50).
// Several concentric layers — outer ring, inscribed heptagon, two
// heptagram star polygons ({7/2} and {7/3}), radial spokes, inner
// ring with a mini {7/3} star, vertex pinpricks, and a central
// bindu. Each layer cascades in on its own sub-stage of --hp-seven.
type Pt = { x: number; y: number };

function ringPoints(cx: number, cy: number, r: number, n = 7): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (-Math.PI / 2) + (i * (2 * Math.PI) / n);
    out.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return out;
}

function polyPath(pts: Pt[], closed = true): string {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  if (closed) d += ' Z';
  return d;
}

// {n/k} star polygon: connect every k-th vertex around an n-point ring.
function starPath(pts: Pt[], k: number): string {
  const n = pts.length;
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const idx = (i * k) % n;
    out.push((i === 0 ? 'M ' : 'L ') + pts[idx].x + ' ' + pts[idx].y);
  }
  return out.join(' ');
}

// 7 radial spokes from centre to each vertex of the outer ring, as a
// single multi-move path so it animates uniformly with dashoffset.
function spokesPath(pts: Pt[], cx: number, cy: number): string {
  return pts.map(p => `M ${cx} ${cy} L ${p.x} ${p.y}`).join(' ');
}

// 7 short tick marks just inside the outer ring, one per vertex.
function ticksPath(cx: number, cy: number, rInner: number, rOuter: number): string {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const t = (-Math.PI / 2) + (i * (2 * Math.PI) / 7);
    out.push(
      `M ${(cx + rInner * Math.cos(t)).toFixed(2)} ${(cy + rInner * Math.sin(t)).toFixed(2)} `
      + `L ${(cx + rOuter * Math.cos(t)).toFixed(2)} ${(cy + rOuter * Math.sin(t)).toFixed(2)}`,
    );
  }
  return out.join(' ');
}

// Bundle all yantra geometry for rendering.
type Yantra = {
  outerPts: Pt[];
  innerPts: Pt[];
  heptagon: string;
  star72: string;
  star73: string;
  spokes: string;
  ticks: string;
  innerStar73: string;
};

function buildYantra(): Yantra {
  const cx = 50, cy = 50;
  const rOuter = 45;
  const rInner = 13;
  const outerPts = ringPoints(cx, cy, rOuter, 7);
  const innerPts = ringPoints(cx, cy, rInner, 7);
  return {
    outerPts,
    innerPts,
    heptagon:    polyPath(outerPts, true),
    star72:      starPath(outerPts, 2),
    star73:      starPath(outerPts, 3),
    spokes:      spokesPath(outerPts, cx, cy),
    ticks:       ticksPath(cx, cy, rOuter - 3, rOuter - 0.5),
    innerStar73: starPath(innerPts, 3),
  };
}

// ─── Grass silhouette (bezier-curved blades) ─────────────────────────
// Builds a horizon path out of leaning, curved blade tips instead of
// flat triangles. Each blade segment uses two quadratic curves (up to
// the tip, then back down) so the silhouette reads like real meadow.
function generateGrassPath(
  seed: number,
  w = 1000,
  h = 100,
  density = 1,
): string {
  const rand = makePrng(seed);
  const out: string[] = [`M 0 ${h}`];
  let x = 0;
  // floor (slight undulation so the base isn't a ruler line)
  let baseY = h * (0.62 + rand() * 0.10);
  out.push(`L 0 ${baseY.toFixed(1)}`);
  while (x < w) {
    const bw = (1.5 + rand() * 7) / density;
    const bh = h * (0.30 + rand() * 0.65);
    const lean = (rand() - 0.5) * bw * 1.6;
    const tipX = x + bw * 0.5 + lean;
    const tipY = h - bh;
    const nextX = x + bw;
    const nextBaseY = h * (0.55 + rand() * 0.18);
    // up to tip
    const upCpX = x + bw * 0.25 + lean * 0.3;
    const upCpY = h - bh * 0.55;
    // down to next base
    const dnCpX = x + bw * 0.75 + lean * 0.7;
    const dnCpY = h - bh * 0.55;
    out.push(
      `Q ${upCpX.toFixed(1)} ${upCpY.toFixed(1)} ${(tipX - 0.15).toFixed(1)} ${tipY.toFixed(1)}`,
      `L ${(tipX + 0.15).toFixed(1)} ${tipY.toFixed(1)}`,
      `Q ${dnCpX.toFixed(1)} ${dnCpY.toFixed(1)} ${nextX.toFixed(1)} ${nextBaseY.toFixed(1)}`,
    );
    x = nextX;
    baseY = nextBaseY;
  }
  out.push(`L ${w} ${h}`, 'Z');
  return out.join(' ');
}

// ─── Hero foreground blades ──────────────────────────────────────────
// Individual prominent blades drawn in front of the silhouette layers.
// Each gets its own color (varied hue/lightness for natural feel) and
// catches a warm dawn rim via drop-shadow. ~30-50 of these.
type HeroBlade = { d: string; fill: string };
function generateHeroBlades(
  seed: number,
  w: number,
  h: number,
  count: number,
): HeroBlade[] {
  const rand = makePrng(seed);
  const blades: HeroBlade[] = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const height = h * (0.55 + rand() * 0.55);
    const lean = (rand() - 0.5) * 18;
    const width = 0.6 + rand() * 1.4;
    const tipX = x + lean;
    const tipY = h - height;
    const cpX = x + lean * 0.5;
    const cpY = h - height * 0.55;
    const hue = 90 + rand() * 40;            // 90–130
    const sat = 28 + rand() * 38;            // 28–66%
    const light = 12 + rand() * 22;          // 12–34%
    const fill = `hsla(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%, 0.95)`;
    const d =
      `M ${(x - width / 2).toFixed(1)} ${h} ` +
      `Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${(tipX - 0.18).toFixed(1)} ${tipY.toFixed(1)} ` +
      `L ${(tipX + 0.18).toFixed(1)} ${tipY.toFixed(1)} ` +
      `Q ${(cpX + width * 0.6).toFixed(1)} ${cpY.toFixed(1)} ${(x + width / 2).toFixed(1)} ${h} Z`;
    blades.push({ d, fill });
  }
  return blades;
}

// ─── Procedural tree (recursive branches + leaf clusters) ────────────
type TreeBranch = { x1: number; y1: number; x2: number; y2: number; w: number };
type TreeLeaf = { x: number; y: number; r: number; tone: number };
type TreeData = { branches: TreeBranch[]; leaves: TreeLeaf[] };

function growBranch(
  x: number, y: number,
  angle: number, length: number,
  thickness: number, depth: number,
  out: TreeData,
  rand: () => number,
): void {
  const x2 = x + Math.cos(angle) * length;
  const y2 = y + Math.sin(angle) * length;
  out.branches.push({ x1: x, y1: y, x2, y2, w: thickness });
  if (depth <= 0) {
    // tip: dense leaf cluster
    const n = 5 + Math.floor(rand() * 6);
    for (let i = 0; i < n; i++) {
      const r = 3 + rand() * 5;
      out.leaves.push({
        x: x2 + (rand() - 0.5) * 16,
        y: y2 + (rand() - 0.5) * 16,
        r,
        tone: rand(), // 0..1 for color variation
      });
    }
    return;
  }
  // 2-3 child branches with realistic spread
  const numChildren = 2 + (rand() < 0.45 ? 1 : 0);
  const spread = 0.75 + rand() * 0.35; // total angular spread between children
  for (let i = 0; i < numChildren; i++) {
    const t = numChildren === 1 ? 0.5 : i / (numChildren - 1);
    const childAngle =
      angle + (t - 0.5) * spread + (rand() - 0.5) * 0.25;
    const childLength = length * (0.62 + rand() * 0.22);
    const childThickness = Math.max(0.6, thickness * (0.60 + rand() * 0.18));
    growBranch(x2, y2, childAngle, childLength, childThickness, depth - 1, out, rand);
    // sprinkle a few leaves along longer parent branches for fullness
    if (depth >= 2 && rand() < 0.35) {
      out.leaves.push({
        x: x + (x2 - x) * (0.4 + rand() * 0.4),
        y: y + (y2 - y) * (0.4 + rand() * 0.4),
        r: 2 + rand() * 3,
        tone: rand(),
      });
    }
  }
}

function generateTree(seed: number): TreeData {
  const rand = makePrng(seed);
  const out: TreeData = { branches: [], leaves: [] };
  // Trunk grows up from BELOW the viewBox bottom so its base extends
  // into the grass / ground rather than terminating awkwardly at the
  // visible edge. SVG overflow:visible lets it draw past viewBox.
  // viewBox is 240x340 — start at y=370 (30px below).
  growBranch(120, 370, -Math.PI / 2, 115, 12, 5, out, rand);
  return out;
}

// ─── Styles ──────────────────────────────────────────────────────────
const STYLES = `
:root {
  --hp-scroll: 0;        /* 0 → 1 page scroll progress */
  --hp-sky-mix: 0;       /* 0 = midnight, 1 = full dawn */
  --hp-stars: 1;         /* 1 = bright, 0 = faded */
  --hp-sun-y: 110%;      /* sun centre y, % of viewport */
  --hp-sun-glow: 0;      /* 0 → 1 */
  --hp-night: 1;         /* 1 - sky-mix; for night-only layers */
  --hp-seven: 0;         /* 0 → 1, heptagram reveal progress */
  --hp-aurora: 1;        /* 1 at top, fades by mid-scroll */
}

.homepage-bg-root {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.homepage-bg-root ~ * {
  position: relative;
  z-index: 1;
}
body:has(.homepage-bg-root) .cosmos-root {
  display: none;
}

/* ─── 01. Sky gradient (deepened) ─────────────────────────────────── */
.homepage-bg-sky {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to bottom,
      rgba(4, 6, 14, 1) 0%,
      rgba(8, 11, 22, 1) 22%,
      rgba(
        calc(18 + 55 * var(--hp-sky-mix)),
        calc(18 + 22 * var(--hp-sky-mix)),
        calc(38 + 34 * var(--hp-sky-mix)),
        1
      ) 50%,
      rgba(
        calc(55 + 150 * var(--hp-sky-mix)),
        calc(36 + 90 * var(--hp-sky-mix)),
        calc(68 + 36 * var(--hp-sky-mix)),
        1
      ) 78%,
      rgba(
        calc(38 + 210 * var(--hp-sky-mix)),
        calc(22 + 158 * var(--hp-sky-mix)),
        calc(48 + 60 * var(--hp-sky-mix)),
        1
      ) 100%
    );
  transition: background 200ms linear;
}

/* ─── 02. Aurora curtains (deep night only) ───────────────────────── */
.homepage-bg-aurora {
  position: absolute;
  inset: 0;
  opacity: calc(var(--hp-aurora) * 0.55);
  background:
    radial-gradient(ellipse 60% 80% at 18% 22%, rgba(70, 140, 200, 0.16) 0%, transparent 60%),
    radial-gradient(ellipse 50% 70% at 78% 28%, rgba(120, 90, 200, 0.13) 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 50% 8%,  rgba(40, 200, 180, 0.08) 0%, transparent 65%);
  mix-blend-mode: screen;
  animation: aurora-drift 28s ease-in-out infinite alternate;
}
@keyframes aurora-drift {
  0%   { transform: translate3d(-1.2%, 0, 0) scale(1.00); }
  100% { transform: translate3d( 1.2%, 0, 0) scale(1.03); }
}

/* ─── 03/04/05. Star layers ───────────────────────────────────────── */
.homepage-bg-stars {
  position: absolute;
  inset: -10% 0; /* extra height so parallax doesn't reveal edges */
  opacity: var(--hp-stars);
  transition: opacity 240ms linear;
  will-change: transform;
}
.homepage-bg-stars--far {
  transform: translate3d(0, calc(var(--hp-scroll) * -3vh), 0);
}
.homepage-bg-stars--mid {
  transform: translate3d(0, calc(var(--hp-scroll) * -8vh), 0);
}
.homepage-bg-stars--near {
  transform: translate3d(0, calc(var(--hp-scroll) * -16vh), 0);
}
.homepage-bg-star {
  position: absolute;
  border-radius: 50%;
  background: #FCFAF6;
  box-shadow: 0 0 4px rgba(252, 250, 246, 0.4);
  animation-name: star-twinkle;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-direction: alternate;
  will-change: opacity, transform;
}
.homepage-bg-stars--near .homepage-bg-star {
  box-shadow: 0 0 6px rgba(252, 250, 246, 0.7);
}
@keyframes star-twinkle {
  0%   { opacity: var(--star-a-min); transform: scale(0.92); }
  100% { opacity: var(--star-a-max); transform: scale(1.06); }
}

/* ─── 06. Shooting stars (night only) ─────────────────────────────── */
.homepage-bg-shooting {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--hp-night);
}
.homepage-bg-shoot {
  position: absolute;
  width: 140px;
  height: 2px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0) 0%,
    rgba(255,250,235,0.95) 60%,
    rgba(255,255,255,1) 100%);
  border-radius: 999px;
  filter: drop-shadow(0 0 6px rgba(255,250,235,0.7));
  transform-origin: 100% 50%;
  opacity: 0;
}
.homepage-bg-shoot--a {
  top: 14%; left: -20%;
  animation: shoot-a 14s linear infinite;
  animation-delay: 2s;
}
.homepage-bg-shoot--b {
  top: 28%; left: -20%;
  animation: shoot-b 22s linear infinite;
  animation-delay: 9s;
}
.homepage-bg-shoot--c {
  top: 38%; left: -20%;
  animation: shoot-c 18s linear infinite;
  animation-delay: 15s;
}
@keyframes shoot-a {
  0%   { transform: translate3d(0,0,0) rotate(18deg); opacity: 0; }
  4%   { opacity: 1; }
  8%   { transform: translate3d(75vw, 22vh, 0) rotate(18deg); opacity: 0; }
  100% { transform: translate3d(75vw, 22vh, 0) rotate(18deg); opacity: 0; }
}
@keyframes shoot-b {
  0%   { transform: translate3d(0,0,0) rotate(12deg); opacity: 0; }
  3%   { opacity: 1; }
  7%   { transform: translate3d(85vw, 15vh, 0) rotate(12deg); opacity: 0; }
  100% { transform: translate3d(85vw, 15vh, 0) rotate(12deg); opacity: 0; }
}
@keyframes shoot-c {
  0%   { transform: translate3d(0,0,0) rotate(22deg); opacity: 0; }
  4%   { opacity: 1; }
  9%   { transform: translate3d(70vw, 26vh, 0) rotate(22deg); opacity: 0; }
  100% { transform: translate3d(70vw, 26vh, 0) rotate(22deg); opacity: 0; }
}

/* ─── 07. Heptagram yantra — continuous celestial wheel ───────────
   Layered sacred geometry built on the seven-vertex ring. Visible
   throughout the scroll; the whole SVG rotates slowly on a long loop
   and each individual layer breathes on its own long period (35–60s,
   phase-offset) so the geometry feels alive without flashing. Brass
   tones throughout. Receives a small brightness boost while crossing
   the "Seven" content band so the section still feels like its
   visual peak. */
.homepage-bg-heptagram {
  position: absolute;
  top: 12%;
  left: 50%;
  transform: translate(-50%, 0);
  width: clamp(380px, 44vw, 580px);
  aspect-ratio: 1 / 1;
  /* base opacity ~0.42 always, lifts to ~0.78 around the Seven band */
  opacity: calc(0.42 + var(--hp-seven) * 0.36);
  pointer-events: none;
  transition: opacity 240ms linear;
}
.homepage-bg-heptagram svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  transform-origin: 50% 50%;
  animation: yantra-rotate 220s linear infinite;
}
.homepage-bg-heptagram .hep-glow {
  fill: rgba(244, 200, 130, 0.10);
  filter: blur(10px);
  animation: yantra-glow 18s ease-in-out infinite alternate;
}
.homepage-bg-heptagram path,
.homepage-bg-heptagram circle,
.homepage-bg-heptagram line {
  stroke-linecap: round;
}

/* Shared base styling per layer — opacity drives the breath cycle. */
.hep-ring-outer {
  fill: none;
  stroke: rgba(244, 200, 130, 0.55);
  stroke-width: 0.22;
  filter: drop-shadow(0 0 1.2px rgba(244, 200, 130, 0.35));
  animation: layer-breath 38s ease-in-out -2s  infinite alternate;
}
.hep-ticks {
  fill: none;
  stroke: rgba(244, 200, 130, 0.70);
  stroke-width: 0.34;
  animation: layer-breath 44s ease-in-out -8s  infinite alternate;
}
.hep-heptagon {
  fill: none;
  stroke: rgba(244, 200, 130, 0.55);
  stroke-width: 0.26;
  filter: drop-shadow(0 0 1.2px rgba(244, 200, 130, 0.30));
  animation: layer-breath 41s ease-in-out -14s infinite alternate;
}
.hep-star-72 {
  fill: none;
  stroke: rgba(244, 200, 130, 0.58);
  stroke-width: 0.28;
  filter: drop-shadow(0 0 1.4px rgba(244, 200, 130, 0.35));
  animation: layer-breath 49s ease-in-out -20s infinite alternate;
}
.hep-star-73 {
  fill: none;
  stroke: rgba(244, 200, 130, 0.78);
  stroke-width: 0.36;
  filter: drop-shadow(0 0 1.8px rgba(244, 200, 130, 0.55));
  animation: layer-breath 56s ease-in-out -26s infinite alternate;
}
.hep-spokes {
  fill: none;
  stroke: rgba(244, 200, 130, 0.40);
  stroke-width: 0.16;
  animation: layer-breath 35s ease-in-out -5s  infinite alternate;
}
.hep-ring-inner {
  fill: none;
  stroke: rgba(244, 200, 130, 0.65);
  stroke-width: 0.26;
  animation: layer-breath 47s ease-in-out -32s infinite alternate;
}
.hep-star-inner {
  fill: none;
  stroke: rgba(244, 200, 130, 0.72);
  stroke-width: 0.30;
  filter: drop-shadow(0 0 1.5px rgba(244, 200, 130, 0.50));
  animation: layer-breath 53s ease-in-out -38s infinite alternate;
}
.hep-vertex {
  fill: #FCFAF6;
  filter: drop-shadow(0 0 2.5px rgba(252, 250, 246, 0.85));
  animation: vertex-twinkle 28s ease-in-out -10s infinite alternate;
  transform-origin: center;
}
.hep-bindu {
  fill: rgba(255, 230, 180, 0.98);
  filter: drop-shadow(0 0 3px rgba(255, 220, 160, 0.85));
  animation: vertex-twinkle 24s ease-in-out infinite alternate;
  transform-origin: center;
}

@keyframes yantra-rotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes layer-breath {
  0%   { opacity: 0.35; }
  100% { opacity: 1; }
}
@keyframes vertex-twinkle {
  0%   { opacity: 0.45; transform: scale(0.85); }
  100% { opacity: 1;    transform: scale(1.15); }
}
@keyframes yantra-glow {
  0%   { opacity: 0.6; }
  100% { opacity: 1; }
}

/* ─── 08. Horizon haze ────────────────────────────────────────────── */
.homepage-bg-horizon {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 42vh;
  background: linear-gradient(
    to top,
    rgba(244, 200, 130, calc(var(--hp-sky-mix) * 0.60)) 0%,
    rgba(220, 130,  90, calc(var(--hp-sky-mix) * 0.38)) 30%,
    rgba(120,  60, 100, calc(var(--hp-sky-mix) * 0.20)) 60%,
    rgba(0,0,0,0) 100%
  );
  mix-blend-mode: screen;
}

/* ─── 09. Wisp clouds (drifting) ──────────────────────────────────── */
.homepage-bg-wisps {
  position: absolute;
  bottom: 8vh; left: -10%; right: -10%;
  height: 22vh;
  opacity: calc(var(--hp-sky-mix) * 0.65);
  background:
    radial-gradient(ellipse at 25% 70%, rgba(255, 220, 170, 0.20) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(255, 200, 150, 0.16) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 80%, rgba(255, 230, 190, 0.12) 0%, transparent 60%);
  mix-blend-mode: screen;
  animation: wisp-drift 90s linear infinite alternate;
}
@keyframes wisp-drift {
  0%   { transform: translate3d(-4%, 0, 0); }
  100% { transform: translate3d( 4%, 0, 0); }
}

/* ─── 10. Volumetric godrays ─────────────────────────────────────── */
.homepage-bg-godrays {
  position: absolute;
  top: var(--hp-sun-y);
  left: 50%;
  width: 220vmax;
  height: 220vmax;
  transform: translate(-50%, -50%);
  opacity: calc(var(--hp-sun-glow) * 0.55);
  pointer-events: none;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent       0deg,
    rgba(255,220,160,0.10) 3deg,
    transparent       6deg,
    transparent      18deg,
    rgba(255,210,150,0.08) 21deg,
    transparent      24deg,
    transparent      40deg,
    rgba(255,220,160,0.09) 43deg,
    transparent      46deg,
    transparent      62deg,
    rgba(255,200,140,0.07) 65deg,
    transparent      68deg,
    transparent      90deg,
    rgba(255,220,160,0.10) 93deg,
    transparent      96deg,
    transparent     120deg,
    rgba(255,210,150,0.07) 123deg,
    transparent     126deg,
    transparent     150deg,
    rgba(255,220,160,0.09) 153deg,
    transparent     156deg,
    transparent     180deg,
    rgba(255,220,160,0.10) 183deg,
    transparent     186deg,
    transparent     210deg,
    rgba(255,200,140,0.07) 213deg,
    transparent     216deg,
    transparent     240deg,
    rgba(255,220,160,0.09) 243deg,
    transparent     246deg,
    transparent     270deg,
    rgba(255,220,160,0.10) 273deg,
    transparent     276deg,
    transparent     300deg,
    rgba(255,210,150,0.08) 303deg,
    transparent     306deg,
    transparent     330deg,
    rgba(255,220,160,0.09) 333deg,
    transparent     336deg
  );
  mix-blend-mode: screen;
  -webkit-mask: radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%);
          mask: radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%);
  animation: godray-rotate 240s linear infinite;
}
@keyframes godray-rotate {
  0%   { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ─── 11/12. Sun corona + core ────────────────────────────────────── */
.homepage-bg-sun {
  position: absolute;
  left: 50%;
  top: var(--hp-sun-y);
  width: clamp(440px, 62vw, 760px);
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
  opacity: var(--hp-sun-glow);
  pointer-events: none;
  transition: opacity 200ms linear;
}
.homepage-bg-sun-core {
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 240, 200, 0.98) 0%,
    rgba(244, 200, 130, 0.88) 30%,
    rgba(220, 140,  80, 0.50) 60%,
    rgba(0,0,0,0) 100%
  );
  filter: blur(6px);
  animation: corona-breathe 6s ease-in-out infinite alternate;
}
.homepage-bg-sun-corona {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 150, 0.50) 0%,
    rgba(220, 140,  80, 0.24) 30%,
    rgba(120,  50,  80, 0.08) 60%,
    rgba(0,0,0,0) 90%
  );
  filter: blur(22px);
  animation: corona-breathe 6s ease-in-out infinite alternate-reverse;
}
@keyframes corona-breathe {
  0%   { transform: scale(0.97); opacity: 0.92; }
  100% { transform: scale(1.04); opacity: 1.00; }
}

/* ─── 13. Lens flare ghosts ───────────────────────────────────────── */
/* JJ-style chromatic circles along the sun-to-opposite-corner axis.
   Positioned relative to viewport so they trace from the sun up to
   the top-left, giving the impression of light bouncing through glass. */
.homepage-bg-flare {
  position: absolute;
  inset: 0;
  opacity: calc(var(--hp-sun-glow) * 0.85);
  pointer-events: none;
  mix-blend-mode: screen;
  transition: opacity 200ms linear;
}
.homepage-bg-flare-streak {
  position: absolute;
  top: var(--hp-sun-y);
  left: 50%;
  width: 180vw;
  height: 14px;
  transform: translate(-50%, -50%) rotate(-12deg);
  background: linear-gradient(90deg,
    rgba(255,255,255,0) 0%,
    rgba(255,235,180,0.05) 35%,
    rgba(255,235,180,0.30) 50%,
    rgba(255,235,180,0.05) 65%,
    rgba(255,255,255,0) 100%);
  filter: blur(2px);
}
.homepage-bg-flare-streak-v {
  position: absolute;
  top: var(--hp-sun-y);
  left: 50%;
  width: 6px;
  height: 220vh;
  transform: translate(-50%, -50%);
  background: linear-gradient(180deg,
    rgba(255,255,255,0) 0%,
    rgba(255,225,170,0.10) 38%,
    rgba(255,235,180,0.35) 50%,
    rgba(255,225,170,0.10) 62%,
    rgba(255,255,255,0) 100%);
  filter: blur(1px);
}
.homepage-bg-flare-ghost {
  position: absolute;
  border-radius: 50%;
  filter: blur(4px);
  mix-blend-mode: screen;
}
/* Six ghosts along the axis from sun (bottom-centre) toward top-left.
   We position them via top/left with viewport units offset from sun. */
.homepage-bg-flare-ghost--1 { width: 90px;  height: 90px;
  top: calc(var(--hp-sun-y) - 12vh); left: calc(50% - 8vw);
  background: radial-gradient(circle, rgba(255,200,150,0.45) 0%, transparent 70%); }
.homepage-bg-flare-ghost--2 { width: 50px;  height: 50px;
  top: calc(var(--hp-sun-y) - 24vh); left: calc(50% - 16vw);
  background: radial-gradient(circle, rgba(170,220,255,0.40) 0%, transparent 70%); }
.homepage-bg-flare-ghost--3 { width: 140px; height: 140px;
  top: calc(var(--hp-sun-y) - 36vh); left: calc(50% - 22vw);
  background: radial-gradient(circle, rgba(255,170,200,0.28) 0%, transparent 70%); }
.homepage-bg-flare-ghost--4 { width: 32px;  height: 32px;
  top: calc(var(--hp-sun-y) - 48vh); left: calc(50% - 28vw);
  background: radial-gradient(circle, rgba(255,240,180,0.55) 0%, transparent 70%); }
.homepage-bg-flare-ghost--5 { width: 200px; height: 200px;
  top: calc(var(--hp-sun-y) - 62vh); left: calc(50% - 34vw);
  background: radial-gradient(circle, rgba(180,150,255,0.22) 0%, transparent 70%); }
.homepage-bg-flare-ghost--6 { width: 70px;  height: 70px;
  top: calc(var(--hp-sun-y) - 76vh); left: calc(50% - 40vw);
  background: radial-gradient(circle, rgba(255,210,160,0.35) 0%, transparent 70%); }

/* ─── 14. Vignette ────────────────────────────────────────────────── */
.homepage-bg-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 100% 80% at 50% 40%,
    transparent 0%,
    transparent 55%,
    rgba(0,0,0,0.35) 100%
  );
}

/* ─── 15. Film grain (very subtle) ────────────────────────────────── */
.homepage-bg-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.08;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 160px 160px;
}

/* ─── 16. Grassy horizon ──────────────────────────────────────────────
   A silhouette of grass blades at the very bottom edge. Backlit by the
   risen sun — the body is near-black, with a thin warm rim glow above
   the tips so each blade reads as catching the dawn light. Three
   parallax layers (back blurred, mid soft, front sharp). Only appears
   as scroll passes the dawn band (≈70% onward), and sways gently. */
.homepage-bg-grass {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: none;
  opacity: clamp(0, calc((var(--hp-scroll) - 0.62) * 4), 1);
  transition: opacity 200ms linear;
}
.homepage-bg-grass svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform-origin: 50% 100%;
  animation: grass-sway 14s ease-in-out infinite alternate;
}
.homepage-bg-grass-back {
  fill: rgba(34, 62, 42, 0.55);    /* deep sage, atmospheric */
  filter: blur(3px);
  transform: translateY(8px) scaleY(0.72);
  transform-origin: 50% 100%;
}
.homepage-bg-grass-mid {
  fill: rgba(20, 42, 26, 0.88);    /* mid meadow green */
  filter: blur(0.6px) drop-shadow(0 -2px 4px rgba(244, 200, 130, 0.35));
  transform: translateY(3px) scaleY(0.88);
  transform-origin: 50% 100%;
}
.homepage-bg-grass-front {
  fill: rgba(8, 22, 12, 0.97);     /* dark green silhouette */
  filter: drop-shadow(0 -3px 5px rgba(255, 215, 155, 0.60));
}
/* A lighter highlight pass that draws only on the upper portion of the
   front layer — these are the tips catching the dawn light. Mix-blend
   screen layers warm-green over the dark silhouette so you read both
   "meadow" and "rim light" without losing the silhouette. */
.homepage-bg-grass-highlight {
  fill: rgba(90, 140, 75, 0.55);
  mix-blend-mode: screen;
  filter: drop-shadow(0 -2px 3px rgba(255, 220, 160, 0.35));
}
/* Individual foreground blades — each catches strong dawn light. The
   container draws ABOVE the silhouettes; per-blade hue is set inline.
   The strong warm rim makes them read as 3D blades, not flat shapes. */
.homepage-bg-grass-hero {
  filter: drop-shadow(0 -2px 3px rgba(255, 220, 160, 0.65))
          drop-shadow(0  1px 2px rgba(0, 0, 0, 0.40));
}
@keyframes grass-sway {
  0%   { transform: skewX(-0.6deg) translateY( 0.6px); }
  100% { transform: skewX( 0.6deg) translateY(-0.6px); }
}

/* ─── 17. Lone tree silhouette ────────────────────────────────────────
   Hand-tuned SVG silhouette (trunk + 15 overlapping circles for the
   crown + a few branch strokes). Sits on the grass line, slightly
   right-of-centre. Warm dawn-glow drop-shadow on the lower-left edge
   simulates the sun rising up behind/to-the-left of the tree.
   Gentle wind sway. Reveals with the grass. */
.homepage-bg-tree {
  position: absolute;
  bottom: 30px;      /* trunk base sits ~30px above viewport bottom,
                        well inside the 200px grass layer above */
  right: 8%;
  width: 260px;
  height: 380px;
  pointer-events: none;
  opacity: clamp(0, calc((var(--hp-scroll) - 0.62) * 4), 1);
  transition: opacity 200ms linear;
  filter: drop-shadow(-4px 2px 9px rgba(255, 210, 155, 0.55))
          drop-shadow(0 4px 4px rgba(0, 0, 0, 0.45));
}
/* Soil mound — small dark ellipse at the tree base, suggests a slight
   rise of earth around the trunk. Sits BEHIND the tree, so the trunk
   reads as planted into something solid. */
.homepage-bg-tree-mound {
  position: absolute;
  bottom: 80px;      /* a bit above the very bottom, at grass mid-height */
  right: 3%;
  width: 280px;
  height: 70px;
  pointer-events: none;
  opacity: clamp(0, calc((var(--hp-scroll) - 0.62) * 4), 0.92);
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(5, 12, 7, 0.85) 0%,
    rgba(10, 22, 12, 0.55) 40%,
    rgba(10, 22, 12, 0.20) 70%,
    transparent 100%
  );
  filter: blur(3px);
}
.homepage-bg-tree svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform-origin: 50% 100%;
  animation: tree-sway 22s ease-in-out infinite alternate;
}
.homepage-bg-tree .tree-branches line {
  stroke: rgba(28, 18, 10, 0.97);   /* warm dark bark */
  stroke-linecap: round;
  fill: none;
}
.homepage-bg-tree .tree-leaves circle {
  /* fill set inline per leaf for hue variation */
}
.homepage-bg-tree .tree-leaf-highlight circle {
  fill: rgba(110, 150, 80, 0.45);
  mix-blend-mode: screen;
}
@keyframes tree-sway {
  0%   { transform: rotate(-0.35deg) translateX(-0.5px); }
  100% { transform: rotate( 0.35deg) translateX( 0.5px); }
}

/* ─── 18. Realistic moon ──────────────────────────────────────────────
   Real photograph (Gregory H. Revera, Wikimedia Commons, CC BY-SA 3.0)
   masked to a circle, with a radial-gradient halo for the bloom and a
   subtle inset shadow for sphere-edge limb darkening. Visible during
   the night phase, fades out as the sky brightens. */
.homepage-bg-moon {
  position: absolute;
  top: 6%;
  left: 11%;
  width: 150px;
  height: 150px;
  pointer-events: none;
  opacity: calc(var(--hp-night) * 0.95);
  transition: opacity 240ms linear;
}
.homepage-bg-moon-halo {
  position: absolute;
  inset: -60%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(245, 238, 220, 0.42) 0%,
    rgba(245, 238, 220, 0.20) 22%,
    rgba(245, 238, 220, 0.08) 38%,
    rgba(245, 238, 220, 0) 60%
  );
  pointer-events: none;
}
/* The IMG sits inside a circular crop. The source photo has a thin
   black halo at the edge of the lunar disc, so we scale the image up
   ~14% to push that band outside the crop — only the disc itself
   remains visible. */
.homepage-bg-moon-clip {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  /* Tighten the visible disc INSIDE the rounded clip so any residual
     dark edge of the photo falls outside the visible area. */
  clip-path: circle(47% at 50% 50%);
  overflow: hidden;
  box-shadow: 0 0 28px rgba(245, 238, 220, 0.40);
}
.homepage-bg-moon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.28);
  filter: brightness(1.06) contrast(1.06) saturate(0.95);
}

/* ─── 17. Footer veil ─────────────────────────────────────────────── */
.homepage-bg-footer-veil {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 320px;
  background: linear-gradient(
    to top,
    rgba(8, 12, 24, 0.82) 0%,
    rgba(8, 12, 24, 0.55) 40%,
    rgba(8, 12, 24, 0.25) 75%,
    rgba(8, 12, 24, 0)    100%
  );
  opacity: var(--hp-scroll, 0);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .homepage-bg-sky,
  .homepage-bg-stars,
  .homepage-bg-sun,
  .homepage-bg-flare {
    transition: none;
  }
  .homepage-bg-aurora,
  .homepage-bg-wisps,
  .homepage-bg-godrays,
  .homepage-bg-sun-core,
  .homepage-bg-sun-corona,
  .homepage-bg-star,
  .homepage-bg-shoot,
  .homepage-bg-grass svg,
  .homepage-bg-tree svg,
  .homepage-bg-heptagram svg,
  .homepage-bg-heptagram .hep-glow,
  .hep-ring-outer, .hep-ticks, .hep-heptagon,
  .hep-star-72, .hep-star-73, .hep-spokes,
  .hep-ring-inner, .hep-star-inner,
  .hep-vertex, .hep-bindu {
    animation: none !important;
  }
}
`;

export default function HomepageBackground() {
  const { far, mid, near } = useMemo(() => generateAllStars(STARS_SEED), []);
  const yantra = useMemo(() => buildYantra(), []);
  const grassBack  = useMemo(() => generateGrassPath(1471, 1000, 100, 0.85), []);
  const grassMid   = useMemo(() => generateGrassPath(2903, 1000, 100, 1.15), []);
  const grassFront = useMemo(() => generateGrassPath(5851, 1000, 100, 1.35), []);
  const heroBlades = useMemo(() => generateHeroBlades(8204, 1000, 100, 46), []);
  // Tree seed picked for a balanced asymmetric silhouette.
  const tree       = useMemo(() => generateTree(11371), []);
  // Build moon src once with a cache-buster scoped to the asset, not to
  // every page render — the file is committed in /public.
  const moonSrc    = '/img/moon.jpg';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / max));

      // Sky bias — night dominates the first half.
      const skyMix = Math.pow(progress, 0.85);

      // Stars fade window 25% → 75%.
      const stars = progress < 0.25
        ? 1
        : progress > 0.75
          ? 0
          : 1 - (progress - 0.25) / 0.5;

      // Sun rises after 55%.
      const sunPhase = Math.max(0, (progress - 0.55) / 0.45);
      const sunY = 110 - sunPhase * 35;
      const sunGlow = sunPhase;

      // Aurora is loudest at the very top, gone by 35% scroll.
      const aurora = Math.max(0, 1 - progress / 0.35);

      // Heptagram reveal: triangle wave 0→1→0 across band 32% → 62%.
      // Draws in over first half, holds at full briefly, fades out as
      // the section leaves view.
      let seven = 0;
      if (progress >= 0.30 && progress <= 0.64) {
        const local = (progress - 0.30) / 0.34; // 0 → 1 across the band
        if (local < 0.45) seven = local / 0.45;          // draw in
        else if (local < 0.65) seven = 1;                 // hold
        else seven = Math.max(0, 1 - (local - 0.65) / 0.35); // fade out
      }

      root.style.setProperty('--hp-scroll', progress.toFixed(3));
      root.style.setProperty('--hp-sky-mix', skyMix.toFixed(3));
      root.style.setProperty('--hp-stars', stars.toFixed(3));
      root.style.setProperty('--hp-sun-y', `${sunY.toFixed(1)}%`);
      root.style.setProperty('--hp-sun-glow', sunGlow.toFixed(3));
      root.style.setProperty('--hp-night', (1 - skyMix).toFixed(3));
      root.style.setProperty('--hp-seven', seven.toFixed(3));
      root.style.setProperty('--hp-aurora', aurora.toFixed(3));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      ['--hp-scroll','--hp-sky-mix','--hp-stars','--hp-sun-y','--hp-sun-glow',
       '--hp-night','--hp-seven','--hp-aurora',
      ].forEach(v => root.style.removeProperty(v));
    };
  }, []);

  const renderStarLayer = (layer: Star[], cls: string) => (
    <div className={`homepage-bg-stars ${cls}`}>
      {layer.map((s, i) => (
        <span
          key={i}
          className="homepage-bg-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r}px`,
            height: `${s.r}px`,
            // base alpha drives both ends of the twinkle range
            ['--star-a-min' as string]: (s.alpha * 0.55).toFixed(3),
            ['--star-a-max' as string]: s.alpha.toFixed(3),
            opacity: s.alpha,
            animationDuration: `${s.twinkleDur.toFixed(2)}s`,
            animationDelay: `${s.twinkleDelay.toFixed(2)}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="homepage-bg-root" aria-hidden="true">
        <div className="homepage-bg-sky" />
        <div className="homepage-bg-aurora" />

        {renderStarLayer(far, 'homepage-bg-stars--far')}
        {renderStarLayer(mid, 'homepage-bg-stars--mid')}
        {renderStarLayer(near, 'homepage-bg-stars--near')}

        {/* Real photographic moon (Wikimedia Commons / G. H. Revera) —
            masked to a circle, halo behind it for the bloom. Visible
            during the night phase, fades as the sky brightens. */}
        <div className="homepage-bg-moon">
          <div className="homepage-bg-moon-halo" />
          <div className="homepage-bg-moon-clip">
            <img src={moonSrc} alt="" aria-hidden="true" loading="eager" />
          </div>
        </div>

        <div className="homepage-bg-shooting">
          <div className="homepage-bg-shoot homepage-bg-shoot--a" />
          <div className="homepage-bg-shoot homepage-bg-shoot--b" />
          <div className="homepage-bg-shoot homepage-bg-shoot--c" />
        </div>

        <div className="homepage-bg-heptagram">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* soft glow disc behind everything */}
            <circle cx="50" cy="50" r="46" className="hep-glow" />

            {/* 01: outer ring */}
            <circle cx="50" cy="50" r="45" className="hep-ring-outer" />

            {/* 02: vertex ticks just inside the ring */}
            <path d={yantra.ticks} className="hep-ticks" />

            {/* 02: inscribed heptagon */}
            <path d={yantra.heptagon} className="hep-heptagon" />

            {/* 03: {7/2} alternate star polygon */}
            <path d={yantra.star72} className="hep-star-72" />

            {/* 04: {7/3} main heptagram — the prominent feature */}
            <path d={yantra.star73} className="hep-star-73" />

            {/* 05: radial spokes from centre to each vertex */}
            <path d={yantra.spokes} className="hep-spokes" />

            {/* 06: inner ring */}
            <circle cx="50" cy="50" r="13" className="hep-ring-inner" />

            {/* 07: inner mini {7/3} heptagram */}
            <path d={yantra.innerStar73} className="hep-star-inner" />

            {/* 08: vertex pinpricks at each of the 7 outer points */}
            {yantra.outerPts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.9" className="hep-vertex" />
            ))}

            {/* 08: central bindu (point of unity) */}
            <circle cx="50" cy="50" r="1.0" className="hep-bindu" />
          </svg>
        </div>

        <div className="homepage-bg-horizon" />
        <div className="homepage-bg-wisps" />

        <div className="homepage-bg-godrays" />

        <div className="homepage-bg-sun">
          <div className="homepage-bg-sun-corona" />
          <div className="homepage-bg-sun-core" />
        </div>

        <div className="homepage-bg-flare">
          <div className="homepage-bg-flare-streak" />
          <div className="homepage-bg-flare-streak-v" />
          <div className="homepage-bg-flare-ghost homepage-bg-flare-ghost--1" />
          <div className="homepage-bg-flare-ghost homepage-bg-flare-ghost--2" />
          <div className="homepage-bg-flare-ghost homepage-bg-flare-ghost--3" />
          <div className="homepage-bg-flare-ghost homepage-bg-flare-ghost--4" />
          <div className="homepage-bg-flare-ghost homepage-bg-flare-ghost--5" />
          <div className="homepage-bg-flare-ghost homepage-bg-flare-ghost--6" />
        </div>

        {/* Soil mound behind the tree — soft dark elliptical patch
            so the trunk reads as rooted into a small rise of earth. */}
        <div className="homepage-bg-tree-mound" />

        {/* Lone tree — procedurally grown: recursive branches with
            natural taper + dense leaf clusters at each tip. Rendered
            before grass so the front blades overlap the trunk base. */}
        <div className="homepage-bg-tree">
          <svg viewBox="0 0 240 340" preserveAspectRatio="xMidYEnd meet">
            {/* branches: stroke-width per branch via the procedural data */}
            <g className="tree-branches">
              {tree.branches.map((b, i) => (
                <line
                  key={`b${i}`}
                  x1={b.x1}
                  y1={b.y1}
                  x2={b.x2}
                  y2={b.y2}
                  strokeWidth={b.w}
                />
              ))}
            </g>
            {/* leaves: dark-green base */}
            <g className="tree-leaves">
              {tree.leaves.map((l, i) => (
                <circle
                  key={`l${i}`}
                  cx={l.x}
                  cy={l.y}
                  r={l.r}
                  fill={`hsla(${(105 + l.tone * 28).toFixed(0)}, ${(28 + l.tone * 22).toFixed(0)}%, ${(7 + l.tone * 11).toFixed(0)}%, 0.94)`}
                />
              ))}
            </g>
            {/* leaves: warm highlight on a third of clusters facing the
                rising sun (lower-left of each cluster) — screen blend
                makes them read as catching dawn light without losing
                the silhouette */}
            <g className="tree-leaf-highlight">
              {tree.leaves.filter((_, i) => i % 3 === 0).map((l, i) => (
                <circle
                  key={`h${i}`}
                  cx={l.x - l.r * 0.35}
                  cy={l.y + l.r * 0.25}
                  r={l.r * 0.55}
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="homepage-bg-vignette" />
        <div className="homepage-bg-grain" />

        <div className="homepage-bg-grass">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d={grassBack}  className="homepage-bg-grass-back"  />
            <path d={grassMid}   className="homepage-bg-grass-mid"   />
            <path d={grassFront} className="homepage-bg-grass-front" />
            {/* highlight: re-uses the front silhouette path, painted in
                screen-blend warm-green to light the tips */}
            <path d={grassFront} className="homepage-bg-grass-highlight" />
            {/* hero blades: individual leaning curved blades that
                stand proud of the silhouette and catch strong dawn
                light — each has its own hue/lightness for natural
                variation across the meadow */}
            <g className="homepage-bg-grass-hero">
              {heroBlades.map((b, i) => (
                <path key={`hb${i}`} d={b.d} fill={b.fill} />
              ))}
            </g>
          </svg>
        </div>

        <div className="homepage-bg-footer-veil" />
      </div>
    </>
  );
}
