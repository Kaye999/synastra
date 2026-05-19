"use client";

// HomepageBackground.tsx — the homepage's signature: scroll-tied
// night-to-dawn transition with a sun rising at the bottom of the page.
//
// Layered structure (back → front, all position:fixed full-viewport):
//   1. Sky gradient   — midnight at top, dawn warmth at bottom; the
//                        balance shifts as you scroll.
//   2. Stars layer    — a few hundred procedural pinpricks; fade out as
//                        the sky brightens.
//   3. Horizon haze   — thin band of warm light hugging the bottom that
//                        glows when scroll passes ~50%.
//   4. Sun disc       — radial gradient brass core → amber corona → soft
//                        outer glow. Sits below the horizon at the top
//                        of the page, lifts into view past 70%.
//   5. Subtle wisps   — faint cloud strokes near the horizon, optional.
//
// Why CSS variables, not React state: scroll fires 60-200 times/sec on
// modern devices. Updating React state would re-render the whole tree.
// Instead, a single rAF-throttled listener writes to four CSS custom
// properties on :root; the layered gradients consume those vars. Zero
// re-renders. Works with no React-Three-Fiber or canvas overhead.
//
// Respects prefers-reduced-motion: locks the gradient at "early dawn"
// so the visual identity reads without the motion.

import { useEffect, useMemo } from 'react';

const STARS_COUNT = 220;
const SEED = 7777;

// Mulberry32 PRNG so stars are stable across re-renders.
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

type Star = { x: number; y: number; r: number; alpha: number };

function generateStars(count: number, seed: number): Star[] {
  const rand = makePrng(seed);
  const out: Star[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: rand() * 100,
      y: rand() * 60, // bias to the upper 60% of the sky (where night lives)
      r: 0.4 + rand() * 1.2,
      alpha: 0.35 + rand() * 0.55,
    });
  }
  return out;
}

const STYLES = `
:root {
  --hp-scroll: 0;       /* 0 → 1, full page scroll progress */
  --hp-sky-mix: 0;      /* 0 = night, 1 = dawn  */
  --hp-stars: 1;        /* 1 = bright, 0 = faded */
  --hp-sun-y: 110%;     /* sun centre y as % of viewport (off-screen below at start) */
  --hp-sun-glow: 0;     /* 0 = no glow, 1 = full corona */
}

.homepage-bg-root {
  position: fixed;
  inset: 0;
  z-index: 0;              /* not -1 — body bg masks negative z children */
  pointer-events: none;
  overflow: hidden;
}
/* Page content needs to sit above the background. Without this every
   element at default z-index would be at the same stacking level. */
.homepage-bg-root ~ * {
  position: relative;
  z-index: 1;
}
/* Hide the global Cosmos when the homepage BG is mounted — they paint
   the same real estate, and Cosmos's nebulae fight the dawn palette. */
body:has(.homepage-bg-root) .cosmos-root {
  display: none;
}

/* ─── 1. Sky gradient ─────────────────────────────────────────────── */
.homepage-bg-sky {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to bottom,
      /* TOP: deep midnight at 0%, very slight warm hint at top during dawn */
      rgba(6, 9, 18, 1) 0%,
      rgba(10, 14, 26, 1) 22%,
      /* MID: indigo → twilight purple as scroll progresses */
      rgba(
        calc(20 + 50 * var(--hp-sky-mix)),
        calc(20 + 20 * var(--hp-sky-mix)),
        calc(40 + 30 * var(--hp-sky-mix)),
        1
      ) 50%,
      /* LOWER: warm twilight that brightens with scroll */
      rgba(
        calc(60 + 140 * var(--hp-sky-mix)),
        calc(40 + 80 * var(--hp-sky-mix)),
        calc(70 + 30 * var(--hp-sky-mix)),
        1
      ) 78%,
      /* BOTTOM: dawn brass at full scroll */
      rgba(
        calc(40 + 200 * var(--hp-sky-mix)),
        calc(25 + 145 * var(--hp-sky-mix)),
        calc(50 + 50 * var(--hp-sky-mix)),
        1
      ) 100%
    );
  transition: background 200ms linear;
}

/* ─── 2. Star layer ───────────────────────────────────────────────── */
.homepage-bg-stars {
  position: absolute;
  inset: 0;
  opacity: var(--hp-stars);
  transition: opacity 240ms linear;
}
.homepage-bg-star {
  position: absolute;
  border-radius: 50%;
  background: #FCFAF6;
  /* glow */
  box-shadow: 0 0 4px rgba(252, 250, 246, 0.4);
}

/* ─── 3. Horizon haze ─────────────────────────────────────────────── */
.homepage-bg-horizon {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40vh;
  background: linear-gradient(
    to top,
    rgba(244, 200, 130, calc(var(--hp-sky-mix) * 0.55)) 0%,
    rgba(220, 130, 90, calc(var(--hp-sky-mix) * 0.35)) 30%,
    rgba(120, 60, 100, calc(var(--hp-sky-mix) * 0.18)) 60%,
    rgba(0, 0, 0, 0) 100%
  );
  mix-blend-mode: screen;
  pointer-events: none;
}

/* ─── 4. Sun disc ─────────────────────────────────────────────────── */
.homepage-bg-sun {
  position: absolute;
  left: 50%;
  top: var(--hp-sun-y);
  width: clamp(420px, 60vw, 720px);
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
    rgba(255, 235, 180, 0.95) 0%,
    rgba(244, 200, 130, 0.85) 30%,
    rgba(220, 140, 80, 0.45) 60%,
    rgba(0, 0, 0, 0) 100%
  );
  filter: blur(6px);
}
.homepage-bg-sun-corona {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 210, 140, 0.45) 0%,
    rgba(220, 140, 80, 0.22) 30%,
    rgba(120, 50, 80, 0.08) 60%,
    rgba(0, 0, 0, 0) 90%
  );
  filter: blur(20px);
}

/* ─── 5. Atmospheric wisps (subtle horizon strokes) ──────────────── */
.homepage-bg-wisps {
  position: absolute;
  bottom: 8vh;
  left: 0;
  right: 0;
  height: 20vh;
  opacity: calc(var(--hp-sky-mix) * 0.6);
  background:
    radial-gradient(ellipse at 25% 70%, rgba(255, 220, 170, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(255, 200, 150, 0.14) 0%, transparent 55%);
  mix-blend-mode: screen;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .homepage-bg-sky,
  .homepage-bg-stars,
  .homepage-bg-sun {
    transition: none;
  }
}
`;

