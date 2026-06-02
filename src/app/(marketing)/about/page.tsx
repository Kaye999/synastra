import Link from 'next/link';
import Starfield from '@/components/Starfield';
import Ornament from '@/components/Ornament';
import BrandHome from '@/components/BrandHome';

export const metadata = {
  title: 'About · Synastra',
  description: 'Synastra — personal intelligence across seven ancient systems.',
};

export default function AboutPage() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Starfield />
      <BrandHome />
      <article
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          margin: '0 auto',
          padding: '140px 24px 120px',
        }}
      >
        <div className="mk-eyebrow" style={{ marginBottom: 20 }}>§ About</div>
        <h1
          style={{
            fontFamily: "'Alice', serif",
            fontVariationSettings: '"opsz" 144',
            fontSize: 'clamp(44px, 6vw, 68px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            margin: '0 0 28px',
          }}
        >
          Seven traditions, one chart.
        </h1>
        <div
          style={{
            fontFamily: "'Hanken Grotesk', serif",
            fontSize: 19,
            color: 'var(--ink-dim)',
            lineHeight: 1.72,
          }}
        >
          <p>
            Synastra is an intelligence layer for self-discovery, built on the
            premise that every ancient system for reading a person — Western
            astrology, Vedic jyotish, numerology, Kabbalah, Human Design,
            Tarot, and astrocartography — has its own truth about who you
            are. None of them is complete alone. Together, cross-referenced,
            they read you with startling precision.
          </p>
          <p>
            We compute your chart from the moment of your birth to
            arc-second accuracy and run it through each tradition separately.
            The Master Oracle — an AI grounded in all seven, fluent in
            general astrology, astronomy, and the traditional archetypes
            besides — synthesises the overlap: where the systems agree,
            where they argue, what together they reveal about what you are
            here to build.
          </p>
          <p>
            Founded 2026 in Sydney. Built by a small team with help from
            ancient instruments and modern LLMs. Our favourite quote,
            attributed to J.P. Morgan, is our north star:
          </p>
          <blockquote
            style={{
              fontFamily: "'Alice', serif",
              fontStyle: 'italic',
              fontSize: 22,
              borderLeft: '2px solid var(--brass)',
              paddingLeft: 20,
              margin: '28px 0',
              color: 'var(--ink)',
            }}
          >
            &ldquo;Millionaires don&rsquo;t use astrology. Billionaires do.&rdquo;
          </blockquote>
          <p>
            Whether that&rsquo;s true or apocryphal, the intention holds: the
            most serious people in history have taken the heavens seriously.
            Synastra is how you join them.
          </p>
        </div>

        <Ornament kind="rule" style={{ marginTop: 56, marginBottom: 32 }} />
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" className="mk-page-nav-btn">← Home</Link>
          <Link href="/pricing" className="mk-page-nav-btn mk-page-nav-btn-primary">See pricing →</Link>
        </div>
      </article>
    </main>
  );
}
