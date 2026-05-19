"use client";

// atlases.tsx — three tradition-specific wrappers that compose <SignAtlas />
// with the right data + user placements:
//   - WesternSignAtlas:  12 zodiac signs, user's Sun/Moon/Rising glow
//   - VedicNakshatraAtlas: 27 nakshatras, user's Moon nakshatra glows
//   - NumerologyAtlas: 9 single-digit + 3 master numbers, user's Life Path glows
//
// Each wrapper renders below the existing chart hero on its respective tab.
// All static data (archetype, glyph, dates, prose) is free. Per-sign daily
// AI deepenings sit behind a future PaywallBlur required="reader" (planned
// follow-up, not in this commit).

import SignAtlas, { type AtlasItem } from './SignAtlas';
import { SIGN_ESSENCE } from '@/lib/interp/tables';
import { NAKSHATRA_ESSENCE } from '@/lib/interp/tables';
import { SIGN_ATLAS } from '@/lib/interp/sign-atlas';
import { NAKSHATRA_ATLAS } from '@/lib/interp/nakshatra-atlas';
import { NUMBER_ATLAS } from '@/lib/interp/numerology-atlas';
import { NUM_MEANINGS } from '@/lib/engines/numerology';
import type { Chart, SiderealChart, Nakshatra } from '@/lib/types';

/* ─── helpers ──────────────────────────────────────────────────────────── */

function planetSign(chart: Chart, name: string): string | null {
  const p = chart.planets.find((pl) => pl.planet === name || pl.planet.startsWith(name));
  return p?.sign ?? null;
}

const ZODIAC: readonly (keyof typeof SIGN_ESSENCE)[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const NAKSHATRAS: readonly string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const NUMBER_KEYS: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];

/* ─── Western Sign Atlas ──────────────────────────────────────────────── */

export function WesternSignAtlas({ tropical }: { tropical: Chart }) {
  const userSun = planetSign(tropical, 'Sun');
  const userMoon = planetSign(tropical, 'Moon');
  const userRising = tropical.ascendant?.sign ?? null;

  const items: AtlasItem[] = ZODIAC.map((sign) => {
    const enrich = SIGN_ATLAS[sign];
    const essence = SIGN_ESSENCE[sign];
    const userKind =
      sign === userSun ? 'Sun'
        : sign === userMoon ? 'Moon'
          : sign === userRising ? 'Rising'
            : undefined;

    return {
      id: sign,
      primary: enrich.glyph,
      label: sign,
      meta: enrich.dates,
      isUser: !!userKind,
      userKind,
      detail: <ZodiacDetail sign={sign} />,
    };
  });

  return (
    <SignAtlas
      eyebrow="Western · Sign Atlas"
      title="Twelve archetypes. Read any of them."
      intro="Your Sun, Moon, and Rising glow brass — that's you. Click any other sign to read its archetype, ruler, and the gift / shadow pair it carries."
      items={items}
      columns={4}
      tileShape="tall"
    />
  );
}

function ZodiacDetail({ sign }: { sign: keyof typeof SIGN_ESSENCE }) {
  const enrich = SIGN_ATLAS[sign];
  const essence = SIGN_ESSENCE[sign];
  return (
    <article style={{ maxWidth: 720 }}>
      <Eyebrow>{`${enrich.glyph}  ·  ${enrich.modality}  ${enrich.element}  ·  RULED BY ${enrich.ruler.toUpperCase()}`}</Eyebrow>
      <Headline title={sign} subtitle={enrich.archetype} dates={enrich.dates} />
      <Prose>{essence.body}</Prose>
      <PairRow shadow={essence.shadow} gift={essence.gift} />
      <KeywordRow keywords={enrich.keywords} />
      <FamousRow names={enrich.famousPeople} />
    </article>
  );
}

/* ─── Vedic Nakshatra Atlas ───────────────────────────────────────────── */

export function VedicNakshatraAtlas({ sidereal }: { sidereal: SiderealChart }) {
  const userNakshatra = sidereal.nakshatra?.name ?? null;

  const items: AtlasItem[] = NAKSHATRAS.map((name) => {
    const atlas = NAKSHATRA_ATLAS[name];
    const essence = NAKSHATRA_ESSENCE[name as keyof typeof NAKSHATRA_ESSENCE];
    const isUser = name === userNakshatra;
    return {
      id: name,
      primary: name.charAt(0),
      label: name,
      meta: atlas ? `${atlas.gana} · ${atlas.yoni}` : undefined,
      isUser,
      userKind: isUser ? 'Moon' : undefined,
      detail: <NakshatraDetail name={name} />,
    };
  });

  return (
    <SignAtlas
      eyebrow="Vedic · Nakshatra Atlas"
      title="Twenty-seven lunar mansions."
      intro="Your Moon nakshatra is the night sky you were born under — the emotional ground beneath every Western placement. Click any to read its deity, symbol, gana, and the lunar field it casts."
      items={items}
      columns={6}
      tileShape="square"
    />
  );
}

function NakshatraDetail({ name }: { name: string }) {
  const atlas = NAKSHATRA_ATLAS[name];
  const essence = NAKSHATRA_ESSENCE[name as keyof typeof NAKSHATRA_ESSENCE];
  if (!essence) {
    return <Prose>Details for {name} are being prepared.</Prose>;
  }
  return (
    <article style={{ maxWidth: 720 }}>
      <Eyebrow>
        {atlas
          ? `${atlas.range}  ·  RULED BY ${essence.lord.toUpperCase()}  ·  ${atlas.gana.toUpperCase()} GANA  ·  ${atlas.yoni.toUpperCase()} YONI`
          : `RULED BY ${essence.lord.toUpperCase()}`}
      </Eyebrow>
      <Headline title={name} subtitle={atlas?.keyword || essence.symbol} dates={essence.symbol ? `Symbol: ${essence.symbol}` : undefined} />
      <DetailRow label="Deity">{essence.deity}</DetailRow>
      <Prose>{essence.body}</Prose>
      <DetailRow label="Moon here">{essence.forMoon}</DetailRow>
    </article>
  );
}

