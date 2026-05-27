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

// ─── Heptagram vertices ──────────────────────────────────────────────
// 7 points on a circle, connected as {7/3} star polygon. Coordinates in
// percentage of an SVG viewBox (100×100 square). Centred at (50, 50)
// with radius 45 — caller scales/positions the SVG itself.
function heptagramPoints(): { x: number; y: number }[] {
  const cx = 50, cy = 50, r = 45;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 7; i++) {
    // Start at top (-90°), evenly spaced
    const theta = (-Math.PI / 2) + (i * (2 * Math.PI) / 7);
    pts.push({
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    });
  }
  return pts;
}

// Connect every 3rd point (i → i+3 mod 7) to draw the heptagram.
function heptagramPath(pts: { x: number; y: number }[]): string {
  const order = [0, 3, 6, 2, 5, 1, 4, 0]; // closes back to 0
  return order
    .map((idx, i) => (i === 0 ? 'M' : 'L') + pts[idx].x + ' ' + pts[idx].y)
    .join(' ');
}

// ─── Grass silhouette ────────────────────────────────────────────────
// Procedural grass-blade path across a 1000-unit-wide horizon. Each
// "blade" is a triangle: a base point, a peak, then back down to the
// next base point. Heights vary so the silhouette feels natural.
// Three layers (back/mid/front) with different seeds give parallax depth.
function generateGrassPath(seed: number, w = 1000, h = 100): string {
  const rand = makePrng(seed);
  const out: string[] = [`M 0 ${h}`, `L 0 ${(h * 0.55).toFixed(1)}`];
  let x = 0;
  while (x < w) {
    const bladeWidth = 2.5 + rand() * 11;            // 2.5–13.5 units
    const bladeHeight = h * (0.30 + rand() * 0.60);  // tip at 30–90% of h
    const baseY = h * (0.55 + rand() * 0.18);
    const tipX = x + bladeWidth * 0.5;
    const tipY = h - bladeHeight;
    const nextX = x + bladeWidth;
    out.push(`L ${tipX.toFixed(1)} ${tipY.toFixed(1)}`);
    out.push(`L ${nextX.toFixed(1)} ${baseY.toFixed(1)}`);
    x = nextX;
  }
  out.push(`L ${w} ${h}`, 'Z');
  return out.join(' ');
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

/* ─── 07. Heptagram constellation reveal ──────────────────────────── */
.homepage-bg-heptagram {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translate(-50%, 0);
  width: clamp(360px, 42vw, 560px);
  aspect-ratio: 1 / 1;
  opacity: calc(var(--hp-seven) * var(--hp-night));
  pointer-events: none;
  transition: opacity 240ms linear;
}
.homepage-bg-heptagram svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.homepage-bg-heptagram .hep-line {
  fill: none;
  stroke: rgba(244, 200, 130, 0.62);
  stroke-width: 0.35;
  stroke-linecap: round;
  filter: drop-shadow(0 0 2px rgba(244, 200, 130, 0.45));
  /* total path length is ~393 (7 chords × ~56). Set generously and
     animate dashoffset via CSS var. */
  stroke-dasharray: 420;
  stroke-dashoffset: calc(420 * (1 - var(--hp-seven)));
}
.homepage-bg-heptagram .hep-vertex {
  fill: #FCFAF6;
  filter: drop-shadow(0 0 4px rgba(252, 250, 246, 0.85));
}
.homepage-bg-heptagram .hep-glow {
  fill: rgba(244, 200, 130, 0.18);
  filter: blur(8px);
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
  height: 110px;
  pointer-events: none;
  opacity: clamp(0, calc((var(--hp-scroll) - 0.65) * 4), 1);
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
  fill: rgba(10, 9, 7, 0.55);
  filter: blur(2.5px);
  transform: translateY(8px) scaleY(0.72);
  transform-origin: 50% 100%;
}
.homepage-bg-grass-mid {
  fill: rgba(6, 5, 4, 0.85);
  filter: blur(0.6px) drop-shadow(0 -2px 4px rgba(244, 200, 130, 0.30));
  transform: translateY(3px) scaleY(0.88);
  transform-origin: 50% 100%;
}
.homepage-bg-grass-front {
  fill: rgba(0, 0, 0, 0.98);
  filter: drop-shadow(0 -3px 5px rgba(255, 210, 150, 0.55));
}
@keyframes grass-sway {
  0%   { transform: skewX(-0.6deg) translateY( 0.6px); }
  100% { transform: skewX( 0.6deg) translateY(-0.6px); }
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
  .homepage-bg-grass svg {
    animation: none !important;
  }
}
`;

export default function HomepageBackground() {
  const { far, mid, near } = useMemo(() => generateAllStars(STARS_SEED), []);
  const hepPts = useMemo(() => heptagramPoints(), []);
  const hepPath = useMemo(() => heptagramPath(hepPts), [hepPts]);
  const grassBack  = useMemo(() => generateGrassPath(1471, 1000, 100), []);
  const grassMid   = useMemo(() => generateGrassPath(2903, 1000, 100), []);
  const grassFront = useMemo(() => generateGrassPath(5851, 1000, 100), []);

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
       '--hp-night','--hp-seven','--hp-aurora'].forEach(v => root.style.removeProperty(v));
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

        <div className="homepage-bg-shooting">
          <div className="homepage-bg-shoot homepage-bg-shoot--a" />
          <div className="homepage-bg-shoot homepage-bg-shoot--b" />
          <div className="homepage-bg-shoot homepage-bg-shoot--c" />
        </div>

        <div className="homepage-bg-heptagram">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* soft glow disc behind */}
            <circle cx="50" cy="50" r="46" className="hep-glow" />
            {/* the heptagram path */}
            <path d={hepPath} className="hep-line" />
            {/* the 7 vertex stars */}
            {hepPts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.9" className="hep-vertex" />
            ))}
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

        <div className="homepage-bg-vignette" />
        <div className="homepage-bg-grain" />

        <div className="homepage-bg-grass">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d={grassBack}  className="homepage-bg-grass-back"  />
            <path d={grassMid}   className="homepage-bg-grass-mid"   />
            <path d={grassFront} className="homepage-bg-grass-front" />
          </svg>
        </div>

        <div className="homepage-bg-footer-veil" />
      </div>
    </>
  );
}
