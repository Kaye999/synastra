"use client";

// GeneKeysProfile.tsx — interactive 2×2 Hologenetic Profile surface.
//
// Four Gene Keys of the Activation Sequence displayed as an editorial grid:
//   [ Life's Work  |  Evolution ]
//   [ Radiance     |  Purpose   ]
//
// Each card carries three frequency tabs — Shadow / Gift / Siddhi — tinted in
// ember / brass / violet-deep respectively. Click a tab and the body prose
// crossfades (400ms) to that frequency's text. Default view is Gift, which is
// the "current integration edge" most readers are actually working with.
//
// A small Shadow ●━━ Gift ━━━ Siddhi indicator sits above each body so the
// reader can always see which frequency they are exploring and can move one
// step at a time — the contemplative practice Richard Rudd prescribes.
//
// Depth-tier gated via PaywallBlur. Reader/Free see a blurred preview with
// the editorial upgrade card overlaid.
//
// Respects prefers-reduced-motion: crossfades collapse to instant swaps,
// all transitions disabled under the `(prefers-reduced-motion: reduce)`
// media query (globals.css already enforces this at the document level).

import { useEffect, useMemo, useState } from 'react';
import PaywallBlur from './PaywallBlur';
import Ornament from './Ornament';
import type { Tier } from '@/lib/tiers';
import type {
  GeneKey,
  HologeneticProfile,
} from '@/lib/engines/gene-keys';

/* ============================================================
 * Types
 * ============================================================ */

export type Frequency = 'shadow' | 'gift' | 'siddhi';

type SlotKey = 'lifesWork' | 'evolution' | 'radiance' | 'purpose';

type Slot = {
  key: SlotKey;
  eyebrow: string;
  description: string;
  geneKey: GeneKey;
};

export type GeneKeysProfileProps = {
  hologenetic: HologeneticProfile;
  userTier: Tier;
};

/* ============================================================
 * Frequency visual tokens
 * ============================================================ */

const FREQUENCIES: ReadonlyArray<{
  key: Frequency;
  label: string;
  tint: string;        // border / active-text color
  tintSoft: string;    // faint background tint for active tab
  indicator: string;   // glyph for the progression indicator
}> = [
  { key: 'shadow', label: 'Shadow', tint: 'var(--ember)',        tintSoft: 'rgba(168, 75, 62, 0.12)', indicator: '●' },
  { key: 'gift',   label: 'Gift',   tint: 'var(--brass)',        tintSoft: 'rgba(200, 160, 82, 0.14)', indicator: '●' },
  { key: 'siddhi', label: 'Siddhi', tint: 'rgb(155, 137, 212)',  tintSoft: 'rgba(155, 137, 212, 0.14)', indicator: '●' },
];

const FADE_MS = 400;

/* ============================================================
 * Root component
 * ============================================================ */

