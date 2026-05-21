"use client";

// AnatomicalChakraMap.tsx — anatomical companion to the canonical Human
// Design BodyGraph. Renders the same 9 centres mapped to their position on
// a stylised human silhouette, with the organ associations each centre
// governs. Sits BELOW <BodyGraphInteractive /> in the HD tab — purists
// still get the abstract HD geometry; everyone else gets "what does this
// look like in my body?"
//
// Defined centres glow brass (your activated energy). Undefined centres
// are faint outlines (the open chakras you absorb from others). Hover any
// centre to see: name, defined/undefined status, the organs it governs,
// the HD theme, and your active gates in that centre.

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
  /** Position on the 400×820 viewBox, anchor of the circle. */
  cx: number;
  cy: number;
  /** Visual size of the centre marker. */
  r: number;
  /** Anatomical region label that shows on hover. */
  region: string;
  /** Organs/glands the centre governs in HD's biological model. */
  organs: string[];
  /** Short HD theme. */
  theme: string;
  /** Gates that live in this centre. */
  gates: number[];
};

const CENTERS: readonly CenterMeta[] = [
  {
    name: 'Head',
    chakra: 'Crown',
    cx: 200, cy: 38, r: 22,
    region: 'Top of the skull',
    organs: ['Pineal gland'],
    theme: 'Pressure to know — inspiration, doubt, wonder.',
    gates: [64, 61, 63],
  },
  {
    name: 'Ajna',
    chakra: 'Third Eye',
    cx: 200, cy: 94, r: 20,
    region: 'Forehead, behind the eyes',
    organs: ['Pituitary gland', 'Cerebral cortex'],
    theme: 'Conceptualisation — how the mind makes sense.',
    gates: [47, 24, 4, 17, 43, 11],
  },
  {
    name: 'Throat',
    chakra: 'Throat',
    cx: 200, cy: 162, r: 24,
    region: 'Throat, larynx, jaw',
    organs: ['Thyroid', 'Parathyroid', 'Larynx', 'Vocal cords'],
    theme: 'Manifestation and voice — where energy becomes action.',
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  },
  {
    name: 'G',
    chakra: 'Heart · Identity',
    cx: 200, cy: 280, r: 24,
    region: 'Sternum, centre of chest',
    organs: ['Liver', 'Blood', 'Heart (vessel)'],
    theme: 'Identity · direction · love — your magnetic centre.',
    gates: [7, 1, 13, 25, 10, 15, 46, 2],
  },
  {
    name: 'Heart',
    chakra: 'Will / Ego',
    cx: 250, cy: 310, r: 18,
    region: 'Right side of the chest cavity',
    organs: ['Heart muscle', 'Gallbladder', 'Stomach', 'Thymus'],
    theme: 'Will, ego, material courage — the seat of "I can".',
    gates: [21, 40, 26, 51],
  },
  {
    name: 'Solar Plexus',
    chakra: 'Solar Plexus',
    cx: 250, cy: 408, r: 22,
    region: 'Upper abdomen, right of navel',
    organs: ['Pancreas', 'Kidneys', 'Nervous system'],
    theme: 'Emotional awareness — the wave that asks for time.',
    gates: [36, 22, 37, 6, 49, 55, 30],
  },
  {
    name: 'Spleen',
    chakra: 'Spleen',
    cx: 150, cy: 408, r: 22,
    region: 'Left side, under the ribs',
    organs: ['Spleen', 'Lymphatic system', 'Immune system', 'T-cells'],
    theme: 'Intuition · immunity · survival — the body that knows now.',
    gates: [48, 57, 44, 50, 32, 28, 18],
  },
  {
    name: 'Sacral',
    chakra: 'Sacral',
    cx: 200, cy: 488, r: 26,
    region: 'Lower abdomen, below the navel',
    organs: ['Ovaries', 'Testes', 'Reproductive system'],
    theme: 'Life-force · work · response — the generative engine.',
    gates: [34, 5, 14, 29, 59, 9, 3, 42, 27],
  },
  {
    name: 'Root',
    chakra: 'Root',
    cx: 200, cy: 580, r: 22,
    region: 'Base of the pelvis, perineum',
    organs: ['Adrenal glands'],
    theme: 'Pressure and fuel — the deadline body, the survival pulse.',
    gates: [58, 38, 54, 53, 60, 52, 19, 39, 41],
  },
];

