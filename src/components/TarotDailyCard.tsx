"use client";

// TarotDailyCard — today's single-card tarot draw, interactive.
//
// Lifecycle:
//   1. Initial render shows the CARD BACK (brass-on-indigo sacred-geometry SVG
//      + Synastra wordmark). A slow 8s pulse-halo hints at interactivity.
//   2. First tap flips the card on the Y axis (3D CSS transform, 600ms,
//      cubic-bezier). The face reveals card name, Roman numeral (Majors) or
//      suit+number (Minors), and a minimal brass line-art illustration.
//   3. If the draw is reversed, the revealed face rotates 180°.
//   4. A cluster of brass keyword pills renders beneath the card.
//   5. A "Read today's card" button streams Claude's interpretation via
//      GET /api/reading/tarot?type=daily. The streamed body renders inline
//      with a drop cap and editorial typography.
//
// Tier:
//   - free        → blurred behind a PaywallBlur preview (Reader upsell)
//   - reader/depth → full experience
//
// Determinism: the GET endpoint uses dailyCard(userId, date) for the draw,
// so this component only cares about rendering — the card identity comes
// from the server and is consistent with the streamed reading.

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PaywallBlur from './PaywallBlur';
import type { Tier } from '@/lib/tiers';
import { dailyCard, type TarotDraw } from '@/lib/engines/tarot';

export type TarotDailyCardProps = {
  userId: string;
  userContext?: unknown;
  tier: Tier;
};

/* ============================================================
 * SSE reader (mirrors MorningCup's approach)
 * ============================================================ */

async function readSse(
  url: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store', signal });
  if (!res.ok) {
    let msg = `The deck will not speak (${res.status}).`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed?.message) msg = parsed.message;
      else if (parsed?.error) msg = `The deck will not speak — ${parsed.error}.`;
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
 * Roman numerals for the Major Arcana (0-21)
 * ============================================================ */

const ROMAN = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
  'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII',
  'XIX', 'XX', 'XXI',
];

function cardNumberLabel(draw: TarotDraw): string {
  if (draw.card.arcana === 'major') {
    return ROMAN[draw.card.id] ?? '';
  }
  const suit = draw.card.suit ?? '';
  const num = draw.card.number;
  const suitSymbol: Record<string, string> = {
    wands: '†',
    cups: '‡',
    swords: '✦',
    pentacles: '★',
  };
  const sym = suitSymbol[suit] ?? '§';
  if (num && num <= 10) return `${num} ${sym}`;
  // courts
  const courtLabel: Record<number, string> = { 11: 'Page', 12: 'Knight', 13: 'Queen', 14: 'King' };
  return `${courtLabel[num ?? 0] ?? ''} ${sym}`;
}

/* ============================================================
 * Minimal brass-linework illustrations
 * ============================================================ */

