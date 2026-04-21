// Optional opt-in morning email — today's guidance + count of upcoming alerts.
// Sent by the daily-guidance cron only for users who've set
// `profiles.morning_digest_opt_in = true` (column added by user when the
// feature ships; until then the cron skips sending).

import { getResend, FROM, appUrl } from './client';

type RenderArgs = {
  firstName: string;
  readingBody: string;
  todayIso: string; // YYYY-MM-DD
  upcomingAlertCount: number;
};

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readingToParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function renderDailyDigestHtml(args: RenderArgs): string {
  const { firstName, readingBody, todayIso, upcomingAlertCount } = args;
  const paragraphs = readingToParagraphs(readingBody);
  const paragraphsHtml = paragraphs.map((p) => `<p>${escape(p)}</p>`).join('\n      ');

  const alertLine = upcomingAlertCount > 0
    ? `<p class="alerts"><strong>${upcomingAlertCount}</strong> transit ${upcomingAlertCount === 1 ? 'alert' : 'alerts'} in your queue.</p>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Synastra — Morning Cup</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Inter:wght@400;500&display=swap');
      body { margin: 0; padding: 0; background: #0b0b12; color: #e8e6dc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .wrap { max-width: 560px; margin: 0 auto; padding: 48px 28px; }
      h1 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 28px; line-height: 1.15; letter-spacing: -0.01em; margin: 0 0 8px; color: #f5f3ea; }
      .sub { color: #8d8a7b; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 32px; }
      p { font-size: 16px; line-height: 1.75; color: #d8d5c6; margin: 0 0 18px; }
      .alerts { color: #e8dcb8; margin-top: 28px; }
      .cta { display: inline-block; margin-top: 24px; padding: 12px 22px; background: #e8dcb8; color: #0b0b12; text-decoration: none; font-weight: 500; letter-spacing: 0.02em; border-radius: 2px; }
      .foot { margin-top: 48px; padding-top: 24px; border-top: 1px solid #2a2935; color: #6d6a5d; font-size: 12px; line-height: 1.6; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <p class="sub">Synastra · Morning Cup · ${escape(todayIso)}</p>
      <h1>${escape(firstName || 'Good morning')}</h1>
      ${paragraphsHtml}
      ${alertLine}
      <p><a class="cta" href="${appUrl('/dashboard')}">Open Synastra →</a></p>
      <div class="foot">
        You're receiving this because you enabled the Morning Cup digest. <a href="${appUrl('/settings')}">Adjust preferences</a>.
      </div>
    </div>
  </body>
</html>`;
}

export function renderDailyDigestText(args: RenderArgs): string {
  const { firstName, readingBody, todayIso, upcomingAlertCount } = args;
  const alertLine = upcomingAlertCount > 0
    ? `${upcomingAlertCount} transit ${upcomingAlertCount === 1 ? 'alert' : 'alerts'} in your queue.`
    : '';
  return [
    `SYNASTRA · MORNING CUP · ${todayIso}`,
    '',
    firstName || 'Good morning',
    '',
    readingBody,
    '',
    alertLine,
    '',
    `Open Synastra → ${appUrl('/dashboard')}`,
    '',
    '---',
    `Adjust preferences: ${appUrl('/settings')}`,
  ].filter(Boolean).join('\n');
}

export async function sendDailyDigestEmail(args: {
  to: string;
  firstName: string;
  readingBody: string;
  todayIso: string;
  upcomingAlertCount: number;
}): Promise<{ id: string | null; error: string | null }> {
  try {
    const resend = getResend();
    const subject = `[Synastra] Morning Cup · ${args.todayIso}`;
    const html = renderDailyDigestHtml(args);
    const text = renderDailyDigestText(args);
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
