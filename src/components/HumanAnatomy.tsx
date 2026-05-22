"use client";

// HumanAnatomy.tsx — the anatomical face of the Human Design BodyGraph.
// A photoreal anatomy render sits underneath; an interactive overlay
// places the 9 HD centres on the body in their chakra colours, draws the
// channel topology between them, and — on tap/hover — reveals the organs
// each centre governs and the cause-and-effect of it being defined or open.
//
// The base render lives at `public/hd-anatomy.png` (square 1:1, a
// head-to-pelvis crop of a front-facing anatomy figure). Until it exists
// the overlay still works on the deep-celestial background — nothing breaks.
//
// Each centre carries its traditional chakra colour and symbol. Defined
// centres glow; open centres are faint rings — where you absorb others'.

import { useState } from 'react';

type HdLike = {
  activatedGates?: number[];
  definedCenters?: readonly string[];
};

type CenterMeta = {
  /** Canonical HD centre name. */
  name: string;
  /** Common chakra label users will recognise. */
  chakra: string;
  /** Traditional chakra colour. */
  color: string;
  /** Position on the 1024×1024 viewBox (matches the square head-to-pelvis
   *  crop). Tune these if you swap the render for a differently-framed one. */
  x: number;
  y: number;
  /** Visual radius of the centre marker. */
  r: number;
  /** Anatomical region label. */
  region: string;
  /** Organs/glands the centre governs in HD's biological model. */
  organs: string[];
  /** Short HD theme. */
  theme: string;
  /** Short noun phrase for the cause-and-effect copy. */
  domain: string;
  /** Gates that live in this centre. */
  gates: number[];
};

const CENTERS: readonly CenterMeta[] = [
  {
    name: 'Head',
    chakra: 'Crown',
    color: '#A98BD9',
    x: 512, y: 75, r: 40,
    region: 'Top of the skull',
    organs: ['Pineal gland'],
    theme: 'Pressure to know — inspiration, doubt, wonder.',
    domain: 'mental pressure and the questions you chase',
    gates: [64, 61, 63],
  },
  {
    name: 'Ajna',
    chakra: 'Third Eye',
    color: '#7B7FD4',
    x: 512, y: 150, r: 34,
    region: 'Forehead, behind the eyes',
    organs: ['Pituitary gland', 'Cerebral cortex'],
    theme: 'Conceptualisation — how the mind makes sense of things.',
    domain: 'the way thoughts get organised into certainty',
    gates: [47, 24, 4, 17, 43, 11],
  },
  {
    name: 'Throat',
    chakra: 'Throat',
    color: '#52A9D4',
    x: 512, y: 258, r: 42,
    region: 'Throat, larynx, jaw',
    organs: ['Thyroid', 'Parathyroid', 'Larynx', 'Vocal cords'],
    theme: 'Manifestation and voice — where energy becomes action.',
    domain: 'the urge to speak, and to turn energy into action',
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  },
  {
    name: 'G',
    chakra: 'Heart · Identity',
    color: '#5FB98A',
    x: 512, y: 382, r: 42,
    region: 'Sternum, centre of the chest',
    organs: ['Liver', 'Blood', 'Heart (as vessel)'],
    theme: 'Identity, direction and love — your magnetic centre.',
    domain: 'identity, direction and a sense of who you are',
    gates: [7, 1, 13, 25, 10, 15, 46, 2],
  },
  {
    name: 'Heart',
    chakra: 'Will / Ego',
    color: '#E0A857',
    x: 615, y: 452, r: 32,
    region: 'Right of the chest cavity',
    organs: ['Heart muscle', 'Gallbladder', 'Stomach', 'Thymus'],
    theme: 'Will, ego, material courage — the seat of "I can".',
    domain: 'willpower, self-worth and what you are willing to prove',
    gates: [21, 40, 26, 51],
  },
  {
    name: 'Solar Plexus',
    chakra: 'Solar Plexus',
    color: '#E6C75C',
    x: 615, y: 580, r: 38,
    region: 'Upper abdomen, right of the navel',
    organs: ['Pancreas', 'Kidneys', 'Nervous system'],
    theme: 'Emotional awareness — the wave that asks for time.',
    domain: 'emotional weather — the moods, the highs and lows',
    gates: [36, 22, 37, 6, 49, 55, 30],
  },
  {
    name: 'Spleen',
    chakra: 'Spleen',
    color: '#BFC8D2',
    x: 410, y: 580, r: 38,
    region: 'Left side, under the ribs',
    organs: ['Spleen', 'Lymphatic system', 'Immune system', 'T-cells'],
    theme: 'Intuition, immunity and survival — the body that knows now.',
    domain: 'instinct, timing and the body’s quiet alarm',
    gates: [48, 57, 44, 50, 32, 28, 18],
  },
  {
    name: 'Sacral',
    chakra: 'Sacral',
    color: '#E08A4F',
    x: 512, y: 705, r: 46,
    region: 'Lower abdomen, below the navel',
    organs: ['Ovaries', 'Testes', 'Reproductive system'],
    theme: 'Life-force, work and response — the generative engine.',
    domain: 'raw life-force and the energy to work and create',
    gates: [34, 5, 14, 29, 59, 9, 3, 42, 27],
  },
  {
    name: 'Root',
    chakra: 'Root',
    color: '#D15F52',
    x: 512, y: 838, r: 40,
    region: 'Base of the pelvis, perineum',
    organs: ['Adrenal glands'],
    theme: 'Pressure and fuel — the deadline body, the survival pulse.',
    domain: 'stress, drive and the pressure to be done',
    gates: [58, 38, 54, 53, 60, 52, 19, 39, 41],
  },
];

