import type { MetadataRoute } from 'next';

// Next.js convention — this generates /robots.txt at build/deploy.
// Tells Google: crawl the public marketing surface; stay out of /api,
// /onboarding (auth-required form), /chart (per-user), and /settings.
// Points to the sitemap so the crawler picks up our public pages fast.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getsynastra.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/about',
          '/how-it-works',
          '/privacy',
          '/terms',
          '/field-notes',
          '/now',
        ],
        disallow: [
          '/api/',
          '/onboarding',
          '/chart',
          '/settings',
          '/sign-in',
          '/sign-up',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
