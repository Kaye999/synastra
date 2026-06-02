// BrandHome — fixed top-left "← SYNASTRA" pill that returns to /.
// Rendered on every authed/marketing page that isn't itself the landing.
// Matches the Dashboard chart-page chrome so navigation feels consistent.

import Link from 'next/link';

export default function BrandHome() {
  return (
    <Link
      href="/"
      aria-label="Synastra home"
      className="dash-home-pill"
      style={{
        position: 'fixed',
        top: 14,
        left: 14,
        zIndex: 40,
        padding: '0 14px',
        height: 40,
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: "'Alice', serif",
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: '0.14em',
        color: 'var(--ink, #ECE4D2)',
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
  );
}
