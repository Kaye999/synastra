"use client";

// Dashboard.tsx — 5-mode editorial dashboard. Trimmed, typed port of the main
// App component from astrology-transits.jsx. Renders Western, Vedic, Kabbalah,
// Numerology, and Chinese sections via the engines + interp tables.

import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Starfield from './Starfield';
import PaywallBlur from './PaywallBlur';
import ChatWidget from './ChatWidget';
import SettingsCog from './SettingsCog';

import { computeTropicalChart, computeSiderealChart, computeMahadasha } from '@/lib/engines/astro';
import { computeNumerology, NUM_MEANINGS } from '@/lib/engines/numerology';
import { computeBaZi } from '@/lib/engines/bazi';
import { resolveCityCoords } from '@/lib/constants/cities';
import {
  SIGN_ESSENCE,
  PLANET_IN_SIGN,
  PLANET_IN_HOUSE,
  NAKSHATRA_ESSENCE,
  DASHA_PERIOD_MEANING,
  KABBALAH_SIGN_PATH_MEANING,
} from '@/lib/interp/tables';

import type { BirthData, Tier, Planet } from '@/lib/types';

type Mode = 'astro' | 'vedic' | 'kab' | 'numerology' | 'chinese';

const MODE_LABELS: Record<Mode, string> = {
  astro: 'Western',
  vedic: 'Vedic',
  kab: 'Kabbalah',
  numerology: 'Numerology',
  chinese: 'Chinese',
};

const CURRENT_YEAR = new Date().getFullYear();

function fmtDeg(deg: number | undefined | null): string {
  if (deg == null || isNaN(deg)) return '—';
  const whole = Math.floor(deg);
  const minutes = Math.floor((deg - whole) * 60);
  return `${whole}°${String(minutes).padStart(2, '0')}'`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function planetKey(planetName: string): string {
  if (!planetName) return '';
  return String(planetName).split(/\s+/)[0];
}

const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Rahu: '☊', Ketu: '☋',
};

export type DashboardProps = {
  user: BirthData;
  tier: Tier;
  onReset: () => void;
};

