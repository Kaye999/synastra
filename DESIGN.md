# Synastra — Editorial Esoteric Design System

> This file is the source of truth for Synastra's visual language. Any AI agent (Claude Code, Cursor, Codex, v0) editing Synastra should read this first and match it. Do not drift. Do not introduce generic AI aesthetics.

## 1. Visual Theme & Atmosphere

Synastra is the intersection of a **celestial atlas** and a **literary magazine**. The aesthetic is **editorial esoteric** — words-forward, richly typographic, intentionally restrained. Ornament exists but earns its place; decoration is typographic (asterisms, hairline rules, drop caps) rather than illustrative. Every page reads like a commissioned feature, not a dashboard.

The product sits in the seam between "ancient system" and "modern intelligence." Typography does the heavy lifting. The starfield background provides atmosphere; a soft radial reading-plane darkens the centre where content lives so stars fade at the edges and text stays crisp. No gradients on buttons. No emoji. No neon. No "click here for your horoscope" energy.

**Key Characteristics:**
- Variable display serif (Fraunces, `opsz: 144` for large sizes)
- Body serif with strong italic (Crimson Pro)
- Monospace for data, numbers, eyebrows, degree readouts (IBM Plex Mono)
- Midnight indigo base — NOT pure black
- Single dominant accent (aged brass); secondary accents only for mode tinting
- Real constellation SVG background with 800+ magnitude-scaled stars + named bright stars with radial glow
- Drop caps, chapter rules with centered ornaments, pull-quotes in margins
- Zero emoji — replaced with typographic marks (§ ¶ † ‡ ✦ ★ ⁂) and real zodiac/planetary glyphs (☉ ☽ ↑ ☿ ♀ ♂ ♃ ♄)

## 2. Color Palette & Roles

### Primary tokens

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0A0E1A` | Primary viewport background. Midnight indigo. NOT `#000`. |
| `--bg-deep` | `#060912` | Nested recesses, cards on very dark overlay. |
| `--bg-raise` | `#131828` | Card fills, reading plane centre. |
| `--ink` | `#FCFAF6` | Primary text. Warm cream, never pure white. |
| `--ink-dim` | `#CFC5B1` | Body-dim, secondary text, italic sub-heads. |
| `--ink-faint` | `#7B7361` | Marginalia, source citations, tiny mono labels. |
| `--rule` | `rgba(252,250,246,0.08)` | Hairline dividers. Always 1px. |
| `--mist` | `rgba(252,250,246,0.04)` | Faint card fills. |
| `--veil` | `rgba(10,14,26,0.72)` | Paywall blur overlay + reading-plane darkener. |

### Accents

| Token | Hex | Use |
|---|---|---|
| `--brass` | `#C8A052` | Primary accent. CTAs, eyebrows, active states, drop caps, sigils. |
| `--brass-soft` | `rgba(200,160,82,0.4)` | Soft glow, secondary brass. |
| `--brass-glow` | `rgba(200,160,82,0.35)` | Pulse halo on hovered cards, breathing glow on MorningCup. |
| `--ember` | `#A84B3E` | Warnings, "now" markers, urgent-transit pills. Terracotta, not fire-engine red. |

### Mode tints (used sparingly, only per chart mode)

| Token | Hex | Mode |
|---|---|---|
| `--saffron` | `#D4956B` | Vedic mode accent |
| `--copper` | `#B87333` | Kabbalah mode accent |
| `--lacquer` | `#8E2C2C` | Chinese BaZi mode accent |
| `--antique` | `#B8935A` | Numerology mode accent |
| `--violet-deep` | `#3B2F5C` | Shadow work section |
| `--violet-glow` | `rgba(155,137,212,0.4)` | Kabbalah subtle glow |

**Do NOT** use: neon pinks, royal blues, saturated teals, pastels, gradient buttons, or any color not in this table. Do NOT use pure white (`#FFFFFF`) or pure black (`#000000`).

