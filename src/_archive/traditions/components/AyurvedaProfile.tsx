"use client";

// AyurvedaProfile — interactive dosha portrait.
//
// The centrepiece is a stacked balance bar showing vata / pitta / kapha
// percentages. Hover a segment for a tooltip with that dosha's qualities and
// exact percentage; click a segment to swap the focus dosha for the panels
// below. The "In balance" / "Out of balance" cards, the daily tabs
// (Food · Activity · Sleep · Avoid), and the pairings section all react to
// the focus dosha.
//
// Streams the Ayurveda × chart reading from /api/reading/ayurveda when the
// reader presses the final CTA. Respects prefers-reduced-motion.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ornament from './Ornament';
import { DOSHAS, type DoshaInterpretation } from '@/lib/interp/ayurveda-doshas';
import { constitutionLabel, type Dosha, type Prakruti } from '@/lib/engines/ayurveda';

export type AyurvedaProfileProps = {
  prakruti: Prakruti;
  firstName?: string;
};

type DailyTab = 'food' | 'activity' | 'sleep' | 'avoid';

const TAB_ORDER: DailyTab[] = ['food', 'activity', 'sleep', 'avoid'];

const DOSHA_COLORS: Record<Dosha, string> = {
  vata: 'var(--brass)',
  pitta: 'var(--ember)',
  kapha: 'var(--copper)',
};

