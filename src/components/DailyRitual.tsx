"use client";

// DailyRitual — habit-loop strip shown above MorningCup on the Dashboard.
//
// Three editorial cards: Planet of the Day · Daily Affirmation · Weekly Aspect.
// Available to every tier (yes, free) — this is the daily reason to open the
// app even before any reading has been written for you.
//
// Content is deterministic by date — no per-request LLM call — so a 30-min
// stale-while-revalidate cache is safe and the load is instant.

import { useEffect, useState } from 'react';

type Payload = {
  date: string;
  planet: {
    planet: string;
    glyph: string;
    themes: string[];
    invitation: string;
  };
  affirmation: string;
  weekly: { headline: string };
};

const TODAY_FMT = new Intl.DateTimeFormat('en-AU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function DailyRitual() {
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/daily-ritual')
      .then((r) => r.json())
      .then((d: Payload) => {
        if (!cancelled) setPayload(d);
      })
      .catch(() => { /* silent — the strip is decorative */ });
    return () => { cancelled = true; };
  }, []);

  if (!payload) return <div style={{ minHeight: 96 }} />;

  const today = TODAY_FMT.format(new Date());

  return (
    <section
      aria-label="Daily ritual"
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        marginBottom: 48,
      }}
    >
      <RitualCard
        eyebrow={`§ ${today}`}
        title={`${payload.planet.glyph}  ${payload.planet.planet}-ruled`}
        body={payload.planet.invitation}
        accent
      />
      <RitualCard
        eyebrow="§ Today's affirmation"
        title={payload.affirmation}
        body={null}
        italic
      />
      <RitualCard
        eyebrow="§ This week's aspect"
        title={payload.weekly.headline}
        body={null}
      />
    </section>
  );
}

function RitualCard({
  eyebrow,
  title,
  body,
  accent = false,
  italic = false,
}: {
  eyebrow: string;
  title: string;
  body: string | null;
  accent?: boolean;
  italic?: boolean;
}) {
  return (
    <article
      style={{
        position: 'relative',
        padding: '22px 24px 24px',
        border: accent ? '1px solid var(--brass)' : '1px solid var(--rule)',
        background: accent ? 'rgba(200, 160, 82, 0.04)' : 'rgba(19, 24, 40, 0.45)',
        minHeight: 132,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: accent ? 'var(--brass)' : 'var(--ink-faint)',
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: italic ? "'Crimson Pro', serif" : "'Fraunces', serif",
          fontStyle: italic ? 'italic' : 'normal',
          fontSize: italic ? 19 : 18,
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: '-0.005em',
          color: 'var(--ink)',
        }}
      >
        {title}
      </div>
      {body ? (
        <div
          style={{
            fontFamily: "'Crimson Pro', serif",
            fontSize: 14.5,
            lineHeight: 1.55,
            color: 'var(--ink-dim)',
          }}
        >
          {body}
        </div>
      ) : null}
    </article>
  );
}
