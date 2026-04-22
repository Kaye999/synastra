"use client";

// Dashboard.tsx — 12-tradition editorial dashboard.
//
// Renders all twelve traditions under four categories:
//   Astrological   · Western · Vedic · Chinese · Mayan
//   Symbolic       · Kabbalah · Numerology · Tarot
//   Psychological  · Human Design · Enneagram · Gene Keys · Ayurveda
//   Geographic     · Astrocartography
//
// Each mode either renders an interactive widget (from ./Natal*, ./Tree*,
// ./BodyGraph*, etc.) or an essay-style passage drawn from the interp tables.
// The tab nav is a two-tier system: pick a category up top, pick a tradition
// within it below. On narrow viewports the whole switcher collapses to a
// single horizontally scrolling strip with category labels as dividers.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Starfield from './Starfield';
import PaywallBlur from './PaywallBlur';
import ChatWidget from './ChatWidget';
import SettingsCog from './SettingsCog';
import MorningCup from './MorningCup';
import MonthlyForecast from './MonthlyForecast';
import DeepReadTabs from './DeepReadTabs';
import CompatibilityForm from './CompatibilityForm';
import TransitAlerts from './TransitAlerts';
import Ornament from './Ornament';

// ─── Interactive widgets (shipped overnight) ────────────────────────────────
import NatalChartWheel from './NatalChartWheel';
import TreeOfLife from './TreeOfLife';
import TarotDailyCard from './TarotDailyCard';
import TarotSpread from './TarotSpread';
import EnneagramQuiz from './EnneagramQuiz';
import EnneagramProfile from './EnneagramProfile';
import GeneKeysProfile from './GeneKeysProfile';
import AyurvedaQuiz from './AyurvedaQuiz';
import AyurvedaProfile from './AyurvedaProfile';
import BodyGraphInteractive from './BodyGraphInteractive';
import AstrocartoMap from './AstrocartoMap';

// ─── Engines (existing) ─────────────────────────────────────────────────────
import { computeTropicalChart, computeSiderealChart, computeMahadasha } from '@/lib/engines/astro';
import { computeNumerology, NUM_MEANINGS } from '@/lib/engines/numerology';
import { computeBaZi } from '@/lib/engines/bazi';
import { computeHologeneticProfile } from '@/lib/engines/gene-keys';
import { resolveCityCoords } from '@/lib/constants/cities';

// ─── Engines (porting in parallel — resolved lazily) ────────────────────────
// The sibling agent is landing @/lib/engines/{hd,mayan,astrocarto} in a
// separate PR. Until those files exist, static imports break the build, so
// we resolve them via dynamic import() inside an effect and hold their
// functions in state. Each hook below falls back to `null` when the module
// cannot be loaded, which lets the other eleven traditions render normally.
//
// The engines expose:
//   computeHumanDesign(birth: BirthData)  → HumanDesignResult
//   computeMayan({ y, m, d })             → MayanResult
//   computeAstrocarto(birth, chart)       → AstrocartoResult
//
// Shapes are best-effort-typed here because the files don't exist yet.
type ComputeHumanDesign = (birth: BirthData) => unknown;
type ComputeMayan = (dob: BirthData['dob']) => unknown;
type ComputeAstrocarto = (birth: BirthData, chart: ReturnType<typeof computeTropicalChart>) => unknown;

import {
  SIGN_ESSENCE,
  PLANET_IN_SIGN,
  PLANET_IN_HOUSE,
  NAKSHATRA_ESSENCE,
  DASHA_PERIOD_MEANING,
  KABBALAH_SIGN_PATH_MEANING,
} from '@/lib/interp/tables';

import type { BirthData, Tier, Planet } from '@/lib/types';

// ─── Mode & group taxonomy ──────────────────────────────────────────────────
type Mode =
  | 'astro' | 'vedic' | 'kab' | 'numerology' | 'chinese'
  | 'hd' | 'mayan' | 'astrocarto'
  | 'tarot' | 'enneagram' | 'genekeys' | 'ayurveda';

type ModeGroup = 'astrological' | 'symbolic' | 'psychological' | 'geographic';

