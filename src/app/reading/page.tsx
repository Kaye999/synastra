"use client";

// /reading — public Natal Brief lead magnet.
//
// Captures birth data (no auth), POSTs to /api/reading/brief, renders
// Sun · Moon · Rising · Life Path with hand-written interpretations,
// then prompts the user to claim the chart forever by signing up.
//
// Birth data is stashed in localStorage so /sign-up → /onboarding can
// pre-fill instead of asking the user to type it twice.

import { useState } from 'react';
import Link from 'next/link';
import Starfield from '@/components/Starfield';
import CityAutocomplete from '@/components/CityAutocomplete';
import Ornament from '@/components/Ornament';
import BrandHome from '@/components/BrandHome';

type Card = { headline: string; sign: string | null; body: string };

const STORAGE_KEY = 'synastra.reading.prefill';

export default function ReadingPage() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [cityLabel, setCityLabel] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number; tzOffset: number; tzId?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) { setError('Date of birth is required.'); return; }
    if (!timeUnknown && !time) { setError('Birth time helps with your Rising — or tick the box.'); return; }
    if (!coords) { setError('Pick your birth city from the suggestions so we can resolve the time zone.'); return; }

    const [y, m, d] = date.split('-').map(Number);
    const [h, mm] = (time || '12:00').split(':').map(Number);

    setLoading(true);
    try {
      const res = await fetch('/api/reading/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          dob: { y, m, d },
          time: { h, m: mm },
          timeUnknown,
          coords,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not cast your brief.');
      setCards(data.cards);

      // Stash for /onboarding to pre-fill once they sign up.
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          fullName: name, dob: { y, m, d }, time: { h, m: mm },
          timeUnknown, coords, cityLabel,
        }));
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />
      <BrandHome />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', padding: '110px 24px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ A free Natal Brief</div>
          <h1
            className="mk-section-title"
            style={{ fontSize: 'clamp(40px, 6vw, 68px)', marginBottom: 14 }}
          >
            What the sky said<br />when you arrived.
          </h1>
          <p className="mk-hero-sub" style={{ margin: '0 auto', maxWidth: '46ch' }}>
            Your Sun, your Moon, your Rising, your Life Path — read in a single page, written for you, free.
            Two minutes. No card. No email gate.
          </p>
        </div>

        {!cards && (
          <form
            onSubmit={submit}
            style={{
              display: 'grid',
              gap: 18,
              maxWidth: 540,
              margin: '0 auto',
              padding: '36px 32px 40px',
              border: '1px solid var(--rule)',
              background: 'rgba(19, 24, 40, 0.55)',
            }}
          >
            <Field label="Your name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What we should call you"
                className="reading-input"
              />
            </Field>

            <Field label="Date of birth">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="reading-input"
              />
            </Field>

            <Field label="Time of birth">
              <input
                type="time"
                disabled={timeUnknown}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="reading-input"
                style={{ opacity: timeUnknown ? 0.4 : 1 }}
              />
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--ink-faint)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  onChange={(e) => setTimeUnknown(e.target.checked)}
                />
                I don&apos;t know my birth time
              </label>
            </Field>

            <Field label="Place of birth">
              <CityAutocomplete
                value={cityLabel}
                onChange={setCityLabel}
                onSelect={(hit) => {
                  setCityLabel(hit.label);
                  setCoords({ lat: hit.lat, lon: hit.lon, tzOffset: hit.tzOffset, tzId: hit.tzId });
                }}
                placeholder="Start typing a city…"
              />
            </Field>

            {error && (
              <div role="alert" style={{
                padding: '10px 14px', border: '1px solid #d66', color: '#fa9',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.1em',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mk-cta-primary"
              style={{ marginTop: 8, textAlign: 'center', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Reading the sky…' : 'Read my brief →'}
            </button>

            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--ink-faint)', textAlign: 'center', margin: 0,
            }}>
              § Not stored unless you sign up · No marketing emails ever
            </p>
          </form>
        )}

        {cards && (
          <>
            <Ornament kind="rule" width={220} style={{ margin: '24px auto 32px' }} />
            <div style={{ display: 'grid', gap: 22 }}>
              {cards.map((c, i) => (
                <article
                  key={c.headline}
                  style={{
                    padding: '32px 36px',
                    border: '1px solid var(--rule)',
                    background: 'rgba(19, 24, 40, 0.45)',
                    animationDelay: `${100 + i * 80}ms`,
                  }}
                  className="reveal"
                >
                  <div className="mk-eyebrow" style={{ marginBottom: 8 }}>§ Card {i + 1} of 4</div>
                  <h2
                    style={{
                      fontFamily: "'Alice', serif",
                      fontSize: 28,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      margin: '0 0 14px',
                    }}
                  >
                    {c.headline}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Hanken Grotesk', serif",
                      fontSize: 17,
                      lineHeight: 1.65,
                      color: 'var(--ink-dim)',
                      margin: 0,
                    }}
                  >
                    {c.body}
                  </p>
                </article>
              ))}
            </div>

            <div style={{
              marginTop: 56, padding: '32px 32px 36px', textAlign: 'center',
              border: '1px solid var(--brass)', background: 'rgba(200, 160, 82, 0.04)',
            }}>
              <h3 style={{
                fontFamily: "'Alice', serif", fontSize: 24, fontWeight: 600,
                margin: '0 0 12px', letterSpacing: '-0.01em',
              }}>
                Keep this chart forever — free.
              </h3>
              <p style={{
                fontFamily: "'Hanken Grotesk', serif", fontSize: 16, lineHeight: 1.6,
                color: 'var(--ink-dim)', margin: '0 0 22px', maxWidth: '44ch',
                marginLeft: 'auto', marginRight: 'auto',
              }}>
                We&apos;ll save your Natal Brief, add a daily ritual, and open Western + Numerology
                in full. No card. Upgrade to The Five, The Seven, or The Nine when you want more.
              </p>
              <Link href="/sign-up?redirect_url=/onboarding" className="mk-cta-primary">
                Save my chart →
              </Link>
            </div>
          </>
        )}

        <div style={{
          marginTop: 80, paddingTop: 40, borderTop: '1px solid var(--rule)',
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <Link href="/" className="mk-page-nav-btn">← Home</Link>
          <Link href="/pricing" className="mk-page-nav-btn">See plans →</Link>
        </div>
      </div>

      <style jsx>{`
        .reading-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(8, 12, 24, 0.6);
          border: 1px solid var(--rule);
          color: var(--ink);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.06em;
        }
        .reading-input:focus {
          outline: none;
          border-color: var(--brass);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--ink-faint)', marginBottom: 8,
      }}>
        § {label}
      </div>
      {children}
    </div>
  );
}
