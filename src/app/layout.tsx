import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'vegan.jp — The Plant-Based Diorama of Japan',
  description:
    'A delightfully tactile photo community for vegan travelers in Japan. Discover spots, plant your memories, and watch the map bloom — no sign-up required.',
  keywords: ['vegan', 'japan', 'plant-based', 'travel', 'photo map', 'hakoniwa'],
  metadataBase: new URL('https://vegan.jp'),
  openGraph: {
    title: 'vegan.jp — Plant-based Japan Photo Map',
    description: 'A tactile, frictionless photo community for conscious travelers across Japan.',
    url: 'https://vegan.jp',
    siteName: 'vegan.jp',
    type: 'website',
    locale: 'en_US',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

import SelfHealingGuard from '@/components/SelfHealingGuard';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#549c40',
};

const STRUCTURED_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'vegan.jp — Japan Plant-Based Signature Dish & Culinary Stamp Map',
  url: 'https://vegan.jp',
  applicationCategory: 'TravelApplication',
  description:
    "Discover Japan's best vegan restaurants by their #1 Chef Signature Dish, enjoy exclusive Welcome Perks, and collect Gochisosama Culinary Stamps & Postcards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_JSON_LD) }}
        />
      </head>
      <body className="font-sans antialiased bg-cream-50 text-bark-800 selection:bg-vegan-200 selection:text-vegan-900">
        <SelfHealingGuard />
        {children}
      </body>
    </html>
  );
}
