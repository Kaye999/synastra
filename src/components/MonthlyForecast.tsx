"use client";

// MonthlyForecast — 5-section monthly arc streamed from GET /api/reading/monthly.
//
// The API streams a single long essay whose body contains "Career", "Love",
// "Shadow", "Wealth", "Integration" section headings on their own lines. We
// parse sections progressively from the running body so sections appear one
// by one as Claude finishes each. The whole block fades in via
// IntersectionObserver on first scroll.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ornament from './Ornament';
import type { BirthData } from '@/lib/types';

type SectionKey = 'career' | 'love' | 'shadow' | 'wealth' | 'integration';

const SECTIONS: { key: SectionKey; label: string; subtitle: string }[] = [
  { key: 'career', label: 'Career', subtitle: 'The work and its shape' },
  { key: 'love', label: 'Love', subtitle: 'Bonds tested, bonds sealed' },
  { key: 'shadow', label: 'Shadow', subtitle: 'What asks to be seen' },
  { key: 'wealth', label: 'Wealth', subtitle: 'Where money moves this cycle' },
  { key: 'integration', label: 'Integration', subtitle: 'How to carry all five' },
];

const HEADING_MAP: Record<string, SectionKey> = {
  career: 'career',
  love: 'love',
  shadow: 'shadow',
  wealth: 'wealth',
  integration: 'integration',
};

const MONTH_YEAR = new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' });

/**
 * Given the full accumulated monthly essay, carve out each section's body by
 * scanning for heading lines. Anything before the first heading is treated
 * as the "opener" framing paragraph and discarded for this view (we only
 * surface the 5 labelled sections in the accordion).
 */
function parseSections(body: string): Record<SectionKey, string> {
  const result: Record<SectionKey, string> = {
    career: '',
    love: '',
    shadow: '',
    wealth: '',
    integration: '',
  };
  if (!body.trim()) return result;
  const lines = body.split(/\r?\n/);
  let current: SectionKey | null = null;
  const buckets: Record<SectionKey, string[]> = {
    career: [],
    love: [],
    shadow: [],
    wealth: [],
    integration: [],
  };
  for (const line of lines) {
    const trimmed = line.trim();
    // A heading is a short line matching one of the labels exactly (case-insensitive).
    const low = trimmed.toLowerCase().replace(/[:.*#]+$/, '').trim();
    if (low && HEADING_MAP[low] && trimmed.length <= 40) {
      current = HEADING_MAP[low];
      continue;
    }
    if (current) buckets[current].push(line);
  }
  for (const k of Object.keys(buckets) as SectionKey[]) {
    result[k] = buckets[k].join('\n').trim();
  }
  return result;
}

/**
 * Stream SSE from a GET endpoint — identical contract to MorningCup's reader.
 */
async function readSse(
  url: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  if (!res.ok) {
    let parsedError: string | null = null;
    try {
      const text = await res.text();
      parsedError = JSON.parse(text)?.error ?? null;
    } catch { /* keep null */ }

    // Same auth-gate pattern as MorningCup: 401/404/profile-not-found/
    // unauthorised all map to the friendly sign-up CTA.
    const isAuthGate = res.status === 401
      || res.status === 404
      || parsedError === 'profile-not-found'
      || parsedError === 'unauthorised';
    if (isAuthGate) {
      throw new Error('Sign up to see the arc of your month.');
    }

    const msg = parsedError
      ? `The arc is hidden — ${parsedError}.`
      : `The arc is hidden (${res.status}).`;
    throw new Error(msg);
  }
  if (!res.body) throw new Error('No stream came through.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = raw.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json) as { type: string; delta?: string; message?: string };
        if (evt.type === 'text' && typeof evt.delta === 'string') {
          full += evt.delta;
          onDelta(evt.delta);
        } else if (evt.type === 'error') {
          throw new Error(evt.message || 'stream-error');
        } else if (evt.type === 'done') {
          return full;
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'stream-error') continue;
        throw e;
      }
    }
  }
  return full;
}

export type MonthlyForecastProps = {
  user: BirthData;
  firstName: string;
};

