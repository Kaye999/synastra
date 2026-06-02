"use client";

// Fixed top navigation that switches between the Today home and the seven
// tradition deep-reads. Renders on both /today and /chart:
//   - "Today" tab navigates to /today
//   - Tradition tabs navigate to /chart?mode=<key>
// Active state is derived from the current pathname and either the optional
// `currentMode` prop (when /chart already owns mode state) or the ?mode query
// param. Locked tabs (per tier) still navigate — the chart page renders the
// PaywallBlur once you arrive.

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { canAccessTradition, type Tier } from '@/lib/tiers';
import {
  MODE_LABELS,
  MODE_TRADITION,
  TRADITION_TAB_ORDER,
  type Mode,
} from '@/lib/modes';

type TabKey = 'today' | Mode;

type Props = {
  tier: Tier;
  // When provided (chart page owns mode state), overrides URL-derived active.
  currentMode?: Mode;
};

function LockGlyph() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ marginLeft: 5, flexShrink: 0 }}
    >
      <rect x="5" y="11" width="14" height="9" rx="1.6" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.4" fill="none" />
    </svg>
  );
}

export default function TraditionTopBar({ tier, currentMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const onToday = pathname === '/today';
  const urlMode = (search.get('mode') as Mode | null) ?? undefined;
  const activeMode: Mode | undefined = onToday
    ? undefined
    : (currentMode ?? urlMode ?? 'astro');

  const tabs: TabKey[] = ['today', ...TRADITION_TAB_ORDER];

  const goTo = (tab: TabKey) => {
    if (tab === 'today') {
      router.push('/today');
      return;
    }
    // If we're already on /chart, push the query param. Otherwise navigate.
    if (pathname === '/chart' && currentMode !== undefined) {
      // Chart owns the mode locally — let the page handle it via the URL too
      // so back/forward works, but the local state will sync via effect.
      router.push(`/chart?mode=${tab}`);
    } else {
      router.push(`/chart?mode=${tab}`);
    }
  };

  return (
    <nav
      aria-label="Synastra traditions"
      style={{
        position: 'fixed',
        top: 68,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 14, 26, 0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(252, 250, 246, 0.04)',
        borderBottom: '1px solid rgba(252, 250, 246, 0.06)',
        padding: '0 24px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}
      >
        {tabs.map((tab, i) => {
          const isToday = tab === 'today';
          const active = isToday ? onToday : activeMode === tab;
          const locked = isToday
            ? false
            : !canAccessTradition(tier, MODE_TRADITION[tab as Mode]);
          const label = isToday ? 'Today' : MODE_LABELS[tab as Mode];
          return (
            <span key={tab} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: 'rgba(252, 250, 246, 0.18)',
                    margin: '0 8px',
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => goTo(tab)}
                className={active ? 'active' : ''}
                style={{
                  background: 'transparent',
                  border: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 6px',
                  color: active
                    ? 'var(--brass)'
                    : locked
                      ? 'rgba(252, 250, 246, 0.40)'
                      : 'rgba(252, 250, 246, 0.62)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = locked
                      ? 'rgba(252, 250, 246, 0.40)'
                      : 'rgba(252, 250, 246, 0.62)';
                  }
                }}
              >
                {label}
                {locked && <LockGlyph />}
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      bottom: 2,
                      height: 2,
                      background: 'var(--brass)',
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
