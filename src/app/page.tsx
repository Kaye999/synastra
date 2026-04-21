import Link from 'next/link';
import Starfield from '@/components/Starfield';
import Ornament from '@/components/Ornament';
import Reveal from './_marketing/Reveal';

// ─── Landing page ────────────────────────────────────────────────────
// Synastra marketing home. Server component; the Reveal wrapper is the
// only client-side component, used for scroll-in animations.

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
    name: 'Chinese BaZi',
    accent: 'var(--bazi)',
    meta: 'Four Pillars',
    body: 'The eight characters of your birth moment across the five elements — a chart of fortune and destiny.',
  },
  {
    name: 'Human Design',
    accent: 'var(--humandesign)',
    meta: 'Bodygraph',
    body: 'Type, strategy, authority, and your defined centres — a mechanical portrait of how your energy moves.',
  },
  {
    name: 'Mayan Tzolkin',
    accent: 'var(--mayan)',
    meta: 'Sacred 260-day count',
    body: 'Your kin and tone in the Tzolkin calendar — a galactic signature independent of the solar year.',
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
    title: 'AI Oracle',
    body:
      'Ask anything. The Oracle has read your complete chart across all eight traditions and answers in your voice, with the evidence shown. No generic advice — every reply is grounded in your placements.',
  },
  {
    title: 'Transit Alerts',
    body:
      'When Saturn crosses your Sun or Jupiter lights your tenth house, you get a quiet ping. We watch the sky so you don\'t have to, and only speak when something in your chart is actually activated.',
  },
] as const;

const PERSONAS = [
  { who: 'The Seeker', desc: 'Looking for language for something they already feel is true.' },
  { who: 'The Strategist', desc: 'Treats timing as a variable — and wants a second read on the year.' },
  { who: 'The Student', desc: 'Reads charts for themselves and their people; wants every system, cross-referenced.' },
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
    text: '"I finally understand what my Vedic chart was trying to say. Eight systems, one page."',
    who: '— A.J., London',
  },
] as const;

const PRICING_PREVIEW = [
  { name: 'The Glance', price: 'Free', tag: 'See the shape of you.' },
  { name: 'The Reading', price: '$9 / mo', tag: 'Read the whole chart.' },
  { name: 'The Depth', price: '$19 / mo', tag: 'Unlock every tradition.' },
] as const;

export default function LandingPage() {
  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      <Starfield />

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
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
          <Reveal>
            <div className="mk-eyebrow">§ Synastra</div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mk-hero-title">Eight traditions. One chart. Your chart.</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mk-hero-sub">
              Personal intelligence, drawn from systems older than the calendar.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/sign-up" className="mk-cta-primary">
                See your chart →
              </Link>
              <Link href="/chart?demo=1" className="mk-cta-ghost">
                Try a sample chart
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2. J.P. MORGAN PANEL ───────────────────────────────────── */}
      <section className="mk-jpm-panel" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mk-jpm-inner">
          <Reveal>
            <Ornament kind="asterism" style={{ marginBottom: 32 }} />
          </Reveal>
          <Reveal delay={80}>
            <p className="mk-jpm-quote">
              &ldquo;Millionaires don&rsquo;t use astrology. Billionaires do.&rdquo;
            </p>
          </Reveal>
          <Reveal delay={160}>
            <div className="mk-jpm-attrib">— J.P. Morgan</div>
          </Reveal>
          <Reveal delay={240}>
            <p className="mk-jpm-context">
              Morgan kept Evangeline Adams on retainer. She ran her astrological practice from a suite
              in Carnegie Hall, read for Charlie Chaplin and Mary Pickford, predicted the 1929 crash
              to the month, and was acquitted of fortune-telling charges in 1914 after reading a judge&rsquo;s
              son&rsquo;s chart from a blind birth date. The tools used by people who move markets are older
              than the markets themselves.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 3. THE EIGHT ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ The Eight</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mk-section-title">One birth moment. Eight independent readings.</h2>
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
                  <Ornament kind="constellation" width={96} style={{ margin: 0 }} />
                  <h3 className="mk-block-title">{b.title}</h3>
                  <p className="mk-prose" style={{ fontSize: 17 }}>{b.body}</p>
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
            <h2 className="mk-section-title">Three readings. Pick the depth.</h2>
          </Reveal>

          <div className="mk-pricing-mini">
            {PRICING_PREVIEW.map((t, i) => (
              <Reveal key={t.name} delay={120 + i * 80}>
                <div className="tier">
                  <div className="tname">{t.name}</div>
                  <div className="tprice">{t.price}</div>
                  <p className="ttag">{t.tag}</p>
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
          <Link href="/sign-up" className="mk-cta-giant">
            Begin your chart →
          </Link>
        </Reveal>
      </section>

      {/* ── 9. FOOTER ──────────────────────────────────────────────── */}
      <footer className="mk-footer" style={{ position: 'relative', zIndex: 1 }}>
        <div className="wordmark">Synastra</div>
        <div className="tag">Eight traditions. One chart. Your chart.</div>
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
