"use client";

// TarotSpread — three-card and Celtic Cross casting.
//
// Lifecycle:
//   1. Question input (max 200 chars) + "Cast the cards" CTA.
//   2. On submit, the cards stack on the centre of the stage and perform a
//      riffle shuffle (400ms) then deal out one at a time, staggered every
//      400ms, flipping as they land in their slots.
//   3. Each dealt card uses the same flip animation as TarotDailyCard.
//      Once laid, card keywords render as brass pills beneath each slot.
//   4. Claude's interpretation streams in below via POST /api/reading/tarot.
//      The streamed body renders with drop cap + editorial typography.
//
// Tier gates:
//   - three-card: reader+ (free sees the shuffle blurred + upsell)
//   - celtic-cross: depth only (free/reader see depth upsell)
//
// Determinism: the draw itself is server-side. On the client we wait for the
// API to return before showing cards, because the cards the server reasons
// over MUST match what the user sees. The SSE protocol embeds the card list
// as a leading `{type:'cards', spread:[...]}` frame before the first text
// delta. (See the route; if the route doesn't emit that frame, we fall back
// to rendering just the streamed body.)

import { useCallback, useEffect, useRef, useState } from 'react';
import PaywallBlur from './PaywallBlur';
import type { Tier } from '@/lib/tiers';
import {
  drawThreeCard,
  drawCelticCross,
  type ThreeCardSpread,
  type CelticCrossSpread,
  type TarotDraw,
} from '@/lib/engines/tarot';

export type TarotSpreadType = 'three-card' | 'celtic-cross';

export type TarotSpreadProps = {
  spreadType: TarotSpreadType;
  userId: string;
  userContext?: unknown;
  tier: Tier;
};

/* ============================================================
 * SSE reader
 * ============================================================ */

async function readSse(
  url: string,
  init: RequestInit,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { ...init, signal, cache: 'no-store' });
  if (!res.ok) {
    let msg = `The cards will not speak (${res.status}).`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed?.message) msg = parsed.message;
      else if (parsed?.error) msg = `The cards will not speak — ${parsed.error}.`;
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

/* ============================================================
 * Card back + tiny face (reused, scaled down)
 * ============================================================ */

function MiniCardBack() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 260" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="0" y="0" width="160" height="260" fill="var(--bg-deep)" />
      <rect x="5" y="5" width="150" height="250" fill="none" stroke="var(--brass)" strokeWidth="1" />
      <g transform="translate(80 130)" stroke="var(--brass)" strokeWidth="0.6" fill="none">
        <circle r="22" />
        <circle r="13" />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (Math.PI / 3) * i;
          return (
            <circle
              key={i}
              cx={13 * Math.cos(a)}
              cy={13 * Math.sin(a)}
              r="13"
              opacity="0.5"
            />
          );
        })}
        <circle r="2.5" fill="var(--brass)" />
      </g>
      <text x="80" y="46" textAnchor="middle" fontFamily="'Fraunces', serif" fontSize="10" letterSpacing="0.28em" fill="var(--brass)" fontWeight="600">
        SYNASTRA
      </text>
    </svg>
  );
}

function MiniCardFront({ draw }: { draw: TarotDraw }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 160 260" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="0" y="0" width="160" height="260" fill="var(--bg-deep)" />
      <rect x="5" y="5" width="150" height="250" fill="none" stroke="var(--brass)" strokeWidth="1" />
      <rect x="11" y="11" width="138" height="238" fill="none" stroke="var(--brass)" strokeWidth="0.4" opacity="0.6" />
      <text x="80" y="30" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="9" letterSpacing="0.22em" fill="var(--brass)">
        {draw.card.arcana === 'major' ? 'MAJOR' : (draw.card.suit ?? '').toUpperCase()}
      </text>
      <g transform="translate(80 130)" stroke="var(--brass)" strokeWidth="0.9" fill="none">
        <circle r="28" opacity="0.55" />
        {draw.card.arcana === 'major' ? (
          <text textAnchor="middle" y="6" fontFamily="'Fraunces', serif" fontStyle="italic" fontSize="22" fill="var(--brass)">
            {romanFor(draw.card.id)}
          </text>
        ) : (
          <text textAnchor="middle" y="6" fontFamily="'Fraunces', serif" fontSize="18" fill="var(--brass)">
            {draw.card.number}
          </text>
        )}
      </g>
      <text x="80" y="212" textAnchor="middle" fontFamily="'Fraunces', serif" fontSize="13" fontWeight="600" fill="var(--ink)" letterSpacing="-0.01em">
        <NameTspans name={draw.card.name} />
      </text>
      {draw.card.zodiacal && (
        <text x="80" y="236" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="8" letterSpacing="0.22em" fill="var(--brass)">
          {draw.card.zodiacal.toUpperCase()}
        </text>
      )}
    </svg>
  );
}

