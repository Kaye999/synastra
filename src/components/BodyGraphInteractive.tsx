"use client";

// BodyGraphInteractive — Human Design 9-centre Rave BodyGraph, interactive.
//
// Renders the canonical mandala (Head · Ajna · Throat · G · Heart · Solar Plexus ·
// Sacral · Spleen · Root) as pure SVG, with each centre drawn in its traditional
// shape and all 36 channels as connectors between centre anchor points. Centres
// fill faintly when both endpoint gates of a channel are activated; individual
// gate numbers light up brass when present in the activation list.
//
// Interactions
// ─────────────
// - Hover centre   → fill brightens, tooltip shows name/theme/defined-status
// - Click centre   → onCenterClick(name), centre pulses brass
// - Hover gate     → tooltip shows gate name + single-line theme
// - Click gate     → flash (active gates only)
// - Hover channel  → both endpoint centres highlight + channel name in tooltip
//
// All styling is inline so the component is drop-in anywhere. Respects
// prefers-reduced-motion (hooks skip motion when reduced).

import { useEffect, useMemo, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type HumanDesignResult = {
  type?: string;
  strategy?: string;
  authority?: string;
  profile?: string;
  definition?: string;
  activatedGates: number[];
  // Optional extras the engine may populate — we tolerate extra fields.
  [key: string]: unknown;
};

export type BodyGraphInteractiveProps = {
  hdResult: HumanDesignResult;
  onCenterClick?: (center: string) => void;
};

// ─── Centre definitions ─────────────────────────────────────────────────────

type CenterKey =
  | 'Head'
  | 'Ajna'
  | 'Throat'
  | 'G'
  | 'Heart'
  | 'SolarPlexus'
  | 'Sacral'
  | 'Spleen'
  | 'Root';

type CenterShape = 'triUp' | 'triDown' | 'square' | 'diamond' | 'triRight' | 'triLeft';

type CenterDef = {
  key: CenterKey;
  label: string;
  theme: string;
  shape: CenterShape;
  cx: number;
  cy: number;
  size: number; // bounding size
  gates: number[];
  // per-gate anchor as {n: [x, y]} inside viewBox
  gateAnchors: Record<number, [number, number]>;
};

// Canvas is 500 × 700
// Positions chosen so canonical channel lines run roughly vertical / clean.

const CENTERS: CenterDef[] = [
  {
    key: 'Head',
    label: 'Head',
    theme: 'Inspiration · Doubt',
    shape: 'triUp',
    cx: 250,
    cy: 62,
    size: 96,
    gates: [64, 61, 63],
    gateAnchors: {
      64: [218, 95],
      61: [250, 45],
      63: [282, 95],
    },
  },
  {
    key: 'Ajna',
    label: 'Ajna',
    theme: 'Conceptualisation · Certainty',
    shape: 'triDown',
    cx: 250,
    cy: 158,
    size: 104,
    gates: [47, 24, 4, 17, 43, 11],
    gateAnchors: {
      47: [212, 130],
      24: [232, 130],
      4: [268, 130],
      17: [288, 130],
      11: [222, 184],
      43: [278, 184],
    },
  },
  {
    key: 'Throat',
    label: 'Throat',
    theme: 'Expression · Manifestation',
    shape: 'square',
    cx: 250,
    cy: 252,
    size: 108,
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
    gateAnchors: {
      62: [204, 214],
      23: [227, 207],
      56: [250, 204],
      35: [273, 207],
      12: [296, 214],
      45: [296, 252],
      33: [296, 290],
      8: [273, 297],
      31: [250, 300],
      20: [227, 297],
      16: [204, 290],
    },
  },
  {
    key: 'G',
    label: 'G',
    theme: 'Identity · Direction · Love',
    shape: 'diamond',
    cx: 250,
    cy: 372,
    size: 108,
    gates: [7, 1, 13, 25, 10, 15, 46, 2],
    gateAnchors: {
      7: [218, 340],
      1: [250, 322],
      13: [282, 340],
      25: [298, 372],
      10: [282, 404],
      15: [218, 404],
      46: [202, 372],
      2: [250, 322],
    },
  },
  {
    key: 'Heart',
    label: 'Heart',
    theme: 'Willpower · Ego',
    shape: 'triLeft',
    cx: 340,
    cy: 398,
    size: 70,
    gates: [21, 40, 26, 51],
    gateAnchors: {
      21: [326, 372],
      40: [362, 398],
      26: [326, 412],
      51: [320, 420],
    },
  },
  {
    key: 'SolarPlexus',
    label: 'Solar Plexus',
    theme: 'Emotion · Feeling',
    shape: 'triLeft',
    cx: 418,
    cy: 442,
    size: 118,
    gates: [36, 22, 37, 6, 49, 55, 30],
    gateAnchors: {
      36: [388, 388],
      22: [408, 398],
      37: [388, 414],
      6: [460, 442],
      49: [388, 470],
      55: [408, 484],
      30: [388, 494],
    },
  },
  {
    key: 'Sacral',
    label: 'Sacral',
    theme: 'Life-force · Sexuality',
    shape: 'square',
    cx: 250,
    cy: 510,
    size: 120,
    gates: [34, 5, 14, 29, 59, 9, 3, 42, 27],
    gateAnchors: {
      34: [198, 472],
      5: [224, 466],
      14: [250, 464],
      29: [276, 466],
      59: [302, 472],
      9: [302, 510],
      3: [302, 548],
      42: [276, 552],
      27: [250, 554],
    },
  },
  {
    key: 'Spleen',
    label: 'Spleen',
    theme: 'Intuition · Survival',
    shape: 'triRight',
    cx: 110,
    cy: 450,
    size: 118,
    gates: [48, 57, 44, 50, 32, 28, 18],
    gateAnchors: {
      48: [140, 400],
      57: [124, 418],
      44: [140, 432],
      50: [70, 450],
      32: [140, 466],
      28: [124, 484],
      18: [140, 500],
    },
  },
  {
    key: 'Root',
    label: 'Root',
    theme: 'Pressure · Adrenaline',
    shape: 'square',
    cx: 250,
    cy: 628,
    size: 108,
    gates: [58, 38, 54, 53, 60, 52, 19, 39, 41],
    gateAnchors: {
      58: [204, 590],
      38: [222, 584],
      54: [240, 580],
      53: [260, 580],
      60: [278, 584],
      52: [296, 590],
      19: [296, 628],
      39: [296, 668],
      41: [204, 668],
    },
  },
];

const CENTER_BY_KEY: Record<string, CenterDef> = CENTERS.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<string, CenterDef>,
);

