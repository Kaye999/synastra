'use client';

// /now — Synastra's living mirror.
// Renders the user's current moment as a full-screen ambient scene with a small
// presence card overlay. Location is optional; without it we still get season +
// time-of-day + lunar from the system clock and timezone.

import AmbientScene from '@/components/ambient/AmbientScene';
import PresenceCard from '@/components/ambient/PresenceCard';
import { useAmbient } from '@/lib/ambient/useAmbient';
import { resolveScene } from '@/lib/ambient/scenes';

export default function NowPage() {
  const { state, loadingLocation, requestLocation } = useAmbient();
  const scene = resolveScene(state);

  return (
    <main className="relative min-h-svh w-full overflow-hidden text-white">
      <AmbientScene scene={scene} />
      <div className="relative z-10 flex min-h-svh flex-col justify-end p-6 md:p-10">
        <header className="absolute left-6 right-6 top-6 flex items-baseline justify-between md:left-10 md:right-10 md:top-10">
          <h1 className="font-display text-base font-medium tracking-[0.18em] uppercase text-white/85">
            Synastra · Now
          </h1>
          <span className="text-xs tracking-wider uppercase text-white/45">
            {scene.label}
          </span>
        </header>
        <PresenceCard
          state={state}
          loadingLocation={loadingLocation}
          onRequestLocation={requestLocation}
        />
      </div>
    </main>
  );
}
