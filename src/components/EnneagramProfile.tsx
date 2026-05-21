"use client";

// EnneagramProfile — result display for a scored Enneagram assessment.
//
// Interactive surfaces:
//   1. Wing toggle — two pill buttons let the reader explore either adjacent
//      wing body; the server's selection is still reflected as "(your score)"
//      but either panel is browseable. Crossfade + slight rise on switch.
//   2. Enneagram diagram — a 9-point ring with the canonical internal
//      triangle (3-6-9) and hexagon (1-4-2-8-5-7). The primary type is
//      highlighted in brass; integration + disintegration arrows tint green
//      and ember respectively. Clicking a destination node reveals that
//      type's description below the diagram.
//   3. Accordion — Shadow · Gift · In health · In stress · With others.
//      Only one panel is open at a time; opening is a max-height + opacity
//      transition, both reduced-motion-safe.
//   4. Streaming CTA — POSTs to /api/reading/enneagram and streams the SSE
//      response into a body pane. Preserves formatting paragraph-by-paragraph.
//
// All animations respect `prefers-reduced-motion`.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EnneagramResult, EnneagramType } from '@/lib/engines/enneagram';
import {
  ENNEAGRAM_TYPES,
  centerLabel,
  formatWingLabel,
  levelBand,
  type EnneagramTypeProfile,
} from '@/lib/interp/enneagram-types';

/* ============================================================
 * Props + utilities
 * ============================================================ */

export type EnneagramProfileProps = {
  result: EnneagramResult;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  return !!mql?.matches;
}

// Extract a pull-quote from the body. Heuristic: first sentence whose
// length lands between 80 and 170 characters (short enough to sit at 40px,
// long enough to earn the frame). Falls back to the first sentence.
function extractPullquote(body: string): string {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const ideal = sentences.find((s) => s.length >= 80 && s.length <= 170);
  return ideal ?? sentences[0] ?? '';
}

/* ============================================================
 * Diagram geometry
 * ============================================================ */

const DIAGRAM_SIZE = 240;
const DIAGRAM_R = 96;
const DIAGRAM_CX = DIAGRAM_SIZE / 2;
const DIAGRAM_CY = DIAGRAM_SIZE / 2;

// Standard Enneagram layout — 9 at top, then 1..8 clockwise.
const POINT_ANGLES: Record<EnneagramType, number> = {
  9: -90,
  1: -90 + 40,
  2: -90 + 80,
  3: -90 + 120,
  4: -90 + 160,
  5: -90 + 200,
  6: -90 + 240,
  7: -90 + 280,
  8: -90 + 320,
};

function pointXY(t: EnneagramType): { x: number; y: number } {
  const rad = (POINT_ANGLES[t] * Math.PI) / 180;
  return {
    x: DIAGRAM_CX + DIAGRAM_R * Math.cos(rad),
    y: DIAGRAM_CY + DIAGRAM_R * Math.sin(rad),
  };
}

// Internal figures: triangle (3-6-9) and hexagon (1-4-2-8-5-7, closed).
const TRIANGLE: EnneagramType[] = [3, 6, 9];
const HEXAGON: EnneagramType[] = [1, 4, 2, 8, 5, 7];

