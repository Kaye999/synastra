"use client";

// HumanAnatomy.tsx — anatomical diagram with see-through body, internal
// organs visible at their real positions, and chakras overlaid as glow
// circles. Every organ + every chakra is clickable; clicking opens a
// detail panel showing: name, anatomical function (or location), the
// "consciousness" the part of the body carries, and which Human Design
// centre + traditional chakra it maps to.
//
// Replaces the earlier <AnatomicalChakraMap /> which only showed the 9
// HD centres as dots on a simple silhouette.
//
// Visual treatment:
//   - Body silhouette: thin outline + faint translucent "skin" fill so
//     the organs read through it.
//   - Organs: simplified anatomical paths, brass-tinted, slightly more
//     opaque than the skin so they're clearly visible.
//   - Chakras: glowing circles at classical body positions; defined HD
//     centres (the user's own energy) burn brighter brass.
//   - Hover: faint glow, cursor pointer.
//   - Selected: glass-blur detail panel slides in on the right.

import { useState } from 'react';
import {
  ORGANS,
  CHAKRAS,
  type OrganEntry,
  type ChakraEntry,
} from '@/lib/interp/human-anatomy';

type HdLike = {
  activatedGates?: number[];
  definedCenters?: readonly string[];
};

type Selection =
  | { kind: 'organ'; key: string; data: OrganEntry }
  | { kind: 'chakra'; key: string; data: ChakraEntry };

/* ─── Organ paths — simplified anatomical shapes positioned in a 400×860
   viewBox. The body is roughly 6.5 head-heights tall, centred at x=200.
   Each organ path uses smooth Béziers to feel anatomical, not clinical. */

type OrganShape = {
  key: keyof typeof ORGANS;
  /** Display label position (used for tooltip / aria) */
  cx: number;
  cy: number;
  /** SVG path */
  d: string;
};

const ORGAN_SHAPES: readonly OrganShape[] = [
  {
    key: 'brain',
    cx: 200, cy: 56,
    d: `M 168 30 C 168 14 184 4 200 4 C 216 4 232 14 232 30
        C 240 36 244 48 240 60 C 244 70 240 82 232 88
        C 232 100 218 108 200 108 C 182 108 168 100 168 88
        C 160 82 156 70 160 60 C 156 48 160 36 168 30 Z
        M 200 12 L 200 100`,
  },
  {
    key: 'pineal',
    cx: 200, cy: 52,
    d: `M 196 50 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`,
  },
  {
    key: 'pituitary',
    cx: 200, cy: 78,
    d: `M 196 76 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`,
  },
  {
    key: 'thyroid',
    cx: 200, cy: 148,
    d: `M 184 144 C 188 140 196 140 200 144
        C 204 140 212 140 216 144
        C 218 150 214 156 208 158
        C 204 156 200 154 200 150
        C 200 154 196 156 192 158
        C 186 156 182 150 184 144 Z`,
  },
  {
    key: 'heart',
    cx: 205, cy: 250,
    d: `M 205 234 C 205 228 200 224 194 224
        C 184 224 180 232 180 240
        C 180 254 192 266 205 280
        C 218 266 230 254 230 240
        C 230 232 226 224 216 224
        C 210 224 205 228 205 234 Z`,
  },
  {
    key: 'lungs',
    cx: 200, cy: 248,
    d: `M 162 218 C 138 222 132 248 134 280
        C 136 304 152 314 168 312
        C 176 310 180 302 180 290
        L 180 232 C 180 222 172 216 162 218 Z
        M 238 218 C 262 222 268 248 266 280
        C 264 304 248 314 232 312
        C 224 310 220 302 220 290
        L 220 232 C 220 222 228 216 238 218 Z`,
  },
  {
    key: 'liver',
    cx: 240, cy: 348,
    d: `M 200 330 C 220 322 252 322 274 332
        C 280 340 280 358 274 370
        C 256 380 220 380 204 372
        C 196 360 196 342 200 330 Z`,
  },
  {
    key: 'stomach',
    cx: 178, cy: 350,
    d: `M 162 326 C 152 332 146 348 150 366
        C 156 384 176 388 192 378
        C 198 372 198 360 196 350
        C 196 340 192 332 184 328
        C 178 326 168 326 162 326 Z`,
  },
  {
    key: 'pancreas',
    cx: 198, cy: 388,
    d: `M 164 386 C 178 382 198 388 220 390
        C 232 391 240 392 240 386
        C 240 380 232 378 220 380
        C 198 378 178 374 164 380 Z`,
  },
  {
    key: 'spleen',
    cx: 130, cy: 356,
    d: `M 120 342 C 108 348 106 366 116 378
        C 128 386 140 380 144 368
        C 146 358 138 344 128 342
        C 124 341 122 341 120 342 Z`,
  },
  {
    key: 'kidneys',
    cx: 200, cy: 408,
    d: `M 164 396 C 152 400 150 422 158 436
        C 170 444 184 440 188 426
        C 192 412 184 398 172 396
        C 168 395 166 395 164 396 Z
        M 236 396 C 248 400 250 422 242 436
        C 230 444 216 440 212 426
        C 208 412 216 398 228 396
        C 232 395 234 395 236 396 Z`,
  },
  {
    key: 'adrenals',
    cx: 200, cy: 392,
    d: `M 168 388 L 178 388 L 173 396 Z
        M 232 388 L 222 388 L 227 396 Z`,
  },
  {
    key: 'gonads',
    cx: 200, cy: 580,
    d: `M 184 572 C 178 572 174 580 178 588
        C 184 594 196 594 200 588
        C 204 594 216 594 222 588
        C 226 580 222 572 216 572
        C 208 572 204 580 200 580
        C 196 580 192 572 184 572 Z`,
  },
];