// Map gate → centre key for fast lookup.
const GATE_TO_CENTER: Record<number, CenterKey> = (() => {
  const m: Record<number, CenterKey> = {} as Record<number, CenterKey>;
  for (const c of CENTERS) for (const g of c.gates) m[g] = c.key;
  return m;
})();

// ─── Channels ───────────────────────────────────────────────────────────────

type ChannelDef = {
  a: number;
  b: number;
  name: string;
};

const CHANNELS: ChannelDef[] = [
  { a: 1, b: 8, name: 'Inspiration' },
  { a: 2, b: 14, name: 'The Beat' },
  { a: 3, b: 60, name: 'Mutation' },
  { a: 4, b: 63, name: 'Logic' },
  { a: 5, b: 15, name: 'Rhythm' },
  { a: 6, b: 59, name: 'Mating' },
  { a: 7, b: 31, name: 'The Alpha' },
  { a: 9, b: 52, name: 'Concentration' },
  { a: 10, b: 20, name: 'Awakening' },
  { a: 10, b: 34, name: 'Exploration' },
  { a: 10, b: 57, name: 'Perfected Form' },
  { a: 11, b: 56, name: 'Curiosity' },
  { a: 12, b: 22, name: 'Openness' },
  { a: 13, b: 33, name: 'The Prodigal' },
  { a: 16, b: 48, name: 'The Wavelength' },
  { a: 17, b: 62, name: 'Acceptance' },
  { a: 18, b: 58, name: 'Judgement' },
  { a: 19, b: 49, name: 'Synthesis' },
  { a: 20, b: 34, name: 'Charisma' },
  { a: 20, b: 57, name: 'The Brainwave' },
  { a: 21, b: 45, name: 'The Money Line' },
  { a: 23, b: 43, name: 'Structuring' },
  { a: 24, b: 61, name: 'Awareness' },
  { a: 25, b: 51, name: 'Initiation' },
  { a: 26, b: 44, name: 'Surrender' },
  { a: 27, b: 50, name: 'Preservation' },
  { a: 28, b: 38, name: 'Struggle' },
  { a: 29, b: 46, name: 'Discovery' },
  { a: 30, b: 41, name: 'Recognition' },
  { a: 32, b: 54, name: 'Transformation' },
  { a: 34, b: 57, name: 'Power' },
  { a: 35, b: 36, name: 'Transitoriness' },
  { a: 37, b: 40, name: 'Community' },
  { a: 39, b: 55, name: 'Emoting' },
  { a: 42, b: 53, name: 'Maturation' },
  { a: 47, b: 64, name: 'Abstraction' },
];

