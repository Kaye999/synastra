"use client";

// Dashboard.tsx — 7-tradition editorial dashboard.
//
// Renders all seven traditions under four categories:
//   Astrological   · Western · Vedic
//   Symbolic       · Kabbalah · Numerology · Tarot
//   Psychological  · Human Design
//   Geographic     · Astrocartography
//
// Each mode either renders an interactive widget (from ./Natal*, ./Tree*,
// ./BodyGraph*, etc.) or an essay-style passage drawn from the interp tables.
// The tab nav is a two-tier system: pick a category up top, pick a tradition
// within it below. On narrow viewports the whole switcher collapses to a
// single horizontally scrolling strip with category labels as dividers.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import Starfield from './Starfield';
import PaywallBlur from './PaywallBlur';
import ChatWidget from './ChatWidget';
import SettingsCog from './SettingsCog';
import MorningCup from './MorningCup';
import DailyRitual from './DailyRitual';
import MonthlyForecast from './MonthlyForecast';
import DeepReadTabs from './DeepReadTabs';
import CompatibilityForm from './CompatibilityForm';
import TransitAlerts from './TransitAlerts';
import Ornament from './Ornament';

// ─── Interactive widgets ────────────────────────────────────────────────────
import NatalChartWheel from './NatalChartWheel';
import TreeOfLife from './TreeOfLife';
import TarotDailyCard from './TarotDailyCard';
import TarotSpread from './TarotSpread';
import BodyGraphInteractive from './BodyGraphInteractive';
import HumanAnatomy from './HumanAnatomy';
import AstrocartoMap from './AstrocartoMap';
import { WesternSignAtlas, VedicNakshatraAtlas, NumerologyAtlas } from './atlases';

// ─── Engines ────────────────────────────────────────────────────────────────
import { computeTropicalChart, computeSiderealChart, computeMahadasha } from '@/lib/engines/astro';
import { computeNumerology, NUM_MEANINGS } from '@/lib/engines/numerology';
import { resolveCityCoords } from '@/lib/constants/cities';

// ─── Engines resolved lazily ────────────────────────────────────────────────
// hd and astrocarto are heavy enough to code-split. Each useState below
// holds null until the dynamic import resolves; widgets fall back to
// "still resolving" placeholders while loading.
//
// Engine files for BaZi, Mayan, Enneagram, Gene Keys, Ayurveda remain on
// disk in /lib/engines/ for future optionality but are no longer wired
// into the UI (2026-05-18 collapse from 12 → 7 traditions).
type ComputeHumanDesign = (birth: BirthData) => unknown;
type ComputeAstrocarto = (birth: BirthData, chart: ReturnType<typeof computeTropicalChart>) => unknown;

import {
  SIGN_ESSENCE,
  PLANET_IN_SIGN,
  PLANET_IN_HOUSE,
  ELEMENT_BALANCE_NOTES,
  MODALITY_BALANCE_NOTES,
  NAKSHATRA_ESSENCE,
  DASHA_PERIOD_MEANING,
  KABBALAH_SIGN_PATH_MEANING,
} from '@/lib/interp/tables';
import { computeChartBalance, formatBalanceSummary } from '@/lib/interp/helpers';

import type { BirthData, Tier, Planet } from '@/lib/types';

// ─── Mode & group taxonomy ──────────────────────────────────────────────────
// Seven traditions across four groups (2026-05-18 — collapsed from 12).
type Mode =
  | 'astro' | 'vedic' | 'kab' | 'numerology'
  | 'hd' | 'astrocarto' | 'tarot';

type ModeGroup = 'astrological' | 'symbolic' | 'psychological' | 'geographic';

const MODE_LABELS: Record<Mode, string> = {
  astro: 'Western',
  vedic: 'Vedic',
  kab: 'Kabbalah',
  numerology: 'Numerology',
  hd: 'Human Design',
  astrocarto: 'Astrocartography',
  tarot: 'Tarot',
};

