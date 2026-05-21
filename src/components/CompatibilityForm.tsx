"use client";

// CompatibilityForm — synastry input for a second person + result surface.
//
// POSTs { otherBirthData, otherName } to /api/reading/compatibility. The
// endpoint streams the reading as SSE; we render it progressively in a
// ReadingCard. Depth-tier gated.

import { useCallback, useRef, useState, type FormEvent } from 'react';
import ReadingCard from './ReadingCard';
import PaywallBlur from './PaywallBlur';
import type { BirthData, Gender, Tier } from '@/lib/types';

export type CompatibilityFormProps = {
  user: BirthData;
  firstName: string;
  tier: Tier;
};

type FormState = {
  fullName: string;
  dateStr: string;
  timeStr: string;
  timeUnknown: boolean;
  city: string;
  gender: Gender;
};

const initial: FormState = {
  fullName: '',
  dateStr: '',
  timeStr: '',
  timeUnknown: false,
  city: '',
  gender: 'female',
};

async function streamCompatibility(
  body: string,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch('/api/reading/compatibility', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal,
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = `Reading unavailable (${res.status}).`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (parsed?.error) msg = parsed.error;
    } catch { /* keep generic */ }
    throw new Error(msg);
  }
  if (!res.body) throw new Error('No stream came through.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  let full = '';
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
        const evt = JSON.parse(json) as { type: string; delta?: string; message?: string };
        if (evt.type === 'text' && typeof evt.delta === 'string') {
          full += evt.delta;
          onDelta(evt.delta);
        } else if (evt.type === 'error') {
          throw new Error(evt.message || 'stream-error');
        } else if (evt.type === 'done') {
          return full;
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'stream-error') continue;
        throw e;
      }
    }
  }
  return full;
}

export default function CompatibilityForm({ user: _user, firstName: _firstName, tier }: CompatibilityFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [result, setResult] = useState<string>('');
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFieldError('');
      if (!form.fullName.trim()) {
        setFieldError('Their full name is required.');
        return;
      }
      const mDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.dateStr || '');
      if (!mDate) {
        setFieldError('Enter a valid birth date.');
        return;
      }
      const y = parseInt(mDate[1], 10);
      const mo = parseInt(mDate[2], 10);
      const d = parseInt(mDate[3], 10);
      if (!form.city.trim()) {
        setFieldError('Birth place is required.');
        return;
      }
      let h = 12;
      let m = 0;
      if (!form.timeUnknown) {
        const mT = /^(\d{2}):(\d{2})$/.exec(form.timeStr || '');
        if (!mT) {
          setFieldError('Enter a valid birth time, or tick unknown.');
          return;
        }
        h = parseInt(mT[1], 10);
        m = parseInt(mT[2], 10);
      }

      const otherBirthData: BirthData = {
        name: form.fullName.trim().split(/\s+/)[0],
        fullName: form.fullName.trim(),
        dob: { y, m: mo, d },
        time: { h, m },
        timeUnknown: form.timeUnknown,
        city: form.city.trim(),
        gender: form.gender,
      };

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      setResult('');

      try {
        await streamCompatibility(
          JSON.stringify({ otherBirthData, otherName: otherBirthData.name }),
          (delta) => setResult((prev) => prev + delta),
          ac.signal,
        );
      } catch (err) {
        if (ac.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [form],
  );

  return (
    <section aria-label="Compatibility — synastry">
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
        Synastry · Second Chart
      </div>
      <h2
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          margin: '0 0 8px',
          color: 'var(--ink)',
        }}
      >
        Two charts, one reading
      </h2>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontStyle: 'italic',
          fontSize: 16,
          color: 'var(--ink-dim)',
          margin: '0 0 28px',
          maxWidth: '48ch',
        }}
      >
        Whose orbit would you like to compare with yours?
      </p>

      <PaywallBlur
        tier={tier}
        required="depth"
        teaser="Synastry is where the charts start talking to each other."
      >
        <form
          onSubmit={submit}
          style={{
            border: '1px solid var(--rule)',
            background: 'var(--mist)',
            padding: '30px 32px',
            marginBottom: 28,
          }}
        >
          <Field label="Full name">
            <input
              type="text"
              className="onboard-input"
              value={form.fullName}
              onChange={(ev) => update('fullName', ev.target.value)}
              placeholder="Their full legal name"
            />
          </Field>

          <Field label="Date of birth">
            <input
              type="date"
              className="date-input"
              value={form.dateStr}
              onChange={(ev) => update('dateStr', ev.target.value)}
              min="1900-01-01"
              max="2100-12-31"
            />
          </Field>

          <Field label="Time of birth">
            <input
              type="time"
              className="time-input"
              value={form.timeStr}
              onChange={(ev) => update('timeStr', ev.target.value)}
              disabled={form.timeUnknown}
            />
            <label className="onboard-check">
              <input
                type="checkbox"
                checked={form.timeUnknown}
                onChange={(ev) => update('timeUnknown', ev.target.checked)}
              />
              Time unknown — use noon
            </label>
          </Field>

          <Field label="Birth place">
            <input
              type="text"
              className="onboard-input"
              value={form.city}
              onChange={(ev) => update('city', ev.target.value)}
              placeholder="City, Country"
            />
          </Field>

          <Field label="Gender">
            <div className="onboard-radio">
              {(['male', 'female'] as Gender[]).map((g) => (
                <label key={g} className={form.gender === g ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="compat-gender"
                    checked={form.gender === g}
                    onChange={() => update('gender', g)}
                  />
                  {g}
                </label>
              ))}
            </div>
          </Field>

          {fieldError && (
            <p
              style={{
                fontFamily: "'Hanken Grotesk', serif",
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ember)',
                margin: '0 0 14px',
              }}
            >
              {fieldError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="onboard-btn"
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? 'Computing…' : 'Compute Compatibility'}
          </button>
        </form>

        {(isLoading || error || result) && (
          <ReadingCard
            eyebrow="Synastry · Result"
            title={result ? `You & ${form.fullName || 'them'}` : 'Your synastry'}
            isLoading={isLoading && !result}
            error={error}
            body={
              result ? (
                <div>
                  {result.split(/\n{2,}/).map((para, i) => (
                    <p key={i} style={{ margin: '0 0 16px' }}>
                      {para}
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
        )}
      </PaywallBlur>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="onboard-field" style={{ marginBottom: 22 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}