function pathFor(points: EnneagramType[], closed = true): string {
  return (
    points
      .map((t, i) => {
        const { x, y } = pointXY(t);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ') + (closed ? ' Z' : '')
  );
}

/* ============================================================
 * Main component
 * ============================================================ */

export default function EnneagramProfile({ result }: EnneagramProfileProps) {
  const primaryProfile = ENNEAGRAM_TYPES[result.primary];

  // Wing toggle — start at whichever wing the server picked; if server
  // picked none, start at the lower neighbour.
  const [leftN, rightN] = useMemo(() => {
    const left = (result.primary === 1 ? 9 : result.primary - 1) as EnneagramType;
    const right = (result.primary === 9 ? 1 : result.primary + 1) as EnneagramType;
    return [left, right] as const;
  }, [result.primary]);

  const initialWing: EnneagramType = result.wing ?? leftN;
  const [activeWing, setActiveWing] = useState<EnneagramType>(initialWing);
  const [wingVisible, setWingVisible] = useState(true);

  // Diagram click — reveal destination profile below. Defaults to showing
  // the integration target (green), since that's the more hopeful read.
  const [diagramSelection, setDiagramSelection] = useState<EnneagramType>(
    result.integration,
  );

  // Accordion
  type AccordionKey = 'shadow' | 'gift' | 'health' | 'stress' | 'others';
  const [openPanel, setOpenPanel] = useState<AccordionKey | null>('shadow');

  // Streaming CTA state
  const [streaming, setStreaming] = useState(false);
  const [streamBody, setStreamBody] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ─── handlers ─────────────────────────────────────────── */

  const handleWingChange = useCallback(
    (w: EnneagramType) => {
      if (w === activeWing) return;
      if (prefersReducedMotion()) {
        setActiveWing(w);
        return;
      }
      setWingVisible(false);
      window.setTimeout(() => {
        setActiveWing(w);
        setWingVisible(true);
      }, 260);
    },
    [activeWing],
  );

  const handleAccordion = useCallback(
    (k: AccordionKey) => setOpenPanel((cur) => (cur === k ? null : k)),
    [],
  );

  const handleReading = useCallback(async () => {
    if (streaming) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);
    setStreamBody('');
    setStreamError(null);

    try {
      const res = await fetch('/api/reading/enneagram', {
        method: 'GET',
        cache: 'no-store',
        signal: ac.signal,
      });
      if (!res.ok) {
        let msg = `Reading unavailable (${res.status}).`;
        try {
          const parsed = (await res.json()) as { error?: string; message?: string };
          msg = parsed.message || parsed.error || msg;
        } catch { /* keep generic */ }
        throw new Error(msg);
      }
      if (!res.body) throw new Error('No stream came through.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';
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
            const evt = JSON.parse(json) as {
              type: string;
              delta?: string;
              message?: string;
            };
            if (evt.type === 'text' && typeof evt.delta === 'string') {
              setStreamBody((prev) => prev + evt.delta);
            } else if (evt.type === 'error') {
              throw new Error(evt.message || 'stream-error');
            } else if (evt.type === 'done') {
              break;
            }
          } catch { /* tolerate mid-stream parse hiccups */ }
        }
      }
    } catch (e) {
      if (ac.signal.aborted) return;
      const msg = e instanceof Error ? e.message : 'Reading unavailable.';
      setStreamError(msg);
    } finally {
      if (!ac.signal.aborted) setStreaming(false);
    }
  }, [streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ─── derived ─────────────────────────────────────────── */

  const wingProfile = primaryProfile.wings[String(activeWing)];
  const band = levelBand(result.level);
  const pullquote = useMemo(() => extractPullquote(primaryProfile.body), [primaryProfile]);
  const integrationProfile = ENNEAGRAM_TYPES[result.integration];
  const disintegrationProfile = ENNEAGRAM_TYPES[result.disintegration];
  const selectionProfile = ENNEAGRAM_TYPES[diagramSelection];

  /* ─── render ─────────────────────────────────────────── */

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '56px 28px 80px',
        color: 'var(--ink)',
      }}
    >
      {/* ── HERO ───────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'start',
          gap: 28,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--brass)',
            }}
          >
            § The Enneagram · Your Result
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 22,
              margin: '14px 0 6px',
            }}
          >
            <div
              style={{
                fontFamily: "'Alice', serif",
                fontVariationSettings: '"opsz" 144',
                fontSize: 140,
                fontWeight: 500,
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                color: 'var(--brass)',
              }}
            >
              {result.primary}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Alice', serif",
                  fontVariationSettings: '"opsz" 144',
                  fontSize: 42,
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                {primaryProfile.name}
              </h1>
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <CenterBadge label={centerLabel(primaryProfile.center)} />
                <LevelBadge level={result.level} band={band} />
                <TritypeBadge tritype={result.tritype} />
              </div>
            </div>
          </div>
        </div>

        {/* ── ENNEAGRAM DIAGRAM ───────────────────────── */}
        <EnneagramDiagram
          primary={result.primary}
          integration={result.integration}
          disintegration={result.disintegration}
          selected={diagramSelection}
          onSelect={setDiagramSelection}
        />
      </div>

      {/* ── CORE — 3-column Plex Mono quote block ─────── */}
      <CoreBlock core={primaryProfile.core} />

      {/* ── BODY interpretation ────────────────────────── */}
      <div
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 18,
          lineHeight: 1.72,
          color: 'var(--ink-dim)',
          marginTop: 36,
        }}
      >
        {primaryProfile.body.split(/\n{2,}/).map((para, i) => (
          <p key={i} style={{ margin: '0 0 18px' }}>
            {para}
          </p>
        ))}
      </div>

      {/* ── Pull-quote ─────────────────────────────────── */}
      {pullquote && <PullQuote text={pullquote} />}

      {/* ── WING TOGGLE ────────────────────────────────── */}
      <WingSection
        primary={result.primary}
        leftN={leftN}
        rightN={rightN}
        activeWing={activeWing}
        pickedWing={result.wing}
        onChange={handleWingChange}
        wingVisible={wingVisible}
        wingBody={wingProfile?.body ?? ''}
        wingNickname={wingProfile?.nickname ?? ''}
      />

      {/* ── DIAGRAM SELECTION DESCRIPTION ──────────────── */}
      <SelectionCard
        primary={result.primary}
        selection={selectionProfile}
        isIntegration={diagramSelection === result.integration}
        isDisintegration={diagramSelection === result.disintegration}
      />

      {/* ── ACCORDION ──────────────────────────────────── */}
      <div style={{ marginTop: 48 }}>
        <AccordionRow
          id="shadow"
          title="Shadow"
          eyebrow="§ The cost"
          body={primaryProfile.shadow}
          open={openPanel === 'shadow'}
          onToggle={() => handleAccordion('shadow')}
        />
        <AccordionRow
          id="gift"
          title="Gift"
          eyebrow="§ The offering"
          body={primaryProfile.gift}
          open={openPanel === 'gift'}
          onToggle={() => handleAccordion('gift')}
        />
        <AccordionRow
          id="health"
          title={`In health → Type ${result.integration} · ${integrationProfile.name}`}
          eyebrow="§ Growth arrow"
          body={primaryProfile.integration.dynamic}
          open={openPanel === 'health'}
          onToggle={() => handleAccordion('health')}
        />
        <AccordionRow
          id="stress"
          title={`In stress → Type ${result.disintegration} · ${disintegrationProfile.name}`}
          eyebrow="§ Stress arrow"
          body={primaryProfile.disintegration.dynamic}
          open={openPanel === 'stress'}
          onToggle={() => handleAccordion('stress')}
        />
        <AccordionRow
          id="others"
          title="With other types"
          eyebrow="§ Relationships"
          body={primaryProfile.relationships}
          open={openPanel === 'others'}
          onToggle={() => handleAccordion('others')}
        />
      </div>

      {/* ── STREAMING CTA ──────────────────────────────── */}
      <div
        style={{
          marginTop: 56,
          padding: '32px 32px 30px',
          border: '1px solid var(--rule)',
          background: 'var(--mist)',
          borderRadius: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 10,
          }}
        >
          § Synthesis · Claude-woven
        </div>
        <h3
          style={{
            fontFamily: "'Alice', serif",
            fontVariationSettings: '"opsz" 144',
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.012em',
            lineHeight: 1.08,
            margin: '0 0 18px',
          }}
        >
          Read your type against your chart
        </h3>

        {!streaming && !streamBody && !streamError && (
          <button
            type="button"
            onClick={handleReading}
            style={{
              background: 'transparent',
              border: '1px solid var(--brass)',
              color: 'var(--brass)',
              padding: '14px 24px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 220ms ease, color 220ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,160,82,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Read your type against your chart →
          </button>
        )}

        {streaming && !streamBody && (
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            Weaving the synthesis…
          </p>
        )}

        {streamError && (
          <div>
            <p
              style={{
                fontFamily: "'Hanken Grotesk', serif",
                fontStyle: 'italic',
                color: 'var(--ember)',
                fontSize: 15,
                margin: '0 0 14px',
              }}
            >
              {streamError}
            </p>
            <button
              type="button"
              onClick={handleReading}
              style={{
                background: 'transparent',
                border: '1px solid var(--brass)',
                color: 'var(--brass)',
                padding: '8px 16px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {streamBody && (
          <div
            style={{
              fontFamily: "'Hanken Grotesk', serif",
              fontSize: 18,
              lineHeight: 1.72,
              color: 'var(--ink-dim)',
              marginTop: 4,
            }}
          >
            {streamBody.split(/\n{2,}/).map((para, i) => (
              <p key={i} style={{ margin: '0 0 16px' }}>
                {para}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function CenterBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        border: '1px solid var(--rule)',
        color: 'var(--ink-dim)',
      }}
    >
      {label}
    </span>
  );
}

function LevelBadge({
  level,
  band,
}: {
  level: number;
  band: 'healthy' | 'average' | 'unhealthy';
}) {
  const tint =
    band === 'healthy'
      ? 'rgba(90, 138, 112, 0.28)'
      : band === 'unhealthy'
      ? 'rgba(168, 75, 62, 0.28)'
      : 'var(--rule)';
  const ink =
    band === 'healthy' ? '#8fbf9e' : band === 'unhealthy' ? 'var(--ember)' : 'var(--ink-dim)';
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        border: `1px solid ${tint}`,
        color: ink,
      }}
    >
      Level {level} · {band}
    </span>
  );
}

function TritypeBadge({ tritype }: { tritype: [EnneagramType, EnneagramType, EnneagramType] }) {
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        border: '1px solid var(--rule)',
        color: 'var(--ink-dim)',
      }}
    >
      Tritype · {tritype.join('-')}
    </span>
  );
}