function NameTspans({ name }: { name: string }) {
  // Break long card names across two lines.
  if (name.length <= 14) return <>{name}</>;
  const words = name.split(' ');
  const mid = Math.ceil(words.length / 2);
  const top = words.slice(0, mid).join(' ');
  const bot = words.slice(mid).join(' ');
  return (
    <>
      <tspan x="80" dy="0">{top}</tspan>
      <tspan x="80" dy="14">{bot}</tspan>
    </>
  );
}

// Card number label — Arabic for readability (was Roman pre-2026-05-19).
// Kept as a function for callsite ergonomics.
function romanFor(id: number): string {
  return String(id);
}

/* ============================================================
 * Layout specs
 * ============================================================ */

// Celtic Cross positions in CSS grid coordinates (on a 5-col x 4-row grid).
// 1 significator centre, 2 crossing overlays 1 rotated, 3 below, 5 above,
// 4 left, 6 right. Staff 7-10 runs down the rightmost column.
const CELTIC_GRID: { col: number; row: number; rotate?: boolean }[] = [
  { col: 2, row: 2 },             // 1 Heart
  { col: 2, row: 2, rotate: true }, // 2 Crossing (overlay)
  { col: 2, row: 3 },             // 3 Foundation
  { col: 1, row: 2 },             // 4 Recent Past
  { col: 2, row: 1 },             // 5 Crown
  { col: 3, row: 2 },             // 6 Near Future
  { col: 5, row: 4 },             // 7 Self
  { col: 5, row: 3 },             // 8 Environment
  { col: 5, row: 2 },             // 9 Hopes & Fears
  { col: 5, row: 1 },             // 10 Outcome
];

/* ============================================================
 * Component
 * ============================================================ */

type Phase = 'idle' | 'shuffling' | 'dealing' | 'dealt' | 'reading' | 'done' | 'error';

