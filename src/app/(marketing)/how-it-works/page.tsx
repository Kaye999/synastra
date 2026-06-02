import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import Starfield from '@/components/Starfield';
import Ornament from '@/components/Ornament';
import BrandHome from '@/components/BrandHome';
import Reveal from '../../_marketing/Reveal';

// How it works — editorial longread. Magazine feature energy:
// a wide hero title, a stylised chart-wheel SVG, three-act structure,
// then a deep dive per tradition, then an FAQ, then the CTA.

const SYSTEMS = [
  {
    name: 'Western',
    body:
      'Tropical zodiac. We plot the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, and the lunar nodes against twelve signs and twelve houses, with aspects calculated to arc-minute precision. This is the lineage that runs from Ptolemy through Lilly to modern psychological astrology.',
  },
  {
    name: 'Vedic (Jyotish)',
    body:
      'Sidereal zodiac. The same planetary positions measured against the fixed stars rather than the seasons — roughly 24° behind Western by 2026. We compute your nakshatra (one of 27 lunar mansions), your Vimshottari dasha sequence (which planet runs your life for what years), and your divisional charts.',
  },
  {
    name: 'Kabbalah',
    body:
      'Placements translated onto the Tree of Life. Each planet corresponds to a sephira, each sign to a path. We map where light enters your life (the upper sephirot), where it meets form (the middle), and where it wants to ground (Malkuth) — a structural reading of your psyche.',
  },
  {
    name: 'Numerology (Pythagorean)',
    body:
      'Your Life Path from your birth date, Expression from your full name, Soul Urge from the vowels, and Destiny from the consonants. Reduced to root digits, except the master numbers 11, 22, and 33, which we leave intact. A second, independent reading that often echoes the chart.',
  },
  {
    name: 'Human Design',
    body:
      'A mechanical portrait. Your Type (Generator, Manifestor, Projector, Reflector, or Manifesting Generator), your Strategy and Authority, and which of the nine centres in your bodygraph are defined. Synthesises I Ching, chakras, Kabbalah, and astrology into a single operational map.',
  },
  {
    name: 'Tarot',
    body:
      'A 78-card deck — 22 Major Arcana, 56 Minor — drawn against your natal chart. A daily single card for tone, a three-card spread for past-present-future, a full Celtic Cross for the question that needs ten positions of context.',
  },
  {
    name: 'Astrocartography',
    body:
      'Your natal chart projected across the earth. Each planet draws four lines on the globe — where it rose, set, culminated, and anti-culminated at your moment of birth. Where you stand on the map changes which planetary energies are loudest in your life.',
  },
] as const;

const FAQS = [
  {
    q: 'How accurate do I need my birth time to be?',
    a: 'For your Sun sign, none at all. For your Moon, within a few hours. For your rising sign and houses — which drive a lot of the reading — within five minutes. If you\'re unsure, a birth certificate or a call to the hospital usually resolves it.',
  },
  {
    q: 'Why seven systems and not one?',
    a: 'Each system has a blindspot. Western is strong on psychology, weak on timing. Vedic is the reverse. Numerology and Kabbalah see patterns the star-based systems miss. When seven independent frameworks converge on the same theme, the signal is real — and when they disagree, the disagreement is itself data.',
  },
  {
    q: 'Is the AI just making things up?',
    a: 'No. The Master Oracle is given your full chart in structured form — actual placements, not prose — and is constrained to cite the placements it draws from in each answer. You can verify the reasoning. It is not scraping generic astrology text; it is reading your chart.',
  },
];

