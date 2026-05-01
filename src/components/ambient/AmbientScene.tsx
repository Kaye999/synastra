'use client';

import { useEffect, useRef, useState } from 'react';
import type { Scene } from '@/lib/ambient/scenes';
import SceneEffects from './SceneEffects';
import './scene-effects.css';

interface AmbientSceneProps {
  scene: Scene;
  className?: string;
}

// Full-bleed ambient layer. Renders the scene's poster as the immediate paint, then
// overlays a looping muted video once it's loaded. When `scene` changes, fades to the
// new scene over ~1.2s by stacking two video elements and toggling opacity.
//
// Reduced-motion users see only the poster — no video, no transitions.
export default function AmbientScene({ scene, className }: AmbientSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [active, setActive] = useState<0 | 1>(0);
  const [scenes, setScenes] = useState<[Scene, Scene]>(() => [scene, scene]);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);

  // Track prefers-reduced-motion at the OS level.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Crossfade on scene change.
  useEffect(() => {
    if (scenes[active].id === scene.id) return;
    const inactive = active === 0 ? 1 : 0;
    setScenes((prev) => {
      const next: [Scene, Scene] = [...prev];
      next[inactive] = scene;
      return next;
    });
    // Defer to next frame so the new <video> mounts before opacity flips.
    const id = requestAnimationFrame(() => setActive(inactive));
    return () => cancelAnimationFrame(id);
  }, [scene, active, scenes]);

  return (
    <div
      className={
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black ' +
        (className ?? '')
      }
      aria-hidden="true"
    >
      {[0, 1].map((idx) => {
        const s = scenes[idx];
        const isActive = active === idx;
        const ref = idx === 0 ? videoARef : videoBRef;
        return (
          <div
            key={`${idx}-${s.id}`}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
            style={{ opacity: isActive ? 1 : 0 }}
          >
            <img
              src={s.poster}
              alt=""
              className={
                'h-full w-full select-none object-cover ' +
                (reducedMotion ? '' : 'ambient-kenburns')
              }
              draggable={false}
            />
            {!reducedMotion && s.videos && s.videos.length > 0 && (
              <video
                ref={ref}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={s.poster}
              >
                {s.videos.map((v) => (
                  <source key={v.src} src={v.src} type={v.type} />
                ))}
              </video>
            )}
            <SceneEffects effects={s.effects} reducedMotion={reducedMotion} />
            {/* Soft vignette + bottom gradient for legibility of overlaid UI. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%), ' +
                  'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