export default function TarotSpread({ spreadType, userId, userContext, tier }: TarotSpreadProps) {
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [spread, setSpread] = useState<ThreeCardSpread | CelticCrossSpread | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const dealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const canRun =
    spreadType === 'three-card'
      ? tier === 'reader' || tier === 'depth'
      : tier === 'depth';

  const clearTimers = () => {
    dealTimersRef.current.forEach(clearTimeout);
    dealTimersRef.current = [];
  };

  useEffect(() => () => {
    abortRef.current?.abort();
    clearTimers();
  }, []);

  const cast = useCallback(async () => {
    if (!canRun) return;
    abortRef.current?.abort();
    clearTimers();
    const ac = new AbortController();
    abortRef.current = ac;
    setError(null);
    setBody('');
    setSpread(null);
    setRevealedCount(0);

    // Deterministic client-side draw — mirrors the server for rendering.
    const s = spreadType === 'three-card'
      ? drawThreeCard(userId, question)
      : drawCelticCross(userId, question);
    setSpread(s);

    // Shuffle then deal.
    setPhase('shuffling');
    await new Promise((r) => setTimeout(r, 700));
    setPhase('dealing');

    const stagger = 400;
    s.forEach((_, i) => {
      const t = setTimeout(() => setRevealedCount(i + 1), stagger * i);
      dealTimersRef.current.push(t);
    });
    const totalDeal = stagger * s.length;
    const tDone = setTimeout(() => {
      setPhase('dealt');
      // Auto-start the reading once all dealt.
      void startReading(s);
    }, totalDeal);
    dealTimersRef.current.push(tDone);
  }, [canRun, question, spreadType, userId]);

  const startReading = useCallback(async (s: ThreeCardSpread | CelticCrossSpread) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase('reading');
    setError(null);
    setBody('');
    try {
      await readSse(
        '/api/reading/tarot',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: spreadType,
            question,
            userContext: typeof userContext === 'string' ? userContext : undefined,
          }),
        },
        (delta) => setBody((prev) => prev + delta),
        ac.signal,
      );
      if (!ac.signal.aborted) setPhase('done');
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'The cards fell silent.');
      setPhase('error');
    }
    void s; // already committed to state above
  }, [question, spreadType, userContext]);

  const firstLetter = body ? body.charAt(0) : '';
  const bodyRest = body ? body.slice(1) : '';

  // Tier-gated shell: free/reader blurred for celtic-cross, free blurred for three-card.
  const required: Tier = spreadType === 'celtic-cross' ? 'depth' : 'reader';

  const content = (
    <section
      aria-label={spreadType === 'three-card' ? 'Three-card tarot spread' : 'Celtic Cross tarot spread'}
      className="tarot-spread"
    >
      <div className="tarot-spread-head">
        <div className="tarot-eyebrow">
          § {spreadType === 'three-card' ? 'Three-card spread — Past · Present · Future' : 'Celtic Cross — Ten-card spread'}
        </div>
        <h2 className="tarot-spread-title">
          {spreadType === 'three-card' ? 'Cast the three cards.' : 'Cast the full cross.'}
        </h2>
        <p className="tarot-spread-sub">
          {spreadType === 'three-card'
            ? 'A question, and three cards cut from the deck against your chart.'
            : 'Ten cards across the classic cross and staff. Long-form reading.'}
        </p>
      </div>

      <div className="tarot-spread-question">
        <label htmlFor="tarot-question">Question</label>
        <input
          id="tarot-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
          maxLength={200}
          placeholder="What lies at the hinge of this next decision?"
          disabled={phase === 'shuffling' || phase === 'dealing' || phase === 'reading'}
        />
        <div className="tarot-spread-count">{question.length}/200</div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          type="button"
          className="tarot-cta"
          onClick={cast}
          disabled={!canRun || phase === 'shuffling' || phase === 'dealing' || phase === 'reading'}
        >
          {phase === 'idle' || phase === 'done' || phase === 'error' ? 'Cast the cards' :
           phase === 'shuffling' ? 'Shuffling…' :
           phase === 'dealing' ? 'Dealing…' :
           phase === 'reading' ? 'Reading…' : 'Cast the cards'}
        </button>
      </div>

      {/* Stage */}
      {spread && (
        <div className={`tarot-stage ${spreadType}`}>
          {spreadType === 'three-card' ? (
            <div className="three-row">
              {(spread as ThreeCardSpread).map((d, i) => (
                <CardSlot
                  key={d.position}
                  draw={d}
                  revealed={i < revealedCount}
                  shuffling={phase === 'shuffling'}
                  label={d.label}
                  index={i + 1}
                />
              ))}
            </div>
          ) : (
            <div className="celtic-grid">
              {(spread as CelticCrossSpread).map((d, i) => {
                const pos = CELTIC_GRID[i];
                return (
                  <div
                    key={d.position}
                    className="celtic-slot"
                    style={{
                      gridColumn: pos.col,
                      gridRow: pos.row,
                      zIndex: pos.rotate ? 2 : 1,
                      transform: pos.rotate ? 'rotate(90deg)' : undefined,
                    }}
                  >
                    <CardSlot
                      draw={d}
                      revealed={i < revealedCount}
                      shuffling={phase === 'shuffling'}
                      label={d.label}
                      index={i + 1}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reading */}
      {(phase === 'reading' || phase === 'done' || (phase === 'error' && body)) && (
        <div className="tarot-reading">
          {body && (
            <div className="tarot-reading-body">
              <span className="tarot-drop-cap" aria-hidden="true">{firstLetter}</span>
              <span style={{ whiteSpace: 'pre-wrap' }}>{bodyRest}</span>
              <span style={{ display: 'block', clear: 'both' }} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', color: 'var(--ember)' }}>{error}</p>
        </div>
      )}

      <style jsx>{`
        .tarot-spread {
          padding: 40px 32px;
          border: 1px solid var(--rule);
          background: var(--mist);
        }
        .tarot-spread-head {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 28px;
        }
        .tarot-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass);
          margin-bottom: 14px;
        }
        .tarot-spread-title {
          font-family: 'Fraunces', serif;
          font-variation-settings: 'opsz' 144;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.02;
          color: var(--ink);
          margin: 0 0 10px;
        }
        .tarot-spread-sub {
          font-family: 'Crimson Pro', serif;
          font-style: italic;
          font-size: 17px;
          color: var(--ink-dim);
          margin: 0;
          line-height: 1.45;
        }

        .tarot-spread-question {
          max-width: 560px;
          margin: 32px auto 0;
          position: relative;
        }
        .tarot-spread-question label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass);
          margin-bottom: 8px;
        }
        .tarot-spread-question input {
          width: 100%;
          background: transparent;
          border: 0;
          border-bottom: 1px solid var(--rule);
          color: var(--ink);
          font-family: 'Crimson Pro', serif;
          font-size: 18px;
          padding: 8px 0;
          outline: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .tarot-spread-question input::placeholder {
          color: var(--ink-faint);
          font-style: italic;
        }
        .tarot-spread-question input:focus {
          border-bottom: 2px solid var(--brass);
          color: var(--brass);
        }
        .tarot-spread-count {
          position: absolute;
          right: 0;
          bottom: -20px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.22em;
          color: var(--ink-faint);
        }

        .tarot-cta {
          background: transparent;
          border: 1px solid var(--brass);
          color: var(--brass);
          padding: 12px 28px;
          font-family: 'Fraunces', serif;
          font-size: 14px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.28s, color 0.28s;
        }
        .tarot-cta:hover:not(:disabled) {
          background: var(--brass);
          color: var(--bg-base);
        }
        .tarot-cta:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .tarot-stage {
          margin-top: 48px;
          display: flex;
          justify-content: center;
        }
        .three-row {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .celtic-grid {
          display: grid;
          grid-template-columns: repeat(5, 110px);
          grid-template-rows: repeat(4, 180px);
          gap: 14px;
          justify-items: center;
          align-items: center;
        }
        .celtic-slot {
          position: relative;
        }
        @media (max-width: 760px) {
          .celtic-grid {
            grid-template-columns: repeat(5, 72px);
            grid-template-rows: repeat(4, 120px);
            gap: 8px;
          }
        }

        .tarot-reading {
          margin-top: 48px;
          max-width: 68ch;
          margin-left: auto;
          margin-right: auto;
        }
        .tarot-reading-body {
          font-family: 'Crimson Pro', serif;
          font-size: 19px;
          line-height: 1.72;
          color: var(--ink);
        }
        .tarot-drop-cap {
          float: left;
          font-family: 'Fraunces', serif;
          font-variation-settings: 'opsz' 144;
          font-size: 72px;
          line-height: 0.82;
          font-weight: 700;
          color: var(--brass);
          padding-right: 12px;
          padding-top: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .celtic-slot { transition: none !important; }
        }
      `}</style>
    </section>
  );

  if (!canAccessTier(tier, required)) {
    return (
      <PaywallBlur
        tier={tier}
        required={required}
        teaser={
          spreadType === 'celtic-cross'
            ? 'Ten cards, one map — the long-form spread, cast against your natal chart.'
            : 'Past, present, future — three cards cut from the deck with a single question.'
        }
      >
        {content}
      </PaywallBlur>
    );
  }

  return content;
}

function canAccessTier(userTier: Tier, required: Tier): boolean {
  const rank: Record<Tier, number> = { free: 0, reader: 1, depth: 2 };
  return rank[userTier] >= rank[required];
}

/* ============================================================
 * Card slot — individual dealt card with flip animation
 * ============================================================ */

function CardSlot({
  draw,
  revealed,
  shuffling,
  label,
  index,
  compact,
}: {
  draw: TarotDraw & { position: string };
  revealed: boolean;
  shuffling: boolean;
  label: string;
  index: number;
  compact?: boolean;
}) {
  const width = compact ? 92 : 160;
  const height = compact ? 150 : 260;

  return (
    <div className="slot">
      <div
        className={`slot-card ${revealed ? 'is-flipped' : ''} ${revealed && draw.reversed ? 'is-reversed' : ''} ${shuffling ? 'is-shuffling' : ''}`}
        style={{ width, height }}
        aria-label={revealed ? `${label}: ${draw.card.name}${draw.reversed ? ', reversed' : ''}` : `${label}, face down`}
      >
        <div className="slot-face slot-back"><MiniCardBack /></div>
        <div className="slot-face slot-front">
          <MiniCardFront draw={{ card: draw.card, reversed: draw.reversed }} />
        </div>
      </div>
      {!compact && (
        <div className="slot-label">
          <span className="slot-index">{String(index).padStart(2, '0')}</span>
          <span>{label}</span>
        </div>
      )}
      {compact && (
        <div className="slot-label-compact">
          <span>{index}</span>
        </div>
      )}

      <style jsx>{`
        .slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .slot-card {
          position: relative;
          transform-style: preserve-3d;
          transition: transform 600ms cubic-bezier(.2,.7,.3,1);
          will-change: transform;
        }
        .slot-card.is-flipped {
          transform: rotateY(180deg);
        }
        .slot-card.is-flipped.is-reversed {
          transform: rotateY(180deg) rotate(180deg);
        }
        .slot-card.is-shuffling {
          animation: riffle 700ms ease-in-out;
        }
        @keyframes riffle {
          0%   { transform: translateX(-8px) rotate(-2deg); }
          25%  { transform: translateX(8px) rotate(2deg); }
          50%  { transform: translateX(-6px) rotate(-1.5deg); }
          75%  { transform: translateX(6px) rotate(1.5deg); }
          100% { transform: none; }
        }
        .slot-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border: 1px solid var(--brass);
        }
        .slot-back { transform: rotateY(0deg); }
        .slot-front { transform: rotateY(180deg); }

        .slot-label {
          display: flex;
          align-items: baseline;
          gap: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-dim);
          text-align: center;
        }
        .slot-index {
          color: var(--brass);
        }
        .slot-label-compact {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--brass);
          letter-spacing: 0.2em;
        }

        @media (prefers-reduced-motion: reduce) {
          .slot-card { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}
