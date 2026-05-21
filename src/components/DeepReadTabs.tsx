"use client";

// DeepReadTabs — three long-form readings (Life Purpose · Shadow Work · Wealth
// Timing). Each tab lazy-loads its reading on first click via a GET SSE stream.
// The server caches life-purpose + shadow forever and regenerates wealth when
// the quarterly scope key rolls over, so repeat loads are effectively instant.
//
// Depth-tier gated via PaywallBlur at the section level.

import { useCallback, useMemo, useRef, useState } from 'react';
import ReadingCard from './ReadingCard';
import PaywallBlur from './PaywallBlur';
import type { BirthData, Tier } from '@/lib/types';

type TabKey = 'purpose' | 'shadow' | 'wealth';

type TabDef = {
  key: TabKey;
  label: string;
  endpoint: string;
  eyebrow: string;
  title: string;
  regenPolicy: 'once' | 'quarterly';
};

const TABS: TabDef[] = [
  {
    key: 'purpose',
    label: 'Life Purpose',
    endpoint: '/api/reading/life-purpose',
    eyebrow: 'Deep Read · Once',
    title: 'What your chart is built to do',
    regenPolicy: 'once',
  },
  {
    key: 'shadow',
    label: 'Shadow Work',
    endpoint: '/api/reading/shadow',
    eyebrow: 'Deep Read · Once',
    title: 'The inheritance you are composting',
    regenPolicy: 'once',
  },
  {
    key: 'wealth',
    label: 'Wealth Timing',
    endpoint: '/api/reading/wealth',
    eyebrow: 'Deep Read · Quarterly',
    title: 'When the money gates open',
    regenPolicy: 'quarterly',
  },
];

type ReadingState = {
  body: string;
  loading: boolean;
  streaming: boolean;
  error: string | null;
  fetchedAt?: number;
};

const EMPTY: ReadingState = { body: '', loading: false, streaming: false, error: null };

async function readSse(
  url: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  if (!res.ok) {
    let msg = `Reading unavailable (${res.status}).`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed?.error) msg = parsed.error;
    } catch { /* keep generic */ }
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

export type DeepReadTabsProps = {
  user: BirthData;
  firstName: string;
  tier: Tier;
};

export default function DeepReadTabs({ user: _user, firstName: _firstName, tier }: DeepReadTabsProps) {
  const [active, setActive] = useState<TabKey>('purpose');
  const [readings, setReadings] = useState<Record<TabKey, ReadingState>>({
    purpose: EMPTY,
    shadow: EMPTY,
    wealth: EMPTY,
  });
  const aborts = useRef<Record<TabKey, AbortController | null>>({
    purpose: null,
    shadow: null,
    wealth: null,
  });
  const kickedOff = useRef(false);

  const activeTab = useMemo(() => TABS.find((t) => t.key === active)!, [active]);

  const load = useCallback(async (tab: TabDef) => {
    aborts.current[tab.key]?.abort();
    const ac = new AbortController();
    aborts.current[tab.key] = ac;
    setReadings((r) => ({
      ...r,
      [tab.key]: { body: '', loading: true, streaming: true, error: null },
    }));
    try {
      await readSse(
        tab.endpoint,
        (delta) =>
          setReadings((r) => ({
            ...r,
            [tab.key]: { ...r[tab.key], body: r[tab.key].body + delta },
          })),
        ac.signal,
      );
      if (ac.signal.aborted) return;
      setReadings((r) => ({
        ...r,
        [tab.key]: {
          ...r[tab.key],
          loading: false,
          streaming: false,
          error: null,
          fetchedAt: Date.now(),
        },
      }));
    } catch (e) {
      if (ac.signal.aborted) return;
      const raw = e instanceof Error ? e.message : 'Reading unavailable.';
      // Map common server error codes to copy that won't scare a reader.
      // Raw "profile-not-found" / "unauthorised" / "tier_limit_reached"
      // strings used to leak straight onto the card — fixed 2026-05-19.
      let msg = raw;
      if (raw === 'profile-not-found' || raw === 'unauthorised' || raw === '404') {
        msg = 'This reading needs your saved chart — head to onboarding to cast yours, or sign in if you already have.';
      } else if (raw === 'tier_limit_reached') {
        msg = 'Daily limit reached. The Seven tier gets unlimited deep reads.';
      } else if (raw.startsWith('stream-')) {
        msg = 'The stream stuttered. Try again in a moment.';
      }
      setReadings((r) => ({
        ...r,
        [tab.key]: { body: '', loading: false, streaming: false, error: msg },
      }));
    }
  }, []);

  const handleTabClick = useCallback(
    (tab: TabDef) => {
      setActive(tab.key);
      const r = readings[tab.key];
      if (!r.body && !r.loading && !r.error) {
        load(tab);
      }
    },
    [load, readings],
  );

  // Kick off the first tab once, only on Seven+ (otherwise the paywall covers
  // everything and we avoid wasting a fetch).
  if ((tier === 'depth' || tier === 'master') && !kickedOff.current) {
    kickedOff.current = true;
    const t = TABS.find((x) => x.key === active)!;
    if (!readings[t.key].body && !readings[t.key].loading) {
      // Fire-and-forget; safe — setState inside `load` triggers re-render.
      load(t);
    }
  }

  const current = readings[active];

  return (
    <section aria-label="Deep readings">
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
        Deep Reads · Long-form
      </div>

      <h2
        style={{
          fontFamily: "'Fraunces', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          margin: '0 0 24px',
          color: 'var(--ink)',
        }}
      >
        Three essays, written for your chart
      </h2>

      <PaywallBlur
        tier={tier}
        required="depth"
        teaser="The deep reads look under the surface — where the chart stops being personality and starts being fate."
      >
        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Deep read tabs"
          style={{
            display: 'flex',
            gap: 28,
            borderBottom: '1px solid var(--rule)',
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleTabClick(t)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '10px 0',
                  color: isActive ? 'var(--brass)' : 'var(--ink-faint)',
                  borderBottom: isActive ? '2px solid var(--brass)' : '2px solid transparent',
                  marginBottom: -1,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'color 200ms, border-color 200ms',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby={`tab-${active}`}>
          <ReadingCard
            eyebrow={activeTab.eyebrow}
            title={activeTab.title}
            isLoading={current.loading && !current.body}
            error={current.error}
            onRefresh={() => load(activeTab)}
            body={
              current.body ? (
                <div>
                  {current.body.split(/\n{2,}/).map((para, i) => (
                    <p key={i} style={{ margin: '0 0 16px' }}>
                      {para}
                    </p>
                  ))}
                </div>
              ) : null
            }
            footer={
              current.fetchedAt
                ? activeTab.regenPolicy === 'quarterly'
                  ? 'Regenerates quarterly · stored for you'
                  : 'Generated once · stored for you'
                : undefined
            }
          />
        </div>
      </PaywallBlur>
    </section>
  );
}
