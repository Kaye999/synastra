"use client";

// MeditationsClient — interactive list of meditations + breathing audios
// for The Nine subscribers. Fetches metadata once, then lazy-requests
// signed URLs from /api/meditations/[id]/signed-url when a user expands
// a track to play it.

import { useEffect, useState } from 'react';
import AudioPlayer from './AudioPlayer';

type Meditation = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: 'meditation' | 'breathing';
  duration_seconds: number;
  zodiac_season: string | null;
  tier_required: string;
  created_at: string;
};

type SignedTrack = {
  url: string;
  expiresAt: number;
};

export default function MeditationsClient({ firstName }: { firstName: string }) {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [signed, setSigned] = useState<Record<string, SignedTrack>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/meditations', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load (${res.status}).`);
        const data = (await res.json()) as { meditations?: Meditation[] };
        if (!cancelled) setMeditations(data.meditations ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load library.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function expand(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    const cached = signed[id];
    const now = Date.now();
    if (cached && cached.expiresAt > now + 30_000) return;

    try {
      const res = await fetch(`/api/meditations/${id}/signed-url`);
      if (!res.ok) throw new Error(`Signed URL failed (${res.status}).`);
      const data = (await res.json()) as { url?: string; expiresIn?: number };
      if (data.url) {
        setSigned((prev) => ({
          ...prev,
          [id]: { url: data.url!, expiresAt: now + ((data.expiresIn ?? 3600) - 60) * 1000 },
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Track failed to load.');
    }
  }

  if (isLoading) {
    return (
      <div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="shimmer-line"
            style={{ height: 86, marginBottom: 14, borderRadius: 6 }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          border: '1px solid var(--rule)',
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontStyle: 'italic',
          color: 'var(--ember)',
        }}
      >
        {error}
      </div>
    );
  }

  if (meditations.length === 0) {
    return (
      <div
        style={{
          padding: '40px 32px',
          border: '1px solid rgba(200, 160, 82, 0.18)',
          background: 'rgba(8, 12, 24, 0.55)',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 8,
          }}
        >
          New recordings arriving
        </div>
        <p
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.65,
            color: 'rgba(252, 250, 246, 0.72)',
            margin: 0,
            maxWidth: '60ch',
          }}
        >
          The first audios for the current zodiac season are being prepared, {firstName}.
          You&rsquo;ll see them appear here within the week — and your monthly cadence
          starts from your first sign-in date.
        </p>
      </div>
    );
  }

  const meds = meditations.filter((m) => m.type === 'meditation');
  const breath = meditations.filter((m) => m.type === 'breathing');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <PrintablesRow />
      {meds.length > 0 && (
        <Section title="Guided meditations" count={meds.length}>
          {meds.map((m) => (
            <Row
              key={m.id}
              med={m}
              isOpen={openId === m.id}
              signedUrl={signed[m.id]?.url}
              onToggle={() => expand(m.id)}
            />
          ))}
        </Section>
      )}
      {breath.length > 0 && (
        <Section title="Breathing exercises" count={breath.length}>
          {breath.map((m) => (
            <Row
              key={m.id}
              med={m}
              isOpen={openId === m.id}
              signedUrl={signed[m.id]?.url}
              onToggle={() => expand(m.id)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function PrintablesRow() {
  const cards = [
    {
      href: '/api/pdf/workbook',
      eyebrow: 'Monthly · PDF',
      title: 'Zodiac Season Workbook',
      blurb: 'A 4-page printable workbook for the current sign — themes, weekly prompts, and a closing reflection.',
    },
    {
      href: '/api/pdf/moon-journal',
      eyebrow: '28-day · PDF',
      title: 'Moon Journal',
      blurb: 'A printable lunar-cycle journal. One phase, one prompt, two ruled lines per day.',
    },
  ];
  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2
          style={{
            fontFamily: "'Alice', serif",
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
            color: 'var(--ink)',
          }}
        >
          Printables
        </h2>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Generate · print · keep
        </div>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {cards.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target="_blank"
            rel="noopener"
            style={{
              display: 'block',
              padding: '20px 22px',
              border: '1px solid rgba(252, 250, 246, 0.10)',
              borderRadius: 6,
              background: 'rgba(10, 14, 26, 0.62)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(200, 160, 82, 0.45)';
              e.currentTarget.style.background = 'rgba(200, 160, 82, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(252, 250, 246, 0.10)';
              e.currentTarget.style.background = 'rgba(10, 14, 26, 0.62)';
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--brass)',
                marginBottom: 8,
              }}
            >
              {c.eyebrow}
            </div>
            <div
              style={{
                fontFamily: "'Alice', serif",
                fontSize: 19,
                color: 'var(--ink)',
                marginBottom: 6,
              }}
            >
              {c.title}
            </div>
            <p
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                fontStyle: 'italic',
                lineHeight: 1.5,
                color: 'rgba(252, 250, 246, 0.62)',
                margin: '0 0 12px',
              }}
            >
              {c.blurb}
            </p>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--brass)',
              }}
            >
              Download →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2
          style={{
            fontFamily: "'Alice', serif",
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h2>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          {count} {count === 1 ? 'track' : 'tracks'}
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  );
}

function Row({
  med,
  isOpen,
  signedUrl,
  onToggle,
}: {
  med: Meditation;
  isOpen: boolean;
  signedUrl: string | undefined;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${isOpen ? 'rgba(200, 160, 82, 0.45)' : 'rgba(252, 250, 246, 0.08)'}`,
        borderRadius: 6,
        background: isOpen ? 'rgba(200, 160, 82, 0.04)' : 'rgba(10, 14, 26, 0.62)',
        transition: 'all 0.2s ease',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          padding: '20px 22px',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Alice', serif",
              fontSize: 18,
              color: 'var(--ink)',
              marginBottom: 4,
            }}
          >
            {med.title}
          </div>
          {med.description && (
            <div
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 14,
                fontStyle: 'italic',
                color: 'rgba(252, 250, 246, 0.62)',
                lineHeight: 1.5,
              }}
            >
              {med.description}
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            color: 'var(--brass)',
            whiteSpace: 'nowrap',
          }}
        >
          {Math.round(med.duration_seconds / 60)} min · {isOpen ? '↑' : '↓'}
        </div>
      </button>
      {isOpen && signedUrl && (
        <div style={{ padding: '0 22px 22px' }}>
          <AudioPlayer
            src={signedUrl}
            title={med.title}
            subtitle={med.zodiac_season ? `${med.zodiac_season} season` : undefined}
            durationSeconds={med.duration_seconds}
          />
        </div>
      )}
      {isOpen && !signedUrl && (
        <div style={{ padding: '0 22px 22px' }}>
          <div
            className="shimmer-line"
            style={{ height: 86, borderRadius: 6 }}
          />
        </div>
      )}
    </div>
  );
}
