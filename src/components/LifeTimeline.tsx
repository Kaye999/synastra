'use client';
// LifeTimeline — horizontal scrollable timeline of every major / medium /
// minor transit across the user's life. The "Spotify Wrapped for your
// life" surface: users see the peaks of their past, pin life events, and
// triangulate against real moments to validate the system. Future builds
// the same engine into AI life-narrative synthesis.
//
// Scaffold scope:
//   - Mock transit generator (real planet periods, realistic potency
//     distribution, no live ephemeris).
//   - Horizontal SVG render, color-coded by planet, height = potency.
//   - Major / Medium / Minor filter chips.
//   - Tier-aware date range (free=±2yr, reader=±10yr, depth+=full life).
//   - Click a bar → modal showing the cross-tradition enrichment
//     (real call to src/lib/transit/cross-tradition.ts).
//
// Next-build:
//   - Replace mock generator with the real outer-transit detector
//     (detectSignificantTransits over the user's life span).
//   - Persist pinned life events to a supabase table (astral.life_events).
//   - AI narrative synthesis for The Nine tier (separate route).

import { useMemo, useState } from 'react';
import type { BirthData, Mahadasha } from '@/lib/types';
import type { Tier } from '@/lib/tiers';
import type { DetectedTransit, AspectName } from '@/lib/prompts/transit-detector';
import { enrichTransit, type CrossTraditionEnrichment } from '@/lib/transit/cross-tradition';

/* ============================================================
 * Types & constants
 * ============================================================ */

type TimelineTransit = DetectedTransit & {
  potency: number;
  potencyTier: 'major' | 'medium' | 'minor';
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#E6B450',
  Moon: '#B5C9DD',
  Mercury: '#9CB380',
  Venus: '#D7A6B4',
  Mars: '#C9533D',
  Jupiter: '#C8A052',
  Saturn: '#8A7553',
  Uranus: '#7BB5C8',
  Neptune: '#5E72A4',
  Pluto: '#6F4F66',
};

const FILTER_LABEL: Record<'major' | 'medium' | 'minor', string> = {
  major: 'Major (80+)',
  medium: 'Medium (50–79)',
  minor: 'Minor (30–49)',
};

const TIER_RANGE_YEARS: Record<Tier, { back: number; forward: number; label: string }> = {
  free:   { back: 2,  forward: 2,  label: 'The Two — ±2 years' },
  reader: { back: 10, forward: 10, label: 'The Five — ±10 years' },
  depth:  { back: 100, forward: 50, label: 'The Seven — full life timeline' },
  master: { back: 100, forward: 50, label: 'The Nine — full life + AI narrative' },
};

/* ============================================================
 * Mock transit generator
 *
 * Real planet synodic periods are used so the bar density is correct
 * (Saturn returns ~29.5yr, Jupiter ~12yr, etc.). The exact dates are
 * jittered randomly within the cycle so each user sees a different
 * timeline. Potency is computed from aspect × planet weight (loose
 * mirror of scorePotency in /api/reading/transit-alerts/route.ts).
 *
 * TODO: replace with detectSignificantTransits run over [birth, end].
 * ============================================================ */

const ASPECTS: AspectName[] = ['conjunction', 'opposition', 'square', 'trine', 'sextile'];
const TARGETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'ASC', 'MC'];

const PLANET_CYCLES: { planet: string; periodYears: number; weight: number }[] = [
  { planet: 'Pluto',   periodYears: 248,  weight: 1.0  },
  { planet: 'Neptune', periodYears: 165,  weight: 0.92 },
  { planet: 'Uranus',  periodYears: 84,   weight: 0.85 },
  { planet: 'Saturn',  periodYears: 29.5, weight: 0.78 },
  { planet: 'Jupiter', periodYears: 12,   weight: 0.62 },
];

const ASPECT_WEIGHT: Record<AspectName, number> = {
  conjunction: 1.0,
  opposition: 0.92,
  square: 0.85,
  trine: 0.55,
  sextile: 0.40,
};