/* The HD bodygraph topology — every centre pair a channel can run between.
   A pair lights up when both its centres are defined: energy flows there. */
const CENTER_LINKS: readonly [string, string][] = [
  ['Head', 'Ajna'],
  ['Ajna', 'Throat'],
  ['Throat', 'G'],
  ['Throat', 'Heart'],
  ['Throat', 'Spleen'],
  ['Throat', 'Solar Plexus'],
  ['Throat', 'Sacral'],
  ['G', 'Heart'],
  ['G', 'Sacral'],
  ['G', 'Spleen'],
  ['Heart', 'Spleen'],
  ['Heart', 'Solar Plexus'],
  ['Spleen', 'Sacral'],
  ['Spleen', 'Root'],
  ['Sacral', 'Solar Plexus'],
  ['Sacral', 'Root'],
  ['Solar Plexus', 'Root'],
];

const BY_NAME: Record<string, CenterMeta> = Object.fromEntries(
  CENTERS.map((c) => [c.name, c]),
);

function neighboursOf(name: string): string[] {
  return CENTER_LINKS.flatMap(([a, b]) =>
    a === name ? [b] : b === name ? [a] : [],
  );
}

/* ─── Chakra symbol — a simplified glyph per centre, centred at (cx, cy). ─── */
function CenterGlyph({
  name,
  cx,
  cy,
  s,
  color,
}: {
  name: string;
  cx: number;
  cy: number;
  s: number;
  color: string;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 3.2,
    fill: 'none',
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  switch (name) {
    case 'Head': // Crown — radiant sun
      return (
        <g>
          <circle cx={cx} cy={cy} r={s * 0.32} {...stroke} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * s * 0.52}
                y1={cy + Math.sin(a) * s * 0.52}
                x2={cx + Math.cos(a) * s}
                y2={cy + Math.sin(a) * s}
                {...stroke}
              />
            );
          })}
        </g>
      );
    case 'Ajna': // Third Eye — eye
      return (
        <g>
          <path
            d={`M ${cx - s} ${cy} Q ${cx} ${cy - s * 0.66} ${cx + s} ${cy} Q ${cx} ${cy + s * 0.66} ${cx - s} ${cy} Z`}
            {...stroke}
          />
          <circle cx={cx} cy={cy} r={s * 0.26} fill={color} />
        </g>
      );
    case 'Throat': // concentric rings
      return (
        <g>
          <circle cx={cx} cy={cy} r={s * 0.86} {...stroke} />
          <circle cx={cx} cy={cy} r={s * 0.36} {...stroke} />
        </g>
      );
    case 'G': // Heart — hexagram
      return (
        <g>
          <polygon
            points={`${cx},${cy - s} ${cx - s * 0.87},${cy + s * 0.5} ${cx + s * 0.87},${cy + s * 0.5}`}
            {...stroke}
          />
          <polygon
            points={`${cx},${cy + s} ${cx - s * 0.87},${cy - s * 0.5} ${cx + s * 0.87},${cy - s * 0.5}`}
            {...stroke}
          />
        </g>
      );
    case 'Heart': // Will — diamond
      return (
        <polygon
          points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
          {...stroke}
        />
      );
    case 'Solar Plexus': // downward triangle
      return (
        <polygon
          points={`${cx - s * 0.95},${cy - s * 0.72} ${cx + s * 0.95},${cy - s * 0.72} ${cx},${cy + s * 0.92}`}
          {...stroke}
        />
      );
    case 'Spleen': // four-point star
      return (
        <polygon
          points={`${cx},${cy - s} ${cx + s * 0.26},${cy - s * 0.26} ${cx + s},${cy} ${cx + s * 0.26},${cy + s * 0.26} ${cx},${cy + s} ${cx - s * 0.26},${cy + s * 0.26} ${cx - s},${cy} ${cx - s * 0.26},${cy - s * 0.26}`}
          {...stroke}
        />
      );
    case 'Sacral': // crescent moon
      return (
        <path
          d={`M ${cx + s * 0.28} ${cy - s} A ${s} ${s} 0 1 0 ${cx + s * 0.28} ${cy + s} A ${s * 0.7} ${s * 0.7} 0 1 1 ${cx + s * 0.28} ${cy - s} Z`}
          fill={color}
        />
      );
    case 'Root': // square
      return (
        <rect
          x={cx - s * 0.82}
          y={cy - s * 0.82}
          width={s * 1.64}
          height={s * 1.64}
          {...stroke}
        />
      );
    default:
      return null;
  }
}

