"use client";

// TransitAlerts — bell icon in the dashboard header (badge count), and a
// right-hand slide-over panel listing upcoming transits fetched from
// GET /api/reading/transit-alerts. "Read more" streams the full reading from
// the same endpoint with ?generate=<scopeKey>. Dismiss X uses POST with
// { alertId, action:'dismiss' }. Depth-tier only.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BirthData, Tier } from '@/lib/types';

export type TransitAlertsProps = {
  user: BirthData;
  firstName: string;
  tier: Tier;
};

type RawAlert = {
  planet: string;
  aspect: string;
  target: string;
  exactDate: string;
  orb: number;
  scopeKey: string;
  generated: boolean;
};

type UiAlert = {
  id: string;       // = scopeKey
  name: string;     // e.g. "Saturn square Sun"
  date: string;     // human date
  short: string;    // short lede
  body: string;     // streamed reading once expanded
  loading: boolean;
  error: string | null;
  expanded: boolean;
};

const DATE_FMT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function prettyAspect(a: string): string {
  if (!a) return '';
  return a.replace(/[-_]/g, ' ');
}
function toUiAlert(r: RawAlert): UiAlert {
  const name = `${r.planet} ${prettyAspect(r.aspect)} natal ${r.target}`;
  let date = r.exactDate;
  const parsed = new Date(r.exactDate);
  if (!isNaN(parsed.getTime())) date = DATE_FMT.format(parsed);
  const short = `Exact ${date}. Orb ${r.orb.toFixed(2)}° at crossing.`;
  return {
    id: r.scopeKey,
    name,
    date,
    short,
    body: '',
    loading: false,
    error: null,
    expanded: false,
  };
}

async function streamSse(
  url: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  if (!res.ok) throw new Error(`Stream failed (${res.status})`);
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
        const evt = JSON.parse(json) as { type: string; delta?: string };
        if (evt.type === 'text' && typeof evt.delta === 'string') {
          full += evt.delta;
          onDelta(evt.delta);
        } else if (evt.type === 'done') {
          return full;
        }
      } catch { /* skip malformed frame */ }
    }
  }
  return full;
}

