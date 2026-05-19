"use client";

// Onboarding.tsx — birth data form. Ported from astrology-transits.jsx lines 3516-3685.

import { useState, type FormEvent } from 'react';
import type { BirthData, Gender } from '@/lib/types';
import CityAutocomplete, { type CityHit } from './CityAutocomplete';

export type OnboardingProps = {
  onSave: (user: BirthData) => void;
  initial?: Partial<BirthData>;
  /** Override the Cast The Atlas button label (e.g. "Casting…"). */
  submitLabel?: string;
  /** Disable the submit button while a save is in flight. */
  submitDisabled?: boolean;
};

export default function Onboarding({ onSave, initial, submitLabel, submitDisabled }: OnboardingProps) {
  const init: Partial<BirthData> = initial || {};
  const initDateStr =
    init.dob && init.dob.y && init.dob.m && init.dob.d
      ? `${init.dob.y}-${String(init.dob.m).padStart(2, '0')}-${String(init.dob.d).padStart(2, '0')}`
      : '';
  const initTimeStr =
    init.time && init.time.h != null && init.time.m != null
      ? `${String(init.time.h).padStart(2, '0')}:${String(init.time.m).padStart(2, '0')}`
      : '';

  const [fullName, setFullName] = useState<string>(init.fullName || '');
  const [firstName, setFirstName] = useState<string>(init.name || '');
  const [dateStr, setDateStr] = useState<string>(initDateStr);
  const [timeStr, setTimeStr] = useState<string>(initTimeStr);
  const [timeUnknown, setTimeUnknown] = useState<boolean>(!!init.timeUnknown);
  const [city, setCity] = useState<string>(init.city || '');
  const [cityCoords, setCityCoords] = useState<BirthData['coords']>(init.coords);
  const [gender, setGender] = useState<Gender>(init.gender || 'male');
  const [err, setErr] = useState<string>('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim()) { setErr('Full legal name is required.'); return; }
    const mDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
    if (!mDate) { setErr('Enter a valid birth date.'); return; }
    const y = parseInt(mDate[1], 10);
    const mo = parseInt(mDate[2], 10);
    const d = parseInt(mDate[3], 10);
    if (!y || !mo || !d || y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) {
      setErr('Enter a valid birth date.');
      return;
    }
    let hh = 12;
    let mm = 0;
    if (!timeUnknown) {
      const mTime = /^(\d{2}):(\d{2})$/.exec(timeStr || '');
      if (!mTime) { setErr('Enter a valid birth time, or tick the checkbox.'); return; }
      hh = parseInt(mTime[1], 10);
      mm = parseInt(mTime[2], 10);
      if (hh < 0 || hh > 23 || mm < 0 || mm > 59) { setErr('Enter a valid birth time.'); return; }
    }
    if (!city.trim()) { setErr('Birth place is required.'); return; }

    onSave({
      name: firstName.trim() || fullName.trim().split(' ')[0],
      fullName: fullName.trim(),
      dob: { y, m: mo, d },
      time: timeUnknown ? { h: 12, m: 0 } : { h: hh, m: mm },
      timeUnknown,
      city: city.trim(),
      coords: cityCoords,
      gender,
    });
  };

  const handleCitySelect = (hit: CityHit) => {
    setCityCoords({
      lat: hit.lat,
      lon: hit.lon,
      tzOffset: hit.tzOffset,
      tzId: hit.tzId,
    });
  };

  // J.P. Morgan — the brand's canonical demo chart.
  const loadDemo = () => {
    onSave({
      name: 'John',
      fullName: 'John Pierpont Morgan',
      dob: { y: 1837, m: 4, d: 17 },
      time: { h: 3, m: 0 },
      timeUnknown: false,
      city: 'Hartford',
      gender: 'male',
    });
  };

  return (
    <div className="onboard-wrap">
      <form className="onboard-card" onSubmit={handleSubmit}>
        <div className="onboard-symbol">☉ ☽ ↑</div>
        <div className="onboard-eyebrow">An Astral Atlas</div>
        <h1 className="onboard-title">Seven traditions. One birth.</h1>
        <p className="onboard-sub">
          Western, Vedic, Numerology, Kabbalah, Human Design, Tarot, and Astrocartography — all pulled from the same date, time, and place. One chart. One Oracle.
        </p>
        <hr className="brass-rule" />

        <div className="onboard-field">
          <label htmlFor="ob-fullname">Full legal name</label>
          <input
            id="ob-fullname"
            className="onboard-input"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Given · middle · family"
          />
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-firstname">
            Preferred first name{' '}
            <span className="marginalia" style={{ color: 'var(--ink-faint)', letterSpacing: '0.12em' }}>
              — optional
            </span>
          </label>
          <input
            id="ob-firstname"
            className="onboard-input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="What to call you"
          />
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-date">Birth date</label>
          <input
            id="ob-date"
            className="date-input"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            min="1900-01-01"
            max="2100-12-31"
          />
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-hour">Birth time</label>
          <TimeWheel
            value={timeStr}
            onChange={setTimeStr}
            disabled={timeUnknown}
          />
          <label className="onboard-check">
            <input
              type="checkbox"
              checked={timeUnknown}
              onChange={(e) => setTimeUnknown(e.target.checked)}
            />
            I don&apos;t know my birth time
          </label>
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-city">Birth place</label>
          <CityAutocomplete
            id="ob-city"
            className="onboard-input"
            value={city}
            onChange={(v) => {
              setCity(v);
              // If the user edits the field after picking, invalidate the
              // cached coords — they'll need to pick again for us to
              // persist accurate lat/lon/tz.
              if (cityCoords) setCityCoords(undefined);
            }}
            onSelect={handleCitySelect}
            placeholder="Start typing a city…"
            ariaLabel="Birth place"
          />
        </div>

        <div className="onboard-field">
          <label>
            Gender{' '}
            <span className="marginalia" style={{ color: 'var(--ink-faint)', letterSpacing: '0.12em' }}>
              — Nine Star Ki input
            </span>
          </label>
          <div className="onboard-radio">
            <label className={gender === 'male' ? 'selected' : ''}>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={() => setGender('male')}
              />
              Male
            </label>
            <label className={gender === 'female' ? 'selected' : ''}>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={() => setGender('female')}
              />
              Female
            </label>
          </div>
        </div>

        {err && <div className="onboard-err">{err}</div>}

        <button
          type="submit"
          className="onboard-btn"
          disabled={submitDisabled}
          style={submitDisabled ? { opacity: 0.6, cursor: 'wait' } : undefined}
        >
          {submitLabel || 'Cast the Atlas'}
        </button>
        <button
          type="button"
          className="onboard-demo"
          onClick={loadDemo}
          disabled={submitDisabled}
        >
          Read the demo chart instead
        </button>
      </form>
    </div>
  );
}