/* ─── Numerology Atlas ────────────────────────────────────────────────── */

export function NumerologyAtlas({
  lifePath,
  expression,
  soulUrge,
}: {
  lifePath: number;
  expression: number;
  soulUrge: number;
}) {
  const userKindOf = (n: string): string | undefined => {
    if (String(lifePath) === n) return 'Life Path';
    if (String(expression) === n) return 'Expression';
    if (String(soulUrge) === n) return 'Soul Urge';
    return undefined;
  };

  const items: AtlasItem[] = NUMBER_KEYS.map((n) => {
    const atlas = NUMBER_ATLAS[n];
    const meaning = NUM_MEANINGS[parseInt(n, 10) as keyof typeof NUM_MEANINGS];
    const userKind = userKindOf(n);
    return {
      id: n,
      primary: n,
      label: atlas?.archetype || meaning?.title || `Number ${n}`,
      meta: atlas?.vibration?.slice(0, 28),
      isUser: !!userKind,
      userKind,
      detail: <NumberDetail key={n} num={n} />,
    };
  });

  return (
    <SignAtlas
      eyebrow="Numerology · Number Atlas"
      title="Nine archetypes plus the three master numbers."
      intro="Your Life Path, Expression, and Soul Urge are highlighted. Click any number to read its gift, shadow, and the careers it tends to pull people toward."
      items={items}
      columns={4}
      tileShape="tall"
    />
  );
}

function NumberDetail({ num }: { num: string }) {
  const atlas = NUMBER_ATLAS[num];
  const meaning = NUM_MEANINGS[parseInt(num, 10) as keyof typeof NUM_MEANINGS];
  if (!atlas && !meaning) {
    return <Prose>Details for number {num} are being prepared.</Prose>;
  }
  return (
    <article style={{ maxWidth: 720 }}>
      <Eyebrow>
        {parseInt(num, 10) > 9 ? 'MASTER NUMBER' : 'CORE NUMBER'} · {num}
      </Eyebrow>
      <Headline
        title={atlas?.archetype || meaning?.title || `Number ${num}`}
        subtitle={atlas?.vibration}
        dates={undefined}
      />
      {meaning?.general && <Prose>{meaning.general}</Prose>}
      {atlas?.gift && <DetailRow label="Gift">{atlas.gift}</DetailRow>}
      {atlas?.shadow && <DetailRow label="Shadow">{atlas.shadow}</DetailRow>}
      {atlas?.careers && atlas.careers.length > 0 && (
        <KeywordRow keywords={atlas.careers} />
      )}
      {atlas?.famousPeople && atlas.famousPeople.length > 0 && (
        <FamousRow names={atlas.famousPeople} />
      )}
    </article>
  );
}

/* ─── Shared layout atoms ─────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--brass)',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Headline({
  title,
  subtitle,
  dates,
}: {
  title: string;
  subtitle?: string;
  dates?: string;
}) {
  return (
    <header style={{ marginBottom: 18 }}>
      <h3
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          margin: '0 0 6px',
        }}
      >
        {title}
        {subtitle && (
          <span
            style={{
              fontWeight: 400,
              color: 'rgba(252, 250, 246, 0.62)',
              fontSize: 18,
              marginLeft: 12,
              fontStyle: 'italic',
            }}
          >
            — {subtitle}
          </span>
        )}
      </h3>
      {dates && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'rgba(252, 250, 246, 0.55)',
          }}
        >
          {dates}
        </div>
      )}
    </header>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="chapter-body"
      style={{ margin: '0 0 18px', maxWidth: 64 + 'ch' }}
    >
      {children}
    </p>
  );
}

function PairRow({ shadow, gift }: { shadow: string; gift: string }) {
  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
      <p className="essay-aside" style={{ margin: 0 }}>
        <span className="essay-aside-label" style={{ color: 'var(--ember)' }}>
          SHADOW
        </span>
        {shadow}
      </p>
      <p className="essay-aside" style={{ margin: 0 }}>
        <span className="essay-aside-label" style={{ color: 'var(--brass)' }}>
          GIFT
        </span>
        {gift}
      </p>
    </div>
  );
}

function KeywordRow({ keywords }: { keywords: string[] }) {
  if (!keywords?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
      {keywords.map((k) => (
        <span
          key={k}
          style={{
            padding: '4px 10px',
            border: '1px solid rgba(200, 160, 82, 0.5)',
            borderRadius: 999,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: 'var(--brass)',
            letterSpacing: '0.06em',
          }}
        >
          {k}
        </span>
      ))}
    </div>
  );
}

function FamousRow({ names }: { names: string[] }) {
  if (!names?.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(252, 250, 246, 0.45)',
          marginBottom: 6,
        }}
      >
        Walked by
      </div>
      <div
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: 15,
          lineHeight: 1.7,
          color: 'rgba(252, 250, 246, 0.78)',
          fontStyle: 'italic',
        }}
      >
        {names.join(' · ')}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(252, 250, 246, 0.45)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="chapter-body"
        style={{ margin: 0, maxWidth: 64 + 'ch' }}
      >
        {children}
      </div>
    </div>
  );
}
