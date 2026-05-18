'use client';

import type { AmbientState } from '@/lib/ambient/types';
import {
  LUNAR_TEACHINGS,
  SEASON_TEACHINGS,
  TIME_OF_DAY_TEACHINGS,
} from '@/lib/ambient/teachings';

interface PresenceCardProps {
  state: AmbientState;
  onRequestLocation?: () => void;
  loadingLocation?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PresenceCard({
  state,
  onRequestLocation,
  loadingLocation,
}: PresenceCardProps) {
  const seasonTeaching = SEASON_TEACHINGS[state.season.id];
  const lunarTeaching = LUNAR_TEACHINGS[state.lunar.id];
  const todTeaching = TIME_OF_DAY_TEACHINGS[state.timeOfDay.id];

  return (
    <div
      className="
        pointer-events-auto w-full max-w-md
        rounded-2xl border border-white/10 bg-black/35
        p-6 backdrop-blur-md
        text-white shadow-[0_8px_40px_rgba(0,0,0,0.45)]
      "
    >
      <div className="space-y-4 text-[15px] leading-snug">
        <Row icon="📍" primary={state.location?.name ?? 'Anywhere'}>
          {state.location ? null : (
            <button
              type="button"
              onClick={onRequestLocation}
              disabled={loadingLocation}
              className="ml-2 text-xs uppercase tracking-wider text-white/60 underline-offset-4 hover:text-white hover:underline disabled:opacity-50"
            >
              {loadingLocation ? 'Listening…' : 'Use my location'}
            </button>
          )}
        </Row>

        <Row icon="🕐" primary={`${formatTime(state.generatedAt)} — ${state.timeOfDay.label}`}>
          <Whisper>{todTeaching}</Whisper>
        </Row>

        <Row
          icon={broadIcon(state.season.broadSeason)}
          primary={state.season.label}
        >
          <Whisper>{seasonTeaching}</Whisper>
        </Row>

        <Row
          icon={lunarIcon(state.lunar.illumination, state.lunar.age)}
          primary={`${state.lunar.label} · ${Math.round(state.lunar.illumination * 100)}%`}
        >
          <Whisper>{lunarTeaching}</Whisper>
        </Row>

        {state.weather && (
          <Row icon={weatherIcon(state.weather.id)} primary={state.weather.label} />
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  primary,
  children,
}: {
  icon: string;
  primary: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-base leading-none">{icon}</span>
        <span className="font-medium tracking-tight">{primary}</span>
      </div>
      {children && <div className="mt-1 pl-7">{children}</div>}
    </div>
  );
}

function Whisper({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] italic leading-relaxed text-white/70">{children}</p>
  );
}

function broadIcon(s: string): string {
  switch (s) {
    case 'spring': return '🌱';
    case 'summer': return '☀️';
    case 'autumn': return '🍂';
    case 'winter': return '❄️';
    default: return '·';
  }
}

function lunarIcon(illum: number, age: number): string {
  // Waxing if age 0..14.77, else waning.
  const waxing = age <= 14.77;
  if (illum < 0.05) return '🌑';
  if (illum > 0.95) return '🌕';
  if (illum < 0.5) return waxing ? '🌒' : '🌘';
  return waxing ? '🌔' : '🌖';
}

function weatherIcon(id: string): string {
  switch (id) {
    case 'clear':    return '☀️';
    case 'cloudy':   return '⛅';
    case 'overcast': return '☁️';
    case 'fog':      return '🌫️';
    case 'rain':     return '🌧️';
    case 'snow':     return '❄️';
    case 'storm':    return '⛈️';
    default: return '·';
  }
}