function CardFaceArt({ draw }: { draw: TarotDraw }) {
  // One compact SVG glyph per archetype — tiny, editorial, never photographic.
  // For Majors we switch on id; for Minors we render a suit glyph stack.
  const id = draw.card.id;
  const stroke = 'var(--brass)';
  const common = {
    width: 120,
    height: 120,
    viewBox: '0 0 120 120',
    fill: 'none',
    stroke,
    strokeWidth: 1.1,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    xmlns: 'http://www.w3.org/2000/svg',
  };

  if (draw.card.arcana === 'major') {
    // Each major gets a tiny iconic glyph. Keep them abstract.
    switch (id) {
      case 0: // Fool — figure at cliff edge
        return (
          <svg {...common} aria-label="The Fool">
            <path d="M20 90 L100 90" />
            <path d="M55 90 L55 62 L52 54 M55 62 L60 54" />
            <circle cx="55" cy="44" r="6" />
            <path d="M70 70 L80 58 L78 52" />
            <path d="M20 90 L15 88" strokeDasharray="2 2" />
          </svg>
        );
      case 1: // Magician — table with 4 symbols
        return (
          <svg {...common} aria-label="The Magician">
            <circle cx="60" cy="30" r="4" />
            <path d="M60 34 L60 52" />
            <path d="M40 80 L80 80 L78 92 L42 92 Z" />
            <path d="M48 75 L48 55 M72 75 L72 55" />
            <path d="M52 78 h4 M64 78 h4 M76 78 h4 M40 78 h4" />
          </svg>
        );
      case 2: // High Priestess — pillars + moon
        return (
          <svg {...common} aria-label="The High Priestess">
            <path d="M36 30 L36 96 M84 30 L84 96" />
            <path d="M32 30 L40 30 M80 30 L88 30" />
            <circle cx="60" cy="55" r="10" />
            <path d="M54 55 A10 10 0 0 0 66 55" fill={stroke} opacity="0.7" />
          </svg>
        );
      case 3: // Empress — crown + wheat
        return (
          <svg {...common} aria-label="The Empress">
            <path d="M45 38 L52 30 L60 40 L68 30 L75 38" />
            <circle cx="60" cy="60" r="14" />
            <path d="M50 90 L70 90 M55 80 L50 92 M65 80 L70 92 M60 80 L60 92" />
          </svg>
        );
      case 4: // Emperor — throne
        return (
          <svg {...common} aria-label="The Emperor">
            <path d="M40 40 L40 90 L80 90 L80 40" />
            <path d="M45 40 L48 30 L52 40 M68 40 L72 30 L75 40" />
            <circle cx="60" cy="55" r="6" />
          </svg>
        );
      case 5: // Hierophant — papal keys
        return (
          <svg {...common} aria-label="The Hierophant">
            <path d="M50 30 L50 70 L70 70 L70 30" />
            <path d="M60 30 L60 20" />
            <circle cx="55" cy="85" r="5" />
            <path d="M60 85 L72 85" />
            <circle cx="65" cy="95" r="5" />
            <path d="M70 95 L82 95" />
          </svg>
        );
      case 6: // Lovers — two figures
        return (
          <svg {...common} aria-label="The Lovers">
            <circle cx="42" cy="40" r="8" />
            <circle cx="78" cy="40" r="8" />
            <path d="M42 48 L42 88 M78 48 L78 88" />
            <path d="M50 62 L70 62" />
            <path d="M60 28 L55 22 L60 15 L65 22 Z" />
          </svg>
        );
      case 7: // Chariot
        return (
          <svg {...common} aria-label="The Chariot">
            <path d="M30 80 L90 80 L85 60 L35 60 Z" />
            <circle cx="42" cy="85" r="6" />
            <circle cx="78" cy="85" r="6" />
            <circle cx="60" cy="50" r="6" />
            <path d="M55 30 L60 22 L65 30" />
          </svg>
        );
      case 8: // Strength — infinity + lion
        return (
          <svg {...common} aria-label="Strength">
            <path d="M40 40 Q50 30 60 40 Q70 50 60 40 Q50 30 40 40 Z" />
            <circle cx="60" cy="70" r="14" />
            <path d="M50 68 L54 68 M66 68 L70 68" />
            <path d="M52 78 Q60 82 68 78" />
          </svg>
        );
      case 9: // Hermit — lantern
        return (
          <svg {...common} aria-label="The Hermit">
            <path d="M50 40 L50 90 L70 90 L70 40 Z" />
            <path d="M60 15 L56 30 L64 30 Z" />
            <circle cx="60" cy="60" r="5" />
            <path d="M60 55 L60 65 M55 60 L65 60 M57 57 L63 63 M57 63 L63 57" opacity="0.7" />
          </svg>
        );
      case 10: // Wheel of Fortune
        return (
          <svg {...common} aria-label="Wheel of Fortune">
            <circle cx="60" cy="60" r="28" />
            <circle cx="60" cy="60" r="10" />
            <path d="M60 32 L60 88 M32 60 L88 60 M40 40 L80 80 M80 40 L40 80" />
          </svg>
        );
      case 11: // Justice — scales
        return (
          <svg {...common} aria-label="Justice">
            <path d="M60 30 L60 90" />
            <path d="M40 50 L80 50" />
            <circle cx="40" cy="65" r="8" />
            <circle cx="80" cy="65" r="8" />
            <path d="M40 50 L40 57 M80 50 L80 57" />
          </svg>
        );
      case 12: // Hanged Man
        return (
          <svg {...common} aria-label="The Hanged Man">
            <path d="M30 30 L90 30" />
            <path d="M60 30 L60 50" />
            <circle cx="60" cy="58" r="8" />
            <path d="M60 66 L60 88 M60 80 L70 92 M60 80 L50 92" />
          </svg>
        );
      case 13: // Death — scythe
        return (
          <svg {...common} aria-label="Death">
            <path d="M30 92 L90 92" />
            <path d="M40 92 Q55 70 75 70" />
            <path d="M75 70 L85 62" />
            <path d="M85 62 L90 58 L78 56 L75 70" />
          </svg>
        );
      case 14: // Temperance — two cups
        return (
          <svg {...common} aria-label="Temperance">
            <path d="M42 40 L50 40 L52 56 L40 56 Z" />
            <path d="M70 56 L78 56 L80 72 L68 72 Z" />
            <path d="M50 48 Q60 60 68 64" strokeDasharray="2 2" />
          </svg>
        );
      case 15: // Devil — horns + chains
        return (
          <svg {...common} aria-label="The Devil">
            <path d="M45 28 L55 42 L65 42 L75 28" />
            <circle cx="60" cy="55" r="10" />
            <path d="M50 80 Q55 75 60 80 Q65 85 70 80" />
            <path d="M55 90 Q60 85 65 90" />
          </svg>
        );
      case 16: // Tower — struck tower
        return (
          <svg {...common} aria-label="The Tower">
            <path d="M45 90 L45 50 L75 50 L75 90 Z" />
            <path d="M45 50 L42 40 L78 40 L75 50" />
            <path d="M30 20 L55 45" strokeDasharray="4 3" />
            <path d="M40 90 L35 98 M80 90 L85 98" />
          </svg>
        );
      case 17: // Star
        return (
          <svg {...common} aria-label="The Star">
            <path d="M60 20 L64 36 L80 36 L67 46 L72 62 L60 52 L48 62 L53 46 L40 36 L56 36 Z" />
            <circle cx="35" cy="25" r="1.5" />
            <circle cx="85" cy="30" r="1.5" />
            <circle cx="40" cy="70" r="1.5" />
            <circle cx="82" cy="75" r="1.5" />
          </svg>
        );
      case 18: // Moon
        return (
          <svg {...common} aria-label="The Moon">
            <circle cx="60" cy="50" r="22" />
            <path d="M50 50 A14 18 0 0 0 64 32" fill={stroke} opacity="0.25" />
            <path d="M40 88 L80 88" strokeDasharray="3 3" />
          </svg>
        );
      case 19: // Sun
        return (
          <svg {...common} aria-label="The Sun">
            <circle cx="60" cy="60" r="16" />
            <path d="M60 32 L60 20 M60 88 L60 100 M32 60 L20 60 M88 60 L100 60 M40 40 L32 32 M80 40 L88 32 M40 80 L32 88 M80 80 L88 88" />
          </svg>
        );
      case 20: // Judgement — trumpet
        return (
          <svg {...common} aria-label="Judgement">
            <path d="M30 60 L70 50 L80 60 L70 70 Z" />
            <path d="M80 60 L90 55 L90 65 Z" />
            <path d="M35 80 L60 80 L70 90 L25 90 Z" />
          </svg>
        );
      case 21: // World — wreath + figure
        return (
          <svg {...common} aria-label="The World">
            <ellipse cx="60" cy="60" rx="28" ry="34" />
            <path d="M60 40 L60 70" />
            <circle cx="60" cy="34" r="4" />
            <path d="M52 48 L68 48 M55 80 L60 70 L65 80" />
          </svg>
        );
      default:
        return <svg {...common}><circle cx="60" cy="60" r="30" /></svg>;
    }
  }

  // Minor Arcana — stacked suit glyphs with a central arrangement.
  const suit = draw.card.suit;
  const num = Math.min(draw.card.number ?? 1, 10);
  const courtIdx = draw.card.number ?? 0;
  const isCourt = courtIdx >= 11;

  // Suit glyph paths.
  const suitPaths: Record<string, React.ReactElement> = {
    wands: <path d="M0 -10 L0 10 M-3 -8 L0 -10 L3 -8" />,
    cups: <path d="M-6 -6 L-6 2 Q-6 8 0 8 Q6 8 6 2 L6 -6 Z" />,
    swords: <path d="M0 -10 L0 6 M-4 -6 L4 -6 M-2 8 L2 8" />,
    pentacles: <circle r="7" />,
  };
  const glyph = suit ? suitPaths[suit] : suitPaths.pentacles;

  // Arrangement: 1→center, 2→vertical, 3→triangle, then RWS-style patterns.
  const positions: Record<number, { x: number; y: number }[]> = {
    1: [{ x: 60, y: 60 }],
    2: [{ x: 60, y: 40 }, { x: 60, y: 80 }],
    3: [{ x: 60, y: 30 }, { x: 45, y: 75 }, { x: 75, y: 75 }],
    4: [{ x: 45, y: 40 }, { x: 75, y: 40 }, { x: 45, y: 80 }, { x: 75, y: 80 }],
    5: [{ x: 45, y: 40 }, { x: 75, y: 40 }, { x: 60, y: 60 }, { x: 45, y: 80 }, { x: 75, y: 80 }],
    6: [
      { x: 45, y: 35 }, { x: 75, y: 35 },
      { x: 45, y: 60 }, { x: 75, y: 60 },
      { x: 45, y: 85 }, { x: 75, y: 85 },
    ],
    7: [
      { x: 45, y: 35 }, { x: 75, y: 35 },
      { x: 45, y: 60 }, { x: 75, y: 60 },
      { x: 45, y: 85 }, { x: 75, y: 85 },
      { x: 60, y: 22 },
    ],
    8: [
      { x: 45, y: 30 }, { x: 75, y: 30 },
      { x: 45, y: 50 }, { x: 75, y: 50 },
      { x: 45, y: 70 }, { x: 75, y: 70 },
      { x: 45, y: 90 }, { x: 75, y: 90 },
    ],
    9: [
      { x: 42, y: 28 }, { x: 60, y: 28 }, { x: 78, y: 28 },
      { x: 42, y: 58 }, { x: 60, y: 58 }, { x: 78, y: 58 },
      { x: 42, y: 88 }, { x: 60, y: 88 }, { x: 78, y: 88 },
    ],
    10: [
      { x: 42, y: 26 }, { x: 60, y: 22 }, { x: 78, y: 26 },
      { x: 42, y: 50 }, { x: 78, y: 50 },
      { x: 42, y: 74 }, { x: 78, y: 74 },
      { x: 42, y: 92 }, { x: 60, y: 96 }, { x: 78, y: 92 },
    ],
  };

  if (isCourt) {
    // Abstract court figure: a crown + body silhouette, stacked with the suit.
    return (
      <svg {...common} aria-label={draw.card.name}>
        <path d="M48 30 L52 22 L56 30 L60 22 L64 30 L68 22 L72 30 Z" />
        <circle cx="60" cy="45" r="8" />
        <path d="M48 90 L48 58 Q60 52 72 58 L72 90 Z" />
        <g transform="translate(60 72)" stroke={stroke} strokeWidth="1.1" fill="none">
          {glyph}
        </g>
      </svg>
    );
  }

  const pts = positions[num] ?? positions[1];
  return (
    <svg {...common} aria-label={draw.card.name}>
      {pts.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`} stroke={stroke} strokeWidth="1.1" fill="none">
          {glyph}
        </g>
      ))}
    </svg>
  );
}

/* ============================================================
 * Card back — stylized brass-on-indigo sacred geometry
 * ============================================================ */

function CardBack() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect x="0" y="0" width="260" height="420" fill="var(--bg-deep)" />
      <rect x="8" y="8" width="244" height="404" fill="none" stroke="var(--brass)" strokeWidth="1.1" />
      <rect x="14" y="14" width="232" height="392" fill="none" stroke="var(--brass)" strokeWidth="0.5" opacity="0.45" />
      {/* Sacred-geometry centre: six-fold flower */}
      <g transform="translate(130 210)" stroke="var(--brass)" strokeWidth="0.7" fill="none">
        <circle r="34" />
        <circle r="20" />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (Math.PI / 3) * i;
          return (
            <circle
              key={i}
              cx={20 * Math.cos(a)}
              cy={20 * Math.sin(a)}
              r="20"
              opacity="0.55"
            />
          );
        })}
        <circle r="4" fill="var(--brass)" />
      </g>
      {/* Corner sigils */}
      {([[30, 30], [230, 30], [30, 390], [230, 390]] as const).map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} stroke="var(--brass)" strokeWidth="0.7" fill="none">
          <circle r="3" />
          <path d="M-6 0 L6 0 M0 -6 L0 6" opacity="0.5" />
        </g>
      ))}
      {/* Wordmark */}
      <text
        x="130"
        y="78"
        textAnchor="middle"
        fontFamily="'Fraunces', serif"
        fontSize="16"
        letterSpacing="0.32em"
        fill="var(--brass)"
        fontWeight="600"
      >
        SYNASTRA
      </text>
      <text
        x="130"
        y="356"
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="9"
        letterSpacing="0.28em"
        fill="var(--brass)"
        opacity="0.75"
      >
        ⁂ · ARCANA · ⁂
      </text>
    </svg>
  );
}

/* ============================================================
 * Main component
 * ============================================================ */

export default function TarotDailyCard({ userId, userContext: _userContext, tier }: TarotDailyCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [body, setBody] = useState('');
  const [isStreaming, setStreaming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Client-side we can compute the expected draw (same deterministic logic
  // the server uses). This keeps the visible card in sync with the body that
  // the server streams back — no race, no surprise rotation.
  const draw = useMemo<TarotDraw>(
    () => dailyCard(userId, new Date()),
    [userId],
  );

  const onFlip = useCallback(() => {
    if (!flipped) setFlipped(true);
  }, [flipped]);

  const readCard = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);
    setHasStarted(true);
    setError(null);
    setBody('');
    try {
      await readSse(
        '/api/reading/tarot?type=daily',
        (delta) => setBody((prev) => prev + delta),
        ac.signal,
      );
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'The reading did not land.');
    } finally {
      if (!ac.signal.aborted) setStreaming(false);
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const keywords = draw.reversed ? draw.card.keywords.reversed : draw.card.keywords.upright;
  const firstLetter = body ? body.charAt(0) : '';
  const bodyRest = body ? body.slice(1) : '';

  const content = (
    <section aria-label="Today's tarot card" className="tarot-daily">
      {/* Eyebrow */}
      <div className="tarot-eyebrow">
        {flipped ? `§ ${draw.card.name}${draw.reversed ? ' · Reversed' : ''}` : '§ Tap to reveal today\'s card'}
      </div>

      {/* Card */}
      <div className="tarot-stage" onClick={onFlip} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } }} role="button" tabIndex={flipped ? -1 : 0} aria-pressed={flipped} aria-label={flipped ? `${draw.card.name}${draw.reversed ? ', reversed' : ''}` : 'Reveal today\'s tarot card'}>
        <div className={`tarot-card ${flipped ? 'is-flipped' : ''} ${draw.reversed && flipped ? 'is-reversed' : ''}`}>
          <div className="tarot-face tarot-face-back">
            <CardBack />
          </div>
          <div className="tarot-face tarot-face-front">
            <div className="tarot-face-inner">
              <div className="tarot-face-top">
                <div className="tarot-face-roman">{cardNumberLabel(draw)}</div>
              </div>
              <div className="tarot-face-art">
                <CardFaceArt draw={draw} />
              </div>
              <div className="tarot-face-name">{draw.card.name}</div>
              {draw.card.zodiacal && (
                <div className="tarot-face-meta">{draw.card.zodiacal}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyword pills — appear once flipped */}
      {flipped && (
        <div className="tarot-pills">
          {keywords.map((k) => (
            <span key={k} className="tarot-pill">{k}</span>
          ))}
        </div>
      )}

      {/* Read button + reading */}
      {flipped && !hasStarted && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button type="button" className="tarot-cta" onClick={readCard} disabled={isStreaming}>
            {isStreaming ? 'Reading…' : 'Read today\'s card'}
          </button>
        </div>
      )}

      {hasStarted && (
        <div className="tarot-reading">
          {error && (
            <div style={{ margin: '20px 0' }}>
              <p style={{ fontFamily: "'Crimson Pro', serif", fontStyle: 'italic', color: 'var(--ember)' }}>{error}</p>
              <button type="button" className="tarot-cta" onClick={readCard}>Try again</button>
            </div>
          )}
          {body && (
            <div className="tarot-reading-body">
              <span className="tarot-drop-cap" aria-hidden="true">{firstLetter}</span>
              <span>{bodyRest}</span>
              <span style={{ display: 'block', clear: 'both' }} />
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .tarot-daily {
          padding: 32px 28px 28px;
          border: 1px solid var(--rule);
          background: radial-gradient(ellipse at 50% 0%, rgba(200,160,82,0.05), transparent 70%), var(--mist);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .tarot-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass);
          margin-bottom: 22px;
          min-height: 14px;
          text-align: center;
        }
        .tarot-stage {
          width: 260px;
          height: 420px;
          perspective: 1400px;
          cursor: pointer;
          outline: none;
          border: 0;
          background: transparent;
          padding: 0;
        }
        .tarot-stage:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 6px;
        }
        .tarot-card {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 600ms cubic-bezier(.2,.7,.3,1);
        }
        .tarot-card.is-flipped {
          transform: rotateY(180deg);
        }
        .tarot-card.is-flipped.is-reversed {
          transform: rotateY(180deg) rotate(180deg);
        }
        .tarot-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border: 1px solid var(--brass);
          box-shadow: 0 0 0 0 var(--brass-glow);
          background: var(--bg-deep);
          overflow: hidden;
        }
        .tarot-stage:not(:focus-within) .tarot-card:not(.is-flipped) .tarot-face-back {
          animation: pulse-halo 8s ease-in-out infinite;
        }
        .tarot-face-back {
          transform: rotateY(0deg);
        }
        .tarot-face-front {
          transform: rotateY(180deg);
          padding: 20px 22px;
        }
        .tarot-face-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          border: 1px solid var(--brass);
          padding: 16px 14px;
          position: relative;
        }
        .tarot-face-top {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--brass);
          letter-spacing: 0.14em;
        }
        .tarot-face-roman {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 18px;
          letter-spacing: 0.12em;
          color: var(--brass);
        }
        .tarot-face-art {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brass);
          padding: 10px 0;
        }
        .tarot-face-name {
          font-family: 'Fraunces', serif;
          font-variation-settings: 'opsz' 144;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--ink);
          text-align: center;
          margin-top: 10px;
          line-height: 1.1;
        }
        .tarot-face-meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass);
          margin-top: 8px;
          opacity: 0.85;
        }

        .tarot-pills {
          margin-top: 24px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .tarot-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass);
          border: 1px solid var(--brass-soft);
          padding: 6px 12px;
          border-radius: 999px;
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
          opacity: 0.6;
          cursor: wait;
        }

        .tarot-reading {
          margin-top: 28px;
          width: 100%;
          max-width: 56ch;
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
          font-size: 64px;
          line-height: 0.82;
          font-weight: 700;
          color: var(--brass);
          padding-right: 10px;
          padding-top: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .tarot-card {
            transition: none !important;
          }
          .tarot-face-back {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );

  // Tier gate: free users get the blurred preview + upsell.
  if (tier === 'free') {
    return (
      <PaywallBlur tier={tier} required="reader" teaser="The deck is still sealed. One card a day, cut from the Rider-Waite arcana, read against your chart.">
        {content}
      </PaywallBlur>
    );
  }

  return content;
}
