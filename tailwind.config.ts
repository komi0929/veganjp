import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Refined Botanical Luxury Palette (Inspired by Aesop, Lume, Erewhon)
        botanical: {
          50: '#F4F7F5',
          100: '#E6ECE8',
          200: '#C8D8CE',
          300: '#9DBBA7',
          400: '#6E9A7C',
          500: '#487D59',
          600: '#346344',
          700: '#284E36',
          800: '#1D3B29', // Deep British Racing Forest
          900: '#12261A',
          950: '#0A170F',
        },
        luxe: {
          surface: '#FFFFFF',
          canvas: '#F9FAF9',
          muted: '#F0F2F0',
          border: 'rgba(0, 0, 0, 0.06)',
          borderSubtle: 'rgba(0, 0, 0, 0.03)',
        },
        slate: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'var(--font-jakarta)',
          'sans-serif',
        ],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Modern ultra-fine floating shadows (Linear / Lume style)
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'glass-md': '0 8px 24px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 20px 40px -8px rgba(0, 0, 0, 0.08), 0 6px 16px -4px rgba(0, 0, 0, 0.04)',
        'pill': '0 12px 32px -4px rgba(18, 38, 26, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'photo-card': '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.03)',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
};

export default config;