export default function Dashboard({ user, tier, onReset }: DashboardProps) {
  const [mode, setMode] = useState<Mode>('astro');
  const { userId } = useAuth();

  const firstName = user.name || user.fullName.split(' ')[0] || 'You';

  const coords = useMemo(() => {
    return resolveCityCoords(user.city) || { lat: -33.87, lon: 151.21, tzOffset: 10 };
  }, [user.city]);

  const tropical = useMemo(() => {
    try {
      return computeTropicalChart({
        dob: user.dob,
        time: user.time,
        timeUnknown: user.timeUnknown,
        lat: coords.lat,
        lon: coords.lon,
        tzOffset: coords.tzOffset,
      });
    } catch (e) {
      console.error('[synastra] computeTropicalChart failed:', e);
      return { planets: [], ascendant: null, mc: null, houses: null };
    }
  }, [user.dob, user.time, user.timeUnknown, coords]);

  const sidereal = useMemo(() => {
    try {
      return computeSiderealChart({
        dob: user.dob,
        time: user.time,
        timeUnknown: user.timeUnknown,
        lat: coords.lat,
        lon: coords.lon,
        tzOffset: coords.tzOffset,
      });
    } catch (e) {
      console.error('[synastra] computeSiderealChart failed:', e);
      return { planets: [], ascendant: null, mc: null, houses: null } as ReturnType<typeof computeSiderealChart>;
    }
  }, [user.dob, user.time, user.timeUnknown, coords]);

  const dashas = useMemo(() => {
    if (user.timeUnknown) return null;
    const moon = sidereal.planets.find((p) => planetKey(p.planet) === 'Moon');
    if (!moon) return null;
    const birthDate = new Date(Date.UTC(user.dob.y, user.dob.m - 1, user.dob.d, user.time.h, user.time.m));
    try {
      return computeMahadasha(moon.longitude, birthDate);
    } catch {
      return null;
    }
  }, [sidereal, user.dob, user.time, user.timeUnknown]);

  const numerology = useMemo(
    () => computeNumerology(user.fullName, user.dob, CURRENT_YEAR, firstName),
    [user.fullName, user.dob, firstName],
  );

  const bazi = useMemo(
    () => computeBaZi(user.dob, user.time, user.timeUnknown, user.gender, firstName, CURRENT_YEAR),
    [user.dob, user.time, user.timeUnknown, user.gender, firstName],
  );

  const sunPlanet = tropical.planets.find((p) => planetKey(p.planet) === 'Sun');
  const moonPlanet = tropical.planets.find((p) => planetKey(p.planet) === 'Moon');

  // Compact chart context for the oracle. Keep small — this goes in every
  // system prompt. Drop the heavy derived-text fields; the model only needs
  // placements + key numerology/bazi summaries to cite.
  const chartContext = useMemo(() => ({
    birth: {
      name: user.fullName,
      dob: user.dob,
      time: user.timeUnknown ? null : user.time,
      city: user.city,
      gender: user.gender,
    },
    western: {
      ascendant: tropical.ascendant,
      planets: tropical.planets,
    },
    vedic: {
      ascendant: sidereal.ascendant,
      planets: sidereal.planets,
      nakshatra: sidereal.nakshatra ?? null,
    },
    dashas: dashas ? { currentLord: dashas.currentLord, nextLord: dashas.nextLord } : null,
    numerology: {
      lifePath: numerology.lifePath,
      expression: numerology.expression,
      soulUrge: numerology.soulUrge,
      personalYear: numerology.personalYear,
    },
    bazi: {
      pillars: bazi.pillars.map((p) => ({ label: p.label, combined: p.combined, element: p.element, animal: p.animal })),
      dayMaster: bazi.analysis.dayMaster,
    },
  }), [user, tropical, sidereal, dashas, numerology, bazi]);

  return (
    <div className={`page mode-${mode}`} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />
      <SettingsCog
        user={user}
        onSave={() => { /* persistence is the parent's job */ }}
        onReset={onReset}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '80px 24px 120px' }}>
        {/* Mode switcher */}
        <nav className="mode-switch" style={{ display: 'flex', gap: 16, marginBottom: 48, flexWrap: 'wrap' }}>
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={mode === m ? 'active' : ''}
              style={{
                background: 'transparent',
                border: 0,
                padding: '6px 0',
                color: mode === m ? 'var(--brass)' : 'var(--ink-faint)',
                borderBottom: mode === m ? '1px solid var(--brass)' : '1px solid transparent',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </nav>

        {/* Hero */}
        <header style={{ marginBottom: 64 }}>
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
            Synastra — {firstName}&apos;s chart
          </div>
          <h1 className="editorial-hero">
            {mode === 'astro' && 'Planetary Transits'}
            {mode === 'vedic' && 'The Sidereal Chart'}
            {mode === 'kab' && 'The Tree of Life'}
            {mode === 'numerology' && 'The Numerical Field'}
            {mode === 'chinese' && 'Four Pillars of Destiny'}
          </h1>
          <p className="editorial-sub">
            {mode === 'astro' && 'Tropical zodiac. Whole-sign houses. Read through your rising.'}
            {mode === 'vedic' && 'Lahiri ayanamsa. Whole-sign. Nakshatras and mahadasha periods.'}
            {mode === 'kab' && 'Hebrew letter, Sefira, and path — the arc of the Tree of Life.'}
            {mode === 'numerology' && 'Pythagorean, Chaldean, and gematric readings of the name and date.'}
            {mode === 'chinese' && 'Stems and branches. Day master, luck pillars, five elements.'}
          </p>
          <hr className="brass-rule" />
        </header>

        {/* ─── WESTERN ─────────────────────────────────────────────────── */}
        {mode === 'astro' && (
          <section>
            <PaywallBlur tier={tier} required="reader|depth">
              <ChartTable planets={tropical.planets} showHouses={!user.timeUnknown} />
              {tropical.ascendant && (
                <p className="chapter-body">
                  <span className="drop-cap">A</span>scendant in{' '}
                  <em>{tropical.ascendant.sign}</em> at {fmtDeg(tropical.ascendant.deg)}.{' '}
                  {(SIGN_ESSENCE as Record<string, { body: string }>)[tropical.ascendant.sign]?.body}
                </p>
              )}
              {sunPlanet && (
                <EssayBlock
                  title={`Sun in ${sunPlanet.sign}${sunPlanet.house ? ` · ${ordinal(sunPlanet.house)} House` : ''}`}
                  body={
                    (PLANET_IN_SIGN as Record<string, Record<string, string>>).Sun?.[sunPlanet.sign] || ''
                  }
                  footer={
                    sunPlanet.house
                      ? (PLANET_IN_HOUSE as Record<string, Record<number, string>>).Sun?.[sunPlanet.house]
                      : undefined
                  }
                />
              )}
              {moonPlanet && (
                <EssayBlock
                  title={`Moon in ${moonPlanet.sign}${moonPlanet.house ? ` · ${ordinal(moonPlanet.house)} House` : ''}`}
                  body={
                    (PLANET_IN_SIGN as Record<string, Record<string, string>>).Moon?.[moonPlanet.sign] || ''
                  }
                  footer={
                    moonPlanet.house
                      ? (PLANET_IN_HOUSE as Record<string, Record<number, string>>).Moon?.[moonPlanet.house]
                      : undefined
                  }
                />
              )}
            </PaywallBlur>

            {/* Free-tier teaser: sun sign only */}
            {tier === 'free' && sunPlanet && (
              <EssayBlock
                title={`A glance: Sun in ${sunPlanet.sign}`}
                body={(SIGN_ESSENCE as Record<string, { body: string }>)[sunPlanet.sign]?.body || ''}
              />
            )}
          </section>
        )}

        {/* ─── VEDIC (depth only) ─────────────────────────────────────── */}
        {mode === 'vedic' && (
          <PaywallBlur tier={tier} required="depth">
            <section>
              <ChartTable planets={sidereal.planets} showHouses={!user.timeUnknown} />
              {sidereal.nakshatra && (
                <EssayBlock
                  title={`Moon · ${sidereal.nakshatra.name} nakshatra · pada ${sidereal.nakshatra.pada}`}
                  body={
                    (NAKSHATRA_ESSENCE as Record<string, { forMoon: string; body: string }>)[sidereal.nakshatra.name]
                      ?.forMoon || ''
                  }
                />
              )}
              {dashas && (
                <EssayBlock
                  title={`Current mahadasha · ${dashas.currentLord}`}
                  body={
                    ((DASHA_PERIOD_MEANING as Record<string, { body: string; years: number }>)[dashas.currentLord]
                      ?.body || '').replace(/\{firstName\}/g, firstName)
                  }
                />
              )}
            </section>
          </PaywallBlur>
        )}

        {/* ─── KABBALAH (depth only) ─────────────────────────────────── */}
        {mode === 'kab' && (
          <PaywallBlur tier={tier} required="depth">
            <section>
              {tropical.planets.map((p) => {
                const sign = p.sign;
                const data = (KABBALAH_SIGN_PATH_MEANING as Record<string, { letter: string; path: number; tarot: string; body: string; pillarRole: string }>)[sign];
                if (!data) return null;
                const key = planetKey(p.planet);
                return (
                  <EssayBlock
                    key={p.planet}
                    title={`${PLANET_GLYPH[key] || ''} ${key} in ${sign} — ${data.tarot} · ${data.letter}`}
                    body={data.body}
                    footer={data.pillarRole}
                  />
                );
              })}
            </section>
          </PaywallBlur>
        )}

        {/* ─── NUMEROLOGY (reader|depth) ─────────────────────────────── */}
        {mode === 'numerology' && (
          <section>
            <PaywallBlur tier={tier} required="reader|depth">
              <EssayBlock title={`Life Path ${numerology.lifePath} — ${numerology.lifePathObj.title}`} body={numerology.lifePathObj.forYou} footer={numerology.lifePathObj.calc} />
              <EssayBlock title={`Expression ${numerology.expression} — ${numerology.expressionObj.title}`} body={numerology.expressionObj.forYou} footer={numerology.expressionObj.calc} />
              <EssayBlock title={`Soul Urge ${numerology.soulUrge} — ${numerology.soulUrgeObj.title}`} body={numerology.soulUrgeObj.forYou} />
              <EssayBlock title={`Personal Year ${numerology.personalYear} (${CURRENT_YEAR})`} body={numerology.personalYearObj.forYou} />
            </PaywallBlur>

            {tier === 'free' && (
              <EssayBlock
                title={`A glance: Life Path ${numerology.lifePath}`}
                body={NUM_MEANINGS[numerology.lifePath]?.general || ''}
              />
            )}
          </section>
        )}

        {/* ─── CHINESE / BaZi (reader|depth) ─────────────────────────── */}
        {mode === 'chinese' && (
          <section>
            <PaywallBlur tier={tier} required="reader|depth">
              <div className="pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
                {bazi.pillars.map((p) => (
                  <div key={p.key} style={{ padding: 16, border: '1px solid var(--rule)' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>
                      {p.label}
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, margin: '10px 0' }}>
                      {p.stemHz}
                      {p.branchHz}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>{p.combined}</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      {p.yy} {p.element} {p.animal}
                    </div>
                  </div>
                ))}
              </div>

              <EssayBlock title={`Day Master · ${bazi.analysis.dayMaster}`} body={bazi.analysis.strength} />
              <EssayBlock title="Favourable elements" body={bazi.analysis.yongshenNote} />
              <EssayBlock title={`Year ${CURRENT_YEAR} · ${bazi.annual.combined}`} body={bazi.annual.interaction} />
              <EssayBlock title={`Nine Star Ki · ${bazi.nineStar.mainName}`} body={bazi.nineStar.forYou} footer={bazi.nineStar.calc} />
            </PaywallBlur>

            {tier === 'free' && (
              <EssayBlock
                title={`A glance: ${bazi.year.animal} (year pillar)`}
                body={`${bazi.animalTraits.careerAffinity} Strengths: ${bazi.animalTraits.strengths.slice(0, 3).join(', ')}.`}
              />
            )}
          </section>
        )}
      </div>

      <ChatWidget
        chartContext={chartContext}
        firstName={firstName}
        tier={tier}
        userId={userId ?? ''}
      />
    </div>
  );
}