function CoreBlock({
  core,
}: {
  core: { fear: string; desire: string; motivation: string };
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 0,
        marginTop: 36,
        border: '1px solid var(--rule)',
        background: 'var(--mist)',
      }}
    >
      {(
        [
          { label: 'Core fear', body: core.fear },
          { label: 'Core desire', body: core.desire },
          { label: 'Core motivation', body: core.motivation },
        ] as const
      ).map((row, i, arr) => (
        <div
          key={row.label}
          style={{
            padding: '22px 20px',
            borderRight:
              i < arr.length - 1 ? '1px solid var(--rule)' : '1px solid transparent',
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brass)',
              marginBottom: 10,
            }}
          >
            {row.label}
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.02em',
              lineHeight: 1.55,
              color: 'var(--ink-dim)',
              margin: 0,
            }}
          >
            {row.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <blockquote
      style={{
        margin: '36px 0 12px',
        padding: '18px 0 18px 22px',
        borderLeft: '2px solid var(--brass)',
        fontFamily: "'Alice', serif",
        fontStyle: 'italic',
        fontSize: 26,
        lineHeight: 1.28,
        letterSpacing: '-0.005em',
        color: 'var(--ink)',
      }}
    >
      "{text}"
    </blockquote>
  );
}

/* ── WING TOGGLE ───────────────────────────────────────────── */

