"use client";

// MorningCup — daily guidance reading that opens the dashboard.
//
// Fetches a streamed essay from GET /api/reading/daily (SSE), progressively
// renders the text with a drop-cap first letter and pulls an italic-worthy
// sentence as a pull-quote once streaming completes. A subtle brass pulse halo
// breathes on the card every ~8 seconds.
//
// Defensive about the API: if the endpoint 402s (tier gate), errors, or goes
// silent, the card stays graceful (error state + refresh) rather than crashing
// the dashboard.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ornament from './Ornament';
import type { BirthData } from '@/lib/types';

export type MorningCupProps = {
  user: BirthData;
  firstName: string;
  /** True on /chart?demo=1 — show "this is the demo" CTA rather than "sign up" gate. */
  demo?: boolean;
};

const LONG_DATE = new Intl.DateTimeFormat('en-AU', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/**
 * Choose the sentence most worthy of a pull-quote: aphoristic, mid-length,
 * ideally containing an em-dash or a "not X but Y" structure. Skips the
 * opener so the pull quote never duplicates the first line of the body.
 */
function extractPullQuote(body: string): string | null {
  if (!body) return null;
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24 && s.length < 220);
  if (sentences.length < 2) return null;
  const scored = sentences
    .map((s) => {
      let score = s.length;
      if (/—/.test(s)) score += 40;
      if (/;/.test(s)) score += 20;
      if (/\bnot\b.*\bbut\b/i.test(s)) score += 30;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score);
  const first = sentences[0];
  const pick = scored.find((x) => x.s !== first) ?? scored[0];
  return pick.s;
}

/**
 * Stream an SSE endpoint that emits `data: {type:'text', delta}` frames and
 * calls `onDelta` for each chunk. Resolves with the full accumulated body.
 * Rejects on HTTP error or `{type:'error'}` events.
 */
async function readSse(
  url: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  if (!res.ok) {
    // Parse the error body once so we can branch on both status + payload.
    let parsedError: string | null = null;
    try {
      const text = await res.text();
      parsedError = JSON.parse(text)?.error ?? null;
    } catch { /* keep null */ }

    // 401 = unauthenticated. 404 + profile-not-found = demo or signed-in-
    // but-no-profile-yet. Both cases: show the same friendly sign-up CTA
    // instead of a raw technical error string.
    const isAuthGate = res.status === 401
      || res.status === 404
      || parsedError === 'profile-not-found'
      || parsedError === 'unauthorised';
    if (isAuthGate) {
      throw new Error('Sign up free to unlock your personalised daily reading.');
    }

    const msg = parsedError
      ? `Couldn't pour today's cup — ${parsedError}`
      : `Couldn't pour today's cup (HTTP ${res.status}).`;
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
    // Split on SSE frame boundary (double newline).
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

export default function MorningCup({ user: _user, firstName: _firstName, demo = false }: MorningCupProps) {
  const [body, setBody] = useState<string>('');
  const [isLoading, setLoading] = useState(!demo);
  const [isStreaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(
    demo
      ? 'This is the J.P. Morgan demo chart — sign up to receive your own daily reading, written to your placements.'
      : null,
  );
  const [transitsOpen, setTransitsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const today = useMemo(() => LONG_DATE.format(new Date()), []);

  const load = useCallback(async () => {
    // Don't call the auth-gated API in demo mode — we already show a
    // tailored demo-state message via the error slot.
    if (demo) {
      setError('This is the J.P. Morgan demo chart — sign up to receive your own daily reading, written to your placements.');
      setLoading(false);
      setStreaming(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setStreaming(true);
    setError(null);
    setBody('');
    try {
      await readSse(
        '/api/reading/daily',
        (delta) => setBody((prev) => prev + delta),
        ac.signal,
      );
    } catch (e) {
      if (ac.signal.aborted) return;
      const msg = e instanceof Error ? e.message : 'Something obscured the reading.';
      setError(msg);
      setBody('');
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false);
        setStreaming(false);
      }
    }
  }, [demo]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Pull-quote only appears once the stream has settled — avoids flicker as
  // the body is still arriving.
  const pullQuote = useMemo(
    () => (isStreaming ? null : extractPullQuote(body)),
    [body, isStreaming],
  );
  const firstLetter = body ? body.charAt(0) : '';
  const bodyRest = body ? body.slice(1) : '';

  return (
    <section
      aria-label="Morning cup — today's reading"
      className="morning-cup"
      style={{
        position: 'relative',
        padding: '38px 36px 34px',
        marginBottom: 0,
        border: '1px solid var(--rule)',
        background:
          'radial-gradient(ellipse at 30% 0%, rgba(200,160,82,0.06), transparent 70%), var(--mist)',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          fontFamily: "'Alice', serif",
          fontStyle: 'italic',
          fontVariationSettings: '"opsz" 14',
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 14,
        }}
      >
        Today · {today}
      </div>

      <h2
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.028em',
          lineHeight: 0.98,
          margin: '0 0 10px',
          color: 'var(--ink)',
        }}
      >
        Morning Cup
      </h2>

      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontStyle: 'italic',
          fontSize: 17,
          color: 'var(--ink-dim)',
          margin: '0 0 20px',
          maxWidth: '48ch',
          lineHeight: 1.45,
        }}
      >
        What today&rsquo;s sky is saying to you.
      </p>

      <hr
        style={{
          width: 48,
          height: 1,
          background: 'var(--brass)',
          border: 0,
          margin: '0 0 28px',
          opacity: 0.75,
        }}
      />

      {/* Body / shimmer / error */}
      {isLoading && !body && <MorningShimmer />}

      {error && !isLoading && (
        <div>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', serif",
              fontStyle: 'italic',
              fontSize: 17,
              color: 'var(--ember)',
              margin: '0 0 16px',
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
              padding: '10px 20px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {demo ? 'Sign up for yours' : 'Try again'}
          </button>
        </div>
      )}

      {!error && body && (
        <div>
          <div
            style={{
              fontFamily: "'Hanken Grotesk', serif",
              fontSize: 20,
              lineHeight: 1.72,
              color: 'var(--ink)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                float: 'left',
                fontFamily: "'Alice', serif",
                fontVariationSettings: '"opsz" 144',
                fontSize: 72,
                lineHeight: 0.82,
                fontWeight: 600,
                color: 'var(--brass)',
                paddingRight: 12,
                paddingTop: 6,
              }}
            >
              {firstLetter}
            </span>
            <span>{bodyRest}</span>
            <span style={{ display: 'block', clear: 'both' }} />
          </div>

          {pullQuote && (
            <blockquote
              style={{
                margin: '36px 0 12px',
                padding: '8px 0 8px 22px',
                borderLeft: '1px solid var(--brass)',
                fontFamily: "'Alice', serif",
                fontStyle: 'italic',
                fontVariationSettings: '"opsz" 144',
                fontSize: 24,
                lineHeight: 1.32,
                letterSpacing: '-0.01em',
                color: 'var(--ink)',
                maxWidth: '46ch',
              }}
            >
              {pullQuote}
            </blockquote>
          )}

          <Ornament kind="asterism" style={{ margin: '32px auto 24px' }} />

          {/* Transit context accordion */}
          <button
            type="button"
            onClick={() => setTransitsOpen((o) => !o)}
            aria-expanded={transitsOpen}
            style={{
              background: 'transparent',
              border: 0,
              padding: '6px 0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--ink-faint)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              transition: 'color 200ms',
            }}
          >
            <span style={{ color: 'var(--brass)' }}>
              {transitsOpen ? '−' : '+'}
            </span>
            Transit context
          </button>

          <div
            style={{
              overflow: 'hidden',
              maxHeight: transitsOpen ? 320 : 0,
              transition: 'max-height 400ms cubic-bezier(.2,.7,.3,1)',
            }}
          >
            <div style={{ paddingTop: 16 }}>
              <p
                style={{
                  fontFamily: "'Hanken Grotesk', serif",
                  fontStyle: 'italic',
                  color: 'var(--ink-faint)',
                  fontSize: 15,
                  margin: 0,
                  maxWidth: '56ch',
                }}
              >
                The morning cup is distilled from today&rsquo;s significant
                transits — fast-moving inner planets against your natal chart,
                and any outer-planet aspects currently tight by orb. The prose
                above names the one or two that most shape your day.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MorningShimmer() {
  return (
    <div aria-busy="true" style={{ minHeight: 220 }}>
      <div style={{ marginBottom: 28 }}>
        <Ornament kind="constellation" width={220} style={{ margin: 0, opacity: 0.5 }} />
      </div>
      {[96, 88, 92, 78, 84].map((w, i) => (
        <div
          key={i}
          className="shimmer-line"
          style={{ height: 16, width: `${w}%`, marginBottom: 14, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}
