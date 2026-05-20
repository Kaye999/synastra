import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import HomepageBackground from '@/components/HomepageBackground';
import Ornament from '@/components/Ornament';
import Reveal from './_marketing/Reveal';
import LineageScroller from './_marketing/LineageScroller';

// ─── Landing page ────────────────────────────────────────────────────
// Synastra marketing home. Server component; the Reveal wrapper is the
// only client-side component, used for scroll-in animations.
//
// Auth-aware CTAs: Clerk's <SignUp /> redirects signed-in users back to
// "/" if they land on /sign-up, which made every hero CTA appear broken
// for returning users. Resolve the target once per request: signed-in
// users get "Open your chart" → /chart; signed-out users get
// "Begin your chart" → /sign-up.

const TRADITIONS = [
  {
    name: 'Western',
    accent: 'var(--western)',
    meta: 'Tropical zodiac',
    body: 'Your natal chart in the lineage of Ptolemy — planets, houses, aspects read against the seasons.',
  },
  {
    name: 'Vedic',
    accent: 'var(--vedic)',
    meta: 'Sidereal · Jyotish',
    body: 'The fixed-star zodiac of India. Nakshatras, dashas, and karmic timing drawn from your true stellar position.',
  },
  {
    name: 'Kabbalah',
    accent: 'var(--kabbalah)',
    meta: 'Tree of Life',
    body: 'Your placements mapped to the sephirot — where light enters your life, and where it meets a shadow.',
  },
  {
    name: 'Numerology',
    accent: 'var(--numerology)',
    meta: 'Pythagorean',
    body: 'Life Path, Expression, Soul Urge, Destiny — the numbers hidden in your birth date and name.',
  },
  {
    name: 'Human Design',
    accent: 'var(--humandesign)',
    meta: 'Bodygraph',
    body: 'Type, strategy, authority, and your defined centres — a mechanical portrait of how your energy moves.',
  },
  {
    name: 'Tarot',
    accent: 'var(--brass)',
    meta: '78-card deck',
    body: 'A daily card and a full spread cast for the question — Majors and Minors drawn against your chart.',
  },
  {
    name: 'Astrocartography',
    accent: 'var(--cartography)',
    meta: 'Relocation lines',
    body: 'The planetary lines across the earth — where on the map you are most likely to love, work, and break open.',
  },
] as const;

const INTELLIGENCE = [
  {
    title: 'Daily Guidance',
    body:
      'A morning reading, written fresh each day. We plot today\'s sky against your natal chart and surface the one or two transits that matter. You wake up with a short passage, not a horoscope — personal, directional, precise.',
  },
  {
    title: 'Monthly Forecast',
    body:
      'A five-section arc-report at every new moon. Career, love, shadow, wealth, integration. The report knows which month of your life this is and writes to it — a letter from your own chart about the weather ahead.',
  },
  {
    title: 'Master Oracle',
    body:
      'Ask anything. The Master Oracle has read your complete chart across all seven traditions — and is fluent in general astrology, astronomy, and the traditional archetypes besides. It answers in your voice, with the placement it drew from named. No generic advice. No guesswork.',
  },
  {
    title: 'Transit Alerts',
    body:
      'When Saturn crosses your Sun or Jupiter lights your tenth house, you get a quiet ping. We watch the sky so you don\'t have to, and only speak when something in your chart is actually activated. No daily noise, no zodiac-wide alerts — just the few moments per year that are genuinely yours.',
  },
] as const;

const PERSONAS = [
  {
    who: 'The Seeker',
    desc: 'Looking for language for something they already feel is true. The pull is older than the curiosity — they want the names the body has been carrying. Synastra gives them the cartography for the inner weather they have always lived inside.',
  },
  {
    who: 'The Strategist',
    desc: 'Treats timing as a variable — and wants a second read on the year. Reads the sky the way other people read the bond market: as signal, as season, as a quiet leading indicator. Synastra is the operator-grade chart they can plan a quarter against.',
  },
  {
    who: 'The Student',
    desc: 'Reads charts for themselves and their people; wants every system, cross-referenced. Builds the case slowly, comparing Western to Vedic to numerology until the pattern declares itself. Synastra is the only place that runs seven traditions in one motion.',
  },
] as const;

