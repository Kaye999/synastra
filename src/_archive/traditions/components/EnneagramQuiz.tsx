"use client";

// EnneagramQuiz.tsx — 36-question assessment UI.
//
// One question at a time with a brass-hairline progress indicator. Each
// answer is a 5-point Likert row. Questions fade-swap between answers so
// the reader isn't jarred between items. Transitions respect
// prefers-reduced-motion (they collapse to instant swaps).
//
// On completion, POSTs to /api/enneagram/submit and, on success, calls
// onComplete with the EnneagramResult the server echoes back. The parent
// renders <EnneagramProfile /> from there.

import { useEffect, useMemo, useState } from 'react';
import {
  ENNEAGRAM_QUESTIONS,
  LIKERT_LABELS,
  type EnneagramQuestion,
} from '@/lib/interp/enneagram-questions';
import type { EnneagramResult } from '@/lib/engines/enneagram';

export type EnneagramQuizProps = {
  onComplete: (result: EnneagramResult) => void;
  onError?: (message: string) => void;
};

type Answers = Record<string, 1 | 2 | 3 | 4 | 5>;

const FADE_MS = 240;

export default function EnneagramQuiz({ onComplete, onError }: EnneagramQuizProps) {
  const questions = useMemo(() => ENNEAGRAM_QUESTIONS, []);
  const total = questions.length;

  const [index, setIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [visible, setVisible] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const current: EnneagramQuestion | undefined = questions[index];
  const answered = Object.keys(answers).length;
  const progress = Math.min(100, (answered / total) * 100);

  useEffect(() => {
    // Re-fade in whenever we advance. Honour reduced-motion by skipping.
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mql?.matches) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [index]);

  function handleAnswer(value: 1 | 2 | 3 | 4 | 5) {
    if (!current || submitting) return;
    const next: Answers = { ...answers, [current.id]: value };
    setAnswers(next);

    // Advance with a brief fade-out before the next question mounts.
    const mql =
      typeof window !== 'undefined'
        ? window.matchMedia?.('(prefers-reduced-motion: reduce)')
        : null;
    const reduced = mql?.matches;

    if (index < total - 1) {
      if (reduced) {
        setIndex(index + 1);
      } else {
        setVisible(false);
        setTimeout(() => setIndex(index + 1), FADE_MS);
      }
    } else {
      void submit(next);
    }
  }

  function handleBack() {
    if (index <= 0 || submitting) return;
    setIndex(index - 1);
  }

  async function submit(finalAnswers: Answers) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/enneagram/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = body?.error || `submission failed (${res.status})`;
        setError(msg);
        onError?.(msg);
        return;
      }
      const data = (await res.json()) as { result: EnneagramResult };
      onComplete(data.result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'submission failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '48px 28px 64px',
        color: 'var(--ink)',
      }}
    >
      <Eyebrow>§ The Enneagram · 36 Observations</Eyebrow>

      <h1
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: '-0.015em',
          lineHeight: 1.1,
          margin: '18px 0 12px',
        }}
      >
        Which pattern, precisely, are you running?
      </h1>

      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontStyle: 'italic',
          fontSize: 18,
          lineHeight: 1.55,
          color: 'var(--ink-dim)',
          margin: '0 0 28px',
        }}
      >
        Read each statement twice. Answer as you behave, not as you wish you did.
      </p>

      <Progress current={index + 1} total={total} percent={progress} />

      <div
        aria-live="polite"
        style={{
          marginTop: 44,
          minHeight: 260,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
      >
        {current && (
          <>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--brass)',
                marginBottom: 14,
              }}
            >
              {String(index + 1).padStart(2, '0')} · of · {String(total).padStart(2, '0')}
            </div>

            <p
              style={{
                fontFamily: "'Alice', serif",
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.35,
                color: 'var(--ink)',
                margin: '0 0 32px',
              }}
            >
              {current.text}
            </p>

            <LikertRow
              value={answers[current.id]}
              onChange={handleAnswer}
              disabled={submitting}
            />
          </>
        )}

        {!current && (
          <p
            style={{
              fontFamily: "'Hanken Grotesk', serif",
              fontSize: 18,
              color: 'var(--ink-dim)',
            }}
          >
            No questions loaded.
          </p>
        )}
      </div>

      {error && (
        <p
          style={{
            marginTop: 24,
            fontFamily: "'Hanken Grotesk', serif",
            fontStyle: 'italic',
            color: 'var(--ember)',
            fontSize: 15,
          }}
        >
          {error}
        </p>
      )}

      {submitting && (
        <p
          style={{
            marginTop: 24,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Reading the pattern…
        </p>
      )}

      <div
        style={{
          marginTop: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={index === 0 || submitting}
          style={{
            background: 'transparent',
            border: 0,
            color: index === 0 ? 'var(--ink-faint)' : 'var(--ink-dim)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: index === 0 ? 'default' : 'pointer',
            padding: '6px 0',
          }}
        >
          ← Back
        </button>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          {answered} / {total} answered
        </span>
      </div>
    </div>
  );
}

/* ─── sub-components ─────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: 'var(--brass)',
      }}
    >
      {children}
    </div>
  );
}

function Progress({
  current,
  total,
  percent,
}: {
  current: number;
  total: number;
  percent: number;
}) {
  return (
    <div aria-hidden="true" style={{ marginTop: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}
      >
        <span>Progress</span>
        <span>
          {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 1,
          background: 'var(--rule)',
          width: '100%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent}%`,
            background: 'var(--brass)',
            transition: 'width 400ms cubic-bezier(.2,.7,.3,1)',
          }}
        />
      </div>
    </div>
  );
}

function LikertRow({
  value,
  onChange,
  disabled,
}: {
  value: 1 | 2 | 3 | 4 | 5 | undefined;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Agreement"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 8,
      }}
    >
      {LIKERT_LABELS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            style={{
              background: selected ? 'rgba(200,160,82,0.12)' : 'transparent',
              border: `1px solid ${selected ? 'var(--brass)' : 'var(--rule)'}`,
              color: selected ? 'var(--brass)' : 'var(--ink-dim)',
              padding: '14px 10px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'background 220ms ease, color 220ms ease, border-color 220ms ease',
              lineHeight: 1.4,
              minHeight: 64,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14, letterSpacing: '0.1em', color: 'var(--ink)' }}>
              {opt.value}
            </span>
            <span style={{ fontSize: 9, letterSpacing: '0.18em' }}>{shortLabel(opt.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

function shortLabel(label: string): string {
  // "Strongly Disagree" → "Strong · No", etc. Keeps the buttons compact
  // without losing the full-text meaning (screen readers still see the
  // aria-label via the button's actual text).
  switch (label) {
    case 'Strongly Disagree':
      return 'Strong · No';
    case 'Disagree':
      return 'Disagree';
    case 'Neutral':
      return 'Neutral';
    case 'Agree':
      return 'Agree';
    case 'Strongly Agree':
      return 'Strong · Yes';
    default:
      return label;
  }
}