/* ─── Body silhouette — a stylised front-view path. Stroked only, no fill,
   so the chakra circles read on top. */
const BODY_PATH = `
  M 200 14
  C 232 14 254 36 254 70
  C 254 96 240 116 226 124
  L 226 134
  C 246 138 264 148 280 162
  L 296 218
  C 308 248 314 280 312 312
  L 308 396
  C 308 416 304 432 296 444
  L 300 600
  C 300 640 296 700 286 760
  L 252 800
  L 244 800
  L 236 700
  L 220 530
  L 200 530
  L 180 530
  L 164 700
  L 156 800
  L 148 800
  L 114 760
  C 104 700 100 640 100 600
  L 104 444
  C 96 432 92 416 92 396
  L 88 312
  C 86 280 92 248 104 218
  L 120 162
  C 136 148 154 138 174 134
  L 174 124
  C 160 116 146 96 146 70
  C 146 36 168 14 200 14
  Z
`;

const ARM_LEFT = `
  M 110 178
  C 80 200 64 240 56 290
  L 50 380
  C 48 420 52 460 60 500
  L 70 500
  L 68 460
  L 72 380
  C 78 332 90 250 116 200
`;

const ARM_RIGHT = `
  M 290 178
  C 320 200 336 240 344 290
  L 350 380
  C 352 420 348 460 340 500
  L 330 500
  L 332 460
  L 328 380
  C 322 332 310 250 284 200
`;

export type AnatomicalChakraMapProps = {
  hdResult: HdLike;
};

