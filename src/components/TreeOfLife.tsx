"use client";

// TreeOfLife — interactive Kabbalah Tree of Life (SVG, 500×700).
//
// Ten sephirot connected by twenty-two paths. Each path is tied to a Hebrew
// letter + tarot card using the canonical Hermetic ordering (Golden Dawn).
//
// Interactions:
//   - hover sephira → brass fill, tooltip with attributes
//   - click sephira → pulse + onSefiraClick(name)
//   - hover path    → highlight, tooltip with letter + tarot
//   - userConvergence sephirot get a persistent pulse-halo

import { useState, useMemo, useEffect } from 'react';
import { KABBALAH_SIGN_PATH_MEANING } from '@/lib/interp/tables';

// Long-form sephira descriptions used in the click-to-expand panel. Keyed by
// canonical sephira name (matches SEPHIROT below). Body is one or two
// paragraphs of editorial prose, brand-voice. Source: hand-written, not AI.
const SEPHIRA_PROFILE: Record<string, { body: string; pillar: string }> = {
  Kether:    { body: 'Kether is the Crown — the unity that has not yet divided into anything. It is the single point from which the entire Tree unfolds, the originating breath before there is light to see by. To touch Kether is to touch the source the system itself rests on; the experience is rarely described and never owned.', pillar: 'Middle pillar — undifferentiated source.' },
  Chokmah:   { body: 'Chokmah is Wisdom — the first masculine outpouring, the flash of insight that cannot be undone once it lands. It is the zodiac as living force, the dynamic principle that initiates without yet knowing what it is initiating. Chokmah is the moment the lightning leaves the cloud.', pillar: 'Right pillar — expansion, generative force.' },
  Binah:     { body: 'Binah is Understanding — the great mother, the womb that gives form to what Chokmah set in motion. Saturn-ruled, Binah is the principle of structure, limitation, and time itself. She is the discipline that makes growth possible by enforcing edges; without Binah, Chokmah burns formless forever.', pillar: 'Left pillar — contraction, formative force.' },
  Chesed:    { body: 'Chesed is Mercy — Jupiter\'s loving-kindness, the expansive principle that builds, gives, and forgives. Chesed is the open hand, the king who rules generously because he is genuinely full. Its risk is the kindness that has no limit and so loses its meaning.', pillar: 'Right pillar — moral expansion, the generous king.' },
  Geburah:   { body: 'Geburah is Severity — Mars\'s judgement, the cutting force that removes what cannot be carried forward. Geburah is the warrior, the boundary, the necessary No. Without Geburah, Chesed bloats; without Chesed, Geburah destroys. The two need each other.', pillar: 'Left pillar — moral contraction, the just warrior.' },
  Tiphareth: { body: 'Tiphareth is Beauty — the solar centre of the Tree, the harmonised self that holds all the other sephirot in proportion. Tiphareth is the king who has integrated mercy and severity, the heart that has become a mirror for the higher worlds. This is the sephira of the awakened conscience.', pillar: 'Middle pillar — the integrated self, the sacrificed and risen king.' },
  Netzach:   { body: 'Netzach is Victory — Venus\'s endurance, the principle of feeling, beauty, art, and instinctual life. Netzach is what keeps going because it is in love with going. Its shadow is the sentimentality that refuses to face Hod\'s clear thinking.', pillar: 'Right pillar — the heart\'s persistence.' },
  Hod:       { body: 'Hod is Splendour — Mercury\'s form-making, the principle of language, logic, structure, and named distinction. Hod is the mind that catalogues, names, and refines. Its shadow is the cleverness that has lost contact with Netzach\'s living feeling.', pillar: 'Left pillar — the mind\'s clarification.' },
  Yesod:     { body: 'Yesod is Foundation — the lunar treasury, the astral storehouse where the imagination, the dream-life, and the sexual current converge. Everything that will manifest in Malkuth first passes through Yesod\'s shimmering vessel. This is the moon under which the unconscious moves.', pillar: 'Middle pillar — the astral foundation, the dreaming vessel.' },
  Malkuth:   { body: 'Malkuth is Kingdom — the earth, the body, the incarnated world. Malkuth is where everything else becomes real, becomes tasteable, becomes bound by time. The whole Tree exists so that the divine can be expressed here, in this room, in this body, at this hour.', pillar: 'Middle pillar — the manifest world, the incarnate kingdom.' },
};