export default function HomepageBackground() {
  const stars = useMemo(() => generateStars(STARS_COUNT, SEED), []);

  // Scroll listener. Updates four CSS custom properties on :root via rAF.
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

      // Map scroll progress → sky / stars / sun curves.
      // - Sky mix: linear, but bias slightly to keep night feel for longer
      //   (people land at top, we want night to dominate the first half).
      const skyMix = Math.pow(progress, 0.85);

      // - Stars: bright until 25%, fade out by 75% (so they're gone before
      //   the sun rises strongly).
      const stars = progress < 0.25
        ? 1
        : progress > 0.75
          ? 0
          : 1 - (progress - 0.25) / 0.5;

      // - Sun rises: stays below horizon until 55% scroll, then lifts.
      //   At 100% scroll, sun centre sits roughly at the horizon line.
      const sunPhase = Math.max(0, (progress - 0.55) / 0.45);
      const sunY = 110 - sunPhase * 35; // 110% → 75% (centre near bottom)
      const sunGlow = sunPhase; // 0 → 1

      root.style.setProperty('--hp-scroll', progress.toFixed(3));
      root.style.setProperty('--hp-sky-mix', skyMix.toFixed(3));
      root.style.setProperty('--hp-stars', stars.toFixed(3));
      root.style.setProperty('--hp-sun-y', `${sunY.toFixed(1)}%`);
      root.style.setProperty('--hp-sun-glow', sunGlow.toFixed(3));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    // Run once on mount in case the user lands deep on the page.
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      // Reset vars so other pages (when navigating) don't inherit them.
      root.style.removeProperty('--hp-scroll');
      root.style.removeProperty('--hp-sky-mix');
      root.style.removeProperty('--hp-stars');
      root.style.removeProperty('--hp-sun-y');
      root.style.removeProperty('--hp-sun-glow');
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="homepage-bg-root" aria-hidden="true">
        <div className="homepage-bg-sky" />
        <div className="homepage-bg-stars">
          {stars.map((s, i) => (
            <span
              key={i}
              className="homepage-bg-star"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.r}px`,
                height: `${s.r}px`,
                opacity: s.alpha,
              }}
            />
          ))}
        </div>
        <div className="homepage-bg-horizon" />
        <div className="homepage-bg-wisps" />
        <div className="homepage-bg-sun">
          <div className="homepage-bg-sun-corona" />
          <div className="homepage-bg-sun-core" />
        </div>
      </div>
    </>
  );
}