function WingSection(props: {
  primary: EnneagramType;
  leftN: EnneagramType;
  rightN: EnneagramType;
  activeWing: EnneagramType;
  pickedWing: EnneagramType | null;
  onChange: (w: EnneagramType) => void;
  wingVisible: boolean;
  wingBody: string;
  wingNickname: string;
}) {
  const {
    primary,
    leftN,
    rightN,
    activeWing,
    pickedWing,
    onChange,
    wingVisible,
    wingBody,
    wingNickname,
  } = props;

  const leftProfile = ENNEAGRAM_TYPES[primary].wings[String(leftN)];
  const rightProfile = ENNEAGRAM_TYPES[primary].wings[String(rightN)];

  return (
    <section aria-label="Wing exploration" style={{ marginTop: 48 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 12,
        }}
      >
        § Your wing
      </div>
      <h3
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '-0.012em',
          margin: '0 0 18px',
        }}
      >
        Two colours, one type
      </h3>

      <div
        role="tablist"
        aria-label="Wing selector"
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}
      >
        <WingPill
          label={`${formatWingLabel(primary, leftN)} · ${leftProfile?.nickname ?? ''}`}
          active={activeWing === leftN}
          picked={pickedWing === leftN}
          onClick={() => onChange(leftN)}
        />
        <WingPill
          label={`${formatWingLabel(primary, rightN)} · ${rightProfile?.nickname ?? ''}`}
          active={activeWing === rightN}
          picked={pickedWing === rightN}
          onClick={() => onChange(rightN)}
        />
      </div>

      <div
        aria-live="polite"
        style={{
          opacity: wingVisible ? 1 : 0,
          transform: wingVisible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 18,
          lineHeight: 1.72,
          color: 'var(--ink-dim)',
        }}
      >
        <div
          style={{
            fontFamily: "'Alice', serif",
            fontStyle: 'italic',
            fontSize: 20,
            color: 'var(--ink)',
            marginBottom: 8,
          }}
        >
          {wingNickname}
        </div>
        <p style={{ margin: 0 }}>{wingBody}</p>
      </div>
    </section>
  );
}