const MODE_GROUPS: Record<ModeGroup, { label: string; modes: Mode[] }> = {
  astrological:  { label: 'Astrological',  modes: ['astro', 'vedic'] },
  symbolic:      { label: 'Symbolic',      modes: ['kab', 'numerology', 'tarot'] },
  psychological: { label: 'Psychological', modes: ['hd'] },
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

export type DashboardProps = {
  user: BirthData;
  tier: Tier;
  onReset?: () => void;
  /** True when rendering /chart?demo=1 (the J.P. Morgan demo). */
  demo?: boolean;
};

export default function Dashboard({ user, tier, onReset, demo = false }: DashboardProps) {
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

  // Scroll to top whenever the user switches tradition. Without this the
  // page keeps its prior scroll position — read halfway through Western,
  // click Tarot, and you'd land mid-page in the new content. Use 'auto'
  // (instant) on first paint of a new mode so the user always sees the
  // hero / chart wheel first; respect prefers-reduced-motion.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [mode]);

  const firstName = user.name || user.fullName.split(' ')[0] || 'You';
  // activeGroup retained for future per-category routing — not currently rendered.
  void groupOfMode;

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

  // ─── Engines resolved lazily ──────────────────────────────────────────────
  // Heavy compute split into separate webpack chunks. Each stays null until
  // the dynamic import resolves; widgets fall back to "still resolving"
  // placeholders while loading.
  const [computeHumanDesign, setComputeHumanDesign] = useState<ComputeHumanDesign | null>(null);
  const [computeAstrocarto, setComputeAstrocarto] = useState<ComputeAstrocarto | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function safeLoad<T>(loader: () => Promise<Record<string, unknown>>, key: string): Promise<T | null> {
      try {
        const mod = await loader();
        if (mod && typeof mod[key] === 'function') {
          return mod[key] as T;
        }
      } catch { /* swallow — widget falls back to "still resolving" */ }
      return null;
    }

    (async () => {
      const [hd, acg] = await Promise.all([
        safeLoad<ComputeHumanDesign>(() => import('@/lib/engines/hd') as Promise<Record<string, unknown>>, 'computeHumanDesign'),
        safeLoad<ComputeAstrocarto>(() => import('@/lib/engines/astrocarto') as Promise<Record<string, unknown>>, 'computeAstrocarto'),
      ]);
      if (cancelled) return;
      if (hd) setComputeHumanDesign(() => hd);
      if (acg) setComputeAstrocarto(() => acg);
    })();

    return () => { cancelled = true; };
  }, []);

  const hdResult = useMemo(() => {
    if (!computeHumanDesign) return null;
    try { return computeHumanDesign(user); }
    catch { return null; }
  }, [computeHumanDesign, user]);

  const astrocartoRes = useMemo(() => {
    if (!computeAstrocarto) return null;
    try { return computeAstrocarto(user, tropical); }
    catch { return null; }
  }, [computeAstrocarto, user, tropical]);

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
  }), [user, tropical, sidereal, dashas, numerology]);

  return (
    <div className={`page mode-${mode}`} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />

      {/* ── Tradition tabs — fixed at top, always visible while reading. ── */}
      <TraditionTopBar mode={mode} setMode={setMode} />

      {/* Top-left identity cluster: home link + avatar, in one row so they
          can never collide with each other or with the top-right controls
          (Alerts pill, Settings cog). */}
      <div
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Link
          href="/"
          aria-label="Synastra home"
          className="dash-home-pill"
          style={{
            padding: '0 14px',
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: "'Alice', serif",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '0.14em',
            color: 'var(--ink)',
            textDecoration: 'none',
            background: 'rgba(10, 14, 26, 0.72)',
            border: '1px solid rgba(252, 250, 246, 0.10)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 20,
          }}
        >
          <span className="dash-home-icon">←</span>
          <span className="dash-home-word">&nbsp;SYNASTRA</span>
        </Link>
        <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }} />
      </div>

      <SettingsCog
        user={user}
        onSave={() => { /* persistence is the parent's job */ }}
        onReset={effectiveOnReset}
      />
      <TransitAlerts user={user} firstName={firstName} tier={tier} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '150px 24px 120px' }}>
        {/* ─── Daily Ritual strip — planet, affirmation, weekly aspect ──── */}
        <div className="reveal" style={{ animationDelay: '60ms' }}>
          <DailyRitual />
        </div>

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
            <MorningCup user={user} firstName={firstName} demo={demo} />
          </div>
          <div className="reveal" style={{ animationDelay: '480ms' }}>
            <MonthlyForecast user={user} firstName={firstName} demo={demo} />
          </div>
        </div>

        {/* Tradition switcher is rendered as a fixed top bar — see <TraditionTopBar /> below. */}

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
            {mode === 'tarot' && 'The Cards'}
            {mode === 'hd' && 'The Rave BodyGraph'}
            {mode === 'astrocarto' && 'The World as a Chart'}
          </h1>
          <p className="editorial-sub">
            {mode === 'astro' && 'Tropical zodiac. Whole-sign houses. Read through your rising.'}
            {mode === 'vedic' && 'Lahiri ayanamsa. Whole-sign. Nakshatras and mahadasha periods.'}
            {mode === 'kab' && 'Hebrew letter, Sefira, and path — the arc of the Tree of Life.'}
            {mode === 'numerology' && 'Pythagorean, Chaldean, and gematric readings of the name and date.'}
            {mode === 'tarot' && 'Majors and minors drawn for the day, and a spread cast for the question.'}
            {mode === 'hd' && 'Type, strategy, authority. The Rave mandala read as a machine.'}
            {mode === 'astrocarto' && 'Your planetary lines drawn across the earth. Where the sky lands.'}
          </p>
          <hr className="brass-rule" />
        </header>

        {/* ═══════════ ASTROLOGICAL ═══════════════════════════════════════ */}

        {/* ─── WESTERN ───────────────────────────────────────────────── */}
        {mode === 'astro' && (
          <section>
            {/* Chart signature — renders for every tier. This is the "feel like
                it's yours" line built from Asc / Sun / Moon archetype titles. */}
            <ChartSignature
              ascendant={tropical.ascendant}
              sunPlanet={sunPlanet}
              moonPlanet={moonPlanet}
            />

            {/* Chart wheel + planet table — visible to everyone (paid UX then
                layers deeper interpretation, aspects, and other traditions). */}
            <div style={{ marginBottom: 40 }}>
              <NatalChartWheel chart={tropical} />
            </div>

            {/* Sign atlas — 12 zodiac archetypes. User's Sun/Moon/Rising glow. */}
            <WesternSignAtlas tropical={tropical} />

            {/* ── Free-tier reading: Rising / Sun / Moon with shadow + gift,
                plus the chart-weather balance paragraph. Enough to prove
                quality; Mercury/Venus/Mars + houses + aspects + other 11
                traditions live behind the paywall below. */}
            {tropical.ascendant && (
              <EssayBlock
                eyebrow={`Rising · ${tropical.ascendant.sign} at ${fmtDeg(tropical.ascendant.deg)}`}
                title={`${getSignTitle(tropical.ascendant.sign)} — the mask you wear into the room`}
                body={getSignField(tropical.ascendant.sign, 'body')}
                shadow={getSignField(tropical.ascendant.sign, 'shadow')}
                gift={getSignField(tropical.ascendant.sign, 'gift')}
              />
            )}
            {sunPlanet && (
              <EssayBlock
                eyebrow={`Sun · ${sunPlanet.sign}${sunPlanet.house ? ` · ${ordinal(sunPlanet.house)} House` : ''}`}
                title={`${getSignTitle(sunPlanet.sign)} — your core solar note`}
                body={getPlanetInSign('Sun', sunPlanet.sign)}
                shadow={getSignField(sunPlanet.sign, 'shadow')}
                gift={getSignField(sunPlanet.sign, 'gift')}
                footer={
                  sunPlanet.house
                    ? getPlanetInHouse('Sun', sunPlanet.house)
                    : undefined
                }
              />
            )}
            {moonPlanet && (
              <EssayBlock
                eyebrow={`Moon · ${moonPlanet.sign}${moonPlanet.house ? ` · ${ordinal(moonPlanet.house)} House` : ''}`}
                title={`${getSignTitle(moonPlanet.sign)} — the inner weather`}
                body={getPlanetInSign('Moon', moonPlanet.sign)}
                shadow={getSignField(moonPlanet.sign, 'shadow')}
                gift={getSignField(moonPlanet.sign, 'gift')}
                footer={
                  moonPlanet.house
                    ? getPlanetInHouse('Moon', moonPlanet.house)
                    : undefined
                }
              />
            )}

            {/* Element + modality balance — synthesized from *their* chart.
                Works for every tier; it's what makes the reading feel personal. */}
            <ChartWeather
              planets={tropical.planets}
              ascendantSign={tropical.ascendant?.sign}
            />

            {/* ── Reader+ depth: personal planets (Mercury / Venus / Mars),
                the full planet table with houses, and deeper commentary.
                Free tier previews Western via ChartWeather above. */}
            <PaywallBlur tier={tier} required="reader">
              <div style={{ marginTop: 24, marginBottom: 24 }}>
                <h2
                  style={{
                    fontFamily: "'Alice', serif",
                    fontSize: 'clamp(28px, 3vw, 40px)',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    margin: '0 0 6px',
                  }}
                >
                  The inner instruments
                </h2>
                <p style={{ color: 'var(--ink-dim)', fontStyle: 'italic', margin: '0 0 28px' }}>
                  Mercury, Venus, Mars — how you think, love, and move.
                </p>
              </div>
              {(['Mercury', 'Venus', 'Mars'] as const).map((planetName) => {
                const p = tropical.planets.find((x) => planetKey(x.planet) === planetName);
                if (!p) return null;
                return (
                  <EssayBlock
                    key={planetName}
                    eyebrow={`${planetName} · ${p.sign}${p.house ? ` · ${ordinal(p.house)} House` : ''}`}
                    title={`${planetName} in ${p.sign}`}
                    body={getPlanetInSign(planetName, p.sign)}
                    footer={p.house ? getPlanetInHouse(planetName, p.house) : undefined}
                  />
                );
              })}
              <div style={{ marginTop: 32 }}>
                <ChartTable planets={tropical.planets} showHouses={!user.timeUnknown} />
              </div>
            </PaywallBlur>
          </section>
        )}

        {/* ─── VEDIC (reader+; free tier gets Moon-nakshatra preview) ──── */}
        {mode === 'vedic' && (
          <section>
            {/* Nakshatra atlas — 27 lunar mansions. User's Moon nakshatra glows. */}
            <VedicNakshatraAtlas sidereal={sidereal} />

            {tier === 'free' && sidereal.nakshatra && (
              <EssayBlock
                title={`A glance: Moon · ${sidereal.nakshatra.name} nakshatra`}
                body={
                  (NAKSHATRA_ESSENCE as Record<string, { forMoon: string; body: string }>)[sidereal.nakshatra.name]
                    ?.forMoon || ''
                }
              />
            )}
            <PaywallBlur tier={tier} required="reader">
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
            </PaywallBlur>
          </section>
        )}

        {/* ═══════════ SYMBOLIC ═══════════════════════════════════════════ */}

        {/* ─── KABBALAH (reader+) ───────────────────────────────────── */}
        {mode === 'kab' && (
          <PaywallBlur tier={tier} required="reader">
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

        {/* ─── NUMEROLOGY (reader+; free tier gets Life Path preview) ── */}
        {mode === 'numerology' && (
          <section>
            {/* Number atlas — 9 + 3 master numbers. User's Life Path / Expression / Soul Urge glow. */}
            <NumerologyAtlas
              lifePath={numerology.lifePath}
              expression={numerology.expression}
              soulUrge={numerology.soulUrge}
            />

            <PaywallBlur tier={tier} required="reader">
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

        {/* ─── TAROT (depth only) ──────────────────────────────────── */}
        {mode === 'tarot' && (
          <section>
            <PaywallBlur tier={tier} required="depth">
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

        {/* ─── HUMAN DESIGN (reader+) ─────────────────────────────── */}
        {mode === 'hd' && (
          <PaywallBlur tier={tier} required="reader">
            {hdResult ? (
              <>
                <BodyGraphInteractive hdResult={hdResult as { activatedGates: number[] }} />
                <HumanAnatomy
                  hdResult={hdResult as { activatedGates: number[]; definedCenters?: readonly string[] }}
                />
              </>
            ) : (
              <EssayBlock
                title="The BodyGraph is still resolving"
                body="Your Human Design chart is being computed. If this persists, ensure your birth time is set — the BodyGraph needs it to map your centres."
              />
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


// ─── Small subcomponents ─────────────────────────────────────────────────────
function ChartTable({ planets, showHouses }: { planets: Planet[]; showHouses: boolean }) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 32 }}>
    <table className="chart-table" style={{ width: '100%', minWidth: 360, borderCollapse: 'collapse', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
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
    </div>
  );
}

// ─── Interp helpers for the Western reading ──────────────────────────
// Shape-coercers so TypeScript stops yelling at the looked-up-by-key style.
function getSignField(sign: string | undefined, field: 'title' | 'body' | 'shadow' | 'gift' | 'element' | 'ruler'): string {
  if (!sign) return '';
  const rec = (SIGN_ESSENCE as Record<string, Record<string, string>>)[sign];
  return rec?.[field] ?? '';
}
function getSignTitle(sign: string | undefined): string {
  return getSignField(sign, 'title') || sign || '';
}
function getPlanetInSign(planet: string, sign: string | undefined): string {
  if (!sign) return '';
  const rec = (PLANET_IN_SIGN as Record<string, Record<string, string>>)[planet];
  return rec?.[sign] ?? '';
}
function getPlanetInHouse(planet: string, house: number | null | undefined): string {
  if (!house) return '';
  const rec = (PLANET_IN_HOUSE as Record<string, Record<number, string>>)[planet];
  return rec?.[house] ?? '';
}

// Chart signature — the 3-word archetype that opens the Western reading.
// "THE TENDER · THE SOVEREIGN · THE DIPLOMAT" + a small subtitle of the
// actual sign names. Feels uniquely theirs immediately.
function ChartSignature({
  ascendant,
  sunPlanet,
  moonPlanet,
}: {
  ascendant: { sign: string } | null | undefined;
  sunPlanet: Planet | undefined;
  moonPlanet: Planet | undefined;
}) {
  const ascTitle = getSignTitle(ascendant?.sign);
  const sunTitle = getSignTitle(sunPlanet?.sign);
  const moonTitle = getSignTitle(moonPlanet?.sign);
  if (!ascTitle && !sunTitle && !moonTitle) return null;
  const triple = [ascTitle, sunTitle, moonTitle].filter(Boolean).join(' · ');
  const subtitle = [
    ascendant?.sign && `${ascendant.sign} rising`,
    sunPlanet?.sign && `${sunPlanet.sign} sun`,
    moonPlanet?.sign && `${moonPlanet.sign} moon`,
  ].filter(Boolean).join(' · ');
  return (
    <div
      style={{
        padding: '28px 0 36px',
        marginBottom: 32,
        borderBottom: '1px solid var(--rule)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 14,
        }}
      >
        § Your signature
      </div>
      <h2
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 'clamp(24px, 3.2vw, 36px)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          margin: '0 0 10px',
        }}
      >
        {triple}
      </h2>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', serif",
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--ink-dim)',
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// Chart weather — element + modality balance synthesised from the
// user's personal planets + ascendant. Makes the reading feel computed
// for *them*, not templated.
function ChartWeather({
  planets,
  ascendantSign,
}: {
  planets: Planet[];
  ascendantSign?: string;
}) {
  const balance = computeChartBalance(planets, ascendantSign);
  // Each element/modality entry is { low, balanced, high } — pick based on
  // how many planets we counted in that bucket. 0–1 = low, 2–3 = balanced, 4+ = high.
  const tier = (n: number): 'low' | 'balanced' | 'high' =>
    n >= 4 ? 'high' : n >= 2 ? 'balanced' : 'low';
  const elementBlock =
    (ELEMENT_BALANCE_NOTES as Record<string, Record<'low' | 'balanced' | 'high', string>>)[balance.dominantElement];
  const modalityBlock =
    (MODALITY_BALANCE_NOTES as Record<string, Record<'low' | 'balanced' | 'high', string>>)[balance.dominantModality];
  const elementNote = elementBlock?.[tier(balance.elements[balance.dominantElement])] ?? '';
  const modalityNote = modalityBlock?.[tier(balance.modalities[balance.dominantModality])] ?? '';
  const elementSummary = formatBalanceSummary(balance.elements);
  const modalitySummary = formatBalanceSummary(balance.modalities);
  return (
    <article style={{ marginTop: 48, marginBottom: 40 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 8,
        }}
      >
        § Weather
      </div>
      <h3
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          margin: '0 0 14px',
        }}
      >
        {balance.dominantElement}-dominant {balance.dominantModality}
      </h3>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 14,
          letterSpacing: '0.06em',
          lineHeight: 1.5,
          color: 'var(--ink-dim)',
          margin: '0 0 18px',
        }}
      >
        elements: {elementSummary} &nbsp;·&nbsp; modalities: {modalitySummary}
      </p>
      {elementNote && <p className="chapter-body" style={{ margin: '0 0 10px' }}>{elementNote}</p>}
      {modalityNote && <p className="chapter-body" style={{ margin: 0 }}>{modalityNote}</p>}
    </article>
  );
}

function EssayBlock({
  title,
  body,
  shadow,
  gift,
  footer,
  eyebrow,
}: {
  title: string;
  body: string;
  shadow?: string;
  gift?: string;
  footer?: string;
  eyebrow?: string;
}) {
  if (!body) return null;
  return (
    <article className="essay-block">
      {eyebrow && (
        <div
          className="essay-eyebrow"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h3
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.25,
          margin: '0 0 18px',
        }}
      >
        {title}
      </h3>
      <p className="chapter-body" style={{ margin: 0 }}>
        {body}
      </p>
      {(shadow || gift) && (
        <div style={{ marginTop: 22, display: 'grid', gap: 12 }}>
          {shadow && (
            <p className="essay-aside">
              <span className="essay-aside-label" style={{ color: 'var(--ember)' }}>
                SHADOW
              </span>
              {shadow}
            </p>
          )}
          {gift && (
            <p className="essay-aside">
              <span className="essay-aside-label" style={{ color: 'var(--brass)' }}>
                GIFT
              </span>
              {gift}
            </p>
          )}
        </div>
      )}
      {footer && (
        <p
          style={{
            marginTop: 18,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--ink-faint)',
          }}
        >
          {footer}
        </p>
      )}
    </article>
  );
}


// ─── Tradition top bar ──────────────────────────────────────────────────────
//
// Single fixed row of all 7 traditions at the top of every chart page.
// Replaces the previous two-tier (Category → Tradition) nav — with only 7
// items the category layer was just noise. Sits between the corner
// identity cluster (top-left) and the controls cluster (top-right).
//
// Active state: brass colour + 2px brass underline.
// Hover: ink colour (no underline yet).
// Mobile: horizontal scroll with brass momentum.

const TRADITION_TAB_ORDER: readonly Mode[] = [
  'astro',        // Western
  'vedic',
  'numerology',
  'kab',          // Kabbalah
  'hd',           // Human Design
  'tarot',
  'astrocarto',   // Astrocartography
];

function TraditionTopBar({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <nav
      aria-label="Synastra traditions"
      style={{
        position: 'fixed',
        // Sit BELOW the 14+40=54px corner control row (logo + UserButton
        // top-left, Alerts + SettingsCog top-right). Gives both rows clear
        // space — no overlap, neat horizontal axis.
        top: 68,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 14, 26, 0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(252, 250, 246, 0.04)',
        borderBottom: '1px solid rgba(252, 250, 246, 0.06)',
        padding: '0 24px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}
      >
        {TRADITION_TAB_ORDER.map((m, i) => {
          const active = mode === m;
          return (
            <span key={m} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: 'rgba(252, 250, 246, 0.18)',
                    margin: '0 8px',
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => setMode(m)}
                className={active ? 'active' : ''}
                style={{
                  background: 'transparent',
                  border: 0,
                  // Vertical padding 14px gives a 44px touch target on mobile
                  // (Apple HIG minimum) while keeping the typography compact.
                  padding: '14px 6px',
                  color: active ? 'var(--brass)' : 'rgba(252, 250, 246, 0.62)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(252, 250, 246, 0.62)';
                  }
                }}
              >
                {MODE_LABELS[m]}
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      bottom: 2,
                      height: 2,
                      background: 'var(--brass)',
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