/* ─── Chakra positions — front-facing layer over the body ─── */

type ChakraSpot = {
  key: keyof typeof CHAKRAS;
  cx: number;
  cy: number;
  r: number;
};

const CHAKRA_SPOTS: readonly ChakraSpot[] = [
  { key: 'crown',       cx: 200, cy: 6,   r: 14 },
  { key: 'thirdEye',    cx: 200, cy: 78,  r: 13 },
  { key: 'throat',      cx: 200, cy: 148, r: 14 },
  { key: 'heart',       cx: 200, cy: 254, r: 16 },
  { key: 'ego',         cx: 240, cy: 268, r: 12 },
  { key: 'solarPlexus', cx: 200, cy: 360, r: 15 },
  { key: 'spleen',      cx: 130, cy: 360, r: 13 },
  { key: 'sacral',      cx: 200, cy: 500, r: 16 },
  { key: 'root',        cx: 200, cy: 580, r: 14 },
];

/* ─── Body silhouette (front view, ~860 tall) ─── */

const BODY_PATH = `
  M 200 4
  C 232 4 254 26 254 60
  C 254 88 240 108 224 116
  L 224 132
  C 250 138 270 152 286 172
  L 302 232
  C 314 264 320 296 318 326
  L 314 410
  C 314 432 308 450 298 462
  L 302 600
  C 302 640 298 700 286 760
  L 252 820
  L 246 820
  L 240 720
  L 224 540
  L 200 540
  L 176 540
  L 160 720
  L 154 820
  L 148 820
  L 114 760
  C 102 700 98 640 98 600
  L 102 462
  C 92 450 86 432 86 410
  L 82 326
  C 80 296 86 264 98 232
  L 114 172
  C 130 152 150 138 176 132
  L 176 116
  C 160 108 146 88 146 60
  C 146 26 168 4 200 4
  Z
`;

const ARM_LEFT = `
  M 110 190
  C 80 212 64 252 56 302
  L 50 396
  C 48 436 52 476 60 516
  L 70 516
  L 68 476
  L 72 396
  C 78 348 90 268 116 218
`;