const QUOTES = [
  {
    text: '"I have used three astrology apps. This is the first one that read me back to myself."',
    who: '— M.L., Melbourne',
  },
  {
    text: '"The monthly forecast called the week I left the job. I went back and re-read it after."',
    who: '— R.T., Brooklyn',
  },
  {
    text: '"I finally understand what my Vedic chart was trying to say. Seven systems, one page."',
    who: '— A.J., London',
  },
] as const;

const PRICING_PREVIEW = [
  {
    name: 'The Two',
    price: 'Free',
    alt: 'No card, forever',
    tag: 'Start with the classics.',
    bullets: ['Western (Sun · Moon · Rising)', 'Numerology (Life Path preview)', 'Full natal chart view', 'Keep your chart forever'],
  },
  {
    name: 'The Five',
    price: 'A$19 / mo',
    alt: 'or A$129 / year · save A$99',
    tag: 'Five traditions, fully unlocked.',
    bullets: [
      'Full Western · Vedic · Numerology',
      '+ Kabbalah · Human Design',
      'Daily Guidance · Monthly Forecast',
      '10 Oracle AI questions / day',
    ],
    featured: true,
  },
  {
    name: 'The Seven',
    price: 'A$39 / mo',
    alt: 'or A$259 / year · save A$209',
    tag: 'All seven. Cross-woven.',
    bullets: [
      'Everything in The Five',
      '+ Tarot · Astrocartography',
      'Transit alerts · Compatibility',
      'Unlimited Master Oracle (7 traditions + astrology + astronomy + archetypes)',
    ],
  },
] as const;

