import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Cosmos from '@/components/Cosmos';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://getsynastra.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Synastra — Seven traditions. One chart. One Oracle.',
    template: '%s · Synastra',
  },
  description:
    'Your birth data read through seven ancient traditions — Western, Vedic, Numerology, Kabbalah, Human Design, Tarot, and Astrocartography. One chart. One Oracle. Kept by operators since J.P. Morgan.',
  keywords: [
    'astrology', 'birth chart', 'vedic astrology', 'kabbalah', 'numerology',
    'human design', 'tarot', 'astrocartography', 'AI astrology',
  ],
  authors: [{ name: 'Synastra' }],
  alternates: { canonical: APP_URL },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Synastra',
    title: 'Synastra — Seven traditions. One chart. One Oracle.',
    description:
      'Western, Vedic, Numerology, Kabbalah, Human Design, Tarot, and Astrocartography — pulled from the same birth data and read through one Oracle.',
    locale: 'en_AU',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Synastra — seven traditions, one chart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synastra — Seven traditions. One chart. One Oracle.',
    description:
      'Your birth data read through seven ancient traditions, one Oracle. Kept by operators since J.P. Morgan.',
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
          <Cosmos />
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
