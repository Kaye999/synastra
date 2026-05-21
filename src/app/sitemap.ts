import type { MetadataRoute } from 'next';

// Next.js convention — this generates /sitemap.xml at build/deploy.
// Listed: every public marketing page. Excluded: auth-gated routes
// (/onboarding, /chart, /settings) which serve per-user data anyway.
// lastModified is set to deploy time so Google sees a fresh signal
// after each ship — useful right now to accelerate recrawl of the
// post-rebrand (12 → 7 traditions) copy.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getsynastra.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${APP_URL}/`,              lastModified, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${APP_URL}/pricing`,       lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${APP_URL}/reading`,       lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${APP_URL}/about`,         lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/how-it-works`,  lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/privacy`,       lastModified, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/terms`,         lastModified, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