export type HumanAnatomyProps = {
  hdResult?: HdLike;
  /** Path to the photoreal anatomy render. */
  imageSrc?: string;
};

export default function HumanAnatomy({
  hdResult,
  imageSrc = '/hd-anatomy.png',
}: HumanAnatomyProps) {
  const activated = new Set<number>(hdResult?.activatedGates ?? []);
  const defined = new Set<string>(hdResult?.definedCenters ?? []);

  // `pinned` survives a click; `hovered` is transient. Shown = hovered ?? pinned.
  const [pinned, setPinned] = useState<CenterMeta | null>(null);
  const [hovered, setHovered] = useState<CenterMeta | null>(null);
  const shown = hovered ?? pinned;

  const BRASS = 'var(--brass, #C8A052)';
  const INK = 'var(--ink, #FCFAF6)';
  const INK_DIM = 'rgba(252, 250, 246, 0.65)';

  return (
    <section style={{ maxWidth: 960, margin: '64px auto 0' }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: BRASS,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        Anatomical Map
      </div>
      <h2
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 26,
          fontWeight: 500,
          lineHeight: 1.25,
          margin: '0 0 14px',
          textAlign: 'center',
          color: INK,
        }}
      >
        Your centres, mapped to the body
      </h2>
      <p
        className="chapter-body"
        style={{ maxWidth: 560, margin: '0 auto 32px', textAlign: 'center' }}
      >
        The nine centres from the BodyGraph above — in their chakra colours,
        placed where they live in your body, wired by the channels that carry
        energy between them. Tap any centre to read the organs it governs and
        what its definition sets in motion.
      </p>

      <div
        className="anatomical-chakra-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 400px) 1fr',
          gap: 40,
          alignItems: 'start',
          padding: '24px 0',
        }}
      >
        <style>{`
          @media (max-width: 720px) {
            .anatomical-chakra-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
          }
        `}</style>

        {/* ─── FIGURE: photoreal render + interactive overlay ─── */}
        <div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              background:
                'radial-gradient(ellipse at 50% 38%, #161228 0%, #0a0a14 78%)',
            }}
          >
            {/* Base render. If absent, the celestial background shows through. */}
            <img
              src={imageSrc}
              alt="Photoreal anatomy showing the organs each Human Design centre governs"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Dark wash — keeps the overlay legible over any render. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(10,10,20,0.5) 0%, rgba(10,10,20,0.12) 35%, rgba(10,10,20,0.5) 100%)',
              }}
            />

            <svg
              viewBox="0 0 1024 1024"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              aria-label="Interactive map of the nine Human Design centres"
              role="img"
              style={{ position: 'absolute', inset: 0, display: 'block' }}
            >
              <defs>
                <filter id="acm-glow" x="-70%" y="-70%" width="240%" height="240%">
                  <feGaussianBlur stdDeviation="7" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Channel topology — faint by default, lit where energy flows. */}
              <g fill="none" strokeLinecap="round">
                {CENTER_LINKS.map(([an, bn]) => {
                  const a = BY_NAME[an];
                  const b = BY_NAME[bn];
                  const live = defined.has(an) && defined.has(bn);
                  const touchesShown =
                    shown != null && (shown.name === an || shown.name === bn);
                  return (
                    <line
                      key={`${an}-${bn}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={
                        live
                          ? 'rgba(224, 196, 128, 0.7)'
                          : 'rgba(252, 250, 246, 0.14)'
                      }
                      strokeWidth={touchesShown ? 5 : live ? 3.5 : 2}
                    />
                  );
                })}
              </g>

              {/* Centre nodes */}
              {CENTERS.map((c) => {
                const isDefined = defined.has(c.name);
                const isShown = shown?.name === c.name;
                return (
                  <g
                    key={c.name}
                    onMouseEnter={() => setHovered(c)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() =>
                      setPinned((p) => (p?.name === c.name ? null : c))
                    }
                    onFocus={() => setHovered(c)}
                    onBlur={() => setHovered(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPinned((p) => (p?.name === c.name ? null : c));
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${c.chakra} centre — ${
                      isDefined ? 'defined' : 'open'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Generous invisible hit area */}
                    <circle cx={c.x} cy={c.y} r={c.r + 16} fill="transparent" />
                    {/* Defined: a soft chakra-coloured halo. */}
                    {isDefined && (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={c.r + 8}
                        fill={c.color}
                        opacity={0.34}
                        filter="url(#acm-glow)"
                      />
                    )}
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={c.r}
                      fill="rgba(8, 10, 16, 0.66)"
                      stroke={c.color}
                      strokeWidth={isShown ? 5 : isDefined ? 3.6 : 2.2}
                      strokeOpacity={isDefined ? 1 : 0.5}
                    />
                    <g opacity={isDefined ? 1 : 0.5}>
                      <CenterGlyph
                        name={c.name}
                        cx={c.x}
                        cy={c.y}
                        s={c.r * 0.56}
                        color={c.color}
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 18,
              justifyContent: 'center',
              marginTop: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              color: INK_DIM,
              textTransform: 'uppercase',
            }}
          >
            <LegendDot filled label="Defined" />
            <LegendDot filled={false} label="Open" />
          </div>
        </div>

        {/* ─── DETAIL PANEL ─── */}
        <aside
          style={{
            position: 'sticky',
            top: 24,
            padding: '24px 28px',
            border: '1px solid rgba(200, 160, 82, 0.18)',
            borderRadius: 6,
            background: 'rgba(8, 12, 24, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            minHeight: 300,
          }}
        >
          {shown ? (
            <ChakraDetail
              c={shown}
              activated={activated}
              defined={defined.has(shown.name)}
            />
          ) : (
            <div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: BRASS,
                  marginBottom: 10,
                }}
              >
                Read the body
              </div>
              <p
                style={{
                  fontFamily: "'Hanken Grotesk', serif",
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: 'rgba(252, 250, 246, 0.78)',
                  margin: '0 0 12px',
                }}
              >
                Tap any centre on the figure to read its anatomy — the glands
                and organs it governs, the channels it feeds, and the
                cause-and-effect of it being defined or open in you.
              </p>
              <p
                style={{
                  fontFamily: "'Hanken Grotesk', serif",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'rgba(252, 250, 246, 0.58)',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                A lit centre is defined — your own consistent current.
                <br />
                A faint one is open — where you take the world in.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function LegendDot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: filled ? 'rgba(232, 224, 206, 0.85)' : 'transparent',
          border: '1px solid rgba(232, 224, 206, 0.7)',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

/* ─── Detail panel content ─── */

function ChakraDetail({
  c,
  activated,
  defined,
}: {
  c: CenterMeta;
  activated: Set<number>;
  defined: boolean;
}) {
  const INK_DIM = 'rgba(252, 250, 246, 0.62)';
  const userGates = c.gates.filter((g) => activated.has(g));
  const neighbours = neighboursOf(c.name);

  const causeEffect = defined
    ? `This centre runs on its own current. The ${organList(
        c.organs,
      )} keep a steady rhythm — ${c.domain} is something you reliably generate, and the people around you consistently feel it coming from you.`
    : `This centre has no fixed current of its own. The ${organList(
        c.organs,
      )} stay porous — ${c.domain} is something you absorb, amplify and reflect from whoever you are with. The wisdom here is learning not to take the borrowed personally.`;

  return (
    <div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: defined ? c.color : INK_DIM,
          marginBottom: 8,
        }}
      >
        {defined ? 'Defined · your own' : 'Open · absorbs others'}
      </div>
      <h3
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 22,
          fontWeight: 500,
          margin: '0 0 4px',
          letterSpacing: '-0.01em',
          color: c.color,
        }}
      >
        {c.chakra}
      </h3>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.06em',
          color: INK_DIM,
          marginBottom: 18,
        }}
      >
        {c.name !== c.chakra ? `HD: ${c.name} · ` : ''}
        {c.region}
      </div>

      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 16,
          lineHeight: 1.7,
          color: 'rgba(252, 250, 246, 0.82)',
          margin: '0 0 18px',
        }}
      >
        {c.theme}
      </p>

      <DetailRow label="Governs">{c.organs.join(' · ')}</DetailRow>

      <DetailRow label="Cause & effect">{causeEffect}</DetailRow>

      <DetailRow label="Channels into">{neighbours.join(' · ')}</DetailRow>

      <DetailRow label="Gates here">
        {c.gates.length} total ·{' '}
        <span style={{ color: c.color, fontWeight: 500 }}>
          {userGates.length} active in you
        </span>
      </DetailRow>

      {userGates.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: INK_DIM,
              marginBottom: 6,
            }}
          >
            Your gates
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {userGates.map((g) => (
              <span
                key={g}
                style={{
                  padding: '4px 10px',
                  border: `1px solid ${c.color}`,
                  borderRadius: 999,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: c.color,
                }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function organList(organs: string[]): string {
  const lower = organs.map((o) => o.toLowerCase());
  if (lower.length === 1) return lower[0];
  return `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(252, 250, 246, 0.45)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 15,
          lineHeight: 1.6,
          color: 'rgba(252, 250, 246, 0.82)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
