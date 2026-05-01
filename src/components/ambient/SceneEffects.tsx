'use client';

import { useMemo } from 'react';
import './scene-effects.css';

export type EffectId =
  | 'leaves-falling'
  | 'snow-falling'
  | 'frost-shimmer'
  | 'stars-twinkle'
  | 'stars-twinkle-dense'
  | 'clouds-drift'
  | 'clouds-drift-dark'
  | 'sun-rays'
  | 'moon-halo'
  | 'fog-drift'
  | 'rain-fall';

interface SceneEffectsProps {
  effects?: EffectId[];
  reducedMotion: boolean;
}

// Deterministic pseudo-random — keeps SSR/client identical so React doesn't bark about
// hydration mismatches when we generate particle positions inline.
function seedRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function leaves(count: number, seedBase: number) {
  const rng = seedRand(seedBase);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    x: rng() * 100,
    delay: rng() * 14,
    dur: 10 + rng() * 10,
    drift: (rng() * 16 - 8).toFixed(1),
    spin: 180 + rng() * 540,
    variant: (i % 3) + 1,
  }));
}

function flakes(count: number, seedBase: number) {
  const rng = seedRand(seedBase);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    x: rng() * 100,
    delay: rng() * 18,
    dur: 12 + rng() * 14,
    drift: (rng() * 6 - 3).toFixed(1),
    spin: 0,
  }));
}

function shimmers(count: number, seedBase: number) {
  const rng = seedRand(seedBase);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    x: rng() * 100,
    y: 60 + rng() * 35,
    delay: rng() * 5,
    dur: 3 + rng() * 4,
  }));
}

function stars(count: number, seedBase: number) {
  const rng = seedRand(seedBase);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    x: rng() * 100,
    y: rng() * 60,
    delay: rng() * 6,
    dur: 3 + rng() * 6,
    bright: rng() > 0.85,
  }));
}

function rainStreaks(count: number, seedBase: number) {
  const rng = seedRand(seedBase);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    x: rng() * 100,
    delay: rng() * 1.2,
    dur: 0.7 + rng() * 0.6,
  }));
}

function clouds(count: number, seedBase: number, dark: boolean) {
  const rng = seedRand(seedBase);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    y: 5 + rng() * 35,
    delay: rng() * 90,
    dur: 70 + rng() * 50,
    dark,
  }));
}

export default function SceneEffects({ effects, reducedMotion }: SceneEffectsProps) {
  const data = useMemo(() => {
    if (!effects || effects.length === 0) return null;
    return {
      leaves:    effects.includes('leaves-falling')      ? leaves(14, 1) : null,
      flakes:    effects.includes('snow-falling')        ? flakes(28, 2) : null,
      shimmers:  effects.includes('frost-shimmer')       ? shimmers(20, 3) : null,
      stars:     effects.includes('stars-twinkle')       ? stars(45, 4)
                : effects.includes('stars-twinkle-dense') ? stars(120, 5) : null,
      clouds:    effects.includes('clouds-drift')        ? clouds(3, 6, false)
                : effects.includes('clouds-drift-dark') ? clouds(3, 7, true) : null,
      sunRays:   effects.includes('sun-rays'),
      moonHalo:  effects.includes('moon-halo'),
      fog:       effects.includes('fog-drift'),
      rain:      effects.includes('rain-fall')           ? rainStreaks(50, 8) : null,
    };
  }, [effects]);

  if (!effects || !data || reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {data.sunRays && <div className="ambient-sunrays" />}
      {data.moonHalo && <div className="ambient-moon-halo" />}

      {data.clouds &&
        data.clouds.map((c) => (
          <div
            key={c.key}
            className={`ambient-cloud${c.dark ? ' ambient-cloud--dark' : ''}`}
            style={
              {
                '--y': `${c.y}%`,
                '--delay': `-${c.delay}s`,
                '--dur': `${c.dur}s`,
              } as React.CSSProperties
            }
          />
        ))}

      {data.fog && <div className="ambient-fog" />}

      {data.leaves &&
        data.leaves.map((l) => (
          <div
            key={l.key}
            className={`ambient-leaf ambient-leaf--variant-${l.variant}`}
            style={
              {
                '--x': `${l.x}%`,
                '--delay': `-${l.delay}s`,
                '--dur': `${l.dur}s`,
                '--drift': `${l.drift}vw`,
                '--spin': `${l.spin}deg`,
              } as React.CSSProperties
            }
          />
        ))}

      {data.flakes &&
        data.flakes.map((f) => (
          <div
            key={f.key}
            className="ambient-flake"
            style={
              {
                '--x': `${f.x}%`,
                '--delay': `-${f.delay}s`,
                '--dur': `${f.dur}s`,
                '--drift': `${f.drift}vw`,
              } as React.CSSProperties
            }
          />
        ))}

      {data.shimmers &&
        data.shimmers.map((s) => (
          <div
            key={s.key}
            className="ambient-shimmer"
            style={
              {
                '--x': `${s.x}%`,
                '--y': `${s.y}%`,
                '--delay': `-${s.delay}s`,
                '--dur': `${s.dur}s`,
              } as React.CSSProperties
            }
          />
        ))}

      {data.stars &&
        data.stars.map((st) => (
          <div
            key={st.key}
            className={`ambient-star${st.bright ? ' ambient-star--bright' : ''}`}
            style={
              {
                '--x': `${st.x}%`,
                '--y': `${st.y}%`,
                '--delay': `-${st.delay}s`,
                '--dur': `${st.dur}s`,
              } as React.CSSProperties
            }
          />
        ))}

      {data.rain &&
        data.rain.map((r) => (
          <div
            key={r.key}
            className="ambient-rain-streak"
            style={
              {
                '--x': `${r.x}%`,
                '--delay': `-${r.delay}s`,
                '--dur': `${r.dur}s`,
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  );
}
