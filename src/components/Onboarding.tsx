"use client";

// Onboarding.tsx — birth data form. Ported from astrology-transits.jsx lines 3516-3685.

import { useState, type FormEvent } from 'react';
import type { BirthData, Gender } from '@/lib/types';
import CityAutocomplete, { type CityHit } from './CityAutocomplete';

export type OnboardingProps = {
  onSave: (user: BirthData) => void;
  initial?: Partial<BirthData>;
};

export default function Onboarding({ onSave, initial }: OnboardingProps) {
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
    setCityCoords({ lat: hit.lat, lon: hit.lon, tzOffset: hit.tzOffset });
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
        <div className="onboard-eyebrow">An Astral Atlas — Volume I</div>
        <h1 className="onboard-title">Twelve traditions. One birth.</h1>
        <p className="onboard-sub">
          Western, Vedic, Kabbalah, Numerology, Chinese BaZi, Human Design, Mayan Tzolk&rsquo;in, Astrocartography, Tarot, Enneagram, Gene Keys, Ayurveda — all pulled from the same date, time, and place.
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
          <label htmlFor="ob-time">Birth time</label>
          <input
            id="ob-time"
            className="time-input"
            type="time"
            value={timeStr}
            disabled={timeUnknown}
            onChange={(e) => setTimeStr(e.target.value)}
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

        <button type="submit" className="onboard-btn">Cast the Atlas</button>
        <button type="button" className="onboard-demo" onClick={loadDemo}>
          Read the demo chart instead
        </button>
      </form>
    </div>
  );
}