export default async function HowItWorksPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  const primaryHref = isSignedIn ? '/chart' : '/sign-up';
  const primaryLabel = isSignedIn ? 'Open your chart →' : 'Begin your chart →';
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />
      <BrandHome />

      <article
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '120px 24px 120px',
        }}
      >
        {/* Title */}
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 18 }}>§ How it works</div>
          </Reveal>
          <Reveal delay={80}>
            <h1
              style={{
                fontFamily: "'Alice', serif",
                fontVariationSettings: '"opsz" 144',
                fontSize: 'clamp(56px, 9vw, 96px)',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: 0.98,
                margin: '0 0 24px',
                color: 'var(--ink)',
              }}
            >
              How we read you
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p
              style={{
                fontFamily: "'Hanken Grotesk', serif",
                fontStyle: 'italic',
                fontSize: 22,
                color: 'var(--ink-dim)',
                maxWidth: '44ch',
                margin: '0 auto',
                lineHeight: 1.45,
              }}
            >
              A long read, in three acts — the moment, the cross-reference, and the translation.
            </p>
          </Reveal>

          {/* Chart wheel hero */}
          <Reveal delay={240}>
            <div className="mk-chart-hero" style={{ marginTop: 48 }}>
              <ChartWheel />
            </div>
          </Reveal>
        </div>

        {/* Longread body */}
        <div className="mk-longread" style={{ marginTop: 40 }}>
          {/* Act 1 */}
          <Reveal>
            <div className="act-label" style={{ marginTop: 72 }}>§ Act 1</div>
          </Reveal>
          <Reveal delay={80}>
            <h2>Your moment.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p>
              Every reading begins with a single instant — the moment you drew your first breath.
              You give us a date, a time, and a place. From those three numbers we plot the sky
              exactly as it stood above your hospital, your home, the cab your mother didn&rsquo;t make
              it out of. We use the Swiss Ephemeris — the same ephemeris used by NASA and by
              working astrologers since 1997 — and compute every body to arc-second precision.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p>
              We do this because a chart is not a generalisation. It is a record of a specific
              relationship between you and the universe at the moment you entered it. The rest of
              the product is built on this one refusal to round.
            </p>
          </Reveal>

          {/* Act 2 */}
          <Reveal>
            <div className="act-label" style={{ marginTop: 56 }}>§ Act 2</div>
          </Reveal>
          <Reveal delay={80}>
            <h2>The cross-reference.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p>
              Most apps read you through one lens. Western, usually. Sometimes Vedic. Occasionally
              numerology as a gimmick. Synastra runs your same birth data through seven
              independent traditions in parallel, each with its own two-thousand-year lineage of
              thought, and then looks at where they agree.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p>
              When three systems separately say <em>communicator</em>, it means something. When
              your Vedic Moon and your Numerology Life Path and your Human Design authority all
              point at the same decision-making style, the pattern has survived every filter we
              could put it through. That is how we know what to trust.
            </p>
          </Reveal>

          {/* Act 3 */}
          <Reveal>
            <div className="act-label" style={{ marginTop: 56 }}>§ Act 3</div>
          </Reveal>
          <Reveal delay={80}>
            <h2>The translation.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p>
              The last step is translation — seven dense symbolic systems into one passage of
              English you can actually read at breakfast. We do this with an AI layer that has
              been given your full chart (not a summary) as structured data, and is constrained
              to cite the specific placements it draws from. No horoscope paste. No hedging. If
              it says <em>expect friction around money in the last week of June</em>, it will show
              you the transit that implies it.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p>
              The result is a reading in your voice — grounded in systems older than the calendar,
              translated into the one you&rsquo;re living in.
            </p>
          </Reveal>

          {/* The seven systems deep dive */}
          <Reveal>
            <div className="act-label" style={{ marginTop: 80 }}>§ The seven systems</div>
          </Reveal>
          <Reveal delay={80}>
            <h2>What each tradition actually sees.</h2>
          </Reveal>

          {SYSTEMS.map((s, i) => (
            <Reveal key={s.name} delay={60 + i * 40}>
              <h3>{s.name}</h3>
              <p>{s.body}</p>
            </Reveal>
          ))}

          {/* FAQ */}
          <Reveal>
            <div className="act-label" style={{ marginTop: 72 }}>§ FAQ</div>
          </Reveal>
          <Reveal delay={80}>
            <h2>The small print.</h2>
          </Reveal>

          <div className="mk-faq" style={{ marginTop: 20 }}>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={60 + i * 40}>
                <details>
                  <summary>{f.q}</summary>
                  <p className="answer">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal>
            <div style={{ textAlign: 'center', margin: '100px 0 40px' }}>
              <Ornament kind="rule" width={240} style={{ marginBottom: 36 }} />
              <Link href={primaryHref} className="mk-cta-giant">
                {primaryLabel}
              </Link>
            </div>
          </Reveal>

          <div
            style={{
              marginTop: 40,
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" className="mk-page-nav-btn">← Home</Link>
            <Link href="/pricing" className="mk-page-nav-btn mk-page-nav-btn-primary">See pricing →</Link>
          </div>
        </div>
      </article>
    </main>
  );
}

// ─── Stylised chart wheel SVG ──────────────────────────────────────────
// Editorial natal-chart bloom: zodiac glyphs on the outer ring, ten planet
// glyphs scattered across the houses, faint house numbers in the inner ring,
// and four aspect lines (two trines, two squares) drawn in brass. Not a real
// chart — a decorative artefact that signals "a chart" with enough density
// to feel substantial.

const ZODIAC_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const PLANETS = [
  { glyph: '☉', ang:  18, r: 158 },
  { glyph: '☽', ang:  68, r: 152 },
  { glyph: '☿', ang:  42, r: 168 },
  { glyph: '♀', ang: 108, r: 156 },
  { glyph: '♂', ang: 144, r: 164 },
  { glyph: '♃', ang: 192, r: 152 },
  { glyph: '♄', ang: 228, r: 168 },
  { glyph: '♅', ang: 268, r: 156 },
  { glyph: '♆', ang: 312, r: 162 },
  { glyph: '♇', ang: 338, r: 150 },
];

