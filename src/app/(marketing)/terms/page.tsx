import Link from 'next/link';
import Starfield from '@/components/Starfield';

export const metadata = {
  title: 'Terms · Synastra',
};

export default function TermsPage() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Starfield />
      <article
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          margin: '0 auto',
          padding: '140px 24px 120px',
          fontFamily: "'Crimson Pro', serif",
          color: 'var(--ink-dim)',
          lineHeight: 1.72,
        }}
      >
        <div className="mk-eyebrow" style={{ marginBottom: 20 }}>§ Terms</div>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(40px, 5vw, 56px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: '0 0 28px',
            color: 'var(--ink)',
          }}
        >
          Terms of service.
        </h1>
        <p>Last updated: 22 April 2026.</p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>The short version</h2>
        <p>
          Synastra provides personal chart readings across seven esoteric traditions and an AI oracle grounded
          in your chart. Readings are for self-reflection and entertainment. Nothing on Synastra constitutes
          medical, legal, financial, or psychiatric advice.
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>Subscriptions</h2>
        <p>
          Monthly and annual plans auto-renew unless cancelled. Cancel anytime in Settings — access continues
          to the end of your billing period. Refunds are handled case-by-case: email us within 14 days of
          purchase.
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>Acceptable use</h2>
        <p>
          Don&rsquo;t use Synastra to harm others. Don&rsquo;t scrape or redistribute our readings. Don&rsquo;t
          impersonate someone whose chart you don&rsquo;t have permission to cast.
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>Limitation of liability</h2>
        <p>
          Synastra is provided as-is. We make no guarantees about the accuracy of astrological computations or
          AI interpretations. We&rsquo;re not liable for decisions made based on readings.
        </p>
        <p style={{ marginTop: 48, fontSize: 14, color: 'var(--ink-faint)' }}>
          This is a stub ToS. A full jurisdiction-specific version will ship before live payments launch.
          Contact: <a href="mailto:hello@getsynastra.com" style={{ color: 'var(--brass)' }}>hello@getsynastra.com</a>.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
          <Link href="/" className="mk-page-nav-btn">← Home</Link>
          <Link href="/privacy" className="mk-page-nav-btn mk-page-nav-btn-primary">Privacy →</Link>
        </div>
      </article>
    </main>
  );
}
