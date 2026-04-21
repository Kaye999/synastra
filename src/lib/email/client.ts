/*
  RESEND SETUP (user runs manually):
  1. Sign up at resend.com
  2. Add + verify domain 'synastra.app' (or use their onboarding domain for free)
  3. Generate API key → paste into .env as RESEND_API_KEY
  4. Update FROM here if using custom domain

  Free tier: 3,000 emails/mo — enough for 100 users at 1 alert/day
*/

import { Resend } from 'resend';

let _client: Resend | null = null;

/** Lazily construct the Resend client so importing this module doesn't
 * throw during build when RESEND_API_KEY isn't yet set in the env. */
export function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('[email] RESEND_API_KEY is not set');
  _client = new Resend(key);
  return _client;
}

/** Default "From" header. Update after the custom domain is verified. */
export const FROM = 'Synastra <alerts@synastra.app>';

/** App base URL used to build deep-links into the dashboard. */
export function appUrl(path = ''): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://synastra.app';
  if (!path) return base;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