function seedRandom(seed: number): () => number {
  // Mulberry32 — deterministic so the same user sees the same timeline
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateMockTransits(birthDate: Date, endDate: Date, userId: string): TimelineTransit[] {
  const rand = seedRandom(hashSeed(userId + birthDate.toISOString()));
  const out: TimelineTransit[] = [];
  const spanMs = endDate.getTime() - birthDate.getTime();
  const spanYears = spanMs / (365.25 * 86400 * 1000);

  for (const cycle of PLANET_CYCLES) {
    // Number of expected transit hits across the span = roughly
    // 4 aspect families per cycle × (spanYears / cycle period).
    const expected = Math.max(2, Math.floor((spanYears / cycle.periodYears) * 8));
    for (let i = 0; i < expected; i++) {
      const t = rand();
      const exact = new Date(birthDate.getTime() + t * spanMs);
      const aspect = ASPECTS[Math.floor(rand() * ASPECTS.length)];
      const target = TARGETS[Math.floor(rand() * TARGETS.length)];
      const targetWeight = target === 'Sun' || target === 'Moon' || target === 'ASC' ? 1.0
                         : target === 'MC' ? 0.96
                         : target === 'Mars' ? 0.82
                         : target === 'Venus' ? 0.78
                         : 0.74;
      const orb = +(rand() * 1.5).toFixed(2);
      const orbTight = 1 - (orb / 1.5) * 0.65;
      const raw = ASPECT_WEIGHT[aspect] * cycle.weight * targetWeight * orbTight * 100;
      const potency = Math.max(0, Math.min(100, Math.round(raw)));
      const potencyTier: TimelineTransit['potencyTier'] =
        potency >= 80 ? 'major' : potency >= 50 ? 'medium' : 'minor';
      // Skip the lowest-potency noise to keep the chart readable
      if (potency < 30) continue;
      const orbEnter = new Date(exact.getTime() - 30 * 86400 * 1000);
      const orbExit = new Date(exact.getTime() + 30 * 86400 * 1000);
      out.push({
        planet: cycle.planet,
        aspect,
        target,
        exactDate: exact.toISOString(),
        orb,
        orbEnterDate: orbEnter.toISOString(),
        orbExitDate: orbExit.toISOString(),
        kind: 'outer-to-personal',
        potency,
        potencyTier,
      });
    }
  }
  return out.sort((a, b) => a.exactDate.localeCompare(b.exactDate));
}

/* ============================================================
 * Component
 * ============================================================ */

type Props = {
  userId: string;
  birthData: BirthData;
  tier: Tier;
};

export default function LifeTimeline({ userId, birthData, tier }: Props) {
  const birthDate = useMemo(
    () => new Date(birthData.dob.y, birthData.dob.m - 1, birthData.dob.d),
    [birthData],
  );
  const today = useMemo(() => new Date(), []);
  const range = TIER_RANGE_YEARS[tier];

  // Clamp the visible window by tier
  const windowStart = useMemo(() => {
    const earliest = birthDate;
    const tierBack = new Date(today.getTime() - range.back * 365.25 * 86400 * 1000);
    return tierBack > earliest ? tierBack : earliest;
  }, [birthDate, today, range.back]);

  const windowEnd = useMemo(() => {
    return new Date(today.getTime() + range.forward * 365.25 * 86400 * 1000);
  }, [today, range.forward]);

  // Generate the full life span once, then filter to the visible window
  const allTransits = useMemo(
    () => generateMockTransits(birthDate, new Date(today.getTime() + 50 * 365.25 * 86400 * 1000), userId),
    [birthDate, today, userId],
  );

  const [activeFilters, setActiveFilters] = useState<{ major: boolean; medium: boolean; minor: boolean }>(
    { major: true, medium: true, minor: false },
  );
  const [selected, setSelected] = useState<TimelineTransit | null>(null);

  const visible = useMemo(() => {
    return allTransits.filter((t) => {
      const d = new Date(t.exactDate);
      if (d < windowStart || d > windowEnd) return false;
      return activeFilters[t.potencyTier];
    });
  }, [allTransits, windowStart, windowEnd, activeFilters]);

  // SVG layout
  const WIDTH_PER_YEAR = 80; // px
  const HEIGHT = 320;
  const PADDING = { top: 32, right: 32, bottom: 60, left: 32 };
  const totalYears = (windowEnd.getTime() - windowStart.getTime()) / (365.25 * 86400 * 1000);
  const svgWidth = Math.max(900, totalYears * WIDTH_PER_YEAR + PADDING.left + PADDING.right);
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  function xFor(d: Date) {
    const t = (d.getTime() - windowStart.getTime()) / (windowEnd.getTime() - windowStart.getTime());
    return PADDING.left + t * (svgWidth - PADDING.left - PADDING.right);
  }
  function yFor(potency: number) {
    return PADDING.top + (1 - potency / 100) * innerHeight;
  }
  function heightFor(potency: number) {
    return (potency / 100) * innerHeight;
  }

  // Year ticks every N years (denser for tighter windows)
  const tickInterval = totalYears > 50 ? 10 : totalYears > 20 ? 5 : totalYears > 5 ? 1 : 1;
  const ticks: number[] = [];
  const startYear = windowStart.getFullYear();
  const endYear = windowEnd.getFullYear();
  for (let y = Math.ceil(startYear / tickInterval) * tickInterval; y <= endYear; y += tickInterval) {
    ticks.push(y);
  }

  // Cross-tradition enrichment (computed on selection)
  const enrichment: CrossTraditionEnrichment | null = useMemo(() => {
    if (!selected) return null;
    // mahadasha left undefined here — wire in when natal Moon sidereal
    // longitude is available on the profile (cheap follow-up).
    const maha: Mahadasha | undefined = undefined;
    return enrichTransit({ transit: selected, userId, mahadasha: maha });
  }, [selected, userId]);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-base, #0A0E1A)', color: 'var(--ink, #EAE6DC)', padding: '80px 24px 120px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="mk-eyebrow" style={{ marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--brass, #C8A052)' }}>
            § Your Sky · Life Timeline
          </div>
          <h1 style={{ fontFamily: "'Alice', serif", fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 16px' }}>
            Every transit, your whole life.
          </h1>
          <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontStyle: 'italic', fontSize: 18, color: 'var(--ink-dim, #9994a0)', maxWidth: '52ch', margin: '0 auto', lineHeight: 1.5 }}>
            Look back. The peaks line up with the moments you remember. Tap any bar to read it through four traditions.
          </p>
          <div style={{ marginTop: 16, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--brass-soft, #8A7553)' }}>
            Window: {range.label}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {(['major', 'medium', 'minor'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActiveFilters((f) => ({ ...f, [k]: !f[k] }))}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                border: `1px solid ${activeFilters[k] ? 'var(--brass, #C8A052)' : 'rgba(200, 160, 82, 0.25)'}`,
                background: activeFilters[k] ? 'rgba(200, 160, 82, 0.12)' : 'transparent',
                color: activeFilters[k] ? 'var(--brass, #C8A052)' : 'var(--ink-dim, #9994a0)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {FILTER_LABEL[k]}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(200, 160, 82, 0.15)',
          borderRadius: 12,
          padding: '12px 0',
        }}>
          <svg width={svgWidth} height={HEIGHT} style={{ display: 'block' }}>
            {/* Year ticks */}
            {ticks.map((y) => {
              const d = new Date(y, 0, 1);
              if (d < windowStart || d > windowEnd) return null;
              const x = xFor(d);
              return (
                <g key={y}>
                  <line x1={x} x2={x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="rgba(200, 160, 82, 0.06)" strokeWidth={1} />
                  <text x={x} y={HEIGHT - PADDING.bottom + 20} fill="var(--ink-dim, #9994a0)" fontSize={10} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.12em">
                    {y}
                  </text>
                </g>
              );
            })}

            {/* Birth marker */}
            {birthDate >= windowStart && birthDate <= windowEnd && (
              <g>
                <line x1={xFor(birthDate)} x2={xFor(birthDate)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="rgba(214, 184, 114, 0.5)" strokeWidth={1.5} strokeDasharray="3 4" />
                <text x={xFor(birthDate)} y={PADDING.top - 8} fill="var(--brass, #C8A052)" fontSize={9} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.18em">
                  BIRTH
                </text>
              </g>
            )}

            {/* Today marker */}
            {today >= windowStart && today <= windowEnd && (
              <g>
                <line x1={xFor(today)} x2={xFor(today)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="rgba(214, 184, 114, 0.85)" strokeWidth={2} />
                <circle cx={xFor(today)} cy={PADDING.top} r={4} fill="var(--brass, #C8A052)" />
                <text x={xFor(today)} y={PADDING.top - 8} fill="var(--brass, #C8A052)" fontSize={9} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.18em">
                  NOW
                </text>
              </g>
            )}

            {/* Transit bars */}
            {visible.map((t, i) => {
              const d = new Date(t.exactDate);
              const x = xFor(d);
              const h = heightFor(t.potency);
              const y = HEIGHT - PADDING.bottom - h;
              const color = PLANET_COLORS[t.planet] || '#888';
              const isSelected = selected?.exactDate === t.exactDate;
              return (
                <g
                  key={`${t.planet}-${t.exactDate}-${i}`}
                  onClick={() => setSelected(t)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={x - 2}
                    y={y}
                    width={4}
                    height={h}
                    fill={color}
                    opacity={isSelected ? 1 : 0.78}
                    rx={1.5}
                  />
                  {/* Hover/selected halo */}
                  {isSelected && (
                    <rect x={x - 6} y={y - 4} width={12} height={h + 8} fill={color} opacity={0.18} rx={3} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-dim, #9994a0)' }}>
          {PLANET_CYCLES.map((p) => (
            <span key={p.planet} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: PLANET_COLORS[p.planet] }} />
              {p.planet}
            </span>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: 48, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, fontStyle: 'italic', color: 'var(--ink-dim, #9994a0)', maxWidth: '52ch', margin: '48px auto 0' }}>
          Scaffold preview · transits are placeholder data anchored to real planetary cycles. Click any bar to see the cross-tradition reading engine in action.
        </div>
      </div>

      {/* Modal: cross-tradition enrichment */}
      {selected && enrichment && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 100,
            overflow: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 720,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              background: 'var(--bg-base, #0A0E1A)',
              border: '1px solid var(--brass, #C8A052)',
              borderRadius: 12,
              padding: '40px 32px',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--brass, #C8A052)', marginBottom: 8 }}>
                  {selected.potencyTier} · {selected.potency}/100
                </div>
                <h2 style={{ fontFamily: "'Alice', serif", fontSize: 28, lineHeight: 1.15, fontWeight: 600, margin: 0 }}>
                  {selected.planet} {selected.aspect} {selected.target}
                </h2>
                <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: 'var(--ink-dim, #9994a0)', marginTop: 6 }}>
                  {new Date(selected.exactDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-dim, #9994a0)', fontSize: 28, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
            </div>

            {(['western', 'vedic', 'tarot', 'astrocartography'] as const).map((key) => {
              const panel = enrichment[key];
              return (
                <div key={key} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(200, 160, 82, 0.12)' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--brass-soft, #8A7553)', marginBottom: 8 }}>
                    {key === 'astrocartography' ? 'Astrocartography' : key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <h3 style={{ fontFamily: "'Alice', serif", fontSize: 18, fontWeight: 600, margin: '0 0 10px' }}>
                    {panel.headline}
                  </h3>
                  <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 15, lineHeight: 1.65, color: 'var(--ink, #EAE6DC)', margin: 0 }}>
                    {panel.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