// ─── SEPHIROT (positions on a 500×700 canvas) ────────────────────────────────
type Sephira = {
  name: string;
  number: number;
  hebrew: string;
  title: string;       // English meaning
  attribute: string;   // short attribution used in tooltip
  x: number;
  y: number;
};

const SEPHIROT: Sephira[] = [
  { name: 'Kether',    number: 1,  hebrew: 'כתר',  title: 'Crown',      attribute: 'Crown · Primum Mobile · Unity',          x: 250, y: 60 },
  { name: 'Chokmah',   number: 2,  hebrew: 'חכמה', title: 'Wisdom',     attribute: 'Wisdom · Zodiac · Masculine principle',  x: 380, y: 140 },
  { name: 'Binah',     number: 3,  hebrew: 'בינה', title: 'Understanding', attribute: 'Understanding · Saturn · Feminine principle', x: 120, y: 140 },
  { name: 'Chesed',    number: 4,  hebrew: 'חסד',  title: 'Mercy',      attribute: 'Mercy · Jupiter · Loving-kindness',      x: 380, y: 280 },
  { name: 'Geburah',   number: 5,  hebrew: 'גבורה', title: 'Severity',   attribute: 'Severity · Mars · Judgement',            x: 120, y: 280 },
  { name: 'Tiphareth', number: 6,  hebrew: 'תפארת', title: 'Beauty',     attribute: 'Beauty · Sun · Integration',             x: 250, y: 370 },
  { name: 'Netzach',   number: 7,  hebrew: 'נצח',  title: 'Victory',    attribute: 'Victory · Venus · Endurance',            x: 380, y: 470 },
  { name: 'Hod',       number: 8,  hebrew: 'הוד',  title: 'Splendour',  attribute: 'Splendour · Mercury · Form',             x: 120, y: 470 },
  { name: 'Yesod',     number: 9,  hebrew: 'יסוד', title: 'Foundation', attribute: 'Foundation · Moon · Astral vessel',      x: 250, y: 550 },
  { name: 'Malkuth',   number: 10, hebrew: 'מלכות', title: 'Kingdom',    attribute: 'Kingdom · Earth · Incarnation',          x: 250, y: 650 },
];

// ─── PATHS (the 22 paths, Golden Dawn attributions) ─────────────────────────
// Paths 11–32. Each connects two sephirot. Paths 11,12,13,14,21,23,27,30,31,32
// correspond to Hebrew mother/double letters + other planets; the twelve
// zodiacal paths (15–29 excluding doubles) are listed in
// KABBALAH_SIGN_PATH_MEANING and keyed here by sign-name for lookup.
type TreePath = {
  id: number;
  from: string;
  to: string;
  letter: string;
  tarot: string;
  // If this path corresponds to a zodiac sign, that sign's key — so we can
  // pull the richer body copy from KABBALAH_SIGN_PATH_MEANING.
  sign?: string;
};