// Aspect lines: (planet index a, planet index b, kind).
// trine = 120° flowing (brass solid), square = 90° tense (brass dashed)
const ASPECTS: Array<{ a: number; b: number; kind: 'trine' | 'square' }> = [
  { a: 0, b: 5, kind: 'trine' },
  { a: 1, b: 7, kind: 'trine' },
  { a: 3, b: 6, kind: 'square' },
  { a: 2, b: 8, kind: 'square' },
];

function ChartWheel() {
  const cx = 200;
  const cy = 200;
  const rOuter = 180;
  const rZodiac = 168;
  const rInner = 130;
  const rHouseLabel = 116;
  const rHub = 22;

  const polar = (ang: number, r: number) => {
    const a = (ang - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const sectors = Array.from({ length: 12 }, (_, i) => polar(i * 30, rOuter));
  const planets = PLANETS.map((p) => ({ ...p, ...polar(p.ang, p.r) }));

  return (
    <svg viewBox="0 0 400 400" width="100%" role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="wheel-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.02" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hub-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#C8A052" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C8A052" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft halo behind the wheel */}
      <circle cx={cx} cy={cy} r={rOuter + 14} fill="url(#wheel-glow)" />

      {/* outer ring */}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="currentColor" strokeWidth={0.9} opacity={0.85} />
      {/* zodiac band rule */}
      <circle cx={cx} cy={cy} r={rOuter - 22} fill="none" stroke="currentColor" strokeWidth={0.35} opacity={0.45} />
      {/* inner ring (house border) */}
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="currentColor" strokeWidth={0.45} opacity={0.45} />
      {/* hub */}
      <circle cx={cx} cy={cy} r={rHub} fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.65} />
      <circle cx={cx} cy={cy} r={rHub} fill="url(#hub-glow)" />

      {/* twelve sector dividers (full radius) */}
      <g stroke="currentColor" strokeWidth={0.35} opacity={0.32}>
        {sectors.map((s, i) => (
          <line key={i} x1={cx} y1={cy} x2={s.x} y2={s.y} />
        ))}
      </g>

      {/* cardinal cross (emphasised) — ASC line and MC line */}
      <g stroke="currentColor" strokeWidth={0.8} opacity={0.65}>
        <line x1={cx - rOuter} y1={cy} x2={cx + rOuter} y2={cy} />
        <line x1={cx} y1={cy - rOuter} x2={cx} y2={cy + rOuter} />
      </g>

      {/* ASC / MC tick marks at the cardinal points */}
      <g fill="#C8A052" opacity={0.85}>
        <circle cx={cx - rOuter} cy={cy} r={2.4} />
        <circle cx={cx} cy={cy - rOuter} r={2.4} />
        <circle cx={cx + rOuter} cy={cy} r={2.4} />
        <circle cx={cx} cy={cy + rOuter} r={2.4} />
      </g>

      {/* zodiac glyphs in the outer band */}
      <g
        fill="currentColor"
        opacity={0.78}
        style={{ fontFamily: "'Alice', 'EB Garamond', serif", fontSize: 13, fontWeight: 500 }}
        textAnchor="middle"
      >
        {ZODIAC_GLYPHS.map((g, i) => {
          const { x, y } = polar(i * 30 + 15, rZodiac);
          return <text key={g} x={x} y={y + 4}>{g}</text>;
        })}
      </g>

      {/* house numbers in the inner band */}
      <g
        fill="currentColor"
        opacity={0.35}
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.06em' }}
        textAnchor="middle"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const { x, y } = polar(i * 30 + 15, rHouseLabel);
          return <text key={i} x={x} y={y + 3}>{String(i + 1).padStart(2, '0')}</text>;
        })}
      </g>

      {/* aspect lines — trines solid brass, squares dashed brass */}
      <g stroke="#C8A052" fill="none" opacity={0.55}>
        {ASPECTS.map((asp, i) => {
          const A = planets[asp.a];
          const B = planets[asp.b];
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              strokeWidth={asp.kind === 'trine' ? 0.9 : 0.7}
              strokeDasharray={asp.kind === 'trine' ? undefined : '3 4'}
            />
          );
        })}
      </g>

      {/* planet glyphs */}
      <g
        fill="currentColor"
        style={{ fontFamily: "'EB Garamond', 'Alice', serif", fontSize: 15, fontWeight: 500 }}
        textAnchor="middle"
      >
        {planets.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={9} fill="rgba(8, 12, 24, 0.85)" stroke="currentColor" strokeWidth={0.4} opacity={0.9} />
            <text x={p.x} y={p.y + 5} fill="#C8A052" opacity={0.95}>{p.glyph}</text>
          </g>
        ))}
      </g>

      {/* central sigil */}
      <g
        transform={`translate(${cx} ${cy})`}
        stroke="#C8A052"
        strokeWidth={0.8}
        fill="none"
        opacity={0.9}
      >
        <circle r="7" />
        <circle r="3" fill="#C8A052" opacity={0.6} stroke="none" />
        <path d="M0 -12 L0 12 M-10.4 -6 L10.4 6 M-10.4 6 L10.4 -6" opacity={0.55} />
      </g>
    </svg>
  );
}