## 3. Typography Rules

### Font Family

- **Display**: `Fraunces` (Google Fonts) — variable font, `opsz` 9..144, weight 400-800. Use `font-variation-settings: "opsz" 144` for display sizes (>36px). Italic is the main secondary voice.
- **Body**: `Crimson Pro` (Google Fonts) — weight 300-600, italic available. Body sizes 16-22px.
- **Mono / Data / Eyebrows**: `IBM Plex Mono` (Google Fonts) — weight 400-500. Never larger than 14px. Always uppercase with generous letter-spacing when used as an eyebrow.

Import block (put in `globals.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..600&family=Crimson+Pro:ital,wght@0,300..600;1,300..500&family=IBM+Plex+Mono:wght@400;500&display=swap');
```

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Hero Display | Fraunces | `clamp(56px, 8vw, 120px)` | 600-800 | 1.00 | -0.02em | Use `opsz: 144`. Rarely more than 2 lines. |
| Section Heading | Fraunces | 48-72px | 600 | 1.05 | -0.015em | Per-section chapter titles. |
| Sub-heading | Fraunces | 32px | 500 | 1.12 | -0.01em | Card titles. |
| Italic Sub | Crimson Pro Italic | 18-22px | 400 | 1.4 | normal | Every hero has one. |
| Body | Crimson Pro | 18-20px | 400 | 1.72 | normal | Main reading text. Long-form. |
| Drop Cap | Fraunces | 72-96px | 800 | 0.9 | -0.03em | Brass. 4-line initial on opening paragraph of each long-form reading. |
| Pull Quote | Fraunces Italic | 24-28px | 500 | 1.3 | -0.01em | Brass rule on left. One per major section. |
| Eyebrow | IBM Plex Mono | 10-11px | 400 | 1.0 | 0.22em | UPPERCASE. Brass. Prefixed with `§`. |
| Mono Data | IBM Plex Mono | 12-13px | 400-500 | 1.4 | 0.04em | Degrees, dates, tier indicators. |
| Marginalia | IBM Plex Mono | 9-10px | 400 | 1.5 | 0.14em | `--ink-faint`. Source citations. |
| Table Header | IBM Plex Mono | 10px | 500 | 1.0 | 0.2em | UPPERCASE. |

### Principles

- **Drop caps anchor every long-form reading.** The MorningCup, Monthly Forecast, Life Purpose, and Kabbalah natal essays each open with a 72-96px Fraunces weight-800 drop cap floated left, brass color, line-height ~0.9 so it spans 4 lines.
- **Italic does the work of softness.** Where other designs would reach for a lighter weight, reach for Crimson Pro Italic instead.
- **Eyebrows always prefixed with `§`** — the section symbol establishes editorial register.
- **Pull quotes break the column** — extract one sentence per section (auto or manual), wrap in `<blockquote>`, set in Fraunces Italic 24-28px with a brass 1px left-rule and 20px left-padding. One per section maximum.
- **Mono is data, not labels for humans.** Button labels are Fraunces or Crimson; IBM Plex Mono is reserved for numbers, dates, degrees, timestamps, and eyebrows.
- **No uppercase except mono-eyebrows and table headers.** Headlines are mixed-case.

## 4. Layout Principles

- **Page shell max-width**: 1180px. Some long-form readings narrow to 720px for line-length readability.
- **Column grid**: Desktop-dash uses 2-column `minmax(0,1.1fr) minmax(0,1fr)` with 56px gutter. Collapse to single column under 900px.
- **Section spacing**: 120-160px between major sections. Chapter rules (`hr.chapter-rule`) provide the breakpoint, NOT extra whitespace alone.
- **Card padding**: 32-40px per side for main cards, 20-24px for compact.
- **Card borders**: Cards have a 1px border at `--rule` color OR a left-side 2px brass rule for callouts. Never box-shadow; cards don't "float."
- **Asymmetric over centered.** Hero is centered for impact; everything else uses left-aligned headers with ~40% right-column whitespace.

## 5. Component Library

All lives in `src/components/`. Agents MUST reuse, not re-invent.

- **`Starfield`** — fixed background, z-0. Reading plane is an `::after` radial gradient darkening the centre. Never modify the star coordinates (they're real Hipparcos positions).
- **`MorningCup`** — daily reading card. Breathing brass halo on the outer frame (8s `pulse-halo` animation). Drop cap + SSE-streamed body + auto-extracted pull quote + transit-context accordion.
- **`MonthlyForecast`** — 5 accordion sections (Career · Love · Shadow · Wealth · Integration), each with a mono `01`-`05` gutter index. Section heading parser resolves streaming content into the right row as it arrives.
- **`ReadingCard`** — generic editorial wrapper. Eyebrow (mono-brass-uppercase) + Fraunces title + hairline rule + Crimson body. Hover pulses brass halo.
- **`DeepReadTabs`** — horizontal tab bar in IBM Plex Mono uppercase with brass underline on active. Lazy-loads content on click.
- **`CompatibilityForm`** — second-chart onboarding, same input styling as primary Onboarding.
- **`TransitAlerts`** — bell icon top-right of Dashboard header, ember-coloured badge when unread. Slide-over panel 420ms.
- **`SettingsCog`** — brass crosshair SVG (NOT unicode `⚙`), rotates 45° on hover.
- **`Onboarding`** — vertical single-column 480px max-width. Labels in IBM Plex Mono 10px uppercase tracked 0.22em. Inputs are transparent with a 1px brass underline (no box). Focus thickens underline and brings brass into text color.
- **`PaywallBlur`** — locked content gets `filter: blur(8px)` + fullscreen `::after` overlay at `--veil` opacity with a centered upgrade card.

### Buttons

- **Primary** — brass outline, transparent fill, Fraunces label. Hover: filled brass, text inverts to `--bg-base`. Small pulse-halo active state for hero CTAs.
- **Ghost** — just a mono underline link. No border. Hover: color brightens to `--ink`.
- **Never** gradient backgrounds. **Never** rounded-full unless it's a pill chip.

### Ornaments

Defined in `src/components/Ornament.tsx`:

- `<Ornament kind="asterism" />` — three-dot `⁂`-style mark, hand-drawn feel
- `<Ornament kind="constellation" />` — 5-star fragment with faint connecting lines
- `<Ornament kind="rule" />` — hairline with centered sigil

Use `<Ornament kind="rule" />` between every major section. Use `asterism` for paragraph breaks within essays. Use `constellation` between accordion rows.

## 6. Motion

**Motion is atmospheric, not performative.** No bouncy springs, no celebratory burst animations.

| Name | Duration | Easing | Use |
|---|---|---|---|
| `reveal-rise` | 700ms | `cubic-bezier(.2,.7,.3,1)` | On-scroll reveal. 12px rise + fade. Staggered 120ms delays per element on page load. |
| `pulse-halo` | 8s | ease-in-out infinite | MorningCup's breathing brass glow. Max blur 40px at 50%. |
| `shimmer` | 2s linear infinite | — | Loading state on constellation-shaped placeholders. |
| `slide-over` | 420ms | `cubic-bezier(.2,.7,.3,1)` | Chat widget + TransitAlerts panel entrance. |
| `crossfade` | 400ms | ease | Mode switch between Western/Vedic/etc. |
| Hover card-halo | 3.2s | ease-in-out (runs only while hovered) | Reading cards. |

Respect `prefers-reduced-motion: reduce` — disable ALL animations under that media query. Non-negotiable.

## 7. Iconography

- **Planetary glyphs** (☉ ☽ ↑ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇ ☊ ☋): use Unicode, set in Georgia or Fraunces Italic at display size.
- **Zodiac glyphs** (♈-♓): Unicode, Georgia or Fraunces at 36-56px.
- **Tradition icons** — SVG, 56px, `currentColor`, stroke-width 1.1-1.2, brass default. Each tradition has a SPECIFIC glyph (see `mockup-1-editorial-esoteric.html` for reference):
  - Western: zodiac wheel with ♈♋♎♑ cardinals
  - Vedic: ॐ
  - Kabbalah: 10-sephirot Tree of Life (22 paths)
  - Numerology: Pythagorean tetractys (10 dots, triangular)
  - Chinese BaZi: I Ching hexagram (6 lines, solid + broken)
  - Human Design: 9-centre BodyGraph mandala
  - Mayan: Tzolk'in wavespell rings (concentric)
  - Astrocartography: 3D globe with meridian + equator
- **Sigils** — asterism, constellation fragment, hairline-with-dot. Use `Ornament` component.

**NEVER** use generic icon libraries (Lucide, Phosphor, Heroicons) except for UI chrome (X close button, chevrons). Astrological/esoteric content always gets custom or Unicode glyphs.

## 8. Voice / Copy Principles

Not strictly design but applies to any UI string an agent generates:

- **Editorial, observational, richly imaged.** Write like The New Yorker doing esoterica, not like a horoscope app.
- **No hedging.** Strike "might", "could be", "sometimes", "tends to", "often".
- **Concrete verbs** — builds, cuts, holds, burns, composts, refuses, carries.
- **Third person for readings**, second person sparingly for direct address.
- **Mix sentence lengths.** Short. Medium. Sometimes a longer sentence that sets the turn and lets the image breathe.
- **No emoji.** No exclamation marks. No "unlock the secrets of your chart!"-style copy.
- **Specificity over fluff.** "The Libra Moon reads rooms before entering them" beats "emotional balance and fairness."
- **Quotable moments** — every essay gets one pull-quote-worthy sentence. Mark them for extraction.

## 9. Accessibility

- **Contrast**: `--ink` on `--bg-base` = WCAG AA. Check any new color pair you introduce against `--bg-base`.
- **Focus visible**: 2px brass outline with 2px offset on all interactive elements. Never `outline: none` without replacement.
- **Motion**: `prefers-reduced-motion` disables all animations (above).
- **Semantics**: Real headings (`h1`-`h6`), real lists, real `<button>` / `<a>` elements. No `<div onClick>`.
- **Alt text** on every SVG that conveys content (tradition icons, chart wheels).

## 10. What NEVER to do

- Do NOT use pure black `#000` or pure white `#FFF`
- Do NOT use gradient buttons or card backgrounds
- Do NOT use emoji (including in strings, labels, alt text)
- Do NOT introduce a new font family without updating this document first
- Do NOT use generic stock SVG icons for astrology content
- Do NOT use uppercase on headings (only on mono eyebrows and table headers)
- Do NOT use box-shadow for card elevation — use borders + backdrop-filter
- Do NOT animate with bouncy/spring easings
- Do NOT write hedging copy ("might", "could", "sometimes")
- Do NOT add a dark-mode toggle — Synastra IS dark. There is no light mode.
- Do NOT reach for Tailwind's default palette — always use the CSS variables in `globals.css`

## Agent Prompt (drop-in reference)

When another agent (or future me) is generating new UI for Synastra, they should start with this:

> I am building UI for **Synastra**, an AI-powered astrology intelligence platform. The design language is **Editorial Esoteric** — think The New Yorker meets a celestial atlas. Fonts: Fraunces (display), Crimson Pro (body), IBM Plex Mono (data). Palette: midnight indigo `#0A0E1A` base, warm cream `#FCFAF6` text, aged brass `#C8A052` accent. No emoji, no gradients, no bouncy animations, no generic AI aesthetics. Every long-form reading opens with a drop cap; every major section has a pull quote. Motion is atmospheric (breathing halos, staggered reveals), not performative. Respect `prefers-reduced-motion`. Read `DESIGN.md` in the project root for full specifications.