const MODE_LABELS: Record<Mode, string> = {
  astro: 'Western',
  vedic: 'Vedic',
  kab: 'Kabbalah',
  numerology: 'Numerology',
  chinese: 'Chinese',
  hd: 'Human Design',
  mayan: 'Mayan',
  astrocarto: 'Astrocartography',
  tarot: 'Tarot',
  enneagram: 'Enneagram',
  genekeys: 'Gene Keys',
  ayurveda: 'Ayurveda',
};

const MODE_GROUPS: Record<ModeGroup, { label: string; modes: Mode[] }> = {
  astrological:  { label: 'Astrological',  modes: ['astro', 'vedic', 'chinese', 'mayan'] },
  symbolic:      { label: 'Symbolic',      modes: ['kab', 'numerology', 'tarot'] },
  psychological: { label: 'Psychological', modes: ['hd', 'enneagram', 'genekeys', 'ayurveda'] },
  geographic:    { label: 'Geographic',    modes: ['astrocarto'] },
};

const GROUP_ORDER: ModeGroup[] = ['astrological', 'symbolic', 'psychological', 'geographic'];

function groupOfMode(m: Mode): ModeGroup {
  for (const g of GROUP_ORDER) {
    if (MODE_GROUPS[g].modes.includes(m)) return g;
  }
  return 'astrological';
}

const CURRENT_YEAR = new Date().getFullYear();

// ─── Helpers ────────────────────────────────────────────────────────────────
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

// ─── Types local to this file ───────────────────────────────────────────────
type EnneagramResultLike = unknown;
type PrakrutiLike = unknown;

export type DashboardProps = {
  user: BirthData;
  tier: Tier;
  onReset?: () => void;
};