/* ─── TimeWheel — three-select birth-time picker ─────────────────────────── */
//
// Replaces <input type="time"> which has uneven UX across platforms (iOS
// renders a beautiful native wheel, desktop Chrome shows an awkward
// caret-based field with the AM/PM toggle hard to find).
//
// Three native <select> elements:
//   - On iOS / Android: each select pops a full-height NATIVE WHEEL PICKER
//     — exactly what the user asked for (scrollable, big touch targets).
//   - On desktop: clean dropdowns.
//   - Same JSX, no platform-specific code.
//
// Internal state is HH (1-12), MM (0-59), period ('AM' | 'PM'). On change
// we convert back to a 24-hour "HH:MM" string for the parent's existing
// timeStr state — zero contract change for handleSubmit's regex.

function TimeWheel({
  value,
  onChange,
  disabled,
}: {
  /** 24-hour "HH:MM" string (matches parent's existing format). */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  // Parse incoming "HH:MM" (24h). Defaults sensible if empty / invalid.
  const m = /^(\d{1,2}):(\d{2})$/.exec(value || '');
  const h24 = m ? Math.max(0, Math.min(23, parseInt(m[1], 10))) : 12;
  const min = m ? Math.max(0, Math.min(59, parseInt(m[2], 10))) : 0;
  const period: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
  const h12 = ((h24 + 11) % 12) + 1; // 0→12, 1→1, ..., 12→12, 13→1, ..., 23→11

  const emit = (nextH12: number, nextMin: number, nextPeriod: 'AM' | 'PM') => {
    let h = nextH12 % 12;
    if (nextPeriod === 'PM') h += 12;
    const hh = String(h).padStart(2, '0');
    const mm = String(nextMin).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    background: 'transparent',
    border: 'none',
    color: 'var(--ink, #FCFAF6)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 22,
    letterSpacing: '0.04em',
    padding: '8px 6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: 56,
    textAlign: 'center',
    textAlignLast: 'center',
    flex: '0 0 auto',
  };

  const sepStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 22,
    color: 'var(--brass, #C8A052)',
    opacity: 0.55,
    padding: '0 2px',
    userSelect: 'none',
  };

  return (
    <div
      className="time-wheel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 14px',
        border: '1px solid var(--brass, #C8A052)',
        borderRadius: 2,
        background: 'transparent',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <select
        id="ob-hour"
        aria-label="Hour"
        value={h12}
        disabled={disabled}
        onChange={(e) => emit(parseInt(e.target.value, 10), min, period)}
        style={selectStyle}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{String(n).padStart(2, '0')}</option>
        ))}
      </select>
      <span aria-hidden="true" style={sepStyle}>:</span>
      <select
        aria-label="Minute"
        value={min}
        disabled={disabled}
        onChange={(e) => emit(h12, parseInt(e.target.value, 10), period)}
        style={selectStyle}
      >
        {Array.from({ length: 60 }, (_, i) => i).map((n) => (
          <option key={n} value={n}>{String(n).padStart(2, '0')}</option>
        ))}
      </select>
      <span aria-hidden="true" style={{ ...sepStyle, width: 12 }} />
      <select
        aria-label="AM or PM"
        value={period}
        disabled={disabled}
        onChange={(e) => emit(h12, min, e.target.value as 'AM' | 'PM')}
        style={{ ...selectStyle, fontSize: 14, color: 'var(--brass, #C8A052)' }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
