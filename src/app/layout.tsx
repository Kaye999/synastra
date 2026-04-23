import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://synastra-app.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Synastra — Twelve traditions. One chart. Your archetype.',
    template: '%s · Synastra',
  },
  description:
    'Your birth data read through twelve ancient traditions — Western, Vedic, Kabbalah, Numerology, Chinese BaZi, Human Design, Mayan Tzolk\u2019in, Astrocartography, Tarot, Enneagram, Gene Keys, and Ayurveda. One chart. One AI atlas. Kept by operators since J.P. Morgan.',
  keywords: [
    'astrology', 'birth chart', 'vedic astrology', 'kabbalah', 'numerology',
    'human design', 'tarot', 'enneagram', 'gene keys', 'ayurveda',
    'astrocartography', 'mayan tzolkin', 'chinese bazi', 'AI astrology',
  ],
  authors: [{ name: 'Synastra' }],
  alternates: { canonical: APP_URL },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Synastra',
    title: 'Synastra — Twelve traditions. One chart. Your archetype.',
    description:
      'Western astrology, Vedic, Kabbalah, Numerology, Chinese BaZi, Human Design, Mayan Tzolk\u2019in, Astrocartography, Tarot, Enneagram, Gene Keys, and Ayurveda — pulled from the same birth data and read through one AI atlas.',
    locale: 'en_AU',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Synastra — twelve traditions, one chart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synastra — Twelve traditions. One chart.',
    description:
      'Your birth data read through twelve ancient traditions, one AI atlas. Kept by operators since J.P. Morgan.',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0E1A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="font-body">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