const PATHS: TreePath[] = [
  { id: 11, from: 'Kether',    to: 'Chokmah',   letter: 'Aleph (א)',  tarot: 'The Fool' },
  { id: 12, from: 'Kether',    to: 'Binah',     letter: 'Beth (ב)',   tarot: 'The Magus' },
  { id: 13, from: 'Kether',    to: 'Tiphareth', letter: 'Gimel (ג)',  tarot: 'The High Priestess' },
  { id: 14, from: 'Chokmah',   to: 'Binah',     letter: 'Daleth (ד)', tarot: 'The Empress' },
  { id: 15, from: 'Chokmah',   to: 'Tiphareth', letter: 'Heh (ה)',    tarot: 'The Emperor',    sign: 'Aries' },
  { id: 16, from: 'Chokmah',   to: 'Chesed',    letter: 'Vav (ו)',    tarot: 'The Hierophant', sign: 'Taurus' },
  { id: 17, from: 'Binah',     to: 'Tiphareth', letter: 'Zayin (ז)',  tarot: 'The Lovers',     sign: 'Gemini' },
  { id: 18, from: 'Binah',     to: 'Geburah',   letter: 'Cheth (ח)',  tarot: 'The Chariot',    sign: 'Cancer' },
  { id: 19, from: 'Chesed',    to: 'Geburah',   letter: 'Tet (ט)',    tarot: 'Strength',       sign: 'Leo' },
  { id: 20, from: 'Chesed',    to: 'Tiphareth', letter: 'Yod (י)',    tarot: 'The Hermit',     sign: 'Virgo' },
  { id: 21, from: 'Chesed',    to: 'Netzach',   letter: 'Kaph (כ)',   tarot: 'Wheel of Fortune' },
  { id: 22, from: 'Geburah',   to: 'Tiphareth', letter: 'Lamed (ל)',  tarot: 'Justice',        sign: 'Libra' },
  { id: 23, from: 'Geburah',   to: 'Hod',       letter: 'Mem (מ)',    tarot: 'The Hanged Man' },
  { id: 24, from: 'Tiphareth', to: 'Netzach',   letter: 'Nun (נ)',    tarot: 'Death',          sign: 'Scorpio' },
  { id: 25, from: 'Tiphareth', to: 'Yesod',     letter: 'Samekh (ס)', tarot: 'Temperance',     sign: 'Sagittarius' },
  { id: 26, from: 'Tiphareth', to: 'Hod',       letter: 'Ayin (ע)',   tarot: 'The Devil',      sign: 'Capricorn' },
  { id: 27, from: 'Netzach',   to: 'Hod',       letter: 'Peh (פ)',    tarot: 'The Tower' },
  { id: 28, from: 'Netzach',   to: 'Yesod',     letter: 'Tzaddi (צ)', tarot: 'The Star',       sign: 'Aquarius' },
  { id: 29, from: 'Netzach',   to: 'Malkuth',   letter: 'Qoph (ק)',   tarot: 'The Moon',       sign: 'Pisces' },
  { id: 30, from: 'Hod',       to: 'Yesod',     letter: 'Resh (ר)',   tarot: 'The Sun' },
  { id: 31, from: 'Hod',       to: 'Malkuth',   letter: 'Shin (ש)',   tarot: 'Judgement' },
  { id: 32, from: 'Yesod',     to: 'Malkuth',   letter: 'Tav (ת)',    tarot: 'The World' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export type TreeOfLifeProps = {
  userConvergence?: Array<{ sefira: string; source: string }>;
  onSefiraClick?: (name: string) => void;
};

const R = 34; // sephira circle radius

export default function TreeOfLife({ userConvergence, onSefiraClick }: TreeOfLifeProps) {
  const [hoverSef, setHoverSef] = useState<string | null>(null);
  const [hoverPath, setHoverPath] = useState<number | null>(null);
  const [pulseSef, setPulseSef] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Click-to-expand description panel — one of these at a time.
  type Detail =
    | { kind: 'sefira'; name: string }
    | { kind: 'path'; id: number };
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  const byName = useMemo(() => {
    const m: Record<string, Sephira> = {};
    for (const s of SEPHIROT) m[s.name] = s;
    return m;
  }, []);

  const convergedSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of userConvergence ?? []) s.add(c.sefira);
    return s;
  }, [userConvergence]);

  function handleSefClick(name: string) {
    setPulseSef(name);
    onSefiraClick?.(name);
    setDetail({ kind: 'sefira', name });
    window.setTimeout(() => setPulseSef((n) => (n === name ? null : n)), 1400);
  }

  function handlePathClick(id: number) {
    setDetail({ kind: 'path', id });
  }

  // ESC closes the detail panel.
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetail(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail]);

  // Build the detail content for the panel.
  type DetailContent = {
    eyebrow: string;
    title: string;
    subtitle?: string;
    body: string;
    pillarRole?: string;
  } | null;

  const detailContent: DetailContent = (() => {
    if (!detail) return null;
    if (detail.kind === 'sefira') {
      const s = byName[detail.name];
      if (!s) return null;
      const profile = SEPHIRA_PROFILE[detail.name];
      return {
        eyebrow: `Sephira ${s.number} · ${s.hebrew}`,
        title: `${s.name} — ${s.title}`,
        subtitle: s.attribute,
        body: profile?.body ?? '',
        pillarRole: profile?.pillar,
      };
    }
    const p = PATHS.find((x) => x.id === detail.id);
    if (!p) return null;
    type PathTable = Record<string, { body?: string; pillarRole?: string }>;
    const extra = p.sign ? (KABBALAH_SIGN_PATH_MEANING as unknown as PathTable)[p.sign] : null;
    return {
      eyebrow: `Path ${p.id} · ${p.from} ↔ ${p.to}`,
      title: `${p.letter} · ${p.tarot}`,
      subtitle: p.sign ? `Zodiac: ${p.sign}` : 'Non-zodiacal path',
      body:
        extra?.body ??
        `The ${p.letter} path connects ${p.from} and ${p.to}, associated with ${p.tarot}. This is one of the twenty-two paths of the Tree, each a Hebrew letter and a tarot key — the ladder that carries consciousness between sephirot.`,
      pillarRole: extra?.pillarRole,
    };
  })();

  // Tooltip state
  const tooltip = (() => {
    if (hoverSef) {
      const s = byName[hoverSef];
      if (!s) return null;
      return {
        x: s.x, y: s.y - R - 8,
        title: `${s.name}`,
        line1: `${s.hebrew} · ${s.number}`,
        body: s.attribute,
      };
    }
    if (hoverPath !== null) {
      const p = PATHS.find((x) => x.id === hoverPath);
      if (!p) return null;
      const a = byName[p.from];
      const b = byName[p.to];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      let body = `${p.letter} · ${p.tarot}`;
      if (p.sign) {
        type PathTable = Record<string, { body: string }>;
        const extra = (KABBALAH_SIGN_PATH_MEANING as unknown as PathTable)[p.sign];
        if (extra?.body) {
          // First sentence for brevity
          const m = extra.body.match(/[^.!?]+[.!?]/);
          body = (m ? m[0] : extra.body).trim();
        }
      }
      return {
        x: mx, y: my - 18,
        title: `Path ${p.id}`,
        line1: `${p.letter} · ${p.tarot}${p.sign ? ` · ${p.sign}` : ''}`,
        body,
      };
    }
    return null;
  })();

  return (
    <div style={{ width: '100%', position: 'relative', fontFamily: 'var(--font-body)' }}>
      <svg
        viewBox="0 0 500 700"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Kabbalah Tree of Life"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <filter id="tol-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="tol-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(200,160,82,0.55)" />
            <stop offset="60%" stopColor="rgba(200,160,82,0.14)" />
            <stop offset="100%" stopColor="rgba(200,160,82,0)" />
          </radialGradient>
        </defs>

        {/* ── PATHS (lines) ── */}
        <g>
          {PATHS.map((p, idx) => {
            const a = byName[p.from];
            const b = byName[p.to];
            const active = hoverPath === p.id;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            // Shorten the endpoints so the line does not overlap the sephira circle
            const tIn = R / len;
            const x1 = a.x + dx * tIn;
            const y1 = a.y + dy * tIn;
            const x2 = b.x - dx * tIn;
            const y2 = b.y - dy * tIn;
            return (
              <g key={p.id}>
                {/* invisible wide hit-target */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth="14"
                  onMouseEnter={() => setHoverPath(p.id)}
                  onMouseLeave={() => setHoverPath((n) => (n === p.id ? null : n))}
                  onClick={() => handlePathClick(p.id)}
                  role="button"
                  aria-label={`Path ${p.id} — ${p.letter} · ${p.tarot}`}
                  style={{ cursor: 'pointer' }}
                />
                {/* visible line */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="var(--brass)"
                  strokeWidth={active ? '1.4' : '0.8'}
                  opacity={active ? 0.85 : 0.3}
                  style={{
                    transition: reducedMotion ? 'none' : 'all 220ms cubic-bezier(.2,.7,.3,1)',
                    filter: active ? 'url(#tol-glow)' : undefined,
                    pointerEvents: 'none',
                    ...(reducedMotion
                      ? null
                      : {
                          strokeDasharray: `${len}`,
                          strokeDashoffset: `${len}`,
                          animation: `tol-draw 900ms cubic-bezier(.3,.7,.3,1) both`,
                          animationDelay: `${900 + idx * 35}ms`,
                        }),
                  }}
                />
                {/* Path number — small, mid-point, visible on hover */}
                {active && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fill="var(--brass)"
                    opacity="0.8"
                    style={{ pointerEvents: 'none', letterSpacing: '0.08em' }}
                  >
                    {p.id}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ── SEPHIROT ── */}
        <g>
          {SEPHIROT.map((s, idx) => {
            const active = hoverSef === s.name;
            const pulse = pulseSef === s.name;
            const converged = convergedSet.has(s.name);

            return (
              <g
                key={s.name}
                onMouseEnter={() => setHoverSef(s.name)}
                onMouseLeave={() => setHoverSef((n) => (n === s.name ? null : n))}
                onClick={() => handleSefClick(s.name)}
                style={{
                  cursor: 'pointer',
                  opacity: reducedMotion ? 1 : 0,
                  animation: reducedMotion ? undefined : `tol-rise 520ms cubic-bezier(.2,.7,.3,1) both`,
                  animationDelay: reducedMotion ? undefined : `${idx * 80}ms`,
                }}
              >
                {/* Convergence glow halo (persistent) */}
                {converged && (
                  <circle
                    cx={s.x} cy={s.y} r={R + 18}
                    fill="url(#tol-halo)"
                    style={
                      reducedMotion
                        ? undefined
                        : { animation: 'tol-halo-pulse 6s ease-in-out infinite' }
                    }
                  />
                )}

                {/* Click pulse ring */}
                {pulse && (
                  <circle
                    cx={s.x} cy={s.y} r={R}
                    fill="none"
                    stroke="var(--brass)"
                    strokeWidth="1.4"
                    opacity="0.9"
                    style={
                      reducedMotion
                        ? undefined
                        : { animation: 'tol-pulse 1400ms ease-out both' }
                    }
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={s.x} cy={s.y} r={R}
                  fill={active ? 'var(--brass)' : 'rgba(10,14,26,0.75)'}
                  stroke="var(--brass)"
                  strokeWidth="1"
                  style={{
                    transition: reducedMotion ? 'none' : 'fill 260ms cubic-bezier(.2,.7,.3,1)',
                    filter: active || converged ? 'url(#tol-glow)' : undefined,
                  }}
                />

                {/* Number — small Plex Mono, top-inside the circle */}
                <text
                  x={s.x}
                  y={s.y - 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill={active ? 'var(--bg-base)' : 'var(--brass)'}
                  style={{ letterSpacing: '0.1em', pointerEvents: 'none', userSelect: 'none' }}
                >
                  {s.number}
                </text>

                {/* Hebrew name inside */}
                <text
                  x={s.x}
                  y={s.y + 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fill={active ? 'var(--bg-base)' : 'var(--ink)'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {s.hebrew}
                </text>

                {/* English name below the circle */}
                <text
                  x={s.x}
                  y={s.y + R + 18}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={active ? '17' : '15'}
                  fontFamily="var(--font-display)"
                  fontStyle="italic"
                  fill={active ? 'var(--brass)' : 'var(--ink-dim)'}
                  style={{
                    transition: reducedMotion ? 'none' : 'all 260ms cubic-bezier(.2,.7,.3,1)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── TOOLTIP ── */}
      {tooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${(tooltip.x / 500) * 100}%`,
            top: `${(tooltip.y / 700) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 10px))',
            maxWidth: '280px',
            padding: '10px 14px',
            background: 'rgba(10, 14, 26, 0.94)',
            border: '1px solid var(--brass-soft)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            lineHeight: 1.45,
            pointerEvents: 'none',
            boxShadow: '0 0 24px rgba(200,160,82,0.18)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              color: 'var(--brass)',
              marginBottom: '4px',
              letterSpacing: '0.04em',
            }}
          >
            {tooltip.title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-dim)',
              marginBottom: tooltip.body ? '6px' : 0,
            }}
          >
            {tooltip.line1}
          </div>
          {tooltip.body && (
            <div style={{ color: 'var(--ink-dim)', fontStyle: 'italic' }}>{tooltip.body}</div>
          )}
        </div>
      )}

      {/* ── DETAIL PANEL (click-to-expand) ── */}
      {detailContent && (
        <>
          <div
            onClick={() => setDetail(null)}
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4, 6, 14, 0.62)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 70,
              animation: reducedMotion ? undefined : 'tol-veil 220ms ease-out both',
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={detailContent.title}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(560px, 92vw)',
              maxHeight: '82vh',
              overflowY: 'auto',
              background: 'rgba(10, 14, 26, 0.96)',
              border: '1px solid rgba(200, 160, 82, 0.32)',
              borderRadius: 6,
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.55), 0 0 40px rgba(200, 160, 82, 0.12)',
              padding: '32px 36px 36px',
              zIndex: 71,
              animation: reducedMotion ? undefined : 'tol-pop 280ms cubic-bezier(.2,.7,.3,1) both',
            }}
          >
            <button
              type="button"
              onClick={() => setDetail(null)}
              aria-label="Close description"
              style={{
                position: 'absolute',
                top: 12,
                right: 14,
                background: 'transparent',
                border: 0,
                color: 'rgba(252, 250, 246, 0.55)',
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 16,
                lineHeight: 1,
                padding: 6,
              }}
            >
              ✕
            </button>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--brass)',
                marginBottom: 10,
              }}
            >
              {detailContent.eyebrow}
            </div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 26,
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                margin: '0 0 6px',
                color: 'var(--ink)',
              }}
            >
              {detailContent.title}
            </h3>
            {detailContent.subtitle && (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(252, 250, 246, 0.55)',
                  marginBottom: 18,
                }}
              >
                {detailContent.subtitle}
              </div>
            )}
            {detailContent.body && (
              <p
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: 'rgba(252, 250, 246, 0.85)',
                  margin: '14px 0 0',
                }}
              >
                {detailContent.body}
              </p>
            )}
            {detailContent.pillarRole && (
              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--brass)',
                    marginBottom: 6,
                  }}
                >
                  Pillar role
                </div>
                <p
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: 'rgba(252, 250, 246, 0.78)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  {detailContent.pillarRole}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes tol-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes tol-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes tol-pulse {
          0%   { r: ${R - 4}; opacity: 0.9; stroke-width: 1.8; }
          100% { r: ${R + 16}; opacity: 0; stroke-width: 0.4; }
        }
        @keyframes tol-halo-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes tol-veil {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tol-pop {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          svg [style*="tol-rise"], svg [style*="tol-draw"], svg [style*="tol-pulse"], svg [style*="tol-halo-pulse"] {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