const DOSHA_COLORS_SOFT: Record<Dosha, string> = {
  vata: 'rgba(200,160,82,0.20)',
  pitta: 'rgba(168,75,62,0.22)',
  kapha: 'rgba(184,115,51,0.22)',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function combinedElements(p: Prakruti): string {
  const d = DOSHAS[p.dominant];
  if (p.type === 'single' || !p.secondary) return d.elements;
  const s = DOSHAS[p.secondary];
  // Merge elements without duplicates: "Air + Ether" + "Fire + Water" => "Air · Fire · Ether · Water"
  const parts = new Set<string>([
    ...d.elements.split('+').map((x) => x.trim()),
    ...s.elements.split('+').map((x) => x.trim()),
  ]);
  return Array.from(parts).join(' · ');
}

async function readSse(
  url: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  if (!res.ok) {
    let msg = `The reading did not arrive (${res.status}).`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed?.error) msg = `The reading did not arrive — ${parsed.error}.`;
    } catch {
      /* keep generic */
    }
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

export default function AyurvedaProfile({ prakruti, firstName }: AyurvedaProfileProps) {
  const [focus, setFocus] = useState<Dosha>(prakruti.dominant);
  const [tab, setTab] = useState<DailyTab>('food');
  const [tabVisible, setTabVisible] = useState<boolean>(true);
  const [cardsVisible, setCardsVisible] = useState<boolean>(true);

  // Reading stream state
  const [readingOpen, setReadingOpen] = useState<boolean>(false);
  const [readingBody, setReadingBody] = useState<string>('');
  const [readingLoading, setReadingLoading] = useState<boolean>(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const label = useMemo(() => constitutionLabel(prakruti), [prakruti]);
  const elements = useMemo(() => combinedElements(prakruti), [prakruti]);
  const focusInterp: DoshaInterpretation = DOSHAS[focus];

  function reducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  // Crossfade focus-driven cards when the dosha changes.
  useEffect(() => {
    if (reducedMotion()) {
      setCardsVisible(true);
      return;
    }
    setCardsVisible(false);
    const t = setTimeout(() => setCardsVisible(true), 20);
    return () => clearTimeout(t);
  }, [focus]);

  // Crossfade daily recommendations when the tab changes.
  useEffect(() => {
    if (reducedMotion()) {
      setTabVisible(true);
      return;
    }
    setTabVisible(false);
    const t = setTimeout(() => setTabVisible(true), 20);
    return () => clearTimeout(t);
  }, [tab, focus]);

  const loadReading = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setReadingLoading(true);
    setReadingError(null);
    setReadingBody('');
    setReadingOpen(true);
    try {
      await readSse(
        '/api/reading/ayurveda',
        (delta) => setReadingBody((prev) => prev + delta),
        ac.signal,
      );
    } catch (e) {
      if (ac.signal.aborted) return;
      setReadingError(e instanceof Error ? e.message : 'The reading did not arrive.');
    } finally {
      if (!ac.signal.aborted) setReadingLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const name = firstName && firstName.trim() ? firstName : 'The reader';

  return (
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        padding: '56px 24px 96px',
        color: 'var(--ink)',
      }}
    >
      {/* ── Hero ───────────────────────────────────────────── */}
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
        § Ayurveda · {name}&rsquo;s Prakruti
      </div>

      <h1
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 'clamp(48px, 7vw, 88px)',
          fontWeight: 600,
          letterSpacing: '-0.022em',
          lineHeight: 1.0,
          margin: '0 0 10px',
        }}
      >
        {label}
      </h1>

      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontStyle: 'italic',
          fontSize: 22,
          color: 'var(--ink-dim)',
          margin: '0 0 36px',
        }}
      >
        {elements}
        {prakruti.type === 'tri' ? ' — a rare tri-doshic reading' : ''}
      </p>

      {/* ── Balance bar ────────────────────────────────────── */}
      <BalanceBar
        prakruti={prakruti}
        focus={focus}
        onFocusChange={setFocus}
      />

      {/* ── In / Out of balance cards ──────────────────────── */}
      <div
        style={{
          marginTop: 56,
          opacity: cardsVisible ? 1 : 0,
          transform: cardsVisible ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}
      >
        <SectionEyebrow color={DOSHA_COLORS[focus]}>
          § {focusInterp.name} · {focusInterp.elements}
        </SectionEyebrow>

        <p
          style={{
            fontFamily: "'Hanken Grotesk', serif",
            fontSize: 19,
            lineHeight: 1.72,
            color: 'var(--ink)',
            margin: '12px 0 36px',
            maxWidth: '72ch',
          }}
        >
          {focusInterp.body}
        </p>

        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          <BalanceCard
            title="In balance"
            body={focusInterp.inBalance}
            accent={DOSHA_COLORS[focus]}
          />
          <BalanceCard
            title="Out of balance"
            body={focusInterp.outOfBalance}
            accent="var(--ember)"
          />
        </div>
      </div>

      {/* ── Daily recommendations ──────────────────────────── */}
      <Ornament kind="rule" width={260} style={{ margin: '72px auto 40px' }} />

      <SectionEyebrow color={DOSHA_COLORS[focus]}>§ Daily · tailored to {focusInterp.name}</SectionEyebrow>

      <div
        role="tablist"
        aria-label="Daily recommendations"
        style={{
          display: 'flex',
          gap: 0,
          marginTop: 20,
          borderBottom: '1px solid var(--rule)',
          flexWrap: 'wrap',
        }}
      >
        {TAB_ORDER.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t)}
              style={{
                background: 'transparent',
                border: 0,
                padding: '14px 20px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: active ? 'var(--ink)' : 'var(--ink-faint)',
                cursor: 'pointer',
                borderBottom: active ? `1px solid ${DOSHA_COLORS[focus]}` : '1px solid transparent',
                marginBottom: -1,
                transition: 'color 220ms ease, border-color 220ms ease',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 28,
          minHeight: 160,
          opacity: tabVisible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      >
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 14,
          }}
        >
          {focusInterp.daily[tab].map((item, i) => (
            <li
              key={`${tab}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                fontFamily: "'Hanken Grotesk', serif",
                fontSize: 18,
                lineHeight: 1.6,
                color: 'var(--ink)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  color: DOSHA_COLORS[focus],
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  paddingTop: 4,
                  minWidth: 28,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Pairings ───────────────────────────────────────── */}
      <Ornament kind="rule" width={260} style={{ margin: '72px auto 40px' }} />

      <SectionEyebrow color="var(--brass)">§ Pairings · {DOSHAS[prakruti.dominant].name} with each dosha</SectionEyebrow>

      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {(['vata', 'pitta', 'kapha'] as Dosha[]).map((other) => {
          const dominantInterp = DOSHAS[prakruti.dominant];
          const text = dominantInterp.pairings[other];
          const isSelf = other === prakruti.dominant;
          return (
            <article
              key={other}
              style={{
                border: '1px solid var(--rule)',
                padding: '24px 22px',
                background: 'var(--mist)',
                borderLeft: `2px solid ${DOSHA_COLORS[other]}`,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: DOSHA_COLORS[other],
                  marginBottom: 10,
                }}
              >
                {dominantInterp.name} × {DOSHAS[other].name}
                {isSelf ? ' · self' : ''}
              </div>
              <p
                style={{
                  fontFamily: "'Hanken Grotesk', serif",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                {text}
              </p>
            </article>
          );
        })}
      </div>

      {/* ── CTA · Claude × chart reading ───────────────────── */}
      <Ornament kind="rule" width={260} style={{ margin: '96px auto 40px' }} />

      {!readingOpen && (
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={loadReading}
            className="ayurveda-cta"
            style={{
              background: 'transparent',
              border: '1px solid var(--brass)',
              color: 'var(--brass)',
              padding: '16px 32px',
              fontFamily: "'Alice', serif",
              fontSize: 16,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'background 220ms ease, color 220ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--brass)';
              e.currentTarget.style.color = 'var(--bg-base)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--brass)';
            }}
          >
            Read against your chart →
          </button>
        </div>
      )}

      {readingOpen && (
        <section
          aria-label="Ayurveda × chart reading"
          style={{
            marginTop: 12,
            padding: '36px 32px',
            border: '1px solid var(--rule)',
            background:
              'radial-gradient(ellipse at 30% 0%, rgba(200,160,82,0.06), transparent 70%), var(--mist)',
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brass)',
              marginBottom: 14,
            }}
          >
            § Ayurveda × chart · {label}
          </div>

          {readingLoading && !readingBody && (
            <div aria-busy="true" style={{ minHeight: 180 }}>
              {[94, 88, 82, 90, 76].map((w, i) => (
                <div
                  key={i}
                  className="shimmer-line"
                  style={{ height: 16, width: `${w}%`, marginBottom: 14, borderRadius: 2 }}
                />
              ))}
            </div>
          )}

          {readingError && (
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
                {readingError}
              </p>
              <button
                type="button"
                onClick={loadReading}
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
                Try again
              </button>
            </div>
          )}

          {readingBody && !readingError && (
            <div
              style={{
                fontFamily: "'Hanken Grotesk', serif",
                fontSize: 19,
                lineHeight: 1.72,
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {readingBody}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ─── sub-components ─────────────────────────────────────────── */

function SectionEyebrow({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
}

function BalanceCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <article
      style={{
        border: '1px solid var(--rule)',
        padding: '24px 22px',
        background: 'var(--mist)',
        borderLeft: `2px solid ${accent}`,
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 17,
          lineHeight: 1.65,
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        {body}
      </p>
    </article>
  );
}

function BalanceBar({
  prakruti,
  focus,
  onFocusChange,
}: {
  prakruti: Prakruti;
  focus: Dosha;
  onFocusChange: (d: Dosha) => void;
}) {
  const [hover, setHover] = useState<Dosha | null>(null);
  const pct = prakruti.percentages;
  const order: Dosha[] = ['vata', 'pitta', 'kapha'];
  const active = hover ?? focus;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          § Balance
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'var(--ink-dim)',
          }}
        >
          {order
            .map((d) => `${d.toUpperCase()} ${pct[d]}%`)
            .join('  ·  ')}
        </div>
      </div>

      <div
        role="group"
        aria-label="Dosha balance"
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: 40,
          border: '1px solid var(--rule)',
          overflow: 'hidden',
          background: 'var(--bg-deep)',
        }}
      >
        {order.map((d) => {
          const isFocus = focus === d;
          const isHover = hover === d;
          const w = pct[d];
          return (
            <button
              key={d}
              type="button"
              aria-label={`${DOSHAS[d].name} ${w}%`}
              aria-pressed={isFocus}
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d)}
              onBlur={() => setHover(null)}
              onClick={() => onFocusChange(d)}
              style={{
                flexBasis: `${w}%`,
                flexGrow: 0,
                flexShrink: 0,
                height: '100%',
                padding: 0,
                border: 0,
                background: DOSHA_COLORS[d],
                position: 'relative',
                cursor: 'pointer',
                opacity: isFocus || isHover ? 1 : 0.82,
                transition: 'opacity 220ms ease, filter 220ms ease',
                filter: isFocus ? 'brightness(1.08)' : 'brightness(1.0)',
                outline: isFocus ? '2px solid var(--ink)' : 'none',
                outlineOffset: -2,
              }}
            >
              {w >= 18 && (
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--bg-base)',
                    fontWeight: 500,
                  }}
                >
                  {DOSHAS[d].name} · {w}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tooltip row — the hovered (or focused) segment's qualities */}
      <div
        aria-live="polite"
        style={{
          marginTop: 14,
          minHeight: 28,
          fontFamily: "'Hanken Grotesk', serif",
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--ink-dim)',
          transition: 'color 220ms ease',
        }}
      >
        <span style={{ color: DOSHA_COLORS[active], fontStyle: 'normal' }}>
          {DOSHAS[active].name} {pct[active]}%
        </span>
        <span aria-hidden="true"> — </span>
        <span>{DOSHAS[active].qualities.join(', ')}</span>
      </div>

      {/* Below-bar legend of clickable dosha chips — helpful on touch where hover doesn't apply */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 14,
          flexWrap: 'wrap',
        }}
      >
        {order.map((d) => {
          const isFocus = focus === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onFocusChange(d)}
              aria-pressed={isFocus}
              style={{
                background: isFocus ? DOSHA_COLORS_SOFT[d] : 'transparent',
                border: `1px solid ${isFocus ? DOSHA_COLORS[d] : 'var(--rule)'}`,
                color: isFocus ? 'var(--ink)' : 'var(--ink-dim)',
                padding: '6px 12px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 220ms ease, border-color 220ms ease, color 220ms ease',
              }}
            >
              {capitalize(d)} · {pct[d]}%
            </button>
          );
        })}
      </div>
    </div>
  );
}