const ARM_RIGHT = `
  M 290 190
  C 320 212 336 252 344 302
  L 350 396
  C 352 436 348 476 340 516
  L 330 516
  L 332 476
  L 328 396
  C 322 348 310 268 284 218
`;

export type HumanAnatomyProps = {
  hdResult?: HdLike;
};

export default function HumanAnatomy({ hdResult }: HumanAnatomyProps) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const definedCenters = new Set<string>(hdResult?.definedCenters ?? []);

  const onOrgan = (key: string) => {
    const data = ORGANS[key];
    if (!data) return;
    setSelected({ kind: 'organ', key, data });
  };
  const onChakra = (key: string) => {
    const data = CHAKRAS[key];
    if (!data) return;
    setSelected({ kind: 'chakra', key, data });
  };

  const BRASS = 'var(--brass, #C8A052)';
  const INK_FAINT = 'rgba(252, 250, 246, 0.18)';
  const INK_DIM = 'rgba(252, 250, 246, 0.55)';
  const INK = 'var(--ink, #FCFAF6)';

  return (
    <section style={{ maxWidth: 1080, margin: '64px auto 0' }}>
      <header style={{ textAlign: 'center', marginBottom: 28 }}>
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
          The Anatomy
        </div>
        <h2
          style={{
            fontFamily: "'Alice', serif",
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.2,
            margin: '0 0 12px',
            letterSpacing: '-0.01em',
          }}
        >
          Your centres, mapped to the organs they speak through
        </h2>
        <p
          className="chapter-body"
          style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}
        >
          Each chakra has a body — a gland, an organ, a stretch of tissue it animates. Click any organ or chakra to read what it does in the body and the consciousness it carries.
        </p>
      </header>

      <div
        className="human-anatomy-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 420px) 1fr',
          gap: 40,
          alignItems: 'start',
          padding: '24px 0',
        }}
      >
        <style>{`
          @media (max-width: 720px) {
            .human-anatomy-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
          }
        `}</style>

        {/* ─── SVG ─── */}
        <div style={{ position: 'relative' }}>
          <svg
            viewBox="0 0 400 860"
            width="100%"
            height="auto"
            aria-label="Human anatomy with chakras and organs"
            role="img"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <radialGradient id="ha-chakra-fill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(200, 160, 82, 0.7)" />
                <stop offset="60%" stopColor="rgba(200, 160, 82, 0.28)" />
                <stop offset="100%" stopColor="rgba(200, 160, 82, 0)" />
              </radialGradient>
              <radialGradient id="ha-chakra-dim" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(252, 250, 246, 0.25)" />
                <stop offset="60%" stopColor="rgba(252, 250, 246, 0.10)" />
                <stop offset="100%" stopColor="rgba(252, 250, 246, 0)" />
              </radialGradient>
              <filter id="ha-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ha-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Translucent "skin" layer — gives the see-through feel */}
            <path
              d={BODY_PATH}
              fill="rgba(252, 250, 246, 0.025)"
              stroke="none"
            />

            {/* Body outline + arms */}
            <g
              fill="none"
              stroke={INK_FAINT}
              strokeWidth={1.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d={BODY_PATH} />
              <path d={ARM_LEFT} />
              <path d={ARM_RIGHT} />
              {/* Spine — subtle dashed guide */}
              <line x1={200} y1={130} x2={200} y2={640} stroke={INK_FAINT} strokeDasharray="2 7" />
              {/* Collarbone */}
              <path d="M 165 178 C 180 174 220 174 235 178" />
              {/* Ribcage hint */}
              <path d="M 145 230 C 175 256 225 256 255 230" opacity={0.6} />
              <path d="M 140 260 C 175 290 225 290 260 260" opacity={0.5} />
              <path d="M 138 290 C 175 320 225 320 262 290" opacity={0.4} />
              {/* Pelvis hint */}
              <path d="M 134 500 C 175 540 225 540 266 500" opacity={0.4} />
            </g>

            {/* Internal organs — clickable */}
            <g>
              {ORGAN_SHAPES.map((o) => {
                const isHover = hover === `organ:${o.key}`;
                const isSelected = selected?.kind === 'organ' && selected.key === o.key;
                return (
                  <g
                    key={o.key}
                    onMouseEnter={() => setHover(`organ:${o.key}`)}
                    onMouseLeave={() => setHover((h) => (h === `organ:${o.key}` ? null : h))}
                    onClick={() => onOrgan(o.key)}
                    onFocus={() => setHover(`organ:${o.key}`)}
                    onBlur={() => setHover((h) => (h === `organ:${o.key}` ? null : h))}
                    tabIndex={0}
                    role="button"
                    aria-label={`${ORGANS[o.key]?.name ?? o.key} — click for description`}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    <path
                      d={o.d}
                      fill={isHover || isSelected ? 'rgba(200, 160, 82, 0.16)' : 'rgba(200, 160, 82, 0.05)'}
                      stroke={isHover || isSelected ? BRASS : 'rgba(252, 250, 246, 0.32)'}
                      strokeWidth={isHover || isSelected ? 1.4 : 0.9}
                      filter={isHover || isSelected ? 'url(#ha-glow)' : undefined}
                    />
                  </g>
                );
              })}
            </g>

            {/* Chakras — front layer, glowing circles */}
            <g>
              {CHAKRA_SPOTS.map((c) => {
                const chakra = CHAKRAS[c.key];
                if (!chakra) return null;
                const isHover = hover === `chakra:${c.key}`;
                const isSelected = selected?.kind === 'chakra' && selected.key === c.key;
                // HD centres correspond — light up the ones the user has defined.
                const isDefined = definedCenters.has(chakra.hdCenter);
                const fillId = isDefined || isHover || isSelected ? 'ha-chakra-fill' : 'ha-chakra-dim';
                return (
                  <g
                    key={c.key}
                    onMouseEnter={() => setHover(`chakra:${c.key}`)}
                    onMouseLeave={() => setHover((h) => (h === `chakra:${c.key}` ? null : h))}
                    onClick={() => onChakra(c.key)}
                    onFocus={() => setHover(`chakra:${c.key}`)}
                    onBlur={() => setHover((h) => (h === `chakra:${c.key}` ? null : h))}
                    tabIndex={0}
                    role="button"
                    aria-label={`${chakra.name} chakra — click for description`}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    {/* Generous hit area */}
                    <circle cx={c.cx} cy={c.cy} r={c.r + 8} fill="transparent" />
                    {/* Outer halo */}
                    <circle
                      cx={c.cx} cy={c.cy} r={c.r + 6}
                      fill={`url(#${fillId})`}
                      filter="url(#ha-soft-glow)"
                    />
                    {/* Inner ring */}
                    <circle
                      cx={c.cx} cy={c.cy} r={c.r}
                      fill={isDefined ? 'rgba(200, 160, 82, 0.22)' : 'rgba(10, 14, 26, 0.55)'}
                      stroke={isDefined || isHover || isSelected ? BRASS : 'rgba(252, 250, 246, 0.45)'}
                      strokeWidth={isHover || isSelected ? 1.8 : 1.2}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 18,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 16,
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
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'rgba(200, 160, 82, 0.55)',
                  border: `1px solid ${BRASS}`,
                  display: 'inline-block',
                }}
              />
              Defined chakra (your energy)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'rgba(10, 14, 26, 0.55)',
                  border: '1px solid rgba(252, 250, 246, 0.45)',
                  display: 'inline-block',
                }}
              />
              Open chakra
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 12, height: 8, borderRadius: 2,
                  background: 'rgba(200, 160, 82, 0.10)',
                  border: '1px solid rgba(252, 250, 246, 0.32)',
                  display: 'inline-block',
                }}
              />
              Organ
            </span>
          </div>
        </div>

        {/* ─── Detail panel ─── */}
        <aside
          style={{
            position: 'sticky',
            top: 24,
            padding: '28px 32px',
            border: '1px solid rgba(200, 160, 82, 0.18)',
            borderRadius: 6,
            background: 'rgba(8, 12, 24, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            minHeight: 320,
          }}
        >
          {selected ? (
            selected.kind === 'organ' ? (
              <OrganDetail data={selected.data} isDefinedHd={definedCenters.has(selected.data.hdCenter)} />
            ) : (
              <ChakraDetail data={selected.data} isDefinedHd={definedCenters.has(selected.data.hdCenter)} />
            )
          ) : (
            <EmptyState />
          )}
        </aside>
      </div>
    </section>
  );
}