// ─── Gate themes (brief, one-line) ──────────────────────────────────────────
const GATE_NAMES: Record<number, { name: string; theme: string }> = {
  1: { name: 'Self-Expression', theme: 'The Creative' },
  2: { name: 'Higher Self', theme: 'The Receptive' },
  3: { name: 'Ordering', theme: 'Difficulty at the Beginning' },
  4: { name: 'Formulisation', theme: 'Youthful Folly' },
  5: { name: 'Fixed Rhythms', theme: 'Waiting' },
  6: { name: 'Friction', theme: 'Conflict' },
  7: { name: 'The Role of Self', theme: 'The Army' },
  8: { name: 'Contribution', theme: 'Holding Together' },
  9: { name: 'Focus', theme: 'The Taming Power of the Small' },
  10: { name: 'Behaviour of the Self', theme: 'Treading' },
  11: { name: 'Ideas', theme: 'Peace' },
  12: { name: 'Caution', theme: 'Standstill' },
  13: { name: 'The Listener', theme: 'Fellowship' },
  14: { name: 'Power Skills', theme: 'Possession in Great Measure' },
  15: { name: 'Extremes', theme: 'Modesty' },
  16: { name: 'Skills', theme: 'Enthusiasm' },
  17: { name: 'Opinions', theme: 'Following' },
  18: { name: 'Correction', theme: 'Work on the Decayed' },
  19: { name: 'Wanting', theme: 'Approach' },
  20: { name: 'The Now', theme: 'Contemplation' },
  21: { name: 'Control', theme: 'Biting Through' },
  22: { name: 'Openness', theme: 'Grace' },
  23: { name: 'Assimilation', theme: 'Splitting Apart' },
  24: { name: 'Rationalisation', theme: 'Returning' },
  25: { name: 'Innocence', theme: 'The Spirit of the Self' },
  26: { name: 'The Egoist', theme: 'The Taming Power of the Great' },
  27: { name: 'Caring', theme: 'Nourishment' },
  28: { name: 'The Game-Player', theme: 'Preponderance of the Great' },
  29: { name: 'Perseverance', theme: 'The Abysmal' },
  30: { name: 'Feelings', theme: 'The Clinging Fire' },
  31: { name: 'Influence', theme: 'Leadership' },
  32: { name: 'Continuity', theme: 'Duration' },
  33: { name: 'Privacy', theme: 'Retreat' },
  34: { name: 'Power', theme: 'The Power of the Great' },
  35: { name: 'Change', theme: 'Progress' },
  36: { name: 'Crisis', theme: 'Darkening of the Light' },
  37: { name: 'Friendship', theme: 'The Family' },
  38: { name: 'The Fighter', theme: 'Opposition' },
  39: { name: 'Provocation', theme: 'Obstruction' },
  40: { name: 'Aloneness', theme: 'Deliverance' },
  41: { name: 'Contraction', theme: 'Decrease' },
  42: { name: 'Growth', theme: 'Increase' },
  43: { name: 'Insight', theme: 'Breakthrough' },
  44: { name: 'Alertness', theme: 'Coming to Meet' },
  45: { name: 'The Gatherer', theme: 'Gathering Together' },
  46: { name: 'Determination', theme: 'Pushing Upward' },
  47: { name: 'Realising', theme: 'Oppression' },
  48: { name: 'Depth', theme: 'The Well' },
  49: { name: 'Revolution', theme: 'Revolution' },
  50: { name: 'Values', theme: 'The Cauldron' },
  51: { name: 'Shock', theme: 'The Arousing' },
  52: { name: 'Stillness', theme: 'Keeping Still' },
  53: { name: 'Beginnings', theme: 'Development' },
  54: { name: 'Ambition', theme: 'The Marrying Maiden' },
  55: { name: 'Spirit', theme: 'Abundance' },
  56: { name: 'The Storyteller', theme: 'The Wanderer' },
  57: { name: 'Intuitive Clarity', theme: 'The Gentle' },
  58: { name: 'Vitality', theme: 'The Joyous' },
  59: { name: 'Intimacy', theme: 'Dispersion' },
  60: { name: 'Acceptance', theme: 'Limitation' },
  61: { name: 'Mystery', theme: 'Inner Truth' },
  62: { name: 'Detail', theme: 'Preponderance of the Small' },
  63: { name: 'Doubt', theme: 'After Completion' },
  64: { name: 'Confusion', theme: 'Before Completion' },
};

