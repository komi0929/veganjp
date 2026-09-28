import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'vegan.jp — The Plant-Based Diorama of Japan',
    short_name: 'vegan.jp',
    description: 'Living photo atlas of verified plant-based sanctuaries across Japan. Zero sign-up required.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAF8',
    theme_color: '#1D3B29',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