/* ─── Detail content ─── */

function EmptyState() {
  return (
    <div>
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
        Read the body
      </div>
      <p className="chapter-body" style={{ margin: '0 0 12px' }}>
        Click any chakra or organ on the figure. Each one carries a function (what it does in the body) and a consciousness (what it carries energetically).
      </p>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 14,
          lineHeight: 1.7,
          color: 'rgba(252, 250, 246, 0.55)',
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        Brass-filled chakras are the centres your Human Design chart defines — your own energy. The faint ones are open, where you absorb from others.
      </p>
    </div>
  );
}

function OrganDetail({ data, isDefinedHd }: { data: OrganEntry; isDefinedHd: boolean }) {
  return (
    <div>
      <Eyebrow color="var(--brass)">{`ORGAN · ${data.hdCenter.toUpperCase()} CENTRE · ${data.chakra.toUpperCase()} CHAKRA`}</Eyebrow>
      <Title>{data.name}</Title>
      <Subtitle>{data.region}</Subtitle>
      <Row label="Function">{data.function}</Row>
      <Row label="Consciousness">{data.consciousness}</Row>
      <Footer>
        {isDefinedHd
          ? `Your ${data.hdCenter} centre is defined — this organ runs on your own energy.`
          : `Your ${data.hdCenter} centre is open — this organ amplifies energy from those around you.`}
      </Footer>
    </div>
  );
}