const LINEAGE = [
  {
    name: 'J.P. Morgan',
    era: '1837 – 1913',
    quote: '“Millionaires don’t use astrology. Billionaires do.”',
    attrib: 'Attributed to J.P. Morgan',
    body: 'Morgan kept Evangeline Adams on retainer. She ran her astrological practice from a suite in Carnegie Hall, read for Charlie Chaplin and Mary Pickford, called the 1929 crash the day before Black Thursday broke, and was acquitted of fortune-telling charges in 1914 after reading a judge’s son’s chart from a blind birth date. In her 1926 memoir The Bowl of Heaven she wrote: “I do know about the late J.P. Morgan’s belief in astrology — because I taught it to him.”',
  },
  {
    name: 'Queen Elizabeth I',
    era: '1533 – 1603',
    quote: '“My ubiquitous philosopher.”',
    attrib: 'Elizabeth I, of her astrologer John Dee (Dee’s Compendious Rehearsal, 1592)',
    body: 'Robert Dudley asked Dee — mathematician, astrologer, and the Queen’s most-trusted scholar — to elect an astrologically favourable date for her coronation. Dee chose 15 January 1559. Elizabeth reigned forty-five years, oversaw the defeat of the Spanish Armada, and established the cultural foundation of modern England. Dee continued to advise her privately for decades.',
  },
  {
    name: 'Isaac Newton',
    era: '1643 – 1727',
    quote: '“Newton was not the first of the age of reason. He was the last of the magicians.”',
    attrib: 'John Maynard Keynes, “Newton, the Man” (delivered 1946)',
    body: 'Keynes bought the Portsmouth Papers — a trunk of Newton’s unpublished writings — at Sotheby’s in July 1936. Inside: a million words on alchemy, biblical prophecy, and Hermetic philosophy, a quarter of Newton’s life’s writing. The man who gave us calculus and gravitation spent his nights trying to transmute lead into gold and decode the Book of Revelation.',
  },
  {
    name: 'Carl Jung',
    era: '1875 – 1961',
    quote: '“We are born at a given moment, in a given place, and like vintage years of wine we have the qualities of the year and season in which we are born.”',
    attrib: 'Carl Jung, on astrology',
    body: 'Jung cast natal charts for his patients throughout his career. His doctrine of synchronicity — the meaningful coincidence — emerged from his study of astrology and the I Ching. Modern psychological astrology is almost entirely downstream of his work.',
  },
  {
    name: 'Ronald Reagan',
    era: '1911 – 2004 · 40th US President',
    quote: '“Virtually every major move and decision the Reagans made during my time as White House Chief of Staff was cleared in advance with a woman in San Francisco who drew up horoscopes to make certain that the planets were in a favorable alignment for the enterprise.”',
    attrib: 'Donald Regan, For the Record: From Wall Street to Washington (1988)',
    body: 'Astrologer Joan Quigley worked with Nancy and Ronald Reagan throughout both presidential terms. Air Force One take-off times, summit dates with Gorbachev, State of the Union scheduling — all cleared against her charts. The story broke in 1988 via the Chief of Staff’s own memoir.',
  },
  {
    name: 'Nikola Tesla',
    era: '1856 – 1943',
    quote: '“Though free to think and act, we are held together, like the stars in the firmament, with ties inseparable. These ties cannot be seen, but we can feel them.”',
    attrib: 'Nikola Tesla, My Inventions (1919)',
    body: 'Tesla required hotel rooms whose numbers were divisible by three. He demanded exactly eighteen napkins at every meal. He circled a city block three times before entering — even the Waldorf-Astoria. He never explained why, only that the number held something he could feel but not articulate. The numerology his instincts pointed at is the same one Pythagoras formalised two millennia earlier.',
  },
  {
    name: 'Beyoncé',
    era: 'b. 1981',
    quote: '“I am a Virgo to the tee! I wonder what my life would be like if I wasn’t a Virgo.”',
    attrib: 'Beyoncé, 2011',
    body: 'Beyoncé references her Virgo Sun and Scorpio Moon in interviews and in her albums. The imagery through Lemonade, Renaissance, and Cowboy Carter is dense with astrological and Yoruba deity symbolism. An artist who mines her chart for material, publicly, at global scale.',
  },
  {
    name: 'Madonna',
    era: 'b. 1958',
    quote: '“I don’t see Kabbalah as a religion. I see it as a philosophy, a way of looking at the world and a method for dealing with it.”',
    attrib: 'Madonna, on Kabbalah',
    body: 'Madonna has been a serious student of Kabbalah since the late 1990s under Rabbi Philip Berg. She famously wears the red string, co-founded the Raising Malawi charity alongside Kabbalah Centre figures, and has credited the practice as the through-line of her adult life. Twenty-plus years in — before it was fashionable, after it went mainstream, still practising.',
  },
] as const;

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  const primaryHref = isSignedIn ? '/chart' : '/sign-up';
  const primaryNavLabel = isSignedIn ? 'Your chart →' : 'Begin your chart →';
  const primaryHeroLabel = isSignedIn ? 'Open your chart →' : 'See your chart →';
  const primaryFooterLabel = isSignedIn ? 'Open your chart →' : 'Begin your chart →';

  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Night → dawn scroll-tied background. Its own stars + sun + horizon
         layers replace the per-page <Starfield /> that used to live here. */}
      <HomepageBackground />

      {/* ── STICKY NAV ─────────────────────────────────────────────── */}
      <nav className="mk-nav">
        <Link href="/" className="mk-nav-brand">SYNASTRA</Link>
        <div className="mk-nav-links">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          {!isSignedIn && <Link href="/sign-in" className="mk-nav-signin">Sign in</Link>}
          <Link href={primaryHref} className="mk-nav-cta">{primaryNavLabel}</Link>
        </div>
      </nav>

      {/* ── 1. HERO ────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '120px 24px 80px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <Reveal>
            <div className="mk-brand-eyebrow">EST · 2026  ·  SYDNEY</div>
          </Reveal>
          <Reveal delay={60}>
            <div className="mk-wordmark">
              <span>SYNASTRA</span>
              <span className="mk-wordmark-ornament"><Ornament kind="asterism" /></span>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="mk-hero-rule" />
          </Reveal>
          <Reveal delay={220}>
            <h1 className="mk-hero-title">Seven traditions. One chart. One Oracle.</h1>
          </Reveal>
          <Reveal delay={300}>
            <p className="mk-hero-sub">
              Personal intelligence, drawn from systems older than the calendar.
              <br />
              <span className="mk-hero-sub-dim">
                Western · Vedic · Numerology · Kabbalah · Human Design · Tarot · Astrocartography
              </span>
            </p>
          </Reveal>
          <Reveal delay={380}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href={primaryHref} className="mk-cta-giant">
                {primaryHeroLabel}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={460}>
            <div className="mk-hero-lineage">
              <span className="mk-hero-lineage-label">§ The lineage &nbsp;</span>
              J.P. Morgan · Queen Elizabeth I · Isaac Newton · Carl Jung · Ronald Reagan · Nikola Tesla · Beyoncé · Madonna
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2. J.P. MORGAN PANEL ───────────────────────────────────── */}
      <section className="mk-lineage-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-lineage-header">
          <Reveal>
            <Ornament kind="asterism" />
          </Reveal>
          <Reveal delay={80}>
            <div className="mk-eyebrow" style={{ marginTop: 20 }}>§ The Lineage</div>
          </Reveal>
          <Reveal delay={160}>
            <h2 className="mk-lineage-title">Who else kept an astrologer.</h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mk-lineage-sub">
              Scroll through ten figures whose relationship with these systems is a matter of public record.
            </p>
          </Reveal>
        </div>

        <LineageScroller figures={LINEAGE} />

        <div className="mk-lineage-hint">
          <span>Drag or swipe · auto-scrolls when idle</span>
        </div>
      </section>

      {/* ── 3. THE EIGHT ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ The Seven</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mk-section-title">One birth moment. Seven independent readings.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mk-prose">
              Each tradition sees something the others miss. Synastra runs them all from the same
              date, time, and place — then shows you where they agree, and where they argue.
            </p>
          </Reveal>

          <div className="mk-eight-strip">
            {TRADITIONS.map((t, i) => (
              <Reveal key={t.name} delay={120 + i * 40}>
                <article className="mk-trad-card">
                  <div className="accent-dot" style={{ background: t.accent }} />
                  <div className="trad-meta">{t.meta}</div>
                  <h3 className="trad-name">{t.name}</h3>
                  <p className="trad-body">{t.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. THE INTELLIGENCE LAYER ──────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 24px 120px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ The Intelligence Layer</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mk-section-title">Not a horoscope app. A standing interpreter.</h2>
          </Reveal>

          <div className="mk-intel-grid">
            {INTELLIGENCE.map((b, i) => (
              <Reveal key={b.title} delay={120 + i * 80}>
                <div className="mk-intel-cell">
                  <Ornament kind="constellation" width={68} style={{ margin: 0 }} />
                  <h3 className="mk-block-title">{b.title}</h3>
                  <p className="mk-prose">{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. WHO IT'S FOR ────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ Who it&rsquo;s for</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mk-section-title">Three readers. One atlas.</h2>
          </Reveal>

          <div className="mk-personas">
            {PERSONAS.map((p, i) => (
              <Reveal key={p.who} delay={120 + i * 80}>
                <div className="mk-persona">
                  <p className="who">{p.who}</p>
                  <p className="desc">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PROOF / QUOTES ──────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ From readers</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mk-section-title">What they said after the first reading.</h2>
          </Reveal>

          <div className="mk-quotes">
            {QUOTES.map((q, i) => (
              <Reveal key={q.who} delay={120 + i * 80}>
                <figure className="mk-quote">
                  <blockquote>{q.text}</blockquote>
                  <cite>{q.who}</cite>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. PRICING PREVIEW ─────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 100px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ Pricing</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mk-section-title">Three readings. Two, five, seven.</h2>
          </Reveal>

          <div className="mk-pricing-mini">
            {PRICING_PREVIEW.map((t, i) => (
              <Reveal key={t.name} delay={120 + i * 80}>
                <div className={`tier ${('featured' in t && t.featured) ? 'tier-featured' : ''}`}>
                  {('featured' in t && t.featured) && <div className="tier-ribbon">Most chosen</div>}
                  <div className="tname">{t.name}</div>
                  <div className="tprice">{t.price}</div>
                  {t.alt && <div className="talt">{t.alt}</div>}
                  <p className="ttag">{t.tag}</p>
                  <ul className="tbullets">
                    {t.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <Link
                    href={
                      t.name === 'The Two'
                        ? primaryHref
                        : `/pricing#${t.name.toLowerCase().replace(/ /g, '-')}`
                    }
                    className="tier-cta"
                  >
                    {t.name === 'The Two'
                      ? isSignedIn ? 'Open your chart' : 'Begin free'
                      : t.name === 'The Five'
                      ? 'Start the reading'
                      : 'Go deep'} →
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link
              href="/pricing"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--brass)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--brass-soft)',
                paddingBottom: 3,
              }}
            >
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px 140px', textAlign: 'center' }}>
        <Reveal>
          <Ornament kind="rule" width={260} style={{ marginBottom: 44 }} />
        </Reveal>
        <Reveal delay={120}>
          <Link href={primaryHref} className="mk-cta-giant">
            {primaryFooterLabel}
          </Link>
        </Reveal>
      </section>

      {/* ── 9. FOOTER ──────────────────────────────────────────────── */}
      <footer className="mk-footer" style={{ position: 'relative', zIndex: 1 }}>
        <div className="wordmark">Synastra</div>
        <div className="tag">Seven traditions. One chart. One Oracle.</div>
        <nav>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  );
}