export default function AnatomicalChakraMap({ hdResult }: AnatomicalChakraMapProps) {
  const activated = new Set<number>(hdResult?.activatedGates ?? []);
  const defined = new Set<string>(hdResult?.definedCenters ?? []);
  const [hover, setHover] = useState<CenterMeta | null>(null);

  const BRASS = 'var(--brass, #C8A052)';
  const INK_FAINT = 'rgba(252, 250, 246, 0.18)';
  const INK_DIM = 'rgba(252, 250, 246, 0.65)';
  const INK = 'var(--ink, #FCFAF6)';

  return (
    <section style={{ marginTop: 64, maxWidth: 960, margin: '64px auto 0' }}>
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
        style={{
          maxWidth: 560,
          margin: '0 auto 32px',
          textAlign: 'center',
        }}
      >
        The same nine centres from the BodyGraph above — placed where they live in your body, with the organs and glands each governs. Hover any centre to read the anatomy.
      </p>

      <div
        className="anatomical-chakra-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 380px) 1fr',
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
        {/* ─── BODY + CHAKRA SVG ─── */}
        <div style={{ position: 'relative' }}>
          <svg
            viewBox="0 0 400 820"
            width="100%"
            height="auto"
            aria-label="Anatomical map of nine Human Design centres"
            role="img"
            style={{ display: 'block' }}
          >
            <defs>
              <radialGradient id="acm-defined-fill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(200, 160, 82, 0.55)" />
                <stop offset="60%" stopColor="rgba(200, 160, 82, 0.22)" />
                <stop offset="100%" stopColor="rgba(200, 160, 82, 0)" />
              </radialGradient>
              <filter id="acm-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Body silhouette */}
            <g fill="none" stroke={INK_FAINT} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round">
              <path d={BODY_PATH} />
              <path d={ARM_LEFT} />
              <path d={ARM_RIGHT} />
              {/* Spine — subtle vertical guide */}
              <line x1={200} y1={130} x2={200} y2={600} stroke={INK_FAINT} strokeDasharray="2 6" />
            </g>

            {/* Connections — faint lines between defined centres only */}
            <g stroke="rgba(200, 160, 82, 0.35)" strokeWidth={1} fill="none">
              {CENTERS.flatMap((a, i) =>
                CENTERS.slice(i + 1)
                  .filter((b) => defined.has(a.name) && defined.has(b.name))
                  .map((b) => (
                    <line
                      key={`${a.name}-${b.name}`}
                      x1={a.cx}
                      y1={a.cy}
                      x2={b.cx}
                      y2={b.cy}
                    />
                  )),
              )}
            </g>

            {/* Chakra centres */}
            {CENTERS.map((c) => {
              const isDefined = defined.has(c.name);
              const isHover = hover?.name === c.name;
              return (
                <g
                  key={c.name}
                  onMouseEnter={() => setHover(c)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                  aria-label={`${c.chakra} centre — ${isDefined ? 'defined' : 'undefined'}`}
                >
                  {/* Hit area (invisible but wider than the visible circle) */}
                  <circle cx={c.cx} cy={c.cy} r={c.r + 8} fill="transparent" />
                  {/* Defined: filled glow. Undefined: ring only. */}
                  {isDefined && (
                    <circle
                      cx={c.cx}
                      cy={c.cy}
                      r={c.r + 4}
                      fill="url(#acm-defined-fill)"
                      filter="url(#acm-glow)"
                    />
                  )}
                  <circle
                    cx={c.cx}
                    cy={c.cy}
                    r={c.r}
                    fill={isDefined ? 'rgba(200, 160, 82, 0.18)' : 'rgba(10, 14, 26, 0.7)'}
                    stroke={isDefined ? BRASS : 'rgba(252, 250, 246, 0.35)'}
                    strokeWidth={isHover ? 2.2 : 1.4}
                  />
                  <text
                    x={c.cx}
                    y={c.cy + 4}
                    textAnchor="middle"
                    fontFamily="'IBM Plex Mono', monospace"
                    fontSize={9}
                    letterSpacing="0.12em"
                    fill={isDefined ? INK : INK_DIM}
                    style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
                  >
                    {c.name === 'Solar Plexus' ? 'SP' : c.name.slice(0, 4).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>

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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'rgba(200, 160, 82, 0.5)',
                  border: `1px solid ${BRASS}`,
                  display: 'inline-block',
                }}
              />
              Defined
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'rgba(10, 14, 26, 0.7)',
                  border: '1px solid rgba(252, 250, 246, 0.35)',
                  display: 'inline-block',
                }}
              />
              Open
            </span>
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
            minHeight: 280,
          }}
        >
          {hover ? (
            <ChakraDetail c={hover} activated={activated} defined={defined.has(hover.name)} />
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
                Hover any centre on the figure to read its anatomy — the gland it speaks through, the organs it animates, the theme it carries.
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
                Brass = defined, your own energy.<br />
                Open = where you take the world in.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
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
  const BRASS = 'var(--brass, #C8A052)';
  const INK_DIM = 'rgba(252, 250, 246, 0.62)';
  const userGates = c.gates.filter((g) => activated.has(g));

  return (
    <div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: defined ? BRASS : INK_DIM,
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
        {c.name === c.chakra ? '' : `HD: ${c.name}`} {c.name !== c.chakra && '·'} {c.region}
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

      <DetailRow label="Governs">
        {c.organs.join(' · ')}
      </DetailRow>

      <DetailRow label="Gates here">
        {c.gates.length} total · <span style={{ color: BRASS, fontWeight: 500 }}>{userGates.length} active in you</span>
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
                  border: `1px solid ${BRASS}`,
                  borderRadius: 999,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: BRASS,
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
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