export default function Dashboard({ user, tier, onReset }: DashboardProps) {
  // If no handler was passed (server-component case), fall back to clearing
  // the profile and redirecting to onboarding from the client.
  const effectiveOnReset = onReset || (() => {
    if (typeof window !== 'undefined') {
      fetch('/api/profile', { method: 'DELETE' }).finally(() => {
        window.location.href = '/onboarding';
      });
    }
  });
  const [mode, setMode] = useState<Mode>('astro');
  const { userId } = useAuth();

  const firstName = user.name || user.fullName.split(' ')[0] || 'You';
  const activeGroup = groupOfMode(mode);

  const coords = useMemo(() => {
    return resolveCityCoords(user.city) || { lat: -33.87, lon: 151.21, tzOffset: 10 };
  }, [user.city]);

  const astroInput = useMemo(() => ({
    dob: user.dob,
    time: user.time,
    timeUnknown: user.timeUnknown,
    lat: coords.lat,
    lon: coords.lon,
    tzOffset: coords.tzOffset,
  }), [user.dob, user.time, user.timeUnknown, coords]);

  // ─── Chart computations ───────────────────────────────────────────────────
  const tropical = useMemo(() => {
    try {
      return computeTropicalChart(astroInput);
    } catch (e) {
      console.error('[synastra] computeTropicalChart failed:', e);
      return { planets: [], ascendant: null, mc: null, houses: null };
    }
  }, [astroInput]);

  const sidereal = useMemo(() => {
    try {
      return computeSiderealChart(astroInput);
    } catch (e) {
      console.error('[synastra] computeSiderealChart failed:', e);
      return { planets: [], ascendant: null, mc: null, houses: null } as ReturnType<typeof computeSiderealChart>;
    }
  }, [astroInput]);

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

  // ─── Engines under parallel construction — null-safe ──────────────────────
  const geneKeys = useMemo(() => {
    try { return computeHologeneticProfile(user); }
    catch { return null; }
  }, [user]);

  // Lazily-resolved engine functions. If the dynamic import fails (module not
  // yet on disk), these stay null and the relevant mode renders an "engine
  // still resolving" fallback passage.
  const [computeHumanDesign, setComputeHumanDesign] = useState<ComputeHumanDesign | null>(null);
  const [computeMayan, setComputeMayan] = useState<ComputeMayan | null>(null);
  const [computeAstrocarto, setComputeAstrocarto] = useState<ComputeAstrocarto | null>(null);

  useEffect(() => {
    let cancelled = false;

    // While the sibling agent's engine files are in flight, static resolution
    // would fail both the bundler and `tsc`. Indirecting the specifier through
    // a string variable (and suppressing the checker with a localised comment)
    // lets us attempt the import at runtime and cope gracefully when the
    // module is absent.
    async function safeImport<T>(path: string, key: string): Promise<T | null> {
      try {
        const mod = (await import(/* webpackIgnore: true */ path).catch(() => null)) as Record<string, unknown> | null;
        if (mod && typeof mod[key] === 'function') {
          return mod[key] as T;
        }
      } catch { /* ignore */ }
      return null;
    }

    (async () => {
      const [hd, mayan, acg] = await Promise.all([
        safeImport<ComputeHumanDesign>('@/lib/engines/hd', 'computeHumanDesign'),
        safeImport<ComputeMayan>('@/lib/engines/mayan', 'computeMayan'),
        safeImport<ComputeAstrocarto>('@/lib/engines/astrocarto', 'computeAstrocarto'),
      ]);
      if (cancelled) return;
      if (hd) setComputeHumanDesign(() => hd);
      if (mayan) setComputeMayan(() => mayan);
      if (acg) setComputeAstrocarto(() => acg);
    })();

    return () => { cancelled = true; };
  }, []);

  const hdResult = useMemo(() => {
    if (!computeHumanDesign) return null;
    try { return computeHumanDesign(user); }
    catch { return null; }
  }, [computeHumanDesign, user]);

  const mayanResult = useMemo(() => {
    if (!computeMayan) return null;
    try { return computeMayan(user.dob); }
    catch { return null; }
  }, [computeMayan, user.dob]);

  const astrocartoRes = useMemo(() => {
    if (!computeAstrocarto) return null;
    try { return computeAstrocarto(user, tropical); }
    catch { return null; }
  }, [computeAstrocarto, user, tropical]);

  // ─── Enneagram / Ayurveda persisted results — fetched client-side ────────
  // The API may return these on the profile row; if absent, we show the quiz.
  // After a quiz completes, we set the result into local state and re-render
  // into the profile view without a full page reload.
  const [enneagramResult, setEnneagramResult] = useState<EnneagramResultLike | null>(null);
  const [ayurvedaResult, setAyurvedaResult] = useState<PrakrutiLike | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json() as {
          profile?: {
            enneagram?: { result?: EnneagramResultLike } | null;
            ayurveda?: PrakrutiLike | null;
          } | null;
        };
        if (cancelled) return;
        const enn = json.profile?.enneagram?.result ?? null;
        const ayu = json.profile?.ayurveda ?? null;
        if (enn) setEnneagramResult(enn);
        if (ayu) setAyurvedaResult(ayu);
      } catch {
        // ignore — the quizzes remain available
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sunPlanet = tropical.planets.find((p) => planetKey(p.planet) === 'Sun');
  const moonPlanet = tropical.planets.find((p) => planetKey(p.planet) === 'Moon');

  // ─── Oracle chart context ─────────────────────────────────────────────────
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

  // Quiz completion handlers — optimistically update local state; persistence
  // already happens inside the quiz components (POST /api/*/submit).
  const handleEnneagramComplete = useCallback((result: EnneagramResultLike) => {
    setEnneagramResult(result);
  }, []);
  const handleAyurvedaComplete = useCallback((result: PrakrutiLike) => {
    setAyurvedaResult(result);
  }, []);
  const handleQuizError = useCallback((e: string) => {
    console.error('[synastra] quiz error:', e);
  }, []);

  return (
    <div className={`page mode-${mode}`} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />
      <SettingsCog
        user={user}
        onSave={() => { /* persistence is the parent's job */ }}
        onReset={effectiveOnReset}
      />
      <TransitAlerts user={user} firstName={firstName} tier={tier} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '80px 24px 120px' }}>
        {/* ─── Morning Cup + Monthly Forecast (two columns on desktop) ──── */}
        <div
          className="dash-top-grid"
          style={{
            display: 'grid',
            gap: 48,
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            marginBottom: 56,
            alignItems: 'start',
          }}
        >
          <div className="reveal" style={{ animationDelay: '120ms' }}>
            <MorningCup user={user} firstName={firstName} />
          </div>
          <div className="reveal" style={{ animationDelay: '480ms' }}>
            <MonthlyForecast user={user} firstName={firstName} />
          </div>
        </div>

        {/* ─── Mode switcher: two-tier nav (category → tradition) ───────── */}
        <CategoryNav mode={mode} setMode={setMode} activeGroup={activeGroup} />

        {/* Hero */}
        <header className="reveal" style={{ marginBottom: 64, animationDelay: '360ms' }}>
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
            {mode === 'tarot' && 'The Cards'}
            {mode === 'enneagram' && 'Nine Types'}
            {mode === 'genekeys' && 'The Hologenetic Profile'}
            {mode === 'ayurveda' && 'The Three Doshas'}
            {mode === 'hd' && 'The Rave BodyGraph'}
            {mode === 'mayan' && "The Tzolk'in Kin"}
            {mode === 'astrocarto' && 'The World as a Chart'}
          </h1>
          <p className="editorial-sub">
            {mode === 'astro' && 'Tropical zodiac. Whole-sign houses. Read through your rising.'}
            {mode === 'vedic' && 'Lahiri ayanamsa. Whole-sign. Nakshatras and mahadasha periods.'}
            {mode === 'kab' && 'Hebrew letter, Sefira, and path — the arc of the Tree of Life.'}
            {mode === 'numerology' && 'Pythagorean, Chaldean, and gematric readings of the name and date.'}
            {mode === 'chinese' && 'Stems and branches. Day master, luck pillars, five elements.'}
            {mode === 'tarot' && 'Majors and minors drawn for the day, and a spread cast for the question.'}
            {mode === 'enneagram' && 'Thirty-six questions, nine bodies, one centre of gravity.'}
            {mode === 'genekeys' && "Richard Rudd's four Activation keys — Shadow, Gift, Siddhi."}
            {mode === 'ayurveda' && "Vata · Pitta · Kapha. The constitution you were born into."}
            {mode === 'hd' && 'Type, strategy, authority. The Rave mandala read as a machine.'}
            {mode === 'mayan' && "The sacred 260-day count — your galactic kin and tone."}
            {mode === 'astrocarto' && 'Your planetary lines drawn across the earth. Where the sky lands.'}
          </p>
          <hr className="brass-rule" />
        </header>

        {/* ═══════════ ASTROLOGICAL ═══════════════════════════════════════ */}

        {/* ─── WESTERN ───────────────────────────────────────────────── */}
        {mode === 'astro' && (
          <section>
            <PaywallBlur tier={tier} required="reader|depth">
              <div style={{ marginBottom: 48 }}>
                <NatalChartWheel chart={tropical} />
              </div>
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

        {/* ─── MAYAN (reader|depth) ──────────────────────────────────── */}
        {mode === 'mayan' && (
          <PaywallBlur tier={tier} required="reader|depth">
            <MayanPanel data={mayanResult as MayanData} />
          </PaywallBlur>
        )}

        {/* ═══════════ SYMBOLIC ═══════════════════════════════════════════ */}

        {/* ─── KABBALAH (depth only) ─────────────────────────────────── */}
        {mode === 'kab' && (
          <PaywallBlur tier={tier} required="depth">
            <section>
              <div style={{ marginBottom: 48 }}>
                <TreeOfLife />
              </div>
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

        {/* ─── TAROT (reader|depth; celtic-cross gated inside TarotSpread) ─ */}
        {mode === 'tarot' && (
          <section>
            <PaywallBlur tier={tier} required="reader|depth">
              <div style={{ marginBottom: 48 }}>
                <TarotDailyCard
                  userId={userId ?? 'anonymous'}
                  userContext={chartContext}
                  tier={tier}
                />
              </div>
              <Ornament kind="rule" width={220} style={{ margin: '0 auto 40px' }} />
              <TarotSpread
                spreadType="three-card"
                userId={userId ?? 'anonymous'}
                userContext={chartContext}
                tier={tier}
              />
              <div style={{ marginTop: 56 }}>
                <TarotSpread
                  spreadType="celtic-cross"
                  userId={userId ?? 'anonymous'}
                  userContext={chartContext}
                  tier={tier}
                />
              </div>
            </PaywallBlur>
          </section>
        )}

        {/* ═══════════ PSYCHOLOGICAL ══════════════════════════════════════ */}

        {/* ─── HUMAN DESIGN (reader|depth) ─────────────────────────── */}
        {mode === 'hd' && (
          <PaywallBlur tier={tier} required="reader|depth">
            {hdResult ? (
              <BodyGraphInteractive hdResult={hdResult as { activatedGates: number[] }} />
            ) : (
              <EssayBlock
                title="The BodyGraph is still resolving"
                body="Your Human Design chart is being computed. If this persists, ensure your birth time is set — the BodyGraph needs it to map your centres."
              />
            )}
          </PaywallBlur>
        )}

        {/* ─── ENNEAGRAM (reader|depth) ────────────────────────────── */}
        {mode === 'enneagram' && (
          <PaywallBlur tier={tier} required="reader|depth">
            {enneagramResult ? (
              <EnneagramProfile result={enneagramResult as never} />
            ) : (
              <EnneagramQuiz onComplete={handleEnneagramComplete} onError={handleQuizError} />
            )}
          </PaywallBlur>
        )}

        {/* ─── GENE KEYS (depth only — widget also gates internally) ─ */}
        {mode === 'genekeys' && (
          <PaywallBlur tier={tier} required="depth">
            {geneKeys ? (
              <GeneKeysProfile hologenetic={geneKeys} userTier={tier} />
            ) : (
              <EssayBlock
                title="The Activation Sequence is still resolving"
                body="Your Hologenetic Profile is being computed. A Sun-based chart is required; ensure your birth date is set."
              />
            )}
          </PaywallBlur>
        )}

        {/* ─── AYURVEDA (reader|depth) ─────────────────────────────── */}
        {mode === 'ayurveda' && (
          <PaywallBlur tier={tier} required="reader|depth">
            {ayurvedaResult ? (
              <AyurvedaProfile prakruti={ayurvedaResult as never} firstName={firstName} />
            ) : (
              <AyurvedaQuiz onComplete={handleAyurvedaComplete} onError={handleQuizError} />
            )}
          </PaywallBlur>
        )}

        {/* ═══════════ GEOGRAPHIC ═════════════════════════════════════════ */}

        {/* ─── ASTROCARTOGRAPHY (depth only) ───────────────────────── */}
        {mode === 'astrocarto' && (
          <PaywallBlur tier={tier} required="depth">
            {astrocartoRes ? (
              <AstrocartoMap
                chart={tropical}
                birthLocation={{ lat: coords.lat, lon: coords.lon }}
              />
            ) : (
              <EssayBlock
                title="The atlas is still drawing"
                body="Your relocation lines are being computed from your natal chart. A birth time sharpens the map considerably."
              />
            )}
          </PaywallBlur>
        )}

        {/* ─── Deep reads + compatibility (tier-gated within) ──────────── */}
        <div style={{ marginTop: 96 }}>
          <Ornament kind="rule" width={260} style={{ margin: '0 auto 56px' }} />

          <div className="reveal" style={{ animationDelay: '600ms', marginBottom: 96 }}>
            <DeepReadTabs user={user} firstName={firstName} tier={tier} />
          </div>

          <Ornament kind="constellation" width={160} style={{ margin: '0 auto 56px' }} />

          <div className="reveal" style={{ animationDelay: '720ms' }}>
            <CompatibilityForm user={user} firstName={firstName} tier={tier} />
          </div>
        </div>
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

// ─── Category / mode nav ─────────────────────────────────────────────────────
//
// Two-tier: category pills on top, tradition sub-tabs below. Below 720px the
// whole strip collapses to a horizontally-scrollable bar with small category
// labels inline as dividers.

function CategoryNav({
  mode,
  setMode,
  activeGroup,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  activeGroup: ModeGroup;
}) {
  const [compact, setCompact] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 720px)');
    const update = () => setCompact(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  if (compact) {
    // Single-row horizontal scroll with category labels as dividers.
    return (
      <nav
        className="mode-switch reveal"
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 48,
          overflowX: 'auto',
          alignItems: 'center',
          paddingBottom: 6,
          animationDelay: '240ms',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {GROUP_ORDER.map((g, gi) => (
          <span
            key={g}
            style={{ display: 'inline-flex', gap: 12, alignItems: 'center', flexShrink: 0 }}
          >
            {gi > 0 && (
              <span
                aria-hidden="true"
                style={{
                  width: 1,
                  height: 14,
                  background: 'var(--rule)',
                  margin: '0 6px',
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                flexShrink: 0,
              }}
            >
              §&nbsp;{MODE_GROUPS[g].label}
            </span>
            {MODE_GROUPS[g].modes.map((m) => (
              <ModeButton key={m} m={m} active={mode === m} onClick={() => setMode(m)} />
            ))}
          </span>
        ))}
      </nav>
    );
  }

  return (
    <div className="reveal" style={{ marginBottom: 44, animationDelay: '240ms' }}>
      {/* Top row: category pills */}
      <nav
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 20,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 14,
        }}
      >
        {GROUP_ORDER.map((g) => {
          const first = MODE_GROUPS[g].modes[0];
          const isActive = activeGroup === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setMode(first)}
              style={{
                background: 'transparent',
                border: 0,
                padding: '4px 0',
                color: isActive ? 'var(--brass)' : 'var(--ink-dim)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              §&nbsp;{MODE_GROUPS[g].label}
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -15,
                    height: 1,
                    background: 'var(--brass)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom row: tradition sub-tabs within the active category */}
      <nav
        className="mode-switch"
        style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}
      >
        {MODE_GROUPS[activeGroup].modes.map((m) => (
          <ModeButton key={m} m={m} active={mode === m} onClick={() => setMode(m)} />
        ))}
      </nav>
    </div>
  );
}

function ModeButton({
  m,
  active,
  onClick,
}: {
  m: Mode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'active' : ''}
      style={{
        background: 'transparent',
        border: 0,
        padding: '6px 0',
        color: active ? 'var(--brass)' : 'var(--ink-faint)',
        borderBottom: active ? '1px solid var(--brass)' : '1px solid transparent',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {MODE_LABELS[m]}
    </button>
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

// ─── Mayan panel ─────────────────────────────────────────────────────────────
// Pure-presentational fallback. Accepts whatever shape computeMayan returns
// (the engine lands later) and best-effort renders kin / day sign / tone. Any
// interpretation strings on the payload are surfaced as EssayBlocks.

type MayanData = {
  kin?: number;
  tone?: number | string;
  toneName?: string;
  daySign?: string;
  daySignName?: string;
  signInterp?: string;
  toneInterp?: string;
  interpretation?: string;
} | null;

function MayanPanel({ data }: { data: MayanData }) {
  if (!data) {
    return (
      <EssayBlock
        title="The kin is still being counted"
        body="Your Tzolk'in signature is computed from your birth date against the sacred 260-day count. A moment."
      />
    );
  }

  const kin = data.kin;
  const daySign = data.daySignName || data.daySign || '—';
  const tone = data.toneName || data.tone || '—';

  return (
    <section>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div style={{ padding: 20, border: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>
            Kin
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 40, margin: '8px 0' }}>
            {kin ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)' }}>of 260</div>
        </div>
        <div style={{ padding: 20, border: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>
            Day Sign
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, margin: '8px 0' }}>
            {daySign}
          </div>
        </div>
        <div style={{ padding: 20, border: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass)' }}>
            Galactic Tone
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, margin: '8px 0' }}>
            {tone}
          </div>
        </div>
      </div>

      {data.signInterp && (
        <EssayBlock title={`Day Sign · ${daySign}`} body={data.signInterp} />
      )}
      {data.toneInterp && (
        <EssayBlock title={`Tone · ${tone}`} body={data.toneInterp} />
      )}
      {data.interpretation && (
        <EssayBlock title="The kin, integrated" body={data.interpretation} />
      )}
    </section>
  );
}
