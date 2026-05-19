"use client";

// Cosmos.tsx — global atmospheric background. Sits behind every page as a
// fixed full-viewport layer of slowly-drifting nebula plates + vignette.
//
// Composed of:
//   1. Deep base (handled by globals.css body bg)
//   2. Three nebula plates (purple/magenta, cyan/teal, amber) — large soft
//      radial gradients, blur-screened over the void, each with a slow
//      independent drift+rotation animation.
//   3. Atmospheric haze sweep across the top horizon.
//   4. Mouse parallax (≤10px) for a sense of depth on desktop.
//   5. Vignette darkening at the edges.
//
// All pure CSS / SVG — no canvas, no WebGL, no external assets. ~1.5KB
// gzip, GPU-accelerated. Respects `prefers-reduced-motion`.
//
// Z-index sits at -1 so the existing per-page <Starfield /> (which uses
// z-index: 0) renders ON TOP of the nebulae, giving real depth.

import { useEffect, useRef } from 'react';

const STYLES = `
:root {
  --cosmos-mx: 0;
  --cosmos-my: 0;
}

.cosmos-root {
  position: fixed;
  inset: 0;
  z-index: -2;             /* sits behind HomepageBackground (z:-1) on landing */
  pointer-events: none;
  overflow: hidden;
  background: radial-gradient(
      ellipse at 50% 30%,
      #0a1228 0%,
      #060912 50%,
      #02040a 100%
    );
  /* On the homepage HomepageBackground sets --hp-scroll on :root.
     Other pages never set it so the var defaults to 0 → opacity 1 (no fade).
     On the homepage we fade the cosmos out across the scroll so dawn
     doesn't fight the drifting nebulae palette. */
  opacity: calc(1 - var(--hp-scroll, 0) * 0.85);
  transition: opacity 200ms linear;
}

.cosmos-plate {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  mix-blend-mode: screen;
  will-change: transform;
}

.cosmos-plate-1 {
  /* Magenta/violet nebula — top-left */
  width: 65vw;
  height: 65vw;
  top: -10vw;
  left: -15vw;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(120, 60, 180, 0.55) 0%,
    rgba(80, 30, 140, 0.30) 35%,
    rgba(0, 0, 0, 0) 70%
  );
  animation: cosmos-drift-1 90s ease-in-out infinite alternate;
  transform: translate3d(calc(var(--cosmos-mx) * 8px), calc(var(--cosmos-my) * 8px), 0);
}

.cosmos-plate-2 {
  /* Cyan/teal nebula — mid right */
  width: 70vw;
  height: 70vw;
  top: 20vh;
  right: -25vw;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(40, 140, 200, 0.45) 0%,
    rgba(20, 80, 160, 0.25) 35%,
    rgba(0, 0, 0, 0) 70%
  );
  animation: cosmos-drift-2 110s ease-in-out infinite alternate;
  transform: translate3d(calc(var(--cosmos-mx) * -6px), calc(var(--cosmos-my) * -6px), 0);
}

.cosmos-plate-3 {
  /* Amber/gold ember — lower middle */
  width: 80vw;
  height: 60vw;
  bottom: -20vw;
  left: 10vw;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(244, 216, 168, 0.32) 0%,
    rgba(200, 160, 82, 0.16) 40%,
    rgba(0, 0, 0, 0) 75%
  );
  animation: cosmos-drift-3 130s ease-in-out infinite alternate;
  transform: translate3d(calc(var(--cosmos-mx) * 4px), calc(var(--cosmos-my) * 4px), 0);
}

.cosmos-haze {
  /* Soft atmospheric sweep across the top */
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(200, 160, 82, 0.04) 0%,
    rgba(120, 80, 200, 0.02) 30%,
    rgba(0, 0, 0, 0) 60%
  );
  mix-blend-mode: screen;
  pointer-events: none;
}

.cosmos-vignette {
  /* Darken edges for cinematic frame */
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0.35) 80%,
    rgba(0, 0, 0, 0.7) 100%
  );
  pointer-events: none;
}

@keyframes cosmos-drift-1 {
  0%   { transform: translate3d(calc(var(--cosmos-mx) * 8px), calc(var(--cosmos-my) * 8px), 0) rotate(0deg) scale(1); }
  100% { transform: translate3d(calc(var(--cosmos-mx) * 8px + 30px), calc(var(--cosmos-my) * 8px + 20px), 0) rotate(8deg) scale(1.08); }
}

@keyframes cosmos-drift-2 {
  0%   { transform: translate3d(calc(var(--cosmos-mx) * -6px), calc(var(--cosmos-my) * -6px), 0) rotate(0deg) scale(1); }
  100% { transform: translate3d(calc(var(--cosmos-mx) * -6px - 40px), calc(var(--cosmos-my) * -6px - 25px), 0) rotate(-6deg) scale(1.05); }
}

@keyframes cosmos-drift-3 {
  0%   { transform: translate3d(calc(var(--cosmos-mx) * 4px), calc(var(--cosmos-my) * 4px), 0) rotate(0deg) scale(1); }
  100% { transform: translate3d(calc(var(--cosmos-mx) * 4px - 20px), calc(var(--cosmos-my) * 4px + 35px), 0) rotate(4deg) scale(1.1); }
}

@media (prefers-reduced-motion: reduce) {
  .cosmos-plate {
    animation: none !important;
  }
}
`;

export default function Cosmos() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Mouse parallax. Sets two CSS custom properties (-1..1 each) on :root
  // which the plate animations consume via calc(). Throttled to one update
  // per animation frame.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return; // skip on touch devices

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;

    const onMove = (e: MouseEvent) => {
      pendingX = (e.clientX / window.innerWidth) * 2 - 1;
      pendingY = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--cosmos-mx', pendingX.toFixed(3));
          document.documentElement.style.setProperty('--cosmos-my', pendingY.toFixed(3));
          raf = 0;
        });
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div ref={rootRef} className="cosmos-root" aria-hidden="true">
        <div className="cosmos-plate cosmos-plate-1" />
        <div className="cosmos-plate cosmos-plate-2" />
        <div className="cosmos-plate cosmos-plate-3" />
        <div className="cosmos-haze" />
        <div className="cosmos-vignette" />
      </div>
    </>
  );
}