export default function TransitAlerts({ user: _user, firstName: _firstName, tier }: TransitAlertsProps) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<UiAlert[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const streamAborts = useRef<Map<string, AbortController>>(new Map());

  const badgeCount = alerts.length;

  const load = useCallback(async () => {
    if (tier !== 'depth') return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reading/transit-alerts', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Sign up to unlock real-time transit alerts.');
        throw new Error(`Alerts unavailable (${res.status}).`);
      }
      const text = await res.text();
      let payload: { alerts?: RawAlert[] } = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = {};
      }
      const raw = Array.isArray(payload.alerts) ? payload.alerts : [];
      setAlerts(raw.map(toUiAlert));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Alerts unavailable.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [tier]);

  useEffect(() => {
    if (tier === 'depth' && !fetchedRef.current) {
      fetchedRef.current = true;
      load();
    }
  }, [load, tier]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const dismiss = useCallback(async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    // Fire-and-forget the server-side dismiss (idempotent).
    try {
      await fetch('/api/reading/transit-alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ alertId: id, action: 'dismiss' }),
      });
    } catch {
      /* ignore — UI already removed it */
    }
  }, []);

  const toggleExpand = useCallback(
    (id: string) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, expanded: !a.expanded } : a)),
      );
      const target = alerts.find((a) => a.id === id);
      if (!target || target.expanded || target.body || target.loading) return;

      // Kick off the stream for this alert's full reading.
      streamAborts.current.get(id)?.abort();
      const ac = new AbortController();
      streamAborts.current.set(id, ac);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, loading: true, error: null } : a,
        ),
      );
      const url = `/api/reading/transit-alerts?generate=${encodeURIComponent(id)}`;
      streamSse(
        url,
        (delta) =>
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, body: a.body + delta } : a,
            ),
          ),
        ac.signal,
      )
        .then(() => {
          if (ac.signal.aborted) return;
          setAlerts((prev) =>
            prev.map((a) => (a.id === id ? { ...a, loading: false } : a)),
          );
        })
        .catch((e) => {
          if (ac.signal.aborted) return;
          const msg = e instanceof Error ? e.message : 'Stream failed.';
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, loading: false, error: msg } : a,
            ),
          );
        });
    },
    [alerts],
  );

  const visible = useMemo(() => alerts, [alerts]);

  // Only depth sees the bell at all.
  if (tier !== 'depth') return null;

  return (
    <>
      <button
        type="button"
        aria-label={`Transit alerts${badgeCount ? `, ${badgeCount} unread` : ''}`}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          top: 18,
          right: 140,
          zIndex: 40,
          background: 'rgba(200, 160, 82, 0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(200, 160, 82, 0.55)',
          color: 'var(--brass)',
          height: 40,
          padding: '0 16px',
          borderRadius: 20,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 12px rgba(200, 160, 82, 0.18)',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(200, 160, 82, 0.22)';
          e.currentTarget.style.borderColor = 'rgba(200, 160, 82, 0.85)';
          e.currentTarget.style.boxShadow = '0 2px 18px rgba(200, 160, 82, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(200, 160, 82, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(200, 160, 82, 0.55)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(200, 160, 82, 0.18)';
        }}
      >
        <span style={{ display: 'inline-flex', fontSize: 14, lineHeight: 1 }}>
          <BellGlyph />
        </span>
        <span className="dash-corner-label">Alerts</span>
        {badgeCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 10,
              background: 'var(--ember, #D4502C)',
              color: 'var(--ink, #FCFAF6)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              marginLeft: 2,
            }}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 58,
            background: 'var(--veil)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'reveal-rise 0.3s both',
          }}
        />
      )}

      <aside
        role="dialog"
        aria-label="Transit alerts"
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          maxWidth: '92vw',
          background: 'var(--bg-deep)',
          borderLeft: '1px solid var(--rule)',
          zIndex: 60,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 420ms cubic-bezier(.2,.7,.3,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            padding: '22px 22px 16px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--brass)',
                marginBottom: 6,
              }}
            >
              Upcoming · Transits
            </div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                margin: 0,
                color: 'var(--ink)',
              }}
            >
              What&rsquo;s near
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close alerts"
            onClick={() => setOpen(false)}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--ink)',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 22px' }}>
          {isLoading && (
            <div aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{ padding: '16px 0', borderBottom: '1px solid var(--rule)' }}
                >
                  <div
                    className="shimmer-line"
                    style={{ height: 12, width: '60%', marginBottom: 10, borderRadius: 2 }}
                  />
                  <div
                    className="shimmer-line"
                    style={{ height: 14, width: '90%', marginBottom: 6, borderRadius: 2 }}
                  />
                  <div
                    className="shimmer-line"
                    style={{ height: 14, width: '75%', borderRadius: 2 }}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div style={{ padding: '18px 0' }}>
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
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && visible.length === 0 && (
            <p
              style={{
                fontFamily: "'Crimson Pro', serif",
                fontStyle: 'italic',
                color: 'var(--ink-faint)',
                fontSize: 15,
                margin: '24px 0',
                textAlign: 'center',
              }}
            >
              The sky is quiet. Nothing to flag just yet.
            </p>
          )}

          {!isLoading && !error && visible.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {visible.map((a) => (
                <li
                  key={a.id}
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid var(--rule)',
                    position: 'relative',
                  }}
                >
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => dismiss(a.id)}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 0,
                      background: 'transparent',
                      border: 0,
                      color: 'var(--ink-faint)',
                      fontSize: 16,
                      cursor: 'pointer',
                      lineHeight: 1,
                      padding: 4,
                    }}
                  >
                    ×
                  </button>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'var(--brass)',
                      marginBottom: 6,
                      paddingRight: 28,
                    }}
                  >
                    {a.name}
                    {a.date && <span style={{ color: 'var(--ink-faint)' }}> · {a.date}</span>}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Crimson Pro', serif",
                      fontSize: 16,
                      lineHeight: 1.55,
                      color: 'var(--ink)',
                      margin: '0 0 8px',
                      paddingRight: 28,
                    }}
                  >
                    {a.short}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleExpand(a.id)}
                    aria-expanded={a.expanded}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      color: 'var(--brass)',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {a.expanded ? 'Close' : 'Read more'}
                  </button>
                  <div
                    style={{
                      overflow: 'hidden',
                      maxHeight: a.expanded ? 800 : 0,
                      transition: 'max-height 400ms cubic-bezier(.2,.7,.3,1)',
                    }}
                  >
                    <div style={{ padding: '12px 0 0' }}>
                      {a.loading && !a.body && (
                        <div>
                          <div
                            className="shimmer-line"
                            style={{ height: 14, width: '90%', marginBottom: 8, borderRadius: 2 }}
                          />
                          <div
                            className="shimmer-line"
                            style={{ height: 14, width: '74%', borderRadius: 2 }}
                          />
                        </div>
                      )}
                      {a.error && !a.body && (
                        <p
                          style={{
                            fontFamily: "'Crimson Pro', serif",
                            fontStyle: 'italic',
                            color: 'var(--ember)',
                            fontSize: 14,
                            margin: 0,
                          }}
                        >
                          {a.error}
                        </p>
                      )}
                      {a.body && (
                        <p
                          style={{
                            fontFamily: "'Crimson Pro', serif",
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: 'var(--ink-dim)',
                            margin: 0,
                          }}
                        >
                          {a.body}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function BellGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12 L12 12 M5 12 V7.5 a3 3 0 0 1 6 0 V12 M7 14 h2 M8 3 v-1" />
    </svg>
  );
}