// ─── Shape geometry helpers ─────────────────────────────────────────────────

function shapePoints(def: CenterDef): string {
  const { shape, cx, cy, size } = def;
  const h = size / 2;
  if (shape === 'triUp') {
    return `${cx},${cy - h} ${cx - h},${cy + h} ${cx + h},${cy + h}`;
  }
  if (shape === 'triDown') {
    return `${cx - h},${cy - h} ${cx + h},${cy - h} ${cx},${cy + h}`;
  }
  if (shape === 'diamond') {
    return `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`;
  }
  if (shape === 'square') {
    return `${cx - h},${cy - h} ${cx + h},${cy - h} ${cx + h},${cy + h} ${cx - h},${cy + h}`;
  }
  if (shape === 'triRight') {
    // points to the right
    return `${cx - h},${cy - h} ${cx + h},${cy} ${cx - h},${cy + h}`;
  }
  // triLeft — points to the left
  return `${cx + h},${cy - h} ${cx - h},${cy} ${cx + h},${cy + h}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

type Tooltip = {
  x: number;
  y: number;
  title: string;
  subtitle?: string;
} | null;

export default function BodyGraphInteractive({
  hdResult,
  onCenterClick,
}: BodyGraphInteractiveProps) {
  const activatedGates = useMemo(
    () => new Set(hdResult.activatedGates ?? []),
    [hdResult.activatedGates],
  );

  // A centre is "defined" if any channel with both endpoints activated lands on it.
  const definedCenters = useMemo(() => {
    const set = new Set<CenterKey>();
    for (const ch of CHANNELS) {
      if (activatedGates.has(ch.a) && activatedGates.has(ch.b)) {
        const ca = GATE_TO_CENTER[ch.a];
        const cb = GATE_TO_CENTER[ch.b];
        if (ca) set.add(ca);
        if (cb) set.add(cb);
      }
    }
    return set;
  }, [activatedGates]);

  const [hoveredCenter, setHoveredCenter] = useState<CenterKey | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<number | null>(null);
  const [pulsedCenter, setPulsedCenter] = useState<CenterKey | null>(null);
  const [flashedGate, setFlashedGate] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', onChange);
    // trigger mount-in animations on next frame
    const id = requestAnimationFrame(() => setMounted(true));
    return () => {
      mq.removeEventListener?.('change', onChange);
      cancelAnimationFrame(id);
    };
  }, []);

  // ─ Pointer helpers ─
  function centerOf(def: CenterDef): [number, number] {
    return [def.cx, def.cy];
  }

  function handleCenterEnter(def: CenterDef, e: React.PointerEvent) {
    setHoveredCenter(def.key);
    const rect = wrapperRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    const status = definedCenters.has(def.key) ? 'Defined' : 'Undefined';
    setTooltip({ x, y, title: `${def.label}`, subtitle: `${def.theme} · ${status}` });
  }

  function handleCenterLeave() {
    setHoveredCenter(null);
    setTooltip(null);
  }

  function handleCenterClick(def: CenterDef) {
    setPulsedCenter(def.key);
    onCenterClick?.(def.key);
    if (!reducedMotion) {
      window.setTimeout(() => setPulsedCenter(null), 900);
    } else {
      setPulsedCenter(null);
    }
  }

  function handleChannelEnter(idx: number, ch: ChannelDef, e: React.PointerEvent) {
    setHoveredChannel(idx);
    const rect = wrapperRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setTooltip({
      x,
      y,
      title: `Channel ${ch.a}–${ch.b}`,
      subtitle: ch.name,
    });
  }

  function handleChannelLeave() {
    setHoveredChannel(null);
    setTooltip(null);
  }

  function handleGateEnter(gate: number, e: React.PointerEvent) {
    const meta = GATE_NAMES[gate];
    if (!meta) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setTooltip({ x, y, title: `Gate ${gate} · ${meta.name}`, subtitle: meta.theme });
  }

  function handleGateLeave() {
    setTooltip(null);
  }

  function handleGateClick(gate: number) {
    if (!activatedGates.has(gate)) return;
    setFlashedGate(gate);
    if (!reducedMotion) {
      window.setTimeout(() => setFlashedGate(null), 700);
    } else {
      setFlashedGate(null);
    }
  }

  // Stagger order for mount-in reveal (top → bottom).
  const centerOrder: CenterKey[] = [
    'Head',
    'Ajna',
    'Throat',
    'G',
    'Heart',
    'SolarPlexus',
    'Spleen',
    'Sacral',
    'Root',
  ];
  const orderIndex: Record<CenterKey, number> = centerOrder.reduce(
    (acc, k, i) => {
      acc[k] = i;
      return acc;
    },
    {} as Record<CenterKey, number>,
  );

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 540,
        margin: '0 auto',
        color: 'var(--ink)',
      }}
    >
      <svg
        viewBox="0 0 500 700"
        role="img"
        aria-label="Human Design BodyGraph"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          background: 'transparent',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="bg-brass-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ─── Body silhouette (behind everything) ──────────────────────
           A stylised front-view human figure underlaid behind the
           canonical HD geometry. Outline-only, faint stroke — the
           triangles, squares, and diamonds for the nine centres now
           visibly sit ON a body instead of floating in space, which
           was the user's "make it a realistic person" ask. */}
        <g
          aria-hidden="true"
          fill="none"
          stroke="rgba(252, 250, 246, 0.13)"
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Torso + head + legs */}
          <path d="
            M 250 14
            C 285 14 305 36 305 70
            C 305 100 290 122 275 130
            L 275 142
            C 305 148 332 162 350 182
            L 362 240
            L 368 320
            L 364 400
            C 364 432 358 452 350 466
            L 354 580
            C 354 620 348 670 340 700
            L 296 700
            L 286 596
            L 268 470
            L 250 470
            L 232 470
            L 214 596
            L 204 700
            L 160 700
            C 152 670 146 620 146 580
            L 150 466
            C 142 452 136 432 136 400
            L 132 320
            L 138 240
            L 150 182
            C 168 162 195 148 225 142
            L 225 130
            C 210 122 195 100 195 70
            C 195 36 215 14 250 14
            Z
          " />
          {/* Arms */}
          <path d="
            M 148 198
            C 116 220 96 262 88 312
            L 82 400
            C 80 442 84 480 92 522
            L 100 522
            L 98 482
            L 102 400
            C 110 362 122 280 148 222
          " />
          <path d="
            M 352 198
            C 384 220 404 262 412 312
            L 418 400
            C 420 442 416 480 408 522
            L 400 522
            L 402 482
            L 398 400
            C 390 362 378 280 352 222
          " />
          {/* Faint spine guide — dashed */}
          <line
            x1={250} y1={140} x2={250} y2={600}
            stroke="rgba(252, 250, 246, 0.06)"
            strokeDasharray="3 8"
          />
        </g>

        {/* ─── Channels layer (behind centres) ─── */}
        <g>
          {CHANNELS.map((ch, i) => {
            const ca = CENTER_BY_KEY[GATE_TO_CENTER[ch.a]];
            const cb = CENTER_BY_KEY[GATE_TO_CENTER[ch.b]];
            if (!ca || !cb) return null;
            const ga = ca.gateAnchors[ch.a];
            const gb = cb.gateAnchors[ch.b];
            if (!ga || !gb) return null;
            const defined =
              activatedGates.has(ch.a) && activatedGates.has(ch.b);
            const hovered = hoveredChannel === i;
            const opacity = defined ? (hovered ? 1 : 0.92) : hovered ? 0.4 : 0.08;
            const stroke = defined ? '#C8A052' : 'rgba(200,160,82,0.6)';
            const width = defined ? (hovered ? 2.4 : 1.6) : hovered ? 1.4 : 0.8;
            const drawDelay = reducedMotion ? 0 : 0.4 + (i % 12) * 0.04;
            return (
              <g key={`ch-${i}`}>
                {/* Invisible fat stroke for easy hover */}
                <line
                  x1={ga[0]}
                  y1={ga[1]}
                  x2={gb[0]}
                  y2={gb[1]}
                  stroke="transparent"
                  strokeWidth={10}
                  style={{ cursor: 'pointer' }}
                  onPointerEnter={(e) => handleChannelEnter(i, ch, e)}
                  onPointerLeave={handleChannelLeave}
                />
                <line
                  x1={ga[0]}
                  y1={ga[1]}
                  x2={gb[0]}
                  y2={gb[1]}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeLinecap="round"
                  opacity={opacity}
                  style={{
                    transition:
                      'opacity 320ms ease, stroke-width 320ms ease, stroke 320ms ease',
                    strokeDasharray: mounted || reducedMotion ? 'none' : '600',
                    strokeDashoffset: mounted || reducedMotion ? 0 : 600,
                    transitionDelay: mounted ? `${drawDelay}s` : '0s',
                  }}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </g>

        {/* ─── Centres ─── */}
        <g>
          {CENTERS.map((c) => {
            const isDefined = definedCenters.has(c.key);
            const isHovered = hoveredCenter === c.key;
            const isPulsed = pulsedCenter === c.key;
            // Also highlight if a hovered channel touches this centre.
            let channelTouch = false;
            if (hoveredChannel !== null) {
              const ch = CHANNELS[hoveredChannel];
              if (
                GATE_TO_CENTER[ch.a] === c.key ||
                GATE_TO_CENTER[ch.b] === c.key
              ) {
                channelTouch = true;
              }
            }
            const fill = isDefined
              ? isHovered || channelTouch
                ? 'rgba(200,160,82,0.18)'
                : 'rgba(200,160,82,0.08)'
              : isHovered || channelTouch
                ? 'rgba(200,160,82,0.05)'
                : 'transparent';
            const strokeOpacity = isHovered || channelTouch ? 1 : 0.55;
            const delay = reducedMotion ? 0 : orderIndex[c.key] * 0.06;
            return (
              <g
                key={c.key}
                style={{
                  opacity: mounted || reducedMotion ? 1 : 0,
                  transform:
                    mounted || reducedMotion
                      ? 'translateY(0)'
                      : 'translateY(8px)',
                  transition:
                    'opacity 700ms cubic-bezier(.2,.7,.3,1), transform 700ms cubic-bezier(.2,.7,.3,1)',
                  transitionDelay: `${delay}s`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              >
                <polygon
                  points={shapePoints(c)}
                  fill={fill}
                  stroke="#C8A052"
                  strokeOpacity={strokeOpacity}
                  strokeWidth={isPulsed ? 2 : 1}
                  style={{
                    cursor: 'pointer',
                    transition:
                      'fill 320ms ease, stroke-opacity 320ms ease, stroke-width 320ms ease',
                    filter: isPulsed ? 'url(#bg-brass-glow)' : 'none',
                  }}
                  onPointerEnter={(e) => handleCenterEnter(c, e)}
                  onPointerMove={(e) => {
                    // keep tooltip following pointer
                    const rect = wrapperRef.current?.getBoundingClientRect();
                    const x = rect ? e.clientX - rect.left : e.clientX;
                    const y = rect ? e.clientY - rect.top : e.clientY;
                    setTooltip((t) => (t ? { ...t, x, y } : t));
                  }}
                  onPointerLeave={handleCenterLeave}
                  onClick={() => handleCenterClick(c)}
                />
                {/* Centre label (mono eyebrow) */}
                <text
                  x={centerOf(c)[0]}
                  y={centerOf(c)[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 7,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fill: isDefined ? '#C8A052' : 'rgba(200,160,82,0.55)',
                  }}
                >
                  {c.label.toUpperCase()}
                </text>

                {/* Gate numbers */}
                {c.gates.map((g) => {
                  const anchor = c.gateAnchors[g];
                  if (!anchor) return null;
                  const isOn = activatedGates.has(g);
                  const isFlashed = flashedGate === g;
                  return (
                    <g key={`g-${g}`} pointerEvents="all">
                      {isOn && (
                        <circle
                          cx={anchor[0]}
                          cy={anchor[1]}
                          r={isFlashed ? 7 : 4.5}
                          fill="rgba(200,160,82,0.18)"
                          stroke="#C8A052"
                          strokeWidth={0.8}
                          style={{
                            transition:
                              'r 320ms cubic-bezier(.2,.7,.3,1), fill 320ms ease',
                            animation:
                              !reducedMotion && isOn
                                ? 'bg-gate-pulse 3.6s ease-in-out infinite'
                                : 'none',
                          }}
                        />
                      )}
                      <text
                        x={anchor[0]}
                        y={anchor[1] + 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        onPointerEnter={(e) => handleGateEnter(g, e)}
                        onPointerLeave={handleGateLeave}
                        onClick={() => handleGateClick(g)}
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 7.5,
                          fontWeight: isOn ? 500 : 400,
                          fill: isOn ? '#FCFAF6' : 'rgba(200,160,82,0.28)',
                          cursor: isOn ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        {g}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: tooltip.x + 14,
            top: tooltip.y + 10,
            pointerEvents: 'none',
            background: 'rgba(10,14,26,0.92)',
            border: '1px solid rgba(200,160,82,0.45)',
            padding: '8px 12px',
            maxWidth: 240,
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#C8A052',
              marginBottom: 3,
            }}
          >
            {tooltip.title}
          </div>
          {tooltip.subtitle && (
            <div
              style={{
                fontFamily: "'Hanken Grotesk', serif",
                fontStyle: 'italic',
                fontSize: 13,
                color: '#CFC5B1',
                lineHeight: 1.35,
              }}
            >
              {tooltip.subtitle}
            </div>
          )}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes bg-gate-pulse {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(200,160,82,0)); }
          50% { filter: drop-shadow(0 0 3px rgba(200,160,82,0.55)); }
        }
        @media (prefers-reduced-motion: reduce) {
          svg [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
