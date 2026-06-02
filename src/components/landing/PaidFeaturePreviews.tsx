// PaidFeaturePreviews — landing-page section that shows mini visual mocks of
// what each paid tier unlocks. Sits between the testimonials and the pricing
// strip so a visitor can see the product, not just read bullet lists.
//
// Server component — no client state. All visuals are inline SVG/CSS mocks
// styled to feel like real product screenshots without rendering live data.

import Link from 'next/link';
import Reveal from '@/app/_marketing/Reveal';

type Feature = {
  tierLabel: string;
  tierAnchor: string;
  title: string;
  tag: string;
  cta: string;
};

const FEATURES: Feature[] = [
  {
    tierLabel: 'The Five+',
    tierAnchor: 'the-five',
    title: 'Morning Cup',
    tag: 'A daily editorial paragraph tying today’s sky to your natal chart.',
    cta: 'Unlock with The Five',
  },
  {
    tierLabel: 'The Seven+',
    tierAnchor: 'the-seven',
    title: 'Master Oracle',
    tag: 'Ask anything. Answers grounded in your chart across seven traditions.',
    cta: 'Unlock with The Seven',
  },
  {
    tierLabel: 'The Seven+',
    tierAnchor: 'the-seven',
    title: 'Astrocartography',
    tag: 'Where on earth each planet sets up its lines for you.',
    cta: 'Unlock with The Seven',
  },
  {
    tierLabel: 'The Nine',
    tierAnchor: 'the-nine',
    title: 'Zodiac Season Workbook',
    tag: 'Printable monthly ritual workbook + guided audio meditations.',
    cta: 'Unlock with The Nine',
  },
];

export default function PaidFeaturePreviews() {
  return (
    <section
      style={{ position: 'relative', zIndex: 1, padding: '80px 24px 40px' }}
      aria-labelledby="paid-features-heading"
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Reveal>
          <div className="mk-eyebrow" style={{ marginBottom: 14 }}>§ Inside the paid tiers</div>
        </Reveal>
        <Reveal delay={80}>
          <h2 id="paid-features-heading" className="mk-section-title">
            What you get when you go past Free.
          </h2>
        </Reveal>

        <div className="mk-feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={120 + i * 80}>
              <article className="mk-feature-card">
                <div className="mk-feature-mock">{renderMock(f.title)}</div>
                <div className="mk-feature-meta">
                  <div className="mk-feature-eyebrow">{f.tierLabel}</div>
                  <h3 className="mk-feature-title">{f.title}</h3>
                  <p className="mk-feature-tag">{f.tag}</p>
                  <Link href={`/pricing#${f.tierAnchor}`} className="mk-feature-cta">
                    {f.cta} &rarr;
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderMock(title: string) {
  switch (title) {
    case 'Morning Cup':
      return <MorningCupMock />;
    case 'Master Oracle':
      return <OracleChatMock />;
    case 'Astrocartography':
      return <AstrocartoMock />;
    case 'Zodiac Season Workbook':
      return <WorkbookMock />;
    default:
      return null;
  }
}

// ─── Morning Cup ────────────────────────────────────────────────────────
function MorningCupMock() {
  return (
    <div className="mock mock-morning">
      <div className="mock-eyebrow">TODAY · TUE 2 JUN</div>
      <div className="mock-headline">Morning Cup</div>
      <div className="mock-rule" />
      <div className="mock-body">
        <span className="mock-dropcap">S</span>omething has quietly shifted in how you relate to
        the people you live with — and today the shift becomes undeniable.
        Uranus moves into an exact trine with your natal Moon&hellip;
      </div>
    </div>
  );
}

// ─── Master Oracle ──────────────────────────────────────────────────────
function OracleChatMock() {
  return (
    <div className="mock mock-oracle">
      <div className="mock-eyebrow">MASTER ORACLE</div>
      <div className="mock-chat mock-chat-user">
        Why does career feel slow right now?
      </div>
      <div className="mock-chat mock-chat-oracle">
        Saturn is currently transiting your 10th — the house of profession.
        It&rsquo;s a structural review, not a stall. Two practical moves&hellip;
      </div>
      <div className="mock-chat-input">
        <span>Ask the Oracle &hellip;</span>
        <span className="mock-chat-send">&rarr;</span>
      </div>
    </div>
  );
}

// ─── Astrocartography ──────────────────────────────────────────────────
function AstrocartoMock() {
  return (
    <div className="mock mock-astro">
      <div className="mock-eyebrow">ASTROCARTOGRAPHY</div>
      <svg viewBox="0 0 320 180" width="100%" role="presentation" aria-hidden="true">
        <defs>
          <radialGradient id="astro-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#C8A052" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C8A052" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="320" height="180" fill="url(#astro-glow)" />
        {/* stylised landmass outlines (continents abstracted) */}
        <g fill="rgba(252, 250, 246, 0.06)" stroke="rgba(252, 250, 246, 0.22)" strokeWidth="0.5">
          <path d="M22 56 Q40 38 70 42 T130 50 Q140 70 120 92 T70 110 Q40 102 22 90 Z" />
          <path d="M150 38 Q172 24 196 36 Q210 56 200 78 T172 96 Q156 86 150 70 Z" />
          <path d="M210 96 Q236 82 264 92 Q282 110 276 134 T244 154 Q220 146 210 130 Z" />
          <path d="M88 130 Q108 122 128 132 T144 156 Q126 164 104 158 Z" />
        </g>
        {/* planetary lines (brass diagonals) */}
        <g stroke="#C8A052" fill="none" strokeWidth="1" opacity="0.85">
          <line x1="40" y1="0" x2="240" y2="180" />
          <line x1="100" y1="0" x2="300" y2="180" strokeDasharray="3 4" />
          <line x1="220" y1="0" x2="20" y2="180" strokeWidth="0.8" opacity="0.6" />
        </g>
        {/* planet markers at line tops */}
        <g fill="#C8A052">
          <circle cx="40" cy="6" r="3" />
          <circle cx="100" cy="6" r="3" />
          <circle cx="220" cy="6" r="3" />
        </g>
        {/* glyph labels */}
        <g
          fill="#ECE4D2"
          style={{ fontFamily: "'EB Garamond', 'Alice', serif", fontSize: 11 }}
          textAnchor="middle"
        >
          <text x="40" y="22">&#9794;</text>
          <text x="100" y="22">&#9792;</text>
          <text x="220" y="22">&#9795;</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Workbook ──────────────────────────────────────────────────────────
function WorkbookMock() {
  return (
    <div className="mock mock-workbook">
      <div className="mock-eyebrow">ZODIAC SEASON · JUNE</div>
      <div className="mock-workbook-page">
        <div className="mock-workbook-glyph">&#9803;</div>
        <div className="mock-workbook-title">Gemini Season</div>
        <div className="mock-workbook-sub">Workbook &middot; 18 pages</div>
        <div className="mock-workbook-rule" />
        <ul className="mock-workbook-list">
          <li>Daily prompt — 30 entries</li>
          <li>Mercury return ritual</li>
          <li>Audio meditation &middot; 12 min</li>
          <li>New &amp; Full Moon ceremonies</li>
        </ul>
      </div>
    </div>
  );
}