// ─── Small subcomponents ─────────────────────────────────────────────────────
function ChartTable({ planets, showHouses }: { planets: Planet[]; showHouses: boolean }) {
  return (
    <table className="chart-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, marginBottom: 32 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--rule)' }}>
          <th style={{ textAlign: 'left', padding: '8px 6px' }}>Planet</th>
          <th style={{ textAlign: 'left', padding: '8px 6px' }}>Sign</th>
          <th style={{ textAlign: 'left', padding: '8px 6px' }}>Degree</th>
          {showHouses && <th style={{ textAlign: 'left', padding: '8px 6px' }}>House</th>}
        </tr>
      </thead>
      <tbody>
        {planets.map((p) => {
          const key = planetKey(p.planet);
          return (
            <tr key={p.planet} style={{ borderBottom: '1px solid var(--rule)' }}>
              <td style={{ padding: '8px 6px' }}>
                {PLANET_GLYPH[key] || ''} {key}
              </td>
              <td style={{ padding: '8px 6px' }}>{p.sign}</td>
              <td style={{ padding: '8px 6px' }}>{fmtDeg(p.deg)}</td>
              {showHouses && <td style={{ padding: '8px 6px' }}>{p.house ? ordinal(p.house) : '—'}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function EssayBlock({ title, body, footer }: { title: string; body: string; footer?: string }) {
  if (!body) return null;
  return (
    <article style={{ marginBottom: 32 }}>
      <h3
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h3>
      <p className="chapter-body" style={{ margin: 0 }}>
        {body}
      </p>
      {footer && (
        <p style={{ marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--ink-faint)' }}>
          {footer}
        </p>
      )}
    </article>
  );
}
