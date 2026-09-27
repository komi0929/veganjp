import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'vegan.jp \u2014 Vegan Map & Photo Community in Japan',
  description:
    'Discover vegan-friendly restaurants across Japan. Share photos, explore the map, and find plant-based food near you \u2014 no sign-up required.',
  keywords: ['vegan', 'japan', 'tokyo', 'plant-based', 'restaurant', 'map', 'travel', 'food'],
  metadataBase: new URL('https://vegan.jp'),
  openGraph: {
    title: 'vegan.jp \u2014 Vegan Map & Photo Community',
    description: 'Interactive Vegan Map & Shared Photo Albums in Japan',
    url: 'https://vegan.jp',
    siteName: 'vegan.jp',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'vegan.jp',
    description: 'Discover & share vegan food spots across Japan \ud83c\udf31',
  },
  icons: {
    icon: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5a9e3f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-cream-50 text-bark-800">
        {children}
      </body>
    </html>
  );
}