export default function GeneKeysProfile({ hologenetic, userTier }: GeneKeysProfileProps) {
  const slots: Slot[] = useMemo(
    () => [
      {
        key: 'lifesWork',
        eyebrow: "§ Life's Work",
        description: 'What you are here to embody — the Sun at birth.',
        geneKey: hologenetic.activation.lifesWork,
      },
      {
        key: 'evolution',
        eyebrow: '§ Evolution',
        description: 'The ground that stabilises the Life\'s Work — the Earth at birth.',
        geneKey: hologenetic.activation.evolution,
      },
      {
        key: 'radiance',
        eyebrow: '§ Radiance',
        description: 'The radiance released when the genius is lived — the Design Sun.',
        geneKey: hologenetic.activation.radiance,
      },
      {
        key: 'purpose',
        eyebrow: '§ Purpose',
        description: 'The deepest unconscious purpose — the Design Earth.',
        geneKey: hologenetic.activation.purpose,
      },
    ],
    [hologenetic],
  );

  // Each card tracks its own frequency. Default: Gift.
  const [freqByKey, setFreqByKey] = useState<Record<SlotKey, Frequency>>({
    lifesWork: 'gift',
    evolution: 'gift',
    radiance: 'gift',
    purpose: 'gift',
  });

  // The pull-quote below the grid follows whichever card's Gift is showing.
  // We use Life's Work as the anchor for the pull quote.
  const pullQuoteSource = slots[0].geneKey.gift;

  return (
    <PaywallBlur
      tier={userTier}
      required="depth"
      teaser="The Hologenetic Profile — four Gene Keys mapping the shadow you carry, the gift you release, and the siddhi waiting at the edge of the life."
    >
      <section
        aria-labelledby="gk-profile-heading"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '8px 0 16px',
          color: 'var(--ink)',
        }}
      >
        <Header />

        {/* 2 × 2 grid */}
        <div
          className="gk-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 22,
            marginTop: 28,
          }}
        >
          {slots.map((slot) => (
            <GeneKeyCard
              key={slot.key}
              slot={slot}
              frequency={freqByKey[slot.key]}
              onChange={(f) =>
                setFreqByKey((prev) => ({ ...prev, [slot.key]: f }))
              }
            />
          ))}
        </div>

        {/* Pull-quote */}
        <PullQuote
          body={pullQuoteSource.body}
          attribution={`${slots[0].geneKey.name} · Gift of ${pullQuoteSource.name}`}
        />

        {/* Venus + Pearl — coming soon */}
        <LockedSequences
          venusNote={hologenetic.venus.note}
          pearlNote={hologenetic.pearl.note}
        />
      </section>

      {/* Narrow-screen collapse */}
      <style>{`
        @media (max-width: 820px) {
          .gk-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PaywallBlur>
  );
}

/* ============================================================
 * Header
 * ============================================================ */

function Header() {
  return (
    <header style={{ textAlign: 'center', padding: '0 0 8px' }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 14,
        }}
      >
        § Hologenetic Profile · Activation Sequence
      </div>
      <h2
        id="gk-profile-heading"
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 'clamp(34px, 4.4vw, 52px)',
          fontWeight: 500,
          letterSpacing: '-0.015em',
          lineHeight: 1.04,
          margin: 0,
          color: 'var(--ink)',
        }}
      >
        The Four Gene Keys
      </h2>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--ink-dim)',
          margin: '10px auto 0',
          maxWidth: 640,
          lineHeight: 1.5,
        }}
      >
        Each Key carries a shadow frequency, a gift frequency, and a siddhi.
        Move through them as contemplations — not diagnoses.
      </p>
      <div style={{ margin: '24px auto 0', maxWidth: 220 }}>
        <Ornament kind="constellation" width={200} style={{ margin: '0 auto', opacity: 0.55 }} />
      </div>
    </header>
  );
}

/* ============================================================
 * Gene Key card
 * ============================================================ */

function GeneKeyCard({
  slot,
  frequency,
  onChange,
}: {
  slot: Slot;
  frequency: Frequency;
  onChange: (f: Frequency) => void;
}) {
  // Crossfade: track mount-visible so body can fade out -> swap -> fade in.
  const [visible, setVisible] = useState<boolean>(true);
  const [renderedFreq, setRenderedFreq] = useState<Frequency>(frequency);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setReducedMotion(!!mql?.matches);
    const handler = () => setReducedMotion(!!mql?.matches);
    mql?.addEventListener?.('change', handler);
    return () => mql?.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    if (frequency === renderedFreq) return;
    if (reducedMotion) {
      setRenderedFreq(frequency);
      setVisible(true);
      return;
    }
    setVisible(false);
    const t = setTimeout(() => {
      setRenderedFreq(frequency);
      setVisible(true);
    }, FADE_MS / 2);
    return () => clearTimeout(t);
  }, [frequency, renderedFreq, reducedMotion]);

  const gk = slot.geneKey;
  const freqData = gk[renderedFreq];
  const activeVisual = FREQUENCIES.find((f) => f.key === renderedFreq)!;

  return (
    <article
      style={{
        position: 'relative',
        border: '1px solid var(--rule)',
        background: 'var(--mist)',
        padding: '30px 30px 28px',
        borderRadius: 2,
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Line-number mono indicator — top right corner */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 18,
          right: 20,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--ink-faint)',
        }}
      >
        LINE {gk.line}/6
      </div>

      {/* Eyebrow */}
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
        {slot.eyebrow}
      </div>

      {/* Big gene key number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: "'Alice', serif",
            fontVariationSettings: '"opsz" 144',
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 0.95,
            color: 'var(--brass)',
            letterSpacing: '-0.03em',
          }}
        >
          {gk.number}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Alice', serif",
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1.2,
            }}
          >
            {gk.name}
          </div>
          <div
            style={{
              fontFamily: "'Hanken Grotesk', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--ink-dim)',
              marginTop: 2,
            }}
          >
            {gk.hexagram}
          </div>
        </div>
      </div>

      {/* Brass hairline */}
      <hr
        style={{
          width: 48,
          height: 1,
          background: 'var(--brass)',
          border: 0,
          margin: '16px 0 18px',
          opacity: 0.7,
        }}
      />

      {/* Frequency tabs */}
      <div
        role="tablist"
        aria-label={`Frequency for ${gk.name}`}
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {FREQUENCIES.map((f) => {
          const active = f.key === frequency;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(f.key)}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: active ? f.tintSoft : 'transparent',
                border: `1px solid ${active ? f.tint : 'var(--rule)'}`,
                borderRadius: 999,
                color: active ? f.tint : 'var(--ink-dim)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'color 220ms ease, border-color 220ms ease, background 220ms ease',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Progression indicator */}
      <FrequencyProgress current={frequency} />

      {/* Body — crossfaded */}
      <div style={{ flex: 1, position: 'relative', marginTop: 14 }}>
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: reducedMotion ? 'none' : `opacity ${FADE_MS}ms ease`,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: activeVisual.tint,
              marginBottom: 8,
            }}
          >
            {activeVisual.label} · {freqData.name}
          </div>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', Georgia, serif",
              fontSize: 16,
              lineHeight: 1.62,
              color: 'var(--ink-dim)',
              margin: 0,
            }}
          >
            {freqData.body}
          </p>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
 * Progression indicator — Shadow ●━━ Gift ━━━ Siddhi
 * ============================================================ */

function FrequencyProgress({ current }: { current: Frequency }) {
  const order: Frequency[] = ['shadow', 'gift', 'siddhi'];
  const activeIdx = order.indexOf(current);
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--ink-faint)',
      }}
    >
      {order.map((f, i) => {
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;
        const label = f === 'shadow' ? 'Shadow' : f === 'gift' ? 'Gift' : 'Siddhi';
        const color = isActive
          ? FREQUENCIES[i].tint
          : isPast
          ? 'var(--ink-dim)'
          : 'var(--ink-faint)';
        return (
          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color, fontWeight: isActive ? 500 : 400 }}>
              {isActive ? '●' : '○'} {label}
            </span>
            {i < order.length - 1 && (
              <span style={{ color: 'var(--rule)', letterSpacing: 0 }}>━━</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ============================================================
 * Pull quote
 * ============================================================ */

function PullQuote({ body, attribution }: { body: string; attribution: string }) {
  // Extract the first full sentence from the body as the pull-quote.
  const quote = useMemo(() => extractQuoteSentence(body), [body]);

  return (
    <div
      style={{
        margin: '56px auto 0',
        maxWidth: 760,
        padding: '0 20px',
        borderLeft: '1px solid var(--brass)',
        color: 'var(--ink)',
      }}
    >
      <blockquote
        style={{
          fontFamily: "'Alice', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(22px, 2.6vw, 28px)',
          fontWeight: 500,
          lineHeight: 1.32,
          letterSpacing: '-0.01em',
          margin: 0,
          color: 'var(--ink)',
        }}
      >
        “{quote}”
      </blockquote>
      <div
        style={{
          marginTop: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}
      >
        — {attribution}
      </div>
    </div>
  );
}

function extractQuoteSentence(body: string): string {
  if (!body) return '';
  // First sentence terminator. Fall back to the whole body if none found.
  const match = body.match(/^[^.!?]+[.!?]/);
  const sentence = match ? match[0] : body;
  return sentence.trim();
}

/* ============================================================
 * Locked Venus + Pearl sequences
 * ============================================================ */

function LockedSequences({ venusNote, pearlNote }: { venusNote: string; pearlNote: string }) {
  return (
    <div
      style={{
        marginTop: 72,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 22,
      }}
    >
      <LockedCard
        eyebrow="§ Venus Sequence"
        title="Attraction, attachment, awakening"
        body="Six Gene Keys charting the architecture of love — from the wound through the intelligence to the radiance of relating."
        note={venusNote}
      />
      <LockedCard
        eyebrow="§ Pearl Sequence"
        title="The prosperity path"
        body="Three Gene Keys illuminating vocation, culture, and the flow of resources through a life."
        note={pearlNote}
      />
    </div>
  );
}

function LockedCard({
  eyebrow,
  title,
  body,
  note,
}: {
  eyebrow: string;
  title: string;
  body: string;
  note: string;
}) {
  return (
    <article
      style={{
        position: 'relative',
        border: '1px dashed var(--rule)',
        background: 'transparent',
        padding: '26px 28px',
        borderRadius: 2,
        minHeight: 180,
        opacity: 0.86,
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 12,
        }}
      >
        {eyebrow} · Locked
      </div>
      <h3
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--ink-dim)',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--ink-faint)',
          margin: '0 0 16px',
        }}
      >
        {body}
      </p>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
        }}
      >
        Coming soon — Q2 2026
      </div>
      <p
        style={{
          marginTop: 10,
          fontFamily: "'Hanken Grotesk', Georgia, serif",
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--ink-faint)',
        }}
      >
        {note}
      </p>
    </article>
  );
}
