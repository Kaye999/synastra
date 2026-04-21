"use client";

// AyurvedaQuiz — 30-question prakruti assessment.
//
// One question at a time. Each question presents three self-descriptive
// options (never labelled as doshas in the UI — the reader shouldn't be able
// to game the result). Three-column grid on desktop, stacked on mobile.
// Crossfade between questions. Brass-fill progress bar.
//
// On completion, POSTs to /api/ayurveda/submit and hands the resulting
// Prakruti to onComplete. Transitions collapse to instant swaps under
// prefers-reduced-motion.

import { useEffect, useMemo, useState } from 'react';
import {
  AYURVEDA_QUESTIONS,
  AYURVEDA_QUESTION_COUNT,
  type AyurvedaQuestion,
} from '@/lib/interp/ayurveda-questions';
import type { Dosha, Prakruti } from '@/lib/engines/ayurveda';

export type AyurvedaQuizProps = {
  onComplete: (result: Prakruti) => void;
  onError?: (message: string) => void;
};

type Answers = Record<string, Dosha>;

const FADE_MS = 300;

export default function AyurvedaQuiz({ onComplete, onError }: AyurvedaQuizProps) {
  const questions = useMemo(() => AYURVEDA_QUESTIONS, []);
  const total = AYURVEDA_QUESTION_COUNT;

  const [index, setIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [visible, setVisible] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const current: AyurvedaQuestion | undefined = questions[index];
  const answered = Object.keys(answers).length;
  const isLast = index === total - 1;
  const hasAnsweredCurrent = current ? !!answers[current.id] : false;
  const progress = Math.min(100, (answered / total) * 100);

  useEffect(() => {
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

  function reducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function handleAnswer(dosha: Dosha) {
    if (!current || submitting) return;
    const next: Answers = { ...answers, [current.id]: dosha };
    setAnswers(next);

    if (isLast) {
      // On the final question, answering selects but does not auto-submit —
      // the reader presses the submit button below.
      return;
    }

    if (reducedMotion()) {
      setIndex(index + 1);
    } else {
      setVisible(false);
      setTimeout(() => setIndex(index + 1), FADE_MS);
    }
  }

  function handleBack() {
    if (index <= 0 || submitting) return;
    if (reducedMotion()) {
      setIndex(index - 1);
    } else {
      setVisible(false);
      setTimeout(() => setIndex(index - 1), FADE_MS);
    }
  }

  async function submit() {
    if (submitting) return;
    if (Object.keys(answers).length < total) {
      setError('Answer every question before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/ayurveda/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = body?.error || `submission failed (${res.status})`;
        setError(msg);
        onError?.(msg);
        return;
      }
      const data = (await res.json()) as { result: Prakruti };
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
        maxWidth: 780,
        margin: '0 auto',
        padding: '48px 28px 64px',
        color: 'var(--ink)',
      }}
    >
      <Eyebrow>§ Ayurveda · 30 Observations</Eyebrow>

      <h1
        style={{
          fontFamily: "'Fraunces', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: '-0.015em',
          lineHeight: 1.1,
          margin: '18px 0 12px',
        }}
      >
        Which constitution, precisely, built this body?
      </h1>

      <p
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontStyle: 'italic',
          fontSize: 18,
          lineHeight: 1.55,
          color: 'var(--ink-dim)',
          margin: '0 0 28px',
        }}
      >
        Answer each as you actually are, not as you prefer to be seen. Thirty questions, about six minutes.
      </p>

      <Progress current={index + 1} total={total} percent={progress} />

      <div
        aria-live="polite"
        style={{
          marginTop: 44,
          minHeight: 280,
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
              {String(index + 1).padStart(2, '0')} · of · {String(total).padStart(2, '0')} ·{' '}
              <span style={{ color: 'var(--ink-faint)' }}>{current.category}</span>
            </div>

            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.35,
                color: 'var(--ink)',
                margin: '0 0 32px',
              }}
            >
              {current.prompt}
            </p>

            <OptionGrid
              question={current}
              selected={answers[current.id]}
              onChange={handleAnswer}
              disabled={submitting}
            />
          </>
        )}
      </div>

      {error && (
        <p
          style={{
            marginTop: 24,
            fontFamily: "'Crimson Pro', serif",
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
          Reading the constitution…
        </p>
      )}

      <div
        style={{
          marginTop: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
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

        {isLast && (
          <button
            type="button"
            onClick={submit}
            disabled={!hasAnsweredCurrent || submitting}
            style={{
              background: hasAnsweredCurrent ? 'var(--brass)' : 'transparent',
              border: `1px solid ${hasAnsweredCurrent ? 'var(--brass)' : 'var(--rule)'}`,
              color: hasAnsweredCurrent ? 'var(--bg-base)' : 'var(--ink-faint)',
              padding: '12px 24px',
              fontFamily: "'Fraunces', serif",
              fontSize: 14,
              letterSpacing: '0.04em',
              cursor: hasAnsweredCurrent && !submitting ? 'pointer' : 'not-allowed',
              transition: 'background 220ms ease, color 220ms ease, border-color 220ms ease',
            }}
          >
            Reveal constitution →
          </button>
        )}
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

function OptionGrid({
  question,
  selected,
  onChange,
  disabled,
}: {
  question: AyurvedaQuestion;
  selected: Dosha | undefined;
  onChange: (d: Dosha) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Answer options"
      className="ay-option-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 12,
      }}
    >
      {/* Responsive 3-col via inline media query fallback — handled in CSS tag below */}
      <style>{`
        @media (min-width: 768px) {
          .ay-option-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      {question.options.map((opt) => {
        const isSelected = selected === opt.dosha;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.dosha)}
            style={{
              background: isSelected ? 'rgba(200,160,82,0.10)' : 'var(--mist)',
              border: `1px solid ${isSelected ? 'var(--brass)' : 'var(--rule)'}`,
              color: isSelected ? 'var(--ink)' : 'var(--ink-dim)',
              padding: '18px 18px',
              fontFamily: "'Crimson Pro', serif",
              fontSize: 16,
              lineHeight: 1.45,
              textAlign: 'left',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'background 220ms ease, color 220ms ease, border-color 220ms ease',
              minHeight: 120,
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                color: isSelected ? 'var(--brass)' : 'var(--ink-faint)',
                marginRight: 12,
                marginTop: 3,
                textTransform: 'uppercase',
              }}
            >
              {opt.id}
            </span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
