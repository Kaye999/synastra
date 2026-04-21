import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synastra — five ancient systems, one chart',
  description:
    'Western astrology, Vedic, Kabbalah, numerology and Chinese BaZi — pulled from the same birth data and read through one AI atlas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="font-body">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
