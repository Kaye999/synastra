"use client";

// AudioPlayer — minimal brass-themed audio player for meditations.
// Custom-rendered scrubber + play/pause so it matches the Synastra
// editorial aesthetic instead of the default browser chrome.

import { useEffect, useRef, useState } from 'react';

export type AudioPlayerProps = {
  src: string;
  title: string;
  subtitle?: string;
  durationSeconds?: number;
};

function fmt(t: number): string {
  if (!Number.isFinite(t)) return '00:00';
  const s = Math.max(0, Math.floor(t));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function AudioPlayer({ src, title, subtitle, durationSeconds }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => {
      if (Number.isFinite(a.duration)) setDuration(a.duration);
      setIsReady(true);
    };
    const onEnd = () => setIsPlaying(false);
    const onErr = () => setError('This recording could not load.');

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);

    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
    };
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play().then(() => setIsPlaying(true)).catch(() => setError('Playback blocked.'));
    }
  }

  function scrub(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a || !Number.isFinite(duration)) return;
    const pct = Number(e.target.value) / 100;
    a.currentTime = pct * duration;
    setCurrentTime(a.currentTime);
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '20px 22px',
        border: '1px solid rgba(200, 160, 82, 0.25)',
        background: 'rgba(10, 14, 26, 0.78)',
        borderRadius: 6,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div>
        <div
          style={{
            fontFamily: "'Alice', serif",
            fontSize: 18,
            color: 'var(--ink)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(252, 250, 246, 0.55)',
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!isReady && !error}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1.5px solid var(--brass)',
            background: isPlaying ? 'var(--brass)' : 'transparent',
            color: isPlaying ? 'var(--bg-base)' : 'var(--brass)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.18s ease',
            flexShrink: 0,
          }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3" height="12"/><rect x="9" y="1" width="3" height="12"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ marginLeft: 2 }}><path d="M2 1 L12 7 L2 13 Z"/></svg>
          )}
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={scrub}
            aria-label="Seek"
            style={{
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'transparent',
              height: 18,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 2,
              background: 'rgba(252, 250, 246, 0.10)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'var(--brass)',
                transition: 'width 0.08s linear',
              }}
            />
          </div>
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: 'rgba(252, 250, 246, 0.62)',
            letterSpacing: '0.04em',
            minWidth: 92,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {fmt(currentTime)} / {fmt(duration)}
        </div>
      </div>

      {error && (
        <div
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--ember)',
          }}
        >
          {error}
        </div>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--brass);
          cursor: pointer;
          border: 0;
          box-shadow: 0 0 0 3px rgba(200, 160, 82, 0.18);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--brass);
          cursor: pointer;
          border: 0;
          box-shadow: 0 0 0 3px rgba(200, 160, 82, 0.18);
        }
      `}</style>
    </div>
  );
}