export default function MonthlyForecast({ user: _user, firstName: _firstName }: MonthlyForecastProps) {
  const [body, setBody] = useState<string>('');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<SectionKey | null>(null);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const monthLabel = useMemo(() => MONTH_YEAR.format(new Date()), []);
  const parsed = useMemo(() => parseSections(body), [body]);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    setBody('');
    try {
      await readSse(
        '/api/reading/monthly',
        (delta) => setBody((prev) => prev + delta),
        ac.signal,
      );
    } catch (e) {
      if (ac.signal.aborted) return;
      const msg = e instanceof Error ? e.message : 'The arc is hidden for now.';
      setError(msg);
      setBody('');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Fade in on scroll.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const anySection = SECTIONS.some((s) => parsed[s.key].length > 0);

  return (
    <section
      ref={sectionRef}
      aria-label="Monthly forecast — the arc"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 900ms ease, transform 900ms cubic-bezier(.2,.7,.3,1)',
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 12,
        }}
      >
        {monthLabel} · The Arc
      </div>

      <h2
        style={{
          fontFamily: "'Fraunces', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          margin: '0 0 8px',
          color: 'var(--ink)',
        }}
      >
        Twelve threads, one month
      </h2>

      <p
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontStyle: 'italic',
          fontSize: 16,
          color: 'var(--ink-dim)',
          margin: '0 0 28px',
          maxWidth: '42ch',
        }}
      >
        Tap to open each thread of the month.
      </p>

      {isLoading && !anySection && <ForecastShimmer />}

      {error && !isLoading && (
        <div style={{ padding: '16px 0' }}>
          <p
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontStyle: 'italic',
              color: 'var(--ember)',
              margin: '0 0 14px',
              fontSize: 15,
            }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={load}
            style={{
              background: 'transparent',
              border: '1px solid var(--brass)',
              color: 'var(--brass)',
              padding: '8px 18px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Read the arc
          </button>
        </div>
      )}

      {!error && (anySection || !isLoading) && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {SECTIONS.map((s, i) => {
            const isOpen = open === s.key;
            const sectionBody = parsed[s.key];
            const ready = sectionBody.length > 0;
            return (
              <li key={s.key} style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  onClick={() => ready && setOpen(isOpen ? null : s.key)}
                  aria-expanded={isOpen}
                  aria-controls={`forecast-${s.key}`}
                  disabled={!ready}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '18px 0',
                    background: 'transparent',
                    border: 0,
                    borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                    borderBottom: '1px solid var(--rule)',
                    textAlign: 'left',
                    cursor: ready ? 'pointer' : 'default',
                    color: 'var(--ink)',
                    opacity: ready ? 1 : 0.55,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 18, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.22em',
                        color: 'var(--ink-faint)',
                        flexShrink: 0,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontVariationSettings: '"opsz" 144',
                        fontSize: 24,
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        color: isOpen ? 'var(--brass)' : 'var(--ink)',
                        transition: 'color 200ms',
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="mf-sub"
                      style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        fontSize: 14,
                        color: 'var(--ink-faint)',
                      }}
                    >
                      {ready ? s.subtitle : 'arriving…'}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 18,
                      color: 'var(--brass)',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                      transition: 'transform 300ms cubic-bezier(.2,.7,.3,1)',
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  id={`forecast-${s.key}`}
                  style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? 1600 : 0,
                    transition: 'max-height 500ms cubic-bezier(.2,.7,.3,1)',
                  }}
                >
                  <div style={{ padding: '22px 0 28px', paddingLeft: 48 }}>
                    {sectionBody.split(/\n{2,}/).map((para, j) => (
                      <p
                        key={j}
                        style={{
                          fontFamily: "'Crimson Pro', serif",
                          fontSize: 17,
                          lineHeight: 1.68,
                          color: 'var(--ink-dim)',
                          margin: j === 0 ? 0 : '14px 0 0',
                          maxWidth: '62ch',
                        }}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
                {i < SECTIONS.length - 1 && isOpen && (
                  <div style={{ padding: '4px 0 10px' }}>
                    <Ornament kind="constellation" width={140} style={{ opacity: 0.5 }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ForecastShimmer() {
  return (
    <div aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            padding: '18px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div className="shimmer-line" style={{ height: 10, width: 24, borderRadius: 2 }} />
          <div className="shimmer-line" style={{ height: 22, width: 140, borderRadius: 2 }} />
          <div className="shimmer-line" style={{ height: 14, width: 200, borderRadius: 2, opacity: 0.5 }} />
        </div>
      ))}
    </div>
  );
}
