import Link from 'next/link';
import Starfield from '@/components/Starfield';

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 960,
          margin: '0 auto',
          padding: '140px 24px 100px',
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 18,
          }}
        >
          Synastra · An Astral Atlas
        </div>

        <h1 className="editorial-hero">Five traditions. One chart. Your chart.</h1>
        <p className="editorial-sub">
          Western astrology, Vedic, Kabbalah, numerology, and Chinese BaZi — all pulled from the same
          date, time, and place, and read to you by an AI atlas that knows your chart.
        </p>
        <hr className="brass-rule" />

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 72 }}>
          <Link
            href="/sign-up"
            style={{
              padding: '14px 28px',
              border: '1px solid var(--brass)',
              color: 'var(--brass)',
              textDecoration: 'none',
              fontFamily: "'Fraunces', serif",
              fontSize: 14,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            See your chart
          </Link>
          <Link
            href="/chart?demo=1"
            style={{
              padding: '14px 28px',
              border: '1px solid var(--rule)',
              color: 'var(--ink-dim)',
              textDecoration: 'none',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Try a sample
          </Link>
        </div>

        <hr className="chapter-rule" />

        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: '0 0 36px',
          }}
        >
          How it works
        </h2>

        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
          <Step n={1} title="Enter your birth data" body="Name, date, time, and birth place. Thirty seconds." />
          <Step n={2} title="See your chart in 5 traditions" body="Western, Vedic, Kabbalah, Numerology, Chinese — one page, switchable." />
          <Step n={3} title="Ask the Atlas anything" body="An AI reader that has read your entire chart and answers in your voice." />
        </ol>

        <hr className="chapter-rule" />

        <div style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          <Link href="/pricing" style={{ color: 'var(--brass)', textDecoration: 'underline' }}>
            See pricing
          </Link>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'var(--brass)',
          marginBottom: 10,
        }}
      >
        {String(n).padStart(2, '0')}
      </div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, margin: '0 0 10px' }}>{title}</h3>
      <p style={{ color: 'var(--ink-dim)', fontSize: 16, lineHeight: 1.55, margin: 0 }}>{body}</p>
    </li>
  );
}