function WingPill({
  label,
  active,
  picked,
  onClick,
}: {
  label: string;
  active: boolean;
  picked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        background: active ? 'rgba(200,160,82,0.12)' : 'transparent',
        border: `1px solid ${active ? 'var(--brass)' : 'var(--rule)'}`,
        color: active ? 'var(--brass)' : 'var(--ink-dim)',
        padding: '10px 16px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'background 220ms ease, color 220ms ease, border-color 220ms ease',
        position: 'relative',
      }}
    >
      {label}
      {picked && (
        <span
          aria-label="your score"
          title="Your score picked this wing"
          style={{
            marginLeft: 10,
            padding: '2px 6px',
            border: '1px solid var(--brass-soft)',
            color: 'var(--brass)',
            fontSize: 8,
            letterSpacing: '0.18em',
          }}
        >
          Your score
        </span>
      )}
    </button>
  );
}

/* ── DIAGRAM ───────────────────────────────────────────────── */

function EnneagramDiagram(props: {
  primary: EnneagramType;
  integration: EnneagramType;
  disintegration: EnneagramType;
  selected: EnneagramType;
  onSelect: (t: EnneagramType) => void;
}) {
  const { primary, integration, disintegration, selected, onSelect } = props;

  const primaryPt = pointXY(primary);
  const intPt = pointXY(integration);
  const disPt = pointXY(disintegration);

  const types: EnneagramType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <svg
      role="img"
      aria-label="Enneagram diagram"
      width={DIAGRAM_SIZE}
      height={DIAGRAM_SIZE}
      viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`}
      style={{ display: 'block' }}
    >
      <defs>
        <marker
          id="ennArrowIntegration"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="#8fbf9e" />
        </marker>
        <marker
          id="ennArrowStress"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="var(--ember)" />
        </marker>
      </defs>

      {/* Outer ring */}
      <circle
        cx={DIAGRAM_CX}
        cy={DIAGRAM_CY}
        r={DIAGRAM_R}
        fill="none"
        stroke="var(--rule)"
        strokeWidth={1}
      />

      {/* Internal hexagon (1-4-2-8-5-7) — stays quiet unless traversed */}
      <path
        d={pathFor(HEXAGON, true)}
        fill="none"
        stroke="var(--rule)"
        strokeWidth={0.8}
      />

      {/* Internal triangle (3-6-9) */}
      <path
        d={pathFor(TRIANGLE, true)}
        fill="none"
        stroke="var(--rule)"
        strokeWidth={0.8}
      />

      {/* Integration arrow (primary → integration) */}
      <line
        x1={primaryPt.x}
        y1={primaryPt.y}
        x2={intPt.x}
        y2={intPt.y}
        stroke="#8fbf9e"
        strokeWidth={1.4}
        opacity={0.92}
        markerEnd="url(#ennArrowIntegration)"
      />

      {/* Disintegration arrow (primary → disintegration) */}
      <line
        x1={primaryPt.x}
        y1={primaryPt.y}
        x2={disPt.x}
        y2={disPt.y}
        stroke="var(--ember)"
        strokeWidth={1.4}
        opacity={0.92}
        strokeDasharray="3 3"
        markerEnd="url(#ennArrowStress)"
      />

      {/* Nodes — render after lines so nodes sit on top */}
      {types.map((t) => {
        const { x, y } = pointXY(t);
        const isPrimary = t === primary;
        const isInt = t === integration;
        const isDis = t === disintegration;
        const isSel = t === selected;
        const fill = isPrimary
          ? 'var(--brass)'
          : isSel
          ? 'rgba(200,160,82,0.28)'
          : 'var(--bg-raise)';
        const stroke = isPrimary
          ? 'var(--brass)'
          : isInt
          ? '#8fbf9e'
          : isDis
          ? 'var(--ember)'
          : 'var(--rule)';
        return (
          <g key={t}>
            <circle
              cx={x}
              cy={y}
              r={isPrimary ? 14 : 10}
              fill={fill}
              stroke={stroke}
              strokeWidth={isPrimary ? 1.5 : 1}
              style={{ cursor: 'pointer', transition: 'fill 200ms, stroke 200ms' }}
              onClick={() => onSelect(t)}
            />
            <text
              x={x}
              y={y + 4}
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={11}
              textAnchor="middle"
              fill={isPrimary ? 'var(--bg-deep)' : 'var(--ink-dim)'}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SelectionCard(props: {
  primary: EnneagramType;
  selection: EnneagramTypeProfile;
  isIntegration: boolean;
  isDisintegration: boolean;
}) {
  const { primary, selection, isIntegration, isDisintegration } = props;

  // If the selection IS the primary, don't show a redundant card.
  if (selection.number === primary) return null;

  const tint = isIntegration
    ? '#8fbf9e'
    : isDisintegration
    ? 'var(--ember)'
    : 'var(--brass)';
  const eyebrow = isIntegration
    ? `§ Growth arrow · ${primary} → ${selection.number}`
    : isDisintegration
    ? `§ Stress arrow · ${primary} → ${selection.number}`
    : `§ Type ${selection.number}`;

  return (
    <aside
      style={{
        marginTop: 28,
        padding: '20px 22px',
        border: `1px solid ${tint}`,
        background: 'var(--mist)',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: tint,
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: "'Alice', serif",
          fontStyle: 'italic',
          fontSize: 22,
          margin: '0 0 10px',
        }}
      >
        {selection.name}
      </div>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--ink-dim)',
          margin: 0,
        }}
      >
        {isIntegration
          ? selection.gift
          : isDisintegration
          ? selection.shadow
          : selection.core.motivation}
      </p>
    </aside>
  );
}

/* ── ACCORDION ─────────────────────────────────────────────── */

function AccordionRow({
  id,
  title,
  eyebrow,
  body,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--rule)',
        padding: '18px 0',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`acc-${id}`}
        style={{
          background: 'transparent',
          border: 0,
          padding: 0,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--brass)',
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "'Alice', serif",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.008em',
              color: open ? 'var(--ink)' : 'var(--ink-dim)',
            }}
          >
            {title}
          </div>
        </div>
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 18,
            color: 'var(--brass)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 240ms ease',
            display: 'inline-block',
          }}
        >
          +
        </span>
      </button>
      <div
        id={`acc-${id}`}
        role="region"
        style={{
          overflow: 'hidden',
          maxHeight: open ? 600 : 0,
          opacity: open ? 1 : 0,
          transition: 'max-height 320ms ease, opacity 240ms ease',
        }}
      >
        <p
          style={{
            margin: '14px 0 2px',
            fontFamily: "'Hanken Grotesk', serif",
            fontSize: 18,
            lineHeight: 1.72,
            color: 'var(--ink-dim)',
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
