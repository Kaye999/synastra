// Transit alert email — Fraunces heading + Inter body, pull-quote, CTA.
//
// Rendered at send-time to HTML. We don't install @react-email/render here
// to avoid dragging a new dep tree; the template instead returns both the
// React tree (for future use with react-email) and pre-rendered HTML +
// plain-text strings that Resend can send directly.
//
// Subject format: "[Synastra] Jupiter conjunct your Sun — June 9"
//
// Usage:
//   import { sendTransitAlertEmail } from '@/lib/email/transit-alert';
//   await sendTransitAlertEmail({ to, alert, firstName, interpretation });

import { getResend, FROM, appUrl } from './client';
import { DISCLAIMER } from '@/lib/disclaimer';
import type { TransitAlert } from '@/lib/cron/transits';

/* ============================================================
 * Subject line
 * ============================================================ */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function formatDateLong(iso: string): string {
  // iso is YYYY-MM-DD — keep parsing UTC-safe.
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}`;
}

export function transitSubject(alert: TransitAlert): string {
  return `[Synastra] ${alert.name} — ${formatDateLong(alert.exactDate)}`;
}

/* ============================================================
 * Rendered HTML + plain-text
 * ============================================================ */

type RenderArgs = {
  firstName: string;
  alert: TransitAlert;
  interpretation: string;
  pullQuote?: string;
};

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderTransitAlertHtml(args: RenderArgs): string {
  const { firstName, alert, interpretation, pullQuote } = args;
  const dashboardUrl = appUrl('/chart');
  const date = formatDateLong(alert.exactDate);

  const quote = pullQuote || `${alert.transitPlanet} meets your ${alert.natalPlanet} — the sky rhymes with your chart on ${date}.`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(alert.name)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Inter:wght@400;500&display=swap');
      body { margin: 0; padding: 0; background: #0b0b12; color: #e8e6dc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .wrap { max-width: 560px; margin: 0 auto; padding: 48px 28px; }
      h1 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 32px; line-height: 1.15; letter-spacing: -0.01em; margin: 0 0 8px; color: #f5f3ea; }
      .sub { color: #8d8a7b; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 32px; }
      p { font-size: 16px; line-height: 1.7; color: #d8d5c6; margin: 0 0 20px; }
      blockquote { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 20px; line-height: 1.4; color: #e8dcb8; border-left: 2px solid #8a7a4e; padding: 8px 0 8px 20px; margin: 28px 0; }
      .cta { display: inline-block; margin-top: 16px; padding: 14px 24px; background: #e8dcb8; color: #0b0b12; text-decoration: none; font-weight: 500; letter-spacing: 0.02em; border-radius: 2px; }
      .cta:hover { background: #f2e8c4; }
      .foot { margin-top: 48px; padding-top: 24px; border-top: 1px solid #2a2935; color: #6d6a5d; font-size: 12px; line-height: 1.6; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <p class="sub">Synastra · Transit Alert</p>
      <h1>${escape(alert.name)}</h1>
      <p>${escape(firstName || 'Friend')}, ${escape(interpretation)}</p>
      <blockquote>${escape(quote)}</blockquote>
      <p>Exact on <strong>${escape(date)}</strong>. The orb tightens in the days before and loosens after.</p>
      <p><a class="cta" href="${dashboardUrl}">Read in Synastra →</a></p>
      <div class="foot">
        ${escape(DISCLAIMER)}<br /><br />
        You're receiving this because you enabled transit alerts on Synastra Depth. Manage notifications in <a href="${appUrl('/settings')}">settings</a>.
      </div>
    </div>
  </body>
</html>`;
}

export function renderTransitAlertText(args: RenderArgs): string {
  const { firstName, alert, interpretation, pullQuote } = args;
  const date = formatDateLong(alert.exactDate);
  const quote = pullQuote || `${alert.transitPlanet} meets your ${alert.natalPlanet} — the sky rhymes with your chart on ${date}.`;

  return [
    'SYNASTRA · TRANSIT ALERT',
    '',
    alert.name.toUpperCase(),
    '',
    `${firstName || 'Friend'}, ${interpretation}`,
    '',
    `"${quote}"`,
    '',
    `Exact on ${date}. The orb tightens in the days before and loosens after.`,
    '',
    `Read in Synastra → ${appUrl('/chart')}`,
    '',
    '---',
    DISCLAIMER,
    '',
    `You're receiving this because you enabled transit alerts on Synastra Depth.`,
    `Manage notifications: ${appUrl('/settings')}`,
  ].join('\n');
}

/* ============================================================
 * Send
 * ============================================================ */

export async function sendTransitAlertEmail(args: {
  to: string;
  firstName: string;
  alert: TransitAlert;
  interpretation: string;
  pullQuote?: string;
}): Promise<{ id: string | null; error: string | null }> {
  try {
    const resend = getResend();
    const subject = transitSubject(args.alert);
    const html = renderTransitAlertHtml(args);
    const text = renderTransitAlertText(args);
    const res = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject,
      html,
      text,
    });
    if (res.error) return { id: null, error: res.error.message || 'send-failed' };
    return { id: res.data?.id ?? null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: null, error: message };
  }
}