function ChakraDetail({ data, isDefinedHd }: { data: ChakraEntry; isDefinedHd: boolean }) {
  return (
    <div>
      <Eyebrow color={isDefinedHd ? 'var(--brass)' : 'rgba(252,250,246,0.55)'}>
        {isDefinedHd ? `DEFINED · ${data.hdCenter.toUpperCase()} CENTRE` : `OPEN · ${data.hdCenter.toUpperCase()} CENTRE`}
      </Eyebrow>
      <Title>{data.name}{data.sanskrit ? ` · ${data.sanskrit}` : ''}</Title>
      <Subtitle>{data.location}{data.element ? ` · ${data.element}` : ''}</Subtitle>
      <Row label="Consciousness">{data.consciousness}</Row>
      <Row label="When balanced">{data.whenBalanced}</Row>
      <Row label="When blocked">{data.whenBlocked}</Row>
    </div>
  );
}

/* ─── Layout atoms ─── */

function Eyebrow({ children, color = 'var(--brass)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "'Alice', serif",
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        lineHeight: 1.2,
        margin: '0 0 6px',
      }}
    >
      {children}
    </h3>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.06em',
        color: 'rgba(252, 250, 246, 0.55)',
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
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
      <p
        className="chapter-body"
        style={{ margin: 0, maxWidth: '60ch' }}
      >
        {children}
      </p>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 14,
        borderTop: '1px solid rgba(200, 160, 82, 0.18)',
        fontFamily: "'Hanken Grotesk', serif",
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 1.7,
        color: 'rgba(252, 250, 246, 0.7)',
      }}
    >
      {children}
    </div>
  );
}
