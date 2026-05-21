import Link from 'next/link';
import Starfield from '@/components/Starfield';

export const metadata = {
  title: 'Privacy · Synastra',
};

export default function PrivacyPage() {
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
          fontFamily: "'Hanken Grotesk', serif",
          color: 'var(--ink-dim)',
          lineHeight: 1.72,
        }}
      >
        <div className="mk-eyebrow" style={{ marginBottom: 20 }}>§ Privacy</div>
        <h1
          style={{
            fontFamily: "'Alice', serif",
            fontSize: 'clamp(40px, 5vw, 56px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: '0 0 28px',
            color: 'var(--ink)',
          }}
        >
          Privacy policy.
        </h1>
        <p>Last updated: 22 April 2026.</p>
        <h2 style={{ fontFamily: "'Alice', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>What we collect</h2>
        <p>
          Your birth data (name, date, time, place) to compute your chart. Your email to create an account.
          Payment data is handled by Stripe — we never see your card. AI chat messages are stored to remember
          context; you can delete your account at any time.
        </p>
        <h2 style={{ fontFamily: "'Alice', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>How we use it</h2>
        <p>
          Only to run Synastra. We don&rsquo;t sell data. We don&rsquo;t advertise to you. We don&rsquo;t share
          your chart with third parties beyond our infrastructure providers (Clerk for auth, Supabase for
          storage, Anthropic for AI, Stripe for billing, Resend for email).
        </p>
        <h2 style={{ fontFamily: "'Alice', serif", fontSize: 24, color: 'var(--ink)', marginTop: 32 }}>Your rights</h2>
        <p>
          You can export, edit, or delete your data at any time from Settings. Email
          <a href="mailto:hello@getsynastra.com" style={{ color: 'var(--brass)' }}> hello@getsynastra.com</a>
          {' '}for any privacy questions.
        </p>
        <p style={{ marginTop: 48, fontSize: 14, color: 'var(--ink-faint)' }}>
          This is a stub policy. A full GDPR/CCPA-compliant version will ship before live payments launch.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
          <Link href="/" className="mk-page-nav-btn">← Home</Link>
          <Link href="/terms" className="mk-page-nav-btn mk-page-nav-btn-primary">Terms →</Link>
        </div>
      </article>
    </main>
  );
}
