import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'vegan.jp — Vegan Map & Photo Community',
    short_name: 'vegan.jp',
    description: 'Discover and share vegan-friendly restaurants across Japan. No sign-up required.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFDF8',
    theme_color: '#5a9e3f',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
